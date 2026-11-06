"""Genera narracion (Piper), musica/efectos sintetizados (numpy) y timeline.json."""
import json, subprocess, wave, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent
TOOLS = Path(__import__("os").environ.get("VIDEO_TOOLS", HERE.parent / "tools"))  # carpeta con venv/ (piper) y voices/
PIPER = TOOLS / "venv/bin/piper"
MODEL = TOOLS / "voices/es_MX-claude-high.onnx"
OUT = HERE / "audio"; OUT.mkdir(exist_ok=True)
SR = 22050

# say = lo que lee la voz, cap = lo que se ve en subtitulos
SCENES = [
    dict(id="intro", say="Dieciocho de junio de mil ochocientos quince. En un campo de Bélgica, en un solo día, se decidió el destino de Europa.",
         cap="18 de junio de 1815. En un campo de Bélgica, en un solo día, se decidió el destino de Europa."),
    dict(id="elba", say="Napoleón había escapado de su exilio en la isla de Elba, y volvió al poder en Francia. Ahora necesitaba una victoria.",
         cap="Napoleón había escapado de su exilio en la isla de Elba y volvió al poder en Francia. Ahora necesitaba una victoria."),
    dict(id="rivals", say="Enfrente lo esperaba el duque de Wellington. Y en camino venían los prusianos del mariscal Blúcher.",
         cap="Enfrente lo esperaba el duque de Wellington. Y en camino venían los prusianos del mariscal Blücher."),
    dict(id="rain", say="La noche anterior llovió sin parar. Napoleón esperó hasta casi el mediodía a que el lodo se secara, y perdió horas valiosas.",
         cap="La noche anterior llovió sin parar. Napoleón esperó hasta casi el mediodía a que el lodo se secara... y perdió horas valiosas."),
    dict(id="cavalry", say="Su caballería cargó una y otra vez contra los cuadros británicos. Ninguno se rompió.",
         cap="Su caballería cargó una y otra vez contra los cuadros británicos. Ninguno se rompió."),
    dict(id="prussia", say="Por la tarde, los prusianos aparecieron por el flanco. Napoleón tuvo que pelear en dos frentes.",
         cap="Por la tarde, los prusianos aparecieron por el flanco. Napoleón tuvo que pelear en dos frentes."),
    dict(id="guard", say="Entonces jugó su última carta: la Guardia Imperial. Y en el campo se escuchó un grito que nadie esperaba: ¡la Guardia retrocede!",
         cap="Entonces jugó su última carta: la Guardia Imperial. Y se escuchó un grito que nadie esperaba: ¡la Guardia retrocede!"),
    dict(id="end", say="Cuatro días después, Napoleón abdicó. Murió desterrado en la isla de Santa Elena. Desde entonces, Waterloo significa: derrota final.",
         cap="Cuatro días después, Napoleón abdicó. Murió desterrado en la isla de Santa Elena. Desde entonces, Waterloo significa: derrota final."),
]
LEAD, GAP, TAIL = 0.5, 0.45, 2.2


def read_wav(p):
    with wave.open(str(p)) as w:
        assert w.getframerate() == SR, w.getframerate()
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def tts(text, path):
    subprocess.run([str(PIPER), "-m", str(MODEL), "-f", str(path), "--length-scale", "0.93",
                    "--sentence-silence", "0.25"], input=text.encode(), check=True, capture_output=True)
    return read_wav(path)


def chunks(cap, n=3):
    words = cap.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= n or w[-1] in ".,:!?":
            out.append(" ".join(cur)); cur = []
    if cur: out.append(" ".join(cur))
    return out


voice_tracks, t, timeline = [], LEAD, []
for s in SCENES:
    v = tts(s["say"], OUT / f"{s['id']}.wav")
    # recortar silencio inicial/final
    idx = np.where(np.abs(v) > 0.01)[0]
    v = v[max(idx[0] - 200, 0): idx[-1] + 400]
    dur = len(v) / SR
    cs = chunks(s["cap"])
    weights = np.array([len(c) + 4 for c in cs], float)
    edges = np.concatenate([[0], np.cumsum(weights) / weights.sum()]) * dur
    timeline.append(dict(id=s["id"], start=round(t - (LEAD if not timeline else GAP / 2), 3),
                         vstart=round(t, 3), vdur=round(dur, 3),
                         captions=[dict(text=c, a=round(t + edges[i], 3), b=round(t + edges[i + 1], 3)) for i, c in enumerate(cs)]))
    voice_tracks.append((t, v))
    t += dur + GAP
total = t - GAP + TAIL
for i, sc in enumerate(timeline):
    sc["end"] = round(timeline[i + 1]["start"], 3) if i + 1 < len(timeline) else round(total, 3)
timeline[0]["start"] = 0.0

N = int(total * SR) + 1
tt = np.arange(N) / SR
voice = np.zeros(N, np.float32)
for st, v in voice_tracks:
    a = int(st * SR); voice[a:a + len(v)] += v
rng = np.random.default_rng(7)


def env(n, atk, dec):
    x = np.arange(n) / SR
    return np.minimum(x / atk, 1) * np.exp(-x / dec)


def add(buf, at, sig, g=1.0):
    a = int(at * SR); b = min(N, a + len(sig)); buf[a:b] += sig[: b - a] * g


music = np.zeros(N, np.float32)
# drone en Re menor con un poco de vibrato
for f, g in [(73.42, .16), (110.0, .09), (146.83, .07), (174.61, .045)]:
    music += g * np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.2 * tt))
# pulso de tambor militar (redoble) 100 bpm
beat = 60 / 100
snare = (rng.standard_normal(int(.18 * SR)) * env(int(.18 * SR), .002, .05)).astype(np.float32)
kick = (np.sin(2 * np.pi * 55 * np.arange(int(.4 * SR)) / SR * (1 + 2 * np.exp(-np.arange(int(.4 * SR)) / SR / .03))) * env(int(.4 * SR), .003, .12)).astype(np.float32)
pattern = [0, .5, .75, 1, 2, 2.5, 2.75, 3, 3.25, 3.5, 3.75]
bar = 0.0
while bar < total - TAIL:
    for p in pattern:
        add(music, bar + p * beat, snare, .12 if p % 1 else .2)
    add(music, bar, kick, .45); add(music, bar + 2 * beat, kick, .3)
    bar += 4 * beat


def cannon():
    n = int(1.6 * SR); x = np.arange(n) / SR
    noise = np.convolve(rng.standard_normal(n), np.ones(60) / 60, "same")
    return ((noise * 3 + np.sin(2 * np.pi * 38 * x)) * env(n, .004, .35)).astype(np.float32)


sc = {s["id"]: s for s in timeline}
for sid, offs in {"intro": [0.2, 2.8], "cavalry": [0.3, 1.8, 3.5], "prussia": [0.8], "guard": [0.2, 2.6, 3.0, 3.3]}.items():
    for o in offs:
        add(music, sc[sid]["start"] + o, cannon(), .5)
# lluvia en la escena rain
r = sc["rain"]; a, b = int(r["start"] * SR), int(r["end"] * SR)
rain = np.convolve(rng.standard_normal(b - a), [1, -0.6], "same") * 0.05
fade = np.minimum(1, np.minimum(np.arange(b - a), np.arange(b - a)[::-1]) / (0.5 * SR))
music[a:b] += (rain * fade).astype(np.float32)
# galope en cavalry
c = sc["cavalry"]; hoof = (rng.standard_normal(int(.05 * SR)) * env(int(.05 * SR), .001, .012)).astype(np.float32)
x = c["start"]
while x < c["end"] - .3:
    for o in (0, .09, .18):
        add(music, x + o, hoof, .35)
    x += .42
# fade out final
music *= np.clip((total - tt) / 2.0, 0, 1)
music *= np.clip(tt / 0.8, 0, 1)
# ducking bajo la voz
venv = np.convolve(np.abs(voice), np.ones(2205) / 2205, "same")
duck = 1 - 0.45 * np.clip(venv / 0.05, 0, 1)
mix = voice * 1.0 + music * duck * 0.55
mix /= max(1e-6, np.abs(mix).max()) / 0.9
with wave.open(str(OUT / "mix.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
json.dump(dict(total=round(total, 3), fps=30, scenes=timeline), open(HERE / "timeline.json", "w"), ensure_ascii=False, indent=1)
print("total", round(total, 2), "s")
for s in timeline:
    print(s["id"], s["start"], s["end"], len(s["captions"]))

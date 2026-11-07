"""Narracion: TTS por linea (Kokoro) + alineacion palabra por palabra con faster-whisper.
Uso: python voice.py <carpeta_episodio>   -> audio/voice.wav, words.json
Variables: VIDEO_TOOLS = carpeta con voices/ (kokoro-v1.0.onnx, voices-v1.0.bin)."""
import json, os, re, sys, subprocess, unicodedata, difflib
from pathlib import Path
import numpy as np, soundfile as sf

EP = Path(sys.argv[1]).resolve()
TOOLS = Path(os.environ.get("VIDEO_TOOLS", EP.parent / "tools"))
cfg = json.load(open(EP / "script.json"))
SR = 24000
(EP / "audio").mkdir(exist_ok=True)


def norm(w):
    w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", w)


def tts_kokoro(text, v):
    from kokoro_onnx import Kokoro
    global _k
    if "_k" not in globals():
        _k = Kokoro(str(TOOLS / "voices/kokoro-v1.0.onnx"), str(TOOLS / "voices/voices-v1.0.bin"))
    a, sr = _k.create(text, voice=v["voice"], speed=v.get("speed", 1.0), lang=v.get("lang", "en-us"))
    assert sr == SR
    return a.astype(np.float32)


def to16(a):
    import math
    n = int(len(a) * 16000 / SR)
    return np.interp(np.arange(n) * SR / 16000, np.arange(len(a)), a).astype(np.float32)


from faster_whisper import WhisperModel
model = WhisperModel(os.environ.get("WHISPER_MODEL", "base.en"), compute_type="int8")

t = cfg.get("lead", 0.25)
voice, lines, words = [], [], []
for ln in cfg["lines"]:
    a = tts_kokoro(ln["say"], cfg["voice"])
    idx = np.where(np.abs(a) > 0.008)[0]
    a = a[max(idx[0] - 240, 0): idx[-1] + 480]
    segs, _ = model.transcribe(to16(a), word_timestamps=True, language="en")
    ww = [w for s in segs for w in s.words]
    capw = ln["cap"].split()
    A = [norm(w) for w in capw]; B = [norm(w.word) for w in ww]
    times = [None] * len(capw)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if tag in ("equal", "replace"):
            for k in range(i2 - i1):
                j = j1 + min(k * max(1, j2 - j1) // max(1, i2 - i1), j2 - j1 - 1) if j2 > j1 else None
                if j is not None:
                    times[i1 + k] = (ww[j].start, ww[j].end, ww[j].probability)
    # rellenar huecos interpolando
    dur = len(a) / SR
    for i in range(len(capw)):
        if times[i] is None:
            prev = next((times[k][1] for k in range(i - 1, -1, -1) if times[k]), 0.0)
            nxt = next((times[k][0] for k in range(i + 1, len(capw)) if times[k]), dur)
            times[i] = (prev, (prev + nxt) / 2, 0.0)
    for w, (s, e, p) in zip(capw, times):
        words.append(dict(w=w, line=ln["id"], a=round(t + s, 3), b=round(t + e, 3), p=round(p, 3)))
    lines.append(dict(id=ln["id"], a=round(t, 3), b=round(t + dur, 3), heard=" ".join(x.word.strip() for x in ww)))
    voice.append((t, a))
    t += dur + ln.get("pause", 0.3)
total = t + cfg.get("tail", 2.0)
buf = np.zeros(int(total * SR) + 1, np.float32)
for st, a in voice:
    i = int(st * SR); buf[i:i + len(a)] += a
sf.write(EP / "audio/voice.wav", buf, SR)
json.dump(dict(total=round(total, 3), fps=30, lines=lines, words=words), open(EP / "words.json", "w"), indent=1, ensure_ascii=False)
print("total", round(total, 2), "s,", len(words), "palabras")
for l in lines:
    print(f"{l['id']:8s} {l['a']:6.2f}-{l['b']:6.2f}  heard: {l['heard']}")
low = [w for w in words if w["p"] < 0.5]
print("palabras con baja confianza:", [(w["w"], w["p"]) for w in low])

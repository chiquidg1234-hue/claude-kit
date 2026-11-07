"""Sonido v2: partitura con samples CC0 (VSCO 2 CE) + efectos sintetizados en código, en el reloj de la imagen.
Uso: python score.py <episodio>  (lee export.json, words.json, audio/voice.wav)
Variables: VSCO = carpeta de VSCO-2-CE (CC0 1.0, github.com/sgossner/VSCO-2-CE).
Salida: audio/music.wav, audio/sfx.wav, audio/mix_pre.wav, audio/master.wav (-14 LUFS, TP -1.5 dBTP), audio/CREDITS.txt"""
import json, os, re, sys, glob, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt

EP = Path(sys.argv[1]).resolve(); VS = Path(os.environ.get("VSCO", "/home/user/sgossner/vsco-2-ce"))
SR = 48000
X = json.load(open(EP / "export.json")); TOTAL = X["total"]; N = int(TOTAL * SR) + SR
rng = np.random.default_rng(1815)
music = np.zeros((N, 2), np.float32); sfx = np.zeros((N, 2), np.float32)

# ---------- utilidades ----------
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x, axis=0).astype(np.float32)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x, axis=0).astype(np.float32)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x, axis=0).astype(np.float32)
def env(n, atk, dec):
    x = np.arange(n) / SR; return (np.minimum(x / max(atk, 1e-4), 1) * np.exp(-x / dec)).astype(np.float32)
def noise(n): return rng.standard_normal(n).astype(np.float32)
def st(x, pan=0.0):
    x = np.asarray(x, np.float32)
    if x.ndim == 2: return x
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def add(buf, t, x, g=1.0, pan=0.0):
    x = st(x, pan) * g; a = int(t * SR)
    if a < 0: x = x[-a:]; a = 0
    b = min(len(buf), a + len(x)); buf[a:b] += x[: b - a]
def fades(x, fi=0.01, fo=0.05):
    n = len(x); a = min(n, int(fi * SR)); b = min(n, int(fo * SR)); w = np.ones(n, np.float32)
    w[:a] = np.linspace(0, 1, a); w[n - b:] *= np.linspace(1, 0, b); return x * (w[:, None] if x.ndim == 2 else w)

# ---------- samples ----------
_cache = {}
def load(p):
    if p in _cache: return _cache[p]
    a, sr = sf.read(p, dtype="float32", always_2d=True)
    if a.shape[1] == 1: a = np.repeat(a, 2, 1)
    if sr != SR:
        n = int(len(a) * SR / sr); idx = np.arange(n) * sr / SR
        a = np.stack([np.interp(idx, np.arange(len(a)), a[:, c]) for c in range(2)], 1).astype(np.float32)
    _cache[p] = a; return a
PITCH_CACHE = EP / "audio/pitch_cache.json"; pc = json.load(open(PITCH_CACHE)) if PITCH_CACHE.exists() else {}
NOTES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def named_midi(p):
    # VSCO nombra una octava abajo (comprobado por análisis: +12 consistente en 8 instrumentos)
    m = re.search(r'_([A-G]#?)(\d)_', Path(p).name); return 12 * (int(m.group(2)) + 1) + NOTES[m.group(1)] + 12 if m else None
def detect_midi(p):
    nm = named_midi(p)
    if nm is not None: return nm
    if p in pc: return pc[p]
    a = load(p).mean(1); seg = a[int(.12 * SR): int(.7 * SR)]
    if len(seg) < 4096: seg = a[: int(.5 * SR)]
    seg = seg * np.hanning(len(seg)); F = np.abs(np.fft.rfft(seg, 1 << 17)); f = np.fft.rfftfreq(1 << 17, 1 / SR)
    hps = F.copy()
    for h in (2, 3, 4): d = F[::h]; hps[: len(d)] *= d
    m = (f > 25) & (f < 1100); f0 = f[m][np.argmax(hps[m])]
    pc[p] = float(69 + 12 * np.log2(f0 / 440)); return pc[p]
class Sampler:
    def __init__(self, folder, vel_re=r"_v(\d)", rel=0.3):
        self.files = sorted(glob.glob(str(VS / folder / "*.wav"))); assert self.files, folder; self.rel = rel
        self.items = []
        for p in self.files:
            m = re.search(vel_re, Path(p).name); self.items.append((detect_midi(p), int(m.group(1)) if m else 1, p))
        self.vmax = max(v for _, v, _ in self.items)
    def note(self, buf, t, midi, dur, vel=.7, g=1.0, pan=0.0):
        want = max(1, round(vel * self.vmax))
        cands = sorted(self.items, key=lambda it: (abs(it[0] - midi) + 0.3 * abs(it[1] - want)))
        m0, _, p = cands[int(rng.integers(0, min(2, len(cands))))] if abs(cands[0][0] - midi) < .5 else cands[0]
        a = load(p); ratio = 2 ** ((midi - m0) / 12)
        n = int(min(len(a) / ratio, (dur + self.rel) * SR)); idx = np.arange(n) * ratio
        y = np.stack([np.interp(idx, np.arange(len(a)), a[:, c]) for c in range(2)], 1).astype(np.float32)
        y = fades(y, 0.004, self.rel); add(buf, t, y, g, pan)
SAM = dict(
    cello_sp=Sampler("Strings/Cello Section/spic", r"_v(\d)", .08), cello_sus=Sampler("Strings/Cello Section/susvib", r"_v(\d)", .5),
    cello_trem=Sampler("Strings/Cello Section/trem", r"_v(\d)", .4), vln_sus=Sampler("Strings/Violin Section/susVib", r"_v(\d)", .6),
    vln_trem=Sampler("Strings/Violin Section/Trem", r"_v(\d)", .5), horn=Sampler("Brass/F Horn/sus", r"_v(\d)", .5),
    tbn=Sampler("Brass/Tenor Trombone/sus", r"_v(\d)", .45), tuba=Sampler("Brass/Tuba/sus", r"_v(\d)", .45))
json.dump(pc, open(PITCH_CACHE, "w"))
TIMP = sorted(glob.glob(str(VS / "Percussion/Timpani/Timpani*_Hit_v*.wav"))); TROLL = sorted(glob.glob(str(VS / "Percussion/Timpani/Rolls/*.wav")))
BD = sorted(glob.glob(str(VS / "VSCO 1 Percussion/drums/bass/bdrum_f*.wav"))) or sorted(glob.glob(str(VS / "VSCO 1 Percussion/drums/bass/*.wav")))
SN = sorted(glob.glob(str(VS / "VSCO 1 Percussion/drums/snare/drum3_marching/*.wav"))) or sorted(glob.glob(str(VS / "VSCO 1 Percussion/drums/snare/**/*.wav"), recursive=True))
def timp(buf, t, g=1.0, k=None):
    p = TIMP[k if k is not None else int(rng.integers(len(TIMP)))]; add(buf, t, fades(load(p), .001, .3), g)
def troll(buf, t, dur, g=1.0):
    a = load(TROLL[-1]); y = np.concatenate([a] * (1 + int(dur * SR / len(a))))[: int(dur * SR)]
    y = y * np.linspace(.15, 1, len(y))[:, None]; add(buf, t, fades(y, .05, .05), g)
def bdrum(buf, t, g=1.0): add(buf, t, fades(load(BD[int(rng.integers(len(BD)))]), .001, .2), g)
def snare(buf, t, g=1.0, pan=0): add(buf, t, fades(load(SN[int(rng.integers(len(SN)))]), .001, .1), g, pan)

# ---------- partitura (Re menor, 112 BPM) ----------
BPM = 112; B = 60 / BPM; E8 = B / 2
D = 50  # D3
CH = {"Dm": [0, 3, 7], "Bb": [-4, 0, 3], "F": [3, 7, 10], "A": [-5, -1, 2], "Gm": [-7, -4, 0], "C": [-2, 2, 5]}
PROG = ["Dm", "Bb", "F", "A"]
def chord_at(t, prog=PROG): return prog[int(t / (4 * B)) % len(prog)]
def sec(kind): return [m for m in X["music"] if m["kind"] == kind]
def ostinato(a, b, vel=.6, g=.5, sixteenths=False):
    step = E8 / 2 if sixteenths else E8; t = a; k = 0
    while t < b - .05:
        c = chord_at(t); root = D - 12 + CH[c][0] % 12 - (12 if CH[c][0] % 12 > 5 else 0)
        pat = [0, 0, 12, 0, 7, 0, 12, 7]; SAM["cello_sp"].note(music, t, root + pat[k % 8], step * .9, vel + (.15 if k % 4 == 0 else 0), g, -.25); t += step; k += 1
def pads(a, b, inst, octave=0, vel=.5, g=.4, voicing=(0, 1, 2), pan=0.0):
    t = a
    while t < b - .1:
        bar_end = (np.floor(t / (4 * B) + 1e-6) + 1) * 4 * B; bar_end = min(b, bar_end if bar_end - t > 1e-3 else bar_end + 4 * B); c = chord_at(t + 1e-4)
        for v in voicing: SAM[inst].note(music, t, D + octave + CH[c][v], bar_end - t, vel, g / len(voicing), pan)
        t = bar_end
def brass_stab(t, c="Dm", g=1.0, dur=.45):
    for inst, oc in (("tbn", -12), ("horn", 0), ("tuba", -24)):
        for v in (0, 1, 2): SAM[inst].note(music, t, D + oc + CH[c][v], dur, 1.0, g / 3, 0)
def march_snare(a, b, g=.35):
    t = a; k = 0; pat = [1, 0, .5, .5, 1, 0, .7, .4]
    while t < b - .05:
        if pat[k % 8]: snare(music, t, g * pat[k % 8], .2)
        t += E8 / 1 if k % 2 == 0 else E8; k += 1

for m in X["music"]:
    a, b, k = m["a"], m["b"], m["kind"]
    if k == "hook":
        brass_stab(a + .3, "Dm", .9, .7); timp(music, a + .3, 1.0); bdrum(music, a + .3, .8)
        ostinato(a + .3, b, .75, .55, True); pads(a + .3, b, "tbn", -12, .7, .5, (0, 2))
        timp(music, a + 2.25, .8); brass_stab(a + 2.25, "Bb", .6, .5)
    elif k == "build":
        pads(a, b, "vln_sus", 12, .55, .6); pads(a + 3 * B, b, "cello_sus", -12, .6, .7, (0,))
        ostinato(a + 4 * B, b, .65, .8); pads(a + 8 * B, b, "horn", 0, .6, .6, (0, 2))
        for t in np.arange(a, b, 4 * B): timp(music, t, .45)
    elif k == "tension":
        pads(a, b, "vln_trem", 12, .5, .35); pads(a, b, "cello_trem", -12, .5, .35, (0,)); troll(music, b - 1.8, 1.8, .7)
    elif k == "battle":
        ostinato(a, b, .8, .55, True); pads(a, b, "tbn", -12, .8, .55, (0, 1, 2)); pads(a, b, "tuba", -24, .8, .45, (0,)); pads(a + 4 * B, b, "horn", 0, .8, .4, (0, 1, 2))
        pads(a, b, "vln_trem", 12, .7, .3); march_snare(a, b, .32)
        for t in np.arange(a, b, 2 * B): timp(music, t, .55)
        troll(music, b - 1.2, 1.2, .5); brass_stab(b - .05, "A", .4, .35)
    elif k == "silence":
        SAM["vln_trem"].note(music, a + .3, D + 24 + 7, b - a - .4, .25, .12, 0)  # casi silencio: un hilo agudo
    elif k == "payoff":
        brass_stab(a, "Dm", 1.6, .6); timp(music, a, 1.5); bdrum(music, a, 1.4)
        pads(a + .5, b, "tbn", -12, .7, .45, (0, 2)); pads(a + .5, b, "cello_sus", -12, .7, .4, (0,)); pads(a + .5, b, "vln_sus", 12, .6, .3)
    elif k == "sad":
        for i, c in enumerate(["Dm", "Bb", "Gm", "A"]):
            t = a + i * (b - a) / 4; d = (b - a) / 4
            for v in (0, 1, 2): SAM["cello_sus"].note(music, t, D - 12 + CH[c][v], d, .55, .4, 0)
            SAM["horn"].note(music, t, D + CH[c][2], d, .5, .35, .2)
    elif k == "question":
        pads(a, b, "vln_trem", 12, .55, .32); SAM["cello_trem"].note(music, a, D - 12, b - a, .6, .3); troll(music, b - 2.2, 2.0, .9)
        timp(music, b - .2, 1.0); bdrum(music, b - .2, .8)

# ---------- efectos sintetizados ----------
def cannon(dist=0):
    n = int(2.8 * SR); x = np.arange(n) / SR
    crack = hp(noise(n), 1500) * env(n, .0005, .012) * (0.9 if not dist else .15)
    boom = (np.sin(2 * np.pi * (45 + 60 * np.exp(-x / .04)) * x) * env(n, .002, .25)).astype(np.float32)
    body = lp(noise(n), 400) * env(n, .003, .35) * 2.5
    tail = lp(noise(n), 160 if not dist else 120) * env(n, .05, .9) * 2.2
    y = crack + boom * (1 if not dist else .6) + body * (1 if not dist else .5) + tail
    if dist: y = lp(y, 900)
    return y
def musket(dist=0):
    n = int(.9 * SR); y = hp(noise(n), 900) * env(n, .0003, .01) + lp(noise(n), 900) * env(n, .001, .09) * 1.4 + lp(noise(n), 250) * env(n, .01, .3) * .8
    return lp(y, 2500) if dist else y
def volley(buf, t, g, pan, count=26, spread=.35, dist=0):
    for i in range(count): add(buf, t + rng.random() * spread, musket(dist), g * (.25 + .2 * rng.random()), float(np.clip(pan + rng.normal(0, .5), -1, 1)))
def whoosh(dur=.45, up=True):
    n = int(dur * SR); x = np.arange(n) / n; y = noise(n); out = np.zeros(n, np.float32); hop = 512
    for i in range(0, n, hop):
        f = 300 + 3200 * (x[i] if up else 1 - x[i]) ** 1.5; seg = y[max(0, i - 2048): i + hop]
        out[i: i + hop] = bp(seg, f * .7, min(f * 1.4, 20000))[-len(out[i: i + hop]):]
    return out * np.sin(np.pi * x) ** 2 * 1.6
def riser(dur):
    n = int(dur * SR); x = np.arange(n) / SR; k = x / dur
    s = np.sin(2 * np.pi * np.cumsum(100 + 900 * k ** 2) / SR) * .3; return ((hp(noise(n), 2000) * .6 + s) * k ** 2.5).astype(np.float32)
def hit(sub=True):
    n = int(1.4 * SR); x = np.arange(n) / SR
    y = np.sin(2 * np.pi * (38 + 90 * np.exp(-x / .03)) * x) * env(n, .001, .4) * 1.4 + lp(noise(n), 1800) * env(n, .001, .06)
    return y.astype(np.float32)
def loop_noise(dur, lo, hi, mod_hz=.3, depth=.5):
    n = int(dur * SR); y = bp(noise(n), lo, hi); m = 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * mod_hz * np.arange(n) / SR + rng.random() * 6)); return (y * m).astype(np.float32)
def steps(buf, t, dur, g, rate=1.9, men=24, run=False):
    for k in range(men):
        ph = rng.random() / rate; tt = t + ph
        while tt < t + dur:
            n = int(.08 * SR); s = bp(noise(n), 200, 2500) * env(n, .001, .02 if not run else .015); add(buf, tt + rng.normal(0, .015), s, g * .16, float(rng.uniform(-.8, .8))); tt += 1 / rate * (0.75 if run else 1)
def hooves(buf, t, dur, g, horses=10):
    for h in range(horses):
        tt = t + rng.random() * .4; pan = float(rng.uniform(-.9, .9))
        while tt < t + dur:
            for o in (0, .09, .17):
                n = int(.06 * SR); s = lp(noise(n), 700) * env(n, .001, .015) * 2 + bp(noise(n), 1500, 4000) * env(n, .0005, .005) * .5; add(buf, tt + o, s, g * .18, pan)
            tt += .38 + rng.normal(0, .01)
    add(buf, t, lp(noise(int(dur * SR)), 120) * 1.5, g * .4)
def crowd(dur, excite=1.0, panic=False):
    n = int(dur * SR); x = np.arange(n) / SR; y = np.zeros(n, np.float32)
    for v in range(40):
        f0 = rng.uniform(110, 260) * (1.3 if panic else 1); vib = np.sin(2 * np.pi * rng.uniform(4, 7) * x) * 4
        ph = 2 * np.pi * np.cumsum(f0 + vib + (np.sin(2 * np.pi * .7 * x + v) * 25 if panic else 0)) / SR
        src = np.sign(np.sin(ph)).astype(np.float32) * .3
        on = np.clip(np.sin(np.pi * np.clip((x - rng.uniform(0, .4)) / max(.3, dur * rng.uniform(.5, 1)), 0, 1)), 0, 1)
        y += (bp(src, 600, 1100) + bp(src, 1100, 2400) * .6) * on
    return (y / 40 * 3 * excite).astype(np.float32)
def thunder():
    n = int(4 * SR); y = lp(noise(n), 300) * env(n, .02, 1.2) * 3 + hp(noise(n), 2000) * env(n, .001, .05) * .8
    return (y * (1 + .5 * np.sin(2 * np.pi * 3 * np.arange(n) / SR))).astype(np.float32)
def chirp():
    n = int(.12 * SR); x = np.arange(n) / SR; f = rng.uniform(2500, 4500) + 1800 * np.sin(np.pi * x / .12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / .12) ** 2 * .3).astype(np.float32)
def heartbeat(buf, t, dur, g):
    tt = t
    while tt < t + dur:
        for o, a in ((0, 1), (.22, .7)): n = int(.25 * SR); x = np.arange(n) / SR; add(buf, tt + o, np.sin(2 * np.pi * 48 * x) * env(n, .005, .07) * a, g)
        tt += .85

for c in X["cues"]:
    t, ty, g, pan, end = c["t"], c["type"], c["g"], c["pan"], c["end"]; dur = max(.3, end - t)
    if ty == "cannon": add(sfx, t, cannon(), g * .9, pan)
    elif ty == "cannon_far": add(sfx, t, cannon(1), g * .5, pan)
    elif ty == "volley": volley(sfx, t, g, pan)
    elif ty == "volley_far": volley(sfx, t, g * .6, pan, 18, .6, 1)
    elif ty == "volley_big": volley(sfx, t, g * .5, pan, 40, .3); add(sfx, t, hit(), g * .25)
    elif ty == "battle_amb":
        add(sfx, t, fades(loop_noise(dur, 60, 400, .2, .4) * 1.2, .2, .3), g)
        for k in range(int(dur * 1.5)): add(sfx, t + rng.random() * dur, cannon(1), g * .15, float(rng.uniform(-1, 1)))
    elif ty == "whoosh": w = whoosh(); add(sfx, t - .22, w, g * .55, pan)
    elif ty == "riser_short": add(sfx, t, riser(1.2), g * .5)
    elif ty == "riser_long": add(sfx, t, riser(min(dur, 3.0)), g * .5)
    elif ty == "title_hit": add(sfx, t, hit(), g * .25, pan)
    elif ty == "hit": add(sfx, t, hit(), g * .6, pan)
    elif ty == "boom_soft": add(sfx, t, lp(hit(), 300), g * .6)
    elif ty == "impact": add(sfx, t, hit(), g); add(sfx, t, cannon(), g * .5)
    elif ty == "payoff": add(sfx, t, hit(), g * 2.0); add(sfx, t, cannon(), g * .9); add(sfx, t, lp(noise(int(1.5 * SR)), 200) * env(int(1.5 * SR), .001, .6) * 2, g * .8)
    elif ty == "birds":
        for k in range(int(dur * 3)): add(sfx, t + rng.random() * dur, chirp(), g * .5, float(rng.uniform(-.8, .8)))
    elif ty == "march": steps(sfx, t, dur, g)
    elif ty == "march_run": steps(sfx, t, dur, g, 3.2, 28, True)
    elif ty == "drums": pass  # el redoble ya va en la partitura (march_snare)
    elif ty in ("crowd_cheer", "charge_yell"): add(sfx, t, fades(crowd(min(dur, 2.2), .8), .05, .5), g * .5, pan)
    elif ty == "crowd_panic": add(sfx, t, fades(crowd(min(dur, 2.4), 1.0, True), .05, .6), g * .5, pan)
    elif ty == "horse_snort": add(sfx, t, bp(noise(int(.5 * SR)), 300, 1500) * env(int(.5 * SR), .03, .12) * 1.5, g * .5, pan)
    elif ty == "horse_neigh": add(sfx, t, bp(noise(int(.3 * SR)), 200, 900) * env(int(.3 * SR), .01, .08), g * .4, pan)
    elif ty == "rain": add(sfx, t, fades(hp(noise(int(dur * SR)), 1200) * .18 + lp(noise(int(dur * SR)), 500) * .25, .3, .3), g)
    elif ty == "thunder": add(sfx, t, thunder(), g * .5)
    elif ty == "mud_push":
        for k in range(int(dur * 2)): n = int(.4 * SR); add(sfx, t + k * .5 + rng.random() * .1, lp(noise(n), 500) * env(n, .03, .1) * 1.5, g * .5, float(rng.uniform(-.5, .5)))
    elif ty in ("clock", "tick_fast"):
        step = .5 if ty == "clock" else .12; tt = t
        while tt < end: n = int(.03 * SR); add(sfx, tt, hp(noise(n), 3000) * env(n, .0005, .004) * 2, g * .5, .3); tt += step
    elif ty == "hooves": hooves(sfx, t, dur, g)
    elif ty == "wind": add(sfx, t, fades(loop_noise(dur, 200, 1200, .25, .7) * .9, .4, .4), g)
    elif ty == "heartbeat": heartbeat(sfx, t, dur, g * .9)
    elif ty == "waves": add(sfx, t, fades(loop_noise(dur, 100, 900, .12, .85) * 1.2, .5, .5), g)
    else: print("cue sin sintetizador:", ty)

# ---------- reverb, ducking, mezcla ----------
def reverb(x, secs=1.4, wet=.18):
    n = int(secs * SR); ir = np.stack([noise(n) * env(n, .005, secs / 5), noise(n) * env(n, .005, secs / 5)], 1); ir = lp(ir, 5000) / np.sqrt(np.sum(ir ** 2) / 2)
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1).astype(np.float32) * wet
music = reverb(music, 2.2, .22); sfx = reverb(sfx, 1.2, .12)
v, vsr = sf.read(EP / "audio/voice.wav", dtype="float32")
v = np.interp(np.arange(int(len(v) * SR / vsr)) * vsr / SR, np.arange(len(v)), v).astype(np.float32)
voice = np.zeros((N, 2), np.float32); voice[: len(v)] = v[:N, None]
ve = np.convolve(np.abs(voice[:, 0]), np.ones(int(.08 * SR)) / int(.08 * SR), "same"); ve = np.clip(ve / .04, 0, 1)
# suavizado tipo compresor (ataque rápido, release lento)
sm = np.zeros_like(ve); a_, r_ = np.exp(-1 / (.03 * SR)), np.exp(-1 / (.35 * SR)); s = 0.0
for i in range(0, len(ve), 64):
    x = ve[i]; s = (a_ if x > s else r_) ** 64 * s + (1 - (a_ if x > s else r_) ** 64) * x; sm[i: i + 64] = s
music_d = music * (1 - .6 * sm)[:, None]; sfx_d = sfx * (1 - .6 * sm)[:, None]
def norm(x, target_rms): r = np.sqrt(np.mean(x ** 2) + 1e-12); return x * (target_rms / r)
mix = voice * 1.0 + norm(music_d, .045) + norm(sfx_d, .036)
mix[int((TOTAL - .05) * SR):] *= 0
(EP / "audio").mkdir(exist_ok=True)
for name, buf in (("music", music), ("sfx", sfx), ("mix_pre", mix)):
    sf.write(EP / f"audio/{name}.wav", (buf / max(1.0, np.abs(buf).max() / .98))[: int(TOTAL * SR)], SR, subtype="PCM_24")
# master a -14 LUFS / -1.5 dBTP (loudnorm de ffmpeg en dos pasadas)
pre = str(EP / "audio/mix_pre.wav"); out = str(EP / "audio/master.wav")
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex("{"): r.rindex("}") + 1])
af = f"loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", pre, "-af", af, "-ar", "48000", out], check=True)
open(EP / "audio/CREDITS.txt", "w").write("Samples (CC0 1.0): Versilian Studios VSCO 2 CE (github.com/sgossner/VSCO-2-CE) — cellos, violines, trompa, trombón, tuba, timbales, bombo y caja.\n"
    "Efectos (cañones, mosquetes, cascos, pasos, multitud, viento, lluvia, olas, latidos, whooshes, risers, golpes): sintetizados en código (score.py).\n"
    "Voz: Kokoro-82M (Apache-2.0) vía kokoro-onnx (MIT), voz am_michael.\n")
print("ok", TOTAL, "s; pre:", m["input_i"], "LUFS")

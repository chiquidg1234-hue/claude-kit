"""Revisión medida (no se puede escuchar): python review.py <episodio> [archivo.wav|mp4] [t0 t1]
- Whisper sobre la MEZCLA FINAL: ¿se entiende la voz con música y efectos? (diferencia vs guion)
- Subtítulos vs lo que Whisper oye en la mezcla: desfase medio y máximo por palabra
- Loudness integrado (LUFS), true peak, LRA; RMS de música por sección; silencio antes del clímax
- Ritmo: cortes/min, plano más largo (>4 s = 'dead beat'), zonas seguras declaradas"""
import json, re, sys, subprocess, difflib, unicodedata
from pathlib import Path
import numpy as np

EP = Path(sys.argv[1]).resolve(); src = sys.argv[2] if len(sys.argv) > 2 else str(EP / "audio/master.wav")
t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0; t1 = float(sys.argv[4]) if len(sys.argv) > 4 else 1e9
W = json.load(open(EP / "words.json")); X = json.load(open(EP / "export.json"))
def norm(w): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode().lower())
def pcm(path, sr=16000, ch=1):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", str(ch), "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
rep = {}
# 1) loudness
r = subprocess.run(["ffmpeg", "-nostats", "-i", src, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
s = r[r.rindex("Summary"):]
rep["LUFS_I"] = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)); rep["LRA"] = float(re.search(r"LRA:\s+([\d.]+) LU", s).group(1))
rep["true_peak_dBFS"] = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
# 2) inteligibilidad + sincronía de subtítulos
from faster_whisper import WhisperModel
a = pcm(src); a = a[int(t0 * 16000): int(min(t1, len(a) / 16000) * 16000)]
m = WhisperModel("small.en", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, language="en", vad_filter=False)
heard = [w for sg in segs for w in sg.words]
ref = [w for w in W["words"] if t0 - .2 <= w["a"] < t1]
A = [norm(w["w"]) for w in ref]; Bw = [norm(w.word) for w in heard]
sm = difflib.SequenceMatcher(None, A, Bw, autojunk=False)
rep["word_match_ratio"] = round(sm.ratio(), 3)
offs = []
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): offs.append(heard[j1 + k].start + t0 - ref[i1 + k]["a"])
offs = np.array(offs)
rep["caption_offset_mean_ms"] = round(float(np.mean(offs)) * 1000) if len(offs) else None
rep["caption_offset_p95_ms"] = round(float(np.percentile(np.abs(offs), 95)) * 1000) if len(offs) else None
rep["missing_or_wrong_words"] = [(" ".join(A[i1:i2]), " ".join(Bw[j1:j2])) for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != "equal"][:12]
rep["heard"] = " ".join(w.word.strip() for w in heard)
# 3) música por sección y silencio antes del clímax
mus = EP / "audio/music.wav"
if mus.exists():
    mu = pcm(str(mus), 8000)
    def db(x): return round(float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)), 1)
    rep["music_rms_db_by_section"] = {f'{s_["kind"]}@{s_["a"]:.1f}': db(mu[int(s_["a"] * 8000): int(s_["b"] * 8000)]) for s_ in X["music"] if s_["a"] < t1}
    full = pcm(src, 8000); win = 800
    e = np.array([np.sqrt(np.mean(full[i:i + win] ** 2)) for i in range(0, len(full) - win, win)])
    loud = int(np.argmax(e)); rep["loudest_100ms_at_s"] = round(loud * .1 + t0 * 0, 1)
# 4) ritmo
sh = [s_ for s_ in X["shots"] if s_["at"] < t1]
lens = [s_["end"] - s_["at"] for s_ in sh]
rep["cuts_per_min"] = round(len(sh) / min(t1, X["total"]) * 60, 1); rep["longest_shot_s"] = round(max(lens), 2)
rep["dead_beats(>4s)"] = [s_["id"] for s_, l in zip(sh, lens) if l > 4.0]
print(json.dumps(rep, indent=1, ensure_ascii=False))

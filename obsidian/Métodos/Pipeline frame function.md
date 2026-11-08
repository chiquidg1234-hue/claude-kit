---
tags: [metodo, tecnico]
---
# Pipeline "frame function"

Claude no genera píxeles: escribe código que los pinta.
1. Una página three.js expone `window.seek(t)`: todo es función de `t` (determinista).
2. Chromium headless (Playwright) pinta cada frame → JPG.
3. ffmpeg une frames + audio → MP4.
4. Imagen y sonido comparten reloj: los efectos se exportan como cues (`window.EXPORT`).

En la skill `video-maniqui` (repo claude-kit, `plugins/mi-kit/skills/video-maniqui`):
- `motor/engine.js`: maniquíes instanciados (900+), caballos, cañones, humo, post-proceso.
- `motor/index.html`: reproductor narrado. `motor/whatif.html`: reproductor what-if (contador + frases + tarjeta final).
- `tools/render.mjs` (test/export/full), `tools/run_all.sh`, `tools/score.py` (música+efectos), `tools/review.py`.

Velocidad: ~0.7 frames/s con GPU por software (≈40 min por 55 s). Con GPU real, mucho más rápido.
Ver [[Revisión medida]], [[Errores y lecciones]].

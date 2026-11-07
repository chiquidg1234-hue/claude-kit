---
name: video-maniqui
description: Hace shorts verticales (TikTok/Reels/Shorts) de historia o explicaciones con maniquíes de madera 3D, narración en inglés, música orquestal CC0, efectos en capas y subtítulos palabra por palabra, solo con herramientas gratis. Úsalo cuando pidan "video tipo maniquí", "video de historia animado", "video faceless" o un short explicativo con muñecos 3D, sobre cualquier tema.
---
# Video maniquí v0.3

Claude no genera píxeles: escribe código que los pinta. `motor/index.html` expone `window.seek(t)`;
Chromium headless pinta cada frame; ffmpeg une frames + audio. Todo es función de `t` (determinista),
así que imagen y sonido comparten el mismo reloj: **la narración es el reloj**.

```
motor/engine.js      three.js: maniquíes instanciados (900+), caballos, cañones, banderas, humo/chispas,
                     cielo, post-proceso (DOF, bloom, etalonaje, grano, whip-blur), shake y punch de cámara
motor/index.html     reproductor genérico: subtítulos palabra a palabra, títulos, etiquetas, flecha, pregunta final
tools/voice.py       TTS Kokoro por línea + alineación palabra por palabra con faster-whisper → words.json
tools/render.mjs     test (frames sueltos) | export (planos + cues de sonido) | full (frames)
tools/run_all.sh     render completo (reanudable: salta frames existentes)
tools/score.py       partitura con samples CC0 + efectos sintetizados + ducking + master −14 LUFS
tools/review.py      revisión medida: Whisper sobre la mezcla, sync de subtítulos, LUFS/TP, ritmo
episodios/<nombre>/  script.json (guion) + episode.js (planos) — ejemplo completo: episodios/waterloo
```

## Instalar (una vez)
`bash setup.sh ~/.video-maniqui` → instala three/fonts/playwright (versiones fijas), el venv de Python
(`requirements.txt`), la voz Kokoro v1.0 y ~700 MB de samples VSCO 2 CE (solo las carpetas usadas).
Necesita node 18+, python 3.11+, ffmpeg, git y espeak-ng. Luego: `export VIDEO_TOOLS=~/.video-maniqui VSCO=~/.video-maniqui/vsco-2-ce`.

## Hacer un episodio
1. `tools/new_episode.sh <nombre>` (copia `_plantilla`).
2. **Guion** (`script.json`): 8–12 líneas, 45–60 s. `say` = lo que se pronuncia (números en letras, nombres
   escritos como suenan: "Blooker" para Blücher), `cap` = subtítulo. Línea 1 = gancho con una cifra; la última =
   pregunta con dos bandos reales (genera comentarios). **Verifica cada dato en 2 fuentes** y suaviza lo dudoso.
3. `python tools/voice.py episodios/<nombre>` → mira la lista de "baja confianza" y reescribe esas palabras.
4. **Planos** (`episode.js`): un plano cada 1.5–3 s anclado a una palabra con `wt(línea, 'palabra')`.
   Cada plano: `look` (luz), `trans` (`cut`/`whip`/`flash`/`smash`), `sfx` (cues en el mismo reloj) y `fn(t,d,T)`.
   Define también `MUSIC` (secciones), `TITLES`, `CTA`, `KEY`.
5. `node tools/render.mjs episodios/<nombre> export` y `test t1 t2 …` (un frame por plano) → hoja de contacto.
6. `python tools/score.py episodios/<nombre>` y `python tools/review.py episodios/<nombre>`.
7. Corrige y repite 5–6. Luego `tools/run_all.sh episodios/<nombre> 0 <frames> 2` y une:
   `ffmpeg -framerate 30 -i frames/f%05d.jpg -i audio/master.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -c:a aac -b:a 192k -shortest -movflags +faststart video.mp4`

## Reglas aprendidas (medidas, no a ojo)
- **Frame 0 con imagen y texto**, nunca negro ni un fogonazo a cámara (quema la imagen).
- **Ritmo:** 25–32 cortes/min, ningún plano > 4 s (`review.py` → `dead_beats`).
- **Encuadre vertical:** a 50 m solo caben ~20 m de ancho. Primeros planos a 2–3 m; vistas laterales no caben.
  Las alturas de cámara son **relativas al terreno** bajo el objetivo (el motor lo suma).
- **Lo importante ≥ 100 px**; contenido en x 60–940, y 250–1500; subtítulos ≥ 80 px con borde.
- **Sonido:** un efecto por acción; whoosh centrado en el corte; nada fuerte encima de una palabra clave
  (un impacto sobre "flank" hizo que Whisper oyera "flag"): pon el golpe justo **después** de la palabra.
  Silencio (≈ −38 dB de música) antes del clímax y el clímax como momento más fuerte. Master −14 LUFS, TP ≤ −1 dBTP.
- **Samples VSCO:** sus nombres van una octava abajo (comprobado por análisis espectral: +12 consistente).
- **Render:** ~0.7 frames/s con GPU por software; más procesos no aceleran (CPU saturada). Con GPU real, mucho más.
- **Voz:** Kokoro `am_michael` a 1.12×. Piper `ryan` es CC BY-NC-SA (no comercial): no usar para monetizar.

## Licencias
three.js MIT · Playwright Apache-2.0 · fuentes OFL · Kokoro-82M Apache-2.0 / kokoro-onnx MIT · faster-whisper MIT ·
samples VSCO 2 CE **CC0** (crédito opcional: "Versilian Studios") · efectos: sintetizados (propios).
`score.py` escribe `audio/CREDITS.txt` con todo lo usado.

## Seguridad
Lee el código de cualquier skill o repo de terceros antes de ejecutarlo (o escanéalo con NVIDIA SkillSpector,
github.com/NVIDIA/skillspector). Fija versiones. Las keys van en variables de entorno, nunca en el repo.

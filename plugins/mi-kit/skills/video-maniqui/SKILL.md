---
name: video-maniqui
description: Hace shorts verticales (TikTok/Reels/Shorts) con maniquíes 3D en dos formatos — historia narrada (voz en inglés, cortes rápidos, subtítulos palabra por palabra) y "what if" sin voz (un solo plano, contador que no para, frase corta cada ~4 s) — con música orquestal CC0 y efectos sintetizados, solo con herramientas gratis. Úsalo cuando pidan "video tipo maniquí", "video de historia animado", "video what if", "qué pasaría si", "video faceless" o un short explicativo 3D, sobre cualquier tema.
---
# Video maniquí v0.4

Claude no genera píxeles: escribe código que los pinta. `motor/index.html` expone `window.seek(t)`;
Chromium headless pinta cada frame; ffmpeg une frames + audio. Todo es función de `t` (determinista),
así que imagen y sonido comparten el mismo reloj: **la narración es el reloj**.

```
motor/engine.js      three.js: maniquíes instanciados (900+), caballos, cañones, banderas, humo/chispas,
                     cielo, post-proceso (DOF, bloom, etalonaje, grano, whip-blur), shake y punch de cámara
motor/index.html     reproductor NARRADO: subtítulos palabra a palabra, títulos, etiquetas, flecha, pregunta final
motor/whatif.html    reproductor WHAT-IF: pregunta arriba, contador (HUD) con "time slowed/sped up", frase serif, tarjeta final
tools/voice.py       TTS Kokoro por línea + alineación palabra por palabra con faster-whisper → words.json
tools/render.mjs     test (frames sueltos) | export (planos + cues de sonido) | full (frames)
tools/run_all.sh     render completo (reanudable: salta frames existentes)
tools/score.py       partitura con samples CC0 + efectos sintetizados + ducking + master −14 LUFS
tools/review.py      revisión medida: Whisper sobre la mezcla, sync de subtítulos, LUFS/TP, ritmo
episodios/<nombre>/  narrado: script.json + episode.js (ej. episodios/waterloo)
                     what-if: episode.js con buildWhatIf(E) (ej. episodios/nuclear; index.html → motor/whatif.html)
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

## Formato what-if (sin voz) — medido en 2 virales de 30.2M y 18.7M vistas
Ninguno tiene voz; 1–3 cortes en 80 s; el **contador** marca el ritmo. Receta:
1. La pregunta arriba en 0–2 s (palabra clave en color). Frame 0 ya con imagen y texto.
2. **Un número que se mueve todo el video** (cuenta atrás, velocidad, altura) + segunda línea contextual
   ("BLAST ARRIVES IN 3.2 s", "WIND 78 MPH"). Indica si el tiempo va lento o rápido (lo calcula el reproductor).
3. Una frase corta (≤ 9 palabras) en serif cursiva cada ~4 s. **Cada paso peor que el anterior.**
4. Ciencia real con números reales (los comentarios lo comprueban): cada cifra con fuente en el episodio.
5. Un solo plano (POV fijo o cámara que viaja); cambios de estilo visual = escalada.
6. Final: tarjeta negra con la pregunta otra vez + un dato que abre discusión (≈4–8 s).
Pasos: `mkdir episodios/<x>` + enlaces (`engine.js`, `node_modules`, `index.html → ../../motor/whatif.html`); escribe
`episode.js` (copia `episodios/nuclear`): reloj del evento `tau(t)` por tramos, `captions`, `hud(t)`, `scene(t)`, `music` (con `gain`
por sección), `cues`. Luego `render.mjs export` + `test` (una imagen por frase) → `score.py` → `run_all.sh` → ffmpeg.

## Reglas aprendidas (medidas, no a ojo)
- **La regla de cortes depende del formato:** narrado 25–32 cortes/min; what-if 1 plano continuo con contador.
- **Frame 0 con imagen y texto**, nunca negro ni un fogonazo a cámara (quema la imagen).
- **Ritmo:** 25–32 cortes/min, ningún plano > 4 s (`review.py` → `dead_beats`).
- **Encuadre vertical:** a 50 m solo caben ~20 m de ancho. Primeros planos a 2–3 m; vistas laterales no caben.
  Las alturas de cámara son **relativas al terreno** bajo el objetivo (el motor lo suma).
- **Lo importante ≥ 100 px**; contenido en x 60–940, y 250–1500; subtítulos ≥ 80 px con borde.
- **Sonido:** un efecto por acción; whoosh centrado en el corte; nada fuerte encima de una palabra clave
  (un impacto sobre "flank" hizo que Whisper oyera "flag"): pon el golpe justo **después** de la palabra.
  Silencio (≈ −40 dB de música) antes del clímax y el clímax entre lo más fuerte. Master −14 LUFS a **−2.5 dBTP**:
  el AAC sube el pico ~2 dB (medido: un WAV a −1.2 quedó a +1.6 dBFS en el MP4). Mide siempre el MP4 final, no el WAV.
- **Mira frames después de cada cambio del motor** (un cambio de rendimiento dejó negros los frames alternos y solo se vio en la imagen).
- **Samples VSCO:** sus nombres van una octava abajo (comprobado por análisis espectral: +12 consistente).
- **Render:** ~0.7 frames/s con GPU por software; más procesos no aceleran (CPU saturada). Con GPU real, mucho más.
- **Voz:** Kokoro `am_michael` a 1.12×. Piper `ryan` es CC BY-NC-SA (no comercial): no usar para monetizar.
- **What-if:** el polvo/humo cerca de la cámara lo vuelve todo beige en segundos: pocas partículas y transparentes cerca, densidad lejos.
  Los fuegos cercanos con brillo grande parecen manchas: pequeños. La primera prueba siempre revela 3–4 de estas cosas.
- **Sin voz, el clímax manda:** usa `gain` por sección para que la música baje y el golpe sea lo más fuerte (mídelo por secciones).

## Licencias
three.js MIT · Playwright Apache-2.0 · fuentes OFL · Kokoro-82M Apache-2.0 / kokoro-onnx MIT · faster-whisper MIT ·
samples VSCO 2 CE **CC0** (crédito opcional: "Versilian Studios") · efectos: sintetizados (propios).
`score.py` escribe `audio/CREDITS.txt` con todo lo usado.

## Seguridad
Lee el código de cualquier skill o repo de terceros antes de ejecutarlo (o escanéalo con NVIDIA SkillSpector,
github.com/NVIDIA/skillspector). Fija versiones. Las keys van en variables de entorno, nunca en el repo.

---
name: video-maniqui
description: Hace videos cortos verticales (TikTok/Reels/Shorts) de historia o explicaciones con maniquíes de madera 3D, narración en español y subtítulos, sin pagar software. Úsalo cuando pidan "video tipo maniquí", "video de historia animado", "video faceless" o un short explicativo con muñecos 3D.
---
# Video maniquí (pipeline "frame function")

Claude no genera píxeles: escribe código que los pinta. Una página three.js expone `window.seek(t)`,
un navegador headless la llama frame a frame y ffmpeg une frames + audio. Todo es determinista:
el mismo `t` siempre da el mismo frame, así que se puede renderizar en paralelo y corregir por escena.

Ejemplo completo y funcionando en `plantilla/` (Batalla de Waterloo, 64 s, 1080x1920, 30 fps).

## Requisitos (todo gratis)
- Node 18+, Python 3, ffmpeg, Playwright con Chromium (`npm i -D playwright && npx playwright install chromium`).
- `npm i three@0.170.0 @fontsource/montserrat@5.1.0 @fontsource/playfair-display@5.1.0`
- Voz: `pip install piper-tts numpy` y la voz `es_MX-claude-high` de huggingface.co/rhasspy/piper-voices
  (carpeta `es/es_MX/claude/high/`, archivos `.onnx` y `.onnx.json`). Funciona offline.

## Pasos
1. **Guion** en `build_audio.py` → lista `SCENES`: `id`, `say` (lo que lee la voz; números en letras,
   nombres raros escritos como se pronuncian) y `cap` (subtítulo). 6–8 escenas, 1–2 frases cada una.
   Verifica fechas y hechos antes de escribir.
2. `python build_audio.py` → narración Piper, música y efectos sintetizados con numpy (tambor,
   cañones, lluvia, galope) en la misma línea de tiempo, y `timeline.json` con tiempos de cada escena y subtítulo.
3. **Escenas** en `index.html`: una función `S.<id>=(t,d)=>{...}` por escena. Dentro: `sky()`, `env()`,
   `camAt()`, y figuras con `figure({x,z,ry,team,hat,musket,walk,...})`, `horse({...})`, `block()` para
   formaciones, `puff()` humo, `labels()`, `arrow()`, `setText()` para títulos. Los maniquíes son
   InstancedMesh: cientos de figuras con ~25 draw calls.
4. **Frames de prueba**: `NODE_PATH=$(npm root -g) node render.mjs test 3 12 20 ...` → `frames/test_*.jpg`.
   Haz hoja de contacto con ffmpeg `hstack` y revísala.
5. **Crítico**: lista los peores 3–6 defectos (cámara apuntando a la nada, encuadre ancho que no cabe
   en vertical, personaje de espaldas, overlays tapando al protagonista) y corrígelos. Repite 4–5 hasta que se vea bien.
6. **Render completo**: `./run_all.sh` (ajusta `N` = ceil(total*30) desde `timeline.json`). ~1 s/frame por proceso
   con GPU por software; 4 procesos en paralelo.
7. **Unir**: `ffmpeg -framerate 30 -i frames/f%05d.jpg -i audio/mix.wav -c:v libx264 -pix_fmt yuv420p -crf 20 -preset slow -c:a aac -b:a 160k -shortest -movflags +faststart video.mp4`

## Reglas de formato
- 1080x1920, 30 fps, 45–65 s. Gancho con fecha/lugar en los primeros 2 s.
- Subtítulos de 3 palabras, mayúsculas, borde negro, palabras clave en amarillo, a 470 px del borde inferior (zona segura).
- En vertical caben ~20 unidades de ancho a 50 de distancia: formaciones compactas y cámaras por detrás/arriba, no de costado.
- Equipos con color en torso/brazos (madera en lo demás) para que se lean de lejos.

## Seguridad
- Lee el código de cualquier skill o repo de terceros antes de ejecutarlo. Fija las versiones de npm.
- Las keys van en variables de entorno, nunca en el repo.

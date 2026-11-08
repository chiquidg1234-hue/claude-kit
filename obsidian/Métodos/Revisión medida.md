---
tags: [metodo, calidad]
---
# Revisión medida

- **Hoja de contacto**: un frame por plano/frase → mirarla antes del render completo.
- **Mirar frames tras cada cambio del motor** (un cambio dejó negros los frames alternos).
- **Whisper sobre el MP4 final**: % de palabras entendidas y desfase de subtítulos (solo con voz).
- **Loudness**: `ffmpeg -af ebur128=peak=true` → −14 LUFS; pico < −1 dBFS medido **en el MP4**.
- **Por secciones**: el clímax debe estar entre lo más fuerte; silencio antes.
- **Ritmo**: cortes/min (narrado) o frase cada ~4 s + contador (what-if).

Límite: Claude no oye. La calidad musical y lo creíble de los efectos lo juzga un humano. Ver [[No verificado]].

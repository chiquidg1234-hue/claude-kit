---
name: ojos
description: Elige cómo "ver" algo. Úsalo cuando haya que ver un video (TikTok/YouTube/archivo), leer o usar una página web, o buscar videos en TikTok.
---
# Ojos: qué herramienta usar

| Necesito… | Herramienta | Notas |
|---|---|---|
| Ver un video (imagen + audio) | skill `watch` | Si Gemini da 503: `--engine local`, hojas de frames + Whisper local |
| Buscar videos en TikTok | MCP `apify` (actor de TikTok por keyword/hashtag) | El navegador sin sesión NO ve resultados en TikTok |
| Leer o usar una web sin login | `agent-browser` (CLI): `open` → `snapshot -i` → `click @eN` | Manda solo los elementos, no el HTML: ahorra tokens |
| Testear mi app web | plugin `playwright` | |
| Webs que requieren mi sesión | Claude in Chrome / ego lite (Mac) | Solo en mi laptop |

Reglas para ahorrar tokens: filtrar por métricas antes de ver, hojas de 6 frames, respuestas cortas (caveman).

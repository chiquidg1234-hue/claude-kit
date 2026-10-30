# claude-kit: mi Claude Code igual en todas partes

Un solo repo controla qué tiene **cada** Claude Code (laptop, otra PC, sesiones en la nube).
Lo que cambias aquí lo reciben todas las sesiones.

## Qué trae
| Para | Plugin / herramienta |
|---|---|
| 👀 Ver videos | `watch` (claude-video) |
| 👀 Ver/usar webs | `agent-browser` (Vercel), `playwright` |
| 🔎 Buscar en TikTok | MCP `apify` (en `mi-kit`) |
| 🕷️ Leer webs enteras | `firecrawl` |
| 📚 Docs actualizadas | `context7` |
| 💸 Menos tokens | `caveman` |
| 🧠 Método de trabajo | `superpowers`, `claude-code-setup` |
| 🤖 Equipo de agentes | `ruflo-core` |

## Instalar
- **Laptop / PC (terminal):** `git clone` este repo y luego `bash instalar.sh`.
- **Sesiones en la nube y cualquier proyecto:** copia `.claude/settings.json` al repo del proyecto. Claude Code instala y activa lo que diga ahí.

## Control
- **Agregar o quitar algo para todos:** editas `enabledPlugins` en `.claude/settings.json` (y la lista de `instalar.sh`), haces commit y push.
- **Quitar algo en una sola máquina:** `bash instalar.sh --quitar ruflo-core@ruflo`.
- **Permisos:** la sección `permissions.deny` bloquea comandos peligrosos en todas las sesiones.
- **Las keys nunca van en el repo:** se ponen como variables de entorno (`APIFY_TOKEN`, `FIRECRAWL_API_KEY`). En la nube van en la configuración del entorno.

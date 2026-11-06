# claude-kit: mi Claude Code igual en todas partes

Un solo repo controla qué tiene **cada** Claude Code (laptop, otra PC, sesiones en la nube).
Lo que cambias aquí lo reciben todas las sesiones.

## Qué trae
| Para | Plugin / herramienta |
|---|---|
| 👀 Ver videos | `watch` (claude-video) |
| 👀 Ver/usar webs | `agent-browser` (Vercel), `playwright` |
| 🔎 Buscar en TikTok | MCP `apify` (en `mi-kit`) |
| 🎬 Hacer shorts 3D tipo maniquí | skill `video-maniqui` (en `mi-kit`) |
| 🕷️ Leer webs enteras | `firecrawl` |
| 📚 Docs actualizadas | `context7` |
| 💸 Menos tokens | `caveman` |
| 🧠 Método de trabajo | `superpowers`, `claude-code-setup` |
| 🤖 Equipo de agentes | `ruflo-core` |

## Instalar
- **Windows (PowerShell):** `git clone https://github.com/chiquidg1234-hue/claude-kit; cd claude-kit; powershell -ExecutionPolicy Bypass -File .\instalar.ps1`
- **Mac / Linux (terminal):** `git clone https://github.com/chiquidg1234-hue/claude-kit && cd claude-kit && bash instalar.sh`
- **Solo el plugin propio:** `/plugin install mi-kit --marketplace chiquidg1234-hue/claude-kit`
- **Sesiones en la nube y cualquier proyecto:** copia `.claude/settings.json` al repo del proyecto. Claude Code instala y activa lo que diga ahí.

## Control
- **Agregar o quitar algo para todos:** editas `enabledPlugins` en `.claude/settings.json` (y la lista de `instalar.sh`), haces commit y push.
- **Quitar algo en una sola máquina:** `bash instalar.sh --quitar ruflo-core@ruflo` (Windows: `.\instalar.ps1 -Quitar ruflo-core@ruflo`).
- **Permisos:** la sección `permissions.deny` bloquea comandos peligrosos en todas las sesiones.
- **Las keys nunca van en el repo:** se ponen como variables de entorno (`APIFY_TOKEN`, `FIRECRAWL_API_KEY`). En la nube van en la configuración del entorno.

## Estado de las pruebas
- Linux (sesión de nube, 2026-10-30): marketplaces e instalación de los 9 plugins ✅; `claude plugin validate` ✅ (con avisos).
- Windows: `instalar.ps1` **sin probar todavía**.
- MCP de `ruflo-core`: no conectó en la nube (timeout de 30 s). Sus agentes sí funcionaron.

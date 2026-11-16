# Plan 5 días sin laptop (16–21 nov 2026)

> Creado desde una sesión de nube leyendo el chat "Prompt optimization skill y metodología" (12–13 nov).
> Regla: **lo medido está marcado ✅; lo estimado, 🟡.**

## 1. Qué pasó en ese chat (resumen)
- **12 nov:** skill `lyra` (optimizador de prompts 4-D) creada y usada; investigación en X sobre Fable 5.2 y video con código (281 posts); análisis de 3 TikToks; veredicto: estilo what-if probado, estilo "clips ajenos" no (copyright) → alternativa legal "nivel D" (planos propios del motor).
- **13 nov:** se lanzaron **4 agentes en paralelo** (V1 bomba nuclear v3 con Fable, V2 estilo Roblox, V3 héroes-villanos, A/B HyperFrames; 3 de ellos con Opus). Resultado: la ventana de 5 h pasó de **5 % a 28 % en 15 min** y a las 22:10 UTC llegó el **error 429 (límite de 5 h)**; los 4 agentes murieron a medias. Semanal "todos los modelos" ya iba en **74 %** (plan Pro, sin uso extra).
- Hallazgo útil: desde Fable 5.2 el subagente `Explore` usa el **modelo principal** (caro) → se fijó en Haiku (`.claude/agents/Explore.md`, ya incluido aquí).
- Sesión principal en `effort: xhigh` y con ~57 k tokens fijos por turno (herramientas + MCP + skills).

## 2. Cómo gastar pocos tokens (reglas)
1. **Un solo agente a la vez.** Nada de 4 en paralelo ni Opus en segundo plano: multiplica el gasto y se corta todo junto.
2. **Modelo por tarea:** Haiku = leer/buscar (Explore); Sonnet = por defecto (escribir, código); Opus = solo decisiones y revisión final; Fable = solo 1 encargo grande (ver §5).
3. **Esfuerzo bajo/medio** para tareas mecánicas (`/effort`). `xhigh` solo para diseño difícil.
4. **HANDOFF.md como memoria:** cada sesión/vuelta lee SOLO `HANDOFF.md` (≤ 40 líneas), hace UN paso y lo reescribe. No arrastrar conversación. Plantilla en `HANDOFF.md`.
5. **Nunca leer transcripts de otros chats** (cuesta ~15 k tokens por página ✅). Usar el resumen de compactación o los HANDOFF.
6. **Leer poco:** `grep`/rangos antes de `Read` entero; `| head`/`| tail` en salidas; pocas hojas de contactos (1 por revisión), no cuadros sueltos.
7. **`/compact` manual a ~50 %** y `/clear` entre tareas distintas. No dejar que llegue al 97 %.
8. **Cache:** no editar CLAUDE.md ni cambiar herramientas a mitad de sesión; sesiones continuas cuestan menos que muchas frías.
9. **Menos plugins/MCP por sesión:** en la nube están fallando ~30 MCP (proxy) y cada herramienta cargada cuesta tokens. Para trabajo de video basta: `caveman`, `superpowers`, `playwright`. Desactivar el resto en el `settings.json` del proyecto.
10. **Presupuesto por ventana de 5 h:** máximo ~30 % de la ventana por bloque de trabajo y parar. Mirar `/usage` al empezar y al terminar cada bloque.
11. **Renders y búsquedas pesadas en scripts, no en el chat:** el script imprime 1 línea de resultado.
12. **Texto de salida corto** (también pensando en el celular).

## 3. Qué nos limita sin la laptop (evaluación)
| # | Limitación | Gravedad | Evidencia | Mitigación |
|---|---|---|---|---|
| 1 | **Chats con Remote Control (bridge) quedan desconectados** (`computer_unreachable`); el chat "Prompt optimization…" no se puede continuar | Alta | ✅ estado de la sesión | Continuar en sesiones de nube sobre este repo con HANDOFF.md |
| 2 | **Todo el trabajo reciente está en la laptop:** `estudio-video/` (motor, `handoff/estado_*.md`, episodios canal-01/03), `JARVIS_VAULT` (Obsidian), skill `lyra` en `~/.claude/skills/`, commit local sin subir `3a94115` (Explore en Haiku). Aquí solo existe la copia vieja del 8 nov (rama `ccr-713da764-ifdhvw`, video-maniqui v0.4) | **Crítica** | ✅ ramas del repo | **Antes de que salga la laptop** (si aún está contigo): checklist del §4 |
| 3 | **Sin GPU** (laptop: MX330). Nube: 4 CPU, 15 GB RAM, WebGL por software (SwiftShader). Un fragment shader pesado a 1080×1920 = **300 ms/frame** ✅ | Media | ✅ prueba hoy | 🟡 una escena three.js real: 0,3–2 s/frame → un video de 60 s a 30 fps (1800 cuadros) ≈ **10–60 min**. Previews a 540×960 y 15 fps; render final 1080×1920 una vez. Medir primero con 3 s |
| 4 | **Red de la nube bloqueada** para `tiktok.com`, `api.fxtwitter.com`, `huggingface.co` ✅ (PyPI sí ✅). Sin Hugging Face no bajan los modelos de **Kokoro (voz)** ni **Whisper**; `yt-dlp` no está instalado | Alta para voz y análisis de referencias | ✅ prueba hoy | Pedir permiso para añadir hosts al entorno (`update_environment`, con tu aprobación) o usar voz Piper desde GitHub si está permitido. Referencias de TikTok: ya analizadas (notas existentes) → no hace falta bajarlas de nuevo |
| 5 | **Roblox Studio MCP** (V2 estilo Roblox) necesita Roblox Studio en la laptop | Alta para V2 | ✅ el chat usó `mcp__roblox-studio` | Posponer V2 al día de regreso; en la nube solo investigación/guion |
| 6 | **Contenedor efímero:** lo no commiteado y pusheado se pierde; MP4 grandes no caben bien en git | Media | doc. del entorno | Commit+push al terminar cada paso; guardar en git solo scripts, guiones, notas y MP4 pequeños (< 20 MB, 540 p); finales pesados → regenerar en laptop |
| 7 | **Cada sesión nueva arranca en frío** (no sabe lo que hizo la anterior) | Media | ✅ | `CLAUDE.md` corto + `HANDOFF.md` (§2.4) |
| 8 | **La nube gasta la misma cuota Pro**: no hay tokens extra por usarla ✅ (`extraUsage` desactivado) | Alta | ✅ | Reglas del §2; plan por ventanas (§5) |
| 9 | **Fable gratis termina hoy 16 nov 23:59 PT** (= 17 nov 03:59 Bolivia); luego se cobra a $8/$40 por M tokens vs Opus $4/$20 | Alta (hoy) | dato del chat | Decidir hoy un único encargo Fable o no usarlo (§5) |
| 10 | **Obsidian/vault inaccesible** | Baja | — | Escribir notas en `obsidian/` del repo (la rama vieja ya lo hacía) y volcarlas al vault al volver |
| 11 | Interfaz solo celular: respuestas largas incómodas; sin aprobar permisos en el momento | Baja | — | Respuestas cortas; permisos preaprobados en `.claude/settings.json` |
| 12 | MCP de nube fallan (apify, context7, figma…) por el proxy | Baja | ✅ lista de fallos | No depender de ellos; `WebSearch` y Exa sí funcionan |

## 4. Checklist para la laptop (si todavía puedes tocarla 10 min)
```bash
cd claude-kit && git push origin main            # sube 3a94115 (Explore en Haiku)
# copiar la skill lyra al kit (para tenerla en la nube):
mkdir -p plugins/mi-kit/skills && cp -r ~/.claude/skills/lyra plugins/mi-kit/skills/ && git add -A && git commit -m "skill lyra" && git push
# estado de los agentes cortados:
cp ~/Documents/estudio-video/handoff/estado_*.md .  # (o commitear handoff/)
```
Y deja **Remote Control** activo si la laptop se queda encendida y conectada (así los chats viejos siguen vivos desde el celular).

## 5. Plan de 5 días (nube = pensar/escribir/programar; laptop = renderizar)
- **Hoy (16 nov):** (a) decidir Fable: *un* encargo, el que más valor tenga (propuesta: guion + plan de planos de V1 "bomba nuclear v3", sin render) o ninguno; (b) subir este kit; (c) medir 3 s de render con el motor del kit para saber s/frame real.
- **Días 1–3 (una ventana de 5 h por día, ≤ 30 % cada bloque):**
  1. V3 héroes-villanos, etapa 1 completa en la nube: título, `research.md` (2 fuentes por dato con WebSearch), guion 55–70 s, plan de planos. Costo bajo, 0 GPU.
  2. V1 bomba nuclear v3: guion, storyboard y código de planos; render de prueba a baja resolución.
  3. A/B HyperFrames: `npm` funciona; probar solo si sobran ventanas (no es prioritario).
- **Día 4:** montar el episodio completo en la nube a baja resolución; revisión con 1 hoja de contactos.
- **Día 5:** HANDOFF final, push, lista de renders pendientes para la laptop. V2 Roblox queda para el regreso.
- **Ritual de cada bloque:** leer HANDOFF.md → `/usage` → hacer UN paso → actualizar HANDOFF.md → commit+push → parar o seguir según %.

## 6. Qué NO sé (no verificado)
- Segundos por cuadro del motor three.js real en la nube (solo medí un shader de prueba).
- Si GitHub Releases/LFS acepta los MP4 finales desde la nube.
- Si Piper/Kokoro pueden bajar sus voces con los hosts actuales.
- El contenido exacto de las notas de la laptop posteriores al 8 nov (solo leí el resumen de compactación y el final del chat, no las ~1000 páginas intermedias).

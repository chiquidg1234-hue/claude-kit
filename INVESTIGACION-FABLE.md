# INVESTIGACIÓN FASE 2 — Actuación de personajes (estudio "maniquí")

Fecha: 2026-11-16 · Sesión de investigación/diseño (sin publicar, sin comprar, sin PR).
Convención: **[V]** = verificado en fuente citada (búsqueda web 2026-11-16, casi todo de blogs/agregadores, no de páginas oficiales → reconfirmar antes de pagar). **[S]** = suposición/inferencia mía. **[NV]** = no verificado.

## 0. Aviso importante sobre el repo
`claude-kit` **no contiene el estudio de video**: solo un kit de plugins (README, `.claude/settings.json`, instaladores, un plugin `mi-kit` con skill `ojos` y MCP `apify`). No hay guiones, plantillas, escenas, scripts de render ni notas de los pilotos (Waterloo, bomba nuclear, superláser) ni del crítico. Todo lo que sé del estudio (notas 6.4–7.0, fallos de actuación, TikToks de referencia) viene **del prompt, no del repo** [S]. Por eso la primera tarea del backlog es localizar/subir el repo del estudio (en la laptop) o un resumen de él.

## 1. Resumen ejecutivo
- **Causa raíz [S]**: la actuación falla porque las poses/animaciones son genéricas y no están dirigidas por escena (cámara, orientación, gesto, pausa). "Napoleón nunca de frente" = problema de *blocking y cámara*, no de modelo. Se arregla con una **capa de dirección declarativa** (por beat: quién, mira a dónde, gesto, duración, cámara) más una **biblioteca de clips de animación** retargeteados al maniquí.
- **Ruta recomendada: B → (opcional) C.** Maniquí rigged + clips Mixamo (gratis) + dirección por JSON + render Blender/Eevee. Costo: $0 [V: Mixamo gratis con Adobe ID, uso comercial royalty-free, sin redistribuir los FBX sueltos]. La generación de movimiento por texto (HY-Motion / Kimodo) cubre los gestos que Mixamo no tenga.
- **No usar video-IA (Wan 2.2) como motor principal**: cambia de apariencia entre tomas y exige GPU grande; sí sirve como extra puntual (ruta D).
- **Crítico**: añadir métricas objetivas baratas (visibilidad de rostro por beat, tiempo de quietud, brazos arriba) calculadas con código sobre el render/pose + un VLM barato para el juicio cualitativo; el modelo caro solo arbitra.
- **Black Friday**: no hay ofertas 2026 confirmadas de Kling/Runway/Hailuo; ElevenLabs "hasta 80%" desde 26 nov es extrapolación de 2025 [V débil]. **Recomendación: no comprar nada hasta el 27–30 nov** y entonces solo si la ruta elegida lo necesita; la ruta B no necesita pagar.

## 2. Qué existe / falla / metas (del repo + prompt)
| Existe (repo) | Falla (prompt) | Metas escritas |
|---|---|---|
| Plugins: watch (ver videos), agent-browser, playwright, apify (TikTok), firecrawl, context7, caveman, superpowers, ruflo-core | Pilotos 6.4–7.0 (< 8). Napoleón nunca de frente, brazos que festejan, tramos quietos | Repo no documenta metas de automatización; las del prompt: guion→escenas→render→crítico→publicación manual |
| Reglas: keys por variables de entorno, nunca en repo | ruflo MCP no conectó en nube (README) | — |

## 3. Diagnóstico
**Por qué falla la actuación [S]**: (1) animaciones en bucle/aleatorias sin intención por beat; (2) sin *look-at* ni regla de cámara→personaje; (3) rig sin restricciones (brazos sin límites, "festejan" por defecto); (4) sin "holds" ni micro-movimiento → tramos quietos; (5) el guion no especifica actuación.

**Técnicas/herramientas que lo resuelven**
- **Clips mocap gratis (Mixamo)** [V]: gratis con Adobe ID, comercial royalty-free; restricción: no redistribuir los FBX como activo suelto. Retarget en Blender con add-on Rokoko (gratis) o Auto-Rig Pro (de pago; compat. verificar con tu versión de Blender) [V, Cinevva]. Ojo escala x100 al exportar FBX [V].
- **Movimiento por texto open source**: **HY-Motion 1.0 (Tencent)**, ~1B params, salida SMPL-H 22 joints, pesos ~6 GB en Hugging Face, exporta FBX/BVH según un sitio de terceros (confirmar en repo oficial) [V débil]. **Kimodo (NVIDIA, 16-mar-2026, v1.1 10-abr-2026)**: texto + restricciones cinemáticas, variante SMPL-X; código Apache-2.0, **pesos con licencia NVIDIA propia: revisar uso comercial** [V]. MotionGPT3: tiene render SMPL→Blender pero setup "WIP" [V]. MoMask: **[NV]**.
- **Blender headless + MCP**: `blender --background --python` para render sin GUI; MCPs existentes: djeada/blender-mcp-server (BLENDER_BIN headless), sandraschi/blender-mcp, blender-remote (PyPI) [V; sin README oficial leído → probar]. Útil: Claude escribe/lanza escenas Blender por código.
- **Video-IA open source (Wan 2.2 / Wan-Animate)**: transfiere movimiento de un video de referencia a una imagen de personaje; plantilla nativa en ComfyUI. VRAM: fuentes discrepan, 12–16 GB cuantizado (14B) vs hasta 80 GB completo; sin precio oficial hallado [V débil / NV]. Riesgo [S]: consistencia visual entre tomas y poca "dirección" fina.
- **Retención TikTok (del análisis del usuario, no re-verificado)**: Día D = sin narrador, hora en pantalla, silencio a golpes; Eisenhower = mapas+calendario+subtítulos palabra a palabra. [S] Implicación: la retención viene de *estructura* (reloj, mapa, corte seco, silencio) más que de actuación realista; un maniquí con actuación "suficiente" + estos recursos puede superar a un maniquí perfecto sin ellos.

**Cómo medir actuación objetivamente (para el crítico)** [S, diseño propio; a validar]
Sobre cada beat del render (o mejor, sobre los datos de escena, sin ver pixeles):
1. `face_to_camera_ratio` por personaje principal (ángulo yaw cabeza-cámara < 60° ⇒ "de frente"); meta ≥ 40% de sus planos.
2. `idle_seconds_max`: mayor tramo con velocidad de huesos < umbral; meta < 1.5 s sin corte/cámara.
3. `arm_raise_events` fuera de beats de celebración (regla de continuidad emocional).
4. `gesture_variety`: nº de clips distintos por personaje / minuto.
5. `look_at_target_error`: ángulo entre mirada y objetivo declarado.
Con render ya hecho: detector de pose (MediaPipe/YOLO-pose, gratis) para 2–5. VLM (Gemini Flash) para juicio "¿se entiende la emoción?" con rúbrica 0–10 por dimensión. Precio Gemini 3.6 Flash: $0.75/$3.75 por M tokens hasta 31-dic-2026, luego $1.5/$7.5 [V, agregador+Vertex]; tokens de video ≈ por segundo (cifra 5,792 tok/s es de modelo Omni, **no** aplicar sin verificar) [NV]. Mantener al crítico ≥ 8/10 como puerta, pero con subpuntuaciones numéricas para ver *qué* sube.

## 4. Rutas fase 2 (de más barata a más ambiciosa)
| Ruta | Qué es | Costo | Render | Sin laptop (nube) | Espera laptop |
|---|---|---|---|---|---|
| **A. Dirección sin tocar el rig** | Capa de "beats" en JSON (look-at, orientación, holds, límites de brazos, cámara que mantiene rostro). Corrige 80% de los síntomas citados [S] | $0 | igual que hoy | Diseñar esquema, escribir el código, métricas del crítico, guion con anotaciones de actuación | Render y prueba visual |
| **B. A + biblioteca Mixamo** (RECOMENDADA) | Clips gratis retargeteados al maniquí, banco de ~30 gestos etiquetados (hablar, señalar, caminar, miedo, orden…), selector por emoción | $0 [V] | Eevee en laptop; [S] minutos por video corto | Catálogo/etiquetado, scripts Blender, tests unitarios | Descargar FBX (cuenta Adobe, interactivo), retarget, render |
| **C. B + movimiento por texto** | HY-Motion/Kimodo generan gestos faltantes → BVH/FBX → retarget | $0 licencia (revisar NVIDIA); GPU: laptop o alquiler: RunPod 4090 ≈ $0.34/h comunidad, ≈ $0.69/h segura [V débil, reconfirmar] | Generación de movimiento: segundos–minutos por clip [NV] | Scripts, notebooks; Kaggle ≈30 h/sem GPU gratis (cuota no oficial, ver cuenta) [V débil] | Pruebas con GPU local |
| **D. C + video-IA para planos hero** | Wan-Animate/Wan 2.2 transfiere actuación a planos clave | $0 local si cabe; nube GPU grande: pagar horas [NV precio oficial] | 90–180 s por clip 5 s en 14B cuantizado [V débil] | Prototipo en Kaggle/Colab (límite VRAM) | Todo lo pesado |
| **E. Pago premium (Kling/Runway/Hailuo)** | Generadores comerciales para planos clave | **[NV]**: sin ofertas BF confirmadas; Kling 30% primer mes (tracker) | Nube | Todo | Nada |

Orden sugerido: A→B ya; C si el banco queda corto; D solo para 2–3 planos hero; E descartada salvo que BF traiga un plan anual claramente barato (ver §6).

**Pipeline de punta a punta** (todo por archivos versionados):
`guion.md` (con marcas de actuación) → `escenas.json` (beats: personaje, acción, mirada, duración, cámara, hora/mapa en pantalla, silencios) → `lint_escenas` (reglas §3, corre en nube, gratis) → `render` (Blender headless, laptop) → `critico_objetivo` (pose/métricas, nube o laptop) → `critico_vlm` (Gemini Flash, rúbrica) → si <8: el *resolutor* edita solo `escenas.json` → rerender → `paquete_publicacion/` (video, título, caption, hashtags) → **publicación manual**. Los "lint" y métricas sobre datos de escena evitan rerenders caros.

## 5. Arsenal para Fable 5.2
- **Ya en el kit**: `watch` (ver referencias TikTok), `apify` (buscar TikToks), `firecrawl`, `context7` (docs de Blender/bpy), `superpowers` (método), `caveman` (ahorro tokens), `playwright`.
- **Añadir [S, a probar]**: MCP de Blender (djeada/blender-mcp-server, headless); skill propia `actuacion` (esquema de beats + reglas + banco de gestos); skill `critico-barato` (rúbrica + llamada a Gemini Flash); subagente `lint-escenas` (determinista, sin LLM).
- **Repos/datasets de referencia**: HY-Motion 1.0, Kimodo, MotionGPT3 (render SMPL→Blender); Mixamo (animaciones); HumanML3D / AMASS como datasets de movimiento [S, conocidos; confirmar licencias: AMASS suele restringir uso comercial].
- **Reparto de modelos**: determinista/código (lint, métricas pose) = $0; VLM barato (Gemini Flash) = crítico de cada iteración; modelo caro (Fable 5.2) = guion, arquitectura del esquema, arbitraje cuando el crítico barato y el independiente discrepan, y resolutor de fallos complejos. Subagentes en paralelo para variantes de guion (skill `consenso-estocastico` existente). Mantener el **crítico independiente** original como juez final (≥ 8) para no autoengañarse.

## 6. Herramientas, precios y descuentos (fecha: 2026-11-16)
| Herramienta | Precio / nota | Fuente |
|---|---|---|
| Blender, Rokoko add-on, MediaPipe | Gratis [V] | — |
| Mixamo | Gratis con Adobe ID; comercial royalty-free; no redistribuir FBX sueltos [V; texto legal exacto no leído] | https://helpx.adobe.com/be_en/creative-cloud/faq/mixamo-faq.html |
| Auto-Rig Pro | De pago; precio **NV**; verificar compat. con tu Blender | https://app.cinevva.com/tr/guides/mixamo-to-blender-2026 |
| HY-Motion 1.0 | Open source; confirmar licencia/FBX en repo oficial | https://arxiv.org/pdf/2512.23464v1 |
| Kimodo (NVIDIA) | Código Apache-2.0; pesos licencia NVIDIA | https://rits.shanghai.nyu.edu/ai/nvidia-releases-kimodo-controllable-text-to-motion-for-characters-and-humanoid-robots/ |
| Wan 2.2 Animate | Open source; VRAM 12–80 GB según fuente | https://www.thundercompute.com/blog/wan-2-2-comfyui-ai-video-model |
| Kaggle GPU | ≈30 h/sem gratis, sesión máx 12 h (cuota no oficial; ver cuenta) | https://gpuperhour.com/blog/free-cloud-gpus-and-credits |
| RunPod 4090 | ≈$0.34/h comunidad, ≈$0.69/h segura; confirmar | https://www.runpod.io/gpu-cloud/pricing |
| Gemini 3.6 Flash (crítico VLM) | $0.75 in / $3.75 out por M tokens hasta 31-dic-2026; después $1.5/$7.5 | https://cloud.google.com/vertex-ai/generative-ai/pricing |
| Black Friday IA (resumen trackers) | Sin ofertas 2026 confirmadas Kling/Runway/Hailuo; ElevenLabs "hasta 80%" desde 26-nov = patrón 2025 | https://diyai.io/ai-tools/video-generation/black-friday-ai-video-generator-deals/ · https://diyai.io/ai-tools/video-generation/kling-ai-black-friday/ |
| Blender MCP | gratis; sin README oficial verificado | https://github.com/djeada/blender-mcp-server (vía glama.ai) |

Regla BF: antes del 27-nov no comprar. En 27–30 nov revisar páginas oficiales de cualquier servicio de pago que la ruta pida (voz, GPU, almacenamiento); preferir plan anual/créditos solo si ya está probado el flujo gratis. Voz y música: **no investigadas a fondo en esta sesión → pendiente** (alternativas gratis a evaluar: TTS open source, música CC0).

## 7. Recomendación
Hacer **A+B** (costo $0, todo lo no-render se puede hacer desde la nube), medir con las métricas de §3, y decidir C/D solo si tras A+B alguna dimensión sigue < 8. Meta realista [S]: A+B debería atacar de frente los tres síntomas citados (frente, brazos, quietud); la nota final depende también de guion y estructura tipo Día D (reloj en pantalla, silencios), que es barato añadir.

## 8. Backlog fase 2 (prioridad)
1. Localizar el repo del estudio y volcar su estructura al repo/notas (bloquea todo). 
2. Esquema `escenas.json` v1 + `lint_escenas` con reglas §3 (nube).
3. Reglas de cámara: *face-the-camera* para personaje principal, mirada a objetivo, límite de brazos por emoción (nube).
4. Banco Mixamo de ~30 clips etiquetados + script Blender de retarget (laptop para descargar/probar).
5. Métricas objetivas del crítico (pose + datos de escena) + rúbrica VLM; calibrar contra las notas actuales 6.4–7.0.
6. Re-render de un piloto (Waterloo) y comparar nota antes/después.
7. Recursos de retención: hora en pantalla, mapa/calendario, subtítulos palabra a palabra, silencios a golpes (plantillas).
8. Probar HY-Motion/Kimodo en Kaggle para gestos faltantes (confirmar licencias).
9. Voz/música: evaluar opciones gratis y precios BF.
10. Empaquetado de publicación manual.

## 9. Preguntas abiertas para el usuario
1. ¿Dónde está el repo/estudio actual y en qué motor se renderiza (Blender u otro)? 
2. ¿Qué maniquí/rig usan hoy y es humanoide estándar (compatible Mixamo)?
3. ¿GPU de la laptop (modelo y VRAM)? Decide si C/D son locales.
4. ¿Presupuesto mensual máximo? ¿Aceptas $0 hasta pasar BF?
5. ¿Idioma de los videos y voz actual (narrador, TTS)? ¿El modelo "sin narrador" tipo Día D es opción?
6. ¿El crítico independiente es un modelo/prompt que puedo ver y ejecutar en nube?
7. ¿Quieres que la publicación siga manual indefinidamente?

## 10. Prompt de arranque (formato Lyra) para Fable 5.2
```
# ROL
Eres el director técnico del estudio de video "maniquí" de historia/guerra (Waterloo, bomba nuclear, superláser). Español. Frugal en tokens.

# CONTEXTO
Pilotos con nota 6.4–7.0 de un crítico independiente (meta ≥ 8). Lo que más resta: actuación (personaje principal nunca de frente, brazos que festejan, tramos quietos). Lee INVESTIGACION-FABLE.md (rutas, métricas, backlog). Referencias TikTok: estructura (hora en pantalla, mapas, silencios a golpes, subtítulos palabra a palabra). Repo público: nunca claves ni datos personales. Renders pesados = laptop del usuario; nube = diseño/código ligero.

# CONDICIONES
Barato (gratis/open source primero; BF 27–30 nov: no comprar antes; todo precio con fuente y fecha o "NO VERIFICADO"). Sin publicar, sin PR a main sin permiso.

# TAREA
Ejecuta la ruta A+B: (1) localizar/resumir el repo del estudio; (2) definir escenas.json v1 con beats de actuación y lint_escenas; (3) métricas objetivas del crítico y rúbrica VLM; (4) plan Mixamo→Blender retarget; (5) re-render de Waterloo y comparar. Usa subagentes baratos para lint/críticas repetitivas y reserva tu razonamiento para diseño y arbitraje.

# ENTREGA
Commits en rama de sesión, informe corto con nota antes/después por dimensión, y lista de lo que requiere la laptop.
```

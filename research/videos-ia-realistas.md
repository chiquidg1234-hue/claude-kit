# Videos de IA realistas: investigación (nov 2026)

Investigación hecha el 12 nov 2026. Objetivo: cómo se hacen videos de IA **realistas** (no maniquí/avatar de dibujo), qué repos existen, qué hace falta y qué es gratis.

> **Cómo leer esto.** Lo marcado ✅ lo leí en la fuente oficial (README/licencia del repo). Lo marcado ⚠️ viene de blogs de terceros, muchos de marketing, y puede estar desactualizado o contradecirse. X no deja leer los posts directamente: trabajé con los títulos/extractos que devuelve el buscador, no con los hilos completos.

---

## 1. Respuesta corta

- **Sí se puede hacer video realista a partir de una imagen** (image-to-video, I2V). Es lo que hace casi todo el mundo en X: una imagen fija buena → un modelo de video la anima.
- **Gratis y sin límites de verdad = modelos abiertos en tu propia GPU** (Wan 2.2, LTX-2.3/2.5, HunyuanVideo 1.5). Si no tienes GPU, hay créditos diarios gratis en Kling/Veo/Hailuo, pero con marca de agua y sin uso comercial.
- **Famosos (Mbappé, Messi, DiCaprio):** técnicamente un modelo I2V anima cualquier cara que le des. Pero:
  - Los servicios grandes (Veo, Seedance, Sora, Kling) **filtran caras de figuras públicas** ⚠️. En X circulan hilos que venden "cómo saltarse el bloqueo" (por ejemplo, uno de @yapper_so sobre Messi/Yamal en el Mundial). **No los leí ni los incluyo aquí**: eso es evadir una salvaguarda.
  - Los modelos abiertos no traen filtro, así que **toda la responsabilidad legal es tuya**, y las leyes se están endureciendo justo ahora (sección 6).
- **Lo que sí recomiendo:** montar el pipeline con **personas sintéticas realistas** o con **tu cara / gente que te dé permiso**. Para famosos, solo parodia/fan content **claramente etiquetado como IA**, sin publicidad ni respaldo falso, sin política, sin contenido sexual y sin clonar voces reales.

## 2. Cómo lo hacen en X (patrones que se repiten)

Basado en hilos de @techhalla, @shalevhvs, @DeRonin_, @higgsfield_ai, @vladimircherner y otros ⚠️ (autorreportados):

1. **Imagen primero, video después.** Generan el fotograma con **Nano Banana Pro** (Google), Seedream 4.5 o Midjourney, y recién ahí lo animan. "I2V gana a T2V siempre": subes la captura y el modelo solo inventa movimiento.
2. **Modelo de video según el trabajo:** Veo 3.1 (realismo, lip-sync, audio), Kling 2.5/3 (consistencia de personaje), Seedance 2.0 (exploración rápida; 2.5 anunciado), Sora 2 (cámara), Hailuo 2.3 (expresiones sutiles).
3. **Primer y último fotograma:** crean el cuadro inicial y el final y el modelo interpola (Seedance/Kling).
4. **Una acción por plano.** Prompts con varias acciones deforman; se parte en escenas cortas. Clips útiles de **4–6 s**.
5. **Hoja de personaje** (frente, espalda, retrato 3/4) para que la cara no cambie entre planos; la cara del retrato grande es la que el modelo copia.
6. **Luz consistente** en todos los prompts de una misma pieza.
7. **Audio y montaje:** ElevenLabs (tier gratis) o el audio nativo de Veo/LTX, y CapCut para cortar.
8. Hay también "grid animation": una cuadrícula de 3/6/9 fotogramas como storyboard.

## 3. Repos y modelos abiertos (gratis)

### Generación de video base

| Modelo | Repo | Licencia | VRAM | Notas |
|---|---|---|---|---|
| **Wan 2.2** (T2V/I2V/TI2V-5B) | https://github.com/Wan-Video/Wan2.2 ✅ | Apache-2.0 ✅ | 5B corre 720p@24fps en una 4090 ✅; 14B ~24 GB cuantizado ⚠️; con GGUF + LightX2V hay guías para 8 GB ⚠️ | La opción más segura para uso comercial. Mejor I2V abierto según varias comparativas ⚠️ |
| **LTX-2.5** (ago 2026; video+audio+multi-shot) | https://github.com/Lightricks/LTX-2 ✅ | Código Apache-2.0; **pesos: LTX-2.x Community License** ✅ (gratis bajo 10 M USD de ingresos) | Mínimo oficial 32 GB ⚠️; **LTX-2.3 FP8 baja a ~16 GB** ⚠️ | Descarga de ~66 GiB ✅. Nodos nativos en ComfyUI. Incluye I2V, primer/último frame y imagen+audio→video |
| **HunyuanVideo 1.5** (8.3B) | https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5 ✅ | Licencia comunitaria Tencent. ✅ **No aplica en UE, Reino Unido ni Corea del Sur** y no permite usar la salida fuera del "Territorio" | 14 GB mínimo con offloading ✅; Wan2GP la baja a ~6 GB ⚠️ | Calidad alta; **si estás en la UE no puedes usarla bajo esa licencia** |
| Wan 2.5 / 2.6 / 2.7 / 3.0 | — | **Sin pesos abiertos** ⚠️ (solo API de pago) | — | Ojo: mucho blog los lista como si fueran abiertos |
| MiniMax H3 (33B) | — | Licencia comunitaria, **no válida en EE. UU.** ⚠️ | — | Descartado salvo que lo verifiques |

### Identidad consistente y personajes

- **Wan 2.2 Animate / Wan-Animate-2**: anima un personaje de referencia con el movimiento de un video, o reemplaza al personaje. https://github.com/Wan-Video/Wan-Animate-2 ✅ (la config por defecto es para 8× A800; hay variante *Lite* y soporte ComfyUI). Flujo nativo: https://docs.comfy.org/tutorials/video/wan/wan2-2-animate
- **Phantom** (sujeto→video con referencias): https://github.com/Phantom-video/Phantom ✅. Combinado con VACE: https://huggingface.co/Inner-Reflections/Wan2.1_VACE_Phantom
- **Stand-In** (identidad con ~1 % de parámetros extra): https://github.com/WeChatCV/Stand-In ✅
- **Motion Mirror** (transferencia de movimiento local sobre Wan2.1-VACE, desde 9 GB): https://github.com/halli75/motion-mirror ✅
- **LTX-2.3 ID-LoRA / IC-LoRA Ingredients**: personalización por imagen+audio de referencia: https://huggingface.co/Comfy-Org/ltx-2.3 ✅

### Hablar / lip-sync desde una imagen

- **InfiniteTalk** (Apache-2.0): https://github.com/MeiGen-AI/InfiniteTalk ✅ · flujo ComfyUI: https://docs.comfy.org/tutorials/video/wan/wan-infinitetalk
- **Wan2.2-S2V-14B**: audio → video: https://comfyui-wiki.com/en/tutorial/advanced/video/wan2.2/wan2-2-s2v
- **OmniAvatar**: https://github.com/Omni-Avatar/OmniAvatar ✅
- **LTX-2.3 IA2V**: imagen + audio → video con labios sincronizados (viene en ComfyUI).

### Imágenes de partida (el paso que más pesa en el realismo)

| Modelo | Licencia | Notas |
|---|---|---|
| **Z-Image Turbo / Base** (6B) | Apache-2.0 ⚠️ | Muy buena piel, corre en 16 GB (hay tiers de 8 y 6 GB), fácil de entrenar |
| **FLUX.2 klein 4B** | Apache-2.0 ⚠️ | ~13 GB; la versión **FLUX.2 dev (32B) es no comercial** |
| **Qwen-Image / 2512** (20B) | Apache-2.0 ⚠️ | Pesado; GGUF Q8 ~21 GB |
| Nano Banana (Google) | Servicio | Gratis con límites; el favorito en X para stills |

**Entrenar tu propia cara/personaje (LoRA):** `ostris/ai-toolkit` (MIT), 15–20 fotos variadas, referencia de 24 GB de VRAM ⚠️. Consejo repetido por varios: describe en el caption la escena, **no la cara**, y deja que la palabra-gatillo "sea" la cara.

### Base de todo

- **ComfyUI** (https://github.com/comfyanonymous/ComfyUI) con los nodos de Wan/LTX; `ComfyUI-WanVideoWrapper` de Kijai para las cosas de identidad; `ComfyUI-GGUF` para modelos cuantizados.
- **Wan2GP** (WanGP): app de muy poca VRAM, buena si tu GPU es pequeña ⚠️.

## 4. Servicios con capa gratis (⚠️ todo cambia rápido; verifica antes)

| Servicio | Gratis | Pegas |
|---|---|---|
| Kling | ~66 créditos/día | 720p, marca de agua, no comercial |
| Veo 3.1 (Google Flow) | ~50 créditos/día | Marca visible o SynthID |
| Hailuo | Tier gratis | Marca, no comercial, cola lenta |
| Seedance (Dreamina/CapCut) | Algo de crédito | Fuentes se contradicen sobre la marca de agua |
| Nano Banana (imágenes) | Sí, con límites | — |

Los de pago más citados en X: **Kling 3 y Seedance 2** ("reyes de la colina"), Veo 3.1, y agregadores como Higgsfield. Los planes de entrada de este tipo de servicios rondan los 7–10 USD/mes según blogs ⚠️.

## 5. Qué vamos a necesitar

**Ruta A: 100 % gratis y local (recomendada para aprender y para sin marcas de agua)**
- GPU NVIDIA: 8 GB (lento, 480p, Wan 2.2 GGUF) · 16 GB (LTX-2.3 FP8 borradores, HunyuanVideo 1.5 480p) · 24 GB (Wan 2.2 5B 720p, LTX 720p) · 32 GB (LTX-2.5 oficial).
- 100–200 GB de disco (LTX-2.5 solo son ~66 GiB).
- ComfyUI, cuenta de Hugging Face (algunos pesos piden aceptar términos), Python/git.
- Edición: CapCut o DaVinci Resolve (gratis). Voz: audio nativo del modelo o TTS abierto.
- **Sin GPU:** Google Colab gratis (T4, ~16 GB) con GGUF de Wan 2.2 + LightX2V ⚠️ (hay notebooks para Colab/Kaggle; las sesiones se cortan). Alquilar GPU cuesta ~0.35–3.20 USD/hora ⚠️.

**Ruta B: gratis en la nube, más rápido y peor control**
- Nano Banana para stills → créditos diarios de Kling/Veo/Hailuo → CapCut. Asume marca de agua y uso no comercial.

**Ruta C: de pago, mejor calidad**
- Kling 3 / Seedance 2 / Veo 3.1 (directo o vía Higgsfield, etc.).

**Flujo mínimo (Ruta A):**
1. Still realista (Z-Image / FLUX.2 klein), con LoRA de tu cara si quieres salir tú.
2. I2V con Wan 2.2 o LTX → clips de 4–6 s, una acción por plano.
3. Si habla: InfiniteTalk / Wan2.2-S2V / LTX IA2V con audio propio.
4. Montaje, color y sonido en CapCut/DaVinci.
5. Publicar **con etiqueta de IA**.

## 6. Legal y plataformas (léelo antes de publicar famosos)

- **UE, AI Act art. 50:** desde el **2 ago 2026** los deepfakes deben llevar divulgación visible; el marcado técnico para sistemas ya existentes tiene prórroga hasta el 2 dic 2026 ⚠️. Multas citadas: hasta 15 M € o 3 % de facturación.
- **España:** el Consejo de Ministros aprobó (7 jul 2026) un proyecto de ley orgánica que considera ilícito usar voz/imagen de alguien sin permiso con IA para publicidad/comercial. **Todavía en el Congreso** ⚠️.
- **Dinamarca:** proyecto L 49 (presentado 8 oct 2026) para tratar cara/voz como algo protegido, hasta 50 años tras la muerte. **Aún no es ley** ⚠️.
- **EE. UU.:** NO FAKES Act (S. 4591) avanzó en el Comité Judicial del Senado (18 jun 2026), **no es ley**; mientras tanto mandan leyes estatales (Tennessee ELVIS, Illinois) ⚠️.
- **Plataformas:** X elimina medios sintéticos engañosos que puedan causar daño; YouTube, TikTok y Meta exigen etiquetar contenido realista generado con IA; YouTube lista expresamente "usar la semejanza de una persona real" ⚠️.
- **Licencias de los modelos:** revisa el archivo de licencia oficial de cada uno. Los blogs se contradicen (por ejemplo, con LTX: el README oficial dice Apache-2.0 para el código y *Community License* para los pesos).
- **Regla práctica:** consentimiento + etiqueta + sin engaño (ni anuncios con famosos, ni política, ni sexual, ni voces clonadas).

## 7. Lo que NO incluí y por qué

- Hilos/guías de X para **saltarse los filtros de figuras públicas** en Kling/Seedance/Veo.
- Repos de **face-swap en vivo** y **clonación de voz de personas reales**: su uso principal con famosos es justo el caso de riesgo. Si quieres cambiar tu cara por otra tuya o de alguien que consintió, se puede plantear aparte.

## 8. Límites de esta investigación

- No pude abrir los hilos de X (bloquean la lectura); no usé el API de X ni Apify.
- Gran parte de las fuentes de comparativas/precios son blogs comerciales; las cifras de VRAM y créditos gratis son orientativas.
- Contradicciones que quedaron abiertas: marcas de agua de Seedance gratis y cuánto Kling/Veo realmente bloquean hoy.

## 9. Próximos pasos posibles

1. Script/notebook listo para correr Wan 2.2 I2V en Colab (GGUF + LightX2V).
2. Plantilla de prompts por plano + hoja de personaje para una pieza de 30–60 s con un personaje sintético o tu cara.
3. Escaneo más profundo de X con Apify (puede costar créditos) para sacar los hilos con más tracción.

---

## Fuentes principales

- Wan 2.2: https://github.com/Wan-Video/Wan2.2
- Wan-Animate-2: https://github.com/Wan-Video/Wan-Animate-2
- LTX-2.5: https://github.com/Lightricks/LTX-2 · LTX-2.3 en ComfyUI: https://docs.comfy.org/tutorials/video/ltx/ltx-2-3
- HunyuanVideo 1.5 + licencia: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5
- Phantom: https://github.com/Phantom-video/Phantom · Stand-In: https://github.com/WeChatCV/Stand-In
- Comparativa de modelos abiertos (VRAM, licencias): https://quantacloud.net/guides/open-source-video-generation-models · https://vidwip.com/blog/best-open-source-ai-video-models
- Open-weights de imagen y LoRA: https://localaimaster.com/blog/ai-toolkit-lora-training-guide
- Hilos en X: https://x.com/techhalla/status/1996370214750130557 · https://x.com/shalevhvs/status/2023039758893560177 · https://x.com/DeRonin_/status/2056519103066538275 · https://x.com/higgsfield_ai/status/2086868408319254972 · https://x.com/vladimircherner/status/1997963128668041394
- Tiers gratis: https://scrimba.com/articles/free-ai-video-generators-2026/ · https://crepal.ai/blog/aivideo/best-free-ai-text-to-video-generators/
- AI Act art. 50: https://artificialintelligenceact.eu/transparency-rules-article-50/
- NO FAKES Act: https://www.govtrack.us/congress/bills/119/s4591
- España (proyecto de ley): https://www.mjusticia.gob.es/en/institucional/gabinete-comunicacion/noticias-ministerio/Nueva-ley-derecho-honor
- Dinamarca: https://www.euronews.com/2026/10/08/denmark-introduces-a-bill-protecting-peoples-faces-and-voices-from-deepfakes
- Política de X sobre medios sintéticos: https://help.twitter.com/en/rules-and-policies/manipulated-media

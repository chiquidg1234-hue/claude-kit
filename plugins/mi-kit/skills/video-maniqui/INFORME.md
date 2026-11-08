# Informe v2: fuentes, diagnóstico y plan

Fecha: 2026-11-07. Fuentes leídas en solo lectura; no se ejecutó código de terceros.
**No verificado** = lo conozco solo por el resumen de los posts de X, no por la fuente original.

## Fase 1. Informe de fuentes

### Posts de X (leídos vía api.fxtwitter.com; las cifras de vistas/ingresos son de los autores)

| Fuente | Qué es / qué afirma | Técnica clave | Verificable | Anécdota / no verificado | Sirve para v2 | Riesgo |
|---|---|---|---|---|---|---|
| @flxrnc "Motion Lab" | Guía de 3 animaciones hechas por Claude; prompt vago vs dirigido | Claude escribe HTML/three.js, Chrome headless pinta cada frame, ffmpeg une | El método (lo probamos en v1 y funciona) | 1.8M y 3.6M vistas de terceros; tiempos de 30/90 min; ~60% del artículo lo leí solo resumido | Principios de animación (anticipación, overshoot, springs), "cheat sheet" de easing | Ninguno |
| @seeconvm "lo que esconden los videos de un prompt" | Los virales usan un brief largo (~9,500 caracteres), referencias y un crítico | 8 piezas: frame function, rig con CLAUDE.md, brief, referencia, estados, springs + sonido en el mismo reloj, crítico, skill | Repos de JohnHeibel (abajo) | Cifras de vistas de @twoclipping, Donald, etc.; que achxvi venda el servicio | Sonido generado en el mismo reloj que la imagen; crítico con hoja de contacto | Ninguno |
| @theoxmotion "10 formatos por $0" | 10 formatos faceless reconstruidos como setups gratis | Ver tabla de formatos | Solo los repos de terceros que enlaza | Sus 3 repos (whatif-3d-studio, story-video-studio, explainer-reel-studio) **no son públicos o no existen**: no pude leerlos. "58.6M vistas" de You Built It; ratings de un "rater" que es otro Claude, no gente real | Ideas de formato | Calificaciones infladas por un juez IA |
| @TemsYanik "cartoons con Claude" | Pipeline Remotion + SVG + Rhubarb + Whisper | Personaje SVG con 8 bocas, scenes.json, captions con zonas seguras | Rhubarb (MIT), Whisper (MIT) | **"$600–3,000/mes"** y "cuentas nuevas ya ganan dinero": sin pruebas | Zonas seguras (120 px arriba, 320 px abajo), paleta fija, fuente 72 px | Promesa de ingresos tipo gancho comercial |
| TikTok @migue.baena | Aviso: revisa las skills antes de instalarlas; recomienda SkillSpector | Escaneo estático de skills | SkillSpector es real: NVIDIA, Apache-2.0, github.com/NVIDIA/skillspector | — | Regla de seguridad para mi-kit | El link de su descripción (`skill-spectre-secure.base44.app`) **no es de NVIDIA**: no usarlo |

### Los 10 formatos de @theoxmotion

| # | Formato | Herramienta/repo | Costo / licencia | Estado | Para v2 |
|---|---|---|---|---|---|
| 1 | "What if" 3D en un patio (estilo You Built It) | Theoxmotion/whatif-3d-studio + Blender | Blender GPL, gratis | Repo inaccesible → **no verificado** | Idea de diorama 3D con escala |
| 2 | Historia de supervivencia con monitos de palitos | Theoxmotion/story-video-studio | ? | Repo inaccesible → **no verificado** | — |
| 3 | Reel explicador tipo clase | Theoxmotion/explainer-reel-studio (basado en prompt de @finnardley) | ? | Repo inaccesible → **no verificado** | — |
| 4 | Morph de UI (@twoclipping), una forma que cambia 8–12 veces a 120 BPM | Plantilla en el post | Música Mixkit (licencia Mixkit) | **No verificado** | Cortes en la rejilla del tempo |
| 5 | Explicador espacial 30 s (@finnardley) | Prompt en el post, WebGL | ElevenLabs opcional | **No verificado** | Mascota + globo 3D |
| 6 | Caricaturas "What if" 2D | kelano86/what-if-animation | MIT; necesita ElevenLabs (plan gratis no comercial) | **Leído** | 27+ cortes/min, un efecto por acción, ambiente por lugar, master a −14 LUFS |
| 7 | Animate (Chase AI) | cth9191/animate | MIT | **Leído** | `craft.md`: algo nuevo cada 2–4 s, silencio antes del clímax, springs, zonas seguras x 60–940 / y 250–1500 |
| 8 | 66 estilos de cine | lemomo-ai/lemo-opuscar | MIT; samples CC0/CC-BY | **Leído** | Kokoro TTS offline, muestras orquestales CC0 (VSCO 2 CE, VCSL), faster-whisper |
| 9 | 120 muestras de movimiento | showheyohtaki/motion-prompt | MIT, uso comercial OK si mantienes la línea de crédito | **Leído** | Vocabulario de movimientos de cámara (whip pan, dolly zoom…) |
| 10 | B-roll gratis de archive.org (@ElliotPadfield) | API de archive.org | Gratis; cada archivo tiene su propia licencia | **No verificado** | No aplica (todo es 3D propio) |

### Repos leídos (y uno más)

| Repo | Qué es | Licencia | Útil para v2 |
|---|---|---|---|
| JohnHeibel/ClaudeAnimationBase | Kit p5.js + p5.brush para animar a "Clawd"; storyboard → build → hoja de contacto | MIT | Bucle de revisión: hoja de contacto + "strip" de cada frame de un momento + recortes |
| JohnHeibel/PDoomVideo | Video musical de 156 s hecho por Opus con subagentes en paralelo | Sin LICENSE; la canción es de terceros | Escenas que se encadenan con transiciones; render por workers |
| remotion-dev/skills | Skills oficiales de Remotion | Sin LICENSE en el repo; Remotion es gratis solo para personas y empresas de hasta 3 empleados | No lo uso: three.js ya basta |
| heygen-com/hyperframes | HTML → MP4 determinista para agentes | Apache-2.0 (su app Pro es de pago) | Misma idea que mi `seek(t)`; no hace falta |
| DanielSWolf/rhubarb-lip-sync | Sincronía de labios desde audio | MIT | No aplica: los maniquíes no tienen boca |
| openai/whisper | Transcripción | MIT | Uso faster-whisper (MIT) para alinear palabra por palabra |
| Videos de YouTube (walkthrough y tutorial de Chase AI) | — | — | No los vi (instrucción tuya) |

## Fase 2. Diagnóstico del v1 (Waterloo, 64 s)

Medido: 8 planos en 64 s = **7.5 cortes/min** (planos de 6–12 s); frame 0 **negro** (fundido de entrada);
**−17.3 LUFS**, rango dinámico **2.5 LU** (todo suena igual); subtítulos con tiempos **estimados** por número de letras.
Referencia viral (kelano86, cth9191): 20–30+ cortes/min, algo nuevo cada 2–4 s, −14 LUFS, un efecto por acción.

| # | Defecto | Causa | Solución concreta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 1 | Hook débil: frame 0 negro, título tranquilo | Fundido de entrada y plano general lento | Frame 0 con acción ya en curso (cañonazo a cámara) + una cifra gancho en texto grande | Alto | Bajo |
| 2 | Ritmo lento (7.5 cortes/min) | 1 plano por frase | ~25 planos de 1.5–3 s anclados a palabras de la narración | Alto | Medio |
| 3 | Final que no invita a nada | Cierra con texto y fundido | Pregunta polémica real ("¿Quién ganó Waterloo: Wellington o Blücher?") + último plano que empata con el primero (loop) | Alto | Bajo |
| 4 | Subtítulos desfasados | Tiempo repartido por letras | faster-whisper con timestamps por palabra; resaltado palabra a palabra | Alto | Bajo |
| 5 | Audio plano y "de juguete" | Drone senoidal + redoble sintético, sin capas | Música con samples orquestales CC0 (timbales, cuerdas, metales) + efectos en capas por acción (cañón = crack + sub + cola; descargas de mosquetes, cascos, pasos, multitud) + whooshes/risers en cortes + ducking + master a −14 LUFS / −1 dBTP | Alto | Medio |
| 6 | Cámara de documental lento | Dollies lineales | Planos cortos con punch-in, shake en impactos, whip pans entre planos, cámara lenta en el clímax | Alto | Medio |
| 7 | Imagen plana | Sin post-proceso; humo de esferas sólidas | Post-proceso: bloom, profundidad de campo (look de diorama), etalonaje cálido/frío, viñeta, aberración leve; humo con sprites suaves y opacidad por partícula; chispas y polvo | Alto | Medio |
| 8 | Poses rígidas, sin peso | Ángulos fijos, sin inercia | Springs, retroceso al disparar, caídas al recibir disparos, variación por soldado, respiración/balanceo en reposo | Medio | Medio |
| 9 | Batalla sin escala | 60–120 figuras visibles | 600+ maniquíes instanciados, cañones, banderas ondeando, humo de fondo | Medio | Medio |
| 10 | Detalle pobre de maniquí/uniforme | Primitivas sin accesorios | Correajes blancos cruzados, chacós con placa, banderas, cañones de madera | Medio | Bajo |
| 11 | Escenas que no se leen a tamaño de celular | Planos aéreos con figuras de 10 px | Regla: lo importante ≥ 100 px; vistas aéreas solo con etiquetas grandes | Medio | Bajo |
| 12 | Zonas seguras sin comprobar | Diseño a ojo | Contenido en x 60–940, y 250–1500; subtítulos ≤ y 1500 | Bajo | Bajo |
| 13 | Voz robótica en español | Piper es_MX | v2 en inglés: probar Kokoro y Piper y elegir con Whisper | Medio | Bajo |

## Fase 3. Plan v2 y resultado

Orden aplicado (impacto/esfuerzo): 1) gancho, final con pregunta y loop, subtítulos con Whisper;
2) ritmo de cortes, audio en capas, cámara, post-proceso; 3) animación, escala, detalle.

**Voz (decidido rápido):** probé Kokoro `am_michael`, `bm_george`, `am_onyx` y Piper `ljspeech`, y evalué con Whisper.
Gana Kokoro `am_michael` (confianza 0.965, tono grave, Apache-2.0) a 1.12×. Descarté Piper `ryan` por licencia **no comercial**.

**Datos verificados:** bajas ≈ 15,000 (Wellington) + 8,000 (Blücher) + 25,000 franceses muertos y heridos (Britannica) → "nearly 50,000 killed or wounded";
lluvia nocturna y ataque hacia las 11:30; ningún cuadro británico roto por la caballería; prusianos por el flanco (Plancenoit) por la tarde;
la Guardia rechazada y el grito "La Garde recule!"; abdicación el 22 de junio (4 días después); muerte en Santa Elena en 1821.

| Métrica | v1 | v2 |
|---|---|---|
| Frame 0 | negro | imagen + "50,000" |
| Cortes por minuto | 7.5 | 31.6 (30 planos, ninguno > 4 s) |
| Subtítulos | estimados | palabra a palabra (Whisper); desfase medio 67 ms vs lo que se oye en el MP4 |
| Inteligibilidad (Whisper sobre el MP4 final) | — | 95.7% de palabras (lo que falla es formato: "18"→"18th", o la pronunciación de Blücher) |
| Loudness (MP4 final) | −17.3 LUFS, LRA 2.5 | −14.5 LUFS; pico −1.7 dBFS (ligero) / −0.2 dBFS (HQ) |
| Música | 1 drone + redoble sintético | partitura con samples CC0 (cellos, violines, trompa, trombón, tuba, timbales, bombo, caja) por secciones |
| Efectos | 4 tipos | 30+ cues en el reloj de la imagen (cañón en capas, voleas, cascos, pasos, multitud, lluvia, trueno, olas, latido, whooshes, risers) |
| Silencio antes del clímax | no | música a −39 dB y luego el golpe del clímax |
| Final | texto + fundido | pregunta "¿Wellington o Blücher?" + vuelve al primer plano (loop) |

**Errores encontrados por la revisión (y corregidos):** cámara sin la altura del terreno (encuadraba caderas); bucle infinito en la
partitura por redondeo; efectos encima de palabras ("flank" → "flag"); el título era más fuerte que el clímax; un plano final de 4.9 s;
el AAC subía el pico a **+1.6 dBFS** (saturaba) aunque el WAV estaba a −1.2: ahora el master va a −2.5 dBTP; time-lapse tapado por una granja y Santa Elena casi negra (re-renderizados); profundidad de campo que dejaba **negros** los frames alternos (el buffer de profundidad alterna entre frames); maniquíes sin cara
que no se sabe si van o vienen (se añadió una nariz); renderizar en paralelo no acelera con GPU por software.

**Fuentes de audio:** samples VSCO 2 CE (CC0 1.0, Versilian Studios); todos los efectos sintetizados en `score.py`; voz Kokoro-82M (Apache-2.0).

## Lo que NO pude comprobar
- **Cómo suena de verdad:** no puedo escuchar. Medí loudness, picos, secciones y lo que entiende Whisper, pero la calidad musical,
  lo natural de la voz y si los efectos sintetizados (multitud, gritos) suenan creíbles los tiene que juzgar un oído humano.
- **Pronunciación de Blücher:** escribí "Blooker"; Whisper oye "Blucker/Booker". El subtítulo dice "Blücher".
- **El clímax no es el momento más fuerte:** quedó entre los 5 más fuertes, a 1.3 dB del pico (el título "WATERLOO" y la descarga de mosquetes suenan un poco más). Lo medí; no lo puedo juzgar de oído.
- **Rendimiento en TikTok:** ninguna métrica de vistas o retención; las reglas de ritmo vienen de repos de terceros, no de datos propios.
- **Cifras de ingresos** de los posts ($600–3,000/mes, millones de vistas): sin pruebas.
- **Repos de @theoxmotion** (3) y los formatos 1–5 y 10: solo conocidos por el resumen del post.
- **Videos de YouTube/TikTok** citados: no los vi (instrucción del usuario).
- **Windows:** el pipeline v2 solo está probado en Linux.

---

# Sesión 3 (2026-11-08): 3 TikToks y formato what-if

Con tu permiso, descargué los 3 videos con yt-dlp (como datos: solo ffmpeg/Whisper, nada ejecutado) y los "vi" por hojas de contacto (1 frame cada 2 s),
transcripción (faster-whisper small.en) y loudness (ebur128).

| Video | Métricas públicas | Qué es | Lo mejor para copiar (la receta, no el video) |
|---|---|---|---|
| lunarcheeseee — What if the Earth stopped spinning? | 30.2M vistas, 3.6M likes, 80 s | 1 plano desde un balcón, gente low-poly | **Sin voz**; contador "EARTH'S SPIN 1,037 mph" que baja todo el video; frase serif cada 4–6 s; escalada; tarjeta final con la pregunta; LRA 18 LU (silencio → caos) |
| man_ia_c — What if electrons disappeared for 5 s? | 18.7M vistas, 2.2M likes, 80 s, 576 px | plano continuo que viaja | **Sin voz**; "ELECTRONS RETURN IN 0:04.913" + "TIME SLOWED DOWN 11×"; cambio de estilo (realista → wireframe) como escalada; palabra clave en color |
| vibecodingiseasy — Cómo se hacen los what-if | 336K vistas, 135 s, con voz | tutorial con Claude Code | Pregunta en 0–2 s, un número que corre, frase cada pocos s, cada paso peor, ciencia real ("los comentarios van a comprobar"), **una imagen por frase antes del render** |

Prueba: **"What if a nuclear bomb went off 6 miles away?"** (51.5 s, sin voz), con `motor/whatif.html` + `episodios/nuclear`.
Datos: Glasstone & Dolan (frente de 1 Mt a ~5.1 km a 11 s y ~15.3 km a 37 s → ~23 s a 10 km), NUKEMAP (3er grado hasta ~13 km con 1.2 Mt),
FAS 2026 (~12,187 cabezas → "about 12,000"). Notas para Obsidian en `/obsidian` del repo.

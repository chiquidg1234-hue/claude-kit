# Cómo crear apps de calidad con Claude Code — Informe y clasificación

**Fecha de la investigación:** 12-nov-2026 · **Para:** chiqui / `claude-kit`

---

## 0. Resumen en 60 segundos

1. **La regla número uno** (la repiten la documentación oficial de Anthropic y Boris Cherny, creador de Claude Code): *dale a Claude una forma de comprobar su propio trabajo que dé "pasa / no pasa"*. Boris dice que eso multiplica la calidad por 2–3. Todo lo demás es secundario.
2. **El ciclo ganador:** `Entrevista → SPEC.md → Plan mode → construir en trozos pequeños → verificar en navegador real → revisión con contexto limpio → ship`.
3. **Para que la UI no parezca "hecha por IA":** skill oficial `frontend-design` + `shadcn/ui` (con su MCP) + una dirección visual elegida a propósito antes de escribir código.
4. **Para saber que la app está bien:** 6 niveles (sección 4): build/tests → flujos E2E → comparación visual con capturas → accesibilidad + rendimiento → seguridad → ojo humano. Lo medible va en un *Stop hook* o en CI, no en una frase de `CLAUDE.md`.
5. **Casi todo lo bueno es gratis y open source** (Claude Code en sí necesita plan de pago o API key). Lo de pago es opcional (Figma, 21st.dev Pro, Magic UI Pro…).
6. **Cuidado con la seguridad:** las apps hechas con IA fallan sobre todo en secretos expuestos, permisos de base de datos (RLS) y rutas sin autenticar. Y las skills/plugins/MCP de terceros se ejecutan con tus permisos.

---

## 1. Cómo se hizo esta investigación (y sus límites)

**Lo que hice**
- Leí directamente la documentación oficial de Anthropic (`code.claude.com/docs/en/best-practices`), su post de ingeniería *Harness design for long-running apps* (24-mar-2026), *Improving frontend design through Skills*, el Cookbook y los repos `anthropics/skills` y `anthropics/claude-plugins-official`.
- Saqué métricas de repos (estrellas, licencia, fecha de creación) de las páginas de GitHub el 12-nov-2026.
- Recuperé hilos de X mediante lectores de hilos (Thread Reader, Unroll) y con un agente de búsqueda web (Nimble) que devolvió posts y artículos de X.
- Leí comparativas y guías de terceros (marcadas como tales).

**Límites que debes saber**
- **No tengo acceso directo a X** (no inicia sesión ni se puede rastrear de forma fiable). Todo lo de X llega por copias de hilos o por buscadores. Las cifras de "vistas" son las que reportan esas fuentes.
- **No instalé ni probé ninguna herramienta.** Las recomendaciones son por lectura y consenso, no por pruebas mías. En la sección 7 propongo qué probar primero.
- **Las comparativas de terceros se contradicen** (nombres de modelos, precios, planes gratis, benchmarks). Por eso no clasifico agentes por benchmarks. Lo marco como "reportado" donde aplica.
- Estrellas de GitHub ≠ calidad. Sirven como señal de adopción, no de que sea bueno ni seguro.
- El agente Nimble corrió en modo `no_trust` (sin verificación por afirmación). Lo que solo salió de él y no pude contrastar lo marco como "dato Nimble" o "reportado"; lo que coincide con una segunda fuente (p. ej. `claude -w`, `/simplify`) lo cito sin marca.
- Los símbolos 🟢/🟡/🔴 del coste vienen de las páginas de cada herramienta o de comparativas; los precios cambian a menudo, confírmalos antes de pagar.

**Cómo leer la clasificación**

| Tier | Significado |
|---|---|
| **S** | Imprescindible. Hazlo desde el día 1. |
| **A** | Muy recomendado. Añádelo cuando el proyecto lo pida. |
| **B** | Útil según el caso, o con reservas. |
| **C** | Opcional / solo si tienes una razón concreta. |

Columna **Coste**: 🟢 gratis/open source · 🟡 gratis con límites o parte de pago · 🔴 de pago.

---

## 2. La receta: el ciclo que repiten los que lo hacen bien

| # | Paso | Qué hacer | Fuente |
|---|---|---|---|
| 1 | **Aclarar** | No saltes a código. Pide: *"Entrévistame hasta poder escribir la especificación y guárdala en SPEC.md"*. | Docs oficiales |
| 2 | **Sesión nueva** | Empieza a construir desde `SPEC.md` en una sesión limpia: contexto limpio + definición escrita de "terminado". | Docs oficiales |
| 3 | **Plan mode** | `Shift+Tab` ×2. Itera el plan hasta que te guste; luego auto-accept. Si algo se tuerce, vuelve a plan mode en vez de seguir empujando. | Boris Cherny (X, ene-2026) |
| 4 | **MVP primero** | Versión mínima funcionando, luego añade una función a la vez. No intentes "one-shot" toda la app. | Ian Nuttall (X) |
| 5 | **Dirección visual** | Elige estilo, paleta y tipografías a propósito *antes* de construir (skill `frontend-design`). | Anthropic |
| 6 | **Construir con lo que ya existe** | Componentes reales (shadcn MCP), docs actuales (Context7). Nada de inventar JSX ni APIs. | Varios |
| 7 | **Verificar** | Abre la app en un navegador real, prueba flujos, mira consola, captura en móvil y escritorio, compara con el objetivo. | Anthropic + Boris |
| 8 | **Revisar con ojos nuevos** | `/code-review` (subagente que no vio tu conversación) o un subagente contra `SPEC.md`: *"reporta fallos que afecten la corrección y omite el estilo"*. | Docs oficiales |
| 9 | **Cerrar el bucle** | Tras cada corrección: *"Actualiza tu CLAUDE.md para no repetir este error."* | Boris Cherny |
| 10 | **Paralelizar** | 3–5 worktrees (`claude -w`), una sesión por tarea. "El mayor desbloqueo de productividad". | Boris Cherny |

> Nota del propio Anthropic: pedirle a un revisor que "encuentre problemas" siempre encontrará algo. Si arreglas todo, acabas con capas de abstracción y tests de casos imposibles. Por eso el `omite el estilo` importa.

---

## 3. Clasificación por categorías

### 3.1 Agente / plataforma para construir

| Tier | Herramienta | Coste | Para qué | Evidencia y reservas |
|---|---|---|---|---|
| **S** | **Claude Code** (terminal, VS Code, escritorio, web, móvil) | 🔴 plan Claude (≈$20/mes Pro según comparativas) o API | Base de todo este informe | Docs oficiales; es la herramienta de Boris. Por defecto arranca en *auto mode*, delega a subagentes y compacta solo. |
| **A** | **Cursor** | 🟡 | Iterar UI dentro del editor (diffs, vista previa) | El test de Render (sin fecha) lo puntuó 8 de media frente a 6,8 de Claude Code construyendo una sola app; otras comparativas lo recomiendan para iterar dentro del editor. Un solo caso medido. |
| **A** | **Google Antigravity** | 🟡 | Pulido de UI + probar en navegador | Un test de una sola app (DEV, 10-nov-2026): mejor pulido de UI. Evidencia delgada. |
| **B** | **OpenAI Codex CLI** | 🟡 incluido en planes ChatGPT | Primera pasada limpia; trabajos en CI | Mismo test: la "primera versión más limpia". Open source (Apache 2.0) según fuentes. |
| **B** | **Gemini CLI** | 🟢/🟡 | Open source, contexto grande | **Fuentes contradictorias** sobre su plan gratis: una dice 1.000 req/día vigentes, otra que ya no sirve cuentas gratis y manda a Antigravity CLI. Verifica antes de depender de él. |
| **B** | **Constructores "prompt → app"** (Lovable, Bolt, v0, Replit) | 🟡/🔴 (~$25/mes en Lovable/Bolt, según comparativas) | Prototipos rápidos, personas sin código | Comparativas de blogs, calidad variable. **v0** destaca en UI de React/Next; **Replit** trae hosting y base de datos; los costes pueden escalar. Para ti: úsalos como fuente de ideas visuales y construye en Claude Code. |
| **C** | OpenCode / Cline / Aider | 🟢 + tu API key | Libertad de modelo, auto-hospedaje | Solo si necesitas elegir proveedor. |

**Patrón común en 2026:** un editor para iterar visualmente + un agente de terminal para el trabajo autónomo largo. No hace falta elegir uno solo.

### 3.2 Metodología y paquetes de flujo de trabajo

| Tier | Herramienta | Coste | Qué aporta | Datos |
|---|---|---|---|---|
| **S** | **Plan mode + `CLAUDE.md` corto + tus propias skills** | 🟢 (integrado) | Lo esencial | Docs oficiales: `CLAUDE.md` <200 líneas, solo lo que Claude no puede deducir del código. |
| **S** | **obra/superpowers** | 🟢 MIT | Brainstorm → spec → plan → desarrollo con subagentes y TDD. Puede trabajar horas sin desviarse del plan. | ★316k. Instalable desde el marketplace oficial (`superpowers@claude-plugins-official`). **Ya está en tu kit.** |
| **A** | **garrytan/gstack** | 🟢 MIT | Roles (`/office-hours`, `/review`, `/qa` con navegador real, `/ship`, `/browse`) | ★141k, creado mar-2026. Requiere Bun. Su propio README sugiere empezar solo con `/review` y `/qa`. Los "20× más rápido que Claude for Chrome" son afirmación del autor. |
| **A** | **github/spec-kit** | 🟢 MIT | Desarrollo guiado por especificación | ★149k. Alternativa a superpowers: **elige uno**, no ambos. |
| **B** | **BMAD-METHOD** | 🟢 | Método ágil con roles | ★55k. Proceso más pesado. |
| **B** | **affaan-m/everything-claude-code (ECC)** | 🟢 MIT | "Sistema de optimización del harness": skills, memoria, seguridad | ★301k en 10 meses. Superficie enorme que no auditamos; más cosas = más contexto y más que revisar. |
| **B** | **davila7/claude-code-templates** | 🟢 MIT | Registro/CLI de agentes, comandos, hooks, MCP (aitmpl.com) | ★33k. |
| **B** | Plugin `ralph-wiggum` | 🟢 | Bucles largos sin supervisión | Lo menciona Boris para tareas muy largas; mejor con sandbox. |

### 3.3 UI y diseño

| Tier | Herramienta | Coste | Para qué | Notas |
|---|---|---|---|---|
| **S** | **Skill `frontend-design`** (Anthropic) | 🟢 | Obliga a elegir dirección estética antes de codificar; combate el "AI slop" (fuentes por defecto, degradados púrpura). Proceso: plan → revisar contra el brief → construir → autocrítica con capturas. Exige base de calidad: responsive, foco de teclado visible, `prefers-reduced-motion`. | Instalación: `/plugin install frontend-design@claude-plugins-official` (confirma el nombre en `/plugin` → Discover) o `npx skills add https://github.com/anthropics/skills --skill frontend-design`. Límite: sin un brief concreto da un resultado genérico. |
| **S** | **shadcn/ui + shadcn MCP** | 🟢 MIT | Componentes accesibles que **viven en tu repo** (copy-in, no dependencia). El MCP oficial busca e instala componentes de registros. | ★128k. `pnpm dlx shadcn@latest mcp init --client claude`. Requiere `components.json`. Es la base que usan v0, Bolt y Lovable. |
| **A** | **UI UX Pro Max** (skill) | 🟢 MIT | Generador de sistema de diseño: estilos, paletas, pares de fuentes. Útil al arrancar un proyecto. | ★148k. |
| **A** | **Google Stitch MCP** | 🟡 beta gratis con límite diario | Genera pantallas y variantes (HTML + Tailwind) para explorar direcciones; luego Claude lo pasa a React. | Sin spec compartida entre pantallas; el token OAuth caduca ~1 h. |
| **A** | **Figma MCP** (oficial) | 🔴/🟡 según plan | De frames a código, con variables y Code Connect. | Solo si tienes diseños. Necesita asiento/plan. |
| **A** | **Página `/ux` como contrato de diseño** | 🟢 | Una ruta que muestra todos los componentes permitidos; *si no está en `/ux`, no se envía*. | Truco de Sebastian Mertens (LinkedIn). Barato y muy efectivo para mantener coherencia. |
| **B** | **Magic UI / Aceternity UI / React Bits** | 🟡 (gratis + Pro de pago único) | Efectos animados para landings | Se instalan con el CLI de shadcn. **Revisa licencias** (React Bits: MIT + Commons Clause). |
| **B** | **21st.dev (MCP)** | 🟡 2 copias/día gratis | +12.000 componentes de la comunidad | Estilos desiguales; revisa la licencia de cada componente. |
| **B** | **HeroUI / Mantine / MUI** | 🟢 | Kit completo si no quieres ensamblar | Cada uno tiene MCP oficial. |
| **B** | **`web-artifacts-builder`** (Anthropic) | 🟢 | Andamio React + Tailwind + shadcn | Parte de `anthropics/skills`. |
| **C** | Storybook MCP / Mobbin MCP / Penpot MCP | 🟢/🟡 | Equipos con sistema de diseño / referencias / diseño open source | Solo con una necesidad concreta. |

**Cómo pedirle diseño bien (Anthropic Cookbook):** (1) guía dimensiones concretas — tipografía, color, movimiento, fondos; (2) da referencias de inspiración sin ser excesivamente prescriptivo; (3) **nombra los defaults que debe evitar**. Y di `be ambitious` cuando quieras estados vacíos, errores y navegación por teclado, no solo el layout.

### 3.4 Verificación en navegador (que Claude *vea* lo que construyó)

| Tier | Herramienta | Coste | Uso | Notas |
|---|---|---|---|---|
| **S** | **Claude in Chrome** (extensión oficial) | ❔ no verifiqué el coste/plan | Boris la usa para **cada cambio de UI** en claude.ai/code: abre el navegador, prueba, itera hasta que "el UX se siente bien". | Corre en tu navegador con tu sesión; no es headless. |
| **S** | **Playwright** (MCP de Microsoft o CLI) | 🟢 | Navegador headless, multi-viewport, capturas, E2E. Los snapshots de accesibilidad son mucho más baratos en tokens que las imágenes. | `claude mcp add playwright npx @playwright/mcp@latest`. Con `--scope project` genera un `.mcp.json` compartible. Currents recomienda **excluir `browser_run_code_unsafe`** del `.mcp.json` compartido (equivale a ejecución de código). Un análisis en vídeo reporta ~26K tokens/tarea con el CLI frente a ~114K con el MCP: sin verificar. **Ya está en tu kit.** |
| **A** | **Chrome DevTools MCP** (Google) | 🟢 Apache-2.0 | Consola, red, rendimiento y auditoría Lighthouse (`lighthouse_audit`) desde la sesión. | ★55k. Node ≥ 20.19. Mejor para depurar que para pruebas repetibles. |
| **B** | Script de capturas con Puppeteer en el repo | 🟢 | Lo más sencillo; documéntalo en `CLAUDE.md` | Opción de bajo nivel. |
| **B** | `gstack /browse` | 🟢 | Demonio Playwright rápido | Ver 3.2. |

**Bucle de verificación visual (receta de Anthropic):** *"[pega captura] implementa este diseño. Toma una captura del resultado, compárala con el original, lista las diferencias y corrígelas."* Fija viewports (p. ej. 390×844 y 1440×900), pide una **tabla** (elemento · esperado · actual · arreglo) y **limita a 2–3 rondas**: dos pasadas suelen cerrar la mayor parte de la brecha y más es gastar tokens (una guía lo cifra en ~70 % + ~25 %, medición de un solo autor). Los modelos critican bien jerarquía y ritmo, y mal las medidas exactas: combina con herramientas deterministas.

### 3.5 Controles de calidad (lo que da "pasa / no pasa")

| Tier | Control | Coste | Cómo |
|---|---|---|---|
| **S** | **Typecheck + lint + tests unitarios**, forzados con un **Stop hook** | 🟢 | `Stop` con `pnpm tsc --noEmit 1>&2 \|\| exit 2` (ejemplo oficial). El código de salida 2 impide que Claude termine; si bloquea 8 veces seguidas sin llamar a herramientas, el sistema lo suelta. |
| **S** | **Formateador en `PostToolUse`** (`Edit\|Write`) | 🟢 | Ejemplo oficial con Prettier; Boris lo llama "el último 10 %". |
| **S** | **E2E de los flujos críticos** con Playwright Test | 🟢 | Login, crear/editar/borrar, pago… Con `--repeat-each` y `trace: 'on-first-retry'` para cazar flakiness (Currents). |
| **A** | **Accesibilidad:** `@axe-core/playwright` | 🟢 | Etiquetas WCAG 2.x A/AA; criterio: 0 críticos/serios. Deque dice que axe detecta de media ~57 % de los problemas WCAG automáticamente → **mantén un repaso manual** (teclado, foco, contraste). |
| **A** | **Rendimiento:** Lighthouse / Lighthouse CI | 🟢 | `lhci autorun`. Presupuestos de ejemplo: rendimiento ≥ 0,9; accesibilidad ≥ 0,95; buenas prácticas ≥ 0,9. Core Web Vitals "buenos" (web.dev, percentil 75): **LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1**. |
| **A** | **Regresión visual:** `expect(page).toHaveScreenshot()` | 🟢 | Genera las líneas base en el *mismo entorno* donde pruebas (el render varía entre SO/navegador). `--update-snapshots` solo si el cambio es intencional. |
| **A** | **`/code-review`**, **`/verify`**, **`/goal`** | 🟢 | `/code-review`: revisión en subagente sin tu conversación. `/verify`: Claude construye y ejecuta la app y mira el resultado (atrapa lo que tests y typecheck no ven). `/goal`: condición que otro modelo comprueba tras cada turno, útil en ejecuciones largas. |
| **B** | **Bucle generador + evaluador** (Anthropic) | 🔴 en tokens | Un agente genera, otro evalúa con Playwright MCP contra 4 criterios (calidad de diseño, originalidad, oficio, funcionalidad), 5–15 iteraciones, hasta horas. Con "contratos de sprint" y umbrales duros. Para proyectos serios. |
| **B** | Agregadores tipo `sasonov/shipshape` | 🟢 | Reúne Lighthouse + axe + secretos + XSS + multi-viewport en un veredicto. No puedo avalar su madurez (repo pequeño). |

### 3.6 Contexto y documentación

| Tier | Herramienta | Coste | Para qué |
|---|---|---|---|
| **S** | **Context7** (upstash) | 🟢 MIT | Docs actualizadas de librerías → menos APIs inventadas. ★65k. **Ya está en tu kit.** |
| **A** | **`.claude/rules/` con `paths:`** y `CLAUDE.md` por subcarpeta | 🟢 | Reglas que solo se cargan donde aplican (`src/api/**`, `src/components/`). |
| **B** | `uithub.com` en vez de github.com | 🟢 | Contexto de repos amigable para LLM (consejo de Ian Nuttall, 2025). |

### 3.7 Dónde descubrir más (directorios)

| Tier | Recurso | Qué es |
|---|---|---|
| **S** | `anthropics/skills` (★193k) | Skills oficiales de referencia (frontend-design, webapp-testing, mcp-builder, skill-creator…). |
| **S** | `anthropics/claude-plugins-official` (★47k) | Marketplace oficial; `/plugin install nombre@claude-plugins-official`. |
| **A** | `hesreallyhim/awesome-claude-code` (★58k) | Índice comunitario curado. |
| **B** | `VoltAgent/awesome-claude-code-subagents` | 100+ subagentes. |
| **B** | `ComposioHQ/awesome-claude-skills` (~★79k, dato Nimble) | 1.000+ skills. |
| **B** | `mattpocock/skills` (dato Nimble) | `grill-me` (te entrevista antes de codificar), `handoff`. |

> **Regla de seguridad para todo directorio:** lee el `SKILL.md` y los scripts antes de instalar. Una skill se ejecuta con tus permisos. Anthropic lo avisa en su propio README: *"asegúrate de confiar en un plugin"*.

### 3.8 Seguridad

| Tier | Medida | Coste | Detalle |
|---|---|---|---|
| **S** | **Reglas `deny` para secretos** | 🟢 | `Read(./.env)`, `Read(./.env.local)`, `Read(./secrets/**)`. Valen en todos los modos. Ojo: no cubren un script que abra el archivo → añade el sandbox. |
| **S** | **`/sandbox`** (macOS, Linux, WSL2) | 🟢 | Limita archivos y red de los comandos de shell. Está **apagado por defecto**. |
| **S** | **No uses `bypassPermissions`/`--dangerously-skip-permissions` en tu portátil** | 🟢 | Solo en contenedores desechables. Boris no lo usa; pre-permite comandos seguros con `/permissions`. |
| **S** | **Checklist de apps con IA** | 🟢 | Ver abajo. |
| **A** | **`/security-review`** sobre la rama | 🟢 | Pasada de seguridad sobre los cambios; complemento, no sustituto de revisión humana. |
| **A** | **gitleaks / trufflehog / semgrep** | 🟢 | Secretos y sinks peligrosos, en pre-commit y CI. |
| **A** | **MCP con datos no productivos y aprobación manual** | 🟢 | Guía de Supabase: no conectes un agente a producción; cuidado con "Always approve" (fatiga). |

**Checklist mínimo para cualquier app que hagas** (de varias guías; las categorías son consistentes entre fuentes):
1. Ningún secreto en `NEXT_PUBLIC_*`/`VITE_*`/`EXPO_PUBLIC_*` ni en el historial de git. Si apareció una clave, **rota**: borrar el commit no la "des-filtra".
2. Supabase: **RLS activado en todas las tablas** con políticas ligadas a `auth.uid()` (no `true`); la `service_role` solo en servidor.
3. **Autenticación en cada ruta/acción de servidor**, no solo ocultar botones en la UI. Comprobación de admin en servidor.
4. Webhooks (p. ej. Stripe) con **verificación de firma**.
5. **Límites de uso y tope de gasto** en cualquier endpoint que llame a un LLM.
6. Verifica que **cada dependencia existe de verdad** antes de instalar (los LLM inventan nombres de paquetes y hay quien los registra con malware: *slopsquatting*).
7. Backups probados y guardados con credenciales que el agente no pueda tocar; entornos dev/prod separados.
8. Trata `CLAUDE.md`, `.cursor/rules` y archivos similares como código sensible (pueden esconder instrucciones con Unicode invisible).

> Incidentes y cifras concretas que aparecen en una de esas listas (borrados de bases de datos por agentes, CVE de herramientas, porcentajes de paquetes inventados) **no las verifiqué**; úsalas como motivo para el checklist, no como datos.

---

## 4. ¿Cómo sé que la app está bien? — Definición de "terminado"

La app pasa de nivel solo si **el nivel anterior está en verde**. Cada fila es "pasa / no pasa".

| Nivel | Qué se comprueba | Cómo | Pasa si |
|---|---|---|---|
| **0 · Compila** | Build, tipos, lint, unitarios | Stop hook: `tsc --noEmit` + lint + tests | Salida 0; consola del navegador sin errores ni 404 de assets |
| **1 · Funciona** | Los flujos críticos de punta a punta | Playwright E2E (y `/verify`) | Todos los flujos verdes **y estables** (`--repeat-each`); estados vacío, error y carga existen |
| **2 · Se ve bien** | Fidelidad al diseño, responsive | Capturas 390×844 / 768 / 1440×900 + tabla de diferencias; `toHaveScreenshot()` | Sin desbordamiento horizontal; ≤ 3 rondas; diferencias restantes aceptadas por ti |
| **3 · Se siente bien** | Accesibilidad y rendimiento | axe (0 críticos/serios) + Lighthouse | a11y ≥ 0,95 · rendimiento ≥ 0,9 · LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1; navegable con teclado y con foco visible |
| **4 · Es seguro** | Secretos, auth, RLS, dependencias | gitleaks, semgrep, `/security-review`, checklist 3.8 | Cero secretos expuestos; cada tabla con RLS; cada ruta autenticada |
| **5 · Pasa el ojo humano** | Lo que ninguna herramienta ve | Revisor con contexto limpio contra `SPEC.md` + tú usándola 10 min en el móvil | Cumple cada requisito de `SPEC.md`; nada te hace dudar |

**Pide siempre evidencia**, no resúmenes: el comando que ejecutó y su salida, o la captura. "Todos los tests pasan" a secas dice muy poco.

**Rúbrica de diseño de Anthropic** (útil para el nivel 2): *calidad de diseño* (coherencia), *originalidad* (decisiones propias, no plantillas ni defaults), *oficio* (jerarquía, espaciado, contraste) y *funcionalidad* (¿se entiende qué hace?). Anthropic pondera más diseño y originalidad, porque Claude ya cumple oficio y funcionalidad por defecto.

---

## 5. Qué dice X (hilos y personas)

> Enlaces a X: no pude abrirlos directamente; el contenido viene de copias de los hilos y del agente de búsqueda.

| Quién | Qué dijo | Enlace |
|---|---|---|
| **Boris Cherny** (creador de Claude Code) — *su setup* | 5 sesiones en paralelo en terminal + 5–10 en la web; plan mode casi siempre; `CLAUDE.md` compartido en git al que se añade cada error; slash commands en `.claude/commands/`; subagentes `code-simplifier` y `verify-app`; hook `PostToolUse` de formato; **no** usa `--dangerously-skip-permissions`; "dale a Claude una forma de verificar su trabajo, mejora 2–3×". | [x.com/bcherny/status/2007179832300581177](https://x.com/bcherny/status/2007179832300581177) |
| **Boris Cherny** — *10 consejos del equipo* (31-ene-2026) | 3–5 worktrees (el mayor desbloqueo); un Claude escribe el plan y otro lo revisa como "staff engineer"; "tras cada corrección: *actualiza tu CLAUDE.md*"; convierte en skill/comando lo que hagas más de una vez al día; *"Grill me… no hagas el PR hasta que pase tu prueba"*; *"Prueba que esto funciona"* (diff de comportamiento main vs rama). | [x.com/bcherny/status/2017742741636321619](https://x.com/bcherny/status/2017742741636321619) |
| **Boris Cherny** — *funciones poco usadas* (29-mar-2026) | `claude -w` (worktrees nativos), `/batch` y `/simplify`, `/loop`, hooks deterministas (SessionStart, PreToolUse, Stop…), extensión de Chrome para frontend. | [x.com/bcherny/status/2038454336355999749](https://x.com/bcherny/status/2038454336355999749) |
| **Garry Tan** (YC) | Liberó su setup (`gstack`): ~10K líneas y ~100 PR/semana según él; `/browse` con Playwright por CLI en lugar de MCP para no inflar contexto. | [github.com/garrytan/gstack](https://github.com/garrytan/gstack) |
| **Ian Nuttall** | Planifica más de lo que crees; MVP antes que "one-shot"; `CLAUDE.md` por subcarpeta ("el héroe olvidado"); `/clear` pronto; usa subagentes y *ultrathink* con moderación (gastan contexto); Playwright MCP para probar y **documenta cómo usarlo en `CLAUDE.md`**. | [Thread Reader](https://threadreaderapp.com/thread/1951243907628724725.html) |
| **Prajwal Tomar** | Playwright MCP + shadcn MCP como pareja para landings; define reglas de diseño (tipografía, espaciado, colores de marca) antes de empezar. | [Thread Navigator](https://threadnavigator.com/thread/1985715922464846206/) |
| **Brian Scanlan** (Intercom) | Sistema interno: 13 plugins, 100+ skills y hooks que fuerzan el flujo de PR a nivel de shell; telemetría de eventos del ciclo de vida. Muestra hasta dónde se puede escalar. | [Unroll](https://unrollnow.com/status/2033978300003987527) |
| **Cat Wu / Thariq** (Anthropic, charla jul-2026, vía transcripción de Simon Willison; dato Nimble) | Con cada modelo nuevo, **audita tu andamiaje** y quita lo que ya no hace falta; invierten en verificación/CI; "sé más ambicioso". Coincide con la sección "What you can stop doing" de la doc oficial. | [simonwillison.net/2026/Jul/21/cat-and-thariq](https://simonwillison.net/2026/Jul/21/cat-and-thariq/) |

**Consenso en X (2026):** verificación primero · paralelismo con worktrees · `CLAUDE.md` vivo y corto · skills para lo repetido · hooks para lo no negociable · MCP elegidos por fricción real, no por moda · UI = `frontend-design` + `shadcn/ui`.

---

## 6. Stack recomendado y comandos

### Mínimo viable (todo gratis salvo Claude Code)

| Capa | Elección |
|---|---|
| Agente | Claude Code |
| Método | Plan mode + `superpowers` (ya en tu kit) |
| UI | `frontend-design` + shadcn/ui (+ MCP) + Tailwind |
| Docs | Context7 (ya en tu kit) |
| Navegador | Claude in Chrome + Playwright (ya en tu kit) |
| Calidad | tsc/lint/tests (Stop hook) + axe + Lighthouse |
| Seguridad | deny `.env` + `/sandbox` + gitleaks + `/security-review` |

### Comandos (verifica nombres exactos en `/plugin` → Discover)

```bash
# Dentro de Claude Code
/plugin install frontend-design@claude-plugins-official
/plugin install superpowers@claude-plugins-official     # ya lo tienes vía superpowers-marketplace

# MCP
pnpm dlx shadcn@latest mcp init --client claude         # en proyectos con components.json
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest   # Node >= 20.19
claude mcp add --scope project playwright npx @playwright/mcp@latest         # ya lo cubre tu plugin playwright

# Calidad
npm i -D @axe-core/playwright @playwright/test && npx playwright install chromium
npm i -g @lhci/cli && lhci autorun
```

### `CLAUDE.md` de arranque para una app (corto a propósito)

```markdown
# Comandos
- Instalar: pnpm install
- Dev: pnpm dev   (http://localhost:3000)
- Un test: pnpm vitest run ruta/al/archivo.test.ts
- Tipos: pnpm tsc --noEmit
- E2E: pnpm playwright test

# Definición de terminado
- tsc, lint y tests en verde; sin errores en consola del navegador
- Verificado en navegador a 390x844 y 1440x900 (adjunta captura)
- No cierres con "listo" sin enseñar el comando ejecutado y su salida

# Diseño
- Dirección visual y tokens en docs/DESIGN.md (no inventes colores ni fuentes)
- Solo componentes de /ux (shadcn). Si falta uno, propónlo primero.

# Seguridad
- Nunca leas ni imprimas .env. Claves solo en servidor.
- Toda ruta nueva comprueba sesión. Toda tabla nueva lleva RLS.
```

### `.claude/settings.json` de proyecto (reglas sin excepciones → harness, no `CLAUDE.md`)

```json
{
  "permissions": {
    "allow": ["Bash(pnpm tsc --noEmit)", "Bash(pnpm vitest run *)"],
    "deny": ["Read(./.env)", "Read(./.env.local)", "Read(./secrets/**)", "Bash(git push --force*)"]
  },
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command",
          "command": "npx prettier --write --ignore-unknown \"$(jq -r '.tool_input.file_path')\"" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "pnpm tsc --noEmit 1>&2 || exit 2" }] }
    ]
  }
}
```

---

## 7. Plan para tu `claude-kit`

**Ya tienes:** `superpowers`, `playwright`, `context7`, `claude-code-setup`, `agent-browser`, `firecrawl`, `caveman`, `watch`, `ruflo-core`, y el skill `ojos`.

**Lo que falta frente a este informe (en orden de valor):**

| Prioridad | Qué añadir | Por qué |
|---|---|---|
| 1 | `frontend-design@claude-plugins-official` en `enabledPlugins` | Es el mayor salto de UI con menos esfuerzo; el marketplace oficial ya está registrado. |
| 2 | **Plantillas en `plugins/mi-kit/`**: `CLAUDE.md` de app + `settings.json` con hooks Stop/PostToolUse (sección 6) | Hoy el kit no impone con hooks ninguna verificación al terminar (solo hay reglas `deny`). Son proyecto-específicas, así que van como plantilla a copiar, no como ajuste global. |
| 3 | **Skill propia `verificar-app`** en `mi-kit` que ejecute los niveles 0–4 y devuelva el cuadro pasa/no pasa con evidencia | Convierte la sección 4 en un comando repetible. |
| 4 | Chrome DevTools MCP (alcance usuario) | Consola/red/Lighthouse en la sesión. |
| 5 | Añadir `Read(./.env*)` a `permissions.deny` | Hoy solo bloqueas `rm -rf /*` y `git push --force*`. |
| 6 | Revisar el peso de lo que ya está | Cada MCP/plugin añade contexto aunque no se use; tu README ya dice que el MCP de `ruflo-core` no conectó en la nube. Valora quitar lo que no uses. Y aplica la regla 3.7: revisa el código de plugins de terceros. |

No he cambiado ningún archivo del kit; esto es solo la propuesta.

---

## 8. Errores comunes que evitar

1. **Pedir la app entera de una vez.** → MVP, luego una función cada vez.
2. **`CLAUDE.md` gigante o con MAYÚSCULAS y "IMPORTANTE".** Si Claude sigue ignorando una línea, probablemente es un hook. Si tienes hooks para meras preferencias, bórralos.
3. **Fiarte de "ya está".** Exige comando + salida o captura.
4. **Bucles visuales infinitos.** Tope de 2–3 rondas y revisión humana.
5. **Revisor sin "omite el estilo".** Genera complejidad innecesaria.
6. **Demasiados MCP/plugins.** Cada uno cuesta contexto; instálalos por fricción real.
7. **Instalar skills sin leerlas** o elegir por estrellas.
8. **`bypassPermissions` en un portátil con credenciales reales.**
9. **Confiar solo en axe o en Lighthouse.** Detectan una parte; el repaso manual sigue haciendo falta.
10. **No revisar el andamiaje con cada modelo nuevo.** Lo que ayudaba al modelo anterior puede estorbar al actual.

---

## 9. Fuentes principales

**Oficiales (leídas directamente)**
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Harness design for long-running application development — Anthropic (24-mar-2026)](https://www.anthropic.com/research/harness-design-long-running-apps)
- [Improving frontend design through Skills — Claude](https://claude.com/resources/articles/improving-frontend-design-through-skills)
- [Prompting for frontend aesthetics — Claude Cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics)
- [frontend-design SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) · [anthropics/skills](https://github.com/anthropics/skills) · [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)

**Repos (métricas del 12-nov-2026)**
[obra/superpowers](https://github.com/obra/superpowers) · [garrytan/gstack](https://github.com/garrytan/gstack) · [github/spec-kit](https://github.com/github/spec-kit) · [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) · [shadcn-ui/ui](https://github.com/shadcn-ui/ui) · [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) · [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) · [context7](https://github.com/upstash/context7) · [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) · [claude-code-templates](https://github.com/davila7/claude-code-templates) · [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

**Hilos y comunidad**
[Boris Cherny, 10 consejos](https://threadreaderapp.com/thread/2017742741636321619.html) · [Boris Cherny, su setup](https://unrollnow.com/status/2007179832300581177) · [InfoQ: flujo de trabajo del creador](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/) · [Ian Nuttall](https://threadreaderapp.com/thread/1951243907628724725.html) · [Prajwal Tomar](https://threadnavigator.com/thread/1985715922464846206/) · [Brian Scanlan (Intercom)](https://unrollnow.com/status/2033978300003987527) · [Sebastian Mertens (LinkedIn)](https://www.linkedin.com/posts/auto-mate_you-can-scale-with-vibe-coding-if-you-do-activity-7367043521540681728-hkLx) · [Boris Cherny — Playbook](https://skzl-ai.github.io/boris-cherny-claude-code-playbook/)

**Verificación y UI (terceros)**
[Tech Arion: bucle de capturas + Playwright](https://techarion.com/blog/visual-feedback-loop-claude-screenshots-playwright-ui-qa) · [Claude Lab: auditorías axe-core con hooks](https://claudelab.net/en/articles/claude-code/claude-code-frontend-accessibility-audit-automation) · [Agentic Developer Cookbook: regresión visual](https://agenticdevelopercookbook.com/appendix/research/developer-tools/web/visual-regression-and-design-verification) · [Mowgli: flujo de UI](https://mowgli.ai/blog/claude-code-ui-design-workflow) · [AIDesigner: bucle diseño → captura → refinar](https://www.aidesigner.ai/blog/claude-code-frontend-design) · [Currents: Playwright MCP en CI](https://currents.dev/posts/claude-code-playwright-mcp-fix-tests-that-fail-in-ci) · [Comparativa de librerías de UI](https://tactileui.dev/blog/ui-component-libraries-compared-2026) · [21st MCP](https://21st.dev/mcp) · [Magic UI MCP](https://magicui.design/docs/mcp) · [MCP para diseño (Mowgli)](https://mowgli.ai/blog/mcp-servers-for-ui-design-2026) · [Servidores MCP de sistemas de diseño](https://www.md-design.io/learn/design-system-mcp-servers)

**Comparativas de agentes (calidad variable; contradictorias entre sí)**
[Codersera](https://codersera.com/blog/cursor-composer-vs-claude-code-vs-codex-vs-gemini-cli-2026/) · [Render](https://render.com/blog/ai-coding-agents-benchmark) · [DEV: misma app con 4 agentes](https://dev.to/yanni_goyal_5ddb75eb46482/i-built-the-same-app-with-cursor-copilot-codex-and-antigravity-heres-what-each-did-best-4d78) · [DeployHQ](https://www.deployhq.com/blog/comparing-claude-code-openai-codex-and-google-gemini-cli-which-ai-coding-assistant-is-right-for-your-deployment-workflow) · [AI Atlas](https://ai.ozdemir.be/guides/coding-agents-compared) · [Constructores de apps (Lovable, Bolt, v0, Replit)](https://toolradar.com/guides/best-ai-app-builders)

**Seguridad**
[Checklist vibe-coding-security](https://github.com/boxed-dev/vibe-coding-security) · [solo-builder-security-audit](https://github.com/ricardojpalves/solo-builder-security-audit) · [Supabase: defensa en profundidad para MCP](https://supabase.com/blog/defense-in-depth-mcp) · [Talk Think Do: comprobaciones por herramienta](https://talkthinkdo.com/guides/development-practice/vibe-coded-app-security-checks/) · [Broch Builds: 20 comprobaciones](https://brochbuilds.com/security)

#!/usr/bin/env bash
# Instala el kit en ESTA computadora para todas las sesiones de Claude Code (scope usuario).
# Uso:  bash instalar.sh            (todo)
#       bash instalar.sh --quitar ruflo-core@ruflo   (desinstalar uno)
set -e
if [ "$1" = "--quitar" ]; then claude plugin uninstall "$2" --scope user; exit; fi
REPO="${KIT_REPO:-CAMBIAR_USUARIO/claude-kit}"
for m in "$REPO" JuliusBrussee/caveman obra/superpowers-marketplace bradautomates/claude-video anthropics/claude-plugins-official ruvnet/ruflo; do
  claude plugin marketplace add "$m" || true
done
for p in mi-kit@mi-kit caveman@caveman superpowers@superpowers-marketplace watch@claude-video \
         claude-code-setup@claude-plugins-official playwright@claude-plugins-official \
         context7@claude-plugins-official firecrawl@claude-plugins-official ruflo-core@ruflo; do
  claude plugin install "$p" --scope user || echo "!! falló $p"
done
npm i -g agent-browser || echo "!! agent-browser necesita Node"
echo
echo "Listo. Falta poner tus keys como variables de entorno (NO en este repo):"
echo "  APIFY_TOKEN, FIRECRAWL_API_KEY, GEMINI_API_KEY (para watch)"
claude plugin list

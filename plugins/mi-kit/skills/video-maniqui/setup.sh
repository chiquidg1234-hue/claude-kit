#!/bin/bash
# Instala todo lo del pipeline (gratis/abierto, versiones fijas). Uso: bash setup.sh [carpeta_herramientas]
# Necesita: node 18+, python 3.11+, ffmpeg, git, espeak-ng (para la fonetización de Kokoro).
set -e
HERE=$(cd "$(dirname "$0")" && pwd); TOOLS=${1:-$HOME/.video-maniqui}
mkdir -p "$TOOLS/voices"
(cd "$HERE/motor" && npm install --no-audit --no-fund && npx playwright install chromium)
python3 -m venv "$TOOLS/venv" && "$TOOLS/venv/bin/pip" install -q -r "$HERE/requirements.txt"
# Voz Kokoro v1.0 (Apache-2.0)
for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f "$TOOLS/voices/$f" ] || curl -sSfL -o "$TOOLS/voices/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"; done
# Samples orquestales CC0 (solo las carpetas que usa score.py, ~700 MB)
if [ ! -d "$TOOLS/vsco-2-ce/.git" ]; then
  git clone -q --depth 1 --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE "$TOOLS/vsco-2-ce"
  (cd "$TOOLS/vsco-2-ce" && git sparse-checkout set "Strings/Cello Section/spic" "Strings/Cello Section/trem" "Strings/Cello Section/susvib" \
    "Strings/Violin Section/susVib" "Strings/Violin Section/Trem" "Percussion/Timpani" "Brass/F Horn/sus" "Brass/Tenor Trombone/sus" "Brass/Tuba/sus" \
    "VSCO 1 Percussion/drums" && git checkout -q)
fi
echo "Listo. Exporta: VIDEO_TOOLS=$TOOLS  VSCO=$TOOLS/vsco-2-ce"

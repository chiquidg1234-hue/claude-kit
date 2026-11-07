#!/bin/bash
# Crea un episodio nuevo desde la plantilla: tools/new_episode.sh <nombre>
set -e
K=$(cd "$(dirname "$0")/.." && pwd); E="$K/episodios/$1"; [ -n "$1" ] || { echo "uso: new_episode.sh <nombre>"; exit 1; }
[ -e "$E" ] && { echo "ya existe: $E"; exit 1; }
mkdir -p "$E"; cp "$K/episodios/_plantilla/script.json" "$K/episodios/_plantilla/episode.js" "$E/"
ln -s ../../motor/engine.js "$E/engine.js"; ln -s ../../motor/index.html "$E/index.html"; ln -s ../../motor/node_modules "$E/node_modules"
echo "Episodio creado en $E: edita script.json (guion) y episode.js (planos)."

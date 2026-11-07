#!/bin/bash
# Render en paralelo: run_all.sh <episodio> [frame_inicio frame_fin] [procesos]
EP=$(cd "$1" && pwd); A=${2:-0}; B=${3:-$(python3 -c "import json,math;print(math.ceil(json.load(open('$EP/words.json'))['total']*30))")}; P=${4:-4}
export NODE_PATH=$(npm root -g); step=$(( (B-A+P-1)/P ))
for i in $(seq 0 $((P-1))); do a=$((A+i*step)); b=$((a+step)); [ $b -gt $B ] && b=$B
  PORT=$((8770+i)) node "$(dirname "$0")/render.mjs" "$EP" full $a $b > "$EP/log_$i.txt" 2>&1 & done
wait; echo ALLDONE

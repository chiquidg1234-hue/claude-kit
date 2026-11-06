#!/bin/bash
cd "$(dirname "$0")"
export NODE_PATH=$(npm root -g)
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('timeline.json'))['total']*30))"); P=4; step=$(( (N+P-1)/P ))
for i in $(seq 0 $((P-1))); do a=$((i*step)); b=$(( (i+1)*step )); [ $b -gt $N ] && b=$N
  PORT=$((8770+i)) node render.mjs full $a $b > log_$i.txt 2>&1 & done
wait; echo ALLDONE

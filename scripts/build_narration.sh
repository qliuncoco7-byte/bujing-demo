#!/bin/bash
# Rebuilds the demo narration from the macOS system TTS voice.
# The result is self-made, not a licensed voice actor recording.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say -v Tingting -r 175 -o "$TMP/l1.aiff" "每天的通勤路上，我们会经过许多街道。"
say -v Tingting -r 175 -o "$TMP/l2.aiff" "说到城市绿化，我们先看看街边的树。"
say -v Tingting -r 175 -o "$TMP/l3.aiff" "它们为城市降温，也让行人放慢脚步。"

for f in l1 l2 l3; do
  afconvert -f WAVE -d LEI16@44100 -c 1 "$TMP/$f.aiff" "$TMP/$f.wav"
done

python3 "$ROOT/scripts/mix_narration.py" "$ROOT/public/audio/narration.wav" \
  "$TMP/l1.wav" "$TMP/l2.wav" "$TMP/l3.wav"

afconvert -f m4af -d aac -b 96000 \
  "$ROOT/public/audio/narration.wav" "$ROOT/public/audio/narration.m4a"
echo "built public/audio/narration.m4a"

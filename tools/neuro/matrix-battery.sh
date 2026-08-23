#!/bin/sh
# The neuro-ladder matrix battery: triple-block baseline + growth on THIS
# tree and on the pre-neuro base (extracted via git archive to $BASE).
# Trees interleaved per block so machine drift cannot masquerade as a delta.
set -e
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
BASE="${BASE:-/tmp/neuro-base}"
run() { # $1 tree  $2 seedbase  $3 days  $4 extra
  ( cd "$1" && SIMLIB_KERNEL=wasm node tools/headless.mjs --days "$3" --seeds 16 --seedbase "$2" --jobs 10 --realm main $4 2>/dev/null | grep ">>" )
}
for B in 0 16 32; do
  echo "== baseline block $B, neuro:"; run "$HERE" "$B" 30 ""
  echo "== baseline block $B, base:";  run "$BASE" "$B" 30 ""
done
for B in 0 16 32; do
  echo "== growth block $B, neuro:"; run "$HERE" "$B" 40 "--buy chef,table"
  echo "== growth block $B, base:";  run "$BASE" "$B" 40 "--buy chef,table"
done

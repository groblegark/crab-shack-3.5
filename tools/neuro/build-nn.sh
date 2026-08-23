#!/bin/sh
# Build the wasm leg of the cross-engine receipt. Same toolchain the kernel
# uses (zig cc, wasm32-freestanding, no libc).
set -e
cd "$(dirname "$0")"
zig cc --target=wasm32-freestanding -O2 -nostdlib \
  -Wl,--no-entry -Wl,-z,stack-size=8192 -Wl,--export-memory -Wl,--initial-memory=16777216 \
  -o infer.wasm infer.c
ls -la infer.wasm

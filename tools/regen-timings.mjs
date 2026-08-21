#!/usr/bin/env node
// Rebuild tools/suite-timings.json from a run artifact: either the JSON dump
// a run writes with --timings-out, or a captured suite log with
// "  PASS  name (123ms)" lines. Stale timings only cost pool efficiency,
// never correctness - the queue is dynamic.
//   node tools/regen-timings.mjs /tmp/t.json
import { readFileSync, writeFileSync } from "fs";
const src = process.argv[2];
if (!src) { console.error("usage: node tools/regen-timings.mjs <timings.json | suite.log>"); process.exit(1); }
const text = readFileSync(src, "utf8");
let map;
try { map = JSON.parse(text); }
catch (e) {
  map = {};
  for (const m of text.matchAll(/^ {2}(?:PASS|FAIL) {2}(.*) \((\d+)ms\)$/gm)) map[m[1]] = +m[2];
}
if (!Object.keys(map).length) { console.error("no timings found in " + src); process.exit(1); }
const sorted = {};
for (const k of Object.keys(map).sort()) sorted[k] = map[k];
writeFileSync(new URL("./suite-timings.json", import.meta.url), JSON.stringify(sorted, null, 1) + "\n");
console.log("wrote " + Object.keys(sorted).length + " timings to tools/suite-timings.json");

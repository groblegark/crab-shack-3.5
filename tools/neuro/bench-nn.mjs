// Per-decision cost: the brain vs the script it distilled.
//   node tools/neuro/bench-nn.mjs
// Script cost comes from collection (Date.now bracketing around the real
// visPick inside a live town: receipts/data.json meta.scriptUsPerCall).
// Net cost is measured here, best-of-5, scalar JS and wasm-batched.

import { readFileSync } from "fs";
import { makeClassifier } from "./infer.mjs";

const brain = JSON.parse(readFileSync("tools/neuro/receipts/brain-vispick.json", "utf8"));
const { meta, rows } = JSON.parse(readFileSync("tools/neuro/receipts/data.json", "utf8"));
const test = rows.slice(0, 20000);
const NF = brain.arch.in, NC = brain.arch.out, HID = brain.arch.hidden;

const classify = makeClassifier(brain);
let best = Infinity, sink = 0;
for (let pass = 0; pass < 5; pass++) {
  const t0 = process.hrtime.bigint();
  for (const r of test) sink += classify(r.f);
  const ns = Number(process.hrtime.bigint() - t0) / test.length;
  if (ns < best) best = ns;
}
const wasm = new WebAssembly.Instance(new WebAssembly.Module(readFileSync("tools/neuro/infer.wasm")), {});
const mem = wasm.exports.memory.buffer;
new Int32Array(mem, 16384, 4).set([NF, HID, NC, brain.shifts.R1]);
new Int8Array(mem, 17408, HID * NF).set(brain.w1.flat());
new Int32Array(mem, 81920, HID).set(brain.b1);
new Int8Array(mem, 147456, NC * HID).set(brain.w2.flat());
new Int32Array(mem, 212992, NC).set(brain.b2);
const corp = new Int16Array(mem, 262144, test.length * NF);
test.forEach((r, i) => corp.set(r.f, i * NF));
let bestW = Infinity;
for (let pass = 0; pass < 5; pass++) {
  const t0 = process.hrtime.bigint();
  sink += wasm.exports.run(test.length);
  const ns = Number(process.hrtime.bigint() - t0) / test.length;
  if (ns < bestW) bestW = ns;
}
const macs = NF * HID + HID * NC;
console.log(JSON.stringify({
  scriptUsPerCall: meta.scriptUsPerCall,
  netScalarJsNs: +best.toFixed(1),
  netWasmBatchedNs: +bestW.toFixed(1),
  speedupVsScript: +((meta.scriptUsPerCall * 1000) / bestW).toFixed(1),
  macsPerInference: macs, weightBytes: HID * NF + NC * HID,
  sink,
}));

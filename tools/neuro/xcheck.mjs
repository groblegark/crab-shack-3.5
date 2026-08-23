// THE CROSS-ENGINE RECEIPT — the same brain, the same corpus, three engines:
//   1. scalar JS under node/V8        (infer.mjs)
//   2. compiled wasm under node/V8    (infer.c via zig cc)
//   3. scalar JS under JavaScriptCore (jsc, the xengine pattern)
// Bit-exactness is judged on the FULL LOGITS STREAM (FNV-1a over every
// int32 logit of every held-out row), not just the choices — a wrong
// intermediate that happens to keep the argmax must still fail here.
//
//   node tools/neuro/xcheck.mjs [artifact.json] [corpus.json]
//
// Defaults are the spike's pair (brain-vispick.json over the 32x12 collection
// regenerated into receipts/data.json). Pass a path pair to receipt any other
// artifact over any other collection — the retrain's own receipt is
//   node tools/neuro/xcheck.mjs tools/neuro/receipts/brain-crab-v3.json <data>

import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { makeClassifier, fnv } from "./infer.mjs";

const brainPath = process.argv[2] || "tools/neuro/receipts/brain-vispick.json";
const dataPath = process.argv[3] || "tools/neuro/receipts/data.json";
const brain = JSON.parse(readFileSync(brainPath, "utf8"));
const { rows } = JSON.parse(readFileSync(dataPath, "utf8"));
// fold, don't spread: a collection is bigger than the argument limit
let maxTown = 0; for (const r of rows) if (r.town > maxTown) maxTown = r.town;
const heldFrom = Math.floor((maxTown + 1) * 0.75);
const test = rows.filter((r) => r.town >= heldFrom);
const NF = brain.arch.in, HID = brain.arch.hidden, NC = brain.arch.out;
console.log(`artifact: ${brainPath} (${NF}->${HID}->${NC}, R1=${brain.shifts.R1})`);
console.log(`corpus: ${test.length} held-out rows x ${NF} features (${dataPath})`);

// ---- leg 1: scalar JS (node) ------------------------------------------
const classify = makeClassifier(brain);
const logitsAll = [], choices = [];
const lg = new Array(NC);
for (const r of test) { choices.push(classify(r.f, lg)); logitsAll.push(...lg); }
const jsLogitsHash = fnv(logitsAll), jsChoicesHash = fnv(choices);
console.log(`node/V8 scalar : logits ${jsLogitsHash.toString(16)}  choices ${jsChoicesHash.toString(16)}`);

// ---- leg 2: wasm (node) -----------------------------------------------
const wasm = new WebAssembly.Instance(new WebAssembly.Module(readFileSync("tools/neuro/infer.wasm")), {});
const mem = wasm.exports.memory.buffer;
const dims = new Int32Array(mem, 16384, 4);
dims.set([NF, HID, NC, brain.shifts.R1]);
new Int8Array(mem, 17408, HID * NF).set(brain.w1.flat());
new Int32Array(mem, 81920, HID).set(brain.b1);
new Int8Array(mem, 147456, NC * HID).set(brain.w2.flat());
new Int32Array(mem, 212992, NC).set(brain.b2);
// the module's own map (infer.c): corpus at 262144, logits at 8388608, 16MB
if (262144 + test.length * NF * 2 > 8388608 || 8388608 + test.length * NC * 4 > mem.byteLength)
  throw new Error(`corpus of ${test.length} rows overruns the wasm memory map - raise --initial-memory in build-nn.sh and the OUT offset in infer.c together`);
const corp = new Int16Array(mem, 262144, test.length * NF);
test.forEach((r, i) => corp.set(r.f, i * NF));
const wasmChoicesHash = (wasm.exports.run(test.length) >>> 0);
const out = new Int32Array(mem, 8388608, test.length * NC);
const wasmLogitsHash = fnv(Array.from(out));
console.log(`node/V8 wasm   : logits ${wasmLogitsHash.toString(16)}  choices ${wasmChoicesHash.toString(16)}`);

// ---- leg 3: scalar JS under jsc ---------------------------------------
// Ship the classifier source + fnv + brain + corpus as one self-contained
// script; jsc's shell has print(). (xengine's jsc-dialect lesson applies:
// no modules, no Node APIs.)
import { fileURLToPath } from "url";
const inferSrc = readFileSync(fileURLToPath(new URL("./infer.mjs", import.meta.url)), "utf8")
  .replace(/export function/g, "function");
const script = `
${inferSrc}
const brain = ${JSON.stringify(brain)};
const test = ${JSON.stringify(test.map((r) => r.f))};
const classify = makeClassifier(brain);
const logitsAll = [], choices = [];
const lg = new Array(brain.arch.out);
for (const f of test) { choices.push(classify(f, lg)); for (const v of lg) logitsAll.push(v); }
print("jsc " + fnv(logitsAll).toString(16) + " " + fnv(choices).toString(16));
`;
writeFileSync("/tmp/nn-jsc.js", script);
const JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc";
const jscOut = execFileSync(JSC, ["/tmp/nn-jsc.js"]).toString().trim();
console.log(`jsc scalar     : ${jscOut}`);
const [, jscLogits, jscChoices] = jscOut.split(" ");

const ok = jsLogitsHash === wasmLogitsHash && jsLogitsHash.toString(16) === jscLogits
  && jsChoicesHash === wasmChoicesHash && jsChoicesHash.toString(16) === jscChoices;
console.log(ok ? "BIT-IDENTICAL across node/V8 scalar, wasm, and JavaScriptCore"
              : "DIVERGED - the recipe is not engine-independent");
process.exit(ok ? 0 : 1);

// THE DISTILLER — train a float MLP on the sim's own labels, then quantize
// to the integer inference recipe and emit the brain artifact.
//
//   node tools/neuro/train.mjs [--data tools/neuro/receipts/data.json]
//                              [--hidden 24] [--epochs 25] [--seed 7]
//
// Training is float and SEEDED (mulberry32 drives init and shuffle) - nice,
// but reproducible TRAINING is not the requirement; the ARTIFACT is what
// ships and the artifact is integers. Split is BY TOWN (held-out towns the
// net never saw), because rows within a town are correlated.
//
// THE QUANTIZED RECIPE (the artifact's contract, mirrored by infer.mjs,
// infer.c and the doc - one rounding per layer at a named shift):
//   inputs  x: int16 in [0, 32767], exactly as the registry encodes them
//   layer 1 w1q int8, b1q int32:  acc_i = sum_j w1q[i][j]*x[j] + b1q[i]
//           h_i = clamp(acc_i >> R1, 0, 32767)        (floor; ReLU + saturate)
//   layer 2 w2q int8, b2q int32:  logit_o = sum_i w2q[o][i]*h_i + b2q[o]
//   choice  argmax over logits, LOWEST INDEX WINS ties
// Headroom: |term| <= 127*32767 = 2^22; 42 terms + bias < 2^28 - int32-exact
// everywhere, including SIMD i32x4.dot_i16x8_s lanes (pairwise 2^23).

import { readFileSync, writeFileSync } from "fs";
import { REGISTRY_VERSION } from "./observables.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const DATA = opt("--data", "tools/neuro/receipts/data.json");
const HID = parseInt(opt("--hidden", "24"));
const EPOCHS = parseInt(opt("--epochs", "25"));
const SEED = parseInt(opt("--seed", "7"));

const { meta, rows } = JSON.parse(readFileSync(DATA, "utf8"));
const NF = meta.inputs.length, NC = meta.classes.length;
const XS = 1 / 8192;   // training-time input scale; folded into w1q at quantization

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);

// ---- split by town, rebalance the training set ------------------------
const maxTown = Math.max(...rows.map((r) => r.town));
const heldFrom = Math.floor((maxTown + 1) * 0.75);
const test = rows.filter((r) => r.town >= heldFrom);
let train = rows.filter((r) => r.town < heldFrom);
const minorMax = Math.max(...Array.from({ length: NC - 1 }, (_, c) => train.filter((r) => r.cls === c + 1).length));
const noneKeep = minorMax * 3;
const nones = train.filter((r) => r.cls === 0);
const keep = new Set();
for (let i = 0; i < noneKeep && i < nones.length; i++) keep.add(Math.floor(rnd() * nones.length));
train = train.filter((r) => r.cls !== 0).concat(nones.filter((_, i) => keep.has(i)));
console.log(`train ${train.length} rows (none subsampled to ~${noneKeep}), held-out ${test.length} rows from towns ${heldFrom}..${maxTown}`);

// ---- the float net ----------------------------------------------------
const w1 = Array.from({ length: HID }, () => Array.from({ length: NF }, () => (rnd() * 2 - 1) * Math.sqrt(2 / NF)));
const b1 = new Array(HID).fill(0);
const w2 = Array.from({ length: NC }, () => Array.from({ length: HID }, () => (rnd() * 2 - 1) * Math.sqrt(2 / HID)));
const b2 = new Array(NC).fill(0);
const mw1 = w1.map((r) => r.map(() => 0)), mb1 = b1.map(() => 0);
const mw2 = w2.map((r) => r.map(() => 0)), mb2 = b2.map(() => 0);

function fwd(f, h, logits) {
  for (let i = 0; i < HID; i++) {
    let a = b1[i];
    const wi = w1[i];
    for (let j = 0; j < NF; j++) a += wi[j] * f[j] * XS;
    h[i] = a > 0 ? a : 0;
  }
  for (let o = 0; o < NC; o++) {
    let a = b2[o];
    const wo = w2[o];
    for (let i = 0; i < HID; i++) a += wo[i] * h[i];
    logits[o] = a;
  }
}

const h = new Array(HID), logits = new Array(NC), p = new Array(NC);
function softmaxInto(logits, p) {
  let m = -Infinity;
  for (const v of logits) if (v > m) m = v;
  let s = 0;
  for (let o = 0; o < NC; o++) { p[o] = Math.exp(logits[o] - m); s += p[o]; }
  for (let o = 0; o < NC; o++) p[o] /= s;
}

const MOM = 0.9, BATCH = 64;
const dw1 = w1.map((r) => r.map(() => 0)), db1 = b1.map(() => 0);
const dw2 = w2.map((r) => r.map(() => 0)), db2 = b2.map(() => 0);
let deadReport = "";
for (let ep = 0; ep < EPOCHS; ep++) {
  const lr = 0.05 * Math.pow(0.9, ep);
  for (let i = train.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = train[i]; train[i] = train[j]; train[j] = t;
  }
  let loss = 0;
  for (let base = 0; base < train.length; base += BATCH) {
    const nb = Math.min(BATCH, train.length - base);
    for (let i = 0; i < HID; i++) { db1[i] = 0; dw1[i].fill(0); }
    for (let o = 0; o < NC; o++) { db2[o] = 0; dw2[o].fill(0); }
    for (let bi = 0; bi < nb; bi++) {
      const r = train[base + bi];
      fwd(r.f, h, logits);
      softmaxInto(logits, p);
      loss -= Math.log(Math.max(1e-12, p[r.cls]));
      for (let o = 0; o < NC; o++) {
        const g = (p[o] - (o === r.cls ? 1 : 0)) / nb;
        db2[o] += g;
        const wo = dw2[o];
        for (let i = 0; i < HID; i++) wo[i] += g * h[i];
      }
      for (let i = 0; i < HID; i++) {
        if (h[i] <= 0) continue;
        let g = 0;
        for (let o = 0; o < NC; o++) g += (p[o] - (o === r.cls ? 1 : 0)) * w2[o][i];
        g /= nb;
        db1[i] += g;
        const wi = dw1[i];
        for (let j = 0; j < NF; j++) wi[j] += g * r.f[j] * XS;
      }
    }
    for (let o = 0; o < NC; o++) {
      mb2[o] = MOM * mb2[o] - lr * db2[o]; b2[o] += mb2[o];
      const wo = w2[o], mo = mw2[o], go = dw2[o];
      for (let i = 0; i < HID; i++) { mo[i] = MOM * mo[i] - lr * go[i]; wo[i] += mo[i]; }
    }
    for (let i = 0; i < HID; i++) {
      mb1[i] = MOM * mb1[i] - lr * db1[i]; b1[i] += mb1[i];
      const wi = w1[i], mi = mw1[i], gi = dw1[i];
      for (let j = 0; j < NF; j++) { mi[j] = MOM * mi[j] - lr * gi[j]; wi[j] += mi[j]; }
    }
  }
  if (ep % 5 === 4 || ep === EPOCHS - 1) {
    let dead = 0;
    for (let i = 0; i < HID; i++) {
      let alive = false;
      for (const r of train.slice(0, 200)) { fwd(r.f, h, logits); if (h[i] > 0) { alive = true; break; } }
      if (!alive) dead++;
    }
    deadReport = `${dead}/${HID} dead`;
    console.log(`epoch ${ep + 1}: loss/row ${(loss / train.length).toFixed(4)} (${deadReport})`);
  }
}
// ---- quantize ---------------------------------------------------------
// w1 acts on x*XS, so the integer weight against RAW x is w1*XS; pick K1 so
// max|round(w1*XS*2^K1)| <= 127, then R1 = K1 - Q1 with Q1 = 11 (h carries
// 2^11 per float unit; saturates at h_float = 16, far beyond observed).
const Q1 = 11;
const max1 = Math.max(...w1.flat().map(Math.abs)) * XS;
let K1 = 0;
while (Math.round(max1 * 2 ** (K1 + 1)) <= 127) K1++;
const R1 = K1 - Q1;
if (R1 < 0) throw new Error(`R1 negative (${R1}) - hidden scale exceeds weight scale; lower Q1`);
const w1q = w1.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * XS * 2 ** K1)))));
const b1q = b1.map((v) => Math.round(v * 2 ** K1));
const max2 = Math.max(...w2.flat().map(Math.abs));
let K2 = 0;
while (Math.round(max2 * 2 ** (K2 + 1)) <= 127) K2++;
const w2q = w2.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * 2 ** K2)))));
const b2q = b2.map((v) => Math.round(v * 2 ** (K2 + Q1)));

// ---- the integer forward (the recipe, verbatim) ----------------------
function intFwd(f) {
  const hi = new Array(HID);
  for (let i = 0; i < HID; i++) {
    let a = b1q[i];
    const wi = w1q[i];
    for (let j = 0; j < NF; j++) a += wi[j] * f[j];
    a = a >> R1;                       // one rounding per layer: floor at R1
    hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;
  }
  let best = 0, bestV = -Infinity;
  for (let o = 0; o < NC; o++) {
    let a = b2q[o];
    const wo = w2q[o];
    for (let i = 0; i < HID; i++) a += wo[i] * hi[i];
    if (a > bestV) { bestV = a; best = o; }   // > not >=: lowest index wins ties
  }
  return best;
}

// ---- evaluate ---------------------------------------------------------
function evalSet(set, fn) {
  let ok = 0;
  const conf = Array.from({ length: NC }, () => new Array(NC).fill(0));
  for (const r of set) { const c = fn(r.f); conf[r.cls][c]++; if (c === r.cls) ok++; }
  return { acc: ok / set.length, conf };
}
const floatChoice = (f) => { fwd(f, h, logits); let b = 0; for (let o = 1; o < NC; o++) if (logits[o] > logits[b]) b = o; return b; };
const ft = evalSet(test, floatChoice), it = evalSet(test, intFwd);
console.log(`held-out agreement with the script: float ${(ft.acc * 100).toFixed(2)}%  quantized ${(it.acc * 100).toFixed(2)}%`);
for (let c = 0; c < NC; c++) {
  const n = it.conf[c].reduce((a, b) => a + b, 0);
  if (n) console.log(`  ${meta.classes[c].padEnd(15)} n=${String(n).padStart(6)} recall ${(it.conf[c][c] / n * 100).toFixed(1)}%`);
}

// ---- emit the artifact ------------------------------------------------
const artifact = {
  kind: "crabshack-brain", version: 1,
  surface: "vis_pick.candidate", registryVersion: REGISTRY_VERSION,
  inputs: meta.inputs, classes: meta.classes,
  arch: { in: NF, hidden: HID, out: NC },
  shifts: { R1 },
  w1: w1q, b1: b1q, w2: w2q, b2: b2q,
  provenance: { data: { towns: meta.towns, days: meta.days, rows: meta.rows }, seed: SEED, epochs: EPOCHS },
  heldout: { floatAgree: +(ft.acc).toFixed(4), intAgree: +(it.acc).toFixed(4) },
};
writeFileSync("tools/neuro/receipts/brain-vispick.json", JSON.stringify(artifact));
const bytes = HID * NF + NC * HID;
console.log(`artifact written: ${bytes} int8 weights (${(bytes / 1024).toFixed(1)} KB) + ${HID + NC} int32 biases; K1=${K1} R1=${R1} K2=${K2}`);
// confusion detail for the doc: what do disagreements look like?
let noneUp = 0, noneDown = 0, cross = 0;
for (let a = 0; a < NC; a++) for (let b = 0; b < NC; b++) {
  if (a === b) continue;
  const n = it.conf[a][b];
  if (a === 0) noneUp += n; else if (b === 0) noneDown += n; else cross += n;
}
console.log(`disagreements: script=none,net=act ${noneUp} | script=act,net=none ${noneDown} | act-vs-act ${cross}`);

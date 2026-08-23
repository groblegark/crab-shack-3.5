// THE DREAM SPIKE — can a crab train her OWN mind, in-sim, deterministically?
//
//   node tools/neuro/dream-spike/dream.mjs [--corpus /tmp/dream-corpus.json]
//
// The question this spike answers: given a frozen culture-shared backbone
// (the shipped artifact) and a small per-actor delta, does a DETERMINISTIC
// INTEGER training step — runnable at sleep time, inside the sim's own
// arithmetic contract — actually learn from replayed experience, stay
// bounded, cost nothing, and produce bit-identical trajectories across
// engines? Receipts land in tools/neuro/dream-spike/receipts/.
//
// THE METHOD, and why it is not softmax-SGD: cross-entropy needs exp() and
// exp is on the banned list. The integer-native loss is the HINGE, and
// mistake-driven multiclass perceptron IS SGD on it with the learning rate
// folded into a shift — no floats, no division, no transcendentals. A crab
// replays a moment, sees what she did against what her experience says she
// should have done, and nudges only when she was wrong. (A pleasant
// corollary: a crab whose days go fine dreams and changes NOTHING — no
// mistakes, no updates — so dreaming cannot erode a brain that is working.)
//
// THE DELTA-READY FORMAT (the design doc's ladder rung 0):
//   effective logit  L_o = (base_o << ESH) + d_o
//     base_o = b2[o] + sum_i w2[o][i] * h_i        (the frozen backbone, <2^28)
//     d_o    = b2d[o] + sum_i w2d[o][i] * h_i      (the actor's own delta)
//   w2d int8 in [-127,127], b2d int32 in [-2^24, 2^24], ESH = 8.
//   One w2d unit = 1/256 of a backbone weight unit; the int8 clamp bounds a
//   lifetime of dreaming to less than half a backbone weight per connection —
//   a TEMPERAMENT, enforced by the storage type, not by discipline.
//   Exactness: |(base<<8)| < 2^36, |d| < 2^29, sum < 2^37 — exact in every
//   JS double engine. (A wasm port carries it in i64, or drops ESH to 4 and
//   re-derives the bound; noted in the doc.)
//   Zero delta reproduces the backbone argmax EXACTLY (asserted below), so a
//   pre-delta save loads as the shipped culture brain, bit for bit.
//   Size per actor: HID*NC int8 + NC int32 = (48*7 + 7*4) = 364 bytes.
//
// DETERMINISM: fixed replay order per night, counted u32 stream for episode
// sampling (the integer core of mulberry32 — the u32 BEFORE the float
// division the sim bans; cursor counted like rs), updates in class-index
// order, saturating clamps, lowest-index argmax tie-break. The whole
// trajectory is a pure function of (backbone, ring, seed, nights).

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const CORPUS = opt("--corpus", "/tmp/dream-corpus.json");
const OUTDIR = fileURLToPath(new URL("./receipts/", import.meta.url));
mkdirSync(OUTDIR, { recursive: true });

// ---------------------------------------------------------------- the core
// Everything inside CORE_SRC ships verbatim to JavaScriptCore for the
// cross-engine leg (xcheck's idiom): ES5 only, no imports, no Node.
const CORE_SRC = `
var ESH = 8, USH = 11, BSTEP = 4096, WCLAMP = 127, BCLAMP = 1 << 24;
// counted u32 stream: mulberry32's integer core, WITHOUT the float division.
// state advances exactly once per draw; the cursor is the count (rs's rule).
function u32stream(seed) {
  var a = seed | 0, n = 0;
  return { draw: function () {
    n++;
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return (t ^ t >>> 14) >>> 0;
  }, count: function () { return n; } };
}
// layer 1 of the backbone, frozen: the actor's delta never touches it.
function hidden(brain, f, hi) {
  var HID = brain.arch.hidden, NF = brain.arch.in, R1 = brain.shifts.R1;
  for (var i = 0; i < HID; i++) {
    var a = brain.b1[i], wi = brain.w1[i];
    for (var j = 0; j < NF; j++) a += wi[j] * f[j];
    a = a >> R1;
    hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;
  }
}
// effective logits: backbone << ESH, plus the actor's own last-layer delta.
function logitsWithDelta(brain, hi, w2d, b2d, out) {
  var HID = brain.arch.hidden, NC = brain.arch.out;
  for (var o = 0; o < NC; o++) {
    var base = brain.b2[o], wo = brain.w2[o];
    for (var i = 0; i < HID; i++) base += wo[i] * hi[i];
    var d = b2d[o], di = o * HID;
    for (var i2 = 0; i2 < HID; i2++) d += w2d[di + i2] * hi[i2];
    out[o] = base * 256 + d;            // base << ESH, exact (< 2^37)
  }
}
function argmax(v) {
  var b = 0;
  for (var o = 1; o < v.length; o++) if (v[o] > v[b]) b = o;   // lowest index wins ties
  return b;
}
// ONE DREAM: replay one remembered moment; nudge only on a mistake.
// Saturating clamps are the rail — a crab cannot dream herself insane.
function dreamStep(brain, f, label, w2d, b2d, hi, lg) {
  var HID = brain.arch.hidden;
  hidden(brain, f, hi);
  logitsWithDelta(brain, hi, w2d, b2d, lg);
  var pred = argmax(lg);
  if (pred === label) return 0;
  var li = label * HID, pi = pred * HID;
  for (var i = 0; i < HID; i++) {
    var step = hi[i] >> USH;
    var up = w2d[li + i] + step;   w2d[li + i] = up > WCLAMP ? WCLAMP : up;
    var dn = w2d[pi + i] - step;   w2d[pi + i] = dn < -WCLAMP ? -WCLAMP : dn;
  }
  var bu = b2d[label] + BSTEP;  b2d[label] = bu > BCLAMP ? BCLAMP : bu;
  var bd = b2d[pred] - BSTEP;   b2d[pred] = bd < -BCLAMP ? -BCLAMP : bd;
  return 1;
}
// ONE NIGHT: EPB replays sampled from the actor's own episode ring by the
// counted stream, in draw order. Returns mistakes corrected.
function dreamNight(brain, ring, w2d, b2d, stream, EPB, hi, lg) {
  var fixed = 0;
  for (var e = 0; e < EPB; e++) {
    var ep = ring[stream.draw() % ring.length];
    fixed += dreamStep(brain, ep.f, ep.cls, w2d, b2d, hi, lg);
  }
  return fixed;
}
// FNV-1a over int32s — the receipt hash, infer.mjs's own formula.
function fnv(values) {
  var h = 0x811c9dc5;
  for (var i = 0; i < values.length; i++) {
    var v = values[i] | 0;
    for (var b = 0; b < 4; b++) {
      h ^= (v >>> (b * 8)) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}
`;
// eslint-disable-next-line no-eval
const CORE = new Function(CORE_SRC + `
  return { u32stream: u32stream, hidden: hidden, logitsWithDelta: logitsWithDelta,
           argmax: argmax, dreamStep: dreamStep, dreamNight: dreamNight, fnv: fnv };`)();
const { u32stream, hidden, logitsWithDelta, argmax, dreamNight, fnv } = CORE;

// ---------------------------------------------------------------- fixtures
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const V2 = JSON.parse(readFileSync(here("../receipts/brain-crab-v2.json"), "utf8"));
const V3 = JSON.parse(readFileSync(here("../receipts/brain-crab-v3.json"), "utf8"));
const { meta, rows } = JSON.parse(readFileSync(CORPUS, "utf8"));
console.log(`corpus: ${rows.length} real thinks, ${meta.towns} towns x ${meta.days} days`);
const receipts = { corpus: { rows: rows.length, towns: meta.towns, days: meta.days } };

const mkDelta = (brain) => ({
  w2d: new Int8Array(brain.arch.out * brain.arch.hidden),
  b2d: new Int32Array(brain.arch.out),
});
function agree(brain, set, w2d, b2d) {
  const hi = new Array(brain.arch.hidden), lg = new Array(brain.arch.out);
  let ok = 0;
  for (const r of set) {
    hidden(brain, r.f, hi);
    logitsWithDelta(brain, hi, w2d, b2d, lg);
    if (argmax(lg) === r.cls) ok++;
  }
  return ok / set.length;
}

// ---- 0. ZERO DELTA IS THE BACKBONE, EXACTLY -----------------------------
// (base<<8 + 0) has the argmax of base — the pre-delta-save load contract.
{
  const z = mkDelta(V2), hi = new Array(V2.arch.hidden), lg = new Array(V2.arch.out);
  let same = 0;
  for (const r of rows) {
    hidden(V2, r.f, hi);
    logitsWithDelta(V2, hi, z.w2d, z.b2d, lg);
    const withDelta = argmax(lg);
    let b = 0;
    for (let o = 1; o < V2.arch.out; o++) {
      let a = V2.b2[o];
      for (let i = 0; i < V2.arch.hidden; i++) a += V2.w2[o][i] * hi[i];
      let a0 = V2.b2[b];
      for (let i = 0; i < V2.arch.hidden; i++) a0 += V2.w2[b][i] * hi[i];
      if (a > a0) b = o;
    }
    if (withDelta === b) same++;
  }
  if (same !== rows.length) throw new Error(`zero-delta drifted from backbone: ${same}/${rows.length}`);
  console.log(`0. zero delta == backbone on all ${rows.length} thinks (pre-delta saves load exact)`);
  receipts.zeroDelta = { checked: rows.length, identical: true };
}

// ---- 1. LEARNING HAPPENS: her early days teach her late days ------------
// Backbone = the SHIPPED v2 (the brain with the known act-early flaw), her
// experience = the script's own choices (distill-not-optimize: the teacher
// is what the reference DID). Split per town BY ORDER: the first 60% of her
// thinks are the ring she replays, the last 40% are tomorrow.
{
  const byTown = new Map();
  for (const r of rows) { if (!byTown.has(r.town)) byTown.set(r.town, []); byTown.get(r.town).push(r); }
  const trainAll = [], testAll = [];
  for (const [, tr] of byTown) {
    const cut = Math.floor(tr.length * 0.6);
    trainAll.push(...tr.slice(0, cut)); testAll.push(...tr.slice(cut));
  }
  // one shared delta over every town's experience — the ceiling for the
  // machinery on this corpus (a "town mind" rather than a personal one)
  const g = mkDelta(V2);
  const hi = new Array(V2.arch.hidden), lg = new Array(V2.arch.out);
  const stream = u32stream(7);
  const before = agree(V2, testAll, mkDelta(V2).w2d, mkDelta(V2).b2d);
  const NIGHTS = 40, EPB = 256;   // 40 nights of 256 replays over the pooled ring
  for (let n = 0; n < NIGHTS; n++) dreamNight(V2, trainAll, g.w2d, g.b2d, stream, EPB, hi, lg);
  const after = agree(V2, testAll, g.w2d, g.b2d);
  const v3ref = agree(V3, testAll, mkDelta(V3).w2d, mkDelta(V3).b2d);
  console.log(`1. pooled dreaming, v2 backbone: held-out ${(before * 100).toFixed(2)}% -> ${(after * 100).toFixed(2)}%  (v3 full retrain reads ${(v3ref * 100).toFixed(2)}%)`);
  receipts.pooled = { before: +before.toFixed(4), after: +after.toFixed(4), v3: +v3ref.toFixed(4),
    nights: NIGHTS, perNight: EPB, draws: stream.count() };

  // ---- per-town: each town dreams ONLY on its own days ------------------
  const towns = [];
  for (const [town, tr] of byTown) {
    const cut = Math.floor(tr.length * 0.6);
    const ring = tr.slice(0, cut), test = tr.slice(cut);
    if (ring.length < 20 || test.length < 20) continue;
    const d = mkDelta(V2), s = u32stream(1000 + town);
    const b4 = agree(V2, test, mkDelta(V2).w2d, mkDelta(V2).b2d);
    for (let n = 0; n < NIGHTS; n++) dreamNight(V2, ring, d.w2d, d.b2d, s, 64, hi, lg);
    const aft = agree(V2, test, d.w2d, d.b2d);
    towns.push({ town, ring: ring.length, test: test.length, before: +b4.toFixed(4), after: +aft.toFixed(4) });
  }
  const up = towns.filter((t) => t.after > t.before).length;
  const flat = towns.filter((t) => t.after === t.before).length;
  const mB = towns.reduce((a, t) => a + t.before, 0) / towns.length;
  const mA = towns.reduce((a, t) => a + t.after, 0) / towns.length;
  console.log(`   per-town dreaming (own ring only): mean ${(mB * 100).toFixed(2)}% -> ${(mA * 100).toFixed(2)}%; ${up} up, ${flat} flat, ${towns.length - up - flat} down, of ${towns.length}`);
  receipts.perTown = { towns, up, flat, down: towns.length - up - flat };
}

// ---- 2. STABILITY: a thousand nights stays a temperament ---------------
{
  const ring = rows.slice(0, 512);
  const d = mkDelta(V2), s = u32stream(99);
  const hi = new Array(V2.arch.hidden), lg = new Array(V2.arch.out);
  for (let n = 0; n < 1000; n++) dreamNight(V2, ring, d.w2d, d.b2d, s, 32, hi, lg);
  let maxW = 0, maxB = 0;
  for (const v of d.w2d) if (Math.abs(v) > maxW) maxW = Math.abs(v);
  for (const v of d.b2d) if (Math.abs(v) > maxB) maxB = Math.abs(v);
  if (maxW > 127 || maxB > (1 << 24)) throw new Error("delta escaped its clamp");
  const sat = Array.from(d.w2d).filter((v) => Math.abs(v) === 127).length;
  console.log(`2. 1000 nights x 32 replays: max|w2d| ${maxW} (<=127), max|b2d| ${maxB}, ${sat}/${d.w2d.length} weights at the rail — bounded, deterministic, done`);
  receipts.stability = { nights: 1000, maxW, maxB, saturated: sat, of: d.w2d.length };

  // THE MUTATION: take the clamp away and show the drift is real (the rail
  // BITES). Same schedule, unclamped ints — if this did NOT drift past the
  // int8 range, the clamp would be decoration.
  const w2u = new Int32Array(V2.arch.out * V2.arch.hidden), b2u = new Int32Array(V2.arch.out);
  const s2 = u32stream(99);
  const HID = V2.arch.hidden;
  for (let n = 0; n < 1000; n++) for (let e = 0; e < 32; e++) {
    const ep = ring[s2.draw() % ring.length];
    hidden(V2, ep.f, hi);
    for (let o = 0; o < V2.arch.out; o++) {
      let base = V2.b2[o];
      for (let i = 0; i < HID; i++) base += V2.w2[o][i] * hi[i];
      let dd = b2u[o];
      for (let i = 0; i < HID; i++) dd += w2u[o * HID + i] * hi[i];
      lg[o] = base * 256 + dd;
    }
    const pred = argmax(lg);
    if (pred === ep.cls) continue;
    for (let i = 0; i < HID; i++) { w2u[ep.cls * HID + i] += hi[i] >> 11; w2u[pred * HID + i] -= hi[i] >> 11; }
    b2u[ep.cls] += 4096; b2u[pred] -= 4096;
  }
  let maxU = 0;
  for (const v of w2u) if (Math.abs(v) > maxU) maxU = Math.abs(v);
  if (maxU <= 127) throw new Error("mutation did not bite: unclamped delta stayed in int8 range");
  console.log(`   mutation: unclamped, the same schedule drifts to max|w2d| ${maxU} — the rail bites`);
  receipts.mutation = { unclampedMaxW: maxU, bites: true };
}

// ---- 3. CROSS-ENGINE: the same dreams, bit for bit ----------------------
// The whole trajectory — 40 nights over a real ring, then the final delta
// bytes AND the dreamed brain's logits over a probe set — hashed on node/V8
// and on JavaScriptCore. This is the property that makes dreaming shippable
// at all: sleep must replay identically wherever the town runs.
{
  const ring = rows.filter((r) => r.town < 4);
  const probe = rows.filter((r) => r.town >= 12).slice(0, 400);
  const runTrajectory = `
    var brain = BRAIN, ring = RING, probe = PROBE;
    var w2d = [], b2d = [];
    for (var i = 0; i < brain.arch.out * brain.arch.hidden; i++) w2d.push(0);
    for (var o = 0; o < brain.arch.out; o++) b2d.push(0);
    var hi = [], lg = [];
    var s = u32stream(4242);
    for (var n = 0; n < 40; n++) dreamNight(brain, ring, w2d, b2d, s, 128, hi, lg);
    var all = w2d.concat(b2d);
    for (var p = 0; p < probe.length; p++) {
      hidden(brain, probe[p].f, hi);
      logitsWithDelta(brain, hi, w2d, b2d, lg);
      for (var o2 = 0; o2 < lg.length; o2++) all.push(lg[o2] % 2147483648);
    }
    ANSWER(fnv(all).toString(16) + " " + s.count());`;
  // leg 1: node — same source, plain arrays (typed arrays exist in jsc too,
  // but plain arrays make the two legs share EVERY line)
  let nodeAnswer;
  new Function("BRAIN", "RING", "PROBE", "ANSWER", CORE_SRC + runTrajectory)(V2, ring, probe, (a) => { nodeAnswer = a; });
  // leg 2: jsc
  const script = CORE_SRC + `
    var BRAIN = ${JSON.stringify(V2)};
    var RING = ${JSON.stringify(ring.map((r) => ({ f: r.f, cls: r.cls })))};
    var PROBE = ${JSON.stringify(probe.map((r) => ({ f: r.f, cls: r.cls })))};
    function ANSWER(a) { print(a); }
    ${runTrajectory}`;
  writeFileSync("/tmp/dream-jsc.js", script);
  const JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc";
  const jscAnswer = execFileSync(JSC, ["/tmp/dream-jsc.js"]).toString().trim();
  if (nodeAnswer !== jscAnswer) throw new Error(`ENGINES DIVERGED: node ${nodeAnswer} vs jsc ${jscAnswer}`);
  console.log(`3. 40-night trajectory (delta bytes + probe logits + cursor): node ${nodeAnswer} == jsc ${jscAnswer} — BIT-IDENTICAL`);
  receipts.xengine = { hash: nodeAnswer.split(" ")[0], draws: +nodeAnswer.split(" ")[1], engines: ["node/V8", "JavaScriptCore"], identical: true };
}

// ---- 4. COST: what does a night's sleep bill the tick? ------------------
{
  const ring = rows.slice(0, 512);
  const d = mkDelta(V2), s = u32stream(5);
  const hi = new Array(V2.arch.hidden), lg = new Array(V2.arch.out);
  for (let i = 0; i < 3; i++) dreamNight(V2, ring, d.w2d, d.b2d, s, 1024, hi, lg);   // warm
  const REPS = 64, EPB = 1024;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < REPS; i++) dreamNight(V2, ring, d.w2d, d.b2d, s, EPB, hi, lg);
  const us = Number(process.hrtime.bigint() - t0) / 1000 / (REPS * EPB);
  const night = us * 32;   // one actor's night at 32 replays
  console.log(`4. ${us.toFixed(2)}µs per replay -> ${night.toFixed(0)}µs per actor-night at 32 replays; ` +
    `10 dreamers = ${(night / 100).toFixed(2)}% of a 90ms sim-day, once per day`);
  receipts.cost = { usPerReplay: +us.toFixed(2), replaysPerNight: 32,
    usPerActorNight: +night.toFixed(1), pctOfSimDay10Dreamers: +(night / 100).toFixed(2) };
}

writeFileSync(OUTDIR + "dream-spike.json", JSON.stringify(receipts, null, 1));
console.log(`receipts -> tools/neuro/dream-spike/receipts/dream-spike.json`);

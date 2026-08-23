// THE TRUNK SPIKE — one mind, many actors: measure Matt's architecture
// question. Separate small nets per (surface, culture) — the status quo —
// versus ONE shared trunk at the same total parameter budget, conditioned
// per culture by a learned integer embedding (the cultureway's "prompt"),
// with one head per decision surface and the dream-spike's per-actor delta
// on top. Cluster arm: prints ONE compact JSON line last (the receipt's
// jsonTail); writes nothing that must survive the pod.
//
//   node tools/neuro/trunk-spike/run.mjs --mode sep|trunk|zeroshot|delta
//        [--seed 7] [--towns 32] [--days 12] [--epochs 18]
//
// Same instrument throughout (runbook lesson 8): both architectures train
// with the SAME recipe (momentum SGD, batch 64, lr 0.05*0.9^ep, none kept
// at the sim's own prior), the SAME corpora (regenerated deterministically
// in-pod; the committed citizen corpus), the SAME by-town held-out split,
// and are judged by the QUANTIZED integer forward — the artifact is what
// ships, so the artifact is what is scored.

import { readFileSync } from "fs";
import { collectRows, trainArtifact } from "../distill.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const MODE = opt("--mode", "trunk");
const SEED = parseInt(opt("--seed", "7"));
const TOWNS = parseInt(opt("--towns", "32"));
const DAYS = parseInt(opt("--days", "12"));
const EPOCHS = parseInt(opt("--epochs", "18"));
const XS = 1 / 8192;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- the three corpora (deterministic: every pod regenerates the same) --
function loadCorpora() {
  const t0 = Date.now();
  const gullDoc = JSON.parse(readFileSync("design/cultureways/gullway.json", "utf8"));
  const visCrab = collectRows({ towns: TOWNS, days: DAYS, culture: "crab" });
  const visGull = collectRows({ towns: TOWNS, days: DAYS, culture: "gull", cultureDoc: gullDoc });
  const cit = JSON.parse(readFileSync("tools/neuro/receipts/cit-data.json", "utf8"));
  console.log(`corpora: vis-crab ${visCrab.rows.length}, vis-gull ${visGull.rows.length}, cit ${cit.rows.length} rows (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  return { visCrab, visGull, cit };
}

// ---- the unified input space: union by registry name --------------------
// Visitor and citizen vectors share only clock.tmin by name; the union is
// deliberate — the trunk sees one address space and a surface's absent
// readers are zero, which the integer contract already allows (0 is a legal
// reading everywhere).
function unionSpace(visInputs, citInputs) {
  const names = [...visInputs];
  const idx = new Map(names.map((n, i) => [n, i]));
  for (const n of citInputs) if (!idx.has(n)) { idx.set(n, names.length); names.push(n); }
  const mapVis = visInputs.map((n) => idx.get(n));
  const mapCit = citInputs.map((n) => idx.get(n));
  return { names, mapVis, mapCit };
}
function mapRows(rows, map, U, task, cul) {
  return rows.map((r) => {
    const f = new Int16Array(U);
    for (let j = 0; j < map.length; j++) f[map[j]] = r.f[j];
    return { town: r.town, cls: r.cls, f, task, cul };
  });
}

// ---- multi-task trunk trainer (same recipe, two heads, learned prompt) --
// TASKS: 0 vis-crab, 1 vis-gull, 2 cit-crab. SURFACE of task: vis|cit.
// CULTURE of task: crab=0, gull=1. Embedding: E scaled-unit floats per
// culture, entering layer 1 like any input (quantizes to int16 raw units,
// e_int = round(e * 8192), so the shipped document carries E int16s).
function trainTrunk({ rowsByTask, U, H, E, epochs, seed, holdTask = null, headsOut }) {
  const NCul = 2, IN = U + E;
  const rnd = mulberry32(seed);
  const heads = headsOut; // [{out:7 (vis)}, {out:13 (cit)}]
  const taskHead = [0, 0, 1];
  const taskCul = [0, 1, 0];

  const w1 = Array.from({ length: H }, () => Array.from({ length: IN }, () => (rnd() * 2 - 1) * Math.sqrt(2 / IN)));
  const b1 = new Array(H).fill(0);
  const w2 = heads.map((hd) => Array.from({ length: hd.out }, () => Array.from({ length: H }, () => (rnd() * 2 - 1) * Math.sqrt(2 / H))));
  const b2 = heads.map((hd) => new Array(hd.out).fill(0));
  const emb = Array.from({ length: NCul }, () => Array.from({ length: E }, () => rnd() * 0.5 + 0.25));

  const mw1 = w1.map((r) => r.map(() => 0)), mb1 = b1.map(() => 0);
  const mw2 = w2.map((h2) => h2.map((r) => r.map(() => 0))), mb2 = b2.map((v) => v.map(() => 0));
  const memb = emb.map((r) => r.map(() => 0));

  let train = [];
  for (let t = 0; t < 3; t++) {
    if (t === holdTask) continue;
    train = train.concat(rowsByTask[t].train);
  }
  console.log(`trunk: IN=${IN} (U=${U}+E=${E}) H=${H} heads=[${heads.map((h2) => h2.out)}] train ${train.length} rows`);

  const h = new Array(H);
  const fwd = (r, logits) => {
    const e = emb[r.cul];
    for (let i = 0; i < H; i++) {
      let a = b1[i];
      const wi = w1[i], f = r.f;
      for (let j = 0; j < U; j++) a += wi[j] * f[j] * XS;
      for (let k = 0; k < E; k++) a += wi[U + k] * e[k];
      h[i] = a > 0 ? a : 0;
    }
    const hd = taskHead[r.task], W = w2[hd], B = b2[hd], out = heads[hd].out;
    for (let o = 0; o < out; o++) {
      let a = B[o];
      const wo = W[o];
      for (let i = 0; i < H; i++) a += wo[i] * h[i];
      logits[o] = a;
    }
    return hd;
  };

  const MOM = 0.9, BATCH = 64;
  const logits = new Array(16), p = new Array(16);
  const dw1 = w1.map((r) => r.map(() => 0)), db1 = b1.map(() => 0);
  const dw2 = w2.map((h2) => h2.map((r) => r.map(() => 0))), db2 = b2.map((v) => v.map(() => 0));
  const demb = emb.map((r) => r.map(() => 0));
  for (let ep = 0; ep < epochs; ep++) {
    const lr = 0.05 * Math.pow(0.9, ep);
    for (let i = train.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = train[i]; train[i] = train[j]; train[j] = t;
    }
    for (let base = 0; base < train.length; base += BATCH) {
      const nb = Math.min(BATCH, train.length - base);
      for (let i = 0; i < H; i++) { db1[i] = 0; dw1[i].fill(0); }
      for (const h2 of dw2) for (const r of h2) r.fill(0);
      for (const v of db2) v.fill(0);
      for (const r of demb) r.fill(0);
      for (let bi = 0; bi < nb; bi++) {
        const r = train[base + bi];
        const hd = fwd(r, logits);
        const out = heads[hd].out, W = w2[hd];
        let m = -Infinity;
        for (let o = 0; o < out; o++) if (logits[o] > m) m = logits[o];
        let s = 0;
        for (let o = 0; o < out; o++) { p[o] = Math.exp(logits[o] - m); s += p[o]; }
        for (let o = 0; o < out; o++) p[o] /= s;
        for (let o = 0; o < out; o++) {
          const g = (p[o] - (o === r.cls ? 1 : 0)) / nb;
          db2[hd][o] += g;
          const wo = dw2[hd][o];
          for (let i = 0; i < H; i++) wo[i] += g * h[i];
        }
        const de = demb[r.cul];
        for (let i = 0; i < H; i++) {
          if (h[i] <= 0) continue;
          let g = 0;
          for (let o = 0; o < out; o++) g += (p[o] - (o === r.cls ? 1 : 0)) * W[o][i];
          g /= nb;
          db1[i] += g;
          const wi = dw1[i], f = r.f;
          for (let j = 0; j < U; j++) wi[j] += g * f[j] * XS;
          const e = emb[r.cul];
          for (let k = 0; k < E; k++) { wi[U + k] += g * e[k]; de[k] += g * w1[i][U + k]; }
        }
      }
      for (const hd of [0, 1]) {
        const out = heads[hd].out;
        for (let o = 0; o < out; o++) {
          mb2[hd][o] = MOM * mb2[hd][o] - lr * db2[hd][o]; b2[hd][o] += mb2[hd][o];
          const wo = w2[hd][o], mo = mw2[hd][o], go = dw2[hd][o];
          for (let i = 0; i < H; i++) { mo[i] = MOM * mo[i] - lr * go[i]; wo[i] += mo[i]; }
        }
      }
      for (let i = 0; i < H; i++) {
        mb1[i] = MOM * mb1[i] - lr * db1[i]; b1[i] += mb1[i];
        const wi = w1[i], mi = mw1[i], gi = dw1[i];
        for (let j = 0; j < IN; j++) { mi[j] = MOM * mi[j] - lr * gi[j]; wi[j] += mi[j]; }
      }
      for (let c = 0; c < NCul; c++) for (let k = 0; k < E; k++) {
        memb[c][k] = MOM * memb[c][k] - lr * demb[c][k];
        emb[c][k] = Math.min(4, Math.max(0, emb[c][k] + memb[c][k]));
      }
    }
    if (ep % 6 === 5 || ep === epochs - 1) console.log(`trunk epoch ${ep + 1}/${epochs}`);
  }
  return { w1, b1, w2, b2, emb, U, E, H, heads, taskHead, taskCul };
}

// ---- quantize the trunk (the shipped recipe: Q1=11, per-head K2) --------
function quantizeTrunk(T) {
  const { w1, b1, w2, b2, U, E, H, heads } = T;
  const Q1 = 11;
  let max1 = 0;
  for (const r of w1) for (const v of r) { const a = Math.abs(v) * XS; if (a > max1) max1 = a; }
  let K1 = 0;
  while (Math.round(max1 * 2 ** (K1 + 1)) <= 127) K1++;
  const R1 = K1 - Q1;
  if (R1 < 0) throw new Error(`R1 negative (${R1})`);
  const w1q = w1.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * XS * 2 ** K1)))));
  const b1q = b1.map((v) => Math.round(v * 2 ** K1));
  const w2q = [], b2q = [];
  for (let hd = 0; hd < heads.length; hd++) {
    let max2 = 0;
    for (const r of w2[hd]) for (const v of r) { const a = Math.abs(v); if (a > max2) max2 = a; }
    let K2 = 0;
    while (Math.round(max2 * 2 ** (K2 + 1)) <= 127) K2++;
    w2q.push(w2[hd].map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * 2 ** K2))))));
    b2q.push(b2[hd].map((v) => Math.round(v * 2 ** (K2 + Q1))));
  }
  const embq = T.emb.map((r) => r.map((v) => Math.max(0, Math.min(32767, Math.round(v / XS)))));
  return { w1q, b1q, w2q, b2q, embq, R1, U, E, H, heads, taskHead: T.taskHead, taskCul: T.taskCul };
}

// ---- integer forward + eval ---------------------------------------------
function trunkHidden(Q, f, cul, hi) {
  const { w1q, b1q, R1, U, E, H, embq } = Q;
  const e = embq[cul];
  for (let i = 0; i < H; i++) {
    let a = b1q[i];
    const wi = w1q[i];
    for (let j = 0; j < U; j++) a += wi[j] * f[j];
    for (let k = 0; k < E; k++) a += wi[U + k] * e[k];
    a = a >> R1;
    hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;
  }
}
function trunkChoose(Q, hd, hi) {
  const W = Q.w2q[hd], B = Q.b2q[hd], out = Q.heads[hd].out, H = Q.H;
  let best = 0, bestV = -Infinity;
  for (let o = 0; o < out; o++) {
    let a = B[o];
    const wo = W[o];
    for (let i = 0; i < Q.H; i++) a += wo[i] * hi[i];
    if (a > bestV) { bestV = a; best = o; }
  }
  return best;
}
function evalTrunk(Q, rows, culOverride = null) {
  const hi = new Array(Q.H);
  let ok = 0;
  for (const r of rows) {
    trunkHidden(Q, r.f, culOverride == null ? r.cul : culOverride, hi);
    if (trunkChoose(Q, Q.taskHead[r.task], hi) === r.cls) ok++;
  }
  return { agree: rows.length ? +(ok / rows.length).toFixed(4) : 0, n: rows.length };
}

// ---- split by town (the trainer's own rule, applied per task) -----------
function splitTask(rows) {
  let maxTown = 0;
  for (const r of rows) if (r.town > maxTown) maxTown = r.town;
  const heldFrom = Math.floor((maxTown + 1) * 0.75);
  return { train: rows.filter((r) => r.town < heldFrom), test: rows.filter((r) => r.town >= heldFrom), heldFrom };
}

// ---- main ----------------------------------------------------------------
const { visCrab, visGull, cit } = loadCorpora();
const U0 = unionSpace(visCrab.meta.inputs, cit.meta.inputs);
const U = U0.names.length, E = 8;
const all = [
  mapRows(visCrab.rows, U0.mapVis, U, 0, 0),
  mapRows(visGull.rows, U0.mapVis, U, 1, 1),
  mapRows(cit.rows, U0.mapCit, U, 2, 0),
];
const rowsByTask = all.map(splitTask);
const headsOut = [{ out: visCrab.meta.classes.length }, { out: cit.meta.classes.length }];
const TASKNAME = ["vis-crab", "vis-gull", "cit-crab"];

// the parameter budget: the three shipped separates at hidden=48
const sepParams = 48 * 42 + 7 * 48 + 48 * 42 + 7 * 48 + 48 * cit.meta.inputs.length + cit.meta.classes.length * 48;
const H = Math.floor(sepParams / (U + E + headsOut[0].out + headsOut[1].out));
const trunkParams = H * (U + E) + H * (headsOut[0].out + headsOut[1].out);

const result = { mode: MODE, seed: SEED, U, E, H, sepParams, trunkParams };

if (MODE === "sep") {
  // the status quo, retrained here with the same instrument
  const datasets = [visCrab, visGull, cit];
  result.tasks = {};
  for (let t = 0; t < 3; t++) {
    const { artifact, heldout } = trainArtifact({ data: datasets[t], hidden: 48, epochs: EPOCHS, seed: SEED, noneRatio: null });
    result.tasks[TASKNAME[t]] = { int: heldout.agree, n: heldout.n, params: artifact.arch.in * 48 + artifact.arch.out * 48 };
  }
} else if (MODE === "trunk") {
  const T = trainTrunk({ rowsByTask, U, H, E, epochs: EPOCHS, seed: SEED, headsOut });
  const Q = quantizeTrunk(T);
  result.tasks = {};
  for (let t = 0; t < 3; t++) result.tasks[TASKNAME[t]] = evalTrunk(Q, rowsByTask[t].test);
  result.emb = Q.embq;
  result.R1 = Q.R1;
} else if (MODE === "zeroshot") {
  // gulls never seen: what does the prompt buy?
  const T = trainTrunk({ rowsByTask, U, H, E, epochs: EPOCHS, seed: SEED, headsOut, holdTask: 1 });
  const Q = quantizeTrunk(T);
  const gullTest = rowsByTask[1].test;
  result.zeroEmb = (() => { Q.embq.push(new Array(E).fill(0)); const r = evalTrunk(Q, gullTest, 2); Q.embq.pop(); return r; })();
  result.crabEmb = evalTrunk(Q, gullTest, 0);
  // embedding-only finetune on 1000 train-town gull rows: freeze everything,
  // learn ONLY the 8 floats a new cultureway document would carry
  const few = rowsByTask[1].train.slice(0, 1000);
  const e = T.emb[0].slice();  // warm-start from the crab prompt
  const me = new Array(E).fill(0);
  const h = new Array(T.H), logits = new Array(16), p = new Array(16);
  for (let ep = 0; ep < 30; ep++) {
    const lr = 0.05 * Math.pow(0.95, ep);
    for (const r of few) {
      for (let i = 0; i < T.H; i++) {
        let a = T.b1[i];
        const wi = T.w1[i], f = r.f;
        for (let j = 0; j < U; j++) a += wi[j] * f[j] * XS;
        for (let k = 0; k < E; k++) a += wi[U + k] * e[k];
        h[i] = a > 0 ? a : 0;
      }
      const W = T.w2[0], B = T.b2[0], out = headsOut[0].out;
      let m = -Infinity;
      for (let o = 0; o < out; o++) { let a = B[o]; const wo = W[o]; for (let i = 0; i < T.H; i++) a += wo[i] * h[i]; logits[o] = a; if (a > m) m = a; }
      let s = 0;
      for (let o = 0; o < out; o++) { p[o] = Math.exp(logits[o] - m); s += p[o]; }
      for (let k = 0; k < E; k++) {
        let g = 0;
        for (let i = 0; i < T.H; i++) {
          if (h[i] <= 0) continue;
          let gh = 0;
          for (let o = 0; o < out; o++) gh += (p[o] / s - (o === r.cls ? 1 : 0)) * W[o][i];
          g += gh * T.w1[i][U + k];
        }
        me[k] = 0.9 * me[k] - lr * g;
        e[k] = Math.min(4, Math.max(0, e[k] + me[k]));
      }
    }
  }
  T.emb.push(e);
  const Q2 = quantizeTrunk(T);
  result.tunedEmb = evalTrunk(Q2, gullTest, 2);
  result.tunedEmbInts = Q2.embq[2];
} else if (MODE === "delta") {
  // rung-0 compatibility: the dream-spike's per-town head delta, on the trunk
  const T = trainTrunk({ rowsByTask, U, H, E, epochs: EPOCHS, seed: SEED, headsOut });
  const Q = quantizeTrunk(T);
  const ESH = 8, USH = 11, BSTEP = 4096, WCLAMP = 127, BCLAMP = 1 << 24, NIGHTS = 40, EPB = 256;
  const out = headsOut[0].out;
  const perTown = new Map();
  for (const r of all[0]) { if (!perTown.has(r.town)) perTown.set(r.town, []); perTown.get(r.town).push(r); }
  let up = 0, down = 0, flat = 0, sumB = 0, sumA = 0, nT = 0, maxAbsW = 0;
  const hi = new Array(Q.H), lg = new Array(out);
  for (const [town, rows] of perTown) {
    const cut = Math.floor(rows.length * 0.6);
    const ring = rows.slice(0, cut), evalRows = rows.slice(cut);
    if (ring.length < 50 || evalRows.length < 50) continue;
    const w2d = new Int8Array(out * Q.H), b2d = new Int32Array(out);
    const effChoose = () => {
      let best = 0, bestV = -Infinity;
      for (let o = 0; o < out; o++) {
        let base = Q.b2q[0][o];
        const wo = Q.w2q[0][o];
        for (let i = 0; i < Q.H; i++) base += wo[i] * hi[i];
        let d = b2d[o];
        const di = o * Q.H;
        for (let i = 0; i < Q.H; i++) d += w2d[di + i] * hi[i];
        lg[o] = base * (1 << ESH) + d;
        if (lg[o] > bestV) { bestV = lg[o]; best = o; }
      }
      return best;
    };
    const agreeOn = (set) => {
      let ok = 0;
      for (const r of set) { trunkHidden(Q, r.f, 0, hi); if (effChoose() === r.cls) ok++; }
      return ok / set.length;
    };
    const before = agreeOn(evalRows);
    let s = town * 2654435761 | 0, draws = 0;
    const draw = () => { draws++; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return (t ^ t >>> 14) >>> 0; };
    for (let n = 0; n < NIGHTS; n++) for (let ee = 0; ee < EPB; ee++) {
      const r = ring[draw() % ring.length];
      trunkHidden(Q, r.f, 0, hi);
      const pred = effChoose();
      if (pred === r.cls) continue;
      const li = r.cls * Q.H, pi = pred * Q.H;
      for (let i = 0; i < Q.H; i++) {
        const step = hi[i] >> USH;
        const uw = w2d[li + i] + step; w2d[li + i] = uw > WCLAMP ? WCLAMP : uw;
        const dw = w2d[pi + i] - step; w2d[pi + i] = dw < -WCLAMP ? -WCLAMP : dw;
      }
      const bu = b2d[r.cls] + BSTEP; b2d[r.cls] = bu > BCLAMP ? BCLAMP : bu;
      const bd = b2d[pred] - BSTEP; b2d[pred] = bd < -BCLAMP ? -BCLAMP : bd;
    }
    const after = agreeOn(evalRows);
    for (const v of w2d) { const a = Math.abs(v); if (a > maxAbsW) maxAbsW = a; }
    sumB += before; sumA += after; nT++;
    if (after > before) up++; else if (after < before) down++; else flat++;
  }
  result.delta = { towns: nT, up, down, flat, meanBefore: +(sumB / nT).toFixed(4), meanAfter: +(sumA / nT).toFixed(4), maxAbsW, bytesPerActor: out * Q.H + out * 4 };
} else {
  console.error(`unknown --mode ${MODE}`);
  process.exit(2);
}

console.log(JSON.stringify(result));

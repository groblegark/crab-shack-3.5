// THE MIGRANT'S BRAIN — does a per-actor delta trained in town A help in
// town B?  (SPIKE, 3.5 tree, receipt-not-merge; task kd-7QNjkloY7K.)
//
// The trunk-spike already answered two neighbouring questions: `zeroshot`
// showed a tuned 8-int culture *prompt* transfers ACROSS cultures (a gull
// town zero-shot ABOVE its own separately-trained net), and `delta` showed a
// per-actor head *delta* helps WITHIN the town it was learned in
// (0.9881 -> 0.9903, up21/down2/flat9 over 32 towns). Neither asked the
// migrant's question: train the delta in town A, then carry it to a DIFFERENT
// town B and score it there. That is this arm.
//
//   node tools/neuro/trunk-spike/migrant.mjs [--seed 7] [--towns 32]
//        [--days 12] [--epochs 18]
//
// The instrument is the trunk-spike's, verbatim: the SAME recipe (momentum
// SGD, batch 64, lr 0.05*0.9^ep), the SAME three corpora, the SAME by-town
// held-out split, the QUANTIZED integer forward for scoring, and the delta
// mode's EXACT ring-nudge learner (ESH/USH/BSTEP/clamps/NIGHTS/EPB, per-town
// RNG). The trunk-training and quantize functions below are lifted verbatim
// from run.mjs so this arm's trunk is bit-for-bit the receipted one; the only
// new code is the migrant MATRIX at the bottom.
//
// THE MODEL OF A MIGRANT (stated so the numbers mean something):
//  * The culture EMBEDDING is the TOWN's "prompt" (shared infrastructure), so
//    conditioning follows the DESTINATION: the trunk hidden for town B's eval
//    rows is computed under B's culture, whoever is visiting.
//  * The head DELTA is the ACTOR's learned skill — it is what travels. It was
//    trained in home town A under A's conditioning; in B it rides on top of
//    B's trunk hidden. For same-culture (near) pairs the conditioning matches;
//    for cross-culture (far) pairs it does not, which is exactly the test.
//  * local control  = migrant(B->B)  (the self/diagonal cell)
//    untrained ctrl = trunk-only read on B (delta = 0)
//
// Cluster arm: regenerates its corpora in-pod, prints ONE compact JSON line
// last, writes nothing that must survive the pod.

import { readFileSync } from "fs";
import { collectRows, trainArtifact } from "../distill.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
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

// ================= lifted verbatim from run.mjs (do not edit) =============
function loadCorpora() {
  const t0 = Date.now();
  const gullDoc = JSON.parse(readFileSync("design/cultureways/gullway.json", "utf8"));
  const visCrab = collectRows({ towns: TOWNS, days: DAYS, culture: "crab" });
  const visGull = collectRows({ towns: TOWNS, days: DAYS, culture: "gull", cultureDoc: gullDoc });
  const cit = JSON.parse(readFileSync("tools/neuro/receipts/cit-data.json", "utf8"));
  console.log(`corpora: vis-crab ${visCrab.rows.length}, vis-gull ${visGull.rows.length}, cit ${cit.rows.length} rows (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  return { visCrab, visGull, cit };
}
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
function trainTrunk({ rowsByTask, U, H, E, epochs, seed, holdTask = null, headsOut }) {
  const NCul = 2, IN = U + E;
  const rnd = mulberry32(seed);
  const heads = headsOut;
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
function splitTask(rows) {
  let maxTown = 0;
  for (const r of rows) if (r.town > maxTown) maxTown = r.town;
  const heldFrom = Math.floor((maxTown + 1) * 0.75);
  return { train: rows.filter((r) => r.town < heldFrom), test: rows.filter((r) => r.town >= heldFrom), heldFrom };
}
// ================= end verbatim lift =====================================

// ---- the delta learner's constants (from run.mjs delta mode, verbatim) ---
const ESH = 8, USH = 11, BSTEP = 4096, WCLAMP = 127, BCLAMP = 1 << 24, NIGHTS = 40, EPB = 256;

// mulberry32-as-u32, seeded per home town exactly as delta mode (town*C).
function townDraw(townSeed) {
  let s = townSeed * 2654435761 | 0;
  return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return (t ^ t >>> 14) >>> 0; };
}

// Train one actor's head delta in its HOME town, from precomputed home hidden
// + base logits. Returns the delta arrays (w2d int8[out*H], b2d int32[out]).
function trainDelta({ hid, base, cls, out, H, townSeed }) {
  const w2d = new Int8Array(out * H), b2d = new Int32Array(out);
  const draw = townDraw(townSeed);
  const lg = new Array(out);
  const choose = (hi, bs) => {
    let best = 0, bestV = -Infinity;
    for (let o = 0; o < out; o++) {
      let d = b2d[o]; const di = o * H;
      for (let i = 0; i < H; i++) d += w2d[di + i] * hi[i];
      lg[o] = bs[o] * (1 << ESH) + d;
      if (lg[o] > bestV) { bestV = lg[o]; best = o; }
    }
    return best;
  };
  const n = cls.length;
  for (let night = 0; night < NIGHTS; night++) for (let ee = 0; ee < EPB; ee++) {
    const idx = draw() % n;
    const hi = hid[idx], c = cls[idx];
    const pred = choose(hi, base[idx]);
    if (pred === c) continue;
    const li = c * H, pi = pred * H;
    for (let i = 0; i < H; i++) {
      const step = hi[i] >> USH;
      const uw = w2d[li + i] + step; w2d[li + i] = uw > WCLAMP ? WCLAMP : uw;
      const dw = w2d[pi + i] - step; w2d[pi + i] = dw < -WCLAMP ? -WCLAMP : dw;
    }
    const bu = b2d[c] + BSTEP; b2d[c] = bu > BCLAMP ? BCLAMP : bu;
    const bd = b2d[pred] - BSTEP; b2d[pred] = bd < -BCLAMP ? -BCLAMP : bd;
  }
  return { w2d, b2d };
}

// Score a delta (or null for the untrained trunk read) on a target town's
// precomputed eval hidden + base logits. base[o] already folds the trunk head.
function scoreDelta({ w2d, b2d }, hid, base, cls, out, H) {
  const lg = new Array(out);
  let ok = 0;
  for (let r = 0; r < cls.length; r++) {
    const hi = hid[r], bs = base[r];
    let best = 0, bestV = -Infinity;
    for (let o = 0; o < out; o++) {
      let d = w2d ? b2d[o] : 0;
      if (w2d) { const di = o * H; for (let i = 0; i < H; i++) d += w2d[di + i] * hi[i]; }
      lg[o] = bs[o] * (1 << ESH) + d;
      if (lg[o] > bestV) { bestV = lg[o]; best = o; }
    }
    if (best === cls[r]) ok++;
  }
  return ok / cls.length;
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

const sepParams = 48 * 42 + 7 * 48 + 48 * 42 + 7 * 48 + 48 * cit.meta.inputs.length + cit.meta.classes.length * 48;
const H = Math.floor(sepParams / (U + E + headsOut[0].out + headsOut[1].out));

// The trunk: identical recipe/seed to the receipted spike -> identical brain.
const T = trainTrunk({ rowsByTask, U, H, E, epochs: EPOCHS, seed: SEED, headsOut });
const Q = quantizeTrunk(T);
const out = headsOut[0].out;                 // the vis-pick head (7 classes)

// ---- build the 1-D tree of towns: 32 crab (cul 0) + 32 gull (cul 1) ------
// A "town" is a (culture, local seed index). The trunk's by-town split held
// local indices >= heldFrom out of training; a HELD town's residual is real,
// so held x held is the honest "genuine migrant, genuine new town" cut.
const heldFrom = rowsByTask[0].heldFrom;     // 24 for TOWNS=32
const perCul = [all[0], all[1]];             // vis-crab rows, vis-gull rows
const towns = [];                            // global town list
for (let cul = 0; cul < 2; cul++) {
  const byTown = new Map();
  for (const r of perCul[cul]) { if (!byTown.has(r.town)) byTown.set(r.town, []); byTown.get(r.town).push(r); }
  for (const [local, rows] of [...byTown.entries()].sort((a, b) => a[0] - b[0])) {
    const cut = Math.floor(rows.length * 0.6);
    const ring = rows.slice(0, cut), evalRows = rows.slice(cut);
    if (ring.length < 50 || evalRows.length < 50) continue;
    towns.push({ cul, local, held: local >= heldFrom, ring, evalRows });
  }
}
const NT = towns.length;

// Precompute, per town: home hidden+base (its own culture) for delta TRAINING,
// and eval hidden+base (its own culture, = destination conditioning) for
// SCORING. Hidden is culture-conditioned but source-independent, so this is
// computed once per town, not once per pair.
const buf = new Array(Q.H);
function hidBase(rows, cul) {
  const hid = [], base = [], cls = [];
  for (const r of rows) {
    trunkHidden(Q, r.f, cul, buf);
    const hi = Int16Array.from(buf); hid.push(hi);
    const bs = new Int32Array(out);
    for (let o = 0; o < out; o++) { let a = Q.b2q[0][o]; const wo = Q.w2q[0][o]; for (let i = 0; i < Q.H; i++) a += wo[i] * hi[i]; bs[o] = a; }
    base.push(bs); cls.push(r.cls);
  }
  return { hid, base, cls };
}
for (const tw of towns) { tw.home = hidBase(tw.ring, tw.cul); tw.eval = hidBase(tw.evalRows, tw.cul); }

// Untrained control per target town (trunk-only read on its eval set).
for (const tw of towns) tw.naive = scoreDelta({ w2d: null, b2d: null }, tw.eval.hid, tw.eval.base, tw.eval.cls, out, Q.H);

// One delta per source town, trained in its home town (seeded by local index,
// so the crab diagonal reproduces run.mjs delta mode exactly).
for (const tw of towns) tw.delta = trainDelta({ hid: tw.home.hid, base: tw.home.base, cls: tw.home.cls, out, H: Q.H, townSeed: tw.local });

// The full migrant matrix M[s][t] = agree(delta_s, eval_t).  local[t]=M[t][t].
const M = Array.from({ length: NT }, () => new Array(NT));
for (let s = 0; s < NT; s++) for (let t = 0; t < NT; t++)
  M[s][t] = scoreDelta(towns[s].delta, towns[t].eval.hid, towns[t].eval.base, towns[t].eval.cls, out, Q.H);

// ---- aggregate by distance class ----------------------------------------
// classes: self | near-crab | near-gull | far-c2g | far-g2c
function classOf(s, t) {
  if (s === t) return "self";
  const cs = towns[s].cul, ct = towns[t].cul;
  if (cs === ct) return ct === 0 ? "near-crab" : "near-gull";
  return cs === 0 ? "far-c2g" : "far-g2c";
}
const EPS = 1e-9;
function fresh() { return { pairs: 0, sMig: 0, sNaive: 0, sLocal: 0, vsNaiveUp: 0, vsNaiveDn: 0, vsNaiveFlat: 0, vsLocalUp: 0, vsLocalDn: 0, vsLocalFlat: 0, worst: 1 }; }
function bump(b, mig, naive, local) {
  b.pairs++; b.sMig += mig; b.sNaive += naive; b.sLocal += local;
  const dn = mig - naive, dl = mig - local;
  if (dn > EPS) b.vsNaiveUp++; else if (dn < -EPS) b.vsNaiveDn++; else b.vsNaiveFlat++;
  if (dl > EPS) b.vsLocalUp++; else if (dl < -EPS) b.vsLocalDn++; else b.vsLocalFlat++;
  if (mig < b.worst) b.worst = mig;
}
function done(b) {
  if (!b.pairs) return { pairs: 0 };
  return {
    pairs: b.pairs,
    meanMigrant: +(b.sMig / b.pairs).toFixed(4),
    meanNaive: +(b.sNaive / b.pairs).toFixed(4),
    meanLocal: +(b.sLocal / b.pairs).toFixed(4),
    migMinusNaive: +((b.sMig - b.sNaive) / b.pairs).toFixed(4),
    migMinusLocal: +((b.sMig - b.sLocal) / b.pairs).toFixed(4),
    vsNaive: `${b.vsNaiveUp}/${b.vsNaiveDn}/${b.vsNaiveFlat}`,   // up/down/flat
    vsLocal: `${b.vsLocalUp}/${b.vsLocalDn}/${b.vsLocalFlat}`,
    worstMigrant: +b.worst.toFixed(4),
  };
}
const CLASSES = ["self", "near-crab", "near-gull", "far-c2g", "far-g2c"];
const allB = {}, heldB = {};
for (const c of CLASSES) { allB[c] = fresh(); heldB[c] = fresh(); }
for (let s = 0; s < NT; s++) for (let t = 0; t < NT; t++) {
  const c = classOf(s, t), mig = M[s][t], naive = towns[t].naive, local = M[t][t];
  bump(allB[c], mig, naive, local);
  if (towns[s].held && towns[t].held) bump(heldB[c], mig, naive, local);
}

// Diagonal cross-check vs run.mjs delta mode: crab self cells, up/down/flat
// and meanBefore(=naive)/meanAfter(=local) must match delta.json.
let up = 0, down = 0, flat = 0, sB = 0, sA = 0, nD = 0;
for (let i = 0; i < NT; i++) if (towns[i].cul === 0) {
  const before = towns[i].naive, after = M[i][i];
  if (after > before + EPS) up++; else if (after < before - EPS) down++; else flat++;
  sB += before; sA += after; nD++;
}
const diagonalCheck = { crabTowns: nD, up, down, flat, meanBefore: +(sB / nD).toFixed(4), meanAfter: +(sA / nD).toFixed(4), expect: "delta.json: up21/down2/flat9, before0.9881 after0.9903" };

const result = {
  mode: "migrant", seed: SEED, U, E, H, R1: Q.R1,
  towns: NT, held: towns.filter((t) => t.held).length,
  bytesPerActor: out * Q.H + out * 4,
  diagonalCheck,
  allPairs: Object.fromEntries(CLASSES.map((c) => [c, done(allB[c])])),
  heldXheld: Object.fromEntries(CLASSES.map((c) => [c, done(heldB[c])])),
};
console.log(JSON.stringify(result));

// THE DISTILLERY, as a library — collect, train, quantize, verify, one loop.
//
// The spike (collect.mjs + train.mjs) is a frozen receipt and stays exactly
// as it measured; THIS file is the productionized pipeline that the gull
// brain shipped through and that mcp policy_distill drives. Same recipe,
// same arithmetic, function-shaped.
//
//   import { collectRows, trainArtifact, verifyArtifact } from "./distill.mjs"
//
// or as a CLI:
//   node tools/neuro/distill.mjs --culture gull --doc design/cultureways/gullway.json \
//        [--towns 32] [--days 12] [--stage v3] [--hidden 24] [--epochs 25] [--seed 7] \
//        [--lr-decay 0.9] [--none-ratio all] [--class-weights 1,1,1,1,1,1,1] [--out artifact.json]
//
// Collection installs the target culture with an arrival override (gate 0,
// share 0.85) so the labeled species is common in the data — a TRAINING
// configuration, never a shipping change — and logs only that culture's
// thinks, so taste-dependent observables carry the culture's own palate.
// The document's own `policies` are stripped for collection: the SCRIPT is
// the teacher, and it must be the one deciding while it labels.

import { createSim } from "../simlib.mjs";
import { readFileSync, writeFileSync } from "fs";

export const CLASSES = ["none", "shack:food", "juicebar:drink", "shack:drink",
  "showers:clean", "arcade:fun", "hotel:room"];
// THE CITIZEN SURFACE (cit_errand.candidate) - must equal NEURO_SURFACES'
// list in game.js, order included, or the artifact's indices mean nothing.
export const CIT_CLASSES = ["none", "shack:food", "selfcook:food", "soup:food",
  "juicebar:drink", "shack:drink", "selfcook:drink", "tap:drink",
  "showers:clean", "tap:clean", "arcade:fun", "ball:fun", "vote:vote"];
export const CIT_INPUTS = [
  "citizen.hunger.q20", "citizen.thirst.q20", "citizen.dirt.q20",
  "citizen.bored.q20", "citizen.tired.q20", "citizen.wallet.cents",
  "clock.tmin",
  "citizen.away", "citizen.sick", "citizen.duty", "citizen.working",
  "citizen.shift.end.rel", "citizen.shift.leave.rel",
  "citizen.wage.gripe.q20", "citizen.home.dist.px",
  "citizen.ball.players", "citizen.ball.cd", "citizen.ball.dist.px",
  "citizen.job.shack", "citizen.job.juicebar", "citizen.npc",
  "citizen.nudge.live",
  "citizen.poll.open", "citizen.voted", "citizen.pot.warm",
  "citizen.tap.dist.px", "citizen.poll.dist.px",
  ...["shack", "juicebar", "showers", "arcade"].flatMap((b) => [
    `cit.staffed:${b}`, `cit.afford.count:${b}`, `cit.dist.px:${b}`,
  ]),
];
export const INPUTS = [
  "need.hunger.q20", "need.thirst.q20", "need.dirt.q20", "need.bored.q20",
  "wallet.cents", "room.reserve.cents", "clock.tmin", "self.cultured",
  "room.wants", "room.free", "room.price.cents", "self.x.px",
  ...["shack", "juicebar", "showers", "arcade", "hotel"].flatMap((b) => [
    `stop.open:${b}`, `stop.roomfor:${b}`, `stop.afford.count:${b}`,
    `stop.dist.px:${b}`, `stop.appeal.q16:${b}`, `stop.taste.best:${b}`,
  ]),
];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// THE STAGING RECIPES — what the teacher is asked to teach ABOUT.
//
// "Teacher coverage is the training distribution" (the ladder close-out): an
// observable that never moves in the collection towns is an observable the
// trained net is BLIND to, and the lever behind it breaks in play. So the
// staging enumerates the levers the economy actually pulls and makes the data
// pull them. Both recipes are deterministic per town seed.
//
//   "v2"  the price-diverse recipe the shipped v2 artifact was distilled from:
//         a half/half shopfront split and a third of boards off-default.
//         Kept so that artifact reproduces from this file forever.
//   "v3"  five levers instead of one — shopfront mix, boards, hours signs,
//         wages, and the town's standing. Default.
export const STAGES = ["v2", "v3"];
const BIZES = ["shack", "juicebar", "showers", "arcade", "hotel"];

function stagePokes(stage, seed, townIdx) {
  const prnd = mulberry32(seed ^ 0x9e3779b9);
  const pokes = [];
  if (stage === "v2") {
    if (townIdx % 2) pokes.push(`coins = 500000; tryBuy("arcade"); tryBuy("juicebar"); tryBuy("chef"); tryBuy("table"); crabs[0].p.job = "juicebar"; crabs[1].p.job = "arcade"; rosterGen++`);
    for (const b of BIZES)
      if (prnd() < 0.34) pokes.push(`setBizPriceIdx(${JSON.stringify(b)}, ${14 + Math.floor(prnd() * 13)})`);
    return pokes;
  }
  // ---- v3 -----------------------------------------------------------------
  // LEVER 1, THE SHOPFRONT MIX. v2 ran half bare shacks and half full
  // promenades, so `stop.open:arcade` was a town-level constant and the table
  // count never moved. Four profiles and a variable table/menu ladder instead:
  // juicebar and arcade each exist in some towns and not others, and where
  // they exist the seating and the menu vary, which is what moves
  // stop.roomfor and stop.afford.count.
  // Weighted, not uniform: a class the teacher rarely demonstrates is a class
  // the net cannot learn, and arcade:fun is the thinnest one in the corpus
  // (only a promenade town has an arcade at all). One eighth bare, two
  // kitchen, two juice, three promenade keeps the arcade's share of the rows
  // near v2's while the bare towns still teach an empty beach.
  const profile = [0, 1, 1, 2, 2, 3, 3, 3][Math.floor(prnd() * 8)];   // 0 bare, 1 kitchen, 2 juice, 3 promenade
  const tables = Math.floor(prnd() * 5);             // 0..4 extra tables
  const grill = prnd() < 0.4 ? 1 : 0, board = prnd() < 0.4 ? 1 : 0;
  // LEVER 4, THE WAGE, first: a shop that cannot recruit refuses the hire
  // BEFORE the money moves, so the board has to be set before tryBuy("chef").
  const wage = 800 + Math.floor(prnd() * 27) * 100;  // the stepper's own 800..3400 band
  const buys = [`coins = 900000`, `setBizWage("shack", ${wage})`];
  if (profile >= 1) { buys.push(`tryBuy("chef")`); for (let t = 0; t < tables; t++) buys.push(`tryBuy("table")`); }
  if (grill) buys.push(`tryBuy("grill")`);
  if (board) buys.push(`tryBuy("board")`);
  if (profile === 2 || profile === 3) buys.push(`tryBuy("juicebar")`, `if (crabs[0]) crabs[0].p.job = "juicebar"`);
  if (profile === 3) buys.push(`tryBuy("arcade")`, `tryBuy("cadegear")`, `if (crabs[1]) crabs[1].p.job = "arcade"`);
  buys.push(`rosterGen++`);
  pokes.push(buys.join(";"));
  // LEVER 2, THE PRICE BOARD (v2's one lever, widened): half the boards sit
  // off-default across the full 14..26 index, so appeal, afford.count and
  // taste.best all move, and the hotel's board moves room.price.cents with
  // them.
  for (const b of BIZES)
    if (prnd() < 0.5) pokes.push(`setBizPriceIdx(${JSON.stringify(b)}, ${14 + Math.floor(prnd() * 13)})`);
  // LEVER 3, THE HOURS SIGN. stop.open was effectively a function of the clock
  // alone in v2 — one opening time for every town — so the net could learn the
  // clock and never the sign. Two fifths of the signs move.
  for (const b of BIZES)
    if (prnd() < 0.4) {
      const open = 6 * 60 + Math.floor(prnd() * 9) * 60;
      const close = Math.min(24 * 60, open + 4 * 60 + Math.floor(prnd() * 11) * 60);
      pokes.push(`setBizHours(${JSON.stringify(b)}, ${open}, ${close})`);
    }
  // LEVER 5, THE TOWN'S STANDING. Reputation sets the arrival volume, so it is
  // the crowding dial: how often stop.roomfor and room.free read false, and how
  // deep the queues in front of a stop get.
  pokes.push(`rep = ${Math.floor(prnd() * 90000)}`);
  return pokes;
}

// Math.max(...arr) blows the call stack past ~120k arguments, and a
// collection is now bigger than that: fold instead of spreading.
const maxOf = (arr, f) => { let m = -Infinity; for (const v of arr) { const x = f ? f(v) : v; if (x > m) m = x; } return m; };

// ---- collection: the sim labels its own training set -------------------
export function collectRows({ towns = 32, days = 12, culture = "crab", cultureDoc = null,
  seedBase = 1337, inputs = INPUTS, onTown = null, stage = "v3" } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`unknown collection stage "${stage}"; stages are ${STAGES.join(", ")}`);
  const CLS = Object.fromEntries(CLASSES.map((c, i) => [c, i]));
  const rows = [];
  let ticksTotal = 0, thinksTotal = 0;
  for (let i = 0; i < towns; i++) {
    const seed = seedBase + i * 7919;
    const sim = createSim({ seed, realm: "main" });   // kernel off: visPick is live and labels
    if (culture !== "crab") {
      if (!cultureDoc) throw new Error(`collecting for "${culture}" needs its cultureway document`);
      const doc = { ...cultureDoc, arrival: { repGate: 0, shareMax: 0.85, shareRamp: 0.001 } };
      delete doc.policies;   // the script teaches; nothing else may decide
      sim.G(`loadCultures({ ${JSON.stringify(culture)}: ${JSON.stringify(doc)} })`);
    }
    for (const poke of stagePokes(stage, seed, i)) sim.G(poke);
    // THE SCRIPT IS THE TEACHER: disarm every brain in a collection sim, or
    // the live crab artifact decides the thinks and the wrapped reference
    // never runs - the first retrain collected ZERO rows this way. (This
    // also runs after loadCultures above, which would have re-armed them.)
    sim.G("BRAINS = {}");
    // the logger rides the engine's own registry: same readers, same order
    sim.G(`
      window._nnLog = []; window._nnT0 = T;
      window._nnReaders = neuroResolve(${JSON.stringify(inputs)});
      window._nnF = new Array(${inputs.length});
      const __origVisPick = visPick;
      visPick = function (k) {
        const e = __origVisPick(k);
        if ((k.culture || "crab") === ${JSON.stringify(culture)}) {
          neuroVector(k, window._nnReaders, window._nnF);
          let cls = 0;
          if (e) cls = ${JSON.stringify(CLS)}[e.biz + ":" + e.need] ?? 0;
          window._nnLog.push([cls, ...window._nnF]);
        }
        return e;
      };`);
    sim.runDays(days);
    const log = JSON.parse(sim.G("JSON.stringify(window._nnLog)"));
    ticksTotal += sim.G("T - window._nnT0");
    thinksTotal += log.length;
    for (const r of log) rows.push({ town: i, seed, cls: r[0], f: r.slice(1) });
    if (onTown) onTown(i, seed, log.length);
  }
  return {
    meta: { registryVersion: 1, inputs, classes: CLASSES, culture, towns, days, stage,
      rows: rows.length, thinksPerTick: +(thinksTotal / Math.max(1, ticksTotal)).toFixed(5) },
    rows,
  };
}

// ---- the CITIZEN collection: pickErrand labels its own training set -----
// Same discipline as collectRows: brains disarmed (the script must be the
// one deciding while it labels), the engine's own registry assembles the
// vector, the engine's own citErrandClass maps a candidate to its class -
// there is no second mapper to drift. Residents are crab-native today, so
// culture stays a filter with one live value; the settlers phase widens it.
export function collectCitizenRows({ towns = 32, days = 12, culture = "crab",
  seedBase = 1337, inputs = CIT_INPUTS, onTown = null, stage = "v3" } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`unknown collection stage "${stage}"; stages are ${STAGES.join(", ")}`);
  const CLS = Object.fromEntries(CIT_CLASSES.map((c, i) => [c, i]));
  const rows = [];
  let ticksTotal = 0, thinksTotal = 0;
  for (let i = 0; i < towns; i++) {
    const seed = seedBase + i * 7919;
    const sim = createSim({ seed, realm: "main" });
    for (const poke of stagePokes(stage, seed, i)) sim.G(poke);
    sim.G("BRAINS = {}");   // the script is the teacher; nothing else may decide
    sim.G(`
      window._nnLog = []; window._nnT0 = T;
      window._nnReaders = neuroResolve(${JSON.stringify(inputs)});
      window._nnF = new Array(${inputs.length});
      const __origPick = pickErrand;
      pickErrand = function (c) {
        const e = __origPick(c);
        if (((c.p && c.p.culture) || "crab") === ${JSON.stringify(culture)}) {
          neuroVectorCit(c, window._nnReaders, window._nnF);
          const cls = e ? (${JSON.stringify(CLS)}[citErrandClass(e)] ?? 0) : 0;
          window._nnLog.push([cls, ...window._nnF]);
        }
        return e;
      };`);
    sim.runDays(days);
    const log = JSON.parse(sim.G("JSON.stringify(window._nnLog)"));
    ticksTotal += sim.G("T - window._nnT0");
    thinksTotal += log.length;
    for (const r of log) {
      // THE INTEGER TRIPWIRE, at the door: the registry's contract is ints in
      // [0,32767], and a fraction here means a reader skipped its floor - the
      // exact bug the wasm xcheck leg caught in citizen.shift.leave.rel.
      for (let j = 1; j < r.length; j++)
        if (!Number.isInteger(r[j]))
          throw new Error(`observable "${inputs[j - 1]}" read ${r[j]} - the registry is integers only`);
      rows.push({ town: i, seed, cls: r[0], f: r.slice(1) });
    }
    if (onTown) onTown(i, seed, log.length);
  }
  return {
    meta: { registryVersion: 1, inputs, classes: CIT_CLASSES, culture, towns, days, stage,
      rows: rows.length, thinksPerTick: +(thinksTotal / Math.max(1, ticksTotal)).toFixed(5) },
    rows,
  };
}

// ---- training + quantization (the spike's recipe, function-shaped) -----
//
// TWO KNOBS THE RETRAIN ADDED, both defaulting to the v2 recipe exactly so
// the shipped artifact stays reproducible from this file:
//
//   noneRatio    how many `none` rows to keep, as a multiple of the largest
//                minority class. `null` (the default now) keeps EVERY none
//                row, i.e. trains on the sim's own class prior; `3` is the v2
//                recipe and reproduces that artifact bit-for-bit.
//   classWeights per-class loss weights (default: none — all ones), normalized
//                so the weighted mean over the training set is 1, which keeps
//                the learning rate comparable across weightings.
//
// They are the same lever seen from two sides, and MEASURED (v2 collection,
// 42->24->7, seed 7, 25 epochs) the downsampling was the whole act-early bias:
//
//   noneRatio 3  (v2)  95.711%  373 act-early     <- the shipped brain
//   noneRatio 6        96.277%  161 act-early
//   noneRatio 12       96.751%   88 act-early
//   noneRatio null     96.936%   43 act-early
//
// Downsampling `none` shifts the trained posterior away from the sim's prior,
// and a net that has been told waiting is rarer than it is ACTS where the
// script waits. Weighting `none` up on top of the v2 sampling buys the same
// correction (nonew=4 cuts act-early to 167) but costs accuracy, because it
// distorts the loss instead of restoring the distribution: keeping the rows is
// strictly the better half of the lever, and the weights stay available for a
// surface whose classes are genuinely unbalanced in cost.
export function trainArtifact({ data, hidden = 24, epochs = 25, seed = 7, surface = "vis_pick.candidate",
  noneRatio = null, classWeights = null, lr0 = 0.05, lrDecay = 0.9 }) {
  const { meta, rows } = data;
  const NF = meta.inputs.length, NC = meta.classes.length, HID = hidden;
  const XS = 1 / 8192;
  const rnd = mulberry32(seed);
  const maxTown = maxOf(rows, (r) => r.town);
  const heldFrom = Math.floor((maxTown + 1) * 0.75);
  const test = rows.filter((r) => r.town >= heldFrom);
  let train = rows.filter((r) => r.town < heldFrom);
  if (noneRatio != null) {
    const minorMax = Math.max(1, ...Array.from({ length: NC - 1 }, (_, c) => train.filter((r) => r.cls === c + 1).length));
    const noneKeep = minorMax * noneRatio;
    const nones = train.filter((r) => r.cls === 0);
    const keep = new Set();
    for (let i = 0; i < noneKeep && i < nones.length; i++) keep.add(Math.floor(rnd() * nones.length));
    train = train.filter((r) => r.cls !== 0).concat(nones.filter((_, i) => keep.has(i)));
  }
  // class weights, mean-normalized over the training set (all-ones is a no-op)
  const CW = new Array(NC).fill(1);
  if (classWeights) {
    for (let c = 0; c < NC; c++) CW[c] = classWeights[c] == null ? 1 : classWeights[c];
    let s = 0;
    for (const r of train) s += CW[r.cls];
    const k = train.length / Math.max(1e-9, s);
    for (let c = 0; c < NC; c++) CW[c] *= k;
  }

  const w1 = Array.from({ length: HID }, () => Array.from({ length: NF }, () => (rnd() * 2 - 1) * Math.sqrt(2 / NF)));
  const b1 = new Array(HID).fill(0);
  const w2 = Array.from({ length: NC }, () => Array.from({ length: HID }, () => (rnd() * 2 - 1) * Math.sqrt(2 / HID)));
  const b2 = new Array(NC).fill(0);
  const mw1 = w1.map((r) => r.map(() => 0)), mb1 = b1.map(() => 0);
  const mw2 = w2.map((r) => r.map(() => 0)), mb2 = b2.map(() => 0);
  const h = new Array(HID), logits = new Array(NC), p = new Array(NC);
  const fwd = (f) => {
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
  };
  const MOM = 0.9, BATCH = 64;
  const dw1 = w1.map((r) => r.map(() => 0)), db1 = b1.map(() => 0);
  const dw2 = w2.map((r) => r.map(() => 0)), db2 = b2.map(() => 0);
  for (let ep = 0; ep < epochs; ep++) {
    const lr = lr0 * Math.pow(lrDecay, ep);
    for (let i = train.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = train[i]; train[i] = train[j]; train[j] = t;
    }
    for (let base = 0; base < train.length; base += BATCH) {
      const nb = Math.min(BATCH, train.length - base);
      for (let i = 0; i < HID; i++) { db1[i] = 0; dw1[i].fill(0); }
      for (let o = 0; o < NC; o++) { db2[o] = 0; dw2[o].fill(0); }
      for (let bi = 0; bi < nb; bi++) {
        const r = train[base + bi];
        fwd(r.f);
        let m = -Infinity;
        for (const v of logits) if (v > m) m = v;
        let s = 0;
        for (let o = 0; o < NC; o++) { p[o] = Math.exp(logits[o] - m); s += p[o]; }
        for (let o = 0; o < NC; o++) p[o] /= s;
        const cw = CW[r.cls];
        for (let o = 0; o < NC; o++) {
          const g = cw * (p[o] - (o === r.cls ? 1 : 0)) / nb;
          db2[o] += g;
          const wo = dw2[o];
          for (let i = 0; i < HID; i++) wo[i] += g * h[i];
        }
        for (let i = 0; i < HID; i++) {
          if (h[i] <= 0) continue;
          let g = 0;
          for (let o = 0; o < NC; o++) g += (p[o] - (o === r.cls ? 1 : 0)) * w2[o][i];
          g *= cw / nb;
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
  }
  // quantize (Q1=11, K1/K2 fitted so max|w| uses the int8 range)
  const Q1 = 11;
  const max1 = maxOf(w1, (r) => maxOf(r, Math.abs)) * XS;
  let K1 = 0;
  while (Math.round(max1 * 2 ** (K1 + 1)) <= 127) K1++;
  const R1 = K1 - Q1;
  if (R1 < 0) throw new Error(`R1 negative (${R1}) - hidden scale exceeds weight scale`);
  const w1q = w1.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * XS * 2 ** K1)))));
  const b1q = b1.map((v) => Math.round(v * 2 ** K1));
  const max2 = maxOf(w2, (r) => maxOf(r, Math.abs));
  let K2 = 0;
  while (Math.round(max2 * 2 ** (K2 + 1)) <= 127) K2++;
  const w2q = w2.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * 2 ** K2)))));
  const b2q = b2.map((v) => Math.round(v * 2 ** (K2 + Q1)));
  const artifact = {
    kind: "brain", registryVersion: meta.registryVersion,
    inputs: meta.inputs, classes: meta.classes,
    arch: { in: NF, hidden: HID, out: NC },
    shifts: { R1 },
    w1: w1q, b1: b1q, w2: w2q, b2: b2q,
    provenance: { surface, culture: meta.culture, data: { towns: meta.towns, days: meta.days, rows: meta.rows, stage: meta.stage || "v2" }, seed, epochs,
      noneRatio, lrDecay, ...(classWeights ? { classWeights } : {}) },
  };
  const held = verifyArtifact(artifact, { rows: test });
  artifact.provenance.heldout = held;
  return { artifact, heldout: held, trainRows: train.length };
}

// ---- verification: the engine's own recipe over labeled rows -----------
export function verifyArtifact(artifact, data) {
  const { arch, shifts, w1, b1, w2, b2 } = artifact;
  const R1 = shifts.R1;
  let ok = 0, n = 0;
  const conf = Array.from({ length: arch.out }, () => new Array(arch.out).fill(0));
  for (const r of data.rows) {
    const hi = new Array(arch.hidden);
    for (let i = 0; i < arch.hidden; i++) {
      let a = b1[i];
      const wi = w1[i];
      for (let j = 0; j < arch.in; j++) a += wi[j] * r.f[j];
      a = a >> R1;
      hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;
    }
    let best = 0, bestV = -2147483648;
    for (let o = 0; o < arch.out; o++) {
      let a = b2[o];
      const wo = w2[o];
      for (let i = 0; i < arch.hidden; i++) a += wo[i] * hi[i];
      if (a > bestV) { bestV = a; best = o; }
    }
    conf[r.cls][best]++; n++;
    if (best === r.cls) ok++;
  }
  return { agree: n ? +(ok / n).toFixed(4) : 0, n, conf };
}

// ---- CLI ---------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const culture = opt("--culture", "crab");
  const surface = opt("--surface", "vis_pick.candidate");
  const docPath = opt("--doc", null);
  const cultureDoc = docPath ? JSON.parse(readFileSync(docPath, "utf8")) : null;
  const collect = surface === "cit_errand.candidate" ? collectCitizenRows : collectRows;
  const data = collect({
    towns: parseInt(opt("--towns", "32")), days: parseInt(opt("--days", "12")),
    culture, cultureDoc, stage: opt("--stage", "v3"),
    seedBase: parseInt(opt("--seedbase", "1337")),
    onTown: (i, seed, n) => process.stderr.write(`town ${i} (${seed}): ${n} ${culture} thinks\n`),
  });
  console.log(JSON.stringify(data.meta));
  const nr = opt("--none-ratio", "all");   // "all" = the sim's own class prior
  const { artifact, heldout, trainRows } = trainArtifact({
    data, surface, hidden: parseInt(opt("--hidden", "24")),
    epochs: parseInt(opt("--epochs", "25")), seed: parseInt(opt("--seed", "7")),
    lrDecay: parseFloat(opt("--lr-decay", "0.9")),
    noneRatio: nr === "all" ? null : parseFloat(nr),
    classWeights: opt("--class-weights", null) ? opt("--class-weights").split(",").map(Number) : null,
  });
  console.log(`trained on ${trainRows} rows; held-out agreement ${(heldout.agree * 100).toFixed(2)}% over ${heldout.n}`);
  const out = opt("--out", `tools/neuro/receipts/brain-${culture}.json`);
  writeFileSync(out, JSON.stringify(artifact));
  console.log("artifact written:", out);
}

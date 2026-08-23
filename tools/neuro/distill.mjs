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
//        [--towns 32] [--days 12] [--hidden 24] [--epochs 25] [--seed 7] [--out artifact.json]
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

// ---- collection: the sim labels its own training set -------------------
export function collectRows({ towns = 32, days = 12, culture = "crab", cultureDoc = null,
  seedBase = 1337, inputs = INPUTS, onTown = null } = {}) {
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
    if (i % 2) sim.G(`coins = 500000; tryBuy("arcade"); tryBuy("juicebar"); tryBuy("chef"); tryBuy("table"); crabs[0].p.job = "juicebar"; crabs[1].p.job = "arcade"; rosterGen++;`);
    // PRICE-DIVERSE STAGING — the lesson the first shipped artifact taught:
    // every collection town sat at the default board, so stop.appeal never
    // varied and the trained net was BLIND TO PRICE - it broke the rivalry's
    // repricing lever (the suite's own sweep caught it). A third of boards
    // per town now sit off-default across the full 14..26 index range, so
    // the appeal observable actually moves in the data and the teacher's
    // lessons cover the lever the economy pulls. Deterministic per town.
    {
      const prnd = mulberry32(seed ^ 0x9e3779b9);
      const pokes = [];
      for (const b of ["shack", "juicebar", "showers", "arcade", "hotel"])
        if (prnd() < 0.34) pokes.push(`setBizPriceIdx(${JSON.stringify(b)}, ${14 + Math.floor(prnd() * 13)})`);
      if (pokes.length) sim.G(pokes.join(";"));
    }
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
    meta: { registryVersion: 1, inputs, classes: CLASSES, culture, towns, days,
      rows: rows.length, thinksPerTick: +(thinksTotal / Math.max(1, ticksTotal)).toFixed(5) },
    rows,
  };
}

// ---- training + quantization (the spike's recipe, function-shaped) -----
export function trainArtifact({ data, hidden = 24, epochs = 25, seed = 7, surface = "vis_pick.candidate" }) {
  const { meta, rows } = data;
  const NF = meta.inputs.length, NC = meta.classes.length, HID = hidden;
  const XS = 1 / 8192;
  const rnd = mulberry32(seed);
  const maxTown = Math.max(...rows.map((r) => r.town));
  const heldFrom = Math.floor((maxTown + 1) * 0.75);
  const test = rows.filter((r) => r.town >= heldFrom);
  let train = rows.filter((r) => r.town < heldFrom);
  const minorMax = Math.max(1, ...Array.from({ length: NC - 1 }, (_, c) => train.filter((r) => r.cls === c + 1).length));
  const noneKeep = minorMax * 3;
  const nones = train.filter((r) => r.cls === 0);
  const keep = new Set();
  for (let i = 0; i < noneKeep && i < nones.length; i++) keep.add(Math.floor(rnd() * nones.length));
  train = train.filter((r) => r.cls !== 0).concat(nones.filter((_, i) => keep.has(i)));

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
    const lr = 0.05 * Math.pow(0.9, ep);
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
  }
  // quantize (Q1=11, K1/K2 fitted so max|w| uses the int8 range)
  const Q1 = 11;
  const max1 = Math.max(...w1.flat().map(Math.abs)) * XS;
  let K1 = 0;
  while (Math.round(max1 * 2 ** (K1 + 1)) <= 127) K1++;
  const R1 = K1 - Q1;
  if (R1 < 0) throw new Error(`R1 negative (${R1}) - hidden scale exceeds weight scale`);
  const w1q = w1.map((r) => r.map((v) => Math.max(-127, Math.min(127, Math.round(v * XS * 2 ** K1)))));
  const b1q = b1.map((v) => Math.round(v * 2 ** K1));
  const max2 = Math.max(...w2.flat().map(Math.abs));
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
    provenance: { surface, culture: meta.culture, data: { towns: meta.towns, days: meta.days, rows: meta.rows }, seed, epochs },
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
  const docPath = opt("--doc", null);
  const cultureDoc = docPath ? JSON.parse(readFileSync(docPath, "utf8")) : null;
  const data = collectRows({
    towns: parseInt(opt("--towns", "32")), days: parseInt(opt("--days", "12")),
    culture, cultureDoc,
    onTown: (i, seed, n) => process.stderr.write(`town ${i} (${seed}): ${n} ${culture} thinks\n`),
  });
  console.log(JSON.stringify(data.meta));
  const { artifact, heldout, trainRows } = trainArtifact({
    data, hidden: parseInt(opt("--hidden", "24")),
    epochs: parseInt(opt("--epochs", "25")), seed: parseInt(opt("--seed", "7")),
  });
  console.log(`trained on ${trainRows} rows; held-out agreement ${(heldout.agree * 100).toFixed(2)}% over ${heldout.n}`);
  const out = opt("--out", `tools/neuro/receipts/brain-${culture}.json`);
  writeFileSync(out, JSON.stringify(artifact));
  console.log("artifact written:", out);
}

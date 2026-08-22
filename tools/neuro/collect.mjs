// THE DATA FACTORY — the deterministic sim labels its own training set.
//
//   node tools/neuro/collect.mjs [--towns 32] [--days 12] [--out tools/neuro/receipts/data.json]
//
// Wraps the JS reference visPick (kernel OFF — the two backends are proven
// equal, so reference data is both backends' data) with a logger that
// assembles THE DECLARED INPUT VECTOR (observables.mjs — the vector is the
// brain's document, not a hardcoded layout) and records the script's own
// choice as the label. Zero game-code changes: visPick is a module binding
// and the closure evaluator can reassign it — the suite's own idiom.
//
// Also measures the think cadence (vis_pick calls per tick) — the number
// that decides whether batched SIMD inference is phase-1 or phase-2.

import { createSim } from "../simlib.mjs";
import { resolve, SPIKE_INPUTS, SPIKE_CLASSES, REGISTRY_VERSION } from "./observables.mjs";
import { writeFileSync } from "fs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const TOWNS = parseInt(opt("--towns", "32"));
const DAYS = parseInt(opt("--days", "12"));
const OUT = opt("--out", "tools/neuro/receipts/data.json");

const { names, exprs } = resolve(SPIKE_INPUTS);
const CLS = new Map(SPIKE_CLASSES.map((c, i) => [c, i]));

// The wrapper, generated from the declaration. __res mirrors kernelVisPick's
// marshal (roomReserve is an input to affordability). Date is the host's -
// sandbox performance is sim time, useless for costing the script.
const WRAP = `
window._nnLog = [];
window._nnT0 = T;
window._nnScriptMs = 0; window._nnCalls = 0;
const __origVisPick = visPick;
visPick = function (k) {
  const __t0 = Date.now();
  const e = __origVisPick(k);
  window._nnScriptMs += Date.now() - __t0; window._nnCalls++;
  const __res = roomReserve(k);
  const f = [${exprs.join(",\n    ")}];
  let cls = 0;
  if (e) { const key = e.biz + ":" + e.need; cls = ${JSON.stringify(Object.fromEntries(CLS))}[key] ?? 0; }
  window._nnLog.push([cls, ...f]);
  return e;
};`;

const rows = [];
let scriptMs = 0, scriptCalls = 0, ticksTotal = 0, thinksTotal = 0;
const t0 = Date.now();
for (let i = 0; i < TOWNS; i++) {
  const seed = 1337 + i * 7919;
  const sim = createSim({ seed, realm: "main" });   // kernel off: visPick is live
  // every other town gets the full promenade (the suite's own staging idiom),
  // or juicebar/arcade classes would never appear in the data at all
  if (i % 2) sim.G(`coins = 500000; tryBuy("arcade"); tryBuy("juicebar"); tryBuy("chef"); tryBuy("table"); crabs[0].p.job = "juicebar"; crabs[1].p.job = "arcade"; rosterGen++;`);
  sim.G(WRAP);
  sim.runDays(DAYS);
  const log = JSON.parse(sim.G("JSON.stringify(window._nnLog)"));
  const ticks = sim.G("T - window._nnT0");
  scriptMs += sim.G("window._nnScriptMs"); scriptCalls += sim.G("window._nnCalls");
  ticksTotal += ticks; thinksTotal += log.length;
  for (const r of log) rows.push({ town: i, seed, cls: r[0], f: r.slice(1) });
  process.stderr.write(`town ${i} (${seed}): ${log.length} thinks over ${ticks} ticks\n`);
}

const byCls = SPIKE_CLASSES.map((c, i) => `${c}=${rows.filter((r) => r.cls === i).length}`);
const meta = {
  registryVersion: REGISTRY_VERSION, inputs: names, classes: SPIKE_CLASSES,
  towns: TOWNS, days: DAYS, rows: rows.length,
  thinksPerTick: +(thinksTotal / ticksTotal).toFixed(5),
  scriptUsPerCall: +(scriptMs * 1000 / scriptCalls).toFixed(2),
  wallSec: +((Date.now() - t0) / 1000).toFixed(1),
};
writeFileSync(OUT, JSON.stringify({ meta, rows }));
console.log(JSON.stringify(meta));
console.log("class balance:", byCls.join(" "));

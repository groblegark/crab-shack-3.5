// Teacher corpus for the dream spike — distill.mjs's collection idiom, small.
//
//   node tools/neuro/dream-spike/collect-crab.mjs [--towns 16] [--days 12]
//                                                 [--out /tmp/dream-corpus.json]
//
// Two rules this exists to honor (both paid-for lessons):
//   1. THE SCRIPT IS THE TEACHER: disarm every brain (BRAINS = {}) or the
//      live crab artifact decides the thinks and the wrap sees only pigs —
//      the first retrain collected ZERO rows this way, and the first draft
//      of THIS spike collected 7,287 pig thinks and called them crabs.
//   2. Filter to the culture being taught: visPick serves every visitor.

import { createSim } from "../../simlib.mjs";
import { resolve, SPIKE_INPUTS, SPIKE_CLASSES } from "../observables.mjs";
import { writeFileSync } from "fs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const TOWNS = parseInt(opt("--towns", "16"));
const DAYS = parseInt(opt("--days", "12"));
const OUT = opt("--out", "/tmp/dream-corpus.json");

const { names } = resolve(SPIKE_INPUTS);
const CLS = Object.fromEntries(SPIKE_CLASSES.map((c, i) => [c, i]));

const rows = [];
for (let i = 0; i < TOWNS; i++) {
  const seed = 1337 + i * 7919;
  const sim = createSim({ seed, realm: "main" });
  if (i % 2) sim.G(`coins = 500000; tryBuy("arcade"); tryBuy("juicebar"); tryBuy("chef"); tryBuy("table"); crabs[0].p.job = "juicebar"; crabs[1].p.job = "arcade"; rosterGen++;`);
  sim.G("BRAINS = {}");   // the script teaches; nothing else may decide
  sim.G(`
    window._nnLog = []; window._nnT0 = T;
    window._nnReaders = neuroResolve(${JSON.stringify(names)});
    window._nnF = new Array(${names.length});
    const __origVisPick = visPick;
    visPick = function (k) {
      const e = __origVisPick(k);
      if ((k.culture || "crab") === "crab") {
        neuroVector(k, window._nnReaders, window._nnF);
        let cls = 0;
        if (e) cls = ${JSON.stringify(CLS)}[e.biz + ":" + e.need] ?? 0;
        window._nnLog.push([cls, ...window._nnF]);
      }
      return e;
    };`);
  sim.runDays(DAYS);
  const log = JSON.parse(sim.G("JSON.stringify(window._nnLog)"));
  for (const r of log) rows.push({ town: i, seed, cls: r[0], f: r.slice(1) });
  process.stderr.write(`town ${i} (${seed}): ${log.length} crab thinks\n`);
}
const meta = { inputs: names, classes: SPIKE_CLASSES, towns: TOWNS, days: DAYS, rows: rows.length };
writeFileSync(OUT, JSON.stringify({ meta, rows }));
console.log(JSON.stringify(meta.rows), "crab thinks,", TOWNS, "towns x", DAYS, "days ->", OUT);

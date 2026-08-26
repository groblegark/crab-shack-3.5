#!/usr/bin/env node
// Cross-arm reader for the U1 M/E illness attribution study (kd-QT3h8kmuj6).
// Reads the four rollLog dumps shiftill.mjs --dump wrote and prints ONE table:
// mean risk per shift (M/E/D), the M/E RISK ratio, and town-wide illness rate,
// for each arm side by side. Rare-event discipline (advice kd-acLf4tyS4N): a
// ratio built on fewer than MIN_ROLLS at-risk rolls a side is REFUSED, not
// printed — the count is shown so the refusal is legible.
//
//   node tools/shiftill-compare.mjs <arm1.json> <arm2.json> ...
//
// The seam stores hunger/thirst in raw Q20 and dirt/tired already /Q20 — but
// this reader only touches x.risk (the game's own illRisk output, scale-free)
// and counts, so no need normalisation is applied here.
import { readFileSync } from "fs";

const MIN_ROLLS = 200;   // refuse an M/E ratio below this many at-risk rolls a side
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: shiftill-compare.mjs <dump.json> ..."); process.exit(1); }

const mean = (a, f) => a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : 0;
const rat = (a, b) => b ? (a / b).toFixed(3) : (a ? "inf" : "1.000");

function armStats(log) {
  const crew = log.filter(x => !x.npc);          // M/E is a crew thing
  const byShift = {};
  for (const k of ["M", "E", "D"]) {
    const g = log.filter(x => x.shift === k);
    byShift[k] = { n: g.length, risk: mean(g, x => x.risk) };
  }
  const M = crew.filter(x => x.shift === "M"), E = crew.filter(x => x.shift === "E");
  return {
    M: { n: M.length, risk: mean(M, x => x.risk) },
    E: { n: E.length, risk: mean(E, x => x.risk) },
    D: byShift.D,
    // town-wide risk over ALL at-risk rolls (the denominator the game.js
    // comment uses for its "town-wide" column, e.g. shipped 0.01678).
    townRisk: mean(log, x => x.risk),
    nAll: log.length,
  };
}

console.log("ARM".padEnd(26) + "  M rolls  E rolls   M risk    E risk   M/E RISK   townRisk  (allRolls)");
console.log("-".repeat(100));
for (const f of files) {
  const log = JSON.parse(readFileSync(f, "utf8"));
  const s = armStats(log);
  const enough = s.M.n >= MIN_ROLLS && s.E.n >= MIN_ROLLS;
  const me = enough ? "x" + rat(s.M.risk, s.E.risk)
    : "REFUSED (<" + MIN_ROLLS + " rolls/side)";
  const name = f.split("/").pop().replace(/\.rolllog\.json$/, "");
  console.log(
    name.padEnd(26)
    + String(s.M.n).padStart(8) + String(s.E.n).padStart(9)
    + "  " + s.M.risk.toFixed(5) + "  " + s.E.risk.toFixed(5)
    + "  " + me.padStart(9)
    + "  " + s.townRisk.toFixed(5) + "  " + String(s.nAll).padStart(7));
}
console.log("-".repeat(100));
console.log("M/E RISK: 1.00 = shift tells you nothing. The bar the town set is x0.98 (game.js illRisk header).");
console.log("townRisk: mean assembled risk over ALL at-risk rolls (game.js 'town-wide' column; shipped pre-U1 ~0.01678).");

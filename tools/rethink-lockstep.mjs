// THE LOCKSTEP BISECT (interruptible commitment's diagnostic, not a gate).
// The agreement referee proves two days; the full-suite soaks diverged later
// on the wasm arms only. This walks a ref/kernel pair day by day to name the
// first divergent DAY, then re-walks that day in small steps to name the
// first divergent TICK and FIELD, then dumps the divergent actor's context.
// Usage: node tools/rethink-lockstep.mjs [seed] [maxDays]
import { createSim } from "./simlib.mjs";

const seed = parseInt(process.argv[2] || "1337", 10);
const maxDays = parseInt(process.argv[3] || "7", 10);

const mk = (kernel) => createSim({ seed, kernel });
const digest = (s) => s.G(`JSON.stringify({
  pool: allCrabs().concat(visitorsInTown()).map(c => [c.si, PXQ[c.si], PYQ[c.si], PWYQ[c.si]]),
  vis: customers.filter(k => k.visitor).map(k => [k.si, VSTCP[k.si], k.wallet, k.buys,
    Math.round(k.thinkT), k.claimed ? 1 : 0, k.biz || "", k.need || ""]),
  draws: window._wasmKernel ? new Uint32Array(window._wasmKernel.memory.buffer, 26628, 1)[0] : (window._dayDraws || -1),
  coins, day, tmin
})`);
const armCount = (s) => s.G(`{ const real = srand; window._dayDraws = 0; srand = () => (window._dayDraws++, real()); }`);

let ref = mk("off"), kern = mk("wasm");
armCount(ref);
let badDay = 0;
for (let d = 1; d <= maxDays; d++) {
  ref.runDays(d); kern.runDays(d);
  const a = JSON.parse(digest(ref)), b = JSON.parse(digest(kern));
  const eq = JSON.stringify(a.pool) === JSON.stringify(b.pool) && JSON.stringify(a.vis) === JSON.stringify(b.vis);
  console.log(`day ${d}: pool ${JSON.stringify(a.pool) === JSON.stringify(b.pool) ? "ok" : "DIVERGED"}, vis ${JSON.stringify(a.vis) === JSON.stringify(b.vis) ? "ok" : "DIVERGED"}, coins ${a.coins}/${b.coins}`);
  if (!eq) { badDay = d; break; }
}
if (!badDay) { console.log(JSON.stringify({ verdict: "no divergence through day " + maxDays })); process.exit(0); }

// re-walk the bad day in 200-tick steps
ref = mk("off"); kern = mk("wasm");
if (badDay > 1) { ref.runDays(badDay - 1); kern.runDays(badDay - 1); }
let firstBad = null;
for (let step = 0; step < 2000 && !firstBad; step++) {
  ref.runUntil("false", { maxSteps: 200 }); kern.runUntil("false", { maxSteps: 200 });
  const a = JSON.parse(digest(ref)), b = JSON.parse(digest(kern));
  if (JSON.stringify(a.pool) !== JSON.stringify(b.pool) || JSON.stringify(a.vis) !== JSON.stringify(b.vis)) {
    // name the first divergent visitor row
    let who = null;
    for (let i = 0; i < Math.max(a.vis.length, b.vis.length); i++)
      if (JSON.stringify(a.vis[i]) !== JSON.stringify(b.vis[i])) { who = { i, ref: a.vis[i], kern: b.vis[i] }; break; }
    if (!who) for (let i = 0; i < Math.max(a.pool.length, b.pool.length); i++)
      if (JSON.stringify(a.pool[i]) !== JSON.stringify(b.pool[i])) { who = { i, pool: true, ref: a.pool[i], kern: b.pool[i] }; break; }
    firstBad = { day: badDay, tmin: a.tmin, refTmin: a.tmin, kernTmin: b.tmin, who,
      visFields: ["si", "stC", "wallet", "buys", "thinkT", "claimed", "biz", "need"] };
  }
  if (a.day > badDay) break;
}
console.log(JSON.stringify({ verdict: "diverged", firstBad }, null, 1));

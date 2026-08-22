// fpcapture — dump the frozen day-2 fingerprint for both seeds, in the exact
// shape the suite's "hours: defaults are behavior-identical" scenario reads.
// The receipt half of the re-baseline: capture before, capture after, hand
// both to tools/fpdiff.mjs. Lives with the slice's working papers on purpose.
import { createSim } from "../../../tools/simlib.mjs";
const out = {};
for (const seed of [1337, 4242]) {
  const sim = createSim({ seed });
  sim.runDays(2);
  out[seed] = JSON.parse(sim.G(`JSON.stringify({
    day, tmin: Math.round(tmin), coins, rep: Math.round(rep*10000)/10000,
    catch: townCatch, serves: window._stats.tourServes, crabServes: window._stats.crabServes,
    rage: window._stats.tourRage, till: OWNERS.sudsy.till,
    wallets: allCrabs().map(c => [c.p.name, c.p.wallet]),
    pos: allCrabs().map(c => [Math.round(c.x*10)/10, Math.round(c.y*10)/10])
  })`));
}
console.log(JSON.stringify(out, null, 1));

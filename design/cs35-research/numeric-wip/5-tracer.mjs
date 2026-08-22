// Slice 5 divergence tracer - the slice 3/4 discipline: run the pre-tail
// tree and this tree in lockstep on one seed, digest per tick, and NAME the
// first tick where they part. Deleted before the landing closes.
//   node design/cs35-research/numeric-wip/5-tracer.mjs <preTreeDir> <seed>
import { pathToFileURL } from "url";

const [, , preDir, seedArg] = process.argv;
const seed = +seedArg || 4242;
const mkSim = async (dir) => {
  const m = await import(pathToFileURL(dir + "/tools/simlib.mjs"));
  return m.createSim({ seed, realm: "main" });
};
const a = await mkSim(preDir);            // pre-tail
const b = await mkSim(process.cwd());     // this tree

// rep: pre is float points, post is millirep - compare at the milli grain,
// rounded, so only a REAL divergence (not the representation) trips it.
// patience: pre float seconds, post Q12 - same normalization trick.
const DIG = (repMode, patMode) => `JSON.stringify({
  t: typeof tday === "number" ? tday : -1,
  coins, day, tmin,
  rep: ${repMode === "milli" ? "rep" : "Math.round(rep * 1000)"},
  crabs: allCrabs().map(c => [c.p.name, c.dayState, Math.round(c.x * 256), c.p.wallet,
    c.p.hunger, c.p.thirst, c.p.dirt, c.errandCust ? 1 : 0]),
  vis: customers.map(k => [k.name || "?", k.state, Math.round((k.x || 0) * 256),
    ${patMode === "q12" ? "Math.round((k.patience || 0) / 4.096)" : "Math.round((k.patience || 0) * 1000)"},
    k.wallet != null ? k.wallet : -1]),
  ferry: typeof ferryT === "number" ? ferryT : -1,
  price: trade && trade.price, catch: townCatch,
})`;
const digA = DIG("float", "float"), digB = DIG("milli", "q12");

let step = 0;
const STEP = "window._dc = window._dc || 0; window.simNow += 50; window.rafCb(window.simNow);";
a.G("{ const r = srand; window._dc = 0; srand = () => (window._dc++, r()); }");
b.G("{ const r = srand; window._dc = 0; srand = () => (window._dc++, r()); }");
for (; step < 60000; step++) {
  a.G(STEP); b.G(STEP);
  const da = a.G(digA), db = b.G(digB);
  if (da !== db) {
    const ja = JSON.parse(da), jb = JSON.parse(db);
    console.log(`FIRST DIVERGENCE at step ${step}  day ${ja.day} tmin ${ja.tmin} (tick-of-day ${ja.t})`);
    for (const k of Object.keys(ja)) {
      const sa = JSON.stringify(ja[k]), sb = JSON.stringify(jb[k]);
      if (sa !== sb) console.log(`  ${k}:\n    pre : ${sa}\n    post: ${sb}`);
    }
    console.log(`  sim draws so far: pre ${a.G("window._dc")}  post ${b.G("window._dc")}`);
    process.exit(0);
  }
  if (step % 1200 === 0) process.stderr.write(`t=${step} ok\r`);
  if (a.G("day") >= 4) break;
}
console.log(`no divergence through step ${step}`);

// PROBE (kd-NjPUnXyBOv): what can a DOCUMENT do with a zero-step recipe that it
// could not do with a one-step one? Single-scenario, single-process, in-pod.
// Measures the RUNTIME capability a `relax` ruling would unlock — it never
// touches the validator: the shop is installed with a legal one-step recipe and
// the steps array is emptied in-sim, after validation, before placement.
import { readFileSync } from "node:fs";
import { createSim } from "../simlib.mjs";

const Q20 = 1048576;
const qn = (f) => Math.round(f * Q20);
const SLOT1 = "crabshack3_v1_s1";
const PIG = JSON.parse(readFileSync(new URL("../fixtures/cultures-pig.json", import.meta.url), "utf8"));

// ARMS: same shop, same price, same raw, same seeds. Only `steps` and the
// declared station capacity move.
const ONLY = process.env.ARM ? process.env.ARM.split(",") : null;
const ARMS = [
  { id: "one-step-cap1", steps: [["bar", 0.5, "juice"]], bar: 1 },
  { id: "one-step-cap4", steps: [["bar", 0.5, "juice"]], bar: 4 },
  { id: "one-step-30s",  steps: [["bar", 30,  "juice"]], bar: 4 },
  { id: "zero-step",     steps: [],                      bar: 4 },
  // MUTATION DEMO for the stationCap finding: same arm as one-step-cap4, with
  // stationCap reassigned in-realm to HONOUR the declared capacity. If the
  // finding is real this arm must beat one-step-cap4; if it does not, the
  // "declared capacity is inert" claim does not bite and that is the finding.
  { id: "one-step-CAPFIX", steps: [["bar", 0.5, "juice"]], bar: 4, capfix: true },
  { id: "30s-CAPFIX",      steps: [["bar", 30,  "juice"]], bar: 4, capfix: true },
];

function run(arm, seed) {
  const store = new Map();
  const a = createSim({ seed, storage: store, fresh: false });
  a.runDays(1);
  a.G("save()");
  const env = JSON.parse(store.get(SLOT1));
  const fx = JSON.parse(JSON.stringify(PIG));
  fx.meta.id = "boar"; delete fx.foodways; delete fx.policies;
  fx.settlers = { apron: true };
  fx.businesses = { boarjuice: { name: "BOAR JUICE", short: "BOARJ", sign: "BOAR JUICE",
    kind: "shopfront", rent: 20, wage: 22, stations: { fruitbin: 1, bar: arm.bar },
    source: "fruitbin", out: "bar",
    // ALWAYS installed as a legal one-step row; the zero-step arm empties it
    // in-sim after validation. The validator is not patched anywhere here.
    recipes: [{ id: "bjuice", icon: "juice", pay: 6, raw: "fruit",
                steps: [["bar", 0.5, "juice"]] }] } };
  env.cultures = { boar: fx };
  env.visitors = [
    { n: "RASHER", cu: "boar", c: 3, a: "strawhat", x: 900, y: 150, s: "roam",
      w: 60, p: 80, sp: 0, ni: 2, nh: 0, rn: 0, un: 0, ar: 1, lt: 5000, b: 0,
      hu: qn(0.2), th: qn(0.2), di: qn(0.2), bo: qn(0.2), ti: qn(0.2), log: [], st: {} }];
  store.set(SLOT1, JSON.stringify(env));

  const b = createSim({ seed: seed + 1, storage: store, fresh: false });
  if (arm.capfix) b.G(`stationCap = function (bizKey, kind) {
    if (bizKey === "shack" && kind === "grill") return 1 + UPS.grill.lvl;
    if (bizKey === "shack" && kind === "board") return 1 + UPS.board.lvl;
    if (bizKey === "juicebar" && kind === "juicer") return 2;
    const st = BIZ[bizKey] && BIZ[bizKey].stations && BIZ[bizKey].stations[kind];
    return st ? st.length : 1;
  };`);
  const set = JSON.stringify(arm.steps);
  const got = JSON.parse(b.G(`JSON.stringify((() => {
    hireCrew();
    const pig = crabs.find(c => c.p.name === "RASHER");
    if (!pig) return { fail: "RASHER never settled" };
    pig.p.wallet = 20000;
    // the mutation under test, AFTER install/validation, BEFORE placement
    CULTURES.boar.businesses.boarjuice.recipes[0].steps = ${set};
    const why = placeBusiness("boar", "boarjuice", "eastlot", pig);
    if (why) return { fail: "placement refused: " + why };
    const B = BIZ.boarjuice;
    return { ok: true,
      declaredCap: CULTURES.boar.businesses.boarjuice.stations.bar,
      posts: B.stations.bar.length,
      busyLen: (busy.boarjuice.bar || []).length,
      busyKeys: Object.keys(busy.boarjuice),
      effCap: stationCap("boarjuice", "bar") };
  })())`));
  if (got.fail) return got;

  // THE TOWN BUYS: point every thirsty crab at the new counter, then run.
  // count SERVES at this counter, and every second of station-slot contention.
  // serve is a global function declaration in the realm, so the binding is
  // writable and every call site inside game.js resolves through it.
  b.G(`dataErrand({ id: "t.bjuice", need: "drink", biz: "boarjuice", at: 0, ap100: 200 });
       window._n = 0; window._wait = 0;
       const _serve = serve;
       serve = function (c) { if (c.workBiz === "boarjuice" || (c.p && c.p.job === "boarjuice")) window._n++; return _serve(c); };
       window._t0 = coins + crabs.reduce((s, c) => s + c.p.wallet, 0)
         + Object.keys(OWNERS).reduce((s, o) => s + (OWNERS[o].till || 0), 0) + townFund.bal;`);
  b.runDays(6);
  const out = JSON.parse(b.G(`JSON.stringify((() => {
    const total = coins + crabs.reduce((s, c) => s + c.p.wallet, 0)
      + Object.keys(OWNERS).reduce((s, o) => s + (OWNERS[o].till || 0), 0) + townFund.bal;
    return { day, till: OWNERS.own_boarjuice.till, served: (window._n || 0),
      waitSlot: crabs.filter(c => c.ksC === KS.waitSlot).length,
      conserved: total - window._t0 };
  })())`));
  return Object.assign(got, out);
}

const arg = process.argv[2] || "";
const seeds = arg ? arg.split(",").map(Number) : [77];
for (const arm of ARMS.filter(a => !ONLY || ONLY.includes(a.id))) {
  const rows = seeds.map((s) => run(arm, s));
  for (let i = 0; i < seeds.length; i++) {
    const r = rows[i];
    if (r.fail) { console.log(`${arm.id.padEnd(15)} seed ${seeds[i]}  FAIL ${r.fail}`); continue; }
    console.log(`${arm.id.padEnd(15)} seed ${String(seeds[i]).padStart(3)}  declCap=${r.declaredCap} posts=${r.posts} busyLen=${r.busyLen} EFFCAP=${r.effCap}  served=${String(r.served).padStart(3)}  till=$${(r.till/100).toFixed(2).padStart(8)}  $/serve=$${r.served ? (r.till/r.served/100).toFixed(2) : 'n/a'}  day=${r.day}`);
  }
  const ok = rows.filter(r => !r.fail);
  const sum = (f) => ok.reduce((s, r) => s + f(r), 0);
  console.log(`${arm.id.padEnd(15)} TOTAL over ${ok.length} seeds: served=${sum(r => r.served)}  till=$${(sum(r => r.till) / 100).toFixed(2)}  $/serve=$${(sum(r => r.till) / Math.max(1, sum(r => r.served)) / 100).toFixed(2)}`);
  console.log("");
}

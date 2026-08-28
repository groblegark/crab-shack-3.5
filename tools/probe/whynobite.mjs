// Why did raising stationCap 1 -> 4 change nothing? Hypothesis: the declared
// shop only ever has ONE worker, so a second slot is never requested.
import { readFileSync } from "node:fs";
import { createSim } from "../simlib.mjs";
const Q20 = 1048576, qn = (f) => Math.round(f * Q20), SLOT1 = "crabshack3_v1_s1";
const PIG = JSON.parse(readFileSync(new URL("../fixtures/cultures-pig.json", import.meta.url), "utf8"));

function run(seed, secs) {
  const store = new Map();
  const a = createSim({ seed, storage: store, fresh: false });
  a.runDays(1); a.G("save()");
  const env = JSON.parse(store.get(SLOT1));
  const fx = JSON.parse(JSON.stringify(PIG));
  fx.meta.id = "boar"; delete fx.foodways; delete fx.policies; fx.settlers = { apron: true };
  fx.businesses = { boarjuice: { name: "BOAR JUICE", short: "BOARJ", sign: "BOAR JUICE",
    kind: "shopfront", rent: 20, wage: 22, stations: { fruitbin: 1, bar: 4 },
    source: "fruitbin", out: "bar",
    recipes: [{ id: "bjuice", icon: "juice", pay: 6, raw: "fruit", steps: [["bar", secs, "juice"]] }] } };
  env.cultures = { boar: fx };
  env.visitors = [{ n: "RASHER", cu: "boar", c: 3, a: "strawhat", x: 900, y: 150, s: "roam",
    w: 60, p: 80, sp: 0, ni: 2, nh: 0, rn: 0, un: 0, ar: 1, lt: 5000, b: 0,
    hu: qn(0.2), th: qn(0.2), di: qn(0.2), bo: qn(0.2), ti: qn(0.2), log: [], st: {} }];
  store.set(SLOT1, JSON.stringify(env));
  const b = createSim({ seed: seed + 1, storage: store, fresh: false });
  b.G(`hireCrew(); const pig = crabs.find(c => c.p.name === "RASHER"); pig.p.wallet = 20000;
       placeBusiness("boar", "boarjuice", "eastlot", pig);
       dataErrand({ id: "t.bjuice", need: "drink", biz: "boarjuice", at: 0, ap100: 200 });
       window._acq = 0; window._deny = 0; window._maxStaff = 0; window._maxBusy = 0;
       const _ta = tryAcquire;
       tryAcquire = function (bk, k) { const r = _ta(bk, k);
         if (bk === "boarjuice") { window._acq++; if (r < 0) window._deny++; }
         return r; };
       const _uk = updateKitchen;
       updateKitchen = function (c, dt) {
         if (c.workBiz === "boarjuice" || c.p.job === "boarjuice") {
           const staff = crabs.filter(x => x.p.job === "boarjuice").length;
           if (staff > window._maxStaff) window._maxStaff = staff;
           const inPipe = crabs.filter(x => x.p.job === "boarjuice" && x.cust).length;
           if (inPipe > window._maxBusy) window._maxBusy = inPipe;
         }
         return _uk(c, dt); };`);
  b.runDays(6);
  return JSON.parse(b.G(`JSON.stringify({ acq: window._acq, deny: window._deny,
    maxStaff: window._maxStaff, maxConcurrentServers: window._maxBusy,
    staffNow: crabs.filter(x => x.p.job === "boarjuice").map(x => x.p.name) })`));
}
for (const secs of [0.5, 30]) for (const s of [77, 31]) {
  const r = run(s, secs);
  console.log(`step=${String(secs).padStart(4)}s seed ${s}  tryAcquire calls=${r.acq} denied=${r.deny}  maxStaff=${r.maxStaff}  maxConcurrentServers=${r.maxConcurrentServers}  staff=[${r.staffNow}]`);
}

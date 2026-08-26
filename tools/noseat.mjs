// NO-SEAT CENSUS — "crabs go somewhere else to eat if no table" (Matt,
// bead kd-VJun0LAYHG). That bead calls the current behaviour UNMEASURED and
// asks: "does it queue, stall, or silently drop the intent?" It does none of
// the three. In serve()'s counter branch (game.js:14448, entered at
// stC === VS.waiting) the sale is RUNG UP FIRST, the guest's need is already
// zeroed by payAndBenefit, and only THEN does pickSeat run — so a null seat
// sends an already-fed, already-paying customer to VS.leaving. The SALE is
// never lost. What is lost is the TABLE TIP (paid when dining ends,
// game.js:16486, tourists only), the reputation tier (800 for table service
// against 400 at the counter) and the busing the dwell would have made.
//
// NOT the counter/table tip split: `seated` in payAndBenefit is
// stC === VS.seatedWaiting, which belongs to the OTHER serve branch
// (game.js:14429). In this branch stC is still `waiting` at ring-up for
// everyone, including guests who DO get a table. Reading that constant as
// the cost of a missed seat is a mistake this comment exists to stop.
//
// Measured at a267ab9, 12 days x 16 seeds (two blocks — per CLAUDE.md an
// 8-seed block is a coin): crab 7/334 = 2.1%, tourist 51/1,640 = 3.1%.
// noTables was 0/0, so every miss is a real "all tables busy or dirty" at a
// shop that HAS tables. Re-measure against the tree you are landing on.
//
// THE MUTATION DEMO, so the instrument is not trusted on its word: give the
// shack every table it can buy (`UPS.table.lvl = 4` -> 6 instead of 2) and
// move nothing else. 12 days, seeds 1337-1339, as-shipped -> control:
//   crab 3/1/0 -> 0/0/0, tourist 1/4/4 -> 0/0/0, and seated counts RISE
//   (1337: 18->23 crab, 94->113 tourist). Every miss goes to zero, so the
// probe tracks table scarcity and nothing else. If a future run shows misses
// that do NOT vanish under this control, the probe is counting something
// else and the rate above is not what it claims.
//
// READ-ONLY BY CONSTRUCTION. Every field sampled is one the engine already
// wrote; the probe never calls srand() or re-evaluates a gate, per the
// idleaudit.mjs lesson about perturbing the very stream you are measuring.
//
//   node tools/noseat.mjs [--days 12] [--seeds 8] [--seedbase 0]
import { createSim } from "./simlib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const days = +arg("days", 12), seeds = +arg("seeds", 8), base = +arg("seedbase", 0);
const T = { seatedCrab: 0, seatedTour: 0, noSeatCrab: 0, noSeatTour: 0,
  noTablesCrab: 0, noTablesTour: 0, lodging: 0, stall: 0, seatDecline: 0, seatSatAnyway: 0 };
for (let s = 0; s < seeds; s++) {
  const seed = 1337 + base + s;
  const sim = createSim({ seed });
  const { G } = sim;
  // We cannot patch a const fn in the vm realm, so rather than wrapping
  // pickSeat we observe its OUTCOME at the one call site that decides
  // dine-in-or-leave (game.js:14453): a customer who is `served`, has no
  // table, and sits at VS.leaving, at a non-lodging non-stall biz that HAS
  // tables, took the no-seat exit.
  //
  // A VISITOR OBJECT IS REUSED ACROSS VISITS, so counting must be per
  // SERVED EPISODE, not per object. The stamp below keys on the fields that
  // change between episodes; without it a guest lingering in `leaving` is
  // re-counted on every sampled tick.
  G(`window._ns = { seatedCrab:0, seatedTour:0, noSeatCrab:0, noSeatTour:0,
       noTablesCrab:0, noTablesTour:0, lodging:0, stall:0 };
     window._nsTick = function () {
       const P = window._ns;
       for (const k of customers) {
         if (!k.served) continue;
         const stamp = k.si + "|" + k.biz + "|" + (k.orderIdx||0) + "|" + k.stC;
         if (k.__nsDone === stamp) continue;
         k.__nsDone = stamp;
         const b = BIZ[k.biz]; if (!b) continue;
         if (b.lodging) { P.lodging++; continue; }
         if (b.stalls) { P.stall++; continue; }
         const tables = bizTables(k.biz);
         if (!tables || !tables.length) { k.isCrab ? P.noTablesCrab++ : P.noTablesTour++; continue; }
         if (k.table) { k.isCrab ? P.seatedCrab++ : P.seatedTour++; }
         else if (k.stC === VS.leaving) { k.isCrab ? P.noSeatCrab++ : P.noSeatTour++; }
       }
     };`);
  sim.runDays(days, { onTick: (g) => g(`window._nsTick && window._nsTick();`), tickEvery: 5 });
  const r = G(`(function(){ const P=window._ns; return JSON.stringify({
      seatedCrab:P.seatedCrab, seatedTour:P.seatedTour, noSeatCrab:P.noSeatCrab,
      noSeatTour:P.noSeatTour, noTablesCrab:P.noTablesCrab, noTablesTour:P.noTablesTour,
      lodging:P.lodging, stall:P.stall,
      seatDecline:(window._stats&&window._stats.seatDecline)||0,
      seatSatAnyway:(window._stats&&window._stats.seatSatAnyway)||0 }); })();`);
  const o = JSON.parse(r);
  for (const k of Object.keys(T)) T[k] += (o[k] || 0);
  console.log(`seed ${seed}: noSeatCrab=${o.noSeatCrab} noSeatTour=${o.noSeatTour} seatedCrab=${o.seatedCrab} seatedTour=${o.seatedTour}`);
}
console.log("\nTOTALS over", seeds, "seeds x", days, "days (seedbase", base + "):");
console.log(JSON.stringify(T, null, 2));

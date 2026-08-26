// IDLE AUDIT — "SUDSY goes to work and stops doing anything while there"
// (Matt, 2026-08-25). Answers the question the report asks, for any crab:
// while they are CLOCKED IN, how long do they stand perfectly still, and WHY
// didn't the anti-idle wander-off (PLAN, BOREDOM - DRIFT) move them?
//
// READ-ONLY BY CONSTRUCTION. Every field sampled here is one the engine already
// wrote. The probe never calls srand(), wanderSpot(), or anything else that
// draws from the sim stream — an earlier version of this tool re-evaluated the
// wander gate itself and perturbed the very sequence it was measuring, which is
// how it briefly "measured" zero wanders on seeds that do wander.
//
// Usage:
//   node tools/idleaudit.mjs [--days 12] [--seeds 8] [--seedbase 0] [--who SUDSY]
// Per CLAUDE.md an 8-seed block is a coin — run --seedbase 0 AND 8.
import { createSim } from "./simlib.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const days = +arg("days", 12), seeds = +arg("seeds", 8), base = +arg("seedbase", 0);
const who = arg("who", "SUDSY");
const SEC = 20;                    // TICK_HZ: sim ticks per real second
const GMIN_PER_REAL_SEC = 4;       // a ~10h shift runs in ~150 real seconds

const T = { n: 0, idle: 0, boredOk: 0, yieldOk: 0, both: 0, nothing: 0,
  wanders: 0, queued: 0, served: 0, unserved: 0, worstStill: 0, worstLatency: 0 };

for (let s = 0; s < seeds; s++) {
  const seed = 1337 + base + s;
  const sim = createSim({ seed });
  const { G } = sim;
  G(`window._who = ${JSON.stringify(who)};
     window._sp = { n: 0, idle: 0, boredOk: 0, yieldOk: 0, both: 0, nothing: 0,
       run: 0, worstStill: 0, worstAt: "", lx: -1, lks: "", firstBoth: 0,
       queued: 0, served: 0, unserved: 0, worstLat: 0, byDay: {} };
     window._spTick = function () {
       const P = window._sp;
       const c = allCrabs().find(k => k.p.name === window._who);
       if (!c) return;
       const biz = c.workBiz;
       // ---- demand side: does an arriving guest actually get picked up? -----
       // A VISITOR OBJECT IS REUSED ACROSS VISITS. A tourist who queues, wanders
       // off to roam/inRoom and comes BACK the next morning is the same object,
       // so a naive stamp-once-per-object measured one guest's pickup at 252s
       // when the true latency was seconds either side of an overnight gap. The
       // stamp is therefore cleared whenever they stop waiting, making this a
       // per-WAIT measurement rather than a per-object one.
       // Three states per wait, held in _auW: 0 = not in line, 1 = in line and
       // still being timed, 2 = in line but already accounted for. A claimed
       // guest STAYS in the waiting state while the server walks over, so the
       // "already accounted" state is what stops one guest being re-counted
       // every tick; and every wait is counted the moment it starts, whether or
       // not it was claimed instantly, so the queued count is a true denominator.
       for (const k of customers) {
         if (k.biz !== biz) continue;
         const waiting = k.stC === VS.waiting || k.stC === VS.seatedWaiting;
         if (!waiting) { k._auW = 0; continue; }     // left the line: next wait starts fresh
         if (!k._auW) {                              // a new wait begins right now
           k._auW = 1; k._auT = T; P.queued++;
         }
         if (k._auW === 1 && k.claimed) {            // picked up: bank the latency once
           if (T - k._auT > P.worstLat) P.worstLat = T - k._auT;
           k._auW = 2;
         }
       }
       // serves and abandonment are per-object lifetime events, counted once
       for (const k of customers) {
         if (k.biz !== biz) continue;
         if (k.served && !k._auS) { k._auS = 1; P.served++; }
         if (!k._auLost && k.stC === VS.leaving && !k.served) { k._auLost = 1; P.unserved++; }
       }
       if (c.dsC !== DS.working) { P.run = 0; P.lx = -1; return; }
       P.n++;
       const D = P.byDay[day] = P.byDay[day] || { n: 0, idle: 0, still: 0, bored: 0, both: 0 };
       D.n++;
       if (c.ksC === KS.idle) { P.idle++; D.idle++; }
       // the two wander preconditions, read from state the engine already set
       const bOk = (c.p.bored || 0) >= WANDER_AT;
       const yOk = !((c.p.hunger || 0) >= BORED_YIELD || (c.p.thirst || 0) >= BORED_YIELD
                     || (c.p.tired || 0) >= BORED_YIELD);
       if (bOk) P.boredOk++;
       if (yOk) P.yieldOk++;
       if (bOk && yOk) { P.both++; D.both++; if (!P.firstBoth) P.firstBoth = day; }
       D.bored += (c.p.bored || 0) / 1048576;
       // is there anything for them to DO right now?
       const q = customers.some(k => k.biz === biz && !k.served && !k.claimed
         && (k.stC === VS.waiting || k.stC === VS.seatedWaiting));
       const stalls = BIZ[biz] && BIZ[biz].stalls;
       const dirty = !!stalls && stalls.some(t => t.dirty && !t.cleaning && !t.occupant);
       if (!q && !dirty) P.nothing++;
       // ---- the headline: longest run with no movement and no state change --
       const x = Math.round(c.x * 256), ks = c.kstate;
       if (x === P.lx && ks === P.lks) {
         P.run++;
         if (P.run > D.still) D.still = P.run;
         if (P.run > P.worstStill) {
           P.worstStill = P.run;
           P.worstAt = "d" + day + " " + Math.floor(tmin / 60) + ":" + ("0" + (tmin % 60)).slice(-2);
         }
       } else P.run = 0;
       P.lx = x; P.lks = ks;
     };`);
  sim.runDays(days, { onTick: (g) => g("window._spTick()"), tickEvery: 1 });
  const o = JSON.parse(G(`JSON.stringify({ p: window._sp, wanders: window._stats.wanders || 0 })`));
  const P = o.p;
  T.n += P.n; T.idle += P.idle; T.boredOk += P.boredOk; T.yieldOk += P.yieldOk;
  T.both += P.both; T.nothing += P.nothing; T.wanders += o.wanders;
  T.queued += P.queued; T.served += P.served; T.unserved += P.unserved;
  T.worstStill = Math.max(T.worstStill, P.worstStill);
  T.worstLatency = Math.max(T.worstLatency, P.worstLat);
  const pc = (v) => (100 * v / (P.n || 1)).toFixed(0).padStart(3) + "%";
  console.log(`seed ${seed}  onShift ${String(P.n).padStart(6)}t  idle ${pc(P.idle)}` +
    `  LONGEST-STILL ${(P.worstStill / SEC).toFixed(0)}s-real` +
    ` (=${(P.worstStill / SEC * GMIN_PER_REAL_SEC / 60).toFixed(1)} game-hours) at ${P.worstAt}` +
    `  wanderLegal ${pc(P.both)} firstDay ${P.firstBoth || "never"}` +
    `  wandersStarted ${o.wanders}  nothingToDo ${pc(P.nothing)}` +
    `  guests ${P.queued}/served ${P.served}/lost ${P.unserved}` +
    `  worstPickup ${(P.worstLat / SEC).toFixed(1)}s`);
}

const pc = (v) => (100 * v / (T.n || 1)).toFixed(1) + "%";
console.log(`\n=== ${who}: ${seeds} seeds x ${days} days (seedbase ${base}) ===`);
console.log(`on-shift ticks              ${T.n}`);
console.log(`  kstate idle               ${pc(T.idle)}`);
console.log(`  nothing dispatchable      ${pc(T.nothing)}  (no unclaimed guest, no dirty stall)`);
console.log(`  bored >= WANDER_AT        ${pc(T.boredOk)}`);
console.log(`  not boredYielding         ${pc(T.yieldOk)}`);
console.log(`  BOTH -> wander legal      ${pc(T.both)}   <-- the joint window`);
console.log(`  wanders actually started  ${T.wanders}`);
console.log(`WORST dead-still on-shift run: ${(T.worstStill / SEC).toFixed(1)}s real` +
  ` = ${(T.worstStill / SEC * GMIN_PER_REAL_SEC / 60).toFixed(1)} game-hours of a shift, motionless.`);
console.log(`Guests: ${T.queued} queued, ${T.served} served, ${T.unserved} abandoned` +
  ` (${(100 * T.unserved / (T.queued || 1)).toFixed(1)}%); worst pickup latency ` +
  `${(T.worstLatency / SEC).toFixed(1)}s real.`);
console.log(`\nVERDICT KEY: high idle + low abandonment + fast pickup = she is NOT wedged;`);
console.log(`the shop is empty and the anti-idle wander-off is failing to move her.`);

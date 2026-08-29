#!/usr/bin/env node
// SLEEP DEBT — what happens to a crab the town works into the ground?
//
//   node tools/sleepdebt.mjs [--seeds N] [--days D] [--crew N] [--hours A-B]
//                            [--ot] [--quiet]
//
// WHY THIS EXISTS. Matt, 2026-08-25, from play, two sentences: "I have crabs
// working impossible hours, lack of sleep should eventually be deadly" and
// "scheduling seems to get busted so some crabs never go home? Overtime issues
// I guess?" Both are claims about the SAME crab - the one pinned at the top of
// the tiredness bar - and the code has a candidate for each:
//
//   never goes home  ->  sleepRough (TI4). Past ROUGH_AT (0.97) a crab on the
//                        walk home rolls ROUGH_RATE a second to bed down where
//                        they stand, and the street banks NO repair. So they
//                        get up as tired as they lay down, roll again the next
//                        night, and the state is self-sustaining by design.
//   never dies       ->  illRisk reads ONE INSTANT and is MEMORYLESS. tired
//                        >= 0.95 is +0.05 risk on night 1 and +0.05 on night
//                        30. PLAN records a ceiling probe that PINNED the crew
//                        at tired = 1.0 for 30 days and the town still earned.
//
// WHAT IT REPORTS, per crab-night:
//   pinned%   nights ending at tired >= PIN (0.95, the sickness line)
//   rough%    nights slept rough - the "never went home" reading
//   run       the LONGEST unbroken run of pinned nights any one crab served
//   home%     nights that ended in a bed or a cot at all
//   fell/died what the nightly roll actually did about it
//
// The sim contract holds: this drives the real game files through simlib and
// reimplements nothing. Every number is read off the game's own state.
import { createSim } from "./simlib.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const SEEDS = +arg("--seeds", 8), DAYS = +arg("--days", 24);
// SECOND BLOCK, SAME RIG. PLAN's rule is that one 8-seed block is a coin and
// sixteen is the honest number, so every claim off this probe wants
// --seedbase 8 (or 16) run alongside the default block.
const SEEDBASE = +arg("--seedbase", 0);
const CREW = +arg("--crew", 6);
const QUIET = process.argv.includes("--quiet");
// THE IMPOSSIBLE HOURS. --hours 6-24 opens every player shop around the clock
// and --ot puts the whole crew on overtime, which is as close as the game lets
// a player get to "working them into the ground". Default is an ordinary town,
// so the two arms are the same seeds with only the rota different.
const HOURS = arg("--hours", null);
const OT = process.argv.includes("--ot");
// --nodebt arms the SLEEP DEBT ramp off, so the same seeds can be run as a
// control. The flat tired >= 0.95 term the roll always had stays on, so this
// arm IS the pre-ramp build rather than a town with no fatigue in it.
const NODEBT = process.argv.includes("--nodebt");
// --nodebtlane arms the SECOND change off (the CARE-LANE BAR) while leaving the
// ramp ON, so the ramp and the bar can be priced as two variables on one tree
// (decision kd-h28QBb1lvO, advice kd-JwPxQ7pSwn). Three arms make the ladder:
//   --nodebt        pre-ramp control (no memory, illness still rescues)
//   --nodebtlane    ramp only        (the `consequential` build: illness rescues)
//   (neither)       ramp + bar       (the `deadly` build: illness stops rescuing)
const NODEBTLANE = process.argv.includes("--nodebtlane");
const PIN = 0.95;   // the sickness line: tired >= 0.95 is the +0.05 risk term

function runSeed(seed) {
  const sim = createSim({ seed });
  if (NODEBT) sim.G(`window._noDebt = true;`);
  if (NODEBTLANE) sim.G(`window._noDebtLane = true;`);
  const nights = [];        // one row per crab-night
  const runs = new Map();   // name -> current unbroken run of pinned nights
  let best = 0, deaths = 0;
  sim.runUntil("day >= 2 && tmin >= 7 * 60", { maxSteps: 200000 });
  sim.G(`coins = 3000; UPS.chef.lvl = Math.max(UPS.chef.lvl, ${CREW});
         while (crabs.length < ${CREW}) hireCrew();`);
  if (HOURS) {
    const [a, b] = HOURS.split("-").map(Number);
    sim.G(`for (const k of Object.keys(BIZ)) if (bizOwner(k) === "player")
             setBizHours(k, ${a} * 60, ${b} * 60);`);
  }
  if (OT) sim.G(`for (const c of crabs) c.p.ot = true;`);
  for (let d = 0; d < DAYS; d++) {
    if (sim.G("gameOver")) break;
    sim.G("if (coins < 500) coins = 900;");   // measuring exhaustion, not solvency
    if (OT) sim.G(`for (const c of crabs) c.p.ot = true;`);   // re-arm: labor policy switches OT off at the tiredness cap
    // sample just before the settlement, which is where the roll reads them
    if (!sim.runUntil("tmin >= 19.9 * 60 && lastRentDay !== day", { maxSteps: 200000 })) break;
    const pre = JSON.parse(sim.G(`JSON.stringify(allCrabs().map(c => ({
      name: c.p.name, npc: !!c.p.npc, shift: c.p.shift,
      tired: (c.p.tired || 0) / Q20, sick: !!c.p.sick, homeless: !!c.p.homeless,
      debt: c.p.sleepDebt || 0, drisk: typeof debtRisk === "function" ? debtRisk(c) : 0 })))`));
    if (!sim.runUntil("lastRentDay === day", { maxSteps: 200000 })) break;
    // ...then run the night out and read where they actually slept
    if (!sim.runUntil("tmin < 10 * 60 && tmin > 6 * 60", { maxSteps: 200000 })) break;
    // ...and the ledger AFTER the tick, which is the value the roll actually
    // charged them on (tickSleepDebt runs at the settlement, before the roll).
    const post = new Map(JSON.parse(sim.G(`JSON.stringify(allCrabs().map(c => [c.p.name, {
      tired: (c.p.tired || 0) / Q20, rough: (c.p.roughLast || 0) >= day - 1,
      sick: !!c.p.sick, home: c.dsC === DS.home,
      debt: c.p.sleepDebt || 0,
      drisk: typeof debtRisk === "function" ? debtRisk(c) : 0 }]))`)));
    const gone = new Set(pre.map(c => c.name).filter(n => !post.has(n)));
    deaths += gone.size;
    for (const c of pre) {
      const p = post.get(c.name);
      const pinned = c.tired >= PIN;
      runs.set(c.name, pinned ? (runs.get(c.name) || 0) + 1 : 0);
      best = Math.max(best, runs.get(c.name));
      nights.push({ ...c, pinned, died: gone.has(c.name),
        rough: p ? p.rough : false, home: p ? p.home : false,
        woke: p ? p.tired : null,
        debt: p ? p.debt : 0, drisk: p ? p.drisk : 0 });
    }
  }
  // THE GAME'S OWN ATTRIBUTION, not the probe's guess: _stats.causes tags each
  // new illness with which needs were over the line, and _stats.illness records
  // how every illness ENDED. Deaths alone cannot tell you whether the ramp did
  // anything - a town kills crabs for four different reasons.
  const causes = JSON.parse(sim.G(`JSON.stringify((window._stats && window._stats.causes) || {})`));
  const illness = JSON.parse(sim.G(`JSON.stringify((window._stats && window._stats.illness) || [])`));
  return { nights, deaths, best, causes, illness };
}

const all = []; let deaths = 0, best = 0;
const causes = {}, illness = [];
for (let i = 0; i < SEEDS; i++) {
  const r = runSeed(1337 + (SEEDBASE + i) * 337);
  all.push(...r.nights); deaths += r.deaths; best = Math.max(best, r.best);
  for (const k in r.causes) causes[k] = (causes[k] || 0) + r.causes[k];
  illness.push(...r.illness);
  if (!QUIET) process.stdout.write(".");
}
if (!QUIET) process.stdout.write("\n");

const pct = (a, b) => b === 0 ? "  n/a " : (100 * a / b).toFixed(1).padStart(6);
const mean = (a, f) => a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : 0;

const arm = (HOURS || "8-20") + (OT ? " +OT" : "") + ", crew " + CREW
  + (SEEDBASE ? "  seedbase " + SEEDBASE : "") + (NODEBT ? "  [DEBT ARMED OFF]" : "")
  + (NODEBTLANE ? "  [CARE-LANE BAR OFF - ramp only]" : "");
console.log("\n== SLEEP DEBT   " + arm + "   ("
  + all.length + " crab-nights, " + SEEDS + " seeds x " + DAYS + "d)");
console.log("who        nights   tired  woke  pinned%  rough%   home%   died");
for (const [label, keep] of [["CREW", r => !r.npc], ["TOWNSFOLK", r => r.npc],
                             ["EVERYONE", () => true]]) {
  const R = all.filter(keep);
  if (!R.length) continue;
  console.log(label.padEnd(10) + String(R.length).padStart(7)
    + "  " + mean(R, x => x.tired).toFixed(3).padStart(6)
    + " " + mean(R, x => x.woke == null ? 0 : x.woke).toFixed(3).padStart(5)
    + "  " + pct(R.filter(x => x.pinned).length, R.length)
    + "  " + pct(R.filter(x => x.rough).length, R.length)
    + "  " + pct(R.filter(x => x.home).length, R.length)
    + "  " + String(R.filter(x => x.died).length).padStart(5));
}
console.log("\nLONGEST UNBROKEN RUN PINNED AT tired >= " + PIN + ": " + best + " nights");
console.log("deaths (all causes, all seeds): " + deaths);
// THE LEDGER. What the sleep-debt ramp actually charged, per crab-night: how
// often it was billing at all, and how big the extra hazard got. On a build
// with no ramp (or --nodebt) every one of these reads zero, which is exactly
// what makes it a usable control arm.
const billed = all.filter(x => x.drisk > 0);
console.log("\nSLEEP DEBT LEDGER: " + billed.length + " of " + all.length + " crab-nights billed ("
  + (100 * billed.length / (all.length || 1)).toFixed(1) + "%)"
  + "   mean extra risk when billing " + (mean(billed, x => x.drisk) || 0).toFixed(4)
  + "   worst ledger " + Math.max(0, ...all.map(x => x.debt || 0)) + " nights");
// how far up the ladder the town ACTUALLY climbs - a ramp whose top rungs are
// never reached is a ramp with a shorter ladder than its author thinks
const hist = new Map();
for (const n of all) if ((n.debt || 0) > 0) hist.set(n.debt, (hist.get(n.debt) || 0) + 1);
console.log("  ledger depth: " + ([...hist.entries()].sort((a, b) => a[0] - b[0])
  .map(([d, k]) => d + "n x" + k).join("  ") || "never billed"));
// THE OUTCOME, off the game's own seams. Illness CAUSES are tagged at the roll;
// illness OUTCOMES record how each one ended. This is the honest place to look
// for "is it deadly yet" - deaths alone conflate four different neglects.
console.log("  illness causes (game's own tags): " + (JSON.stringify(causes) || "{}"));
const died = illness.filter(x => x.out === "died");
console.log("  illnesses: " + illness.length + "  died " + died.length
  + "  (well " + illness.filter(x => x.out === "well").length + ")"
  + "  CFR " + (illness.length ? (100 * died.length / illness.length).toFixed(1) : "n/a") + "%");
// WHICH CARE LANE DID THEY GET? This is the seam that separates "the ramp is
// noise" from "the ramp CAUGHT them" - the care ladder is generous (bed rest
// cures 0.55/day and kills 0.04; NEGLECTED cures 0.12 and kills 0.25), so if a
// ramp that makes MORE crabs ill also makes FEWER die, the lane mix is where
// that would show up: illness pulls a crab off the rota and into a lane that
// treats them, which is a real mechanism and not a rounding error.
const lanes = {};
for (const x of illness) lanes[x.lane] = (lanes[x.lane] || 0) + 1;
const lanesDied = {};
for (const x of died) lanesDied[x.lane] = (lanesDied[x.lane] || 0) + 1;
console.log("  care lanes (all illnesses): " + JSON.stringify(lanes));
console.log("  care lanes (the deaths):    " + JSON.stringify(lanesDied));
// THE HEADLINE. A crab that spends a fortnight at the top of the bar and is
// still on the rota is the whole of Matt's report, in one number.
const byRun = new Map();
for (const n of all) if (n.pinned) byRun.set(n.name, (byRun.get(n.name) || 0) + 1);
const worst = [...byRun.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log("most pinned nights served: "
  + (worst.length ? worst.map(([n, k]) => n + " " + k).join(", ") : "nobody"));

#!/usr/bin/env node
// THE CLOCK-OFF PROBE. Sample every crab every 15 game-minutes for a whole
// run and answer: how long between shift end and actually being HOME?
import { createSim } from "/home/agent/bot/cs/work/tools/simlib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const SEEDS = +arg("--seeds", 3), DAYS = +arg("--days", 10), CREW = +arg("--crew", 6);
const OT = process.argv.includes("--ot");
const HOURS = arg("--hours", null);

const samples = [];
for (let s = 0; s < SEEDS; s++) {
  const sim = createSim({ seed: 1337 + s * 337 });
  sim.runUntil("day >= 2 && tmin >= 7 * 60", { maxSteps: 200000 });
  sim.G(`coins = 3000; UPS.chef.lvl = Math.max(UPS.chef.lvl, ${CREW}); while (crabs.length < ${CREW}) hireCrew();`);
  if (HOURS) { const [a, b] = HOURS.split("-").map(Number);
    sim.G(`for (const k of Object.keys(BIZ)) if (bizOwner(k) === "player") setBizHours(k, ${a}*60, ${b}*60);`); }
  if (OT) sim.G(`for (const c of crabs) c.p.ot = true;`);
  // install a per-tick sampler in the game realm: cheap, and it sees every crab
  sim.G(`window._cs = []; window._csLast = -1;`);
  const stop = sim.G(`day`) + DAYS;
  let guard = 0;
  while (sim.G(`day`) < stop && !sim.G("gameOver") && guard++ < 4000) {
    sim.G("if (coins < 500) coins = 900;");
    if (OT) sim.G(`for (const c of crabs) c.p.ot = true;`);
    sim.runUntil(`(function(){
      const slot = Math.floor(tmin / 15);
      if (slot !== window._csLast) {
        window._csLast = slot;
        for (const c of allCrabs()) window._cs.push([day, tmin, c.p.name, !!c.p.npc, c.p.job,
          c.dayState, awayToday(c) ? 1 : 0, !!c.duty ? 1 : 0, Math.round(c.x), Math.round(homeX(c)),
          +((c.p.tired||0)/Q20).toFixed(2), effShift(c).end]);
      }
      return false;
    })()`, { maxSteps: 3000 });
  }
  samples.push(...JSON.parse(sim.G("JSON.stringify(window._cs)")));
  process.stdout.write(".");
}
process.stdout.write("\n");

const K = ["day","tmin","name","npc","job","ds","off","duty","x","homeX","tired","shEnd"];
const rows = samples.map(a => Object.fromEntries(a.map((v,i)=>[K[i],v])));
console.log(`== ${rows.length} samples, ${SEEDS} seeds x ${DAYS}d` + (OT?" +OT":"") + (HOURS?" hours "+HOURS:""));

// 1. For each crab-day, minutes spent in each dayState between shift-end and midnight
const byNight = new Map();
for (const r of rows) {
  const k = r.day + "|" + r.name;
  if (!byNight.has(k)) byNight.set(k, []);
  byNight.get(k).push(r);
}
let nights = 0, neverHome = 0, lateHome = 0; const lag = []; const stuckIn = new Map();
const offNights = { n: 0, neverHome: 0 };
for (const [k, rs] of byNight) {
  rs.sort((a,b)=>a.tmin-b.tmin);
  const isOff = rs.some(r => r.off);
  const shEnd = rs[0].shEnd;
  const after = rs.filter(r => r.tmin >= (isOff ? 0 : shEnd));
  if (!after.length) continue;
  nights++;
  if (isOff) offNights.n++;
  const firstHome = after.find(r => r.ds === "home");
  if (!firstHome) {
    neverHome++;
    if (isOff) offNights.neverHome++;
    for (const r of after) stuckIn.set(r.ds+"/"+r.job, (stuckIn.get(r.ds+"/"+r.job)||0)+1);
  } else {
    const d = firstHome.tmin - (isOff ? 0 : shEnd);
    lag.push(d);
    if (d > 180) lateHome++;
  }
}
lag.sort((a,b)=>a-b);
const pc = (p) => lag.length ? lag[Math.min(lag.length-1, Math.floor(p*lag.length))] : 0;
console.log(`crab-nights ${nights}   NEVER reached home after shift-end: ${neverHome} (${(100*neverHome/nights).toFixed(1)}%)`);
console.log(`  of which DAY-OFF nights: ${offNights.neverHome} of ${offNights.n} off-nights`);
console.log(`lag shift-end -> home (game-min):  p50 ${pc(.5)}  p90 ${pc(.9)}  p99 ${pc(.99)}  max ${lag[lag.length-1]}   >3h: ${lateHome}`);
console.log("  where the never-home nights sat:", JSON.stringify(Object.fromEntries([...stuckIn].sort((a,b)=>b[1]-a[1]).slice(0,10))));

// 2. dayState occupancy by hour of day (everyone)
console.log("\nhour  home  toHome toWork working errand  other   |  duty%");
for (let h = 0; h < 24; h++) {
  const R = rows.filter(r => Math.floor(r.tmin/60) === h);
  if (!R.length) continue;
  const c = (s) => (100*R.filter(r=>r.ds===s).length/R.length).toFixed(0).padStart(5);
  const other = (100*R.filter(r=>!["home","toHome","toWork","working"].includes(r.ds)&&!r.ds.startsWith("err")&&r.ds!=="toErrand").length/R.length).toFixed(0).padStart(5);
  console.log(String(h).padStart(4) + c("home") + c("toHome") + c("toWork") + c("working")
    + (100*R.filter(r=>r.ds==="errand"||r.ds==="toErrand").length/R.length).toFixed(0).padStart(7)
    + other + "   |" + (100*R.filter(r=>r.duty).length/R.length).toFixed(0).padStart(6));
}
// 3. who is worst
const worst = new Map();
for (const r of rows) if (r.ds !== "home" && (r.tmin < 5*60 || r.tmin > 22*60)) worst.set(r.name+"/"+r.job, (worst.get(r.name+"/"+r.job)||0)+1);
console.log("\nmost samples out of the house between 22:00 and 05:00:",
  [...worst].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,k])=>n+" "+k).join(", "));

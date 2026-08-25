#!/usr/bin/env node
// HOW MANY HOURS DOES A CRAB ACTUALLY SLEEP? Sample every 15 game-min and count
// ticks where the crab is HOME and it is dark (darkness > 0.7 = the repair gate).
import { createSim } from "./simlib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const SEEDS = +arg("--seeds", 3), DAYS = +arg("--days", 8), CREW = +arg("--crew", 6);

const rows = [];
for (let s = 0; s < SEEDS; s++) {
  const sim = createSim({ seed: 1337 + s * 337 });
  sim.runUntil("day >= 2 && tmin >= 7 * 60", { maxSteps: 200000 });
  sim.G(`coins = 3000; UPS.chef.lvl = Math.max(UPS.chef.lvl, ${CREW}); while (crabs.length < ${CREW}) hireCrew();`);
  sim.G(`window._sl = []; window._slLast = -1;
    window._sample = function () {
      const slot = Math.floor(tmin / 15);
      if (slot !== window._slLast) { window._slLast = slot;
        for (const c of allCrabs()) window._sl.push([day, Math.round(tmin), c.p.name, !!c.p.npc,
          c.dayState, darkness() > 0.7 ? 1 : 0, !!c.p.rough ? 1 : 0, +((c.p.tired||0)/Q20).toFixed(3)]); }
      return false; };`);
  const stop = sim.G(`day`) + DAYS; let guard = 0;
  while (sim.G(`day`) < stop && !sim.G("gameOver") && guard++ < 6000) {
    sim.G("if (coins < 500) coins = 900;");
    sim.runUntil(`window._sample()`, { maxSteps: 3000 });
  }
  rows.push(...JSON.parse(sim.G("JSON.stringify(window._sl)")));
  process.stdout.write(".");
}
process.stdout.write("\n");
const K = ["day","tmin","name","npc","ds","dark","rough","tired"];
const R = rows.map(a => Object.fromEntries(a.map((v,i)=>[K[i],v])));

// a "sleep sample" = home, dark, not rough (updateHome's full-rate repair branch)
const nightOf = (r) => r.tmin < 12*60 ? r.day - 1 : r.day;   // the night that spans midnight
const byNight = new Map();
for (const r of R) {
  if (r.tmin >= 12*60 && r.tmin < 18*60) continue;   // only count the 18:00->12:00 window
  const k = nightOf(r) + "|" + r.name;
  if (!byNight.has(k)) byNight.set(k, { sleep: 0, dark: 0, rough: 0, npc: r.npc, name: r.name });
  const b = byNight.get(k);
  if (r.dark) { b.dark++; if (r.ds === "home" && !r.rough) b.sleep++; if (r.rough) b.rough++; }
}
const nights = [...byNight.values()].filter(b => b.dark > 20);   // full nights only
const H = (n) => (n * 15 / 60);   // samples -> game-hours
const mean = (a, f) => a.length ? a.reduce((s,x)=>s+f(x),0)/a.length : 0;
console.log(`\n== SLEEP AUDIT  ${SEEDS} seeds x ${DAYS}d   ${nights.length} full crab-nights`);
for (const [label, keep] of [["CREW", b=>!b.npc], ["TOWNSFOLK", b=>b.npc], ["EVERYONE", ()=>true]]) {
  const N = nights.filter(keep); if (!N.length) continue;
  const slept = N.map(b => H(b.sleep)).sort((a,b)=>a-b);
  const darkH = mean(N, b => H(b.dark));
  console.log(`${label.padEnd(10)} n=${String(N.length).padStart(4)}  dark hours available ${darkH.toFixed(1)}  `
    + `SLEPT: mean ${mean(N,b=>H(b.sleep)).toFixed(2)}h  p10 ${slept[Math.floor(.1*slept.length)].toFixed(2)}h  `
    + `p50 ${slept[Math.floor(.5*slept.length)].toFixed(2)}h  min ${slept[0].toFixed(2)}h  `
    + `| under 6h: ${(100*N.filter(b=>H(b.sleep)<6).length/N.length).toFixed(0)}%  under 4h: ${(100*N.filter(b=>H(b.sleep)<4).length/N.length).toFixed(0)}%`);
}
// when does the town actually go to bed?
console.log("\nshare of crabs HOME, by hour (the bedtime curve):");
let line = "";
for (let h = 17; h < 24+8; h++) {
  const hh = h % 24;
  const S = R.filter(r => Math.floor(r.tmin/60) === hh);
  if (!S.length) continue;
  line += `${String(hh).padStart(2,"0")}:${(100*S.filter(r=>r.ds==="home").length/S.length).toFixed(0).padStart(4)}%  `;
  if (h % 6 === 5) { console.log("  " + line); line = ""; }
}
if (line) console.log("  " + line);

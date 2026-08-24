// Diagnostic: replicate the days-off scenario's staging and log REEF's week.
// Why is REEF never counted off? Print offToday, dayState and status daily.
import { createSim } from "./simlib.mjs";
const sim = createSim({ seed: 1337 });
sim.G("OWNERS.sudsy.till = 3000");
sim.G("window._noHotelier = true;");
sim.G(`coins = 500000; tryBuy("arcade"); tryBuy("chef"); tryBuy("chef");
  crabs[2].p.job = "arcade"; crabs[3].p.job = "arcade"; window._reefLog = [];`);
sim.runDays(7, { tickEvery: 8, onTick: (G) => {
  if (G("coins") < 50000) G("coins = 100000");
  G(`OWNERS.sudsy.till = Math.max(3000, Math.min(OWNERS.sudsy.till, 20000));
  if (npcs[0]) { npcs[0].p.sick = null; }
    for (const c of npcs) { c.p.sick = null;
      c.p.hunger = Math.min(c.p.hunger || 0, qn(0.8)); c.p.dirt = Math.min(c.p.dirt || 0, qn(0.8)); }`);
  G(`{ const r = allCrabs().find(c => c.p.name === "REEF");
    if (r) { const d = window._reefDays = window._reefDays || {};
      const row = d[day] = d[day] || { off: 0, st: {}, n: 0 };
      row.n++; if (offToday(r)) row.off++; row.st[r.dayState] = 1; } }`);
} });
console.log(sim.G(`JSON.stringify({ days: window._reefDays,
  fields: (() => { const r = allCrabs().find(c => c.p.name === 'REEF');
    const out = {}; for (const k in r.p) if (/off|rota|rest|week/i.test(k)) out["p." + k] = r.p[k];
    for (const k in r) if (/off|rota|rest|week/i.test(k)) out[k] = r[k];
    out.offTodayNow = offToday(r); return out; })() })`));

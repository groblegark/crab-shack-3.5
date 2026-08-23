// probe-overlap.mjs — WHO is stacking? Run a town, sample every game-minute,
// count pairs of visible actors standing closer than the collider's own touch
// ellipse (12px x, ~6.7px y), split by class (crab/visitor) and by motion.
// Scratch instrument for the personal-space work; not part of the suite.
import { createSim } from "./simlib.mjs";

const seed = Number(process.argv[2] || 1337);
const toDay = Number(process.argv[3] || 6);
const sim = createSim({ seed, realm: "main" });

sim.G(`window._ovl = { crabStill: 0, crabMove: 0, vis: 0, cross: 0, samples: 0, worst: [] };
window._ovlTick = () => {
  const O = window._ovl; O.samples++;
  const bodies = [];
  for (const c of allCrabs()) if (!c.hidden && c.csC !== CS.drive && !c.errandCust)
    bodies.push({ x: c.x, y: c.y, still: !c._stepped, kind: "crab", name: c.name, st: c.csC });
  for (const k of customers) if (k.visitor && !k.gone && !k.hidden && k.stC !== VS.ferryIn && k.stC !== VS.ferryOut && k.stC !== VS.inRoom)
    bodies.push({ x: k.x, y: k.y, still: true, kind: "vis", name: k.name, st: k.stC });
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], b = bodies[j];
    const dx = a.x - b.x, dy = 1.8 * (a.y - b.y);
    const d2 = dx * dx + dy * dy;
    if (d2 >= 64) continue;   // within 8px on the ellipse = visibly stacked
    const key = a.kind === "crab" && b.kind === "crab" ? (a.still && b.still ? "crabStill" : "crabMove")
              : a.kind === "vis" && b.kind === "vis" ? "vis" : "cross";
    O[key]++;
    if (O.worst.length < 40 && d2 < 16)
      O.worst.push([key, a.name, a.st, b.name, b.st, Math.round(a.x), Math.round(a.y), Math.round(d2)]);
  }
};`);
// sample every ~1200 ticks (a game-minute) via runDays' onTick hook
sim.runDays(toDay, { onTick: (G) => G("window._ovlTick()"), tickEvery: 1200 });
const o = JSON.parse(sim.G("JSON.stringify(window._ovl)"));
console.log(`seed ${seed} to day ${toDay}: samples=${o.samples}`);
console.log(`  crab-still pairs <8px: ${o.crabStill}  crab-moving: ${o.crabMove}  vis-vis: ${o.vis}  cross: ${o.cross}`);
console.log("  worst (<4px):");
for (const w of o.worst) console.log("   ", w.join(" "));

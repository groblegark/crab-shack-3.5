// The devlog picture: the first neuro-people ashore, photographed through the
// game's OWN renderer (the mcp software canvas draws via the real viewFrame,
// and the seam's theorem is what makes a photograph safe). Deterministic and
// browser-free - the shared browser was contended, and this is the same
// picture by construction.
import { createVisibleSim } from "../../mcp/render.mjs";
import { writeFileSync } from "fs";

const sim = createVisibleSim({ seed: 909 });
sim.G("rep = 75000");   // past the roost's gate: gulls sail from the next boat
sim.runDays(6);
// run to a moment with gulls VISIBLY on the promenade (ashore, not in a room)
let ok = false;
for (let i = 0; i < 400000 && !ok; i += 40) {
  sim.runTicks(40);
  ok = sim.G(`(() => {
    const g = customers.filter(k => k.visitor && k.culture === "gull" && !k.gone && !k.room && !k.hidden);
    return g.length >= 2 && tmin > 9 * 60 && tmin < 18 * 60;
  })()`);
}
const gulls = JSON.parse(sim.G(`JSON.stringify(customers
  .filter(k => k.visitor && k.culture === "gull" && !k.gone && !k.room && !k.hidden)
  .map(k => ({ name: k.name, x: Math.round(k.x) })))`));
if (!ok || !gulls.length) { console.error("no visible gulls found", gulls); process.exit(1); }
// centre the camera on the densest pair and let the renderer settle a frame
const cx = gulls[0].x;
sim.G(`camX = clampCam(${cx} - 128); followIdx = -1; followNpc = null; followCust = null;`);
const png = sim.frame({ scale: 3 });
writeFileSync("devlog/img/2026-08-22-first-neuro-gulls.png", png);
console.log("shot:", JSON.stringify({ day: sim.G("day"),
  tmin: sim.G("tmin|0"), gullsVisible: gulls, rep: sim.G("repPts(rep)") }));

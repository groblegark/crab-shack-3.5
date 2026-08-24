// CLUSTER ARM: the slop landing's staged screenshot, shot pod-side because
// the kube policy keeps sims off the operator's mac. Reuses the foodways
// shooter's staging (a taught town, an honestly hungry pig, HER OWN scorer
// picking the slop) and hands the frame home as base64 in the receipt's
// jsonTail (scale 2 keeps it far under the ConfigMap cap).
import { createVisibleSim } from "../mcp/render.mjs";

const sim = createVisibleSim({ seed: 3 });
sim.G("coins = 300000");
sim.runDays(8);
sim.G('dishWord.pig = true; learnDish(foodwayDishes("shack")[0]);');

let ok = false;
for (let i = 0; i < 200000 && !ok; i += 40) {
  sim.runTicks(40);
  ok = sim.G(`(() => {
    if (tmin < 8 * 60 || tmin > 18 * 60) return false;
    const p = customers.find(k => k.visitor && k.culture === "pig" && !k.gone && !k.hidden && !k.room);
    if (!p) return false;
    if (p.recipe && p.recipe.id === "slop") return true;
    if (p.biz || p.claimed) return false;
    if (tmin > 15 * 60) return false;
    p.hunger = 900000;
    p.wallet = Math.max(p.wallet, 6000);
    const e = visPick(p);
    if (e && e.recipe && e.recipe.id === "slop") { visGo(p, e); return true; }
    return false;
  })()`);
}
if (!ok) { console.error("no slop-bound pig found"); process.exit(1); }
const pig = JSON.parse(sim.G(`JSON.stringify((() => {
  const p = customers.find(k => k.visitor && k.culture === "pig" && k.recipe && k.recipe.id === "slop");
  return { name: p.name, x: Math.round(p.x), delight: stayOf(p).delight || 0 };
})())`));
sim.runTicks(200);
sim.G(`(() => {
  const p = customers.find(k => k.visitor && k.culture === "pig" && k.recipe && k.recipe.id === "slop");
  if (p) camX = clampCam(Math.round(p.x) - 120);
  toast = null; followIdx = -1; followNpc = null; followCust = null;
})()`);
const png = sim.frame({ scale: 2 });
console.log(JSON.stringify({ day: sim.G("day"), pig, png_b64: Buffer.from(png).toString("base64") }));

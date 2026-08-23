// The devlog pictures for the foodways landing, photographed through the
// game's OWN renderer (browser-free; the seam's theorem makes it safe):
// (1) the manage card offering the lesson, (2) a pig at the counter with the
// bun on the board. One-shot tool; deleted before merge is fine to keep -
// the devlog fork will want to re-shoot.
import { createVisibleSim } from "../mcp/render.mjs";
import { writeFileSync } from "fs";

const sim = createVisibleSim({ seed: 3 });
sim.G("coins = 300000");   // a float so the photo town outlives its rent
sim.runDays(8);
sim.G('dishWord.pig = true;');

// SHOT 1: the manage card, LEARN chip armed - the moment the kitchen answers
sim.G('manage = "shack"; manageTab = "HOURS"; learnArm = "porkbun";');
writeFileSync("devlog/img/2026-08-22-learn-the-bun.png", sim.frame({ scale: 3 }));
console.log("shot 1: manage card,", sim.G('learnableDishes("shack").map(d=>d.id).join(",")'), "offered");

// the lesson is taken, the board grows
sim.G('manage = null; learnArm = null; learnDish(foodwayDishes("shack")[0]);');

// SHOT 2: a pig at the shack, bun-bound. Run to a daylight moment with a live
// pig ashore, make her honestly hungry, and let HER OWN scorer pick - the
// weights do the rest (2.0 against a 0.6 taco loses one draw in a dozen).
let ok = false;
for (let i = 0; i < 200000 && !ok; i += 40) {
  sim.runTicks(40);
  ok = sim.G(`(() => {
    if (tmin < 8 * 60 || tmin > 18 * 60) return false;
    const p = customers.find(k => k.visitor && k.culture === "pig" && !k.gone && !k.hidden && !k.room);
    if (!p) return false;
    if (p.recipe && p.recipe.id === "porkbun") return true;
    if (p.biz || p.claimed) return false;   // mid-errand: let it finish
    if (tmin > 15 * 60) return false;        // evenings the bed outranks the bun
    p.hunger = 900000;                       // Q20: honestly starving off the boat
    p.wallet = Math.max(p.wallet, 6000);
    const e = visPick(p);
    if (e && e.recipe && e.recipe.id === "porkbun") { visGo(p, e); return true; }
    return false;
  })()`);
}
if (!ok) { console.error("no bun-bound pig found"); process.exit(1); }
const pig = JSON.parse(sim.G(`JSON.stringify((() => {
  const p = customers.find(k => k.visitor && k.culture === "pig" && k.recipe && k.recipe.id === "porkbun");
  return { name: p.name, x: Math.round(p.x), delight: stayOf(p).delight || 0 };
})())`));
sim.runTicks(200);   // let her walk toward the counter...
sim.G(`(() => {   // ...then frame wherever she actually stands, toast cleared
  const p = customers.find(k => k.visitor && k.culture === "pig" && k.recipe && k.recipe.id === "porkbun");
  if (p) camX = clampCam(Math.round(p.x) - 120);
  toast = null; followIdx = -1; followNpc = null; followCust = null;
})()`);
writeFileSync("devlog/img/2026-08-22-first-porkbun.png", sim.frame({ scale: 3 }));
console.log("shot 2:", JSON.stringify({ day: sim.G("day"), pig }));

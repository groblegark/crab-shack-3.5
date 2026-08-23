import { createVisibleSim } from "../mcp/render.mjs";
const sim = createVisibleSim({ seed: 3 });
sim.G("coins = 80000"); sim.runDays(8);
sim.G('dishWord.pig = true; learnDish(foodwayDishes("shack")[0])');
for (let i = 0; i < 60; i++) {
  sim.runTicks(2000);
  const r = JSON.parse(sim.G(`JSON.stringify((() => {
    const ps = customers.filter(k => k.visitor && k.culture === "pig" && !k.gone && !k.hidden);
    const p = ps.find(k => !k.biz && !k.claimed && !k.room);
    if (!p || tmin < 8*60 || tmin > 18*60) return { pigs: ps.length, tmin: tmin|0 };
    p.hunger = 900000; p.wallet = Math.max(p.wallet, 6000);
    const e = visPick(p);
    return { pigs: ps.length, pick: e && e.recipe && e.recipe.id, need: e && e.need,
      menu: bizRecipes("shack").map(x => x.id).join(",") };
  })())`));
  if (r.pick) { console.log("pick:", JSON.stringify(r)); break; }
  if (i % 10 === 0) console.log(JSON.stringify(r), "day", sim.G("day"), "over", sim.G("gameOver"));
}

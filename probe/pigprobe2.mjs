import { createSim } from "../tools/simlib.mjs";
// A FRESH GAME after bundling: no save, no fixture. Does a pig get off the boat?
const sim = createSim({ seed: 1337 });
console.log("CULTURES at fresh boot:", sim.G("Object.keys(CULTURES).join(',')"));
console.log("rep at boot:", sim.G("rep"), "(millirep)");
let firstPigDay = null, firstPigName = null, seen = 0;
for (let d = 1; d <= 20 && !sim.G("gameOver"); d++) {
  sim.runDays(d);
  const pigs = sim.G("customers.filter(k=>k.visitor&&k.culture==='pig').map(k=>k.name).join('|')");
  const n = sim.G("customers.filter(k=>k.visitor&&k.culture==='pig').length");
  if (n > 0 && firstPigDay === null) { firstPigDay = sim.G("day"); firstPigName = pigs.split("|")[0]; }
  seen = Math.max(seen, n);
}
console.log("day reached:", sim.G("day"), "gameOver:", sim.G("gameOver"), "rep:", sim.G("rep"));
console.log("FIRST PIG: day", firstPigDay, "name", firstPigName, "| most pigs at once:", seen);

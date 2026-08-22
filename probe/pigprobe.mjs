import { createSim } from "../tools/simlib.mjs";
// A FRESH GAME: no save loaded, no fixture imported. What does a player get?
const sim = createSim({ seed: 1337 });
console.log("CULTURES at fresh boot:", sim.G("Object.keys(CULTURES).join(',')"));
console.log("rep at boot (millirep):", sim.G("rep"));
sim.runDays(20);
console.log("after runDays(20) -> day", sim.G("day"), "rep", sim.G("rep"), "gameOver", sim.G("gameOver"));
console.log("CULTURES now:", sim.G("Object.keys(CULTURES).join(',')"));
console.log("non-crab visitors alive:", sim.G("customers.filter(k=>k.visitor&&k.culture&&k.culture!=='crab').length"));
console.log("ferryCulture():", sim.G("ferryCulture()"));

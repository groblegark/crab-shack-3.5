import { createSim } from "./simlib.mjs";
// How many towns ever see a pig, and on what day does the first one land?
// Baseline play (buy nothing) — the hardest case: these towns die around day 12.
const N = Number(process.argv[2] || 16), DAYS = Number(process.argv[3] || 30);
const seeds = Array.from({ length: N }, (_, i) => 1337 + i * 7919);
const firstDays = [];
let withPigs = 0, totalPigs = 0;
for (const seed of seeds) {
  const sim = createSim({ seed });
  let first = null, everNames = new Set();
  for (let d = 1; d <= DAYS && !sim.G("gameOver"); d++) {
    sim.runDays(d);
    const names = sim.G("customers.filter(k=>k.visitor&&k.culture==='pig').map(k=>k.name).join('|')");
    if (names) {
      for (const n of names.split("|")) everNames.add(n);
      if (first === null) first = sim.G("day");
    }
  }
  if (first !== null) { withPigs++; firstDays.push(first); }
  totalPigs += everNames.size;
}
firstDays.sort((a, b) => a - b);
console.log(`${withPigs}/${N} towns saw a pig (${(100 * withPigs / N).toFixed(0)}%)`);
console.log(`first-pig day: min ${firstDays[0]}, median ${firstDays[firstDays.length >> 1]}, max ${firstDays[firstDays.length - 1]}`);
console.log(`distinct pigs across all towns: ${totalPigs}`);

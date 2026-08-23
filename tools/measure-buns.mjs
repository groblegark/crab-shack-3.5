// one-shot measurement for the foodways close-out: pig purses, stock vs
// learned. Harvests the departure manifest at each day boundary (the
// manifest is the last frame anything can be asked of a guest).
import { createSim } from "./simlib.mjs";

const arm = process.argv[2] || "stock";   // stock | learned
const DAYS = 20, SEEDS = [0, 1, 2, 3, 4, 5, 6, 7];
let purse = 0, spent = 0, pigs = 0, delights = 0, foreigns = 0;
for (const seed of SEEDS) {
  const sim = createSim({ seed });
  if (arm === "learned") sim.G('learnedDishes.push("porkbun"); dishWord.pig = true;');
  // today.left resets at rollover, so keep the freshest snapshot of the open
  // day and commit it the moment the day flips - the closed day's final list.
  let lastDay = 1, snap = [];
  const commit = (rows) => {
    for (const r of rows) if (r.cu === "pig") {
      pigs++; purse += r.purse; spent += r.spent;
      delights += r.de || 0; foreigns += r.foreign || 0;
    }
  };
  sim.runDays(DAYS, { onTick: (G) => {
    const d = Number(G("day"));
    if (d !== lastDay) { commit(snap); snap = []; lastDay = d; }
    snap = JSON.parse(G('JSON.stringify(today.left || [])'));
  }, tickEvery: 20 });
  commit(snap);
}
console.log(JSON.stringify({ arm, pigs, purse, spent,
  spentShare: pigs ? +(spent / purse).toFixed(3) : 0, delights, foreigns }));

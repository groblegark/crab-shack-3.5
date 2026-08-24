// THE ARRIVAL PROBE — names the visitor-stats slice's first crossing.
// Boots a seed, runs until the first ferry visitor steps off, and prints the
// tick and her five need planes as JSON. Run at the base ref and the branch
// ref with the same seed: the first field that differs IS the crossing.
// Sim-inert: nothing imports this; it only reads.
import { createSim } from "./simlib.mjs";

const seed = Number(process.argv[2] || 1337);
const sim = createSim({ seed, realm: process.env.SIMLIB_REALM || "main",
  kernel: process.env.SIMLIB_KERNEL || "off" });
sim.runUntil("customers.some(k => k.visitor && !k.gone)", { maxSteps: 600000 });
const out = sim.G(`(() => { const k = customers.find(k => k.visitor && !k.gone);
  return { seed: ${seed}, tick: T, tmin, day, name: k.name,
    hunger: k.hunger, thirst: k.thirst, dirt: k.dirt, bored: k.bored, tired: k.tired,
    wallet: k.wallet, nights: k.nights }; })()`);
console.log(JSON.stringify(out));

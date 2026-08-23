// Stage a browser save fixture with gulls ashore (the project's marquee-
// feature convention): rep boosted past the roost's gate, run until a gull
// is standing on the promenade, save, dump the envelope for injection.
import { createSim } from "../simlib.mjs";
import { writeFileSync } from "fs";
const store = new Map();
const sim = createSim({ seed: 909, storage: store, fresh: false, realm: "main" });
sim.G("rep = 75000");
sim.runDays(6);
sim.runUntil('customers.some(k => k.visitor && k.culture === "gull" && !k.gone)', { maxSteps: 300000 });
sim.G("save()");
// the save lands under a SLOT key (crabshack3_v1_s1) - dump the whole store
writeFileSync("/tmp/gull-save.json", JSON.stringify(Object.fromEntries(store)));
console.log("save staged: day", sim.G("day"),
  "gulls ashore", sim.G('customers.filter(k => k.visitor && k.culture === "gull" && !k.gone).length'),
  "keys", JSON.stringify([...store.keys()]));

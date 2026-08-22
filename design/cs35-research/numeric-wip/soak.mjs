// conservation soak — 30 days x three seeds with the fund audit armed, and
// every movement must satisfy delta === want EXACTLY. Post-slice-1 that is a
// theorem, not a tolerance: the audit compares integers.
import { createSim } from "../../../tools/simlib.mjs";
let rows = 0, bad = 0; const doors = {};
for (const seed of [1337, 4242, 909]) {
  const sim = createSim({ seed });
  sim.G('window._auditFund = { rows: [] };');
  sim.runDays(30);
  const A = JSON.parse(sim.G("JSON.stringify(window._auditFund)"));
  for (const r of A.rows || []) {
    rows++; doors[r.kind] = (doors[r.kind] || 0) + 1;
    if (r.delta !== r.want) { bad++; if (bad < 4) console.log("  MISMATCH", seed, JSON.stringify(r)); }
  }
}
console.log(`audited ${rows} fund movements over three 30-day seeds`);
console.log(`doors exercised: ${JSON.stringify(doors)}`);
console.log(bad === 0 ? "EXACT: every movement delta === want" : `FAILED: ${bad} inexact movements`);
process.exit(bad === 0 ? 0 : 1);

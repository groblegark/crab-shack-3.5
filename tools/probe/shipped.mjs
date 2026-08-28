// Is the zero-step serve path actually EXECUTED in production, or is SUDS
// SHOWERS' `steps: []` inert data? Stock town, no documents installed.
import { createSim } from "../simlib.mjs";
for (const seed of [77, 31, 11]) {
  const s = createSim({ seed });
  s.G(`window._z = 0; window._nz = 0; window._byBiz = {};
       const _serve = serve;
       serve = function (c) {
         const r = c.cust && c.cust.recipe;
         if (r && Array.isArray(r.steps)) {
           if (r.steps.length === 0) { window._z++; window._byBiz[c.workBiz || "?"] = (window._byBiz[c.workBiz || "?"] || 0) + 1; }
           else window._nz++;
         }
         return _serve(c); };`);
  s.runDays(6);
  const r = JSON.parse(s.G(`JSON.stringify({ z: window._z, nz: window._nz, byBiz: window._byBiz, day })`));
  console.log(`seed ${String(seed).padStart(3)}  day=${r.day}  ZERO-STEP serves=${r.z} ${JSON.stringify(r.byBiz)}   one-or-more-step serves=${r.nz}`);
}

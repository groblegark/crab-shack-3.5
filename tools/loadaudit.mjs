// THE LOAD AUDIT. Boots two towns from the same envelope - one loaded once,
// one loaded twice with no tick between - and diffs every module-scoped
// mutable in game.js. Anything that differs is state `load()` did not
// restore, i.e. the previous town leaking into the next one.
//
// Empirical on purpose. The science bench's lesson was that "identical by
// every measure I could name" is not a proof: it diverged on the
// twenty-four-thousandth tick over residue nobody thought to look for. So
// this does not reason about which globals matter - it enumerates them from
// the source and compares all of them.
import { createSim } from "./simlib.mjs";
import { readFileSync } from "fs";

const src = readFileSync(new URL("../game.js", import.meta.url), "utf8");
const names = new Set();
for (const m of src.matchAll(/^(?:let|var)\s+([^;]+);/gm))
  for (const part of m[1].split(",")) {
    const n = part.trim().split(/[=\s]/)[0];
    if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
  }
// the typed planes and pool bookkeeping are `const` bindings over mutable
// buffers - invisible to the scan above, and exactly where the bench's
// furniture and pool leaks lived
for (const n of ["POOL_LIVE", "FT_FLG", "FT_DSH", "poolFree", "PXQ", "PYQ", "PWYQ", "MOTQ", "TXQ", "TYQ"])
  names.add(n);

const mk = () => createSim({ seed: 4242 });
const seed = mk();
seed.runDays(4);
const env = seed.G("JSON.stringify(save(true))");
const envLit = JSON.stringify(env);

const snap = (sim) => {
  const out = {};
  for (const n of names) {
    out[n] = sim.G(`(()=>{try{const v=${n};
      if (v===undefined) return "undef";
      if (v===null) return "null";
      if (typeof v==="function") return "fn";
      if (ArrayBuffer.isView(v)) return "TA:"+Array.from(v).join(",");
      return JSON.stringify(v);
    }catch(e){return "ERR"}})()`);
  }
  return out;
};

// THE LEAK NEEDS RESIDUE. Loading the same envelope twice into a pristine
// world is already clean - there was never anything in the pool, the
// furniture or the ledgers to carry. The condition that bites is loading
// ONTO A TOWN THAT HAS BEEN LIVED, which is exactly what a scrub does.
const clean = mk(); clean.G(`sciSeedStream(99); load(null, JSON.parse(${envLit}))`);
const dirty = mk();
dirty.runDays(7);                       // a whole other town's worth of residue
dirty.G(`sciSeedStream(99); load(null, JSON.parse(${envLit}))`);

const s1 = snap(clean), s2 = snap(dirty);
const diffs = [...names].filter((n) => s1[n] !== s2[n]);
const t = (v) => ((v || "").length > 120 ? v.slice(0, 120) + "…" : v);
console.log("module names scanned:", names.size);
console.log("DIFFER: clean-load vs lived-then-load:", diffs.length);
for (const n of diffs) console.log(`\n  ${n}\n    1x: ${t(s1[n])}\n    2x: ${t(s2[n])}`);

// ---- AND THE QUESTION THAT DECIDES WHETHER ANY OF IT MATTERS: does the
// residue change the SIM? Two towns from one envelope, run the same distance.
// A leak that cannot move this is cosmetic; one that can is a correctness bug.
const FP = `JSON.stringify({
  day, tday, coins, rep, catch: townCatch,
  crabs: allCrabs().map(c => [c.p.name, c.x, c.p.wallet, c.p.hunger, c.p.tired]),
  vis: customers.filter(k => k.visitor && !k.gone).map(k => [k.name, k.x, k.wallet]).sort(),
  fund: townFund.bal, till: OWNERS.sudsy ? OWNERS.sudsy.till : 0 })`;
const runFrom = (lived) => {
  const s = mk();
  if (lived) s.runDays(7);
  s.G(`sciSeedStream(99); load(null, JSON.parse(${envLit}))`);
  const target = +s.G("day") + 3;
  s.runDays(target);
  return s.G(FP);
};
const fpClean = runFrom(false), fpDirty = runFrom(true);
console.log("\n=== SIM DIVERGENCE (load-then-run vs lived-then-load-then-run)");
console.log(fpClean === fpDirty ? "IDENTICAL - the residue is inert" : "DIVERGED - the residue reaches the sim");
if (fpClean !== fpDirty) {
  const a = JSON.parse(fpClean), b = JSON.parse(fpDirty);
  for (const k of Object.keys(a)) {
    const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
    if (x !== y) console.log(`  ${k}:\n    clean: ${t(x)}\n    dirty: ${t(y)}`);
  }
}

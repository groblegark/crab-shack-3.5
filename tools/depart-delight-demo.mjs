// MUTATION DEMO — ruling 6's delight gate BITES (task kd-ICjpq0dCrb).
//
// The claim under test: after ruling 6, `delight` reads the guest's OVERALL
// CONDITION AT EXIT (the five need bars), so a well-tended CRAB can earn the
// glad card. The old gate read `de` — a counter no crab can ever increment
// (two locks: the de write-site excludes crabs, and tasteW returns 1 for a
// crab against a >= 1.5 test). This demo proves the change is load-bearing by
// arming the OLD gate back on and showing the glad card stops being winnable
// for the very stay that earns it under the new gate.
//
// It is a pure-row demo: visQuote is a pure function of a departure row, so no
// sim days are needed. Deterministic; prints a receipt and exits non-zero if
// the mutation FAILS to bite (i.e. if the change were a no-op).
//
//   node tools/depart-delight-demo.mjs
import { createSim } from "./simlib.mjs";

const sim = createSim({ seed: 1 });
const { G } = sim;
const Q20 = G("Q20"), qn = (f) => Math.round(f * Q20);

// A genuinely well-tended CRAB stay: every bar low at exit, everything answered,
// a healthy spend, nothing that went wrong. This is the stay ruling 6 says
// should come home glad.
const wellTended = {
  name: "SANDY", color: 0, acc: "cap", days: 2, nights: 1, nightsBed: 1, rough: 0,
  purse: 100, left: 20, spent: 80, buys: 5, serves: 5, tables: 1,
  meals: 3, drinks: 2, washes: 1, games: 1, rooms: 1,
  topItem: null, topBiz: null, topPaid: 0, tips: 0, dues: 0,
  waitMin: 10, worstMin: 10, worstBiz: "CRAB SHACK",
  quits: 0, quitMin: 0, quitBiz: null,
  shut: 0, full: 0, broke: 0, blocked: null, mistMin: 0, missed: 0,
  hunger: qn(0.15), thirst: qn(0.15), dirt: qn(0.20), bored: qn(0.15), tired: qn(0.10),
  // a crab row carries no `cu` and no `de` — that is the whole point
};

function quote(row, { armOldGate = false } = {}) {
  G(`window.__row = ${JSON.stringify(row)};`);
  if (armOldGate) {
    // MUTATION: restore the pre-ruling gate on BOTH paths. Lambda: gate on de.
    // Program (CRABD): assemble just the delight de-gate weight program (scaled
    // space: (1 <= de) ? 19800*purse : 0) with l1Assemble against DEPART_BUNDLE
    // and splice it in, leaving every other rule untouched.
    G(`(() => {
      const rule = DEPART_RULES.find(r => r.id === "delight");
      window.__savedW = rule.w;
      rule.w = (r) => (r.de || 0) >= 1 ? 66 : 0;
      if (CRABD && CRABD.delight) {
        window.__savedProg = CRABD.delight.w;
        var prog = [["PUSHI",1],["LD","de"],["LE"],["LD","purse"],["PUSHI",19800],["MUL"],["PUSHI",0],["SEL"]];
        var asm = l1Assemble(prog, DEPART_BUNDLE);
        if (asm.why) throw new Error("demo mutation failed to assemble: " + asm.why);
        CRABD.delight.w = asm.code;
      }
    })();`);
  }
  G(`window._nol1depart = false;`);
  const prog = JSON.parse(G(`JSON.stringify(visQuote(window.__row))`));
  G(`window._nol1depart = true;`);
  const lam = JSON.parse(G(`JSON.stringify(visQuote(window.__row))`));
  G(`window._nol1depart = false;`);
  if (armOldGate) {
    G(`(() => { const rule = DEPART_RULES.find(r => r.id === "delight");
      rule.w = window.__savedW; if (CRABD && CRABD.delight && window.__savedProg) CRABD.delight.w = window.__savedProg; })();`);
  }
  return { prog, lam };
}

console.log("MUTATION DEMO — delight reads overall condition (ruling 6)\n");

const now = quote(wellTended);
console.log("NEW GATE (ships): a well-tended crab, every bar low at exit");
console.log(`  lambda : ${now.lam.id} (${now.lam.mood})  "${now.lam.line}"`);
console.log(`  program: ${now.prog.id} (${now.prog.mood})  "${now.prog.line}"`);

const armed = quote(wellTended, { armOldGate: true });
console.log("\nOLD GATE (armed back on): the SAME crab, gate reads `de` (a crab has none)");
console.log(`  lambda : ${armed.lam.id} (${armed.lam.mood})  "${armed.lam.line}"`);
console.log(`  program: ${armed.prog.id} (${armed.prog.mood})  "${armed.prog.line}"`);

// The bite: under the new gate the card is delight/glad; under the old gate the
// SAME crab cannot reach delight (it falls to whatever else the stay says).
const newGlad = now.lam.id === "delight" && now.prog.id === "delight";
const oldNotGlad = armed.lam.id !== "delight" && armed.prog.id !== "delight";
const pathsAgree = now.lam.id === now.prog.id && armed.lam.id === armed.prog.id;

console.log("\n--- VERDICT ---");
console.log(`  new gate -> delight on both paths : ${newGlad}`);
console.log(`  old gate -> NOT delight (crab locked out) : ${oldNotGlad}`);
console.log(`  lambda and program agree in both worlds : ${pathsAgree}`);

if (newGlad && oldNotGlad && pathsAgree) {
  console.log("\nBITES: the ruling-6 gate is load-bearing. A well-run crab earns the glad");
  console.log("card only because delight now reads its condition; arm the old de gate and");
  console.log("the same crab cannot win it. Not a no-op.");
  process.exit(0);
}
console.error("\nDOES NOT BITE: the mutation changed nothing — the gate change is a no-op.");
process.exit(1);

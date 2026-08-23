// THE FIRST CROSSING, named — the re-baseline receipt's head (the slice
// 3/4/5 standard). Two towns, same seed: one with the shipped crab brain
// LIVE, one with brains disarmed (the script path). A brain is draw-free and
// candidates are built identically, so the towns are bit-identical up to the
// first think where the DECISION differs — this finds that think and prints
// both sides' reasoning: the brain's logits, the script's scores.
//
//   node tools/neuro/trace-crossing.mjs [seed] [days]
//     the shipped brain against the script it distilled.
//
//   node tools/neuro/trace-crossing.mjs [seed] [days] --old <artifact.json>
//     the shipped brain against an OLDER artifact installed in the other town
//     — the head of a RETRAIN's re-baseline, where both sides are brains and
//     the question is which think the new weights first answer differently.
//     Both towns still spend the same draws, so the pairing argument holds
//     unchanged and the crossing is a decision, never a stream shift.
import { createSim } from "../simlib.mjs";
import { readFileSync } from "fs";

const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
const SEED = parseInt(positional[0] || "1337");
const DAYS = parseInt(positional[1] || "4");
const OLD = flag("--old");
const oldArt = OLD ? JSON.parse(readFileSync(OLD, "utf8")) : null;

const PROBE = `
window._thinks = [];
{
  const __cand = visCandidates;
  let last = null;
  visCandidates = function (k) { return (last = { k, cand: __cand(k) }).cand; };
  const wrap = (fn) => function (k) {
    const e = fn.apply(this, arguments);
    const facts = last && last.k === k ? last.cand.map(c => ({
      cls: c.biz + ":" + c.need, need: c.need,
      lvl: c.need === "room" ? -1 : visLevel(k, c.need),
      d: Math.abs(k.x - BIZ[c.biz].queueX), ap: priceAppeal(c.biz),
      tw: k.culture && k.culture !== "crab" && c.recipe ? tasteW(k, c.recipe) : 1,
    })) : [];
    window._thinks.push({ T, name: k.name, pick: e ? e.biz + ":" + e.need : "none",
      cand: facts,
      logits: (BRAINS.crab && BRAINS.crab["vis_pick.candidate"]) ? BRAINS.crab["vis_pick.candidate"].logits.slice() : null });
    return e;
  };
  visPick = wrap(visPick);
  brainVisPick = wrap(brainVisPick);
}`;

// arm: true = the tree's own bundled brain; false = the script (or, with
// --old, the older artifact swapped in through the engine's own door).
const run = (arm) => {
  const sim = createSim({ seed: SEED, realm: "main" });
  if (!arm) {
    if (oldArt) sim.G(`BRAINS.crab["vis_pick.candidate"] = buildBrain("vis_pick.candidate",
      ${JSON.stringify({ ...oldArt, kind: "brain", mode: "live" })})`);
    else sim.G("BRAINS = {}");   // disarm: the script decides
  }
  sim.G(PROBE);
  sim.runDays(DAYS);
  return JSON.parse(sim.G("JSON.stringify(window._thinks)"));
};

const CLASSES = ["none", "shack:food", "juicebar:drink", "shack:drink", "showers:clean", "arcade:fun", "hotel:room"];
const lgLine = (l) => l ? l.map((v, j) => `${CLASSES[j]}=${v}`).join(" ") : "?";
const other = oldArt ? `the ${OLD.split("/").pop()} artifact` : "the script";
const brain = run(true), script = run(false);
const n = Math.min(brain.length, script.length);
for (let i = 0; i < n; i++) {
  const b = brain[i], s = script[i];
  if (b.T !== s.T || b.name !== s.name) {
    console.log(`streams diverged BEFORE a decision differed at think ${i} (brain T=${b.T} ${b.name} vs ${other} T=${s.T} ${s.name}) — a draw-parity bug, not a crossing`);
    process.exit(1);
  }
  if (b.pick !== s.pick) {
    console.log(`FIRST CROSSING: think ${i}, tick T=${b.T} (day ${Math.floor(b.T / 7200) + 1}), visitor ${b.name}`);
    console.log(`  ${other} chose ${s.pick}; the shipped brain chose ${b.pick}`);
    console.log(`  candidates (need level Q20 / dist px / appeal / taste):`);
    for (const c of s.cand)
      console.log(`    ${c.cls.padEnd(15)} lvl=${c.lvl} d=${c.d.toFixed(1)} ap=${c.ap.toFixed(3)} tw=${c.tw}`);
    if (oldArt) console.log(`  old logits: ${lgLine(s.logits)}`);
    console.log(`  new logits: ${lgLine(b.logits)}`);
    process.exit(0);
  }
}
console.log(`no crossing in ${n} paired thinks over ${DAYS} days (seed ${SEED}) — try more days`);

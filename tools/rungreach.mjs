// WHY the new rungs are never chosen — the mechanism behind rungprobe's answer.
//
// rungprobe (8 towns x 30 days) reported chosenCapIndexHistogram {0: 94, 3: 15}:
// index 0 (NO LIMIT) and index 3 (4 heads), and NOTHING else — not the new 8-
// and 12-head rungs, and not the pre-existing SIX either. A change that only
// fails to reach its NEW rungs is a sample-size story. A change where the OLD
// top rung is equally unreachable is a mechanism story, and this asks which.
//
// The hypothesis, read off capStake100 + idealPlatform's tie-break:
//
//   capStake100 pays an owner  +min(50, max(0, bizHeads(b)+1-cap)*18)  for each
//   RIVAL shop the cap binds, and charges -22/head for binding their own. A cap
//   that binds NO shop scores exactly 0 — which is exactly what index 0 (cap<=0,
//   early return 0) scores. So every non-binding rung TIES with "no limit"...
//   and capAsk() hands index 0 a -1, the smallest ask on the ladder, so index 0
//   WINS every one of those ties.
//
// If that is right, rung k is reachable only in a town where some shop already
// employs at least HEAD_CAP.steps[k] crabs — the 12-rung needs a 12-head shop.
// The ladder's top is then gated behind the town size the cap exists to limit.
//
// This probe does not live days: it builds rosters of a known size, asks
// idealPlatform directly, and reports the largest reachable rung per size.
//
// IT CALLS THE GAME'S OWN capStake100 AND capAsk — it does not model them.
// The first draft of this file re-implemented both in local JS, and a mutation
// demo caught it: arming `capAsk`'s index-0 privilege from -1 to 99 in game.js
// changed NOTHING in the output, because the output was never reading game.js.
// That is this project's E3 lesson landing on its own instrument — a probe that
// reproduces the code it is auditing proves only that two copies agree. Every
// number below now comes out of the real functions, so a mutation to either one
// moves this table.
//
//   node tools/rungreach.mjs
import { createSim } from "./simlib.mjs";

const sim = createSim({ seed: 909 });
// a town with shops open and crabs on payrolls, so the roster the probe
// borrows from is a real one
sim.G(`coins = 900000; tryBuy("juicebar"); tryBuy("table");
  while (crabs.length < 6) hireCrew();`);
sim.runDays(3, { tickEvery: 400 });

// Score the ladder directly against a synthetic roster: one owner-voter, and a
// rival shop staffed with N heads. Everything else about the platform is held
// flat, so the only thing moving is the cap index.
const out = JSON.parse(sim.G(`JSON.stringify((() => {
  const steps = HEAD_CAP.steps;
  const rows = [], voters = [];

  // THE REAL FUNCTIONS, not copies of them. capStake100(c, p) reads the roster
  // through bizHeads()/allCrabs(), so a voter is a real crab object and a
  // platform is a real platform; capAsk(p) is called as the game calls it.
  const ladder = steps.map((s, i) => ({ mech: "rents", rate: 0, bowls: 0, wage: 0, cap: i }));

  // Rank a ladder exactly the way idealPlatform does, but on the cap dial
  // alone: best stake wins, ties fall to the smaller capAsk.
  const rank = (score) => {
    const vals = ladder.map((p, i) => ({ i, v: score(p) }));
    const bv = Math.max(...vals.map(x => x.v));
    const tied = vals.filter(x => x.v === bv).map(x => x.i);
    const chosen = tied.slice().sort((a, b) => capAsk(ladder[a]) - capAsk(ladder[b]))[0];
    return { perRungStake: vals.map(x => x.v), tiedAtBest: tied, chosen };
  };

  // A voter is a real crab. Take live ones off the roster and vary only the
  // two fields capStake100 branches on, so the term sees a genuine crab.
  const roster = allCrabs();
  const mk = (owner, job) => {
    const c = roster[0];
    const saved = { owner: c.p.owner, job: c.p.job };
    c.p.owner = owner; c.p.job = job;
    return { c, restore: () => { c.p.owner = saved.owner; c.p.job = saved.job; } };
  };

  for (const jobless of [false, true]) {
    const v = mk(null, jobless ? "none" : "shack");
    voters.push(Object.assign(
      { voter: jobless ? "no till, no wage job" : "no till, has a wage job" },
      rank((p) => capStake100(v.c, p))));
    v.restore();
  }

  // For the owner rows the head count must be REAL, because capStake100 counts
  // it through bizHeads(). Clone the roster up to the size we want to test,
  // all working one rival shop under one owner id.
  const owner = mk("probe-owner", "none");
  const rival = Object.keys(BIZ).find(b => bizUnlocked(b) && bizOwner(b)) || Object.keys(BIZ)[0];
  const rivalOid = bizOwner(rival) || "rival-owner";
  const template = roster[0];
  for (const heads of [2, 4, 6, 8, 10, 12, 16, 20]) {
    const added = [];
    // allCrabs() memoizes on rosterGen (game.js ~5461) — pushing to crabs[]
    // without bumping it hands bizHeads a stale roster, which is exactly how
    // the first version of this loop reported actualHeads:5 for every row.
    while (bizHeads(rival) < heads) {
      const k = { p: Object.assign({}, template.p, {
        job: rival, owner: null, npc: false, name: "PROBE" + added.length }) };
      crabs.push(k); added.push(k); rosterGen++;
      if (added.length > 64) break;   // never spin if the count cannot move
    }
    rows.push(Object.assign({ heads, actualHeads: bizHeads(rival) },
      rank((p) => capStake100(owner.c, p))));
    for (const k of added) crabs.splice(crabs.indexOf(k), 1);
    rosterGen++;
  }
  owner.restore();
  return { steps, rows, voters };
})())`));

console.log("HEAD_CAP.steps:", JSON.stringify(out.steps));
console.log("");
console.log("biggest rival shop | stake per rung " + JSON.stringify(out.steps) + " | tied-at-best | CHOSEN");
for (const r of out.rows) {
  console.log(
    String(r.heads).padStart(18) + " | " +
    JSON.stringify(r.perRungStake).padEnd(30) + " | " +
    JSON.stringify(r.tiedAtBest).padEnd(12) + " | index " + r.chosen +
    " (= " + out.steps[r.chosen] + " heads)");
}
console.log("");
console.log("THE CRABS WHO KEEP NO TILL (the majority of any roster):");
for (const v of out.voters) {
  console.log("  " + v.voter.padEnd(26) + " | " +
    JSON.stringify(v.perRungStake).padEnd(30) + " | chosen index " + v.chosen +
    " (= " + out.steps[v.chosen] + " heads)");
}
console.log("");
console.log(JSON.stringify({ steps: out.steps, rows: out.rows, voters: out.voters }));

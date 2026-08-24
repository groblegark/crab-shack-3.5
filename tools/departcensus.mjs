// THE DEPARTURE-CARD CENSUS. Matt ruled "measure first, then rule" on the
// ~52,000x weight inflation, so this is the measurement that ruling asked for.
//
// THE FINDING BEING TESTED (design/cs35-research/numeric-wip/phase-e3-closeout.md):
// the numeric port inflated the need rules' weights ~52,000x - `44 + 20 *
// r.hunger` was written for hunger in 0..1 and now reads Q20 integers - so a
// fired need rule scores ~18-21M against rough/quits at ~120-220 and dominates
// outright, the reverse of the float-era band comments at game.js:18016. E3
// transcribed this FAITHFULLY, which was correct for a transcription slice;
// whether the bands or the arithmetic express the intent is the open question.
//
// The honest way to decide is not to argue about the comment. It is to ask
// what the cards actually SAY across a lot of towns: if one need rule wins
// nearly every card, the departure card has one story and the other twenty-two
// rules are decoration.
//
// METHOD. It counts through the phase-D settlementAggregate hook, which fires
// once per departing guest carrying the winning rule id - the same hook E3's
// Layer-1 path was silently skipping until it was repaired today. So this
// census is also a live exercise of that repair: if the hook regressed, this
// tool reports zero departures rather than a plausible-looking histogram.
//
//   node tools/departcensus.mjs [--days 30] [--towns 8]
import { createSim } from "./simlib.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? +process.argv[i + 1] : d;
};
const DAYS = arg("days", 30), TOWNS = arg("towns", 8);
const SEEDS = [909, 1337, 4242, 21, 77, 5, 13, 101, 313, 1009, 66, 2027];

const hist = {}, moods = {};
let cards = 0;

for (const seed of SEEDS.slice(0, TOWNS)) {
  const sim = createSim({ seed });
  sim.G(`window._census = [];
    registerHook("settlementAggregate", { id: "census", fn: (c) => window._census.push([c.rule, c.culture]) });
    coins = 900000; tryBuy("juicebar"); tryBuy("table");`);
  sim.runDays(DAYS, { tickEvery: 400, onTick: (G) => G(`if (coins < 80000) coins = 80000;`) });
  const rows = JSON.parse(sim.G(`JSON.stringify(window._census || [])`));
  for (const [rule] of rows) { hist[rule] = (hist[rule] || 0) + 1; cards++; }
  // ...and the moods, because "one rule wins everything" and "every card wears
  // the same face" are different complaints with different fixes.
  const md = JSON.parse(sim.G(`JSON.stringify((() => {
    const m = {};
    for (const r of DEPART_RULES) m[r.id] = r.mood;
    return m; })())`));
  for (const k in md) moods[k] = md[k];
}

const ranked = Object.entries(hist).sort((a, b) => b[1] - a[1]);
const pct = (n) => (100 * n / Math.max(1, cards)).toFixed(1) + "%";
console.log(JSON.stringify({
  towns: TOWNS, days: DAYS, cards,
  top: ranked.slice(0, 8).map(([id, n]) => [id, n, pct(n), moods[id] || "?"]),
  rulesThatNeverWon: Object.keys(moods).filter(id => !hist[id]).sort(),
  distinctWinners: ranked.length,
}));

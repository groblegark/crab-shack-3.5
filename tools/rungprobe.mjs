// ARE THE NEW RUNGS REACHABLE? (the vacuity check for the house-limit ladder)
//
// HEAD_CAP.steps grew from [0,2,3,4,6] to [0,2,3,4,6,8,12], which enlarges
// allPlatforms() by ~40%. The full suite then came back 680/680 GREEN with
// not one fingerprint moved - and a change that enlarges the search space
// while altering NOTHING observable is either unreachable or unwired. This
// project treats that smell as a finding, not a relief.
//
// So: run real towns, and for every crab on every election day ask what
// idealPlatform() actually picks. Report the histogram of chosen cap INDICES.
// If 5 and 6 (the 8- and 12-head rungs) never appear, the rungs are dead data
// and the ladder change is cosmetic. If they do appear, the suite was green
// because no PINNED scenario runs an election long enough to see them, which
// is a gap in the pins rather than in the ladder.
//
//   node tools/rungprobe.mjs [--days 30] [--towns 8]
import { createSim } from "./simlib.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? +process.argv[i + 1] : d;
};
const DAYS = arg("days", 30), TOWNS = arg("towns", 8);
const SEEDS = [909, 1337, 4242, 21, 77, 5, 13, 101];

const hist = {}, winners = {};
let crabsAsked = 0, elections = 0;

for (const seed of SEEDS.slice(0, TOWNS)) {
  const sim = createSim({ seed });
  // buy enough that the town has payrolls worth capping, then live.
  sim.G(`coins = 900000; tryBuy("juicebar"); tryBuy("table");
    while (crabs.length < 6) hireCrew();`);
  sim.runDays(DAYS, { tickEvery: 400, onTick: (G) => G(`if (coins < 80000) coins = 80000;`) });
  const out = JSON.parse(sim.G(`JSON.stringify((() => {
    const grid = allPlatforms();
    const picks = [];
    for (const c of allCrabs()) {
      const p = idealPlatform(c, grid);
      picks.push(p && p.cap != null ? (p.cap | 0) : 0);
    }
    return { picks, policyCap: (hall.policy && hall.policy.cap) | 0,
             steps: HEAD_CAP.steps, gridSize: grid.length };
  })())`));
  for (const ix of out.picks) { hist[ix] = (hist[ix] || 0) + 1; crabsAsked++; }
  winners[seed] = out.policyCap;
  elections++;
  if (seed === SEEDS[0]) console.log("steps:", JSON.stringify(out.steps), "grid:", out.gridSize);
}

console.log(JSON.stringify({ crabsAsked, elections, chosenCapIndexHistogram: hist,
  policyCapPerTown: winners }));

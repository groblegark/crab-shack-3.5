// THE TWELVE-TOWN PRICE POOL - the instrument that adjudicates a re-rolled
// rivalry arm, run outside the suite.
//
// Why this exists. The suite's "rivalry: ...the player's own board does not
// move their own trade" arm asserts cheap.bar > mid.bar + K and
// cheap.bar > dear.bar + K, K=30, over EIGHT towns. Its own note records that
// the arm is re-rolled by ANY change to visitor separation - the personal-space
// episode measured `--novsep` reading BYTE-IDENTICAL to the base tree, "the
// parting alone re-rolls the arms" - and that the remedy for a re-roll is a
// TWELVE-town pool, not a widened K ("do not widen K").
//
// vsepPush is the parting. So when the float-aim fix (77d320a / 2fe4ec4) put
// the arm red at dear 454 / mid 498 / cheap 508 - cheap clearing dear by 54 but
// clearing MID by only 10 against K=30 - the question is exactly the one this
// pool answers: did the cheap end genuinely thin, or did one 8-town pool
// re-roll?
//
// THE CONTROL IS THE POINT. Each price arm runs twice, once normally and once
// with window._novsep. If the fix's damage is real it survives _novsep being
// off on both trees; if it is a re-roll, the _novsep columns agree across
// trees while the live columns disagree.
//
//   node tools/rivalpool.mjs --mul 0.7 [--novsep] [--towns 12]
//
// Emits one JSON line: {mul, novsep, towns, bar, shwr, perTown:[...]}.
// The fixture below is the suite scenario's, verbatim in shape - hotelier out,
// walkouts off, WAGE FLOOR OFF, illness pinned off in the onTick - because a
// pool that measures a different town measures nothing.
import { createSim } from "./simlib.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? +process.argv[i + 1] : d;
};
const MUL = arg("mul", 1.0);
const TOWNS = arg("towns", 12);
const NOVSEP = process.argv.includes("--novsep");

// The suite's eight, then four more. The first eight are IN THE SAME ORDER as
// the scenario so an 8-town slice of this pool is comparable to the suite's own
// number; the extra four are the pool's added power and nothing else.
const SEEDS = [909, 1337, 4242, 21, 77, 5, 13, 101, 313, 1009, 66, 2027];

let bar = 0, shwr = 0;
const perTown = [];
for (const seed of SEEDS.slice(0, TOWNS)) {
  const s2 = createSim({ seed });
  s2.G(`window._noHotelier = true; window._failOff = { walkout: 1 };
    window._noFloor = true;
    ${NOVSEP ? "window._novsep = true;" : ""}
    coins = 900000; tryBuy("juicebar"); tryBuy("table"); while (crabs.length < 6) hireCrew();
    crabs[2].p.job = "juicebar"; crabs[4].p.job = "juicebar";
    crabs[2].p.shift = "M"; crabs[4].p.shift = "E";
    setBizPrice("showers", 0.7); setBizPrice("juicebar", ${MUL});
    window._stats = {}; coins = 900000;`);
  s2.runDays(9, { tickEvery: 200, onTick: (G) => G(`if (coins < 80000) coins = 80000;
    for (const c of allCrabs()) if (c.p.sick) c.p.sick = null;`) });
  const b = +s2.G(`window._stats.drinkServesTour || 0`);
  const w = +s2.G(`window._stats.showersDoneTour || 0`);
  bar += b; shwr += w;
  perTown.push([seed, b, w]);
}

console.log(JSON.stringify({ mul: MUL, novsep: NOVSEP, towns: TOWNS, bar, shwr, perTown }));

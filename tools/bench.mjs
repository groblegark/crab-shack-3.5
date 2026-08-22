// THE THROUGHPUT BENCHMARK — the instrument a speedup claim is made against.
//
// The perf plan measures where time GOES (profiler percentages). This
// measures how much SIM there IS per unit of compute, which is the only
// number a "Nx faster" claim can be checked against. One number, one fixed
// workload, comparable across every rung of the ladder.
//
//   node tools/bench.mjs                    # the standard workload
//   node tools/bench.mjs --days 20 --seeds 4
//   node tools/bench.mjs --json             # one line, for scripting
//
// THE METRIC IS SIM-DAYS PER SECOND, BEST OF N ROUNDS. Read this before
// trusting any number it prints, because the obvious methodology is wrong
// in a way that MEASURED A 1.5x SPEEDUP THAT DOES NOT EXIST.
//
// The first version of this file quoted CPU-seconds, reasoning that wall
// time on a box running agent forks measures the neighbours. That is true
// but it does not save you, because THIS IS A HETEROGENEOUS CPU. When the
// machine is busy the scheduler parks node on an efficiency core, and an
// E-core second is billed identically to a P-core second while doing a
// third of the work. So cpuUsage() inflates under load exactly like wall
// does, and cpu/wall stays a flat ~1.3 throughout, cheerfully signalling
// "not contended" while throughput drops by a third.
//
// Caught by interleaving: three trees benched round-robin, three rounds.
// The numbers clustered by WHEN they ran (round 1 all ~1.2, round 3 all
// ~1.75) and not at all by WHICH TREE, which is the signature of a machine
// artifact rather than a code difference. Benched one-tree-at-a-time it
// reads as a clean 1.5x win for whichever tree you happened to measure
// last.
//
// So: --repeat runs the workload N times IN-PROCESS and reports the BEST
// round. Best-of-N approximates the uncontended P-core figure (noise only
// ever makes a run slower, never faster) and warm rounds also amortize the
// cold JIT that a fresh `node tools/bench.mjs` pays every invocation.
// Compare trees by their BEST, and only trust a difference that survives
// interleaving.
//
// THE WORKLOAD IS PINNED BY FINGERPRINT. A benchmark whose workload drifts
// measures nothing across time, and the whole point here is comparing a
// number taken today against one taken four slices later. Every run prints
// a workload fingerprint (the towns' end state); if that moves, the sims
// are not the same sims and the speeds are not comparable - which is a
// FEATURE during a rewrite, because the numeric slices deliberately move
// trajectories. Quote the fingerprint next to the speed, always.

import { createSim } from "./simlib.mjs";

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf(name);
  return i === -1 ? dflt : Number(argv[i + 1]);
};
const DAYS = flag("--days", 12);
const SEEDS = flag("--seeds", 4);
const BASE = flag("--seedbase", 0);
const REPEAT = flag("--repeat", 3);
const JSON_OUT = argv.includes("--json");

// mulberry32's own seed spread, so the towns differ the way the matrix's do
const seedOf = (i) => [1337, 4242, 909, 31, 41, 59, 26, 53][(BASE + i) % 8] + ((BASE + i) >> 3) * 7919;

const round = () => {
  const cpu0 = process.cpuUsage(), t0 = process.hrtime.bigint();
  let simDays = 0;
  const fp = [];
  for (let i = 0; i < SEEDS; i++) {
    const seed = seedOf(i);
    const sim = createSim({ seed });
    const before = sim.G("day");
    sim.runDays(DAYS);
    const after = sim.G("day"), over = sim.G("gameOver");
    // a town that goes bankrupt on day 9 did nine days of work, not twelve -
    // counting the ASKED-FOR days would credit the engine for sim it never ran
    simDays += Math.min(after, DAYS) - before + 1;
    fp.push(`${seed}:${sim.G("coins")}:${after}${over ? "!" : ""}`);
  }
  const cpu = process.cpuUsage(cpu0);
  const wallSec = Number(process.hrtime.bigint() - t0) / 1e9;
  return { simDays, fp: fp.join(" "), wallSec,
           cpuSec: (cpu.user + cpu.system) / 1e6, rate: simDays / wallSec };
};

const rounds = [];
for (let r = 0; r < REPEAT; r++) rounds.push(round());
const best = rounds.reduce((a, b) => (b.rate > a.rate ? b : a));
const worst = rounds.reduce((a, b) => (b.rate < a.rate ? b : a));
const { simDays, cpuSec, wallSec } = best;
const perCpu = simDays / cpuSec, perWall = best.rate;
const fp = [best.fp];
// a workload that is not identical across rounds is not a workload
const stable = rounds.every((r) => r.fp === best.fp);

const spread = worst.rate ? best.rate / worst.rate : 1;
if (JSON_OUT) {
  console.log(JSON.stringify({
    simDays, rounds: REPEAT, cpuSec: +cpuSec.toFixed(2), wallSec: +wallSec.toFixed(2),
    daysPerSec: +perWall.toFixed(2), daysPerCpuSec: +perCpu.toFixed(2),
    spread: +spread.toFixed(2), stable, fingerprint: best.fp,
  }));
} else {
  console.log(`workload   ${SEEDS} towns x ${DAYS} days -> ${simDays} sim-days actually run`);
  console.log(`rounds     ${REPEAT}, best ${best.wallSec.toFixed(2)}s / worst ${worst.wallSec.toFixed(2)}s wall` +
              (spread > 1.15 ? `  - spread ${spread.toFixed(2)}x, the machine is noisy; the BEST is the estimate` : ""));
  if (!stable) console.log(`WARNING    the workload fingerprint MOVED between rounds - this run measures nothing`);
  console.log(`\n>> ${perWall.toFixed(2)} sim-days per second, best of ${REPEAT}   (${perCpu.toFixed(2)} per cpu-second)`);
  console.log(`   workload fingerprint: ${best.fp}`);
}

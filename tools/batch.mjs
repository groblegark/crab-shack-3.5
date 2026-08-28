// THE BATCH INSTRUMENT — distribution-level science over many towns.
//
// The perf plan's rung-4 prize, built on the CPU runway first: eviction
// histograms, lifetime distributions, rare-event hunting, parameter sweeps —
// the workload where "1000x" means aggregate throughput, never single-town
// latency. This file contains NO game logic and NO sim harness of its own:
// every town runs through tools/headless.mjs's OWN worker mode (fork + IPC),
// so the autopilot, the arm-off hatches and the per-seed result shape are
// headless's, verbatim — the regression detector and the science instrument
// cannot drift apart.
//
//   node tools/batch.mjs --towns 128 --days 30                # baseline sweep
//   node tools/batch.mjs --towns 64 --days 40 --buy chef,table
//   node tools/batch.mjs --towns 256 --seedbase 1000 --json
//
// Seeds are seedbase..seedbase+towns-1, headless's own convention. Any flag
// this file does not parse is passed through to every worker untouched
// (--buy, --set, the hatches, --wage, --star...). The kernel and the main
// realm are ARMED BY DEFAULT here - this is the throughput workload - and
// --no-kernel / --realm vm opt back out.
//
// The throughput receipt counts LIVED sim-days (a town evicted on day 9 did
// nine days of work), and stamps the load average next to the number - a
// batch taken on a busy box is a real result with an honest denominator.
//
// --jobs defaults from the CGROUP quota (tools/cores.mjs), not the host core
// count: in a fleet pod os.cpus().length reported 16 against a 4-core limit,
// so this file used to fork 14 workers onto 4 cores. The receipt banks
// `cores` beside `jobs` so an oversubscribed run is visible in the JSON
// rather than inferred from a suspicious throughput number.

import { fork } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { loadavg } from "os";
import { defaultJobs, coresNote, usableCores } from "./cores.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i === -1 ? dflt : args[i + 1];
};
const TOWNS = parseInt(opt("towns", "64"));
const SEEDBASE = parseInt(opt("seedbase", "0"));
// Cgroup quota, not host cores - see tools/cores.mjs. Reserve 2: this parent
// plus headroom, since batch runs are the widest fan-out we do.
const JOBS = parseInt(opt("jobs", String(defaultJobs({ reserve: 2, cap: TOWNS }))));
const JSON_OUT = args.includes("--json");
const NO_KERNEL = args.includes("--no-kernel");

// everything not ours is a worker flag, passed through verbatim
const OURS = new Set(["--towns", "--seedbase", "--jobs", "--json", "--no-kernel"]);
const passthrough = [];
for (let i = 0; i < args.length; i++) {
  if (OURS.has(args[i])) { if (!args[i + 1] || !args[i + 1].startsWith("--")) i += args[i] === "--json" || args[i] === "--no-kernel" ? 0 : 1; continue; }
  passthrough.push(args[i]);
}
if (!passthrough.includes("--days")) passthrough.push("--days", "30");
if (!passthrough.includes("--quiet")) passthrough.push("--quiet");

const headless = join(dirname(fileURLToPath(import.meta.url)), "headless.mjs");
const env = { ...process.env };
if (!NO_KERNEL && !env.SIMLIB_KERNEL) env.SIMLIB_KERNEL = "wasm";
if (!env.SIMLIB_REALM && !passthrough.includes("--realm")) env.SIMLIB_REALM = "main";

const t0 = process.hrtime.bigint();
const results = new Array(TOWNS);
await new Promise((resolve, reject) => {
  let next = 0, done = 0, live = 0;
  const launch = () => {
    while (live < JOBS && next < TOWNS) {
      const idx = next++;
      live++;
      const child = fork(headless, [...passthrough, "--_worker", String(SEEDBASE + idx)],
        { env, stdio: ["ignore", "ignore", "inherit", "ipc"] });
      child.on("message", (m) => { results[idx] = m; });
      child.on("error", reject);
      child.on("exit", () => {
        live--;
        if (results[idx] === undefined) results[idx] = { over: true, day: 0, lifetime: 0, worker_died: true };
        if (++done === TOWNS) return resolve();
        launch();
      });
    }
  };
  launch();
});
const wallSec = Number(process.hrtime.bigint() - t0) / 1e9;

// ---- the distributions ----------------------------------------------------
const survived = results.filter((r) => !r.over);
const evictDays = results.filter((r) => r.over).map((r) => r.day).sort((a, b) => a - b);
const lifetimes = results.map((r) => +r.lifetime || 0).sort((a, b) => a - b);
const livedDays = results.reduce((s, r) => s + (r.day || 0), 0);
const died = results.filter((r) => r.worker_died).length;
const q = (arr, f) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(f * arr.length))] : 0);
const hist = {};
for (const d of evictDays) hist[d] = (hist[d] || 0) + 1;

// ARCADE OCCUPANCY INSTRUMENT. A --noplay/as-built A/B is a NULL RESULT in any
// town that never BUILT an arcade (--noplay is a no-op with no machines) or
// never STAFFED one (an empty floor plays no games) - both arms return the
// identical number and it reads like "the arcade costs nothing." So the receipt
// must SAY how many towns actually got there and how much play happened, or the
// delta below it cannot be trusted. Reads the per-town `ups` (arcade:LVL) and
// `_stats` the headless worker already returns - no game logic, no sim cost.
// A dead worker carries neither field; the guards below read it as zero, which
// is the honest floor (a town that crashed built and played nothing we saw).
const arcadeLvl = (r) => { const m = /(?:^|\s)arcade:(\d+)/.exec(r.ups || ""); return m ? +m[1] : 0; };
const statOf = (r) => { try { return JSON.parse(r.stats || "{}"); } catch { return {}; } };
const builtArcade = results.filter((r) => arcadeLvl(r) > 0).length;
const playedTowns = results.filter((r) => (statOf(r).gamesPlayed || 0) > 0);
const gamesPlayed = results.reduce((s, r) => s + (statOf(r).gamesPlayed || 0), 0);
const gamesTour = results.reduce((s, r) => s + (statOf(r).gamesPlayedTour || 0), 0);
const gamesCrab = results.reduce((s, r) => s + (statOf(r).gamesPlayedCrab || 0), 0);

// SURF BREAK DOSE. Exactly the same problem as the arcade above, one notch
// worse: the sea only fires ~8% of days and most towns are evicted inside a
// fortnight, so an as-built arm can easily contain ZERO surf sessions - and
// then the --nosurf A/B under it is two identical numbers that read as "the
// surf costs nothing." THE DOSE IS NOT OPTIONAL INSTRUMENTATION, it is the
// difference between a measurement and a null result, and the first run of
// this matrix shipped without it and could not tell the two apart.
// `sessions` = crabs who paddled out; `rides` = sessions that finished (a
// town evicted mid-session logs one of the first and none of the second);
// `crowded` = rides that shared the peak, the number SURF_CROWD is priced on.
// Must be 0 in every --nosurf arm; must be >0 in an as-built arm, or say so.
const surfSessions = results.reduce((s, r) => s + (statOf(r).surfSessions || 0), 0);
const surfRides = results.reduce((s, r) => s + (statOf(r).surfRides || 0), 0);
const surfCrowded = results.reduce((s, r) => s + (statOf(r).surfCrowded || 0), 0);
const surfTowns = results.filter((r) => (statOf(r).surfSessions || 0) > 0).length;

const out = {
  towns: TOWNS, seedbase: SEEDBASE, jobs: JOBS, cores: usableCores(),
  workload: passthrough.join(" "),
  kernel: env.SIMLIB_KERNEL === "wasm", realm: env.SIMLIB_REALM || "vm",
  survived: survived.length, evicted: evictDays.length, workersDied: died,
  evictionDays: { histogram: hist, median: q(evictDays, 0.5), min: evictDays[0] || null, max: evictDays[evictDays.length - 1] || null },
  lifetime: { median: q(lifetimes, 0.5), p10: q(lifetimes, 0.1), p90: q(lifetimes, 0.9),
              mean: Math.round(lifetimes.reduce((s, v) => s + v, 0) / (lifetimes.length || 1)) },
  throughput: { livedSimDays: livedDays, wallSec: +wallSec.toFixed(2),
                simDaysPerSec: +(livedDays / wallSec).toFixed(1), loadavg: loadavg().map((v) => +v.toFixed(1)) },
  // The reputation pass's acceptance row: end-rep per town, sorted. REPORT
  // ONLY - no town decision reads it. Exists so "tons of homeless tourists
  // and a 100 rep" is a claim a receipt can falsify.
  rep: (() => { const rs = results.map((r) => +r.rep || 0).sort((a, b) => a - b);
    return { list: rs, median: q(rs, 0.5) }; })(),
  // See the ARCADE OCCUPANCY INSTRUMENT note above. `built` = towns whose buy
  // list actually reached an arcade; `playedIn` = towns where at least one game
  // was played (built AND staffed AND a bored, funded customer reached it);
  // `games` splits tourist/crab. Under --noplay, `built` stays but `games`->0.
  arcade: { built: builtArcade, playedIn: playedTowns.length,
            games: gamesPlayed, gamesTour, gamesCrab },
  // See the SURF BREAK DOSE note above. `towns` = towns where at least one
  // crab paddled out; under --nosurf every number here must be 0, and in an
  // as-built arm `sessions` must not be, or the arm measured nothing.
  surf: { towns: surfTowns, sessions: surfSessions, rides: surfRides, crowded: surfCrowded },
};

if (JSON_OUT) console.log(JSON.stringify(out));
else {
  console.log(`batch      ${TOWNS} towns (seeds ${SEEDBASE}..${SEEDBASE + TOWNS - 1}) x ${opt("days", "30")} days, ${JOBS} workers, kernel ${out.kernel ? "armed" : "off"}, realm ${out.realm}`);
  console.log(`           ${coresNote()}`);
  console.log(`outcome    ${survived.length} survived / ${evictDays.length} evicted${died ? ` / ${died} WORKERS DIED` : ""}`);
  if (evictDays.length) {
    const days = Object.keys(hist).map(Number).sort((a, b) => a - b);
    const w = Math.max(...Object.values(hist));
    console.log(`eviction   median day ${out.evictionDays.median}, range ${out.evictionDays.min}-${out.evictionDays.max}`);
    for (const d of days) console.log(`  day ${String(d).padStart(3)}  ${"#".repeat(Math.max(1, Math.round(hist[d] * 40 / w))).padEnd(40)} ${hist[d]}`);
  }
  console.log(`lifetime   median $${out.lifetime.median}  p10 $${out.lifetime.p10}  p90 $${out.lifetime.p90}  mean $${out.lifetime.mean}`);
  console.log(`arcade     built ${builtArcade}/${TOWNS}, played-in ${playedTowns.length}, games ${gamesPlayed} (tour ${gamesTour}/crab ${gamesCrab})`);
  console.log(`surf       paddled out in ${surfTowns}/${TOWNS} towns, ${surfSessions} sessions, ${surfRides} rides (${surfCrowded} shared the peak)`);
  console.log(`\n>> ${out.throughput.simDaysPerSec} lived sim-days/sec machine-wide  (${livedDays} days / ${out.throughput.wallSec}s, loadavg ${out.throughput.loadavg.join(" ")})`);
}

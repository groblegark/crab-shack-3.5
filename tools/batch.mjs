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

import { fork } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { cpus, loadavg } from "os";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i === -1 ? dflt : args[i + 1];
};
const TOWNS = parseInt(opt("towns", "64"));
const SEEDBASE = parseInt(opt("seedbase", "0"));
const JOBS = parseInt(opt("jobs", String(Math.max(1, cpus().length - 2))));
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

const out = {
  towns: TOWNS, seedbase: SEEDBASE, jobs: JOBS,
  workload: passthrough.join(" "),
  kernel: env.SIMLIB_KERNEL === "wasm", realm: env.SIMLIB_REALM || "vm",
  survived: survived.length, evicted: evictDays.length, workersDied: died,
  evictionDays: { histogram: hist, median: q(evictDays, 0.5), min: evictDays[0] || null, max: evictDays[evictDays.length - 1] || null },
  lifetime: { median: q(lifetimes, 0.5), p10: q(lifetimes, 0.1), p90: q(lifetimes, 0.9),
              mean: Math.round(lifetimes.reduce((s, v) => s + v, 0) / (lifetimes.length || 1)) },
  throughput: { livedSimDays: livedDays, wallSec: +wallSec.toFixed(2),
                simDaysPerSec: +(livedDays / wallSec).toFixed(1), loadavg: loadavg().map((v) => +v.toFixed(1)) },
};

if (JSON_OUT) console.log(JSON.stringify(out));
else {
  console.log(`batch      ${TOWNS} towns (seeds ${SEEDBASE}..${SEEDBASE + TOWNS - 1}) x ${opt("days", "30")} days, ${JOBS} workers, kernel ${out.kernel ? "armed" : "off"}, realm ${out.realm}`);
  console.log(`outcome    ${survived.length} survived / ${evictDays.length} evicted${died ? ` / ${died} WORKERS DIED` : ""}`);
  if (evictDays.length) {
    const days = Object.keys(hist).map(Number).sort((a, b) => a - b);
    const w = Math.max(...Object.values(hist));
    console.log(`eviction   median day ${out.evictionDays.median}, range ${out.evictionDays.min}-${out.evictionDays.max}`);
    for (const d of days) console.log(`  day ${String(d).padStart(3)}  ${"#".repeat(Math.max(1, Math.round(hist[d] * 40 / w))).padEnd(40)} ${hist[d]}`);
  }
  console.log(`lifetime   median $${out.lifetime.median}  p10 $${out.lifetime.p10}  p90 $${out.lifetime.p90}  mean $${out.lifetime.mean}`);
  console.log(`\n>> ${out.throughput.simDaysPerSec} lived sim-days/sec machine-wide  (${livedDays} days / ${out.throughput.wallSec}s, loadavg ${out.throughput.loadavg.join(" ")})`);
}

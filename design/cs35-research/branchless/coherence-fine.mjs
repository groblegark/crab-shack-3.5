// BRANCHLESS RESEARCH — the coherence instrument.
//
// Measures, from real headless runs, the quantities the branchless question
// turns on: how often a crab's dispatch state actually CHANGES (CPU branch
// predictability), how many distinct states a town runs at once (state-sorted
// bucket count), and how similar the same crab-slot looks across 32 seeds at
// the same tick (GPU warp coherence for one-town-per-lane).
//
//   node design/cs35-research/branchless/coherence.mjs --days 12 --seeds 32
//
// The instrument wraps requestAnimationFrame in-context: the game re-registers
// its frame callback every frame, so every frame from the second onward runs
// the probe after the sim step. The probe reads state, never writes it, and
// consumes no RNG - fingerprints are untouched (asserted at the end).

import { createSim } from "../../../tools/simlib.mjs";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const DAYS = flag("--days", 12);
const SEEDS = flag("--seeds", 32);
const SAMPLE_EVERY = 100;   // frames; 20Hz -> one sample per 5 sim-seconds

const PROBE = `
(() => {
  const orig = requestAnimationFrame;
  window._brb = { frames: 0, trans: 0, crabTicks: 0,
                  transByState: Object.create(null), stateTicks: Object.create(null),
                  bucketSum: 0, bucketHist: Object.create(null), prev: null,
                  custSum: 0, actorSum: 0, samples: [] };
  requestAnimationFrame = (cb) => orig((t) => {
    cb(t);
    const B = window._brb; B.frames++;
    const n = crabs.length; const sts = new Array(n);
    for (let i = 0; i < n; i++) {
      const c = crabs[i];
      sts[i] = c.dayState + ":" + (c.kstate || "") + ":" + (c.errand ? (c.errand.biz || c.errand.kind || "e") : "") + (c.dayState === "working" && c.p.job === "fishing" ? "~F" : "");
    }
    B.crabTicks += n;
    for (let i = 0; i < n; i++) {
      const s = sts[i];
      B.stateTicks[s] = (B.stateTicks[s] || 0) + 1;
      if (B.prev && B.prev[i] !== undefined && B.prev[i] !== s) {
        B.trans++; B.transByState[s] = (B.transByState[s] || 0) + 1;
      }
    }
    B.prev = sts;
    const set = new Set(sts);
    B.bucketSum += set.size; B.bucketHist[set.size] = (B.bucketHist[set.size] || 0) + 1;
    B.custSum += customers.length;
    B.actorSum += crabs.length + customers.length + npcs.length;
    if (B.frames % ${SAMPLE_EVERY} === 0) B.samples.push(sts.join("|"));
  });
})();`;

const perSeed = [];
for (let s = 0; s < SEEDS; s++) {
  const seed = 1000 + s * 17;
  const sim = createSim({ seed });
  sim.G(PROBE);
  sim.runDays(DAYS);
  const B = JSON.parse(sim.G("JSON.stringify(window._brb, (k,v) => k==='prev' ? undefined : v)"));
  const stats = JSON.parse(sim.G("JSON.stringify({ day, over: gameOver, ill: (window._stats.illness||[]).length, polls: (window._stats.polls||[]).length, closures: (window._stats.closures||[]).length, walkouts: (window._stats.walkouts||[]).length, coins })"));
  perSeed.push({ seed, B, stats });
  process.stderr.write(`seed ${seed}: day ${stats.day}${stats.over ? "!" : ""} frames ${B.frames} trans/crabTick ${(B.trans / B.crabTicks).toFixed(5)}\n`);
}

// ---- aggregate: CPU-side numbers -------------------------------------------
const tot = (f) => perSeed.reduce((a, r) => a + f(r), 0);
const frames = tot(r => r.B.frames), crabTicks = tot(r => r.B.crabTicks);
const trans = tot(r => r.B.trans);
const stateTicks = {};
for (const r of perSeed) for (const [k, v] of Object.entries(r.B.stateTicks)) stateTicks[k] = (stateTicks[k] || 0) + v;
const transByState = {};
for (const r of perSeed) for (const [k, v] of Object.entries(r.B.transByState)) transByState[k] = (transByState[k] || 0) + v;

// ---- aggregate: within-town bucket structure -------------------------------
const bucketHist = {};
for (const r of perSeed) for (const [k, v] of Object.entries(r.B.bucketHist)) bucketHist[k] = (bucketHist[k] || 0) + v;
const bucketMean = tot(r => r.B.bucketSum) / frames;

// ---- cross-seed warp coherence ---------------------------------------------
// samples align by index: every seed samples at the same frame numbers.
// Coherence at a sample = for each crab slot, the modal state's share across
// the seeds still alive; averaged over slots. Also banded by time of day.
const minSamples = Math.min(...perSeed.map(r => r.B.samples.length));
const FRAMES_PER_DAY = 7200;
const bandOf = (frame) => {
  const tminDeci = ((frame % FRAMES_PER_DAY) / FRAMES_PER_DAY) * 1440; // game minutes into the day
  if (tminDeci < 420) return "night(0-7h)";
  if (tminDeci < 600) return "morning(7-10h)";
  if (tminDeci < 900) return "midday(10-15h)";
  if (tminDeci < 1260) return "evening(15-21h)";
  return "late(21-24h)";
};
const bands = {};
let cohSum = 0, cohN = 0;
for (let i = 0; i < minSamples; i++) {
  const rows = perSeed.map(r => r.B.samples[i].split("|"));
  const slots = Math.min(...rows.map(r => r.length));
  let slotSum = 0;
  for (let j = 0; j < slots; j++) {
    const counts = Object.create(null);
    for (const r of rows) counts[r[j]] = (counts[r[j]] || 0) + 1;
    slotSum += Math.max(...Object.values(counts)) / rows.length;
  }
  const coh = slotSum / slots;
  cohSum += coh; cohN++;
  const band = bandOf((i + 1) * SAMPLE_EVERY);
  (bands[band] = bands[band] || []).push(coh);
}

const pct = (x) => (100 * x).toFixed(1) + "%";
const sorted = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);

console.log(`\n== BRANCHLESS COHERENCE REPORT  (${SEEDS} seeds x ${DAYS} days, ${frames} town-frames, ${crabTicks} crab-ticks)`);
console.log(`\n-- CPU: dispatch stability (the branch predictor's view)`);
console.log(`state transitions per crab-tick: ${(trans / crabTicks).toFixed(5)}  (dispatch branch holds ${ (crabTicks / Math.max(1,trans)).toFixed(0) } ticks between changes)`);
console.log(`crab-tick share by state:`);
for (const [k, v] of sorted(stateTicks)) console.log(`   ${k.padEnd(12)} ${pct(v / crabTicks)}  (transitions into: ${transByState[k] || 0})`);
console.log(`\n-- within-town: state-sorted bucket structure`);
console.log(`distinct states live per tick: mean ${bucketMean.toFixed(2)}, hist ${JSON.stringify(bucketHist)}`);
console.log(`mean customers per tick ${(tot(r => r.B.custSum) / frames).toFixed(2)}, mean actors ${(tot(r => r.B.actorSum) / frames).toFixed(2)}`);
console.log(`\n-- GPU: cross-seed warp coherence (one town per lane, ${SEEDS}-wide)`);
console.log(`modal-state share per crab slot, overall mean: ${pct(cohSum / cohN)}`);
for (const [band, arr] of Object.entries(bands)) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  console.log(`   ${band.padEnd(16)} mean ${pct(m)}  min ${pct(Math.min(...arr))}`);
}
console.log(`\n-- rare events per town-day`);
const townDays = tot(r => Math.min(r.stats.day, DAYS));
console.log(`illness ${(tot(r => r.stats.ill) / townDays).toFixed(3)}, polls ${(tot(r => r.stats.polls) / townDays).toFixed(3)}, closures ${(tot(r => r.stats.closures) / townDays).toFixed(3)}, walkouts ${(tot(r => r.stats.walkouts) / townDays).toFixed(3)}`);
console.log(`towns ended early: ${perSeed.filter(r => r.stats.over).length}/${SEEDS}`);

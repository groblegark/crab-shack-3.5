# CS3.5 PERFORMANCE PLAN (Ruling 8 executed as research, 2026-08-21)

*Three passes: a real CPU profile of the engine (two runs, cross-confirmed
to ~0.3pp), optimization candidates graded for fingerprint safety, and the
verification-pipeline design. Full reports: `cs35-research/perf-profile.md`,
`perf-optim.md`, `perf-pipeline.md`. All numbers measured under machine
contention — shares are trustworthy, absolute wall times are floors.*

## WHERE THE TIME GOES (measured)

game.js is **93%** of CPU; the harness costs ~5–7%. The engine runs 7200
`frame()` calls per sim-day (fixed dt 0.05s). The bill, by cluster:

| cluster | share | the actual cause |
|---|---|---|
| scheduling-derivation chain | **~25%** | `refreshDaysOff`'s memo is keyed on `time` (advances every frame) and rebuilds its roster-fingerprint STRING on every call before checking; the shift chain re-derives 4–6× per crab per frame |
| `collide` | **~16%** | `Math.hypot` computed for every pair BEFORE any cheap reject; furniture arrays freshly concat'd per biz per frame |
| frame bookkeeping | ~8% | 7200×/day dispatch; mostly irreducible |
| customers/visitors | ~7% | per-frame filter+sort per biz; a 5-string array literal allocated per visitor per frame |
| movement derivation | ~6% | `needDrag` allocates its `ramp` closure per call (1% by itself) |
| `allCrabs()` | ~3% | fresh concat array per call, 83 call sites |
| vm-global flag reads | ~3% | `window._failOff` etc. read in hot paths |

## THE OPTIMIZATION SHORTLIST (each proven byte-identical before landing)

| # | change | class | expected |
|---|---|---|---|
| 1 | rosterGen counter kills the sig rebuild (+ cached per-crab off-index) | YELLOW→GREEN after a 29-site audit (enumerated in the report) | **8–12%** |
| 2 | AABB early-out before `hypot` in collide (`hypot ≥ max(|a|,|b|)` vs ≤22px constants — pure skip) | GREEN | **5–8%** |
| 3 | cached `allCrabs()` (same counter as #1; preserves the live-array quirk) | GREEN | **2.5–3%** |
| 4 | hoist vm-global flags once per frame + lift the `ramp` closure | GREEN | **3–4%** |
| 5 | `bizShiftWindow` memo w/ lazy label + furniture/`BIZ_KEYS` hoists | GREEN | **3–5%** |

**Wave 1 combined: ~22–32% CPU ≈ 1.3–1.45× throughput.** Second wave
(per-crab shift memo, queue bucketing, cot-roster numeric memo, harness
step batching) adds ~6–10% more → ~1.5×.

**Explicitly forbidden (RED)**: `hypot`→`sqrt` (last-ulp float changes) and
typed-array state refactors (mass blast radius for single-digit upside).
All risk concentrates in the two generation counters — a missed mutation
site is exactly the bug class the frozen fingerprints catch.

## THE PIPELINE

- **Suite sharding** — suite.mjs gains `--jobs` via the same self-fork
  pool headless.mjs already uses; longest-first over a committed
  `tools/suite-timings.json`; parent prints in registration order
  (byte-identical output); `--jobs 1` stays the exact sequential path.
  Timing distribution is brutally heavy-tailed (top 10 scenarios = 49% of
  46 min): **12 workers → ~4 min local**, within 1% of the theoretical
  floor (the 232s growth giant). Don't split scenarios — measured as
  pointless until the giants shrink via engine opts.
- **GitHub Actions gate** (public repo = free): 6 suite shards (required
  checks) + 4 seed blocks. Baseline **0/16 is gated**; growth escape count
  is **annotated, never gated** (8-seed blocks are coins; the matrix
  measures the floor — auto-failing on growth noise trains people to
  ignore red). PR wall ≈ 6–8 min.
- **Fixture-start scenarios: measured verdict, DON'T.** 75% of suite time
  is trajectory assertions where the simmed days ARE the assertion; the
  fixture-eligible tail is ≤10% and falls off the critical path once
  sharded. Costs (fingerprint breakage, fixtures rotting into unreachable
  worlds) exceed the win. Revisit only if a mature-town scenario class
  appears, with regen-on-balance-change discipline.

## THE PARALLEL-HARDWARE LADDER (Matt's float, 2026-08-21, assessed)

The instinct — sims that run a lot belong on parallel hardware — is
industry-real (Madrona-class engines batch thousands of game-sim
instances on GPU). The assessment, recorded as a ladder:

1. **NOW — structural sim/view split with seam tests.** Already
   runtime-true (`window._headless` skips all draws; draws are ~0% of the
   headless bill); make it architectural: sim core as pure
   state-in/state-out, view as a reader, golden state→draw-call tests at
   the seam. Never wasted: it is the same seam the cultureway runtime
   needs, it flushes sim semantics hiding in view constants (lanes, queue
   slots, furniture x's — the world-art work wants those exposed anyway),
   and it would let the browser game run the sim in a Worker (real
   fast-forward, honest forecasting).
2. **SCHEDULED — the deterministic core rewrite.** (Was trigger-gated;
   owner override 2026-08-21: *"let's do that numeric rewrite too, im
   well excited about it."*) Fixed-point integer numerics, flat state,
   event codes instead of strings. Sequenced AFTER the MVP pig (steps
   3-4) and the rung-1 sim/view split, BEFORE foodways/civics — so the
   cultureway expression layer lands on deterministic ground instead of
   being ported to it later. Executed as a STRANGLER, one subsystem per
   slice with a deliberate fingerprint re-baseline and a matrix
   referee per slice (the payroll re-baseline discipline): money →
   integer cents first (the conservation audit becomes EXACT — a
   theorem, not a float comparison), then the clock, then
   movement/space, then the transcendental tail (hypot, pow(x,1.2),
   the ramps) via integer/table forms. Consequences accepted: every
   frozen fingerprint re-baselines once per slice, and Ruling 7's CS3
   ports validate behavior-equivalent rather than byte-equivalent after
   the boundary. Bonus the browser game keeps: cross-browser bit
   determinism (today's float sim can drift across JS engines on
   transcendentals). Design doc: cs35-numeric-core.md (research first).
3. **After the rewrite, CPU already wins.** The deterministic core
   compiles to WASM and runs perfectly reproducibly on every core
   available (80 free on Actions, hundreds rentable) — most of the
   practical parallelism arrives here.
4. **GPU as the BATCH-SCIENCE instrument — legitimized by the rewrite.**
   (Refined 2026-08-21 after Matt's push.) Two corrections to the naive
   model: a GPU "core" is a SIMD lane in a 32-wide lockstep warp, so
   one-sim-per-lane pays a 3-30× divergence discount on branchy agent
   code (a sim's ~tens-of-KB STATE fits fast memory; its 16k lines of
   branchy CODE are the hostile part); and our CPU wall is farther than
   it looks — one town fits a core's L2, so WASM sims are cache-resident
   and divergence-free per core. BUT: **integer ops are bit-exact on
   GPUs** — the determinism objection was a float objection, and the
   fixed-point rewrite dissolves it. Once the core is integer, sim
   behavior is a SPEC, and a WGSL port can be verified EQUAL to the JS
   core seed-by-seed by the suite — a second backend proven by equality,
   not a fork. The prize at 10k-sim batches is distribution-level
   science: eviction histograms, rare-event hunting, parameter heatmaps,
   evolutionary search over generated cultureways (CS4 validation at
   scale). Build it when that instrument earns its divergence discount —
   after rung 3 saturates.

Cheap parallelism runway before any of this: wave-1 opts 1.5×, sharding
12×, free Actions ~80 cores — orders of magnitude unexploited.

## EXECUTION ORDER

1. **Suite `--jobs` driver** (tools-only; queued behind step 2, which is
   editing suite.mjs) → 46 min becomes ~4–6.
2. **Actions workflow** → every push to cs35 self-verifies off-laptop.
3. **Opt wave 1** (the shortlist, one landing per optimization, each with
   full suite + 16-seed matrix byte-compare, uncontended).
4. **Opt wave 2** when wave 1 is proven.

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

## EXECUTION ORDER

1. **Suite `--jobs` driver** (tools-only; queued behind step 2, which is
   editing suite.mjs) → 46 min becomes ~4–6.
2. **Actions workflow** → every push to cs35 self-verifies off-laptop.
3. **Opt wave 1** (the shortlist, one landing per optimization, each with
   full suite + 16-seed matrix byte-compare, uncontended).
4. **Opt wave 2** when wave 1 is proven.

# Verification-pipeline options — CS3.5 (242-scenario suite, 46.0 min sequential)

**Timing caveat (applies throughout):** the baseline log and my spot measurements were taken while a fleet suite + a worktree suite were running on this machine. Absolute ms are inflated by contention; *relative shares, distribution shape, and LPT ratios remain valid*. Re-baseline on a quiet machine before publishing numbers.

## 0. Measured facts (mined from `cs35-baseline.log`, verified against source)

- 242 scenarios, **2758s total**. Distribution is brutally heavy-tailed: min/med/p90/p99/max = 4ms / 2.26s / 23.8s / 150.6s / **232.3s**. Top 1 = 8.4%, top 10 = **49.1%** (1353s), top 40 = 81.1%. Buckets: 66 scenarios <1s (17s total), 105 at 1–5s (257s), 42 at 5–20s (423s), 19 at 20–60s (709s), 10 at >60s (1353s).
- **LPT (longest-first) theoretical wall**: W=4 → **11.5 min**, W=8 → **5.7 min**, W=12 → **3.9 min**, W=16 → 3.9 min (floor = the 232s `growth strategy` scenario; W=12 is already within 1% of ideal, W=16 buys nothing).
- Even if the top multi-seed giants were split per-seed (growth=4 seeds, ferry=5 runs, baseline=6, credit=6, etc. — read from their `for (const seed of [...])` loops), the floor only drops to `rivalry: after a refusal…` (229.7s, **one long single-sim, unsplittable**), so W=12 stays ~3.8 min. **Conclusion: scenario-granular sharding is sufficient; don't split scenarios.**
- Per-sim costs (measured, contaminated): vm boot (5 game files) **12ms**, fresh start → day-2 noon **~0.7s**, ~0.7s/sim-day early game. Suite process RSS ~250MB; 12 workers ≈ 3GB on this 18-core/24GB machine — trivially fine.
- Parallelism is provably behavior-identical: RNG is seeded **per `createSim`** (`mulberry32(seed)` into the vm's `Math`, simlib.mjs:32–33), never process-global; scenarios share no mutable module state (per-scenario `Map` stores; `PIG_FIXTURE` is read-only). Process-level sharding cannot perturb draw order → frozen fingerprints safe by construction.

## 1. Suite sharding

Runner today (suite.mjs:8–9, 10278–10291): `scenario(name, fn)` pushes to `results[]` in file order; argv substrings filter by `name.includes(f)`; per-scenario try/catch; `process.exit(fail ? 1 : 0)`.

- **(a) Self-fork driver with a dynamic queue — RECOMMENDED.** Mirror `headless.mjs` exactly (its `--_worker` self-fork + `runParallel` pool, headless.mjs:236–266, is the house precedent). suite.mjs gains `--jobs N` and an internal `--_run <indexList>` worker mode: parent sorts scenario indices longest-first from a committed `tools/suite-timings.json` (regenerated from any full log; unknown names get the 2.3s median), forks a pool of N children over stable registration indices (index selection, not name substrings — substrings over-match, e.g. `credit:` hits 4 scenarios), each child sends `{idx, pass, msg, ms}` over IPC, parent buffers and prints in **registration order** (byte-identical to today's sequential output) and exits `fail ? 1 : 0`. Dynamic queue makes stale timings harmless — order only affects efficiency, never correctness. `--jobs 1` keeps the exact sequential path. ~60–80 lines, all in tools/ (harness, not game logic — contract-clean).
- **(b) worker_threads.** Works (vm contexts are thread-legal) but: one shared process heap accumulating 242 vm contexts risks old-space pressure, no crash isolation (one scenario segfaulting kills the suite instead of one shard), and it breaks the house pattern. Reject.
- **(c) External shard driver spawning `node tools/suite.mjs <filters>` per shard.** Zero changes to suite.mjs, but name-substring filters can't express a precise partition (overlap/gap risk as names evolve), static partitions lose ~nothing today but drift as timings change, and per-shard output interleaving needs a wrapper anyway. Acceptable fallback if suite.mjs must stay untouched; strictly worse than (a).

**Expected local wall with (a): `--jobs 12` → ~4 min** (vs 46); `--jobs 8` → ~5.7 min. Overhead added: 12ms boot × extra processes ≈ nothing.

## 2. GitHub Actions gate (public repo → free, unlimited minutes)

Verified current facts: public-repo `ubuntu-latest` = **4 vCPU / 16GB RAM / 14GB SSD**; free plan = **20 concurrent jobs** (5 macOS); **6h per-job limit**; 256 jobs max per matrix; free & unlimited minutes for public repos. Sources: [GitHub Actions limits (docs)](https://docs.github.com/en/actions/reference/limits), [runner image guide 2026](https://tenki.cloud/blog/github-actions-runner-image-selection-2026), [free-tier explainer](https://cicdcalculator.com/github-actions-free-tier), [usage/billing docs](https://docs.github.com/en/actions/reference/usage-limits-billing-and-administration).

Sketch (`.github/workflows/gate.yml`, one workflow, two matrices, both needing only `actions/checkout` + system node — no deps, no build step):

- **suite jobs**: `strategy.matrix.shard: [0..5]` (6 jobs) — each runs `node tools/suite.mjs --jobs 4 --shard $i/6` where the driver from §1 LPT-partitions indices into 6 static buckets by committed timings, then runs its bucket with a 4-worker dynamic pool (4 vCPU). Effective 24 workers → compute ≈ max(232s giant, 2758/24=115s) ≈ **4–5 min + ~1 min checkout/setup ≈ 5–6 min**. (Runner single-core speed vs this contended Mac is a wash; measure once and rebalance the bucket count.)
- **seeds jobs**: `matrix.block: [baseline-0, baseline-8, growth-0, growth-8]` (4 jobs) — each `node tools/headless.mjs --days 30/40 --seeds 8 [--seedbase 8] [--buy chef,table] --jobs 4 --quiet`. 8 seeds × 30–40 days at ~5 d/s on 4 workers ≈ **3–6 min/job**. A tiny final job parses `>> survived S/16` across blocks.
- Total: 10 jobs, well under the 20-job concurrency cap (headroom for two PRs), PR wall ≈ **6–8 min**.
- **What gates the PR**: the 6 suite shards are *required checks* (exit-code). The seeds jobs gate only the hard pillar — **baseline survivors == 0/16 fails the check**; growth 16-seed escape count is posted as a non-blocking annotation/summary, NOT gated (CLAUDE.md: 8-seed blocks are coins, 2/16 is intended difficulty, and the matrix "measures the FLOOR" — auto-failing on growth noise would train people to ignore red). Note the RWX lesson from ops memory applies here in reverse: GitHub required checks DO block merge and DO notify, which is the whole point of moving the gate here.

## 3. Fixture-start scenarios — **measured verdict: don't**

- Mechanics would be sound: saves are validated envelopes (`saveProblem` game.js:6023–6032, the only validator; `readSlotEnv` gates every read; migrations run inside `load()` per pig-spec-anchors.md §12), simlib already supports `createSim({storage: store, fresh: false})`, and ~10 scenarios already hand-build envelopes this way (cultureways, slots, laundromat migration). A fixture = a committed envelope JSON + regen script.
- **But the time isn't where fixtures can reach.** The top-10 (1353s, 49%) and most of the 20–60s bucket (709s, 26%) are *trajectory assertions* — lose-by-default rates over 30 days, growth escapes over 40, ferry unreachability over 25, credit warnings, wallet bands, disease incidence: **the simmed days ARE the assertion**; a fixture start would assert a different (and unreachable-by-construction) claim. Fixture-eligible scenarios are mechanic probes with 1–3 day warm-ups (~0.7s to day-2 + 0.7s/day): generously, ~100 scenarios × 1–3s ≈ **200–400s ≈ 4–6 min of the 46 sequential**, i.e. ≤10%. **After sharding, that saving falls entirely off the critical path** (the 230s rivalry/growth giants), moving parallel wall-clock by ~0.
- Costs are real: each converted scenario changes its RNG draw sequence → its frozen fingerprint breaks and every numeric bar needs re-validation; and fixtures rot *semantically* — `load()` migrates the format forever, but a balance change makes the committed "day-10 town" a state no real playthrough produces, so the suite silently starts certifying unreachable worlds. That's exactly the dishonest-measurement failure mode CLAUDE.md's suite discipline exists to prevent.
- Legit future niche: if late-game content (cultureway-era, day-30+ towns) spawns a scenario *class* needing expensive mature-state setup, adopt one shared fixture + a `make-fixtures` regen script that replays from fresh and is re-run (and re-committed) on any balance-touching MR. Not this week.

## Recommended pipeline

| Stage | Build | Suite wall |
|---|---|---|
| now | — | 46 min sequential (contended) |
| **this week #1** | §1(a): suite.mjs `--jobs` self-fork driver + `tools/suite-timings.json` regen script; verify merged output is byte-identical to a sequential run on one quiet pass | **~5.7 min local @ 8 jobs, ~4 min @ 12** |
| **this week #2** | §2 workflow: 6 suite shards (required) + 4 seed blocks (baseline 0/16 gated, growth annotated); calibrate shard count from the first real runner timings | **~6–8 min per PR, free** |
| later (unblocks profiling) | re-baseline timings on quiet hardware; then the profile → targeted-opts steps of Ruling 8 shrink the two 230s giants — the only path below ~4 min wall | <4 min as giants shrink |
| later / on-demand | fixtures only if a mature-town scenario class appears (with regen-on-balance-change discipline) | ~0 effect on parallel wall |

Scratch artifacts: `/private/tmp/claude-501/-Users-matthewbaker/7acebd22-01d4-4779-a887-dac1e934e598/scratchpad/lpt-split.mjs` (LPT model); log at `.../scratchpad/cs35-baseline.log`. Key sources read: `/Users/matthewbaker/crab-shack-3.5/tools/suite.mjs` (:8–9, :10278–91), `tools/headless.mjs` (:236–266 fork pool), `tools/simlib.mjs`, `design/cs35-research/pig-spec-anchors.md` (§12–13).
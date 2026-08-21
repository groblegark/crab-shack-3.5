Both profiles parsed and hot regions read. Composing the final analysis.

---

## CRAB SHACK 3.5 — REAL-ENGINE CPU PROFILE (2026-08-21)

**Runs** (both single-process, `--cpu-prof`, profiles in scratchpad `prof-headless/` and `prof-suite/`):
- A: `node --cpu-prof tools/headless.mjs --days 10 --seeds 2 --jobs 1` → 20 sim-days in 13.82s wall (12,060 samples). With `JOBS<=1` headless.mjs runs `seedList.map(runOnce)` in-process — no forking, profile captures the sim directly.
- B: `node --cpu-prof tools/suite.mjs "baseline loses"` → PASS in 45.2s (39,135 samples); scenario = 6 seeds × `runDays(30)`, most towns evicted ~day 11.

**CONTENTION CAVEAT**: a fleet suite + a worktree suite were running concurrently; `/usr/bin/time` shows user > real (17.2s vs 13.9s run A; 55.7s vs 45.3s run B) — wall timings are contaminated and carry --cpu-prof overhead. Measured throughput: **run A ≈ 1.45 sim-days/sec, run B ≈ ~1.9 sim-days/sec** vs the ~5-10/sec uncontended baseline — treat absolute d/s as a floor. **Per-function CPU shares remain valid**, and the two independent runs agree on every entry to within ~0.3pp, so the shape is trustworthy.

**Category rollup (self time)** — run B / run A: game.js **93.2% / 91.5%**, node internals 3.0/4.0%, harness stepScript ("other") 2.0/2.5%, vm/program 0.9/0.7%, explicit GC 0.8/1.1%, tools 0.1/0.2%, ppu/sprites ~0%. The harness costs ~5-7% total; the game is the whole bill.

### TOP-25 SELF-TIME (run B primary; run A self% as confirmation)

| # | function | loc | self% B | cum% B | self% A | bucket |
|---|---|---|---|---|---|---|
| 1 | collide | game.js:6813 | 16.2 | 16.8 | 15.8 | game |
| 2 | frame | game.js:15224 | 8.1 | 93.0 | 7.4 | game |
| 3 | refreshDaysOff | game.js:4008 | 6.1 | 9.2 | 6.1 | game |
| 4 | coveringToday | game.js:4047 | 3.3 | 11.5 | 3.3 | game |
| 5 | updateCustomers | game.js:9788 | 3.3 | 10.4 | 3.3 | game |
| 6 | allCrabs | game.js:5068 | 3.0 | 3.0 | 3.1 | game |
| 7 | dayOffIdx | game.js:4038 | 2.9 | 6.6 | 3.0 | game |
| 8 | updateSchedule | game.js:7177 | 2.7 | 30.6 | 2.8 | game |
| 9 | needDrag | game.js:5792 | 2.6 | 3.7 | 2.5 | game |
| 10 | visTick | game.js:9611 | 2.3 | 2.8 | 2.0 | game |
| 11 | effShift | game.js:4197 | 2.2 | 16.8 | 2.1 | game |
| 12 | bizShiftWindow | game.js:4091 | 2.2 | 2.3 | 2.1 | game |
| 13 | (anonymous) stepScript | evalmachine:1 | 2.0 | 95.1 | 2.5 | harness |
| 14 | patOff | game.js:5279 | 1.8 | 1.8 | 1.7 | game |
| 15 | offToday | game.js:4046 | 1.7 | 8.4 | 1.7 | game |
| 16 | updateHome | game.js:5621 | 1.6 | 8.0 | 1.6 | game |
| 17 | heatShimmer | game.js:5806 | 1.5 | 1.5 | 1.5 | game |
| 18 | dutyShift | game.js:4105 | 1.4 | 15.5 | 1.5 | game |
| 19 | visStep | game.js:9602 | 1.2 | 1.2 | 1.3 | game |
| 20 | crabMove | game.js:5811 | 1.1 | 6.4 | 1.2 | game |
| 21 | cotRoster | game.js:3548 | 1.0 | 1.3 | 0.9 | game |
| 22 | commuteGmin | game.js:6735 | 1.0 | 3.7 | 1.0 | game |
| 23 | leaveGmin | game.js:6741 | 1.0 | 12.1 | 0.9 | game |
| 24 | updateKitchen | game.js:8432 | 1.0 | 4.3 | 0.8 | game |
| 25 | ramp (closure in needDrag) | game.js:5795 | 1.0 | 1.0 | 0.9 | game |

Near-misses: runChatter 5514 (0.9), Script node:vm:86 (0.9), homeSpot 5604 (0.9), (program) (0.9), awayToday 5347 (0.9), (garbage collector) (0.8-1.1), updateStuck/maybeQuip below that. Run A ordering is identical ±2 places.

### Frame-stepping facts (both harnesses identical)
Headless drives `rafCb` with `simNow += 50ms` per tick (headless.mjs:149 STEP=0.05; simlib.mjs:61 step=50 default). In `frame()` (game.js:15242-15245): `raw = clamp((now-last)/1000, 0, 0.1) = 0.05s`; `dt = raw * TURBO * (ffSleep ? 6 : FF_SPEED[ffMode])`. Headless: TURBO=1 (parsed from `location.search`, which is `"?fresh"`, game.js:6018), ffMode=0, and ffSleep can only be set by UI input (game.js:10756) — so **dt = 0.05 sim-sec/frame, always**. `tmin += dt*TS` with TS=4 game-min/real-sec (game.js:3970) → 0.2 game-min per frame → **7200 frame() calls per sim-day**, all-night included. Headless skips ALL rendering via the early return at game.js:15748 (`if (window._headless) { requestAnimationFrame(frame); return; }`) — collide at 15747 is the last thing that runs; ppu/sprites are ~0% as expected. Run A = 144,000 frames in 13.8s ≈ 10.4k frames/s.

### Per-hot-spot cause analysis

**1. collide (16%, game.js:6813-6884)** — three stacked per-frame passes, 7200×/day including overnight while everyone is asleep: (a) O(n²) pairwise over all crabs (crew+NPCs, ~10-14 bodies ≈ 50-90 pairs) with `Math.hypot` computed BEFORE any cheap AABB reject (the `d < 12` and `d < 12+BERTH_PX` tests come after the sqrt — an `|dx| > 22` early-out would skip most pairs); (b) furniture pass: for every unlocked biz, `(bizTables(bizKey)||[]).concat(BIZ[bizKey].stalls||[])` — **fresh concat array per biz per frame** — × every body; (c) stations pass: biz × station-kind × station × body triple loop. Plus a fresh `bodies` array per frame. It is the classic candidate for a coarse x-sort/sweep or grid, plus hoisting the furniture arrays.

**2. The scheduling-derivation chain (≈25% aggregate self — the real #1)** — rows 3,4,7,8,11,12,15,18,22,23 + awayToday are one cluster. `refreshDaysOff` (game.js:4008) memoizes on `_offStamp === time` — `time` advances every frame, so the memo lives ONE frame — but worse, the fingerprint `const sig = allCrabs().map(k => k.p.name + "|" + k.p.job).join(",")` (line 4018) is built on **every call before the memo check**: allCrabs() concat + ~12 string concats + a join, and the function is reached via `dayOffIdx`/`offToday`/`coveringToday`/`dutyShift`/`effShift` roughly 4-6× per crab per frame (updateSchedule calls effShift, awayToday, leaveGmin→effShift again, dutyShift again in the working branch). So ~50+ sig builds/frame × 7200 frames/day, plus one full rebuild per frame (per-biz roster `.sort()` at 4025). `bizShiftWindow` (4091) allocates a `{start,end}` object AND formats `w.label = fmtHr(...)+"-"+fmtHr(...)` on every call even though almost no caller reads label. `dayOffIdx` builds the `name+"|"+job` key string per lookup. Fix shape: key the memo on frame/day instead of comparing a rebuilt string sig (or rebuild sig only when the roster mutates), and cache per-crab shift windows per day — all behavior-identical since none of this touches RNG.

**3. frame self (8%, game.js:15224)** — not one loop but 7200×/day bookkeeping: a dozen timer decrements (15246-15256), the day-rollover branch, the per-crab dispatch loop at 15704-15726 (its `for (const c of allCrabs())` concat, `c.animT`/`_stepped` writes, the dayState if-chain), follow-cam and toast logic that headless never needs but the contract forbids skipping. Mostly irreducible dispatch cost; the allCrabs() in the loop header is one more per-frame allocation.

**4. allCrabs (3.0% self, game.js:5068)** — `npcs.length ? crabs.concat(npcs) : crabs`: a fresh ~12-element array **per call**, 83 static call sites, called many times per frame (collide, frame loop, refreshDaysOff×2, cotRoster, runChatter, houseOccupant...). Pure allocation churn; a dirty-flag-invalidated cached array would be behavior-identical.

**5. updateCustomers cluster (self 3.3 + visTick 2.3 + visStep 1.2 ≈ 7%, game.js:9788)** — per frame: `qslot = new Map()` rebuilt, and `queueOrder(b)` per biz = `customers.filter(...)` + `.sort()` fresh arrays per biz per frame (9762-9766); then a full customers loop. `visTick` (9611) runs for every visitor every frame and its needs loop `for (const n of ["hunger","thirst","dirt","bored","tired"])` (9635) allocates that 5-string array literal per visitor per frame.

**6. Movement-speed derivation (needDrag 2.6 + ramp 1.0 + heatShimmer 1.5 + crabMove 1.1 ≈ 6%)** — `crabMove` (5811) is recomputed per crab per moving frame; `needDrag` (5792) allocates the `ramp` arrow-closure per call (it shows up as its own 1% profile entry at 5795) and reads `window._noNeedDrag`/`window._noSelfCareExempt` — sandbox-global reads — per call; `heatShimmer` (5806) does a `Math.sin` per crab per frame plus a `window._noShimmer` read. `patOff` (5279, 1.8%) is the same story: `!!(window._failOff && ...)` at five gates per crab per frame — 1.8% of the whole game spent re-asking the vm global whether a measurement hatch nobody set is on. Hoisting these window reads once per frame would be behavior-identical.

**7. updateHome/homeSpot/cotRoster (≈3.5%, game.js:5621/5604/3548)** — `homeSpot` allocates a fresh `{x,y}` per call; `cotRoster` memoizes on `time + ":" + n` — again a one-frame memo with a string key built per call, rebuilding Map+filter+sort each frame, and `cotRank` is `roll.indexOf(c)` (O(n) scan) per query.

### GC / allocation observations
Explicit "(garbage collector)" frames are only 0.8-1.1% self — the allocation tax is paid mostly inline, in the allocators themselves: allCrabs concat (~83 sites), the refreshDaysOff sig string (~50+/frame), bizShiftWindow object+label string, needDrag closures, visTick's array literal, queueOrder filter+sort arrays, collide's bodies+furniture-concat arrays, homeSpot/effShift object literals, cotRoster key strings. These are all scavenger-friendly young-gen garbage, hence cheap GC but high steady-state allocation-and-string cost. Harness overhead: stepScript (evalmachine:1) 2.0-2.5% + `Script`/`runInContext` node:vm ~1.5-2% + (program) ~1% — one vm Script invocation per 50ms tick (144k invocations in run A); batching N steps per Script would shave this but is tools-side.

### Where the time actually goes
~92-93% of all CPU is the real engine under `frame()`, split into three masses of comparable size and one long tail: (1) **the O(n²)+furniture collider** (~16-17%) doing sqrt-first proximity tests and re-concatenating furniture lists 7200 times a sim-day, all night long; (2) **the day-off/shift derivation chain** (~25% in aggregate — the largest single target), which recomputes `refreshDaysOff`'s string-fingerprint memo and re-derives shift windows (fresh objects, formatted labels) 4-6 times per crab per frame because every memo in the game is keyed on `time`, which changes every frame; (3) **per-crab/per-visitor tick work** (~15%: dispatch loop, customers/queues, needs/speed derivations) that is mostly honest simulation but leaks steady allocations (allCrabs concat, per-call closures, per-call array literals) and re-reads vm-global hatch flags (`window._failOff` alone = 1.8%) at five gates per crab per frame. GC proper is ~1%; the harness is ~5-7%. The cheapest behavior-identical wins, in order: make refreshDaysOff/cotRoster memo keys frame-stamped instead of rebuilt-string compares, cache allCrabs behind a dirty flag, add an |dx| early-out and hoisted furniture arrays to collide, hoist window-flag reads to per-frame constants, and stop formatting shift labels nobody reads — none of these touch RNG draw order or float op order, so the frozen fingerprints should survive; anything that reorders pair iteration or changes push math in collide is off-limits.

Artifacts: profiles at `/private/tmp/claude-501/-Users-matthewbaker/7acebd22-01d4-4779-a887-dac1e934e598/scratchpad/prof-headless/CPU.20260821.113607.83243.0.001.cpuprofile` and `.../prof-suite/CPU.20260821.113629.83272.0.001.cpuprofile`; parser at `.../scratchpad/parseprof.mjs` (usage: `node parseprof.mjs <file> [topN]`).
# KERNEL PHASE 6 — the map, and an honest inversion (2026-08-22)

**Phase 5's close-out recommended schedule+kitchen as the next port. The
map work says: not yet, and maybe not ever on ROI grounds.** This file is
the phase-3-pattern map (surface enumerated before a line of C), plus the
measurement that inverted the recommendation.

## The measurement

Kernel-armed main-realm profile on this tree (4 sim-days, seed 1337;
machine at load 14–32, 383 ticks — treat shares as coarse): the whole JS
side is 31% of ticks and FLAT. The leaders: `updateSchedule` 1.6% self,
collide's JS glue 2.9% (marshalling + the memo checks), `refreshDaysOff`
residue 1.0%, `needDragQ12`+`crabMoveQ8` 2.4%, `updateKitchen` 0.5%.
Phase 1's 14.1% "simTown dispatch self" has dissolved as units moved to
C — `simTown` reads 0.5% here. Nothing in JS is above ~3%.

64.8% of ticks land C++-side, dominated by one bogus v8_inspector symbol —
the same misattribution the very first shard-86 `sample` showed: on macOS,
JIT/wasm frames symbolize to the nearest C++ symbol. With the kernel armed,
that bucket IS the compiled sim plus V8's own machinery. The compiled side
is now the majority of the bill, which is the whole point of the ladder —
and it means further JS-side ports buy single-digit percentages.

## The kitchen/schedule surface (enumerated for whenever the hoist wants it)

Read end to end this phase. `updateKitchen` per idle/working crab touches:
the microsleep (RNG naps: two draws, quip strings), `crabEffQ12`/hustle
(exact rationals, portable), the claim scan (customers filter + the
local-jumps-the-line rule + `messyTable`/busing dispatch + `pickSeat` —
writes the phase-5 furniture planes, so THIS half is now unblocked), the
wander-off (RNG draws, `wanderSpot`, `crabs.indexOf(c)` idle spots — an
ARRAY-POSITION-dependent input), `routedStep` (the routing layer above the
kernel's stepTo), the slot machinery (`tryAcquire`/release, shared with
errands town-wide), `sourceSpot`, money doors (`ownerFunds`/`debitBiz`/
`consumeIngredient`), `serve()`/`payAndBenefit` (tip math + benefits), and
`effShift`/`dutyShift`/`pendingOff` (the schedule chain). `updateSchedule`
additionally owns dayState dispatch, commutes, day-off logic, and the
shelter/housing interactions.

Port unit if ever taken: the whole crab-work half (kitchen + serve +
slots + routedStep's decision layer), with crab persona residency
(needs are already int, they need PLANES), the slot machinery ID-ized
like phase 5's furniture, and `crabs.indexOf` replaced by a stable
roster-position plane IN THE SAME LANDING (risky-decision 5: it feeds
idle-spot geometry). Estimated 2,000+ lines of C against ≤6% measured
self-time. **That ratio is the inversion.**

## The recommendation, re-ordered

1. **Quiet-box remeasure** of absolutes (single-core chain, all-cores,
   on/off ratio) — every number since phase 4 is neighbour-degraded and
   the next decisions read absolutes.
2. **The batch instrument beats more porting**: at ~86% multi-core scaling
   the cheap multiple is CORES on the science workload (the perf plan's
   own runway note), and the kernel-side majority makes per-town cost
   mostly compiled already.
3. The schedule+kitchen port only as a HOIST-ENABLER, and only if a quiet
   profile shows the dispatch+machines residue actually paying for it.
   The hoist's phase-1 justification (14.1% dispatch self) no longer
   holds on this tree (0.5%).

## What phase 6 landed instead

Nothing in game.js — by the map's own verdict. The map, the profile
receipt (`/tmp` profile summarized above; conditions recorded), and the
inversion are the deliverable, per the phase-3 precedent that a map which
says "stop" is worth as much as one that says "go".

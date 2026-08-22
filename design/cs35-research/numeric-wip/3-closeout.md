# numeric slice 3 (needs -> Q20) — STATE OF PLAY, NOT A LANDING

**SLICE 3 IS NOT LANDED.** The conversion is done and every commit is on
`cs35-numeric-s01`, but the suite is **251/254** and the frozen day-2
fingerprint moved **16 behavior-shaped fields with none rounding-shaped**,
which the protocol does not let anyone wave through. Do not merge, and do
NOT re-point the pins — a re-baseline taken over an untraced cascade
launders it in permanently. This file is the handoff.

## What IS converted and holding

Every 0..1 need (hunger/thirst/dirt/bored/tired) is an int 0..2^20. The unit
`Q20` and the authoring boundary `qn(f) = round(f * Q20)` sit at the top of
game.js beside GMIN. Authored fractions cross at their READ site exactly as
slice 1's author-dollar tables cross x100; what the sim STORES and computes on
is integers.

Converted: the visitor per-tick accrual; the crab event bumps; the sleep, nap
and hotel-bed drains as exact rationals (bed 0.30/gh is `t*dtT/1000`, cot
0.10/gh `t*dtT/3000`, nap 0.24/gh `t*dtT/1250`, and each FLOORS the amount
REMOVED so a rounding never invents rest that was not slept); every threshold
constant; the persona seeds; the visitor mint (same draws, same order, bounded
ints); `crabEff`'s two ramps; the tip product's charm multiplier; both errand
scores; the need bars and dossiers; and a staged `needsEnvelope` migration on
the same `_num` counter cents and ticks use (SAVE_VER 3; the legacy `sandy`
field crosses on this stage or a legacy town wakes at 1e-6 tired).

**The matrix is healthy and that is the strongest evidence the conversion is
sound.** Baseline `--days 30 --seeds 16`: **0/16 exact, median 12** — slice 2's
floor to the day — and the aggregates land back on slice 2's values after the
room-score fix below (roomLets 1159 vs 1159, unhoused 507 vs 485, hotelier
14/16 vs 15/16, lifetime $56,320 vs $56,063, purse $18,182 vs $19,220).

## THE ROUNDING MEASUREMENT (the question slice 2 left open) — ANSWERED

Per-tick accrual constants are baked with **round-half-up, NOT floor**, and
this is the decision in this slice most worth carrying forward. At 300 ticks a
game hour, from the authored per-hour rates:

| need | exact q20/tick | floor | error | nearest | error |
|---|---|---|---|---|---|
| hunger | 401.954 | 401 | −0.237% | **402** | +0.011% |
| thirst | 192.239 | 192 | −0.124% | **192** | −0.124% |
| dirt | 314.573 | 314 | −0.182% | **315** | +0.136% |
| bored | 157.286 | 157 | −0.182% | **157** | −0.182% |
| tired | 167.772 | 167 | −0.460% | **168** | +0.136% |
| **total** | | | **−1.19%** | | **−0.02%** |

**Flooring runs all five rates slow, every one in the same direction: needs
accrue 1.19% slower, which is a quietly easier town bought by arithmetic —
provable from the constants alone, no seeds, no chaos, no argument about
noise.** Nearest lands at −0.02% with mixed signs. The format table's own
worked example (0.115/hr -> 402) is the nearest value, not the floor, and the
contract permits round-half-up at a named unit boundary, which a
per-hour-to-per-tick rate bake is.

This is the cumulative-erosion trap in arithmetic form. **Every later slice
that bakes a rate should run this two-column table before choosing, and say
which it chose.**

## SIX REAL BUGS THIS CONVERSION FOUND

1. **`BORED_YIELD` stayed a float** — compared against a need, so it fired for
   ANY nonzero Q20 value and no crab chatted or played ball again.
2. **`_dragRamp`'s span went negative** — `(v - at) / (1 - at)` with `at` in
   Q20. The trudge multiplier became nonsense and the whole sim ran 2.5x
   slower in wall time (suite 108s -> 406s), which is how it was noticed.
3. **`needLevel` returned two units** — Q20 for a real need, a 0..1 float for a
   vote — and the errand score ADDED it to a rank of 1..4, so a converted need
   swamped the ranking outright.
4. **The room candidate never got the new unit.** Every other visitor candidate
   scores `RANK * Q20 + need`; the room stayed on the old scale, so a bed
   scored a millionth of a taco and could never win. Room lets halved, unhoused
   doubled and the hotelier stopped arriving in 13 towns of 16. **The MATRIX
   caught this, not the suite** — the scenarios were green while the town
   quietly stopped renting rooms.
5. **`tiredCap`** in the hours policy, and **`VIS_WANT`** on the visitor path:
   the same float-threshold-vs-Q20 bug, found last because nothing else reads
   them.
6. **A test asserting a coincidence.** The pot's cost check computed `3 * ing`
   from ONE sample of a price that MOVES with the larder (trade.price with a
   catch, FISH_IMPORT without), so a pot cooked across an empty larder books
   three different prices. Staged the catch so it measures the rule; mutation-
   tested (with the shack no longer buying the fish it fails on the mechanism).

Same lesson as 1a's founding tills and 2a's hidden timers, one rung out: **in a
unit conversion the dangerous value is the one that never looked like it had a
unit** — and a bare threshold constant is exactly that. Bug 4 adds a second:
**when a scoring function changes units, every branch that produces a score
must change with it**, including the ones that return a bare sentinel like 99.

## WHAT IS STILL WRONG — the handoff

Suite **251/254**:

- **`hours: defaults are behavior-identical` (the frozen day-2 fingerprint).**
  `tools/fpdiff.mjs --money-tol 1 --pos-tol 0.1` reads **16 behavior-shaped, 0
  rounding-shaped**: catch 3->1, serves 39->36, and the three fishers swap
  ends of the promenade (SALTY x 2072->450, KELP x 646->2072). A quantized
  need crossing its threshold one tick early re-picks an errand, and errands
  are where crabs are, so a cascade is PLAUSIBLE — but the protocol requires
  each move traced to a named crossing, and none of this is traced yet. **That
  trace is the next job**, and it should be done before anything else here:
  the two failures below may fall out of the same cause.
- **`crew shopped on their day off` — only 2 of 4.** A day-off shopping trip is
  errand-picked, so it is downstream of the same scoring change as bug 3/4.
- **`taps: nobody is left parched for a week`** — SUDSY (seed 17) spends 26% of
  her life on the dehydration line against a 25% gate. Note the direction:
  thirst accrues 0.124% SLOWER post-slice, so the rate is not the cause and
  this is trajectory, not accrual. The scenario's own comment names
  DRAG_THIRST_AT as the knob — **do not turn it.** It is a welfare probe on one
  owner-operator in one seed and it wants a cause, not a tune.

## WHAT IS NOT DONE

No conservation soak, no growth matrix, no receipted re-baseline, no refreshed
cross-engine receipt, and no SLICE LEDGER row — the ledger still reads "3-6 not
started", because slice 3 has not earned its row. The baseline matrix above WAS
run and is clean; it is the only gate item that passed.

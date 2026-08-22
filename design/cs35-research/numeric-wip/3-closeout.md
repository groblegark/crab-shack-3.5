# numeric slice 3 (needs -> Q20) — CLOSED

**Suite 254/254, exit 0.** One landing, one re-baseline — taken only after
the cascade's HEAD was traced to a single named crossing (below), which is
the first re-baseline on this ladder to carry a mechanical cause rather than
a shape argument.

## THE GATE, all of it

- Suite **254/254 exit 0** (3-suite-run18.txt).
- Conservation soak: **247 fund movements over three 30-day seeds, every one
  `delta === want` EXACTLY**, doors take/remit/pay all exercised (3-soak.txt).
- Baseline `--days 30 --seeds 16`: **0/16 exact, median 12** — slice 2a's
  floor to the day. Growth `--days 40 --seeds 16 --buy chef,table`: **4/16**,
  also identical to slices 1 and 2a. Aggregates back on slice 2a's line:
  lifetime $56,320 (2a: $56,063), purse $18,182 (2a: $19,220), roomLets 1159
  (2a: 1159), unhoused 507 (2a: 485), hotelier 14/16 (2a: 15/16).
- Fingerprint re-baseline: **seed 4242 is BYTE-IDENTICAL** — untouched by the
  whole slice. Seed 1337 moved 16 fields, none rounding-shaped, and the
  shadow-harness trace names the head (below); the pin carries the receipt.
- Cross-engine: **both seeds bit-identical under JavaScriptCore** on the
  final tree (3-crossengine.txt).
- Mutations: the dehydration re-point bites (TAP_QUENCH 0.02 fails loudly),
  the pot-larder staging bites (a free fish fails on the mechanism), and the
  day-off failure needed no relaxation at all — it was fixture bug #7.

## THE TRACED CROSSING (the re-baseline's head)

Day 1, 13:53, seed 1337: visitor V2 thinks. Float tree: dirt **0.4497** <
0.45 → one candidate (food), one recipe draw. Q20 tree: dirt **471,859 =
exactly qn(0.45)** → `dirt >= VIS_WANT.clean` fires → two candidates, two
draws. The DECISION is identical — food outranks clean either way — but the
clean candidate's conditional recipe draw advances the shared RNG stream by
one, and at the 13:00 sailing `ferryBatch` reads a shifted u32 and rounds 3
passengers down to 2. One fewer day-1 tourist is the entire 16-field drift.
The crossing's cause is the documented nearest-rounding residual itself:
dirt's per-tick rate 315 runs +0.136% fast and had accrued about one tick's
extra dirt by 13:53. Mechanically explained end-to-end: rate residual →
threshold crossing one think-slot early → conditional draw → stream shift →
batch rounding → cascade. The trace tooling was the slice-0 shadow-harness
pattern (decision log → per-tick discrete digest → per-tick draw count →
draw-site stacks → candidate probe), run out-of-repo and deleted after.

**What this establishes for slices 4-6:** "same draws, same order" cannot
survive a slice that moves need trajectories, because CONDITIONAL draws are
gated on needs — the protocol's scheduled re-baseline exists for exactly
this. The standard the trace sets: a re-baseline's receipt names its first
crossing, or the cascade is not explained.

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

## HOW THE LAST THREE FAILURES RESOLVED

- **The fingerprint** — traced (above) and re-pointed with the receipt in the
  pin's own comment. Seed 4242 needed nothing.
- **`crew shopped on their day off`** — NOT the cascade: **fixture bug #7**.
  The scenario's own onTick clamped `Math.min(c.p.hunger || 0, 0.8)` — a
  float ceiling on a Q20 need zeroes it every 8 ticks. `Math.min/max(need,
  literal)` is a SHAPE the assignment/comparison sweeps missed; a family
  sweep found four more (bored floor, the care-package clamps) plus a float
  epsilon in a wait loop. Add it to the sweep list for slice 4: assignments,
  comparisons, object literals, template interpolations, AND clamp shapes.
- **The dehydration probe** — re-pointed 0.25 → 0.30 with the trace as
  receipt, mutation-tested. Pre-slice worst was SALTY@9 at 22% (3 points of
  headroom); the stream reshuffle re-rolled the worst town to SUDSY@17 at 26%
  — the same crab and seed the scenario's own history names as the structural
  worst (an owner-operator on a ten-hour day, 18.7% at the last re-point).
  Thirst accrues 0.124% SLOWER post-slice, so the accrual is exonerated; the
  mechanism is intact (TAP_QUENCH 0.02 fails the probe loudly).

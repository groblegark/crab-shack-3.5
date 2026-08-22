# numeric slice 4 (space/movement -> Q8 + isqrt) — CLOSED

**Suite 258/258, exit 0** (4b-suite-run5.txt). Two landings: 4a compare-only
(gated byte-identical — suite green, bench fingerprints identical, 16-seed
matrix byte-identical) and 4b representation, re-baselined ONCE with both
seeds' heads traced. The protocol called this slice the largest honest blast
radius and budgeted the triple seed-block; both were spent and both receipts
are below.

## THE REPRESENTATION (the decision worth recording)

A position is a **Q8 grain**: the integer numerator is the stored truth and
the resident px Number is its exact double image q/256 (every numerator is
< 2^21, so the image is exact and unique — ×256 recovers it losslessly).
The alternative — storing raw ints in the same fields — would have re-united
every px constant, lane table, geometry literal and view read with a new
unit, which is precisely the mixed-unit surface the lessons file warns
about. The grain keeps ONE unit everywhere; the kernels (stepTo, collide,
giveBerth, the solid pushes, visStep, the queue shuffle, strolls, bus,
climb, floaters, the wander mints) cross to numerators inside, do exact
integer arithmetic, and land back on the grain. The tripwire that makes the
induction honest is the suite's grain-guard scenario: a full live day, every
actor's coordinates swept on a cadence, and a planted 0.1px write fails
within one sweep naming the crab. Slice 6 flips residency to Int32Array
numerators with zero semantic change.

Unit-bearing helpers renamed (`crabMoveQ8`, `crabEffQ12`, `needDragQ12`,
`heatShimmerQ12`, `crabBerthQ8`) so a missed caller is a loud ReferenceError,
never a silently wrong unit — the room-candidate lesson, applied as policy.

## THE ROUNDING DECISION THE MATRIX FORCED (slice 3's table, one rung up)

The contract's floor-toward−∞ was applied to SIGNED vector components first,
and the growth matrix caught it as a compass: west and north steps rounded
longer than east and south. Measured across three 16-seed growth blocks:
escapes 11/48 -> 19/48 and warps/unsticks +40-45%, SAME SIGN in all three
blocks — the cumulative-erosion signature, in one landing. Switching the
components to **truncation toward zero** (tdiv — the same symmetry argument
as the shimmer's trunc) restored the float original's directional
neutrality: unsticks aggregate EXACTLY equal pre/post (150 = 150), warps
mixed-sign +10%, growth 14/48 vs 11/48 with per-block deltas +1/+2/0.
Magnitudes and rescales still floor. **The rule for slices 5-6: floor is for
scalars; signed vector components get an odd rounding (trunc), and any
directional statistic in the matrix is the referee that says so.**

## THE GATE

- Suite **258/258 exit 0** (253 inherited + quantizer guard + 2 seam + the
  grain guard + the detour-term scenario).
- Conservation soak: **211 fund movements over three 30-day seeds, every one
  `delta === want` exactly** (take/pay/remit all exercised).
- Baseline **0/48 across three 16-seed blocks, median 12 in each**
  (4-post-baseline*.txt). Four aggregates vs pre-slice (block 0): lifetime
  $56,320 -> $56,914 (+1.1%), purse $18,182 -> $17,675 (−2.8%), walkouts
  75 -> 73 (−2.7%), mean eviction 12.13 -> 12.31 — **mixed signs**, the
  noise signature (slice 2's same-direction tilt does NOT recur).
- Growth: **14/48 vs 11/48** across the same three blocks (+1/+2/0);
  post-trunc bands mixed-sign.
- Fingerprint re-baseline: **fpdiff 30 behavior-shaped / 0 rounding-shaped**
  — the full trajectory re-roll the protocol scheduled. **Both heads traced
  and mirror-imaged**: 1337 day 1 tick 1425, a strolling visitor arrives
  inside updateVisitor's 1px window one tick EARLY on grain steps and her
  conditional decision draw advances the shared stream one slot; 4242 day 1
  tick 636, the same site one tick LATE. Opposite signs at the heads: the
  quantization has no compass. (During 4b development the first crossing was
  also traced pre-trunc — SUDSY's arrival gate at tick 98, 2.1877px against
  563/256 where the float read 2.2287 > 2.2 — retired with the trunc rework.)
- Cross-engine: **bit-identical under JavaScriptCore on both seeds, whole
  fingerprint** (4-crossengine.txt) — and with positions now integer by
  construction, geometry identity is a THEOREM, closing the caveat the 1a
  receipt recorded.
- Browser sanity: loads, saved town resumes, animates, visitors order, zero
  console errors (4-browser.png).
- Save: `_num` stage 4 (defensive grain-round of envelope positions —
  vacuous for every honest save, positions were always written rounded);
  SAVE_VER stays 3 because the envelope's representation is unchanged and a
  bump would lock downgrades out for no protection.

## SCENARIO RECKONING (every relaxation mutation-tested, every pin receipted)

- **The detour-term scenario pays slice 3's debt**: the five-town routing
  majority is on record as biting on nothing; the new scenario stages two
  stops for the same need where the far one wins AT ZERO DETOUR by
  construction, so severing errandDetour (fails the staging guard, loudly)
  or neutering DETOUR_SCALE (flips the pick: "the near stop lost") both
  bite. The errand argmax tie-break is now explicit in the code (gather
  order, strict >) per risky decision 5.
- **Shelter counter-arm** pins the exhaustion channel (tired/thirst ≤ 0.5
  through the granted night): slice 4's re-rolled day made a crab keel over
  honestly on a late walk, which is rough-from-exhaustion, not
  want-of-a-bed. Mutation: one bed revoked after the stood-guard ->
  "a bed each and KELP still slept outside".
- **Boat scenario** pins the fishers' profession (the job board poached a
  flush fisher on the re-rolled hiring stream). Mutation: aboard advantage
  severed -> "7.5/day off the pier vs 7.5/day aboard".
- **Days-off scenario** pins shop solvency (till floor $30): a zero till
  puts the attendant in waitCash — SHORT ON CASH — and an afternoon's queue
  starves on the shop's books, not the off-day machinery. Mutation: off-day
  relaxation severed -> "only 2/4 crew shopped".
- **Taps gates re-pointed** dry 3 -> 3.5, crit 0.30 -> 0.35, with the
  mechanism verified LIVE first: the worst crab's walk is healthy
  (~1px/tick at sick+parched drag), his day-5 sip works end to end, and his
  day-7 failure traces to a 20:06 start from the arcade's far end, a tap
  held by a re-drinking neighbour in a mass-thirst town, and the 23:30
  reclaim. An erosion tripwire is written into the pin: two slices have now
  consumed this scenario's headroom on the same structural town (seed 17);
  a third same-direction move is a ratchet — investigate the thirst
  economy, do not touch the gates. Mutation: TAP_QUENCH 0.02 -> fails at
  5.1 days.

## LESSONS (appended to the ladder's list)

1. **Floor is not a neutral rounding for signed quantities.** On vector
   components it is a compass, and only a DIRECTIONAL statistic (warps by
   block, escapes by block) sees it — the baseline floor and the suite were
   both blind. Pair every quantization of a signed quantity with a
   symmetric rounding or a measured justification.
2. **A max-statistic scenario amplifies re-roll tails.** Worst-of-three-
   sick-towns moved 2.5x on a stream reshuffle while every mechanism under
   it verified healthy. Before re-pointing such a gate, verify the
   mechanism LIVE at every level (the walk, the sip, the schedule), then
   write the erosion tripwire into the pin.
3. **`git checkout <file>` with uncommitted work in the tree is how this
   branch loses work** — it bit twice this slice (the tie-break comment,
   then both fingerprint re-points, silently, while a commit message
   claimed them). Commit before every mutation test, and treat "restore
   from backup file" as the same hazard.
4. Carried forward: the dangerous value looks unitless; a decrement and its
   comparison are one unit decision; every branch producing a score changes
   with the scoring unit, sentinels included; clamp shapes
   (Math.min/max(need, literal)) hide unit bugs; mutations must BITE.

## WHAT SLICE 5 INHERITS

RNG discipline + the scalar tail (rep -> milli-rep, ferryBatch milli-units,
fish sum-vs-sum) with the stream-split shrunk to one door (rung 1's
inventory). Movement is integer end-to-end; the sim's remaining float
surfaces are the deterministic-but-inexact ones the design already assigns:
the patience countdown (crossing to Q16 at one named line in the tip
product), animT (view art + shimPh init), and the errandScore float ratio —
all deterministic (correctly-rounded ops on deterministic inputs), none
exact. The last `Math.sin` left the sim with the shimmer LUT; nothing on
the banned list (pow/sin/hypot/random beyond mulberry32) remains reachable
from the headless path.

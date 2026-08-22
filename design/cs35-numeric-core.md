# CS3.5 NUMERIC CORE — the deterministic fixed-point rewrite (design)

**STANDING MANDATE (Matt, 2026-08-21, departing): "continue the work
until we have a complete fixed numeric simulation cpu for gpu" — the
rewrite runs to COMPLETION (all slices through flat-state, the
WASM/GPU-ready core), autonomously, each slice through the full
re-baseline protocol, merged and pushed.**

*Synthesis, 2026-08-21, from three research passes (full reports:
`cs35-research/numeric-census.md`, `numeric-formats.md`,
`numeric-protocol.md` — read those before implementing a slice; this doc
is the map, they are the territory). Owner mandate: perf-plan ladder
rung 2, scheduled.*

## THE VERDICT: MUCH SMALLER THAN FEARED

The census counted the enemy and the enemy is little: **5 `Math.hypot`,
3 real `Math.pow`, exactly 1 sim-relevant `Math.sin`** (`heatShimmer` —
28 other sines are draw-only), and **no exp/log anywhere**. `priceAppeal`'s
`pow(1/m, 1.2)` — the presumed nasty — has exactly **13 possible inputs**
(the 0.70..1.30 price grid) and becomes a baked 13-entry LUT, exact.
Almost everything else is already integers or exact rationals in disguise
(the collide ellipse's ×1.8 is exactly 9/5; credit interest is ceil(bal/4);
the fish market walks whole dollars). The sim ends up with exactly three
number kinds: **cents, ticks, and Q-fixed** — plus mulberry32, which was
never the problem.

**A real bug found by the census**: today a save/load cycle already
violates conservation — `coins`/`p.wallet` save as raw floats while
tills/credit/fund round at save, so fractions of a cent are silently
created/destroyed on every round-trip. Slice 1 heals this permanently.
(This bug exists in CS3 too; sub-cent and invisible in play, but worth
knowing.)

## THE FORMAT TABLE (abridged — full table with headroom proofs in
`numeric-formats.md` §2; every stored value fits ±2³⁰ = Smi-safe, every
intermediate < 2⁵³ = exact)

| quantity | representation |
|---|---|
| every money balance | int **cents** (tip/OT intermediates: exact 64-bit rationals, ONE round at a named boundary) |
| clock | master int tick, 20/s (7200/day); `tmin` in deci-game-minutes (day = 14,400 exact); all 42 `-= dt` timers in ticks (every constant is a 0.05-multiple) |
| position/speed | int **Q8 px** (Factorio's grain; Q16.16 rejected — squared distances exceed 2⁵³) |
| needs 0..1 | int **Q20** |
| rep | int milli-rep (deci makes a 1.6-rep deadband artifact) |
| priceMul / tipShare | int index 14..26 / int twentieths 0..20 (kills the 1e-9 epsilon guards and the double-round hack) |
| phases | BAM16 (65,536 = one turn) |
| RNG | mulberry32 u32s unchanged; bounded ints via exact multiply-shift; **never mint 0..1 doubles; never `% n`** |

**Arithmetic contract**: floor-toward-−∞ at every rescale (Doom's rule);
round-half-up only at named unit boundaries; exact division via
`(a - a%b)/b`; isqrt via correctly-rounded `Math.sqrt` + fixup (legal:
the spec REQUIRES sqrt correctly rounded; `pow/sin/hypot/random` are
implementation-approximated — those are the banned list); threshold
compares by cross-multiplication, never division.

## CURVE REPLACEMENTS

All exact rational identities or baked LUTs except ONE genuine redesign:
**heatShimmer** becomes a BAM16 phase + 4096-entry odd-symmetric sine LUT
with stride 2048 (period 1.6s vs 1.5708s, +1.9%) — chosen because the
32-tick orbit then sums to exactly zero, making the code's
"mean-preserving by construction" comment literally true in integers.
Flagged feel-adjacent; `_noShimmer` is the ready-made A/B control and the
16-seed matrix signs off. Full list of 12 replacements in
`numeric-formats.md` §4.

## THE SLICE PLAN (strangler; full per-slice scope in
`numeric-protocol.md` §1)

0. **Enablers** (byte-identical): explicit sim-RNG object, the
   fingerprint-diff classifier script, the shadow-harness pattern
   (float-vs-int divergence logger, DELETED before every landing).
   Rides after suite `--jobs` + the Actions gate.
1. **MONEY → cents** (one atomic slice, 2 landings, 1 re-baseline).
   Money is a dataflow SINK — quantize at the mint, upstream untouched.
   `worldMoney`/`auditFund` flip to `=== 0` the same day: conservation
   becomes a theorem and then referees every later slice. Includes the
   wallet-sort tie-break, SAVE_VER→2, and the largest-remainder
   migration (rounding N wallets creates and destroys nothing, by
   construction; the dust is ledgered in-world).
2. **CLOCK → ticks** (2 landings: core + the browser dt-quantizer).
   Kills sim `time`, exact midnights, integer gates.
3. **NEEDS → Q20** (1 landing; band scenarios absorb it).
4. **SPACE/MOVEMENT → Q8 + isqrt** (the honest blast radius — the
   matrix is the PRIMARY referee; budget the triple seed-block).
   Requires the sim/view split landed first (it flushes the geometry
   the slice quantizes).
5. **RNG discipline** — split only browser-only consumers to a view
   stream (headless byte-identical ⇒ NO re-baseline); freeze the shared
   stream's order; rep/ferry/fish scalar tail.
6. **Flat state + event codes** — Int32Array state behind accessors;
   the WASM-compilable finale, byte-identical by gate.

~10–12 landings, only 4 fingerprint re-baselines. **Seam verdict**:
slice 1 may land before/parallel to the sim/view split (money touches
the view only through display formatting — and introducing `fmt$()` IS
seam work); slice 4 must wait for the split.

## THE RE-BASELINE CHECKLIST (per slice — the payroll discipline,
generalized; full 10 points in `numeric-protocol.md` §2)

Pin your own floor on the landing tree → shadow-harness with predicted
divergence bound (then DELETE it) → freeze the RNG stream (same draws,
same order — mint ints FROM the old draws) → suite with mutation-tested
relaxations → conservation soak (exact after slice 1) → matrix floor
"unmoved" DEFINED (0/16 exact; median ±1; growth judged on all 16 seeds,
one town per block, mixed signs) → fingerprint LAST with a per-field
diff receipt (every move classified rounding-shaped or traced to its
threshold crossing) → migration proof (world total to the cent) →
**cross-engine receipt** (the whole point: the converted fields must be
bit-identical under a second JS engine — standing CI annotation).

## THE FIVE RISKY DECISIONS (made; details `numeric-formats.md` §7)

1. Money lands ATOMIC (one slice) — a half-converted audit can't say
   "exact." 2. The movement cluster converts together, matrix-refereed.
3. Shimmer stride 2048 (exact mean beats a 30ms period shift).
4. Browser goes fixed-timestep 20Hz with render interpolation
   (Gaffer-style) — **explicit human play-test gate; no automated
   referee covers browser feel.** 5. Integer ties: every slice that
   quantizes a sort/argmax key adds a deterministic tie-break IN THE
   SAME SLICE (Factorio's map-gen desync was an ambiguous comparator).

## RULING 7a — THE NUMERIC BOUNDARY (adopted; effective when slice 1
lands; full drop-in text in `numeric-protocol.md` §5)

CS3 engine-shaped changes touching a CONVERTED subsystem no longer merge
textually — they are TRANSLATED at the boundary (dollars→cents through
the canonical rounding point, seconds→ticks, needs→Q20, px→Q8) and
validate behavior-equivalent, defined (money to the cent; trajectories
by decisions + mechanism assertions + an unmoved floor — never floats).
A CS3 change that cannot express in the integer units is a NUMERIC-CORE
bug, filed as one — never a float island in game.js. The slice ledger
(what's converted, what units, where the rounding point is) lives in
this file and updates with each slice.

**SLICE LEDGER**

| slice | state | unit | the rounding point |
|---|---|---|---|
| 1 MONEY | **CLOSED** (1a + 1b landed, re-baselined once) | integer **cents**, every balance and every price; the tip product in **milli-cents**; `tipShare` int **twentieths** 0..20; the price board an int **index** 14..26 (m = n/20) | the cent is BORN at `menuPrice`/`ingredientCost`/`upCost` (author-dollar tables cross ×100 at their read boundary) and at the visitor purse mint; a TIP rounds ONCE at `payTip`'s door (`tipCentsOf`, round-half-up from milli-cents) and the split then FLOORS n/20; `otPremium` is one rational with a single floor; the fund's three doors floor to whole cents; `localPrice` still rounds up to the whole DOLLAR |
| 2–6 | not started | — | — |

**Slice 1 is CLOSED.** What is converted: every balance, price, wage, rent,
threshold and fund movement (1a); the tip product, the tip split, the overtime
premium and the two 0.05-grids (1b). The sim's only `Math.pow` went with
`priceAppeal`, which is now the baked `PRICE_APPEAL_Q16` table — so no
implementation-approximated function remains anywhere in the money orbit, and
both 0.05-grid epsilon guards (`PRICE_MIN - 1e-9`, `PRICE_MAX + 1e-9`) and the
`setTipShare` double-round snap retired with the floats they were compensating
for. `hourlyRate` no longer exists as a number: it is the shape of
`otPremium`'s fraction. Two float-derived factors remain INSIDE the tip
product — the patience ratio and the charm multiplier — and they cross into
Q16 at one named line; they leave with slice 3, when needs become Q20.

**The save carries two era flags**: `_num = 1` (cents, from 1a) and
`_grid = 1` (twentieths + board index, from 1b). The grids need their own flag
rather than a sniff because the old and new ranges OVERLAP — a stored
`tipShare` of 1 is 100% in the old units and 5% in the new.

Ruling 7a is **in force** from 1a: a CS3 change touching money is translated
at the boundary, not merged textually. First application, 2026-08-21: the
on-duty-order change (`cs35` 84f7346) carried `p.wallet = 60` and landed here
as `6000`.

**1b is verified and the slice's ONE re-baseline is spent** (protocol par.2,
all ten points): suite **253/253 exit 0**; baseline `--days 30 --seeds 16`
**0/16 exact, median 12** and growth `--buy chef,table` **4/16** across all
sixteen — both identical to 1a's, so the floor did not move at all;
conservation still exact (210 audited movements over three 30-day seeds, every
one `delta === want`, all three doors exercised); the receipted fingerprint
re-baseline moved **exactly one field by one cent** (1337's coins, 14822 →
14821) with seed 4242 byte-identical whole — `tools/fpdiff.mjs --money-tol 1`
reads 1 rounding-shaped, 0 behavior-shaped — and that cent is ATTRIBUTED, not
assumed: arming the old float tip product back on the landing tree returns
1337 to 14822, so it is the Q16 quantization of the patience ratio and the
charm multiplier, and none of the other three 1b changes (all provably inert
on a default town). The cross-engine receipt was refreshed on the final tree:
both seeds **bit-identical under JavaScriptCore**, whole fingerprint
(`cs35-research/numeric-wip/1b-crossengine.txt`).

**1a was verified** (protocol par.2, everything but the receipted fingerprint
re-baseline, which the slice takes ONCE after 1b): suite 253/253; baseline
0/16 exact, median 12; growth 4/16; conservation now a THEOREM — 558 audited
fund movements over three 30-day seeds, every one `delta === want`, all three
doors exercised; the pre-cents migration lands to the cent and a save/load
roundtrip is EXACT, which retires the census's silent sub-cent bug; and the
day-2 fingerprint is **bit-identical under JavaScriptCore** on both seeds
(`cs35-research/numeric-wip/1a-crossengine.txt`). Both frozen fingerprints
carry a provisional re-point with the drift receipt in the comment: rep,
serves, rage and every position byte-identical, money moved by accumulated
per-sale cent rounding only.

**The one real bug 1b found**: baking `upCost` by exponent priced the chef's
WIPEOUT rungs at Infinity — the chef exponent is `lvl - 2` and goes negative
when a town's whole crew dies, which is how a wiped-out town climbs back at
$15 and $30. A scenario caught it, not a receipt. It is 1a's founding-tills
lesson from the other end: the dangerous value in a unit conversion is the one
that looks like it has no unit, and this time it was an array index standing in
for an exponent that can go below zero.

**The one real bug 1a found**: SUDSY and REEF opened on tills of `200`/`140`
— cents-as-dollars — so a converted town ran its first days a hundredfold
poor until the fingerprint caught it. A constant that is *already* a bare
number is the easiest thing in a unit conversion to miss.

## WHAT STAYS FLOAT FOREVER

The 28 draw-only sines, `drawCrab`'s hypot, camX lerp, the render's own
wall clock, audio, the hireCard wall-clock timer, save metadata
timestamps, title wander, ppu/sprites/font — the VIEW. The sim never
sees a float again.

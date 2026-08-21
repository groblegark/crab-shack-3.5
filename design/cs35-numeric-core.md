# CS3.5 NUMERIC CORE — the deterministic fixed-point rewrite (design)

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

**SLICE LEDGER**: nothing converted yet. (Updates land here.)

## WHAT STAYS FLOAT FOREVER

The 28 draw-only sines, `drawCrab`'s hypot, camX lerp, the render's own
wall clock, audio, the hireCard wall-clock timer, save metadata
timestamps, title wander, ppu/sprites/font — the VIEW. The sim never
sees a float again.

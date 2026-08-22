# NUMERIC SLICE 5 — CLOSED (RNG discipline + the scalar tail)

One landing in two halves, each with its own gate.

## Landing A — the stream split (byte-identical, NO re-baseline owed or taken)

srand() keeps its one door; the door gets a swappable tap. The title screen's
sim theatre (updateBus, maybeQuip, the attract wander) runs inside
`onViewStream()` and the music shuffle calls `vrand()` directly — a second
mulberry32, fixed seed, so attract mode repeats each boot and stays testable.
`trackIdx`'s load-time draw stays on the SIM stream BY SPEC: it executes
headless, so it is part of the frozen sequence — moving it would shift every
draw after it. Gate held exactly as the protocol promised: suite green both
realms, bench fingerprints identical, 30-day × 16-seed matrix BYTE-IDENTICAL
(receipts: 5a-suite-*.txt).

**The draw-count pin** ("rng: the sim stream's draw count per day is pinned")
is the slice's standing tripwire: 1,861 sim draws day 1 / 2,394 day 2 on seed
1337, both realms. Slices 3, 4 and 5 ALL had their first crossings run
through a conditional draw; this turns that class into a loud count at commit
time. Mutation-tested both ways: an extra conditional draw reads day 1 at
2,209 vs 1,861; a sim consumer mis-routed to vrand moves the count the same
tick. Boot-time draws (personas, trackIdx) happen before a scenario can wrap
srand — the frozen fingerprints stand guard over those.

## Landing B — the scalar tail (ONE re-baseline, both heads traced)

- **rep → int millirep** 0..100,000. Milli, not deci: the nightly
  relaxation `idiv((30000 − r) · 6, 100)` has a floor deadband of 0.017 rep
  where deci's was 1.6 (formats §2). Every write a whole-milli step;
  `repPts()` the one display door; `_num: 5` migrates saves round-half-up.
  ferryBatch in milli (13 IS 0.013 at the milli grain — 1000 · 0.013 in
  float is NOT 13); the culture arrival roll cross-multiplies
  `draw · rampM < rep − gateM` exactly and still draws NOTHING while the
  gate is shut.
- **patience → int Q12** author-seconds. Drains are exact rationals that
  **ROUND-HALF-UP at the boundary** — the first cut floored and the tracer
  showed every drain running slow, same direction (the seated form 0.95%
  slow): slice 3's accrual lesson, re-learned on drains. The tip's PR factor
  is the exact round of 65536·p/maxP with a ≥maxP short-circuit that also
  keeps the suite's 9e9 sentinel out of the 2^53 window.
- **errandScore → exact rational {n, d}**, argmax by `ratGt` (floored
  quotients first, then remainders cross-multiplied — r < d keeps both
  products under 2^53 where raw cross-products reach 1.3e20). Appeal in
  hundredths (100/35/84), detour in grains, DIRE and the −1 sentinel as
  rationals. The last float division in the sim's decision path is gone.
- **fish market → sum-vs-sum** in whole fish (`sumD > sumS + len`): the
  boundary case is decided by arithmetic, not by which numerator rounded
  luckier.
- **animT / shimPh**: animT is VIEW (receipt: only draw code reads it after
  init). shimPh's lazy init remains the ONE deterministic-float boundary
  sim-side — mul/div/round on deterministic inputs, bit-exact under
  JavaScriptCore by the standing receipt. Converting it would re-roll every
  shimmer phase for zero correctness gain.

**THE TRACED HEAD (both seeds, stream unshifted at the crossing):** a waiting
visitor's patience drain rounds at the Q12 grain, ±1 milli, mixed signs —
KRILL BILL, seed 1337, day 1 tick 2719 (seated drain, −1 milli); EBB, seed
4242, day 1 tick 2860 (−1 milli). Sim draws identical at both crossings (128
and 176). Downstream: coins −50c/−6c, two mid-walk positions per town, day-2
draws 2399 → 2394 with day 1 held EXACTLY; wallets, tills, serves, rage
identical on both seeds' fingerprints.

## The gate

- Suite **259/259 exit 0 BOTH realms** (5b-suite-main.txt 177s under load,
  5b-suite-vm.txt).
- Conservation soak: **198 movements, every one delta === want, EXACT**;
  doors take 144 / remit 41 / pay 13 (5-soak.txt).
- Baseline **0/48** over three blocks, medians 13/12/12 (block-0 moved one
  day, inside the defined ±1). Growth **13/48** (5+2+6) vs slice 4's 14/48 —
  noise band, mixed per block. Four aggregates block-0 pre→post: lifetime
  $55,482 → $57,478 (+3.6%), purse $19,683 → $19,574 (−0.6%), walkouts
  66 → 74, evictions later — MIXED SIGNS, no compass.
- Cross-engine: **BIT-IDENTICAL under JavaScriptCore on both seeds**, whole
  fingerprint (`jsc /tmp/seed.js xengine.js` with `var SEED = <n>` preamble).
  The sim stream being a closed sequence makes this claim stronger: the view
  can now never perturb it, by construction.
- Banned-list grep on the final tree: every `Math.pow/sin/hypot/random` hit
  is view-side (drawCrab, the far shore, mist bands) or isqrt's licensed
  correctly-rounded `Math.sqrt`. **No implementation-approximated function
  is reachable from the sim advance path.**
- Browser sanity: loads, animates, title wanders on the view stream, a saved
  town resumes, zero console errors (5-browser.png).

## Found and fixed on the way (the real-bug ledger)

1. **The mover-target exemption** (game.js, collide): a mover whose waypoint
   lies inside a parked crab's touch ellipse was pushed out exactly as fast
   as it stepped in — SANDY held 5px off her pier spot for 25 game-minutes
   against CLAWDIA's doorstep (seed 4242 day 4). The stations block already
   granted "a crab headed for this exact spot may stand there"; the same
   grant now covers crab bodies. Cured the freeze tripwire AND the
   warps/unsticks band, and un-flipped three more trajectory-failed
   scenarios.
2. **The fish scenario's stale float gate**: it recorded Q20 hunger and
   compared `>= 0.9`, so ANY sickness read as starvation (838863 ≥ 0.9). It
   sat green for two slices because SALTY never got sick. Now `>= 943718`
   (= qn(0.9)) — the clamp-shape lesson, scenario-side.
3. **Three bizTake stagings in author dollars** (slice-1 escapees):
   rivalProp paid her "good month" $1.20 a day. Now cents.
4. **rivalPurse under one-account**: the purse IS the crab's wallet;
   `OWNERS[..].till` is a stale mirror rivalPurse never reads — which means
   rivalProp's till poke stages nothing and always did. The lease scenario
   now stages the WALLET deterministically; wallet-zeroed mutation bites
   (intent 0 against a $940 till, proving the read).
5. **The price-lever sweep**: illness was the unpinned availability
   confounder (dear-1337 ran three sick crabs against cheap-909's zero), and
   three towns' arm noise reached the lever's own ~9-drink step. Illness is
   pinned with the rest of the fixture and the pool is five towns.

## Lessons carried forward

- A drain and an accrual are the same boundary decision: round-half-up where
  floor has a compass. (Slices 3 and 5, independently.)
- The purse you poke must be the purse the code reads — a stale mirror
  stages nothing, silently, and "it passed" may mean "it never mattered."
- COMMIT BEFORE EVERY MUTATION TEST. Slice 4 was bitten twice; this slice
  once (`git checkout tools/suite.mjs` ate five scenario fixes, rebuilt from
  the transcript). The rule is now personal for three landings running.
- The dangerous value still looks unitless: 0.9 in a scenario gate, 120 in
  a bizTake array, 40 in an envelope poke.

## What slice 6 inherits

Flat Int32Array state + event codes, byte-identical by gate — the
WASM-compilable finale. Everything it needs is now true: every persisted and
runtime sim quantity is an integer (or an exact 2⁻ᵏ image with an integer
numerator resident beside it), the RNG stream is a closed sequence with a
draw-count spec, strings in the sim are event-shaped names ready for codes,
and the cross-engine receipt covers the whole fingerprint. The one
deterministic-float boundary (shimPh init) quantizes to a u16 and can ride
into flat state as-is.

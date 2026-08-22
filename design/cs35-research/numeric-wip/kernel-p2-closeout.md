# KERNEL PHASE 2 — close-out (2026-08-22)

**LANDED SHORT, deliberately.** Two stages landed byte-identical (the shared
RNG cursor and a one-pass queue build); the boundary hoist itself — the
directive's stage 2 and 3 — did NOT land, and the reasons are the phase's
real product: a coupling analysis that fixes the port's true unit, and a
float audit that names the holes in slice 5's no-float receipt. Both are
prerequisites the next fork can execute against mechanically.

## What landed

**The shared RNG cursor** (`b12405f`). The sim stream's mulberry32 state
cell moved into kernel memory (26624, the word after B_BLK); `rng_seed` and
`rng_u32` are the kernel's own step, transcribed u32-for-u32 from the
closure (wraps, imul and the shifts are exact both sides; the JS caller
scales by 2^-32, which is exact). When the kernel is armed the harness
routes every `srand()` through it — so a kernel-side consumer drawing
between two JS draws continues the ONE sequence by construction. This is
the infrastructure every state-machine port needs, landed ahead of them.
- Proof: the stream-identity scenario builds two towns at one seed, one per
  backend; after load their cursors sit at the same logical position, and
  the armed town's JS, JS, KERNEL-RAW, JS draws equal the reference
  closure's four, element-wise, the raw draw compared as the exact u32.
- Mutation (bites): the mulberry32 increment constant flipped in the C and
  rebuilt — "stream diverged at draw 0: ref 0.4381… vs shared 0.5749…".
  Draw 0, not 2: with the cursor shared, EVERY draw goes through the
  kernel, so a wrong step is caught at the first draw of any armed run.
- Browser note for the port proper: in the shipped game `srand()` is native
  `Math.random` — a kernel-side consumer in the BROWSER requires adopting
  the seeded stream there too (seed from entropy once at boot). That is an
  owner-visible behavior decision (browser runs stop being irreproducible),
  recorded here, not taken tonight.

**The one-pass queue build** (`b924fb2`). `updateCustomers` rebuilt every
line with one `customers.filter` per biz; the grouping pass preserves array
order within each line, stamps tickets in the same BIZ-key order, sorts the
same total order. Same slots byte for byte.

## Why the hoist did not land: the coupling analysis

The directive's residency → port → hoist ladder assumes the machines can
migrate piecemeal. Measured against the code, they cannot, for three
reasons that compound:

1. **Mid-frame resource coupling.** Within `updateCustomers`' single pass,
   customer i's transition frees what customer j consumes THIS FRAME (a
   shower stall released at `showering` end is found by a later `waitStall`;
   a dining table freed seats the next in line). Any split that batches the
   kernel-owned states ahead of the JS-owned ones reorders these exchanges
   — same values, different frame, trajectory change.
2. **Stream order is sacred and draws are inline.** `toTable → dining`
   draws `dineT`; `updateVisitor` draws constantly; `visTick` runs at the
   top of the same per-customer iteration. A batched kernel pass would
   advance the shared stream out of order with the JS pass's draws — the
   draw-count pin would catch it, correctly, every time. With the cursor
   now shared (this phase), a WHOLE-function port draws in place and the
   problem dissolves — but only at whole-function granularity.
3. **Residency without the port is measured-negative.** Slice 6's own
   payoff bench: flat-behind-accessors is **0.79x** in JS. Migrating
   needs/patience/timers into planes tonight, with the machines still in
   JS, would have re-run that experiment at a larger scale. The 6-closeout
   already ruled it: residency lands WITH each machine's port.

**The port's true unit is therefore the whole subsystem**, boundary at the
function `simTown` calls: `updateCustomers` (with `visTick`,
`updateVisitor`, `runFerry`, `sweepRooms`, the queue helpers) as ONE C
unit; later `updateSchedule`+`updateKitchen`; then the crab dispatch loop
itself, at which point the hoist is real (one `tick()` call, event list
out). Each unit: state residency + port + events land TOGETHER, gated
byte-identical, drawing in place through the shared cursor.

## The float audit — holes in slice 5's receipt (the port's blocker)

Slice 5 claimed "the last float division in the sim's decision path is
gone" and one deterministic-float boundary (shimPh). The pre-port sweep
found the claim over-stated. All of these are DETERMINISTIC (IEEE +,-,*,/
are exactly rounded, so fingerprints and the cross-engine receipt stayed
honestly green) — but each is a spec violation a C port cannot reproduce
with i32 state, so each blocks its function's port:

- **`p.tired` accrues FLOAT STATE** (game.js ~8267:
  `TIRED_SHIFT / ownStdSpan(c) * (onOT ? OT_FATIGUE : 1) * dtT / GMIN`).
  Empirical receipt, seed 1337 day 2: `crabs[*].p.tired` =
  242698.6122222487, 656898.3866666941 — fractional Q20, persisted across
  ticks and saves, feeding the nod-line and microsleep comparisons. The
  exact-integer form is the otPremium pattern: per-crab remainder
  accumulator, numerator `TIRED_SHIFT * otNum * dtT`, denominator
  `span * GMIN * otDen` (OT 1.5 = 3/2 exact), move `floor(R/D)`, keep
  `R % D` — unbiased over any span, one named boundary. Converting MOVES
  trajectories → a receipted re-baseline with the first crossing named.
- **Four `1e-9` epsilon comparators** in scoring/argmax picks (game.js
  1542/1543, 1646, 1927 — election/scoring; 1718 — ballot purchase
  `Math.floor(spare / BALLOT_PRICE + 1e-9)` on money ints). The idiom
  slice 1b retired for prices lives on here. Cross-multiplied or
  exact-rational forms; re-baseline where a pick flips.
- **Float-ratio intermediates, one floor, exact-safe** (deterministic and
  provably never off-by-one at our magnitudes, but port debt):
  `workLoad`/`shiftLoad`/`otF` feeding the shift-end hunger bump (~8294),
  the rival's two ratios (2741, 2788), the forecaster's earnings rate
  (6491), fund/bowl quotients (1330, 1421). Convert with each owning
  function's port; no re-baseline where the floored result is provably
  identical (prove per site, the slice-4 standard).

## Gate receipts (all green, `2c14e32`-tree + two stages)

- Suite **261/261 exit 0** kernel-armed main realm
  (`kernel-p2-suite-main.txt`, 49.2s) and vm realm reference
  (`kernel-p2-suite-vm.txt`, 459.1s under load). The 261st is the
  stream-identity scenario; the draw-count pin stayed green throughout.
- Bench fingerprints identical in every pass, kernel on and off:
  `1337:9916:7 4242:7655:7`.
- 30-day × 16-seed matrix **byte-identical kernel on vs off** (timing
  lines filtered), eviction vector on slice 5's block-0 pin (median 13).
- Conservation soak: **198 movements, three 30-day seeds, every one
  `delta === want`**, all three doors exercised.
- Cross-engine: the JS reference **bit-identical under JavaScriptCore on
  both seeds** (`jsc /tmp/seed.js xengine.js` per the recorded preamble
  invocation). The kernel itself runs only under V8/wasm — the reference
  defines the spec; the agreement + stream-identity scenarios bind the
  kernel to it. No new receipt class is claimed.
- Browser, kernel armed via `?kernel=wasm`: loads, animates, zero console
  errors — `img/p2-browser-sanity.png`. kernel.wasm rebuilt reproducibly
  (the restore diffed empty against the committed bytes).

## The measurement

Interleaved best-of-5, two passes, main realm, 2 towns × 6 days:

| config | pass A | pass B |
|---|---|---|
| kernel ON | **13.68 d/s** (spread 1.08) | **13.66 d/s** (spread 1.08) |
| kernel OFF | 10.53 (spread 1.17) | 10.38 (spread 1.15) |

Ratio **1.31x** on/off; chain 2.5 (vm) → 10.5 (escape) → 11.1 (spike) →
13.2 (phase 1) → **13.7 single-core** ≈ **5.5x** for the session.

**First all-cores receipt**: 16-town × 30-day baseline matrix, kernel
armed, `--jobs 10`, main realm: **4.05s wall** — 199 actually-lived
sim-days = **49.1 sim-days/s machine-wide** (aggregate worker time 31.1s ≈
86% scaling minus per-town load). Against the session's opening single-core
2.5 d/s: the machine now does ~20x. (The baseline dies at day ~12-15 by
design; a longer-lived workload amortizes town startup and scores higher.)

## Phase 3 recommendation

1. **The float-audit landing first** — it blocks every machine port. One
   fork: the tired accrual to the remainder form (re-baselined, first
   crossing named, matrix referee), the four epsilon comparators to exact
   compares (re-baseline if any pick flips), the ratio family converted or
   per-site proven-identical. Slice-5b in all but name.
2. **The customers+visitors subsystem port** as the first whole-unit port
   (updateCustomers + visTick + updateVisitor + ferry/rooms/queues, state
   residency landing WITH it, events out for popText/sfx/stats/diaries,
   draws in place through the shared cursor). It is ~15-17% of the bill
   and it proves the recipe the remaining subsystems repeat.
3. **Cores already deliver** — 49 sim-days/s machine-wide today without
   further porting. The GPU trigger (a real workload at CPU saturation,
   still too slow) remains unmet.

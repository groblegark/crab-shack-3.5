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
| 2 CLOCK | **2a LANDED, 2b's quantizer landed with it; the slice stays OPEN on one human play-test** | master int **tick**, 20 a real second / 5 a game minute / 7200 a day; `tmin` whole game **minutes** and `tdgm` **deci-minutes**, both DERIVED from the tick of day, never accumulated; all 42 sim timers, `restT`, `otMin`, `mistMin` and `ferryT` in **ticks**; mist peak in **Q16**; shimmer phase in **BAM16** | the tick is BORN in `frame()`'s quantizer (wall ms in, whole ticks out, remainder carried, clamped at 2 ticks a frame); `tmin` FLOORS the tick of day to the minute and every shop-hours and shift gate reads it; `tdgm` is the finer grain the three RAMPS read (`darkness()`, the mist, the rent proration); random durations FLOOR to whole ticks from the same draw; `otPremium` folds ticks→minutes into its one existing rational; midnight is an exact integer gate |
| 3 NEEDS | **CLOSED** (1 landing, re-baselined once, the cascade's head traced) | int **Q20**, 0..1,048,576, every need (hunger/thirst/dirt/bored/tired), crab and visitor; per-tick accrual rates baked **round-half-up** (floor runs all five slow, −1.19% same-direction — measured, the table is in the 3-closeout); decay drains as exact rationals that FLOOR the amount removed | the Q20 value is BORN at `qn()` (authored 0..1 fractions cross at their read site, the ×100 idiom one rung up); the visitor mint floors bounded ints from the same draws; every threshold compare is int-vs-int; both errand scores ride every term in need units (rank × Q20 + need) so the argmax is the float argmax |
| rung 1 SIM/VIEW | **LANDED** (the seam; byte-identical by gate, no re-baseline owed or taken) | not a unit conversion — a BOUNDARY: `simClock` + `simTown` are the world's whole advance, announcement state included (toasts, floaters, the cards — the suite drives them, so they are observable sim); `introFrame`/`titleFrame`/`followCam`/`viewFrame` are READERS behind the one headless gate in `frame()`, crossings counted by `window._viewCalls` and asserted zero by the seam scenarios | state flows ONE WAY at `frame()`'s gate; floater lifetimes moved sim-side (`ageFloaters` — the draw used to age them, so headless towns hoarded every pop-up since day one); camera writes in sim are the two "go and look" EMISSIONS (hire, ferry ending) plus the win snap in `load`; `darkness()` is SIM (pure `tdgm` ramp) despite the view-sounding name; srand inventory for slice 5: **90 sim sites, 1 view site** (the title attract wander, plus `maybeQuip`/`updateBus` re-entered from `titleFrame`) — browser-only by construction, headless provably never draws from the view path |
| 4 SPACE | **CLOSED** (2 landings — 4a compare-only byte-identical, 4b representation — re-baselined once, both heads traced) | positions/targets are int **Q8 grains** (the numerator is the truth; the resident px Number is its exact double image q/256, so the whole px read surface keeps its unit — slice 6 flips residency with zero semantic change); speeds int **Q8 px/s**, the chain folding base → bored → sick → drag(Q12) → shimmer(Q12) in documented order; `crabEffQ12`/`needDragQ12`/`crabBerthQ8` renamed with their units; the shimmer sine is a baked **Q15 quarter wave** (odd symmetry by construction, trunc keeps it, orbit sums to exactly zero — gen-luts --test-sin is the receipt); the collide ellipse lives on the exact **5x/9y grid** with one isqrt | the grain is BORN at q8g()/the mints (bounded ints from the same draws); magnitudes and rescales FLOOR; **signed vector components TRUNCATE toward zero** — floor's −∞ asymmetry was a measured compass bias (+8/48 growth escapes, warps/unsticks +40-45% same-sign, three blocks) and trunc restored the float's directional neutrality (unsticks 150=150 exactly, bands mixed-sign); arrival radii are squared-int compares at the grain (2.2px → 563/256); every distance GATE is squared-int, no hypot anywhere in the sim |
| 5 RNG + SCALAR TAIL | **CLOSED** (1 landing in two halves — the stream split byte-identical by gate, the tail re-baselined once with both heads traced) | the SIM stream is a CLOSED SEQUENCE: srand() keeps its one door, the door has a swappable tap, and the title screen's re-entered sim theatre (updateBus, maybeQuip, the wander) plus the music shuffle run on **vrand()** — a second mulberry32, fixed seed, view-only; the draw-count pin (1,861 draws day 1 / 2,394 day 2, seed 1337) is the standing tripwire for the conditional-draw class that headed slices 3, 4 AND 5; rep is int **millirep** 0..100,000 (milli, not deci — the relaxation's floor deadband is 0.017 rep vs deci's 1.6); patience is int **Q12** author-seconds; the errand score is an exact **rational {n, d}** compared by quotient-then-remainder cross-multiplication (ratGt), appeal in hundredths, detour in grains; ferryBatch in milli; the fish market compares **sum-vs-sum** in whole fish | the millirep is BORN at the writes (whole-milli steps) and `_num: 5` migrates saves (round-half-up); repPts() is the one display door; the nightly relaxation floors (idiv, deadband 0.017); patience crosses at the mint (author-seconds × 4096) and its drains **round-half-up at the boundary** (floor ran every wait slow, same direction — slice 3's accrual lesson, re-learned on drains); the tip's PR factor is the exact round of 65536·p/maxP; the culture arrival roll cross-multiplies draw·rampM < rep − gateM and still draws NOTHING while the gate is shut; trackIdx's load-time draw stays on the sim stream BY SPEC (it executes headless). After this slice **no implementation-approximated function is reachable from the sim advance path** (grep receipt in the close-out; isqrt's correctly-rounded Math.sqrt is the licensed exception) and every remaining sim-side Number is an exact integer, an exact 2⁻ᵏ image, or the ONE receipted deterministic-float boundary: shimPh's lazy init (mul/div/round on deterministic inputs — bit-exact under JavaScriptCore by the standing receipt) |
| 6 FLAT STATE + EVENT CODES | **OPEN at 6b** (6a + 6b landed byte-identical, 2 of the protocol's 2-3 landings; the 6c remainder is specced in the close-out) | the four per-tick state machines (dayState/kstate/cstate/customer state) store **int codes** (dsC/ksC/csC/stC) behind name tables — the string every outside reader sees is a prototype accessor with a STRICT setter (an unknown string throws); positions, targets and motion sentinels live in the **SoA agent pool** (`PXQ`/`PYQ`/`PTXQ`/`PTYQ`/`PWYQ`/`PMXQ`/`PMYQ`, Int32Array of Q8 grains, ~4.8KB, one pool for crabs + npcs + customers, slots reclaimed by a per-frame mark-and-reap no removal door can leak); stepTo/visStep/collide's pair loop run on the arrays directly | the grain IS the stored value; the px Number is the accessor's exact q/256 image, so the residency flip slice 4 promised is a value identity; foreign literals (suite stubs) cross at `vivifyCust` because **an own data property SHADOWS a prototype accessor silently** — the alien it makes wears the right proto and still speaks string past the setter. **MEASURED (the payoff bench, interleaved best-of-5): the flat pool is 0.79x in JS** — the accessor tax on the long tail of reads outweighs the array wins at 12-crab scale; V8's in-object Smi fields were already near-optimal. The substrate's speed premise holds only across a COMPILED boundary where a read is a raw load, which re-scopes 6c: finish flatness for the SPEC (the WASM port's layout), not for JS throughput |

| KERNEL phase 1 | **LANDED** (byte-identical by gate — fingerprints, 16-seed matrix, draw-count pin, cross-engine) | the re-profile pass the kernel doc ordered: the post-spike bill is FLAT (no cluster over 8.3% once the two per-tick memo defects fell), so phase 1's yield came from the memo class, not from porting — `refreshDaysOff` keyed its cache on `T` (per-TICK, 7,200 rederivations a sim-day for a per-(day, rosterGen) map, ~12% of the kernel-armed bill) and the shift stepper now bumps rosterGen because `_needCover` reads `p.shift` | measured, interleaved best-of-5: kernel-armed main realm **11.1 → 13.2 sim-days/s** (+19% this phase; kernel on/off ratio holds at 1.39x); remaining JS share of the sim bill ~90%, led by `simTown`'s own dispatch self-time (14.1%) and the object-state machines (customers 8.3%, schedule 3.7%, visitors 3.3%, kitchen 2.5%) — none portable bit-for-bit without their state in planes, which is 6c's layout work; **phase 2 IS the boundary hoist** (6c state migration + one `tick()` call), incremental marshalled ports below ~8% shares no longer pay their boundary |

| NUMERIC 3a (the float audit) | **CLOSED** (one landing, one re-baseline with the head traced) | `p.tired` accrues EXACTLY: a per-crab remainder accumulator at `p.tiredRem` (numerator TIRED_SHIFT·dtT·(3\|1), denominator span·GMIN·(2\|1), floor the move, carry the rest — unbiased over any span where plain floor OR nearest loses ~0.05%/shift, same direction); the shift-end hunger/thirst bumps are ONE exact rational each; the ELECTION SURFACE is integer end to end — potStake20/roofWeight20 (twentieths), capStake100/purseCost100 (hundredths), platValue in **1/41,400,000 units** (lcm of every term's grid, proven exhaustively equal to 20×/100×/D× the float forms) — and all four `1e-9` comparators are EXACT compares (a tie is a tie); the ballot floor and both fund quotients take the exact-division idiom (provably identical: int/int IEEE division is correctly rounded, so floor can only err past 2^53); `cust.spawnX` → `spawnXQ` Q8 grains (gates scale ×256, exact); `animT` stores its raw u32 draw (readers recover the identical double) | the re-baseline's head is NAMED: SUDSY's drink-errand arrival, seed 1337 day 1 tmin 1182 — the walk drag reads tired 740136.47 (float) vs 740136 (exact), the Q8 step lands one tick apart, day-2 draws 2394→2399; money/serves/rage/wallets IDENTICAL both seeds, positions by fractions of a px. **The slice-5 claim is now amended AND enforceable**: the claim missed float STATE (deterministic, so every receipt stayed honestly green) — the tripwire scenario walks live sim state and the save envelope and FAILS on any non-integer, with two enumerated owned exceptions (rival.intent → the rival machine's port; shimPh's float init chain, stored value asserted int). Triple-block baseline **0/48** (block medians 13/12/12 → 11/13/12, pooled 12 held, mixed signs); growth **13/48** (= slice 5); soak exact (192 movements); cross-engine **bit-identical both seeds** |
| KERNEL phase 2 | **LANDED SHORT** (two stages byte-identical by gate — fingerprints on/off, 261/261 both realms, 16-seed matrix on-vs-off byte-identical, soak exact, cross-engine bit-identical, browser armed clean; the hoist itself did NOT land — see the close-out's coupling analysis) | the SIM STREAM'S CURSOR lives in kernel memory (mulberry32 state at 26624; `rng_seed`/`rng_u32` are the kernel's own step, u32-for-u32 the closure's algorithm; the armed harness routes every srand through it) so a kernel-side consumer drawing between two JS draws continues the ONE sequence — the stream-identity scenario proves it element-wise and its mutation (a flipped constant) bites at draw 0; the queue build takes one pass with ticket order preserved | measured, interleaved best-of-5: kernel-armed main realm **13.2 → 13.7 sim-days/s** (ratio on/off 1.31x); first all-cores receipt: 16-town 30-day baseline in **4.05s wall at `--jobs 10` = 49.1 actual-sim-days/s** (199 lived days; ~86% scaling); the hoist was NOT attempted because the per-customer machines couple mid-frame through stalls/tables/draw order — partial batching breaks stream order by construction, so the port's true unit is the WHOLE subsystem, and **a float audit now blocks it**: slice 5's no-float receipt has named holes (`p.tired` accrues FLOAT STATE — empirically 242698.61…; four `1e-9` epsilon comparators in scoring/elections; the workLoad/otF/rival-ratio family) — each must convert (re-baselined where trajectories move) before its function can port |

| KERNEL phase 4 | **LANDED** (four stages byte-identical by gate — bench fingerprints on/off both seeds, suite 265/265 exit 0 armed-main AND armed-vm AND unarmed-main, 16-seed matrix on-vs-off byte-identical, soak exact 192 movements, cross-engine bit-identical both seeds, browser armed clean) | the customers+visitors unit's FIRST HALF compiles: visitor RESIDENCY (the VS code + five needs become plane grains behind VisS accessors — three literal mints and vivifyCust lifted so no own property shadows a plane), `vis_tick` (the needs clock, integer-pure — the one float dance arrives as a per-frame finished argument, proven integer-valued for every quantizer dtT) and `vis_pick` (the scorer, the reference's f64 dance transcribed — wasm f64 is IEEE like JS — drawing through the SHARED cursor; the taste row crosses as the **Layer-0 cultureway hook table**, pure f64 data, the kernel never learns a culture's name; blocked counters drain into the stay exactly as stayBlocked did); the draw-count pin now counts CURSOR ADVANCES (RNG_COUNT rides the word after RNG_STATE) — the only definition of "a draw" that survives draws moving into the module, and it reads the same 1861/2399, the receipt the stream never forked; two of p3's three port blockers measured VACUOUS and pinned loudly (tickets are unique so sort stability is never consulted; menus carry no pay ties so cheap's stable-[0] is the first strict min) | mutations bite by name (sand-premium → "visitor diverged at 7 field dirt"; severed clean rank → first divergent pool grain; the 0.1 rank nudge is margin-silent in the 2-day window — recorded, not claimed); measured interleaved best-of-5: kernel on/off **1.67-1.71x** (up from 1.49x — the unit grew the kernel's share); ABSOLUTE numbers this session are machine-degraded (load avg ~6 from neighbours: 9.4 vs phase-3's 14.7 d/s on the same workload WITH kernel-off down the same fraction) so the RATIO is the phase's number; all-cores under the same load: 187 lived days / 10.8s = 17.3 d/s machine-wide (phase 3 measured 50.7 quiet — remeasure when the box is) ; the unit's SECOND half (updateCustomers' line/seat/stall machine + the serve/pay half) remains JS, blockers named in the close-out |
| KERNEL phase 5 | **LANDED** (two stages byte-identical by gate — bench fingerprints on/off both `1337:13022:7 4242:19364:7`, suite 265/265 exit 0 armed-main AND armed-vm AND unarmed-main, 16-seed matrix on-vs-off byte-identical, soak exact 192 movements, cross-engine bit-identical both seeds, browser armed clean) | the counter machine compiles WHOLE: furniture ID-izes into a fid registry (`FurnS` wrappers — the occupant's identity stays on the object, its TRUTH is the plane bit, so a kernel free goes dark without a JS write; rooms ARE hotel stalls, free-listed for the annexe), the counter scalars (patience Q12, climb, three timers) and the two holds move behind VisS accessors, and `cust_step` runs one call per customer at the reference's own point in the pass — the mid-frame resource exchange order (a stall freed by customer i, claimed by customer j the same pass) preserved by construction; the EVENT RING lands real (16-triple out-plane, drained immediately: pops, sfx, stats, the crab's shower persona, the table tip through payTip's own door with only the wallet clamp computed kernel-side); the dine draw happens IN the kernel through the shared cursor; the suite's 9e9 patience sentinel became 0x7fffffff (patience is an i32 plane) | five mutations bite by name in the agreement scenario — which grew the counter planes precisely because day-end digests CANNOT see queue-walk mutations (positions converge to exact slots): step grain → pool PXQ, drain rounding → PXQ through the rage cascade, scrub depth → dirt, the dirty flag → agreement, the wallet clamp → `wallet: ref 0 vs kernel -345`; one mutation recorded VACUOUS by modular arithmetic (drain numerator mod 20 never lands on 9 with a clean server) and escalated, the 1b shape; measured interleaved best-of-5: kernel on/off **1.71-1.75x** (from 1.67-1.71x); absolutes neighbour-degraded (load 14-32; off 5.3 d/s), the RATIO is the phase's number; all-cores under the same load 18.3 d/s machine-wide; kernel-side share of the unarmed bill now ~42% |
| KERNEL phase 6 | **MAPPED, PORT DECLINED** (the phase-3 precedent: a map that says stop) | the schedule+kitchen surface enumerated end-to-end (kernel-p6-map.md): the crab-work half touches naps' RNG, the claim scan, busing, wander, `routedStep`, the town-wide slot machinery, the money doors and the schedule chain — an estimated 2,000+ lines of C against ≤6% measured self-time | the kernel-armed profile on this tree shows the JS residue FLAT (updateSchedule leads at 1.6% self; `simTown` dispatch self is 0.5%, not phase 1's 14.1% — that justification dissolved as units compiled); the compiled side is now the majority of the bill; re-ordered next steps: quiet-box remeasure of absolutes, then the BATCH instrument (cores at ~86% scaling are the cheap multiple), the port only ever as a hoist-enabler a quiet profile re-justifies |

**Slice 2 (a) is LANDED and the slice is OPEN on one gate.** What is
converted: the master clock, `tmin`/`tdgm` as projections of it, all 42 `-= dt`
timers plus the five that hid from the census's count (`stuckT`, `castT`, the
35 quip bubbles, `DETOUR_T`, the ballot count's own decrement), the four
persisted clocks with their `_num: 2` migration, `mistPeak` as a baked
257-entry Q16 table rolled once at midnight, and heat shimmer's phase as a
BAM16 accumulator on stride 2048 (period 1.5708s → 1.6s, +1.9%, bought so the
32-tick orbit closes and "mean-preserving by construction" is literally true).
The sim's LAST `Math.pow` is `mistPeak`'s and it is gone; what remains in the
sim is `Math.sin` in the shimmer, which slice 4 takes with the sine LUT.

**WHAT SLICE 2 STILL OWES**: risky-decision 4's **human play-test gate**. The
browser now runs on quantized whole ticks, and no automated referee covers
browser FEEL at the speed chips - the suite proves the rate is right at every
cadence a screen runs at, not that 6x still feels like 6x. The Gaffer-style
render INTERPOLATION is deliberately NOT here: interpolating a rendered frame
between two sim states needs the sim/view split, which the design already
places before slice 4. The quantizer half of 2b is landed because 2a could not
run in a browser without it.

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

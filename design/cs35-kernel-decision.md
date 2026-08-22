# CS3.5 KERNEL DECISION — WASM, WebGPU, or neither yet

*Research + design, 2026-08-22. Prompted by the owner: "i still think this
is a crazy thing to do in an interpreted language like javascript. we should
be choosing between wasm and some kind of webgpu situation" / "interpreted JS
is just never going to be a fast kernel" / "and dont forget this does still
need to interface with customizable behavior/rules etc. in the data layer
(granted that extensions to the emerging language will be plentiful in early
days)" / "or if not branchless than at least branching rarely enough to get
significant speedup" / **"but maybe cpu is ultimately best; just highly
optimized for cache locality.."**. Session goal: 1000x on the numeric
simulation.*

*Sibling: `design/cs35-branchless-research.md` carries the branch census and
warp-coherence measurement. Its divergence numbers sharpen §3's GPU column;
this doc does not duplicate them.*

**THE SHORT VERSION.** The owner is right that JS is not a fast kernel, and
the ladder should end in compiled code. But the first 3-4x is not a kernel
problem at all: **our headless sim gives away 3.3-4.2x to the node `vm`
context it runs inside**, measured, fingerprint-identical, fixable in the
harness without touching a line of game code. Take that first. Then finish
the numeric slices, because slice 6 (flat state) IS the port-readiness work
and there is no spec to port until it lands. Then compile.

**And the owner's later instinct — "maybe cpu is ultimately best; just highly
optimized for cache locality" — is the one this research most supports.** A
CS3.5 town's flat state is roughly **4-12 KB**, and a P-core on this machine
has **128 KB of L1 data cache**. A town does not merely fit in L2; it fits in
L1, with room for a dozen more. The cache-resident CPU core is not the
do-nothing control, it is the leading candidate: it is the path where the
working set never leaves the fastest memory on the chip, where branches cost
a mispredict instead of a whole warp's divergence, and where the same code is
the reference implementation and the product. **GPU's honest role is the
marginal batch multiple beyond CPU saturation, not the destination.**

**1000x is real for batch science and is not available for a single town** —
the honest product is ~25x per core, ~150-250x once this laptop's cores
saturate, and 1000x+ only across a GPU batch, where the precedent is direct
but the restructuring cost is real.

## 1. THE VM TAX, MEASURED

`tools/simlib.mjs` runs the game files inside a `vm` context. Every
free-variable read in game.js therefore crosses V8's contextify interceptor.
Measured on this machine (contended — a slice-3 fork was running; per
`tools/bench.mjs` discipline all figures are best-of-N, interleaved, and
**every variant produced an identical fingerprint**, so the comparison is
valid):

| driver | sim-days/s | vs shipped |
|---|---|---|
| A — `simlib` as the tools use it (vm context) | 2.50 | 1.00x |
| A2 — vm context, loop condition precompiled | 2.58 | 1.03x |
| B — **main realm** (game files in a `Function` body, closure accessors) | **10.46** | **4.19x** |

*(2 towns x 6 days, best of 3. Fingerprint `1337:11783:7 4242:15781:7`
identical across all three.)*

A second experiment separates the two candidate causes, at a fixed 20,000
frames so the work is identical by construction (end state
`[4,100,18112,632845]` identical across all three):

| variant | frames/s | |
|---|---|---|
| V1 — vm, one crossing per frame | 14.8k | — |
| V2 — vm, batched 200 frames per crossing | 14.6k | **0.99x — crossings are FREE** |
| V3 — main realm, direct call | 47.7k | **3.27x — execution is the cost** |

**The boundary crossing costs nothing; the contextify global costs 3.3x.**
Batching the driver is not the fix. Getting the game code out of the vm
context is.

Two consequences, and the second one is the uncomfortable one:

- **The shipped game never paid this.** `index.html` loads font/ppu/sprites/
  crabs/merge/game as plain `<script>` tags — the browser has always run the
  main-realm path. This is a tax on **headless tooling only**: the suite, the
  matrices, `bench.mjs`, and every batch run. Since batch science is exactly
  what the 1000x goal is about, it is squarely on the critical path.
- **The perf plan's profile was taken through the tax.** `WHERE THE TIME
  GOES` was measured under `vm`, where every free-variable read is ~3.3x
  dearer than it is in the realm the game actually ships in. Clusters that
  are global-read-heavy (the scheduling-derivation chain, and literally the
  `vm-global flag reads ~3%` row) are **over-represented in that table**. The
  shares are not wrong about the vm world; they do not transfer unchanged to
  a main-realm or compiled world. **Re-profile after the escape, before
  choosing what to optimize next** — the shortlist may re-rank.

A methodology note worth keeping, because it nearly went in this document as
fact: a first pass at this measurement, run with one round instead of three,
reported the vm tax as 6.76x and attributed 1.80x of it to per-frame script
compilation in `runDays`. Both numbers were cold-JIT artifacts. With
best-of-3 the compile tax is 1.03x — V8 caches compiled scripts by source
string, so `G("day")` every frame is nearly free. This is the third time this
session that the machine, not the code, produced a confident wrong multiple;
`bench.mjs`'s header records the other two.

**LANDED (2026-08-22).** The escape shipped as `simlib.loadGame`'s `main`
realm (`SIMLIB_REALM=main`, `createSim({realm})`, `--realm` on headless and
bench), G() minted as an eval closure inside the Function body, per-sim
isolation probed (interleaved same-seed sims reproduce solo fingerprints;
`globalThis` gains no properties). Measured on landing, interleaved
best-of-3 both passes: **4.3x** (2.48-2.55 → 10.83-11.06 sim-days/s),
fingerprints identical in every run, suite 253/253 exit 0 in both realms
(35s main vs 101s vm), 16-seed matrix byte-identical. Receipts in
`design/cs35-research/vm-escape/`. The default stays `vm` until the numeric
branch merges its in-flight re-baselines; the re-profile this section calls
for should run in the main realm.

## 2. THE WASM RUNG

**What the literature actually supports.** The eye-catching numbers (8-27x)
come from small-input microbenchmarks against unoptimized JS, and invert as
input size grows — in one study 18 benchmarks became *slower* than JS at
medium input. Against *well-optimized* JS the honest figure is ~2x on broad
suites, and AssemblyScript specifically has been measured **3x slower than
JS** on an allocation-heavy workload. WASM's dependable structural wins are
64-bit integers (up to 4x on those ops), no GC pauses, no deopt cliffs, and
predictable inlining — none of which is a magic multiple on branchy code.

Our workload is the hostile case for a big multiple: ~16.7k lines of branchy
agent logic, not a tight numeric kernel. **Expect 1.5-2.5x from WASM over an
optimized typed-array JS core, not 10x.** The compensating prize is not raw
speed — it is that the core becomes a portable, bit-exact SPEC.

**Toolchain, assessed:**

- **Hand-port to C / Rust / Zig → WASM. Worth doing after slice 6, but as a
  refinement rather than the destination — see the cache-resident section
  below.** The
  numeric rewrite has already done the hard part: after slice 6 every field
  is an integer in a flat `Int32Array` with event codes instead of strings,
  which is a C struct written in JavaScript. The JS core stays the reference
  implementation and the suite proves the port equal seed-by-seed — the same
  equality gate the JavaScriptCore cross-engine receipt already uses. Cost:
  a second implementation to maintain until the JS one is retired.
- **AssemblyScript. NO.** TS-shaped and tempting, but measured slower than JS
  on allocation-heavy work, with its own semantics traps. We would be
  adopting a young single-pass compiler to beat V8's optimizer at its own
  game.
- **Flat typed-array JS — NOT the do-nothing option, and possibly the
  destination.** The perf plan marked typed-array refactors RED ("mass blast
  radius for single-digit upside"), but that verdict predates the numeric
  rewrite: the blast radius was float-shaped, and slice 6 pays it anyway as a
  gated, byte-identical landing. V8 on a flat `Int32Array` with no property
  lookups, no allocation and no megamorphic shapes is not the language
  benchmarked above. **Bench slice 6 in JS before scheduling any WASM work.**

### THE CACHE-RESIDENT CPU CORE (the owner's instinct, costed)

The argument is quantitative and it is strong on this hardware.

| | measured |
|---|---|
| CS3.5 town state, flat `Int32` estimate | **4-12 KB** (7 crabs x ~71 numeric fields; ~496 numbers + 147 strings→codes in the roster alone) |
| this machine (Apple M5 Pro) | **6 P-cores** + 12 E-cores |
| P-core L1 data cache | **128 KB** |
| P-cluster L2 | **16 MB** |

**A town's entire working set fits in L1D roughly ten times over**, and the
P-cluster's L2 would hold on the order of a thousand towns. This is the
regime where a flat integer core runs at close to its ALU-bound ceiling:
no allocation, no GC, no pointer chasing, no cache misses on the hot state,
and — unlike the GPU case — a branch costs one mispredict on one core rather
than serializing an entire warp. The sibling branch-census research is
measuring how branchy the agent code actually is; that number moves the GPU
column far more than it moves this one, which is precisely the asymmetry
that favours CPU.

What it costs: essentially nothing beyond slice 6, which is already
scheduled. That is the decisive point — **the cache-resident CPU core is
mostly work we have already committed to doing for correctness reasons.**
WASM then becomes a 1.5-2.5x refinement on top of an already-good core,
taken when a portable bit-exact kernel is wanted for its own sake, rather
than a rescue mission.

**Where CPU saturates.** Per-core ~25x over today's baseline (see §5), times
useful cores. Note the core count is not 18: 12 of them are E-cores, and
`bench.mjs`'s header records the measurement in which E-core scheduling
silently cost a third of throughput. Six P-cores plus twelve E-cores at
roughly a third the throughput each is about **10x effective parallel
speedup**, not 18x. So this laptop saturates near **~250x aggregate**, and a
bigger CPU box moves that linearly with P-cores. Everything past that is
either more machines or the GPU.

## 3. THE WEBGPU RUNG

The precedent is close enough to be uncomfortable: **Overcooked** — the genre
CS1 was built from — ported to Madrona went from **2,000 steps/s on an 8-core
EPYC to 3.5M steps/s across 1,000 parallel environments on an A40**, about
**1,750x**, peaking near 14M steps/s at 10,000 environments. Madrona's whole
thesis is batches of thousands of worlds prioritising aggregate throughput
over per-world latency. That is our batch-science use case exactly.

Read the costs as carefully as the number. The port's difficulty was not the
math, it was **restructuring to expose parallelism**: an ECS rewrite,
atomics for collision detection, and explicit ordering rules for simultaneous
interactions. Our equivalents are real — the collide pair loop, queue
position stamping, the settlement ordering the conservation audit depends on.

Two hardware facts, one of which corrects the perf plan:

- A GPU "core" is a SIMD lane in a lockstep warp; WebGPU caps a workgroup at
  **256 invocations** (64 is the usual choice). Branchy per-lane agent code
  pays the divergence discount the plan already records.
- **A town does NOT fit workgroup shared memory.** Measured: 7 crabs carry
  ~496 numeric fields (~71 each) plus 147 strings, and crabs+visitors+owners
  serialize to ~24.7 KB of JSON. A realistic slice-6 flat state is roughly
  1-3k `Int32` = **4-12 KB per town**. Workgroup shared memory is only 16-48
  KB *for the whole workgroup* — 256-768 bytes per lane at 64 lanes. So
  per-town state lives in **storage buffers**, not shared memory, and the
  layout question becomes coalescing: structure-of-arrays across the batch
  (town-major fields, not town-major structs). Capacity is not the problem —
  10,000 towns x 8 KB = 80 MB against a `maxStorageBufferBindingSize` of
  128 MB on mobile and up to 4 GB on desktop.
- The determinism objection is **already dissolved**: integer ops are
  bit-exact on GPUs, and after slices 1-6 the sim has no floats. This is the
  rewrite's quiet second payoff.

**GPU buys nothing for a single town.** One town is one lane; a lane is
slower than a CPU core. It is a throughput instrument, not a latency one.

## 4. THE DATA LAYER — the constraint that reshapes both rungs

The owner's third message is the one that changes the design, and neither
rung had accounted for it: the kernel cannot bake the rules in. Cultureways
put behavior in the save file, and early on the extensions will be plentiful.

This does not need inventing — **Ruling 1 already settled the shape**, and
it maps onto the kernel question almost too neatly:

| cultureway layer | kernel shape | runs on |
|---|---|---|
| **Layer 0** — JSON data (art, people, foodways, voice, most civics vocabulary) | **(a) hook tables**: thresholds, curves, event-code→effect tables read by fixed kernel code | JS, WASM, **GPU** |
| **Layer 1** — terminating expressions (stakes, bills, eligibility, urgency ramps, taste weights) | **(b) bytecode + fuel counter** embedded in the kernel | JS, WASM, **GPU with care** |
| **Layer 2** — Hardened-JS / SES hooks (rare, "genuinely novel process bodies") | a JS engine in the trust path | **JS host only** |

**Recommendation: (a) + (b), staged exactly as Ruling 1 stages them; (c) as a
GPU-only optimization; and Layer 2 understood as a backend-pinning decision.**

- **(a) Hook tables** are not a compromise, they are where the ruling already
  starts, and they carry the majority of the content by the research's own
  accounting. Data tables are trivially portable to WASM and GPU. Free.
- **(b) A bytecode VM is the natural implementation of Layer 1, not an
  exotic one.** Ruling 5 already demands *fuel budgets* and no ambient
  authority for hostile files; an instruction-counting bytecode interpreter
  is the mechanism that delivers termination guarantees and fuel accounting
  by construction. It is a few hundred bytes of interpreter in the WASM
  kernel. WASM is itself the industry's untrusted-code sandbox for exactly
  this purpose — Figma, Shopify and AWS run third-party code this way.
- **(c) Kernel specialization** — compiling a cultureway's rules into a
  generated kernel — should be reached for **only on the GPU rung, and only
  from validated Layer 0/1**, never as the trust boundary. The hostile-file
  posture survives because we generate from a clamped, schema-validated,
  terminating representation, and the generated code runs inside the WASM/GPU
  sandbox regardless. It is an optimization, not a security decision.
- **Layer 2 pins the backend.** A cultureway that needs SES hooks can never
  run on the GPU backend and cannot cross into WASM without embedding a JS
  engine. This is a genuine and previously unrecorded tension: **the moment
  Layer 2 lands, cultureways split into a portable set and a JS-only set**,
  and the batch instrument must refuse (or CPU-fallback) the latter. That is
  an argument for holding Layer 2 exactly as long as Ruling 1 says to.

**The warp-coherence consequence, which falls straight out of (b).** Towns
in a batch that share one cultureway run the *same bytecode over different
data* — warp-coherent, the good case. Towns running *different* cultureways
diverge at every rule dispatch. So the scheduling rule for CS4's
evolutionary search over generated cultureways is: **batch by cultureway,
not by parameter sweep.** A 10k-town batch of one culture is the friendly
workload; 10k distinct cultures one per lane is the pathological one. This
also means (c) specialization and warp coherence reinforce each other — a
batch that shares a cultureway can share a specialized kernel.

## 5. THE MULTIPLICATION TABLE TO 1000x

Baseline: **2.5 sim-days/s**, one core, `simlib` as the tools use it today
(measured, contended machine).

**The CPU-only column is the one to read first.** It is the path made of work
already scheduled, and it is where the confidence is.

| factor | multiple | class | CPU-only path | note |
|---|---|---|---|---|
| escape the `vm` context | **3.3-4.2x** | MEASURED | **yes** | harness only; no game.js change; fingerprint-identical |
| engine opt waves 1+2 | ~1.5x | MEASURED (1.29x landed) | **yes** | wave 1 in; wave 2 unstarted |
| slice 6 flat state, L1-resident | **0.79x MEASURED in JS** (was GUESS 1.5-3x) | MEASURED | **as spec only** | benched 2026-08-22 on the 6b landing (interleaved best-of-5, main realm): base 10.5 sim-days/s, flat pool 8.3 — the accessor image (get x = PXQ[i]/256) on the long tail of reads costs more than the hot-loop array wins recover at 12-crab scale; V8's in-object Smi fields were already near-optimal. **The row's premise survives only across a compiled boundary**, where a read is a raw i32 load with no getter — so the flat pool stays as the WASM port's state layout and the guess moves to that column |
| WASM over optimized flat JS | **5.8x on the ported cluster, MEASURED** (was LITERATURE 1.5-2.5x) | MEASURED | **yes — upgraded** | the movement-kernel spike (2026-08-22, `tools/kernel/`): stepTo + visStep + the WHOLE collide (pair loop, berth, furniture/station solids) hand-ported to C via zig cc on the shared SoA pool memory, proven equal (agreement scenario byte-for-byte over 2 days, suite 260/260 armed, 16-seed matrix byte-identical, fingerprints identical in every interleaved bench pass). collide: 179ms → 31ms over 4 sim-days INCLUDING per-frame marshalling and boundary calls; end-to-end 8.15 → 11.1 sim-days/s = **1.36x from one cluster**. First cut (pair loop only) measured ~1.0x — the pair loop was the cheap tenth of collide; the O(furniture×bodies) solids were the weight. Implied full-port per-core multiple at the cluster's rate: **~3-5x over main-realm JS** — the literature row's ceiling was too low for THIS code because the JS it replaces still pays getters and floats at the seams. **Phase 1 addendum (2026-08-22, `kernel-p1-closeout.md`): the post-spike bill is FLAT** — the old 25%/16% clusters were the vm tax and two per-tick memo defects wearing profiler costumes; fixing `refreshDaysOff`'s per-tick key (~12% of the bill, byte-identical) took kernel-armed throughput 11.1 → **13.2 sim-days/s**, and no remaining cluster over ~8% ports bit-for-bit without its state in planes. **Phase 2 is the boundary hoist**: do 6c's flat layout AS the kernel's layout, one `tick()` per frame, events out for side effects — the ~35% of dispatch + state-machine self-time is the prize. **Phase 2 addendum (2026-08-22, `kernel-p2-closeout.md`): the hoist's true unit is the WHOLE SUBSYSTEM, and a float audit blocks it.** Landed byte-identical: the sim stream's mulberry32 cursor into kernel memory (`rng_seed`/`rng_u32` — a kernel-side consumer now draws in-sequence by construction, proven element-wise by the stream-identity scenario, mutation biting at draw 0) and a one-pass queue build; measured 13.2 → **13.7 sim-days/s** single-core (on/off ratio 1.31x) and the first all-cores receipt: 16 towns × 30 days in **4.05s wall at `--jobs 10` = 49.1 actually-lived sim-days/s machine-wide**. NOT landed, with the analysis on record: piecemeal residency/ports — mid-frame resource coupling (a freed stall is consumed later the SAME pass) and inline draws make partial batching a trajectory change by construction, and slice 6 already measured residency-without-port at 0.79x. Port unit going forward: `updateCustomers`+visitors as one C unit, then schedule+kitchen, then the dispatch loop = the hoist. Blocking prerequisite, found by the pre-port sweep: slice 5's no-float receipt has holes — `p.tired` accrues FLOAT STATE (empirically 242698.61…), four `1e-9` epsilon comparators live in scoring/elections, plus an exact-safe ratio family — each converts (re-baselined where trajectories move) before its function ports |
| **per-core subtotal** | **~11-31x without WASM, ~25-79x with** | | | call it **~25x**; the honest single-town ceiling |
| useful cores here (6 P + 12 E) | **~10x effective** | MEASURED | **yes** | not 18x — E-cores run ~1/3 speed (see `bench.mjs`) |
| **CPU SATURATION, this laptop** | **~150-250x** | | **end of CPU path** | linear in P-cores on bigger boxes |
| GPU batch, 1k-10k towns | **4-10x beyond CPU saturation** | LITERATURE | no | the *marginal* gain, not the headline |
| **batch-science total** | **1000x+ reachable** | | | needs the SoA restructure + atomics |

**Reading the GPU row honestly.** Madrona's Overcooked port is quoted as
1,750x, but that is measured against a *Python* CPU baseline on 8 cores — it
bundles the interpreted-language tax, the single-core tax, and the GPU batch
gain into one number. Our CPU column already collects the first two. Against
a *saturated, cache-resident, multi-core CPU* baseline, the GPU's remaining
contribution is the batch multiple alone: single-digit to low-double-digit.
That is still the difference between an overnight sweep and a coffee break,
and it is the right way to decide whether to spend the restructure.

**Where 1000x is real:** aggregate throughput for distribution science —
eviction histograms, rare-event hunting, parameter heatmaps, cultureway
evolutionary search. **Where it is not:** a single town. Per-core work tops
out around 25x, and single-town latency is bounded below by the 20Hz tick
semantics anyway — slice 2 fixed the tick rate at 7,200 frames per sim-day by
design. No kernel changes that.

## 6. SEQUENCING — the recommendation

1. **Escape the vm context now.** It is the best-evidenced, lowest-risk,
   highest-leverage item available: 3.3-4.2x, harness-only, no game.js diff,
   and the fingerprints are already proven identical across drivers. It
   speeds the suite, every matrix, and every future measurement — the
   project's own clock. Do it as a `simlib` change gated on a byte-identical
   fingerprint, exactly like a numeric landing. *(Caveat to check on the way:
   `vm` gives each sim a fresh global. The main-realm `Function` pattern must
   preserve that isolation between towns — `xengine.js` already demonstrates
   the shape, including the trap that a destructured local never sees the
   game's own `requestAnimationFrame` assignment.)*
2. **Re-profile immediately after.** The `WHERE THE TIME GOES` table was
   measured through a 3.3x global-read tax; the optimization shortlist may
   re-rank once that is gone. Do not schedule opt wave 2 against the old
   profile.
3. **Finish slices 3-6.** No kernel port before slice 6 — **there is no spec
   to port until the state is flat and the strings are event codes**, and a
   strangler's whole discipline is one spec with one reference
   implementation. Porting a moving target buys a second bug surface.
4. **Bench slice 6 in JS before scheduling any WASM work.** If flat
   typed-array JS captures most of the win, WASM's remaining 1.5-2.5x is not
   worth a second implementation *yet* — it becomes worth it when the GPU
   rung needs a portable integer kernel anyway.
5. **WASM port after slice 6**, as a C/Rust/Zig core proven equal seed-by-seed
   by the suite, with the Layer-0 tables and the Layer-1 bytecode interpreter
   designed in from the start rather than bolted on.
6. **GPU last, and only when the batch instrument has a job** — and now with
   a defined trigger rather than a vibe: **when CPU saturation (~150-250x
   here) is actually being hit by a real workload and is still too slow.**
   The prerequisite is not enthusiasm, it is the SoA restructure and the
   ordering discipline (atomics where the settlement audit currently relies
   on sequence), plus whatever the sibling branch census says about
   divergence. Build it when CS4's cultureway search needs 10k-town batches —
   and batch by cultureway when you do.

**The through-line, if you read nothing else:** every rung of the CPU column
is work already justified on correctness or tooling grounds. The vm escape
makes the suite faster. Slice 6 makes the state flat because the rewrite
demands it. Cache residency then falls out for free, because a town is 4-12
KB and L1 is 128 KB. **The fast path and the correct path are the same path**
— which is the strongest argument in this document, and it is an argument for
CPU.

**One thing NOT to do:** start WASM or WGSL work before the vm escape. It
would land a compiled kernel on top of a harness that is still giving away
4x, and every speedup number taken along the way would be measured against
the wrong baseline.

## PHASE 3 ADDENDUM (2026-08-22) — the float audit lands; the port unit is mapped

Landing 3a closed the float audit (kernel-p3-closeout.md): tired
accrues by remainder accumulator, the election surface is integer end
to end with the four 1e-9 comparators gone, and the integer-ness
tripwire scenario now ENFORCES the amended no-float claim (float STATE
included — the class slice 5's grep missed). Measured after 3a: kernel
on/off **1.49x** (up from 1.31x with no kernel change — the audit
replaced float dances on the JS side, growing the kernel's share of
the remaining bill), single-core **14.7 sim-days/s** kernel-armed main
realm, all-cores **50.7 sim-days/s** machine-wide (3.69s for a 16-town
30-day baseline at --jobs 10). Session chain 2.5 → 14.7 ≈ 5.9x.

Landing 3b did NOT land: the customers+visitors closure measures
~620 sim lines before the serve/pay half (est. 900-1,400 lines of C)
with three named port-blocking semantics — JS sort stability, Map
iteration order, and **visPick as the cultureway surface** (the first
binding of the Layer-0 hook tables to the kernel; a design decision
for the owner/orchestrator, not a port detail). The full map, with
the recommended landing order and the paired-order scenarios to write
BEFORE porting, is in kernel-p3-closeout.md §3b. The inline-draw
blocker is cleared (the shared cursor); the float blocker is cleared
(3a); what remains is size and the three semantics, all enumerated.

## PHASE 4 ADDENDUM (2026-08-22) — the first subsystem half compiles; the hook table binds

The customers+visitors unit's first half runs in the kernel, byte-identical
at every gate: visitor residency (state code + needs as plane grains),
`vis_tick` (integer-pure; the one float dance arrives as a per-frame
finished argument), and `vis_pick` — the scorer transcribed with f64 (wasm
f64 is IEEE, bit-for-bit JS's), drawing through the shared cursor.

**§4's Layer-0 hook table is no longer a design — it is bound.** The taste
row crosses the boundary as pure f64 data (`MR_TASTE`); the kernel never
learns a culture's name, authoring stays in the cultureway document, and a
future culture swaps values without touching kernel.c. The shape correction
against §4's sketch: the table is per-THINK (the row depends on the
thinker), not arm-time — semantics chose, the cost is noise.

**Two of the port map's three blockers dissolved under measurement** (the
branchless study's pattern repeating at small scale): queue tickets are
unique so sort stability is never consulted, and menus carry no pay ties so
the cheap pick's stable-[0] is the first strict minimum — both now PINNED
loudly rather than trusted silently. The third (visPick-as-cultureway-
surface) became the hook table above.

**Measured**: kernel on/off **1.67–1.71×** interleaved best-of-5 (phase 3:
1.49×). Absolutes were machine-degraded this session (neighbour load; the
kernel-off number fell the same fraction), so the ratio is the phase's
figure and absolutes want a quiet-box remeasure. The draw-count pin now
counts CURSOR ADVANCES in the kernel (`RNG_COUNT`) — the only definition
of a draw that survives draws moving into the module; it reads the same
1861/2399, the receipt the stream never forked.

**Remaining**: the unit's second half (the line/seat/stall machine + the
serve/pay half) is object-referential — tables/stalls/rooms/servers need
ID-izing into planes as their own layout landing, with the event ring
landing WITH that machine (VP_OUT + the vis_tick mask demonstrate the
out-plane pattern). Phase 5, one fork, nothing else in the directive.

## PHASE 5 ADDENDUM (2026-08-22) — the counter machine compiles whole

The customers+visitors unit's second half is kernel-side: furniture
ID-ized into fid planes (identity on the object, truth in the plane bit),
the counter scalars resident, and `cust_step` running the whole
line/seat/stall/serve-pay chain one call per customer at the reference's
own pass position — mid-frame resource exchanges preserved by
construction, the dine draw through the shared cursor, and the EVENT RING
real: the kernel emits codes, JS renders strings and pays the tip at
`payTip`'s own door (the kernel computes only the wallet clamp, so
conservation's referee never moved).

Kernel on/off: **1.71–1.75× interleaved best-of-5** (phase 4: 1.67–1.71),
kernel-side share of the unarmed bill ~42%. Absolutes this session are
neighbour-degraded (load 14–32) — ratios only; the quiet-box remeasure is
owed before any absolute-reading decision. The mutation discipline paid
twice: day-end digests provably cannot see queue-walk mutations (positions
converge to exact slots), so the agreement scenario grew the counter
planes and all five mutations bite there by name — including the wallet
clamp severing, which manufactures the negative wallet the clamp exists to
prevent. One vacuous-by-modular-arithmetic mutation recorded and escalated
rather than claimed.

Remaining JS: the kitchen machine (serve's seat/stall assignment writes
the same furniture planes this phase landed), the schedule chain, the
ferry/rooms/queue-build glue, and the dispatch self. Next: schedule+kitchen
as one unit, then the single-`tick()` hoist.

## Sources

- [Understanding the Performance of WebAssembly Applications](https://benchmarkingwasm.github.io/BenchmarkingWebAssembly/)
- [Not So Fast: Analyzing the Performance of WebAssembly vs. Native Code](https://arxiv.org/pdf/1901.09056)
- [Why WebAssembly is Faster Than asm.js — Mozilla Hacks](https://hacks.mozilla.org/2017/03/why-webassembly-is-faster-than-asm-js/)
- [Is WebAssembly magic performance pixie dust? — surma.dev](https://surma.dev/things/js-to-asc/)
- [Madrona: high-throughput batch world simulation on the GPU](https://madrona-engine.github.io/)
- [Overcooked in Thousands of Kitchens](https://bsarkar321.github.io/blog/overcooked_madrona/index.html)
- [An Extensible, Data-Oriented Architecture for High-Performance Batch Simulation (SIGGRAPH 23)](https://madrona-engine.github.io/shacklett_siggraph23.pdf)
- [WebGPU Compute Shader Basics — workgroup limits](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html)
- [WebGPU Memory Limits: maxStorageBufferBindingSize](https://ayoob.ai/blog/webgpu-maxstoragebufferbindingsize-limits-enterprise)
- [Provably-Safe Multilingual Software Sandboxing using WebAssembly (USENIX)](https://www.usenix.org/publications/loginonline/provably-safe-multilingual-software-sandboxing-using-webassembly)
- [How I made Traction Point moddable using Zig and WebAssembly](https://www.madrigalgames.com/blog/how-i-made-traction-point-moddable-using-zig-and-webassembly/)

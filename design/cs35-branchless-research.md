# CS3.5 BRANCHLESS RESEARCH — can the sim stop branching, and what "yes" would even mean

*Speculative research, 2026-08-22, owner-commissioned: "how you could make this
code branchless somehow.. we should at least find /why/ it's impossible?" —
refined mid-study to "or if not branchless then at least branching rarely
enough to get significant speedup" and "maybe cpu is ultimately best; just
highly optimized for cache locality." This doc answers all three framings,
from measurement. Sibling to `cs35-kernel-decision.md` (the WASM/WebGPU
decision record); this one owns the control-flow question. Instruments and
raw runs: `cs35-research/branchless/`.*

## THE ANSWER IN THREE SENTENCES

Strong branchlessness is impossible, and the irreducible core is nameable:
data-dependent control whose trip counts are the simulation's SUBJECT (who
re-picks an errand, how long an unstick probe runs, who is next in a queue).
But the measured control flow is already so stable per agent — the top-level
dispatch branch changes outcome once per ~900 executions, the full sub-state
dispatch once per ~100-120 — that on a CPU the branch bill rounds to zero and
the real bill is memory layout, exactly the owner's cache-locality instinct.
On GPU warps the feared 3-30x divergence discount measures as ~1.5-2x before
any mitigation, because the town's day structure phase-locks agents across
seeds — and the standard state-sorting cure (the branch becomes a batch key)
applies on top; so the constructive program is not "remove branches," it is
"finish making branches DATA (event codes, slice 6) and dispatch over them in
batches."

## 1. WHAT "BRANCHLESS" MEANS AT EACH LEVEL

Three different claims hide in the word:
- **Predication** — execute both sides, mask the result (`cmov`, SIMD masks,
  GPU auto-predication of short regions). Real branchlessness, costs the sum
  of both sides.
- **Predictable branching** — the branch exists but the hardware predictor is
  never wrong. On a modern CPU (TAGE-class), a branch that flips once per 100
  executions is effectively free; this is the CPU meaning of "rarely enough."
- **Coherent branching** — 32 SIMD lanes take the same side together. The GPU
  meaning; divergence serializes the warp per distinct side taken.

The question was measured at all three levels.

## 2. THE BRANCH CENSUS

**Static** (this tree, 62f0aaf): 2,175 `if` sites in game.js. Of these, the
hot per-tick sim functions (the `frame()` per-crab dispatch tree plus
customers/visitors/collide/schedule) hold **440**; `frame()` itself holds 151
of which ~35 sit inside day-gated blocks (midnight, payday, report cards) and
a large share of the rest are UI-adjacent (toasts, camera follow, open cards)
that the sim/view split sheds; **326** sit in `draw*` functions the split
sheds entirely. Zero `switch` statements — every dispatch is an if-chain over
strings, which is precisely what slice 6's event codes retire. 52 loops in the
hot set; 61 `Math.min/max` sites are already branchless-in-intent.

**Dynamic classes, measured** (32 seeds x 12 days baseline, 2.58M town-frames,
5.17M crab-ticks; grown-town variant 16 seeds with staffed businesses —
`coherence-32x12.txt`, `coherence-grown-16x12.txt`):

| class | measured weight | branch character |
|---|---|---|
| (b) state dispatch | 100% of crab-ticks flow through the 11-way `dayState` chain; **transitions 0.0011/crab-tick** (coarse), 0.0083-0.0101 at full `dayState:kstate:errand` granularity | The big one, and it is glacially stable: the chain re-resolves to the SAME target ~99% of executions even at sub-state level |
| (a) arithmetic-reducible | clamps/min-max/timer floors throughout accrual and movement | already effectively predicated; slices 1-3 made most of them integer selects |
| (c) rare events | illness 0.22-0.25 per town-DAY, polls 0.09, closures 0.09-0.10, walkouts 0.29-0.38 → per crab-tick ≤ 5e-5 | never-taken branches; free on CPU, epilogue-pass material on GPU |
| (d) heterogeneity | `p.job` splits `working` into kitchen/fishing kernels; personas/tastes are parameters, not control flow (post-slice-3 they are Q20 constants) | job is a stable per-agent key — batch-sortable; taste math is data |
| (e) string/identity | every dispatch compare is a string compare today | retires wholesale with slice 6 event codes; not a branch problem, a representation problem |
| (f) RNG-gated | draw sites are runtime-gated and low-rate (chatter rolls, illness rolls, wander) | contributes to cross-seed divergence only; within one town it is one branch, predictable-taken |

## 3. THE CPU MEASUREMENT — the dispatch is nearly free already

The instrument (a read-only probe wrapped around the game's own
`requestAnimationFrame` re-registration; consumes no RNG) counted, per crab
per tick, whether the dispatch target changed:

- **Top-level `dayState`: 0.00112 transitions/crab-tick** — the 11-way branch
  holds its target for ~894 consecutive executions per crab. Baseline towns.
- **Full sub-state `dayState:kstate:errand`: 0.0101** (baseline) /
  **0.0083** (grown towns) — even counting every kitchen micro-state
  (`walk`→`work`→`busingTable`→`toSlot`), the finest dispatch a per-agent
  interpreter would make re-resolves identically ~99 times in 100.

A TAGE-class predictor is not merely "usually right" on this profile — the
per-agent state IS the predictor's history, and it changes ~10 times per
agent per game-hour. Mispredict cost at 0.01/crab-tick with ~17 actors is
tens of cycles per tick against a ~500k-cycle tick budget: **noise.** The
same profile explains why the perf plan's measured hotspots are memory
phenomena (string fingerprint rebuilds, per-frame concats, closure allocs,
vm-global interceptor reads) and not pipeline flushes.

**Conclusion for the CPU rung: the branch bill is already paid.** A
cache-resident flat-state core (slice 6: one town's `Int32Array` state in L2,
event codes for strings, no property lookups) attacks the actual bill. The
owner's "cpu ultimately best, highly optimized for cache locality" is what
the numbers say too. Branch work on the CPU path is worth exactly one thing:
converting if-chains to dense jump tables over event codes, which is an
icache/decode courtesy, not a predictor rescue.

## 4. THE GPU MEASUREMENT — the schedule is a natural coherence machine

One-town-per-lane is the naive GPU mapping (32 towns in lockstep in a warp,
same code, divergence whenever two towns' crabs are in different states). The
feared discount was the plan's "3-30x." Measured, per crab slot, as the modal
state's share across seeds at the same tick:

| granularity | towns | modal share (mean over 12 days) | banded range |
|---|---|---|---|
| `dayState` (coarse) | 32 baseline | **90.2%** | late-night 97.9% … morning 85.8% |
| full sub-state | 16 baseline | **71.3%** | late 88.3% … morning 55.9% |
| full sub-state | 16 grown | **66.4%** | late 84.6% … morning 51.2% |

Two readings. First, the absolute: even at the finest granularity a warp's
lanes agree two-thirds of the time UNPREPARED — the town's phase-locked day
(everyone sleeps, shifts open on the clock, rushes happen at rush hour) is
a built-in coherence machine, and the serialization multiplier implied by
2-4 distinct live sub-states is **~1.5-2x, not 3-30x**. Second, the shape:
coherence is worst in the morning scatter (51-56%) and near-perfect late
(84-98%) — divergence is CONCENTRATED IN TIME, which is exactly the profile
that per-phase kernel specialization and state-sorting eat.

**Within one town** (the state-sorted alternative: agents bucketed by state,
one homogeneous kernel per bucket): grown towns run a **mean 3.0, max 4
distinct sub-states live per tick** across their crabs, from a vocabulary of
~50 observed combinations. Sorting ~20 actors into ≤4 buckets per tick is
trivially cheap; at 10k-town batches the same sort keyed across the whole
batch turns every branch of the dispatch into a kernel launch over a
compacted list — the standard ABM-on-GPU move (agents sorted by state so
adjacent lanes share control flow), and our bucket counts say the compaction
is dense, not fragmentary.

Rare events at ≤5e-5/crab-tick amortize to nothing when handled as epilogue
passes over compacted "it fired" lists rather than inline warp code.

Caveats, stated plainly: the probe keys on crabs, not visitors (visitor
`cstate` churn is faster; ~10 customers/tick vs ~2-7 crabs — a visitor-keyed
rerun is the obvious next measurement); slot alignment across seeds pairs
"crab index i" which underestimates coherence if roles permute; and modal
share bounds but does not equal the serialization multiplier (the true cost
is the count of DISTINCT states per warp-slot, which the bucket histogram
approximates from below).

## 5. WHERE PREDICATION WINS, AND WHERE IT IS HOPELESS

Predication-friendly (both sides cheap, worth masking in a compiled kernel):
needs accrual clamps, timer decrements, wage/tip arithmetic guards, the
AABB reject in collide (compute-both-and-select beats a mispredict ONLY on
GPU; on CPU the early-out is the win and is predictable), phase/BAM updates.
Post-slice-1/2/3 most of this set is already integer select-shaped.

Predication-hostile — the irreducible core, and the honest answer to "why is
it impossible":

1. **Errand selection** (`pickErrand`/`errandScore`): a data-dependent argmax
   over a variable candidate set whose SIZE is game state (which businesses
   are open, funded, reachable). Predicating it means every crab pricing
   every errand every tick — turning a ~1%-of-ticks cost into a 100% cost.
2. **Movement/unstick probes** (`updateStuck`, route warps, `giveBerth`):
   retry loops with data-dependent trip counts; the trip count is the
   *finding* (a stuck crab probes more). Worst-case-everywhere defeats the
   purpose.
3. **Queue service and market scans** (customers filter+sort per biz, fish
   market walk, housing ladder): order-dependent scans where the ORDER is
   economics (who waited longest, who is cheapest). A sort is inherently a
   branch tree; you can batch it, not mask it.
4. **The cascade property**: one flipped compare re-picks an errand, which
   moves a crab, which changes the next crab's collide set — slice 3's
   16-field fingerprint cascade is this mechanism observed. Control flow
   here is not an implementation detail of the sim; it IS the sim.

These four resist all three techniques *as inline code*. Every one of them
is, however, BATCHABLE: argmax over candidates, compaction of stuck crabs,
segmented sort of queues — all classic data-parallel primitives when hoisted
out of per-agent code into per-batch passes. Which is the verdict:

## 6. VERDICT — (c) with (a)'s constructive content

**The question dissolves under measurement.** Branchless-as-purity is
impossible for named, mechanical reasons (§5) — but the goal behind the word
is already ~99% achieved on CPU (the dispatch is stable enough that the
predictor retires it) and measurably cheap on GPU (~1.5-2x unprepared, not
3-30x, with standard state-sorting available on top). The sim does not need
fewer branches; it needs its branches to finish becoming **data** — integer
event codes dispatched over sorted batches — which is already slice 6's
destination. "Branching rarely enough to get significant speedup" is not a
future property; it is a measured present property the compiled targets
inherit for free.

## 7. THE CONSTRUCTIVE RESIDUE, RANKED (coherence bought per blast radius)

1. **Event codes + flat state (slice 6, already planned)** — retires every
   string compare, makes the dispatch a dense integer jump table (CPU icache
   win) and a sortable key (GPU batch win). The branchless program's whole
   substrate, zero new blast radius: it is byte-identical by gate.
2. **Phase-split the tick** (ride the sim/view split): hoist the day-gated
   blocks of `frame()` (midnight, payday, polls, report bookkeeping) into
   explicit phase passes instead of per-tick `if`s. Cheap, mechanical,
   removes most of `frame()`'s per-tick test bill and gives the batch
   scheduler natural kernel boundaries (the banded coherence structure —
   nights near-100% — becomes exploitable).
3. **Batch-keyed dispatch in the kernel** (rung 3/4 work, not a slice): sort
   agents (within a town: ≤4 buckets; across a 10k-town batch: compacted
   per-state lists) and run one kernel per state; rare events as epilogue
   passes over fired-lists. This is where the measured 66-90% coherence turns
   into ~1.0x divergence instead of ~1.5-2x — and it needs NO change to sim
   semantics, so it never touches the fingerprint discipline.

Not recommended: predicating the hostile four (§5) — worst-case-everywhere
arithmetic for a measured ~1% instability is a strictly losing trade on every
target.

## SOURCES

- [Madrona: An Extensible, Data-Oriented Architecture for High-Performance, Many-World Simulation (SIGGRAPH 2023)](https://madrona-engine.github.io/) — batch-throughput-over-latency scheduling, ECS for many-world GPU sim
- [GPUDrive: multi-agent driving simulation at 1M FPS on Madrona](https://arxiv.org/html/2408.01584v1)
- [A Survey on Agent-Based Simulation Using Hardware Accelerators](https://arxiv.org/pdf/1807.01014) — agents sorted by state so adjacent lanes share control flow (the standard divergence cure)
- [SIMD Divergence Optimization through Intra-Warp Compaction (ISCA 2013)](https://class.ece.iastate.edu/tyagi/cpre581/papers/ISCA13Divergence.pdf)

*Measurement scripts: `cs35-research/branchless/coherence.mjs` (+ `-fine`,
`-grown` variants), raw outputs alongside. Probe is read-only and RNG-silent;
runs used the cs35 tip at 62f0aaf (slices 1-2 landed).*

# CS3.5 NEURO AGENTS — deterministic brains in the integer sim (design + spike)

**Owner directive (Matt, 2026-08-22):** "as we develop behaviors in script
we'd like to be able to 'compress' them by training a small neural network
that we can run in-sim deterministically.. this will open up many things --
i imagine defining inputs/outputs and the compute will be a lot; i hope we
can utilize SIMD like instructions to batch inference across actors, and
maybe not have to do brain simulation on every step; worlds need to support
both CPU and neuro agents ofc." And, mid-work: "the neural crabs will have
to have appropriate inputs and outputs to act like sim crabs; this may
result in weird feature vectors so these should be customizable per brain
and per culture."

Everything below is measured or receipted; the spike lives in `tools/neuro/`
and does NOT ship into the game. Receipts in `tools/neuro/receipts/`.

## 1. THE NUMERIC RECIPE — proven bit-exact, three engines

Weights **int8**, activations **int16** in [0, 32767], accumulation exact
**int32**, one rounding per layer at a named arithmetic shift (floor — the
contract's rescale rule), **saturating** clamp (wraparound would let a
hostile document flip an argmax; saturation is monotone), ReLU as
`max(0, x)` exactly, argmax with **lowest-index tie-break** (risky-decision
5: every quantized argmax carries its tie-break). No exp, no tanh, no
floats anywhere — the banned list holds inside skulls too.

**Headroom proof:** |term| ≤ 127·32767 < 2²², 42-term row + bias < 2²⁸ —
int32-exact with three bits to spare, and the SIMD lane form
(`i32x4.dot_i16x8_s`, pairwise products ≤ 2²³) is exact in the same
arithmetic. This is why the recipe is portable *by construction*.

**The receipt** (`xcheck.mjs`): the spike brain over 27,567 held-out
decisions — the FULL logits stream, not just choices, FNV-hashed —
**bit-identical across node/V8 scalar JS, zig-cc wasm, and
JavaScriptCore** (`bf1cd69f` / `daf56b1` in all three).

**A lesson paid for again:** the wasm leg first diverged because the
module's C stack overlapped a low-memory data map — the SECOND module to
hit this. The kernel's convention (`-z stack-size=8192`, data at ≥16384)
is now the house rule for every future wasm module; `build-nn.sh` follows
it and says so.

## 2. THE SPIKE — vis_pick distilled into 1.1 KB

The sim is a perfect labeled-data factory: deterministic, and the script
labels its own inputs. `collect.mjs` wraps the reference `visPick` (a
module binding, reassigned through the closure evaluator — the suite's own
idiom, zero game-code changes) and logs the DECLARED input vector plus the
script's choice: **101,170 thinks across 32 towns** (half staged with the
full promenade so juicebar/arcade classes exist at all).

Trained: 42 → 24 → 7 MLP, seeded, minibatched. **The trainer's own bug is
the doc's first lesson:** per-sample updates with momentum killed every
ReLU in epoch one and left a net that had learned exactly the class priors
(loss parked at the prior entropy — the signature to recognize). Minibatch
64 with averaged gradients fixed it outright.

**The three numbers:**
- **Agreement with the script, held-out towns it never saw: 96.61% float,
  96.21% quantized** (quantization costs 0.40%). Per-class recall 68.5%
  (shack:drink, the rarest and most context-dependent class) to 98.1%
  (hotel:room). Disagreement anatomy: 790 net-acts-where-script-waits vs
  74 the other way and 181 act-vs-act — threshold-edge shaped, exactly
  where a lossy 42-feature view of the world should disagree.
- **Cost per decision: script 2.37µs (measured live in-town), brain 1.04µs
  scalar JS, 0.35µs wasm-batched — 6.9× cheaper than the script it
  compresses.** 1,176 MACs over 1,176 weight bytes: compute-light and
  utterly cache-resident.
- **Size: 1,176 int8 weights + 31 int32 biases = ~1.3 KB.** The
  compression claim is literal: the whole candidate-scoring behavior of a
  visitor, in less than the text of this section.

## 3. THE FEATURE VECTOR IS DATA (the owner's addition, built)

A brain does not get a hardcoded input layout. It DECLARES an ordered pick
list from a **registry of named observables** (`observables.mjs`):
`need.hunger.q20`, `wallet.cents`, `stop.dist.px:juicebar`,
`stop.taste.best:showers`... — each with declared units, encoding, and
clamp into [0, 32767]. Parameterized names (`stop.open:<biz>`) are the
registry's derived layer: the derivation is registry code (trusted,
versioned), the document only picks. **The registry is the trust
boundary** — an unknown name is a loud, actionable validation error
(the culture-id lesson: silence at an import door costs a debugging day),
never a silent zero. `MAX_INPUTS = 64` is the assembly fuel cap;
`REGISTRY_VERSION` gates artifacts (a brain trained against v1 semantics
fails loudly at load under v2, with both versions in the message).

The spike's own vector went through `resolve()` — the customizability
claim has a receipt, not a promise. A pig's brain can consume
`stop.taste.best:showers` and class register where a crab's doesn't, per
brain, per culture, no schema migration.

## 4. THINK CADENCE AND SIMD — the honest phasing

Measured across 32 towns: **0.0391 thinks per tick** (~280 visitor
decisions per sim-day). At the wasm-batched 0.35µs that is **~0.1ms of
cognition per sim-day** against a ~90ms sim-day: the entire town's brain
bill is noise. So, honestly:

- **SIMD is phase-2.** It is real and it is legal — WASM SIMD128's
  *integer* lanes are bit-exact everywhere (the determinism boundary is
  RELAXED-simd and float lanes: those stay banned); `zig cc -msimd128`
  emits it; `i32x4.dot_i16x8_s` is this recipe's natural instruction and
  4-8× is the plausible multiple. Build it when a trigger fires: brains
  ×100 bigger, every actor thinking, or batch-science towns by the
  million. Not before.
- The owner's "not every step" instinct is already the architecture:
  thinks are events (the think-slot pattern the kernel ports formalized),
  brains run per-think, and the cadence number above is why that design
  wins.

## 5. BOTH KINDS COEXIST — the policies section

The cultureway document grows a `policies` section; per culture, per
DECISION SURFACE, a policy is one of `table` (Layer-0, today's hook
tables), `script` (the engine's own reference behavior), or `brain`:

```
"policies": {
  "vis_pick.candidate": {
    "kind": "brain", "registryVersion": 1,
    "inputs": ["need.hunger.q20", ...],          // picks, order = vector
    "classes": ["none", "shack:food", ...],       // the declared output space
    "arch": {"in": 42, "hidden": 24, "out": 7},
    "shifts": {"R1": 6},
    "w1": [...int8...], "b1": [...], "w2": [...], "b2": [...]
  }
}
```

Decision surfaces are a REGISTRY too (the substrate doc's hook-table
registry and this one unify — one catalog of named surfaces, each with its
declared observable set and output space). The calling convention is
identical for all three kinds: same assembled integer inputs, same output
space, and **brains are draw-free** — a surface that wants randomness
declares a pre-drawn u32 as an input observable, so the draw-count
discipline is preserved *by construction* whoever is deciding (candidate
construction and recipe draws stay in the shared harness, exactly as the
spike found them).

**Hostile-file numbers** (the posture, made concrete): inputs ≤ 64,
hidden ≤ 256, layers ≤ 4, params ≤ 32,768 (32 KB of int8), fuel = MACs
≤ 65,536 per inference, all weights range-checked int8 at load, outputs
meaningless outside the declared class list (index-checked), registry
version must match. Everything clamps or fails loudly; nothing executes.

## 6. TRAINING AS A WORKFLOW

Training lives OFFLINE in tools (and, next, behind an MCP
`policy_distill` tool so an authoring agent runs collect → train →
validate → test in the same loop it authors cultures with — the batch
instrument is the data factory at scale). Reproducibility, honestly
stated: **the artifact is the requirement, the run is not.** Weights ship
as integers and replay bit-exactly forever; the training run is seeded
and usually reproduces, but nothing downstream depends on it.

## 7. WHAT THIS OPENS, AND THE OPACITY POSITION

Opens, roughly costed: behavior compression (this spike: a scoring
function → 1.3 KB, 6.9× faster); learned-not-authored cultureways (CS4
evolutionary search over policy weights on the batch instrument — and the
GPU rung *loves* this shape: dense identical matmuls, zero divergence,
batch-by-cultureway already the plan); per-individual variety (weight
noise per crab, deterministic from the town seed).

**The opacity tension, taken head on.** "Interface opacity is a bug,
economic uncertainty is the game" governs the PLAYER interface — and a
brain is no more opaque to a player than `visPick` ever was; players read
the town, not game.js. The real tension is AUTHORIAL: the devlog narrates
named crabs with reasons, and a net has none to give. Two mitigations,
one rule. Mitigations: the registry declaration IS a legible statement of
what a creature can see (narrate from observables — "she was hungry and
the shack was close" remains true and checkable); and artifacts carry
provenance (what script, what towns, what agreement). The rule:
**distill behavior, don't optimize outcomes** — training targets are what
an incentive-following reference DID, never town-level win metrics.
RL-against-outcomes is how a brain learns to puppeteer; distillation of
an incentive-driven script inherits incentives-not-puppeteering by
construction, and the matrix referees any brain that ships.

## 8. THE RECOMMENDATION LADDER

1. **Formalize the two registries in the engine** (observables + decision
   surfaces) — shared by tables, brains, and the MCP authoring loop.
2. **`policies` section in the cultureway schema** with the loader clamps
   above (validation errors actionable, per the substrate standard).
3. **A brain slot on vis_pick behind the agreement gate**: a brain-armed
   town vs a script town, compared by the suite the way kernel-vs-JS is,
   matrix refereed. First shipped brain: a culture whose visitors are
   *meant* to choose a little differently — a brain that is allowed to be
   96% faithful is a personality, not a bug.
4. **MCP `policy_distill`** — the authoring loop closes.
5. SIMD lanes and evolutionary search when their triggers fire (§4, §7).

*Spike receipts: `tools/neuro/receipts/` (data meta, brain artifact,
xcheck hashes in this doc). Suite 279/279 exit 0 both backends on the
spike branch; bench fingerprint unchanged at the pin — the spike is
additive, as a spike must be.*

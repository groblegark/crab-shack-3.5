# ONE MIND OR MANY — the trunk decision

Matt's question, near-verbatim (2026-08-23): "do we want a bunch of separately
trained small models or a single medium sized one trained with more parameters
and data, so as to take advantage of generalization; and then we specialize it
sort of at the last minute, sort of like 'prompting' it with the actor it has
to be; and then we specialize that model per crab later."

The candidate architecture, one line per layer of specialization:

    engine   shared trunk (one integer MLP body, every actor's thinks)
    culture  conditioning vector — E=8 int16s the CULTUREWAY DOCUMENT carries
    surface  one head per decision surface (vis_pick 7-way, cit_errand 13-way)
    actor    the dream-spike's last-layer delta, in the save (490 B here)

## THE EXPERIMENT

Run `cs-trunk-spike-4fb4afe-80kf` (8 arms, gasboat-prod, receipts banked at
design/cs35-research/kube-runs/cs-trunk-spike-4fb4afe-80kf/ and mirrored in
tools/neuro/trunk-spike/receipts/). Same instrument throughout: both
architectures trained by the shipped distillery recipe (momentum SGD, batch
64, lr 0.05·0.9^ep, 18 epochs, `none` at the sim's own prior), on the same
corpora (vis-crab and vis-gull regenerated deterministically in-pod, 32 towns
× 12 days; the committed 215k-row citizen corpus), scored by the QUANTIZED
integer forward on by-town held-out splits, 3 training seeds each.

Budget parity: separates = the three shipped hidden-48 nets, **7,200 int8
weights** total. Trunk: unified 80-name input union + 8-int prompt, hidden
**H=66**, both heads = **7,128 weights** — 1% SMALLER.

## THE TABLE (quantized held-out agreement, mean of seeds 7/11/42)

| surface·culture | separates (3×h48) | trunk (H66 + prompt) | delta |
|---|---|---|---|
| visitor·crab | 98.56% (.9840–.9880) | **99.02%** (.9892–.9910) | **+0.46pp, 3/3 seeds up** |
| visitor·gull | 98.26% (.9801–.9845) | **98.68%** (.9857–.9882) | **+0.42pp, 3/3 seeds up** |
| citizen·crab | 98.11% (.9807–.9815) | 98.12% (.9806–.9820) | +0.01pp — flat |

**Generalization is real and interference is absent.** The trunk beats the
separates on BOTH visitor cultures on every seed — pooled data across
cultures and surfaces teaches shared economics the small nets each had to
relearn alone — and the citizen surface, structurally most different, is
untouched (no cross-surface tax). At the SAME budget: the win is
architecture, not capacity.

## ZERO-SHOT: WHAT THE PROMPT BUYS

Trunk trained with gulls ENTIRELY held out (arm `zeroshot`), then scored on
gull visitors:

| gull condition | agreement |
|---|---|
| zero embedding | 93.44% |
| wearing the crab prompt as-is | 98.10% |
| **8-int prompt tuned on 1,000 rows** | **98.31%** |
| (reference: separate net trained on ALL gull data) | (98.26%) |
| (reference: trunk trained on all gull data) | (98.68%) |

**A culture the mind has never seen, carrying only 8 tuned integers, beats
the fully-trained status-quo net.** That is the priced answer to "a new
cultureway arrives with a prompt instead of a corpus." Honest caveat: gulls
share the visitor surface and differ from crabs by tastes/purse — a culture
with genuinely alien mechanics will land lower; the 93.44% zero-embedding
row is the floor the prompt lifts from.

## DELTA COMPATIBILITY (rung 0 composes)

The dream-spike rule verbatim (ESH=8, USH=11, saturating clamps), per-town
on the trunk's vis head, 40 nights × 256 replays: **21/32 towns up, 2 down,
9 flat; mean 98.81% → 99.03%**; clamps engaged and held (|w2d| hit the 127
rail, nothing drifted); 490 bytes per actor. Personalization composes with
the trunk exactly as it did with the separates.

## COST

Per-think integer ops: trunk ≈ 6,270 mult-adds (88×66 + 66×7) vs separate
≈ 2,352 — **2.7× per think**, on an operation measured in microseconds at a
think cadence of ~0.02/tick: invisible at d/s scale. In exchange, EVERY
actor in town runs the same weight image — the SIMD/batch best case (one
i32x4.dot kernel, no per-culture weight swaps). Same headroom proof as the
shipped recipe (int32-exact; R1=6 fitted).

## WHAT THE CULTUREWAY CARRIES

One new row: `mind.prompt` — 8 int16s in raw input units [0, 32767], data
like any other section (clamped, hostile-file-safe, diffable). The trunk is
engine substrate; heads are engine-owned per surface; the per-actor delta
stays save-state. The zeroshot arm's tuned gull prompt, for the record:
`[5813, 566, 12961, 1564, 3727, 2810, 6508, 1699]`.

## VERDICT

**Adopt the trunk.** At equal parameters it is better on two surfaces, equal
on the third, gives new cultures near-parity behavior from 8 integers, keeps
the delta ladder intact, and simplifies the batching story to one weight
image. Recommended path: build the OWNER mind (the next surface) on the
trunk from day one; migrate visitor+citizen brains to it at that landing's
re-baseline (one fingerprint ceremony, not three). The decision Matt must
make: migrate-existing-minds-at-the-owner-landing (one big re-pin, ruled
here as recommended) vs trunk-for-new-surfaces-only (no re-pin, two
architectures live indefinitely).

## RULED (Matt, 2026-08-23, main conversation): "one architecture; yes"

The trunk is adopted AND the existing visitor + citizen minds migrate onto it
at the owner-mind landing — one re-pin ceremony, one architecture. No period
of two brain architectures living side by side. (Recorded by the orchestrator
from Matt's message.)

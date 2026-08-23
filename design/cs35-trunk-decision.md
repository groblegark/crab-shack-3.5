# ONE MIND OR MANY — the trunk decision

Matt's question, near-verbatim (2026-08-23): "do we want a bunch of separately
trained small models or a single medium sized one trained with more parameters
and data, so as to take advantage of generalization; and then we specialize it
sort of at the last minute, sort of like 'prompting' it with the actor it has
to be; and then we specialize that model per crab later."

The candidate architecture, one line per layer of specialization:

    engine   shared trunk (one integer MLP body, every actor's thinks)
    culture  conditioning vector — E int16s the CULTUREWAY DOCUMENT carries
    surface  one head per decision surface (vis_pick 7-way, cit_errand 13-way)
    actor    the dream-spike's 364-byte-class last-layer delta, in the save

## THE EXPERIMENT (all arms on the cluster; run receipts in
## design/cs35-research/kube-runs/, banked copies beside this doc's close-out)

Same instrument throughout: both architectures trained by the shipped
distillery recipe (momentum SGD, batch 64, lr 0.05·0.9^ep, `none` kept at the
sim's own prior — the v3 lesson), on the same three corpora (vis-crab and
vis-gull regenerated deterministically in-pod at 32 towns × 12 days; the
committed 215k-row citizen corpus), judged by the QUANTIZED integer forward
on by-town held-out splits, at 3 training seeds each.

The parameter budget is fixed at the three shipped separates' own size
(3 × hidden-48 nets), and the trunk's hidden width is whatever that budget
buys once the unified input space (union of the two registries' names) and
both heads are paid for.

## THE TABLE

(filled from receipts — run pending)

## ZERO-SHOT: WHAT DOES THE PROMPT BUY?

Train the trunk with gulls entirely held out, then score gull visitors under
(a) a zero embedding, (b) the crab embedding worn as-is, (c) an embedding
finetuned alone — the 8 ints a new cultureway document would carry — on 1,000
rows. This prices "a new culture arrives with a prompt instead of a corpus."

(filled from receipts)

## DELTA COMPATIBILITY (rung 0 composes?)

The dream-spike's per-actor rule (ESH=8, USH=11, saturating clamps), applied
per-town to the trunk's vis head. The claim to verify: personalization
composes with the trunk exactly as it did with the separates.

(filled from receipts)

## COST

(filled from receipts: param counts, per-think integer-op counts, projected
d/s — plus the SIMD note: one weight image for every actor in town is the
batching story's best case.)

## WHAT THE CULTUREWAY WOULD CARRY

A `mind` (or `policies.embedding`) row: E int16 values in raw input units
[0, 32767] — data, clampable, hostile-file-safe, exactly like every other
section. The trunk itself is engine substrate (like the kernel); the heads
are engine-owned per surface; the delta stays save-state per actor.

## VERDICT

(written after the table)

## RULED (Matt, 2026-08-23, main conversation): "one architecture; yes"

The trunk is adopted AND the existing visitor + citizen minds migrate onto it
at the owner-mind landing — one re-pin ceremony, one architecture. No period
of two brain architectures living side by side. (Recorded by the orchestrator
from Matt's message; the fork's final doc version merges beneath this ruling.)

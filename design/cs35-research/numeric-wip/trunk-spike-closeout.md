# TRUNK SPIKE — close-out

**Question** (Matt, 2026-08-23): separate small nets per (surface, culture)
vs one shared medium net conditioned per actor ("prompting"), specialized
per crab later. **Answer: the trunk wins at equal parameter budget — adopt.**
Full table + verdict: design/cs35-trunk-decision.md.

## What ran

Branch `trunk-spike`. New code: `tools/neuro/trunk-spike/run.mjs` (one
cluster-arm entrypoint, four modes: sep | trunk | zeroshot | delta) +
`experiments/trunk-spike.json` (8 arms). All corpora regenerated
deterministically in-pod (vis-crab, vis-gull via the distillery's own
collectRows; the committed citizen corpus) — nothing trained or evaluated
locally; the box never simulated a town. Receipts:
design/cs35-research/kube-runs/cs-trunk-spike-4fb4afe-80kf/ (all 8 arms
exit 0, 522–620s each), mirrored to tools/neuro/trunk-spike/receipts/.

## Headline numbers (quantized, by-town held-out, 3 seeds)

- vis-crab 98.56% → **99.02%** (trunk, 3/3 seeds up)
- vis-gull 98.26% → **98.68%** (3/3 up)
- cit-crab 98.11% → 98.12% (flat — no cross-surface interference)
- zero-shot gull with an 8-int tuned prompt: **98.31%**, beating the
  fully-trained separate (98.26%); zero-embedding floor 93.44%
- delta composes: 21/32 towns up, mean 98.81→99.03, clamps held, 490 B/actor
- cost: 2.7× int-ops per think (µs-scale, d/s-invisible); one weight image
  for all actors = the SIMD case

## Incidents

1. **Karpenter consolidation killed the first run 8/8** at ~180s ("Evicted
   pod: Underutilized", backoffLimit 1 → dead Job, zero receipts). Sibling
   jobs were losing pods the same way. FIX (this branch, chart-level):
   `karpenter.sh/do-not-disrupt: "true"` pod annotation — batch arms run to
   completion; the pool still scales down on completion (verified: 7→0
   nodes post-clean). **The orchestrator should upstream this — it affects
   every substrate user.** Runbook lesson candidate #9.
2. Wall-time reality: an arm = corpus regeneration (~2 sims × 32 towns) +
   training; 9–10.5 min at 2cpu. The first run died before showing this;
   budget arms at pod speed, not laptop speed.

## Honest limits

- Gulls are near-crab (same surface, taste/purse differences); zero-shot on
  a mechanically alien culture will land nearer the 93% floor. The prompt
  is a head start, not a corpus replacement for genuinely new behavior.
- 18 epochs (vs the retrain's 25) for arm wall-time; both architectures got
  the same 18 (instrument purity) — absolute numbers would all drift up a
  hair at 25, the comparison would not.
- The trunk here was NOT wired into the game; this is an architecture
  measurement. Migration = its own landing with the full ceremony (the
  decision doc recommends riding the owner-mind landing).

## Decision for Matt

Migrate visitor+citizen minds onto the trunk at the owner-mind landing (one
re-pin ceremony, recommended) — or trunk-for-new-surfaces-only, keeping two
architectures live indefinitely.

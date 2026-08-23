# CITIZEN-MIND SCIENCE #1: what the thinking crabs actually do better

THE QUESTION. With the citizen mind LIVE, the growth ceremony read 19/48
escapes against the script teacher's 15/48 — and the brain agrees with the
script 99.82% of the time in town. So roughly one decision in five hundred
carries a four-escape swing. WHICH decisions? Matt: "dial in on what
behaviors are working better with the neural crabs... this can be our first
science experiment."

## Method

Three instruments, one entrypoint (the ceremony's own headless runner), all
arms on the cluster per the kube policy:

1. **The paired corpus** (phase 1): the LIVE arm re-run with a divergence
   log — at every brain-governed think, the script's counterfactual pick is
   computed inline (both scorers are draw-free, so the log cannot move the
   trajectory); every disagreement is banked with actor, day, classes, and
   needs. The SCRIPT arm re-runs beside it, same seeds, same flags — the
   19-vs-15 baselines are REBUILT in this run's own receipts per the
   runbook's same-instrument rule, never quoted from the close-out.
2. **The bucket table**: disagreements grouped by directional class pair
   ("brain holds where script buys a shack drink" ≠ its reverse), with
   frequencies, distinct actors, and town outcomes.
3. **Class-selective knockouts** (phase 2, the causal arm): re-run LIVE with
   ONE disagreement pair handed back to the script — the growth delta vs the
   phase-1 live arms is that pair's causal share of the four escapes.
   Correlation nominates; only a knockout convicts.

The turnout thread rides the same receipts: every arm banks each election's
papers/roll, and a vote-class knockout separates cause from side-effect.

CAVEAT, stated up front: the divergence log is a LOCAL counterfactual — after
a divergent think the two towns' histories differ, so the log maps where the
minds part, not what would have happened next. The knockouts carry the causal
weight; the corpus aims them.

## The instrument fight (banked so nobody relearns it)

Six failed launches taught the substrate three lessons, all now in the
manifests:

- **A pod's Node sizes V8 off the HOST, not the cgroup** — seven workers'
  lazy heaps ballooned past the pod limit and the kernel killed the arm at
  4Gi and again at 8Gi. `--workermem` (fork execArgv old-space cap) exists
  now.
- **Heap caps don't cap RSS** — a main-realm worker carries ~1GB beyond its
  old-space (compiled source, externals); seven residents peak together
  right when the first towns finish (~190s, every attempt). The fix that
  finally held was SHAPE, not tuning: 4-town arms, 2 workers, 4Gi pods —
  small enough that the ceiling stops being negotiated with.
- **backoffLimit 1 on a busy pool tears down healthy arms**: one flaky pod
  start + a retry that can't schedule = the whole job FailureTarget while
  four green arms get killed mid-run. Launch on a quiet pool; receipts are
  the verdict, Job status is a mood.
- **Arm wall-time projection** (for the runbook): about
  `towns x days / (0.65 x workers)` vCPU-seconds-per-lived-day on m5 —
  and measure, don't assume laptop cores; the observed small-arm wall ran
  far past the naive figure.

## The decomposition

(filled from receipts: kube-runs/<release>/summary-cit-science.json)

| pair | thinks | share | causal growth share (knockout) |
|---|---|---|---|
| TBD | | | |

## The turnout verdict

(filled from receipts: live vs script papers/roll, and the vote knockout)

## Stories

(filled from the corpus's story seeds)

## The honest residual

(what share of the +4 escapes no knockout claims)

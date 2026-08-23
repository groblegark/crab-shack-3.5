# CLOSE-OUT: the kube substrate sprint (2026-08-23)

**Policy trigger (Matt, verbatim):** "it looks like our science is getting
bigger than our box. new policy: any parallel node runs must use the
kubernetes infrastructure (do a sprint on this to establish baseline
capabilities and best practices." Two spend-limit outages and one full
machine crash in one day, all under concurrent local suite batteries.

## What shipped

- **suite.mjs `--slice i/N` + `--count`**: standalone shard mode (the IPC
  `--_run` worker mode crashes with no parent); a pod runs a stride slice
  in-process and exits red on any failure. Smoke-tested: slice 0/104 = 3
  scenarios green locally, then 16 slices green on the cluster.
- **tools/kube-arm.mjs** (pod-side): picks arms[JOB_COMPLETION_INDEX] from
  the committed manifest, allowlists entry (tools/**.mjs) and env
  (SIMLIB_*), runs it, banks ONE ConfigMap receipt (verdict line, FAIL
  lines, JSON tail, capped stdout) via the pod ServiceAccount BEFORE exit.
- **Chart v2**: values are (gitRef, manifest, arms[, parallelism]); the
  container is a thin `node tools/kube-arm.mjs`. helm lint clean.
- **tools/kube.mjs** (operator-side): run/status/collect/clean, `run
  --wait` end-to-end. Preflight refuses: dead session (prints the login
  command), non-gasboat context, missing/uncommitted/divergent manifest,
  unpushed SHA — each exercised and failing loud (receipts of the error
  strings in this sprint's transcript; the dirty-manifest check needed a
  substantive edit to trip, trailing whitespace is forgiven by trim).
- **experiments/**: suite-312.json (16 arms, 8 slices x js/wasm),
  matrix-triple16.json (6 batch.mjs arms). Both carry the ephemeral-pool
  nodeSelector + `gasboat.ephemeral=true:NoSchedule` toleration, probed
  live from the nodepool spec.
- **design/cs35-kube-runbook.md**: policy, verb, manifest shape, measured
  capabilities, eight lessons-with-scars.

## Measured baselines (ref b7e6a66; receipts in design/cs35-research/kube-baseline/)

- Suite both backends: **624/624** merged from 16 receipts, ~9 min wall
  including provisioning (arms 55-224s). The Job read `failed=2` while
  every receipt was green — pods can die at teardown AFTER banking;
  **receipts are the verdict, Job status is a mood** (runbook lesson 1).
- Triple-16 matrix: **2m06s** wall, baseline 0/48, growth 13/48 on the
  batch instrument (NOT comparable to the citizen close-out's headless
  same-instrument 19-vs-15 — runbook lesson 8).
- Throughput, current tree: 4.3-5.1 lived d/s per 7-worker m5 pod
  (~0.65 d/s/vCPU; the 0.89 era predates brains/cultures/separation).
- Scale-down: verified 0 ephemeral nodes after every clean; karpenter
  also self-drained between runs.

## Incidents during the sprint (all fixed, all in the runbook)

1. kube.mjs crashed AFTER `helm install` (sh() vs stdio:inherit) and the
   retry installed a twin release — caught in helm list, twin killed,
   double-spend lesson 6.
2. js suite slices OOM'd at 4Gi UNBANKED twice (wasm twins green) —
   memory to 8Gi, lesson 3; pod forensics were already GC'd, lesson 2.
3. node:26-slim has no git — SHA now read from .git/HEAD, lesson 7.
4. An accidental full local `batch.mjs --help` run (it has no --help and
   ran 64 towns) — the policy's first violation was its author, ~40s.
   kube-arm validates args against nothing but the manifest; local bare
   invocations of batch tools are the hazard, don't probe with them.

## Honest gaps

- `collect` merges suite verdicts and prints batch JSON tails; science
  arms will want a pluggable merger (the science fork owns its shape).
- No cost accounting beyond node-count x wall estimates; if spend
  matters harder, a Kubecost-style read is future work.
- The stray `baseline-4k` helm release record from the pre-v2 era is
  still installed (its job long reaped; zero cost) — left for the
  orchestrator to delete or keep as an heirloom.
- Local gate policy interaction: merges still gate locally today; moving
  the MERGE gate to `kube.mjs run experiments/suite-312.json --wait` is
  a one-line orchestrator habit change, recommended.

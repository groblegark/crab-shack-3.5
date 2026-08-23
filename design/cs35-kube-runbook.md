# THE KUBE RUNBOOK — parallel runs on the cluster

**The policy (Matt, 2026-08-23, verbatim):** "it looks like our science is
getting bigger than our box. new policy: any parallel node runs must use the
kubernetes infrastructure." Concurrent local suite batteries crashed the Mac
twice in one day. The laptop gets single-process dev work and at most ONE
sequential gate (`--jobs 4` ceiling, one battery at a time, never while
another sim workload runs). Everything that fans out — suite batteries,
seed matrices, science sweeps, neuro collection — runs on the cluster.

## The one verb

```sh
export AWS_PROFILE=gasboat-prod        # every shell; the env does not persist
node tools/kube.mjs run experiments/<manifest>.json --wait
```

`run --wait` = validate -> install -> watch -> collect (receipts land in
`design/cs35-research/kube-runs/<release>/`) -> clean (uninstall + delete
cluster receipts + VERIFY karpenter scale-down). `--keep` skips the clean;
`status`/`collect`/`clean` exist as separate verbs. `--parallelism N` caps
concurrent pods (spend guardrail).

A RUN is `(gitRef SHA, committed manifest, arms)`. kube.mjs refuses: a
dead AWS session (prints the login command), a non-gasboat kube context, a
manifest missing/uncommitted/divergent at the SHA, and a SHA on no remote
branch. **The pod clones the remote at the pinned SHA — your uncommitted
tree does not exist to it.**

## Experiment manifests (experiments/*.json)

```json
{ "name": "suite-both",
  "resources": { "requests": {"cpu":"2","memory":"6Gi"}, "limits": {"cpu":"2","memory":"8Gi"} },
  "nodeSelector": { "karpenter.sh/nodepool": "ephemeral-pool" },
  "tolerations": [{ "key":"gasboat.ephemeral","operator":"Equal","value":"true","effect":"NoSchedule" }],
  "arms": [
    { "id":"js-0", "entry":"tools/suite.mjs", "args":["--slice","0/8"], "env":{"SIMLIB_REALM":"main"} } ] }
```

- One ARM = one indexed pod = one receipt. `entry` must be a committed
  `tools/**.mjs`; `env` is allowlisted to `SIMLIB_*`.
- Suite arms use `--slice i/N` (standalone shard mode, no IPC; `--count`
  answers how many scenarios exist). Matrix/science arms use batch.mjs or
  headless flags verbatim.
- The ephemeral pool: `karpenter.sh/nodepool=ephemeral-pool`, taint
  `gasboat.ephemeral=true:NoSchedule` (probed live 2026-08-23), m5
  xlarge/2xlarge on-demand, pool limit 400 cpu.

## MEASURED BASELINE CAPABILITIES (2026-08-23, ref b7e6a66 = tip dc0f4b7 + this branch)

| workload | shape | wall (incl. provisioning) | verdict |
|---|---|---|---|
| Full suite, BOTH backends | 16 arms x 2cpu (8 slices x js/wasm) | ~9 min (arms 55-224s; nodes ~60-90s) | 624/624 passed, merged from receipts |
| Triple-16 growth matrix | 6 arms x 8cpu (batch.mjs --json) | **2m06s** | baseline 0/48; growth 13/48 (batch instrument) |
| Throughput (current tree) | per 7-worker m5 pod | 4.3-5.1 lived d/s (~0.65 d/s/vCPU) | down from 0.89 pre-culture-era: the sim got richer |
| Scale-down | after clean | verified 0 ephemeral nodes, ~minutes | karpenter is prompt; clean checks anyway |

Receipts: design/cs35-research/kube-baseline/. Rough cost per suite run:
~7-12 m5 nodes x ~10 min ≈ well under a dollar.

## Lessons with scars (do not relearn)

1. **Receipts are the verdict; Job status is a mood.** A pod can complete
   its work, bank its receipt, and still be counted failed (teardown on a
   reaped node). The suite baseline read `failed=2` while all 16 receipts
   were green. `collect` judges by receipts: count == arms, exit codes 0.
2. **Receipts as ConfigMaps BEFORE exit** — stdout on the ephemeral pool
   dies with the node (the 4,096-town run whose only copy of the science
   died with karpenter's nodes). Pod objects are GC'd fast too: forensics
   on a failed pod has a lifespan of minutes. Bank early, bank always.
3. **A slice holds its worlds in one heap.** `--slice` runs ~39 scenarios
   sequentially in ONE process (local `--jobs` forks per scenario). The js
   backend slices OOM'd unbanked at 4Gi; 8Gi clears comfortably. If slices
   grow, split finer (more arms), don't fatten nodes.
4. **--set is a trap; overlays are not.** Booleans and nested values ride
   the generated values-file overlay (kube.mjs writes it), never --set.
5. **Job templates are immutable** — there is no editing a live run.
   uninstall, fix, reinstall. backoffLimit stays LOW (1): a red arm is a
   verdict, not a flake to buy twice.
6. **Crash-after-install is a double-spend** — kube.mjs once crashed
   after `helm install` and the retry installed a twin. If kube.mjs ever
   dies mid-run: `helm list -n crab-science` FIRST.
7. **node:26-slim has no git.** The clone lives in the init container;
   the SHA comes from `.git/HEAD` (detached = raw SHA).
8. **Same-instrument or it isn't a comparison.** The batch-instrument
   growth (13/48 at dc0f4b7) is not the citizen close-out's headless
   same-instrument A/B (19 vs 15). Never quote across instruments; run
   both arms in the same manifest.

## How a fork prepares a run

1. Commit everything the pod needs (entry tools, manifest) on your branch;
   `git push cs35repo <branch>:<branch>` (pod-clone refs are allowed).
2. `node tools/kube.mjs run experiments/<yours>.json --wait` if the
   operator session is live; otherwise hand the orchestrator that exact
   command in your report.
3. Quote results as (gitRef, manifest path, receipt verdict). Bank the
   collected receipts with your close-out.

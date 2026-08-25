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

**A gasboat `cs` fleet pod CAN now drive the cluster — PROVEN end to end
2026-08-25** (kd-bk9jS2Yp3Q / kd-wbdYahwATd, both closed). `node tools/kube.mjs
run experiments/sci-focus.json --ref <SHA> --wait` from a fresh cs pod ran
install -> 2 arms -> receipts -> MERGED SUITE VERDICT 2/2 passed -> uninstall ->
scale-down verified. Three blockers had to fall for this, each a separate fix:
(1) preflight now proves the cluster by CA bytes, not context name (main
9eb0143) — a pod legitimately has no kubeconfig context; (2) the `crab-science-runner`
Role gained rbac roles/rolebindings verbs incl. delete (escalation kd-Y7RzIznJAw,
2026-08-25) so helm can install AND uninstall its per-release Role/RoleBinding;
(3) kube.mjs no longer hardcodes `helm install --create-namespace` (main 0fc9e1b)
— it demanded a cluster-scope namespace CREATE the least-privilege SA correctly
lacks, though crab-science already exists. The earlier "OPERATOR-SIDE ONLY"
reading was three tool bugs stacked (runbook lesson #9), not a substrate wall.
The operator's Mac path is unchanged and still works.

What a pod CAN do — and should, per CLAUDE.md's scope note, since the local ban
protects the operator's Mac and a fleet pod IS cluster compute — is run sim
workloads in-pod within its own limits: `node tools/suite.mjs --jobs N`,
matrices, probes. That is enough to GATE. Cluster access buys back the wide
fan-outs, not the ability to get a verdict at all. Leave headroom when peers
are running, and per the perf note below, never read a timing from a box
running two sims.

### "within its own limits" means the CGROUP, not `nproc` (fixed 2026-08-25)

**A fleet pod cannot brown out its node — but it can badly oversubscribe
itself, and for months it did.** The pod is cgroup-capped (`limits.cpu=4`,
`requests.cpu=2`, `cpu.max = 400000 100000` → a hard 4 cores) while sitting on
a 16-core m5.4xlarge. Neighbours are protected by the kernel, not by our
manners. But `nproc` and `os.cpus().length` both report the HOST's 16:

    os.cpus().length          => 16   # the host. WRONG number to schedule on.
    os.availableParallelism()  => 4   # cgroup-aware. This one.

`headless.mjs` defaulted to `min(seeds, 15)` workers and `batch.mjs` to
`16-2 = 14` — onto a quota of 4, a ~3.75x self-oversubscription (`cpu.stat`
`nr_throttled` was already climbing). Throttling only makes runs slow; the
sharp edge is MEMORY, since a worker holds its worlds in one heap (lesson #3:
js slices OOM at 4Gi) and 15 heaps against a 16Gi limit is an OOMKill. And a
timing taken while throttled is a lie that looks like a clean single run.

Both now default from `tools/cores.mjs` (`usableCores()` = min of libuv's
answer and the cgroup quota we parse ourselves — two derivations, so a wrong
one is visible). `batch.mjs` prints `cores:` and banks `cores` in its JSON;
`headless.mjs` prints the worker count whenever it forked. **This changed no
cluster receipt: all 29 forking arms across the 36 manifests pass `--jobs`
explicitly, and an explicit `--jobs` is still obeyed verbatim.** Determinism
is unaffected — `--seeds 3` gives byte-identical output at `--jobs 3` and
`--jobs 1`.

Practical upshot: on a 4-core pod you get ~3 workers, so budget accordingly
and don't hand-pass a big `--jobs` to "go faster" — you will only buy
throttling and risk an OOMKill.

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
- **`nodeSelector` is MANDATORY — kube.mjs refuses a manifest without one.**
  An unselected pod does not fail, it lands on whatever will take it, and
  every karpenter pool here is tainted (`gasboat.agent`,
  `fics.pihealth.ai/mr`, `gvisor`) — so the only nodes that accept it are the
  SHARED managed nodegroup carrying fleet workloads. Enumerated 2026-08-25:
  exactly 6 of 30 nodes are untainted, and all 6 are **m5.large** (2 vCPU) —
  so an unselected arm doesn't merely touch shared infra, it contends with
  fleet work on the smallest nodes on the cluster. `crewux-focus.json` and
  `redbar-focus.json` shipped that way and would have put sim work on fleet
  infra, silently, while looking like clean runs (fixed 2026-08-25). Always
  pair the selector with the matching toleration. `--anywhere` is the
  deliberate escape hatch; the guard runs before the push check, so a bad
  manifest tells you so without demanding a push first.
- Suite arms use `--slice i/N` (standalone shard mode, no IPC; `--count`
  answers how many scenarios exist). Matrix/science arms use batch.mjs or
  headless flags verbatim.
- The ephemeral pool: `karpenter.sh/nodepool=ephemeral-pool`, taint
  `gasboat.ephemeral=true:NoSchedule` (probed live 2026-08-23), m5
  xlarge/2xlarge on-demand, pool limit 400 cpu.
- **Spot is NOT set anywhere yet** (probed 2026-08-25: all 29 cluster nodes
  read `karpenter.sh/capacity-type=on-demand`; no manifest asks for spot).
  Do NOT just add `"karpenter.sh/capacity-type": "spot"` to a manifest on
  spec — if the pool's requirement doesn't permit spot, every arm sits
  Pending forever, which is worse than the on-demand spend. A pod cannot
  check: `kubectl get nodepool` is Forbidden to the `cs` SA (cluster-scoped).
  Escalation kd-BAwwftJfdH asks gasboat to confirm-or-allow spot, and to
  grant read-only nodepool access so this is answerable next time.

## MEASURED BASELINE CAPABILITIES (2026-08-23, ref b7e6a66 = tip dc0f4b7 + this branch)

| workload | shape | wall (incl. provisioning) | verdict |
|---|---|---|---|
| Full suite, BOTH backends | 16 arms x 2cpu (8 slices x js/wasm) | ~9 min (arms 55-224s; nodes ~60-90s) | 624/624 passed, merged from receipts |
| Triple-16 growth matrix | 6 arms x 8cpu (batch.mjs --json) | **2m06s** | baseline 0/48; growth 13/48 (batch instrument) |
| Throughput (current tree) | per 7-worker m5 pod | 4.3-5.1 lived d/s (~0.65 d/s/vCPU) | down from 0.89 pre-culture-era: the sim got richer |
| Scale-down | after clean | verified 0 ephemeral nodes, ~minutes | karpenter is prompt; clean checks anyway |

Receipts: design/cs35-research/kube-baseline/. Rough cost per suite run:
~7-12 m5 nodes x ~10 min ≈ well under a dollar.

### What a gasboat fleet pod (project `cs`) can actually do — measured 2026-08-24

Don't re-derive this, and don't assume a denial you haven't seen. From a fresh
cs pod (SA `gasboat-system/gasboat-agent`, token at
`/var/run/secrets/kubernetes.io/serviceaccount/`), `kubectl auth can-i`:

| verb | ns crab-science | note |
|---|---|---|
| create jobs | **yes** | and **no** in `kafka` — least privilege intact |
| create secrets / configmaps | yes | helm 3 release state + receipts |
| get pods/log, list events | yes | forensics work |
| delete jobs, create serviceaccounts | yes | |
| **get/create/delete roles, rolebindings** | **yes** (ns crab-science only) | granted 2026-08-25 (kd-Y7RzIznJAw); delete included so helm uninstall cleans its own Role/RoleBinding |
| create namespaces (cluster scope) | **no** | correct least-privilege; kube.mjs no longer needs it (main 0fc9e1b) |
| create clusterroles, create jobs -n kafka | **no** | least privilege intact |

Tooling: helm **3.20.2**, kubectl **1.35.4** against server **1.31.14-eks**.
Note `kubectl version --short` was REMOVED in 1.35 — use bare `kubectl version`.
`aws eks describe-cluster` SUCCEEDS from the pod; only `eks:ListClusters` is
denied, so "the pod has no eks:*" is wrong.

So a pod now drives the full run path — install through uninstall — in
crab-science. A pod STILL also has the in-pod suite route (~88 min vs ~103s
sharded, roughly 50x, and it LOOKS like a hang — budget for it rather than
concluding it wedged) for when cluster access is unavailable, but the cluster
route is the fast verdict.

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
9. **"Permission denied" was OUR TOOL three times running.** Every reported
   cs-pod blocker so far turned out to be kube.mjs, not the substrate: the
   hardcoded `cs35repo` remote, an injected `AWS_PROFILE` that destroyed the
   pod's IRSA identity and reported it as "AWS session dead", and preflight
   reading a pod's legitimately-EMPTY `kubectl config current-context` as
   "not the gasboat cluster". A pod has no kubeconfig at all. Before filing
   an access escalation, run the denied thing directly (`kubectl auth can-i
   <verb> -n crab-science`) and compare — if kubectl says yes and the tool
   says no, the tool is wrong.
10. **A pod proves its cluster by CA bytes, the Mac by context name.**
   In-cluster callers compare the kubelet-mounted `ca.crt` against the CA
   the EKS control plane reports for `prod-gasboat-eks`; they must match
   byte-for-byte or preflight refuses. That is STRONGER than the name
   regex it falls back from — a context name is chosen locally and can
   lie. The account rule (nothing may ever point at fics-prod-v2) is
   enforced harder in the pod path, not relaxed.
11. **Don't shell to `openssl` from a pod.** The agent image has none, and
   `shq()` swallows "command not found" and returns null — which reads as
   a failed check rather than a missing binary. Use node's `crypto`. Cost
   one armed mutation to find, in the very function meant to REMOVE a
   false negative.
12. **`helm install --create-namespace` is a cluster-scope CREATE even when
   the namespace exists** (the 4th lesson-#9 tool bug). helm 3 issues an
   UNCONDITIONAL namespace CREATE and only tolerates AlreadyExists — but the
   API server checks authz BEFORE existence, so a least-privilege caller
   (get namespaces: yes, create namespaces: no) gets a cluster-scope
   Forbidden and the whole install aborts, though crab-science was
   operator-provisioned days ago. Fixed on main 0fc9e1b: gate the flag on
   `kubectl get namespace`. Diagnose the class by hand: if `kubectl get
   namespace <ns>` says it exists but helm says it can't create it, the
   `--create-namespace` flag is the bug, not your grant — do NOT request
   namespace-create.

## How a fork prepares a run

1. Commit everything the pod needs (entry tools, manifest) on your branch;
   `git push <remote> <branch>:<branch>` (pod-clone refs are allowed). The
   remote is `cs35repo` on the operator's Mac and `origin` in a fleet-pod
   clone; `kube.mjs` resolves it either way (override with `--remote NAME`).
2. `node tools/kube.mjs run experiments/<yours>.json --wait` if the
   operator session is live; otherwise hand the orchestrator that exact
   command in your report.
3. Quote results as (gitRef, manifest path, receipt verdict). Bank the
   collected receipts with your close-out.

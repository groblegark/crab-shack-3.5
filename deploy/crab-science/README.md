# crab-science — the parallel-run substrate (v2)

Runs the arms of a committed EXPERIMENT MANIFEST as indexed Job pods.
No custom image: a stock `node` container plus a `git` initContainer
cloning the public repo at a **pinned commit**. One pod = one arm =
one ConfigMap receipt, banked through the API before exit.

**Do not drive this chart by hand — use the verb:**

```sh
export AWS_PROFILE=gasboat-prod
node tools/kube.mjs run experiments/suite-312.json --wait
```

kube.mjs validates (pushed SHA, committed manifest, gasboat context,
live session), installs into the `crab-science` namespace, watches,
collects receipts to `design/cs35-research/kube-runs/<release>/`, and
cleans up with the karpenter scale-down check.

Manifest shape, measured baselines, and the lessons-with-scars live in
**design/cs35-kube-runbook.md**. The policy that sends work here at all
(any parallel node runs) is at the top of that file.

v1 of this chart (pods x townsPerPod batch sharding, results read from
pod logs) is superseded: log-based results died with karpenter's nodes,
and the values-driven single workload couldn't express suite shards or
science A/B arms. The manifest + receipt design is the fix.

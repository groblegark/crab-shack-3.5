# crab-science — batch town science on a cluster

Runs N deterministic Crab Shack towns sharded across indexed Job pods.
No custom image: a stock `node` container plus a `git` initContainer
cloning the public repo at a **pinned commit** — the experiment is fully
described by the chart values, and a result is citable as
`(gitRef, towns × days, flags)`.

## Run one

```sh
REF=$(git rev-parse cs35-numeric-s01)   # pin the exact tree
helm install sweep1 deploy/crab-science \
  --namespace crab-science --create-namespace \
  --set gitRef=$REF \
  --set pods=8 --set townsPerPod=64 --set days=30
```

The growth sweep: add `--set extraArgs='{--buy,chef,table}' --set days=40`.

## Read the result

Each pod prints one JSON receipt (distributions + throughput, with the
LIVED sim-days convention — a town evicted day 9 did nine days of work).

```sh
kubectl -n crab-science logs -l job-name=sweep1 --tail=1 | jq -s .
```

Aggregate shards client-side (they are disjoint seed ranges, so
histograms merge by addition). Wall-clock throughput per pod is in each
receipt; machine-wide is towns-lived-days / max pod wall.

## Sizing

One pod ≈ one node's worth of workers: set `jobsPerPod` = `resources.cpu`
minus one. Towns are ~independent processes at ~2–5 lived sim-days/sec
each (kernel armed, main realm — both default). 4,096 towns × 30 days ≈
8 pods × 512 towns ≈ 25–45 min at 7 workers/pod.

## What this is for

The distribution science the single machine can't reach: eviction
histograms at n=10⁴, rare-event hunting, parameter heatmaps
(`extraArgs` carries any headless flag — hatches, `--wage`, `--set`),
and, next, cultureway batches (towns sharing a cultureway are one
coherent batch — the same property the GPU rung will want).

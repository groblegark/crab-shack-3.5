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

## THE INSTRUMENT FIGHT: a worker that doesn't halt is a parent

Ten cluster launches failed before one town was ever simulated. They failed
in five different costumes, and **every costume was mine** — one bug, wearing
whatever the cluster handed it.

**The bug.** Attempt 1's honest finding was that a worker's large IPC payload
can be dropped if the process exits before the message flushes. The fix moved
the exit into `send`'s flush callback:

```js
process.send(runOnce(seed), () => process.exit(0));   // WRONG
```

`process.send` returns immediately. Module evaluation **continues** — straight
past the worker branch into the CLI section below it, where the file's own
matrix code forks a pool of workers. Each of those inherits `--_worker`, runs
a town, and forks its own pool. A fork bomb, in the entrypoint, written by the
fix for a real bug.

**Why every local test passed.** On a fast laptop core the town finishes and
the exit callback fires before the fresh children accomplish anything — exit
wins the race, the bomb is invisible. On a slow pod core the children win.
The same binary is correct on the box and catastrophic on the cluster: the
sharpest instance yet of the house rule that **the box is for gates and the
cluster is for fan-out**, arriving as a bug that only exists at cluster speed.

**The five costumes** (each "diagnosed" and "fixed" in turn, each fix
addressing an axe rather than the wedge):

| # | What it looked like | What it was |
|---|---|---|
| 1-2 | OOMKilled at 4Gi, then at 8Gi | doubling processes, not fat heaps |
| 3 | contention + `backoffLimit` teardown | the bomb, on a busy pool |
| 4 | OOM again at 12Gi, 4 workers | the bomb, with more headroom to eat |
| 5 | `activeDeadlineSeconds: 3600` axe at 60m | the bomb, still spawning at the hour |
| 6 | 105m and 173m expiries | the bomb, under a 3h deadline |

**How it was finally caught.** Not by reading code — by a `/proc` census
inside a live pod. The film:

```
135 (node-MainThread) R 1162     <- twelve RUNNABLE nodes
148 (node-MainThread) R 1042        (the manifest asked for TWO)
...
 36 (node-MainThread) Z 1313     <- eight ZOMBIES, reaped by nobody
 57 (node-MainThread) Z 2207        (the shell is PID 190, not their parent)
```

Twelve live processes and eight zombies where two workers were requested;
CPU counters climbing, so **spinning, not blocked**; zombie parents gone.
That census names the mechanism in one screen after ten launches of
inference.

**The fix**: `await` the flush, then exit — top-level await halts module
evaluation, so the worker branch is genuinely terminal.

```js
await new Promise((flushed) => process.send(runOnce(seed), flushed));
process.exit(0);
```

**Lessons worth the runbook** (companions to lesson 8):

- **A worker branch must HALT, not merely schedule an exit.** Any
  fork-and-IPC entrypoint that is its own worker needs the branch to end
  evaluation — `await`+`exit`, or a `return`-shaped guard — never a callback
  that lets the module fall through into its parent path.
- **Diagnose a wedged pod with a `/proc` census before anything else.**
  Process count vs. requested workers, R-vs-S states, zombie tally. Silence
  plus growth is a spin, and `kubectl logs` cannot see it.
- **Receipts-before-status, and forensics have minutes.** Every attempt's
  pods were GC'd fast; the diagnosis came from `kubectl exec` on a LIVE pod,
  not archaeology.
- **A pod's Node sizes V8 off the HOST, not the cgroup** — real, and
  `--workermem` stays, but it was never this failure's cause.
- **`backoffLimit: 1` on a 24-index job means the second pod failure
  anywhere torches all 24.** Worth a per-index failure policy for wide
  science jobs.
- **Arm wall-time**: `towns x days / (0.65 x workers)` lived-sim-day-seconds
  on m5 — and note that the "measured ~90min arm" that justified a 3h
  deadline was itself an artifact of the bomb. A healthy 4-town, 30-day arm
  on 2 workers is minutes, not hours. Re-measure honest baselines after a
  wedge is cleared; a number taken during a bug is a number about the bug.

## STATE: instruments proven, science not yet run (handoff, 2026-08-23)

**The fix is confirmed on the cluster.** One witnessed arm (live-t0, 4 towns
x 30 days, 2 workers) at ref 886b91a: **exit 0 in 24 seconds of arm wall**,
receipt banked, verdict `survived 0/4; eviction days: 8,11,12,13`, and a
divergence corpus of **790 disagreements across the 4 towns** (268/164/146/212
per seed). Receipt:
`design/cs35-research/kube-runs/cs-cit-science-probe1-886b91a-mhv3/live-t0.json`.
Twenty-four seconds against the wedge's 173 minutes — and note the corollary
for planning: a 24-arm corpus is minutes of compute, not the hours every
earlier projection assumed.

Two instrument bugs the receipt itself exposed, both fixed in the same
session (de54c45): the summary line exceeded the receipt's 4KB stdout tail
and lost the buckets off its FRONT — they now ride their own line, printed
LAST, with compact story seeds; and the analyzer now reads the survived line
from the receipt's own `verdict` field rather than the truncatable tail.

Everything below is built, committed, and cluster-ready; no experimental
number about crab BEHAVIOR exists yet, and none is guessed here. What exists:

- `tools/headless.mjs` probes (default-off, tools-only, shipped game.js
  untouched): `--citscript` (the A/B arm), `--citdivlog` (divergence corpus
  + the `>> citdivsum` receipt line with story seeds), `--citknock <pair>`
  (class-selective override), `--workermem` (pod heap cap), per-worker
  completion prints, and the halting-worker fix.
- `tools/science-cit-mkmanifest.mjs` — emits both manifests in the small-arm
  shape (4 towns, 2 workers): `corpus` (24 arms: 12 live + 12 script over
  town offsets 0..47) and `knock <pairs...>`.
- `tools/science-cit-analyze.mjs` — reads kube receipts, merges buckets,
  regroups `-t<offset>` arms into sb0/16/32 blocks, prints the variant
  totals, the bucket table, and the turnout comparison; writes
  `summary-cit-science.json`.
- `experiments/cit-science-corpus.json`, `experiments/cit-science-probe1.json`
  (one witnessed arm), and `tools/kube.mjs` forwarding
  `activeDeadlineSeconds` from a manifest.

**Resume in this order:**

1. `AWS_PROFILE=gasboat-prod node tools/kube.mjs run experiments/cit-science-probe1.json --ref <tip> --wait`
   — one arm; confirm a receipt banks with a `>> citdivsum` line, and read
   the honest arm wall-time off it (the old ~90min figure was the bomb).
2. Corpus: same command with `experiments/cit-science-corpus.json`. Then
   `node tools/science-cit-analyze.mjs design/cs35-research/kube-runs/<release>`.
3. Read the bucket table; pick the top 3-4 directional pairs (plus
   `vote:vote` for the turnout question); regenerate
   `node tools/science-cit-mkmanifest.mjs knock "<pair>" ...` and run it.
   Budget: pairs x 12 arms; cap concurrency with `--parallelism`.
4. Fill the four sections below from receipts only.

## The decomposition

(pending phase 1 + 2 receipts; every row must cite
kube-runs/<release>/summary-cit-science.json)

| pair | thinks | share | causal growth share (knockout) |
|---|---|---|---|
| — | — | — | — |

## The turnout verdict

(pending: live vs script papers/roll from the corpus arms, then the
`vote:vote` knockout to separate cause from side-effect)

## Stories

(pending: the corpus's banked story seeds — named crab, day, what the script
would have done, what the brain did)

## The honest residual

(pending: the share of the escape delta no knockout claims — and note that
the +4 itself must be re-established in THIS instrument before it can be
decomposed)

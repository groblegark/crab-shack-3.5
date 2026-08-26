# cs-matrix-triple16-2836591-gpjt — the growth matrix on the tariff-landing tree

**Baseline 0/48, growth 24/48 — the floor holds, growth in the intended band.**

    sha      = 28365916b9018c3dc1468f3bede862ac47cf3ca5   (branch tariff-fifth-purse)
    manifest = experiments/matrix-triple16.json  (6 arms: {baseline, growth} x sb {0,16,32})
    command  = node tools/kube.mjs run experiments/matrix-triple16.json --ref 2836591 --wait
    each arm = 16 towns x 30 days, tools/batch.mjs --jobs 7 --json, realm main

| arm | survived | evicted | workersDied |
|---|---|---|---|
| baseline-sb0  | 0/16 | 16 | 0 |
| baseline-sb16 | 0/16 | 16 | 0 |
| baseline-sb32 | 0/16 | 16 | 0 |
| growth-sb0    | 6/16 | 10 | 0 |
| growth-sb16   | 9/16 |  7 | 0 |
| growth-sb32   | 9/16 |  7 | 0 |

**Baseline (buy nothing): 0/48. Growth (--buy chef,table): 24/48.**

This tree is the one the tariff landed as: merge commit `92ec9a6` (stamp
`b1ad72a`) has a tree byte-identical to `2836591`, so this balance read
belongs to trunk.

## Reading it, against the tree being landed on

Re-measured on the merge tree — not cited from the branch's own old number.
The branch's original receipt read growth 21/48 on base `f48bdd3`; CLAUDE.md's
reference is 15/48 at `83fb0f4`. Neither transfers.

- **Baseline 0/48 is the floor and it is intact.** Buy nothing and every one
  of 48 towns is evicted. The tariff did not make the do-nothing path
  survivable.
- **Growth 24/48 sits in the intended-difficulty band.** Blocks 6 / 9 / 9;
  any single 16-town block is a coin, so 24/48 is the honest read across three.
- **Byte-identical across all three trunk re-merges.** The growth matrix was
  run at `e7c1d80` (votereason base), `cb7fb15` (CLAMP/fmtD base) and this
  `2836591` (pig-civics base) — **6/9/9 = 24/48 all three times**, baseline
  0/48 all three times. That is direct evidence the intervening main work is
  inert to town balance, and that the tariff itself did not erode the growth
  pillar: `headless`/`batch` buy a fixed list and never campaign, so they never
  move the TARIFF dial or re-price against a rival — the matrix measures the
  FLOOR for a bot that is not trying, and the tariff is largely inert to it.
- **`workersDied 0` on all six arms** — the receipts are complete.

Throughput ~4 sim-days/sec/arm in the main realm on the 8-core ephemeral
nodes. Companion to the suite gate `cs-suite-330-2836591-gm7s` (784/784 both
backends) at the same SHA.

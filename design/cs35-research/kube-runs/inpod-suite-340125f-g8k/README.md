# inpod-suite-340125f-g8k — the live tip gated in its OWN name

> **main advanced 340125f -> 4d92551 WHILE this gate was running** (~44 min).
> The six intervening commits are kube tooling, the cluster runbook, a
> crab-science helm values file, and the build stamp — NO gameplay. Every game
> engine file (font/ppu/sprites/crabs/game.js), both culture fixtures,
> cultureways.js, simlib.mjs AND suite.mjs are **byte-identical** between 340125f
> and 4d92551 (sha1-compared, 2026-08-25). So this 378/378 verdict transfers
> exactly to the current live tip: its gameplay is what was gated. 4d92551 owes
> only a stamp/tooling re-gate, not a gameplay one.

**Verdict: GREEN, both backends — js 378/378, wasm 378/378**

`main`'s tip is **340125f** (`the stamp names the pig-delight-voice-retune build`) —
the commit `groblegark.github.io/crab-shack-3.5` serves. Until this receipt, NO banked
receipt named any of the four then-current tip SHAs (340125f, b4c86ab, 439358f,
437f20e); the newest were `inpod-suite-83fb0f4-18z` and `inpod-suite-ec6f74b-18z`,
14+ commits behind. This receipt is the live tip's own verdict.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 378/378 passed | 0 | 1639.1s |
| wasm | 378/378 passed | 0 | 1005.0s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the same shape the kube receipts use.

## Why this gate was owed (task kd-F3tOXnIa2n)

Two defects, both measured, neither a reading of a bead:

1. **No receipt named the live tip.** `grep -rl -E "340125f|b4c86ab|439358f|437f20e"
   design/cs35-research/kube-runs/` returned nothing. The published game ran on a tree
   with no gate of its own.

2. **The receipt that DID claim the retune's content named the wrong tree.** The closing
   comment on kd-vBepKYvXAS gated tree **439358f** — but 439358f is the tree *before* the
   retune:

        git merge-base --is-ancestor b4c86ab 439358f                         -> NO
        git show 439358f:tools/fixtures/cultures-pig.json | grep -c "NOT ONE DULL HOUR" -> 0
        git show b4c86ab:tools/fixtures/cultures-pig.json | grep -c "NOT ONE DULL HOUR"  -> 1

   The honest reading (confirmed): the crew gated the WORKING tree — retune applied on
   base 439358f — and wrote the base SHA where the resulting tree belonged. The working
   tree's content == the committed retune b4c86ab, and b4c86ab -> 340125f (the tip) is
   **version.js only** (the build stamp); every game file is byte-identical. So the green
   number was real; only the label was wrong. This receipt closes the ambiguity by gating
   the tip in its own name.

## The convention this receipt follows

A receipt is a claim about a TREE. When you gate a working tree, record the RESULTING
committed SHA (or `git rev-parse HEAD^{tree}`), never the base SHA — base + uncommitted
edits is not a thing anyone can re-fetch later. This receipt names:

    sha  = 340125fbbfa4109edd29b9acb020567527fd4706   (the committed live tip)
    tree = 1d6e10936745681e3a7a2559169f6899c3c4563a   (git rev-parse HEAD^{tree})

## IN-POD, not via kube.mjs

Run **in-pod** on a gasboat fleet pod (project `cs`), NOT through `tools/kube.mjs`.
CLAUDE.md's scope note permits this: *"a gasboat fleet pod (project `cs`) IS cluster
compute — it may run sim workloads in-pod within its own resource limits."* The local
kube ban protects the operator's Mac; this pod is not the Mac. The receipt lives under
`kube-runs/` for discoverability; the `inpod-` prefix names it plainly as an in-pod run.

## How it was run

    node --version      -> v24.15.0
    git rev-parse HEAD  -> 340125fbbfa4109edd29b9acb020567527fd4706
    nproc               -> 16

    # js backend
    SIMLIB_REALM=main                     node tools/suite.mjs --jobs 15

    # wasm twin (SEQUENTIAL, never concurrent)
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main  node tools/suite.mjs --jobs 15

- `SIMLIB_REALM=main` is ~4.3x faster than the vm realm and receipt-identical
  (design/cs35-research/vm-escape/).
- `--jobs 15` = cores−1 on this 16-core pod (CLAUDE.md: never exceed cores−1).
- The two backends ran **sequentially, never concurrently** — CLAUDE.md warns concurrent
  sims make timings lie and fight for heap.
- 378 scenarios: `grep -c 'scenario('` reads 379, but one match is the `function
  scenario(...)` definition itself; the suite verdict counts 378.

Gate task: **kd-F3tOXnIa2n** (parent kd-ppo3YfKtA5). Run by agent **cs-the-live-tip-7a1**.

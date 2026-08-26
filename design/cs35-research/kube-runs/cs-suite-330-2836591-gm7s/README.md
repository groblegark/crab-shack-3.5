# cs-suite-330-2836591-gm7s — the tariff, gated on the tree it landed as

**Verdict: GREEN, both backends — js 392/392, wasm 392/392 (784/784 merged)**

    sha      = 28365916b9018c3dc1468f3bede862ac47cf3ca5   (branch tariff-fifth-purse)
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --ref 2836591 --wait
    run from = gasboat fleet pod (project cs), IRSA identity, no AWS_PROFILE

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 392/392 passed | 12 | js-4 295.8s | js-7 81.0s |
| wasm | 392/392 passed | 12 | wasm-1 180.9s | wasm-7 48.9s |

All 24 arms exit 0, `failures[]` empty on every receipt, no pod restarts. Each
arm ran on a 2-CPU cgroup grant (`cores=2`, `hostCores=4`). The merged verdict
was cross-checked by recounting the 24 banked receipts independently of
`kube.mjs collect`: both give 784/784, split 392/392.

## This verdict belongs to the LANDED tree

`2836591` is the tariff branch merged with `origin/main` tip `8510a28`. It
landed to main as merge commit **`92ec9a6`** (stamp `b1ad72a`), and

    git rev-parse 92ec9a6^{tree} == git rev-parse 2836591^{tree}
      == 1e41dafd1bcec8f9b5b5f689d8296e12d01f05e8

so the merge commit's tree is **byte-identical** to the gated tip. The 784/784
verdict transfers to the landed merge exactly — no re-gate needed. The stamp
commit `b1ad72a` touches only `version.js`, which the sim never loads.

## Why THIS tree and not the branch's own old gate

The tariff was first gated at `9394feb` (381/381) — but that was 36 commits
stale, and a verdict belongs to ONE tree (suite discipline rule 1). Trunk
moved THREE times during this landing, and each move touched real interaction
surface, so the branch was re-merged and re-gated each time rather than landed
on a stale base:

1. `8926e7c` -> the votereason receipt rewrite (`bdbb3dc`) — `voteReason` now
   runs the voter's compiled `purseCost` stake term; the tariff is a fifth
   `PURSE_KEYS` mech and flows through it with its own `purseCost100` branch.
2. `21064f3` -> L1 CLAMP static-interval soundness hull (`f7d3b0c`) in
   `l1Assemble`, the checker the tariff's compiled term is verified by; and the
   departcard `fmt`/`fmtD` dollar-band split.
3. `8510a28` -> the pig now declares its own civics section (`dfbe920`) — a
   pig voting its own politics runs compiled purse terms that must handle the
   tariff mech, and both branches touch `cultureways.js` + `tools/suite.mjs`.

At every merge only `version.js` conflicted (generated), and `mkcultureways`
regen was **BYTE-EXACT** against the auto-merged bundle — the crab's tariff
purse and the pig's civics coexist in the 123954-byte bundle without either
displacing the other. The suite count walked `381 -> 784` (392/backend) as
main's scenarios and the tariff's +3 accumulated; all 392 are green here.

## What this gates — the fifth purse

- `PURSES.tariff` — steps `[0, 10, 25, 50, 100]` % on the landed price,
  document-adopted via `crab-civics.json` purses (byte-equal, suite-pinned to
  five mechs).
- `importDuty()` at the `consumeIngredient` chokepoint: off the till that
  bought the crate, into the fund, `fundNeed`-capped; the office's own
  purchases (ballot paper, the pot's fish) exempt by construction; the pier's
  own catch never tolled.
- `fishCeil()` — the pier ceiling is import parity; a posted tariff raises it
  ($7 + duty), a repeal re-parities in one clearing.
- HALL's TRADE view and the `allPlatforms()` grid (now 5 mechs, 6125
  platforms) ride along.

## Mutation demo (suite discipline rule 2) — both arms bite

Two deliberate defects were armed in a pod (filtered single-scenario run,
seconds; reverted before every push — each landed tree is clean):

1. `fishCeil()` lift halved (`/200`): the parity scenario went RED —
   *"a 50% tariff's ceiling is 875c, expected 1050c import parity"*.
2. `importDuty()` base doubled (`/50`): the collection scenario went RED —
   *"an imported $7 fish at 25% paid 350c, expected 175c"*.

Each mutation named exactly what it broke; reverting returned the three tariff
scenarios to 3/3. The guards are load-bearing.

## Balance — the 48-town matrix on this same tree

`experiments/matrix-triple16.json` at `2836591`
(`cs-matrix-triple16-2836591-gpjt`): **baseline 0/48, growth 24/48**
(sb0 6, sb16 9, sb32 9), `workersDied 0`. Baseline 0/48 is the floor holding.
Growth 24/48 is the intended-difficulty band, and the survived counts were
**byte-identical across all three trunk re-merges** — proof the intervening
main work (votereason, CLAMP hull, fmtD, pig civics) is inert to town balance.
The headless bot never campaigns, so the tariff dial is largely inert to it;
the matrix measures the FLOOR for a bot that is not trying. Full read in that
receipt's README.

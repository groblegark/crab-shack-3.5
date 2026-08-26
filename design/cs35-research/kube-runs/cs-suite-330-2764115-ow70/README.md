# cs-suite-330-2764115-ow70 — cs-music-deployed-silence, gated on the cluster at the landing tip

**Verdict: GREEN, both backends — js 400/400, wasm 400/400 (800/800 merged)**

    sha      = 2764115b7ae62d372cc174055cc847624a890d41   (branch cs-music-land, landing tip)
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --ref 2764115 --wait
    run from = gasboat fleet pod (project cs), IRSA identity, no AWS_PROFILE

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 400/400 passed | 12 | js-7 323.2s | js-4 61.7s |
| wasm | 400/400 passed | 12 | wasm-7 209.3s | wasm-4 38.7s |

All 24 arms exit 0, `failures[]` empty on every receipt, no pod restarts. Wall
clock end to end ~7 min — the cluster gate the 2026-08-26 policy mandates (an
in-pod `--jobs 1` full run of the same-size tree measured ~90 min for 148/379;
see KUBE POLICY in CLAUDE.md).

The fix's own four gate scenarios are in the roll on both backends:

    PASS  a kept catalog track reaches the CDN, and a dead track does not kill the rotation
    PASS  the whole session plays through one audio element
    PASS  BACK hands the town the track you were auditioning
    PASS  the record box scrolls without the drag thumb

## This verdict belongs to the LANDED tree

`2764115` (branch cs-music-land tip) landed to main as merge commit **`42ab06f`**
(stamp `391443b`), and

    git rev-parse 42ab06f^{tree} == git rev-parse 2764115^{tree}
      == 4125f4cf951336f08d4e760c84cf643d9b06cbbe

so the merge commit's tree is **byte-identical** to the gated tip. The 800/800
verdict transfers to the landed merge exactly. The stamp commit `391443b` touches
only `version.js`, which the sim never loads.

## Provenance — three main-moves, each handled honestly

The fix `4c537f2` gated green two generations back off parent `21064f3`; main was
21 commits ahead when this landing began, so per discipline rule 1 the verdict was
re-earned on the merge tree in this pod's own name. Main then moved three times
while gating:

1. `b8c766c` — CLAUDE.md doc change (how work reaches trunk). No gate surface.
2. `70f37c9` — the **visitors-book landing** (`c51da0a`), a real game.js (+456) and
   tools/suite.mjs (+235) change. Re-merged as a clean orthogonal union (music's
   7-hit `ARCHIVE_OK` tri-state and visitors-book's roster both fully preserved,
   proven by reverse-diff) and RE-GATED (tip `3273f4f`, 800/800). This was the one
   re-gate the task's "main moved mid-gate" rule budgets.
3. `ef5fb5e` — a **receipt-only** commit (the visitors-book landing's own
   `kube-runs/*.json`), zero executable-surface change (`git diff 70f37c9..ef5fb5e
   -- game.js tools/suite.mjs cultureways.js tools/simlib.mjs` empty). Folded and
   re-gated once at the exact landing tip `2764115` (this receipt) so the tree that
   landed carries its own GREEN, not an inherited one.

## Mutation demo (discipline rule 2)

One armed defect at a time. Reverting the rotation's CDN fallback in `musFail`
(the `ARCHIVE_OK = false` + `a.src = cat.url` retry) turned the scenario RED
naming the exact fallback:

    FAIL  a kept catalog track reaches the CDN, and a dead track does not kill the rotation
          a 404 on the mirror did not fall through to the hosted release

Re-arming (restoring the retry) returned it to GREEN, and the working tree was
verified byte-identical to the gated tip afterward.

## Caveat carried forward — the mobile/iOS half is UNPROVEN on a real phone

Verification was desktop Chromium against both the deployed build and the tree.
That proves the 404 code paths (the deployed-build silence) and the rotation
survival. It does NOT prove iOS autoplay policy. The single-element unlock is the
standard fix for that failure mode and matches Matt's symptom ("not working in
mobile in particular, seems to be working on my machine") exactly, but a real
phone has not confirmed it. The live site serves trunk, so Matt could not test on
his phone until this landed — landing is strictly better than the current deployed
silence. **Matt should retest music on his phone against the newly deployed build.**

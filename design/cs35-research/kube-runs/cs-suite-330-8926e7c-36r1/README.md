# cs-suite-330-8926e7c-36r1 — the LIVE TIP, gated in its own name at last

**Verdict: GREEN, both backends — js 387/387, wasm 387/387 (774/774 merged).**

    sha = 8926e7c76b412e9b2d18c0f35bac09386624bc59   (main's tip, and what the live game serves)

## Why this run exists

groblegark.github.io/crab-shack-3.5 serves main's tip, and main's tip had drifted
**five commits past the newest receipt**. `da389b1` gates tip `b7e2a60` / content
`bdbb3dc` and says so in its own README. `b7e2a60` IS an ancestor of `8926e7c`, so
this was not a divergent branch — it was ungated drift on trunk:

    git diff --stat b7e2a60..origin/main -- game.js tools/
     game.js             |  43 ++++++++++++++++++++
     tools/mkversion.mjs |  20 ++++++++--
     tools/suite.mjs     | 110 +++++++++++++++++++++++++++++++++++++++++++++++++++-

No receipt under `design/cs35-research/kube-runs/` named `5c5ea49`, `1219dad`,
`66247ab`, `3fd0cb4`, `a2542c6` or `8926e7c` — a grep for all six returned empty.
Bug: **kd-IHhEW6zDu2**. Per discipline rule 1, A VERDICT BELONGS TO ONE TREE: the
`bdbb3dc` receipt could not speak for this one, so this run gates it in its own name.

## What was ungated, and why it was not cosmetic

- **game.js +43** — `buildAgeText()` and its `drawTitle()` call: the live-ticking
  `PUBLISHED 2M 5S AGO` line. It runs every frame while the title is up, calls
  `nowMs()`, and branches over four unit pairs with a negative-clock guard. Live
  engine code on the most-seen screen in the game.
- **tools/suite.mjs +110** — THE INSTRUMENT. Two new scenarios plus a rewritten
  stamp regex that now requires a `t:` field; scenario count 386 → 387. Discipline
  rule 6 is exactly this case: FIX INSTRUMENTS BEFORE READING THEM. An ungated
  change to the suite is a change to the thing every other verdict is read from.

## The verdict, recounted independently of `kube.mjs collect`

`collect` prints its own merged line; this receipt does not trust it. Recounted
straight from the 24 arm JSONs:

    jq -s '{arms:length, exit_nonzero:…, failures:…, shas:…}' *.json
    { "arms": 24, "exit_nonzero": 0, "failures": 0,
      "shas": ["8926e7c76b412e9b2d18c0f35bac09386624bc59"] }

One sha across all 24 arms — no drift, every arm gated the same tree. Per-backend
scenario totals summed from the slice lines: **js 387**, **wasm 387**.

**The two ungated scenarios were confirmed to have actually RUN**, not merely to
have been absent from a failure list — a green that never exercised the new code
would be hollow (rule 3's shape). Both appear as `PASS` on both backends:

    PASS  the title screen ages the build, and keeps ticking (11ms)   [js slice 7]
    PASS  the title screen ages the build, and keeps ticking (13ms)   [wasm slice 7]
    PASS  the build stamp is well-formed and wired (0ms)

| backend | verdict | exit | slices |
|---|---|---|---|
| js   | 387/387 passed | 0 | 12/12 |
| wasm | 387/387 passed | 0 | 12/12 |

Slowest arm `js-4` at 361.8s; whole run ~6.5 min wall across 24 arms on the
gasboat-prod cluster (`node tools/kube.mjs run experiments/suite-330.json --ref 8926e7c`).

## Merge ritual, checked rather than assumed

`node tools/mkcultureways.mjs` at the live tip in a clean worktree regenerated
`cultureways.js` **byte-exact** (121671 bytes, no `git status` diff), and stamp
`a2542c6` does name its merge `3fd0cb4`. So the ritual was honored — the gap was
the gate alone.

## The lesson worth keeping

The commit that landed ungated is `8926e7c`, **"policy: EVERY gate runs on the
cluster, pods included"** — the very commit that tightened CLAUDE.md's kube policy.
The author wrote the rule and pushed it without running it. That is not a careless
agent; it is a gate that is a *convention* rather than a *mechanism*. Nothing in the
push path asks whether a receipt exists for the tree being pushed, so the only thing
standing between trunk and ungated code is that every agent remembers every time.

The debt is now paid: the live game is green, and known to be, on its own tree.

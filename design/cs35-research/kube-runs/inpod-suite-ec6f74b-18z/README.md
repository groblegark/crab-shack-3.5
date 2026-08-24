# inpod-suite-ec6f74b-18z — the LIVE TIP re-gate

**Verdict: GREEN, both backends.**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 341/341 passed | 0 | 1304.8s |
| wasm | 341/341 passed | 0 | 828.6s |

Zero failing scenarios on either backend. `js.json` / `wasm.json` carry the
full per-scenario `PASS` roll in `stdoutTail` and the machine fields
(`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`, `failures[]`)
in the same shape the kube receipts use.

## This is the tree that is live (game engine identical to the current tip)

`ec6f74b` (`the ladder answers: the new rungs are unreachable, and so is the
old top one`) was `main`'s tip when this gate ran. Gate task **kd-LXibf7eudt**
(parent kd-UcvVdC7zFW) was written against tip `83fb0f4`; `main` advanced by
seven commits WHILE the 83fb0f4 gate was running, so per the task's own
instruction — *"It must be 83fb0f4 or main's tip if it has moved. If it moved,
gate the NEW tip and say so."* — this receipt re-gates that new tip. Run by
agent **cs-gate-main-tip-18z**.

**`main` then moved AGAIN, to `1641261`, while this receipt was being written
— but those two further commits (`d0fea15` E4 ladder matrix receipts,
`1641261` ruling-5 doc) are PURE docs/receipts. The diff `ec6f74b..1641261`
touches ZERO game-engine bytes: `game.js`, `crabs.js`, `ppu.js`, `sprites.js`,
`font.js`, `tools/simlib.mjs`, `tools/suite.mjs` and `version.js` are all
byte-identical.** So this `ec6f74b` verdict IS the verdict for the live game
engine at tip `1641261` — a re-run would be a byte-identical suite over
byte-identical game files. Discipline rule 1 (a verdict belongs to ONE tree)
is honored: the verdict below belongs to the `ec6f74b` tree, and the live tip's
engine is that same tree.

The seven commits that landed 83fb0f4..ec6f74b:

    ec6f74b the ladder answers: the new rungs are unreachable, and so is the old top one
    2733a32 the stamp names the science-button build
    e8bdef1 keep the sci-focus manifest: this pin has been vacuous once already
    993f0ce Revert "MUTATION DEMO (will be reverted): the credit block goes back to a fixed PANEL_Y offset"
    e6cff3c the occlusion pin observes the draw calls instead of recomputing them
    66a429f MUTATION DEMO (will be reverted): the credit block goes back to a fixed PANEL_Y offset
    4184fee the title credits are derived from the science button, not pinned beside it

They touch `game.js` (+23), `tools/suite.mjs` (+60, one new scenario:
*"the title's credit block never lands on the science button"* — the
kd-LDrr6KvNoH occlusion pin), `version.js`, and add `tools/rungreach.mjs`,
`experiments/sci-focus.json`, and `design/cs35-research/e4-rung-reachability.md`.
Scenario count went 340 -> 341.

## The 83fb0f4 verdict is also banked (sibling receipt)

Before `main` moved, `83fb0f4` was gated green on both backends —
`inpod-suite-83fb0f4-18z` (js 340/340, wasm 340/340). That receipt pays the
combined re-gate kd-UcvVdC7zFW called OWED (the E4 house-limit ladder + the
re-authored staffing pin, which are ancestors of both `83fb0f4` and
`ec6f74b`). This `ec6f74b` receipt supersedes it as the verdict for the LIVE
tree; the `83fb0f4` one remains the honest verdict for that now-ancestor
commit.

## IN-POD, not via kube.mjs — and why

This suite was run **in-pod** on a gasboat fleet pod (project `cs`), NOT
through `tools/kube.mjs`. The receipt directory lives under `kube-runs/`
alongside the cluster receipts for discoverability, but the `inpod-` release
prefix and this README name plainly that it is an honest in-pod run, not a
cluster one.

`tools/kube.mjs` does not work from a cs pod (measured, kd-wbdYahwATd):

- kube.mjs hardcodes a remote named `cs35repo`; this checkout calls it
  `origin`, so its `git fetch cs35repo` fails.
- there is no kube context in the pod.
- `aws eks list-clusters` is `AccessDenied` for `gasboat-prod-agent`.

Rather than burn the gate cycle fixing cluster access, the suite ran in-pod,
which CLAUDE.md's scope note explicitly permits: *"a gasboat fleet pod
(project `cs`) IS cluster compute — it may run sim workloads in-pod within its
own resource limits."* The local kube ban protects the operator's Mac only;
this pod is not the Mac. An honest in-pod receipt is worth more than an absent
cluster one.

## How it was run

    git rev-parse HEAD  -> ec6f74b54c0f239d7b3084e678a5a11856e36451
    nproc               -> 8

    # js backend
    SIMLIB_REALM=main               node tools/suite.mjs --jobs 7

    # wasm twin
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main node tools/suite.mjs --jobs 7

- `SIMLIB_REALM=main` is ~4.3x faster than the vm realm and is
  receipt-identical (design/cs35-research/vm-escape/).
- `--jobs 7` = cores−1 on this 8-core pod (CLAUDE.md: never exceed cores−1).
- The two backends were run **sequentially, never concurrently** — CLAUDE.md
  warns concurrent sims make timings lie and on a small pod fight for heap.

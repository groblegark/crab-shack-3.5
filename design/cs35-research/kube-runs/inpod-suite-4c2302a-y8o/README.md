# inpod-suite-4c2302a-y8o — the record-box tip gated in its OWN name

**Verdict: GREEN, both backends — js 378/378, wasm 378/378**

`main`'s tip is **4c2302a** (`the stamp names the record-box landing build`) — the
commit `groblegark.github.io/crab-shack-3.5` serves. This receipt gates that tree in
its own name. It transfers **no** verdict from another tree, because — unlike the
tooling-only advances the last two receipts covered — this delta is **live game
engine code**.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 378/378 passed | 0 | 1467.4s |
| wasm | 378/378 passed | 0 |  947.9s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the same shape the kube receipts use.

    sha  = 4c2302afc53aa705f79ca93092c718e2bed80420   (the committed live tip)
    tree = 858992b214146bc4efd5ccc80eb9eee7775bac9c   (git rev-parse HEAD^{tree})

## Why the prior receipt's verdict did NOT reach this tip (task kd-j8NNZkv3At)

The newest banked receipt before this one, `inpod-suite-340125f-g8k`, gated `340125f`
and stated the exact precondition for transferring its 378/378 forward: *every game
engine file, both culture fixtures, cultureways.js, simlib.mjs AND suite.mjs are
byte-identical.* That held for `4d92551`. It is **FALSE** of `4c2302a`. Measured
(sha1-compared, `git show <sha>:<file>`, 2026-08-25), `340125f -> 4c2302a`:

    DIFFERS: game.js      (+375 / -10, 380 changed lines)
    DIFFERS: index.html   (+5)
    same:    font.js  ppu.js  sprites.js  crabs.js  cultureways.js
    same:    tools/suite.mjs  tools/simlib.mjs

`game.js` is not byte-identical, so the receipt's own stated condition no longer holds
and its verdict does not reach the tip. A verdict belongs to one tree (discipline 1).
Before this receipt, no banked receipt named any commit in the 22-commit range
`340125f..4c2302a`:

    grep -rlE "4c2302a|record.box" design/cs35-research/kube-runs/   ->  no match

## What the ungated delta was

**The record box** (a music-vetting menu) plus the **rotation mechanism** it drives —
live control flow in the shipped engine, not inert data:

  - `PLAYLIST` becomes a guarded conditional over `BUNDLED_PLAYLIST`
    (validity-checked: array, non-empty, every track has `src`+`name`), falling back
    to the in-file `PLAYLIST_LITERAL`.
  - New mutable module state `let ROTATION = PLAYLIST.slice()` and
    `rebuildRotation()`, which reads `musJudge[...]` from `localStorage` and filters
    the rotation (drop what you disliked, keep everything else).
  - `index.html` gains `<script src="music/playlist.js" onerror="void 0">` loading
    **before** game.js — a file absent from a plain checkout (a 404 is the documented
    normal case; game.js prefers it over its own literal only when present and valid).

The gate proves this delta did not break any of the 378 existing scenarios, on both
the js and wasm kernels.

## What the gate does NOT prove — the record box has zero scenarios of its own

`tools/suite.mjs` is byte-identical between `340125f` and this tip, so the scenario
count is unchanged (378 counted). 380 lines of new engine code landed with **no new
coverage**. This GREEN gate only proves the record box did not *break* the other 378
scenarios; nothing here asserts the box, the rotation rebuild, or the
`BUNDLED_PLAYLIST` guard is itself *correct*. That coverage gap is filed as its own
bead — do not let this green stand in for coverage it does not provide.

## Ritual state at the tip (checked, honest)

- `node tools/mkcultureways.mjs` -> byte-exact, no diff. Bundle is honest.
- `version.js` stamps `f09ad28`, the parent of tip `4c2302a` — matches the convention
  every other stamp follows (`340125f` stamps its parent `b4c86ab`).
- `node --check game.js` parses.

So the ritual was performed at merge time; only the GATE was missing. This receipt is
that gate.

## IN-POD, not via kube.mjs

Run **in-pod** on a gasboat fleet pod (project `cs`), NOT through `tools/kube.mjs`.
CLAUDE.md's scope note permits this: *"a gasboat fleet pod (project `cs`) IS cluster
compute — it may run sim workloads in-pod within its own resource limits."* The local
kube ban protects the operator's Mac; this pod is not the Mac. The receipt lives under
`kube-runs/` for discoverability; the `inpod-` prefix names it plainly as an in-pod
run.

## How it was run

    node --version      -> v24.15.0
    git rev-parse HEAD  -> 4c2302afc53aa705f79ca93092c718e2bed80420
    nproc               -> 8

    # js backend
    SIMLIB_REALM=main                     node tools/suite.mjs --jobs 7

    # wasm twin (SEQUENTIAL, never concurrent with the js run)
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main  node tools/suite.mjs --jobs 7

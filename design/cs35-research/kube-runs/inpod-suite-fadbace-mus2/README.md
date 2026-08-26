# inpod-suite-fadbace-mus2 — the music controls, merged onto current main and gated

**Verdict: GREEN, both backends — js 384/384, wasm 384/384**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 384/384 passed | 0 | 1330.1s |
| wasm | 384/384 passed | 0 |  864.7s |

Zero failures on either backend. Both music scenarios are in the roll on both:

    js    PASS  only one track is ever audible at once (180ms)
    js    PASS  the music controls answer from outside the record box (256ms)
    wasm  PASS  only one track is ever audible at once (~)
    wasm  PASS  the music controls answer from outside the record box (~)

    sha = fadbace   ("the stamp names the music-controls-onto-current-main merge")

## Why this is the THIRD gate for one piece of work

Each of these was a different tree, and a verdict belongs to one tree:

| receipt | tree | verdict |
|---|---|---|
| `inpod-suite-bdfd52b-mus` | the branch alone | js 380/380, wasm 380/380 |
| `inpod-suite-0a47dea-mrg` | branch merged onto main-of-the-hour | js 381/381, wasm 381/381 |
| **this one** | that, merged onto main after it advanced 8 commits | **js 384/384, wasm 384/384** |

The second gate finished, and `git push` was **rejected**: main had moved on
(ruling 6 h2 need-weight matrix, card slice) while the suite ran. That is the
structural cost of an honest gate on a busy trunk — a ~45-minute two-backend run
is long enough for the trunk to move under it, and the answer is to re-merge and
re-gate rather than to push a tree nothing measured.

`tools/gatecheck.mjs` read RED at this tip's parent and named the files:
`cultureways.js (+71/-1)`, `game.js (+97/-10)`, `tools/suite.mjs (+142/-0)`.
Scenario count 381 -> **384** (382 from main, plus this line's 2).

## The music work being gated

MUS is an on/off switch with the record box behind a chevron; up/down arrows in
the box auto-play the row they land on; shift+arrows step tracks from anywhere;
shift+K keeps what is playing. The "never more than one track at once" bug is
fixed at its cause — a stale `ended` closure writing the **global** `music`
handle, so a track ending after you skipped past it nulled the handle to the
track now playing and the next `startMusic()` started a second one over the top.

Two harness faults were fixed to make any of it testable: `addEventListener` was
a no-op in `simlib.mjs` (so the game's keydown handler was constructed and
dropped — every bound key untestable), and the `Audio` stub's `play()` returned a
bare `{catch}` thenable where a browser returns a Promise.

## Ritual state at the tip (checked, honest)

- `node tools/mkcultureways.mjs` -> regenerated and COMMITTED as part of the
  merge: main's culture data changed (121060 -> 121671 bytes), so the bundle
  moving is correct here rather than a miss. Re-running it on this tip is a
  no-op, which is the property the ritual actually asserts.
- `node tools/mkversion.mjs` run after the merge commit; the stamp names it.
- `node --check` parses game.js and tools/suite.mjs.
- The music controls, their key bindings and their panel hit-test bands were all
  verified present in `game.js` after the auto-merge, before this run started.

## IN-POD, not via kube.mjs

Run **in-pod** on a gasboat fleet pod (project `cs`), NOT through `tools/kube.mjs`.
CLAUDE.md's scope note permits this: *"a gasboat fleet pod (project `cs`) IS cluster
compute — it may run sim workloads in-pod within its own resource limits."*

## How it was run

    node --version      -> v24.15.0
    git rev-parse HEAD  -> fadbace

    # js backend
    SIMLIB_REALM=main                     node tools/suite.mjs --jobs 4

    # wasm twin (SEQUENTIAL, never concurrent with the js run)
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main  node tools/suite.mjs --jobs 4

`--jobs 4` is this pod's cgroup quota (`/sys/fs/cgroup/cpu.max` = `400000
100000`), not the 8 `nproc` reports — the same quantity `tools/cores.mjs` now
reads for every forking tool in the repo.

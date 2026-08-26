# inpod-suite-bdfd52b-mus — the music-controls tip gated in its OWN name

**Verdict: GREEN, both backends — js 380/380, wasm 380/380**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 380/380 passed | 0 | 1779.9s |
| wasm | 380/380 passed | 0 | 1088.9s |

Zero failures on either backend. Both **new** scenarios are in the roll on both:

    js    PASS  only one track is ever audible at once (257ms)
    js    PASS  the music controls answer from outside the record box (198ms)
    wasm  PASS  only one track is ever audible at once (222ms)
    wasm  PASS  the music controls answer from outside the record box (197ms)

This receipt gates `bdfd52b` ("the music controls leave the record box") in its own
name. It transfers **no** verdict from another tree: the delta is live game engine
code plus the harness that tests it.

    sha  = bdfd52b   (branch cs-music-controls)
    base = f48bdd3   ("the stamp names the gatecheck-transfer-forward build")

## Why no existing receipt reaches this tip

`tools/gatecheck.mjs` read AMBER at `f48bdd3` — the tip owed only a stamp/tooling
re-gate, its verdict transferring from `inpod-suite-4c2302a-y8o` on a stated
byte-equality precondition across 11 gate-relevant files. **That precondition is
false of this tip.** Measured `f48bdd3 -> bdfd52b`:

    DIFFERS: game.js            (+209 / -33 in the diffstat; the music controls)
    DIFFERS: tools/suite.mjs    (+143; two new scenarios)
    DIFFERS: tools/simlib.mjs   (+28; the keyboard and the Audio promise)
    same:    font.js  ppu.js  sprites.js  crabs.js  index.html  cultureways.js
    same:    tools/fixtures/cultures-pig.json  design/cultureways/gullway.json

A verdict belongs to one tree, so this tree gets its own gate.

## What the delta is

Matt, in Slack: a button "to turn the music on and off without viewing the
playlist"; playlist up/down arrows that "auto-play the track"; it "should never
play more than one track at once (current bug)"; shift+arrows for prev/next "even
when not in playlist"; shift+K to "mark a track as keep from the main interface".

**The two-tracks bug was a stale closure, not a missing pause.** `playTrack` paused
the outgoing element but left its `ended` listener attached, and that listener wrote
the **global** `music` handle — so a track ending a beat after you skipped it nulled
the handle to the track now playing, and the next `startMusic()` saw an empty speaker
and started a second one over the top. Every play now carries the generation it began
in plus a direct reference to its own element.

## What this gate DOES prove that the record box's own gate could not

`inpod-suite-4c2302a-y8o` closed with an explicit warning: the record box shipped
**380 lines of engine code with zero scenarios of its own**, and its GREEN proved
only that the box did not *break* the other 378.

This tip is the first to add coverage there — 378 -> **380 scenarios**:

  - `only one track is ever audible at once` — counts **Audio objects that are
    actually sounding**, rather than trusting the handles the game keeps, across
    rapid skips, a stale `ended`, a double `startMusic`, and the whole bench
    lifecycle (open / audition / arrow-walk / close).
  - `the music controls answer from outside the record box` — drives the panel
    hit-test and the real keydown handler: MUS toggles without opening the box, the
    chevron opens it, shift+arrows step tracks, a plain arrow still pans, and
    shift+K toggles the judgement in the box's own store.

Both were confirmed to **FAIL against the pre-fix build** before being banked — the
first reporting `rotation: 2 tracks audible after "stale", want exactly 1`, which is
Matt's reported bug reproduced as a number.

## Two harness faults this surfaced (both fixed here)

1. **`addEventListener` was a no-op in `simlib.mjs`**, so the game's keydown handler
   was constructed and dropped on the floor. *Every key the game binds was
   untestable.* It now retains `keydown` and exposes `_key(k, shift)`.
2. **The `Audio` stub's `play()` returned a bare `{catch}` thenable** where a browser
   returns a **Promise**, so any `.play().then(...)` — which `game.js` does, to
   announce the track — threw `then is not a function` the moment a scenario reached
   it. Fixed in `simlib.mjs` and `headless.mjs` both.

Neither is cosmetic: the first is why the music keys had no coverage to begin with.

## Ritual state at the tip (checked, honest)

- `node tools/mkcultureways.mjs` -> byte-exact, no diff. Bundle is honest.
- `node tools/mkversion.mjs` run; `version.js` stamps the parent `f48bdd3`, matching
  the convention every other stamp follows.
- `node --check` parses game.js, tools/suite.mjs, tools/simlib.mjs, tools/headless.mjs.
- Sim fingerprint **untouched** — music is view, not sim. Verified directly:
  `hours: defaults are behavior-identical (frozen day-2 fingerprint)` and
  `rng: the sim stream's draw count per day is pinned (seed 1337)` both PASS.

## The branch tip moved after the run — and the verdict still reaches it

The gate ran on `bdfd52b`. The branch then took one more commit, `b5456d4`
("headless --jobs defaults to cgroup cores, not host cores"), which touches
**`tools/headless.mjs` only**. That file is **not** in `tools/gatecheck.mjs`'s
`GATE_FILES`, and it is not loaded by `tools/suite.mjs` — the seed-matrix harness
is a separate entry point. So all 11 gate-relevant files are byte-identical
`bdfd52b -> b5456d4` and this verdict transfers forward to the branch tip.

That is the same transfer-forward argument `inpod-suite-4c2302a-y8o` made and
`tools/gatecheck.mjs` now mechanizes — stated here explicitly, with its
precondition named, so it can be re-evaluated rather than assumed. Run
`node tools/gatecheck.mjs` to check it against whatever the tip is when you read
this: if that file set ever stops matching, this receipt does **not** cover the tip.

## IN-POD, not via kube.mjs

Run **in-pod** on a gasboat fleet pod (project `cs`), NOT through `tools/kube.mjs`.
CLAUDE.md's scope note permits this: *"a gasboat fleet pod (project `cs`) IS cluster
compute — it may run sim workloads in-pod within its own resource limits."* The local
kube ban protects the operator's Mac; this pod is not the Mac.

## How it was run

    node --version      -> v24.15.0
    git rev-parse HEAD  -> bdfd52b
    nproc               -> 8      (HOST cores; see below)

**`--jobs 4`, not 7.** `nproc` reports 8, but that is the HOST's core count, not this
pod's cgroup quota: `/sys/fs/cgroup/cpu.max` reads `400000 100000` = **4 cores**.
Oversubscribing would not have changed the verdict, but it would have made the wall
times in this receipt meaningless.

    # js backend
    SIMLIB_REALM=main                     node tools/suite.mjs --jobs 4

    # wasm twin (SEQUENTIAL, never concurrent with the js run)
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main  node tools/suite.mjs --jobs 4

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the same shape the other receipts use.

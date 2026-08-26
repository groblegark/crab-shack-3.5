# inpod-suite-0a47dea-mrg — the music-controls MERGE gated in its own name

**Verdict: GREEN, both backends — js 381/381, wasm 381/381**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 381/381 passed | 0 | 1593.5s |
| wasm | 381/381 passed | 0 |  928.5s |

Zero failures on either backend.

    sha  = 0a47dea69865cf150ca106e6ba8485ff64982228   ("the stamp names the music-controls merge")
    tree = main, after merging cs-music-controls

## Why the branch's own GREEN did not reach this tree

The branch tip was gated in its own name (`inpod-suite-bdfd52b-mus`, js 380/380 +
wasm 380/380) and main's tip was gated in its own name
(`inpod-suite-62305a8-r84`, 379/379). **Neither verdict covers their merge.**
`tools/gatecheck.mjs` said so directly at this tip's parent:

    RED    the gate-relevant files differ from the newest gated ancestor 62305a8.
      ~ game.js  (+183 / -26)
      ~ tools/simlib.mjs  (+26 / -2)
      ~ tools/suite.mjs  (+143 / -0)

A merge is a tree neither parent ever was. Both parents being green is an
argument *about* this tree, not a measurement *of* it — and the scenario count
moves (379 + 2 = **381**), so the two runs did not even cover the same set. This
receipt is the measurement.

## What is in the merge

**From `cs-music-controls`** — the music controls leave the record box: MUS is an
on/off switch with the box behind a chevron; up/down arrows in the box auto-play
the row; shift+arrows step tracks from anywhere; shift+K keeps what is playing;
and the "never more than one track at once" bug is fixed at its cause (a stale
`ended` closure writing the global `music` handle, not a missing pause).

**From `main`** — `tools/cores.mjs` (schedule off the cgroup quota) and the
pigway worked-example truthfulness ratchet.

## One conflict resolved toward the OTHER branch's version

Both branches independently fixed the same `os.cpus().length` host-cores defect
in `tools/headless.mjs`. Main's is better — a shared helper that cross-checks
`availableParallelism()` against `cpu.max` and covers `batch.mjs` too, where the
branch had a one-file `min()`. **Main's was taken; the branch's commit `b5456d4`
is superseded, not reverted.** The defect is fixed either way, which is the part
that matters.

The *other* half of that branch's `headless.mjs` change survives and is still
load-bearing: the `Audio` stub's `play()` returned a bare `{catch}` thenable
where a browser returns a **Promise**, so any `.play().then(...)` threw. Both
stubs (`simlib.mjs`, `headless.mjs`) now return a real promise.

`version.js` also conflicted; it is generated, so it was regenerated after the
merge rather than resolved by hand — the stamp names this merge (`900872d`'s
child), which is the convention.

## Ritual state at the tip (checked, honest)

- `node tools/mkcultureways.mjs` -> byte-exact, no diff. Bundle is honest.
- `node tools/mkversion.mjs` run after the merge commit; the stamp names the merge.
- `node --check` parses game.js, tools/{suite,simlib,headless}.mjs.
- Sim fingerprint untouched by the music work — music is view, not sim.

## IN-POD, not via kube.mjs

Run **in-pod** on a gasboat fleet pod (project `cs`), NOT through `tools/kube.mjs`.
CLAUDE.md's scope note permits this: *"a gasboat fleet pod (project `cs`) IS cluster
compute — it may run sim workloads in-pod within its own resource limits."* The local
kube ban protects the operator's Mac; this pod is not the Mac.

## How it was run

    node --version      -> v24.15.0
    git rev-parse HEAD  -> 0a47dea69865cf150ca106e6ba8485ff64982228

    # js backend
    SIMLIB_REALM=main                     node tools/suite.mjs --jobs 4

    # wasm twin (SEQUENTIAL, never concurrent with the js run)
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main  node tools/suite.mjs --jobs 4

`--jobs 4`, not the host's core count: `nproc` reports 8 while
`/sys/fs/cgroup/cpu.max` grants 4 (`400000 100000`) — the same quota the newly
merged `tools/cores.mjs` now reads for every forking tool in the repo.

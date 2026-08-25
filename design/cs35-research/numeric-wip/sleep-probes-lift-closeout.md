# CLOSE-OUT: lifting the four sleep probes onto main

**Bead:** kd-yNtoSb0zAW — "Lift the four sleep probes onto main before
cs-crab-bedtime is abandoned, and fix two defects in them." Parent epic
kd-ppo3YfKtA5. A pure instrument salvage — no behaviour change, no economy risk,
holds under every option of the open decision kd-S9IU9fFDTw.

## What landed

Four `tools/` probes, cherry-picked from `origin/cs-crab-bedtime` (a deliberately
unmerged branch, 1 ahead / 19 behind main) onto `main` at `c987a87`:

- `tools/sleepdebt.mjs` — does sleep debt accumulate? (tired/woke/pinned%/deaths)
- `tools/clockoff.mjs`  — how long between shift end and actually being HOME?
- `tools/yoyo.mjs`      — do crabs go home then out again (yo-yo) after clock-off?
- `tools/sleephours.mjs`— how many dark hours does a crab actually sleep?

**NOT lifted: `game.js`.** The branch's engine change adds exactly three symbols
(`pastBedtime`, `DIRE_NEEDS`, `NIGHT_NEED`) — the CONTESTED change that belongs to
open decision kd-S9IU9fFDTw, which the operator has not answered. That change did
NOT come with the probes.

## Portability verified by symbol (the bead's core premise, re-checked)

A grep for all three engine symbols across all four probe files returns ZERO hits
in every file — they drive the sim through the ordinary `createSim`/simlib surface,
which is already on main:

    for f in sleepdebt clockoff yoyo sleephours; do
      git show origin/cs-crab-bedtime:tools/$f.mjs | grep -nE 'pastBedtime|DIRE_NEEDS|NIGHT_NEED'
    done
    # -> ZERO hits in all four

All four run to completion on main producing their numbers with no `game.js`
change — the premise held, no finding.

## Two defects fixed in the same pass

**Defect 1 — a dead arm flag.** `sleephours.mjs:7` declared
`const BEDTIME = process.argv.includes("--bedtime")` and never read it (grep
confirmed the one line). A silently-dead flag means the next person runs
`--bedtime`, receives the UNARMED control, and reports it as the arm. Deleted —
the bedtime prototype it served lives on the branch being abandoned.

*Mutation demo (cheapest possible form, run BEFORE the fix):* sleephours WITH and
WITHOUT `--bedtime` produced BYTE-IDENTICAL output, proving the flag was dead.
After deleting the line, the output is byte-identical to the pre-fix unarmed
control — deleting it changed nothing.

    diff sleep-probes-lift-sh-before-noflag.txt sleep-probes-lift-sh-before-bedtimeflag.txt  # empty
    diff sleep-probes-lift-sh-before-noflag.txt sleep-probes-lift-sh-after-fix.txt           # empty

**Defect 2 — absolute simlib imports.** `clockoff.mjs`, `yoyo.mjs` and
`sleephours.mjs` imported simlib by absolute path
(`/home/agent/bot/cs/work/tools/simlib.mjs`); only `sleepdebt.mjs` used the
relative `./simlib.mjs`. The absolute form breaks in any pod whose checkout
differs and in every git worktree (`gb workspace`). Normalized all four to
`./simlib.mjs`. (This is the reason the probes were not "durable" — the whole
point of the bead.)

## Gate — two-part, both green

These are `tools/`, not game code: no scenario reads them and the suite does not
cover them, so the honest gate is (a) each probe runs and produces its numbers,
(b) the suite still owes a green because `tools/` is in the repo.

**(a) All four probes produce their numbers on main after the lift** — receipts:
`sleep-probes-lift-{sleepdebt,clockoff,yoyo}.txt` and `-sh-after-fix.txt`.
Representative: sleephours reads CREW mean 8.91h slept, under-6h 28%, and a
bedtime curve peaking 97% HOME at 03:00; sleepdebt reads 8 deaths over 2416
crab-nights, longest pinned run 8 nights.

**(b) Full suite green on BOTH backends** — 376 scenarios each, sharded 6-ways
in-pod (`SIMLIB_REALM=main`), each shard banking its own durable verdict:

- JS backend:   376/376 passed, all shards `EXIT=0`
- WASM backend: 376/376 passed, all shards `EXIT=0`

Receipt: `sleep-probes-lift-suite-verdicts.txt`. (`tools/kube.mjs` cannot install
from a cs pod — helm dies on missing RBAC in ns crab-science, escalation
kd-Y7RzIznJAw P1, re-verified failing at c987a87 — so the suite ran in-pod, which
a cs fleet pod is entitled to as cluster compute. A cs pod OOM-killed one 6-wide
parallel batch mid-run; re-running the interrupted shard alone and the wasm
backend in two batches of three finished clean.)

## Merge hygiene

- **Stale-base deletion check** (advice kd-Wuar80ygL9):
  `git diff origin/main <branch> | grep '^-'` over `tools/` returned ZERO
  deletion lines — the lift is pure addition, reverts nothing.
- **Merge ritual:** `node tools/mkcultureways.mjs` left `cultureways.js`
  byte-exact (no bundle move, as expected — no finding); `node tools/mkversion.mjs`
  stamped the merge's own identity (two-commit stamp dance, matching trunk
  convention).

# CRAB SHACK 3 — working notes for Claude

**Read PLAN.md first.** It is the project brain: systems map, verified balance
numbers, backlog, and conventions. Don't duplicate it — update it there.

## KUBE POLICY (Matt, 2026-08-23 — ABSOLUTE)
The Mac crashed five times running parallel sim workloads. **Never run
sim/compute node scripts locally** — not the suite, not headless matrices,
not batch/bench, not the MCP check battery, not neuro training/xcheck —
not even "one quick check". A PreToolUse hook enforces this and denies any
Bash command whose text so much as names those scripts (that includes
heredocs and echo — write docs mentioning them with the Edit tool, not the
shell). Everything runs on the gasboat-prod cluster via
`node tools/kube.mjs run experiments/<manifest>.json --ref <pushed-SHA>
--wait` — see design/cs35-kube-runbook.md. Allowed locally: tools/kube.mjs
itself, tools/mkcultureways.mjs, `node --check`, and other sub-second
single-process commands. Gates = the suite-312 manifest; matrices and
science sweeps = their own manifests. Receipts land under
design/cs35-research/kube-runs/.

Scope note: this policy protects the OPERATOR'S MAC. A gasboat fleet pod
(project `cs`) IS cluster compute — it may run sim workloads in-pod within
its own resource limits, and should, since it has no AWS identity to drive
tools/kube.mjs. The hook only exists on the operator's machine.

## THE MERGE RITUAL (orchestrator, at every merge before push)
Run `node tools/mkcultureways.mjs` (bundle regen must be byte-exact) AND
`node tools/mkversion.mjs` (regenerates version.js — the title-screen build
stamp; the stamp is the MERGE's identity, so a push whose stamp names the
previous commit is a ritual miss). Both are sub-second generators, allowed
locally. The stamp now also carries the commit's epoch (`t`), which the title
screen counts up from live — "PUBLISHED 2M 5S AGO" — so a missed regen is
visible to a play-tester as an age that is wrong by a whole merge, not just a
stale sha.

## The sim contract (load-bearing)
- `tools/simlib.mjs` executes the REAL game files (font.js, ppu.js, sprites.js,
  crabs.js, game.js) inside a Node vm with stubbed browser APIs and a seeded
  RNG. The headless sim IS the browser game engine — never fork or reimplement
  game logic inside tools/.
- Corollary: if game.js starts using a new browser API, stub it in
  simlib.mjs (and the matching stubs in tools/headless.mjs) or the whole
  headless toolchain breaks.
- **`runDays(N)` is ABSOLUTE, not relative** — it runs while `day <= N`. A
  second `runDays(2)` after `runDays(5)` is a silent no-op that returns
  instantly and proves nothing. Always pass the day you want to reach.

## Perf expectations
- ~5–10 sim-days/sec per core in the vm realm, single-threaded per seed —
  and **~4.3x that in the main realm** (`SIMLIB_REALM=main`, or `--realm main`
  on headless/bench): the vm escape runs the game files outside the vm
  context's contextify interceptor, fingerprint/suite/matrix-identical by
  receipt (design/cs35-research/vm-escape/). The full sharded suite runs in
  ~35s there vs ~103s. Default stays vm until the numeric branch merges;
  debug in vm (real filenames in stack traces), measure in main.
- Seed matrices: `node tools/headless.mjs --days N --seeds K [--jobs J]`.
  `--jobs` forks one worker per seed (default: min(seeds, cores−1));
  `--jobs 1` is the exact sequential path. Seeds are deterministic either way.
- Don't run two sims concurrently when benchmarking, or timings lie.

## Suite discipline
- `node tools/suite.mjs` (all scenarios) must be green before any commit.
- Balance changes need a headless matrix re-run. Measured 2026-08-24 in-pod at
  `83fb0f4` over 48 towns (`--seedbase 0,16,32`): baseline (buy nothing)
  **0/48**; growth (`--buy chef,table`) **15/48** — and the blocks were `sb0: 5`,
  `sb16: 2`, `sb32: 8`, so **any single 16-town block is a coin**. Receipt:
  `design/cs35-research/kube-runs/cs-e4-ladder-matrix-inpod-ekc/`. That growth
  number is the intended difficulty, not a regression to fix — see STATE OF PLAY
  in PLAN.md. **Do not cite these figures for a different tree**: re-measure
  against the tree you are landing on, which is the whole point of the rule.
- **Arm-off hatches for attribution**, all of them `window._no*` flags the
  harness sets: `--nohall` (the whole office), `--nofloor` (the wage floor
  only, office still running), `--nocap` (the house limit only), `--norival`,
  `--nohotelier`, `--nodorm`, `--noannexe`, `--failoff`. Reach for the narrow
  one: `--nohall` moves the shelter too, so it cannot tell you whether a
  payroll policy did something.
- **The 8-seed growth block is noisy — run the second one.** Measured on the
  visitor pass: the same build reads 2/8 on the default seeds and 4/8 on
  `--seedbase 8`, and the pre-pass build reads 4/8 and 2/8 on the same two
  blocks. Sixteen growth seeds is the honest number; eight is a coin.
- **Measure against the tree you are landing on, not against the number in
  PLAN.** Four passes in one day each cost ~1 growth escape, each measured
  honestly at 8 seeds, each a coin flip on its own — and together they took the
  pillar from ~5/16 to 1/16. A pillar can be eroded entirely by changes that
  are each individually defensible.
- **The matrix measures the FLOOR, not the ceiling.** `headless.mjs` buys a
  fixed list and trades on autopilot: it never re-prices against a rival, moves
  an hours sign, fires a bad hire or reads the departure card. It is a
  regression detector, not a difficulty dial — never make the game easier for a
  bot that is not trying.

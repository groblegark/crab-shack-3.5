# CRAB SHACK 3 — working notes for Claude

**Read PLAN.md first.** It is the project brain: systems map, verified balance
numbers, backlog, and conventions. Don't duplicate it — update it there.

## THIS TREE IS FROZEN TO MAINTENANCE (CS4-01a, Matt, 2026-08-30)
CS4 is a **greenfield** project; 3.5 is the tree it learns from, not the tree it
grows out of. This repo is therefore **maintenance-only**: bug fixes and receipts
land, features and balance changes do not.

**The line is between LANDING and RUNNING, and it is not the obvious one:**

> **Maintenance is what may LAND. Instrumentation is what may RUN.**

3.5 is the only executable thing the project owns, and CS4's calibration is
unmeasured by its own doctrine — so CS4 spikes are *expected* to run against this
tree. Running a gate, a matrix, or a training arm here is inside the freeze; a
spike produces **a receipt, not a merge**. Merging the arm is not maintenance.

This note lives here rather than in a bead deliberately: the agent who would
otherwise land a balance change reads `CLAUDE.md` at boot and will never open a
doc bead.

## DELIVERY IS FABLE-CLASS FOR NOW (CS4-46, Matt, 2026-08-30)
**Implementation and final sign-off are performed by Fable-class agents** for the
near term — the whole delivery path, not just the authored art of CS4-43.

The sign-off half is the load-bearing one. CS4 deliberately *weakens* its own
automated instrument: this tree's gate is two independent implementations
agreeing (a check on the **spec**), and CS4 replaces it with golden fingerprints
(a check on the **diff**) — where a wrong day-1 fingerprint is wrong forever AND
green forever. A golden day must therefore be recorded from a **reviewed** run,
and `backbone_allowed` left a pre-declared battery as the only blast-radius
barrier.

> Until the corpus is seeded and the battery is declared, **the reviewer IS the
> gate.**

*"Near term"* has an expiry condition so it does not rot into folklore: **it lifts
when the gate is a gate again** — golden corpus seeded from reviewed runs, and the
battery declared ahead of the runs it judges.

## KUBE POLICY (Matt, 2026-08-23; extended to ALL gates 2026-08-26 — ABSOLUTE)
**EVERY gate runs on the cluster. No exceptions, Mac or pod.**

```sh
node tools/kube.mjs run experiments/suite-330.json --ref <pushed-SHA> --wait
```

That is the gate. It clones the PUSHED SHA, so commit and push the branch
first — your uncommitted tree does not exist to it. Green means the MERGED
VERDICT line, both backends. See design/cs35-kube-runbook.md.

The Mac crashed five times running parallel sim workloads. **Never run
sim/compute node scripts locally** — not the suite, not headless matrices,
not batch/bench, not the MCP check battery, not neuro training/xcheck —
not even "one quick check". A PreToolUse hook enforces this and denies any
Bash command whose text so much as names those scripts (that includes
heredocs and echo — write docs mentioning them with the Edit tool, not the
shell). Allowed locally: tools/kube.mjs itself, tools/mkcultureways.mjs,
tools/mkversion.mjs, `node --check`, and other sub-second single-process
commands. Matrices and science sweeps = their own manifests. Receipts land
under design/cs35-research/kube-runs/.

**A fleet pod is NOT an exception, and this is the part that keeps getting
re-learned.** A pod may run sim work in-pod within its cgroup, so it is
always *possible* to gate in-pod — it is just extremely slow, and nothing
stops you. Measured 2026-08-26 on one tree: in-pod `tools/suite.mjs`
(which defaults to **`--jobs 1`** — the trap) ran **90 minutes and reached
148 of 379** before it was killed; the cluster returned **760/760 both
backends in 7m35s** across 24 arms. A pod HAS an AWS identity (IRSA) and
drives kube.mjs fine — proven twice that day. In-pod runs are for a single
scenario you are iterating on (`node tools/suite.mjs "<filter>" --jobs 1`,
seconds), never for a gate.

Do NOT `export AWS_PROFILE` in a pod. IRSA already works, and setting it
breaks the SDK's credential lookup so kube.mjs reports a healthy session
as dead and tells you to run an SSO login a pod cannot do (runbook).

**Keep the manifest current.** Gates use the newest `experiments/suite-*.json`
— suite-330 as of 2026-08-26 (439 scenarios, 12 slices x 2 backends). When
the scenario count outgrows it, add the next manifest rather than letting
this line rot: it read "Gates = the suite-312 manifest" two generations after
suite-312 was current.

## HOW WORK REACHES TRUNK: a direct --no-ff merge, pushed by you
**This project does not use pull requests.** The agent that gated a branch
merges it to main itself (`git merge --no-ff`) and pushes. Measured 2026-08-26:
across the repo's entire history `git log main --grep='Merge pull request'`
returns **1**, and every recent landing was authored and pushed by a `cs-*` pod.
`git push origin HEAD:main` works from a fleet pod.

**Do NOT file an escalation asking a human to open a PR.** Three separate agents
did exactly that in two days — each hit a real `createPullRequest` PAT denial,
each correctly concluded the token lacked the scope, and each then *incorrectly*
inferred that delivery needed a human. All three branches sat gated-green and
unlanded until a captain freed them; one was a bug Matt had reported from a
deployed build, so the fix he was waiting for was parked behind a ceremony this
project has never performed. The PAT denials were REAL. The blocker was not.

The lesson generalises past this repo: **probing the tool you EXPECT to use is
not enough, because the tool you expect may not be the tool the project uses.**
Ask what the repo actually does — `git log` is the authority — before concluding
you are blocked from doing it.

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
- The suite must be green before any commit — via the CLUSTER gate
  (`node tools/kube.mjs run experiments/suite-330.json --ref <pushed-SHA>
  --wait`), never a local or in-pod full run. See KUBE POLICY above. Filtering
  to one scenario while you iterate (`node tools/suite.mjs "<filter>"`) is fine
  in a pod and takes seconds; the full suite is not.
- Balance changes need a headless matrix re-run. THE U1 LAND-ASIS TREE
  (2026-08-27, continuous citizen decay at `CIT_DECAY_MUL=7`) knowingly erodes
  the growth pillar — that erosion is the intended difficulty and a RULED
  decision (Matt, decision kd-0hYmwnHeOp), not a regression to fix. Measured over
  48 towns (`--buy chef,table`, `--seedbase 0,16,32`): growth **7/48** (captains'
  final read, receipt `design/cs35-research/kube-runs/cs-u1-final-bfaec4d-c7zl/`;
  an independent calibration re-take read **12/48**,
  `.../cs-u1-rebase-cal-3fc20a3/`) against a pre-U1 control RE-TAKEN on this tree
  of **17–18/48**; baseline (buy nothing) stays **0/48**. The boredBilled fix
  (kd-pFt14eVtUq) folded on top is verified matrix-inert. The older pre-trio,
  pre-U1 E4-ladder figure (`83fb0f4`, growth **15/48**, blocks `sb0: 5 / sb16: 2
  / sb32: 8`, `.../cs-e4-ladder-matrix-inpod-ekc/`) is retained only to show that
  **any single 16-town block is a coin**. **Do not cite any of these figures for
  a different tree**: re-measure against the tree you are landing on, which is the
  whole point of the rule.
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

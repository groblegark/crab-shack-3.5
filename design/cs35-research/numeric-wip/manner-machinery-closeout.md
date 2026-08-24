# MANNER + STAY SHAPE — the machinery (census C4+C5, one slice)

Implements design/cs35-manner.md's ladder step 1 (+2): the `manner` section
and the `arrival` section's stay-shape growth, machinery only. NO bundled
culture declares anything — the fixtures' silence is the byte-identity, and
the regenerated cultureways.js is byte-exact (95529 bytes, unchanged).
Declarations are separate full-ceremony balance events, ruled by Matt.

## What landed where

- **`MANNER` / `mannerOf(k)`** (game.js, beside the VIS constants): the crab
  table IS the engine constants by identity (`SPEED: VIS_SPEED, STROLL:
  VIS_STROLL, SPACEQ: VSEP_RXQ, WMUL20: 20, RIDES: true`). Serves both
  culture homes (guest at k.culture, settled worker at c.p.culture — the
  mgmtOf lesson). `ARRIVE` / `arrivalOf(k)` the same for stay shape
  (`DT: VIS_DAYTRIP, PATQ: VIS_PATIENCE*PQ, THINK: VIS_THINK`).
- **buildCulture**: author px cross the Q8 boundary once (`space * Q8`),
  seconds become PQ patience, deciseconds become ticks (`idiv(thinkDs*SEC,
  10)` — exact, SEC is 20). Per-field crab inheritance; `RIDES` builds false
  REGARDLESS (the gate refused true), so the walk pin is data with one value.
- **Read sites threaded**: newVisitor (daytrip roll, patience, thinkT — the
  crab path reads the same doubles/ints through `A = ARRIVE`, so the compare
  and every draw are the pre-manner ones to the bit); visStep's kernel call
  AND its JS twin (one dispatched speed); the stroll pick; the three
  patience/think resets; visAfterCounter; **visWalkMins — the ferry-ETA
  divide reads the dispatched speed** (the design doc's named trap: a slow
  culture must never be promised a boat it cannot catch).
- **visSeparate**: per-actor `_vsq = mannerOf(k).SPACEQ` cached per pass
  (transient, like `_vmoved`, never saved); a pair parts to `max(a,b)` —
  give_berth's own rule. All-crab pairs read exactly VSEP_RXQ as before.
- **crabMoveQ8**: walkMul20 composes where the trait multiplier lives; the
  crab branch is false (untouched), a declared 20 is skipped.
- **convertTourist**: `p2.mode = "walk"` pin became `if (!culRides(...))` —
  behaviorally identical (culRides is false for every cultured people while
  the ride-art gate stands), and the pin is now visible data.

## The kernel (one-argument ABI change, byte-identical by construction)

`vis_step(i, txq, tyq, dtT)` → `vis_step(i, txq, tyq, speed, dtT)`,
mirroring step_to's shape; `#define VIS_SPEED 42` deleted; the caller passes
`mannerOf(k).SPEED`. Passing 42 computes the identical `spq`. One caller in
game.js (verified: exactly 1 site). Rebuilt via tools/kernel/build.sh;
index.html stamped v=3a4812ae; the kernel-agreement referee scenarios run in
every gate below.

## Validation (each refusal NAMED, mirrored in mcp/culture.mjs + docs)

speed 8–120 ("A BAD STROLL SPEED"), stroll 60–800 ("A BAD STROLL RANGE"),
space 4–16 ("A BAD PERSONAL SPACE" — capped so no document gridlocks a
counter; the 8px growth-curve lesson is in the schema description), walkMul20
10–40 ("A BAD WALKING PACE"), rides:true refused ("NO RIDE ART FOR THIS
PEOPLE"); daytrip20 0–20 ("A BAD DAYTRIP SHARE"), patienceSecs 20–400 ("A BAD
PATIENCE" — clamp doctrine deferred to design/cs35-body.md per the design),
thinkDs 4–80 ("A BAD THINK CADENCE").

## Scenarios (suite grows by 2; hostile gate grows 7 rows with EXPECTED texts)

- "manner: a cultureway's gait and stay land in the engine's own units, and
  only for its own folk" — conversion, per-field inheritance, both dispatch
  homes, crab/silent identity (`===`), culRides both ways, walkMul20
  composing with the trait multiplier without moving the crab's own gait.
- "manner: a wide-berth guest parts the crowd to HER radius, and crab pairs
  keep theirs" — the observable (data-must-bite) scenario: a space:12 pig
  parked in a crab pile stands ≥12px clear while the crab pair keeps the
  engine's 8.
- Hostile rows: rocket stroll / mile-wide berth / fractional gait / a pig at
  the wheel / flooded daytrip / saint's patience / racing mind — each row
  asserts its NAMED refusal (the vacuous-mutation lesson).
- MCP: the four-way-bad document grows manner + arrival sins; 3 new checks.

## Infrastructure ride-alongs (KUBE POLICY)

- kube-arm's entry allowlist grew `mcp/` so the check battery runs as a
  cluster arm (experiments/mcp-checks.json) — the policy moved it off the box.
- experiments/manner-scenarios.json: the slice's own scenarios + the hostile
  gate + the kernel referee + the personal-space pins, both backends — the
  cheap instrument the mutation tests run on.

## Gates (all cluster; receipts collected per run, local per the tip's
## receipts-are-artifacts convention)

- **Targeted instrument green** (manner-scenarios: the 2 new scenarios + the
  hostile gate + the kernel-agreement referee + the 3 personal-space pins,
  both backends): **14/14** at 85de7ff. One honest stumble on the way: the
  scenario's own expectation misread deciseconds (expected 2·SEC for
  thinkDs 32; 32 tenths is 3.2s = 64 ticks — the BUILD was right, the test
  was wrong, fixed in its own commit).
- **Pre-rebase full suite** at 4f82a69: kube reported 510/510 passed — but
  only **13 of 16 arms banked receipts** (the machine slept mid-run), so
  that verdict was PARTIAL: missing receipts are missing verdicts, the
  merged line counts only what banked. Recorded as the lesson, not the
  gate; the rebased run below is the authority. MCP battery at 4f82a69:
  **52/52** (49 + the 3 new manner/arrival checks), exit 0.
- **Rebased onto the tip** (phase D capability APIs + the trunk-spike
  landing): unions in cultureProblem (cards + stay-shape), the schema
  (cards + manner), and mcp/culture.mjs — each resolved keeping both
  blocks with their own closers (the biz slice's brace-trap lesson,
  heeded). Bundle regen byte-exact after rebase (95529, fixtures silent).
- **Final gates at the rebased SHA**: full suite (suite-318 manifest, both
  backends) + the MCP battery (phased-gates) — verdicts in the run log
  banked beside this close-out's receipts.

## Mutations (both backends each, via the targeted manifest — the cheap
## instrument built for exactly this)

- **A. Loosened clamp** (space 4–16 → 4–99999 in cultureProblem): the
  hostile-gate scenario went RED in js AND wasm — the "a mile-wide berth"
  row's named-refusal assertion caught it. Reverted; green restored.
- **B. Misread field** (buildCulture reads speed×2): the mechanism scenario
  went RED in both backends naming the field ("manner.SPEED built as 120,
  want 60"). Reverted; green restored.
- Both mutations live in history as WIP+revert pairs (the house pattern):
  52565b0/82c078a and 730dcfd/96f9715-era commits, re-hashed by the rebase.

## Infrastructure notes for the runbook

- New manifests MUST carry `nodeSelector` + `tolerations` for the ephemeral
  pool — without them pods pend forever against every taint in the cluster
  (learned live; the fix commit calls it "the schedulability half of the
  arm contract").
- A slept host kills watchers but not cluster jobs: on wake, receipts first
  (and COUNT them against the arm count — a merged verdict over partial
  receipts looks green).
- kube-arm's allowlist grew mcp/ in this slice; phase D independently
  shipped phased-gates.json for the same need — both compose, and
  experiments/mcp-checks.json remains as the single-arm variant.

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

## THE REBASE ONTO main (2026-08-25, in-pod, cs fleet crew)

Landed onto main **9491fd0** (E4 slice 4a/b/c/d, the civics families). Main
moved twice during this work: first probed at c35c0b6, gated at 537607c, then
E4 slice 4 landed (537607c -> 9491fd0) mid-gate, so per discipline 1 the tree
was re-rebased onto 9491fd0 and re-gated from scratch there — the 537607c
verdicts below are kept as the story, but 9491fd0 is the authority (see FINAL
9491fd0 GATE at the end).

The Gates section above is the branch's OWN history and its SHAs
(85de7ff/4f82a69, the 95529-byte bundle) predate five landed phases
(E0/E1/E2/E3/E6), E5, E4, and the cs35->main trunk rename. Per discipline 1 a
verdict belongs to one tree; none of those transfer. This section is the
re-gate on the tree this actually lands on, measured in-pod (no cs pod has a
kube context; a fleet pod IS cluster compute and gates itself — 16 cores).

The mechanics below were first measured on the 537607c rebase; the 9491fd0
re-rebase is identical in kind (E4 slice 4 added `eligR` to the buildCulture
return key-list, so the second rebase had ONE game.js conflict — the same
additive-union key-list resolution — while crabMoveQ8 auto-merged clean).

- **Rebase shape.** One commit cherry-picked onto main 537607c. Exactly ONE
  conflicting file — game.js, two hunks, both additive union:
  1. `crabMoveQ8`: main's E2 rewrite `MOVE_Q8[c.p.trait]` -> `traitOf(c).moveQ8`
     met the branch's WMUL20 multiply on that same line. Resolved to main's
     accessor as the base + the branch's WMUL20 block. VERIFIED the accessor
     yields the identical crab base (14336) before stacking: the pig fixture
     declares no `traits` table, so `traitOf` returns the crab table for a
     pig-speedy crab (pigBase === crabBase === 14336). The multiply composes
     on top, unchanged.
  2. `buildCulture` return object: pure key-list union (main's
     idle/traits/departR/civicsR/urge/drift/accept + the branch's manner,stay).
  Everything else auto-merged, INCLUDING tools/mkcultureways.mjs and
  mcp/docs.mjs (the brief's predicted collisions did not occur); the
  kernel files (kernel.wasm/kernel.c/kernel-b64.js) and
  experiments/manner-scenarios.json are byte-identical to the branch.

- **One rebase-repair, in tools/suite.mjs.** The manner mechanism scenario
  read the pre-E2 symbol `MOVE_Q8.speedy`, gone since main's traits rename;
  updated to `traitOf({p:{trait:"speedy"}}).moveQ8` (same number, post-E2
  spelling). This is the ONE place the rebase changed a gate, and it changed
  the TEST's spelling, not the build.

- **Kernel: no rebuild, none needed, none possible here.** main never touched
  tools/kernel/ since the merge base (071143d), so there was no kernel
  conflict — git auto-took the branch's rebuilt binary. Confirmed by
  instantiation: the committed .wasm exports vis_step with arity 5 (the speed
  arg), 36413 bytes. Hash chain consistent on the merged tree: kernel-b64.js
  base64 == kernel.wasm; index.html `?v=1a4e8863` == sha1(kernel-b64.js). No
  cs pod has zig/clang/emcc, so a rebuild was neither required nor attempted.

- **Merge ritual.** `node tools/mkcultureways.mjs` regenerates cultureways.js
  BYTE-EXACT (119350 chars / 119358 bytes — no bundled culture declares a
  manner or stay, so the fixtures' silence is the identity). `node
  tools/mkversion.mjs` stamps the work commit.

- **Full suite: 352/352 GREEN, both backends, exit 0** (main realm,
  SIMLIB_REALM=main --jobs 8, 1171.8s in-pod). The branch adds exactly 2
  scenarios (350 on main -> 352). A first attempt at --jobs 12 in the vm
  realm oversubscribed the box and drove the watchdog into a long serial
  re-queue drain; the main realm (receipt-identical, ~4.3x faster per
  CLAUDE.md) is the authority here.

- **MCP battery: 55/55, exit 0** (main 52 -> 55, exactly the +3 manner/arrival
  checks the branch adds).

- **Byte-neutrality, attacked with an independent instrument.** main 537607c
  and the merged tree produce BYTE-IDENTICAL headless output over 8 seeds x
  12 days (every per-day balance, lifetime, wallet and stats line matches;
  only the wall-clock total differs). The machinery changes nothing
  observable, as the epic claims — measured, not asserted.

- **Three mutations, each bit and named its own line, reverted byte-clean:**
  A. Bent the speed arg AT THE JS CALL SITE (`KERN.exports.vis_step(...,
     mannerOf(k).SPEED + 1, dtT)`, JS `spq` untouched): the kernel-agreement
     referee went RED — "pool diverged at agent 2 field PXQ: ref 133199 vs
     kernel 99328". So the arg genuinely reaches the WASM stepper and
     "42 = identity" is FALSIFIABLE (the captain's named risk, disproven).
  B. buildCulture reads `speed * 2`: mechanism scenario RED naming the field
     ("manner.SPEED built as 120, want 60").
  C. space clamp widened 4..16 -> 4..99999: the hostile gate RED naming the
     row ("a mile-wide berth was not refused by cultureProblem").

- **Discipline 5 (return-equality != behaviour-equality) is covered by the
  suite's own draw-stream pins**, not just by returned numbers: `rng: the sim
  stream's draw count per day is pinned (seed 1337)` and `the sim stream's
  cursor is shared` both PASS on the final SHA — the second movement path did
  not move the RNG stream. Plus the byte-neutral headless run above compares
  lived behaviour, not just accessor returns.

- **Final SHA gated.** Load-bearing scenarios (manner x2, kernel-agreement,
  personal-space x3, cursor, draw-count pin, build-stamp) all GREEN on the
  committed HEAD. version.js differs from the gated working tree only in the
  stamp string; the one scenario that reads it ("the build stamp is
  well-formed and wired") checks shape/wiring, not the SHA value, and passes.

## FINAL 9491fd0 GATE — the authority (2026-08-25, in-pod, main realm)

The tree above was gated at 537607c; E4 slice 4 then landed and the branch was
re-rebased onto **9491fd0** and re-gated from scratch. These are the verdicts
that count. Work commit + stamp on top of 9491fd0.

- **Full suite: 364/364 GREEN, both backends, exit 0** (SIMLIB_REALM=main
  --jobs 8, 1177.8s in-pod). New main is 362 scenarios; the branch adds
  exactly 2 (the two manner scenarios) -> 364.
- **MCP battery: 60/60, exit 0** (new main 57 -> 60, exactly the +3
  manner/arrival checks).
- **Byte-neutrality vs 9491fd0: BYTE-IDENTICAL** headless output over 8 seeds
  x 12 days (only the wall-clock total differs). Re-measured against the tree
  actually landed on, per the "a number without its tree is not quotable"
  rule.
- **Three mutations re-run on the 9491fd0 tree — all bit, each named its own
  line, all reverted byte-clean** (A: PXQ divergence in the kernel referee;
  B: "manner.SPEED built as 120, want 60"; C: "a mile-wide berth was not
  refused by cultureProblem").
- **cultureways.js regenerated byte-exact** at 120998 bytes (E4 slice 4 grew
  the bundle; no manner/stay is declared by any bundled culture, so the
  regeneration is a no-op — the identity the machinery commit promises).
- One rebase-repair carried across both rebases: tools/suite.mjs's manner
  mechanism scenario read the pre-E2 symbol `MOVE_Q8.speedy`; updated to
  `traitOf({p:{trait:"speedy"}}).moveQ8` (same number, post-E2 spelling — the
  test's spelling changed, never the build).

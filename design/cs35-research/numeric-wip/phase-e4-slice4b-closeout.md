# PHASE E4 SLICE 4b CLOSE-OUT: the four purses become authorable rate grids

**Slice**: phase E rung E4, slice 4b (bead kd-B7t0qNCrZr; parent kd-q5SOraybkW;
plan cs35-phase-e-plan.md §2). Slice 4a made the two ballot dials (WAGE_FLOOR,
HEAD_CAP) authorable. This slice does the same for the **four purses** — the
rate grids `levy`, `dues`, `rents`, `tin` (game.js `PURSES`) that fund the
shelter.

## The architecture — the same in-place adoption as 4a, generalized

The purses are TOWN-LEVEL (one town, four purses), so they follow the identical
E6 crab-as-document / in-place adoption pattern as the ballot dials, NOT the
per-voter stakes dispatch. The 4a helpers were generalized, not duplicated:

- `ballotLadderProblem(steps)` became `civicsLadderProblem(steps, noun)` — one
  ladder law for both families (step 0 is the founding no-policy, every step a
  whole count, ≥2 rungs), with the noun riding the message so a bad PURSE and a
  bad BALLOT DIAL name themselves. `ballotLadderProblem` is kept as a thin alias
  so the 4a messages are byte-identical.
- `crabBallotSteps(id, fallback)` became `crabCivicsSteps(section, id, noun,
  fallback)` reading `BUNDLED_CRAB_CIVICS[section]`; `crabBallotSteps` is a thin
  alias over it.
- The purses adopt in place with `for (const k of PURSE_KEYS) PURSES[k].steps =
  crabCivicsSteps("purses", k, "PURSE", PURSES[k].steps)`, after the `PURSES`
  literal (the E6 `CRAB_COLORS.length=0; push` idiom). Every reader — `purseRate`,
  `purseYield`, `allPlatforms`, `policyLine` — draws the same rate grids in the
  same order. Byte-equal by construction; the frozen fingerprints did not move.

**The mechs are the engine's id space.** `PURSE_KEYS` drives `allPlatforms` and
the levy's conflict-of-interest, so the four ids are the engine's own. steps IS
the rate grid, and a save stores the INDEX (0..4, the engine's hardcoded range),
so step 0 is NO TAKE (rate 0 raises nothing) — the founding grid, load-bearing
forever, refused by name if a document deletes it.

## Stays engine (the boundary, per plan §2)

`purseYield`/`platTake` conservation (a levy that mints is inexpressible — no
verb), the LEVY conflict-of-interest mechanism, `purseOf`'s "rents" fallback,
`TIN_KEEP`. Only the RATE GRIDS and the labels are transcribed. The
`name/short/unit/who` labels ride the document for E7's full-crab-document bar
but are byte-equal decoration this slice (they feed only an edit toast), exactly
as the ballot labels are.

## Gates

- **Two new suite scenarios** (`civics purses:`), green both realms (vm+main)
  and both backends (JS + wasm kernel):
  1. *the document's rate grids are byte-equal to the PURSES literals* — the
     tabled==literal pin (pinned copies of all four grids; `purseRate({rate:4})`
     reads the adopted top step [8,400,40,400]; every step 0 is NO TAKE).
  2. *a tampered grid is refused by name and falls back, and a distinct grid
     reaches purseRate* — every `civicsLadderProblem`/PURSE refusal, the fallback,
     AND the adoption mechanism (a DISTINCT valid grid `[0,11,22,33,44]` must
     reach `purseRate` — the only honest proof adoption fired, not the E3
     return-value trap).
- **The stranger-door hostile battery** gained 6 purses cases (good + 5 refusals).
- **MCP test-server 54/54** (+1: the localiser names a purse grid with no NO-TAKE
  rung). Schema + docs.mjs teach `civics.purses` beside stakes and ballots.
- **Byte-neutrality**: the frozen fingerprints are UNTOUCHED. `mkcultureways`
  regen byte-exact. `mkversion` stamps the merge commit.
- **Full in-pod suite green** (see the receipt below).

## Mutation demos — two, each biting for its own reason, reverted byte-clean

1. **The DATA.** Drift the levy top step (8→9) in the fixture → *the document's
   rate grids …* goes **RED**: `the levy rate grid drifted: [0,2,4,6,9]`.
2. **The ADOPTION.** Make `crabCivicsSteps` return the fallback (ignore the doc)
   → *a tampered grid …* goes **RED**: `a distinct document grid did not reach
   purseRate - adoption is a no-op, the purse reads the literal path`.

## Out of scope, by design

- **Calendar + relief** (kd-73P2u9lEI4) and **eligibility** (kd-8JHuxqynmF,
  blocks E7) are the remaining slice-4 children.
- Stranger-people purses are validated at the door but inert (the crab founds the
  town). The door is tested hostile; the drive is the crab's own.

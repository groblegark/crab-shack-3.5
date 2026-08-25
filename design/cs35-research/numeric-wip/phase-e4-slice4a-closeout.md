# PHASE E4 SLICE 4a CLOSE-OUT: the ballot dials become authorable civics tables

**Slice**: phase E rung E4, slice 4a (bead kd-1UCGSDLRah; parent kd-q5SOraybkW;
plan cs35-phase-e-plan.md §2). Slice 3 (kd-j5RzOniDkt) made `civics.stakes` an
authorable, per-voter, L1-dispatched section. This slice transcribes the first
of the four remaining families: the two **ballot dials** — the wage floor
(`WAGE_FLOOR`, game.js) and the house limit (`HEAD_CAP`).

## The architecture, and why it is E6's, not slice 3's

The load-bearing decision (design/cs35-research/numeric-wip/phase-e4-slice4-design.md).
`stakes` is PER-VOTER: `platValue` dispatches on `c.p.culture` because a resident
of a stranger people scores platforms on THEIR stakes. The ballot dials are NOT
per-voter — they are **town-level** facts: one town has one wage floor and one
house limit, and `floorOf`/`capOf` read `hall.policy`, not a crab.

So the dials follow the **E6 crab-as-document / in-place adoption** pattern
(names, colorways — game.js:5437's `CRAB_ART_DOC`), not the slice-3 dispatch:

- The crab's OWN bundled civics document supplies `ballots`. `crabBallotSteps(id,
  fallback)` reads `BUNDLED_CRAB_CIVICS.ballots` at the top-level const region
  (cultureways.js loads before game.js, proven by E6's own const there), and
  `WAGE_FLOOR`/`HEAD_CAP` take their `steps` from it.
- Adoption is IN PLACE: the object literals stay as the engine fallback, and
  EVERY reader — `floorOf`/`capOf`, `allPlatforms`, the `FLOOR_STEPS`/`CAP_STEPS`
  ladder lengths, `capAsk`, the save clamps, the UI bumps — draws the same steps
  in the same order. A bundle that matches the literals is byte-equal BY
  CONSTRUCTION; a drifted or hand-tampered dial falls back to the literal, named.

**Only `.steps` is read.** A grep proved `WAGE_FLOOR`/`HEAD_CAP` are touched
only via `.steps` — the `name/short/unit/who` labels are unread (the campaign
card hard-codes "MIN $" / "STAFF"). They ride the document anyway (plan §2's
shape, E7's "the full crab document") but they are inert this slice.

## Ruling 4, honored exactly (rulings 2026-08-24 §4)

The ladder is INDICES, not head-counts: `hall.policy.cap = 4` is the INDEX of
the 6-head rung. A save stores the index, so its meaning is forever. STEP 0 is
the founding NO-POLICY (NO FLOOR / NO LIMIT — what every pre-feature save loads
as, `wage:0` / `cap:0`). `ballotLadderProblem` REFUSES a ladder whose step 0 is
not 0 — Matt's literal preview `[4, 6, 8, 12]` DELETES step 0 and is refused by
name — because adopting it would silently reinterpret every existing save's
`cap:0` "no limit" as a four-head cap. No reweighting, no new rungs (ruling 5):
the dials are transcribed AS-IS.

## The named refusals (the door + the belt)

Build-time validation lives in `mkcultureways.mjs` (the E6 idiom — a bad fixture
fails the BUILD). Two runtime doors:

- **`ballotLadderProblem(steps)`** — the belt for a hand-tampered `cultureways.js`:
  `A BALLOT DIAL WITH NO LADDER` (not an array / < 2 steps), `A BALLOT DIAL WHOSE
  STEP 0 IS NOT THE FOUNDING NO-POLICY`, `A BALLOT DIAL STEP THAT IS NOT A WHOLE
  COUNT` (negative / fractional). A refused dial falls back to the literal.
- **`cultureProblem`'s ballots route** — the no-silent-drop contract (slice 3):
  now the schema admits `civics.ballots`, a stranger's malformed ballots is
  refused BY NAME at import (`A BAD BALLOTS SECTION`, `A BAD BALLOT DIAL`, `A
  BALLOT DIAL WITH NO ID`, `A BALLOT DIAL TWICE: <id>`, `BALLOT DIAL <id>: …`),
  never quietly ignored. A stranger's ballots are validated-but-INERT (the E5
  shape) — the town's dials belong to the crab who founds it.

## Gates

- **Four new suite scenarios** (`civics ballots:`), all green both realms (vm+main)
  AND both backends (JS + wasm kernel):
  1. *the document's dials are byte-equal to the WAGE_FLOOR/HEAD_CAP literals* —
     the tabled==literal pin (pinned literal copies; FLOOR_STEPS=4 / CAP_STEPS=6
     derive from the adopted ladder; step 0 is the founding no-policy).
  2. *the adopted ladder preserves every save's index meaning (ruling 4)* — the
     SAVE-COMPAT scenario the slice owes: `floorOf`/`capOf` map index→value
     byte-identical to the literal across every index; a pre-feature save (no
     wage/cap field) loads as NO FLOOR / NO LIMIT; out-of-range clamps to the top
     rung.
  3. *a tampered dial is refused by name and falls back to the literal* — every
     `ballotLadderProblem` refusal, plus the fallback, plus the ADOPTION
     MECHANISM proof (a DISTINCT valid doc ladder `[0,111,222]` must REACH the
     reader — the only honest way to prove adoption fired, not the E3
     return-value trap).
  4. *the election is byte-equal to the pre-slice engine, and a bent dial moves
     it* — the E4 transcription-equality gate on the ELECTION itself: a grown
     town's whole ballot (candidates, platforms, tallies, winner, every
     voteReason line) is deterministic and identical, then bending a live step
     MOVES the town (the vacuity guard, both dials independently).
- **Slice-3 scenarios still green** (the stakes grid sweep, the coefficient
  mutation, the crab-default and stranger-door hostile tables) — the stakes path
  and the crab election are untouched.
- **The stranger-door hostile battery** gained 7 ballots cases (good + 6 refusals).
- **MCP test-server 53/53** (+1: the localiser names a ballot ladder that deletes
  step 0). Schema + docs.mjs teach `civics.ballots` beside stakes (E7's bar).
- **Byte-neutrality**: the frozen fingerprints (`hours: defaults are
  behavior-identical`, `a save without cultures changes nothing`) are UNTOUCHED —
  the engine did not move. `mkcultureways` regen byte-exact (the bundle grew by
  the ballots section only; the slice-3 stakes bytes are where they were).
  `mkversion` regenerated at merge to stamp the merge commit.

## Mutation demos — PROVE IT BY BREAKING IT (two, each biting for its own reason)

1. **The DATA.** Drift the wage floor's step 2 in the fixture (2300→2301) →
   *the document's dials …* goes **RED** naming the dial: `the wage floor ladder
   drifted: [0,1800,2301,2700,3200]`. Reverted byte-clean.
2. **The ADOPTION.** Make `crabBallotSteps` always return the fallback (ignore
   the document) → *a tampered dial …* goes **RED**: `a distinct document ladder
   did not reach the reader - adoption is a no-op, the dial reads the literal
   path`. Reverted byte-clean.

Demo 2 also caught a VACUOUS check in the first draft of scenario 1 (discipline 3:
a mutation that did not bite is a finding). The draft compared the doc's steps to
`WAGE_FLOOR.steps` — byte-equal whether or not adoption fired, the exact E3
return-value trap. Fixed by making the adoption proof return a DISTINCT ladder;
the mutation bites now.

## Out of scope, by design (slice boundaries)

- **Purses, calendar, relief** (kd-B7t0qNCrZr, kd-73P2u9lEI4) and **eligibility**
  (kd-8JHuxqynmF, blocks E7) are the remaining slice-4 children.
- **Stranger-people ballots are inert this slice.** They are validated at the
  door but do not drive a stranger's town — a stranger people does not found the
  town, the crab does. The door is tested hostile; the drive is the crab's own.
- The `name/short/unit/who` labels ride the document but are unread — they fold
  into "the full crab document" at E7 with no new read site here.

# PHASE E4 SLICE 4 — DESIGN: the remaining civics families

Bead kd-q5SOraybkW (children 4a-4d). Slice 3 (kd-j5RzOniDkt) made `civics.stakes`
an authorable, per-voter, L1-dispatched section. This slice transcribes the four
families the plan (§2) still leaves as engine constants: ballots, purses,
calendar, relief — plus eligibility (family 2).

## THE ARCHITECTURE DECISION (the load-bearing one)

`stakes` (slice 3) is PER-VOTER: platValue dispatches on `c.p.culture` because
a resident of a stranger people scores platforms on THEIR stakes. That is why
it uses the visQuote/departR dispatch idiom.

The four table families are NOT per-voter — they are TOWN-LEVEL facts:

- **ballots** (WAGE_FLOOR, HEAD_CAP): one town has one wage floor and one house
  limit; every voter reads the same ladder. `floorOf`/`capOf` read
  `hall.policy`, not a crab.
- **purses** (levy/dues/rents/tin): one town, four purses; `purseRate`/
  `purseYield` read a platform, not a culture.
- **calendar** (pollWeekday/open/shut): one town, one polling clock.
- **relief** (soup/shelter): one town, one shelter, one soup pot.

So these follow the **E6 in-place adoption pattern** (crab-as-document: names,
colorways), NOT the slice-3 per-voter dispatch:

  - The crab's OWN bundled document (BUNDLED_CRAB_CIVICS) supplies them.
  - Adoption is IN PLACE: a top-level const reads the doc at boot (validated,
    else null), and the engine constant becomes the FALLBACK BY IDENTITY.
    Exactly `CRAB_ART_DOC` / `CRAB_COLORS.length = 0; push(...)` at game.js:5437.
  - Every existing read site (floorOf, capOf, purseRate, allPlatforms,
    pollWeekday, bowlCost, shelterRent...) is UNTOUCHED — it draws from the same
    arrays/values in the same order. Byte-equal by construction when the doc
    matches the literals; a drifted byte names the entry via a tabled==literal
    scenario.
  - A stranger's document may ALSO declare these (schema already allows the
    civics object to grow), validated at import by cultureProblem — but the
    town-level ones apply only to the crab's own bundle this slice (a stranger
    people does not found the town; the crab does). Ship the crab transcription;
    the door for strangers is the schema + validator, tested hostile.

This is the same split E6 made: names/colorways are the crab's own (in-place),
while traits/depart/civics-stakes are per-culture-dispatched. Getting this wrong
— trying to per-voter-dispatch a town-level fact — is the boundary error the
bead warns is "worse than not doing the slice".

## FAMILY-BY-FAMILY

### 4a — ballots (WAGE_FLOOR, HEAD_CAP)  [kd-1UCGSDLRah]
Doc: `civics.ballots: [{ id, name, short, unit, who, steps[] }]`.
- ids: "floor", "cap" (engine owns the id space — both required).
- steps[] feed floorOf/capOf; FLOOR_STEPS/CAP_STEPS derive from steps.length-1
  (stays engine). step0 = founding (NO FLOOR / NO LIMIT) — PRESERVE index+meaning.
- name/short/unit/who: display strings through fitSmall/smallText (measured-
  trimmed, pure data). Adopt in place; the WAGE_FLOOR/HEAD_CAP object literals
  become the fallback.
- SAVE-COMPAT scenario OWED (ruling 4): old save cap:0/wage:0 loads identically;
  cap:99 clamps to the top rung (CAP_STEPS).
- Gate: election sweep byte-equal + fingerprints; mutation: bend a step -> red.

### 4b — purses (levy/dues/rents/tin)  [kd-B7t0qNCrZr]
Doc: `civics.purses: [{ id, name, short, unit, who, steps[] }]`.
- ids: the four PURSE_KEYS (engine owns the id space; all four required — they
  drive allPlatforms and the levy conflict-of-interest).
- steps[] feed purseRate; the mech name/short/unit/who are display data.
- STAYS ENGINE: purseYield/platTake conservation (a levy that mints is
  inexpressible), the LEVY mechanism, purseOf's "rents" fallback, TIN_KEEP.
- Gate: election sweep byte-equal + fingerprints; mutation: bend a rate -> red.

### 4c — calendar + relief  [kd-73P2u9lEI4]
Doc: `civics.calendar: { pollWeekday, pollOpen, pollShut }` (ints; minutes),
     `civics.relief: { soup: { potMax, margin }, shelter: { rent, float, strikes, shutNights } }`.
- Read by pollWeekday/pollOpen/POLL_SHUT; bowlCost/potWant/shelterRent + the
  strike/shut machinery in runTownHall.
- THE TRAP (discipline 5): these sit on STATE/TIME paths — a pot is spent, rent
  charged, a door bolted/reopened. Value-equality is NOT behaviour-equality.
  Gate on the WHOLE-TOWN run (rent charged, pot bought+thrown, door bolted after
  strikes, reopened after shutNights, polls open/shut on the calendar day), not
  only a returned number. POT_MAX also bounds PLAT_BUNDLE pBowls and shelterRent
  feeds the roof term, so the election sweep is in scope too.
- STAYS ENGINE: conservation (fundTake/Pay/Remit), shelterRent's dormExtra
  addend, the strike-counter mechanism itself, POLL_PLACES/POLL_BW/VOTE_SECS/
  BALLOT_* logistics/COUNT_MINS.
- Gate: whole-town run byte-equal + fingerprints; mutation per constant -> a
  named red on the RIGHT path.

### 4d — eligibility (family 2)  [kd-8JHuxqynmF]  — LAST, blocks E7
Doc: `civics.eligibility: { vote: prog, stand: prog }` — L1 PREDICATE programs
(0/1) over a PERSONA read bundle. This IS per-voter (a crab's own attributes),
so it dispatches like stakes.
- The engine predicates, verified before transcribing:
  - stand(c) = c.p.npc (buildBallot self-nomination, game.js:1715)
  - vote(c)  = resident crab (castVote; visitors gated by !k.isCrab elsewhere)
- RISK: currently inlined. Extract byte-equal canVote/canStand first, THEN
  dispatch on culture with the crab program as fallback-by-value. If extraction
  is not byte-equal, STOP.
- Persona read bundle: { npc:0..1 } at minimum (isCrab is a customer-entity
  concept, not a persona field — confirm the boundary before widening).
- Gate: staged election byte-equal who-votes/who-stands/ballot/tally +
  fingerprints; mutation: bend the predicate -> a named red.

## GATE MECHANICS (all families)
- In-pod: `node tools/suite.mjs` green both realms (vm + main), and wasm where
  the scenario is cross-engine. I am a cs fleet pod (no operator Mac hook) — I
  gate IN-POD, not via tools/kube.mjs (no AWS identity). Receipts to
  design/cs35-research/kube-runs/ or numeric-wip/.
- Matrix re-run measured against the tree I land on (not PLAN's number).
- Merge ritual every commit: mkcultureways.mjs (byte-exact) + mkversion.mjs.

# PHASE E4 SLICE 4c CLOSE-OUT: the calendar and the relief become authorable scalars

**Slice**: phase E rung E4, slice 4c (bead kd-73P2u9lEI4; parent kd-q5SOraybkW;
plan cs35-phase-e-plan.md §2). Slices 4a/4b made the ballot dials and purses
authorable (step-ladders). This slice transcribes the two **scalar** families:
the polling **calendar** (POLL_WEEKDAY/OPEN/SHUT) and the shelter/soup **relief**
(SHELTER_RENT/FLOAT/STRIKES/SHUT_NIGHTS, SOUP_MARGIN, POT_MAX).

## The architecture — in-place adoption again, for scalars this time

Same E6 crab-as-document / in-place adoption as 4a/4b, but the values are
scalars, not step-ladders. `crabCivicsInt(path, fallback)` reads a dotted path
(e.g. `relief.shelter.rent`) off `BUNDLED_CRAB_CIVICS`, validated as a
non-negative integer, else the const literal (named). The nine engine consts
take their value from the document at boot; the literals stay as the fallback;
every reader draws the same scalar. Byte-equal by construction — the frozen
fingerprints did not move.

- `calendar: { pollWeekday, pollOpen, pollShut }` — weekday INDEX (0..6, 6=Sun,
  the town's own week) and minutes past midnight (420/1140).
- `relief: { soup: { potMax, margin }, shelter: { rent, float, strikes,
  shutNights } }` — bowls-a-night ceiling and cents-margin; nightly rent,
  nights-carried, missed-nights-to-bolt, nights-bolted.

**POT_MAX is called out in the fixture and the const comment**: it is ALSO the
stakes lcm denominator (`345000 = D/(20*potMax)`), so transcribing it byte-equal
(=6) is what keeps the slice-3 stakes exact. A different potMax would silently
desync the platform valuation — which the stakes grid sweep would catch, but the
byte-equal transcription means it never arises.

## The trap this family carries (discipline 5), and how the gate answers it

These scalars sit on STATE and TIME paths — a pot is SPENT, the shelter CHARGES
rent and BOLTS after strikes running and REOPENS after shutNights, the polls
OPEN and SHUT on the calendar day. **Value-equality is not behaviour-equality**
(the E3 lesson). So the gate is TWO non-redundant scenarios, proven independent
by the two mutation demos below:

1. *the scalars are byte-equal to the engine constants* — the tabled==const pin,
   AND proves ADOPTION (each const == the DOCUMENT value, not the literal by luck).
2. *the scalars DRIVE the town, not just a readout (the behaviour gate)* — runs
   `runTownHall` by hand on a starved fund and watches the strike counter climb
   1,2,…,STRIKES-1 and the door bolt on exactly the SHELTER_STRIKES-th miss,
   latched to SHELTER_SHUT_NIGHTS; clamps a 100-bowl ask to POT_MAX via potWant;
   probes pollWeekday/the poll window against the transcribed calendar.
3. *a stranger's malformed calendar or relief is refused by name* — the
   no-silent-drop contract (slice 3) extended to the scalar families now the
   schema admits them: a weekday past the week, a poll window that shuts before
   it opens, a negative rent, a fractional strikes — each refused BY NAME,
   inert-but-validated (the town's clock and shelter belong to the crab who
   founds it).

## Gates

- **Three new suite scenarios** (`civics calendar/relief:`), green both realms
  (vm+main) and both backends (JS + wasm kernel).
- **MCP test-server 56/56** (+2: the localiser names a calendar weekday past the
  week and a negative shelter rent). Schema + docs.mjs teach `civics.calendar`
  and `civics.relief` beside the ladders.
- **Byte-neutrality**: the frozen fingerprints are UNTOUCHED. `mkcultureways`
  regen byte-exact. `mkversion` stamps the merge commit.
- **Full in-pod suite green** (receipt below).

## Mutation demos — TWO, and each bites a DIFFERENT scenario, which is the point

1. **The VALUE.** Drift `relief.shelter.strikes` 3→2 in the fixture → *the
   scalars are byte-equal …* goes **RED**: `the strikes scalar drifted: 2`. The
   BEHAVIOUR gate PASSES under this (it reads SHELTER_STRIKES as its own oracle),
   which is correct — the value pin owns transcription fidelity.
2. **The WIRING.** Hardcode the bolt threshold to `>= 2` in `runTownHall` while
   the const stays 3 → *the scalars DRIVE the town …* goes **RED**: `the door
   bolted on miss 2, not the transcribed SHELTER_STRIKES 3`. The VALUE pin is
   BLIND to this (the const is unchanged), which is exactly why the behaviour
   gate exists — it catches the decoupling the pin cannot see. This IS the
   discipline-5 trap, demonstrated: equality-of-value ≠ equality-of-behaviour.

Both reverted byte-clean.

## Out of scope, by design

- **Eligibility** (family 2, vote/stand predicates; kd-8JHuxqynmF) is the last
  slice-4 child and carries the blocks-edge to E7.
- Stranger-people calendar/relief are validated at the door but inert (the crab
  founds the town). POLL_PLACES geometry, VOTE_SECS, ballot logistics, the
  conservation math, and the strike-counter mechanism itself stay engine.

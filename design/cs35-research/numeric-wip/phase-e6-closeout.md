# PHASE E6 CLOSE-OUT — the crab as a document (names, shells, the diary tripwire)

The dogfood gap (substrate §4 debt 1, E-plan §3) closes for IDENTITY: the
crab's name pools and shell colorways leave crabs.js/sprites.js literals and
ride the bundled crab document beside its voice and brain. Traits are the
E2 sibling's; depart bodies are E3's; civics is E4's.

## The identity inventory

**Moved to the document** (tools/fixtures/crab-people.json, crab-art.json →
BUNDLED_CRAB_PEOPLE / BUNDLED_CRAB_ART in the generated cultureways.js):

- `CRAB_NAMES` (12 crew names, crabs.js:3) → `people crew` pool.
- `CUSTOMER_NAMES` (26 walk-in names, crabs.js:108) → `walkins` pool.
- freeCrewName's terminal `"CRAB"` literal → `fallback` (crabNameFallback()).
- `CRAB_COLORS` (6 base palettes sprites.js:89 + SUDSY's pushed teal
  sprites.js:820) → seven NAMED colorways (red/blue/green/purple/orange/
  pink/teal). Order is load-bearing forever: `k.color` in every save indexes
  this list, so the bundle keeps today's order and new colorways append.
- **SUDSY's pin becomes a name**: `founders.sudsy = "teal"` resolved at boot
  by crabFounderColor("sudsy") — no longer "whatever is last". Fallback (no
  bundle): the old length-1 convention.
- The voice close-out's **refuseHire debt is RETIRED**: the two literals
  behind one key split into `refuseHire` (the pop, "KIND OFFER. NO.") and
  `refuseHireLog` (the diary line, "TURNED DOWN A JOB"), both tabled in
  crab-voice.json; voiceProblem clamps both; the refusal site consults
  `visRegister(k) || crabRegister(k.acc)` so a cultured register keeps its
  own line for both moments exactly as before.

**The adoption mechanism**: IN PLACE (CRAB_COLORS.length = 0 + push, same
for the name pools), before the game.js art derivations — so every existing
read site (freeCrewName, the walk-in naming draw at its exact srand() call,
makeCrabPersona's modulo, the CRAB_ARTS/HOUSES/BOATS/BUGGIES derivations,
the k.color clamps) is UNTOUCHED and draws from the same arrays in the same
order. Byte-equal by construction when the bundle matches the literals; the
tabled==literal scenario carries the pinned literal copies so one drifted
byte names the entry.

**Stays engine, with reasons**:
- The house/boat/buggy per-colorway DERIVATION (game.js) — a colorway begets
  a house; the palette is the data (E-plan §3, verbatim).
- The crab body/pose pixel art (_CRAB_TOP etc.) — engine art primitives; the
  E-plan scopes "look" to colorways.
- The name-draw SITES and their srand() calls — selection is engine physics;
  the pools are the data.
- Diary code literals — the engine fallback for a hand-tampered bundle, now
  behind the dogfood tripwire (below).

## The dogfood tripwire

vline's crab path increments `window._crabDiaryFb` whenever a crab diary
line falls to the code literal. Scenario: two days of seed-41 traffic with
the table armed must leave it at 0, and the same scenario disarms CRABV for
one line to prove the counter BITES (a tripwire that cannot fire is dead
data, substrate §5.2).

## Validation

- **Build time** (mkcultureways.mjs): pools non-empty, names ≤16 chars,
  duplicates refused, colorways {id, hi[3], lo[3]} with 0-255 ints, founder
  references resolvable — a bad fixture fails the BUILD, never the town.
- **Runtime belt** (game.js): crabArtProblem / crabPeopleProblem with named
  refusals — "NO CRAB COLORWAYS", "A BAD CRAB COLORWAY", "A FOUNDER WITH NO
  SHELL", "NO CRAB NAMES", "A NAME NO CARD CAN HOLD" — a tampered bundle
  falls back to the literals rather than wounding the town.

## Scenarios (4 new, all under "crab-as-document:")

1. tabled==literal for every moved value (pinned literal copies; also pins
   the 7-length derivations, the teal founder index 6, both refuseHire keys).
2. SUDSY keeps her teal shell + freeCrewName walks document order (computed
   from the same used-set the function reads — mechanism, not coincidence) +
   the old-save k.color clamps (c=6 loads 6; c=99 clamps to 6).
3. The diary tripwire: 0 fallback hits in two live days, and the counter
   provably bites.
4. Hostile rows: each named refusal above, a good document accepted, an
   overlong refuseHireLog refused as "A BAD VOICE LINE".

## Gates — QUEUED (AWS session expired at build time)

The batched sequence, in order, once the operator renews the session:
1. `helm list`-first cleanup of any stale releases (double-spend lesson).
2. Green check: kube run of experiments/e6-focus.json (2 arms, both
   backends; manifest carries the ephemeral-pool schedulability block).
3. Mutation demo 1: drift one palette byte in crab-art.json + regen →
   scenario 1 red naming the shell; revert + regen.
4. Mutation demo 2: freeCrewName misreads (walkins-only concat) → scenario
   2 red naming the order; revert.
5. Rebase check against cs35repo/cs35 (E1+E2 and the economy trio may land),
   regen-exact check, then the full suite + phased-gates (MCP) on the final
   SHA. Bundle regen is part of the gate: mkcultureways output committed and
   byte-exact.

## Seams left named

- `people`/`art` for OTHER cultures already exist in the schema; the crab's
  versions ride the bundle because the crab has no document file — when E7
  assembles "the full crab document", these sections fold into it.
- Small-portrait hat fit for cultured hats (the UX close-out's named debt)
  is unchanged by this slice.

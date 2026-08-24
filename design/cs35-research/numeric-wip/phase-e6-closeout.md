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

## Gates — DONE (2026-08-24, the session renewed and the queue drained)

1. **Stale-release cleanup** — done; `cs-e6-focus-8d4bd72-j87y` was the only
   remnant, and see the warning below about what its Job status meant.
2. **Green check** — `e6-focus` **4/4 both backends** (8/8 arms).
3. **Mutation demo 1 — BIT.** One palette byte drifted in crab-art.json;
   scenario 1 red naming the shell. Receipts
   `kube-runs/cs-e6-focus-4c51972-4bot`. Reverted.
4. **Mutation demo 2 — BIT.** `freeCrewName` walks the wrong pool; scenario 2
   red naming the order exactly: `the next hire is GARY, pool order says
   SHELLDON`. Receipts `kube-runs/cs-e6-focus-8d4bd72-j87y`. Reverted.

   **A WARNING FOR WHOEVER READS THE JOB LIST NEXT.** That demo's Job shows
   `Failed 0/2` and sat in the namespace for three hours looking like a broken
   gate. It was not: a mutation demo EXPECTS red arms, so its Job status is
   *supposed* to be Failed. The orchestrator misread it as an unexplained
   failure and flagged E6 as blocked on a diagnosis it did not need. The
   manifest note says it plainly and it is worth repeating here: **read the
   receipts, not the Job status.**
5. **Rebase onto the E1+E2 tip (`697f3d8`) — clean, three conflicts, all
   ADDITIVE UNIONS**, which is the migration behaving as designed: two
   independent slices of hardcoded content moving into the document without
   contending for the same ground.
   * `tools/mkcultureways.mjs` — E1/E2 loads quips+traits, E6 loads
     people+art. Both kept; the generator now emits four `BUNDLED_CRAB_*`
     tables where mainline emitted two, and the window tail exports all four.
   * `cultureways.js` — generated, so resolved BY REGENERATION, never by
     hand. 99734 bytes carrying quips, traits, 12+26 names and 7 colorways.
   * `mcp/docs.mjs` — two paragraphs of authoring docs, each describing a
     different half of the same section. Both kept.
6. **Full battery on the combined tree** (`9b95c08`):
   * `e6-focus`: **8/8**, both backends — E1/E2 and E6 coexist.
   * `suite-318`: **674/674 across 20 arms**, zero red. Receipts
     `kube-runs/cs-suite-318-9b95c08-cmg8`. (Eight more than E1+E2's 666:
     E6's four scenarios on each engine.)
   * Bundle regen byte-exact on the rebased tree.

### An operational note earned the hard way

Three concurrent `kube.mjs` runs wedged the cluster path: a job that never
installed, `helm list --all` erroring blank, and a run sitting thirteen
minutes with nothing to show. Not credentials (`sts get-caller-identity`
clean) and not the cluster (three nodes Ready) — contention. Killing the
competing processes cleared it immediately.

The likely root cause is upstream of that: a cluster run was started with a
long foreground timeout and the tool's hard **ten-minute ceiling killed it
mid-install**, leaving the mess the next runs tripped over. **Cluster runs go
in the background, always** — a long timeout is not a substitute, because the
ceiling wins.

## Seams left named

- `people`/`art` for OTHER cultures already exist in the schema; the crab's
  versions ride the bundle because the crab has no document file — when E7
  assembles "the full crab document", these sections fold into it.
- Small-portrait hat fit for cultured hats (the UX close-out's named debt)
  is unchanged by this slice.

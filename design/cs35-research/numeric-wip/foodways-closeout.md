# FOODWAYS, first slice — the pork bun (cultureway phase B, close-out)

**Landed 2026-08-22 on `pig-foodways`.** The owner's hook, answered: pigs
reached 16/16 towns and left hungry and unspent; now a town can learn
their dish and their money enters its economy.

## What a foodway is, mechanically

A culture document's `foodways` section declares DISHES — rows in the
BIZ recipe shape (`{id, biz, icon, pay, learn, raw, steps}`) — plus an
`items` table carrying display names and 9-wide pixel art for anything a
cook or guest holds. The pigway ships one dish: the PORK BUN, a shack
dish, corn in, $16 on the board, a $25 lesson.

The seam is `bizRecipes(b)`: every consumer of a kitchen's menu — the
visitor scorer, the KERNEL MARSHAL AND DRAIN, staff meals, crab
walk-ins, the neuro observables, the manage card — reads through it
(13 sites). It returns the BIZ table's own array identity when nothing
is learned, which is what makes the fingerprint gate's cleanest shape
achievable: **a town where nobody learns is byte-identical to one where
foodways never existed** — proven by a 16-seed × 30-day matrix diff
against the base tip, byte-identical, and by the frozen-fingerprint
pins passing untouched. No re-baseline was owed; there is no first
crossing to name.

## Earned, paid, and conserved

- **The demand is TAUGHT**: a cultured guest departing with a foreign
  settle, from a culture that brought recipes, sets `dishWord` — from
  then on the manage card (HOURS tab) offers the lesson, arm-then-
  confirm, the BUY chips' own idiom. No pig, no offer. Verified on the
  real browser tap path: MANAGE → LEARN → SURE? → the board goes 3→4
  and the fee leaves the till on screen.
- **The lesson costs the till** (`learn` × 100 cents through
  `expense`), and a poor till is refused in character.
- **Nothing conjured**: corn joined `INGREDIENT_COST` (author $3,
  matching the T1 import table's 300¢) and `consumeIngredient` prices
  every ear as an import, exactly the fish-the-pier-didn't-land shape.
  The kitchen's own waitCash gate guards the new row.
- **Delight answers the foreign grumble**: counted at the pick in
  `visGo` (the one door script, kernel drain and brain all walk), ONLY
  for the guest's own cuisine found abroad — a pig loves a soak at 2.0
  and the card must not call that finding her dish (the first cut did;
  the measurement caught it: 129 phantom delights in the stock arm,
  0 after the scope fix). Spoken per register on the departure card
  ("A PROPER BUN AT LAST." / "THE BUN WAS CORRECT. THE REPORT WILL
  SAY SO."), joined both departure meta-sweeps.

## Town state, save shape

`learnedDishes` and `dishWord` are town state: saved (`ld`/`dw`,
additive, SAVE_VER unchanged), restored on load with clamps, registered
in `resetSession()` per the loader contract, and proven to survive a
round-trip while a fresh boot starts unlettered.

## The measurement (8 towns × 20 days, learned-at-boot vs stock)

| | stock | learned |
|---|---|---|
| distinct pigs ashore | 73 | 109 (+49%) |
| pig spend at departure | $2,132 | $4,186 |
| delight settles | 0 | 94 |
| foreign settles | 19 | 15 |
| per-pig spend share | 0.364 | 0.349 |

The bun multiplies WHO COMES, not how much each eats — per-guest
appetite is need-bound; taste only steers the plate. `tools/measure-buns.mjs`
reproduces the table.

## NPC adoption: deferred with a reason

NPCs do not learn dishes this slice — the only kitchen the pigway
targets is the player-owned shack, so the symmetry ruling has nothing
to bite on yet. When a dish targets an NPC-ownable kitchen, the owner
AI should get the same taught-then-paid act. Recorded, not smuggled.

## Bugs found by the landing's own instruments

1. **Delight over-counted base tastes** — caught by the measurement arm
   (129 phantom delights), not the suite. Scoped to own-cuisine.
2. **The cook carried an invisible cob** — a dish whose RAW has no art
   crashed the draw at the first cooked bun; headless never draws, so
   only the photo shoot saw it. Corn got engine art, and the validator
   now demands a picture for any raw a culture brings.
3. **The staged-save browser dance** (procedural, recorded for the next
   fork): `visibilitychange` saves whenever a game tab goes HIDDEN, so
   a second open tab clobbers external localStorage staging on every
   tab switch — the phantom the neuro fork suspected. Boot AUTO-LOADS
   the active slot, so real players are safe (unload re-saves their own
   town). To stage: use `?fresh` (saves disabled) to write the slot,
   close every other game tab, then navigate to a normal URL. Also:
   check `gameOver` before staging a fixture town — a dead town's sim
   is halted and nothing you poke will think.

## Scenarios (4 new, plus 2 sweep entries), mutations all biting

The seam (severed → "the board never changed"), the appeal (fixture
taste 2.0→0.6 → "her table rates the bun 0.6"), the ledger (corn
conjured → "no corn crossed the pier"), the earned gate (dishWord
ignored → "offers before taught"), the validator (station check removed
→ "waved through"), and the fee/save round-trip. The delight rule joined
the departures reachability and drop-the-fact sweeps.

## Gate

Suite 293/293 exit 0 armed-main and unarmed-main (run after the final
code change); mcp harness 38/38; matrix byte-identical to base
(receipts in the landing commits); conservation exact via the suite's
soak; browser: zero console errors, the full learn flow on the real
tap path, kernel armed. Devlog shots banked:
`2026-08-22-learn-the-bun.png` (the lesson offered, armed) and
`2026-08-22-first-porkbun.png` — which caught SCAMPI, a CRAB, ordering
a PORK BUN beside CLOVER the pig and a gull: cross-cultural foodways
going both directions, unprompted, on day one of the dish.

# SLOP — the pigway's dish stops being cannibalism

**The ruling (Matt, 2026-08-23, verbatim):** "no more 'pork buns' -- we gotta
have 'slop' which can be made from any two ingredients (fruit and fish in this
case). pork buns.. weird. not cannibal pigs."

## What changed

- **The dish**: `porkbun` (corn, $3/ear imported) → `slop` (`raw: fish_raw` +
  `raw2: fruit`, both NATIVE pantry ids — nothing conjured, nothing imported).
  Same `pay: 16`, same `learn: 25`, same shack stations (board → SLOP MIX,
  grill → SLOP): only the dish changed, the taught-demand/lesson-fee/delight
  machinery is untouched.
- **The cost law is the COOLER's**: the charged `raw` is the fish, priced at
  the pier's own LIVE price (slop pulls the fish market's demand signal and
  the town's catch like every native plate — dearer than the bun's fixed $3
  corn, and honestly so); the `raw2` fruit is counted at the pier like the
  cooler's water (one line added in `consumeIngredient`, mirroring the water
  line exactly). No existing recipe's economics moved.
- **Corn leaves the BUNDLE**: the bun was bundled corn's only consumer, and a
  table entry no scenario can observe is dead data (substrate §5.2). THE
  WALLOW keeps its corn in `design/cultureways/pigway.json` — that document is
  the design exemplar, not the shipped bundle.
- **raw2 joins the pantry law**: `recipeRowProblem` previously ignored `raw2`
  entirely (inert then; my `consumeIngredient` line makes it act, so the
  hostile-file posture demands the check). A `raw2` must now be a boat-carried
  ingredient ("WANTS A SECOND INGREDIENT NO BOAT CARRIES"), with the cooler's
  `water` as the named engine exception. New hostile row proves it.
- **Voice**: farmhand delight "PROPER SLOP AT LAST. I'D SAIL BACK FOR
  ANOTHER."; farmhand foreign "NOT A DROP OF SLOP IN TOWN. I ATE PLAIN FISH,
  I SUPPOSE."; clerk delight "THE SLOP WAS CORRECT. THE REPORT WILL SAY SO."
  Same souls, new dish. The DEVLOG's bun entries stay as HISTORY — the
  retirement wants its own future devlog entry (noted for the devlog owner:
  the town un-learns nothing; the pigs simply asked for something less weird).
- **Taste row**: `appeal.tastes.porkbun: 2.0` → `slop: 2.0` (the weight is the
  fixture's own, unchanged).
- **Instruments**: the two devlog-era shooters repointed at slop; the staged
  screenshot is now a CLUSTER ARM (`tools/shoot-slop-arm.mjs` +
  `experiments/slop-shot.json`) that hands the PNG home as base64 in the
  receipt's jsonTail — the kube policy's first picture.

## The first crossing

Default towns never learn a dish (the autopilot takes no lessons), so the
matrix contract is BYTE-IDENTITY branch-vs-base — same as the foodways
landing ("a town where nobody learns is the old town, by design"). The named
crossing lives in STAGED towns only: the first divergent draw after
`learnedDishes.push("slop")` is the first shack plate pick that finds the new
candidate — the scenario stages it, per the settlers precedent.

- Matrix byte-identity (triple-16, branch ba7ec5f vs base 071143d): **HOLDS**
  across all six blocks (baseline + growth × sb 0/16/32), receipts compared
  key-by-key with only the wall-clock `throughput` field excluded (banked in
  kube-runs/cs-matrix-triple16-{ba7ec5f-hkna,071143d-hokp}). One honest
  method note: the first naive whole-JSON diff flagged all six blocks
  DIVERGED — the divergence was entirely `throughput.wallSec`/`loadavg`,
  machine noise. Byte-identity claims must name what they exclude.

## The economics, reported not tuned

The bun's measured effect (its close-out, 8 towns × 20 days, stock vs
learned): distinct pigs 73→109 (+49%), pig spend $2,132→$4,186, per-pig spend
share FLAT at ~0.36. Slop's equivalents, same instrument (`measure` arms):

Measured (receipts in kube-runs/cs-slop-gates-ba7ec5f-gc1w/measure-*.json),
stock vs learned on the CURRENT tree — not comparable to the bun's era
numbers (the tree gained citizen minds, settlers, personal space and the
rest since; lesson 8, never quote across instruments/eras):

| | stock | learned | delta |
|---|---|---|---|
| distinct pigs | 69 | **149** | +116% |
| pig spend | 1,601 | **3,612** | ×2.26 |
| spend share | 0.297 | 0.305 | FLAT |
| delights | 0 | 96 | the dish working |
| foreign settles | 15 | 13 | down |

The bun's story, stronger: **slop multiplies who comes, not how much each
eats** (share flat at ~0.30). The supply-side note stands as designed: slop's
fish is charged at the pier's LIVE price vs the bun's fixed $3 corn — the
shack's margin floats with the fish market now, which is more honest, not
worse. Nothing tuned.

## Gates

- slop-gates (focus scenarios both backends + voice pins + the economics
  instrument): PENDING
- Matrix byte-identity branch-vs-base: PENDING
- Mutation demos (armed, expected red, reverted): PENDING
- Full suite both backends + MCP battery at the final SHA: PENDING
- Screenshot: PENDING (cluster arm)

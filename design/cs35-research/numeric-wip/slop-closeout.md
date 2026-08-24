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

- slop-gates (focus both backends + voice pins + economics): **11/11 green**
  at ba7ec5f (receipts: kube-runs/cs-slop-gates-ba7ec5f-gc1w).
- Matrix byte-identity branch-vs-base: **HOLDS**, all six blocks (see above).
- Mutation demo: **BIT on both backends** — the artless slop (e55014c,
  reverted) turned the foodways family red on js AND wasm, and the voice
  chain scenario red with it (a refused document moves everything downstream
  of the install — the refusal design working). Receipts:
  kube-runs/cs-slop-gates-e55014c-ud7a. The named-refusal assertion (the
  hostile PICTURE row, plus the new raw2 "SECOND INGREDIENT" row) passed in
  the green run.
- Screenshot: **banked** — devlog/img/2026-08-23-first-slop.png, shot
  POD-SIDE and carried home as base64 in the receipt's jsonTail (SNOUT, day
  9, delight 1; REP 93 on the HUD). The kube policy's first picture.
- Full suite at d9580c1: **654/654, 20/20 arms, both backends**, every
  receipt exitCode 0 (kube-runs/cs-suite-318-d9580c1-48p7). MCP battery at
  a6a2423 (chart+docs delta only): **exit 0, zero failures**
  (kube-runs/cs-phased-gates-a6a2423-71q0). Scale-down verified after each.

### The 4 red arms the first full run found — and why they were RIGHT to be red

The suite's first pass at 826ebd4 came back 16/20 with two scenarios failing
identically on BOTH backends. Neither was a flake; both were tests anchored
on a COINCIDENCE (that the bundled pig happens to price corn) rather than a
MECHANISM — the project's oldest lesson, biting the tests themselves the
moment corn left the bundle:

1. **"a stolen ingredient" (the culture-refusal family)** asserted that a doc
   claiming `meta.id = "boar"` is refused for declaring PIG's corn. With the
   bundle no longer owning corn, the theft had no victim and the refusal
   never fired. Fixed at the mechanism: the scenario now STAGES a corn-owning
   `boar` document into the save, and a `hog` clone declaring the same corn is
   the thief — plus a guard asserting the staged owner installed, so the case
   can never go vacuous again.
2. **"the biz catalog: ... change no town byte"** asserted `corn` priced 300
   owned by "pig". The slop era's truth is that corn is UNOWNED — no price, no
   owner, still not native (a future culture may claim it). Re-pointed; the
   priced-import MECHANISM stays fully proven by the scenario's own staged
   `mud` import, which was always the real subject.

### A chart bug found on the way (worth upstreaming)

Mainline's new per-index backoff sets `maxFailedIndexes: 5` unconditionally;
Kubernetes refuses any Job where that exceeds `completions`, so EVERY
manifest with fewer than 5 arms (the MCP battery has 1, most focus manifests
have 3–4) failed to install with `spec.maxFailedIndexes: Invalid value: 5`.
Clamped in the chart template to `min(maxFailedIndexes, arms)`, verified by
`helm template` at arms=1 → 1 and arms=20 → 5. (The coordinator notes
mainline landed an equivalent at 2479cb2 — expect a trivial dedupe at merge.)

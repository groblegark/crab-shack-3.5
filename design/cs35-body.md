# CS3.5 — THE CULTURAL BODY (`body` section design)

Census item C2: per-culture need decay rates and want thresholds, plus the
written-down boundary against D1 (the need SET stays engine). Design +
research only — nothing here is built. Surveyed at tip d9fbd54.

## 1. THE RATE INVENTORY (what "the body" actually is in code)

**Visitor side (kernel-mirrored):**

| constant | file:line | kind | value | kernel face |
|---|---|---|---|---|
| VIS_RATE.{hunger,thirst,dirt,bored,tired} | game.js:11502 | per-tick Q20 decay | 402/192/315/157/168 | **`#define RATE_*` kernel.c:128–132** — compile-time, applied in vis_step's RT[5] loop (kernel.c:341–346) |
| on-sand dirt ×1.5 | game.js:12425 / kernel.c:336 | state multiplier | exactly 3/2 | inline both sides, same arithmetic |
| VIS_WANT.{food,drink,clean,fun} | game.js:11503 | want thresholds Q20 | qn(.45/.40/.45/.45) | **inline literals** kernel.c:582–598 (471859, 419430, …) |
| VIS_RANK | game.js:11510 | errand priority (f64 scoring) | 4/3/2.4/1.5 | mirrored in vis_pick's f64 dance |
| VIS_BED_DRAIN, TIRED_DRAIN.bed path | game.js:11511 / kernel.c:330 | sleep recovery | 0.30 | tiredDrain crosses as an ARGUMENT — already data-shaped |

**Resident side (JS only — crabs/citizens are not in the movement kernel):**

| constant | file:line | kind |
|---|---|---|
| TIRED_SHIFT / TIRED_ERRAND / TIRED_NIGHT | game.js:5383 | event costs + nightly decay, Q20 |
| TIRED_DRAIN {bed, cot} | game.js:5384 | asleep recovery per game hour |
| TIRED_NAP {bed, cot} | game.js:5395 | daylight recovery (probe-measured 0.8× of bed) |
| crab hunger/dirt cycle constants | needsTick region | per-hour decays feeding errandScore |

**The census correction that shapes the design:** cs35-hardcode-census.md
says rates "already cross to the kernel as data-like planes … a
fill-at-install, not a kernel change." That conflates LEVELS with RATES.
The levels (VHUN … VTIR) are planes at fixed offsets (kernel.c:94–98); the
RATES and WANT THRESHOLDS are baked into the wasm binary. Per-culture rates
are therefore a **kernel ABI addition** — a small one, with an established
idiom to copy: MR_TASTE (kernel.c:102–116), a data region JS fills from the
culture document, under the doctrine "the kernel never knows a culture's
name."

## 2. THE `body` SCHEMA

```jsonc
"body": {
  "rates": {                 // per-need decay multipliers, TWENTIETHS (20 = 1x crab)
    "hunger": 26,            // a culture of big eaters
    "thirst": 20, "dirt": 20, "bored": 20,
    "tired": 12              // tireless gulls
  },
  "wants": {                 // want-threshold multipliers, twentieths over VIS_WANT
    "food": 20, "drink": 20, "clean": 20, "fun": 20
  }
}
```

**Multipliers, not absolutes.** Three reasons, in strength order: (1) they
compose with future crab re-balance — retune VIS_RATE once and every
culture shifts proportionally, where absolute tables would silently fork
the balance baseline per culture; (2) twentieths are the established house
author-unit (TRAITS multipliers, mgmt `counter20`); (3) the crab identity
falls out for free: 20/20 converts to EXACTLY the current constants (402·20/20
= 402), so "declares nothing" and "declares all-20s" are byte-identical by
arithmetic, not by special case. The cost — a reader can't see the absolute
rate in the document — is repaid by a `docs` line in mkcultureways output.

**Conversion, once, at install** (buildCulture, the appeal/mgmt pattern):
`rate = round-half-up(VIS_RATE[n] * mul20 / 20)` — round to NEAREST because
the VIS_RATE comment (game.js:11498–11501) makes flooring a named sin: 
flooring all five ran the town's needs 1.19% slow, "a quietly easier game
bought by arithmetic." Thresholds likewise: `want = rhu(VIS_WANT[n] * mul20
/ 20)`, clamped into (0, Q20) after conversion. Partial documents inherit
crab values field by field (nudge precedent). Dispatch via `bodyOf(k)`
reading BOTH culture homes (visitor `k.culture`, resident `c.p.culture` —
the mgmtOf lesson), returning the built table or the engine object BY
IDENTITY.

**Kernel face (the MR_TASTE idiom):** a small kernel-memory table of
per-culture body rows — 9 int32 each (5 rates + 4 thresholds), 8 rows —
plus one per-actor row-index plane filled at spawn/culture-assignment.
Row 0 is the crab constants, written once at arm time. vis_step's RT[5]
reads the actor's row; vis_pick's threshold compares read the same row
instead of literals. ~288 bytes of table + one plane; no per-actor rate
planes needed. The on-sand 3/2 and bed-drain paths are untouched (state
multipliers stay engine physics — they're WHERE you are, not WHO you are).

**Hostile-file rails:**
- Per-field clamp: `mul20` int in **[10, 40]** (0.5×–2.0×), named errors
  ("A BODY THAT NEVER HUNGERS" low, "A BODY BUILT TO STARVE" high).
- Aggregate rail on rates: **Σ(five muls) ≤ 120** (mean ≤ 1.2×), named
  ("A BODY TOO HUNGRY FOR THE PIER"). Direction matters: halving all needs
  makes LOW-value tourists (self-punishing, allowed at the field clamp);
  inflating all needs mints spend from a text file — a visitor who needs
  everything twice as often is ~2× till per guest, which is the actual
  cheat vector. The cap holds documented per-guest spend inflation to
  roughly +20% aggregate while leaving profile shifts (one need up, one
  down) fully open.
- Wants clamp [10, 30]: a threshold at 0 would fire every think (queue
  storm), past Q20 would never fire (a need that can't be served).

## 3. BALANCE ANALYSIS (why the clamps are those numbers)

Decay rates are the demand side of the whole economy. The tree already
carries three measured anchors, quoted from the constants' own receipts:

1. **Profile shifts are large and self-limiting**: running thirst faster
   than hunger cut takings ~30% per guest with no price change
   (game.js:11492–97) — the day fills with $10 juices instead of $17 tacos
   and SEATS saturate. So per-field freedom mostly reshapes WHERE money
   goes and often DOWN, not up; the field clamp can be generous.
2. **Aggregate shifts are nearly linear in spend**: the flooring incident
   (11498–11501) — a 1.19% aggregate slowdown was a named balance event.
   Elasticity of spend w.r.t. aggregate rate is near 1 at small deltas
   (more need-firings → more purchases until seats/purse bind). Hence the
   aggregate cap, not just field clamps.
3. **Purse already rails the ceiling**: spend can't exceed purse
   (purseMul clamp 0.1–5 exists), and seats bind before purse in the
   measured incidents — so the +20% aggregate allowance is bounded twice
   more downstream.

**The sensitivity sweep (spec'd, NOT run — honestly):** the clamp numbers
above deserve cluster confirmation, but varying a rate requires the
machinery slice's install-time conversion to exist — there is no rate
override in any committed entrypoint today, and building one IS slice 1
(this doc's mandate is design-only for game.js). Spec, runnable the day
slice 1 lands, as `experiments/body-sensitivity.json`: fixture cultures
declaring hunger mul20 ∈ {10,15,20,25,30} (others 20) and aggregate arms
{all-12, all-20, all-24}, × growth blocks sb 0/16/32, metrics = per-guest
spend at departure, lifetime, escapes; report d-spend/d-mul per need and
aggregate. Acceptance: if measured aggregate elasticity ≥ ~1.5 (super-
linear), tighten Σ-cap to 110 in the same slice; if ≤ 0.5, the cap can
stay at 120 with a note.

## 4. THE BOUNDARY: WHY THE NEED SET STAYS ENGINE (D1, the informed no)

Adding/removing a need per culture touches, enumerated:
- **Kernel ABI**: five level planes at fixed byte offsets (kernel.c:94–98),
  RT loop arity, vis_pick's candidate/need enum — a sixth need is a new
  plane allocation scheme, not a row in a table.
- **Save shape**: the envelope stores hu/th/di/bo/ti per visitor
  (game.js:7948) — variable need sets mean per-culture save schemas and
  migration for every existing save.
- **The brains**: the observable registry rows `need.*.q20`
  (game.js:7238–41) feed versioned per-brain feature vectors; a new need
  invalidates every shipped artifact's input contract → re-collection and
  re-distillation per culture.
- **UI**: the five-bar visitor card, DIRE/status strings, the inspector's
  BECAUSE section all assume the chassis.
- **Conservation/tripwires**: integer-ness and draw-count pins are per-need
  in places.

That is XL surgery for speculative value — RULED direction (census D1):
rates yes, set no, until a culture design actually demands a sixth need.
What "needs as data" would require, should that day come: dynamic plane
allocation in the kernel arena, a save-envelope version with per-culture
need vectors, observable-registry regeneration + brain re-distillation as
a scheduled ceremony, and UI layout generality. Priced here so the future
yes is a decision, not a discovery.

## 5. CEREMONY LADDER

- **Slice 1 — machinery (byte-neutral, one branch):** schema + clamps +
  cultureProblem named errors; buildCulture conversion (round-half-up at
  the boundary); bodyOf dispatch both culture homes, engine object by
  identity; kernel body-row table + row-index plane, `#define`s become row
  reads with row 0 = the old constants (arithmetic-identical → agreement
  scenario green, no re-pins); resident-side TIRED_*/crab constants behind
  the same dispatch; MCP validator/docs/diff; mechanism scenario
  (conversion, inheritance, both homes, crab identity) + hostile rows +
  mutations that bite both ways. Gate: cluster suite both backends,
  headless 4×10 byte-identity, bundle regen exact. NO culture declares
  anything in this slice.
- **Slice 1.5 — the sweep:** run experiments/body-sensitivity.json on the
  cluster (fixture cultures, committed on the branch); adjust the Σ-cap
  per the acceptance rule; bank receipts.
- **Slice 2 — declaration (content, only when a design wants it):** e.g.
  gulls tired:12 (tireless — they nap on the wing), pigs hunger:26
  (the pork-bun people came hungry). Fingerprint-moving where declared:
  first crossing named, triple-16 matrix vs base, re-pins receipted,
  departure-spend deltas reported. Each culture its own commit.

Out of scope, noted: C10 (sickness/constitution rates) should extend THIS
section (`body.constitution`) rather than grow its own; the rhythm (C1) is
a sibling design with its own doc.

# CS3.5 CULTUREWAY SUBSTRATE — the document, the registry, and the road to CS4

*Design, 2026-08-22. The generality consolidation: turning the numeric/kernel
work and the minimum viable pig into the platform CS4's "build your own
cultureway" authors against. Owner direction: "consolidate our gains
structurally and make things ready for further feature development; remove
technical debt and increase generality where applicable." Sources:
`cs35-cultureway-research.md` (the charter and the five rulings),
`cs35-spec-01-minimum-viable-pig.md` (the shipped Layer-0 pig),
`cs35-kernel-decision.md` §4 + phase-4 addendum (the data-layer ruling and
the FIRST LIVE hook table), and the live engine at `loadCultures` /
`cultureProblem` / `buildCulture` (game.js ~6180–6330).*

## WHERE WE ACTUALLY ARE (stronger than the plan assumed)

> **STATUS 2026-08-22 — PHASE A IS PARTLY LANDED, AND THE PIG SHIPS.** The
> document is no longer fixture-only: `cultureways.js` bundles it, boot
> installs it, and 16/16 baseline towns meet a pig by a median day 7. What
> this section says below about the document being "one validated door" away
> from a player is now historical — the door is open and the pigs walked
> through it. The bundling rule that landed, and which the rest of phase A
> should keep: **bundled documents are the engine's and never enter a save;
> a save's documents overlay them by id; a document that fails its clamps is
> refused with a toast while the bundled one stands in its place.** See
> PLAN.md "THE PIGS SHIP" for the measurements and the two phase-2 findings
> it exposed (pigs leave hungry; their money goes to NPC businesses).

The substrate is not greenfield. Three of its pillars already run:

1. **The document exists.** `tools/fixtures/cultures-pig.json` (465 lines)
   is a complete working cultureway: meta, people, art (palette, colorways,
   body+anchors+poses, accessories, items, bather), voice (two class
   registers), tastes, arrival gate. It loads through one validated door
   (`cultureProblem` — fails with a message, never at first draw), raw keys
   round-trip verbatim even when a culture fails the gate, and absence is
   byte-identical to the pre-cultures engine. That is the hostile-file
   posture, the WAD fall-through, and the fingerprint discipline, shipped.
2. **The kernel boundary exists.** `vis_pick`'s taste row crosses into the
   WASM kernel as `MR_TASTE` — pure data, per-think, the kernel never
   learns a culture's name. §4's Layer-0 hook table is not a design; it is
   bound and byte-identical-gated.
3. **The physics floor is a spec.** After slices 1–6: integer money with
   conservation as a theorem, integer time, integer needs/space, a closed
   RNG stream with a draw-count pin, cross-architecture bit determinism.
   Culture code plugs into a sim whose invariants are enforced by API
   shape, exactly as Ruling 4 of the authorship rules demands.

What does NOT exist: the formal schema (the fixture is de-facto), the other
Layer-0 surfaces (taste is the only live hook table), any Layer-1
machinery, the engine capability APIs (errand registry, hook taxonomy,
policy slots, placement), and — the dogfood gap — **the crab culture cannot
be written in the format**. This doc formalizes the first and sequences the
rest.

## 1. THE CULTUREWAY DOCUMENT, v2 (formalizing what ships, adding what's next)

**Schema rule zero: no renames.** The engine reads `tastes` and `arrival`
where they are today; a rename is a migration script, and migration budget
is spent on semantics, never aesthetics (Factorio's lesson, research §7.5).
v2 is strictly additive:

| section | layer | status | owns |
|---|---|---|---|
| `meta` | 0 | **live** | id, display name, `ver`, and (new) `schema: 2` |
| `people` | 0 | **live** | name pool; (new) settler persona params when pigs settle |
| `art` | 0 | **live** | palette, colorways, body{w,h,slots,anchors,poses}, accessories, items, bather |
| `world` | 0 | **reserved** | PLACE — backdrop layers, terrain, building templates, props, lighting. Reserved now so postcards/vignettes/nodes have a home (research §5); validation accepts and ignores it until the renderer exists |
| `voice` | 0 | **live** | registers (acc-bound class: diary/depart/dossier/foreign/refuseHire + purseMul) |
| `tastes` | 0 | **live** | dishId → weight, clamp [0.5, 2.0] (the Victoria-3 bounds) |
| `arrival` | 0 | **live** | repGate / shareMax / shareRamp |
| `foodways` | 0 | **live** (first slice 2026-08-22: dishes + items + the taught-then-learned gate; menus/drift later) | ingredients, recipes (BIZ-shaped rows), default menus, knowledge gates, exposure-drift params |
| `management` | 0 | **new** | wage/tip/shift/meal-policy norms (the frozen conventions research §4 names) |
| `conduct` | 0→1 | **new** | rule table first (hireable flags, taboo floors, complaint thresholds — the pig's whole conduct set is table-expressible); Layer-1 expressions when a rule needs a formula |
| `maladies` | 0 | **new** | named diseases (CS4 disease program, plan kd-8eaukVv7X0): per-row id/name/blurb, `grade`, transmission params, incubation, course + care-lane modifiers, effects, immunity, endemicity, art kit — the authoring door for culturally-defined disease. Formalized in §1½ below |
| `civics` | 0+1 | **future** | institutions, offices, policy step-tables, calendar phases, errand defs, invariants — lands with the capability APIs (phase E below) |

**Versioning and migration**: `meta.ver` is the CULTURE author's version
(theirs); `meta.schema` is OUR format version. Unknown sections are ignored
(already true — forward-compat by construction); a `schema` bump ships with
an ordered migration function in `loadCultures`, Factorio-style. A partial
culture is SHIPPABLE (WAD fall-through — recommendation on the parked open
question: art-but-no-civics is valid content; strictness lives per-section,
not per-document).

**Hostile-file limits, written down** (today's `cultureProblem` clamps kept,
the rest added as sections land): document ≤ 128 KB; names ≤ 40 × ≤ 12
chars; palette ≤ 16 chars, RGB 0..255; body 4..32 px square bound;
colorways 1..8; accessories ≤ 8; registers 1..4; every voice string
apostrophes-only through `fitSmall` budgets (≤ ~38 diary, ≤ ~50 depart);
tastes ≤ 64 entries in [0.5, 2.0]; purseMul [0.5, 1.5]; arrival repGate
0..100, shareMax ≤ 0.5, shareRamp ≥ 1; foodways ≤ 32 recipes × ≤ 6 steps,
pay/raw in whole cents on the author side crossing the ×100 boundary at
load; maladies ≤ 32 rows, each `id` ≤ 24 chars and unique, `name` ≤ 40
chars, `blurb` ≤ 120, every day count an integer 0..64 (no NaN, no
negatives), `perContactRisk` and `endemic.ignitionChance` in thousandths
0..1000, channel + incubation-contagion weights in sixteenths 0..16,
effect multipliers in twentieths inside declared clamps (needRateMul
0..160, speedMul/workMul 0..80), care-lane multipliers in twentieths
0..80, immunity `durationDays` integer ≥ 1 when declared; Layer-1 (when it lands): expression source ≤ 1 KB, fuel ≤ 512 ops
per evaluation, tables it reads ≤ 4 KB. Every clamp fails with a named
message at import; nothing fails at first draw. **The dogfood test stands
as the format's acceptance bar: if the island's own ways cannot be written
in these sections, the format is wrong** — but the crab migration itself is
the capstone (phase E), not now.

The worked example — the pig culture as a complete, valid v2 instance,
authored to *illustrate* the whole format (it declares more than the shipped
pig does — e.g. a `businesses.mudspa`, to show those optional sections) — is
`design/cultureways/pigway.json`. It is a teaching artifact, **not** the
document the game ships: the shipped pig is generated from
`tools/fixtures/cultures-pig.json` (mkcultureways.mjs), and the two have
drifted, so read pigway.json for the *shape* and the fixture for what the
live pig *is*. The machine-checkable schema is
`design/cultureways/cultureway.schema.json`.

## 1½. THE MALADIES SECTION — the authoring door for disease (v2, strictly additive)

*Formalizes the CS4 disease program's Step 1 (task kd-oCoUSQ2kfE) against the
plan of record `gb bundle doc kd-8eaukVv7X0`. Amends the v2 table above: a new
optional Layer-0 `maladies` section. Schema rule zero holds — no renames,
additive only. This subsection is the SCHEMA (the validated door); the kernel
that reads it is Step 2, and six authoring forks (DIS-1..DIS-6) are filed as
decisions against this task, flagged inline where they touch a field.*

**A malady is a cultureway section, and a section is a list of ROWS.** Each row
authors one named disease. `maladies` is optional and absent-safe: a document
with no `maladies` key is byte-identical to the pre-disease engine (the
fingerprint discipline), so adding the section requires **no `meta.schema`
bump** — it is forward-compatible by construction (unknown sections are ignored
today; §1). The crab culture's generic 3.5 "sick" becomes the first authored
row — `incubationDays: 0`, one care lane, the classic death-arming ladder — so
the shipped behavior is the DEGENERATE CASE of the schema, never a parallel
system.

**The row.** Every field below is validated at import; nothing is validated at
first draw. Grades bound authoring INTENT, not arithmetic — the clamps bound the
numbers (no NaN, no negative day counts), never the horror (§ "Any culture is
free to have terrible diseases", plan pillar 2).

| field | shape + grid | clamp / rule | refusal |
|---|---|---|---|
| `id` | string | non-empty, ≤ 24 chars, unique within the section | `A MALADY WITH NO ID` / `A MALADY TWICE: <id>` |
| `name` | string — printed on every surface | non-empty, ≤ 40 chars, apostrophes-only through the surface's `fitSmall` budget (dock advisory, dossier HEALTH row, follow-card tag, outbreak banner) | `A BAD MALADY NAME` |
| `blurb` | string, optional | ≤ 120 chars | `A BAD MALADY BLURB` |
| `grade` | enum | one of `nuisance` / `grave` / `dire` — drives UI weight + the calibration bar; DIRE is the honest "do not sail there while it burns" | `A BAD MALADY GRADE` |
| `transmit.perContactRisk` | int **thousandths** 0..1000 | base exposure probability per qualifying contact; 0 = never transmits by contact | `A BAD MALADY RISK` |
| `transmit.channels` | object, keys ⊆ {`work`,`dwelling`,`street`,`venue`} | each an int **sixteenths** 0..16 weighting `perContactRisk` on that channel's 2-D adjacency (§ ADR-2 radius = the contact graph); a missing channel = 0 (silent for that channel); an UNKNOWN key fails LOUD (the vacuous-mutation trap — a typo that weighted nothing is dead data) | `A BAD MALADY CHANNEL` |
| `incubationDays` | int 0..64 | 0 allowed (= classic 3.5 shape); the ONLY fog — an incubating crab is invisible to every surface, the player included (plan pillar 4) | `A BAD MALADY DAY COUNT` |
| `contagiousInIncubation` | bool **or** int sixteenths 0..16 | fraction of the symptomatic channel weights that apply while incubating. **DIS-1**: does the author get this knob, or is it fixed doctrine? The schema RESERVES the field either way; the decision picks which shape is honored | `A BAD MALADY INCUBATION` |
| `courseDays` | int 1..64 | symptomatic course length once diagnosed | `A BAD MALADY DAY COUNT` |
| `care` | object, keys ⊆ the CARE_LANES idiom | each a `{cureMul, dieMul}` pair in twentieths 0..80 (20 = ×1); the 3.5 per-lane cure/die ladder generalized per malady; unknown lane id fails LOUD | `A BAD MALADY CARE` |
| `effects.needRateMul` | map, keys ⊆ the **five verbatim** need planes (CS4-05/05a) | int twentieths 0..160 (= ×[0,8]); unknown need id fails LOUD | `A BAD MALADY EFFECT` |
| `effects.speedMul` / `effects.workMul` | int twentieths 0..80 (= ×[0,4]) | `workMul: 0` reproduces the 3.5 "sick day pays nothing → can't eat → sicker" money spiral | `A BAD MALADY EFFECT` |
| `immunity.mode` | enum | `none` / `course` (only while sick) / `permanent`; per-(crab, malady) memory — what makes VARIETY bite (survived A, still naive to B) | `A BAD MALADY IMMUNITY` |
| `immunity.durationDays` | int ≥ 1, optional (only with `permanent`) | omitted = lifetime; a waning permanent immunity when declared. **DIS-3** bounds this | `A BAD MALADY IMMUNITY` |
| `endemic.ignitionChance` | int thousandths 0..1000 | per-settlement-day ignition roll in **home-culture towns only** (culturally SEEDED, plan pillar 3); everywhere else the malady arrives only by contact. `endemic.seasonality` reserved + ignored until the calendar exists (the `world`-section precedent) | `A BAD MALADY ENDEMIC` |
| `art` | object, the cultureway `art` idiom | symptom pose/overlay, tint, particle, quipset; authored + validated under the art program's pipeline (kd-N3BfrR2km7) — pose rects validate against the palette like body art, and it never moves a fingerprint (render is the view, §2). The substrate reserves the sub-object and defers the kit's detailed clamps to the art idiom | `A BAD MALADY ART` |

**Validation posture — `cultureProblem`, additive, named.** A `maladiesProblem(d.maladies)`
check joins the existing chain exactly as `voiceProblem` / `departProblem` /
`stakesProblem` do: `if (d.maladies != null) { const p = maladiesProblem(...); if (p) return p; }`.
`maladies` must be an array (`A BAD MALADIES SECTION`); each entry an object
(`A BAD MALADY`). Every clamp above fails with its NAMED message at import — a
malady that fails is **refused at the validated door with the bundled row
standing in its place** (the WAD fall-through / bundling rule, status box), never
thrown at first draw. Absence of the section, and any single refused row,
consume ZERO draws — the draw-count pin (§5) extends across the disease stage,
so a hostile or half-authored `maladies` section is byte-identical to none.

**Determinism.** All grids are integer and chosen HERE, at design time (the
settled grid idiom, §2) — thousandths for probabilities, sixteenths for channel
weights, twentieths for the multiplier family — so Step 2's kernel binds them
without a later re-baseline. Ignition, exposure, course and outcome are ONE
settlement stage consuming the closed RNG stream and hashed into the recursive
day fingerprint (ADR-2 §4), like every other stage.

**Data must bite (§5 applied to maladies).** Every authored row field owes an
observability scenario: a malady whose effect no scenario can move is dead data
or a missing test. The batch-mutation sweep (§5.2) extends to `maladies` keys.
Whether disease is observable to the BRAIN as well as to policy and the player
— an added need-plane observable, a `NEURO_REGISTRY_VERSION` bump and retrain —
is **DIS-2**; v1 doctrine keeps infection/immunity in per-actor local state
(the CS4-44 `field_plus_local_state` shape) with the five need planes verbatim,
so the default answer is "body + policy, never brain."

**What the maladies row deliberately does NOT own.**
- **Player counter-levers** (close the port, turn away visitors) are POLICY —
  they live in the `management` / `conduct` / `civics` slot space, not a malady
  row. Whether they are in v1 scope is **DIS-4** (calibration doctrine wants the
  avoid-decision loop proven before the first DIRE row lands).
- **Cross-culture severity asymmetry** is EMERGENT from `immunity` memory (a
  culture's own people are largely immune to their endemic malady; every visitor
  is tinder). Whether authors ALSO get a direct knob — a strictly-additive
  `crossCulture` severity map keyed by visitor culture — is **DIS-5**; the schema
  reserves nothing extra for it now (emergent-only is the default).
- **Co-infection resolution** (may a crab carry >1 active malady; allowed /
  exclusive / priority-ordered) is **DIS-6**. The row schema does not forbid two
  rows being active on one town; the per-actor resolution POLICY is the decision.

## 2. THE HOOK-TABLE REGISTRY (Layer 0 meets the kernel)

`MR_TASTE` set the pattern: **the kernel reads data, never learns a
culture's name, and the table's authoring format is a JS/data concern.**
The registry, in recommended migration order:

| # | surface | reads it | table shape | integer grid | clamp | status |
|---|---|---|---|---|---|---|
| 1 | tastes | kernel (`vis_pick`) | per-think row, weight per candidate biz | **today f64** (bit-equal to JS by IEEE); target: twentieths 10..40, a slice-style re-baseline of its own | [0.5, 2.0] | **LIVE** |
| 2 | purse/class | JS mint today; kernel when the mint ports | per-register multiplier | tenths 5..15 (×0.7 → 7) | [0.5, 1.5] | next |
| 3 | arrival gate | sim (`ferryDock`) | {repGate, shareMax, shareRamp} | repGate in milli-rep; share in 1/256ths | above | next |
| 4 | depart-rule weights | engine rule engine | ruleId → weight override | int 0..8 | 0..8 | later |
| 5 | conduct flags | sim (hire path, complaint gates) | booleans + thresholds (hireable, taboo floor, foreign ≤ 0.6) | thresholds in twentieths | per-field | later |
| 6 | foodways/menus | sim (`vis_pick` candidates, serve flow) | BIZ-shaped recipe rows {id, pay¢, raw, steps[station, ticks]} | cents / ticks — exact by construction | §1 limits | **LIVE** (bizRecipes seam; the kernel marshal reads learned rows like native ones) |

**JS-side forever** (never kernel-relevant): every string table (voice
sentences, dossier lines, names — the kernel emits event codes; JS renders
words at the observation point, the event-ring pattern); all render data
(palette, poses, anchors, colorways — the draw path is the view). One open
check flagged: whether collide/berth radii read body `w/h` anywhere — if a
taller pig ever bumps differently, body geometry grows a sim-side integer
shadow and joins the registry; today it does not.

**The grid idiom is settled precedent**: the election surface crossed to
exact integers on an lcm grid with exhaustive-equivalence proof; tipShare
is int twentieths; money is cents. New tables take their grid AT DESIGN
TIME so no later slice pays a re-baseline for them. The one exception on
record — MR_TASTE's f64 — is deliberate (byte-identity phases don't take
re-baselines) and stays open as the registry's row-1 debt; it blocks the
GPU rung's purity, not CS4 authoring.

## 3. LAYER 1, DRAWN TIGHTLY

The research's fraction judgement: ~25% of a civics-bearing culture is pure
config, ~40% formulas, ~35% missing engine capability. Layer 1 exists for
the middle 40% — and for CS4's LAUNCH the honest minimal set is five
formula families, all already named by the Crabocracy's testimony:

1. **Stake valuations** (`platValue`-class): sum of small named terms over
   (crab persona, policy step) — must also emit the receipt (`voteReason`)
   from the same definition. Legibility is a ruling.
2. **Bills/eligibility** (who pays, who may): predicates over the
   capability bundle's read surface.
3. **Urgency ramps** (errand need curves), hard-capped below survival —
   the cap is host-side, not trusted to the expression.
4. **Taste/exposure drift**: weight' = f(weight, exposures) — the
   Victoria-3 mechanic as one update rule.
5. **Acceptance updates**: the CK3-style town-level meter per culture pair.

Everything else the pig or the Crabocracy needs is table (conduct proved
it: fish-taboo is a taste floor, the apron refusal is a boolean, the
complaint is a threshold). **Deliberately out**: Layer-2 SES hooks (held
until a real cultureway forces them — Ruling 1 — and understood as
backend-pinning: the batch instrument refuses or CPU-fallbacks any culture
that takes one); errand *bodies* (the errand registry is ENGINE capability
with Layer-0/1 parameters — culture never supplies imperative movement
code); anything that mints money (no verb exists — conservation by API
shape).

Implementation note carried from the kernel doc: Layer 1 compiles to a
fuel-counted bytecode; the instruction counter IS the fuel budget Ruling 5
demands; the interpreter is a few hundred bytes in kernel.c and identical
in the JS reference. Budget-exhausted → hook aborted, state rolled back,
engine default runs, one legible error (§9's opacity rule). The sim never
stops.

## 4. TECHNICAL DEBT, CLASSIFIED (enumerate, don't fix)

**Blocking generality** (schedule against phases below):
1. The dogfood gap — crab culture inexpressible: `CRAB_COLORS` +
   SUDSY's pinned index, `drawCrab`'s literals (customers are data-driven;
   crew are not), the 12 diary literals (fine as fallbacks, but the crab-
   as-document needs them tabled), `freeCrewName`'s `"CRAB"` literal. →
   phase E, by design; not before.
2. `convertTourist` guards pigs but no settler persona factory exists —
   pig settlers (research §3) blocked. → phase B/C.
3. Walk-ins (`newCustomer`) and legacy `seedVisitors` are crab-only. →
   phase B.
4. The `BIZ` catalog is a code literal — foodways' prerequisite. → phase B.
5. No errand registry / hook taxonomy / policy slots / placement registry —
   the 35% engine capability; civics' prerequisite. → phase D.
6. MR_TASTE f64 → integer grid (own re-baseline) — blocks GPU-rung purity.
   → whenever the next fingerprint-moving slice runs, ride along.
7. `management` norms frozen as constants (WAGE_STD, TABLE_TIP, shift
   shapes). → phase B, cheap.

**Cosmetic / perf (NOT blocking generality)**: `solidBandsKey`'s named
under-invalidation risk (deliberate); `laneClear`'s mid-frame `_stepped`
read (port-blocker for a kernel unit, semantics wart, zero authoring
impact); the 6c residue list (hot object-state not yet in planes — perf/
port debt); the vm-realm default flip (tooling, pending the numeric-branch
merge). None of these constrains what a cultureway can express.

Count: 7 blocking, 4 cosmetic. The blocking set is entirely absorbed by
the phase plan — no orphan debt.

## 5. THE VALIDATION STORY (what "tested" means for data)

1. **The conformance family** (suite scenarios, extending spec-01's tests
   1–11): every clamp has a scenario that feeds the out-of-range value and
   asserts the NAMED import message; a loaded document runs a fixed 2-day
   seed twice → identical fingerprints; the no-key control stays
   byte-identical to the pre-cultures engine; a disabled gate consumes
   zero draws (the draw-count pin extends per-culture).
2. **Data must bite** (the vacuous-mutation lesson applied to tables): a
   table entry no scenario can observe is dead data or a missing test.
   Every registry surface ships its observability scenario (tastes: the
   fish/taco ratio test IS this; purseMul: the departure card's
   BROUGHT/TOOK band; voice: the rendered quote). Enforcement is a sweep,
   not a per-commit gate: the batch instrument mutates each table key of
   the exemplar documents and requires ≥1 scenario to move — run
   on-demand/pre-release, priced like a matrix, receipts banked like one.
3. **Batch-by-cultureway** (the kernel doc's scheduling rule): a
   cultureway sweep runs one culture across N seeds per batch — the
   coherent workload now, the warp-coherent one later. The acceptance
   instrument for a NEW cultureway is the same matrix discipline the
   engine uses on itself: distribution bands per culture, compared against
   the crab baseline's, with the same "regression detector, never a dial"
   doctrine.

## 5½. PHASE STATUS ADDENDUM (2026-08-22, the neuro ladder)

The `policies` section is REAL AHEAD OF SCHEDULE: the neuro ladder landed it
as schema + loader clamps + two live artifacts (the crab default's brain
rides BUNDLED_POLICIES beside the cultureways; the gulls' rides their own
document — THE WINDWARD ROOST is bundled now, the second shipped people and
the first whose decider is their own). A brain is a per-surface policy of
kind `brain` with a declared input vector picked from the versioned
observable registry — the "registry rows" this doc sketches now have their
first production consumer, and the decision-surface registry
(`vis_pick.candidate` today) is the hook-taxonomy seed phase D grows.
Distillation is an MCP tool (`policy_distill`, shadow-mode artifacts,
promotion is the author's act). Receipts:
design/cs35-research/numeric-wip/neuro-ladder-closeout.md.

## 6. THE MIGRATION ORDER (recommendation for the owner)

- **A. Formalize (this doc + files, ~1 session):** schema v2 + JSON Schema
  + pigway.json as the exemplar; conformance-family skeleton in the suite;
  no engine change.
- **B. Foodways + management (~2–3 sessions):** BIZ catalog to data with
  crab fallback; recipes/menus/knowledge + exposure drift (registry rows
  5–6, Layer-1 family 4); management norms to data; pig settlers'
  persona factory; walk-in/seeding culture-awareness.
- **C. Voice completion (~1–2):** crab strings tabled as the default
  document's voice section — the capstone's first slice, cheap and
  self-contained; depart-rule weight overrides (registry row 4).
- **D. Capability APIs (~3–4):** errand registry, hook taxonomy
  (mid-transaction / world-event / settlement-aggregate / wallet-scan),
  policy slots, placement registry, declarative cards — the 35%. Engine
  work, suite-gated, no culture content.
- **E. Civics + the capstone (~4–6):** Layer-1 bytecode (the five
  families), `civics` section, the Crabocracy re-expressed in the format,
  suite green with the transcription loaded — 3.5's definition of done,
  and CS4's reference exemplar.

Ruling requested on: the phase order itself (B-before-D front-loads player-
visible content; D-before-B front-loads platform); whether MR_TASTE's
integer grid rides the next re-baseline; and the parked question this doc
answers by recommendation — partial cultures are shippable content.

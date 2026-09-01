# CS4 UI-HARNESS — THE MANIFEST SPEC: the full battery, declared

*Spec, 2026-09-01. Phase H's first build step (task kd-xMyxML6tpF, epic
kd-fphi80Z6dX). UX-8 ruled **FULL BATTERY DAY-1** in a new ui-harness manifest
(decision kd-fQMdsPrJIK; plan artifact kd-uv0oMBbauO; plan of record bundle
kd-et5QG1esGG). CS4 has no code tree yet, so this lands as the sister programs
land their schemas: a spec in the 3.5 tree — the tree CS4 learns from — that
the CS4 tree implements against. Authored and signed Fable-class per CS4-46.
Sources: the CS4 UX recon (bundle kd-x4W4TzHsBL, inventory kd-0ZTc4vurun §7),
the three filed receipts (kd-vqfzdkVq6y, kd-FS4az7QhTC, kd-GFiKpiPMg6), the
3.5 sweep battery (`tools/suite.mjs`, "no surface prints off the canvas" and
the departures sweeps), and the UX-1/3/4/5/7 rulings of 2026-09-01.*

## 0. WHAT THIS IS, AND WHAT IT CLOSES

**The measured gap.** No automated instrument in 3.5 ever tested whether the
UI *works*. The matrix measures the floor, not the ceiling: it never re-prices
against a rival, never moves an hours sign, never fires a bad hire, never
reads the departure card. The suite's UI coverage was real but hand-grown —
the off-canvas sweep checked one axis, the fold assertion existed for exactly
one card — and every hole in it shipped a bug with a bead number (§2's
receipts). CS4 *widens* the gap by doctrine: golden fingerprints check the
**diff**, not the **spec**, and a wrong day-1 golden is wrong forever and
green forever (CS4-46). The instruments that police a golden must therefore
exist before the goldens they gate. That is this document.

**What this declares.** The full eight-instrument battery (§2), UX-7's six
budgets as named scenarios (§3), the review cadence for LOOKS-AT-IT work
(§4), and the machine-consumable manifest format that carries all of it
(§1, appendix A). Under CS4-46 the reviewer IS the gate until two conditions
lift it: *the battery is declared ahead of the runs it judges*, and *the
golden corpus is seeded from reviewed runs*. **This spec is the first
condition, satisfied.** The second arrives with Phase D's first dressed
surface (§5).

**Where it runs.** The ui-harness is a **new manifest, separate from the sim
`suite-*` scenarios** — kernel-independent by construction: its fixtures build
UI state directly as data, no sim run required, which is why Phase H can build
now, before the kernel exists ("runs early like the weather field"). It has
its own cadence and its own blast radius: a UI-harness red never blocks a
kernel merge and vice versa; both gate on the cluster with the same verb.

**One geometry.** UX-5 ruled SKIN-ONLY (kd-eztRPwP5ty → kd-UXlo2e2njQ):
cultures restyle palette/font/music; every layout, card shape, and control
stays engine. So the battery sweeps **one geometry** — no per-culture
multiplication. Palette variation enters the harness in exactly two places:
the no-colour-only collapse test (§3 B5) and per-skin goldens (§2 I7). The
base font pair is **fixed at 5x7 + 3x5** (UX-7, kd-eQRZgVPJCj); the charset is
the `english-58` English-only authored contract, declared in writing here
(§3 B2 — the name is a label, not a count; measured membership is 55).

## 1. THE MANIFEST FORMAT

### 1.1 The file, its place, its revision discipline

The manifest is one JSON file in the CS4 tree: **`experiments/ui-harness-1.json`**
— kube-runnable like the sim suite manifests (same `resources`/`arms` shape,
same `tools/kube.mjs run … --ref <pushed-SHA> --wait` verb), with one new
top-level section the sim manifests don't have: **`instruments`**, the battery
as data.

- **`rev`** is the battery's revision counter. Every amendment to the battery
  — an instrument's contract, a budget's value, the charset table — increments
  it, through ceremony four (§4.5). Automatic status flips (§1.4) do NOT bump
  the rev; contracts do.
- Every golden records the `rev` it was judged under (§2 I7). "The battery was
  declared ahead of the runs it judges" is thereby *auditable per golden*, not
  folklore: a golden whose `batteryRev` postdates its run is refused at record
  time.
- The `-1` suffix versions the FILE's shape, on the suite-330 convention: a
  format change is a new file, never a rewrite-in-place; battery amendments
  edit in place under ceremony four.

### 1.2 The top-level shape

```json
{
  "name": "ui-harness-1",
  "rev": 1,
  "engine": {
    "geometry": "engine",
    "fonts": ["5x7", "3x5"],
    "charset": "english-58"
  },
  "budgets": { "…": "the six named scenarios — §3, appendix A" },
  "instruments": [
    {
      "id": "fold-for-every-card",
      "class": "per-surface",
      "status": "awaiting-surface",
      "contract": "declared content box fits the derived safe area; every hit rect survives frame composition; occluded controls refuse taps",
      "receipts": ["kd-vqfzdkVq6y"],
      "fixtures": ["widest-content", "every-layer-order"]
    }
  ],
  "resources": { "requests": { "cpu": "1", "memory": "2Gi" },
                 "limits":   { "cpu": "1", "memory": "3Gi" } },
  "arms": [ { "id": "ui-0", "entry": "tools/ui-harness.mjs", "args": [] } ]
}
```

The full day-1 file, ready to seed the CS4 tree verbatim, is appendix A.

### 1.3 The surface registry (the structural closure)

The single biggest 3.5 lesson is not any one bug — it is that every UI
assertion was **hand-enumerated**. The off-canvas sweep names its surfaces one
`run("intro", …)` line at a time; a new card added to the game is invisible to
the sweep until someone remembers to add it; the fold assertion was added for
the departure card and never for the management card, and the management card
shipped 26px under the panel (kd-vqfzdkVq6y). The instrument was right; the
*domain* was wrong.

CS4 closes this structurally. Every drawable surface **registers**:

```js
registerSurface({
  id: "manage-hours",
  draw(state),                    // paints the surface
  box(state),                     // the declared content box
  rects(state),                   // the hit table: [{id, r, names, grain?, disabled?}]
  states(),                       // enumerable fixture states, incl. widest-content
  reachableWhile: ["panel.mute", "panel.speed"],   // what must stay live under this layer
  budgets: { glyphDensity: 0.30 } // per-surface overrides, else manifest defaults
})
```

and the registry is the enumerable domain every per-surface instrument runs
over. The teeth: **the harness hooks the frame compositor, and a draw call
from an unregistered surface fails the run.** Drawing without registering is
not possible-but-untested; it is red. "For every card" stops being a promise
and becomes a quantifier over a set the harness owns.

The hit table is first-class in the registration because in CS4, as in 3.5,
**rect tables make the hit-test the API** — the same table drives the game's
input dispatch, instrument I4's taps, and instrument I6's bot. There is no
second path to poke a control, so there is nothing the instruments exercise
that the player doesn't, and nothing the player reaches that the instruments
can't.

### 1.4 The instrument entry contract

Each of the eight instruments is one entry:

| field | meaning |
|---|---|
| `id` | stable name; §2's headings are these ids |
| `class` | `per-surface` (quantified over the registry), `per-control` (over hit tables), `lint` (static, over source), `process` (a written discipline, e.g. I8) |
| `status` | `armed` \| `awaiting-surface` \| `stub` — see below |
| `contract` | one-sentence pass/fail; §2 is normative where they disagree |
| `receipts` | the traceable 3.5 bug(s)/ruling(s) this instrument would have caught — every instrument must cite at least one |
| `fixtures` | required fixture classes (§1.5) |
| `arming` | (stubs only) the named condition that arms it |

**The three statuses, and why they exist:**

- **`armed`** — implemented, and ≥1 registered target to run over. Runs in
  every gate; a failure blocks.
- **`awaiting-surface`** — implemented, zero matching targets registered yet.
  Arms **automatically** the moment a matching target registers — no human
  step, no manifest edit. This kills the fold-for-exactly-one-card failure
  mode at the root: coverage follows registration, not memory.
- **`stub`** — declared with a written contract but not implemented (day-1:
  I6, I7). The entry names its `arming` condition.

A stub or idle instrument is **never silently green**. The verdict line names
them, every run:

```
UI-HARNESS VERDICT rev 1: surfaces 12, armed 5/5 green, budgets 6/6 green,
  stubs 2 DECLARED-UNRUN (ui-matrix-arm, reviewed-goldens)
```

A battery declared as data means a missing instrument is a visible hole in a
table, not an absence of code — but only if the verdict refuses to let
"declared" read as "ran". (The general lesson: a truncated view is not
absence; silent caps read as coverage.)

### 1.5 Fixtures and the zero-dose rule

Fixture classes the manifest can require per instrument:

- **`widest-content`** — the surface stocked with the widest/longest content
  its data can produce: longest names, six-digit money, full rosters, every
  optional line present. The 3.5 sweep learned this the hard way — *an empty
  card proves nothing about a full one* — and its departures sweep built an
  adversarial manifest for exactly this reason.
- **`every-branch`** — for classifier-driven text: every rule × every modifier
  branch, the way the 3.5 departures glyph sweep crossed the whole rule table
  against blocked/sand/missed/count.
- **`every-layer-order`** — for composition asserts: every legal stack of
  layers (card up, toast up, both), in real frame order.
- **`threshold-neighborhood`** — for money/unit classifiers: values just
  under/over every declared threshold (§2 I5).
- **`state-pairs`** — for state-coded elements: both sides of every coded
  state (§3 B5).

**The zero-dose rule.** Every fixture must prove it *dosed*: a sweep records
what it measured (glyphs painted, rects visited, branches taken), and a
surface or branch that produced **nothing** is a fixture failure, not a pass.
3.5 wrote this into its sweeps as `throw` on an empty visitor list ("a silent
no-op proves nothing"); the project re-measured it during the probe-arm work
(advice kd-1XqylH3kmJ): an instrument that cannot tell its plumbing from its
effect will read a broken probe as a green result. Every per-surface
instrument therefore reports its dose alongside its verdict, and dose zero on
a registered target is red.

### 1.6 The runner and the cluster

`tools/ui-harness.mjs` (CS4 tree) reads the manifest, loads the surface
registry, runs every armed instrument over its domain, and exits nonzero on:
any contract failure; any zero dose; any draw from an unregistered surface;
any **orphan in either direction** — a registered surface no armed per-surface
instrument covered, or a manifest entry that resolves to no implementation and
is not marked `stub`.

Gates run on the cluster, same verb as the sim gate:

```sh
node tools/kube.mjs run experiments/ui-harness-1.json --ref <pushed-SHA> --wait
```

The arms are light — no kernel, no multi-day sim — so this gate is minutes,
runs on every UI push, and its blast radius is its own: a ui-harness red never
blocks a kernel-only merge, and a sim-suite red never blocks a chrome fix.
Receipts bank tracked (never gitignored — the 3.5 receipts directory was
gitignored while 1263 files were tracked under it, and `git status` read clean
after runs that produced 24 files; `git check-ignore` on the receipts path
must be clean) under `design/cs4-research/ui-runs/`.

## 2. THE EIGHT INSTRUMENTS

Traceability first — every instrument names the shipped 3.5 defect or ruled
doctrine it answers. This table is the battery; §§ I1–I8 are the contracts.

| # | id | class | day-1 status | receipt |
|---|---|---|---|---|
| 1 | `sweeps` | per-surface | awaiting-surface | 3.5 sweep battery, generalized; kd-vqfzdkVq6y (the missing axis) |
| 2 | `fold-for-every-card` | per-surface | awaiting-surface | kd-vqfzdkVq6y |
| 3 | `reachability` | per-surface | awaiting-surface | 3.5 schedWindow pager; kd-vqfzdkVq6y (side effect) |
| 4 | `control-had-effect` | per-control | awaiting-surface | kd-FS4az7QhTC; UX-3×UX-4 (camera case) |
| 5 | `money-unit-lint` | lint | awaiting-surface | kd-GFiKpiPMg6, kd-FS4az7QhTC, the double-divide purse bug |
| 6 | `ui-matrix-arm` | per-control | **stub** | "the matrix measures the floor" (CLAUDE.md / recon) |
| 7 | `reviewed-goldens` | process | **stub** | CS4-46 (wrong-forever, green-forever) |
| 8 | `review-cadence` | process | armed (it is §4) | CS4-46 |

### I1 `sweeps` — the ported battery, both axes

For every registered surface × every required fixture state, hook the paint
layer (`text`/`smallText`/`rect` in 3.5 terms) and **measure every string at
the size it prints**:

- **(a) Canvas bounds, BOTH axes.** `x < 0`, `x + w > W`, `y < 0`,
  `y + h > H` are all defects. 3.5's sweep checked x only — that is the
  named reason kd-vqfzdkVq6y shipped (a card ending at y202 under a panel at
  y176, invisible to an x-only sweep). The y half is not an upgrade; it is
  the hole.
- **(b) Box bounds.** Text stays inside the surface's declared `box(state)` —
  the canvas is not the card. (3.5's sweep grew this as an optional `BX`
  after the lease-terms card printed a 34-character line sized for a 100px
  slot that actually measured 135px, 13px past the screen edge.)
- **(c) Text overlap.** Glyph boxes may not intersect other glyph boxes
  (>1px on both axes; the 2px-offset drop-shadow twin is exempt), and a
  filled rect may not land on text painted earlier in the same composition.
- **(d) Negative rect.** Any `rect` with `w < 0 || h < 0` is red — the
  red-bar class: an unclamped fraction handing fillRect a six-digit negative
  width that paints leftward across the card (3.5: FED read raw Q20).
- **(e) Glyph coverage.** Every character printed exists in the font table it
  printed through. In CS4 the fallback itself is instrumented: a missing
  glyph **reports to the harness**; it never silently substitutes `?`. (3.5
  shipped `?COULDN'T AFFORD A BED. I SLEPT ON THE BEACH.?` because
  FONT_SMALL had an apostrophe and no double quote, and the fallback made a
  font bug read as a typo. Found by looking at a screenshot — the class of
  bug this battery exists to catch by machine.)

Runs over `widest-content` and `every-branch` fixtures; reports dose (glyphs
measured per surface).

### I2 `fold-for-every-card` — composition, derived not hardcoded

The receipt in full, because every clause of the contract comes from it:
kd-vqfzdkVq6y — `manageRects()` hardcoded a card height (grown 164→196 in a
later feature commit while the stale comment still said 164) so the card body
ran to y202 under a panel painted opaque from y176 **after** the card in frame
order. Everything on the card below y176 was *painted, then erased, still
clickable*: a DONE chip fully hidden and still answering taps, SELL/KEEP chips
75% hidden, steppers half-clipped — and the panel's own mute/speed chips
unreachable while any card was up. The suite asserted the fold for exactly one
card (departures), so the class survived.

For **every** registered surface, under `every-layer-order` fixtures:

- **(a) Geometry.** The surface's `box(state)` fits inside the safe area
  **derived from what composes after it in frame order** — computed from the
  registered layers, never a hardcoded constant. A layer that grows reshapes
  the safe area of everything under it, automatically.
- **(b) Survival.** After the full frame composes, every rect in the
  surface's hit table has a minimum fraction of its own painted pixels
  surviving in the final frame. Hidden-but-clickable — the DONE chip — is the
  defect this half exists for.
- **(c) Occlusion symmetry.** Any control whose pixels do NOT survive
  composition must also refuse taps, and both must read **one predicate** —
  3.5's R8 ruling ("liveness is a predicate; draw, hit-test and settlement
  read one predicate") carried into the chrome itself. A control is visible
  and live, or invisible and dead; the mixed states are both red.

### I3 `reachability` — union-of-scroll coverage

Bounds sweeps prove what's painted is legal; they cannot see what was never
painted. A `slice(0, 4)` over a 12-row roster passes every bounds and overlap
sweep and strands 8 rows — 3.5 caught this for exactly one widget (the
schedule pager: "the window drops staff: N/12 reachable across pages"), by
hand. Generalized:

- **(a) Element coverage.** For every registered surface, every element its
  state names (roster rows, staff indices, list entries, pages, controls) is
  visible-and-hittable in the **union over all reachable scroll/page states**.
  The registration's `states()` enumerates the scroll/page axis; the
  instrument walks it.
- **(b) Surface coverage.** Every registered surface is itself reachable:
  some input path opens it. An orphan card nothing opens is red.
- **(c) Modal reachability.** What must stay live while a layer is up is
  declared (`reachableWhile`), and asserted under `every-layer-order` — the
  kd-vqfzdkVq6y side effect (panel chips dead behind any card, because one
  hit-test spanned y4–203) is this clause's receipt.

### I4 `control-had-effect` — the tap must move the state it names

The receipt: kd-FS4az7QhTC. The per-crab wage stepper stepped **±1 cent**
into a clamp that snaps to whole dollars, so the rate never moved — and
`sfx.buy()` and `save()` fired anyway, so the control *felt* like it worked.
The shop-wide steppers 19 lines up used the correct ±100 grain. Written in
the dollars era; the cents migration updated one call site and missed the
other; no scenario exercised the rects. No ordering or monotonicity check can
see this class — only "did the state the control names actually change".

Every rect in every hit table declares what it `names` (a state path or
predicate) and, for steppers/dials, its `grain` — **drawn from the same
constants table the clamp reads** (§ I5b). The instrument, for every control,
through the real dispatch path (a synthesized tap at the rect — the hit-test
IS the API, there is no second door):

- **(a) Effect.** The named state changes by the declared grain — or the
  control is declared-and-rendered disabled (and then the tap is refused by
  the same predicate: R8, and I2c).
- **(b) Effects gate on delta.** `sfx`/`save`/toast fire **only if** the
  named state changed. A no-op that celebrates is red — that is the exact
  texture of kd-FS4az7QhTC.
- **(c) Round-trip.** For persisted state: change survives a save/load cycle.

**The multi-town camera case** (UX-3 dark-until-mail × UX-4 switchable-live —
the trio synthesis, and the one entry here 3.5 has no ancestor for). The
camera switch is a control like any other, and it asserts BOTH directions:

- **(d) The switch had effect.** After switching to town T, the live view
  renders T — the frame delta names T's registered surfaces, live.
- **(e) No omniscience leaks.** Every surface reporting a town that is NOT
  on camera renders from the **last mailbag snapshot**, staleness visible,
  gaps left visible — never from live state. The fixture mutates an
  off-camera town's live state and asserts nothing watched changes; then
  lands the mailbag and asserts the update appears, stamped as-of. A live
  fact leaking into a dark town is red *even though it looks more correct* —
  the doctrine is that knowledge is local and boat-gated, and the player
  cannot channel-surf into an omniscient dashboard.

### I5 `money-unit-lint` — typed quantities, reachable labels

Three receipts, one family: kd-GFiKpiPMg6 (a dollars-era literal `70`
surviving into the cents era as a threshold that should read `7000`, making
FLUSH unconditional and ON HOLIDAY dead code); kd-FS4az7QhTC (±1 where the
grain is 100); and 3.5's double-divide purse bug, whose suite assertion
checked the **sort order** of wallets — which a monotonic bug preserves
perfectly. Class `lint` (static, over source) plus `threshold-neighborhood`
fixtures:

- **(a) One unit, declared.** CS4 money is integer cents, everywhere. Any
  numeric literal compared with, added to, or assigned into a money-typed
  quantity must be drawn from a declared constants table carrying its unit.
  A naked literal against a typed quantity fails the lint — `70` cannot ship
  where `7000` was meant, because `70` cannot ship at all.
- **(b) Grain shared with the clamp.** Every stepper/dial's declared `grain`
  (I4) and the clamp it feeds read the **same constant**. The ±1-into-a-
  ±100-clamp mismatch becomes unrepresentable.
- **(c) Every label reachable.** For every classifier from a typed quantity
  to a label (3.5's `visCondition`: SPENT UP / FLUSH / ON HOLIDAY), the
  `threshold-neighborhood` fixture must produce **every declared label**. A
  label no fixture can reach is dead code and red — this is the clause that
  catches 70-vs-7000, because no wallet value can make ON HOLIDAY print.
- **(d) Values, not orderings.** Money assertions in the harness bite
  values (or value classes), never orderings alone — the purse-bug lesson.

### I6 `ui-matrix-arm` — the bot that plays the real controls (DAY-1 STUB)

The gap, verbatim from the tree's own doctrine: *the matrix measures the
FLOOR, not the ceiling — it buys a fixed list and trades on autopilot: it
never re-prices against a rival, moves an hours sign, fires a bad hire or
reads the departure card.* Every sim matrix in 3.5 exercised the economy
through function calls; no instrument ever exercised the **management
surfaces** at all, daily or otherwise.

Contract (written now, armed later): a bot that plays **only through the
input layer** — synthesized taps against the registered rect tables, never a
direct function call (there is deliberately no other API: §1.3). Its policies
exercise exactly the verbs the autopilot never used: re-price against a
rival, move an hours sign, fire the worst hire, open and read the departure
card, switch the camera between towns. It runs as a matrix arm on the cluster
at the sim matrix's cadence; its receipts bank like matrix receipts. Any UI
change that breaks the bot's route to a verb is a regression the sim matrix
structurally cannot see.

**Status: `stub`.** Arming condition, in the manifest: the first management
surface and its rect bindings registered. Until then, every verdict line
names it DECLARED-UNRUN (§1.4).

### I7 `reviewed-goldens` — with rendered frames, seeded as surfaces appear

CS4's gate doctrine is golden fingerprints, and the failure mode is named in
CLAUDE.md: a wrong day-1 fingerprint is wrong forever AND green forever. The
counter is not a better fingerprint; it is a **ceremony around recording**
(§4.3). A golden is:

```json
{ "surfaces": ["hud", "manage-hours"], "state": "…", "fingerprint": "…",
  "frames": ["design/cs4-research/ui-reviews/…"], "reviewer": "…",
  "batteryRev": 3, "verdict": "…" }
```

Recording requires, mechanically refused otherwise: every armed instrument
green on the covered surfaces; all six budgets green (§3 — this is the "on
every card before a golden is recorded" clause of the UX-7 ruling); rendered
frames attached; a Fable-class reviewer who **looked** and signed (CS4-46);
and `batteryRev` ≤ the rev current when the run started — the battery judges
only runs it predates, auditable per golden (§1.1).

**Status: `stub`, seeded as surfaces appear** — first golden at the first
dressed surface (Phase D, with Art Program Step 4). Goldens are recorded per
shipping skin (a palette swap changes pixels, hence fingerprints); the
geometry beneath stays one (UX-5).

### I8 `review-cadence` — the written discipline

The eighth instrument is §4 of this document. It has a manifest entry so the
battery is complete *as a list* — eight rows, none silently missing — and the
entry pins where the cadence is written (`design/cs4-ui-harness.md §4`). Its
contract is that §4's ceremonies are followed; its receipt is CS4-46. It is
`armed` from day 1: the cadence governs paper and spec reviews before any
code exists.

## 3. UX-7'S SIX BUDGETS — named scenarios, asserted before any golden

The UX-7 ruling (kd-eQRZgVPJCj, CHEAP DEBT-PAYDOWN) spends nothing on new
art and everything on **declared budgets the harness asserts** — the ruling's
own text makes them UX-8's inheritance, and this section is where they become
named scenarios. Each runs per-surface; **all six must be green on every card
before a golden is recorded** (I7 refuses otherwise). Two carry day-1 values
marked PROVISIONAL: the *declaration* is load-bearing now, the calibration
lands with the first reviewed surfaces, and a value change is ceremony four —
reviewed, rev-bumped, never silent.

**B1 `glyph-density` — the per-surface ceiling.** The overlap sweep
structurally cannot see the mush: text can be perfectly non-overlapping and
still unreadable. Density is the measurable proxy, and the ruling's answer to
keeping 5x7+3x5 with no middle size. Measure: **ink ratio** = Σ glyph cell
area printed (5x7 = 35px², 3x5 = 15px² per glyph) ÷ the surface's declared
content-box area, taken at the densest required fixture state
(`widest-content`). Ceiling: per-surface at registration, manifest default
**0.30 PROVISIONAL** — to be calibrated at first port against the densest 3.5
card a reviewer accepts and the mush a reviewer rejects.

**B2 `charset` — English-only, in writing.** The uppercase charset named
`english-58` is the authored contract; the manifest's `charset` table IS the
declaration UX-7 requires. Sweep every string every surface can print, over
`every-branch` fixtures (the departures precedent: the whole rule table
crossed against every modifier). Any character outside the table is red; the
font tables cover exactly the contract; the fallback reports instead of
substituting (I1e). No string table, no extended-glyph seam day one; a
per-culture font that needs new glyphs is a scoped CS4-18 amendment **that
must amend this table first**.

*The name vs the count, reconciled once (kd-dKUTfmeogZ).* `english-58` is the
UX-7 recon's historical label and stays as the contract's stable identity —
the battery keys off the NAME, and renaming an identity is pure churn. The
MEASURED membership — the union of `FONT` and `FONT_SMALL`, authored as
measured in the CS4 tree's `screen/font.mjs` `CHARSET_ENGLISH_58` — is **55
glyphs including the space**. Either the recon counted three glyphs that
never existed or it counted a table that never shipped; nobody re-derives it
from here. The name is an identity, not a count.

**B3 `reduced-motion` — honoured for the blink/pulse class.** All chrome
animation of the blink/pulse class routes through **one declared helper**.
With the reduced-motion flag set, the harness renders K frames of every
surface and asserts zero pixel delta attributable to that class. Scope is the
chrome, not the world: sim actors keep moving — the flag stills the
interface, it does not buy time (R1: every accessibility answer must be
something other than time). Lint half: no time-modulated paint in UI code
outside the helper.

**B4 `volume-control` — present, real, persistent.** A registered volume
control bound to persisted state — not a hardcoded on/off. I3 proves it
reachable (including while cards are up: `reachableWhile`), I4 proves it has
effect and survives save/load. Arms with the first audio emission; from then
on its absence is red.

**B5 `no-colour-only` — shape + colour, machine-checked.** Every element
that encodes state registers its `state-pairs` and a non-colour channel
(shape, glyph, position). Two halves: (lint) the registration declares the
channel; (render) for each state pair, render both sides and assert the pixel
diff **survives luminance collapse** — greyscale both frames; a diff that
collapses to zero was colour-only, and is red. This is also where per-culture
palettes touch the harness (UX-5): the collapse test runs per shipping skin,
the geometry stays one.

**B6 `target-size` — the declared minimum.** Every rect in every hit table
≥ the manifest minimum: **10×10px PROVISIONAL** on the 256-wide canvas,
calibrated at the first surface review. The manifest carries an `exemptions`
list so a deliberate exception is a debt with a name — and the list **must be
empty at golden time**: an exemption may ride a work-in-progress surface, it
may not ride into the corpus.

## 4. THE REVIEW CADENCE — who looks, at what, before what lands

*Written runbook-style, per the UX-8 ruling: the way the kube runbook writes
the sim gate. This section is instrument I8.*

### 4.1 The standing rule

**Under CS4-46 the reviewer IS the gate**, and the whole delivery path —
implementation and sign-off — is Fable-class. This is "near term" with a
written expiry (§4.7), not folklore. Until it lifts: no UI surface lands, no
golden records, and no battery amendment merges without a Fable-class look,
and every look banks a receipt someone else can audit.

**Who looks:** a Fable-class agent, or the operator. For ceremony one the
reviewer may be the author (the banked frame sheet keeps the look auditable);
for ceremonies two and three the reviewer **must not be the author** of the
change that produced the run — a golden is the permanent record, and the
author's eye is the one already convinced. (This authorship rule is this
spec's proposal, amendable by ceremony four.)

**At what:** rendered frames — PNG at native size and 2×, one per state the
instruments judged densest/widest plus every state a golden names — banked
**tracked** under `design/cs4-research/ui-reviews/<surface>-<sha>/`
(`git check-ignore` clean; a receipt `git status` can't see is a receipt that
doesn't exist).

### 4.2 Ceremony one — a surface lands

Before the first merge of any registered surface, and before any merge that
changes a surface's paint or rects:

1. The branch gates green on the cluster (armed instruments + budgets).
2. A frame sheet renders: every required fixture state, `widest-content`
   included.
3. The reviewer LOOKS — at legibility, at honesty, at the game's voice: the
   ceiling the instruments cannot measure (§6).
4. The look banks: frames + a dated verdict note in the review directory.

### 4.3 Ceremony two — a golden records

1. Every armed instrument green on the covered surfaces; **all six budgets
   green**; B6's exemption list empty.
2. Frames rendered and attached to the golden's metadata.
3. A reviewer who is not the run's author LOOKS at the frames and signs.
4. The golden records `batteryRev`, and the rev must predate the run (§1.1).

A golden recorded any other way is refused mechanically (I7), not by
convention — conventions are what the pre-push hook's own history says fail.

### 4.4 Ceremony three — a golden changes

The fingerprint drifted. The diff description names **which surface** and
**why**; new frames render; the reviewer compares old and new **side by
side**; the golden re-records with the new signature. Two hard rules:

- **Never green-only.** A golden is never updated because the number changed
  and the suite wants it back green. The update IS a review.
- **No bulk accept.** Wholesale re-recording after a wide diff is forbidden —
  bulk-accept is precisely how wrong-forever gets green-forever back in.
  Wide diffs re-review surface by surface.

### 4.5 Ceremony four — the battery amends

An instrument's contract changes, a budget value moves, the charset table
grows, an exemption is requested: that is a **spec amendment** — this document
and the manifest change together, `rev` increments, and the amendment gets a
Fable-class look like any surface. Automatic status flips
(`awaiting-surface` → `armed` when a target registers) are not amendments;
contract changes are. Goldens pin the rev that judged them, so the audit
trail survives every amendment.

### 4.6 The cadence table

| when | what runs | who looks |
|---|---|---|
| every UI push | armed instruments + budgets, on the cluster | nobody — machines police the floor |
| a surface lands / changes | ceremony one | Fable-class (author allowed) |
| a golden records | ceremony two | Fable-class, not the author |
| a golden drifts | ceremony three | Fable-class, not the author |
| the battery amends | ceremony four | Fable-class |
| daily, once I6 arms | the ui-matrix-arm, banking receipts | nobody per run; drift review weekly |

### 4.7 The expiry condition

CS4-46's "near term" lifts when **the gate is a gate again**: (1) the battery
is declared ahead of the runs it judges — **satisfied by this spec** and kept
true by the rev discipline; (2) the golden corpus is seeded from reviewed
runs — begins at Phase D's first dressed surface, and "seeded" means every
shipped surface family owns at least one ceremony-two golden. When both hold,
the reviewer stops being the gate and goes back to being the ceiling (§6);
ceremonies two through four remain, because they are what keeps the corpus
right, not scaffolding around its absence.

## 5. SEEDING ORDER — what arms when

Option (b)'s own text: the running instruments seed "as surfaces appear."
Declared now so arming is mechanical, not judged:

1. **CS4's first UI commit** seeds the registry, the runner skeleton, and
   `experiments/ui-harness-1.json` verbatim from appendix A. I1–I5 land as
   `awaiting-surface` implementations built against the registry; I6/I7 are
   `stub`; I8 is this document. The verdict line says exactly that.
2. **The first registered surface** auto-arms I1, I2, I3, B1, B2.
3. **The first control** auto-arms I4 (a–c) and B6. **The first audio
   emission** arms B4. **The first state-coded element** arms B5. **The
   first chrome animation** arms B3 (the helper lands with it).
4. **The first management surface** satisfies I6's arming condition — the
   stub becomes a build step (its own bead, its own review).
5. **The second town view** arms I4's camera case (d–e) — the UX-3×UX-4
   assertions exist from the first moment two towns can be watched.
6. **The first dressed surface** (Phase D, with Art Program Step 4) seeds
   I7: ceremony two runs for the first time, and the §4.7 expiry clock
   starts counting corpus coverage.

## 6. WHAT THE HARNESS DOES NOT DO

The battery polices the **floor**: bounds, fold, reach, effect, units, six
budgets. It cannot judge whether a card is *good* — legible past the density
number, honest in the game's voice, worth the pixels it spends. That is the
reviewer's half, permanently: the instruments exist so the Fable-class look
is spent on the ceiling instead of re-deriving the floor by eye, frame after
frame. The harness also does not: multiply geometry per culture (UX-5 ruled
one geometry; skins touch B5 and I7 only); carry an i18n axis (English-only
is declared, B2); or buy the player time (R1 — the access floor is the six
budgets, none of which is a pause).

---

## APPENDIX A — the day-1 manifest, verbatim

The CS4 tree's first `experiments/ui-harness-1.json`. Values marked
provisional in §3 carry here; changing any of this after seeding is ceremony
four.

```json
{
  "name": "ui-harness-1",
  "rev": 1,
  "note": "The UI-instrument battery, declared ahead of the runs it judges (design/cs4-ui-harness.md in the 3.5 tree; UX-8 ruling kd-fQMdsPrJIK). Kernel-independent: fixtures build UI state as data. Own cadence, own blast radius. A stub is never silently green: the verdict names DECLARED-UNRUN entries every run.",
  "engine": {
    "geometry": "engine",
    "fonts": ["5x7", "3x5"],
    "charset": "english-58"
  },
  "budgets": {
    "glyph-density":  { "measure": "ink-ratio", "default": 0.30,
                        "provisional": true, "perSurface": true },
    "charset":        { "table": "engine.charset" },
    "reduced-motion": { "class": "blink-pulse", "frames": 8 },
    "volume-control": { "required": true, "arming": "first-audio-emission" },
    "no-colour-only": { "collapse": "luminance" },
    "target-size":    { "min": [10, 10], "provisional": true,
                        "exemptions": [], "exemptionsEmptyAtGolden": true }
  },
  "instruments": [
    { "id": "sweeps", "class": "per-surface", "status": "awaiting-surface",
      "contract": "bounds both axes; box bounds; text overlap; negative rect; glyph coverage with reporting fallback",
      "receipts": ["3.5 suite: no surface prints off the canvas", "kd-vqfzdkVq6y"],
      "fixtures": ["widest-content", "every-branch"] },
    { "id": "fold-for-every-card", "class": "per-surface", "status": "awaiting-surface",
      "contract": "content box fits the safe area derived from frame order; every hit rect survives composition; occluded controls refuse taps (one predicate)",
      "receipts": ["kd-vqfzdkVq6y"],
      "fixtures": ["widest-content", "every-layer-order"] },
    { "id": "reachability", "class": "per-surface", "status": "awaiting-surface",
      "contract": "union-of-scroll covers every named element; every surface openable; reachableWhile holds under every layer order",
      "receipts": ["3.5 suite: schedWindow pager", "kd-vqfzdkVq6y"],
      "fixtures": ["widest-content", "every-layer-order"] },
    { "id": "control-had-effect", "class": "per-control", "status": "awaiting-surface",
      "contract": "tap through the real hit table moves the named state by the declared grain, or the control renders disabled and refuses by the same predicate; sfx/save gate on delta; persisted state round-trips; camera switch renders the named town live and every off-camera town dark (mailbag snapshot, staleness visible)",
      "receipts": ["kd-FS4az7QhTC", "UX-3 kd-b2xVXRKPWh", "UX-4 kd-XsYHzNWlSQ"],
      "fixtures": ["threshold-neighborhood", "every-layer-order"] },
    { "id": "money-unit-lint", "class": "lint", "status": "awaiting-surface",
      "contract": "money is integer cents; literals against typed quantities come from the unit-carrying constants table; stepper grain and clamp share one constant; every classifier label reachable by fixture; assertions bite values, not orderings",
      "receipts": ["kd-GFiKpiPMg6", "kd-FS4az7QhTC", "3.5 double-divide purse bug"],
      "fixtures": ["threshold-neighborhood"] },
    { "id": "ui-matrix-arm", "class": "per-control", "status": "stub",
      "arming": "first management surface + rect bindings registered",
      "contract": "a bot plays only through synthesized taps on the registered rect tables (no function calls): re-price vs rival, move hours, fire worst hire, read the departure card, switch camera; runs at matrix cadence on the cluster; receipts bank like matrix receipts",
      "receipts": ["the matrix measures the floor (CLAUDE.md; recon kd-x4W4TzHsBL)"],
      "fixtures": [] },
    { "id": "reviewed-goldens", "class": "process", "status": "stub",
      "arming": "first dressed surface (Phase D)",
      "contract": "a golden records only from a run with all armed instruments + all six budgets green on its surfaces, frames attached, a non-author Fable-class reviewer signed, and batteryRev predating the run; never green-only updates; no bulk accept",
      "receipts": ["CS4-46"],
      "fixtures": [] },
    { "id": "review-cadence", "class": "process", "status": "armed",
      "contract": "design/cs4-ui-harness.md section 4 is followed; ceremonies one through four",
      "receipts": ["CS4-46"],
      "fixtures": [] }
  ],
  "resources": {
    "requests": { "cpu": "1", "memory": "2Gi" },
    "limits":   { "cpu": "1", "memory": "3Gi" }
  },
  "arms": [
    { "id": "ui-0", "entry": "tools/ui-harness.mjs", "args": [] }
  ]
}
```

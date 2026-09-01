# CS4 DISEASE KERNEL — MECHANICS SPEC: the settlement stage, the state, the fingerprint fold

*Spec, 2026-09-01. Step 2 of the CS4 disease program (task kd-GVeAqqn0Gh, epic
kd-U5gTWF0SHz; plan of record `gb bundle doc kd-8eaukVv7X0`, bundle
kd-kZyXtAUQ9K). Reads the maladies SCHEMA landed in Step 1
(`design/cs35-cultureway-substrate.md` §1½) and the six DIS fork rulings folded
into it. Grounded in the accepted CS4 ADRs — ADR-2 (kernel state layout / ABI,
kd-YbbFkkTpqz), ADR-3 (the day-boundary contract, kd-U5YcqgLyGd), ADR-7 (the
harness / the gate / what proves a day, kd-F6339Mo89e) — and in the live 3.5
settlement epidemiology (`game.js` ~25707) it generalizes. Authored and signed
Fable-class per CS4-46.*

## 0. WHAT THIS IS, AND WHERE IT LANDS

**What Step 2 owns.** The disease ENGINE BODIES: the per-actor infection and
immunity state, the one settlement disease stage (ignition → exposure →
incubation → symptomatic → recover-or-die), the per-(town, malady) outbreak
state, and how all of it consumes the closed RNG stream and folds into the
recursive day fingerprint. Step 1 built the authoring DOOR (the validated
`maladies` row); this spec is the KERNEL that reads a validated row and makes it
bite. It stops where presentation begins: Step 3 (kd-D3ITVE3Re8) reads the state
this spec defines; Step 4 (kd-DPe6u4aiBz) authors the first rows against it;
Step 5 (kd-TrJxCcliXE) proves the DIRE avoid-loop. The calibration NUMBERS are
measured, never authored here (§9, and Step 0's receipt kd-Fk56084qHe).

**Where it lands — the tree question, confirmed by inspection.** The task flags
one open question: "CS4 has no code tree yet — confirm whether the kernel lands
in this 3.5 tree (under the maintenance freeze, as instrumentation/spec) or in a
CS4 tree if one exists by then." **No CS4 tree exists** (verified: the repo root
is the 3.5 tree — `game.js`, `crabs.js`, `ppu.js`, …; there is no `cs4/`). So
the sister-program precedent applies, and it is unambiguous: the UI-harness
manifest (Phase H, `design/cs4-ui-harness.md`, merged the same day, `b6913c0`)
landed as **a spec in the 3.5 tree — the tree CS4 learns from — that the CS4
tree implements against**, docs-only, allowed under the freeze. The maladies
schema (Step 1) did the same. Step 2 lands the same way.

This is exactly the freeze edge ADR-7 §10 draws:

> **MAINTENANCE IS WHAT MAY LAND. INSTRUMENTATION IS WHAT MAY RUN.** A spike
> produces a receipt, not a merge.

A kernel spec is a document; it lands. A kernel *implementation* merged into
`game.js` is a feature on a frozen tree; it does not. And under CS4-46
(`fable_class_delivery`) the *reviewed run + golden day* half of this step's
delivery is reserved for the moment the CS4 tree exists and a Fable-class agent
implements and signs it. **What this spec discharges now is the half that must
come first:** ADR-7 §1's law — *the gate exists before the thing it gates; the
battery is declared before the run it judges* (§9 here). Declaring the battery
in the shadow of no numbers is the one thing that can only be done before any
run has happened. That is the deliverable.

**Hard constraints carried from the plan and honored throughout:**
- **Five need planes stay verbatim** (CS4-05/05a): hunger, thirst, dirt, bored,
  tired (`game.js:7607`, `:9931`). Disease adds **no observable, no
  `NEURO_REGISTRY_VERSION` bump, no retrain** (DIS-2 body+policy; §1.4).
- **Bodies and policies, not brains** (plan pillar 6): crabs do not dodge
  coughers in v1; the PLAYER avoids. Infection/immunity is per-actor LOCAL STATE
  in the CS4-44 `field_plus_local_state` shape (§1).
- **A row that fails its clamps is refused at the validated door**
  (`cultureProblem`/`maladiesProblem` posture), never at first draw (§8).
- **The `--nomalady` arm-off hatch ships WITH the mechanic** (kd-JwPxQ7pSwn),
  plus per-row disable (§7).

## 1. THE STATE — INFECTION AND IMMUNITY ARE LOCAL STATE (CS4-44)

ADR-2 §7.1 (`field_plus_local_state`, CS4-44) splits kernel state into two
planes: a fixed-width culture-independent FIELD (weather is the exemplar) and
per-arena-node LOCAL STATE that rides that node's own day. **Disease is entirely
local state.** There is no disease FIELD — a malady is not a pure function of
day and position the way the swell is; it is carried, in bodies, and it
propagates only by the contact graph within an arena and by the mailbag between
arenas. This keeps disease inside `ban_canon` (ADR-3 §1) for free: one arena
never reads another arena's infection today.

Two local-state records, at two levels of the arena tree.

### 1.1 Per-actor: the infection SET and the immunity memory

3.5 carries infection as a single boolean-ish slot: `k.p.sick = { days,
fromDebt }` or `null` (`game.js:25750`). One implicit disease, present or not.
CS4 generalizes the slot to two per-actor collections keyed by malady `id`:

```
actor.infections : Map<maladyId, {
    stage      : "incubating" | "symptomatic",   // susceptible = absence of a record
    day        : int,   // days elapsed IN THE CURRENT STAGE (0 on the day of entry)
    fromDebt   : bool,   // the 3.5 debt-lane bar, preserved per malady (CARE_LANES.spent)
}>
actor.immunity : Map<maladyId, {
    mode       : "course" | "permanent",   // "none" is never recorded — it is absence
    untilDay   : int | null,   // permanent+durationDays hard expiry; null = lifetime
}>
```

- **Susceptible is the empty case.** A `(crab, malady)` with no `infections`
  entry and no live `immunity` entry is susceptible to it. This is what makes
  VARIETY bite: a town that survived strain A carries `immunity[A]` and stays a
  blank sheet for strain B (`immunity[B]` absent). Immunity is per-(crab,
  malady), never a global "immune" flag (plan §THE STATE MACHINE; DIS-5).
- **`infections` is a SET, not a scalar** — DIS-6 ruled co-infection ALLOWED
  (stacking under clamps). A crab may hold several active records at once; §5
  specifies how their effects compose and why the compose order is `id`-sorted.
- **`day` counts elapsed days in the CURRENT stage**, resetting to 0 at the
  incubating→symptomatic transition. Incubation length is compared against the
  row's `incubationDays`; course length against `courseDays`. (3.5 keeps one
  `sick.days` counter because it has no incubation; the split is what the
  invisible incubation window costs.)
- **`fromDebt` is preserved per malady**, marked at onset from the same
  `debtRisk()` the roll read (`game.js:25750`, `:4815`), so the debt care-lane
  bar (`CARE_LANES.spent`, `game.js:4813`) generalizes unchanged (§4, §3.4).

### 1.2 Per-arena (town): the outbreak overlay

The plan's "if they had that disease ACTIVE" is a toggling per-(town, malady)
world state the player reads — not a static culture property (plan pillar 3).
It is arena LOCAL STATE, one record per malady that has ignited or arrived in
this town:

```
arena.outbreaks : Map<maladyId, {
    state       : "active" | "burnedOut",   // dormant = absence of a record
    quietDays   : int,   // consecutive settlement days with zero live cases; drives burn-out
    igniteDay   : int,   // the day this outbreak first went active (for the banner + receipts)
}>
```

- **dormant → ACTIVE → burned-out → dormant** (plan §THE STATE MACHINE). A
  malady goes `active` on the first symptomatic case OR on an endemic ignition
  (§2.2). It goes `burnedOut` after `OUTBREAK_QUIET_K` consecutive settlement
  days with no live case (incubating or symptomatic) of that malady in the
  arena. A `burnedOut` record with continued quiet is dropped back to dormant
  (absence) at midnight — burn-out is a latch that lets the banner say "it
  passed" for one cycle, then clears.
- **`OUTBREAK_QUIET_K` is a kernel constant beside the hash**, not config — it
  is a fingerprint input the way `_ALM_EPOCH` and `POOL_MAX` are (ADR-2 §7.1).
  Declared here, measured against Step 0's boundary receipt before a golden day
  is recorded (§9). Proposed provisional K = 3; **the number is Step-0/Step-4's
  to fix, not this spec's.**
- The outbreak overlay is what Step 3's town banner and dock travel advisory
  read (§9 read-interface). It exists so a surface never has to scan every crab
  to answer "is malady M loose in town T?".

### 1.3 The degenerate case — the crab's generic "sick" is the first row

The schema's design intent (§1½) is that the crab culture's generic 3.5 illness
becomes the FIRST authored malady row, so the shipped behavior is the
DEGENERATE CASE of the kernel, never a parallel system. Concretely a crab row
with `incubationDays: 0` (no fog — the record enters `symptomatic` on day of
exposure, exactly like `k.p.sick = { days: 0 }`), one care lane, and the classic
death-arming ladder reproduces 3.5's illness. Step 4 authors that row and
measures the equivalence; §9 declares the equivalence scenario the golden day
must pass. **One honest gap the degenerate case exposes** is called out in §2.5
(neglect self-ignition): 3.5 lets neglect *start* an illness with no contagion
source present, and the schema's ignition sources are endemic + contact only.
The kernel resolves it with a per-actor susceptibility term; whether that term
also SELF-ignites is the one Step-2 mechanic that wants Step-0's boundary number
to settle, and it is flagged, not hidden.

### 1.4 Shaping the state so a future brain observable is ADDITIVE (DIS-2)

DIS-2 ruled body+policy for v1 with **the door left open**: v1 adds no
observable and no registry bump, but the state must be shaped so a FUTURE
brain-visible disease is an additive `NEURO_REGISTRY_VERSION` bump + retrain,
not a rewrite. Two consequences bind the shapes above:

- The per-actor state is keyed and self-describing (Maps by `id`), so a future
  observable like `self.infected.count` or `cit.sick.dist.px` reads it without
  re-shaping it — the same move ADR-2 §3 makes for the 2-D position field
  sized ahead of the 1-D ship.
- v1 writes **no** entry into `NEURO_OBSERVABLES` and does **not** move
  `NEURO_REGISTRY_VERSION`. Any observability disease has in v1 is to POLICY
  (the sim reads infection directly, e.g. a hire gate) and to the PLAYER (Step
  3's surfaces), never to a trained decider. `policyProblem` continues to refuse
  a stale artifact on its existing terms (ADR-7 §8); disease does not touch that
  surface.

## 2. THE SETTLEMENT DISEASE STAGE — ONE STAGE, ONE CLOSED STREAM

Disease resolves in **one settlement stage** per arena per day, consuming the
arena's closed RNG stream and hashing into that arena's day fingerprint like
every other stage (§1½; ADR-3 §3, §9). This section pins the stage's placement,
its RNG discipline, and its five sub-stages **in draw order** — because a
fingerprint is only reproducible if the draw order is fixed, and reasoning about
an illness roll from code (rather than a receipt) got the wrong answer twice on
this tree already (the `shiftill.mjs` precedent, `game.js:25731`).

### 2.1 Placement and the RNG stream

**Placement.** In ADR-3 §3's four-phase day, the disease stage runs in phase 2
(THE DAY / settlement resolution), post-order over the arena tree, before phase
4 (MIDNIGHT) computes the fingerprint. It is the CS4 generalization of the 3.5
"2.5 epidemiology" block (`game.js:25707`), which runs in the nightly settlement
after wage/rent/hours/wage policy and before the walk-out stage (`game.js:25805`).
The disease stage keeps that relative position: it reads the day's contacts
(who stood where, with whom) and writes the day's onsets and outcomes.

**The stream.** Each arena draws from its OWN derived stream, seeded from
`(worldSeed, arenaId, dayIndex)` (ADR-3 §3), never a shared cursor — this is
what lets two arenas run in two workers and agree (ADR-7 §5), and what makes a
seed name a WORLD, not a town (ADR-7 §7). Concretely the stream is the tree's
`srand()` tap (`game.js:8919`; mulberry32, one i32 of state, `game.js:8928`),
per-arena-seeded. Every roll below is one `srand()` draw. Endemic ignition
chance and the seasonality hook are the exception: `endemic.ignitionChance` is a
ROLL (it consumes a draw), but any almanac-style seasonal MODULATION of it must
be a stream-free `_almHash`-style day-hash (`game.js:8919`, the `_almHash`
field idiom, ADR-3 §10.1) so a seasonality channel forks no randomness. v1
ships `endemic.seasonality` reserved and ignored (§1½).

**Draw-order determinism.** Every loop over actors and over maladies iterates in
a canonical order fixed independently of position or infection arrival:

> **Actors iterate in stable actor-id order; maladies iterate in stable `id`
> order.** Never in pool-slot order (slots are reused), never in "sick first"
> order (3.5's `sickNow` snapshot, `game.js:25710`, is a within-day read
> convenience, not a draw order), never in position order (position is mutable —
> ADR-2 §4 / ADR-3 §9 make this the same law the fingerprint's child order
> obeys).

This is the single most load-bearing determinism rule in the stage: the same
world on the same day must draw the same rolls in the same order on every
backend and every replay, or the golden fingerprint is worthless.

**The 3.5 stage's draw order, verbatim, is the shape to generalize.** The live
"2.5 epidemiology" block spends exactly three `srand()` draws per crab-night, in
this fixed order inside one `allCrabs()` loop: **infection roll**
(`game.js:25742`, `srand() < Math.min(0.5, risk)`) → **cure roll**
(`game.js:25774`) → **death roll** (`game.js:25784`, only when the ladder has
armed). Sleep-debt tick (`game.js:25717`) and rest reset (`game.js:25803`) spend
none. The CS4 stage keeps this relative order (ignite → expose → advance →
cure → die, §2.2–§2.4) and its per-record budget (§2.4), widened from "one
implicit disease" to "each malady record in `id` order". `srand()` is the single
closed tap (`game.js:8919`; mulberry32 over one module-scope i32 `_rs`,
`game.js:8933`/`:8946`), per-arena-seeded — `_kernRng` mirrors the same one cell
into wasm so both backends walk one sequence (`game.js:8930`). A disease
sub-stage that must NOT fork randomness reads `_almHash` instead (§2.1 above; the
surf-wipeout idiom `_almHash(day*977 + si*31 + wave, _almanacSeed) % 100`,
`game.js:6989`, is the canonical per-day-per-agent stream-free roll).

### 2.2 Sub-stage A — ENDEMIC IGNITION (home-culture towns only)

For each arena, for each malady `M` endemic to this arena's culture (the arena's
founding/majority `culture` matches `M`'s authoring culture — a crab uses
`c.p.culture`, native crabs default to `"crab"`/CRABCIV, `game.js:1286`), in
stable `id` order:

- If `M` is dormant in this arena (no `outbreaks[M]` record) and not disabled
  (§7), roll one draw against `M.endemic.ignitionChance` (thousandths, §3.1). On
  success, seed ONE index case: pick the ignition target by the canonical
  actor-id order among susceptibles (not a second random draw — the ignition
  draw is the only one this sub-stage spends per malady), set its `infections[M]`
  to `{ stage: "incubating", day: 0, fromDebt: false }` (or directly
  `symptomatic` if `incubationDays == 0`), and set `outbreaks[M]` active with
  `igniteDay = day`.
- **Culturally SEEDED** (plan pillar 3): ignition rolls ONLY in home-culture
  towns. Everywhere else `M` arrives only by contact (sub-stage B) or the
  mailbag (a visitor / boat / hotel guest carrying an active record — ADR-3 §4,
  §6). No ignition draw is spent for a non-home malady, so a town with no
  endemic malady spends zero ignition draws (the zero-draw discipline, §8).

### 2.3 Sub-stage B — EXPOSURE (the contact roll)

This generalizes 3.5's fixed `+0.08`-per-sick-neighbour contagion term
(`game.js:25723-25726`) to a per-channel weighted transmission over ADR-2's
true-2-D adjacency (CS4-35 `true_two_d`). For each SUSCEPTIBLE `(actor k,
malady M)` in canonical order (k has no `infections[M]` and no live
`immunity[M]`), where `M` has at least one CONTAGIOUS carrier present in the
arena today:

1. Compute k's **per-channel contact count** with contagious carriers of `M`.
   A carrier is contagious if symptomatic, OR incubating with
   `contagiousInIncubation` honored (DIS-1: bool = off/full, int sixteenths =
   partial — §3.3). Channels are the four the schema declares —
   `work / dwelling / street / venue` — each a euclidean-radius adjacency
   predicate over the arena (ADR-2 §2: `Math.abs(x−x)` predicates become radii;
   3.5's `coworkers` = same `workBiz` and `shelterMates` = both homeless are the
   `work` and `dwelling` channels' 1-D ancestors, `game.js:25724-25725`). A
   channel with no declared weight contributes nothing (silent, §1½).
2. Compute the **per-contact exposure probability** from `M.transmit`
   (§3.2), scaled by k's **susceptibility** (§2.5), and take one draw for k
   against the combined probability. On success k acquires
   `infections[M] = { stage: incubationDays>0 ? "incubating" : "symptomatic",
   day: 0, fromDebt: debtRisk(k) > 0 }`, and if this is the arena's first live
   case of `M`, `outbreaks[M]` goes active.

**One draw per susceptible (k, M) pair with ≥1 contagious carrier present.** No
carrier of `M` present ⇒ no draw for `(k, M)` ⇒ zero draws (§8). This is the
rollLog seam's denominator (`game.js:25735`): every at-risk (crab-night, malady)
with who they were, what channels they touched, and the probability the roll
read — off unless a rig arms it, consuming no RNG, so a build with it on is
behaviour-identical (the shiftill discipline, generalized to per-malady).

### 2.4 Sub-stages C & D — INCUBATION ADVANCE, then COURSE + OUTCOME

Two passes over actors in canonical order, each malady record in `id` order:

- **C — incubation advance.** For each `incubating` record, increment `day`.
  When `day >= M.incubationDays`, transition to `symptomatic` (reset `day = 0`),
  turn the effect set on (§3.5), and — the fog lifts — the record becomes
  visible to every Step-3 surface (§9). No RNG draw; incubation is a counter.
  While incubating the record is INVISIBLE to all surfaces regardless of
  `contagiousInIncubation` (DIS-1: the knob changes transmission, never
  visibility).
- **D — course + outcome** (the 3.5 death-arming idiom, `game.js:25766-25802`,
  generalized per malady). For each `symptomatic` record, increment `day`, then:
  1. Roll one **cure** draw against the row's care-lane cure multiplier on `M`
     (`M.care[lane].cureMul`, §3.4; lane from `careLane(k)`, `game.js:4821`). On
     success clear `infections[M]` and, per `M.immunity` (§4), write
     `immunity[M]`. Recovery ⇒ IMMUNE (mode/duration per row) or, for
     `immunity.mode = none`, straight back to susceptible.
  2. Else, if `day >= deathArmsAt(lane)` on `M`'s ladder, roll one **die** draw
     against `M.care[lane].dieMul` plus the day-ramp (the `+0.12·max(0, day−4)`
     shape, `game.js:25785`, generalized so the row's ladder is authored, not
     global). On success the actor dies (`killCrab`, `game.js:25788`) — lethality
     × care lane, the arming idiom.
  3. Else if `day >= deathArmsAt(lane) − 1`, arm the "gravely ill" one-day
     warning (`game.js:25789`) — the player's whole day to act. No draw.

**Draw budget per symptomatic record per day: one cure draw, and at most one die
draw** (only when the ladder has armed). This fixed budget is what §9's
zero-draw and determinism pins assert against.

### 2.5 Susceptibility — where 3.5's neglect illness survives (a flagged mechanic)

3.5's `illRisk(k)` (`game.js:6131`) is a per-actor neglect roll: hunger/thirst/
dirt/tired over 0.95, plus sleep-debt (`debtRisk`), each adding risk. In 3.5
this term does two jobs at once — it MODULATES contagion (added to the +0.08
neighbour term) AND it SELF-ignites illness with no carrier present (the `why`
buckets, `game.js:25753-25758`, attribute an onset to hunger/thirst/dirt/
exhaustion, and only to "contagion" when neglect explains nothing).

The kernel keeps the modulation and flags the self-ignition:

- **MODULATION (kept, unambiguous).** `susceptibility(k)` is a per-actor scalar
  ≥ 1 derived from the five verbatim need planes and sleep-debt (the illRisk
  terms), and it MULTIPLIES the per-contact exposure probability in sub-stage B.
  "Neglect breeds illness" becomes "neglect makes what is going around catch."
  This needs no schema field and no observable — it reads the planes the kernel
  already holds.
- **SELF-IGNITION (the flagged fork).** Whether neglect alone, with no carrier
  and no endemic roll, may START a case is the one degenerate-fidelity question
  Step 2 cannot settle from the spec: the schema's ignition sources are endemic
  + contact only, and a per-actor neglect self-ignition is a THIRD source not in
  §1½. **Proposed resolution:** the crab culture's degenerate row carries the
  neglect self-ignition as a bounded per-actor endemic-style roll (susceptibility
  above a floor rolls a self-onset), so 3.5's neglect deaths reproduce, and NO
  other row gets it (a row that wants neglect-onset must declare it). This keeps
  the degenerate case faithful without making neglect a universal disease source.
  **It wants Step 0's boundary number to confirm the floor and rate before a
  golden day fixes it** (§9); if measurement shows the endemic roll alone
  reproduces 3.5's illness curve without a neglect-onset term, the term drops.
  Flagged here, not hidden — a silent choice here is a wrong golden forever
  (ADR-7 §2).

## 3. THE ARITHMETIC — INTEGER GRIDS, WIDENED ACCUMULATORS, NO `>>`

All grids are integer and chosen at design time in §1½, so the kernel binds them
without a re-baseline (§1½ "Determinism"). The kernel's job is to compose them on
a fingerprint-bearing path without stepping on the Q-format traps ADR-2 §7.1/§7.2
records — a silent mean drop that still produces plausible numbers is the worst
bug shape available here.

### 3.1 The grids (from §1½)

| quantity | grid | range | ×1 point |
|---|---|---|---|
| `transmit.perContactRisk`, `endemic.ignitionChance` | thousandths | 0..1000 | — (a probability) |
| `transmit.channels[c]`, `contagiousInIncubation` (int form) | sixteenths | 0..16 | 16 |
| `effects.needRateMul[n]` | twentieths | 0..160 | 20 |
| `effects.speedMul`, `effects.workMul` | twentieths | 0..80 | 20 |
| `care[lane].cureMul`, `care[lane].dieMul` | twentieths | 0..80 | 20 |

### 3.2 The exposure probability (sub-stage B)

Per-contact base risk is `perContactRisk` (thousandths). A single contact on
channel `c` weights it by `channels[c]/16`. `n_c` contacts on channel `c`
compose as independent Bernoulli trials — the survival form avoids summing past
1.0:

```
P(exposed | k, M) = 1 − Π over channels c [ (1 − perContactRisk/1000 · channels[c]/16) ^ n_c ]
                    then scaled by susceptibility(k), clamped to [0, EXPOSURE_CAP]
```

- **Compute in doubles with floored/exact division, never `>>`** (ADR-2 §7.1
  TRAP 1). `perContactRisk/1000` and `channels[c]/16` are exact-enough rationals;
  form the per-contact survival `(1 − p_c)` as a double, raise to the integer
  `n_c` by repeated multiply (small counts), take the product across the ≤4
  channels, subtract from 1. No `>>16` product appears on this path, so the
  8×-mean-drop trap cannot fire here.
- **`EXPOSURE_CAP` is a kernel constant** (the 3.5 `Math.min(0.5, risk)` cap,
  `game.js:25742`, generalized), declared beside the hash, measured against Step
  0. Provisional 0.5; **the number is Step 0's to fix.**
- Because the composition is a product of independent trials in a fixed channel
  order, it is order-independent across contacts of the SAME pair — but the loop
  still visits `(k, M)` pairs in canonical order (§2.1) so the STREAM draws in a
  fixed order.

### 3.3 `contagiousInIncubation` (DIS-1)

A carrier that is incubating contributes to a susceptible's contact counts only
if `M.contagiousInIncubation` is truthy. **bool `true`** = full symptomatic
channel weights apply while incubating; **bool `false`/absent** = incubating
carriers are non-contagious. **int sixteenths `w`** = the incubating carrier's
channel weights are scaled by `w/16` (partial pre-symptomatic transmission). The
knob changes only the `n_c` a susceptible accrues; it never changes visibility
(§2.4).

### 3.4 Care lanes generalized per malady (the death-arming idiom)

3.5's `CARE_LANES` (`game.js:4795`) is a global table of `{cure, die}` per lane
(neglect/cared/cot/bed/spent). CS4 keeps the LANE SELECTION function
`careLane(k)` (`game.js:4821`) verbatim — same housing/needs/rest/debt reads —
but the `{cure, die}` PAIR becomes per-malady: `M.care[lane]` in twentieths
(20 = ×1). The debt lane bar (`CARE_LANES.spent`, `game.js:4813`; `debtSick`,
`game.js:4820`) still routes a `fromDebt` record into the `spent` lane on `M`'s
own ladder, so a debt-caused case is barred from rest lanes whatever else is
right about its care — the mechanic Matt ruled (kd-h28QBb1lvO), now per malady.
`deathArmsAt(lane)` (the day the die roll arms; `game.js:4777`, `:25784`) is read
from `M`'s ladder so an authored row sets its own arming clock (the crab
degenerate row reproduces 3.5's day-4-neglect / day-7-cared arming).

### 3.5 Effect composition and the co-infection clamp (DIS-6)

While a record is `symptomatic`, its effect set modifies the actor:
`needRateMul[n]` scales the per-plane need drain (n ∈ the five verbatim planes),
`speedMul` scales movement, `workMul` scales wage/work output (`workMul: 0`
reproduces the 3.5 "sick day pays nothing" money spiral, §1½). Under DIS-6
(co-infection stacking) an actor may hold several symptomatic records at once;
their effects **compose, then the PRODUCT is clamped** — the clamp is the barrier
(§5). Composition is in stable `id` order so the product is independent of
infection ARRIVAL order (a fingerprint requirement, §5).

## 4. IMMUNITY MEMORY (DIS-3)

`immunity.mode` ∈ {`none`, `course`, `permanent`} is the WHOLE bound (DIS-3 —
three modes, nothing else). On recovery (sub-stage D cure):

- **`none`** — write nothing; the actor returns to susceptible immediately
  (re-exposure the next day is a fresh roll). No `immunity[M]` record.
- **`course`** — immunity lasts only while sick; since recovery ends the course,
  `course` behaves as `none` at the recovery boundary EXCEPT that it suppresses a
  same-day re-exposure of the record just cleared (a within-day guard, not a
  memory). Written as an `immunity[M]` record with `untilDay = day` (expires at
  next midnight).
- **`permanent`** — write `immunity[M] = { mode: "permanent", untilDay:
  durationDays ? day + durationDays : null }`. `null` = lifetime; a declared
  `durationDays` is a **hard expiry** — a single day comparison at exposure time
  (`day >= untilDay` ⇒ immunity lapsed, susceptible again), **never a decay curve
  or per-day erosion roll** (DIS-3 explicit). No draw is spent on immunity expiry;
  it is a comparison.

**Immunity is EARNED over played time, never granted at world-gen** (DIS-5): a
crab is born with an empty `immunity` map. A culture's own people become largely
immune to their endemic malady only by surviving it across played days — which
is exactly why every visitor is tinder and the cross-culture danger asymmetry
falls out of `immunity` + `endemic` dynamics with no `crossCulture` knob (DIS-5;
§1½). The kernel writes no born-immune shortcut.

## 5. CO-INFECTION (DIS-6) — A SET, COMPOSED IN `id` ORDER, CLAMPED

DIS-6 ruled co-infection ALLOWED (stacking under clamps). The kernel obeys four
clauses, each a fingerprint-relevant rule:

1. **Per-actor state is a SET of `(crab, malady)` records** (§1.1) — several may
   be active at once.
2. **Effects compose, then the PRODUCT is clamped** (§3.5). The compose is the
   stack; the clamp is the barrier that keeps two graves from multiplying into an
   un-survivable product the schema's per-row clamps never authorized. The
   clamped quantities are the effect multipliers (need-rate, speed, work) and the
   per-day hazard.
3. **Each malady runs its OWN course and lethality** independently (sub-stage D
   iterates records, not actors-as-a-whole): a crab may recover from A while B is
   still arming.
4. **Re-exposure while already sick is NOT a no-op** — a susceptible `(k, M)`
   with `infections[M]` absent still rolls for `M` even if `infections[A]` is
   present; only an existing `infections[M]` record suppresses a fresh `M` roll.
5. **Compose in stable `id` order** so the composed effect and the fingerprint
   are independent of the order infections ARRIVED (ADR-3 §9's child-order law,
   applied to a per-actor record set). This is why §2.1 fixes malady iteration
   to `id` order everywhere.

## 6. THE FINGERPRINT FOLD (ADR-3 §9 / ADR-2 §4 / ADR-7 §3)

Disease state folds into the recursive day fingerprint like every other stage.
ADR-3 §9: `fp(arena) = H(arena.localState, fp(child_0), …, fp(child_n−1))`,
children ordered by stable arena id, post-order. Disease contributes to
`arena.localState` two things, hashed in a fixed order after the arena's existing
local state and before its children:

1. **The per-arena outbreak overlay** (`arena.outbreaks`), hashed as a sequence
   of `(maladyId, state, quietDays, igniteDay)` tuples in stable `id` order.
2. **The per-actor infection + immunity records** of the actors resident in this
   arena, hashed with each actor (actors already hash into their arena's local
   state; disease adds each actor's `infections` and `immunity` maps, each
   serialized as tuples in stable malady-`id` order).

**Two disciplines make the fold replay-safe:**
- **Stable `id` order, never insertion or position order** (§2.1, §5.5) — a hash
  keyed on a mutable order is a replay bug that only appears when two records
  swap places (ADR-3 §9, verbatim reasoning).
- **Absence hashes as absence.** A susceptible actor contributes an empty
  `infections` map; a dormant malady contributes no `outbreaks` tuple. A world
  with no `maladies` section, or with every row refused (§8), folds
  byte-identically to the pre-disease engine (§1½ "Absence… byte-identical to
  none"; the no-key control, §9). This is the property that lets the
  degenerate-off case gate green against the current golden.

Because the fingerprint is a TREE, a disease divergence localizes to
`(day, arena)` for free (ADR-7 §3): a golden day that moves tells the reviewer
which town's outbreak drifted without reading a diff.

### 6.1 Against the 3.5 tree, the fingerprint is FLAT — disease is observed through the economy, not a disease digest

The recursive fold above is ADR-3 §9's design for the CS4 tree. **The 3.5 tree —
the only tree that exists to run a Step-0 spike or the degenerate-equivalence
scenario against — does not have a recursive tree hash.** Its "day fingerprint"
is a FLAT, fixed-order capture: named scalars (`day, tmin, coins, rep, catch,
serves, crabServes, rage, till`) plus one `[name, wallet]` and one `[x, y]` row
per crab in `allCrabs()` order, compared by string equality (`tools/suite.mjs`
~2661, the frozen-day-2 fingerprint scenario). There is **no rolling digest to
append a disease field to**, and the FNV-1a "receipt hash" that does exist
(`game.js:8968` `cursorFromEnvelope`, `tools/neuro/infer.mjs`) is a cursor/spot
digest, not the day fingerprint.

The consequence is a genuine, load-bearing property, not a caveat: **against the
3.5 tree the disease stage is observable ONLY insofar as it moves a captured
field.** A symptomatic crab whose `workMul: 0` earns nothing moves a `wallet` and
a `till`; a death shrinks the crab roster and moves every downstream position and
wage row; a `speedMul` moves a `[x, y]`. This is exactly why:

- **The degenerate-equivalence scenario (§9 scenario 5) is measured through the
  flat capture** — the crab degenerate row's illness must reproduce 3.5's
  `wallets`/roster/position trajectory, because that IS the fingerprint. There is
  no disease-specific hash to compare; the equivalence is economic.
- **The no-key byte-identity control (§9 scenario 2) is trivially true on the 3.5
  tree in a different way** than on the CS4 tree: `--nomalady` on the 3.5 tree
  must reproduce the CURRENT frozen fingerprints byte-for-byte, because a
  disease-off build touches none of the captured fields beyond what 3.5's own
  `k.p.sick` already does. Any drift there is a plumbing bug in the hatch, caught
  before a single dose is armed (kd-1XqylH3kmJ zero-dose twin).

So the recursive fold (§6) is the spec the CS4 implementer builds; the flat
capture (§6.1) is the instrument the Step-0 spike and every 3.5-tree receipt
actually reads. Both are stated so neither the implementer nor the spike author
reasons about the wrong one — a confident claim about a recursive hash on a tree
that has a flat one is precisely the stale-checkout error (kd-iApZXvHuHl) this
subsection exists to prevent.

## 7. THE ARM-OFF HATCHES — ATTRIBUTION IS A REQUIREMENT (ADR-7 §9)

"A mechanism that cannot be switched off cannot be attributed" (ADR-7 §9;
kd-JwPxQ7pSwn). The kernel ships two levels of hatch, wired as the tree's
existing `window._no*` flags are (harness sets the flag from a `--no…` CLI arg;
game code guards on it; the guarded path consumes ZERO RNG so an armed-off build
is behaviour-identical to one without — the pattern at `game.js:4818-4820`,
`:25747`):

- **`--nomalady` / `window._noMalady`** — the WHOLE disease stage is skipped:
  no ignition, no exposure, no course, no outcome, no fold contribution. The
  arena's disease local state stays empty and hashes as absence (§6), so
  `--nomalady` is exactly the no-key control (§9) and the zero-dose twin the
  calibration doctrine demands (kd-1XqylH3kmJ). Reach for it to price the whole
  mechanic against a world without it.
- **Per-row disable** — a single malady `id` suppressed (ignition rolls skipped,
  the row treated as if authored `perContactRisk: 0` with no endemic roll), so a
  dose ladder can arm one row at a time and a matrix can attribute a delta to ONE
  malady. Wired as `window._noMaladyRow` (a set of ids) or the harness's per-arm
  row filter; the guarded skip consumes zero draws for that row.

**The narrow-hatch discipline** (ADR-7 §9; CLAUDE.md suite discipline): reach for
the per-row disable, not `--nomalady`, when the question is "what did THIS
malady do" — `--nomalady` moves every row at once and cannot attribute a single
one. And **a probe arm needs a zero-dose twin** (kd-1XqylH3kmJ): the same world,
disease armed off, is the control every attack-rate / effective-R receipt reads
against, because a 2–3% onset event that reads as 100% of a pillar is exactly the
moment plumbing and effect are indistinguishable.

## 8. THE VALIDATED DOOR — REFUSED AT IMPORT, ZERO DRAWS AT RUNTIME (§1½)

Step 1's `maladiesProblem` posture is binding and the kernel adds nothing to it:
a row that fails any clamp is refused at import with its NAMED message, the
bundled row stands in its place (WAD fall-through), and **the kernel never sees a
malformed row** — it reads only validated rows. Two runtime obligations the
kernel owes:

- **Absence and refusal consume ZERO draws** (§1½ draw-count pin, extended per
  §6). No `maladies` section ⇒ the disease stage runs no rolls and folds as
  absence. A section where every row is refused ⇒ same. A section with N valid
  rows ⇒ exactly the draws §2 budgets for those N rows and no more.
- **No validation at first draw.** Every clamp is an import-time check; the
  kernel binds already-clamped integers and never re-checks them mid-roll (§1½).
  A NaN or negative day count cannot reach the kernel because the door refused it.

## 9. THE PRE-DECLARED BATTERY — DECLARED BEFORE THE GOLDEN DAY IT GATES

ADR-7 §1: *the battery is declared before the run it judges — a battery chosen
after seeing a result is a description, not a gate.* This is the half of Step 2's
CS4-46 delivery that lands NOW, before any CS4-tree run exists (§0). The disease
kernel's conformance family, declared here, extends the substrate's validation
story (§1½ / substrate §5) and the golden-fingerprint discipline (ADR-7 §2). It
runs on the CLUSTER (`node tools/kube.mjs run experiments/suite-4NN.json --ref
<pushed-SHA> --wait`) when the CS4 tree implements the kernel; against the 3.5
tree it names the equivalence and instrumentation scenarios the Step-0 spike and
the degenerate-row work measure.

**The conformance scenarios (each a named suite entry, one file, name-hashed to a
shard — ADR-7 §6):**

1. **Determinism.** A world with an active malady, run from a fixed
   `(worldSeed, day)` twice ⇒ **identical day fingerprints** (§2.1 draw order;
   §6 fold). The primary golden-day guard.
2. **No-key byte-identity control.** A world with no `maladies` section folds
   **byte-identical** to the pre-disease engine's fingerprint (§6 absence rule).
   The `--nomalady` arm on a world WITH maladies must produce the same
   fingerprint as deleting the section (the zero-dose twin = the no-key control).
3. **Zero-draw pin.** A disabled row (per-row disable, §7), a refused row (§8),
   and an absent section each consume **zero** RNG draws — asserted by the
   draw-count pin (the stream cursor is unmoved across the stage). A world with N
   active rows consumes exactly §2's budget.
4. **Each clamp's named refusal.** Every §1½ clamp fed an out-of-range value
   asserts its NAMED `maladiesProblem` message at import (the conformance family,
   substrate §5.1) — these are Step-1 door scenarios the kernel inherits, listed
   here so the battery is complete.
5. **Degenerate-case equivalence.** The crab culture's generic 3.5 illness,
   authored as the first row (`incubationDays: 0`, one lane, the classic ladder),
   reproduces 3.5's illness curve within the matrix's bands (Step 4 authors and
   measures; the golden day records the equivalence). If §2.5's neglect
   self-ignition term is in, this scenario is where it is proven necessary or
   dropped.
6. **The calibration receipts (measured, never reasoned — ADR-7 §9 / §1½).**
   Every authored malady ships, before it lands, an **effective-R + attack-rate**
   receipt from a cluster matrix over a **dose ladder with a zero-dose twin**
   (kd-1XqylH3kmJ), 16+ growth seeds as **WORLDS not towns** (ADR-7 §7 / §13.1 —
   disease is world-scoped the moment it rides shared travel), rollLog-style
   denominators (§2.3). Step 0's boundary receipt (kd-Fk56084qHe) is the first;
   it fixes the provisional constants this spec declares (`OUTBREAK_QUIET_K`,
   `EXPOSURE_CAP`, the susceptibility floor).
7. **The arm-off attribution matrix.** `--nomalady` and per-row disable each
   produce a clean delta against the zero-dose twin — the narrow hatch (§7)
   attributes a single row; `--nomalady` prices the whole mechanic.

**What the golden day is, and who records it.** A golden day is RECORDED FROM A
REVIEWED RUN (ADR-7 §2) — a receipt under `design/cs35-research/kube-runs/`, not
a memory — and under CS4-46 the reviewer is Fable-class. **This spec does not
record a golden day**: there is no CS4 tree to run the kernel against, and a
golden recorded off the 3.5 tree's implicit illness would bless the wrong thing.
The golden day is the CS4-tree implementer's first act, gated by THIS battery.
The battery-declared half of the reviewer-is-the-gate expiry condition (ADR-7
§13.2) is, for the disease kernel, satisfied by this section.

## 10. WHAT THIS SPEC DOES NOT DECIDE

- **The presentation surfaces** — dossier HEALTH row, follow-card tag, town
  outbreak banner, dock travel advisory, the symptom animation kit — are Step 3
  (kd-D3ITVE3Re8). This spec defines the READ INTERFACE they consume (§9
  read-interface below) and the "incubating shows clean on every surface"
  invariant (§2.4); it draws nothing.
- **The authored rows** — the crab NUISANCE row, a guest GRAVE row, the DIRE row
  — are Steps 4 and 5. This spec makes the door bite; it authors no disease.
- **The calibration NUMBERS** — ignition chances, per-contact risks, the
  provisional constants (§1.2, §2.3, §3.2, §2.5) — are measured on the cluster
  against Step 0's receipt and the Step 4/5 matrices, never fixed here.
- **The mailbag transport of an active infection between towns** (a visitor /
  boat / hotel guest carrying a record) is ADR-3 §4/§6 machinery; this spec
  states that an arriving actor's `infections`/`immunity` maps ride the envelope
  (they are per-actor local state, which `full_person` already carries) and are
  applied at DAWN/INTAKE, but the envelope's byte layout is ADR-2/ADR-3's.
- **Brain-visible disease** (an added observable + registry bump + retrain) is
  the deferred DIS-2 fork, kept OPEN by §1.4's additive state shape, not built.

---

### §9 read-interface — what Step 3 reads (stated so Step 3 need not reverse-engineer it)

The presentation kit (Step 3) reads, and never writes, three kernel queries.
Each honors the incubation fog (an incubating record is invisible):

- **`actorMaladies(k) → [maladyId…]`** — the SYMPTOMATIC malady ids on actor k,
  in stable `id` order (empty while only incubating or susceptible). Drives the
  dossier HEALTH row and the follow-card tag. Names come from the row's `name`
  (every surface prints it, §1½), through `fitSmall` budgets.
- **`townOutbreaks(arena) → [maladyId…]`** — the ACTIVE (and one-cycle
  burned-out) malady ids in the arena, in `id` order. Drives the town outbreak
  banner.
- **`advisory(fromArena, toArena) → [maladyId…]`** — the active outbreaks a
  traveller would sail INTO, read at the dock before departure. Drives the travel
  advisory — the surface that makes "cultures you'd want to avoid" a real,
  informed decision (Step 5's avoid-loop). This is a lookup of the destination
  arena's outbreak overlay, dated by the mailbag/knowledge rung (ADR-3 §10) —
  Step 3 owns how stale the advisory is; the kernel owns the current-arena truth
  it reads.

The animation kit (`art`) is rendered by the PPU through the art program's
pipeline (kd-N3BfrR2km7) and **never moves a fingerprint** — render is the view
(§1½; ADR-2 §2). The kernel emits the symptomatic event; JS/PPU renders the pose,
tint, particle and quipset, the event-ring pattern the registry already uses.

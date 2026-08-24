# PHASE E5 CLOSE-OUT — families 3-5 machinery, and the proof that inverts

**Slice**: phase E rung E5 (bead kd-JLuZGtClFY; plan cs35-phase-e-plan.md §5's
slice ladder, substrate cs35-cultureway-substrate.md §3 families 3-5). Three
families of Layer-1 rule — **urgency ramp** (host-capped), **taste-drift**, and
**acceptance** — shipped as MACHINERY WITH NO CONTENT. **Contract**: byte-
neutral machinery + a data-must-bite scenario each. Commits: `4e18a12` (code),
`98d73c1` (stamp), rebased onto main `aad4d7a` (the departure-card condition
readout) and re-gated on that tree — a verdict belongs to one tree. Gated
in-pod (cluster compute; the local Mac ban does not apply to a fleet pod).

## What makes this slice different — the proof is INVERTED

E1/E2/E3/E4/E6 transcribed EXISTING content and proved BYTE-EQUALITY against a
lambda. E5 ships machinery nothing declares yet, so there is no lambda to equal.
The bar is therefore **absolute byte-neutrality** (a moved fingerprint is a BUG,
not a re-harvest) and the proof is inverted: each family hands the engine a
declared curve IN A SCENARIO, shows it moves a band, then shows the machinery is
INERT — a curve that "bites" with the mechanism ripped out would be worthless.
Every scenario is proven load-bearing by arming a defect (below).

Ruling 5 (cs35-rulings-2026-08-24 §5) binds the scenarios directly: assert a
declared option CAN be exercised and is refused when malformed; NEVER that every
option IS exercised. E5 is exactly the slice where the wrong bar would force
content this phase deliberately does not ship.

## Family 3 — URGENCY RAMP, host-capped, attaching to a registered errand

`civicUrge` (game.js) generalized: the vote need-curve capped BELOW DIRE so
nobody rides it off a shift. A culture declares, per REGISTERED errand
(`appeal.urge = [{ errand, cap, prog }]`), a Layer-1 curve over `URGE_BUNDLE`
(`base`, `tmin` — civicUrge's inputs). Wired into `needLevel` behind a per-
culture guard: a crab-native crab short-circuits to the raw need (the
tasteW/idleLines seam), so a crab/pig/gull town is byte-identical.

**The cap is HOST-SIDE, not trusted to the expression** (substrate §3's exact
requirement). `HOST_URGE_CAP = DIRE - 1`:
- a declared `cap > HOST_URGE_CAP` is refused BY NAME at import
  ("RAMP <id> CAP AT/ABOVE SURVIVAL");
- the errand must be in the ERRANDS registry ("A RAMP ON AN UNREGISTERED
  ERRAND"); two ramps on one need is ambiguous data, refused;
- at RUNTIME the program output is clamped to `[0, min(cap, HOST_URGE_CAP)]` —
  a hostile program returning 2e9 lands at the ceiling, provably below DIRE,
  whatever it computes. The ramp can only RAISE urgency (`max(base, capped)`),
  never suppress a real need.

needLevel is a PURE read (civicUrge and l1Run take no draws and fire no hooks),
so value-equality IS behavioural equality — the E3 "a second path skipped a side
effect" trap does not apply, and the code says so.

## Families 4 & 5 — TASTE-DRIFT and ACCEPTANCE, written to data planes

The phase-D `settlementAggregate` hook was built as "the row an acceptance meter
or exposure-drift rule reads." E5 is where the phase-D contract's deferred
mutation verb arrives "with Layer-1's fuel-counted bytecode": the hook now RUNS
a validated program and WRITES a bounded data plane.

- **Family 4** (`appeal.drift = [{ recipe, floor, cap, prog }]`): `weight' =
  f(prev, exposures)` — the Victoria-3 mechanic as one update rule. Written to
  `TASTE_DRIFT[culture][recipe]` (milli-weight); `tasteW` reads it, else the
  declared base. Host band `DRIFT_MIN=100..DRIFT_MAX=5000` (= 0.1x..5.0x, the
  appeal.tastes range), output clamped to the declared `[floor, cap]` then the
  host band.
- **Family 5** (`accept = [{ pair, base, cap, prog }]`, top-level): the CK3
  town-level meter per culture pair, written to `ACCEPT[culture][pair]`, read by
  `acceptOf`. No live consumer this phase (ruling 5). Host band `0..ACCEPT_MAX=
  1000`.

Both run over `SETTLE_BUNDLE` (`prev`, `buys`, `days`, `nights`, `delight`,
`purse`, `left`). The exposures are CLAMPED to the bundle's declared ranges
before the program runs (the departReads/platReads discipline), so the
validator's static 2^52 magnitude bound is an honest guarantee, not an
assumption about how long or rich a real stay can be.

**One guarded hook, registered in `rebuildBrains` iff some built culture
declares a drift or accept rule.** With none declared — the shipped bundle:
crab, pig and gull all declare nothing — no hook is registered,
`HOOKS.settlementAggregate.length` stays 0, the fire-site length-guard skips,
and nothing allocates. The fire SITES are untouched, so the E3 dual-path trap
(both sites must fire) stays the fire site's problem — both already fire (the
existing hooks scenario proves it) and `e5Settle` rides both via `fireHooks`.
The planes reset on load (loader-reset, like BRAINS/CRABD); they are NOT
serialized — a save-format key with no consumer is non-byte-neutral surface,
deferred to a content phase (noted, not overlooked).

## Scenarios (suite +4; experiments/e5-focus.json the mutation instrument)

1. **E5 urgency ramp** — a declared ramp lifts needLevel's band (0.1 -> 0.7); a
   hostile program clamps to the declared cap and, at the ceiling, below DIRE;
   cap-at-survival / unregistered-errand / bad-program / two-ramps-one-need
   refused by name; inert once undeclared.
2. **E5 taste-drift** — a declared rule drifts the plane over lived stays
   (through the REAL visQuote fire path) and tasteW follows; overshoot clamps to
   the declared cap; refusals by name; inert (no hook, empty plane) once gone.
3. **E5 acceptance** — a declared rule moves the meter per pair; overshoot
   clamps; refusals by name; inert once gone.
4. **E5 byte-neutral** — the shipped bundle declares NONE of the three, so no
   hook is registered and both planes are empty on a fresh town. If a bundled
   culture ever declares one, this red is the reminder to re-gate on purpose.

## Prove-by-breaking (each family is load-bearing, not vacuous)

Armed one defect at a time in-pod, watched it go red naming the right thing,
reverted:
- **Family 3** — ramp lookup forced null in needLevel → "the ramp did not move
  the band: 104858 want 734003".
- **Family 4** — the plane write made a no-op → "the drift did not write the
  plane: undefined want 1300" (the scenario reads the plane defensively so a
  ripped write reds cleanly, not by TypeError — instrument fixed before read).
- **Family 5** — the plane write made a no-op → "the accept rule did not move
  the meter: null want 4".

## Gates

- **Full suite, main realm, committed tree 98d73c1** (rebased onto aad4d7a):
  348/348 (344 prior + 4 E5). Receipt:
  design/cs35-research/kube-runs/cs-e5-families-inpod-98d73c1/. (The pre-rebase
  tree 02cb6ae also gated 348/348 clean — receipt
  cs-e5-families-inpod-02cb6ae/ — before main moved.)
- **E5 scenarios green on vm, main, and wasm** (l1Run is JS on every backend;
  the machinery is backend-agnostic).
- **Byte-neutrality**: no fingerprint pin added; the machinery is inert on the
  shipped bundle (no hook, empty planes, needLevel/tasteW byte-identical), so
  every frozen fingerprint and the matrix ride untouched — proven by the full
  suite green and asserted directly by scenario 4.
- **Merge ritual**: mkcultureways byte-exact (declares nothing → no diff);
  mkversion stamped 02cb6ae's parent 241ded6 (the two-commit stamp pattern).

## Out of scope, reported (slice boundaries + ruling 5)

- **No bundled declaration.** CS4 content declares ramps/drift/acceptance later;
  the crab/pig/gull ways ship silent. This is the slice, not an omission.
- **No live consumer for acceptance.** The meter is written and readable; who
  reads it (a settler gate, an arrival share) is content's question. Ruling 5:
  the option CAN be exercised, it need not BE.
- **Planes not persisted.** Deferred to the content phase that needs a meter to
  survive a reload (adding a save key now is byte-neutral surface with no
  reader).
- **Schema / MCP docs.** The cultureway schema is permissive
  (additionalProperties), so it does not block a future E5 declaration; teaching
  MCP the three sections is E7's "definition of done" (the whole format taught
  at once), not this slice's gate — and deferring it avoids racing the in-flight
  E4 civics-schema work in the same file.

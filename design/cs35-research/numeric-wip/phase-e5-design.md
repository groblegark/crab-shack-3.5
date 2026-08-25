# PHASE E5 DESIGN — families 3–5 machinery, byte-neutral, no bundled declaration

Bead kd-JLuZGtClFY. Base: main a24ba91 (E4 slice 2 landed 6953e9d; slice 3 in flight).
Baseline gate: 344/344 green in-pod, main realm (design/cs35-research/kube-runs
receipt to be written on the SHA I push).

## The shape of the slice (why it is different from E1/E2/E3/E4/E6)

Those transcribed EXISTING content and proved BYTE-EQUALITY against a lambda.
E5 ships MACHINERY WITH NO CONTENT — nothing in the bundle declares a ramp, a
drift curve, or an acceptance update. So:

- **Byte-neutrality is absolute.** No declaration present ⇒ every fingerprint,
  matrix number and scenario UNCHANGED. A moved fingerprint is a BUG, not a
  re-harvest.
- **The proof is inverted.** No lambda to equal. Each family gets a
  DATA-MUST-BITE scenario: hand the engine a declared curve IN THE TEST, show
  it provably moves a band; then show the SHIPPED bundle is byte-identical.
- **Ruling 5 binds the scenarios.** Assert a declared option CAN be exercised
  and is refused when malformed; NEVER assert every option IS exercised.

## The three families

### Family 3 — URGENCY RAMP (host-capped, attaching to a registered errand)

Generalizes `civicUrge` (game.js:1102) — the vote need-curve capped BELOW DIRE
so nobody abandons a shift to vote. A culture declares, per registered errand,
a Layer-1 curve that reshapes that errand's need urgency.

- **Read bundle `URGE_BUNDLE`**: `base` (0..Q20 — the crab's raw need level),
  `tmin` (0..1439 — minutes into the day). The civicUrge inputs, generalized.
- **Declaration** (`appeal.urge`, array): `{ errand:<registered id>, cap:<Q20
  int>, prog:[...] }`. The errand id must be in the ERRANDS registry (the
  registry attachment — named refusal on a stranger). The ramp reshapes the
  need that errand serves.
- **HOST CAP — the safety property, host-side, not trusted to the expression.**
  Engine constant `HOST_URGE_CAP = DIRE - 1` (one grain below survival). Import
  REFUSES a declared `cap > HOST_URGE_CAP` BY NAME ("A RAMP CAP AT/ABOVE
  SURVIVAL"). At runtime the program output is clamped to `[0, min(cap,
  HOST_URGE_CAP)]` — so even a program that computes a huge urgency can never
  push a need to/past DIRE. Prove BOTH: import-refusal by name, and the runtime
  clamp on a hostile program.
- **Attach point**: `needLevel(c, need)` (game.js:10606) — the civicUrge seam.
  A cultured crab whose culture declares a ramp on a registered errand serving
  `need` runs the ramp; crab-native short-circuits to base (byte-neutral, the
  tasteW/idleLines pattern). needLevel is a PURE read (no draws, no hooks) —
  value-equality IS behavioural equality; l1Run is pure, so the ramp adds no
  side effect a second path could skip. Said out loud in code.

### Family 4 — TASTE-DRIFT (weight' = f(weight, exposures), written to a data plane)

The Victoria-3 mechanic as one update rule, fired on the phase-D
`settlementAggregate` hook (game.js:19579/19594 — "the row an exposure-drift
rule reads"). E5 is where the phase-D "mutation verbs arrive with Layer-1's
fuel-counted bytecode": the hook now RUNS a validated program and WRITES a
bounded data plane.

- **Data plane `TASTE_DRIFT`**: `{ [cultureId]: { [recipeId]: <milliWeight> } }`,
  reset on load (loader-reset, like BRAINS/CRABD). NOT serialized — a save-format
  key with no consumer is non-byte-neutral surface (deferred to content).
- **Read bundle `SETTLE_BUNDLE`** (shared with family 5): `prev` (the current
  plane value), `buys`, `days`, `nights`, `delight`, `purse`, `left` — the
  settlementAggregate ctx projected as exposures.
- **Declaration** (`appeal.drift`, array): `{ recipe:<id>, floor:<milli>,
  cap:<milli>, prog:[...] }`. Host constants `DRIFT_MIN=100, DRIFT_MAX=5000`
  (= 0.1..5.0, the appeal.tastes range). Output clamped to `[floor, cap]` then
  to `[DRIFT_MIN, DRIFT_MAX]`. First settlement drifts from the declared base
  taste (appeal.tastes[recipe]×1000, else 1000).
- **Read**: `tasteW` (game.js:8715) returns `TASTE_DRIFT[cu][recipe]/1000` when
  present, else the base. Byte-neutral: empty plane ⇒ base; crab exits early.

### Family 5 — ACCEPTANCE (CK3 town-level meter per culture pair, written to a plane)

- **Data plane `ACCEPT`**: `{ [cultureId]: { [pairId]: <meter> } }`, reset on
  load, not serialized.
- **Declaration** (`accept`, top-level array): `{ pair:<cultureId>, base:<int>,
  cap:<int>, prog:[...] }` over SETTLE_BUNDLE. Host `ACCEPT_MIN=0,
  ACCEPT_MAX=1000`; output clamped to `[0, min(cap, ACCEPT_MAX)]`.
- **Read**: an accessor `acceptOf(cu, pair)`. No live consumer this phase (ruling
  5: the option CAN be exercised, need not BE). The band the scenario reads is
  the plane value itself.

### The update driver (families 4 & 5), byte-neutral by the guarded hook

At load (end of `rebuildBrains`, the culture-runtime loader-reset point):
reset TASTE_DRIFT/ACCEPT; splice out any prior `e5.update` hook; if ANY built
culture declares `drift` or `accept`, register ONE `settlementAggregate` hook
`{ id:"e5.update", fn:e5Settle }`. `e5Settle(ctx)` looks up `CULTURES[ctx.culture]`
and applies its drift + accept rules from the ctx exposures.

Byte-neutral: no bundled culture (crab/pig/gull) declares drift/accept ⇒ no
hook registered ⇒ `HOOKS.settlementAggregate.length===0` ⇒ the fire-site guard
skips ⇒ nothing allocates, nothing moves. The fire SITES are untouched (the E3
dual-path trap is the fire site's problem; both sites already fire — proven by
the existing hooks scenario — and e5Settle rides both via fireHooks).

## Scenarios (suite grows by 3; experiments/e5-focus.json the mutation instrument)

1. **urgency ramp**: a declared ramp on a registered errand moves needLevel's
   band; a cap ≥ survival is REFUSED BY NAME; a hostile program that returns a
   huge urgency is CLAMPED below DIRE at runtime (host-side cap); an
   unregistered errand is refused by name. Prove-by-breaking: no ramp ⇒ base.
2. **taste-drift**: a declared drift rule, fired over lived settlements, moves
   the TASTE_DRIFT plane and tasteW reflects it; host floor/cap clamp; hostile
   rules refused by name. Prove-by-breaking: rip the rule ⇒ plane stays base.
3. **acceptance**: a declared accept rule moves the ACCEPT plane per pair; host
   cap clamps; refusals by name. Prove-by-breaking: rip the rule ⇒ base.
4. **byte-neutral / inert**: with NO declaration, no e5 hook is registered, the
   planes stay empty, needLevel/tasteW are byte-identical — and the SHIPPED
   bundle declares nothing (asserted).

## Discipline checklist
- Gate the exact tree pushed; receipt from THAT SHA in kube-runs/.
- Prove each family by breaking it (armed defect → red naming the right thing →
  revert). A mutation that does not bite with the machinery ripped out is
  worthless — test that.
- Rebase on fresh main and re-gate before push (E4 slice 3 in flight).
- Merge ritual: mkcultureways (byte-exact) + mkversion (stamp names the merge).

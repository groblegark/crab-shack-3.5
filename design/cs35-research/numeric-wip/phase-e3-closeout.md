# PHASE E3 CLOSE-OUT: the depart rules become programs

**Slice**: phase E rung E3 (cs35-phase-e-plan.md §4 C6) — the ~20 depart-rule
weight lambdas re-expressed as Layer-1 programs, the 11 branching depart
literals as select-programs over templates, the voice slice's `dues` and
`refuseHire` debts retired. **Contract**: transcription-equality — same rule,
same mood, same sentence, on every reachable stay. **Branch**: phase-e3,
stacked on E0's interpreter (branched from the E0 worktree's last clean
commit; rebases onto the tip when E0 merges).

## The scaled space (the design's one real idea)

Rule weights are compared, never displayed: `visQuote` is an argmax and the
winner's mood + line are the only observables (nothing draws, logs, or saves
`q.weight` — verified by reading every consumer). Three rules divide by the
row's own purse (`left/purse`), which integer programs cannot do exactly — so
every weight program computes **300 · purse · w** instead: purse clears the
variable denominator (it is positive and constant across one row's argmax, so
ordering and ties are EXACTLY preserved), and 300 = lcm(4, 12, 2, 150) clears
every constant denominator in the table (the quarters override, /12 in wait,
×0.5 in top, /150 in mist). Every scaled weight is exactly integer — checked
rule by rule — and the worst-case magnitude (hungry at full Q20 need, purse
at the bundle cap) is 1.26e14, inside the validator's 2^52 with a decade of
headroom. The quarters override multiplies UN-divided in program mode (a
constant ×4 when nobody declared one): same ordering, same ties.

Boundary honesty: `spentup`'s literal compares against IEEE `purse * 0.12`.
Probed exhaustively for every purse 1..20000 at the integer boundaries:
`100·left ≤ 12·purse` agrees with the float at every one (0 mismatches).
`0.5` is exact in binary, so `2·left ≥ purse` is exact by construction. The
residual risk — two CO-FIRING rules whose float weights land within one ulp
of each other while their exact rationals order the other way — is bounded by
the sweep (4,100+ staged rows incl. a deterministic 4,000-row co-firing
sample) and the real-traffic scenario; a hit there names the row.

## What landed

- `l1Assemble` grew LD-by-name (typos refuse with the row name) and returns
  its final static interval, so a consumer can bound a program's result.
- `DEPART_BUNDLE` (30 ranged rows) + `departReads` (clamps count into
  `departClamped`; a clamp is a lie about the ranges and the sweep asserts 0).
- `departProblem` (all-or-nothing coverage, per-program validation, select
  bound proven inside the templates, every refusal named) + `departCompile`;
  `cultureProblem` routes `depart.rules` through them; `buildCulture` compiles
  to `departR`.
- The crab transcription: `tools/fixtures/crab-depart.json`, all 23 rules
  (22 + quiet), bundled as `BUNDLED_CRAB_DEPART`, loaded beside the crab's
  voice and brain in `rebuildBrains` — same lifecycle, same validator door, a
  broken bundle costs a console error and a suite red, never a town.
- `visQuote` program path (engine lambdas remain the fallback for every
  undeclared culture); `departLine` speaks register template → transcription
  template → lambda, in that order (voice still outranks transcription).
- Slots grown: WHY (the rough rule's cause clause — engine truth, per the
  plan), NIGHTS, QUITS, TABLES, DUES, PAID, TOPBIZ, LIST.
- Debts paid: `dues` speaks from the table through {DUES}; `refuseHire`
  rides two keys (refuseHire = the pop, refuseHireLog = the log), both in the
  crab voice fixture, each byte-equal to its literal, `voiceProblem` clamps
  both, and cultured registers keep their old single-key behavior exactly
  (log falls refuseHireLog → refuseHire → literal).
- Schema + MCP validator + MCP docs teach the section, op table, bundle rows
  and slots.

## Deviations from the plan, defended

- The plan's generic **COUNT slot is ill-defined**: slots resolve from the
  row alone (departSlots is rule-independent by design), so "the count" has
  no single meaning. QUITS and TABLES land instead — same spirit, honest
  scope. **TOPBIZ** was forced by a real mismatch the plan missed: the `top`
  literal always names `topBiz`, but the shared BIZ slot prefers `worstBiz`
  whenever a wait was recorded.
- `mood` may be any of the five valid moods (a culture may re-mood a rule it
  re-expressed); the crab transcription keeps the engine's moods, so crab is
  byte-equal.
- A culture may not ADD rules — the engine table is the id space. New rules
  are a later phase's question (they change what a town can be blamed for).

## Out of scope, reported

The numeric port inflated the need rules' weights ~52,000× — `44 + 20 *
r.hunger` was written for hunger ∈ 0..1 and now reads Q20 integers, so a
fired need rule (~18–21M) dominates rough/quits (~120–220) outright, the
reverse of the float-era band comments at game.js:18016. The transcription
REPRODUCES this faithfully (the fingerprints pin it; equality is the
contract, design review is not this slice) — but the bands and the comments
now disagree with the arithmetic, and someone should rule on which is the
intended table.

## Gates — QUEUED (the operator's AWS session was expired throughout)

Everything below batched for when the session returns, in order:
1. `helm list`-first cleanup of any stale releases (the double-spend lesson).
2. Green check: `node tools/kube.mjs run experiments/e3-focus.json --ref <SHA> --wait`
   (6 scenarios × both backends — the three new E3 rows plus the three phase
   C voice/weights instruments they extend).
3. Mutation demo 1 (transcription drift): PUSHI 36000 → 36001 in
   crab-depart.json's rough weight, regenerate the bundle → the sweep must
   red NAMING the diverging row; revert.
4. Mutation demo 2 (all-or-nothing): delete the quiet rule from the fixture,
   regenerate → "A DEPART TABLE MISSING QUIET" through the hostile scenario
   AND the aboard-check red; revert. (One armed defect at a time.)
5. Rebase onto cs35repo/cs35 once E0 lands (absorb the interpreter's final
   form), re-run e3-focus, then the tip's full suite manifest + MCP battery
   on the final SHA.
6. Frozen fingerprints are expected to HOLD (visQuote runs at card-build,
   display-side; the sweep's equality is the behavioral proof) — if any pin
   moves, that is a finding, not a re-pin.

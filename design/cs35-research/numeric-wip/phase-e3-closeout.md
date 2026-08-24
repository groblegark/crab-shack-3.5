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

## Gates — DONE (2026-08-24), and they found a real bug

1. **Stale-release cleanup** — done.
2. **Green check** — `e3-focus` **12/12**, both backends.
3. **Mutation demo 1 — VACUOUS, and that is the finding.** `PUSHI 36000 ->
   36001` in the rough weight shipped **12/12 GREEN** on both engines with
   the drift live in the bundle. The diagnostic separates instrument from
   magnitude: the same constant cut 100x (`36000 -> 360`) reds the sweep at
   **row 456**, naming both verdicts (`quits/sour` vs `rough/sour`). The
   sweep works; ±1 never flips an argmax across ~4100 rows.

   This is STRUCTURAL. The scaled space (`300 * purse * w`) makes a program's
   weight value deliberately different from the lambda's float, so comparing
   them numerically is a category error, not a stronger test. The fixture's
   header claimed a "byte-equality proof" it never had; it now states the
   real guarantee and this measured blind spot.
4. **Mutation demo 2 — BIT**, naming it exactly: `A DEPART TABLE MISSING
   QUIET`. Reverted; 23 rules restored, bundle byte-exact.
5. **Rebase** — E3 sits directly on `main` (the trunk moved from `cs35`;
   0 behind, 11 ahead). The E0 interpreter's final form was absorbed, and
   absorbing it exposed a merge defect: E0 declared the assembler's per-op
   `row` as `const` (its goldens address slots by integer), while E3 added
   LD-by-name which REWRITES the row so the emit pushes the resolved index.
   Correct on each branch, illegal together — `TypeError: Assignment to
   constant variable` out of `departProblem`, taking all six E3 scenarios red
   on both engines with one exception. Fixed with `let`.
6. **Frozen fingerprints HELD**, as predicted.

### THE BUG THE SWEEP COULD NOT SEE

The full battery read **678/680**, with `hooks: all four points fire with
primitive ctx…` red on both engines: *no settlement aggregate in two lived
days*. Controlled, one scenario two trees:

| tree | hooks control |
| --- | --- |
| `main` | **2/2 green** |
| E3 | **0/2**, both engines |

Attributable to E3 alone. The cause: `visQuote` has two paths. The lambda
fallback fires the phase-D `settlementAggregate` hook before returning;
**E3's Layer-1 path returned early and skipped the dispatch.** Because the
crab depart table now ships in the bundle, `CRABD` is always loaded, so the
Layer-1 path always wins — and a hook point silently stopped firing.

**Why the sweep was structurally incapable of catching it**, which is the
lesson: the sweep compares `id`/`mood`/`line` between the two paths over
~4100 rows. A hook is a **side effect of taking a path, not a value in its
return**. Equality of the return value is not equality of behaviour. The
blind spot documented in `crab-depart.json`'s header during demo 1 bit for
real within the hour, in a different place than anyone was looking.

A hypothesis rejected on the way, recorded so it is not re-run: the new
culture-validator branch (`if (D.rules != null) departProblem(D)`) *can*
refuse a culture document, and a refused pig is a pig that never settles —
but it only fires when a culture declares `rules`, and none do.

**Final gates on the fix (`afd15de`): suite 680/680 across 20 arms, both
backends; hooks control 2/2; bundle byte-exact at 117583 bytes, 23 rules.**

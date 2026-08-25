# PHASE E4 SLICE 3 CLOSE-OUT: civics becomes an authorable document section

**Slice**: phase E rung E4, slice 3 (bead kd-j5RzOniDkt; plan
cs35-phase-e-plan.md §2, §5's E4 row). Slice 2 (kd-Ah5oIRS3QC) transcribed
`platValue`'s six terms into named Layer-1 term-programs and shipped the
STAKES MACHINERY — `stakesProblem`/`stakesCompile`, the `PLAT_BUNDLE`,
`CRABCIV` compiled at boot, and the tabled `platValue` path behind
`window._nol1plat`. It shipped only the **crab-default** path (the bundled
`BUNDLED_CRAB_CIVICS`). This slice makes `civics` an **authorable section of a
culture DOCUMENT** — the door a stranger's file comes through, and the named
refusals it meets — exactly as E3 made `depart.rules` authorable.

**Contract**: the crab path is byte-untouched (the frozen fingerprints and the
slice-2 grid sweep still hold), and a culture that declares its own `civics`
gets its own term-programs, validated at import, refused by name when hostile.

## The gap this slice closed

Before this slice, `d.civics` was a dead key. `cultureProblem` had no route for
it, `buildCulture` compiled nothing, and `platValue` read only the global
`CRABCIV`. A culture document that declared a `civics` section was **silently
dropped** — the exact hole E3 closed for `depart`, and the exact class of bug
the plan's authoring rule ("a typo'd name fails the build, never the town")
exists to forbid. Three edits, mirroring E3's depart wiring line for line:

1. **`cultureProblem` routes `d.civics` through `stakesProblem`** — every
   refusal named, at IMPORT. `stakesProblem` was already written in slice 2
   with `"A CIVICS SECTION …"` messages; it just had no caller on the document
   path. The required-`platform` check it carries is now load-bearing at the
   document door: an author who declares civics but omits the platform stake is
   refused, rather than installing a `civicsR` the engine never reads.
2. **`buildCulture` compiles `civicsR = def.civics ? stakesCompile(def.civics)
   : null`** — validated by `cultureProblem`, so `stakesCompile` cannot fail;
   null when undeclared, and the voter falls to the lambda.
3. **`platValue` dispatches on the voter's culture**: `cul = c.p.culture ?
   CULTURES[c.p.culture] : null; civ = cul ? cul.civicsR : CRABCIV`. This is
   `visQuote`'s `departR ?? CRABD` shape verbatim.

Plus: the schema's `civics` placeholder became the real stakes shape; the MCP
docs teach the civics format beside voice/depart/traits (E7's bar); the MCP
localiser gained a `civics` branch with field-level paths.

## Why it is byte-neutral (the equality argument, checked)

A native crab carries **no `c.p.culture`** (verified: `p.culture` is set only
for converted settlers of a foreign people), so `cul` is null and `civ` is
`CRABCIV` — the *identical* expression slice 2 shipped. The pig and gull
bundled documents declare no `civics`, so their `civicsR` is null and their
voters fall to the lambda, which slice 2 proved byte-equal to `CRABCIV` on a
205,800-pair grid sweep. `platValue` and its whole read chain fire no hooks,
read no RNG and mutate nothing (slice 2's checked claim, unchanged by adding a
table lookup in front), so no fingerprint can move from the dispatch. **The E3
"equality of a return value is not equality of behaviour" trap does not bite
here because there is no side effect to lose** — the dispatch only chooses
which pure table to run, and the reads it feeds are culture-blind.

## The named refusals (the heart of the slice)

Every hostile document is refused BY NAME, through the real `cultureProblem`
door (not `stakesProblem` in isolation):

| hostile civics | refusal |
| --- | --- |
| not an object | `A BAD CIVICS SECTION` |
| empty stakes list | `A CIVICS SECTION WITH NO STAKES` |
| no `platform` stake | `A CIVICS SECTION MISSING THE PLATFORM STAKE` |
| a stake declared twice | `A STAKE TWICE: platform` |
| a stake with no terms | `STAKE platform HAS NO TERMS` |
| a term named twice | `STAKE platform NAMES A TERM TWICE: …` |
| a typo'd bundle read (`LD "nosuchread"`) | `… NOT A BUNDLE ROW` |
| an unknown op (`FROB`) | `OP … NOT AN L1 OP` |
| a program that never closes with TERM | `… DOES NOT CLOSE WITH TERM` |
| a term past 2^52 | `OP … CAN REACH … PAST 2^52` |
| a program of 257 ops (> `L1_MAX_OPS` 256) | `A PROGRAM OF 257 OPS, MAX 256` |

The last is the **fuel-bound** case the bundled 6-op crab table can never
reach on its own — armed here so the fuel rail is a tested refusal, not just a
static one. A **legitimately-negative** term (the family-1 sign law:
`floorBill`/`purseCost` subtract) is ACCEPTED at the door — the validator does
not widen a sign away to make a red disappear.

## Ruling 5, honored exactly (kd-Xqri0Ws081; rulings doc, ruling 5)

The consumption scenario asserts a declared civics option **CAN be exercised
and IS refused when malformed** — never that every rung is voted. `capStake100`
is transcribed AS-IS (slice 2); this slice adds no reweighting and no
special-casing. The dispatch proof is **by construction**, not by counting
votes: the stranger's stakes are the crab's own with one term's coefficient
bent +1, so the two tables must disagree on some (owner crab, platform) pair —
that divergence is the dispatch firing, and a null-culture crab scored on the
same pair is unmoved. No claim that any electorate ever chooses a boar
platform.

## Gates

- **Two new suite scenarios** (both realms):
  1. *a stranger's document declares its own stakes, or is refused by name at
     the door* — the full hostile battery through `cultureProblem(doc)`, plus
     the good document installing and compiling a 6-term `civicsR`, plus the
     undeclared-civics `civicsR=null` silent-document law.
  2. *a people's voters score a platform on THEIR OWN declared stakes* — the
     dispatch, proven by the bent-coefficient construction above.
- **Slice-2 scenarios still green** (the crab grid sweep, the coefficient
  mutation, the crab-default hostile table) — the crab path is untouched.
- **MCP test-server 52/52** — the localiser names a civics term that never
  closes with TERM and a civics missing the platform stake.
- **Byte-neutrality**: `mkcultureways` regen is byte-exact (no fixture change;
  the bundle did not move). `mkversion` regenerated at merge to stamp the merge
  commit.

## Mutation demos — PROVE IT BY BREAKING IT (two, each biting for its own reason)

Two different mechanisms, two different reds, one armed defect at a time.

1. **The import DOOR.** Comment out the `stakesProblem` route in
   `cultureProblem` → *a stranger's document …* goes **RED**: `a non-object
   civics slid in: null` — the door returned `null` (accepted) for a hostile
   civics. Reverted.
2. **The runtime DISPATCH.** Make `platValue` ignore `c.p.culture` and always
   read `CRABCIV` → *a people's voters …* goes **RED**: `a culture's own
   declared stakes did not decide its voter — the dispatch never fired (boar
   20700000 == lambda 20700000)`. Reverted.

Demo 1 is the import validator; demo 2 is the election-time table selection —
neither can hide behind the other, which is why the slice needs both. Both
reverted byte-clean (`grep MUTATION DEMO` empty, `node --check` green).

## Out of scope, by design (slice boundaries)

- **Ballots, purses, calendar, relief** (plan §2's fuller civics schema) are
  transcription that lands in a later slice, not this one. Plan risk #4
  ("scope temptation — civics invites new POLICY content; this plan
  transcribes ONLY") and the one-thing-at-a-time discipline both say: land the
  stake terms' authorable door cleanly first. The `civics` object keeps
  `additionalProperties: false` around a single `stakes` key so those sections
  append without re-litigating this one.
- **`voteReason` still reads the lambda if-chain.** Rewiring it to read the
  largest-magnitude term is a separate receipt slice with its own
  string-equality sweep (slice 2's stated boundary), not folded in here.
- **The crab is not overridable.** `installCultures` skips the `crab` id; the
  crab's civics rides `BUNDLED_CRAB_CIVICS`, exactly as slice 2 left it.

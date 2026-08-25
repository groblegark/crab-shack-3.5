# PHASE E, PLANNED TIGHT — Layer-1 bytecode, civics, and the crab as a document

Scope ruling: this is the substrate doc's phase E (cs35-cultureway-substrate.md
§3, §6-E) turned into commit-sized slices, UPGRADED to absorb the census's
E-adjacent orphans (cs35-hardcode-census.md): **C3 traits**, **C6 depart-rule
bodies**, **C7 idle quips**. Definition of done, restated from §6-E: **suite
green with the Crabocracy transcription LOADED** — the island's constitution
expressed in the format, running the same town byte-for-byte.

Starts after phase D (capability-apis) merges. Per-slice D dependencies are
called out; only E4 and E5 truly need D's registries.

## 1. LAYER-1 BYTECODE, CONCRETELY

**The shape: straight-line expression programs. No jumps, no loops.** Every
known consumer — the ~20 depart-rule weight lambdas (game.js:17893), their
line selection, civics predicates and stake terms (platValue game.js:1513,
voteReason 1566), trait effects, urgency ramps, drift/acceptance updates —
is an arithmetic expression with conditionals, not an algorithm. Branchless
`SEL` covers conditionals; program length IS the fuel bound (substrate §3's
"instruction counter IS the fuel budget" becomes trivial: fuel = length ≤ 256).
Determinism story: a straight-line integer program cannot diverge, loop, or
overrun — the validator is a single static pass.

**Arithmetic regime: exact integers < 2^53** (the `classifyD` precedent —
"exact under 2^37"). JS numbers are exact there natively; the kernel port,
when a kernel-resident consumer exists, uses int64_t. The validator
propagates static magnitude bounds per op from each LOAD's declared range
(the read-bundle registry carries ranges); a program whose worst case exceeds
2^52 is refused at import, named. platValue's coefficients (345000 ×
potStake20 × bowls, 2070000 × roofWeight20…) bound near 2^26 — headroom is
enormous, but the bound is computed, not assumed.

**Instruction set (~22 ops)**:
- `PUSHI imm` · `LD reg` (read a slot of the surface's declared read bundle
  — phase D's observable/read registries are the index space; an out-of-range
  LD is refused at import)
- `ADD SUB MUL` (exact) · `DIVI c` / `MULDIV a b c` (floor, divisor a
  positive constant — the grid idiom `(a*b - (a*b)%c)/c` as one op)
- `MIN MAX CLAMP ABS NEG`
- `LT LE EQ` (0/1) · `AND OR NOT`
- `SEL` (cond ? a : b — the only conditional)
- `TERM name` (family-1 only: closes a named term; see receipts)

**Receipts by construction (family 1)**: a stake valuation is not one program
but a LIST of named terms, each a straight-line program yielding a signed
int. The value is the sum; `voteReason` is derived from the largest-magnitude
term's name — the receipt and the valuation come from the same definition,
which is what substrate §3's legibility ruling demands. Line 1766's
`voteReason(c, pick.plat)` keeps its signature; the body reads the term list.

**Hostile-program validation** (all named errors through cultureProblem):
op allowlist; length ≤ 256; static stack-depth ≤ 16; LD indices inside the
surface's bundle; DIVI/MULDIV divisors positive constants; magnitude bound
as above; host-side result clamps per family (urgency hard-capped below
survival — substrate §3 family 3's "the cap is host-side, not trusted to
the expression"). Budget/validation failure at RUNTIME (impossible for
straight-line, but the rail exists): hook aborted, engine default runs,
one legible toast — the sim never stops (§3's implementation note).

**Interpreter home: JS reference FIRST, kernel port deferred** — the appeal
precedent ("not yet ported; when that path ports, it crosses as a plane").
Every known E consumer runs at JS-side decision points (departure cards,
elections, trait stamps, settlement-boundary drift written INTO the MR_TASTE
plane as data). No kernel-resident consumer exists yet, so a kernel.c
interpreter now would be speculative surface. The close-out must say this
out loud per house style.

**Authoring format**: programs ride the cultureway JSON as readable arrays —
`["LD","stay.rough"], ["PUSHI",30], ["MUL"], …` — compiled by
tools/mkcultureways.mjs to flat int arrays with LD names resolved against
the registry (a typo'd name fails the build, not the town). MCP docs teach
the op table; policy_verify grows a program-lint verb (stretch, not gating).

## 2. THE CIVICS SECTION

Inventory (all game.js): the four purses + platform grid (983, 1526), ballot
tables WAGE_FLOOR 811 / HEAD_CAP 826, platValue/voteReason/idealPlatform
(1513–1560), poll mechanics POLL_WEEKDAY/OPEN/SHUT/BALLOT_* (763, 905–965),
relief: SHELTER_RENT/FLOAT/STRIKES/SHUT_NIGHTS (741–760), SOUP_MARGIN/POT_MAX
(761–762).

```
civics: {
  ballots:   [{ id, name, short, unit, who, steps[](ints, step0 = founding) }],
  purses:    [{ mech, ... rate grid }],
  stakes:    [{ id, terms: [{ name, prog }] }],        // family 1
  eligibility: { vote: prog, stand: prog },            // family 2
  calendar:  { pollWeekday, pollOpen, pollShut },      // minutes, clamped
  relief:    { soup: { potMax, margin¢ }, shelter: { rent¢, float, strikes, shutNights } },
}
```

**Stays engine (census class B, confirmed)**: election lcm arithmetic and the
exact-grid tie-break machinery (the MECHANISM — capAsk's backwards dial
included); POLL_PLACES geometry and POLL_BW (world furniture, pixel-paid-for
per the 40px comment); VOTE_SECS; ballot logistics (spare sheets, the clerk);
conservation (a levy that mints is inexpressible — no verb). WAGE_STD stays
per the census D4 ruling (the lcm denominator) — ballot steps are data but
the grid they straddle is the engine's.

**The Crabocracy transcription** = today's constants written into the bundled
crab document's civics section. Gate: transcription-equality — a staged
election sweep (the fixture towns the citizen slice re-staged) must produce
identical ballots, tallies, winners, and voteReason strings, plus frozen
fingerprints. Elections are exact-int, so equality is byte, not approximate.

## 3. THE CRAB AS A DOCUMENT (+ C3 TRAITS)

The dogfood gap (substrate §4 debt 1) plus the census's C3:
- **Names**: CRAB_NAMES/CUSTOMER_NAMES (crabs.js:8,108) → `people.names` in
  the bundled crab document; freeCrewName's "CRAB" literal (game.js:3403 call
  path) reads the document pool. Byte-equal: same pool, same order, same
  draws.
- **Look**: CRAB_COLORS (sprites.js:89) → `art.colorways`; SUDSY's pinned
  index becomes a named colorway reference resolved at install. The
  HOUSES/BOATS/BUGGIES-per-colorway DERIVATION (game.js:5283–5288) stays
  engine — a colorway begets a house; the palette is the data. Save compat:
  k.color indexes the colorway list (8584 clamps) — the bundled list keeps
  today's order forever; new colorways append.
- **Traits (C3)**: TRAITS (crabs.js:7–46) → `people.traits`: label, move/
  work/tip multipliers as int twentieths (every shipped value is
  twentieths-exact: 1.4→28, 0.85→17, 1.25→25, 1.15→23, 0.9→18, 1.05→21,
  0.95→19), lateMin in minutes, flags (pauses), quips through the voice
  line-budget clamps. Settlers: a culture without traits inherits crab's
  (the appeal-slice inheritance idiom); the pigway MAY declare later —
  machinery ships, content doesn't (byte-neutral).
- **Diary fallbacks**: the 12 code literals stay as engine-last-resort, but a
  scenario proves the bundled crab document never REACHES them (fallback hit
  = red). The voice close-out's refuseHire debt is retired here via the
  two-key split (refuseHire + refuseHireLog) it already prescribes.

## 4. C6 + C7, MADE EXPLICIT

**C6 — depart-rule bodies** (the census's "make it explicit or accept
crab-shaped departures forever"): each of the ~20 DEPART_RULES becomes
`{ id, mood, weight: prog, line: { select: prog, templates: [...] } }` in a
`depart.rules` section — weight programs read the stay record (r.rough,
r.quits, r.buys… as a declared read bundle), line selection returns a
template index, templates use the existing slot engine (MINS/BIZ/PRICE slots
from the voice slice, plus the new slots the branching literals need: WHY,
NIGHTS, COUNT). This retires the voice close-out's 11 fallback-only branching
literals AND the `dues` no-slot debt. Crab ships as the transcription in the
bundled document; the literal lambdas remain as the engine fallback for
undeclared cultures until the transcription-equality gate proves them
unreachable for crab. Gate: the voice slice's ceremony verbatim —
tabled-equals-literal per rule on staged stays, plus the two-day whole-town
log equality run that catches call-site drift.

**C7 — idle quips**: WANDER_QUIPS (5588), BALL_LINES (5660), CHAT_LINES
(5715), NOD_WAKE → voice register keys (ball/chat/wander/nod arrays). The
draw sites keep their exact srand() calls (the SELECTION is engine physics —
same draw count, same indices); only the string table dereferences through
the register. Byte-equal by construction; the fixture carries crab's lines.

## 5. THE SLICE LADDER

| slice | what | gate ceremony | needs D? |
|---|---|---|---|
| E0a | FIX the thinking-heads scenario (see §6) | scenario red-then-green + mutation (corrupt dm on reload → red) | no |
| E0b | interpreter + assembler + validator + hostile scenarios (fuel/depth/bound/LD-range each named) | byte-neutral (no consumer wired) | no (registry indices stubbed until D, resolved after) |
| E1 | C7 idle quips → voice keys | byte-equal (draw-count pin + line equality) | no |
| E2 | C3 traits → people.traits, crab transcribed | byte-equal (trait stamp equality over the pool, quips via voice gates) | no |
| E3 | C6 depart bodies → depart.rules, crab transcribed | transcription-equality (per-rule staged stays + whole-town log run) | E0b |
| E4 | civics section + Crabocracy transcription (ballots, purses, stakes as term-programs, calendar, relief) | transcription-equality (election sweep byte-equal) + frozen fingerprints | E0b; D policy-slots for the stake surface registration |
| E5 | families 3–5 machinery: urgency-ramp slot (host-capped), taste-drift + acceptance updates written to data planes | byte-neutral machinery + data-must-bite scenario each (a declared curve moves a band); NO bundled declaration this phase | E0b + D errand registry (ramps attach to registered errands) |
| E6 | crab-as-document: names, colorways, diary-fallback unreachability, freeCrewName | byte-equal + save-compat scenario (old k.color loads identically) | no |
| E7 | definition of done: bundle ships the full crab document (voice+traits+depart+civics), suite green both backends WITH it loaded, matrix unchanged vs pre-E, MCP docs teach an author the whole format | the E acceptance run (cluster) | — |

Order rationale: E0a immediately (it guards the save guarantee everything
later leans on); E1/E2 are independent warm-ups that can run parallel to
E0b in separate forks (disjoint regions: strings vs new engine file);
E3→E4 consume the interpreter; E5 is machinery-only so CS4 content can
declare it later; E6 last among content because colorway/save compat wants
maximum soak. Every slice: kube-gated, commit-per-slice, close-out per
slice in numeric-wip/.

## 6. THE THINKING-HEADS SCENARIO, ADJUDICATED: VACUOUS — FIX, DON'T RETIRE

Confirmed by code, not just suspicion: the scenario (suite line 12521) does
`sim.G("save()")` then reads `localStorage.getItem(SAVE_KEY)` — but since the
slots era, `save()` writes ONLY through `writeSlotEnv` → `slotKey(i)` =
`crabshack3_v1_s<i>` (game.js:7827,7854); the bare legacy key is a migration
SOURCE (7840) that nothing writes. So `env` is null, both "loads" boot
identical fresh towns, and the equality passes while proving nothing. It has
been green-and-empty since the save-slot slice.

Ruling: **fix in E0a**, first thing, because E's save work (civics state,
and rung 3's surprise ring after it) leans on exactly the guarantee this
scenario pretends to hold. The fix: read `slotKey(activeSlot)` (or slot 1),
assert the envelope is non-null BEFORE comparing ("the staging says nothing"
idiom already present for guests — extend it to the envelope), inject via the
same slot key + `load()`, and mutation-test: flip one byte of a saved delta
(`dm`) on the reloaded copy and the futures must diverge → the scenario must
go red. A test that cannot go red is dead data (substrate §5.2, applied to
the suite itself).

## 7. RISKS, RANKED

1. **Transcription fidelity (E3/E4)** — re-expressing 20 lambdas and
   platValue through the bytecode must be BYTE-equal, and the voice slice
   proved how sharp that gate is (one drifted byte named the line). Mitigant:
   per-rule staged stays + the whole-town log run + exact-int elections; the
   fallback lambdas stay in the engine, so a failed transcription blocks the
   slice, never the town.
2. **Read-bundle scope creep** — every LD a program wants must be a declared,
   ranged registry row; the stay record and civics reads are ~30 rows. The
   validator's bound propagation is only as honest as those ranges. Mitigant:
   ranges asserted at capture (a stay record field outside its declared range
   is a loud error in dev gates).
3. **D-coupling — RETIRED 2026-08-25, D has landed.** This risk read "D is
   unmerged while this plan is written", which was true when authored and is
   false on main 24e0a81. Both shapes it hedged against are live named
   registries, verified by symbol:
   - the errand registry — `ERRANDS`/`registerErrand` (game.js:11345), with
     `ERRAND_RANK` (game.js:10998), id/need/gather validation and a census cap,
     each refusal throwing BY NAME; `registerBizErrand` is the biz-kind wrapper.
   - the policy slot — `NEURO_SURFACES`/`registerSurface` (game.js:8347), the
     decision-surface registry. `policyProblem` (game.js:8433) refuses any
     surface not in that map by name (`POLICY FOR UNKNOWN SURFACE "<sid>"`),
     and `policyOf` (game.js:8384) returns null for one, so registration is
     the only door. The comment at game.js:8346 — "a registered surface is the
     whole meaning of 'a policy slot exists'" — describes that registry, it is
     not a substitute for one.
   Both halves are therefore real registries in the same state. An earlier
   triage pass (kd-B10srsW1Cm) suspected the policy slot was only a convention
   over registered surfaces, having grepped for `policySlot`/`POLICY_SLOT` and
   found nothing; the symbol is spelled `registerSurface`, and the convention
   reading is withdrawn. E5 and later slices should treat both as landed
   dependencies and cite them by these symbols.
4. **Scope temptation** — civics invites new POLICY content (franchise
   levers for the turnout drop, new ballots). This plan transcribes ONLY;
   the citizen close-out's "phase E is where the franchise gets levers if
   Matt wants" stays a post-E menu item.

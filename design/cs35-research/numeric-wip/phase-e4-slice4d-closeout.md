# PHASE E4 SLICE 4d CLOSE-OUT: eligibility — the franchise becomes two predicate programs

**Slice**: phase E rung E4, slice 4d (bead kd-8JHuxqynmF; parent kd-q5SOraybkW;
blocks E7 kd-d2B1Omu2JZ). The LAST slice-4 child, and the subtlest — family 2
("who may"), the first PREDICATE-program consumer in the migration. With this
landed, all five civics families plus eligibility are authorable; E4 is complete.

## The engine predicates, verified before transcribing (not invented)

The bead's hard rule: extract byte-equal predicates first; if extraction is not
byte-equal, STOP. Traced exhaustively (design/…/phase-e4-slice4d-design.md):

- **STAND (self-nominate)** = `c.p.npc`. `buildBallot` (game.js:1809) filters
  `allCrabs().filter(c => c.p.npc)` — only townsfolk put themselves forward; the
  incumbent is added only if `inc.p.npc` (1826); `seatFoundingMayor` (2143) picks
  from the same npc pool. The player's crew stand ONLY by nomination
  (`hall.stand`, a separate mechanism that stays engine).
- **VOTE** = constant true for any resident. `allCrabs()` = crew + townsfolk,
  both run `pickErrand` → the `vote` errand (11441), whose guard is pure
  timing/state (pollOpen/hasVoted/duty/working). There is NO per-resident vote
  exclusion. The visitor is excluded STRUCTURALLY (not in allCrabs()), not by a
  persona predicate.

An independent read-only Explore agent adversarially re-verified both claims
against the tree before this landed.

## The shape — family 2, dispatched per voter (like stakes)

Eligibility reads a crab's own attributes, so it is PER-VOTER and dispatches on
culture (the platValue idiom), NOT the town-level in-place adoption of 4a/4b/4c.

- `civics.eligibility: { vote: prog, stand: prog }` — each a bare L1 program
  (the depart weight/select shape, NOT TERM-closed) over `ELIG_BUNDLE`
  (`npc`/`owner`/`homeless`, ranged 0/1 flags; APPEND-only ABI). The crab reads
  only `npc`; the others let a stranger express a different franchise without a
  new read surface.
- `eligProblem` validates through `l1Assemble` + a **0/1 static-bound check** —
  a "predicate" that could return 7 is not a predicate and is refused by name,
  exactly as a depart line-select must index inside its template list. Both keys
  are required (the engine reads both).
- **Crab transcription**: `vote = [["PUSHI",1]]`, `stand = [["LD","npc"]]` —
  byte-equal to the inlined gates.
- **Dispatch + extraction**: `canStand(c)` / `canVote(c)` run the culture's
  compiled predicate, or the engine default (`c.p.npc` / `true`) when a culture
  declares none. `eligOf` uses the same `c.p.culture ? CULTURES[id] : CRABELIG`
  dispatch as platValue; `window._noeligprog` is the arm-off hatch (mirrors
  `_nol1plat`). buildBallot's filter + incumbent, seatFoundingMayor, and the
  vote errand's guard all route through these.

## Byte-equality (the E3 trap, checked)

`canStand(c)` is truthy iff `c.p.npc` (CRABELIG's stand is `[LD npc]`); `canVote`
is constant 1 for the crab. So the electorate and the self-nomination pool are
the SAME crabs as before. NO hook, NO RNG, NO mutation on either predicate path
— pure reads — so value-equality IS behaviour-equality here (unlike 4c). Proven
on a STAGED ELECTION: byte-identical ballot/candidates/tally/pool whether the
wired predicates decide or `_noeligprog` falls to the inlined gates. The frozen
fingerprints did not move.

## Gates

- **Three new suite scenarios** (`civics eligibility:`), green both realms
  (vm+main) and both backends (JS + wasm kernel):
  1. *byte-equal to the engine's inlined gates* — canStand===c.p.npc,
     canVote===true crab-by-crab, AND the staged-election A/B (wired vs arm-off).
  2. *a people's own franchise decides its electorate (the dispatch)* — ruling
     5's bar, by construction: a stranger `stand=[PUSHI 1]` puts a crew-shaped
     resident (npc false) on the self-nomination pool the crab predicate excludes;
     the SAME crab, changing only the culture tag, flips — the dispatch firing.
  3. *a hostile franchise is refused by name at the door* — both-keys-required, a
     bad LD name, an unknown op, an empty program, and the load-bearing 0/1-bound
     check (a program that can reach 8 is refused as "NOT A 0/1 PREDICATE").
- **MCP test-server 57/57** (+1: the localiser names a franchise missing its
  stand predicate). Schema + docs.mjs teach `civics.eligibility` beside the rest.
- **Byte-neutrality**: frozen fingerprints UNTOUCHED; mkcultureways byte-exact;
  mkversion stamps the merge.
- **Full in-pod suite green** (receipt below).

## Mutation demos — two, each biting a different scenario

1. **The VALUE.** Crab `stand` `[LD npc]` → `[PUSHI 1]` (crew now self-nominate)
   → *byte-equal to the engine's inlined gates* reds: `canStand(c) is not
   byte-equal to c.p.npc`. Reverted byte-clean.
2. **The DISPATCH.** `canStand` ignores the compiled program and always reads
   `c.p.npc` → *a people's own franchise decides its electorate* reds: `the boar
   franchise declared everyone stands, but its crew resident could not - the
   dispatch never fired`. Reverted byte-clean.

## Boundary — stays engine

Player nomination (hall.stand/nominee), the incumbent-always-seated rule, the
one-candidate-per-policy dedup, the visitor structural exclusion, the vote
errand's timing/state guard, the tally and the count. Only who-may-self-nominate
and who-may-vote became the two declared predicates.

## E4 is complete

All five families the plan promised — stakes (slice 3), ballots (4a), purses
(4b), calendar+relief (4c), eligibility (4d) — are authorable. E7's blocks-edge
was on this bead; with 4d landed the whole slice-4 (kd-q5SOraybkW) can close and
E7 (kd-d2B1Omu2JZ) unblocks — the definition-of-done run for the E arc can now
measure a document that is DOING the work, not one-fifth of it.

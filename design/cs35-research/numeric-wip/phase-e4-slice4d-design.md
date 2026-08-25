# PHASE E4 SLICE 4d — DESIGN: eligibility (family 2, vote/stand predicates)

Bead kd-8JHuxqynmF (parent kd-q5SOraybkW; blocks E7 kd-d2B1Omu2JZ). The last
slice-4 child, and the subtlest: family 2 is "who may" — PREDICATE programs, not
tables. The bead's hard rule: extract byte-equal predicates FIRST; if extraction
is not byte-equal, STOP.

## THE ENGINE PREDICATES, VERIFIED (not invented)

Traced exhaustively (game.js):

- **STAND (self-nominate)**: `buildBallot` (game.js:1784) filters
  `town = allCrabs().filter(c => c.p.npc)` — only townsfolk put themselves
  forward; the incumbent is added only if `inc.p.npc` (1801); the player's crew
  stand ONLY when the player nominates one (`hall.stand`, 1808). So the
  transcribable self-nomination predicate is exactly `stand(c) = c.p.npc`.
  (`c.p.npc` is `true` for townsfolk, absent/falsey for crew — a clean boolean.)

- **VOTE**: `allCrabs()` = crabs (crew) + npcs (townsfolk). Both run `pickErrand`
  → the `vote` errand (registerErrand id "vote", 11372), whose guard is
  `pollOpen() && !hasVoted(c) && !c.duty && c.dsC !== DS.working` — all TIMING/
  STATE, no eligibility. There is NO per-resident vote exclusion (grep for
  canVote/franchise/disenfranchise: none). Every resident votes; `roll =
  allCrabs().length`. The only exclusion is the VISITOR, and that is STRUCTURAL
  (a visitor is not in allCrabs(), runs updateVisitor not pickErrand) — not a
  persona predicate. So the transcribable crab predicate is `vote(c) = 1`
  (constant true for any resident).

Both are genuine engine gates, inlined. Transcribing them is re-expression, not
invention. The player-nomination path (hall.stand) is a separate mechanism and
stays engine — the predicate governs SELF-nomination only, which is what
`c.p.npc` gates.

## THE SHAPE — family 2, dispatched per voter (like stakes, unlike the tables)

Eligibility reads a CRAB's own attributes, so it is PER-VOTER and dispatches on
culture exactly as stakes/platValue does (`c.p.culture ? CULTURES[id] : crab`),
NOT the town-level in-place adoption of 4a/4b/4c.

- `civics.eligibility: { vote: prog, stand: prog }` — each a bare L1 program
  (NOT TERM-closed; the depart weight/select shape) returning 0/1, assembled
  against a small persona read bundle `ELIG_BUNDLE`.
- Validated by `eligProblem` through `l1Assemble` + a 0/1 static-bound check
  (`bound[0] >= 0 && bound[1] <= 1`) — a predicate that could return anything
  else is refused by name. This reuses l1Assemble's `bound` exactly as depart's
  line-select uses it to prove the index lands in the template list.
- `ELIG_BUNDLE` — the persona attributes a franchise predicate may read, each a
  ranged 0/1 flag: `npc` (townsfolk vs crew), `owner` (keeps a till), `homeless`
  (sleeps at the shelter). Small, ranged, APPEND-only (the depart-bundle ABI).
  The crab predicates read only `npc`; the others are there so a stranger
  culture can express a different franchise without inventing a read surface.

- **Crab transcription**: `vote = [["PUSHI",1]]` (every resident votes);
  `stand = [["LD","npc"]]` (townsfolk self-nominate). Byte-equal to the inlined
  gates by construction.

- **Dispatch + extraction**: introduce `canStand(c)` / `canVote(c)`:
  `cul = c.p.culture ? CULTURES[c.p.culture] : null; elig = cul ? cul.eligR :
  CRABELIG; run the program if present, else the engine default (c.p.npc / 1)`.
  Route buildBallot's filter (1784) and incumbent-add (1801) through canStand.
  The vote path stays as-is behaviourally (every resident votes) but canVote is
  the declared seam a stranger culture would key on; wiring it into the vote
  errand's guard is byte-equal for the crab (constant 1) and is the honest
  consumer that makes the predicate load-bearing rather than inert.

## Byte-equality argument (the E3 trap, checked)

`c.p.npc` is read by canStand; a native crab carries no `p.culture` so `elig` is
`CRABELIG`, whose `stand` program is `[LD npc]` = exactly `c.p.npc ? 1 : 0`. The
filter `allCrabs().filter(c => canStand(c))` is byte-equal to
`allCrabs().filter(c => c.p.npc)` because canStand(c) is truthy iff c.p.npc.
The incumbent-add `inc.p.npc` → `canStand(inc)` likewise. The vote guard gains
`canVote(c)` which is constant 1 for the crab → no crab is added or removed from
the electorate. NO hook, NO RNG, NO mutation on either predicate path — pure
reads — so value-equality IS behaviour-equality here (unlike 4c's relief). The
gate proves it on a STAGED ELECTION: identical ballot/candidates/tally/winner/
voteReason with the predicates wired vs the pre-slice inlined gates.

## The gate + mutations

- Byte-equal pin: CRABELIG installs, vote=[PUSHI 1]/stand=[LD npc], and a staged
  election is byte-identical whether canStand/canVote or the inlined gates decide
  (an A/B via a `window._noeligprog` arm-off hatch, mirroring `_nol1plat`).
- Dispatch proof (ruling 5's bar): a stranger culture that declares
  `stand = [PUSHI 1]` (everyone self-nominates) puts a crew-shaped resident on
  the self-nomination list that the crab predicate would exclude — the dispatch
  firing, by construction, not by asserting any rung is voted.
- Hostile door: eligProblem refuses a predicate that never returns (no value), a
  bad LD name, an unknown op, a program whose bound escapes [0,1], a missing
  vote/stand key — each by name, through cultureProblem.
- Mutation demos: (1) bend the crab `stand` program (`[LD npc]` → `[PUSHI 1]`)
  → the staged-election byte-equal pin reds (crew now self-nominate); (2) make
  canStand ignore the program and always return npc → the dispatch proof reds
  (a stranger franchise no longer decides its own electorate).

## Boundary — STAYS ENGINE

Player nomination (hall.stand/nominee), the incumbent-always-seated rule, the
one-candidate-per-policy dedup, the visitor structural exclusion, the vote
errand's timing/state guard (pollOpen/hasVoted/duty/working), the tally and the
count. Only WHO-MAY-SELF-NOMINATE and WHO-MAY-VOTE become the two declared
predicates.

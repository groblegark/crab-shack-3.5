# The house-limit ladder: the new rungs are unreachable, and so was the old one

Measured 2026-08-24 in a `cs` fleet pod (in-pod, not via `tools/kube.mjs` —
see kd-wbdYahwATd for why the cluster path does not work from a cs pod).
Tree: main tip `83fb0f4`. Instruments: `tools/rungprobe.mjs` (lived towns),
`tools/rungreach.mjs` (the mechanism).

## The question this answers

kd-UcvVdC7zFW item 2, and it was asked because of a smell rather than a bug
report: growing `HEAD_CAP.steps` from `[0,2,3,4,6]` to `[0,2,3,4,6,8,12]`
enlarged `allPlatforms()` by ~40% — the grid is now **4,900** platforms — and
the full suite came back **680/680 with not one fingerprint moved**. A change
that enlarges the search space while altering nothing observable is either
unreachable or unwired. This project treats that as a finding, not a relief.

## What the towns said

`SIMLIB_REALM=main node tools/rungprobe.mjs --days 30 --towns 8`

```
steps: [0,2,3,4,6,8,12] grid: 4900
{"crabsAsked":109,"elections":8,
 "chosenCapIndexHistogram":{"0":94,"3":15},
 "policyCapPerTown":{"5":0,"13":0,"21":0,"77":0,"101":0,"909":0,"1337":0,"4242":0}}
```

109 voters across 8 towns over 30 lived days chose exactly two rungs:
**index 0 (NO LIMIT), 94 times**, and **index 3 (4 heads), 15 times**.

The new rungs 5 and 6 never appear — which is what the probe was built to ask.
But **index 4 never appears either, and index 4 is SIX**, the rung that shipped
long before this slice and is the town's own founding policy. That is the part
that turns this from a sample-size story into a mechanism story, and it is the
reason this document exists. Had only 5 and 6 been missing, "no town got big
enough in 30 days" would have covered it.

Every town's `policyCap` also settled at **0** — eight towns, all of them, from
a founding policy of `cap: 4`. The towns are not merely failing to climb the
ladder; they are **voting the house limit away**.

## Why: a non-binding rung ties with NO LIMIT, and the tie-break hands it to 0

`capStake100` (game.js ~1560) is the only term in `platValue` that reads the
cap. For a voter who keeps a till, each rival shop pays
`min(50, max(0, bizHeads(b) + 1 - cap) * 18)` and their own shop charges
`-22` per head it binds. A cap that binds **no** shop therefore scores exactly
**0** — and `capOf(p) <= 0` returns 0 by early exit. So every rung too high to
bind anybody is worth precisely what NO LIMIT is worth: nothing.

`idealPlatform`'s tie-break then decides it, and it is not neutral:

```js
function capAsk(p) { const v = (p && p.cap) | 0; return v === 0 ? -1 : CAP_STEPS + 1 - v; }
```

Ties go to the smaller ask, and index 0 is given **-1** — smaller than any real
rung. Among equals, NO LIMIT always wins.

`tools/rungreach.mjs` scores the ladder directly against a known head count:

| rival shop heads | stake per rung `[0,2,3,4,6,8,12]` | tied at best | chosen |
|---|---|---|---|
| 5 (the town's own) | `[0,50,50,36,0,0,0]`  | `[1,2]`     | index 2 (3 heads) |
| 6  | `[0,50,50,50,18,0,0]`  | `[1,2,3]`      | index 3 (4 heads) |
| 8  | `[0,50,50,50,50,18,0]` | `[1,2,3,4]`    | index 4 (6 heads) |
| 10 | `[0,50,50,50,50,50,0]` | `[1,2,3,4,5]`  | index 5 (8 heads) |
| 12 | `[0,50,50,50,50,50,18]`| `[1,2,3,4,5]`  | index 5 (8 heads) |
| 16 | `[0,50,50,50,50,50,50]`| `[1,2,3,4,5,6]`| index 6 (12 heads) |
| 20 | `[0,50,50,50,50,50,50]`| `[1,2,3,4,5,6]`| index 6 (12 heads) |

Note the `min(50, ...)` clamp doing real work: from 16 heads up, every rung
from 2 upward is pinned at 50 and the ladder stops discriminating entirely —
the owner takes index 6 only because it is the *largest* ask among equals once
`capAsk` orders them. Note also that an owner never chooses index 0.

This is consistent with the live histogram and supplies its mechanism: the only
rungs an owner picks at small-town sizes are indices 2 and 3, and index 3 is the
`{"3": 15}` the lived towns reported. The rungprobe seeds hire to
`crabs.length >= 6` across the WHOLE town and the crabs spread over shack,
juicebar and table, so no single shop comes near 8 — and rungs 5 and 6 are never
in play.

Stated precisely, so the inference is not oversold: the mutation demo below
*proves* the tie-break mechanism, and the table *proves* the per-head
reachability. That 15 is specifically the 6-head-shop rows is the natural
reading, but this probe did not carry per-shop head counts out of the lived
towns, so treat that one number as attributed rather than measured. Nothing
downstream depends on it — the finding is the shape, not the 15.

**Rung k is reachable only in a town where one shop already employs at least
`steps[k]` crabs.** The 12-rung needs a twelve-head shop.

### The mutation demo, and the instrument bug it caught

Rule 2 says prove it by breaking it, and doing so here paid for itself twice.

**The armed defect:** `capAsk`'s index-0 privilege, `-1` -> `99`. That single
character is the whole "NO LIMIT wins every tie" claim; if the table above is
really reading it, removing the privilege must move the table.

**First run: it did not bite.** Identical output, every row. That is rule 3 —
a mutation that does not bite is a finding — and the finding was about *this
probe*, not the game. The first draft re-implemented `capStake100` and `capAsk`
in local JS inside the probe, so it was auditing a copy and could never observe
a change to game.js. **This is exactly the E3 lesson (discipline rule 5) landing
on the instrument built to investigate E4** — two copies agreeing proves only
that they are copies.

Rebuilt to call the real `capStake100(c, p)` and `capAsk(p)` with real crab
objects off a live roster. That surfaced a **second** instrument bug: `allCrabs()`
memoizes on `rosterGen` (game.js ~5461), so pushing synthetic crabs onto
`crabs[]` without bumping the generation left `bizHeads()` reading a stale
roster — every row reported `actualHeads: 5` regardless of the size requested.
Both bugs would have silently faked this entire document. The fixed probe
reports `actualHeads` alongside the requested count precisely so this failure
cannot hide again; the 2- and 4-head rows still honestly read `actualHeads: 5`
because the seeded town has five and the probe only adds, never removes.

**Second run: it bit, in exactly the predicted place.** With the privilege
removed, the wage-earner row flips from `chosen index 0` to `chosen index 6` —
their stake is flat zero across the whole ladder, so they were *only* ever
choosing NO LIMIT via the tie-break, and with the tie-break inverted they take
the top rung instead. The jobless row does NOT move, and should not: their -18
is a real preference, not a tie. Owner rows do not move either — their choices
are decided on stake, above the tie-break. A mutation that moved everything
would have been a weaker result than one that moved precisely the rows the
theory says are tie-decided.

Reverted; `git diff game.js` clean.

### ...and only crabs who keep a till have an opinion at all

`capStake100`'s rival/own-shop arithmetic sits entirely inside `if (c.p.owner)`.
For everyone else the term collapses:

| voter | stake per rung `[0,2,3,4,6,8,12]` | chosen |
|---|---|---|
| no till, has a wage job | `[0,0,0,0,0,0,0]` | index 0 (NO LIMIT) — by tie-break |
| no till, no wage job | `[0,-18,-18,-18,-18,-18,-18]` | index 0 (NO LIMIT) — on merit |

A wage earner scores **flat zero across the entire ladder** — every rung ties
with every other, and `capAsk`'s -1 hands all of them to NO LIMIT. A crab with
no wage job actively scores every real rung at **-18** ("a limit is a posting
that never goes up on the board", per the comment at game.js ~1572), so they
too vote 0, but for a stated reason rather than by tie-break.

This closes the histogram without needing a third behaviour: **94 = every
non-owner, all of whom choose index 0; 15 = owners, who at these town sizes can
only land on indices 2 or 3.** Two independently-built probes, one lived and one
mechanical, agreeing on a two-valued outcome.

The consequence is structural: **the house limit is decided entirely by shop
owners, and everyone else votes to abolish it.** Owners are always a minority of
a roster.

## The trap: the cap is what stops the shop reaching the size the cap needs

`capFull` (game.js:900) is enforced at every hiring path — the poach at 4822,
the job board at 10069, the chef purchase at 14297 (refused *before* the money
moves), the shuffle at 14660. So a town capped at six can never grow a
seven-head shop, and without one, rungs 5 and 6 are worth zero, and a
zero-valued rung loses the tie to NO LIMIT.

The ladder's upper half is gated behind a town size the ladder itself forbids.
The only way through is index 0: abolish the limit, grow past 8, and only then
can a voter want the 8-rung. That is precisely the path the eight towns took —
all of them to `policyCap: 0`.

## Verdict on kd-UcvVdC7zFW item 2

The slice's own framing offered two outcomes. Neither is what happened:

- Not "the new rungs are dead data and the change is cosmetic" — they are
  reachable *in principle*, and `rungreach` shows exactly the town shape that
  reaches them (a 16-head shop picks index 6).
- Not "a gap in the pins" — no pinned scenario is wrong. The suite was green
  because **nothing observable moved**, and nothing moved because the new rungs
  score identically to the old top under every roster the game can currently
  produce.

The true answer is a third thing: **the ladder grew in a region the valuation
cannot distinguish, behind a gate the cap itself holds shut.** The 680/680
green was honest. The vacuity smell was also correct. Both, because the change
is inert *by construction* rather than by accident.

Also uncovered, and arguably the bigger finding, because it is about behaviour
that shipped long before this slice: **the founding six-head limit does not
survive its first election.** 8/8 towns voted to 0. Matt's ruling was "keep 6 as
a rung, add higher ones" and "the starting condition should be 6 staff"; the
towns are repealing it unanimously within 30 days.

The non-owner table above says this is not bad luck. Every crab without a till
votes NO LIMIT — by tie-break if they hold a wage job, by a real -18 if they do
not — and they outnumber the owners in every roster the game produces. The
repeal is not a close-run thing that happened to go one way eight times; it is
the arithmetic's fixed point.

Whether that is the policy working as designed (a limit is *supposed* to be
arguable, and "nobody but shop owners wants a hiring cap" is a defensible
politics) or an unintended consequence of `capStake100` only modelling the
owner's side of a labour policy, is a **design question for Matt, not an
agent's call**. It is not ruled on in design/cs35-rulings-2026-08-24.md, so it
is not ruled at all. Filed as a decision rather than guessed at.

## What must NOT happen next

Do not "fix" this by widening, reweighting, or special-casing `capStake100` to
make the new rungs win. That is the loosening this project forbids (discipline
rule 4). The measurement says the ladder is inert; the honest options are to
leave it inert and say so, or to change the *design* — and the design belongs
to Matt.

One thing is safe to state plainly regardless: the slice's headline claim, that
it closes the "i cant specify more than 6 staff" bug Matt reported from play, is
**still true**. The player's campaign dial now offers 8 and 12. That is a UI
affordance and it works. What does not work is any *crab* ever wanting them.

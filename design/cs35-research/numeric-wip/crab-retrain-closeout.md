# THE CRAB RETRAIN — close-out (the act-early bias, found and removed)

**The ladder close-out named a cost and named a lever. The cost: the shipped
crab brain's disagreements with the script were dominated by ACT-EARLY, the
growth floor fell 13/48 → 8/48, and baseline lifetime tilted down in all
three blocks. The lever it proposed was class-weighted loss. The lever that
was actually needed sat one step upstream, and it was not a weighting at
all: the trainer was throwing away seven eighths of the wait class before it
computed any loss.**

Held-out agreement on the very corpus that measured the shipped artifact:
**95.71% → 97.82%**. Act-early on that corpus: **373 → 30** (2.30% of thinks
to 0.18%; 54% of the errors to 8%). Growth escapes: **8/48 → 14/48** against
a pre-neuro band of 13/48, measured against this tree's own pre-retrain
build. Nothing in the game changed. The only lever pulled was the artifact.

## The finding

`trainArtifact` downsampled `none` to three times the largest minority class.
On the v2 collection that is 45,175 wait rows cut to 5,733 — the net was
trained on a world where waiting is four times rarer than it is, and a net
told that waiting is rare acts. Measured on the v2 collection, everything
else held at the shipped recipe (42→24→7, seed 7, 25 epochs):

| `noneRatio` | held-out agreement | act-early |
|---|---|---|
| 3 (the shipped v2 recipe) | 95.711% | 373 |
| 6 | 96.277% | 161 |
| 12 | 96.751% | 88 |
| null — the sim's own prior | **96.936%** | **43** |

Class weighting works too and it is now available (`classWeights`, mean-
normalized over the training set), but it is the weaker half of the same
lever: weighting `none` ×4 on top of the v2 sampling cuts act-early to 167
and costs accuracy, because it distorts the loss instead of restoring the
distribution. Both knobs default to a no-op against v2, and
`trainArtifact({ noneRatio: 3, hidden: 24, epochs: 25, seed: 7 })` over the
v2-stage collection reproduces the shipped artifact BIT-FOR-BIT (w1, b1, w2,
b2, arch, shifts identical; 67,628 rows) — checked before and after every
change to the file.

## The data recipe: five levers instead of one

"Teacher coverage is the training distribution" was the ladder's own lesson,
learned when v1 shipped blind to price. Collection now carries a named stage.
`"v2"` is that frozen recipe. `"v3"`, the default, enumerates the levers the
economy pulls and makes the teacher's towns pull them, deterministically per
town seed:

1. **the shopfront mix** — four profiles (bare beach, kitchen, juice,
   promenade) at 1/8, 2/8, 2/8, 3/8, plus 0–4 extra tables and the grill and
   board upgrades. v2 ran half bare shacks and half full promenades, so
   `stop.open:arcade` was a town-level constant and the seating never moved.
2. **the price board** — half of every town's five boards off-default across
   the full 14..26 index (v2: a third). Measured on the corpus: `appeal.q16`
   now takes all twelve values at every stop; under v2 the shack saw six.
3. **the hours sign** — two fifths of the signs moved. `stop.open` used to be
   a function of the clock alone, so the net could learn the clock and never
   the sign.
4. **the wage** — the shack's board across the stepper's own 800..3400 band,
   set BEFORE the hire, because a shop that cannot recruit refuses the hire
   before the money moves.
5. **the town's standing** — `rep` across 0..90000, which is the crowding
   dial behind `stop.roomfor` and `room.free`.

48 towns × 14 days, **155,911 labeled crab thinks** (v2: 32 × 12, 67,628).
The arcade's share of the rows is the reason the profile mix is weighted
rather than uniform: a uniform quarter dropped `arcade:fun` to 0.2% of the
training rows and the class went with it.

## The artifact

`tools/neuro/receipts/brain-crab-v3.json` — **42 → 48 → 7**, R1 = 6, 2,352
int8 weights and 55 int32 biases, **2.6 KB**. Under the caps with room to
spare: 2,352 params against 32,768, 2,352 MACs against the 65,536 fuel cap,
hidden 48 against 256. Trained 40 epochs at lr decay 0.94, seed 11, the sim's
own class prior. Layer-2 headroom holds by the same argument as the 42-term
row: 48 · 127 · 32767 < 2²⁸.

**Held out on towns it never saw, four corpora, v2 → v3:**

| corpus | v2 | v3 | act-early v2 → v3 |
|---|---|---|---|
| the v2 collection's own held-out (16,251) | 95.711% | **97.816%** | 373 (2.30%) → 30 (0.18%) |
| the v3 collection's held-out (39,380) | 95.150% | **98.611%** | 1490 (3.78%) → 84 (0.21%) |
| a fresh v2-stage 12-town corpus (23,782) | 94.416% | **97.931%** | 983 (4.13%) → 84 (0.35%) |
| a fresh v3-stage 12-town corpus (28,373) | 94.015% | **98.301%** | 1315 (4.63%) → 75 (0.26%) |

The two fresh corpora were collected at a different seed base and used by
nothing during training or selection — they are the guard against having
tuned the held-out set. Act-early falls from 54–78% of the errors to 8–17%.
Per-class recall holds or improves on every class of the v2 corpus (none
97→100, shack:food 90→93, shack:drink 75→86, juicebar 76, hotel 90, arcade
55→62).

**In town, through the agreement-floor scenario's own instrument** (shadow
mode, the script deciding, the brain watching, identical states):

- seed 4242, four days, 727 thinks: **96.70% → 98.21%** (floor 90%, margin 8.21)
- a growth town (seed 1337, chef+table), six days, 1,156 thinks:
  **95.67% → 98.36%**, and the anatomy is the whole story:

```
  v2   50 disagreements:  ACT-EARLY 31   act-late  4   act-vs-act 15
       none->showers:clean 15, none->shack:food 8, none->shack:drink 7
  v3   19 disagreements:  ACT-EARLY  0   act-late  8   act-vs-act 11
       hotel:room->shack:drink 3
```

**Act-early is gone from the growth town entirely.** What is left is the
opposite and smaller error: the brain occasionally waits, or buys a meal
where the script books a room.

## The cross-engine receipt (the hard one)

Full logits stream, every int32 logit of every held-out row, FNV-1a hashed —
not just the choices, so a wrong intermediate that happens to keep the argmax
still fails.

```
crab v3, 39,380 v3 held-out rows : logits 15e00b09  choices c272c963
crab v3, 16,251 v2 held-out rows : logits 3281f3b1  choices f820f915
gull v3, 41,895 gull held-out    : logits 52fe39fd  choices f1c659c3
BIT-IDENTICAL across node/V8 scalar, zig-cc wasm and JavaScriptCore, exit 0
```

The wasm leg needed a bigger house to say this. Its memory was 4 MB with the
corpus at 262144 and the logits at 3145728 — room for 34,328 rows, which the
spike's 27,567 fit and this retrain's 39,380 would have silently overrun.
16 MB now, logits at 8388608, and `xcheck.mjs` refuses loudly with the number
instead of scribbling past the corpus. The rebuild is byte-identical apart
from the two changed constants and the shipped v2 artifact re-receipts
bit-identical over its own corpus on the new module.

## The first crossing is the old first crossing, uncrossing

**Seed 1337, think 9, tick T=1358 (day 1), visitor NIPPY** — the same think
the neuro ladder named. She is thirsty (809002 Q20) and the shack counter is
134px away; the hotel desk is 732px away and she has no room.

```
  v2 brain   hotel:room 361983  >  shack:drink 313651     -> the hotel
  v3 brain   shack:drink 348527 >  hotel:room  275729     -> the drink
  the script                                              -> the drink
```

Seed 4242's head is the twin: **think 7, T=1059, visitor FLO**, shack:food
438864 over hotel:room 347750 where v2 read 347471 against 405318. Same
candidates, same `visCandidates` draws, stream unshifted AT the crossing —
both sides are brains and both are draw-free, so the pairing argument the
ladder built survives a brain-against-brain trace unchanged.
`trace-crossing.mjs` grew `--old <artifact.json>` to do it:

```
node tools/neuro/trace-crossing.mjs 1337 4 --old tools/neuro/receipts/brain-crab-v2.json
```

"Guests settle in before they snack" is retired. Everything downstream
re-rolls behind those two different walks. Re-pointed behind the trace: the
frozen day-2 fingerprints (both seeds), the cultureways load-equals-boot
digest, and the draw-count spec 1857/2265 → 1863/1096. Day 2's swing is the
stream's own shape, not a leak — on that seed the script reads 2399, the v2
brain 2265 and the v3 brain 1096, with 20/21/20 arrivals and the town alive
in all three.

## The matrix battery — the growth floor is back

Interleaved per block against THIS TREE with only the artifacts swapped back
to v2, so the delta is the brain and nothing else. (`SIMLIB_KERNEL=wasm`,
main realm, `--jobs 10`.) The control reproduces the ladder close-out's
growth figure exactly — 8/48 as 1+3+4 — which is what makes the comparison
worth reading.

**Baseline, `--days 30 --seeds 16` × 3 blocks:**

|  | escapes | medians | lifetime |
|---|---|---|---|
| v3 (shipped) | 0 / 0 / 0 = **0/48** | 11 / 12 / 12 | $50,263 / $55,984 / $59,220 |
| v2 (control) | 0 / 0 / 0 = **0/48** | 11 / 12 / 12 | $52,808 / $54,383 / $56,263 |

Medians identical block for block. Lifetime −4.8% / +2.9% / +5.3% — MIXED
SIGN, which is the point: the v2 landing's baseline lifetime was down in all
three blocks (−3.0 / −7.9 / −4.2%) and that same-direction tilt is the
erosion pattern PLAN warns about. It is gone.

**Growth, `--days 40 --seeds 16 --buy chef,table` × 3 blocks:**

|  | escapes | medians | lifetime |
|---|---|---|---|
| v3 (shipped) | 4 / 3 / 7 = **14/48** | 13 / 13 / 18 | $128,371 / $111,641 / $185,821 |
| v2 (control) | 1 / 3 / 4 = **8/48** | 11 / 12 / 13 | $74,206 / $107,454 / $131,759 |
| pre-neuro (ladder close-out) | 4 / 3 / 6 = 13/48 | | |

Per-block signs **+3 / 0 / +3**, and lifetime up in all three (+73.0% /
+3.9% / +41.0%) — the mirror image of the landing this repairs. **14/48
against a pre-neuro 13/48: the floor the neuro landing cost the town is
back.** An honest caveat, in the spirit of the number it replaces: 6 escapes
over 48 is about 2σ on its own, and the case rests as much on the
same-direction lifetime tilt reversing as on the count.

The crab artifact alone (measured before the gulls were retrained) read
**11/48** as 3+3+5 with lifetimes +51.0 / +4.7 / +14.4%. The gull retrain
carries the rest.

## The pin that refused an artifact

The rivalry counter-lever scenario earned its keep. Two siblings of the same
recipe, same data, differing only in the training seed:

| artifact | held-out (v2 corpus) | act-early | dear / level / cut drinks, 12 towns |
|---|---|---|---|
| the script itself | — | — | 700 / 752 / 796, spread 96 |
| v2 (shipped before) | 95.711% | 373 | 724 / 739 / 847, spread 123 |
| seed 7 | 97.982% | 55 | **785 / 773 / 843, NOT monotone**, spread 58 |
| **seed 11 (shipped)** | 97.816% | 30 | **642 / 687 / 790, monotone**, spread 148 |
| seed 43 | 97.532% | 15 | 601 / 675 / 744, spread 143 |
| seed 71 | 97.785% | 60 | 702 / 752 / 758, spread 56 |

Seed 7 had the best aggregate agreement and over-bought at a DEAR board —
its price lever was flat where the script's is not. It did not ship. Seed 11
did, and its lever measures stronger than the script's own. Selecting a
training seed against a behavioral gate is legitimate exactly because the
gate is a player lever rather than a metric: "the artifact is the
requirement, the run is not" (the agents doc, §6), and every candidate is in
the table above rather than only the winner.

**The branch's history is that story, not a tidied version of it.** Commit
`0d0c673` lands the seed-7 artifact and quotes its 97.98%; the next commit
replaces it with seed 11 because the rivalry sweep refused it. What SHIPS is
seed 11 at 97.816%, and every number in this document is seed 11's.

The pin's own pool went five towns → eight in the same pass, and said why:
on the five-town pool the shipped artifacts read dear→level margins of 8 (v2)
and 7 (v3) against the script's 31 — a coin dressed as a measurement. At
eight towns the shipped brain reads 421/458/537. The instrument got stronger;
the claim did not move.

## Six stagings walked, each by its mechanism

None blanket-re-pointed. Each one is a fixture that had been passing on a
coincidence the new trajectory stopped supplying:

- **the failed-shop sale** measured the float off the buyer's pocket AFTER
  the settlement. REEF's hotel fills more slowly now, so he crosses
  price+RESERVE on day 5 instead of day 3 — and on day 5 he buys the showers
  and puts up a cabana for $80 in the same settlement. $14,239 at the deal,
  $6,239 by the end of the tick, float $11,092. It now measures ACROSS THE
  DEAL: `before − after === price − float`, exact, and immune to what else
  the night spends.
- **the furniture-forgets-its-guests pin** read the occupancy bit at a fixed
  six days. Seed 4242 reads 6,3,7,7,7,**0**,8,7 across its first eight
  midnights; day 7 is simply the one nobody stayed over. It waits for a guest
  now.
- **the drop-nudge control** allowed 60,000 ticks for a mechanism that fires
  in 210. Measured on seed 44: nudged at the counter, the errand comes at
  tick 210; dropped on open sand at the same thirst, at tick 14,760 — two
  sim-days on, at the 0.5 thirst cap, for reasons that have nothing to do
  with a nudge. Bounded to 2,100.
- **the shelter's bedtime** read the roll at 23:30. DRIFT and KELP are both
  still `toHome` at 23:30 on this night. It waits for them to get there, and
  once they do, KELP (the newcomer) is on the step on BOTH artifacts.
- **the wage-loan fixture** hoped a starved till would miss a payday. Payroll
  pays out of what is left ABOVE the rent reserve, so pinning the till only
  bites if somebody on the roster worked and clocked off after it — day 6
  gave CLAWDIA the day off. It starves one night at a time until a payday is
  actually missed and stops at the first: one missed payday on both
  artifacts ($6,400 v3, $2,300 v2, against a $9,000 line).
- **the shift-vs-sickness ratio** pooled two towns for a 0.4..2.5 band, with
  arms of n=44 and n=43 — inside the scenario's own stated noise of a third.
  It rolled to ×0.37. Six towns now, sample floor 60 → 180.

## The gulls, for free

The same recipe, applied to the gull corpus with the gull document's own
staging: `brain-gull-v2.json`, 42→48→7, R1 = 6, seed 23, 168,136 labeled gull
thinks. On the corpus that measured the shipped gull artifact at 94.88%:
**94.882% → 98.318%**, act-early **695 → 83**. On the v3 gull corpus,
95.283% → 98.950%.

Seed 23 over seeds 7 and 11 for the same reason seed 11 won for the crabs:
their `arcade:fun` recall collapsed to 50% for a tenth of a point of
aggregate agreement, and seed 23 holds it at 78% (the old artifact's was
75%). A class the artifact still has to serve is not a rounding error.

Free, as the mandate required: **suite green with no pin touched at all.**
The gulls sail at rep 60 and the frozen fingerprints are day-2 towns well
below their gate, so a gull's mind cannot reach them. The document is the
source and `cultureways.js` is regenerated from it.

## Gate receipts

```
node tools/suite.mjs --jobs 12                        289/289 exit 0  248.2s (vm)
SIMLIB_REALM=main node tools/suite.mjs --jobs 12      289/289 exit 0   69.8s
SIMLIB_KERNEL=wasm SIMLIB_REALM=main ... --jobs 12    289/289 exit 0   43.7s
node mcp/test-server.mjs                                38/38 exit 0
node tools/neuro/xcheck.mjs <crab v3> <v3 corpus>            BIT-IDENTICAL exit 0
node tools/neuro/xcheck.mjs <crab v3> <v2 corpus>            BIT-IDENTICAL exit 0
node tools/neuro/xcheck.mjs <gull v3> <gull corpus>          BIT-IDENTICAL exit 0
```

Green by name: the draw-count pin, the shared-cursor pin, the kernel-vs-
reference agreement, the integer-ness tripwire, the shadow-inertness pin, the
draw-free pairing pin, the caps door, the thinking-heads save round-trip, and
the agreement floor at 98.21% against its 90%.

`policy_distill` drives the new default recipe, so the MCP loop dogfoods the
improvement rather than inheriting the old one; the harness's 38 checks pass
on the artifact it produces.

Browser sanity on a fresh port (8993, and every in-page read guarded on
`location.port` — the shared browser is contended): BOTH retrained artifacts
load through `policyProblem` and it says null for each; both read live,
42→48→7, R1 6, held-out 0.9861 and 0.9895 in their provenance. With rep past
the roost's gate the town runs 7:00 → 11:00 with seven visitors ashore, three
of them gulls (FULMAR, HALYARD, WRACK), the till climbing $15,000 → $19,074,
and **zero console errors and zero warnings**. Nothing was staged into a save
slot, so the fresh-boot autosave had nothing to clobber. Picture (the
software renderer, contention-free): `crab-retrain-town.png`.

## Mutations, honestly (run after the commit, on a copy — no file touched)

The floor scenario's own instrument, seed 4242, four days, against the
shipped artifact:

| mutation | agreement | floor (90%) | day-2 fingerprint |
|---|---|---|---|
| none (shipped) | 98.21% | passes | `14420 / 52674 / …` |
| `w2` zeroed — the lobotomy | **85.56%** | **FAILS (bites)** | `0 / 25200 / …` (a dead town) |
| `shifts.R1` off by one | 98.07% | passes | `20565 / 58312 / …` (moved) |

**RECORDED AS NEARLY VACUOUS AGAINST THIS GATE:** a one-bit error in the
rescale shift costs 0.14 points of agreement and the floor never notices. It
is caught, but elsewhere — it re-rolls the town (the frozen fingerprints
bite) and it changes every logit (the cross-engine hash bites). The floor is
a lobotomy detector, not a numeric-recipe detector, and saying so is the
rule. Layered, like the caps.

## Lessons banked

- **Look upstream of the lever you were handed.** The close-out proposed
  class-weighted loss and the weighting does work; but the bias was a
  SAMPLING decision three lines earlier, and restoring the distribution beat
  re-weighting the loss on both agreement and act-early. When a net's errors
  all point one way, suspect its diet before its objective.
- **A held-out set you selected against is not held out.** Two corpora at a
  fresh seed base, used by nothing until the artifact was chosen, are what
  make the 97.8% a measurement rather than a fit.
- **A behavioral pin can refuse an artifact, and should be allowed to.** The
  best-agreeing candidate was the one that broke a player's price lever.
  Aggregate agreement is not a substitute for the town's own tests.
- **Fold, don't spread.** `Math.max(...rows.map(...))` blows the call stack
  past ~120k arguments and a collection is now bigger than that. Two files.
- **A memory map is a contract with room to run out.** The wasm leg's corpus
  region fit the spike and not its successor, and would have overrun in
  silence rather than failing.

## The devlog sentence (for the next entry)

The crabs learned to wait. Four in a hundred used to buy small and early —
a drink here, a shower there — where the reckoning said hold out for the fat
ticket, and the town's money quietly leaked toward the hotel desk and the
shower house; now it is fewer than two in a hundred, and none of them in a
growing town. NIPPY, who has been checked into the Driftwood at ten past
seven on the morning of the first day for as long as anyone can remember,
went and got her drink instead. Picture:
`design/cs35-research/numeric-wip/crab-retrain-town.png`.

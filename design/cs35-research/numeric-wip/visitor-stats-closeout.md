# VISITOR STATS — the diagnosis, the arrival state, and the bars that lied

**Directive (Matt, 2026-08-23, verbatim):** "tourists dont seem to have real
stats? and they come at 9%; they should come in some semi sane initilized
state and have same stats as citizens."

## THE DIAGNOSIS MAP (before anything changed)

Both halves of Matt's impression are real, and they have different causes.

**1. Tourists DO have real stats — the card's bars are unit-broken.**
Visitor needs live in the kernel-shared Q20 planes (VHUN/VTHI/VDIRP/VBOR/VTIR,
accessors at game.js:6083-6092; `Q20 = 1048576` "a full bar", game.js:24), and
the body machinery's BODYT rows drive their rates per culture. But `visBars`
(game.js:15764) still speaks the pre-Q20 dialect:

    const v = Math.max(0, Math.min(1, k[key] || 0));   // k[key] is RAW Q20

Any nonzero need clamps to v=1, so all five meters on the visitor card render
as one state regardless of the actual body. The bars have been dead since the
needs→Q20 slice; the sim underneath was always honest — the inspector's
BECAUSE rows (which decode registry units correctly) are where the real
values showed, and a fresh visitor's unloaded needs DO read ~8-13% there:
`visNeeds()` (game.js:12189) floors every need at qn(0.08) — Matt's "9%".

**2. The arrival state was authored flat and low.** `visNeeds()` gives every
need 8%-40% and then loads 1-2 needs at 55%-95% ("legible from the pier" —
a good mechanic, kept). But the 8% floor means a typical tourist steps off a
long ferry ride LESS hungry, thirsty and bored than the town's own crabs are
on the day they're hired (citizens init at qn(0.10)-qn(0.30):
game.js:5390/5401/5421 — the fisher arrives at 30% hunger, 30% tired).

**3. The model is ALREADY unified below the init.** Same five needs, same Q20
units, same planes, same per-culture BODYT rates (body-machinery slice). The
"different stats" impression was (1) + (2), not a shadow system. No dynamics
change was needed or made.

**Found in passing, NOT fixed here (another fork owns it):** the CREW card's
bar line (game.js:15906-15907) is unit-mixed — FED/SIP compute `1 - p.hunger`
on Q20 ints (large negative fraction → negative rect width → a red bar
painting leftward over neighboring UI) while CLN/FUN/ZZZ divide by Q20
correctly. This is almost certainly Matt's "weird red bar near the FED
indicator" bug, same left-behind-by-Q20 family as visBars. Reported to the
orchestrator for the red-bar fork.

## THE CHANGE

**Commit A (view, byte-neutral):** `visBars` reads the plane in its own units
— `v = clamp((k[key]||0) / Q20)` via a small `barFrac` helper the scenario can
bite on. No sim state touched, no draws, fingerprints identical.

**Commit B (sim, fingerprint-moving):** `visNeeds()` re-authored as a
per-need arrival table anchored to the citizen hire band:

    VIS_ARRIVE = { hunger: [qn(0.25), qn(0.30)],   // the ride was long
                   thirst: [qn(0.30), qn(0.30)],   // sea air
                   dirt:   [qn(0.10), qn(0.20)],   // they washed for the trip
                   bored:  [qn(0.20), qn(0.30)],   // a ferry is a bench
                   tired:  [qn(0.10), qn(0.25)] }  // depends who slept aboard

The 1-2 LOADED needs mechanic survives unchanged (55%-95%, the pier stays
legible). The draw STRUCTURE is untouched — same count, same order, same
sites — so every draw-count pin holds; only values move, which is the
fingerprint event, named below. Per-culture arrival inits are a natural
future `body` field (the seam is this table's dispatch point); engine-wide
defaults only in this slice, per scope.

## CEREMONY

**The first crossing, named** (tools/probe-arrival.mjs at the base+probe ref
0855863 vs the branch 7f3fec5; receipts in kube-runs/cs-visstats-probe-*):
seed 1337, day 1, tick 301 — ANEMONE steps off the 08:00 boat and her VHUN
plane writes 498352 (47.5%) where the base wrote 335787 (32%). Seed 4242,
same tick: ROE, same story. The alignment proof rides in the same receipts:
her LOADED need (thirst 903221), her wallet (10576), her name and her nights
are byte-identical across the trees — the loaded mechanic's constants and
every draw site are untouched; only the arrival table's authored floors and
spans moved. Draw-count pins hold by construction.

**The visual receipt**: devlog/img/2026-08-24-visstats-card.png — MISTY off
the seed-1337 boat, FLUSH, eating a fish taco, five meters reading five
different truths.

**The matrix, reported not tuned** (batch instrument, triple-16 both trees,
receipts in kube-runs/cs-matrix-triple16-{071143d,7f3fec5}-*):

| block | base 071143d | branch | note |
|---|---|---|---|
| baseline sb0/16/32 | 0/16 each (0/48) | 0/16 each (0/48) | intact |
| growth sb0 | 5/16 | 8/16 | |
| growth sb16 | 2/16 | 11/16 | mean lifetime 5238 -> 12117 |
| growth sb32 | 6/16 | 13/16 | |
| **growth total** | **13/48** | **32/48** | |

This is a LARGE economy event and it is the direct, honest consequence of
the directive: a boat of bodies that arrive hungry, thirsty and bored spends
like it. Nothing was tuned toward or away from it — the arrival constants
were authored to the citizen hire band and the matrix says what that costs
buys. The bot's floor more than doubled; whether that stands is the
operator's ruling at the gate. (If ruled too rich, the honest lever is the
arrival table's authored constants — a smaller anchor, not a mechanism
change.)

**Mutations, both biting on both backends** (focus receipts): demo 1 dropped
the meter's /Q20 — "half a stomach read 1, want 0.5"; demo 2 dropped the
gangway floors — "fresh hunger under its floor". Both reverted; tree
restored green.

## THE FULL BATTERY: 636/658, and every red walked to its class

The slice's own scenarios are green both backends and both mutations bit.
The full battery (kube-runs/cs-suite-318-888377d-c1oj) reds 11 scenarios ×2
backends — every one walked, none shipped past:

**A real bug, FIXED on this branch (and LATENT ON MAINLINE — upstream
regardless of this landing's fate):** the integer tripwire caught
`cust.target=1834.09765625` — vsepPush (personal-space) adjusted a stander's
pixel aim by `(x1-x0)/Q8` under an "exact: power of two" comment; exact is
not integer. Fixed here (Math.round, aim within half a pixel); the base tree
carries the same latent float and will trip the wire the first time a
parting hits a target-holding visitor on a pinned seed.

**Three pure pins, honestly moved, re-measure AFTER the anchor ruling:**
the rng day-1 draw count (1726 → 2207: hungrier arrivals think and buy
more), the frozen day-2 fingerprint, and the cultureways A/B day-3
fingerprint (its MECHANISM — with==without — is untouched; the pinned
literal moved). Their new values depend on the final arrival constants, so
harvesting them before the operator rules on the 13→32 anchor would buy a
second full ceremony if the anchor changes.

**Three economy-coupled stagings** (wage quit "nobody left", cpu-wage
"never moved her wage", closure soak "the shop never closed"): each is
force-staged already, and each rides going-rate/till context the doubled
economy shifted under it. They need their stagings re-derived against the
ruled economy, not looser assertions.

**Three mechanism walks owed** (also post-ruling, since their trajectories
re-shuffle with the constants): the election 3-3 tie (staged-coincidence,
re-stage per its own protocol), the sickness M-vs-E ×5.23 (roster
composition confound vs a real conditioned roll — decide by comparing the
roll sites, not the sample), and the two with real-bug potential: the
hotelier walking past a closer empty house (nearest-free-door mechanism vs
mid-walk vacancy timing) and the departures broke-door double-count (the
turn-away accounting may increment two counters when both are true — read
the counter sites before re-staging anything).

**The recommended sequence at the gate:** rule the anchor (as-authored, or
smaller) → one pin-harvest battery on the ruled constants → the six
re-stagings/walks above → one final green battery. One ceremony, not two.

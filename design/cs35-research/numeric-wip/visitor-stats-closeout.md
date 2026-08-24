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

(filled in as the gates run)

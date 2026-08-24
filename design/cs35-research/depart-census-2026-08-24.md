# The departure-card census

Matt ruled **"measure first, then rule"** on the ~52,000x depart-weight
inflation. This is that measurement.

Method: `tools/departcensus.mjs` via `experiments/departcensus.json`, counting
through the phase-D `settlementAggregate` hook. Receipts:
`kube-runs/cs-departcensus-e50b6b2-53w3`. Twelve towns, thirty lived days,
**4,399 departure cards**.

## What the cards say

| rule | cards | share | mood |
| --- | --- | --- | --- |
| hungry | 1834 | **41.7%** | sour |
| parched | 945 | **21.5%** | sour |
| grubby | 758 | **17.2%** | sour |
| bored | 385 | 8.8% | flat |
| weary | 228 | 5.2% | flat |
| nothing | 97 | 2.2% | flat |
| table | 55 | 1.3% | made |
| unspent | 40 | 0.9% | mixed |

Sixteen distinct winners. **Never won once:** `delight`, `foreign`, `missed`,
`mist`, `quiet`, `quits`, `wait`.

## The finding

**The five need rules take 94.4% of all cards, and the top three — 80% — are
all `sour`.** This is the inflation's gameplay consequence, and it settles the
question the E3 close-out left open: the float-era band comments at
game.js:18016 describe a card where needs COMPETE with circumstance, and the
shipped arithmetic produces a card where needs SWAMP it. The comment and the
code disagree, and the code is what players read.

## The part that is not just a distribution

**`delight` never wins. Not once in 4,399 cards.** It is the only `glad` rule
in the table — the one that says *"FOUND MY DISH HERE, OF ALL PLACES. I'LL SAY
SO AT HOME."* With `quiet` (*"A DAY BY THE SEA. I'VE HAD WORSE."*) also never
firing, the departure card has effectively ONE emotional register: complaint.

This is categorically different from the dead house-limit rungs Matt ruled to
keep. An unused *rung* is room for a culture that argues differently — a real
degree of freedom. An unused *emotional register* means the game's main
feedback surface can only ever scold the player, no matter how well the town
is run. A guest who ate well, bathed, played and slept indoors still leaves
blaming whichever need decayed furthest.

Note the mechanism: a need rule only fires when its need crossed the 0.85
threshold AND the guest never bought the answer (`meals == 0`, `drinks == 0`).
So these are genuine unmet needs — the town really did fail them. The question
is not whether the complaints are true; it is whether a card that is 94% unmet
need, and structurally incapable of saying anything glad, is the card the game
wants.

## The ruling this asks for

1. **Leave the arithmetic, fix the comment.** Needs dominating is intended;
   the bands are stale prose. Cheapest, zero behavioural risk, and honest as
   long as the comment stops claiming otherwise.
2. **Rescale the need weights toward the documented band** so circumstance
   rules (`wait`, `quits`, `missed`, `foreign`) can take a card. A real balance
   change: every departure card shifts, so it needs its own matrix and its own
   pins re-authored.
3. **Narrower: make `delight` reachable.** Leave the need weights alone and
   give the glad rule enough weight to win when a guest genuinely had a good
   stay. This addresses the register problem without touching the 94% split,
   and is the smallest change that stops the card being unable to say
   something kind.

Recommendation: **(3) first**, because it is the smallest change that fixes the
thing that is arguably broken rather than merely lopsided, and it can be
measured with this same census in minutes. (2) is a bigger argument about what
a departure card is FOR, and belongs with the economy trio's matrix rather than
as a side effect of a transcription slice.

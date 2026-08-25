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

**`delight` never wins. Not once in 4,399 cards.** It is the rule that says
*"FOUND MY DISH HERE, OF ALL PLACES. I'LL SAY SO AT HOME."*

> **CORRECTION, added at `bae1786` after re-measuring.** Receipt:
> `kube-runs/cs-depart-fullcensus-inpod-bae1786/` — same seeds, same method,
> full histogram instead of a top-8, reproducing the table above to the card.
> The three sentences
> that stood here were wrong, and are struck rather than quietly deleted so the
> error stays legible:
>
> - ~~"It is the only `glad` rule in the table"~~ — **false.** Four rules carry
>   mood `glad` (`delight`, `bed`, `top`, `regular`) and two carry `made`
>   (`table`, `spentup`).
> - ~~"the departure card has effectively ONE emotional register: complaint"~~ —
>   **false.** Glad+made won **66 of the 4,399 cards (1.5%)**: `table` 55,
>   `spentup` 8, `bed` 1, `top` 1, `regular` 1. Rare is not absent.
> - ~~"A guest who ate well, bathed, played and slept indoors still leaves
>   blaming whichever need decayed furthest"~~ — **false, and it was the
>   load-bearing sentence.** `visQuote` is a pure function of a row, so that
>   guest can simply be built and asked. With every need pegged at a full bar
>   (Q20) but the answer to each one bought, the shipped table returns mood
>   `made`: *"SPENT EVERY DOLLAR OF MY $14100. WORTH THE CROSSING."* The same
>   row with the purchases removed goes sour. **Each need rule requires its
>   matching purchase count to be zero** (`hungry` wants `meals === 0`), so a
>   guest who bought the answer cannot be scolded for that need at all.
>
> **How the error happened, because the mechanism generalises:** this tool
> prints only `top: ranked.slice(0, 8)`. The glad and made winners all sit below
> that cutoff, and *absent from the top 8* was read as *never won*. The tool's
> own `rulesThatNeverWon` field was correct the whole time and does not list
> them. **A histogram's tail is not a zero — check the cutoff before writing
> "never".**
>
> What survives unchanged: the 94.4% need share, the 80% sour top three, and
> `delight` never winning once. And the sharper version of the real finding is
> below — for a **crab** guest `delight` is not merely rare but *unreachable*,
> since `tasteW` returns exactly 1 for a crab against a `>= 1.5` gate.

This is categorically different from the dead house-limit rungs Matt ruled to
keep. An unused *rung* is room for a culture that argues differently — a real
degree of freedom. A glad register that is reachable in principle but wins 1.5%
of cards is a *balance* question; a glad rule no crab can ever trip is a
*structural* one, and only the second is a defect.

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

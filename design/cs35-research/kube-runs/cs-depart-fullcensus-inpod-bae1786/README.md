# Departure census, FULL histogram — the receipt behind the correction

Run in-pod (project `cs`, gasboat fleet) at `bae1786`, default vm realm, ~19 min.
Twelve towns × thirty days, **4,399 cards**. This is the receipt for
`kd-6V9DDm4Cqm` and the corrections in commits `b3a6b4a` / `531ac58`.

Method identical to `tools/departcensus.mjs` — same `settlementAggregate` hook,
same twelve seeds, same `juicebar`+`table` buys — with one difference that is
the entire point: **it prints every winner instead of the top eight.**

## It reproduces the published census exactly

| rule | this run | published (`depart-census-2026-08-24.md`) |
| --- | --- | --- |
| hungry | 1834 (41.69%) | 1834 (41.7%) |
| parched | 945 (21.48%) | 945 (21.5%) |
| grubby | 758 (17.23%) | 758 (17.2%) |
| bored | 385 (8.75%) | 385 (8.8%) |
| weary | 228 (5.18%) | 228 (5.2%) |
| nothing | 97 (2.21%) | 97 (2.2%) |
| table | 55 (1.25%) | 55 (1.3%) |
| unspent | 40 (0.91%) | 40 (0.9%) |

Same 16 distinct winners, same 7 never-won. **So the distribution was never in
dispute** — only the conclusion drawn from it. Run twice, byte-identical output
both times: this is deterministic, not a sample that happened to agree.

## What the top-8 cutoff was hiding

Everything below `unspent` — which is where every remaining glad and made rule
lives:

    idle    30  0.68%  flat
    rough    9  0.20%  sour
    spentup  8  0.18%  made
    dues     4  0.09%  mixed
    quit     3  0.07%  sour
    regular  1  0.02%  glad
    top      1  0.02%  glad
    bed      1  0.02%  glad

## Mood totals — the claim that was actually wrong

    sour   3549  80.68%
    flat    740  16.82%
    made     63   1.43%
    mixed    44   1.00%
    glad      3   0.07%

**Glad + made = 66 of 4,399 = 1.5%.** The write-up said the card had "ONE
emotional register: complaint" and that `delight` was "the only glad rule". Four
rules are `glad` (delight, bed, top, regular) and two are `made` (table,
spentup); five of the six won at least one card.

Note that `sour 80.68%` and `94.4% unmet need` both stand. The card really is
overwhelmingly a complaint — it just is not *only* one, and "rare" and "absent"
need different fixes.

## The sentence this run did NOT need to refute

The load-bearing claim — *"a guest who ate, bathed, played and slept indoors
still leaves blaming whichever need decayed furthest"* — needed no sampling at
all. `visQuote` is a pure function of a plain row, so that guest can simply be
constructed and the shipped table asked. With every need pegged at a full bar
(Q20) but the answer to each one bought:

    mood "made" — "SPENT EVERY DOLLAR OF MY $14100. WORTH THE CROSSING."

The identical row with the purchases stripped goes `sour` ("HUNGRIER THAN I GOT
OFF IT"). Every need rule requires its matching purchase count to be **zero**,
so a guest who bought the answer cannot be scolded for that need.

**A distribution can only tell you a thing is rare. A constructed input tells
you whether it is possible.** For a structural claim, build the case.

## What survives, and what it means for the ruling

- 94.4% of cards are unmet need; the top three (80%) are all sour. Unchanged.
- `delight` never won once in 4,399. Unchanged.
- Sharpened: for a **crab**, `delight` is not rare but **unreachable**, by two
  independent locks — `de` is written only for a non-crab guest
  (`game.js:13453`), *and* `tasteW` returns exactly 1 for a crab against that
  site's `>= 1.5` test. Either lock alone defeats a gate change.

That structural fact is the ground ruling 6 (`kd-utEb1SjsX8`) actually rests on,
and the correction leaves it standing.

## Reproduce

    node tools/departcensus.mjs --towns 12 --days 30

The tool now prints `everyWinner` + `moodTotals`; the `slice(0, 8)` that caused
the error is gone. Sanity-check it sees cards before trusting any histogram —
known-good control `--days 4 --towns 1` reads 35 cards / 7 winners.

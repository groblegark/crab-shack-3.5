# numeric slice 3 (needs -> Q20) — STATE OF PLAY, NOT A LANDING

**SLICE 3 IS NOT LANDED.** The conversion is substantially done and every
commit is on `cs35-numeric-s01`, but the suite is **246/254** and the
16-seed matrix shows a **structural regression**, not a chaotic reshuffle.
Do not merge. This file is the handoff.

## What IS converted and holding

Every 0..1 need (hunger/thirst/dirt/bored/tired) is an int 0..2^20. The unit,
`Q20`, and the authoring boundary, `qn(f) = round(f * Q20)`, live at the top of
game.js next to GMIN. Authored fractions cross at their READ site exactly as
slice 1's author-dollar tables cross x100; what the sim STORES and computes on
is integers.

Converted: the visitor per-tick accrual; the crab event bumps; the sleep, nap
and hotel-bed drains (as exact rationals — bed 0.30/gh is `t*dtT/1000`, cot
0.10/gh `t*dtT/3000`, nap 0.24/gh `t*dtT/1250`); every threshold constant
(TAP_*, SOUP_*, BALL_*, CHAT_*, WANDER_AT, NOD_AT, ROUGH_AT, SHUN_AT,
BERTH_AT, SHIMMER_AT, WALKOUT_AT, BORED_YIELD, DRAG_*, LABOR_CFG, VIS_WANT);
the persona seeds; the visitor mint (same draws, same order, bounded ints);
`crabEff`'s two ramps; the charm multiplier in the tip product; the need bars
and dossier displays; and a staged `needsEnvelope` migration on the same `_num`
counter cents and ticks use (SAVE_VER 3, and the legacy `sandy` field crosses
on this stage or a legacy town wakes at 1e-6 tired).

## THE ROUNDING MEASUREMENT (the question slice 2 left open) — ANSWERED

Per-tick accrual constants are baked with **round-half-up, NOT floor**, and
this is the one decision in the slice worth carrying forward.

At 300 ticks a game hour, from the authored per-hour rates:

| need | exact q20/tick | floor | error | nearest | error |
|---|---|---|---|---|---|
| hunger | 401.954 | 401 | −0.237% | **402** | +0.011% |
| thirst | 192.239 | 192 | −0.124% | **192** | −0.124% |
| dirt | 314.573 | 314 | −0.182% | **315** | +0.136% |
| bored | 157.286 | 157 | −0.182% | **157** | −0.182% |
| tired | 167.772 | 167 | −0.460% | **168** | +0.136% |
| **total** | | | **−1.19%** | | **−0.02%** |

**Flooring runs every one of the five rates slow, all in the same direction:
needs accrue 1.19% slower, which is a town that is quietly easier, bought by
arithmetic and provable from the constants alone — no seeds, no chaos, no
argument about noise.** Nearest rounding lands at −0.02% with mixed signs.
The format table's own worked example (0.115/hr -> 402) is the nearest value,
not the floor, and the contract permits round-half-up at a named unit
boundary — which a per-hour-to-per-tick rate bake is.

This is the cumulative-erosion trap in its arithmetic form: each slice that
floors a rate pays a fraction of a percent, every one in the easy direction,
and each is individually defensible. **Every later slice that bakes a rate
should run this two-column table before choosing, and say which it chose.**

The decay drains floor the amount REMOVED rather than the level, so a rounding
never invents rest that was not slept — the opposite direction, deliberately.

## THREE REAL BUGS THIS CONVERSION FOUND

1. **`BORED_YIELD` stayed a float.** `boredYields()` compares it to a need, so
   it fired for ANY nonzero Q20 need and no crab ever chatted or played ball
   again. The suite caught it as "boredom never moved down at all".
2. **`_dragRamp`'s span went negative.** `(v - at) / (1 - at)` with `at` in
   Q20 is a negative denominator; the trudge multiplier became nonsense and
   the whole sim ran ~2.5x slower in wall time (the suite went 108s -> 406s,
   which is how it was noticed).
3. **`needLevel` returned two different units** — Q20 for a real need, a 0..1
   float for a vote — and the errand score ADDED it to a rank of 1..4, so a
   converted need swamped the ranking outright. Both errand scores (crab and
   visitor) now ride every term in need units: the pre-slice score x Q20, term
   for term, so the argmax is unchanged.

Same lesson as 1a's founding tills and 2a's hidden timers, one rung further
out: **in a unit conversion the dangerous value is the one that never looked
like it had a unit** — and a threshold constant is exactly that.

## WHAT IS STILL WRONG — the handoff

Suite **246/254**. Two of the eight are the frozen day-2 fingerprints, which
this slice's re-baseline legitimately re-points; the other **six are genuine
regressions** and were VERIFIED to pass on the pre-slice tree (33bebb1) by
running them in a scratch worktree — they are mine, not flakes:

- `taps: nobody in a full town is left parched for a week` — a crab spends 6.4
  days in the parched band.
- `shortcut home: sleeping rough banks nothing` — a rough sleeper woke at 0.65
  when the street must repair nothing (the rough arm's crab is reaching a bed).
- `tables can never wedge` — a table sat dirty 146 staffed sim-seconds.
- `rivalry: her interest builds from HER OWN books` — a rival with empty books
  reaches intent 0.62.
- `a bowl is bought from the shack at a price` — the pot books $1600 of
  ingredients where three bowls cost $600.
- `cpu hours: SUDSY's policy converges` — seed 1337 drifted.

**And the matrix says the same thing louder.** Baseline `--days 30 --seeds 16`
holds the floor at **0/16** and median eviction 13 (was 12, inside ±1), but the
structure underneath moved hard:

| | slice 1 | slice 2a | slice 3 (now) |
|---|---|---|---|
| roomLets | 1117 | 1159 | **528** |
| unhoused | 490 | 485 | **959** |
| hotelier arrivals | 14/16 | 15/16 | **3/16** |
| purse | $17,668 | $19,220 | **$7,174** |

Room lets halved, unhoused doubled, the hotelier stops arriving in 13 of 16
towns. **That is not a trajectory reshuffle — something in the accommodation /
visitor-stay path is still reading a need in the wrong unit.** The hotelier
collapse and the roomLets collapse are one symptom, and `wantsRoom(k)` /
`roomReserve(k)` / the overnight decision are where to look first: they sit on
the visitor path, they gate room demand, and the visitor need fields were the
last surface converted. Do NOT re-baseline the fingerprint or run the growth
matrix until that is found — a re-baseline taken over a live regression
launders it into the pins permanently.

## WHAT IS NOT DONE

Nothing past the suite: no conservation soak, no growth matrix, no receipted
fingerprint re-baseline, no refreshed cross-engine receipt, no SLICE LEDGER
entry. The ledger deliberately still reads "3-6 not started" — slice 3 has not
earned its row.

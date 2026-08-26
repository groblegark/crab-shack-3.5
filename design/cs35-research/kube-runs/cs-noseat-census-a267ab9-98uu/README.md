# NO-SEAT CENSUS — measured at main tip a267ab9, 2026-08-26

Captain cs-schedule-trigger-17-2-98uu, 21:17 fire. Probe: `tools/noseat.mjs`.
Run in-pod (cluster compute; the local ban protects the operator's Mac).

## The question

Bead kd-VJun0LAYHG (Matt: "a mechanic where crabs go somewhere to eat if no
table, and socialize") lists three unknowns an implementer must not guess. The
first: *does it queue, stall, or silently drop the intent?*

## The answer — none of the three

`serve()`'s counter branch (game.js:14448, entered at `stC === VS.waiting`)
rings up the sale FIRST. `payAndBenefit` zeroes the need and credits the till.
Only then does `pickSeat` run, and a null seat sets `stC = VS.leaving`.

So an unseated guest **has already paid and already been fed**. The intent is
not queued, not stalled, not dropped — it is completed, and only the SEAT is
missed. `pickSeat` returns null only when no table is free AND clean
(`!t.occupant && t.dishes === 0 && !t.dirty`), so a table awaiting busing counts
as no table. `TABLE_BASE = 2` (game.js:5596).

**This inverts the bead's own unknown #2.** It frames overflow as "a demand leak
OUT of the player's shop". There is no leak today — the shop banks the sale
either way. Routing crabs elsewhere would REMOVE revenue the player currently
keeps. The feature starts from a worse position for the player, not a better one.

## What a miss actually costs

Traced, after a wrong first answer (see the correction note below):

1. **The table tip** — game.js:16486, a separate payment made when `dining`
   ENDS, out of the guest's own pocket, `tableTipOf(k)` (`TABLE_TIP` = 900
   cents, culture-overridable via `md.tableTip`, game.js:9850). A guest who
   never sits never reaches `dining`, so it is never paid. Tourists only — the
   block is inside `if (!k.isCrab)`.
2. **Reputation** — `repAdd(culture, 800)` for table service (:14433) against
   `repAdd(culture, 400)` at the counter (:14451). Exactly half.
3. The dining dwell, and the dirty table and busing work it would have made.

CORRECTION, recorded because the wrong version was posted first: this is NOT the
counter/table tip split. `seated` in `payAndBenefit` is
`stC === VS.seatedWaiting`, which belongs to the OTHER `serve` branch
(game.js:14429). In the counter branch `stC` is still `waiting` at ring-up for
everyone — including guests who DO get a table. Reading `MGMT.C20` as the cost
of a missed seat conflates two branches of one function. Discipline rule 5: I
compared the two paths' return (guest fed, till credited) and read that as
equality of behaviour, when the difference was in what each did on the way out.

## The rate — 12 days x 16 seeds, two blocks

Per CLAUDE.md an 8-seed block is a coin, so the honest number is both blocks.
They agree closely.

| block | noSeatCrab | seatedCrab | noSeatTour | seatedTour |
|---|---|---|---|---|
| seedbase 0 | 4 | 151 | 26 | 771 |
| seedbase 8 | 3 | 176 | 25 | 818 |
| **combined** | **7** | **327** | **51** | **1,589** |

- crab covers unseated: 7 / 334 = **2.1%**
- tourist covers unseated: 51 / 1,640 = **3.1%**

Never zero on any seed, present in both blocks, tourist-weighted (~7x the misses
in absolute terms and at a higher rate). `noTablesCrab`/`noTablesTour` are 0/0 in
both blocks, so every miss is a genuine "all tables busy or dirty" at a shop that
HAS tables.

An interim figure of "3-5%" was posted from the first four seeds of each block
while the census was still running; the settled figure above is lower and
supersedes it.

Also: `seatDecline` = 1 and `seatSatAnyway` = 3 across all 16 seeds. That is the
`tableShunned` path (a guest declining a table beside a filthy server, then
sitting anyway rather than being stranded) firing ~4 times in 16 town-fortnights
— close enough to never that nobody should reason about it from intuition.

## The mutation demo (discipline rule 2)

`ctl.txt`. Give the shack every table it can buy (`UPS.table.lvl = 4` → 6 tables
instead of 2) and move nothing else. 12 days, seeds 1337-1340:

| | as-shipped (2 tables) | control (6 tables) |
|---|---|---|
| noSeatCrab | 4 | **0** |
| noSeatTour | 15 | **0** |
| seatedCrab | 76 | 90 |
| seatedTour | 405 | 456 |

All 19 misses go to zero and seated counts rise. So the probe tracks table
scarcity and nothing else, in the right direction, naming the right cause. Had
it not moved, the 2.1%/3.1% would have been counting something misnamed — which
is the failure discipline rule 3 exists to catch.

## Method

Read-only by construction: samples only fields the engine already wrote, never
calls `srand()` or re-evaluates a gate, per the `idleaudit.mjs` lesson about
perturbing the very stream you are measuring. A visitor object is reused across
visits, so counting is per SERVED EPISODE via a stamp on
`si|biz|orderIdx|stC` — without it a guest lingering in `leaving` is re-counted
every sampled tick.

No `game.js` change, so no behaviour moves.

## Files

- `ns-sb0.txt` — seedbase 0, 8 seeds x 12 days
- `ns-sb8.txt` — seedbase 8, 8 seeds x 12 days
- `ctl.txt` — the 6-table mutation control, 4 seeds x 12 days

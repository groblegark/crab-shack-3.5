# SLICE 2 CLOSE-OUT — CLOCK → master integer tick

**2a is LANDED. 2b's quantizer landed with it. The slice stays OPEN on one
human play-test gate.** Suite 253/253 exit 0. Floor unmoved on both matrices.

## What converted

- [x] **the master clock**: `T` (absolute tick) and `tday` (tick of day, 0..7199).
      20 ticks a real second, 5 a game minute, 7200 a day.
- [x] **`tmin` and `tdgm` are DERIVED, never accumulated.** `tmin` is the tick of
      day floored to whole game minutes — the domain's own grain, and what all
      ~100 shop-hours and shift gates are written in. `tdgm` is deci-minutes,
      two a tick, for the three readers that are RAMPS rather than gates.
- [x] **sim `time` is dead.** Its six sim consumers took the integer tick
      (`earnHist` stamps, the cot-roll cache key, the days-off memo stamp); its
      49 draw consumers took `viewT`, a float projection the view is entitled to.
- [x] **all 42 `-= dt` timers**, plus five the census's count missed.
- [x] **the game-minute family** — `chatCd`, `ballCd`, `countT`, `bounceT`,
      `otMin`, `mistMin`, `ferryT` — and `restT`, which was hours.
- [x] **`mistPeak`** → a baked 257-entry Q16 table with a linear step across the
      low 16 bits, rolled once a day at midnight. The sim's LAST `Math.pow`.
- [x] **heat shimmer's phase** → BAM16 off the master tick.
- [x] **save migration** `_num: 2` for the four persisted clocks.
- [x] **`setClock()`**, the clock's one setter, because `tmin` is a projection now.

## Two things worth carrying

**A unit conversion's dangerous value is the one that looks like it has no
unit — and this time it was five of them.** The census counted 42 `-= dt`
timers. Five more durations were assigned in seconds and never counted: the
fishing cast interval (`9 + srand() * 13`, which set casts to 9 TICKS instead
of 9 seconds and landed **493 fish in a day** against a normal 34), the 35 quip
bubbles in their object literals, `DETOUR_T`, `castT`'s default, and the ballot
count's own `B.countT -= COUNT_MINS` — whose *comparison* I converted and whose
*decrement* I did not, so the count read four papers where it should read one.
A decrement and its comparison are one unit decision and must be edited as one.

**The float clock had a real bug in it and the fixture had been freezing it.**
A `tmin` advanced by 0.2 a tick overshoots 1440 by 1.9e-10 every day and carries
the residue across every midnight, forever. Nothing in the suite could see it.
It is gone: day 3 opens at tick 12300 on the nose.

## Verification (protocol §2)

| # | check | result |
|---|---|---|
| 1 | floor pinned on the landing tree FIRST | baseline 0/16 median 12; suite green |
| 4 | suite, mechanisms first | **253/253, exit 0** |
| 5 | conservation soak | **EXACT** — 173 movements, every `delta === want` |
| 6 | matrix floor "unmoved" | baseline **0/16 exact, median 12**; growth **4/16** — both identical to slice 1 |
| 7 | fingerprint LAST, with the receipt | both pins re-baselined, drift TRAJECTORY-shaped and attributed |
| 8 | save migration | `_num: 2`, staged behind slice 1's; roundtrips green |
| 9 | cross-engine receipt | **both seeds BIT-IDENTICAL under JavaScriptCore**, whole fingerprint |

**On the fingerprint drift, honestly.** It is large — 4242's coins 11191 →
19152 — and it is *not* rounding-shaped. Every duration is a whole tick and each
one floors, so a task is up to 0.05s shorter than its float twin; in a chaotic
town that re-rolls which crab is standing where at 7am. The protocol predicted
exactly this for the clock ("blast is trajectory-order only") and named the
matrix, not the fixture, as the referee. **The matrix did not move**: 0/16
exact, median 12, on both sides, with the eviction spread barely shifting. A
slice that had made the game easier would have moved that number.

## Three scenarios re-pointed, and what each mutation actually did

- **hotelier: her board moves with the house** — `goingRate()` is a max, and the
  town's elected wage FLOOR reaches it through `peerWage`. Slice 2 re-rolled
  this town's election, the mayor it returned sets a $32 floor, and a $32 floor
  swallows a hotelier bidding $21.50 → $23.50. `_noFloor` (CLAUDE.md's narrow
  flag) is armed for the READ only. **Mutation bites**: hide the hotel from
  `townWage` and it fails on her raises not moving the town.
- **cpu wage: converges and never thrashes** — the old gate allowed one move
  after day 22 and the trajectory left two, both RAISES, chasing a town rate
  that had itself moved. The gate now asks whether she REVERSES late, which is
  what the title claims. **Two mutations bite** (both on clauses above this one:
  dropping the cooldown, unguarding the trim).
- **routes: a meal ON THE WAY** — re-pointed from one seed to a five-town
  majority, **and its mutation does NOT bite, which is recorded in the scenario
  rather than hidden**. Pinned to seed 909 it read PASS before this slice and
  FAIL after; across five seeds the same build passes three and fails two — and
  so does the build *before* the slice (909/1337/77 clean before, 4242/21/77
  after). Two mutations against the mechanisms it names (`errandDetour` → 0,
  `anchorX` → always home) leave the result at 2/5, unchanged, because the
  staged town has exactly one food stop and scoring cannot change the choice.
  **It is not currently a guard on chaining.** Slice 4 reworks this geometry and
  owes it an assertion that bites.

## What slice 2 still owes

**The human play-test gate** (risky-decision 4). The browser runs on quantized
whole ticks; no automated referee covers browser FEEL at the speed chips. The
suite proves the *rate* is right at every cadence a screen actually runs at
(60/30/144/20/10Hz all exactly real time, and a 5Hz stall runs at HALF speed
rather than teleporting — the 100ms clamp is the spiral-of-death guard). It
does not prove 6x still feels like 6x.

**Deliberately deferred, with its dependency named**: the Gaffer-style render
INTERPOLATION. Interpolating a rendered frame between two sim states needs the
sim/view split, which the design already places before slice 4. The quantizer
half of 2b is landed because 2a could not run in a browser without it.

## Next: slice 3, NEEDS → int Q20

One landing, per the protocol; the band scenarios absorb it. It also collects
the two float-derived factors still crossing into the tip product's Q16 (the
patience ratio and the charm multiplier), which slice 1b left standing at one
named line.

# INTERRUPTIBLE COMMITMENT — the close-out

**Ruled by Matt (2026-08-23): "agreed; plan it and do it"** — after the finding
that sparse thinking is the actual reason the engine-owned rails exist. Actors
get the chance to change their minds mid-commitment. This is the enabling rung
of the whole-life-mind epic (kd-PQenNzQYEY): the rails cannot come down until
a crab can notice she is starving mid-stride.

## THE MECHANISM TODAY (the inventory)

- **Visitors** think on `k.thinkT` timers ONLY in roam: `VIS_THINK = 1.6s`
  (game.js:12007), decremented at game.js:13124, decider dispatched at
  13137-13151 (the WHO DECIDES block: live brain > kernel > script, shadow
  observing). The timer is UNTOUCHED in `VS.toBiz` (13105-13122), `arriving`,
  `waiting` (patience drains instead, 13447+), and all service states. A
  committed visitor never reconsiders: she can cross the whole promenade to a
  shop that a rival just undercut, and stand in a slow line while the taps
  run free.
- **Citizens** think only at `pickErrand`'s event sites (9908 after-shift,
  9923 fisher break, 9958/10619 home-loop, plus `afterErrand`'s chain) —
  task boundaries. `DS.toErrand` (the walk to the line, updateErrand
  10640-10668) never re-decides; the DIRE emergency response therefore had
  to be a hardcoded rail (`citEngineOwned`) because the brain literally
  could not be asked mid-errand.
- **Sunk-cost bookkeeping**: giving up in a line is `stayQuit` (quits++, the
  card says GAVE UP WAITING); the wait itself banks via `stayWait` into
  `waitMin`. A change of mind is NEITHER — the wait is real (banked), the
  dissatisfaction is not (no quit). The live REPUTATION sibling is making
  quits/walkouts rep sinks, so this distinction is now load-bearing.

## THE DESIGN

- **Cadence**: `VIS_RETHINK = 5s` (between the directive's 4-6s), armed by
  `visGo` at every commitment, re-armed at each re-think. Slower than roam's
  1.6s on purpose: commitment deserves inertia. SEAM: the manner design's
  `arrival.thinkDs` is the culture knob for this constant; manner had not
  merged when this slice landed, so the constant stays engine-side with the
  seam named at the definition.
- **Where re-thinks run**: `VS.toBiz` (walking) and `VS.waiting` while
  `!k.claimed` — never during `arriving` (she is steps from her place),
  never once claimed/served (being served is genuinely committed), never in
  a room. Citizens: `DS.toErrand` (the walk) only — a queued citizen proxy
  ("locals will wait") is a named seam, not this slice.
- **The judge (hysteresis)**: the decider that owns the surface proposes
  (script, kernel, or live brain — the same WHO DECIDES dispatch as roam);
  the REFERENCE SCORER judges the switch. A switch happens only if
  `4 * newScore > 5 * currentScore` — the challenger must beat the
  incumbent by 25%. For visitors the judge is `visScoreOne` (visPick's own
  per-candidate valuation, extracted so pick and judge share one set of
  books); for citizens it is `errandScore`'s exact rationals through
  `ratGt(4*n2, d2, 5*n1, d1)` — integer, cross-multiplied, overflow-safe.
  Rationale for judging brain picks with the reference scorer: the brain
  owns WHAT she wants; whether a mid-course correction is worth the sunk
  walk is an economic question, priced the same for everyone. The margin is
  one rule for every decider, which is what the directive ordered.
- **Natural stickiness rides free**: scores divide by detour, so the
  incumbent strengthens as she approaches it and rivals weaken — the 25%
  margin is on top of geometry that already favors finishing what you
  started.
- **Abandonment semantics** (`visAbandon`): bank the wait (`stayWait`, no
  quit stamped), release a held-but-unserved hotel room (mirrors
  `visAfterCounter`'s exact condition), clear the pipeline fields, and let
  `visGo` re-commit in the same tick. Queue membership is derived from
  state, so leaving the line is leaving the state; a later rejoin takes a
  fresh ticket (`queueJoin` at arrival). The DIRE door: a citizen walking
  to the arcade who goes desperate mid-walk now switches to food through
  plain scoring — `errandScore`'s DIRE branch dwarfs any normal score — with
  `citEngineOwned` untouched (the rails stay up this slice; this is the
  mechanism that lets them come down later).

## DRAWS AND THE FINGERPRINT

Re-thinks gather candidates, and gathering consumes draws — these are new
draw sites (toBiz, waiting, toErrand), counted-stream only, and the slice is
fingerprint-moving with the full ceremony. `window._norethink` is the
arm-off hatch (`--norethink` on headless) for attribution. Behavioral
side-effect, documented: `stayBlocked` counters (shut/full/broke) accrue on
re-think gathers too, so departure cards name a blocked reason somewhat more
often — the card is now quoting a guest who wanted the thing MORE OFTEN,
which is honest.

## FIRST CROSSING

(to be filled from the seed-1337 trace)

## THE DITHER NUMBER

(to be filled: switches per actor-day, staged and measured; the pin bounds it)

## MATRIX

(to be filled: triple-16 baseline + growth, branch vs base 071143d, per-block)

## GATES

(to be filled)

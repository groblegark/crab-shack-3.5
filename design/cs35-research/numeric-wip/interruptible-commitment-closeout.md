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

## THE SYMMETRY LESSON (this slice's keeper)

The queue re-think's first home was the JS shuffle block - and under the
kernel, queue states belong to `cust_step`, so the exit ran on ONE backend
only. The stream forked immediately and measurably: seed 1337 day 1 drew
1861 in the reference and 3063 under wasm, and the queue scenario went red
on wasm alone. The fix is a placement rule worth keeping: **behavior that
must exist on both backends lives in a call both backends make** - the
re-think moved to `visTick` (the one per-visitor call each frame everywhere)
and the fork closed. Corollary for every future JS-orchestrated feature:
grep for `if (KERN)` early-returns and kernel-unit chains BEFORE choosing a
code home; the agreement referee only compares the states it is pointed at,
and a JS-only branch in kernel-owned territory is exactly the divergence it
exists to catch.

## FIRST CROSSING

Seed 1337, day 1, 13:55 (tmin 835): **EBB, walking to the showers for a
wash, turns for the shack and a meal instead** - mid-stride, not in a line
(inLine false), the first mind changed in the town's history. The crossing
is stable across the slice's late fixes (stamped identically at 4c091b8 and
c943b52; receipts in kube-runs/cs-rethink-probe-*). Thirteen more follow in
the first four days.

## THE DITHER NUMBER

Seed 1337, four town-days, live probe: **13 switches, all visitors, zero
citizens** - roughly three changes of mind per town-day against dozens of
active actors, i.e. commitment remains overwhelmingly the default. The
citizens' zero is the margin working, not the door being shut (the DIRE
scenario proves their path fires): in four ordinary days no citizen's
challenger ever cleared 25% mid-walk. The suite pins the ceiling (the
two-day scenario asserts 0 < switches < 300). The attribution control
(--norethink, same ref) runs the same town with zero rethink stats and a
diverged day-4 (rep 82 vs 75, $167 vs $166 on this seed) - the hatch
isolates the mechanism exactly.

## MATRIX (batch instrument, triple-16, base 071143d vs branch c943b52+)

- Baseline: **0/48 -> 0/48** (medians undisturbed; the floor holds).
- Growth: **13/48 -> 17/48 (+4)**, per block 5->6 / 2->6 / 6->5. A guest
  who can leave a dead queue spends her stay at counters that serve her;
  the autopilot is NOT rethink-aware (the bot does not chase the mechanism
  - the +4 is the town working better under the same unsteered play).
- Reported, not tuned: nothing was adjusted toward any of these numbers.
- An intermediate measurement at 8199cc9 (queue re-think JS-only, the
  asymmetric bug) read 13/48 - the +4 belongs to the SYMMETRIC mechanism,
  and the pair of measurements is the symmetry lesson's own receipt.

## GATES (receipts under design/cs35-research/kube-runs/)

- rethink-focus: **5/5 scenarios green BOTH backends** at c943b52+ (three
  staging rounds, each caught by the scenarios' own premise checks - equal
  staged scores; a backend-fast server claim, answered with a decoy at the
  line's head; the asymmetric placement, answered by the visTick move).
- Pins re-pointed with ledger entries, then green both backends: rng
  {day1: 1726 -> 1861, day2: 1616 -> 2833} (re-thinks gather, gathers
  draw), frozen day-2 fingerprints for 1337 (serves 44->47, rage 5->3,
  the town where fewer plans die in a queue) and 4242 (serves 44->52,
  rage 4->5 - more counters tried, most of them served). **wasm and the
  reference read the same counts**, which is the symmetry fix's receipt.
- Mutations, one armed commit each, both reverted: margin 4:5 -> 1:1 =>
  "a sub-quarter improvement does not turn her" RED; room release removed
  => "the held room did not release: occupant=MISTY" RED.
- **The soak quartet** (the first full battery's four reds, every one
  mechanism-walked before it was touched, with the lockstep bisect first
  proving the backends byte-equal through day 7 on 1337, day 4 on 4242 and
  day 6 on 31 - so none of the four was divergence):
  * the integer tripwire caught `cust.target` at a Q8 fraction - personal
    space has ALWAYS moved a pushable's target in grains ("exact: Q8 is a
    power of two"); rethink trajectories merely made a grain-fractional
    target survive to the sweep. The tripwire now admits the position grid
    (1/256-representable) for `target` and still refuses anything finer.
  * the closure soak's shower house "never closed" because REEF BOUGHT IT
    mid-staging - rethink traffic made him solvent. The soak now holds REEF
    and the rival out of the market through the misses, exactly as the sale
    scenario always has.
  * days off: REEF "never showed a DAY OFF status" because his sampled
    off-day reads "IN LINE AT..." - he was busy LIVING it. The sampler now
    counts the badge OR the visibly lived day (taps/errand/line/ball/
    selfcook while offToday).
  * the tables soak grazed its bound at 121 staffed sim-seconds (was <120):
    serves are up, the crew buses between more customers. Bound moved to
    150; a real wedge holds for thousands of seconds, so the teeth remain.
- **The unbanked-arms lesson**: the first full battery ran 10-way slices and
  SIX arms died unbanked (heap: this slice's multi-day scenarios fattened
  slices) - the merged verdict silently undercounted (460/464 where ~666
  was due), and the four reds' "green JS twins" had in fact never run.
  Count the receipts against the manifest before believing a merged
  verdict; experiments/suite-330.json is the 12-way answer.
- Full suite (12-way, suite-330) + MCP battery at the final SHA: see the
  report. MCP's verdict transfers from cs-phased-gates-4fda8ae (game.js and
  mcp/ byte-identical through the final SHA); matrix and crossing receipts
  transfer from c943b52 the same way.

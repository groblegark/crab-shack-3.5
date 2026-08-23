# CS3.5 — THE DAILY RHYTHM (design, census C1)

Matt's "clocking in and out, sleeping." The census's verdict stands: after
phase E a culture owns its people, food, shops, voice, brains and civics —
but its day is crab-shaped. This doc designs the `rhythm` section, names the
traps honestly, and ladders the lift. Nothing here is implemented; fixtures
stay silent until the content slices.

One line of philosophy first, because it settles half the questions below:
**the sun is the world's; the day is the culture's.** `darkness()`
(game.js:4878) is a fixed ramp (dawn 5:30–7:00, dusk 18:30–20:30) and stays
engine physics — a nocturnal culture does not move the sun, it moves when
its people sleep *relative to* the sun. Rhythm is data about bodies and
institutions, never about the sky.

## 1. The anchor inventory (who owns each clock-anchored constant, who reads it)

| anchor | value | site | read by | class |
|---|---|---|---|---|
| BED_HOUR | 21:00 | game.js:11546 | visitor state machine (12465, 12499, 12506: room return, sand sleep) | **rhythm.bed** (visitor slice R3) |
| WAKE_HOUR | 7:30 | game.js:11547 | checkout window 12419/12426 (WAKE..12:00), housekeeping | **rhythm.wake** (R3, with the ferry trap §4) |
| OFF_WAKE | 9:30 | game.js:4140 | crew lie-in: quips 8773/8775, diary 9381, errand window 9526, day-off gate 5895 | **rhythm.lieIn** (R1) |
| SHIFTS anchors | D 8:30, M 8:00, E 14:00 | crabs.js:101 | shift assignment, clock-in/out; labels render on cards | **rhythm.shiftStarts** (R2). Ends are DERIVED: end = start + management.shifts span (mgmt moved the spans deliberately without the anchors — this section is the other half it predicted) |
| BIZ default hours | 8:00–20:00 | game.js:428 | every shop's sign until the owner moves it; visOpen → KM_OPEN plane 12323 | **rhythm.hours** default for a culture's OWN declared businesses (R2). Existing crab shops: unchanged (owner save-state lever) |
| HOURS_MIN/MAX/SPAN_MIN | 6:00/24:00/4h | game.js:376 | clampHours 455; hire/expand logic 2013, 3020 | engine rail, stays (mgmt close-out already ruled) |
| townOpen() | 8:00–20:00 | game.js:4130 | townAwake 9528, errand windows, POLL derivations | HOST-town clock; stays engine in this campaign (§3c) |
| POLL_OPEN/SHUT | 7:00/19:00 | game.js:923,929 | ballot 1002, 1781–1792 | derived "an hour outside town hours," load-bearing per its own comments; follows townOpen, not culture (§3d) |
| POLL_WEEKDAY | Sunday | game.js:763 | pollWeekday 996 | civics (phase E's charter, not rhythm) |
| FERRY_TIMES | 8:00,10:30,13:00,15:30 | game.js:11437 | arrivals/departures, ferrySail save 8636 | world infrastructure, stays (census B13) |
| REST_HOURS | 9 daylight h | game.js:4341 | sick-day rest credit 4350, 5924 | body, not clock — belongs to C2 `body.rates`, noted for that design |
| darkness() ramps | 5:30–7:00, 18:30–20:30 | game.js:4878 | view lighting 4010/4071, crew night gate 8769, tiredness repair rule near 5455 | **engine physics, stays.** Consequence recorded: a nocturnal culture works while dark — TIRED_NIGHT-class rates (C2) price that, which is gameplay, not a bug |

## 2. The `rhythm` schema section

```json
"rhythm": {
  "wake":   1020,          // game-minutes 0–1439, 30-min grain
  "bed":    540,           // may be < wake: the awake arc wraps midnight
  "lieIn":  1140,          // absolute, like OFF_WAKE; must sit inside the awake arc
  "shiftStarts": { "D": 1110, "M": 1080, "E": 0 },   // ends derived from management.shifts
  "hours":  { "open": 1080, "close": 360 }           // default sign for this culture's declared businesses
}
```

- **Units and clamps**: integer game-minutes, 30-minute grain (the town's own
  grain, per mgmt). Absolute positions are NOT clamped to a daylight band —
  that is exactly what a nocturnal culture must escape. What IS clamped is the
  **derived awake arc**: 8h ≤ awake ≤ 20h on the 24h circle, refused loudly
  ("A DAY WITH NO NIGHT" / "A PEOPLE WHO NEVER WAKE"). Shift starts and lieIn
  must land inside the awake arc ("A SHIFT IN THEIR SLEEP").
- **Inheritance: per-field**, like nudge and management — a culture that only
  wants a lie-in declares one number. Defense: the fields are orthogonal knobs
  with sane crab defaults, and the arc clamp runs AFTER inheritance, so a
  partial declaration that composes into an insane day is refused by name at
  install, not discovered in play. (All-or-nothing, the businesses rule, is
  for entries where half an object is meaningless; half a rhythm is a lie-in.)
- **Crab fallback by identity**: undeclared cultures get the engine constants
  object itself, the nudgeCfg idiom. buildCulture converts author minutes once
  at install; the hot path sees integers it already knows.

## 3. The hard problems, answered

**(a) Mixed-culture towns — whose rhythm wins?** One principle, three
applications: **bodies follow their culture; institutions follow their owner;
the town square follows the host.**
- *Bodies*: sleep, wake, lie-in, errand windows read the ACTOR's culture.
- *Institutions*: a shop's default hours and its shift anchors read the
  OWNER's culture (hours are already an owner lever; this only moves the
  default). A gull hired into a crab shop works crab anchors — you clock in
  when the shop needs you — and pays for it in tiredness because she is awake
  against her body. That is not a conflict to resolve; it is the labor market
  the design wants: nocturnal staff will prefer night-open shops, and a
  cross-rhythm hire is a real management decision with a visible cost.
- *Town square*: townOpen()/townAwake stay host-culture (crab) this campaign.
  A future civics item may hand the town clock to the charter; not here.

**(b) The kernel**: no new kernel logic. Per-biz open already crosses as the
KM_OPEN plane (game.js:6139, filled at 12323) — owner-default hours ride it
unchanged. Personal wake/bed gates live in the JS state machines (the kernel
owns movement, not decisions), so per-actor anchors are install-time fills
like the C2 rates: if the pick path ever needs them kernel-side they cross as
two per-actor int planes, MR_TASTE-style. Not-yet-ported is the honest label.

**(c) The matrix instrument**: the autopilot buys by day-count, not by
clock, so the instrument survives. Default towns are byte-identical (no
declaring culture ⇒ identity fallback, zero draws — the settlers rule).
Scenario stagings that reference wall-clock times ("at 19:00 the...") remain
crab-true; a declaring-culture scenario must stage inside ITS arc.

**(d) Elections**: POLL_OPEN/SHUT are derived an hour inside town hours and
their comments call the gap load-bearing. They follow townOpen (host), so
rhythm does not touch them. A nocturnal ELECTORATE that sleeps through a
Sunday poll is real, though: polls 7:00–19:00 vs gulls awake 17:00–9:00
leaves a 2-hour voting window. Recorded as a phase-E charter question
(polling hours as civics data), NOT solved by rhythm — and consistent with
the citizen-mind finding that turnout is already behavior, not scenery.

**(e) The view**: nothing needed. Lighting reads darkness(), which does not
move. Sleep art (sleepOnSand, room lit-windows 4071) keys off state, not
clock. The sun button ffwd is clock-agnostic.

**(f) THE FERRY TRAP (found writing the worked example)**: the last boat
sails 15:30; a nocturnal visitor wakes 17:00. Naive rhythm strands every
nocturnal daytripper forever. Resolution: departure stays FERRY-driven
(world), and checkout becomes "on wake, if a sailing remains today; else at
the last sailing's warning, groggy" — i.e. the boat can wake a guest the way
alarms wake people who have one. The groggy early rise is charged as
tiredness (C2 rates), so visiting a day-town is genuinely costly for
night-people — which is the cross-cultural texture this whole substrate
exists to express. R3 owns this; it is the reason R3 is the last slice.

## 4. Worked example — THE WINDWARD ROOST goes nocturnal

```json
"rhythm": {
  "wake": 1020, "bed": 540, "lieIn": 1140,
  "shiftStarts": { "M": 1080, "E": 0 },
  "hours": { "open": 1080, "close": 360 }
}
```
A ROOST settler's Tuesday: she wakes 17:00 as the crab town is closing; her
own culture's juice stand (declared business, owner-default sign 18:00–6:00)
opens as she clocks in for M at 18:00; the crab promenade goes dark around
her but her shop's KM_OPEN says open, and crab night-owls (there are none
yet — crabs sleep; pigs might not) or fellow gulls trade with her; she clocks
out at midnight (M start 1080 + std span 360), errands in her own small
hours, takes to bed at 9:00 as crab housekeeping starts. A visiting gull
TOURIST at the hotel sleeps 9:00–17:00, and the 15:30 boat wakes her groggy
if she meant to leave today (§3f).

## 5. Ceremony plan

Machinery commits (R0–R3) are byte-neutral: identity fallback, zero draws
without a declaring culture, headless base-vs-branch identical, mechanism
scenarios + hostile clamps that BITE (arc violations named), MCP validator/
docs grown. The declaration commit (R4, gullway nocturnal) is
fingerprint-moving ONLY in gull-bearing towns: full ceremony — first
crossing named (expect a gull's first divergent sleep tick), re-pins
receipted, triple-16 matrix with deltas reported not tuned. All gates via
the kube manifests per policy.

## 6. Measurement

Marked **measure at implementation**. The one question a pre-measurement
could answer — how clock-coupled is the economy — does not change the schema
shape, and the honest instrument for it (declare-nocturnal A/B on gull
towns) requires R0–R3 to exist first. R4's ceremony IS that measurement.

## 7. The ladder

| slice | size | content | depends on |
|---|---|---|---|
| R0 | S | schema + loader + arc clamps + identity fallback + MCP; byte-neutral | nothing |
| R1 | M | crew/settler rhythm live: wake/bed/lieIn/errand windows per actor culture | settlers (landed) |
| R2 | M | shift anchors + owner-default biz hours per owner culture | phase D placement (owner binding) for non-crab shops; crab shops unchanged |
| R3 | M/L | visitor rhythm: hotel bed/wake, checkout-on-wake, the ferry trap §3f | R1 idioms; independent of D |
| R4 | S | THE WINDWARD ROOST declares nocturnal — content + full ceremony + the A/B | R1–R3 |

Layer-1 is NOT required anywhere — rhythm is pure data. REST_HOURS and the
tiredness pricing of cross-rhythm work are C2's (`body.rates`); this doc
hands C2 that requirement explicitly.

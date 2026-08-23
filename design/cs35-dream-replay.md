# CS3.5 DREAM REPLAY — minds for citizens and owners, and how each one trains itself

**Owner directive (Matt, 2026-08-22):** "what I want is a mind for crab
citizens, and one for owners as well. it's not about compression only, it's
about trainability.. doing posttraining later or some kind of episodic
'dream replay' kind of thing so each crab can optimize their own lives
independently."

Design + spike. The spike lives in `tools/neuro/dream-spike/` and does NOT
ship into the game; receipts in `tools/neuro/dream-spike/receipts/`. The
verdict up front: **deterministic integer training works** — a 364-byte
per-actor delta on a frozen backbone, trained by mistake-driven integer
perceptron (which IS SGD on the hinge loss with the learning rate folded
into a shift), learns real behavior from small replayed experience, stays
inside a hard clamp, replays bit-identically across engines, and costs
0.39% of a sim-day for ten dreamers. No fallback method was needed.

## 1. THE TWO NEW MINDS — the centerpiece

The neuro substrate so far covers one decision surface: the visitor's
errand pick. The directive names the two that matter next, and both have
scripted teachers already running in the tree. The current rules ARE the
teachers — same distillation path the visitors took.

### 1.1 The citizen surface: `cit_errand.candidate`

**The teacher:** `pickErrand` / `errandScore` (game.js:9279–9520) — the
whole off-counter life of a crew crab or resident: what to do about hunger,
thirst, dirt, boredom, illness, and the ballot, scored per candidate by
urgency-per-unit-of-detour (`ratGt`, exact rational compare) with the
gather-order tie-break.

**The action set** (the census of `take()` calls, one class per distinct
kind of stop; `none` = keep doing what you were doing):

```
none | shack:food | selfcook:food | soup:food
juicebar:drink | shack:drink | tap:drink
showers:clean | tap:clean
arcade:fun | ball:fun | vote:vote
```

Twelve classes. As with visitors, CANDIDATE CONSTRUCTION STAYS SCRIPT —
gathering runs every gate (staffing, wallet, hours, duty, shift windows,
sickness, pot funding, poll hours) and takes its recipe draws exactly where
the script takes them, so the draw-count discipline survives whoever
decides. The brain replaces only the SCORER: logits over the twelve
classes, argmax filtered to classes with a live candidate (the
`brainVisPick` seam, verbatim — game.js:11705).

**Observables to add** (a `citizen.*` block in the registry; every one is
an existing integer read):

```
need.tired.q20            k.p.tired               the need visitors don't have
self.off                  awayToday(c)            a day off spends differently
self.sick                 k.p.sick                bed rest gates fun
self.duty                 c.duty                  on the clock right now
self.working              c.dsC === DS.working
shift.end.rel             shEnd - tmin, clamped   how much day is left
shift.leave.rel           leaveGmin(c) - tmin     the BALL_LEAD window
wage.own.cents            privateWage/bizWage     what today earns
wage.gripe.q20            wageGripe(c)            the grievance level
home.dist.px              |c.x - homeX(c)|        the commute term
ball.players              ballPlayers().length    a game in progress pulls
ball.cd                   c.ballCd                the cooldown gate
nudge.armed               nudgeMatch window open  the player's thumb
poll.open + self.voted    pollOpen(), hasVoted(c) civic errand availability
pot.warm                  potWarm()               the shelter floor
staffmeal.spread.cents    localPrice - staffMealCharge   the staff privilege
tap.dist.px / poll.dist.px  nearest of the pair   the two-post idiom
```

plus the visitor block's `stop.*` parameterized reads, which citizens
share. Per-brain, per-culture pick lists as ever — a pig settler's citizen
brain (phase B's own roadmap item) declares a different vector without a
schema change.

**Cadence:** citizens think through `pickErrand` at several sites (~9081,
9096, 9131, 9689) — more often than visitors. Measured at collection time;
the visitor number (0.039 thinks/tick) bounds the shape: cognition stays
noise.

**Why this surface first:** it is the biggest behavior in the game not yet
behind the policy layer, its teacher is the most heavily receipted code in
the tree, and it is where "each crab optimizes their own life" reads most
literally — the crabs who LIVE here are the ones with lives to optimize.

### 1.2 The owner surface: `own_settle.lever`

**The teachers:** the three settlement-time policies plus the rivalry —
`runHoursPolicy` (game.js:1994), `runWagePolicy` (4832),
`runRivalCompete`/`runRivalAmbition` (2976/3054), and the market side
(`buyOutOwner`, `offerPrice`, the REEF-style expansion buy). These are
exactly "the levers headless.mjs famously never pulls" — pricing, hours
signs, wages, offers — each currently a hand-tuned rule reading the owner's
own books.

**The shape:** ONE think per owner per settlement night. The brain picks
the LEVER; the engine applies the legal grid step and every clamp the
player's own controls run through (price moves by index steps inside
[PRICE_IDX_MIN, MAX], hours by the 30/60-minute grain inside
[HOURS_MIN, MAX], wages by $1 inside [WAGE_MIN, MAX] and never under the
floor). Amounts stay engine-owned — a hostile or confused brain can only
choose WHICH legal move, never an illegal size. Cooldowns (`STEP_DAYS`,
`st.cd`) stay engine-owned too: the brain decides at the cadence the
script had.

```
hold
price_up | price_down          (± CUT_IDX on own board)
open_later | open_earlier      (the morning lever)
close_later | close_earlier    (the evening lever)
wage_up | wage_down            (± $1, floor-respecting)
offer_prize                    (put the warchest number on the table)
retreat                        (walk the last competition move back)
```

Twelve classes. The rival's STAGE machine (eyeing → offer → compete, the
warchest hysteresis, WARN_DAYS clock) stays script — it is narrative
pacing, not judgment. The brain drives the judgment inside a stage.

**Observables** (an `owner.*` ledger block; all already integers in owner
state):

```
till.cents                o.till
warchest.cents            the rival's put-by (rival.intent side)
takings.3day.cents        the smoothed book runHoursPolicy reads
strike.days               bizStrike[b]            the missed-rent counter
hours.first/last/closeQ   hoursObs history        the demand signals
hours.span                close - open
price.idx.own             bizPriceIdx(b)
price.idx.prize           bizPriceIdx(PRIZE)      what the war is about
wage.own / wage.going     bizWage(b), max(WAGE_STD·KEEP, pierClaim, townWage)
post.stale.days           jobBoard age            advertised, nobody came
staff.gripe.max           max wageGripe over staff
staff.tired.max           max tired over staff    the extend-hours gate
rival.stage               0..4                    where the fight stands
credit.bal.cents          the line of credit drawn
day.clock                 day
```

**The guardrail, explicit:** owner brains move the economy by construction
— they ARE the economy's other half. They ship shadow-first, and NOTHING
goes live on this surface without a fresh triple-16 matrix and Matt's
ruling on the delta. The matrix stays a regression detector: brains are
never wired into `headless.mjs`'s own autopilot (the floor must keep
measuring an unsteered town).

**Why this surface is where trainability pays:** a distilled owner is a
curiosity — the scripts are small. A DREAMING owner is a game feature: an
owner whose lever-sense adapts to her own street (rung 4 below) is the
"optimize their own lives" directive operating at the level where the
town's story is written. The rival and the hotelier ride the same surface
later for free.

## 2. THE DELTA-READY BRAIN FORMAT (rung 0 — receipted by the spike)

Every mind above ships in a format that is trainable from day one, even
while its delta is all zeros:

- **Frozen culture backbone + per-actor delta.** The artifact stays the
  shipped int8 MLP. The delta is LAST-LAYER ONLY: `w2d` int8[out×hidden] +
  `b2d` int32[out] — for the crab brain, **364 bytes per actor**.
  (Bias-only at 28 B was considered; the spike's learning is carried by
  the weight rows, and 364 B needs no economizing.)
- **Effective logits:** `L_o = (base_o << 8) + d_o`. One `w2d` unit is
  1/256 of a backbone weight; the int8 clamp bounds a LIFETIME of dreaming
  to under half a backbone weight per connection. **The storage type is
  the sanity rail** — a crab cannot dream herself insane because her
  temperament does not have the bits to hold insanity. Exact in every JS
  double engine (< 2^37); a wasm port carries it in i64 or drops ESH to 4
  (only needed if the SIMD trigger ever fires — dreaming is JS-side on
  both backends today, like inference: WHO DECIDES bypasses the kernel).
- **Zero delta IS the backbone, bit for bit** — spike check 0 asserts the
  argmax identity over all 35,660 thinks. So: pre-delta saves load as the
  shipped culture brain exactly, and SAVE_VER bumps to 4 with `dm` (delta
  bytes) + `dr` (dream-stream cursor u32, rs's rule) as optional per-actor
  envelope fields. Budget: ≤ 512 B/actor, ~20 minded actors ≈ 10 KB worst
  case.
- **Hostile-file posture:** delta fields in a document or save are
  range-checked int8/int32 at load like weights; a delta on an artifact
  whose registryVersion mismatches fails with both versions named.

## 3. THE EPISODIC BUFFER — what a crab remembers

**Position taken: the ring holds SURPRISES only, and it is save state.**

The perceptron only updates on mistakes — so the only episodes worth
remembering are the ones where the deciding mind and its teacher disagreed
(the surprise). At the measured ~97% agreement a crab banks roughly one
surprise a day: a ring of 8 surprises × (42 int16 obs + label) ≈ **700
bytes per actor**, bounded, and it earns its envelope slot because the
stream-cursor lesson governs: state that affects future behavior lives in
the envelope, or load-equals-run dies. (The rejected alternative — a
day-local ring cleared at save — was cheaper but would have carved a named
exemption into the load-equals-boot digest. Correctness culture wins.)

Rewards are NOT stored: credit assignment happens at label time (§4), so
the ring is (obs, label) pairs — the same shape the spike replays.

## 4. DREAM REPLAY — the training step and its two teachers

**When:** at sleep. Crabs already sleep; the fiction is free. All dreamers
batch at the sleep tick, fixed actor-index order, each drawing replay
indices from her own counted u32 stream (`dr` in the envelope — the
integer core of mulberry32, cursor counted, no float division).

**The step** (spiked, verbatim): replay a surprise; recompute hidden
(frozen backbone); logits with delta; if the dreamed argmax still differs
from the label, nudge — `w2d[label] += hi >> 11`, `w2d[pred] -= hi >> 11`,
biases ± 4096, saturating clamps. Learning rate IS the shift. No floats,
no division, no transcendentals. A crab whose days go fine dreams and
changes NOTHING — no mistakes, no updates — so dreaming cannot erode a
working mind.

**Teacher 1 — the shadow script (rung 3, distill-pure):** at live-brain
think time the reference script is still computable on the same assembled
vector. When script and brain disagree, that think enters the ring with
the SCRIPT's choice as label. Dreaming then converges each actor toward
the reference AS HER OWN TOWN EXERCISES IT — per-individual continuous
distillation. Zero outcome-optimization risk; "distill behavior, never
optimize outcomes" holds by construction.

**Teacher 2 — the hindsight rule (rung 4, needs a ruling):** "optimize
their own lives" eventually wants outcomes in the loop. The proposal that
threads the house rule: a HINDSIGHT TEACHER — a deterministic, legible
rule that re-labels the day's thinks from the day's own ledger at close
(citizen: went hungry at day end while food was affordable at think time →
that think's hindsight label is food; owner: a lever followed by a missed
rent → the hindsight label is retreat). Not RL — no reward gradient, no
credit propagation, just a rule the devlog can quote, auditable like any
script. Whether this crosses the distill-not-optimize line is Matt's call
(§7), and nothing below rung 4 depends on the answer.

**Rails:** the int8 clamp (§2, the spike's mutation proves it bites: the
same schedule unclamped drifts to |w2d| 631); dreaming is a per-culture
`policies` switch — `dream: off | shadow | live` — where shadow computes
and records deltas that never decide (byte-neutral, same trick as brain
shadow); and the brain inspector grows a "WHAT SHE LEARNED LAST NIGHT"
line — the delta's top movers named through the registry (the saliency
path already in the panel) plus a temperament meter, |w2d|₁ against its
cap. Observability was a fork's-length away before; here it is designed
in.

## 5. THE SPIKE — receipts (tools/neuro/dream-spike/)

Corpus: 35,660 real crab thinks, 16 towns × 12 days, collected with brains
DISARMED and culture-filtered (`collect-crab.mjs` — the first draft
collected 7,287 pig thinks and called them crabs, because live crab brains
bypass the wrapped `visPick`; the retrain close-out's zero-rows lesson,
paid a third time, now written into the collector's header).

- **Learning:** v2 backbone (the act-early brain), teacher = script. Held
  out = each town's LAST 40% of thinks; ring = her first 60%. Pooled
  delta: **96.19% → 97.67%** (the v3 full retrain reads 98.69% on the same
  split — a 364-byte delta recovers ~59% of a 2,352-param retrain's gap).
  Per-town deltas, each dreaming ONLY on her own ring: mean **96.11% →
  97.30%, 16 towns up of 16, none down.** Every town that dreamed got
  better at its own tomorrow.
- **Stability:** 1000 nights × 32 replays: max|w2d| = 127 (the rail),
  21/168 weights saturated, b2d bounded. Mutation: clamp removed, same
  schedule → |w2d| 631. The rail bites.
- **Cross-engine:** the full 40-night trajectory — final delta bytes AND
  probe logits AND the stream cursor, FNV-hashed — **bit-identical on
  node/V8 and JavaScriptCore** (`9933dad0`, 5120 draws both). wasm leg
  deferred with the i64 note (§2); the two-engine receipt covers the
  arithmetic claim since every step is exact-integer in doubles.
- **Cost:** 1.23 µs/replay → **39 µs per actor-night**; ten dreamers =
  **0.39% of a 90 ms sim-day**, once per day. SIMD stays phase-2; its
  trigger is nowhere in sight.
- **Verdict:** integer perceptron (hinge SGD, shift-rate) is THE method.
  Sign-SGD and evolutionary perturbation were named as fallbacks and were
  not needed; softmax-SGD is impossible in-contract (exp is banned) and
  unnecessary.

## 6. THE LADDER (citizens and owners first — the directive's order)

0. **Delta-ready format** (§2) — ships WITH rung 1; zero cost until used.
1. **The citizen mind:** collect (BRAINS={}, citizen-filtered), distill,
   shadow in town behind the agreement floor, then live behind the full
   fingerprint ceremony + triple-16 matrix. The crew get minds.
2. **The owner mind:** distill the settlement levers; SHADOW-FIRST and
   matrix-ruled before any live owner (§1.2 guardrail).
3. **Dreaming, distill-pure:** surprise ring + sleep replay for citizens,
   teacher = shadow script. Fingerprint-moving when live; shadow mode
   byte-neutral. Inspector shows the night's learning.
4. **The hindsight teacher** (outcome-tinged labels) — gated on the §7
   ruling. Owner dreaming on her own books lands here.
5. **Visitors dream / fleet consolidation** — demoted on purpose: a
   visitor lives a day, and a delta that dies at the ferry is perfume.
   Worth revisiting when repeat visitors exist. MCP grows `policy_dream`
   (run towns, dream deltas, report drift); consolidation = periodic
   retrain of the backbone with the fleet's deltas as evidence — Matt's
   "posttraining later," and the deltas are its dataset.

## 7. THE THREE DECISIONS MATT MUST RULE ON

1. **The hindsight-teacher boundary (rung 4):** is a deterministic
   day-ledger re-labeling rule an acceptable teacher, or does
   distill-not-optimize confine dreaming to script-shadow personalization
   for now? Rungs 0–3 are unaffected either way.
2. **Owner brains and the matrix:** the owner surface moves the economy
   both ways. What matrix delta (if any) is acceptable for a LIVE owner
   mind? Shadow ships regardless; live waits on the number.
3. **The surprise ring in the envelope:** recommended as save state
   (~700 B/actor, §3) to keep load-equals-run exact. The alternative — a
   day-local ring, cheaper, with a named digest exemption — is on the
   table if envelope growth offends.

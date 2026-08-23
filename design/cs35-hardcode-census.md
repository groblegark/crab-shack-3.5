# THE HARDCODE CENSUS — what stays in the engine after the migration
2026-08-23 · branch hardcode-census · surveyed at tip 75dc758 (post-settlers,
post-citizen-mind; phase D registries and phase E not yet landed)

Matt's question: *"what will still be hard coded after all of this; e.g.
clocking in and out, sleeping, random stuff?"* This walks game.js (19,905
lines, 363 SCREAMING_CASE constants), crabs.js, and sprites.js against the
substrate plan (design/cs35-cultureway-substrate.md §1–§6) and every
close-out's honest-gaps list, and classifies what remains.

## SUMMARY

| class | meaning | count (items, not constants) |
|---|---|---|
| A | already data, or in-flight in a scheduled phase (D/E) | 19 |
| B | engine physics — should stay hardcoded, defended below | 14 |
| C | culturally chargeable but UNSCHEDULED — the menu | 11 |
| D | judgment calls — could go either way | 6 |

The headline: after phase E, **a culture will own its people, look, voice,
food, shops, tips, tastes, settlement, policies/brains, and (E) civics and
formulas — but not its BODY or its CLOCK.** The daily rhythm (sleep, wake,
shifts-as-times), the need-set and its decay rates, movement speeds, and
personality traits all remain engine constants that every culture inherits
from crabs. Matt's two named examples — clocking in/out and sleeping — are
both class C: real gaps, no phase moves them.

---

## A. ALREADY DATA OR IN-FLIGHT (cite: schema section / phase)

- **Names** — `people.names` (visitors + settlers draw from it). The CRAB
  pool stays code (crabs.js:8 CRAB_NAMES, crabs.js:108 CUSTOMER_NAMES) until
  E's crab-as-document.
- **Look** — `art.{palette,colorways,body,poses,accessories,items,bather}`.
  Crab colorways/arts are code (sprites.js:89 CRAB_COLORS, game.js:5283–5304
  including HOUSES/BOATS/BUGGIES derived per colorway) — **scheduled, phase E
  dogfood** (substrate §4 debt 1).
- **Voice** — `voice.registers` (diary/depart/dossier/foreign/refuseHire,
  purseMul); crab voice bundled byte-equal (voice close-out). The 11
  *branching* depart literals + `dues` + refuseHire's two-literals-one-key
  wait on **E Layer-1 conditionals** (named schema debt).
- **Tastes + nudge** — `appeal.tastes`, `appeal.nudge` (appeal close-out).
- **Arrival** — `arrival.{repGate,shareMax,shareRamp}`.
- **Food** — `foodways.{ingredients,dishes,items}`; corn left the engine
  (INGREDIENT_COST comment, game.js:4887).
- **Shops** — `businesses` (BIZ-shaped, pending a plot — **phase D
  placement** makes them real; biz-catalog close-out gap 1).
- **Management norms** — `management.{tableTip,counter20,shifts}` — note
  shifts here are **spans** (std/day/cover minutes), not anchor times; see C1.
- **Settlement** — `settlers.{apron,walkins}`; persona factory keeps identity.
- **Conduct** — `conduct.{hireable,tabooFloor,foreignThreshold}`.
- **Depart weights** — `depart.weights` (the RULES stay code; see C6).
- **Policies/brains** — `policies` section, vis_pick + cit_errand live, the
  364-byte per-actor delta (SAVE_VER 4) shipped.
- **World/place art** — `world` section **reserved** (substrate §1); pig
  world art is an open decision, the schema home exists.
- **Civics** — `civics` section, **phase E** (institutions, offices, policy
  step-tables, calendar phases, errand defs, invariants). Should absorb: the
  WAGE_FLOOR/HEAD_CAP ballot tables (game.js:811,826), POLL_* mechanics
  (game.js:910–960), POT_MAX/SOUP_MARGIN (game.js:761–762), WHIP_* — E's
  plan names "policy step-tables, calendar phases," so polling day and the
  ballot furniture are in scope there.
- **Errand candidate sets, hook points, policy slots, cards** — **phase D**,
  in flight on branch capability-apis.
- **Layer-1 formulas** (stake valuations, eligibility, urgency ramps, drift,
  acceptance) — **phase E**, the five families (substrate §3).
- **Crab diary literals** — 12 tabled as the bundled voice with code
  fallbacks (voice close-out); E tables the rest of the crab document.
- **Learned-dish gate, delight rules' weights, register-bound lines** — data.
- **MR_TASTE integer grid** — scheduled ride-along on the next re-baseline
  (substrate §2 row 1; still f64 today).

## B. ENGINE PHYSICS — SHOULD STAY (the simulation, not the culture)

1. **The clock's grain**: TICK_HZ=20, GMIN, DAY_TICKS=7200, TICKS_PER_GH
   (game.js:16–56, 4108). The *rate of time* is the sim's substrate; a
   culture that wants a different day wants a different game.
2. **The integer contract**: Q20 bars, Q8 movement, cents, floor/trunc
   rules. Determinism is not negotiable per-culture.
3. **The RNG discipline**: one counted stream (srand, game.js:6736), the
   cultureRolls rule (a non-declaring culture consumes ZERO draws — settlers
   close-out). "Random stuff" answer: ~100 draw sites; the culture-flavored
   ones (name pick, colorway roll, walk-in mix, trait roll, ferry manifest)
   already run through culture-gated code paths under the zero-draw rule;
   the rest are engine physics (service jitter, wander dwell, fish luck).
   The *pattern* is settled; no per-culture sub-streams needed until a
   fingerprint story demands one.
4. **Collision/pathing mechanics**: lanes (LANES, game.js:10300), stuck
   detection (STUCK_*, 10594–10605), the separation *mechanism* (VSEP_SPD,
   pool-order tiebreak). The radius is a noted cultureway seam (C4) but the
   resolver is physics.
5. **Conservation**: no verb mints money; imports priced; audit identities.
6. **The pool shapes**: POOL_MAX=160, FURN_MAX=64, kernel plane layout
   (game.js:6072–6178). Capacity is engine; cultures fill it.
7. **Save machinery**: SAVE_VER, slots, slotOwned, the envelope (rs/sd/dm/dr).
8. **The PPU and panel geometry**: 256×240, card layouts, fonts. The VIEW.
9. **The town's map**: WORLD_W, HOUSE_XS, PIER_*, BUS_STOPS (game.js:66–101).
   This is THE island — one world, world-section content someday for OTHER
   places (postcards/nodes), but the home town's geography is the game board.
10. **Patience/service grain**: PQ=4096 Q12 seconds (game.js:6523).
11. **Price *engine***: elasticity math, the 14..26 index grid
    (game.js:484–530). The *rails* are D-class (see D3).
12. **DIRE=0.9** (game.js:9563) and the engine-owned regime (citizen-mind
    close-out): survival overrides, nudge obedience, sick-care. "Life-support
    is not a personality" — and not a culture either.
13. **The ferry as transport infrastructure**: FERRY_TIMES, FERRY_LOAD
    (game.js:11437,11449) — the boat is the world's, not a culture's. (Her
    Thursday is D5.)
14. **Fast-forward, camera, input**: FF_SPEED, view interpolation, NAV.

## C. CULTURALLY CHARGEABLE, UNSCHEDULED — the menu, ranked by value/lift

**C1. THE DAILY RHYTHM (Matt's "clocking in and out" + "sleeping") — L**
The anchor TIMES are all engine constants every culture inherits:
BED_HOUR 21:00 / WAKE_HOUR 7:30 (game.js:11546–11547, visitors),
OFF_WAKE 9:30 lie-in (4140), SHIFTS start/end anchors (crabs.js:101 —
830-1830/8-14/14-20; management.shifts moved the SPANS but not the anchors),
per-biz open/close defaults (BIZ table + HOURS_MIN/MAX 376), the 20:00
close, REST_HOURS (4341). A nocturnal gull culture or a siesta culture is
completely inexpressible. Schema shape: `rhythm: {wake, bed, lieIn,
shiftAnchors, restHours}` in game-minutes, clamped to daylight-band sanity.
Breaks: fingerprints wherever declared (fine — culture content is allowed
to move them); the kernel's KM_OPEN hours plane already carries per-biz
times, so the plumbing half-exists. This is the single biggest "life is
crab-shaped" residue. Lift L.

**C2. NEED DECAY RATES — M** (the need SET is XL/engine, see D1)
VIS_RATE per-tick Q20 (11502), VIS_WANT thresholds (11503), VIS_RANK
(11510), TIRED_SHIFT/ERRAND/NIGHT + TIRED_DRAIN/NAP (5383–5395),
citizen equivalents. A culture of big eaters or tireless gulls = one
integer table. Rates already cross to the kernel as data-like planes
(VHUN etc. per actor), so per-culture rates are a fill-at-install, not a
kernel change. Schema: `body: {rates: {...}, wants: {...}}`. Lift M.

**C3. TRAITS/PERSONALITY — M**
TRAITS (crabs.js:7–46): speedy/lazy/cheery/grumpy with move/work/tip
multipliers, lateMin, and quip sets. Crab-only; settlers get crab traits
implicitly. Schema: `people.traits` (label, three multipliers in
twentieths, quips through the voice budget). Pairs naturally with E's
crab-as-document. Lift M.

**C4. MOVEMENT MANNER — S**
VIS_SPEED 42 (11477), crab walk 40×trait, VIS_ROAM/VIS_STROLL (11516–17),
buggy access (settlers pinned pigs to walk — currently a hardcoded mode
pin, should be `people.transport`), personal-space radius (VSEP_RXQ 8px,
11525 — the close-out already names the cultureway seam). Schema: a few
integers under `people`. Lift S.

**C5. STAY SHAPE — S**
VIS_DAYTRIP 0.60 (11548), VIS_THINK cadence (11485), VIS_PATIENCE (11484),
ROOM_HOUR/BED_HOUR interplay. `arrival` already exists — grow it with
{daytripShare, patience, thinkSecs}. A culture of overnighters vs
day-trippers is one number. Lift S.

**C6. DEPART RULE BODIES — M (E-adjacent)**
DEPART_RULES (17893): ~20 rules with weight LAMBDAS and line builders.
Weights are data; the rules' shapes and moods are code. Layer-1 family 2
(predicates) covers the eligibility half; scheduling the rule bodies as
Layer-1 expressions is implied but NOT explicitly in E's list. Make it
explicit or accept crab-shaped departures forever. Lift M once Layer-1
exists.

**C7. IDLE SOCIAL TEXTURE — S**
BALL_LINES, CHAT_LINES, WANDER_QUIPS, NOD_WAKE (5588–5824): crab strings
the voice migration did NOT table (voice close-out tabled diary/depart/
dossier only). The behaviors' parameters (CHAT_AT, BALL_*) are arguably
physics; the WORDS are culture. Fold into voice registers as new keys.
Lift S.

**C8. CIVIC FURNITURE OF LAST RESORT — M**
TAP_* (138–149), SOUP_* (172–177), SHELTER_* (741–760): the standpipe,
the soup pot, the shelter — what THIS town provides the destitute. Phase
D placement + world section could make these declarable town furniture;
today they are the island's constitution in constants. E's civics takes
the POLICY half (POT_MAX etc.); the furniture itself is unscheduled.
Lift M.

**C9. PROFESSION TEXTURE — M**
FISH_TIERS/MASTERY (11045–11063), OFF_BASE days-off table (4157),
NAP_WHERE. Fishing is "the town's default profession" (CS3 canon) but
entirely crab-coded. The businesses section covers SHOPS; open-world
professions (fishing) have no home. Lift M.

**C10. SICKNESS/CONSTITUTION RATES — M**
CARE_LANES (4342), sickness roll inputs, TAP_RINSE_SICK, REST_HOURS.
Per-culture constitution (gulls shrug off rain, pigs hate the damp) =
a rates table like C2. Mortality itself stays engine (D2). Lift M.

**C11. VISITOR LOG/DIARY CADENCE — S**
LOG_MAX/LOG_GAP/VIS_LOG_MAX (13030, 11554): how chatty a diary is could
ride the voice register. Cosmetic. Lift S.

## D. JUDGMENT CALLS

1. **The need SET itself** (FED/THR/CLN/FUN/SPA): kernel plane columns,
   save shape, UI bars, xengine parity — adding/removing needs per culture
   is an XL engine surgery for speculative value. Recommend: rates yes
   (C2), set no, until a culture design actually demands a sixth need.
2. **Mortality** (DEATH_DAY 4 / LINGER_DAY 7, game.js:10375): universal
   mortality was a deliberate CS3 ruling. Per-culture death rates read as
   balance dynamite. Leave engine; revisit with civics.
3. **Price rails** (PRICE_MIN/MAX/STEP/ELAST, 484–530): the 0.7–1.3 band
   is game balance; a culture with different elasticity is an economy fork.
   Leave, note in civics design.
4. **WAGE_STD** (402): deliberately left by the mgmt slice (election-lcm
   denominator, no culture-side reader). The settlers close-out now says
   the customary-wage seam "has its reader one slice away" — revisit when
   settler PAY exists.
5. **FERRY_DAY Thursday + polling SUNDAY** (5181, 763): world canon vs
   civics calendar. E's "calendar phases" should take polling day; the
   ferry's Thursday is the world's heartbeat — leave.
6. **OT_RATE 1.5 float** (4369): flagged by the mgmt slice as deserving
   its own arithmetic slice (float multiplier on the hot payroll path).
   Migrate to integer twentieths when management grows an OT field —
   that's a re-baseline ride-along candidate.

## HONEST NOTES

- Phase D is in flight; its close-out may retire parts of C8 (placement)
  and add registry homes this census can't see yet.
- The kernel side: C1/C2 are cheap ONLY because hours and need levels
  already cross as planes; C6 (Layer-1 in kernel.c) is priced into E.
- I did not run anything (kube policy; analysis-only) — line numbers are
  from the tip's tree, behavior claims from close-outs, not fresh sims.

# CLOSE-OUT — the body machinery (census C2, slice 1 + 1.5)

Branch `body-machinery`, implementing design/cs35-body.md's slices 1 and
1.5: the `body` schema section, the buildPhys conversion, the bodyOf
dispatch, the kernel body-row table, the sweep hatch, and the measured
clamp verdict. Machinery only — NO culture declares; the shipped bundle is
byte-identical (cultureways.js regen exact, fixtures silent, frozen pins
green through the full cluster suite).

## What landed where

- **Schema**: top-level `body` — `rates` {hunger thirst dirt bored tired}
  10–40 twentieths, `wants` {food drink clean fun} 10–30. Along the way a
  PRE-EXISTING schema defect was fixed: a leftover "Phase B (proposal)"
  stub duplicated the `management` key at the file's tail and — JSON's
  last-key-wins — SHADOWED the rich entry for every parser. The stub is
  gone; management validates rich again.
- **Validation** (cultureProblem + the MCP mirror), each refusal NAMED:
  A BAD BODY / A BAD BODY RATE / A BODY THAT NEVER HUNGERS (low) / A BODY
  BUILT TO STARVE (high) / A BODY TOO HUNGRY FOR THE PIER (Σ rates > 120)
  / A BAD BODY WANT / A WANT THAT NEVER QUIETS / A WANT PAST FEELING /
  A NEED THIS BODY DOES NOT HAVE (an unknown key — the D1 boundary,
  refused loudly rather than carried as dead data).
- **Conversion, once, at install**: `buildPhys` — round-half-up in the
  exact-integer idiom (`x = v*mul + 10; (x - x%20)/20`), because flooring
  is the named 1.19% sin. 20/20 reproduces every crab constant EXACTLY
  (pinned by literal: 402×26 → 523 where flooring gives 522). Resident
  tired COSTS (shift/errand/nightfall) ride the tired multiplier; the
  drains (bed, cot, nap) and the sand's 3/2 stay engine — recovery is
  WHERE you sleep, not WHO you are.
- **Dispatch**: `bodyOf(k)` reads BOTH culture homes (k.culture /
  k.p.culture — the mgmtOf lesson) and returns the built table or the
  engine's BODY **by identity**.
- **Kernel** (deviation from the design, direction preserved): the
  BODYT table (16 rows × 9 int32 at 38592 — widened from the design's 8
  rows, still 576 bytes) with row 0 = the crab constants, but the actor's
  row crosses as an **argument** on vis_tick and vis_pick (the tiredDrain
  idiom) rather than a per-actor plane — no spawn/load/reset lifecycle to
  get wrong, and manner's vis_step signature untouched. The RATE_* defines
  are gone; vis_pick's four threshold literals read the row. "The kernel
  never knows a culture's name, only her row."
- **Row dealing**: `fillBodyRows()` runs at the tail of EVERY
  installCultures (idempotent, sorted-id order — deterministic whatever
  order bundled and save documents install). Past 15 declaring cultures a
  body is DROPPED LOUDLY, never silently served row 0: the two backends
  must never disagree about whose body is whose.
- **The sweep hatch**: `window._bodymul` + headless `--bodymul '<json>'` —
  a body section applied to the ENGINE'S OWN people through the same
  buildPhys conversion (ENG_BODY + a row-0 re-deal), so the sensitivity
  instrument colors 100% of guests. Deviation from the design's
  fixture-culture spec, for signal: a fixture culture's people are a
  trickle; the hatch measures the seam at full flow.

## Scenarios (3 new; suite 639→642 counting both new + prior tip growth)

1. **Mechanism**: conversion pinned by literal (523/101/442/629145),
   partial inheritance, both dispatch homes, crab identity (===), silent
   culture stays null, kernel rows carry the built numbers when armed.
2. **Hostile**: nine rows, each refusal matched to its NAMED message.
3. **Cross-backend + identity**: a LIVE pig visitor with a declared body
   staged into a save, lived 2 days on reference and wasm — byte-equal
   (day, coins, cursor, every visitor's position/wallet/five needs); a
   body of all-20s is the SAME TOWN as no body at all; and the declared
   1.3× hunger clock measurably outruns the crab clock beside it.

## Gates (all cluster, receipts banked in kube-runs/cs-body-*)

- body-focus green: **6/6 both backends** (first try).
- **Mutations bit both ways**: aggregate cap loosened → hostile scenario
  red both backends ("a hostile body was not refused by name"); conversion
  floored → mechanism red naming the value ("body.hu built as 522, want
  523"). Tree restored green after each.
- Full suite **642/642 both backends** at 0405246; MCP battery green
  (exit 0, 65s). Rebased over 04e8ede (docs-only — verdict transfers).

## Slice 1.5 — THE SENSITIVITY SWEEP (21 arms, receipts banked)

| variant | mean lifetime $ | survived/48 |
|---|---|---|
| h10 (hunger 0.5×) | 5341 | 9 |
| h15 | 6742 | 15 |
| ctl (all 20) | 6879 | 13 |
| h25 | 7992 | 18 |
| h30 (hunger 1.5×) | 8347 | 21 |
| a12 (all 0.6×) | 8297 | 20 |
| a24 (all 1.2× — the cap) | 6751 | 13 |

- Hunger elasticity (h10→h30): **+0.44**. Aggregate (a12→a24): **−0.37**.
- **Acceptance rule applied: |elasticity| ≤ 0.5 → the Σ≤120 cap KEEPS, with
  this note.** No super-linear minting exists to tighten against.
- **The honest finding — the design's cheat direction is INVERTED at this
  workload**: inflating every need does NOT mint spend (seats and time
  bind; guests churn through cheap need-service and crowd out taco money —
  a24 ≈ control). The RICH direction is the opposite side: slow-need
  guests (a12) and hunger-heavy profiles (h30) both lift takings ~20% and
  add +7–8 growth escapes in 48 — larger than the personal-space radius
  event that got its own ruling. The rail architecture still contains
  this, because slice 2 is the rail: **every declaration is a
  full-ceremony balance event Matt rules on, each culture its own commit**
  (design §5) — this table is the evidence those ceremonies are real, not
  pro-forma. If a future slice wants an arithmetic rail on the rich side,
  the measured shape suggests a FLOOR on Σ (e.g. ≥ 80) — not taken here;
  machinery slices don't move clamps the acceptance rule didn't order.

## Honest gaps

- VIS_RANK (errand priority weights) stays engine — the design scoped it
  out; noted for a future slice if a culture wants different priorities.
- The wants clamp's queue-storm floor (10) is analytic, not measured — a
  wants sweep would mirror this one if slice 2 ever declares wants.
- C10 (constitution/sickness) should extend this section
  (`body.constitution`), per the design's scope note.

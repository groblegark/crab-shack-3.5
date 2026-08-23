# CLOSE-OUT — rhythm R0–R2: the day enters the document

Census C1, rungs R0–R2 of design/cs35-rhythm.md. Machinery only: no culture
declares, every default town byte-identical by identity dispatch. The
governing line held throughout: **the sun is the world's; the day is the
culture's** — darkness() untouched.

## What landed (branch rhythm-r012, off 2c9d008)

- **R0 (8afe5c6)** — the `rhythm` section: schema, cultureProblem clamps,
  buildCulture inheritance, the engine RHYTHM table (WAKE/BED/LIEIN/SS/HOURS
  = the crab constants), `rhythmOf(actor)` (both culture homes, the mgmtOf
  idiom) and `bizRhythm(biz)` (the institution's culture via `BIZ[b].cu`).
  MCP validator + docs grown. Absolute times are unclamped (escaping daylight
  is the point); the DERIVED awake arc is clamped 8–20h AFTER per-field
  inheritance, so a partial declaration composing into an insane day is
  refused at install by name: A DAY WITH NO NIGHT / A PEOPLE WHO NEVER WAKE /
  A SHIFT IN THEIR SLEEP / A LIE-IN IN THEIR SLEEP.
- **R1 (c6ecc32)** — every OFF_WAKE reader (7 sites: the day-off amble, two
  quip gates, the diary line, the errand window, two status strings) asks
  `rhythmOf(c).LIEIN`. Crabs and silent cultures get RHYTHM itself — the
  byte-neutral guarantee is `===`, and RHYTHM.LIEIN IS OFF_WAKE, the same
  integer read through one more property hop.
- **R2 (147c061)** — an institution keeps its owner's day: `bizShiftWindow`
  anchors D/M/E at the owner-culture's declared `shiftStarts` with the end
  derived as start + span (the other half of the frame the mgmt slice moved);
  the covering double stays the full trading window; `placeBusiness` stamps
  `cu` and opens the shop on its culture's default sign (engine values when
  undeclared — the stamp is byte-identical to the old literal). The anchored
  test is on the SS TABLE's identity (`ss !== RHYTHM.SS`), so a culture that
  declared only a lie-in derives its windows exactly as natives do, and the
  native memo is untouched (`native = spans === SHIFT_SPAN && !anchored`).

## Deviations from the design doc, honest

1. **`rhythm.hours` across midnight is REFUSED (“A SIGN ACROSS MIDNIGHT”)**
   rather than accepted-and-stored. The design's schema sketch allows a
   wrapping sign (the nocturnal shop), but the engine's hours model cannot
   represent one: `bizOpenNow` is strictly `open <= tmin < close`, and
   `bizShiftWindow`/KM_OPEN assume the same. Storing an unrepresentable sign
   would be dead data that springs a trap at R4; refusing it loudly keeps the
   document honest until R3 teaches the hours model to wrap (that lift —
   bizOpenNow, the window mid-point arithmetic, the KM_OPEN fill — is R3's,
   alongside the visitor rhythm and the ferry trap it exists for).
2. **Crew wake/bed do not exist as constants** — crew sleep keys off
   darkness() and shift, which the design classes as engine physics. R1's
   "wake/bed" therefore has no crew reader to thread; the resident anchors
   threaded are the lie-in and the errand window, exactly the sites the
   design's inventory names. Visitor BED_HOUR/WAKE_HOUR are R3's, untouched.

## Seams left open, named

- R3: visitor rhythm (BED_HOUR/WAKE_HOUR readers), checkout-on-wake, the
  ferry trap (§3f of the design), and the hours-wrap lift above.
- R4: THE WINDWARD ROOST declares — content + full ceremony; its A/B is the
  clock-coupling measurement.
- Cross-rhythm tiredness pricing: C2's `body.rates` (handed there by the
  design; nothing here prices working against one's arc yet).
- The polls stay host-derived; a nocturnal electorate's 2-hour window is a
  phase-E charter question (recorded in the design, not solved here).

## Gates

- rhythm-focus (both backends, cluster): PENDING — filled below at run time.
- Mutations (targeted manifest, commit-then-revert): PENDING.
- Full suite-318 + phased-gates MCP battery on the final SHA: PENDING.
- Byte-identity: the suite's frozen fingerprint/rng/digest pins ride the full
  run; no fixture declares rhythm (that silence is the byte-identity).

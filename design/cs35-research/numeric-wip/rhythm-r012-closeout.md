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

## Gates (all on the cluster, receipts banked under kube-runs/)

- **rhythm-focus, green** (cs-rhythm-focus-3ea17eb): 3/3 both backends, 6/6
  merged — the build/inheritance/identity scenario, the ten named refusals
  (including the composed-inheritance traps and A SIGN ACROSS MIDNIGHT), and
  the doctrine scenario (BOAR JUICE opens on the boar sign 11:00–23:00, its M
  window anchors 660–1020, the covering double keeps the trading window, and
  the native shack's memoized window is the same object with the same 8:00
  geometry).
- **Mutations, both BITE** (commit-then-revert, pushed per run because pods
  clone the ref): A — arc clamp neutered (cs-rhythm-focus-4491ea7) → the
  refusal scenario RED on both backends; B — build misreads the lie-in as the
  wake (cs-rhythm-focus-a860b6d) → the mechanism scenario RED on both
  backends naming the built value. Tree restored green after each
  (git reset, force-push).
- **Full battery at the final SHA 8c632fd**: suite **642/642** (20/20 arms,
  321 per backend = 318 + the three rhythm scenarios; receipts
  cs-suite-318-8c632fd-e4y9, every arm exitCode 0 / failures []) and the
  **MCP battery green** (cs-phased-gates-8c632fd-pmg5, exit 0). The frozen
  fingerprint/rng/digest pins rode the full run untouched — no fixture
  declares rhythm, and that silence is the byte-identity.
- A machine sleep interrupted the session mid-battery; the cluster finished
  without us and the receipts told the story on resume — the substrate
  working exactly as designed.

## Rebase ledger (the wave landed around this slice)

Rebased twice after the gates section above was written: over the BODY
MACHINERY (b511c10 — one union in buildCulture's return, phys + rhythm; one
factored-suffix union in the suite where body's last scenario and rhythm's
first met) and over the UX PATCH (79b5563 — clean, zero conflicts). The
final battery ran on the rebased tree 1a71126: rhythm-focus 6/6, full suite
**654/654** (20/20 arms, 327 per backend = 318 + body 3 + UX 3 + rhythm 3;
receipts cs-suite-318-1a71126-7g7e verified per-arm: exitCode 0, failures
empty), MCP battery green (cs-phased-gates-1a71126-jpmv). The tip has not
moved since. This commit is docs-only above the gate-bearing SHA; the
verdicts transfer.

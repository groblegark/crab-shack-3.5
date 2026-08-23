# MANAGEMENT — the culture's working norms as a cultureway section (Phase B)

Debt item 7 closed: the norms frozen as engine constants are now a cultureway
section, `management`, with the crab constants as the engine-native fallback —
the same discipline the appeal slice set (whose close-out is this one's
template and precedent).

## The shape

```json
"management": {
  "tableTip":  1-30,                     // whole dollars   (crab: 9)
  "counter20": 0-20,                     // twentieths      (crab: 3 = the old TIP_COUNTER 0.15)
  "shifts":    { "std": 120-720,         // minutes, 30-min grain (crab: 360; feeds BOTH M and E)
                 "day": 240-840,         //                  (crab: 600, the owner's open-to-close cap)
                 "cover": 240-1440 }     //                  (crab: 720, the covering double)
}
```

- Author units convert ONCE in buildCulture (dollars ×100 to cents; the span
  table assembled against SHIFT_SPAN field by field); the hot path sees no
  conversion. Partial documents inherit crab values field by field; a document
  silent on `shifts` gets the SHIFT_SPAN object itself (identity).
- `mgmtOf(k)` dispatches, and it is the one dispatch that serves BOTH sides of
  the counter: a tipper is a VISITOR (culture at `k.culture`), a worker is a
  RESIDENT (at `c.p.culture`). Everyone undeclared gets `MGMT` verbatim
  (object identity — the behavior-neutral guarantee), where
  `MGMT = { TT: TABLE_TIP, C20: 3, SPAN: SHIFT_SPAN }`.
- Read sites wired: `tableTipOf(k)` (signature moved from the shop to the
  GUEST — the tip is the tipper's custom, and the reference JS and the
  kernel's `cust_step` argument both flow through it, so the two backends
  cannot disagree); the counter jar's `counterN` token share; `ownStdSpan` /
  `dutyStdSpan` / `baseShift` / `dutyShift` via a new `spans` parameter on
  `bizShiftWindow`.
- THE MEMO STAYS CLEAN: `bizShiftWindow`'s per-(biz,kind) cache serves ONLY
  the native table (identity check `spans === SHIFT_SPAN`); a cultured
  worker's window computes fresh — rare by construction until settlers, and
  never able to poison the shared cache. The mechanism scenario proves the
  memo returns the same object across a cultured interleave.

## The inventory (moved / left, per the "enumerate, don't fix" doctrine)

MOVED: TABLE_TIP (as tableTip), the counter jar's 3/20 token (as counter20 —
TIP_COUNTER 0.15 itself was already documentation, the live site hardcoded
3/20), SHIFT_SPAN's M/E/D/cover shapes (as shifts.std/day/cover; std feeds
both M and E because they are the same standard day).

LEFT, deliberately, each with its reason:
- **WAGE_STD** — named by the debt item, but it is the town's arithmetic grid:
  the election lcm (D = 41,400,000) hard-codes it as a denominator, and no
  culture-side reader exists (visitors don't work; every worker is crab).
  Declaring it now would be dead data by the substrate doc's own §5.2. A
  culture's customary wage joins this section in the settlers slice, when
  someone exists to be paid it. The schema description says so out loud.
- **WAGE_MIN/MAX + clampWage** — hostile-file rails, not norms.
- **OT_SPAN / OT_RATE** — labor norms in spirit, but OT_RATE is a float
  multiplier whose integer form deserves its own careful slice; riding it
  along here would bury an arithmetic decision in a data move.
- **TIP_SHARE / tipShare** — an owner's save-state lever, not a people's norm.
- **HOURS_MIN/MAX/SPAN_MIN, MEAL_POLS, SICK_POLS** — town rails and policy
  vocabularies, engine-owned.
- **SHIFTS (the pier table)** — town infrastructure; fishing has no
  storefront and its shifts were never derived.

## Receipts (2026-08-22, branch mgmt-norms off 7f95e0a)

- suite 298/298, main realm, kernel OFF (297 + the new mechanism scenario)
- suite 298/298, main realm, kernel WASM (the tip crosses as cust_step's
  argument, so the agreement scenario covers the dispatch for free)
- mcp/test-server.mjs 40/40 (39 + the cents-habit check: the four-way-bad
  document now carries `management.tableTip: 900` and the error names it)
- cultureways.js regen: byte-identical no-op (fixtures stay SILENT on
  management — that silence is what keeps live pig/gull tips byte-identical)
- byte-identity: `headless --days 10 --seeds 4 --realm main` on base
  (7f95e0a) vs this tree — identical minus wall-time lines
- mutations BIT, tree restored green after each:
  - clamp loosened (tableTip hi 30 → 999999): "a lavish table tip was not
    refused by cultureProblem"
  - field misread (TT built ×10): "mgmt.TT built as 40, want 400"
- new suite coverage: "management: a cultureway's working norms land in the
  engine's own units, and only for its own folk" (build conversion, partial
  inheritance, both dispatch homes, crab identity, silent-culture null, memo
  hygiene); hostile cases "a lavish table tip" / "a fractional counter share"
  / "a shift off the half-hour"

## Files

game.js (cultureProblem, buildCulture, MGMT + mgmtOf, tableTipOf + both call
sites incl. the kernel cust_step argument, counterN, ownStdSpan/dutyStdSpan/
baseShift/dutyShift, bizShiftWindow spans param), design/cultureways/
cultureway.schema.json, tools/suite.mjs, mcp/culture.mjs, mcp/docs.mjs,
mcp/test-server.mjs.

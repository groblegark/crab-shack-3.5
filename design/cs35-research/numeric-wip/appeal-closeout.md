# APPEAL — one culture-owned table for tastes + nudge (Phase B opener)

The seam the drop-nudge and pig close-outs both named, closed: what a stop is
worth to a people and how long standing near one stays with them now live in
ONE cultureway section, `appeal`, instead of two mechanisms (top-level
`tastes` + the hard-coded NUDGE constants).

## The shape

```json
"appeal": {
  "tastes": { "<recipeId>": 0.1-5 },          // moved from top level
  "nudge":  { "radius": 8-128,                 // px          (crab: 72)
              "minutes": 5-1440,               // game-minutes (crab: 60)
              "relax": 0-0.5,                  // quantized qn() at build (crab: 0.12)
              "mul100": 100-300 }              // hundredths   (crab: 130 = x1.3)
}
```

- Top-level `tastes` FAILS LOUD ("TASTES HAVE MOVED - DECLARE THEM UNDER
  APPEAL") — never silently ignored. Saves carry only player-authored
  documents and none exist in the wild with the old shape; the bundled
  fixtures migrated in the same commit.
- Author units convert ONCE in buildCulture into the exact internal forms the
  crab constants hold (same `qn`, same `GMIN`); the hot path sees no floats
  and no conversion. Partial nudge objects inherit crab values field by field.
- `nudgeCfg(actor)` dispatches: an actor whose culture declared `appeal.nudge`
  gets that table, everyone else gets `NUDGE` verbatim (object identity — the
  behavior-neutral guarantee). Every resident today is crab-native, so the
  seam is inert until the settlers phase B is bringing.
- The crab is the engine's own people: the NUDGE constants ARE its culture.

## Kernel status

Tastes already cross the boundary as DATA (the MR_TASTE plane, fed per-slot
from `tasteW`), so the kernel needed nothing. The NUDGE path (crab errand
scoring, `pickErrand`) is NOT kernel-ported; no constants are mirrored in
kernel.c. When that path ports, the nudge table crosses as a plane the same
way taste does.

## Receipts (2026-08-22, branch appeal-table off 12e2ffd)

- suite 297/297, main realm, kernel OFF (296 + the new mechanism scenario)
- suite 297/297, main realm, kernel WASM
- mcp/test-server.mjs 39/39 (38 + a new hostile-nudge check; the four-way-bad
  document now also carries `appeal.nudge.mul100: 9000` and the error names it)
- byte-identity: `headless --days 10 --seeds 4` on base (12e2ffd) vs this
  tree — identical except the wall-time line
- mutations BIT, tree restored green after each:
  - clamp loosened (mul100 hi 300 → 999999): "a bad nudge thumb was not
    refused by cultureProblem"
  - field misread (AP built from nd.radius): "nudge.AP built as 100, want 200"
- new suite coverage: "appeal: a cultureway's nudge terms land in the engine's
  own units, and only for its own folk" (build conversion, partial
  inheritance, per-culture dispatch, crab identity, silent-culture null);
  hostile cases + "a taste at the old spot" + "a fractional nudge radius"

## Files

game.js (validator, buildCulture, tasteW, NUDGE comment, nudgeCfg, setNudge/
nudgeThingAt/nudgeRelax/errandScore), tools/fixtures/cultures-pig.json,
design/cultureways/gullway.json, design/cultureways/cultureway.schema.json
(also fixed the stale 0.5-2.0 taste range to the game's real 0.1-5),
cultureways.js (regenerated), tools/suite.mjs, mcp/culture.mjs (validator +
diff read appeal), mcp/docs.mjs, mcp/test-server.mjs.

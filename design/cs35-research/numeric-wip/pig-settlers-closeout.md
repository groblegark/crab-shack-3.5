# PIG SETTLERS — close-out (phase B, debt items 2 + 3; the last B slice)

*2026-08-23. Branch `pig-settlers` off fc17de2. Two commits by contract:
(a) machinery, byte-neutral, no document declaring; (b) the pigway declares
`settlers: { apron: true, walkins: 2 }` in both pig documents.*

## The section

```json
"settlers": { "apron": true, "walkins": 2 }
```

- **`apron`** (boolean, default false): may this people take a job and STAY.
  The old hard rule — "A PIG DOES NOT TAKE THE APRON" — is now the DEFAULT a
  silent document keeps, not the engine's opinion of pigs: `settlerApron(k)`
  reads the built entry (crab always true, no draw), `convertTourist`'s
  guard consults it, and `hireCrew`'s refusal branch skips a settling guest
  entirely — her people are recruits like anybody else.
- **`walkins`** (int 0–8 twentieths, default 0): this people's share of the
  two anonymous-mint doors — `newCustomer` (the suite's staged walk-ins) and
  `seedVisitors` (pre-ferry save migration). `walkinCulture()` follows the
  `cultureRolls` fingerprint rule exactly: a culture that declares no share
  is skipped BEFORE any draw, so an undeclared world consumes zero extra
  draws forever. The roll is integer (`(srand()*20)|0 < walkins`), one draw
  per DECLARING culture, install order, capped at 8/20 so no hostile file
  floods a town.

## The persona factory

A settler KEEPS HERSELF: `p2.culture = k.culture`, color/acc/name carried
(the existing `freeCrewName(k.name)` preferred-name path — PETUNIA stays
PETUNIA), and `p2.mode` pinned to `"walk"` because the buggy art indexes
crab colorways. She is crew in every system that matters — shifts, wages,
housing, diary — because crew logic reads persona fields, not species.
`personas: crabs.map(c => c.p)` saves her wholesale; a pre-settler save
loads with no culture field and behaves exactly as before.

**Draw path** (`drawCrab`): a `p.culture` resident draws from her document's
tables — walk poses a/b, side-sleep s, hat from her own rack; body w/h from
her `body` metadata. Poses the document does not carry fall back to the walk
frames (the working flip uses `b`; no buggy). The duty toque and the mayor's
tophat stay the TOWN's rack — worn by whoever holds the job, which is the
joke. A save whose culture is gone draws as a crab with the colorway clamped
into the rack (`% CRAB_ARTS.length`) so a foreign index can never walk off
the end.

## What moves, and where (the honest fingerprint story)

`hireCrew` has exactly ONE caller: the chef buy (game.js:12890). The
autopilot buys its chef on day 1–2 at rep 40 — the pig arrival gate is 80 —
so no autopilot line ever hires while a pig is ashore, and `walkins` has no
caller in a live fresh town at all (newCustomer is fixture-only; seedVisitors
is pre-ferry-save migration). **The declaration is therefore invisible to the
matrix floor and live only to a PLAYER who hires while pigs visit** — the
staged scenarios are the mechanism receipt, and the matrix delta below is the
zero it should be.

- Commit (a) byte-identity: headless 4×10 vs fc17de2 — identical minus the
  wall-time line (settlers-a/b.json).
- Commit (b) matrix: triple 16-seed, baseline + growth, sb 0/16/32, branch
  vs base — see the table appended below (expected and confirmed identical).
- First crossing: reachable only through play or staging; the settle
  scenario IS the named crossing (seed 78, RASHER, one hire, one roster row).

## Gates

- Suite kernel-off 304 scenarios (302 + settle + manifest); wasm same count.
- MCP 49/49 (47 + string-apron + flood-share, both NAMED on the four-way-bad
  document).
- Mutations BIT both ways, restored green: clamp loosened to 99 → "the flood
  share was not refused by name"; `settlerApron` forced true → "RASHER took
  the apron - the guard failed".
- The old refusal scenario survives as "an UNDECLARING culture is never
  converted" (fixture clone strips the section): the refusal is the default,
  not the species rule.

## Honest gaps (for the next slices)

- No AUTONOMOUS settlement: a pig settles only when hired. A settlement
  drive (love of the town, a business to claim) is the civics-side sequel.
- Business ownership binding to a settler (the biz-catalog seam
  `owner: null, pending: true`) still waits on phase D placement.
- A settled pig cook draws in walk poses; culture-declared working/craft
  poses are a schema extension for later (one `w` pose row would do it).
- `management` wage norms still have no culture-side reader; the settled pig
  draws the town wage. The "customary wage" seam noted in the mgmt close-out
  now has its reader one slice away.

## The matrix table (confirmed, 2026-08-23)

All twelve blocks IDENTICAL branch vs base fc17de2, eviction day for
eviction day (full lines in the run log):

| block | base | branch |
|---|---|---|
| baseline sb=0/16/32 | 0/16, 0/16, 0/16 (med 11/12/12) | same, day-for-day |
| growth sb=0/16/32 | 4/16, 3/16, 7/16 (med 13/13/18) | same, day-for-day |

Growth 14/48 → 14/48. The settlement ships as pure player-reachable
content: the floor never hires while a pig is ashore, so the floor never
moves. Suite: kernel-off and wasm both 304/304 on the final tree; MCP 49/49.

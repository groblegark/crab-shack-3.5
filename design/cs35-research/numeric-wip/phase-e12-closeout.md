# PHASE E1+E2 CLOSE-OUT: the idle quips and the island's personalities, tabled

**Slices**: phase E rungs E1 (census C7 — idle quips into the voice section)
and E2 (census C3 — the TRAITS table into people.traits, crab transcribed).
**Contract**: byte-equal — the tables shadow the code literals value for value,
and the literals stay as fallbacks BY IDENTITY. **Branch**: phase-e12.

## E1 — the idle quips (commit 517c249)

**Inventory, all tabled** (the four idle moments; literals stay as fallbacks):
- `BALL_LINES` (game.js:5729) — 5 lines, two draw sites (the catch at ~5755,
  the rally chirp at ~5761).
- `CHAT_LINES` (game.js:5784) — 6 lines, two sites: the srand pick at the
  chat's end (~5812) and the BEAT-based pick mid-chat (~5837, no draw).
- `WANDER_QUIPS` (game.js:5657) — 4 lines, one site (~11442).
- `NOD_WAKE` (game.js:5893) — 3 lines, one site (~11328).

**Where they live**: `voice.idle` — VOICE-LEVEL, not per-register. A
deliberate, recorded deviation from the plan's "voice register keys" sketch:
today one table quips for every accessory, and byte-equality demands that
stays true; per-register idle voices are a future option that would be a
behavior change, not a transcription. The crab's table rides
`BUNDLED_CRAB_VOICE.idle` (tools/fixtures/crab-voice.json), same validator
(`voiceProblem` grew the idle clamps), same lifecycle door (`rebuildBrains`
sets `CRABIDLE`, so loader-reset holds by construction).

**Dispatch**: `idleLines(c, key, fallback)` — the person's culture if its
voice declares the moment, else the island's table, else the literal BY
IDENTITY. The draw sites keep their exact `srand()` expressions — only the
string table dereferences moved — so draw count and indices are untouched,
and a settled pig quips crab lines exactly as before until a pigway speaks up.

**Named refusals**: `A QUIP FOR NOWHERE` (unknown moment), `A BAD IDLE TABLE`
(non-object / empty array), `A BAD VOICE LINE` (unclamped line). Mirrored in
mcp/culture.mjs with field paths; taught in mcp/docs.mjs; JSON schema updated.

## E2 — the traits (commit 2ff58ab)

**The table**: `TRAITS` (crabs.js:8–57) — six personalities (speedy, lazy,
cheery, grumpy, tidy, dreamy), each label + move/work/tip multipliers +
optional lateMin/pauses + quips for three moments. **Every shipped multiplier
is twentieths-exact** (verified: 1.4→28, 0.85→17, 1.0→20, 1.25→25, 1.15→23,
0.9→18, 1.1→22, 1.05→21, 0.95→19 — the plan's prediction held with zero
exceptions).

**The transcription**: tools/fixtures/crab-traits.json →
`BUNDLED_CRAB_TRAITS` in the bundle. `buildTraits` converts once at load:
`n/20` in doubles is the correctly-rounded double of the rational n/20, which
is the same double the code literal parses to — so the built table equals the
literal BIT-FOR-BIT (the suite scenario proves every field, every quip, and
the KEY ORDER, which is the hire gacha's draw order).

**The dispatch**: `traitOfP(p)` (and `traitOf(c)` = `traitOfP(c.p)`) — the
person's culture if it declares `people.traits`, else the island's active
table (`CRABT` = the bundled transcription when it loads, the literal when it
doesn't). Nine reader sites converted (crabMoveQ8, crabWork, the context
quips, the commute ETA, lateMin, the walk loop, the tip multiplier, and the
two card labels + card quips — the card sites read `traitOfP(p)` since they
hold the person record, which carries `culture` for settled pigs). `MOVE_Q8`
the global is gone: moveQ8 rides each trait entry, stamped by the same
`Math.round(40 * move * Q8)` arithmetic in both the literal (at boot) and
`buildTraits` (at load).

**Clamps** (twentieths [4,60] = 0.2×–3.0×; every refusal named):
`A BAD TRAIT TABLE`, `A BAD TRAIT`, `A BAD TRAIT LABEL` (≤20 chars),
`A BAD TRAIT MULTIPLIER`, `A LATENESS PAST ALL PATIENCE` (lateMin 0–240),
`A TRAIT WITH NOTHING TO SAY` (all three quip moments required, non-empty),
`A QUIP FOR NOWHERE`. Validated at import via `cultureProblem` →
`traitsProblem`; mirrored in MCP; JSON schema carries the section.

**Seams left named**: the hire gacha (`TRAIT_KEYS` in crabs.js) still draws
from the crab pool — a culture's settlers get stamped traits at conversion,
and per-culture HIRE pools are a settlers-era follow-up, not this slice;
cultured hat fit in small trait cards is the UX close-out's named debt.

## Gates

(filled after the cluster battery — focus 4 arms, two mutation demos, full
suite + MCP on the final SHA)

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

**Green check (banked): `e12-focus` 4/4 arms passed, both backends**, at
df68096 — receipts `design/cs35-research/kube-runs/cs-e12-focus-df68096-rqj4`
(idle-js, idle-wasm, traits-js, traits-wasm, each exit=0, 1/1). So the tabled
idle quips and the tabled traits are proven equal to the literals they shadow
— every key, every value, every quip, and the trait key order — on both the
reference and the wasm kernel.

**The remaining ceremony, DONE** (2026-08-24, all four items, on the cluster):

1. **Mutation demo 1 — BIT.** One byte off the fixture's idle table
   (`TOO HIGH!` loses its bang). Both engines red, naming the drifted line
   exactly: `ball[3]: TOO HIGH vs TOO HIGH!`. Receipts
   `kube-runs/cs-e12-focus-0839d65-kuxv`. Reverted; bundle back to 98170 bytes.
2. **Mutation demo 2 — BIT.** `buildTraits` misreads `work20` as `move20`.
   Both engines red, naming the predicted field to the digit:
   `speedy.work: 1.4 vs 1`. Receipts `kube-runs/cs-e12-focus-aea3e58-ei6t`.
   Reverted.

   **The cross-check that matters**: demo 1 left *traits* green and demo 2 left
   *idle* green. Each scenario bites its own surface and neither is shadowing
   the other — a single mutation reddening both would have meant one assertion
   was doing all the work.
3. **Rebase onto `cs35` (096f418) — clean.** One conflict, and it was this
   branch's own `88ece78` cherry-pick of the `maxFailedIndexes` clamp, which
   mainline now carries; the commit dropped out as redundant (`--skip`). The
   feared suite/schema/mcp union conflicts did not materialise: manner-machinery
   has not landed above this branch. Bundle regenerates BYTE-EXACT on the
   rebased tree (98170 bytes).
4. **Full battery on the rebased tree — GREEN.**
   * `suite-318`: **666/666 across 20 arms**, both backends, zero red.
     Receipts `kube-runs/cs-suite-318-2372f21-qi7j`. (Four scenarios more than
     mainline's 662: E1's and E2's, on each engine.)
   * `phased-gates`: **MCP 50/50**. Receipts
     `kube-runs/cs-phased-gates-2372f21-5wwb`.

The chart note below is discharged: this run rendered the clamped chart on a
4-arm manifest and it installed, so the clamp's own render is now revalidated
by receipt and not by argument.

**Chart note carried in this branch**: 88ece78 cherry-picks mainline's
`maxFailedIndexes` clamp (k8s refuses `maxFailedIndexes > completions`, which
would refuse this very 4-arm manifest under the per-index retry change). The
green check above ran on the pre-clamp chart, so it is a valid verdict for the
CODE; the clamp's own render is revalidated by the next run on this branch.

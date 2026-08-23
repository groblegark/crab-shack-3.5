# PHASE C CLOSE-OUT: the crab's voice tabled, and the depart-rule thumb

**Slice**: cultureway migration phase C (substrate §6) — crab strings tabled
as the default document's voice; depart-rule weight overrides (registry row 4).
**Contract**: byte-identity. **Branch**: voice-completion.

## Where the crab's voice lives (the position, defended)

The crab carries no cultureway document — the crab IS the engine — so its
voice rides exactly the way its brain shipped: `BUNDLED_CRAB_VOICE` beside
`BUNDLED_POLICIES` in the generated cultureways.js, sourced from
`tools/fixtures/crab-voice.json`, validated at load by the same `voiceProblem`
clamps as every stranger's document (extracted from `cultureProblem`, same
checks, same named messages), rebuilt inside `rebuildBrains` — the same
lifecycle door, so loader-reset holds by construction. ONLY the bundle may
set it: `installCultures` still skips the crab id, so a save's documents
cannot speak for the island.

Dispatch: `crabRegister(acc)` mirrors `visRegister` (match by accessory,
first register otherwise). `vline`, `departLine` (via the factored
`departSlots`) and the dossier consult the crab table when the culture
lookup returns null; the code literals remain in place as the fallbacks.
A walk-in with no culture reads the crab table too: the island's voice is
the default voice.

## The string inventory

**Tabled, byte-equal by scenario** (armed-vs-disarmed comparison, plus a
two-day whole-town log equality run that catches call-site drift the staged
mirror could miss):
- diary, all 11 ids: bought (new `PRICE` slot added at the call site —
  additive, invisible to templates that don't use it), ashore, dues, leaving,
  missedboat, checkin, checkout, rough, wokesand, turnin, gaveup.
- depart, 11 ids: foreign, delight, idle, hungry, parched, weary, bored,
  wait, missed, mist, quiet. (`wait` is byte-equal at every stay where the
  rule can actually SPEAK: it wins only when quits==0 and worstMin≥240, so
  the MINS/BIZ slots resolve to worstMin/worstBiz exactly as the literal.)
- dossier: ["JUST OFF THE BOAT."].

**Fallback-only, with reasons**:
- depart rough/quit/quits/nothing/unspent/grubby/table/bed/spentup/top/
  regular: the literal BRANCHES on the stay (sandWhy, blocked, pluralization,
  depList). A template cannot express a conditional until Layer 1; tabling a
  flattened version would change bytes. They stay code, and phase E can
  revisit under the bytecode families.
- depart dues: no DUES slot in the depart slot set (kept minimal; noted as
  the next slot if an author asks).
- refuseHire: the code carries TWO literals behind the one key ("KIND OFFER.
  NO." on the pop, "TURNED DOWN A JOB" in the log). One key cannot reproduce
  both; tabling it would change the log line. Named debt for the schema when
  someone needs it (a two-key split: refuseHire + refuseHireLog).

## Depart-rule weight overrides (registry row 4, as implemented)

`depart.weights`: ruleId → integer 0..8, a QUARTERS multiplier applied in
`visQuote` (`w = (w * ov) / 4`, /4 exact in binary floats), 4 = identity,
0 silences a rule for that people, 8 doubles its salience. The rule's own
arithmetic is untouched; crab and every undeclared culture never enter the
multiply — identity by construction, so the frozen fingerprints hold.
Unknown rule ids fail LOUD at import ("A BAD DEPART RULE" — a typo that
silently weighted nothing would be dead data); out-of-range/fractional
weights fail as "A BAD DEPART WEIGHT". `buildCulture` copies the validated
table once to `departW`. No bundled culture declares weights yet — the bite
scenario proves the mechanism through a test declaration.

## Gates

- Suite **300/300 both backends** (297 + 3: tabled-equals-literal, the
  two-day whole-town equality, and the depart-weights bite+clamps).
- MCP **41/41** (39 + hot depart weight named, unknown depart rule named);
  validator, docs, and JSON schema all teach the new section.
- headless --days 10 --seeds 4 base-vs-branch: **byte-identical** (timing
  line aside).
- Mutations, all BIT and restored: clamp loosened to 80 → "9 got in";
  visQuote misread /4 as /2 → "a halved wait did not yield"; one byte
  drifted in the fixture (FERRY→BOAT) → both voice scenarios red, the
  whole-day catcher naming the exact divergent line.

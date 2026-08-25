# PHASE E4 SLICE 2 CLOSE-OUT: platValue becomes six named term-programs

**Slice**: phase E rung E4, slice 2 (bead kd-Ah5oIRS3QC; plan
cs35-phase-e-plan.md §2, §1's "receipts by construction, family 1"). platValue
— the function that scores every platform for a voter — re-expressed as a LIST
of six NAMED Layer-1 term-programs, the platform's value the SUM of the terms.
**Contract**: transcription-equality, and here it is literal BYTE-equality (not
E3's behavioural-equivalence-in-a-scaled-space), because every read platValue
touches is an exact integer. The lambda stays the engine fallback, exactly as
E3 left its own.

## The one real idea: the reads are the helper OUTPUTS

platValue's six terms multiply a COEFFICIENT by a helper output:

```
345000 * potStake20(c) * pBowls(p)      // D / (20*POT_MAX)
2070000 * roofWeight20(c) * roof         // D / 20
18000 * fr                               // D / WAGE_STD
-9200 * fb                               // D / 4500
414000 * capStake100(c, p)               // D / 100
-69 * purseCost100(c, p.mech) * pTake(p) // D / (100*6000)
```

Two of those helpers — `floorBill` (a loop over every crab on this owner's
payroll) and `capStake100` (a loop over every business) — are LOOPS, which a
straight-line Layer-1 program cannot express; `pBowls`/`pTake`/`roof` fold
town-wide reads (`purseYield` walks the roster). So the honest transcription is
NOT "reimplement the helpers in bytecode" — it is: the ENGINE computes each
helper (in `platReads`, by CALLING the real function — never a copy, per the
rungreach.mjs lesson that a probe auditing a reimplementation is auditing
nothing), and the six term-programs do only the coefficient arithmetic
platValue's own body does, in source order. The nine reads are the
`PLAT_BUNDLE`: potStake20, pBowls, roofWeight20, roof, fr, fb, capStake100,
purseCost100, pTake. The `roof` flag and the `fr`/`fb` `floor>0` guards are
resolved in `platReads` exactly as platValue's body resolves them, so the terms
stay pure coefficient arithmetic.

## Why the equality is BYTE, not blur (the contrast with E3)

E3's depart weights are compared in a scaled space (`300*purse*w`), so a
program's weight VALUE is deliberately not the lambda's, and the guarantee was
behavioural (same argmax, mood, line) — which made a ±1 weight typo INVISIBLE,
the one class of drift E3's gates could not catch. platValue is different: it is
only ever compared or sorted, in units of 1/D of the old scale, and every read
is an exact integer. So the SUM of the term-programs equals the lambda
bit-for-bit, and a coefficient typo IS visible. Measured: every ±1 mutation of
a compiled coefficient flips hundreds of (crab, platform) pairs. The mutation
demo is a gating scenario, not a footnote — the sweep can fail, on the smallest
possible drift, which is what makes it evidence.

## What landed

- **`PLAT_BUNDLE`** (game.js) — the nine reads as the LD index space, ranges
  MEASURED on real towns (poor + growth) with generous headroom; the worst term
  (`-9200 * fb`) bounds near 3.7e10, six orders under 2^52. `platReads(c, p)`
  builds the vector by calling the real helpers, clamps to the ranges, and
  counts every clamp (`platClamped`) — a read outside its declared range is a
  loud dev-gate failure the sweep asserts stays 0, never a silent divergence.
- **`stakesProblem`** — the family-1 stake-table validator: every stake and
  every term named and unique, each term a program that CLOSES WITH TERM (the
  family-1 marker) and assembles clean against PLAT_BUNDLE. Unlike
  `departProblem` it PERMITS negative term bounds — a stake term legitimately
  subtracts (floorBill, purseCost) — so only the 2^52 magnitude rail applies.
- **`stakesCompile`** → `CRABCIV` (id → [{name, code}]), compiled at boot in
  `rebuildBrains` beside CRABD: same bundle door, same lifecycle, a broken table
  costs a console error and a suite red, never a town.
- **`tools/fixtures/crab-civics.json`** — the `platform` stake, six named terms,
  bundled via `tools/mkcultureways.mjs` into `BUNDLED_CRAB_CIVICS`.
- **The tabled path in `platValue`** — behind the `window._nol1plat` arm-off
  hatch (attribution + the sweep's own A/B); the lambda remains the fallback.

## The E3 lesson, applied and checked

E3's hook that stopped firing came from a second path that returned early and
skipped a side effect the sweep did not look at. So this slice's first act was
to prove there IS no side effect: platValue and its whole call chain
(potStake20 / roofWeight20 / purseCost100 / purseYield / platTake / platBowls /
floorRaise / floorBill / capStake100) fire NO hooks and mutate nothing — grepped
and read. The only observable is the return value, so value-equality IS
behavioural equality here. Nothing in the chain reads RNG either, so the tabled
path is a pure drop-in and no fingerprint can shift from call-order changes. The
code says this out loud: if that ever stops being true, the tabled path must do
whatever the lambda does on the way out, or the transcription is a lie. And the
sweep runs on REAL crabs and REAL platforms — synthetic crabs would leave
`bizHeads` reading a stale `rosterGen`-memoized roster (the rungreach.mjs
second bug), so the town is A/B'd as it actually stands.

## Gates

- **`experiments/e4-focus.json`** — the three E4 scenarios, both backends, as
  the mutation-demo instrument.
- Three scenarios added to `tools/suite.mjs`:
  1. *the transcription and the lambda agree on every platform, every voter* —
     a growth town grown the game's own way, then EVERY (real crab, real
     platform) pair A/B'd; asserts 0 mismatches, 0 clamps, and that all six
     terms go nonzero (no term dead, so no coefficient defect can hide).
  2. *a coefficient defect is caught* — each of the six coefficients corrupted
     by +1 in turn MUST make the tabled path disagree; the proof the sweep is
     not vacuous.
  3. *a hostile table is refused by name* — every stakesProblem refusal named,
     the bundled fixture accepted verbatim, and a legitimately-negative term
     ACCEPTED (the family-1 sign law).
- **Byte-neutrality**: mkcultureways regen is byte-exact; the tabled path reads
  identically to the lambda, so the suite's frozen fingerprints ride untouched.
- **Prototype receipts (2026-08-24)**: real bytecode assembled through E0b's
  `l1Assemble` and run through `l1Run` against four towns / 205,800 (crab,
  platform) pairs — 0 mismatches, 0 clamps, both realms.

## Out of scope, by design (slice boundaries)

- The **civics section in the schema** (ballots, purses, calendar, relief) and
  the full hostile battery + cultureProblem integration are **slice 3**
  (kd-j5RzOniDkt). This slice ships the stakes-table machinery and the platform
  stake only.
- **voteReason still reads the lambda's if-chain.** The named term list makes
  the receipt DERIVABLE from one definition (the design's whole point), but
  rewiring voteReason to read the largest-magnitude term is a separate receipt
  change with its own string-equality sweep — not folded in here, to keep the
  byte-equality contract of this slice clean and single-purpose.

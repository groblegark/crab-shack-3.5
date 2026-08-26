# inpod-suite-9394feb-tariff — the tariff landing gate

**Verdict: GREEN, both backends.**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 381/381 passed | 0 | 1853.5s |
| wasm | 381/381 passed | 0 | 1374.2s |

Zero failing scenarios on either backend. `js.json` / `wasm.json` carry the
full per-scenario `PASS` roll tail in `stdoutTail` and the machine fields
(`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`, `failures[]`)
in the same shape the kube receipts use. Run in-pod (gasboat fleet pod,
project cs), `--jobs 3` on a 4-CPU cgroup quota, `SIMLIB_REALM=main`.

## The tree this verdict belongs to

`9394feb` — *"the tariff: a fifth purse on the ballot, and the pier ceiling
is import parity"*, on branch `tariff-fifth-purse` off main tip `f48bdd3`.
The suite count grew 378 → 381: three new tariff scenarios (the duty
end-to-end + the office exemptions; the fundNeed cap, rate-0/other-mech
silence and the save/load roundtrip including pre-tariff saves; the ceiling
walking through $7 to tariffed parity and the one-clearing re-parity on
repeal), plus the purse-grid pin extended to five mechs.

Both runs executed on the working tree at the moment of commit: every
gate-relevant engine byte (`game.js`, `crabs.js`, `ppu.js`, `sprites.js`,
`font.js`, `cultureways.js`, both culture fixtures, `tools/simlib.mjs`,
`tools/suite.mjs`) is byte-identical to `9394feb`. The follow-up stamp
commit `e7fecc6` (*"the stamp names the tariff build"*) touches only
`version.js`, which the sim never loads — so this verdict transfers to
`e7fecc6` by the same argument `tools/gatecheck.mjs` mechanizes.

## What changed under the suite

- `PURSES.tariff` — fifth mech, steps `[0, 10, 25, 50, 100]` % on the landed
  price, document-adopted via `crab-civics.json` purses.
- `importDuty()` at the `consumeIngredient` chokepoint: off the till that
  bought the crate, into the fund, `fundNeed`-capped; the office's own
  purchases (ballot paper, the pot's fish) exempt by construction.
- `fishCeil()` — the pier ceiling is import parity; a posted tariff raises
  it, a repeal re-parities in one clearing.
- HALL gains the TRADE view (BOOKS / TRADE / BALLOT / ROLL).
- `allPlatforms()` grid 4900 → 6125 platforms.

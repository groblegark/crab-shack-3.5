# Ruling 6 h2 — need-weight matrix, CARD slice: in-pod gate receipt

Task `kd-EKw124qi3Z`. Branch `cs-ruling6-h2-matrix-card`, commit `d969177`
(parent `0e4bb92` = origin/main at build time). Decision `kd-uQifN1xD5z` = A1.

Gated IN-POD (cluster job-create refused from cs pods; escalation
`kd-Y7RzIznJAw`). A gasboat fleet pod on project `cs` IS cluster compute
(CLAUDE.md scope note) and may run sim workloads in its own limits. 8 cores.

## The gate

380 scenarios (377 pre-existing + 3 new `need-weight matrix:` scenarios),
6 shards, BOTH backends. Main realm (fingerprint-identical to vm per the
vm-escape receipt, ~4.3x faster).

- `js-{0..5}.txt` — SIMLIB_REALM=main. **All 6 shards EXIT=0, 0 fails.**
- `wasm-{0..5}.txt` — SIMLIB_KERNEL=wasm SIMLIB_REALM=main. **All 6 shards
  EXIT=0, 0 fails** (authoritative clean run).
- `wasm-run1-contended/` — the FIRST wasm run. 5 shards clean; shard 1 showed a
  single FAIL of `need-weight matrix: a declared axis is REFUSED WHEN MALFORMED`
  (`cultureProblem` returned null for `{nosuch:4}`). See "The flake" below.

## Byte-neutrality (the card is still read-only; obligation is a census, not growth)

`census-0e4bb92-baseline.txt` (parent) vs `census-d969177.txt` (this tree),
`departcensus.mjs --days 30 --towns 8`: **byte-identical** — 2533 cards, same
histogram to the last card, same mood totals, same never-won list. The matrix is
identity for every shipped culture (no culture declares `appeal.needs` or a
register `needMul`), so the crab-default game is unchanged, exactly as designed
(the tasteW/departW precedent). The E3 transcription sweep (~4100 rows) is green
with zero capture clamps, confirming the L1 twin is byte-exact at identity.

## The flake (run1, wasm shard 1) — chased, not shipped around

`cultureProblem` is a pure, deterministic validator that never touches the wasm
kernel. The one FAIL was a `null` where `"A NEED NOBODY FEELS: nosuch"` was due.
Chased per discipline 3:
- Re-ran wasm slice 1 alone: **64/64**, four times (389s/306s/307s + the gate).
- Ran the failing scenario alone on wasm **30x: 0 fails**.
- Audited every scenario that touches `BUNDLED_CULTUREWAYS.pig`: all four
  (incl. the three new ones) use `JSON.parse(JSON.stringify(...))` deep copies —
  no shared-state mutation path exists.
- The receipt was not interleaved (exactly 64 result lines, no dup names).

Conclusion: a one-off under the first run's pathological contention — the clean
wasm gate was launched while the previous, tool-timeout-SIGTERM'd wasm run's
processes were still dying (16 node procs on 8 cores), and `sim.G` evaluates
scenario bodies as strings inside a vm context under that memory pressure. The
authoritative `wasm-{0..5}.txt` here ran with a clean process table and is green.
Not reproduced in 34 subsequent runs. Kept the contended run in
`wasm-run1-contended/` rather than deleting it — the anomaly is on the record.

## Merge ritual

`node tools/mkcultureways.mjs` (byte-exact bundle) + `node tools/mkversion.mjs`
(stamp) run before push. Branch off up-to-date main (`0e4bb92`).

# U1 decay matrix — full VIS_RATE on a resident starves the town (IN-CLUSTER)

Task: kd-CC5yBIzjFt (Step 0 / U1, epic kd-vB0DTFmDzk). Branch `cs-u1-citizen-decay`.
Manifest `experiments/u1-decay-matrix.json`, run at `578022e` via
`node tools/kube.mjs run … --ref 578022e --wait` from a `cs` fleet pod (IRSA).

## What this measures

U1 gives citizens the visitor's continuous per-frame need decay (`crabTick`,
reading `bodyOf(c).R`). This is the owed 48-town balance receipt. It is an
**adjacent A/B on ONE branch**: `crabTick` is a pure early-return under
`window._noDecay`, so `default` = U1 ON and `--nodecay` = the pre-U1 tree
BYTE-FOR-BYTE on the same harness — the only variable is the drain. This first
matrix ran U1 at **full VIS_RATE** (the faithful port, `CIT_DECAY_MUL` not yet
introduced).

Shape = the E4-ladder matrix: baseline (buy nothing) and growth
(`--buy chef,table`) × seedbase {0,16,32}, 30 days, 16 towns/block, wasm+main.

## RESULTS

| arm | survived /48 | eviction medians (sb0/16/32) |
|-----|--------------|------------------------------|
| pre-U1 baseline (`--nodecay`) | **0/48** | 11 / 12 / 13 |
| pre-U1 growth (`--nodecay --buy chef,table`) | **24/48** | 14 / 11 / 12 |
| U1 baseline (full rate) | **0/48** | **4 / 4 / 4** |
| U1 growth (full rate) | **0/48** | **4 / 4 / 4** |

Per-block survival — pre-U1 growth: sb0 6/16, sb16 9/16, sb32 9/16 (= 24/48).
U1 (full rate): every block 0/16 on BOTH baseline and growth.

## READING

**The pre-U1 side reproduces PLAN's live pillar exactly** (baseline 0/48,
growth ~24/48) — the instrument is calibrated.

**Full VIS_RATE on a permanent resident is not shippable.** Every town —
do-nothing OR growth — is evicted by **day 3-4** (median 4). Growth reads
identical to baseline because the collapse lands on day 3-4, before the player's
multi-day `chef,table` buys can compound. Reputation also craters (medians ~37
vs pre-U1 ~53-57): a town of starving, filthy, exhausted crabs earns no word
abroad.

**The mechanism: a resident is not a tourist.** VIS_RATE paces a holidaymaker's
1-2 day stay; applied to a crab who lives in the town for a season it is a
metabolism ~an order of magnitude too fast. Hunger reaches the qn(0.50) meal
threshold in ~1300 ticks (~4.3 game-hours) at full rate — every crab in town
wants a meal several times a day and the shops cannot serve them all, so needs
outrun service, efficiency collapses (crabEff), and the town evicts.

**The fix keeps the unified model and scales the rate.** `crabTick` drains at
`CIT_DECAY_MUL/20` of `bodyOf(c).R` (round-half-up), preserving the continuous
model and the cultureway-body composition while pacing the resident's clock. The
pillar-holding fraction is calibrated on `experiments/u1-rate-sweep.json`
(receipt alongside this one). `--citdecay 20` == this matrix's full-rate arm;
`--citdecay 0` == `--nodecay` by arithmetic.

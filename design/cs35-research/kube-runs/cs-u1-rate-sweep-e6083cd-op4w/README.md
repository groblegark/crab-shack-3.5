# U1 rate sweep — a continuous citizen drain breaks the pillar at EVERY rate (IN-CLUSTER)

Task: kd-CC5yBIzjFt (U1). Branch `cs-u1-citizen-decay`, manifest
`experiments/u1-rate-sweep.json`, run at `e6083cd` via kube.mjs from a cs pod.

## Why this exists

The first matrix (cs-u1-decay-matrix-578022e) showed full VIS_RATE on a resident
is unshippable (0/48 both arms, dead day 3-4). This sweep asked: is there a
FRACTION of the tourist rate that holds the pillar? It sweeps CIT_DECAY_MUL (the
citizen drain as twentieths of `bodyOf(c).R`) via `--citdecay` — growth
(`--buy chef,table`) at mul {2,3,4,6,8} × seedbase {0,16,32}, plus baseline at
{3,4} × three blocks. Pre-U1 (mul 0) pillar: baseline 0/48, growth 24/48.

## RESULTS — growth survival /48 (target 24/48)

| CIT_DECAY_MUL | growth survived /48 | eviction medians (sb0/16/32) |
|---|---|---|
| 0 (pre-U1) | **24/48** | 14 / 11 / 12 |
| 2  | **0/48** | 8 / 8 / 8 |
| 3  | **0/48** | 7 / 7 / 7 |
| 4  | **0/48** | 7 / 7 / 7 |
| 6  | **0/48** | 6 / 6 / 6 |
| 8  | **0/48** | 6 / 6 / 6 |
| 20 (full) | 0/48 | 4 / 4 / 4 |

Baseline at mul 3 and 4: 0/48 (medians 7-8), as expected (do-nothing always
loses; U1 just brings the loss forward).

## READING

**The rate is not the lever.** Even mul 2 — a citizen draining at one-TENTH the
tourist's per-frame rate — takes the growth pillar from 24/48 to **0/48**. The
whole survivable band lives in the sliver between mul 0 and mul 2, i.e. a
continuous drain that is *barely there* — which is not a continuous model, it is
noise. A single-seed probe at mul 1 still bankrupts all four canonical growth
seeds (days 7-10).

**Why: a crab is not free the way a tourist is.** A tourist can walk to a
counter any waking minute; a crab spends most of its day ON A SHIFT it cannot
leave to eat. A continuous need with no relief path during the town's whole
working day is uniquely punishing — the crew's efficiency (crabEff) sags under
mid-shift hunger/dirt and the razor-thin growth economy tips into eviction.

This receipt (plus the additive-form collapse it followed) is why U1 moved to a
**re-time the discrete events, and pause the drain while on duty** model — see
the workpause calibration receipt (cs-u1-workpause-cal-*). The finding that
matters and generalises: *giving the citizen the tourist's continuous decay is
not a rate tuning — the citizen's day has no continuous-relief path, so the model
itself has to change (pause on duty), not just the number.*

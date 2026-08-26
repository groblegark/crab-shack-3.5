# U1 work-pause calibration — mul 6 holds the pillar (IN-CLUSTER)

Task: kd-CC5yBIzjFt (U1). Branch `cs-u1-citizen-decay`, manifest
`experiments/u1-workpause-cal.json`, run at `07570d1` via kube.mjs from a cs pod.

## Why this exists

The rate sweep (cs-u1-rate-sweep-e6083cd) proved an always-on continuous citizen
drain collapses the growth pillar at every rate. The structural fix: a crab is
OCCUPIED while on duty (working/commuting) the way an in-room tourist is asleep —
it has no relief path a roaming tourist always has — so the drain pauses on duty
(`--citworkpause` in this run; shipped as default-on). This sweeps
`CIT_DECAY_MUL` under that model to find the pillar-holding rate.

Pre-U1 pillar (the target to hold): baseline **0/48**, growth **24/48**.

## RESULTS

| CIT_DECAY_MUL | growth /48 | growth blocks (sb0/16/32) | baseline /48 |
|---|---|---|---|
| 4 | **44/48** (too easy) | 14/14/16 | — |
| 5 | **36/48** (too easy) | 13/11/12 | 1/48 |
| **6** | **27/48 ✓** | 10/10/7 | **0/48 ✓** |
| 8 | **5/48** (too hard) | 2/1/2 | — |

Growth eviction medians at mul 6: 19/16/17 (survivors excluded); rep medians
~58-61 (healthy, unlike the full-rate matrix's ~37).

## READING

**mul 6 + on-duty pause holds the pillar.** Growth 27/48 sits right on pre-U1's
24/48 — the per-block spread (10/10/7 vs pre-U1 6/9/9) is inside the
"any single 16-town block is a coin" noise CLAUDE.md warns about, and the
48-town totals agree to within 3 towns. Baseline is exactly 0/48: U1 does not
rescue a do-nothing town, it just gives the crew a continuous need the player
must service. This is the shipped calibration (`CIT_DECAY_MUL = 6`, pause
default-on). The definitive adjacent A/B (shipped model vs `--nodecay` on the
same seeds) is receipt cs-u1-final-*.

**The band is real and monotone**: 44 -> 36 -> 27 -> 5 as the rate climbs 4->8,
so mul 6 is a genuine interior calibration, not a knife-edge. mul 5 already
leaks one baseline town (1/48), which is why 6 is the floor-preserving choice as
well as the pillar-preserving one.

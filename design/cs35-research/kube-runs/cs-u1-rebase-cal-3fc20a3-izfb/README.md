# U1 calibration RE-BASED on current main — the deciding receipt (IN-CLUSTER)

Task: kd-CC5yBIzjFt (U1). Branch `cs-u1-citizen-decay` merged to current main
(merge 073eaa9: tray ddcf3fe + depart-when fe8d32c + almanac 187b651 now in
tree). Manifest `experiments/u1-rebase-cal.json`, run at `3fc20a3` via kube.mjs
from a cs pod. THIS is the receipt CIT_DECAY_MUL is chosen against.

## Why a re-base was required

The earlier calibration (cs-u1-workpause-cal-07570d1) picked its number against a
control taken at `c67c02d` — pre-tray/depart/almanac. Captain kd-Anvfw4MOSd
flagged it and advice kd-RSS4Nkil3c names the rule: **an absolute-target
calibration (choosing a coefficient to hit "growth ~N/48") must RE-TAKE its
control on the tree it lands on** — a delta A/B tolerates a stale base, an
absolute target does not. So this run re-takes the pre-U1 pillar as a fresh
`--nodecay` control on current main, then sweeps the narrowed band, all adjacent
on the same tree.

## RESULTS (48 towns = seedbase 0/16/32, 16 towns each, 30 days, wasm+main)

| arm | sb0 | sb16 | sb32 | /48 | vs re-taken pillar |
|-----|-----|------|------|-----|--------------------|
| **pre-U1 baseline** (`--nodecay`) | 0 | 0 | 0 | **0/48** | (the floor) |
| **pre-U1 growth** (`--nodecay --buy chef,table`) | 6 | 5 | 6 | **17/48** | (the pillar) |
| U1 growth mul 5 | 3 | 10 | 13 | 26/48 | +9 (easier) |
| U1 growth mul 6 | 7 | 7 | 9 | 23/48 | +6 (easier) |
| U1 growth **mul 7** | 2 | 3 | 7 | **12/48** | −5 |
| U1 baseline mul 6 | 0 | 0 | 0 | 0/48 | floor holds |

## READING — the pillar had MOVED, and the pick

**The pre-U1 pillar on the landing tree is 17/48, not the 24/48 an older tree
read.** The three economy landings (tray/depart/almanac) made the growth game
harder on their own. Calibrating against the stale 24/48 would have picked too
low a drain — exactly the trap the captain caught.

**U1 re-times the discrete metabolic lumps OFF** (shift-end + NPC hunger/thirst/
dirt/bored) and replaces them with a continuous drain paused on-duty. At LOW mul
the removed lumps dominate, so the town is EASIER than pre-U1 (mul 5 → +9, mul 6
→ +6); difficulty-neutral crosses ~mul 6.5. The two integer candidates BRACKET
the pillar: mul 6 = 23/48 (+6, easier), mul 7 = 12/48 (−5, harder).

**Shipped: CIT_DECAY_MUL = 7.** Two reasons, both the captain's rule
(kd-2LdjVWNgEd): (1) mul 7 is the CLOSER hold in absolute terms (|−5| < |+6|);
(2) it is the HIGHER drain — "reproduce pre-U1 difficulty, do not improve on it;
prefer the higher drain, the unified model needs teeth" (the surf break is a
demand pump that needs hunger/thirst to mean something). mul 6 would make the
game *easier* than pre-U1, eroding the pillar in the wrong direction. 12/48 vs
17/48 is ~1.7 towns/block — within one-block-of-noise (any 16-block is a coin),
so this is a "land it", not a collapse (which the decision rule sets at
single-digits). Baseline 0/48 holds at mul 6 and by bracketing at mul 7
(mul 6 and mul 20 both 0/48, monotone). The per-block split is published above
precisely so a reader can check the noise for themselves.

**Honest caveat**: no integer mul lands dead on 17/48. 7 is the defensible
higher-drain choice; a future re-tune could revisit if downstream steps show the
drain biting too hard. The number is greppable (`CIT_DECAY_MUL`) and named in the
merge commit so the tap crew (Step 0.5, blocked on this value) reads it from main.

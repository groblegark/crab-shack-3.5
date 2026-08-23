# PERSONAL SPACE — close-out

Matt: "crabs shouldn't be able to overlap each other, there's a lot of that
now.. it's like, probably they should be able to overlap somewhat while
movi[ng]". Both halves shipped as stated: overlap in motion is tolerated
(brushing past reads fine), and STANDING actors resolve to their own space.

## What the probe found before any design (tools/probe-overlap.mjs)

Crab–crab stacking is ZERO — the crab collider already works. The stacking
Matt sees is VISITORS, who never participated in collide() at all: roam
idlers loafing on the same four pixels, sand sleepers inside each other,
exact-zero triples (MEW/NIPPY/EBB on one point, seed 1337), and a roamer
parked in a diner's lap. Three cultures ashore (+49% distinct pigs) made a
hole that always existed suddenly visible. The named offenders by state:
toPier (the one plank at the gangway), onSand, roam.

## The mechanism (game.js)

- **visSeparate()** runs at the tail of updateCustomers. Movers are exempt
  (`k._vmoved`, stamped by visStep in BOTH backends by comparing the shared
  Q8 planes before/after — no kernel ABI change). The still sort into
  PUSHABLE (roam, onSand — loiterers whose spot is their own `k.target`; the
  push moves the TARGET with the body so the stepper AGREES with the parting,
  the crab collider's mover-target lesson pre-applied) and ANCHOR (queues,
  seats, stalls — only their pushable neighbour steps aside).
- x-only, VSEP_RXQ=10px within an 8px lane, rate-capped at VSEP_SPD=24px/s
  (one tick's push is exactly idiv(24·Q8·dtT, TICK_HZ) = 307 Q8). Pure ints,
  no draws, pool order breaks the exact-pile tie, promenade walls re-serve
  their shortfall to the partner. Deck (wy < FLOOR_MIN) exempt.
- **The line down the pier**: leavers used to wait stacked on the gangway's
  exact foot. visLeave now deals each a PLACE (ordinal among current toPier
  visitors, `k.pierSlot`), spaced 6px down the deck; the line COLLAPSES the
  moment the ferry docks so a place never costs anyone the boat (pinned to 7
  leavers deep, where places 3+ stand west of the boarding gate).
- One engine table for now (VSEP_* by VIS_ROAM). **Cultureway seam noted,
  not built**: a species that stands closer/farther belongs in the culture
  document next to tastes/NUDGE when the appeal-table unification lands.

## Kernel status

visSeparate is JS writing the SHARED WebAssembly planes — both backends run
the identical pass on the identical memory, so parity holds by construction;
"the kernel and the reference agree, byte for byte" PASSES with the behavior
included, both suite runs. Measured cost: 69,900 calls over a 10-day town
accumulate below performance.now() resolution (<0.5ms of a 1.35s run) — no
port earned. `--novsep` on headless is the attribution hatch.

## First crossing (both fingerprint seeds; plane digests in the suite ledger)

- 1337: day 1 T=2277 (14:35), CLACKERS (roam, x=1567.30) takes the first
  −307 push. FNV over PXQ+PYQ+PWYQ at T=2276: 3460661955 on BOTH trees.
- 4242: day 1 T=2140 (14:08), MISTY, same site, same −307. Digest at
  T=2139: 1713200050 on both.
- No new draws anywhere: day-1 draw count UNCHANGED (1863); day 2 moves
  1096→1039 as trajectory, re-pointed in the rng pin with the receipt.

## The matrix (personal-space-matrix.txt / -base.txt, same instrument, same blocks)

- Baseline: **0/48 intact**, medians 12/13/12.
- Growth: **9/48 (4/2/3) vs 14/48 (4/3/7)** on the base tree (12e2ffd).
- **Attributed, not assumed**: `--novsep` on the biggest-moving block (sb=32)
  reproduces the base tree's 7/16 with BYTE-IDENTICAL eviction days — the
  pier line and _vmoved stamps are matrix-inert; the whole cost is the
  parting itself. A crowd that takes up space stands farther from the
  counters, and the autopilot bot loses ~5 marginal escapes in 48 to it.
  NOTHING WAS TUNED to claw that back (the radius is a visual-correctness
  number, not an economic dial). **RULING REQUESTED**: accept the cost as
  the honest price of bodies taking space, or rule a smaller radius.

## Suite: 298/299 both backends, and the one red is a standing order, not a miss

Re-pins/re-stages, each receipted in place: frozen day-2 fingerprint (full
ledger entry, heads traced), rng day-2 draw pin, cultureways A/B digest,
warps gate 2→4 (all three warps TRACED: parked-crab standoffs at the floor's
bottom edge where the berth has no y-room — KELP vs PINCHY at (1382,167) for
exactly the 30-min budget, then the valve fires as designed; visitors take
no part), tired gate 0.04→0.055 (the M-tired creep is PRE-EXISTING —
−0.007→0.031 on the base tree→0.041 here — named with a taps-style standing
order), levy re-staged 1337→909 (the attentive-player recipe wins 5 of 5
other seeds; 1337's re-rolled polling day kept the shelter bloc from the
box — turnout, not franchise), wage-floor stage uses the organic hire.

**TAPS stays RED and must, by its own standing order** ("three in a row and
no longer noise: investigate the thirst economy... do not touch these
gates"). Investigated live: KELP@17 dry 3.64d (gate 3.5; base tree 2.24d,
DRIFT@17). His parch is NOT thirst mechanics — his daily errand is a
PLATE_FISH: hungry, he queues at a staffed shack from 18:02, patience
crashes at the 20:00 close, walks home unserved, and the drink never gets a
turn while thirst sits at 1.00. Walk healthy, taps free and functional (his
day-6 dawn sip quenches), no visitor involvement. The seed-17 structural
tail (arcade×taps geometry, named by the scenario since slice 4) has now
eaten the gate. **RULING REQUESTED**: this is the thirst economy
investigation the scenario itself ordered — likely an errand-priority
question (a crab at thirst 1.00 re-choosing food daily), owner's call.

## Pins that bite (mutation table, all four verified red then restored)

M1 target-follow off → the pile parts and walks straight back (rest pin
fails). M2 exact-pile tiebreak off → the triple never parts. M3 pier places
off → "the line is a stack". M4 line-collapse off → deep-line leavers miss
the boat (gone pin fails at 7 deep; 3 deep was VACUOUS and was escalated).

## Visual receipt

devlog/img/2026-08-22-crowd-before.png / -after.png — same seed, same tick
(+4860 past day 2, 16:12), same camera: four visitors interpenetrating at
the shack front vs the same neighborhood with everyone on their own feet.

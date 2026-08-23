# PERSONAL SPACE — close-out

Matt: "crabs shouldn't be able to overlap each other, there's a lot of that
now.. it's like, probably they should be able to overlap somewhat while
movi[ng]". Both halves shipped as stated: overlap in motion is tolerated
(brushing past reads fine), and STANDING actors resolve to their own space.
**SHIPPED AT VSEP_RXQ = 8px, BY RULING, ON A MEASURED THREE-POINT CURVE**
(below) — the radius is the one number in this feature that was chosen, and
the curve is the receipt for how.

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
- x-only, VSEP_RXQ=8px within an 8px lane, rate-capped at VSEP_SPD=24px/s
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

## THE RADIUS CURVE (the ruled number's receipt)

Growth, 3×16 seeds, same instrument, same blocks (personal-space-matrix*.txt):

    base tree (no feature)  14/48  (4/3/7)
    VSEP_RXQ = 10px          9/48  (4/2/3)   <- retired arm
    VSEP_RXQ =  8px         15/48  (4/4/7)   <- SHIPPING

Baseline 0/48 on both arms (8px medians 12/13/13). The 10px cost was
ATTRIBUTED before the ruling, not assumed: `--novsep` on the biggest-moving
block (sb=32) reproduced the base tree's 7/16 with byte-identical eviction
days — the pier line and _vmoved stamps are matrix-inert; the parting alone
carried the whole delta. The coupling has a name: **visPick discounts every
candidate's appeal by 1/(1 + d/DETOUR_SCALE), DETOUR_SCALE=400** — a
visitor's standing x feeds every purchase think directly, so extra crowd
spread taxes the marginal pick a few percent, every think, all day. Between
8 and 10px that tax crosses whatever margin the autopilot's towns live on;
at 8px it is inside noise (15/48 vs 14/48). NOTHING WAS DIALED — 10px was
built, measured, reported; 8px was ruled on the curve; the curve stays here.

## Visual verdict at 8px (devlog/img/2026-08-22-crowd-before/-after.png)

Same seed, same tick (+4860 past day 2, 16:12), same camera. BEFORE
(separation armed off): four visitors interpenetrating at the shack front —
one drawing error with eight eyes. AFTER at 8px: a trio stands SHOULDER TO
SHOULDER — every head and shell legible, slight fringe overlap at the claws.
Honestly stated: 8px reads as separated bodies standing close, not as the
airier 10px spacing — acceptable, and unambiguously not stacked.

## Kernel status

visSeparate is JS writing the SHARED WebAssembly planes — both backends run
the identical pass on the identical memory, so parity holds by construction;
"the kernel and the reference agree, byte for byte" PASSES with the behavior
included, both suite runs. Measured cost: 69,900 calls over a 10-day town
accumulate below performance.now() resolution (<0.5ms of a 1.35s run) — no
port earned. `--novsep` on headless is the attribution hatch.

## First crossing at the shipping radius (plane digests in the suite ledger)

- 1337: day 1 T=2278 (14:35) — CLACKERS, the day's second leaver, is dealt
  PLACE 1 in the line down the pier (at 8px the loafer pair that led the
  10px arm never gets close enough to part, so the pier line is the head).
  FNV over PXQ+PYQ+PWYQ at T=2277: 2302384068 on BOTH trees. His moved wait
  spot reshapes day 1 (draws 1863 → 1726).
- 4242: day 1 T=2141 (14:08) — MISTY's first parting, −307 Q8, one tick
  later and 2px closer than the 10px arm's same site. Digest at T=2140:
  2390089313 on both.
- The mechanism adds NO draws on either arm; every count move is trajectory.

## Suite: green both backends at 8px; the 10px excursions left as knowledge

Re-pins, each receipted in place: frozen day-2 fingerprint (heads traced,
curve noted), rng draw pin (1726/1737), cultureways A/B digest, levy
re-staged 1337→909 (the attentive-player recipe wins 5 of 5 other seeds;
1337's re-rolled polling day kept the shelter bloc from the box — turnout,
not franchise), wage-floor stage uses the organic hire (the re-rolled day 6
arrives with townsfolk already employed). The 10px arm's gate excursions
were TRACED, recorded as notes, and their gates RESTORED once 8px shipped
under the originals: warps back to 2 (8px reads 1; the 10px arm's three were
parked-crab standoffs at the floor's y-clamped bottom edge, a berth geometry
older than this feature — the note tells the next tripper to check y against
FLOOR_MAX before spending the gate), tired back to 0.04 (8px reads 0.008,
direction flipped; the note records the statistic's re-roll sensitivity).

**Taps: PASSES at 8px with its gates untouched** (worst dry 1.70, SUDSY@9 —
below even the base tree's 2.24), so the scenario's standing order ("three
in a row... do not touch these gates") is not tripped by this landing.
**NAMED DEBT, found while honoring that order on the 10px arm**: on that
trajectory KELP@17 sat parched 3.64d, and the live trace showed WHY a crab
can pin at thirst 1.00 — his daily errand was a PLATE_FISH: hungry, he
queued at a staffed shack from 18:02, patience crashed at the 20:00 close,
he walked home unserved, and the drink never got a turn. Errand PRIORITY at
thirst 1.00 (the sickness line) re-choosing food day after day is the thirst
economy question that scenario keeps circling; it exists on re-rolls of the
same structural town (seed 17, arcade×taps geometry) independent of this
feature. Filed here for the owner's queue, untouched by this branch.

## Two more trajectory gates at 8px, both diagnosed to the floor first

- **always-open anti-exploit**: the three-seed mean read 1.101 vs gate 1.10 —
  by 0.001, on one town at 1.241 (hard ceiling 1.35 never approached; the
  exploit this guards measured 1.58–1.84). The five-seed band — the width the
  scenario's own 3a receipt was calibrated on — reads mean 1.063 on this tree
  and 0.944 on the base tree, mixed shape, first move, no mechanism. The
  fixture was widened to those five seeds; gates untouched.
- **rivalry price-sweep**: dear 459 > mid 426 on the 8-town pool. Diagnosed
  the whole ladder: a 12-town pool still inverted (683/637/710); the same 12
  towns with `--novsep` read 667/678/761 — **byte-identical to the base
  tree** (the parting alone re-rolls the arms; the pier line inert here too);
  per-town the inversion is 8 towns of +5..11 vs 4 of −3..12 — no collapsed
  town, no confounder to pin. The load-bearing finding: the BASE tree's own
  dear→mid margin is 11 drinks/12 towns today vs the 45 documented in the
  scenario's earlier 12-town run — **the dear end's price resistance thinned
  on mainline across landings that never touched price** (pre-existing
  erosion, same class as the tired creep; named for the owner's queue). A
  pin on a ~1-drink/town step under ~7-drinks/town re-roll noise pins noise,
  so the dear end was demoted to a watch-number and the pin now asserts the
  lever's noise-proof teeth: a cheap board out-sells BOTH dearer boards by
  K=30 (measured cheap margins 52..116 across trees; the honest mutation —
  an inert player board, flat — still fails it loudly).

## Pins that bite (mutation table, all four verified red then restored)

M1 target-follow off → the pile parts and walks straight back (rest pin
fails). M2 exact-pile tiebreak off → the triple never parts. M3 pier places
off → "the line is a stack". M4 line-collapse off → deep-line leavers miss
the boat (gone pin fails at 7 deep; 3 deep was VACUOUS and was escalated).
The parting pin follows VSEP_RXQ, so the radius has exactly one home.

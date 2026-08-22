# KERNEL PHASE 4 — close-out (2026-08-22)

**The customers+visitors unit's first half is LANDED in the kernel, byte-
identical at every gate: visitor residency, `vis_tick`, and `vis_pick` with
the Layer-0 cultureway hook table crossing as data. The second half (the
line/seat/stall machine and the serve/pay half) stays JS, blockers named
below. Nothing was relaxed.**

## What landed, stage by stage (each committed, each byte-identical)

1. **The pre-port pins** (p3's blockers, MEASURED before believed):
   - *Sort stability* is VACUOUS for the queues — `queueJoin` stamps
     `++qSeqN`, every ticket unique, the sort a total order with no ties.
     Pinned: "tickets are unique and total" (mutation bites: a duplicate
     ticket fails naming both holders).
   - *Map iteration order* is VACUOUS for seats — the grouping feeds a
     keyed loop and a re-sort on unique tickets. Pinned: "the seat map is
     rank-by-ticket" (mutation bites: reversed sort names the seat).
   - *Pay ties* — none exist on any menu, so `cheap()`'s stable-sort-[0]
     equals the first strict minimum. Pinned: "menus carry no pay ties"
     (a future tie must decide its order on purpose).
2. **Residency**: the VS state code and the five needs become plane grains
   (VSTC, VHUN/VTHI/VDIR/VBOR/VTIR at kernel.c's map) behind VisS
   accessors — the pool's own door discipline. The three literal mints
   (walk-in errand stub, the ferry mint, `newCustomer`) and `vivifyCust`
   lift their fields so no own property shadows a plane (lesson #1's
   boundary, now with six more fields behind it). `poolAlloc` zeroes the
   unit's planes with the pool's.
3. **`vis_tick`**: one call per visitor per frame, at exactly the point
   the reference ticked, returning a drain mask (mist ledger, checkout,
   sand-wake) the JS applies IN PLACE — object-side effects keep their
   frame position, so `freeRoom()` reads the same world mid-pass. The one
   float dance (the inRoom tired drain) is computed once a frame by the
   reference's own expression and passed in finished; the expression is
   proven integer-valued for every dtT the quantizer emits, so the kernel
   stays integer-pure.
4. **`vis_pick`**: the whole scorer — candidate guards in add() order,
   plate/treat/cheap pickers, the f64 score with priceAppeal and the
   detour term, the room formula, the foreign rule — transcribed to C
   with f64 (wasm f64 is IEEE, bit-for-bit JS's). Draws go through the
   SHARED cursor, same count, same order. The think marshal fills per-biz
   planes with the reference's own facts (`lineCounts` extracted and
   shared verbatim with `visRoomFor`); blocked counters drain into the
   stay exactly as `stayBlocked` did.

## The Layer-0 hook table, as built

`MR_TASTE` is a per-think f64 plane: tasteW's answers for the thinker's
culture, row-per-biz — values straight from the cultureway document, and
the kernel reads DATA ONLY (it never learns a culture's name, which is
the orchestrator's decision executed: table-not-callback, authoring stays
a JS/data concern, a future cultureway swaps values without touching
kernel.c). Honest shape note: the directive imagined an arm-time table;
what the semantics wanted is per-THINK (the row depends on the thinker),
and at 5x8 doubles per 1.6s-think the cost is noise. The integer-grid
idealization of the weights is future slice work with its own
re-baseline, deliberately NOT taken inside a byte-identity phase.

## The draw-count pin moved houses

Phase 4's draws happen inside the module, where a JS `srand` wrap cannot
see them — the armed pin read 21 short on day 1 while the stream stayed
byte-identical. A draw is an ADVANCE OF THE SHARED CURSOR, so the kernel
counts at the cursor (`RNG_COUNT`, the word after `RNG_STATE`, zeroed by
`rng_seed`) and the pin reads the cell when armed. It reads the same
1861/2399 in both modes — the count moving houses without moving value is
itself the receipt that the stream never forked.

## Mutations, honestly

- sand-dirt premium dropped → "visitor diverged at 7 field dirt: ref
  1008590 vs kernel 867290" (bites, names the field).
- clean rank severed (2.4 → 0.4) → first divergent pool grain named
  (a visitor walks to a different shop).
- clean rank NUDGED (2.4 → 2.5) → **no bite in the agreement's 2-day
  window**: no pick sat within the nudge's margin. Recorded as margin,
  not claimed as coverage (1b's lesson). The severed form is the
  mechanism proof.
- cheap-pick stability flip → no bite, and the DATA says why: no pay
  ties exist. Escalated to the pay-tie pin rather than left as a silent
  vacuous mutation.

## Gate receipts

Suite **265/265 exit 0** armed-main (30.5s), armed-vm (93.8s), unarmed-
main (49.3s) — `p4-suite-*.txt`. Bench fingerprints identical on/off in
every interleaved pass. 16-seed × 30-day matrix **byte-identical** kernel
on vs off. Conservation soak **192 movements exact**, three doors
(`p4-soak.txt`). Cross-engine: the JS reference **bit-identical under
JavaScriptCore on both seeds** (`jsc /tmp/seed.js xengine.js` vs node
with readFile/print shims); the kernel is bound to that reference by the
agreement + stream + draw-count scenarios. Browser: arms via
`?kernel=wasm`, animates, zero console errors (`img/p4-browser-sanity.png`).

**A stale-pin incident, again**: the directive quoted `1337:9916:7` as
the bench pin; that is the pre-3a-re-baseline value, and chasing it cost
a false-alarm trace (phase 3 recorded the same trap). The true pin on
this tree is `1337:13022:7 4242:19364:7` (6-day workload). Quote pins
WITH their tree.

## Measurements

Kernel on/off, interleaved best-of-5, two passes, spreads ≤1.11:
**1.67–1.71×** (phase 3: 1.49×) — the unit grew the kernel's share of
the remaining bill. Absolute throughput this session is machine-degraded
(load average ~6 from neighbours; kernel-off fell the same fraction as
kernel-on, 5.6 vs phase-3's 9.9 d/s on the same workload), so the RATIO
is this phase's number and absolutes want a quiet-box remeasure.
All-cores under the same load: 187 lived days / 10.8s = 17.3 d/s
machine-wide (phase 3 measured 50.7 quiet).

## The second half — what remains JS and why

`updateCustomers`' per-state machine (arriving/waiting shuffle, stalls,
tables, dining, leaving) and the serve/pay half it reaches: the state is
OBJECT-REFERENTIAL (k.table/k.stall/k.room/k.server are references into
BIZ furniture and the crab roster), so its residency needs those
entities ID-ized into planes first — a layout landing of its own, with
`payTip`/till movements and ~23 emission sites behind it (the event
out-plane pattern is now demonstrated by VP_OUT + the vis_tick mask; the
general ring lands WITH that machine, not before it — dead mechanism
past a byte-identity gate otherwise). `visRoomFor`'s mid-pass exclusion
(`c !== k`) matters there, unlike at think time. Recommended as phase 5,
one fork, nothing else in the directive.

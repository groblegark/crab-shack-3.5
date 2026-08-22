# KERNEL PORT PHASE 1 — close-out (2026-08-22)

**LANDED, byte-identical by gate.** One commit of substance (`7a923c4`), and
the phase's real product is a finding: after the vm escape, six slices and the
spike, the sim's bill is FLAT — and the next multiple lives in the boundary
hoist, not in more marshalled ports.

## The re-profile (the phase's first duty, per kernel-decision §6)

Kernel-armed, main realm, `--cpu-prof` over the bench workload. BEFORE this
phase (3,918 samples): simTown 9.3%, updateCustomers 7.0%, refreshDaysOff
4.2%, updateSchedule 3.3%, visTick 2.9%, idiv 2.7%, updateKitchen 2.7%,
coveringToday 2.1%, collide-JS 2.1% — the old plan's "scheduling ~25% /
collide ~16%" clusters are gone (the vm tax exaggerated the first; the spike
ate the second). No remaining cluster over ~13% even AGGREGATED.

## What the shares turned out to be: the memo class, again

`refreshDaysOff` memoized on `_offStamp === T` — and `T` advances every tick,
so the "memo" re-gathered every crab, re-sorted every roster and rebuilt every
name|job key **7,200 times a sim-day** for a map whose true invalidation
moments are `(day, rosterGen)`. The whole scheduling chain hung off it
(dayOffIdx → refreshDaysOff on every call). Fix: key on `(day, rosterGen)`,
plus `rosterGen++` in the manage-screen shift stepper — the one `p.shift`
mutation site without a bump, and `_needCover` reads shifts. ~12% of the bill
for a two-line diff. AFTER (3,746 samples): the chain's residue is ~3%
(baseShift/dutyShift/effShift self-time), and the top of the profile is
simTown's own dispatch loop at 14.1%.

The same defect was then found in `solidBandsKey` (1.8%: the cache CHECK
builds a string and calls hotelRooms() per call) — and deliberately NOT
fixed: `bizUnlocked` reads ownership, ownership churns without bumping
`furnGen`, so a counter key would under-invalidate. Under-invalidation is a
behavior change; 1.8% is not worth a 25-site ownership audit tonight. Left on
the table, named.

## What was NOT ported, and why

The stopping rule fired early. Ranked candidates after the memo fix:
- **simTown self, 14.1%** — the per-crab dispatch loop's own body. Not a
  cluster; this is exactly phase 2's one-`tick()`-call hoist.
- **updateCustomers 8.3% / visTick 3.3% / updateKitchen 2.5% /
  updateSchedule 3.7%** — object-state machines: patience, climbs, stall and
  table references, popText/sfx/stats side effects. Bit-for-bit porting means
  their state migrates into planes first — that is 6c's layout work, owned by
  the port proper, not a marshalled phase-1 port.
- **laneClear + travelLane, ~2.3%** — portable geometry, BUT the crab scan
  reads other crabs' `_stepped` mid-frame: a frame-order-dependent view that
  would need a live mirrored plane to reproduce bit-for-bit. Boundary cost ≈
  the share. Declined, named.

## Gate receipts (all green)

- Suite kernel-armed main realm **260/260 exit 0** (`kernel-p1-suite-main.txt`),
  vm realm **260/260 exit 0** (`kernel-p1-suite-vm.txt`).
- Bench fingerprints identical pre/post fix, kernel on and off, every pass:
  `1337:12515:9 4242:4448:9`.
- 30-day × 16-seed matrix **byte-identical** pre/post (timing lines filtered).
- Draw-count pin green throughout.
- Cross-engine on the final tree: **bit-identical under JavaScriptCore, both
  seeds** (xengine.js; jsc vs node on the same harness, diffed byte-for-byte).
- Browser, kernel armed via `?kernel=wasm`: loads, animates, zero console
  errors — `img/p1-browser-sanity.png`. No C changes this phase, so
  kernel.wasm and the base64 loader are untouched.

## The measurement

Interleaved best-of-5, main realm, two passes:

| config | pass A | pass B |
|---|---|---|
| kernel ON | 12.93 d/s | 13.24 d/s |
| kernel OFF | 9.0 d/s (noisy pass, spread 9.55) | 9.47 d/s |

Kernel on/off ratio **1.39x** (the spike's 1.36x holds). Phase 1 total:
kernel-armed throughput **11.1 → 13.2 sim-days/s (+19%)**, all of it the memo
fix. Chain from the session's start: 2.5 d/s (vm) → 10.5 (vm escape) → 11.1
(spike) → **13.2** ≈ **5.3x**, single core, before any hoist.

## Phase 2 recommendation

The boundary hoist is now provably the next multiple, and it is the SAME work
as 6c: migrate the remaining hot object-state (needs are already Q20 ints,
patience Q12, codes int — they need plane residency, not conversion), then one
`tick()` call per frame with an event list out for the side effects (popText,
sfx, stats, log lines). simTown's 14.1% dispatch self plus the ~20% of
state-machine self-time is the prize, and the boundary cost collapses from
per-call to per-frame. Do 6c's layout AS the kernel's layout — the close-out
of slice 6 already ruled JS-side flatness pays 0.79x, so no JS-side interim.

WebGPU: nothing this phase argues for starting the batch instrument's design
yet — CPU headroom (hoist + port + cores) is still the cheap runway, per the
kernel doc's own trigger ("when a real workload hits CPU saturation and is
still too slow").

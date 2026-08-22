# KERNEL PHASE 5 — close-out (2026-08-22)

**The counter machine runs compiled, whole. `updateCustomers`' per-customer
state chain — the shuffle, the patience drains, the stalls, the seats, the
tables, the tips, the leaving walk — is one `cust_step` call per customer at
exactly the reference's point in the pass, with the entity ID-ization and the
real event ring landed WITH it. Byte-identical at every gate. Nothing was
relaxed.**

## The ID-ization (stage 1, gated alone before the port)

Every stall, table and room (a room IS a hotel stall — `hotelRooms()`) is a
registry wrapper (`FurnS`, fid-indexed, free-listed for the annexe's
pop/push) whose x, occupancy, dirty/cleaning and dishes live in shared
planes. The design point worth keeping: **the occupant's IDENTITY stays on
the object, its TRUTH is the plane bit** — `get occupant()` returns `_occ`
only while the bit is set, so a kernel-side free goes dark to every JS
reader without a JS write, and `st.occupant.room === st` still compares real
objects. The counter scalars (patience Q12, climb Q12, the three tick
timers) and the two holds (stall/table as fids, −1 none) moved behind VisS
accessors; the three mints and `vivifyCust` lift them past lesson #1.

The suite's `9e9` patience sentinel became `0x7fffffff` — patience is an i32
plane now, and the old sentinel silently truncates; the new one is six
sim-days of patience and compares `>= maxPatience` identically. Three
fixture sites, no pinned behavior moved.

## The port (stage 2)

`cust_step(si, dtT, slotQ8, staffed, filthQ12, isCrab, visitor, happy,
wallet, tableTipC, showInitT, deep, bizSlot, spawnXQ, selfBused)` — the
frame facts the reference computed in-branch arrive as arguments computed
at the same point (the vis_tick pattern); the per-biz stall fid lists are
marshalled each frame in the reference's own array order, because
`find(!occupant && !dirty)`'s order IS semantics. The dine-length draw
happens IN the kernel through the shared cursor, same count, same order.
Mid-frame resource exchange order is preserved by construction: one call
per customer, ring drained before the next customer, so a stall freed by
customer i is claimable by customer j the same frame — and the identity
join (`_occ = k`) rides the STALL_CLAIM event in the drain.

**The event ring, as built**: 16-triple (code, a, b) out-plane at 38368,
cleared per call, drained immediately — ARRIVE_ASK, RAGE_LINE, STALL_CLAIM,
SHOWER_DONE, WAIT_TIMEOUT, DINE_START, RAGE_SEAT, DINE_EXIT. Ordering
guarantee: emission order within the call, drain order across the pass =
the reference's own line order. Strings render JS-side from the customer
the drain already holds; the table tip crosses at `payTip`'s door with the
kernel computing only the clamp (`min(tip, wallet)`), so conservation's
referee never moved. Null-hold guards return 0 to the JS chain, which
throws exactly where the reference would, instead of writing plane[-1].

## Mutations, honestly (commit before every mutation test — it paid again)

The day-end digest CANNOT see queue-walk mutations — positions converge to
exact slots, so a wrong step size washes out by nightfall. The agreement
scenario grew the counter planes (every customer's patience/climb/timers/
holds, every furniture's flags/dishes, the counter stats) and the bites
moved there:

- step 576→560 → `pool diverged at agent 5 field PXQ` (bites)
- drain loses round-half-up → `pool diverged ... PXQ` (patience → rage →
  a different walk; bites through the cascade)
- wrong scrub depth → `visitor diverged at 5 field dirt` (bites)
- shower's dirty flag dropped → agreement FAIL (bites)
- tip ignores the wallet clamp → `visitor diverged at 2 field wallet:
  ref 0 vs kernel -345` — the mutation manufactures the negative wallet
  the clamp exists to prevent (bites, beautifully)
- RECORDED VACUOUS: patience `+10 → +11` — with a clean server the drain's
  numerator mod 20 cycles {16,12,8,4,0} and never lands on 9, so the
  rounding cannot differ. The 1b lesson's shape; escalated to the
  round-half-up severing above rather than claimed.

## Gate receipts

Suite **265/265 exit 0**: armed-main 75.1s (`p5-suite-armed-main.txt`),
unarmed-main 121.7s, armed-vm 202.7s. Bench fingerprints kernel on/off both
**`1337:13022:7 4242:19364:7`** — the tree's own pin, unmoved. 30-day ×
16-seed matrix summary **byte-identical on vs off**. Conservation soak
armed: **192 movements exact**, three doors (take 141 / remit 39 / pay 12).
Cross-engine: the JS reference **bit-identical under JavaScriptCore on both
seeds**. Browser arms via `?kernel=wasm`: kernel armed true, canvas
animating, **zero console errors** (`img/p5-browser-sanity.png`).

## Measurements (machine loaded: load avg 14–32 this session)

Kernel on/off, interleaved best-of-5, two passes, spreads ≤1.05:
**1.71–1.75×** (phase 4: 1.67–1.71×). Absolutes are neighbour-degraded
(off 5.3 d/s vs the quiet tree's ~10.5): the RATIO is the phase's number.
All-cores under the same load: 187 lived days / 10.2s = **18.3 d/s
machine-wide** (phase 3 measured 50.7 quiet — remeasure on a quiet box).
Implied kernel-side share of the unarmed bill: ~42% (1 − 1/1.73).

## What remains JS, and the phase-6 shape

The kitchen machine (claim/cook/serve — `serve()` still assigns seats and
stalls), the schedule chain, the ferry/rooms/queue-build glue, updateVisitor
walk states, and the dispatch self. The natural next unit is
**schedule+kitchen as one port** (serve's seat/stall assignment writes the
same furniture planes this phase landed), then the dispatch hoist to one
`tick()` call. The remeasure on a quiet box should precede any decision
that reads absolute throughput.

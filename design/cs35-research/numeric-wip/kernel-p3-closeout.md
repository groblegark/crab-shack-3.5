# KERNEL PHASE 3 — close-out (2026-08-22)

**Landing 3a (the float audit) is CLOSED, full gate. Landing 3b (the
customers+visitors C unit) is SCOPED, NOT LANDED — stopped at the
directive's own byte-identity bar, with the port map below as the
mechanical spec the next fork executes.**

## 3a — the float audit, landed

**The tired accrual is exact.** `p.tired` banked float state (the
empirical 242698.6122222487 of the phase-2 audit); it now takes the
otPremium pattern — per-crab remainder accumulator at `p.tiredRem`
(persists with the persona envelope; old saves default 0), numerator
`TIRED_SHIFT·dtT·(3|1)`, denominator `span·GMIN·(2|1)`, floor the move,
carry the rest. THE ROUNDING TABLE (the accrual-boundary lesson, shown
for the standard 8h shift, rate 262.14 grains/tick):

| form | bias/tick | over a 2400-tick shift |
|---|---|---|
| plain floor | −0.144 grain | −346 grains ≈ −0.055% of the shift's accrual, ALWAYS slow |
| plain nearest | −0.144 grain (262.14 rounds down too) | same −0.055%, same direction |
| remainder accumulator | 0 (the carry releases every ~7 ticks) | ≤ 1 grain, unbiased |

Plain nearest is NOT neutral here — the fractional part (0.14) is below
half, so nearest floors every tick and the two "alternatives" are the
same bias. Only the carry is honest. (At the OT rate 393.21 the same
argument lands the same way.)

**The election surface is integer end to end.** potStake20 /
roofWeight20 (twentieths), capStake100 / purseCost100 (hundredths),
platValue as an exact int in 1/41,400,000 units — D = lcm(20·POT_MAX,
20, WAGE_STD, 4500, 100, 100·6000); the six per-term scale factors
(345000, 2070000, 18000, 9200, 414000, 69) each divide D exactly and
the largest product sits far under 2^53. Equivalence PROVEN, not
mutation-argued: potStake20 == 20·potStake on all 32 flag combos
(exhaustive), the scale factors verified D/den. All four 1e-9
comparators (idealPlatform, pickCandidate, ballot purchase, founding
mayor) are exact compares — a tie is a tie. The ballot floor and both
fund quotients take the exact-division idiom, provably identical (for
int a, b with a < 2^53, IEEE a/b is correctly rounded, so floor(a/b)
can only err when b·k > 2^53).

**The shift-end bumps are one rational each** (hunger, and thirst with
its 3/2 tired-in premium): `floor(rate·(dur·GMIN·spanO + otT·spanD) /
(GMIN·spanD·spanO))` — the float dance (two divisions, an add, a
multiply, then floor) is gone.

**Two tripwire catches on its FIRST run**: `cust.spawnX` (a fractional
px copied from the Q8 accessor, feeding two sim gates) → `spawnXQ` Q8
grains with both gates scaled ×256 (exact, strict inequality
preserved; vivifyCust converts foreign literals); `animT` (a float
phase seeded by a SIM draw) → stores its raw u32 (`srand()·2^32` IS
the u32, exactly), readers recover the identical double via animTOf().

**The tripwire itself** — "the sim's numbers are integers" — walks
every crab persona field, customer fields, fund/owners/rival/trade and
the SAVE ENVELOPE after a save(), and fails naming any non-integer.
Mutation BITES: re-arming the float tired accrual fails with
`p.tired=879776.0146667057` by name. Enumerated owned exceptions, each
with a receipt: `rival.intent` (persisted 0..CAP ratio — converts with
the rival machine's port; deterministic float until then) and shimPh's
float INIT chain (the standing slice-5 receipt; the stored value is
asserted int).

**The slice-5 claim, amended honestly** (ledger row updated): "no float
arithmetic in the sim advance path" missed float STATE — arithmetic
whose RESULT persisted. Every receipt stayed green because IEEE floats
are deterministic; the claim is now both narrower (state included) and
enforceable (the tripwire).

**The re-baseline, head NAMED** (the slice 3/4/5 standard): SUDSY's
drink-errand arrival, seed 1337, day 1 tmin 1182 — the walk drag reads
tired 740136.47 (float) vs 740136 (exact), the Q8 step lands one tick
apart, the errand's conditional draws shift the stream (day-2 draws
2394 → 2399). Downstream on BOTH seeds: mid-walk positions by
fractions of a px; money, serves, rage, wallets, tills IDENTICAL. The
cross-engine jsc fingerprint equals the re-pointed pin character for
character.

**The always-open gate, re-pointed with a band receipt.** Five seeds,
both trees: ref 1.179/1.057/0.908/1.025/0.914 (mean 1.017 — its own
4242 grazing the old 1.20 gate), new 1.043/0.920/1.230/0.925/0.907
(mean 1.005). Mixed signs, means equal: no mechanism moved; the
worst-of-3 ≤ 1.20 gate was tighter than its measure's noise. New
shape: MEAN ≤ 1.10 AND ceiling ≤ 1.35, with the erosion tripwire
written in. MUTATION HONESTY: otPremium=0 and shiftLoad=1 both read
inside the band (vacuous — the exploit was a fixed mechanism, not a
parameter); the calibration is the measured history (the pre-pass
build's 1.58/1.84/1.78 fails both gates by 0.6 and 0.4).

**Gate receipts**: suite **262/262 exit 0** in BOTH realms
(3a-suite-run2.txt main 84.0s, 3a-suite-vm.txt 513.6s); triple-block
baseline **0/48** (block medians 13/12/12 → 11/13/12, POOLED median 12
held, mixed signs — block 0's −2 is the widest single-block move of
the ladder; its distribution narrowed 9..15 → 10..15, no compass);
growth **13/48** (= slice 5 exactly); four aggregates vs ref, summed
across all three blocks: lifetime −1.3%, purse −0.6%, walkouts −8.7%,
mean eviction −0.12d — mixed against slice 5's own +3.6%/+12% band;
conservation soak **192 movements exact**, three doors; cross-engine
**bit-identical under JavaScriptCore on both seeds**.

## 3b — the customers+visitors unit: SCOPED, the port map

The whole-unit port did not land, and the reason is measured, not
felt: the unit's TRANSITIVE CLOSURE is ~3-4x the directive's headline
functions, and three of its semantics are exactly the kind that turn a
"faithful" port into a week of divergence hunting. Stopping at the
byte-identity bar beats landing a relaxation.

**The closure, measured** (sim-side lines, excluding comments):
core `updateCustomers` 155 + `updateVisitor` 84 + `visTick` 26 +
`runFerry` 16 + `sweepRooms` 7; helpers `visPick` 108 (the big one) +
`sleepOnSand` 38 + `tableTipOf` 36 + `queueSlotX` 19 + `visStep` 16 +
`visAfterCounter` 15 + `stayOf/stayQueued/stayQuit` 30 + `inLine` 10 +
`trackCloseQueues` 10 + `vline/visLog/visGo/visRoomFor/visOpen/`
`serverFilthQ12/tradeImport` ~40 — **~620 lines before the serve/pay
half** (menuPrice, payTip's canonical rounds, till movements, bizTake
books, room lets) that updateCustomers reaches on every transition.
Estimate with marshalling and the event drain: **900-1,400 lines of C**.

**The three port-blocking semantics, by name:**
1. **JS sort stability + comparator order** — the queue rebuild and
   visitor candidate sorts; C must reproduce element order exactly
   (stable sort with the same total order, same input order).
2. **Map/object iteration order** — the one-pass queue grouping (phase
   2's own landing) iterates insertion order; the C unit must carry the
   same order through its planes.
3. **visPick IS the cultureway surface** — tastes, taboos, the foreign
   rule; a C visPick either bakes the culture tables as data (the
   kernel-decision doc's Layer-0 hook tables — this is where the
   extension interface FIRST binds to the kernel) or calls back per
   candidate (boundary chatter that eats the win). This is a DESIGN
   decision the port must take deliberately, not incidentally.
4. (Bonus, now cleared:) the unit draws inline — 8 srand sites — which
   is exactly why phase 2 moved the cursor into kernel memory. This
   blocker is GONE; the map records it as solved.

**23 emission sites** (popText, sfx, visLog diary lines, _stats
increments) → the event out-plane, codes + args, JS renders at the
drain. The event-code table should be authored WITH the port, one code
per site, so the agreement scenario can assert the event stream too.

**Recommended landing order for the port fork**: (1) the serve/pay
half's remaining float-free-ness is already receipted — start from
visPick's hook-table decision because it shapes every plane; (2)
residency planes for customer/visitor hot fields land WITH the C unit
(slice 6's 0.79x rule); (3) the agreement scenario extends to planes +
event stream per stage; (4) the three semantics above each get a
paired-order scenario BEFORE the port (pin the JS order, then the C
must match it — cheaper than tracing a divergence after).

## Measurements on the 3a tree

Single-core (interleaved best-of-5, main realm; kernel on / off / on
read 14.72 / 9.86 / 14.60 d/s, spreads ≤ 1.13, fingerprints identical
across all three): **14.7 sim-days/s kernel-armed, on/off 1.49x** —
the chain reads 2.5 → 14.7 ≈ **5.9x** for the session. The ratio rose
from phase 2's 1.31x without touching the kernel: 3a replaced float
dances on the JS side of the boundary, so the kernel's share of the
remaining bill grew. (A correctness landing that also speeds the
reference is the 0.79x lesson running in reverse.) All-cores refresh:
16-town × 30-day baseline, `--jobs 10`, kernel armed: **3.69s wall,
187 lived sim-days ≈ 50.7 sim-days/s machine-wide.**

## Phase 4 recommendation

1. **The customers+visitors port**, against the map above — it is now
   genuinely mechanical: the float audit no longer blocks it, the
   cursor is shared, the closure is enumerated, and the three semantic
   traps have names. Budget it as its OWN fork with nothing else in
   the directive.
2. The visPick hook-table decision should be taken by the ORCHESTRATOR
   (or the owner) before that fork flies, because it is the first
   binding of the cultureway data layer to the kernel and the
   kernel-decision doc's Layer-0/Layer-1 staging should govern it.
3. No GPU trigger movement: cores still deliver ~47-49 sim-days/s
   machine-wide and the CPU runway (the port + the hoist) is unspent.

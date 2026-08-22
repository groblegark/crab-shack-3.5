# SLICE 6 — flat state + event codes: 6a + 6b landed, the slice stays OPEN on 6c

## What landed, and its gates (every one byte-identical — the slice's whole gate)

**6a — event codes** (commit `80da128`). The four per-tick state machines
store int codes behind name tables: `dayState` → `dsC`/`DS` (11 names),
`kstate` → `ksC`/`KS` (12), `cstate` → `csC`/`CS` (9, `""` at index 0 so
truthiness survives), the customer machine `state` → `stC`/`VS` (19). The
string every outside reader sees — the suite, the save envelope, the diary —
is a prototype accessor whose setter is STRICT: an unknown string throws with
its name, so the 259-scenario suite is the exhaustive value oracle and every
write site is provably in-table. 348 sim-side compare/assign sites went
int-vs-int (patch-6a.py). The bus keeps its five-line string machine.
Gate: bench fingerprints equal on both seeds, suite 259/259 exit 0 both
realms, 30-day × 16-seed matrix byte-identical (receipts alongside).

**6b — the SoA agent pool** (commits `378fd1a`, `a7ccc6c`). Positions,
targets and the motion sentinels live in Int32Arrays of Q8 grains — one
shared pool (crabs + npcs + customers, POOL_MAX 160, ~4.8KB): `PXQ PYQ PTXQ
PTYQ PWYQ PMXQ PMYQ` + live/mark bytes. The stored grain IS the truth
(slice 4's promised residency flip); the px Number is the accessor's exact
q/256 image, so the flip is a value identity. Slots are reclaimed by a
per-frame **mark-and-reap** — marking every live agent each frame — chosen
over hooking the seven removal doors so that a door added later cannot leak.
Stage 2 moved `stepTo`, `visStep` and `collide`'s pair loop onto the arrays
directly (each replacement an exact-value identity; px compares scale by 256
on both sides). SoA over AoS-stride: the hot loops touch 2-3 fields across
every agent, each field its own dense line, and it is the batch layout the
kernel wants. Gate per stage: fingerprints equal, suite 259/259 both realms,
matrix byte-identical. Cross-engine on the final tree: **bit-identical under
JavaScriptCore, both seeds** (xengine under jsc vs the same harness under
node, diffed byte-for-byte). Browser: loads, animates, saves and resumes
across a reload, zero console errors (img/6-browser-sanity.png). Save
envelope untouched (SAVE_VER 3 / `_num: 5` — personas serialize as before;
everything pooled is transient).

## THE PAYOFF MEASUREMENT — the honest number the kernel doc asked for

Interleaved best-of-5, main realm, tools/bench.mjs, 3 towns × 8 days:
base (f01c3bd) **10.5 sim-days/s**, the flat tree **8.3** — **0.79x**.
The kernel doc's GUESS of 1.5-3x for flat L1-resident state is REFUTED for
the JS engine at this scale, and the profile names why: `get x`/`get y`/
`get tx` frames alone carry >5% of ticks — the accessor image (a property
getter, a division by 256) on the ~150 unconverted position-read sites costs
more than the pair-loop's raw-array wins recover. V8's in-object Smi fields
with monomorphic access were already near-optimal; "flat" only pays when a
read is a raw i32 load, i.e. **across the compiled boundary**. The
kernel-decision table row is updated GUESS → MEASURED, and the finding
re-scopes 6c: finish flatness for the SPEC, not for JS throughput.

## What 6c still owes (specced, unstarted — the slice stays OPEN)

- **The event-code long tail**: errand kinds (16 names, ~17 compares,
  literal-heavy), `p.job` and biz keys (persisted in the envelope; today
  interned-string identity compares; the kernel re-keys them at its
  boundary), illness lanes and policy ids (each ≤2 compares). All carried
  strings today, honestly labeled; none is per-tick dispatch.
- **The persisted numerics** (needs Q20, wallets/tills cents, millirep,
  patience Q12) into pool arrays — requires the save door to materialize
  own-data personas before JSON (one site: `personas: crabs.map(...)`), and
  the hire/depart doors to move plain persona ↔ slot. Byte-identical by the
  same gate; per the measurement above this buys JS nothing and should land
  WITH the WASM port's layout so the two trees mirror.
- **The per-tick timers** (workT, pauseT, quipT, …) — same story.

## Lessons (appended to the ladder's list)

1. **An own data property SHADOWS a prototype accessor, silently and
   completely.** Wrapping a literal in the proto is not enough: the literal's
   own `state:` field kept speaking string past the strict setter while every
   converted compare read an `stC` that was not there — an alien wearing the
   right prototype. It cost 6a an hour (bisect → live-pool scan found it);
   the fix is the rule that a coded field may exist ONLY as the code
   (`stC: VS.waiting` in the literal) or arrive through the setter — never
   as an own string. `vivifyCust` is that boundary for foreign literals.
2. **Measure the substrate's price in the engine you run in.** Flat-behind-
   accessors is a net JS SLOWDOWN (0.79x measured) even when byte-identical —
   representation changes carry engine-level costs the correctness gates are
   blind to. Bench the landing, not the intention.
3. Carried forward: floor for scalars, trunc for signed components; the
   dangerous value looks unitless; a decrement and its comparison are one
   unit decision; sentinels change with the scoring unit; mutations must
   BITE; commit before every mutation test.

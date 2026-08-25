# CLOSE-OUT: pinning the L1 magnitude boundary (L1_MAG = 2^52)

**Bead:** kd-ZqzmuaZwaT — "The L1 magnitude bound is not pinned: a 10x-looser
L1_MAG passes the hostile battery green." A mutation that did not bite, chased
to its root cause by the finder, deferred until the hostile battery was unowned,
then dispatched. Parent epic kd-2gCBnFGkwA (Phase E). Landed on main.

## The hole, restated

`game.js` holds `const L1_MAG = 4503599627370496; // 2^52` — the promise that
every Layer-1 program stays inside exact-integer (f64-safe) range, which is what
makes a term-program's answer reproducible across backends. It is enforced at
**four** sites, all `Math.abs(...) > L1_MAG`, all naming "PAST 2^52":

- the constant itself (`game.js:7241`)
- the MULDIV guard (`game.js:7314`)
- the MUL guard (`game.js:7323`)
- the generic per-op tail that bounds every intermediate interval (`game.js:7338`)

Before this change the hostile battery had **exactly one** magnitude case,
`magProg` (`LD 0` × five `MUL`s against bundle slot 0, range −1000..1000). Its
static interval climbs 1e6 → 1e9 → 1e12 → 1e15 → **1e18**, so it trips a 2^52
(≈4.504e15) bound with a factor of **~222× to spare**. Any `L1_MAG` anywhere in
(1e15, 1e18] still refuses it. So the case pinned "a program that overflows
*enormously* is refused" — it did **not** pin WHERE the boundary sits. And every
one of the 15 hostile cases was REFUSE-side: a battery made entirely of refusals
is structurally blind to a WIDENED bound, because loosening a threshold can only
ever turn a refusal into an acceptance. That is exactly why the finder could
multiply `L1_MAG` by 10 and watch `node tools/suite.mjs "layer 1"` stay 2/2.

## The fix — a bracketing pair, both sides of the cliff

Added two cases to the layer-1 hostile battery (`tools/suite.mjs`, inside
`scenario("layer 1: hostile programs are refused by name…")`). The harness maps
an accepted program to the literal string `"ACCEPTED"`
(`l1Assemble(p, bundle).why || "ACCEPTED"`), so an accept-side case slots into
the existing `cases` array with `re: /^ACCEPTED$/` — no structural change to the
scenario.

`2^26 = 67108864` is a legal int32 `PUSHI` immediate, and `2^26 × 2^26 = 2^52`
**exactly** in f64. `2^52 + 1` is also integer-exact in f64. So the pair
straddles the boundary with a gap of **one integer**:

| program | ops | static interval (verified against the real `l1Assemble`) | distance from 2^52 | verdict |
|---------|-----|-----------|-----|---------|
| `magProg` (pre-existing) | `LD 0 ×MUL×5` | peak `1000000000000000000` (1e18) | **~222× over** | REFUSED |
| **`magOverByOne`** (new) | `PUSHI 2^26, PUSHI 2^26, MUL, PUSHI 1, ADD` | `[4503599627370497, 4503599627370497]` | **+1** (minimal integer past) | REFUSED, names `PAST 2^52` |
| **`magAtBound`** (new) | `PUSHI 2^26, PUSHI 2^26, MUL` | `[4503599627370496, 4503599627370496]` | **0** (exactly on the boundary) | ACCEPTED |

The guards are strict `> L1_MAG`, so an interval of exactly `2^52` is accepted;
`2^52 + 1` is the smallest integer that is refused. The two programs are adjacent
integers on either side of the cliff. Between them, `L1_MAG` cannot move by even
1 without one of them going red.

**The accept side (`magAtBound`) is the load-bearing half.** A refuse-only test
can always be satisfied by making the bound TIGHTER — only an accept-side case
can catch a bound that is WIDENED. Shipping only the refuse case would not have
fixed this bug. The two cases also exercise two different enforcement sites: the
narrow-arm demo below trips the **MUL** guard (`game.js:7323`), while `magProg`
and `magOverByOne` trip the **generic op tail** (`game.js:7338`).

## Verify by breaking — three arms, one at a time, reverted between

All three armed against `game.js` on the tree being landed (main 7923db4), each
reverted to a byte-clean `game.js` before the next. The suite stops at its first
failing case, so the named case below is the first that flips; the probe row
confirms the specific added case.

**(a) Widen `L1_MAG` 10× (the finder's forbidden move):** `L1_MAG` →
`45035996273704960`. Result: **RED** —
`hostile case 10 got: ACCEPTED`. That is `magOverByOne` (2^52+1): a wider bound
stops refusing it. The refuse half catches a widening.

**(b) Narrow `L1_MAG` by 1:** `L1_MAG` → `4503599627370495` (2^52−1). Result:
**RED** —
`hostile case 11 got: OP 2 (MUL) CAN REACH 4503599627370496 - PAST 2^52`. That
is `magAtBound` (2^52 exactly): a narrower bound stops accepting it. The accept
half catches a narrowing. This is the direction the old battery was blind to.

**(c) Delete the check entirely** (captain's note — guards against an accept
case that passes for the *wrong* reason, i.e. because it is structurally legal
rather than because its interval genuinely lands under 2^52): replaced `> L1_MAG`
with `> Infinity` at all three guard sites. Result: **RED** —
`hostile case 9 got: ACCEPTED` (`magProg`, the first refuse case). Probing the
real `l1Assemble` under the deleted check, `magOverByOne` also flips
REFUSED→ACCEPTED (interval `[4503599627370497, …]`, `why: null`), while
`magAtBound` stays accepted (expected — it sits *under-or-equal* the bound, so a
deleted check does not change its verdict). So the pair is NOT one where neither
half can tell the check exists: the refuse half is genuinely wired to the
magnitude comparison, not to structural legality.

## Gates

- `node --check tools/suite.mjs` — clean; `node tools/suite.mjs "layer 1"` — 2/2
  under BOTH the default (JS/off) kernel and `SIMLIB_KERNEL=wasm`.
- **Full suite in-pod (main realm, `--jobs 4` on this 4-core pod), both backends:**
  - **JS backend (default kernel): 376/376 passed** (1232s).
  - **wasm backend (`SIMLIB_KERNEL=wasm`): 376/376 passed** (822s).

  Count re-derived from this tree: `node tools/suite.mjs --count` → **376** (the
  `suite-330.json` label says 330 — stale; not quoted). The two backends are run
  as separate full passes (`SIMLIB_KERNEL` unset vs `=wasm`), which is how the
  cluster `suite-330.json` manifest splits js-* vs wasm-* arms; `kube.mjs run` is
  operator-only from a cs pod (kd-wbdYahwATd), so both passes were gated in-pod.

## Byte-neutrality

Test-only change: `tools/suite.mjs` gains two `cases[]` rows and a comment block;
nothing else is touched. `game.js` is byte-identical to main throughout (every
arm reverted). No sim read, no draw, no schema, no frozen fingerprint or matrix
number can move — the suite's existing frozen pins are the proof, and they stayed
green. The merge ritual (`mkcultureways.mjs`, `mkversion.mjs`) was run and the
merge verified tree-identical to the gated branch before push.

## Why it mattered despite being latent

Layer-1 is JS-only today — no `l1Run`/`L1_MAG` in any `.zig`/`.wat`/`.c` — so
nothing diverges *now*. The exposure is the kernel port: whoever writes the
wasm/zig L1 will reach for the JS constant as the spec, and a bound that no test
pins can drift (or be "helpfully" widened to fix an overflow) with the suite
staying green. This is precisely the class of bug the byte-equality discipline
exists to catch; the instrument had a hole in it, and now it doesn't. The old
case sat 222× away and nobody could see it from the test — the distances above
are written down so the next reader can.

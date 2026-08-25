// THE MOVEMENT KERNEL — the WASM spike (second backend, proven by equality).
//
// Ports the three hot movement loops slice 6b flattened onto the SoA pool:
// stepTo's integer step, visStep's stroll, and collide's pair loop with the
// wide berth. The JS in game.js remains the REFERENCE IMPLEMENTATION; this
// module must reproduce it BIT FOR BIT on the shared Int32Array pool, and
// the suite's agreement scenario is the referee. Every constant and every
// rounding rule here is a transcription of a named line of game.js — if the
// two ever disagree, the KERNEL is wrong, and the fix is here, never there.
//
// Arithmetic contract (design/cs35-numeric-core.md, as amended by slice 4):
//   idiv — floor toward -inf (all uses here have non-negative operands, so
//          it is plain integer division, but the helper keeps the intent);
//   tdiv — TRUNCATE toward zero on signed vector components (floor's -inf
//          asymmetry is a compass bias, measured at +40% warps);
//   isqrt — exact floor sqrt: f64 sqrt (correctly rounded per IEEE, same as
//          JS Math.sqrt) plus the same fixup loops game.js carries;
//   products go through int64 — the JS side is exact to 2^53 and every
//          product here is far below it.
//
// Memory map (shared WebAssembly memory, one 64KB page; the JS side builds
// its pool views over the SAME offsets — tools/simlib.mjs and the guarded
// block in game.js must agree with this table):
//   16384 PXQ   [160] i32     20864 B_SI    [160] i32 (bodies: pool index)
//   17024 PYQ   [160]         21504 B_FLAGS [160] i32 (1 stepped, 2 home,
//   17664 PTXQ  [160]                                  4 slot-exempt)
//   18304 PTYQ  [160]         22144 B_BERTH [160] i32 (crabBerthQ8)
//   18944 PWYQ  [160]         (the low 8KB is the C shadow stack,
//   19584 PMXQ  [160]          --stack-first; the map starts at 16384 so a
//   20224 PMYQ  [160]          stack spill can never touch pool data)

#include <stdint.h>

#define POOL_MAX 160
#define Q8 256
#define TICK_HZ 20
#define ARRIVE_Q 563            /* Math.round(2.2 * Q8) */
#define MNULL (-0x7fffffff - 1) /* the _mx/_my no-motion sentinel */
#define FLOOR_MIN_Q (126 * Q8)
#define FLOOR_MAX_Q (168 * Q8)

static int32_t *const PXQ  = (int32_t *)16384;
static int32_t *const PYQ  = (int32_t *)17024;
static int32_t *const PTXQ = (int32_t *)17664;
static int32_t *const PTYQ = (int32_t *)18304;
static int32_t *const PWYQ = (int32_t *)18944;
static int32_t *const PMXQ = (int32_t *)19584;
static int32_t *const PMYQ = (int32_t *)20224;
static int32_t *const B_SI    = (int32_t *)20864;
static int32_t *const B_FLAGS = (int32_t *)21504;
static int32_t *const B_BERTH = (int32_t *)22144;
/* the furniture and station rects (marshalled per frame - O(F), 60x cheaper
   than the O(F*B) loops they feed) and the blocked-flag output plane */
static int32_t *const F_X   = (int32_t *)22784;   /* furniture t.x, px ints */
static int32_t *const F_Y   = (int32_t *)23424;
static int32_t *const F_CAB = (int32_t *)24064;   /* 1 = cabana (up 6/dn 4; else 9/6) */
static int32_t *const S_X   = (int32_t *)24704;   /* station st.x, px ints */
static int32_t *const S_Y   = (int32_t *)25344;
static int32_t *const B_BLK = (int32_t *)25984;   /* out: _blocked this frame */

/* THE SHARED RNG CURSOR (kernel phase 2). One mulberry32 state cell in the
   shared memory, at 26624 (the word after B_BLK). When the kernel is armed
   the harness routes every SIM-stream draw through rng_u32, so the cursor
   and the step live HERE - and any future kernel-side consumer drawing
   between two JS draws continues the same sequence by construction. The
   algorithm is game.js's mulberry32 transcribed to u32 ops (wraps, imul and
   >>> are all exact both sides); the JS caller scales by 2^-32, which is
   exact. Seeded per sim by rng_seed - same seed, same sequence as the
   closure it replaces, which is why the fingerprint gate covers it. */
static uint32_t *const RNG_STATE = (uint32_t *)26624;
/* ...and the DRAW COUNTER rides the word after it (kernel phase 4): every
   advance of the shared cursor bumps it, JS-routed and kernel-internal
   alike, so the draw-count pin counts CURSOR MOVES rather than JS calls -
   the only definition that survives draws moving into the kernel. */
static uint32_t *const RNG_COUNT = (uint32_t *)26628;

__attribute__((export_name("rng_seed")))
void rng_seed(uint32_t s) { *RNG_STATE = s; *RNG_COUNT = 0; }

__attribute__((export_name("rng_u32")))
uint32_t rng_u32(void) {
  uint32_t a = *RNG_STATE + 0x6D2B79F5u;
  *RNG_STATE = a; (*RNG_COUNT)++;
  uint32_t t = (a ^ (a >> 15)) * (1u | a);
  t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
  return t ^ (t >> 14);
}

/* ---- KERNEL PHASE 4: the customers+visitors unit begins ------------------
   Visitor RESIDENCY planes (needs in Q20 grains, the state code) - the same
   zero-copy contract as the pool: JS accessors and kernel reads are the same
   bytes. Indexed by si like every pool plane. */
static int32_t *const VHUN = (int32_t *)26688;   /* hunger, Q20 */
static int32_t *const VTHI = (int32_t *)27328;   /* thirst */
static int32_t *const VDIR = (int32_t *)27968;   /* dirt */
static int32_t *const VBOR = (int32_t *)28608;   /* bored */
static int32_t *const VTIR = (int32_t *)29248;   /* tired */
static int32_t *const VSTC = (int32_t *)29888;   /* the VS state code */
/* vis_pick's per-think marshal planes: 5 biz slots (shack, juicebar,
   showers, arcade, hotel) x up to 8 recipes. The TASTE plane is the Layer-0
   cultureway hook table's kernel face: f64 weights straight from the
   culture document, data only - the kernel never knows a culture's name. */
#define VP_SLOTS 5
#define VP_RMAX 8
static int32_t *const MB_OPEN  = (int32_t *)31168;   /* visOpen(b) */
static int32_t *const MB_UNLK  = (int32_t *)31200;   /* bizUnlocked(b) */
static int32_t *const MB_TOURQ = (int32_t *)31232;   /* tourist line count */
static int32_t *const MB_ALLQ  = (int32_t *)31264;   /* whole line count */
static int32_t *const MB_QX    = (int32_t *)31296;   /* queueX, px int */
static int32_t *const MB_APQ   = (int32_t *)31328;   /* priceAppealQ16 */
static int32_t *const MB_RN    = (int32_t *)31360;   /* recipe count */
static int32_t *const MR_PRICE = (int32_t *)31424;   /* menuPrice, cents */
static int32_t *const MR_PAY   = (int32_t *)31680;   /* recipe.pay, cents */
static int32_t *const MR_DRINK = (int32_t *)31936;   /* DRINKS[r.id] ? 1 : 0 */
static double  *const MR_TASTE = (double  *)32192;   /* tasteW(k, r), f64 */
static int32_t *const VP_OUT   = (int32_t *)32704;   /* out: shut full broke foreign */

/* the VS codes this unit branches on - checked against the JS table at arm
   time (abi_check), so a reordered VS_NAMES fails loudly instead of silently
   walking guests through the wrong doors */
#define VS_TOBIZ 12
#define VS_INROOM 15
#define VS_ONSAND 16
#define VS_ROAM 17
#define Q20 1048576
/* THE BODY TABLE (census C2): 16 rows x 9 int32 - 5 decay rates then 4 want
   thresholds, Q20 grains. Row 0 is the crab constants (game.js VIS_RATE /
   VIS_WANT, written by fillBodyRows at install); declaring cultures take
   rows 1.. in sorted-id order. The actor's row arrives as an ARGUMENT on
   vis_tick and vis_pick (the tiredDrain idiom) - the kernel never knows a
   culture's name, only her row. */
static int32_t *const BODYT = (int32_t *)38592;

__attribute__((export_name("abi_check")))
int32_t abi_check(int32_t toBiz, int32_t inRoom, int32_t onSand, int32_t roam) {
  return toBiz == VS_TOBIZ && inRoom == VS_INROOM && onSand == VS_ONSAND && roam == VS_ROAM;
}

double __builtin_sqrt(double);

/* exact floor sqrt: correctly-rounded f64 sqrt + the fixup, same as game.js */
static int64_t isqrt64(int64_t n) {
  int64_t s = (int64_t)__builtin_sqrt((double)n);
  while (s * s > n) s--;
  while ((s + 1) * (s + 1) <= n) s++;
  return s;
}
/* trunc toward zero — C's native `/`, named for the contract */
static int64_t tdiv64(int64_t a, int64_t b) { return a / b; }
/* JS Math.sign on ints */
static int32_t sign3(int64_t v) { return (v > 0) - (v < 0); }
static int64_t min64(int64_t a, int64_t b) { return a < b ? a : b; }
static int64_t max64(int64_t a, int64_t b) { return a > b ? a : b; }
static int32_t clampYQ(int64_t q) {
  return (int32_t)(q < FLOOR_MIN_Q ? FLOOR_MIN_Q : q > FLOOR_MAX_Q ? FLOOR_MAX_Q : q);
}

/* stepTo's integer core (game.js ~7681): returns bit0 arrived,
   bit1 flip-set, bit2 flip-value (dxq < 0). */
__attribute__((export_name("step_to")))
int32_t step_to(int32_t i, int32_t txq, int32_t tyq, int32_t speed, int32_t dtT) {
  int64_t dxq = (int64_t)txq - PXQ[i], dyq = (int64_t)tyq - PYQ[i];
  int64_t dsq = dxq * dxq + dyq * dyq;
  if (dsq <= (int64_t)ARRIVE_Q * ARRIVE_Q) { PXQ[i] = txq; PYQ[i] = tyq; return 1; }
  int32_t r = 0;
  if (dxq > Q8 || dxq < -Q8) r = 2 | ((dxq < 0) ? 4 : 0);
  int64_t dq = isqrt64(dsq);
  int64_t stepq = min64(((int64_t)speed * dtT) / TICK_HZ, dq);
  PXQ[i] += (int32_t)tdiv64(dxq * stepq, dq);
  PYQ[i] += (int32_t)tdiv64(dyq * stepq, dq);
  PMXQ[i] = txq;
  PMYQ[i] = tyq;
  return r;
}

/* visStep's stroll (game.js ~10749): returns bit0 done, bit1 face-set,
   bit2 face-negative. */
/* `speed` is the caller's culture-dispatched px/s (census C4), mirroring
   step_to's shape; the crab caller passes 42 and the arithmetic below is
   byte-identical to the old #define. */
__attribute__((export_name("vis_step")))
int32_t vis_step(int32_t i, int32_t txq, int32_t tyq, int32_t speed, int32_t dtT) {
  int64_t spq = ((int64_t)speed * Q8 * dtT) / TICK_HZ;
  int64_t dxq = (int64_t)txq - PXQ[i], dyq = (int64_t)tyq - PWYQ[i];
  int32_t r = 0;
  if (dxq > Q8 || dxq < -Q8) {
    PXQ[i] += sign3(dxq) * (int32_t)min64(spq, dxq < 0 ? -dxq : dxq);
    r |= 2 | ((dxq < 0) ? 4 : 0);
  }
  if (dyq > Q8 || dyq < -Q8)
    PWYQ[i] += sign3(dyq) * (int32_t)min64(spq, dyq < 0 ? -dyq : dyq);
  int64_t ax = (int64_t)txq - PXQ[i]; if (ax < 0) ax = -ax;
  int64_t ay = (int64_t)tyq - PWYQ[i]; if (ay < 0) ay = -ay;
  if (ax <= Q8 && ay <= Q8) r |= 1;
  return r;
}

/* giveBerth (game.js ~7720), body indices into the B_ planes */
static void give_berth(int32_t bi, int32_t bj, int64_t d5, int32_t dtT,
                       int32_t dark, int32_t noBerth) {
  int64_t ra = B_BERTH[bi], rb = B_BERTH[bj];
  int64_t r = max64(ra, rb);
  if (r <= 0 || d5 >= 5 * (12 * Q8 + r) || noBerth) return;
  int32_t dirty = ra >= rb ? bi : bj, clean = ra >= rb ? bj : bi;
  if (dark) return;
  if ((B_FLAGS[dirty] & 2) || (B_FLAGS[clean] & 2)) return;
  if (B_FLAGS[clean] & 4) return;
  int32_t di = B_SI[dirty], ci = B_SI[clean];
  int64_t ayq = (int64_t)PYQ[ci] - PYQ[di];
  int32_t away = (ayq < Q8 && ayq > -Q8)
    ? ((2 * (int64_t)PYQ[di] < (int64_t)FLOOR_MIN_Q + FLOOR_MAX_Q) ? 1 : -1)
    : sign3(ayq);
  int64_t kq = min64(4096, (int64_t)12 * 4096 * dtT / TICK_HZ);
  int64_t pushq = min64((5 * (12 * Q8 + r) - d5) * kq / (5 * 2 * 4096), 3 * Q8);
  PYQ[ci] = clampYQ((int64_t)PYQ[ci] + away * pushq);
  if (!(B_FLAGS[clean] & 1)) {
    int64_t dxs = (int64_t)PXQ[ci] - PXQ[di];
    int32_t s = dxs > 0 ? 1 : dxs < 0 ? -1 : 1;   /* JS: sign(diff || 1) */
    PXQ[ci] += s * (int32_t)pushq;
  }
}

/* atTargetQ (game.js ~7778): mover mi's waypoint inside si2's touch ellipse */
static int32_t at_target_q(int32_t mi, int32_t si2) {
  if (PMXQ[mi] == MNULL) return 0;
  int64_t tA5 = 5 * ((int64_t)PMXQ[mi] - PXQ[si2]);
  int64_t tB9 = 9 * ((int64_t)(PMYQ[mi] == MNULL ? PYQ[mi] : PMYQ[mi]) - PYQ[si2]);
  return tA5 * tA5 + tB9 * tB9 < (int64_t)15360 * 15360;
}

/* collide's pair loop (game.js ~7745): bodies pre-marshalled into B_ planes */
__attribute__((export_name("collide_pairs")))
void collide_pairs(int32_t n, int32_t dtT, int32_t dark, int32_t noBerth) {
  for (int32_t i = 0; i < n; i++)
    for (int32_t j = i + 1; j < n; j++) {
      int32_t ia = B_SI[i], ib = B_SI[j];
      int64_t dxq = (int64_t)PXQ[ib] - PXQ[ia], dyq = (int64_t)PYQ[ib] - PYQ[ia];
      if (dxq > 5632 || dxq < -5632 || 9 * dyq > 140800 || 9 * dyq < -140800) continue;
      int64_t A5 = 5 * dxq, B9 = 9 * dyq;
      int64_t d5sq = A5 * A5 + B9 * B9;
      int32_t touching = d5sq >= 164 && d5sq < (int64_t)15360 * 15360;
      int32_t berthable = d5sq >= 164 && d5sq < (int64_t)28160 * 28160;
      int64_t d5 = (touching || berthable) ? isqrt64(d5sq) : 0;
      if (touching) {
        int32_t aStill = !(B_FLAGS[i] & 1), bStill = !(B_FLAGS[j] & 1);
        int64_t kq = min64(4096, (int64_t)12 * 4096 * dtT / TICK_HZ);
        int64_t pushq = min64((15360 - d5) * kq / (5 * 2 * 4096), 4 * Q8);
        int32_t px2x = (int32_t)tdiv64(5 * dxq * pushq * 2, d5);
        int32_t px2y = (int32_t)tdiv64(5 * dyq * pushq * 2, d5);
        if (aStill && !bStill) {
          if (!at_target_q(ib, ia)) { PXQ[ib] += px2x; PYQ[ib] = clampYQ((int64_t)PYQ[ib] + px2y); }
        } else if (bStill && !aStill) {
          if (!at_target_q(ia, ib)) { PXQ[ia] -= px2x; PYQ[ia] = clampYQ((int64_t)PYQ[ia] - px2y); }
        } else if (sign3((int64_t)(PMXQ[ia] == MNULL ? PXQ[ia] : PMXQ[ia]) - PXQ[ia])
                != sign3((int64_t)(PMXQ[ib] == MNULL ? PXQ[ib] : PMXQ[ib]) - PXQ[ib])
                && (dxq > 512 || dxq < -512)) {
          PYQ[ia] = clampYQ(max64(FLOOR_MIN_Q, (int64_t)PYQ[ia] - pushq * 2));
          PYQ[ib] = clampYQ((int64_t)PYQ[ib] + pushq * 2);
          if (PYQ[ib] >= FLOOR_MAX_Q - 128) PYQ[ib] = clampYQ((int64_t)PYQ[ib] - pushq * 4);
        } else {
          int32_t p1x = (int32_t)tdiv64(5 * dxq * pushq, d5);
          int32_t p1y = (int32_t)tdiv64(5 * dyq * pushq, d5);
          PXQ[ia] -= p1x; PYQ[ia] = clampYQ((int64_t)PYQ[ia] - p1y);
          PXQ[ib] += p1x; PYQ[ib] = clampYQ((int64_t)PYQ[ib] + p1y);
        }
      }
      if (berthable) give_berth(i, j, d5, dtT, dark, noBerth);
    }
}

/* the solid-furniture and solid-station deflections (game.js, the two loops
   after the pair loop in collide). Every coordinate is a pool grain or an
   int, so the float dance transcribes exactly:
     dx = c.x + 8 - (t.x + 10)  ->  dxq = PXQ + 8*Q8 - (fx+10)*Q8, exact.
   The exemption windows read the crab's TARGET (PTXQ/PTYQ - "a crab headed
   for this exact spot may stand there"); `(c.tx || 0)` is the plain plane
   read, 0 being the plane's own default. */
__attribute__((export_name("collide_solids")))
void collide_solids(int32_t n, int32_t nf, int32_t ns, int32_t dtT) {
  int64_t pushq = min64((int64_t)95 * Q8 * dtT / TICK_HZ, 5 * Q8);
  for (int32_t f = 0; f < nf; f++) {
    int32_t fx = F_X[f], fy = F_Y[f];
    int32_t up = F_CAB[f] ? 6 : 9, dn = F_CAB[f] ? 4 : 6;
    for (int32_t b = 0; b < n; b++) {
      int32_t si = B_SI[b];
      int64_t etx = (int64_t)PTXQ[si] - (fx + 2) * Q8; if (etx < 0) etx = -etx;
      int64_t ety = (int64_t)PTYQ[si] - (fy + 12) * Q8; if (ety < 0) ety = -ety;
      if (etx < 8 * Q8 && ety < 8 * Q8) continue;
      int64_t dxq = (int64_t)PXQ[si] + 8 * Q8 - (fx + 10) * Q8;
      int64_t dyq = (int64_t)PYQ[si] - (int64_t)fy * Q8;
      int64_t adx = dxq < 0 ? -dxq : dxq, ady = dyq < 0 ? -dyq : dyq;
      if (adx < 14 * Q8 && dyq > -(int64_t)up * Q8 && dyq < (int64_t)dn * Q8) {
        if (5 * adx > 8 * ady) PXQ[si] += (dxq > 0 ? 1 : -1) * (int32_t)pushq;
        else PYQ[si] = clampYQ((int64_t)PYQ[si] + (dyq > -2 * Q8 ? 1 : -1) * pushq);
        B_BLK[b] = 1;
      }
    }
  }
  for (int32_t s = 0; s < ns; s++) {
    int32_t sx = S_X[s], sy = S_Y[s];
    for (int32_t b = 0; b < n; b++) {
      int32_t si = B_SI[b];
      int64_t etx = (int64_t)PTXQ[si] - (sx + 2) * Q8; if (etx < 0) etx = -etx;
      int64_t ety = (int64_t)PTYQ[si] - (sy + 7) * Q8; if (ety < 0) ety = -ety;
      if (etx < 6 * Q8 && ety < 6 * Q8) continue;
      int64_t dxq = (int64_t)PXQ[si] + 8 * Q8 - (sx + 10) * Q8;
      int64_t dyq = (int64_t)PYQ[si] - (int64_t)sy * Q8;
      int64_t adx = dxq < 0 ? -dxq : dxq, ady = dyq < 0 ? -dyq : dyq;
      if (adx < 13 * Q8 && dyq > -10 * (int64_t)Q8 && dyq < 6 * Q8) {
        if (5 * adx > 8 * ady) PXQ[si] += (dxq > 0 ? 1 : -1) * (int32_t)pushq;
        else PYQ[si] = clampYQ((int64_t)PYQ[si] + (dyq > -2 * Q8 ? 1 : -1) * pushq);
        B_BLK[b] = 1;
      }
    }
  }
}

/* ---- vis_tick: the needs clock (game.js visTick, verbatim) ----------------
   Integer-pure: the one float dance in the reference (the inRoom tired
   drain) depends only on dtT, so the JS computes it once a frame with its
   own expression and passes the finished grain count in - the kernel never
   re-derives it. Returns a bitmask the JS drains IN PLACE, so the object
   side (mist ledger, checkOut, the sand-wake flags and diary line) happens
   at exactly the point in the frame the reference did it:
     bit0 mist accrued (stayOf(k).mistMin += dtT)
     bit1 the checkout window is open (JS calls checkOut)
     bit2 woke on the sand (VSTC is already roam; JS clears rough/target, logs) */
__attribute__((export_name("vis_tick")))
int32_t vis_tick(int32_t si, int32_t dtT, int32_t tmin, int32_t mistHot, int32_t tiredDrain, int32_t brow) {
  const int32_t *B = BODYT + brow * 9;   /* the actor's own rates (row 0 = crab) */
  int32_t stC = VSTC[si], r = 0;
  if (stC != VS_INROOM && tmin >= 990 && mistHot) r |= 1;   /* 16.5*60 */
  if (stC == VS_INROOM) {
    int64_t t = (int64_t)VTIR[si] - tiredDrain;
    VTIR[si] = t < 0 ? 0 : (int32_t)t;
    if (tmin >= 450 && tmin < 720) r |= 2;   /* WAKE_HOUR..12:00 */
    return r;
  }
  if (stC == VS_ONSAND) {
    /* the 3/2 is the sand's, the dirt rate is the body's (B[2]) */
    int64_t d = (int64_t)VDIR[si] + (((int64_t)B[2] * dtT * 3) >> 1);
    VDIR[si] = d > Q20 ? Q20 : (int32_t)d;
    if (tmin >= 450 && tmin < 720) { VSTC[si] = VS_ROAM; r |= 4; }
    return r;
  }
  int32_t *const P[5] = { VHUN, VTHI, VDIR, VBOR, VTIR };
  for (int i = 0; i < 5; i++) {
    int64_t v = (int64_t)P[i][si] + (int64_t)B[i] * dtT;
    P[i][si] = v > Q20 ? Q20 : (int32_t)v;
  }
  return r;
}

/* ---- vis_pick: what do I fancy (game.js visPick, mirrored) ----------------
   The scoring is the reference's own f64 dance, transcribed - wasm f64 ops
   are IEEE-identical to JS, which is what makes byte-identity reachable
   without first integerizing a transient score (that conversion is real
   work with its own re-baseline, and it belongs to a slice, not a port).
   Draws go through the SHARED cursor (rng_u32), same count, same order as
   the reference: the draw-count pin is the referee. Slots: 0 shack,
   1 juicebar, 2 showers, 3 arcade, 4 hotel. Needs: 0 food, 1 drink,
   2 clean, 3 fun, 4 room. Returns -1 for no pick, else
   (need << 8) | (slot << 4) | recipeIdx. Blocked counters land in VP_OUT
   [shut, full, broke, foreign] and the JS drains them into the stay. */
#define NEED_FOOD 0
#define NEED_DRINK 1
#define NEED_CLEAN 2
#define NEED_FUN 3
#define NEED_ROOM 4
#define TOURIST_QUEUE_MAX 4
#define QUEUE_MAX 5
#define DETOUR_SCALE 400.0
#define ROOM_HOUR 900

static double k_srand(void) { return (double)rng_u32() / 4294967296.0; }

/* the affordable list for one slot, order-preserving; returns count */
static int32_t k_afford(int32_t slot, int32_t wallet, int32_t res, int32_t *idx) {
  int32_t n = 0;
  for (int32_t i = 0; i < MB_RN[slot]; i++)
    if (wallet >= MR_PRICE[slot * VP_RMAX + i] + res) idx[n++] = i;
  return n;
}
/* treat(rs): equal weights take the legacy index draw; unequal roll the
   weighted die - one srand() either way, exactly the reference's shape */
static int32_t k_treat(int32_t slot, const int32_t *idx, int32_t n) {
  const double *tw = MR_TASTE + slot * VP_RMAX;
  int32_t equal = 1;
  for (int32_t i = 1; i < n; i++) if (tw[idx[i]] != tw[idx[0]]) { equal = 0; break; }
  if (equal) return idx[(int32_t)(k_srand() * n)];
  double total = 0;
  for (int32_t i = 0; i < n; i++) total += tw[idx[i]];
  double roll = k_srand() * total;
  for (int32_t i = 0; i < n; i++) { roll -= tw[idx[i]]; if (roll < 0) return idx[i]; }
  return idx[n - 1];
}
static int32_t k_cheap(int32_t slot, const int32_t *idx, int32_t n) {
  int32_t best = idx[0];   /* first strict minimum == stable sort's [0] */
  for (int32_t i = 1; i < n; i++)
    if (MR_PAY[slot * VP_RMAX + idx[i]] < MR_PAY[slot * VP_RMAX + best]) best = idx[i];
  return best;
}

/* ---- KERNEL PHASE 5: the counter machine, whole ---------------------------
   updateCustomers' per-customer state chain (game.js ~11260): the shuffle,
   the stalls, the seats, the tables, the tips, the leaving walk - one call
   per customer at exactly the reference's point in the pass, so a stall
   freed by customer i is claimable by customer j the same frame, in the
   same order. Planes (the map's 32768.. run, mirrored in game.js):
     32768 C_PAT  33408 C_CLM  34048 C_SHW  34688 C_DIN  35328 C_WAI
     35968 C_STL  36608 C_TBL  37248 FT_X[64]  37504 FT_FLG  37760 FT_DSH
     38016 MS_FID[5*16]  38336 MS_N[8]  38368 EVR_N + 38372 EVR[16*3]
   Human-facing effects leave as RING EVENTS (code, a, b) drained by the JS
   right after the call - popText, sfx, stats, the persona side of a crab's
   shower, the tip through payTip's door. The kernel owns the STATE; money
   still crosses at the same JS doors. */
static int32_t *const C_PAT = (int32_t *)32768;
static int32_t *const C_CLM = (int32_t *)33408;
static int32_t *const C_SHW = (int32_t *)34048;
static int32_t *const C_DIN = (int32_t *)34688;
static int32_t *const C_WAI = (int32_t *)35328;
static int32_t *const C_STL = (int32_t *)35968;
static int32_t *const C_TBL = (int32_t *)36608;
static int32_t *const FT_X   = (int32_t *)37248;
static int32_t *const FT_FLG = (int32_t *)37504;   /* 1 occ, 2 dirty, 4 cleaning */
static int32_t *const FT_DSH = (int32_t *)37760;
static int32_t *const MS_FID = (int32_t *)38016;   /* per-biz stall fids, slot*16+i */
static int32_t *const MS_N   = (int32_t *)38336;
static int32_t *const EVR_N  = (int32_t *)38368;
static int32_t *const EVR    = (int32_t *)38372;   /* (code, a, b) triples */

#define VSK_ARRIVING 2
#define VSK_WAITING 3
#define VSK_TOSEAT 4
#define VSK_SEATED 5
#define VSK_DINING 6
#define VSK_TOSTALL 7
#define VSK_WAITSTALL 8
#define VSK_OUTSTALL 9
#define VSK_TOTABLE 10
#define VSK_SHOWERING 11
#define VSK_LEAVING 18
/* ring codes - the drain switch in updateCustomers matches these by number */
#define EV_ARRIVE_ASK 1
#define EV_RAGE_LINE 2
#define EV_STALL_CLAIM 3
#define EV_SHOWER_DONE 4
#define EV_WAIT_TIMEOUT 5
#define EV_DINE_START 6
#define EV_RAGE_SEAT 7
#define EV_DINE_EXIT 8
#define QN_070 734003   /* qn(0.7): the deep-soak scrub */
#define QN_050 524288   /* qn(0.5) */

static void emit(int32_t code, int32_t a, int32_t b) {
  int32_t n = *EVR_N; if (n >= 16) return;   /* a step emits at most two */
  EVR[n * 3] = code; EVR[n * 3 + 1] = a; EVR[n * 3 + 2] = b; *EVR_N = n + 1;
}
/* the shared walk-to-x used by toStall/toSeat/toTable: returns 1 on "there"
   (|d| <= 2px), else steps at 45px/s clamped to the distance - the exact
   integer image of `Math.min(idiv(45*Q8*dtT,TICK_HZ), Math.round(|dxs|*Q8))` */
static int32_t walk_to(int32_t si, int32_t txq, int32_t dtT) {
  int64_t dq = (int64_t)txq - PXQ[si];
  int64_t ad = dq < 0 ? -dq : dq;
  if (ad <= 2 * Q8) return 1;
  PXQ[si] += sign3(dq) * (int32_t)min64((int64_t)576 * dtT, ad);
  return 0;
}

__attribute__((export_name("cust_step")))
int32_t cust_step(int32_t si, int32_t dtT, int32_t slotQ8, int32_t staffed,
                  int32_t filthQ12, int32_t isCrab, int32_t visitor, int32_t happy,
                  int32_t wallet, int32_t tableTipC, int32_t showInitT, int32_t deep,
                  int32_t bizSlot, int32_t spawnXQ, int32_t selfBused) {
  *EVR_N = 0;
  int32_t stC = VSTC[si], r = 1;
  if (stC == VSK_ARRIVING || stC == VSK_WAITING) {
    int64_t dq8 = (int64_t)slotQ8 - PXQ[si];
    int64_t ad = dq8 < 0 ? -dq8 : dq8;
    int64_t stepq = (int64_t)576 * dtT;   /* idiv(45*Q8*dtT, TICK_HZ), exact */
    if (ad <= stepq) { PXQ[si] = slotQ8; r |= 2; }
    else { PXQ[si] += sign3(dq8) * (int32_t)stepq; r |= 4 | ((dq8 < 0) ? 8 : 0); }
    if (stC == VSK_ARRIVING) {
      if (PXQ[si] == slotQ8) { VSTC[si] = VSK_WAITING; emit(EV_ARRIVE_ASK, 0, 0); }
    } else {
      C_PAT[si] -= (int32_t)(((int64_t)dtT * (staffed ? 1 : 6) * filthQ12 + 10) / 20);
      if (C_PAT[si] <= 0) { VSTC[si] = VSK_LEAVING; emit(EV_RAGE_LINE, 0, 0); }
    }
  } else if (stC == VSK_TOSTALL) {
    if (C_STL[si] < 0) return 0;   /* a null hold: the JS chain throws, as the reference would */
    if (!walk_to(si, (FT_X[C_STL[si]] + 3) * Q8, dtT)) return r;
    C_CLM[si] = (int32_t)min64(4096, (int64_t)C_CLM[si] + ((int64_t)4096 * 9 * dtT) / (5 * TICK_HZ));
    if (C_CLM[si] >= 4096) { VSTC[si] = VSK_SHOWERING; C_SHW[si] = showInitT; }
  } else if (stC == VSK_OUTSTALL) {
    C_CLM[si] = (int32_t)max64(0, (int64_t)C_CLM[si] - ((int64_t)4096 * 11 * dtT) / (5 * TICK_HZ));
    if (C_CLM[si] <= 0) VSTC[si] = VSK_LEAVING;
  } else if (stC == VSK_SHOWERING) {
    C_SHW[si] -= dtT;
    if (C_SHW[si] <= 0) {
      int32_t fid = C_STL[si];
      if (fid < 0) return 0;
      FT_FLG[fid] = (FT_FLG[fid] & ~1) | 2;   /* occupant out, dirty on */
      C_STL[si] = -1;
      if (visitor) {
        int64_t d = (int64_t)VDIR[si] - (deep ? QN_070 : QN_050);
        VDIR[si] = d < 0 ? 0 : (int32_t)d;
      }
      emit(EV_SHOWER_DONE, deep, isCrab);
      VSTC[si] = VSK_OUTSTALL;
    }
  } else if (stC == VSK_WAITSTALL) {
    C_WAI[si] -= dtT;
    int32_t found = -1;
    for (int32_t i = 0; i < MS_N[bizSlot]; i++) {
      int32_t fid = MS_FID[bizSlot * 16 + i];
      if (!(FT_FLG[fid] & 3)) { found = fid; break; }   /* !occupant && !dirty */
    }
    if (found >= 0) {
      FT_FLG[found] |= 1; C_STL[si] = found; VSTC[si] = VSK_TOSTALL;
      emit(EV_STALL_CLAIM, found, 0);
    } else if (C_WAI[si] <= 0) { VSTC[si] = VSK_LEAVING; emit(EV_WAIT_TIMEOUT, 0, 0); }
  } else if (stC == VSK_TOSEAT) {
    if (C_TBL[si] < 0) return 0;
    if (walk_to(si, (FT_X[C_TBL[si]] + 10) * Q8, dtT)) VSTC[si] = VSK_SEATED;
  } else if (stC == VSK_SEATED) {
    C_PAT[si] -= (int32_t)(((int64_t)7 * dtT * filthQ12 + 200) / 400);
    if (C_PAT[si] <= 0) {
      VSTC[si] = VSK_LEAVING;
      int32_t fid = C_TBL[si];
      if (fid >= 0) { FT_FLG[fid] &= ~1; C_TBL[si] = -1; }
      emit(EV_RAGE_SEAT, 0, 0);
    }
  } else if (stC == VSK_TOTABLE) {
    if (C_TBL[si] < 0) return 0;
    if (walk_to(si, (FT_X[C_TBL[si]] + 10) * Q8, dtT)) {
      VSTC[si] = VSK_DINING;
      C_DIN[si] = 6 * TICK_HZ + (int32_t)(k_srand() * (4 * TICK_HZ));   /* the dine draw, shared cursor */
      FT_DSH[C_TBL[si]] = 1;
      emit(EV_DINE_START, 0, 0);
    }
  } else if (stC == VSK_DINING) {
    C_DIN[si] -= dtT;
    if (C_DIN[si] <= 0) {
      int32_t fid = C_TBL[si];
      if (fid < 0) return 0;
      FT_FLG[fid] &= ~1;   /* released FIRST and unconditionally (the wedge rule) */
      if (selfBused) FT_DSH[fid] = 0;
      else { FT_DSH[fid] = 1; FT_FLG[fid] |= 2; }
      if (!isCrab) {
        int32_t tt = visitor
          ? (int32_t)max64(0, min64(tableTipC, wallet))
          : tableTipC;
        emit(EV_DINE_EXIT, tt, 0);
      }
      VSTC[si] = VSK_LEAVING;   /* k.table stays held - visAfterCounter clears it */
    }
  } else if (stC == VSK_LEAVING) {
    PXQ[si] += (happy ? 640 : 960) * dtT;   /* idiv((50|75)*Q8*dtT, TICK_HZ), exact */
    if (isCrab) return r | 16;
    if (visitor) {
      int64_t d = (int64_t)PXQ[si] - (spawnXQ == MNULL ? PXQ[si] : spawnXQ);
      if (d < 0) d = -d;
      if (d > 26 * Q8) return r | 32;
    }
  } else return 0;   /* not this unit's state: the JS chain owns it */
  return r;
}

__attribute__((export_name("vis_pick")))
int32_t vis_pick(int32_t si, int32_t wallet, int32_t res, int32_t tmin, int32_t cultured,
                 int32_t wantsRoomF, int32_t freeRoomF, int32_t roomPrice, int32_t brow) {
  const int32_t *BW = BODYT + brow * 9 + 5;   /* the guest's own want thresholds (row 0 = crab) */
  VP_OUT[0] = VP_OUT[1] = VP_OUT[2] = VP_OUT[3] = 0;
  int32_t candSlot[6], candNeed[6], candR[6], candN = 0;
  int32_t idx[VP_RMAX];

  /* add(b, need, pick): the reference's three guards, in its order */
#define K_ADD(SLOT, NEED, PICKER, ...) do { \
    if (!MB_OPEN[SLOT]) { if (MB_UNLK[SLOT]) VP_OUT[0]++; break; } \
    if (!(MB_TOURQ[SLOT] < TOURIST_QUEUE_MAX && MB_ALLQ[SLOT] < QUEUE_MAX)) { VP_OUT[1]++; break; } \
    int32_t n = k_afford(SLOT, wallet, res, idx); \
    if (!n) { VP_OUT[2]++; break; } \
    __VA_ARGS__; \
    candSlot[candN] = SLOT; candNeed[candN] = NEED; candR[candN] = PICKER; candN++; \
  } while (0)

  if (VHUN[si] >= BW[0])   /* VIS_WANT.food, the guest's own (crab qn(0.45) = 471859) */
    K_ADD(0, NEED_FOOD, k_treat(0, idx, n), {
      /* plate: prefer the food half of the menu, whole menu when it is all drinks */
      int32_t f[VP_RMAX]; int32_t fn = 0;
      for (int32_t i = 0; i < n; i++) if (!MR_DRINK[0 * VP_RMAX + idx[i]]) f[fn++] = idx[i];
      if (fn) { for (int32_t i = 0; i < fn; i++) idx[i] = f[i]; n = fn; }
    });
  if (VTHI[si] >= BW[1]) {   /* VIS_WANT.drink, the guest's own (crab qn(0.40) = 419430) */
    if (MB_OPEN[1]) K_ADD(1, NEED_DRINK, k_treat(1, idx, n), {});
    else K_ADD(0, NEED_DRINK, k_cheap(0, idx, n), {
      int32_t f[VP_RMAX]; int32_t fn = 0;
      for (int32_t i = 0; i < n; i++) if (MR_DRINK[0 * VP_RMAX + idx[i]]) f[fn++] = idx[i];
      if (fn) { for (int32_t i = 0; i < fn; i++) idx[i] = f[i]; n = fn; }
    });
  }
  if (VDIR[si] >= BW[2]) K_ADD(2, NEED_CLEAN, k_treat(2, idx, n), {});   /* the guest's own clean want */
  if (VBOR[si] >= BW[3]) K_ADD(3, NEED_FUN, k_treat(3, idx, n), {});
  if (wantsRoomF && wallet >= roomPrice && MB_OPEN[4]
      && MB_TOURQ[4] < TOURIST_QUEUE_MAX && MB_ALLQ[4] < QUEUE_MAX && freeRoomF) {
    candSlot[candN] = 4; candNeed[candN] = NEED_ROOM; candR[candN] = 0; candN++;
  }

  /* the scorer - the reference's f64, term for term */
  int32_t best = -1;
  double bestScore = 0;
  double x = (double)PXQ[si] / 256.0;
  for (int32_t c = 0; c < candN; c++) {
    int32_t slot = candSlot[c];
    double d = x - (double)MB_QX[slot];
    if (d < 0) d = -d;
    double s;
    if (candNeed[c] == NEED_ROOM) {
      if (tmin >= ROOM_HOUR) s = 99.0 * Q20;
      else {
        double u = ((double)tmin - 540.0) / (ROOM_HOUR - 540.0);
        if (u < 0) u = 0; if (u > 1) u = 1;
        s = (1.5 * Q20 + __builtin_floor(5.0 * Q20 * u)) / (1.0 + d / DETOUR_SCALE);
      }
    } else {
      static const double RANK[4] = { 4.0, 3.0, 2.4, 1.5 };
      int32_t lvl = candNeed[c] == NEED_FOOD ? VHUN[si] : candNeed[c] == NEED_DRINK ? VTHI[si]
                  : candNeed[c] == NEED_CLEAN ? VDIR[si] : VBOR[si];
      s = (RANK[candNeed[c]] * Q20 + (double)lvl) * ((double)MB_APQ[slot] / 65536.0)
          / (1.0 + d / DETOUR_SCALE);
    }
    if (cultured) {   /* every candidate carries a recipe, the hotel's too */
      double tw = MR_TASTE[slot * VP_RMAX + candR[c]];
      if (tw != 1.0) s *= tw;
    }
    if (s > bestScore) { bestScore = s; best = c; }
  }
  if (best >= 0 && cultured && MR_TASTE[candSlot[best] * VP_RMAX + candR[best]] <= 0.6)
    VP_OUT[3]++;   /* foreign: ate what was going, not what they wanted */
  if (best < 0) return -1;
  return (candNeed[best] << 8) | (candSlot[best] << 4) | candR[best];
}
double __builtin_floor(double);

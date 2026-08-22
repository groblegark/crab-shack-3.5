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
#define VIS_SPEED 42

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
__attribute__((export_name("vis_step")))
int32_t vis_step(int32_t i, int32_t txq, int32_t tyq, int32_t dtT) {
  int64_t spq = ((int64_t)VIS_SPEED * Q8 * dtT) / TICK_HZ;
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

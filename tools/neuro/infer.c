/* THE INTEGER INFERENCE RECIPE, compiled — infer.mjs's twin, for the wasm
   leg of the cross-engine receipt. Same arithmetic, same shift, same
   tie-break; every intermediate < 2^28 so int32 is exact (and the same
   recipe fits SIMD i32x4.dot_i16x8_s lanes — pairwise products <= 2^23).

   Memory map (imported nothing; own 16MB memory, runner writes then calls):
     16384    i32[4]   dims: NF, HID, NC, R1
     17408    i8[]     w1   (HID x NF, row-major)
     81920    i32[]    b1   (HID)
     147456   i8[]     w2   (NC x HID, row-major)
     212992   i32[]    b2   (NC)
     262144   i16[]    corpus (n rows x NF)   room for 96,743 42-wide rows
     8388608  i32[]    out logits (n rows x NC)

   The memory was 4MB with the corpus and the logits 3MB apart, which fit the
   spike's 27,567 held-out rows and would have silently overrun the retrain's
   larger one. It is 16MB now and the two regions are 8MB apart; the offsets
   are the runner's contract, so xcheck.mjs carries the same numbers. (The map
   comment also said 131072/196608 for w2/b2, which the code never agreed
   with - corrected to what the code and the runner have always used.)

   zig cc --target=wasm32-freestanding builds it, same toolchain as the
   kernel; build-nn.sh has the invocation. */

#include <stdint.h>

static int32_t *const DIMS = (int32_t *)16384;
static int8_t  *const W1   = (int8_t *)17408;
static int32_t *const B1   = (int32_t *)81920;
static int8_t  *const W2   = (int8_t *)147456;
static int32_t *const B2   = (int32_t *)212992;
static int16_t *const CORP = (int16_t *)262144;
static int32_t *const OUT  = (int32_t *)8388608;

__attribute__((export_name("run")))
int32_t run(int32_t n) {
  const int32_t NF = DIMS[0], HID = DIMS[1], NC = DIMS[2], R1 = DIMS[3];
  int32_t hi[256];
  int32_t choicesHash = 0x811c9dc5;
  for (int32_t r = 0; r < n; r++) {
    const int16_t *f = CORP + r * NF;
    for (int32_t i = 0; i < HID; i++) {
      int32_t a = B1[i];
      const int8_t *wi = W1 + i * NF;
      for (int32_t j = 0; j < NF; j++) a += (int32_t)wi[j] * (int32_t)f[j];
      a = a >> R1;                       /* arithmetic shift = floor, both langs */
      hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;
    }
    int32_t best = 0, bestV = INT32_MIN;
    for (int32_t o = 0; o < NC; o++) {
      int32_t a = B2[o];
      const int8_t *wo = W2 + o * HID;
      for (int32_t i = 0; i < HID; i++) a += (int32_t)wo[i] * hi[i];
      OUT[r * NC + o] = a;
      if (a > bestV) { bestV = a; best = o; }
    }
    /* fold the choice into an FNV-1a running hash, same formula as infer.mjs */
    int32_t v = best;
    for (int32_t b = 0; b < 4; b++) {
      choicesHash ^= (v >> (b * 8)) & 0xff;
      choicesHash = (int32_t)((uint32_t)choicesHash * 0x01000193u);
    }
  }
  return choicesHash;
}

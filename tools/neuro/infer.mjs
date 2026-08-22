// THE INTEGER INFERENCE RECIPE — the artifact's executable spec, scalar JS.
// Mirrored bit-for-bit by infer.c (wasm) and run under JavaScriptCore by
// xcheck.mjs; every arithmetic step here is exact integer (all intermediates
// < 2^28, see train.mjs's headroom note), so bit-identity across engines is
// a property of the spec, not luck — the numeric core's own argument.
//
// This file deliberately has NO imports and only ES5-flavoured code inside
// makeClassifier, because xcheck.mjs ships the same function source to jsc.

export function makeClassifier(brain) {
  const { arch, shifts, w1, b1, w2, b2 } = brain;
  const NF = arch.in, HID = arch.hidden, NC = arch.out, R1 = shifts.R1;
  const hi = new Array(HID);
  return function classify(f, outLogits) {
    for (let i = 0; i < HID; i++) {
      let a = b1[i];
      const wi = w1[i];
      for (let j = 0; j < NF; j++) a += wi[j] * f[j];
      a = a >> R1;                                   // floor at the named shift
      hi[i] = a < 0 ? 0 : a > 32767 ? 32767 : a;     // ReLU + saturate to int16
    }
    let best = 0, bestV = -2147483648;
    for (let o = 0; o < NC; o++) {
      let a = b2[o];
      const wo = w2[o];
      for (let i = 0; i < HID; i++) a += wo[i] * hi[i];
      if (outLogits) outLogits[o] = a;
      if (a > bestV) { bestV = a; best = o; }        // lowest index wins ties
    }
    return best;
  };
}

// FNV-1a over int32 values — the receipt hash, same formula in every engine.
export function fnv(values) {
  let h = 0x811c9dc5;
  for (let i = 0; i < values.length; i++) {
    let v = values[i] | 0;
    for (let b = 0; b < 4; b++) {
      h ^= (v >>> (b * 8)) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}

// THE OBSERVABLE REGISTRY (spike edition) — the feature vector is DATA.
//
// A brain does not get a hardcoded input layout: it DECLARES an ordered list
// of picks from this registry (owner ruling, 2026-08-22: "weird feature
// vectors ... should be customizable per brain and per culture"). The engine
// assembles the declared vector at think time by reading integer state in
// declared order — assembly is just reads, so determinism is trivial, and
// the registry is the TRUST BOUNDARY: a document names observables, it never
// ships code. An unknown name is a loud validation error, not a silent zero
// (the culture-id lesson: silence at the import door costs a debugging day).
//
// Each entry declares: units, clamp range (every encoded value lands in
// [0, 32767] — int16-positive, the inference recipe's input domain), and the
// sim-side read as a JS expression over the game's own in-scope names. The
// expression is REGISTRY code (trusted, versioned with the engine), not
// document code. Parameterized observables ("stop.open:juicebar") are the
// registry's derived layer — the derivation is fixed here, the document only
// picks; derivations stay O(recipes) so a vector's assembly cost is bounded
// by its length (the fuel story for hostile documents: MAX_INPUTS below).
//
// Version bumps when any entry's semantics/encoding changes. An artifact
// carries the version it was trained against; a mismatch fails at load,
// loudly, with the artifact's version and ours in the message.

export const REGISTRY_VERSION = 1;
export const MAX_INPUTS = 64;    // hostile-file cap: a vector is at most this long

const STOPS = ["shack", "juicebar", "showers", "arcade", "hotel"];

// k = the thinking visitor; expressions may use the game's module scope.
// Every expression yields an integer already clamped to [0, 32767].
const clampExpr = (e) => `Math.min(32767, Math.max(0, ${e}))`;

export const OBSERVABLES = {
  // -- the visitor's own state -----------------------------------------
  "need.hunger.q20": { units: "Q20>>6", expr: clampExpr("Math.floor((k.hunger||0)/64)") },
  "need.thirst.q20": { units: "Q20>>6", expr: clampExpr("Math.floor((k.thirst||0)/64)") },
  "need.dirt.q20":   { units: "Q20>>6", expr: clampExpr("Math.floor((k.dirt||0)/64)") },
  "need.bored.q20":  { units: "Q20>>6", expr: clampExpr("Math.floor((k.bored||0)/64)") },
  "wallet.cents":    { units: "cents",  expr: clampExpr("k.wallet|0") },
  "room.reserve.cents": { units: "cents", expr: clampExpr("__res|0") },
  "clock.tmin":      { units: "deci-game-min<<4", expr: clampExpr("(tmin|0)*16") },
  "self.cultured":   { units: "flag*4096", expr: clampExpr("(k.culture && k.culture !== 'crab' ? 1 : 0)*4096") },
  "self.x.px":       { units: "px<<3", expr: clampExpr("Math.floor(k.x*8)") },
  // -- the room question ----------------------------------------------
  "room.wants":      { units: "flag*4096", expr: clampExpr("(wantsRoom(k)?1:0)*4096") },
  "room.free":       { units: "flag*4096", expr: clampExpr("(freeRoom()?1:0)*4096") },
  "room.price.cents":{ units: "cents<<3", expr: clampExpr("(roomPrice()|0)*8") },
};

// Parameterized (derived) observables: name:stop. The derivation is the
// registry's, fixed; the document only picks which stop.
export const PARAMETERIZED = {
  "stop.open":   { units: "flag*4096", expr: (b) => clampExpr(`(visOpen(${JSON.stringify(b)})?1:0)*4096`) },
  "stop.roomfor":{ units: "flag*4096", expr: (b) => clampExpr(`(visRoomFor(k, ${JSON.stringify(b)})?1:0)*4096`) },
  "stop.afford.count": { units: "n<<10",
    expr: (b) => clampExpr(`BIZ[${JSON.stringify(b)}].recipes.filter(r => k.wallet >= menuPrice(${JSON.stringify(b)}, r) + __res).length*1024`) },
  "stop.dist.px": { units: "px<<3",
    expr: (b) => clampExpr(`Math.floor(Math.abs(k.x - BIZ[${JSON.stringify(b)}].queueX)*8)`) },
  "stop.appeal.q16": { units: "Q16>>3", expr: (b) => clampExpr(`priceAppealQ16(${JSON.stringify(b)})>>3`) },
  "stop.taste.best": { units: "tasteW*2048 over affordable",
    expr: (b) => clampExpr(`Math.floor(BIZ[${JSON.stringify(b)}].recipes.reduce((m, r) => k.wallet >= menuPrice(${JSON.stringify(b)}, r) + __res ? Math.max(m, tasteW(k, r)) : m, 0)*2048)`) },
};

export function stops() { return STOPS.slice(); }

// Resolve a declared pick list into { names, exprs } or throw the loud error.
export function resolve(picks) {
  if (!Array.isArray(picks) || !picks.length) throw new Error("input declaration must be a non-empty array of observable names");
  if (picks.length > MAX_INPUTS) throw new Error(`input declaration has ${picks.length} observables, max is ${MAX_INPUTS}`);
  const exprs = [];
  for (const p of picks) {
    if (typeof p !== "string") throw new Error(`observable pick must be a string, got ${typeof p}`);
    const colon = p.indexOf(":");
    if (colon === -1) {
      const o = OBSERVABLES[p];
      if (!o) throw new Error(`unknown observable "${p}" (registry v${REGISTRY_VERSION}); known: ${Object.keys(OBSERVABLES).join(", ")} and parameterized ${Object.keys(PARAMETERIZED).join(", ")} with :stop in {${STOPS.join(",")}}`);
      exprs.push(o.expr);
    } else {
      const base = p.slice(0, colon), arg = p.slice(colon + 1);
      const o = PARAMETERIZED[base];
      if (!o) throw new Error(`unknown parameterized observable "${base}" in "${p}" (registry v${REGISTRY_VERSION})`);
      if (!STOPS.includes(arg)) throw new Error(`unknown stop "${arg}" in "${p}"; stops are ${STOPS.join(", ")}`);
      exprs.push(o.expr(arg));
    }
  }
  return { names: picks.slice(), exprs, version: REGISTRY_VERSION };
}

// The spike brain's own declaration — 42 observables, and the point is that
// this is a DOCUMENT'S choice, not a schema: a pig brain could add
// stop.taste.best:showers and drop clock.tmin without touching the engine.
export const SPIKE_INPUTS = [
  "need.hunger.q20", "need.thirst.q20", "need.dirt.q20", "need.bored.q20",
  "wallet.cents", "room.reserve.cents", "clock.tmin", "self.cultured",
  "room.wants", "room.free", "room.price.cents", "self.x.px",
  ...STOPS.flatMap((b) => [
    `stop.open:${b}`, `stop.roomfor:${b}`, `stop.afford.count:${b}`,
    `stop.dist.px:${b}`, `stop.appeal.q16:${b}`, `stop.taste.best:${b}`,
  ]),
];

// The action surface this spike's brain declares against: vis_pick's
// candidate classes. Output i = logit for class i; argmax, LOWEST INDEX WINS
// on ties (risky-decision 5: every quantized argmax carries its tie-break).
export const SPIKE_CLASSES = [
  "none", "shack:food", "juicebar:drink", "shack:drink",
  "showers:clean", "arcade:fun", "hotel:room",
];

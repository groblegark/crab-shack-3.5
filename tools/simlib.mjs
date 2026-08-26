// Shared headless-sim core: the real game files driven with stubbed browser
// APIs, a synthetic clock, and no rendering — in one of two REALMS.
//
//   vm    (default) — each sim gets a vm context; the historical harness.
//   main  — the game files are evaluated in ONE Function body per sim with
//           the sandbox destructured in (the xengine.js shape). This is the
//           realm the shipped game actually runs in (index.html loads plain
//           <script> tags), and it dodges V8's contextify interceptor, which
//           the kernel-decision doc measured at 3.3-4.2x of headless runtime.
//
// Select with createSim({ realm }) or SIMLIB_REALM=main for whole tools.
// Both realms produce identical fingerprints on the same workload — that is
// the landing gate, receipted in design/cs35-research/vm-escape/.
//
// Main-realm mechanics, and the two traps (both inherited from xengine.js):
// game top-level let/const/function declarations become function-scoped in
// the body, so G() must be an eval CLOSURE minted inside that scope to see
// them; and `simNow`/`rafCb` are deliberately NOT destructured as locals —
// the harness assigns them at runtime, and a destructured local never sees
// `performance.now()`'s read of sandbox.simNow nor the game's own
// requestAnimationFrame assignment. Every driver goes through `window.`,
// which names the same storage in both realms.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const noop = () => {};
const GAME_FILES = ["font.js", "ppu.js", "sprites.js", "crabs.js", "cultureways.js", "game.js"];
const REALM_DEFAULT = process.env.SIMLIB_REALM === "main" ? "main" : "vm";

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Load the game files against a fully-built sandbox and return the drivers:
//   G(expr)      evaluate an expression/statements in the game's scope
//   mkFn(body)   compile a STATEMENT body once; returns a directly-callable fn
//   mkExpr(e)    compile an EXPRESSION once; returns a fn returning its value
// Shared by createSim and tools/headless.mjs (which builds its own sandbox).
export function loadGame(sandbox, realm = REALM_DEFAULT) {
  if (realm !== "main") {
    const C = vm.createContext(sandbox);
    for (const f of GAME_FILES)
      vm.runInContext(readFileSync(join(root, f), "utf8"), C, { filename: f });
    const G = (expr) => vm.runInContext(expr, C);
    const mkFn = (body) => { const s = new vm.Script(body); return () => s.runInContext(C); };
    return { G, mkFn, mkExpr: mkFn, C, realm: "vm" };
  }
  // main realm: one Function body, the sandbox as parameters. Error line
  // numbers point into the concatenated body rather than a filename — the
  // price of the realm; debug in vm mode, measure in main.
  const src = GAME_FILES.map((f) => readFileSync(join(root, f), "utf8")).join("\n;\n");
  const keys = Object.keys(sandbox).filter((k) => k !== "simNow" && k !== "rafCb");
  const body = "var " + keys.join(", ") + ";\n"
    + keys.map((k, j) => `${k} = __sb[${j}];`).join("\n") + "\n"
    + src
    + "\nreturn function (expr) { return eval(expr); };\n";
  const G = new Function("__sb", body)(keys.map((k) => sandbox[k]));
  const mkFn = (b) => G(`(function () { return function () { ${b} }; })()`);
  const mkExpr = (e) => {
    try { return G(`(function () { return function () { return (${e}\n); }; })()`); }
    catch { return () => G(e); }   // statement-shaped predicate: eval per call
  };
  return { G, mkFn, mkExpr, C: null, realm: "main" };
}

// THE MOVEMENT KERNEL (the WASM spike): a compiled second backend for the
// three hot movement loops, proven equal to the JS reference by the suite's
// agreement scenario. Arm with createSim({ kernel: "wasm" }) or
// SIMLIB_KERNEL=wasm for whole tools. Each sim gets its OWN instance and
// memory (isolation is the same per-sim rule the realms follow); game.js
// backs the SoA pool with views over that memory when armed, so JS writes
// and kernel reads are the same bytes. Off by default; the JS path is
// byte-for-byte untouched when unarmed.
const KERNEL_DEFAULT = process.env.SIMLIB_KERNEL === "wasm" ? "wasm" : "off";
let kernelModule = null;
function armKernel() {
  if (!kernelModule)
    kernelModule = new WebAssembly.Module(readFileSync(join(root, "tools", "kernel", "kernel.wasm")));
  const inst = new WebAssembly.Instance(kernelModule, {});
  return { exports: inst.exports, memory: inst.exports.memory };
}

export function createSim({ seed = 1337, storage = null, fresh = true, screenH = 0, realm = REALM_DEFAULT, kernel = KERNEL_DEFAULT, search = null } = {}) {
  const ctxStub = new Proxy({}, {
    get: (t, k) => {
      if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (k === "canvas") return { width: 0, height: 0 };
      return noop;
    },
    set: () => true,
  });
  const mkCanvas = () => ({ width: 0, height: 0, getContext: () => ctxStub,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 256, height: 240 }), addEventListener: noop });
  const store = storage || new Map();
  const seededMath = Object.create(Math);
  seededMath.random = mulberry32(seed);
  const sandbox = {
    document: { createElement: () => mkCanvas(), getElementById: () => mkCanvas(), addEventListener: noop, hidden: false },
    // `search` (when given) is the URL verbatim - it lets a scenario boot the
    // game the way a BROWSER path boots it (`?lab`, `?lab&seed=..`), which is
    // how the save-slot guard gets tested against the paths that bit it.
    location: { search: search != null ? search : (fresh ? "?fresh" : "") },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    // `play()` RETURNS A REAL PROMISE, because the browser's does. The old stub
    // returned a bare `{catch}` thenable, so any caller that wrote
    // `.play().then(...)` - which game.js does, to announce the track - threw
    // "then is not a function" the moment a scenario reached it. That is the
    // harness lying about the API, and the sim contract says the stubs stand in
    // for the browser rather than for the subset we happened to call first.
    // Resolved (not rejected): silence in a sandbox is a track that played.
    Audio: class { constructor() { this.loop = false; this.volume = 0; } play() { return Promise.resolve(); } pause() {} addEventListener() {} },
    AudioContext: undefined, console,
    Math: seededMath, JSON, rafCb: null, simNow: 0,
  };
  // THE KEYBOARD IS REACHABLE NOW. `addEventListener` was a no-op, so the
  // game's keydown handler was constructed and then dropped on the floor -
  // which meant every key the game binds was untestable, and the music keys
  // (shift+arrows, shift+K) are an interface a scenario has to be able to
  // press. Only "keydown" is retained; every other listener keeps the old
  // no-op behaviour, so nothing else in the harness changes shape.
  //
  // `_key(k, shift)` delivers one event to whatever the game registered.
  // preventDefault is a no-op here: the sandbox has no browser to defend
  // against, and a handler calling it must not throw.
  sandbox._keyHandlers = [];
  sandbox.addEventListener = (type, fn) => { if (type === "keydown") sandbox._keyHandlers.push(fn); };
  sandbox._key = (key, shiftKey = false) => {
    const ev = { key, shiftKey, preventDefault: noop, stopPropagation: noop };
    for (const fn of sandbox._keyHandlers) fn(ev);
    return sandbox._keyHandlers.length;
  };
  sandbox.window = sandbox;
  // PORTRAIT PHONES get a 256x288 canvas: index.html sets window.SCREEN_H
  // before ppu.js derives H. A scenario that has to prove a surface fits in
  // BOTH screen heights needs the same switch, so the sandbox honours it.
  // Left unset (the default) the sim is the classic 240 it has always been.
  if (screenH) sandbox.SCREEN_H = screenH;
  sandbox.requestAnimationFrame = (cb) => { sandbox.rafCb = cb; };
  if (kernel === "wasm") {
    sandbox._wasmKernel = armKernel();
    // THE SHARED CURSOR (kernel phase 2): the sim stream's mulberry32 state
    // moves into kernel memory and every draw steps that one cell - JS draws
    // today, kernel-side consumers tomorrow, one interleaved sequence by
    // construction. Same algorithm, same seed, so the sequence is the
    // closure's own; the fingerprint gate (kernel on == off) covers it, and
    // the stream-identity scenario proves the interleaving.
    sandbox._wasmKernel.exports.rng_seed(seed);
    const ku32 = sandbox._wasmKernel.exports.rng_u32;
    seededMath.random = () => (ku32() >>> 0) / 4294967296;
  }
  sandbox.performance = { now: () => sandbox.simNow };
  const { G, mkFn, mkExpr, C } = loadGame(sandbox, realm);
  // THE TOWN'S OCEAN is the run's seed, symmetric with the RNG stream above:
  // the almanac's per-town channels (swell, wind) fold it in, so a seed matrix
  // samples one ocean per seed rather than running the day-only default 48
  // times. Set AFTER loadGame (the fresh-boot block sets an entropy default we
  // must overwrite) and BEFORE any tick. The mist ignores it and stays
  // byte-identical; a save carries its own ocean and load() overrides this.
  G(`_almanacSeed = ${seed >>> 0};`);
  G(`soundOn = false; musicOn = false; screen = "play"; window._headless = true;
     window._stats = { tourServes: 0, crabServes: 0, tourRage: 0, crabRage: 0, bused: 0 };`);
  const stepFns = new Map();
  const stepFn = (ms) => {
    let f = stepFns.get(ms);
    if (!f) { f = mkFn(`window.simNow += ${ms}; window.rafCb(window.simNow);`); stepFns.set(ms, f); }
    return f;
  };
  const getDay = mkExpr("day"), getOver = mkExpr("gameOver");
  return {
    C, G, sandbox, store, realm,
    // run until a predicate (a G-expression) is true, or maxSteps elapse
    runUntil(expr, { step = 50, maxSteps = 400000, onTick = null, tickEvery = 20 } = {}) {
      const s = stepFn(step);
      const check = mkExpr(expr);
      for (let i = 0; i < maxSteps; i++) {
        s();
        if (onTick && i % tickEvery === 0) onTick(G);
        if (i % 20 === 0 && check()) return true;
      }
      return false;
    },
    runDays(days, { step = 50, onTick = null, tickEvery = 20 } = {}) {
      const s = stepFn(step);
      let i = 0;
      while (getDay() <= days && !getOver()) {
        s();
        if (onTick && ++i % tickEvery === 0) onTick(G);
      }
    },
  };
}

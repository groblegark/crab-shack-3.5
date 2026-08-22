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
const GAME_FILES = ["font.js", "ppu.js", "sprites.js", "crabs.js", "game.js"];
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

export function createSim({ seed = 1337, storage = null, fresh = true, screenH = 0, realm = REALM_DEFAULT } = {}) {
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
    location: { search: fresh ? "?fresh" : "" },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    Audio: class { constructor() { this.loop = false; this.volume = 0; } play() { return { catch: noop }; } pause() {} addEventListener() {} },
    AudioContext: undefined, addEventListener: noop, console,
    Math: seededMath, JSON, rafCb: null, simNow: 0,
  };
  sandbox.window = sandbox;
  // PORTRAIT PHONES get a 256x288 canvas: index.html sets window.SCREEN_H
  // before ppu.js derives H. A scenario that has to prove a surface fits in
  // BOTH screen heights needs the same switch, so the sandbox honours it.
  // Left unset (the default) the sim is the classic 240 it has always been.
  if (screenH) sandbox.SCREEN_H = screenH;
  sandbox.requestAnimationFrame = (cb) => { sandbox.rafCb = cb; };
  sandbox.performance = { now: () => sandbox.simNow };
  const { G, mkFn, mkExpr, C } = loadGame(sandbox, realm);
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

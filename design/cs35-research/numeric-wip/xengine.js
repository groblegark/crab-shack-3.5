// CROSS-ENGINE RECEIPT (numeric-protocol par.9): the same two-day fingerprint,
// run under JavaScriptCore instead of V8. Every converted field must be
// bit-identical across engines - that is the whole point of the rewrite.
// Mirrors tools/simlib.mjs's sandbox exactly, in jsc's plain-script dialect.
var ROOT = "/Users/matthewbaker/cs35-wt-numeric/";
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function noop() {}
var ctxStub = new Proxy({}, {
  get: function (t, k) {
    if (k === "createImageData") return function (w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; };
    if (k === "canvas") return { width: 0, height: 0 };
    return noop;
  },
  set: function () { return true; },
});
function mkCanvas() {
  return { width: 0, height: 0, getContext: function () { return ctxStub; },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 256, height: 240 }; },
    addEventListener: noop };
}
var store = {};
var seededMath = Object.create(Math);
seededMath.random = mulberry32(SEED);
var win = {
  document: { createElement: mkCanvas, getElementById: mkCanvas, addEventListener: noop, hidden: false },
  location: { search: "?fresh" },
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
  },
  Audio: function () { this.loop = false; this.volume = 0;
    this.play = function () { return { catch: noop }; }; this.pause = noop; this.addEventListener = noop; },
  AudioContext: undefined, addEventListener: noop, console: console,
  Math: seededMath, JSON: JSON, rafCb: null, simNow: 0,
};
win.window = win;
win.requestAnimationFrame = function (cb) { win.rafCb = cb; };
win.performance = { now: function () { return win.simNow; } };
// jsc has no vm module: the game files are evaluated as one function body with
// the sandbox destructured in, which is the same lexical deal vm.runInContext
// gives them (globals declared with let/const/function land on the closure).
var files = ["font.js", "ppu.js", "sprites.js", "crabs.js", "cultureways.js", "game.js"];
var src = "";
for (var i = 0; i < files.length; i++) src += readFile(ROOT + files[i]) + "\n;\n";
var keys = Object.keys(win);
var body = "var " + keys.join(", ") + ";\n"
  + keys.map(function (k, j) { return k + " = __sb[" + j + "];"; }).join("\n") + "\n"
  + src
  + "\nreturn function (expr) { return eval(expr); };\n";
var make = new Function("__sb", body);
var G = make(keys.map(function (k) { return win[k]; }));
G('soundOn = false; musicOn = false; screen = "play"; window._headless = true;'
  + ' window._stats = { tourServes: 0, crabServes: 0, tourRage: 0, crabRage: 0, bused: 0 };');
while (G("day") <= 2 && !G("gameOver")) G("window.simNow += 50; window.rafCb(window.simNow);");
print(G('JSON.stringify({'
  + ' day: day, tmin: Math.round(tmin), coins: coins, rep: Math.round(rep*10000)/10000,'
  + ' catch: townCatch, serves: window._stats.tourServes, crabServes: window._stats.crabServes,'
  + ' rage: window._stats.tourRage, till: OWNERS.sudsy.till,'
  + ' wallets: allCrabs().map(function (c) { return [c.p.name, c.p.wallet]; }),'
  + ' pos: allCrabs().map(function (c) { return [Math.round(c.x*10)/10, Math.round(c.y*10)/10]; })'
  + '})'));

// SEEING A TOWN.
//
// The sim advances with window._headless = true, which the rung-1 seam
// guarantees never enters the view. To take a picture we flip the flag off
// for exactly one viewFrame() call and read the framebuffer back. That is
// legal because of the seam's own theorem, which the suite pins: THE VIEW IS
// A READER - a render moves no sim state and draws no sim RNG. Rendering a
// town cannot change what the town does, so a picture is never a Heisenberg
// problem.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadGame, mulberry32 } from "../tools/simlib.mjs";
import { SoftCanvas, makeDocument } from "./canvas.mjs";
import { encodePNG } from "./png.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const noop = () => {};

// A sim that can draw. Deliberately NOT a change to createSim: tools/ owns
// the headless sandbox and a sibling fork is editing that file; this builds
// its own sandbox through the exported loadGame door, the way headless.mjs
// already does.
export function createVisibleSim({ seed = 1337, screenH = 240, cultures = null, realm = "main" } = {}) {
  const screen = new SoftCanvas(256, screenH);
  const store = new Map();
  const seededMath = Object.create(Math);
  seededMath.random = mulberry32(seed);
  const sandbox = {
    document: makeDocument(screen),
    location: { search: "?fresh" },
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
  if (screenH !== 240) sandbox.SCREEN_H = screenH;
  sandbox.requestAnimationFrame = (cb) => { sandbox.rafCb = cb; };
  sandbox.performance = { now: () => sandbox.simNow };

  const { G, mkFn, mkExpr } = loadGame(sandbox, realm);
  // A DRAFT CULTUREWAY RIDES IN THROUGH THE GAME'S OWN DOOR: loadCultures,
  // which is what a player's imported save calls. It runs cultureProblem on
  // every document and silently drops the ones that fail, then overlays the
  // survivors on the bundled documents by id. An author's untrusted document
  // therefore takes exactly the path an imported save takes - no side
  // entrance, no privileged install, no bypassed validator.
  if (cultures) G(`loadCultures(${JSON.stringify(cultures)})`);
  G(`soundOn = false; musicOn = false; screen = "play"; window._headless = true;
     window._stats = { tourServes: 0, crabServes: 0, tourRage: 0, crabRage: 0, bused: 0 };`);
  const step = mkFn("window.simNow += 50; window.rafCb(window.simNow);");
  const getDay = mkExpr("day"), getOver = mkExpr("gameOver");
  // ONE FRAME, WITH THE FLAG DOWN. draw() is whatever viewFrame does; the
  // flag goes back up immediately so a later step cannot wander into the
  // view path.
  const draw = mkFn(`window._headless = false;
                     try { viewFrame(0); } finally { window._headless = true; }`);
  return {
    G, sandbox, screen, store,
    runDays(days) { while (getDay() <= days && !getOver()) step(); },
    runTicks(n) { for (let i = 0; i < n; i++) step(); },
    frame({ scale = 3 } = {}) {
      draw();
      return encodePNG(screen.rgba, screen.width, screen.height, { scale });
    },
  };
}

// A PEOPLE, LAID OUT FOR THEIR AUTHOR: every pose in every colorway, plus
// the accessories, on a contact sheet. This is the picture that makes
// "does my culture LOOK right?" answerable without launching a game.
export function renderCultureSheet(doc, { scale = 4 } = {}) {
  const sim = createVisibleSim({ seed: 1337, cultures: { draft: doc } });
  const built = sim.G(`(function () {
    if (!CULTURES.draft) return null;
    const c = CULTURES.draft, b = c.def.art.body;
    return JSON.stringify({ w: b.w, h: b.h, ways: c.arts.length,
      poses: ["a", "b", "w", "s"],
      accs: Object.keys(c.def.art.accessories || {}) });
  })()`);
  if (!built) {
    const why = sim.G(`cultureProblem(${JSON.stringify(doc)}) || "DID NOT BUILD"`);
    throw new Error(String(why));
  }
  const meta = JSON.parse(built);
  // Columns: the four poses, then the STANDING pose wearing each accessory
  // in turn - because "the hat is the class marker" (owner ruling), and an
  // author needs to see the hat ON the body, not beside it.
  const cols = meta.poses.length + meta.accs.length;
  // accessories may hang above the body (a tall hat has a negative dy), so
  // the cell has to be tall enough for the worst overhang on the sheet
  const over = sim.G(`(function () {
    const c = CULTURES.draft; let up = 0, wide = 0;
    for (const k in c.acc) { const a = c.acc[k]; if (!a) continue;
      up = Math.max(up, -a.dy); wide = Math.max(wide, a.dx + a.art.w); }
    return up + ":" + wide;
  })()`).split(":").map(Number);
  const cellW = Math.max(meta.w, over[1]) + 3, cellH = meta.h + over[0] + 3;
  const pad = 3, W = pad + cols * cellW, H = pad + meta.ways * cellH;
  const sheet = new SoftCanvas(W, H);
  const sctx = sheet.getContext();
  sctx.fillStyle = "rgb(24,20,32)";
  sctx.fillRect(0, 0, W, H);
  // Blit the built arts straight off the culture: these are the very
  // canvases the game blits, so the sheet cannot drift from the game.
  // Composited exactly the way drawDossier does it - body at (bx,by),
  // accessory at (bx+dx, by+dy).
  for (let r = 0; r < meta.ways; r++) {
    for (let c = 0; c < meta.poses.length; c++) {
      const art = sim.G(`CULTURES.draft.arts[${r}].${meta.poses[c]}.cv`);
      sctx.drawImage(art, pad + c * cellW, pad + r * cellH + over[0]);
    }
    for (let k = 0; k < meta.accs.length; k++) {
      const col = meta.poses.length + k;
      const bx = pad + col * cellW, by = pad + r * cellH + over[0];
      sctx.drawImage(sim.G(`CULTURES.draft.arts[${r}].a.cv`), bx, by);
      const key = JSON.stringify(meta.accs[k]);
      const acc = sim.G(`CULTURES.draft.acc[${key}]`);
      if (acc) sctx.drawImage(acc.art.cv, bx + acc.dx, by + acc.dy);
    }
  }
  return { png: encodePNG(sheet.rgba, W, H, { scale }),
           meta: { ...meta, columns: [...meta.poses, ...meta.accs.map((a) => "worn:" + a)] } };
}

// A HISTOGRAM, drawn with the same fat pixels as everything else - a sweep's
// distribution is the one number-shaped thing an author reads constantly,
// and a wall of JSON is not a picture.
export function renderHistogram(hist, { title = "", scale = 3, w = 256, h = 120 } = {}) {
  const cv = new SoftCanvas(w, h), g = cv.getContext();
  g.fillStyle = "rgb(24,20,32)"; g.fillRect(0, 0, w, h);
  const keys = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!keys.length) return encodePNG(cv.rgba, w, h, { scale });
  const lo = keys[0], hi = keys[keys.length - 1];
  const span = Math.max(1, hi - lo + 1);
  const max = Math.max(...keys.map((k) => hist[k]));
  const left = 10, bottom = h - 12, top = 14;
  const bw = Math.max(1, Math.floor((w - left - 4) / span));
  for (let i = 0; i < span; i++) {
    const k = lo + i, n = hist[k] || 0;
    if (!n) continue;
    const bh = Math.max(1, Math.round((n / max) * (bottom - top)));
    g.fillStyle = "rgb(240,176,64)";
    g.fillRect(left + i * bw, bottom - bh, Math.max(1, bw - 1), bh);
  }
  g.fillStyle = "rgb(120,104,120)";
  g.fillRect(left - 1, bottom, span * bw + 1, 1);   // axis
  return encodePNG(cv.rgba, w, h, { scale, title });
}

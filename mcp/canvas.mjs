// A software Canvas2D, sized to exactly what the PPU asks for and no more.
//
// The headless sandbox stubs the canvas to noop because the sim never draws
// (the rung-1 seam proves it). To SEE a town, something has to actually put
// pixels somewhere - and the surface the PPU uses turns out to be seven
// calls wide: fillStyle/fillRect, drawImage, createImageData/putImageData,
// translate/scale (one -1 mirror in parseArt), globalCompositeOperation
// ("source-in", for tintArt's silhouettes) and imageSmoothingEnabled (moot
// here - every blit is 1:1 and integer).
//
// Everything is axis-aligned, unscaled and integer, which is why this is
// ~150 lines instead of a dependency. The transform is deliberately NOT a
// general matrix: it is a translate plus an optional horizontal flip,
// because that is the only transform in the codebase. If a future draw call
// needs rotation, it should fail loudly here rather than render subtly wrong
// - so unsupported scales throw.

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

function parseColor(s) {
  if (typeof s !== "string") return [0, 0, 0, 255];
  const m = /^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
  if (m) return [clamp255(+m[1]), clamp255(+m[2]), clamp255(+m[3]),
                 m[4] === undefined ? 255 : clamp255(+m[4] * 255)];
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (h) {
    const x = h[1].length === 3 ? h[1].split("").map((c) => c + c).join("") : h[1];
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), 255];
  }
  if (s === "black") return [0, 0, 0, 255];
  if (s === "white") return [255, 255, 255, 255];
  return [0, 0, 0, 255];
}

class Ctx {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = "#000";
    this.globalCompositeOperation = "source-over";
    this.imageSmoothingEnabled = false;
    this._tx = 0; this._ty = 0; this._flip = false;
  }
  get _d() { return this.canvas._data; }

  translate(x, y) { this._tx += x | 0; this._ty += y | 0; }
  scale(sx, sy) {
    // the only scale in the codebase is parseArt's (-1, 1) mirror
    if (sx === -1 && sy === 1) { this._flip = !this._flip; return; }
    if (sx === 1 && sy === 1) return;
    throw new Error(`softcanvas: unsupported scale(${sx}, ${sy})`);
  }

  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  putImageData(img, dx, dy) {
    const { width: W, height: H } = this.canvas, d = this._d;
    for (let y = 0; y < img.height; y++) {
      const ty = (dy | 0) + y;
      if (ty < 0 || ty >= H) continue;
      for (let x = 0; x < img.width; x++) {
        const tx = (dx | 0) + x;
        if (tx < 0 || tx >= W) continue;
        const si = (y * img.width + x) * 4, di = (ty * W + tx) * 4;
        // putImageData REPLACES, it does not blend - that is the spec, and
        // parseArt depends on it to lay transparent pixels.
        d[di] = img.data[si]; d[di + 1] = img.data[si + 1];
        d[di + 2] = img.data[si + 2]; d[di + 3] = img.data[si + 3];
      }
    }
  }

  fillRect(x, y, w, h) {
    const [r, g, b, a] = parseColor(this.fillStyle);
    if (!a) return;
    const { width: W, height: H } = this.canvas, d = this._d;
    let x0 = (x | 0) + this._tx, y0 = (y | 0) + this._ty;
    let x1 = x0 + (w | 0), y1 = y0 + (h | 0);
    if (x1 < x0) [x0, x1] = [x1, x0];
    if (y1 < y0) [y0, y1] = [y1, y0];
    x0 = Math.max(0, x0); y0 = Math.max(0, y0);
    x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    const src = this.globalCompositeOperation === "source-in";
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const di = (ty * W + tx) * 4;
        // "source-in" keeps the DESTINATION's alpha and takes the source's
        // colour: exactly tintArt's silhouette trick.
        if (src) { if (!d[di + 3]) continue; d[di] = r; d[di + 1] = g; d[di + 2] = b; continue; }
        if (a === 255) { d[di] = r; d[di + 1] = g; d[di + 2] = b; d[di + 3] = 255; continue; }
        const sa = a / 255, ia = 1 - sa;
        d[di] = r * sa + d[di] * ia;
        d[di + 1] = g * sa + d[di + 1] * ia;
        d[di + 2] = b * sa + d[di + 2] * ia;
        d[di + 3] = clamp255(a + d[di + 3] * ia);
      }
    }
  }

  drawImage(src, dx, dy) {
    const sw = src.width, sh = src.height, sd = src._data;
    if (!sd) return;
    const { width: W, height: H } = this.canvas, d = this._d;
    const ox = (dx | 0) + this._tx, oy = (dy | 0) + this._ty;
    for (let y = 0; y < sh; y++) {
      const ty = oy + y;
      if (ty < 0 || ty >= H) continue;
      for (let x = 0; x < sw; x++) {
        const tx = this._flip ? ox - 1 - x : ox + x;
        if (tx < 0 || tx >= W) continue;
        const si = (y * sw + x) * 4;
        const sa = sd[si + 3];
        if (!sa) continue;                       // transparent: the mask
        const di = (ty * W + tx) * 4;
        if (sa === 255) {
          d[di] = sd[si]; d[di + 1] = sd[si + 1]; d[di + 2] = sd[si + 2]; d[di + 3] = 255;
        } else {
          const f = sa / 255, ia = 1 - f;
          d[di] = sd[si] * f + d[di] * ia;
          d[di + 1] = sd[si + 1] * f + d[di + 1] * ia;
          d[di + 2] = sd[si + 2] * f + d[di + 2] * ia;
          d[di + 3] = clamp255(sa + d[di + 3] * ia);
        }
      }
    }
  }
}

export class SoftCanvas {
  constructor(w = 256, h = 240) {
    this.width = w; this.height = h;
    this._data = new Uint8ClampedArray(w * h * 4);
    this._ctx = null;
  }
  getContext() {
    // one context per canvas, and it remembers its transform - parseArt
    // mirrors by translating and flipping a FRESH canvas each time
    if (!this._ctx || this._ctx.canvas !== this) this._ctx = new Ctx(this);
    return this._ctx;
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
  addEventListener() {}
  get rgba() { return this._data; }
}

// The canvas the game asks the document for, plus every offscreen one the
// PPU makes for sprites. Width/height are ASSIGNED after construction by
// parseArt (cv.width = w), so the buffer has to resize on write.
export function makeDocument(screen) {
  const mk = () => {
    const c = new SoftCanvas(1, 1);
    return new Proxy(c, {
      set(t, k, v) {
        if ((k === "width" || k === "height") && t[k] !== v) {
          t[k] = v; t._data = new Uint8ClampedArray(t.width * t.height * 4); t._ctx = null;
          return true;
        }
        t[k] = v; return true;
      },
    });
  };
  return {
    createElement: mk,
    getElementById: (id) => (id === "screen" ? screen : null),
    addEventListener() {},
    hidden: false,
  };
}

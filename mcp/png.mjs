// A PNG encoder in about eighty lines, because the alternative was a native
// dependency in a repo that has never had one. Node ships zlib; PNG is a
// signature, three chunks and a CRC. Nothing here is clever - it is the
// smallest correct encoder for exactly what the PPU produces: 8-bit RGBA,
// no interlacing, one IDAT.
import { deflateSync } from "zlib";

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// rgba: Uint8ClampedArray/Uint8Array of w*h*4. Returns a PNG Buffer.
export function encodePNG(rgba, w, h, { scale = 1 } = {}) {
  if (scale > 1) ({ rgba, w, h } = nearest(rgba, w, h, scale));
  // one filter byte (0 = None) per scanline, then the raw row
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer || rgba, rgba.byteOffset || 0, rgba.length)
      .copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colour type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // deflate, adaptive filter, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// NEAREST-NEIGHBOUR ONLY, and that is a design choice: this is a 256x240
// console screen with 5x7 glyphs. Any smoothing turns readable text into
// grey soup, so a caller asking for 3x gets honest fat pixels.
function nearest(rgba, w, h, s) {
  const W = w * s, H = h * s, out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    const sy = (y / s) | 0;
    for (let x = 0; x < W; x++) {
      const si = (sy * w + ((x / s) | 0)) * 4, di = (y * W + x) * 4;
      out[di] = rgba[si]; out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2]; out[di + 3] = rgba[si + 3];
    }
  }
  return { rgba: out, w: W, h: H };
}

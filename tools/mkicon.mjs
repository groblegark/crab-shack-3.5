#!/usr/bin/env node
// mkicon.mjs — draws the iOS app icon FROM THE GAME'S OWN ART.
//
// The crab and its palette are lifted out of sprites.js as the character maps
// they already are, so the icon cannot drift from the game: redraw the crab and
// regenerate, and the App Store art is the crab that is actually in the game.
// The ground is the bezel gradient from index.html - the mint slab around the
// screen is the game's most recognisable colour, and red-on-mint still reads at
// the 40px the home screen actually shows.
//
// No sim, no PPU, no browser: this reads two files as text and writes a PNG.
//   node tools/mkicon.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodePNG } from "../mcp/png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "sprites.js"), "utf8");

// ---------------------------------------------------------------- the art
function charMap(name) {
  const m = new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`).exec(src);
  if (!m) fail(`sprites.js no longer defines ${name} — the icon's subject moved`);
  return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}
const PAL = {};
{
  const m = /const PAL\s*=\s*\{([\s\S]*?)\};/.exec(src);
  if (!m) fail("sprites.js no longer defines PAL");
  for (const e of m[1].matchAll(/(\w+):\s*\[(\d+),\s*(\d+),\s*(\d+)\]/g)) {
    PAL[e[1]] = [+e[2], +e[3], +e[4]];
  }
}
// The work pose: claw up. A crab at rest is a crab you cannot read at 40px.
//
// MIRRORED left-half-onto-right, because the walk cycle is drawn asymmetric -
// the legs live in the left 12 columns and the raised claw is one-sided, which
// is right for a crab that is moving and wrong for a crab standing still on a
// home screen. The body and eyestalks are ALREADY symmetric, so this is a
// no-op above the waist: it only gives the crab its second claw back.
const mirror = (rows) => rows.map((r) => {
  const row = r.padEnd(16, ".").slice(0, 16), half = row.slice(0, 8);
  return half + [...half].reverse().join("");
});
const crab = mirror(charMap("_CRAB_TOP").concat(charMap("_CRAB_LEGS_W")));
const cw = Math.max(...crab.map((r) => r.length)), ch = crab.length;

// ---------------------------------------------------------------- the ground
// index.html's bezel: linear-gradient(160deg, #c8f5e4, #8fe3c4 55%, #4ec39a)
const STOPS = [[0.0, [0xc8, 0xf5, 0xe4]], [0.55, [0x8f, 0xe3, 0xc4]], [1.0, [0x4e, 0xc3, 0x9a]]];
function ramp(t) {
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i];
      const k = (t - a) / (b - a);
      return [0, 1, 2].map((j) => Math.round(ca[j] + (cb[j] - ca[j]) * k));
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const G = 64;                    // the icon is drawn as 64x64 pixel art...
const SCALE = 16;                // ...and blown up to Apple's 1024 (16 is exact)
const px = new Uint8Array(G * G * 4);
const put = (x, y, [r, g, b]) => {
  if (x < 0 || y < 0 || x >= G || y >= G) return;
  const o = (y * G + x) * 4;
  px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;   // ALWAYS opaque:
};                                                            // iOS rejects alpha

// 160deg ~ down-and-slightly-left; project each pixel onto that axis
const ang = ((160 - 90) * Math.PI) / 180, ax = Math.cos(ang), ay = Math.sin(ang);
const span = Math.abs(ax) + Math.abs(ay);
for (let y = 0; y < G; y++) {
  for (let x = 0; x < G; x++) {
    const u = ((x / (G - 1) - 0.5) * ax + (y / (G - 1) - 0.5) * ay) / span + 0.5;
    put(x, y, ramp(Math.min(1, Math.max(0, u))));
  }
}

// ---------------------------------------------------------------- the crab
const CS = 3;                                     // 16x12 art -> 48x36 pixels
const ox = Math.round((G - cw * CS) / 2);
const oy = Math.round((G - ch * CS) / 2) + 1;     // a hair low: the raised claw
for (let y = 0; y < ch; y++) {                    // reads as top-heavy otherwise
  for (let x = 0; x < crab[y].length; x++) {
    const c = crab[y][x];
    if (c === "." || c === " ") continue;
    const col = PAL[c];
    if (!col) fail(`the crab uses palette slot '${c}', which PAL does not define`);
    for (let dy = 0; dy < CS; dy++) for (let dx = 0; dx < CS; dx++) put(ox + x * CS + dx, oy + y * CS + dy, col);
  }
}

const out = join(root, "ios/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, encodePNG(px, G, G, { scale: SCALE }));
console.log(`icon-1024.png — ${cw}x${ch} crab from sprites.js, ${G}x${G} art at ${SCALE}x = ${G * SCALE}px`);

function fail(msg) { console.error("mkicon: " + msg); process.exit(1); }

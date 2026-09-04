#!/usr/bin/env node
// ONE FILE, FOR A HOST THAT WANTS ONE FILE (Newgrounds).
//
// Newgrounds takes a zip whose top level holds index.html, so a folder build
// would work - but a single self-contained .html has no path to get wrong, no
// second request to be blocked, and survives being dropped on a desktop. That
// is what this makes: every <script src> inlined, and all 22 mp3s carried in
// the page as base64.
//
// THE MUSIC IS THE WHOLE PROBLEM. The shipped mp3s are 55 MB at 128-220 kbps,
// and base64 costs another third on top, so the page is re-encoded music or it
// is nothing. --kbps sets the rate, --mono/--stereo the channels, --secs caps
// a track's length (fading the last 3s so a cut does not click), and --drop
// takes named tracks out of the build entirely. Everything else is byte-equal
// to the folder build.
//
// HOW THE AUDIO IS REWIRED, in one line: game.js resolves every source through
// musSetSrc(a, url), so the bundle wraps that ONE function and hands the
// element a blob: URL for any path it carries. musCurSrc keeps the original
// path, because three call sites downstream test it for "music/archive/" and
// for an http prefix, and a blob: url answers both questions wrong.
//
// IT WRITES THE ZIP TOO, and the file inside it is called index.html because
// that is the one thing Newgrounds insists on: an index.html at the TOP LEVEL
// of the archive. Naming the build after the game and finding out at the
// upload form is a wasted round trip.
//
//   node tools/mkonefile.mjs [--kbps 64] [--stereo] [--secs 0] [--drop NAME,NAME]
//                            [--out dist/newgrounds/index.html] [--no-music] [--no-zip]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has  = (n) => argv.includes("--" + n);

const KBPS  = +flag("kbps", 64);
const MONO  = !has("stereo");
const SECS  = +flag("secs", 0);              // 0 = whole track
const DROP  = (flag("drop", "") || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
const OUT   = path.resolve(ROOT, flag("out", "dist/newgrounds/index.html"));
const CACHE = path.join(ROOT, ".onefile-cache");
const MUSIC = !has("no-music");

const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const kb = (n) => (n / 1048576).toFixed(2) + " MB";

// ---------------------------------------------------------------- the scripts
// Taken from index.html rather than a hand-kept list, so a new <script src>
// lands in the bundle the same day it lands in the game. music/playlist.js is
// the documented optional one: absent in a plain checkout, and its onerror
// makes a 404 the normal case, so it is skipped rather than fatal.
let html = rd("index.html");
const srcs = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)];
if (!srcs.length) throw new Error("index.html: found no <script src> to inline");

let inlined = 0, jsBytes = 0;
for (const m of srcs) {
  const rel = m[1].split("?")[0];
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    if (/\bonerror=/.test(m[0])) { html = html.replace(m[0], `<!-- ${rel}: absent, as in a plain checkout -->`); continue; }
    throw new Error(`index.html references ${rel}, which does not exist`);
  }
  const js = fs.readFileSync(abs, "utf8");
  jsBytes += Buffer.byteLength(js);
  inlined++;
  // </script> inside a string literal ends the element, not the string.
  html = html.replace(m[0], `<script>\n/* ${rel} */\n` + js.replace(/<\/script/gi, "<\\/script") + `\n</script>`);
}

// ---------------------------------------------------------------- the music
// PLAYLIST_LITERAL is the list the game falls back to and the one a plain
// checkout ships, so it is also the list of files worth carrying.
const game = rd("game.js");
const lit = game.match(/const PLAYLIST_LITERAL = \[[\s\S]*?\n\];/);
if (!lit) throw new Error("game.js: could not find PLAYLIST_LITERAL");
// The whole row text is kept, not just src+name: a dropped track has to come
// OUT of the playlist as well as out of the payload, and the game's own
// BUNDLED_PLAYLIST hook wants the rows entire (src, name, energy, role).
const rows = [...lit[0].matchAll(/^\s*(\{ src: "([^"]+)", name: "([^"]+)".*?\}),\s*$/gm)]
  .map(m => ({ text: m[1], src: m[2], name: m[3] }));
if (!rows.length) throw new Error("PLAYLIST_LITERAL parsed to zero rows");

let audioJS = "", playlistJS = "", rawBytes = 0, b64Bytes = 0, kept = 0, dropped = [];
const keptRows = [];
if (MUSIC) {
  fs.mkdirSync(CACHE, { recursive: true });
  const parts = [];
  for (const r of rows) {
    if (DROP.includes(r.name.toUpperCase())) { dropped.push(r.name); continue; }
    const src = path.join(ROOT, r.src);
    if (!fs.existsSync(src)) { dropped.push(r.name + " (missing)"); continue; }
    const tag = `${path.basename(r.src, ".mp3")}-${KBPS}${MONO ? "m" : "s"}${SECS || ""}.mp3`;
    const enc = path.join(CACHE, tag);
    if (!fs.existsSync(enc)) {
      const a = ["-v", "error", "-y", "-i", src];
      if (SECS) {
        // Cut, then fade the last 3s in: a hard cut on a music bed is a click,
        // and the loop point is heard on every rotation.
        a.push("-t", String(SECS), "-af", `afade=t=out:st=${Math.max(0, SECS - 3)}:d=3`);
      }
      a.push("-c:a", "libmp3lame", "-b:a", KBPS + "k", "-ar", "32000");
      if (MONO) a.push("-ac", "1");
      a.push(enc);
      process.stderr.write(`  encoding ${r.name}\n`);
      execFileSync("ffmpeg", a);
    }
    const buf = fs.readFileSync(enc);
    const b64 = buf.toString("base64");
    rawBytes += buf.length; b64Bytes += b64.length; kept++;
    keptRows.push(r.text);
    parts.push(`${JSON.stringify(r.src)}:"${b64}"`);
  }
  // A DROPPED TRACK LEAVES THE PLAYLIST, not just the payload. Left in, its row
  // still points at music/<name>.mp3, the shim has no blob for it, and the
  // rotation walks onto a 404 - survivable (musFail skips on) but it is a dead
  // row in the record box and a gap in the music for no reason. The game
  // already has the hook for this: BUNDLED_PLAYLIST, which it prefers over its
  // own literal, and which normally comes from a record-box vetting pass.
  if (keptRows.length !== rows.length) {
    playlistJS = `<script>\n/* the rows this build actually carries - see BUNDLED_PLAYLIST in game.js */\nvar BUNDLED_PLAYLIST = [\n${keptRows.join(",\n")}\n];\n</script>\n`;
  }
  audioJS = `
<script>
/* ---- the music, carried in the page ----------------------------------------
   Encoded by tools/mkonefile.mjs at ${KBPS} kbps ${MONO ? "mono" : "stereo"} 32 kHz${SECS ? `, capped at ${SECS}s` : ""}.

   THIS BLOCK RUNS BEFORE EVERY GAME SCRIPT, and that ordering is the whole
   trick. The obvious place for it is the end of the body, wrapping musSetSrc -
   which works for a track a player starts, and MISSES the one the game starts
   itself: game.js calls musLoad() at parse time, so a save with MUSIC ON is
   already asking for music/beach-volleyball-start-screen.mp3 before anything
   appended after game.js has run. MEASURED: 6 x 404 on the mp3 paths, and the
   title theme silent, with the shim at the bottom. So the interception is on
   HTMLMediaElement's own \`src\` setter instead of on any function of ours:
   it is installed first, it cannot be bypassed by a caller we did not think
   of, and it needs to know nothing about how the game resolves a track.

   Decoded to a blob ON FIRST PLAY, not at load: eager decoding would spend
   ${kb(rawBytes)} and several seconds before the title screen, on tracks a
   given session mostly never reaches. The blob is cached, so a track pays for
   itself once.                                                              */
(function () {
  var B64 = {${parts.join(",")}};
  var blobs = Object.create(null);
  function blobFor(p) {
    if (blobs[p]) return blobs[p];
    var s = B64[p]; if (!s) return null;
    var bin = atob(s), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    B64[p] = null;                      // the base64 has done its job; let it go
    return (blobs[p] = URL.createObjectURL(new Blob([u], { type: "audio/mpeg" })));
  }
  // The page is one file at an unknown depth, so a bare "music/x.mp3" and the
  // absolute url the browser resolves it to are both live spellings of the
  // same track. Match on the tail, which is the part that identifies it.
  function mapped(v) {
    if (typeof v !== "string" || !v) return null;
    if (B64.hasOwnProperty(v) || blobs[v]) return blobFor(v);
    var i = v.indexOf("music/");
    if (i < 0) return null;
    var k = v.slice(i).split("?")[0];
    return (B64.hasOwnProperty(k) || blobs[k]) ? blobFor(k) : null;
  }
  [HTMLMediaElement, window.HTMLSourceElement].forEach(function (C) {
    if (!C) return;
    var d = Object.getOwnPropertyDescriptor(C.prototype, "src");
    if (!d || !d.set) return;
    Object.defineProperty(C.prototype, "src", {
      configurable: true, enumerable: d.enumerable,
      get: d.get,
      set: function (v) { d.set.call(this, mapped(v) || v); }
    });
  });
  // setAttribute too: the game only ever assigns the property, but a shim that
  // covers one spelling and not the other is a trap for the next change here.
  var sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if (n === "src" && (this instanceof HTMLMediaElement || (window.HTMLSourceElement && this instanceof HTMLSourceElement))) v = mapped(v) || v;
    return sa.call(this, n, v);
  };
})();
</script>
`;
  // FIRST, not last - see the note in the block itself.
  html = html.replace("<body>", "<body>" + playlistJS + audioJS);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
const total = fs.statSync(OUT).size;

// THE ZIP IS THE DELIVERABLE, and it is worth making here rather than by hand:
// base64 of an mp3 is text, so -9 wins back most of the third that base64 cost
// - which is the number the upload form is actually measuring.
let zipLine = "";
if (!has("no-zip") && path.basename(OUT) === "index.html") {
  const zip = OUT.replace(/index\.html$/, "crab-shack-3.5-newgrounds.zip");
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-q", "-9", "-j", zip, OUT]);
  zipLine = `  ${path.relative(ROOT, zip)}  ${kb(fs.statSync(zip).size)}  <- upload this\n`;
}

process.stderr.write(
  `\n${path.relative(ROOT, OUT)}  ${kb(total)}\n` +
  `  ${inlined} scripts inlined   ${kb(jsBytes)}\n` +
  (MUSIC ? `  ${kept} tracks @ ${KBPS}k ${MONO ? "mono" : "stereo"}  ${kb(rawBytes)} audio -> ${kb(b64Bytes)} base64\n` : `  music: omitted\n`) +
  (dropped.length ? `  dropped: ${dropped.join(", ")}\n` : "") + zipLine
);

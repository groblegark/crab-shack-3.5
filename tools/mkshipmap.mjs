// WHICH CATALOG ROWS DOES THIS BUILD ALREADY SHIP? Join by AUDIO, not by name.
//
// Matt, 2026-08-26: "I feel like we should make all the music available to all
// players." The first half of that is cheap and is what this file is for: the
// 22 tracks already sitting in music/ must resolve SAME-ORIGIN, because a
// same-origin mp3 is the only source on Pages that is guaranteed to carry
// content-type: audio/mp3 and play on iOS on the first tap (see musSrc).
//
// WHY THIS IS NOT A ONE-LINE NAME MATCH, and the trap that nearly shipped:
// matching PLAYLIST names against catalog names LOOKS like it works - 20 of 22
// hit. Seven of those twenty are a DIFFERENT RECORDING of the same title:
//
//   PIXEL WAVE WALTZ   shipped 142s   catalog "PIXEL WAVE WALTZ"    123s
//   REGALIA WALTZ      shipped 103s   catalog "REGALIA WALTZ"        77s
//   LANTERN CIRCUIT    shipped 180s   catalog "LANTERN CIRCUIT"     108s
//
// The archive is full of same-name takes - 20 rows named TRAIN WHISTLE, 16
// GOAT CIRCUIT, 14 REGALIA WALTZ - because mkmusic.mjs numbers duplicates
// (`DENSE PORTAL 2`) and the FIRST of a name keeps the bare name. The track a
// build happened to copy in is usually NOT the first one. Stamping the
// name-matched row would have pointed seven tracks at the wrong audio, and
// nothing would have failed loudly: the box would just play the wrong take.
//
// THE JOIN THAT IS ACTUALLY TRUE, cheapest test first:
//   1. BYTE-EXACT. content-length of the release asset == size on disk. 12 of
//      22 land here and there is nothing to argue with.
//   2. FINGERPRINT. The other 10 are 128kbps re-encodes of a ~200kbps master,
//      so no byte test can see them. Decode both to mono 4kHz, take a 1s-RMS
//      envelope, correlate. CONTROLLED before use, which is the only reason to
//      trust it: a known byte-exact pair scores 1.0000, unrelated tracks score
//      0.23-0.35. Everything accepted here scored >= 0.9998.
//
// TRAIN WHISTLE is why the fingerprint is not optional: TWO rows (8 and 18)
// share the shipped file's exact 131s duration, so duration alone cannot pick.
// The envelope does, decisively - 18 scores 1.0000, 8 scores 0.4447.
//
// Regenerating needs network (it HEADs and fetches release assets), so the
// OUTPUT IS CHECKED IN and the game reads that. Re-run only when music/ gains
// or loses a track:
//
//   node tools/mkshipmap.mjs [--out music/shipmap.json]
//
// NOTE: this is a generator, not a gate - it is not part of the merge ritual.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdtempSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i >= 0 ? process.argv[i + 1] : d; };
const OUT = arg("out", "music/shipmap.json");
const CAT = arg("catalog", "music/catalog.json");
const MIN_CORR = +arg("mincorr", 0.99);

const cat = JSON.parse(readFileSync(CAT, "utf8"));
const tmp = mkdtempSync(join(tmpdir(), "shipmap-"));

// A 1s-RMS loudness envelope, decoded to mono 4kHz. Bitrate-independent by
// construction, which is the whole point: it survives the 128kbps re-encode.
function fingerprint(file) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "4000",
    "-f", "s16le", "-t", "90", "-"], { maxBuffer: 1e9 });
  const n = Math.floor(buf.length / 2), win = 4000, out = [];
  for (let i = 0; i + win <= n; i += win) {
    let s = 0;
    for (let k = 0; k < win; k++) { const v = buf.readInt16LE((i + k) * 2); s += v * v; }
    out.push(Math.sqrt(s / win));
  }
  return out;
}
function correlate(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  const A = a.slice(0, n), B = b.slice(0, n);
  const ma = A.reduce((x, y) => x + y, 0) / n, mb = B.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const u = A[i] - ma, v = B[i] - mb; num += u * v; da += u * u; db += v * v; }
  return num / Math.sqrt(da * db || 1);
}
const contentLength = (url) => {
  const h = execFileSync("curl", ["-sIL", "--max-time", "30", url]).toString();
  const all = [...h.matchAll(/^content-length:\s*(\d+)/gim)].map(m => +m[1]).filter(n => n > 1000);
  return all.length ? all[all.length - 1] : 0;
};
const duration = (f) => Math.round(parseFloat(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim()));

const local = readdirSync("music").filter(f => f.endsWith(".mp3")).map(f => "music/" + f);
const ships = {};
const unmatched = [];

for (const src of local) {
  const size = statSync(src).size, secs = duration(src);
  // Only rows whose duration matches are worth a network round trip.
  const near = cat.tracks.filter(t => Math.abs((t.secs || 0) - secs) <= 2);
  let hit = null;

  for (const t of near) {                                     // 1. byte-exact
    if (contentLength(t.url) === size) { hit = { t, how: "byte-exact" }; break; }
  }
  if (!hit && near.length) {                                  // 2. fingerprint
    const mine = fingerprint(src);
    let best = null;
    for (const t of near) {
      const p = join(tmp, t.id + ".mp3");
      if (!existsSync(p)) execFileSync("curl", ["-sL", "--max-time", "180", "-o", p, t.url]);
      const c = correlate(mine, fingerprint(p));
      if (!best || c > best.c) best = { t, c };
    }
    if (best && best.c >= MIN_CORR) hit = { t: best.t, how: "fingerprint " + best.c.toFixed(4) };
  }

  if (hit) ships[hit.t.id] = { file: src, name: hit.t.name, how: hit.how };
  else unmatched.push(src);
}

writeFileSync(OUT, JSON.stringify({
  _comment: [
    "GENERATED-ONCE by tools/mkshipmap.mjs, then checked in - see that file.",
    "Maps a catalog id to the mp3 this build ALREADY ships in music/.",
    "The join is by AUDIO CONTENT, never by name: 7 of the 20 name-equal",
    "pairs are a DIFFERENT recording of the same title (the archive has 20",
    "tracks called TRAIN WHISTLE, 16 GOAT CIRCUIT, 14 REGALIA WALTZ).",
    "byte-exact = release asset is byte-identical to the shipped file.",
    "fingerprint = shipped file is a 128kbps re-encode; matched on RMS",
    "envelope correlation (controls: true pair 1.0000, unrelated 0.23-0.35).",
  ],
  built: Object.keys(ships).length,
  ships,
}, null, 1) + "\n");

console.log("wrote " + OUT + " - " + Object.keys(ships).length + " of " + local.length
  + " shipped files joined to a catalog row"
  + (unmatched.length ? "; no catalog row for: " + unmatched.join(", ") : ""));

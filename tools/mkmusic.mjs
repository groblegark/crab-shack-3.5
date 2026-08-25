// THE MUSIC CATALOG: turn a suno archive into a vettable candidate list.
//
// Matt, 2026-08-24: "we have ~/suno-archive; tons of songs in there; would love
// to get all of them in to crab shack 3.5, but need to kind of vet them... got
// a lot of songs w same name, just use numbers like 'Dense Portal 2'."
//
// THE SHAPE OF THE PROBLEM, measured before designing for it: 1,301 mp3s,
// 4.3 GB. The game currently ships 22 tracks in 55 MB. So this is a CURATION
// problem, not an import one - the archive is ~78x what the game ships, and a
// browser game served off GitHub Pages cannot carry it. Nothing here copies
// audio. It builds the candidate list the in-game music menu vets against; the
// menu's output is a much smaller shipped set.
//
// THE JOIN: manifest.json's `id` is a uuid and each file is named
// <date>_<title>_<first 8 of that uuid>.mp3. Verified 1301/1301 both ways, so
// duration and tags come along for free rather than being re-derived from the
// filename.
//
//   node tools/mkmusic.mjs [--archive ~/suno-archive] [--out music/catalog.json]
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? process.argv[i + 1] : d;
};
const ARCHIVE = arg("archive", join(homedir(), "suno-archive"));
const ARCHIVE_PATH_FILE = "music/archive-path.json";   // gitignored; see below
const OUT = arg("out", "music/catalog.json");

const manifest = JSON.parse(readFileSync(join(ARCHIVE, "manifest.json"), "utf8"));
const files = readdirSync(join(ARCHIVE, "mp3")).filter(f => f.endsWith(".mp3"));

// id prefix -> file, so a manifest row can find its audio.
const byPrefix = new Map();
for (const f of files) {
  const m = f.match(/^(\d{4}-\d{2}-\d{2})_(.*)_([0-9a-f]{8})\.mp3$/);
  if (m) byPrefix.set(m[3], { file: f, date: m[1], fileTitle: m[2] });
}

// THE GAME SHOUTS. Every name in this game is upper case and drawn in a 3x5 or
// 5x7 bitmap font, so a title is normalised to what that font can actually
// print rather than kept pretty in a JSON nobody reads.
const shout = (s) => (s || "")
  .toUpperCase()
  .replace(/[^A-Z0-9 '!?.,-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const rows = [];
for (const t of manifest) {
  const hit = byPrefix.get(t.id.slice(0, 8));
  if (!hit) continue;                       // no audio for this row: not a candidate
  // Prefer the manifest's title; fall back to the filename's. 1071 of 1301
  // carry a manifest title, and the filename's is where the rest live.
  let name = shout(t.title) || shout(hit.fileTitle);
  if (!name || name === "UNTITLED") name = "";   // named below, once numbered
  rows.push({
    id: t.id.slice(0, 8),
    name,
    file: hit.file,
    date: hit.date,
    secs: Math.round(t.duration || 0),
    tags: shout(t.tags).toLowerCase(),
    // THE STREAM URL, which is what makes the whole archive shippable: a track
    // is fetched when it plays, so 4.3 GB of archive costs the repo nothing.
    //
    // This is suno's own url and it is a PLACEHOLDER - tools/mkmusichost.mjs
    // overwrites every one of them with the copy on our releases. Matt,
    // 2026-08-24: "def not suno." A soundtrack should not be a third party's
    // implementation detail; those urls can rotate and take every town silent
    // with them. Keep it only so a freshly-indexed archive is auditionable
    // before the upload has run.
    url: t.audio_url || "",
  });
}

// DETERMINISTIC ORDER, because the numbering depends on it and a
// catalog that renumbers itself between runs would make every vetting decision
// unstable. Date first, then id - both stable facts about the file.
rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));

// TRIAGE THE OBVIOUS OUT, rather than making a human tap past it. Matt,
// 2026-08-24: "yeah forget about stubs and stems for sure". These were
// originally only FLAGGED, on the principle that the menu should decide - but
// the menu's scarcest resource is the operator's attention across 1,301 rows,
// and a category that is never wanted is noise, not a judgement call.
//
// STUBS: under twenty seconds is a fragment, not a track (the archive's
// shortest is 2s).
// STEMS: suno ships isolated parts beside the mix - "<TITLE> GUITAR",
// "<TITLE> BACKING VOCALS". They are a real song's insides, never a track to
// play a town to. Matched on a trailing part-name so a song legitimately
// CALLED e.g. "DRUMS" (no preceding title) is not swept up.
const STUB = 20;
const STEM = /\s(PERCUSSION|GUITAR|VOCALS|BASS|DRUMS|SYNTH|KEYS|STEM|INSTRUMENTAL|ACAPELLA|BACKING VOCALS)$/;
const dropped = { stub: 0, stem: 0 };
const kept = [];
for (const r of rows) {
  if (r.secs < STUB) { dropped.stub++; continue; }
  if (STEM.test(r.name)) { dropped.stem++; continue; }
  kept.push(r);
}
rows.length = 0; rows.push(...kept);

// NUMBERED AFTER THE CULL, and the order is load-bearing: numbering first
// would count tracks that are about to be excluded, so if the first HAM OF
// CHROME happened to be a stub the survivors would start at "HAM OF CHROME 2"
// with no bare name, and every duplicate set would carry gaps. Number what
// actually survives.
// "just use numbers like 'Dense Portal 2'". The FIRST of a name keeps the bare
// name; the rest are numbered from 2. Measured duplication in this archive:
// 156 untitled, 61 HAM OF CHROME, 42 DENSE PORTAL, 41 TRAIN TO THE MOON - so
// this is the common case, not an edge one.
const seen = new Map();
for (const r of rows) {
  const base = r.name || "UNTITLED";
  const n = (seen.get(base) || 0) + 1;
  seen.set(base, n);
  r.name = n === 1 ? base : base + " " + n;
}

const out = {
  _comment: [
    "GENERATED by tools/mkmusic.mjs - do not hand-edit.",
    "The candidate list the in-game music menu vets. This file SHIPS: every",
    "track is publicly hosted (see tools/mkmusichost.mjs), so a player gets the",
    "whole archive as a bench, not just the tracks a build copied in.",
  ],
  built: rows.length,
  excluded: dropped,
  tracks: rows,
};
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");

// THE ARCHIVE PATH GOES IN A SIDECAR, NOT THE CATALOG. It is an absolute path
// under somebody's home directory, and the catalog is now served to the public
// - so publishing it would put the operator's username on a game page for no
// benefit to anyone. Tools read the sidecar; the catalog stays portable.
writeFileSync(ARCHIVE_PATH_FILE, JSON.stringify({ archive: ARCHIVE }, null, 1) + "\n");

const dupes = [...seen.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
console.log("wrote " + OUT + " - " + rows.length + " candidates ("
  + dropped.stub + " stubs and " + dropped.stem + " stems excluded, not hidden), "
  + dupes.length + " names needed numbering; the worst: "
  + dupes.slice(0, 4).map(([n, c]) => n + " x" + c).join(", "));

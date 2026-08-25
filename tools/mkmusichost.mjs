// HOST THE MUSIC OURSELVES, on a GitHub release.
//
// Matt, 2026-08-24: "err yeah we need to get all the tracks into github or some
// other public location, def not suno."
//
// He is right and the reason is not politeness. Streaming from cdn1.suno.ai
// worked - verified 206 with range support, no auth, no referer check - but it
// is somebody else's bucket. Those URLs can rotate, the account can change, and
// the day they do every town in the world goes silent with no warning and no
// fix. A game's soundtrack should not be a third party's implementation detail.
//
// WHY A RELEASE AND NOT THE REPO OR PAGES, measured before choosing:
//   the culled set is 4,065 MB across 1,201 tracks (avg 3.4 MB)
//   - GitHub Pages: 1 GB soft site limit. Does not fit, and the bandwidth
//     allowance would not survive it either.
//   - Committed to the repo: GitHub warns past 1 GB and every clone pays it
//     forever. A game repo should not carry four gigabytes of audio in history.
//   - A RELEASE: 2 GB per asset, served over the same CDN as everything else on
//     github.com. VERIFIED to answer 206 with accept-ranges: bytes, so a
//     browser streams and seeks exactly as it did from suno.
//
// AND VERIFIED IN A BROWSER, WITH A CONTROL. Assets come back as
// application/octet-stream with Content-Disposition: attachment, either of
// which could plausibly stop <audio>. Neither does: 8 cold tracks all reached
// canplay, median 362 ms, worst 553 ms.
//
// A first probe DID stall at zero bytes for 44 s and nearly became the
// finding: "GitHub releases cannot be played". It had no control, and it ran
// while this script was saturating the uplink with a 4 GB upload. Re-run
// afterwards beside a known-good same-origin mp3, the release url reached
// loadedmetadata in 375 ms. The stall was never reproduced. A probe with no
// control cannot tell "the thing is broken" from "my instrument is broken",
// and here the wrong answer would have thrown away the whole approach.
//
// THERE IS A CAP, AND WE HIT IT. A release takes at most 1000 assets:
//   HTTP 422: file_count limited to 1000 assets per release
// The first run put 1000 up and the remaining 201 bounced. So the tracks are
// SHARDED over music-v1, music-v2, ... - filled in order, a new one opened when
// the last is full. Nothing about a track's url depends on which shard holds
// it; the catalog just records the url GitHub returns.
//
// The asset URL is stable and public:
//   https://github.com/<owner>/<repo>/releases/download/<tag>/<file>.mp3
//
//   node tools/mkmusichost.mjs [--tag music-v] [--repo groblegark/crab-shack-3.5] [--limit 0]
//
// Idempotent: a track already on ANY shard is skipped, so an interrupted upload
// is resumed by running it again rather than started over.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import { archiveMp3Dir } from "./archivepath.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 ? process.argv[i + 1] : d;
};
const TAG = arg("tag", "music-v");        // shards are TAG + 1, TAG + 2, ...
const CAP = +arg("cap", 1000);            // GitHub's own limit, per release
const REPO = arg("repo", "groblegark/crab-shack-3.5");
const LIMIT = +arg("limit", 0);          // 0 = everything; a small number to rehearse
const CATALOG = arg("catalog", "music/catalog.json");

const gh = (args, opts) => execFileSync("gh", args, Object.assign({ encoding: "utf8" }, opts || ""));

if (!existsSync(CATALOG)) { console.error("no " + CATALOG + " - run tools/mkmusic.mjs first"); process.exit(1); }
const cat = JSON.parse(readFileSync(CATALOG, "utf8"));
const archiveDir = archiveMp3Dir(cat);

// ASSETS KEEP THEIR ARCHIVE FILENAME, and a track is matched to its asset by the
// 8-char id embedded in that name - NEVER by the name itself. Two reasons, both
// learned the hard way:
//   1. The first cut tried to RENAME each asset to "<id>.mp3" via gh's
//      `path#displayName` syntax. The uploads succeeded and the renames silently
//      did not, so the catalog matched nothing and rewrote zero urls.
//   2. GitHub REWRITES the name it stores - spaces become dots, so
//      "Drum Circle Spell" lands as "Drum.Circle.Spell". A skip-check comparing
//      the local filename to the stored name therefore says "missing" for every
//      spaced file, and a resumed run would have re-uploaded all 4 GB.
// The id survives both transforms, so the id is what we join on.
const idOf = (name) => { const m = String(name).match(/_([0-9a-f]{8})\.mp3$/); return m ? m[1] : ""; };

// Read every shard that already exists. Stops at the first missing tag, so the
// shards must stay contiguous - which they are, since we only ever append.
const shards = [];                                  // [{ tag, count }]
const urlById = new Map();
for (let n = 1; ; n++) {
  const tag = TAG + n;
  let view;
  try {
    view = JSON.parse(gh(["release", "view", tag, "--repo", REPO, "--json", "assets"],
                         { stdio: ["ignore", "pipe", "ignore"] }));
  } catch (e) { break; }
  const assets = view.assets || [];
  for (const a of assets) { const id = idOf(a.name); if (id) urlById.set(id, a.url || a.browser_download_url); }
  shards.push({ tag, count: assets.length });
}
if (shards.length) {
  console.log("shards: " + shards.map(s => s.tag + " " + s.count + "/" + CAP).join(", ")
    + " - " + urlById.size + " tracks already hosted");
}

// Open the next shard on demand. A release is created only when there is
// something to put in it, so a run with nothing to do leaves no empty husk.
const openShard = () => {
  const tag = TAG + (shards.length + 1);
  console.log("creating release " + tag);
  gh(["release", "create", tag, "--repo", REPO, "--title", "CRAB SHACK music " + (shards.length + 1),
      "--notes", "Audio assets for the CRAB SHACK 3.5 soundtrack. Streamed by the game "
      + "on demand; the repo carries none of it. Sharded because a GitHub release "
      + "takes at most " + CAP + " assets."]);
  shards.push({ tag, count: 0 });
  return shards[shards.length - 1];
};
const currentShard = () => {
  for (const s of shards) if (s.count < CAP) return s;
  return openShard();
};

const todo = (cat.tracks || []).filter(t => !urlById.has(t.id));
const work = LIMIT > 0 ? todo.slice(0, LIMIT) : todo;
console.log(work.length + " to upload (" + (todo.length - work.length) + " left for a later run)");

let done = 0, failed = 0;
for (const t of work) {
  const src = join(archiveDir, t.file);
  if (!existsSync(src)) { console.error("  missing locally: " + t.name); failed++; continue; }
  let shard = currentShard();
  try {
    gh(["release", "upload", shard.tag, src, "--repo", REPO, "--clobber"],
       { stdio: ["ignore", "ignore", "pipe"] });
    shard.count++;
    done++;
    if (done % 25 === 0) console.log("  " + done + "/" + work.length + " (" + shard.tag + ")");
  } catch (e) {
    const msg = String(e.stderr || e.message);
    // Trust the SERVER's count over ours: if it says full, mark it full and
    // retry this same track on a fresh shard rather than losing it.
    if (/file_count limited/.test(msg)) {
      shard.count = CAP;
      shard = currentShard();
      try {
        gh(["release", "upload", shard.tag, src, "--repo", REPO, "--clobber"],
           { stdio: ["ignore", "ignore", "pipe"] });
        shard.count++; done++;
        continue;
      } catch (e2) { e = e2; }
    }
    console.error("  FAILED " + t.name + ": " + msg.slice(0, 120));
    failed++;
  }
}

// Rewrite the catalog's urls to point at OUR host - USING THE URL GITHUB GIVES
// BACK, never one assembled here. Asset names carry spaces and punctuation that
// have to be percent-encoded exactly right, and a hand-built url that is subtly
// wrong fails silently at play time instead of loudly here. (This is the same
// mistake the zig tarball fetch made earlier today: reconstructing what upstream
// already publishes.)
//
// Done last and only for what actually uploaded, so a partial run leaves a
// catalog that is still true.
for (const s of shards) {
  const assets = JSON.parse(gh(["release", "view", s.tag, "--repo", REPO, "--json", "assets"])).assets || [];
  s.count = assets.length;
  for (const a of assets) { const id = idOf(a.name); if (id) urlById.set(id, a.url || a.browser_download_url); }
}
let rewritten = 0;
for (const t of cat.tracks) {
  const u = urlById.get(t.id);
  if (u) { t.url = u; rewritten++; }
}
cat.host = { repo: REPO, shards: shards.map(s => ({ tag: s.tag, assets: s.count })) };
writeFileSync(CATALOG, JSON.stringify(cat, null, 1) + "\n");

console.log("uploaded " + done + ", failed " + failed + "; catalog now points "
  + rewritten + "/" + cat.tracks.length + " tracks at "
  + shards.map(s => s.tag).join("/"));
if (rewritten < cat.tracks.length) {
  console.log("  run again to finish - it skips what is already up there");
}

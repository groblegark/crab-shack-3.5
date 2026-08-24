#!/usr/bin/env node
// mkios.mjs — assembles ios/www (the app's whole payload) and regenerates the
// Xcode project from ios/project.yml.
//
// The iOS app ships the SAME FILES as the live site; there is no iOS build of
// the game and there must never be one. This tool's real job is the guard: it
// DERIVES the file list from the source rather than carrying a hand-written
// manifest, so a new script tag or a new music track cannot be forgotten and
// ship as a blank screen or a silent jukebox on a device nobody tested.
//
//   scripts  <- every <script src> in index.html (query strings are the live
//               site's cache-busters and mean nothing to the bundle)
//   music    <- every "music/*.mp3" string literal in the game sources
//
// Anything referenced but missing is a hard failure. Anything present but
// unreferenced is reported and NOT shipped - dead weight in an app bundle is
// download size charged to a player.
//
// Run it before every device build and before every archive:  node tools/mkios.mjs
import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "ios", "www");
const R = (p) => readFileSync(join(root, p), "utf8");

const index = R("index.html");

// ---------------------------------------------------------------- the list
const scripts = [...index.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1].split("?")[0]);
if (!scripts.length) fail("index.html has no <script src> at all — did the tag shape change?");

// the sources that can name a track: every script the page loads, plus the page
const sources = ["index.html", ...scripts.filter((s) => s.endsWith(".js"))];
const music = [...new Set(sources.flatMap((s) => [...R(s).matchAll(/"(music\/[^"]+)"/g)].map((m) => m[1])))].sort();
if (!music.length) fail("no music/*.mp3 literals found — the jukebox would ship silent");

// a track on disk that nothing names is either dead or reached by a computed
// path; either way the bundle should not guess
const onDisk = readdirSync(join(root, "music")).filter((f) => f.endsWith(".mp3")).map((f) => "music/" + f);
const orphans = onDisk.filter((f) => !music.includes(f));

const payload = ["index.html", ...scripts, ...music];
for (const p of payload) {
  if (!existsSync(join(root, p))) fail(`index.html or a game source names ${p}, which does not exist`);
}

// ---------------------------------------------------------------- the copy
rmSync(www, { recursive: true, force: true });
let bytes = 0;
for (const p of payload) {
  const dst = join(www, p);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(join(root, p), dst);
  bytes += statSync(dst).size;
}

const mb = (bytes / 1048576).toFixed(1);
console.log(`ios/www — ${payload.length} files, ${mb} MB (${scripts.length} scripts, ${music.length} tracks)`);
for (const o of orphans) console.log(`  note: ${o} is on disk but nothing names it — NOT shipped`);

// the build stamp is the payload's identity, exactly as it is on the live site
const stamp = /sha:\s*"([0-9a-f]{7})"/.exec(R("version.js"));
console.log(`  build ${stamp ? stamp[1] : "UNSTAMPED — run tools/mkversion.mjs"}`);

// ---------------------------------------------------------------- the project
// The Apple Developer team: CS_TEAM_ID, else ios/team.local (gitignored, one
// line). It has to come from one of those two because the PROJECT IS GENERATED
// - a team picked in Xcode's Signing editor is wiped by the next regeneration,
// silently, and the next device build then fails for a reason that looks like
// a portal problem.
const teamFile = join(root, "ios", "team.local");
const team = process.env.CS_TEAM_ID
  || (existsSync(teamFile) ? readFileSync(teamFile, "utf8").trim() : "");
console.log(team ? `  signing team ${team}` : "  note: no CS_TEAM_ID and no ios/team.local — this project will not sign");

// xcodegen is optional here so the payload can be assembled on a machine that
// only serves it (and so this tool stays useful before Xcode finishes landing)
try {
  const out = execFileSync("xcodegen", ["generate", "--spec", "project.yml", "--quiet"],
                           { cwd: join(root, "ios"), encoding: "utf8",
                             env: { ...process.env, CS_TEAM_ID: team },
                             stdio: ["ignore", "pipe", "pipe"] });
  if (out.trim()) console.log(out.trim());
  console.log("ios/CrabShack35.xcodeproj — regenerated from project.yml");
} catch (e) {
  if (e.code === "ENOENT") console.log("  note: xcodegen not on PATH (brew install xcodegen) — payload only");
  else fail("xcodegen failed:\n" + (e.stderr || e.stdout || e.message));
}

function fail(msg) { console.error("mkios: " + msg); process.exit(1); }

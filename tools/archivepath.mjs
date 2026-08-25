// WHERE THE SUNO ARCHIVE LIVES, for the tools that need the mp3s themselves.
//
// This used to be a field in music/catalog.json, which was fine while that file
// was gitignored. It is not fine now: every track is publicly hosted, so the
// catalog SHIPS, and an absolute path under a home directory would put the
// operator's username on a public game page. The path is local knowledge, so it
// lives in a local, gitignored sidecar.
//
// Falls back to the old catalog field so an archive indexed before this split
// still resolves, and to ~/suno-archive so a fresh checkout guesses correctly.
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export function archiveRoot(catalog) {
  try {
    if (existsSync("music/archive-path.json")) {
      const j = JSON.parse(readFileSync("music/archive-path.json", "utf8"));
      if (j && j.archive) return j.archive;
    }
  } catch (e) {}
  if (catalog && catalog.archive) return catalog.archive;   // pre-split catalogs
  return join(homedir(), "suno-archive");
}

export function archiveMp3Dir(catalog) { return join(archiveRoot(catalog), "mp3"); }

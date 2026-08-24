# CLOSE-OUT: the build stamp (version.js on the title screen)

**Directive (Matt, 2026-08-24):** "can we get a version/build displayed in the
start screen of cs 3.5 so we can see what verison we are on?" — remote
play-testing needs the build named on screen.

## What shipped

- **tools/mkversion.mjs** — writes `version.js` with
  `const GAME_BUILD = { sha, date }`. Sha via `git rev-parse --short=7`
  (fallback: `.git/HEAD` the kube-arm way, following a worktree's `.git`
  pointer file one hop); date is the COMMIT's date (`%cs`), never wall clock,
  so regeneration is deterministic for a given commit.
- **version.js** — generated, committed, loaded by index.html FIRST (before
  font.js), so the stamp exists before any draw. No cache-buster: the stamp
  describes the files actually loaded, which is exactly what remote
  bug-reporting wants even when a CDN serves stale.
- **The title screen** — `BUILD <sha> <date>` right-aligned in the panel band
  (PANEL_Y+32, under the snescat credit), muted [120,105,95]. Screenshot:
  `devlog/img/2026-08-24-title-build-stamp.png`.
- **The help card** — `BUILD <sha>` on the footer row, left of the DONE chip
  (the right edge belongs to DONE — first placement collided, caught by
  reading `helpRects()` before shipping). Findable mid-game for bug reports.
- **Graceful absence** — both draw sites guard on
  `typeof GAME_BUILD === "object"`; a missing/stale version.js costs the stamp,
  never a crash, and the headless harness (which never loads version.js)
  is untouched.
- **CLAUDE.md: THE MERGE RITUAL** — the orchestrator runs
  `node tools/mkversion.mjs` alongside `mkcultureways.mjs` at every merge
  before push.

## The self-referential stamp, named

Committing the stamp changes the sha, so the stamp names the merge state it
was generated FROM — the live tip is always the stamped commit plus the
stamp commit itself. Identification is unharmed (the pair is 1:1); strict
sha-equality with HEAD is impossible by construction, so the suite scenario
("the build stamp is well-formed and wired") checks SHAPE and WIRING:
GAME_BUILD's 7-hex sha + ISO date, version.js loading before game.js in
index.html, and the stamp string fitting its corner (≤24 chars).

## Gates

- `node --check` on game.js, version.js, mkversion.mjs, the suite — clean.
- **Full suite on the cluster at 3ff9285: 656/656, 20/20 arms banked**
  (`cs-suite-318-3ff9285-mb3c`), scale-down verified.
- **MCP battery at d285b78: exit 0, zero failures**
  (`cs-phased-gates-d285b78-408t`).
- The three commits between those SHAs touch only `deploy/` (the chart clamp
  below), this close-out, and a PNG — nothing the suite reads, so the
  656/656 transfers.

## A substrate bug found and fixed en route (upstream this)

The mainline chart's new per-index backoff shipped `maxFailedIndexes: 5` as a
flat default, but k8s refuses `maxFailedIndexes > completions` — so **every
manifest with fewer than 5 arms failed to install at all**: the 1-arm MCP
battery (my gate, INSTALLATION FAILED) and, near-certainly, the sibling
`cs-e6-focus` 2-arm run observed Failed 0/2 in the same window. Fixed here by
clamping to the arm count (`min(maxFailedIndexes, arms)`), template-verified
at 1→1, 2→2, 20→5. **This is a mainline bug affecting every fork's focus
runs — merge or cherry-pick promptly.**
- Byte-neutral to the sim: zero draws added (title/help are view; neither
  draws headless), no sim reads, no schema. The suite's frozen pins are the
  proof.

## Debts / notes

- The stamp is 3x5-font ASCII; a future culture-themed title skin should keep
  a stamp line (the ritual note in CLAUDE.md is the durable rule).
- If GitHub Pages cache-lag confuses testing, the stamp on screen IS the
  answer — it names what loaded, not what was pushed.

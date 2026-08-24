# E4 house-limit ladder matrix — measured against its own parent (IN-POD)

Task: kd-6IVzgiExO6 (parent kd-UcvVdC7zFW, E4 slice 1 OWED item 3).

## What this measures

CLAUDE.md: a balance change owes a headless matrix re-run, and you
**measure against the tree you are landing on, not against a number in PLAN
or a receipt from June**. The E4 house-limit ladder grew the platform grid
~40%, so this is that owed re-run — run **adjacent** against the ladder's
**own parent**, so the only variable is the ladder itself.

- **Side A — `09d78ba`** "the stamp names the E3 merge" — the E4 ladder's own parent.
- **Side B — `83fb0f4`** "the stamp names the sidecar commit" — main tip at run time
  (`origin/main` == `83fb0f4`, confirmed by `git fetch` before the run).

  > **`origin/main` advanced to `ec6f74b` while this ran.** The only `game.js`
  > change on `83fb0f4..ec6f74b` is inside `drawTitle()` — a title-screen credit
  > block re-derived from the science button's bottom edge — which the headless
  > matrix never exercises (it feeds no cap/hall/eviction/lifetime state), and
  > the harness is byte-identical there too. So side B is still representative of
  > current main; the matrix would read identically on `ec6f74b`. Notably,
  > `ec6f74b`'s own title is *"the ladder answers: the new rungs are unreachable,
  > and so is the old top one"* — an independent statement of the same finding
  > this receipt measures.

The change under test (`git diff 09d78ba 83fb0f4 -- game.js`):
- `HEAD_CAP.steps` `[0,2,3,4,6]` → `[0,2,3,4,6,8,12]` — two new rungs above 6 (the ~40% grid growth).
- founding `hall.policy.cap` `0` (NO LIMIT) → `4` (index of the 6 rung) — a new town founds itself capped at six.
- default `hall.plat.cap` `0` → `4` — the pre-filled campaign platform endorses the founding cap instead of running to abolish it.

**Harness is byte-identical across both SHAs** — `tools/batch.mjs`,
`tools/headless.mjs`, `tools/simlib.mjs` show an empty `git diff` between the
two commits. So the regression detector cannot drift between sides; the only
difference is `game.js`.

## How it was run (IN-POD, not via kube.mjs)

`tools/kube.mjs` does not work from a `cs` pod (kd-wbdYahwATd banks the three
verbatim errors — a cs pod has no AWS identity to drive it). CLAUDE.md's scope
note is explicit that a cs fleet pod **is** cluster compute and may run sim
workloads in-pod within its own limits. So this ran in-pod:

- A second worktree `git worktree add … 09d78ba` for side A, so no tree was
  thrashed between two SHAs.
- **12 arms, strictly SEQUENTIAL** (never two sims at once — concurrent runs
  make timings lie and fight for heap). `--jobs 7` within each arm (nproc-1 on
  an 8-core box).
- Each arm mirrors `tools/batch.mjs`'s fork convention **exactly**: raw seeds
  `SEEDBASE+idx` (0..15 / 16..31 / 32..47 — NOT headless's own `*1337`
  matrix seeds), `SIMLIB_KERNEL=wasm`, `SIMLIB_REALM=main`, worker entry the
  target tree's own `tools/headless.mjs`. Verified by a cross-check: on
  `main-tip baseline sb0`, `batch.mjs --json` and the per-seed collector
  produced **identical** aggregates (survived 0/16, histogram
  `{9:4,11:3,12:3,13:5,14:1}`, median 12, lifetime median $3586). The
  collector only adds the per-seed rows `batch.mjs --json` drops — the E4 task
  needs the per-seed escape list so a reader can see whether a delta is one
  town moving or a real shift.

The 48-town shape (three 16-town seed blocks) is the shape the rulings table
is written in, and CLAUDE.md warns the 8-seed growth block is a coin — 48 is
the honest number.

Arms per side: baseline (buy nothing) and growth (`--buy chef,table`),
each × seedbase {0, 16, 32}. Six arms per side, twelve total.

## RESULTS

| side | arm | survived /48 | escapes (sb:seed) |
|------|-----|--------------|-------------------|
| A `09d78ba` | baseline | **0/48** | (none) |
| A `09d78ba` | growth   | **15/48** | sb0:{3,5,9,10,13} · sb16:{16,19} · sb32:{32,35,36,39,41,42,43,45} |
| B `83fb0f4` | baseline | **0/48** | (none) |
| B `83fb0f4` | growth   | **15/48** | sb0:{3,5,9,10,13} · sb16:{16,19} · sb32:{32,35,36,39,41,42,43,45} |

Per-seedbase growth block (both sides identical): sb0 5/16 · sb16 2/16 · sb32 8/16.

**The two sides are not merely equal in the /48 count — they are IDENTICAL
seed-for-seed.** For every one of the 12 arms, the result object (eviction
histogram, lifetime median/p10/p90/mean, and every per-seed `{day, lifetime}`
row) is byte-for-byte the same across the two SHAs; the only fields that
differ are the worktree path and the wall-clock timing. Not one town, on
either the baseline or the growth arm, changed its outcome — not its survival,
not its eviction day, not its lifetime dollars.

## READING

**This is the "numbers essentially unchanged" case — and it is the strong
form of it.** The ladder moves **no** matrix number at all: not a survival
count, not a histogram bucket, not a single seed's day or dollars. That is
consistent with, and corroborates, the vacuity finding this E4 slice is
already chasing (kd-UcvVdC7zFW item 2, the rungprobe): **a ladder that moves
no fingerprint AND no growth number is cosmetic on the floor until something
votes on the new rungs.**

Why this is exactly what the change predicts, mechanically:

- The **new rungs 8 and 12** only matter if a town's cap dial reaches index 5
  or 6. On the matrix floor nobody campaigns and nobody moves the cap dial —
  `headless.mjs` buys a fixed list and never touches the hall — so the ladder
  never climbs past the founding index. Two rungs that are never reached
  cannot change an outcome.
- The **founding `cap:4` (= the 6-head rung)** is a *tighter* cap than the old
  `cap:0` (NO LIMIT) — but the growth arm buys only `chef,table`, i.e. a
  handful of heads, far under six. A six-head limit never binds on a two-hire
  autopilot, so the tighter founding cap is invisible here too. (It would bite
  a bot that tried to staff a business past six — but the matrix measures the
  FLOOR, and this floor never tries.)
- The **default platform `cap:4`** only matters at an election the floor never
  contests.

So all three prongs of the change are real policy — they are simply not
exercised by a fixed-buy, never-re-price, never-campaign autopilot. The
matrix is a regression detector and it measures the floor; on the floor this
ladder is inert. **Nothing was tuned to reach this — the numbers are reported
as measured.** Neither the "growth moved UP (erosion)" case nor the "growth
moved DOWN (founding cap biting)" case occurred: growth held at 15/48 on both
sides, exactly.

One honest caveat on the 15/48 magnitude itself: it is *higher* than the
~2/16-per-block figure CLAUDE.md's STATE OF PLAY quotes. That is **not** a
ladder effect — both SHAs read 15/48 identically, so whatever moved the floor
up to this level happened at or before `09d78ba`, not in the ladder commits.
This run does not attribute or investigate that; it only certifies that the
E4 ladder added nothing to it. (The seed layout also differs from the CLAUDE.md
figure — three 16-town blocks at sb 0/16/32, versus the 8-town default/`--seedbase 8`
blocks — so the two are not directly comparable anyway.)

## Files

- `summary.json` — per-arm rows + the two-side /48 rollup.
- `<side>-<sha>-<kind>-sb<N>.json` — one receipt per arm, per-seed rows included.

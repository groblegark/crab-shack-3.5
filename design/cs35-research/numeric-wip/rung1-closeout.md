# RUNG 1 CLOSE-OUT — the sim/view split (the seam)

**LANDED.** A refactor, so the bar was the strongest one: byte-identical, no
re-baseline owed or taken.

## The boundary design

`frame()` is now a driver: the quantizer (wall ms → whole ticks), then
`simClock(dt, rawMs)` (card timers, the day rollover, the settlement,
`updateBankWarning`), the intro/title early-outs, `simTown(dt)` (the world in
motion: bus, job board, polls, customers, chatter, the crab loop, selection
auto-clear, the report/depart flow, toast decay, autosave, floater aging,
collide), and only then the one headless gate. Past the gate live the
readers: `followCam` (the lerp, named so the suite can drive it from a frozen
state) and `viewFrame` (the whole painter's pass), plus `introFrame` and
`titleFrame` for the other screens. Every reader increments
`window._viewCalls`; the suite asserts a headless day counts zero.

Announcement state (toasts, floaters, the report and departure cards, quips,
hireCard) is deliberately SIM, not view — the suite drives and reads all of
it (97 references), so it is observable world, and its lifetimes run on sim
time by the code's own stated design. The view may look at anything and write
nothing the sim reads.

## The smuggled-semantics inventory (every sim↔view touch found)

Sweep: `camX`, `ctx`, `W`, `darkness()`, `mistNow`, `viewT`, font metrics —
every hit classified by its enclosing function against the reader set.

1. **`drawFloaters` aged the floaters** (`f.t -= dt`, the expiry filter) — the
   view WRITING observable state, and headless towns therefore hoarded every
   pop-up since day one (unbounded array, and stale floats matching later
   scenario assertions). FIXED: `ageFloaters` runs in `simTown`; the draw is a
   pure reader. The most interesting find of the sweep.
2. **`darkness()` is sim wearing a view name** — a pure `tdgm` ramp, read by
   seven sim deciders (updateHome, chatReady, homeSpot, crabMood, crabStatus,
   targetEnergy, maybeQuip). Classification (a): mislabeled, no move needed.
   The inverse of the census's `mistNow() > 0.6` catch (already integer-fixed
   in slice 2 as `mistNowQ16`).
3. **`viewT` is misnamed** — derived from the master tick in `reclock()`
   (`viewT = T / TICK_HZ`), so `earnHist.push({ t: viewT })` is sim-time
   stamping, not a view read. No leak; noted so nobody "fixes" it.
4. **Three camera writes from sim** — `hireCrew`, the ferry ending, and the
   win path in `load`: one-way "go and look at this" EMISSIONS into view
   state, never read back. Legal under the contract; documented.
5. **`camX`/`ctx`/`W` readers outside draw functions** are all input mapping
   (click → world coords) or card-drawing helpers — browser-only paths.
6. **Font metrics (`textWidth`, `fitSmall`) used by sim** for announcement
   trimming — deterministic world constants (the 5x7 font), sim-usable by
   design; the "no surface prints off the canvas" scenario depends on it.
7. **The title screen is view-side sim theatre** — attract wander, `updateBus`
   and `maybeQuip` run from `titleFrame`. Browser-only by construction
   (headless boots to `screen = "play"`), inventoried for slice 5 below.

## The RNG consumer inventory (slice 5's architectural fact)

91 `srand()` call sites. **90 are sim-stream** (top consumers: newVisitor 12,
updateFishing 7, updateTap 6, updateKitchen 5, newCustomer 5). **Exactly 1
lives in a view function**: the title attract wander in `titleFrame` — plus
the sim functions it re-enters (`maybeQuip`, `updateBus`), which draw from
the shared stream while the title screen runs. Post-split this is provable,
not asserted: the seam scenario counts zero draws across a render, so the
DRAW path consumes nothing; the only view-side consumption is the title
screen, unreachable headless. Slice 5's job is therefore exactly one route:
give the title screen (and anything else `titleFrame` re-enters) a view
stream, and the shared stream's order is frozen for free everywhere else.

## The golden seam scenarios (both committed, all mutations bite)

- **"seam: a headless day never enters the view"** — two days, asserts
  `_viewCalls === 0`. Mutation: gate removed (`if (false && _headless)`) →
  fails with "crossed the seam 12300 time(s)".
- **"seam: the view is a reader - two renders move nothing"** — freezes a
  mid-morning state (with a live floater planted), wraps `srand` with a
  counter, runs `viewFrame` twice against the headless canvas stub, asserts
  2 crossings, 0 sim-stream draws, and a byte-identical state digest
  (tick, money, needs, positions, floaters). Mutations: aging reinserted in
  `drawFloaters` → "rendering moved sim state"; `srand()` planted in
  `drawBG` → "a render drew 2 number(s) from the SIM stream".
- The cycler scenario's camera arm now drives `followCam(0.05)` from a frozen
  state (the lerp is view-side and headless frames never run it). Mutation:
  a dead lerp → "the camera never converged".

## The gate

- Suite **256/256 exit 0** in BOTH realms (main 33.3s, vm 116.6s) —
  254 + the two seam scenarios. Receipts: split-suite-main.txt, split-suite-vm.txt.
- Fingerprints **byte-identical** to pre-split (`1337:17889:7 4242:23760:7`),
  every bench run, both realms.
- 16-seed × 30-day baseline matrix **byte-identical** pre/post split
  (split-pre-matrix.txt vs split-post-matrix.txt, timing lines filtered).
- Conservation soak: 247 movements over three 30-day seeds, every one
  `delta === want`, all three doors exercised.
- Cross-engine: the day-2 fingerprint **bit-identical under JavaScriptCore**
  on both seeds (xengine.js; jsc needs `var SEED = n;` prepended as its own
  script file, and running the same harness under node needs `readFile`/
  `print` shimmed — both invocations recorded here).
- Browser sanity: loads, animates, zero console errors — screenshot beside
  this file (rung1-browser.png). The slice-2 human play-test (game FEEL at
  speed) remains owed from the owner; this gate is only "renders and runs".

## What this unlocks

Slice 4 (space → Q8) may now proceed: the geometry the sim owns is flushed
and named. Slice 5's re-route shrank to one door. The phase-split of the tick
(branchless study, recommendation 2) has its seam. And the browser game can
eventually run the sim in a Worker — the split makes that a transport
question, not an untangling.

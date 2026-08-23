# CREW UX CLOSE-OUT — the roster pages, the surfaces yield, the pigs get their faces

Mandate (Matt, 2026-08-23, accumulated over one patch): more-than-6 crew UX;
audit the big info pages for overgrowth and collision with a house "..MORE"
idiom; the selector pops down manually and yields to big pages; pig employees
wore crab icons (CLOVER repro: `?lab&seed=1329&plan=2&span=30&rule=0`); the
science run's terrifying sound burst; and the inspector's NOW/ENGINE row.

## What the old strip actually did at 7+

`crewTilesShown` dropped whoever didn't fit behind a "+N [ ]" tile — drawn but
NOT in the hit test (the tap loop covered shown tiles only, old game.js:14132).
A phone player could not select crab seven at all; `[ ]` cycling was the only
path. The canonical off-canvas sweep never caught it because it checks x only
and the strip clipped, not overflowed.

## The audit table (all cites at branch tip)

| surface | overgrowth | collision | verdict |
|---|---|---|---|
| crew strip (`crewStripGeom`, drawPanel crew tab) | 7+ crew dropped, unreachable by tap | — | **FIXED: pages behind a MORE> chip** (tap + `[ ]`, snap-on-select, one geometry table for draw and hit test) |
| brain inspector (`drawBrainPanel`) | 13-class citizen bank grew the frame to y=208, 32px past PANEL_Y=176 — THE MIND OF PINCHY printed over the crew strip | over the panel | **FIXED: bank pages at 7 (6 when paged), ..MORE row, whole panel ends above the fold**; NOW/ENGINE row added |
| MENU tab (drawPanel menu branch) | recipe rows unbounded — three owned kitchens print the books off-canvas; rent rows unbounded at max ownership | — | **FIXED: menu pages (second tap on MENU), rents collapse to one summed row when lots outnumber rows** |
| towns shelf (`slotMeta`/drawSaveScreen) | already capped 6 + "+N" | — | OK; portraits were crab-only → fixed via the one portrait path; `slotMeta` now carries culture and stops clamping a cultured color into the crab rack |
| dossier / diary | diary already pages; header name via raw `text()` | sits fully above the panel by design | OK; long-name headroom = LOW debt (name pools bounded) |
| manage card | fixed frame; SCHEDULE tab rows at 12 crew unverified | scrims the world, panel stays | **DEBT (named)**: stage manage-sched at 12 crew in the sweep — recipe: the staged-crew idiom from "the roster outgrows the panel", then `run("manage-sched-12", ...)` |
| report / departures | fitSmall discipline + canonical sweep (x) | full-screen owns the screen | OK |
| lab bench (sciFrame) | fitSmall throughout per its own comment | timeline draws via `drawCrab` (cultured ✓) | OK — CLOVER's crab face was the strip/card, not the bench |
| canonical sweep itself | **checks x only — every vertical overflow above was invisible to it** | — | staged scenario adds x AND y checks at 12 crew; extending y to the whole canonical sweep = **DEBT (named)**, may flag latent near-bottom prints |

## THE RULE, written down and enforced

**One reading surface owns the screen at a time.** Every full-screen card
already deferred the follow card and brain panel by one predicate; it is now
`bigCardUp()`, the panel's tabs/tiles/shop rows defer by it too (draw AND hit
test — nothing invisible answers), and the status row stays because it is
chrome, not reading. Manual: second tap on CREW (or `v`) pops the selector
down to a slim CREW ^ handle; selection survives dock/undock.

## The pig faces — one portrait path

The world's `drawCrab` learned cultures in the settlers slice; the little
portraits didn't. `personaArts(p)` mirrors its dispatch (orphan clamp
included, culture-namespaced 2x cache key) and `blitPersonaIn` centers a
foreign body in any frame; crabs keep their hand-tuned pixels via the null-cul
branch. Threaded: crew strip, crew follow card, the record's header, the towns
shelf. Cultured hat fit = named debt (body only in small portraits; drawCrab
remains full fidelity). Receipts: CLOVE and BRISTLE both wore crab faces on
the live repro (2026-08-23-clove-before.png) and wear their own
(2026-08-23-clove-after.png); the staged pig KRILL pages in on page 2
(2026-08-23-crew12-page2.png).

## The silent lab

`sciRun` lives a month in one blocked task; the audio clock barely moves, so
every `sfx.coin()` of the month lands on one `AC.currentTime` and discharges
as a blast at the yield. `beep()` now drops (never defers) under `SCI.run`;
the completion ding fires after run clears and survives. Proven in-browser on
the repro URL: `window._beeps === 1` after a 30-day run. Engine-owned moments
(`sleepOnSand`, the citizen rail) stamp the view cache so the inspector's NOW
row can say ENGINE when the script took the wheel without a think.

## Gates

- Focus manifest (`experiments/crewux-focus.json`, 3 arms by name filter):
  **3/3 green** at 7f708a1.
- Mutations, all three armed in one commit (d076bae), each red BY NAME across
  two runs: "selecting crab 12 did not snap the strip to her page (page=0)";
  "one reading surface owns the screen" FAIL; "the lab scheduled 3 beeps
  mid-run - the burst is back". Reverted at a186b63.
- Full suite + MCP battery on the final rebased SHA: see the report (run at
  gate time on the cluster).
- Substrate quirk observed twice, out of scope: a 3-arm focus run reports a
  "/2" merged count with one receipt missing per run; the missing arm's
  verdict appears on the rerun. Worth a kube.mjs look.

## Staging lessons (paid for in five browser attempts)

The boot pre-loads the town BEHIND the title screen, so every page unload
autosaves the in-memory town — localStorage staging must neuter the staging
page's pagehide/visibilitychange handlers before reloading, or the stage is
silently clobbered (the slot-1 lesson, rediscovered from the outside).

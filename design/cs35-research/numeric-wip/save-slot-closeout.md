# THE SLOT IS EARNED, NOT ASSUMED — the save-clobber verdict (2026-08-22)

The neuro-ladder pass recorded a suspicion it did not chase: "reloading the
URL may overwrite save slot 1 even without playing." Chased. **The bug is
real, on two live paths, and it was the worst bug on the live URL** — a
player's save could be destroyed by opening a link and closing the tab.

## The mechanism, one sentence

`beforeunload` and `visibilitychange` both call `save()`, `save()` writes
**whatever town is in memory** to `activeSlot` — and the town in memory is
not always the slot's town.

## The two damning paths, byte-verified in a real browser (port-guarded)

| experiment | staged in slot 1 | action | slot 1 after (PRE-fix) |
|---|---|---|---|
| A | valid day-4 town, 22,400 B, hash 506173478 | open bare `?lab`, touch nothing, leave | **day-1 lab town, 5,115 B** — save destroyed |
| C | its corrupt twin (personas emptied; every ledger recoverable), 18,587 B | open plain URL, leave | **day-1 fresh town, 5,099 B** — recoverable save destroyed |
| B (control) | valid day-4 town | open plain URL, leave | same town re-saved (day 4, $192.84) — autosave working as designed |

Path A: `SCI.run` guards saves only *during* a run/shuttle; on the lab's
setup form and after a finished run it is false, so the unload autosave
wrote the lab's boot town over the player's slot. Path C: a rejected
envelope (`load()` returns false) births a fresh town that then autosaves
over the very save it failed to load — and `visibilitychange` means a mere
tab-switch sufficed. The neuro fork's fixture clobbers were the same
mechanism seen from the harness side.

## The fix: ownership

`slotOwned` — the session must EARN the slot before `save()` writes it:

- `load()` succeeds **from a slot** (`envIn == null`) → earned. A shuttled
  envelope (the lab's keyframes) earns nothing.
- boot finds the active slot **empty** → earned (a first town must still
  autosave; the overcorrection is as real a bug as the bug).
- the player's deliberate acts → earned: pressing START on the intro
  (covers the rejected-envelope case — choosing a fresh town is consent),
  and the lab's PLAY THIS DAY (`sciPlay`, whose toast already says
  "YOURS NOW").
- a lab boot and a rejected-envelope boot earn **nothing** and write
  nothing, however the tab closes.

One guard point: `save()`'s early return grows `|| !slotOwned`. The other
slot writers were audited and are safe by construction: `migrateLegacy`
(writes only into a proven-empty slot 1) and the import path (writes to an
explicitly chosen slot).

## Post-fix, same browser experiments

A: the day-4 save survives bare-`?lab`-and-leave **byte-for-byte**
(22,400 B). C: the corrupt twin survives open-and-leave with its exact
hash (-1303927112). First-run control: empty slot still receives the
day-1 town on leave. Zero game-originated console errors.

## The regression pins (tools/suite.mjs, "save guard: ...")

Three scenarios, staged through `createSim({storage, search})` — simlib
grew a `search` param so a scenario boots `?lab` the way a browser does.
Mutation-tested by removing the guard: the lab pin fails with *"the lab
buried slot 1: the staged day-3 town became day 1"* and the
rejected-save pin with *"the fresh town buried the rejected (recoverable)
save in slot 1: 5099 bytes over 16679"*; the first-town control stays
green under the mutation, as it should (an earned empty slot writes
either way).

## Noted, out of scope

- The harness forces `screen = "play"` after boot, so lab-screen state is
  not headlessly assertable; the scenarios assert `LAB` and the writes.
- `gameOver → newGame()` clears the ACTIVE slot; in a lab town that
  failed before PLAY THIS DAY this would clear a slot the session never
  owned. The click routing makes it hard to reach (the sci screen handles
  its clicks first) — an ownership check inside `newGame` would be belt
  and braces for a future pass.
- The PLAY THIS DAY semantics (claiming the active slot, potentially over
  a real town the player loaded earlier that session) were shipped
  deliberately with their toast; unchanged here, flagged for the owner if
  slot-courtesy (first empty slot) is ever wanted.

# THE LOADER RESET — what outlives a town, and why it must not

Landed on the science bench's finding: repeated `load()` calls without an
intervening tick leak the previous town into the next one. Normal play loads
once, so this was never a live player bug; it was a correctness hole under
every caller that loads more than once — the bench, the MCP server, any future
replay or test harness.

## THE INVENTORY

Produced by `tools/loadaudit.mjs`, which is the deliverable as much as the fix
is: it harvests every module-scoped `let`/`var` from game.js (plus the typed
planes, which are `const` bindings over mutable buffers and so invisible to a
source scan), loads one envelope onto a pristine world and onto a world that
has lived seven days, and diffs all of them. **169 names scanned, 35 differed.**

The bench's own lesson is why this is empirical rather than reasoned: it had
checked draws, positions, needs, ledgers, furniture and pool slots, found them
identical, and still diverged on the twenty-four-thousandth tick inside one
visitor's mind. "Identical by every measure I could name" is not a proof, so
this does not name measures — it enumerates them.

Grouped, with what each one is:

| group | count | names |
|---|---|---|
| **agent pool** | 4 | `poolTop`, `poolFree`, `POOL_LIVE`, (`POOL_MARK`) |
| **position/need/counter planes** | 20 | `PXQ` `PYQ` `PTXQ` `PTYQ` `PWYQ` `PMXQ` `PMYQ`, `VHUN` `VTHI` `VDIRP` `VBOR` `VTIR` `VSTCP`, `C_PAT` `C_CLM` `C_SHW` `C_DIN` `C_WAI` `C_STL` `C_TBL` |
| **furniture** | 2 + wrappers | `FT_FLG`, `FT_DSH`, and each table/stall's `_occ`/dirty/cleaning/dishes |
| **bodies** | 3 | `customers`, `floaters`, `npcs` (via `initNpcs()`) |
| **session ledgers** | 9 | `earnHist`, `qSeqN`, `today`, `report`, `reportT`, `depart`, `departT`, `departPage`, `departQ`, `bankHorizon` |
| **per-day observations** | 2 | `hoursObs`, `_wasOpen` |
| **memo caches** | 9 | `_cotRoll`/`_cotKey`, `_offMap`/`_needCover`/`_offStamp`/`_offGen`, `_acCache`/`_acGen`, `_bands`/`_bandsKey` |
| **clocks** | 4 | `T`, `dtT`, `viewT`, `saveT` |
| **view scraps** | 3 | `toast`, `hireCard`, `sel` |

### What was leaking beyond the three the bench already knew

The bench had found the pool, the furniture bits and the ledgers. The audit
added, among others: **every memo cache** (each is keyed on state the reset
moves, so a stale entry answers for the old town until its key happens to
change), **`hoursObs`/`_wasOpen`** (per-day boundary observations, explicitly
transient and never in the envelope), **`bankHorizon`**, **`today`'s day log**,
the **departure card** state, and **`T` itself** — the master tick, which is
the stamp on half the memo keys and on every `earnHist` row.

Also worth recording because it is *not* on the list: `customers` was already
half-handled — `load()` filters visitors out but keeps crab customers, so a
queue from the old town survived into the new one.

## THE RESET SEAM

One function, `resetSession()`, called from `load()` immediately after the last
`return false` and before the first write — so a rejected envelope leaves the
town on screen untouched, and an accepted one ends the previous town then and
there.

**The contract is written into the function**: if you add module state that a
town writes and the envelope does not carry, it belongs on that list. One named
place beats scattered clears precisely because the next person adding a `let`
needs somewhere obvious to register it.

Two judgement calls inside it:

- **The planes are zeroed even though `poolAlloc` initializes every slot it
  hands out.** Belt and braces on purpose: a never-allocated slot holding the
  last town's grains is unreachable but not *obviously* unreachable, and these
  are bytes the kernel reads directly. 640 bytes a plane.
- **`window._stats` is NOT reset.** It is the harness's observation channel,
  not the town's state, and the loader has no business zeroing counters the
  measuring tools own. The bench clears it for itself, and that is the one line
  of its old sweep that stayed.

## WHAT CAME OUT OF THE BENCH

`sciShuttle`'s entire sweep — pool, free list, live bits, furniture bits,
`earnHist`, `qSeqN`, `customers`, `floaters`, `initNpcs()`, the trailing
`poolReap()` — is gone, replaced by the `load()` call it always wrapped. A
workaround kept on top of a fix is how the next person learns the wrong lesson.
Only the `_stats` clear remains, for the reason above.

## THE STREAM, AND WHY IT IS NOT IN THE RESET

After the fix the audit still showed the crabs differing between a clean load
and a lived-in one — every crab's `animQ` and `quipT`, both drawn at creation.
The cause is not leaked state: **the sim stream is the HOST's**, not the
town's (`_rtap === null` means the context's own `Math.random`), so a town
loaded at a different cursor position mints different guests however clean the
loader is. Every later draw inherits the shift — the conditional-draw lesson
from slices 3, 4 and 5, arriving from a new direction.

`load()` deliberately does not reseed it. Doing so would make a save replay
identically no matter what the session did before loading it — arguably a
better property, and one a scrubbing lab would like — but it is a **behaviour
change on a path normal play does exercise** (loading a save from the menu
after playing), and this pass is a correctness fix that must not move live
behaviour. **It is an owner's call, and it is the natural next question here.**
The game already has the mechanism (`sciSeedStream`/`sciFreeStream`).

Both proof scenarios therefore pin the stream before loading, which isolates
exactly what `load()` owns — the thing under test.

## THE PROOF

Four scenarios, and the shape of them is itself the record of two vacuous
mutations honestly escalated rather than claimed.

1. **`load: a town loaded onto a lived-in world is the town loaded clean`** —
   the trajectory proof. Loads one envelope onto a pristine world and onto
   seven lived days, runs both three days past the landing, compares the full
   fingerprint. *Mutation (pool bookkeeping leaks): fails with the bench's own
   symptom, `agent pool overflow at 160`.*
2. **`load: the same envelope lands the same way however often you land it`** —
   the scrub's shape. Twenty landings into one world; the twentieth must equal
   the first, and `poolTop` must not have grown a townsful of slots per
   landing. Twenty is not arbitrary — 160 slots is where the overflow bit.
3. **`load: the new town's desk is clear of the last town's books`** — a DATA
   pin, escalated. Leaking `earnHist` moves neither trajectory scenario (the
   rival prices her ambition only when she gets around to it), so this reads
   the ledgers directly. *Mutation: fails with `earnHist 311 row(s)`.*
4. **`load: the furniture forgets its guests, and the BIT is where it forgets`**
   — the other escalated data pin, and the more interesting one. Leaking the
   occupancy bit moves nothing measurable in three days, because a town
   re-derives who is sitting where fast enough that the books come out level.
   It reads `FT_FLG` directly and **not** `w.occupant`, because the getter is
   `(FT_FLG[fid] & 1) ? this._occ : null` — clearing the wrapper alone leaves a
   morning opening onto a hotel only the kernel can see as full. *Mutation:
   fails with `the furniture kept 3 guest(s) the new town never seated (7 bit(s)
   set, 4 guest(s) holding)`.*

**Two mutations proved vacuous against trajectory assertions and became data
pins rather than claims.** That is the standing lesson applied twice in one
landing: when the instrument cannot see the mechanism, change the instrument.

## THE GATE

- Suite **279/279 exit 0 kernel-armed** (32.5s) and **279/279 exit 0 unarmed**
  (53.6s), main realm.
- **Frozen fingerprints unmoved**, both backends:
  `1337:10390:11! 4242:4990:13 909:10190:11! 31:400:12!` — the base tip's pin
  exactly.
- **16-seed × 30-day matrix byte-identical** to `6902de1`, diffed by running
  both trees rather than inferring it.
- Conservation soak exact: 191 movements, all three doors.
- Kernel/JS agreement, shared-cursor and draw-count pins all green — the planes
  and the cursor are shared state, and resetting one side only is exactly what
  those scenarios exist to catch.
- Browser, port-guarded on 8963: kernel armed, zero console errors, `?lab`
  scrubs (day 1 `$15000 / rep 30000 / 7 crabs` ⇄ day 7 `$17014 / rep 95800 /
  8 crabs`), and thirteen consecutive landings on day 1 leave `poolTop` at 7 —
  the overflow the bench worked around, gone at the source.

# THE STREAM A SAVE CARRIES — the cursor is town state

Owner ruling, 2026-08-22: *"yeah we gotta definitely keep the same seed, seems
obvious."* The loader-reset pass left this as the open question it could not
take on its own authority, because it changes behaviour on a path normal play
exercises. It is now taken.

## WHAT WAS WRONG

A save described a town's PRESENT but not its FUTURE. The sim stream was the
HOST's — the browser's bare `Math.random`, or the harness's seeded one — so
reloading a town after playing on resumed from wherever the session had left
the cursor. Same town, different guests, different rolls, for no reason the
player could see or name.

The loader-reset pass found thirty-five module-scoped things that leaked across
a load and fixed them by making `resetSession()` own them. The cursor is the
same class of thing and the last one outstanding.

## WHAT THE ENVELOPE NOW CARRIES

| field | meaning |
|---|---|
| `rs` | the sim stream's cursor, one u32 — written ONLY when the town owns its stream |
| `sd` | the founding seed where the town has one (a lab recipe), for provenance |

`rs` is conditional on purpose. A town still on the host's stream has no cursor
to write, and inventing one from a generator you cannot read would be a lie the
loader would then act on.

**`SAVE_VER` is UNCHANGED at 3.** Both fields are additive and optional, every
older save still loads, and the version gate (`_ver > SAVE_VER` rejects) needs
no movement. A bump would have bought nothing and cost every save in the wild a
migration path.

**Old saves get a DERIVED cursor**, hashed (FNV-1a) from the envelope's own
stable content — day, clock, coins, rep, roster size, persona names. The
guarantee for a pre-ruling save is not "the future it would have had" (that
future was never written down) but **"the same future every time"**, which is
what makes an old town replayable at all. A fixed constant would also have been
deterministic, but it would give every old town in the world one shared future,
and towns differing is the nicer half of the deal.

## BOTH BACKENDS, ONE CURSOR

`simCursor()` / `simStreamAdopt()` are the one door. Unarmed, mulberry32's whole
state is one i32 living at module scope (`_rs`) rather than inside a closure —
for the single reason that the envelope has to read it. Armed, the same logical
cell is `KRNG[0]`, a `Uint32Array` view over kernel memory at 26624, which is
where kernel phase 2 put the shared cursor. Adopting writes whichever is live,
so the two backends cannot walk different sequences; the shared-cursor,
draw-count and kernel-agreement pins are the referees and all three stay green.

`sciSeedStream` is now one line over `simStreamAdopt` — a recipe's seed IS its
opening cursor, which is the same operation the lab was already performing.

## THE VIEW STREAM IS NOT IN THIS, AND MUST NOT BE

`vrand` — title wander, music shuffle — is SESSION state, not town state. It is
not saved, not restored, and a comment at the restore site says so. Attract
mode repeating each boot is tradition, and a save has no business dictating what
the title screen does. The contract is pinned by a scenario, not just a comment.

## THE ORDERING BUG THIS ALMOST SHIPPED WITH

The adopt was first written immediately AFTER `resetSession()`, which reads
correctly and is wrong: **`resetSession()` rebuilds the townsfolk through
`initNpcs()`, and `initNpcs()` draws.** Adopted afterwards, those crabs were
still minted from wherever the session left the host's cursor — the entire bug,
surviving inside its own fix, and passing a casual read.

Caught by the scenario rather than by inspection: the churned branch kept
diverging with the cursor provably identical at the moment of the load. The rule
generalises, and it is the loader-reset lesson from a new angle: **restore state
before the first thing that READS it, not merely before the first thing you
happen to notice.**

## THE OTHER HALF: PERSONAS WERE ON THE HOST

`makeCrabPersona`'s rng defaulted to `Math.random`. That was the same cursor
only for as long as the sim stream WAS the host's. Once a save carries its
cursor, a persona minted after a load would still have drawn from the session's
leftovers — so a reloaded town hired different crabs depending on what you did
before loading it. It now defaults to `srand`, resolved at call time (crabs.js
evaluates first, but nobody mints a persona until game.js exists).

Fingerprint-neutral by construction: before the change both consumers shared one
cursor, after it they still do.

## THE PROOF

Four scenarios; the fourth is an honest escalation.

1. **`stream: a saved town's future does not depend on what you did after
   saving`** — the headline, and the property the owner asked for. One save,
   two futures: loaded straight, and loaded after the session has lived six days
   and drawn five hundred times. *Mutations: removing the adopt fails with `the
   session leaked into the town's future: coins 12800 vs 13965`; moving the
   adopt back after `resetSession()` fails the same way — the ordering bug has
   its own biting test.*
2. **`stream: a save from before the cursor still lands the same way twice`** —
   an envelope with `rs`/`sd` deleted, loaded twice against different session
   states. *Mutation: removing the adopt fails.*
3. **`stream: the view's own stream is the session's, and a save does not touch
   it`** — a DATA pin: `_vs` must be untouched across a load while `_rOwned`
   becomes true. Asserted as data because the view stream drives nothing a
   headless run can watch walk around.
4. **`stream: a persona is minted from the TOWN's stream, not the host's`** — a
   DATA pin, **escalated rather than claimed**. Reverting `makeCrabPersona` to
   `Math.random` does NOT move the trajectory scenario (three days after a load
   mints no new hire), so the mechanism became the assertion: minting must move
   the town's cursor. *Mutation: `minting a persona drew nothing from the town's
   stream (cursor stuck at 3435455474)`.*

## THE GATE

- Suite **283/283 exit 0 kernel-armed** (71.9s) and **283/283 exit 0 unarmed**
  (196.6s), main realm.
- **Frozen fingerprints unmoved, both backends**:
  `1337:10390:11! 4242:4990:13 909:10190:11! 31:400:12!` — the base tip's pin
  exactly. Nothing was owed and nothing was re-baselined: boot is untouched, so
  a town that never loads draws exactly what it always drew.
- **16-seed × 30-day matrix byte-identical** to `e5d03c1`, diffed by running
  both trees: same eviction list `9,9,10,11,11,11,11,12,12,12,12,13,13,14,14,15`
  (median 12), same `lifetime $54433`, same every aggregate.
- Kernel/JS agreement, shared-cursor and draw-count pins green.
- Browser, port-guarded on 8971: kernel armed by default, `?lab` boots with the
  town owning its stream and a readable cursor, **zero console errors**,
  screenshot at `devlog/img/2026-08-22-stream-cursor.png`. Deep play-through
  verification lives in the headless scenarios, which churn the session far
  harder than a browser tab can be driven.

## WHAT IS DELIBERATELY NOT DONE

**Boot still uses the host stream.** A brand-new town has no save to replay, so
it needs no cursor of its own, and seeding at boot is a much larger blast
radius: the world is constructed above the tap's own declaration, and an early
seed splits the sequence in two unless every consumer is unified first (the
attempt, and its measurements, are worth repeating before anyone tries again —
`var _rtap = null` executes AFTER the world is built and silently wipes an early
tap, and `initNpcs` draws fifteen times before any of it).

The consequence is small and worth stating plainly: a save written by a town
that has never been loaded carries no `rs`, so its FIRST load derives a cursor
rather than resuming one. From that load onward the town owns its stream and
every later save round-trips exactly. If the owner wants a fresh browser town to
own its stream from its first breath — so that even its first save replays its
original future — that is the follow-on, and it is a bigger landing than this
one.

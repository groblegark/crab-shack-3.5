# THE ARCADE THAT ISN'T BUILT YET — the wander label stops naming it (kd-xFaXxV413k)

**Landing receipt** for the merge of `cs-arcade-window-label` (gated tree
`61416e3`) into main. Reported by Matt in Slack from a deployed build: *"cs 3.5
bug; crabs watch window of nonexistent arcade."*

## The defect

`WANDER_SPOTS` (game.js) is a static table of idle-hands landmarks with **no
existence check**. Six of its seven entries are permanent town furniture — the
town tap, the notice board, two tide lines, the sea wall, the pier rail. The
seventh is not:

```js
{ x: 1578, label: "THE ARCADE WINDOW" },   // nose to the glass, no token in pocket
```

The arcade is a **$650 shop rung**. `bizUnlocked("arcade")` is false until
`UPS.arcade.lvl > 0`, and `drawWorld` draws a business only when it is unlocked
(`for (const key of Object.keys(BIZ)) if (bizUnlocked(key)) drawBusiness(key)`),
so before that purchase there is **no building at 1620–1800 at all** — it is the
EMPTY LOT the shop tooltip itself names (`UP_HELP.juicebar`: "THE EMPTY LOT DOWN
THE PROMENADE BECOMES A SECOND BUSINESS OF YOURS"). The table named the building
regardless, and `crabStatus` printed that name:

```
WANDERED OFF TO THE ARCADE WINDOW   /   WATCHING THE ARCADE WINDOW
```

**Reachable on DAY ONE**, which is why it is what a player sees first. The shack
spans `x0 1220 .. x1 1560` and `WANDER_PX` is 340, so *every* shack post reaches
x 1578; `WANDER_AT` 0.15 and the `BORED_IDLE` trickle exist precisely to get a
crab restless on day 1. So the first bored crab of a new save stands on bare sand
under a follow card naming a building the player has never seen.

## The fix — the lie was the LABEL, not the landmark

The x is a legitimate patch of promenade either way, and a crab staring at the
lot where the arcade *isn't* is the CURE LEDGER read out loud — the same register
as the existing `I'D KILL FOR AN ARCADE` quip. So the entry carries an existence
key and a fallback, and `wanderLabel()` resolves it **at read time**:

```js
{ x: 1578, label: "THE ARCADE WINDOW",     // nose to the glass, no token in pocket...
  needs: "arcade", alt: "THE EMPTY LOT" }, // ...and the bare lot before there is any glass

function wanderLabel(w) { return w.needs && !bizUnlocked(w.needs) ? w.alt : w.label; }
```

**Live rather than pick-time** because a wander lasts `WANDER_DWELL` + up to 10s,
comfortably long enough for the player to buy the arcade while a crab is stood in
front of it — a label frozen at pick time would leave that crab WATCHING THE
EMPTY LOT with the machines lit up behind it. The rival stakeout builds its own
label (`eyeing`) and carries no `needs`, so it falls through unchanged.

## Why not filter the spot out — it would have been a BALANCE change

Deleting the landmark when the arcade is unbuilt shrinks `near` for exactly the
posts that need it most. A crab on the shack's pass (post 1560) would keep only
the pier rail; one mid-shack would keep only a tide line; and a post that falls
to **zero** gets `wanderSpot() -> null`, which is the day-1 freeze that
`WANDER_AT` and `BORED_IDLE` exist to prevent. It would also move both `srand()`
draws inside `wanderSpot`, turning a cosmetic fix into a change owing a headless
matrix.

`needs`/`alt` touches **no draw and no Q20 field**: `near` is unchanged, both
`srand()` calls are unchanged, no need bar moves. Sim-inert by construction —
which is what a maintenance-only tree (CLAUDE.md, CS4-01a) wants from a cosmetic
fix. The gate pins that claim rather than asserting it: `near.length == 2` either
side of the purchase.

## The gate

New scenario, in the idle-hands family:

> `idle hands: an unbuilt arcade is THE EMPTY LOT on the follow card, and buying
> it re-labels the same wander`

It asserts on **`crabStatus`** — the string the player actually reads — not on
`wanderLabel`, because the defect was never in a helper; it was in what the
follow card told the player about the world. Both directions are checked across a
purchase applied to **one unchanged wander object** inside a single realm call
with no frame stepped in between (so the crab cannot be handed an order, which
ends a wander, in the gap):

| state | `bizUnlocked("arcade")` | follow card |
| --- | --- | --- |
| fresh `idleTown` | `false` | must contain `THE EMPTY LOT`, must **not** contain `ARCADE` |
| after `tryBuy("arcade")` | `true` | must contain `THE ARCADE WINDOW` |

**Verified to FAIL on the pre-fix tree**, with the reported symptom verbatim:

```
FAIL  idle hands: an unbuilt arcade is THE EMPTY LOT on the follow card, ...
      a crab watched a building that is not in the world: WATCHING THE ARCADE WINDOW
```

### One existing gate had to change

`social destination: the wander pick STEERS toward company` tallied its
distribution by **label** (`tally[w.label]`, keyed on `"THE ARCADE WINDOW"`) on
an `idleTown` fixture that has bought nothing. That made a cosmetic string
load-bearing for a probability assertion. It now tallies by **x** (`tally[w.x]`,
keyed on `1578`) — the right key for a distribution gate regardless of this fix.

## VERDICT

```
node tools/kube.mjs run experiments/suite-330.json --ref 61416e3 --wait
kube: MERGED SUITE VERDICT: 916/916 passed
```

**GREEN 916/916**, 24/24 arms `exit=0`, both backends — **js 458 + wasm 458**,
12 slices each, 424s wall. The +2 over the previous trunk verdict (914/914) is
this receipt's new scenario, once per backend.

Receipts: `js-0..11.json`, `wasm-0..11.json` in this directory.

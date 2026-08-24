# The float-aim fix was right, and it was red

**Date:** 2026-08-23 (late)
**Status:** reverted from the publish tree; the fix and this finding go back to
tomorrow's queue together.

## What happened

`2fe4ec4` (cherry-pick of `77d320a`) rounded `vsepPush`'s target:

```js
-  if (k.target != null) k.target += (x1 - x0) / Q8;   // exact: Q8 is a power of two
+  if (k.target != null) k.target = Math.round(k.target + (x1 - x0) / Q8);
```

The diagnosis behind it stands: that was float residue living in state, and
"exact in floating point" is not the same claim as "integer". Under the
integer-determinism doctrine the fix belongs in the game.

It went in on a cherry-pick **without a gate of its own**, and it moved
behavior. The three resulting failures then rode unnoticed through three
further merges — `b20b497`, `9254340`, `1ae51ed` — byte-identical on both
engines each time.

## How it was caught, and how late

Not by the merges. Each merge's gate was red and was **read as green**: a
`648/648 passed` verdict from an earlier run at `79b5563` was carried forward
as though it covered the merges that came after it. The receipts on disk said
otherwise the whole time.

The lesson is not "run the gate" — the gate ran, three times. It is that a
verdict belongs to **one tree**, and a verdict quoted from memory is not a
receipt. Read the receipt for the SHA in hand, every time.

## The bisect

`experiments/redgate-bisect.json` — the three failing scenarios, js only
(both engines were byte-identical, so a second arm buys nothing). Grafted
onto each candidate with plumbing, so each probe is the candidate tree plus
one manifest file and no game file is touched:

| probe | tree | verdict |
| --- | --- | --- |
| `2479cb2` | published tip | **3/3 green** |
| `2fe4ec4` | the float-aim fix | **3/3 RED** |
| `494f96d` | merge on top | RED, inherited |

One commit, one hunk, all three failures.

## The three failures, and what each one is owed

1. `hours: defaults are behavior-identical (frozen day-2 fingerprint)`
2. `cultureways: a save without cultures changes nothing`

Both are frozen pins reading the same single drift — coins 17546→17628,
serves 44→43, till 22428→21443, REEF +2. A real behavior change is
*entitled* to move these. They need **re-authoring**, which is a deliberate
act, not a way to make red go away at the end of a night.

> **Matt, 2026-08-23, in the main conversation:** "we'll re author the frozen
> pins btw there"

Ruling: the pins get re-authored and the fix returns — this drift is
sanctioned, not a regression. Recorded by the orchestrator from Matt's own
words in the live thread; forks do not record operator rulings.

That settles 1 and 2. It does **not** settle 3, which is not a frozen pin —
see below.

Note for whoever does it: sampled day-3 crab positions are **byte-identical**
across the drift. That is what made me rule out `vsepPush` on first read, and
it was wrong — identical sampled positions do not mean identical
trajectories. Do not repeat the inference.

3. `rivalry: after a refusal she competes with the PLAYER'S OWN levers`
   — subassertion: *the player's own board does not move their own trade*

This one wants a human. It reads 454 / 498 / 508 drinks, which looks like a
price lever appearing where none should be. But the shares are
0.3809 / 0.3909 / 0.3872 — **non-monotone in cheapness**. A real price lever
is monotone; noise is not. The likely reading is that this is a
strict-equality invariant that is fragile to *any* trajectory perturbation,
in which case the **test** is what needs re-authoring, not the game.

Deciding which at 23:50 is how a wrong pin gets frozen into the record, so
it is not decided here.

## Open question for the fix's return

The fix needs to land eventually. When it does it needs, in this order:

- its own gate, on its own tree, read from its own receipt;
- a ruling on failure 3 — invariant or fragile test;
- the two frozen pins re-authored *after* that ruling, not before, since
  the ruling may change what the right numbers are.

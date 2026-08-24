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

**Correction, recorded because the first reading was wrong.** I initially
called this a strict-equality invariant and cited the *shares*
(0.3809/0.3909/0.3872) as evidence of noise. Both wrong. The assertion is

```js
const K = 30;
cheap.bar > mid.bar + K && cheap.bar > dear.bar + K
```

and the scenario's own note says the share metric "is gone". At
dear 454 / mid 498 / cheap 508 the arm fails because cheap clears dear by 54
but clears **mid by only 10** against K=30. The symptom is the *cheap end
thinning*, not a spurious price lever - a stronger candidate for a real
defect than the first reading suggested.

### The twelve-town pool, and its control

`tools/rivalpool.mjs` - the scenario's fixture verbatim in shape, twelve
towns, three prices, each with and without `window._novsep`.

| tree | dear | mid | cheap | cheap-mid | cheap-dear |
| --- | --- | --- | --- | --- | --- |
| green `6832160` | 685 | 727 | 781 | **+54** (pass) | +96 |
| fix `ebd4f0d` | 689 | 730 | 759 | **+29** (fail by 1) | +70 |
| green `_novsep` | 647 | 661 | 767 | +106 | +120 |
| fix `_novsep` | 647 | 661 | 767 | +106 | +120 |

**The control validates the instrument**: both trees return byte-identical
`_novsep` columns, because with the parting off the changed line never
executes. So the fix reaches this arm through the parting and nowhere else -
exactly the re-roll channel the personal-space episode documented.

Two further facts the totals hide:

- The parting itself *eats* the cheap end. Without it the margin is 106;
  with it, 54 on green. This arm's headroom against K=30 is thin by
  construction, and the parting is what thins it.
- The paired per-town difference between trees is **-2.1 drinks, sd 5.1,
  SE 1.5, t ~ -1.4** - not significant. Ten of twelve towns still favour
  cheap on the fix tree, and the largest single mover (seed 66, +10 -> +18)
  moves the *other* way.

So twelve towns cannot resolve K=30 either way: a ~2-4 drink-per-town step
under ~5 drinks of per-town noise. This is the same failure mode the note
already recorded when it demoted the dear end - "a pin on a ~1-drink-per-town
step under ~7-drinks-per-town re-roll noise pins the noise."

Rather than rule on a coin, the pool was widened to **forty-eight towns**
(`experiments/rivalpool48.json`), which puts SE under 0.75. Verdict below.

### The forty-eight-town verdict

| 48 towns | dear | mid | cheap | cheap-mid |
| --- | --- | --- | --- | --- |
| green `adf7216` | 2747 | 2841 | 3066 | **+225** (4.69/town) |
| fix `8d432f7` | 2760 | 2813 | 3032 | **+219** (4.56/town) |

Paired per-town change in (cheap-mid), fix minus green, n=48:

```
mean = -0.125   sd = 6.61   SE = 0.954   t = -0.13
```

**The fix does not thin the cheap end.** That is as close to exactly zero as
this instrument measures. The eight-town arm failed on a re-roll, and the
twelve-town read that looked like "one drink short" was noise measured
precisely.

## What landed

1. `2fe4ec4` **restored** - the fix was right, and is now measured to be
   harmless to the price lever.
2. Both frozen pins **re-authored** to the new trajectory, per Matt's ruling,
   each carrying the traced crossing (MISTY's first parting, day 1 T=2141,
   push -307 Q8 - the very push whose float residue the fix removed).
3. The rivalry arm's **cheap->mid comparison demoted to a WATCH**, keeping
   `cheap > dear + K` as the pin. This follows the precedent the arm's own
   note set for the dear end, and obeys its instruction not to widen K. The
   honest mutation (an inert player board, flat ~199/199/199) still fails the
   surviving pin, so the arm keeps its teeth.
4. `tools/rivalpool.mjs` + `experiments/rivalpool{,48}.json` kept as the
   standing adjudicator for the next time the parting moves. It will move
   again.

## The lesson worth keeping

Not "run the gate" - the gate ran three times and was red three times. The
failure was reading a `648/648` verdict from tree A and believing it about
trees B, C and D. **A verdict belongs to one SHA. Read the receipt for the
tree in hand, every time.**

Second: "positions are byte-identical, so it is not the parting" is not an
argument. Identical *sampled* positions do not mean identical trajectories.
That inference cost this investigation its first hour and sent it looking at
slop and E0, which were innocent.

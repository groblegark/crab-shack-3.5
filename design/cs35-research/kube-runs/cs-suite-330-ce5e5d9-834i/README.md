# cit_surf.go — the paddle-out is its own decision surface (kd-wfRu3aGnrK)

Step 3 of the SURF SPOT build (epic kd-vB0DTFmDzk; rulings kd-1JwKffV61F site,
kd-trKLfcDh5b Ruling B `SURF_X=1206`, kd-uYvJOxQcV8 gentle-decay crowding).

## What was wrong

The surf break shipped mid-beach earlier (branch cs-surf-break, merge f87785c).
But the surf *decision* still rode INSIDE the `cit_errand.candidate` ballot as a
registered candidate `take({ surf: true, need: "fun", ap100: 88 })`, classified by
`citErrandClass` as `"shack:fun"` — a class that is NOT one of the 13 on
`cit_errand.candidate`. Two measured harms followed:

1. **The LIVE crab brain was silenced on firing days.** `citEngineOwned`'s
   unmapped-class rail (`bp.classIdx[citErrandClass(e)] == null`) handed the WHOLE
   ballot back to the script whenever a surf candidate was present — exactly on the
   days the break fires.
2. **Paddle-outs booked as class 0 = "none".** `shadowCitObserve` scored a surf
   pick as `classIdx[...] ?? 0`, so a crab who paddled out never entered `s.acted`
   (the ruled honest metric, advice kd-acLf4tyS4N) — the surf surface could never
   become trainable.

## The fix

`cit_surf.go` is now its OWN `registerSurface` (mirrors `vis_depart.stay`,
kd-I9fjOBARav): engine-default script `citSurfEligible`, **NO trained artifact**,
doc string stating the trainable exit condition (`s.acted >= 10`, `ACTED_FLOOR=0.50`).
Surf is lifted out of the ballot the brain/shadow rank via `surfWins()`, but STAYS
in the script argmax so the **errand census fingerprint is unmoved** (cap 32, order
semantic — surf still index 2). **No 14th class** was added to
`cit_errand.candidate` (the loader pins `classes == surface N` in order; a 14th
class hard-fails the shipped artifact at boot).

Non-firing thinks are byte-identical; only firing-day surf-eligible LIVE-brain
thinks change (the brain now steers the errand ballot instead of being silenced) —
an INTENDED change, re-gated on the growth matrix below.

## Measured cost (isolated A/B, this tree vs ef04602), not asserted

`tools/suite.mjs` scenario, crafted deterministic idiom (find a firing day, force
non-duty non-sick crabs eligible, call `pickErrand`, count):

| | before (surf-in-ballot) | after (cit_surf.go surface) |
|---|---|---|
| surf-eligible thinks that **silenced the LIVE crab brain** | **42 / 42** | **0** |
| paddle-outs the shadow tally **booked as "none"** | **42 / 42** | **0** |
| crab still paddles out | — | yes (surfBallot ≥ 6, surfPicks ≥ 3) |

## Gates

- **suite-330 correctness gate: GREEN 906/906**, both backends (js 0–11 + wasm 0–11,
  all exit 0), at `ce5e5d9`. Receipts in this directory. The merge `6e95512` is
  byte-identical to `ce5e5d9` across the whole gate-relevant file set (gatecheck
  AMBER transfer — verified `git diff ce5e5d9 6e95512 -- <gate files>` empty).
- **Growth pillar A/B re-take** (firing-day live-brain picks changed → balance
  re-gate per CLAUDE.md). Isolated: control `9ce2ba5` (ef04602 = surf-in-ballot,
  brain silenced) vs after `5b06ed4` (+cit_surf surface). Default `CIT_DECAY_MUL=7`.
  Manifest `experiments/cit-surf-growth.json`, receipts in
  `cs-cit-surf-growth-{5b06ed4,9ce2ba5}-*`:

  | | growth pillar | per-block sb0/16/32 | baseline | surf activity |
  |---|---|---|---|---|
  | after (5b06ed4) | **11/48** | 1 / 5 / 5 | 0/48 | 123 rides, 31 town-firings, 23 crowded |
  | control (9ce2ba5) | **11/48** | 1 / 5 / 5 | 0/48 | 115 rides, 31 town-firings, 17 crowded |
  | **delta** | **0 towns** | identical | — | surf active both sides |

  The pillar is **town-for-town identical (delta 0)**, baseline floor holds, and
  surf genuinely fires in the matrix — the surface refactor is **growth-inert**.
  The fresh control (11/48 on current main) sits in the RULED band (7/48 final
  read / 12/48 calibration).

## Refs

- `ce5e5d9` — cit_surf.go code, suite-330 GREEN (this receipt).
- `5b06ed4` — ce5e5d9 + the growth manifest (A/B "after").
- `9ce2ba5` — ef04602 + the growth manifest only (A/B "control").
- `6e95512` — the `--no-ff` merge to main.

Site `SURF_X=1206` and the gentle-decay crowding curve were NOT touched.

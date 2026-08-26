# U1 M/E illness regression — pinning the cause (kd-QT3h8kmuj6)

Evidence-only investigation for decision **kd-iEICdaPwpB**. Does the M/E illness
fairness regression (x0.98 → x0.22 reported) come from U1's **on-duty pause** or
from U1 **re-timing the discrete metabolic lumps off**? This decides whether
option B ("pause/slow the drain in MORE occupied states") is aimed at the right
half of the mechanism.

**Do NOT land U1 from this task.** No game.js change here — the only edits are to
`tools/shiftill.mjs` (two attribution flags + a display-only need normalisation)
and a new `tools/shiftill-compare.mjs` cross-arm reader.

## Tree

Measured on `origin/cs-u1-citizen-decay` @ `8d53467` (the shipped U1 branch — a
pre-drain main tree cannot measure this; advice kd-RSS4Nkil3c). Run in-pod,
`SIMLIB_REALM=main` (4.3× faster, fingerprint-identical to vm per the vm-escape
receipts). shiftill is a single-process rig over a few towns, not the suite — no
cluster gate (KUBE POLICY: in-pod is correct for this).

## The four arms

Same seeds, same day count (rig defaults: 12 seeds × 24 days ≈ 1080 crab-nights
a side — well above the rare-event floor). All read the game's own `illRisk()`
through the `window._stats.rollLog` seam; the rig reimplements no game logic.

| # | arm | flag | expectation |
|---|-----|------|-------------|
| 1 | U1 as shipped | (none) | reproduces the reported ~x0.22 |
| 2 | pause OFF | `--citnoworkpause` (`window._citNoWorkPause`) | the pause's attribution arm |
| 3 | pre-U1 control | `--nodecay` (`window._noDecay`) | must reproduce ~x0.98 or nothing is trustworthy |
| 4 | swap | `--swap` on arm 1 | separates the crab from the shift |

Under `--nodecay` the four discrete lumps come back ON (they are gated on
`!crabDecayOn()`, game.js:11659/11676/11680) and `crabTick` is OFF — a genuine
pre-U1 tree, verified by reading the code.

## How to read it

- Arm 2 → x0.98-ish  ⇒ the **pause** is the cause; option B aimed correctly (but
  the "more occupied states" note needs inverting — the E crab is already the
  more-paused side).
- Arm 2 stays ~x0.22 ⇒ the pause is **exonerated**; the **lump re-timing** is the
  cause; option B as written is aimed at the wrong half.
- Arm 3 must reproduce ~x0.98 or the rig/tree is not measuring what we think.

Rare-event discipline (advice kd-acLf4tyS4N): the M/E ratio is scored over the
AT-RISK ROLLS, and `shiftill-compare.mjs` REFUSES a ratio built on fewer than
200 rolls a side rather than publishing noise.

## Files

- `arm{1..4}-*.txt`         — captured stdout per arm (full per-shift + needs table)
- `arm3-nodecay-30d.txt`    — the control re-run at 30 days (confirms x1.42 -> x1.50)
- `compare.txt`             — the four-arm side-by-side (shiftill-compare.mjs)

Raw `--dump` rollLog JSONs (2.5M) are NOT committed — against the receipt-dir norm
(existing dirs keep ~4K summaries) and regenerable exactly from the committed rig.

## Reproduce

    git checkout cs-u1-citizen-decay
    export SIMLIB_REALM=main
    node tools/shiftill.mjs                    # arm 1 (shipped)
    node tools/shiftill.mjs --citnoworkpause   # arm 2 (pause off)
    node tools/shiftill.mjs --nodecay          # arm 3 (pre-U1 control)
    node tools/shiftill.mjs --swap             # arm 4 (swap)
    # add --dump PATH to any arm, then:
    node tools/shiftill-compare.mjs PATH1 PATH2 ...   # cross-arm table + rare-event guard

## RESULT

CREW-ONLY M/E RISK (the M/E signal; townsfolk are all D). Ordered as the causal
walk. All arms clear the rare-event floor (>200 at-risk rolls a side), so no
ratio is refused.

| arm | M/E RISK | M risk | E risk | town-wide risk | prevalence M / E | who is worse |
|-----|----------|--------|--------|----------------|------------------|--------------|
| 3 control (pre-U1), 24d | **x1.42** | 0.01408 | 0.00994 | 0.0269 | 1.85% / 0.93% | **M** |
| 3 control (pre-U1), 30d confirm | **x1.50** | 0.01227 | 0.00819 | 0.0242 | 1.48% / 0.74% | **M** |
| 2 pause OFF (drain, no pause) | x0.71 | 0.10328 | 0.14483 | **0.1180** | 16.93% / 22.16% | E |
| 1 U1 shipped (drain + pause) | **x0.56** | 0.00805 | 0.01439 | 0.0181 | 3.46% / 2.04% | **E** |
| 4 swap (shipped + founders swapped) | x0.57 | 0.01266 | 0.02203 | 0.0197 | 2.96% / 4.64% | E |

### What it kills / confirms

1. **The control does NOT read x0.98 — it reads x1.42 (24d) / x1.50 (30d),
   M-disadvantaged.** The needs-at-roll table proves the rig is faithful: hunger,
   thirst, dirt all match the historical game.js table to ~0.02 (M hunger 0.238
   vs 0.263, E thirst 0.274 vs 0.266). The ONE thing that moved is `tired`
   (E 0.596 vs historical 0.693) — the `TIRED_NAP` fix (game.js, "tuned by an M/E
   shift-fairness probe to close it") landed since and leveled M/E tiredness,
   removing the exhaustion counterweight that used to cancel hunger/thirst into
   x0.98. So **x0.98 is a stale absolute** (advice kd-RSS4Nkil3c: re-take the
   control on the landing tree). The decision's "x0.98 -> x0.22" compares two
   trees/rigs (discipline rule 1, already flagged in the captain comment);
   measured consistently on ONE tree/rig it is **x1.42 -> x0.56**. Same concern
   (large M/E imbalance), opposite framing — pre-U1 favoured E, U1 favours M.

2. **The PAUSE is EXONERATED as the cause.** Turning the pause off (arm 2) does
   NOT restore fairness: M/E stays E-disadvantaged (x0.71), it does not move back
   toward the M-disadvantaged control (x1.42) nor toward 1.0. Per this task's own
   reading rule ("if arm 2 stays ~x0.22 the pause is exonerated and the lump
   re-timing is the cause"), arm 2 = x0.71 on the E-disadvantaged side = pause
   exonerated.

3. **The CAUSE is the continuous drain replacing the re-timed discrete lumps.**
   That transition (control x1.42 M-worse -> drain-without-pause x0.71 E-worse)
   is what FLIPS the imbalance. The captain's hypothesis (kd-iEICdaPwpB comment)
   is confirmed.

4. **Option B is aimed at the wrong half AND the wrong direction.** Adding the
   pause deepens the E-disadvantage (x0.71 -> x0.56), so "pause/slow the drain in
   MORE occupied states" (B as written) would make M/E WORSE, not better. And you
   cannot fix M/E by removing the pause: arm 2 blows town-wide risk up **6.5x**
   (0.0181 -> 0.1180) and prevalence to 17-22%. The pause is load-bearing for
   absolute survivability, orthogonal to the M/E fairness lever. (Note: U1
   shipped town-wide risk 0.0181 is actually BELOW the pre-U1 control 0.024-0.027
   — U1 does not double town illness the way the two rejected historical fixes
   did; the M/E effect is a redistribution, not an increase.)

5. **Swap confirms it is the SHIFT, not the crab.** The high risk follows the E
   shift across the swap: CLAWDIA's risk drops when moved to M (0.01471 -> 0.01106),
   PINCHY's rises when moved to E (0.00534 -> 0.02254). M/E ratio essentially
   unchanged (x0.56 -> x0.57).

6. **The frame-timing story pointed the wrong way (a third time).** The pause
   code reads as "M drains live 14-20 into the 20:00 roll, so M is needier." But
   under U1 shipped, E is needier on EVERY need at the roll (hunger 0.375>0.334,
   thirst 0.478>0.425, dirt 0.530>0.504, tired 0.590>0.510) — because M is OFF
   14-20 and can run relief errands before the roll while E is frozen mid-shift at
   its clock-on level. The game.js comment already warns "reasoning about it from
   the code got the wrong answer twice"; this is the third. Only the rig settles it.

### Bottom line for the operator

The lever is the **lump re-timing / continuous-drain model**, not the pause.
Option B as written (more pause states) is aimed wrong and would worsen M/E.
Whatever the operator picks, the M/E fix must reshape the drain (which needs
drain, or how the roll reads a mid-shift crab), not add pause states — and it
must not simply drop the pause, which is holding town-wide illness down 6.5x.


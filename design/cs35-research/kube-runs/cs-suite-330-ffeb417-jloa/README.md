# cs-suite-330-ffeb417-jloa — purse rate ladders honour the authored grid, gated on the cluster

**Verdict: GREEN, both backends — js 393/393, wasm 393/393 (786/786 merged)**

    sha      = ffeb417aa264e9a939e6fd610aa3d3a86b54f017   (branch cs-purse-rung-honour-v2)
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --ref ffeb417
    run from = gasboat fleet pod (project cs), IRSA identity, no AWS_PROFILE

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 393/393 passed | 12 | js-4 293.1s | js-7 72.8s |
| wasm | 393/393 passed | 12 | wasm-4 193.3s | wasm-7 49.3s |

All 24 arms exit 0, `failures[]` empty on every receipt, no pod restarts. The
merged verdict was cross-checked by recounting the 24 banked arm receipts
independently of `kube.mjs collect`: both give 786/786, split 393/393. Wall
clock end to end ~5 min — the cluster gate the 2026-08-26 policy mandates (a pod
in-pod `--jobs 1` full run of the same tree took ~50 min and was still draining
the long tail; see KUBE POLICY in CLAUDE.md).

The bug's own gate scenario is in the roll on both backends (js-1, wasm-1):

    PASS  civics purses: an EXTENDED purse grid's top rung is reachable, never silently dropped (bug kd-ASOmSqbQUr)

## This verdict belongs to the LANDED tree

`ffeb417` (branch tip: the fix `6f0a9d3` + its stamp) landed to main as merge
commit **`0e2a5cf`** (stamp `86024ed`), and

    git rev-parse 0e2a5cf^{tree} == git rev-parse ffeb417^{tree}
      == 7a373b546d37b0e31da8917de56fcb897d9fe9dc

so the merge commit's tree is **byte-identical** to the gated tip — main had not
advanced since the branch's base (`a9d89b9`), so the `--no-ff` merge is a
fast-forward-equivalent. The 786/786 verdict transfers to the landed merge
exactly. The stamp commit `86024ed` touches only `version.js`, which is outside
`tools/gatecheck.mjs`'s gate-relevant file set and which the sim never loads.

## The bug being gated (kd-ASOmSqbQUr, decision kd-PLM7pe021Z = HONOUR THE LADDER)

`purseRate` (the reader) has always clamped to `steps.length-1`, and the ballot
dials below it derive their bound from the authored ladder
(`FLOOR_STEPS`/`CAP_STEPS`). But `allPlatforms` (the generator) and the three
save clamps + the UI rate bump hardcoded the top rate index at **4**. So a
well-formed purse grid longer than five rungs PASSED `civicsLadderProblem` (the
ladder EXTENDS, ruling 4) and was then silently truncated — no platform carrying
rate 5+ was ever built, so the top rungs could not appear on a ballot, be voted
for, or be won. That is precisely the silent-drop of a WELL-FORMED document the
civics format exists to refuse. The operator ruled HONOUR, not REFUSE.

The fix derives the axis from the adopted grid, `rateSteps(mech) =
PURSES[mech].steps.length - 1`, at `allPlatforms`, the two `hall.policy`/
`hall.plat` save clamps, the ballot-box save clamp, and the two UI rate bumps;
cycling the mech chip re-clamps the edited rate into the new mech's grid.
**Byte-neutral for all shipped content** — every shipped purse grid is exactly
five rungs, so `rateSteps` returns 4 for every mech today and `allPlatforms`
builds the same platforms it did before. Scenario count 393 = 392 (main at
`a9d89b9`) + 1 (this bug's gate).

## The gate scenario's mutation demo (run in-pod, single-scenario — allowed)

*"civics purses: an EXTENDED purse grid's top rung is reachable, never silently
dropped"* authors a 6-rung levy grid `[0,2,4,6,8,10]`, adopts it the way boot
does, and asserts: the validator ACCEPTS it; `purseRate({mech:levy,rate:5})`
reads 10; `rateSteps("levy")` is 5 while a still-5-rung mech stays 4;
`allPlatforms` BUILDS a levy platform at rate 5 (and grows NO phantom rung for
the 5-rung mechs); the save clamp keeps the top rung on a round-trip. Reverting
`allPlatforms` to `rate <= 4` turned it RED naming the drop — *"allPlatforms did
not build the extended top rung - it silently dropped rate 5 (levy rate max 4,
the bug)"* — then green again on revert. So the scenario tests the fix, not a
tautology.

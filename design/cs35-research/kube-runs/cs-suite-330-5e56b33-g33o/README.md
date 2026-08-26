# cs-suite-330-5e56b33-g33o — the departure card money band, gated on the cluster

**Verdict: GREEN, both backends — js 388/388, wasm 388/388 (MERGED 776/776)**

`node tools/kube.mjs run experiments/suite-330.json --ref 5e56b33 --wait` — 24
arms (12 js + 12 wasm slices, `SIMLIB_REALM=main`), all exit 0, 0 failures, one
sha (`5e56b33f6927755e7319baa76b31e88960c13aa7`) across every arm. Job reported
`SuccessCriteriaMet Complete`, `MERGED SUITE VERDICT: 776/776 passed`, in ~6m
across the fan-out.

Recounted independently of kube.mjs's own merge: 24 arms, 0 non-zero exits, 0
failure entries, js slices sum to 388 and wasm slices sum to 388. The new
scenario was confirmed to have actually **run PASS** on both backends, not merely
to be absent from a failure list:

    js-6    PASS  departures: the money band prints the manifest's own dollars (559ms)
    wasm-6  PASS  departures: the money band prints the manifest's own dollars (297ms)

## Why this gate, and why on the cluster

This is a CLUSTER gate under the policy landed earlier today (8926e7c, "EVERY
gate runs on the cluster, pods included"). An earlier session gated this fix
in-pod (GREEN 776/776 at 8e8b5af and js 387/387 at ae81616), but those runs were
both superseded by that policy and lost when the session died before pushing —
so this is the gate of record.

A verdict belongs to ONE tree, and the trunk moved repeatedly under the honest
~6-minute fan-out: the branch was re-merged onto main at 8926e7c, then 5674afb
(L1 CLAMP static-interval soundness) as main advanced. This receipt names the
final pushed tree, 5e56b33 (merge 33c6569, stamped 5e56b33). Scenario count 387
(current main) + 1 (this line's money band) = 388 per backend.

## The mutation demo (suite discipline rule 3 — the guard bites)

On the merged tree, reverting the band from `fmtD` back to `fmt` (the pre-fix
double-divide) turns the new scenario RED with the exact documented message:

    FAIL  departures: the money band prints the manifest's own dollars
          the band misprints the manifest: BROUGHT 2/151, SPENT 1/82, TOOK HOME 1/69

Reverting the revert restores GREEN. The scenario reads the DRAWN band string and
holds it against the per-guest rows drawn directly underneath — same quantities,
same units, by construction — so a units bug cannot move both and stay consistent.

## The work being gated

The departure card's money band printed BROUGHT/SPENT/TOOK HOME 100x understated
from 2026-08-21 (commit 2e84c1e, the integer-cents migration): `departRecord` got
a `$d()` so the row speaks DOLLARS, but the band still called `fmt()`, which
divides by 100 a second time. For four days the card contradicted itself on its
own face — BROUGHT $7 above SPENT $42 OF $71. The fix adds `fmtD()` (a second
door with the unit in its name; `fmt(c) = fmtD($d(c))`) plus the scenario above.

## The PR escalation was a false blocker

Escalation kd-W7X2ay00ME said this could not land because the in-pod PAT lacks
`pull_requests:write`. TRUE about the PAT, IRRELEVANT to landing: this repo has
never used a pull request (`git log --grep='Merge pull request' | wc -l` = 0);
the house style is a direct `--no-ff` merge to main pushed by the gating agent.
`git push origin departcard-money-band-units` from this pod succeeded — the
missing PAT scope only blocks opening a PR, which this repo never does.

# suite-330 gate — GREEN 880/880 @ 5099d02 (the U1 land-asis gate)

Cluster gate for the U1 continuous-citizen-decay landing (task kd-CC5yBIzjFt,
decision kd-0hYmwnHeOp land-asis). Run `cs-suite-330-5099d02-5qj5`, 24 arms
(12 slices × 2 backends), `SIMLIB_REALM=main`, manifest `experiments/suite-330.json`.

**MERGED SUITE VERDICT: 880/880 passed** — js 440/440, wasm 440/440, every arm
exit 0, 0 failures. Gate ran 2026-08-27 20:00Z, ~6.5 min wall.

## Why this receipt is banked here (the transfer-forward it earns)

The gate ran on `5099d02` (the branch tip). The landing to main added only:
`3641ecf` (docs: CLAUDE.md + PLAN.md growth numbers, kd-Iz2OYHSzMM), the
`--no-ff` merge `8e1f760`, and the version.js stamp `d39bae0`. NONE of the 11
gate-relevant files (`gatecheck.mjs` `GATE_FILES`) changed between `5099d02` and
the landed tip — `git diff 5099d02 <tip>` touches only CLAUDE.md, PLAN.md, and
version.js, none of which the suite executes. So this 880/880 verdict transfers
exactly to the landed tree, and `tools/gatecheck.mjs` reads the tip **AMBER** on
this evidence (the stamp/docs re-gate the AMBER state exists for). Banked so the
pre-push receipt gate can see the verdict it inherits, rather than the cluster's
deleted-on-teardown copy being lost.

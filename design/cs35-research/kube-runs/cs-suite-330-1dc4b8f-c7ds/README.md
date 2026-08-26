# cs-suite-330-1dc4b8f-c7ds — the CLAMP-soundness tip, gated on the cluster

**Verdict: GREEN, both backends — js 387/387, wasm 387/387 (774/774 merged)**

    sha      = 1dc4b8fec8c0b6b85ee407199c54a5798b646689   (main tip: the stamp commit)
    content  = f7d3b0c  (L1 CLAMP static interval: sound hull of all three operands)
    tree     = 50de28cf94120fee11cb607e0ae097b15f88c958   (git rev-parse HEAD^{tree})
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --ref 1dc4b8f --wait

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 387/387 passed | 12 | js-4 404.1s | js-8 55.2s |
| wasm | 387/387 passed | 12 | wasm-4 254.2s | wasm-8 37.4s |

All 24 arms exit 0, `failures[]` empty on every receipt, zero pod restarts.
`clean` uninstalled the release and verified scale-down to 0 ephemeral nodes.
The merged verdict was cross-checked by recounting the 24 banked receipts
independently of `kube.mjs collect` — both read 774/774, split
387/387. Per the runbook, the receipts are the verdict, not Job status.

## Why this tip owed a fresh gate (not a transfer)

`game.js` and `tools/suite.mjs` are both in `gatecheck.mjs`'s gate-relevant
file set. The content commit `f7d3b0c` changes both — `game.js` the CLAMP
interval, `tools/suite.mjs` the bracketing gate — so no prior receipt's verdict
reaches this tree (`gatecheck.mjs --ref 1dc4b8f` reports RED naming exactly
those two files, basis `inpod-suite-bdbb3dc-h05`). This receipt is that owed
run. The stamp commit `1dc4b8f` changes only `version.js`, which is
DELIBERATELY excluded from the gate set, so the verdict belongs to both the
content commit and the tip.

## What this gates — an interval-soundness fix, byte-neutral for the shipped game

Bug kd-6NKxmSvlpP. `l1Assemble`'s CLAMP static interval was
`[min(a0,b0), max(a1,c1)]` — it never consulted the LO operand's HIGH end nor
the HI operand's LOW end. The runtime is `a<b?b:a>c?c:a`, so when the lo
operand's interval reaches ABOVE the hi operand's, the runtime returns lo — a
value the static interval did not contain. That let a CLAMP launder a wide read
into a narrow `[0,1]`, defeating two load-bearing proofs that lean on interval
soundness:

  - the `eligPredProblem` 0/1 predicate gate (a laundered vote prog bounded
    `[0,1]` but ran to 50), and
  - the 2^52 magnitude rail (`cultureProblem` accepted a platform term whose
    laundered^4 ran to 2.56e26 at fb=4,000,000, a non-safe-integer crossing the
    JS/wasm seam).

Both were LATENT on main — zero shipped documents use the CLAMP op (grep over
`design/cultureways/*.json` and `tools/fixtures/*.json`: 0 hits) — verified on
the REAL engine, not by reading. The fix is the sound over-approximation: the
hull of all three operands, `[min(a0,b0,c0), max(a1,b1,c1)]`. It is still tight
for the shipped shape `clamp(x, PUSHI_lo, PUSHI_hi)` with `lo<=hi` (the hull
equals the old interval there), so no existing bound narrows and no fixture
moves; `cultureways.js` regenerates byte-exact.

`tools/suite.mjs` gains a bracketing gate in three existing scenarios, each
proven to BITE when CLAMP is reverted to the buggy form (measured in the prior
session: both hostile brackets go RED, the golden pins the runtime):

  - *layer 1: the golden programs answer to the pin* — a golden pinning the
    lo-above-hi runtime (`clamp(0,42,1)=42`) so a "fix" that narrows the runtime
    to match the old static goes red.
  - *layer 1: hostile programs are refused by name* — a SECOND bracketing pair:
    `clampLaunder` (launderY^8, must be REFUSED naming PAST 2^52 — the
    load-bearing refuse side, since loosening an interval can only turn a refusal
    into an acceptance) + `clampGenuine` (the shipped `clamp(y,0,10)` shape, must
    stay ACCEPTED with a tight bound).
  - *civics eligibility: a hostile franchise is refused by name at the door* — a
    CLAMP-laundered predicate `clamp(0, npc*50, npc)` (must be refused NOT A 0/1
    PREDICATE, since it bounds `[0,50]` and reads 50 for a townsfolk) + a genuine
    `clamp(npc,0,1)` predicate (must stay ACCEPTED).

Because the suite exercises the whole engine on both backends, 774/774
also proves the fix is INERT to every shipped scenario — no bound moved, no
fixture shifted, both kernels agree.

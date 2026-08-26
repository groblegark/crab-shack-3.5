# cs-suite-330-dfbe920-hswy — the bundled pig declares a civics section, gated on the cluster

**Verdict: GREEN, both backends — MERGED SUITE VERDICT 778/778 passed** (389
scenarios × 2 backends), 24 arms (12 slices × js/wasm), every arm `exit=0`, zero
failures. Cluster gate via `tools/kube.mjs`, per the 2026-08-26 policy that
EVERY gate runs on the cluster (CLAUDE.md). Scale-down verified.

    sha = dfbe920   ("the bundled pig declares a civics section: it votes its own politics")
    manifest = experiments/suite-330.json   release = cs-suite-330-dfbe920-hswy
    node tools/kube.mjs run experiments/suite-330.json --ref dfbe920 --wait

The new dogfood scenario is in the roll on both backends (js-6, wasm-6):

    PASS  civics dogfood: the SHIPPED pig votes its own politics, and a pig coefficient bites

and the byte-pin that guards the shipped bundle passed with it:

    PASS  bundled cultures: every shipped document is byte-equal to its source

## What is being gated (bead kd-NwmSEtppH4)

The dogfood bar — substrate §5.2, *"if the island's own ways cannot be written
in these sections, the format is wrong"* — was unmet for STRANGERS: no bundled
culture declared a `civics` section, so every capability the format offers was
exercised only by suite scenarios and one adversarial `boar` probe. The pig now
dogfoods it.

`tools/fixtures/cultures-pig.json` grows a `civics` section (regenerated into
`cultureways.js` byte-exact — the diff is purely the additive `pig.civics`
block, +161 lines, zero removals; the CULTURE_SOURCES byte-pin holds). The
PORKRESENTATIVE PIGPUBLIC is a leveller people whose communal slop pot is its
identity, and its civics say so:

- **stakes** — pot weighted **5×** (`1725000`), roof **¼×** (`517500`),
  inverting the crab's roof-over-pot priority (the crab weighs the roof 6× the
  pot). `floorRaise` doubled (farmhand solidarity for the wage floor);
  `purseCost` half-sting ("paid my way in, fair's fair"). Same lcm grid, so the
  summed stake stays an exact int.
- **eligibility** — `vote = 1` (a leveller keeps the franchise universal);
  `stand = NOT owner` ("no pigtators — every hand may lead, no boss rules").

Both levers dispatch on the voter's culture and are LIVE for a settled pig
(`settlers.apron`). The scenario proves four observables off `CULTURES.pig` (the
shipped bundle, not a synthetic doc), each by changing ONLY the culture tag on
one real town (seed 7, 6-crew, 20 days):

1. **dispatch fires** — the pig's stakes diverge from the engine lambda.
2. **characterful, not a crab clone** — on a homeless voter,
   `val(pot-heavy) − val(roof-only)` is **−2,166,600 as crab, +12,851,000 as
   pig**: the sign flips. A pure ordering inversion.
3. **the bite (§5.2)** — reverting the pig's `potStake` coefficient to the
   crab's drops that margin +12.85M → +0.43M; a pig coefficient defect is caught.
4. **the franchise** — a crew crab STANDS as a pig where it cannot as a crab;
   an owner is BARRED as a pig where the crab would seat them.

`voteReason` was made to derive from the compiled stake terms (bdbb3dc, sibling
bug kd-LA2w67QLG4) just before this — so a pig's receipt speaks its own politics
too. This base carries that change.

## The busy-trunk re-gate history (a verdict belongs to one tree)

The trunk moved ~30 commits while this one-file change was written and gated;
each gate below was honest for its tree and superseded by the next:

| base | verdict | note |
|---|---|---|
| in-pod `d621589` | js 387/387, wasm 387/387 | pre-policy; superseded by the cluster requirement (CLAUDE.md 2026-08-26) |
| cluster `956c457` | 776/776 | first cluster gate; trunk moved (CLAMP fix) under it |
| cluster `28842c9` | 776/776 | rebased onto the CLAMP fix; trunk moved (departcard) under it |
| **cluster `dfbe920`** | **778/778** | this — rebased onto departcard, pushed to main while the trunk was quiet |

Every intervening commit touched only orthogonal files (`game.js` CLAMP hull,
`tools/suite.mjs` departcard/CLAMP scenarios) — never the pig fixture,
`cultureways.js`, or the civics dispatch — so the change never had a behavioural
interaction to resolve, only a rebase.

## IN-CLUSTER (the policy)

Run on the gasboat-prod cluster via `tools/kube.mjs` from a `cs` fleet pod
(IRSA identity, no `AWS_PROFILE` exported). Per CLAUDE.md's KUBE POLICY as
extended 2026-08-26: **every gate runs on the cluster, Mac or pod** — an in-pod
`tools/suite.mjs` defaults to `--jobs 1` and grinds for ~90 minutes where the
cluster returns both backends in ~7 minutes across 24 arms.

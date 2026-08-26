# cs-suite-330-68c03ad-nzbi — the visitors book, merged onto current main and gated on the cluster

**Verdict: GREEN, both backends — js 396/396, wasm 396/396 (792/792 merged)**

    sha      = 68c03ad70f1a874a95db8fbc12063d6ee3d3718f   (branch visitors-book)
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --ref 68c03ad
    run from = gasboat fleet pod (project cs), IRSA identity, no AWS_PROFILE

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 396/396 passed | 12 | js-1 348.7s | js-3 78.4s |
| wasm | 396/396 passed | 12 | wasm-1 222.4s | wasm-4 51.6s |

All 24 arms exit 0, `failures[]` empty on every receipt. The merged verdict was
cross-checked by recounting the 24 banked arm receipts independently of
`kube.mjs collect`: both give 792/792, split 396/396. This is the cluster
gate the 2026-08-26 policy mandates (KUBE POLICY in CLAUDE.md).

The roster scenarios are in the roll on both backends:

    census: rows derive live state, and sort + filter actually move
    visitors book: the guest roster sorts, filters and pages on its own terms
    roster: the refactor preserves every census ordering
    roster: the book chip swaps register and resets sort, filter and page

## What is being landed

Matt asked (Slack, 2026-08-25) for "a nice view of all tourists like we have for
other kinds of citizens, button on main screen", then for a more symmetrical
shape. A roster is now DATA: `ROSTERS` declares list/keep/rank/row per book, and
one `rosterList()`, one pager, one hit test and one chip row serve both the town
census and the new visitors book. A third nav chip GUESTS on the main screen,
geometry measured for both canvas modes (H=240 and H=288). The row painter is
deliberately NOT shared. One deliberate behaviour change: WALLET ties are now
alphabetical (were arbitrary); wallets still descend.

The branch author (thread-1787694678-533199) also fixed three defects that the
branch's first self-reported "382 GREEN" had missed (commit 51f0a88, gated
382/382): the footer money line printed through the FED THR CLN FUN SPA legend
(now its own row, STILL ASHORE $ / TAKEN TODAY $); a GUESTS help block overran
the FINDING THINGS page footer (TOWN and GUESTS folded to one entry); and the
overlap sweep accumulated BOXES across 25 sort/filter redraws, burying the two
real hits in ~360 self-overlaps (reset per draw). This landing carries those
fixes forward and re-gates them against current main.

## This verdict belongs to the LANDED tree

`68c03ad` (branch tip: the merge `7b8d4b2` + its stamp) lands to main as merge
commit **c51da0a** (stamp 70f37c9), and

    git rev-parse c51da0a^{tree} == git rev-parse 68c03ad^{tree}
      == 8a1d24bf66be2e162a0f2175ac1ae432cf0abd49

so the merge commit's tree is **byte-identical** to the gated tip. The stamp
commit touches only `version.js`, which is outside `tools/gatecheck.mjs`'s
gate-relevant file set and which the sim never loads.

## The merge, resolved on the merits (a busy trunk)

Only `version.js` conflicted across all 31 commits main had advanced (tariff,
departure card, cabanas, pig-civics, purse-rung); `game.js`, `tools/suite.mjs`
and `PLAN.md` auto-merged, and version.js is GENERATED — resolved by running
`tools/mkversion.mjs`, never by hand. Coherence checked beyond "auto-merge
succeeded": scenario count is additive (main 393 + the branch's 3 = **396**, no
scenarios lost); every roster helper (`visitorsInTown`, `visWorstNeed`,
`visSailingSoon`, `visPurseTotals`, `visitorRow`, `censusRow`) is present, and
`node tools/mkcultureways.mjs` is a byte-exact no-op on this tip.

## The refactor's own safety claim (mutation demo)

`rosterList()` armed to read `ROSTERS.CREW.list()` for BOTH books turns two
roster scenarios RED naming the exact defect — "the ALL filter dropped a guest",
"the VISITORS book is not all guests" — proving the one comparator genuinely
covers both books, not just returns an equal value. (Demonstrated a prior
session; the scenarios are unchanged and green here.)

# THE CAPABILITY APIs — phase D close-out (the 35%)

*2026-08-23, branch `capability-apis` (rebased over the citizen mind and the
kube substrate). Substrate debt item 5: "No errand registry / hook taxonomy /
policy slots / placement registry — the 35% engine capability; civics'
prerequisite. → phase D." Five registries, one commit each, every one
byte-neutral on a default town: the engine grew doors, and nothing walked
through them until a scenario staged it.*

## 1. THE ERRAND REGISTRY (`ERRANDS`, registerErrand, dataErrand)

pickErrand's private census is a registered, ordered ballot. Three rules kept
it byte-identical: ORDER IS SEMANTIC (the argmax tie-break is first-at-a-score,
so entries register in the exact old take() order and nothing ever sorts);
the PRELUDE IS SHARED AND PURE (off/wantFood/bath state hoisted, no draws;
entry-local gates like the ball's measured bars stayed inside their entries);
SCORING IS UNTOUCHED (errandScore, the argmax, and the citizen brain seam
read the same candidates — the registry owns who is on the ballot, never how
the vote is counted). Nine native entries: meal.self, meal.counter, ball,
drink, bath.shower, bath.rinse, soup, vote, fun.arcade.

`dataErrand` is the data door civics will use: a declarative counter errand
(id, need, biz, Q20 thresholds, appeal in hundredths), clamped with NAMED
refusals, no imperative body — the research ruling that culture never
supplies movement code, honored by shape. The placement scenario drives one
in anger (see §4).

## 2. THE HOOK TAXONOMY (`HOOKS`, registerHook, fireHooks)

The four points the substrate names, wired at their real engine sites:
- **midTransaction** — creditBiz, the funnel every till credit passes;
- **worldEvent** — the day roll, fired before the books reset so a hook
  reads yesterday's rep/coins;
- **settlementAggregate** — visQuote, one guest's whole ruled stay;
- **walletScan** — collectPurse, the hall's evening pass over the purses
  (fires even at rate 0: a scan that only fires when the town collects
  would hide exactly the wallets a hook exists to see).

The phase-D contract is deliberately narrow: hooks OBSERVE (ctx is primitive
copies, never live objects), a throwing hook is unhooked on the spot with one
legible toast (the sim never stops), and an empty point costs nothing — the
dispatch guards on length before building ctx, which is also the byte-identity
argument. Mutation verbs arrive with Layer-1's fuel-counted bytecode (phase E),
where rollback is implementable; a JS closure gets no verb because a verb
without fuel-and-rollback is a hole in the sim's hull. KERNEL: none of these
cross the wasm boundary; a point the kernel must serve crosses as a data plane
per the MR_TASTE precedent when a consumer exists (not-yet-ported by design).

## 3. POLICY SLOTS (registerSurface, policyOf)

A surface is registered or it does not exist: NEURO_SURFACES is built by
`registerSurface` (classes 2..32, a named engine-default `script`), and
policyProblem's existing refusal of unknown surfaces now means exactly that.
Both live surfaces registered through the door — `vis_pick.candidate`
(script: visPick) and the citizen mind's `cit_errand.candidate` (script:
pickErrand, the 13-class census, order byte-for-byte). `policyOf(culture,
surface)` answers "who decides": the declared policy or the engine default —
inspection and the phase-E slot dispatch read this one answer instead of
re-deriving it. The brain fast lanes (brainOf, citBrainOf) are untouched.
HONEST GAP: `kind: "table"` validates but nothing dispatches a table policy
yet — a table needs a per-surface format, which is Layer-0/1 content (E).

## 4. THE PLACEMENT REGISTRY (PLOTS, placeBusiness, PLACED)

The biz-catalog close-out's gap #1, closed. The plot model, v1:
- **WHERE**: the engine names its vacancies — one ships, `eastlot`
  (x 2056–2168, the sand between the pier's foot and the hotel's buggy park).
- **WHO PAYS**: nobody at the door — under the one-wallet rule the owner's
  pocket IS the till (defineTill settles), and the engine charges the shop
  real rent at midnight; an under-capitalized claim goes bankrupt honestly
  (measured: a $10 pocket against a $20 board closed on night one).
- **WHEN IT OPENS**: at placement, standard hours, autoLabor true, the
  settler owner behind her own counter (the buyout path's owner-conversion
  recipe, verbatim — half of it was measured insufficient).
Geometry is DEALT deterministically (declaration-order stations on the back
row, the `out` station forward, stalls then tables; refused by name if it
does not fit); station kinds must have engine art (the invisible-cob rule at
the door of the map: "BIZ X STATION Y HAS NO ART"); the busy table grows the
placed row and loses it at teardown. Placements are TOWN state: they ride
the save as (plot, culture, biz, owner) and REBUILD FROM THE DOCUMENTS at
load (a save cannot smuggle geometry the documents no longer declare); they
die at resetSession and at loadCultures (loudly). Load order moved: THE
DOCUMENTS FIRST, THEN THE SHOPS THEY DECLARE, THEN THE PEOPLE — newCrab
clamps any job whose BIZ entry does not exist, so a placed shop must stand
before its owner's persona loads (the stream-cursor lesson, applied again).

**Two engine guards the first non-npc peer owner exposed** (both were
diagnosed live, by trap, not by reading):
1. quitOverPay poached the owner off her own counter the first morning the
   town's rate beat her sign — AN OWNER IS NOT ON THE WAGE; her pay is the
   till. Guarded.
2. updateSchedule's "crew can't staff NPC shops" sanity yank predates non-npc
   peer staff entirely — an owner now stands at her own counter.

The scenario is the whole story: RASHER settles, claims BOAR JUICE on the
east lot (refusals first: no-art, ghost plot, wrong-culture owner, all
named), the overnight roster picks her up, a registered data errand points
the thirsty at her counter, the till takes real conserved money by day-3
afternoon, the envelope round-trips the standing shop, and resetSession
strikes it clean.

**Honest gaps**: visitors never patronize a placed shop (visCandidates and
the vis_pick class list are pinned per artifact — wiring a placed biz into
the visitor surface re-shapes brain contracts, phase E scale); one plot
ships (more vacancies are data the `world` section will own); a
placed-then-bankrupt shop's PLACED row survives its closure (the FOR SALE /
re-open story belongs to civics); station art beyond the engine set waits on
`world`; no autonomous settlement drive (civics — the matrix floor never
places, by design).

## 5. DECLARATIVE CARDS (`cards`, cultureCards)

A culture may declare up to 4 dossier cards: title + rows binding labels to
REGISTERED observables — the same versioned registry brains declare inputs
from, which is the point: one vocabulary for brains, inspectors and cards.
The first card renders on the visitor dossier with live values (an
undeclared guest renders byte-for-byte as before); an unknown observable is
refused by name at the door, engine and MCP validator both. The accessor
(`cultureCards`) is the headless-testable seam, and the scenario asserts
observability the house way: state moved, the card moved.

## Gates (KUBE ERA — the box is out of the fan-out business)

- Per-commit, pre-policy (local, then allowed): suite green kernel-off at
  each commit; headless 4×10 byte-identity vs a pristine f738aca worktree
  after every registry (BYTE-IDENTICAL each time); wasm backend green
  through the placement commit; MCP battery green through cards (50/50).
- Post-rebase (over the citizen mind and the kube substrate), on-cluster at
  the pushed ref: suite-312.json (both backends, 8+8 arms) and
  phased-gates.json (the MCP battery via the new tools/mcp-check.mjs door)
  — receipts under design/cs35-research/kube-runs/, verdicts quoted in the
  fork report. Byte-identity across the rebase rests on the suite's own
  frozen-fingerprint, rng-pin and cultureways-digest scenarios, which is
  what they exist for.
- Mutations that BIT (each restored green): deregistering the ball reddened
  three scenarios including the census pin; a corrupted-delta scenario
  (citizen era) still bites beside the new registries; disabling the
  station-art clamp let the artless test-shop squat the lot and the honest
  placement went red narrating it; the cards scenario reddens on an
  unregistered observable BY NAME.

## The requirement map (substrate §6-D)

| requirement | state |
|---|---|
| errand registry | SHIPPED (registry + data door; culture content waits on civics) |
| hook taxonomy (4 points) | SHIPPED (observe-only; verbs land with Layer-1 fuel) |
| policy slots | SHIPPED (registration + resolution; table dispatch waits on E) |
| placement registry | SHIPPED (one plot, real open-and-trade; gaps named above) |
| declarative cards | SHIPPED (dossier cards over the observable registry) |

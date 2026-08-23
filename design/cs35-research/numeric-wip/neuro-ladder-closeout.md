# NEURO LADDER — close-out (steps 1–4, owner-approved; crab brain LIVE by ruling)

Owner rulings this landing executes: "amazing; yes, proceed" (the ladder),
"im ok with just shipping neuro crabs, there's no risk and we always have
their tests" (the crab default thinks through a live brain, with the full
re-baseline treatment), and shadow mode kept as standing infrastructure.

## What shipped

- **The two registries, in-engine** (game.js): 12 named observables + 6
  parameterized (`name:stop`, 5 stops = 42-wide vectors in practice), each
  with declared units and a clamp into [0, 32767]; versioned
  (`NEURO_REGISTRY_VERSION = 1`); unknown names fail LOUDLY with the name in
  the message. One decision surface registered: `vis_pick.candidate`
  (7 classes). The registry is the trust boundary — documents pick names,
  never ship code.
- **The `policies` section**: per-surface `table | script | brain`, with
  `mode: off | shadow | live`. `policyProblem` enforces the hostile-file
  numbers at the door — registry version (both numbers in the message),
  inputs resolved, classes equal to the surface's in order, arch/params/MAC
  caps, every weight range-checked int8 — and `cultureProblem` owns it, so
  nothing installs silently. Brains compile at install into `BRAINS`
  (rebuilt by `loadCultures`, so a load never inherits a session's brains —
  the loader-reset contract by construction).
- **The brain path**: `visPick` split into `visCandidates` (guards, blocked
  counters, recipe draws — SHARED verbatim) + scoring; `brainVisPick` ranks
  what the candidates built (class logits, lowest index wins ties, "none"
  competes), so a brain is DRAW-FREE by construction and the stream leaves
  in the same order whoever decides. `visSettle` (the foreign counter) is
  shared by every decider. Shadow mode runs the artifact beside the decider
  and tallies into `window._shadowStats` (the harness's observation channel,
  exempt from resetSession by the `_stats` argument).
- **Two live artifacts, both distilled price-diverse (v2)**:
  - the CRAB default (`BUNDLED_POLICIES.crab` in cultureways.js): 42→24→7,
    1.3 KB, held-out agreement **95.71%**, in-town **96.70%** (727 thinks,
    seed 4242), **95.13%** in a growth town.
  - the GULLS (`design/cultureways/gullway.json` → bundled): same arch,
    trained on 71,572 gull thinks, held-out **94.88%**. THE WINDWARD ROOST
    ships: gate rep-60, first neuro-people on the ferry.
- **MCP `policy_distill` / `policy_verify`**: the whole loop as tools —
  collect (the script teaches), train, quantize, verify, return a
  policies-section artifact IN SHADOW MODE (promotion to live is the
  author's own act). Harness grown to 38 checks.

## Where the brain runs, and why

JS-side; the kernel defers for brain-carrying deciders identically in both
modes, so kernel-vs-JS agreement holds by construction. Cost says so:
0.0391 thinks/tick × ~1µs scalar ≈ noise against a ~90ms sim-day; porting
the int MLP into kernel.c buys nothing measurable today. The kernel port
waits behind a measured trigger (bigger brains, universal thinkers, or the
batch instrument demanding it).

## The re-baseline, traced (the slice-3/4/5 standard)

**THE FIRST CROSSING IS NAMED AND IT IS STABLE ACROSS ARTIFACT GENERATIONS:
seed 1337, think 9, tick T=1358 (day 1), visitor NIPPY.** The script sends
her for her drink (thirst 809002 Q20, 134px away); the brain checks her into
the hotel first (logit 361,983 vs shack:drink 313,651 — same candidates,
same draws, stream unshifted AT the crossing). hotel:room is the net's
strongest class (98% recall), so the character is: **guests settle in before
they snack.** Everything downstream re-rolls behind that one different walk.
Re-runnable: `node tools/neuro/trace-crossing.mjs`. Re-pointed behind the
trace: the frozen day-2 fingerprints (both seeds), the draw-count spec
(1861/2399 → 1857/2265), the cultureways load-equals-boot digest.

**Nine suite pins walked, each by its mechanism, none blanket-re-pointed**
(commit 87fa81e has the full list): the lease drain now HOLDS through
settlement (evening custom was paying the rent in the six minutes between
drain and rent run); the sale scenario stages the market directly, because
under the neuro flow REEF buys a failed shop within ONE GAME-MINUTE of the
bankruptcy settlement (the succession racing the assert — three scenarios
hit the same race in different costumes); the mortality window caps buyer
wallets; the hotelier pin permits a REHIRE across the sold desk but never
an unhired one; the rival staging holds its 0.4-of-worth fraction through
the staged days; the wage-floor split stages its own employment seam; the
five-town routes band re-measured 2→3 failures (its biting twin stayed
green; erosion tripwire kept).

## The matrix battery (interleaved with the pre-neuro base, per block)

Baseline `--days 30 --seeds 16` × 3 blocks: **0/48 both trees**; medians
neuro 11/12/12 vs base 12/12/13 (within the ±1 band).

**THE FINDING THE OWNER SHOULD READ — the growth floor moved down, and it
is directional.** Growth `--days 40 --buy chef,table` × 3 blocks: escapes
**neuro 8/48 (1+3+4) vs base 13/48 (4+3+6)**; per-block signs −3/0/−2.
Baseline lifetime tilts down in ALL THREE blocks (−3.0/−7.9/−4.2%), purse
down all three. ~1.7σ on the escape count — suggestive rather than damning,
but the same-direction tilt is the erosion pattern PLAN warns about, so it
is named here loudly rather than shipped quietly.

**Attributed as far as one probe reaches**: the disagreement anatomy in a
growth town (shadow tally, seed 1337, chef+table) is dominated by
ACT-EARLY — `none→shack:drink` 26, `none→showers:clean` 28, `none→food` 8,
plus meals traded for rooms (7). The brain buys small and early where the
script waits for the fat ticket, tilting marginal spend toward NPC services
(showers, hotel) and cheap drinks. That is a coherent personality with a
measured cost to the growth floor. **Per the standing rule the matrix is a
regression detector, not a dial — nothing was tuned.** The lever, if the
owner wants the old economy back: distill with class-weighted loss on the
`none→X` boundary (a `policy_distill` parameter, one flag of work), or
lower the crab artifact to shadow. Owner's call, not ours.

## Mutations (all receipts in the transcript-of-record; run per commit 87fa81e)

- a drawing shadow → the inertness pin fails with both towns' books;
- a drawing brain → the pairing pin fails at think 3 BEFORE any pick
  differs ("the brain path drew");
- a lobotomized artifact (w2 zeroed) → the agreement floor fails at 85.6%
  vs the 90% floor;
- caps: **layered by design** — removing the params cap alone is VACUOUS
  (under in≤64/hidden≤256/out=7 the params ceiling is 18,176 < 32,768;
  defense-in-depth for future surfaces, recorded, not claimed), and
  removing the hidden cap alone falls through to the params cap with a
  DIFFERENT message, which the message-match catches. Sneaking an oversize
  brain in requires removing both walls at once.

## Save compatibility

`SAVE_VER` unchanged; a cultureway document's `policies` section rides the
same envelope path as every other section. **An old save's crabs think with
the bundled brain on their next load** — bundled policies are engine-side
(BUNDLED_POLICIES), never written into saves, exactly like bundled
cultureways: a brain we improve later reaches every existing town. The
round-trip pin ("a town full of thinking heads round-trips its save")
proves one save loaded twice walks one future, gulls aboard and both
brains live.

## Promotion path (the standing procedure for the NEXT brain)

1. `policy_distill` → artifact arrives in SHADOW mode with receipts.
2. Ship it shadow (bundled or in a document); `window._shadowStats` gives
   live agreement in real towns at zero risk — shadow is PROVEN inert (the
   pin, mutation-tested).
3. When the measured agreement satisfies, set `mode: "live"` — and pay the
   full re-baseline: trace the first crossing, walk the pins, run the
   triple-block matrix, name what moved.
4. The agreement-floor scenario pins the shipped artifact forever after; a
   retrain that drifts fails loudly with the rate.

## Lessons banked

- **The script is the teacher**: collection sims must DISARM every brain,
  or the live artifact decides the thinks and the wrapped reference
  collects zero rows (this happened; the collector now does it and says why).
- **Teacher coverage is the training distribution**: the first shipped
  artifact was BLIND TO PRICE because every collection town sat at the
  default board — it broke the rivalry's repricing lever and the suite's
  own sweep caught it. A third of boards per collection town now sit
  off-default. Generalized: enumerate the LEVERS the economy pulls and make
  the teacher's data pull them.
- **A browser check that boots a fresh town can WRITE the default save slot
  and destroy staged state** — a fixture staged into slot 1 was clobbered
  twice by fresh-boot autosaves during verification. Future browser
  verifications: stage under a distinct slot, or re-stage after any fresh
  boot. (Related suspicious observation, NOT chased here: reloading the
  URL appeared to overwrite slot 1 with a fresh day-1 town even without
  playing — if real, that clobbers a player's slot-1 save on every visit
  to the title screen. Deserves its own targeted check.)
- The shared playwright browser is contended between agents: port-guard
  every reading AND expect your tab to be navigated out from under you;
  the game's own software-canvas renderer (mcp/render.mjs) is the
  deterministic, contention-free way to photograph a town.

## The devlog sentence (for the next entry)

The first neuro-people came ashore: MEW and SPINDRIFT of THE WINDWARD
ROOST, gulls who think with 1.3 KB of distilled arithmetic, queuing for
grilled fish at nine in the morning — and the crabs themselves now think
the same way, 96 times in a hundred exactly as they always did, and the
other four with a personality the town is still getting the measure of:
guests check in before they snack. Picture:
`devlog/img/2026-08-22-first-neuro-gulls.png`.

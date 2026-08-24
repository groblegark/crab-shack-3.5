# REPUTATION WITH TEETH — close-out

**Directive (Matt, 2026-08-23, verbatim):** "ok while we're doing stuff let's
make the reptuation system like.. significantly more impactful." And the
follow-up that names the absurdity: "right now everybody ends up with tons of
homeless tourists and a 100 rep."

## THE INVENTORY (pre-change, tip 071143d)

State: `rep`, int millirep 0..100,000, init 30,000 (game.js:188); repPts (:39).

EARN sites: table serve +800 (:11853, guests only), counter serve +400
(:11874), departure "+500 if 2+ buys" (:12481). All flat, all uncapped in
rate — a busy town out-earns every sink, which is WHY everybody sits at 100.

LOSS sites: departure "slept rough at least once" −1200 (:12481, flat,
once per VISIT no matter how many sand nights), rage-quit −3000
(:13348, :13501). Nightly relaxation 6% toward 30,000 (:19536) — at rep 100k
that is −4,200/night, swamped by a single busy hour of serves.

THE MISSING SINKS (the town already counts its shame; rep never hears):
visitor sand night — k.roughNights++/k.unhoused++ in sleepOnSand (:12585);
resident rough night — sleepRough (:5917, stats-only at :5923);
room shortfall — noteRoomShort (:4030, stats+annexe only).

READ sites: ferry volume 2.0 + 0.013/pt (:11990); culture arrival gate
cultureRolls reads GLOBAL rep vs repGate (:12313) — a pig's opinion of the
town is currently the crabs' opinion; HUD REP (:20216, color bands 25/50);
meta card (:18040/:18052); sci notes (:20406); dayRoll hook (:19532).

Kernel: no rep (grep: comments only). All sites JS.

## DESIGN (implemented; sections below filled at the gates)

The BEFORE, receipted from banked matrices (not a vibe): across the
numeric-wip matrix receipts, 63 towns ended at rep 100 (mode), 9 at 99 —
and the 1b growth block holds all sixteen towns at rep 89–100 (ten at
100) while logging ONE HUNDRED AND TWO rough nights in the same block.
Matt's sentence, countable: "everybody ends up with tons of homeless
tourists and a 100 rep."

## THE DESIGN — the word abroad

**One door (`repAdd`)**: every word passes through one function with three
rules. GAINS SATURATE — effective gain = idiv(g × (100,000 − r), 100,000):
a +800 table serve is worth 640 at rep 20, 80 at rep 90, nothing at 100.
The top of the ladder stops being a ratchet and becomes an equilibrium the
town must HOLD against its sinks and the nightly cooling. LOSSES NEVER
SATURATE — shame lands in full at any altitude. SPILLOVER — every installed
people overhears 25% of what another people is told; word travels loudest
among your own.

**Her own people (`repC`)**: each installed culture keeps its own millirep
word beside the crabs' `rep`. Earns and losses route by the guest's
culture: a pig served at table tells pigs; a pig on the sand tells pigs
LOUDER. Town state — saved as `repc`, absent on old saves (nobody had
formed an opinion), cleared unconditionally on load (the loader-reset
rule). The HUD shows the word abroad under REP, worst first, left of the
sun button (measured, not assumed).

**The sinks that were missing**: a guest's night on the sand now costs her
people 900 (rough) + 250 (unhoused) THAT NIGHT, per night — not the old
flat −1200 once per visit at the gangway (which also stays: the story she
tells at home). A resident crab sleeping rough costs the crabs' word 400.
A full house turning a guest away costs 150 (the town's own shame). With
the earn side saturating, a town with "tons of homeless tourists" is
ARITHMETICALLY unable to sit at 100.

**Whose word opens the gate**: cultureRolls now hears the culture's OWN
word — or hearsay, the crabs' word at a −5 discount, which is how the
first pig ever hears of the place. BAD NEWS BEATS HEARSAY: a people whose
own word fell below the 30 baseline is not talked back aboard by crab
enthusiasm; their own experiences (mended slowly by spillover) must do it.
A town the pigs soured on stays shut to pigs at crab 100.

**What deliberately did NOT change**: the amounts at the existing earn/loss
sites (800/400/500/−1200/−3000), the nightly 6%-toward-30 cooling (now
applied to every people's word), the ferry-volume formula (still reads the
crabs' word), the bot (rep-blind, the floor doctrine), the kernel (rep was
never in it). No new draw sites: every charge is deterministic arithmetic
at an existing event; the one draw-adjacent change is the GATE's threshold
(own word vs global), which moves WHEN the existing culture roll draws —
a named fingerprint event, not a new stream.

## THE MATRIX (triple-16, batch instrument, branch dddf63d vs base 071143d)

| block | base escapes | branch escapes | base evict median | branch |
|---|---|---|---|---|
| baseline sb0/16/32 | 0 / 0 / 0 | 0 / 0 / 0 | 11 / 13 / 13 | 13 / 12 / 12 |
| growth sb0/16/32 | 5 / 2 / 6 = **13/48** | 6 / 5 / 6 = **17/48** | 11 / 11 / 12 | 13 / 11 / 12 |

Growth **+4 escapes**, baseline intact at 0/48, medians within a day or two
either way. NOTHING WAS TUNED toward any number — the shift is the system's
own: a lower resting rep means smaller boats, which in a fresh growth town
means fewer guests arriving faster than two crew can serve them, which
means fewer rage-quits and sand nights in the fragile first week. The
reputation pass, built to punish neglect, mildly REWARDS the well-run
early town — reported, not claimed as intent. Deltas are Matt's to rule on.

**The rep distributions, the falsifiable claim** (branch; per-town end rep):
baseline blocks end at median 45–49 (worst towns 0–31, best 60); growth
blocks span 0–71 with medians 43–52. NOT ONE TOWN of 96 ends at 100 —
against the base's banked receipts where 100 was the MODE (63 towns) and a
block once held all sixteen towns at 89–100 over 102 rough nights. A rep in
the 90s is now something a player will have to EARN and HOLD.

## THE FIRST CROSSING

State diverges at the FIRST SERVED GUEST of any town: the flat +800 becomes
idiv(800 × 70,000 / 100,000) = 560 at the starting rep of 30 — day 1, the
first serve, by construction (the mechanism IS the divergence). The first
draw-visible crossing is the next ferryBatch whose passenger rounding the
shifted milli-term tips; by the receipts the eviction-day histograms are
already reshaped at day 8 (baseline sb0: base has 4 evictions at day 9,
branch's first at day 8), and every block's histogram differs by day 11.

## THE GATES

**rep-focus (the slice's own five), both backends: 10/10 green** at b24e8ae.

**Both mutations BIT, each red by name, each reverted** (arm → cluster red →
revert, one deliberate defect in the tree at a time):
- MUTATION A — the one door forgets to saturate: `rep: gains saturate...`
  and `rep: a guest tells HER people...` both red, both backends (6/10).
- MUTATION B — the gate hears only the crabs: those two plus
  `rep: the gate hears a people's OWN word...` red, both backends (4/10).
Tree verified clean afterward: no armed defect, both reverts landed, the
saturation (`game.js:219`) and three-ears (`:12364`) mechanisms live.

**The full battery's honest residue.** The first clean full run read
258/264 with seven distinct reds. Every one was walked to its mechanism —
none was waved through:
1. THREE PINS RE-POINTED, each with its story in the pin comment: the
   cultureways digest (every field byte-identical **except rep**, 50824 →
   35828 — arithmetic moved, behavior did not: the pass's cleanest
   receipt); the hours frozen day-2 fingerprint on seed 1337 (lower resting
   rep → smaller boats → fewer unserved guests → rage 5 → 3 → **more**
   completed sales, coins 13717 → 18963); and the rng day-2 draw count
   (1616 → 1603 — the pass adds ZERO draw sites, so the 13 missing draws
   are exactly the errands of the guests a smaller boat never landed; day 1
   holds at 1726 because the first sailing pre-dates any earn).
2. TWO STAGINGS WALKED, not re-pointed: the hotelier's nearest-free-door
   assertion now judges at MOVE-IN (a closer house can legitimately empty
   later; inspecting at end-of-run asserted a coincidence), and the
   mortality scenario keeps SUDSY solvent until the illness takes her (the
   leaner rep-era economy can bankrupt SUDS SHOWERS first, leaving the
   death nothing to record — how she stays afloat is staging; what her
   death leaves is the test).
3. TWO CULTURE-STAGING REDS → THE GATE TRANSLATION (the ruling item below):
   `pigs: they actually get off the boat` and `brains: a town full of
   thinking heads` both failed with no cultured guest ashore. The bundled
   gates were authored against a rep scale where 100 was the resting state;
   pig 80 / gull 60 are unreachable now by construction. Translated in the
   fixtures — **pig 80 → 55, gull 60 → 40** — regenerated, byte-checked.

**Substrate fix carried:** cherry-picked d997511 (per-index backoff), then
found and fixed its edge — `maxFailedIndexes: 5` is invalid on a 1-arm
manifest (k8s requires ≤ completions), so the chart now takes
`min(maxFailedIndexes, arms)`. Both belong in mainline.

## THE RULING ITEM: how good must a town be before pigs hear of it?

The bundled gates (pig 80, gull 60) were authored against a scale where 100
was a town's RESTING state, so "80" encoded *doing well*. Measured on this
branch (the game's own lab, seed 1337, 12 unsteered days):

    crab word by day:  30 37 37 42 47 49 38 35 40 43 43 43
    her people's word: 35 by day 12, on the pier spill alone

An UNSTEERED town lives at 35-49 and peaks at 49. A TRADING town reaches
60-71 (triple-16 receipts). So `pig: 55` is the faithful translation of
"doing well" — and it means an unsteered town is exactly the town pigs now
correctly refuse.

That broke the old acceptance scenario at its PREMISE, not its mechanism:
"pigs get off the boat in a town nobody staged" assumed an unsteered town
was a town anyone would sail to. Re-staged: the town now buys the growth
matrix's own two things and must still cross the gate on its own trading.

**Matt rules the bar.** Three coherent settings, all one number:
- **55 (shipped)** — pigs are a reward for a well-run town; a mediocre town
  never sees one. Faithful to the original intent.
- **~40** — pigs come to any town that is not actively failing; the pig
  economy (pork buns, settlers, the WALLOW) gets much more play.
- **~30** — pigs are ambient; the gate stops being a goal.
The mechanism is proved at every setting (the three-ears scenario pins own
word / hearsay / soured independently of the number).

## WHAT I WOULD WANT RULED ALONGSIDE IT

1. The **growth +4** (13/48 -> 17/48). Reported, not tuned. If the pass
   should be net-neutral rather than mildly kind to a well-run early town,
   the honest lever is the sink sizes, not the saturation.
2. **REP_SPILL = 25%** — how loudly the pier gossips across peoples. It is
   the whole bootstrap for a new culture's word, and it is a guess.
3. Whether the ferry's VOLUME should read the crabs' word (it does) or the
   arriving culture's own. Today a beloved-by-pigs, disliked-by-crabs town
   still sails small boats.

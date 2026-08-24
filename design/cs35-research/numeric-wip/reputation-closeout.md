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

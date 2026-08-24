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

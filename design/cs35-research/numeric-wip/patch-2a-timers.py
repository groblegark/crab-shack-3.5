#!/usr/bin/env python3
"""slice 2a, patch C: every sim timer becomes a tick count.

Two families collapse into one unit. The `-= dt` timers were REAL SECONDS and
the `-= dt * TS` timers were GAME MINUTES; both are now integer ticks (20 a
real second, 5 a game minute), so the whole sim decrements by the same `dtT`.
Constants keep their readable definition and carry the conversion in it -
`12 * SEC` still says twelve seconds out loud. Random durations mint WHOLE
ticks from the SAME draw, in the same order: `srand() * 4` seconds becomes
`(srand() * 4 * SEC) | 0`, one draw in, one integer out.

The VIEW timers (toast, saveMsg, the arming chips, the report and departure
cards, the floaters, winT) are deliberately NOT here: they are the render's,
they never gate a sim decision, and the design keeps the view on floats.
"""
p = "game.js"
s = open(p).read()
n = 0


def sub(old, new, count=1):
    global s, n
    assert s.count(old) == count, f"expected {count} of {old[:64]!r}, found {s.count(old)}"
    s = s.replace(old, new)
    n += count


# ---------------------------------------------------------------- the units
sub("const TICK_HZ = 20;               // sim ticks per real second",
    """const TICK_HZ = 20;               // sim ticks per real second
const SEC = TICK_HZ;              // ...so a duration written in seconds reads as one
const GMIN = 5;                   // ticks per GAME minute (4 game-min a second)""")

# ---------------------------------------------------------------- constants
for old, new in [
    ("const TAP_SIP = 6;         //", "const TAP_SIP = 6 * SEC;   //"),
    ("const TAP_CD = 20;           //", "const TAP_CD = 20 * SEC;     //"),
    ("const SOUP_MINS = 11;        //", "const SOUP_MINS = 11 * SEC;  //"),
    ("const SOUP_CD = 20;          //", "const SOUP_CD = 20 * SEC;    //"),
    ("const VOTE_SECS = 5;             //", "const VOTE_SECS = 5 * SEC;       //"),
    ("const VOTE_CD = 12;              //", "const VOTE_CD = 12 * SEC;        //"),
    ("const BUS_SECS = 1.3;   //", "const BUS_SECS = 1.3 * SEC;   //"),
    ("const WANDER_DWELL = 14;      //", "const WANDER_DWELL = 14 * SEC;  //"),
    ("const WANDER_CD = 20;         //", "const WANDER_CD = 20 * SEC;   //"),
    ("const BALL_SECS = 12;         //", "const BALL_SECS = 12 * SEC;   //"),
    ("const BALL_CD = 300;          //", "const BALL_CD = 300 * GMIN;   //"),
    ("const CHAT_SECS = 10;         //", "const CHAT_SECS = 10 * SEC;   //"),
    ("const NOD_MIN = 2, NOD_SPAN = 3;   //", "const NOD_MIN = 2 * SEC, NOD_SPAN = 3 * SEC;   //"),
    ("const ORDER_IDLE = 2.5;   //", "const ORDER_IDLE = 2.5 * SEC;   //"),
    ("const STUCK_WINDOW = 1.5;   //", "const STUCK_WINDOW = 1.5 * SEC;   //"),
    ("const VIS_THINK = 1.6;           //", "const VIS_THINK = 1.6 * SEC;     //"),
    ("const REST_HOURS = 9;   //", "const REST_HOURS = 9 * 60 * GMIN;   //"),
]:
    sub(old, new)

# ---------------------------------------------------------------- decrements
# seconds family AND game-minute family both land on the same integer `dtT`.
for spec in [
    ("  c.ballT -= dt;", "  c.ballT -= dtT;", 1),
    ("  c.chatT -= dt;", "  c.chatT -= dtT;", 1),
    ("    if (c._offPause > 0) { c._offPause -= dt; return; }", "    if (c._offPause > 0) { c._offPause -= dtT; return; }", 1),
    ("  if (c.quip) { c.quip.t -= dt; if (c.quip.t <= 0) c.quip = null; }", "  if (c.quip) { c.quip.t -= dtT; if (c.quip.t <= 0) c.quip = null; }", 1),
    ("  c.quipT -= dt;", "  c.quipT -= dtT;", 1),
    ("  if (c.pauseT > 0) { c.pauseT -= dt; return; }", "  if (c.pauseT > 0) { c.pauseT -= dtT; return; }", 1),
    ("    bus.dwellT -= dt;", "    bus.dwellT -= dtT;", 1),
    ("  if (c.errandCd > 0) c.errandCd -= dt;", "  if (c.errandCd > 0) c.errandCd -= dtT;", 1),
    ("    c.workT -= dt;", "    c.workT -= dtT;", 5),
    ("  c.tapT -= dt;", "  c.tapT -= dtT;", 1),
    ("    o.idleT -= dt;", "    o.idleT -= dtT;", 1),
    ("    c.detour.t -= dt;", "    c.detour.t -= dtT;", 1),
    ("    c.roastT -= dt;", "    c.roastT -= dtT;", 1),
    ("    c.napT -= dt;", "    c.napT -= dtT;", 1),
    ("      c.wanderT -= dt;", "      c.wanderT -= dtT;", 1),
    ("    if (c.wanderCd > 0) c.wanderCd -= dt;", "    if (c.wanderCd > 0) c.wanderCd -= dtT;", 1),
    ("  k.thinkT -= dt;", "  k.thinkT -= dtT;", 1),
    ("    if (k.idleT > 0) { k.idleT -= dt; return; }", "    if (k.idleT > 0) { k.idleT -= dtT; return; }", 1),
    ("      k.showerT -= dt;", "      k.showerT -= dtT;", 1),
    ("      k.waitT -= dt;", "      k.waitT -= dtT;", 1),
    ("      k.dineT -= dt;", "      k.dineT -= dtT;", 1),
    ("    c.idleT = (c.idleT || 0) + dt;", "    c.idleT = (c.idleT || 0) + dtT;", 1),
]:
    sub(*spec)

# game-minute family: -= dt * TS / += dt * TS  ->  the same tick unit
for spec in [
    ("    if ((c.chatCd || 0) > 0) c.chatCd -= dt * TS;", "    if ((c.chatCd || 0) > 0) c.chatCd -= dtT;", 1),
    ("    if ((c.ballCd || 0) > 0) c.ballCd -= dt * TS;", "    if ((c.ballCd || 0) > 0) c.ballCd -= dtT;", 1),
    ("  B.countT += dt * TS;   // the count runs on the town clock, not on frames",
     "  B.countT += dtT;   // the count runs on the town clock, not on frames", 1),
    ("  while (B.counted < B.cast.length && B.countT >= COUNT_MINS) {",
     "  while (B.counted < B.cast.length && B.countT >= COUNT_MINS * GMIN) {", 1),
    ("  if (c._blocked) c.bounceT = (c.bounceT || 0) + dt * TS;",
     "  if (c._blocked) c.bounceT = (c.bounceT || 0) + dtT;", 1),
]:
    sub(*spec)

# ---------------------------------------------------------------- assignments
for spec in [
    # random durations: same draw, minted as whole ticks
    ("      c.ballT = BALL_SECS + srand() * 4;", "      c.ballT = BALL_SECS + ((srand() * 4 * SEC) | 0);", 1),
    ("    c.chatWith = o; c.chatT = CHAT_SECS + srand() * 6;", "    c.chatWith = o; c.chatT = CHAT_SECS + ((srand() * 6 * SEC) | 0);", 1),
    ("      c._offWt = null; c._offPause = 2 + srand() * 5;", "      c._offWt = null; c._offPause = 2 * SEC + ((srand() * 5 * SEC) | 0);", 1),
    ("    c.quipT = 14 + srand() * 18;", "    c.quipT = 14 * SEC + ((srand() * 18 * SEC) | 0);", 1),
    ("    c.napT = NOD_MIN + srand() * NOD_SPAN;", "    c.napT = NOD_MIN + ((srand() * NOD_SPAN) | 0);", 1),
    ("        c.wanderT = WANDER_DWELL + srand() * 10;", "        c.wanderT = WANDER_DWELL + ((srand() * 10 * SEC) | 0);", 1),
    ("    cust.state = \"dining\"; cust.dineT = 6 + srand() * 4;", "    cust.state = \"dining\"; cust.dineT = 6 * SEC + ((srand() * 4 * SEC) | 0);", 1),
    ("    v.thinkT = i * 3 + srand() * 8;   // ...and they do not all want lunch at 9:01",
     "    v.thinkT = i * 3 * SEC + ((srand() * 8 * SEC) | 0);   // ...and they do not all want lunch at 9:01", 1),
    ("  if (visStep(k, k.target, FLOOR_Y, dt)) k.idleT = 2 + srand() * 5;",
     "  if (visStep(k, k.target, FLOOR_Y, dt)) k.idleT = 2 * SEC + ((srand() * 5 * SEC) | 0);", 1),
    ("k.state = \"dining\"; k.dineT = 6 + srand() * 4;", "k.state = \"dining\"; k.dineT = 6 * SEC + ((srand() * 4 * SEC) | 0);", 1),
    # fixed durations
    ("  c.ballT = 0; c.errandCd = 4; c.ballCd = BALL_CD;", "  c.ballT = 0; c.errandCd = 4 * SEC; c.ballCd = BALL_CD;", 1),
    ("  if (tr.pauses && c.pauseT <= 0 && srand() < dt * 0.06) c.pauseT = 1.3;",
     "  if (tr.pauses && c.pauseT <= 0 && srand() < dt * 0.06) c.pauseT = 1.3 * SEC;", 1),
    ("      bus.state = \"dwell\"; bus.dwellT = 2.0; bus.lastStop = s;", "      bus.state = \"dwell\"; bus.dwellT = 2.0 * SEC; bus.lastStop = s;", 1),
    ("      c.errandCd = 3;   // lunch is in the crate - updateFishing roasts it at 0.55",
     "      c.errandCd = 3 * SEC;   // lunch is in the crate - updateFishing roasts it at 0.55", 1),
    ("      c.errandCd = 8;", "      c.errandCd = 8 * SEC;", 1),
    ("      c.duty = false; c.errandCd = 6;", "      c.duty = false; c.errandCd = 6 * SEC;", 1),
    ("    } else c.errandCd = 3;", "    } else c.errandCd = 3 * SEC;", 1),
    ("    if (!beginErrand(c, e, true)) c.errandCd = 2;", "    if (!beginErrand(c, e, true)) c.errandCd = 2 * SEC;", 1),
    ("      c.carrying = r.raw; c.cookStep = 1; c.workT = 0.6;", "      c.carrying = r.raw; c.cookStep = 1; c.workT = 0.6 * SEC;", 1),
    ("{ c.workT = c.cookNeed === \"drink\" ? 1.5 : 3; c.cookStep = 3; }", "{ c.workT = (c.cookNeed === \"drink\" ? 1.5 : 3) * SEC; c.cookStep = 3; }", 1),
    ("      c.errandCd = 25; c.dayState = \"home\";", "      c.errandCd = 25 * SEC; c.dayState = \"home\";", 1),
    ("        c.tapStop = null; c.tapT = 0; c.errandCd = VOTE_CD;", "        c.tapStop = null; c.tapT = 0; c.errandCd = VOTE_CD;", 1),
    ("      c.chainN = (c.chainN || 0) + 1; c.errandCd = 0;", "      c.chainN = (c.chainN || 0) + 1; c.errandCd = 0;", 1),
    ("        c.errandCd = 12; c.dayState = \"home\";", "        c.errandCd = 12 * SEC; c.dayState = \"home\";", 1),
    ("    c.errandCust = null; c.errandCd = 25;", "    c.errandCust = null; c.errandCd = 25 * SEC;", 1),
    ("{ c.order = null; c.dayState = \"home\"; c.errandCd = Math.max(c.errandCd, 1); }",
     "{ c.order = null; c.dayState = \"home\"; c.errandCd = Math.max(c.errandCd, 1 * SEC); }", 1),
    ("    townCatch--; c.roastT = 5;", "    townCatch--; c.roastT = 5 * SEC;", 1),
    ("        c.kstate = \"work\"; c.workMax = c.workT = 0.6; c.slotKind = null; c.slot = -1;",
     "        c.kstate = \"work\"; c.workMax = c.workT = 0.6 * SEC; c.slotKind = null; c.slot = -1;", 1),
    ("{ c.workMax = c.workT = 2.5 / (crabWork(c) * crabEff(c)); c.kstate = \"cleaningStall\"; }",
     "{ c.workMax = c.workT = (2.5 * SEC / (crabWork(c) * crabEff(c))) | 0; c.kstate = \"cleaningStall\"; }", 1),
    ("{ c.workMax = c.workT = BUS_SECS / (crabWork(c) * crabEff(c)); c.kstate = \"busingTable\"; }",
     "{ c.workMax = c.workT = (BUS_SECS / (crabWork(c) * crabEff(c))) | 0; c.kstate = \"busingTable\"; }", 1),
    ("      c.kstate = \"work\"; c.workMax = c.workT = 0.6; c.slotKind = null; c.slot = -1;",
     "      c.kstate = \"work\"; c.workMax = c.workT = 0.6 * SEC; c.slotKind = null; c.slot = -1;", 1),
    ("      c.workMax = c.workT = secs * mult;", "      c.workMax = c.workT = (secs * SEC * mult) | 0;", 1),
    ("      else { cust.state = \"waitStall\"; cust.waitT = 30; }", "      else { cust.state = \"waitStall\"; cust.waitT = 30 * SEC; }", 1),
    ("      k.state = \"roam\"; k.biz = null; k.target = null; k.thinkT = VIS_THINK * 4;",
     "      k.state = \"roam\"; k.biz = null; k.target = null; k.thinkT = VIS_THINK * 4;", 1),
    ("{ k.state = \"showering\"; k.showerT = k.recipe.showerT || 5; }",
     "{ k.state = \"showering\"; k.showerT = (k.recipe.showerT || 5) * SEC; }", 1),
    ("  if (routedStep(c, crabMove(c), dt)) o.idleT = ORDER_IDLE;", "  if (routedStep(c, crabMove(c), dt)) o.idleT = ORDER_IDLE;", 1),
]:
    sub(*spec)

open(p, "w").write(s)
print(f"patch C: {n} timer edits")

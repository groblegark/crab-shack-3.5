#!/usr/bin/env python3
"""slice 2a, patch A: the master tick, the derived clocks, the frame quantizer.

The sim's only clock is now an integer tick, 20 a real second. tmin stays in
whole game minutes - the domain's own grain - as an EXACT floor of the master,
so every `tmin >= 8 * 60` site keeps reading as a clock time and every gate is
an int compare. Proof of equivalence: today a gate fires at the first tick
where tday*0.2 >= X, i.e. tday >= 5X; floored, at the first tick where
floor(tday/5) >= X, i.e. tday >= 5X. The same tick, exactly.
"""
import re, sys

p = "game.js"
s = open(p).read()
n = 0


def sub(old, new, count=1):
    global s, n
    assert s.count(old) == count, f"expected {count} of {old[:70]!r}, found {s.count(old)}"
    s = s.replace(old, new)
    n += count


# ---- the clock header: master tick + the two derived grains
sub(
    """const TS = 4;                     // game minutes per real second
let day = 1, tmin = 7 * 60;      // start day 1, 7:00""",
    """const TS = 4;                     // game minutes per real second
// THE MASTER CLOCK IS AN INTEGER TICK, 20 a real second (slice 2). Everything
// else on this page is a projection of it:
//   tday  - tick of day, 0..7199 (1440 game minutes at 4 min/s)
//   tmin  - whole game MINUTES, floor(tday/5); the domain's own grain, and
//           what every shop-hours and shift gate is written in
//   viewT - float seconds, for the DRAW layer only (clouds, gulls, waves)
// tmin is derived rather than accumulated, which is the whole point: a float
// tmin advanced by 0.2 a tick overshoots 1440 by 1.9e-10 a day and carries the
// residue across midnight forever. Floored from the master it is exact, and it
// fires on the same tick the float did - a gate at X minutes fires when
// tday >= 5X either way.
const TICK_HZ = 20;               // sim ticks per real second
const TICK_MIN = 5;               // ticks per game minute (TS=4 -> 60/4/... = 5)
const DAY_TICKS = 1440 * TICK_MIN;   // 7200, and midnight is exact
let day = 1, T = 0, tday = 7 * 60 * TICK_MIN;   // start day 1, 7:00
let tmin = 7 * 60, viewT = 0;     // DERIVED from tday/T - never accumulated
function reclock() { tmin = (tday - tday % TICK_MIN) / TICK_MIN; viewT = T / TICK_HZ; }""",
)

# ---- the frame: wall milliseconds in, whole ticks out
sub(
    """  const raw = Math.max(0, Math.min(0.1, (now - last) / 1000));
  const dt = raw * TURBO * (ffSleep ? 6 : FF_SPEED[ffMode]);
  last = now; time += dt;""",
    """  // THE QUANTIZER. Wall milliseconds in, WHOLE TICKS out, with the remainder
  // carried in an accumulator so a 60Hz browser (16.7ms - a third of a tick)
  // still advances the world instead of freezing at floor(0.33) = 0. Headless
  // steps exactly 50ms, so rawTicks is exactly 1 and msAcc never leaves 0 -
  // the sim's arithmetic is integer whether or not the clock feeding it is.
  const rawMs = Math.max(0, Math.min(100, now - last));
  msAcc += rawMs;
  const rawTicks = (msAcc - msAcc % 50) / 50;
  msAcc -= rawTicks * 50;
  const dtT = rawTicks * TURBO * (ffSleep ? 6 : FF_SPEED[ffMode]);   // ticks this frame
  const dt = dtT / TICK_HZ;   // seconds, for the view-side timers that still read them
  last = now; T += dtT;""",
)

# ---- midnight, in whole ticks
sub(
    """  if (!gameOver && screen === "play") tmin += dt * TS;
  if (tmin >= 1440) {
    tmin -= 1440; day++;""",
    """  if (!gameOver && screen === "play") tday += dtT;
  reclock();
  if (tday >= DAY_TICKS) {
    tday -= DAY_TICKS; reclock(); day++;
    mistRoll();   // tonight's shore, drawn once and held as an integer""",
)

# ---- the sim's own `time` dies; the draw layer keeps a float projection
sub("let coins = 0, lifetime = 0, time = 0;", "let coins = 0, lifetime = 0;")
sub("let last = performance.now(), saveT = 0;", "let last = performance.now(), saveT = 0, msAcc = 0;")

# sim consumers -> the integer tick
sub("  const key = time + \":\" + n;", "  const key = T + \":\" + n;")
sub("  if (_offStamp === time && _offGen === rosterGen) return;\n  _offStamp = time;",
    "  if (_offStamp === T && _offGen === rosterGen) return;\n  _offStamp = T;")
sub("    if (quiet) { coins += amt; lifetime += amt; earnHist.push({ t: time, amt }); sfx.coin(); }",
    "    if (quiet) { coins += amt; lifetime += amt; earnHist.push({ t: T, amt }); sfx.coin(); }")
sub("  if (a.k === \"player\") { coins += d; earnHist.push({ t: time, amt: d }); }",
    "  if (a.k === \"player\") { coins += d; earnHist.push({ t: T, amt: d }); }")
sub("  earnHist.push({ t: time, amt });", "  earnHist.push({ t: T, amt });")
sub("  earnHist.push({ t: time, amt: -amt });   // income rate is net",
    "  earnHist.push({ t: T, amt: -amt });   // income rate is net")
sub(
    """  while (earnHist.length && earnHist[0].t < time - 60) earnHist.shift();
  if (!earnHist.length) return 0;
  return earnHist.reduce((s, e) => s + e.amt, 0) / Math.max(10, time - earnHist[0].t);""",
    """  while (earnHist.length && earnHist[0].t < T - 60 * TICK_HZ) earnHist.shift();
  if (!earnHist.length) return 0;
  return earnHist.reduce((s, e) => s + e.amt, 0) / Math.max(10, (T - earnHist[0].t) / TICK_HZ);""",
)

# draw-only consumers -> the view clock
for spec in [
    ("const ph = ((time * 0.7 + t.x * 0.01) % 1);", "const ph = ((viewT * 0.7 + t.x * 0.01) % 1);", 2),
    ("const ph = ((time * 0.7 + k.x * 0.01) % 1);", "const ph = ((viewT * 0.7 + k.x * 0.01) % 1);"),
    ("    if (night && (i * 3 + 1 + ((time * 0.2) | 0)) % 4)", "    if (night && (i * 3 + 1 + ((viewT * 0.2) | 0)) % 4)"),
    ("    const lit = ((time * 0.85) % 4) < 1.2;", "    const lit = ((viewT * 0.85) % 4) < 1.2;"),
    ("  const bob = sleeping ? (Math.sin(time * 1.6 + c.animT) > 0 ? 1 : 0)   // slow breathing",
     "  const bob = sleeping ? (Math.sin(viewT * 1.6 + c.animT) > 0 ? 1 : 0)   // slow breathing"),
    ("    const ph = (time * 0.45 + c.animT * 0.37) % 1;", "    const ph = (viewT * 0.45 + c.animT * 0.37) % 1;"),
    ("    const bobb = Math.sin(time * 3 + c.animT) > 0 ? 0 : 1;", "    const bobb = Math.sin(viewT * 3 + c.animT) > 0 ? 0 : 1;"),
]:
    sub(*spec)

s = s.replace("Math.sin(y * 0.55 - time * 0.5)", "Math.sin(y * 0.55 - viewT * 0.5)")
s = s.replace("Math.sin(time * 0.17 + i * 2.3)", "Math.sin(viewT * 0.17 + i * 2.3)")
s = s.replace("((time * (5 + i * 3) + i * 130)", "((viewT * (5 + i * 3) + i * 130)")
s = s.replace("((time * 4 - camX * 0.4)", "((viewT * 4 - camX * 0.4)")
s = s.replace("((time * 2.5 - camX * 0.3 + 160)", "((viewT * 2.5 - camX * 0.3 + 160)")
s = s.replace("const gt = time % 24;", "const gt = viewT % 24;")
s = s.replace("GULL[((time * 4) | 0) % 2]", "GULL[((viewT * 4) | 0) % 2]")
s = s.replace("Math.sin(time * 2) * 3", "Math.sin(viewT * 2) * 3")

open(p, "w").write(s)
left = len(re.findall(r"(?<![\w.$])time(?![\w$])", s))
print(f"patch A: {n} named edits; residual bare `time` tokens: {left}")

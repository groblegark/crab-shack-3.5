#!/usr/bin/env python3
"""numeric slice 3: needs -> Q20. Core pass.

Every 0..1 need (hunger/thirst/dirt/bored/tired) becomes an int 0..2^20.
Authored fractions cross into Q20 at their READ boundary via qn(), exactly
as slice 1's author-dollar tables cross x100 -- the sim's running state and
arithmetic are pure ints.
"""
import re, sys

P = "game.js"
s = open(P).read()
orig = s
Q20 = 1 << 20
edits = []

def sub1(old, new, why):
    global s
    if s.count(old) != 1:
        print("MISS(%d) %s :: %s" % (s.count(old), why, old[:70]))
        return False
    s = s.replace(old, new)
    edits.append(why)
    return True

def qn(f):
    return int(round(f * Q20))

# ---------------------------------------------------------------- 1. the unit
sub1("const GMIN = 5;                   // ticks per GAME minute (4 game-minutes a second)",
     """const GMIN = 5;                   // ticks per GAME minute (4 game-minutes a second)
// ---- NEEDS IN Q20 (numeric slice 3) --------------------------------------
// A need is an int 0..Q20, never a float. Authored 0..1 fractions cross the
// boundary through qn() at their READ site - const definitions and cold
// checks - exactly as slice 1's author-dollar tables cross x100. What the
// sim STORES and what it does arithmetic on are integers, all the way down.
const Q20 = 1048576;                  // 2^20: a full bar
const qn = (f) => Math.round(f * Q20);   // authored 0..1 -> Q20, at the boundary
const TICKS_PER_GH = 60 * GMIN;       // 300 ticks a game hour""",
     "Q20 unit + qn boundary helper")

# ---------------------------------------------------------- 2. rate constants
# Per-tick accrual is BAKED with round-half-up, not floored. Flooring all five
# rates runs needs 1.19% slow (measured) - every one of them in the same
# direction, which is a town that is quietly easier every slice. Nearest
# rounding lands at -0.02% with mixed signs, and the format table's own worked
# example (0.115/hr -> 402) is the nearest value, not the floor.
VIS = {"hunger": 0.115, "thirst": 0.055, "dirt": 0.090, "bored": 0.045, "tired": 0.048}
per_tick = {k: int(round(v * Q20 / 300.0)) for k, v in VIS.items()}
sub1("const VIS_RATE = { hunger: 0.115, thirst: 0.055, dirt: 0.090, bored: 0.045, tired: 0.048 };",
     "// Q20 PER TICK, round-half-up from the authored per-hour rates (0.115/hr =\n"
     "// 401.95 q20/tick -> 402). Rounding to NEAREST and not flooring is the whole\n"
     "// point: flooring all five runs the town's needs 1.19%% slow, every one in the\n"
     "// same direction, which is a quietly easier game bought by arithmetic.\n"
     "const VIS_RATE = { hunger: %d, thirst: %d, dirt: %d, bored: %d, tired: %d };   // per TICK, Q20"
     % (per_tick["hunger"], per_tick["thirst"], per_tick["dirt"], per_tick["bored"], per_tick["tired"]),
     "VIS_RATE -> per-tick Q20 ints")

# authored-fraction constants -> Q20 at the definition
for name, val, tail in [
    ("TAP_AT", 0.72, None), ("TAP_QUENCH", 0.5, None), ("TAP_APPEAL", 0.35, "keep"),
    ("TAP_RINSE", 0.35, None), ("SOUP_AT", 0.80, None), ("SOUP_SICK_AT", 0.62, None),
    ("SOUP_FILL", 0.45, None), ("WALKOUT_AT", 0.95, None), ("BALL_AT", 0.66, None),
    ("BALL_JOIN", 0.48, None), ("BALL_YIELD", 0.55, None), ("DRAG_HUNGER_AT", 0.3, None),
    ("BERTH_AT", 0.6, None),
]:
    if tail == "keep":
        continue   # TAP_APPEAL is an errand-rank weight, not a need level
    m = re.search(r"^const %s = %s;" % (name, re.escape(repr(val).rstrip("0").rstrip(".") if val != 0.5 else "0.5")),
                  s, re.M)
    if not m:
        m = re.search(r"^const %s = [0-9.]+;" % name, s, re.M)
    if not m:
        print("MISS const", name)
        continue
    s = s[:m.start()] + "const %s = qn(%s);" % (name, val) + s[m.end():]
    edits.append("%s -> qn" % name)

open(P, "w").write(s)
print("\n%d edits" % len(edits))
for e in edits:
    print("  -", e)
print("\nper-tick Q20 rates:", per_tick)

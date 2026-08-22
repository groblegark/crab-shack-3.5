#!/usr/bin/env python3
"""slice 2a, patch D: the hours/minutes stragglers, and the save takes ticks.

restT was HOURS, otMin and mistMin and ferryT were GAME MINUTES, stuckT and
castT were SECONDS - all five are tick counts now, so nothing in the sim
carries a unit that cannot be counted. otPremium takes ticks and divides by
GMIN inside the SAME rational, which keeps it one exact division rather than
two. The four that persist (restT, ferryT, mistMin, and the ballot count)
migrate at load on the `_num` staging slice 1 built.
"""
p = "game.js"; s = open(p).read(); n = 0
def sub(old, new, count=1):
    global s, n
    assert s.count(old) == count, f"expected {count} of {old[:64]!r}, found {s.count(old)}"
    s = s.replace(old, new); n += count

# --- the sick-bed rest clock: hours -> ticks
sub("  if (c.p.sick && darkness() < 0.7) c.p.restT = (c.p.restT || 0) + dt * TS / 60;",
    "  if (c.p.sick && darkness() < 0.7) c.p.restT = (c.p.restT || 0) + dtT;")
sub('smallText(ctx, "RESTED " + (p.restT || 0).toFixed(1) + "H/" + REST_HOURS',
    'smallText(ctx, "RESTED " + ((p.restT || 0) / (60 * GMIN)).toFixed(1) + "H/" + (REST_HOURS / (60 * GMIN))')
# --- tired recovery still reads a float need (slice 3), but off the integer tick
sub("    c.p.tired = Math.max(0, (c.p.tired || 0) * (1 - rate * dt * TS / 60));",
    "    c.p.tired = Math.max(0, (c.p.tired || 0) * (1 - rate * dtT / (60 * GMIN)));", 2)
sub("      + TIRED_SHIFT / ownStdSpan(c) * (onOT ? OT_FATIGUE : 1) * dt * TS);",
    "      + TIRED_SHIFT / ownStdSpan(c) * (onOT ? OT_FATIGUE : 1) * dtT / GMIN);")
# --- overtime: ticks in, and the minute conversion folds into the one rational
sub("    if (onOT) c.otMin = (c.otMin || 0) + dt * TS;", "    if (onOT) c.otMin = (c.otMin || 0) + dtT;")
sub("""function otPremium(c, mins) {
  const span = Math.max(1, ownStdSpan(c));
  return Math.floor(wageRate(c) * 3 * Math.max(0, mins) / (2 * span));
}""",
    """function otPremium(c, ticks) {   // ticks in; the minute conversion rides in the divisor
  const span = Math.max(1, ownStdSpan(c));
  return Math.floor(wageRate(c) * 3 * Math.max(0, ticks) / (2 * span * GMIN));
}""")
sub("function otPayForecast(c) { return otEligible(c) ? otPremium(c, otMinutes(c)) : otPayToday(c); }",
    "function otPayForecast(c) { return otEligible(c) ? otPremium(c, otMinutes(c) * GMIN) : otPayToday(c); }")
sub("    const load = shiftLoad(c), otF = (c.otMin || 0) / ownStdSpan(c);",
    "    const load = shiftLoad(c), otF = (c.otMin || 0) / GMIN / ownStdSpan(c);")
sub("  if ((c.otMin || 0) >= 15)", "  if ((c.otMin || 0) >= 15 * GMIN)")
sub('crabLog(c, "work", "WORKED " + Math.round(c.otMin / 6) / 10 + "H OF OVERTIME", 0);',
    'crabLog(c, "work", "WORKED " + Math.round(c.otMin / (6 * GMIN)) / 10 + "H OF OVERTIME", 0);')
# --- the two timers the first sweep missed
sub("  c.stuckT += dt;", "  c.stuckT += dtT;")
sub("c.castT = 3 + srand() * 6; }", "c.castT = 3 * SEC + ((srand() * 6 * SEC) | 0); }")
sub("  c.castT = (c.castT || 5) - dt;", "  c.castT = (c.castT || 5 * SEC) - dtT;")
# --- the evening's mist exposure, and the ferry alongside
sub("    stayOf(k).mistMin += dt * TS;", "    stayOf(k).mistMin += dtT;")
sub("    w: (r) => r.mistMin >= 100 ? 20 + Math.min(12, r.mistMin / 30) : 0,",
    "    w: (r) => r.mistMin >= 100 * GMIN ? 20 + Math.min(12, r.mistMin / (30 * GMIN)) : 0,")
sub("const FERRY_STAY = 75;                   // game-minutes tied up",
    "const FERRY_STAY = 75 * GMIN;            // game-minutes tied up, counted in ticks")
sub("  runFerry(dt * TS);    // the timetable: she docks, lands a batch, and sails",
    "  runFerry(dtT);        // the timetable: she docks, lands a batch, and sails")
sub("function runFerry(dtMin) {", "function runFerry(dtTicks) {")
sub("    ferryT -= dtMin;", "    ferryT -= dtTicks;")
sub("  const hrs = dt * TS / 60;", "  const hrs = dtT / (60 * GMIN);")

# --- the save speaks ticks, and an older envelope is converted on the way in
sub("    _num: 1,", "    _num: 2,")
sub("""  const preCents = !s._num;
  if (preCents) centsEnvelope(s);""",
    """  const preCents = !s._num;
  if (preCents) centsEnvelope(s);
  // NUMERIC SLICE 2 (ticks). The four persisted clocks were hours, game
  // minutes and game minutes; they are tick counts now. Staged on the same
  // `_num` counter slice 1 built, so a float-era save walks both steps.
  if (!s._num || s._num < 2) ticksEnvelope(s);""")
sub("""// NUMERIC SLICE 1 (cents), stage one of two. An envelope without `_num` is a""",
    """// NUMERIC SLICE 2 (ticks): every persisted clock crosses to the tick grain.
// tmin is stored in whole game minutes and STAYS there - it is the domain's
// own unit and the tick of day is rebuilt from it exactly (5 ticks a minute).
function ticksEnvelope(s) {
  const M = 5, H = 300;   // ticks per game minute / per game hour
  if (s.ferry) s.ferry.t = Math.round((+s.ferry.t || 0) * M);
  for (const p of s.personas || []) {
    if (p.restT) p.restT = Math.round(p.restT * H);
    if (p.otMin) p.otMin = Math.round(p.otMin * M);
  }
  for (const st of (s.stays || [])) if (st.mi != null && st.mi < 99999) st.mi = Math.round(st.mi * M);
  s._num = 2;
}

// NUMERIC SLICE 1 (cents), stage one of two. An envelope without `_num` is a""")
# tday is rebuilt from the saved whole-minute tmin
sub("  day = s.day || 1; tmin = s.tmin != null ? s.tmin : 7 * 60;",
    """  day = s.day || 1;
  tday = Math.max(0, Math.min(DAY_TICKS - 1, Math.round((s.tmin != null ? s.tmin : 7 * 60) * TICK_MIN)));
  reclock(); mistRoll();""")
open(p, "w").write(s)
print(f"patch D: {n} edits")

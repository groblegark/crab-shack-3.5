import sys
p = "game.js"
s = open(p).read()
n0 = len(s)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# --- F1. the ballot's dollar purses go to cents; the percent purses (levy,
# rents) stay percentages - a rate is not money ---
rep("""  dues:  { name: "HARBOUR DUES", short: "DUES", unit: "$ A HEAD",
    who: "EVERY VISITOR THE FERRY LANDS", steps: [0, 1, 2, 3, 4] },""",
    """  dues:  { name: "HARBOUR DUES", short: "DUES", unit: "$ A HEAD",
    who: "EVERY VISITOR THE FERRY LANDS", steps: [0, 100, 200, 300, 400] },   // cents""")
rep("""  tin:   { name: "THE COLLECTION TIN", short: "TIN", unit: "$ ASKED OF EACH",
    who: "WHOEVER CAN SPARE IT", steps: [0, 1, 2, 3, 4] },""",
    """  tin:   { name: "THE COLLECTION TIN", short: "TIN", unit: "$ ASKED OF EACH",
    who: "WHOEVER CAN SPARE IT", steps: [0, 100, 200, 300, 400] },   // cents""")
rep("""const WAGE_FLOOR = { name: "THE WAGE FLOOR", short: "FLOOR", unit: "$ A DAY, LOWEST PAID",
  who: "EVERY TILL THAT MEETS A PAYROLL", steps: [0, 18, 23, 27, 32] };""",
    """const WAGE_FLOOR = { name: "THE WAGE FLOOR", short: "FLOOR", unit: "$ A DAY, LOWEST PAID",
  who: "EVERY TILL THAT MEETS A PAYROLL", steps: [0, 1800, 2300, 2700, 3200] };   // cents""")

# --- F2. the fund's doors take whole cents and nothing else: every movement
# through the fund floors at the door, so a float upstream (a levy share, a
# rent cut) can never put a fraction of a cent into a real balance ---
rep("""function fundTake(a, amt, why) {
  const take = Math.min(Math.max(0, amt), acctBal(a));""",
    """function fundTake(a, amt, why) {
  const take = Math.min(Math.floor(Math.max(0, amt)), acctBal(a));   // whole cents through the door""")
rep("""function fundPay(b, amt, why) {
  const a = bizAcct(b);
  const pay = Math.min(Math.max(0, amt), townFund.bal);""",
    """function fundPay(b, amt, why) {
  const a = bizAcct(b);
  const pay = Math.min(Math.floor(Math.max(0, amt)), townFund.bal);""")
rep("""function fundRemit(amt, who, why) {
  const pay = Math.min(Math.max(0, amt), townFund.bal);""",
    """function fundRemit(amt, who, why) {
  const pay = Math.min(Math.floor(Math.max(0, amt)), townFund.bal);""")

# --- F3. the office's own arithmetic goes exact ---
rep("  for (let i = 0; i < givers.length && got < short - 0.005; i++) {",
    "  for (let i = 0; i < givers.length && got < short; i++) {   // cents: exact")
rep("  if (paid >= owed - 0.005) { townFund.arrears = 0; townFund.strikes = 0; }",
    "  if (paid >= owed) { townFund.arrears = 0; townFund.strikes = 0; }   // cents: exact")
rep("    townFund.arrears = Math.round((owed - paid) * 100) / 100;",
    "    townFund.arrears = owed - paid;   // cents")

# --- F4. credit: the line in cents, and the two fractional terms as exact
# integer arithmetic (0.35 is not a binary number; 20 * 0.35 is 7.0000...01
# and Math.ceil would have charged the extra cent) ---
rep("  LIMIT: 90,           // base line (tightened from 120 when T2 landed - runways compound)",
    "  LIMIT: 9000,         // cents. base line (tightened when T2 landed - runways compound)")
rep("  LIMIT_PER_CREW: 70,  // the bank lends against payroll: extra headroom per crew beyond the founders",
    "  LIMIT_PER_CREW: 7000,   // cents. the bank lends against payroll: extra headroom per crew beyond the founders")
rep("  MIN_BASE: 12,        // ...plus a floor - proportional, so small debts don't crush a growing town",
    "  MIN_BASE: 1200,      // cents ...plus a floor - proportional, so small debts don't crush a growing town")
rep("  if (r.bal > 0) { r.interest = Math.ceil(r.bal * CREDIT_CFG.RATE); r.bal += r.interest; }",
    "  if (r.bal > 0) { r.interest = Math.ceil(r.bal / 4); r.bal += r.interest; }   // RATE 0.25 as the exact int idiom")
rep("  const minDue = r.bal > 0 ? Math.min(r.bal, r.interest + Math.ceil((r.bal - r.interest) * CREDIT_CFG.MIN_FRAC) + CREDIT_CFG.MIN_BASE) : 0;",
    "  const minDue = r.bal > 0 ? Math.min(r.bal, r.interest + Math.ceil((r.bal - r.interest) * 35 / 100) + CREDIT_CFG.MIN_BASE) : 0;   // MIN_FRAC 0.35 exact: x35 is an exact int, /100 never lands within an ulp of a boundary")
rep("  const int2 = Math.ceil(credit.bal * CREDIT_CFG.RATE);",
    "  const int2 = Math.ceil(credit.bal / 4);")
rep("  return Math.min(credit.bal + int2, int2 + Math.ceil(credit.bal * CREDIT_CFG.MIN_FRAC) + CREDIT_CFG.MIN_BASE);",
    "  return Math.min(credit.bal + int2, int2 + Math.ceil(credit.bal * 35 / 100) + CREDIT_CFG.MIN_BASE);   // MIN_FRAC 0.35 as the exact int idiom")

# --- F5. the spare-$2 rule: a crab keeps walking-around money back ---
for old, cnt in [
  ("c.p.wallet >= staffMealCharge(\"shack\", r) + 2)", 2),
  ("c.p.wallet >= localPrice(\"shack\", r) + 2)", 2),
  ("c.p.wallet >= localPrice(drinkAt, r) + 2)", 1),
  ("c.p.wallet >= staffMealCharge(c.p.job, r) + 2)", 1),
  ("c.p.wallet >= localPrice(\"showers\", rinseR) + 2", 1),
  ("c.p.wallet >= localPrice(\"arcade\", r) + 2)", 1),
  ("c.p.wallet >= localPrice(b, r) + 2 ?", 2),
]:
    assert s.count(old) == cnt, f"MATCH {s.count(old)} != {cnt}: {old!r}"
    s = s.replace(old, old.replace("+ 2", "+ 200"), cnt)

# --- F6. the broke lines on the cards (state, not paint: they gate the label) ---
rep("  if (c.p.wallet < 10) return [\"BROKE\", [190, 80, 80]];",
    "  if (c.p.wallet < 1000) return [\"BROKE\", [190, 80, 80]];")
rep("  if (k.state === \"roam\") return k.wallet < 6 ? \"OUT OF MONEY, TAKING IT IN\"",
    "  if (k.state === \"roam\") return k.wallet < 600 ? \"OUT OF MONEY, TAKING IT IN\"")
rep("  if (k.wallet < 6) return [\"SPENT UP\", [150, 120, 90]];",
    "  if (k.wallet < 600) return [\"SPENT UP\", [150, 120, 90]];")
rep("    k.wallet < 6 ? [190, 80, 80] : [140, 110, 40]);",
    "    k.wallet < 600 ? [190, 80, 80] : [140, 110, 40]);")

open(p, "w").write(s)
print(f"patched F: {len(s)-n0:+d} bytes")

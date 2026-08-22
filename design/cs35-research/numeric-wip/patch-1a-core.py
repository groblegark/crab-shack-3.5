import sys
p = "game.js"
s = open(p).read()
n0 = len(s)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# --- A. constants become cents (comments carry the unit) ---
rep("const WAGE_STD = 23;", "const WAGE_STD = 2300;   // cents (numeric slice 1a)")
rep("const TABLE_TIP = 9;", "const TABLE_TIP = 900;   // cents")
rep("const BALLOT_PRICE = 0.25;", "const BALLOT_PRICE = 25;      // cents")
rep("const TIN_KEEP = 30;", "const TIN_KEEP = 3000;   // cents")
rep("const WHIP_KEEP = 8;", "const WHIP_KEEP = 800;               // cents")
rep("const FERRY_PRICE = 20000;", "const FERRY_PRICE = 2000000;   // cents")

# --- B. fund core: exact-int gates and ledger ---
rep("ok: Math.abs(delta - want) < 1e-6 });", "ok: delta === want });   // cents: conservation is a THEOREM now")
rep("townFund.ledger.push({ day, kind, amt: Math.round(amt * 100) / 100, who, why });",
    "townFund.ledger.push({ day, kind, amt, who, why });   // amounts ARE cents")
rep("  const take = Math.min(Math.max(0, amt), acctBal(a));\n  if (take < 0.005) return 0;",
    "  const take = Math.min(Math.max(0, amt), acctBal(a));\n  if (take < 1) return 0;   // not a whole cent")
rep("  const pay = Math.min(Math.max(0, amt), townFund.bal);\n  if (!a || pay < 0.005) return 0;",
    "  const pay = Math.min(Math.max(0, amt), townFund.bal);\n  if (!a || pay < 1) return 0;")
rep("  const pay = Math.min(Math.max(0, amt), townFund.bal);\n  if (pay < 0.005) return 0;",
    "  const pay = Math.min(Math.max(0, amt), townFund.bal);\n  if (pay < 1) return 0;")

# --- C. births: prices/wages/tips cross the cent boundary at ONE point each ---
rep("function menuPrice(b, r) { return Math.max(1, Math.round(r.pay * bizPriceMul(b))); }   // what it says on the board",
    "// Catalog pay stays author-dollars (BIZ + cultureway data); the CENT is born\n"
    "// here and nowhere else. Same dollar figure as ever, times a hundred.\n"
    "function menuPrice(b, r) { return 100 * Math.max(1, Math.round(r.pay * bizPriceMul(b))); }")
rep("function upCost(u) { return Math.ceil(u.base * Math.pow(u.mult, u.key === \"chef\" ? u.lvl - 2 : u.lvl)); }",
    "function upCost(u) { return 100 * Math.ceil(u.base * Math.pow(u.mult, u.key === \"chef\" ? u.lvl - 2 : u.lvl)); }   // cents (1b bakes the table)")
open(p, "w").write(s)
print(f"patched core: {len(s)-n0:+d} bytes")

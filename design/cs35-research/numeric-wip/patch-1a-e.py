import sys
p = "game.js"
s = open(p).read()
n0 = len(s)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# --- E1. housing / property constants -> cents ---
rep("const SHELTER_X = 444, MOVE_IN_COST = 35;",
    "const SHELTER_X = 444, MOVE_IN_COST = 3500;   // cents")
rep("const BOAT_COST = 75, MOORING_FEE = 2;",
    "const BOAT_COST = 7500, MOORING_FEE = 200;   // cents")
rep("const CRAB_WAGE = WAGE_STD, HOUSE_RENT = 10;",
    "const CRAB_WAGE = WAGE_STD, HOUSE_RENT = 1000;   // cents")

# --- E2. the leases: rent is a term of the WORLD, held in cents like every
# other balance it settles against (menuPrice-style author-dollars would have
# put a x100 on fifteen read sites; the field is not cultureway data) ---
rep('kind: "palapa", rent: 230,', 'kind: "palapa", rent: 23000,')
rep('kind: "shopfront", rent: 80,', 'kind: "shopfront", rent: 8000,')
rep('kind: "shopfront", rent: 55,', 'kind: "shopfront", rent: 5500,')
rep("rent: 35, owner: \"reef\", lodging: true,", "rent: 3500, owner: \"reef\", lodging: true,")
rep('kind: "shopfront", rent: 35, owner: "sudsy",', 'kind: "shopfront", rent: 3500, owner: "sudsy",')
rep("const HOTEL_ROOMS_BASE = 7, HOTEL_RENT_BASE = 35;",
    "const HOTEL_ROOMS_BASE = 7, HOTEL_RENT_BASE = 3500;   // cents")
rep("  BUILD: 80,       // paid once, to the landlord.",
    "  BUILD: 8000,     // cents. paid once, to the landlord.")
rep("  RENT: 4,         // ...and a night, for good.",
    "  RENT: 400,       // cents ...and a night, for good.")
rep("  FLOOR: 60,       // ...and only with this left in the till afterwards.",
    "  FLOOR: 6000,     // cents ...and only with this left in the till afterwards.")
rep("  RENT: 3,        // a night, per bed past the base.",
    "  RENT: 300,      // cents a night, per bed past the base.")

# --- E3. the sale / rival / hotelier money ---
rep("  FIXTURE: 15,         // ...plus this per fixture",
    "  FIXTURE: 1500,       // cents ...plus this per fixture")
rep("  RESERVE: 30,         // ...and a buyer keeps 3 nights of house rent back",
    "  RESERVE: 3000,       // cents ...and a buyer keeps 3 nights of house rent back")
rep("  WAGE_OVER: 2,          // a wage push lands this far over the best rate in town\n  HOLD: 0.35,",
    "  WAGE_OVER: 200,        // cents: a wage push lands this far over the best rate in town\n  HOLD: 0.35,")
rep("  WORTH: 60,             // ...and she only comes for a house that is TAKING money",
    "  WORTH: 6000,           // cents ...and she only comes for a house that is TAKING money")
rep("  BANKROLL: 800,         // what she brings.",
    "  BANKROLL: 80000,       // cents. what she brings.")
rep("  WAGE_OVER: 2,          // a wage push lands this far over the best rate in town\n  TILL_FLOOR: 40,",
    "  WAGE_OVER: 200,        // cents: a wage push lands this far over the best rate in town\n  TILL_FLOOR: 4000,")
# --- E4. wages: the stepper band, the grain, the pushes ---
rep("const WAGE_MIN = 8, WAGE_MAX = 60;",
    "const WAGE_MIN = 800, WAGE_MAX = 6000;   // cents")
rep("const clampWage = (n) => Math.max(WAGE_MIN, Math.min(WAGE_MAX, Math.round(+n || 0)));",
    "const clampWage = (n) => Math.max(WAGE_MIN, Math.min(WAGE_MAX, 100 * Math.round((+n || 0) / 100)));   // the stepper's whole-dollar grain, kept")
rep("      setBizWage(shop, bizWage(shop) - 1);", "      setBizWage(shop, bizWage(shop) - 100);")
rep("      const want = Math.min(WAGE_MAX, Math.max(bizWage(shop) + 1, best + RIVAL_CFG.WAGE_OVER));",
    "      const want = Math.min(WAGE_MAX, Math.max(bizWage(shop) + 100, best + RIVAL_CFG.WAGE_OVER));")
rep("      setBizWage(b, bizWage(b) - 1);", "      setBizWage(b, bizWage(b) - 100);")
rep("    const want = Math.min(WAGE_MAX, Math.max(bizWage(b) + 1, best + HOTELIER_CFG.WAGE_OVER));",
    "    const want = Math.min(WAGE_MAX, Math.max(bizWage(b) + 100, best + HOTELIER_CFG.WAGE_OVER));")
rep("    setBizWage(b, rate + 1);", "    setBizWage(b, rate + 100);")
rep("      && rate > going * cfg.trimOver && rate - 1 >= WAGE_MIN) {",
    "      && rate > going * cfg.trimOver && rate - 100 >= WAGE_MIN) {")
rep("    setBizWage(b, rate - 1);", "    setBizWage(b, rate - 100);")
rep("      if (hit(R.wm)) { setBizWage(manage, bizWage(manage) - 1); sfx.buy(); save(); return; }",
    "      if (hit(R.wm)) { setBizWage(manage, bizWage(manage) - 100); sfx.buy(); save(); return; }")
rep("      if (hit(R.wp)) { setBizWage(manage, bizWage(manage) + 1); sfx.buy(); save(); return; }",
    "      if (hit(R.wp)) { setBizWage(manage, bizWage(manage) + 100); sfx.buy(); save(); return; }")

# --- E5. the job board: the posting gate, the sign-up tie-break, the drifters ---
rep("    if ((o.till >= 260 && staff < 2) || (staff === 0 && o.till >= bizWage(b) * 2))",
    "    if ((o.till >= 26000 && staff < 2) || (staff === 0 && o.till >= bizWage(b) * 2))")
rep("      cands.sort((a, b2) => a.p.wallet - b2.p.wallet);   // the broke sign up first",
    "      cands.sort((a, b2) => a.p.wallet - b2.p.wallet\n"
    "        || (a.p.name < b2.p.name ? -1 : 1));   // the broke sign up first; cents can tie, the name cannot")
rep("Object.assign(p2, { npc: true, fisher: true, homeless: true, wallet: 12,",
    "Object.assign(p2, { npc: true, fisher: true, homeless: true, wallet: 1200,")
rep("    wallet: 25, job: \"showers\",", "    wallet: 2500, job: \"showers\",")

# --- E6. the visitor purse mint: cents from the SAME draws, same order ---
rep("const ROOM_RATE = BIZ.hotel.recipes[0].pay;",
    "const ROOM_RATE = 100 * BIZ.hotel.recipes[0].pay;   // cents (the recipe table stays author-dollars)")
rep("  let wallet = 32 + srand() * 44 + nights * (ROOM_RATE + 24);",
    "  let wallet = 3200 + srand() * 4400 + nights * (ROOM_RATE + 2400);   // cents; every draw is the pre-cents draw")
rep("  if (srand() < 0.30) wallet += 24 + srand() * 30;    // a flush third of the boat",
    "  if (srand() < 0.30) wallet += 2400 + srand() * 3000;    // a flush third of the boat")
rep("    if (mul !== 1) { v.wallet = Math.max(1, Math.round(v.wallet * mul)); v.purse = v.wallet; }",
    "    if (mul !== 1) { v.wallet = Math.max(100, Math.round(v.wallet * mul)); v.purse = v.wallet; }   // the old $1 floor, in cents")

# --- E7. the visitor pay path: the tip becomes cents BEFORE it is clamped to
# the purse, so the wallet moves by exactly what the till and the ledger see ---
rep("      tip = Math.max(0, Math.min(tip, cust.wallet));",
    "      tip = Math.max(0, Math.min(Math.round(tip), cust.wallet));   // canonical rounding: the tip leaves the purse in whole cents")

# --- E8. flush thresholds: the crabs' own $40 line, the spare-$2 rule,
# the broke lines on the cards ---
for old in [
  "      const r = c.p.wallet > 40 ? affordable[(srand() * affordable.length) | 0] : affordable[0];",
]:
    assert s.count(old) == 2, f"MATCH {s.count(old)} != 2"
    s = s.replace(old,
  "      const r = c.p.wallet > 4000 ? affordable[(srand() * affordable.length) | 0] : affordable[0];", 2)
rep("        const r = c.p.wallet > 40 ? drinks[drinks.length - 1] : drinks[0];   // a COOLER when flush",
    "        const r = c.p.wallet > 4000 ? drinks[drinks.length - 1] : drinks[0];   // a COOLER when flush")
rep("  const rinseR = BIZ.showers.recipes[c.p.wallet > 40 ? 1 : 0];   // deluxe soak when flush",
    "  const rinseR = BIZ.showers.recipes[c.p.wallet > 4000 ? 1 : 0];   // deluxe soak when flush")
rep("    const r = BIZ.arcade.recipes[c.p.wallet > 40 ? 2 : 1];   // splurge on game night when flush",
    "    const r = BIZ.arcade.recipes[c.p.wallet > 4000 ? 2 : 1];   // splurge on game night when flush")
rep("    return { biz: \"shack\", recipe: c.p.wallet > 40 ? aff[(srand() * aff.length) | 0] : aff[0], need: \"food\" };",
    "    return { biz: \"shack\", recipe: c.p.wallet > 4000 ? aff[(srand() * aff.length) | 0] : aff[0], need: \"food\" };")
rep("    const r = BIZ.showers.recipes[c.p.wallet > 40 ? 1 : 0];\n",
    "    const r = BIZ.showers.recipes[c.p.wallet > 4000 ? 1 : 0];\n")
rep("    const r = BIZ.arcade.recipes[c.p.wallet > 40 ? 2 : 1];\n",
    "    const r = BIZ.arcade.recipes[c.p.wallet > 4000 ? 2 : 1];\n")

open(p, "w").write(s)
print(f"patched E: {len(s)-n0:+d} bytes")

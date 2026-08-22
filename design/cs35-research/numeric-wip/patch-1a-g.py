# Display sweep: cents state, dollar glass. Every site below is paint or
# prose - the one non-display fix is the laundromat refund (a real mint).
import sys
p = "game.js"
s = open(p).read()
n0 = len(s)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# --- G0. fmt() takes cents now: every one of its call sites is money ---
rep("""function fmt(n) {
  n = Math.floor(n);""",
    """function fmt(c) {   // cents in, whole dollars out - every caller is money
  let n = $d(c);""")

# --- G0b. the laundromat refund is REAL MONEY, not paint ---
rep("    let refund = 400;                            // the old CLEANERS rung",
    "    let refund = 40000;                          // cents: the old CLEANERS rung")
rep("    if (s.lv.sudsgear > 0) refund += 150;        // and its SUDS GEAR+ upgrade",
    "    if (s.lv.sudsgear > 0) refund += 15000;      // and its SUDS GEAR+ upgrade")
rep('    toast = { text: "LAUNDROMAT CLOSED - SHOWERS TOOK OVER. +$" + refund, t: 9 };',
    '    toast = { text: "LAUNDROMAT CLOSED - SHOWERS TOOK OVER. +$" + $d(refund), t: 9 };')

# --- G1. the office's voice ---
rep('  return P.short + " " + (p.mech === "rents" || p.mech === "levy" ? r + "%" : "$" + r)\n'
    '    + " / " + b + " BOWL" + (b === 1 ? "" : "S") + (f > 0 ? " / MIN $" + f : "")',
    '  return P.short + " " + (p.mech === "rents" || p.mech === "levy" ? r + "%" : "$" + $d(r))\n'
    '    + " / " + b + " BOWL" + (b === 1 ? "" : "S") + (f > 0 ? " / MIN $" + $d(f) : "")')
rep('  if (raise > 0) bits.push("$" + Math.round(raise) + " MORE A DAY");',
    '  if (raise > 0) bits.push("$" + $d(raise) + " MORE A DAY");')
rep('  if (bill > 0) bits.push("$" + bill + " MORE ON THE PAYROLL");',
    '  if (bill > 0) bits.push("$" + $d(bill) + " MORE ON THE PAYROLL");')
rep('today.moved.push("THE TOWN PASSED THE HAT FOR BALLOT PAPER - $" + (Math.round(raised * 100) / 100));',
    'today.moved.push("THE TOWN PASSED THE HAT FOR BALLOT PAPER - $" + (raised / 100));   // pennies: 2dp is exact')
rep('    today.moved.push("THE SHELTER\'S RENT WENT SHORT - $" + Math.ceil(townFund.arrears) + " OWED");',
    '    today.moved.push("THE SHELTER\'S RENT WENT SHORT - $" + Math.ceil(townFund.arrears / 100) + " OWED");')

# --- G2. back pay + sales + the rivalry's prose ---
for old, cnt in [
  ('crabLog(c, "money", "GOT $" + owed + " IN BACK PAY", 0);', 2),
  ('crabLog(seller, "money", "SOLD THE " + BIZ[b].name + " FOR $" + price, 0);', 1),
  ('today.moved.push(seller.p.name + " SOLD UP - $" + banked + " IN THE BANK");', 1),
  (': BIZ[b].name + " HAS CLOSED - FOR SALE, $" + price, t: 8 };', 1),
  ('today.moved.push(sold ? who + " SOLD " + BIZ[b].short : BIZ[b].short + " CLOSED - FOR SALE $" + price);', 1),
  ('if (!sold) popText("FOR SALE $" + price, (BIZ[b].x0 + BIZ[b].x1) / 2 - 20, 100, [255, 190, 90]);', 1),
  ('crabLog(buyer, "money", "BOUGHT THE " + BIZ[b].name + " FOR $" + price, 0);', 1),
  ('toast = { text: who + " BOUGHT " + BIZ[b].name + " FOR $" + price + "!", t: 8 };', 1),
  ('today.moved.push(who + " BOUGHT " + BIZ[b].short + " ($" + price + ")");', 1),
  ('if (c) crabLog(c, "money", "OFFERED $" + q.price + " FOR THE " + BIZ[b].short, 0);', 1),
  ('if (c) { crabLog(c, "money", "BOUGHT THE " + BIZ[b].name + " FOR $" + price, 0);', 1),
]:
    assert s.count(old) == cnt, f"MATCH {s.count(old)} != {cnt}: {old[:60]!r}"
    s = s.replace(old, old
      .replace('"GOT $" + owed', '"GOT $" + $d(owed)')
      .replace('"SOLD THE " + BIZ[b].name + " FOR $" + price', '"SOLD THE " + BIZ[b].name + " FOR $" + $d(price)')
      .replace('" SOLD UP - $" + banked', '" SOLD UP - $" + $d(banked)')
      .replace('" HAS CLOSED - FOR SALE, $" + price', '" HAS CLOSED - FOR SALE, $" + $d(price)')
      .replace('" CLOSED - FOR SALE $" + price', '" CLOSED - FOR SALE $" + $d(price)')
      .replace('"FOR SALE $" + price', '"FOR SALE $" + $d(price)')
      .replace('"BOUGHT THE " + BIZ[b].name + " FOR $" + price', '"BOUGHT THE " + BIZ[b].name + " FOR $" + $d(price)')
      .replace('" FOR $" + price + "!"', '" FOR $" + $d(price) + "!"')
      .replace('" ($" + price + ")")', '" ($" + $d(price) + ")")')
      .replace('"OFFERED $" + q.price', '"OFFERED $" + $d(q.price)'), cnt)

# --- G3. wages + rooms, the CPU owners' diary voice ---
rep('      line = "TRIMS THE " + BIZ[shop].short + " WAGE TO $" + bizWage(shop);',
    '      line = "TRIMS THE " + BIZ[shop].short + " WAGE TO $" + $d(bizWage(shop));')
rep('        + " (" + BIZ[shop].recipes.map(r0 => "$" + menuPrice(shop, r0)).join("/") + ")";',
    '        + " (" + BIZ[shop].recipes.map(r0 => "$" + $d(menuPrice(shop, r0))).join("/") + ")";')
rep('        line = "POSTS $" + bizWage(shop) + " AT THE " + BIZ[shop].short;',
    '        line = "POSTS $" + $d(bizWage(shop)) + " AT THE " + BIZ[shop].short;')
rep('logHome(c, "MOVED INTO " + placeName(c.p) + " - $" + MOVE_IN_COST);',
    'logHome(c, "MOVED INTO " + placeName(c.p) + " - $" + $d(MOVE_IN_COST));', 2)
rep('logHome(c, "MOVED ABOARD THE " + BOAT_NAMES[berth] + " - $" + BOAT_COST);',
    'logHome(c, "MOVED ABOARD THE " + BOAT_NAMES[berth] + " - $" + $d(BOAT_COST));')
rep('  crabLog(c, "money", "PAID $" + price + " FOR " + hotelRooms().length + " ROOMS", 0);',
    '  crabLog(c, "money", "PAID $" + $d(price) + " FOR " + hotelRooms().length + " ROOMS", 0);')
rep('      say("CUTS THE WAGE TO $" + bizWage(b) + " - MISSED RENT", "life");',
    '      say("CUTS THE WAGE TO $" + $d(bizWage(b)) + " - MISSED RENT", "life");')
rep('      say("DROPS THE ROOM TO $" + roomPrice() + " - MISSED RENT", "life");',
    '      say("DROPS THE ROOM TO $" + $d(roomPrice()) + " - MISSED RENT", "life");')
rep('+ roomPrice() + ", $" + bizWage(b) + "/DAY");',
    '+ $d(roomPrice()) + ", $" + $d(bizWage(b)) + "/DAY");', 2)
rep('    say("POSTS $" + bizWage(b)', '    say("POSTS $" + $d(bizWage(b))')
rep('    say("PUTS THE ROOM UP TO $" + roomPrice() + " - " + lets + "/" + rooms.length + " SOLD");',
    '    say("PUTS THE ROOM UP TO $" + $d(roomPrice()) + " - " + lets + "/" + rooms.length + " SOLD");')
rep('    say("DROPS THE ROOM TO $" + roomPrice() + " - "',
    '    say("DROPS THE ROOM TO $" + $d(roomPrice()) + " - "')

# --- G4. the shelter + annexe cards ---
rep('  if (townFund.bal < bunkKey()) return "THE FUND HASN\'T GOT THE $" + bunkKey() + " KEY MONEY";',
    '  if (townFund.bal < bunkKey()) return "THE FUND HASN\'T GOT THE $" + $d(bunkKey()) + " KEY MONEY";')
rep('    return "THE " + purseOf(hall.policy).short + " WON\'T CARRY $" + (shelterRent() + DORM_CFG.RENT) + " A NIGHT";',
    '    return "THE " + purseOf(hall.policy).short + " WON\'T CARRY $" + $d(shelterRent() + DORM_CFG.RENT) + " A NIGHT";')
rep('  today.moved.push(name + " TOOK ANOTHER BED - SHELTER $" + shelterRent() + "/NIGHT");',
    '  today.moved.push(name + " TOOK ANOTHER BED - SHELTER $" + $d(shelterRent()) + "/NIGHT");')
rep('  toast = { text: "THE SHELTER TAKES BED " + shelterBeds() + " - RENT $" + shelterRent() + " A NIGHT", t: 7 };',
    '  toast = { text: "THE SHELTER TAKES BED " + shelterBeds() + " - RENT $" + $d(shelterRent()) + " A NIGHT", t: 7 };')
rep('  if (m) crabLog(m, "life", "TOOK BED " + shelterBeds() + " AT THE SHELTER - $" + shelterRent() + "/NIGHT", 0);',
    '  if (m) crabLog(m, "life", "TOOK BED " + shelterBeds() + " AT THE SHELTER - $" + $d(shelterRent()) + "/NIGHT", 0);')
rep('    toast = { text: "TAP AGAIN: $" + DORM_CFG.RENT + " A NIGHT FOREVER - RENT $"\n      + shelterRent() + ">$" + (shelterRent() + DORM_CFG.RENT), t: 5 };',
    '    toast = { text: "TAP AGAIN: $" + $d(DORM_CFG.RENT) + " A NIGHT FOREVER - RENT $"\n      + $d(shelterRent()) + ">$" + $d(shelterRent() + DORM_CFG.RENT), t: 5 };')
rep('  if (till < roomBuildCost()) return "THAT\'S $" + roomBuildCost() + " AND THE TILL HASN\'T GOT IT";',
    '  if (till < roomBuildCost()) return "THAT\'S $" + $d(roomBuildCost()) + " AND THE TILL HASN\'T GOT IT";')
rep('  today.moved.push(who + " PUT UP CABANA " + annexe.built + " - RENT $" + BIZ.hotel.rent);',
    '  today.moved.push(who + " PUT UP CABANA " + annexe.built + " - RENT $" + $d(BIZ.hotel.rent));')
rep('  toast = { text: who + " PUTS UP CABANA " + annexe.built + " - RENT $" + BIZ.hotel.rent, t: 7 };',
    '  toast = { text: who + " PUTS UP CABANA " + annexe.built + " - RENT $" + $d(BIZ.hotel.rent), t: 7 };')
rep('  if (c) crabLog(c, "money", "BUILT CABANA " + annexe.built + " - $" + roomBuildCost(), 0);',
    '  if (c) crabLog(c, "money", "BUILT CABANA " + annexe.built + " - $" + $d(roomBuildCost()), 0);')
rep('    toast = { text: "TAP AGAIN: $" + roomBuildCost() + " NOW, $" + ROOM_CFG.RENT',
    '    toast = { text: "TAP AGAIN: $" + $d(roomBuildCost()) + " NOW, $" + $d(ROOM_CFG.RENT)')
rep('  const lbl = upArm === "bunk" ? "TAP AGAIN" : "BED+ $" + DORM_CFG.RENT + "/NIGHT";',
    '  const lbl = upArm === "bunk" ? "TAP AGAIN" : "BED+ $" + $d(DORM_CFG.RENT) + "/NIGHT";')
rep('  const lbl = upArm === "room" ? "TAP AGAIN" : "ROOM+ $" + roomBuildCost();',
    '  const lbl = upArm === "room" ? "TAP AGAIN" : "ROOM+ $" + $d(roomBuildCost());')

# --- G5. the wage-relations voice ---
rep('    toast = { text: c.p.name + " LEFT FOR " + BIZ[to].name + " - $" + bizWage(to) + " BEATS $" + Math.round(wageRate(c)), t: 8 };',
    '    toast = { text: c.p.name + " LEFT FOR " + BIZ[to].name + " - $" + $d(bizWage(to)) + " BEATS $" + $d(wageRate(c)), t: 8 };')
rep('      today.moved.push(c.p.name + " IS BACK ON THE SHOP RATE - $" + bizWage(c.p.job));',
    '      today.moved.push(c.p.name + " IS BACK ON THE SHOP RATE - $" + $d(bizWage(c.p.job)));')
rep('      c.quip = { text: "$" + rate + "? THE PIER PAYS BETTER", t: 6 };',
    '      c.quip = { text: "$" + $d(rate) + "? THE PIER PAYS BETTER", t: 6 };')
rep('      today.moved.push(c.p.name + " IS GRUMBLING ABOUT $" + rate);',
    '      today.moved.push(c.p.name + " IS GRUMBLING ABOUT $" + $d(rate));')
rep('      toast = { text: c.p.name + " IS ASKING AROUND - $" + rate + " ISN\'T ENOUGH", t: 8 };',
    '      toast = { text: c.p.name + " IS ASKING AROUND - $" + $d(rate) + " ISN\'T ENOUGH", t: 8 };')
rep('        toast = { text: c.p.name + " WON\'T WORK TOMORROW AT $" + rate, t: 8 };',
    '        toast = { text: c.p.name + " WON\'T WORK TOMORROW AT $" + $d(rate), t: 8 };')
rep('        today.moved.push(c.p.name + " REFUSES TOMORROW\'S SHIFT OVER $" + rate);',
    '        today.moved.push(c.p.name + " REFUSES TOMORROW\'S SHIFT OVER $" + $d(rate));')
rep('    line = "RAISES THE WAGE TO $" + bizWage(b);',
    '    line = "RAISES THE WAGE TO $" + $d(bizWage(b));')
rep('    line = "TRIMS THE WAGE TO $" + bizWage(b);',
    '    line = "TRIMS THE WAGE TO $" + $d(bizWage(b));')
rep('  if (key === "chef") return "+$" + bizWage("shack") + " A SHIFT ON TONIGHT\'S BILL";',
    '  if (key === "chef") return "+$" + $d(bizWage("shack")) + " A SHIFT ON TONIGHT\'S BILL";')
rep('  if (key === "arcade" || key === "juicebar") return "+$" + BIZ[key].rent + " RENT EVERY NIGHT, FOREVER";',
    '  if (key === "arcade" || key === "juicebar") return "+$" + $d(BIZ[key].rent) + " RENT EVERY NIGHT, FOREVER";')

# --- G6. board, pier, ferry ---
rep('      crabLog(hire, "life", "TOOK THE " + BIZ[j.biz].short + " JOB - $" + j.wage + " A DAY", 0);',
    '      crabLog(hire, "life", "TOOK THE " + BIZ[j.biz].short + " JOB - $" + $d(j.wage) + " A DAY", 0);')
rep('    + " AT THE " + BIZ[k.biz].short + " - $" + menuPrice(k.biz, r),',
    '    + " AT THE " + BIZ[k.biz].short + " - $" + $d(menuPrice(k.biz, r)),')
rep('      visLog(v, "money", vline(v, "dues", "PAID $" + Math.round(due) + " HARBOUR DUE", { N: Math.round(due) }));',
    '      visLog(v, "money", vline(v, "dues", "PAID $" + $d(due) + " HARBOUR DUE", { N: $d(due) }));')
rep('  if (haul >= 4) crabLog(c, "work", "LANDED THE BIG ONE - $" + trade.price * haul, 0);',
    '  if (haul >= 4) crabLog(c, "work", "LANDED THE BIG ONE - $" + $d(trade.price * haul), 0);')
rep('    toast = { text: "NOBODY\'S BITING AT $" + bizWage("shack") + " - THE FISH ARE PAYING $"',
    '    toast = { text: "NOBODY\'S BITING AT $" + $d(bizWage("shack")) + " - THE FISH ARE PAYING $"')
rep("function ferryFare() { return commas(FERRY_PRICE); }",
    "function ferryFare() { return commas($d(FERRY_PRICE)); }")
rep('    popText((haul >= 4 ? "THE BIG ONE!! +$" : haul > 1 ? "DOUBLE HAUL! +$" : "CATCH! +$") + trade.price * haul,',
    '    popText((haul >= 4 ? "THE BIG ONE!! +$" : haul > 1 ? "DOUBLE HAUL! +$" : "CATCH! +$") + $d(trade.price * haul),')

open(p, "w").write(s)
print(f"patched G: {len(s)-n0:+d} bytes")

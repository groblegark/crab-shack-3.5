# Display sweep, second half: panel, cards, report, diary, departures.
import sys
p = "game.js"
s = open(p).read()
n0 = len(s)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# --- H1. the ferry chips + the win card ---
rep('    smallText(ctx, "$" + Math.round(k.wallet) + " LEFT OF $" + k.purse',
    '    smallText(ctx, "$" + $d(k.wallet) + " LEFT OF $" + $d(k.purse)')
rep('  smallText(ctx, "WANTS: " + (ITEM_NAMES[k.recipe.icon] || "?") + " $" + menuPrice(k.biz, k.recipe), 29, 28, [140, 110, 40]);',
    '  smallText(ctx, "WANTS: " + (ITEM_NAMES[k.recipe.icon] || "?") + " $" + $d(menuPrice(k.biz, k.recipe)), 29, 28, [140, 110, 40]);')
rep('    ["YOU PAID FOR HER IN FISH SUPPERS. $" + ferryFare() + ",", 0],',
    '    ["YOU PAID FOR HER IN FISH SUPPERS. $" + ferryFare() + ",", 0],')
rep('  smallText(ctx, "DAY " + R.day + " - $" + commas(R.lifetime) + " TAKEN - "',
    '  smallText(ctx, "DAY " + R.day + " - $" + commas($d(R.lifetime)) + " TAKEN - "')

# --- H2. the menu card + the manage tab ---
rep('        smallText(ctx, "$" + menuPrice(key, r) + " / $" + INGREDIENT_COST[r.raw], 72, my,',
    '        smallText(ctx, "$" + $d(menuPrice(key, r)) + " / $" + INGREDIENT_COST[r.raw], 72, my,')
rep('    const rateTxt = rates.length === 1 ? "$" + rates[0] : "MIXED";',
    '    const rateTxt = rates.length === 1 ? "$" + $d(rates[0]) : "MIXED";')
rep('    smallText(ctx, "$" + baseBill, 224, by, [235, 160, 130]); by += MROW;',
    '    smallText(ctx, "$" + $d(baseBill), 224, by, [235, 160, 130]); by += MROW;')
rep('      smallText(ctx, "$" + otBill, 224, by, [235, 160, 130]); by += MROW;',
    '      smallText(ctx, "$" + $d(otBill), 224, by, [235, 160, 130]); by += MROW;')
rep('      smallText(ctx, "$" + BIZ[key].rent, 224, by, [235, 160, 130]); by += MROW;',
    '      smallText(ctx, "$" + $d(BIZ[key].rent), 224, by, [235, 160, 130]); by += MROW;')
rep('      smallText(ctx, "$" + creditDueTonight(), 224, by, [235, 160, 130]); by += MROW;',
    '      smallText(ctx, "$" + $d(creditDueTonight()), 224, by, [235, 160, 130]); by += MROW;')
rep('    smallText(ctx, "$" + HOUSE_RENT + " HOUSE RENT", 132, by + 2 * MROW + 2, [150, 135, 125]);',
    '    smallText(ctx, "$" + $d(HOUSE_RENT) + " HOUSE RENT", 132, by + 2 * MROW + 2, [150, 135, 125]);')
rep('    ["RENT $" + BIZ.shack.rent + ", NIGHTLY AT 20:00", [170, 50, 50]],',
    '    ["RENT $" + $d(BIZ.shack.rent) + ", NIGHTLY AT 20:00", [170, 50, 50]],')
rep('    ["WAGES $" + bizWage("shack") + " A SHIFT, YOUR CALL", [70, 70, 90]],',
    '    ["WAGES $" + $d(bizWage("shack")) + " A SHIFT, YOUR CALL", [70, 70, 90]],')
rep('    ["CREW PAY $" + HOUSE_RENT + " HOME RENT EACH", [70, 70, 90]],',
    '    ["CREW PAY $" + $d(HOUSE_RENT) + " HOME RENT EACH", [70, 70, 90]],')
rep('    smallText(ctx, "RENT $" + b.rent, x + 166, y + 84, [140, 110, 40]);',
    '    smallText(ctx, "RENT $" + $d(b.rent), x + 166, y + 84, [140, 110, 40]);')
rep('      const menu = b.recipes.slice(0, 3).map(r => (ITEM_NAMES[r.icon] || "?") + " $" + menuPrice(key, r)).join("  ");',
    '      const menu = b.recipes.slice(0, 3).map(r => (ITEM_NAMES[r.icon] || "?") + " $" + $d(menuPrice(key, r))).join("  ");')
rep('    const wtxt = "$" + bizWage(key);', '    const wtxt = "$" + $d(bizWage(key));')
rep('    chip(R.wall, "ALL $" + bizWage(key), null, deals > 0);',
    '    chip(R.wall, "ALL $" + $d(bizWage(key)), null, deals > 0);')
rep('    smallText(ctx, "TOWN $" + townWage(key).toFixed(0) + "  PIER $" + Math.round(pierDay()),',
    '    smallText(ctx, "TOWN $" + $d(townWage(key)) + "  PIER $" + $d(pierDay()),')
rep('      smallText(ctx, "$" + rate, cell.wdn.x + 11, ry + 2, own ? [190, 110, 30] : [90, 80, 90]);',
    '      smallText(ctx, "$" + $d(rate), cell.wdn.x + 11, ry + 2, own ? [190, 110, 30] : [90, 80, 90]);')
rep('  if (deals) return deals + " ON PRIVATE DEALS - ALL RESETS TO $" + bizWage(key);',
    '  if (deals) return deals + " ON PRIVATE DEALS - ALL RESETS TO $" + $d(bizWage(key));')

# --- H3. the hall card + the purse chips ---
rep('      : potLine() + (townFund.bowls > 0 ? " AT $" + bowlCost() + " EACH" : ""), 116), x + 8, y + 75, bar);',
    '      : potLine() + (townFund.bowls > 0 ? " AT $" + $d(bowlCost()) + " EACH" : ""), 116), x + 8, y + 75, bar);')
rep('    smallText(ctx, fitSmall("RENT $" + shelterRent() + (townFund.arrears > 0 ? " OWES $" + Math.ceil(townFund.arrears) : "")',
    '    smallText(ctx, fitSmall("RENT $" + $d(shelterRent()) + (townFund.arrears > 0 ? " OWES $" + Math.ceil(townFund.arrears / 100) : "")')
rep('  chip(R.pmech, EP.short + " " + (ed.mech === "rents" || ed.mech === "levy" ? purseRate(ed) + "%" : "$" + purseRate(ed)), null, mine);',
    '  chip(R.pmech, EP.short + " " + (ed.mech === "rents" || ed.mech === "levy" ? purseRate(ed) + "%" : "$" + $d(purseRate(ed))), null, mine);')
rep('  smallText(ctx, fl > 0 ? "MIN $" + fl : "MIN OFF", R.pwm.x + 19, R.pwm.y + 4,',
    '  smallText(ctx, fl > 0 ? "MIN $" + $d(fl) : "MIN OFF", R.pwm.x + 19, R.pwm.y + 4,')
rep('      bits.push(under + " UNDER" + (lift > 0 ? " - $" + lift + " A DAY YOURS" : ""));',
    '      bits.push(under + " UNDER" + (lift > 0 ? " - $" + $d(lift) + " A DAY YOURS" : ""));')

# --- H4. the job board card + the trade board ---
rep('      smallText(ctx, "FISH AT $" + trade.price + " - SELL WHAT YOU CATCH" + (day > j.day ? " (STILL OPEN)" : ""), x + 12, ly, [140, 110, 40]); ly += 9;',
    '      smallText(ctx, "FISH AT $" + $d(trade.price) + " - SELL WHAT YOU CATCH" + (day > j.day ? " (STILL OPEN)" : ""), x + 12, ly, [140, 110, 40]); ly += 9;')
rep('    smallText(ctx, "$" + j.wage + "/DAY - SEE " + ownerName(bizOwner(j.biz)) + (day > j.day ? " (STILL OPEN)" : ""), x + 12, ly, [140, 110, 40]); ly += 7;',
    '    smallText(ctx, "$" + $d(j.wage) + "/DAY - SEE " + ownerName(bizOwner(j.biz)) + (day > j.day ? " (STILL OPEN)" : ""), x + 12, ly, [140, 110, 40]); ly += 7;')
rep('    smallText(ctx, "A DAY ON THE PIER PAYS ABOUT $" + Math.round(pierDay()), x + 12, ly,',
    '    smallText(ctx, "A DAY ON THE PIER PAYS ABOUT $" + $d(pierDay()), x + 12, ly,')
rep('      const v = "$" + trade.price + (trade.price >= FISH_IMPORT ? " AT CEILING" : "");',
    '      const v = "$" + $d(trade.price) + (trade.price >= FISH_IMPORT ? " AT CEILING" : "");')
rep('      const d = String(trade.day[kind]), t = String(trade.total[kind]), p = "$" + im.price;',
    '      const d = String(trade.day[kind]), t = String(trade.total[kind]), p = "$" + im.price / 100;   // pennies print 2dp exact')
rep("""  fish:  { name: "FISH",  unit: "EA",  price: FISH_IMPORT },
  corn:  { name: "CORN",  unit: "EA",  price: 3 },
  water: { name: "WATER", unit: "GAL", price: 1 },
  power: { name: "POWER", unit: "KWH", price: 2 },
  fruit: { name: "FRUIT", unit: "EA",  price: 2 },""",
    """  fish:  { name: "FISH",  unit: "EA",  price: FISH_IMPORT },   // cents, all of them
  corn:  { name: "CORN",  unit: "EA",  price: 300 },
  water: { name: "WATER", unit: "GAL", price: 100 },
  power: { name: "POWER", unit: "KWH", price: 200 },
  fruit: { name: "FRUIT", unit: "EA",  price: 200 },""")
rep('      smallText(ctx, c.p.name + " - " + BIZ[c.p.job].short + " $" + Math.round(wageRate(c))',
    '      smallText(ctx, c.p.name + " - " + BIZ[c.p.job].short + " $" + $d(wageRate(c))')

# --- H5. the dossiers ---
rep('  row("PURSE", "$" + Math.round(k.wallet) + " LEFT OF THE $" + k.purse + " THEY BROUGHT",',
    '  row("PURSE", "$" + $d(k.wallet) + " LEFT OF THE $" + $d(k.purse) + " THEY BROUGHT",')
rep('  row("SPENT", "$" + Math.round(k.spent) + " IN TOWN OVER " + k.buys + " VISIT" + (k.buys === 1 ? "" : "S"),',
    '  row("SPENT", "$" + $d(k.spent) + " IN TOWN OVER " + k.buys + " VISIT" + (k.buys === 1 ? "" : "S"),')
rep('  row("ORDER", (ITEM_NAMES[k.recipe.icon] || "?") + " - $" + menuPrice(k.biz, k.recipe) + (k.served ? " - PAID" : ""), [140, 110, 40]);',
    '  row("ORDER", (ITEM_NAMES[k.recipe.icon] || "?") + " - $" + $d(menuPrice(k.biz, k.recipe)) + (k.served ? " - PAID" : ""), [140, 110, 40]);')
rep('    row("PAY", "$" + Math.round(wageRate(c)) + "/SHIFT " + (onShopRate(c) ? "(SHOP RATE)" : "(PRIVATE DEAL)")',
    '    row("PAY", "$" + $d(wageRate(c)) + "/SHIFT " + (onShopRate(c) ? "(SHOP RATE)" : "(PRIVATE DEAL)")')
rep('      smallText(ctx, "THE GOING RATE IS $" + Math.round(goingRate(c)) + " (PIER $" + Math.round(pierDay()) + ")",',
    '      smallText(ctx, "THE GOING RATE IS $" + $d(goingRate(c)) + " (PIER $" + $d(pierDay()) + ")",')

# --- H6. the hire card + settlement pops/diary ---
rep('  smallText(ctx, "$" + Math.round(wageRate(c)) + " A SHIFT, ON TONIGHT\'S BILL AT 20:00", tx, y + 43, [190, 80, 80]);',
    '  smallText(ctx, "$" + $d(wageRate(c)) + " A SHIFT, ON TONIGHT\'S BILL AT 20:00", tx, y + 43, [190, 80, 80]);')
rep('      today.moved.push(c.p.name + " WAS PAID $" + owed + " IN BACK PAY");',
    '      today.moved.push(c.p.name + " WAS PAID $" + $d(owed) + " IN BACK PAY");')
rep('        crabLog(c, "money", "DREW $" + due + " IN WAGES", 0);   // DIARY',
    '        crabLog(c, "money", "DREW $" + $d(due) + " IN WAGES", 0);   // DIARY')
rep('          popText("OT +$" + prem, c.x - 4, FLOOR_Y - 40, [255, 216, 96]);',
    '          popText("OT +$" + $d(prem), c.x - 4, FLOOR_Y - 40, [255, 216, 96]);')
rep('        crabLog(c, "peril", "WENT UNPAID - $" + due + " OWED", 0);   // DIARY',
    '        crabLog(c, "peril", "WENT UNPAID - $" + $d(due) + " OWED", 0);   // DIARY')
rep('        crabLog(c, "money", "PAID $" + HOUSE_RENT + " HOUSE RENT", 600);   // DIARY: once a night, never twice',
    '        crabLog(c, "money", "PAID $" + $d(HOUSE_RENT) + " HOUSE RENT", 600);   // DIARY: once a night, never twice')
rep('crabLog(c, "money", "WAS PAID $" + npcDue + " BY " + o.name, 0); }   // DIARY',
    'crabLog(c, "money", "WAS PAID $" + $d(npcDue) + " BY " + o.name, 0); }   // DIARY')
rep('      if (rent > 0) popText("-$" + rent + " RENT", BIZ.shack.door, 110, [255, 120, 120]);',
    '      if (rent > 0) popText("-$" + $d(rent) + " RENT", BIZ.shack.door, 110, [255, 120, 120]);')
rep('      if (fin.drew > 0) popText("+$" + fin.drew + " ON CREDIT", BIZ.shack.door, 100, [255, 190, 90]);',
    '      if (fin.drew > 0) popText("+$" + $d(fin.drew) + " ON CREDIT", BIZ.shack.door, 100, [255, 190, 90]);')

# --- H7. the departure record speaks dollars: the card, the quotes and the
# devlog all read THIS, so the conversion happens once, at the record ---
rep("""  const purse = Math.max(1, Math.round(k.purse));
  const left = Math.max(0, Math.min(purse, Math.round(k.wallet)));""",
    """  const purse = Math.max(1, $d(k.purse));   // the record speaks DOLLARS: every
  const left = Math.max(0, Math.min(purse, $d(k.wallet)));   // reader is a voice line or the card""")
rep("""    topItem: s.topItem, topBiz: s.topBiz, topPaid: s.topPaid,
    tips: Math.round(s.tips), dues: Math.round(s.dues),""",
    """    topItem: s.topItem, topBiz: s.topBiz, topPaid: $d(s.topPaid),
    tips: $d(s.tips), dues: $d(s.dues),""")

open(p, "w").write(s)
print(f"patched H: {len(s)-n0:+d} bytes")

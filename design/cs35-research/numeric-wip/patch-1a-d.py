import sys
p = "game.js"
s = open(p).read()
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f"MATCH {s.count(old)} != {count}: {old[:70]!r}"
    s = s.replace(old, new, count)

# fish price is sim state -> cents; the walk steps a whole dollar
rep("const FISH_FLOOR = 2, FISH_IMPORT = 7, FISH_START = 4;",
    "const FISH_FLOOR = 200, FISH_IMPORT = 700, FISH_START = 400;   // cents")
rep("if (D > S + 1) trade.price = Math.min(FISH_IMPORT, trade.price + 1);",
    "if (D > S + 1) trade.price = Math.min(FISH_IMPORT, trade.price + 100);")
rep("else if (S > D + 2) trade.price = Math.max(FISH_FLOOR, trade.price - 1);",
    "else if (S > D + 2) trade.price = Math.max(FISH_FLOOR, trade.price - 100);")
# author-dollar tables cross at their read boundary
rep("  return INGREDIENT_COST[raw];\n}",
    "  return 100 * INGREDIENT_COST[raw];   // author-dollars table; the cent is born here\n}")
# shelter economics
rep("const SHELTER_RENT = 10;", "const SHELTER_RENT = 1000;   // cents")
rep("const SOUP_MARGIN = 2;", "const SOUP_MARGIN = 200;   // cents")
# the ONE canonical tip rounding point (protocol: round at payTip entry)
rep("function payTip(bizKey, server, amt, x, y) {\n  if (!(amt >= 0.5)) return;",
    "function payTip(bizKey, server, amt, x, y) {\n  amt = Math.round(amt);   // THE canonical rounding point: a tip becomes cents here\n  if (!(amt >= 50)) return;")
rep("  if (till >= 0.5) {", "  if (till >= 50) {")
rep("if (cut >= 0.5) popText(\"+$\" + Math.round(cut)", "if (cut >= 50) popText(\"+$\" + $d(cut)")
rep("popText(\"+$\" + Math.round(till) + \" TIP\"", "popText(\"+$\" + $d(till) + \" TIP\"")
rep("const cut = amt * bizTipShare(bizKey), till = amt - cut;",
    "const cut = Math.round(amt * bizTipShare(bizKey)), till = amt - cut;   // int split; till+cut === amt")
# display helpers: cents on the wire, dollars on the glass
rep("function earn(amt, x, y) {",
    "// cents state, dollar glass: the ONE display divisor\nfunction $d(c) { return Math.round(c / 100); }\nfunction earn(amt, x, y) {")
rep('popText("+$" + Math.floor(amt), x, y, [255, 230, 120]);', 'popText("+$" + $d(amt), x, y, [255, 230, 120]);')
rep('popText("-$" + amt + (label ? " " + label : ""), x, y, [255, 120, 120]);',
    'popText("-$" + $d(amt) + (label ? " " + label : ""), x, y, [255, 120, 120]);')
rep('if (!quiet) popText("+$" + Math.floor(amt), x, y, [150, 210, 255]);',
    'if (!quiet) popText("+$" + $d(amt), x, y, [150, 210, 255]);')
open(p, "w").write(s)
print("patch D applied")

# 1a remaining (next wakes) — cents conversion worklist
- [x] visitor purse mint (cents from the same draws; purseMul floor $1 -> 100c; seedVisitors untouched draws)
- [x] wages: WAGE_MIN/WAGE_MAX 800/6000; clampWage keeps the whole-dollar grain (100*round(n/100)); BIZ wage state cents (showers author wage 20 -> 2000); job-board postings (o.till >= 26000 gate); p.wage migrated in centsEnvelope; wage steppers move by 100; displays $d
- [x] purse steps boundary: dues/tin steps x100 (levy/rents stay % - a rate is not money); WAGE_FLOOR steps x100; policyLine + hall card + ballot chips display $d
- [x] rents: BIZ[b].rent in cents at the table (230->23000 etc), HOTEL_RENT_BASE/ROOM_CFG x100; house rents (HOUSE_RENT 1000); harbourDues rides purseRate cents
- [x] flush thresholds: wallet > 40 -> 4000 (8 sites); spare-$2 -> 200 (10 sites); drifter 12 -> 1200; converted-tourist 25 -> 2500; BROKE/SPENT-UP card lines 1000/600; HOTELIER BANKROLL 80000, TILL_FLOOR 4000, WORTH 6000
- [x] visitor pay path: tip rounds to cents BEFORE the purse clamp (one int leaves the wallet, payTip's canonical round is then identity)
- [x] credit: LIMIT/PER_CREW/MIN_BASE x100; interest ceil(bal/4) exact; MIN_FRAC as ceil(p*35/100) exact int idiom (0.35 is not a binary number - 20*0.35 ceils a phantom cent); creditDueTonight mirrors
- [x] save/load: SAVE_VER 2, s._num=1; centsEnvelope() stage-1 x100 on the parsed envelope BEFORE hydration; stage-2 largest-remainder settle at end of load (mirrors tools/centmigrate.mjs), ledger line "SETTLED TO THE CENT"; slotMeta speaks cents for both eras; slotCard re-derives a pre-cents stored meta
- [x] wallet-sort tie-break at job-board sign-up (name breaks the cents tie; the cot sort already had one)
- [x] display sweep pass 1: fmt() takes cents (every caller is money); ~120 bare "$"+x sites through $d(); departRecord speaks dollars (voice lines + card unchanged); IMPORTS board cents; headless.mjs reports dollars, CLI --wage/--star speak dollars; laundromat refund was a real mint -> 40000/15000
- [x] display sweep pass 2 + scenario tightening: driven off the suite; audit === 0 (fund core); tips/fund/payroll scenarios tightened to exact int equality

**1a IS COMPLETE.** Suite 253/253 (run4 pre-merge, run5 post-merge), exit 0.
Verification per numeric-protocol.md par.2, all of it but the receipted
fingerprint re-baseline (which the slice takes ONCE, after 1b):
- baseline `--days 30 --seeds 16` -> **0/16 exact, median 12** (the documented floor, unmoved)
- growth `--days 40 --seeds 16 --buy chef,table` -> 4/16
- conservation soak: 558 audited movements over three 30-day seeds, every one
  `delta === want` EXACTLY, take/pay/remit all exercised
- migration proof: a forged float-dollar envelope with sub-cent dust lands with
  every balance integer, the "SETTLED TO THE CENT" row in the ledger, and a
  save/load roundtrip that no longer drifts - the census bug is healed
- cross-engine receipt: the day-2 fingerprint is BIT-IDENTICAL under
  JavaScriptCore on both seeds (1a-crossengine.txt, harness xengine.js)
- both frozen fingerprints re-pointed PROVISIONALLY with the drift receipt in
  the scenario comment; the founding tills (SUDSY 200, REEF 140) were the one
  real conversion miss and the fingerprint is what caught them

**NEXT: landing 1b** (numeric-slice1-sites.md, LANDING 1b table): the tip
product in milli-cents with the single canonical round; `payTip`'s split on
`bizTipShare` as int twentieths 0..20 (the double-round snap hack retires);
`otPremium` as one exact rational; `bizPriceMul` as an int index 14..26 with
`priceAppeal` a baked 13-entry Q16 LUT (kills the sim's only `Math.pow` and
both epsilon guards). Then ONE receipted fingerprint re-baseline via
tools/fpdiff.mjs closes slice 1.

Founding wallets converted: crabs.js persona wallet 1000; REEF 3000; founding fishers 1800; start coins 15000.
Floor re-check on this tree (post-conversion): `--days 8 --seeds 4` -> survived 4/4, evictions 9,9,9,9 (the pinned floor-h8 shape); lifetime $9578 vs $10022, rounding-trajectory-shaped.

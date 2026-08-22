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
- [ ] display sweep pass 2 + scenario tightening: drive off suite failures; audit === 0 (landed in fund core); money scenarios exact; then soak/matrices/fingerprint AFTER 1b

Founding wallets converted: crabs.js persona wallet 1000; REEF 3000; founding fishers 1800; start coins 15000.
Floor re-check on this tree (post-conversion): `--days 8 --seeds 4` -> survived 4/4, evictions 9,9,9,9 (the pinned floor-h8 shape); lifetime $9578 vs $10022, rounding-trajectory-shaped.

# SLICE 1 SITE INVENTORY — money → cents (refreshed against cs35 @ 841c697)

*Phase A of the numeric-core workstream. The census's line refs predate
steps 1–4; every anchor below was re-verified on this tree. Two known
drifts are coming before Phase B lands: the step-4 merge (adds `purseMul`
to the visitor mint and voice/taste code near visPick) and the opt-wave-1
merge (touches nothing in the money orbit — its regions are the
scheduling chain, collide, allCrabs, needDrag, bizShiftWindow). Anchor on
names at implementation time; the numbers are today's snapshot.*

## LANDING 1a — representation + the canonical rounding point

Balances to integer cents; every read/write through the new unit; the
audit flips to exact.

| site | anchor | conversion |
|---|---|---|
| `worldMoney()` | game.js:981 | sums cents; return int |
| `auditFund()` | 1000 | `Math.abs(delta−want) < 1e-6` → `delta === want` (ints) |
| `fundRow()` | ~1010 | `Math.round(amt*100)/100` ledger rounding retires — amounts ARE cents |
| fund doors `fundTake/fundPay/fundRemit` | 1014/1031/1047 | dust gates `< 0.005` → `=== 0` cents; all amounts int |
| `creditBiz/debitBiz` | 583/598 | int cents through the till |
| `acctBal/acctMove` | 953/960 | int |
| levy/collections `collectPurse`, `rentCut`, `harbourDues`, `whipRound`, `stockPot` | 1146/1126/1137/1583/1212 | int; whipRound's `< short − 0.005` guards → int compares (1587/1607/1609); arrears settle `>= owed − 0.005` → int (1783) |
| bills `bowlCost/ballotBill/fundNeed` | 1062/1096/1111 | int (fish price already int) |
| wages: `rawWage/wageRate/legalWage`, `basePayToday`, settlement rounds | 4225/4274, settlement block | already whole dollars — re-express in cents (×100 constants); `WAGE_STD 23` → 2300 |
| `settleCreditLine` | 1947 | interest `ceil(bal*0.25)` = `ceil(bal_c/4)` via exact int idiom |
| `menuPrice/localPrice/staffMealCharge` | 421/445/462 | already int dollars → cents |
| `upCost` | 4782 | replace with baked `UP_COST_C` (tools/gen-luts.mjs; NOTE the chef `lvl−2` exponent) |
| visitor purse mint | 9343–9345 | whole cents from the SAME draws, same order; **step-4 adds `purseMul` here — apply as one int multiply after, per spec §5.2** |
| shelter sign-up sort | 7203 | `a.p.wallet − b.p.wallet` gains a name tie-break (the cot sort at 2421 already has one) |
| save/load + `slotMeta` money fields | save()/load()/6039 region | `SAVE_VER → 2`, `s._num = 1`, largest-remainder migration via tools/centmigrate.mjs `centify(balances, Math.round(worldMoney()*100))`; dust ledgered in-world |
| display sweep | ~221 sites by the `"$"+Math.round` family (broader census pattern said ~272 — re-grep at landing) | one `fmt$(cents)` formatter; view-only |

## LANDING 1b — sub-cent intermediates + the grid integers

| site | anchor | conversion |
|---|---|---|
| tip product | `payAndBenefit` 8983 (patience ratio × tipMult × menuPrice × [1 or TIP_COUNTER 3/20]) | milli-cent (1e-5 $) exact 64-bit product; ONE round-half-up at `payTip` entry |
| `payTip` split | 8952 | `amt_c` int; `cut = floor(amt_c * n / 20)` with tipShare as int twentieths; `till = amt_c − cut` (exact); gates `>= 0.5` → `>= 50` |
| `bizTipShare/setTipShare` | 8937/8976 | store int 0..20; the double-round snap hack retires |
| `otPremium` | 4286 (`hourlyRate(c) * OT_RATE * mins`) | single rational `floor(wage_c · 3 · otMin / (2 · span))` — otMin stays float until slice 2, result whole-$ at settlement (unchanged) |
| `hourlyRate` | 4265 | folds into the otPremium rational; no standalone float |
| `bizPriceMul/setBizPrice/clampPrice/priceAppeal` | 419/420/~430/457 | priceMul → int index 14..26; `PRICE_APPEAL_Q16` LUT (gen-luts); the stepper's 0.05-grid epsilon guards retire |

## ORDER WITHIN THE SLICE

1a first (representation + audit + migration — the conservation theorem
lands here), 1b second (intermediates + grids). ONE fingerprint
re-baseline after 1b, receipts via tools/fpdiff.mjs. Verification per the
protocol §2 checklist, floor pinned on the landing tree first.

## HAZARDS CARRIED FROM THE PROTOCOL

- The tip product reads needs (dirt/tired) — those stay float until
  slice 3; the product is float×cents until then, with the canonical
  round at payTip entry keeping the RESULT exact. Documented, expected,
  and the fingerprint's wallets stay stable to the cent.
- `today.tipsShared` and `_stats.tip*` accumulate the same amounts —
  convert with the slice (report surfaces re-express via fmt$).
- `slotMeta` (save-card preview) reads coins — cents there too, or the
  preview lies by ×100.

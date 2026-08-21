# FLOAT CENSUS — game.js (cs35 snapshot, 16,208 lines; anchors are function names — line numbers are today's snapshot only)

## 0. Math.* totals

| fn | game.js | crabs.js | tools/*.mjs | notes |
|---|---|---|---|---|
| Math.random | **91** | 1 (`makeCrabs` persona gen, takes `rng` param, defaults `Math.random`) | 2 (harness) | ONE shared stream; simlib swaps `Math.random` for mulberry32 on a `Object.create(Math)` proxy |
| Math.hypot | **5** | 0 | 0 | all read below |
| Math.pow | **4** (3 real + 1 comment) | 0 | 0 | all read below |
| Math.sin | **29** | 0 | 0 | **exactly 1 feeds sim state** (`heatShimmer`); 28 are draw-only (far shore, gulls, bobs, smoke, blink, ball arc) |
| Math.sqrt / cos / exp / log / atan2 / trunc | **0** | 0 | 0 | no exp/log anywhere — "rep exponential" does not exist; only geometric maps |
| Math.abs | 81 | 0 | 2 | mostly 1-D distances (`errandDetour`, `visStep`, arrival checks) + audit + UI |
| Math.round | 272 | 0 | 10 | overwhelmingly display (`"+$"+Math.round`); state-mutating rounds enumerated in §2 |
| Math.floor / ceil | 14 / 16 | 0 | 0 | ceil = money births (`localPrice`, `upCost`, `settleCreditLine`) |
| Math.min / max | 166 / 280 | 0 | 2/3 | clamps: needs 0..1, rep 0..100, money floors, push caps |
| Math.sign | 16 | 0 | 0 | movement direction + collider tie-breaks (`Math.sign(x - dirty.x \|\| 1)`) |
| Math.imul | present | 0 | mulberry32 | `mistPeak` day-hash — already integer, KEEP |

## 1. Transcendental / pow / hypot dossiers (each read)

| site (fn) | formula | domain → range | feeds |
|---|---|---|---|
| `priceAppeal` | `max(0.6, min(1.6, pow(1/m, 1.2)))`, `PRICE_ELAST=1.2` | m = `bizPriceMul` ∈ {0.70..1.30 step 0.05} — **13 grid values only** (`clampPrice`) | SIM: `bizPull` → tourist spawn shares. **Convert: 13-entry integer LUT (Q16), exact.** The candidate "nasty" is actually trivial; the real hazard is the 0.05 grid itself (`Math.round(v/0.05)*0.05` + `1e-9` epsilon guards in the stepper) → store priceMul as int index 14..26 |
| `upCost` | `ceil(base * mult^lvl)` | lvl 0..4, mult ∈ {1.35,1.5,1.6,2,1} | SIM money. Precompute int table per UPS key |
| `mistPeak` | `min(1, 0.18 + 1.25*pow((h>>>8)/2^24, 0.85))`, h = imul day-hash | u ∈ [0,1) → [0.18,1] | Mostly render, **but `visTick` reads `mistNow() > 0.6` into `stayOf(k).mistMin`** (the "EVERY LINE IS DRAW-ONLY" comment at the far-shore block is stale w.r.t. this one read). Convert: Q16 pow-LUT keyed on top byte of h, or precompute per-day mist as int at midnight |
| `stepTo` (hypot #1) | `d=hypot(dx,dy)`; snap `d<=2.2`; `c.x += dx/d*step` | speeds 11..~60 px/s × dt | SIM movement — needs real magnitude + normalization → integer isqrt on Q-squared |
| `collide` (hypot #2) | `dy*1.8` ellipse; `d<12`; `push=min((12-d)/2*min(1,dt*12),4)`; `ux=dx/d, uy=dx/d/1.8` | 12px radius | SIM — the ×1.8 is exactly 9/5: scale y by 9, x by 5 in squared-int compare; push magnitude needs isqrt |
| `updateStuck` (hypot #3) | `hypot(Δ) >= STUCK_DIST(2)` | 2px | SIM — compare-only → squared-int |
| `tableShunned` (hypot #4) | `hypot(x+8-(t.x+10), (y-(t.y+12))*1.8) < SHUN_PX(26)` | 26px ellipse | SIM seating refusal — compare-only → squared-int (the dy*1.8 candidate: **easy**, not nasty) |
| `drawCrab` (hypot #5) | dist>2 picks walking art | — | RENDER only — stays float |
| `heatShimmer` (the one sim sin) | `1 + 0.5*f*sin(time*4 + animT*6.3)`, f=(thirst−0.6)/0.4 | ±50% about 1.0 | **SIM: multiplies `crabMove` → every parched crab's speed each frame.** Phase = unbounded float wall-clock `time` + `animT` seeded `Math.random()*9`. See nasty #1 |

## 2. MONEY

**Integer-born already:** `menuPrice` (round), `localPrice` (ceil ×1.25), staff meals, `WAGE_STD 23` / `clampWage` (int), wage settlement = `Math.round(basePayToday) + Math.round(otPayForecast)` (whole dollars), `settleCreditLine` — `interest = ceil(bal*0.25)` (=ceil(bal/4), exact int), minDue via ceil, `upCost`, `TABLE_TIP 9`, `SOUP_MARGIN 2`, `INGREDIENT_COST` ints, fish `trade.price` int walk 2..7 (`settleFishMarket`), `IMPORTS` prices, `bowlCost`, rents.

**Fractional-dollar births (the complete list):**

| site | formula | smallest meaningful unit / needed intermediate |
|---|---|---|
| `payAndBenefit` tip | `menuPrice * 0.5 * (patience/maxPatience) * tipMult * (1 \| TIP_COUNTER 0.15)`; `tipMult = TRAITS.tip * (1−0.3*dirt) * (1−0.15 if tired≥0.85)`; visitor-capped `min(tip, wallet)` | patience ratio grain ~1/90; tipMult continuous (dirt float). Cents suffice for the RESULT because `payTip` discards `< $0.50` anyway; intermediate needs ~1e-4 $ → compute in **milli-cents (1e-5 $) 64-bit product, round to cents once at payTip entry** |
| `payTip` split | `cut = amt * bizTipShare` (grain 0.05, `setTipShare` double-rounds to dodge 0.35000000000000003), `till = amt − cut`; thresholds `≥ 0.5` | store tipShare as **int 0..20 (twentieths)** → split exact in cents; `till+cut === amt` conservation becomes exact |
| `otPremium` | `hourlyRate * 1.5 * otMin`; `hourlyRate = wageRate/ownStdSpan` (23/360 ≈ $0.0639/min); `otMin` float accum `+= dt*TS` | keep as rational: `wage_c * 3 * otMin_dgm / (2 * span_min * 10)` — needs 64-bit intermediate; result rounded whole-$ at settlement anyway |
| `fundTake`/`fundPay`/`fundRemit` | levy `amt * purseRate/100` (`collectRent` path), caps vs balances, dust gate `< 0.005` | cents; gate becomes `< 1¢`; ledger already rounds to cents (`Math.round(amt*100)/100`) |
| visitor purse mint (`newVisitor`) | `32 + Math.random()*44 + nights*(ROOM_RATE+24)` | mint in whole cents (or whole $) from int RNG |
| table tip (`updateCustomers`) | `tt = min(TABLE_TIP, k.wallet)` — int vs float wallet | cents |

**Verdict: integer CENTS represents every stored balance** (`coins`, `lifetime`, `p.wallet`, `OWNERS[k].till`, `credit.bal`, `townFund.bal/arrears`, visitor `wallet/spent`, `rival` chest). Two formulas need sub-cent intermediates (tip product, otPremium) — both single 64-bit rational products. `worldMoney()`/`auditFund` then become exact: `Math.abs(delta−want) < 1e-6` → `=== 0`. **Bug worth flagging:** today `coins`/`p.wallet` are saved as raw floats but `OWNERS.till`/`credit.bal`/`fund.bal` are rounded at save — a save/load cycle already violates conservation by the dropped fractions; cents fixes this for free.

## 3. CLOCK

- `frame()`: `raw = clamp((now−last)/1000, 0, 0.1)`; `dt = raw * TURBO * (ffSleep ? 6 : FF_SPEED[ffMode])` (FF_SPEED = [1,2,3,6]) — **sim dt reaches 0.6s in browser**; headless is exactly 0.05 (simNow += 50).
- Accumulators: `time += dt` (unbounded float; used by sim in `earnHist` timestamps, income-rate divisor, and the `cotRoster` cache key `time + ":" + n` — a float-stringified key); `tmin += dt*TS` (77 `tmin` refs; rollover `tmin -= 1440` carries the fractional error); `day++` int.
- **Timer census: 42 `-= dt` sites** (toast.t, workT, patience, quip.t, chatT, napT, saveT, reportT, departT, saleArmT/upArmT/askArmT, ferryArm, detour.t, pauseT, climb ±, newConfirmT, winT…), **1 `-= raw`** (hireCard — wall-clock UI, stays float), **5 `±= dt*TS`** (`countT`, `chatCd`, `ballCd`, `otMin`, `bounceT`) plus `restT += dt*TS/60` (hours) and `ferryT -= dtMin`.
- 0.05 and dt*TS=0.2 are **not binary-exact**: 7200 accumulations/day put midnight at 1440±ulps; every `tmin >= 7.5*60`-style gate (job board, polls, mist phases, `darkness()` — piecewise-LINEAR, no transcendental) sits on that noise.
- **Proposal:** one master int tick T at 20/sec (50ms). `tmin` in **deci-game-minutes** (+2/tick, day = 14,400 dgm) — exact; or milli-game-minutes (+200) if sub-frame durations must express in tmin units. Every second-timer in ticks: all constants observed are 0.05-multiples (0.6s=12, 1.5s=30, 2.4s=48, DETOUR_T=20, STUCK_WINDOW=30); randomized durations (`quipT = 14+rand*18`) mint whole ticks from int RNG. `time` disappears from the sim (render keeps its own float clock); `earnHist.t` becomes tick int.
- **Variable browser dt:** the int core must quantize wall frames into whole ticks via a remainder accumulator (at 6x consume ≥6 ticks/frame, clamp 2 ticks per 0.1s raw). Without this, browser and headless diverge by construction — today they already do; the fingerprint is headless-only.

## 4. SPACE / MOVEMENT

- State: `c.x/c.y/tx/ty` floats (crabs **not** position-persisted — only `p` rides the save; visitors save `Math.round(x)`), world 2512px, FLOOR band ~146..176 (`clampY`), `camX` render-only (lerp `dt*5`, snap on follow).
- Speeds: `crabMove = 40 * trait.move(0.8–1.4) * (1 − 0.2*max(0,bored−0.5)) * (sick?0.5) * needDrag(0.70–1.0) * heatShimmer(0.5–1.5)`; `VIS_SPEED 42`; title wander 11. Base step 2.1px/frame; effective 0.7–3.2.
- Position fractions feeding decisions: `stepTo` snap `d<=2.2`; `visStep` `|Δ|>1`/`<=1`; `errandDetour = |x−stop|+|stop−anchor|−|x−anchor|` (float x orders errand choice via `errandScore s > bestScore` — no tie-break, candidate-order dependent); `tableShunned` 26px; `giveBerth` (`|away|<1` tie-break, push `min(...,3)`); `collide` head-on `|dx|>2`, `FLOOR_MAX−0.5` check; `updateStuck` 2px/1.5s, `WARP_PX 14`, `BOUNCE_BUDGET 30` game-min; sleepRough `|x−homeX|<40`; nap `|x−s.x|<20`; wander `<2`; `CHAIN_PX 260`, `DETOUR_SCALE 400`, `DETOUR_MAX 900`; queue order `qSeq` (already int).
- **Proposal: Q8 positions (1/256 px, int32 — 2512×256 = 20 bits)**; speeds Q8 px/s; per-tick step exact product. Compare-only distances in squared ints (ellipse ×9/×5 exact for the 1.8 factor); `stepTo`/`collide` normalization via integer isqrt — LSB rounding choices move crab trajectories, which is pure re-baseline territory (feel referee: congestion → `_stats.warps`, seat declines, eviction median).

## 5. NEEDS / DRAINS

- Fields 0..1 float: `p.hunger/thirst/dirt/bored/tired` (+ visitor `hunger/thirst/dirt/bored/tired`, `patience`).
- Event steps (quantized constants): shift end `+0.25*(load+otF)` hunger, `+0.35*…*1.5?` thirst, `+0.25` dirt, `+0.2` bored (`load = shiftLoad` = minutes ratio, rational denominators ≤ ~420); `TIRED_SHIFT 0.60` integrated per-frame as `TIRED_SHIFT/ownStdSpan * (OT? 1.5) * dt*TS` (≈3.3e-4/frame); `TIRED_ERRAND 0.03`, `TIRED_NIGHT 0.05`, `SOUP_FILL 0.45`, `TAP_RINSE 0.35 @0.85`, `TAP_QUENCH 0.5`, `CHAT_RELIEF 0.06`, shower `−0.5/−0.7`, roast `hunger −0.65`.
- Per-frame drains: visitor `VIS_RATE {hunger .115, thirst .055, dirt .090, bored .045, tired .048}/hr × hrs(dt*TS/60 = 1/300)`; **geometric tired recovery** `tired *= (1 − rate*dt*TS/60)`, `TIRED_DRAIN {bed .30, cot .10}`, `TIRED_NAP {bed .24, cot .08}` — per-tick constant multiplier → Q16 int mul (e.g. 0.999 → 65470/65536), deterministic; `patience -= dt * (staffed?1:6) * serverFilth` and seated `dt*0.35*serverFilth`.
- Ramps/branches: `civicUrge` linear `VOTE_BASE .30 → VOTE_MAX .85` over `VOTE_URGE_HRS` on tmin; `needDrag` piecewise linear (`DRAG_HUNGER_AT .3`, `DRAG_THIRST_AT .5`, `DRAG_MAX .25`, `DRAG_FLOOR .70`); `illRisk` thresholds `≥0.95` summing 0.05–0.12 (+0.08 contagion), roll `min(0.5, risk)`; DIRE 0.9; quip/shun/walkout gates at .8/.85/.66/.95.
- **Proposal: needs as int Q20 (or micro-units 1e-6)**; per-tick increments precomputed int constants (0.115/300 is not decimal-exact — accept ppm-level constant rounding, one-time re-baseline); thresholds become exact int compares.

## 6. STATE SHAPE (save schema)

- **Persona `p` rides RAW** (`personas: crabs.map(c => c.p)`) — float fields to convert: `wallet`, `hunger`, `thirst`, `dirt`, `bored`, `tired`, `restT`. Already int/bool/string: name, trait, shift, job, wage, wageOwner, house/boat/homeless, nCot, boredDays, walkout, rough, made{}, sick.days, ot, sickPol, gripe fields.
- Top-level floats in the envelope: `coins`, `lifetime`, `rep`, `tmin`, `tipShare{}` (0.05 grain), `price{}` (priceMul 0.05 grain), `rival` (war chest), `townFund.bal/arrears` (cents-rounded), `trade.price`-adjacent history ints; rounded-at-save-but-float-at-runtime: `credit.bal`, `OWNERS[k].till`, `ferryT`, `dayOpen`. Visitor block: `x/w/sp/lt` rounded ints already; `hu/th/di/bo/ti` **raw floats**; stay ledger rounded ints.
- Already integer everywhere: `day`, `lv{}` (UPS levels), `townCatch`, `bowls`, ballot `box`, `hours{}`, wages, counts, `hall.policy` indices, dorm/annexe.
- Transient (never saved, still must be deterministic for the frame-hash): crab `x/y`, `otMin`, `workT`, all 42 timers, `animT`/`quipT` (RNG-seeded floats).

## 7. STRAGGLERS

- `nowMs()`/`Date.now` (save metadata `t`, diary timestamps), `new Date` ×2 (display) — out of sim; `performance.now` only feeds `last` (harness-controlled).
- `cotRoster` memo key `time + ":" + n` — float stringified into a cache key.
- Float-ordering-feeds-branch inventory: `errandScore` best-pick (`s > bestScore`, no tie-break); labor OT pick `.sort((a,b)=>(a.p.tired||0)-(b.p.tired||0))` **no tie-break** (`runLaborPolicy` area); shelter sign-up `.sort(wallet)` no tie-break (~`runJobBoard`); heir pick sort has name tie-break; recipe `a.pay − b.pay` sorts (int keys, stable-sort safe); `paint.sort(base)` render. JS sort is spec-stable, so the risk is value drift, not comparator UB — but the two no-tie-break float sorts become nondeterministic across any numeric change.
- Float-threshold branches on money/needs: tip `>= 0.5` ×3, fund dust `< 0.005`, audit `< 1e-6`, price-stepper `±1e-9`, `patience < maxPatience*0.5` (FIFO-jump in `updateKitchen`), `mistNow() > 0.6`, `darkness() > 0.7/0.6/< 0.5`.
- RNG stream shape: all 91 sites share ONE stream (headless swaps `Math.random`); **cosmetic draws are interleaved with consequential ones** — quip text picks, `animT`/`quipT` seeds, wander spots sit between illness rolls, `ferryBatch` counts, `visNeeds`, hire rolls. Browser-only consumers (`pickTrack`, `toggleMute`, title-screen wander, one draw-path site) never run headless (draw is fully gated by `window._headless` after `collide`). The int core must either freeze exact call order or split decision/cosmetic streams — either way a one-time re-baseline. `mistPeak` hash + mulberry32 are already integer; keep.
- `settleFishMarket` averages: `avg(landH)` float division compared `D > S+1` — convert to sum-vs-sum int compare (`sum(useH)*len? ` — windows are equal length 3 after warmup, so `sumD > sumS + 3`).
- `rep`: float 0..100, steps +0.8/+0.4/+0.5/−1.2/−3 and daily `rep += (30−rep)*0.06` → **deci-rep int** (steps ×10 exact) with a defined rounding for the ×6/100 relaxation; `ferryBatch` `2.0 + rep*0.013 + (rand−0.5)` → int milli-units.

## THE 3 NASTIEST CONVERSIONS (my judgement)

1. **`heatShimmer` → `crabMove` (the only sim sine).** `sin(time*4 + animT*6.3)` modulates a thirsty crab's speed ±50% every frame; phase is the unbounded float wall-clock plus an RNG-seeded float, and the design comment stakes "mean-preserving by construction" on the sine. Conversion needs an int phase accumulator in turns (mod 1) + sine LUT, a decision about what replaces `time`, and proof the LUT's mean over the actual tick cadence is still 1.0 — or the speed penalty silently changes and the eviction floor moves. Beats `priceAppeal`, which collapses to a 13-entry LUT.
2. **The `stepTo`/`collide`/`giveBerth`/`updateStuck` movement cluster.** hypot magnitudes (not just compares) feed normalized pushes with dt-coupled clamps (`min((12−d)/2*min(1,dt*12),4)`), asymmetric tie-breaks, and an O(n²) pair order; integer isqrt rounding perturbs every trajectory, and congestion is load-bearing gameplay (BOUNCE_BUDGET/warps, cabana lanes measured to ±px, SHUN geometry). Largest re-baseline blast radius, and the place where "fixed-point but same feel" is genuinely hard to argue from the diff.
3. **The tip pipeline (`payAndBenefit` → `payTip` → wallets/tills) + its grid-snapped inputs.** The one place fractional money is minted: a 5-factor product over a float patience ratio, dirt/tired multipliers, `TIP_COUNTER 0.15`, then split by a 0.05-grain share (itself double-rounded to fight binary noise), capped by a float-minted visitor wallet, gated at `≥$0.50`, and finally required to satisfy an **exact** `worldMoney` conservation audit in cents. Needs milli-cent intermediates, one canonical rounding point, int share (n/20) and priceMul (n/20) representations, and a save-format migration (raw float `coins`/`p.wallet` today). Runners-up: `settleFishMarket` avg-compare and `rep`'s `(30−rep)*0.06` relaxation.

Files: `/Users/matthewbaker/crab-shack-3.5/game.js`, `/Users/matthewbaker/crab-shack-3.5/crabs.js` (persona gen only — 1 RNG site, already takes an injectable `rng`), `/Users/matthewbaker/crab-shack-3.5/tools/simlib.mjs` (mulberry32 + `Math` proxy — the seam where an explicit sim-RNG object would replace the global swap).
# THE SECOND-CULTURE SEAM — visitor pipeline cartography, ~/crab-shack-3

All refs `game.js` unless noted. game.js = 16,211 lines. Design intent for the whole pass: block comment at 9038–9075 ("THE FERRY, AND VISITORS WHO ARE PEOPLE", owner directive 2026-08-19). **Canon collision**: `PLAN.md:3429-3436` currently states *"neighbouring cultures are HINTED… A pig does not get off the boat in this game"* — the new Porkresentative Pigpublic directive explicitly supersedes this; PLAN.md:130-133 already names the mainland pigs as canon.

## 1. FERRY / SAILINGS (engine clock)

- `FERRY` geometry const 9084–9090: hull 2074, gangway 2046, shore 1852, `deckY` 100 (visitors walk pier planks 66px above FLOOR_Y).
- Timetable `FERRY_TIMES` 9099 = [08:00, 10:30, 13:00, 15:30]; `FERRY_STAY` 75 game-min alongside (9100); `FERRY_CALL` 165 (9101).
- Boat size = **reputation**: `FERRY_BASE/FERRY_REP/FERRY_MAX` 9123, `ferryBatch()` 9151–9154; per-sailing load factor `FERRY_LOAD` 9139. Rep also sets purse wealth: `REP_FLUSH_BASE/SPAN`, `REP_PURSE_BASE/SPAN` 9130–9131, `repFrac()` 9132.
- Clock: `runFerry(dtMin)` 9483–9503 (dock on timetable, call leavers, board plank-standers, sail). `ferryDock(n, idx)` 9327; last sailing of day ⇒ all passengers are overnighters (9330–9335). `ferryGo()` 9414 (sail; day-tripper who dawdled becomes overnighter 9424–9430). Extension hook: `window.onFerry(kind, info)` via `ferryNotify` 9146–9148 — the *declared* seam ("another agent owns the horizon", 9078–9083).
- Departure timing: `nearestSail(want)` 9373 (stay pinned to an actual sailing at mint time); `visWalkMins(k)` 9384; `ferryDepartCall` 9395 (leave only when the walk requires); `visLeave` 9403.
- Rendering: `drawFerry()` 11369–11390 — ONE hull, name label `won ? "[the town's name]" : "FERRY"` 11382. Fingerpost `drawFerrySign()` 11469–11494. Win = buying this same ferry (`FERRY_PRICE` 4993, canon note 11374–11378).

## 2. SPAWN / PURSE MINT

- `newVisitor(overnightOnly)` 9252–9294. Nights: 0/1/2 via `VIS_DAYTRIP` 0.60 (9210). **Purse formula** 9264–9270: `32 + rnd*44 + nights*(ROOM_RATE+24)`, × rep multiplier, + flush bump, ×0.6 "travelling light" 12%. `wallet`/`purse`/`spent` minted at 9285. `leaveT` pinned via `nearestSail` 9271.
- Identity at mint: `name: freeVisitorName()` 9274, `color` random over **CRAB_COLORS** 9275, `acc` random over **ACC_KEYS** 9276 (crab accessories: `crabs.js:66` cap/bow/shades/flower/none; art `sprites.js:335` ACCESSORIES).
- Needs baseline `visNeeds()` 9241–9251 (5 needs, 1–2 "loaded" high — legible off the boat).
- Harbour dues charged at gangway: `ferryDock` 9347–9351 → `harbourDues(v)` 1163–1168 (governance purse `PURSES` 702, mech "dues").
- Money conservation: minted wallets counted in town money supply at 1018; destroyed on sail (audit doctrine 9068–9074, 486–504).
- Legacy-save seeding only: `seedVisitors()` 9309–9326, gated by `preVisSave`/`_vis` marker (6306, 6630).
- Anonymous walk-in customer (separate, still alive): `newCustomer(bizKey)` 9877–9888 — same CUSTOMER_NAMES/CRAB_COLORS/ACC_KEYS identity roll, patience 50.

## 3. STATE MACHINE

- `VIS_STATES` 9158: ashore/roam/toBiz/toRoom/inRoom/onSand/toPier (+ the shop pipeline's own states arriving/waiting/toSeat/seatedWaiting/dining/toStall/showering/leaving as sub-machine — doctrine 9060–9067). `VIS_SAVE_STATES` 9162 (toBiz never saved).
- Tunables: `VIS_SPEED` 42 (9164), `VIS_PATIENCE` 100 (9171), `VIS_THINK` 1.6s (9172), `VIS_RATE` (need growth/hr) 9182, `VIS_WANT` (thresholds) 9183, `VIS_RANK` (priorities ≠ locals') 9190, `VIS_BED_DRAIN` 9191, `VIS_ROAM` [700,1900] + `VIS_STROLL` 340 (9196–9197), `ROOM_RATE`/`ROOM_HOUR`/`ROOM_RANK`/`ROOM_URGE`/`BED_HOUR` 21:00/`WAKE_HOUR` 07:30 (9200–9209), `SAND_SPOTS` 9216, `TOURIST_QUEUE_MAX` 4 (line 33), `DETOUR_SCALE` 7425.
- `visTick` 9713 (needs + mist ledger + inRoom bed-drain + morning checkout + sand penalty); `updateVisitor` 9740–9827 (mover per state; roam block owns think/bedtime); dispatched from `updateCustomers` 9900–9906.
- `visAfterCounter` 9828–9843 rejoins counter pipeline to visit ("leaving ≠ leaving the world").
- Table tip on visitors clamped to wallet, 10004–10005; visitor pruning rule 10022.

## 4. HOTEL / ROOMS

- BIZ.hotel def ~222–300 (rooms are `stalls`, `lodging` flag; "dish" = a night; `HOTEL_ROOMS_BASE` 7, rent lore 3761); `ROOM_CFG` 3736; annexe/cabana build 3795–3834; cabana render `drawCabana` 3969–3990 (guest lamp/Z); hotelier NPC 3209–3430.
- `hotelRooms`/`freeRoom` 9505–9506; `sweepRooms` invariant 9512; `checkIn` 9524 (string "AT THE DRIFTWOOD"), `checkOut` 9532; `roomPrice()` 9602 off the live board; `wantsRoom`/`roomReserve` 9592–9603 (**room money held back** — the wallet mechanic in one line); room reserved at set-off `visGo` 9695–9698; key handover path in `serve()` via `BIZ[b].lodging` 9022.
- No room ⇒ `sleepOnSand` 9548–9587: environment answer; `sandWhy` broke/shut/unmade/full recorded at the only frame the answer exists (9565–9568); rep −1.2 at boarding 9446.

## 5. WHAT THEY BUY — `visPick` 9618–9694

- Candidates gated by `visOpen` 9608, `visRoomFor` 9611, affordability at **board price** + room reserve (9623–9636); each rejection recorded on the stay ledger `stayBlocked` shut/full/broke (9663) — the departure card's raw material.
- Selection style per need: `treat`/`plate`/`cheap` closures 9648–9656 — holidaymakers order off the menu, unlike locals' under-$40 rule. Need→shop mapping is **hard-coded**: hunger→shack, thirst→juicebar else shack, dirt→showers, bored→arcade (9657–9661), bed→hotel 9668–9669.
- Score = (VIS_RANK + level) × `priceAppeal(biz)` / distance (9686); room has its own ramp + 15:00 absolute (9676–9679).
- Payment: `payAndBenefit` visitor branch 8940–8953 (wallet decrement, tip = leftover-clamped, `visBenefit` 8971–8985 zeroes needs by DRINKS/biz rules; `stayBought` 14634). `DRINKS` table 4795.

## 6. DEPARTURE — ledger, manifest, quotes

- Stay ledger `newStay()` 14582–14614 (waits, quits, serves, tables, meals/drinks/washes/games/rooms, topItem, tips, dues, shut/full/broke, mistMin, missed, sandWhy); accessor `stayOf` 14620; hooks `stayQueued/stayWait/stayBought/stayQuit/stayBlocked` 14624–14663.
- Frozen row `departRecord(k)` 14665–14695 (includes `color`, `acc` — stored though drawDepart doesn't draw the sprite yet); banked into `today.left` (cap 40) at `visBoard` 9432–9481, which also destroys the wallet, applies rep word-of-mouth, feeds `_stats`.
- Quote engine: `DEP_MOODS` 14700, `DEPART_RULES` 14746–14872 — **~22 weighted rules, every line a hard-coded English sentence** ("I SLEPT ON THE BEACH.", "SLEPT AT THE DRIFTWOOD. BEST BED ON THE COAST.", "WORTH THE CROSSING."); `visQuote(r)` pure fn 14876. Card: `departBuild` 14907, `drawDepart` 14922–14991 (mood pips, money band BROUGHT/SPENT/TOOK HOME), pager 14993–15013. Doctrine block 14537–14580: quote DERIVED never random; single-quote glyph constraint of FONT_SMALL (14978–14984 — pig text must respect the same font).

## 7. NAMES

- Visitor pool = `CUSTOMER_NAMES` `crabs.js:100-105` — 26 sea/crab puns (MOLT, KRILL BILL, ANEMONE, WAVY DAVE, PLANKTON PETE…). `freeVisitorName()` 9230–9236 dedupes against all crabs + visitors in town ("that's MISTY" recognisability doctrine 9227–9229). Locals = `CRAB_NAMES` `crabs.js:3`. Hire fallback literal `"CRAB"` at 7154.

## 8. RENDERING — visitor vs local

- Visitors and walk-ins draw with **crab sprites**: `drawCustomer` 12020–12070 uses `CRAB_ARTS[k.color]` (12023) + `ACCESSORIES[k.acc]` (12037); face-direction 12051; name label on boardwalk 12047–12053; `custY` planks offset 12019. Crew/locals use `drawCrab` (~11960s) — same CRAB_ARTS.
- **`TOURIST_ARTS` (5101) is built but never drawn** — the old humanoid 12×19 tourist sprite `_TOURIST` + `TOURIST_STYLES` (H hair/T shirt palette swaps) survive at `sprites.js:99-128` as a dead but working template for a *second body shape with palette-swapped styles* — the exact shape a pig sprite needs.
- Cards: follow card `drawCustCard` 12177 (portrait = CRAB_ARTS 12181; "VISITOR - " label 12163; wallet/purse line 12165); dossier `drawVisDossier` 13149–13195 (2× portrait via `art2("c"+k.color, CRAB_ARTS…)` 13156 — portrait cache keyed by color id, needs species namespacing; PURSE/SPENT/SLEEPS/FERRY rows; "ROOM n AT THE DRIFTWOOD" 13175). Heights `VIS_H` 162 at 12944. Anonymous walk-in dossier `drawCustDossier` 13196–13230 with 4 hard-coded quips 13210 ("THE GULLS FOLLOWED ME HERE").
- Status/condition strings (visitor-facing UI copy, species-neutral but crab-cultural): `custStatus` 12127–12146, `visStayLabel` 12147, `visCondition` 12152–12165, `visBars` 12166 (same 5 bars as crabs — deliberate one-vocabulary doctrine 8967–8970).

## 9. SAVE ROUND-TRIP (already the CS3.5 seam)

- Serialize 6277–6305: per-visitor `{n,c,a,x,y,s,w,p,sp,ni,nh,rn,un,ar,lt,b,rm,hu,th,di,bo,ti,log,st{…}}` — identity is **name + crab-color index + crab-accessory key**. No species field.
- Restore 6638–6684: clamps color to `CRAB_COLORS.length-1` (6643) and acc to `ACC_KEYS` (6644) — **a save cannot currently carry a non-crab visitor**; room re-link by index; ledger clamped as untrusted input.
- Conversion: `convertTourist` 7167–7187 — a hired tourist becomes a crab via `makeCrabPersona` (crab TRAITS + quips, `crabs.js:8-64`), keeps name/color/acc; `hireCrew` 7197. **A pig hired here would silently become a crab.**

---

# MINIMUM VIABLE PIG — per-culture definables

Legend: **[T]** already a data table (move to save) · **[F]** formula to parameterize · **[HC@N]** hard-coded crab assumption at line N.

1. **Sprite/body** — [HC@12023, 12181, 13156, 12037] visitors render `CRAB_ARTS[k.color]`; need `k.species` → art-set lookup. [T-shaped precedent] dead `_TOURIST`+`TOURIST_STYLES`+`touristArt` `sprites.js:99-128` is a ready palette-swap template. Portrait cache key [HC@13156] `art2("c"+color)` needs species prefix.
2. **Palette/styles** — [T] `CRAB_COLORS` `sprites.js:89` (+push at 811); per-culture color table; save clamp [HC@6643].
3. **Accessories** — [T] `ACC_KEYS` `crabs.js:66` + `ACCESSORIES` `sprites.js:335` (pixel dx/dy fitted to crab body); save whitelist [HC@6644].
4. **Name pool** — [T] `CUSTOMER_NAMES` `crabs.js:100`; picker `freeVisitorName` [F@9230] (dedupe logic is infra; the pool is culture). Hire fallback [HC@7154] `"CRAB"`.
5. **Purse profile** — [F@9264-9270] mint formula constants (base 32, spread 44, per-night ROOM_RATE+24, flush/light odds) + rep coupling [F@9130-9131]. Culture = the constants; conservation (mint/destroy, audit 1018) = engine.
6. **Stay-shape** — [F@9252-9254, 9210] nights distribution & VIS_DAYTRIP; [F@9182-9190] VIS_RATE/VIS_WANT/VIS_RANK (a pig's appetites can genuinely differ — hunger-leads doctrine 9173-9181 shows these are load-bearing economy knobs).
7. **Food preferences** — [F@9657-9661] need→shop map is hard-coded to the four crab shops; [T] BIZ recipes 140–300 + `DRINKS` 4795 + `ITEM_NAMES` 4787 are tables. Cross-cultural foodways = per-culture recipe-affinity weights over shared recipe tables; `treat/plate/cheap` selection closures [F@9648-9656].
8. **Diary voice** — [HC] every `visLog` string is inline English: 9345 "CAME ASHORE OFF THE FERRY", 9323, 9409, 9528 "AT THE DRIFTWOOD", 9536, 9569, 9744(visTick "WOKE UP ON THE SAND"), 9765 "TURNED IN FOR THE NIGHT", 8983 "BOUGHT X AT THE…", 9834 "GAVE UP WAITING…". Needs a per-culture string table keyed by event id.
9. **Departure quips** — [HC@14746-14872] all ~22 `DEPART_RULES.line` closures; the weights/rule ids are infra (derived-not-random doctrine), the sentences are culture. Also mood tags [T@14700]. Font constraint: 3×5 font has `'` not `"` (14978).
10. **UI copy for visitors** — [HC] "VISITOR - " 12163/13158, `custStatus` phrases 12127-12146, `visCondition` words 12152, "VISITORS ASHORE" toast 9360, "NO ROOM!" 9587, dossier row copy 13166-13177 (incl. "AT THE DRIFTWOOD", "GOING HOME ON THE NEXT BOAT"). Species-neutral wording mostly, but the voice is one culture's.
11. **Pronoun/species audit** — clean: visitor copy uses THEY/THEIR throughout (12127-12146); the word CRAB in UI is locals-only (hire/help/report screens 4799, 15065-15219) EXCEPT the hire pipeline where a converted pig becomes a crab persona [HC@7174 `makeCrabPersona`] with crab TRAITS/quips [T@crabs.js:8-64], and the ferry becomes "[the town's name]" post-win [HC@11382].
12. **Arrival vector** — [T/F] FERRY consts 9084-9090 + FERRY_TIMES 9099: pigs arrive on the *same* ferry (shared infra); a per-culture manifest mix (share of each boat that is pig) is a new [F] on `ferryDock` 9337-9346.
13. **Anonymous walk-in** — [HC@9877-9888] `newCustomer` rolls the same crab identity; and its dossier quips [HC@13210].
14. **Save schema** — [F@6277-6305/6638-6684] add species field + species-aware clamps; VIS_SAVE_STATES [T@9162] unchanged.
15. **Conversion/immigration** — [HC@7167-7187] convertTourist: persona factory, trait table, quips, name source all crab; "a pig who stays" is the deepest seam (housing, shifts, diary all crab-side).

# INFRASTRUCTURE (engine) vs CULTURE (save)

**Stays engine-side**: ferry clock/timetable/berthing (`runFerry`, `nearestSail`, `ferryDepartCall`, walk-time math); money conservation (mint/destroy, audit 1018, harbourDues plumbing); queue mechanics (qSeq 9856-9876, TOURIST_QUEUE_MAX); state machine + movers (`updateVisitor`, `visTick` structure, `visStep`); room/stall occupancy invariants (`sweepRooms`, checkIn/Out flow, sandWhy taxonomy); stay-ledger schema + hooks + `departRecord` row shape; quote *engine* (weighted-rule selection, mood strip, pager); rep coupling constants; save clamp framework; the five-needs vocabulary (deliberate one-vocabulary doctrine — a pig should carry the same bars).

**Moves to the save (per culture)**: sprite art + palettes + accessories; name pools; purse-mint constants; nights/daytrip distribution; need rates/thresholds/ranks; recipe-affinity / need→shop weights; every visitor-voiced string (diary lines, departure quotes, dossier/status/condition copy, walk-in quips); persona factory for converts (traits + trait quips); culture-branded proper nouns currently inline ("DRIFTWOOD", "[the town's name]", "CRAB SHACK").

**Sharpest single blocker**: visitor identity is `(name, CRAB_COLORS index, ACC_KEYS key)` with CRAB_ARTS as the only body — three save-restore clamps (6643-6644) and four render sites (12023, 12037, 12181, 13156) plus `convertTourist` (7174) are the complete list of places that assume the boat only ever carries crabs.
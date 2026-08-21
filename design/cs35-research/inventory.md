All reading complete. Final inventory follows.

# CS3 CULTUREWAY CARTOGRAPHY — the Democrabic Crabocracy in game.js

All refs `game.js` unless noted. PLAN.md design intent: POLLING DAY §3477–3646, CULTURE OF THE CRAB PEOPLE §3395–3446, MAYOR/FUND/ELECTIONS §4464–4842, ACCOMMODATION seam §6362. Headless attribution flags: `tools/headless.mjs:41-53` (`--nohall`, `--nofloor`, `--nocap`); game reads them only via `hallOn()` 1143, `minWage()` 4259, `headCap()` 754.

## INVENTORY

### (a) Plain config data
- `SHELTER_RENT` 10, `SHELTER_FLOAT` 1, `SHELTER_STRIKES` 3, `SHELTER_SHUT_NIGHTS` 4, `SOUP_MARGIN` 2, `POT_MAX` 6, `POLL_WEEKDAY` 6 — 655-683
- Soup consts `SOUP_X/AT/SICK_AT/FILL/MINS/CD` — 122-127
- `PURSES` table (4 purses: name/short/unit/who/steps[5]) + `PURSE_KEYS` — 702-717; `WAGE_FLOOR` 731-733; `HEAD_CAP` 755-757 (steps ceiling = `CREW_MAX_MAYOR`)
- `TIN_KEEP` 30 (769), `POLL_LINES` 24 (770), `WHIP_KEEP` 8 / `WHIP_MAX` (1607-1608)
- `POLL_PLACES` (two tables, x + name — x's hand-measured against furniture) 832-843; `POLL_BW` 40 (844); `POLL_OPEN` 7:00 / `POLL_SHUT` 19:00 (845-855); `BALLOT_PRICE` 0.25 / `BALLOT_SPARE` 2 (856-857); `VOTE_SECS` 5, `COUNT_MINS` 3, `VOTE_CD` 12, `VOTE_URGE_HRS` 3, `VOTE_BASE` 0.30, `VOTE_MAX` 0.85, `VOTE_DX` 11, `VOTE_Y` 157 (859-886)
- `DORM_CFG` {BASE 4, MAX 12, RENT 3, ROUGH 2, COOL 4} — 3500-3525
- Founding policy literal `{mech:"rents", rate:4, bowls:2, wage:0, cap:0}` — 902; player default platform 905
- `IMPORTS.paper` row — 4724-4734 ("the only import the TOWN buys")
- Top-hat pixel art `ACCESSORIES.tophat` — sprites.js:375-382; deliberately NOT in `ACC_KEYS`
- All diary/toast/quip strings ("MARKED AND IN", "NO PAPER?", potLine phrases, board texts) scattered at 1270-1279, 7768-7796, 11538-11543
- `WEEKDAYS`/`weekdayIdx` (4011-4014) are HOST calendar, not culture — culture only pins `POLL_WEEKDAY` to it.

### (b) Formulas / predicates
- Poll state predicates `pollWeekday/pollCalled/pollHeld/pollOpen/pollCounting/hasVoted/pollPapers` — 918-927
- `civicUrge(c)` turnout ramp (VOTE_BASE→VOTE_MAX over last 3h, capped below DIRE) — 948-953
- `mayorCrab/isMayor/playerMayor` (conflict-of-interest predicate) — 954-959
- `purseOf/purseRate/policyLine` (policyLine doubles as ballot dedup key — 962 comment) — 960-974
- Bills: `bowlCost()` floats with fish price 1088; `shelterRent()` 663; `potWant()` demand-capped ceiling 1110-1113; `ballotBill()` two-nights-out budgeting w/ collection-lag reasoning 1122-1136; `fundNeed()` no-hoard rule 1137-1140
- Voter economics: `potStake` 1298-1307, `purseCost` 1308-1314, `purseYield` 1321-1332 (reads today.biz takings, house count, ferry heads, wallets), `platTake` 1341, `platBowls` 1342-1344 ("bowls after the roof" — the decisive term), `roofWeight` adaptive ×2 in arrears 1358-1361, `selfEmployed/floorBill/floorRaise` 1377-1388, `capStake` 1394-1411, `wageStake` 1412-1419, `platValue` 1427-1433, `allPlatforms` grid + memo fields 1436-1449, `capAsk` inverted-ask tie-break 1456, `idealPlatform` w/ smaller-ask tie-break 1457-1472
- `voteReason(c,p)` — one written line per voter in own terms 1476-1500
- `buildBallot()` — one candidate per distinct platform, top-4 by gain, incumbent always seated, player nominee replaces identical NPC platform — 1506-1559
- `pickCandidate(c,cands)` deterministic self-interest vote w/ incumbent-then-alphabetical tie-break — 1562-1572
- `seatFoundingMayor()` — max potStake NPC — 1842-1852
- Shelter growth test `bunkWhy()/canBunk()` — purse-carries-the-bill predicate 3618-3630
- Policy readers: `floorOf/capOf` 738-767, `minWage()` 4259, `legalWage` 358, `floorBinds` 4265, `capFull/capWhy/bizHeads` 758-764

### (c) Scheduled multi-day processes
- Weekly cadence: first ballot day 7, every Sunday (`pollWeekday(day+1)` gate in `runTownHall` 1830)
- Nominations close + paper bought at Saturday settlement: `printBallots()` 1619-1657 (whip-round fallback, short-set outcome, `ballotBox` struck for day+1)
- Polling-day 5-state lifecycle inside `updatePoll(dt)` 1681-1716: no-paper announce at open, shut at POLL_SHUT, hand count at COUNT_MINS per paper on town clock, ticked from main loop 15870
- `finishCount()` settlement safety-net 1717-1729; `declarePoll()` — office changes hands on the promenade at teatime, field-by-field platform copy hazard documented 1730-1794
- `runTownHall()` settlement pipeline, ORDER is the design: vacancy re-seat → shut countdown → `collectPurse` → rent (arrears/strikes/bolting) → `printBallots` (paper BEFORE soup) → `stockPot` → `finishCount` — 1796-1841; called from settlement 15625
- `hall.termDay` bookkeeping 1767, 1851; ballot two-nights-ahead budget in `ballotBill` 1122
- NPC mayor's dorm policy `runDormPolicy()` — streak/cooldown bed-signing state machine, same idiom as HOURS_POLICY — 3690-3720 region

### (d) Crab ACTIONS in the actor state machine
- Vote as errand: offered in `pickErrand` 7647-7648 (gated `pollOpen && !hasVoted && !c.duty && dayState!=="working"`; ill crabs may vote); soup errand 7623-7626 (sick-only, last, funded)
- `ERRAND_RANK.vote = 2` and `needLevel` "vote" → `civicUrge` — 7424, 7431 (scored by the generic detour machinery `errandScore`)
- `startTapStop` queue-slot spacing along the table (`VOTE_DX`, `pollVoters` 930-933) — 7727-7737
- `updateTap` — arrival-after-shut = lost vote + `ballotBox.late` + diary; `VOTE_SECS` dwell; completion calls `castVote` with three named outcomes (cast/nopaper/late) each with popText+quip+diary+stats — 7738-7810
- `castVote(c)` — paper decremented, mark recorded face-down (`cast[]`, `voters{}`, `lines[]`), tally untouched — 1660-1679
- `takeBowl(c)` + soup consumption + cold-pot failure — 1284-1291, 7784-7797
- Mayor keeps working their shift (hat worn OVER toque, `crabHat` 11903)

### (e) UI surfaces
- HALL tab on management card: `HALL_VIEWS` BOOKS/BALLOT/ROLL 13385, `drawHall` 13712-13840 (mayor line, policy line, 5-state election status line incl. nominations-close warning, fund books w/ 4 ledger rows naming counterparties, live ballot page with deliberately NO running tally, roll pages), `drawElection` candidacy strip 13841-13925 (STAND chip, nominee cycler, 4 policy dials, self-billing captions)
- Click handler: manageTab "HALL" 10684-10762 — stand/withdraw, nominee cycle, `hall.plat` dials mirrored onto `hall.policy` only while `playerMayor()` ("manifesto vs lever" fix)
- World signage: `drawPollingPlaces` — trestle/box/slot/one-pixel-per-sheet pile/count pile/5-state board — 11513-11553; shelter notice (MAYOR line, `potLine()`, `dormLine()`, BED+ chip) 11574-11590; steaming pot sprite 11592-11605
- Nav strip: blinking poll-table pips 12507-12513
- Dossier OFFICE row 13274; crew-limit toasts naming the hat 10296, 15351; help card page "h" 15095; nightly report day-book (`youPaid/youGot`, reset 15462, stats 15838)
- Wage-stepper refusal "$N IS THE TOWN'S MINIMUM WAGE — THE HALL SET IT" 10625, 10661; hire refusal `capWhy` "…THE TOWN VOTED FOR IT" 10301-10302

### (f) World objects / props
- Two polling tables + ballot boxes (transient — exist only while `pollCalled()`), 11513
- Town-hall "building": THERE ISN'T ONE (PLAN 4818: "the office is a hat, a policy and a placard") — the shelter is the physical anchor
- Shelter + dorm loft/beds/cots (`cotSpot` geometry-derived MAX 3556-3559), pot on the step, notice board placard, top hat, memorial row adjacency
- BED+ chip rect machinery `dormNoticeY/H`, `bunkChipRect/Live`, two-tap arm `tapBunkChip` — 3654-3689

### (g) Economy / ledger movements (conservation-proved)
- Account abstraction `acctBal/acctMove/acctName/bizAcct` — 977-1000 ("deliberately no account for 'the town'")
- Three doors only: `fundTake` 1040 / `fundPay` (through `creditBiz`, same door as a tourist's taco) 1057 / `fundRemit` (world-destroying, landlord/ferry only) 1073; `fundRow` 48-row ledger 1033; `worldMoney` + `auditFund` per-movement proof 1004-1032
- Collections: `rentCut` (diversion intercepted mid-rent-payment) 1152-1157 ← settlement branch 15560; `harbourDues` at gangway per head 1163-1167 ← 9348; `collectPurse` levy two-pass proportional scaling + rotating deterministic tin 1173-1226; `whipRound` for paper 1609-1617
- Spending: rent remit + arrears/strikes/bolt in `runTownHall` 1807-1821; `stockPot` buys bowls from `SOUP_BIZ` at `bowlCost()`, shack then buys the fish (debitBiz + consumeIngredient), waste counted 1237-1263; ballot paper `fundRemit` + `tradeImport("paper")` 1644; bed key money `buildBunk` 3633-3646
- `trade.spentBy` split precisely because paper broke the fish-only assumption 4736-4744

### (h) Cross-cutting hooks into other systems
- Wage system: `minWage()` read by `legalWage` 358, `rawWage` wrapper 4262, job-board postings 2933, both wage steppers; floor billed till→packet without touching the fund
- Hiring: `capFull` gates board hires 7113, poaching 4555/10564, chef purchase 10301; `crewCap` lifted to 12 by `playerMayor()` 4820-4822
- Ferry/trade: dues at landing 9348; paper as an `IMPORTS` row drawn on the trade board 14313
- Housing/settlement: rentCut inside house-rent branch (money "still IN the wallet") 15560; eviction→shelter feeds `potStake`/`roofWeight`; sleep-rough teeth (no rest → sickness roll) are the failure mode's payload
- Shifts/hours: turnout gradient derives from shop OPEN HOURS (D-shift bracketed by polls) — no code link, a *measured emergent* coupling; the hours sign is the player's turnout lever
- Illness: `potWant` counts `c.p.sick`; soup errand sick-only; `p.bowls` persona field feeds back into next vote (1281 comment: "an election about something that happened")
- Save/load: writer 6236-6248 (`fund`, `hall`, `box`, `dorm` keys, ~9.4% of envelope per PLAN 4636); loader with full adversarial clamping 6473-6580 (paper can't be conjured on reload 6563-6566); `seatFoundingMayor` at newGame 5166 and load 6699
- Suite: ~25 of 247 scenarios are crabocracy (`tools/suite.mjs` 6528-6997, 7707-8064, 8265-8639, 9856-9966 — conservation proof, action-vote, paper, count, hat-pass, clamping, draw-collision sweeps)

## WHAT A CULTUREWAY DEFINITION LANGUAGE MUST EXPRESS

1. **Named institutions with state schemas** — `townFund`, `hall`, `ballotBox`, `dorm` are typed records with save/load round-trip, per-field clamps, and legacy-save defaults ("an old save has no hall and gets the founding arrangement"). The language needs declarable persistent state + validation + migration defaults.
2. **A closed money-movement algebra** — exactly three verbs (take-from-named-account, pay-to-business-via-sale, remit-out-of-world), each auditable, each naming counterparty+reason. Conservation must be provable *by construction*: a cultureway may never write a balance, only invoke movement verbs against host accounts. This is the single strongest constraint the crabocracy demonstrates.
3. **Interception hooks on host money flows** — rentCut (share of a payment in flight), harbourDues (event: visitor lands), levy (share of a day-book aggregate with per-shop floor + proportional scaling), tin/whip (means-tested rotating solicitation). Four different *attachment points*: mid-transaction, world event, settlement aggregate, wallet scan. A DSL needs a taxonomy of tap points, not one generic "tax" primitive.
4. **Policy dials consumed at named choke points** — the office publishes values (minWage, headCap, bowls ceiling, purse choice) and *other systems* read them at ~10 pre-existing decision sites (wage clamp, hire gate, crew cap). Culture-as-data requires the host to expose a registry of "policy slots" those systems already consult; the crabocracy hard-codes each read.
5. **Scheduled multi-phase processes with strict intra-day ordering** — weekly calendar riding host weekdays; a settlement pipeline whose ORDER is load-bearing (rent before paper before soup; paper budgeted two nights out because of collection lag). Needs: cron-on-game-calendar, ordered settlement steps, and cross-day budgeting lookahead.
6. **Utility-theoretic agent preference functions** — platValue = Σ small legible terms (stake, cost, roof, wage, cap) over a platform grid, with deterministic tie-breaks (smaller-ask, inverted for the cap) and a per-voter natural-language justification generator (`voteReason`). The language must express arithmetic over crab/persona/economy queries AND produce the explanation string from the same terms (legibility is a ruling, not a nicety).
7. **New errand types injected into the actor state machine** — declare: urgency function (ramp), eligibility predicate, location set (multiple, nearest-picked by host detour scoring), dwell time, queue spacing, on-complete outcomes each with diary/popup/quip/counter, cooldown, and hard caps (never above DIRE — culture must not override survival). Voting and the soup queue are both instances of this one missing abstraction (today: inline branches in `pickErrand`/`startTapStop`/`updateTap`).
8. **Physical resources with supply chains** — ballot paper is bought, imported on the trade ledger, piles down one pixel a sheet, runs out, and can't be conjured by a reload. A cultureway must be able to declare a commodity + purchase trigger + visible stock.
9. **World props + signage with layout constraints** — transient furniture (tables), permanent placards, state-driven boards (5 states), a costume rule (`crabHat` override), nav-strip pips. Hardest part: *placement* — POLL_PLACES x's were measured against a full 2512px coast and 4px of signage cost 17 turnout points. A language needs host-mediated placement (slot registry / collision-checked gaps), not raw coordinates.
10. **UI card pages with paged sub-views, gated controls, and refusal strings** — a whole management tab (3 views, dials live only while in office, every string width-trimmed). Realistically: declarative card DSL (rows, chips, pagers, budgets) rendered by the host.
11. **Failure modes landing on named people** — cold pot, no paper, too late, bolted door: each is a per-crab event with diary line + visible moment. The language must let failure outcomes address individuals, not aggregates.
12. **Anti-ratchet invariants** — corrective-loop guarantees (roofWeight doubling, whipRound, hat-passing on vacancy, incumbent-stays defaults for empty box / no paper). These are design theorems the culture author asserts and the scenario suite enforces; a cultureway format wants a place to *state* them (testable invariants shipped with the culture).
13. **Culture-off switch** — everything behind one predicate (`hallOn()` at ~15 sites) for attribution measurement. A cultureway should be removable as a unit.

## FRACTION JUDGEMENT

By mechanism count: **~25% is pure (a)-config** (all constants/tables/strings/art — trivially data). **~40% is formulas + scheduled process** expressible in a modest declarative/functional DSL over host queries (the entire voter-economics stack, bills, calendar, count — these are pure functions + an ordered pipeline, the easiest real-logic tier). **~35% needs host capability APIs rather than culture code**: the errand injection, money-movement algebra, interception hooks, policy-slot registry, rendering, save hardening. Almost nothing in the crabocracy is *irreducibly* imperative — but very little of it is expressible today without those APIs existing.

## DEEPEST ENTANGLEMENTS (extraction hazards)

- **`pickErrand`/`updateTap`** — vote and soup are inline special cases in shared 200-line actor functions (7600-7810) alongside water taps; the `e.vote`/`e.soup` flags thread through `startTapStop`, slot math, and cooldown selection. Extraction requires inventing the errand-type abstraction first.
- **`collectPurse` levy pass** (1173-1212) — reads `today.biz[b].take`, `BIZ[b].rent`, `bizAcct`, `bizUnlocked`, with a documented multi-shop-player edge (all player shops share `coins`, so the floor is the LAST shop's rent). Deep, asymmetric economy knowledge.
- **`rentCut` call site** (15560) — surgically placed *inside* the settlement's house-rent branch with the payment mid-flight; the only correct interception point. Moving culture out of game.js means game.js must grow an explicit "rent is being paid" hook.
- **Policy-dial consumers** — `minWage`/`capFull`/`CREW_MAX_MAYOR` reads are scattered across payroll, job board, poaching, upgrades, and two UI steppers (358, 2933, 4262, 4555, 7113, 10301, 10564, 10625ff). Each is one line, but finding them all is exactly the `declarePoll` field-copy hazard documented at 1758-1764 (a dial that wins an election and never takes effect).
- **Rendering** — drawHall/drawElection/drawPollingPlaces/shelter notice are ~500 lines of pixel-budgeted canvas code interleaved with the world draw, with collision sweeps in the suite asserting they don't overprint furniture. Layout constants (`dormNoticeY` growing upward, POLL_BW 40) encode measured negotiations with neighbors.
- **Save loader** (6473-6580) — 100 lines of hand-written clamping mirroring every culture field, including the cross-field paper≤printed−cast invariant. Data-defined cultureways make this schema-driven or it becomes the attack surface.
- **`worldMoney`** (1004-1017) — the audit must enumerate every wallet class in the game including culture-created ones; a new cultureway that mints an account silently breaks the proof.
- **Emergent couplings with no code edge** — turnout↔shop-hours, bowls-eaten↔next-vote (`p.bowls` persona field), fish price↔bowlCost↔platform affordability. These are the game's best content and exist only because the culture shares the sim's state space; a sandboxed culture VM that can't read shift schedules or write persona fields would lose them.
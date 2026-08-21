# PATCH-SITE DOSSIER — minimum viable pig, ~/crab-shack-3.5 @ e53df9d

All refs game.js unless noted. **Line-ref delta warning**: `design/cs35-research/pigSeam.md` was written against crab-shack-3; every ref below is re-verified against THIS clone and differs (e.g. newVisitor is 9153 here, not 9252). `repFrac`/`REP_FLUSH`/`REP_PURSE` **do not exist at e53df9d** — the purse mint has no rep multiplier in this clone.

## 1. Identity mint

**newVisitor** 9153–9191 (fn `newVisitor(overnightOnly)`); identity roll 9172–9174; purse 9165–9167; leaveT 9168–9169.
```js
9170	  return {
9171	    visitor: true, gone: false,
9172	    name: freeVisitorName(),
9173	    color: (Math.random() * CRAB_COLORS.length) | 0,
9174	    acc: ACC_KEYS[(Math.random() * ACC_KEYS.length) | 0],
9175	    animT: Math.random() * 9,
9176	    // they come off the boat ON THE PLANKS, at rail height, and walk down
9177	    x: FERRY.gangway, y: FERRY.deckY, wy: FERRY.deckY, leg: 0,
9178	    state: "ashore",
```
Purse (no rep term): `let wallet = 32 + Math.random() * 44 + nights * (ROOM_RATE + 24);` 9165; flush `<0.30 → +24+rnd*30` 9166; light `<0.12 → *0.6` 9167. Nights 9154–9155 (`VIS_DAYTRIP` 0.60 @ 9112).

**newCustomer** 9775–9787 (fn `newCustomer(bizKey)`) — the anonymous walk-in rolls the same identity:
```js
9779	  return { biz: bizKey, recipe: r,
9780	    name: CUSTOMER_NAMES[(Math.random() * CUSTOMER_NAMES.length) | 0],
9781	    color: (Math.random() * CRAB_COLORS.length) | 0,
9782	    acc: ACC_KEYS[(Math.random() * ACC_KEYS.length) | 0],
9783	    animT: Math.random() * 9,
9784	    x: spawnX, spawnX, state: "arriving", patience: 50, maxPatience: 50,
9785	    qSeq: ++qSeqN,   // a walk-in joins the line the moment it is built
9786	    claimed: false, served: false, server: null };
```

## 2. Render sites (visitor drawn as crab) — FOUR real + one extra

**(i) drawCustomer** 11851–11899 (fn `drawCustomer(k)`) — body 11855/11861/11867, accessory 11868–11872, flip 11864, name label 11877–11883:
```js
11855	      const arts = CRAB_ARTS[k.color];
11856	      if (k.state === "showering") return;   // behind the curtain (stall draws the bather)
11857	      if (k.state === "inRoom") return;      // upstairs with the lamp on (the door draws them)
...
11861	      const art = moving && ((k.animT * 8) | 0) % 2 ? arts.b : arts.a;
11864	      const flip = k.visitor ? (k.face == null ? true : k.face < 0) : k.state !== "leaving";
11865	      const base = custY(k);
11866	      const cy = base - 12 - 26 * (k.climb || 0);
11867	      wblit(art, k.x, cy, flip);
11868	      const acc = ACCESSORIES[k.acc];
11869	      if (acc) {
11870	        const ax = flip ? 16 - acc.dx - acc.art.w : acc.dx;
11871	        wblit(acc.art, k.x + ax, cy + acc.dy, flip);
11872	      }
```
**(ii) dossier 2x portrait** — `drawVisDossier(k)` 12978–13021, portrait 12983–12986; cache `art2` 12793–12796 (`_art2Cache` keyed by string — **"c"+color / "a"+acc keys collide across species**; walk-in dossier repeats the idiom at 13029–13031, crab dossier at 13070–13072):
```js
12983	  rect(ctx, x + 4, y + 4, 40, 30, [245, 225, 200]);
12984	  blit(ctx, art2("c" + k.color, CRAB_ARTS[k.color].a), x + 8, y + 8);
12985	  const acc = ACCESSORIES[k.acc];
12986	  if (acc) blit(ctx, art2("a" + k.acc, acc.art), x + 8 + acc.dx * 2, y + 8 + acc.dy * 2);
12793	const _art2Cache = {};
12794	function art2(key, art) {   // lazily scaled 2x art for the dossier portrait
12795	  return _art2Cache[key] || (_art2Cache[key] = scale2(art));
12796	}
```
**(iii) follow-card portrait** — `drawCustCard(k)` 12008–12042, portrait 12012–12015:
```js
12012	  rect(ctx, 5, 6, 20, 26, [245, 225, 200]);
12013	  blit(ctx, CRAB_ARTS[k.color].a, 7, 14);
12014	  const acc = ACCESSORIES[k.acc];
12015	  if (acc) blit(ctx, acc.art, 7 + acc.dx, 14 + acc.dy);
```
**(iv) bus-rider stripe** — `drawBus()` 11749–11758, stripe 11752–11757: `const riders = crabs.filter(c => c.cstate === "onBus");` … `wrect(wx2 + 1, by + 4, 4, 1, CRAB_COLORS[riders[i].p.color][0]);`. **Visitors never ride**: `onBus` is set only in crab commute code (6941) and riders filters `crabs`, not `customers`. No patch needed unless pigs get commutes.
**(v) EXTRA site pigSeam missed** — shower-stall bather (feet + bobbing head), inline in `frame(now)`'s per-biz paint pass, 15806–15826. Draws the showering occupant from palette only, using the customer's `.color`:
```js
15809	      if (bathing) {   // feet peeking under the curtain
15810	        const oc = t.occupant, pcol = oc.isCrab ? oc.crab.p.color : (oc.p ? oc.p.color : oc.color);
15811	        const col = CRAB_COLORS[(pcol || 0) % CRAB_COLORS.length][0];
15812	        wrect(t.x + 5, t.y - 3, 2, 2, col);
15813	        wrect(t.x + 9, t.y - 3, 2, 2, col);
15814	      }
15815	      if (bathing) {   // the bather's head bobs over the curtain
15816	        const oc = t.occupant, pcol = oc.isCrab ? oc.crab.p.color : (oc.p ? oc.p.color : oc.color);
15817	        const pal = CRAB_COLORS[(pcol || 0) % CRAB_COLORS.length];
...
15820	        wrect(t.x + 5, hy, 6, 3, pal[0]);                    // wet shell dome
15822	        wrect(t.x + 6, hy - 3, 1, 2, pal[1] || pal[0]);      // eyestalks
```
"Wet shell dome" + "eyestalks" are crab-shaped rects — a pig behind the curtain needs a species branch here (or a per-species head/feet micro-draw).

## 3. drawCrab hard-coded anchors (crew renderer — the geometry contract a pig body must either match or re-implement)

`drawCrab(c)` 11768–11846. Anchors verbatim:
```js
11793	  let y = c.y - 12 + bob;                                    // body top = feet - 12 (sprite h)
11802	  const accKey = crabHat(c);
11803	  const acc = ACCESSORIES[accKey];
11804	  if (acc) {
11805	    const ax = c.flip ? 16 - acc.dx - acc.art.w : acc.dx;    // flip formula: 16 = body width
11806	    wblit(acc.art, c.x + ax, y + acc.dy, c.flip);
11807	  }
11808	  if ((c.p.dirt || 0) >= 0.66) wblit(DIRT, c.x, y, c.flip);
...
11812	    wblit(STINK_MARK[((time * 3.1) | 0) % 2], c.x + 12, y - 7);
11820	  if (c.p.sick && ((c.animT * 2) | 0) % 2) wblit(SICK_MARK, c.x + 10, y - 8);
11826	    wblit(OT_MARK[((time * 2.2) | 0) % 2], c.x + 5, y - 18 - bobb);
11828	  if (c.p.job === "fishing" && c.dayState === "working") wblit(ROD[((c.animT * 2) | 0) % 2], c.x + 12, y - 3, c.flip);
11829	  if (c.carrying) wblit(ITEMS[c.carrying], c.x + 4, y - 7);
11830	  if ((working || (napping && ...)) && c.workMax > 0.7) {
11832	    wrect(c.x, y - 10, 16, 3, [30, 20, 36]);                 // progress bar: 16 wide
11833	    wrect(c.x + 1, y - 9, Math.round(14 * frac), 1, [96, 232, 120]);  // 14 fill
```
Same 16/12 constants repeat in drawCustomer (`cy = base - 12` 11866, `ax = flip ? 16 - ...` 11870) and pose select 11786–11792 (`arts.a/.b/.w/.s`). A pig body of different w/h breaks flip + hat + bar unless art-set carries {w, anchorY} or matches 16x12.

## 4. Save round-trip

**Serialize** — inside `save()` 6130–6247, visitor block 6202–6229:
```js
6202	    visitors: customers.filter(k => k.visitor && !k.gone).map(k => ({
6203	      n: k.name, c: k.color, a: k.acc, x: Math.round(k.x), y: Math.round(k.wy),
6206	      s: VIS_SAVE_STATES[k.state] ? k.state : "roam",
6207	      w: Math.round(k.wallet), p: k.purse, sp: Math.round(k.spent),
6208	      ni: k.nights, nh: k.nightsHad, rn: k.roughNights, un: k.unhoused,
6209	      ar: k.arrived, lt: Math.round(k.leaveT), b: k.buys,
6210	      rm: k.room ? hotelRooms().indexOf(k.room) : -1,
6211	      hu: k.hunger, th: k.thirst, di: k.dirt, bo: k.bored, ti: k.tired,
6212	      log: k.log || [],
6219	      st: (() => { const s = stayOf(k); return { ... } })(),
6229	    })),
6230	    ferry: { t: Math.round(ferryT), sail: ferrySail, d: ferryDay },
6231	    _vis: 1,
```
**Restore clamps** — inside `load(slot)` 6250–6626, visitor loop 6563–6610; the two species-blocking lines:
```js
6564	  if (Array.isArray(s.visitors)) for (const v of s.visitors) {
6565	    if (!v || typeof v.n !== "string") continue;
6566	    const k = newVisitor(false);
6567	    k.name = String(v.n).toUpperCase().slice(0, 14);
6568	    k.color = Math.max(0, Math.min(CRAB_COLORS.length - 1, +v.c || 0));
6569	    if (ACC_KEYS.includes(v.a)) k.acc = v.a;
6570	    k.x = Math.max(0, Math.min(WORLD_W, +v.x || 0));
6572	    k.state = VIS_SAVE_STATES[v.s] ? v.s : "roam";
```
Ledger clamp 6582–6597 (`num`/`nm` helpers, sandWhy whitelist 6596); needs clamp 6598–6599; log sanitize 6600–6602; room re-link by index 6603–6606.

## 5. convertTourist + makeCrabPersona

`convertTourist(k)` 7092–7112 — a hired pig silently becomes a crab here:
```js
7099	  const p2 = makeCrabPersona(2 + ((Math.random() * 10) | 0));   // fresh trait/mode roll; identity comes from the tourist
7100	  p2.name = freeCrewName(k.name);
7101	  p2.color = k.color; p2.acc = k.acc;
7102	  p2.shift = hireShift(); p2.homeless = true; p2.house = null;
7103	  const c = newCrab(p2);
7109	  c.quip = { text: "I LIVE HERE NOW!", t: 3 };
7110	  crabLog(c, "life", "TRADED A HOLIDAY FOR AN APRON - HIRED", 0);
```
`makeCrabPersona(i, rng)` crabs.js:76–91 (crab TRAITS crabs.js:8–57, MODES 59–64). Hire preference order `hireCrew()` 7122–7132. Name fallback `freeCrewName` 7076–7080: `return CRAB_NAMES.concat(CUSTOMER_NAMES).find(n => !used.has(n)) || preferred || "CRAB";` (7079).

## 6. Names

`freeVisitorName()` 9131–9137 (dedupe = infra; pool = culture):
```js
9131	function freeVisitorName() {
9132	  const used = new Set(allCrabs().map(c => c.p.name));
9133	  for (const k of customers) if (k.visitor) used.add(k.name);
9134	  const free = CUSTOMER_NAMES.filter(n => !used.has(n));
9135	  if (!free.length) return CUSTOMER_NAMES[(Math.random() * CUSTOMER_NAMES.length) | 0];
9136	  return free[(Math.random() * free.length) | 0];
9137	}
```
`CUSTOMER_NAMES` crabs.js:100–105, 26 entries: GARY, SHELLY, EBB, FLO, BARNABY, PEARL, SANDRO, MISTY, CLACKERS, NIPPY, BRINY, KRILL BILL, ANEMONE, WAVY DAVE, MOLT, SCAMPI, ROE, MAUDE, SNAPPY, BUOY, SALTINE, DIP, TIDEPOOL TIM, SURF MOM, PLANKTON PETE, BIG PALP. Name length cap on restore: 14 (6567); follow-card first-word slice(0,4|8) 11880.

## 7. visPick selection closures + scorer (taste-weight seam)

`visPick(k)` 9516–9592. Closures 9541–9551, need→shop map 9552–9558, room 9567–9568:
```js
9541	  const cheap = (rs) => rs.slice().sort((a, b) => a.pay - b.pay)[0];
9550	  const treat = (rs) => rs[(Math.random() * rs.length) | 0];
9551	  const plate = (rs) => { const f = rs.filter(r => !DRINKS[r.id]); return treat(f.length ? f : rs); };
9552	  if (k.hunger >= VIS_WANT.food) add("shack", "food", plate);
9553	  if (k.thirst >= VIS_WANT.drink) {
9554	    if (visOpen("juicebar")) add("juicebar", "drink", treat);
9555	    else add("shack", "drink", (rs) => cheap(rs.filter(r => DRINKS[r.id]).length ? rs.filter(r => DRINKS[r.id]) : rs));
9556	  }
9557	  if (k.dirt >= VIS_WANT.clean) add("showers", "clean", treat);
9558	  if (k.bored >= VIS_WANT.fun) add("arcade", "fun", treat);
```
Scorer line — where a per-culture taste weight would multiply:
```js
9587	      s = (VIS_RANK[e.need] + visLevel(k, e.need)) * priceAppeal(e.biz) / (1 + d / DETOUR_SCALE);
```
Room branch 9573–9576 (`ROOM_HOUR` absolute → s=99). `treat` (uniform over affordable recipes) is where per-recipe food-taste weights bite: `treat`/`plate` become weighted picks. Knob tables: `VIS_RATE` 9080, `VIS_WANT` 9081, `VIS_RANK` ~9088, `DRINKS` ~4790s.

## 8. Departure: stayBlocked, DEPART_RULES, visQuote

`stayBlocked` def 14412: `function stayBlocked(k, why) { const s = stayOf(k); s[why] = (s[why] || 0) + 1; }`. **Call sites: exactly three**, all inside visPick's `add` closure: 9535 (`"shut"`), 9536 (`"full"`), 9538 (`"broke"`).
`DEPART_RULES` 14505–14624 — 20 rules (ids: rough, quits, quit, nothing, unspent, idle, hungry, parched, grubby, weary, bored, wait, dues, missed, mist, table, bed, spentup, top, regular, quiet). One complete rule verbatim (weight + line closure):
```js
14524	  { id: "quit", mood: "sour",
14525	    w: (r) => r.quits === 1 ? 82 : 0,
14526	    line: (r) => r.quitMin >= 1
14527	      ? "WAITED " + depMins(r.quitMin) + " AT THE " + r.quitBiz + ", THEN LEFT."
14528	      : "GAVE UP AT THE " + r.quitBiz + ". NOBODY WAS COMING." },
```
`visQuote(r)` 14628–14635 (heaviest rule wins, ties → earlier rule):
```js
14628	function visQuote(r) {
14629	  let best = DEPART_RULES[DEPART_RULES.length - 1], bw = 0;
14630	  for (const rule of DEPART_RULES) {
14631	    const w = rule.w(r) || 0;
14632	    if (w > bw) { bw = w; best = rule; }
14633	  }
14634	  return { id: best.id, mood: best.mood, weight: bw, line: best.line(r) };
14635	}
```
Supporting: `DEP_MOODS` 14449–14455 (sour/flat/mixed/glad/made→"DELIGHTED"), `newStay()` 14334–14362, `stayOf` 14367, hooks stayQueued/Wait/Bought/Quit 14370–14408, `departRecord(k)` 14417–14443 (row includes `color: k.color, acc: k.acc` 14428 — stored but `drawDepart` 14674 never blits sprite art). Proper noun "DRIFTWOOD" hard-coded in rules 14610–14611. 3x5 font has `'` not `"` — pig quotes must use apostrophes only, ALL CAPS.

## 9. Visitor diary voice-table (every visLog in the pipeline)

| line | fn | cat | literal |
|---|---|---|---|
| 8908–8909 | visBenefit | need | `"BOUGHT " + (ITEM_NAMES[r.icon] || "SOMETHING") + " AT THE " + BIZ[k.biz].short + " - $" + menuPrice(k.biz, r)` |
| 9221 | seedVisitors | life | `"CAME OVER ON AN EARLIER FERRY"` |
| 9240 | ferryDock | life | `"CAME ASHORE OFF THE FERRY"` |
| 9248 | ferryDock | money | `"PAID $" + Math.round(due) + " HARBOUR DUE"` |
| 9307 | visLeave | life | `"HEADING BACK TO THE FERRY"` |
| 9326 | ferryGo | life | `"MISSED THE LAST BOAT - STAYING OVER"` |
| 9426 | checkIn | home | `"CHECKED IN - ROOM " + k.roomN + " AT THE DRIFTWOOD"` |
| 9435 | checkOut | home | `"CHECKED OUT - SLEPT WELL"` |
| 9465 | sleepOnSand | peril | `"NO ROOM AT THE HOTEL - SLEPT ON THE BEACH"` |
| 9631 | visTick | peril | `"WOKE UP ON THE SAND - NOT A GREAT NIGHT"` |
| 9659 | updateVisitor (toRoom arm) | peril→home | `"TURNED IN FOR THE NIGHT"` (cat "home") |
| 9732 | visAfterCounter | peril | `"GAVE UP WAITING AT THE " + (BIZ[k.biz] ? BIZ[k.biz].short : "COUNTER")` |

Adjacent voice, not visLog: empty-diary fallback `"JUST OFF THE BOAT."` 13011 (drawVisDossier); walk-in dossier quips 13034 `["'WHAT A CUTE LITTLE TOWN'", "'SMELLS LIKE GOOD TACOS'", "'THE GULLS FOLLOWED ME HERE'", "'I'M NEVER GOING HOME'"]` (picked by `(k.name.length + k.color) % 4` 13035). `visLog` infra 9119–9126 (`VIS_LOG_MAX` 24, dedupe on identical last line).

## 10. ferryDock batch loop + rep gates

`ferryDock(n, idx)` 9225–9264; **the species decision point is line 9236** (per-culture manifest mix would replace/augment `newVisitor(last)`):
```js
9232	  const count = n != null ? n
9233	    : Math.max(1, Math.round(ferryBatch() * (FERRY_LOAD[i0] != null ? FERRY_LOAD[i0] : 1)));
9234	  const landed = [];
9235	  for (let i = 0; i < count; i++) {
9236	    const v = newVisitor(last);
9237	    v.x = FERRY.gangway - 4 - i * 7;   // down the plank and along the deck, in a line
9238	    v.thinkT = i * 3 + Math.random() * 8;   // ...and they do not all want lunch at 9:01
9239	    customers.push(v);
9240	    visLog(v, "life", "CAME ASHORE OFF THE FERRY");
```
Rep gates: `const FERRY_BASE = 2.0, FERRY_REP = 0.013, FERRY_MAX = 6;` 9031; `FERRY_LOAD = [1.2, 1.1, 0.9, 0.8]` 9036; `ferryBatch()` 9049–9052 (`FERRY_BASE + rep * FERRY_REP + (Math.random()-0.5)`, clamped 1..6). **No repFrac/REP_PURSE/REP_FLUSH at this commit.** Geometry `const FERRY = {` 9009; `FERRY_TIMES` 9024; `FERRY_STAY` 9025; `FERRY_CALL` 9026. Toast at 9258–9259. Extension hook `ferryNotify` 9045–9047 (`window.onFerry`). Legacy seeding `seedVisitors()` 9207–9223 also mints identities (would need the same species roll).

## 11. sprites.js raw material

**Dead second-body template** (verbatim, sprites.js:98–128 — 12x19 humanoid, palette-swap styles; `TOURIST_ARTS` built at game.js:5045 and referenced nowhere else — grep-confirmed dead):
```js
100	const _TOURIST = [
101	  "...KKKKKK...",
102	  "..KHHHHHHK..",
103	  ".KHHHHHHHHK.",
104	  ".KHSSSSSSHK.",
105	  ".KSBSSSBSSK.",
106	  ".KSSSSSSSSK.",
107	  ".KSSPSSSSSK.",
108	  "..KSSSSSSK..",
109	  "...KKKKKK...",
110	  "..KTTTTTTK..",
111	  ".KTSTTTTSTK.",
112	  ".KTKTTTTKTK.",
113	  ".KSKTTTTKSK.",
114	  "...KTTTTK...",
115	  "...KNNNNK...",
116	  "...KNKKNK...",
117	  "...KSKKSK...",
118	  "...KSKKSK...",
119	  "..KKKKKKKK..",
120	];
121	const TOURIST_STYLES = [
122	  { H: [90, 60, 40], T: [96, 200, 255] },
123	  { H: [250, 220, 100], T: [255, 130, 190] },
124	  { H: [40, 40, 50], T: [90, 200, 110] },
125	  { H: [220, 120, 60], T: [255, 230, 120] },
126	  { H: [120, 80, 160], T: [255, 150, 60] },
127	];
128	function touristArt(style) { return parseArt(_TOURIST, swap(PAL, style)); }
```
**ACCESSORIES entry shape** (sprites.js:335–384; `none: null` 383; showercap appended 813):
```js
336	  toque: { dx: 4, dy: -4, art: parseArt([
337	    ".KLLLLK.",
338	    "KLLLLLLK",
339	    "KLLLLLLK",
340	    "KKKKKKKK",
341	  ], PAL) },
342	  cap: { dx: 3, dy: -3, art: parseArt([
343	    ".KRRRRK...",
344	    "KRRRRRRK..",
345	    "KKKKKKKKKK",
346	  ], swap(PAL, { R: [96, 150, 255] })) },
```
dx/dy are fitted to the 16-wide crab head; a pig body needs its own accessory offsets (or per-species dx/dy).
**CRAB_COLORS** verbatim (sprites.js:89–96 + push 811):
```js
89	const CRAB_COLORS = [
90	  [[230, 72, 88], [170, 42, 62]],    // red
91	  [[96, 150, 255], [60, 95, 190]],   // blue
92	  [[90, 200, 110], [50, 140, 80]],   // green
93	  [[200, 120, 255], [140, 70, 190]], // purple
94	  [[255, 150, 60], [190, 100, 30]],  // orange
95	  [[255, 130, 190], [190, 80, 140]], // pink
96	];
811	CRAB_COLORS.push([[88, 205, 188], [44, 145, 130]]);   // SUDSY teal
```
**Do NOT extend CRAB_COLORS for pigs**: game.js:5044–5049 mints `CRAB_ARTS`/`HOUSES`/`BOATS`/`BUGGIES` from it and SUDSY is pinned to `CRAB_COLORS.length - 1` (game.js:5071) — appending shifts her color and mints pig-colored houses. Pigs need their own color table + art array.
**ITEMS defItem** (sprites.js:131–132, one entry verbatim 160–168):
```js
131	const ITEMS = {};
132	function defItem(name, rows) { ITEMS[name] = parseArt(rows, PAL); }
160	defItem("taco", [
161	  ".........",
162	  "..KGKPK..",
163	  ".KGPKGPK.",
164	  "KQQGQPQK.",
165	  "KQQQQQQK.",
166	  ".KQQQQK..",
167	  "..KKKK...",
168	]);
```
**Template+slots idiom** — `_CRAB_TOP` sprites.js:38–48 + `crabArt` 80–88 (shared top rows concat per-pose legs; R/T palette-swapped; poses a/b/w/s):
```js
38	const _CRAB_TOP = [
39	  "..KK........KK..",
40	  ".KWBK......KBWK.",
41	  ".KWWK......KWWK.",
42	  "..KK........KK..",
43	  "..KRRRRRRRRRRK..",
44	  ".KRTRRRRRRRRTRK.",
45	  "KRRRRKRRRRKRRRRK",
46	  "KRRRRRRRRRRRRRRK",
47	  ".KRRTRRRRRRTRRK.",
48	];
80	function crabArt(bodyCol, shadeCol) {
81	  const p = swap(PAL, { R: bodyCol, T: shadeCol });
82	  return {
83	    a: parseArt(_CRAB_TOP.concat(_CRAB_LEGS_A), p),
84	    b: parseArt(_CRAB_TOP.concat(_CRAB_LEGS_B), p),
85	    w: parseArt(_CRAB_TOP.concat(_CRAB_LEGS_W), p),
86	    s: parseArt(_CRAB_SLEEP, p),
87	  };
88	}
```
Legs A/B/W 49–64, sleep 66–79. A pig art-set must supply the same {a,b,s} keys minimum (drawCustomer uses a/b; onSand uses a + Z overlay; w only used by drawCrab for workers).

## 12. saveProblem + load entry + where a cultures key lands

`saveProblem(s)` 6023–6032 (the ONLY envelope validator; `readSlotEnv` 6086–6090 gates every read through it; import path also uses it 6125):
```js
6023	function saveProblem(s) {
6024	  if (!s || typeof s !== "object" || Array.isArray(s)) return "NOT A SAVE FILE";
6025	  if (s._ver != null && (typeof s._ver !== "number" || s._ver > SAVE_VER)) return "FROM A NEWER CRAB SHACK";
6026	  if (!Array.isArray(s.personas) || !s.personas.length) return "NO CREW - NOT A CRAB SHACK 3 SAVE";
6027	  for (const p of s.personas)
6028	    if (!p || typeof p !== "object" || typeof p.name !== "string") return "THE CREW RECORD IS DAMAGED";
6029	  if (s.day != null && (typeof s.day !== "number" || !isFinite(s.day) || s.day < 1)) return "BAD DAY COUNTER";
6030	  if (s.coins != null && (typeof s.coins !== "number" || !isFinite(s.coins))) return "BAD TILL";
6031	  return null;
6032	}
```
**Envelope write** — `save()` builds `const env = { ... }` 6133–6243; a `cultures` key is a new top-level env field; sealed at:
```js
6244	  env._ver = SAVE_VER;
6245	  env._meta = slotMeta(env);   // written at save time; re-derivable if it ever goes missing
6246	  writeSlotEnv(activeSlot, env);
```
**Load entry for visitors** — `load(slot)` 6250; visitor restore 6563–6610 (see §4); cultures would be read before 6564 so the color/acc clamps can become species-aware. Legacy guard `preVisSave = !s._vis` 6555; ferry state restore 6611–6615. `_vis: 1` marker 6231. Note `slotMeta` 6039–6084 clamps persona color `% CRAB_COLORS.length` (6043) — a converted pig persona in the preview card path.

## 13. Test harness patterns

**Registration** — tools/suite.mjs:8–9 + runner 10278–10291:
```js
8	const results = [];
9	function scenario(name, fn) { results.push({ name, fn }); }
10278	// ---- runner
10279	const filters = process.argv.slice(2);
10280	const list = filters.length ? results.filter(r => filters.some(f => r.name.includes(f))) : results;
...
10284	  try { out = fn(); } catch (e) { out = "EXCEPTION: " + ... }
10286	  if (out === true) { pass++; ... } else { fail++; ... }
10291	process.exit(fail ? 1 : 0);
```
Contract: return `true` to pass, a string to fail. **Short scenario verbatim** (suite.mjs:281–289):
```js
scenario("mid-shift job toggle is safe", () => {
  const sim = createSim({ seed: 21 });
  sim.G('coins = 2000; tryBuy("arcade");');
  sim.runUntil('crabs[0].dayState === "working"', {});
  sim.G('crabs[0].p.job = "arcade";');   // toggle while cooking
  sim.runDays(2);
  return sim.G("gameOver") === false || sim.G("day") > 1 ? true : "sim broke after mid-shift toggle";
});
```
**RNG seeding** — tools/simlib.mjs: `mulberry32(a)` 11–18; seeded into the vm at 32–33 + 44 (`const seededMath = Object.create(Math); seededMath.random = mulberry32(seed);` … `Math: seededMath`); real game files loaded 55–57 (`["font.js","ppu.js","sprites.js","crabs.js","game.js"]` via `vm.runInContext`); `G(expr)` 58; `runUntil` 65–74; `runDays` 75–83 — **ABSOLUTE** (`while (G("day") <= days ...)`). Suite already has a tophat-shape precedent for accessory-pool assertions at suite.mjs:6862–6876 (asserts tophat is NOT in ACC_KEYS — pig accessories must respect the same "office hat never random" rule).

## Direct answers

**(a) Every CRAB_COLORS / ACC_KEYS index site (exhaustive grep across game.js, sprites.js, crabs.js, merge.js, tools/, index.html):**
- Definitions: sprites.js:89 (CRAB_COLORS), sprites.js:811 (push teal), crabs.js:66 (ACC_KEYS).
- Derived art tables: game.js:5044 CRAB_ARTS, 5047 HOUSES, 5048 BOATS, 5049 BUGGIES (all `CRAB_COLORS.map`).
- Crab-side: crabs.js:85–86 (makeCrabPersona acc/color roll), game.js:5071 (SUDSY pinned to `CRAB_COLORS.length - 1`), 6043 (slotMeta persona color clamp), 11757 (bus stripe, crabs only), 12352 (minimap crew dots, crabs only), 14002 (census shell portrait, crabs only).
- **Visitor-relevant**: 9173–9174 (newVisitor), 9781–9782 (newCustomer), 6568–6569 (load clamps), 15811 + 15817 (shower-stall bather — mixed crab/customer via `oc.color`). Plus indirect via CRAB_ARTS[k.color]/ACCESSORIES[k.acc]: 11855+11868 (drawCustomer), 12013–12015 (drawCustCard), 12984–12986 (drawVisDossier), 13029–13031 (drawCustDossier), and 7101 (convertTourist carries color/acc into a crab persona).
- tools/suite.mjs:6862–6876 (ACC_KEYS tophat-exclusion scenario — will need a per-species pool assertion).
That is the complete list; nothing in merge.js, index.html, font.js, ppu.js.

**(b) Exact per-visitor save record keys** (game.js:6202–6229): top-level `n, c, a, x, y, s, w, p, sp, ni, nh, rn, un, ar, lt, b, rm, hu, th, di, bo, ti, log, st`; `st` sub-keys: `wm, xm, xb, qm, qb, q, sv, tb, me, dr, wa, ga, ro, ti, tz, tp, tp2, du, sh, fu, br, mi, ms, sw`. (Sibling envelope fields: `ferry: {t, sail, d}`, `_vis: 1`.) A species field (e.g. `cu`) is absent; `c` is a CRAB_COLORS index, `a` an ACC_KEYS string.

**(c) Species-ish strings shown for a visitor/walk-in:**
- Follow card: `"VISITOR - " + visStayLabel(k)` 12026; walk-in variant `"TOURIST - IN TOWN FOR THE DAY"` 12034; walk-in mood word `"VISITING"` 12021.
- Dossier: `"VISITOR - " + visStayLabel(k)` 12989; walk-in dossier `"VISITING TOURIST"` 13033 and `"WORD OF MOUTH: TOURISTS WHO LEAVE HAPPY" / "TELL THEIR FRIENDS. ANGRY ONES TELL MORE."` 13052–13053.
- Toast: `"THE FERRY IS IN - N VISITOR(S) ASHORE"` 9258–9259.
- Peripheral (help/report screens, not the cards): `"EVERY VISITOR THE FERRY LANDS"` 688, `"GUESTS SERVED"` 14212, `"GUESTS WHO GET A SEAT..."` 4811–4812, `"VISITORS", "OFF THE FERRY WITH REAL MONEY TO SPEND"` 14865, `"...GUESTS WHO GET A TABLE ALSO LEAVE A TIP."` 14806–14809.
- The word CRAB is never printed for a visitor; it reaches an ex-visitor only via the freeCrewName fallback literal `"CRAB"` 7079 post-conversion. `custStatus` 11958–11976, `visStayLabel` 11978–11982, `visCondition` 11983–11993, `visBars`/`VIS_BAR` 11996–12007 are all species-neutral (THEY/THEIR); "VISITOR"/"TOURIST" labels above are the only species words, and none is a body-species claim — a pig can wear "VISITOR" unchanged, but "TOURIST" on the walk-in card/dossier is the label a pig walk-in would also inherit.

Key files: /Users/matthewbaker/crab-shack-3.5/game.js, /Users/matthewbaker/crab-shack-3.5/sprites.js, /Users/matthewbaker/crab-shack-3.5/crabs.js, /Users/matthewbaker/crab-shack-3.5/tools/suite.mjs, /Users/matthewbaker/crab-shack-3.5/tools/simlib.mjs, /Users/matthewbaker/crab-shack-3.5/design/cs35-research/pigSeam.md.
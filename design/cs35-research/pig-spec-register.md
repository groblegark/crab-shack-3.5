All source reads done (crabs.js, pigSeam.md §6-7, DEPART_RULES at game.js:14505-14626 — note: shifted from the doc's 14746 anchor, doctrine block ~14448-14505, BIZ recipes game.js:142-303, ITEM_NAMES/DRINKS 4761-4769, CRAB_COLORS sprites.js:89-96 + push at 811, charter rulings + foodways precedents in design/cs35-cultureway-research.md). Register draft follows.

# PIGPUBLIC REGISTER — draft content for `cultures.pig` (owner-reaction draft)

## 1. NAME POOL (26)

```js
// cultures.pig.names — visitor pool, same contract as CUSTOMER_NAMES (crabs.js:100)
// mix matches crab pool: pure puns / compound joke names / plain mainland words
[
  "HAMLET", "SPAMELA", "BOARIS", "HOGARTH", "SOWPHIE", "HAMISH",
  "PIGBY", "SWINSTON", "HAM SOLO", "PIGGY SUE", "BIG HOCK", "FARROW MAE",
  "TROTTER", "RASHER", "GAMMON", "CRACKLIN", "RIND", "SNOUT",
  "BRISTLE", "WALLOW", "ACORN", "CLOVER", "TURNIP", "MAIZE",
  "LOAM", "PETUNIA",
]
```

Rationale: 8 pure puns (HAMLET/SPAMELA/BOARIS/HOGARTH/SOWPHIE/HAMISH/PIGBY/SWINSTON), 4 compound joke names (HAM SOLO mirrors KRILL BILL's movie-pun shape; BIG HOCK mirrors BIG PALP; FARROW MAE, PIGGY SUE), 14 plain words — pig anatomy/pork words (TROTTER, RASHER, GAMMON, CRACKLIN, RIND, SNOUT, BRISTLE, WALLOW) + mainland-farm words (ACORN, CLOVER, TURNIP, MAIZE, LOAM) mirror the crab pool's sea-word plainness (MOLT, ROE, BRINY). All ≤10 chars (longest FARROW MAE=10, under the 12-char card slice at game.js:14723). No collisions with CRAB_NAMES or CUSTOMER_NAMES, so `freeVisitorName` dedupe holds unchanged. Alternates if any read wrong: BAO (3, ties to phase-2 icon), WILBUR, TAMWORTH (dropped to keep colorway namespace clean), BARLEY, CHOPS.

## 2. THE REGISTER — two voice options

Both obey the doctrine block (game.js ~14448): every line states what happened, mood belongs to the rule that spoke, single-quote glyph only (3x5 font has `'`, no `"`), diary ≤~38 chars, depart ≤~50. Slots use departRecord/visLog fields: `{N}`=room, `{ITEM}`=ITEM_NAMES[icon], `{BIZ}`=BIZ short, `{LEFT}`/`{PURSE}`=r.left/r.purse, `{MINS}`=depMins(r.worstMin), `{STOPS}`=r.buys, `{DAYS}`=r.days.

### OPTION A — "THE VISITING ALDERMAN" (civic-proud, courtly-formal)
A citizen of a republic on official holiday: files everything, praises correctly, complains for the record. Comedy = bureaucratic dignity applied to a beach.

```js
diary: {
  ashore:   "DISEMBARKED IN GOOD ORDER",
  checkin:  "REGISTERED - ROOM {N} AT THE DRIFTWOOD",
  bought:   "PAID FOR MY {ITEM} AT THE {BIZ}",
  gaveup:   "WITHDREW MY CUSTOM FROM THE {BIZ}",
  rough:    "PASSED THE NIGHT UNHOUSED. NOTED.",
  turnin:   "RETIRED AT A RESPECTABLE HOUR",
},
depart: {
  rough:    "THE PIGPUBLIC WILL HEAR OF THE SAND I SLEPT ON.",
  bed:      "THE DRIFTWOOD KEEPS A BED FIT FOR A CONSUL.",
  shut:     "EVERY DOOR SHUT. I SHALL SAY SO IN MY REPORT.",
  unspent:  "${LEFT} OF MY ${PURSE} RETURNS UNSPENT TO THE MAINLAND.",
  spentup:  "SPENT EVERY DOLLAR OF MY ${PURSE}. QUITE CORRECT.",
  wait:     "SERVED AFTER {MINS}. I STOOD ON PRINCIPLE.",
  delight:  "{STOPS} STOPS IN {DAYS} DAYS. THE PIGPUBLIC APPROVES.",
  grump:    "A SEA VIEW AND LITTLE ELSE. SO NOTED.",
},
dossier: [
  "HERE IN A STRICTLY PRIVATE CAPACITY",
  "I VOTED FOR THE FERRY SUBSIDY",
  "MY PAPERS ARE ENTIRELY IN ORDER",
]
```

### OPTION B — "THE FARMHAND ON HOLIDAY" (hearty-rustic-direct)
Appetite-led, blunt, warm, measures everything against farm life. Comedy = plain-spoken comparison (haylofts, harvests, mud).

```js
diary: {
  ashore:   "OFF THE BOAT AND HUNGRY ALREADY",
  checkin:  "ROOM {N} AT THE DRIFTWOOD. THAT'LL DO.",
  bought:   "GOT A {ITEM}. MONEY WELL SPENT.",
  gaveup:   "GAVE UP ON THE {BIZ}. LIFE'S SHORT.",
  rough:    "SLEPT ROUGH. DONE WORSE AT HARVEST.",
  turnin:   "FULL DAY. STRAIGHT TO THE HAY.",
},
depart: {
  rough:    "A BEACH IS NO BED. EVEN OUR MUD IS WARMER.",
  bed:      "THAT DRIFTWOOD BED BEAT MY OWN HAYLOFT.",
  shut:     "ALL THAT WAY FOR SHUT DOORS AND SEA AIR.",
  unspent:  "TAKING ${LEFT} HOME. NOTHING HERE TO SPEND IT ON.",
  spentup:  "SPENT THE LOT. THAT'S WHAT MONEY'S FOR.",
  wait:     "WAITED {MINS} FOR A PLATE. ATE IT ANYWAY.",
  delight:  "ATE WELL, SLEPT WELL, PAID FAIR. GOOD TOWN.",
  grump:    "QUIET PLACE. GOOD FOR NAPS, LITTLE ELSE.",
},
dossier: [
  "CAME FOR THE FOOD, STAYING FOR THE FOOD",
  "FIRST TIME OFF THE MAINLAND",
  "THE SEA'S BIGGER THAN THEY SAID",
]
```

Register notes: rule mapping — rough→`rough`, bed→`bed`, shut→`nothing`(blocked=shut), unspent→`unspent`/`idle`, spentup→`spentup`, wait→`wait`/`quit`, delight→`regular`/`table`, grump→`quiet`. All lines verified ≤38 (diary, with 1-digit room + longest short biz) / ≤50 (depart, with 2-digit $ values); worst-case slot: `{ITEM}` = "A ROOM FOR THE NIGHT" (20 chars) overflows any bought-template — spec should either exclude room purchases from the `bought` diary event (they already log via `checkin`) or fitSmall-truncate. Both options keep the crab table's number-bearing habit (a quote that cites its own $ and counts survives the derived-never-random doctrine). Contrast check: A is institutional and third-person-proud ("THE PIGPUBLIC APPROVES"); B is bodily and first-person-comparative ("BEAT MY OWN HAYLOFT") — no line is swappable between them.

## 3. COLORWAYS (6, named after real pig breeds where the sign fits)

```js
// cultures.pig.colors — [body, shade] like CRAB_COLORS (sprites.js:89); all values
// multiples of 8 so 15-bit (5-bit/channel) quantization passes them through exactly
[
  { name: "PIGLET PINK",     c: [[248,176,168],[200,120,120]] },
  { name: "ROSE",            c: [[232,136,144],[176, 88,104]] },
  { name: "OXFORD SANDY",    c: [[224,184,136],[168,128, 88]] },
  { name: "TAMWORTH GINGER", c: [[208,136, 80],[152, 88, 48]] },
  { name: "MUD BROWN",       c: [[136, 96, 64],[ 88, 56, 40]] },
  { name: "OLD SPOT GREY",   c: [[184,184,192],[ 64, 64, 72]] },  // hard shade = reads as black spots
]
```

Crab set for contrast (sprites.js:89-96 + 811, 7 total): red [230,72,88]/[170,42,62], blue [96,150,255]/[60,95,190], green [90,200,110]/[50,140,80], purple [200,120,255]/[140,70,190], orange [255,150,60]/[190,100,30], pink [255,130,190]/[190,80,140], teal (SUDSY-only) [88,205,188]/[44,145,130]. Distinctness: crab pink is saturated magenta vs pig pinks desaturated warm flesh; crab orange is bright vs TAMWORTH dark/brown; no crab occupies tan/brown/grey at all — the pig ramp lives in the warm-neutral band crabs never use, so species reads at a glance even before the body silhouette does. OLD SPOT GREY deliberately has the widest body/shade gap in either table so the shade pixels render as spots, not shading.

## 4. TASTES (MVP static weights over real dish ids)

Real id list (BIZ recipes game.js:142-303): shack `taco`(17)/`juice`(10)/`fish`(13); arcade `clawgame`/`skeerun`/`gamenight`; juicebar `juice`(6)/`cooler`(9); hotel `room`; showers `rinse`/`soak`. Note `juice` is one id in two shops — one weight covers both.

```js
// cultures.pig.tastes — multiplier into visPick's scorer (the "taste hole",
// charter §4: uniform-random today; Victoria-3 precedent bounds x0.5..x2)
{
  taco:      0.6,  // fish-led; hearty handheld format saves it from the floor
  fish:      0.5,  // plain grilled fish - the taboo floor; pigs are not fish eaters
  juice:     1.6,  // orchard culture; fruit pressed is fruit understood
  cooler:    1.8,  // the big fruit drink - a pig's idea of a seaside treat
  clawgame:  1.0,  // a plush is a plush in any culture
  skeerun:   1.0,  // neutral; rolling things comes naturally
  gamenight: 1.1,  // pigs commit to a big evening; mild lean
  room:      1.7,  // adore a soft bed - also leans into the room price ramp
  rinse:     1.3,  // likes washing, but a quick rinse is the lesser form
  soak:      2.0,  // the deluxe hot soak is structurally a wallow - table ceiling
}
```

Foreign-demand departure line (`stayBlocked(k,"foreign")` / nothing-suited case — charter §4 item 4 proposes the mechanic and the canonical line):

```js
foreign: "NOT A PORK BUN IN TOWN. I ATE FISH, I SUPPOSE."   // canonical (charter's own); fits Option B
foreignA: "NOTHING ON ANY MENU A PIG WOULD RECOGNIZE."      // Option A variant
```

Design note: hunger→shack is hard-coded (visPick 9657-61), so in MVP the taco/fish weights bias the treat/plate pick *within* the shack rather than sending pigs elsewhere — pigs still eat, grudgingly, which is exactly what makes the foreign line land before any pig venue exists. Weights deliberately stay in [0.5, 2.0].

## 5. PHASE-2 ICON CONCEPT (name + description only)

```js
// ITEMS id: "bao"  — ITEM_NAMES: "PORK BUN"  — 9x7 like every defItem
```

**BAO (PORK BUN):** a round steamed bun, 7px-wide dome on the 9x7 grid, warm off-white body ([248,240,224]-ish) with a grey-white shade curve on the lower right, three dark pleat nicks meeting at the crown (the crimp is the read — it is what says *bao* and not *egg* at 9 pixels), sitting on a 1px tan steamer-paper line. Two-tone-plus-pleat keeps it legible on both sand and plank backgrounds, same discipline as `taco`/`plate_fish`. It is the first pig *good* (Ruling 2: goods are culture) and the object the `foreign` quote teaches the player to want to sell.

---
**Spec-author notes:** (1) DEPART_RULES actual location in this frozen tree is game.js:14505-14626 (visQuote 14628), DEP_MOODS 14449 — pigSeam.md's 14746 anchor is stale; doctrine comment block starts ~14448. (2) Diary event ids above (ashore/checkin/bought/gaveup/rough/turnin) correspond to visLog call sites 9240/9426/8908/9732/9465+9631/9659. (3) Both register options keep DRIFTWOOD as a proper noun — pigSeam.md flags it as culture-branded; if the spec de-brands hotel names, `bed`/`checkin` lines need a `{HOTEL}` slot. (4) Nothing here uses a glyph outside A-Z 0-9 $ . , - ' { } (slots resolve to digits/caps), so the font suite check passes as-is.
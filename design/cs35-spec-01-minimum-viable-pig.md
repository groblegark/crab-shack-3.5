# CS3.5 SPEC 01 — THE MINIMUM VIABLE PIG

*Spec, 2026-08-21. Anchors verified against THIS clone at commit e53df9d —
game.js line refs here differ from CS3's checkout (the clone predates some
of the fleet's morning work: `repFrac`/`REP_FLUSH`/`REP_PURSE` do not exist
at this commit; the purse mint has no rep multiplier). Charter and rulings:
`design/cs35-cultureway-research.md`. Baseline referee: suite 242/242,
matrix 0/16 med 12, growth 1/8 — pinned in the charter.*

## 1. SCOPE

The first pig gets off the ferry: rendered as a pig, named as a pig, tasting
as a pig, complaining as a pig — defined entirely by a `cultures.pig`
section of the save file. This is Layer 0 only (pure data; no expression
language yet), and it forces the first real engine capability: **body
geometry as data** (the pig is deliberately taller than the crab so the
five hard-coded 16×12 sites must read anchors from the art set).

**Non-goals (phase 2+):** pig dishes/venues (pigs eat the crab menu,
grudgingly), exposure drift on tastes, pig settlers (hire attempts are
REFUSED with a voice line — `convertTourist` must not silently make a pig a
crab), pig civics, mainland world art, the expression layer.

**Definition of done:** a save with `cultures.pig` lands pigs who arrive,
stay, spend, sleep, and depart with pig-voiced diaries and quotes; a save
WITHOUT the key — including every existing save — loads and runs
**byte-identically** (suite fingerprints green, matrix floors unchanged).

## 2. THE SAVE SCHEMA — `cultures`

New top-level envelope key (unknown keys are already ignored by `load()`,
so old engines skip it; `save()` seals env at game.js:6244–6246):

```jsonc
"cultures": {
  "pig": {
    "meta":    { "id": "pig", "name": "PORKRESENTATIVE PIGPUBLIC", "ver": 1 },
    "people":  { "names": [/* 26, §5.1 */] },
    "art":     { /* §5.4: palette, colorways, body{w,h,slots,anchors,poses},
                    accessories, items, bather */ },
    "voice":   { /* §5.2: diary{}, depart{}, dossier[], refuseHire, foreign */ },
    "tastes":  { /* §5.3: dishId -> weight, 0.5..2.0 */ },
    "arrival": { "repGate": 80, "shareMax": 0.25, "shareRamp": 80 }
  }
}
```

- **Species field on visitors**: `cu` in the save record (absent = `"crab"`),
  `k.culture` at runtime. The per-visitor record today is
  `n,c,a,x,y,s,w,p,sp,ni,nh,rn,un,ar,lt,b,rm,hu,th,di,bo,ti,log,st`
  (game.js:6202–6229); `cu` joins it.
- `c` (color) indexes **that culture's** colorway table, never
  `CRAB_COLORS`. `a` (accessory) indexes that culture's accessory dict.
- The crab culture is NOT transcribed in this spec (capstone work). The
  engine treats absent-culture as the hard-coded crab path; every new
  lookup is "pig table first, existing literal as fallback."

## 3. ENGINE CHANGES (patch plan, anchors @ e53df9d)

### E1 — Culture registry + import validation
- `CULTURES` runtime registry built at load from the save key; `"crab"`
  is always present (implicit, hard-coded for now).
- `saveProblem` (6023–6032) stays minimal; a new `cultureProblem(cu)`
  validates each declared culture at load/import, **failing with a message,
  never at first draw**: art rect-ness (equal-length rows), palette
  closure (every char declared), pose completeness (`a,b,w,s`), anchor
  bounds (inside `w×h`), colorway count ≥1, names array non-empty +
  ≤12 chars each, voice keys complete (§5.2 key list), taste refs resolve
  against live recipe ids, arrival numbers finite. A bad culture is
  dropped with a toast, not a brick.
- Art parses once at load via the existing `parseArt` (ppu.js) into a
  per-culture `ARTS[cu]` array parallel to `CRAB_ARTS` (game.js:5044).
  **Never extend `CRAB_COLORS`** — SUDSY is pinned to
  `CRAB_COLORS.length - 1` (5071) and HOUSES/BOATS/BUGGIES mint from it
  (5047–5049); appending would recolor her and mint pig-colored houses.

### E2 — Body geometry as data (the five render sites)
The art set carries `{w, h, anchors:{hat, carry, mark, bar}}`; the crab's
implicit values are `w:16, h:12, hat from ACCESSORIES dx/dy, carry {4,-7},
mark {12,-7}, bar 16`. Patch sites:
1. **drawCustomer** 11851–11899: `cy = base - 12` → `base - art.h`
   (11866); flip formula `16 - acc.dx - acc.art.w` → `art.w - ...`
   (11870); body from `ARTS[k.culture][k.color]`; accessory from that
   culture's dict; sleep-Z via `mark` anchor (Z is hard-coded `c.x+13` at
   11816 — off the edge of a 12-wide pig).
2. **Follow-card portrait** 12012–12015: same substitutions.
3. **Dossier 2× portrait** 12983–12986 + walk-in 13029–13031: art via
   culture; **`art2` cache key must be culture-namespaced** — today
   `"c"+color` / `"a"+acc` collide across species (12793–12796); becomes
   `k.culture+"c"+color`.
4. **Shower-stall bather** 15806–15826 (site the research pass missed):
   feet + "wet shell dome" + "eyestalks" drawn as crab-shaped rects from
   `CRAB_COLORS[oc.color]`. Becomes data: colorway from the occupant's
   culture, plus an optional per-culture `art.bather` rect list
   `[[dx,dy,w,h,slotIndex],...]` for the over-curtain silhouette (crab's
   transcribes to its current dome+eyestalks; pig's is a dome + ear nubs).
5. **drawCrab** 11768–11846 is NOT patched in this spec (no pig crew in
   MVP) — but the constants extracted for drawCustomer land in shared
   helpers so the capstone reuses them. Bus-rider stripe (11752) filters
   `crabs` only; no patch.

### E3 — Identity mint + the arrival gate
- **`ferryDock`** batch loop, species decision at 9236: before
  `newVisitor(last)`, roll culture from the manifest. Gate:
  `pigShare(rep) = rep < repGate ? 0 : min(shareMax, (rep - repGate)/shareRamp)`.
- **RNG DISCIPLINE (the fingerprint rule):** when `pigShare === 0` — no
  cultures key, or rep below gate — the code path must consume **zero
  additional `Math.random()` draws** and be instruction-identical to
  today. Concretely: `const share = pigShare(rep); const cu = share > 0 &&
  Math.random() < share ? "pig" : "crab";` — the roll is short-circuited
  before the draw when share is 0. One extra draw shifts every seed
  downstream and the frozen fingerprints will catch it (charter, hazard 7).
- **`newVisitor`** 9153–9191: identity roll (9172–9174) becomes
  culture-scoped: name from `cultures[cu].people.names` via the existing
  `freeVisitorName` dedupe (9131–9137 — dedupe is infra, pool is culture);
  `color` over that culture's colorways; `acc` over that culture's
  accessory keys (pigs: `strawhat`/`none` in MVP). Same **number** of
  draws for either species.
- **`newCustomer`** walk-ins 9775–9787 and **`seedVisitors`** legacy
  seeding 9207–9223: crab-only in MVP (walk-ins are locals-adjacent;
  seeding predates the gate). No change, noted for phase 2.

### E4 — Save round-trip
- Serialize: `cu: k.culture` joins the visitor record (6202–6229),
  omitted when `"crab"` (old-save shape preserved byte-for-byte).
- Restore clamps (6563–6610) become species-aware: resolve `cu` first
  (unknown culture id → `"crab"` + color/acc re-clamped to crab tables —
  a save referencing a culture the file no longer carries degrades, never
  crashes: the `CRAB_ARTS[undefined]` crash class from the graphics
  research). Color clamp `Math.min(CRAB_COLORS.length-1, ...)` (6568) →
  clamp against `cultures[cu]` colorway length; acc whitelist (6569)
  against that culture's dict.

### E5 — Voice
- New helper `vline(k, eventId, fallback, slots)`: looks up
  `cultures[k.culture].voice.diary[eventId]`, resolves `{SLOT}` templates
  from a fixed vocabulary (`N, ITEM, BIZ, LEFT, PURSE, MINS, STOPS, DAYS`),
  falls back to the existing literal. The **12 diary call sites** and their
  event ids (dossier at §9 of the anchors pass): `ashore` 9240, `dues`
  9248, `leaving` 9307, `missedboat` 9326, `checkin` 9426, `checkout`
  9435, `norooom→rough` 9465, `wokesand` 9631, `turnin` 9659, `gaveup`
  9732, `bought` 8908, `seeded` 9221.
- **Departure quotes**: the rule ENGINE stays exactly as is (`visQuote`
  14628–14635, weights, derived-never-random doctrine); the SENTENCES
  become per-culture templates keyed by rule id (`rough, quit, nothing,
  unspent, idle, wait, bed, spentup, table, regular, quiet, ...` — 20 ids
  at 14505–14624), pig table first, closure literal as fallback. Font law:
  apostrophes only (3×5 font has `'`, no `"`), ALL CAPS, `fitSmall`
  budgets (≤~38 diary / ≤~50 depart).
- Dossier empty-diary fallback (13011) and quips: per-culture `dossier[]`.

### E6 — Tastes
- Weight map multiplies into `visPick` (9516–9592) at two points:
  1. The scorer (9587): `s *= tasteOf(k, e)` where `tasteOf` reads the
     culture's weight for the candidate's representative dish (1.0 when
     absent — crabs are all-1.0 by construction).
  2. The `treat` closure (9550): uniform pick becomes weighted pick —
     **with the equal-weights fast path**: if every candidate weighs the
     same, use the legacy `(Math.random()*rs.length)|0` expression so the
     draw maps identically and crab fingerprints hold.
- **`foreign`** joins the `stayBlocked` taxonomy (def 14412; existing
  call sites 9535/9536/9538): incremented when a pig's chosen treat had
  weight ≤ 0.6 (they settled for it). New DEPART_RULE `foreign` (weight
  fires on `st.foreign ≥ 2` and outranks `quiet`), line from the culture's
  `voice.foreign`. This is how the player learns the demand exists before
  any pig venue does (RCT guest-thought doctrine, charter §4).

### E7 — Hire refusal
- `hireCrew` prefers converting a tourist (7122–7132) and
  `convertTourist` (7092–7112) runs `makeCrabPersona` — a pig hired today
  silently becomes a crab (7099–7101). MVP: `convertTourist` guards on
  `k.culture !== "crab"` → refusal quip from `voice.refuseHire`, hire
  falls through to the next candidate. Also the `freeCrewName` fallback
  literal `"CRAB"` (7079) is noted for the capstone.

## 4. DETERMINISM & FINGERPRINT RULES (summary)

1. No `cultures` key ⇒ zero new RNG draws, zero behavior change — suite
   fingerprints are the referee.
2. The species roll short-circuits before its draw at share 0 (E3).
3. Equal-weight taste picks reduce to the legacy draw expression (E6).
4. Culture art parses at load (once), never mid-frame; parse failures are
   import-time messages (E1).
5. All culture randomness flows through the context `Math.random` — the
   seeded harness governs pigs exactly as crabs (simlib seeds the vm's
   Math at tools/simlib.mjs:32–44).
6. Matrix re-run after every landing step, measured against the pinned
   baseline (0/16 med 12; growth 1/8) — the gate keeps pigs out of the
   early-game floor by construction (rep 80 ≫ day-12 median eviction), so
   baseline MUST come back identical, not merely close.

## 5. THE PIG CONTENT (draft — for the owner's reaction pass)

### 5.1 Name pool (26, matching the crab pool's pun/plain mix)

```js
"HAMLET","SPAMELA","BOARIS","HOGARTH","SOWPHIE","HAMISH",
"PIGBY","SWINSTON","HAM SOLO","PIGGY SUE","BIG HOCK","FARROW MAE",
"TROTTER","RASHER","GAMMON","CRACKLIN","RIND","SNOUT",
"BRISTLE","WALLOW","ACORN","CLOVER","TURNIP","MAIZE","LOAM","PETUNIA"
```
(HAM SOLO mirrors KRILL BILL's shape; BIG HOCK mirrors BIG PALP; the
plain-word tail — ACORN, CLOVER, LOAM — mirrors MOLT/ROE/BRINY. All ≤10
chars; no collisions with either crab pool, so the dedupe holds.)

### 5.2 Voice — TWO REGISTER OPTIONS (pick one; samples abridged, full
tables land with the implementation)

**Option A — THE VISITING ALDERMAN** (civic-proud, courtly-formal; comedy
= bureaucratic dignity on a beach):
> diary: "DISEMBARKED IN GOOD ORDER" · "PASSED THE NIGHT UNHOUSED. NOTED."
> depart: "THE PIGPUBLIC WILL HEAR OF THE SAND I SLEPT ON." ·
> "EVERY DOOR SHUT. I SHALL SAY SO IN MY REPORT." ·
> "THE DRIFTWOOD KEEPS A BED FIT FOR A CONSUL."
> foreign: "NOTHING ON ANY MENU A PIG WOULD RECOGNIZE."

**Option B — THE FARMHAND ON HOLIDAY** (hearty-rustic-direct; comedy =
plain comparison to farm life):
> diary: "OFF THE BOAT AND HUNGRY ALREADY" · "SLEPT ROUGH. DONE WORSE AT
> HARVEST."
> depart: "A BEACH IS NO BED. EVEN OUR MUD IS WARMER." ·
> "THAT DRIFTWOOD BED BEAT MY OWN HAYLOFT." ·
> "SPENT THE LOT. THAT'S WHAT MONEY'S FOR."
> foreign: "NOT A PORK BUN IN TOWN. I ATE FISH, I SUPPOSE."

Required voice keys: `diary` {ashore, dues, leaving, missedboat, checkin,
checkout, rough, wokesand, turnin, gaveup, bought}, `depart` (the 20 rule
ids, missing ids fall back to crab lines), `dossier[3]`, `refuseHire`,
`foreign`. Both options keep DRIFTWOOD as a proper noun (it is the
island's hotel; a pig names the place they slept).

**THE PIGTATOR (canon, Matt 2026-08-21)**: the Pigpublic's head of state.
MVP scope: voice hints only — one dossier line per register references
the office (A: "TRAVELING BY LEAVE OF THE PIGTATOR"; B: "BACK HOME, THE
PIGTATOR. HERE, GULLS."), and A's report-filing mannerism now has an
addressee. The office itself is mainland civics,
out of MVP scope, and the eventual civics-format contrast case to the
crabocracy's ballot (spectrum proof, charter Ruling 3).

### 5.3 Tastes (static MVP weights over the real dish ids)

```js
{ "taco":0.6, "fish":0.5, "juice":1.6, "cooler":1.8, "clawgame":1.0,
  "skeerun":1.0, "gamenight":1.1, "room":1.7, "rinse":1.3, "soak":2.0 }
```
Fish at the taboo floor; fruit drinks and the hot **soak** (structurally a
wallow) at the ceiling; `room` 1.7 = pigs adore a soft bed. Hunger→shack
is hard-coded (9552–9558), so fish-aversion biases the pick WITHIN the
shack rather than starving anyone — pigs eat, grudgingly, which is what
makes the `foreign` quote land. Bounds [0.5, 2.0] per the Victoria-3
precedent.

### 5.4 Colorways (6, named for real pig breeds — REV 2, owner feedback
2026-08-21: MUD BROWN retired, "looks too much like a bear"; real spots
requested)

Colorways are now TRIPLES `[body, shade, spot]`, because **spots are a
third palette slot `O` baked into the body template**: a handful of `O`
pixels sit in the P fields (cheek, shoulder, hip — asymmetric, Gloucester
style), and a colorway either maps `O` to the body color (invisible) or to
a contrast color (real spots). No extra art, works in every pose, and the
schema's `slots` list becomes `["P","Q","O"]`.

```js
[ ["PIGLET PINK",     [248,176,168],[200,120,120],[248,176,168]],
  ["ROSE",            [232,136,144],[176, 88,104],[232,136,144]],
  ["OXFORD SANDY",    [224,184,136],[168,128, 88],[168,128, 88]],  // subtle mottle
  ["TAMWORTH GINGER", [208,136, 80],[152, 88, 48],[208,136, 80]],
  ["BERKSHIRE PLUM",  [136, 96,136],[ 88, 56, 88],[136, 96,136]],  // replaces MUD BROWN
  ["OLD SPOT",        [224,216,208],[168,160,152],[ 64, 56, 72]] ] // real spots
```
The pig ramp lives in the warm-neutral band no crab colorway occupies —
species reads at a glance before the silhouette does. All values multiples
of 8 (exact through 15-bit quantization).

### 5.5 Body art (12×16 upright pig-person; DRAFT, validated 45/45
structural checks — rect-ness, palette closure, pose completeness, anchor
bounds, brim-on-anchor geometry; validator script preserved with the
research passes). Slots P (body) / Q (shade, snout, trotters), K outline,
B pupil/nostril. Poses `a` (walk/idle), `b` (legs spread), `w` (trotters
raised), `s` (bottom-anchored slumped loaf in the same 12×16 box — zero
draw-code changes since `y = c.y - h` still grounds it):

```
a:  ..KK....KK..    s — ON HER SIDE (rev 3, owner ruling; bottom 7 rows
    .KPPKKKKPPK.        of the 12x16 box, 9 blank above):
    .KPPPPPOPPK.
    .KPBPPPBPPK.        ..KK..KKKK..   flopped ear + back
    .KPQQQQQQPK.        .KPPKPPPPPK.   ear + flank
    .KPQBQQBQPK.        KPPPPPPPOPPK   head/body + flank spot
    .KPPQQQQPPK.        KPKKPPPPPPPK   closed-eye dash
    ..KPPPPPPK..        KQQQPPPPPPPK   snout to the sand
    ..KKKKKKKK..        KQBQPQQPQQPK   nostril + trotter nubs
    .KPPPPPPPPK.        .KKKKKKKKKK.   ground line
    KPKPQQQQPKPK
    KQKPQQQQPKQK
    .KPPPPPPOPK.
    ..KPPKKPPK..   legs together    b swaps rows 13-15:  .KPPK..KPPK.
    ..KQQKKQQK..   hooves                                .KQQK..KQQK.
    ..KKKKKKKK..                                         .KKKK..KKKK.
```
(Spot pixels `O` shown in rows 2/9/12 of pose a per §5.4 rev 2.)

Anchors: `hat {1,2}` (head dome top-left, brim lands ON the anchor row —
the tophat no-bob rule), `carry {2,-7}` (9×7 item floats above the ears,
same 1px-right-of-center bias as the crab), `mark {9,-6}` (air over the
ear), `bar {w:12}`. REV 2: the body template carries `O` spot pixels
(rows 2/9/12 in pose a, mirrored per pose) — see §5.4.

Accessory **strawhat** — RESOLVED (owner, 2026-08-21): **BIG WINS.**
14×5 sun brim, dx −2, dy −4 — wider than the pig herself (blit clips
fine; the flip formula handles negative dx once w is data; the small
8-wide candidate is retired). MVP rule: accessories are NOT drawn while a
save-defined culture's pose is `s` (a side-sleeper's hat would float;
the crab's hard-coded path is untouched — revisit at the capstone).

Item **bao** (9×7, phase-2 good, drawn now): steamed bun, three pleat
crimps at the crown — the crimp is what says *bao* and not *egg* at 9
pixels.

**Known-weak points for the pixel pass** (owner's brush): nostril B-on-Q
contrast after quantization; the Q belly patch may read as clothing;
w-pose arms are 1px (may strobe); strawhat covers the ear tips; hats
float during the sleep pose (consider suppressing hats when pose is `s`);
single-B eyes will look sparse in the 2× dossier portrait (may want a W
highlight pixel).

## 6. TESTS (new suite scenarios; pattern = suite.mjs `scenario(name, fn)`
@ 8–9, `createSim({seed})`, return true or a failure string)

1. **No-cultures fingerprint**: 2-day run, save-blob byte-compare against
   a control build — the load/mint/draw seams consume no RNG and change
   nothing when the key is absent.
2. **Pig round-trip**: mint a pig (forced share), save, load — `cu`,
   color, acc, diary survive; color clamped against PIG colorways.
3. **Unknown culture degrades**: hand-built save with `cu:"walrus"` →
   loads as crab, no crash, no `ARTS[undefined]`.
4. **Bad art rejected at import**: ragged rows / missing pose / anchor
   out of bounds → import message, save untouched.
5. **Gate**: rep below `repGate` ⇒ zero pigs across N sailings AND
   fingerprint-identical to control; above ⇒ share within tolerance.
6. **Tastes bite**: seeded pig, forced hunger — over M picks the
   fish/taco ratio reflects the weights; crab picks unchanged (equal-
   weight fast path).
7. **Foreign quote**: pig who only ever settled (weights ≤0.6) departs
   with the `foreign` rule winning; the departure card renders it inside
   the 50-char budget.
8. **Hire refusal**: `hireCrew` with only a pig on the boardwalk refuses
   with the voice line and hires nobody; `convertTourist` never runs
   `makeCrabPersona` on a pig.
9. **Voice fallback**: pig culture missing a depart id falls back to the
   crab line, never a blank.
10. **Accessory pools are closed**: strawhat is not reachable by crab
    visitors; tophat not reachable by pigs (extends the office-hat
    exclusion scenario at suite.mjs:6862–6876).
11. **World sweep**: existing no-overprint sweeps re-run with a pig
    ashore (taller body vs name labels and card layouts).

Plus: full matrix re-run vs the pinned baseline after each landing step.

## 7. IMPLEMENTATION ORDER (each step lands suite-green)

1. **Registry + validation + species plumbing** (`cultures` key,
   `cu` field, clamps, `cultureProblem`) — no behavior change.
2. **Geometry extraction** (E2: the five sites read w/h/anchors; crab
   values become the implicit art-set metadata) — the risky step;
   fingerprints are the proof it changed nothing.
3. **Pig art + mint + gate** (E1 art build, E3) — first pig ashore.
   Screenshot the thing.
4. **Voice + tastes + foreign + hire refusal** (E5–E7) — the pig becomes
   a character. Departure-card screenshot with a pig quote.
5. Suite scenarios land WITH each step, not after; matrix after 2, 3, 4.

## 8. FOR THE OWNER'S REACTION

- **Voice register: Option A (Alderman) or Option B (Farmhand)?** (Or A
  for a rare "official visitor" flavor later — MVP wants exactly one.)
- ~~Strawhat: SMALL or BIG?~~ **RESOLVED: BIG** (owner, 2026-08-21).
- ~~Sleep pose~~ **RESOLVED: on her side** (owner, 2026-08-21; §5.5 rev 3).
- The gate numbers (`repGate 80, shareMax 0.25, shareRamp 80`) are
  proposals to measure, not rulings — the matrix referees.
- Sprite draft wants your pixel pass (weak points listed in §5.5).
- Colorway names OK? (They print nowhere in MVP; they're schema
  documentation.)
- "DRIFTWOOD" stays a proper noun in pig lines — flag if the hotel should
  ever be culture-brandable instead.

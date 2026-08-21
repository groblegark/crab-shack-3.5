# CRAB SHACK 3.5 — CULTUREWAYS IN THE SAVE FILE (research)

*Research synthesis, 2026-08-21. Nine research passes: two over game.js (the
Crabocracy inventory, the engine seams), one over the visitor pipeline (the
pig seam), one over art (graphics as data), one over food/management, and four
over the outside world (culture-as-data games, code-in-the-save precedents,
embeddable runtimes, LLM-authorable DSL design). Line refs are from 2026-08-21
and decay — anchor on names. Sources inline; the deep source lists live at the
foot of each section.*

## THE CHARTER

Crab Shack was always meant to stand on two touchstones: (1) cultural
diversity and (2) agentic customizability and extensibility. Neither exists
yet. CS3 hard-codes one culture — the **Democrabic Crabocracy** — beautifully
and irretrievably into game.js. CS3.5 is the architecture effort that moves
**everything culture-defining — graphics, food, logic, management, governance,
voice — out of game.js and into the save-game file** (the file may be big),
so that cultureways exist as data/code, and CS4's "build your own cultureway"
has a substrate for agents to author against.

**The forcing function is the PORKRESENTATIVE PIGPUBLIC** (Matt, 2026-08-21):
pig people from the mainland. They start as tourists on the existing ferry,
and eventually get all of their own stuff. You cannot design a general format
from one example; the second culture is what squeezes every hidden crab
assumption out of the engine. Cross-cultural tourism — and learning another
culture's foodways — is an important ongoing dynamic going forward.

### RULINGS (Matt, 2026-08-21 — these settle questions the research left open)

1. **The language is the layered tower, entered from the bottom.** JSON data
   (Layer 0) + terminating expressions (Layer 1) now; Hardened-JS (SES
   compartment) hooks later, when a real cultureway need forces Layer 2.
2. **Currency is physics; goods are culture.** There is ONE world currency
   and it is conserved for sure — the capability API has no mint verb for
   money. But **cultures can generate their own resources**: new goods,
   ingredients, artifacts, and the production chains that make them are
   culture-authored. Whether OTHER cultures will exchange money for a
   culture's goods is the emergent question — a conjured good is worthless
   until someone chooses to pay for it. (This narrows CS3's "resources are
   never conjured" to its load-bearing core: the *money* audit stays total;
   goods move from physics to culture.)
3. **The full governance spectrum is in scope.** Other government types must
   be very possible; **anything around social dynamics should be fully
   non-hard-coded** — total anarchy to a strict totalitarian state.
   "Local government, they're not gods" is Democrabic Crabocracy canon, not
   world law. Anarchy is a cultureway that declares no institutions; a
   totalitarian state is a cultureway with sweeping capability grants. The
   engine keeps: currency conservation, the physical sim (needs, movement,
   time, mortality), and determinism — nothing else about how people
   organize.
4. **Power is incentives + consequences, never puppeteering.** Culture code
   cannot reach into a crab's head. Laws are heavy modifiers to the same
   errand-scoring machinery, plus enforcement institutions that create
   consequences (fines, confiscation, patrols, the register). Even a police
   state rules through fear and incentive; compliance stays per-crab and
   personality-flavored, and defiance is always possible and always priced.
   Everything in the sim remains a choice somebody makes — the 73%-vs-92%
   turnout gradient generalizes instead of disappearing.
5. **Assume hostile files; skip the sharing UX for now.** Every imported
   save is treated as adversarial from day one — compartments with no
   ambient authority, fuel budgets, schema clamps, currency conservation by
   API shape — but no approval-gate UI in 3.5. (When sharing arrives, the
   Qud-style "this culture wants:" screen bolts onto declared grants; the
   sandbox could not have been retrofitted.)
6. **Scope: pigs first, Crabocracy as capstone.** Sections land in order:
   (1) species substrate + pig tourists (art/names/voice/tastes — Layer 0);
   (2) foodways + cross-cultural mechanics; (3) civics capability APIs, with
   the Crabocracy re-expressed in the format as the finale — suite green.
   **3.5 is done when both cultures live in the save and game.js hard-codes
   neither.** The transcribed Crabocracy doubles as CS4's reference
   exemplar.
7. **The port is the test** (Matt, 2026-08-21: porting CS3 work into 3.5
   "will be a great validation that we're doing it right"). CS3 development
   continues in parallel in its own checkout, and its output flows into 3.5
   continuously under a triage rule: **engine-shaped changes** (fixes,
   tooling, sim infrastructure) merge straight through git from
   crab-shack-3 main; **culture-shaped changes** (a new dish, a civic
   feature, signage, voice lines) are RE-EXPRESSED through the cultureway
   format, never merged in as fresh hard-code. Each port is a live test of
   the format's expressiveness against features designed with no knowledge
   of it — a port that won't express cleanly is a FORMAT bug, filed and
   prioritized as one, not worked around with a special case in game.js.
   The suite + matrix baselines captured in this clone are the referee:
   a ported feature must reproduce the behavior its CS3 original ships.

### THIS CLONE'S BASELINE (2026-08-21, measured at commit 6720615)

Per the house rule — measure against the tree you are landing on — the
pre-first-pig floor of `~/crab-shack-3.5` @ `cs35`:

- **Suite: 242/242 passed, exit 0** (2758s under agent load).
- **Baseline matrix** `--days 30 --seeds 16`: **survived 0/16, median
  eviction day 12** — identical to PLAN.md's documented floor.
- **Growth matrix** `--days 40 --seeds 8 --buy chef,table`: **survived
  1/8** (evictions 10,11,12,12,12,12,13 + one 40-day survivor at $3109) —
  within one coin-flip town of PLAN's 2/16 rate, i.e. unchanged.

Every ported feature and every format change measures against THESE
numbers, re-run in THIS clone — not against the digits in CS3's PLAN.md.
The matrix remains a regression detector, never a difficulty dial.

### Canon updates (2026-08-21)

- **Pigs DO get off the boat now.** This supersedes PLAN.md's "a pig does not
  get off the boat in this game" (that was CS3 scope; CS3.5 changes it). The
  mainland-pigs canon itself (PLAN "THE CULTURE OF THE CRAB PEOPLE") stands.
- The town-name spoiler embargo is untouched by any of this.
- CS4 remains "build your own cultureway"; CS3.5 builds the substrate the
  builder will use.

---

## 1. WHERE THE ENGINE ALREADY IS (closer than it looks)

game.js is 16.2k lines with ~1000 top-level globals, no modules, no build
step — and yet the house style is already half data-driven:

- **`BIZ` (~142–303) is the crown jewel**: a business is one object — sign,
  rent, owner, geometry, stations, tables/stalls, and `recipes` in a uniform
  shape `{id, icon, pay, raw, raw2?, steps:[[station, secs, product]]}`. The
  hotel proves the abstraction holds: its one dish is A NIGHT'S STAY.
- **All art is already a data format.** `parseArt(rows, palette)` in ppu.js —
  strings of characters, one char per pixel, `{char:[r,g,b]}` palettes,
  SNES-15-bit quantization at parse time — decodes every sprite in the game.
  sprites.js (1197 lines) is ~90% literal rows-of-strings; the residue is
  palette-swap factories (`crabArt`, `touristArt`) expressible as
  `{template, slots}`. Serializing the crab's art into JSON is transcription,
  not porting.
- **The save is plain JSON** in localStorage slots with file export/import,
  and **the import path is already an authoring API**: `importJson` → the
  minimal `saveProblem` gate → the same `load()` migrations as any stored
  slot. Unknown top-level keys are ignored by load — the envelope is
  forward-compatible by construction. Saves measure tens of KB today;
  localStorage (~5MB) leaves two orders of magnitude of headroom.
- **Conservation is proved, not promised**: `worldMoney()` sums every wallet
  class; `auditFund` asserts delta==0 around every fund movement. The fund has
  exactly three doors (`fundTake` / `fundPay` / `fundRemit`), each auditable,
  each naming a counterparty.
- **Determinism is environmental**: the game calls bare `Math.random()`; the
  harness (tools/simlib.mjs) runs the real engine in a Node vm whose `Math` is
  seeded mulberry32. The suite (230+ scenarios) and the headless matrix are
  the regression oracle — and the constraint: cultureway code must draw all
  randomness through the context's RNG, never touch wall clock, and consume
  no RNG when disabled (the `_stats.rollLog` house rule).
- **The plug-in shape exists once already**: merge.js is a self-contained
  IIFE the game calls as `MergeMode.frame(dt)`. And `window._noHall` already
  runs the town with the crabocracy OFF — a cultureway is already removable
  as a unit for attribution measurement.

### The engine seams (where a cultureway runtime hooks)

1. **The settlement pipeline** — the 20:00 block is a linear sequence of named
   `runX()` phases (`runTownHall`, `runSuccession`, `runHotelier`…). A phase
   list is one refactor away; the Crabocracy IS mostly this block plus the
   poll subsystem.
2. **The errand system** — `pickErrand` gathers candidate stops as small data
   records scored by generic detour machinery. Voting is literally an errand
   with rank 2. A registry of `{id, when, stop, start, update, need, rank}`
   would absorb tap/ball/soup/vote/chat wholesale. **This is the single
   biggest hard-coded surface a cultureway runtime must open up.**
3. **Money primitives** — `acctBal/acctMove/bizAcct` + `creditBiz/debitBiz` +
   the fund's three doors. A cultureway's institutions expressed entirely in
   these verbs inherit the conservation proof for free.
4. **Policy step-tables** — `PURSES`/`WAGE_FLOOR`/`HEAD_CAP` show the shape:
   `{name, unit, who, steps[]}` plus a per-dial `stake(c, p)` valuation
   feeding `platValue` → `voteReason` → `pickCandidate`.
5. **The save envelope** — a `cultures:{}` key with its own clamp-on-load
   discipline, behind the same one validated door.
6. **The UI card pattern** — every surface is `xxxRects()` + `drawXxx()` +
   click routing; report/depart cards are already arrays of fitted lines. A
   declarative card spec (rows + chips + pagers + named hit rects) matches
   the existing structure closely enough to generate.

### The engine hazards

- ~1000 mutable globals in one scope — save-resident code must be handed a
  curated API, not the global soup.
- Geometry is compile-time data with sim semantics (lanes, queue slots,
  hand-measured placard x's — 4px of signage once cost 17 points of turnout).
  Placement must be host-mediated (slot registry), never raw coordinates.
- Live object cross-references don't cross the save boundary today (rooms
  re-linked by index; queued crabs put back on the promenade) — culture state
  must obey the same rule.
- `defineTill` closures and accessor properties mean naive serialization of
  engine state double-counts money — the culture/state wall must be explicit.
- The suite pins today's behavior byte-for-byte in places. The refactor to a
  pluggable runtime must land with the Crabocracy loaded and the suite green:
  one extra `Math.random()` call shifts every seed downstream.

---

## 2. WHAT A CULTUREWAY MUST EXPRESS (the Crabocracy's testimony)

Full cartography in the research pass; the abstracted requirements list —
what this one culture proves the format needs:

1. **Named institutions with state schemas** — `townFund`, `hall`,
   `ballotBox`, `dorm`: declarable persistent state + per-field clamps +
   legacy-save defaults ("an old save has no hall and gets the founding
   arrangement").
2. **A closed money-movement algebra** — three verbs only; conservation
   provable *by construction*. A cultureway never writes a balance; it
   invokes movement verbs against host accounts.
3. **Interception hooks on host money flows** — four distinct attachment
   points exist today: mid-transaction (`rentCut`), world event
   (`harbourDues` at the gangway), settlement aggregate (the levy), wallet
   scan (tin/whip-round). The format needs a taxonomy of tap points, not one
   generic "tax" primitive.
4. **Policy dials consumed at named choke points** — the office publishes
   values (minWage, headCap, bowls, purse choice) read at ~10 pre-existing
   decision sites. The host must expose a registry of policy slots;
   `declarePoll`'s documented field-copy hazard (a dial that wins an election
   and never takes effect) is what happens without one.
5. **Scheduled multi-phase processes with load-bearing order** — the weekly
   ballot calendar; a settlement pipeline where rent-before-paper-before-soup
   is the design; two-nights-out budgeting because of collection lag.
6. **Utility-theoretic preference functions with legible receipts** —
   `platValue` = a sum of small named terms, deterministic tie-breaks, AND
   `voteReason` generating each voter's one-line justification from the same
   terms. Legibility is a ruling, not a nicety: the formula and its
   explanation must come from one definition.
7. **New errand types** — urgency ramp, eligibility, locations
   (host-placed), dwell, queue spacing, per-outcome diary/quip/counter,
   cooldown, and hard caps (culture never overrides survival — `civicUrge`
   is capped below DIRE).
8. **Physical resources with supply chains** — ballot paper is bought off the
   ferry on the trade ledger, piles down one pixel a sheet, runs out, and
   cannot be conjured by a reload.
9. **World props and signage with host-mediated placement.**
10. **UI card pages** — paged sub-views, gated controls, refusal strings,
    every string pixel-fitted.
11. **Failure modes landing on named people** — cold pot, no paper, too
    late: each a per-crab event with a diary line, never an aggregate.
12. **Anti-ratchet invariants stated and testable** — the corrective-loop
    guarantees (roofWeight doubling, whipRound, hat-passing) are design
    theorems; the format wants a place for a culture to *declare* invariants
    the suite then enforces.
13. **A culture-off switch** — everything behind one predicate.

**Fraction judgement** (by mechanism count): ~25% pure config, ~40% formulas
and scheduled process expressible in a modest declarative/functional layer,
~35% is really **host capability APIs that don't exist yet** (errand
injection, hook taxonomy, policy slots, placement, cards, save hardening).
Almost nothing is irreducibly imperative — but little is expressible until
those APIs exist. **The emergent couplings are the warning**: turnout↔shop
hours, bowls-eaten↔next vote, fish price↔soup cost↔platform affordability —
the game's best content exists because the culture shares the sim's state
space. A culture VM that can't read shift schedules or write persona fields
would lose exactly the material that makes the crabocracy good.

---

## 3. THE MINIMUM VIABLE PIG (the visitor-pipeline seam)

Pigs start as tourists, so the visitor system is the first seam, and it is
narrow: **visitor identity today is `(name, CRAB_COLORS index, ACC_KEYS
key)`. Three save-restore clamps, four render sites, and `convertTourist`
are the complete list of places that assume the boat only carries crabs.**

Gifts found in the code:
- A dead-but-working humanoid `_TOURIST` sprite (12×19, hair/shirt palette
  slots, `touristArt` styles) survives in sprites.js — the retired
  "visitors are a different species" path is the ready template for a second
  body shape.
- `window.onFerry` is a declared extension seam ("another agent owns the
  horizon").
- The departure card's `stayBlocked` taxonomy (shut/full/broke) is typed and
  extensible — adding `"foreign"` (nothing I eat) is structurally trivial.
- The player's hire path already converts tourists (`convertTourist`) — the
  pig-settler pipeline exists. Trap: it runs through `makeCrabPersona`; a
  pig hired today would silently become a crab.

Per-culture definables (abridged; [T]=already a table, [F]=formula to
parameterize, [HC]=hard-coded crab assumption): body sprite + poses [HC at 4
render sites], colorways [T], accessories [T], name pool [T], purse-mint
constants [F], nights/stay distribution [F], need rates/thresholds/ranks [F],
food preferences [F — see §4], diary voice [HC — every visLog string is
inline English], departure quips [HC — ~22 rules whose *weights* are infra
and whose *sentences* are culture], dossier/status copy [HC], arrival mix on
the ferry manifest [new F], persona factory for settlers [HC], save species
field + clamps [F].

**Infrastructure (engine) vs culture (save)**: ferry clock, queue mechanics,
state machine movers, room occupancy invariants, the stay-ledger schema, the
quote *engine*, rep coupling, the five-needs vocabulary (deliberate
one-vocabulary doctrine — a pig carries the same bars) all stay engine-side.
Sprites, names, mint constants, tastes, and **every visitor-voiced string**
move to the save.

**The voice section is a first-class discovery**: the biggest hard-coded mass
in the visitor pipeline isn't logic, it's prose. A cultureway needs a
per-culture string table (keyed by event id, same weighted-rule engine)
as much as it needs a sprite section. Constraint carried from the font: the
3×5 font has `'` but no `"`; all culture text obeys `fitSmall` pixel budgets.

---

## 4. FOODWAYS AND MANAGEMENT AS DATA

- The whole commerce catalog is one code literal (`BIZ`) away from being
  save data; the save already carries per-biz settings maps (hours, wage,
  price, tipShare, mealPol) — **the settings envelope pattern exists; the
  catalog just joins it.**
- **The taste hole**: visitors pick dishes by *uniform random over affordable
  recipes* (`visPick` — deliberate: "holidaymakers order what they fancy").
  There is no per-dish preference term anywhere in the game. That hole is
  exactly where cultural taste plugs in.
- Dish mastery (`p.made`, per-dish-id counters + `MASTERY` ladder) already
  gives foreign recipes progression for free; what's missing is a
  "knows/doesn't know" gate.
- Management is ~90% data already; what's frozen is the *norms* (WAGE_STD,
  TABLE_TIP, tip-counter fraction, shift shapes, meal-policy defaults) —
  exactly the conventions a culture section would own.

### Cross-cultural mechanics worth stealing (each with a shipped precedent)

1. **Taste weights with exposure drift** (Victoria 3 obsessions/taboos:
   ×2 / ×0.5, and *abundance creates taste*) — pigs land loving pork buns and
   side-eyeing fish tacos; three visits of fish tacos flips the weight.
   Multiplies straight into `visPick`'s scorer and treat picker.
2. **An acceptance meter gating hybridization** (CK3 cultures) — one scalar
   per culture pair, town-level, grown by completed cross-cultural
   transactions; thresholds unlock patronage, menu postings, and eventually
   a **hybrid dish** cherry-picked from a parent recipe of each culture.
3. **Recipe knowledge as a taught thing** (CDDA `autolearn:false` +
   Cuisineer) — split "on the menu" from "this cook can make it"; learn by
   working a shift beside a knower (mirrors the illness-contagion adjacency
   mechanic) or by repetition at a time penalty through the existing mastery
   machinery. A pig settler becomes valuable as a knowledge carrier.
4. **Legible refusals** (RollerCoaster Tycoon guest thoughts → CS3's
   departure card) — `stayBlocked(k, "foreign")` plus a departure quote
   ("NOT A PORK BUN IN TOWN. I ATE FISH, I SUPPOSE.") teaches the player the
   demand exists from the guests' mouths, before any pig venue exists.
5. **Menu-slot venues + tourists as the unlock vector** (Anno 1800 Tourist
   Season) — a shop's active menu becomes a data list of recipe ids; visiting
   pigs issue the unlock (serve N pigs / hire a pig / acceptance threshold
   hands you the recipe card). Carries the reverse flow too: a crab recipe
   boarding the ferry as an export.

---

## 5. GRAPHICS AS DATA

A culture's art section is concrete and cheap in THIS engine (schema sketch
in the graphics research pass): `palette`, `colorways` (replacing the global
`CRAB_COLORS` for that species), `body` (w/h + palette `slots` + **anchors**
— hat point, carry point, mark point, bar width — everything `drawCrab`
currently hard-codes for the 16×12 crab), the four named poses `a/b/w/s`
(the pose state machine's contract, kept), `accessories` (dx/dy relative to
THIS body), `items` (9×7 icons in a shared namespace so crab servers can
carry pig dishes), `props` (1–2 frame arrays, the house animation budget).

Hazards, all enumerable: five call sites hard-code the crab body (the flip
formula `16 - dx - art.w` is the sneakiest); portrait caches key on color id
and need culture namespacing; out-of-range color index crashes `drawCrab`
(import validation must grow art checks — rect-ness, palette closure, pose
completeness, anchor bounds — so a bad file fails at import with a message,
not at first draw); **fonts stay engine-side** (glyph tables are a shared
alphabet; a real all-`?` regression is on record); the 2-frame animation
budget should be enforced, PICO-8-style, not opened. Save size is a
non-issue: all of sprites.js is ~40KB as JSON.

**World art is culture too (Matt, 2026-08-21): "the pigs will need their own
world art — they don't live on an island."** A cultureway's art section
extends past bodies and items to PLACE: backdrop layers (the mainland's
hills-behind-hills are drawn from the crab shore today — the pigs' side of
that horizon is theirs to define), terrain (sand is crab ground; pigs get
fields, cobbles, whatever a Pigpublic paves), building templates (house and
shop styles), furniture/props, and lighting/flavor. Two consequences:
- **This is the deep end of the graphics hazard.** Creature art is nearly
  free; world geometry is compile-time data with sim semantics baked in
  (collision bands, travel lanes at magic y's, hand-measured furniture on a
  full coast). A culture-defined WORLD means the layout layer — not just the
  pixels — eventually becomes data, host-validated the same way placard
  placement must be.
- **It plants the trade-network seed.** If a culture carries its own world
  art, then a place is a NODE: (world art + layout + populations + cultures
  present). The island is the crab node; the mainland is the pig node. CS3.5
  doesn't need to render the mainland — pigs visit the island — but the
  format should reserve the `world` section now so postcards, departure-card
  vignettes, the far-shore detail, and eventually whole visitable nodes have
  a home. (PLAN's "The trade horizon" was already pointed here.)

Precedents: PICO-8 carts (sprites+map+code+sound in one file — the closest
thing shipped to "the save file is the whole culture"), Doom WADs (named
lumps, fall-through to defaults — the right model for partial cultures),
DF tilesets, NES CHR banks.

---

## 6. WHERE SHIPPED GAMES DRAW THE DATA/CODE LINE

Four rungs recur across RimWorld Ideology, CK3, Dwarf Fortress, Caves of
Qud, Wildermyth, Songs of Syx, and Wesnoth:

- **(a) Vocabulary/values** — enums + weights (DF ethics/values, CK3
  tradition parameters). Always data; powerful when systems *compare* values
  rather than switch on identities (DF derives wars from ethic distance;
  value thresholds unlock institutions).
- **(b) Composition** — assemble code-implemented behavior atoms with tuned
  fields (RimWorld PreceptComps, Qud parts, Wildermyth outcomes). Data picks
  *which* behaviors and *how much*, never *new* behavior.
- **(c) Interpreted logic** — a shipped DSL for triggers/effects (Paradox
  script, Wesnoth WML+Lua). Deliberately not Turing-complete: no strings,
  loop caps, for save-safety and perf.
- **(d) Sim loop, pathing/AI, UI** — engine code in every surveyed game. UI
  is the most stubbornly code-side layer everywhere; RimWorld's mitigation
  (precept UI *generated from def fields*, so new data gets UI for free) is
  the pattern worth copying.

Specific findings:
- **DF POSITION tokens are data-defined government offices** — succession,
  ELECTED vs APPOINTED_BY, population gates, mandates — the closest shipped
  analogue to the mayor/ballot machinery. The catch: the *processes* are
  engine verbs; DF even ships dead vocabulary (COLLECT_TAXES, unused).
- **DF raws are copied into each save** — the one true precedent for
  culture-data living in the world file. Buys perfect isolation and
  mid-world surgery; costs an undocumented "which edits break a live save?"
  surface.
- **RimWorld's split** — instance choices in the save (players text-edit
  them!), vocabulary in defs, behavior atoms in engine, ideoligions
  exportable as shareable preset files — is the other proven shape.
- **Wesnoth is the cleanest two-tier answer**: declarative skeleton stays
  WML-data; imperative event bodies get real (scoped, sandboxed) Lua inside
  the data files.
- **Qud's runtime-compiled C# ships behind a player re-approval gate** —
  the shipped answer to "untrusted code arrived in content."
- Name-keyed defs + explicit merge/patch semantics age well; positional
  identity (Songs of Syx race counts) breaks saves.

## 7. CODE LIVING IN THE SAVE — WHAT SURVIVES CONTACT

From LambdaMOO/MUD softcode, Minecraft datapacks, Factorio, Screeps,
Smalltalk images, HyperCard stacks, Second Life, TIS-100:

1. **Separate code from mutable state even when both live in the file.** The
   healthy architectures keep a hard wall (Factorio: one serializable table,
   no closures; Screeps: code modules + a 2MB JSON Memory, IDs never live
   refs). The casualties fused them (Smalltalk images: accumulated
   corruption, unversionable; HyperCard: script-splicing viruses). **Culture
   code is source text in its own save section; culture state is a JSON
   subtree the engine owns; never closures-in-state.**
2. **Data-only behavior gets astonishingly far** — and if you under-design
   the language, one evolves anyway out of your command surface and it is
   baroque (Minecraft scoreboards-as-variables), becoming a compiler target
   instead of an authoring surface.
3. **Budgets must be architectural** — MOO ticks, Screeps CPU + bucket +
   kill-mid-execution — with defined semantics for "ran out mid-count."
4. **Determinism is a discipline imposed on guest code** (Factorio: state
   only in the serialized table, or desync). The single most load-bearing
   precedent for CS3's seeded suite.
5. **Migration is the hard half; plan it before v1.** Factorio ships per-mod
   ordered migration scripts; Minecraft abandons pack authors to format
   churn; DF froze raws in and left breakage formally unknown.
6. **Trust is identity + capability** — MOO's owner-permission verbs, quota,
   r/w/x bits: a complete small-world model whose failures were social.
7. **Code in documents means viruses in documents** — HyperCard's merryxmas
   is the exact threat model for shared cultureways.
8. **A tiny fixed VM with a textual program format buys the ecosystem** —
   TIS-100's save-is-the-program was reimplemented by third parties from the
   format alone; MOO DBs survive 30 years as text dumps.
9. **If the world's rules are editable in-world, governance of the rules
   becomes gameplay** — LambdaMOO's petition/ballot system, implemented in
   the softcode it governed. For a game whose subject is government, this is
   not a warning, it is a destination.

## 8. RUNTIME OPTIONS (for a no-build-step vanilla-JS browser game)

Full comparison table in the runtime research pass. The realistic shortlist:

| Bet | What it is | Cost |
|---|---|---|
| **Data + CEL-class expressions** (`@marcbachmann/cel-js` or json-logic-engine) | "A cultureway is a document, not a program." Terminating, zero ambient authority, save-native, tiny. | Not Turing-complete — new *mechanisms* (vs parameters) stay out of reach. |
| **Hardened JS (SES compartments)** + modern-JS hooks as source text | Production-proven ocap sandboxing in the same runtime (MetaMask, Agoric), one vendored file, LLMs author in their best language. | No mid-run serialization — forces the pure `step(state, event) → state'` architecture (which Ink/Factorio suggest is the better design anyway). |
| **JS-Interpreter** (Neil Fraser) | ES5 AST interpreter, `step()` = perfect fuel metering, and the unique headline: **paused programs serialize into JSON saves**. | ES5 dialect tax on LLM authors; ~200× interpreter speed; snapshot format version-locked, +300KB each. |
| **Roll-your-own VM** (Crafting Interpreters scale; JS-subset surface → owned serializable bytecode) | The only path to *both* resumable script state in saves *and* a stable format we own forever. Ink, TIS-100, Sprak are shipped precedents. | We become language maintainers (~1.5–3k lines); bespoke syntax would tank LLM authorship unless the surface stays a strict JS subset. |

Notables: quickjs-wasm is the determinism/sandbox champion but ~1MB of wasm
in a hand-rolled vanilla game; wasmoon Lua is the modding lingua franca with
the best metering hook but a thin maintenance story and no serialization;
expr-eval is disqualified (CVE-2026-12866, RCE by design).

**Convergence finding**: every option except JS-Interpreter/roll-your-own
pushes the same architecture — *program as data, pure per-tick functions,
all state in plain JSON* — and that architecture is independently what
Factorio's determinism discipline and CS3's own save contract ("personas
only; behavior state is derived") already demand.

## 9. DESIGN RULES FOR AGENT AUTHORSHIP (evidence-backed)

The full 13-rule list with citations lives in the authorability research
pass. The load-bearing ones:

1. **A layered tower: JSON data → expressions → scripts**, every feature at
   the lowest layer that can express it. RimWorld/K8s evidence says layers
   0+1 cover ~90% of variation; layer 2 stays rare.
2. **Never invent novel syntax.** LLMs collapse on unfamiliar languages
   (9–12% parse rates on a novel DSL vs **84.8%** via a familiar surface
   compiled to the target — SPEAC, arXiv:2406.03636). JSON validated by
   JSON Schema; any script layer is a JS subset. Starlark proves familiar
   syntax and narrow semantics are independent axes.
3. **The Crabocracy re-expressed in the format is simultaneously the
   reference implementation, the regression baseline, and the few-shot
   exemplar** in every authoring agent's prompt.
4. **Invariants live in the engine as API shape, never as lint.**
   Currency conservation means the capability bundle *has no mint verb for
   money* (per Ruling 2, goods ARE culture-mintable through declared
   production). A remit is a set of capability grants: the Crabocracy's
   government object reaches the shelter and the pot and nothing else, while
   a totalitarian cultureway holds sweeping grants (Ruling 3) — but a script
   reaching beyond its own declared grants is a type error, not a caught
   cheat.
5. **Determinism the Factorio way**: culture state is an engine-owned JSON
   subtree; scripts are stateless functions over (their subtree, the
   capability bundle, a seeded RNG handle). No Date, no ambient Math.random.
6. **Meter the tick** with a defined degrade path: budget exhausted → hook
   aborted, state rolled back, engine default runs. The sim never stops.
7. **The suite + headless matrix is the acceptance oracle**: schema check →
   static reference check → property checks over seeded runs (ledgers
   balance, elections terminate, matrix bands hold) → scenario suite.
   Failures return as minimal counterexamples (seed + tick + violated
   property) — the feedback form the repair literature says LLMs fix best.
8. **Constrain the emission, not the thinking** — agents design free-form,
   then emit schema-constrained components one at a time (an office, a
   ritual, a recipe), each individually validatable and repairable.
9. **Interface opacity stays a bug**: every rejection — schema, capability,
   budget, conservation — is a legible structured error. The same channel
   serves CS4's agents and human authors.

## 10. THE CONVERGENT SHAPE (proposal to react to, not a decision)

All nine passes point at one architecture:

```
save.cultures = {
  crab: {                      // the Crabocracy, transcribed — the exemplar
    art:       {...},          // §5: palettes, colorways, body+anchors, poses,
                               //     accessories, items, props
    world:     {...},          // §5: PLACE art — backdrop layers, terrain,
                               //     building templates, furniture, lighting.
                               //     Crabs: the island. Pigs: the mainland —
                               //     reserved now, rendered as vignettes/
                               //     horizon first, whole nodes later
    people:    {...},          // name pools, traits, persona factory params,
                               //     colorway count, visitor purse/stay profile
    foodways:  {...},          // §4: ingredients, recipes, venues' default
                               //     menus, communal dish, tastes, imports
    management:{...},          // wage/tip/shift/meal-policy norms
    voice:     {...},          // §3: diary lines, departure-quote rules,
                               //     dossier/status copy — keyed by event id
    civics:    {...},          // §2: institutions (state schemas), offices,
                               //     purses/policy step-tables, calendar +
                               //     phase processes, errand defs, props/
                               //     signage requests, card specs, invariants
  },
  pig: { ... }                 // partial: WAD-style fall-through to defaults
}
```

- Layer 0 (pure data) carries art, people, foodways, management, voice, and
  most of civics' vocabulary. Layer 1 (terminating expressions) carries the
  formulas: stakes, bills, eligibility, urgency ramps, taste weights. Layer
  2 (sandboxed JS-subset hooks, rare) carries genuinely novel process bodies.
- The engine grows the ~35%: errand registry, hook taxonomy (mid-transaction
  / world-event / settlement-aggregate / wallet-scan), policy-slot registry,
  placement registry, declarative card renderer, culture-aware save clamps,
  and the capability bundle with the three money doors.
- Migration discipline from day one: cultures are name-keyed, versioned,
  validated at import (fail with a message, never at first draw), with
  engine-format migrations Factorio-style.

**Sequencing** (settled by Ruling 6 — pigs first, Crabocracy capstone):
1. **Species substrate + pig tourists** — the `cultures` save key, species
   field on visitors, art/people/voice/tastes sections (all Layer 0), the
   four render sites + three clamps + `convertTourist` made culture-aware.
   Pigs get off the boat, are legible as pigs, complain as pigs.
2. **Foodways + cross-cultural dynamics** — recipes/menus to data; taste
   weights + acceptance + recipe knowledge (§4's five mechanics).
3. **Civics** — the capability APIs (errand registry, hooks, policy slots),
   Layer-1 expressions, and the Crabocracy re-expressed in the format with
   the suite green — the capstone proof, and CS4's exemplar. The
   Porkresentative Pigpublic's own government (they're visitors here; their
   civics run on the *mainland*) can stay hinted until pigs settle in
   numbers — or become the second civics exemplar if we want the proof.

## OPEN QUESTIONS (for Matt)

The four big ones are settled by the RULINGS above: the language bet
(tower, bottom-up), the constitution (currency physics / goods culture;
full governance spectrum), coercion (incentives + consequences only), the
trust model (assume hostile, no sharing UX yet), and 3.5's definition of
done (pigs first, Crabocracy capstone, game.js hard-codes neither).

Smaller ones parked for later:
- Does the town's own *lens* (UI chrome, help text, report cards) stay crab
  voice forever, or does the player's culture eventually own the chrome?
- Are hybrid dishes (CK3-style cherry-picking) 3.5 scope or CS4?
- Is a partial culture (art but no civics) shippable content or an invalid
  file? (WAD fall-through says shippable; validation strictness must pick.)
- When pigs settle: same houses? same shelter? whose soup?
- Does the merge minigame (merge.js) ever become culture content? (It's the
  existing plug-in precedent either way.)

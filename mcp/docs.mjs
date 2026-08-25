// THE CORPUS: what a caller can read, and the one page they should read
// first. Curated deliberately - game.js is sixteen thousand lines and
// dumping it would bury the twenty pages that actually explain the world.
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ROOT } from "./sim.mjs";

export const DOCS = [
  { uri: "crabshack://orientation", title: "START HERE — orientation",
    why: "what the game is, what a cultureway is, what the rulings forbid, and a worked path from nothing to a tested people" },
  { uri: "crabshack://plan", file: "PLAN.md", title: "PLAN.md — the project brain",
    why: "systems map, balance numbers, and every standing design ruling" },
  { uri: "crabshack://readme", file: "README.md", title: "README",
    why: "what the game is, in the repo's own words" },
  { uri: "crabshack://conventions", file: "CLAUDE.md", title: "Working conventions",
    why: "the sim contract, perf expectations, suite discipline" },
  { uri: "crabshack://cultureway/substrate", file: "design/cs35-cultureway-substrate.md",
    title: "The cultureway substrate", why: "the document schema, its phases, and the debt it absorbs" },
  { uri: "crabshack://cultureway/research", file: "design/cs35-cultureway-research.md",
    title: "Cultureway research + the five rulings", why: "why cultures are documents, and the hostile-file posture" },
  { uri: "crabshack://cultureway/schema", file: "design/cultureways/cultureway.schema.json",
    title: "cultureway.schema.json", why: "the machine-readable shape of a cultureway document" },
  { uri: "crabshack://cultureway/pigway", file: "design/cultureways/pigway.json",
    title: "pigway.json — a complete worked example", why: "a complete, valid worked example to copy — an illustration of the full format (richer than the shipped pig, to show the optional sections too), NOT the shipped document: the game generates its pig from tools/fixtures/cultures-pig.json" },
  { uri: "crabshack://cultureway/pig-spec", file: "design/cs35-spec-01-minimum-viable-pig.md",
    title: "Spec 01 — the minimum viable pig", why: "how the first foreign people was designed and what each part does" },
  { uri: "crabshack://numeric/core", file: "design/cs35-numeric-core.md",
    title: "The numeric core", why: "why the sim is exact integers, and why runs reproduce bit-for-bit" },
  { uri: "crabshack://numeric/kernel", file: "design/cs35-kernel-decision.md",
    title: "The kernel decision", why: "the WASM kernel, the measured ladder, and where the speed comes from" },
  { uri: "crabshack://numeric/branchless", file: "design/cs35-branchless-research.md",
    title: "The branchless study", why: "how coherent the town's behaviour is, measured" },
];

export function readDoc(uri) {
  if (uri === "crabshack://orientation") return ORIENTATION;
  const d = DOCS.find((x) => x.uri === uri);
  if (!d || !d.file) return null;
  const p = join(ROOT, d.file);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

// Substring search across the corpus, returning located excerpts. An agent
// with no filesystem needs SOME way to ask "where is the ruling about X".
export function searchDocs(query, { limit = 20 } = {}) {
  const q = String(query).toLowerCase();
  const hits = [];
  for (const d of DOCS) {
    const text = readDoc(d.uri);
    if (!text) continue;
    const lines = text.split("\n");
    for (let i = 0; i < lines.length && hits.length < limit; i++) {
      if (!lines[i].toLowerCase().includes(q)) continue;
      hits.push({ uri: d.uri, title: d.title, line: i + 1,
                  excerpt: lines.slice(Math.max(0, i - 2), i + 3).join("\n") });
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

export const ORIENTATION = `# CRAB SHACK — orientation for an agent

You are holding a science station for a small, deterministic town simulation.
Everything below is reachable through this server alone.

## The game, in a paragraph

CRAB SHACK 3.5 is a browser town-economy sim on a 256x240 pixel canvas. You
own a beach food shack on an island; crabs live, work, eat, get sick, get
bored, vote, buy each other's businesses, and go broke. Tourists arrive by
ferry with finite purses and go home again. The player's abilities are the
NPCs' abilities — an NPC owner runs their shop the way you run yours. The
long game is buying a ferry to the mainland.

## Why this sim is worth doing science on

The simulation is EXACT INTEGER end to end — money in cents, the clock in
20Hz ticks, needs and positions in fixed point, and one closed random
stream. A run is therefore a RECIPE, not a recording: the same seed and the
same parameters produce the same town, bit for bit, on any machine and in
any JavaScript engine. That is what makes sweeps, histograms and rare-event
hunts meaningful here rather than approximate.

## What a CULTUREWAY is

A people, written as a document. Not code — data the engine reads:

  meta      id and name. THE ID MUST MATCH /^[a-z][a-z0-9_]{0,15}$/ or the
            game skips your document SILENTLY, with no error anywhere.
  people    the name pool (each name <= 12 characters). people.traits is this
            people's personality table (E2): per-trait label, move20/work20/
            tip20 multipliers in integer TWENTIETHS (20 = 1.0, clamped 4-60),
            optional lateMin (0-240) and pauses, and quips for all three
            moments (commute/work/home). Key order is the hire draw order.
            Undeclared = your settlers carry the island's six traits.
  art       palette, body (w/h 4-32, four poses a/b/w/s as pixel rows),
            colorways (per-slot recolours), anchors, accessories, items.
            founders is a CRAB-DOCUMENT field, not a foreign-culture one: a
            map of founder key -> colorway id (e.g. { sudsy: "teal" }),
            resolved BY NAME so a founder's shell rides the id, never the
            colorway ORDER. A key naming a colorway that does not exist is
            refused "A FOUNDER WITH NO SHELL" at runtime and fails the BUILD
            ("crab-art.founders.<f>: names a colorway that does not exist").
            A foreign people declares no founders — that asymmetry is the
            design, not a gap; do not declare founders in a pig.
  voice     registers — a register is bound to an accessory, because THE HAT
            IS THE CLASS MARKER: what someone wears picks how they speak and
            how fat their purse is (purseMul, 0.1-5). The crab default's own
            voice is tabled the same way (bundled beside its brain), so every
            diary/depart/dossier key you can declare, the island also speaks.
            voice.idle holds the four idle moments — ball, chat, wander, nod —
            each a non-empty array of lines (1-120 chars) your people quip at
            play, gossip, a stroll, or waking from a nap; undeclared moments
            fall to the island's lines. Unknown moments are refused at import
            (A QUIP FOR NOWHERE).
            A register may also carry refuseHire (the spoken refusal of a job
            offer) and refuseHireLog (the diary line for the same moment).
            THE CRAB ITSELF IS A DOCUMENT (phase E6): its name pools and its
            seven shell colorways ride the bundle (crab-people/crab-art
            fixtures), literals in code only as the engine fallback — so the
            island's own identity is authored the same way yours is.
  depart    weights — ruleId -> integer 0-8, a QUARTERS multiplier on the
            engine's departure-card rule weights (4 = as the engine weighs
            it, 0 = this people never leads with that rule, 8 = twice as
            loud). Unknown rule ids are refused at import, loudly.
            rules — phase E3: the WHOLE rule table re-expressed as Layer-1
            straight-line programs, all-or-nothing (weights compare in one
            scaled space: each weight program computes 300 * purse * w).
            Ops: PUSHI LD ADD SUB MUL DIVI MULDIV MIN MAX CLAMP ABS NEG
            LT LE EQ AND OR NOT SEL (the only conditional; no jumps, no
            loops — program length is the fuel). LD reads the depart bundle
            by name: days nightsBed rough purse left buys serves tables
            meals drinks washes games rooms topPaid dues worstMin quits
            quitMin blocked(0none/1shut/2full/3broke) mistMin missed
            foreign de hunger thirst dirt bored tired(Q20)
            sandwhy(0none/1broke/2shut/3unmade/4full) topitem(0/1).
            line.select picks a template index (statically proven inside
            line.templates); templates speak through the slot engine
            ({WHY} {NIGHTS} {QUITS} {TABLES} {DUES} {PAID} {TOPBIZ} {LIST}
            plus the phase C slots). Every refusal is named; the engine's
            own lambdas remain the fallback for undeclared cultures.
  civics    phase E4: HOW THIS PEOPLE'S VOTERS SCORE A PLATFORM. platValue —
            the number an election ranks a policy by, for one voter — as
            civics.stakes, a list of stakes each with a name and a list of
            NAMED signed term-programs; the stake's value is their SUM, and
            the receipt reads off the largest-magnitude term. The engine owns
            the id space: the "platform" stake is REQUIRED (a section that
            omits it is refused — it would silently fall back to the engine
            lambda). Each term is a straight-line Layer-1 program (same ops as
            depart above) that CLOSES WITH TERM, the marker that it yields a
            named term rather than a bare expression. A term is SIGNED —
            negative bounds are FINE (floorBill and purseCost subtract),
            unlike a depart weight; only the 2^52 magnitude rail applies. LD
            reads the platform-value bundle by name: potStake20(0-20)
            pBowls(bowls the purse funds) roofWeight20(0-24) roof(0/1)
            fr(the wage floor's daily raise) fb(its bill on a payroll)
            capStake100(signed hundredths) purseCost100(hundredths)
            pTake(what the purse takes). The crab's own stakes ship bundled,
            byte-equal to the coefficient lambda; a culture that declares none
            leaves its voters on that same lambda. Every refusal is named
            (an unknown op, a typo'd LD name, a term that never closes with
            TERM, a program past 256 ops, a magnitude past 2^52, a missing
            platform stake). civics.ballots (slice 4a) declares the two
            TOWN-LEVEL dials a mayor sets: 'floor' (the wage floor, cents a
            day) and 'cap' (the house limit, employees a shop), each
            { id, name, short, unit, who, steps[] }. steps IS the ladder low
            to high, and a save stores the INDEX not the value — so steps[0]
            MUST be 0, the founding NO-POLICY (NO FLOOR / NO LIMIT, what every
            pre-feature save loads as). The ladder EXTENDS with higher rungs;
            it never deletes step 0 (deleting it would silently reinterpret
            every existing save's cap:0). Unlike stakes these are one-per-town,
            so the crab's own bundle adopts them in place and the engine ladder
            is the fallback. civics.purses (slice 4b) declares the four purses
            that fund the shelter as rate grids: 'levy' (a share of takings),
            'dues' ($ a visitor), 'rents' (a cut of the house rents), 'tin' (a
            voluntary collection), each { id, name, short, unit, who, steps[] }.
            steps is the rate grid and a save stores the INDEX (0..4), so
            steps[0] MUST be 0 (NO TAKE, the founding grid). Same in-place
            adoption as the dials; the levy's conflict-of-interest and the
            conservation math stay engine. civics.calendar (slice 4c) is the
            polling clock as scalars: pollWeekday (weekday index 0..6, 6=Sun),
            pollOpen/pollShut (minutes past midnight, default 420/1140, shut
            after open). civics.relief (slice 4c) is the shelter and soup as
            scalars: relief.soup { potMax (bowls a night, default 6 - also the
            stakes lcm denominator), margin (cents, default 200) }, relief.shelter
            { rent (cents, default 1000), float (nights carried, default 1),
            strikes (missed nights before the door bolts, default 3), shutNights
            (nights bolted, default 4) }. These sit on state/time paths, so a
            transcription is byte-equal AND wired; conservation and the strike
            mechanism stay engine. civics.eligibility (slice 4d) is the franchise
            (family 2: who may) as two 0/1 predicate programs over the persona
            bundle (npc/owner/homeless): vote (the crab's is [["PUSHI",1]], every
            resident votes) and stand (the crab's is [["LD","npc"]], only townsfolk
            self-nominate). Each is a bare Layer-1 program (the depart weight
            shape, NOT TERM-closed) whose static bound must be 0/1; per-voter, so
            it dispatches on culture like stakes. Both keys required. The player
            nomination, the visitor exclusion, and the count stay engine.
  appeal    THE ONE TABLE for what draws this people. appeal.tastes holds
            per-food multipliers, 0.1-5 (1.0 neutral, below 1 dislike, 0.1
            effectively taboo). appeal.nudge holds the drop-nudge terms in
            author units — radius px 8-128, minutes 5-1440, relax 0-0.5,
            mul100 100-300 — each defaulting to the crab values (72/60/
            0.12/130) when left out. Top-level "tastes" is gone and fails
            loudly.
  management  the culture's working norms, author units, each defaulting to
            the crab value when left out. tableTip: whole dollars a guest of
            this people leaves on the table (crab 9). counter20: the jar's
            token share of that tip at the counter, in twentieths (crab 3).
            shifts: the working day's shape in half-hour minutes — std the
            M/E standard day (crab 360), day the owner's open-to-close cap
            (crab 600), cover the covering double (crab 720). The town's
            standard WAGE is deliberately NOT declarable yet: a culture's
            customary wage arrives with the settlers slice, when someone
            exists to be paid it.
  settlers  may this people STAY? apron (boolean, default false): a visitor
            of this culture accepts a job offer and converts to a resident,
            keeping her name, face, hat and culture — she works shifts,
            draws wages and sleeps in town housing exactly as crab crew do;
            when false her register's refuseHire line stands. walkins
            (0-8 twentieths, default 0): this people's share of anonymous
            walk-ins and migrated-save seeding — 0 draws nothing and is
            byte-identical to today. Business ownership binds to a settler
            in a later slice.
  manner    how this people carries itself, each field defaulting to the
            crab value when left out. speed: a visitor's stroll in px/s
            (crab 42; the ferry ETA reads the same value, so a slow people
            is never promised a boat it cannot catch). stroll: how far one
            stroll wanders, px (crab 340; the promenade band is the town's).
            space: personal-space radius, px 4-16 (crab 8, on a measured
            growth curve — wider costs the town; a mixed pair parts to the
            larger). walkMul20: a settled resident's gait in twentieths
            (20 = crab pace, composes with traits). rides: REFUSED true
            until a culture-ride art seam exists; false = walks, as data.
  rhythm    when this people sleep and work, relative to the world's one sun
            (the sun never moves — a nocturnal culture moves its bodies).
            Integer game-minutes on the 30-minute grain: wake/bed (the
            awake arc may wrap midnight; the DERIVED arc must be 8-20h,
            checked after inheritance from the crab day — wake 450, bed
            1260), lieIn (a resident's day-off rise, crab 570), shiftStarts
            D/M/E (where clock-ins anchor for shops this culture's settlers
            OWN — ends derive as start + management.shifts span; bodies
            follow their culture, institutions follow their owner), hours
            (the default sign a declared business opens with; open < close,
            >= 4h, not before 6:00 — a sign across midnight waits on R3).
            Visitor bed/wake and the ferry-vs-nocturnal-guest rule are R3.
  arrival   repGate (how well-regarded the town must be before word reaches
            them), shareMax, shareRamp — and the STAY SHAPE: daytrip20
            (0-20 twentieths, crab 12 = 0.60; 0 = a culture of overnighters),
            patienceSecs (20-400, crab 100 — how long a guest gives a
            counter), thinkDs (4-80 tenths of a second, crab 16 — the
            what-do-I-fancy cadence, which is also brain-call cadence)
  body      THE CULTURAL BODY: multipliers in twentieths of the crab
            constants (20 = 1x exactly; converted once at install,
            round-half-up). rates {hunger thirst dirt bored tired} 10-40:
            how fast each need accrues — and the five together may not sum
            past 120, because inflating every need mints spend from a text
            file. wants {food drink clean fun} 10-30: how full a need must
            be before a guest acts on it. The need SET is the engine's five,
            always — an unknown key is refused. Resident tired costs ride
            the tired multiplier; recovery (bed, cot, nap, the sand's 3/2)
            stays the engine's: WHERE you sleep, not WHO you are.
  foodways  dishes in the BIZ recipe shape a kitchen here can LEARN (author
            whole dollars; the demand must be TAUGHT by a departure card
            before the manage card offers the lesson), items carrying their
            own 9-wide pixel art, and ingredients — YOUR OWN PRICED IMPORTS
            (1-50 author dollars per unit, max 16; the native pantry and
            another people's prices are never re-priced)
  businesses whole shops, declared: catalog SUBSTANCE only — name/short/sign,
            kind (palapa|shopfront), rent 1-500 $/day, optional wage 10-100,
            stations as TYPE -> capacity (1-4, max 6 kinds), stall/table
            COUNTS, source/out, and 1-8 recipes validated exactly like
            foodway dishes against the business's OWN stations. Never map
            coordinates (placement is the town's, phase D) and never an
            owner (ownership binds to a settler). A declared business is
            BUILT and PENDING — inspectable, not placed — until a plot
            exists; today it changes no town byte, by design.
  cards     declarative dossier cards (up to 4): title (<=18) plus rows of
            label (<=10) -> a REGISTERED observable name (the same versioned
            registry brains declare inputs from — need.thirst.q20,
            wallet.cents, ...). A card renders on the visitor dossier with
            live values; an unknown observable is refused by name.

PLACEMENT (phase D, engine capability): a pending business binds to an
engine PLOT via placeBusiness(culture, biz, plot, owner) — the engine names
its vacancies (one ships: "eastlot", the sand between the pier's foot and
the hotel), the owner must be a settled resident of the declaring culture,
station kinds must have engine art, and the shop opens at once on standard
hours with the owner behind her own counter. Placements are TOWN state:
they ride the save (rebuilt FROM the documents at load), and they die at a
session reset or a document change. The matrix floor never places — a shop
opens because somebody chose it.

Two peoples ship today: the crabs (the engine's own, not overridable) and
the pigs of the PORKRESENTATIVE PIGPUBLIC, who hold fish taboo, love a hot
soak, and speak in two registers — a strawhat farmhand with a light purse
and a bare-headed clerk with a heavy one.

## The rulings that constrain what you may design

These are standing design law in this project. Read
crabshack://cultureway/research and crabshack://plan for the full text.

1. INCENTIVES, NOT PUPPETEERING. A people's document biases what its members
   want. It never commands them. Someone who cannot afford a thing, is on
   shift, or holds it taboo must still be able to refuse — and the refusal
   should read as character.
2. RESOURCES ARE NEVER CONJURED. Money and goods move; they are not minted
   to make a story work. Conservation is checked exactly.
3. INTERFACE OPACITY IS A BUG, ECONOMIC UNCERTAINTY IS THE GAME. Never
   design a projected-income readout or a recommended-purchase advisor.
4. CURRENCY IS PHYSICS, GOODS ARE CULTURE. Cents are engine; what counts as
   food, and what it means to eat it, belongs to a people.
5. HOSTILE-FILE POSTURE. A document is untrusted input. Every number is
   clamped, every table capped. Your drafts are treated exactly this way by
   this server — see "what you can and cannot change" below.

## The worked path from nothing to a tested people

  1. read  crabshack://cultureway/pigway      (a complete, valid document to
                                               copy — an illustration of the
                                               format, not the shipped pig; the
                                               game generates its pig from
                                               tools/fixtures/cultures-pig.json)
     and  crabshack://cultureway/schema       (the shape, formally)
  2. draft your document as JSON
  3. cultureway_validate  — field-level errors with exact paths
  4. cultureway_render    — see every pose and colorway, and the hat worn
  5. cultureway_test      — install it in a real town and find out whether
                            they arrived, what they were carrying, and which
                            registers turned up
  6. cultureway_diff      — against the pigs, to see what you actually made
     different
  7. iterate from 3
  8. policy_distill       — optionally, compress a decision surface into a
                            small deterministic BRAIN: the sim's own script
                            labels the data, and you get back a policies-
                            section artifact (shadow mode) plus agreement
                            receipts; policy_verify re-checks any artifact.
                            The feature vector is yours to declare, per brain,
                            from the named-observable registry - and brains
                            never draw. The shipped crab and gull deciders
                            went through exactly this loop.

## Running experiments

  sim_run     one town, the full end-of-run report
  sim_sweep   many towns, a distribution (eviction histogram, lifetimes)
  sim_suite   the repo's own scenario suite, optionally filtered
  render_town a picture of an actual running town

SEEDS ARE RAW HERE. Everything this server takes and returns uses raw seed
numbers. (Internally tools/headless.mjs multiplies by 1337 and
tools/batch.mjs does not; this server converts so you never have to think
about it.)

A no-buy town typically dies around day 12 — that is the intended floor,
not a bug. Roughly a third of towns escape when the opening buys are
chef+table. Do not treat those numbers as targets to tune toward; they are
regression detectors.

## What you can and cannot change

CAN: your own draft documents, and the parameters of runs you ask for.
Documents you pass are size-capped, validated by the game's own validator,
installed through the same door a player's imported save uses, and thrown
away with the sim that ran them.

CANNOT: the repository, the bundled cultureways, any file on disk, or any
shell. This server exposes no write and no exec. Nothing you send here can
change what a player downloads.
`;

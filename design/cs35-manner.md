# CS3.5 — MOVEMENT MANNER + STAY SHAPE (census C4 + C5, designed as one slice)

Two small census items, one design, one slice. Both answer the same question
— *how does this people carry itself through a visit?* — both read at the
same dispatch moment (visitor spawn / think), both follow the appeal-table
pattern (author integers → buildCulture converts once → per-field crab
inheritance → undeclared cultures get the engine constant BY IDENTITY), and
they share one kernel rebuild. They should ship together. (Verdict repeated
in THE LADDER below.)

Census: design/cs35-hardcode-census.md C4/C5. Seams honored: the
personal-space close-out's radius note, the settlers close-out's walk pin.

## CHAPTER 1 — MOVEMENT MANNER

### Inventory (all cited, kernel status per item)

| constant | value | site | kernel status |
|---|---|---|---|
| VIS_SPEED | 42 px/s | game.js:11477; used at 11793 (ferry ETA), 12386 (JS stroll twin) | **HARDCODED in kernel.c:41 (`#define VIS_SPEED 42`), consumed inside `vis_step` (kernel.c:179–180)** |
| crab walk | 40 × trait | crabs region; steps via `step_to` | **already parametric** — `step_to` takes `speed` as an argument (kernel.c:161); callers compute it JS-side |
| VIS_ROAM | [700, 1900] | game.js:11516; clamps at 12557 | JS-only |
| VIS_STROLL | 340 px | game.js:11517; target pick at 12529 | JS-only |
| ride mode | "walk"/"buggy" | park math 9073/9082, draw 14583, ride draw 14866 | view/JS-only |
| VSEP_RXQ/RYQ | 8 px | game.js:11525 region | JS-over-shared-planes (personal-space close-out) — no kernel unit |

### The kernel verdict for speeds

Two cases, two answers:

1. **Crab/citizen movement needs NO kernel change.** `step_to` is already
   parametric — the caller passes speed. A per-culture walk multiplier
   composes in the JS caller exactly where the trait multiplier already
   does.
2. **Visitor stroll speed needs a ONE-ARGUMENT ABI change.** `vis_step`
   computes `spq` from the `#define`. Add `int32_t speed` as its fifth
   parameter (mirroring `step_to`'s shape), delete the `#define` use, have
   the JS caller pass the actor's culture-dispatched speed (and the JS twin
   at game.js:12386 read the same dispatched value). Passing the constant
   42 produces byte-identical arithmetic — the machinery commit is provably
   neutral, and the "kernel and the reference agree" scenario referees the
   rebuild (content-hash kernel-b64.js per tools/kernel/build.sh).
   A per-actor speed **plane** was considered and rejected: speed is
   per-culture (a handful of values), not per-actor state; an argument is
   the established idiom and costs no memory-map change.

**Trap named:** the ferry ETA at game.js:11793 divides by VIS_SPEED to
promise a boarding time. It MUST read the same per-culture speed as the
stepper, or a slow culture misses boats the sign said it could catch.

### Schema — `manner` (new top-level section)

```json
"manner": {
  "speed":    { "type": "integer", "minimum": 8,  "maximum": 120 },
  "stroll":   { "type": "integer", "minimum": 60, "maximum": 800 },
  "space":    { "type": "integer", "minimum": 4,  "maximum": 16 },
  "walkMul20":{ "type": "integer", "minimum": 10, "maximum": 40 },
  "rides":    { "type": "boolean" }
}
```

- **speed** — author px/s (VIS_SPEED's own unit; 42 = crab default). Applied
  where spq is computed; integer through `(speed * Q8 * dtT) / TICK_HZ`
  exactly as today.
- **stroll** — px, replaces VIS_STROLL for this culture's stroll pick.
  **VIS_ROAM stays engine**: the [700,1900] band is the promenade — the
  town's geography (census class B item 9), not a manner. A culture chooses
  how far it wanders, not where the town ends.
- **space** — personal-space radius, px. Mixed-culture pairs resolve with
  `max(r_i, r_j)` — the same rule `give_berth` already uses for per-body
  radii (kernel.c, `max64(ra, rb)`), so the precedent is in the engine.
  visSeparate is JS-over-planes, so this is pure JS dispatch. **Measurement
  note (the 8px lesson):** the crab radius sits on a MEASURED three-point
  growth curve (personal-space-closeout.md: 14/48 bare, 15/48 @8px, 9/48
  @10px). A culture declaring space > 8 is buying the same detour tax that
  cost 5 escapes in 48 — legal (declared culture content may move the
  economy) but the ceremony's matrix delta must be read with that curve in
  hand, and the clamp caps at 16px so no document can gridlock a counter.
- **walkMul20** — settled-resident walk multiplier in twentieths (20 =
  today), composing with the trait multiplier at the existing `step_to`
  call sites. Separate from `speed` because a visitor strolls and a worker
  commutes: one people, two gaits.
- **rides** — the settlers close-out's hardcoded walk pin becomes data.
  Default **false for any cultured people** (BUGGIES2 art indexes crab
  colorways — game.js:14583, and the ride draw already guards `!ccul` at
  14866); crab identity keeps true. A culture may not declare true until a
  culture-ride art seam exists — the validator refuses it with a named
  error ("NO RIDE ART FOR THIS PEOPLE") rather than drawing a pig in a
  crab buggy. This makes the pin visible and honest instead of silent.

Clamps as shown; cultureProblem named errors per house style; partial
declarations inherit crab values per-field (appeal pattern); undeclared
section ⇒ the engine constant OBJECT by identity.

## CHAPTER 2 — STAY SHAPE

### Inventory

| constant | value | site | notes |
|---|---|---|---|
| VIS_DAYTRIP | 0.60 | game.js:11548; rolled at 11596 | share of every boat but the last that goes home same-day |
| VIS_PATIENCE | 100 s | game.js:11484; spawn 11623, resets 12489 | ×PQ into Q12 patience |
| VIS_THINK | 1.6 s | game.js:11485; spawn 11628, re-thinks 12481/12510 | think cadence |
| purseMul | — | schema:255 | ALREADY cultural — the precedent this chapter completes |

BED_HOUR / WAKE_HOUR / ROOM_HOUR are **fenced out**: they are C1 (the daily
rhythm) and this slice does not touch them. An overnighter culture fills
more beds inside today's clock; it does not move the clock.

### Schema — grow the existing `arrival` section (schema:350, which already
carries repGate/shareMax/shareRamp — stay shape is the same subject: how
this people arrives and how long it stays)

```json
"arrival": {
  "repGate": …, "shareMax": …, "shareRamp": …,
  "daytrip20":   { "type": "integer", "minimum": 0,  "maximum": 20 },
  "patienceSecs":{ "type": "integer", "minimum": 20, "maximum": 400 },
  "thinkDs":     { "type": "integer", "minimum": 4,  "maximum": 80 }
}
```

- **daytrip20** — twentieths (crab default 12/20 = the 0.60). The roll at
  11596 already draws for every visitor, so a per-culture threshold changes
  no draw count — the zero-draw rule holds with nothing to prove beyond the
  pin. "A culture of overnighters" is `"daytrip20": 0` — the promised one
  number. (The last boat stays overnighters by construction, untouched.)
- **patienceSecs** — seconds (crab 100); ×PQ at the existing three sites.
  Demand-side lever like body rates: a 400s-patience culture will absorb
  service failures the economy currently charges for. Same rail question as
  C2 — **defer to the body-rates design's clamp rationale
  (design/cs35-body.md, running concurrently) rather than inventing a
  second doctrine here**; the clamp above is a placeholder ceiling to be
  reconciled with that doc's answer at implementation.
- **thinkDs** — deciseconds (crab 16 = 1.6s), integer authoring unit.
  `thinkT = srand() * VIS_THINK` scales the same draw — count unchanged.
  **Neuro note:** think cadence is also brain-call cadence — a fast-thinking
  culture multiplies its corpus, dream-surprise, and inference volume;
  the floor of the clamp (0.4s) exists mostly for the brains' sake.

## THE CEREMONY (shared)

- **Commit (a), machinery, byte-neutral:** schema + buildCulture conversion
  + dispatch accessors (`mannerOf(k)` / arrival reads, identity for
  undeclared) + the vis_step speed argument passing the old constant +
  kernel rebuild. Proofs: kernel-agreement scenario green; headless 4×10
  base-vs-branch byte-identical (cluster arms per KUBE POLICY); frozen
  fingerprint + rng pins untouched; mechanism scenario (conversion, per-field
  inheritance, crab identity, max-radius pairing); hostile rows (speed 10000
  refused by name, rides:true refused for art, daytrip20 21 refused);
  mutations that BITE both ways.
- **Commit (b), content, fingerprint-moving IF any bundled culture declares:**
  recommend shipping (a) alone and letting Matt rule which culture declares
  what (gulls as patient overnighters? pigs a shade slower?) — a declaration
  is a balance event and gets the full ceremony: first crossing named,
  triple-16 matrix vs base on the cluster, deltas reported not tuned.

## THE LADDER (and the combined-slice verdict: YES, one slice)

1. Machinery commit — both sections, one kernel rebuild, kube-gated.
2. Scenario/hostile/mutation commit — grows suite + MCP counts.
3. (Ruled separately) content declarations, full ceremony each.

One schema review, one rebuild, one dispatch idiom, one ceremony: two
census rows retired for barely more than the price of one.

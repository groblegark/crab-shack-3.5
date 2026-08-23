# THE BIZ CATALOG TO DATA (cultureway phase B, close-out)

**Substrate debt item 4: "The `BIZ` catalog is a code literal — foodways'
prerequisite. → phase B."** This slice makes the catalog's CULTURAL
substance declarable by a cultureway document, with the crab catalog
staying engine-native — and removes the one piece of culture content
that was living inside an engine literal (corn's import price).

## The reader inventory (written before any change)

`BIZ[` appears 283 times; `BIZ\b` 378. The literal (game.js:192–354,
five businesses) braids THREE different kinds of fact, and the readers
split the same way:

**1. Catalog substance** (definitional, cultural — THIS SLICE's format):
- `recipes` — 13 readers, ALL already behind the `bizRecipes(b)` seam
  the foodways slice built (visitor scorer, kernel marshal, staff
  meals, walk-ins, neuro observables, manage card).
- `rent` (19), `wage` (37, via `bizWage`), `kind` (20), `name`/`short`/
  `sign` (labels, ~90 biz-scoped), `lodging` (2), `sellable` (2),
  `mealPol` (9) / `sickPol` (16) / `tipShare` (7) — the frozen norms a
  sibling fork is moving to `management`; NOT touched here.
- station TYPE names (recipes' step[0] references) and counts.

**2. Town geometry** (the MAP, not the culture): `x0`/`x1` (~105),
`door` (10), `queueX` (10), `park`/`rack` (3+3), station COORDINATES,
`tables`/`stalls` coordinate rows (11+20). The substrate doc reserves
`world` (PLACE) and puts the placement registry in phase D — a
culture does not own where a town builds its shops. Geometry stays
engine data this slice, by design.

**3. Runtime state stored on the same objects** (mutable at play):
`owner` (67), `bought` (5), `hours` (22, player-movable signs),
`priceMul` (4), table/stall `occupant`/`dirty`/`cleaning`,
`autoLabor` (14). This is town state that happens to live on the
catalog object — separating it is a rewrite of 200+ sites for zero
authoring generality, refused. A DECLARED business gets these fields
stamped at build exactly the way the loader stamps the literal
(game.js:427 "one migration point: defaults = today's behavior").

**The consequence**: "catalog to data" must NOT mean threading a
dispatch function through 283 sites (the appeal slice's `nudgeCfg`
idiom worked because nudge had 4). It means the FORMAT — a
`businesses` section a culture can declare, validated and built into
entries of the exact runtime shape — plus the install machinery, with
placement as the honestly-named gap that keeps a declared business
PENDING (built, listed, inspectable) rather than placed. When phase D
lands plots, a pending business becomes a placed one and every one of
the 283 readers works on it unchanged, because it has the same shape.

## The shape

```json
"businesses": {
  "<bizId a-z0-9_, ≤12>": {
    "name": "≤18", "short": "≤6", "sign": "≤18",
    "kind": "palapa" | "shopfront",
    "rent":  1..500,          // author dollars/day; cents at build
    "wage":  10..100,         // author dollars; optional (WAGE_STD else)
    "lodging": bool?, "sellable": bool?,
    "stations": { "<name ≤10>": 1..4 },   // TYPE + capacity, ≤6 kinds
    "stalls": 0..8, "tables": 0..8,       // COUNTS - coordinates are the town's
    "source": "<station>", "out": "<station>",
    "recipes": [ /* BIZ-shaped rows, same validator as foodway dishes */ ]
  }
}
```

≤4 businesses per culture; ids may not shadow the engine catalog or
each other. Recipes go through the SAME row validator as foodway
dishes (`dishRowProblem`, extracted from `foodwayProblem` — one
validator, two callers), resolving stations against the business's OWN
declared map and pictures against the culture's `foodways.items` or
the native pantry. The invisible-cob rule holds: every raw, icon and
carried step item must have art, validator-refused otherwise.

**Position taken: a NEW section, not a foodways extension.** Foodways
declares dishes for kitchens that EXIST (`d.biz` names an engine
business); businesses declares kitchens themselves. Conflating them
would make "which stations table does this row resolve against"
ambiguous in the one place ambiguity is hostile — the validator.

**Inheritance semantics: all-or-nothing per business, defaulted per
field at BUILD.** A biz entry is a whole thing (half a shop is not
content); omitted OPERATING fields (`wage`, `hours`, `mealPol`…) take
the same defaults the engine stamps on its own literal at load —
i.e. inheritance from the engine's operating norms, not from any crab
business. Nudge-style per-field inheritance applied to `stations`
or `recipes` would let a document accidentally run a shop with the
crab's grill; refused.

## Ingredients: the hardcoded culture content, removed

`INGREDIENT_COST` (game.js:4879) carried `corn: 3` with the comment
"corn: every ear is shipped in (foodways)" — pig culture content
inside an engine literal, placed there because the foodways slice had
no way to declare a priced import. Now it does:

```json
"foodways": { "ingredients": { "corn": 3 }, ... }
```

- Author dollars 1..50 per unit, integers; ≤16 per culture.
- May not shadow the NATIVE pantry (`fish_raw`, `fruit`, `token`,
  `soap`, `linen`) nor an ingredient another installed culture already
  priced — first install wins, later shadow refused by name. A save's
  documents install after the bundled ones, so a hostile save cannot
  re-price anything bundled.
- Installed into `INGREDIENT_COST` at install (the `defItem` idiom);
  `loadCultures` clears non-native entries before reinstall, so an
  uninstalled culture's prices do not linger across loads.
- The pigway fixture now declares corn; the engine literal no longer
  knows the word. Byte-identity holds because install runs before any
  sim tick and writes the identical author-dollar value.

Dish validation accepts a raw priced by the culture's OWN pending
ingredients table (validated in the same pass, before install).

## What a full non-crab shop still needs (the honest gap list)

1. **A plot** — placement registry (phase D). A declared business is
   built and listed by `cultureBusinesses()`, inspectable over MCP,
   but PENDING: it is not in `BIZ`, not in `BIZ_KEYS`, has no door.
   The suite pins this (a declared business changes nothing).
2. **An owner persona** — settlers (phase B remainder / persona
   factory). `owner` is deliberately NOT author-settable: ownership
   binds to a settler when settlers exist. A pending business carries
   `owner: null` semantics ("nobody yet"), the FOR SALE shape.
3. **Management norms by reference** — the sibling management slice;
   a declared business should eventually name a norms profile rather
   than restate one.
4. **World art** — `world` section (reserved): a `kind` beyond the two
   engine building templates needs building art before the renderer
   can draw a declared shop.

## Receipts

(filled at gate time)

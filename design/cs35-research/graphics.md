# GRAPHICS AS SAVE-RESIDENT DATA — research findings

## 1. CODEBASE: how CS3 renders (read-only survey)

### The "PPU" is NOT tile-constrained
`/Users/matthewbaker/crab-shack-3/ppu.js` (121 lines, read fully): despite the NES/SNES framing, there are **no pattern tables, no 8x8 cells, no palette registers, no sprites-per-scanline limit**. The real model:
- 256x240 framebuffer (256x288 on portrait phones via `window.SCREEN_H`).
- `parseArt(rows, palette)` is the **single decoder for all art in the game**: `rows` = array of equal-length strings, one char per pixel, `'.'` = transparent; `palette` = `{char: [r,g,b]}`. Throws on ragged rows or missing palette chars. Output: offscreen canvas + pre-baked horizontal mirror (`{cv, fv, w, h}`); blits via `drawImage`.
- Only hardware-flavored constraint: `q15()` crushes every color to 5 bits/channel (SNES 15-bit look). Applied at parse time — any RGB in data gets quantized automatically.
- `tintArt()` (flat recolor for shadows/ghosts), `scale2()` in game.js (2x nearest-neighbor for houses/bus/buggies/portraits).
- Fonts are separate: `font.js` `FONT` (5x7) / `FONT_SMALL` (3x5) — same idea, strings of `"0"/"1"` per glyph, keyed by char, **fallback to `"?"` for unknown glyphs** (PLAN.md line 2851 records a real bug where six chars all rendered as `?`).
- Headless matters: `tools/simlib.mjs` stubs `createElement/createImageData/getContext`, so `parseArt` already runs in the Node sim. Save-resident art parsed through the same path costs nothing new headlessly.

### sprites.js IS already a JSON-shaped data table — with a thin function crust
`/Users/matthewbaker/crab-shack-3/sprites.js` (1197 lines): one global `PAL` (26 named chars: K outline, R/T body+shade, etc.), then ~70 sprites, each literally `parseArt([strings], PAL)` or `swap(PAL, {overrides})`. The strings ARE the art; serializing to JSON is a copy-paste, not a port. The non-data residue is small and enumerable:
- `swap(pal, from)` — palette-override merge (pure data op).
- **Parametrized families**: `crabArt(body, shade)` = swap R/T then parse 4 poses (`a`/`b` walk-alternate, `w` claw-raised work, `s` sleep) from shared `_CRAB_TOP` (16 wide x 9 rows) + 3-row leg variants; `touristArt(style)` swaps H (hair) + T (shirt); `houseArt(roofCol)`, `boatArt(col)`, `buggyArt(col)` swap R. These are "template + palette-slot" — expressible as data (`{template, slots:{R:..., T:...}}`).
- `CRAB_COLORS`: 6 `[body, shade]` pairs + SUDSY's exclusive teal pushed as index 6. `persona.color` and `visitor.c` are **indices into this table** — the save stores an index, never RGB.
- `ACCESSORIES`: keyed table `{dx, dy, art}` — toque, cap, bow, shades, flower, tophat, showercap, none. Offsets are hand-tuned to the 16-wide crab head (see the tophat's 20-line geometry comment: brim must pass between eyestalk columns 2-3 and 12-13, dy -6 aligns brims so hats don't bob when swapped).
- `ITEMS`: `defItem(name, rows)` — canonical **9x7** food/prop icons (fish_raw/cut/hot, taco, fruit, juice, soap, linen, plush...). Carried items are drawn by name: `wblit(ITEMS[c.carrying], ...)` — so a foodway's icon set is already a string-keyed dict.
- 2-frame animation is a convention, not a system: `FLAME`, `JUICER`, `GULL`, `OT_MARK`, `STINK_MARK`, `TAP_FLOW`, `FERRY_ART` are all `[frameA, frameB]` arrays indexed by `((time*k)|0)%2`.

### How a creature actually draws (game.js)
- `CRAB_ARTS = CRAB_COLORS.map(c => crabArt(c[0], c[1]))` at line 5100 — **all art parsed once at module load**; nothing is parsed at save-load time today.
- `drawCrab(c)` (11905-11983): picks pose from live state (sleeping->`s`, working->`w`/`a` alternating, moving->`a`/`b` at `((animT*8)|0)%2`, idle->`a`); `y = c.y - 12` (**hard-coded body height 12**); hat blit at `c.x + (flip ? 16 - acc.dx - acc.art.w : acc.dx)` (**hard-coded body width 16**); DIRT overlay is a 16x12 sheet-registered mask; stink mark at +12,-7; OT coffee cup at +5,-18; carried item at +4,-7; work progress bar exactly 16 wide; quip bubble in 5x7 font. **Every anchor constant assumes the 16x12 crab.**
- **Visitors are crabs already**: `drawCustomer` uses `CRAB_ARTS[k.color]` + `ACCESSORIES[k.acc]`. The humanoid `_TOURIST` sprite (12x19, hair/shirt palette slots) and `TOURIST_ARTS` are **dead code** — defined at 5101, never blitted. The old "visitors look like a different species" path existed and was retired; pigs would revive it. Visitor spawn (`~9273`): `color: (Math.random()*CRAB_COLORS.length)|0`, `acc: random ACC_KEYS` — species is implicit, not a field.
- Secondary body-render sites that also assume crab: bus riders drawn as 2px eye dots + a `CRAB_COLORS[color][0]` stripe (11890-11895); dossier portrait at 2x via `art2("c"+k.color, CRAB_ARTS[k.color].a)` + accessory at `dx*2, dy*2` (13205ish) with string cache keys; merge-mode draw at 12698; buggy riders replaced entirely by `BUGGIES2[color]`.
- Missing-key behavior: unknown accessory key -> `ACCESSORIES[k]` undefined -> silently skipped (safe). Out-of-range color index -> `CRAB_ARTS[color]` undefined -> **crash in drawCrab** (unsafe; save-resident species data needs index guards).

### The save file today
`save()` (6205-6322): plain JSON envelope in localStorage slots, exported byte-identical as a downloaded `.json`, imported via parse+validate+migrate (`importJson` runs the same `load()` migrations, so hand-made/older files are first-class — **the import path is already an authoring API**). Graphics content in the save today: **zero**. Only references: `personas: [{name, trait, mode, acc, color, ...}]`, `visitors: [{c: colorIndex, a: accKey, ...}]`. `crabs.js` confirms the persona is a flat record of key-references (`acc` in `ACC_KEYS`, `color` index, trait key, mode key); founders hard-coded.

### Answer: what must a save CONTAIN for a pig to render
Minimum viable, engine-shaped:
1. **A body template**: rows-of-strings, any WxH (no cell grid to obey), with 2+ named palette slots (body/shade) — but non-16x12 bodies break the hard-coded anchors, so the template must carry **metadata the constants currently encode**: `w`, `h` (for `y = c.y - h` and flip math), hat anchor row/eyestalk gap, carry point, mark points, progress-bar width.
2. **Four named poses** (`a`, `b`, `w`, `s`) to plug into the existing pose state machine unchanged — pigs walking on two legs still need an a/b alternation, a "working" pose, a sleep pose. (2-frame everything is the house style.)
3. **A color table**: N `[body, shade]` pairs (the pig equivalent of `CRAB_COLORS`) — save-resident so `color` indices resolve inside the culture, not against the global table.
4. **Accessory dict** with per-accessory `{dx, dy, rows}` — anchors relative to THIS body's head, since the crab's dx/dy are meaningless on a taller pig.
5. **Item icons** (9x7 by convention) for anything a pig carries — cross-cultural foodways literally mean crab servers carrying pig dishes, so items must live in a shared namespace (`pig.char_siu_bun` etc.).
6. Optional per-species overlays: DIRT-equivalent smudge mask registered to the body sheet, portrait pose (reuse `a`).

**Is sprites.js already serializable as-is? Effectively yes**: ~90% of the file is `parseArt(literalRows, PAL-or-swap)` — direct JSON (`{pal: {...}, sprites: {name: {rows | frames, pal?: overrides}}}`). The 10% that isn't: the color-parametrized factory functions (become `slots` declarations), the ACCESSORIES offsets (already data), and the load-order side effects (`CRAB_COLORS.push(teal)`, `ACCESSORIES.showercap = ...` — the showers "expansion" already patches the art tables at runtime, which is exactly the culture-as-patch mechanism, just done in JS instead of data).

## 2. WEB: precedents for art living in the world file

| Precedent | Format | What aged well / badly | Relevance to CS3 |
|---|---|---|---|
| **PICO-8 .p8 cart** | Single text file: `__lua__` code, `__gfx__` spritesheet, `__map__`, `__sfx__`, `__music__`; non-code sections are hex characters, one digit per pixel = index into the fixed 16-color palette; empty/default sections omitted ([P8FileFormat wiki](https://pico-8.fandom.com/wiki/P8FileFormat)) | The closest thing to "the file IS the whole culture." Text format is diffable, source-controllable, hand-editable, and *LLM-editable* — this is why PICO-8 carts show up constantly in LLM-generates-a-game demos. The `.p8.png` variant steganographically hides the whole cart in a shareable screenshot ([P8PNGFileFormat](https://pico-8.fandom.com/wiki/P8PNGFileFormat)) — "the artifact is the distribution." Hard caps (128x128 sheet, 16 colors, token limit) are credited by the community as creative fuel, not friction. | CS3's char-map rows are *better* than hex-digit rows for LLM authoring (palette chars are mnemonic: K=outline, R=body). Adopt the cart's virtues: one file, sections, defaults omitted, hard budgets stated in the format. |
| **Doom WAD** | Binary archive of named "lumps"; IWAD (base) + PWADs (patches); a PWAD contains ONLY changed lumps, engine falls back to IWAD for the rest ([doomwiki WAD](https://doomwiki.org/wiki/WAD), [Doom modding](https://en.wikipedia.org/wiki/Doom_modding)) | Deliberately designed for modding after Wolfenstein hacking was observed; content/engine separation + named-lump fallback is why it thrives 30+ years on. The lesson is the **override chain**: culture file supplies lumps; anything missing falls back to the built-in "IWAD" (crab defaults). | Pig culture as PWAD: `cultures.pig.sprites` overrides/extends; missing keys fall through to crab-culture defaults or engine defaults. Never require a complete art set to boot. |
| **NES CHR-ROM** | 8x8 tiles, 2bpp (pixel = 2-bit index into a 4-color sub-palette); cartridge banks swapped wholesale at runtime (CNROM swaps all 8KB at once); CHR-RAM variant = graphics uploaded from data at runtime ([NESdev CHR ROM vs RAM](https://www.nesdev.org/wiki/CHR_ROM_vs_CHR_RAM)) | Bank-switching is the mental model for "which culture's tiles are hot right now" — but CS3's PPU has no banks and needs none. The CHR-RAM lesson: graphics-as-uploadable-data was the *flexible* path even on 1985 hardware. | Cultures = banks conceptually (per-entity, not per-frame). No need to impose tile granularity CS3 never had. |
| **Dwarf Fortress graphics packs** | `raw/graphics/graphics_X.txt`: header `[OBJECT:GRAPHICS]`, `[TILE_PAGE:...]` pointing at a PNG grid, then `[CREATURE_GRAPHICS:HUMAN]` -> `[SWORDSMAN:PAGE:col:row:AS_IS:DEFAULT]` per profession ([DF wiki Graphic set](https://dwarffortresswiki.org/index.php/DF2014:Graphic_set)) | The text raws aged superbly (the entire DF modding culture is "edit the raws"); the split between *text index* and *binary sheet* is the friction point — two files that can desync. Profession-keyed creature graphics = exactly CS3's pose/hat/job dimension. | Keep index and pixels in ONE text structure (CS3's rows-as-strings already does this). Key art by role/state (`chef`, `fisher`, `mayor`) the way DF keys by profession. |
| **Stardew Content Patcher** | Content pack = `manifest.json` + `content.json` of declarative patches (`Load`, `EditImage` with source rectangles) over named game assets; no code ([CP docs](https://github.com/Pathoschild/StardewMods/blob/develop/ContentPatcher/docs/README.md), [SDV wiki](https://stardewvalleywiki.com/Modding:Content_Patcher)) | Declarative-patch JSON became the dominant format precisely because non-programmers (and now LLMs) can write it; conditional patches (season, weather) = "context-sensitive art" precedent. Weakness: patches target pixel rectangles in sheets they don't contain — fragile across game updates. | The cultureway file should patch by NAME (`sprites.ferry`), never by coordinates. |
| **RimWorld** | PNGs under `Textures/` + XML defs with `<texPath>`; naming conventions (`_north/_south/_east`, auto-mirror west; `_a/_b/_c` stack sizes) ([RW wiki Textures](https://rimworldwiki.com/wiki/Modding_Tutorials/Textures)) | Convention-over-configuration for facing/variants aged well; CS3's pre-baked mirror = RimWorld's auto-mirrored west facing. | Encode conventions (`a/b` = walk pair, `s` = sleep) in the schema so authors supply minimum frames and the engine derives the rest (flip, tint, 2x). |

## 3. Can LLM agents author this art? (evidence)

- **Raw pixel grids are the hard mode, but at CS3's sizes it's the *feasible* hard mode.** [Pixel Art Bench](https://huggingface.co/blog/AINovice2005/pixel-art-bench) evaluates LLMs emitting fixed 24x24 grids with palette indices 0-9 — i.e., almost exactly CS3's format — and treats it as a real, scoreable structured-generation task. [pixel-llm](https://github.com/mxmarchal/pixel-llm) found a 3B local model "struggles to consistently produce valid pixel art grids in the expected format" while a frontier API model produced "decent results" — competence is frontier-model-and-up, and *validity* (ragged rows, unknown palette chars) is the main failure mode. CS3's `parseArt` already throws on exactly those two errors — **the engine's validator is the authoring linter**, and the suite/headless harness can smoke-test a culture file (parse all art, bounds-check anchors) without a browser.
- Pipelines that beat raw grids: structured drawing commands rasterized server-side ([Asset Forge](https://matthewdeaves.github.io/assetforge/)), and generate-critique-revise loops with an image-capable critic ([KokuTech sprite pipeline](https://www.kokutech.com/blog/insights/technology-experiments/sprite-pipeline-with-llm-critics)); packaged Claude skills exist for exactly "16x16/32x32, indexed palette, sprite sheet layout" ([pixel-art skill](https://mcpmarket.com/tools/skills/pixel-art-generator)). Implication: the cultureway format should stay a text grid (it's the *storage* format), and agent tooling can layer command-DSLs or render-and-look critique loops on top — CS3 can render any candidate to PNG headlessly for a vision-model critique pass.
- CS3-specific advantages for LLM authors vs. the benchmarks: mnemonic palette chars instead of digits; tiny canvases (16x12 body, 9x7 items, 8x4 hats — smaller than the 24x24 benchmark); an existing corpus of ~70 exemplar sprites *in the same file* as few-shot context; and hand-written geometry comments (the tophat essay) that read as a style guide. The tophat comment is the model for what per-sprite authoring notes should look like *in the data file*.

## 4. PAYOFF — what a cultureway's ART section looks like (concrete sketch for THIS engine)

```jsonc
// inside the save envelope: cultures: { crab: {...}, pig: {...} }
"pig": {
  "art": {
    "palette": {                       // culture's named colors; q15-crushed at parse
      "K": [30,20,36], "S": [255,205,170], "H": [90,60,40], ...
    },
    "colorways": [                     // replaces CRAB_COLORS for this species;
      { "P": [255,180,190], "Q": [200,120,140] },   // persona.color indexes THIS
      { "P": [230,160,120], "Q": [180,110,80] }
    ],
    "body": {
      "w": 14, "h": 16,                // drawCrab's hard-coded 16/12 become data
      "slots": ["P","Q"],              // palette chars colorways swap (crab's R/T)
      "anchors": {                     // everything drawCrab currently hard-codes
        "hat":   { "x": 3, "y": 0 },   // + per-acc dx/dy are relative to this
        "carry": { "x": 4, "y": -7 },
        "mark":  { "x": 11, "y": -7 }, // stink/sick bubbles
        "bar":   { "w": 14 }           // work progress bar width
      },
      "poses": {                       // the a/b/w/s contract, verbatim
        "a": ["..KK..KK......", "...rows...", ...],
        "b": [...], "w": [...], "s": [...]
      },
      "overlays": { "dirt": [...] }    // sheet-registered smudge mask
    },
    "accessories": {                   // pig hats; dx/dy vs THIS body's hat anchor
      "strawhat": { "dx": 2, "dy": -4, "rows": [...], "pal": {"R":[240,220,140]} }
    },
    "items": {                         // 9x7 foodway icons, shared namespace
      "bao":     { "rows": [...] },
      "char_siu":{ "rows": [...] }
    },
    "props": {                         // stations/scenery, 1-2 frame arrays
      "steamer": { "frames": [[...],[...]] }
    }
  }
}
```
Engine-side implications (small, localized): `parseArt` consumes this unchanged; `crabArt`-style factories generalize to "template + slots + colorway"; `drawCrab`/`drawCustomer` read `body.w/h/anchors` instead of literals 16/12/+4/-7; persona/visitor records gain a `species`/`culture` key (today species is implicit); missing sections fall through WAD-style to crab defaults; `art2` cache keys must include culture id. Migration is mechanical: today's sprites.js *is* the crab culture's `art` section, transcribed.

## 5. Hazards
1. **Anchor coupling**: at least 5 call sites hard-code the 16x12 crab (drawCrab y-offset, flip math, DIRT registration, bus-rider pixels, dossier 2x portrait, merge-mode). A pig of any other size renders wrong everywhere until anchors are data. The flip formula `16 - dx - art.w` is the sneakiest.
2. **Color-index aliasing**: `persona.color` indexes a global table that sprites.js *mutates at load* (teal push -> index 6 is SUDSY-exclusive by convention only). Per-culture colorways must scope indices or a pig save loaded against crab tables crashes (`CRAB_ARTS[undefined]`).
3. **Fonts are NOT save-resident and shouldn't rush to be**: quips, names, dossiers all go through 5x7/3x5 `FONT` with `?` fallback; a pig culture wanting its own glyphs/diacritics needs font-table extension, and PLAN.md already logged a real all-`?` regression. Treat script as a later, separate cultureway section with the same rows-of-bits format.
4. **Palette is a soft budget, not enforced**: q15 quantizes but nothing caps palette size or enforces the outline-char (`K`) convention that makes the art read as one game. The schema should declare the shared base palette and lint "new chars introduced" per culture, or cultures will drift off-style invisibly.
5. **Parse-time cost and failure locus moves**: today all art parses at boot from trusted source; save-resident art parses at *load/import* from untrusted files. `parseArt` throws — a bad row currently would brick the load. Import validation (`saveProblem`) must grow art checks (rect-ness, palette closure, pose completeness, anchor bounds) so a hand-made/LLM-made file fails at import with a message, not at first draw. The suite + simlib stubs make this testable headlessly.
6. **Animation contract is implicit**: 2-frame `%2` timing is scattered through draw code. If pigs ship 3-frame walks, either the schema forbids it (PICO-8-style hard budget — recommended) or frame-count becomes data at every `((animT*k)|0)%2` site.
7. **Save size is a non-issue**: whole current sprites.js ~40KB as JSON; owner has pre-accepted "the file may be big." Real limit is localStorage (~5MB/origin), relevant only if cultures multiply into dozens.

Sources: [P8FileFormat](https://pico-8.fandom.com/wiki/P8FileFormat), [P8PNGFileFormat](https://pico-8.fandom.com/wiki/P8PNGFileFormat), [PICO-8 manual](https://www.lexaloffle.com/dl/docs/pico-8_manual.html), [doomwiki.org WAD](https://doomwiki.org/wiki/WAD), [Doom modding (Wikipedia)](https://en.wikipedia.org/wiki/Doom_modding), [How WAD Works](https://coleton.io/posts/wad/), [NESdev CHR ROM vs CHR RAM](https://www.nesdev.org/wiki/CHR_ROM_vs_CHR_RAM), [DF Graphic set](https://dwarffortresswiki.org/index.php/DF2014:Graphic_set), [DF Tilesets](https://dwarffortresswiki.org/index.php/Tilesets), [Content Patcher docs](https://github.com/Pathoschild/StardewMods/blob/develop/ContentPatcher/docs/README.md), [SDV Content Patcher wiki](https://stardewvalleywiki.com/Modding:Content_Patcher), [RimWorld Textures](https://rimworldwiki.com/wiki/Modding_Tutorials/Textures), [Pixel Art Bench](https://huggingface.co/blog/AINovice2005/pixel-art-bench), [pixel-llm](https://github.com/mxmarchal/pixel-llm), [KokuTech LLM sprite pipeline](https://www.kokutech.com/blog/insights/technology-experiments/sprite-pipeline-with-llm-critics), [Asset Forge](https://matthewdeaves.github.io/assetforge/), [pixel-art-generator skill](https://mcpmarket.com/tools/skills/pixel-art-generator).

Key files: `/Users/matthewbaker/crab-shack-3/ppu.js` (parseArt decoder), `/Users/matthewbaker/crab-shack-3/sprites.js` (the de-facto art database), `/Users/matthewbaker/crab-shack-3/crabs.js` (persona = key-references), `/Users/matthewbaker/crab-shack-3/game.js` lines 5100-5121 (art table construction), 11903-11983 (drawCrab + hard-coded anchors), 11988-12009 (drawCustomer: visitors are crabs), 6205-6322 (save envelope), 6704-6755 (export/import = authoring API), `/Users/matthewbaker/crab-shack-3/font.js` (5x7/3x5 glyph tables), `/Users/matthewbaker/crab-shack-3/tools/simlib.mjs` (headless canvas stubs).
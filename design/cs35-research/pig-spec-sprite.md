All checks pass. Final deliverable follows.

## DRAFT PIG SPRITE ART — cultures.pig.art (first pass, structurally validated)

House-style facts honored (verified against `~/crab-shack-3.5/sprites.js` @ e53df9d): K outline on every side silhouette edge, top edges may expose body color (crab shell r4, toque r0, cap brim — precedent lines 38-48, 336-346); 2-tone body via slot pair (crab R/T → pig P/Q); template+slots idiom of `crabArt` (lines 80-88); accessory `{dx,dy,art}` blitted at body origin with flip formula `w - dx - art.w` (game.js 11805); items 9x7 (line 130); tourist 12x19 humanoid (lines 100-120) used as the biped reference — pig faces left like the tourist, single-pixel B eyes, all-K foot-contact bottom row.

### JSON-ready art block

```jsonc
"pig": { "art": {
  "palette": {                       // q15-crushed at parse like everything else
    "K": [30,20,36],                 // outline (identical to base PAL.K — keeps species on-style)
    "P": [255,181,197],              // body — colorway slot
    "Q": [214,121,140],              // shade/snout/hooves — colorway slot
    "B": [30,20,36],                 // pupil + nostril dots
    "Y": [255,230,120],              // straw (hat)
    "A": [255,216,96],               // amber band (hat)
    "L": [250,250,255]               // bun white (items)
  },
  "colorways": [                     // persona.color indexes THIS, not CRAB_COLORS
    { "P": [255,181,197], "Q": [206,116,140] },   // classic pink (shade ~0.75x, matches CRAB_COLORS contrast)
    { "P": [230,160,120], "Q": [172,106,80]  }    // tan hog
  ],
  "body": {
    "w": 12, "h": 16, "slots": ["P","Q"],
    "anchors": {
      "hat":   { "x": 1, "y": 2 },   // top-left of head dome (head spans cols 1-10); acc dy = -(accH-1) lands its brim ON this row — pig analogue of the tophat rule "brim at the toque's brim row so hats don't bob"
      "carry": { "x": 2, "y": -7 },  // 9x7 item floats rows -7..-1, fully above the ears — same idiom as crab's +4,-7; x=2 gives the same 1px-right-of-center bias (item center 6.5 vs body 5.5) the crab has
      "mark":  { "x": 9, "y": -6 },  // stink/sick/Z off the upper-right of the head; crab uses x = w-4 (12 on 16); w-3 here because the pig head reaches the box edge and the mark needs a px of air over the ear
      "bar":   { "w": 12 }           // progress bar = body width exactly, as the crab's 16 is; fill inset 1px/side -> 10 inner
    },
    "poses": { "a": [...], "b": [...], "w": [...], "s": [...] }   // rows below
  },
  "accessories": {
    "strawhat": { "dx": 0, "dy": -3, "rows": [...] }  // vs hat anchor -> abs cols 1-10 (exact head width), abs rows -1..2; crown pokes 1px above the box (crab hats live entirely above theirs; wblit clips fine)
  },
  "items": { "bao": { "rows": [...] } }
} }
```

### Pose rows (these ARE the pixels; `.`=transparent, K outline, P body, Q shade, B pupil/nostril)

Pose **a** (12x16, walk frame 1 / idle — legs together):
```
..KK....KK..    ear tips
.KPPKKKKPPK.    ears + head-top outline bridge
.KPPPPPPPPK.
.KPBPPPBPPK.    eyes (single B px, tourist-style, left-facing bias)
.KPQQQQQQPK.    snout top (Q = shade slot -> recolors per colorway)
.KPQBQQBQPK.    nostrils
.KPPQQQQPPK.    snout taper
..KPPPPPPK..    chin
..KKKKKKKK..    head/body separator (tourist r8 idiom)
.KPPPPPPPPK.    shoulders
KPKPQQQQPKPK    arms down (P upper) + Q belly patch
KQKPQQQQPKQK    forearms/trotters Q
.KPPPPPPPPK.    hips
..KPPKKPPK..    legs together
..KQQKKQQK..    hooves Q
..KKKKKKKK..    ground-contact outline (tourist bottom-row idiom)
```
Pose **b** (walk frame 2 — rows 0-12 identical, legs spread):
```
.KPPK..KPPK.
.KQQK..KQQK.
.KKKK..KKKK.
```
Pose **w** (working — arms raised to head height; alternates with `a` at `(animT*6)%2` + the existing -1 bob; rows 0-6 and 12-15 identical to `a`, rows 7-11):
```
KQKPPPPPPKQK    raised trotters (Q hands up, inverting a's P-over-Q arm)
KPKKKKKKKKPK    separator row, arms continue
KPKPPPPPPKPK    shoulders, arms at cols 1/10
.KPPQQQQPPK.    body, no side arms
.KPPQQQQPPK.
```
Pose **s** (sleeping — bottom-anchored in the SAME 12x16 box, 6 blank rows then a 12x10 slumped loaf; wider than tall like the crab's; zero draw-code changes since `y = c.y - h` still grounds it):
```
............    x6
..KK....KK..
.KPPKKKKPPK.
.KPPPPPPPPK.
.KPKKPKKPPK.    eyes closed: 2px K dashes at the eye positions (crab lid idiom)
.KPQQQQQQPK.
.KPQBQQBQPK.
.KPPQQQQPPK.
KPPPPPPPPPPK    body slumps full-width (12)
KPQQPPPPQQPK    legs splayed flat, Q trotter tips
.KKKKKKKKKK.
```
Accessory **strawhat** (10x4, dx 0 dy -3 vs hat anchor):
```
..KYYYYK..      crown (top edge bare Y — toque/cap precedent)
..KAAAAK..      amber band: the one bright row a tiny silhouette needs (tophat comment's rule)
KYYYYYYYYK      brim, full head width
KKKKKKKKKK      all-K bottom row (toque idiom)
```
Item **bao** (9x7):
```
.........
...KKK...
..KLKLK..       pleat crimps
.KLLPLLK.       pink bakery dot (P resolves to default palette P — items are never colorway-swapped, matching defItem/PAL)
.KLLLLLK.
.KLLLLLK.
..KKKKK..
```

### Validator (script at `/private/tmp/claude-501/-Users-matthewbaker/7acebd22-01d4-4779-a887-dac1e934e598/scratchpad/pig-validate.mjs`, embeds the exact rows above; checks rect-ness, dims, palette closure, pose completeness, slot coverage, colorway coverage, anchor bounds, hat-brim-on-anchor geometry, item 9x7, RGB sanity) — output, 45/45:

```
PASS x45, tail:
PASS  strawhat cols 1..10 within body 0..11
PASS  strawhat brim row 2 lands on hat anchor row 2
PASS  item bao: width 9 == 9 / height 7 == 7 / chars in palette
ALL CHECKS PASS
```
(Full output is deterministic — rerun the script for the complete list.)

### Weakest points for the owner's pixel pass
1. **Snout**: frontal Q oval with B nostrils; at 1x the B dots (dark on Q shade) may vanish after q15, and on the tan colorway Q vs B contrast drops — may need nostrils as K or the snout lightened per-colorway.
2. **Q belly patch** (rows 10-11 center) could read as clothing rather than shading; if it does, move Q to a bottom/side rim like the crab's T spots.
3. **w-pose arms are 1px wide** — crab's raised claw is 2px; may strobe/illegibly flicker against the a-frame at speed.
4. **Pose b spread-legs** exposes un-outlined body-bottom P at cols 4-7 (crab leg rows have the same exposure, but check it at 1x).
5. **Strawhat fully covers the ears** (rows -1..2 overdraw ear tips); ear notches in the brim would be 2px and may read as noise — owner's call. Also hats float 6px during the sleep pose (crab has the same jank at 1-2px; here it's worse — spec may want hats suppressed when pose === 's').
6. **Sleep pose reuses the frontal head**; a side-lying pig would be more "asleep" but less identifiably the same character at this size. The bottom-anchored-same-box trick is load-bearing: if the owner redraws sleep at 16 wide, per-pose w/h must enter the schema and the flip/anchor math with it.
7. **No W eye-white** — single-B eyes match the tourist, but the 2x dossier portrait (`art2`) will magnify this; portraits may want a W px added.
8. Sleep-Z hard-coded at `c.x+13` (game.js 11816) lands 1px right of a 12-wide body — spec should route it through the `mark` anchor; same for the OT cup at +5,-18 (not covered by the four anchors here).
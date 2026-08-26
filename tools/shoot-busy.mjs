// BUSY TOWN, PHOTOGRAPHED. Matt asked for "cute screenshots from simulations,
// showing a lot of different action at once" - so this hunts, rather than
// stages: it runs a rich town forward and scores every 256px camera window on
// how much DIFFERENT stuff is inside it (bodies, cultures, activity states,
// carried items, dishes in flight, occupied furniture), keeping the best frame
// found per REGION of the boardwalk so the set is varied instead of six
// pictures of the same lunch rush.
//
// It shoots through the game's OWN renderer (mcp/render.mjs), whose seam
// theorem says the view is a reader - a picture cannot move the town.
//
// One-shot tool, kept because the next devlog will want to re-shoot.
//
// Seeds are hunted in turn and the best frame per region is kept ACROSS them,
// because a region's best moment is a rare event and one town's twenty days is
// a small sample of it - the promenade in particular is empty most of the week.
//
//   node tools/shoot-busy.mjs [seeds,csv] [outdir]
import { createVisibleSim } from "../mcp/render.mjs";
import { writeFileSync, mkdirSync } from "fs";

const seeds = (process.argv[2] || "7").split(",").map(Number);
const outdir = process.argv[3] || "/tmp/busy";
mkdirSync(outdir, { recursive: true });

// REGIONS of the 2512px world, by what a picture of each is ABOUT. The hunter
// keeps the best-scoring frame whose camera sits inside each band, so the set
// spans the town rather than crowding the shack.
//
// A BAND IS A RANGE OF CAMERA POSITIONS, NOT OF VENUE POSITIONS, and getting
// that backwards mislabels the whole set: a first pass put the "juice bar"
// band at 700-900 and won it with camX 888 - which frames x888..1144, i.e.
// SUDS SHOWERS - while the "arcade" band won at camX 1752 and photographed
// the ferry. So each band is centred on `venue centre - 128` (half the 256px
// screen) and kept narrow enough that the venue cannot walk out of frame.
// Bands are also DISJOINT: overlapping ones let one very good moment win two
// regions, and the set came back with two pictures of the same shower queue.
// THE WEST END IS NOT PHOTOGRAPHED, and that is a measurement rather than a
// preference. The promenade (the tap, the notice board, the bus stop) and the
// juice bar topped out at 26 and 31 across six towns while the shack reached
// 92-112 - they are where crabs LIVE, not where the town trades, so their best
// moment is four bodies and a bus. Chasing a seventh region would have meant
// shipping two dull pictures to pad the set.
const REGIONS = [
  { id: "showers", lo: 875, hi: 955, label: "suds showers" },            // venue 940-1126
  { id: "shack", lo: 1195, hi: 1310, label: "the shack at full tilt" },  // venue 1232-1532
  { id: "arcade", lo: 1530, hi: 1620, label: "the clawcade" },           // venue 1630-1772
  { id: "pier", lo: 1790, hi: 1900, label: "the pier & the ferry" },     // venue 1862-2040
  // THE HOTEL IS SHOT AT CHECK-IN, not at midnight. Its whole story is the
  // last ferry's worth of guests queuing at REEF's desk while housekeeping
  // works the back wall - by 23:00 everyone is behind a door and the picture
  // is of seven lit transoms and nobody at all.
  { id: "hotel", lo: 2150, hi: 2240, label: "the driftwood hotel at check-in", dusk: true },   // venue 2200-2428
];

// THE SCORE. Bodies count once; VARIETY counts several times over, because a
// picture of nine crabs in one queue is not "a lot of different action" - four
// cultures, three carried items and six busy tables is.
const SCORE = `(() => {
  const live = [];
  for (const c of customers) if (!c.gone && !c.hidden)
    live.push({ x: c.x, cul: c.culture || "crab", st: VS_NAMES[c.stC], recipe: c.recipe ? c.recipe.id : null });
  for (const c of allCrabs()) if (!c.hidden)
    live.push({ x: c.x, cul: "crew", st: DS_NAMES[c.dsC] + "/" + KS_NAMES[c.ksC],
                carry: c.carrying || null,
                quip: c.quip ? c.quip.text : null,
                // The bubble's own screen rect, computed the way drawCrab does
                // it (game.js:17548 and :17594) so overlap can be judged before
                // the shot. The y is NOT a constant: the bubble hangs 22px over
                // a body whose own top is c.y minus the body height, and c.y
                // varies 24px between counter lane and back wall - so one at the
                // grill speaks at almost exactly the height of the TILL TODAY
                // placard (y118) while one on the boardwalk speaks well below
                // it. Assuming one fixed height let a bubble print straight
                // through the shack's till sign and still pass the clash test.
                qw: c.quip ? textWidth(c.quip.text) + 6 : 0,
                qy: c.quip ? c.y - ((c.p.culture && c.p.culture !== "crab" && CULTURES[c.p.culture])
                                    ? CULTURES[c.p.culture].body.h : 12) - 22 : 0 });
  const out = [];
  for (let x = 0; x < WORLD_W - 256; x += 8) {
    const win = live.filter(p => p.x >= x - 8 && p.x < x + 248);
    if (win.length < 5) continue;
    const cults = new Set(win.map(p => p.cul));
    const sts = new Set(win.map(p => p.st));
    const carries = new Set(win.filter(p => p.carry).map(p => p.carry));
    const recipes = new Set(win.filter(p => p.recipe).map(p => p.recipe));
    // SPEECH AND MONEY ARE THE TELLS THAT PHOTOGRAPH. A quip bubble and a
    // rising +$ floater are the two things on screen that say "this is a
    // moment" rather than "this is a diorama", so they are scored heavily.
    //
    // BUT ONLY WHEN THEY ARE LEGIBLE, and legibility is a property of the
    // WHOLE FRAME, not of one text layer. Nothing in this game lays text out:
    // quip bubbles, rising popText floaters and the fixed shop signage are
    // each drawn where their own anchor happens to fall, so a busy window -
    // exactly the window this tool is hunting for - is also the window most
    // likely to print three of them through each other. Successive passes here
    // fixed one layer at a time and the smear simply moved: bubbles into
    // bubbles ("QUICK RINSE" over "SAME OLD"), then floaters into floaters
    // ("FRESHUNTMEATUE NIGHT!"), then bubbles into the TILL TODAY sign. So all
    // three layers go into ONE list of screen rects and are tested together.
    const rects = [];
    let clashes = false;
    for (const p of win) if (p.quip) {
      let bx = p.x + 8 - p.qw / 2 - x; bx = Math.max(1, Math.min(bx, 256 - p.qw - 1));
      rects.push({ kind: "quip", text: p.quip, y: p.qy, h: 11, x0: bx, x1: bx + p.qw });
    }
    // A FLOATER IS UNBOXED - unlike a quip, which brings its own white box and
    // dark border and so stays readable over anything - so it is legible only
    // against a PLAIN, DARK background: sky, sea or road. It is spawned low and
    // rises, and low down it is printing over whatever it was spawned in front
    // of. Two separate frames were lost to this and each named a different
    // band, so both are tested:
    //   - BELOW y118 it is inside the furniture. The hotel's "A ROOM FOR THE
    //     NIGHT!" was born at y130, squarely in the row of doors (y120-136),
    //     and rendered as confetti.
    //   - y110-115 is the SHOPFRONT AWNING, pale blue and white stripes. The
    //     arcade's "MEW: JUICE?" sat at y107 - which passed the y118 floor -
    //     and its 8px of white text ran straight down into the awning, where
    //     white-on-white simply disappears.
    // Above that it is over sky and road, which is where every floater that
    // has photographed well (the shack's y97, the pier's +$ tips) has sat.
    const POP_FLOOR = 118, AWN_TOP = 110, AWN_BOT = 116;
    for (const f of floaters) {
      if (f.x < x - 30 || f.x >= x + 286) continue;
      if (f.y > POP_FLOOR) { clashes = true; break; }
      const w = textWidth(f.text) + 2, fx = Math.max(2, Math.min(f.x - x, 256 - w));
      // does this floater's 8px band reach into an awning it is drawn over?
      if (f.y + 8 > AWN_TOP && f.y < AWN_BOT) {
        for (const k of Object.keys(BIZ)) {
          if (!bizUnlocked(k) || BIZ[k].kind !== "shopfront") continue;
          if (f.x + w / 2 > BIZ[k].x0 && f.x < BIZ[k].x1) { clashes = true; break; }
        }
        if (clashes) break;
      }
      rects.push({ kind: "pop", text: f.text, y: f.y, h: 8, x0: fx, x1: fx + w });
    }
    // The signage a shopfront always hangs, at the y's drawStation paints them:
    // the roofline sign (92), the MANAGE/OFFER chip (105) and the TILL TODAY /
    // CLOSED placard (118). These never move, which is precisely why a bubble
    // that lands on one is a permanent blemish rather than a passing frame.
    for (const k of Object.keys(BIZ)) {
      if (!bizUnlocked(k)) continue;
      const b = BIZ[k], sw = textWidth(b.sign) + 14, sx = (b.x0 + b.x1) / 2 - sw / 2 - x;
      if (sx + sw < 0 || sx > 256) continue;
      rects.push({ kind: "sign", text: b.sign, y: 92, h: 12, x0: sx, x1: sx + sw });
      rects.push({ kind: "chip", text: "MANAGE", y: 105, h: 10, x0: sx + sw / 2 - 27, x1: sx + sw / 2 + 27 });
      rects.push({ kind: "till", text: "TILL", y: 118, h: 11, x0: sx + sw / 2 - 40, x1: sx + sw / 2 + 40 });
    }
    // THE SHELTER NOTICE DOES NOT CLIP ITSELF. Bubbles and floaters clamp
    // themselves into the screen, and a shop sign simply is not drawn when it
    // falls outside it - but the town-hall board (MAYOR / the pot / the beds,
    // game.js:17186) is painted at its world position with no edge test, so a
    // camera parked half a board away renders "R SUDSY / POT IS COLD.. / TH NO
    // BED" hanging off the left of the picture. Require it wholly in or wholly
    // out; nothing in between photographs.
    {
      const nx = SHELTER_X + 2 - x, nw = 78;
      if (nx + nw > 0 && nx < 256 && (nx < 0 || nx + nw > 256)) clashes = true;
    }
    // A frame is SMEARED if any two of those rects overlap on both axes. Two
    // texts on clearly different lines are fine - the game stacks them all day
    // and it reads as a busy street rather than as a bug.
    for (let a = 0; a < rects.length && !clashes; a++)
      for (let b = a + 1; b < rects.length; b++) {
        if (rects[a].kind === rects[b].kind && rects[a].kind !== "quip" && rects[a].kind !== "pop") continue;
        if (Math.abs(rects[a].y - rects[b].y) >= Math.max(rects[a].h, rects[b].h)) continue;
        if (rects[a].x0 < rects[b].x1 + 2 && rects[b].x0 < rects[a].x1 + 2) { clashes = true; break; }
      }
    // A SMEARED FRAME IS NOT A CUTE FRAME AT ANY SCORE. This started as a
    // penalty and that was not enough: the hotel has few candidate moments, so
    // its one overprinted frame ("FRESH LINEN!" straight through "A ROOM FOR
    // THE NIGHT!") still won its region by default. A window that would print
    // text through text is simply not eligible to be photographed.
    if (clashes) continue;
    const quips = rects.filter(r => r.kind === "quip").map(r => r.text);
    const floats = rects.filter(r => r.kind === "pop").length;
    let tabs = 0, rooms = 0, stalls = 0;
    for (const k of Object.keys(BIZ)) {
      if (!bizUnlocked(k)) continue;
      const t = bizTables(k);
      if (t) for (const q of t) if (q.x >= x && q.x < x + 256 && (q.occupant || q.dishes)) tabs++;
      const s = BIZ[k].stalls;
      if (s) for (const q of s) if (q.x >= x && q.x < x + 256 && q.occupant) (BIZ[k].lodging ? rooms++ : stalls++);
    }
    out.push({ x, n: win.length,
      score: win.length + cults.size * 4 + sts.size * 3 + carries.size * 3
           + recipes.size * 2 + tabs * 3 + rooms * 2 + stalls * 2
           + Math.min(quips.length, 2) * 5 + Math.min(floats, 2) * 4,
      cults: [...cults], sts: sts.size, carries: [...carries], recipes: [...recipes],
      quips, floats, tabs, rooms, stalls });
  }
  return JSON.stringify({ day, tmin: Math.round(tmin), wins: out });
})()`;

const best = new Map();   // region id -> { score, meta, png }
const hhmm = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.round(t) % 60).padStart(2, "0")}`;

for (const seed of seeds) {
  const sim = createVisibleSim({ seed });
  // A TOWN WITH ITS LIGHTS ON. The picture is of a town that WORKS - the
  // matrix measures whether a PLAYER can get here, which is a different
  // question, and this tool is not allowed to answer it. So: money, the full
  // build, both foreign dishes taught, then let the town run itself.
  sim.G("coins = 900000");
  sim.G(`for (const k of ["chef","chef","chef","chef","grill","grill","board","board",
    "table","table","table","table","juicebar","arcade","cadegear"]) tryBuy(k);`);
  sim.G("dishWord.pig = true; dishWord.gull = true;");
  // TWO TOASTS ARE SET FROM INSIDE THE DRAW PATH (the HELP invite and the
  // band's TAP MUS nudge, game.js:18465 and :18498), so clearing `toast`
  // before the shot does not stop them - they are written DURING it, and one
  // landed a "THE BAND IS WARMED UP" banner straight across the sea in the
  // showers frame. Marking both as already-nudged is the game's own way of
  // saying "this player has seen it", so nothing is being suppressed that a
  // returning player would see either.
  sim.G("helpSeen = true; helpNudged = true; musNudged = true;");
  sim.runDays(3);
  sim.G(`(() => { for (const d of foodwayDishes("shack")) { try { learnDish(d); } catch (e) {} } })()`);

  // A picture is taken with the camera parked and every OVERLAY cleared: the
  // selected-crab card covers the top third of the screen, and a toast or a
  // followed body reads as a bug rather than a town. `sel = null` is the one
  // that matters - the first pass shot six frames with SCUTTLE's dossier
  // blotting out the sky.
  const shoot = (camx) => {
    sim.G(`camX = clampCam(${camx}); toast = null; sel = null; dossier = null; manage = null;
           hireCard = null; report = null; reportT = 0; boardView = false;
           followIdx = -1; followNpc = null; followCust = null;`);
    return sim.frame({ scale: 4 });
  };

  for (let i = 0; i < 3000; i++) {
    sim.runTicks(20);
    const r = JSON.parse(sim.G(SCORE));
    for (const reg of REGIONS) {
      // Dusk for the hotel (the ferry lands, the desk is open, the lamps are
      // coming on), broad daylight everywhere else. 20:00-22:00 is out of both
      // windows on purpose: the nightly report covers the screen for eleven
      // seconds and clearing it to take a photo is a lie about the game.
      if (reg.dusk ? (r.tmin < 17 * 60 || r.tmin > 19 * 60 + 45)
                   : (r.tmin < 8 * 60 || r.tmin > 19 * 60)) continue;
      const win = r.wins.filter((w) => w.x >= reg.lo && w.x <= reg.hi).sort((a, b) => b.score - a.score)[0];
      if (!win) continue;
      const held = best.get(reg.id);
      if (held && held.score >= win.score) continue;
      best.set(reg.id, { score: win.score, png: shoot(win.x),
        meta: { seed, day: r.day, at: hhmm(r.tmin), camX: win.x, bodies: win.n, cultures: win.cults,
                states: win.sts, quips: win.quips, carrying: win.carries, dishes: win.recipes,
                tables: win.tabs, rooms: win.rooms, stalls: win.stalls } });
    }
    if (r.day > 20) break;
  }
  console.error(`seed ${seed} swept`);
}

for (const reg of REGIONS) {
  const b = best.get(reg.id);
  if (!b) { console.log(`${reg.id}: NO FRAME`); continue; }
  const file = `${outdir}/busy-${reg.id}.png`;
  writeFileSync(file, b.png);
  console.log(`${file}  score=${b.score}  ${reg.label}  ${JSON.stringify(b.meta)}`);
}

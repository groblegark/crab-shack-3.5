// THE AUTHORING LOOP: validate -> test -> render -> iterate.
//
// The game's own cultureProblem() is the AUTHORITY on whether a document is
// admissible, and it is never reimplemented here - every verdict below comes
// from calling it inside a real sim. What this module adds is LOCALISATION:
// cultureProblem answers "A BAD SLOT" because that is the right thing to put
// on a toast in a game, and an author needs "art.body.slots[2] is 'Q', which
// is not a key of art.palette". So the flow is: ask the game, then, if the
// game objected, walk the document to find the field it must have meant.
//
// When the walk cannot localise a verdict, this says so plainly rather than
// guessing - a wrong pointer is worse than an honest "somewhere in here".
import { readFileSync } from "fs";
import { join } from "path";
import { createVisibleSim, renderCultureSheet } from "./render.mjs";
import { ROOT } from "./sim.mjs";
// the versioned observable registry, read off the engine source itself so the
// card validator can never drift from what a card will actually resolve
const OBSERVABLE_NAMES = [...readFileSync(join(ROOT, "game.js"), "utf8")
  .match(/NEURO_OBSERVABLES\s*=\s*{[\s\S]*?\n};/)[0]
  .matchAll(/"([a-z0-9_.]+)":/g)].map((m) => m[1]);

const MAX_DOC_BYTES = 512 * 1024;

// THE CONTAINMENT RULE. A caller's document is untrusted input, exactly as a
// hostile save file is (design/cs35-cultureway-research.md ruling 5). It
// gets: a size cap before it is ever parsed into a sim, a JSON-only
// representation (no functions, no prototypes - it crosses as text), the
// game's own validator, and a sim that is thrown away afterwards. It is
// never written to the repo, never installed into a bundled culture, and
// never reaches a shell. The only thing a caller can mutate is their own
// draft, in their own request.
export function guardDoc(doc) {
  const text = JSON.stringify(doc);
  if (text === undefined) return "document is not JSON-representable";
  if (text.length > MAX_DOC_BYTES) return `document is ${text.length} bytes, over the ${MAX_DOC_BYTES} cap`;
  return null;
}

const rgbOK = (c) => Array.isArray(c) && c.length === 3
  && c.every((v) => typeof v === "number" && isFinite(v) && v >= 0 && v <= 255);

// The localiser. Mirrors the SHAPE of cultureProblem's checks to find a
// field path, but never decides admissibility - that is the game's word.
function localise(d, verdict) {
  const hits = [];
  const say = (path, why) => hits.push({ path, why });
  if (!d || typeof d !== "object") return hits;
  const a = d.art || {};
  const pal = a.palette || {};
  const body = a.body || {};

  if (!d.people || !Array.isArray(d.people.names) || !d.people.names.length)
    say("people.names", "required: a non-empty list of names");
  else d.people.names.forEach((n, i) => {
    if (typeof n !== "string" || !n.length) say(`people.names[${i}]`, "must be a non-empty string");
    else if (n.length > 12) say(`people.names[${i}]`, `"${n}" is ${n.length} chars, max is 12`);
  });
  // E2: people.traits - multipliers in twentieths [4,60], quips for all three
  // moments, clamped lines. Mirrors the engine's traitsProblem names.
  const tt = d.people && d.people.traits;
  if (tt != null) {
    if (typeof tt !== "object" || Array.isArray(tt) || !Object.keys(tt).length || Object.keys(tt).length > 12)
      say("people.traits", "must be an object of 1-12 traits (A BAD TRAIT TABLE)");
    else for (const id in tt) {
      const r = tt[id];
      if (!r || typeof r !== "object") { say(`people.traits.${id}`, "must be an object (A BAD TRAIT)"); continue; }
      if (typeof r.label !== "string" || !r.label.length || r.label.length > 20)
        say(`people.traits.${id}.label`, "must be a string of 1-20 chars (A BAD TRAIT LABEL)");
      for (const k of ["move20", "work20", "tip20"])
        if (!(Number.isInteger(r[k]) && r[k] >= 4 && r[k] <= 60))
          say(`people.traits.${id}.${k}`, `twentieths, integer 4-60 (A BAD TRAIT MULTIPLIER) - got ${r[k]}`);
      if (r.lateMin != null && !(Number.isInteger(r.lateMin) && r.lateMin >= 0 && r.lateMin <= 240))
        say(`people.traits.${id}.lateMin`, "integer minutes 0-240 (A LATENESS PAST ALL PATIENCE)");
      for (const q of ["commute", "work", "home"]) {
        const arr = r.quips && r.quips[q];
        if (!Array.isArray(arr) || !arr.length) say(`people.traits.${id}.quips.${q}`, "required: a non-empty array of lines (A TRAIT WITH NOTHING TO SAY)");
        else arr.forEach((s, i) => {
          if (typeof s !== "string" || !s.length || s.length > 120) say(`people.traits.${id}.quips.${q}[${i}]`, "must be a string of 1-120 chars");
        });
      }
      if (r.quips) for (const q in r.quips)
        if (!["commute", "work", "home"].includes(q)) say(`people.traits.${id}.quips.${q}`, "unknown quip moment (A QUIP FOR NOWHERE)");
    }
  }

  for (const ch in pal) {
    if (ch === ".") {
      // caught while dogfooding: '.' reads like "the empty colour" and an
      // author reaches for it, but it is the POSE's transparent marker and
      // must not be a palette key at all
      say(`art.palette["."]`, "'.' is the transparent marker used inside poses - it must not appear in art.palette at all. Delete this entry.");
      continue;
    }
    if (ch.length !== 1) say(`art.palette["${ch}"]`, "palette keys must be single characters");
    if (!rgbOK(pal[ch])) say(`art.palette["${ch}"]`, "must be [r,g,b] with each 0-255");
  }
  if (!(body.w >= 4 && body.w <= 32 && body.h >= 4 && body.h <= 32))
    say("art.body.w/h", `must each be 4-32 (got ${body.w}x${body.h})`);
  if (Array.isArray(body.slots))
    body.slots.forEach((s, i) => {
      if (!pal[s]) say(`art.body.slots[${i}]`, `"${s}" is not a key of art.palette`);
    });
  else say("art.body.slots", "required: a non-empty list of palette characters");

  if (Array.isArray(a.colorways))
    a.colorways.forEach((cw, i) => {
      for (const s in cw) {
        if (!Array.isArray(body.slots) || !body.slots.includes(s))
          say(`art.colorways[${i}]["${s}"]`, `"${s}" is not one of art.body.slots`);
        else if (!rgbOK(cw[s])) say(`art.colorways[${i}]["${s}"]`, "must be [r,g,b] with each 0-255");
      }
    });
  else say("art.colorways", "required: a non-empty list of slot->colour maps");

  // poses: the most common authoring error by far, so it gets exact numbers
  for (const p of ["a", "b", "w", "s"]) {
    const rows = body.poses && body.poses[p];
    const at = `art.body.poses.${p}`;
    if (!Array.isArray(rows) || !rows.length) { say(at, "required: an array of pixel rows"); continue; }
    if (rows.length !== body.h) say(at, `has ${rows.length} rows, but art.body.h is ${body.h}`);
    rows.forEach((r, y) => {
      if (typeof r !== "string") return say(`${at}[${y}]`, "every row must be a string");
      if (r.length !== body.w) say(`${at}[${y}]`, `is ${r.length} chars, but art.body.w is ${body.w}`);
      for (let x = 0; x < r.length; x++)
        if (r[x] !== "." && !pal[r[x]])
          return say(`${at}[${y}]`, `char '${r[x]}' at x=${x} is not in art.palette (use '.' for transparent)`);
    });
  }

  const an = body.anchors || {};
  const pt = (q) => q && typeof q.x === "number" && typeof q.y === "number";
  if (!pt(an.hat) || !pt(an.carry) || !pt(an.mark))
    say("art.body.anchors", "required: hat, carry and mark, each {x,y}");
  else if (!(an.hat.x >= 0 && an.hat.x < body.w && an.hat.y >= 0 && an.hat.y <= body.h))
    say("art.body.anchors.hat", `must sit inside the body (0<=x<${body.w}, 0<=y<=${body.h})`);
  if (!an.bar || !(an.bar.w >= 1 && an.bar.w <= body.w))
    say("art.body.anchors.bar", `required: {w} between 1 and art.body.w (${body.w})`);

  const v = d.voice;
  if (v != null && Array.isArray(v.registers))
    v.registers.forEach((g, i) => {
      if (!g || typeof g.id !== "string" || !g.id.length) say(`voice.registers[${i}].id`, "required: a non-empty string");
      if (!g || typeof g.acc !== "string") say(`voice.registers[${i}].acc`, "required: an accessory key, or \"none\"");
      else if (g.acc !== "none" && !(a.accessories && a.accessories[g.acc]))
        say(`voice.registers[${i}].acc`, `"${g.acc}" is not a key of art.accessories (or "none")`);
      if (g && g.purseMul != null && !(g.purseMul >= 0.1 && g.purseMul <= 5))
        say(`voice.registers[${i}].purseMul`, `${g.purseMul} is outside 0.1-5`);
      for (const part of ["diary", "depart"])
        if (g && g[part]) for (const k in g[part]) {
          const s = g[part][k];
          if (typeof s !== "string" || !s.length || s.length > 120)
            say(`voice.registers[${i}].${part}.${k}`, "must be a string of 1-120 chars");
        }
    });
  else if (v != null) say("voice.registers", "required when voice is present: a non-empty list");
  // E1: idle quips - voice-level, four known moments, non-empty clamped lines.
  if (v != null && v.idle != null) {
    if (typeof v.idle !== "object" || Array.isArray(v.idle)) say("voice.idle", "must be an object of {ball,chat,wander,nod} line arrays");
    else for (const k in v.idle) {
      if (!["ball", "chat", "wander", "nod"].includes(k)) say(`voice.idle.${k}`, "unknown idle moment (A QUIP FOR NOWHERE) - the engine speaks ball, chat, wander, nod");
      else if (!Array.isArray(v.idle[k]) || !v.idle[k].length) say(`voice.idle.${k}`, "must be a non-empty array of lines");
      else v.idle[k].forEach((s, i) => {
        if (typeof s !== "string" || !s.length || s.length > 120) say(`voice.idle.${k}[${i}]`, "must be a string of 1-120 chars");
      });
    }
  }

  // depart-rule weight overrides (registry row 4): ruleId -> int 0..8,
  // quarters with 4 the identity. The rule ids are the engine's own table.
  const DEPART_IDS = ["rough", "quits", "quit", "nothing", "foreign", "delight",
    "unspent", "idle", "hungry", "parched", "grubby", "weary", "bored", "wait",
    "dues", "missed", "mist", "table", "bed", "spentup", "top", "regular", "quiet"];
  const dp = d.depart;
  if (dp != null) {
    if (typeof dp !== "object" || Array.isArray(dp)) say("depart", "must be an object");
    else if (dp.weights != null) {
      if (typeof dp.weights !== "object" || Array.isArray(dp.weights)) say("depart.weights", "must be an object of ruleId -> 0..8");
      else for (const k in dp.weights) {
        if (!DEPART_IDS.includes(k))
          say(`depart.weights.${k}`, `"${k}" is not a departure rule id (${DEPART_IDS.join(", ")})`);
        const w = dp.weights[k];
        if (typeof w !== "number" || !Number.isInteger(w) || w < 0 || w > 8)
          say(`depart.weights.${k}`, "must be an integer 0-8 (quarters; 4 = the engine's own weight)");
      }
    }
  }

  if (d.tastes) say("tastes", "moved: declare taste weights under appeal.tastes (the game rejects the old spot)");
  const ap = d.appeal;
  if (ap && ap.tastes) for (const k in ap.tastes) {
    const w = ap.tastes[k];
    if (typeof w !== "number" || !isFinite(w) || w < 0.1 || w > 5)
      say(`appeal.tastes.${k}`, `${w} is outside 0.1-5 (1.0 is neutral; below 1 is dislike, 0.1 is taboo)`);
  }
  if (ap && ap.nudge) {
    const n = ap.nudge, int = (v) => typeof v === "number" && Number.isInteger(v);
    if (n.radius != null && !(int(n.radius) && n.radius >= 8 && n.radius <= 128))
      say("appeal.nudge.radius", `${n.radius} is outside 8-128 px (the crab value is 72)`);
    if (n.minutes != null && !(int(n.minutes) && n.minutes >= 5 && n.minutes <= 1440))
      say("appeal.nudge.minutes", `${n.minutes} is outside 5-1440 game-minutes (the crab value is 60)`);
    if (n.mul100 != null && !(int(n.mul100) && n.mul100 >= 100 && n.mul100 <= 300))
      say("appeal.nudge.mul100", `${n.mul100} is outside 100-300 hundredths (the crab value is 130 = x1.3)`);
    if (n.relax != null && !(typeof n.relax === "number" && isFinite(n.relax) && n.relax >= 0 && n.relax <= 0.5))
      say("appeal.nudge.relax", `${n.relax} is outside 0-0.5 (the crab value is 0.12)`);
  }
  const mg = d.management;
  if (mg) {
    const int = (v) => typeof v === "number" && Number.isInteger(v);
    if (mg.tableTip != null && !(int(mg.tableTip) && mg.tableTip >= 1 && mg.tableTip <= 30))
      say("management.tableTip", `${mg.tableTip} is outside 1-30 whole dollars (the crab value is 9)`);
    if (mg.counter20 != null && !(int(mg.counter20) && mg.counter20 >= 0 && mg.counter20 <= 20))
      say("management.counter20", `${mg.counter20} is outside 0-20 twentieths (the crab value is 3 = the old 0.15)`);
    const s = mg.shifts;
    if (s) {
      const halfHour = (v, lo, hi) => int(v) && v >= lo && v <= hi && v % 30 === 0;
      if (s.std != null && !halfHour(s.std, 120, 720))
        say("management.shifts.std", `${s.std} is not a half-hour count of minutes in 120-720 (the crab value is 360)`);
      if (s.day != null && !halfHour(s.day, 240, 840))
        say("management.shifts.day", `${s.day} is not a half-hour count of minutes in 240-840 (the crab value is 600)`);
      if (s.cover != null && !halfHour(s.cover, 240, 1440))
        say("management.shifts.cover", `${s.cover} is not a half-hour count of minutes in 240-1440 (the crab value is 720)`);
    }
  }
  const bd = d.body;
  if (bd) {
    const int = (v) => typeof v === "number" && Number.isInteger(v);
    if (typeof bd !== "object" || Array.isArray(bd)) say("body", "must be an object with rates and/or wants");
    else {
      const R_NEEDS = ["hunger", "thirst", "dirt", "bored", "tired"], W_NEEDS = ["food", "drink", "clean", "fun"];
      if (bd.rates != null) {
        let sum = 0;
        for (const n of R_NEEDS) {
          const v = bd.rates[n];
          if (v != null && !(int(v) && v >= 10 && v <= 40))
            say(`body.rates.${n}`, `${v} is outside 10-40 twentieths (20 = the crab rate exactly)`);
          sum += v != null && int(v) ? v : 20;
        }
        if (sum > 120)
          say("body.rates", `the five rates sum to ${sum}, past the aggregate cap of 120 (mean 1.2x) - inflating every need mints spend from a text file (A BODY TOO HUNGRY FOR THE PIER)`);
        for (const n in bd.rates) if (!R_NEEDS.includes(n))
          say(`body.rates.${n}`, "is not one of the engine's five needs - the need set is not a culture's to grow (A NEED THIS BODY DOES NOT HAVE)");
      }
      if (bd.wants != null) {
        for (const n of W_NEEDS) {
          const v = bd.wants[n];
          if (v != null && !(int(v) && v >= 10 && v <= 30))
            say(`body.wants.${n}`, `${v} is outside 10-30 twentieths (20 = the crab threshold exactly)`);
        }
        for (const n in bd.wants) if (!W_NEEDS.includes(n))
          say(`body.wants.${n}`, "is not one of the engine's four wants (A NEED THIS BODY DOES NOT HAVE)");
      }
    }
  }
  const st = d.settlers;
  if (st) {
    if (typeof st !== "object" || Array.isArray(st)) say("settlers", "must be an object with apron and/or walkins");
    else {
      if (st.apron != null && typeof st.apron !== "boolean")
        say("settlers.apron", `${st.apron} is not a boolean - may this people take a job and stay, yes or no`);
      if (st.walkins != null && !(typeof st.walkins === "number" && Number.isInteger(st.walkins) && st.walkins >= 0 && st.walkins <= 8))
        say("settlers.walkins", `${st.walkins} is outside 0-8 twentieths (0 = never, the default; capped so no document floods the town)`);
    }
  }
  // the rhythm: absolute times free, the DERIVED awake arc clamped after
  // inheritance - the same rules cultureProblem enforces, spoken helpfully
  const rh = d.rhythm;
  if (rh) {
    if (typeof rh !== "object" || Array.isArray(rh)) say("rhythm", "must be an object of game-minute anchors");
    else {
      const CRAB = { wake: 450, bed: 1260, lieIn: 570, SS: { D: 510, M: 480, E: 840 } };
      const gm = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1440 && v % 30 === 0;
      for (const k of ["wake", "bed", "lieIn"])
        if (rh[k] != null && !gm(rh[k]))
          say(`rhythm.${k}`, `${rh[k]} is not a game-minute on the 30-minute grain (17:00 = 1020)`);
      if (rh.shiftStarts != null) {
        if (typeof rh.shiftStarts !== "object" || Array.isArray(rh.shiftStarts))
          say("rhythm.shiftStarts", "must be an object with D/M/E starts");
        else for (const k in rh.shiftStarts) {
          if (!(k in CRAB.SS)) say(`rhythm.shiftStarts.${k}`, "only D, M and E exist");
          else if (!gm(rh.shiftStarts[k]))
            say(`rhythm.shiftStarts.${k}`, `${rh.shiftStarts[k]} is not a game-minute on the 30-minute grain`);
        }
      }
      if (rh.hours != null) {
        const h = rh.hours;
        if (typeof h !== "object" || !gm(h.open) || !(Number.isInteger(h.close) && h.close > 0 && h.close <= 1440 && h.close % 30 === 0))
          say("rhythm.hours", "open/close must be game-minutes on the 30-minute grain");
        else if (h.close <= h.open)
          say("rhythm.hours", "a sign across midnight is real design but the hours model cannot represent it yet (R3) - open must be before close");
        else if (h.open < 360 || h.close - h.open < 240)
          say("rhythm.hours", "the sign rail: not before 6:00, at least a 4-hour day");
      }
      const wake = rh.wake != null ? rh.wake : CRAB.wake;
      const bed = rh.bed != null ? rh.bed : CRAB.bed;
      const arc = (bed - wake + 1440) % 1440;
      if (arc > 1200) say("rhythm", "A DAY WITH NO NIGHT - the awake arc composes past 20 hours (the clamp runs on inherited values too)");
      else if (arc < 480) say("rhythm", "A PEOPLE WHO NEVER WAKE - the awake arc composes under 8 hours");
      else {
        const inArc = (t) => ((t - wake + 1440) % 1440) < arc;
        const lie = rh.lieIn != null ? rh.lieIn : CRAB.lieIn;
        if (!inArc(lie)) say("rhythm.lieIn", "A LIE-IN IN THEIR SLEEP - the lie-in must land inside the awake arc (mind inherited crab values)");
        const ss = rh.shiftStarts || {};
        for (const k of ["D", "M", "E"]) {
          const v = ss[k] != null ? ss[k] : CRAB.SS[k];
          if (!inArc(v)) say("rhythm.shiftStarts", `A SHIFT IN THEIR SLEEP - ${k} composes to ${v}, outside the awake arc (declare it, or widen the arc)`);
        }
      }
    }
  }
  // declarative cards: labels bound to REGISTERED observables, nothing else
  if (d.cards != null) {
    if (!Array.isArray(d.cards) || d.cards.length > 4) say("cards", "must be an array of at most 4 cards");
    else d.cards.forEach((cd, i) => {
      if (!cd || typeof cd !== "object" || Array.isArray(cd)) return say(`cards[${i}]`, "must be an object");
      if (typeof cd.title !== "string" || !cd.title.length || cd.title.length > 18)
        say(`cards[${i}].title`, "must be a string of 1-18 characters");
      if (!Array.isArray(cd.rows) || !cd.rows.length || cd.rows.length > 6)
        say(`cards[${i}].rows`, "must be 1-6 rows");
      else cd.rows.forEach((r, j) => {
        if (!r || typeof r.label !== "string" || !r.label.length || r.label.length > 10)
          say(`cards[${i}].rows[${j}].label`, "must be a string of 1-10 characters");
        if (!r || typeof r.obs !== "string" || !OBSERVABLE_NAMES.includes(r.obs))
          say(`cards[${i}].rows[${j}].obs`, `${r && r.obs} is not a registered observable (see the registry: ${OBSERVABLE_NAMES.slice(0, 4).join(", ")}, ...)`);
      });
    });
  }
  const fw = d.foodways;
  if (fw && fw.ingredients) for (const k in fw.ingredients) {
    const w = fw.ingredients[k];
    if (typeof w !== "number" || !Number.isInteger(w) || w < 1 || w > 50)
      say(`foodways.ingredients.${k}`, `${w} is outside 1-50 author dollars per unit`);
    if (["fish_raw", "fruit", "token", "soap", "linen"].includes(k))
      say(`foodways.ingredients.${k}`, "shadows the pier's own price list - the native pantry is never re-priced");
  }
  if (d.businesses && typeof d.businesses === "object") for (const id in d.businesses) {
    const z = d.businesses[id], at = `businesses.${id}`;
    if (!/^[a-z][a-z0-9_]{0,11}$/.test(id)) say(at, "business ids are a-z, digits, _ - max 12 chars");
    if (["shack", "arcade", "juicebar", "hotel", "showers"].includes(id))
      say(at, "shadows the town's own catalog");
    if (!z || typeof z !== "object") { say(at, "must be an object"); continue; }
    if (z.owner != null) say(`${at}.owner`, "a declared business may not name an owner - ownership binds to a settler when settlers exist");
    if (z.rent != null && !(Number.isInteger(z.rent) && z.rent >= 1 && z.rent <= 500))
      say(`${at}.rent`, `${z.rent} is outside 1-500 author dollars per day`);
    if (z.wage != null && !(Number.isInteger(z.wage) && z.wage >= 10 && z.wage <= 100))
      say(`${at}.wage`, `${z.wage} is outside 10-100 author dollars`);
    const sts = (z.stations && typeof z.stations === "object") ? z.stations : null;
    if (!sts) say(`${at}.stations`, "required: station TYPE -> capacity 1-4 (max 6 kinds); coordinates are the town's, never yours");
    for (const s of ["source", "out"])
      if (sts && z[s] != null && !sts[z[s]])
        say(`${at}.${s}`, `"${z[s]}" is not one of this business's own stations`);
    if (Array.isArray(z.recipes)) z.recipes.forEach((r, i) => {
      if (r && Array.isArray(r.steps)) r.steps.forEach((st, j) => {
        if (sts && Array.isArray(st) && typeof st[0] === "string" && !sts[st[0]])
          say(`${at}.recipes[${i}].steps[${j}]`, `station "${st[0]}" is not one this business declares`);
      });
    });
  }
  return hits;
}

// VALIDATE: the game's verdict plus a field-level explanation of it.
export const ID_RE = /^[a-z][a-z0-9_]{0,15}$/;

export function cultureValidate(doc) {
  const guard = guardDoc(doc);
  if (guard) return { ok: false, verdict: "REJECTED BEFORE PARSE", problems: [{ path: "(document)", why: guard }] };
  const sim = createVisibleSim({ seed: 1337 });
  const verdict = sim.G(`cultureProblem(${JSON.stringify(doc)})`);
  const problems = localise(doc, verdict);
  // THE SILENT ONE. installCultures skips any id failing this pattern
  // WITHOUT a toast and without a verdict - the document is simply never
  // installed, and an author sees a world with nobody new in it and no
  // reason why. cultureProblem never sees the id at all, so this check
  // cannot come from the game; it is the one rule this validator owns.
  const id = doc && doc.meta && doc.meta.id;
  if (typeof id !== "string" || !ID_RE.test(id))
    problems.push({ path: "meta.id",
      why: `${JSON.stringify(id)} must match ${ID_RE} (lowercase, starts with a letter, <=16 chars) or the game will skip this document SILENTLY` });
  if (!verdict) {
    // admissible - but does it BUILD? parseArt can still throw on art the
    // validator passes, and an author would rather hear that now.
    let built = null;
    const pid = ID_RE.test(id || "") ? id : "probe";
    try {
      sim.G(`loadCultures({ ${JSON.stringify(pid)}: ${JSON.stringify(doc)} })`);
      built = sim.G(`CULTURES[${JSON.stringify(pid)}] ? "built" : "did not build"`);
    } catch (e) { built = "threw: " + String(e && e.message || e); }
    const bad = problems.filter((p) => p.path === "meta.id");
    return { ok: built === "built" && !bad.length, verdict: null, build: built,
             problems: bad, warnings: problems.filter((p) => p.path !== "meta.id"),
             id: id || null,
             note: bad.length ? "the art is admissible but the id would be skipped silently"
                 : problems.length ? "admissible, but these look unintended" : "clean" };
  }
  return { ok: false, verdict,
           problems: problems.length ? problems
             : [{ path: "(unlocated)", why: `the game rejected this with "${verdict}" and the field walk could not localise it - compare against the pigway example` }] };
}

// TEST: install the draft and run a town, then report what these people
// actually DID - arrivals, meals, refusals, spending, and what they said.
export async function cultureTest(doc, { seed = 1337, days = 20, id = null } = {}) {
  const guard = guardDoc(doc);
  if (guard) return { ok: false, error: guard };
  const cid = id || (doc.meta && doc.meta.id) || "draft";
  const sim = createVisibleSim({ seed, cultures: { [cid]: doc } });
  const installed = sim.G(`!!CULTURES[${JSON.stringify(cid)}]`);
  if (!installed)
    return { ok: false, error: "the document did not install",
             verdict: sim.G(`cultureProblem(${JSON.stringify(doc)})`),
             hint: ID_RE.test(cid) ? null
               : `the id ${JSON.stringify(cid)} fails ${ID_RE} - the game skips such documents silently` };
  // ARRIVALS ARE SAMPLED, NOT READ AT THE END. A visitor who came on day 7
  // and sailed home on day 9 is invisible to a day-20 snapshot, and "did my
  // people ever turn up?" is the first question an author has. So the run
  // is stepped a day at a time and every new name is banked as it appears.
  const seen = new Map();
  let firstDay = null;
  const probe = `(function () {
    const id = ${JSON.stringify(cid)};
    return JSON.stringify(customers.filter(k => k.visitor && k.culture === id)
      .map(k => ({ n: k.name, acc: k.acc, w: $d(k.wallet) })));
  })()`;
  for (let d = 1; d <= days; d++) {
    sim.runDays(d);
    for (const v of JSON.parse(sim.G(probe))) {
      if (!seen.has(v.n)) { seen.set(v.n, { ...v, day: sim.G("day") }); if (firstDay == null) firstDay = sim.G("day"); }
      else seen.get(v.n).w = v.w;   // last wallet reading wins: what they left with
    }
    if (sim.G("gameOver")) break;
  }
  const folk = [...seen.values()];
  const report = JSON.parse(sim.G(`(function () {
    const st = window._stats || {};
    return JSON.stringify({ endedDay: day, over: !!gameOver, rep: repPts(rep),
      townServes: st.tourServes || 0, townRage: st.tourRage || 0,
      townArrivals: st.arrivals || 0, visSpend: st.visSpend || 0, visUnspent: st.visUnspent || 0 });
  })()`));
  return { ok: true, recipe: { seed, days, id: cid },
           arrived: folk.length > 0, firstSeenDay: firstDay,
           count: folk.length,
           folk: folk.slice(0, 12),
           registersSeen: [...new Set(folk.map((f) => f.acc))],
           report,
           note: folk.length ? null
             : `nobody of this culture appeared by day ${report.endedDay}${report.over ? " (the town died first)" : ""} - check arrival.repGate against the town's rep of ${report.rep}` };
}

// DIFF: what makes this people different from another - the question an
// author actually has ("how is mine unlike the pigs?").
export function cultureDiff(a, b) {
  const out = { tastes: {}, purse: {}, art: {}, voice: {} };
  const ta = (a.appeal && a.appeal.tastes) || {}, tb = (b.appeal && b.appeal.tastes) || {};
  for (const k of new Set([...Object.keys(ta), ...Object.keys(tb)])) {
    const va = ta[k] ?? 1, vb = tb[k] ?? 1;
    if (va !== vb) out.tastes[k] = { a: va, b: vb };
  }
  const regs = (d) => Object.fromEntries(((d.voice && d.voice.registers) || []).map((r) => [r.id, r.purseMul ?? 1]));
  const ra = regs(a), rb = regs(b);
  for (const k of new Set([...Object.keys(ra), ...Object.keys(rb)]))
    if (ra[k] !== rb[k]) out.purse[k] = { a: ra[k] ?? null, b: rb[k] ?? null };
  const ab = (d) => (d.art && d.art.body) || {};
  out.art = { size: { a: `${ab(a).w}x${ab(a).h}`, b: `${ab(b).w}x${ab(b).h}` },
              colorways: { a: (a.art && a.art.colorways || []).length, b: (b.art && b.art.colorways || []).length },
              accessories: { a: Object.keys((a.art && a.art.accessories) || {}), b: Object.keys((b.art && b.art.accessories) || {}) } };
  out.voice = { registers: { a: Object.keys(ra), b: Object.keys(rb) } };
  out.arrival = { a: a.arrival || null, b: b.arrival || null };
  return out;
}

export function loadBundled(id) {
  if (id === "pig") {
    const raw = JSON.parse(readFileSync(join(ROOT, "tools", "fixtures", "cultures-pig.json"), "utf8"));
    return raw.pig || raw;
  }
  if (id === "gull")
    return JSON.parse(readFileSync(join(ROOT, "design", "cultureways", "gullway.json"), "utf8"));
  return null;
}

export { renderCultureSheet };

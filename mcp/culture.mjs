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

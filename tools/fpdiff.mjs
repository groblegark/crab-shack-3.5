// fpdiff — the fingerprint-diff classifier (numeric core, slice 0 enabler).
//
// Reads two captures of the frozen day-2 fingerprint (the suite's
// "hours: defaults are behavior-identical" shape: day/tmin/coins/rep/catch/
// serves/crabServes/rage/till/wallets[[name,$]]/pos[[x,y]]) and classifies
// every delta as ROUNDING-shaped or BEHAVIOR-shaped. The re-baseline
// protocol (design/cs35-research/numeric-protocol.md §2.7) requires every
// moved field to classify as rounding or carry a threshold-crossing trace;
// this tool is the mechanical half of that receipt.
//
//   node tools/fpdiff.mjs before.json after.json [--money-tol 0.01]
//        [--pos-tol 0.1] [--rep-tol 0]
//   node tools/fpdiff.mjs --test
//
// Input files: a single capture (object or the scenario's JSON string), or a
// map of seed -> capture. Exit 0 = clean or rounding-only; exit 1 = any
// BEHAVIOR-shaped delta (or shape mismatch, which is always behavior).
//
// Class rules (defaults; the slice being landed may widen with flags and
// must say so in its receipt):
//   counts  day tmin catch serves crabServes rage   exact, always
//   money   coins till wallets[$]                   rounding if 0 < |d| <= 0.01
//   rep                                             exact by default (slice 5
//                                                   widens it, with a receipt)
//   pos     x,y per crab                            rounding if 0 < |d| <= 0.1
//   roster  wallet names, row counts                any mismatch is BEHAVIOR

import fs from "node:fs";

const CLASSES = {
  count: { fields: ["day", "tmin", "catch", "serves", "crabServes", "rage"], tol: () => 0 },
  money: { fields: ["coins", "till"], tol: (o) => o.moneyTol },
  rep: { fields: ["rep"], tol: (o) => o.repTol },
};

function parseCapture(v) {
  if (typeof v === "string") return JSON.parse(v);
  return v;
}

export function classify(a, b, opts = {}) {
  const o = { moneyTol: 0.01, posTol: 0.1, repTol: 0, ...opts };
  a = parseCapture(a); b = parseCapture(b);
  const rows = [];
  const push = (kind, field, was, now) =>
    rows.push({ kind, field, was, now, delta: typeof was === "number" ? +(now - was).toFixed(6) : null });
  for (const cls of Object.values(CLASSES)) {
    for (const f of cls.fields) {
      const d = Math.abs((b[f] || 0) - (a[f] || 0));
      if (d === 0) continue;
      push(d <= cls.tol(o) ? "ROUNDING" : "BEHAVIOR", f, a[f], b[f]);
    }
  }
  // wallets: matched BY NAME, order-sensitive - a reordered or re-membered
  // roster is a behavior change, not a rounding one
  const wa = a.wallets || [], wb = b.wallets || [];
  if (wa.length !== wb.length || wa.some((w, i) => wb[i][0] !== w[0])) {
    push("BEHAVIOR", "wallets(roster)", wa.map(w => w[0]).join(","), wb.map(w => w[0]).join(","));
  } else {
    for (let i = 0; i < wa.length; i++) {
      const d = Math.abs(wb[i][1] - wa[i][1]);
      if (d === 0) continue;
      push(d <= o.moneyTol ? "ROUNDING" : "BEHAVIOR", `wallet[${wa[i][0]}]`, wa[i][1], wb[i][1]);
    }
  }
  const pa = a.pos || [], pb = b.pos || [];
  if (pa.length !== pb.length) {
    push("BEHAVIOR", "pos(rows)", pa.length, pb.length);
  } else {
    for (let i = 0; i < pa.length; i++) {
      for (const axis of [0, 1]) {
        const d = Math.abs(pb[i][axis] - pa[i][axis]);
        if (d === 0) continue;
        const name = (wa[i] && wa[i][0]) || i;
        push(d <= o.posTol ? "ROUNDING" : "BEHAVIOR", `pos[${name}].${axis ? "y" : "x"}`, pa[i][axis], pb[i][axis]);
      }
    }
  }
  return rows;
}

function loadFile(p) {
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  // either one capture, or a seed -> capture map
  if (raw && typeof raw === "object" && !Array.isArray(raw)
    && !("day" in raw) && typeof raw !== "string") {
    const out = {};
    for (const k in raw) out[k] = parseCapture(raw[k]);
    return out;
  }
  return { "": parseCapture(raw) };
}

function main(argv) {
  const args = argv.filter(x => !x.startsWith("--"));
  const flag = (name, dflt) => {
    const i = argv.indexOf("--" + name);
    return i >= 0 ? parseFloat(argv[i + 1]) : dflt;
  };
  const opts = { moneyTol: flag("money-tol", 0.01), posTol: flag("pos-tol", 0.1), repTol: flag("rep-tol", 0) };
  const A = loadFile(args[0]), B = loadFile(args[1]);
  let behavior = 0, rounding = 0;
  for (const seed of Object.keys(A)) {
    if (!(seed in B)) { console.log(`BEHAVIOR seed ${seed} missing from ${args[1]}`); behavior++; continue; }
    const rows = classify(A[seed], B[seed], opts);
    for (const r of rows) {
      console.log(`${r.kind}  ${seed ? "seed " + seed + " " : ""}${r.field}  ${r.was} -> ${r.now}${r.delta != null ? "  (d " + r.delta + ")" : ""}`);
      if (r.kind === "BEHAVIOR") behavior++; else rounding++;
    }
    if (!rows.length) console.log(`OK  ${seed ? "seed " + seed + " " : ""}byte-identical`);
  }
  console.log(`-- ${behavior} behavior-shaped, ${rounding} rounding-shaped`);
  process.exit(behavior ? 1 : 0);
}

// ---- self-test ------------------------------------------------------------
function test() {
  const base = {
    day: 3, tmin: 0, coins: 148.494, rep: 53.609, catch: 4, serves: 42,
    crabServes: 4, rage: 4, till: 220.466,
    wallets: [["PINCHY", 16], ["SUDSY", 220.47]],
    pos: [[520, 154], [974.7, 166.9]],
  };
  const clone = () => JSON.parse(JSON.stringify(base));
  const kinds = (b, o) => classify(base, b, o).map(r => r.kind + ":" + r.field).sort();
  const cases = [];
  const expect = (name, got, want) => cases.push([name, JSON.stringify(got) === JSON.stringify(want), got, want]);

  expect("identical is clean", kinds(clone()), []);
  let b = clone(); b.coins = 148.49;                       // sub-cent
  expect("sub-cent coins is rounding", kinds(b), ["ROUNDING:coins"]);
  b = clone(); b.wallets[1][1] = 220.48;
  expect("sub-cent wallet is rounding", kinds(b), ["ROUNDING:wallet[SUDSY]"]);
  b = clone(); b.wallets[1][1] = 219;
  expect("a dollar-off wallet is behavior", kinds(b), ["BEHAVIOR:wallet[SUDSY]"]);
  b = clone(); b.serves = 43;
  expect("a count is always behavior", kinds(b), ["BEHAVIOR:serves"]);
  b = clone(); b.pos[1][0] = 974.75;
  expect("0.05px is rounding", kinds(b), ["ROUNDING:pos[SUDSY].x"]);
  b = clone(); b.pos[1][0] = 975.3;
  expect("0.6px is behavior", kinds(b), ["BEHAVIOR:pos[SUDSY].x"]);
  b = clone(); b.rep = 53.61;
  expect("rep is exact by default", kinds(b), ["BEHAVIOR:rep"]);
  expect("rep tolerance is opt-in", kinds(b, { repTol: 0.01 }), ["ROUNDING:rep"]);
  b = clone(); b.wallets = [["PINCHY", 16], ["REEF", 220.47]];
  expect("a renamed roster is behavior", kinds(b), ["BEHAVIOR:wallets(roster)"]);
  b = clone(); b.pos.push([1, 1]);
  expect("a grown pos list is behavior", kinds(b), ["BEHAVIOR:pos(rows)"]);
  expect("string captures parse", classify(JSON.stringify(base), JSON.stringify(base)).length, 0);

  let fail = 0;
  for (const [name, ok, got, want] of cases) {
    console.log(`${ok ? "PASS" : "FAIL"}  fpdiff: ${name}${ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
    if (!ok) fail++;
  }
  console.log(`${cases.length - fail}/${cases.length} passed`);
  process.exit(fail ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith("fpdiff.mjs")) {
  if (process.argv.includes("--test")) test();
  else if (process.argv.length >= 4) main(process.argv.slice(2));
  else { console.log("usage: fpdiff.mjs A.json B.json [--money-tol c] [--pos-tol px] [--rep-tol r] | --test"); process.exit(2); }
}

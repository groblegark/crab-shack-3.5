// centmigrate — largest-remainder apportionment for the money slice's save
// migration (numeric core, slice 1; design/cs35-research/numeric-protocol.md
// §3). Rounding N float balances to integer cents must create and destroy
// NOTHING: the migrated accounts sum EXACTLY to the world total, by
// construction rather than by luck.
//
// centify(balances, targetCents?)
//   balances: [[name, float], ...] (or {name: float}) - negatives welcome
//             (credit); order does not matter, ties break on name.
//   targetCents: the world truth, e.g. Math.round(worldMoney() * 100)
//             computed on the loaded float state BEFORE conversion. When
//             omitted (tests, ad hoc use) it is derived from the name-sorted
//             float sum - Phase B MUST pass the worldMoney-derived value so
//             the target uses the game's own summation order.
//   returns:  Map(name -> int cents), with sum === targetCents exactly.
//
// Method: floor every balance*100 toward -infinity, then hand the leftover
// cents one each to the accounts with the largest dropped fractions (name
// order breaks ties). Float noise can leave the leftover negative by an ulp's
// worth of cents; then cents are TAKEN one each from the smallest fractions
// instead. Every account lands within one cent of round(balance*100).
//
//   node tools/centmigrate.mjs --test

export function centify(balances, targetCents) {
  const list = Array.isArray(balances) ? balances.slice() : Object.entries(balances);
  if (targetCents == null) {
    let sum = 0;
    for (const [, v] of list.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1))) sum += v;
    targetCents = Math.round(sum * 100);
  }
  const rows = list.map(([name, v]) => {
    const raw = v * 100;
    const base = Math.floor(raw);
    return { name, base, frac: raw - base };
  });
  let leftover = targetCents - rows.reduce((s, r) => s + r.base, 0);
  const byFrac = (dir) => rows.slice().sort((a, b) =>
    dir * (b.frac - a.frac) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (leftover > 0) for (const r of byFrac(1)) { if (!leftover) break; r.base += 1; leftover--; }
  else if (leftover < 0) for (const r of byFrac(-1)) { if (!leftover) break; r.base -= 1; leftover++; }
  return new Map(rows.map(r => [r.name, r.base]));
}

// ---- self-test ------------------------------------------------------------
function test() {
  const cases = [];
  const expect = (name, ok, detail) => cases.push([name, ok, detail]);
  const sum = (m) => [...m.values()].reduce((s, v) => s + v, 0);

  // the adversarial classics
  let m = centify([["A", 0.005], ["B", 0.005], ["C", 0.005], ["D", 0.005]]);
  expect("all half-cents conserve", sum(m) === Math.round(0.02 * 100), [...m]);
  expect("half-cent ties break by name", m.get("A") >= m.get("D"), [...m]);

  m = centify([["COINS", 148.494], ["CREDIT", -32.505], ["FUND", 0]]);
  const t = Math.round((148.494 + -32.505 + 0) * 100);
  expect("negatives (credit) participate", sum(m) === t, [...m, "target " + t]);

  m = centify([]);
  expect("empty is empty and zero", sum(m) === 0 && m.size === 0, [...m]);

  m = centify([["A", 0.1], ["B", 0.2], ["C", -0.3]]);
  expect("float dust conserves (0.1+0.2-0.3)", sum(m) === 0, [...m]);

  m = centify([["A", 12.34], ["B", 56.78]]);
  expect("already-clean cents are identity", m.get("A") === 1234 && m.get("B") === 5678, [...m]);

  // explicit target wins over the derived one
  m = centify([["A", 1.004], ["B", 1.004]], 201);
  expect("explicit target honored", sum(m) === 201, [...m]);

  // per-account bound: never more than one cent from round(v*100)
  // (guaranteed by floor/floor+1 in the positive-leftover path; the
  // negative-leftover path may move one account a second cent only when the
  // target itself was computed under a different summation order)
  m = centify([["A", 10.239], ["B", 0.111], ["C", 7.65]]);
  let bounded = true;
  for (const [n, v] of [["A", 10.239], ["B", 0.111], ["C", 7.65]])
    if (Math.abs(m.get(n) - Math.round(v * 100)) > 1) bounded = false;
  expect("each account within a cent of its own rounding", bounded, [...m]);

  // 1000 seeded-random towns: exact conservation + determinism, every time
  let s = 1234567;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  let allOk = true, deterministic = true;
  for (let i = 0; i < 1000; i++) {
    const n = 2 + Math.floor(rnd() * 30);
    const bal = [];
    for (let j = 0; j < n; j++) bal.push(["N" + j, (rnd() * 4000 - 500) / (rnd() < 0.3 ? 7 : 1)]);
    let tot = 0;
    for (const [, v] of bal.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1))) tot += v;
    const target = Math.round(tot * 100);
    const a = centify(bal), b = centify(bal.slice().reverse());
    if (sum(a) !== target) { allOk = false; break; }
    for (const [k, v] of a) if (b.get(k) !== v) deterministic = false;
  }
  expect("1000 random towns conserve exactly", allOk, "seeded LCG sweep");
  expect("input order never matters", deterministic, "forward vs reversed");

  let fail = 0;
  for (const [name, ok, detail] of cases) {
    console.log(`${ok ? "PASS" : "FAIL"}  centmigrate: ${name}${ok ? "" : "  " + JSON.stringify(detail)}`);
    if (!ok) fail++;
  }
  console.log(`${cases.length - fail}/${cases.length} passed`);
  process.exit(fail ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith("centmigrate.mjs")) {
  if (process.argv.includes("--test")) test();
  else { console.log("usage: centmigrate.mjs --test  (import centify() for real use)"); process.exit(2); }
}

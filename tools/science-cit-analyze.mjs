#!/usr/bin/env node
// The citizen-mind science experiment's bucket pass: read the banked
// divergence corpus (tools/headless.mjs --citdivlog --divout), bucket every
// brain-vs-script disagreement by directional class pair, and cross it with
// the per-seed outcome, so the knockout arms know where to aim.
//   node tools/science-cit-analyze.mjs design/cs35-research/receipts-cit-science
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = process.argv[2] || "design/cs35-research/receipts-cit-science";
const live = readdirSync(dir).filter(f => /^cit-sb\d+\.json$/.test(f)).sort();
const script = readdirSync(dir).filter(f => /^cit-sb\d+-script\.json$/.test(f)).sort();

const pairs = {};       // "brain>script" -> { n, actors:Set, days:{}, seeds:Set, escN, evictN }
const perSeed = [];     // { seed, sb, evict, div, polls }
for (const f of live) {
  const sb = f.match(/sb(\d+)/)[1];
  for (const row of JSON.parse(readFileSync(join(dir, f), "utf8"))) {
    const escaped = row.evict === null;
    perSeed.push({ seed: row.seed, sb: +sb, evict: row.evict, div: (row.div || []).length,
      polls: row.polls });
    for (const d of row.div || []) {
      const k = d.brain + ">" + d.script;
      const p = pairs[k] = pairs[k] || { n: 0, actors: new Set(), days: {}, seeds: new Set(), esc: 0, ev: 0 };
      p.n++; p.actors.add(d.name); p.days[d.day] = (p.days[d.day] || 0) + 1;
      if (!p.seeds.has(row.seed)) { p.seeds.add(row.seed); if (escaped) p.esc++; else p.ev++; }
    }
  }
}
// the script arm's polls, for the turnout pairing
const scriptPolls = [];
for (const f of script)
  for (const row of JSON.parse(readFileSync(join(dir, f), "utf8")))
    scriptPolls.push({ seed: row.seed, sb: +f.match(/sb(\d+)/)[1], evict: row.evict, polls: row.polls });

const table = Object.entries(pairs).map(([k, p]) => ({
  pair: k, n: p.n, actors: p.actors.size, towns: p.seeds.size,
  townsEscaped: p.esc, townsEvicted: p.ev,
})).sort((a, b) => b.n - a.n);

const totalDiv = table.reduce((s, r) => s + r.n, 0);
console.log(`corpus: ${totalDiv} divergent thinks across ${perSeed.length} towns`);
console.log("pair".padEnd(34), "thinks", "share", "actors", "towns", "esc/ev");
for (const r of table)
  console.log(r.pair.padEnd(34), String(r.n).padStart(6), (100 * r.n / totalDiv).toFixed(1).padStart(5) + "%",
    String(r.actors).padStart(6), String(r.towns).padStart(5), `${r.townsEscaped}/${r.townsEvicted}`);

// per-seed: divergence count vs outcome (does more thinking correlate with escape?)
const esc = perSeed.filter(s => s.evict === null), ev = perSeed.filter(s => s.evict !== null);
const mean = a => a.length ? (a.reduce((s, x) => s + x.div, 0) / a.length).toFixed(1) : "-";
console.log(`\nescaped towns ${esc.length}: mean ${mean(esc)} divergences; evicted ${ev.length}: mean ${mean(ev)}`);

// turnout: live vs script, per completed poll
const flat = (rows) => rows.flatMap(r => r.polls.map(p => p.turnout));
const lt = flat(perSeed), st = flat(scriptPolls);
const m = a => a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(2) : "-";
console.log(`turnout LIVE: ${lt.length} polls, mean ${m(lt)} papers [${lt.join(",")}]`);
console.log(`turnout SCRIPT: ${st.length} polls, mean ${m(st)} papers [${st.join(",")}]`);

writeFileSync(join(dir, "bucket-table.json"), JSON.stringify({ table, totalDiv,
  perSeed, scriptPolls }, null, 1));
console.log(`\nwrote ${join(dir, "bucket-table.json")}`);

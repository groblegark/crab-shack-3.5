#!/usr/bin/env node
// The citizen-mind science experiment's receipt reader: given one or more
// kube-run receipt directories (design/cs35-research/kube-runs/<release>),
// parse each arm's stdoutTail for the survived line, the polls line, and the
// citdivsum block, then print the cross-arm comparison the write-up quotes.
// Pure JSON aggregation — no sim runs anywhere near this file.
//   node tools/science-cit-analyze.mjs design/cs35-research/kube-runs/<release> [...]
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dirs = process.argv.slice(2);
if (!dirs.length) { console.error("usage: science-cit-analyze.mjs <kube-run dir>..."); process.exit(2); }

const arms = [];
for (const dir of dirs)
  for (const f of readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("summary")))
    arms.push({ dir, file: f, ...JSON.parse(readFileSync(join(dir, f), "utf8")) });

// The receipt's own `verdict` field carries the survived line whole; the
// 4KB stdoutTail can (and did) cut it. Read verdict first, tail as fallback.
const parsed = arms.map(a => {
  const tail = a.stdoutTail || "";
  const surv = /survived (\d+)\/(\d+); eviction days: ([\d,]+)/.exec(a.verdict || "")
    || /survived (\d+)\/(\d+); eviction days: ([\d,]+)/.exec(tail);
  const polls = /polls turnout\/roll: (.*)/.exec(tail);
  const grab = (tag) => { const m = new RegExp(">> " + tag + " (.*)").exec(tail);
    if (!m) return null; try { return JSON.parse(m[1]); } catch { return null; } };
  const legacy = grab("citdivsum");
  const buckets = grab("citbuckets") || (legacy && legacy.buckets) || null;
  const divsum = buckets ? { buckets, firsts: grab("citstories") || (legacy && legacy.firsts) || {},
    seeds: grab("citseeds") || (legacy && legacy.seeds) || [] } : null;
  return {
    armId: a.armId, exit: a.exitCode, wallMs: a.wallMs,
    survived: surv ? +surv[1] : null, of: surv ? +surv[2] : null,
    evictions: surv ? surv[3].split(",").map(Number) : null,
    polls: polls ? polls[1].trim() : null,
    divsum,
  };
});

for (const p of parsed.sort((x, y) => x.armId.localeCompare(y.armId)))
  console.log(p.armId.padEnd(28), `exit=${p.exit}`,
    p.survived != null ? `survived ${p.survived}/${p.of} [${p.evictions.join(",")}]` : "(no survived line)");

// variant totals: armId convention <variant>-t<offset> (4-town arms; offset
// 0..15 -> block sb0, 16..31 -> sb16, 32..47 -> sb32). Legacy -sb<NN> ids
// (16-town arms) parse too.
const byVariant = {};
for (const p of parsed) {
  const m = /^(.*)-(?:t|sb)(\d+)$/.exec(p.armId);
  if (!m || p.survived == null) continue;
  const block = String(Math.floor(+m[2] / 16) * 16);
  const v = byVariant[m[1]] = byVariant[m[1]] || { survived: 0, of: 0, blocks: {} };
  v.survived += p.survived; v.of += p.of;
  v.blocks[block] = (v.blocks[block] || 0) + p.survived;
}
console.log("\nvariant totals:");
for (const [v, t] of Object.entries(byVariant))
  console.log(` ${v.padEnd(26)} ${t.survived}/${t.of}  (sb0/16/32: ${t.blocks["0"] ?? "-"}/${t.blocks["16"] ?? "-"}/${t.blocks["32"] ?? "-"})`);

// merged divergence buckets across live arms
const buckets = {}, firsts = {}, seeds = [];
for (const p of parsed) if (p.divsum) {
  for (const [k, n] of Object.entries(p.divsum.buckets)) buckets[k] = (buckets[k] || 0) + n;
  for (const [k, f] of Object.entries(p.divsum.firsts || {})) (firsts[k] = firsts[k] || []).push(...f);
  seeds.push(...p.divsum.seeds);
}
const total = Object.values(buckets).reduce((s, n) => s + n, 0);
if (total) {
  console.log(`\ndivergence corpus: ${total} disagreements across ${seeds.length} towns`);
  for (const [k, n] of Object.entries(buckets).sort((a, b) => b[1] - a[1]))
    console.log(` ${k.padEnd(34)} ${String(n).padStart(6)}  ${(100 * n / total).toFixed(1)}%`);
  const esc = seeds.filter(s => s.evict === null), ev = seeds.filter(s => s.evict !== null);
  const mean = a => a.length ? (a.reduce((s, x) => s + x.n, 0) / a.length).toFixed(1) : "-";
  console.log(`escaped towns ${esc.length}: mean ${mean(esc)} divergences; evicted ${ev.length}: mean ${mean(ev)}`);
}

// turnout: mean papers per completed poll, per variant
console.log("\nturnout (papers/roll per poll):");
for (const p of parsed) if (p.polls) {
  const t = [...p.polls.matchAll(/(\d+)\/(\d+)/g)].map(m => [+m[1], +m[2]]);
  const mt = t.length ? (t.reduce((s, x) => s + x[0], 0) / t.length).toFixed(2) : "-";
  console.log(` ${p.armId.padEnd(26)} ${t.length} polls, mean ${mt} papers`);
}

const out = join(dirs[0], "summary-cit-science.json");
writeFileSync(out, JSON.stringify({ parsed, byVariant, buckets, firsts, seeds }, null, 1));
console.log(`\nwrote ${out}`);

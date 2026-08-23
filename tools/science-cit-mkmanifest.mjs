#!/usr/bin/env node
// Emit the citizen-science manifests in the SMALL-ARM shape: 4 towns per
// arm, 2 workers, modest heaps — the residency fight disappears instead of
// being tuned. Arm id <variant>-t<offset>: offset is the matrix-town offset
// (headless --seedbase), so offsets 0..15 = block sb0, 16..31 = sb16,
// 32..47 = sb32; the analyzer regroups.
//   node tools/science-cit-mkmanifest.mjs corpus
//   node tools/science-cit-mkmanifest.mjs knock "none>shack:drink" "vote:vote" ...
import { writeFileSync } from "fs";

const mode = process.argv[2];
const pairs = process.argv.slice(3);
const slug = (p) => p.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "").toLowerCase();
const OFFSETS = Array.from({ length: 12 }, (_, i) => i * 4);   // 0,4,...,44

const arm = (id, extra) => ({
  id, entry: "tools/headless.mjs", env: { SIMLIB_REALM: "main" },
  args: ["--days", "30", "--seeds", "4", "--seedbase", String(extra.offset),
    "--jobs", "2", "--workermem", "600", "--buy", "chef,table", ...extra.flags, "--quiet"],
});

let name, note, arms = [];
if (mode === "corpus") {
  name = "cit-science-corpus";
  note = "Citizen-mind science, phase 1 (small-arm shape): 4 towns per arm, 2 workers, 4Gi pods. live-* arms carry the divergence log; script-* arms are the same instrument with the citizen policy off. Baselines REBUILT in this instrument per the runbook's same-instrument rule.";
  for (const o of OFFSETS) arms.push(arm(`live-t${o}`, { offset: o, flags: ["--citdivlog"] }));
  for (const o of OFFSETS) arms.push(arm(`script-t${o}`, { offset: o, flags: ["--citscript"] }));
} else if (mode === "knock" && pairs.length) {
  name = "cit-science-knockouts";
  note = "Citizen-mind science, phase 2 (small-arm shape): class-selective overrides. Each arm runs the LIVE brain everywhere EXCEPT the named disagreement (script rules that think); growth delta vs phase 1's live arms is that disagreement's causal share.";
  for (const p of pairs) for (const o of OFFSETS)
    arms.push(arm(`k-${slug(p)}-t${o}`, { offset: o, flags: ["--citknock", p] }));
} else {
  console.error("usage: science-cit-mkmanifest.mjs corpus | knock <pair>...");
  process.exit(2);
}

const manifest = {
  name, note,
  // measured, not assumed: healthy small arms passed 58m of wall; the chart's
  // 3600s default axed them all with zero receipts. 3h leaves real margin.
  activeDeadlineSeconds: 10800,
  resources: { requests: { cpu: "2", memory: "3Gi" }, limits: { cpu: "3", memory: "4Gi" } },
  arms,
  nodeSelector: { "karpenter.sh/nodepool": "ephemeral-pool" },
  tolerations: [{ key: "gasboat.ephemeral", operator: "Equal", value: "true", effect: "NoSchedule" }],
};
const out = `experiments/${name}.json`;
writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${out}: ${arms.length} arms x 4 towns`);

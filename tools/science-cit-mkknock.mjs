#!/usr/bin/env node
// Emit the phase-2 knockout manifest: one arm per (class-pair override x
// matrix block). Pure JSON generation — pairs come from phase 1's buckets.
//   node tools/science-cit-mkknock.mjs "none>shack:drink" "vote:vote" ...
import { writeFileSync } from "fs";

const pairs = process.argv.slice(2);
if (!pairs.length) { console.error("usage: science-cit-mkknock.mjs <pair|class>..."); process.exit(2); }
const slug = (p) => p.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "").toLowerCase();

const arms = [];
for (const p of pairs)
  for (const sb of [0, 16, 32])
    arms.push({
      id: `k-${slug(p)}-sb${sb}`,
      entry: "tools/headless.mjs",
      env: { SIMLIB_REALM: "main" },
      args: ["--days", "30", "--seeds", "16", "--seedbase", String(sb), "--jobs", "7",
        "--buy", "chef,table", "--citknock", p, "--quiet"],
    });

const manifest = {
  name: "cit-science-knockouts",
  note: "Citizen-mind science, phase 2: class-selective overrides. Each arm runs the LIVE brain everywhere EXCEPT the named disagreement (script rules that think). The growth delta vs phase 1's live arms is that disagreement's causal share. Same entry, env, seeds, and instrument as phase 1.",
  resources: { requests: { cpu: "7", memory: "6Gi" }, limits: { cpu: "8", memory: "8Gi" } },
  arms,
  nodeSelector: { "karpenter.sh/nodepool": "ephemeral-pool" },
  tolerations: [{ key: "gasboat.ephemeral", operator: "Equal", value: "true", effect: "NoSchedule" }],
};
writeFileSync("experiments/cit-science-knockouts.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote experiments/cit-science-knockouts.json (${arms.length} arms: ${pairs.join(", ")} x sb0/16/32)`);

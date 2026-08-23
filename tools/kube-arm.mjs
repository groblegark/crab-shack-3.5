#!/usr/bin/env node
// kube-arm.mjs — the POD-SIDE runner for the crab-science chart (v2).
//
// One indexed pod = one ARM of a committed experiment manifest. The pod:
//   1. reads $MANIFEST (a repo-relative JSON path, committed at the pinned
//      SHA the initContainer checked out — the pod runs committed code ONLY),
//   2. picks arms[$JOB_COMPLETION_INDEX],
//   3. spawns `node <entry> <args...>` with the arm's (allowlisted) env,
//   4. banks ONE ConfigMap receipt through the API before exiting — because
//      on the ephemeral pool the node, and every log line on it, is reaped
//      the moment the pod completes. Stdout is a progress feed, not a
//      result store (learned on a 4,096-town run whose only copy of the
//      science died with karpenter's nodes).
//
// Receipt shape (ConfigMap data["receipt.json"]):
//   { release, armId, index, sha, entry, args, env, exitCode, wallMs,
//     verdict, failures[], jsonTail, stdoutTail }
// - verdict: the last "N/M passed" style line if the tool printed one
// - jsonTail: the last stdout line iff it parses as JSON (batch.mjs --json)
// - stdoutTail capped so the ConfigMap stays far under the 1MB object limit
//
// The exit code is the child's exit code — a red arm is a red pod, and the
// Job's backoffLimit (kept low) is the only retry policy.

import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import https from "https";

const need = (k) => {
  const v = process.env[k];
  if (v == null || v === "") { console.error(`kube-arm: missing env ${k}`); process.exit(2); }
  return v;
};

const manifestPath = need("MANIFEST");
const index = Number(need("JOB_COMPLETION_INDEX"));
const release = need("RELEASE");

let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); }
catch (e) { console.error(`kube-arm: cannot read manifest ${manifestPath}: ${e.message}`); process.exit(2); }
const arms = manifest.arms;
if (!Array.isArray(arms) || !arms.length) { console.error("kube-arm: manifest has no arms"); process.exit(2); }
if (!(index >= 0 && index < arms.length)) { console.error(`kube-arm: index ${index} outside ${arms.length} arms`); process.exit(2); }
const arm = arms[index];

// The entry allowlist: a manifest can only run committed tools/ entrypoints.
// A hostile manifest is still committed code at a pinned SHA, but keeping the
// blast surface to tools/*.mjs makes review one glance.
if (!/^tools\/(?:[\w][\w.-]*\/)*[\w][\w.-]*\.mjs$/.test(arm.entry || "")) {
  console.error(`kube-arm: arm.entry ${JSON.stringify(arm.entry)} not an allowed tools/*.mjs path`);
  process.exit(2);
}
const args = (arm.args || []).map(String);

// Env allowlist: the sim's own switches only. NODE_OPTIONS et al stay out.
const ENV_OK = new Set(["SIMLIB_REALM", "SIMLIB_KERNEL", "SIMLIB_SEARCH"]);
const childEnv = { ...process.env };
for (const [k, v] of Object.entries(arm.env || {})) {
  if (!ENV_OK.has(k)) { console.error(`kube-arm: env ${k} not allowlisted`); process.exit(2); }
  childEnv[k] = String(v);
}

// node:26-slim has no git - the clone lives in the init container. A
// detached checkout leaves the raw SHA in .git/HEAD.
const sha = readFileSync(".git/HEAD", "utf8").trim();
console.log(`kube-arm: release=${release} index=${index} arm=${arm.id || index} sha=${sha}`);
console.log(`kube-arm: node ${arm.entry} ${args.join(" ")}  env=${JSON.stringify(arm.env || {})}`);

const t0 = Date.now();
const run = spawnSync("node", [arm.entry, ...args], {
  env: childEnv, encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
  stdio: ["ignore", "pipe", "inherit"],
});
const wallMs = Date.now() - t0;
const stdout = run.stdout || "";
process.stdout.write(stdout.slice(-8000));   // progress feed for anyone watching live
const exitCode = run.status == null ? 111 : run.status;

const lines = stdout.trim().split("\n");
const last = lines[lines.length - 1] || "";
let jsonTail = null;
try { jsonTail = JSON.parse(last); } catch { /* not a json tool, fine */ }
const verdict = [...lines].reverse().find((l) => /\d+\/\d+ passed|survived|escapes|agreement/.test(l)) || null;
const failures = lines.filter((l) => /^\s*FAIL\s/.test(l)).slice(0, 50);

const receipt = {
  release, armId: arm.id ?? String(index), index, sha,
  entry: arm.entry, args, env: arm.env || {},
  exitCode, wallMs, verdict, failures,
  jsonTail, stdoutTail: stdout.slice(-4000),
};

// Bank the receipt as a ConfigMap via the pod's own ServiceAccount.
const sa = "/var/run/secrets/kubernetes.io/serviceaccount";
const token = readFileSync(sa + "/token", "utf8");
const ns = readFileSync(sa + "/namespace", "utf8");
const name = `${release}-receipt-${index}`;
const body = JSON.stringify({
  apiVersion: "v1", kind: "ConfigMap",
  metadata: { name, labels: { "crab-science/receipt": release } },
  data: { "receipt.json": JSON.stringify(receipt) },
});
const base = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}/api/v1/namespaces/${ns}/configmaps`;
const opts = (method) => ({
  method, ca: readFileSync(sa + "/ca.crt"),
  headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
});
const send = (method, url) => new Promise((res, rej) => {
  const rq = https.request(url, opts(method), (rs) => {
    let d = ""; rs.on("data", (c) => (d += c));
    rs.on("end", () => res({ code: rs.statusCode, body: d }));
  });
  rq.on("error", rej); rq.end(body);
});
let r = await send("POST", base);
if (r.code === 409) r = await send("PUT", base + "/" + name);
if (r.code >= 300) { console.error("kube-arm: receipt write FAILED", r.code, r.body.slice(0, 400)); process.exit(1); }
console.log(`kube-arm: receipt banked ${name} (exit ${exitCode}, ${wallMs}ms)`);
process.exit(exitCode);

#!/usr/bin/env node
// kube.mjs — the OPERATOR-SIDE verb for parallel runs on the cluster.
// Policy (Matt, 2026-08-23): any parallel node runs use the kubernetes
// infrastructure; the laptop is out of the fan-out business.
//
//   node tools/kube.mjs run <manifest.json> [--ref SHA] [--wait] [--keep]
//                           [--parallelism N] [--out DIR] [--remote NAME]
//   node tools/kube.mjs status  <release>
//   node tools/kube.mjs collect <release> [--out DIR]
//   node tools/kube.mjs clean   <release>
//
// `run --wait` = run -> watch -> collect -> clean, one command, receipts
// kept locally under design/cs35-research/kube-runs/<release>/.
//
// No secrets here: uses the operator's ambient AWS SSO session + kubeconfig
// and FAILS LOUD with the login command when the session is dead. Refuses
// any kube context that is not the gasboat cluster — the account rules are
// not negotiable (fics-prod-v2 is customer production; nothing here may
// ever point at it).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { join } from "path";

// AWS_PROFILE is FORWARDED, never invented. The operator's Mac authenticates
// by SSO profile; a fleet pod authenticates by IRSA (AWS_ROLE_ARN +
// AWS_WEB_IDENTITY_TOKEN_FILE) and has no profile at all. Defaulting the var
// to a profile name that does not exist in the pod's config broke a WORKING
// identity - `aws sts get-caller-identity` succeeded ambiently and failed
// under the injected profile with "The config profile (gasboat-prod) could
// not be found", which preflight then reported as "AWS session dead".
const PROFILE = process.env.AWS_PROFILE || null;
const NS = "crab-science";   // all runs, receipts, and SAs live here
const env = PROFILE ? { ...process.env, AWS_PROFILE: PROFILE } : { ...process.env };
const sh = (cmd, opts = {}) => (execSync(cmd, { encoding: "utf8", env, ...opts }) || "").trim();
const shq = (cmd) => { try { return sh(cmd, { stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const die = (msg) => { console.error(`kube: ${msg}`); process.exit(1); };

const [verb, target, ...rest] = process.argv.slice(2);
const flag = (name, dflt = null) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : dflt;
};
const has = (name) => rest.includes(name);

// The remote is RESOLVED, never named: the operator's Mac calls it cs35repo,
// a pod's fresh clone calls it origin. Naming one killed every pod caller at
// doRun's git fetch - which runs BEFORE preflight, so the git error masked
// the real finding (no kube context, no eks:* on the pod principal).
function remote() {
  const override = flag("--remote");
  if (override) return override;
  const names = (shq("git remote") || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (!names.length) die("this checkout has no git remote - the pod clones the remote, so there is nothing to clone from");
  return names.includes("origin") ? "origin" : names[0];
}

// ---------- preflight ----------
function preflight() {
  const who = shq(`aws sts get-caller-identity --query Arn --output text`);
  if (!who) die(`AWS session dead or expired. Run:  aws sso login --profile ${PROFILE || "gasboat-prod"}`);
  const ctx = shq("kubectl config current-context") || "";
  if (!/gasboat/.test(ctx)) die(`kube context "${ctx}" is not the gasboat cluster - refusing. (kubectl config use-context <prod-gasboat-eks arn>)`);
  return { who, ctx };
}

// ---------- run ----------
function doRun() {
  if (!target) die("run wants a manifest path, e.g. experiments/suite-312.json");
  if (!existsSync(target)) die(`no such manifest: ${target}`);
  const ref = flag("--ref") || sh("git rev-parse HEAD");

  // The pod runs COMMITTED code at a PUSHED SHA - nothing else exists to it.
  const committed = shq(`git cat-file -p ${ref}:${target}`);
  if (committed == null) die(`${target} is not committed at ${ref.slice(0, 10)} - commit it first`);
  const disk = readFileSync(target, "utf8");
  if (committed.trim() !== disk.trim()) die(`${target} on disk differs from the committed copy at ${ref.slice(0, 10)} - commit your edits`);
  sh(`git fetch ${remote()} --quiet`);
  if (!shq(`git branch -r --contains ${ref}`)) die(`${ref.slice(0, 10)} is not on any remote branch - push first (the pod clones the remote)`);

  const manifest = JSON.parse(committed);
  if (!Array.isArray(manifest.arms) || !manifest.arms.length) die("manifest has no arms[]");
  const arms = manifest.arms.length;
  const name = (manifest.name || "run").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
  const release = `cs-${name}-${ref.slice(0, 7)}-${Date.now().toString(36).slice(-4)}`;

  preflight();

  // Per-manifest resources ride a generated values overlay.
  const overlay = { gitRef: ref, manifest: target, arms };
  if (manifest.resources) overlay.resources = manifest.resources;
  if (manifest.nodeSelector) overlay.nodeSelector = manifest.nodeSelector;
  if (manifest.tolerations) overlay.tolerations = manifest.tolerations;
  const par = flag("--parallelism");
  if (par) overlay.parallelism = Number(par);
  const ovPath = `/tmp/kube-values-${release}.json`;
  writeFileSync(ovPath, JSON.stringify(overlay, null, 2));

  console.log(`kube: installing ${release}  (${arms} arms, ref ${ref.slice(0, 10)}, manifest ${target})`);
  sh(`helm install ${release} deploy/crab-science -n ${NS} --create-namespace -f ${ovPath}`, { stdio: "inherit" });
  console.log(`kube: installed. watch:   node tools/kube.mjs status ${release}`);

  if (has("--wait")) {
    watch(release);
    doCollect(release);
    if (!has("--keep")) doClean(release);
  }
  return release;
}

function jobState(release) {
  const j = shq(`kubectl -n ${NS} get job ${release} -o json`);
  if (!j) return null;
  const s = JSON.parse(j).status || {};
  return { active: s.active || 0, succeeded: s.succeeded || 0, failed: s.failed || 0 };
}

function watch(release) {
  const t0 = Date.now();
  for (;;) {
    const s = jobState(release);
    if (!s) die(`job ${release} not found`);
    const cond = shq(`kubectl -n ${NS} get job ${release} -o jsonpath='{.status.conditions[?(@.status=="True")].type}'`) || "";
    process.stdout.write(`\rkube: ${release}  active=${s.active} ok=${s.succeeded} failed=${s.failed}  ${((Date.now() - t0) / 1000 | 0)}s   `);
    if (/Complete|Failed/.test(cond)) { console.log(`\nkube: job ${cond}`); return; }
    spawnSync("sleep", ["15"]);
  }
}

// ---------- collect ----------
function doCollect(release = target) {
  if (!release) die("collect wants a release name");
  preflight();
  const out = flag("--out") || join("design/cs35-research/kube-runs", release);
  mkdirSync(out, { recursive: true });
  const cms = JSON.parse(sh(`kubectl -n ${NS} get configmap -l crab-science/receipt=${release} -o json`)).items;
  if (!cms.length) die(`no receipts for ${release} (pods still running, or banked under another label?)`);
  let pass = 0, fail = 0, red = [];
  const rows = [];
  for (const cm of cms) {
    const r = JSON.parse(cm.data["receipt.json"]);
    writeFileSync(join(out, `${r.armId}.json`), JSON.stringify(r, null, 2));
    const m = /(\d+)\/(\d+) passed/.exec(r.verdict || "");
    if (m) { pass += +m[1]; fail += +m[2] - +m[1]; }
    if (r.exitCode !== 0) red.push(r.armId);
    for (const f of r.failures || []) red.push(`${r.armId}: ${f.trim()}`);
    rows.push(`  ${r.armId.padEnd(24)} exit=${r.exitCode} ${((r.wallMs / 1000) | 0)}s  ${r.verdict || ""}`);
  }
  rows.sort().forEach((l) => console.log(l));
  console.log(`kube: ${cms.length} receipts -> ${out}`);
  if (pass + fail) console.log(`kube: MERGED SUITE VERDICT: ${pass}/${pass + fail} passed${fail ? "  <-- RED" : ""}`);
  if (red.length) { console.log("kube: red arms/failures:"); red.slice(0, 40).forEach((l) => console.log("   " + l)); }
  return { receipts: cms.length, pass, fail };
}

// ---------- clean ----------
function doClean(release = target) {
  if (!release) die("clean wants a release name");
  preflight();
  shq(`helm uninstall ${release} -n ${NS}`);
  shq(`kubectl -n ${NS} delete configmap -l crab-science/receipt=${release}`);
  console.log(`kube: uninstalled ${release}, receipts deleted from cluster (collect first next time if you didn't).`);

  // THE SCALE-DOWN CHECK. Matt watches spend: a run that leaves karpenter
  // nodes idling is a leak. Poll the run's own node selector until the
  // nodes it summoned are gone; with no selector, report total node count
  // and tell the operator what to verify by hand.
  const sel = flag("--node-selector") || "karpenter.sh/nodepool=ephemeral-pool";
  const t0 = Date.now();
  for (;;) {
    const nodes = sel
      ? (shq(`kubectl get nodes -l ${sel} --no-headers`) || "").split("\n").filter(Boolean)
      : null;
    if (nodes === null) {
      const total = (shq("kubectl get nodes --no-headers") || "").split("\n").filter(Boolean).length;
      console.log(`kube: no --node-selector given; cluster has ${total} nodes. VERIFY the ephemeral pool drained (kubectl get nodes) - stray nodes are money.`);
      return;
    }
    if (!nodes.length) { console.log("kube: scale-down verified - selector matches 0 nodes."); return; }
    if (Date.now() - t0 > 15 * 60 * 1000) { console.log(`kube: WARNING - ${nodes.length} nodes still up after 15min: ${nodes.map((n) => n.split(/\s+/)[0]).join(", ")}. Investigate NOW.`); return; }
    process.stdout.write(`\rkube: waiting for scale-down, ${nodes.length} nodes still up (${((Date.now() - t0) / 1000) | 0}s)  `);
    spawnSync("sleep", ["30"]);
  }
}

function doStatus(release = target) {
  if (!release) die("status wants a release name");
  preflight();
  const s = jobState(release);
  if (!s) die(`job ${release} not found (ttl may have reaped it - receipts survive: collect ${release})`);
  console.log(`kube: ${release}  active=${s.active} ok=${s.succeeded} failed=${s.failed}`);
  console.log(shq(`kubectl -n ${NS} get pods -l app.kubernetes.io/instance=${release} --no-headers`) || "(no pods)");
}

if (verb === "run") doRun();
else if (verb === "collect") doCollect();
else if (verb === "clean") doClean();
else if (verb === "status") doStatus();
else die("verbs: run <manifest> [--ref SHA] [--wait] [--keep] [--parallelism N] | status <release> | collect <release> [--out DIR] | clean <release> [--node-selector k=v]");

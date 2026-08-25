// Does the live tip own a gate verdict, or is it coasting on an expired one?
//
// THE FAILURE THIS MECHANIZES (task kd-GzmvXbkSkH). The trunk shipped ungated
// to groblegark.github.io/crab-shack-3.5 TWICE in one day (kd-F3tOXnIa2n,
// kd-j8NNZkv3At), both caught by accident. The practice that should have caught
// it is not absent — it is MANUAL: a receipt README carries a transfer-forward
// argument of a precise shape (inpod-suite-340125f-g8k, verbatim):
//
//   "Every game engine file (font/ppu/sprites/crabs/game.js), both culture
//    fixtures, cultureways.js, simlib.mjs AND suite.mjs are byte-identical
//    between 340125f and 4d92551 ... So this 378/378 verdict transfers exactly
//    to the current live tip."
//
// That argument was CORRECT when written. Then main advanced to 4c2302a,
// game.js stopped being byte-identical, and the prose kept asserting a transfer
// it no longer earned. Nothing re-evaluates a precondition when the tip moves.
// This tool IS that re-evaluation, run on demand: the same file set the READMEs
// reason over, compared by git, in one sub-second pass with no sim.
//
// WHAT IT REPORTS (a receipt's EXISTENCE for this tree, never a verdict of its
// own — conflating "a receipt names this SHA" with "this SHA is green" would
// rebuild the exact confusion this guards against):
//
//   GREEN  a receipt already names the tip in its OWN committed tree — print it,
//          verbatim verdict and all. If that receipt's verdict is RED, say RED.
//   AMBER  no receipt names the tip, but the newest ancestor a receipt DOES name
//          is byte-identical to the tip across the whole gate-relevant file set:
//          the verdict transfers; the tip owes only a stamp/tooling re-gate.
//          The checked file set is printed, so the argument is auditable.
//   RED    the gate-relevant files differ from that newest gated ancestor (or no
//          gated ancestor exists at all). Names the files and their line counts.
//          This is the state main was in, twice, that nothing detected.
//
// TWO TRAPS, both load-bearing (see the task):
//
//  1. THE RECEIPT DIR IS GITIGNORED. `.gitignore` line 12 carries
//     `design/cs35-research/kube-runs/`, yet the receipts are force-tracked
//     (`git add -f`). A tool that walks the worktree and trusts the ignore rule
//     sees ZERO receipts and reports a confident false RED. So we read the
//     corpus through git plumbing (`ls-files` / `ls-tree`), which lists tracked
//     paths regardless of ignore state — never the filesystem.
//
//  2. A RECEIPT MUST NOT CERTIFY A TIP THAT PREDATES IT. Receipts are banked in
//     their own later commit — 4c2302a's receipt landed at 87b029b, one commit
//     AFTER it. So "some tracked file names the tip" is true in today's worktree
//     for 4c2302a even though 4c2302a shipped ungated. The honest question is
//     "was this tree gated while it was (or before it became) the tip", so the
//     GREEN corpus is the tip's OWN committed tree (`git ls-tree <tip>`): a
//     receipt banked afterwards is correctly invisible. Walk-back ancestors are
//     likewise only-proper-ancestors, read from the full tracked corpus.
//
// THE FILE SET is exactly what the receipt READMEs transfer over — the game
// engine (font/ppu/sprites/crabs/game.js), the page that loads it (index.html),
// the culture pipeline the suite fixtures itself from (cultureways.js + the two
// pinned culture fixtures), and the harness that renders the verdict
// (tools/suite.mjs, tools/simlib.mjs). version.js is DELIBERATELY EXCLUDED: it
// is the build stamp, the one thing a pure re-gate is allowed to differ in
// ("owes only a stamp re-gate"). Widening this set to make an awkward case pass
// would be discipline-4 cheating; each member earns its place by appearing in
// the READMEs' own transfer argument.
//
// A GATE RECEIPT is a suite receipt: entry === "tools/suite.mjs". The balance
// matrices (batch/headless), the mcp-check batteries and the neuro spikes live
// in the same dir but are not gates and do not transfer a pass/fail verdict —
// the READMEs never reason a suite verdict forward from them.
//
// ACCEPTANCE (available today, no fixture — discipline 3, it bites on arrival):
//   node tools/gatecheck.mjs --ref 4c2302a   -> RED,   names game.js (basis 340125f)
//   node tools/gatecheck.mjs --ref 4d92551   -> AMBER, verdict transfers from 340125f
// Both are real history. The default --ref is HEAD.
//
// Pure git plumbing, one process, sub-second: allowed locally under KUBE POLICY.
// Exit code: 0 for GREEN/AMBER (the tip owns or inherits a verdict), 1 for RED
// (the tip is ungated) or usage error — so CI or a merge ritual can gate on it.

import { execFileSync } from "node:child_process";

const RECEIPT_DIR = "design/cs35-research/kube-runs";

// The transfer-forward file set — the exact files the receipt READMEs reason
// over. version.js is excluded on purpose (see the header).
const GATE_FILES = [
  "font.js",
  "ppu.js",
  "sprites.js",
  "crabs.js",
  "game.js",
  "index.html",
  "cultureways.js",
  "tools/fixtures/cultures-pig.json",
  "design/cultureways/gullway.json",
  "tools/suite.mjs",
  "tools/simlib.mjs",
];

const GATE_ENTRY = "tools/suite.mjs"; // what makes a receipt a GATE receipt

// ---- git helpers -----------------------------------------------------------

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}
// A non-throwing predicate: `git merge-base --is-ancestor` exits 1 (throws) when
// false, 0 when true. Any other exit (bad SHA) also throws — treated as "not an
// ancestor", which is the safe direction for a gate that fails closed.
function isAncestor(a, b) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", a, b], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function commitDistance(from, to) {
  return parseInt(git("rev-list", "--count", `${from}..${to}`).trim(), 10);
}
function resolveSha(ref) {
  try {
    // stderr silenced: we report an unresolvable ref ourselves, in one voice.
    return execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

// ---- receipt corpus --------------------------------------------------------
//
// A "source" is either "worktree" (git ls-files / show :path — the full tracked
// corpus, ignore-rule-immune) or a commit-ish (git ls-tree / show <sha>:path —
// only what that commit's tree carries). We read every tracked *.json under the
// receipt dir, keep the ones whose `entry` marks them a gate (suite) receipt,
// and index them by the SHA they claim, remembering the receipt directory.

function listReceiptJson(source) {
  if (source === "worktree") {
    return git("ls-files", "--", RECEIPT_DIR)
      .split("\n")
      .filter((f) => f.endsWith(".json"));
  }
  return git("ls-tree", "-r", "--name-only", source, "--", RECEIPT_DIR)
    .split("\n")
    .filter((f) => f.endsWith(".json"));
}
function readJson(source, path) {
  const spec = source === "worktree" ? `:${path}` : `${source}:${path}`;
  try {
    return JSON.parse(git("show", spec));
  } catch {
    return null; // unreadable or non-JSON — skip, don't crash the gate
  }
}

// Returns Map<claimedSha, { sha, dir }> of gate (suite) receipts from `source`.
// One entry per SHA; if several receipts name the same SHA the first tracked one
// wins (they are the same tree, so the choice is immaterial to the verdict).
function gateReceipts(source) {
  const bySha = new Map();
  for (const path of listReceiptJson(source)) {
    let doc = readJson(source, path);
    if (Array.isArray(doc)) doc = doc[0]; // some receipts are a shard array
    if (!doc || typeof doc !== "object") continue;
    if (doc.entry !== GATE_ENTRY) continue; // not a gate receipt
    if (typeof doc.sha !== "string" || !doc.sha) continue;
    const dir = path.slice(0, path.lastIndexOf("/"));
    if (!bySha.has(doc.sha)) bySha.set(doc.sha, { sha: doc.sha, dir });
  }
  return bySha;
}

// Load a receipt directory's overall verdict for printing. A receipt is GREEN
// only if EVERY tracked shard it carries passed (exitCode 0, no failures); if
// any shard failed we surface that — a named receipt that says RED must say RED.
function receiptVerdict(source, dir) {
  const shards = listReceiptJson(source).filter((f) => f.startsWith(dir + "/"));
  let ok = 0;
  let bad = 0;
  const lines = [];
  const failures = [];
  for (const path of shards) {
    let doc = readJson(source, path);
    if (Array.isArray(doc)) doc = doc[0];
    if (!doc || typeof doc !== "object" || doc.entry !== GATE_ENTRY) continue;
    const failed = doc.exitCode !== 0 || (Array.isArray(doc.failures) && doc.failures.length > 0);
    if (failed) {
      bad++;
      if (Array.isArray(doc.failures)) failures.push(...doc.failures);
    } else {
      ok++;
    }
    if (doc.verdict) lines.push(String(doc.verdict));
  }
  return { green: bad === 0 && ok > 0, ok, bad, lines, failures };
}

// ---- gate-file diff --------------------------------------------------------
//
// The one comparison the whole verdict rests on: are the gate-relevant files
// byte-identical between `basis` and `tip`? `git diff --numstat` over exactly
// GATE_FILES; empty output === identical. Returns [{file, added, deleted}].

function gateFileDiff(basis, tip) {
  const out = git("diff", "--numstat", basis, tip, "--", ...GATE_FILES).trim();
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [added, deleted, file] = line.split("\t");
    return { file, added, deleted };
  });
}

// ---- the classifier --------------------------------------------------------

function classify(tip) {
  // GREEN: a gate receipt names the tip in the tip's OWN committed tree. A
  // receipt banked into a later commit is correctly invisible here (trap 2).
  const ownTree = gateReceipts(tip);
  if (ownTree.has(tip)) {
    const { dir } = ownTree.get(tip);
    const v = receiptVerdict(tip, dir);
    return { verdict: v.green ? "GREEN" : "RED", basis: tip, receiptDir: dir, receipt: v };
  }

  // Walk-back: proper ancestors named by SOME tracked gate receipt (the full
  // worktree corpus — a transfer basis may live on another branch), nearest by
  // commit distance first.
  const corpus = gateReceipts("worktree");
  const ancestors = [...corpus.keys()]
    .filter((sha) => sha !== tip && isAncestor(sha, tip))
    .map((sha) => ({ sha, dir: corpus.get(sha).dir, dist: commitDistance(sha, tip) }))
    .sort((a, b) => a.dist - b.dist);

  if (ancestors.length === 0) {
    return { verdict: "RED", basis: null, reason: "no gate receipt names the tip or any ancestor" };
  }

  const basis = ancestors[0];
  const diff = gateFileDiff(basis.sha, tip);
  const v = receiptVerdict("worktree", basis.dir);
  // If the nearest gated ancestor is itself RED, the tip cannot inherit a pass
  // from it however identical the files are — a RED basis transfers RED.
  if (!v.green) {
    return { verdict: "RED", basis: basis.sha, receiptDir: basis.dir, receipt: v, diff, basisRed: true };
  }
  if (diff.length === 0) {
    return { verdict: "AMBER", basis: basis.sha, receiptDir: basis.dir, receipt: v };
  }
  return { verdict: "RED", basis: basis.sha, receiptDir: basis.dir, receipt: v, diff };
}

// ---- reporting -------------------------------------------------------------

function short(sha) {
  return sha ? sha.slice(0, 7) : "(none)";
}

function report(tip, tipRef, result) {
  const head = `tip ${short(tip)}${tipRef && tipRef !== tip ? ` (${tipRef})` : ""}`;
  if (result.verdict === "GREEN") {
    console.log(`GREEN  ${head} — a gate receipt names this exact tree.`);
    console.log(`  receipt: ${result.receiptDir}`);
    for (const line of result.receipt.lines) console.log(`    ${line}`);
    return;
  }
  if (result.verdict === "AMBER") {
    console.log(`AMBER  ${head} — no receipt names it, but its verdict transfers from ${short(result.basis)}.`);
    console.log(`  basis receipt: ${result.receiptDir}`);
    for (const line of result.receipt.lines) console.log(`    ${line}`);
    console.log(`  the tip owes only a stamp/tooling re-gate, not a gameplay one.`);
    console.log(`  gate-relevant file set checked byte-identical (${GATE_FILES.length} files):`);
    for (const f of GATE_FILES) console.log(`    = ${f}`);
    return;
  }
  // RED
  if (result.basis === null) {
    console.log(`RED    ${head} — ${result.reason}. This tree is UNGATED.`);
    return;
  }
  if (result.basisRed) {
    console.log(`RED    ${head} — its nearest gated ancestor ${short(result.basis)} is itself RED.`);
    console.log(`  basis receipt: ${result.receiptDir}`);
    for (const fail of result.receipt.failures) console.log(`    ${fail}`);
    return;
  }
  console.log(`RED    ${head} — the gate-relevant files differ from the newest gated ancestor ${short(result.basis)}.`);
  console.log(`  basis receipt: ${result.receiptDir}`);
  console.log(`  no receipt's verdict reaches this tree. It is UNGATED and owes a suite run.`);
  console.log(`  files that differ from ${short(result.basis)}:`);
  for (const d of result.diff) {
    console.log(`    ~ ${d.file}  (+${d.added} / -${d.deleted})`);
  }
}

// ---- main ------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  let ref = "HEAD";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ref") {
      ref = argv[++i];
    } else if (a.startsWith("--ref=")) {
      ref = a.slice("--ref=".length);
    } else if (a === "-h" || a === "--help") {
      console.log("usage: node tools/gatecheck.mjs [--ref <commit-ish>]   (default HEAD)");
      console.log("  Reports whether the tip owns (GREEN), inherits (AMBER), or lacks (RED) a gate verdict.");
      console.log("  Exit 0 for GREEN/AMBER, 1 for RED. Pure git, no sim.");
      process.exit(0);
    } else {
      console.error(`gatecheck: unknown argument ${JSON.stringify(a)}`);
      process.exit(1);
    }
  }
  if (ref === undefined || ref === "") {
    console.error("gatecheck: --ref needs a commit-ish");
    process.exit(1);
  }

  const tip = resolveSha(ref);
  if (!tip) {
    console.error(`gatecheck: cannot resolve ref ${JSON.stringify(ref)} to a commit`);
    process.exit(1);
  }

  const result = classify(tip);
  report(tip, ref, result);
  process.exit(result.verdict === "RED" ? 1 : 0);
}

main();

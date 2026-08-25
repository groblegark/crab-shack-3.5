// Drives the server over real stdio, the way a client does, and exercises
// every tool - including the whole authoring loop with a document that is
// deliberately broken, because "the errors are actionable" is a claim that
// has to be tested rather than asserted.
//
//   node mcp/test-server.mjs
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? "\n        " + detail : ""}`); }
};

const child = spawn("node", ["mcp/server.mjs"], { cwd: root, stdio: ["pipe", "pipe", "inherit"] });
let buf = "";
const waiters = new Map();
child.stdout.setEncoding("utf8");
child.stdout.on("data", (d) => {
  buf += d;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    const w = waiters.get(msg.id);
    if (w) { waiters.delete(msg.id); w(msg); }
  }
});
let nextId = 1;
const rpc = (method, params) => new Promise((res) => {
  const id = nextId++;
  waiters.set(id, res);
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
const call = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args || {} });
  return r.result;
};
const textOf = (r) => (r.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
const imageOf = (r) => (r.content || []).find((c) => c.type === "image");

console.log("crab-science MCP server");

const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {} });
check("initialize returns serverInfo", init.result && init.result.serverInfo.name === "crab-science");
check("initialize points at orientation", /orientation/.test(init.result.instructions || ""));

const tools = (await rpc("tools/list")).result.tools;
check("tools/list is non-empty", tools.length >= 12, `got ${tools.length}`);
check("every tool has a description", tools.every((t) => t.description && t.description.length > 30));
check("every tool has an input schema", tools.every((t) => t.inputSchema && t.inputSchema.type === "object"));

const res = (await rpc("resources/list")).result.resources;
check("resources/list is non-empty", res.length >= 10, `got ${res.length}`);
const orient = await call("orientation");
check("orientation mentions the id rule", /a-z0-9_\]\{0,15\}/.test(textOf(orient)));
check("orientation mentions incentives-not-puppeteering", /INCENTIVES, NOT PUPPETEERING/.test(textOf(orient)));

const pigway = (await rpc("resources/read", { uri: "crabshack://cultureway/pigway" })).result;
check("resources/read returns the pigway", pigway && /"id"/.test(pigway.contents[0].text));

const found = await call("docs_search", { query: "hostile", limit: 5 });
check("docs_search finds the hostile-file ruling", /hostile/i.test(textOf(found)));

// ---- the authoring loop, end to end -------------------------------------
const pig = JSON.parse(textOf(await call("cultureway_get", { id: "pig" })));
check("cultureway_get returns a document", pig && pig.meta && pig.meta.id === "pig");

const good = JSON.parse(textOf(await call("cultureway_validate", { document: pig })));
check("the bundled pig validates clean", good.ok === true && good.build === "built", JSON.stringify(good).slice(0, 200));

// a whole declared shop - the biz-catalog format - validates and builds
const withShop = JSON.parse(JSON.stringify(pig));
withShop.businesses = { mudspa: { name: "THE WALLOW", short: "MUD", sign: "THE WALLOW",
  kind: "shopfront", rent: 30, wage: 22, stalls: 3, stations: { trough: 2, ladle: 1 },
  source: "trough", out: "ladle",
  recipes: [{ id: "wallow", icon: "slop", pay: 12, raw: "fish_raw", raw2: "fruit", steps: [["ladle", 2.0, "slop"]] }] } };
const shopV = JSON.parse(textOf(await call("cultureway_validate", { document: withShop })));
check("a declared business validates and builds", shopV.ok === true && shopV.build === "built", JSON.stringify(shopV).slice(0, 200));

// a document broken in four different ways at once
const bad = JSON.parse(JSON.stringify(pig));
bad.meta.id = "Bad-Id";
bad.art.body.poses.a[2] += "ZZ";
bad.appeal.tastes.fish = 99;
bad.appeal.nudge = { mul100: 9000 };
bad.management = { tableTip: 900 };   // the cents habit - author units are whole dollars
bad.depart = { weights: { wait: 9, nosuchrule: 4 } };
bad.civics = { stakes: [{ id: "levy", terms: [{ name: "potStake", prog: [["PUSHI", 1], ["PUSHI", 2]] }] }],
  ballots: [{ id: "cap", steps: [4, 6, 8, 12] }] };   // no platform stake, a term that never closes with TERM, and a ballot ladder that deletes step 0
bad.settlers = { apron: "yes", walkins: 20 };   // a string answer, and a flood share
bad.people.names.push("A NAME MUCH TOO LONG");
bad.foodways.ingredients = { fish_raw: 1 };   // re-pricing the pier
bad.cards = [{ title: "THE LEDGER", rows: [{ label: "MOOD", obs: "vibes.q20" }] }];   // an unregistered observable
bad.businesses = { mudspa: { name: "THE WALLOW", short: "MUD", sign: "THE WALLOW",
  kind: "shopfront", rent: 99999, owner: "player", stations: { trough: 2 },
  source: "trough", out: "trough",
  recipes: [{ id: "wallow", icon: "slop", pay: 12, raw: "fish_raw", steps: [["grill", 2.0, "slop"]] }] } };
const v = JSON.parse(textOf(await call("cultureway_validate", { document: bad })));
const paths = (v.problems || []).map((p) => p.path).join(" ");
check("invalid document is rejected", v.ok === false);
check("error names the re-priced native ingredient", /foodways\.ingredients\.fish_raw/.test(paths), paths);
check("error names the bad business rent", /businesses\.mudspa\.rent/.test(paths), paths);
check("error names the forbidden owner", /businesses\.mudspa\.owner/.test(paths), paths);
check("error names the station the business never declared", /businesses\.mudspa\.recipes\[0\]\.steps\[0\]/.test(paths), paths);
check("error names the offending pose row", /art\.body\.poses\.a\[2\]/.test(paths), paths);
check("error names the over-long name", /people\.names\[\d+\]/.test(paths), paths);
check("error names the out-of-range taste", /appeal\.tastes\.fish/.test(paths), paths);
check("error names the out-of-range nudge thumb", /appeal\.nudge\.mul100/.test(paths), paths);
check("error names the cents-habit table tip", /management\.tableTip/.test(paths), paths);
check("error names the hot depart weight", /depart\.weights\.wait/.test(paths), paths);
check("error names the string apron answer", /settlers\.apron/.test(paths), paths);
check("error names the flood walk-in share", /settlers\.walkins/.test(paths), paths);
check("error names the unknown depart rule", /depart\.weights\.nosuchrule/.test(paths), paths);
check("error names the civics term that never closes with TERM", /civics\.stakes\[0\]\.terms\[0\]\.prog/.test(paths), paths);
check("error names the civics stakes missing the platform stake", /civics\.stakes\b/.test(paths), paths);
check("error names the ballot ladder that deletes step 0", /civics\.ballots\[0\]\.steps/.test(paths), paths);
check("error catches the silently-skipped id", /meta\.id/.test(paths), paths);
check("error names the unregistered card observable", /cards\[0\]\.rows\[0\]\.obs/.test(paths), paths);

const sheet = await call("cultureway_render", { document: pig, scale: 2 });
check("cultureway_render returns a PNG", !!imageOf(sheet) && imageOf(sheet).mimeType === "image/png");

const tested = JSON.parse(textOf(await call("cultureway_test", { document: pig, seed: 1337, days: 14 })));
check("cultureway_test reports arrivals", tested.ok === true && tested.arrived === true, JSON.stringify(tested).slice(0, 240));
check("cultureway_test names who came", Array.isArray(tested.folk) && tested.folk.length > 0);
check("cultureway_test returns a reproducible recipe", tested.recipe && tested.recipe.seed === 1337);

const diff = JSON.parse(textOf(await call("cultureway_diff", { document: pig })));
check("cultureway_diff compares against the pigs", !!diff.diff && !!diff.diff.art);

// ---- seeing and simulating ----------------------------------------------
const town = await call("render_town", { seed: 1337, days: 2, scale: 1 });
check("render_town returns a PNG", !!imageOf(town));
check("render_town reports the clock", /"clock"/.test(textOf(town)));

const portrait = await call("render_town", { seed: 1337, days: 1, scale: 1, portrait: true });
check("render_town honours the portrait screen", !!imageOf(portrait));

const scen = JSON.parse(textOf(await call("sim_scenarios")));
check("sim_scenarios lists the suite", Array.isArray(scen) && scen.length > 200, `got ${scen.length}`);

const run = JSON.parse(textOf(await call("sim_run", { seed: 1337, days: 6 })));
check("sim_run returns a report", !!run.report && /day/.test(run.report));
check("sim_run returns its recipe", !!run.recipe && run.recipe.seed === 1337);

// 20 days, because a no-buy town dies around day 12 - a shorter sweep has
// an empty histogram and (correctly) no chart to draw
const sweep = await call("sim_sweep", { towns: 4, seedbase: 1337, days: 20, jobs: 4 });
check("sim_sweep returns a chart", !!imageOf(sweep), textOf(sweep).slice(0, 200));
check("sim_sweep reports a distribution", /evictionDays/.test(textOf(sweep)));

const shortSweep = await call("sim_sweep", { towns: 2, seedbase: 1337, days: 6, jobs: 2 });
check("a sweep with no evictions returns data and no chart", !imageOf(shortSweep) && /survived/.test(textOf(shortSweep)));

// ---- the policy loop ------------------------------------------------------
// tiny on purpose: the harness proves the LOOP works end to end, not that a
// two-town artifact is any good (the suite's agreement-floor scenario judges
// the shipped ones).
const dist = JSON.parse(textOf(await call("policy_distill", { towns: 2, days: 3, epochs: 2, hidden: 8 })));
check("policy_distill returns an artifact with receipts",
  dist.artifact && dist.artifact.mode === "shadow" && dist.receipts && dist.receipts.data.rows > 50,
  JSON.stringify(dist).slice(0, 200));
check("the artifact declares its inputs from the registry",
  Array.isArray(dist.artifact && dist.artifact.inputs) && dist.artifact.inputs.length === dist.artifact.arch.in);
const pv = JSON.parse(textOf(await call("policy_verify", { artifact: dist.artifact, towns: 1, days: 2 })));
check("policy_verify accepts what distill produced", pv.valid === true && typeof pv.agreement === "number",
  JSON.stringify(pv).slice(0, 200));
const badArt = JSON.parse(JSON.stringify(dist.artifact));
badArt.inputs[0] = "stop.gossip.rate:shack";
const pvBad = JSON.parse(textOf(await call("policy_verify", { artifact: badArt })));
check("a broken artifact is refused with the observable named",
  pvBad.valid === false && /stop\.gossip\.rate/.test(pvBad.problem || ""), JSON.stringify(pvBad).slice(0, 200));

// ---- containment ---------------------------------------------------------
const huge = { meta: { id: "huge" }, people: { names: ["X".repeat(12)] }, big: "y".repeat(600000) };
const cap = JSON.parse(textOf(await call("cultureway_validate", { document: huge })));
check("an oversized document is refused before parsing", cap.ok === false && /cap/.test(JSON.stringify(cap)));
check("no tool offers file writes or shell", !tools.some((t) => /write|exec|shell|file/i.test(t.name)));

const unknown = await call("no_such_tool", {});
check("an unknown tool reports an error as content", unknown.isError === true);

child.stdin.end();
console.log(`\n${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);

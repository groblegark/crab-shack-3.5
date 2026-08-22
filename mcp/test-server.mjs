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

// a document broken in four different ways at once
const bad = JSON.parse(JSON.stringify(pig));
bad.meta.id = "Bad-Id";
bad.art.body.poses.a[2] += "ZZ";
bad.tastes.fish = 99;
bad.people.names.push("A NAME MUCH TOO LONG");
const v = JSON.parse(textOf(await call("cultureway_validate", { document: bad })));
const paths = (v.problems || []).map((p) => p.path).join(" ");
check("invalid document is rejected", v.ok === false);
check("error names the offending pose row", /art\.body\.poses\.a\[2\]/.test(paths), paths);
check("error names the over-long name", /people\.names\[\d+\]/.test(paths), paths);
check("error names the out-of-range taste", /tastes\.fish/.test(paths), paths);
check("error catches the silently-skipped id", /meta\.id/.test(paths), paths);

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

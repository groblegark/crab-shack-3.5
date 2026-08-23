#!/usr/bin/env node
// CRAB SCIENCE — an MCP server, spoken directly.
//
// No SDK: this repo has never had a dependency or a build step, and the
// protocol needed here is JSON-RPC 2.0 over newline-delimited stdio with
// four methods. Adding node_modules to buy that would cost more than it
// pays. If the protocol grows, revisit; the transport is thirty lines.
//
// THE ACCEPTANCE TEST THIS IS BUILT AGAINST: an agent with no shell, no
// filesystem and no knowledge of the repo should be able to learn the
// world, run experiments, SEE things, and author a new people end to end,
// using nothing but tools/list and what it reads here.
import { DOCS, readDoc, searchDocs, ORIENTATION } from "./docs.mjs";
import { simRun, simSweep, simSuite, simScenarioList } from "./sim.mjs";
import { cultureValidate, cultureTest, cultureDiff, loadBundled, renderCultureSheet, guardDoc } from "./culture.mjs";
import { createVisibleSim, renderHistogram } from "./render.mjs";
import { policyDistill, policyVerify } from "./policy.mjs";

const SERVER = { name: "crab-science", version: "0.1.0" };

const TOOLS = [
  { name: "orientation",
    description: "START HERE. What Crab Shack is, what a cultureway is, the design rulings you must respect, and the worked path from nothing to a tested people. Read this before anything else.",
    inputSchema: { type: "object", properties: {} } },

  { name: "docs_list",
    description: "List the readable design corpus (rulings, schema, worked examples, the numeric/kernel records) with a note on why each matters.",
    inputSchema: { type: "object", properties: {} } },

  { name: "docs_read",
    description: "Read one document from the corpus by uri (see docs_list).",
    inputSchema: { type: "object", required: ["uri"],
      properties: { uri: { type: "string", description: "e.g. crabshack://cultureway/pigway" } } } },

  { name: "docs_search",
    description: "Search the corpus for a phrase and get located excerpts — use this to find a ruling or a term you half-remember.",
    inputSchema: { type: "object", required: ["query"],
      properties: { query: { type: "string" }, limit: { type: "number", default: 20 } } } },

  { name: "sim_run",
    description: "Simulate ONE town and return its full end-of-run report (day-by-day balances, stats, labour, how it ended). Deterministic: the returned recipe reproduces it exactly.",
    inputSchema: { type: "object",
      properties: {
        seed: { type: "number", default: 1337, description: "raw seed; the same seed is the same town" },
        days: { type: "number", default: 30 },
        buy: { type: "array", items: { type: "string" }, description: 'opening purchases, e.g. ["chef","table"]' },
        hatches: { type: "array", items: { type: "string" }, description: 'arm-off flags for attribution, e.g. ["norival","nohall"]' },
        wage: { type: "number" }, star: { type: "number" },
      } } },

  { name: "sim_sweep",
    description: "Simulate MANY towns and return the distribution — survival, eviction-day histogram, lifetime quantiles, throughput. This is the science instrument.",
    inputSchema: { type: "object",
      properties: {
        towns: { type: "number", default: 16, description: "capped at 256 per call" },
        seedbase: { type: "number", default: 1337, description: "raw seed of the first town" },
        days: { type: "number", default: 30 },
        buy: { type: "array", items: { type: "string" } },
        jobs: { type: "number", default: 6 },
        chart: { type: "boolean", default: true, description: "also return the eviction histogram as a PNG" },
      } } },

  { name: "sim_suite",
    description: "Run the repo's own scenario suite (optionally filtered by substring) and report pass/fail. The suite is the definition of correct behaviour.",
    inputSchema: { type: "object",
      properties: { filter: { type: "string" }, jobs: { type: "number", default: 12 } } } },

  { name: "sim_scenarios",
    description: "List the names of every scenario in the suite, so you can pick a filter without running anything.",
    inputSchema: { type: "object", properties: {} } },

  { name: "render_town",
    description: "Render an actual running town to a PNG you can look at. Runs the sim to the requested day, then draws one frame.",
    inputSchema: { type: "object",
      properties: {
        seed: { type: "number", default: 1337 }, days: { type: "number", default: 3 },
        scale: { type: "number", default: 3, description: "nearest-neighbour zoom, 1-6" },
        portrait: { type: "boolean", default: false, description: "256x288 phone screen instead of 256x240" },
        cultureway: { type: "object", description: "optional draft document to install before running" },
      } } },

  { name: "cultureway_validate",
    description: "Validate a cultureway document with the GAME'S OWN validator, and get field-level problems with exact paths (e.g. art.body.poses.a[3] is 14 chars but art.body.w is 12). Always run this before testing.",
    inputSchema: { type: "object", required: ["document"],
      properties: { document: { type: "object", description: "the cultureway document" } } } },

  { name: "cultureway_test",
    description: "Install a draft cultureway into a real town and report what actually happened: did these people arrive, on what day, wearing which registers, carrying what — plus how the town fared.",
    inputSchema: { type: "object", required: ["document"],
      properties: { document: { type: "object" }, seed: { type: "number", default: 1337 },
                    days: { type: "number", default: 20, description: "capped at 40" } } } },

  { name: "cultureway_render",
    description: "Draw a people's whole sprite sheet — every pose in every colorway, plus the body wearing each accessory — as a PNG. This is how you see whether your people LOOK right.",
    inputSchema: { type: "object", required: ["document"],
      properties: { document: { type: "object" }, scale: { type: "number", default: 4 } } } },

  { name: "cultureway_get",
    description: "Fetch a bundled cultureway document to read or copy. Currently: 'pig' and 'gull' (the gulls carry a live brain in their policies section — a worked example of the policy loop).",
    inputSchema: { type: "object", properties: { id: { type: "string", default: "pig" } } } },

  { name: "cultureway_diff",
    description: "Compare two cultureway documents — tastes, purse classes, art size, registers, arrival — to see what you actually made different. Pass one document and it compares against the pigs.",
    inputSchema: { type: "object", required: ["document"],
      properties: { document: { type: "object" }, against: { type: "object", description: "defaults to the bundled pig" } } } },

  { name: "policy_distill",
    description: "Distill a decision surface into a small deterministic integer brain: the sim's reference script labels its own data, a seeded trainer fits and quantizes it, and you get back a policies-section artifact (in SHADOW mode — promote to live yourself) plus agreement receipts. Slow: tens of seconds at defaults.",
    inputSchema: { type: "object",
      properties: {
        surface: { type: "string", default: "vis_pick.candidate",
          description: "vis_pick.candidate (a visitor's next stop) or cit_errand.candidate (a resident's off-counter life)" },
        culture: { type: "string", default: "crab", description: "whose thinks to learn from; a non-crab culture needs `document`" },
        document: { type: "object", description: "the cultureway document, when culture is not crab" },
        towns: { type: "number", default: 8, description: "capped at 32" },
        days: { type: "number", default: 6, description: "capped at 12" },
        hidden: { type: "number", default: 24, description: "hidden width, capped at 64" },
        epochs: { type: "number", default: 15, description: "capped at 40" },
        seed: { type: "number", default: 7, description: "training seed (the ARTIFACT is what ships; training is seeded but its determinism is a nicety)" },
      } } },

  { name: "policy_verify",
    description: "Verify a brain artifact: the engine's own validator (clamps, caps, registry version — actionable messages), then a fresh agreement measure against the reference script on newly simulated towns.",
    inputSchema: { type: "object",
      properties: {
        artifact: { type: "object", description: "a policies-section brain entry" },
        document: { type: "object", description: "or a whole cultureway document whose policies carry one" },
        culture: { type: "string", default: "crab" },
        towns: { type: "number", default: 3 }, days: { type: "number", default: 4 },
      } } },
];

// ---- transport -----------------------------------------------------------
const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const ok = (id, result) => send({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });
const text = (s) => ({ content: [{ type: "text", text: typeof s === "string" ? s : JSON.stringify(s, null, 1) }] });
const image = (png, note) => ({
  content: [
    ...(note ? [{ type: "text", text: typeof note === "string" ? note : JSON.stringify(note, null, 1) }] : []),
    { type: "image", data: Buffer.from(png).toString("base64"), mimeType: "image/png" },
  ],
});

const clamp = (v, lo, hi, d) => {
  const n = typeof v === "number" && isFinite(v) ? v : d;
  return Math.max(lo, Math.min(hi, n));
};

async function callTool(name, a = {}) {
  switch (name) {
    case "orientation": return text(ORIENTATION);
    case "docs_list":
      return text(DOCS.map(({ uri, title, why }) => ({ uri, title, why })));
    case "docs_read": {
      const body = readDoc(a.uri);
      if (body == null) return text({ error: `no such document: ${a.uri}`, known: DOCS.map((d) => d.uri) });
      return text(body);
    }
    case "docs_search": return text(searchDocs(a.query, { limit: clamp(a.limit, 1, 60, 20) }));

    case "sim_run":
      return text(await simRun({ seed: a.seed ?? 1337, days: clamp(a.days, 1, 60, 30),
        buy: a.buy || [], hatches: a.hatches || [], wage: a.wage ?? null, star: a.star ?? null }));

    case "sim_sweep": {
      const r = await simSweep({ towns: clamp(a.towns, 1, 256, 16), seedbase: a.seedbase ?? 1337,
        days: clamp(a.days, 1, 60, 30), buy: a.buy || [], jobs: clamp(a.jobs, 1, 12, 6) });
      const hist = r.result && r.result.evictionDays && r.result.evictionDays.histogram;
      if (a.chart !== false && hist && Object.keys(hist).length)
        return image(renderHistogram(hist), r);
      return text(r);
    }

    case "sim_suite":
      return text(await simSuite({ filter: a.filter || null, jobs: clamp(a.jobs, 1, 12, 12) }));

    case "sim_scenarios": return text(await simScenarioList());

    case "render_town": {
      if (a.cultureway) { const g = guardDoc(a.cultureway); if (g) return text({ error: g }); }
      const sim = createVisibleSim({ seed: a.seed ?? 1337,
        screenH: a.portrait ? 288 : 240,
        cultures: a.cultureway ? { [(a.cultureway.meta && a.cultureway.meta.id) || "draft"]: a.cultureway } : null });
      sim.runDays(clamp(a.days, 1, 40, 3));
      const png = sim.frame({ scale: clamp(a.scale, 1, 6, 3) });
      return image(png, { seed: a.seed ?? 1337, day: sim.G("day"),
        clock: sim.G(`(function(){const h=(tmin/60)|0,m=(tmin%60)|0;return (h<10?"0":"")+h+":"+(m<10?"0":"")+m;})()`),
        coins: sim.G("$d(coins)"), rep: sim.G("repPts(rep)") });
    }

    case "cultureway_validate": return text(cultureValidate(a.document));
    case "cultureway_test":
      return text(await cultureTest(a.document, { seed: a.seed ?? 1337, days: clamp(a.days, 1, 40, 20) }));
    case "cultureway_render": {
      const g = guardDoc(a.document);
      if (g) return text({ error: g });
      try {
        const { png, meta } = renderCultureSheet(a.document, { scale: clamp(a.scale, 1, 8, 4) });
        return image(png, meta);
      } catch (e) {
        return text({ error: String(e && e.message || e),
                      hint: "run cultureway_validate first - it localises the field" });
      }
    }
    case "cultureway_get": {
      const d = loadBundled(a.id || "pig");
      return d ? text(d) : text({ error: `no bundled cultureway "${a.id}"`, known: ["pig", "gull"] });
    }
    case "cultureway_diff": {
      const other = a.against || loadBundled("pig");
      return text({ a: (a.document.meta || {}).id || "draft", b: (other.meta || {}).id || "pig",
                    diff: cultureDiff(a.document, other) });
    }
    case "policy_distill": return text(await policyDistill(a));
    case "policy_verify": return text(await policyVerify(a));
    default: throw new Error(`unknown tool: ${name}`);
  }
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize")
    return ok(id, { protocolVersion: "2024-11-05",
      capabilities: { tools: {}, resources: {} }, serverInfo: SERVER,
      instructions: "Call `orientation` first — it explains the world, the design rulings, and the path from nothing to a tested cultureway." });
  if (method === "notifications/initialized" || method === "initialized") return;
  if (method === "ping") return ok(id, {});
  if (method === "tools/list") return ok(id, { tools: TOOLS });
  if (method === "resources/list")
    return ok(id, { resources: DOCS.map((d) => ({ uri: d.uri, name: d.title, description: d.why, mimeType: "text/markdown" })) });
  if (method === "resources/read") {
    const body = readDoc(params && params.uri);
    if (body == null) return fail(id, -32602, `no such resource: ${params && params.uri}`);
    return ok(id, { contents: [{ uri: params.uri, mimeType: "text/markdown", text: body }] });
  }
  if (method === "tools/call") {
    try { return ok(id, await callTool(params.name, params.arguments || {})); }
    catch (e) {
      // A TOOL ERROR IS CONTENT, NOT A TRANSPORT FAULT: the caller should be
      // able to read what went wrong and try again without the session dying.
      return ok(id, { isError: true, content: [{ type: "text", text: String(e && e.stack || e) }] });
    }
  }
  if (id !== undefined) fail(id, -32601, `unknown method: ${method}`);
}

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    try { await handle(msg); }
    catch (e) { if (msg && msg.id !== undefined) fail(msg.id, -32603, String(e && e.message || e)); }
  }
});
process.stdin.on("end", () => process.exit(0));

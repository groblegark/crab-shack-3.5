// THE SIM APIS: faces on tools/ that already exist, never a second engine.
//
// CLAUDE.md's sim contract says the headless sim IS the game engine and must
// never be forked or reimplemented. The same rule binds this server: a sweep
// SPAWNS tools/batch.mjs, a run SPAWNS tools/headless.mjs, and the suite is
// the repo's own suite. If the game changes, these answers change with it,
// because nothing here knows any game rules at all.
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// SEED COORDINATES, and they differ between tools - a real trap that has
// cost this project time. tools/headless.mjs multiplies (--seedbase + n) by
// 1337; tools/batch.mjs passes RAW seeds straight through. Everything this
// server exposes speaks RAW seeds, and converts on the way in, so a caller
// who reads seed 723 in a sweep can ask for seed 723 in a run and get the
// same town.
export const rawToHeadlessBase = (raw) => raw / 1337 - 1;

const HARD_CAP_MS = 240000;

export function run(cmd, args, { timeoutMs = 90000, env = {} } = {}) {
  return new Promise((resolve) => {
    const ms = Math.min(timeoutMs, HARD_CAP_MS);
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, SIMLIB_REALM: "main", SIMLIB_KERNEL: "wasm", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "", err = "", done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      // A CAP IS NOT A FAILURE: hand back what we have plus the recipe to
      // resume, because a caller that gets nothing learns nothing.
      finish({ timedOut: true, stdout: out, stderr: err,
               resume: `${cmd} ${args.join(" ")}`,
               hint: `capped at ${ms}ms - re-run with fewer towns/days, or the same command in a shell` });
    }, ms);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("error", (e) => { clearTimeout(timer); finish({ error: String(e && e.message || e) }); });
    child.on("exit", (code) => { clearTimeout(timer); finish({ code, stdout: out, stderr: err }); });
  });
}

const lastJSON = (s) => {
  const lines = String(s).trim().split("\n").filter((l) => l.trim().startsWith("{"));
  for (let i = lines.length - 1; i >= 0; i--)
    try { return JSON.parse(lines[i]); } catch {}
  return null;
};

// One town, the full receipt tools/headless.mjs prints.
export async function simRun({ seed = 1337, days = 30, buy = [], set = {}, hatches = [], wage = null, star = null } = {}) {
  const args = ["tools/headless.mjs", "--days", String(days), "--seeds", "1",
                "--seedbase", String(rawToHeadlessBase(seed)), "--realm", "main"];
  if (buy.length) args.push("--buy", buy.join(","));
  for (const [k, v] of Object.entries(set)) args.push("--set", `${k}=${v}`);
  for (const h of hatches) args.push(`--${h}`);
  if (wage != null) args.push("--wage", String(wage));
  if (star != null) args.push("--star", String(star));
  const r = await run("node", args, { timeoutMs: 120000 });
  return { recipe: { seed, days, buy, set, hatches, wage, star, command: `node ${args.join(" ")}` },
           timedOut: !!r.timedOut, exitCode: r.code ?? null,
           report: (r.stdout || "").trim() || null, stderr: (r.stderr || "").trim() || null };
}

// Many towns, the batch instrument's distribution receipt.
export async function simSweep({ towns = 16, seedbase = 1337, days = 30, buy = [], jobs = 6 } = {}) {
  const capped = Math.min(towns, 256);
  const args = ["tools/batch.mjs", "--towns", String(capped), "--seedbase", String(seedbase),
                "--days", String(days), "--jobs", String(jobs), "--json"];
  if (buy.length) args.push("--buy", buy.join(","));
  const r = await run("node", args, { timeoutMs: 240000 });
  const json = lastJSON(r.stdout);
  return { recipe: { towns: capped, seedbase, days, buy, jobs, command: `node ${args.join(" ")}` },
           truncatedTowns: capped !== towns ? towns : undefined,
           timedOut: !!r.timedOut, result: json,
           raw: json ? undefined : (r.stdout || r.stderr || "").slice(-2000) };
}

// The repo's own scenario suite, optionally filtered by substring.
export async function simSuite({ filter = null, jobs = 12 } = {}) {
  const args = ["tools/suite.mjs", "--jobs", String(jobs)];
  if (filter) args.push(filter);
  const r = await run("node", args, { timeoutMs: 240000 });
  const text = (r.stdout || "") + (r.stderr || "");
  const tail = text.trim().split("\n").slice(-40).join("\n");
  const m = /(\d+)\/(\d+) passed/.exec(text);
  const fails = text.split("\n").filter((l) => /^\s+FAIL/.test(l));
  return { recipe: { filter, jobs, command: `node ${args.join(" ")}` },
           timedOut: !!r.timedOut, exitCode: r.code ?? null,
           passed: m ? +m[1] : null, total: m ? +m[2] : null,
           failures: fails.slice(0, 25), tail };
}

// The scenario NAMES, so a caller can pick a filter without running anything.
export async function simScenarioList() {
  const { readFileSync } = await import("fs");
  const src = readFileSync(join(ROOT, "tools", "suite.mjs"), "utf8");
  return [...src.matchAll(/^scenario\("([^"]+)"/gm)].map((m) => m[1]);
}

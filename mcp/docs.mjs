// THE CORPUS: what a caller can read, and the one page they should read
// first. Curated deliberately - game.js is sixteen thousand lines and
// dumping it would bury the twenty pages that actually explain the world.
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ROOT } from "./sim.mjs";

export const DOCS = [
  { uri: "crabshack://orientation", title: "START HERE — orientation",
    why: "what the game is, what a cultureway is, what the rulings forbid, and a worked path from nothing to a tested people" },
  { uri: "crabshack://plan", file: "PLAN.md", title: "PLAN.md — the project brain",
    why: "systems map, balance numbers, and every standing design ruling" },
  { uri: "crabshack://readme", file: "README.md", title: "README",
    why: "what the game is, in the repo's own words" },
  { uri: "crabshack://conventions", file: "CLAUDE.md", title: "Working conventions",
    why: "the sim contract, perf expectations, suite discipline" },
  { uri: "crabshack://cultureway/substrate", file: "design/cs35-cultureway-substrate.md",
    title: "The cultureway substrate", why: "the document schema, its phases, and the debt it absorbs" },
  { uri: "crabshack://cultureway/research", file: "design/cs35-cultureway-research.md",
    title: "Cultureway research + the five rulings", why: "why cultures are documents, and the hostile-file posture" },
  { uri: "crabshack://cultureway/schema", file: "design/cultureways/cultureway.schema.json",
    title: "cultureway.schema.json", why: "the machine-readable shape of a cultureway document" },
  { uri: "crabshack://cultureway/pigway", file: "design/cultureways/pigway.json",
    title: "pigway.json — a complete worked example", why: "a real, shipping people; copy this shape" },
  { uri: "crabshack://cultureway/pig-spec", file: "design/cs35-spec-01-minimum-viable-pig.md",
    title: "Spec 01 — the minimum viable pig", why: "how the first foreign people was designed and what each part does" },
  { uri: "crabshack://numeric/core", file: "design/cs35-numeric-core.md",
    title: "The numeric core", why: "why the sim is exact integers, and why runs reproduce bit-for-bit" },
  { uri: "crabshack://numeric/kernel", file: "design/cs35-kernel-decision.md",
    title: "The kernel decision", why: "the WASM kernel, the measured ladder, and where the speed comes from" },
  { uri: "crabshack://numeric/branchless", file: "design/cs35-branchless-research.md",
    title: "The branchless study", why: "how coherent the town's behaviour is, measured" },
];

export function readDoc(uri) {
  if (uri === "crabshack://orientation") return ORIENTATION;
  const d = DOCS.find((x) => x.uri === uri);
  if (!d || !d.file) return null;
  const p = join(ROOT, d.file);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

// Substring search across the corpus, returning located excerpts. An agent
// with no filesystem needs SOME way to ask "where is the ruling about X".
export function searchDocs(query, { limit = 20 } = {}) {
  const q = String(query).toLowerCase();
  const hits = [];
  for (const d of DOCS) {
    const text = readDoc(d.uri);
    if (!text) continue;
    const lines = text.split("\n");
    for (let i = 0; i < lines.length && hits.length < limit; i++) {
      if (!lines[i].toLowerCase().includes(q)) continue;
      hits.push({ uri: d.uri, title: d.title, line: i + 1,
                  excerpt: lines.slice(Math.max(0, i - 2), i + 3).join("\n") });
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

export const ORIENTATION = `# CRAB SHACK — orientation for an agent

You are holding a science station for a small, deterministic town simulation.
Everything below is reachable through this server alone.

## The game, in a paragraph

CRAB SHACK 3.5 is a browser town-economy sim on a 256x240 pixel canvas. You
own a beach food shack on an island; crabs live, work, eat, get sick, get
bored, vote, buy each other's businesses, and go broke. Tourists arrive by
ferry with finite purses and go home again. The player's abilities are the
NPCs' abilities — an NPC owner runs their shop the way you run yours. The
long game is buying a ferry to the mainland.

## Why this sim is worth doing science on

The simulation is EXACT INTEGER end to end — money in cents, the clock in
20Hz ticks, needs and positions in fixed point, and one closed random
stream. A run is therefore a RECIPE, not a recording: the same seed and the
same parameters produce the same town, bit for bit, on any machine and in
any JavaScript engine. That is what makes sweeps, histograms and rare-event
hunts meaningful here rather than approximate.

## What a CULTUREWAY is

A people, written as a document. Not code — data the engine reads:

  meta      id and name. THE ID MUST MATCH /^[a-z][a-z0-9_]{0,15}$/ or the
            game skips your document SILENTLY, with no error anywhere.
  people    the name pool (each name <= 12 characters)
  art       palette, body (w/h 4-32, four poses a/b/w/s as pixel rows),
            colorways (per-slot recolours), anchors, accessories, items
  voice     registers — a register is bound to an accessory, because THE HAT
            IS THE CLASS MARKER: what someone wears picks how they speak and
            how fat their purse is (purseMul, 0.1-5)
  tastes    per-food multipliers, 0.1-5. 1.0 is neutral, below 1 is dislike,
            0.1 is effectively taboo
  arrival   repGate (how well-regarded the town must be before word reaches
            them), shareMax, shareRamp

Two peoples ship today: the crabs (the engine's own, not overridable) and
the pigs of the PORKRESENTATIVE PIGPUBLIC, who hold fish taboo, love a hot
soak, and speak in two registers — a strawhat farmhand with a light purse
and a bare-headed clerk with a heavy one.

## The rulings that constrain what you may design

These are standing design law in this project. Read
crabshack://cultureway/research and crabshack://plan for the full text.

1. INCENTIVES, NOT PUPPETEERING. A people's document biases what its members
   want. It never commands them. Someone who cannot afford a thing, is on
   shift, or holds it taboo must still be able to refuse — and the refusal
   should read as character.
2. RESOURCES ARE NEVER CONJURED. Money and goods move; they are not minted
   to make a story work. Conservation is checked exactly.
3. INTERFACE OPACITY IS A BUG, ECONOMIC UNCERTAINTY IS THE GAME. Never
   design a projected-income readout or a recommended-purchase advisor.
4. CURRENCY IS PHYSICS, GOODS ARE CULTURE. Cents are engine; what counts as
   food, and what it means to eat it, belongs to a people.
5. HOSTILE-FILE POSTURE. A document is untrusted input. Every number is
   clamped, every table capped. Your drafts are treated exactly this way by
   this server — see "what you can and cannot change" below.

## The worked path from nothing to a tested people

  1. read  crabshack://cultureway/pigway      (a real, complete document)
     and  crabshack://cultureway/schema       (the shape, formally)
  2. draft your document as JSON
  3. cultureway_validate  — field-level errors with exact paths
  4. cultureway_render    — see every pose and colorway, and the hat worn
  5. cultureway_test      — install it in a real town and find out whether
                            they arrived, what they were carrying, and which
                            registers turned up
  6. cultureway_diff      — against the pigs, to see what you actually made
     different
  7. iterate from 3

## Running experiments

  sim_run     one town, the full end-of-run report
  sim_sweep   many towns, a distribution (eviction histogram, lifetimes)
  sim_suite   the repo's own scenario suite, optionally filtered
  render_town a picture of an actual running town

SEEDS ARE RAW HERE. Everything this server takes and returns uses raw seed
numbers. (Internally tools/headless.mjs multiplies by 1337 and
tools/batch.mjs does not; this server converts so you never have to think
about it.)

A no-buy town typically dies around day 12 — that is the intended floor,
not a bug. Roughly a third of towns escape when the opening buys are
chef+table. Do not treat those numbers as targets to tune toward; they are
regression detectors.

## What you can and cannot change

CAN: your own draft documents, and the parameters of runs you ask for.
Documents you pass are size-capped, validated by the game's own validator,
installed through the same door a player's imported save uses, and thrown
away with the sim that ran them.

CANNOT: the repository, the bundled cultureways, any file on disk, or any
shell. This server exposes no write and no exec. Nothing you send here can
change what a player downloads.
`;

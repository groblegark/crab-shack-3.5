// Generate cultureways.js — the BUNDLED cultureway documents and policies —
// from the proven sources. The pig ships from the fixture the suite has
// proved against since spec-01; the gulls ship from the authored document the
// MCP dogfood produced (design/cultureways/gullway.json — read directly, so
// there is no second copy to drift, and the suite's gull scenarios prove the
// BUNDLED copy at runtime, which is the one players get either way). The crab
// default carries no cultureway document — the crab IS the engine — so its
// policies ride separately in BUNDLED_POLICIES, through the same validator
// and clamps as everyone else's.
import { readFileSync, writeFileSync } from "fs";

const pig = JSON.parse(readFileSync(new URL("./fixtures/cultures-pig.json", import.meta.url), "utf8"));
const gull = JSON.parse(readFileSync(new URL("../design/cultureways/gullway.json", import.meta.url), "utf8"));
const crabBrain = JSON.parse(readFileSync(new URL("./neuro/receipts/brain-crab-v3.json", import.meta.url), "utf8"));
const crabVoiceSrc = JSON.parse(readFileSync(new URL("./fixtures/crab-voice.json", import.meta.url), "utf8"));
const crabVoice = { registers: crabVoiceSrc.registers };   // the _comment stays in the fixture
if (crabVoiceSrc.idle) crabVoice.idle = crabVoiceSrc.idle; // E1: the idle quips (ball/chat/wander/nod)
// E2: the crab's traits, tabled (census C3) - twentieths in the fixture,
// converted to the engine's exact floats by buildTraits at load.
const crabTraitsSrc = JSON.parse(readFileSync(new URL("./fixtures/crab-traits.json", import.meta.url), "utf8"));
const crabTraits = { traits: crabTraitsSrc.traits };

// THE CRAB AS A DOCUMENT (phase E6): its people and its look ride the bundle
// like its voice and brain. Validated HERE, at build time - a bad pool or a
// dangling founder reference fails the BUILD, never the town (the plan's
// authoring rule: "a typo'd name fails the build").
const crabPeopleSrc = JSON.parse(readFileSync(new URL("./fixtures/crab-people.json", import.meta.url), "utf8"));
const crabPeople = { crew: crabPeopleSrc.crew, walkins: crabPeopleSrc.walkins, fallback: crabPeopleSrc.fallback };
const crabArtSrc = JSON.parse(readFileSync(new URL("./fixtures/crab-art.json", import.meta.url), "utf8"));
const crabArt = { colorways: crabArtSrc.colorways, founders: crabArtSrc.founders };
{
  const badName = (n) => typeof n !== "string" || !n.length || n.length > 16;
  for (const pool of ["crew", "walkins"]) {
    if (!Array.isArray(crabPeople[pool]) || !crabPeople[pool].length)
      throw new Error("crab-people." + pool + ": empty or not a list");
    for (const n of crabPeople[pool]) if (badName(n))
      throw new Error("crab-people." + pool + ": a name no card can hold: " + JSON.stringify(n));
    if (new Set(crabPeople[pool]).size !== crabPeople[pool].length)
      throw new Error("crab-people." + pool + ": a name appears twice");
  }
  if (badName(crabPeople.fallback)) throw new Error("crab-people.fallback: a name no card can hold");
  const rgbOk = (c) => Array.isArray(c) && c.length === 3
    && c.every(v => Number.isInteger(v) && v >= 0 && v <= 255);
  if (!Array.isArray(crabArt.colorways) || !crabArt.colorways.length)
    throw new Error("crab-art.colorways: empty or not a list");
  for (const cw of crabArt.colorways)
    if (!cw || typeof cw.id !== "string" || !cw.id.length || !rgbOk(cw.hi) || !rgbOk(cw.lo))
      throw new Error("crab-art.colorways: a colorway is not {id, hi[3], lo[3]}: " + JSON.stringify(cw));
  if (new Set(crabArt.colorways.map(c => c.id)).size !== crabArt.colorways.length)
    throw new Error("crab-art.colorways: a colorway id appears twice");
  for (const f in crabArt.founders)
    if (!crabArt.colorways.some(c => c.id === crabArt.founders[f]))
      throw new Error("crab-art.founders." + f + ": names a colorway that does not exist: " + crabArt.founders[f]);
}
const crabCitBrain = JSON.parse(readFileSync(new URL("./neuro/receipts/brain-crab-cit-v1.json", import.meta.url), "utf8"));

// The shipped crab policy: the LEVER-DIVERSE v3 artifact, 42->48->7, distilled
// from 48 towns x 14 days with the sim's own class prior intact. On the very
// corpus the shipped v2 measured 95.71% on it reads 97.82%, and the act-early
// disagreements that cost the growth floor - the net buying small and early
// where the script waits for the fat ticket - fall from 373 to 30 (2.30% of
// thinks to 0.18%). The ladder before it: v1 was blind to price because every
// collection town sat at the default board; v2 fixed the board and kept the
// trainer's `none` downsampling, which was itself the act-early bias.
// LIVE by owner ruling ("im ok with just shipping neuro crabs, there's no
// risk and we always have their tests"). kind/mode wrap the artifact;
// provenance and heldout ride along as documentation the validator ignores.
const crabPolicies = {
  "vis_pick.candidate": { ...crabBrain, kind: "brain", mode: "live" },
  // THE CITIZEN MIND (dream-replay rung 1): pickErrand distilled - a
  // resident's whole off-counter life. Shadow-proven (commit 3418e84: inert
  // by scenario, 99.82% in-town agreement, acted floor, mutations bitten),
  // then LIVE with the full fingerprint ceremony + the triple-16 matrix -
  // the crew make up their own minds now.
  "cit_errand.candidate": { ...crabCitBrain, kind: "brain", mode: "live" },
};

const header = `// THE BUNDLED CULTUREWAYS — the peoples who ship with the island.
//
// A cultureway is a DOCUMENT: art, appetite, voice, policies, and the terms
// on which its people travel. The engine holds no opinion about who these
// are; it reads this file the same way it would read a document out of a
// save, and the only difference is trust. These are ours, so they are
// installed without a toast; a document that arrives in a save file is a
// stranger and goes through the same clamps either way (cultureProblem,
// policyProblem, game.js).
//
// BUNDLED_POLICIES carries decision policies for cultures WITHOUT documents:
// the crab default's vis_pick brain lives here (the engine's own people,
// thinking through a distilled net — same validator, same hostile-file caps).
// BUNDLED_CRAB_VOICE is the same idea for the crab's SENTENCES (phase C):
// the diary/depart/dossier literals tabled, byte-equal to the code fallbacks
// they shadow — proven equal by suite scenario, validated by voiceProblem.
//
// GENERATED by tools/mkcultureways.mjs from tools/fixtures/cultures-pig.json,
// design/cultureways/gullway.json, and tools/neuro/receipts/. Edit a source,
// regenerate, and the suite is still testing the thing the player gets.
//
// Loaded as a plain script (no build step) and read by loadCultures() at
// boot, BEFORE any save's own cultures, which override by id — so a player
// who authors their own pigway replaces ours rather than fighting it.
`;

const body = `var BUNDLED_CULTUREWAYS = ${JSON.stringify({ pig, gull }, null, 1)};\n`
  + `var BUNDLED_POLICIES = ${JSON.stringify({ crab: crabPolicies }, null, 1)};\n`
  + `var BUNDLED_CRAB_VOICE = ${JSON.stringify(crabVoice, null, 1)};\n`
  + `var BUNDLED_CRAB_TRAITS = ${JSON.stringify(crabTraits, null, 1)};\n`
  + `var BUNDLED_CRAB_PEOPLE = ${JSON.stringify(crabPeople, null, 1)};\n`
  + `var BUNDLED_CRAB_ART = ${JSON.stringify(crabArt, null, 1)};\n`;
const tail = `if (typeof window !== "undefined") { window.BUNDLED_CULTUREWAYS = BUNDLED_CULTUREWAYS; window.BUNDLED_POLICIES = BUNDLED_POLICIES; window.BUNDLED_CRAB_VOICE = BUNDLED_CRAB_VOICE; window.BUNDLED_CRAB_TRAITS = BUNDLED_CRAB_TRAITS; window.BUNDLED_CRAB_PEOPLE = BUNDLED_CRAB_PEOPLE; window.BUNDLED_CRAB_ART = BUNDLED_CRAB_ART; }\n`;

writeFileSync(new URL("../cultureways.js", import.meta.url), header + body + tail);
console.log("wrote cultureways.js —", (header + body + tail).length, "bytes; cultures:",
  Object.keys({ pig, gull }).join(","), "; policies: crab ; crab voice:",
  crabVoice.registers.length, "register(s) ; crab people:",
  crabPeople.crew.length + "+" + crabPeople.walkins.length, "names ; colorways:",
  crabArt.colorways.length);

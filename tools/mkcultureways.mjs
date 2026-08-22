// Generate cultureways.js — the BUNDLED cultureway documents — from the
// validated fixture. The fixture is the one the suite has been proving
// against since spec-01; shipping anything else would ship an unproven pig.
import { readFileSync, writeFileSync } from "fs";

const pig = JSON.parse(readFileSync(new URL("./fixtures/cultures-pig.json", import.meta.url), "utf8"));

const header = `// THE BUNDLED CULTUREWAYS — the peoples who ship with the island.
//
// A cultureway is a DOCUMENT: art, appetite, voice, and the terms on which
// its people travel. The engine holds no opinion about who these are; it
// reads this file the same way it would read a document out of a save, and
// the only difference is trust. These are ours, so they are installed
// without a toast; a document that arrives in a save file is a stranger and
// goes through the same clamps either way (cultureProblem, game.js).
//
// GENERATED from tools/fixtures/cultures-pig.json by tools/mkcultureways.mjs —
// the fixture the suite has proved against since spec-01. Edit the fixture,
// regenerate, and the suite is still testing the thing the player gets.
//
// Loaded as a plain script (no build step) and read by loadCultures() at
// boot, BEFORE any save's own cultures, which override by id — so a player
// who authors their own pigway replaces ours rather than fighting it.
`;

const body = `var BUNDLED_CULTUREWAYS = ${JSON.stringify({ pig }, null, 1)};\n`;
const tail = `if (typeof window !== "undefined") window.BUNDLED_CULTUREWAYS = BUNDLED_CULTUREWAYS;\n`;

writeFileSync(new URL("../cultureways.js", import.meta.url), header + body + tail);
console.log("wrote cultureways.js —", (header + body + tail).length, "bytes, cultures:", Object.keys({ pig }).join(","));

#!/usr/bin/env node
// checklen.mjs — counts the App Store fields in store-listing.md against
// Apple's hard limits. App Store Connect does not truncate an over-long field,
// it refuses to save it, which is a thing to find out here and not at 1am.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const md = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "store-listing.md"), "utf8");
const LIMITS = { Name: 30, Subtitle: 30, "Promotional text": 170, Keywords: 100, Description: 4000, "What's New": 4000 };

let bad = 0;
for (const [field, limit] of Object.entries(LIMITS)) {
  const sec = new RegExp(`## ${field.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md);
  if (!sec) { console.log(`  ?  ${field} — no section found`); bad++; continue; }
  for (const m of sec[1].matchAll(/```\n([\s\S]*?)```/g)) {
    // a promo/description block is pasted as one paragraph; the hard-wrapping
    // here is for reading the file, so measure it the way Apple will
    const text = field === "Keywords" ? m[1].trim() : m[1].trim().replace(/\n(?!\n)/g, " ");
    const n = [...text].length;
    const ok = n <= limit;
    if (!ok) bad++;
    console.log(`${ok ? "  ok" : " OVER"}  ${field}: ${n}/${limit}  ${text.slice(0, 46).replace(/\n/g, " ")}${text.length > 46 ? "…" : ""}`);
  }
}
process.exit(bad ? 1 : 0);

// Round 2: the corpus is banked; sweep class weightings and report FULL
// per-class recall, act-early, act-late - the pin table, not one number.
import { trainArtifact, CIT_CLASSES } from "./distill.mjs";
import { readFileSync, writeFileSync } from "fs";
const data = JSON.parse(readFileSync("tools/neuro/receipts/cit-data.json", "utf8"));
const N = CIT_CLASSES.length;
const thin = { "selfcook:food": 1, "soup:food": 1, "arcade:fun": 1, "ball:fun": 1, "vote:vote": 1, "selfcook:drink": 1 };
const mk = (boost) => CIT_CLASSES.map(c => thin[c] ? boost : 1);
const runs = [
  { tag: "w1 (none)", cw: null, seed: 42 },
  { tag: "thin x4", cw: mk(4), seed: 42 },
  { tag: "thin x8", cw: mk(8), seed: 42 },
  { tag: "thin x16", cw: mk(16), seed: 42 },
  { tag: "thin x8 s11", cw: mk(8), seed: 11 },
];
const out = [];
for (const r of runs) {
  const { artifact, heldout } = trainArtifact({ data, surface: "cit_errand.candidate",
    hidden: 32, epochs: 25, seed: r.seed, noneRatio: null, classWeights: r.cw });
  let ae = 0, al = 0;
  for (let b = 1; b < N; b++) ae += heldout.conf[0][b];
  for (let a = 1; a < N; a++) al += heldout.conf[a][0];
  const rec = CIT_CLASSES.map((c, i) => {
    const n = heldout.conf[i].reduce((x, y) => x + y, 0);
    return c + " " + (n ? (heldout.conf[i][i] / n * 100).toFixed(1) : "-") + "%(" + n + ")";
  });
  console.log(`== ${r.tag}: agree ${(heldout.agree * 100).toFixed(2)}% ae ${ae} al ${al}`);
  console.log("   " + rec.join(" "));
  out.push({ ...r, artifact, agree: heldout.agree, ae, al });
}
writeFileSync("tools/neuro/receipts/cit-weight-sweep.json",
  JSON.stringify(out.map(({ artifact, cw, ...r }) => r), null, 1));
globalThis._out = out;
// keep every artifact on disk so the pick is a file move, not a retrain
out.forEach((r, i) => writeFileSync(`tools/neuro/receipts/cit-cand-${i}.json`, JSON.stringify(r.artifact)));

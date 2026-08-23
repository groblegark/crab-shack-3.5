// Round 4: capacity. Corpus banked; hidden 48, epochs 35, weight x2/x4/x6.
import { trainArtifact, CIT_CLASSES } from "./distill.mjs";
import { readFileSync, writeFileSync } from "fs";
const data = JSON.parse(readFileSync("tools/neuro/receipts/cit-data.json", "utf8"));
const N = CIT_CLASSES.length;
const thin = { "selfcook:food": 1, "soup:food": 1, "arcade:fun": 1, "ball:fun": 1, "vote:vote": 1, "selfcook:drink": 1 };
const mk = (b) => CIT_CLASSES.map(c => thin[c] ? b : 1);
const out = [];
for (const r of [{ tag: "h48 w1 s42", cw: null, seed: 42 }, { tag: "h48 x2 s42", cw: mk(2), seed: 42 },
                 { tag: "h48 x4 s42", cw: mk(4), seed: 42 }, { tag: "h48 x4 s7", cw: mk(4), seed: 7 },
                 { tag: "h48 x6 s7", cw: mk(6), seed: 7 }]) {
  const { artifact, heldout } = trainArtifact({ data, surface: "cit_errand.candidate",
    hidden: 48, epochs: 35, seed: r.seed, noneRatio: null, classWeights: r.cw });
  let ae = 0, al = 0;
  for (let b = 1; b < N; b++) ae += heldout.conf[0][b];
  for (let a = 1; a < N; a++) al += heldout.conf[a][0];
  console.log(`== ${r.tag}: agree ${(heldout.agree * 100).toFixed(2)}% ae ${ae} al ${al}`);
  console.log("   " + CIT_CLASSES.map((c, i) => {
    const n = heldout.conf[i].reduce((x, y) => x + y, 0);
    return c + " " + (n ? (heldout.conf[i][i] / n * 100).toFixed(1) : "-") + "%(" + n + ")";
  }).join(" "));
  out.push({ tag: r.tag, seed: r.seed, artifact, agree: heldout.agree, ae, al });
}
out.forEach((r, i) => writeFileSync(`tools/neuro/receipts/cit4-cand-${i}.json`, JSON.stringify(r.artifact)));
writeFileSync("tools/neuro/receipts/cit-capacity-sweep.json", JSON.stringify(out.map(({ artifact, ...r }) => r), null, 1));

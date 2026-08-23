// Round 3: recollect with the widened vector, then the pin table for a
// small weight ladder - the winner must hold every supported class.
import { collectCitizenRows, trainArtifact, CIT_CLASSES } from "./distill.mjs";
import { writeFileSync } from "fs";
const data = collectCitizenRows({ towns: 48, days: 14 });
writeFileSync("tools/neuro/receipts/cit-data.json", JSON.stringify(data));
console.log("collected", data.meta.rows, "thinks/tick", data.meta.thinksPerTick, "inputs", data.meta.inputs.length);
const N = CIT_CLASSES.length;
const thin = { "selfcook:food": 1, "soup:food": 1, "arcade:fun": 1, "ball:fun": 1, "vote:vote": 1, "selfcook:drink": 1 };
const mk = (b) => CIT_CLASSES.map(c => thin[c] ? b : 1);
const out = [];
for (const r of [{ tag: "w1", cw: null, seed: 42 }, { tag: "x2", cw: mk(2), seed: 42 },
                 { tag: "x4", cw: mk(4), seed: 42 }, { tag: "x4 s11", cw: mk(4), seed: 11 },
                 { tag: "x4 s7", cw: mk(4), seed: 7 }]) {
  const { artifact, heldout } = trainArtifact({ data, surface: "cit_errand.candidate",
    hidden: 32, epochs: 25, seed: r.seed, noneRatio: null, classWeights: r.cw });
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
out.forEach((r, i) => writeFileSync(`tools/neuro/receipts/cit-cand-${i}.json`, JSON.stringify(r.artifact)));
writeFileSync("tools/neuro/receipts/cit-weight-sweep.json", JSON.stringify(out.map(({ artifact, ...r }) => r), null, 1));

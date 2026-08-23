// Round 5, the shipping run: integer-clean corpus, the pinned recipe.
import { collectCitizenRows, trainArtifact, CIT_CLASSES } from "./distill.mjs";
import { writeFileSync } from "fs";
const data = collectCitizenRows({ towns: 48, days: 14 });
writeFileSync("tools/neuro/receipts/cit-data.json", JSON.stringify(data));
writeFileSync("tools/neuro/receipts/cit-data-meta.json", JSON.stringify(data.meta, null, 1));
console.log("collected", data.meta.rows, "thinks/tick", data.meta.thinksPerTick);
const N = CIT_CLASSES.length;
const thin = { "selfcook:food": 1, "soup:food": 1, "arcade:fun": 1, "ball:fun": 1, "vote:vote": 1, "selfcook:drink": 1 };
const mk = (b) => CIT_CLASSES.map(c => thin[c] ? b : 1);
const out = [];
for (const r of [{ tag: "h48 x4 s42", cw: mk(4), seed: 42 }, { tag: "h48 x4 s7", cw: mk(4), seed: 7 },
                 { tag: "h48 x4 s11", cw: mk(4), seed: 11 }]) {
  const { artifact, heldout } = trainArtifact({ data, surface: "cit_errand.candidate",
    hidden: 48, epochs: 35, seed: r.seed, noneRatio: null, classWeights: r.cw });
  let ae = 0, al = 0;
  for (let b = 1; b < N; b++) ae += heldout.conf[0][b];
  for (let a = 1; a < N; a++) al += heldout.conf[a][0];
  let worst = 1, worstC = "";
  for (let c = 1; c < N; c++) {
    const n = heldout.conf[c].reduce((x, y) => x + y, 0);
    if (n >= 50 && heldout.conf[c][c] / n < worst) { worst = heldout.conf[c][c] / n; worstC = CIT_CLASSES[c]; }
  }
  console.log(`== ${r.tag}: agree ${(heldout.agree * 100).toFixed(2)}% ae ${ae} al ${al} worst ${worstC} ${(worst * 100).toFixed(1)}%`);
  console.log("   " + CIT_CLASSES.map((c, i) => {
    const n = heldout.conf[i].reduce((x, y) => x + y, 0);
    return c + " " + (n ? (heldout.conf[i][i] / n * 100).toFixed(1) : "-") + "%(" + n + ")";
  }).join(" "));
  out.push({ tag: r.tag, seed: r.seed, artifact, agree: heldout.agree, ae, al, worst, worstC });
}
// the pin: every supported class >= 40%, then min act-early, then agreement
const ok = out.filter(c => c.worst >= 0.4);
const pool = ok.length ? ok : out;
pool.sort((a, b) => a.ae - b.ae || b.agree - a.agree);
const win = pool[0];
console.log("winner:", win.tag, ok.length < out.length ? `(pins refused ${out.length - ok.length})` : "(all pins held)");
writeFileSync("tools/neuro/receipts/brain-crab-cit-v1.json", JSON.stringify(win.artifact));
writeFileSync("tools/neuro/receipts/cit-seed-table.json", JSON.stringify(out.map(({ artifact, ...r }) => r), null, 1));

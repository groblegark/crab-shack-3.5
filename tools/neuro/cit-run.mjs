// The citizen distillation run: collect once (expensive), train a seed
// ladder (cheap), pin behaviorally, emit the winner + a receipts table.
import { collectCitizenRows, trainArtifact, CIT_CLASSES } from "./distill.mjs";
import { writeFileSync } from "fs";
const data = collectCitizenRows({ towns: 48, days: 14,
  onTown: (i, s, n) => process.stderr.write(`town ${i}: ${n}\n`) });
writeFileSync("tools/neuro/receipts/cit-data.json", JSON.stringify(data));
console.log("collected", data.meta.rows, "thinks; thinks/tick", data.meta.thinksPerTick);
const byCls = new Array(CIT_CLASSES.length).fill(0);
for (const r of data.rows) byCls[r.cls]++;
console.log("class census:", CIT_CLASSES.map((c, i) => c + "=" + byCls[i]).join(" "));
const cands = [];
for (const seed of [7, 11, 23, 42, 101]) {
  const { artifact, heldout, trainRows } = trainArtifact({
    data, surface: "cit_errand.candidate", hidden: 32, epochs: 25, seed, noneRatio: null });
  // pins: act-early (none->act), act-late (act->none), worst supported-class recall
  let ae = 0, al = 0;
  for (let b = 1; b < heldout.conf[0].length; b++) ae += heldout.conf[0][b];
  for (let a = 1; a < heldout.conf.length; a++) al += heldout.conf[a][0];
  let worst = 1, worstC = "";
  for (let c = 1; c < CIT_CLASSES.length; c++) {
    const n = heldout.conf[c].reduce((x, y) => x + y, 0);
    if (n >= 30 && heldout.conf[c][c] / n < worst) { worst = heldout.conf[c][c] / n; worstC = CIT_CLASSES[c]; }
  }
  cands.push({ seed, artifact, agree: heldout.agree, n: heldout.n, ae, al, worst, worstC, trainRows });
  console.log(`seed ${seed}: agree ${(heldout.agree * 100).toFixed(2)}% of ${heldout.n}, act-early ${ae}, act-late ${al}, worst-recall ${worstC} ${(worst * 100).toFixed(1)}%`);
}
writeFileSync("tools/neuro/receipts/cit-seed-table.json",
  JSON.stringify(cands.map(({ artifact, ...r }) => r), null, 1));
// the ladder's own rule: best agreement AMONG candidates whose pins hold
// (act-early not the worst of the table, no supported class below 40%)
const maxAe = Math.min(...cands.map(c => c.ae)) * 2 + 8;
const ok = cands.filter(c => c.ae <= maxAe && c.worst >= 0.4);
const win = (ok.length ? ok : cands).sort((a, b) => b.agree - a.agree)[0];
console.log("winner: seed", win.seed, ok.length < cands.length ? `(pins refused ${cands.length - ok.length})` : "(all pins held)");
writeFileSync("tools/neuro/receipts/brain-crab-cit-v1.json", JSON.stringify(win.artifact));

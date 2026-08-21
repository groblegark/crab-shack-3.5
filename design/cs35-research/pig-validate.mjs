// Structural validator for the draft pig culture art block (spec pass, not a pixel pass).
// Checks: rect-ness (all rows equal length), declared dims, palette closure
// (every char is '.' or in the declared palette), pose completeness, colorway
// slot coverage, accessory/item rect+palette, q15 sanity on all RGB.

const palette = {
  K: [30, 20, 36],    // outline (matches base PAL.K)
  P: [255, 181, 197], // body pink   — colorway slot
  Q: [214, 121, 140], // body shade  — colorway slot
  B: [30, 20, 36],    // pupil / nostril
  Y: [255, 230, 120], // straw
  A: [255, 216, 96],  // hat band amber
  L: [250, 250, 255], // bun white
};
const colorways = [
  { P: [255, 181, 197], Q: [206, 116, 140] },
  { P: [230, 160, 120], Q: [172, 106, 80] },
];
const body = {
  w: 12, h: 16, slots: ["P", "Q"],
  anchors: { hat: { x: 1, y: 2 }, carry: { x: 2, y: -7 }, mark: { x: 9, y: -6 }, bar: { w: 12 } },
  poses: {
    a: [
      "..KK....KK..",
      ".KPPKKKKPPK.",
      ".KPPPPPPPPK.",
      ".KPBPPPBPPK.",
      ".KPQQQQQQPK.",
      ".KPQBQQBQPK.",
      ".KPPQQQQPPK.",
      "..KPPPPPPK..",
      "..KKKKKKKK..",
      ".KPPPPPPPPK.",
      "KPKPQQQQPKPK",
      "KQKPQQQQPKQK",
      ".KPPPPPPPPK.",
      "..KPPKKPPK..",
      "..KQQKKQQK..",
      "..KKKKKKKK..",
    ],
    b: [
      "..KK....KK..",
      ".KPPKKKKPPK.",
      ".KPPPPPPPPK.",
      ".KPBPPPBPPK.",
      ".KPQQQQQQPK.",
      ".KPQBQQBQPK.",
      ".KPPQQQQPPK.",
      "..KPPPPPPK..",
      "..KKKKKKKK..",
      ".KPPPPPPPPK.",
      "KPKPQQQQPKPK",
      "KQKPQQQQPKQK",
      ".KPPPPPPPPK.",
      ".KPPK..KPPK.",
      ".KQQK..KQQK.",
      ".KKKK..KKKK.",
    ],
    w: [
      "..KK....KK..",
      ".KPPKKKKPPK.",
      ".KPPPPPPPPK.",
      ".KPBPPPBPPK.",
      ".KPQQQQQQPK.",
      ".KPQBQQBQPK.",
      ".KPPQQQQPPK.",
      "KQKPPPPPPKQK",
      "KPKKKKKKKKPK",
      "KPKPPPPPPKPK",
      ".KPPQQQQPPK.",
      ".KPPQQQQPPK.",
      ".KPPPPPPPPK.",
      "..KPPKKPPK..",
      "..KQQKKQQK..",
      "..KKKKKKKK..",
    ],
    s: [
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "..KK....KK..",
      ".KPPKKKKPPK.",
      ".KPPPPPPPPK.",
      ".KPKKPKKPPK.",
      ".KPQQQQQQPK.",
      ".KPQBQQBQPK.",
      ".KPPQQQQPPK.",
      "KPPPPPPPPPPK",
      "KPQQPPPPQQPK",
      ".KKKKKKKKKK.",
    ],
  },
};
const accessories = {
  strawhat: {
    dx: 0, dy: -3,
    rows: [
      "..KYYYYK..",
      "..KAAAAK..",
      "KYYYYYYYYK",
      "KKKKKKKKKK",
    ],
  },
};
const items = {
  bao: {
    rows: [
      ".........",
      "...KKK...",
      "..KLKLK..",
      ".KLLPLLK.",
      ".KLLLLLK.",
      ".KLLLLLK.",
      "..KKKKK..",
    ],
  },
};

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? "PASS" : "FAIL") + "  " + msg); if (!cond) fail++; };

function checkGrid(name, rows, expectW, expectH) {
  const widths = new Set(rows.map(r => r.length));
  ok(widths.size === 1, `${name}: all ${rows.length} rows equal length (${[...widths].join(",")})`);
  if (expectW != null) ok(rows[0].length === expectW, `${name}: width ${rows[0].length} == ${expectW}`);
  if (expectH != null) ok(rows.length === expectH, `${name}: height ${rows.length} == ${expectH}`);
  const badChars = new Set();
  for (const r of rows) for (const ch of r) if (ch !== "." && !(ch in palette)) badChars.add(ch);
  ok(badChars.size === 0, `${name}: chars all in declared palette+'.'${badChars.size ? " (bad: " + [...badChars].join("") + ")" : ""}`);
  const used = new Set();
  for (const r of rows) for (const ch of r) if (ch !== ".") used.add(ch);
  return used;
}

// poses
for (const p of ["a", "b", "w", "s"]) ok(p in body.poses, `pose '${p}' present`);
const usedAll = new Set();
for (const [p, rows] of Object.entries(body.poses)) {
  for (const ch of checkGrid(`pose ${p}`, rows, body.w, body.h)) usedAll.add(ch);
}
// colorway slots exist in palette and are actually used by the body
for (const s of body.slots) {
  ok(s in palette, `slot '${s}' declared in palette`);
  ok(usedAll.has(s), `slot '${s}' used by body art`);
}
for (const [i, cw] of colorways.entries())
  ok(body.slots.every(s => Array.isArray(cw[s]) && cw[s].length === 3), `colorway ${i} covers slots [${body.slots}]`);
// anchors in/near bounds
const A = body.anchors;
ok(A.hat.x >= 0 && A.hat.x < body.w && A.hat.y >= 0 && A.hat.y < body.h, "hat anchor inside body box");
ok(A.bar.w <= body.w, `bar width ${A.bar.w} <= body w ${body.w}`);
ok(A.carry.y + 7 <= 0, "carry anchor floats a 9x7 item fully above the box (rows end <= 0)");
ok(A.carry.x >= 0 && A.carry.x + 9 <= body.w + 7, "carry x keeps 9-wide item near body");
// accessory
const hat = accessories.strawhat;
checkGrid("acc strawhat", hat.rows, null, null);
const hatW = hat.rows[0].length, hatH = hat.rows.length;
const hx = A.hat.x + hat.dx, hy = A.hat.y + hat.dy;
ok(hx >= 0 && hx + hatW <= body.w, `strawhat cols ${hx}..${hx + hatW - 1} within body 0..${body.w - 1}`);
ok(hy + hatH - 1 === A.hat.y, `strawhat brim row ${hy + hatH - 1} lands on hat anchor row ${A.hat.y}`);
// item
checkGrid("item bao", items.bao.rows, 9, 7);
// q15 sanity: every RGB channel 0..255 int
for (const [k, v] of Object.entries(palette))
  ok(v.length === 3 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 255), `palette ${k} rgb valid`);

console.log(fail === 0 ? "\nALL CHECKS PASS" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);

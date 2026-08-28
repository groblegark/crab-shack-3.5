// THE SEA, PHOTOGRAPHED ON THE DAYS THAT DIFFER. Matt asked for the surf
// forecast sign to come down and the weather to be "implied by subtle
// graphical queues" instead. The obvious failure mode of that request is a
// change that reads well in a diff and paints the same water every day, so
// this shoots the proof: it hunts the town's OWN almanac for the archetype
// days - glassy-and-big, blown-and-big, a coming storm, dead flat - and takes
// one picture of each through the game's own renderer.
//
// It photographs the SEA, not the town, so it deliberately does not hunt for
// a busy frame: the crabs on the boardwalk are day-2 crabs in every shot and
// only `day` moves between them. That is the point - hold everything else
// still and let the water be the only variable.
//
//   node tools/shoot-sea.mjs [outdir] [seed]
import { createVisibleSim } from "../mcp/render.mjs";
import { encodePNG } from "../mcp/png.mjs";
import { writeFileSync, mkdirSync } from "fs";

// THE SEA IS 28 SCREEN PIXELS. A full 256x240 frame is the honest picture -
// this is the game, not a mock-up - but at that size the cues it is meant to
// prove are a smear, so each day is shot twice: the whole screen, and the
// water on its own blown up. Crop from the framebuffer rather than
// re-rendering, so the strip is provably the same pixels as the frame.
const strip = (rgba, w, y0, y1, scale) => {
  const h = y1 - y0, out = new Uint8Array(w * h * 4);
  out.set(rgba.subarray(y0 * w * 4, y1 * w * 4));
  return encodePNG(out, w, h, { scale });
};

const outdir = process.argv[2] || "/tmp/sea";
const seed = Number(process.argv[3] || 1337);
mkdirSync(outdir, { recursive: true });

const sim = createVisibleSim({ seed });
sim.runDays(2);

// THE HUNT. Read the almanac forward and score each day against the four
// pictures we want. swellPeakQ16/windPeakQ16 are pure functions of the day,
// so this costs nothing and consumes no randomness.
const days = JSON.parse(sim.G(`JSON.stringify((() => {
  const out = [];
  for (let d = 1; d <= 400; d++)
    out.push({ d, s: swellPeakQ16(d) / 65536, w: windPeakQ16(d) / 65536,
               q: surfQualityQ16(d) / 65536, c: surfForecast(d) ? surfForecast(d).n : 0 });
  return out;
})())`));

const pick = (name, score) => {
  let best = null;
  for (const r of days) { const v = score(r); if (v != null && (!best || v > best.v)) best = { v, r }; }
  return best && { name, ...best.r };
};

const SHOTS = [
  // A DAY THAT FIRES: a real swell with the wind off it. Feathering crests,
  // long specular glass, few and far-between sets.
  pick("firing", (r) => (r.s > 0.55 && r.w < 0.22 ? r.q : null)),
  // THE SAME SWELL, BLOWN OUT. This is the shot that has to look DIFFERENT
  // from the one above or the sign was load-bearing after all.
  pick("blown", (r) => (r.s > 0.55 && r.w > 0.6 ? r.w : null)),
  // A STORM ON ITS WAY: forerunners running through, and its own cloud bar
  // thickening on the horizon.
  // Wind is held DOWN here on purpose: a squall bar over a sea already torn to
  // pieces is a picture of the wind, and the cue being photographed is the one
  // that says something is on its way.
  pick("coming", (r) => (r.c === 1 && r.s < 0.25 && r.w < 0.3 ? 1 - r.w : null)),
  // NOTHING DOING. Flat, light wind - the town's ordinary Tuesday.
  pick("flat", (r) => (r.s < 0.12 ? 1 - r.w : null)),
].filter(Boolean);

// THE SEA IS SCREEN-FIXED, so any camera frames it. Park at the beach ball's
// sand (the surf break) at midday, with every card and menu shut so nothing
// prints over the water.
// `musNudged` is set INSIDE the draw path (the MUS chip invites you to the
// music box the first time it is drawn after 09:30), so nulling the toast
// before framing is not enough - it comes back during the frame and prints a
// banner straight across the water. Pre-arm it instead.
for (const s of SHOTS) {
  sim.G(`day = ${s.d}; tday = 720 * 5; reclock(); musNudged = true;
         camX = clampCam(1140); toast = null; sel = null; dossier = null; manage = null;`);
  const png = sim.frame({ scale: 3 });
  writeFileSync(`${outdir}/sea-${s.name}.png`, png);
  // SKY_H 58, SHORE_Y 86 - take a few rows either side so the storm's cloud
  // bar above the horizon and the shorebreak surge below it are both in.
  writeFileSync(`${outdir}/sea-${s.name}-water.png`, strip(sim.screen.rgba, 256, 40, 96, 6));
  console.log(`${outdir}/sea-${s.name}.png  day ${s.d}  swell ${s.s.toFixed(2)}` +
              `  wind ${s.w.toFixed(2)}  quality ${s.q.toFixed(2)}${s.c ? `  storm in ${s.c}` : ""}`);
}

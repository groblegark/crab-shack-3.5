// THE HOME SCREEN, PHOTOGRAPHED. Every other shoot-*.mjs points the camera at
// the town; nothing had ever pointed it at the title, because the soft canvas
// threw on bigText's magnified logo the moment it tried. mcp/canvas.mjs grew
// an integer-scale drawImage for exactly this, so the screen a player sees
// first is now the screen an agent can look at.
//
//   node tools/shoot-title.mjs [outdir] [seed]
//
// Shoots the title in both save states (a returning player has CONTINUE and
// the whole menu ladder drops 20px; a first-timer does not) and in both
// screen heights, because the motto and the news bar have to clear the menu
// in all four - that is the collision this tool exists to check.
import { createVisibleSim } from "../mcp/render.mjs";
import { encodePNG } from "../mcp/png.mjs";
import { writeFileSync, mkdirSync } from "fs";

const outdir = process.argv[2] || "/tmp/title";
const seed = Number(process.argv[3] || 1337);
mkdirSync(outdir, { recursive: true });

// viewT is the ticker's and the motto's only clock, so a shot is pinned by
// setting it rather than by waiting: 0.4 catches the newest entry with the
// unseen badge lit, 9.0 is three headlines further on.
const shot = (sim, name) => {
  writeFileSync(`${outdir}/${name}.png`,
    encodePNG(sim.screen.rgba, sim.screen.width, sim.screen.height, { scale: 3 }));
  console.log("wrote", `${outdir}/${name}.png`);
};
const title = (sim, { save = true, t = 0.4, motto = null, news = false, page = 0 } = {}) => {
  sim.G(`window._headless = false;
         try {
           screen = "title"; hasSave = ${save}; viewT = ${t};
           ${motto == null ? "" : `mottoBase = ${motto};`}
           newsView = ${news}; newsPage = ${page};
           titleFrame(0.016);
           drawNewsBoard();
         } finally { window._headless = true; }`);
};

for (const screenH of [240, 288]) {
  for (const save of [false, true]) {
    const sim = createVisibleSim({ seed, screenH });
    sim.runTicks(40);                      // let the town populate behind the card
    // ONE FRAME WITH THE FLAG DOWN, the same contract render.mjs uses: the
    // view is a reader, so drawing the title moves no sim state.
    title(sim, { save, t: 0.4, motto: 0 });
    shot(sim, `title-${screenH}-${save ? "save" : "fresh"}`);
  }
}
// The ticker four headlines in, and the board it opens - the two states a
// screenshot of the home screen cannot show at the same time.
{
  const sim = createVisibleSim({ seed });
  sim.runTicks(40);
  title(sim, { t: 18.5, motto: 12 });
  shot(sim, "title-240-ticker-late");
  for (let pg = 0; pg < 4; pg++) { title(sim, { t: 0.4, news: true, page: pg }); shot(sim, `board-p${pg + 1}`); }
}
// EVERY MOTTO, PHOTOGRAPHED. The tilt is capped and then spread, so thelong ones
// flatten - the only way to know none of them climbs into the MUSIC button or
// runs off the left edge is to look at all of them.
{
  const sim = createVisibleSim({ seed });
  sim.runTicks(40);
  const n = Number(sim.G("GAME_MOTTOS.length"));
  for (let i = 0; i < n; i++) { title(sim, { t: 0.4, motto: i }); shot(sim, `motto-${String(i).padStart(2, "0")}`); }
}

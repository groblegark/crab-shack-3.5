// Crab personalities: names, traits, commute modes, and quips.

const CRAB_NAMES = [
  "PINCHY", "CLAWDIA", "SHELLDON", "SANDY", "BUBBLES", "SCUTTLE",
  "CORAL", "SNIPPY", "HERMIE", "SALTY", "MITTENS", "KELP",
];

// `thrift` is TWENTIETHS of tonight's roof a crab thinks to keep back before
// spending on themselves (20 = exactly the rent, 0 = never plans past today).
// It is read only by spendKeep() in game.js and it is a PERSONALITY, not a
// difficulty dial: a town where everybody reserves the same amount is safer
// and much duller, and the differently-wrong crabs are where the comedy lives.
// The values follow each trait's existing character rather than a curve -
// DREAMY is not bad at arithmetic, she is looking at a cloud.
const TRAITS = {
  speedy: {
    label: "SPEEDY", move: 1.4, work: 1.0, tip: 1.0, thrift: 18,
    quips: {
      commute: ["GOTTA GO FAST", "ZOOM ZOOM", "NO TIME!"],
      work: ["ORDER UP!", "FASTER! FASTER!", "DONE ALREADY"],
      home: ["LAPS ON THE BEACH", "CAN'T SIT STILL"],
    },
  },
  lazy: {
    label: "LAZY", move: 0.85, work: 0.85, tip: 1.0, thrift: 6, lateMin: 45,
    quips: {
      commute: ["5 MORE MINS...", "WHY SO EARLY", "YAWN"],
      work: ["BREAK TIME YET?", "SO MANY ORDERS", "UGH, TOURISTS"],
      home: ["NAP O'CLOCK", "ZZZ...", "COMFY SAND"],
    },
  },
  cheery: {
    label: "CHEERY", move: 1.0, work: 1.0, tip: 1.25, thrift: 20,
    quips: {
      commute: ["WHAT A MORNING!", "HI SEAGULLS!", "LOVE THIS TOWN"],
      work: ["SERVICE W. A SMILE", "ENJOY!", "MY PLEASURE!"],
      home: ["BEST DAY EVER", "SUNSETS RULE"],
    },
  },
  grumpy: {
    label: "GRUMPY", move: 1.0, work: 1.15, tip: 0.9, thrift: 24,
    quips: {
      commute: ["TRAFFIC. GREAT.", "SAND IN MY SHOES", "HMPH"],
      work: ["YES YES, TACO", "I'M CHOPPING OK", "TOURISTS..."],
      home: ["FINALLY. QUIET.", "DON'T KNOCK"],
    },
  },
  tidy: {
    label: "TIDY", move: 1.0, work: 1.1, tip: 1.05, thrift: 28,
    quips: {
      commute: ["CLAWS WASHED", "EARLY IS ON TIME"],
      work: ["MISE EN PLACE", "CLEAN AS YOU GO", "SPOTLESS"],
      home: ["SWEEPING MY DUNE", "ALL SHIPSHAPE"],
    },
  },
  dreamy: {
    label: "DREAMY", move: 0.95, work: 0.9, tip: 1.15, thrift: 4, pauses: true,
    quips: {
      commute: ["LOOK, A CLOUD...", "THE WAVES SING", "OOH SHINY SHELL"],
      work: ["WAIT, WHAT ORDER?", "THE GRILL DANCES", "PRETTY FLAMES"],
      home: ["COUNTING STARS", "THE SEA CALLS"],
    },
  },
};

const MODES = {
  walk:  { label: "WALKS",  speed: 30 },
  bike:  { label: "BIKES",  speed: 75 },
  bus:   { label: "RIDES THE BUS", speed: 30 },   // walking speed to/from stops
  buggy: { label: "DRIVES", speed: 115 },
};

const ACC_KEYS = ["cap", "bow", "shades", "flower", "none"];
const TRAIT_KEYS = Object.keys(TRAITS);
const MODE_KEYS = Object.keys(MODES);

// the two founders are always the same, so every new game opens fair;
// hires are the gacha
const FOUNDERS = [
  { name: "PINCHY", trait: "speedy", mode: "walk", acc: "none" },
  { name: "CLAWDIA", trait: "tidy", mode: "bike", acc: "flower" },
];
function makeCrabPersona(i, rng) {
  // THE SIM STREAM, not the host's. This defaulted to Math.random, which was
  // the same cursor only for as long as the sim stream WAS the host's. Once a
  // save carries its cursor (2026-08-22), a persona minted after a load would
  // have kept drawing from wherever the SESSION left Math.random - so a
  // reloaded town hired different crabs depending on what you did before
  // loading it, which is the exact bug the ruling closes. `srand` is game.js's
  // and resolves at call time: crabs.js evaluates first, but nobody mints a
  // persona until game.js has defined it.
  rng = rng || (typeof srand === "function" ? srand : Math.random);
  if (FOUNDERS[i]) return Object.assign({
    color: i, shift: i % 2 === 0 ? "M" : "E", house: i, wallet: 1000,   // cents
  }, FOUNDERS[i]);
  return {
    name: CRAB_NAMES[i % CRAB_NAMES.length],
    trait: TRAIT_KEYS[(rng() * TRAIT_KEYS.length) | 0],
    mode: MODE_KEYS[(rng() * MODE_KEYS.length) | 0],
    acc: ACC_KEYS[(rng() * ACC_KEYS.length) | 0],
    color: i % CRAB_COLORS.length,
    shift: i % 2 === 0 ? "M" : "E",   // alternate morning/evening
    wallet: 1000,   // cents
    house: i,
  };
}

const SHIFTS = {
  D: { label: "830-1830", start: 8.5 * 60, end: 18.5 * 60 },   // owner-operator: dinner hour before the shack closes
  M: { label: "8-14", start: 8 * 60, end: 14 * 60 },
  E: { label: "14-20", start: 14 * 60, end: 20 * 60 },
};

// walk-in customers are crabs too, and everybody has a name
const CUSTOMER_NAMES = [
  "GARY", "SHELLY", "EBB", "FLO", "BARNABY", "PEARL", "SANDRO", "MISTY",
  "CLACKERS", "NIPPY", "BRINY", "KRILL BILL", "ANEMONE", "WAVY DAVE",
  "MOLT", "SCAMPI", "ROE", "MAUDE", "SNAPPY", "BUOY", "SALTINE", "DIP",
  "TIDEPOOL TIM", "SURF MOM", "PLANKTON PETE", "BIG PALP",
];

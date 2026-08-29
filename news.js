// THE NEWS BOARD, and the mottos under the sign. Both are copy, not code:
// this file is hand-written and holds no logic, so adding an announcement is
// editing a list and nothing else.
//
// WHY IT IS NOT GENERATED. version.js and cultureways.js are generated because
// their content is a FACT about the tree (a sha, a bundle hash) that a human
// would only get wrong. A release note is the opposite: it is the one thing a
// commit subject cannot be derived into. "restore the RULED gentle-decay
// crowding curve, retire the hard cap of 3" is exactly right for the log and
// exactly wrong for a player, who wants to be told that a busy shack now slows
// down instead of walling off. So the log stays the log and this stays the
// announcement, and the two are written for different readers on purpose.
//
// WHO ADDS TO IT: whoever lands a change a PLAYER can feel. Not every merge -
// a refactor, a receipt, a test battery and a tooling fix are all invisible
// from the beach and belong in the git log alone. The bar is "would somebody
// who plays this notice?", and if the answer is no the right number of entries
// is zero.
//
// THE SHAPE, pinned by newsProblem() in game.js so a typo cannot take the
// title screen down with it:
//   d  the landing date, "YYYY-MM-DD". Sorted on, newest first, and shown.
//   k  the kind: "FEATURE", "BALANCE" or "FIX". Anything else is refused.
//   t  the headline. It rides the ticker under the sign, and it must FIT the
//      board's headline column - newsProblem measures it, so the limit is the
//      column and not a number written down twice. That is 41 characters
//      today; if it ever is not, the validator is the thing that is right.
//   b  the body, 0-3 lines, each of which must fit the board's body column
//      (55 characters today, measured the same way). Say what CHANGED FOR THE
//      PLAYER, in the words a player would use.
// Order in this file does not matter - the board sorts by date - but keeping
// it newest-first means the diff for a new entry is always at the top.
const GAME_NEWS = [
  { d: "2026-08-29", k: "FEATURE", t: "A TAP AT THE FAR END OF THE BEACH",
    b: ["THE HOTEL HAS ITS OWN WATER NOW. NOBODY OUT EAST HAS TO",
        "WALK THE WHOLE PROMENADE FOR A DRINK ANY MORE."] },
  { d: "2026-08-29", k: "BALANCE", t: "A PACKED SHACK SLOWS, IT NEVER WALLS OFF",
    b: ["THE HARD LIMIT OF THREE AT A TABLE IS GONE. CROWDING",
        "NOW EASES OFF ALONG A CURVE, SO A FOURTH CRAB IS A",
        "SLOWER SERVE RATHER THAN A CLOSED DOOR."] },
  { d: "2026-08-29", k: "BALANCE", t: "SLEEP DEBT CAN NOW KILL A CRAB",
    b: ["A CRAB WHO NEVER GETS TO BED NO LONGER JUST GRUMBLES.",
        "WATCH THE ROTA - A DOUBLE SHIFT COSTS SOMETHING REAL."] },
  { d: "2026-08-29", k: "FEATURE", t: "SURFING WORKS UP AN APPETITE",
    b: ["AN HOUR IN THE WATER BURNS HUNGER AND THIRST TWICE AS",
        "FAST AND GETS YOU SANDY. IT CURES BOREDOM AND IT DOES",
        "NOT REST YOU - THE SEA IS NOT A NAP."] },
  { d: "2026-08-28", k: "FEATURE", t: "CRABS PADDLE OUT WHEN IT IS GOOD",
    b: ["THE FORECAST SIGN CAME DOWN AND THE SEA TOOK THE JOB.",
        "READ THE CHOP AND THE SETS: A BIG SWELL WITH THE WIND",
        "ON IT IS WORTH NOTHING, AND THE TOWN KNOWS IT."] },
  { d: "2026-08-27", k: "BALANCE", t: "TOWNSFOLK GET HUNGRY ROUND THE CLOCK",
    b: ["A RESIDENT'S NEEDS NOW TICK CONTINUOUSLY INSTEAD OF IN",
        "STEPS. THE TOWN IS HUNGRIER AND HARDER TO GROW."] },
  { d: "2026-08-26", k: "FEATURE", t: "THE MUSIC BOX IS THE WHOLE PLAYLIST",
    b: ["TWELVE TRACKS, AUDITIONABLE, WITH A THUMB ON EACH ONE.",
        "THE BOX OPENS FROM HERE AND FROM THE TOWN."] },
  { d: "2026-08-26", k: "FEATURE", t: "A CRAB KEEPS TONIGHT'S RENT BACK",
    b: ["SPENDING RUNS THROUGH A RESERVE SET BY TEMPERAMENT.",
        "A CAUTIOUS CRAB WALKS PAST YOUR COUNTER TO MAKE RENT."] },
  { d: "2026-08-26", k: "FEATURE", t: "GUESTS DECIDE WHEN TO GO HOME",
    b: ["A VISITOR NOW PICKS HER OWN DEPARTURE INSTEAD OF BEING",
        "SENT OFF ON A TIMER, AND THE CARD TELLS YOU WHY."] },
  { d: "2026-08-26", k: "FEATURE", t: "ONE TICKET, MANY PLATES",
    b: ["AN ORDER CAN BE A WHOLE TRAY NOW, NOT A SINGLE DISH."] },
  { d: "2026-08-26", k: "FIX", t: "A LONG TOAST CRAWLS INSTEAD OF FLEEING",
    b: ["MESSAGES TOO WIDE FOR THE SCREEN USED TO RUN OFF THE",
        "EDGE. THEY SCROLL NOW, SO YOU GET TO READ THEM."] },
  { d: "2026-08-26", k: "FIX", t: "THE RECORD BOX PLAYS ON IPHONES",
    b: ["ONE SOURCE, ONE PLAY, INSIDE YOUR TAP - WHICH IS THE",
        "ONLY THING IOS WILL ACCEPT. SAFARI IS SORTED TOO."] },
  { d: "2026-08-26", k: "FEATURE", t: "THE SEA HAS WEATHER OF ITS OWN",
    b: ["SWELL AND WIND RUN ON AN ALMANAC THE TOWN CANNOT SEE",
        "COMING. EVERY TOWN GETS ITS OWN YEAR OF SURF."] },
];

// THE MOTTO UNDER THE SIGN - Minecraft's splash, in a town that sells snacks.
//
// RULES OF THE ROOM, learned from the ones that had to be cut: it is SHOUTED
// (the font has no lower case), it is <= 30 characters (past that the tilt
// flattens to nothing and it stops reading as a splash), and it never says
// anything a player could mistake for a mechanic. A joke that sounds like a
// hint is a bug report waiting to happen: "TIP THE CHEF!" reads as a feature
// nobody built. Absurd, fond, or a wink at the genre - never instructional.
const GAME_MOTTOS = [
  "NOW WITH 100% MORE CRAB!",
  "ALSO TRY THE PORK BUN!",
  "IT IS TIDAL!",
  "PINCHY APPROVES!",
  "ECONOMICALLY SPEAKING!",
  "THE CRABS ARE REAL!",
  "SIDEWAYS IS A DIRECTION!",
  "SMELL THE VINEGAR!",
  "NO CRABS WERE BILLED!",
  "SEVENTEEN KINDS OF SAND!",
  "THE GULLS ARE WATCHING!",
  "MIND THE RENT!",
  "SHELL BE RIGHT!",
  "A WHOLE BEACH ECONOMY!",
  "HOT CHIPS, COLD SEA!",
  "EMPLOYS LOCAL CRABS!",
  "SUNBURN NOT SIMULATED!",
  "THE PIER IS LOAD BEARING!",
  "AS SEEN FROM THE WATER!",
  "TASTES LIKE SUMMER!",
  "SOMEBODY HAS TO DO IT!",
  "CRUSTACEANS WELCOME!",
  "PAY DAY IS EVERY DAY!",
  "OPEN LATE, USUALLY!",
  "DO NOT FEED THE GULLS!",
  "CLOSED FOR THE SWELL!",
  "SALT IN THE MACHINERY!",
  "TWELVE OUT OF TEN PIERS!",
  "RUNS ON A TOY PPU!",
  "MADE OF ACTUAL PIXELS!",
  "THE SEA IS FREE!",
  "STILL BETTER THAN WORK!",
  "BEACH TOWN SIMULATOR!",
  "WATCH YOUR STEP!",
  "EVERY CRAB HAS A NAME!",
  "IT IS ALWAYS SEASON!",
  "BUCKET AND SPADE READY!",
  "GONE SURFING!",
  "SUNSCREEN OPTIONAL!",
  "LOOK AT THAT SWELL!",
  "SANDY UNDERFOOT!",
  "THE BUS RUNS ON TIME!",
  "A LITTLE BIT BRINY!",
  "NO TWO TIDES ALIKE!",
  "TOO MANY DECK CHAIRS!",
  "SEAGULLS: NOT A FEATURE!",
  "ASK ABOUT THE SPECIAL!",
  "HELD TOGETHER BY ROPE!",
  "WE HAVE ICE!",
  "THAT IS NOT A ROCK!",
];

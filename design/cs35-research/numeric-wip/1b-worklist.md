# 1b — sub-cent intermediates + the grid integers (the close-out)

- [x] tip product in MILLI-CENTS: the two float-derived factors (patience
      ratio, charm multiplier) cross into Q16 at one named line and fold to a
      single Q16 factor; `TIP_COUNTER` 0.15 is carried as the exact rational
      3/20; worst-case numerator ~1.2e12, comfortably exact
- [x] ONE round-half-up at `payTip`'s door (`tipCentsOf`), and the visitor's
      purse clamp applied in milli-cents so the round cannot push a guest past
      the bottom of their own pocket (the clamp is whole cents, so rounding it
      is identity)
- [x] `payTip` split on int twentieths: `cut = floor(amt * n / 20)`,
      `till = amt - cut` — exact by construction, not by two roundings that
      happen to agree. Floor per the arithmetic contract: a rescale floors,
      only the door rounds
- [x] `bizTipShare/setTipShare` store int twentieths 0..20; the double-round
      snap hack retires (7 x 0.05 = 0.35000000000000003 no longer exists to
      snap). `setTipShare` still ANSWERS in fractions — the card asks in them
- [x] `otPremium` as one exact rational `floor(wage_c * 3 * mins / (2 * span))`;
      `hourlyRate` folded into it and DELETED — it is the shape of the fraction
      now, not a number. `mins` is the one approximate input left and the floor
      contains it; slice 2 makes it whole deci-game-minutes
- [x] `bizPriceMul` -> int board index 14..26 (`bizPriceIdx`), `menuPrice` the
      exact rational `floor((pay * n + 10) / 20)`, `bizPricePct` = n * 5 exact;
      the rival's CUT and the hotelier's steps walk index steps; both end-stop
      epsilon guards (`PRICE_MIN - 1e-9`, `PRICE_MAX + 1e-9`) retire
- [x] `priceAppeal` -> baked `PRICE_APPEAL_Q16` (tools/gen-luts.mjs, generator
      committed beside the table). **The sim's last `Math.pow` is gone.**
      LUT[20] is exactly 65536, so a town at the default board is bit-identical
- [x] save migration: `_grid = 1` beside `_num = 1`. The grids need their own
      flag rather than a sniff because the ranges OVERLAP — a stored tipShare
      of 1 is 100% in the old units and 5% in the new
- [x] `dorm.take` drops its float-dollar `round(x*100)/100` idiom (provably
      identity on integer cents, but a lie about the unit)
- [x] scenarios re-expressed at the unit boundary + mutation-tested

**1b IS COMPLETE, AND SLICE 1 IS CLOSED.** Suite **253/253, exit 0** (run2).

Verification, all ten points of numeric-protocol.md par.2:
- floor pinned on the landing tree first (it was 1a's verified tree, unchanged)
- baseline `--days 30 --seeds 16` -> **0/16 exact, median 12**; growth
  `--days 40 --seeds 16 --buy chef,table` -> **4/16**. Both IDENTICAL to 1a's
  numbers: the floor did not move by one town in either direction
- conservation soak: 210 audited fund movements over three 30-day seeds, every
  one `delta === want` EXACTLY; take/remit/pay all exercised (soak.mjs)
- **the receipted fingerprint re-baseline** (the one slice 1 takes, retiring
  1a's provisional re-point): exactly ONE field moved across both seeds —
  1337's coins, 14822 -> 14821 — and seed 4242 is byte-identical whole.
  `fpdiff.mjs --money-tol 1`: 1 rounding-shaped, 0 behavior-shaped. The
  tolerance is a CENT because the fingerprint counts cents; said out loud here
  and in the scenario comment, per the tool's own rule
- **attributed, not assumed**: arming the old float tip product back on this
  tree returns 1337 to 14822 and leaves 4242 where it stands, so the cent is
  the tip product's Q16 quantization. The other three changes are provably
  inert on a default town — the split floors n/20 with n = 0, the board sits at
  index 20 where menuPrice is the recipe price and the LUT is exactly 65536,
  and nobody works a minute of overtime in a two-day window
- cross-engine receipt refreshed on the FINAL tree: both seeds bit-identical
  under JavaScriptCore, whole fingerprint (1b-crossengine.txt)
- three assertions re-expressed, three mutations, all biting:
  * split rounds instead of flooring -> "at 35% the crab pocketed 298,
    expected 297". **The first attempt did NOT bite** — the scenario's shares
    (0, 50%, 100%) never land a cut on a half cent, so floor and round agreed
    and the rule was unproven. Fixed by adding 35% and 5% shares, which is the
    only place the two rules disagree. A relaxation with no biting mutation is
    refused; this one nearly slipped through as one
  * the twentieths clamp stops biting -> the roundtrip's corrupt-value
    assertion fails
  * the grain moves by half a step -> "0.37 did not store as 7 twentieths"

**NEXT: slice 2, CLOCK -> master int tick** (numeric-protocol.md par.1): the
frame dt plumbing to a tick counter, `tmin` to deci-game-minutes (14,400/day,
exact midnights), sim `time` killed, the 42 `-= dt` timers to tick counts, and
then the browser dt-quantizer as its own headless-inert landing. Two landings,
one re-baseline. `otPremium`'s `mins` becomes whole deci-game-minutes there,
which retires the last approximate input in the money orbit.

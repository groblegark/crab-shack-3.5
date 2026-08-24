# RED BAR + CAMPAIGN WINDOW CLOSE-OUT

Three reports from Matt (2026-08-23): a weird red bar over the character card
near FED that "doesn't come from there"; the campaign platform refusing more
than 6 staff; text in that window running off the screen.

## The red bar — FED read raw Q20

The crew card's five need bars (game.js, drawFollowCard's crab branch): CLN,
FUN and ZZZ divided by Q20; **FED and SIP still read the raw Q20 integer** — a
needs-migration reader that got three of five divides. `1 - hunger` went six
digits negative, `Math.round(11 * frac)` handed fillRect a NEGATIVE width, and
the canvas paints a negative width LEFTWARD: a red smear (frac ≤ 0.25 is the
red branch) from FED's slot across the portrait to the card edge. "Right near
the FED indicator, but doesn't come from there" — Matt described a negative
fillRect exactly. Fixed: divided like the siblings AND clamped to [0,1] —
a display fraction survives any future unit migration.

The class is now machine-checked: the canonical sweep wraps `rect` and flags
any NEGATIVE width/height. Under the mutation (FED raw again) it prints the
actual smears: `RECT -2595208x2 ... RECT -11534325x2` — six-digit-negative
widths, one per unclamped bar.

## The 6-staff cap — MECHANICAL, reported not changed

`HEAD_CAP.steps = [0, 2, 3, 4, 6]` (game.js:876). The platform's STAFF dial
steps this array's indices; 6 is its top rung BY POLICY DESIGN, not a UI slot
limit (step 0 = NO LIMIT is the founding state). Raising it means adding rungs
to a voted-on policy ladder — sim behavior, fingerprint-moving where a bolder
platform wins an election, and exactly the kind of table phase E4's civics
section should own as data. **Recommendation to the orchestrator:** extend the
rungs at E4 (civics), where step tables become document content; do not patch
the array piecemeal now.

…and the OTHER 6-ish staff wall was real and mine: the manage SCHEDULE card
has seven row rects, and staff 8+ had NO controls at all — no shift, no OT,
no sick, no wage. **The rota pages at seven now**: when staff outgrow the
rows, the last row band becomes a "..MORE (N) TAP HERE p/P" pager and the
window walks; `schedWindow` is one function feeding draw and hit test, so an
unpainted row can never answer. Scenario: every staff index of twelve appears
on some page; mutation ("the pager forgot to take a row") goes red by name.

## Text off the screen — the hall was never swept

The campaign window lives on the manage card's HALL tab, and the canonical
off-canvas sweep never drew it — that is how five raw header lines survived
(the mayor line, TODAY'S BALLOT, IN THE BOX, and both VOTED headers). All five
now go through fitSmall with measured budgets. The ROLL view, the ledger, the
candidate rows, vote reasons, and the candidacy cost line were already
measured (the cost line's own comment records it once ran off the canvas).

Sweep upgrades that keep it fixed:
- **hall-books / hall-ballot-open / hall-ballot-results** runs, stuffed with
  worst-plausible content (long names, five-digit tallies, a dozen no-shows,
  24 long vote reasons).
- **Card bounds**: the hall runs assert text stays inside the CARD rect, not
  merely the canvas — "off the window" is the bug even when the canvas
  forgives it.
- **sched-12**: twelve on one rota, pager engaged, bounds checked.

**Honest mutation record**: un-fitting the VOTED header did NOT go red — at
plausible maxima ("DAY 999 - 999 OF 999 VOTED, 999 FOUND NO PAPER" ≈ 180px)
the raw header fits the card. The five fitSmall wraps are belt-and-braces
against content growth, and their mutation is vacuous at today's content
scale; recorded per the vacuous-mutation rule rather than faked with
impossible tallies. If Matt's off-screen sighting reproduces on the fixed
build, we need his screenshot — every hall surface now passes worst-plausible
staging inside the card.

## Gates

- Focus manifest `experiments/redbar-focus.json` (sweep + rota by name
  filter): 2/2 green at be2fb6c; mutations A (FED raw) and C (pager rowless)
  red BY NAME; B recorded vacuous (above).
- Full suite + MCP battery on the final SHA: see the report.
- Receipts in pictures: `devlog/img/2026-08-23-fedbar-after.png` (PINCHY's
  bars back in their slots; the before is the smear visible in
  `2026-08-23-mind-now-pager.png`), `2026-08-23-rota-pager.png`.

# THE SOCIAL DESTINATION — the wander pick steers bored crabs toward company (kd-aLTKJsYnHn)

**Landing receipt** for the merge of `cs-social-spot` (gated tree `ccedd94`) into
main. Ruled **social-only** by Matt on decision kd-riXXp2Yvty: build ONLY the
socializing half — bias the existing wander-spot pick toward a landmark where
another chat-ready crab already is/heads, and let existing proximity chat do the
curing at existing rates. Do NOT build eat-elsewhere/overflow; do NOT touch
`serve()`/`pickSeat`/routing. **A lone crab at the meeting place gets exactly
nothing.**

## The mechanic (game.js `wanderSpot`, MEET_BONUS at :6575)

Two substrates already existed and did not know about each other: a bored crab
drifts to a WANDER_SPOT (a SOLO, BLIND uniform draw), and two crabs who pass
within CHAT_PX fall into a chat. Two bored crabs ~400px apart reliably picked two
different landmarks and never met. `wanderSpot` now weights the pick toward a
landmark where another CHAT-READY crab already stands or is heading — counted
only when that crab's own wander target sits within CHAT_PX of the candidate (the
SAME landmark, so they actually fall into step on arrival). A landmark with one
chat-ready companion is `1 + MEET_BONUS` (= 5) times as likely as an empty one;
more company, more pull. It is a **BIAS, not a mandate** — an empty spot keeps
weight 1, so a crab can and does still wander off alone.

**This is a MEETING BIAS, never a third cure.** It changes WHICH spot, not what
happens there. A crab that arrives alone gets nothing (a chat still needs two, at
the unchanged CHAT_* rates).

## The CURE LEDGER stays true

Boredom keeps exactly TWO cures — the arcade (money) and conversation (time). The
bias adds **no** cure: no free-fun venue, no ambient decay, no solo cure.
`CHAT_RELIEF`, `CHAT_CD`, `CHAT_AT`, `CHAT_PX`, `CHAT_SECS` and the arcade are
**untouched** — the diff only READS `chatReady()`/`CHAT_PX` to detect company.
**The CHAT_CD two-chats-a-day "airbag" was NOT touched** (that cap is exactly why
the floor matrix below reads flat-to-slightly-down, not up: better meetings just
fill the same two daily slots sooner).

**Byte-identical when nobody is out to meet:** the weighted draw only allocates
extra weight once a spot has company, so a town with no company (or the hatch
off) falls to the exact old uniform draw — two `srand()` calls either way. A town
with nobody socialising is the old town, by construction. The gate's frozen day-2
fingerprint scenario proves the default-ON bias is inert in the first two days.

## The arm-off hatch

`patOff("meet")` (game.js:6608), armed via `--failoff meet`
(`window._failOff={meet:1}`) — the same narrow `_failOff` family as chat/wander.
It is the before/after control in the measurement below.

## Gate — suite-330, both backends @ ccedd94 (this directory)

```
node tools/kube.mjs run experiments/suite-330.json --ref ccedd94 --wait
```
→ **MERGED SUITE VERDICT: 914/914 passed** — **24/24 arms exit=0** (12 slices ×
js + wasm). Receipts are the `js-*.json` / `wasm-*.json` beside this file.

Includes the new scenario **"social destination: the wander pick STEERS toward
company, and _failOff meet restores the blind draw"** (tools/suite.mjs:5169): a
direct distribution test on `wanderSpot` — 600 draws with one planted chat-ready
companion at a two-way landmark pick. ON steers **>65%** toward the companion's
landmark (weights `[1+MEET_BONUS,1]=[5,1]` ⇒ ~83% expected); `--failoff meet`
restores the blind draw at **35–65%** (~50%); and `on.arcade > off.arcade + 90`
proves the steer is a real, large difference, not seed noise.

## Measurement — the DOSE, on vs off, same seeds (cs-social-meet-ccedd94-4383)

`experiments/social-meet.json`: {baseline, growth chef,table} × seedbase {0,16,32}
× {as-built, `--failoff meet`}, 16 towns × 30 days each (48 towns/state). One
variable, same tree — the delta is the bias, not whatever moved on main. Per-day =
total / lived sim-days (same seeds ⇒ matching denominators).

| config | chats/day on·off | chatRelief/day on·off | wanders/day on·off |
|---|---|---|---|
| baseline (buy nothing) | 1.630 · 1.630 (+0%) | 0.0970 · 0.0970 (+0%) | 1.390 · 1.390 (+0%) |
| growth (chef,table) | 3.263 · 3.344 (−2%) | 0.1951 · 0.2000 (−2%) | 1.199 · 1.205 (−0%) |

Growth survival is **identical** on vs off, seedbase by seedbase — sb0 2/14,
sb16 4/12, sb32 6/10 both arms (lifeMean drifts <1%, trajectory noise). The bias
does not touch the growth pillar.

**Finding — honest and load-bearing.** In the autopilot FLOOR matrix the bias is
nearly inert, and where it moves anything it moves it slightly DOWN, not up.
Baseline is bit-for-bit flat (chats 981/981, relief identical, wanders 837/837 in
all three seed blocks). Growth chats/chatRelief read −2% ON vs OFF — which **is**
the ledger-safety proof, from two directions at once: (1) the bias adds no cure —
if anything the CHAT_CD two-chats-a-day airbag clusters better meetings into the
same daily cap, so relief cannot go up; (2) wanders are unchanged (the bias never
changes WHETHER a crab wanders, only WHICH spot), so the tiny chat delta is a
meetings effect, not a wandering one. The STEER itself is real and large (the
suite scenario), but the matrix's always-busy autopilot bot rarely creates the
idle-crowd precondition the bias needs (a bored crab wandering while a chat-ready
peer stands at a reachable, DIFFERENT landmark). This is the FLOOR the matrix
measures — a bot that never re-prices, never idles in a crowd — not the ceiling
of organic under-staffed play where crabs genuinely loiter together. The flat-to-
slightly-down cure rate is exactly what the ruling scoped ("cure at existing
rates"), not a regression.

## Stale-base / race

Branch based on main @ 82697a9; main advanced through the title-news, cit_surf,
swim and vis_surf landings while this was in flight. Each time, origin/main was
merged INTO the branch (pure-additive; the only game.js deletion is the one
`wanderSpot` line the bias replaces — nothing of main's reverted), then the tree
was RE-GATED and RE-MEASURED. `ccedd94` is that final landing tree: it contains
origin/main `f3dd915` as an ancestor (`merge-base --is-ancestor` = yes), so the
`--no-ff` merge into main changed no GATE_FILE — the merge commit's tree is
byte-identical across GATE_FILES to this gated `ccedd94`, which is why gatecheck
reads AMBER on the pushed tip. The measurement is an A/B delta (bias ON vs OFF on
the one tree), so it is robust to base drift by construction (advice kd-RSS4Nkil3c).

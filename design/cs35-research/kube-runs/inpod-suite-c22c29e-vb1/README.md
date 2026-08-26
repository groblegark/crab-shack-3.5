# inpod-suite-c22c29e-vb1 — the visitors-book tip, gated in its own name

**Verdict: GREEN, both backends — js 382/382, wasm 382/382**

The branch `visitors-book`'s tip is **c22c29e** (`the stamp names the sweep-fixes
build`), whose content commits are **e49baaa** (`the visitors book: one roster
mechanism, two registers`) and **51f0a88** (`the visitors book: the two faults the
sweeps found, and one in my own sweep`), task kd-f7qotHQvdp. This receipt gates that
tree in its own name.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 382/382 passed | 0 | 1407.6s |
| wasm | 382/382 passed | 0 |  903.7s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the shape the kube receipts use. Run in-pod (gasboat fleet pod,
project cs), main realm, one backend at a time — never two sims concurrently.

    sha  = c22c29e   (the branch tip; see "what the stamp covers" below)

**`--jobs 3`, not 6.** `nproc` in this pod reports the HOST's 16 cores; the cgroup
quota is 4 (`cpu.max` = `400000 100000`). The fleet's own `tools/cores.mjs` — landed
on main mid-task — agrees: `cores: 4 usable (host 16, cgroup quota 4)`, and its
`defaultJobs()` returns 3. Sizing off `nproc` here would have oversubscribed the
quota 4x and made every wall number a lie.

## What the stamp covers

`c22c29e` differs from `51f0a88` — the tree both backends actually ran on — only in
`version.js`, which is NOT in `gatecheck.mjs`'s `GATE_FILES`. Verified:

    git diff --numstat 51f0a88 c22c29e -- <GATE_FILES>   # empty

So this verdict is `c22c29e`'s in its own right, not a transfer argument.

## Why this tree owed a fresh gate

`tools/gatecheck.mjs --ref` reported **RED** for this branch against the newest gated
ancestor (`inpod-suite-62305a8-r84`, 379/379), naming both files that differ:

    ~ game.js         (+335 / -101)
    ~ tools/suite.mjs (+207 / -21)

Both are in the gate-relevant set and `tools/suite.mjs` is the `GATE_ENTRY`, so no
ancestor's verdict transfers. This receipt is that owed run. The suite grows
**379 → 382**: three new scenarios (the visitors book's own sorts/filters/paging, the
book-swap view reset, and an ordering-preservation gate that runs the pre-refactor
census comparator beside the new generic one and demands identical output).

## What the delta was

A UI/refactor pass, no balance change. `ROSTERS` makes a roster **data** (list / keep
/ rank / row) so ONE `rosterList()`, one pager, one hit test and one chip row serve
both the town census and the new visitors book; `NAV_CHIPS` does the same for the
chip column, adding a third main-screen chip (GUESTS). The bundle regenerates
byte-exact (`tools/mkcultureways.mjs`), and no generator, fixture or engine constant
moved.

**The one deliberate behaviour change** is the census's WALLET sort: it had no
tiebreak, so equal wallets sat in arbitrary `allCrabs()` order and are now
alphabetical. Wallets still descend. NAME/JOB/HOME/HEALTH are byte-identical to the
pre-refactor comparator, which the new ordering-preservation scenario asserts rather
than assumes.

## The gate earned its keep — four faults, three instruments

Worth recording, because each class was invisible to the others:

1. **Photographing the card** (`mcp/render.mjs`) found the filter chip printing under
   the count line, and **every purse reading `$0`/`$1`** — `fmt()` already takes cents
   and the draft wrapped `$d()` around it, dividing twice. **Every sort assertion
   still passed: a monotonic bug preserves ordering perfectly.** The regression test
   now asserts the printed STRING.
2. **`no card prints text on top of its own text`** found the footer money line
   printing through the `FED THR CLN FUN SPA` legend. **The off-canvas sweep passed
   the whole time** — nothing left the card, it merely overlapped.
3. **`the help card fits the card`** found a GUESTS help entry running its page 13px
   under its own footer.
4. **And one fault was in the new TEST, not the card**: the overlap sweep's `BOXES`
   resets per `run()`, so drawing all 25 sort/filter combinations inside ONE run
   stacked 25 frames of text on itself and reported ~360 overlaps — noise that nearly
   buried the two real hits. Three separate runs now. The off-canvas sweep may still
   loop, because it measures against the canvas edge and carries no state.
   *A sweep whose harness accumulates state is measuring itself, and a failure that
   reports everything reports nothing.*

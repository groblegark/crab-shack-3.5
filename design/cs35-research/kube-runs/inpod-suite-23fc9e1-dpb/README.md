# inpod-suite-23fc9e1-dpb — the departure-card money-band fix, gated in its own name

**Verdict: GREEN, both backends — js 380/380, wasm 380/380**

The tip is **23fc9e1** (`the departure card's money band speaks dollars again`,
branch `departcard-money-band-units`, bug kd-Z8YnBC5xX3). This receipt gates that
tree in its own name.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 380/380 passed | 0 | 2088.4s |
| wasm | 380/380 passed | 0 |  962.8s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the same shape the kube receipts use. Run in-pod (gasboat fleet pod,
project cs), main realm, one backend at a time — never two sims concurrently.

    sha  = 23fc9e1fbc137ba34a56359374483bc39a27a4ba   (the branch tip)

**`--jobs 3`, not 6.** `nproc` and `os.cpus().length` report the HOST's 16 cores;
this pod's cgroup quota is 4 (`cpu.max` = `400000 100000`). `tools/cores.mjs` —
landed on main earlier the same day — says so directly: *"cores: 4 usable (host 16,
cgroup quota 4)"*. Sizing off the host count would oversubscribe the quota and make
the wall times meaningless. This is the first receipt to size off the quota.

## Why this tip owed a fresh gate (not a transfer)

`gatecheck.mjs` reports RED against the newest gated ancestor **62305a8**
(`inpod-suite-62305a8-r84`, 379/379), naming both changed files:

    ~ game.js         (+22 / -3)
    ~ tools/suite.mjs (+56 / -0)

Both are in the gate-relevant set (`tools/suite.mjs` IS the `GATE_ENTRY`), so no
verdict transfers. This receipt is that owed run. The suite grows **379 → 380**.

## What the delta was — a UNITS regression on a display surface

**The bug.** The departure card's money band printed `BROUGHT` / `SPENT` /
`TOOK HOME` **100x understated** — seed 42 rendered `BROUGHT $7 / SPENT $3 /
TOOK HOME $3` directly above its own guest rows reading `SPENT $42 OF $71`. The
card contradicted itself on its own face, on the one surface built to show the
player the unspent half of every purse — which is the whole growth incentive.

**It is a REGRESSION, not an original bug.** The card shipped correct on
2026-08-20: `devlog/img/2026-08-20-departures-bad-day.png` reads
`BROUGHT $1190 / SPENT $368 / TOOK HOME $822`, and PLAN documents that scale twice.
Then **2e84c1e** (`numeric slice 1, landing 1a: every balance is integer cents`)
moved the game to cents and gave `departRecord` a `$d()` on the way in — so the row
speaks DOLLARS, because every reader of it is a voice line or a printed label. It
converted the PER-GUEST rows correctly and left the money band calling `fmt()`,
which divides by 100 again.

**Why the suite stayed green through four days of it.** The existing scenario
(`departures: the manifest is the day's own boat-load, and the money adds up`)
checks the manifest's ARITHMETIC — `purse == spent + left`. That held true every
single day *including* the days the card was visibly wrong, because dividing all
three by 100 preserves the identity. Nothing ever read the string on the glass.

The delta:

  - **`game.js`** — `fmtD(n)` for a number that is ALREADY dollars, with `fmt(c)`
    now `fmtD($d(c))` so the two share one abbreviation ladder (the `K`/`M`
    thresholds cannot drift apart). The unit a `fmt` protects is invisible at the
    call site — `fmt(x)` looks right whatever `x` is — so the guard is a SECOND
    DOOR WITH THE UNIT IN ITS NAME, not a comment.

  - **`tools/suite.mjs`** — a new scenario, *"departures: the money band prints the
    manifest's own dollars"*, which reads the band off the **DRAWN** card (wrapping
    `text`/`smallText` the way the font and embargo scenarios do) and holds it
    against the guest rows drawn directly underneath: the same quantities, in the
    same units, by construction. **A units bug cannot move both and stay
    consistent.** Three assertions — band == manifest, band still adds up once
    printed, and one page of guests cannot exceed the whole boat (exact equality
    when the card is a single page).

    Per discipline 3, it was **revert-tested before landing**: re-introducing the
    `fmt` call makes it fail with `the band misprints the manifest: BROUGHT 2/151,
    SPENT 1/82, TOOK HOME 1/69`, then restored. It is never green on a dead oracle.

## What did NOT move

  - **The bundle regenerates byte-exact** — `tools/mkcultureways.mjs` re-run,
    md5 unchanged. No fixture, generator or culture document is touched.
  - **The balance is unaffected.** Measured 8 do-nothing towns to day 8 (592
    departures): took-home share **0.555**, against the **0.55** PLAN documents for
    do-nothing towns. Per-seed 0.51–0.60. The economy was never wrong — visitors
    spent and took home exactly what they always did, and the record's own
    arithmetic held throughout. Only the three printed figures were off, so nothing
    downstream of the departure record needs re-measuring and PLAN's
    growth-incentive numbers still stand.
  - **No other leak exists.** `departRecord` is the only place in the tree that
    produces a dollar-valued RECORD; its other dollar fields (`topPaid`, `tips`,
    `dues`) are printed raw and never re-divided. The money band was the only one.

## Cross-seed check (beyond the gate)

The band was verified against the drawn rows on five seeds. On every single-page
card the two agree EXACTLY; on the one multi-page card the page total sits under
the boat total, as it must:

| seed | band (brought/spent/home) | rows on page 1 | |
|---|---|---|---|
| 1    | 381 / 209 / 172 | 235 / 137 | 2 pages |
| 7    |  99 /  50 /  49 |  99 /  50 | exact |
| 42   | 151 /  82 /  69 | 151 /  82 | exact |
| 99   | 160 /  52 / 108 | 160 /  52 | exact |
| 1337 | 234 / 113 / 121 | 234 / 113 | exact |

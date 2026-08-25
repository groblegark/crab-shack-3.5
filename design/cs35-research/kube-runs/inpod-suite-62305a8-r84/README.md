# inpod-suite-62305a8-r84 — the pigway-worked-example-truthfulness tip, gated in its own name

**Verdict: GREEN, both backends — js 379/379, wasm 379/379**

`main`'s tip is **62305a8** (`the stamp names the pigway-worked-example-truthfulness
build`), whose content commit is **122519d** (`pigway.json: the worked example stops
claiming to be the shipped pig, and a ratchet keeps it valid`, task kd-XajjGrh3us).
This receipt gates that tree in its own name.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 379/379 passed | 0 | 1471.6s |
| wasm | 379/379 passed | 0 |  956.5s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with the
machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`,
`failures[]`) in the same shape the kube receipts use. Run in-pod (gasboat fleet pod,
project cs), `--jobs 6`, main realm (receipt-identical to vm, ~4.3x faster per
CLAUDE.md), one backend at a time — never two sims concurrently.

    sha  = 62305a82329a69160368e5e8aa2e011f6b445a50   (the committed live tip)

## Why this tip owed a fresh gate (not a transfer)

`tools/suite.mjs` is in `gatecheck.mjs`'s gate-relevant file set (it is the
`GATE_ENTRY`). The change commit `122519d` adds one scenario to it (`+36 / -0`), so
the newest gated ancestor's verdict (`inpod-suite-4c2302a-y8o`, 378/378) does **not**
transfer — `gatecheck.mjs --ref 62305a8` reports RED naming `tools/suite.mjs`. This
receipt is that owed run. The suite grows 378 → 379.

## What the delta was — a TRUTHFULNESS fix, not an engine change

No game-engine, generator, or fixture file changed; the bundle regenerates
byte-exact. The delta is:

  - **`mcp/docs.mjs` + `design/cs35-cultureway-substrate.md`** — the docs stop
    calling `design/cultureways/pigway.json` "a real, shipping people drawn from the
    live fixture's actual values". That claim was FALSE: the game generates its pig
    from `tools/fixtures/cultures-pig.json`, and pigway.json (the "copy this shape"
    worked example the MCP serves) had drifted 104 normalised-diff lines from it —
    a whole `businesses.mudspa`, a `porkbun` taste where the shipped pig has `slop`,
    an `appeal.needs` the fixture lacks. The docs now say it is a complete, *valid*
    illustration of the full format, authored richer than the shipped pig to show
    the optional sections, and that the live pig comes from the fixture.

  - **`tools/suite.mjs`** — a new RATCHET scenario, *"the pigway worked example
    stays a valid document the MCP can serve"*. Nothing read pigway.json into the
    bundle, so no gate ever watched it — the same E3-shaped trap the byte-equal pin
    (`cs-the-bundled-pig-4kw`) closes for the SHIPPED documents, reopened for the one
    document that only teaches. The scenario mirrors `mcp/culture.mjs`'s
    `cultureValidate` exactly: the engine's own `cultureProblem` oracle AND the
    `meta.id` silent-skip pattern the oracle cannot see.

    Per discipline 3, it PASSES the day it is written and has proven nothing yet —
    its job is to bite the day the served example stops validating. Its
    proof-it-bites mutations run inline (an empty name pool must still be refused),
    so it is never green on a dead oracle. Verified RED out-of-band on two injected
    mutations before landing (bad `meta.id` → "SILENTLY skipped at install"; bad
    palette char → `cultureProblem = A BAD PALETTE CHAR`), then restored.

## Why option (b) was NOT taken

The bead left three live options. Option (b) — make pigway.json the real source and
retire the fixture — would MOVE the shipped bundle by 104 normalised-diff lines
including a whole new business, a content change owing its own both-backend gate. The
captain's measurement on the bead ruled: do not stack a bundle-moving change on the
trunk. This is the honest minimum (option d): make the docs true and ratchet the
example's validity, moving no shipped byte.

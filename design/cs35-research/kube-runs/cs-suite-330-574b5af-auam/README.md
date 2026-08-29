# vis_surf.go — visitors surf the mid-beach break on their own decision surface (kd-9yvywiin3O)

Step 4, the **final build step** of the SURF SPOT epic (kd-vB0DTFmDzk; site
ruling kd-1JwKffV61F, `SURF_X` ruling kd-trKLfcDh5b, gentle-decay crowding
kd-uYvJOxQcV8). Step 3 (kd-wfRu3aGnrK) gave the *crab* paddle-out its own surface
(`cit_surf.go`); this step gives the *visitor* one.

## What this adds

Visitors (tourists) can now paddle out at the existing mid-beach break. A surfing
tourist pays the **P3 activity-vector** need cost `SURF_VEC` — hunger **2x**,
thirst **2x**, dirt **1.5x**, bored/tired **paused** (rate multipliers in
twentieths, applied via `actNeed`/`vmul`). So the wave hands out fun relief while
**pumping demand**: lots of hunger and thirst, less clean. "This is where all the
traffic is."

## The surface, not an 8th ballot class

`vis_surf.go` is its OWN `registerSurface` (`classes: ["stay","go"]`, engine
script `visSurfEligible`, **NO trained artifact**) — the same own-surface,
script-only idiom as `cit_surf.go` and `vis_depart.stay`. The surf decision is
deliberately kept **OFF** `vis_pick.candidate`: the shipped **7-class gullway
brain** has no word for a rare weather event, and the loader pins
`classes == surface N` in order — an 8th class would **hard-fail the pinned
artifact at boot**. Keeping surf on its own surface leaves the visitor-pick
census fingerprint untouched.

## Append-only ABI, and OUT of KCUST_STATES

`"surfing"` is appended to `VS_NAMES` at **index 22** (the next free slot) —
never inserted or reordered. `abi_check` pins `toBiz=12 / inRoom=15 / onSand=16 /
roam=17` **by value**, and every one is unmoved. `VS.surfing` auto-derives from
the name table; `k.state` returns `"surfing"`.

It stays **OUT of `KCUST_STATES`** by construction. That 11-name set marks the
occupancy states the wasm kernel dispatches, and the kernel's occupancy **exit
hard-codes a shower scrub** — a surf state routed through the kernel would clean
the surfer on the wasm backend *only*, breaking byte-identity. Instead `visTick`
handles `VS.surfing` **BEFORE** the `if (KERN)` offload, in pure JS
(`actNeed(k[n], BR[n], 20, vmul(SURF_VEC, n))` over the five needs). The kernel
`vis_tick` plain-drains the unknown state, so **both backends agree with NO
kernel rebuild** (a pure append ships green). `VIS_SAVE_STATES` is left unchanged,
so a mid-surf save restores as `"roam"` for free.

Behaviourally: `visSurfEligible` is a pure read (zero RNG draws) gated on
`surfIsUp()`, so **non-firing days are byte-identical**; only a firing-day
surf-eligible visitor changes course. `ferryDepartCall` lets a wave finish
(`k.stC === VS.surfing` is skipped), and `drawCustomer` hides the rider out past
the break while the walk-down still draws.

## Gates

- **suite-330 correctness gate: GREEN 912/912**, both backends (js 0–11 + wasm
  0–11, all 24 arms exit 0, 38/38 per slice), at `574b5af`. Receipts are the
  JSONs in this directory. `game.js`, `kernel.wasm` and `tools/kernel/kernel.c`
  are **byte-identical** from `574b5af` through the merge `1bb5dee`
  (`git diff 574b5af 1bb5dee -- game.js kernel.wasm tools/kernel/kernel.c` is
  empty; the only intervening main commit, `de53680`, diverged `PLAN.md` alone).

- **Growth pillar A/B re-take** (the P3 need cost changes visitor demand → a
  balance change, re-gated per CLAUDE.md). Isolated delta, same harness at two
  refs (kd-RSS4Nkil3c): treatment `94ec383` (`574b5af` + the growth manifest,
  visitor surf **present**) vs control `d22a1cf` (trunk `2246ff4` + the *same*
  manifest only, visitor surf **absent**). Default `CIT_DECAY_MUL=7` (the landed
  U1 value). Manifest `experiments/vis-surf-growth.json`; receipts in
  `cs-vis-surf-growth-{94ec383,d22a1cf}-*`:

  | | growth pillar | per-block sb0/16/32 | baseline (buy nothing) |
  |---|---|---|---|
  | treatment (94ec383, visitor surf) | **12/48** | 2 / 4 / 6 | 0/48 |
  | control (d22a1cf, trunk) | **12/48** | 2 / 4 / 6 | 0/48 |
  | **delta** | **0 towns** | identical | 0 |

  The pillar is **town-for-town identical (delta 0)** and the baseline floor
  holds. **The mechanic is not dormant** (the zero-dose trap, my own advice
  kd-1XqylH3kmJ): batch sims are deterministic by seed, yet treatment and control
  **diverge at matched seedbases** — e.g. base-sb0 rep list `[45,51,52,54,…]` (T)
  vs `[51,53,53,54,…]` (C); grow-sb16 lifetime mean `6439` (T) vs `6766` (C). The
  diff between the two refs is *purely* visitor-surf plumbing, so that
  deterministic divergence proves a visitor **did** paddle out in the matrix —
  the growth pillar held steady *despite* the mechanic running, which is the
  growth-inert result. The control 12/48 sits at the top of the RULED U1 band
  (7/48 final read / 12/48 calibration, CLAUDE.md).

## Refs

- `574b5af` — `vis_surf.go` code, suite-330 GREEN (this receipt).
- `94ec383` — `574b5af` + `experiments/vis-surf-growth.json` (A/B treatment).
- `d22a1cf` — trunk `2246ff4` + the growth manifest only (A/B control, throwaway
  branch `cs-vis-surf-ctrl`).
- `1bb5dee` — the `--no-ff` merge to main; `version.js` stamps this commit.

Crab surf (`cit_surf.go`), site `SURF_X`, and the gentle-decay crowding curve
were **not** touched — visitor surf counts its own crowd via a separate
`visSurfers()`.

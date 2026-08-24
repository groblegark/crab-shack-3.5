# inpod-suite-83fb0f4-18z — the combined re-gate (now an ANCESTOR)

> **This is no longer the live tree.** `main` advanced 83fb0f4 -> ec6f74b
> WHILE this gate was running. The verdict for the LIVE tip is the sibling
> receipt **inpod-suite-ec6f74b-18z** (js 341/341, wasm 341/341). This receipt
> stays as the honest green verdict for the now-ancestor commit 83fb0f4, which
> pays the combined re-gate kd-UcvVdC7zFW called OWED (the E4 ladder + the
> re-authored staffing pin are ancestors of both commits).

**Verdict: GREEN, both backends.**

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 340/340 passed | 0 | 1248.9s |
| wasm | 340/340 passed | 0 | 824.5s |

Zero failing scenarios on either backend. `js.json` / `wasm.json` carry the
full per-scenario `PASS` roll in `stdoutTail` and the machine fields
(`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`, `verdict`, `failures[]`)
in the same shape the kube receipts use.

## What this gate pays

`main`'s tip is **83fb0f4** (`the stamp names the sidecar commit`) — the
commit `groblegark.github.io/crab-shack-3.5` serves. The newest *cluster*
receipt was `cs-suite-318-5c35f63-jqxj`, and `5c35f63` is an **ancestor** of
all five commits that had shipped to the live tree without a verdict:

    fc3d288  the house limit gets two more rungs: 8 and 12
    b6ddb68  the town founds itself with a six-head limit
    3db7087  the policy pin grows a staffing clause      (the E4 pin re-author)
    0fdce14  the cs agent sidecar image
    83fb0f4  the stamp names the sidecar commit

kd-UcvVdC7zFW's brief called the combined re-gate OWED; it was never paid.
Discipline rule 1 (a verdict belongs to ONE tree) had no verdict for this one.
This receipt is that verdict. The E4 house-limit ladder (8/12 rungs, the
six-head founding town) and its re-authored staffing pin are live and now
**gated green**.

Gate task: **kd-LXibf7eudt** (parent kd-UcvVdC7zFW). Run by agent
**cs-gate-main-tip-18z**.

## IN-POD, not via kube.mjs — and why

This suite was run **in-pod** on a gasboat fleet pod (project `cs`), NOT
through `tools/kube.mjs`. The receipt directory lives under `kube-runs/`
alongside the cluster receipts for discoverability, but the `inpod-` release
prefix and this README name plainly that it is an honest in-pod run, not a
cluster one.

`tools/kube.mjs` does not work from a cs pod (measured, kd-wbdYahwATd):

- kube.mjs hardcodes a remote named `cs35repo`; this checkout calls it
  `origin`, so its `git fetch cs35repo` fails.
- there is no kube context in the pod.
- `aws eks list-clusters` is `AccessDenied` for `gasboat-prod-agent`.

Rather than burn the gate cycle fixing cluster access, the suite ran in-pod,
which CLAUDE.md's scope note explicitly permits: *"a gasboat fleet pod
(project `cs`) IS cluster compute — it may run sim workloads in-pod within its
own resource limits."* The local kube ban protects the operator's Mac only;
this pod is not the Mac. An honest in-pod receipt is worth more than an absent
cluster one.

## How it was run

    node --version                                    # (pod node)
    git rev-parse HEAD  -> 83fb0f41da16f42f1bdb1df90558b9a4d1a96cea
    nproc               -> 8

    # js backend
    SIMLIB_REALM=main               node tools/suite.mjs --jobs 7

    # wasm twin
    SIMLIB_KERNEL=wasm SIMLIB_REALM=main node tools/suite.mjs --jobs 7

- `SIMLIB_REALM=main` is ~4.3x faster than the vm realm and is
  receipt-identical (design/cs35-research/vm-escape/).
- `--jobs 7` = cores−1 on this 8-core pod (CLAUDE.md: never exceed cores−1).
- The two backends were run **sequentially, never concurrently** — CLAUDE.md
  warns concurrent sims make timings lie and on a small pod fight for heap.
- 340 scenarios: `grep -c 'scenario('` reads 341, but one match is the
  `function scenario(...)` definition itself; the suite verdict counts 340.

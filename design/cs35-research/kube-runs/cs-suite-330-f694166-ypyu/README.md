# cs-suite-330-f694166-ypyu — the cgroup-quota branch, gated on the cluster

**Verdict: GREEN, both backends — js 378/378, wasm 378/378 (756/756 merged)**

    sha      = f6941661dd93cacc70f4248d2cf17be16f38f582   (branch cores-cgroup-quota)
    manifest = experiments/suite-330.json  (24 arms: 12 slices x {js, wasm})
    command  = node tools/kube.mjs run experiments/suite-330.json --wait

| backend | verdict | arms | slowest arm | fastest arm |
|---|---|---|---|---|
| js   | 378/378 passed | 12 | js-4 351.3s | js-8 51.2s |
| wasm | 378/378 passed | 12 | wasm-4 233.9s | wasm-8 32.8s |

All 24 arms exit 0, `failures[]` empty on every receipt, **zero pod restarts**
(so no OOMKill — the thing 12-way slicing exists to prevent). Wall clock for
the whole run was ~9 min including karpenter provisioning 8 m5 nodes from
cold; `clean` uninstalled and verified scale-down to 0 ephemeral nodes.

The merged verdict was cross-checked by recounting the 24 banked receipts
independently of `kube.mjs collect` — both give 756/756, split 378/378. Per
lesson #1 the receipts are the verdict, not Job status.

## What this gates

The branch that stops scheduling off the HOST core count:

- `tools/cores.mjs` — `usableCores()` = min(libuv's `availableParallelism()`,
  the cgroup quota parsed from cpu.max / cfs_quota_us).
- `headless.mjs` / `batch.mjs` default their worker count from it. In this pod
  that is 4 usable against a host-reported 16, so the old defaults asked for
  15 and 14 workers on a 4-core grant.
- `kube.mjs` refuses a manifest with no `nodeSelector`; `crewux-focus.json`
  and `redbar-focus.json` gained the ephemeral-pool selector + toleration.
- `kube-arm.mjs` banks `cores`/`hostCores` in every receipt from here on.

## Why a suite run is the right gate for it, and what it does NOT prove

The suite does not import `cores.mjs` — this is harness-layer work, so the
suite's job here is to prove the change is **inert to game behaviour**, which
is exactly what 756/756 says. The scheduling behaviour itself was verified
separately, by execution rather than by the suite:

- `headless --seeds 3` forks 3 workers (was 15), `ps` confirming 3 processes
  at ~100% each; `batch` forks 2 (was 14).
- **Determinism unchanged**: `--seeds 3` is byte-identical at `--jobs 3` and
  `--jobs 1`.
- The `nodeSelector` guard fires through the real `kube.mjs` path, `--anywhere`
  bypasses it, a targeted manifest passes — and `redbar-focus` then actually
  installed, provisioned a dedicated ephemeral node, and passed 2/2
  (`cs-redbar-focus-f694166-sdvk`).

**This receipt carries no `cores` field** — the change that adds it (e24e65e)
landed *after* the gated SHA f694166. That is the honest ordering, and the
reason the field exists: the previous gate receipt
(`inpod-suite-4c2302a-y8o`) records `nproc -> 8, --jobs 7` and a 1467.4s
wall with no record of the cgroup grant, so its **verdict stands but its
timing cannot be cited** — there is no way to tell 8 real cores from a
throttled 4. Timings in the table above are from 2-cpu-limit arms, one arm
per pod, so they are honest.

# The CRAB SHACK 3.5 agent sidecar image

Matt, 2026-08-24: *"use this to exercise the sidecar image pattern and build
the image in the crabshack repo."*

## What this is

`agent-cs:$VER`, layered on the gasboat agent base (`agent:$VER`) so `gb`,
`coop` and `kd` stay intact. It follows the established per-project sidecar
pattern (advice **kd-7mWlxElLeH**): a Dockerfile that is `FROM $BASE_IMAGE`
and adds **only the delta**, built by a job that `extends: .build-sidecar`
with `SIDECAR` set, and which must run **after** the base image is mirrored
because it builds on that tag.

## The delta, measured rather than guessed

Probed inside a live `cs` pod on 2026-08-24. The base already ships node 24,
npm, git, helm, kubectl 1.35.4, aws-cli 2.34, jq and python3. CRAB SHACK 3.5
has **no `package.json` and no npm dependencies** — it is vanilla JS — so the
delta is genuinely two things:

| addition | why |
| --- | --- |
| **zig** | `tools/kernel/build.sh` builds the movement kernel with `zig cc -target wasm32-freestanding`. Without it a pod can only *trust* the committed `kernel.wasm`, never rebuild or verify it. The suite proves the wasm kernel and the JS reference agree byte-for-byte; that proof is worth much less if nobody in the loop can regenerate the artefact being compared. |
| **node pinned to 26** | The cluster gate arms run `node:26-slim` (`deploy/crab-science/templates/job.yaml`) while the agent base ships node 24. Agents and gates disagreeing on runtime is the "a verdict belongs to one tree" trap in a different hat: a scenario that passes for an agent and fails on the gate, with nothing in either receipt to say why. |

Keep `NODE_MAJOR` equal to the `image.node` tag in the chart, or the pin is a
lie.

## Where it is built, and why not here

The Dockerfile lives in **this** repo — it is versioned with the game it
serves, which is the point, and a change to `tools/kernel/build.sh` and a
change to the image that has to run it land in the same commit.

The **build** runs gasboat-side, and that is deliberate:

- **This repo is PUBLIC.** The base image lives in a private registry, so a
  GitHub Actions build would need registry credentials in a public repo's
  secrets — to pull the base *and* to push the result.
- The existing `.build-sidecar` kaniko template already has the registry, the
  runner (`mc-eks`) and the `BASE_IMAGE` wiring. Rebuilding that here would
  fork infrastructure that already works, which is the same mistake the
  "adds only the delta" rule exists to prevent.

So: **definition here, build there.** The gasboat-side job fetches this
Dockerfile and builds it against the current base tag.

## Building

`ZIG_VERSION` and `ZIG_SHA256` are **required build args with no defaults**,
on purpose — a default would rot silently, and an unverified tarball should
not be baked into an image that runs with the fleet's credentials. Look up
the current Zig release and its checksum, then:

```
--build-arg BASE_IMAGE=<registry>/agent:$VER \
--build-arg NODE_MAJOR=26 \
--build-arg ZIG_VERSION=<x.y.z> \
--build-arg ZIG_SHA256=<sha256 of zig-linux-x86_64-<x.y.z>.tar.xz>
```

The image self-checks at the end (`node --version && zig version`): a build
that cannot rebuild the kernel is not the image this exists for.

## Wiring it to the project

Point the `cs` project bead at the resulting tag once it is built and pushed.
Note that the image is **not** what currently blocks `tools/kube.mjs` in-pod —
that is credentials, not tooling. Measured the same day:

- the pod **has** an AWS identity (`gasboat-prod-agent`, via IRSA), so
  `CLAUDE.md`'s claim that a fleet pod "has no AWS identity" is **wrong**;
- but that role is denied `eks:ListClusters`, so it cannot
  `aws eks update-kubeconfig`;
- and no serviceaccount token is mounted — `KUBERNETES_SERVICE_HOST` is set,
  so the API is reachable, there are simply no credentials. That is the
  missing `needs_k8s_api: true` + `service_account`, which the `gasboat`
  project already sets (`gasboat-agent-cluster-admin`).

Fixing those is a project-field change and is tracked separately in the plan.

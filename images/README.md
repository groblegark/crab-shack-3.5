# The CRAB SHACK toolchain image

`ghcr.io/groblegark/crab-shack-toolchain` — public, standalone, built by
`.github/workflows/image.yml` on every push to `main` that touches the
Dockerfile, the workflow, or `tools/kernel/build.sh`.

> Matt, 2026-08-24: *"obvs we should build the image in github in groblegark
> and pull it from there into gasboat cluster -- build the crab shack image
> for public consumption in a public registry."*

## Why this shape, and what it replaced

The first attempt was a **sidecar** layered on the private gasboat agent base,
following the established per-project pattern (advice kd-7mWlxElLeH). That
forced an awkward choice: this repo is PUBLIC and the base image is private, so
building here would have meant storing registry credentials in a public repo's
Actions secrets — to pull the base *and* to push the result. The workaround was
"definition here, build gasboat-side", which split the image from the code that
needs it.

Building a **public image from a public base** removes the problem instead of
routing around it:

- GitHub Actions authenticates with the built-in `GITHUB_TOKEN` and
  `packages: write`. **No secret is stored in this repo at all.**
- A public image needs **no pull credentials** from the gasboat cluster, or
  from anyone else.
- The Dockerfile lives beside the code it serves, so a change to
  `tools/kernel/build.sh` and a change to the image that has to run it land in
  the same commit.

## What is in it

| | why |
| --- | --- |
| **node 26** | The base. Matches `deploy/crab-science/values.yaml`'s arm runtime, so the tree that runs gates and the tree that runs tools stop being different node majors. |
| **git** | `tools/kube.mjs` clones the tree at an explicit ref; the arms need it in-container. |
| **zig** | `tools/kernel/build.sh` builds the movement kernel with `zig cc -target wasm32-freestanding`. Without it the wasm kernel can only be *trusted*, never rebuilt — and the suite's proof that the wasm kernel and the JS reference agree byte-for-byte is worth much less if nobody in the loop can regenerate the artefact being compared. |

**Zig is resolved at build time from ziglang.org's own download index, using
THEIR published shasum.** Neither the Dockerfile nor the workflow hardcodes a
version, so nothing rots, and the tarball is verified against upstream's number
rather than one somebody typed months ago. Both build args are required and
have no defaults: a build that cannot verify the tarball fails loudly.

## What it deliberately does NOT contain

- **The game.** `tools/kube.mjs` clones the repo at a ref. An image carrying a
  copy of the source would go stale the first time anyone pushed. This is a
  toolchain; the tree arrives at run time.
- **`gb` / `coop` / `kd`.** Those belong to the private gasboat agent base. An
  agent needing both either layers this image or keeps its own.

## Using it

For the science arms, point `image.node` in `deploy/crab-science/values.yaml`
at a tag. Prefer the **`:${sha}` tag over `:latest`** — this project's whole
gate discipline is that a verdict belongs to one tree, and an arm running a
floating tag quietly breaks that.

Anyone can also just run it:

```
docker run --rm -it ghcr.io/groblegark/crab-shack-toolchain:latest sh
```

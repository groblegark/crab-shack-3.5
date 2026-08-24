# The CRAB SHACK 3.5 toolchain image — public, standalone, built in this repo.
#
# Matt, 2026-08-24: "obvs we should build the image in github in groblegark and
# pull it from there into gasboat cluster -- build the crab shack image for
# public consumption in a public registry."
#
# That is a better shape than the sidecar this replaced. A sidecar layered on
# the private gasboat agent base could only ever be built where that base is
# readable, which meant either registry credentials in a PUBLIC repo or the
# build living somewhere other than the code. Building a PUBLIC image from a
# PUBLIC base removes the problem rather than routing around it: GitHub Actions
# pushes to GHCR with the built-in GITHUB_TOKEN, so no secret is stored here at
# all, and a public image needs no pull credentials from any cluster.
#
# WHAT IT IS FOR
#   1. The science cluster arms. deploy/crab-science/values.yaml runs arms on
#      `node:26-slim`, which pins a node major and nothing else. This image is
#      that, plus the two things the repo's own tooling needs.
#   2. Anyone who wants to run CRAB SHACK's tools without installing a
#      toolchain — the game is public, its instruments should be too.
#
# WHAT IT DELIBERATELY DOES NOT CONTAIN
#   - The game itself. tools/kube.mjs clones the repo at an explicit ref, and
#     an image carrying a copy of the source would go stale the first time
#     anyone pushed. The image is a TOOLCHAIN; the tree arrives at run time.
#   - gb / coop / kd. Those belong to the gasboat agent base and are not
#     public. An agent that needs them layers this or uses its own image.
FROM node:26-slim

# git: tools/kube.mjs clones the tree at a ref; the arms need it in-container.
# ca-certificates/curl/xz-utils: fetching and verifying the zig tarball below.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends git ca-certificates curl xz-utils; \
    rm -rf /var/lib/apt/lists/*

# ZIG, for the movement kernel. tools/kernel/build.sh builds kernel.c with
# `zig cc -target wasm32-freestanding -O2 -nostdlib`. Without it the wasm
# kernel can only be TRUSTED, never rebuilt — and the suite's proof that the
# wasm kernel and the JS reference agree byte-for-byte is worth much less if
# nobody in the loop can regenerate the artefact being compared.
#
# Both args are REQUIRED and have no defaults. The workflow resolves them from
# ziglang.org's own download index at build time and passes the PUBLISHED
# shasum, so neither this file nor the workflow hardcodes a version that would
# rot, and the tarball is verified against upstream's own number rather than
# one somebody typed.
# ZIG_URL is the tarball URL FROM THE INDEX, not one assembled here. The first
# version of this file built the URL by hand as
# zig-linux-${arch}-${ver}.tar.xz and 404'd (curl exit 22): upstream publishes
# zig-x86_64-linux-0.16.0.tar.xz — arch and OS in the OTHER order. The naming
# convention changed at some point and a hand-built URL cannot know that.
# The same rule already applied to the checksum and should have applied here:
# take what upstream publishes, do not reconstruct it.
ARG ZIG_URL
ARG ZIG_SHA256
RUN set -eux; \
    test -n "${ZIG_URL}"    || { echo "ZIG_URL build-arg is required";    exit 1; }; \
    test -n "${ZIG_SHA256}" || { echo "ZIG_SHA256 build-arg is required"; exit 1; }; \
    curl -fsSL "${ZIG_URL}" -o /tmp/zig.tar.xz; \
    echo "${ZIG_SHA256}  /tmp/zig.tar.xz" | sha256sum -c -; \
    mkdir -p /opt/zig; \
    tar -xJf /tmp/zig.tar.xz -C /opt/zig --strip-components=1; \
    rm -f /tmp/zig.tar.xz; \
    ln -sf /opt/zig/zig /usr/local/bin/zig

# An image that cannot rebuild the kernel is not the image this exists for.
RUN node --version && git --version && zig version

WORKDIR /work

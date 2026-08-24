# CRAB SHACK 3.5 agent sidecar image.
#
# Layered on the gasboat agent base so gb/coop/kd stay intact - the sidecar
# adds ONLY the delta. That rule is load-bearing: the base already ships
# node, npm, git, helm, kubectl, aws-cli, jq and python3, and re-installing
# any of them here would fork a toolchain that is already maintained.
#
# MEASURED against the live base image (2026-08-24, probed inside a running
# cs pod), so this list is what is actually missing, not what looked likely:
#
#   node      v24.15.0   present  -> but see PINNING below
#   npm       11.12.1    present
#   git       2.43.0     present
#   helm                 present
#   kubectl   v1.35.4    present
#   aws-cli   2.34.33    present
#   jq        1.7        present
#   python3   3.12.3     present
#   zig                  MISSING  <- the delta
#
# WHY ZIG. tools/kernel/build.sh builds the movement kernel with
# `zig cc -target wasm32-freestanding -O2 -nostdlib` (kernel.c -> kernel.wasm
# -> kernel-b64.js). Without it a pod can only trust the committed
# kernel.wasm binary and can never rebuild or verify it. The suite proves the
# wasm kernel and the JS reference agree byte-for-byte; that proof is worth
# much less if nobody in the loop can regenerate the artefact being compared.
#
# WHY PIN NODE. The cluster gate arms run node:26-slim (deploy/crab-science
# job.yaml) while the agent base ships node 24. Agents and gates disagreeing
# on runtime is the "a verdict belongs to one tree" trap wearing a different
# hat - a scenario that passes for an agent and fails on the gate, or worse
# the reverse, with nothing in either receipt to say why. Pin the sidecar to
# the SAME major the gates use.
ARG BASE_IMAGE
FROM ${BASE_IMAGE}

USER root

# --- node, pinned to the gate arms' major ------------------------------------
# NodeSource; NODE_MAJOR is the knob. Keep this equal to the tag in
# deploy/crab-science/templates/job.yaml (image.node) or the pin is a lie.
ARG NODE_MAJOR=26
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg xz-utils; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends nodejs; \
    rm -rf /var/lib/apt/lists/*; \
    node --version

# --- zig, for the wasm kernel ------------------------------------------------
# ZIG_VERSION and ZIG_SHA256 are REQUIRED build args with no defaults, on
# purpose. A default here would rot silently and an unverified tarball is not
# something to bake into an image that runs with the fleet's credentials.
# Look up the current release and its checksum at build time and pass both:
#   --build-arg ZIG_VERSION=<x.y.z> --build-arg ZIG_SHA256=<sha256>
ARG ZIG_VERSION
ARG ZIG_SHA256
RUN set -eux; \
    test -n "${ZIG_VERSION}" || { echo "ZIG_VERSION build-arg is required"; exit 1; }; \
    test -n "${ZIG_SHA256}"  || { echo "ZIG_SHA256 build-arg is required";  exit 1; }; \
    url="https://ziglang.org/download/${ZIG_VERSION}/zig-linux-x86_64-${ZIG_VERSION}.tar.xz"; \
    curl -fsSL "$url" -o /tmp/zig.tar.xz; \
    echo "${ZIG_SHA256}  /tmp/zig.tar.xz" | sha256sum -c -; \
    mkdir -p /opt/zig; \
    tar -xJf /tmp/zig.tar.xz -C /opt/zig --strip-components=1; \
    rm -f /tmp/zig.tar.xz; \
    ln -sf /opt/zig/zig /usr/local/bin/zig; \
    zig version

USER agent

# A build that cannot rebuild the kernel is not the image this exists for.
RUN node --version && zig version

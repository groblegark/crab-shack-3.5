# Spike receipts

- `brain-vispick.json` — the distilled artifact (int8 weights, declaration,
  held-out agreement). This IS the deliverable's proof of shape.
- `data-meta.json` — the collection's recipe + measured numbers
  (thinks/tick, script µs/call, class balance context).
- `data.json` (22 MB) is NOT committed: it regenerates bit-identically —
  `node tools/neuro/collect.mjs --towns 32 --days 12` — because the sim is
  the deterministic data factory. That property is the design.
- Cross-engine hashes (logits `bf1cd69f`, choices `daf56b1`, three engines)
  reproduce via `sh tools/neuro/build-nn.sh && node tools/neuro/xcheck.mjs`
  after regenerating the data.

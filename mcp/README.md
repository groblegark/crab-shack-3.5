# crab-science — an MCP server for the town

An agent holding only this server can learn what Crab Shack is, run
experiments, **see** pictures of what it ran, and design, validate, test and
iterate a whole new people. It needs no filesystem, no shell, and no prior
knowledge of the repo.

## Register it

```sh
claude mcp add crab-science -- node /ABSOLUTE/PATH/TO/crab-shack-3.5/mcp/server.mjs
```

or, in a client config file:

```json
{
  "mcpServers": {
    "crab-science": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/crab-shack-3.5/mcp/server.mjs"]
    }
  }
}
```

No install step and no dependencies — the repo has never had either. The
protocol is JSON-RPC over stdio and is spoken directly (`server.mjs`); an
SDK would have been the only `node_modules` in the tree.

**Tell the caller to run `orientation` first.** `initialize` says so too.

## The tools

| tool | what it is for |
|---|---|
| `orientation` | start here: the world, the design rulings, the path from nothing to a tested people |
| `docs_list` / `docs_read` / `docs_search` | the curated design corpus — rulings, schema, worked examples, the numeric and kernel records |
| `sim_run` | one town, the full end-of-run report, with the recipe that reproduces it |
| `sim_sweep` | many towns, a distribution — survival, eviction histogram, lifetimes — returned with a PNG chart |
| `sim_suite` / `sim_scenarios` | the repo's own scenario suite, filtered or listed |
| `render_town` | a PNG of an actual running town, desktop or portrait-phone screen |
| `cultureway_get` | fetch a bundled people to read or copy (`pig`) |
| `cultureway_validate` | the game's own validator, plus the exact field path that offended it |
| `cultureway_render` | every pose in every colorway, plus the body wearing each accessory |
| `cultureway_test` | install a draft in a real town: did they arrive, on what day, wearing what, carrying how much |
| `cultureway_diff` | what your people are actually unlike — tastes, purse classes, art, registers |

Documents are also exposed as MCP **resources** (`crabshack://…`) for clients
that prefer to browse rather than call.

## Rendering, without a dependency

The game draws through a real Canvas 2D API, and the headless sandbox stubs
it away because the sim never draws. To take a picture, `canvas.mjs`
implements the exact surface the PPU uses — `fillRect`/`fillStyle`,
`drawImage`, `create`/`putImageData`, one `translate`, one `scale(-1,1)`
mirror, and `source-in` for silhouettes. Every blit is axis-aligned,
unscaled and integer, so this is ~150 lines rather than a native module.
`png.mjs` encodes with node's own `zlib`. Zoom is nearest-neighbour on
purpose: this is a 256×240 screen with 5×7 glyphs, and smoothing turns text
into soup.

A frame is taken by flipping `window._headless` off for exactly one
`viewFrame()` call. That is safe because of the sim/view seam the suite
pins: **the view is a reader** — rendering moves no sim state and draws no
sim randomness, so photographing a town cannot change what the town does.

## What a caller can and cannot change

**Can:** their own draft documents, and the parameters of runs they ask for.

**Cannot:** the repository, the bundled cultureways, any file, any process.
The server exposes no write tool and no exec tool.

A submitted document is treated as hostile input, per the project's
hostile-file ruling: size-capped before it is parsed into a sim, carried as
plain JSON, validated by **the game's own `cultureProblem`**, installed
through the very door a player's imported save uses (`loadCultures`, which
silently drops what fails), and discarded with the throwaway sim that ran
it. Long calls are capped and return partial results plus a resume recipe
rather than hanging.

## Tests

```sh
node mcp/test-server.mjs
```

Drives the server over real stdio and exercises every tool, including the
authoring loop against a document broken in four ways at once — because
"the errors are actionable" is a claim that has to be tested, not asserted.

## The dogfood

`design/cultureways/gullway.json` — the gulls of THE WINDWARD ROOST — was
authored entirely through these tools, never by editing a file. They eat the
fish the pigs hold taboo, will not take a hot freshwater soak at any price,
and split into two registers on a pilot's cap. Writing them found two real
gaps, both since fixed: `'.'` in a palette produced a technically-correct
but useless error (it is the poses' transparent marker and belongs in no
palette), and a culture id that fails the engine's id pattern was being
dropped **silently** by the game with no verdict anywhere — the validator
now checks that itself, because `cultureProblem` never sees the id.

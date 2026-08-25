# CLOSE-OUT: the MCP docs teach crab-art.founders (E7 clause 4)

**Bead:** kd-uHcEV6N0fc — "E7 clause 4: MCP docs never teach crab-art.founders,
a validated field of the crab document." Parent epic kd-jSWPvJfLvQ (finish the
cultureway migration, E4/E5/E7); blocks E7 acceptance kd-d2B1Omu2JZ. Landed on
main.

## The hole, restated

E7's fourth clause is "the MCP docs teach an author the whole crab document."
`crab-art.founders` is live, validated, consumed crab-document data, and the one
surface whose JOB is to teach it was silent about it:

- **It is authored.** `tools/fixtures/crab-art.json` ships
  `founders = { "sudsy": "teal" }` — a map of founder key → colorway id.
- **It is consumed BY NAME.** `crabFounderColor` (game.js:5573) resolves a
  founder's shell as `colorways.findIndex(c => c.id === founders[who])`, with the
  in-code comment "A founder's shell is a NAME in the document, not 'whatever is
  last'." The field exists precisely to kill a positional convention: the shell
  rides the id, never the colorway ORDER.
- **It has TWO independent guards, both refusing by name.**
  - runtime belt: `crabArtProblem` (game.js:5553) →
    `"A FOUNDER WITH NO SHELL"` when a founder names a colorway that does not
    exist. The boot line (game.js:5565) drops `CRAB_ART_DOC` to `null` on any
    such problem, reverting crab colours to the sprites.js literals.
  - build belt: `tools/mkcultureways.mjs:51-53` throws at BUILD time,
    `"crab-art.founders.<f>: names a colorway that does not exist: <value>"`.
- **The docs taught NEITHER.** A grep for "founders" across `mcp/docs.mjs`
  returned zero hits. The art row (docs.mjs:97) named `colorways` but not
  `founders`. Two of the three surfaces (engine guard, build guard) teach the
  field by refusing; the one surface whose job is to teach was mute.

## The fix (small, by design)

A docs row plus a permanent test — no new family.

1. **`mcp/docs.mjs` art row** extended to name `founders`: a crab-document map
   of founder key → colorway id (`{ sudsy: "teal" }`), resolved BY NAME so a
   founder's shell rides the id not the colorway ORDER, refused
   `"A FOUNDER WITH NO SHELL"` at runtime and failing the BUILD by name. The row
   states the asymmetry explicitly: **"A foreign people declares no founders —
   that asymmetry is the design, not a gap; do not declare founders in a pig."**

2. **New permanent suite scenario** (`tools/suite.mjs`), "crab-art founders: a
   founder with no shell is refused by name at BOTH the runtime belt and the
   BUILD", proving both guards bite when a founder names a nonexistent colorway:
   - **engine half**, in the sim realm: `crabArtProblem` returns the named
     refusal; the guard DISCRIMINATES (an armed doc → boot keeps `null`; the
     real `BUNDLED_CRAB_ART` → kept), so it is not blanket-rejecting; and an
     unnamed founder key falls to the last-colorway convention rather than
     crashing.
   - **build half**: runs the REAL generator (`tools/mkcultureways.mjs`) against
     a poisoned crab-art fixture via two new test seams, asserts it THROWS with
     the named message and emits NO bundle. It never reimplements the guard, and
     the "threw yet still emitted a bundle" check closes the hole where a throw
     might not gate the write.

3. **Two test seams in `tools/mkcultureways.mjs`**, both defaulting to the
   shipped paths so the merge ritual's byte-exact regen is untouched:
   - `CS_CRAB_ART_FIXTURE` — the input crab-art fixture path.
   - `CS_CULTUREWAYS_OUT` — the output bundle path (so a test build cannot
     clobber the real `cultureways.js`).

## The trap I did NOT walk into

`mcp/culture.mjs` validates a FOREIGN people's art (palette/body/slots/poses/
colorways) and has NO `founders` branch — a foreign culture legitimately cannot
declare founders. The two surfaces are ASYMMETRIC and that asymmetry is the
DESIGN, not a gap: `founders` is a crab-document field only. I did not add a
`founders` branch to the foreign-culture validator to make the surfaces look
symmetric, and the docs row says so out loud to stop the next author from
"fixing" it.

## Discipline 3: the build guard DOES throw — no finding

The bead flagged this sharply: if the mkcultureways build guard did NOT throw
when the defect was armed, that would be a FINDING (a bundle could ship a founder
with no shell and only the runtime belt would catch it). It throws. Verified two
ways:

- **By me**, arming a temp fixture with `founders.sudsy = "nosuchshell"`:
  `Error: crab-art.founders.sudsy: names a colorway that does not exist:
  nosuchshell`, exit 1, no bundle emitted.
- **Independently by the captain** (cs-schedule-trigger-17-2-9hew, mail
  kd-mP27ptSaH9), arming the real fixture with `founders.sudsy = "chartreuse"`:
  same shape of named throw, exit 1, reverted byte-exact. The permanent test's
  regex matches that message exactly, so the two derivations agree.

The captain's review advice — pin the MESSAGE not merely the fact of failure,
because a test that only asserts "throws" would pass if someone later replaced
the named refusal with a generic error, and the whole value of these guards is
that they say WHICH founder and WHICH colorway — is satisfied: the test asserts
the exact `crab-art.founders.sudsy: names a colorway that does not exist`
substring.

## Byte-exactness

This change touches no bundled document. `node tools/mkcultureways.mjs`
regenerates `cultureways.js` **byte-exact** (120998 bytes, unchanged) on the
final tree — confirmed both before and after the seam edits, since both seams
default to the shipped paths. `node tools/mkversion.mjs` stamped version.js to
name this merge.

## Gate (all green)

Run in-pod (kube was RBAC-blocked this cycle — escalation kd-Y7RzIznJAw open —
so the canonical manifest path was unavailable; the in-pod suite IS the same game
engine). The pod's real CPU quota is 4 cores (cgroup 400000/100000), though
`nproc` misreports 8, so runs used `--jobs 4` (1:1 with the quota).

- **MCP check battery** (`tools/mcp-check.mjs`, the gate that matters most for an
  `mcp/` change): **60/60**.
- **Full suite, JS backend** (`SIMLIB_REALM=main --jobs 4`): **377/377**, 0 fail.
- **Full suite, wasm backend** (`+ SIMLIB_KERNEL=wasm`): **377/377**, 0 fail.

The suite count is 377 on this tree (376 pre-existing + the one scenario added
here). Gated on `a68d5e3`; the landed tree `1f1bab4` differs from it only in
NEW standalone files (`tools/clockoff.mjs`, `sleepdebt.mjs`, `sleephours.mjs`,
`yoyo.mjs` + closeout docs, from the sleep-probes lift) and version.js — none of
which the suite loads — so the gated bytes and the landed executable bytes are
identical. Verdicts: `founders-docs-suite-verdicts.txt`,
`founders-docs-mcp-battery.txt`.

## Stale-base hazard, navigated (advice kd-Wuar80ygL9)

Main moved four times during this task (24e0a81 → 7923db4 → c987a87 →
49671bd). The first branch was based on 7923db4; landing it as-is would have
silently REVERTED the L1_MAG bracketing pin (kd-ZqzmuaZwaT, 18 lines in the same
`tools/suite.mjs` I edited) with no conflict and a green suite — the exact
failure that advice warns about. Caught it, rebased twice onto current main, and
before landing diffed every deletion against `origin/main`: all four removed
lines are lines my own edits replace (the art row, the crabArtSrc read, the
writeFileSync, the fs import), none foreign. `grep -c magAtBound tools/suite.mjs`
= 3 (the pin survives) on the final tree.

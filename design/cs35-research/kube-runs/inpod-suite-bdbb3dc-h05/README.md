# inpod-suite-bdbb3dc-h05 — the votereason-derived-receipt tip, gated in its own name

**Verdict: GREEN, both backends — js 386/386, wasm 386/386**

`main`'s new tip is the stamp commit **b7e2a60** (`the stamp names the
votereason-derived-receipt build`), whose content commit is **bdbb3dc**
(`voteReason: derive the receipt from the compiled stake terms (the legibility
ruling, honored)`, bug kd-LA2w67QLG4). This receipt gates that tree in its own
name.

| backend | verdict | exit | wall |
|---|---|---|---|
| js   | 386/386 passed | 0 | 1349.4s |
| wasm | 386/386 passed | 0 |  885.3s |

Per-scenario `PASS` roll lives in `stdoutTail` of `js.json` / `wasm.json`, with
the machine fields (`sha`, `entry`, `args`, `env`, `exitCode`, `wallMs`,
`verdict`, `failures[]`) in the same shape the kube receipts use. Run in-pod
(gasboat fleet pod, project cs), `--jobs 4` — the pod's cgroup quota (`limits.cpu=4`,
`os.availableParallelism()===4`), so no self-oversubscription and the timings do
not lie (kube runbook, the cgroup lesson). Main realm (receipt-identical to vm
per CLAUDE.md, ~4.3x faster). One backend at a time, never two sims concurrently.

    sha  = b7e2a60f0428aeade8f1cf48aa45f72369845c6a   (the committed stamp tip)

## Why this tip owed a fresh gate (not a transfer)

`tools/suite.mjs` and `game.js` are both in `gatecheck.mjs`'s gate-relevant file
set. The content commit `bdbb3dc` changes both (`game.js` +56/-10 in voteReason;
`tools/suite.mjs` +93/-0, two new scenarios), so the newest gated ancestor's
verdict does not transfer — `gatecheck.mjs --ref b7e2a60` reports RED naming
those files. This receipt is that owed run. The suite grows 384 → 386.

The gate ran at content SHA **bdbb3dc**; its gate-relevant file set is
BYTE-IDENTICAL to the stamp tip b7e2a60 — proven `git diff --numstat bdbb3dc
b7e2a60 -- <GATE_FILES>` is empty — so the 386/386 verdict transfers to b7e2a60
exactly. The only file that differs between them is version.js, which is
DELIBERATELY excluded from the gate set (it is the merge's identity stamp).

This is the SECOND gate for this fix: the first (js 384/384) was rebased onto
the music-controls landing (main 9d4511b → 3b8df38), which itself changed
game.js / tools/suite.mjs / tools/simlib.mjs. Those files are gate-relevant, so
the fix was RE-GATED on the merged tree from scratch rather than transferred —
this receipt is that re-gate. Byte-equality re-probed on the merged tree before
re-gating: derived receipt == lambda receipt on 2916 (voter,platform) pairs, 0
mismatches.

## What the delta was — a RECEIPT fix, engine-only, byte-neutral for the shipped game

No culture fixture or generator changed; `cultureways.js` regenerates
byte-exact (mkcultureways.mjs run at the merge, no diff). The delta is:

  - **`game.js` `voteReason`** — the per-voter ballot receipt used to be a
    hardcoded if-chain that called the engine helpers directly and never read
    the voter's culture, so a stranger people that reweighted its stakes voted
    differently (platValue already dispatches) and gave the IDENTICAL sentence.
    That broke a STATED RULING (research §2.6 / substrate §3: the formula and
    its explanation "must come from one definition"). voteReason now dispatches
    on the voter's culture exactly as platValue does, gathers `platReads` once,
    runs THIS voter's compiled stake terms, and gates its valuation clauses on
    the TERM VALUES (floorRaise > 0, floorBill < 0, purseCost <= -82800). The
    dollar/bowl figures stay the engine facts platReads already gathered, so the
    crab's line is byte-equal; WHETHER a clause appears is the term's own
    verdict. A shared `capClause()` carries the house-limit clause (a roster
    SITUATION, not a magnitude) for both paths. The direct-helper body is the
    byte-equal lambda fallback (no compiled civics / `_nol1plat`), exactly as
    platValue keeps its lambda.

  - **`tools/suite.mjs`** — two scenarios (the E3/E4 ceremony for the receipt):
    - *civics receipt: voteReason is byte-equal to the lambda receipt on every
      voter, every platform* — the transcription-equality gate, derived ==
      lambda over the grown town × every platform, with both-sided clause
      coverage (each term-gated clause must appear AND be absent in the town, or
      a stuck gate would hide).
    - *civics receipt: a stranger culture's bent stake gives a DIFFERENT
      sentence* — the dispatch/mutation demo. A boar culture = the crab's stakes
      with `purseCost`'s coefficient bent toward 0 gives a different sentence for
      many voters; an UNDECLARED culture (gull) falls to the lambda and is
      byte-identical to the crab. On main the divergence count is exactly ZERO,
      because voteReason never read the terms at all.

## The mutation demo, measured (probe, seed 1337/7, grown town)

  - derived receipt vs lambda receipt: **0 mismatches / 2916** (voter,platform)
    pairs — byte-equal.
  - stranger culture (boar, purseCost bent -69→-1) vs crab: **21315 / 58800**
    sentences diverge; the "AND PAYS FOR IT" line becomes "AND PAYS LITTLE".
  - undeclared culture (gull) vs crab: **0 / 58800** moved — the dispatch only
    moves a people that DECLARED its own stakes.

## What was NOT taken, and why (the flagged design fork)

The bug flagged two design questions "worth an operator or designer eye rather
than an agent guessing":

  1. **Single-clause "largest-magnitude term" phrasing** (as the phase-E plan
     literally states) — NOT taken, and this is a MEASUREMENT, not a preference:
     the dominant term is `purseCost`/`capStake` for every voter in a real town,
     so one clause could not carry the crab's multi-clause line and would fail
     the task's own byte-for-byte gate. The multi-clause term-GATED model is the
     only reading that satisfies both the ruling and the gate.

  2. **Culture-AUTHORED clause wording** (a document section, so a people
     supplies its own phrases) — the fuller answer to the ruling and, in the
     author's own words, "the bigger change." NOT taken here; it builds ON this
     selection machinery (which term fired) and is strictly additive. Filed as
     follow-up feature **kd-4xkaLNMMx7** under epic kd-2BEHGIr7BP for a designer,
     rather than block a P1 lie behind an indefinite design wait. This fix makes
     the SELECTION honest today; authored wording makes the WORDS a culture's own
     tomorrow.

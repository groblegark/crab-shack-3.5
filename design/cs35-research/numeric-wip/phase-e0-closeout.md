# PHASE E0 CLOSE-OUT — the scenario that could not go red, and the machine that refuses by name

Branch `phase-e0`, off 11db426. Two rungs of design/cs35-phase-e-plan.md:
E0a (fix the vacuous thinking-heads scenario) and E0b (the Layer-1
interpreter + assembler + static validator, byte-neutral — nothing in the
sim calls it yet).

## E0a — the scenario had TWO hiding places, not one

The plan's adjudication found the first: the scenario read the legacy
`SAVE_KEY`, which `save()` stopped writing in the slots era. The fix's own
first cluster run found the second: the harness boots `?fresh` by default,
and under `FRESH`, `save()` is a deliberate no-op (game.js:7994) — so even
repointed to `slotKey(activeSlot)`, the envelope came back null. The old
scenario was vacuous twice over: FRESH hid the write, the legacy key hid
the read, and the null-vs-null comparison of two fresh towns passed for an
era. The fixed scenario boots `fresh: false` (a first-run boot on empty
storage owns slot 1 per game.js:20014's grant), refuses a null envelope,
refuses a load that did not take (`day < 6` = the fresh-town trap), and
compares futures the way it always claimed to.

**The built-in bite, and the lesson it bit ME with**: the scenario corrupts
the reloaded envelope's temperaments (dm, dream-replay rung 0) and demands
a DIFFERENT future. Take 2 biased ONE persona toward class 0 — which is
"none", the ~94%-prior sitting champion (brainCitPick starts with
`bestL = logits[0]`): a bias toward doing nothing is a whisper, and the
wasm arm heard it as silence (futures identical) while the js arm happened
to diverge. Not a backend divergence — a marginal mutation. Take 3 biases
EVERY crew member's last (acting) class by +2e9: the corrupted town acts
compulsively and the divergence is structural on both backends. A bite
must be loud enough that silence is a verdict, not a coin flip.

## E0b — the Layer-1 machine

`game.js` grows a self-contained block ahead of the culture validators
(placed in game.js rather than a new engine file so index.html, simlib,
headless, and xengine need no loader changes — one region, zero plumbing):

- **`L1_OPS`** — 20 ops: PUSHI, LD, ADD, SUB, MUL, DIVI, MULDIV, MIN, MAX,
  CLAMP, ABS, NEG, LT, LE, EQ, AND, OR, NOT, SEL, TERM. Straight-line, no
  jumps, no loops, SEL the only conditional, TERM legal only as the final
  op (the family-1 term NAME rides the term list, not the code).
- **`l1Assemble(prog, bundle)`** — readable rows (`["LD",1],["PUSHI",20],
  ["SUB"]…`) → flat int code, validated in the same pass: op allowlist;
  length ≤ 256 (fuel IS length); static stack depth ≤ 16, underflow refused;
  LD indices inside the declared read bundle, every bundle row carrying an
  integer [min,max]; DIVI/MULDIV divisors positive integer constants; PUSHI
  immediates int32; and a propagated magnitude interval per op — a program
  whose worst case (any intermediate product included, because the runtime
  computes `a*b` exactly before dividing) can leave ±2^52 is refused at
  import with the offending bound in the message. Every refusal NAMED.
- **`l1Run(code, read)`** — the interpreter. No checks: the validator is
  the contract, and a validated straight-line program cannot underflow,
  overflow, or loop.
- **Division is the grid idiom** `(a - a%c)/c` — truncation toward zero on
  a negative numerator, like every signed component in this file. The
  goldens pin `DIVI(-7,4) = -1` and `MULDIV(-3,5,4) = -3` so a well-meaning
  floor "fix" turns red.
- **Kernel port: NOT YET PORTED**, said out loud per the appeal precedent —
  every known consumer (E3 depart bodies, E4 civics) runs at JS-side
  decision points; a kernel interpreter today would be speculative surface.
- **Read bundles are caller-supplied stubs until phase D's registries land**
  (the plan's E0b note); the assembler's bundle contract ({name, min, max}
  rows, order = LD index space) is the seam D's registry rows drop into.
- **mkcultureways compilation deferred to E3/E4** with the first content
  consumer — no document carries a program yet, so there is nothing to
  compile; byte-neutral by construction (no consumer, no draws, no state).

## Scenarios (suite grows by 2)

1. **"layer 1: the golden programs answer to the pin"** — 22 programs, every
   op exercised, outputs hand-pinned, run IN-SIM on both backends. The two
   truncation pins are the law of the division direction.
2. **"layer 1: hostile programs are refused by name"** — 16 refusal paths,
   each with a message match: unknown op, over-length (257), underflow,
   depth 17, LD out of range, DIVI 0 / DIVI −2 / MULDIV 0, non-int32
   immediate, magnitude past 2^52, two-value ending, TERM not last, empty
   program, wrong immediate arity ×2, rangeless bundle slot. A validator
   that refuses for the WRONG reason is as red as one that stops refusing.

## Gates

- Full suite on the cluster (experiments/suite-312.json, 16 arms, both
  backends) at the take-3 tree: see final report — the take-1 run went red
  exactly where E0a's null-envelope guard demanded (the fix proving itself),
  take 2 exposed the whisper-bite, take 3 is the shipping tree.
- Focused manifest `experiments/e0-focus.json` (the three E0 scenarios,
  both backends) added as the mutation-demo instrument.
- Mutation demos, each proven red on the cluster then reverted:
  (1) floor-direction mutation in l1Run's DIVI → the golden pins red;
  (2) validator check dropped (stack-depth) → the hostile battery red.
- Byte-neutrality: no consumer, no draws; the suite's frozen fingerprint
  and rng pins pass untouched on both backends (they ride every full run).

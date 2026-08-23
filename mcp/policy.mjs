// POLICY TOOLS — the distillation loop, closed inside the authoring loop.
// An agent that can author a people can now also compress a decision surface
// into a brain: collect (the deterministic sim labels its own data), train,
// quantize to the integer recipe, verify, and get back a policies-section
// artifact ready to paste into its document. tools/neuro/distill.mjs is the
// one implementation; this file only shapes it for MCP callers and enforces
// the fuel caps a remote caller gets.

import { collectRows, collectCitizenRows, trainArtifact, verifyArtifact,
  CLASSES, INPUTS, CIT_CLASSES, CIT_INPUTS } from "../tools/neuro/distill.mjs";
import { guardDoc } from "./culture.mjs";
import { createVisibleSim } from "./render.mjs";

const clamp = (v, lo, hi, d) => Math.max(lo, Math.min(hi, v == null ? d : v));

// Distill a brain for a decision surface from the reference script's own
// choices. Returns the artifact IN SHADOW MODE: an author promotes it to
// "live" themselves — shipping a decider should be a decision, not a default.
export async function policyDistill({ surface = "vis_pick.candidate", culture = "crab",
  document = null, towns, days, hidden, epochs, seed } = {}) {
  const SURFACES = { "vis_pick.candidate": collectRows, "cit_errand.candidate": collectCitizenRows };
  if (!SURFACES[surface])
    return { error: `unknown decision surface "${surface}"; surfaces today: ${Object.keys(SURFACES).join(", ")}` };
  if (surface === "cit_errand.candidate" && culture !== "crab")
    return { error: "the citizen surface distills for crab residents today - settlers are the phase-B roadmap item that widens it" };
  if (culture !== "crab") {
    if (!document) return { error: `distilling for "${culture}" needs its cultureway document (the "document" parameter)` };
    const g = guardDoc(document);
    if (g) return { error: g };
  }
  const t = clamp(towns, 1, 32, 8), d = clamp(days, 2, 12, 6);
  const data = SURFACES[surface]({ towns: t, days: d, culture, cultureDoc: document });
  if (data.rows.length < 50)
    return { error: `only ${data.rows.length} labeled ${culture} thinks in ${t} towns x ${d} days - not enough to distill; raise towns/days`, meta: data.meta };
  const { artifact, heldout, trainRows } = trainArtifact({
    data, hidden: clamp(hidden, 4, 64, 24), epochs: clamp(epochs, 2, 40, 15),
    seed: seed == null ? 7 : seed, surface,
  });
  artifact.mode = "shadow";   // promotion to "live" is the author's own act
  return {
    artifact,
    receipts: {
      data: { rows: data.rows.length, trainRows, thinksPerTick: data.meta.thinksPerTick },
      heldout: { agreement: heldout.agree, n: heldout.n },
      recipe: { classes: surface === "cit_errand.candidate" ? CIT_CLASSES : CLASSES,
        inputsDeclared: artifact.inputs.length, registryVersion: artifact.registryVersion },
    },
    note: "artifact.mode is \"shadow\" - set it to \"live\" in your document's policies section when its agreement satisfies you; the engine's agreement-floor scenario is the standing gate for bundled brains",
  };
}

// Verify an existing policies-section artifact: the engine's own validator
// first (clamps, caps, registry version - actionable messages), then a fresh
// agreement measure against the reference script on newly collected towns.
export async function policyVerify({ document = null, culture = "crab", artifact = null,
  surface = null, towns, days } = {}) {
  let pol = artifact;
  if (!pol && document && document.policies)
    pol = document.policies[surface || "vis_pick.candidate"];
  if (!pol) return { error: "pass an artifact, or a document whose policies carry the surface" };
  const sid = surface || (pol.provenance && pol.provenance.surface) || "vis_pick.candidate";
  if (sid !== "vis_pick.candidate" && sid !== "cit_errand.candidate")
    return { error: `unknown decision surface "${sid}"; surfaces today: vis_pick.candidate, cit_errand.candidate` };
  if (document) { const g = guardDoc(document); if (g) return { error: g }; }
  // the engine's door, verbatim - policyProblem lives in game.js
  const sim = createVisibleSim({ seed: 1337 });
  const why = sim.G(`policyProblem({ ${JSON.stringify(sid)}: ${JSON.stringify({ ...pol, kind: "brain" })} })`);
  if (why) return { valid: false, problem: why };
  const collect = sid === "cit_errand.candidate" ? collectCitizenRows : collectRows;
  const data = collect({ towns: clamp(towns, 1, 8, 3), days: clamp(days, 2, 8, 4),
    culture, cultureDoc: culture !== "crab" ? document : null });
  const v = verifyArtifact(pol, data);
  return { valid: true, agreement: v.agree, thinks: v.n,
    note: v.n < 100 ? "small sample - raise towns/days for a real measure" : undefined };
}

/* _test_sensitivity.mjs — the three budgets, and the refusal to add them.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The claim under test is not arithmetic, it is a distinction: a number that moves when you carry
 * the arithmetic further has NOT CONVERGED, and that is a defect; a number that moves when you
 * change a radius is answering about a different model; only a measured input's published error is
 * an uncertainty.  So the checks are about which word comes out, and the decisive one is that a
 * truncation drift can never be dressed as a +- interval.
 *
 * The worked case is Carles's own: an approximation of the potential puts the Higgs at 125.85 GeV
 * where the full numerical sum gives about 127.85.  Two GeV.  This file requires that the module
 * calls that NOT CONVERGED rather than 126.85 +- 1.
 *
 *   node _test_sensitivity.mjs
 */
import { knobFaults, scan, budget, stateResult, KNOB_KINDS } from "./src/kernel/sensitivity.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

console.log("=".repeat(96));
console.log("   sensitivity.mjs — three budgets, never one");
console.log("=".repeat(96));

console.log("\n   1 -- A KNOB DECLARES WHAT IT IS BEFORE WHAT IT DOES\n");
ok(knobFaults({ name: "w", kind: "convergence", what: "windings", values: [50, 300], target: 0.01 })
   .length === 0, "a well-formed convergence knob is accepted");
ok(knobFaults({ name: "w", kind: "convergence", what: "windings", values: [50, 300] })
   .some((f) => f.includes("target")),
   "a convergence knob with no declared target is refused — 'converged' would have no meaning");
ok(knobFaults({ name: "mW", kind: "measured", what: "the W mass", values: [80.35, 80.39] })
   .some((f) => f.includes("source")),
   "a measured knob with no source is refused — the error is somebody's published number");
ok(knobFaults({ name: "x", kind: "guess", what: "y", values: [1, 2] })
   .some((f) => f.includes("kind must be")),
   "and a knob of an undeclared kind is refused", "kinds: " + KNOB_KINDS.join(", "));

console.log("\n   2 -- THE WORKED CASE: 125.85 AGAINST 127.85 IS NOT AN ERROR BAR\n");
/* the quantity: a Higgs mass that depends on how many windings the sum is carried to */
const higgs = (s) => (s.windings >= 300 ? 127.85 : 125.85);
const knobs = [
  { name: "windings", kind: "convergence", what: "how far the winding sum is carried",
    values: [20, 300], target: 0.5 },
];
const r = scan(higgs, knobs, { windings: 20 });
const b = budget(r, { target: 0.5 });
ok(b.verdict.word === "sensitive-to-truncation",
   "two GeV of truncation drift reads `sensitive-to-truncation`, not an interval",
   b.verdict.why.slice(0, 78));
ok(b.notes.some((n) => n.includes("not converged")),
   "and the note says the arithmetic has not converged, in those words",
   b.notes[0] ? b.notes[0].slice(0, 76) : "");
const line = stateResult("m_h", "GeV", b);
ok(line.includes("NOT CONVERGED") && !line.match(/^m_h = [\d.]+ ± /),
   "the printed line refuses the ± form for a truncation drift", line);

console.log("\n   3 -- THE THREE BUDGETS STAY APART\n");
/* a quantity moved a little by a measured input and a lot by a model choice */
const mass = (s) => 1.94 * (1 + 0.002 * ((s.mW ?? 80.37) - 80.37)) + 0.10 * ((s.c ?? 0) - 0);
const three = [
  { name: "mW", kind: "measured", what: "the W mass", values: [80.356, 80.383],
    source: "EXPERIMENT.m_W" },
  { name: "c", kind: "model", what: "the brane-localized kinetic coefficient", values: [-1, 1] },
];
const b3 = budget(scan(mass, three, { mW: 80.37, c: 0 }));
ok(b3.convergence === 0 && b3.model > 0 && b3.measured > 0,
   "a scan with no convergence knob leaves that budget at zero and fills the other two",
   "model " + b3.model.toPrecision(3) + ", measured " + b3.measured.toExponential(2));
ok(b3.model > b3.measured, "and they are not summed: the model spread dominates on its own",
   "the label follows the dominant kind, not a quadrature of all three");
ok(b3.verdict.word === "sensitive-to-model", "so the verdict is `sensitive-to-model`",
   b3.verdict.why.slice(0, 74));
ok(stateResult("m_1", "TeV", b3).includes("range of predictions"),
   "and the printed line calls it a range across a family, not an error bar",
   stateResult("m_1", "TeV", b3));

console.log("\n   4 -- A MEASURED-ONLY SCAN IS THE ONLY ONE THAT EARNS A ±\n");
const bm = budget(scan((s) => 1.94 * (1 + 0.05 * ((s.mW ?? 80.37) - 80.37)), [three[0]], { mW: 80.37 }));
ok(bm.verdict.word === "robust" && stateResult("m_1", "TeV", bm).includes("±"),
   "propagating a published error, and only that, prints as ±",
   stateResult("m_1", "TeV", bm));

console.log("\n   5 -- A KNOB THAT DOES NOTHING IS SUSPICIOUS, NOT REASSURING\n");
const bn = budget(scan(() => 42, [three[1]], {}));
ok(bn.verdict.word === "not-determined" && bn.verdict.why.includes("do not reach"),
   "a scan where nothing moves says the knobs may not be wired to the quantity",
   bn.verdict.why.slice(0, 76));

console.log("\n   6 -- A KNOB THAT THROWS IS COUNTED, NOT SWALLOWED\n");
const bad = scan((s) => { if (s.q === 2) throw new Error("boom"); return 1; },
                 [{ name: "q", kind: "model", what: "a knob that breaks", values: [1, 2] }], { q: 1 });
ok(bad.scans[0].failed === 1, "a variation that throws is recorded as failed", "1 of 2");
const ball = budget(scan(() => { throw new Error("always"); },
                    [{ name: "q", kind: "model", what: "always breaks", values: [1, 2] }], {}));
ok(ball.notes.some((n) => n.includes("untested")),
   "and a knob whose every variation failed is reported as untested, not as stable",
   ball.notes[0]);

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

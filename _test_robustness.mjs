/* _test_robustness.mjs — the sensitivity frame, now meeting real quantities.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `_test_sensitivity.mjs` exercises the frame with synthetic functions, which proves the arithmetic
 * and nothing about this instrument.  This file points the same frame at numbers the repository
 * computes, on the published SU(7) permalink, and the check that matters is the one that could
 * fail: TWO QUANTITIES MUST GET DIFFERENT BREAKDOWNS.  The gauge coupling g4 enters the Higgs mass
 * linearly and does not enter the compactification scale at all, so a scan that gives them the same
 * budget is measuring itself rather than them.
 *
 * The convergence budget is anchored to a number obtained outside this file: H129F measured 2.3e-5
 * GeV between 300 and 1200 windings, so a winding budget of order 1e-4 GeV is what "converged"
 * should look like here, and anything larger would mean the wiring reaches a different quantity.
 *
 *   node _test_robustness.mjs
 */
import { readFileSync } from "node:fs";
import { robustness, higgsFromSum, invRFromSum, knobsFor } from "./src/modules/robustness.mjs";
import { knobFaults } from "./src/kernel/sensitivity.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

const d = JSON.parse(readFileSync("./data/su7_km25.json", "utf8"));
const gauge = (d.gauge_seeds && d.gauge_seeds.published && d.gauge_seeds.published.gauge) || d.gauge;
const terms = gauge.map((t) => t.slice());
for (const [rep, par, cnt] of [["28", "(+,+)", 1], ["84", "(+,+)", 4]])
  for (const [m, s, c] of d.reps[rep][par]) terms.push([m * cnt, s, c]);

console.log("=".repeat(96));
console.log("   robustness.mjs — the three budgets on a real model");
console.log("=".repeat(96));

console.log("\n   1 -- THE KNOBS ARE ADMISSIBLE BY THE FRAME'S OWN RULES\n");
const knobs = knobsFor({});
let faults = [];
for (const k of knobs) faults = faults.concat(knobFaults(k));
ok(faults.length === 0, "all three knobs declare kind, what, values and their kind's extra"
   + " requirement", faults.join("; "));
ok(knobs.map((k) => k.kind).sort().join(",") === "convergence,measured,model",
   "and there is exactly one of each kind, so all three budgets get exercised");
ok(knobs.find((k) => k.kind === "measured").source.includes("PDG"),
   "the measured knob names the published source of its error",
   knobs.find((k) => k.kind === "measured").source.slice(0, 62));

console.log("\n   2 -- THE QUANTITIES ARE THIS REPOSITORY'S, NOT A FIXTURE\n");
const mh = higgsFromSum(terms, {});
ok(mh > 100 && mh < 200, "m_h from the summed potential is a physical number", mh.toFixed(4) + " GeV");
ok(Math.abs(mh - 127.85) < 0.5, "and it is the H129F value, so the wiring reaches the right object",
   "H129F: 127.8536 GeV");
const iR = invRFromSum(terms, {});
ok(Math.abs(iR - 1935.9) < 5, "1/R likewise", iR.toFixed(1) + " GeV");

console.log("\n   3 -- THE CHECK THAT COULD FAIL: TWO QUANTITIES, TWO DIFFERENT BREAKDOWNS\n");
const R = robustness(terms, {});
ok(R.m_h.model > 1, "g4 moves the Higgs mass a lot — it enters the mass formula linearly",
   "model budget " + R.m_h.model.toPrecision(3) + " GeV");
ok(R.invR5.model < 1e-9, "and it does NOT move the compactification scale at all",
   "model budget " + R.invR5.model.toPrecision(3) + " GeV — g4 is absent from 1/R = 2 m_W/alpha");
ok(R.m_h.verdict.word === "sensitive-to-model" && R.invR5.verdict.word === "robust",
   "so the two get different verdicts from the same scan",
   "m_h " + R.m_h.verdict.word + ", 1/R " + R.invR5.verdict.word);

console.log("\n   4 -- THE CONVERGENCE BUDGET, AGAINST A NUMBER MEASURED OUTSIDE THIS FILE\n");
ok(R.m_h.convergence < 1e-2,
   "the winding budget is far under its declared target of 0.01 GeV",
   R.m_h.convergence.toExponential(2) + " GeV, against the 2.3e-5 H129F measured over 300->1200");
ok(R.m_h.convergence < R.m_h.measured && R.m_h.measured < R.m_h.model,
   "and the three budgets come out ordered: convergence << measured << model",
   [R.m_h.convergence, R.m_h.measured, R.m_h.model].map((x) => x.toPrecision(3)).join("  <  "));

console.log("\n   5 -- WHAT THE ANSWER ACTUALLY SAYS\n");
ok(R.m_h.line.includes("range of predictions") && !R.m_h.line.includes("±"),
   "the Higgs mass is printed as a RANGE across a model family, never as an error bar",
   R.m_h.line);
ok(R.invR5.line.includes("±") && R.invR5.line.includes("measured inputs"),
   "while the scale, moved only by a published error, earns the ± it is printed with",
   R.invR5.line);

console.log("\n   6 -- DECOY: A KNOB THAT DOES NOT REACH THE QUANTITY\n");
/* g4 is absent from 1/R, so scanning 1/R with ONLY that knob must come back `not-determined` and
 * say the knobs may not be wired — not `robust`, which is what a silent zero would look like. */
const onlyG4 = knobs.filter((k) => k.name === "g4");
const { scan, budget } = await import("./src/kernel/sensitivity.mjs");
const blind = budget(scan((s) => invRFromSum(terms, s), onlyG4,
                          { windings: 600, mW: EXPERIMENT.m_W.value }));
ok(blind.verdict.word === "not-determined" && blind.verdict.why.includes("do not reach"),
   "scanning 1/R with g4 alone says the knob may not reach the quantity, not that it is robust",
   blind.verdict.why.slice(0, 74));

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

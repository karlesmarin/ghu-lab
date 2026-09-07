/* robustness.mjs — the sensitivity machinery, wired to this instrument's own numbers.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `sensitivity.mjs` holds the discipline -- three budgets that are never added, and four refusals
 * in the declaration of a knob -- but on its own it is a frame with nothing in it: its harness
 * exercises it with synthetic functions, and a frame checked only against fixtures has never met a
 * real quantity.  This file is the wiring.  Every knob below moves something this repository
 * actually computes, and the answer that comes back is about a model and not about a test.
 *
 * THE QUANTITY.  The Higgs mass from the SUMMED potential -- the object H129F established as the
 * arbiter, since the small-phase branch cannot resolve a 2 GeV window at alpha ~ 0.083.  So the
 * scan minimises F numerically, differentiates the sum for the curvature, and applies the same mass
 * formula the whole repository uses.
 *
 * THE THREE KNOBS, one of each kind, so that the three budgets are all exercised by something real:
 *
 *   windings   CONVERGENCE.  How far the winding sum is carried.  Not a parameter of anything: if
 *              the answer moves with it, the arithmetic has not converged.  Its target is declared
 *              because "converged" is meaningless without one.
 *   g4         MODEL.  The four-dimensional gauge coupling is a CONVENTION of the data file, not a
 *              measurement, and the mass formula is linear in it -- K = sqrt(3) m_W g4 / (2 pi^3).
 *              Moving it asks a different model.
 *   m_W        MEASURED.  The one input with a published error, carried in `experiment.mjs` with
 *              its source and the date it was read.
 *
 * WHAT THE ANSWER IS EXPECTED TO SAY, written before running it so the run can contradict it: the
 * winding budget should be negligible (H129F measured 2.3e-5 GeV between 300 and 1200 terms) and
 * the m_W budget tiny (its error is 1.7e-4 relative), leaving g4 dominant by a wide margin.  If
 * that holds, the honest reading of any absolute mass from this model is that its spread is a
 * CONVENTION and not an uncertainty -- which is the Part VI anchor question showing up as a number
 * instead of as a caveat.
 *
 * D3: no gauge group is named here.  A term table and a set of conventions go in.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */
import { numericMin, curvatureSummed, kConst } from "../kernel/potential.mjs";
import { EXPERIMENT } from "../kernel/experiment.mjs";
import { scan, budget, stateResult } from "../kernel/sensitivity.mjs";

/* m_h from the summed potential, at the numeric minimum, for one setting of the knobs. */
export function higgsFromSum(terms, { windings = 600, g4 = 0.63, mW = 80.4 } = {}) {
  const a = numericMin(terms, { windings, lo: 1e-4, hi: 1 });
  if (a === null) return NaN;
  const fpp = curvatureSummed(terms, a, windings);
  if (!(fpp > 0)) return NaN;
  return kConst(mW, g4) * Math.sqrt(fpp) / a;
}

/* The compactification scale, which moves with the vacuum and with m_W and NOT with g4 -- a second
 * quantity whose budget breakdown must therefore look different, or the scan is not measuring the
 * quantity it is pointed at. */
export function invRFromSum(terms, { windings = 600, mW = 80.4 } = {}) {
  const a = numericMin(terms, { windings, lo: 1e-4, hi: 1 });
  return a === null ? NaN : 2 * mW / a;
}

/* The knobs, declared.
 *
 * THE g4 RANGE IS A CHOICE OF MINE AND IS LABELLED AS ONE.  +-10% is not read from anywhere: it is
 * a span wide enough to show that the quantity is linear in it and narrow enough to be plausible.
 * The honest range would come from the Part VI anchor question, which is open -- and that is
 * precisely why the verdict below matters more than its width: whatever the range, the budget it
 * produces is a CONVENTION's spread and not an uncertainty, and it dwarfs both of the others. A
 * reader who wants a different span passes it; the label does not change. */
export function knobsFor({ g4 = 0.63, mW = EXPERIMENT.m_W.value, mWErr = EXPERIMENT.m_W.error } = {}) {
  return [
    { name: "windings", kind: "convergence", target: 0.01,
      what: "how far the winding sum of the one-loop potential is carried",
      values: [150, 300, 600, 1200] },
    { name: "g4", kind: "model",
      what: "the 4D gauge coupling, a CONVENTION of the data file and not a measurement; the mass"
        + " formula is linear in it",
      values: [g4 * 0.9, g4, g4 * 1.1] },
    { name: "mW", kind: "measured", source: "EXPERIMENT.m_W, " + EXPERIMENT.m_W.source,
      what: "the measured W mass, which sets the scale",
      values: [mW - mWErr, mW, mW + mWErr] },
  ];
}

/* Run the three budgets on one term table and return both the raw scan and the sentence. */
export function robustness(terms, opts = {}) {
  const knobs = knobsFor(opts);
  const base = { windings: 600, g4: opts.g4 ?? 0.63, mW: opts.mW ?? EXPERIMENT.m_W.value };
  const mh = budget(scan((s) => higgsFromSum(terms, s), knobs, base), { target: 0.5 });
  const iR = budget(scan((s) => invRFromSum(terms, s), knobs, base), { target: 5 });
  return {
    m_h: { ...mh, line: stateResult("m_h", "GeV", mh) },
    invR5: { ...iR, line: stateResult("1/R", "GeV", iR) },
    knobs: knobs.map((k) => ({ name: k.name, kind: k.kind, what: k.what, values: k.values })),
  };
}

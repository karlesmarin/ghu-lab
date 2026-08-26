/* calculator.mjs — Parts IV-V: a content in, the Higgs out.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Wraps the anchored engine in `wilson.mjs` as capabilities.  The engine reproduces AHMN's
 * published mass ratio, 1.2045 against 1.2046; without that this module would have no business
 * existing, which is why it requires the anchor to have passed and not merely to have been run.
 *
 * IT REQUIRES `legal_domain`.  That is the point of the split and not bookkeeping: if the selection
 * rule cannot say which region of the torus is legal, this module does not run and its outputs say
 * why, rather than minimising over a region nobody vouched for.  DESIGN.md D4, with a real cause
 * behind it at last.
 *
 * The statuses are the published tool's own and are not upgraded here: the vacuum, the masses and
 * the mixing are `measured`, and one published case is the whole of their validation.  What is a
 * theorem in this section belongs to Parts IV-V and is not recomputed by this module.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { spectrum, lattice, minimise, V } from "../kernel/wilson.mjs";

const CALC_ANCHOR = "the engine reproduces AHMN's published vacuum and mass ratio (1.2045 against " +
               "1.2046); that single published case is the whole of its validation";

/* A model record's bulk, in the row form the engine speaks.  `eta` and `role` are properties of
 * the multiplet in the model, not of the kernel. */
export function rowsOf(model, data) {
  const out = [];
  for (const b of model.bulk || []) {
    if (!b.multiplicity) continue;
    if (!data.reps_modes || !data.reps_modes[b.rep]) return null;   // this group has no modes
    out.push({ key: b.rep, n: b.multiplicity,
               eta: b.eta === undefined ? 1 : b.eta,
               role: b.role === undefined ? 1 : b.role });
  }
  return out;
}

/* EVERY REPRESENTATION, and what halving the search actually costs.
 *
 * The selection rule licenses searching only alpha_2 in [0, 1/2] for some representations.  This
 * runs the same grid twice -- over the half and over the whole torus -- on all 119 and asks two
 * questions, of which only the second is interesting:
 *
 *   1. where the rule ALLOWS halving, does the half find the same minimum?  It must.
 *   2. where the rule FORBIDS it, does halving ever actually lose the minimum?
 *
 * If the answer to (2) were never, the rule would be free caution: you could always halve and the
 * theorem would be protecting nothing.  So the sweep reports that count, and the panel leads with
 * it, because a rule that never bites is a rule nobody needs.
 *
 * IT DOES NOT AUDIT THE POLISH.  It tried: it polished from its own coarse seed and reported 3 of
 * 119 contents as "not a minimum".  All three are minima -- their light eigenvalues are 764, 764
 * and 397 -- and what the number measured was that a Newton step from a 40-point grid lands
 * somewhere a step from a 60-point grid does not.  A metric whose value comes from a resolution I
 * picked for speed is not a finding, so it is not here.  The domain question below needs no such
 * choice: the half's points are a subset of the full's at any N.
 */
export function sweepDomain(data, halfOf, opts = {}) {
  /* `names` runs a SLICE of the catalogue.  The whole sweep is seventeen seconds of arithmetic and
   * a browser doing that in one call is a browser that has stopped answering; the section feeds it
   * the catalogue in pieces and paints progress between them. */
  const only = opts.names ? new Set(opts.names) : null;
  const N = opts.N || 40;                       /* alpha_2 steps over the WHOLE torus */
  const H = Math.round(N / 2);                  /* ... and the index at which the half ends */
  const LATT = lattice(data.kmax), rows = [];
  for (const c of data.catalogue || []) {
    if (only && !only.has(c.name)) continue;
    if (!data.reps_modes || !data.reps_modes[c.name]) continue;
    const sp = spectrum([{ key: c.name, n: 1, eta: 1, role: 1 }], data);
    if (!sp.length) continue;

    /* ONE scan, two running minima.  Scanning the half separately with its own N gave it twice the
     * resolution of the full scan, so the "half" kept finding lower values than the whole torus --
     * a loss of -5.3e-4 that was not physics but a finer mesh.  Taking both from the same evaluated
     * points makes the half a strict SUBSET of the full, so the comparison is exact by construction
     * and costs one grid instead of three. */
    let bF = Infinity, aF = [0, 0], bH = Infinity, aH = [0, 0];
    for (let i = 0; i <= N; i++) {
      const a1 = 2 * i / N;
      for (let j = 0; j <= N; j++) {
        const a2 = j / N, v = V(sp, LATT, a1, a2);
        if (v < bF) { bF = v; aF = [a1, a2]; }
        if (j <= H && v < bH) { bH = v; aH = [a1, a2]; }
      }
    }

    /* Polished from the scan's own best point: no second grid, and no seed worse than the one the
     * scan already found. */
    rows.push({
      rep: c.name, allowed: halfOf(c.name),
      loss: (bH - bF) / Math.max(Math.abs(bF), 1e-12),
      alphaFull: aF, alphaHalf: aH,
    });
  }
  return summariseDomain(rows);
}

/* The summary, apart from the scan, so a sweep run in slices is summarised once over all of them
 * rather than per slice -- a per-slice "no violations" says nothing about the catalogue. */
export function summariseDomain(rows) {
  const allowed = rows.filter((r) => r.allowed), forbidden = rows.filter((r) => !r.allowed);
  const LOSS = 1e-12;
  return {
    rows, tested: rows.length, allowed: allowed.length, forbidden: forbidden.length,
    /* (1) the rule must never license a halving that loses the minimum.  The half's points are a
     * subset of the full's, so a legitimate loss is exactly zero -- not "small". */
    violations: allowed.filter((r) => r.loss > LOSS).map((r) => r.rep),
    worstAllowedLoss: allowed.reduce((a, r) => Math.max(a, Math.abs(r.loss)), 0),
    /* (2) and it must sometimes bite, or it is protecting nothing */
    bites: forbidden.filter((r) => r.loss > LOSS).map((r) => r.rep),
    worstBite: forbidden.reduce((a, r) => Math.max(a, r.loss), 0),
  };
}

export const calculatorModule = (data) => ({
  id: "calculator",
  provides: ["vacuum", "higgs_masses", "mass_ratio", "mixing", "breaks"],
  requires: ["legal_domain"],

  compute({ model, get }) {
    const dom = get("legal_domain");
    const rows = rowsOf(model, data);

    if (rows === null) {
      const why = `the data file for ${data.group} carries no calculator modes, so the ` +
                  `Wilson-line potential of this content cannot be assembled`;
      return { vacuum: unknown(why), higgs_masses: unknown(why), mass_ratio: unknown(why),
               mixing: unknown(why), breaks: unknown(why) };
    }
    if (!rows.length) {
      const why = "no bulk content: there is no potential to minimise";
      return { vacuum: unknown(why), higgs_masses: unknown(why), mass_ratio: unknown(why),
               mixing: unknown(why), breaks: unknown(why) };
    }

    const sp = spectrum(rows, data);
    if (!sp.length) {
      const why = "every coefficient of this content cancels: the potential is flat and has no vacuum";
      return { vacuum: unknown(why), higgs_masses: unknown(why), mass_ratio: unknown(why),
               mixing: unknown(why), breaks: unknown(why) };
    }

    /* THE DOMAIN THE RULE LICENSES IS THE DOMAIN SEARCHED.  This used to minimise over the whole
     * torus and then report `searched: [0, 1/2]` whenever the rule allowed the halving -- the
     * answer was right (the halving is a proved symmetry) but the provenance was a lie, caught by
     * an outside audit.  `a2max` now comes from the domain, so what is reported is what ran. */
    const a2max = dom.value.alpha2[1];
    const m = minimise(sp, lattice(data.kmax), { a2max });
    const breaks = Math.hypot(m.alpha[0], Math.min(m.alpha[1], 1 - m.alpha[1])) > 1e-6;

    return {
      vacuum: val({ alpha: m.alpha, V: m.V, grad: m.grad,
                    /* the domain this was searched over -- the one minimise() actually used */
                    searched: [0, a2max] },
                  { status: STATUS.MEASURED, source: CALC_ANCHOR }),
      higgs_masses: val(m.masses2, { units: "V units", status: STATUS.MEASURED,
                                     source: `${CALC_ANCHOR}; eigenvalues of the curvature at the vacuum` }),
      /* heavier over lighter: no convention enters it, which is why the anchor is stated in it */
      mass_ratio: m.mass_ratio === null
        ? unknown("the lighter eigenvalue is not positive: this is not a minimum")
        : val(m.mass_ratio, { status: STATUS.MEASURED,
                              source: `${CALC_ANCHOR}. An invariant -- no convention enters it` }),
      /* magnitude only: the sign is fixed by the orientation of alpha_2 */
      mixing: val(m.mixing, { status: STATUS.MEASURED,
                              source: "magnitude only; the sign is a convention of alpha_2's orientation" }),
      breaks: val(breaks, { status: STATUS.MEASURED,
                            source: "the vacuum sits away from the symmetric point" }),
    };
  },
});

/* fived.mjs — Haba-Yamashita's 5D SU(3) on S¹/Z₂: the potential their paper leaves unminimised.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The first group of the instrument for readers OUTSIDE this series.  Their eq. (3.20) gives the
 * one-loop Wilson-line potential of the SU(3) -> SU(2) x U(1) model as a four-row (m, s, c) table,
 * linear in six bulk counts -- and their own summary calls analysing the vacuum structure the
 * hard part.  This module locates the vacuum: the same closed form, numeric control and moment
 * arithmetic every other group uses, on their table.  No absolute scale exists here at all --
 * they publish no normalisation -- so everything is in units of 1/R and nothing is a GeV.
 *
 * Statuses:
 *   theorem   the term table (their published counting rule, read from data extracted from the
 *             archived script), the 8D-parity statement, the blind direction
 *   verified  alpha_min against the numeric minimum of the same table, here, every render
 *   measured  nothing: there is no scale to measure anything against
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { moments, alphaMin, curvatureAtMin, numericMin } from "../kernel/potential.mjs";

const SPECIES5D = ["Nap", "Nam", "Nfp", "Nfm", "Nsp", "Nsm"];
const SLOT5D = { "adjoint|1": "Nap", "adjoint|-1": "Nam", "fund|1": "Nfp",
                 "fund|-1": "Nfm", "scalar|1": "Nsp", "scalar|-1": "Nsm" };

export function counts5d(bulk) {
  const out = Object.fromEntries(SPECIES5D.map((s) => [s, 0]));
  for (const b of bulk || []) {
    if (!b.multiplicity) continue;
    const key = SLOT5D[`${b.rep}|${b.parities[0] * b.parities[1]}`];
    if (key === undefined) return null;         /* not a species of this model */
    out[key] += b.multiplicity;
  }
  return out;
}

/* Their eq. (3.20), from the extracted coefficient table: m(row) = base + sum per[sp] N_sp. */
export function terms5d(data, counts) {
  return data.terms5d.map((r) => {
    let m = r.base;
    for (const [sp, dm] of Object.entries(r.per)) m += dm * (counts[sp] || 0);
    return [m, r.s, r.c];
  });
}

/* The tower offsets: a state of charge c in sector s has Kaluza-Klein masses |n + phi| / R with
 * phi = (c alpha - delta)/2, delta = 0 in the periodic sector and 1 in the antiperiodic one --
 * which is nothing but the phases of the table read back: (-1)^n cos(pi n c a) = cos(pi n (c a - 1)). */
export const towerPhi = (c, s, alpha) => (c * alpha - (s < 0 ? 1 : 0)) / 2;

export function spectrum5d(alpha) {
  const towers = [];
  for (const [c, s] of [[2, 1], [1, 1], [2, -1], [1, -1], [0, 1], [0, -1]]) {
    const phi = towerPhi(c, s, alpha);
    const levels = [];
    for (let n = -2; n <= 2; n++) levels.push(Math.abs(n + phi));
    levels.sort((a, b) => a - b);
    towers.push({ c, s, phi, levels: levels.slice(0, 3) });
  }
  return towers;
}

export const fivedModule = (data) => ({
  id: "fived",
  provides: ["hy"],
  requires: [],

  compute({ model }) {
    const counts = counts5d(model.bulk);
    if (counts === null)
      return { hy: unknown("this content holds a representation their eq. (3.20) does not cover") };
    const terms = terms5d(data, counts);
    const mo = moments(terms);
    const D8 = Math.round(8 * mo.D * 2) / 2;
    const alpha = alphaMin(mo);
    const Fpp = alpha === null ? null : curvatureAtMin(mo, alpha);

    /* the control, run here on every render: the closed form against a direct minimisation of
     * the same four-row table -- cheap, because the table is four cosine towers */
    let control = null;
    if (alpha !== null) {
      const num = numericMin(terms, { n: 600, refine: 30, windings: 300 });
      control = num === null ? null : { numeric: num, rel: Math.abs(alpha - num) / num };
    }

    /* THE BLIND DIRECTION, Part V's class in a second model: (Nf, Ns) -> (Nf+1, Ns+2) at either
     * parity leaves the table identically unchanged -- 2 Nf - Ns is all the potential sees. */
    const key = (t) => t.map((r) => r.join(",")).join(";");
    const blind =
      key(terms5d(data, { ...counts, Nfp: counts.Nfp + 1, Nsp: counts.Nsp + 2 })) === key(terms) &&
      key(terms5d(data, { ...counts, Nfm: counts.Nfm + 1, Nsm: counts.Nsm + 2 })) === key(terms);

    return {
      hy: val({
        counts, terms,
        D: mo.D, A4: mo.A4, D8,
        D8_even: Math.abs(D8 % 2) === 0,
        alpha, Fpp, control,
        blind_invariant: blind,
        spectrum: alpha === null ? null : spectrum5d(alpha),
        census: data.census,
      }, {
        status: STATUS.THEOREM,
        source: "Haba-Yamashita eq. (3.20) -- their published counting rule, extracted from the " +
                "archived hy_predictions.py; alpha_min by the closed form of Part VII, " +
                "verified against direct minimisation of the same table on this render; no " +
                "normalisation exists, so every mass is in units of 1/R",
      }),
    };
  },
});

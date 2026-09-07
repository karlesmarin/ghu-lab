/* higgsrate.mjs — the gluon-fusion rate a Kaluza-Klein tower changes, and the bound that follows.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS FILE EXISTS.  The observables register can hold an operator, a channel and a source, but
 * until something in this repository REPRODUCES a published number in that channel, every verdict
 * it emits is `not-computed` and the register is a promise.  This file is the first anchor of the
 * kind: Carson-Okada (arXiv:1510.03092), Table 1, last row.
 *
 * THEIR CHAIN, AND EVERY STEP IS THEIRS.  For a tower of Kaluza-Klein top modes at m_n = n M_KK,
 * the Higgs low-energy theorem gives their eq. (30),
 *
 *     C^KKtop_gg = -(alpha_s/(6 pi v)) sum_{n>=1} (M_t/m_n)^2
 *                = -(alpha_s/(12 pi v)) (pi^2/3) (M_t/M_KK)^2
 *
 * against the Standard Model's C^SMtop_gg = alpha_s/(12 pi v), so their eq. (36) is
 *
 *     R_gg = (1 + C^KK/C^SM)^2 = (1 - (pi^2/3) (M_t/M_KK)^2)^2
 *
 * with NO FREE PARAMETER: alpha_s and v cancel in the ratio and only M_t survives.  The tower is
 * DESTRUCTIVE -- their own remark, citing their ref. [28] -- so only the lower edge of the measured
 * window binds.  With the ATLAS+CMS combination they quote, 0.89 <= R_gg <= 1.19,
 *
 *     M_KK >= 1321.5 GeV
 *
 * against the 1.32 TeV of their Table 1.  That is the whole reproduction, and it is exact.
 *
 * WHAT IT DOES AND DOES NOT LICENSE, because the difference is the point of having it.
 *
 *   IT DOES:  fix that this repository reads their paper correctly, and give the register its first
 *             entry with a resolution that came from a measurement rather than from nowhere.
 *   IT DOES NOT:  validate anything about SU(7), or about the models this instrument is built for.
 *             Their row is derived inside SU(3)xU(1)' with their contents and their boundary
 *             conditions; the top KK tower is the one piece of it that is generic.  Carrying the
 *             number anywhere else is a claim, not a transfer.
 *   AND IT IS STILL NOT AN OVERLAP RESOLUTION.  What the window bounds is a RATE.  Turning it into
 *             a resolution on an overlap matrix goes through a squared amplitude and phase space
 *             and is model-dependent; `observables.mjs` refuses that substitution by construction,
 *             and this file does not smuggle it back in.  The register gains `resolutionOf: "rate"`
 *             and a mass bound, and the coupling verdicts stay `not-computed` -- now for a reason
 *             that has been demonstrated instead of assumed.
 *
 * D3: no gauge group is named here.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

/* Their eq. (36) restricted to the top tower: R_gg as a function of the compactification scale. */
export function rggFromTopTower(mKK, mTop) {
  if (!(mKK > 0)) return null;
  const shift = (Math.PI ** 2 / 3) * (mTop / mKK) ** 2;
  return (1 - shift) ** 2;
}

/* The bound the measured window puts on M_KK.  Only the LOWER edge binds, because the tower is
 * destructive: raising M_KK sends R_gg to 1 from below, so R_gg can never exceed 1 here and the
 * upper edge of the window is never the constraint.  A caller that passes the upper edge instead
 * gets null and the reason, rather than a number from the wrong side. */
export function mkkLowerBound(rggMin, mTop) {
  if (!(rggMin > 0) || !(rggMin < 1)) {
    return { bound: null,
             why: "only the lower edge of the window constrains: the KK tower is destructive, so"
               + " R_gg approaches 1 from below and never exceeds it. A value >= 1 bounds nothing" };
  }
  const x2 = (1 - Math.sqrt(rggMin)) * 3 / Math.PI ** 2;   /* (M_t/M_KK)^2 at the edge */
  return { bound: mTop / Math.sqrt(x2),
           why: "R_gg >= " + rggMin + " with the top KK tower alone, by the Higgs low-energy"
             + " theorem: Carson-Okada arXiv:1510.03092 eqs. (30) and (36), their Table 1" };
}

/* The published row this reproduces, kept beside the arithmetic so a reader can check the claim
 * without leaving the file.  `theirs` is what their Table 1 prints. */
export const CARSON_OKADA_TOP_ROW = {
  paper: "Carson, Okada, arXiv:1510.03092 (PTEP 2018 033B03)",
  where: "Table 1, last row; eqs. (30) and (36); the window from their ref. [4]",
  hypotheses: "SU(3)xU(1)' on flat S^1/Z_2, P = diag(-,-,+); only the top KK modes counted, no"
    + " bulk 6-plet or 10-plet; m_n = n M_KK; M_t^2 << m_n^2",
  rggWindow: [0.89, 1.19],
  mTop: 173.34,
  theirs: { mKK_TeV: 1.32 },
};

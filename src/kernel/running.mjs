/* running.mjs — the three Standard-Model couplings run at one loop from M_Z to a scale μ, so a
 * number the embedding forces at 1/R can be held against the number the data give there.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY.  The Standard-Model cell fixes sin²θ_W at the compactification scale — 3/8 for the
 * Georgi–Glashow direction — and the measured angle is 0.23129 at M_Z.  The two are not to be
 * compared directly: between M_Z and 1/R the couplings run.  With the Standard Model alone the
 * one-loop coefficients are b = (41/10, −19/6, −7) in the GUT normalisation α₁ = (5/3)α_Y, and
 * 1/α_i(μ) = 1/α_i(M_Z) − (b_i/2π) ln(μ/M_Z).  That gives sin²θ_W(μ) = α_Y/(α_Y + α₂) at any μ,
 * and the scale where α₁ = α₂, which for the Standard Model alone is near 10¹³ GeV — the
 * classic statement that the SM couplings do not meet at a few TeV.
 *
 * WHAT IT DOES NOT DO, and the page says so.  Above 1/R the Kaluza–Klein towers change the
 * running to a power law (Dienes–Dudas–Gherghetta, hep-ph/9803466) and brane kinetic terms
 * shift the boundary values; both are model-dependent and neither is included.  So the number
 * this module prints at 1/R is the Standard Model's, and the distance from it to the embedding's
 * 3/8 is the bill the model's KK and brane sectors have to pay — a diagnostic, not a verdict.
 * Two loops and thresholds move the one-loop value by a fraction of a percent at a few TeV,
 * which is below the precision of anything compared to it here.
 *
 * Inputs from `experiment.mjs`: α̂⁽⁵⁾(M_Z)⁻¹ = 127.930, ŝ²_Z = 0.23129, α_s(M_Z) = 0.1187,
 * M_Z = 91.1876 GeV, all PDG 2024 (Erler–Freitas), MS-bar.
 */
import { EXPERIMENT } from "./experiment.mjs";

export const SM_B = [41 / 10, -19 / 6, -7];

export function couplingsAtMZ(exp = EXPERIMENT) {
  const alpha = 1 / exp.alpha_inv_MZ.value, s2 = exp.sin2_MZ_msbar.value;
  const aY = alpha / (1 - s2), a2 = alpha / s2, a3 = exp.alpha_s_MZ.value;
  return { alpha, s2, aY, a1: (5 / 3) * aY, a2, a3 };
}

export function runCouplings(mu, exp = EXPERIMENT) {
  const c = couplingsAtMZ(exp);
  const t = Math.log(mu / exp.m_Z.value) / (2 * Math.PI);
  const inv = [1 / c.a1 - SM_B[0] * t, 1 / c.a2 - SM_B[1] * t, 1 / c.a3 - SM_B[2] * t];
  const a1 = 1 / inv[0], a2 = 1 / inv[1], a3 = 1 / inv[2], aY = (3 / 5) * a1;
  return { mu, a1, a2, a3, aY, sin2: aY / (aY + a2), g2: Math.sqrt(4 * Math.PI * a2),
           g3: Math.sqrt(4 * Math.PI * a3), inv };
}

/* the scale where α₁ = α₂ under Standard-Model running alone */
export function scaleAlpha12(exp = EXPERIMENT) {
  const c = couplingsAtMZ(exp);
  const t = (1 / c.a1 - 1 / c.a2) / (SM_B[0] - SM_B[1]);
  return exp.m_Z.value * Math.exp(2 * Math.PI * t);
}

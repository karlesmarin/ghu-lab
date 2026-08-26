/* collider.mjs — which state a dijet search bounds, and the form factor the whole tower becomes.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part VII §10, live on the model.  Everything below hangs on three published facts: the colour
 * generators commute with the Wilson line (so the gluon tower sits at n/R₅ exactly), the quarks
 * sit at the fixed point (so every mode couples with the same √2·g_s — the bound saturated, not
 * assumed), and colour-changing components vanish there (so the tower is the ONLY coloured state
 * a dijet search sees).  Then the whole tower is one closed-form form factor on the gluon
 * propagator,
 *
 *     F(q²) = πa·coth(πa)  spacelike (a = R₅√(−q²)),   πb·cot(πb)  timelike (b = R₅√(q²)),
 *
 * whose expansion about zero is the contact operator Λ₈, whose spacelike branch is the angular
 * distortion, and whose poles ARE the resonances.  Statuses:
 *   theorem   √2, Γ/M = 2αs(M), the form factor, Λ₈'s coefficient — parities + Euler
 *   measured  every number hung on 1/R₅, which carries the anchor band
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";

/* One-loop running, exactly as collider_dictionary.py runs it -- crude on purpose: the width is
 * a 10%-level statement, and a two-loop αs would be precision the anchor question does not have. */
export function alphasRun(muGeV, { aZ = 0.1180, MZ = 91.1876, nf = 6 } = {}) {
  const b0 = (33 - 2 * nf) / (12 * Math.PI);
  return aZ / (1 + aZ * b0 * 2 * Math.log(muGeV / MZ));
}

/* The dictionary: mass, coupling ratio, width -- Part VII eq. (47)/(coloron). */
export function coloronOf(invR5GeV) {
  const a = alphasRun(invR5GeV);
  return { M_GeV: invR5GeV, alphas: a, GoverM: 2 * a, Gamma_GeV: 2 * a * invR5GeV };
}

/* Λ₈ = √3 / (π √αs) · (1/R₅): the contact-operator scale the tower integrates out to. */
export const lambda8Of = (invR5GeV) =>
  Math.sqrt(3) / (Math.PI * Math.sqrt(alphasRun(invR5GeV))) * invR5GeV;

/* The form factor.  Spacelike: πa·coth(πa), monotone, no width needed and none allowed --
 * below threshold a self-energy has no absorptive part.  Timelike: πb·cot(πb), whose poles at
 * b = 1, 2, 3... ARE the resonances -- not put in by hand. */
export const formFactorSpace = (a) => (a === 0 ? 1 : Math.PI * a / Math.tanh(Math.PI * a));
export const formFactorTime = (b) => (b === 0 ? 1 : Math.PI * b * Math.cos(Math.PI * b) / Math.sin(Math.PI * b));

/* The parton-level ratio to QCD on a t-channel-only subprocess (qq' -> qq', distinct flavours):
 * exactly F(t)², with |t| = M_jj² / (1 + χ) -- a closed form in the two variables the dijet
 * angular measurement is binned in.  No truncation, no width, no BR. */
export function chiRatio(mjjTeV, chi, invR5TeV) {
  const a = Math.sqrt(mjjTeV * mjjTeV / (1 + chi)) / invR5TeV;
  const f = formFactorSpace(a);
  return f * f;
}

export const colliderModule = (data) => ({
  id: "collider",
  provides: ["dijet"],
  requires: ["invR5"],

  compute({ get }) {
    const R = get("invR5");
    if (R.status === "unknown")
      return { dijet: unknown("no electroweak breaking, no 1/R5, and nothing for a collider to " +
                              "bound: " + R.reason) };
    const invR5 = R.value;
    const c = coloronOf(invR5);
    return {
      dijet: val({
        ...c,
        coupling_ratio: Math.SQRT2,
        lambda8_GeV: lambda8Of(invR5),
        eft_coefficient: -(Math.PI ** 2 / 3) / (invR5 / 1000) ** 2,   /* TeV^-2, = -π²R₅²/3 */
        invR5_GeV: invR5,
      }, {
        status: STATUS.MEASURED,
        source: "Part VII §10 on this content's own 1/R5, which carries the anchor band. The √2 " +
                "and Γ/M = 2αs(M) are theorems of the parities (DMN01, Simmons; saturated here " +
                "because the quarks sit exactly at the fixed point); the absolute GeV are not",
      }),
    };
  },
});

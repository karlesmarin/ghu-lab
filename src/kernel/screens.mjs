/* screen.mjs — three screens a reader can run on someone else's published table in a minute.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Nothing here needs the foreign model recomputed.  The three screens, and what each carries:
 *
 *   THE LAWS      k - 2A4 = 3 (mod 6) is the matter lattice's own (Part VII Thm 2, written so
 *                 every entry is an integer on either seed); the PARITY of k = 8D is the seed's.
 *                 Pure integer arithmetic on two numbers a table prints.
 *   K             m_h a_min / sqrt(F''(a_min)) = 2 m_W sqrt(3/(16 pi^6)) g4 for EVERY row of
 *                 EVERY content -- Part VI's open problem 3.  Invariant under F -> lambda F, so
 *                 it tests a row's internal consistency and NOT the normalisation; what it
 *                 returns is the g4 the row implies.
 *   THE COMB      cross identity (II) with the mod-6 law and the Kaluza-Klein scale sits on an
 *                 arithmetic comb: M^2 = (8 pi^2 m_W^2 / 3 zeta(3)) (6 mu + A4)/k, teeth spaced
 *                 DM^2 = 8 pi^2 m_W^2 / (zeta(3) k) at fixed k -- independent of content and of
 *                 m_h.  Necessary, not sufficient: every realisable content lands on a tooth,
 *                 not every tooth holds a content.  Part VII eqs. (46)-(47).
 *
 * The derivatives of F are EXACT, term by term -- each winding term rotates cos -> -sin -> -cos
 * and gains (n c pi)^d, the same series su7_anchor_mh.py sums -- so the K screen here must
 * reproduce that archive to machine precision, and _test_screen.mjs holds it there.
 */

import { Z3, kConst } from "./potential.mjs";

/* d-th derivative of F at alpha, exact term-wise (d = 1 or 2; d = 0 is F itself). */
export function dF(terms, alpha, d = 1, windings = 600) {
  let total = 0;
  for (const [m, s, c] of terms) {
    let sub = 0;
    for (let n = 1; n <= windings; n++) {
      const sign = s > 0 ? 1 : (n % 2 ? -1 : 1);
      const ph = n * c * Math.PI * alpha;
      const f = [Math.cos(ph), -Math.sin(ph), -Math.cos(ph), Math.sin(ph)][d % 4];
      sub += sign * f * (n * c * Math.PI) ** d / n ** 5;
    }
    total += m * sub;
  }
  return total;
}

/* ------------------------------------------------------------------ screen 1: the laws */

/* On two integers a table prints: k = 8D and 2A4 (doubled so the candidate seed's half-integral
 * A4 stays an integer).  The mod-6 law is the content's; the parity of k is the seed's. */
export const screenLaws = (k, A4x2) => ({
  mod6: ((Math.round(k - A4x2 - 3) % 6) + 6) % 6 === 0,
  kOdd: ((Math.round(k) % 2) + 2) % 2 === 1,
  A4integral: ((Math.round(A4x2) % 2) + 2) % 2 === 0,
});

/* ------------------------------------------------------------------ screen 2: K */

export const kOverG4 = (mW) => 2 * mW * Math.sqrt(3 / (16 * Math.PI ** 6));

/* The row's K and the g4 it implies.  F2 <= 0 is its own verdict: the published alpha is not at
 * a minimum of the potential its content generates, and no K exists there. */
export function screenK({ alpha, mh, F2, mW }) {
  if (!(F2 > 0)) return { K: null, implied_g4: null };
  const K = mh * alpha / Math.sqrt(F2);
  return { K, implied_g4: K / kOverG4(mW) };
}

/* ------------------------------------------------------------------ screen 3: the comb */

export const combMu = (mh, mW, g4) => (mh / (kConst(mW, g4) * Math.PI ** 2)) ** 2;
export const combM2 = (A4, k, mu, mW) =>
  (8 * Math.PI ** 2 * mW ** 2 / (3 * Z3)) * (6 * mu + A4) / k;
export const combSpacingM2 = (k, mW) => 8 * Math.PI ** 2 * mW ** 2 / (Z3 * k);

/* The admissible A4 on rung k: k - 2A4 = 3 (mod 6), i.e. A4 = (k-3)/2 + 3j -- integers on the
 * printed seed (k odd), half-integers on the candidate one (k even), steps of three on both. */
export const combA4 = (k, j) => (k - 3) / 2 + 3 * j;

/* Which teeth hold a candidate resonance: for each rung of the right parity, the admissible A4
 * nearest the one identity (II) demands, kept if the tooth lands within the tolerance and the
 * A4 is positive -- a content's fourth moment cannot be otherwise. */
export function combMatch({ MKK, tolGeV, mh, mW, g4, kmax = 45, parity = "odd" }) {
  const mu = combMu(mh, mW, g4);
  const hits = [];
  for (let k = parity === "odd" ? 1 : 2; k <= kmax; k += 2) {
    const need = 3 * Z3 * k * MKK * MKK / (8 * Math.PI ** 2 * mW ** 2) - 6 * mu;
    const j0 = Math.round((need - (k - 3) / 2) / 3);
    for (const j of [j0 - 1, j0, j0 + 1]) {
      const A4 = combA4(k, j);
      if (A4 <= 0) continue;
      const M = Math.sqrt(combM2(A4, k, mu, mW));
      if (Math.abs(M - MKK) <= tolGeV) hits.push({ k, A4, M });
    }
  }
  return hits;
}

/* tripod.mjs — is the group-based model on the tripod a complete intersection?
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part IX-B §5, as a thing you can ask.  The smallest member of the group-based family is the claw
 * tree with three leaves, and one case of it is an orbifold of ours: g = 3 is T^2/Z_3 over SU(N).
 *
 * THE PROPOSITION.  For a finite abelian G the semigroup of the group-based model on the tripod is
 * a complete intersection IF AND ONLY IF |G| <= 3 — free at 2, a complete intersection with two
 * cubics at 3, and not one for Z_4, for Z_2 x Z_2, or for any abelian group of order 5 or more.
 *
 * AND THE ARITHMETIC IS THE PROOF, not a summary of it.  The labels are the triples of group
 * elements summing to zero, so n = |G|^2; the local datum is the indicator of each entry, so
 * dim S = 3(|G|-1) + 1 = 3|G| - 2 and the codimension is (|G|-1)(|G|-2) — which is the number the
 * phylogenetics literature prints.  Every generator is an extreme ray, so the criterion requires
 *
 *     |G|^2 <= 2 dim S - 2 = 6|G| - 6,   that is   f(|G|) = |G|^2 - 6|G| + 6 <= 0,
 *
 * which holds for 2 <= |G| <= 4 and fails from 5 on.  So the bound alone settles every group of
 * order five or more, in one line, for all of them at once and not only the cyclic ones.
 *
 * WHAT THE BOUND DOES NOT SETTLE, and this file does not pretend otherwise: order FOUR passes it
 * and is still not a complete intersection.  Z_4 and Z_2 x Z_2 are decided by exhaustion in §5, and
 * that verdict is READ here rather than recomputed — a bound that is silent is reported as silent.
 *
 * AND THE DISTINCTION THAT GETS MISQUOTED.  Casanellas, Fernandez-Sanchez and Michalek prove these
 * varieties are complete intersections IN A ZARISKI-OPEN SET.  The question here is the global one,
 * about the toric ideal itself, and the Z_4 tripod separates the two: local yes, global no.
 *
 * D3: pure functions, no DOM.
 */

/* f(g) = g^2 - 6g + 6, the criterion's own quantity.  Its sign is the answer for g >= 5 and its
 * being <= 0 is what the bound can say for g <= 4. */
export function tripodBound(g) {
  return g * g - 6 * g + 6;
}

/* The verdict for a finite abelian group of order g.  `decidedBy` is the honest field: "the bound"
 * when the arithmetic settles it, "exhaustion (§5)" when it is read, "free" for the trivial case. */
export function tripodVerdict(g) {
  if (!Number.isInteger(g) || g < 2) {
    return { verdict: "not asked", why: "the tripod is stated for a finite abelian group of order "
      + "at least two" };
  }
  const n = g * g;                       /* labels: triples summing to zero */
  const dim = 3 * g - 2;                 /* 3(g-1) + 1 */
  const codim = (g - 1) * (g - 2);       /* what the phylogenetics literature prints */
  const f = tripodBound(g);
  const base = { order: g, labels: n, dim, codim, bound: f, boundHolds: f <= 0 };

  if (g === 2) {
    return { ...base, complete: true, decidedBy: "free",
      why: "the codimension is zero: the semigroup is free, so there are no relations to be a "
         + "complete intersection of" };
  }
  if (g === 3) {
    return { ...base, complete: true, decidedBy: "the gluing criterion",
      why: "a complete intersection with TWO CUBICS — and this case is an orbifold of ours, "
         + "T^2/Z_3 over SU(N), whose Hilbert numerator is (1-x^3)^2: the same two cubics, by a "
         + "route that never mentions a tripod" };
  }
  if (g === 4) {
    return { ...base, complete: false, decidedBy: "exhaustion (Part IX-B §5)",
      why: "order four PASSES the bound — f(4) = " + f + " is not positive — and is still not a "
         + "complete intersection. Both Z_4 and Z_2 x Z_2 are settled by exhaustion in §5, and "
         + "that verdict is read here rather than recomputed. A bound that is silent is reported "
         + "as silent." };
  }
  return { ...base, complete: false, decidedBy: "the bound",
    why: "f(" + g + ") = " + f + " > 0, so |G|^2 <= 2 dim S - 2 fails and the criterion refuses. "
       + "The argument does not use the group law beyond the labels selecting vertices of a product "
       + "of three simplices, so it holds for EVERY abelian group of this order at once, not just "
       + "the cyclic one" };
}

/* Where the bound turns: the smallest order at which f is positive.  Computed rather than quoted,
 * because "it fails from five on" is a claim with a witness. */
export function tripodThreshold(max = 40) {
  for (let g = 2; g <= max; g++) if (tripodBound(g) > 0) return g;
  return null;
}

/* The local/global distinction, as a sentence a page can print without garbling it. */
export const TRIPOD_LOCAL_GLOBAL =
  "Casanellas, Fernandez-Sanchez and Michalek prove these varieties are complete intersections IN "
  + "A ZARISKI-OPEN SET. The question here is the global one, about the toric ideal itself, and the "
  + "Z_4 tripod separates them: a complete intersection on the open set the phylogenetics "
  + "literature works in, and not one globally. The two statements are both true and they are not "
  + "the same statement.";

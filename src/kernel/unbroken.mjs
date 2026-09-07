/* unbroken.mjs — from a boundary condition to the four-dimensional gauge group it leaves.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE BRIDGE, and it is the step from Part IX-A's mathematics to the thing model builders actually
 * run.  The local datum at a cone is the multiset of eigenvalues of the isotropy element there —
 * which is exactly the projector that decides which components of a field survive.  An adjoint
 * component (i, j) is invariant at a cone when lambda_i lambda_j^{-1} = 1, so it survives in four
 * dimensions when that holds at EVERY cone, which is to say when the two indices carry the same
 * eigenvalue everywhere.
 *
 * The tuple of eigenvalues an index carries across the cones is its PROFILE, and for an alphabet of
 * weight-one letters the profile of an index IS its letter.  So a boundary condition that uses
 * letter l with multiplicity n_l leaves
 *
 *     S( prod_l U(n_l) )
 *
 * unbroken — the product of unitaries, one per letter used, cut to unit determinant.  On S^1/Z_2
 * the four letters are the four sign pairs and the multiplicities are the block sizes, so this is
 * Haba-Hosotani-Kawamura's own statement and Haba-Yamashita eq. (5.1); here it comes out of the
 * alphabet rather than being written down for one orbifold.
 *
 * WHAT IT REFUSES TO DO, and the boundary is sharp.  A letter of weight w > 1 contributes w indices
 * whose eigenvalues at one cone are the multiset in its datum — but WHICH index carries which
 * eigenvalue across DIFFERENT cones is fixed by the induced matrices, not by the data.  The datum
 * gives the marginals and not the joint.  So for a weighted alphabet this file returns the group it
 * can justify and says the rest needs the matrices: that is precisely the non-diagonal sector, which
 * is where Part IX-B says our own contributions sit and where the literature has least.
 *
 * D3: no gauge group is named here.  N and the letters go in; a list of factors comes out.
 */
import { unbrokenWithWeight } from "./rank.mjs";

/* The unbroken group of a boundary condition, given as multiplicities over the letters.
 *
 * Returns { factors, sum, rank, ambient, drop, exact, why }.  `sum` is the DIMENSION N and `rank`
 * is the rank — they are different numbers and the difference is the whole point of this file.
 * `exact` is false when the alphabet has weighted letters in play, and refers to the NAMING of the
 * factors only: the rank is exact either way, from `rank.mjs`. */
export function unbrokenGroup(letters, mult, family = "SU") {
  const used = [];
  let sum = 0, weighted = false;
  for (let i = 0; i < letters.length; i++) {
    const n = mult[i] || 0;
    if (!n) continue;
    const w = letters[i].weight;
    sum += n * w;
    if (w > 1) weighted = true;
    used.push({ letter: i, n, weight: w });
  }
  /* one U(n) per letter used; the determinant condition removes one U(1) overall */
  const factors = used.map((u) => ({ letter: u.letter, n: u.n * u.weight, weight: u.weight }));
  const u1 = Math.max(0, factors.length - 1);
  /* THE RANK IS EXACT EVEN WHEN THE NAME IS NOT, and the two must not be conflated.  Naming the
   * factors of a weighted letter needs the joint distribution of eigenvalues across cones, which
   * the local data do not carry — that is the refusal above and it stands.  But the RANK does not
   * need the joint: it needs the letter's Frobenius-Schur type against the ambient form, which is
   * exact, and that is `rank.mjs`.  So `sum` is the dimension N, `rank` is the rank, and the page
   * must not print one under the other's name. */
  const r = unbrokenWithWeight(family, letters, mult);
  return {
    factors, u1, sum,
    rank: r.rank, ambient: r.ambient, drop: r.drop, suLaw: r.suLaw, rankFactors: r.factors,
    exact: !weighted,
    why: weighted
      ? "some letters here have weight above one. Their indices share a datum at each cone but the"
        + " datum does not say which index carries which eigenvalue ACROSS cones — that is fixed by"
        + " the induced matrices, not by the marginals — so the factors below are what the data"
        + " justify and no more."
      : "every letter has weight one, so an index's profile is its letter and the group is exact.",
  };
}

/* The group written the way a physicist writes it: SU(a) x SU(b) x U(1)^k, with the trivial
 * factors dropped and the U(1) count from the determinant condition. */
/* S(prod U(n_i)) = (prod SU(n_i)) x U(1)^{f-1}, with f the number of factors and SU(1) trivial.
 *
 * The first version added the size-one factors to the U(1) count on top of f - 1, which double
 * counts them: [1,1,1,2] came out U(1)^6 where it is U(1)^3.  Each U(n) carries exactly one U(1),
 * whatever n is, and the determinant condition removes one overall — that is the whole rule.
 * Factors are written largest first, which is how they are read. */
export function unbrokenName(g, family = "SU") {
  /* OUTSIDE SU(N) THE FACTORS ARE NOT SU(n), and writing them so was a false claim on the page:
   * the section already lets a reader choose the orthogonal or symplectic family, and the name
   * came back in unitary letters whatever they chose.  `rank.mjs` says which classical algebra
   * each letter contributes -- so(n), sp(2n) or gl(n) -- so the name can follow it.  There is no
   * determinant U(1) to remove here: SO(N) and Sp(N) are already unimodular. */
  if (family !== "SU" && g.rankFactors) {
    const named = g.rankFactors.map((f) => {
      if (f.algebra === "so") return f.n > 2 ? "SO(" + f.n + ")" : (f.n === 2 ? "U(1)" : null);
      if (f.algebra === "sp") return "Sp(" + f.n + ")";
      return f.n > 1 ? "U(" + f.n + ")" : "U(1)";
    }).filter(Boolean);
    return named.length ? named.join(" x ") : "nothing — the condition leaves no continuous symmetry";
  }
  const parts = g.factors.map((f) => f.n).filter((n) => n > 1)
    .sort((a, b) => b - a).map((n) => "SU(" + n + ")");
  const u1 = Math.max(0, g.factors.length - 1);
  if (!parts.length && !u1) return g.factors.length ? "U(1) only, and the determinant removes it"
                                                    : "nothing — the condition is empty";
  const tail = u1 === 0 ? "" : (u1 === 1 ? "U(1)" : "U(1)^" + u1);
  return [...parts, tail].filter(Boolean).join(" x ");
}

/* Do two letters ever carry the same datum at every cone?  If they did, the "profile is the letter"
 * step above would be false and so would the group.  This is the hypothesis the bridge stands on,
 * so it is checkable rather than assumed. */
export function lettersAreSeparated(letters) {
  const seen = new Map();
  for (let i = 0; i < letters.length; i++) {
    const k = JSON.stringify(letters[i].datum);
    if (seen.has(k)) return { separated: false, clash: [seen.get(k), i] };
    seen.set(k, i);
  }
  return { separated: true, clash: null };
}

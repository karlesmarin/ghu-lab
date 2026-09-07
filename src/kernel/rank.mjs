/* rank.mjs — the unbroken group of a boundary condition when the alphabet has weight, and its rank.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS FOR, AND IT IS A HOLE THIS REPOSITORY ALREADY ADMITTED.  `unbroken.mjs` computes
 * the four-dimensional gauge group from the local data and then stops, in its own words: a letter
 * of weight w > 1 contributes w indices, "the datum gives the marginals and not the joint", so for
 * a weighted alphabet it "returns the group it can justify and says the rest needs the matrices."
 * This file is the rest.  It does not need the matrices at run time -- it needs the one fact the
 * matrices decide, which is each letter's Frobenius-Schur type, and `alphabet.mjs` already
 * computes that exactly.
 *
 * THE STATEMENT.  A boundary condition is a multiset: letter i with multiplicity n_i.  The
 * representation is (+) V_i tensor C^{n_i} and the unbroken group is its commutant inside the
 * gauge algebra.  By Schur that commutant is a product of one classical factor per letter, and
 * WHICH classical factor is decided by the letter's type against the ambient form -- the ambient
 * form factorises as (form on V_i) tensor (form on C^{n_i}), so the multiplicity space carries the
 * opposite symmetry to the letter when the ambient is symmetric and the same when it is
 * antisymmetric:
 *
 *     family   label type      letter            commutant factor    rank
 *     SU       any             V                 gl(n)               n
 *     SO       real            V                 so(n)               floor(n/2)
 *     SO       complex         V + Vbar          gl(n)               n
 *     SO       quaternionic    V + V             sp(2n)              n
 *     Sp       real            V + V             sp(2n)              n
 *     Sp       complex         V + Vbar          gl(n)               n
 *     Sp       quaternionic    V                 so(n)               floor(n/2)
 *
 * and the rank drop is the ambient rank minus the sum of those.
 *
 * WHAT IT COSTS THE SU LAW, and this is the part worth carrying away.  Over SU(N) the drop is
 * sum_i n_i (w_i - 1), so a boundary condition reduces the rank exactly when it uses a letter of
 * weight above one -- the criterion Kawamura, Kodaira, Kojima and Yamashita found by examining
 * cases (arXiv:2211.00877), who state that extending it beyond SU(n)/U(n) is open.  That sentence
 * does NOT survive:
 *
 *   - over SO(N) it fails in BOTH directions.  The floor(n/2) of a real letter drops the rank with
 *     every weight equal to one, and a complex letter of weight two keeps the full rank though the
 *     SU law predicts a drop.  What decides is the Frobenius-Schur type and the PARITY of the
 *     multiplicity, not the weight.
 *   - over Sp(N) it survives verbatim, once weights and N are read in quaternionic units, because
 *     every letter of the T^2/Z_m alphabets is of gl type there.  A negative answer, and a clean
 *     one: nothing new happens in the symplectic sector.
 *
 * Both were measured before they were written: `_test_rank.mjs` builds the induced matrices, solves
 * for the invariant bilinear form, takes the commutant as a null space and its rank as the
 * dimension of the centraliser of a generic element -- a route that knows no representation theory
 * at all -- and holds this file to it on every boundary condition of the four rotations.
 *
 * WHAT THIS FILE DOES NOT ANSWER, and both boundaries are sharp.
 *
 *   - THE DETERMINANT.  A twist must lie in the gauge group, and over the orthogonal family that
 *     is a real alternative rather than a formality: an SO(N) theory admits only twists of
 *     determinant +1, an O(N) one admits both, and they give different answers.  On T^2/Z_2 the
 *     conditions of determinant -1 already drop the rank at N = 2 while those of determinant +1 do
 *     not.  Nothing here asks: it returns the commutant of the boundary condition it is given.  A
 *     caller that means SO(N) rather than O(N) must filter first.
 *   - THE WILSON LINE.  This is the group unbroken by the boundary condition alone, at vanishing
 *     Wilson line -- the same object `unbroken.mjs` and `rank_gate.py` compute.  It is NOT the
 *     physical symmetry after the Hosotani mechanism, which is the commutant of the twists AFTER
 *     the shift by the minimum of the effective potential.  The two agree at <A_z> = 0 and have no
 *     reason to agree away from it.
 *
 * D3: no gauge group is named here.  A family, the letters and the multiplicities go in.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

/* The classical factor a letter contributes, from its Frobenius-Schur type and the family.
 * `type` is alphabet.mjs's FS_NAME: "real", "complex" or "quaternionic". */
export function letterFactor(family, type, n) {
  if (n <= 0) return null;
  if (family === "SU") return { algebra: "gl", n, rank: n };
  const orthogonal = (family === "SO" && type === "real")
    || (family === "Sp" && type === "quaternionic");
  if (orthogonal) return { algebra: "so", n, rank: Math.floor(n / 2) };
  const symplectic = (family === "SO" && type === "quaternionic")
    || (family === "Sp" && type === "real");
  if (symplectic) return { algebra: "sp", n: 2 * n, rank: n };
  return { algebra: "gl", n, rank: n };
}

/* The rank of the ambient gauge algebra.
 *
 * N is counted in the units `realForm` uses: complex dimension over SU(N) and SO(N), quaternionic
 * over Sp(N) -- which is why the symplectic case is N and not N/2.  Getting this wrong is the
 * quiet way to report a drop that is only a change of units. */
export function ambientRank(family, N) {
  if (family === "SU") return Math.max(0, N - 1);
  if (family === "SO") return Math.floor(N / 2);
  return N;
}

/* The unbroken group of one boundary condition, exactly.
 *
 * `letters` is realForm(A, m, family); `mult` the multiplicity of each.  Returns the factors, the
 * rank, the ambient rank and the drop, plus `suLaw` -- what the SU(N) criterion would have said --
 * so a caller can show the two side by side rather than quietly replacing one with the other. */
export function unbrokenWithWeight(family, letters, mult) {
  let N = 0;
  const factors = [];
  for (let i = 0; i < letters.length; i++) {
    const n = mult[i] || 0;
    if (!n) continue;
    N += n * letters[i].weight;
    const f = letterFactor(family, letters[i].type, n);
    factors.push({ letter: i, weight: letters[i].weight, type: letters[i].type, ...f });
  }
  const ambient = ambientRank(family, N);
  /* Over SU(N) the commutant is cut to unit determinant, which removes one U(1) overall -- the
   * same subtraction `unbroken.mjs` makes.  Without it the drop comes out as -1 rather than 0 for
   * every diagonal condition: not a wrong verdict, but a nonsense number, and a negative rank drop
   * is the kind of thing that survives a suite because no check ever looks at it. */
  const cut = family === "SU" && factors.length ? 1 : 0;
  const rank = factors.reduce((s, f) => s + f.rank, 0) - cut;
  const suLaw = letters.reduce((s, L, i) => s + (mult[i] || 0) * (L.weight - 1), 0);
  return {
    N, factors, rank, ambient, drop: ambient - rank, suLaw,
    suLawHolds: ambient - rank === suLaw,
  };
}

/* Does this alphabet admit a rank-reducing boundary condition at all, and the smallest N where one
 * does?  Searched rather than asserted: the SU criterion ("some letter has weight > 1") is not the
 * criterion outside SU, so there is nothing to read off the profile. */
export function admitsRankReduction(family, letters, nmax = 8) {
  const ws = letters.map((L) => L.weight);
  let best = null;
  const walk = (i, rem, acc) => {
    if (best !== null) return;
    if (rem === 0) {
      if (acc.some((c) => c > 0)) {
        const r = unbrokenWithWeight(family, letters, acc);
        if (r.drop > 0) best = { N: r.N, mult: acc.slice(), drop: r.drop };
      }
      return;
    }
    if (i === ws.length) return;
    for (let c = 0; c <= Math.floor(rem / ws[i]); c++) {
      acc.push(c);
      walk(i + 1, rem - c * ws[i], acc);
      acc.pop();
      if (best !== null) return;
    }
  };
  for (let N = 1; N <= nmax && best === null; N++) walk(0, N, []);
  return best;
}

/* alphabet.mjs — the classification of an orbifold boundary condition, from the rotation alone.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part IX-A's claim is that a boundary condition on an orbifold is a representation of the space
 * group Gamma = Lambda x| Z_m; that the alphabet is Irr(Gamma), the weight of a label its
 * dimension; and that the class of a boundary condition is its tuple of local data at the cone
 * points.  If that is right then classifying a NEW orbifold is not a project but a computation
 * whose only inputs are the rotation and the gauge family.  This file is that computation.
 *
 * PORTED from `bc_preflight.py`, which is an ancillary script of the published record
 * (concept DOI 10.5281/zenodo.22254861) and is therefore NOT edited: it stays as the oracle, and
 * `_test_alphabet.mjs` holds this file to the twelve rows it archived.
 *
 * TWO THINGS THE PORT CORRECTS, and they are why it is not a copy.
 *
 *   1. THE ROTATION IS UNIMODULAR, SO NOTHING NEEDS ROUNDING.  A has finite order in GL(r,Z),
 *      hence det A = +-1 and A^{-1} is an INTEGER matrix.  The original pushes rho's action on a
 *      character through floating point and rounds it back onto a magic denominator of 2520.
 *      Here `act` is integer arithmetic and there is no denominator to guess.
 *
 *   2. THE LOCAL DATUM IS EXACT.  T(t)R^{m/e} is a MONOMIAL matrix — a permutation times a
 *      diagonal of roots of unity — so its eigenvalues are the L-th roots of each cycle's product
 *      and are roots of unity with a known denominator.  The original calls a numerical
 *      eigensolver and rounds `angle(z)/2pi` into a bucket.  Computing the cycles instead buys a
 *      CONTROL the numerical route cannot have: M^e = I, so every eigenvalue angle times e must be
 *      an INTEGER, and a non-integer is a fault rather than a rounding to absorb.  It throws.
 *
 * AND IT IS RANK-GENERAL, which the original is not: `bc_preflight` writes its two components by
 * hand (`M[0][0]*x[0] + M[0][1]*x[1]`), so it only ever sees Lambda = Z^2.  Rank decides the
 * audience — 1 is five-dimensional gauge-Higgs unification, 2 is the six-dimensional models this
 * series is about, 6 is heterotic orbifolds — so nothing here is allowed to know r.
 *
 * D3: the kernel knows lattices, not groups.  SU / SO / Sp enter as a three-valued datum used only
 * by the Frobenius-Schur bookkeeping at the end; no gauge group is named in this file.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

/* ------------------------------------------------------------------ integer linear algebra
 * Everything is exact.  The matrices are small — r is 1, 2 or 6 in practice and the crystallo-
 * graphic restriction bounds it — so cofactor expansion is the right determinant, not Bareiss. */

export function idMatrix(r) {
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: r }, (_, j) => (i === j ? 1 : 0)));
}

export function matMul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  const out = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
      out[i][j] = s;
    }
  return out;
}

export function matPow(A, k) {
  let out = idMatrix(A.length), base = A, e = k;
  while (e > 0) {
    if (e & 1) out = matMul(out, base);
    base = matMul(base, base);
    e >>= 1;
  }
  return out;
}

export function matSub(A, B) {
  return A.map((row, i) => row.map((x, j) => x - B[i][j]));
}

export function transpose(A) {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

export function det(A) {
  const n = A.length;
  if (n === 0) return 1;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  let s = 0;
  for (let j = 0; j < n; j++) {
    if (A[0][j] === 0) continue;
    const minor = A.slice(1).map((row) => row.filter((_, c) => c !== j));
    s += (j % 2 ? -1 : 1) * A[0][j] * det(minor);
  }
  return s;
}

/* adj(M) = det(M) M^{-1}, integral whenever M is.  It is what lets the fixed points of a rotation
 * be enumerated without ever forming M^{-1} in floating point. */
export function adjugate(M) {
  const n = M.length;
  if (n === 1) return [[1]];
  const out = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const minor = M.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
      out[j][i] = ((i + j) % 2 ? -1 : 1) * det(minor);      /* transposed: the adjugate */
    }
  return out;
}

export function matVec(A, v) {
  return A.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
}

/* ------------------------------------------------------------------ the order, and the refusal */

/* The order of A in GL(r,Z), or null if it has none.  A matrix of infinite order is REFUSED rather
 * than classified: that is the crystallographic restriction showing up as a property of the input,
 * and it is the decoy `bc_preflight` carries (a matrix of order 5, which no rank-2 lattice admits,
 * must come back rejected).  The bound is generous and finite because a finite-order element of
 * GL(r,Z) has order m with phi(m) <= r, so m never exceeds a small multiple of r. */
export function orderOf(A, bound = 5040) {
  const r = A.length, I = idMatrix(r);
  if (Math.abs(det(A)) !== 1) return null;                  /* not even invertible over Z */
  let M = A.map((row) => row.slice());
  for (let k = 1; k <= bound; k++) {
    if (M.every((row, i) => row.every((x, j) => x === I[i][j]))) return k;
    M = matMul(M, A);
  }
  return null;
}

/* ------------------------------------------------------------------ rationals mod 1
 * A character of Lambda is a vector of rationals mod 1.  Held as integer numerators over one
 * common denominator, so equality is exact and hashable and no float ever appears. */

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function lcm(a, b) { return a / gcd(a, b) * b; }

/* {num: int[], den: int}, each numerator reduced into [0, den). */
function mod1(num, den) {
  const g = num.reduce((acc, x) => gcd(acc, x), den);
  const d = den / g;
  return { num: num.map((x) => ((x / g) % d + d) % d), den: d };
}

function keyOf(v) { return v.den + ":" + v.num.join(","); }

function sameChar(a, b) { return keyOf(a) === keyOf(b); }

/* ------------------------------------------------------------------ the cone points */

/* A point x of the torus is fixed by rho^j when (A^j - I)x is integral, so the fixed points of
 * rho^j are (A^j - I)^{-1} Z^r / Z^r, a finite group of order |det(A^j - I)|, enumerated here as
 * adj(M)w/det for w over one period.  The CONE POINTS are the rho-orbits of the points with
 * non-trivial stabiliser, and the order of a cone point is the order of that stabiliser.
 *
 * Returns [{order, t, x}] sorted by decreasing order: `order` is the cone's order e, `t` the
 * isotropy translation with the isotropy element (t, rho^{m/e}), and `x` the point itself.
 * The multiset of orders is the CONE SIGNATURE, and it is derived here, never supplied. */
export function conePoints(A, m) {
  const r = A.length, I = idMatrix(r);
  const pts = new Map();

  for (let j = 1; j < m; j++) {
    const M = matSub(matPow(A, j), I);
    const D = det(M);
    if (D === 0) continue;                                   /* rho^j fixes a whole subtorus */
    const adj = adjugate(M), aD = Math.abs(D);
    /* w runs over one period of Z^r / |D| Z^r; adj(M)w/D is then every fixed point of rho^j. */
    const idx = new Array(r).fill(0);
    for (let c = 0; c < Math.pow(aD, r); c++) {
      let n = c;
      for (let i = 0; i < r; i++) { idx[i] = n % aD; n = Math.floor(n / aD); }
      const w = matVec(adj, idx);
      const v = mod1(w, D);
      pts.set(keyOf(v), v);
    }
  }

  const seen = new Set(), out = [];
  for (const x of [...pts.values()].sort((a, b) => keyOf(a) < keyOf(b) ? -1 : 1)) {
    if (seen.has(keyOf(x))) continue;
    let y = x;
    for (let i = 0; i < m; i++) { seen.add(keyOf(y)); y = actPoint(A, y); }

    /* the stabiliser, as the set of j with (A^j - I)x integral */
    let d = 0;
    for (let j = 0; j < m; j++) {
      const M = matSub(matPow(A, j), I);
      const num = matVec(M, x.num);
      if (num.every((z) => z % x.den === 0)) d++;
    }
    if (d <= 1) continue;                                    /* not a cone point */

    const k = m / d;
    const Mt = matSub(I, matPow(A, k));
    const tnum = matVec(Mt, x.num);
    if (!tnum.every((z) => z % x.den === 0)) throw new Error("isotropy translation not integral");
    out.push({ order: d, t: tnum.map((z) => z / x.den), x });
  }
  return out.sort((a, b) => b.order - a.order);
}

/* rho on a POINT of the torus: x -> A x.  (On a character it is the inverse transpose; the two are
 * different actions and confusing them is the standard way to get a mirror image of the answer.) */
function actPoint(A, x) {
  return mod1(matVec(A, x.num), x.den);
}

export function coneSignature(A, m) {
  return conePoints(A, m).map((c) => c.order);
}

/* ------------------------------------------------------------------ the characters */

/* Every chi_v fixed by some non-trivial rho^k, as rationals mod 1.  chi_v is fixed by rho^k
 * exactly when (A^k - I)^T v is integral, so the same enumeration as the cone points runs on the
 * transpose. */
export function characters(A, m) {
  const r = A.length, I = idMatrix(r);
  const found = new Map();
  for (let k = 1; k < m; k++) {
    const M = transpose(matSub(matPow(A, k), I));
    const D = det(M);
    if (D === 0) continue;
    const adj = adjugate(M), aD = Math.abs(D);
    const idx = new Array(r).fill(0);
    for (let c = 0; c < Math.pow(aD, r); c++) {
      let n = c;
      for (let i = 0; i < r; i++) { idx[i] = n % aD; n = Math.floor(n / aD); }
      const v = mod1(matVec(adj, idx), D);
      found.set(keyOf(v), v);
    }
  }
  return [...found.values()].sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : 1));
}

/* rho on a CHARACTER: v -> (A^T)^{-1} v, so that chi_{rho v}(A t) = chi_v(t).
 * A is unimodular, so (A^T)^{-1} = det(A^T) adj(A^T) is an integer matrix and this is exact. */
export function actChar(A, v) {
  const At = transpose(A);
  const D = det(At);                                        /* +-1 */
  const inv = adjugate(At).map((row) => row.map((x) => x * D));   /* since 1/D = D for D = +-1 */
  return mod1(matVec(inv, v.num), v.den);
}

/* ------------------------------------------------------------------ the alphabet
 *
 * Clifford theory over the orbit of a character.  If the rho-orbit of v has size s then its
 * stabiliser has order d = m/s, and the orbit carries exactly d irreducibles of Gamma, each of
 * dimension s, one per d-th root of unity eps.  On the basis e_0..e_{s-1} indexed by the orbit,
 *
 *     T(t) = diag( chi_{v_i}(t) ),      R : e_i -> e_{i+1},   e_{s-1} -> eps e_0.
 *
 * The WEIGHT of a label is s, its dimension.  Weight above one is precisely a boundary condition
 * that is not diagonal, which is why the weighted sector is the one the physics needs. */
export function alphabet(A, m) {
  const chars = characters(A, m), seen = new Set(), labels = [];
  for (const v of chars) {
    if (seen.has(keyOf(v))) continue;
    const orbit = [];
    let w = v;
    for (let i = 0; i < m; i++) {
      orbit.push(w);
      w = actChar(A, w);
      if (sameChar(w, v)) break;
    }
    for (const u of orbit) seen.add(keyOf(u));
    const s = orbit.length, d = m / s;
    for (let j = 0; j < d; j++) labels.push({ weight: s, orbit, epsNum: j, epsDen: d });
  }
  return labels;
}

/* The alphabet as the paper writes it: (multiplicity)x(weight), e.g. "6x1+3x2+2x3". */
export function alphabetShape(labels) {
  const by = new Map();
  for (const L of labels) by.set(L.weight, (by.get(L.weight) || 0) + 1);
  return [...by.entries()].sort((a, b) => a[0] - b[0])
    .map(([w, n]) => n + "x" + w).join("+");
}

/* ------------------------------------------------------------------ the local datum, exactly
 *
 * At a cone point of order e with isotropy (t, rho^{m/e}), the local datum of a label is the
 * multiset of eigenvalues of M = T(t) R^{p}, p = m/e.  M is MONOMIAL: R^p sends e_i to e_{i+p},
 * carrying a factor eps for each wrap, and T(t) scales e_i by chi_{v_i}(t).  So the eigenvalues
 * are, cycle by cycle of the shift-by-p permutation, the L-th roots of that cycle's product.
 * Everything is a root of unity and the whole computation is arithmetic on exponents mod 1.
 *
 * Returns the multiplicity vector over the e-th roots of unity, which is the datum the equivalence
 * must preserve: A PROPOSED RELATION THAT MOVES ONE IS WRONG. */
export function localDatum(label, m, cone) {
  const { weight: s, orbit, epsNum, epsDen } = label;
  const e = cone.order, p = m / e, t = cone.t;

  /* exponents as fractions n/Q mod 1 */
  const Q0 = orbit.reduce((acc, v) => lcm(acc, v.den), 1);
  const Q = lcm(Q0, epsDen);

  /* the diagonal: chi_{v_i}(t) has exponent v_i . t */
  const diag = orbit.map((v) => {
    const dot = v.num.reduce((sc, x, j) => sc + x * t[j], 0);      /* over v.den */
    return ((dot * (Q / v.den)) % Q + Q) % Q;
  });
  const epsExp = ((epsNum * (Q / epsDen)) % Q + Q) % Q;

  /* R^p: e_i -> e_{(i+p) mod s}, with one factor of eps for each time the index wraps past s-1 */
  const mult = new Array(e).fill(0);
  const visited = new Array(s).fill(false);
  for (let start = 0; start < s; start++) {
    if (visited[start]) continue;
    let i = start, L = 0, sum = 0;
    do {
      visited[i] = true;
      const j = (i + p) % s;
      sum = (sum + diag[j] + (i + p >= s ? epsExp * Math.floor((i + p) / s) : 0)) % Q;
      i = j; L++;
    } while (i !== start);
    /* the L-th roots of a number of exponent sum/Q: exponents (sum + kQ)/(LQ), k = 0..L-1 */
    for (let k = 0; k < L; k++) {
      const numer = sum + k * Q;                              /* over L*Q */
      /* M^e = I, so every eigenvalue is an e-th root of unity: numer*e/(L*Q) MUST be an integer. */
      const scaled = numer * e;
      if (scaled % (L * Q) !== 0) {
        throw new Error("eigenvalue is not an e-th root of unity: the label or the cone is wrong");
      }
      mult[((scaled / (L * Q)) % e + e) % e]++;
    }
  }
  return mult;
}

/* ------------------------------------------------------------------ the real form
 *
 * D3 keeps the gauge group out of the kernel: the family enters as one of three words and is used
 * only for the Frobenius-Schur bookkeeping that decides which labels survive and with what weight.
 *   SU  complex   — every label survives at its own weight
 *   SO  real      — a real label keeps its weight, a complex one pairs with its conjugate
 *   Sp  quaternionic — the mirror bookkeeping
 * The type of a label is read off its orbit: it is real when the orbit is closed under v -> -v. */
export function labelType(label) {
  const { orbit } = label;
  const neg = (v) => mod1(v.num.map((x) => -x), v.den);
  const inOrbit = (u) => orbit.some((v) => sameChar(v, u));
  return inOrbit(neg(orbit[0])) ? "real-or-quaternionic" : "complex";
}

/* ------------------------------------------------------------------ the degree
 *
 * The degree of the class count in the rank is predicted from the SIGNATURE and the family alone:
 *
 *     e_1 = 1 + sum_i c(m_i),     c(m) = m - 1 over SU(N),  floor(m/2) over SO(N) and Sp(N),
 *     degree = e_1 - 1.
 *
 * A PROPOSED COUNT OF THE WRONG DEGREE IS MISSING LABELS — one of the two checks §8 says cost
 * seconds and do not need the classification to be finished.
 *
 * Written wrong twice on the first pass: returning e_1 rather than e_1 - 1, and ignoring the
 * family altogether.  The harness did not catch either, because its expected degrees had been
 * filled in by applying this same function — a control whose reference comes from the thing it
 * checks cannot fail.  They now come from the archived bc_preflight run and nowhere else. */
export function predictedDegree(signature, family = "SU") {
  const c = family === "SU" ? (m) => m - 1 : (m) => Math.floor(m / 2);
  return signature.reduce((s, e) => s + c(e), 0);            /* = (1 + sum c) - 1 */
}

/* The degree measured from a count, as the limit of the local logarithmic slope.  Used as the
 * control on `predictedDegree` rather than as a substitute for it. */
export function measuredDegree(counts, step = 12) {
  const n = counts.length - 1;
  if (n < 2 * step) return null;
  const a = counts[n], b = counts[n - step];
  return Math.log(a / b) / Math.log(n / (n - step));
}

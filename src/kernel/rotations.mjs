/* rotations.mjs — which orbifolds exist at all in a given rank, and how many of each.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The question a model builder asks before choosing anything: in rank r, what are my options?  It
 * has an exact answer, it is arithmetic rather than geometric, and §9 of Part IX-A sets out that
 * none of it is ours — it is Latimer–MacDuffee (1933), Diederichsen–Reiner, Charlap (1965),
 * Montgomery–Uchida (1971) and Hiller (1985), and between them the question is closed.
 *
 * TWO RESTRICTIONS, AND THEY ARE NOT THE SAME ONE.
 *
 *   phi(m) | r   is the paper's HYPOTHESIS: the characteristic polynomial is Phi_m^s, so the
 *                lattice is a module of rank s = r/phi(m) over Z[zeta_m].
 *   Phi(m) <= r  is HILLER's general crystallographic restriction, with Phi the ADDITIVE totient,
 *                which is what bounds the order of any finite-order element of GL(r,Z).
 *
 * The gap between them is real and worth showing: in rank 3, Hiller allows orders 1, 2, 3, 4 and 6
 * — a rotation of order 3 does exist in GL(3,Z) — but under the paper's hypothesis only 1 and 2
 * survive, because a rank-3 lattice is not a module over Z[zeta_3].  Which is a large part of why
 * gauge-Higgs unification lives at rank 2 and heterotic orbifolds at rank 6.
 *
 * AND HOW MANY ROTATIONS PER (m, r): the number of ideal classes h(Q(zeta_m)), by Latimer and
 * MacDuffee for s = 1 and Steinitz above it — and h = 1 for every m within reach, so BELOW RANK 22
 * THERE IS EXACTLY ONE.  The first place anything happens is m = 23, r = 22, where h = 3 and
 * complex conjugation acts by inversion, leaving two Galois orbits: three rotations, two orbifolds.
 * That is why this file can GENERATE the rotation instead of consulting a table.
 *
 * D3: pure functions, no DOM.
 */
import { idMatrix } from "./alphabet.mjs";

export function eulerPhi(m) {
  let n = m, r = m;
  for (let p = 2; p * p <= n; p++) {
    if (n % p) continue;
    while (n % p === 0) n /= p;
    r -= r / p;
  }
  if (n > 1) r -= r / n;
  return r;
}

/* Hiller's ADDITIVE totient: sum over prime powers p^k || m of (p^k - p^{k-1}), with the 2^1 term
 * dropped because -I costs no dimension.  It is not phi: Phi(12) = 2 + 2 = 4 while phi(12) = 4 too,
 * but Phi(6) = 2 where phi(6) = 2, and they separate at composite orders with many prime factors. */
export function additiveTotient(m) {
  if (m <= 2) return 0;
  let n = m, s = 0;
  for (let p = 2; p * p <= n; p++) {
    if (n % p) continue;
    let q = 1;
    while (n % p === 0) { n /= p; q *= p; }
    if (!(p === 2 && q === 2)) s += q - q / p;
  }
  if (n > 1) s += n - 1;
  return s;
}

/* The m-th cyclotomic polynomial, low coefficient first, by dividing x^m - 1 by the lower ones.
 * Integer arithmetic throughout: the quotient of monic integer polynomials is integral. */
export function cyclotomic(m) {
  let num = new Array(m + 1).fill(0);
  num[0] = -1; num[m] = 1;                                   /* x^m - 1 */
  for (let d = 1; d < m; d++) {
    if (m % d) continue;
    num = polyDiv(num, cyclotomic(d));
  }
  return num;
}

function polyDiv(a, b) {
  const q = new Array(Math.max(1, a.length - b.length + 1)).fill(0);
  const r = a.slice();
  for (let i = a.length - b.length; i >= 0; i--) {
    const c = r[i + b.length - 1] / b[b.length - 1];
    q[i] = c;
    for (let j = 0; j < b.length; j++) r[i + j] -= c * b[j];
  }
  return q;
}

/* The rotation of order m on a lattice of rank s*phi(m): the companion matrix of Phi_m, s times.
 * Below rank 22 this is not A choice of rotation, it is THE one. */
export function rotationOfOrder(m, s = 1) {
  const c = cyclotomic(m), d = c.length - 1;
  const C = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 1; i < d; i++) C[i][i - 1] = 1;
  for (let i = 0; i < d; i++) C[i][d - 1] = -c[i];
  const r = d * s, A = idMatrix(r).map((row) => row.map(() => 0));
  for (let b = 0; b < s; b++)
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) A[b * d + i][b * d + j] = C[i][j];
  return A;
}

/* Every orbifold of rank r under the paper's hypothesis, with the rotation generated.
 * `hillerOnly` lists the orders Hiller's restriction allows but the hypothesis does not — the gap
 * between "a rotation of this order exists in GL(r,Z)" and "this lattice is a Z[zeta_m]-module". */
export function orbifoldsOfRank(r, mmax = 200) {
  const under = [], hillerOnly = [];
  for (let m = 1; m <= mmax; m++) {
    const ph = eulerPhi(m), Ph = additiveTotient(m);
    const byHypothesis = m === 1 ? true : r % ph === 0;
    const byHiller = Ph <= r;
    if (byHypothesis && byHiller) {
      under.push({ m, phi: ph, s: m === 1 ? r : r / ph,
                   rotation: m === 1 ? idMatrix(r) : rotationOfOrder(m, r / ph) });
    } else if (byHiller && m > 2) hillerOnly.push({ m, phi: ph, Phi: Ph });
  }
  return { rank: r, under, hillerOnly };
}

/* How many rotations, and how many ORBIFOLDS, for a given m — the two differ and the difference is
 * Charlap's.  Below the threshold the answer is one and one; this states the threshold rather than
 * computing a class number, because computing one here would be a different paper. */
export function howManyRotations(m) {
  if (m < 23) {
    return { rotations: 1, orbifolds: 1, why: "h(Q(zeta_m)) = 1 for every m below 23, so the "
      + "rotation of order m on a lattice of rank s*phi(m) is unique up to conjugacy in GL(r,Z)" };
  }
  if (m === 23) {
    return { rotations: 3, orbifolds: 2, why: "the first place anything happens: h = 3, and since "
      + "h+ = 1 the class group is its own minus part, so complex conjugation inverts and the "
      + "Galois orbits are {1} and {[a],[a]^-1} — three rotations, two orbifolds" };
  }
  return { rotations: null, orbifolds: null, why: "above m = 23 the count is h(Q(zeta_m)) and the "
    + "number of orbifolds is its Galois orbits; this page does not compute class numbers" };
}

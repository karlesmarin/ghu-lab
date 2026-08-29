/* census.mjs — how many contents a rung holds, COUNTED and not enumerated.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHERE THE QUESTION COMES FROM.  Part VIII's Observation 1 says a rung is a FINITE set — of the
 * eight generators only 7(+,+) has A_4 = 0, so at fixed A_4 the other seven are bounded by A_4
 * and the multiplicity of 7(+,+) is then pinned by 8D.  That finitude is what turns "no content
 * here" into a decision.  The obvious next question is HOW finite, and Part VII had already
 * written it down in its list of what it left open: the multiplet lattice with its congruence is
 * a rational cone cut by an affine sublattice, so the count at fixed (A_4, 8D) is a VECTOR
 * PARTITION FUNCTION — machinery that paper used only in its polyhedral half.  This is the other
 * half.
 *
 * WHY IT BELONGS IN A BROWSER.  A dynamic programme over the two partial moments gives N(A_4, 8D)
 * for every A_4 at once, in well under a second.  The enumerator that built the same contents one
 * by one took about twenty-five minutes and ran out of budget below 5 TeV.  Counting costs a sum;
 * constructing does not.  So the census is the one Part VIII computation that fits whole inside
 * the page, and this file is it — no archived curve is drawn, the archive is only what the
 * harness holds the curve to.
 *
 * AND IT IS THE ENUMERATOR'S STRONGEST FALSIFICATION.  Two algorithms that share nothing agree on
 * 69 022 464 contents across four rungs.  The instrument recomputes one of the two.
 *
 * WHAT IS NOT CLAIMED.  A vector partition function is a piecewise quasi-polynomial, and saying so
 * here would be free and would be a promise.  The period comes from the 2x2 determinants of the
 * generators and is large; on the 77 legal A_4 of rung one there is no room to measure it.  It is
 * TESTED here, with exact integer finite differences, and the negative is printed.
 */

import { coordinates, alphaMin, higgsMass, invR5 } from "../kernel/potential.mjs";

/* ------------------------------------------------------------------ the table */

/* dp[a][s] = the number of ways the SEVEN bounded generators sum to (A_4, 8D) = (a, s), offsets
 * measured from the gauge seed.  Built once; after that N is a strided sum and not a search.
 *
 * A_4 units, not the doubled ones the designer uses: every generator's A_4 is an integer on both
 * gauge seeds and only the base point can be half-integral, so the OFFSET a is an integer either
 * way and the table is the same table. */
export function buildCensus(L, { tMax = 560 } = {}) {
  const t0 = (typeof performance !== "undefined" ? performance : Date).now();
  const a = L.t2.map((v) => v / 2), k = L.k8D;
  const bounded = L.bounded;
  const slope = Math.max(...bounded.map((j) => k[j] / a[j]));
  const sMax = Math.floor(slope * tMax) + 1;
  const dp = new Float64Array((tMax + 1) * sMax);
  dp[0] = 1;
  for (const j of bounded) {
    const aj = a[j], kj = k[j];
    for (let t = aj; t <= tMax; t++) {
      const row = t * sMax, prev = (t - aj) * sMax;
      for (let s = 0; s < sMax - kj; s++) {
        const v = dp[prev + s];
        if (v) dp[row + s + kj] += v;
      }
    }
  }
  const ms = (typeof performance !== "undefined" ? performance : Date).now() - t0;
  return { L, tMax, sMax, dp, ms, a, k, step: L.step, slope,
           baseA4: L.base.t2 / 2, base8D: L.base.k8D };
}

/* the count at one lattice point, or null if it lies past the table.  The free generator is
 * pinned: its multiplicity is (s - Q) / step, so only the s at or above Q and congruent to it
 * mod step contribute. */
export function censusAt(C, A4, k8D) {
  const T = Math.round(A4 - C.baseA4), Q = k8D - C.base8D;
  if (T < 0 || T > C.tMax) return null;
  const row = T * C.sMax;
  let n = 0;
  for (let s = Math.max(Q, 0); s < C.sMax; s++) if ((s - Q) % C.step === 0) n += C.dp[row + s];
  return n;
}

/* the raw table cell: contents that use NO free generator.  It is what the recurrence below is
 * about, so it gets a name rather than an index into someone else's array. */
export function censusCell(C, A4, k8D) {
  const T = Math.round(A4 - C.baseA4), Q = k8D - C.base8D;
  if (T < 0 || T > C.tMax || Q < 0 || Q >= C.sMax) return 0;
  return C.dp[T * C.sMax + Q];
}

/* the congruence and the cone, in A_4 units — the two things that decide whether a point is even
 * a lattice point of this model */
export const censusLegal = (C, A4, k8D) =>
  (((k8D - 2 * A4 - 3) % 6) + 6) % 6 === 0 && A4 >= C.baseA4 &&
  (k8D - C.base8D) <= 8 * (A4 - C.baseA4);

/* the whole counting function along one rung, up to its ceiling's A_4 */
export function censusCurve(C, k8D, A4cap) {
  const A4 = [], N = [];
  for (let t = Math.ceil(C.baseA4); t <= A4cap; t++) {
    if (!censusLegal(C, t, k8D)) continue;
    const n = censusAt(C, t, k8D);
    if (n === null) break;
    A4.push(t); N.push(n);
  }
  return { A4, N, total: N.reduce((x, y) => x + y, 0),
           first: A4[N.findIndex((v) => v > 0)] ?? null };
}

/* ------------------------------------------------------------------ the recurrence */

/* THE COUNTING FUNCTION ALMOST DOES NOT DEPEND ON 8D, AND THAT IS AN IDENTITY, NOT A COINCIDENCE.
 * A content at (A_4, 8D) is a pair (n_free, m) with m using only the seven bounded generators and
 * n_free = (s - Q)/step >= 0.  Raising 8D by `step` raises Q by `step`, and n_free -> n_free + 1
 * is a bijection from the contents of (A_4, 8D + step) onto those of (A_4, 8D) with n_free >= 1.
 * So the difference is exactly the count with n_free = 0, which is the table cell:
 *
 *     N(A_4, 8D + step)  =  N(A_4, 8D)  -  P(A_4 - A_4_gauge, 8D - 8D_gauge)
 *
 * Checked over the grid, not asserted.  Its consequence for the paper is that the high rungs do
 * not hold more contents for being high: they hold more because their A_4 ceiling is higher. */
export function recurrenceCheck(C, { tSpan = 320, kMax = 60 } = {}) {
  let tested = 0, failures = 0, worst = 0;
  const bad = [];
  for (let t = Math.ceil(C.baseA4); t < C.baseA4 + tSpan; t++) {
    for (let k = C.base8D; k < kMax; k++) {
      if ((((k - 2 * t - 3) % 6) + 6) % 6) continue;
      const lo = censusAt(C, t, k), hi = censusAt(C, t, k + C.step);
      if (lo === null || hi === null) continue;
      tested++;
      const d = Math.abs(hi - (lo - censusCell(C, t, k)));
      if (d > worst) worst = d;
      if (d !== 0) { failures++; if (bad.length < 3) bad.push({ A4: t, k8D: k, lo, hi }); }
    }
  }
  return { tested, failures, worst, bad, step: C.step };
}

/* ------------------------------------------------------------------ the fibre */

/* WHAT SITS AT ONE POINT, READ WITH PART VII's COMPLETENESS THEOREM.  The paper says that at the
 * measured Higgs mass 81 contents remain and that they occupy a single (A_4, G) — three
 * coordinates.  Part VII proves something stronger: two contents have the SAME one-loop potential,
 * identically in the phase, iff they agree on all FIVE (A_4, 8D, 2U, V, 2W).  So the question is
 * not whether the 81 predict the same thing but whether they ARE the same thing, and the five
 * coordinates are integers, so it is decided exactly rather than compared in floating point.
 *
 * The contents are grouped by (2U, V) — A_4 and 8D are fixed by the rung — and each class reports
 * how many distinct 2W it contains.  A class with one 2W is one potential built many ways.  It is
 * NOT automatic, which is what makes it worth measuring: other classes on the same rung split. */
export function fibreAt(L, A4, k8D, enumerate, conv = null) {
  const cvec = L.slots.map((s) => coordinates(s.table));
  const classes = new Map();
  let n = 0, gSpread = 0;
  enumerate((mult, G) => {
    n++;
    let U2 = L.baseCoord.U2, V = L.baseCoord.V, W2 = L.baseCoord.W2;
    for (let j = 0; j < mult.length; j++) {
      if (!mult[j]) continue;
      U2 += mult[j] * cvec[j].U2; V += mult[j] * cvec[j].V; W2 += mult[j] * cvec[j].W2;
    }
    const key = `${U2}|${V}`;
    let cl = classes.get(key);
    if (!cl) { cl = { U2, V, G, W2s: new Map(), n: 0, sizeMin: Infinity, sizeMax: 0,
                      smallest: null, largest: null }; classes.set(key, cl); }
    cl.n++;
    /* G IS A FUNCTION OF THE CLASS, and that is a check rather than an assumption: at fixed A_4,
     * G = (25/12) A_4 - U ln2 - V ln3, so two contents with the same (2U, V) must have the same G
     * to the last bit.  If they ever did not, the coordinates would not be the coordinates. */
    gSpread = Math.max(gSpread, Math.abs(G - cl.G));
    cl.W2s.set(W2, (cl.W2s.get(W2) || 0) + 1);
    const size = mult.reduce((x, y) => x + y, 0);
    if (size < cl.sizeMin) { cl.sizeMin = size; cl.smallest = mult.slice(); }
    if (size > cl.sizeMax) { cl.sizeMax = size; cl.largest = mult.slice(); }
    return false;
  });
  const out = [...classes.values()].map((c) => {
    /* one class is one potential, so it has ONE alpha, ONE Higgs mass and ONE scale.  That is
     * what lets the panel pick the class at the measured mass instead of the biggest one -- the
     * two are different classes on this rung, and picking by size gets the wrong one. */
    const mo = { A4, D: k8D / 8, G: c.G };
    const a = alphaMin(mo);
    const mh = a !== null && conv ? higgsMass(mo, a, conv.m_W, conv.g4) : null;
    return { ...c, W2: [...c.W2s.keys()].sort((x, y) => x - y), nW2: c.W2s.size,
             alpha: a, mh, invR: a !== null && conv ? invR5(a, conv.m_W) : null };
  });
  out.sort((x, y) => y.n - x.n);
  return { A4, k8D, n, classes: out, nClasses: out.length, gSpread };
}

/* ------------------------------------------------------------------ what is not claimed */

/* Exact integer finite differences inside each residue class.  If the count were polynomial of
 * degree d there, the (d+1)-th difference would vanish identically.  Returns the degree found, or
 * null — and null is the answer here at every period tried, which is the point. */
export function quasiPolynomialProbe(curve, periods = [1, 2, 3, 6, 12], maxDeg = 9) {
  const diff = (seq, n) => {
    let s = seq;
    for (let i = 0; i < n; i++) s = s.slice(1).map((v, j) => v - s[j]);
    return s;
  };
  return periods.map((p) => {
    const sub = curve.N.filter((_, i) => i % p === 0);
    if (sub.length < 12) return { period: p, points: sub.length, degree: null, thin: true };
    let deg = null;
    for (let d = 0; d <= maxDeg; d++)
      if (diff(sub, d + 1).every((v) => v === 0)) { deg = d; break; }
    return { period: p, points: sub.length, degree: deg, thin: false };
  });
}

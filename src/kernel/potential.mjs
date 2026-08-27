/* potential.mjs — the one-loop Wilson-line potential, and everything Part VII reads off it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Pure functions.  No DOM, no globals, no I/O — so the browser and the node harness run the same
 * code and cannot drift apart.  Group data arrives as an argument; nothing here knows what SU(7) is.
 *
 * The potential is a sum over the bulk content of polylogarithms of the Wilson-line phase,
 *
 *     F(a) = sum_terms m * Re Li_5(s e^{i c pi a}),      c integer, s = +-1,
 *
 * and its expansion about the symmetric point is ONE ladder indexed by p = 5 - 2k, whose k-th rung
 * pairs the 2k-th moment of the content against zeta(p).  The rungs are zeta(5), zeta(3) and the
 * pole — and the pole is where the a^4 log a branch point comes from, which is why the stationarity
 * condition is a fixed point rather than a root of a polynomial.
 */

export const Z3 = 1.2020569031595943;
export const Z5 = 1.0369277551433699;
export const H4 = 25 / 12;
const LN2 = Math.LN2;

/* ------------------------------------------------------------------ the term table */

/* A content is turned into a flat list of (m, s, c).  This is the only place the group data is
 * read, and it is read, never assumed. */
/* THE GAUGE SEED IS A CONVENTION OF THE MODEL, NOT A FACT OF THE GROUP.  Every bulk multiplet's
 * contribution is fixed by group theory; what the gauge sector contributes is read off eq. (68) of
 * arXiv:2503.04090, and Part VII §13 records a candidate parity-resolved split of the same four
 * degrees of freedom that moves the base point by (9, 9, 9, 0, 0) in (2A4, 8D, 2U, V, 2W).  A data
 * file may carry several seeds under `gauge_seeds`; the model says which one it stands on, and the
 * default -- the printed one -- is declared in model.mjs where every default is declared. */
export function gaugeSeed(model, data) {
  const name = (model && model.conventions && model.conventions.gauge_seed) || "published";
  if (data.gauge_seeds) {
    const s = data.gauge_seeds[name];
    if (!s) throw new Error(`the data file has no gauge seed "${name}"`);
    return { name, gauge: s.gauge, seed: s };
  }
  if (name !== "published")
    throw new Error(`the data file for ${data.id} carries one gauge sector only; there is no ` +
                    `seed "${name}" to stand on`);
  return { name, gauge: data.gauge, seed: null };
}

export function termTable(model, data) {
  const out = gaugeSeed(model, data).gauge.map((t) => t.slice());
  for (const item of model.bulk || []) {
    if (!item.multiplicity) continue;
    const rep = data.reps[item.rep];
    if (!rep) throw new Error(`the data file has no representation "${item.rep}"`);
    const key = `(${item.parities[0] > 0 ? "+" : "-"},${item.parities[1] > 0 ? "+" : "-"})`;
    const table = rep[key];
    if (!table) throw new Error(`representation ${item.rep} has no parity assignment ${key}`);
    for (const [m, s, c] of table) out.push([m * item.multiplicity, s, c]);
  }
  return out;
}

/* ------------------------------------------------------------------ the moments */

export function moments(terms) {
  let A2 = 0, B2 = 0, A4 = 0, B4 = 0, A4L = 0;
  for (const [m, s, c] of terms) {
    if (s > 0) { A2 += m * c * c; A4 += m * c ** 4; A4L += m * c ** 4 * Math.log(c); }
    else { B2 += m * c * c; B4 += m * c ** 4; }
  }
  /* D is the curvature at the symmetric point, V''(0) = -pi^2 zeta(3) D.  The 3/4 is
   * eta(3)/zeta(3) and comes from their eq. (67), not from a choice of ours. */
  return { A2, B2, A4, B4, A4L, D: A2 - 0.75 * B2, G: A4 * H4 - A4L - LN2 * B4 };
}

/* ------------------------------------------------------------------ the other symmetric point */

/* [8]'s orbifold-stability criterion, summed over a content: F(1) - F(0) = (31/16) zeta(5) W with
 *
 *     W = sum over ODD charges of m (-s),
 *
 * so W > 0 means the electroweak point is deeper than the other symmetric point and the vacuum
 * the closed form finds is the true one.  Matter contributes integers to W; the gauge sector's odd
 * charges contribute a half-integer, so 2W is an odd integer for every content and the two points
 * never tie -- on either gauge seed, because W reads the DIFFERENCE of the two charge-one weights
 * and the candidate seed moves both by the same amount.  Part VII eqs. (34)-(35). */
export function stabilityW(terms) {
  let W = 0;
  for (const [m, s, c] of terms) if (c % 2 === 1) W += -s * m;
  return W;
}

export const F1minusF0 = (W) => (31 / 16) * Z5 * W;

/* THE FIVE COORDINATES.  Two bulk contents have the same one-loop potential, as a function of the
 * phase, if and only if they agree on (A4, 8D, 2U, V, 2W) -- Part VII Theorem 3.  G decomposes
 * exactly as G = (25/12) A4 - U ln 2 - V ln 3 because the only charges are 1, 2, 3: the periodic
 * charge-2 states put 16 m ln 2 into A4L, the periodic charge-3 states 81 m ln 3, and the whole
 * antiperiodic fourth moment B4 rides on ln 2.  Doubled where the paper doubles, so every entry is
 * an integer for matter; only the gauge base point may be odd or half-odd, which is the whole of
 * the seed question. */
export function coordinates(terms) {
  let A2 = 0, B2 = 0, A4 = 0, B4 = 0, U2 = 0, V = 0, W = 0;
  for (const [m, s, c] of terms) {
    if (s > 0) {
      A2 += m * c * c; A4 += m * c ** 4;
      if (c === 2) U2 += 2 * 16 * m;
      if (c === 3) V += 81 * m;
    } else { B2 += m * c * c; B4 += m * c ** 4; }
    if (c % 2 === 1) W += -s * m;
  }
  U2 += 2 * B4;
  return { A4, D8: 8 * (A2 - 0.75 * B2), U2, V, W2: 2 * W };
}

/* ------------------------------------------------------------------ the rungs */

/* Rung k of the ladder: [S_k + (2^p - 1) Delta_k] / 2^p with p = 5 - 2k.  Returned as the integer
 * numerator, because that is the object the arithmetic laws are about. */
export function rung(terms, k) {
  const p = 5 - 2 * k;
  let S = 0, D = 0;
  for (const [m, s, c] of terms) { const w = m * c ** (2 * k); S += w; D += w * s; }
  return S + (2 ** p - 1) * D;
}

/* ------------------------------------------------------------------ the vacuum */

/* The stationarity condition, x = pi alpha:
 *     x^2 = 24 zeta(3) D / [ 4G - A_4 (4 ln x + 1) ]
 * A fixed point, not a root: the logarithm is the p = 1 rung, and it does not go away. */
export function alphaMin({ D, A4, G }, { maxIter = 400, tol = 1e-14, x0 = 0.1 } = {}) {
  if (!(D > 0)) return null;
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const den = 4 * G - A4 * (4 * Math.log(x) + 1);
    if (!(den > 0)) return null;
    const xn = Math.sqrt(24 * Z3 * D / den);
    if (Math.abs(xn - x) < tol) { x = xn; break; }
    x = xn;
  }
  return x / Math.PI;
}

/* At the stationary point the logarithm and G cancel identically. */
export function curvatureAtMin({ D, A4 }, alpha) {
  const x = Math.PI * alpha;
  return Math.PI ** 2 * (2 * Z3 * D - A4 * x * x / 6);
}

export function kConst(mW, g4) {
  return Math.sqrt(3) / (2 * Math.PI ** 3) * mW * g4;
}

export function higgsMass(mo, alpha, mW, g4) {
  const fpp = curvatureAtMin(mo, alpha);
  return fpp > 0 ? kConst(mW, g4) * Math.sqrt(fpp) / alpha : null;
}

/* alpha_min = 2 m_W R_5, so the vacuum IS the hierarchy. */
export const invR5 = (alpha, mW) => 2 * mW / alpha;

/* IDENTITY (II), Part VII eq. (22): once the Higgs mass is PINNED, the logarithm is gone and
 *
 *     x^2 (6 mu + A4) = 12 zeta(3) D,      mu = (m_h / (K pi^2))^2,      x = pi alpha,
 *
 * so 1/R_5 = 2 pi m_W / x is an explicit surface over the two quantised moments with no
 * minimisation left in it.  It is what the ceiling is a maximum OF: every level of the ceiling is
 * this surface read at a lattice point at the top of the window, and the harness checks the
 * archived levels by evaluating it, not by trusting them. */
export function surfaceInvR5({ A4, D8 }, mh, mW, g4) {
  const mu = (mh / (kConst(mW, g4) * Math.PI ** 2)) ** 2;
  const x2 = 12 * Z3 * (D8 / 8) / (6 * mu + A4);
  return x2 > 0 ? 2 * Math.PI * mW / Math.sqrt(x2) : null;
}

/* ------------------------------------------------------------------ the potential itself */

/* Summed directly, for the curve the user drags.  Truncation is an input, not a hidden constant:
 * the terms fall as n^-5, so the tail is bounded by the caller's choice and can be reported. */
export function F(terms, alpha, windings = 600) {
  let total = 0;
  for (const [m, s, c] of terms) {
    let sub = 0;
    for (let n = 1; n <= windings; n++) {
      const sign = s > 0 ? 1 : (n % 2 ? -1 : 1);
      sub += sign * Math.cos(n * c * Math.PI * alpha) / n ** 5;
    }
    total += m * sub;
  }
  return total;
}

/* The numerical minimum of the same F — the control the closed form is checked against.  It is
 * here, in the kernel, precisely so that the page can run the check on itself. */
export function numericMin(terms, { lo = 1e-4, hi = 1, n = 2000, refine = 40, windings = 600 } = {}) {
  let best = null, bx = null;
  for (let i = 0; i <= n; i++) {
    const a = lo + (hi - lo) * i / n, v = F(terms, a, windings);
    if (best === null || v < best) { best = v; bx = a; }
  }
  if (bx === null || bx <= lo || bx >= hi) return null;
  let a = bx - (hi - lo) / n, b = bx + (hi - lo) / n;
  for (let k = 0; k < refine; k++) {
    const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
    if (F(terms, m1, windings) < F(terms, m2, windings)) b = m2; else a = m1;
  }
  return (a + b) / 2;
}

/* THE MINIMUM THE CLOSED FORM IS ABOUT — found numerically, not assumed to sit where the closed
 * form says.  Walk downhill on the same grid from a0, then sharpen the bracketing cell by ternary
 * section: exactly the procedure sweepHierarchy runs over the whole lattice, so a single model's
 * verdict and the sweep measure the same object with the same instrument.
 *
 * Why this and not a tolerance on |alpha_global - alpha_closed|: the closed form is an expansion,
 * accurate to 0.71 % under the largest alpha of their Table 1 and to 20 % out at alpha = 0.229, so
 * a fixed positional window is a guess about a basin's width, and a guess is the wrong instrument
 * for deciding globality.  With this, the closed form only LOCATES the basin; the decision is a
 * comparison of F at two numerically refined minima.  Returns null when the walk runs off an end:
 * that a0 is in no interior basin at all, which is a statement, not a failure. */
export function localMin(terms, a0, { lo = 1e-4, hi = 1, n = 2000, refine = 40, windings = 600 } = {}) {
  if (!(a0 > lo) || !(a0 < hi)) return null;
  const step = (hi - lo) / n, cache = new Map();
  const at = (i) => { if (!cache.has(i)) cache.set(i, F(terms, lo + step * i, windings));
                      return cache.get(i); };
  let i = Math.max(1, Math.min(n - 1, Math.round((a0 - lo) / step)));
  while (i > 1 && at(i - 1) < at(i)) i--;
  while (i < n - 1 && at(i + 1) < at(i)) i++;
  if (i <= 1 || i >= n - 1) return null;
  let a = lo + step * (i - 1), b = lo + step * (i + 1);
  for (let k = 0; k < refine; k++) {
    const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
    if (F(terms, m1, windings) < F(terms, m2, windings)) b = m2; else a = m1;
  }
  return (a + b) / 2;
}

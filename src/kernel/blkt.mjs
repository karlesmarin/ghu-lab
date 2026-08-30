/* blkt.mjs — brane-localized kinetic terms: the Kaluza-Klein tower when the branes have mass.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS FOR.  Everywhere else in this instrument a Kaluza-Klein mass is n/R: the tower is
 * arithmetic and the potential is a sum of cosines.  Put an extra kinetic term ON THE FIXED POINTS
 * -- a brane-localized kinetic term, BLKT -- and that stops being true.  The masses become the
 * roots of a transcendental equation, the sum over the tower diverges, and the potential has to be
 * built from the roots rather than written down.  This module does that.
 *
 * IT MATTERS BECAUSE IT IS THE LIVE ROUTE.  Akamatsu, Hirose, Maru and Nago's 2023 model
 * (arXiv:2312.08608) lands at a compactification scale of about 303 GeV, which is too low to be
 * viable.  Their 2026 paper (arXiv:2603.05857) turns on BLKTs, and their eq. (5.19) carries a
 * (1 + c) that lifts the scale.  We measured the alternative -- climbing the symmetric-rank ladder
 * of their 2023 paper -- and the best point in the whole ladder is 464 GeV against the ~1171 GeV
 * their BLKT route reaches.  They were right to change route, and this instrument could not follow
 * them there.
 *
 * THE EQUATIONS, READ OFF THE RENDERED PAGE AND NOT THE TEXT LAYER.  `pdf_glyph_audit.py` flags
 * 132 glyphs on 16 of that paper's 29 pages as unrenderable, page 10 -- where these equations live
 * -- among them, and the text layer does mangle (3.19)'s denominator.  Every formula below was read
 * from a 3x render.  (This project spent 2026-08-30 proving a correct published formula wrong
 * because a text layer had silently eaten two characters; the audit exists because of that day.)
 *
 *   z_n     = x^2 - (n + m alpha_1 / 2)^2                      just above (3.17)
 *   S_n     = (1/sqrt z_n) sin(2 pi sqrt z_n)
 *                        / [cos(2 pi sqrt z_n) - cos(pi (m alpha_2 + q))]              (3.20)
 *             and for z_n < 0 the same with sin -> sinh, cos -> cosh and |z_n|,
 *             which is the analytic continuation their (3.17) writes out as two cases
 *   S_reg   = S_0 + lim_N [ sum_{n=1..N} (S_n + S_{-n})
 *                           - psi(N + 1 + m alpha_1 / 2) - psi(N + 1 - m alpha_1 / 2) ]  (3.21)
 *   0       = 1 - c pi x^2 S_reg                                                (3.19), regulated
 *   V^(m,q) = -(1 / 32 pi^2 R^4) sum_k int_0^{(Lambda R)^2} dl  l  exp(-x_k^2 / l)        (4.2)
 *
 * THE INTEGRAL IS DONE IN CLOSED FORM, not by quadrature.  With u = x^2/l,
 *
 *     int_0^L dl  l  e^{-x^2/l}  =  x^4 int_{x^2/L}^{infty} u^{-3} e^{-u} du  =  x^4 Gamma(-2, x^2/L),
 *
 * so the whole cutoff dependence sits in one upper incomplete gamma.  A quadrature over l would
 * have to resolve e^{-x^2/l} near l = 0, which is exactly where it is worst behaved.
 *
 * AND ONE THING WE ALREADY PROVED, WHICH CONSTRAINS THE INTERFACE.  The sum c = sum_i c_i does NOT
 * determine the tower: two brane distributions with the same total give different spectral
 * determinants, different poles and different residues (`BLKT_IDENTIFIABILITY_CHECK.md`, with a
 * two-point algebraic counterexample).  So a caller may not hand this module a single c and expect
 * physics; `c` here is the coefficient of ONE localised term, in the single-brane case their §3
 * writes, and that scope is stated rather than assumed.
 */

/* ------------------------------------------------------------------ special functions */

/* The digamma, psi(z) = d/dz ln Gamma(z), for real z > 0: recurrence up to a shift, then the
 * standard asymptotic series in 1/z^2.
 *
 * THE SHIFT IS 16 AND NOT 8, and mpmath is why.  The series here runs to 1/z^10, so the first term
 * dropped is (691/32760)/z^12.  Shifting only to 8 leaves that at 7e-14 absolute, which is 1.3e-13
 * relative at psi(1) -- and `tests/blkt_reference.json` caught exactly that, at psi(1) and psi(2.7),
 * while every other function passed.  At 16 the same term is 5e-17 and the whole range is at
 * machine precision.  Eight extra additions is not a cost worth a wrong digit. */
export function digamma(z) {
  if (!(z > 0)) throw new Error(`digamma: needs z > 0, got ${z}`);
  let r = 0;
  while (z < 16) { r -= 1 / z; z += 1; }
  const f = 1 / (z * z);
  return r + Math.log(z) - 0.5 / z
    + f * (-1 / 12 + f * (1 / 120 + f * (-1 / 252 + f * (1 / 240 + f * (-1 / 132)))));
}

/* E_1(x) = int_x^infty e^{-t}/t dt, for x > 0.  Series for small x, continued fraction for large;
 * both are the textbook ones and the crossover is where they agree. */
export function expint1(x) {
  if (!(x > 0)) throw new Error(`expint1: needs x > 0, got ${x}`);
  if (x <= 1) {
    /* E_1(x) = -gamma - ln x + sum_{k>=1} (-1)^{k+1} x^k / (k k!) */
    const GAMMA = 0.5772156649015329;
    let s = 0, term = 1;
    for (let k = 1; k <= 40; k++) {
      term *= -x / k;
      s += -term / k;
      if (Math.abs(term / k) < 1e-18 * Math.abs(s)) break;
    }
    return -GAMMA - Math.log(x) + s;
  }
  /* Lentz's algorithm on the continued fraction E_1(x) = e^{-x} / (x + 1/(1 + 1/(x + 2/(1 + ...)))) */
  const TINY = 1e-300;
  let b = x + 1, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * i;
    b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return h * Math.exp(-x);
}

/* Gamma(-2, x), the upper incomplete gamma at order -2, by the downward recurrence
 *     Gamma(a, x) = [ Gamma(a+1, x) - x^a e^{-x} ] / a,
 * started from Gamma(0, x) = E_1(x).  Two steps: a = -1 then a = -2. */
export function gammaMinus2(x) {
  const e = Math.exp(-x);
  const g0 = expint1(x);                       /* Gamma(0, x)  */
  const g1 = (g0 - e / x) / -1;                /* Gamma(-1, x) */
  return (g1 - e / (x * x)) / -2;              /* Gamma(-2, x) */
}

/* ------------------------------------------------------------------ the tower */

/* One term of the sum, their (3.20), with the branch of (3.17) taken explicitly rather than left
 * to a complex square root: for z < 0 the trigonometric functions become hyperbolic. */
export function blktTerm(x, n, m, alpha1, alpha2, q) {
  const z = x * x - Math.pow(n + m * alpha1 / 2, 2);
  const th = Math.PI * (m * alpha2 + q);
  if (z > 0) {
    const r = Math.sqrt(z), a = 2 * Math.PI * r;
    /* THE DENOMINATOR IS NOT COMPUTED AS A DIFFERENCE, and that is the whole numerical story.
     *
     * cos(a) - cos(th) vanishes at every pole, and near one the two cosines agree to more digits
     * than a double carries: at x = 0.4999999995 with th = pi, cos(a) is -1 + 5e-18, which ROUNDS
     * TO EXACTLY -1, the subtraction gives exactly 0, and the term is Infinity.  The c -> 0 control
     * found it -- the whole symmetric-point sector went missing, and that is the sector the physics
     * is about.
     *
     * The identity cos A - cos B = -2 sin((A+B)/2) sin((A-B)/2) has no cancellation: near the pole
     * the second factor is a SMALL SINE OF A SMALL ANGLE, which doubles carry to full relative
     * precision, instead of a small difference of two numbers near one, which they do not. */
    const den = -2 * Math.sin((a + th) / 2) * Math.sin((a - th) / 2);
    return Math.sin(a) / (r * den);
  }
  if (z < 0) {
    const r = Math.sqrt(-z), a = 2 * Math.PI * r;
    /* cosh(a) - cos(th) >= 1 - 1 = 0 with equality only at a = 0 and th = 0, so there is no
     * cancellation to fight here; what there is, is overflow, and dividing through by cosh fixes it */
    if (a > 350) return (Math.tanh(a) / r) / (1 - Math.cos(th) / Math.cosh(a));
    return Math.sinh(a) / (r * (Math.cosh(a) - Math.cos(th)));
  }
  /* z = 0 exactly: sin(2 pi r)/r -> 2 pi */
  return 2 * Math.PI / (1 - Math.cos(th));
}

/* Their (3.21): the sum is logarithmically divergent (S_n ~ 1/|n|) and the two digammas remove
 * exactly that.  `N` is where the limit is truncated; the subtraction is what makes the truncation
 * converge rather than merely stop. */
export function blktSreg(x, { m, q, alpha1, alpha2, N = 400 } = {}) {
  let s = blktTerm(x, 0, m, alpha1, alpha2, q);
  for (let n = 1; n <= N; n++)
    s += blktTerm(x, n, m, alpha1, alpha2, q) + blktTerm(x, -n, m, alpha1, alpha2, q);
  return s - digamma(N + 1 + m * alpha1 / 2) - digamma(N + 1 - m * alpha1 / 2);
}

/* The mass equation, their (3.19) with the sum regulated: F(x) = 0. */
export const blktMassEq = (x, opts) => 1 - opts.c * Math.PI * x * x * blktSreg(x, opts);

/* THE BLKT-FREE TOWER, which is what the roots must become as c -> 0.
 *
 * At c = 0 the equation is 1 = 0 unless S_reg blows up, and S_reg blows up at the POLES of the
 * summand: cos(2 pi sqrt z_n) = cos(pi (m alpha_2 + q)).  That gives
 *
 *     z_n = ( (m alpha_2 + q)/2 + k )^2      =>   x^2 = (n + m alpha_1/2)^2 + ((m alpha_2 + q)/2 + k)^2,
 *
 * the ordinary twisted tower on the torus.  Having this in closed form is what lets the harness
 * check the c -> 0 limit against something that is not this module. */
export function blktFreeTower(m, q, alpha1, alpha2, { nMax = 6, kMax = 6 } = {}) {
  const out = [];
  for (let n = -nMax; n <= nMax; n++)
    for (let k = -kMax; k <= kMax; k++) {
      const a = n + m * alpha1 / 2, b = (m * alpha2 + q) / 2 + k;
      out.push(Math.hypot(a, b));
    }
  /* DE-DUPLICATE WITHOUT ROUNDING THE VALUES.  Rounding to 1e-9 to build a Set was the first
   * version, and it silently capped how close the root finder could get to a pole -- so at
   * c = 1e-9, where the root sits nearer than that, it could not resolve one and reported the pole
   * region instead.  A pole is a coordinate the search needs to full precision; the tolerance
   * belongs to the COMPARISON, not to the number. */
  out.sort((p, r) => p - r);
  return out.filter((v, i) => i === 0 || v - out[i - 1] > 1e-12);
}

/* The lowest `count` roots of the mass equation.
 *
 * A PLAIN GRID CANNOT FIND THEM, and finding that out is worth more than the fix.  As c -> 0 the
 * equation 1 = c pi x^2 S_reg can only hold where S_reg is enormous, so every root migrates to a
 * POLE of the summand and sits a distance of order c from it.  A scan at step 1e-3 puts the root
 * and its pole in the same cell, sees one sign change, cannot tell which it is, and reports
 * nothing.  Our first version did exactly that and the c -> 0 control caught it.
 *
 * So the poles are used instead of avoided.  They are known in closed form -- they are the free
 * tower, `blktFreeTower` -- and between two consecutive poles the function is smooth with one
 * crossing.  Each interval is sampled with points that crowd BOTH ends logarithmically, down to
 * 1e-13 of the gap, because at small c that is where the root is; then bisection.
 *
 * This also means the count is honest: `complete` is false when fewer roots than asked for were
 * bracketed, and `poles` says how many intervals were available to look in. */
export function blktRoots(opts, { count = 6, xMax = 8, tol = 1e-13 } = {}) {
  const F = (x) => blktMassEq(x, opts);
  const poles = [0, ...blktFreeTower(opts.m, opts.q, opts.alpha1, opts.alpha2,
                                     { nMax: 8, kMax: 8 }).filter((v) => v > 1e-12 && v <= xMax + 1)];
  const roots = [];

  /* sample points inside (a, b), crowded at both ends: a + gap*1e-13 ... midpoint ... b - gap*1e-13 */
  const samples = (a, b) => {
    const gap = b - a, out = [];
    for (let k = 13; k >= 1; k--) out.push(a + gap * Math.pow(10, -k));
    for (let i = 1; i < 40; i++) out.push(a + gap * i / 40);
    for (let k = 1; k <= 13; k++) out.push(b - gap * Math.pow(10, -k));
    return out.filter((x) => x > a && x < b).sort((p, q) => p - q);
  };

  for (let i = 0; i + 1 < poles.length && roots.length < count; i++) {
    const xs = samples(poles[i], poles[i + 1]);
    let xPrev = xs[0], fPrev = F(xPrev);
    for (let j = 1; j < xs.length && roots.length < count; j++) {
      const x = xs[j], f = F(x);
      /* A SIGN CHANGE INTO AN INFINITY IS STILL A SIGN CHANGE, and demanding both ends be finite
       * threw away the only bracket that held the root.  At the symmetric point alpha = 0 the pole
       * lands on an exactly representable x -- cos(2 pi * 0.5) is exactly -1 -- so F evaluates to
       * -Infinity there and the first version found nothing at all for that sector, which is the
       * sector the physics is about.  Bisection is on the SIGN, which infinities carry; what
       * separates a root from a pole is the |F| test at the end, and that is where it belongs. */
      if (!Number.isNaN(f) && !Number.isNaN(fPrev) &&
          (Number.isFinite(f) || Number.isFinite(fPrev)) &&
          Math.sign(f) !== Math.sign(fPrev)) {
        let lo = xPrev, hi = x, flo = fPrev;
        for (let it = 0; it < 300 && hi - lo > tol * Math.max(1, hi); it++) {
          const mid = 0.5 * (lo + hi), fm = F(mid);
          if (Number.isNaN(fm)) break;         /* only NaN carries no side; +-Infinity does */
          if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
        }
        const r = 0.5 * (lo + hi);
        if (Math.abs(F(r)) < 1e-3 && r > 1e-12) roots.push(r);
      }
      xPrev = x; fPrev = f;
    }
  }
  roots.sort((a, b) => a - b);
  return { roots: roots.slice(0, count), poles: poles.length - 1,
           complete: roots.length >= count };
}

/* ------------------------------------------------------------------ their own approximation */

/* Their (3.22): keep only the n = 0 term and the constant the regularisation leaves behind.
 *
 *     1 - c pi x^2 [ S_0(x; alpha_1, alpha_2) + 2 gamma ] = 0,      gamma = -psi(1)
 *
 * It exists in the paper as a check on the regularisation, and it is a check on US for a better
 * reason: solved for alpha ~ x << 1 it has a closed form, and that closed form is their (5.19).
 * Expanding S_0 for small argument gives S_0 -> 2 / (pi [ m^2(alpha_1^2 + alpha_2^2)/2 - 2x^2 ]),
 * whereupon 1 = c pi x^2 S_0 collapses to
 *
 *     x = m |alpha| / (2 sqrt(1 + c)),        |alpha|^2 = alpha_1^2 + alpha_2^2,
 *
 * which at m = 1 is M_W^2 = (alpha_1^2 + alpha_2^2) / (4 (1+c) R^2) -- their (5.19), p. 20.  Two
 * equations six pages apart, and our implementation has to join them. */
export const EULER_GAMMA = 0.5772156649015329;

export function blktApprox(x, { m, q, alpha1, alpha2, c } = {}) {
  return 1 - c * Math.PI * x * x
             * (blktTerm(x, 0, m, alpha1, alpha2, q) + 2 * EULER_GAMMA);
}

/* the small-x solution of (3.22), by bisection below the first pole */
export function blktApproxRoot(opts, { xMax = 0.5, tol = 1e-14 } = {}) {
  const F = (x) => blktApprox(x, opts);
  let lo = 1e-12, hi = xMax, flo = F(lo);
  /* walk up until the sign flips, staying below the first pole */
  const first = blktFreeTower(opts.m, opts.q, opts.alpha1, opts.alpha2)
                  .filter((v) => v > 1e-12)[0];
  hi = Math.min(hi, first * (1 - 1e-9));
  let fhi = F(hi);
  if (Math.sign(flo) === Math.sign(fhi)) return null;
  for (let i = 0; i < 300 && hi - lo > tol; i++) {
    const mid = 0.5 * (lo + hi), fm = F(mid);
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; }
  }
  return 0.5 * (lo + hi);
}

/* what (5.19) says the same quantity is */
export function blktScaleFormula({ m = 1, alpha1, alpha2, c }) {
  return m * Math.hypot(alpha1, alpha2) / (2 * Math.sqrt(1 + c));
}

/* ------------------------------------------------------------------ the potential */

/* Their (4.2), one sector, in units where the 1/(32 pi^2 R^4) is carried by the caller if it wants
 * an absolute number.  `LR` is the dimensionless cutoff Lambda R.
 *
 * The sign is theirs: (4.2) is NEGATIVE for a real scalar degree of freedom, and a fermion enters
 * with an extra (-1) and its spin count, which is (4.1)'s remark and the caller's job. */
export function blktVsector(roots, { LR = 20 } = {}) {
  let v = 0;
  for (const x of roots) {
    if (!(x > 0)) continue;
    const t = (x * x) / (LR * LR);
    v += Math.pow(x, 4) * gammaMinus2(t);
  }
  return -v / (32 * Math.PI * Math.PI);
}

/* The whole thing for one sector: solve, then integrate.  Returned together so a caller cannot
 * quote a potential without the roots it was built from. */
export function blktSector(opts, { count = 6, xMax = 8, step = 0.002, LR = 20 } = {}) {
  const r = blktRoots(opts, { count, xMax, step });
  return { ...r, V: blktVsector(r.roots, { LR }), LR };
}

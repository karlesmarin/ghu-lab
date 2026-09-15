export const GG_REFERENCE = {"roots":{"1":[3.940941610212604,7.330568659540934,10.748378826089303],"1.1":[4.107140625405854,7.471161636680441,10.86375339304152]},"sha256":"7b735c04680d380c5d01d1e65853b0bd5688dc0a3493b3079b7be9cce4fda629","method":"Bessel roots plus independent DOP853; dimensionless a=0.1; three displayed modes","max_ODE_error":4.4930281717370235e-11};
/* H185: a fixed-canonical-potential family, not a complete GHU model.
 * Pure functions. The build prepends Python/SciPy reference roots and provenance.
 * a=0.1, p in {1,1.1}; eta in [-.99,4]. No interpolation of the KK masses.
 */
export function ggIntegrals(p, eta) {
  if (![1, 1.1].includes(p) || !Number.isFinite(eta) || eta < -.99 || eta > 4)
    throw new RangeError("H185 domain: p = 1 or 1.1, -0.99 <= eta <= 4");
  const a = .1, r = 3 * p - 1, D = a ** (-r) - 1, IT = D / r;
  const alpha = (1 + eta * a ** (-r) / D) / (1 + eta);
  const beta = -eta / (D * (1 + eta));
  const integral = q => Math.abs(q + 1) < 1e-12 ? -Math.log(a) : -Math.expm1((q + 1) * Math.log(a)) / (q + 1);
  const W = alpha ** 2 * integral(3 * p) + 2 * alpha * beta * integral(1) + beta ** 2 * integral(2 - 3 * p);
  const J = IT * (1 + eta), W0 = integral(3 * p);
  return { p, eta, a, r, D, IT, W, J, W0, f: 1 / Math.sqrt(W * J), fRatio: Math.sqrt(W0 * IT / (W * J)) };
}

export function ggAt(c, t) {
  if (!Number.isFinite(t) || t < .1 || t > 1) throw new RangeError("source t outside [0.1,1]");
  const P = (.1 ** (-c.r) - t ** (-c.r)) / c.D;
  const F = (1 + c.eta * P) / (1 + c.eta), w = t ** (3 * c.p) * F ** 2;
  return { P, F, w, Z: t ** (4 * c.p) * F ** 2,
    residueRatio: c.W / (c.W0 * F ** 2),
    staticResponse: c.W * c.IT * P * (1 - P) / F ** 2 };
}

/* Independent of the reference Bessel roots: RK4 on the original weighted vector equation.
 * Return only the FIRST massive NN root. Zero is excluded explicitly, never treated as DD.
 */
export function ggShootNN(p, eta, x, steps = 1000) {
  const c = ggIntegrals(p, eta), h = .9 / steps;
  const B = t => {
    const P = (.1 ** (-c.r) - t ** (-c.r)) / c.D;
    return 3 * p / t + 2 * eta * t ** (-3 * p) / (c.IT * (1 + eta * P));
  };
  let y = 1, v = 0;
  for (let i = 0; i < steps; i++) {
    const t = .1 + h * i, b0 = B(t), bm = B(t + h / 2), b1 = B(t + h);
    const k1y = v, k1v = -b0 * v - x * x * y;
    const k2y = v + h * k1v / 2, k2v = -bm * k2y - x * x * (y + h * k1y / 2);
    const k3y = v + h * k2v / 2, k3v = -bm * k3y - x * x * (y + h * k2y / 2);
    const k4y = v + h * k3v, k4v = -b1 * k4y - x * x * (y + h * k3y);
    y += h * (k1y + 2 * k2y + 2 * k3y + k4y) / 6;
    v += h * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
  }
  return v;
}

export function ggFirstNN(p, eta, steps = 1000) {
  let lo = .01, flo = ggShootNN(p, eta, lo, steps), hi;
  for (hi = .26; hi < 12; hi += .25) {
    const fhi = ggShootNN(p, eta, hi, steps);
    if (flo * fhi < 0) break;
    lo = hi; flo = fhi;
  }
  if (hi >= 12) throw new Error("NN root could not be bracketed");
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2, f = ggShootNN(p, eta, mid, steps);
    if (f * flo > 0) { lo = mid; flo = f; } else hi = mid;
  }
  return (lo + hi) / 2;
}

export function ggMasses(p) {
  if (![1, 1.1].includes(p)) throw new RangeError("no reference spectrum for that p");
  return GG_REFERENCE.roots[String(p)].slice();
}

export function ggInput(p = 1.1, eta = 0, t = .5) {
  ggAt(ggIntegrals(p, eta), t);
  return { group: "warped-gauge-gravity", section: "gravitygauge", p, eta, source_t: t, a: .1,
    orbifold: { name: "regular conformal interval", tensor: "NN", paired_vector: "DD", control_vector: "NN" },
    bulk: [], brane: [],
    conventions: { m_W: null, g4: "fixed; results normalized to g4", mh_window: null,
      windings: null, gauge_seed: null, ell: "unassigned length", theta_period: "fixed by the same charge convention",
      Z_IR: 1, g5_squared: "g4_squared * W; recalibrated for each eta" } };
}

/* rs_fermions.mjs — warped zero-mode quarks and their couplings to the KK gluon, every number with its witness.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE GAP THIS CLOSES.  rs_anomaly.mjs builds the warped gauge towers and states as unknown the fermion side;
 * rs_unification.mjs classifies a bulk mass c by chirality and localisation (ruFermion) but never asks what a
 * localised quark couples to.  This module answers that one question for zero-mode quarks: the coupling of the
 * n-th KK gluon to a quark of bulk mass c, and the octet's widths that follow.  Fermion KK towers are NOT built.
 *
 * CONVENTIONS — the same c as ruFermion, so the laboratory has one meaning for it.  Conformal z in [R, R'],
 * R = 1, R'/R = e^{kL}.  A left-handed zero mode of bulk mass c has density |chi|^2 dz proportional to z^{-2c} dz and is
 * UV-localised for c > 1/2; a right-handed one has density z^{+2c} and is UV-localised for c < -1/2.  Gauge KK
 * modes are Neumann–Neumann: f_n(z) = z [J1(m z) + b Y1(m z)], ∫ dz (R/z) f_n² = 1, zero mode f_0 = 1/√(kL).
 *
 *   coupling   g_n(c)/g_s = ∫ density_c · f_n/f_0  /  ∫ density_c          (normalised density)
 *   F(c)       F(c)² = (1−2c)/(1−e^{−(1−2c)kL}) for LH, F(−c) for RH; F(1/2)² = 1/kL   (closed form)
 *   width      Γ/M = (α_s/12) Σ_q (g_L² + g_R²)/g_s² · β(1 + 2m_q²/M²)        (vector octet → q q̄)
 *
 * The width convention is not assumed: with every coupling equal to √2 g_s it must return the flat theorem
 * Γ/M = 2α_s that collider.mjs carries, and that reduction is one of the certificates.
 */

import { raBessel } from "./rs_anomaly.mjs";
import { alphasRun } from "./collider.mjs";
import { xsTopThreshold } from "./resonance_xsec.mjs";
import { STATUS, val, unknown } from "../kernel/status.mjs";

export const RF_SOURCE = "rs_fermions.mjs; independent 40-digit mpmath reference data/rs_fermions_reference.json " +
                         "(tools/rs_fermions_sage_control.py, SageMath image); harness _test_rs_fermions.mjs";

export function rfValidate(input = {}) {
  const p = { kL: 35, modes: 1, cL: { light: 0.6, Q3: 0.3 }, cR: { light: -0.6, tR: 0.3, bR: -0.6 },
              MGeV: 5000, mTopGeV: 172.5, ...input };
  if (!Number.isFinite(p.kL) || p.kL < 8 || p.kL > 40) throw new RangeError("kL outside 8…40");
  if (!Number.isInteger(p.modes) || p.modes < 1 || p.modes > 3) throw new RangeError("modes must be 1, 2 or 3");
  for (const [side, obj] of [["cL", p.cL], ["cR", p.cR]])
    for (const [k, c] of Object.entries(obj))
      if (!Number.isFinite(c) || c < -1.5 || c > 1.5) throw new RangeError(`${side}.${k} outside -1.5…1.5`);
  if (!Number.isFinite(p.MGeV) || p.MGeV < 500 || p.MGeV > 20000) throw new RangeError("MGeV outside 500…20000");
  return p;
}

/* Simpson on [a,b] with n (even) panels. */
function rfSimpson(g, a, b, n) {
  const h = (b - a) / n; let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(a + i * h);
  return s * h / 3;
}
/* Value with its own convergence witness: n and 2n panels, the shift between them. */
function rfSimpsonCertified(g, a, b, n = 4000) {
  const coarse = rfSimpson(g, a, b, n), fine = rfSimpson(g, a, b, 2 * n);
  /* RELATIVE shift: the mode norm grows like e^{2kL}, so an absolute shift reads as divergence when it is not. */
  return { value: fine, panels: 2 * n, doubledShift: fine - coarse, relativeShift: (fine - coarse) / Math.abs(fine) };
}

/* Closed form, no numerics: theorem for any c (the c = 1/2 limit is taken analytically). */
export function rfZeroModeF(c, kL, chirality = "L") {
  const cc = chirality === "L" ? c : -c, a = 1 - 2 * cc;
  if (Math.abs(a) < 1e-12) return Math.sqrt(1 / kL);
  return Math.sqrt(a / (1 - Math.exp(-a * kL)));
}

/* Neumann–Neumann gauge modes, x_n = m_n R'.  Each root carries its bracket, residual and the Bessel
 * Wronskian at the root (the only Bessel identity the series can be checked against without a second library). */
export function rfGaugeModes(kL, modes = 1) {
  const eps = Math.exp(-kL);
  const F = (x) => { const a = raBessel(x * eps), b = raBessel(x); return a.j0 * b.y0 - b.j0 * a.y0; };
  const out = []; let lo = 0.5, flo = F(lo);
  for (let hi = 0.51; hi < 11.9 && out.length < modes; hi += 0.01) {
    const fhi = F(hi);
    if (flo * fhi < 0) {
      let a = lo, b = hi, fa = flo;
      for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = F(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
      const x = (a + b) / 2, m = x * eps, uv = raBessel(m), bcoef = -uv.j0 / uv.y0, w = raBessel(x);
      const f = (u) => { const z = Math.exp(u), v = raBessel(m * z); return z * (v.j1 + bcoef * v.y1); };
      const norm = rfSimpsonCertified((u) => f(u) ** 2, 0, kL);
      out.push({ n: out.length + 1, x, bracket: [lo, hi], residual: F(x),
                 wronskianAtRoot: (w.j1 * w.y0 - w.j0 * w.y1) / (2 / (Math.PI * x)) - 1,
                 f, norm });
    }
    lo = hi; flo = fhi;
  }
  if (out.length < modes) throw new Error(`only ${out.length} gauge roots bracketed below x = 11.9 (raBessel domain)`);
  return out;
}

/* g_n(c)/g_s with its convergence witness. */
export function rfCoupling(c, chirality, kL, mode) {
  const a = chirality === "L" ? 1 - 2 * c : 1 + 2 * c, w = (u) => Math.exp(a * u), f0 = 1 / Math.sqrt(kL);
  const num = rfSimpsonCertified((u) => w(u) * mode.f(u) / Math.sqrt(mode.norm.value) / f0, 0, kL);
  const den = rfSimpsonCertified(w, 0, kL);
  const value = num.value / den.value, coarse = (num.value - num.doubledShift) / (den.value - den.doubledShift);
  /* couplings are O(0.1–6): the witness is the absolute shift in units of g_s */
  return { value, panels: num.panels, doubledShift: value - coarse };
}

/* Zero-mode-approximation quark masses: singular values of M = (v/√2) F(c_Q) Y F(c_q), with F in the paper
 * convention of arXiv:0807.4937 (data/rs_benchmark_cghnp2008.json) — numerically the lab F with c_lab = -c_Q (LH)
 * and c_lab = +c_q (RH).  The eigenvalues of H = M M† come from its three invariants (trace, sum of 2×2 minors by
 * Cauchy–Binet, |det M|²): no cubic formula, so a 10⁻¹⁰ hierarchy keeps its digits.  Y entries are [re, im]. */
const rfCmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const rfCsub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const rfCabs2 = (a) => a[0] * a[0] + a[1] * a[1];
export function rfZeroModeMasses(cDoubletLab, cSingletLab, Y, kL, vGeV = 246) {
  const FL = cDoubletLab.map((c) => rfZeroModeF(c, kL, "L")), FR = cSingletLab.map((c) => rfZeroModeF(c, kL, "R"));
  const s = vGeV / Math.SQRT2;
  const M = Y.map((row, i) => row.map((y, j) => [s * FL[i] * y[0] * FR[j], s * FL[i] * y[1] * FR[j]]));
  const e1 = M.flat().reduce((t, z) => t + rfCabs2(z), 0);
  let e2 = 0;
  for (const [r1, r2] of [[0, 1], [0, 2], [1, 2]]) for (const [k1, k2] of [[0, 1], [0, 2], [1, 2]])
    e2 += rfCabs2(rfCsub(rfCmul(M[r1][k1], M[r2][k2]), rfCmul(M[r1][k2], M[r2][k1])));
  const det = [[0, 1, 2], [1, 2, 0], [2, 0, 1]].reduce((t, [a, b, c]) =>
    [t[0] + rfCmul(M[0][a], rfCsub(rfCmul(M[1][b], M[2][c]), rfCmul(M[1][c], M[2][b])))[0],
     t[1] + rfCmul(M[0][a], rfCsub(rfCmul(M[1][b], M[2][c]), rfCmul(M[1][c], M[2][b])))[1]], [0, 0]);
  const e3 = rfCabs2(det);
  const P = (l) => ((l - e1) * l + e2) * l - e3, dP = (l) => (3 * l - 2 * e1) * l + e2;
  let l3 = e1; for (let i = 0; i < 100; i++) { const d = P(l3) / dP(l3); l3 -= d; if (Math.abs(d) < 1e-15 * l3) break; }
  const p = e3 / l3, sm = (e2 - p) / l3, disc = Math.max(sm * sm - 4 * p, 0);
  const l2 = (sm + Math.sqrt(disc)) / 2, l1 = p / l2;
  const lam = [l1, l2, l3];
  return { masses: lam.map(Math.sqrt), F: { doublet: FL, singlet: FR },
    certificate: { invariants: { e1, e2, e3 },
      reconstructed: { trace: l1 + l2 + l3, minors: l1 * l2 + l1 * l3 + l2 * l3, det: l1 * l2 * l3 },
      cubicResidualRelative: lam.map((l) => P(l) / (dP(l) * l)) } };
}


/* The first KK gluon with three generations: doublets cQ[3] (LH), singlets cU[3], cD[3] (RH), all in lab convention.
 * Γ/M sums (g_L² + g_R²) over the six flavours — a trace, so basis independent.  BR(tt̄) takes the top coupling
 * flavour-diagonal (Q_3, u_3): the rotation to the mass basis is not applied, and that is declared, not hidden. */
export function rfOctetGenerations({ kL, MGeV, cQ, cU, cD, mTopGeV = 172.5 }) {
  const g1 = rfGaugeModes(kL, 1)[0], C = (c, ch) => rfCoupling(c, ch, kL, g1);
  const gQ = cQ.map((c) => C(c, "L")), gU = cU.map((c) => C(c, "R")), gD = cD.map((c) => C(c, "R"));
  const aS = alphasRun(MGeV);
  const per = [0, 1, 2].flatMap((i) => [
    { q: ["u", "c", "t"][i], w: i === 2 ? xsTopThreshold(gQ[2].value, gU[2].value, MGeV, mTopGeV) : gQ[i].value ** 2 + gU[i].value ** 2 },
    { q: ["d", "s", "b"][i], w: gQ[i].value ** 2 + gD[i].value ** 2 }]);
  const total = per.reduce((t, x) => t + x.w, 0), top = per.find((x) => x.q === "t").w;
  const shifts = [...gQ, ...gU, ...gD].map((x) => Math.abs(x.doubledShift));
  return { x1: g1.x, couplings: { Q: gQ.map((x) => x.value), U: gU.map((x) => x.value), D: gD.map((x) => x.value) },
    alphas: aS, GoverM: (aS / 12) * total, BR_tt: top / total, BR_4t_pair: (top / total) ** 2,
    perFlavourWeight: Object.fromEntries(per.map((x) => [x.q, x.w])),
    certificate: { claim: `first KK gluon x_1 = ${g1.x} at kL = ${kL} and the nine zero-mode couplings g_1(c)/g_s`,
      root: { x1: g1.x, bracket: g1.bracket, residual: g1.residual, wronskianAtRoot: g1.wronskianAtRoot },
      worstCouplingShift_gs: Math.max(...shifts), normRelativeShift: g1.norm.relativeShift,
      check: "data/rs_fermions_reference.json → benchmark.coupling_g1 (40 digits, paper convention mapped)" },
    approximation: "top coupling flavour-diagonal (Q_3, u_3); mass-basis rotation not applied (CKM-sized mixing)" };
}

export function rfModel(input = {}) {
  const p = rfValidate(input), gm = rfGaugeModes(p.kL, p.modes), g1 = gm[0];
  const C = (c, ch) => rfCoupling(c, ch, p.kL, g1);
  const k = { lightL: C(p.cL.light, "L"), lightR: C(p.cR.light, "R"), Q3: C(p.cL.Q3, "L"),
              tR: C(p.cR.tR, "R"), bR: C(p.cR.bR, "R") };
  const orth = C(0.5, "L");                      /* must vanish: flat-profile quark ⟂ every KK mode */
  const aS = alphasRun(p.MGeV);
  const sum = { light: 4 * (k.lightL.value ** 2 + k.lightR.value ** 2),
                b: k.Q3.value ** 2 + k.bR.value ** 2, t: xsTopThreshold(k.Q3.value, k.tR.value, p.MGeV, p.mTopGeV) };
  const total = sum.light + sum.b + sum.t;
  const flatCheck = (aS / 12) * (6 * (2 + 2));      /* universal √2 g_s couplings, massless */
  const src = RF_SOURCE;
  const values = {
    x1: val(g1.x, { units: "m_1 R'", status: STATUS.VERIFIED, source: src }),
    g_light_L: val(k.lightL.value, { units: "g_s", status: STATUS.VERIFIED, source: src }),
    g_light_R: val(k.lightR.value, { units: "g_s", status: STATUS.VERIFIED, source: src }),
    g_Q3: val(k.Q3.value, { units: "g_s", status: STATUS.VERIFIED, source: src }),
    g_tR: val(k.tR.value, { units: "g_s", status: STATUS.VERIFIED, source: src }),
    g_bR: val(k.bR.value, { units: "g_s", status: STATUS.VERIFIED, source: src }),
    F_Q3: val(rfZeroModeF(p.cL.Q3, p.kL, "L"), { status: STATUS.THEOREM, source: "closed form; F(1/2)² = 1/kL by the limit" }),
    F_tR: val(rfZeroModeF(p.cR.tR, p.kL, "R"), { status: STATUS.THEOREM, source: "closed form, F(−c) for RH" }),
    BR_tt: val(sum.t / total, { status: STATUS.MEASURED, source: src + "; alpha_s one-loop (collider.mjs); c values are inputs" }),
    BR_4t_pair: val((sum.t / total) ** 2, { status: STATUS.MEASURED, source: "square of BR_tt: both octets of a pair to tt̄" }),
    GoverM: val((aS / 12) * total, { status: STATUS.MEASURED, source: src + "; leading-order widths to quark pairs only" }),
    production: unknown("no cross section is computed here: needs parton luminosities (planned) or a matrix-element generator"),
    quark_masses: unknown("the c values are inputs, not fitted: the zero-mode Yukawa map m proportional to F(c_L)F(−c_R) is not inverted here"),
  };
  const worstShift = Math.max(...Object.values(k).map((x) => Math.abs(x.doubledShift)));
  const certificates = {
    gauge_root: { claim: `x_1 = m_1 R' = ${g1.x} at kL = ${p.kL}`,
      witness: { bracket: g1.bracket, residual: g1.residual, wronskianAtRoot: g1.wronskianAtRoot },
      method: "sign change of J0(x e^{-kL}) Y0(x) − J0(x) Y0(x e^{-kL}) on a 0.01 grid, 80 bisections",
      check: "data/rs_fermions_reference.json gives the same root at 40 digits (tools/rs_fermions_sage_control.py)" },
    integrals: { claim: "every coupling and the mode normalisation are converged quadratures",
      witness: { rule: "Simpson in u = ln z", panels: g1.norm.panels,
                 worstCouplingShift_gs: worstShift, normRelativeShift: g1.norm.relativeShift },
      method: "each value is recomputed with half the panels; the shift is the witness",
      check: "40-digit mpmath quadrature in the reference file" },
    orthogonality: { claim: "a c = 1/2 quark (flat profile) does not couple to the KK gluon",
      witness: { coupling_c_half: orth.value }, method: "the same quadrature at c = 1/2",
      check: "∫ du f_1 f_0 = 0 by the Sturm–Liouville orthogonality of the Neumann tower" },
    width_convention: { claim: "the width formula reduces to the flat theorem Γ/M = 2α_s",
      witness: { fromConvention: flatCheck, theorem: 2 * aS, difference: flatCheck - 2 * aS },
      method: "universal √2 g_s couplings to six massless quarks inserted in the same formula",
      check: "collider.mjs coloronOf: Γ/M = 2α_s (Part VII, DMN01, Simmons)" },
    conventions: { claim: "c has the meaning of ruFermion in rs_unification.mjs",
      witness: { LH_UV_for: "c > 1/2", RH_UV_for: "c < -1/2" },
      check: "_test_rs_fermions.mjs compares localisation with ruFermion on a grid" },
  };
  return { parameters: p, values, certificates, alphas: aS,
    modes: gm.map(({ n, x, bracket, residual, wronskianAtRoot, norm }) => ({ n, x, bracket, residual, wronskianAtRoot,
                                                                             normRelativeShift: norm.relativeShift })),
    scope: "Zero-mode quarks only; leading-order widths of the first KK gluon to quark pairs; ratios, no absolute scale.",
    unknown: ["Fermion KK towers and their mixing with zero modes", "Production cross sections",
              "Fit of the c values to quark masses and flavour/electroweak constraints", "Brane kinetic terms for the gluon"] };
}

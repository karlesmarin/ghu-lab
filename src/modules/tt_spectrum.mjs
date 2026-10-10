/* tt_spectrum.mjs — the m(tt̄) spectrum with a colour-octet vector in the s channel, interference with QCD included,
 * against the CMS parton-level measurement.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY.  A broad KK gluon (Γ/M ≈ 0.1–0.2) does not show up as a bump only: below the pole its amplitude interferes
 * with the QCD gluon in q q̄ → tt̄, and that interference is first order in the new coupling.  The resonance-search
 * comparison (kk_gluon_lhc.mjs) leaves it as an unknown; this module computes it, bin by bin, in the binning of the
 * CMS measurement (TOP-20-001, arXiv:2108.02803, HEPData ins1901295, 15 bins 250–3500 GeV, full covariance).
 *
 * PARTONIC CROSS SECTIONS, LO, spin- and colour-averaged, r = m_t²/ŝ, β = √(1 − 4r), ρ = 4r:
 *   q q̄ → tt̄ (QCD)   σ̂ = (8π α_s²/(27 ŝ)) β (1 + 2r)
 *   g g → tt̄ (QCD)   σ̂ = (π α_s²/(3 ŝ)) [ (1 + ρ + ρ²/16) ln((1+β)/(1−β)) − β (7/4 + 31ρ/16) ]      (Combridge 1979)
 *   octet V          σ̂_V   = (2π α_V²/27) ŝ S_q F_t / D,   S_q = c_L² + c_R² of the light quark, F_t = xsTopThreshold
 *   interference     σ̂_int = (16π α_s α_V/27) β (1 + 2r) v_q v_t (ŝ − M²) / D,   v = (c_L + c_R)/2,
 *                    D = (ŝ − M²)² + M² Γ²  (fixed width).
 * The axial couplings interfere with the vector gluon only in the forward–backward asymmetry, so they drop out of
 * dσ/dm.  Couplings c are in units of g_s; α_V = α_s(M) at the KK vertices (as in the σ × BR of kk_gluon_lhc.mjs),
 * α_s(√ŝ) at the QCD ones.  Controls (certificates): a massless V with c_L = c_R = 1 reproduces q q̄ → tt̄ of QCD
 * exactly, and its interference twice that; σ̂_V equals the Breit–Wigner integrand of xsSigmaBW point by point.
 *
 * HADRONIC.  dσ/dm = (2m/s) Σ_ab dL_ab/dτ(m²/s) σ̂_ab(m²), luminosities from xs_lumi_reference.mjs at μ = √ŝ,
 * averaged over each bin by Simpson (the half-panel shift is the witness).
 *
 * AGAINST THE DATA.  The LO SM normalisation is not the measured one (no NNLO K-factor here), so the comparison is
 * multiplicative: R_i = (σ_V + σ_int)_i / σ_SM,i at LO and the predicted shift Δ_i = R_i × d_i.  Δχ² = Δᵀ C⁻¹ Δ is the
 * separation of SM and SM + V in units of the measured covariance — an expected sensitivity if the data equal the SM,
 * not an exclusion.
 */

import { xsLumi, xsTopThreshold } from "./resonance_xsec.mjs";

const TTS_GEV2_TO_PB = 3.8937937e8;
const TTS_QUARKS = ["uu", "dd", "ss", "cc", "bb"];

/* The partonic cross sections at one ŝ, in GeV⁻².  o: { mt, aS, aV, M, G, Sq, vq, cTL, cTR }. */
export function ttsPartonic(sh, o) {
  const r = o.mt * o.mt / sh;
  if (4 * r >= 1) return { qq: 0, gg: 0, V: 0, int: 0 };
  const b = Math.sqrt(1 - 4 * r), rho = 4 * r, D = (sh - o.M * o.M) ** 2 + o.M * o.M * o.G * o.G;
  const vt = (o.cTL + o.cTR) / 2;
  return {
    qq: 8 * Math.PI * o.aS * o.aS / (27 * sh) * b * (1 + 2 * r),
    gg: Math.PI * o.aS * o.aS / (3 * sh) * ((1 + rho + rho * rho / 16) * Math.log((1 + b) / (1 - b)) - b * (7 / 4 + 31 * rho / 16)),
    V: 2 * Math.PI * o.aV * o.aV / 27 * sh * o.Sq * xsTopThreshold(o.cTL, o.cTR, Math.sqrt(sh), o.mt) / D,
    int: 16 * Math.PI * o.aS * o.aV / 27 * b * (1 + 2 * r) * o.vq * vt * (sh - o.M * o.M) / D,
  };
}

/* dσ/dm at one m (pb/GeV), split into SM q q̄, SM g g, V and interference.
 * p: { MGeV, GammaGeV, gq: {uu:[cL,cR], ...}, top: [cL,cR], aS: (μ) => α_s, aV, mt, scale } */
function ttsDensity(lumi, p, m) {
  const s = lumi.sqrts_GeV ** 2, sh = m * m, jac = 2 * m / s * TTS_GEV2_TO_PB;
  const base = { mt: p.mt, aS: p.aS(m), aV: p.aV, M: p.MGeV, G: p.GammaGeV, cTL: p.top[0], cTR: p.top[1] };
  let qq = 0, V = 0, int = 0;
  for (const q of TTS_QUARKS) {
    const [cL, cR] = p.gq[q] || [0, 0], L = xsLumi(lumi, q, m, p.scale);
    const x = ttsPartonic(sh, { ...base, Sq: cL * cL + cR * cR, vq: (cL + cR) / 2 });
    qq += L * x.qq; V += L * x.V; int += L * x.int;
  }
  const gg = xsLumi(lumi, "gg", m, p.scale) * ttsPartonic(sh, { ...base, Sq: 0, vq: 0 }).gg;
  return { qq: qq * jac, gg: gg * jac, V: V * jac, int: int * jac };
}

const ttsAdd = (a, b, w = 1) => ({ qq: a.qq + w * b.qq, gg: a.gg + w * b.gg, V: a.V + w * b.V, int: a.int + w * b.int });
const TTS_ZERO = { qq: 0, gg: 0, V: 0, int: 0 };

/* Bin averages of each piece; the integrand vanishes below 2 m_t, so integration starts there.  The luminosity is
 * piecewise log-linear on a 10 GeV grid (Simpson converges as h², not h⁴): the half-panel shift is reported. */
export function ttsSpectrum(lumi, input) {
  const p = { mt: 172.5, scale: "mu=sqrt(shat)", panels: 400, ...input };
  if (!(p.panels >= 8 && p.panels % 4 === 0)) throw new RangeError("panels must be a multiple of 4, ≥ 8");
  const simpson = (a, b, n) => {
    if (b <= a) return TTS_ZERO;
    const h = (b - a) / n; let acc = TTS_ZERO;
    for (let i = 0; i <= n; i++) acc = ttsAdd(acc, ttsDensity(lumi, p, a + i * h), (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2));
    return { qq: acc.qq * h / 3, gg: acc.gg * h / 3, V: acc.V * h / 3, int: acc.int * h / 3 };
  };
  let worstShift = 0;
  const bins = p.bins.map(([lo, hi]) => {
    const a = Math.max(lo, 2 * p.mt * (1 + 1e-9)), w = hi - lo, f = simpson(a, hi, p.panels), c = simpson(a, hi, p.panels / 2);
    const sm = (f.qq + f.gg) / w, bsm = (f.V + f.int) / w, smC = (c.qq + c.gg) / w, bsmC = (c.V + c.int) / w;
    const shift = Math.max(Math.abs(sm - smC) / sm, Math.abs(bsm - bsmC) / sm);   /* in units of the SM: what R feels */
    worstShift = Math.max(worstShift, shift);
    return { lo, hi, sm, smQQ: f.qq / w, smGG: f.gg / w, V: f.V / w, int: f.int / w, R: bsm / sm, shiftVsHalf: shift };
  });
  return { bins, worstShiftVsHalf: worstShift, panels: p.panels };
}

/* Cholesky of a symmetric positive-definite matrix (lower factor); throws if it is not positive definite. */
export function ttsCholesky(C) {
  const n = C.length, L = C.map(() => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    let d = C[j][j];
    for (let k = 0; k < j; k++) d -= L[j][k] * L[j][k];
    if (!(d > 0)) throw new RangeError(`covariance not positive definite at row ${j}`);
    L[j][j] = Math.sqrt(d);
    for (let i = j + 1; i < n; i++) {
      let s = C[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = s / L[j][j];
    }
  }
  return L;
}

/* x = C⁻¹ b through the Cholesky factor, with the residual max|C x − b| / max|b| as witness. */
export function ttsSolve(C, b) {
  /* the factor reads only the lower triangle, so a corrupted upper triangle would pass unseen (consultation T133) */
  const n0 = b.length;
  if (C.length !== n0 || C.some((row) => row.length !== n0)) throw new Error(`ttsSolve: matrix is not ${n0}×${n0}`);
  for (let i = 0; i < n0; i++) for (let j = 0; j < i; j++)
    if (Math.abs(C[i][j] - C[j][i]) > 1e-12 * Math.sqrt(Math.abs(C[i][i] * C[j][j]))) throw new Error(`ttsSolve: matrix not symmetric at (${i},${j})`);
  const L = ttsCholesky(C), n = b.length, y = new Array(n), x = new Array(n);
  for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
  const bmax = Math.max(...b.map(Math.abs)) || 1;
  const residual = Math.max(...C.map((row, i) => Math.abs(row.reduce((a, c, k) => a + c * x[k], 0) - b[i]))) / bmax;
  return { x, residual };
}

/* Δχ² of the predicted shift Δ_i = R_i d_i under the measured covariance. */
export function ttsSensitivity(R, data, cov) {
  const delta = R.map((r, i) => r * data[i]), { x, residual } = ttsSolve(cov, delta);
  const chi2 = delta.reduce((a, d, i) => a + d * x[i], 0);
  const pull = delta.map((d, i) => d / Math.sqrt(cov[i][i]));
  return { delta, chi2, pull, residual };
}

/* the tolerances of _test_tt_spectrum.mjs, so the card judges the live check by the same rule as the harness */
export const TTS_REFERENCE_TOLERANCE = { partonic: 1e-9, gg: 1e-6, sm: 1e-3, octet: 1e-4 };

/* The independent reference (tools/tt_spectrum_reference.py, pinned as TTS_REFERENCE): partonic pieces from Dirac-matrix
 * traces, gg from the differential Combridge |M|², hadronic bins with LHAPDF called directly.  Returns the worst
 * relative differences and how many comparisons each one rests on; used by the harness and live by the KK-gluon card.
 * A first version started every maximum at 0, so an empty reference returned perfect agreement having compared
 * nothing (consultation T133): now a block with no comparison, or a non-finite difference, reads as Infinity. */
export function ttsReferenceCheck(lumi, ref) {
  const checked = { partonic: 0, gg: 0, sm: 0, octet: 0 }, worst = { partonic: 0, gg: 0, sm: 0, octet: 0 };
  const note = (key, d) => { checked[key]++; worst[key] = Number.isFinite(d) ? Math.max(worst[key], d) : Infinity; };
  for (const k of ref.partonic || []) {
    const [qL, qR] = k.cq, [tL, tR] = k.ct;
    const x = ttsPartonic(k.shat, { mt: k.mt, aS: k.alpha, aV: k.alphaV, M: k.M, G: k.Gam, Sq: qL * qL + qR * qR, vq: (qL + qR) / 2, cTL: tL, cTR: tR });
    for (const t of ["qq", "V", "int"]) note("partonic", Math.abs(x[t] / k["sigma_" + t] - 1));
  }
  for (const k of ref.gg_textbook || [])
    note("gg", Math.abs(ttsPartonic(k.shat, { mt: k.mt, aS: k.alpha, aV: 0, M: 0, G: 0, Sq: 0, vq: 0, cTL: 0, cTR: 0 }).gg / k.sigma_gg_textbook - 1));
  const aS = (mu) => ref.alpha_s.aZ / (1 + ref.alpha_s.aZ * ((33 - 2 * ref.alpha_s.nf) / (12 * Math.PI)) * 2 * Math.log(mu / ref.alpha_s.MZ));
  const bins = (ref.bins || []).map((b) => [b.lo, b.hi]);
  if (bins.length) for (const [name, o] of Object.entries(ref.octets || {})) {
    const s = ttsSpectrum(lumi, { mt: ref.mt, MGeV: o.M, GammaGeV: o.GoverM * o.M, gq: o.cq, top: o.ct, aS, aV: aS(o.M), bins });
    ref.bins.forEach((b, i) => { const smRef = b.qq + b.gg, j = s.bins[i];
      note("sm", Math.abs(j.sm / smRef - 1));
      note("octet", Math.abs((j.V + j.int) - (b[name + "_V"] + b[name + "_int"])) / smRef); });
  }
  for (const key of Object.keys(worst)) if (!checked[key]) worst[key] = Infinity;
  const failures = Object.keys(worst).filter((key) => !(worst[key] < TTS_REFERENCE_TOLERANCE[key]));
  return { ...worst, checked, tolerance: TTS_REFERENCE_TOLERANCE, passed: failures.length === 0, failures };
}

/* Shape control: the LO SM spectrum, normalised over the measured range, against CMS's normalised spectrum.  The
 * normalised covariance is singular (the bins sum to one), so the last bin is dropped, as is standard. */
export function ttsShapeControl(bins, norm) {
  const tot = bins.reduce((a, b) => a + b.sm * (b.hi - b.lo), 0), shape = bins.map((b) => b.sm / tot);
  const n = shape.length - 1, res = shape.slice(0, n).map((s, i) => norm.value[i] - s);
  const C = norm.covariance.slice(0, n).map((row) => row.slice(0, n)), { x, residual } = ttsSolve(C, res);
  return { shape, ratioDataOverLO: shape.map((s, i) => norm.value[i] / s), chi2: res.reduce((a, r, i) => a + r * x[i], 0), ndof: n, residual };
}

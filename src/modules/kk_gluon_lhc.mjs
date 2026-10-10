/* kk_gluon_lhc.mjs — the first KK gluon against the LHC: couplings, widths, σ × BR and r = σ/limit, every number with
 * its status and its witness.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * TWO REALISATIONS, ONE QUESTION.  Flat GHU (collider.mjs, Part VII): every quark couples √2 g_s, Γ/M = 2α_s.
 * Warped (rs_fermions.mjs): a zero-mode quark of bulk mass c couples g_1(c)/g_s; three generations.
 * TWO DATA SETS.  ATLAS tt̄ resonances (arXiv:2512.17856, Γ/M = 30% template) and CMS dijets (arXiv:1911.03947,
 * spin-1 qq limits at 1/10/30/55% width, interpolated log-linearly in the width).  The comparison is SModelS's
 * r = prediction / limit (DESIGN D9); the tool states r and lets the user conclude.
 * CONVENTIONS, as the experiments use them: tt̄ — Breit–Wigner σ × BR at LO (ATLAS's own theory curve is the
 * control, with its chiral top couplings: within 15% from 1 to 4 TeV, 15–18% low at 4.5–5 TeV); dijet — narrow-width σ × B × A × K as CMS computes its models
 * (B = five light quarks, top in the width only; A = (1 + cos²θ*) acceptance of |Δη| < 1.1; K = CMS's coloron K).
 * Above ~6 TeV the q q̄ luminosity differs between PDF sets by more than 20%: that systematic is shown, not hidden.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { alphasRun } from "./collider.mjs";
import { rfOctetGenerations } from "./rs_fermions.mjs";
import { xsSigmaNWA, xsSigmaBW, xsAcceptance, xsTopThreshold } from "./resonance_xsec.mjs";
import { XS_LUMI } from "./xs_lumi_reference.mjs";
import { XS_LIMITS } from "./xs_limits_reference.mjs";
import { RF_BENCHMARK } from "./rf_benchmark_reference.mjs";
import { ttsPartonic, ttsSpectrum, ttsSensitivity, ttsShapeControl, ttsReferenceCheck } from "./tt_spectrum.mjs";
import { TT_CMS } from "./tt_cms_reference.mjs";
import { TTS_REFERENCE } from "./tts_reference.mjs";

export const KKG_LIMITS = { MTeV: [1, 8], kL: [8, 40], c: [-1.2, 1.2] };

/* realisation: 0 flat GHU, 1 warped.  alphasSet: 0 the PDF set's α_s(MZ) = 0.130, 1 the lab's 0.118; either is run at
 * one loop, nf = 6, not read from the PDF set's own α_s table (consultation T133). */
export function kkgValidate(input = {}) {
  /* cQ2, cU2, cD1, cD2: null = equal to the light value; the published point sets all nine (consultation T133) */
  const p = { realisation: 1, MTeV: 3.75, kL: 35, cQ3: 0.3, cTR: 0.3, cLightL: 0.6, cLightR: -0.6, cBR: -0.6,
              cQ2: null, cU2: null, cD1: null, cD2: null, alphasSet: 0, ttTheory: 0.10, ...input };
  for (const k of ["cQ2", "cU2", "cD1", "cD2"])
    if (p[k] !== null && !(p[k] >= KKG_LIMITS.c[0] && p[k] <= KKG_LIMITS.c[1])) throw new RangeError(`${k} outside −1.2…1.2 (or null)`);
  if (!(p.ttTheory >= 0 && p.ttTheory <= 0.5)) throw new RangeError("ttTheory (SM theory uncertainty per bin) outside 0…0.5");
  for (const k of ["realisation", "alphasSet"]) if (![0, 1].includes(p[k])) throw new RangeError(`${k} must be 0 or 1`);
  if (!(p.MTeV >= KKG_LIMITS.MTeV[0] && p.MTeV <= KKG_LIMITS.MTeV[1])) throw new RangeError("Mass outside 1…8 TeV");
  if (!(p.kL >= KKG_LIMITS.kL[0] && p.kL <= KKG_LIMITS.kL[1])) throw new RangeError("kL outside 8…40");
  for (const k of ["cQ3", "cTR", "cLightL", "cLightR", "cBR"])
    if (!(p[k] >= KKG_LIMITS.c[0] && p[k] <= KKG_LIMITS.c[1])) throw new RangeError(`${k} outside −1.2…1.2`);
  return p;
}

/* The published reference point (arXiv:0807.4937 Sec. 6.3), mapped to the lab's c: doublets −c_Q, singlets +c_q.
 * All nine bulk masses, in the flavour-diagonal (zero-mode) approximation: no mass-basis rotations.  A first version
 * set Q₂ = Q₁ and d₁ = d₂ = u₁; at 3.75 TeV that moved σ × BR(tt̄) by 1.2% and the dijet σ × B by 19% (T133). */
export function kkgBenchmarkInputs() {
  const c = Object.fromEntries(Object.entries(RF_BENCHMARK.c_paper).map(([k, v]) => [k, Number(v)]));
  return { realisation: 1, kL: Number(RF_BENCHMARK.L), MTeV: 3.75, cQ3: -c.Q_3, cTR: c.u_3, cLightL: -c.Q_1, cLightR: c.u_1, cBR: c.d_3,
           cQ2: -c.Q_2, cU2: c.u_2, cD1: c.d_1, cD2: c.d_2, alphasSet: 0 };
}

const kkgLogInterp = (xs, ys, x) => {
  if (x < xs[0] || x > xs[xs.length - 1]) return null;
  let i = 0; while (xs[i + 1] < x) i++;
  if (ys[i] == null || ys[i + 1] == null) return null;
  const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
  return Math.exp((1 - t) * Math.log(ys[i]) + t * Math.log(ys[i + 1]));
};

/* couplings once (they do not depend on M); widths and rates per mass. */
function kkgCouplings(p) {
  if (p.realisation === 0) {
    const g = Math.SQRT2;
    return { x1: null, gQ: [g, g, g], gU: [g, g, g], gD: [g, g, g], certificate: { claim: "√2 g_s to every quark, Γ/M = 2α_s", check: "collider.mjs coloronOf; _test_collider.mjs" } };
  }
  const o = rfOctetGenerations({ kL: p.kL, MGeV: 3000, cQ: [p.cLightL, p.cQ2 ?? p.cLightL, p.cQ3], cU: [p.cLightR, p.cU2 ?? p.cLightR, p.cTR],
                                 cD: [p.cD1 ?? p.cLightR, p.cD2 ?? p.cLightR, p.cBR] });
  return { x1: o.x1, gQ: o.couplings.Q, gU: o.couplings.U, gD: o.couplings.D, certificate: o.certificate };
}

function kkgAtMass(p, C, MGeV) {
  const aS = p.alphasSet === 0 ? alphasRun(MGeV, { aZ: XS_LUMI.pdf.alphas_MZ }) : alphasRun(MGeV);
  const w = { u: C.gQ[0] ** 2 + C.gU[0] ** 2, c: C.gQ[1] ** 2 + C.gU[1] ** 2, t: xsTopThreshold(C.gQ[2], C.gU[2], MGeV),
              d: C.gQ[0] ** 2 + C.gD[0] ** 2, s: C.gQ[1] ** 2 + C.gD[1] ** 2, b: C.gQ[2] ** 2 + C.gD[2] ** 2 };
  const tot = Object.values(w).reduce((a, b) => a + b, 0), GoverM = (aS / 12) * tot;
  const gq = { uu: [C.gQ[0], C.gU[0]], dd: [C.gQ[0], C.gD[0]], ss: [C.gQ[1], C.gD[1]], cc: [C.gQ[1], C.gU[1]], bb: [C.gQ[2], C.gD[2]] };
  const BRtt = w.t / tot, BRjj = (w.u + w.c + w.d + w.s + w.b) / tot;
  return { aS, GoverM, BRtt, BRjj, gq };
}

export function kkgModel(input = {}) {
  const p = kkgValidate(input), C = kkgCouplings(p), A = XS_LIMITS.atlas_tt, D = XS_LIMITS.cms_dijet;
  const Kc = (M) => 1.1 + (1.3 - 1.1) * (M - 600) / (8100 - 600), Acc = xsAcceptance(1.1, "vector");
  const tt = (M) => { const m = kkgAtMass(p, C, M), bw = xsSigmaBW(XS_LUMI, { MGeV: M, alphas: m.aS, gq: m.gq, GammaOverM: m.GoverM, BRX: m.BRtt, topLR: [C.gQ[2], C.gU[2]] });
    return { M, ...m, sigmaBR_pb: bw.sigma_pb, bw, observed: kkgLogInterp(A.mass_TeV, A.observed_pb, M / 1000), expected: kkgLogInterp(A.mass_TeV, A.expected_pb, M / 1000) }; };
  const widthLimit = (M, g) => { const lo = kkgLogInterp(D.mass_GeV, D.width_limits_pb["0.10"], M), hi = kkgLogInterp(D.mass_GeV, D.width_limits_pb["0.30"], M);
    if (lo == null || hi == null || g < 0.10 || g > 0.30) return null;
    const t = (Math.log(g) - Math.log(0.10)) / (Math.log(0.30) - Math.log(0.10)); return Math.exp((1 - t) * Math.log(lo) + t * Math.log(hi)); };
  const jj = (M) => { const m = kkgAtMass(p, C, M), s = xsSigmaNWA(XS_LUMI, { MGeV: M, alphas: m.aS, gq: m.gq, BRX: m.BRjj }) * Acc * Kc(M);
    return { M, ...m, sigmaBA_pb: s, limitWidth: widthLimit(M, m.GoverM), limitNarrow: kkgLogInterp(D.mass_GeV, D.observed_narrow_pb, M) }; };
  const cross = (rows, num, den) => { for (let i = 0; i + 1 < rows.length; i++) { const a = rows[i], b = rows[i + 1];
    if (a[den] == null || b[den] == null) continue; const ra = a[num] / a[den], rb = b[num] / b[den];
    if (ra >= 1 && rb < 1) { const t = Math.log(ra) / (Math.log(ra) - Math.log(rb)); return a.M + t * (b.M - a.M); } } return null; };

  /* the m(tt̄) spectrum with interference, in the CMS binning (tt_spectrum.mjs); Δχ² is a sensitivity, not a limit */
  const T = TT_CMS.abs, ttBins = T.bin_low_GeV.map((lo, i) => [lo, T.bin_high_GeV[i]]);
  /* the experimental covariance plus an uncorrelated SM-theory uncertainty ttTheory × d_i per bin (the NNLO prediction
   * carries scale and PDF errors the measurement's covariance does not contain).  Both theory models are this tool's
   * assumptions, not CMS's: real scale and PDF errors are correlated across bins (consultation T133), so the fully
   * correlated normalisation is shown beside the diagonal one; the truth lies in neither by construction. */
  const covTh = T.covariance.map((row, i) => row.map((c, j) => i === j ? c + (p.ttTheory * T.value[i]) ** 2 : c));
  const covNorm = T.covariance.map((row, i) => row.map((c, j) => c + p.ttTheory ** 2 * T.value[i] * T.value[j]));
  const aSof = (mu) => p.alphasSet === 0 ? alphasRun(mu, { aZ: XS_LUMI.pdf.alphas_MZ }) : alphasRun(mu);
  const spec = (M) => { const m = kkgAtMass(p, C, M);
    const s = ttsSpectrum(XS_LUMI, { MGeV: M, GammaGeV: m.GoverM * M, gq: m.gq, top: [C.gQ[2], C.gU[2]], aS: aSof, aV: m.aS, bins: ttBins });
    const R = s.bins.map((b) => b.R);
    return { M, ...s, sensExp: ttsSensitivity(R, T.value, T.covariance), sens: ttsSensitivity(R, T.value, covTh) }; };
  const M = p.MTeV * 1000, here = tt(M), hereJ = jj(M), hereS = spec(M);
  const sensNorm = ttsSensitivity(hereS.bins.map((b) => b.R), T.value, covNorm);
  const scanS = []; for (let m = 1000; m <= 8000; m += 250) scanS.push(spec(m));
  let reachS = null;
  for (let i = 0; i + 1 < scanS.length; i++) { const a = scanS[i].sens.chi2, b = scanS[i + 1].sens.chi2;
    if (a >= 3.84 && b < 3.84) { const t = Math.log(a / 3.84) / Math.log(a / b); reachS = scanS[i].M + t * (scanS[i + 1].M - scanS[i].M); break; } }
  const shapeLO = ttsShapeControl(spec(8000).bins, TT_CMS.norm);   /* SM part does not depend on M */
  const refCheck = ttsReferenceCheck(XS_LUMI, TTS_REFERENCE);
  const ctl = ttsPartonic(1e6, { mt: 172.5, aS: 0.1, aV: 0.1, M: 0, G: 0, Sq: 2, vq: 1, cTL: 1, cTR: 1 });
  const vq = (C.gQ[0] + C.gU[0]) / 2, vt = (C.gQ[2] + C.gU[2]) / 2;
  const worstBin = hereS.bins.reduce((a, b) => Math.abs(b.R) > Math.abs(a.R) ? b : a);
  const scanTT = []; for (let m = 1000; m <= 5000; m += 250) scanTT.push(tt(m));
  const scanJJ = []; for (let m = 2000; m <= 6000; m += 100) scanJJ.push(jj(m));
  const exclTT = cross(scanTT, "sigmaBR_pb", "observed"), exclJJ = cross(scanJJ, "sigmaBA_pb", "limitWidth");
  const P = XS_LIMITS.pdf_systematic, pdfAt = (m) => kkgLogInterp(P.M_GeV, P.ratio_NNPDF_over_CTEQ6L1, m);
  const src = "kk_gluon_lhc.mjs (rs_fermions.mjs, resonance_xsec.mjs, xs_lumi_reference.mjs, xs_limits_reference.mjs)";
  const rTT = here.observed ? here.sigmaBR_pb / here.observed : null, rJJ = hereJ.limitWidth ? hereJ.sigmaBA_pb / hereJ.limitWidth : null;

  const values = {
    GoverM: val(here.GoverM, { status: STATUS.MEASURED, source: src + "; LO widths to quark pairs" }),
    BR_tt: val(here.BRtt, { status: STATUS.MEASURED, source: src }),
    BR_dijet: val(hereJ.BRjj, { status: STATUS.MEASURED, source: "five light quarks, top in the width only (CMS convention)" }),
    sigmaBR_tt_pb: val(here.sigmaBR_pb, { units: "pb", status: STATUS.MEASURED, source: src + "; LO Breit–Wigner, NNPDF2.3lo, no K" }),
    r_tt_observed: rTT == null ? unknown("mass outside the ATLAS grid (0.5–5 TeV)") : val(rTT, { status: STATUS.MEASURED, source: `ATLAS ${A.doi}` }),
    sigmaBA_dijet_pb: val(hereJ.sigmaBA_pb, { units: "pb", status: STATUS.MEASURED, source: src + "; NWA × B × A × K as CMS" }),
    r_dijet_width: rJJ == null ? unknown("no CMS width-interpolated limit here (needs 10% ≤ Γ/M ≤ 30% and 2.1–6 TeV)") : val(rJJ, { status: STATUS.MEASURED, source: `CMS ${D.spin1.doi}` }),
    /* A crossing is a COMPARISON with the experiment's benchmark limit, not a validated exclusion: a limit set with
     * one width template is not guaranteed conservative for another width (consultation T132, §5). */
    crossing_tt_GeV: exclTT == null ? unknown("r(tt̄) does not cross 1 between 1 and 5 TeV") : val(exclTT, { units: "GeV", status: STATUS.MEASURED, source: `r = 1 against ATLAS ${A.doi} (Γ/M = 30% template): a comparison with that benchmark, not a validated exclusion at Γ/M = ${here.GoverM.toFixed(3)}` }),
    crossing_dijet_GeV: exclJJ == null ? unknown("r(dijet) does not cross 1 where width-interpolated limits exist") : val(exclJJ, { units: "GeV", status: STATUS.MEASURED, source: `r = 1 against CMS ${D.spin1.doi} spin-1 qq limits interpolated (log-linear) to this width` }),
    low_tail_fraction_tt: val(here.bw.fractionBelowHalfM, { status: STATUS.MEASURED, source: "share of σ(tt̄) from √ŝ < M/2: where it is large, off-shell exchange and QCD interference dominate" }),
    pole_fraction_tt: val(here.bw.fractionWithinGamma, { status: STATUS.MEASURED, source: "share of σ(tt̄) from |√ŝ − M| < Γ" }),
    four_top: unknown("pair and associated (tt̄ G1) production need a matrix-element generator"),
    nlo: unknown("no K-factor for tt̄ (ATLAS's curve is LO too)"),
    /* interference: computed in the spectrum below.  Its sign below the pole is −sign(v_q v_t): destructive for
     * same-sign couplings (flat GHU), constructive for the warped reference point (v_q < 0 < v_t). */
    interference_below_pole: val(vq * vt > 0 ? "destructive" : vq * vt < 0 ? "constructive" : "none", { status: STATUS.THEOREM, source: `sign of −v_u v_t (σ̂_int proportional to v_q v_t (ŝ − M²)); v_u = ${vq.toFixed(3)}, v_t = ${vt.toFixed(3)}` }),
    tt_spectrum_dchi2: val(hereS.sens.chi2, { status: STATUS.MEASURED, source: `Δχ² = Δ · C⁻¹ · Δ over the 15 bins of CMS ${T.doi} (covariance ${T.covariance_doi}) plus ${(100 * p.ttTheory).toFixed(0)}% SM-theory uncertainty, uncorrelated between bins (an assumption of this tool, not CMS's theory model); Δ_i = R_i d_i at LO, i.e. the same K-factor for SM, octet and interference (assumed, not validated): an expected sensitivity if the data equal the SM, not an exclusion` }),
    tt_spectrum_dchi2_normalisation: val(sensNorm.chi2, { status: STATUS.MEASURED, source: `the same with the ${(100 * p.ttTheory).toFixed(0)}% SM-theory uncertainty fully correlated across bins (a free normalisation); the diagonal and the normalisation models bracket nothing by construction: they show how much the answer depends on an assumption CMS's correlated theory errors would fix` }),
    tt_spectrum_dchi2_experimental: val(hereS.sensExp.chi2, { status: STATUS.MEASURED, source: "the same with the experimental covariance alone (an upper bound on the sensitivity)" }),
    tt_spectrum_largest_shift: val(worstBin.R, { status: STATUS.MEASURED, source: `largest relative change of dσ/dm(tt̄), in the bin ${worstBin.lo}–${worstBin.hi} GeV (V + interference over the LO SM)` }),
    tt_spectrum_reach_GeV: reachS == null ? unknown("Δχ² does not cross 3.84 between 1 and 8 TeV") : val(reachS, { units: "GeV", status: STATUS.MEASURED, source: `mass where the expected Δχ² of the CMS m(tt̄) spectrum (with ${(100 * p.ttTheory).toFixed(0)}% SM-theory uncertainty, uncorrelated between bins: an assumption) falls to 3.84 (one parameter, Gaussian, 95% if the data equal the SM): a sensitivity, not a limit` }),
  };
  const certificates = {
    couplings: C.certificate,
    tt_integration: { claim: "Breit–Wigner integral converged over the whole luminosity grid",
      witness: { relativeShiftVsHalf: here.bw.relativeShiftVsHalf, lorentzianOutsideGrid: here.bw.lorentzianOutsideGrid },
      check: "_test_resonance_xsec.mjs: BW → NWA within 1% at Γ/M = 0.2%" },
    tt_control: { claim: "ATLAS's own LO theory curve for its chiral benchmark (g_tL = g_s, g_tR ≈ 4 g_s) is reproduced within 15% from 1 to 4 TeV; at 4.5–5 TeV this computation falls 15–18% below it, an unexplained mass slope",
      check: "_test_resonance_xsec.mjs (HEPData " + A.doi + ")" },
    dijet_control: { claim: "CMS's own coloron curve is reproduced within 4% from 2 to 5 TeV; the drift above follows the PDF luminosity ratio",
      check: "_test_kk_gluon_lhc.mjs (HEPData " + D.narrow.doi + ")" },
    acceptance: { claim: `A = ${Acc.toFixed(4)} for (1 + cos²θ*) and |Δη| < 1.1`, witness: { isotropic: xsAcceptance(1.1, "isotropic"), cmsQuotesIsotropic: 0.5 },
      check: "isotropic case = tanh(0.55) = 0.5005, CMS Sec. 7: «A ≈ 0.5»" },
    pdf: { claim: "q q̄ luminosity ratio NNPDF2.3lo / CTEQ6L1 at the input mass", witness: { ratio: pdfAt(M) }, check: P.source.tool },
    tt_spectrum_control: { claim: "a massless octet with c_L = c_R = 1 reproduces q q̄ → tt̄ of QCD, and its interference is twice that",
      witness: { V_over_QCD: ctl.V / ctl.qq, int_over_QCD: ctl.int / ctl.qq }, check: "_test_tt_spectrum.mjs (also σ̂_V = Breit–Wigner integrand of xsSigmaBW)" },
    tt_spectrum_reference: { claim: "the partonic pieces equal Dirac-matrix traces with chiral couplings and a massive top, gg equals the differential Combridge |M|², and the bins equal a computation with LHAPDF called directly (recomputed live)",
      witness: refCheck, check: `tools/tt_spectrum_reference.py (${TTS_REFERENCE.pdf.set}, LHAPDF ${TTS_REFERENCE.pdf.lhapdf_version}); _test_tt_spectrum.mjs, with mutants of the formulas caught` },
    tt_spectrum_integration: { claim: "bin averages converged; the covariance solve is exact to rounding",
      witness: { worstShiftVsHalf: hereS.worstShiftVsHalf, solveResidual: hereS.sens.residual }, check: "Simpson 400 vs 200 panels per bin; max|C x − Δ| / max|Δ|" },
    tt_spectrum_shape: { claim: "the LO SM shape against CMS's normalised spectrum: data/LO drifts upward with m(tt̄), so the multiplicative K-factor is an approximation at that level",
      witness: { chi2: shapeLO.chi2, ndof: shapeLO.ndof, ratioMin: Math.min(...shapeLO.ratioDataOverLO), ratioMax: Math.max(...shapeLO.ratioDataOverLO) },
      check: `CMS ${TT_CMS.norm.doi}, last bin dropped (normalised covariance is singular)` },
  };
  return { parameters: p, couplings: C, here, hereJ, hereS, scanTT, scanJJ, scanS, values, certificates,
    data: { atlas: { doi: A.doi, mass_TeV: A.mass_TeV, observed: A.observed_pb, expected: A.expected_pb },
            cms: { doi: D.spin1.doi, narrowDoi: D.narrow.doi },
            cmsTT: { doi: T.doi, covarianceDoi: T.covariance_doi, normDoi: TT_CMS.norm.doi, bins: ttBins, value: T.value, variance: T.covariance.map((row, i) => row[i]) } },
    scope: "LO; s-channel q q̄ production only; quark couplings flavour-diagonal (mass-basis rotation not applied); limits used in the experiments' conventions; the m(tt̄) spectrum compared multiplicatively (R × data).",
    unknown: ["Four-top (pair and associated) production", "NLO (K-factors of the octet and of the interference assumed equal to the SM's)", "Fit of the c values to quark masses inside this card (see the reference point)", "Fermion KK modes"] };
}

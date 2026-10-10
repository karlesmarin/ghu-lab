/* resonance_xsec.mjs — s-channel production of a colour-octet vector from q q̄, from pinned parton luminosities.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT IT ADDS.  The collider section compares a KK-gluon MASS with a bound.  A bound in an experimental paper is
 * on σ × BR, so the comparison that means something is r = σ×BR / limit (SModelS's register, DESIGN D9).  This
 * module supplies σ at leading order from data/parton_lumi_13TeV.json (tools/make_parton_lumi.py, LHAPDF,
 * NNPDF23_lo_as_0130_qed — the set ATLAS used for its own KK-gluon theory curve).
 *
 *   narrow width   σ = Σ_q (16π² (2J+1) C / (N_q N_q̄)) (Γ_q/M) BR (1/s) dL_qq̄/dτ |_{τ=M²/s}
 *                  with J = 1, C = 8, N_q = N_q̄ = 2·3  →  prefactor 32π²/3            (Han, TASI 2005, eq. for s-channel R)
 *   Breit–Wigner   σ = Σ_q ∫ dŝ (1/s) dL_qq̄/dτ(ŝ/s) · 16π (2J+1)C/(N N) · (ŝ/M²) Γ_q Γ_X(ŝ) / ((ŝ−M²)² + M²Γ²)
 *                  — the vector matrix element for massless initial quarks; it reduces to the narrow-width form as
 *                  Γ → 0, and that reduction is a certificate.
 * Leading order, no K-factor, no interference with QCD tt̄.  Units: pb (1 GeV⁻² = 3.8938e8 pb).
 */

const XS_GEV2_TO_PB = 3.8937937e8;
const XS_PREF = 32 * Math.PI ** 2 / 3;            /* 16π²·3·8/36 */

/* Parton-level angular acceptance of a dijet |Δη| cut for massless partons: |Δη| < Δ ⇔ |cos θ*| < tanh(Δ/2).
 * 'vector' = (1 + cos²θ*) of q q̄ → V → q q̄ with vector couplings; 'isotropic' = flat.  The isotropic case at
 * Δ = 1.1 gives 0.5005 — CMS's quoted "A ≈ 0.5" (arXiv:1911.03947 Sec. 7), the certificate of the map.
 * The |η| < 2.5 single-jet cut is not applied (CMS's isotropic 0.5 shows it is negligible there). */
export function xsAcceptance(detaMax, shape = "vector") {
  const c0 = Math.tanh(detaMax / 2);
  return shape === "isotropic" ? c0 : (3 / 8) * (2 * c0 + (2 * c0 ** 3) / 3);
}

/* log-linear interpolation of a luminosity column on the 10 GeV grid; refuses to extrapolate (DESIGN D7). */
export function xsLumi(lumi, ch, mGeV, scale = "mu=sqrt(shat)") {
  const g = lumi.grid_sqrtshat_GeV, col = lumi.tables[scale][ch];
  if (mGeV < g[0] || mGeV > g[g.length - 1]) throw new RangeError(`sqrt(shat) = ${mGeV} GeV outside the pinned grid`);
  const i = Math.min(Math.floor((mGeV - g[0]) / (g[1] - g[0])), g.length - 2), t = (mGeV - g[i]) / (g[i + 1] - g[i]);
  return Math.exp((1 - t) * Math.log(col[i]) + t * Math.log(col[i + 1]));
}

/* Chirality-dependent t t̄ threshold of a vector octet, normalised to (c_L² + c_R²) in the massless limit:
 * F_t(Q) = β [ (c_L² + c_R²)(1 − r) + 6 c_L c_R r ],  r = m_t²/Q², β = √(1 − 4r)   (Atre et al., arXiv:1206.1661 eq. 5).
 * Vector couplings (c_L = c_R = c) give 2c² β(1 + 2r); a pure axial coupling gives β³.  One function, shared by every
 * module that needs the top channel (DESIGN D3: the kernel knows the formula once). */
export function xsTopThreshold(cL, cR, QGeV, mTopGeV = 172.5) {
  const r = (mTopGeV * mTopGeV) / (QGeV * QGeV);
  if (4 * r >= 1) return 0;
  return Math.sqrt(1 - 4 * r) * ((cL * cL + cR * cR) * (1 - r) + 6 * cL * cR * r);
}

const XS_QUARKS = ["uu", "dd", "ss", "cc", "bb"];

/* gq: { uu: [gL, gR], dd: ..., ss, cc, bb } in units of g_s; GammaQoverM_q = (α_s/12)(gL²+gR²) per flavour. */
export function xsSigmaNWA(lumi, { MGeV, alphas, gq, BRX, scale }) {
  const s = lumi.sqrts_GeV ** 2;
  let sig = 0;
  for (const q of XS_QUARKS) {
    const [gL, gR] = gq[q] || [0, 0], GqM = (alphas / 12) * (gL * gL + gR * gR);
    sig += XS_PREF * GqM * BRX * xsLumi(lumi, q, MGeV, scale) / s;
  }
  return sig * XS_GEV2_TO_PB;
}

/* Breit–Wigner integrated over the whole pinned grid (above the tt̄ threshold), in θ = arctan((ŝ−M²)/(MΓ)), which
 * flattens the peak.  A first version integrated M ± 6Γ in √ŝ and lost 1 − (2/π)arctan 12 = 5.3% of a narrow
 * Lorentzian — caught by the BW → NWA certificate.  What the grid itself cuts is reported, not hidden. */
export function xsSigmaBW(lumi, { MGeV, alphas, gq, GammaOverM, BRX, mTopGeV = 172.5, scale, panels = 8000, topLR = [1, 1] }) {
  /* the luminosity interpolant is piecewise log-linear, so Simpson converges as h², not h⁴: the half-panel shift is
   * the honest witness (≤ 3e-4 at Γ/M = 0.2%, ≤ 2e-5 at 30%, 8000 panels). */
  const s = lumi.sqrts_GeV ** 2, M = MGeV, G = GammaOverM * M, gamX = BRX * G;
  const g = lumi.grid_sqrtshat_GeV, lo = Math.max(g[0], 2 * mTopGeV + 1), hi = g[g.length - 1];
  const thLo = Math.atan((lo * lo - M * M) / (M * G)), thHi = Math.atan((hi * hi - M * M) / (M * G));
  const outsideFraction = 1 - (thHi - thLo) / Math.PI;   /* of the bare Lorentzian, for the record */
  /* with no top coupling the threshold factor is 0 at the pole too: BRX = 0 gives σ = 0, not 0·0/0 (consultation T133) */
  const thrM = xsTopThreshold(topLR[0], topLR[1], M, mTopGeV);
  if (gamX !== 0 && !(thrM > 0)) throw new Error("xsSigmaBW: BRX > 0 but the top couplings give no width at the pole");
  const integrandTheta = (th) => {
    const sh = M * M + M * G * Math.tan(th), m = Math.min(Math.max(Math.sqrt(sh), lo), hi);   /* tan(atan x) overshoots by ulps */
    const gx = gamX === 0 ? 0 : gamX * xsTopThreshold(topLR[0], topLR[1], m, mTopGeV) / thrM;   /* chirality-aware */
    let sum = 0;
    for (const q of XS_QUARKS) {
      const [gL, gR] = gq[q] || [0, 0], Gq = (alphas / 12) * (gL * gL + gR * gR) * M;
      sum += xsLumi(lumi, q, m, scale) / s * 16 * Math.PI * (3 * 8 / 36) * Gq * gx * (sh / (M * M)) / (M * G);
    }
    return sum;                                      /* dŝ · BW = (ŝ/M²) dθ / (MΓ) */
  };
  /* Simpson in θ, also accumulating where the cross section comes from: the low tail (√ŝ < M/2) and the pole
   * (|√ŝ − M| < Γ).  When the low tail dominates, the "resonance" is largely off-shell exchange, and interference
   * with QCD and the transfer of a limit from another width template become the open questions (consultation T132). */
  const simpsonT = (n) => { const h = (thHi - thLo) / n; let t = 0, low = 0, pole = 0;
    for (let i = 0; i <= n; i++) { const th = thLo + i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2), f = w * integrandTheta(th);
      const m = Math.sqrt(Math.max(M * M + M * G * Math.tan(th), 0)); t += f; if (m < M / 2) low += f; if (Math.abs(m - M) < G) pole += f; }
    return { total: t * h / 3, low: low * h / 3, pole: pole * h / 3 }; };
  const fine = simpsonT(panels), coarse = simpsonT(panels / 2), fineT = fine.total, coarseT = coarse.total;
  return { sigma_pb: fineT * XS_GEV2_TO_PB, range: [lo, hi], panels, relativeShiftVsHalf: (fineT - coarseT) / fineT,
           lorentzianOutsideGrid: outsideFraction, fractionBelowHalfM: fine.low / fineT, fractionWithinGamma: fine.pole / fineT };
}

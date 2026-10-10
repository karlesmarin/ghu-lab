# The first KK gluon as a spin-1 colour octet in four-top production (study, 2026-10-10)

Reproduce: `node tools/kkgluon_fourtop.mjs` → `study.json`. Not wired into the app; no panel, no claim on the site.

**Question.** arXiv:2609.39381 (a four-top search for top-philic scalar singlets and octets) leaves "alternative spin
assignments" for future work. Where do the two GHU realisations of a vector colour octet sit relative to such a search?

**Method.** Flat GHU: `collider.mjs` (quarks at the fixed point, every mode couples √2·g_s, Γ/M = 2α_s). Warped:
`src/modules/rs_fermions.mjs` — the first Neumann–Neumann gauge mode on z ∈ [R, R′], R′/R = e^{kL}, built with this
lab's `raBessel`; a zero-mode quark of bulk mass c couples g₁(c)/g_s = ∫|χ_c|² f₁/f₀. Only ratios are reported, so the
anchor caveat on absolute TeV values does not apply. Leading-order widths to quark pairs; no production cross section,
interference or detector. Every warped row in `study.json` carries the module's certificates (root bracket, residual
and Wronskian; quadrature panels and doubled-panel shifts; orthogonality; width-convention reduction).

**Controls (all pass; `node _test_rs_fermions.mjs`, 295 checks).**
- Independent reference: `data/rs_fermions_reference.json`, mpmath at 40 digits inside SageMath
  (`tools/rs_fermions_sage_control.py`): 9 roots and 180 couplings agree to < 10⁻⁶ (roots < 10⁻¹⁰).
- A mutation test perturbing one coupling by 10⁻⁴, one root by 10⁻⁸ and one F(c) by 10⁻⁹ makes the harness fail in
  all three cases; the pinned reference is unchanged byte for byte.
- The width convention reproduces the flat theorem Γ/M = 2α_s exactly with universal √2·g_s couplings.
- m₁R′ = 2.4644 (kL = 26.67) and 2.4499 (kL = 35), the standard ≈ 2.45.
- The coupling at c = 1/2 vanishes (|g| < 10⁻⁸): orthogonality to the zero mode; g_R(c) = g_L(−c) exactly.
- Localisation agrees with `ruFermion` on a grid of c, so the laboratory has one meaning for c.

**Results.**

| realisation | g_t/g_s | BR(tt̄) | BR(4t, both decays) | Γ/M |
|---|---|---|---|---|
| flat GHU (coloron) | √2 (all quarks) | 0.167 | 0.028 | 0.15–0.17 |
| warped, c_R(t_R) = 0 | 3.4–4.0 (t_R), light −0.2 | 0.82 | 0.67 | 0.12–0.16 |
| warped, c_R(t_R) = 0.3 | 4.5–5.2 | 0.88 | 0.77 | 0.17–0.24 |
| warped, c_R(t_R) = 0.5 | 5.0–5.7 | 0.89–0.90 | 0.80 | 0.20–0.28 (α_s at 3–5 TeV) |

The c values follow the ruFermion convention of rs_unification.mjs (LH UV-localised for c > 1/2, RH for c < −1/2) and are illustrative inputs: light c_L = 0.6, c_R = −0.6; Q₃ c_L = 0.3; b_R c_R = −0.6. Not fitted to masses or electroweak data.

**Reading, with the experimental anchors (opened 2026-10-10).**
- Flat: democratic couplings; four tops carry under 3 % of pair decays, and the dijet bound applies
  (`experiment.mjs`, CMS 6.6 TeV). A four-top search is not the place to look for this object.
- Warped: top-philic and broad. tt̄-resonance searches already exclude it below 4.1 TeV (ATLAS, arXiv:2512.17856,
  Γ/M = 30 %) and 4.55 TeV (CMS-B2G-17-017, Γ/M 15–20 %, quoted in the ATLAS paper). At those masses QCD pair production
  is negligible, so four tops would come from tt̄G₁ associated production with a top coupling of 3.5–6 g_s and
  Γ/M ≥ 0.12: beyond both the mass reach (≈ 2 TeV) and the narrow-width regime of a search designed around octet pair
  production. Its handle is the coupling ratio g_t/g_q ≈ 20, which favours associated production over light-quark
  production; quantifying it needs cross sections, which this study does not compute.
- None of this is new physics: the top-philic, broad warped KK gluon is the standard RS result (Agashe et al.). What
  the study adds is the lab's own tower reproducing it, and the placement relative to a four-top search.

## Against data: σ×BR(tt̄) versus the ATLAS observed limit (`node tools/kkgluon_vs_atlas.mjs` → `atlas_contrast.json`)

**Inputs, all pinned with their provenance.**
- Parton luminosities: `data/parton_lumi_13TeV.json` from `tools/make_parton_lumi.py` in `tools/pdf.Dockerfile`
  (LHAPDF 6.5.6, NNPDF23_lo_as_0130_qed, LHAPDF ID 247000 — the set ATLAS used). Certificates: Simpson in ln x,
  worst half-panel shift 8·10⁻⁶; the set's own momentum sum rule is 1.005 (100 GeV) and 0.991 (3 TeV), converged,
  i.e. a property of the LO grid, not of the integration.
- Limits: HEPData ins3094414, Figure 10c, DOI 10.17182/hepdata.168229.v1/t15, raw bytes pinned with their sha256
  (`tools/pin_hepdata_atlas_tt.py`; the harness re-parses the raw record and compares every number it uses).
- Cross section: `src/modules/resonance_xsec.mjs`, LO, narrow width and Breit–Wigner (θ = arctan substitution over the
  whole grid), harness `_test_resonance_xsec.mjs` (29 checks; BW → NWA within 1 % at Γ/M = 0.2 %).
- Reference point: arXiv:0807.4937 Sec. 6.3, extracted from its LaTeX (`tools/make_rs_benchmark.py`), its six ZMA
  masses reproduced inside the rounding band of the printed inputs (`tools/rs_benchmark_band.mjs`) and against a
  40-digit mpmath SVD in the paper's own convention.

**Control — ATLAS's own theory curve for its benchmark** (g_q = −0.2 g_s, g_bL = g_tL = g_s, BR 0.925, Γ/M = 30 %):
with the benchmark's chiral top couplings (g_tR ≈ 4 g_s from its BR), ratio ours/ATLAS = 1.11 (1 TeV), 1.01 (2),
0.95 (3), 0.88 (4), 0.82 (5). Within 15 % from 1 to 4 TeV, 15–18 % low at 4.5–5 TeV. (Revised 10-oct after consultation
T133: the first version ran the vector threshold, which inflates the low tail and read 1.14 … 0.86, inside 15 % up to
5 TeV.) The mass slope is NOT explained (candidates: MadGraph's dynamic
scale, two-loop α_s, fixed versus running width) — consultation T132. The benchmark's "Γ/M = 30 %" and "BR = 92.5 %"
cannot both follow from a first-order width with its couplings; the couplings give BR = 92.6 % at Γ/M ≈ 15 %, so the
30 % is read as imposed in the generation.

**Result (observed limit, Γ/M = 30 % template).**
| point | Γ/M | BR(tt̄) | r = σ×BR/limit at 3.75 TeV | r = 1 crossing |
|---|---|---|---|---|
| arXiv:0807.4937 reference point (nine c, zero-mode) | 0.21 | 0.99 | 0.96 | ≈ 3.72 TeV |
| illustrative, c_R(t_R) = 0.3, kL = 35 | 0.23 | 0.88 | 1.36 | ≈ 4.0 TeV |

The reference point's own first KK gluon sits at 2.4476 × 1.5 TeV = 3.67 TeV: **at the edge of the ATLAS comparison**
(r ≈ 1.08), which within the ±15 % of the control is not a verdict either way. (Revised 10-oct, T133: the first table
set Q₂ = Q₁ and d₁ = d₂ = u₁; with all nine c of the paper σ × BR(tt̄) moves 1.2 % and the dijet σ × B 19 %. Still the
flavour-diagonal zero-mode approximation, without the mass-basis rotations.) A crossing is a comparison with the
experiment's Γ/M = 30 % benchmark, not a validated exclusion at Γ/M ≈ 0.2: a limit set with one width template is
**not guaranteed conservative** for another (an earlier version of this note said "conservative"; that was wrong —
consultation T132 §5). Scope: LO, no K-factor; the interference with QCD tt̄ matters exactly where the low tail
dominates (the card reports the low-tail and pole shares). Its sign below the pole is −sign(v_q v_t): constructive for
this reference point (v_u < 0 < v_t, as T132 computed for it), destructive for same-sign couplings such as flat GHU.
An earlier line here generalised "constructive below the pole" to every case; that was wrong (error E50).

**m(tt̄) spectrum with interference (added the same day).** The card now computes dσ/dm(tt̄) with the KK gluon and
its interference in the 15 bins of CMS TOP-20-001 (HEPData ins1901295) and the expected Δχ² against the measured
covariance plus a 10 % SM theory error (a sensitivity, not an exclusion). Δχ² = 3.84 at about 3.7 TeV for the
reference point (consistent with the ATLAS crossing, 3.73 TeV) and about 3.8 TeV for flat GHU (5.05 TeV with the
experimental covariance alone). Certified against an independent Dirac-trace + LHAPDF computation
(`tools/tt_spectrum_reference.py`); details in `docs/research-extensions.md`.

**Corrections after consultation T132 (same day).** The top threshold is chirality-dependent,
F_t = β[(c_L² + c_R²)(1 − r) + 6 c_L c_R r] (Atre et al. 1206.1661 eq. 5), now shared by every module
(`xsTopThreshold`); the earlier vector-only factor β(1 + 2r) mattered near threshold. The ATLAS benchmark's
"Γ/M = 30 %" and "BR = 92.5 %" remain mutually inconsistent at first order (g_tR tuned to 30 % would give BR ≈ 96 %).

**In the app.** All of this runs in **Collider → First KK gluon at the LHC** (`src/modules/kk_gluon_lhc.mjs`, harness
`_test_kk_gluon_lhc.mjs`, browser checks in `build/extensions.mjs`); the dijet contrast for the flat coloron is
`tools/coloron_vs_cms.mjs` → `cms_dijet_contrast.json`: CMS's own coloron curve reproduced within 4 % from 2 to 5 TeV,
its 6.6 TeV limit read back from its table, and the high-mass drift equal to the PDF luminosity ratio
(`data/pdf_systematic_cteq6l1.json`).

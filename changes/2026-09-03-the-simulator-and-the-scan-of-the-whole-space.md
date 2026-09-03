---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: The simulator, anchored to HHKY 2004, and a scan of the whole space against the data
verify: load on the SU(N) builder SU(3) with boundary condition [1, 0, 0, 2] and the bulk of Haba–Hosotani–Kawamura–Yamashita's Fig. 1 — two adjoint Dirac fermions with ηη′ = +, eight fundamental Dirac fermions with ηη′ = −, four and two fundamental scalars with ηη′ = ±. Open **Simulator**: the vacuum sits at a = 0.0583 (their 0.058), 1/R = 2.755 TeV from the measured W, and m_H = 54 GeV with g₄ = g₂(1/R) — their m_H R/g₄ = 0.031 reproduced as 0.0306 — printed beside 125.20 GeV. Turn the towers; move g₄ to 1.0 and watch m_H follow. Then read `data/scan_2026-09-03/predictions.md`.
---

what
: Three things, chained.

  **The running.** `src/kernel/running.mjs` runs the three couplings at one loop from M_Z, with
  the MS-bar inputs of the PDG 2024 electroweak review (α̂⁻¹ = 127.930, ŝ²_Z = 0.23129,
  α_s = 0.1187, M_Z = 91.1876) carried in `experiment.mjs` with source and date. At 6.6 TeV the
  Standard Model gives sin²θ_W = 0.253; the Georgi–Glashow 3/8 is 0.122 above it, and that
  number is the bill a model's Kaluza–Klein and brane sectors must pay, printed as such.

  **The simulator.** `src/modules/predict.mjs` and the section **Simulator**: the model on the
  builder, at its vacuum, turned into 1/R from the measured m_W, the Higgs mass from the
  curvature through HHKY's eq. (22) — m_H² = (3g₄²/32π⁶R²)·∂²(V/C)/∂a² — with g₄ = g₂(1/R)
  and no brane kinetic terms, sin²θ_W from the cell against the running, and every field's
  tower in GeV, each beside its measured partner and its source. Two pictures: the towers as a
  landscape the reader turns, with m_W, m_h, m_t as lines and the CMS coloron bound as a plane;
  and a mass axis drawn like a search reach plot with the excluded region shaded. **No event is
  simulated.** The anchor is exact where it can be: HHKY's Fig. 1 content gives their a = 0.058
  as 0.0583, their m_H R/g₄ = 0.031 as 0.0306, and their eq. (20) to 10⁻⁹.

  **The scan.** `tools/scan_cells.mjs` chains every verdict — vacuum, group, cell, sin²θ_W,
  Higgs doublet, anomalies at the minimum, 1/R against CMS — over every boundary condition of
  SU(5), SU(6) and SU(7) and every bulk content of up to four fields at multiplicity one:
  42 380 models in eleven minutes. `tools/scan_predict.mjs` runs the simulator on the theories
  with a full generation and a Wilson-line W; `tools/scan_map.py` draws them against the data.
  The report, the table and the map are in `data/scan_2026-09-03/`.

why
: What the scan says, and none of it was assumed:

  - **304 of 42 380 models host a full Standard-Model generation** (4 in SU(5), 216 in SU(6),
    84 in SU(7)); 148 of them also have a Higgs doublet in A_y. Every one has both an η = + and
    an η = − field in the bulk — 304 of 304 — and every one owes at the minimum: **no bulk-only
    generation with a Higgs doublet is anomaly-free without brane fermions**.
  - **62 theories have a full generation and a Wilson-line W.** Their 1/R runs from 0.32 to
    2.11 TeV — **none clears CMS's 6.6 TeV** if colour is in the bulk — and their one-loop Higgs
    mass from 10 to 47 GeV, none within 10% of 125.2. Their symmetric tensor's lightest state
    sits at m_W in all 42 that have one, not at the 2m_W of the lore: the letter⊗pair component,
    not the pair⊗pair one, is the light one whenever a letter is left.
  - **The embedding is not always Georgi–Glashow's.** Among full cells sin²θ_W takes 3/8 (256),
    21/44 (24), 3/92 (18) and 3/20 (6); across all cells that fix Y, twelve rational values.
  - **1 332 of 7 190 rows with a cell have a vacuum that breaks colour** — a rotated pair inside
    the colour block — which no panel had ever reported.

  So the little hierarchy of flat 5D gauge–Higgs unification is not a folklore sentence here but
  a number over the space: with at most four bulk fields at multiplicity one, the Wilson-line
  angle never falls below 0.038, and 6.6 TeV needs 0.012. That is the reason the published models
  carry large multiplicities and large representations, and the map says where to push.

so
: Three anchors and three refusals. The running returns its inputs at M_Z and meets α₁ = α₂
  near 10¹³ GeV; the dictionary reproduces HHKY; the cell reproduces 3/8. The simulator refuses
  a scale at a symmetric vacuum, a Higgs mass at a non-positive curvature, and a sin²θ_W where
  the cell does not fix Y. What it does not include is said on the page: two loops, thresholds,
  brane kinetic terms, the Kaluza–Klein power law above 1/R, three generations, Yukawas.

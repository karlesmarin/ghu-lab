/* experiment.mjs — the measured numbers a model is held against, each with its source and date.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY A FILE OF NUMBERS HAS A HEADER.  A value quoted from memory is a value nobody can check,
 * and a value without a date is a value that will be stale without anybody noticing.  Every entry
 * here carries WHERE it was read and WHEN, and the harness refuses an entry without either.  The
 * numbers were read from the sources on 2026-09-03; a reader who finds a newer edition should
 * change the entry and the date together.
 *
 * WHAT THESE ARE FOR.  A 5D model at its vacuum is dimensionless until one mass is measured:
 * the Wilson-line angle fixes m_W·R, and m_W then fixes 1/R and, through the ladder, every other
 * mass in GeV.  That is the confrontation `vac5Confront` performs, and these are its inputs.
 * Bounds are quoted for the signature they were set on — a dijet limit on a colour-octet vector
 * applies to the first KK level of the gluon ONLY if colour lives in the bulk — and the page
 * says which hypothesis each verdict rests on rather than applying a bound to a state it was not
 * set for.
 */
export const EXPERIMENT = {
  m_W: { value: 80.3692, error: 0.0133, unit: "GeV",
         what: "W boson mass, world average of the LHC-TeV W-mass Working Group",
         source: "PDG 2025, review 'Mass and Width of the W Boson': m_W = 80369.2 ± 13.3 MeV",
         url: "https://pdg.lbl.gov/2025/reviews/rpp2025-rev-w-mass.pdf", read: "2026-09-03",
         note: "the CDF 2022 value 80.4335 ± 0.0094 GeV is NOT in the average and disagrees with it" },
  m_h: { value: 125.20, error: 0.11, unit: "GeV",
         what: "Higgs boson mass, ATLAS + CMS average (scale factor 1.4)",
         source: "PDG 2024 listing 'H mass'",
         url: "https://pdg.lbl.gov/2024/listings/rpp2024-list-higgs-boson.pdf", read: "2026-09-03" },
  m_t: { value: 172.57, error: 0.29, unit: "GeV",
         what: "top quark mass, world average",
         source: "PDG 2024 review 'Top Quark'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-top-quark.pdf", read: "2026-09-03" },

  /* the fermion masses a Wilson-line mass is held against: the heaviest generation, since a bulk
   * field gives every copy the same mass */
  m_b: { value: 4.18, error: 0.008, unit: "GeV",
         what: "b quark MS-bar mass m̂_b(m̂_b)",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics', eq. (10.16): 'm̂_b(m̂_b) = 4180 ± 8 −108 [α_s(M_Z) − 0.1182] MeV'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },
  m_c: { value: 1.274, error: 0.008, unit: "GeV",
         what: "c quark MS-bar mass m̂_c(m̂_c)",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics', eq. (10.15): 'm̂_c(m̂_c) = 1274 ± 8 + 2616 [α_s(M_Z) − 0.1182] MeV'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },
  m_tau: { value: 1.77693, error: 0.00009, unit: "GeV",
         what: "τ lepton mass",
         source: "PDG 2024 listing 'τ mass': 1776.93 ± 0.09 MeV",
         url: "https://pdg.lbl.gov/2024/listings/rpp2024-list-tau.pdf", read: "2026-09-03" },
  m_mu: { value: 0.1056583755, error: 0.0000000023, unit: "GeV",
         what: "μ mass",
         source: "PDG 2024 listing 'μ mass': 105.6583755(23) MeV",
         url: "https://pdg.lbl.gov/2024/listings/rpp2024-list-muon.pdf", read: "2026-09-03" },

  /* the couplings at M_Z, MS-bar, from the PDG 2024 electroweak review (Erler–Freitas) */
  alpha_inv_MZ: { value: 127.930, error: 0.008, unit: "1",
         what: "α̂⁽⁵⁾(M_Z)⁻¹, MS-bar, five flavours",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics': 'α̂⁽⁵⁾(M_Z)⁻¹ = 127.930 ± 0.008'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },
  sin2_MZ_msbar: { value: 0.23129, error: 0.00004, unit: "1",
         what: "ŝ²_Z, the MS-bar weak mixing angle at M_Z (SM best fit)",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics', Table of schemes: 'MS ŝ²_Z 0.23129 ± 0.00004'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },
  alpha_s_MZ: { value: 0.1187, error: 0.0017, unit: "1",
         what: "α_s(M_Z) from the electroweak global fit of the same review (the QCD review's world average is 0.1180 ± 0.0009)",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics': 'α_s(M_Z) = 0.1187 ± 0.0017 from the global fit'",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },
  m_Z: { value: 91.1876, error: 0.0021, unit: "GeV",
         what: "Z boson mass, the LEP value the electroweak review takes as input",
         source: "PDG 2024 review 'Electroweak Model and Constraints on New Physics', input M_Z = 91.1876 ± 0.0021 GeV",
         url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-standard-model.pdf", read: "2026-09-03" },

  /* lower mass limits at 95% CL on narrow dijet resonances, CMS, full Run 2 */
  dijet_coloron: { value: 6600, unit: "GeV",
         what: "axigluons and colorons — a colour-octet vector coupling to quarks: the shape of a first KK gluon",
         source: "CMS, JHEP 05 (2020) 033, arXiv:1911.03947, 137 fb⁻¹ at 13 TeV: '6.6 TeV for axigluons and colorons'",
         url: "https://arxiv.org/abs/1911.03947", read: "2026-09-03",
         hypothesis: "colour lives in the bulk, so the gluon has a KK tower at 1/R with coloron-like couplings" },
  dijet_excited_quark: { value: 6300, unit: "GeV", what: "excited quarks",
         source: "CMS, JHEP 05 (2020) 033, arXiv:1911.03947: '6.3 TeV for excited quarks'",
         url: "https://arxiv.org/abs/1911.03947", read: "2026-09-03" },
  dijet_Zprime_SM: { value: 2900, unit: "GeV", what: "Z′ with SM-like couplings, dijet channel",
         source: "CMS, JHEP 05 (2020) 033, arXiv:1911.03947: '2.9 TeV and between 3.1 and 3.3 TeV for Z′ bosons with SM-like couplings'",
         url: "https://arxiv.org/abs/1911.03947", read: "2026-09-03" },
  dilepton_Zprime_psi: { value: 4500, unit: "GeV", what: "E6-motivated Z′_ψ, dilepton channel",
         source: "ATLAS, Phys. Lett. B 796 (2019) 68, arXiv:1903.06248, 139 fb⁻¹: 'limits reach 4.5 TeV for the E6-motivated Z′_ψ boson'",
         url: "https://arxiv.org/abs/1903.06248", read: "2026-09-03" },
  contact_LL_destructive: { value: 17000, unit: "GeV",
         what: "quark contact-interaction scale Λ, left-handed, destructive interference",
         source: "CMS-EXO-24-011, arXiv:2603.25458, 138 fb⁻¹: 'up to a scale of 17 TeV for destructive interference and 37 TeV for constructive'",
         url: "https://arxiv.org/abs/2603.25458", read: "2026-09-03",
         note: "the analysis Part VIII's collider section transports to; the contact scale is not a KK mass" },
  contact_LL_constructive: { value: 37000, unit: "GeV",
         what: "the same, constructive interference",
         source: "CMS-EXO-24-011, arXiv:2603.25458", url: "https://arxiv.org/abs/2603.25458", read: "2026-09-03" },

  proton_e_pi0: { value: 2.4e34, unit: "years",
         what: "τ/B(p → e⁺π⁰) lower limit at 90% CL",
         source: "Super-Kamiokande, Phys. Rev. D 102 (2020) 112011, arXiv:2010.16098, 450 kton·yr",
         url: "https://arxiv.org/abs/2010.16098", read: "2026-09-03",
         note: "Part VI's proton-decay operators are what this bounds; the instrument does not yet compute the rate" },
};

/* the KK scale from the W: m_W·R is the ladder's dimensionless number, so 1/R = m_W / (m_W·R) */
export const invRFromW = (mWR, mW = EXPERIMENT.m_W.value) => (mWR > 0 ? mW / mWR : null);

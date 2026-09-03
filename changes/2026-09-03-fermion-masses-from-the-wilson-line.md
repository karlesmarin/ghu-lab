---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: The masses the Wilson line gives the fermions, and the pictures made legible
verify: load SU(6) [3, 1, 2, 0] on the builder with four bulk Dirac fields — a fundamental and an antisymmetric at ηη′ = +, the same two at ηη′ = − — and open **Simulator** with the probe at φ = 0.03. The table *Fermion masses from the Wilson line* reads eᶜ at exactly 1.00 m_W = 80.4 GeV against τ = 1.777 GeV, L with one massless component (the neutrino) and one at m_W, and uᶜ untouched. Turn the landscape; it now fits its card at any width, and **What the model contains** has the same picture in units of 1/R.
---

what
: **The fermion masses.** `src/modules/yukawa.mjs`: in gauge–Higgs unification the Yukawa
  coupling *is* the gauge coupling, so a Standard-Model field is a massless piece at the
  symmetric point the vacuum sits next to, and at the vacuum some of its components move off
  zero. The eigenvectors of the twisted translation are the unpaired letters (eigenvalue 0 or ½)
  and, on each rotated pair, (e_i ± i e_j)/√2 with eigenvalue ±t/2; on a tensor the eigenvalues
  add, on the adjoint they subtract, and ηη′ = − shifts every one by ½. The folded eigenvalue
  times 1/R is the mass, and the measured m_W fixes 1/R.

  A vacuum eigenstate is **not** in general a component of one piece of the symmetric point:
  e₊e₋ on a symmetric tensor is (e_ie_i + e_je_j)/√2, half in the (+,+) piece and half in the
  (−,−) one. The first version read masses index by index, put that state in one piece, and
  failed against the tower. Every eigenstate is expanded in the index basis now and attributed
  by squared overlap; the weights sum to one over the pieces, to the piece's dimension over the
  states, and to `vacuum5d`'s massless counts — which is the control the harness runs on
  40 (boundary condition, representation, η) cases.

  **The pictures.** `src/view/tower3d.js` is one renderer for both sections: **What the model
  contains** draws the towers in units of 1/R, **Simulator** the same object in GeV with the
  measured masses as lines and the CMS coloron bound as a plane. It sizes itself to its card,
  which the first deployment did not — 720 px in a half-width column overflowed. And the help is
  in collapsible blocks: how to use the section, how to read each picture, what the assumptions
  are, all folded away until asked for.

why
: Cacciapaglia–Csaki–Park, hep-ph/0510366: for a bulk fundamental with vanishing bulk mass
  "we find that m_q → m_W" (§3), and from a larger representation "at tree level m_t = 2m_W"
  (§5). Both come out here by the eigenvalues, exactly: the fundamental's paired component at
  t/2 — which is m_W when the W is a letter⊗pair vector — and the symmetric tensor's pair
  diagonal at t.

  So the Yukawa problem of flat gauge–Higgs unification is a number on the page rather than a
  sentence in a review: with no bulk masses, no brane mixing and no boundary kinetic terms, a
  model predicts its charged lepton at 80.4 GeV and the τ weighs 1.777 GeV. The three
  ingredients that fix it are named and are not implemented; what is implemented is the
  tree-level answer they have to correct.

so
: One more thing the readers said and is fixed: **g₄ scales the Higgs mass only** — m_H ∝ g₄,
  every other mass being fixed by the measured m_W — so moving the slider and watching the
  towers looked broken. The parameter card says what g₄ touches, and the predicted m_H is drawn
  in the landscape, where the slider does move it.

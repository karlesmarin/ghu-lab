---
date: 2026-09-04
part: instrument
severity: extension
affects_record: no
title: Four published models, taken off their pages and run through one engine
verify: open **Paper models**, pick *Kubo–Lim–Yamashita · SU(3)* and read the table: eight rows green and one amber. The amber one is their eq. (35). Move the dial to **N_f = 0** and it turns green — with no fermions the two readings coincide, which is what fixes the prefactor. Move it back and read the sentence under *The rows that need a sentence*. Then pick *Burdman–Nomura · SU(6)*, press **Load into the SU(N) builder**, and walk **4D spectrum**, **Anomalies** and **Simulator** on their model.
---

what
: `src/modules/papers.mjs` takes four published five-dimensional gauge-Higgs models off their own
  pages — Kubo–Lim–Yamashita's SU(3), Kawamura's SU(5), Burdman–Nomura's SU(6) and
  Haba–Hosotani–Kawamura's SU(5) — and puts every statement each one prints that this engine can
  compute beside the number it returns. Twenty-eight anchors, each carrying its locator and the
  scope it was read at. **Twenty-four are reproduced, one differs, three are outside this engine
  and say which representation or which file they would need.** The new section loads any of the
  four into the SU(N) builder, so the spectrum, the anomaly ledger, the brane panel and the
  simulator all read somebody else's published model.

  Nothing is fitted. The boundary condition is typed off the paper, the bulk content is typed off
  the paper, and Haba–Yamashita's general formula does the rest. Kubo–Lim–Yamashita's whole eq.
  (33) comes out to **1.7 × 10⁻¹³** over forty-one values of α and five fermion counts; their eq.
  (34), their Table 1 and their eq. (39) follow. Burdman–Nomura's eqs. (38) **and** (39) — ten
  parity assignments, the two halves of one hypermultiplet — both fall out of one line of content,
  because only the product ηη′ is physical and this instrument's single `eta` names the pair.
  Kawamura's own footnote says the Hosotani mechanism cannot work in his model; the engine returns
  **zero Wilson-line phases**, which is that sentence counted rather than argued.

why
: Every other harness in this repository holds the instrument to **our** reading of a formula. A
  general formula that reproduces four papers it was never fitted to is a general formula; one that
  reproduces only the paper it came from is a transcription. And the point of the SU(N) builder is
  that the model is the input — which is worth nothing to a reader who cannot check that the engine
  behind it is right on models whose answers are already in print.

so
: One row differs, and it is the reason the section exists. **Kubo–Lim–Yamashita's eq. (35)**, the
  Higgs mass-squared at their α = 0 vacuum, reads (9 − N_f) where their own eq. (33) differentiates
  to (9 − 2N_f). The same second derivative taken at their *other* vacuum reproduces their eq. (39)
  exactly for every N_f; at N_f = 0 eq. (35) agrees too, which fixes the prefactor and leaves the
  fermion term as the only thing in question; and their eq. (34) is a second, independent witness,
  exact with the 4N_f of eq. (32) and wrong by a factor of three with a 2N_f. **None of their
  conclusions moves** — α = 0 is the vacuum only for N_f ≤ 1, where both readings give a positive
  mass — and the row says so, because a defect whose consequences are nil should be reported as
  one. Read off the **rendered page**, not a text extraction, after this house spent 2026-08-30
  proving a correct published formula wrong on a dropped delimiter. Their eq. (34) also needs its
  printed lower limit n = 1 read as n = 0; with n = 1 the closed form is about 222 times too small
  and the sign, which is all their argument uses, is unaffected either way.

  Two conventions are marked rather than hidden. Their eq. (28) puts the singlet zero mode in ψ_R
  and the doublet in ψ_L and this instrument returns the mirror: only the relative chirality is
  physical, the absolute labels follow the γ₅ sign in their eq. (1), and the potential — which
  cannot see γ₅ — pins η = +1 either way. And three of the four papers are **supersymmetric** while
  this engine's one-loop potential is not, so every anchor taken from them is parity linear
  algebra and never their dynamics; the header, each model card and the closing card each say it,
  because *"the instrument reproduces Burdman–Nomura"* is a sentence somebody will write and it is
  only true of the half that was looked at.

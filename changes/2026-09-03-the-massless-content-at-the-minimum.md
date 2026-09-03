---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: The massless content at the minimum, and the three lines that stop moving
verify: open **One model, every verdict** on SU(6) with boundary condition [1, 0, 4, 1] and one bulk Dirac fundamental. In the group **At the minimum** the unbroken group, the three massless counts and the anomaly verdict are tagged *the theory*; their symmetric-point twins two groups up are tagged *the frame*. Click the other member of the class: the symmetric-point lines move and the minimum lines do not. The first row of the group says where the vacuum stands — a class-mate, or *broken* with the angle of the rotated pair.
---

what
: Every verdict the instrument gave about a 5D SU(N) model — the apparent group, the massless
  vectors, scalars and fermions, the whole anomaly ledger — was read at the **symmetric point** of
  the boundary condition on screen, θ = 0. The dossier of the same morning measured what that
  costs: eleven of eighteen lines move under a gauge-equivalent boundary condition, and the reason
  is that the class relation [p,q,r,s] ~ [p−1,q+1,r+1,s−1] *is* a shift of the Wilson line by one,
  so a class-mate's symmetric point is this one's other symmetric point.

  `src/modules/vacuum5d.mjs` reads the same three questions **at the minimum**. Gauge the constant
  A_y away and the reflection about y = πR becomes P₁′ = W⁻¹P₁ with W the holonomy (Hosotani;
  Haba–Hosotani–Kawamura §2). A massless four-dimensional mode is a vector fixed by both P₀ and
  P₁′ — for a unitary P₁′ the linear term of a + b·y is killed outright — so the massless content
  of a field with parities (ε₀, ε₁) is a joint eigenspace, and the unbroken group is the commutant
  of {P₀, P₁′}, which Schur names as S(∏ U(m_i)) over the irreducibles of the group they generate:
  four one-dimensional letters and one two-dimensional D(cos πt) per angle at which a pair is
  rotated. When every phase is 0 or 1 that is the parity rule applied to a **class-mate**, the one
  the vacuum rearranges the boundary condition into; strictly inside it is the Hosotani mechanism,
  and no member of the class has that content.

  The anomaly ledger runs over that frame unchanged. `anomaly5d.mjs` is now written over a
  *frame* — a list of blocks with a size and a dimension — and the four parity letters are its
  first instance; a rotated pair is a block of dimension two, and the ledger's group theory never
  asked what a block was made of.

  The dossier gains a group **At the minimum**: where the vacuum stands, the group, the three
  counts, the verdict and the channels owing. They are tagged by the same measurement as every
  other line, and they come back **invariant on all 86 multi-member classes of SU(4)…SU(7), with
  two bulk contents** — 81 classes located, 5 declined because they carry three phases or more.

why
: A statement about the theory has to be read where the theory sits, and until today the
  instrument could not read there. The dossier had made the gap visible and said so on the page;
  this closes it, and the honesty card now says what remains: the scalars are tree-level flat
  directions, whether a phase sits at an end and whether two phases coincide is decided to the
  minimiser's tolerance of 10⁻⁶, and past two phases there is no located vacuum.

so
: Two routes and a decoy, because the count is easy to get subtly wrong. `vac5Rep` produces the
  pieces by representation theory — letters twist into letters, D(c) into D(±c), S²D(c) = (+,+) ⊕
  D(2c² − 1), Λ²D(c) = (−,−) — and `vac5Direct` builds ρ(P₀) and ρ(P₁′) as matrices on the
  fundamental, adjoint, antisymmetric and symmetric and counts the joint eigenspace by
  elimination. `_test_vacuum5d.mjs` holds one to the other on 880 (boundary condition, θ,
  representation, twist) cases including three-phase ones; at θ = 0 and θ = 1 it holds the result
  to `sp5ZeroModes` and `an5Ledger` of the boundary condition and of its class-mate, character for
  character, on every one-phase boundary condition of SU(4)…SU(7) with three contents.

  The decoy is the count a reader would reach first: read the Kaluza–Klein families at n = 0.
  For SU(2) with P = P′ = diag(+,−) at θ = 1 it gives **two** massless vectors; there is one,
  because W = −1 is central there and the theory is the θ = 0 theory. The per-state bookkeeping
  keeps the Cartan direction at charge zero, and at a broken vacuum that direction mixes with its
  (−,−) partner into a vector of mass θ — the Hosotani W boson. The harness requires the decoy to
  disagree.

  And the enhancement is real rather than an artefact of the tolerance: SU(5) [3,0,0,2] with two
  pairs at the *same* angle leaves an SU(2) the symmetric point never had, and SU(4) [1,1,1,1]
  with an A-pair at θ and a B-pair at φ = 1 − θ leaves SU(2) too, because a B-pair's P₁ is −σ₃
  and the two irreducibles coincide there. Both are checked by the matrices.

---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: The exact tower at the vacuum, the W as the unit, and three phases without a grid
verify: open **What the model contains** on SU(3) with boundary condition [2, 0, 0, 1], one bulk Dirac fundamental and one Dirac symmetric tensor, at the vacuum. Under the families a second table, *The exact tower at this point*, gives the lightest massive vector at m·R = θ/2 and every field's first massive state in units of it — the fundamental at 1 m_W, the symmetric tensor's pair⊗pair state at 2 m_W. Then load SU(6) [1, 2, 2, 1] in **One model, every verdict**: three Wilson-line phases, and the depth of the vacuum is a number marked *restarts, not certified* rather than a declined line, with the minimum lines under it tagged the theory's.
---

what
: Two things a model builder reads first, and neither existed here yesterday.

  **The Kaluza–Klein spectrum at the minimum, exactly.** With the constant A_y gauged away the
  field is periodic up to U′ = P₁′P₀, so its modes are e^{i(n+Θ)y/R} with e^{2πiΘ} an
  eigenvalue of ρ(U′), and the orbifold identifies Θ with −Θ. A conjugate pair strictly inside is
  one tower |n + x|, n ∈ Z; an eigenvalue at 0 splits under P₀ into an even part with n ≥ 0 —
  the massless states, exactly the joint invariants the previous entry counts — and an odd part
  with n ≥ 1; an eigenvalue at ½ is n + ½. The eigenvalues never need a matrix: a (+,+) or (−,−)
  letter is Θ = 0, a (+,−) or (−,+) letter is ½, a pair rotated by t is ±t/2, the adjoint takes
  differences and the tensors sums. `vac5Tower` and `vac5Ladder` in `vacuum5d.mjs`; the spectrum
  section prints the table under its families, and the dossier gains two lines — the lightest
  massive vector m·R, and each bulk field's first massive state in units of it — both invariant
  on the class like the rest of the minimum group.

  **Three phases and more, by restarts.** A grid on a 3-torus at the 2-torus's resolution is
  10⁷ evaluations and the panels were right to refuse it. `sun5dMinimumRestarts` descends from
  every symmetric corner and from a reproducible batch of random points, keeps the deepest, and
  reports how many starts reached it and how many distinct minima were seen; every line that
  reads it carries *restarts, not certified*. The dossier and the spectrum section fall back to
  it above two phases, so the five three-phase classes of SU(4)…SU(7) that declined yesterday are
  located today — and their minimum lines come back invariant like the other 81.

why
: The families the spectrum section already drew are the potential's multiset and are right for
  it; at a broken vacuum they are wrong at the lowest level of the adjoint and of the symmetric
  tensor, where a Cartan direction the per-state bookkeeping keeps at charge zero has in fact
  become the W of mass t. The same mistake the previous entry's decoy makes, one level up. And
  the ratio a builder wants — the top at 2 m_W from a symmetric tensor — is a statement about
  where the W lives: in SU(3) [2,0,0,1] the W is a letter⊗pair vector at t/2 and the tensor's
  pair⊗pair state sits at t, twice it; in SU(2) the only massive vector is pair⊗pair at t, so
  the same state sits at 1 m_W. The harness pins both.

so
: The tower is held to the potential by differences: summed with the degrees-of-freedom weights
  of Haba–Yamashita, Σ_n n⁻⁵ cos(2πn x) per tower reproduces `sun5dV` between any two points of
  the torus to 10⁻⁹ on five (boundary condition, content) pairs — a route that shares no code
  with the potential it lands on. The Θ = 0 split and the Θ = ½ count are held to the joint
  counts of the other three twists, which the tower did not use. And the restarts are held to
  the grid where the grid exists: 222 (boundary condition, content) cases of SU(4)…SU(6), the
  same depth to 10⁻⁹ in every one, the deepest value reached by at least ten starts in every
  one. Above two phases there is nothing to hold them to but each other, and the page says so.

  And a third route for the vacuum module itself, in SageMath: `tools/vacuum5d_sage_control.py`
  rebuilds P₀, P₁′ and the four representation matrices with Sage's own linear algebra and
  recomputes the joint counts and the eigenvalue angles of ρ(P₁′P₀) on ten cases — 200 of 200
  agree with the JavaScript. The first run disagreed 39 times, all on Sage's side: its RDF
  `rank()` counts the 10⁻¹⁶ pivots cos π and sin π leave behind, and returned a negative nullity
  for a kernel that provably holds the identity. An SVD with a stated tolerance fixed every one;
  the eigenvalues had agreed from the start.

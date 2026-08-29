---
date: 2026-08-29
part: instrument
severity: extension
affects_record: no
title: Which boundary conditions are the same theory — the equivalence classes, on S¹/Z₂ and T²/Z₃
verify: open **Boundary conditions**. SU(5) with [2, 0, 0, 3] looks like SU(3)×SU(2)×U(1); the class table beside it shows [1, 1, 1, 2] and [0, 2, 2, 1] in the same class, looking like SU(2)×U(1)³ and SU(2)×SU(2)×U(1)². Three apparent symmetries, one theory. The counting table computes the orbits at every N from 1 to 12 and they come out 4, 9, 16, 25, 36, … = (N+1)². Then press **T²/Z₃** and watch the answer change: the same invariant is no longer complete, and almost every boundary condition is alone in its class.
---

what
: Putting a gauge theory on an orbifold means **choosing** boundary conditions at the fixed
  points, and there are many. Some are related by a gauge transformation, so they are the same
  theory wearing different clothes: they form an equivalence class, and only the class is physics.
  This section does that quotient, on both orbifolds where the classification is settled.

  On **S¹/Z₂** a boundary condition is a pair of Z₂ parities, so four block sizes [p, q, r, s] —
  the same four numbers the SU(N) builder takes. The only relation is
  [p, q, r, s] ~ [p−1, q+1, r+1, s−1]: Haba–Hosotani–Kawamura, *PTP* **111** (2004) 265, eq.
  (2.21), and re-derived twenty years later by Takeuchi–Inagaki (*PTEP* 2024 033B03) from the
  conservation of the trace at each fixed point alone — a geometric fact about the orbifold, using
  nothing at all about the structure of the gauge transformations. On **T²/Z₃** the same argument
  gives their eq. (46).

  The page computes the orbits; every count on it comes out of that and none is quoted. HHK's
  n₁ = C(N+3, 3) boundary conditions, n₂ = (N−1)N(N+1)/6 relations and **(N+1)² classes** are
  reproduced for every N up to 14 as properties of the orbit structure. So is their §3 energetics:
  which member of a class the one-loop vacuum energy prefers, with eq. (3.27) checked term by term
  as a polynomial in the matter content.

why
: Because it is the first thing a model builder needs and the easiest thing to get wrong. **The
  apparent unbroken symmetry is not an invariant.** SU(5)'s [2, 0, 0, 3] looks like the Standard
  Model's SU(3)×SU(2)×U(1) and [1, 1, 1, 2] looks like SU(2)×U(1)³, and they are one theory: which
  group you appear to have depends on where you are standing on the Wilson line. A survey over
  boundary conditions that does not quotient by this counts the same model over and over, and a
  claim that a particular boundary condition "gives the Standard Model gauge group" is a claim
  about a representative, not about a theory.

  And the class is exactly the pair of eigenvalue spectra of the two parities — one at each fixed
  point — which is the trace that is conserved. That is why there are (N+1)² of them.

so
: Two things the page says out loud rather than quietly.

  **The comparison it refuses.** The vacuum energy splits into N₀λ₀ + N_Δλ_Δ + N_v·v(½), and only
  the last is finite. N₀ does not depend on the boundary condition at all. N_Δ multiplies a
  divergent λ_Δ with no principle to fix the regularisation — but it is constant on a class, which
  is exactly why ranking members *within* a class survives and ranking classes *against each
  other* does not. So the panel ranks members and refuses to rank classes, and says why. In a
  supersymmetric theory the ambiguity cancels; that is HHK §4 and it is not implemented here.

  **The answer that does not carry over.** On T²/Z₃ the moves are 3-cycles rather than the 2×2
  swaps that would connect every matrix with the same spectra, so the spectra stay invariant but
  stop being complete: at N = 4 there are 477 classes among 495 boundary conditions. Assuming the
  one-dimensional answer generalised would have been the easy mistake, and the page measures it
  instead.

  Collaterally, a real defect in this repository's own build, latent since the first commit:
  `build_app.py` decoded its harnesses' output with the machine's ANSI codepage. On Windows that
  is cp1252, which has five unmapped bytes, and a harness printing an omega killed the capture —
  `stdout` came back **None with returncode 0**. Had that landed one line later, a red harness
  could have been reported green. It decodes UTF-8 explicitly now and refuses a build where the
  capture came back empty.

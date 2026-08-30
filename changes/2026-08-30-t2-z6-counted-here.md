---
date: 2026-08-30
part: instrument
severity: extension
affects_record: no
title: T²/Z₆ counted on the page — the same orbit walk, on a third orbifold
verify: open **Boundary conditions** and scroll to *How many classes there are*. Below the existing table there is a second one for T²/Z₆, N = 1 to 8. The **diagonal** column is the control: it must equal C(N+5,5), and the note says whether it does. The last two columns are quoted from Takeuchi–Inagaki, not computed here, and the note says which is which.
---

what
: **The equivalence classes on T²/Z₆ are now counted on the page**, in the section that already
  counts them on S¹/Z₂ and T²/Z₃. It is not a new orbifold in the selector: the cells, the energy
  and the unbroken group of that page are S¹/Z₂ and T²/Z₃ objects, and a T²/Z₆ state is a different
  animal. What it shares is the only thing a count needs — states, and moves between them — so it
  goes through the *same* orbit walk rather than a second copy of it.

  A state is `(b₀,b₁,b₂ | c₀,c₁ | d₀…d₅)`: how many 2×2 blocks of each label, how many 3×3 blocks
  of each label, and how many diagonal entries of each of the six patterns. The moves are
  Takeuchi–Inagaki's own reductions — three 2×2 blocks of distinct label, and two 3×3 of distinct
  label, become diagonal — and in both cases the eigenvalues that come out are the six sixth roots
  of unity, so each reduction produces exactly one of each diagonal pattern.

  **The diagonal column is the control and it is printed.** Their section 3 proves no two diagonal
  sets are connected, so those classes must number C(N+5,5). If that column ever stopped matching,
  the states or the moves would be wrong and no other number in the row would mean anything.

  Beside the count, the two expressions their paper prints for the same quantity — a sum over
  configurations, and the closed form of eq. (5.9) — are **quoted as printed**, and a third column
  evaluates the sum, because a formula is easier to use than a five-fold sum. Which columns are
  computed here and which are quoted is stated in the note.

why
: The evaluated form is two branches by parity rather than six by N mod 6, and the reason is
  visible in the generating function: `x²(3−4x+2x²) / [(1−x)⁹(1+x)]`. The `1/(1−x³)` that every
  term with 3×3 blocks carries cancels, so there is no pole at the primitive cube roots of unity
  and the count cannot depend on N mod 3 at all. The pole of order 9 at x = 1 is the degree, and
  the simple pole at x = −1 is the period. That is worth having on the page because it is the kind
  of statement one can check before doing any arithmetic.

so
: A defect found while porting, and it is the general lesson. `bcClasses` finds a class by walking
  the moves forward from one state — which computes the connected component only if the move set is
  **symmetric**, as the S¹/Z₂ and T²/Z₃ relations are, each being its own inverse in the list. A
  reduction is not: it only goes one way. Without its inverse alongside it, the walk returned 665,
  1560 and 3351 at N = 6, 7, 8 instead of 663, 1548 and 3303 — it was measuring what is reachable
  from where it started, not the classes. The inverses are listed now, and the harness checks that
  every move has one.

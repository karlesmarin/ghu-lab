---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: Most of what the instrument says about a model is not about the model
verify: open **One model, every verdict** on SU(6) with boundary condition [1, 0, 4, 1] and one bulk Dirac fundamental. **7 of the 18 verdicts are the theory's; 11 are the frame's.** Click the other member of the class in the table on the left — the same theory in different clothes — and watch the depth of the vacuum stay exactly where it is while the apparent group, the massless counts, W and the whole anomaly ledger move. The anomaly verdict reads **owes** here and **no subject** there.
---

what
: Five sections already answer about a 5D SU(N) model on S¹/Z₂: the builder gives the Wilson-line
  potential and its vacuum, the spectrum panel the massless content, the anomaly panel the bill,
  Boundary conditions the equivalence class, and Part VII's kernel the closed form when there is a
  single phase. Read one after another they give eighteen numbers about one model.

  **Eleven of the eighteen are not properties of the model.** They change when the boundary
  condition is replaced by a gauge-equivalent one — the same theory, a different frame. This
  section recomputes every line on every member of the class and tags each by what came back:
  *the theory* if it was the same on all of them, *the frame* if two members that are one theory
  disagreed, *declined* if the computation refused and said why.

  The tag is a **measurement made on that render**, never a list of which lines ought to be
  invariant. `_test_dossier.mjs` hands the same tagger two decoy lines whose answers are settled
  before it runs — `p`, a coordinate of the representative, and `p − s`, which the class relation
  preserves — and requires the two different tags at three values of N.

why
: Seeing this needs the class from one section and the verdicts from the others at the same
  moment, so no panel could see it alone, and a reader stacking them by hand comes away with a
  page of numbers of which a majority are about where they were standing. That is the arbitrariness
  problem `bcclass` opens with, stated once about the apparent unbroken group — measured here
  across everything the instrument computes.

  What survives, at N = 4…7 and over every class: the **phase count**, the number of terms in V,
  the **depth of the vacuum**, whether it sits at a symmetric point, and **N_Δ**. What does not:
  the apparent unbroken group, where the vacuum sits, **Part VII's W**, all three massless counts,
  the **anomaly ledger**, and **N_v**.

  And invariant is not the same as informative, so there is a second axis and its own button. A
  line that takes one value over *every* class at this N separates no theory from any other,
  however stable it is — `N₀` is one, and so is N itself. Splitting **within** a class makes a line
  the frame's; taking one value **between** classes makes it no verdict at all.

so
: It found a false verdict on its first run, which is the argument for building it. **"Is this
  model anomaly-free?" came back YES for one member of a class and NO for another** — the same
  theory, two answers — on 4 of the 16 multi-member classes of SU(5) and 5 of the 25 of SU(6).

  The arithmetic was never wrong. The cause was an empty sum: the member with n₊₊ = 0 has no
  massless fermion for a bulk fundamental to leave, so every anomaly channel is zero and the flag
  read `clean`. `anomaly5d.mjs` now returns a **verdict with three states** — *no subject*,
  *cancels*, *owes* — and the section reads that instead of keeping its own copy of the condition.
  The page had always printed "No massless fermions" and had always been right; the flag under it
  had not, and the header line beside it said "every channel cancels" with no fermion in the model.

  The same shape turned up twice more in the same afternoon and both are fixed the same way, by
  moving a guard out of its one caller and into the function. `sun5dTermTable` refuses two Wilson
  phases by name and was **blind to zero**: no term, no loop, an empty table, a clean pass — and
  Part VII's five coordinates and its stability verdict handed to a model that has no α for them to
  be about. It takes the phase count now. And this section's own separation panel was written to
  warn when its sweep belonged to another N, and then assigned the table over the top of the
  warning: the panel's own version of the failure it exists to name.

  What it still cannot do is the honest headline. Every line except the depth and position of the
  minimum is computed at the **symmetric point** of the representative loaded, which is exactly why
  those lines move across the class — the class relation is a shift along the Wilson line. The
  instrument does not yet compute the massless content **at the minimum**, which is what would turn
  the spectrum, the anomaly ledger and the apparent group into statements about the theory. That is
  a gap in the tool, and it is named on the page.

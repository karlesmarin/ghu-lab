---
date: 2026-08-29
part: instrument
severity: extension
affects_record: no
title: The scan — the four panels chained, and the model-building loop closes
verify: open **Scan**, tick all four filters, press *run the sweep*. On SU(6) with one bulk multiplet: 672 pairs in, 192 left by the group, 48 by the anomaly ledger, 24 by the vacuum — and the verdict reads *24 pairs, but **16** theories*, because boundary conditions related by [p,q,r,s] ~ [p−1,q+1,r+1,s−1] are the same theory in different coordinates. Press **load** on any row and the builder is holding that model; the 4D spectrum and Anomalies panels then read it. Then turn every filter off: the funnel must return the whole space unchanged, because a default that filters would make the sweep lie about its own denominator.
---

what
: The other four panels answer a question about **one** model — the builder gives the potential and
  its vacuum, the 4D spectrum says what is massless and whether it is chiral, Anomalies says what
  that content owes, and Boundary conditions says which of these theories are the same theory. A
  model builder uses all four on one model and then types the next one. Nothing walked the space.

  This does: every boundary condition of SU(N) on S¹/Z₂ crossed with every bulk content up to a
  chosen size, through a chain of filters ordered **cheapest first**, so the only expensive one —
  minimising the potential — runs on the fewest candidates. And a survivor **loads into the
  builder**, which is the same shared model the other panels read, so the sweep hands over a
  candidate instead of ending in a list.

why
: Because the funnel is the answer, not the survivors. *"Three models survive"* says nothing
  without *"out of how many, and where the others died"*, so every stage reports what it kept.

  And because the headline is a **pair** of numbers. Twenty-four surviving boundary conditions that
  are sixteen theories will be read as twenty-four results by anyone who does not know to quotient,
  so both counts are printed side by side, always, and every row carries its class with the repeats
  greyed and marked ↺. The sweep walks boundary conditions rather than classes on purpose: the
  apparent unbroken group is **not** a class invariant — `[2,0,0,3]`'s own class shows three
  different ones — so one representative per class would be picking an answer rather than
  computing one.

so
: Four things the harness caught, and one of them is the honesty floor.

  *A default that filtered.* `needHiggs` defaulted to `"any"`, which reads as **don't care** and
  means **must have one**: it discarded two thirds of the space while stage zero went on printing
  the full denominator. The sweep was lying about its own denominator.

  *An undecided vacuum reported as a no.* The minimiser handles one Wilson-line phase and two; with
  three or more it returns nothing, and those models were being filtered out **together with** the
  ones whose minimum genuinely sits at a symmetric point. Three buckets now — breaks, symmetric,
  undecided — and the undecided are counted on the page, as is anything the budget cut off before
  it was ever minimised.

  *`Showing 40 of 24`.* The list decided which rows were the first of their class inside a *second*
  pass, by which time the first pass had already seen every class, so every survivor was listed
  twice. That is section code, which no module harness reaches — `build/drive.mjs` now drives the
  panel and checks that the count it prints is arithmetic that holds.

  *A filter that is always empty is a bug wearing a result's coat.* Two of the four returned nothing
  over the whole space at first sight. Each is now exhibited keeping something on its own — and the
  **conjunction** being empty turned out to be the real physics. On SU(5) the four filters leave 36
  pairs and every one of them is a pure **adjoint** content with no massless scalar at all, which is
  the anomaly module's theorem read backwards: the adjoint is real, so at two multiplets it is the
  only bulk that settles its own bill. Ask for a Higgs as well and SU(5) empties completely; ask for
  a *colourless* one and it dies one stage earlier, for a reason that fits on a line — a 3 and a 2
  already use up all of SU(5), so no block of size 1 is left to pair with the doublet. One rank
  higher, all five filters at once leave survivors, so the zero is about SU(5) and not about a stuck
  gate.

  What the panel refuses to say is on it: the group it filters on is the one you **write**, not the
  one you get, since the physical symmetry is the one at the minimum and that is the expensive
  question the last filter only samples. Bulk Dirac fermions only, no brane fields — so *"the bulk
  pays its own anomaly"* reads as *"needs no brane fermion to be consistent"*, a far stronger demand
  than consistency, and failing it excludes nothing.

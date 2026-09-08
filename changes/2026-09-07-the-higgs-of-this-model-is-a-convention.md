---
date: 2026-09-07
part: instrument
severity: extension
affects_record: no
title: in_window stopped meaning one thing and saying another, and m_h came out as a range
verify: open the published SU(7) permalink in the **Simulator**. Two Higgs masses are printed, not one — 125.85 GeV from the small-phase branch and 127.85 GeV from the summed potential — and the window verdict names which of the two it is quoting. In **Sensitivity**, the same model's m_h spans 26 GeV across three budgets that are never added together.
---

what
: `in_window` classified with the mass of the small-phase branch and did not say so. On the
  published SU(7) permalink that branch gives 125.85 GeV where the summed potential gives 127.85 —
  one inside the window [125, 127] and the other outside it. A single boolean was deciding between
  them silently.

  Both are now printed, because they are different objects: `m_h_summed` and `in_window_summed`
  join the originals, and the source field on the second says which one is being quoted.

  Six modules arrived with it. **rank** — the weighted rank law over SU, SO and Sp. **observables**
  — no state is unobservable in the abstract, only undistinguished by a declared set, with the gate
  that refuses to compare a resolution on a rate against an overlap. **particles** — one row per
  state, with KK parity and a census of channels. **sensitivity** and **robustness** — three
  budgets that never add up. **higgsrate** — the last row of Carson–Okada's Table 1 reproduced,
  1.322 against their 1.32 TeV. **bundle** — the export, with its sources and its disclaimers
  inside the hash rather than beside it.

  And the orbifold section had stopped printing the dimension under the name of the rank.

why
: Because the difference between the two Higgs masses is not a defect to be picked between. H129F
  establishes that it is the domain of the expansion at α ≈ 0.083 — the branch and the sum are
  answering slightly different questions, and at this α the gap between them is the honest size of
  that choice. Printing one of them and calling it *the* Higgs mass hides a modelling decision
  inside a boolean.

  The same reasoning is why **sensitivity** reports m_h as a **range of 26 GeV** rather than as an
  error bar. An error bar is a statement about measurement; this is three budgets that open a
  convention, and adding them would manufacture a precision nobody has.

so
: The falsifiable list, and a model whose Higgs mass is a range wide enough to contain both the
  measured value and the model's own failure to reach it. That is the instrument working: the
  screen says what is a property of the theory and what is a property of the frame, and here the
  window verdict turned out to be the second thing wearing the first thing's name.

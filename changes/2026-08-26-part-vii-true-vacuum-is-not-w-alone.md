---
date: 2026-08-26
part: VII
severity: note
affects_record: no
title: A true vacuum needs more than W > 0 — and three smaller things an outside audit found
verify: load 7(+,+) + 48(+,−) + 84(+,+) in the hierarchy section — W = 5/2 > 0 and the verdict now reads "a false vacuum W alone cannot see", with the deeper minimum at α = 0.566 named; _test_hierarchy.mjs pins it, the printed 0.081, the searched domain and the parity check
---

what
: An outside audit of the deployed source found four things, and every one of them is real.
  **First and largest:** the instrument wrote `true: W > 0` and labelled it a theorem about "the
  true vacuum". [8]'s criterion — and Part VII's own sentence, "W > 0 sufficient for the
  electroweak point to be the deeper one" — says only that α = 0 is deeper than the *other
  symmetric point*, α = 1. It says nothing about a deeper minimum elsewhere in (0, 1). The
  auditor built a counterexample from this page's own tables: **7(+,+) + 48(+,−) + 84(+,+)** has
  D = 5/8, W = 5/2, a small-α branch at 0.0848 with F = −0.626 — and F = −1.698 at α = 0.566.
  The page called it a true vacuum. Reproduced here to every digit. The verdict now has two
  halves with their own standing: the symmetric-point half stays the theorem it is (necessary,
  never a tie); the deepest-point half is **measured**, by minimising the same F directly on
  (0, 1] on every render — which is exactly what the sweep already did and counted as `notGlobal`,
  without the single-model verdict ever consulting it. `vacuum.true` is now the conjunction.
  **Second:** the sweep's "largest α their Table 1 reaches" was 0.0836 — *our* α on their rows —
  when their printed maximum is **0.081**. The regime boundary stays on our axis, because that
  is the axis the closed form is evaluated on, but both numbers are now carried and the sentence
  says which is which. **Third:** the SU(4) calculator minimised over the whole torus and then
  reported `searched: [0, ½]` whenever the selection rule allowed the halving — a true answer
  with a false provenance. `minimise()` now receives the licensed domain, and what is reported is
  what ran. **Fourth:** `validate()` accepted a parity list of any length; `termTable` reads two.
  It now demands exactly two.

why
: The first is the class of error this whole instrument exists to refuse — a necessary condition
  shipped as a sufficient one, under the wrong chip. The page knew the distinction (the sweep's
  `notGlobal` count is the same fact) and did not apply it to itself: two instruments that agree
  on a definition and disagree on where it is used. The other three are provenance drifting from
  computation — a label naming the wrong number, a report naming the wrong domain, a check that
  did not check.

so
: The frozen record is untouched: the paper's sentence is the modest one, its true-vacuum level
  9.22 TeV is a maximum over a class its witness was checked to belong to on the exact potential,
  and no printed number moves. What moves is the instrument's verdict on contents like the
  counterexample, the wording of the regime boundary, the provenance of the SU(4) minimum, and
  one validation. Each has a harness check that fails on the old behaviour. The audit that found
  them read the source, not the page — which is the second time today that reading the artifact
  found what the artifact's own tests had not.

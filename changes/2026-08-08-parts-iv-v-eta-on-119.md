---
date: 2026-08-08
part: V
severity: extension
affects_record: no
title: The η closed form, checked on 119 contents instead of five
verify: open the eta-meter; the sweep runs in your browser against the winding sum
commit: 767ff9b
---

what
: The closed form for the η-dependence of the Higgs mass matrix — `ΔH₁₁ = −2(2π)²L₁·M₂/8`,
  `ΔH₂₂ = −2(2π)²L₂·M₂/8`, `ΔH₁₂ = 0` — was published against five worked cases. The instrument
  runs it against the direct winding sum on all **119** multiplets of the catalogue: worst
  disagreement **0.0162 %**. On the 16 multiplets the catalogue declares blind, the closed form
  predicts exactly zero and the winding sum measures exactly zero.

why
: Five cases cannot distinguish "the formula is right" from "the formula is right on the cases it
  was built on". 119 can, and the blind ones are the sharpest of the 119 because a prediction of
  exactly zero has nowhere to hide.

so
: The record is unaffected — no number in Parts IV or V moves. What changes is the strength of the
  evidence behind one of them.

  A trap paid for here, and it is the reason the blind cases are stated separately: 16 multiplets
  have no Part IV box, and the first sweep silently printed `M₂ = 0` for them and concluded
  "invisible to η". That was the right answer for the wrong reason — those 16 happen to be exactly
  the 16 the catalogue declares blind. On another group the same code would have lied. A missing
  datum is now an explicit `unknown`, never a zero.

---
date: 2026-08-26
part: VII
severity: note
affects_record: no
title: The instrument stood on the draft; it now stands on the published paper
verify: open the hierarchy section — the four levels of the ceiling, the other-symmetric-point panel, and the gauge-seed switch; _test_hierarchy.mjs checks each against the archived runs of the paper
---

what
: The hierarchy and anomalies sections were closed on the 9 August draft of Part VII, whose
  ceiling was the relaxation's **10.03 TeV**, called certified and drawn as one point. The paper
  as deposited on 24 August keeps that number as the bound the dual proves and adds three levels
  below it: **10.01 TeV** attained at (A₄, 8D) = (212, 1) once the lattice is lifted — the
  relaxation's own vertex (215, 1) is empty — **9.22 TeV** once the electroweak point must be the
  true vacuum, and **9.09 TeV** at the Higgs mass the Higgs actually has. The content that attains
  10.01 sits in a false vacuum: the potential is deeper at the other symmetric point by 316. The
  instrument had no way to see that, because it did not compute W.

  It now does. Every content carries `W = Σ_{c odd} m(−s)`, `F(1) − F(0) = (31/16) ζ(5) W` exactly,
  and a verdict — the numbers at a stationary point in a false vacuum are still shown, labelled.
  The ceiling a content is measured against is 9.22 TeV, and the four levels are a table with what
  each one bounds. Theorem 1 (8D odd) is now stated as the paper states it, **conditional on the
  gauge seed**: a switch lets the model stand on the candidate parity-resolved split of §13, under
  which 8D is even, A₄ half-integral, the relaxation ceiling drops to 7.38 TeV at 8D = 2, and
  Theorem 2 and the 2W theorem survive untouched. The five complete invariants (A₄, 8D, 2U, V, 2W)
  are computed in the kernel and checked, generator by generator, against `lattice_lift.py`.

why
: A page that says "certified ceiling 10.03 TeV" over a content in a false vacuum is showing a
  number the paper it advertises has since qualified. Publishing a part did not update the
  instrument built on its draft — the same failure that left the series pages saying "not yet
  deposited" for five days after Part VI was deposited, and it was found by auditing the whole
  site against the papers rather than the part that had just moved.

so
: The record is unaffected: nothing in the frozen Part VII depends on this page. Two things in the
  instrument were wrong and are corrected — the single ceiling, and Theorem 1 stated without its
  hypothesis — and one thing was missing, the stability functional, which is [8]'s criterion and
  not ours. And one bug of the shell surfaced while photographing the seed switch: a page opened
  with a permalink rendered nothing at all, so every deep link the tool had ever handed out was
  dead. Fixed in the same commit; the harness now opens one.

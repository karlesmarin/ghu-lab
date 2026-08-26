---
date: 2026-08-08
part: III
severity: extension
affects_record: no
title: And the rule bites — 40 of 60 forbidden representations really lose the minimum
verify: open the selection section and read the "does it bite" panel; it recomputes on load
commit: af80c8d
---

what
: Where the rule forbids halving the domain, halving anyway moves the minimum of the Wilson-line
  potential in **40 of the 60** representations tested — the worst by 45.1 % of the potential's own
  depth `|V|`. The other 20 are cases where the two domains happen to share their minimum.

why
: A selection rule that never changed an answer would be a bookkeeping convention rather than a
  constraint. Nothing in Part III measured how often it matters, because the paper's question was
  *which* domain is legal, not *what it costs* to use the wrong one. The instrument can ask the
  second question cheaply, so it does.

so
: The record is unaffected. This is the missing sentence about why the rule is worth stating, and
  it is now a panel rather than a claim: the numbers are recomputed in the page, over the same
  potential the calculator uses, so a reader can watch the minimum move.

  One trap paid for here, recorded so nobody repeats it: the first version scanned the half-domain
  on its own grid, which gave it twice the resolution of the full-domain scan and manufactured a
  "loss" of −5.3 × 10⁻⁴ that was mesh, not physics. Two regions must be compared from one set of
  evaluations.

---
date: 2026-08-08
part: III
severity: extension
affects_record: no
title: The selection rule reduces to one bit
verify: open the selection section; it re-runs the enumeration in your browser
commit: af80c8d
---

what
: Part III's admissibility test — `a + 2b + 3c` odd, or the representation degenerate — is a single
  parity: **the half-domain is legal if and only if `a + c` is even.** Since `a + 2b + 3c ≡ a + c
  (mod 2)`, and both branches of the degenerate case independently force `a + c` even, the second
  disjunct can never be the one that decides. Checked on all 3375 triples with `a, b, c ≤ 14`, of
  which 399 are degenerate: zero exceptions.

why
: The rule was stated as a disjunction because that is how it was derived — one clause from the
  centre charge, one from the degenerate orbits. Written that way it hides that the two clauses
  never disagree. The instrument evaluates both and compares them, which is why the coincidence
  showed up at all.

so
: The record is unaffected: the printed rule is correct, and this is a reduction of it, not a
  correction. Nothing in Part III depends on the disjunction being irredundant. The one-bit form is
  what the tool displays, with the disjunctive form beside it.

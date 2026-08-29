---
date: 2026-08-29
part: instrument
severity: extension
affects_record: no
title: A builder for any 5D SU(N) on S¹/Z₂ — the model becomes the input, not the subject
verify: open **SU(N) builder**, press the **§4.3 · SU(6), P ≠ P′** preset and give it four fundamental Dirac fermions. The page writes the potential — `10cos(nπa) − 18cos(nπ(a−1)) − 3cos(nπ2a)` — locates the deepest point at a = 1 and says what that is: an *end* of the fundamental domain, so the other symmetric point is the deeper one and nothing is broken by the Wilson line. Part VII's own criterion, F(1) − F(0) = (31/16)ζ(5)W, is quoted beside it and agrees. Nothing about SU(6) is in any data file: the whole thing is built from four block sizes.
---

what
: Every section of this instrument until now answers a question about a model somebody already
  wrote down — theirs or ours. This one takes the model as **input**. Type a boundary condition
  (four block sizes, which is what simultaneously diagonal orbifold parities are) and a bulk
  content, and it returns the one-loop Wilson-line effective potential of **any** 5D SU(N) gauge
  theory on S¹/Z₂, with the unbroken subgroup, the number of Wilson-line degrees of freedom, the
  potential written out term by term, and where its minimum is.

  It is Haba & Yamashita's general formula, *JHEP* **05** (2004) 059, §5 — the machine every
  model in this corner of the field is built on. The instrument already had one instance of it,
  their SU(3) case; this is the formula.

why
: Two things follow, and the second is the one that matters.

  First, a reader with a model of their own no longer has to redo the group theory by hand to get
  the object they need before they can do anything else. It is a form.

  Second, **when the model has one Wilson-line phase the terms are the (m, s, c) triples the rest
  of this instrument runs on**. So the closed form of Part VII, its five complete invariants and
  its stability criterion apply to somebody else's SU(6) as readily as to the SU(7) they were
  written for — and the page says which of those are theorems about the shape (they travel) and
  which are theorems about the SU(7) lattice (they do not, and become measurements you can check).
  The panel prints both, and reports the arithmetic laws failing for SU(6) as the measurement it
  is rather than hiding it.

so
: One correction to the printed formula, and two overclaims of our own caught before they shipped.

  The coefficients written (n₊₊ − n₋₋) and (n₊₋ − n₋₊) in eqs. (5.9), (5.10) and (5.17)–(5.20)
  must be **absolute values**: they count leftover rows. Two of the paper's own worked examples
  say so — §3's SU(3) has n₊₊ = 1 < n₋₋ = 2 and the printed formula flips the sign of its
  eq. (3.10); §4.3's SU(6) does the same to eq. (4.29) — and so does an invariance the formula
  must have, since the gauge field cannot tell (P, P′) from (−P, −P′) and that swap exchanges the
  blocks in pairs. The harness checks all four examples verbatim, checks the invariance, and
  checks that the *signed* reading fails: a correction nobody can see fail is not a correction.

  Ours: the vacuum panel first announced "the Hosotani mechanism" for a minimum sitting at
  **a = 1**, which is not a broken vacuum but the *other symmetric point* — the two ends of the
  fundamental domain are exactly the pair Part VII's criterion compares. Three verdicts now, and
  the criterion by name. And the two normalisations differ by the paper's ½, which is now stated
  in the panel and asserted in the harness rather than left to be rediscovered.

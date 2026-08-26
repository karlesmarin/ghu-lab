---
date: 2026-08-11
part: IV
severity: extension
affects_record: no
title: The compression to three integers holds at every root of unity, and there it is proved
verify: the paper, and the scripts with their archived output at schur-orbit-and-reciprocal-pair — theorem_full.py, 959 exact values, 476 zeros, 0 sign failures, 0 magnitude failures
---

what
: The alphabet of this paper, `(1,−1,t,t⁻¹)`, is the second member of a family: the full set of
  *t*-th roots of unity together with one free reciprocal pair. arXiv:2608.09619 evaluates
  `s_λ(μ_t, z, z⁻¹)` for **every t ≥ 2 and every λ**, with no hypothesis on the shape: the value
  is a signed product of exactly three factors over a fixed denominator, or zero, and the three
  arguments are read off the *t*-quotient of λ. At *t* = 2 the alphabet is `(1,−1,z,z⁻¹)`, which
  is this one. (The letter *t* changes job between the two papers: here it is the free variable,
  there the order of the root of unity.)

why
: This paper grades its closed form an *Observation*: checked against the bialternant in exact
  arithmetic on all 3060 partitions with four parts ≤ 14 and all 4845 with parts ≤ 16, with no
  mismatch, and *not proved*. The general statement carries a proof — a Laplace expansion along
  the *t* frozen rows of the bialternant with one cancellation lemma in the symmetric group, which
  also delivers the sign, the one already in Littlewood's evaluation at the roots of unity.

so
: No number here moves and the record does not need a new version. What moves is a status word:
  at *t* = 2 the closed form stops being an Observation.

  The rank-two case this paper stopped at, and said so, is now conjectured to be unrepairable
  rather than merely unrepaired: Conjecture 10.4 there says the value is a product of characters
  for every λ *if and only if* the free part is a single reciprocal pair. Four deformations of the
  alphabet are measured against it and each destroys the product. That is evidence, not a proof,
  and it is labelled a conjecture.

---
date: 2026-08-29
part: instrument
severity: extension
affects_record: no
title: The anomaly ledger — the bill a chiral spectrum runs up, channel by channel
verify: open **Anomalies** and press *load their §4.3 SU(6) with four fundamentals*. Twelve massless Weyl fermions in two pieces, thirteen channels, nine of them left owing — `U(1)(+,+)×[grav]² = 14/3`, `U(1)(+,+)³ = 127/54`, `U(1)(+,+)×[SU(2)(−,−)]² = 1/3` — every one an exact rational. And four cancel, including `[SU(3)(+,−)]³`, because nothing in this content is charged under that factor. Then load an **adjoint** instead: every channel goes to zero, on every boundary condition, because the adjoint is real.
---

what
: A chiral four-dimensional spectrum is inconsistent unless its gauge anomalies cancel. That is the
  first gate a model has to pass; it has to be checked channel by channel; and it is where an
  arithmetic slip hides best. This computes it for any 5D SU(N) boundary condition and bulk
  content: every channel the unbroken group has —  [SU(n)]³, U(1)×[SU(n)]², U(1)³, U(1)×[grav]² —
  with an exact rational coefficient, so a zero is a zero and not a rounding.

  It shares the builder's model, like the spectrum panel. One model, three views: the potential and
  its vacuum, what the model contains, and what that content owes.

why
: Because the four-dimensional anomaly is the right object, and that is a theorem rather than a
  convenience. Arkani-Hamed, Cohen and Georgi (hep-th/0103135) compute the anomaly on S¹/Z₂ and
  find it lives entirely on the fixed points, independent of the shape of the mode — their eq.
  (4.38), `∂_C J^C = ½[δ(x₄) + δ(x₄ − L)] Q`: each fixed point picks up **half** the anomaly of the
  chiral zero mode, and in their words *"the cancellation of the four-dimensional anomaly is
  sufficient to eliminate the five-dimensional anomaly"*.

  And because a non-zero row is **not** a verdict of inconsistency. Every model of this kind
  carries brane fields, since the unwanted zero modes have to be given mass — Komori and Maru say
  how in as many words after their eq. (76), by introducing the 4D fermion *conjugate* to each — and
  a conjugate brane fermion contributes to the same channels with the opposite sign. So the ledger
  reports a **bill**, and says who can pay it. That is Part VI's own reading, generalised off the
  one model it was written for.

so
: The harness caught three premises of mine that were wrong **physics**, not wrong code, and each
  was replaced rather than patched.

  *p = s does not make a spectrum vector-like*: the left-handed piece lives in the (+,+) block and
  the right-handed one in (−,−), and those are different SU factors even at the same size.
  *Flipping ηη′ is not conjugation*: it moves the zero modes to the other pair of blocks, which is
  a different theory — on a boundary condition with q = r = 0, one sign gives zero modes and the
  other gives none at all. And *an unbroken boundary condition is the maximally chiral case*, not a
  vector-like one: it is ACG's own setup, one zero mode per bulk Dirac fermion, and anomalous.

  What replaced them is stronger because each is a real statement: an **adjoint** bulk fermion is
  anomaly-free on every boundary condition, because the adjoint is real — which is a genuine test
  of the conjugation on the off-diagonal pieces, and the module failed it at first by counting
  (a,b) and (b,a) as two fundamentals instead of a fundamental and an anti-fundamental. And a piece
  fed in with its own conjugate must cancel, which tests every sign at once.

  Collaterally, the build's collision guard refused the first version by name: it declared its own
  `gcd`, and `src/kernel/charges.mjs` — Part VI's exact-rational arithmetic — already had one. The
  ledger uses the kernel's, which is what a neighbour should do.

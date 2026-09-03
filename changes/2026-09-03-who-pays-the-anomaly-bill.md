---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: Who pays the anomaly bill, and what it costs
verify: open **Brane matter** and press *load Kawamura's SU(5)*. The two branes read **SU(5)** at y = 0 and **SU(3) × SU(2) × U(1)** at y = πR — the same orbifold, two different groups. The bill says *7 channels owing*. In **Who can pair with a given mode**, press *add it* on the first candidate: the bill goes to **0 → every channel cancels**, the massless count goes to **0**, and the chip beside it says the anomaly of what survives equals the anomaly of everything that entered. Then move that field's charge by one and the same representation lifts nothing.
---

what
: `src/modules/brane.mjs` puts fermions on the two fixed points and holds the choice to **two**
  verdicts at once: the anomaly ledger, recomputed over bulk and brane together, and Part I's
  boundary-mass gate, which says which zero modes that same matter has just given a mass. A brane
  field is a representation of the **local group** — the commutant of the one reflection acting
  there, S(U(n₊₊+n₊₋) × U(n₋₊+n₋₋)) at y = 0 and P₁'s at y = πR — written as a two-block frame, so
  the ledger, the U(1) generators and the charge of a piece are the routines the rest of the
  instrument already uses, on a coarser partition of the same N indices. Nothing here recomputes an
  anomaly: both columns of the bill are `an5LedgerOnFrame` on one list of pieces, once without the
  brane matter and once with it.

  Three consequences the arithmetic knows and prose does not. A local representation splits into
  several pieces of the unbroken group, so you cannot add "the conjugate of that one mode" and
  stop — the partners panel lists what each candidate **drags in with it**. Its charge under the
  local U(1) is a free rational, which is where Part VI's forced brane charge lives, and
  `brSolveCharges` solves the channels that are linear in it exactly while reporting the cubic ones
  **apart**, because paying the linear channels does not make a model anomaly-free. And the two
  jobs pull apart: gauge invariance of the mass term fixes the charge to one value, the anomaly
  wants another, so the same field cannot always do both.

why
: The panel next door has ended in an apology for as long as it has existed — a non-zero row is not
  a verdict, because these models carry brane fields and Komori and Maru say right after their
  eq. (76) that one introduces the 4D fermion *conjugate* to each unwanted zero mode. That is now
  a control rather than a sentence. Part I's own statement of the gate is dimension-blind and is
  used verbatim: in a fully left-handed convention a mode in r_q pairs with a localised Weyl in
  r̄₋q, and — its words — *"test de rango, no de conteo"*, so what survives is |difference| in each
  class separately, a class being the representation under every block **and** all its U(1) charges.

so
: The control is that a paired class and its conjugate are vectorlike, so the anomaly of what
  survives must equal the anomaly of everything that entered — a rank test over class keys and an
  exact rational ledger agreeing on **8 190 models** of SU(3)…SU(6), which they can only do if the
  keys really are conjugate; the gate lifts something in 6 972 of them. The decoy is the same gate
  on keys that ignore the charges: it **over-lifts on 89** models, which is Part I's warning as a
  number, and **under-lifts on 166**, where a real representation carrying opposite charges makes
  one blind key its own conjugate. Not done, and said on the page: the ledger is the **sum** over
  the two fixed points and not the split between them; the rank test is the **generic** answer, so
  the surviving content is a lower bound; there is no U(1)′ beyond the local group; and the gate is
  read at the symmetric point, because the local groups do not move with the Wilson line but which
  modes are massless does.

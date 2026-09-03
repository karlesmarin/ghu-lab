---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: The Standard-Model cell, read where it lives
verify: open **One model, every verdict** on SU(6) with boundary condition [3, 1, 2, 0] and four bulk Dirac fields — a fundamental and an antisymmetric with ηη′ = +, and the same two with ηη′ = −. The group **The Standard Model** reads *yes, all five; Y fixed, sin²θ_W = 3/8; Higgs doublet: 1*, with the exotics listed as (colour, weak)_Y. Switch to SU(5) [3, 0, 0, 2] with a fundamental and an antisymmetric: *2 of 5 (uᶜ, eᶜ; missing Q, dᶜ, L)* … and L appears once the doublet is read as pseudo-real, which it is; Q and dᶜ stay missing, as the literature knows.
---

what
: `src/modules/smcell.mjs` asks the model builder's first question of the vacuum's massless
  content: is SU(3)×SU(2)×U(1)_Y in the unbroken group, with pieces carrying Q, uᶜ, dᶜ, L, eᶜ at
  their hypercharges? Colour is a block of size three, weak isospin a block of size two, and Y is
  solved **exactly**, in rationals, as a combination of the blocks' U(1) generators on the pieces
  offered as each field — Part II's counting, K − 1 unknowns against one constraint per field.
  When the fields fix Y the embedding fixes sin²θ_W = tr T₃² / (tr T₃² + tr Y²) over the
  fundamental; when they do not the page says how many directions are free. The largest
  assignment is kept and what is not found is listed as **missing**; the pieces outside the cell
  are listed with their (colour, weak)_Y, which is the brane's bill in the units a builder reads.

  It is read at the symmetric point **nearest the vacuum** — each phase rounded to 0 or 1 — with
  the distance printed and the blocks the vacuum breaks named. That is physics: the vacuum's job
  is to break SU(2)×U(1)_Y to U(1)_em, so an unbroken weak block at the minimum would refuse
  every realistic model. The rounded point is a class-mate chosen by the vacuum, so the reading is
  the theory's and not the frame's, and the dossier tags it so on all 86 classes of SU(4)…SU(7).

why
: Three anchors and one absence. Georgi–Glashow's direction gives 3/8 from the exact solve on
  SU(5) [3,0,0,2], on Kawamura's split [2,3,0,0] and on SU(6) [3,1,2,0] — three routes to one
  rational. SU(6) [3,1,2,0] with 6, 6′, 15, 15′ hosts the whole cell and a Higgs doublet in A_y
  with Y = ½. And on SU(5) [3,0,0,2], over all 64 two-representation bulk contents, no content
  has Q or dᶜ together with sin²θ_W = 3/8: a left-handed zero mode has P₁-twist +1, so a
  bifundamental across the two P₁ signs — Q — only ever appears as its conjugate, and the colour
  block's fundamental pieces are all left-handed, so dᶜ never does. The thirteen contents that do
  show a Q do it by bending Y to a hypercharge that is not Georgi–Glashow's, and the page prints
  that sin²θ_W beside it. The doublet of SU(2) is pseudo-real, and reading 2̄ as 2 is what lets L
  be found from the right-handed chirality.

so
: The solver is made to fail on purpose: an inconsistent system returns nothing, an
  underdetermined one returns its free count, and changing eᶜ's hypercharge to 2 in the cell
  makes the anchor content stop hosting uᶜ and eᶜ together. Not done: three generations, brane
  matter to pay the bill, Yukawas, and the running of the couplings from 3/8 down to the measured
  angle — the next tools, listed in the HANDOFF.

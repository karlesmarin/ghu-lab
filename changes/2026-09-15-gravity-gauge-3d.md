---
date: 2026-09-15
part: instrument
severity: extension
affects_record: no
title: Gravity–gauge in 3D — equal masses, different responses
verify: Open Gravity & gauge · research → Gravity–gauge · 3D, press eta=-0.9 and eta=0, and compare the unchanged paired masses with the changing Wilson scale and response. Rotate the plots or select a point on the surface.
---

what
: A new app panel explores a positive gauge kinetic family on a warped interval. Controls,
  two interactive 3D plots, tables, help, result-card and LaTeX exports, and a permalink are all
  part of the existing app. The response surface can show the spectral-weight multiplier or Z.

why
: A complete paired tower of masses and a fixed four-dimensional gauge coupling leave independent
  source-response and Wilson-normalization information. This panel makes that ambiguity testable
  by changing the action while holding those inputs fixed.

so
: The paired tensor-NN/vector-DD spectrum is protected. The vector-NN control has different
  boundaries and moves. p=1.1 has a canonical scalar bulk realization; general p=1 weights are
  kinematic references, with eta=-0.99 recovering minimal RS. No Higgs mass, radion stability or
  collider rate is inferred. The established operator and GHU literature is linked in the panel.

  The normal build runs 104 new checks against independent Python/SciPy references and the
  compiled engine. The new panel passed 20 Chromium interaction/export/layout checks. Read
  `docs/h185-gravity-gauge.md` for the equations, numerical provenance and full user instructions.

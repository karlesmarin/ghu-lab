---
date: 2026-08-30
part: instrument
severity: extension
affects_record: no
title: Brane kinetic terms — the tower when the masses stop being n/R, and a demonstration you can send
verify: open **Brane kinetic terms** and press **▶ run the demonstration**. The dial walks c from 0 to 25 and each Kaluza–Klein root slides off its pole. Step 3 solves the authors' own eq. (3.22) live and lands on their eq. (5.19), ten pages later, with the error falling like α². Press **🔗 link** at any setting: the URL carries the dial, so the page can be sent.
---

what
: A brane-localized kinetic term is an extra kinetic term sitting **on the orbifold's fixed
  points**. With one, the Kaluza–Klein masses stop being `n/R`: they become the roots of a
  transcendental equation, the sum over the tower diverges and needs regulating, and the potential
  has to be built from the roots rather than written down. `src/kernel/blkt.mjs` does that, and a
  new section demonstrates it.

  Four steps. The mass equation drawn, with the **poles** marked — because at `c = 0` the poles
  *are* the spectrum, and watching the roots slide off them is the mechanism rather than a
  description of it. The same thing read as a spectrum, with the drift. **The check.** And what it
  buys, in the authors' own numbers.

  It is the live route, not a curiosity. Akamatsu, Hirose, Maru and Nago's 2023 model sits at
  about 303 GeV, too low to be viable; their 2026 paper turns brane terms on and lifts it. We had
  measured the alternative — the whole symmetric-rank ladder of their 2023 paper — and its best
  point is 464 GeV. They were right to change route, and until now this instrument could not
  follow them there.

why
: Step 3 is the reason the other three can be believed, and it is worth stating separately.

  Their **(3.22)** is an approximation they derive on p. 10 to test their own regularization.
  Expanded for α ∼ x ≪ 1 it collapses to `x = m|α| / (2√(1+c))` — which at m = 1 is their
  **(5.19)** on p. 20, ten pages later. The page solves the first numerically and compares it with
  the second, live, across `c` from 0.5 to 50; the relative error runs 3×10⁻⁴ → 2×10⁻⁵ → 8×10⁻⁷
  as |α| shrinks by 4 and then 5. **Falling like α² is the point**: a fit that merely agreed would
  agree equally well at every α. Two of their equations, joined by our arithmetic, in the page.

  The kernel's own controls are harder still. As `c → 0` the roots must become the ordinary
  twisted tower — which is computed in closed form from the poles, so two independent objects have
  to meet. And the special functions are held to **mpmath at 40 digits**
  (`tests/blkt_reference.json`), not to values typed from memory.

so
: Everything that could find a defect did, and each one is now a gate.

  **The `c → 0` control found three.** A plain grid *cannot* locate the roots — as `c` falls each
  root migrates to a pole and sits a distance of order `c` from it, so root and pole land in the
  same cell; the solver brackets *by* the poles now. `blktFreeTower` was rounding to 1e-9 to
  de-duplicate, which capped how close the search could get. And the real one: **catastrophic
  cancellation** — `cos(a) − cos(θ)` near a pole is `−1 + 5×10⁻¹⁸`, which rounds to exactly `−1`,
  so the denominator was exactly zero and the whole `α = 0` sector went missing. That is the
  symmetric point, which is the sector the physics is about. It uses
  `cos A − cos B = −2 sin((A+B)/2) sin((A−B)/2)` now, which does not cancel.

  **mpmath found two.** Our "tabulated" `E₁(5)` was wrong in the twelfth digit and the JS was the
  half that was right — a reference you wrote yourself is not a reference. And the digamma was
  shifting only to 8 before its asymptotic series, leaving 5×10⁻¹³ at small argument.

  **`build/drive.mjs` found one, and it was the number a letter would carry.** The paper prints
  **two** minima, one per value of `c` — (0.438, 0.299) at `c = 0` in the text, (0.46, 0.30) at
  `c = 15` in the caption of Fig. 1 — and this page was reading the first at the second, giving
  1213 GeV. Their own (5.19) at their own `c = 15` minimum gives **1171 GeV**; the **1.398 TeV**
  that rounds to the "1.4 TeV" they printed is the same equation with **α₂ dropped**. The page
  computes all three, says which is which, and warns that the two minima are not interchangeable.

  And the permalink is not a convenience. A demonstration that cannot be sent is a demonstration
  nobody sees: any section may now declare `encodeState`, so a link opens on exactly the model and
  coefficient it was left at, and a reader moves the dial themselves instead of taking a sentence
  on trust.

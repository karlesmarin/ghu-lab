---
date: 2026-09-08
part: instrument
severity: extension
affects_record: no
title: The seven panels that could not export, and the button that had been dead for weeks
verify: open **Boundary conditions**, **Orbifold alphabet**, **Relations**, **Scan**, **The 4D content**, **The anomaly ledger** or **Brane matter** and press ⇩ card. Each writes a card about the model that panel is holding, with that panel's own numbers. And on **Four published models**, press ⇩ LaTeX: it writes a file. It had written nothing at all, silently, for as long as that panel has printed the line about ψ₁ᴿ.
---

what
: Seven panels hold their own model and could not export it, so this morning both their export
  buttons were hidden — the honest answer, and a loss of capability that was listed here rather
  than left to be discovered. They export now: `anomaly5d`, `bcclass`, `brane`, `orbifold`,
  `relations`, `spectrum5d`, `sweep5d`.

  Each carries **its own** values, not the builder's. The ledger exports the channels it checked
  and the three-valued verdict, so "no subject" — no massless fermion, nothing to cancel — cannot
  be read as "anomaly-free". The brane panel exports both bills separately, because a content can
  pay the anomaly one without lifting the zero modes, and the mass gate's own control travels with
  the answer. The 4D content exports **where it was read** — the vacuum or a typed Wilson line —
  because the two differ at the lowest level of the adjoint, and a spectrum with no point attached
  is a table with no hypothesis. The class panel exports the **class**, with the reminder that the
  apparent unbroken group is not an invariant of it. The orbifold panel exports a **refusal** as a
  refusal, with no numbers, because an empty alphabet and degree zero look exactly like an answer.
  Relations exports the attribution — whether a row is derived here or read out of Sturmfels and
  Sullivant. The scan exports the whole funnel and both counts, and if it has not been run it says
  so rather than running itself and handing back numbers nobody saw.

  Then pressing the buttons found three defects that were already there.

  **The LaTeX button on the published-models panel wrote nothing at all.** `papers.mjs` prints "a
  triplet leaves ψ₁ᴿ, ψ₂ᴸ, ψ₃ᴸ"; neither superscript was in the glyph table; `tex()` did what this
  project decided in August that it must — throw rather than drop the character — and the exception
  landed inside a click handler, where it goes to a console nobody has open. The button had been
  dead for as long as that line has existed. **Nine more characters** were one keystroke from the
  same fate: the conjugate bar, the Kaluza-Klein half, the superscript c, the hatted Mandelstam
  variable. And `3̄` needed a change to `tex()` rather than to the table: a combining mark modifies
  the character before it, and a map from one code point to one string cannot reach backwards.

why
: Because the alternative to exporting is not neutral. This morning's fix made those seven panels
  honest by taking the buttons away, and honest is where you start, not where you stop: a reader
  who has just watched the anomaly ledger decide something about their model wants to keep it, and
  "we would rather give you nothing than give you the wrong thing" is only the right answer while
  the right thing does not exist yet.

  Four of the seven share the SU(N) builder's model but not its numbers, which is why none of them
  could simply borrow its card. An export naming this boundary condition and then tabulating the
  builder's potential would be about the right model and the wrong computation — the same defect
  the card button had, one level down.

so
: `drive.mjs` now presses **both buttons on every section that holds its own model** and requires
  the two files to name one model. That check is what found the dead button: the panel had had a
  `texExport` all along, the driver had confirmed the button was VISIBLE, and whether the method
  ran was a different question from whether it existed. Nothing here had ever pressed it.

  `_test_latex.mjs` swept `data/` and the citation registry and cleared every string in them. The
  string that broke the export was a JS literal, so the sweep now reads the source too — 57 files,
  131 distinct non-ASCII characters, comments stripped. A region a gate filters out is where it is
  blind, and this one was blind to code.

  And with all thirteen panels exporting, the half of the rule that HIDES a button had no section
  left to exercise it. So the driver takes one section's `texExport` away in the live page, requires
  both buttons to go and pressing them to write nothing, and puts it back — verifying that it did.
  It is the only check in that file which constructs its own failure rather than finding one.

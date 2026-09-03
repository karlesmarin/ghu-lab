---
date: 2026-09-03
part: instrument
severity: note
affects_record: no
title: A column cut off at the edge of a card, and the two gates that could not see it
verify: open **Anomalies & proton** at any window width. The catalogue table — multiplets, contents, in window, hold host, can pay, best 1/R₅, best that pays — now sits at full width below the two columns, with all seven columns visible and the page not scrolling sideways. Then open any section and check that no verdict box shows a bare dash: the census recurrence says *not checked yet* and what to press, the relations panel says *nothing judged yet*, and clearing the model leaves the α caveat in the hierarchy panel saying it has no subject rather than vanishing.
---

what
: A reader reported that one table ran off the edge of its card. It was one CSS declaration, and
  it was the right declaration in the wrong place: `.card table{display:block;overflow-x:auto}`
  — the rule that lets a wide table scroll inside its card instead of widening it — lived inside
  `@media(max-width:959px)`. Above 960 px a table that did not fit simply pushed its card out, and
  the columns past the edge were **gone**. Eleven boxes across four sections, and on two of them
  the whole page scrolled sideways. The rule is now unconditional.

  Three tables were then still asking for a horizontal drag, which is a scrollbar standing in for
  a decision: the SU(7) catalogue moved out of the two-column grid to **full width**, where its
  seven columns and its 560 px plot belong; the pre-registered sixth row and the T²/Z₆ census got
  shorter headers. Nothing on the page needs a sideways drag now.

  Three verdict boxes were showing the `—` they were built with: the census recurrence and fibre
  until the sweep is pressed, and the relations move until one is typed. The page's own footer
  says a verdict is *"said out loud with its reason — never an empty cell"*, so each now says what
  it is waiting for. Two of them were unreachable fixes at first — the caller returned before the
  code ran, which is the same shape as the guard-in-the-caller bug this instrument has now paid
  for four times.

why
: Because none of the existing gates could see any of it. The harnesses check the mathematics
  against outside computations; the smoke test checks the markup is built; `shoot.mjs` takes a
  picture — of the defect, not a complaint about it; `drive.mjs` checks the controls answer a
  mouse. A column clipped at the edge of a card passes every one of them, and a reader sees it in
  one second. Two new tools close that: **`build/layout.mjs`** walks every section at several
  widths and in every state a reader can put it in — how-to open, each help bubble open, the demo
  running — and reports anything whose content is wider than its box, telling apart a box that
  scrolls, a box that clips, and a box that truncates with an ellipsis and can give the text back.
  **`build/extremes.mjs`** drives the page through the states no gate visits — every family
  cleared, one multiplet, every slot at its ceiling, and boundary conditions at the corners of the
  block simplex — and looks for the six ways a template literal says it was handed something it
  did not expect, plus verdict boxes that decided nothing.

so
: Layout: 28 findings → **0 clipped, 0 boxes that need a drag**. Extremes: 416 (section, state,
  width) renders came back clean. The verdict rule is now driven on the real page for all 26
  sections at once. Both tools exit non-zero, so they can be gates rather than reports; both are
  documented in the README with the rest of the build.

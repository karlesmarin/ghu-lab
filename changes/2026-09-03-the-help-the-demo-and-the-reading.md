---
date: 2026-09-03
part: instrument
severity: extension
affects_record: no
title: A how-to on every section, a demo that drives it, and the results read back in sentences
verify: open any of the twenty-five sections: the first card is **How to use this section**, folded, with what it answers, what to press and how to read what comes back. On **SU(N) builder**, **What the model contains**, **Anomalies**, **One model, every verdict** and **Simulator** the same card carries a **▶ demo** button: press it and the parameters move by themselves, one change per step, with a caption saying what just happened. In the Simulator and the dossier a card called **What these numbers say** turns the computed values into sentences — move the Wilson line and the sentences move with it.
---

what
: Three things, and none of them adds a number to the page.

  **A how-to on every section.** `src/view/howto.js` carries one entry per section — what it
  answers, what to press in order, and how to read the result including what would make it not
  apply — and the shell mounts it above whatever it renders. It is mounted by the shell rather
  than written into twenty-five files because a section that forgot would look exactly like a
  section with nothing to explain; `_test_howto.py` fails the build if a built section has no
  entry, if an entry names a section that no longer exists, if an entry is thin, or if its
  `what` and its `read` say the same thing.

  **A demo that drives the panel.** `src/view/demo.js`: five sections carry a scripted run —
  from a boundary condition to a vacuum, a published model reproduced and then falsified, which
  answers are about the theory, what a model contains, and two boundary conditions that are one
  theory. Each step performs a real edit through the page's own state and says what it changed;
  `next` and `stop` are there, it advances by itself every eight seconds, and stopping restores
  the model the reader had before it started.

  **The results, read back.** `src/modules/reading.mjs` turns the computed object into ordered
  sentences: the verdict first, then what it rests on, then what would move it. Every sentence is
  a function of the numbers — move a parameter and it changes — and what the instrument cannot
  decide is said in the same list rather than left out.

why
: A panel with six controls teaches nothing until somebody moves one and sees a number answer,
  and fifteen numbers coming back at once do not say which of them just decided something. The
  reading also carries the discipline the rest of the page carries: a comparison names the
  hypothesis it rests on (the CMS bound needs colour in the bulk) and the source of the measured
  number it uses, and no sentence calls a model promising, viable or worth pursuing —
  `_test_reading.mjs` fails on those words. It is arithmetic said in words, not advice.

so
: The gates are the interesting part. `_test_reading.mjs` holds each sentence to the condition
  that produces it *and* to the condition that must not: a scale above the bound reads as
  holding, below it as failing and carrying its hypothesis; a Higgs at half the measured mass
  must not read as holding; a model with no located vacuum produces exactly one sentence and it
  says so; and the whole reading must differ between two vacua of the same model, because a text
  identical before and after is a text that is not a function of the numbers.

  And `drive.mjs` walks all twenty-five sections requiring a how-to with at least two steps in
  each, then drives the demo with a real mouse. It found a real defect on its first run: the
  `next` button advanced the counter twice, so one step of the demo never happened. The index of
  the step being shown is now the only thing that advances it.

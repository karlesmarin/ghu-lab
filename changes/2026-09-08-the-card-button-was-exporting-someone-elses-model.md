---
date: 2026-09-08
part: instrument
severity: correction
affects_record: yes
title: The card button was exporting a model you were not looking at
verify: open the **SU(N) builder**, build a model that is not the family's, and press ⇩ card and ⇩ LaTeX one after the other. The two files now carry the same model id in their names and the same model inside. Before this the .json was about the shell's model and the .tex about the one on screen — on the deployed build the driver reads back `card 5f23df88b593` against `tex 8f763d32ac5e`, from one screen, in one second.
---

what
: Thirteen sections here declare `holds()` — they are showing a model that is **not** the shell's,
  and the header says so with *"this section holds its own model"*. The rule for exporting from
  one of them was written five days ago and is not in dispute: unless the section hands over its
  own card through `texExport`, the button is hidden, because a control that cannot do what its
  label promises is worse than a missing one.

  That rule governed `⇩ LaTeX`. It did not govern `⇩ card` — the JSON and the plain text, which is
  what a reader actually keeps. That button called `run()` unconditionally and wrote the **shell's**
  model out of all thirteen. In the six sections that do implement `texExport` the two buttons sat
  side by side handing out files about different models, and neither file said which.

  The file name came from the shell too, so two exports could carry the same name and different
  contents.

  One predicate hides both buttons now, and one function — `exportCard()` — decides which model is
  leaving the page. Neither handler builds a card of its own any more.

why
: Because this is the failure mode with no symptom. The JSON was well formed, every field in it was
  right, the status column was honest, and only the *model* was somebody else's. Nothing in the
  page looks wrong, and nothing in a file looks wrong either — it is a correct file about the wrong
  thing, and a reader who saves it has documented a computation they never ran.

  The comment above the LaTeX guard had said, in writing, that the defect was *"still latent in
  every other section that holds its own model"*. It was, and the button next to it was where.

  Nothing could have caught it. `drive.mjs` walks the rail asking whether the LaTeX button is shown
  where it should be, section by section, and had never once asked about the card button — the
  string `btnCard` did not appear in that block. The gate measured the rule on the control it was
  written for.

so
: The driver now asks about **both buttons in one pass**, and separately presses both on a section
  whose model is its own and requires the two files to name the same model — which is the only
  check that can see the bug in the state where it fired, with both buttons visible and both
  working. Pointed at the deployed build it goes red twice and prints the two ids.

  `drive.mjs` also gained `--page`, which the other three browser tools already had. Without it the
  one driver that presses real controls could not be aimed at the copy that is actually deployed,
  so a regression written here could not be asked what it does to the build it was written about.

  **Seven sections lose their card button**: anomaly5d, bcclass, brane, orbifold, relations,
  spectrum5d and sweep5d. They hold a model and cannot export it, so what they were offering was
  the wrong one. Giving it back is a `texExport` each, carrying that section's own values rather
  than the builder's — four of them share the SU(N) builder's model but not its numbers, so
  delegating would export the right model with the wrong values, which is the same lie one level
  down. They are listed here so the gap is visible rather than absent.

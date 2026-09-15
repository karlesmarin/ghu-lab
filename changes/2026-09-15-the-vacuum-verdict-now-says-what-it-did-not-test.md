---
date: 2026-09-15
part: instrument
severity: correction
affects_record: yes
title: The vacuum verdict now says what it did not test, and a caveat that was an overclaim came out
verify: open **Hierarchy** with the published anchor row and press ⇩ card. The JSON's `vacuum` value now carries a `scope` block — `geometry: "fixed"`, `varied_fields: ["wilson_line_phase"]`, `radius_stability: "not-evaluated"` — and the plain-text export opens the same verdict with *"Angular vacuum at fixed geometry."* Then read the row's caveat in the model panel: it no longer claims the row is the only one inside the 125–127 GeV window. The panel prints both routes side by side, 125.85 and 127.85 GeV, and they fall on opposite sides.
---

what
: The `vacuum` result of the hierarchy module used to hand over a three-valued verdict —
  true vacuum, false vacuum, undetermined — and nothing about **what was varied to get it**. It is
  obtained by minimising over the Wilson-line phase **at fixed geometry**. The radius is a field
  too, and it was never varied. Neither was the joint Higgs–radius direction.

  Now the verdict carries its own scope, and the scope travels into **both** exports — the JSON
  card and the plain text:

      scope: { geometry: "fixed",
               varied_fields: ["wilson_line_phase"],
               radius_stability: "not-evaluated",
               joint_higgs_radius_stability: "not-evaluated" }

  And the caveat on the published anchor row of `su7_km25` used to end *"…and this is the only row
  whose m_h falls inside the 125–127 GeV window"*. That is true by the **approximate** route and
  **false** by the **summed** one, and the two fall on opposite sides of the window. It now says
  that the window is decided by the summed potential, which is what the panel computes.

why
: Because a `true-vacuum` verdict with no scope reads as a statement about the vacuum of the
  theory, and it is not one — it is a statement about one direction of field space with everything
  else held still. A reader who keeps the exported card keeps the verdict; if the card does not
  carry the hypothesis, the hypothesis is lost at exactly the moment the number starts travelling.

  The caveat had the same shape one level up: a sentence that was true of the route the tool no
  longer uses to decide. Two routes that disagree is not a defect — printing only the one that
  agrees with you is.

so
: The scope is **not prose**. `_test_hierarchy.mjs` gained a harness of four cases — published
  angular minimum, false angular vacuum, no electroweak breaking, no branch located — and each one
  asserts three things: the verdict still answers the original question, the **JSON** names the
  fixed geometry and both untested stability questions, and the **text** export carries the same
  two sentences. An export that drops the scope fails the build.

  `build/drive.mjs` gained nine assertions through a real mouse holding the panel to the corrected
  caveat: that the anchor header names the summed potential as the window arbiter; that the actual
  anchor spans opposite sides (`in_window` true, `in_window_summed` false); that both routes are
  visible with their distinct values; that **only** the summed flag can admit a true angular
  vacuum; that an **unavailable** summed mass gives *window undetermined* rather than a pass; and
  that the three negative states stay distinguishable — *false vacuum*, *No electroweak breaking*,
  *No small-phase branch located*. Three different reasons for "no" that a single flag would have
  merged.

  Gates on this build: 1 982 checks across 47 harnesses, `drive.mjs` 206 ok, site 30 ok,
  `layout.mjs` 0 to fix, `extremes.mjs` 448 clean renders, `leaks.mjs` nothing grew with 0 console
  over both walks, `lifecycle.mjs` 9 panels abandoned with nothing left behind.

  Still not evaluated anywhere: the **radius** direction. The scope now says so, which is the
  honest floor and not a fix.

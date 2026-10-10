---
date: 2026-10-10
part: instrument
severity: extension
affects_record: no
title: A guided 🎬 Demo in every section, Simulator mode and experiment card
---

what

All 44 parts of the laboratory now have a 🎬 Demo button: 29 menu sections and the Simulator
modes in "How to use this section" (a section with several demos offers a menu), and the nine
experiment cards in their heading. A demo presses the real controls, explains each step in a
banner with Next and stop buttons, and ends with how to read the result and a link to the full
guide. A link with demo=<id> starts one; lang=es gives it in Spanish.

why

The first demo, in the KK gluon card, showed that a reader understands a panel fastest by watching
it answer. The video guide already scripts every panel; the demos reuse that script inside the
laboratory, where the reader can take over at the end.

so

The demos are generated from the video storyboard and the user guides, so the two cannot drift
apart: a harness fails if either changes without regenerating them. A browser gate runs all 44
demos to their closing panel and requires that no step fail, with negative controls proving the
gate can fail. The nine experiment cards have hand-written demos instead: each follows the question its
card answers, presses its own presets, and every number in the banner is read from the card at that
step (src/view/card_demos_cards.js).

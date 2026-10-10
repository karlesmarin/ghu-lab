---
date: 2026-10-10
part: instrument
severity: extension
affects_record: no
title: Video guide re-recorded on the current laboratory, with the 🎬 Demo buttons
---

what

All 44 chapters and 145 scenes of the bilingual video guide were captured again on the laboratory as it now
stands. The previous revision (morning of 10 October) predates the guided 🎬 Demo buttons, so none of its screens
showed them. The welcome now says that every section and card has a Demo button, and the KK-gluon chapter opens by
starting that card's own demo, then stops it and takes over. Its narration follows the card after the external
review of the same day: the published RS point with all nine bulk masses, and the m(tt̄) Δχ² with the SM-theory
uncertainty taken as one correlated normalisation (5.3 instead of 1.8 for the flat coloron at 4.5 TeV).

why

A walkthrough whose screens no longer match the laboratory teaches the wrong page.

so

`tools/video_guide/add_revision_demos.py` makes the revision; every chapter was recorded, narrated, rendered and
verified against the application now in the tree. The 10 October morning revision is preserved as
`video/2026-10-10-kkgluon.html` with its original media, and the video gate checks that it still plays. Demos are
generated from the same storyboard; the video's start and stop of a card demo are left out of them (a demo cannot
start itself), and `_test_demo_scripts.mjs` checks both.

---
date: 2026-10-07
part: instrument
severity: note
affects_record: no
title: Complete laboratory map, source-derived counts and updated neutrino scope
verify: Run tools/laboratory_inventory.py, compare both README catalogs with its menu order, run build/build_app.py --browser and build/build_site.py, and follow the laboratory-inventory guide.
---

what
: 🧭 Both READMEs and the public home/docs now expose the complete laboratory: model
  families, three Simulator modes, seven attached experiment cards, integrated analyses,
  optional scientific engines, experimental references and three reproducible batch studies.
  The 29-entry navigation catalog follows the actual registry order. A detailed map and
  source-derived JSON inventory show where each capability lives.
: 🧬 The neutrino guides, model explanation and exports acknowledge computed leading
  Majoron light/heavy widths and the separate three-copy flavour reconstruction.
  The unresolved full width, joint fits and uncomputed channels retain their scope.

why
: A navigation count alone hid much of the implemented laboratory. Older descriptions
  also continued to list Majoron phenomenology and all flavour work as wholly uncomputed.

so
: Readers can find and try the current capabilities without inferring them from the
  historical panel count. Emojis and aligned route tables make the map easier to scan.
  Numerical calculations and archived scientific results are unchanged.
: Long paths in the change log wrap within their column on narrow screens.

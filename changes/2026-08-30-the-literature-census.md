---
date: 2026-08-30
part: instrument
severity: extension
affects_record: no
title: A census of the literature — and its finding is an absence
verify: open **The literature**. Of 84 distinct papers in the corpus, **11** print all three legs of the triple a comparison needs — content, minimum, mass — and **8** have been read and are asserted with a page or an equation. Search the table, or switch it to *no published minimum*. The six papers the sweep shortlisted and nobody has opened are listed by name.
---

what
: To compare two gauge–Higgs models you need three things from each: the bulk **content**, the
  **minimum** of the Wilson-line potential, and a **mass**. There is no dataset that gives it —
  HEPData is experimental, and the tables of this field live inside PDFs and nowhere else.

  So this section is curation, not calculation, and it keeps two halves apart on the page.
  **Measured**: every paper in the corpus swept for the signals its text carries — complete,
  reproducible, and worth exactly what a keyword sweep is worth, which is that it turns a corpus
  into a shortlist. **Read**: the rows the census actually asserts, each naming the page or
  equation somebody looked at.

  Conflating the two would make a grep look like a literature review. The page shows the count of
  both, and the gap: the six papers the sweep shortlisted that nobody has opened are listed **by
  name**, because a to-do you can see is honest where an omission is not.

why
: The finding is the absence. Of **84** distinct papers, **11** print all three legs anywhere in
  their text, and of the eight read in full, three carry a usable row. There is no table of
  gauge–Higgs models because the field does not publish one — and mostly does not publish the rows
  such a table would be made of.

  Which is also the answer to a question this instrument keeps being asked: why is every absolute
  number here labelled `measured` rather than compared against the literature? Because there is
  almost nothing to compare against. The one row our engine reproduces end to end is AHMN's 2023
  model, and it does so exactly — their published minimum, their ratio, their 303 GeV.

so
: A second number came out of the sweep that was not what it was built to find, and it is the more
  useful of the two: **73 of the 84 PDFs — 87% — lose glyphs to text extraction.**

  That is not a quirk of one paper. It is the normal case in an equation-heavy corpus, and it is
  why this project spent 2026-08-30 proving a correct published formula wrong: the text layer of
  Haba–Yamashita's paper had silently eaten two absolute-value bars. `pdf_glyph_audit.py` exists
  because of that day; this census says how often the condition it detects is present.

  So a paper the sweep could not read is a **third state** on this page, with its own count — 28 of
  them — and never folded into "publishes nothing". That would be the sweep reporting its own
  blind spot as a property of the literature, and with 87% of the corpus in that condition it would
  be a large report of nothing. `_test_census_lit.mjs` holds the line: no unreadable paper may
  reach the shortlist, no curated row may exist without a page reference, and the arithmetic of the
  denominator — duplicate filenames included, one of which was found — has to close.

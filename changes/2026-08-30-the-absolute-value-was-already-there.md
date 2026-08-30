---
date: 2026-08-30
part: instrument
severity: withdrawal
affects_record: yes
title: The absolute value was already there — we withdraw a correction we had no business making
verify: open **SU(N) builder**, press the **§4.3 · SU(6), P ≠ P′** preset with no bulk content. The gauge potential reads `−3cos(2nπa) − 6cos(nπa) − 18cos(nπ(a−1))`, which is `−3 ×` Haba & Yamashita's own eq. (4.29) — the equation their paper prints. Every number this instrument has ever shown for a 5D SU(N) model is unchanged; what changes is a sentence we wrote about their paper.
---

what
: On 29 August this instrument shipped, in the source of `sun5d.mjs`, in its harness and in a
  changelog entry, the claim that the two coefficients of Haba & Yamashita's general formula —
  eqs. (5.9), (5.10) and (5.17)–(5.20) of *JHEP* **05** (2004) 059, `hep-ph/0401185` — were printed
  as plain differences `(n₊₊ − n₋₋)` and `(n₊₋ − n₋₊)`, and that an absolute value had to be
  restored for their own worked examples to come out.

  **That is false.** All six equations print the coefficients with absolute-value bars, on the
  page. Nothing was missing. The paper is right and we were wrong, and since we said it in public
  we withdraw it in public.

why
: The bars are set in **CMEX10**, TeX's extensible-delimiter font, and in that PDF its glyphs map
  to **U+000C**. Every text extraction drops them without a word: `pdftotext` does, and so does
  PyMuPDF, in every mode it offers. We had moved to PyMuPDF precisely because we knew `pdftotext`
  loses ligatures; the failure was one level below that.

  What makes this kind of loss different from a lost ligature is that **it leaves no wreckage**. A
  missing `fi` turns *unification* into *unication* and you see it. A missing pair of bars turns
  `|n₊₊ − n₋₋|` into `(n₊₊ − n₋₋)`, which is a well-formed expression, reads as an ordinary
  formula, and is a different formula. There is nothing to notice, so nobody goes back to the page.
  This one sat in our notes for three weeks and in this instrument for one day.

  Nor did the machinery help. Seventeen of the paper's published potentials were reproduced, two
  decoy readings were killed, and an exact invariance was swept over 710 boundary conditions — all
  of it working, all of it pointing at a premise nobody had checked against the page. A harness
  measures consistency with its input. If the input is mutilated it will certify the mutilation,
  and do it with confidence.

so
: **Nothing the instrument computes changes.** `sun5d.mjs` has always used `|n₊₊ − n₋₋|`, which is
  what the paper says, so every potential, minimum, spectrum, anomaly bill and sweep result stands
  exactly as it was. The harness still checks that the bars-dropped reading fails — that check is
  worth more now than before, because it is a guard against the extraction bug itself: it is
  precisely the wrong formula a tool will hand you.

  Three things changed, and all three are text. The header of `sun5d.mjs` carries the retraction
  where the claim was. The harness says what it is guarding against. The 29 August entry has its
  third paragraph struck, pointing here.

  A letter to the authors had been drafted on the false premise. It was not sent, and it will not
  be. What survives of that day is a tool: `pdf_glyph_audit.py`, which lists the pages of a PDF
  carrying glyphs the text layer cannot render, and which on this paper flags pages 4, 5, 14, 15,
  16 and 17 — its §3 and its §5 entire. Run it before quoting a formula.

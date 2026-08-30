---
date: 2026-08-30
part: instrument
severity: extension
affects_record: no
title: A model leaves as LaTeX — the potential, the table with its status column, and the bibliography
verify: open **SU(N) builder**, press the **§4.3 · SU(6), P ≠ P′** preset, and press **⇩ LaTeX** in the header. Two files come out: a `.tex` whose equation is `V_eff = (C/2) Σ n⁻⁵ [−2cos(nπa) − 18cos(nπ(a−1)) − 3cos(2nπa)]` and whose table carries a *status* column with `scale` marked UNKNOWN and its reason printed; and a `.bib` with the INSPIRE-keyed entry for the formula it rests on. The pair compiles: `pdflatex` on the standalone form gives one page, no overfull boxes.
---

what
: The header gains **⇩ LaTeX** beside **⇩ card**. It writes the model out in the form that goes
  into a paper: the effective potential as a displayed equation, the results as a table, and the
  sources as a companion `.bib`.

  It is the same object the card button already exports — `card.mjs` builds it once, and `toText`,
  the JSON and now `latex.mjs` are three renderings of it. A number in someone's paper is the
  number the card carries, or the whole status apparatus is decoration.

  Two details that are the point rather than the trim. The **status column is a column**: every row
  says `theorem`, `verified`, `measured` or `unknown`, and an `unknown` prints its reason in the
  table instead of leaving a blank cell. And the **bibliography travels with the numbers**, keyed
  the way INSPIRE keys it, so a reader who lifts a potential out of this page does not have to go
  and find the citation for the formula it came from — and so that citing it is the default rather
  than an act of virtue.

why
: The builder could already write a reader's potential on screen. What they had to do next was
  retype it, and retyping is where a sign goes missing.

  The transport is the hard part, and it is the same hard part that cost this project a day
  earlier today. Every string here is full of Unicode — `α`, `A₄`, `n⁺₊`, and U+2212, which looks
  exactly like a hyphen and is not — and `pdflatex` takes none of it. So `tex()` maps what it knows
  and **throws** on what it does not: an export that cannot be typeset fails loudly here rather
  than quietly in the reader's build. `_test_latex.mjs` pushes every string in `data/` and in the
  citation registry through it.

so
: Three defects were found by things other than the harness, and each is worth naming.

  **`pdflatex` found one by refusing to build.** Three `.bib` titles carried bare maths —
  `S^1/Z_2` — which is `Missing $ inserted` in the *reader's* document. Delimited now, and the
  harness rejects a bare caret in any registry field.

  **The compiled PDF found the second by looking wrong.** BibTeX entries placed in the `.tex` are
  not comments: LaTeX ate the braces and typeset them as a paragraph of prose in the middle of the
  page. The entries went to a companion `.bib`, and the `.tex` carries a pointer.

  **`build/drive.mjs` found the third by pressing the button.** The SU(N) builder declares
  `holds()` — it carries its own model, not the family's — so the export was pairing this
  section's potential with the *shell's* card: two models in one file, presented as one. The
  section exports its own card now, and the driver asserts the file names one model.

  And a fourth, which was ours all along: the reference for the paper this instrument's whole 5D
  family is built on was typed into seven files, and all seven named the wrong volume. It is
  **JHEP 02 (2004) 059**, DOI `10.1088/1126-6708/2004/02/059` — arXiv's journal-ref, the ADS
  bibcode and INSPIRE agree, and one of the seven copies was displayed on the page. There is one
  copy now, in `src/kernel/cite.mjs`, and a gate that sweeps the tree and fails the build if any
  file prints a volume the registry disagrees with.

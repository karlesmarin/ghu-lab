---
date: 2026-08-30
part: instrument
severity: correction
affects_record: yes
title: A bibliography that left out the paper it rests on — and a census row that named the wrong people
verify: open **Brane kinetic terms** and press **⇩ LaTeX**. The companion `.bib` now carries Akamatsu, Hirose, Maru and Nago; before it carried five other papers and not theirs. Then open **The literature**: the ⇩ LaTeX button is there now, and it writes the census as a table, one row per paper, with a `.bib` of the eight papers the rows cite. The row for arXiv:2502.08250 names Kawamura, Kodaira, Kojima and Yamashita, on T²/Z₄.
---

what
: **The demonstration's bibliography did not contain the paper every number in it comes from.**
  The brane-kinetic-term section computes nothing but Akamatsu, Hirose, Maru and Nago's eq. (3.19),
  its regulator (3.21) and the potential (4.2) — and the file it exported cited Haba–Yamashita,
  Haba–Hosotani–Kawamura, Arkani-Hamed et al., von Gersdorff–Irges–Quirós and Takeuchi–Inagaki,
  with no entry for the authors at all. A bibliography that omits the source of every number in a
  document is worse than none: it points the reader at the wrong five papers. **And the letter sent
  to those four authors that morning links to that page.**

  **A census row named two people who are not on the paper.** arXiv:2502.08250 is by Kawamura,
  Kodaira, Kojima and Yamashita — the row said "Kojima-Kubo-Kubota-Yamashita", an initialism
  guessed from a file name rather than read off the title page. Its orbifold is **T²/Z₄**, and the
  column said T². Those are the two fields a reader would use to find the paper. Both are corrected
  against the title page and against INSPIRE, and the paper is now in the citation registry with
  its JHEP reference and DOI.

  **And the census exports.** It is a table, so it leaves as one — one row per paper, with the four
  legs it prints and the rows it yields, and a `.bib` of exactly the papers the table cites. The
  summary card travels above it: 84 papers swept, 11 carrying all three legs anywhere in their
  text, 8 read and asserted, and **5 of those 8 printing no usable row at all**. That absence is
  the finding, and it is now something you can paste into a paper.

why
: The bibliography followed the **group**, not the file. That is right for a section computing a
  family of models and wrong for one built on a single paper: the brane section declares
  `group: su3_hy` because that is the physics it sits in, so its `.bib` inherited that group's five
  sources. A section that knows its own sources now says so, and the two cases resolve the same
  way.

  The census row is the older failure and the plainer one. The file on disk was called
  `KKKY_2502.08250.pdf`, and the label was written from those four letters instead of from the
  first page of the paper — which names four different people. A file name is not a source.

so
: The gate that did not exist: **an exported document must cite the paper its numbers came from.**
  It checks the brane export carries the authors' key and no longer inherits its group's, and that
  the census `.bib` carries the eight papers its rows assert.

  Two more things were found by compiling the file and looking at it, which the assertions could
  not have caught. The caption said a row needs the content and a minimum — but von
  Gersdorff–Irges–Quirós prints both and is credited none, because a row needs the whole triple: a
  Higgs mass or a compactification scale as well. The caption and the column beside it were two
  statements about one number, and they disagreed. And when the caption was corrected, the summary
  card's own source line kept the superseded rule, so the compiled PDF printed both, one page
  apart. One criterion stated twice is two claims; both are now gated, and every row's dots are
  checked against the count it is credited.

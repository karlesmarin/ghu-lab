/* cite.mjs — every source this instrument leans on, written down once.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS FILE EXISTS, AND IT IS NOT TIDINESS.  Until 2026-08-30 the reference for the paper this
 * instrument's whole 5D family is built on -- Haba and Yamashita's general formula -- was typed
 * into seven different files, and in all seven it named volume 05.  It is volume **02**:
 * arXiv's journal-ref says `JHEP 0402:059`, the ADS bibcode is `2004JHEP...02..059H`, and INSPIRE
 * gives volume 02, artid 059, DOI 10.1088/1126-6708/2004/02/059.  A wrong volume in a reference is
 * a reader sent to the wrong issue, and one of those seven copies is displayed on the page.
 *
 * A citation typed in seven places is seven claims.  Here it is one, and `_test_latex.mjs` checks
 * that no file in the tree prints a journal line for a registered source that the registry does
 * not agree with -- so the next drift fails the build rather than shipping.
 *
 * A TITLE IS LaTeX, NOT TEXT.  These strings go straight into a .bib field and from there into
 * someone else's document, so maths in a title is delimited: `$S^1/Z_2$`, never a bare caret.
 * pdflatex found the first three by refusing to build -- `Missing $ inserted` -- and
 * `_test_latex.mjs` now refuses them here instead, since an export that cannot be typeset is a
 * broken export whatever it looks like on screen.
 *
 * WHAT A RECORD CARRIES.  Enough to be re-found when a URL rots: the texkey the field already uses
 * (INSPIRE's, so a reader's .bib merges rather than duplicates), the eprint, and the DOI.  Our own
 * parts carry Zenodo CONCEPT dois -- the one that always resolves to the newest version -- because
 * a version doi in a citation ages badly.  [[concept-doi-not-version]]
 */

/* `id` is ours and short; `texkey` is INSPIRE's, so a merged .bib does not duplicate the entry. */
export const SOURCES = Object.freeze({
  HY04: {
    texkey: "Haba:2004qh",
    authors: ["N. Haba", "T. Yamashita"],
    title: "A general formula of the effective potential in 5D SU(N) gauge theory on orbifold",
    journal: "JHEP", volume: "02", year: 2004, artid: "059",
    doi: "10.1088/1126-6708/2004/02/059",
    eprint: "hep-ph/0401185", archivePrefix: "arXiv", primaryClass: "hep-ph",
    short: "Haba-Yamashita",
    note: "the general one-loop Wilson-line potential this instrument's 5D family computes",
  },
  HHK04: {
    texkey: "Haba:2003ux",
    authors: ["N. Haba", "Y. Hosotani", "Y. Kawamura"],
    title: "Classification and dynamics of equivalence classes in SU(N) gauge theory " +
           "on the orbifold $S^1/Z_2$",
    journal: "Prog. Theor. Phys.", volume: "111", year: 2004, pages: "265-289",
    doi: "10.1143/PTP.111.265",
    eprint: "hep-ph/0309088", archivePrefix: "arXiv", primaryClass: "hep-ph",
    short: "Haba-Hosotani-Kawamura",
    note: "the equivalence classes of boundary conditions",
  },
  ACG01: {
    texkey: "Arkani-Hamed:2001uol",
    authors: ["N. Arkani-Hamed", "A. G. Cohen", "H. Georgi"],
    title: "Anomalies on orbifolds",
    journal: "Phys. Lett. B", volume: "516", year: 2001, pages: "395-402",
    doi: "10.1016/S0370-2693(01)00946-7",
    eprint: "hep-th/0103135", archivePrefix: "arXiv", primaryClass: "hep-th",
    short: "Arkani-Hamed-Cohen-Georgi",
    note: "the anomaly lives at the fixed points, half at each; eq. (4.38)",
  },
  VGIQ02: {
    texkey: "vonGersdorff:2002as",
    authors: ["G. von Gersdorff", "N. Irges", "M. Quiros"],
    title: "Bulk and brane radiative effects in gauge theories on orbifolds",
    journal: "Nucl. Phys. B", volume: "635", year: 2002, pages: "127-157",
    doi: "10.1016/S0550-3213(02)00395-4",
    eprint: "hep-th/0204223", archivePrefix: "arXiv", primaryClass: "hep-th",
    short: "von Gersdorff-Irges-Quiros",
    note: "the second anchor route",
  },
  TI24: {
    texkey: "Takeuchi:2024ext",
    authors: ["K. Takeuchi", "T. Inagaki"],
    title: "New classification method for equivalence classes on $S^1/Z_2$ and $T^2/Z_3$ orbifolds",
    journal: "PTEP", volume: "2024", year: 2024, artid: "033B03",
    doi: "10.1093/ptep/ptae027",
    eprint: "2401.09809", archivePrefix: "arXiv", primaryClass: "hep-ph",
    short: "Takeuchi-Inagaki",
    note: "the trace conservation laws, called necessary and not sufficient by their own authors",
  },
  KM25: {
    texkey: "Komori:2025wji",
    authors: ["Y. Komori", "N. Maru"],
    title: "SU(7) grand gauge-Higgs unification",
    year: 2025,
    eprint: "2503.04090", archivePrefix: "arXiv", primaryClass: "hep-ph",
    short: "Komori-Maru",
    note: "the SU(7) model of the first family; preprint, no journal reference yet",
  },
  AHMN23: {
    texkey: "Akamatsu:2023ird",
    authors: ["K. Akamatsu", "T. Hirose", "N. Maru", "A. Nago"],
    title: "Electroweak symmetry breaking in two Higgs doublet model " +
           "from 6D gauge-Higgs unification on $T^2/Z_2$",
    year: 2023,
    eprint: "2312.08608", archivePrefix: "arXiv", primaryClass: "hep-ph",
    short: "Akamatsu-Hirose-Maru-Nago",
    note: "the SU(4) model of the second family; preprint, no journal reference yet",
  },
});

/* THE ONE STRING.  Everything that prints a reference for a registered source calls this, so the
 * page, the card, the LaTeX export and the module headers cannot say different things. */
export function citeText(id, { withTitle = false } = {}) {
  const s = SOURCES[id];
  if (!s) throw new Error(`cite: no source ${JSON.stringify(id)}`);
  const who = s.authors.join(", ");
  const where = s.journal
    ? `${s.journal} ${s.volume} (${s.year}) ${s.artid || s.pages}`
    : `arXiv:${s.eprint}`;
  const tail = s.journal ? ` (${s.eprint.includes("/") ? s.eprint : "arXiv:" + s.eprint})` : "";
  return `${who}, ${withTitle ? `"${s.title}", ` : ""}${where}${tail}`;
}

/* BibTeX, so the export merges into a reader's bibliography rather than asking them to retype it.
 * The key is INSPIRE's: a reader who already cites the paper gets one entry, not two. */
export function bibtex(id) {
  const s = SOURCES[id];
  if (!s) throw new Error(`cite: no source ${JSON.stringify(id)}`);
  const F = [];
  F.push(["author", s.authors.join(" and ")]);
  F.push(["title", `{${s.title}}`]);
  if (s.journal) {
    F.push(["journal", s.journal]);
    F.push(["volume", String(s.volume)]);
    if (s.pages) F.push(["pages", s.pages]);
    if (s.artid) F.push(["pages", s.artid]);
  }
  F.push(["year", String(s.year)]);
  if (s.doi) F.push(["doi", s.doi]);
  F.push(["eprint", s.eprint]);
  F.push(["archivePrefix", s.archivePrefix]);
  F.push(["primaryClass", s.primaryClass]);
  const kind = s.journal ? "article" : "misc";
  const w = Math.max(...F.map(([k]) => k.length));
  return `@${kind}{${s.texkey},\n` +
         F.map(([k, v]) => `  ${k.padEnd(w)} = {${v}}`).join(",\n") + `\n}`;
}

/* Which sources a given group's results actually rest on.  A bibliography that lists everything
 * the tool knows is not a bibliography, it is a boast. */
export const GROUP_SOURCES = Object.freeze({
  su3_hy: ["HY04", "HHK04", "ACG01", "VGIQ02", "TI24"],
  su4_ahmn: ["AHMN23", "ACG01"],
  su7_km25: ["KM25", "HY04"],
});

export function sourcesFor(group) {
  return (GROUP_SOURCES[group] || []).map((id) => ({ id, ...SOURCES[id] }));
}

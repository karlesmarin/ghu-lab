/* meta.mjs — who made this, in a form that survives a change of e-mail.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The identity of the tool and its authors, in one place, so that the result card, the page footer
 * and the citation block cannot drift apart.
 *
 * The ORCID is the durable part.  A card exported today may be read in ten years, by which time an
 * address or an affiliation may have moved; the iD does not.  It is also what makes the export
 * machine-readable as authorship rather than as a string: DataCite already carries this iD on the
 * series' records, and works claimed there propagate to the iD automatically.
 */

export const TOOL = Object.freeze({
  name: "ghu-lab",
  title: "GHU Lab — the gauge-Higgs unification instrument",
  authors: Object.freeze([
    Object.freeze({
      name: "Carles Marín",
      orcid: "0009-0007-5637-9688",
      orcid_uri: "https://orcid.org/0009-0007-5637-9688",
      affiliation: "Independent researcher",
      email: "karlesmarin@gmail.com",
      role: "lead",
    }),
  ]),
  /* Named, not credited as an author: the mathematics and every claim are the author's
   * responsibility, and an AI assistant cannot carry that. */
  assistant: "Claude (Anthropic), as AI assistant",
  repo: "https://github.com/karlesmarin/ghu-lab",
});

export function authorLine() {
  return TOOL.authors
    .map((a) => `${a.name} <${a.orcid_uri}>`)
    .join(", ") + `, with ${TOOL.assistant}`;
}

/* The official mark, drawn inline: an Edition may not fetch an icon, and this is why the gate
 * distinguishes loading from linking.  The anchor is allowed and required; an image element
 * pointing at a file would not be.
 *
 * (Deliberately phrased without the tag itself: a built page carries these comments verbatim, so a
 * comment naming a forbidden construct becomes a false positive for anyone grepping the artifact.) */
export const ORCID_MARK_SVG =
  '<svg viewBox="0 0 256 256" width="14" height="14" aria-hidden="true" focusable="false">' +
  '<circle cx="128" cy="128" r="128" fill="#A6CE39"/>' +
  '<path fill="#fff" d="M86 186h-18V94h18v92zM77 84a11 11 0 1 1 0-22 11 11 0 0 1 0 22zm40 10h35c34 0 49 24 49 46s-15 46-49 46h-35V94zm18 76h16c23 0 32-15 32-30s-9-30-32-30h-16v60z"/>' +
  "</svg>";

export function orcidHTML(author) {
  return `<a href="${author.orcid_uri}" rel="me noopener" ` +
         `style="display:inline-flex;align-items:center;gap:4px;text-decoration:none">` +
         `${ORCID_MARK_SVG}<span>${author.orcid}</span></a>`;
}

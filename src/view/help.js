/* help.js — the explanation next to the term, instead of on another page.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS EXISTS.  The hard words were already explained -- in `site/docs.html`, in the header of
 * every kernel file, in the prose above each panel.  All of it is somewhere else than where the
 * reader meets the word.  "Frobenius-Schur indicator" appears in a table column with no room for a
 * sentence, and a reader who does not already know what it is has to leave the instrument to find
 * out, which most people will simply not do.  So the sentence comes to the term.
 *
 * WHAT IT IS NOT.  It is not a tutorial and it is not a second telling of the section's prose.  An
 * entry is what you would say to a colleague who stopped you mid-sentence: the object, what it is
 * for, and the one thing about it that is easy to get wrong.  If an entry needs six sentences the
 * term probably deserves a paragraph in the section instead, and this is the wrong home for it.
 *
 * HONESTY, SAME RULE AS EVERYWHERE.  Where an entry states a result it says whose it is and where.
 * Where something is true only under a hypothesis, the hypothesis is IN the entry -- a definition
 * quoted without its precondition is how an inherited convention becomes a false claim.
 *
 * D3 SAYS THE KERNEL KNOWS NO DOM, so this is view: data plus one delegated listener.  Sections do
 * not wire anything; they call `helpMark(key)` where the word appears and that is the whole
 * contract.  An unknown key renders nothing rather than an empty bubble, because a mark that opens
 * onto nothing is worse than no mark.
 */

/* The glossary.  `term` is the heading, `body` is HTML and may use <code>, <b>, <i>. */
const HELP_TERMS = {
  alphabet: {
    term: "the alphabet",
    body: "A boundary condition on an orbifold is a representation of the space group "
      + "<code>Γ = Λ ⋊ Z_m</code>, so the possible conditions are built out of "
      + "<code>Irr(Γ)</code> — the letters. Part IX-A gets them by Möbius inversion "
      + "over the fixed points of the rotation, with Clifford theory supplying the weights. "
      + "Everything else on the orbifold page is derived from this list; nothing is entered.",
  },
  weight: {
    term: "the weight of a letter",
    body: "Its dimension. A letter of weight one is a diagonal boundary condition. "
      + "<b>A letter of weight above one is exactly a boundary condition that is not diagonal</b> "
      + "— which is why an alphabet with heavy letters cannot be read off a diagonal ansatz, "
      + "and why the weights, not the number of letters, set the cost of enumerating a rank.",
  },
  "local-datum": {
    term: "the local datum",
    body: "At a cone point of order <code>e</code>, the eigenvalues of the isotropy element acting "
      + "on the condition, recorded as multiplicities over the <code>e</code>-th roots of unity. "
      + "It is local: it says what the condition looks like at that one fixed point and nothing "
      + "about the rest of the orbifold.",
  },
  class: {
    term: "the class of a condition",
    body: "Its tuple of local data, one entry per cone point. <b>This is what any equivalence "
      + "relation must preserve</b>, so a proposed relation that moves one local datum is wrong, "
      + "and the check costs seconds and does not need the classification to be finished.",
  },
  fibre: {
    term: "a fibre",
    body: "All the boundary conditions carrying the same class. The classes are the fibres of a "
      + "marginal map, which is why they are indexed by an affine semigroup rather than by a list. "
      + "In the panels a cell of the lattice is a fibre: its <b>footprint</b> is the class count "
      + "and its <b>volume</b> is the number of conditions.",
  },
  cone: {
    term: "cone points, and the signature",
    body: "The fixed points of the rotation on the torus, each with the order of its isotropy "
      + "group. The signature is the list of those orders, and it alone fixes the degree of the "
      + "class count in the rank — before any condition is enumerated.",
  },
  "frobenius-schur": {
    term: "the Frobenius–Schur indicator",
    body: "<code>+1</code>, <code>0</code> or <code>−1</code>: whether a letter is real, "
      + "complex, or quaternionic. It is what decides how the SU alphabet merges into the SO and "
      + "Sp ones — a complex letter pairs with its conjugate, a real one survives alone — "
      + "so the three real forms are not three separate computations but one alphabet read three "
      + "ways.",
  },
  degree: {
    term: "the degree of the count",
    body: "The number of classes grows as a polynomial in the rank <code>N</code>. Its degree is "
      + "<code>e₁ − 1</code> with <code>e₁ = 1 + Σ c(mᵢ)</code>, where "
      + "<code>c(m) = m−1</code> over SU and <code>⌊m/2⌋</code> over SO and Sp. "
      + "<b>A proposed count of the wrong degree is missing labels</b>, and that check needs only "
      + "the signature.",
  },
  "hilbert-series": {
    term: "the Hilbert series",
    body: "The counts are the Hilbert function of the semigroup, so the generating function is "
      + "<code>P(x) / ∏(1−x^w)</code> over the letter weights. The point is that "
      + "<code>P</code> <i>terminates</i>: that is checked here, not assumed, and once it does the "
      + "counts at any rank come from the recurrence with nothing enumerated.",
  },
  "unbroken-group": {
    term: "the apparent unbroken group",
    body: "The 4D gauge group a condition looks like it leaves unbroken, <code>S(∏ U(n_ℓ))"
      + "</code> for a weight-one alphabet. <b>It is not an invariant of the class</b>: conditions "
      + "in one fibre — the same theory — can wear different apparent symmetries. That is "
      + "why a survey that lists models by their apparent group double-counts.",
  },
  "smith-normal-form": {
    term: "the Smith normal form",
    body: "How the fixed points are actually enumerated. They are <code>M⁻¹Zʳ/Zʳ"
      + "</code>, a group of order <code>|det M|</code>, and the normal form walks exactly that many "
      + "points. The naive box walks <code>|det M|ʳ</code> of them, which is the same answer at "
      + "rank 2 and hopeless at rank 6 — where the heterotic orbifolds are.",
  },
  crystallographic: {
    term: "why a matrix can be refused",
    body: "An integer matrix of infinite order is not the rotation of any orbifold, so it is "
      + "returned <b>refused</b> rather than classified. The same for a matrix whose characteristic "
      + "polynomial is not a power of the <code>m</code>-th cyclotomic: that is outside the "
      + "hypothesis of Part IX-A, and the machinery would answer with an empty alphabet and degree "
      + "zero — which looks like an answer and is not one.",
  },
  move: {
    term: "a move",
    body: "A rewriting that takes one boundary condition to another without changing its class. A "
      + "set of moves is <i>complete</i> when it connects every member of every fibre; the walk on "
      + "this page is what shows whether a proposed set actually does, rather than whether its "
      + "individual moves are legitimate — which is a weaker question.",
  },
  "affine-semigroup": {
    term: "an affine semigroup",
    body: "The classes are the fibres of a marginal map, so they are indexed by a semigroup with "
      + "one generator per letter of the alphabet. Naming that semigroup is mostly an exercise in "
      + "<b>attribution</b>: over <code>Z₂</code> it is a cut configuration with a literature "
      + "and a published table of invariants, and the useful thing this page can do is stop you "
      + "deriving it again.",
  },
  tripod: {
    term: "the tripod bound",
    body: "For a finite abelian <code>G</code>, the group-based model on the claw tree with three "
      + "leaves is a complete intersection iff <code>|G| ≤ 3</code>. The arithmetic settles "
      + "orders five and up in one line, for every abelian group at once: "
      + "<code>|G|² − 6|G| + 6 ≤ 0</code>. <b>Order four passes the bound and is "
      + "still not a complete intersection</b> — Z₄ and Z₂×Z₂ are decided "
      + "by exhaustion in Part IX-B §5, and a bound that is silent is reported as silent.",
  },
  "complete-intersection": {
    term: "complete intersection: global, not local",
    body: "Casanellas, Fernández-Sánchez and Michałek prove these varieties are "
      + "complete intersections <i>in a Zariski-open set</i>. The question asked here is the global "
      + "one, about the toric ideal itself, and the Z₄ tripod separates the two: local yes, "
      + "global no. Quoting one for the other is the misreading this page exists to prevent.",
  },
};

/* The mark, for a section to drop next to the word.  An unknown key renders NOTHING: a mark that
 * opens onto an empty bubble teaches the reader that the marks are not worth pressing. */
export function helpMark(key) {
  if (!HELP_TERMS[key]) return "";
  return '<button type="button" class="ihelp" data-help="' + key + '" aria-label="what is '
       + HELP_TERMS[key].term + '?" title="' + HELP_TERMS[key].term + '">i</button>';
}

/* Everything the marks need, wired once.  One delegated listener rather than one per mark, because
 * sections rebuild their markup on every refresh and per-element listeners would be re-attached
 * dozens of times a minute -- and the ones on the discarded nodes would leak.
 *
 * Guarded the same way the fibre panels are: the smoke harness renders sections in a stub document
 * in node, where `document.addEventListener` is not a function and a bare call is a ReferenceError
 * that takes the whole section down. */
export function mountHelp() {
  if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
  if (document.__helpMounted) return;
  document.__helpMounted = true;

  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; } };

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(".ihelp");
    if (!b) { if (pop && !ev.target.closest(".helppop")) close(); return; }
    ev.preventDefault();
    ev.stopPropagation();
    const entry = HELP_TERMS[b.dataset.help];
    const already = pop && pop.dataset.for === b.dataset.help;
    close();
    if (!entry || already) return;                    /* pressing the same mark twice closes it */

    pop = document.createElement("div");
    pop.className = "helppop";
    pop.dataset.for = b.dataset.help;
    pop.innerHTML = "<b>" + entry.term + "</b><p>" + entry.body + "</p>";
    document.body.appendChild(pop);

    /* Anchored under the mark, then pulled back inside the viewport -- on a phone the mark is
     * often within a bubble's width of the right edge, and a popover that opens off-screen is a
     * popover that does not exist. */
    const r = b.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let x = r.left + window.scrollX - w / 2 + r.width / 2;
    x = Math.max(8 + window.scrollX, Math.min(x, window.scrollX + vw - w - 8));
    const below = r.bottom + 8 + h < document.documentElement.clientHeight;
    pop.style.left = Math.round(x) + "px";
    pop.style.top = Math.round((below ? r.bottom + 8 : r.top - h - 8) + window.scrollY) + "px";
  });

  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
  }
}

/* Exported for a section that wants to render the whole list -- and for the control that checks
 * every key a section asks for is a key that exists. */
export function helpTerms() { return HELP_TERMS; }

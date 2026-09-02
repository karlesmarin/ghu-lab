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

  /* ---------------------------------------------------------------- the 5D gauge-Higgs core.
   * These recur in nearly every section, so they are worded once.  Where `site/docs.html` already
   * had the definition it is reused verbatim in substance: two tellings drift, and the copy a
   * reader meets in a bubble would be the one nobody maintains. */
  "wilson-line": {
    term: "α, the Wilson-line phase",
    body: "The vacuum expectation value of the extra-dimensional gauge field, in units where a "
      + "period is 1. In this family it <i>is</i> the electroweak hierarchy, because "
      + "<code>1/R₅ = 2m_W/α</code> — which is why a phase of order 10⁻³ and a scale of "
      + "order tens of TeV are the same statement.",
  },
  hosotani: {
    term: "gauge–Higgs unification",
    body: "The 4D Higgs is not a separate scalar: it is a component of the higher-dimensional gauge "
      + "field, surviving as a zero mode. Its potential is therefore forbidden at tree level and "
      + "generated at one loop, which is what makes the electroweak scale a computed number here "
      + "rather than an input.",
  },
  parities: {
    term: "the orbifold parities",
    body: "The signs a multiplet picks up at the orbifold fixed points, written "
      + "<code>(+,+)</code>, <code>(+,−)</code> and so on. They decide which components "
      + "survive with a massless mode — and <b>only <code>(+,+)</code> has a zero mode</b>, "
      + "so the whole 4D content follows from the parity assignment and nothing else.",
  },
  "zero-mode": {
    term: "a zero mode",
    body: "The massless four-dimensional field at the bottom of a Kaluza–Klein tower — what is "
      + "left at low energy. Which states have one is fixed by the pair of parities they carry, so "
      + "reading the 4D content off a model is arithmetic, not a calculation.",
  },
  "kk-tower": {
    term: "the Kaluza–Klein tower",
    body: "One four-dimensional field per mode of the extra dimension. With no brane kinetic term "
      + "the masses are <code>n/R</code>; the compactification scale <code>1/R</code> is the "
      + "spacing, and it is the number every bound in this instrument is finally about.",
  },
  "bulk-content": {
    term: "the bulk content",
    body: "The list of representations living in the extra dimensions, each with its orbifold "
      + "parities and a multiplicity. <b>It is the input to everything</b> — potential, spectrum, "
      + "anomalies and scale are all functions of it.",
  },
  brane: {
    term: "branes, and the fixed points",
    body: "The ends of the interval, where the orbifold has its fixed points. Fields can live there "
      + "as well as in the bulk, and that matters twice over: the anomaly of this class of models "
      + "sits entirely on the fixed points, and brane fermions are what pay for unwanted zero modes.",
  },
  "one-loop-potential": {
    term: "the one-loop potential",
    body: "The effective potential for <code>α</code>, summed over the whole Kaluza–Klein tower and "
      + "over windings. It is finite — the Higgs mass is protected by the higher-dimensional gauge "
      + "symmetry — which is the reason this class of models exists.",
  },
  "alpha-min": {
    term: "α_min, the vacuum",
    body: "Where the one-loop potential is minimised. In this class of models it is an algebraic "
      + "function of two moments of the bulk content, <b>so it is computed rather than searched "
      + "for</b> — and the closed form is checked against direct minimisation on every render.",
  },
  chiral: {
    term: "a chiral spectrum",
    body: "Left- and right-handed fields in different representations — which is the point of "
      + "orbifolding, and the reason the 4D theory can look like the Standard Model. It is also a "
      + "gate: a chiral spectrum is inconsistent unless its gauge anomalies cancel.",
  },
  "anomaly-channel": {
    term: "the anomaly channels",
    body: "A chiral spectrum has to have its gauge anomalies cancel, channel by channel — tedious, "
      + "and where an arithmetic slip hides best. <b>A non-zero entry is not a verdict of "
      + "inconsistency</b>: these models carry brane fields anyway, and a brane fermion conjugate "
      + "to a zero mode contributes to the same channel with the opposite sign. So the ledger "
      + "reports a bill, and says who can pay it.",
  },
  blkt: {
    term: "a brane kinetic term",
    body: "An extra kinetic term localised on a fixed point. Turn it on and the Kaluza–Klein masses "
      + "stop being <code>n/R</code>: they become the roots of a transcendental equation, sliding "
      + "off the poles of the free summand, and the potential has to be built from those roots "
      + "instead of written down.",
  },
  "boundary-condition": {
    term: "a boundary condition",
    body: "The choice of how the gauge group acts at each fixed point — for SU(N) on "
      + "<code>S¹/Z₂</code>, the block sizes <code>[p, q, r, s]</code>. It is what breaks the "
      + "group, and there are many of them, which is the first problem a model builder meets.",
  },
  "equivalence-class": {
    term: "when two boundary conditions are one theory",
    body: "Some boundary conditions are related by a gauge transformation, so they are the same "
      + "theory wearing different clothes; <b>only the class is physics</b>. Two things follow: the "
      + "apparent unbroken symmetry is not an invariant of the class — SU(5) with "
      + "<code>[2,0,0,3]</code> looks like SU(3)×SU(2)×U(1) and <code>[1,1,1,2]</code> "
      + "like SU(2)×U(1)³, and they are one theory — and a survey that does not quotient "
      + "by this counts the same model over and over.",
  },

  /* ---------------------------------------------------------------- the SU(7) family, Parts III-VIII */
  moments: {
    term: "D and A₄",
    body: "The second and fourth moments of the content, weighted by Wilson-line charge. "
      + "<code>8D</code> is always an <i>odd</i> integer, so the curvature at the symmetric point "
      + "can never vanish and the electroweak verdict is always well defined.",
  },
  rung: {
    term: "a rung of the ladder",
    body: "The curvature <code>D</code> is quantised, so the reachable models fall on a ladder and "
      + "each rung is a <b>finite set</b> — which is what makes “no content here” a decision rather "
      + "than a failed search. How finite is a different question, answered by counting rather than "
      + "by building.",
  },
  ceiling: {
    term: "the ceiling",
    body: "An upper bound on <code>1/R₅</code> that holds for arbitrary bulk content, obtained as "
      + "an integer program whose relaxation has a two-variable dual and enumerated exactly in "
      + "rationals. It is a <i>bound</i> — which is a different object from the set of scales the "
      + "model actually reaches.",
  },
  "reachable-set": {
    term: "the reachable set",
    body: "Not an interval. The scales this model can take are finitely many and fall in clusters, "
      + "one per rung, and between the rung-three and rung-one clusters lies a stretch of "
      + "2682 GeV that no content reaches at all. A ceiling cannot see that; running the map "
      + "backwards can.",
  },
  certificate: {
    term: "a certificate",
    body: "When no content exists at a scale, the answer is not silence but a <b>named reason</b> — "
      + "which rung it would have to be on, and which arithmetic forbids it. That is what makes the "
      + "backwards question decidable rather than an unsuccessful search.",
  },
  "vector-partition-function": {
    term: "counting instead of enumerating",
    body: "The multiplet lattice with its congruence is a rational cone cut by an affine "
      + "sublattice, so the count at fixed <code>(A₄, 8D)</code> is a vector partition function. A "
      + "dynamic programme gives every count at once in milliseconds, where building the contents "
      + "one at a time took about twenty-five minutes and ran out of budget.",
  },
  "same-potential": {
    term: "when two contents give one potential",
    body: "Part VII Theorem 3: five coordinates decide it, and it is an <i>iff</i>. So two genuinely "
      + "different multisets of multiplets can have identically the same Wilson-line potential — "
      + "which is why a survey that lists contents is not a survey of theories.",
  },
  "canonical-representative": {
    term: "the canonical representative",
    body: "Of all the contents sharing one potential, a distinguished one (eq. 43). Holding a "
      + "content up against its own representative is the theorem earning its keep: a different "
      + "multiset, the same curve.",
  },
  "selection-rule": {
    term: "the selection rule",
    body: "Part III: one bit, arithmetic on three integers, says that <b>half the torus is "
      + "redundant</b> — you never have to search it. The claim is testable by a computation that "
      + "has never heard of Dynkin labels, which is what this page runs.",
  },
  eta: {
    term: "η, the boundary sign",
    body: "The boundary-condition sign <code>η = η₀η₁</code>. Part V shows it rides on an index "
      + "alone, so it is invisible to the Higgs potential exactly on Part IV's vanishing class.",
  },
  "eta-blindness": {
    term: "blindness is not smallness",
    body: "A content with <code>M₂ = 0</code> is invisible to <code>η</code> <b>at any size</b>: "
      + "nine copies of a blind multiplet move the Higgs by nothing. A small effect and a null "
      + "effect are different statements, and this panel is built so you can try to break the "
      + "second one.",
  },
  "k-invariant": {
    term: "K, the row-consistency invariant",
    body: "<code>m_h a / √F'' = 2.2456 g₄</code> for every row. It is invariant under "
      + "<code>F → λF</code>, so it tests a published row against <i>itself</i> and never against "
      + "our anchor — which is exactly why it can screen somebody else's table without recomputing "
      + "their model. Part VI, open problem 3.",
  },
  comb: {
    term: "the comb",
    body: "The KK scale can only sit on teeth, spaced exactly in <code>M²</code> and not in "
      + "<code>M</code>, with each rung's teeth stopping at its own ceiling. The <b>spacing</b> is "
      + "arithmetic and carries nothing; the <b>position</b> carries the anchor residual and "
      + "<code>g₄</code>. Confusing the two is how a screen becomes an accusation.",
  },
  "bill-in-eighths": {
    term: "the bill, in eighths",
    body: "The cost of an escape from the proton-decay obstruction, measured in the quantum of "
      + "<code>D</code>. It is a ratio of integers, <b>so no normalisation enters it</b> — which is "
      + "what lets it be quoted without an anchor.",
  },
  "rung-cube": {
    term: "the rung cube",
    body: "The 64 ordered triples of lepton rungs, drawn. Its main diagonal is the "
      + "family-universal line, where every <code>A_j</code> vanishes and the protection dies — so "
      + "<b>the failure set is a line, not a region</b>, and the theorem is the geometry rather "
      + "than a summary of it.",
  },
  coloron: {
    term: "the coloron",
    body: "The only coloured state a dijet search actually sees in this model, so it is where the "
      + "CERN programme meets the family. Its mass and width follow the model's own "
      + "<code>1/R₅</code>: change the content anywhere and every number here moves with it.",
  },
  recast: {
    term: "a recast",
    body: "A published experimental bound re-expressed on this model's scale. The "
      + "<code>Δχ²</code> teeth here are <b>quoted from the published record, never "
      + "re-derived</b> — a near-miss re-derivation would put a number on the page that disagrees "
      + "with the paper it claims to come from.",
  },
  anchor: {
    term: "the anchor",
    body: "A published computation the instrument recomputes at load and shows as a chip, so the "
      + "tool <b>declares whether it currently reproduces an outside number before it shows you any "
      + "of its own</b>.",
  },

  /* ---------------------------------------------------------------- reading the literature */
  "keyword-sweep": {
    term: "what a keyword sweep is worth",
    body: "It turns a corpus into a shortlist, and that is all. A signal firing means “worth "
      + "opening”; it is <b>never</b> quoted as a fact about a paper. The two are kept in separate "
      + "columns here for exactly that reason.",
  },
  "measured-vs-read": {
    term: "measured, read, and unmeasured",
    body: "<b>Measured</b> is the sweep: complete and reproducible. <b>Read</b> is a row somebody "
      + "asserted, naming the page or equation they looked at. And a paper whose text layer lost "
      + "glyphs has <b>not been measured</b> — counting it as one that publishes nothing would be "
      + "the sweep reporting its own blind spot as a property of the field. 87% of these PDFs lose "
      + "glyphs to extraction.",
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

  let pop = null, openFor = null;
  const close = () => { if (pop) { pop.remove(); } pop = null; openFor = null; };

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(".ihelp");
    if (!b) { if (pop && !ev.target.closest(".helppop")) close(); return; }
    ev.preventDefault();
    ev.stopPropagation();
    const entry = HELP_TERMS[b.dataset.help];
    /* THE SAME MARK, not the same term.  One term can be marked twice on a page -- Frobenius-Schur
     * is marked at its heading and again at its column -- and keying this on the term made the
     * second mark close the first one's bubble instead of moving it to itself, which reads as a
     * mark that does not work. */
    const already = pop && openFor === b;
    close();
    if (!entry || already) return;                    /* pressing the same mark twice closes it */

    pop = document.createElement("div");
    pop.className = "helppop";
    openFor = b;
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

/* howto.js — one collapsible "how to use this section" per section, written once and mounted by
 * the shell.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THE SHELL MOUNTS IT AND NOT THE SECTIONS.  Twenty-five sections would mean twenty-five
 * edits and twenty-five chances to forget one; and a section that forgot would look exactly like
 * a section that had nothing to say.  The shell inserts this block at the top of whatever it
 * renders, so a new section without an entry is caught by `_test_howto.py` rather than shipping
 * silently without help.
 *
 * WHAT AN ENTRY IS.  Three fields, and each has a job the others cannot do:
 *   `what`  — one sentence: what the section answers.  Not what it is *about*.
 *   `steps` — what to press, in order, phrased as instructions to a reader who has never seen it.
 *   `read`  — how to read what comes back, INCLUDING what would make the answer not apply.
 * `helpMark` glossary entries explain a *term*; this explains a *panel*, and the two do not
 * overlap: a reader who knows what a Wilson line is may still not know which button runs it.
 *
 * D3 SAYS THE KERNEL KNOWS NO DOM, so this is view: data plus one function that returns HTML.
 */
const HOWTO = {
  hierarchy: {
    what: "Given a bulk content of the SU(7) model, where the compactification scale and the Higgs mass land — and how far that content sits below the ceiling no content can pass.",
    steps: ["Set the multiplicities of the eight (representation, parity) types in the left panel — or press a published row to load it.",
            "Read α_min and m_h from the closed form; the numeric minimisation of the same potential is beside them as the check.",
            "The ceiling card says how much room is left above this content, and on which certificate."],
    read: "Every absolute TeV and GeV inherits the anchor caveat at the top of the page: our α does not reproduce the published α, by a factor that varies from row to row. The mass ratio and the arithmetic laws do not.",
  },
  inverse: {
    what: "The map run backwards: name a compactification scale and a Higgs-mass window, and get a bulk content that lands there — or a named certificate that none exists.",
    steps: ["Type the target 1/R₅ and the m_h window.", "Press the rung buttons to decide them one by one, or ask for a design.",
            "Read the certificate: `floor`, `cone`, `congruence`, a Farkas `dual`, `exhaustion` — or `budget`, which is not a no."],
    read: "`budget` means the search stopped, not that the rung is empty; the page keeps the two apart on purpose. The reachable-set panel resolves each cluster into the finite set of points it really is.",
  },
  census: {
    what: "How many bulk contents sit on a rung — counted, not built.",
    steps: ["Choose a rung (A₄, 8D).", "Read N(A₄, 8D) from the dynamic programme.", "Press a cell to enumerate its fibre where the count is small enough to."],
    read: "The four rung totals were checked against an enumeration that built 69 022 464 contents one by one; the count here takes milliseconds. A large fibre is reported and not drawn.",
  },
  atlas7: {
    what: "Every bulk content of at most five multiplets — 1 286 of them — with its potential drawn as one tile.",
    steps: ["Read the tiles: sorted by α_min, coloured by verdict.", "Hover for the content.", "Click a tile to load that content into the model."],
    read: "One tile is green in the Higgs window, and it is the published row (2). A blank tile is a content whose potential is flat, and the harness predicts which tiles blank before they are drawn.",
  },
  samepot: {
    what: "Whether two bulk contents are the same one-loop potential, by Part VII's Theorem 3.",
    steps: ["Load a content.", "Press a kernel relation to rewrite it into another content.", "Compare the five coordinates and the two drawn potentials."],
    read: "Same five coordinates ⟺ identically the same potential. The dashed curve riding exactly on the solid one is the theorem, not a coincidence.",
  },
  anomalies: {
    what: "What each multiplet contributes to the anomaly bill, in eighths, and what the proton-decay escape costs.",
    steps: ["Read the signed bars: each multiplet's contribution to 8D.", "The ladder shows the odd eighths, with 8D = 0 marked as the rung that does not exist.",
            "The rows below run the escape on each published row."],
    read: "A non-zero bill is not an inconsistency: brane fermions pay into the same channels with the opposite sign. What the ladder forbids is a rung, not a model.",
  },
  escape: {
    what: "The escape from proton decay, constructed: type a brane content and watch the six channels, the assignments and the selection rule recompute.",
    steps: ["Set the rungs, X_Q and q_φ.", "Read the six anomaly channels in exact rationals.", "Turn the rung cube to see where protection dies."],
    read: "Every assignment that protects the proton can also cancel all six channels — protection never costs an anomaly. That is an enumeration, not an argument.",
  },
  multiplets: {
    what: "The layer under the term tables: every representation broken into multiplets with their three Z₂ parities.",
    steps: ["Pick a representation.", "Turn the parity cube.", "Read the sign s = η·η′·P₅·P′₅, which gives both the zero modes and the sign of the potential."],
    read: "The term tables here are DERIVED and then checked against the ones the rest of the page computes with. If the two ever disagreed, this panel is where it would show.",
  },
  screen: {
    what: "Three tests on somebody else's published row, none of which recompute their model.",
    steps: ["Type the row's two observables.", "Read the mod-6 law, the K invariant and the arithmetic comb.", "Compare with what the row claims."],
    read: "A screen that cannot fail screens nothing: the comb is cut at each rung's own certified ceiling, so a mass can land nowhere. On the five published rows, three are consistent near g₄ ≈ 0.6 and one would need g₄ = 1.87.",
  },
  collider: {
    what: "Which state a dijet search actually bounds, with no free parameter.",
    steps: ["Read the coloron's mass and width — both fixed by the localisation, not chosen.",
            "Drag the relief over (M_jj, χ), the plane CMS bins its angular measurement in.",
            "Type any 1/R₅ to see the ratio table move."],
    read: "The Δχ² numbers are quoted from the published record. The margin behind the conclusion is the integrality of 8D: halve the quantum and the sign changes.",
  },
  selection: {
    what: "Which α-domain a search may legally use, and which SU(4) representations can hold a quark generation.",
    steps: ["Pick Dynkin labels (a, b, c).", "Read the three gates: centre charge odd, middle node excited, labels summing to at least three.",
            "The closed count N = (b+1)(a+c+1)/2 comes with them."],
    read: "The centre-charge gate is classical and is credited as such. What is ours is the chiral projection that gives the closed count.",
  },
  calculator: {
    what: "A matter content in, the Higgs out — the AHMN model recomputed in front of you.",
    steps: ["Set the multiplicities and the boundary signs.", "Read the vacuum, the mass ratio and the anchor chip.",
            "The anchor recomputes on every render: if it stopped reproducing AHMN's published number, the chip would say so."],
    read: "The mass ratio carries no normalisation and no caveat. Absolute scales do.",
  },
  eta: {
    what: "What the boundary sign η does to a multiplet's contribution — in closed form, from one integer.",
    steps: ["Pick a multiplet.", "Read the one-sentence answer and the brute-force Hessian beside it.",
            "The atlas draws 119 landscapes at once; switch to η-difference mode."],
    read: "In difference mode every blind multiplet goes blank. That is Part V's theorem seen without reading a number.",
  },
  fived: {
    what: "Haba–Yamashita's own 5D SU(3) model, with the vacuum their paper leaves undone.",
    steps: ["Type the six bulk counts.", "Read α_min, checked against direct minimisation on the same render.",
            "Press the three one-press facts."],
    read: "Pure gauge never breaks the symmetry (D = −9). In this whole 5D class 8D is even: the odd rung the SU(7) ceiling stands on needs the sixth dimension.",
  },
  sun5d: {
    what: "The one-loop Wilson-line potential of ANY 5D SU(N) model on S¹/Z₂ — the model is the input.",
    steps: ["Type a boundary condition as four block sizes (n₊₊, n₊₋, n₋₊, n₋₋): that is what simultaneously diagonal orbifold parities are.",
            "Add bulk fields: representation, ηη′, and how many.",
            "Read the unbroken subgroup, the potential term by term, and where its minimum is. Click the plot to move the probe."],
    read: "Every equation of all four worked examples in the source paper is checked against this. With one Wilson-line phase the terms are the same (m, s, c) triples the SU(7) sections run on, so Part VII's closed form applies to somebody else's model.",
  },
  spectrum5d: {
    what: "What the model on the builder CONTAINS: the four-dimensional fields and their Kaluza–Klein towers.",
    steps: ["Edit the model in SU(N) builder — this section shares it.",
            "Choose at the vacuum or type a phase.",
            "Read the massless content, then the families, then the exact tower and its landscape."],
    read: "The families are the potential's multiset and are right for it; at a broken vacuum they are wrong at the LOWEST level of the adjoint and the symmetric tensor, which is why the exact tower is a second table and not a repetition.",
  },
  anomaly5d: {
    what: "What that content owes: every anomaly channel of the unbroken group, in exact rationals.",
    steps: ["Edit the model in SU(N) builder.", "Read the channels: [SU(n)]³, U(1)×[SU(n)]², U(1)³, U(1)×[grav]².",
            "Read the verdict: no subject, cancels, or owes."],
    read: "A non-zero row is a BILL, not an inconsistency: the brane fermions such a model needs pay into the same channels with the opposite sign. And a model with no massless fermion has nothing to cancel — that is `no subject`, not `cancels`.",
  },
  brane: {
    what: "Who pays that bill, and what it costs: matter on the two fixed points, held at once to the anomaly ledger and to Part I's boundary-mass gate.",
    steps: ["Edit the model in SU(N) builder — or press the example to load Kawamura's SU(5).",
            "Read the two branes first: they are different groups whenever the orbifold breaks anything.",
            "Add fields with the + buttons, or pick a massless mode and let the partners panel say which representations contain its conjugate.",
            "Press solve to get the local charges that cancel the linear channels."],
    read: "Two verdicts, kept apart on purpose: the bill before and after, and the massless count before and after. The same field can pay one and not the other, because the charge that cancels an anomaly is not in general the charge a mass term needs. The surviving count is a lower bound — the rank test assumes generic couplings.",
  },
  sweep5d: {
    what: "The model-building loop closed: walk the whole space of boundary conditions and contents through filters.",
    steps: ["Choose N and the maximum content size.", "Tick the filters you want — they run cheapest first.",
            "Press run, then read the funnel stage by stage.", "Click a hit to load it into the builder."],
    read: "Surviving boundary conditions are not surviving theories: [p,q,r,s] ~ [p−1,q+1,r+1,s−1] is the same theory, so the headline is a pair of numbers. An undecided vacuum is counted apart from a no.",
  },
  dossier: {
    what: "Which of the instrument's answers about this model are about the THEORY, and which only about the frame you are standing in.",
    steps: ["Edit the model in SU(N) builder.", "Read the tagged table: the theory, the frame, or declined with a reason.",
            "Click a class-mate on the left: same theory, different boundary condition. Watch which rows move.",
            "Press run on the separation panel to ask the second question: does an invariant line separate any two theories at all?"],
    read: "The tag is measured on that render, never read off a list. The lines at the minimum are the theory's; the ones at the symmetric point are mostly the frame's — which is the whole point of the section.",
  },
  bcclass: {
    what: "Which boundary conditions are the same theory, walked as orbits rather than quoted as a theorem.",
    steps: ["Choose N and the orbifold.", "Read the classes and their sizes.", "Compare the apparent unbroken group across a class — it is not an invariant.",
            "Ask which member the vacuum energy prefers."],
    read: "The counts come out (N+1)² at every N on S¹/Z₂, which is Haba–Hosotani–Kawamura's theorem as a measurement. Press T²/Z₃ and the answer changes.",
  },
  orbifold: {
    what: "The alphabet of an orbifold, derived from its rotation matrix and nothing else.",
    steps: ["Type an integer rotation matrix, up to rank eight.", "Read the cone signature, the alphabet, the local data, the count and its degree.",
            "Compare SU(N), SO(N) and Sp(N) side by side."],
    read: "Nothing is entered but the matrix. A matrix of infinite order, or one whose characteristic polynomial is not a power of the m-th cyclotomic, comes back REFUSED rather than classified.",
  },
  relations: {
    what: "Which equivalence relation on boundary conditions the literature already owns, and whether a proposed move set connects a class.",
    steps: ["Pick an orbifold and a move.", "Read the attribution: whose relation this is and where.",
            "Run the walk to see whether the moves actually connect the class."],
    read: "The local/global distinction is the one that gets misquoted, and the page carries it explicitly.",
  },
  blkt: {
    what: "What happens to the tower when brane-localised kinetic terms make the masses stop being n/R.",
    steps: ["Set the brane coefficient.", "Read the roots of the transcendental mass equation.", "Take the coefficient to zero and watch the ordinary twisted tower come back."],
    read: "The special functions are checked against mpmath at forty digits, and the c → 0 limit is computed in closed form by code that shares nothing with the solver. That limit found three real defects.",
  },
  predict: {
    what: "The model on the builder, turned into the numbers a detector measures, each beside its measured partner.",
    steps: ["Load a model in SU(N) builder.", "Choose at the minimum, or move the probe by hand.",
            "g₄ scales the Higgs mass ONLY — everything else is fixed by the measured m_W.",
            "Read the table, then the fermion masses; drag the landscape to turn it."],
    read: "No event is simulated: every mark is a predicted mass or a published bound. A vacuum at a symmetric point sets no scale and the page says so instead of inventing one.",
  },
  litcensus: {
    what: "The reading list behind the series: what each paper publishes, and which ones a person has actually read.",
    steps: ["Search or filter.", "Read the measured row: what the file contains and which signals fired.",
            "The curated rows name the page or equation a claim comes from."],
    read: "A signal is a keyword, and a keyword sweep misses whatever is phrased differently. Nothing is asserted from a signal alone, and the corpus is our reading list rather than the field.",
  },
};

function howToBlock(id) {
  const h = HOWTO[id];
  if (!h) return "";
  /* the demo button sits INSIDE the summary line, so a reader who has not opened the how-to can
   * still start it — and it is only rendered where a demo exists, rather than being a dead
   * control on the other sections */
  const demo = (typeof demoHas === "function" && demoHas(id))
    ? `<button class="ghost" id="demoRun" data-demo="${id}" style="float:right;width:auto;padding:2px 10px">▶ demo</button>`
    : "";
  return `<details class="card howto" style="margin-bottom:14px;padding:10px 14px">` +
    `<summary style="cursor:pointer;font-weight:650">How to use this section${demo}</summary>` +
    `<p style="margin:8px 0 0"><b>What it answers.</b> ${h.what}</p>` +
    `<ol style="margin:8px 0 0 18px;line-height:1.65">` +
    h.steps.map((s) => `<li>${s}</li>`).join("") + `</ol>` +
    `<p class="note" style="margin:8px 0 0"><b>Reading it.</b> ${h.read}</p></details>`;
}

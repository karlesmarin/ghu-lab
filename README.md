# 🔧 GHU Lab — the source tree of the gauge–Higgs unification instrument

This repository builds **[karlesmarin.github.io/ghu-explorer](https://karlesmarin.github.io/ghu-explorer/)**:
one self-contained HTML page holding **twenty-six** computations — including tools for models nobody has
written yet — over three published models:
1️⃣ SU(7) on S¹/Z₂×S¹/Z₂ (Komori–Maru), 2️⃣ SU(4) on T²/Z₂ (AHMN), and 3️⃣ Haba–Yamashita's 5D SU(N) on
S¹/Z₂ — with **every output carrying what is known about it**: `theorem`, `verified`, `measured`
or `unknown`, as fields in the exported result card rather than as decoration.

The 5D family goes from a boundary condition to numbers a detector measures: the Wilson-line
potential of **any** SU(N) model, its vacuum, the four-dimensional spectrum there, the anomaly
ledger, the matter on the two fixed points that pays that ledger and gives the unwanted zero modes
a mass, which of those verdicts are properties of the theory rather than of the frame, whether
SU(3)×SU(2)×U(1)_Y with a full generation is inside it, and then the **Simulator** — 1/R from the
measured W mass, the Higgs mass from the curvature of the potential, sin²θ_W against the running
of the data, the Kaluza–Klein towers in GeV against the CMS dijet bound, and the masses the
Wilson line gives the fermions. Every measured number carries its source and the date it was
read; no event is ever simulated.

The deployed page is a build artifact. This is where it comes from, and why it says what it says.

```
🏗️  python build/build_app.py    # inline → collision guard → edition gate → 35 harnesses → app/index.html
🌐  python build/build_site.py --legacy ../ghu-explorer/tools-2026-07     # → site/, then gates itself
📸  node   build/shoot.mjs       # headless screenshots of every section + console + which model
🖱️  node   build/drive.mjs       # USES the panels: a real mouse through the DevTools Input domain
📏  node   build/layout.mjs      # is anything wider than the box that holds it — every section,
                                 # every width, and every state: help open, demo running
🧪  node   build/extremes.mjs    # the states no gate visits: cleared, one multiplet, every slot
                                 # at its ceiling, boundary conditions at the corners
🧹  node   build/leaks.mjs       # what the page KEEPS: walks the rail twice and counts the
                                 # listeners on window and document — the second walk must add none
✅  node   tests/run.mjs         # the built page against the Python engine of Part VII
```

`build_app.py` refuses to report a green build if any harness fails, and prints
`*** BUILD RED — do not publish ***` instead.

## 🧪 What is checked, and against what

**1 805 checks across 35 harnesses**, plus 153 driven through a real mouse, 28 on the built site,
and two tools that measure what the reader sees: 0 clipped boxes and 416 clean renders in the
states no gate visits.
The ones that carry weight are the ones an outside computation could lose:

| harness | what it puts at risk |
|---|---|
| ✅ `tests/run.mjs` | the **built page** against `tests/reference_models.json`, produced by the **Python** engine of Part VII. Two implementations, one set of numbers. Ships with the artifact, so a reader can run it against the page they were served |
| 📐 `_test_hierarchy.mjs` | the closed form against direct minimisation; the arithmetic laws; the four levels of the ceiling; the pre-registered sixth row; the repair-space wedge |
| 🔢 `_test_selection.mjs` | Part III's rule against a winding sum that has never heard of Dynkin labels — 119 representations, zero disagreements — and Part II's three gates, with the minimality of the **60** recovered by brute force rather than quoted |
| 🌀 `_test_eta.mjs` | the η closed form against brute force on 119 multiplets; the atlas's blank tiles predicted from the modes *before* being drawn; tile diffs held to spectra |
| 🛡️ `_test_escape.mjs` | Part VI's charge arithmetic in exact rationals, against the archived enumeration |
| 🗺️ `_test_atlas.mjs` | the 1 286-content lattice re-enumerated in the browser, against `ceiling_ilp.py`'s archived counts — and against the hierarchy sweep, which reaches them another way |
| ↩️ `_test_inverse.mjs` | the map run **backwards**: the five published rows inverted from their own observables, the certificate roster of every target the paper tabulates, the designs it delivers — and the certificates **falsified**, a rung a Farkas bound closes being enumerated whole to confirm it is empty. It also resolves the two clusters a browser can reach into their **35 and 65 points**, recovering the paper's spacings and the 45× the gap is measured against |
| 🧮 `_test_census.mjs` | N(A₄, 8D) counted by dynamic programme, against three other things: the archived enumeration (**69 022 464** contents over four rungs), an independent brute force, and the enumerator that builds the contents one by one |
| 🏛️ `_test_sun5d.mjs` | the **general SU(N)** formula — Haba–Yamashita §5 — against every equation of all four worked examples the same paper prints, transcribed term by term; against the invariance (P, P′) → (−P, −P′) the adjoint cannot see; and, through the one-phase bridge, against the archived 60-row SU(3) prediction bank, which it reproduces to 8e-16 by a route that shares nothing with the special case those rows came from |
| 🔗 `_test_bcclass.mjs` | the **equivalence classes** of orbifold boundary conditions, as orbits actually walked: Haba–Hosotani–Kawamura's C(N+3,3) conditions, (N−1)N(N+1)/6 relations and **(N+1)² classes** reproduced at every N up to 14 as a property of the orbit structure rather than as a quoted theorem; their eq. (3.27) energetics term by term; and the same question asked again on T²/Z₃, where the answer is different and is measured instead of inherited |
| 📊 `_test_spectrum5d.mjs` | the **4D spectrum**, against the eigenvalue lists Haba–Yamashita print degeneracy by degeneracy — their (3.9), (3.12), (3.16), (3.18), (4.28), (4.32), (4.34) as whole multisets, so nothing can be dropped unnoticed — and HHK's sector counts (3.20) **derived** from the components rather than transcribed. And the control that ties two modules together: summing cos(2πnQ) over the states reproduces the potential's own bracket, exactly twice it, on 96 cases at 5e-15 |
| ⚖️ `_test_anomaly5d.mjs` | the **anomaly ledger**: the indices and cubic anomalies re-derived from fund ⊗ fund = sym ⊕ antisym rather than tabulated; an **adjoint** bulk fermion required to be anomaly-free on every boundary condition, because the adjoint is real; a piece fed in with its own conjugate, which tests every sign at once; and chiral contents that must come out **anomalous**, with the channel named, or "anomaly-free" would be the only thing it ever said |
| 🌡️ `_test_blkt.mjs` | **brane-localized kinetic terms**: the tower when the masses stop being n/R. The special functions against **mpmath at 40 digits** (`tests/blkt_reference.json`), and the limit that decides the rest — as c → 0 the roots of the transcendental mass equation must become the ordinary twisted tower, which is computed in closed form from the poles and shares no line of code with the solver. It found three real defects, catastrophic cancellation among them. And the join: the authors' own eq. (3.22), solved here, reproduces their eq. (5.19) ten pages later, with the error falling like α² |
| 📄 `_test_latex.mjs` | the **export that goes into a paper**: the LaTeX is the result card and not a second version of it; every string in `data/` survives the transport, and an unmapped glyph **throws** rather than being dropped; the potential reads as the paper prints it; and no file in the tree contradicts the citation registry — a gate that exists because one reference had drifted into seven files with the wrong volume |
| 🌀 `_test_vacuum5d.mjs` | the massless content **at the vacuum**, by two constructions that share no code — the representation theory of the pairs the Wilson line rotates, and the explicit matrices ρ(P₀), ρ(P₁′) with the joint eigenspace counted by elimination — on 880 cases including three phases; at θ = 0 and θ = 1 it must reproduce the parity rule of the boundary condition and of its **class-mate**, character for character. A third route in SageMath agrees on 200 of 200 (`tools/vacuum5d_sage_control.py`). And a decoy that must FAIL: reading the Kaluza–Klein families at n = 0 says two massless vectors for SU(2) at θ = 1 where there is one |
| 🧬 `_test_smcell.mjs` | the **Standard-Model cell**: the hypercharge solved in exact rationals on the massless pieces, with sin²θ_W = 3/8 coming out of three different boundary conditions, a full generation found where one exists, and the absence pinned where it holds — on SU(5) with P = diag(+,+,+,−,−) no bulk content hosts Q or dᶜ at 3/8, over all 64 two-representation contents. The solver is made to fail on purpose: change eᶜ's hypercharge and the anchor content stops working |
| 🧱 `_test_brane.mjs` | **matter on the fixed points**, held to two routines that were never told about each other: paired classes are vectorlike, so the anomaly ledger of what survives the boundary-mass gate must equal the ledger of everything that entered it, row for row — on every boundary condition of SU(3)…SU(6) with bulk and brane content, 8 190 models, 0 disagreements. The anchor is the textbook one: Kawamura's SU(5) keeps the whole group at one fixed point and only SU(3)×SU(2)×U(1) at the other. And a **decoy** that must disagree, which is Part I's "rank test, not a count" as a number: the same gate run on keys that ignore the U(1) charges over-lifts on 89 models and under-lifts on 166 |
| 🔮 `_test_predict.mjs` · `_test_running.mjs` | the **simulator** against a published vacuum: Haba–Hosotani–Kawamura–Yamashita's own model (hep-ph/0401183, Fig. 1) has its minimum at a = 0.058 and m_H R/g₄ = 0.031, and this returns 0.0583 and 0.0306, with their eq. (20) reproduced to 1e-9. The running returns its inputs at M_Z, meets α₁ = α₂ near 10¹³ GeV, and the coefficients are the textbook (41/10, −19/6, −7) |
| ⚛️ `_test_yukawa.mjs` | the **fermion masses** the Wilson line gives: attribution of every vacuum eigenstate to the pieces of the nearest symmetric point by squared overlap, with the weights required to sum to one per state, to the dimension per piece, and to the vacuum module's massless counts. The anchors are Cacciapaglia–Csaki–Park's own sentences: a bulk fundamental at m_W, a symmetric tensor's pair diagonal at 2 m_W |
| 🎯 `_test_dossier.mjs` | the claim that is a **classification** rather than a number: which verdicts are the theory's and which the frame's, measured on every member of the equivalence class — with two decoy lines whose answers are settled before the tagger runs, and the requirement that the lines read at the vacuum come back invariant on all 86 multi-member classes of SU(4)…SU(7) |
| 🧩 `_test_app.mjs` | the page that **ships**, not the sources it came from: the inliner, the module stripper and the data injection are the only code no other test covers |
| 🌐 `_test_site.py` | thirteen site checks, and then **each of them again against a site broken on purpose** |
| 🖱️ `build/drive.mjs` | the panels answer a **real mouse** through the DevTools Input domain, not events dispatched from inside the page — including the buttons that write files, the permalinks that make a page sendable (**with the empty model, which is the case that was broken**), the class-mate click that must leave the vacuum's verdicts standing, the published-model label that must go the moment any dial moves, and the rule that no verdict box in any of the 26 sections may open holding a dash |
| 📏 `build/layout.mjs` | **what a reader sees and no other gate can**: anything whose content is wider than the box that holds it, in every section, at several widths, and in every state — how-to open, each help bubble open, the demo running. It tells apart a box that scrolls, a box that **clips** (a column is simply gone) and a box that truncates with an ellipsis and can give the text back through its `title`. Written the day a reader reported a table running off the edge of a card; it found eleven such boxes across four sections, all from one CSS rule that was scoped to phones |
| 🧪 `build/extremes.mjs` | **the states no gate visits**: every family cleared, a single multiplet, every slot at its ceiling, and boundary conditions at the corners of the block simplex — at a desktop width and at 380 px. It looks for the six ways a template literal says it was handed something it did not expect (`NaN`, `undefined`, `[object Object]`, `Infinity`, `null`, an unresolved `${…}`), for a section that rendered nothing, and for a verdict box that ran and decided nothing. 416 (section, state, width) renders |
| 🧹 `build/leaks.mjs` | **what the page keeps**. Every other tool asks whether a section is right when it is on screen; this one asks what a section leaves behind when it is not. It walks the rail twice and asks the browser itself, through `DOMDebugger.getEventListeners`, how many handlers hang off `window` and `document` after each pass — and fails if the second walk added any. It was written because 24 console errors of one kind had no locus: they came from four different places that all registered a `window` listener per mount or per render and never removed it, so a resize later redrew a canvas the shell had already replaced. Before: 4 → 41 → 78 listeners, 27 errors. After: 4 → 17 → 17, and none |

Every guard here has been fired at least once by breaking something on purpose. A guard that has
never failed is not a guard, and `HANDOFF.md` carries the index of what each one cost.

## 📤 Taking a model out of the page

Two buttons in the header, and both serialise the **same object** — `card.mjs` builds it once:

- ⇩ **card** — the result card as JSON and as flat text: the input actually used, the provenance,
  and every value with its status and its source.
- ⇩ **LaTeX** — the same card as a `.tex` you can paste into a draft (the potential as a displayed
  equation, the results as a table **with the status column**), and a companion `.bib` keyed the
  way INSPIRE keys it, so citing the papers the numbers rest on is the default rather than an
  effort.

🔗 **link** puts the model in the URL. A section that carries its own model carries its own
permalink, so a demonstration can be *sent* rather than described.

## 🔁 Reproducing the data files

Nothing in `data/` is typed. `build/make_data*.py`, `build/make_reference.py` and
`build/make_blkt_reference.py` read the papers' own scripts and archived runs, and stop rather than
invent a number if they cannot reach them. That authoring tree is not part of this repository;
point at it with:

```
set GHU_SOURCES=...\research\smeft_formalization        # Windows
export GHU_SOURCES=.../research/smeft_formalization     # POSIX
```

or write the path into `build/sources.local` (git-ignored). Without it the generators exit with
a message saying exactly what they wanted to read. The instrument itself needs none of this: the
built page carries its data inline and reaches nothing outside itself.

## ⚠️ Read this before quoting a number

The instrument says it on its own front page, and it belongs here too: **the absolute scales are
not settled.** Our α does not reproduce the published α of the SU(7) model — the ratio runs
1.03× to 2.08× across the five published rows, and a varying factor cannot be absorbed as a
convention. Every TeV and GeV inherits that, and is labelled `measured` for it. What escapes the
caveat entirely: the **mass ratio**, the **bill in eighths**, and the **two arithmetic laws** —
no normalisation enters any of them.

The two anchor routes that are in print — Part VI's pre-registered sixth row and the second
anchor of von Gersdorff–Irges–Quirós — are both live in the instrument.

📕 And one thing we got wrong and withdrew in public: on 29 August this repository said
Haba–Yamashita's §5 was missing an absolute value. It is not; the bars are on their page, and the
text layer of the PDF had silently eaten them. See
`changes/2026-08-30-the-absolute-value-was-already-there.md`. Nothing the instrument computes
changed — it had always used the absolute value, which is what the paper says.

## 🗂️ Layout

```
🧠 src/kernel/     the mathematics: potential, moments, closed form, exact-rational charges,
                   the five complete invariants, the BLKT tower, the relief renderer, the
                   citation registry, the LaTeX writer, the resolver — and `experiment.mjs`,
                   the measured numbers with their source and the date each was read, plus
                   `running.mjs`, the one-loop Standard-Model running of the couplings
🖼️ src/view/       the DOM layer: the fibre panels, the shared 3-D tower renderer, the inline help
🧰 src/modules/    one capability each, with a status and a source on every value
🖼️ src/sections/   one file per section of the page; adding a section is a file and a line
🏠 src/shell/      the shell: one model per group, a rail grouped by family, the permalink
🌐 src/site/       the source of the surrounding site (home, per-paper pages, docs, changes)
🏗️ build/          the builders, the gates, the shooters, the mouse driver
💾 data/           extracted, never typed — one JSON per group, plus the archived scans
🛠️ tools/          the sweeps that are not part of the page: the 42 380-model scan of SU(5)–SU(7),
                   its report and map, and the SageMath control of the vacuum module
✅ tests/          the golden suite that travels with the deployed artifact
📝 changes/        the change log, one file per entry, rendered onto the site
```

`app/`, `site/`, `shots/` and the shooter profiles are generated and untracked on purpose.

## 📜 History

This repository starts at its first public commit. The working history that preceded it is kept
privately: a headless-browser profile had been committed into it at one point, and files named
`Cookies` and `Login Data` are not something to publish even when they belong to a throwaway
profile. Nothing of the engineering narrative is lost — `HANDOFF.md` carries the trap index and
`changes/` carries every change that touched a published record.

---

👤 Carles Marín · ✉️ `karlesmarin@gmail.com` ·
🆔 [ORCID 0009-0007-5637-9688](https://orcid.org/0009-0007-5637-9688) ·
🤖 Claude (Anthropic) as AI research assistant; the mathematics and every claim are the author's
responsibility · ⚖️ Apache 2.0

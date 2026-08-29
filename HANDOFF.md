# HANDOFF — GHU Lab

> State at 2026-08-29. The section below is the newest; the earlier handoffs follow it unchanged
> and are still the map of the code.

## 2026-08-29 — Part VIII enters: the map backwards, the clusters, and the census

Part VIII was published on 29 August (concept `10.5281/zenodo.22159036`) and the instrument had
none of it. Two sections now, both `Part VIII`, sitting next to Hierarchy because they are the same
map: **Design a scale** and **Count a rung**. `build/make_data_viii.py` reads the three archived
runs — `inverse_design.json`, `reachable_set.json`, `rung_census.json` — and injects the `inverse`
and `census` blocks into `data/su7_km25.json`, refusing to run if any of the three archives a run
whose own controls went red, or if its lattice disagrees with the one the page derives.

### What the page computes and what it reads

| computed here | read from the archive |
|---|---|
| the decision at a rung: the five certificates, the finite enumeration, the exact-potential verification of every design | the cluster ends — finding the floor of rung 1 means enumerating 423 631 contents and minimising the exact potential on the survivors |
| the **point set** of rungs 1 and 3 (423 631 and 3 888 823 contents, 0.2 s and 1.7 s) | the ends of rungs 5 and 7, which are 15.8 M and 48.9 M contents and past any browser |
| the whole census N(A₄, 8D), by dynamic programme, in ~20 ms | nothing — the archive is only what `_test_census.mjs` holds it to |

### Four things this pass found, and each is now guarded

- **A cluster is not an interval, and the first drawing said it was.** A content fixes
  (A₄, 8D, G) and the two identities then fix ONE pair (1/R₅, m_h), so a rung's image is a FINITE
  SET. `rungPoints` enumerates it: rung one is **35 points**, 31.46 GeV apart on average, widest
  interior gap **59.44**; rung three is **65**, widest **30.83**. Those are the paper's own
  numbers, recomputed, and with them the page derives the **45×** the certified gap is measured
  against instead of quoting it. Drawn as a comb over the bar, so both facts stay visible.
- **A capped sweep reported a short answer as a complete one.** The default cap was 1.5 M and
  rung three is 3.9 M, so the panel printed *54 points* instead of 65 and said nothing about the
  cut. The cap is now derived from the same threshold that decided to attempt the rung, and
  `_test_inverse.mjs` runs a deliberately capped sweep and asserts it reports itself capped.
  [[a-guard-in-the-script-is-a-missing-hypothesis]]
- **The fibre panel picked the class by SIZE and got the wrong one.** At (A₄, 8D) = (86, 1) there
  are two classes with a single 2W: one of 86 contents and one of 81. The paper's is the 81 — the
  one at the **measured Higgs mass**. A class is one potential, so it has one α, one m_h and one
  scale; the panel now selects by that scale and shows it in the table, and the harness asserts
  that selecting by size would have got it wrong. [[a-control-that-cannot-fail]]
- **`_content()` in the generator read parities off fixed character positions.** `"7(+,+)"[2]` is
  a sign and `"28(+,+)"[2]` is a bracket, so every two-digit representation came out of the
  archive with parities (−1, −1) — and the only symptom was that a witness loaded from the archive
  was a different content from the one archived. Parsed with a regex now, and the harness that
  caught it re-derives every archived witness through the closed form.

### Traps that cost time and are worth knowing

- `gaugeSeed(model, data)` returns `{name, gauge, seed}` and not the term table. Two sections
  passed the whole object to `moments`, which then said `terms is not iterable` — from inside the
  BUILT page, so the trace pointed at a line number in the bundle. `TRACE=1 node _test_app.mjs`
  prints the stack.
- `_test_app.mjs` evaluates the engine out of `app/index.html`, so a fix to `src/` that has not
  been rebuilt is invisible to it. Rebuild before believing a failure.
- JS `%` keeps the sign of the dividend and every rung below the gauge seed has a negative one, so
  the mod-6 law is written the arithmetic way (`((x % 6) + 6) % 6`). The candidate seed has
  `2A₄ = −27`, and `-27 % 2 === -1` in JS: a harness comparing it to `1` failed on a true fact.

### The section that had two branches and would have been photographed in neither

The designer opens on *nothing asked*, which says least of the three states it has. `shoot.mjs`
gains an `inverse` variant list: resolve the clusters, ask inside the gap (7.5 TeV → the roster,
closed by `floor` alone), then ask for 9.0 TeV (→ a content, verified on the exact potential), so
the main frame lands on a design. `#cnGo` joins the on-demand button list.

**Build: 1 244 checks, 19 harnesses, 14 sections, 0 console errors, drive 18/18.**

> State at 2026-08-26. The section below is from that pass; the 2026-08-09 handoff follows it
> unchanged and is still the map of the code.

## 2026-08-26 — the instrument stands on the PUBLISHED Part VII, and the site is current

The five sections were closed on the 9 August draft of Part VII. The paper deposited on 24 August
(concept `10.5281/zenodo.22087251`) keeps the draft's 10.03 TeV as the relaxation's bound and adds
three levels under it, and the instrument now carries all of it — **read from the archived runs
in `Curiosity/research/smeft_formalization/part_vii/outputs/`, never typed** (`build/make_data.py`
refuses to run without them):

| level | 1/R₅ | at | bounds |
|---|---|---|---|
| relaxation | 10.03 TeV | (215, 1) | any content — the LP dual; its own vertex is **empty** |
| attained | 10.01 TeV | (212, 1) | any content whose EW point is stationary; the witness is a **false vacuum** |
| **true vacuum** | **9.22 TeV** | (104, 1) | any content whose EW point is its vacuum — the physical one; witness exact 9157 GeV |
| at m_h = 125.2 | 9.09 TeV | (101, 1) | the benchmark at the measured mass |

What the kernel gained: `stabilityW` (W = Σ_{c odd} m(−s), F(1)−F(0) = 31/16 ζ(5) W, [8]'s
criterion), `coordinates` (the five complete invariants (A₄, 8D, 2U, V, 2W), Theorem 3),
`surfaceInvR5` (identity (II), the function every level is a value of), and `gaugeSeed`: the
gauge sector is a **convention of the model** (`conventions.gauge_seed`, default `published`),
and the data file carries the candidate parity-resolved split of §13 under which 8D is even, A₄
half-integral, the relaxation ceiling is 7.38 TeV at 8D = 2, and Theorem 1's hypothesis is not
met — Theorem 2 and 2W-odd survive, the base point moves by (9, 9, 9, 0, 0). The hierarchy
section has the switch, the laws table says which law depends on it, and a panel reports the
other symmetric point with a false-vacuum verdict; the anomalies section's ladder note follows
the seed. `_test_hierarchy.mjs` grew from 66 to 166 checks, all against archived numbers
(W on the five rows, both witnesses, every generator's five coordinates, the four congruences of
eq. (64), the seed shift). Build: **514 checks green**, 0 console errors, drive.mjs 18/18.

**Three things only this pass found, each now guarded:**

- **Every permalink was dead on arrival.** `app.js` ended `if (!decode()) render();` — a page
  opened with a hash decoded it and rendered nothing. Found the first time a harness opened a
  deep link (to photograph the seed switch). `_test_app.mjs` now asserts decode-then-render.
- **`--legacy` must point at `ghu-explorer/tools-2026-07`, not the root**: since the 9 August
  deploy the root serves the home page. Pointed at the root, the "carried" July pages are the
  home page and the link check fires. Documented in `build_site.py`'s docstring.
- **The site gate stopped dead once every part was published.** Two breakers looked for an
  undeposited part to break; with none, `StopIteration` and SITE RED for lack of something to
  break. `_undeposit()` now withdraws a record in the broken copy instead. [[a-test-that-measures-progress]]

Also: `data/series.json` refetched — VI and VII published, repos linked; the Part IV entry of
2026-08-11 (arXiv:2608.09619) that had been written straight into ghu-explorer's HTML is now a
`changes/*.md` here; a 2026-08-26 note logs this update against Part VII; the ghu-explorer README
names VI and VII with their DOIs. Deployed to `karlesmarin/ghu-explorer`.

**Next (lote B, agreed with Carles 2026-08-26, in this order, same structure — module + section
+ harness, 3-D where it helps):** (1) Part VI's six anomaly channels + the rung ladder
`extra(L) = (1−k)/2` + the 14 → 2 assignments + the `q_φ = |A_j|/n` rule, which closes the one
`unknown` the anomalies section declares about itself; (2) "same potential?" on the five
coordinates, with the kernel (42) and the canonical basis (43); (3) screening a published table —
the invariant `K = m_h α_min/√F'' = 2.2456 g₄`, the laws, and the comb `ΔM² = 8π²m_W²/(ζ(3)·8D)`;
(4) Part II's gate `(a+2b+3c) odd ∧ b ≥ 1 ∧ a+b+c ≥ 3` in the selection section. Then, for
researchers outside this series: the general 5D SU(N) on S¹/Z₂ potential (Haba–Yamashita, which
§11 already reproduces) and a zero-mode spectrum by parities.

### Lote B, tool 6 — DONE 2026-08-27: "Multiplets & parities", and the layer under the term tables

The last item of lote B and the day's new finding turned out to be **the same object**, so they
shipped together. Everywhere else a representation IS its term table — an aggregate, transcribed
from eqs. (73)–(76). Underneath sits the decomposition into multiplets of SU(3)_C×SU(2)_L, each with
three Z₂ parities, and from that one layer three things fall out at once:

- **the term tables stop being quoted.** `build/make_data_multiplets.py` encodes eqs. (41), (57),
  (69), (70), derives all nine tables (four reps × two parities, plus the gauge sector from eq. (68))
  and **refuses to write the `multiplets` block if any disagrees**. All nine match. So does the hand
  count of doublets, 1, 5, 10, 16 — a third, independent number.
- **the zero-mode spectrum**, which is what a reader outside the series needs. And it needs no
  second rule: `s = η·η′·P₅·P′₅` is *both* the sign of the winding sum (eq. 72) *and* the zero-mode
  test — by eqs. (39)–(40) a zero mode exists iff `ηP₅` and `η′P′₅` agree, i.e. iff `s = +1`, and it
  is left-handed when both are +1. One sign, two consequences.
- **the P₆ split, and the cancellation**: one `48(+,+)` cancels the gauge sector identically across
  all three channels of the periodic sector, and the whole residue (4.5 in the app's convention,
  9 in theirs) sits in the antiperiodic one. It bears on the open question about that sector's
  degree-of-freedom count: the cancellation holds under eq. (68) as printed and is destroyed by the
  Faddeev–Popov-subtracted variant, which is a consistency argument for the published count.

`src/kernel/multiplets.mjs` + `src/modules/spectrum.mjs` (the module answers for the content
actually loaded; the section's controls are exploration on top) + `src/sections/multiplets_section.js`.
`_test_multiplets.mjs`: **178 checks**, including the two that could have killed the finding — a
`48(+,−)` must NOT cancel, and neither must the Faddeev–Popov variant of the gauge count. Both hold.
Build green, 12 sections, `drive.mjs` 18/18, console clean.

**Three traps, all caught by a control rather than by reading:**

1. **The shell calls `sec.init(ctx)`, never `sec.mount(ctx)`.** The first version defined `mount`,
   copied from `escape_section.js`, which happens to have both. The section built, rendered, passed
   every harness — and shipped with two empty rows where the representation and parity buttons
   should be. **Only the screenshot showed it.** Every other section uses `init`; this was the only
   `mount` in the tree.
2. **`class="pill"` does not exist.** The house button is `button.st` with `.on` for selected, and
   for text wider than a glyph it needs `style="width:auto;padding:0 9px"`.
3. **Six generic top-level constants are six collisions waiting.** `LABEL, P6, P5, P5P, COLOUR, DIM`
   collided with names already in the single inlined scope — `channels` was caught by the build's
   collision guard, `P5` only by `tests/run.mjs`. They are now one frozen object, `MUF`, and
   destructuring it at the top of a module would recreate exactly the problem.


### Lote B, tool 1 — where it stands at the close of 2026-08-26

**Done and green (618 checks):** `src/kernel/charges.mjs` — exact rationals and the whole of
Part VI's charge arithmetic (the six channels state by state, `channelPolynomial` by exact
interpolation, the ladder `extra(L) = (1−k)/2`, `hosts(k)` from their eqs. (37)–(40), the
`assignments()` enumeration that returns the 14 and the 2, `protection()` = Prop. 3 with the
brute-scan control, `residual()` and the gcd table, the identity U(1)′ = T3L + Y − (B−L)).
`src/modules/escape.mjs` reads the BRANE half of the record — `model.brane = [{kind:"quarks",
X_Q}, {kind:"leptons", rungs:[k…]}, {kind:"scalar", q_phi}]`, defaults echoed — and provides
`brane, channels, ladder, assignments, protection, residual, bill_escape`. `_test_escape.mjs`
holds all of it to the archived table (`data.escape_assignments`, read by `make_data.py` from
`part_vi/outputs/su7_realisable.txt`) and to the paper's numbers: 90 checks. The module is
mounted in the **anomalies section**, whose six-channel card now computes instead of saying
"not computed here" — the `unknown` set shrank by one, and `_test_hierarchy.mjs` names the
new set.

**DONE 2026-08-26 (second pass) — the section stands and the site carries it:**
1. `src/sections/escape_section.js` built as specified: the brane card (N = 1–3 generations with
   a rung each, X_Q typed or forced with the forced value echoed, q_φ from the three supplies or
   typed), the six channels with polynomial and roots, the ladder with hosts and parities, the
   twenty assignments (click to load), the selection rule + residual in one card, the bill against
   the model's own 8D, and **the rung cube in 3-D** — 64 ordered triples under `surfaceView` /
   `surfaceProjector` with the house mouse contract (drag turns, wheel raises), the
   family-universal diagonal dashed through it. `app.js` gained `state.brane[group]`,
   `ctx.setBrane()` (one `cleanBrane` sanitiser shared by the typed fields and the permalink) and
   `su7_km25.brane=x:…|r:…|q:…` in the fragment, exactly as the seed was done. Build **623
   checks green** (app 94, escape 91), drive 18/18, shooter 0 console errors, site 26 ok +
   broken-on-purpose, site shooter 15 × 2 widths, 0 overflow.
2. `build_site.py` `SECTION_NAMES` + `make_series.py` Part VI `["anomalies","escape"]` done;
   home page says six computations; ghu-explorer README says six sections and describes the cube.
3. **Two things only this pass could find:**
   - **The blue class of the cube is EMPTY** — the spec above guessed "blue = protects but a
     channel survives", and the enumeration says no such multiset exists: every one of the 20
     that protects also cancels all six channels with ≤ 3 singlet neutrinos. Protection never
     costs an anomaly. The legend says "empty", the note states it as a computed fact, and
     `_test_escape.mjs` pins the four class counts (6 / 0 / 12 / 2). [[the-absolving-half-of-a-gate-is-never-tested]]
   - **`dressable` is a list, and an empty list is truthy**: the supply table showed FAILS on all
     three q_φ while the verdict box above it said "protects" — shipped in the first build, caught
     by photographing the deep link, fixed to `dressable.length`. The absolving half of that
     table had never rendered until a permalink with rungs (0,0,1) was opened.

**Lote B, tool 2 — DONE 2026-08-26 (third pass): "Same potential?" · Part VII.**
`src/kernel/canonical.mjs` (the per-multiplet coordinate vectors computed from the term tables;
the kernel relations of eq. (42) SOLVED by integer Cramer and verified on all five coordinates,
never quoted; the canonical map of eq. (43); `latticeIndex` = |det| of the five canonical
generators) + `src/modules/samepot.mjs` (the model's canonical representative in the result card)
+ `src/sections/samepot_section.js`. Content A is the shell's model; content B is view state — a
probe, in no permalink and no card. The section OPENS on the theorem working: B = canonical of A,
a different multiset with the same five, the dashed curve riding on the solid one, max |F_A−F_B|
~ 3e-11 printed as the control. The kernel relations are →/← buttons that rewrite B without
moving Δ. `_test_samepot.mjs`: 46 checks against lattice_lift.py's archived matrix, the printed
coefficients (20,17 / 24,18 / 1,4,1), the exact potential per relation, the archived probes, and
index 373 248 = 2·72·2592. Build **669 checks green**, 7 of 7 sections, 0 console errors.
`shoot.mjs` gained a samepot VARIANT that loads row (5) into the probe and shoots the NEGATIVE
branch — the escape section's dressable bug taught that the absolving half must be photographed —
then restores (a variant whose `set` returns false mutates without shooting). Registered:
`SECTION_NAMES`, Part VII `["hierarchy","samepot"]`, home "seven computations", README seven.

**Lote B, tool 3 — DONE 2026-08-26 (fourth pass): "Screen a table" · Parts VI–VII.**
`src/kernel/screens.mjs` (exact term-wise derivatives of F — the same series su7_anchor_mh.py
sums; `screenLaws` on (k, 2A₄) so the candidate seed's half-integral A₄ stays an integer;
`screenK`; the comb of eqs. (46)–(47): `combMu/combM2/combA4/combSpacingM2/combMatch`) +
`src/modules/screen.mjs` (the archived K table in the card) + `src/sections/screen_section.js`.
`make_data.py` reads `part_vi/paper_data/su7_anchor_mh.json` → `data.screen` (NaN → null: Python
writes NaN, browsers refuse it). The section screens a FOREIGN row (view state): the mod-6 law on
two integers, K with F″ typed or computed from the model at their α, and the comb in a WINDOW
with every rung cut at its own certified ceiling — the five published rows ship pre-screened
(g₄ ≈ 0.60/0.62/—/1.87/0.60; row (3) not at a minimum). `_test_screen.mjs`: 37 checks against
the archive to 1e-9, the paper's printed 0.42/0.039 TeV² and 21 GeV, and identity (II) on all
fifteen per-rung levels. Build **705 checks green**, 8 of 8 sections, 0 console errors.
**The trap this pass found and closed:** with an honest tolerance the high rungs' teeth are
denser than the tolerance, so counting teeth past the rungs' ceilings EVERY mass "lands on a
tooth" — the screen-hit photograph showed "33 teeth" where the true count of reachable ones was
1. The ceilings' monotonicity (now a harness check) bounds the uncertified rungs, hits split
into reachable/ghost, and the verdict says why counting ghosts would screen nothing.
[[a-test-that-admits-the-trivial-element]]

**Lote B, tool 4 — DONE 2026-08-26 (fifth pass): Part II's three gates, in the Selection section.**
`selection.mjs` gained `dimSU4`, `cellGates` (the conjunction `hostsGeneration` already there,
said in three NAMED clauses: centre/middle/size, with N, dim, extent 12b) and `minimalAdmitting`
(brute force over labels ≤ 8, so Part I's headline — the 60 is minimal — is RECOVERED, not
quoted). The section gained the probe card (steppers, opens on (0,2,1); both branches
photographed via a shoot VARIANT) and the catalogue's generation column now names WHICH gate
refuses each rep. Cross-paper fact stated and pinned: an admitting rep always has odd centre
charge, so it always forces the FULL torus — Parts II and III read one bit in opposite
directions. `_test_selection.mjs` 41 → 53 checks (dimSU4 against all 119 archived catalogue
dims; (0,2,1)/(1,2,0) at dim 60 and nothing smaller; N integer and ≥ 3 on every admitting
triple; the 15 = (1,0,1) refused by ALL THREE gates — a hand-count in the first draft said two).
`make_series.py`: Part II → `["selection"]`, so its paper page now points at the instrument.
Build **716 checks green**, still 8 sections, drive 18/18, 0 console errors.

**Tool 5 — DONE 2026-08-26 (sixth pass): "Five dimensions" · a THIRD group, the first for
readers outside the series.** Haba–Yamashita's 5D SU(3) on S¹/Z₂ (JHEP 05 (2004) 059), whose own
summary calls analysing the vacuum structure the hard part and whose paper never locates a
minimum. `build/make_data_hy.py` → `data/su3_hy.json`: the coefficient table of their eq. (3.20)
EXTRACTED from `part_vii/hy_predictions.py` by evaluating its own `hy_table()` on unit contents
(never transcribed), the 60-row archived prediction bank verbatim, the census (1 277 vacua), and
the anchor = the smallest bank row. `src/modules/fived.mjs` (counts → four-row table → moments →
closed-form α_min with a numeric control run on every render; the blind direction recomputed
live; `spectrum5d` — tower offsets φ = (cα−δ)/2 read back from the table's own phases) +
`src/sections/fived_section.js` (six steppers; three one-press facts: pure gauge D = −9, the
marginal trio 8D = 0, the blind step; the potential with its located vacuum; the KK level
diagram). `_test_fived.mjs`: 19 checks — the bank re-derived to 2.7e-14, the §11 printed numbers
(A₂=3, B₂=4, 8D=0), 8D even on 729 contents, the unknown for an uncovered rep. Build **738
checks green**, 9 sections, 3 models, drive 18/18, 0 console errors. Scope stated, not fudged:
the SU(3) case their (3.20) covers; the general-N sweep of §11 is CITED (no archived general-N
run exists to stand a kernel on).

**Tool 6 — DONE 2026-08-26 (seventh pass): "Collider" · Part VII §10, the showcase.** Carles
asked for spectacular-but-effective, parameterisable, visual. What it is: `src/modules/collider.mjs`
(the one-loop αs runner exactly as `collider_dictionary.py` runs it; `coloronOf` — M₁ = 1/R₅,
√2·g_s, Γ/M = 2αs; `lambda8Of`; `formFactorSpace/Time` — πa·coth(πa) / πb·cot(πb); `chiRatio` =
F(t)² at |t| = M²jj/(1+χ)) + `src/sections/collider_section.js`, LIVE on the model's own 1/R₅
**with a typed 1/R₅ override** (a probe, labelled as such, working even when the model has no
vacuum — a reader with no stake in this series can ask for the curves at THEIR mass). Panels:
the dictionary + the four archived branch rows · "Where the CERN programme meets this" (the
quoted teeth verdict — Δχ² 12.0 vs 3.84, next 244, escape beyond a thousand, sign flip at half
quantum — plus HL-LHC/FCC-hh reach, cited not computed) · the ONE-function plot (contact
expansion, spacelike coth, timelike cot with the poles AS the resonances) · **the distortion as
a house relief over (M_jj, χ)** — the measurement's own binning — drag/turn/wheel with a typed
(M_jj, χ) probe · **the ratio table at the recast's own bins** (kk_dijet_lo.py's grid, read not
typed), the numbers a fit would want. `make_data.py` reads `collider_dictionary.txt`,
`kk_resummation.json`, `kk_dijet_lo.json`, and QUOTES the eq.-(46) teeth from the published tex
(the profiling recipe is `make_fig_chi2.py`'s; a near-miss re-derivation was measured — 11.1/13.3
vs the printed 12.0 — and NOT shipped). `_test_collider.mjs`: 22 checks — the four branch rows,
Λ₈ 7.79/18.48, the archived EFT coefficient and width-shift giveaway, all 10 archived closed-form
ratios to 1e-9, pole/expansion identities, the resolver wiring. One Greek-uppercase trap paid
again: χ in a `<th>` became Latin X (class `.lc`). Build **782 checks green**, 10 sections,
drive 18/18, 0 console errors. shoot variant: the probe typed at 3.97 TeV.

**Tool 7 — DONE 2026-08-26 (eighth pass): the sixth row, pre-registered, in the hierarchy
section.** `make_data.py` reads `part_vi/paper_data/su7_sixth_row.json`. The card states the
confound (n(48) and the published α perfectly rank-correlated across their five rows, so the
1.94/1.20 anchor ratio cannot name the locus), lists the two publishable candidates that break
the lock — click to load, loaded one highlighted — each with BOTH committed predictions
(0.0378/0.0612 and 0.0240/0.0148, factor 1.62), fixed in print before any such row exists.
**The lesson this pass paid for:** the archived α are minima of the EXACT potential; the
resolver's headline is the closed form, 0.4 % away. The first harness draft compared them raw
and failed; the fix compares each with its own kind (numericMin + exact dF against the archive
at 1e-3) and pins the closed form to the archive BY ITS OWN ERROR LAW (≤ 0.71 %), with the card
saying so — a property, not a discrepancy. [[compare-regions-from-the-same-evaluations]]
`_test_hierarchy.mjs` 166 → 180 (including the confound itself checked on their five rows).
Build **796 checks green**, 10 sections, drive 18/18, site clean. NOTE: the Pages build for
`62295a9` (tool 6) sat in "building" for 30+ minutes; the tool-7 push supersedes it — if Pages
sticks again, check `gh api repos/karlesmarin/ghu-explorer/pages/builds/latest`.

**Tool 8 — DONE 2026-08-26 (ninth pass): the wedge, in the anomalies section.** The donation
headline held to a harder standard: over the whole (w28, w84) family of repairs, "row (2) is the
unique row" survives on a REGION — drawn cell by cell, so the shading IS the two inequalities
evaluated. The card derives both inequalities from the shipped engine (gauge −27/8 from the
empty term table, per-multiplet weights from the bill), plots the seven archived repairs on top
(w = 1 green, the EDGE point hollow exactly on the boundary), the diagonal with the exact
(27/46, 27/26) interval, and states the invisibility: w(7), w(48) enter neither inequality, so
the largest repair the α column asks for — w(48) = 5.59 — cannot touch the headline.
`make_data.py` reads `su7_repair_space.json` + the txt (a first grab matched the wrong
"w(48) = " line — the control row at 0 — and was tightened to the sentence).
`_test_hierarchy.mjs` 180 → 190: the plane reproduces all seven archived points to 1e-9, each
headline flag is exactly D2 > 0 ∧ D3 < 0, the interval is 27/46–27/26 exact. Build **806 checks
green**, drive 18/18, site clean. THE AGREED LIST OF 2026-08-26 IS COMPLETE: tools 1–8, five
sections → ten, one model → three.

**Bonus pass 2026-08-26 (tenth): the SECOND ANCHOR (vGIQ) as a card in Five dimensions.** The
other in-print anchor route, now on the page: `make_data_hy.py` reads `vgiq_anchor.json/.txt`;
the card recomputes IN THE BROWSER the four critical N_f (exact, = 3C_G/4C_R — their criterion
IS our D > 0), both adjoint potentials from the archived charge lists (α = 2ω, their own
footnote), the minima by numericMin, and the fundamental Polyakov loop at both points. SU(2)
0.25 exact; SU(3) OURS exactly 1/3 on the Z₃ centre (|P| = 0, computed live) against their
printed 0.29 (|P| = 0.168), drawn visibly off the bottom of their own curve — UNRESOLVED, with
the evidence stated (0.29 = ⅓·√3/2 to two digits; their text fixes that normalisation for SU(2)
only). The first drawing shipped UPSIDE DOWN — minima on the peaks — and the screenshot caught
it, as the house demands. `_test_fived.mjs` 19 → 29 (F'(2/3) ~ 1e-40 via dF; |P| pinned to the
archive). Build **816 checks green**. With this, BOTH in-print anchor routes live in the
instrument: the sixth row (hierarchy) and vGIQ (five dimensions).

**Eleventh pass 2026-08-26: the SU(7) ATLAS — a section of its own.** Where the SU(4) atlas
draws 119 tori, here a tile is a curve: `src/modules/atlas.mjs` (`buildAtlas7`) enumerates the
1 286 contents at five multiplets and draws every potential through the six-atom factoring
(windings once per atom per grid point, six multiply-adds per curve point — about a second);
`src/sections/atlas_section.js` draws them on ONE canvas (hit-tested by arithmetic, not 1 286
elements), sorted by α_min, coloured by class (window / false vacuum / breaks outside / no
small-α solution / no breaking), click → numbers → load into the model. The picture is one
sentence: **one green tile out of 1 286, and it is their row (2)** — the anomalies section's
count, seen. `_test_atlas.mjs` (17): the four archived counts of ceiling_ilp.py's N = 5 row land
exactly (1286 / 1 / 1 / 1), the window tile IS row (2)'s bulk with the resolver's own α to 1e-12,
sampled curves against the direct winding sum (float32 storage → 1e-4, stated), and — two
enumerations, one truth — the atlas's 315 / 677 agree with `sweepHierarchy`'s noVacuum /
noSolution. Build **833 checks green**, 11 sections. Rail order: Hierarchy, Atlas, Same
potential?, … Home says eleven computations.

**Twelfth pass 2026-08-26: an OUTSIDE AUDIT read the deployed source and found four real
things — all fixed, each pinned.** (1) `vacuum.true` was `W > 0` under a THEOREM chip and the
words "the true vacuum". [8]'s criterion — and Part VII's own sentence, "sufficient for the
electroweak point to be the deeper one" — only compares the two SYMMETRIC points; the auditor's
counterexample from this page's own tables, `7(+,+) + 48(+,-) + 84(+,+)`, has W = 5/2 and a
branch at F = −0.626 while F = −1.698 at α = 0.566. Reproduced to every digit. The verdict now
has two halves: symmetric (theorem, necessary) and deepest-point (MEASURED, by direct
minimisation of the same F on every render — what the sweep's `notGlobal` already did and the
single-model verdict never consulted); `true` is the conjunction, the chip is VERIFIED, the
section text names the deeper minimum. The paper is unaffected: its sentence is the modest one
and its 9.22 witness was checked on the exact potential. (2) "the largest α their Table 1
reaches" was 0.0836 — OUR α on their rows — against their printed 0.081; both now carried,
`regimeAlphaMax` (ours, the boundary, because that is the closed form's axis) and
`publishedAlphaMax` (theirs), and the sentence says which. (3) The SU(4) calculator minimised
the whole torus and reported `searched: [0, ½]`; `minimise()` now gets `a2max` from the licensed
domain, and drive.mjs still passes 18/18. (4) `validate()` accepted parities of any length;
now exactly two. `_test_hierarchy.mjs` 190 → 203: the counterexample FALSE with the deeper α
named, the five rows and the attained witness re-verdicted, 0.081 read not recomputed, parity
lengths rejected. Changelog entry `2026-08-26-part-vii-true-vacuum-is-not-w-alone.md` (note;
record untouched). Build **846 checks green**. [[a-necessary-condition-not-a-convenient-one]]
[[the-absolving-half-of-a-gate-is-never-tested]]

**Thirteenth pass 2026-08-26: TILE DIFFING in the SU(4) atlas.** `eta.mjs` gained
`spectralSignatures(data, key)` (the odd and even parts of a mode table, as strings) and
`tileDiff(A, data, keyA, keyB)` — A − B pixel by pixel, max and relative gap, `identical`, and
the spectral PREDICTION for the atlas's mode (odd signatures in η-difference, both in V) with an
`agrees` flag: "identical" must mean what the spectra say, or the panel reports a disagreement.
The section's atlas card ends with "Diff two tiles": two selects, or shift-click two tiles;
three thumbnails (A, B, A − B, blank when identical) and a verdict that names the mechanism —
same box + same odd spectrum ⇒ identical η-difference tiles, and the sentence tells the reader
to switch to V to watch them come apart. Opens on the first same-box pair so the claim it exists
to test is on screen without a click. `_test_eta.mjs` 60 → 70: on all 73 same-box pairs the
pixels agree with the spectra in both modes, the identical counts ARE the atlas's oddSame (73)
and evenSame (7), a visibly different same-box pair exists, self-diff is zero, A − B = −(B − A),
unknown keys return null. Build **856 checks green**. That closes the two items the 9 August
handoff left on the eta-meter (an SU(7) atlas; diffing two tiles).

**Fourteenth pass 2026-08-26: a REFEREE REPORT on the deployed repository, and the golden suite
it asked for.** Carles pasted a full referee-style review ("major revisions, positive science";
useful as a *research explorer*, not yet a *reference computational tool*). Its P0s about the
true vacuum, `publishedAlphaMax`, the SU(4) domain and the parity check were the previous pass's
audit and were already live — verified against the served copy before replying. Its remaining
P0 was real and new: **from outside, the instrument has no visible validation.** `ghu-lab` has no
git remote, so a reader of `karlesmarin/ghu-explorer` sees one 542 kB HTML file and the July
builders; the sixteen harnesses and their 856 checks do not exist for them. Fixed by shipping the
evidence with the artifact:
- `build/make_reference.py` extracts Part VII's **Python** engine and emits
  `tests/reference_models.json` — eight contents: the five published rows, the audit
  counterexample, a false vacuum by W, and one that does not break.
- `tests/run.mjs` opens the BUILT page, pulls the engine out of it, evaluates it with no DOM and
  compares moments, W, the closed form, the direct global minimum, m_h and both halves of the
  vacuum verdict. **67 checks, no dependencies, `node tests/run.mjs` from a clone.** Falsified by
  breaking a reference number on purpose (65 ok, 2 failed), then restored.
- It is in the build's own harness list, so the deployed copy can never carry a suite the build
  has not just seen pass; the README gained a "Validation — run it yourself" section that also
  says what the suite does NOT cover (the absolute-scale question: an open problem, not a bug).
- The other-symmetric-point card gained the referee's pedagogical split as a two-row strip:
  *endpoint stability* (theorem, about W) and *global vacuum* (verified here).
**DEPLOY STEP CHANGED**: `tests/run.mjs` and `tests/reference_models.json` must be copied to
`ghu-explorer/tests/` alongside `site/*`, or the public suite goes stale against the page.
Build **923 checks green** (856 + the 67 that ship). `ghu-lab c267b78`/`66d7367`.

**Fifteenth pass 2026-08-26: THE SOURCE TREE IS PUBLIC — `github.com/karlesmarin/ghu-lab`.**
Carles said publish it. What the audit before publishing found and what was done about it:
- **The history could not travel.** A headless-browser profile had been committed once
  (`.shoot-profile-drive/`, 251 files including `Cookies`, `Login Data`, `History`,
  `Trust Tokens`) and removed again; it is gone from the working tree but lives in the old
  commits, and `git filter-repo` is not installed here. So the public repository starts at a
  clean **orphan `main`** — one commit, 90 files, verified to reach zero objects of that profile.
  The pre-public history stays on the local **`master`** branch and **must never be pushed**.
  Nothing narrative is lost: HANDOFF and `changes/` carry it, and both are in the tree.
- **No published file may name the private authoring tree.** Six build scripts and four data
  files carried `...\Curiosity\research\smeft_formalization\...`, and nothing on the deployed
  site had ever named it. `build/sources.py` now resolves that root from `GHU_SOURCES` or from
  `build/sources.local` (git-ignored), and `provenance()` records repo-relative paths, so the
  JSON still says WHICH script produced a number without saying where it sits. Re-audited from
  outside after the push: zero hits for the local layout in any published file. Bonus, and it was
  a referee point: the generators are now runnable by someone else.
- README (what it is, what is checked and against what, how to reproduce the data, the anchor
  caveat, the layout, why the history starts here) + Apache 2.0, matching ghu-explorer, which now
  links to the source from its own table and its validation section.

**Sixteenth pass 2026-08-27: a SECOND OUTSIDE AUDIT, on the corrected code — the verdict had no
third answer.** Carles pasted a review of the public tree at `013566e`. It confirms the four
findings of 2026-08-26 are fixed and finds the correction's own edge, and it is real:

- **`vacuum.true = symmetricOK && deepest !== false`, and `deepest` is `null` when nothing was
  tested.** `null !== false` is `true` in this language, so a content that never reaches the
  minimiser and has W > 0 exported `alpha_min: no electroweak breaking` next to
  `vacuum.true: true`. The auditor's content, built from the page's own coordinates:
  **2 × 7(+,+)** — gauge seed 8D = −27, 2W = −3; each 7(+,+) adds 8D = −6, 2W = +2 ⟹ 8D = −39 < 0
  with 2W = +1 > 0. Reproduced to every digit, and `build/make_reference.py` now emits that row so
  the **Python** engine confirms 8D = −39.00, W = +0.50 independently.
  `true` is now ternary — `{true, false, null}` — beside a named `state`: `true-vacuum`,
  `false-vacuum`, `no-electroweak-breaking`, `no-branch-located`, `undetermined`. The two ways of
  having no subject are kept apart on purpose: D ≤ 0 is not the same fact as "D > 0 but the
  stationarity condition has no small-α solution".
  **The screen was never wrong** — it already said "But D ≤ 0, so there is no interior minimum for
  it to be the vacuum of". The exported object was, and the object is what a third party reads.
  Two UI reads of `vac.true` as a boolean were tightened to `!== false`, or a null would have
  fallen into the false-vacuum branch and dereferenced a null `alpha_global`.
- **The globality half no longer rests on a positional tolerance.** It was
  `|α_global − α_closed| < 0.02 || gap in F negligible`, and the positional half is a guess about
  how wide a basin is, made with an expansion that is good to 0.71 % under their Table 1's largest
  α and to 20 % out at 0.229. New `localMin` in the kernel walks downhill from the closed form to
  the minimum it is *about*, `numericMin` finds the deepest point with no bracket, and the verdict
  is **F against F** at two refined minima — the same procedure `sweepHierarchy` already ran over
  the whole lattice, so the single-model verdict and the sweep now use one instrument. Five
  published rows: local and global agree to < 1e-6. The 2026-08-26 counterexample: 0.0839 vs
  0.5660, F lower by 1.07.
- **Falsified both**, by putting the old boolean back: `_test_hierarchy` 215 ok / 2 failed and the
  shipped `tests/run.mjs` 75 ok / 3 failed, the last of them reading `page true=true` on 2 × 7(+,+).
  Restored. `localMin` also has to prove it is not returning its input: two different starts land
  on the same minimum, and a start in the deep basin returns *that* one.
- The site check that fired was a good one: a changelog title whose first 40 characters contain a
  backtick does not survive into the rendered stream. Titles stay plain prose.
- **And writing that entry found a builder bug that had been there since the first build.**
  `build_site.inline()` escapes an entry's whole text and *then* the code-span rule escaped its own
  group again, so a `<`, `>` or `&` between backticks reached the page as `&amp;lt;` and rendered
  as the literal entity. It had never fired because no entry had ever put one of those three
  characters inside backticks — the half of a converter that handles the awkward character is the
  half nobody exercises. Fixed (the group arrives already escaped), and `_test_site.py` gained
  **"nothing on any page is escaped twice"** with its breaker: 26→28 site checks.

Build **1 109 checks green** (`_test_hierarchy` 203→217, `tests/run.mjs` 67→78), `shoot` 0 console
errors, `drive` 18/18. Changelog entry
`2026-08-27-part-vii-a-verdict-can-have-no-subject.md` (note; affects_record: no — every published
row has a branch and on all five the refined branch minimum IS the global one).
**What the audit raised and did NOT become work here** (Carles's calls): the α normalisation, and
four proposals — an inverse model designer with ILP no-go certificates, a convention microscope for
α, a vacuum phase atlas with a robustness distance, and RGE/finite-T/flavour modules.

**Still open, and both are Carles's calls, not defects:** the α normalisation (a science problem
the papers already state as open — the two in-print routes are in the instrument), and scope —
a Python API, and whether to publish the `ghu-lab` source tree, which would answer three of the
referee's points at once (visible tests, engine/UI separation, extensibility).

---

> State at commit `eab4f23`, 2026-08-09 (evening). Read this first, then `DESIGN.md` for the
> decisions and `SITE.md` for the map the site was built from.

## Where it stands

**Five of five sections built, all five with graphics, and the site around them.** `python build/build_app.py` →
`app/index.html`, one file, nothing fetched, opens from `file://`. **BUILD GREEN at 412 checks**
across nine harnesses, one of which (`_test_surface.mjs`) is the relief's own. The headless shooter reports **0 console errors** on all five sections.

**Every section draws now.** Three of the five were text-only: they were rebuilt here from pages
that had four panels each in `ghu-explorer` and the graphics did not come across. `src/kernel/
surface.mjs` (the relief, ported) and `src/sections/torus_panels.js` (the plan+relief pair, mounted
by three sections) are the machinery; `build/drive.mjs` is the proof that it answers a mouse.

**The site exists.** `python build/build_site.py --legacy ../ghu-explorer/tools-2026-07` → `site/`:
home, one living page per paper (I–VII), the change log, the docs, the editions index, a copy of
the instrument, and the three earlier tools carried over. **26 checks, and each one is also run
against a site broken on purpose** so that no guard in it has gone unfired. **Deployed on 2026-08-09**; what deploying
taught us is below.

## Read this before trusting a number off the page

The instrument's absolute scales are **not settled**, and the page now says so in its first
sentence rather than in a footnote. Row by row, our α against the published α:

| row | 8D | A₄ | ours | theirs | ours/theirs | m_h |
|---|---|---|---|---|---|---|
| (1) | 15 | 258 | 0.0554 | 0.0430 | 1.289 | 143.5 |
| **(2)** | **29** | **271** | **0.0836** | **0.0810** | **1.032** | **125.9** |
| (3) | 9 | 189 | 0.0436 | 0.0210 | 2.077 | 148.1 |
| (4) | 11 | 223 | 0.0469 | 0.0260 | 1.805 | 149.7 |
| (5) | 15 | 255 | 0.0554 | 0.0430 | 1.288 | 144.0 |

Two things follow. The disagreement is **not a constant** — a constant would be a convention and
could be absorbed; 1.03 to 2.08 with no pattern cannot. And row (2), the row the tool opens on, is
the **only** one that agrees and the **only** one whose m_h lands in the 125–127 GeV window. That
default was inherited, not chosen, but naming it "the anchor" gave the most flattering case a
justification it had not earned. It stays — it is the row Part VII's argument walks through — and
the header now says what it is, in a sentence `make_data.py` generates from the rows and refuses to
ship stale.

What escapes the caveat entirely: the **mass ratio**, the **bill in eighths**, the **two arithmetic
laws**. No normalisation enters any of them.

```
python build/build_app.py          # inline → collision guard → edition gate → 8 harnesses
python build/build_app.py --edition   # the frozen edition, into editions/
node   build/shoot.mjs             # headless screenshots of every section + console + which model

python build/make_series.py        # data/series.json, FETCHED from Zenodo, never typed
python build/build_site.py --legacy ../ghu-explorer/tools-2026-07     # → site/, then gates itself
node   build/shoot_site.mjs        # every page, 1280 and 390 px, console + horizontal overflow
```

`app/`, `site/`, `shots/`, the two `.shoot-profile*/` and `__pycache__/` are untracked on purpose:
all of them are regenerated, and `app/index.html` alone would put a 178 kB diff in every commit.

## The five sections

| section | paper | group | what it puts at risk | draws |
|---|---|---|---|---|
| Hierarchy | VII | SU(7) KM25 | the closed form against the numeric minimum on **1 286 contents**, split by whether α is inside the range their table reaches | the potential, the moment plane, the hierarchy surface, the error against α |
| Anomalies & proton | VI | SU(7) KM25 | the escape's price in eighths, on their five rows **and on the whole lattice**; the six channels are declared `unknown`, not omitted | the bill as signed bars, the ladder with its quantum, the two ceilings against content size |
| Selection rule | III | SU(4) AHMN | the rule against a winding sum that never sees (a,b,c): **119, zero disagreements** | the torus, with the half you need not search greyed |
| Model calculator | IV–V | SU(4) AHMN | AHMN's published mass ratio, 1.2045 against 1.2046 | the torus, the vacuum, the cut |
| eta-meter | IV–V | SU(4) AHMN | the closed form against brute force: **119, worst 0.0162 %**; and the atlas, whose blank tiles must be the ones the modes predicted | the torus, the field released on it, and **119 landscapes side by side** |

Each holds **one model per group**; the rail is grouped by family; a model never travels between
groups. Every group opens on a named `anchor` in its data file — the instrument must not open empty.

## The site, and what holds it honest

`src/site/` is the source (a shell, one stylesheet, two body fragments, one hand-written lead for
the unpublished part); `data/series.json` is the record, **fetched from Zenodo's own API** by
`make_series.py` and never typed. A part with no deposition carries `doi: null`, and there is no
code path that prints a number in its place — Parts VI and VII render "not yet deposited".

`_test_site.py` runs thirteen checks and then runs **each of them again against a site broken on
purpose**, so the second half of its output is the proof that the first half means something:
links resolve on disk (so `file://` and a server agree) · no page reaches outside itself (the
Edition gate, reused) · every DOI printed is one the record holds · an undeposited paper prints no
DOI and says so · and links to no archive or repository either · the shipped instrument is
byte-identical to the tested one · the pages and the app share one palette · every part has a page
and every page is a part · every page has a title, a description and a viewport · no substitution
token survived · the home page still says the numbers are not citable · severity and "affects the
record" agree in every entry · every entry appears both in the stream and on its own paper's page.

`build/shoot_site.mjs` then looks at all fifteen pages at 1280 px and at 390 px and reports the
console and any page that slides sideways.

## Looking at it, and using it

Three tools, and they are not the same thing:

```
node build/shoot.mjs        # every section, full height, + console + WHICH model it held
node build/shoot.mjs --page site/app/index.html --out shots/site-app   # the SITE's copy
node build/shoot_site.mjs   # every site page, 1280 and 390 px, + horizontal overflow
node build/drive.mjs        # USES the calculator: real mouse through the DevTools Input domain
```

The second line is not a duplicate. The site's instrument differs from the standalone one by
exactly one element — **the way back to the home page** — and until `--page` existed no shooter
ever opened it: `shoot_site.mjs` skips `app/index.html` on purpose (it cannot drive the rail) and
`shoot.mjs` only knew about the standalone build. `_test_site.py` proves the link is present,
resolves on disk, and that the rest is byte-identical; none of that can see a header that renders
it clipped or invisible. Every run now prints which file it opened and what the way back says.

`drive.mjs` is the one that matters when the panels change. It drives the section with real mouse
events rather than events dispatched from inside the page — which would prove the listeners exist
and nothing about whether the browser reaches them — and asserts the contract: dragging the plan
lands α where it was aimed, α₁ spans twice what α₂ does on the same panel, shift-drag turns without
moving the cursor, the wheel raises, and **none of it touches the model**. 18 checks. It survived
the calculator's migration onto the shared pair without one assertion being edited, which is the
only reason that refactor can be believed.

The Claude-in-Chrome extension is a different mechanism and was not connected in this session; it
is not needed for any of the above, and would only add driving the browser Carles is looking at.

## The results this instrument produced (not just displayed)

- **The selection rule is one bit.** `a+2b+3c ≡ a+c (mod 2)`, and both branches of `degenerate`
  force `a+c` even, so the disjunct never fires: `halfDomain ⟺ a+c even`. Zero exceptions on the
  3375 triples up to 14, of which 399 are degenerate. Not a correction to Part III — a reduction.
- **And the rule bites.** Where it forbids halving, 40 of 60 representations really do lose the
  minimum if you halve anyway, the worst by 45.1 % of |V|. A rule that never bit would protect
  nothing.
- **The η closed form on 119, not five.** Worst 0.0162 % against the winding sum; on the 16 blind
  ones the prediction is zero and the winding sum measures *exactly* zero.
- **The box fixes the η-response, not the landscape — and the page this atlas came from had it the
  other way round.** `predict_shell.html` §4 says "multiplets that share a box share a landscape".
  Measured over the catalogue: of the **73** same-box pairs, **73** share their *odd* spectrum, so
  in η-difference mode their tiles are identical pixel for pixel — and only **7** share the even
  one, so **66** of them are visibly different *potentials*. The true half is the sharper one, and
  it is exactly what Part IV is about.
- **The 16 blank tiles are predicted before they are drawn.** In η-difference mode a tile goes blank
  iff every mode of that multiplet has `A = B` — computed from the modes, then compared against the
  picture, and a disagreement would be reported instead of the result. On SU(4) the three sets
  coincide: declared blind = no box = η-silent, 16 each, zero mismatches. The coincidence is
  *checked*, never leaned on. [[a-missing-datum-is-not-a-zero]]
- **The closed form is a small-α statement, and the lattice shows exactly where it stops.** On all
  1 286 contents of at most five multiplets: 266 have a vacuum, and the closed form is within
  **0.71 %** for α ≤ 0.0836 — the largest α their Table 1 reaches — and within **20.7 %** out to
  α = 0.229. Median **0.099 %** inside that range, which is the paper's own 0.13 % over 272
  *synthetic* contents reproduced on a different set; the 0.83 % overall median is entirely
  extrapolation. And **13** contents are a separate matter, not an error bar: there the small-α
  branch is a genuine minimum but not the deepest point of F — worst at `2×7(+,+) + 28(+,−) +
  48(+,−) + 84(+,+)`, branch at 0.0258, F lower at 0.6570. The first version of this sweep called
  those a 96 % error, which was the sweep subtracting two different objects.
- **Part VI's escape puts a ceiling on Part VII's hierarchy — 3.97 TeV against 10.03.** Donating the
  host costs exactly `10/8` and D must stay positive, so a content can pay **iff `8D ≥ 11`**; 8D is
  odd, so there is no slack. The certified per-rung ceiling is monotone in D and its argmax sits on
  the quantum `8D = 1` — the rung the bill makes unaffordable. Certified by the same exact rational
  dual, `ceiling_ilp.py` §6, and the enumeration to 14 multiplets respects it (best that can pay:
  3 017 GeV). The content that generates the largest hierarchy is exactly the one that cannot pay.
  Neither paper says it: Part VI does not recompute the potential, Part VII imposes no anomaly
  condition. **Scope**: it bounds the content *before* the donation, not the world after.
- **Part VI §7 gets recomputed.** Part VI says in its own words that the modified potential is not
  recomputed there. With the Part VII kernel present it is, labelled `measured`, carrying the
  anchor band, and flagged as beyond what the paper claimed.

## What to do next, in order of what it returns

1. ~~**The atlas.**~~ **Built**, and the port corrected the page it came from twice — see the
   results below. What it still does not have: a way to *diff* two tiles on screen, and no atlas at
   all for SU(7), where a tile would be a curve rather than a torus.

2. ~~**Deploy the site.**~~ **Done, 2026-08-09** — `karlesmarin/ghu-explorer` commits `2358f64`,
   `1b0acf6`, `075556e`. The root serves the home page; `/app/`, the seven papers, changes,
   docs, editions and `tools-2026-07/` all answer 200; and the **served** copy, shot headless
   through `shoot.mjs --url`, gives zero console errors with five sections drawing. Three
   things only the deployment could find, all fixed: `build.py` still wrote onto `/index.html`
   and would have destroyed the site on one run (the three July builders now write into
   `tools-2026-07/`, and each still reproduces its carried page **byte for byte**); the README
   and the repo description still described July; and the inline `data:` favicon was flagged
   by two of our own guards, including the one that recommends `data:` URIs — the rules were
   fixed and re-falsified rather than waived. The reasoning that chose the target still
   stands and is kept here: the target was **not** a new repository: `karlesmarin/ghu-explorer` is public, live,
   and **linked from all five published Zenodo records** (in their notes and as `isSupplementedBy
   … software`). Only the *root* URL is cited externally — checked, with `calculator.html` and
   `predictor.html` appearing nowhere outside that repo — so the root may become the new home, and
   the build already carries all three old pages into `tools-2026-07/` byte for byte so that every
   link inside them still resolves. Copy `site/*` over the working copy, commit, push; Pages is
   already serving it. Two things the site does not have yet and the pages do not claim: **the
   per-paper ledger** (established / corrected / withdrawn / open — the papers already end with
   one, it is not machine-readable yet) and **the figures**.
3. **Close the anchor gap, or characterise it — but read `Curiosity/research/smeft_formalization`
   first, because most of the obvious moves are already dead.** Re-run on 2026-08-09 and
   confirmed: their α is *not* a different minimum of our own potential (`F'(α_theirs) ≠ 0` on all
   five rows, and on row (3) `F'' < 0` there, so their eq. (80) returns no real m_h at their own
   published value); no single coefficient reconciles the columns — forcing one common κ in
   `D = A₂ − κB₂` still misses α by 17.9 % at best and blows the m_h column to +37 %, and adding a
   second knob (a common rescaling of A₄ and G) only reaches 15.5 %; a per-row fermion rescaling
   λ gives five different λ and five different implied g₄ spread over 22 %. That is on top of
   `su7_anchor_mh.py`, `su7_content_dependence.py` and `su7_repair_space.py`, which killed the
   per-representation and per-channel rescalings. **The live routes are the two already in print**:
   the pre-registered sixth row in Part VI, and Part VII's second anchor (von Gersdorff–Irges–
   Quirós, `hep-th/0204223`), which reproduces our criterion exactly and therefore relocates the
   residual away from the potential itself. Do not re-derive any of the above.
4. ~~**A sweep for hierarchy and anomalies.**~~ **Done, both.** Anomalies carries the whole SU(7)
   lattice (1 286 contents at 5 multiplets to 319 769 at 14, with how many land in the Higgs window,
   hold the host, and can still pay for the escape), read from `ceiling_ilp.py`. Hierarchy runs the
   closed form against direct minimisation on all 1 286 in the browser, in about six seconds. All
   five sections now go past their own default.
5. **Scope, which is the real limit** (see the page's own "cannot tell you" panel): two models with
   fixed orbifolds and conventions, and no Python API. Letting a user declare a group/orbifold, or
   exporting the kernel as a callable library, is what would put this in someone's workflow. It is
   a project decision, not a defect.
6. **The five DESIGN.md verifications**, still unrun — Blob workers/WASM under `file://`, free-tier
   limits, arXiv ancillary HTML, CONTUR drill-down, and the charge-cone Hilbert basis novelty.
   **The last two must not be claimed until gated.**
7. Part VII's own remaining work lives in the authoring tree (`GHU_SOURCES`) — the Spanish edition and the
   thermal-holonomy literature gate.

## Traps this repo has already paid for

Every one of these cost a build or a day. They are in the code as comments; this is the index.

- **Internal consistency cannot detect the wrong object.** The first torus port passed 22 true
  internal checks and was the wrong engine — 1.1405 against 1.2046 published. Only an outside
  number caught it. Then the re-port gave 1.2033 because `KMAX` was *typed* as 5 instead of *read*
  as 10.
- **A missing datum is not a zero.** 16 reps had no Part IV box; skipping them printed `M₂ = 0` →
  "invisible to η". Right answer, wrong reason: those 16 happen to be exactly the 16 the catalogue
  declares blind. On the next group it would have lied.
- **Comparing two regions needs one evaluation set.** Scanning the half separately gave it twice
  the resolution and a "loss" of −5.3e-4 that was mesh, not physics.
- **Do not ship a number that comes from a speed knob.** The sweep reported 3 of 119 as "not a
  minimum"; all three are minima, and what it measured was a grid resolution chosen for speed.
- **A test that measures progress fails when you make some.** Twice: counting unbuilt sections, and
  counting unknowns. Both re-expressed as named sets and invariants.
- **A default is a claim about typicality.** The tool opened on the only row that agrees with the
  published α and the only one inside the Higgs window — inherited, never audited, because a
  default looks like configuration rather than content.
- **A guard that has never fired is not a guard.** The collision guard, the edition gate, the id
  check, the render smoke and the anchor check were each proven by breaking something on purpose.
- **An element that exists in only one build is verified by nobody.** The way back to the home page
  is in the site's copy of the instrument and not in the standalone one. `shoot_site.mjs` skips the
  instrument by design, `shoot.mjs` only opened the standalone, and `_test_site.py` can prove a link
  is *present* but not that it *renders*. It was correct all along — and that is luck, not process.
  `--page` closes it, and both shooters now print the way back they found.
- **A shared debugging profile is a shared lock.** Two shooters pointed at different pages still
  wanted the same `.shoot-profile/` and port, so the second run failed trying to delete a directory
  the first browser still held — a tool bug that reads exactly like a broken page. Port and profile
  are now derived from the output directory.
- **A ported picture carries the source page's claims, and its bugs, in a form nobody re-derives.**
  The atlas came from `predict_shell.html` §4 with two things wrong that a screenshot cannot show:
  square tiles over a 2 × 1 torus (α₁ squashed by two, silently — the trap below, paid a third
  time), and a caption asserting same box ⇒ same landscape, which is false for V in 66 of 73 pairs.
  Both were found by *computing* what the caption claimed rather than by looking at the tiles.
- **Two objects subtracted is not an error.** The hierarchy sweep's first run reported a worst case
  of **96 %** and it was not measuring the closed form at all: on that content the small-α branch is
  a perfectly good minimum and the *deepest* point of F is somewhere else entirely. A comparison
  needs both sides to be the same object. The sweep now refines locally from where the closed form
  says the minimum is, and counts "not the global minimum" as its own class with its own sentence.
- **A near-coincidence of counts invites a false comparison.** The lattice has 266 contents with a
  vacuum; the paper quotes a median over 272 synthetic ones. Reading the two side by side, our
  0.83 % looks like it contradicts their 0.13 %. Split by α it is 0.099 % inside their range — the
  same number. The panel says which set is which, in as many words.
- **A field name is a namespace across groups, not inside one.** The SU(7) size curve went in as
  `catalogue`, which in `su4_ahmn.json` already means *the list of multiplets* — and one line of
  `_test_app.mjs` reads `DS.catalogue[0].name`. It survived only because SU(7) also has
  `published_rows` and the `||` short-circuited. Renamed `size_curve`. Two data files are one
  vocabulary; a key that means different things in each is a bug waiting for the group that has
  both. **Paid for on 2026-08-09.**
- **A count of files is not a count of the things they make.** `build_app.py` reported "6 sections
  live" for five, because it counted every entry in `SECTIONS` except `registry.js` — and
  `torus_panels.js` is a shared panel. The number drifted when the code was refactored rather than
  when the thing it measures changed. Now it counts `*_section.js`.
- **Greek uppercases.** `η` under `text-transform:uppercase` is glyph-identical to `H`. Class `.lc`.
- **A CSS rule matches descendants.** `.verdict b` caught every bold word in the explanation, not
  just the title.
- Heredocs eat `\n` and LaTeX/JS payloads. Use Write/Edit, not `python - <<'PYX'`, for anything
  with escapes in it. **Paid for again on 2026-08-09**: a heredoc patch turned `\n` inside
  `build_site.py` into a literal newline and produced an unterminated string.
- **A probe that fires on its own fix is worse than none.** The site's overflow detector first
  reported every element whose box reached past the viewport — which, once wide tables were wrapped
  in a scroll container, meant the *table inside the fix*. It now decides on the document
  (`scrollWidth > clientWidth`) and lists elements only as diagnosis, skipping anything inside
  something that scrolls. Verified by unwrapping a table on purpose and watching it fire.
- **A link is not a claim you get to make for free.** The first site build printed
  `github.com/karlesmarin/su7-hierarchy` for Part VII — a repository that does not exist, invented
  to fill a column. Now a repository link is rendered only for a *published* part; Part VI's name
  comes from `GH_REPO` in `publish_su7.py`, and Part VII's is `null`.
- **A frozen artifact cannot be held to a generated page's standards.** The three carried tools
  have no `<html lang>`, no meta description, and overflow on a phone. They may not be edited, so
  the gates exempt them by name and by reason — and still require them to carry a title and to be
  self-contained.
- **The grid comes from Nyquist, not from taste.** V is a trigonometric polynomial: with q ≤ 2 and
  |k| ≤ 10 it carries 40 cycles across α₁'s period of 2 and 20 across α₂'s period of 1, so it wants
  81 × 41 samples. The square 64 × 64 grid this shipped with was *above* Nyquist in α₂ and *below*
  it in α₁ — aliased in one direction only, and exactly the one the 2:1 domain predicts. Now
  128 × 64. Carles asked "is there a formula to shorten it"; this was the answer.
- **The unit square is not the domain.** Every renderer inherited from `ghu-explorer` projects onto
  `[0,1]²`. Our torus is 2 × 1. Fed to the original, α₁ comes out squashed by two, silently, in a
  picture that looks entirely plausible. `surfaceProjector` now *requires* the aspect and throws
  without it, and `_test_surface.mjs` carries the control that a 2:1 domain projects 2:1 — a control
  that fails against the code it was ported from.
- **A repaint per frame was not the cost; three million cosines were.** The released field ran at
  11 fps. Caching the base image helped by 10 %; making the walkers roll on the *drawn* field —
  which is also the honest thing, since it is the surface in front of you — took it to 60.
- **A shared module makes two sections identical unless each says what it adds.** Migrating the
  calculator onto `torus_panels` gave it the eta-meter's field release for free, and two sections
  became the same panel. The same object seen three times is the point; three panels that look
  alike is not. Each mount now names what *its* section asks of it.
- **Moving a page moves its neighbours' links.** Putting the old selection page in `editions/` and
  the other two at the root broke the relative links between them. All three now live in one
  directory, unchanged.

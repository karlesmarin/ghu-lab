/* sweep5d.mjs — the model-building loop, closed: boundary conditions × contents, filtered.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE FOUR PIECES EXIST, AND THIS IS THE CHAIN.  `bcclass.mjs` gives the space of boundary
 * conditions and says which of them are the same theory; `sun5d.mjs` gives the potential and its
 * vacuum; `spectrum5d.mjs` says what is massless and whether it is chiral; `anomaly5d.mjs` says
 * what that content owes.  Separately they answer questions.  Together they do the thing a model
 * builder actually does all day: walk the space and keep what survives.
 *
 * THE ORDER OF THE STAGES IS THE WHOLE DESIGN.  Each filter is cheaper than the next, so the
 * expensive one — minimising the potential — runs only on what already passed everything else.
 * The funnel is reported stage by stage, because "3 models survive" says nothing without "out of
 * how many, and where the others died".
 *
 * AND THE ONE THING THE SWEEP ADDS THAT NO SINGLE PANEL CAN.  The survivors are tagged with their
 * EQUIVALENCE CLASS.  A list of forty boundary conditions that is really twelve theories is a
 * list that will be double-counted by anyone who reads it, and the apparent unbroken symmetry —
 * which is what most of these filters are about — is not a property of the class.  So the sweep
 * reports both numbers and never conflates them.
 *
 * WHAT IT IS NOT.  It walks boundary conditions as WRITTEN, which is what a model builder writes
 * down; the physical symmetry is the one at the minimum of the potential, and deciding that for
 * every candidate is the expensive question the last stage only samples.  Said on the page.
 */

import { sun5dBlocks, sun5dTerms, sun5dMinimum, sun5dUnbroken } from "./sun5d.mjs";
import { bcClasses, bcS1Z2All } from "./bcclass.mjs";
import { sp5ZeroModes } from "./spectrum5d.mjs";
import { an5Ledger } from "./anomaly5d.mjs";

/* the eight bulk slots a content is built from: four representations, two parity products */
export const SWEEP_SLOTS = [];
for (const rep of ["fund", "anti", "sym", "adj"])
  for (const eta of [+1, -1]) SWEEP_SLOTS.push({ rep, eta });

/* every content of at most `maxMult` multiplets over those slots, the empty one excluded */
export function sweepContents(maxMult, slots = SWEEP_SLOTS) {
  const out = [], cur = new Array(slots.length).fill(0);
  (function rec(i, left) {
    if (i === slots.length) {
      if (cur.some((x) => x)) out.push(cur.slice());
      return;
    }
    for (let k = 0; k <= left; k++) { cur[i] = k; rec(i + 1, left - k); }
    cur[i] = 0;
  })(0, maxMult);
  return out;
}

const asBulk = (vec, slots = SWEEP_SLOTS) =>
  vec.map((m, i) => (m ? { ...slots[i], kind: "dirac", multiplicity: m } : null)).filter(Boolean);

export const sweepShowContent = (vec, slots = SWEEP_SLOTS) =>
  vec.map((m, i) => (m ? `${m > 1 ? m + "×" : ""}${slots[i].rep}(${slots[i].eta > 0 ? "+" : "−"})` : ""))
     .filter(Boolean).join(" + ") || "—";

/* ------------------------------------------------------------------ the filters */

/* Does the boundary condition leave a factor of each size asked for?  `want` is a list of block
 * sizes, so [3, 2] asks for SU(3) × SU(2) — and the U(1)s come free with the second filled block,
 * which is why the Standard Model's gauge group needs nothing more than that. */
export function sweepHasFactors(b, want) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM].slice();
  for (const w of want) {
    const i = sizes.indexOf(w);
    if (i < 0) return false;
    sizes[i] = -1;                                   /* used up: two SU(3)s need two blocks */
  }
  return true;
}

/* IS THERE A HIGGS DOUBLET THAT IS NOT COLOURED?  The massless scalars are the (−,−) part of the
 * adjoint, which is the off-diagonal block pairs {(+,+),(−,−)} and {(+,−),(−,+)}: a pair of blocks
 * of sizes (n_a, n_b) gives a bifundamental.  For that to be an SU(2) doublet AND a singlet of
 * every other factor, the partner block must have size ONE.  A (3,2) is a doublet too — and it is
 * the coloured Higgs, which is the thing orbifold GUTs exist to avoid, so the two cases are
 * distinguished rather than lumped. */
export function sweepHiggs(b) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  const pairs = [[0, 3], [1, 2]];
  let colourless = false, coloured = false;
  for (const [a, c] of pairs) {
    const x = sizes[a], y = sizes[c];
    if (!x || !y) continue;
    if ((x === 2 && y === 1) || (y === 2 && x === 1)) colourless = true;
    else if (x === 2 || y === 2) coloured = true;
  }
  return { colourless, coloured };
}

/* ------------------------------------------------------------------ the sweep */

export function sweep5d({ N = 5, maxMult = 2, want = [], needHiggs = "none", needChiral = false,
                          needAnomalyFree = false, needBreaking = false,
                          capVacuum = 400, maxSurvivors = 200 } = {}) {
  const t0 = (typeof performance !== "undefined" ? performance : Date).now();
  const classes = bcClasses(N, "S1/Z2");
  const bcs = bcS1Z2All(N);
  const contents = sweepContents(maxMult);
  const stages = [{ name: "boundary conditions × contents", kept: bcs.length * contents.length }];

  /* stage 1: the boundary condition alone — the cheapest filter there is, and it does not depend
   * on the content, so it runs once per boundary condition and not once per pair */
  const okBC = [];
  for (const m of bcs) {
    const b = sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
    if (want.length && !sweepHasFactors(b, want)) continue;
    const h = sweepHiggs(b);
    /* "none" asks for nothing.  A DEFAULT THAT FILTERS makes the sweep lie about its own
     * denominator — and "any" reads like "don't care" while meaning "must have one", which is
     * how the first version of this quietly threw away two thirds of the space. */
    if (needHiggs === "colourless" && !h.colourless) continue;
    if (needHiggs === "any" && !(h.colourless || h.coloured)) continue;
    okBC.push({ m, b, h, cls: classes.of(m) });
  }
  const bcStage = want.length
    ? (needHiggs === "none" ? "the unbroken group" : "the unbroken group and its Higgs")
    : (needHiggs === "none" ? "the boundary condition (nothing asked)" : "a Higgs candidate");
  stages.push({ name: bcStage, kept: okBC.length * contents.length, bcs: okBC.length });

  /* stage 2: chirality, from the zero modes */
  let alive = [];
  for (const e of okBC)
    for (const vec of contents) {
      const content = { bulk: asBulk(vec) };
      const Z = sp5ZeroModes(e.b, content);
      const L = Z.list.filter((x) => x.chirality === "L").reduce((a, x) => a + x.n, 0);
      const R = Z.list.filter((x) => x.chirality === "R").reduce((a, x) => a + x.n, 0);
      if (needChiral && L === R) continue;
      alive.push({ ...e, vec, content, L, R, fermions: Z.fermions, scalars: Z.scalars });
    }
  stages.push({ name: needChiral ? "a chiral massless spectrum" : "the massless spectrum",
                kept: alive.length });

  /* stage 3: the anomaly ledger */
  alive = alive.map((x) => {
    const A = an5Ledger(x.b, x.content);
    return { ...x, owing: A.offending.length, clean: A.clean };
  }).filter((x) => !needAnomalyFree || x.clean);
  stages.push({ name: needAnomalyFree ? "anomaly-free on the bulk alone" : "the anomaly ledger",
                kept: alive.length });

  /* stage 4: the vacuum — the expensive one, and it runs last for that reason.
   *
   * AND AN UNDECIDED CASE IS NOT A NO.  `sun5dMinimum` handles one phase and two; with three or
   * more it returns null, and the first version of this filtered those out together with the
   * models whose minimum really does sit at a symmetric point.  A model the instrument cannot
   * decide was being reported as a model that does not break.  They are now three buckets — breaks
   * / symmetric / undecided — the undecided ones are counted and named on the page, and the same
   * goes for anything the budget cut off before it was ever minimised. */
  let vacuumChecked = 0, capped = false, undecided = 0;
  alive = alive.map((x) => {
    if (!needBreaking) return x;
    const terms = sun5dTerms(x.b, x.content);
    if (!terms.length || !x.b.phases) return { ...x, vac: null, why: "no potential" };
    if (x.b.phases > 2) { undecided++; return { ...x, vac: null, why: `${x.b.phases} phases` }; }
    if (vacuumChecked >= capVacuum) {
      capped = true; undecided++; return { ...x, vac: null, why: "past the budget" };
    }
    vacuumChecked++;
    const v = sun5dMinimum(terms, x.b.phases, { grid: x.b.phases === 1 ? 300 : 360 });
    return { ...x, vac: v, why: v ? (v.atEdge ? "a symmetric point" : "breaks") : "no minimum" };
  }).filter((x) => !needBreaking || (x.vac && !x.vac.atEdge));
  if (needBreaking)
    stages.push({ name: "the Wilson line breaks it further", kept: alive.length,
                  checked: vacuumChecked, capped, undecided });

  const ms = (typeof performance !== "undefined" ? performance : Date).now() - t0;
  const classesLeft = new Set(alive.map((x) => x.cls)).size;
  return { N, maxMult, stages, survivors: alive.slice(0, maxSurvivors), total: alive.length,
           classesLeft, nClasses: classes.nClasses, nBC: bcs.length, nContents: contents.length,
           ms, capped, unbroken: (x) => sun5dUnbroken(x.b) };
}

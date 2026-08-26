/* hierarchy.mjs — the Part VII section, as three modules over the spine.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Provides the moments of a bulk content, the two arithmetic laws it must obey, and the electroweak
 * hierarchy that follows once the Higgs mass is pinned.
 *
 * Split into three so the resolver can do its job: `arithmetic` depends only on the moments and
 * therefore still answers when the vacuum does not exist, while `hierarchy` cannot run at all
 * unless the moments were obtained.  Every value declares what is known about it, and the statuses
 * are not decoration:
 *
 *   theorem   the two arithmetic laws, and the ceiling.  Proved in Part VII.
 *   verified  the closed form, checked against direct minimisation over 272 contents.  Not proved.
 *   measured  every absolute number, which inherits Part VI's open anchor question.
 *   unknown   said out loud, with its reason, whenever the vacuum is not there to be had.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { termTable, moments, rung, alphaMin, curvatureAtMin, higgsMass, invR5, numericMin, F,
         gaugeSeed, stabilityW, F1minusF0, coordinates }
  from "../kernel/potential.mjs";

const CLOSED_FORM_SOURCE = "Part VII eq. (11), verified to a median 0.13 % over 272 contents";
const ANCHOR = "our assembly of the potential; carries the Part VI §7 anchor band 1.03-2.08";

/* The level of the ceiling a content is measured against.  The relaxation's 10.03 TeV is what the
 * dual proves and what the draft shipped; the published Part VII adds the true-vacuum level, 9.22
 * TeV, and that is the physical one -- a content whose electroweak point is not its vacuum is not
 * a model of anything.  Older data files carry only `constants`; this reads the level if it is
 * there and falls back, saying which it did. */
export function physicalCeiling(data) {
  const c = data.ceilings;
  if (c && c.true_vacuum)
    return { GeV: c.true_vacuum.GeV, A4: c.true_vacuum.A4, "8D": c.true_vacuum["8D"],
             kind: "true vacuum required",
             source: `${(c.true_vacuum.GeV / 1000).toFixed(2)} TeV for any content whose ` +
                     `electroweak point is its true vacuum -- Part VII eq. (36), attained; its ` +
                     `witness on the exact potential gives ${c.true_vacuum.exact.GeV} GeV` };
  return { GeV: data.constants.ceiling_GeV, A4: data.constants.ceiling_A4,
           "8D": data.constants.ceiling_8D, kind: "relaxation",
           source: `the relaxation's ${(data.constants.ceiling_GeV / 1000).toFixed(2)} TeV -- ` +
                   `Part VII eq. (24), exact rational dual; this data file carries no true-vacuum level` };
}

/* ------------------------------------------------------------------ 1. the moments */

export const momentsModule = (data) => ({
  id: "moments",
  provides: ["moments", "terms"],
  requires: [],
  compute({ model }) {
    const terms = termTable(model, data);
    const mo = moments(terms);
    return {
      terms: val(terms, { status: STATUS.MEASURED, source: `term tables of ${data.id}` }),
      moments: val(mo, { status: STATUS.MEASURED, source: `term tables of ${data.id}` }),
    };
  },
});

/* ------------------------------------------------------------------ 2. the arithmetic */

/* THREE LAWS, AND WHICH OF THEM DEPEND ON THE GAUGE SEED.  Part VII as published separates them:
 *
 *   8D = 2A4 + 3 (mod 6)   Theorem 2 -- the matter lattice's own, holds on EITHER seed
 *   2W odd                 eq. (35)  -- holds on either seed; the two symmetric points never tie
 *   8D odd                 Theorem 1 -- CONDITIONAL on the gauge sector contributing an odd amount,
 *                          which the coefficients as printed do and the candidate split does not
 *
 * So the page asserts the first two unconditionally and the third against the seed the model
 * stands on: on the candidate seed 8D is even and A4 half-integral, and that is the theorem's
 * hypothesis not being met, not the theorem failing. */
export const arithmeticModule = (data) => ({
  id: "arithmetic",
  provides: ["laws", "D8", "A4", "W", "coords", "seed"],
  requires: ["moments", "terms"],
  compute({ model, get }) {
    const mo = get("moments").value, terms = get("terms").value;
    const co = coordinates(terms);
    const sd = gaugeSeed(model, data);
    const D8 = Math.round(co.D8), A4x2 = Math.round(2 * co.A4), A4 = A4x2 / 2;
    const W2 = Math.round(co.W2), W = W2 / 2;
    const md = (x, n) => ((x % n) + n) % n;
    const odd = md(D8, 2) === 1;
    const A4integral = md(A4x2, 2) === 0;
    const div3 = A4integral ? md(D8 + A4, 3) === 0 : null;
    const mod6 = md(D8 - A4x2 - 3, 6) === 0;
    const w2odd = md(W2, 2) === 1;
    const expectOdd = !sd.seed || sd.seed.parity_of_8D === "odd";
    const parityAsSeed = odd === expectOdd;
    const all = mod6 && w2odd && parityAsSeed && (div3 !== false);
    const seedLabel = sd.seed ? sd.seed.label : "the gauge sector as printed";
    return {
      /* Integers, and the only outputs on this page that carry no normalisation at all. */
      D8: val(D8, { status: STATUS.THEOREM,
                    source: expectOdd
                      ? "8D is an odd integer on this seed -- Part VII Thm 1, Corollary 1"
                      : "8D is an EVEN integer on this seed: the hypothesis of Part VII Thm 1 is " +
                        "not met here, and the theorem says nothing" }),
      A4: val(A4, { status: STATUS.MEASURED,
                    source: A4integral ? "fourth moment of the content"
                                       : "fourth moment of the content -- half-integral on this seed" }),
      W: val(W, { status: STATUS.THEOREM,
                  source: "F(1) - F(0) = (31/16) zeta(5) W, [8]'s criterion summed over the " +
                          "content -- Part VII eq. (34); 2W is odd on either seed, eq. (35)" }),
      coords: val({ A4: co.A4, D8: co.D8, U2: co.U2, V: co.V, W2: co.W2 }, {
        status: STATUS.THEOREM,
        source: "the five complete invariants (A4, 8D, 2U, V, 2W) -- Part VII Thm 3: two contents " +
                "have the same one-loop potential iff they agree on all five",
      }),
      seed: val({ name: sd.name, label: seedLabel, parity_of_8D: expectOdd ? "odd" : "even" }, {
        status: STATUS.MEASURED,
        source: sd.seed && sd.seed.note ? sd.seed.note : "arXiv:2503.04090 eq. (68)",
      }),
      laws: val({ odd, div3, mod6, w2odd, A4integral, expectOdd, parityAsSeed, all }, {
        status: STATUS.THEOREM,
        source: "Part VII Thm 2 and eq. (35) on either seed; Thm 1 conditional on the seed " +
                "(section 13); c^4 = c^2 (mod 3)",
        note: all
          ? `the laws hold, as they must for any content of this class on ${seedLabel}`
          : "IMPOSSIBLE: no bulk content of this model can produce these moments on this seed",
      }),
    };
  },
});

/* ------------------------------------------------------------------ 3. the hierarchy */

export const hierarchyModule = (data) => ({
  id: "hierarchy",
  provides: ["alpha_min", "F_second", "m_h", "invR5", "in_window", "ceiling_fraction", "vacuum"],
  requires: ["moments", "W", "terms"],
  compute({ model, get }) {
    const mo = get("moments").value;
    const W = get("W").value;
    const terms = get("terms").value;
    const c = model.conventions || {};
    const mW = c.m_W, g4 = c.g4, win = c.mh_window;
    const CEIL = physicalCeiling(data);

    /* THE OTHER SYMMETRIC POINT, FIRST -- AND IT IS NOT THE WHOLE STORY.  Whether alpha = 0 is a
     * maximum (D > 0) says nothing about whether the interior minimum is the deepest point.  The
     * sign of W decides, exactly, whether alpha = 0 is deeper than alpha = 1 -- [8]'s criterion,
     * Part VII eq. (34), and the paper says of it precisely "sufficient for the electroweak point
     * to be the deeper one", i.e. deeper than the OTHER SYMMETRIC POINT.  This module used to
     * write `true: W > 0` and label it a theorem about "the true vacuum", which is more than the
     * criterion says: W > 0 is NECESSARY for the small-alpha branch to be the vacuum, not
     * sufficient, because F can have a deeper interior minimum elsewhere.  7(+,+) + 48(+,-) +
     * 84(+,+) is the counterexample an outside audit produced from this page's own tables:
     * W = 5/2 > 0, the branch sits at F = -0.626, and F reaches -1.698 at alpha = 0.566.
     *
     * So the verdict now has two halves, each with its own standing: the symmetric-point half is
     * the theorem; the deepest-point half is MEASURED, by minimising the same F directly on (0,1]
     * -- the sweep already did exactly this and counted such contents as `notGlobal`.  The
     * boolean `true` is the conjunction. */
    const gap = F1minusF0(W);
    const symmetricOK = W > 0;
    let deepest = null, alphaGlobal = null, gapToGlobal = null, aBranch = null;

    const finish = (vacuumExtra) => val({ W, F1_minus_F0: gap, symmetric_ok: symmetricOK,
                                          deepest, alpha_global: alphaGlobal, F_gap_to_global: gapToGlobal,
                                          true: symmetricOK && deepest !== false, ...vacuumExtra }, {
      status: deepest === null ? STATUS.THEOREM : STATUS.VERIFIED,
      source: (symmetricOK
        ? `W = ${W} > 0: F(1) - F(0) = ${gap.toFixed(3)}, so the electroweak point is deeper than ` +
          `the other symmetric point -- [8]'s criterion, Part VII eq. (34); necessary, and 2W odd ` +
          `means never a tie`
        : `W = ${W} < 0: F(1) - F(0) = ${gap.toFixed(3)}, the potential is DEEPER at alpha = 1, ` +
          `and any interior minimum is a false vacuum -- [8]'s criterion, Part VII eq. (34)`) +
        (deepest === null ? "" : deepest
          ? `. And the small-alpha branch IS the deepest point of F on (0, 1], by direct ` +
            `minimisation of the same sum on this render`
          : `. But the small-alpha branch is NOT the deepest point of F: direct minimisation finds ` +
            `alpha = ${alphaGlobal.toFixed(4)} lower by ${(-gapToGlobal).toFixed(3)} -- a false ` +
            `vacuum W alone cannot see`),
    });

    if (!(mo.D > 0)) {
      const why = `D = ${mo.D.toFixed(4)} is not positive: the symmetric point is a minimum, so ` +
                  `there is no electroweak breaking and no vacuum to report`;
      return {
        alpha_min: unknown(why), F_second: unknown(why), m_h: unknown(why, { units: "GeV" }),
        invR5: unknown(why, { units: "GeV" }), in_window: unknown(why),
        ceiling_fraction: unknown(why), vacuum: finish({}),
      };
    }

    const a = alphaMin(mo);
    if (a === null) {
      const why = "the stationarity condition has no small-alpha solution for these moments";
      return {
        alpha_min: unknown(why), F_second: unknown(why), m_h: unknown(why, { units: "GeV" }),
        invR5: unknown(why, { units: "GeV" }), in_window: unknown(why),
        ceiling_fraction: unknown(why), vacuum: finish({}),
      };
    }

    /* the deepest-point half: the same F, minimised directly on (0, 1] */
    aBranch = a;
    const aNum = numericMin(terms, { n: 800, refine: 30, windings: 300 });
    if (aNum !== null) {
      const fBranch = F(terms, a, 300), fNum = F(terms, aNum, 300);
      gapToGlobal = fBranch - fNum;                       /* > 0 means F is lower elsewhere */
      alphaGlobal = aNum;
      deepest = Math.abs(aNum - a) < 0.02 || gapToGlobal <= 1e-6 * Math.max(1, Math.abs(fBranch));
      gapToGlobal = -gapToGlobal;
    }
    const vacuum = finish({ alpha_branch: aBranch });

    const fpp = curvatureAtMin(mo, a);
    const out = {
      vacuum,
      alpha_min: val(a, { status: STATUS.VERIFIED, source: CLOSED_FORM_SOURCE }),
      F_second: val(fpp, { status: STATUS.VERIFIED,
                           source: "Part VII eq. (15); the logarithm cancels at the stationary point" }),
    };

    if (!(fpp > 0)) {
      const why = `F'' = ${fpp.toFixed(4)} at the stationary point: it is not a minimum, so their ` +
                  `eq. (80) returns no real Higgs mass`;
      out.m_h = unknown(why, { units: "GeV" });
      out.invR5 = unknown(why, { units: "GeV" });
      out.in_window = unknown(why);
      out.ceiling_fraction = unknown(why);
      return out;
    }

    /* A false vacuum still has a Higgs mass and a scale AT THE STATIONARY POINT, and they are
     * reported -- labelled.  Hiding them would hide the very content the ceiling's draft version
     * was built on; the reader needs to see the number and the reason it is not a prediction. */
    const falseVac = W < 0 ? "; and this is a FALSE vacuum -- the potential is deeper at alpha = 1" : "";
    const mh = higgsMass(mo, a, mW, g4);
    const R = invR5(a, mW);
    out.m_h = val(mh, { units: "GeV", status: STATUS.MEASURED, source: ANCHOR + falseVac });
    out.invR5 = val(R, { units: "GeV", status: STATUS.MEASURED, source: ANCHOR + falseVac });
    out.in_window = val(mh >= win[0] && mh <= win[1], {
      status: STATUS.MEASURED, source: `the window ${win[0]}-${win[1]} GeV of arXiv:2503.04090`,
    });
    out.ceiling_fraction = val(R / CEIL.GeV, {
      status: STATUS.THEOREM,
      source: `${CEIL.source}; on the seed as printed. A content above it has either a false ` +
              `vacuum or a stationary point that is no minimum`,
    });
    return out;
  },
});

export const modules = (data) => [momentsModule(data), arithmeticModule(data), hierarchyModule(data)];

/* ------------------------------------------------------------------ the sweep
 *
 * THE CLOSED FORM, AGAINST DIRECT MINIMISATION, ON THE WHOLE LATTICE RATHER THAN ON FIVE ROWS.
 *
 * `alpha_min` ships as `verified` on the strength of a check over 272 contents run in Python.  That
 * is somebody else's arithmetic as far as this page is concerned, and five rows is what the page
 * could show.  This runs the check here, in the browser, over every content of at most `maxN`
 * multiplets -- and reports the WORST case, not the median, because a median hides exactly the
 * content where a closed form stops working.
 *
 * WHY IT IS FAST ENOUGH TO BE A BUTTON.  F is linear in the term table, and every term is one of a
 * handful of ATOMS (s, c): the SU(7) tables between them use six.  So the expensive part -- 600
 * windings at every grid point -- depends only on the atom, not on the content, and is computed
 * ONCE for all of them.  Each content is then six dot products.  This is not an approximation and
 * not a speed knob: it is the same sum, factored.  The atoms are read off the data file.
 *
 * The grid only BRACKETS the minimum.  The number that gets compared comes from `numericMin`, the
 * same routine the harness uses, run inside the bracket at the model's own winding truncation --
 * so the reported error is never an artefact of the scan.  And `control` contents are re-minimised
 * over the FULL range as well, so the bracketing itself is something that can be caught being
 * wrong.  [[do-not-ship-a-number-that-comes-from-a-speed-knob]]
 */
export function sweepHierarchy(data, { maxN = 5, grid = 2000, lo = 1e-4, hi = 1,
                                       windings = 600, control = 8, gauge = null } = {}) {
  /* the gauge sector the sweep stands on: the model's seed, or the printed one */
  const GAUGE = gauge || data.gauge;
  /* the slots, in the data file's own order, and the atoms they are made of */
  const slots = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep]))
      slots.push({ rep, key, table: data.reps[rep][key],
                   parities: [1, key[3] === "+" ? 1 : -1] });
  const atoms = [];
  const atomOf = (s, c) => {
    const i = atoms.findIndex((a) => a.s === s && a.c === c);
    return i >= 0 ? i : (atoms.push({ s, c }) - 1);
  };
  const vecOf = (table) => {
    const v = [];
    for (const [m, s, c] of table) { const i = atomOf(s, c); v[i] = (v[i] || 0) + m; }
    return v;
  };
  const gaugeVec = vecOf(GAUGE);
  const slotVecs = slots.map((s) => vecOf(s.table));
  const A = atoms.length;
  const pad = (v) => { const o = new Float64Array(A); v.forEach((x, i) => (o[i] = x || 0)); return o; };
  const GV = pad(gaugeVec), SV = slotVecs.map(pad);

  /* the atoms on the grid: 600 windings each, once, for every content there will ever be */
  const alphas = new Float64Array(grid + 1);
  for (let i = 0; i <= grid; i++) alphas[i] = lo + (hi - lo) * i / grid;
  const BASIS = atoms.map(({ s, c }) => {
    const row = new Float64Array(grid + 1);
    for (let i = 0; i <= grid; i++) {
      let sub = 0;
      for (let n = 1; n <= windings; n++)
        sub += (s > 0 ? 1 : (n % 2 ? -1 : 1)) * Math.cos(n * c * Math.PI * alphas[i]) / n ** 5;
      row[i] = sub;
    }
    return row;
  });

  /* every content of at most maxN multiplets, the empty one excluded */
  const contents = [];
  const mult = new Array(slots.length).fill(0);
  (function rec(i, left) {
    if (i === slots.length) { if (mult.some((m) => m)) contents.push(mult.slice()); return; }
    for (let k = 0; k <= left; k++) { mult[i] = k; rec(i + 1, left - k); }
    mult[i] = 0;
  })(0, maxN);

  const name = (m) => m.map((k, i) => k ? `${k > 1 ? k + "x" : ""}${slots[i].rep}${slots[i].key}` : "")
                       .filter(Boolean).join(" + ");
  const termsOf = (m) => {
    const t = GAUGE.map((x) => x.slice());
    m.forEach((k, i) => { if (k) for (const [q, s, c] of slots[i].table) t.push([q * k, s, c]); });
    return t;
  };

  /* TWO QUESTIONS, AND THE FIRST SWEEP CONFLATED THEM.  Comparing the closed form against "the
   * minimum of F on (0,1]" reported a 96 % error on one content -- and that was not the closed form
   * being wrong.  It solves the stationarity condition on the SMALL-alpha branch; on that content
   * the deepest point of F is somewhere else entirely.  Those are different objects, and a sweep
   * that subtracts one from the other measures neither.  So:
   *
   *   errors        how far the closed form is from the minimum IT is about -- refined locally
   *   notGlobal     contents where that minimum, correct or not, is not the deepest point of F
   *
   * The second is not an error bar.  It is a statement about the model, and it is reported as one.
   */
  /* the slots in the order the multiplicity vectors below use, so a third party can rebuild any
   * content this sweep names without parsing its label */
  const out = { slots: slots.map((s) => ({ rep: s.rep, key: s.key })),
                maxN, contents: contents.length, atoms: A, windings, grid,
                tested: 0, noVacuum: 0, noSolution: 0, notMinimum: 0, atEdge: 0, inWindow: 0,
                notGlobal: 0, notGlobalAt: null,
                worst: 0, worstAt: null, median: 0, points: [] };

  /* THE REGIME THE PAPER IS ABOUT.  `alpha small` is one of the five preconditions, and the five
   * published rows all sit between 0.02 and 0.09.  A worst case taken over contents whose alpha is
   * three times anything published says more about extrapolation than about the closed form, so the
   * sweep reports both, and the boundary is READ off the published rows rather than chosen. */
  /* TWO NUMBERS, AND THEY ARE NOT THE SAME.  The regime boundary must live on the axis the
   * closed form is evaluated on -- OUR alpha -- so it is the largest alpha this engine assigns to
   * their five rows (0.0836).  Their PRINTED maximum is 0.081, and an outside audit caught this
   * sweep calling 0.0836 "the largest alpha their Table 1 reaches", which it is not.  Both are
   * carried now, each named for what it is. */
  let aPub = 0, aPrinted = 0;
  for (const row of data.published_rows || []) {
    if (row.published && row.published.alpha_min) aPrinted = Math.max(aPrinted, row.published.alpha_min);
    const mo = moments(termTable({ bulk: row.bulk }, data));
    if (!(mo.D > 0)) continue;
    const a = alphaMin(mo);
    if (a !== null) aPub = Math.max(aPub, a);
  }
  out.regimeAlphaMax = aPub;              /* ours, on their rows: the boundary the sweep uses */
  out.publishedAlphaMax = aPrinted;       /* theirs, as printed: 0.081 */
  out.worstInRegime = 0;
  out.worstInRegimeAt = null;
  const errors = [];
  const conv = { m_W: 80.4, g4: 0.63, mh_window: [125.0, 127.0] };
  const step = (hi - lo) / grid;
  const vals = new Float64Array(grid + 1);
  const w = new Float64Array(A);
  const tested = [];

  /* the same routine the harness uses, inside a one-cell bracket around a grid index */
  const sharpen = (terms, i) => {
    const r = numericMin(terms, { lo: alphas[i] - step, hi: alphas[i] + step,
                                  n: 4, refine: 30, windings });
    return r === null ? alphas[i] : r;
  };

  for (const m of contents) {
    const terms = termsOf(m);
    const mo = moments(terms);
    if (!(mo.D > 0)) { out.noVacuum++; continue; }
    const a = alphaMin(mo);
    if (a === null) { out.noSolution++; continue; }
    if (!(curvatureAtMin(mo, a) > 0)) { out.notMinimum++; continue; }

    for (let j = 0; j < A; j++) {
      let x = GV[j];
      m.forEach((k, i) => { if (k) x += k * SV[i][j]; });
      w[j] = x;
    }
    let gi = 0;
    for (let i = 0; i <= grid; i++) {
      let y = 0;
      for (let j = 0; j < A; j++) y += w[j] * BASIS[j][i];
      vals[i] = y;
      if (y < vals[gi]) gi = i;
    }
    /* a deepest point against either end is not a minimum of the interval at all */
    if (gi === 0 || gi === grid) { out.atEdge++; continue; }

    /* downhill from where the closed form says it is: the minimum the closed form is ABOUT */
    let li = Math.max(1, Math.min(grid - 1, Math.round((a - lo) / step)));
    while (li > 1 && vals[li - 1] < vals[li]) li--;
    while (li < grid - 1 && vals[li + 1] < vals[li]) li++;

    const anL = sharpen(terms, li);
    const err = Math.abs((a - anL) / anL);
    out.tested++;
    errors.push(err);
    tested.push(m);
    out.points.push({ a, err });
    if (err > out.worst) {
      out.worst = err;
      out.worstAt = { content: name(m), mult: m.slice(), alpha: a, numeric: anL };
    }
    if (a <= aPub && err > out.worstInRegime) {
      out.worstInRegime = err;
      out.worstInRegimeAt = { content: name(m), mult: m.slice(), alpha: a, numeric: anL };
    }

    if (li !== gi) {
      const anG = sharpen(terms, gi);
      out.notGlobal++;
      if (!out.notGlobalAt || Math.abs(anG - anL) > Math.abs(out.notGlobalAt.deepest - out.notGlobalAt.branch))
        out.notGlobalAt = { content: name(m), mult: m.slice(), branch: anL, deepest: anG };
    }

    const mh = higgsMass(mo, a, conv.m_W, conv.g4);
    if (mh !== null && mh >= conv.mh_window[0] && mh <= conv.mh_window[1]) out.inWindow++;
  }

  const mid = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
  out.median = mid(errors);
  /* The paper quotes a median over 272 SYNTHETIC contents spanning twelve values of D -- a
   * constructed set, not this lattice, and the near-coincidence of 272 with the number of contents
   * here is a trap for anyone reading the two side by side.  Split by regime, the two agree: what
   * makes the overall median six times larger is extrapolation past the alpha their table reaches,
   * and saying so is the difference between reproducing a result and contradicting one. */
  out.medianInRegime = mid(out.points.filter((p) => p.a <= aPub).map((p) => p.err));

  /* TWO CONTROLS, AND BOTH CAN FAIL.
   *
   * (a) The factoring is exact or it is nothing.  Six atoms summed with the content's own weights
   *     must reproduce F term by term -- not approximately, to machine precision.  If this drifts,
   *     every number above is about a different function than the one the page draws.
   * (b) The bracket is a hypothesis about where the minimum is, so a sample of tested contents is
   *     re-minimised by the UNMODIFIED routine over the whole range, with no bracket at all. */
  out.control = { factoring: 0, n: 0, worstDisagreement: 0 };
  const probes = [0.02, 0.11, 0.37, 0.5301, 0.83];
  const stride = Math.max(1, Math.floor(tested.length / Math.max(1, control)));
  for (let ci = 0; ci < tested.length; ci += stride) {
    const m = tested[ci], terms = termsOf(m);
    for (let j = 0; j < A; j++) {
      let x = GV[j];
      m.forEach((k, i) => { if (k) x += k * SV[i][j]; });
      w[j] = x;
    }
    for (const al of probes) {
      let y = 0;
      for (let j = 0; j < A; j++) {
        let sub = 0;
        for (let n = 1; n <= windings; n++)
          sub += (atoms[j].s > 0 ? 1 : (n % 2 ? -1 : 1)) *
                 Math.cos(n * atoms[j].c * Math.PI * al) / n ** 5;
        y += w[j] * sub;
      }
      out.control.factoring = Math.max(out.control.factoring, Math.abs(y - F(terms, al, windings)));
    }
    /* the deepest point, found again with no bracket and no basis */
    let gi = 0;
    for (let i = 0; i <= grid; i++) {
      let y = 0;
      for (let j = 0; j < A; j++) y += w[j] * BASIS[j][i];
      vals[i] = y;
      if (y < vals[gi]) gi = i;
    }
    const full = numericMin(terms, { lo, hi, windings });
    if (full === null) continue;
    out.control.n++;
    out.control.worstDisagreement =
      Math.max(out.control.worstDisagreement, Math.abs((sharpen(terms, gi) - full) / full));
  }
  out.control.exact = out.control.factoring < 1e-9;
  out.control.trustworthy = out.control.exact && out.control.n > 0 &&
                            out.control.worstDisagreement < out.worst / 20;
  return out;
}

/* The witness a third party needs to re-check the bound without this tool.  A bound is not a
 * number, it is a number plus a witness. */
export const certificates = (data) => {
  const C = data.ceilings;
  const out = {
    ceiling: {
      claim: `1/R_5 <= ${data.constants.ceiling_GeV} GeV for any bulk content with m_h <= 127 GeV, ` +
             `on the gauge seed as printed (the relaxation's bound)`,
      certified_at: { A4: data.constants.ceiling_A4, "8D": data.constants.ceiling_8D },
      method: "integer program over the multiplet lattice; the relaxation's dual has two variables " +
              "and its vertices were enumerated exactly in rationals",
      check: "ceiling_ilp.py in the Part VII ancillary scripts reproduces every number, and the " +
             "admissible lattice obeys 8D = 2 A_4 + 3 (mod 6)",
    },
  };
  if (C && C.true_vacuum) {
    out.ceiling.note = `its own vertex (${C.relaxation.A4}, ${C.relaxation["8D"]}) is empty; the ` +
                       `attained optimum is ${C.attained.GeV} GeV at (${C.attained.A4}, 1) and ` +
                       `that content sits in a false vacuum`;
    out.true_vacuum_ceiling = {
      claim: `1/R_5 <= ${C.true_vacuum.GeV} GeV for any bulk content whose electroweak point is ` +
             `its true vacuum, m_h in [125, 127] GeV; ${C.measured_mh.GeV} GeV at ` +
             `m_h = ${C.measured_mh.m_h} GeV`,
      attained_at: { A4: C.true_vacuum.A4, "8D": C.true_vacuum["8D"] },
      witness: C.true_vacuum.witness,
      witness_on_exact_potential: C.true_vacuum.exact,
      method: "the same integer program with [8]'s stability functional W > 0 carried as a fourth " +
              "linear condition -- Part VII eq. (36); where the bound is decided W > 0 is necessary " +
              "as well, and the semi-infinite programme generates only that one cut",
      check: "vacuum_constraint.py, necessity_of_W.py and semi_infinite.py in the Part VII " +
             "ancillary scripts",
    };
    out.gauge_seed = {
      claim: `Theorem 1 (8D odd) is conditional on the gauge sector's contribution being odd; ` +
             `on the candidate split of Part VII section 13 the relaxation's ceiling is ` +
             `${data.gauge_seeds.candidate.ceiling_GeV} GeV at 8D = 2, and Theorem 2 and 2W odd hold on both`,
      shift: data.gauge_seeds.shift,
      check: "gauge_ghost_seed.py, ceiling_ilp_coset.py, seed_shift_character.py",
    };
  }
  return out;
};

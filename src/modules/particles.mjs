/* particles.mjs — the falsifiable list: one row per state, and a declared word in every cell.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS FOR.  Everything upstream of here produces potentials, vacua and towers.  None of
 * that is a list of particles somebody can go and look for.  This file is the join: the ladder at
 * the vacuum gives the masses, the Standard-Model cell gives the quantum numbers, the boundary
 * condition gives the parities, and the observables register gives the only verdicts a coupling
 * statement is allowed to carry.  One row per state, and every column either a number or a word
 * that says why there is no number.
 *
 * IT IS A JOIN AND NOT A CALCULATION, deliberately.  `vac5Confront` already says in its own header
 * what it does not pretend: "which massless piece is a quark, whether a state at 1 m_W is coloured,
 * the hypercharges, sin²θ_W — needs the Standard-Model cell at the vacuum, which is the next tool
 * and is not pretended here."  `smCell` is that tool.  Nothing new is computed here; what is new is
 * that the two are put in the same row, which is the form a reader can falsify.
 *
 * TWO COLUMNS ARE OPEN, AND THEY ARE THE TWO THAT MATTER MOST.  They are printed with their reason
 * rather than left out, because a missing column reads as "no such thing":
 *
 *   STABILITY.  A residual parity makes the lightest state carrying it stable, and that is where a
 *   dark-matter candidate would come from.  The mechanism is known in the literature — the KK
 *   parity of the orbifold's reflection, and the accidental Z_2 of a half-periodic field that
 *   Carson-Okada (arXiv:1510.03092) use — but the GENERAL criterion in this instrument's language
 *   is not derived: which subgroup of the space group survives as a symmetry of the vacuum, and how
 *   each letter transforms under it.  That is a derivation with its own gate, not a lookup, and
 *   guessing it would produce a column that looks right and is wrong on half the rows.
 *
 *   WIDTH AND CHANNELS.  The vertex is fixed by the framework itself — gauge and Yukawa are the
 *   same coupling in gauge-Higgs unification, which is the one genuine advantage here — but phase
 *   space, KK-number conservation and its violation at the fixed points have not been done in this
 *   instrument, and a wrong width does not look wrong.  It waits for an anchor: a published width
 *   or lifetime in this class to reproduce first, the way `papers.mjs` anchors everything else.
 *
 * AND "DOES NOT COUPLE" IS NEVER SAID.  Per `observables.mjs`: there is no unobservable in the
 * abstract, only "not distinguished by a declared set of operators at a declared resolution".  So
 * the coupling column is a verdict per (state, operator) PAIR, and today every one of them reads
 * `not-computed` — because no entry in the register has a sourced resolution yet, and each says
 * which paper would give it one.  That is the register's state, printed rather than hidden.
 *
 * D3: no gauge group is named here.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */
import { vac5Frame, vac5Ladder, vac5Confront } from "./vacuum5d.mjs";
import { smCell } from "./smcell.mjs";
import { EXPERIMENT } from "../kernel/experiment.mjs";
import { OBSERVABLES, overlapVerdict } from "../kernel/observables.mjs";

/* The rows, from a boundary condition, a bulk content and a vacuum.
 *
 * `levels` is how many KK levels to list per family; the tower is infinite and a table is not, so
 * the cut is a parameter and is reported rather than assumed. */
export function particleTable(b, content = {}, theta = [], opts = {}) {
  const levels = opts.levels ?? 2;
  const frame = vac5Frame(b, theta);
  const ladder = vac5Ladder(frame, content);
  const confront = vac5Confront(ladder, opts.experiment || EXPERIMENT);
  const cell = smCell(frame, content);
  const invR = confront.located ? confront.invRGeV : null;

  const rows = [];
  for (const r of ladder.rows) {
    const isGauge = r.field === "A_μ" || r.field === "A_y";
    for (const f of r.families) {
      /* THE OFFSET IS THE MASS IN UNITS OF 1/R, and n + x is the level.  An integer family holds
       * both the modes that survive at n = 0 and the ones that start at n = 1: they are different
       * states and they get different rows, because merging them is how a massless count turns
       * into a mass. */
      const starts = [];
      if (f.kind === "integer") {
        if (f.massless > 0) starts.push({ n0: 0, copies: f.massless, note: "even at the fixed points" });
        if (f.odd > 0) starts.push({ n0: 1, copies: f.odd, note: "odd: no zero mode" });
      } else {
        starts.push({ n0: 0, copies: f.towers, note: f.kind === "half" ? "half-integer tower" : "Wilson-line offset" });
      }
      for (const s of starts) {
        for (let n = s.n0; n < s.n0 + levels; n++) {
          const massR = n + f.x;
          if (n === 0 && f.x === 0 && s.n0 !== 0) continue;
          rows.push(makeRow(r, f, s, n, massR, invR, isGauge, cell, frame));
        }
      }
    }
  }
  rows.sort((a, b2) => a.massR - b2.massR);
  return {
    rows, levels, frame, ladder, confront, cell,
    scale: invR === null
      ? { located: false, why: confront.why }
      : { located: true, invRGeV: invR, mWR: ladder.mWR },
    openColumns: OPEN_COLUMNS,
  };
}

/* The two columns that are not computed, with the reason each carries into every row. */
export const OPEN_COLUMNS = {
  stability: {
    verdict: "not-derived",
    why: "a residual parity would make the lightest state carrying it stable, but the general"
      + " criterion — which subgroup of the space group survives as a symmetry of the vacuum, and"
      + " how each letter transforms under it — is not derived in this instrument. The mechanism is"
      + " in the literature (KK parity; the accidental Z_2 of a half-periodic field used by"
      + " Carson-Okada, arXiv:1510.03092); the general rule is not.",
  },
  width: {
    verdict: "not-computed",
    why: "the vertex is fixed by the framework (gauge and Yukawa are one coupling here), but phase"
      + " space, KK-number conservation and its violation at the fixed points are not implemented."
      + " It waits for a published width in this class to reproduce first.",
  },
};

function makeRow(r, f, s, n, massR, invR, isGauge, cell, frame) {
  const massless = massR === 0;
  /* THE KIND IS A READING AND SAYS SO.  "exotic" means the Standard-Model cell did not claim this
   * piece, which is a statement about the cell's assignment and not about the state's nature. */
  let kind;
  if (isGauge && r.field === "A_μ") kind = massless ? "gauge boson (massless)" : "heavy gauge boson";
  else if (isGauge) kind = massless ? "scalar zero mode (A_y: the Higgs candidate)" : "A_y KK mode";
  else kind = massless ? "zero mode" : "KK mode";

  const sm = smIdentity(r, cell);
  return {
    origin: r.field, rep: r.rep, twist: r.twist, copies: s.copies,
    level: n, offset: f.x, family: f.kind, note: s.note,
    massR, massGeV: invR === null ? null : massR * invR,
    kind, massless,
    sm: sm.value, smWhy: sm.why,
    parities: { P5: r.twist[0], P5prime: r.twist[1], P6: null,
                P6why: "this is a five-dimensional model: there is no sixth coordinate to have a"
                  + " parity. The column exists because a six-dimensional model has one." },
    stability: OPEN_COLUMNS.stability,
    width: OPEN_COLUMNS.width,
    couplings: couplingVerdicts(),
  };
}

/* What the Standard-Model cell can say about the piece this row came from, and what it cannot. */
function smIdentity(r, cell) {
  const best = cell && cell.best;
  if (!best) {
    return { value: null,
             why: "the Standard-Model cell was not located at this vacuum"
               + (cell && cell.why ? ": " + cell.why : "") + ", so no SU(3)xSU(2)xY can be read off" };
  }
  if (!best.fixed) {
    return { value: null,
             why: "the cell is located but hypercharge is not fixed (" + best.free + " free"
               + " direction(s)), so Y is a family and not a number" };
  }
  return { value: { assignment: best.assignment, sin2: best.sin2, exotics: best.exotics.length },
           why: null };
}

/* One verdict per (state, operator) pair.  Never "does not couple": the register decides the word,
 * and with no sourced resolution the word is `not-computed` carrying that entry's `missing`. */
function couplingVerdicts() {
  const out = {};
  for (const [key, entry] of Object.entries(OBSERVABLES)) {
    out[key] = overlapVerdict(entry, null);
  }
  return out;
}

/* A reader's one-line summary of what the table can and cannot say — the shape `smShow` has, for
 * the same reason: a section prints a sentence, not a data structure. */
export function particleShow(t) {
  const n = t.rows.length;
  const zero = t.rows.filter((r) => r.massless).length;
  const scale = t.scale.located
    ? "1/R = " + (t.scale.invRGeV / 1000).toFixed(2) + " TeV"
    : "no scale (" + t.scale.why + ")";
  const open = Object.keys(t.openColumns).join(" and ");
  return n + " rows to " + t.levels + " KK levels, " + zero + " of them massless; " + scale
    + "; " + open + " are declared open, and every coupling verdict is `not-computed` because no"
    + " observable in the register has a sourced resolution yet";
}

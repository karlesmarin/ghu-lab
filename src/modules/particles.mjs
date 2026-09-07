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
 * THE TWO HARD COLUMNS ANSWER, AND EACH ANSWERS LESS THAN ITS NAME SUGGESTS.  Both were open when
 * this file was first written; what closed them was narrowing the question until it was one the
 * instrument can settle exactly, and naming what stayed outside:
 *
 *   STABILITY is KK PARITY, and it is two exact conditions.  The reflection y -> piR - y swaps the
 *   two fixed points, so it is a symmetry of the boundary condition exactly when the (+,-) and
 *   (-,+) blocks have the same size; and it sends alpha -> -alpha, so a generic Wilson-line vacuum
 *   BREAKS IT -- the Hosotani mechanism does.  Three verdicts, `none`, `broken-by-vacuum` and
 *   `present`, each reached by a real configuration in the harness.  NOT CHECKED, and said rather
 *   than assumed: at generic alpha the reflection composed with a gauge transformation taking
 *   -alpha back to alpha could still be a symmetry, which needs the twist matrices.  So `present`
 *   licenses "the lightest odd state is a CANDIDATE", never "it is stable": these are necessary
 *   conditions and this file does not ship them as sufficient ones.
 *
 *   WIDTH is the CHANNEL CENSUS, because a rate needs a vertex and phase space and this file has
 *   neither.  What it does instead is the falsifiable half: enumerate the open two-body channels,
 *   imposing only kinematics and KK level, and NOT charge or colour when the Standard-Model cell is
 *   not located -- so the list is an upper bound.  That is the useful direction: AN EMPTY UPPER
 *   BOUND IS A THEOREM.  What remains missing is only the rate, and only that.
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

  /* THE TWO COLUMNS, FILLED.  Both need the whole table, so they are a second pass: KK parity is a
   * property of the content and the vacuum (one verdict, carried by every row, because it is not a
   * per-state fact), and the channel census needs every lighter row to exist first. */
  const parity = kkParity(b, ladder.rows, alphaOf(theta));
  for (const r of rows) {
    r.stability = { ...parity };
    if (parity.verdict === "present") {
      /* only then does a per-state parity exist, and only for the self-paired towers */
      const selfPaired = r.twist[0] === r.twist[1];
      r.stability.kkParity = selfPaired ? (r.level % 2 === 0 ? +1 : -1) : null;
      if (!selfPaired) {
        r.stability.kkParityWhy = "this tower is exchanged with its mirror by the reflection, so a"
          + " single mode of it carries no definite parity; the combinations do.";
      }
    }
    r.width = openChannels(rows, r);
  }

  return {
    rows, levels, frame, ladder, confront, cell, parity,
    scale: invR === null
      ? { located: false, why: confront.why }
      : { located: true, invRGeV: invR, mWR: ladder.mWR },
    openColumns: OPEN_COLUMNS,
  };
}

/* ------------------------------------------------------------------ STABILITY: KK parity
 *
 * WHAT IS ACTUALLY DERIVABLE HERE, and it is less than "which states are stable" and more than
 * nothing.  On S^1/Z_2 the two fixed points are y = 0 and y = pi R, and the reflection
 *
 *     Rf :  y -> pi R - y
 *
 * exchanges them.  It is a symmetry of the GEOMETRY always.  It is a symmetry of the THEORY only
 * if it maps the boundary condition to itself, and it acts on a field's twist by swapping the two
 * parities: (e0, e1) -> (e1, e0).  So the first condition is combinatorial and exact:
 *
 *     the multiset of twists over the whole content must be invariant under (e0,e1) -> (e1,e0)
 *
 * The (+,+) and (-,-) towers are self-paired and their level-n modes pick up (-1)^n, which is KK
 * parity; the (+,-) and (-,+) towers are exchanged, so they must appear in equal numbers or the
 * reflection is not a symmetry at all.
 *
 * THE SECOND CONDITION IS THE VACUUM, AND IT IS THE ONE THAT USUALLY KILLS IT.  The reflection
 * sends A_y -> -A_y, so it sends the Wilson-line phase alpha -> -alpha.  A vacuum at generic alpha
 * is therefore NOT invariant, and KK parity is broken by the Hosotani mechanism itself.  Only the
 * symmetric points survive it: 2*alpha integer.
 *
 * WHAT IS NOT CHECKED, AND IT IS NAMED RATHER THAN ASSUMED.  At generic alpha the reflection could
 * still be a symmetry when COMPOSED with a gauge transformation taking -alpha back to alpha, which
 * exists when the relevant automorphism is inner.  Deciding that needs the twist matrices and is
 * not done here.  So a "broken" verdict below is: broken by the reflection alone, with that
 * loophole stated.  A NECESSARY CONDITION IS NOT A SUFFICIENT ONE and this file does not ship it
 * as one -- when both conditions hold the verdict is "present", and what that licenses is that the
 * lightest odd state is a stability CANDIDATE, not that it is stable.
 */
export function kkParity(b, rows, alpha) {
  /* THE BOUNDARY CONDITION FIRST, AND IT IS THE HALF AN EARLIER VERSION OF THIS FUNCTION MISSED.
   * The asymmetry between the two fixed points lives in the BLOCK SIZES, not in the fields'
   * intrinsic parities: P0 = diag(+1 x nPP+nPM, -1 x nMP+nMM) and P1 = diag(+1 x nPP+nMP, ...).
   * Swapping the fixed points swaps P0 with P1, which exchanges the (+,-) block with the (-,+)
   * one, so the gauge sector is invariant exactly when nPM = nMP.  Reading only the content's
   * (e0,e1) twists -- which is what the first version did -- measures the eta assignment and is
   * blind to this; an SU(3) condition (1,1,0,1) came out "present" when it has no reflection at
   * all. */
  if (b && (b.nPM !== b.nMP)) {
    return { verdict: "none", why: "the reflection y -> piR - y swaps the two fixed points, so it"
      + " exchanges the (+,-) block of the boundary condition with the (-,+) one; here they have"
      + " sizes " + b.nPM + " and " + b.nMP + ", so the reflection is not a symmetry of the"
      + " boundary condition and there is no KK parity." };
  }
  const key = (t) => t[0] + "," + t[1];
  const count = new Map();
  for (const r of rows) count.set(key(r.twist), (count.get(key(r.twist)) || 0) + (r.copies || 1));
  const swapped = [];
  for (const [k, v] of count) {
    const [a, b2] = k.split(",").map(Number);
    const other = count.get(b2 + "," + a) || 0;
    if (v !== other) swapped.push(`(${a},${b2}) appears ${v} times and (${b2},${a}) ${other}`);
  }
  if (swapped.length) {
    return { verdict: "none", why: "the boundary condition is symmetric between the fixed points,"
      + " but the bulk content is not: " + swapped[0] + ". With no residual reflection there is no"
      + " KK parity and nothing is stable by it." };
  }
  const symmetric = Math.abs(2 * alpha - Math.round(2 * alpha)) < 1e-9;
  if (!symmetric) {
    return { verdict: "broken-by-vacuum", why: "the boundary condition IS invariant under the"
      + " reflection, but the reflection sends alpha -> -alpha and this vacuum sits at alpha = "
      + alpha.toPrecision(6) + ", which is not a fixed point (2*alpha is not an integer). KK parity"
      + " is broken by the Hosotani mechanism itself. Not checked: whether composing the reflection"
      + " with a gauge transformation taking -alpha back to alpha restores it, which needs the"
      + " twist matrices." };
  }
  return { verdict: "present", why: "the content is invariant under the reflection that swaps the"
    + " fixed points, and the vacuum sits at a symmetric point, so KK parity survives: a mode of"
    + " level n from a (+,+) or (-,-) tower carries (-1)^n. The lightest odd state is a stability"
    + " CANDIDATE — necessary conditions, not a proof that it is stable." };
}

/* ------------------------------------------------------------------ WIDTHS: the channel census
 *
 * A WIDTH NEEDS A VERTEX AND PHASE SPACE AND THIS FILE HAS NEITHER.  What it can do instead is the
 * half that is falsifiable without them: enumerate the channels that are OPEN, and notice when
 * there are none.
 *
 * The list is deliberately an UPPER BOUND.  Only two things are imposed:
 *
 *     kinematics       m_i > m_j + m_k, on the masses in units of 1/R
 *     KK level         n_i = n_j + n_k, reported separately from the rest, because the orbifold
 *                      fixed points violate KK number and channels that need that violation are
 *                      suppressed rather than forbidden
 *
 * Charge and colour are NOT imposed when the Standard-Model cell is not located at this vacuum,
 * because then the quantum numbers do not exist to impose.  That makes the list too generous, and
 * that is the useful direction: AN EMPTY UPPER BOUND IS A THEOREM.  A state with no kinematically
 * open two-body channel cannot decay to two of the states in this table, whatever the couplings
 * turn out to be, and that is a stability statement that does not depend on the missing physics.
 *
 * What stays open is only the RATE, and the reason is now one line long instead of a paragraph.
 */
export function openChannels(rows, self, opts = {}) {
  const tol = opts.tol ?? 1e-9;
  /* A MASSLESS STATE IS NOT "STABLE BECAUSE NOTHING IS LIGHT ENOUGH", IT IS MASSLESS.  Reporting
   * the two as one word made the first run announce a stable photon-like mode as a finding, which
   * is vacuous: there is nothing below zero to decay to and that says nothing about the model. */
  if (self.massless) {
    return { verdict: "massless", conserving: [], violating: [],
             why: "a massless state has nothing lighter to decay into; that is its mass, not a"
               + " statement about its couplings or about this table." };
  }
  const lighter = rows.filter((r) => r !== self && r.massR < self.massR - tol);
  const conserving = [], violating = [];
  for (let i = 0; i < lighter.length; i++) {
    for (let j = i; j < lighter.length; j++) {
      const a = lighter[i], b = lighter[j];
      if (a.massR + b.massR >= self.massR - tol) continue;
      const ch = { to: [channelLabel(a), channelLabel(b)], massR: a.massR + b.massR };
      if (a.level + b.level === self.level) conserving.push(ch); else violating.push(ch);
    }
  }
  if (!conserving.length && !violating.length) {
    return { verdict: "no-open-channel", conserving, violating,
             why: "no two states in this table are light enough to add up to this one, so it cannot"
               + " decay to a pair of them whatever the couplings are. That is kinematics and it"
               + " does not depend on the vertex — but it is a statement about THIS table: a"
               + " channel into states the table does not carry is not excluded by it." };
  }
  return { verdict: "channels-open", conserving, violating,
           why: conserving.length + " channel(s) conserve KK level and " + violating.length
             + " need the fixed-point violation, which suppresses them rather than forbidding"
             + " them. The list is an upper bound: charge and colour are not imposed"
             + " when the Standard-Model cell is not located. What is still missing for a WIDTH is"
             + " the vertex normalisation and phase space, and only that." };
}

const channelLabel = (r) => r.origin + " n=" + r.level + (r.offset ? " (x=" + r.offset.toFixed(4) + ")" : "");

/* Kept for callers that ask what this table still cannot do; both columns now answer, and what is
 * open is narrower and named. */
export const OPEN_COLUMNS = {
  stability: {
    verdict: "computed",
    why: "KK parity, from the reflection that swaps the two fixed points: exact on the boundary"
      + " condition, and broken by a generic Wilson-line vacuum. The loophole not checked is a"
      + " compensating gauge transformation at generic alpha.",
  },
  width: {
    verdict: "channels-only",
    why: "the open channels are enumerated and an empty list is a stability theorem; the RATE"
      + " needs the vertex normalisation and phase space, which are not implemented.",
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
    /* filled by the second pass in `particleTable`: both need the whole table */
    stability: null,
    width: null,
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
  const stable = t.rows.filter((r) => r.width && r.width.verdict === "no-open-channel").length;
  return n + " rows to " + t.levels + " KK levels, " + zero + " of them massless; " + scale
    + "; KK parity " + t.parity.verdict + "; " + stable + " row(s) with no open two-body channel"
    + " in this table; the rate is still not computed, and every coupling verdict is"
    + " `not-computed` because no observable in the register has a resolution ON THE OVERLAP";
}

/* alpha from the vacuum: one phase on S^1/Z_2, and nothing is guessed when there is none. */
function alphaOf(theta) {
  return Array.isArray(theta) && theta.length ? theta[0] : 0;
}

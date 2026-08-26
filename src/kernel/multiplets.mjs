/* multiplets.mjs -- the layer BELOW the term tables: multiplets, parities, zero modes.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS FOR.  Everywhere else in this app a representation is a term table -- a list of
 * (m, s, c).  That is an aggregate, and it was transcribed.  Here the multiplets themselves are
 * the object: each one carries three Z2 parities, a colour dimension and an SU(2) dimension, and
 * the term table is DERIVED from them.  build/make_data_multiplets.py checks that derivation
 * against the tables the app already ships, representation by representation, and refuses to write
 * the `multiplets` block at all if any of the nine disagree -- so nothing here is quoted.
 *
 * ONE SIGN, TWO CONSEQUENCES.  The combination
 *
 *     s = eta * eta' * P5 * P5'
 *
 * decides both of the things a reader wants to know, and that is not a coincidence -- it is the
 * same pair of Z2 eigenvalues read twice:
 *
 *   - THE POTENTIAL.  s is the sign of the multiplet's winding sum, their eq. (72).
 *   - THE ZERO MODE.  By their eqs. (39)-(40) the 4D parity eigenvalue is +eta*P5 on psi_L and
 *     -eta*P5 on psi_R, and likewise for the primed pair.  A zero mode needs BOTH eigenvalues
 *     +1 on the same chirality, so it exists exactly when eta*P5 and eta'*P5' agree -- that is,
 *     exactly when s = +1 -- and it is left-handed when both are +1, right-handed when both are
 *     -1.  s = -1 means no zero mode at all.
 *
 * So a multiplet that pushes the potential one way is also the one that can carry a chiral
 * fermion, and the app can say which without a second rule.
 *
 * THE CHARGE RULE.  A multiplet of SU(2) dimension r sits at Wilson-line charges c = r-1, r-3,
 * ... down to 1; a c = 0 piece is a constant and drops.  Their eq. (71) writes the r-1 term and
 * the note below it adds "we have to sum the potential from 4 and 2 for 4" -- the same rule, for
 * the one case they needed.  It is implemented in general here because outside this series r > 4
 * occurs, and a tool that only knows r <= 4 is a tool for one paper.
 */

/* ------------------------------------------------------------------ the two rules */

/** c = r-1, r-3, ... > 0 */
export const chargesOf = (r) => {
  const out = [];
  for (let c = r - 1; c > 0; c -= 2) out.push(c);
  return out;
};

/** s = eta*eta'*P5*P5' -- the sign of the winding sum, eq. (72) */
export const signOf = (mult, eta = 1, etap = 1) => eta * etap * mult[2] * mult[3];

/**
 * The zero mode of a multiplet, or null.  Returns "L" | "R" | null.
 * A zero mode exists iff eta*P5 === eta'*P5'; its chirality is the common value.
 */
export function zeroMode(mult, eta = 1, etap = 1) {
  const a = eta * mult[2], b = etap * mult[3];
  if (a !== b) return null;
  return a > 0 ? "L" : "R";
}

/* Field order in the data: [label, P6, P5, P5p, colour, r].
 * ONE object, not six consts: the build inlines every module into a single scope, and
 * `P5` as a top-level name collided on the first build. Six generic names are six
 * collisions waiting; and destructuring MUF at the top of a module would recreate them. */
export const MUF = Object.freeze({ LABEL: 0, P6: 1, P5: 2, P5P: 3, COLOUR: 4, DIM: 5 });

/* ------------------------------------------------------------------ derived quantities */

/**
 * The (m, s, c) table of a representation, DERIVED from its multiplets.
 * `weight(P6)` lets the gauge sector carry its two different weights; omit it for a fermion,
 * where every multiplet weighs 1 (one 6D Dirac multiplet, in this app's convention).
 */
export function termsOf(multiplets, { eta = 1, etap = 1, weight = null, sign = +1 } = {}) {
  const acc = new Map();
  for (const mu of multiplets) {
    const s = weight ? mu[MUF.P5] * mu[MUF.P5P] : signOf(mu, eta, etap);   // gauge has no (eta, eta')
    const w = mu[MUF.COLOUR] * (weight ? weight(mu[MUF.P6]) : 1);
    for (const c of chargesOf(mu[MUF.DIM])) {
      const k = `${s}|${c}`;
      acc.set(k, (acc.get(k) || 0) + sign * w);
    }
  }
  return [...acc.entries()]
    .map(([k, m]) => { const [s, c] = k.split("|").map(Number); return [m, s, c]; })
    .filter(([m]) => Math.abs(m) > 1e-12)
    .sort((a, b) => b[2] - a[2] || b[1] - a[1]);
}

/** Aggregate a term table by channel, so two different bookkeepings compare as potentials. */
export function byChannel(terms) {
  const out = new Map();
  for (const [m, s, c] of terms) {
    const k = `${s}|${c}`;
    out.set(k, (out.get(k) || 0) + m);
  }
  return out;
}

/** Do two term tables describe the same potential? */
export function samePotential(a, b, tol = 1e-9) {
  const A = byChannel(a), B = byChannel(b);
  if (A.size !== B.size) return false;
  for (const [k, v] of A) if (!(Math.abs(v - (B.get(k) ?? NaN)) < tol)) return false;
  return true;
}

/* ------------------------------------------------------------------ the parity cube */

/**
 * The eight corners of (P6, P5, P5') with what sits on each.  This is the data, not a picture of
 * it: three Z2 parities are three binary coordinates, so the multiplets of a representation
 * literally occupy the corners of a cube, and the two P6 faces are the two sectors the gauge
 * sector is written in.
 */
export function cube(multiplets, { eta = 1, etap = 1 } = {}) {
  const corners = [];
  for (const p6 of [-1, +1]) {
    for (const p5 of [-1, +1]) {
      for (const p5p of [-1, +1]) {
        const here = multiplets.filter((mu) => mu[MUF.P6] === p6 && mu[MUF.P5] === p5 && mu[MUF.P5P] === p5p);
        const states = here.reduce((t, mu) => t + mu[MUF.COLOUR] * mu[MUF.DIM], 0);
        const zm = here.length ? zeroMode(here[0], eta, etap) : null;   // same corner, same answer
        corners.push({
          p6, p5, p5p,
          x: (p6 + 1) / 2, y: (p5 + 1) / 2, z: (p5p + 1) / 2,
          multiplets: here,
          states,
          doublets: here.reduce((t, mu) => t + (mu[MUF.DIM] === 2 ? mu[MUF.COLOUR] : 0), 0),
          s: eta * etap * p5 * p5p,
          zeroMode: zm,
          zeroStates: zm ? states : 0,
        });
      }
    }
  }
  return corners;
}

/* ------------------------------------------------------------------ the cancellation */

/**
 * The gauge sector against n copies of one bulk representation, split by P6.
 *
 * This is where the P6 layer pays for itself.  The gauge potential runs over the SAME multiplets
 * as the adjoint -- their eq. (57) serves both -- and differs only in the weight it gives each P6
 * sector.  Feeding a 48 with (eta, eta') = (+, +), whose sign is then P5*P5' exactly like the
 * gauge field's, the periodic halves cancel identically, channel by channel, and the whole of
 * what survives sits in the antiperiodic one.
 *
 * Returns, per sector, the gauge row, the matter row, their sum, and whether the sum vanishes.
 */
export function p6Ledger(gaugeMultiplets, gaugeWeight, matterMultiplets,
                         { eta = 1, etap = 1, n = 1 } = {}) {
  const sectors = [];
  for (const [name, want] of [["periodic", +1], ["antiperiodic", -1]]) {
    const gm = gaugeMultiplets.filter((mu) => mu[MUF.P6] === want);
    const mm = matterMultiplets.filter((mu) => mu[MUF.P6] === want);
    const g = termsOf(gm, { weight: (p6) => gaugeWeight[p6 > 0 ? "periodic" : "antiperiodic"],
                            sign: -1 });
    const m = termsOf(mm, { eta, etap }).map(([w, s, c]) => [w * n, s, c]);
    const sum = termsOf([], {});
    const agg = byChannel([...g, ...m]);
    for (const [k, v] of agg) {
      if (Math.abs(v) < 1e-12) continue;
      const [s, c] = k.split("|").map(Number);
      sum.push([v, s, c]);
    }
    sum.sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    sectors.push({ name, P6: want, gauge: g, matter: m, sum, cancels: sum.length === 0 });
  }
  return sectors;
}

/* Named `channelList`, not `channels`: charges.mjs already owns that name at top level, and the
 * build inlines every module into one scope.  The collision guard caught it on the first build. */
/** Every channel that appears anywhere in a set of tables, in a stable order. */
export function channelList(...tables) {
  const seen = new Map();
  for (const t of tables) for (const [, s, c] of t) seen.set(`${s}|${c}`, [s, c]);
  return [...seen.values()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

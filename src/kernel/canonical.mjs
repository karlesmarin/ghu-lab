/* canonical.mjs — Part VII Theorem 3 as machinery: the five coordinates as a lattice map, the
 * kernel of eq. (42), and the canonical representative of eq. (43).
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Two bulk contents have the same one-loop potential, as a function of the phase, iff they agree
 * on (A4, 8D, 2U, V, 2W) -- Theorem 3.  The content -> coordinates map has a three-dimensional
 * kernel spanned by three relations (eq. (42)), all of whose coefficients are NON-NEGATIVE, so
 * every content has a one-loop-equivalent representative on five types only (eq. (43)) and the
 * semigroup of one-loop potentials is free: S ~ N^5.
 *
 * Nothing numeric is typed here.  The per-multiplet coordinate vectors are computed from the same
 * term tables every other section reads; the relation coefficients are SOLVED from those vectors
 * (integer Cramer, then verified on all five coordinates exactly) rather than copied from the
 * paper; and _test_samepot.mjs holds all of it to lattice_lift.py's archived matrix, to the
 * paper's printed coefficients, and to the exact polylogarithmic potential itself.
 */

import { coordinates, termTable, F } from "./potential.mjs";

export const FIVE_NAMES = ["A₄", "8D", "2U", "V", "2W"];

/* Every slot of a group data file, in the order the shell builds them. */
export function slotOrder(data) {
  const out = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep]))
      out.push({ rep, key, slot: rep + key,
                 parities: [key[1] === "+" ? 1 : -1, key[3] === "+" ? 1 : -1] });
  return out;
}

const slotBulk = (s, n = 1) => {
  const m = s.match(/^(.+?)\((.),(.)\)$/);
  return { rep: m[1], parities: [m[2] === "+" ? 1 : -1, m[3] === "+" ? 1 : -1], multiplicity: n };
};

/* The five coordinates of a content, GAUGE INCLUDED, on the conventions handed in -- the same
 * numbers the arithmetic module prints.  Halves are honest: on the candidate seed A4 is
 * half-integral, so everything is rounded to the half and no further. */
export function fiveOf(data, bulk, conventions = {}) {
  const co = coordinates(termTable({ bulk, conventions }, data));
  return [co.A4, co.D8, co.U2, co.V, co.W2].map((x) => Math.round(2 * x) / 2);
}

/* The MATTER vector of a content: the gauge base point subtracted, so it is a property of the
 * content alone and integral in every entry.  This is the row of lattice_lift.py's matrix. */
export function matterFive(data, bulk) {
  const base = fiveOf(data, []);
  return fiveOf(data, bulk).map((x, i) => Math.round(x - base[i]));
}

/* Solve target = sum x_j basis_j over the integers, exactly: pick coordinate rows where the
 * k x k determinant is non-zero, Cramer, refuse a non-integral ratio, and then verify the
 * candidate on ALL five coordinates -- the overdetermined rows are the check, not decoration. */
export function solveIntegerCombo(basis, target) {
  const k = basis.length;
  const det = (M) => (M.length === 1 ? M[0][0]
    : M.length === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0]
    : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
      - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
      + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]));
  const combos = [];
  const pick = (start, acc) => {
    if (acc.length === k) { combos.push(acc.slice()); return; }
    for (let r = start; r < 5; r++) { acc.push(r); pick(r + 1, acc); acc.pop(); }
  };
  pick(0, []);
  for (const rows of combos) {
    const M = rows.map((r) => basis.map((v) => v[r]));
    const d = det(M);
    if (!d) continue;
    const x = [];
    for (let j = 0; j < k; j++) {
      const Mj = M.map((row, i) => row.map((val, c) => (c === j ? target[rows[i]] : val)));
      const num = det(Mj);
      if (num % d !== 0) { x.length = 0; break; }
      x.push(num / d);
    }
    if (x.length !== k) continue;
    if ([0, 1, 2, 3, 4].every((r) => basis.reduce((s, v, j) => s + x[j] * v[r], 0) === target[r]))
      return x;
  }
  return null;
}

/* THE KERNEL, eq. (42).  The SHAPE of the three relations -- which type expands over which -- is
 * the paper's; the coefficients are solved from the engine's own vectors and verified exactly, so
 * a data file whose numbers moved makes this throw rather than return the old paper. */
export function kernelRelations(data) {
  const vec = {};
  for (const s of slotOrder(data))
    vec[s.slot] = matterFive(data, [slotBulk(s.slot)]);
  const shapes = [
    { lhs: "28(+,+)", basis: ["7(+,+)", "7(+,-)"] },
    { lhs: "48(+,+)", basis: ["7(+,+)", "7(+,-)"] },
    { lhs: "48(+,-)", basis: ["7(+,+)", "7(+,-)", "28(+,-)"] },
  ];
  return shapes.map(({ lhs, basis }) => {
    const x = solveIntegerCombo(basis.map((b) => vec[b]), vec[lhs]);
    if (!x) throw new Error(`the kernel relation for ${lhs} does not solve on this data`);
    if (x.some((c) => c < 0 || !Number.isInteger(c)))
      throw new Error(`the kernel relation for ${lhs} left the physical cone: [${x}]`);
    return { lhs, rhs: basis.map((b, j) => [b, x[j]]).filter(([, c]) => c !== 0) };
  });
}

/* THE CANONICAL FIVE, eq. (43).  Applying the relations rewrites any content onto five types
 * without leaving the cone; the two 84s carry through untouched. */
export const CANON_TYPES = ["7(+,+)", "7(+,-)", "28(+,-)", "84(+,+)", "84(+,-)"];

export function countsOf(bulk) {
  const out = {};
  for (const b of bulk || []) {
    if (!b.multiplicity) continue;
    const slot = `${b.rep}(${b.parities[0] > 0 ? "+" : "-"},${b.parities[1] > 0 ? "+" : "-"})`;
    out[slot] = (out[slot] || 0) + b.multiplicity;
  }
  return out;
}

export function canonicalCounts(counts, rels) {
  const N = {};
  for (const t of CANON_TYPES) N[t] = counts[t] || 0;
  for (const r of rels) {
    const n = counts[r.lhs] || 0;
    if (!n) continue;
    for (const [t, c] of r.rhs) N[t] += n * c;
  }
  return N;
}

export const bulkOfCounts = (counts) =>
  Object.entries(counts).filter(([, n]) => n > 0).map(([slot, n]) => slotBulk(slot, n));

export const sameFive = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* |det| of the five canonical generators: the index [Z^5 : L], which must equal the product of
 * the invariant factors the archived Smith form found.  Cofactor expansion on integers. */
export function latticeIndex(data) {
  const M = CANON_TYPES.map((t) => matterFive(data, [slotBulk(t)]));
  const det = (rows, cols) => {
    if (cols.length === 1) return rows[0][cols[0]];
    let s = 0;
    for (let j = 0; j < cols.length; j++) {
      const minor = det(rows.slice(1), cols.filter((_, jj) => jj !== j));
      s += (j % 2 ? -1 : 1) * rows[0][cols[j]] * minor;
    }
    return s;
  };
  return Math.abs(det(M, [0, 1, 2, 3, 4]));
}

/* The control the section prints beside the theorem: the largest |F_A - F_B| over a grid of the
 * phase.  It is a CHECK on the verdict, never the verdict -- the verdict is the coordinates. */
export function maxPotentialGap(data, bulkA, bulkB, conventions = {}, { n = 60, windings = 400 } = {}) {
  const tA = termTable({ bulk: bulkA, conventions }, data);
  const tB = termTable({ bulk: bulkB, conventions }, data);
  let worst = 0;
  for (let i = 1; i < n; i++) {
    const a = i / n;
    const d = Math.abs(F(tA, a, windings) - F(tB, a, windings));
    if (d > worst) worst = d;
  }
  return worst;
}

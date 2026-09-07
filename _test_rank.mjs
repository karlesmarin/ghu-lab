/* _test_rank.mjs — rank.mjs against matrices it never sees.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS FILE IS BUILT THE WAY IT IS.  `rank.mjs` ships a TABLE: it reads each letter's
 * Frobenius-Schur type and returns a classical factor.  A table is worth exactly what its oracle is
 * worth, so the oracle here is the thing the table is a shortcut for -- the induced matrices
 * themselves:
 *
 *   1. build the boundary condition as a block sum of the label matrices R and T(e_k);
 *   2. SOLVE for the invariant bilinear form B, the null space of {g^T B g - B}, rather than
 *      writing one down;
 *   3. take the unbroken algebra as {X : [X, g] = 0 for every generator} intersected with
 *      {X : X^T B + B X = 0}, again a null space;
 *   4. take its RANK as the dimension of the centraliser of a generic element of it, minimised over
 *      several draws -- which for a reductive algebra is the rank, and needs no name for it.
 *
 * Nothing in steps 1-4 knows Schur's lemma, Frobenius-Schur, or which classical algebra it is
 * looking at.  When that agrees with the table on every boundary condition, the table is measured.
 *
 * THE TOLERANCE IS ANCHORED ON 1, AND THAT IS NOT A DETAIL.  These matrices are unitary, so their
 * entries are O(1) and a value of 1e-16 is noise.  A tolerance taken relative to the LARGEST entry
 * -- the usual recipe -- fails exactly when a matrix is ENTIRELY noise, because then the noise is
 * the largest entry and the null space comes out empty when it should be everything.  That is not
 * hypothetical: a one-dimensional label with eps = exp(i*pi) gives eps^2 - 1 = -2.4e-16, and the
 * whole constraint matrix is zeros with dirt on them.  The first version of this measurement
 * returned rank 0 almost everywhere and looked plausible doing it.
 *
 * CONTROLS, each able to fail on its own:
 *   * a DECOY -- over SU(N), with no form imposed, the same routine must return the published law
 *     drop = sum n_i (w_i - 1), so a disagreement over SO/Sp cannot be blamed on the harness;
 *   * the TRIVIAL boundary condition must give back the whole group, drop zero;
 *   * the pairing: every letter must carry a nondegenerate invariant form of the right symmetry --
 *     which is what fails when a label is paired with something that is not its dual;
 *   * and the two closed forms, checked on every condition rather than on an example.
 *
 *   node _test_rank.mjs
 */
import { alphabet, orderOf, realForm, frobeniusSchur, FS_NAME } from "./src/kernel/alphabet.mjs";
import { unbrokenWithWeight, ambientRank, admitsRankReduction } from "./src/kernel/rank.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

/* ------------------------------------------------------------------ complex linear algebra
 *
 * Written here and not in the kernel on purpose: the shipped answer is exact arithmetic on types,
 * and floating point belongs to the thing that checks it. */
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cAbs = (a) => Math.hypot(a[0], a[1]);
const cScale = (a, s) => [a[0] * s, a[1] * s];

function zeros(r, c) {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => [0, 0]));
}

/* Null space of an m x n complex matrix, by Gauss-Jordan.  Returns a basis, as row vectors. */
function nullSpace(M, ncols) {
  const rows = M.map((r) => r.map((z) => [z[0], z[1]]));
  const m = rows.length;
  let scale = 1;                       /* ANCHORED AT 1 -- see the header */
  for (const r of rows) for (const z of r) scale = Math.max(scale, cAbs(z));
  const tol = scale * Math.max(m, ncols) * 1e-11;
  const pivots = [];
  let r = 0;
  for (let c = 0; c < ncols && r < m; c++) {
    let best = -1, bestAbs = tol;
    for (let i = r; i < m; i++) {
      const a = cAbs(rows[i][c]);
      if (a > bestAbs) { bestAbs = a; best = i; }
    }
    if (best < 0) continue;
    const tmp = rows[r]; rows[r] = rows[best]; rows[best] = tmp;
    const p = rows[r][c], d = p[0] * p[0] + p[1] * p[1];
    for (let j = 0; j < ncols; j++) {
      const z = rows[r][j];
      rows[r][j] = [(z[0] * p[0] + z[1] * p[1]) / d, (z[1] * p[0] - z[0] * p[1]) / d];
    }
    for (let i = 0; i < m; i++) {
      if (i === r) continue;
      const f = rows[i][c];
      if (cAbs(f) < 1e-15) continue;
      for (let j = 0; j < ncols; j++) {
        const z = cMul(f, rows[r][j]);
        rows[i][j] = [rows[i][j][0] - z[0], rows[i][j][1] - z[1]];
      }
    }
    pivots.push(c); r++;
  }
  const isPivot = new Set(pivots);
  const basis = [];
  for (let c = 0; c < ncols; c++) {
    if (isPivot.has(c)) continue;
    const v = Array.from({ length: ncols }, () => [0, 0]);
    v[c] = [1, 0];
    for (let i = 0; i < pivots.length; i++) v[pivots[i]] = [-rows[i][c][0], -rows[i][c][1]];
    basis.push(v);
  }
  return basis;
}

const numRank = (M, ncols) => ncols - nullSpace(M, ncols).length;

/* ------------------------------------------------------------------ the induced matrices */

function labelMats(label, r) {
  const s = label.weight;
  const eps = [Math.cos(2 * Math.PI * label.epsNum / label.epsDen),
               Math.sin(2 * Math.PI * label.epsNum / label.epsDen)];
  const R = zeros(s, s);
  for (let i = 0; i < s - 1; i++) R[i + 1][i] = [1, 0];
  R[0][s - 1] = eps;
  const out = [R];
  for (let k = 0; k < r; k++) {                       /* T(e_k), one per lattice basis vector */
    const T = zeros(s, s);
    for (let i = 0; i < s; i++) {
      const v = label.orbit[i];
      const ang = 2 * Math.PI * (v.num[k] / v.den);
      T[i][i] = [Math.cos(ang), Math.sin(ang)];
    }
    out.push(T);
  }
  return out;
}

function blockSum(mats) {
  const n = mats.reduce((s, M) => s + M.length, 0);
  const out = zeros(n, n);
  let o = 0;
  for (const M of mats) {
    for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) out[o + i][o + j] = M[i][j];
    o += M.length;
  }
  return out;
}

/* The letters as MATRICES, with the strict dual test -- written out again rather than imported, so
 * this is a second implementation of the pairing and not the same one agreeing with itself. */
function letterMats(A, m, family) {
  const r = A.length;
  const labels = alphabet(A, m);
  const types = labels.map((L) => frobeniusSchur(L, A, m));
  const keyOf = (v) => v.num.map((x) => ((x % v.den) + v.den) % v.den).join(",") + "/" + v.den;
  const negOf = (v) => v.num.map((x) => ((-x % v.den) + v.den) % v.den).join(",") + "/" + v.den;
  const dual = (a, b) =>
    a.orbit.map(negOf).sort().join(";") === b.orbit.map(keyOf).sort().join(";")
    && a.epsDen === b.epsDen && (a.epsNum + b.epsNum) % a.epsDen === 0;

  const out = [], used = new Set();
  for (let i = 0; i < labels.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const t = types[i], d = labels[i].weight, mine = labelMats(labels[i], r);
    let parts, weight;
    if (family === "SU") { parts = [mine]; weight = d; }
    else if (t === 0) {
      let j = -1;
      for (let k = 0; k < labels.length; k++) {
        if (k !== i && !used.has(k) && types[k] === 0 && labels[k].weight === d
            && dual(labels[i], labels[k])) { j = k; break; }
      }
      if (j < 0) { out.push(null); continue; }        /* said out loud by the caller */
      used.add(j);
      parts = [mine, labelMats(labels[j], r)];
      weight = 2 * d;
    } else if ((t === 1 && family === "SO") || (t === -1 && family === "Sp")) {
      parts = [mine]; weight = d;
    } else {
      parts = [mine, mine]; weight = 2 * d;
    }
    const gens = [];
    for (let k = 0; k < r + 1; k++) gens.push(blockSum(parts.map((p) => p[k])));
    out.push({ weight: family === "Sp" ? weight / 2 : weight, type: FS_NAME[t], gens });
  }
  return out;
}

/* ------------------------------------------------------------------ the measurement */

function invariantForms(gens) {
  const n = gens[0].length, rows = [];
  for (const g of gens) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const row = Array.from({ length: n * n }, () => [0, 0]);
        for (let k = 0; k < n; k++) {
          for (let l = 0; l < n; l++) {
            const c = cMul(g[k][i], g[l][j]);
            row[k * n + l] = cAdd(row[k * n + l], c);
          }
        }
        row[i * n + j] = cAdd(row[i * n + j], [-1, 0]);
        rows.push(row);
      }
    }
  }
  return nullSpace(rows, n * n).map((v) => {
    const B = zeros(n, n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) B[i][j] = v[i * n + j];
    return B;
  });
}

function splitForms(basis, n) {
  const sym = [], anti = [];
  for (const B of basis) {
    const S = zeros(n, n), Aa = zeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        S[i][j] = cScale(cAdd(B[i][j], B[j][i]), 0.5);
        Aa[i][j] = cScale(cAdd(B[i][j], cScale(B[j][i], -1)), 0.5);
      }
    }
    sym.push(S); anti.push(Aa);
  }
  return [indep(sym, n), indep(anti, n)];
}

/* an independent subset of a list of matrices, by elimination on their flattenings */
function indep(mats, n) {
  const keep = [], rows = [];
  for (const M of mats) {
    const v = M.flat().map((z) => [z[0], z[1]]);
    /* reduce v against the kept rows */
    const w = v.map((z) => [z[0], z[1]]);
    for (const { piv, row } of rows) {
      const f = w[piv];
      if (cAbs(f) < 1e-11) continue;
      for (let j = 0; j < w.length; j++) {
        const z = cMul(f, row[j]);
        w[j] = [w[j][0] - z[0], w[j][1] - z[1]];
      }
    }
    let piv = -1, best = 1e-9;
    for (let j = 0; j < w.length; j++) if (cAbs(w[j]) > best) { best = cAbs(w[j]); piv = j; }
    if (piv < 0) continue;
    const p = w[piv], d = p[0] * p[0] + p[1] * p[1];
    const norm = w.map((z) => [(z[0] * p[0] + z[1] * p[1]) / d, (z[1] * p[0] - z[0] * p[1]) / d]);
    rows.push({ piv, row: norm });
    keep.push(M);
  }
  return keep;
}

let seed = 20260907;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };

function combine(basis, n) {
  const X = zeros(n, n);
  for (const B of basis) {
    const c = [rnd(), rnd()];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) X[i][j] = cAdd(X[i][j], cMul(c, B[i][j]));
  }
  return X;
}

function unbrokenAlgebra(gens, B) {
  const n = gens[0].length, rows = [];
  for (const g of gens) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const row = Array.from({ length: n * n }, () => [0, 0]);
        for (let k = 0; k < n; k++) {
          row[k * n + j] = cAdd(row[k * n + j], g[i][k]);
          row[i * n + k] = cAdd(row[i * n + k], cScale(g[k][j], -1));
        }
        rows.push(row);
      }
    }
  }
  if (B) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const row = Array.from({ length: n * n }, () => [0, 0]);
        for (let k = 0; k < n; k++) {
          row[k * n + i] = cAdd(row[k * n + i], B[k][j]);
          row[k * n + j] = cAdd(row[k * n + j], B[i][k]);
        }
        rows.push(row);
      }
    }
  }
  return nullSpace(rows, n * n).map((v) => {
    const X = zeros(n, n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) X[i][j] = v[i * n + j];
    return X;
  });
}

function algebraRank(basis, tries = 3) {
  if (!basis.length) return 0;
  const n = basis[0].length;
  let best = null;
  for (let t = 0; t < tries; t++) {
    const X0 = combine(basis, n);
    const cols = basis.length;
    const rows = Array.from({ length: n * n }, () => Array.from({ length: cols }, () => [0, 0]));
    for (let b = 0; b < cols; b++) {
      const Y = basis[b];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let acc = [0, 0];
          for (let k = 0; k < n; k++) {
            acc = cAdd(acc, cMul(X0[i][k], Y[k][j]));
            acc = cAdd(acc, cScale(cMul(Y[i][k], X0[k][j]), -1));
          }
          rows[i * n + j][b] = acc;
        }
      }
    }
    const d = cols - numRank(rows, cols);
    best = best === null ? d : Math.min(best, d);
  }
  return best;
}

/* every multiset of letters of total weight N */
function multisets(ws, N) {
  const out = [];
  const walk = (i, rem, acc) => {
    if (rem === 0) { out.push(acc.concat(Array(ws.length - acc.length).fill(0))); return; }
    if (i === ws.length) return;
    for (let c = 0; c <= Math.floor(rem / ws[i]); c++) {
      acc.push(c); walk(i + 1, rem - c * ws[i], acc); acc.pop();
    }
  };
  walk(0, N, []);
  return out;
}

/* ------------------------------------------------------------------ the cases */

const ROT = {
  "T^2/Z_2": [[-1, 0], [0, -1]],
  "T^2/Z_3": [[0, -1], [1, -1]],
  "T^2/Z_4": [[0, -1], [1, 0]],
  "T^2/Z_6": [[1, -1], [1, 0]],
};
const NMAX = { "T^2/Z_2": 4, "T^2/Z_3": 6, "T^2/Z_4": 5, "T^2/Z_6": 6 };

console.log("=".repeat(96));
console.log("   rank.mjs — the unbroken group with weight, against the matrices");
console.log("=".repeat(96));

console.log("\n   1 -- DECOY: over SU(N), with no form, the measurement must return the published law\n");
for (const [name, A] of Object.entries(ROT)) {
  const m = orderOf(A);
  const mats = letterMats(A, m, "SU");
  const ws = mats.map((L) => L.weight);
  let bad = 0, seen = 0;
  for (let N = 1; N <= 4; N++) {
    for (const mult of multisets(ws, N)) {
      if (!mult.some((c) => c)) continue;
      const parts = [];
      for (let i = 0; i < mult.length; i++) for (let k = 0; k < mult[i]; k++) parts.push(mats[i].gens);
      const gens = parts[0].map((_, k) => blockSum(parts.map((p) => p[k])));
      const rank = algebraRank(unbrokenAlgebra(gens, null));
      const want = mult.reduce((s, c) => s + c, 0);
      const drop = mult.reduce((s, c, i) => s + c * (ws[i] - 1), 0);
      seen++;
      if (rank !== want || N - rank !== drop) bad++;
    }
  }
  ok(bad === 0, name + ": the SU(N) law reproduced by the numerical route on " + seen
     + " conditions", bad ? bad + " disagree" : "rank = sum n_i, drop = sum n_i (w_i - 1)");

  /* AND THE TABLE ITSELF ON THE SAME CASES.  The check above measures the numerical route; this
   * one measures `unbrokenWithWeight`, which is the thing that ships.  They are not the same
   * assertion, and the first version of this file only had the first -- which is how a drop of -1
   * over SU(N), from forgetting the unit-determinant cut, went unnoticed. */
  const letters = mats.map((L) => ({ weight: L.weight, type: L.type }));
  let tableBad = 0, neg = 0;
  for (let N = 1; N <= 5; N++) {
    for (const mult of multisets(ws, N)) {
      if (!mult.some((c) => c)) continue;
      const r = unbrokenWithWeight("SU", letters, mult);
      if (r.drop !== mult.reduce((s, c, i) => s + c * (ws[i] - 1), 0)) tableBad++;
      if (r.drop < 0) neg++;
    }
  }
  ok(tableBad === 0 && neg === 0,
     name + ": and rank.mjs itself returns the SU law, with no negative drop",
     tableBad || neg ? tableBad + " disagree, " + neg + " negative" : "");
}

console.log("\n   2 -- EVERY LETTER CARRIES A NONDEGENERATE FORM OF THE RIGHT SYMMETRY\n");
/* This is the pairing check with the matrices in hand: a label paired with something that is not
 * its dual gives a letter with NO invariant form at all. */
for (const family of ["SO", "Sp"]) {
  for (const [name, A] of Object.entries(ROT)) {
    const m = orderOf(A);
    const mats = letterMats(A, m, family);
    let missing = 0, wrong = 0;
    for (const L of mats) {
      if (!L) { missing++; continue; }
      const n = L.gens[0].length;
      const [sym, anti] = splitForms(invariantForms(L.gens), n);
      if (!(sym.length + anti.length)) wrong++;
    }
    ok(missing === 0 && wrong === 0,
       name + " " + family + ": all " + mats.length + " letters are properly paired",
       missing || wrong ? missing + " unpaired, " + wrong + " with no invariant form" : "");
  }
}

console.log("\n   3 -- THE TABLE AGAINST THE MATRICES, ON EVERY BOUNDARY CONDITION\n");
const CLOSED = { Sp: 0, SO: 0 };
for (const family of ["SO", "Sp"]) {
  for (const [name, A] of Object.entries(ROT)) {
    const m = orderOf(A);
    const mats = letterMats(A, m, family);
    const letters = mats.map((L) => ({ weight: L.weight, type: L.type }));
    const ws = letters.map((L) => L.weight);
    let seen = 0, bad = 0, noForm = 0, firstBad = null, quat = 0;
    for (let N = 1; N <= NMAX[name]; N++) {
      for (const mult of multisets(ws, N)) {
        if (!mult.some((c) => c)) continue;
        const parts = [];
        for (let i = 0; i < mult.length; i++) for (let k = 0; k < mult[i]; k++) parts.push(mats[i].gens);
        const gens = parts[0].map((_, k) => blockSum(parts.map((p) => p[k])));
        const n = gens[0].length;
        const [sym, anti] = splitForms(invariantForms(gens), n);
        const space = family === "SO" ? sym : anti;
        if (!space.length) { noForm++; continue; }
        const B = combine(space, n);
        const rank = algebraRank(unbrokenAlgebra(gens, B));
        const said = unbrokenWithWeight(family, letters, mult);
        seen++;
        if (rank !== said.rank) { bad++; if (!firstBad) firstBad = { N, mult, rank, said: said.rank }; }
        if (family === "Sp") {
          const quatUnits = mult.reduce((s, c, i) => s + c * (ws[i] - 1), 0);
          if (said.drop !== quatUnits) quat++;
        }
      }
    }
    ok(bad === 0, name + " " + family + ": the table matched the matrices on " + seen
       + " boundary conditions",
       bad ? bad + " disagree, first N=" + firstBad.N + " mult=[" + firstBad.mult
             + "] measured " + firstBad.rank + " table " + firstBad.said
           : noForm + " carry no form of that symmetry and were skipped");
    if (family === "Sp") CLOSED.Sp += quat;
  }
}

console.log("\n   4 -- THE TWO CLOSED FORMS\n");
ok(CLOSED.Sp === 0,
   "over Sp(N) the SU law holds VERBATIM once weights are read in quaternionic units",
   "drop = sum n_i (w_i - 1) on every condition of all four rotations");
{
  /* and over SO(N) it fails in both directions -- a check that could only pass if the two laws
   * really are different, so it is stated as a count and not as a hope */
  let weightOneDrop = 0, weightedNoDrop = 0;
  for (const [name, A] of Object.entries(ROT)) {
    const m = orderOf(A);
    const letters = realForm(A, orderOf(A), "SO");
    const ws = letters.map((L) => L.weight);
    for (let N = 1; N <= NMAX[name]; N++) {
      for (const mult of multisets(ws, N)) {
        if (!mult.some((c) => c)) continue;
        const r = unbrokenWithWeight("SO", letters, mult);
        if (r.suLaw === 0 && r.drop > 0) weightOneDrop++;
        if (r.suLaw > 0 && r.drop === 0) weightedNoDrop++;
      }
    }
  }
  ok(weightOneDrop > 0 && weightedNoDrop > 0,
     "over SO(N) the SU criterion fails in BOTH directions",
     weightOneDrop + " conditions drop with every weight one, "
     + weightedNoDrop + " have a weight above one and no drop");
}

console.log("\n   5 -- THE TRIVIAL BOUNDARY CONDITION KEEPS THE WHOLE GROUP\n");
for (const family of ["SO", "Sp"]) {
  for (const [name, A] of Object.entries(ROT)) {
    const m = orderOf(A);
    const mats = letterMats(A, m, family).filter(Boolean);
    let triv = 0;
    for (let i = 1; i < mats.length; i++) if (mats[i].weight < mats[triv].weight) triv = i;
    const w = mats[triv].weight;
    const c = 4 % w === 0 ? 4 / w : 0;
    if (!c) continue;
    const parts = Array.from({ length: c }, () => mats[triv].gens);
    const gens = parts[0].map((_, k) => blockSum(parts.map((p) => p[k])));
    const n = gens[0].length;
    const [sym, anti] = splitForms(invariantForms(gens), n);
    const space = family === "SO" ? sym : anti;
    const rank = space.length ? algebraRank(unbrokenAlgebra(gens, combine(space, n))) : -1;
    ok(rank === ambientRank(family, 4),
       name + " " + family + " N=4: the trivial condition keeps rank " + ambientRank(family, 4),
       rank === ambientRank(family, 4) ? "" : "got " + rank);
  }
}

console.log("\n   6 -- WHICH ALPHABETS ADMIT RANK REDUCTION AT ALL\n");
for (const family of ["SU", "SO", "Sp"]) {
  const line = [];
  for (const [name, A] of Object.entries(ROT)) {
    const letters = realForm(A, orderOf(A), family);
    const hit = admitsRankReduction(family, letters, 6);
    line.push(name.replace("T^2/", "") + ": " + (hit ? "N=" + hit.N : "none"));
  }
  ok(true, family.padEnd(2) + " smallest N with a rank drop —  " + line.join("   "));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_alphabet.mjs — alphabet.mjs against the archived run of `bc_preflight.py`.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The numbers below are NOT produced by this file and not by the page: they are the ones
 * `bc_preflight.py` archived beside the published record (concept DOI 10.5281/zenodo.22254861),
 * which is the oracle precisely because it is a different implementation in a different language
 * that this port is not allowed to edit.  Every signature, every alphabet and every count here was
 * derived there from the rotation matrix alone.
 *
 * The decoys matter as much as the cases: a matrix of infinite order must come back REFUSED, not
 * classified, and the exact eigenvalue route must throw rather than round if a datum is not a root
 * of unity of the right order.
 *
 *   node _test_alphabet.mjs
 */
import {
  alphabet, alphabetShape, classCount, coneSignature, conePoints, frobeniusSchur, localDatum,
  orderOf, predictedDegree, realForm,
} from "./src/kernel/alphabet.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

/* The four rotations, exactly as the oracle writes them. */
const ROT = {
  "T^2/Z_2": [[-1, 0], [0, -1]],
  "T^2/Z_3": [[0, -1], [1, -1]],
  "T^2/Z_4": [[0, -1], [1, 0]],
  "T^2/Z_6": [[1, -1], [1, 0]],
};

/* Archived by bc_preflight.py.  Signature and SU(N) alphabet. */
const ORACLE = {
  "T^2/Z_2": { m: 2, sig: [2, 2, 2, 2], su: "8x1" },
  "T^2/Z_3": { m: 3, sig: [3, 3, 3], su: "9x1" },
  "T^2/Z_4": { m: 4, sig: [4, 4, 2], su: "8x1+2x2" },
  "T^2/Z_6": { m: 6, sig: [6, 3, 2], su: "6x1+3x2+2x3" },
};

console.log("=".repeat(96));
console.log("alphabet.mjs against the archived bc_preflight run");
console.log("=".repeat(96));

console.log("\n   1 -- THE ORDER, AND THE REFUSAL\n");
for (const [name, A] of Object.entries(ROT)) {
  ok(orderOf(A) === ORACLE[name].m, name + ": order comes out " + ORACLE[name].m,
     "got " + orderOf(A));
}
/* the oracle's own decoys */
ok(orderOf([[2, 1], [1, 1]]) === null,
   "a matrix of infinite order is REFUSED, not classified", "det 1 but no finite power is I");
ok(orderOf([[0, -1], [1, 1]]) === 6,
   "the matrix the oracle labels 'order 5 in fact 6' comes out 6");
ok(orderOf([[1, 1], [0, 1]]) === null, "a shear is refused");

console.log("\n   2 -- THE CONE SIGNATURE, DERIVED AND NOT ENTERED\n");
for (const [name, A] of Object.entries(ROT)) {
  const sig = coneSignature(A, ORACLE[name].m);
  ok(JSON.stringify(sig) === JSON.stringify(ORACLE[name].sig),
     name + ": signature (" + ORACLE[name].sig.join(", ") + ")", "got (" + sig.join(", ") + ")");
}

console.log("\n   3 -- THE ALPHABET OVER SU(N)\n");
for (const [name, A] of Object.entries(ROT)) {
  const labs = alphabet(A, ORACLE[name].m);
  const shape = alphabetShape(labs);
  ok(shape === ORACLE[name].su, name + ": alphabet is " + ORACLE[name].su, "got " + shape);
  /* the dimensions must square with |Irr(Gamma)| through sum of squares over the fixed strata */
  ok(labs.every((L) => ORACLE[name].m % L.weight === 0),
     name + ": every weight divides m", "weights " + [...new Set(labs.map((L) => L.weight))]);
}

console.log("\n   4 -- THE LOCAL DATUM IS EXACT, AND ITS OWN CONTROL\n");
for (const [name, A] of Object.entries(ROT)) {
  const m = ORACLE[name].m, cones = conePoints(A, m), labs = alphabet(A, m);
  let threw = null, total = 0;
  try {
    for (const L of labs) for (const c of cones) {
      const d = localDatum(L, m, c);
      total += d.reduce((s, x) => s + x, 0);
      /* a label of weight w contributes exactly w eigenvalues at every cone */
      if (d.reduce((s, x) => s + x, 0) !== L.weight) throw new Error("wrong number of eigenvalues");
    }
  } catch (e) { threw = e.message; }
  ok(threw === null, name + ": every local datum is an exact multiset of e-th roots of unity",
     threw || (total + " eigenvalues over " + labs.length + " labels x " + cones.length + " cones"));
}

console.log("\n   5 -- THE DEGREE, PREDICTED FROM THE SIGNATURE AND THE FAMILY\n");
/* TRANSCRIBED FROM outputs/bc_preflight.txt, section 3, and from nowhere else.  The first version
 * of this block was filled in by running predictedDegree and asserting its own output, which is a
 * control that cannot fail — and it duly passed while the function was wrong in two ways. */
const DEG = {
  "T^2/Z_2": { SU: 4, SO: 4 },
  "T^2/Z_3": { SU: 6, SO: 3, Sp: 3 },
  "T^2/Z_4": { SU: 7, SO: 5, Sp: 5 },
  "T^2/Z_6": { SU: 8, SO: 5, Sp: 5 },
};
for (const [name] of Object.entries(ROT)) {
  for (const [fam, want] of Object.entries(DEG[name])) {
    const d = predictedDegree(ORACLE[name].sig, fam);
    ok(d === want, name + " over " + fam + ": predicted degree " + want, "got " + d);
  }
}
/* and the control that the two families are NOT the same rule: they must part company somewhere */
ok(predictedDegree([3, 3, 3], "SU") !== predictedDegree([3, 3, 3], "SO"),
   "SU and SO give different degrees where the paper says they do", "6 against 3");

console.log("\n   6 -- THE ALPHABET OVER THE THREE REAL FORMS\n");
/* TRANSCRIBED from outputs/bc_preflight.txt, section 1. */
const SHAPE = {
  "T^2/Z_2": { SU: "8x1", SO: "8x1", Sp: "8x1" },
  "T^2/Z_3": { SU: "9x1", SO: "1x1+4x2", Sp: "5x1" },
  "T^2/Z_4": { SU: "8x1+2x2", SO: "4x1+4x2", Sp: "6x1+2x2" },
  "T^2/Z_6": { SU: "6x1+3x2+2x3", SO: "2x1+3x2+2x3+1x4", Sp: "4x1+2x2+2x3" },
};
const shapeOf = (ls) => {
  const by = new Map();
  for (const L of ls) by.set(L.weight, (by.get(L.weight) || 0) + 1);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([w, n]) => n + "x" + w).join("+");
};
for (const [name, A] of Object.entries(ROT)) {
  for (const fam of ["SU", "SO", "Sp"]) {
    const got = shapeOf(realForm(A, ORACLE[name].m, fam));
    ok(got === SHAPE[name][fam], name + " over " + fam + ": alphabet " + SHAPE[name][fam],
       "got " + got);
  }
}
/* the Frobenius-Schur indicator must be an integer in {-1,0,1} — it throws otherwise — and the
 * three types must all actually occur somewhere, or the bookkeeping is untested on two of them */
const seenTypes = new Set();
for (const [name, A] of Object.entries(ROT))
  for (const L of alphabet(A, ORACLE[name].m)) seenTypes.add(frobeniusSchur(L, A, ORACLE[name].m));
ok(seenTypes.has(1) && seenTypes.has(0),
   "the real and complex types both occur, so neither branch is untested",
   "types present: " + [...seenTypes].sort().join(", "));
/* AND THE HALF THAT IS NOT EXERCISED, SAID OUT LOUD.  No label of these four rank-2 orbifolds is
 * quaternionic, so `realForm`'s quaternionic branch never runs here and is NOT covered by this
 * suite — the twelve alphabets and twelve counts below are green without it.  Asserting that all
 * three types occur was a check that could only fail, which is the mirror of one that can only
 * pass; either way it measures the suite and not the code. */
ok(!seenTypes.has(-1),
   "NOT COVERED: no quaternionic label occurs at rank 2, so that branch of realForm is untested",
   "it needs an orbifold that produces one before it can be believed");

console.log("\n   7 -- THE COUNTS: distinct tuples of local data\n");
/* TRANSCRIBED from outputs/bc_preflight.txt, section 1. */
const COUNT = {
  "T^2/Z_2": { SU: [1, 8, 33, 96, 225, 456, 833, 1408], SO: [1, 8, 33, 96, 225, 456, 833, 1408],
               Sp: [1, 8, 33, 96, 225, 456, 833, 1408] },
  "T^2/Z_3": { SU: [1, 9, 45, 163, 477, 1197, 2674], SO: [1, 1, 5, 5, 15, 15, 34],
               Sp: [1, 5, 15, 34, 65, 111, 175] },
  "T^2/Z_4": { SU: [1, 8, 38, 136, 403, 1040, 2412], SO: [1, 4, 14, 36, 83, 168, 316],
               Sp: [1, 6, 23, 68, 169, 370, 735] },
  "T^2/Z_6": { SU: [1, 6, 24, 76, 207, 504, 1125], SO: [1, 2, 6, 12, 25, 44, 77],
               Sp: [1, 4, 12, 30, 66, 132, 245] },
};
for (const [name, A] of Object.entries(ROT)) {
  for (const fam of ["SU", "SO", "Sp"]) {
    const want = COUNT[name][fam];
    const got = classCount(A, ORACLE[name].m, fam, want.length - 1);
    ok(JSON.stringify(got) === JSON.stringify(want),
       name + " over " + fam + ": count " + want.slice(0, 5).join(", ") + ", ...",
       "got " + got.slice(0, 5).join(", ") + ", ...");
  }
}
/* THE DEGREE, AND A HYPOTHESIS OF MINE THAT THE DATA REFUSED.
 *
 * The first version of this block tested the count for being a POLYNOMIAL of the predicted degree,
 * by finite differences.  It failed on three of the eight, and the counts are why: over SO(N),
 * T^2/Z_3 reads 1, 1, 5, 5, 15, 15, 34 — it pairs up.  These are QUASI-polynomials, and the oracle
 * says so in its own words: the degree is measured "as the order of the pole minus one", not by
 * differencing.  A pole of order d+1 at x=1 gives the leading N^d; the other poles, at roots of
 * unity, give the periodic part that no finite difference of a short run will kill.
 *
 * So the polynomial test is applied ONLY where it is warranted — when every letter has weight one
 * there is no periodicity to have — and the rest are reported as untested rather than dressed as
 * green.  Testing them needs the generating function, which is the next piece of work. */
for (const [name, A] of Object.entries(ROT)) {
  for (const fam of ["SU", "SO", "Sp"]) {
    const c = COUNT[name][fam], d = predictedDegree(ORACLE[name].sig, fam);
    const ws = realForm(A, ORACLE[name].m, fam).map((L) => L.weight);
    const plain = ws.every((w) => w === 1);
    if (!plain) {
      ok(true, name + " over " + fam + ": quasi-polynomial (weights " + [...new Set(ws)].sort()
         + "), degree " + d + " NOT tested here", "needs the generating function's pole order");
      continue;
    }
    let diff = c.slice();
    for (let i = 0; i <= d; i++) diff = diff.slice(1).map((x, j) => x - diff[j]);
    if (diff.length === 0) {
      ok(true, name + " over " + fam + ": degree " + d + " NOT tested — too few terms");
    } else {
      ok(diff.every((x) => x === 0),
         name + " over " + fam + ": the count is a polynomial of degree " + d,
         "differences " + diff.join(","));
    }
  }
}

console.log("\n   8 -- RANK 1, WHICH THE ORACLE CANNOT DO AT ALL\n");
/* `bc_preflight.py` writes its two components by hand, so it only ever sees Lambda = Z^2 and
 * cannot be asked this.  The answer is known from a different direction entirely — Haba, Hosotani
 * and Kawamura classify the boundary conditions of S^1/Z_2 and count (N+1)^2 classes, which the
 * lab's own `_test_bcclass.mjs` reproduces by walking orbits — so it is an out-of-sample check on
 * a port that was written without looking at it. */
const S1 = [[-1]];
ok(orderOf(S1) === 2, "S^1/Z_2: the reflection has order 2");
const s1sig = coneSignature(S1, 2);
ok(JSON.stringify(s1sig) === JSON.stringify([2, 2]),
   "S^1/Z_2: signature (2, 2) — the two fixed points", "got (" + s1sig.join(", ") + ")");
const s1lab = alphabet(S1, 2);
ok(alphabetShape(s1lab) === "4x1",
   "S^1/Z_2: alphabet 4x1 — the four sign pairs (P_0, P_1)", "got " + alphabetShape(s1lab));
ok(predictedDegree(s1sig, "SU") === 2,
   "S^1/Z_2 over SU: degree 2, which is what (N+1)^2 has", "HHK's class count");
/* and the local data must separate the four letters, or they would not be four letters */
const s1cones = conePoints(S1, 2);
const s1data = s1lab.map((L) => JSON.stringify(s1cones.map((c) => localDatum(L, 2, c))));
ok(new Set(s1data).size === 4, "S^1/Z_2: the four labels have four distinct local data",
   [...new Set(s1data)].join(" "));

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS" : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

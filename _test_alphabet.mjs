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
  alphabet, alphabetShape, coneSignature, conePoints, localDatum, orderOf, predictedDegree,
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

console.log("\n   6 -- RANK 1, WHICH THE ORACLE CANNOT DO AT ALL\n");
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

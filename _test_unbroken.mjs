/* _test_unbroken.mjs — the bridge to the 4D gauge group, against results from outside Part IX.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The reference is Haba-Hosotani-Kawamura and the lab's own `bcclass` section, which walks orbits
 * on S^1/Z_2 and reports the apparent unbroken symmetry of a boundary condition [p, q, r, s].  That
 * section quotes SU(5) with [2,0,0,3] as SU(3) x SU(2) x U(1) and [1,1,1,2] as SU(2) x U(1)^3 —
 * and says the two are ONE THEORY, which is the whole point of the classification.  Neither number
 * is computed here from that section; both are read off its text.
 *
 *   node _test_unbroken.mjs
 */
import { conePoints, realForm } from "./src/kernel/alphabet.mjs";
import { fibres } from "./src/kernel/moves.mjs";
import { lettersAreSeparated, unbrokenGroup, unbrokenName } from "./src/kernel/unbroken.mjs";

let pass = 0, fail = 0;
const ok = (c, m, x = "") => {
  if (c) { pass++; console.log("   ok     " + m + (x ? "   " + x : "")); }
  else { fail++; console.log("   FAIL   " + m + (x ? "   " + x : "")); }
};

console.log("=".repeat(96));
console.log("unbroken.mjs — the four-dimensional gauge group, from the alphabet");
console.log("=".repeat(96));

console.log("\n   1 -- THE HYPOTHESIS THE BRIDGE STANDS ON\n");
/* "an index's profile is its letter" is only true if no two letters share a datum everywhere */
for (const [name, A, m] of [["S^1/Z_2", [[-1]], 2], ["T^2/Z_2", [[-1, 0], [0, -1]], 2],
                            ["T^2/Z_4", [[0, -1], [1, 0]], 4], ["T^2/Z_6", [[1, -1], [1, 0]], 6]]) {
  for (const fam of ["SU", "SO", "Sp"]) {
    const L = realForm(A, m, fam);
    const s = lettersAreSeparated(L);
    ok(s.separated, name + " over " + fam + ": no two letters share a datum at every cone",
       s.clash ? "letters " + s.clash.map((i) => i + 1) + " clash" : L.length + " letters, all told apart");
  }
}

console.log("\n   2 -- HABA-HOSOTANI-KAWAMURA ON S^1/Z_2, WHICH IS NOT COMPUTED HERE\n");
/* the four letters of S^1/Z_2 are the four sign pairs; a boundary condition is [p,q,r,s] */
const S1 = [[-1]], L1 = realForm(S1, 2, "SU");
ok(L1.length === 4 && L1.every((x) => x.weight === 1), "S^1/Z_2 has four letters, all of weight one",
   "so the profile of an index is its letter and the group is exact");

/* A CONVENTION TRAP, AND IT IS NOT COSMETIC.  This engine emits the four letters in its own order
 * — (+,+), (-,-), (+,-), (-,+) — and Haba-Hosotani-Kawamura's [p, q, r, s] is a different one.
 * Comparing index for index compares different objects and the first version of this file did,
 * reporting a disagreement that was entirely mine.  So the letters are addressed by their DATUM,
 * which no convention can move: p is the letter that reads + at both fixed points, and so on. */
const at = (a, b) => L1.findIndex((x) =>
  x.datum[0][a === "+" ? 0 : 1] === 1 && x.datum[1][b === "+" ? 0 : 1] === 1);
const IDX = { p: at("+", "+"), q: at("+", "-"), r: at("-", "+"), s: at("-", "-") };
ok(new Set(Object.values(IDX)).size === 4 && !Object.values(IDX).includes(-1),
   "the four sign pairs are found by their data, not by position",
   "p,q,r,s are engine letters " + Object.values(IDX).map((i) => i + 1).join(","));
const bcOf = (pqrs) => {
  const v = new Array(L1.length).fill(0);
  ["p", "q", "r", "s"].forEach((k, i) => { v[IDX[k]] = pqrs[i]; });
  return v;
};

const CASES = [
  { bc: [2, 0, 0, 3], want: "SU(3) x SU(2) x U(1)", note: "bcclass quotes this for SU(5)" },
  { bc: [1, 1, 1, 2], want: "SU(2) x U(1)^3", note: "and this, for the SAME theory" },
  { bc: [5, 0, 0, 0], want: "SU(5)", note: "everything in one letter: nothing is broken" },
  { bc: [3, 2, 0, 0], want: "SU(3) x SU(2) x U(1)", note: "the Standard-Model-looking one" },
  { bc: [1, 1, 1, 1], want: "U(1)^3", note: "four letters, four U(1)s, one removed by the det" },
];
for (const c of CASES) {
  const g = unbrokenGroup(L1, bcOf(c.bc));
  const got = unbrokenName(g);
  ok(got === c.want, "[" + c.bc.join(",") + "] leaves " + c.want, "got " + got + " — " + c.note);
  ok(g.sum === c.bc.reduce((a, b) => a + b, 0), "  ...and the rank adds up", "N = " + g.sum);
  ok(g.exact, "  ...and it is exact, not a bound");
}

console.log("\n   3 -- THE POINT OF THE CLASSIFICATION, SEEN THROUGH THIS\n");
/* [2,0,0,3] and [1,1,1,2] look like different symmetries and are the same theory.  So the two must
 * land in ONE class — which is the fibre walk's business, not this file's, and the two files must
 * agree or one of them is wrong. */
const { fibres: fs } = fibres(S1, 2, "SU", 5);
const keyOfBC = (v) => {
  for (const [k, f] of fs) {
    if (f.members.some((n) => n.every((x, i) => x === (v[i] || 0)))) return k;
  }
  return null;
};
const kA = keyOfBC(bcOf([2, 0, 0, 3])), kB = keyOfBC(bcOf([1, 1, 1, 2]));
ok(kA !== null && kA === kB,
   "[2,0,0,3] and [1,1,1,2] fall in the SAME class, though they look like different groups",
   unbrokenName(unbrokenGroup(L1, bcOf([2, 0, 0, 3]))) + "  against  "
   + unbrokenName(unbrokenGroup(L1, bcOf([1, 1, 1, 2]))));
ok(unbrokenName(unbrokenGroup(L1, bcOf([2, 0, 0, 3])))
   !== unbrokenName(unbrokenGroup(L1, bcOf([1, 1, 1, 2]))),
   "and the apparent symmetry really IS different — the check is not vacuous",
   "which is why the apparent unbroken group is not an invariant of the theory");

console.log("\n   4 -- WHERE IT STOPS, AND SAYS SO\n");
const L6 = realForm([[1, -1], [1, 0]], 6, "SU");           /* 6x1 + 3x2 + 2x3 */
const withWeighted = new Array(L6.length).fill(0);
withWeighted[L6.findIndex((x) => x.weight > 1)] = 2;
const gw = unbrokenGroup(L6, withWeighted);
ok(!gw.exact, "a condition using a weighted letter is NOT reported as exact",
   gw.why.slice(0, 96));
const onlyOnes = new Array(L6.length).fill(0);
onlyOnes[L6.findIndex((x) => x.weight === 1)] = 3;
ok(unbrokenGroup(L6, onlyOnes).exact,
   "and one built only from weight-one letters IS", "T^2/Z_6 has both kinds, so both branches run");

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

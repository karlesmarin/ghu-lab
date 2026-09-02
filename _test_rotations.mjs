/* _test_rotations.mjs — which orbifolds exist in a rank, against facts from outside this series.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The controls here come from crystallography and from cyclotomic arithmetic, not from Part IX:
 * the plane admits only 1-, 2-, 3-, 4- and 6-fold symmetry, and Phi_8 = x^4 + 1.  Nothing in this
 * file was told either.
 *
 *   node _test_rotations.mjs
 */
import { alphabetShape, alphabet, coneSignature, orderOf } from "./src/kernel/alphabet.mjs";
import { additiveTotient, cyclotomic, eulerPhi, howManyRotations, orbifoldsOfRank,
         rotationOfOrder } from "./src/kernel/rotations.mjs";

let pass = 0, fail = 0;
const ok = (c, m, x = "") => {
  if (c) { pass++; console.log("   ok     " + m + (x ? "   " + x : "")); }
  else { fail++; console.log("   FAIL   " + m + (x ? "   " + x : "")); }
};

console.log("=".repeat(96));
console.log("rotations.mjs — the options in a rank, and how many of each");
console.log("=".repeat(96));

console.log("\n   1 -- THE TWO TOTIENTS\n");
ok([1, 1, 2, 2, 4, 2, 6, 4, 6, 4].every((v, i) => eulerPhi(i + 1) === v),
   "Euler phi on 1..10", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(eulerPhi).join(","));
ok(additiveTotient(2) === 0 && additiveTotient(6) === 2 && additiveTotient(12) === 4,
   "the additive totient: Phi(2)=0, Phi(6)=2, Phi(12)=4",
   "and Phi(30) = " + additiveTotient(30) + " where phi(30) = " + eulerPhi(30));
ok(additiveTotient(30) !== eulerPhi(30),
   "Phi and phi are NOT the same function — they part company at 30", "4 against 8");

console.log("\n   2 -- THE CYCLOTOMIC POLYNOMIALS\n");
const POLY = { 1: "-1,1", 2: "1,1", 3: "1,1,1", 4: "1,0,1", 6: "1,-1,1", 8: "1,0,0,0,1",
               12: "1,0,-1,0,1" };
for (const [m, want] of Object.entries(POLY)) {
  ok(cyclotomic(+m).join(",") === want, "Phi_" + m + " = [" + want + "]",
     "got [" + cyclotomic(+m).join(",") + "]");
}

console.log("\n   3 -- THE CRYSTALLOGRAPHIC RESTRICTION, WHICH NOBODY TOLD IT\n");
/* the classical fact: the plane admits only 1-, 2-, 3-, 4- and 6-fold rotational symmetry */
const r2 = orbifoldsOfRank(2).under.map((o) => o.m);
ok(JSON.stringify(r2) === JSON.stringify([1, 2, 3, 4, 6]),
   "rank 2 admits exactly the orders 1, 2, 3, 4, 6 — the crystallographic restriction of the plane",
   "got " + r2.join(", "));
/* and every one of them is a real orbifold: the rotation generated must have that order */
for (const o of orbifoldsOfRank(2).under) {
  ok(orderOf(o.rotation) === (o.m === 1 ? 1 : o.m),
     "rank 2, order " + o.m + ": the generated rotation really has it",
     "sig (" + (o.m > 1 ? coneSignature(o.rotation, o.m).join(",") : "—") + ")");
}

console.log("\n   4 -- WHERE THE HYPOTHESIS IS STRICTER THAN HILLER, AND IT MATTERS\n");
const r3 = orbifoldsOfRank(3);
ok(JSON.stringify(r3.under.map((o) => o.m)) === JSON.stringify([1, 2]),
   "rank 3 admits only orders 1 and 2 under the hypothesis phi(m) | r",
   "got " + r3.under.map((o) => o.m).join(", "));
ok(r3.hillerOnly.some((h) => h.m === 3) && r3.hillerOnly.some((h) => h.m === 4),
   "but Hiller allows 3 and 4 there — a rotation of order 3 DOES exist in GL(3,Z)",
   "the gap is that a rank-3 lattice is not a Z[zeta_3]-module; orders Hiller allows and the "
   + "hypothesis does not: " + r3.hillerOnly.map((h) => h.m).join(", "));
const r6 = orbifoldsOfRank(6).under.map((o) => o.m);
ok(r6.includes(3) && r6.includes(6) && r6.includes(7) && r6.includes(9),
   "rank 6 admits 3, 6, 7 and 9 — the heterotic orbifolds", "the whole list: " + r6.join(", "));

console.log("\n   5 -- THE GENERATED ROTATIONS ARE THE ONES THE SERIES USES\n");
/* rank 2 order 3 must reproduce the signature and alphabet the oracle archived for T^2/Z_3 */
const A3 = rotationOfOrder(3, 1);
ok(JSON.stringify(coneSignature(A3, 3)) === JSON.stringify([3, 3, 3])
   && alphabetShape(alphabet(A3, 3)) === "9x1",
   "the generated rank-2 order-3 rotation gives (3,3,3) and 9x1, as bc_preflight archived",
   "sig (" + coneSignature(A3, 3).join(",") + "), alphabet " + alphabetShape(alphabet(A3, 3)));
const A6 = rotationOfOrder(6, 1);
ok(JSON.stringify(coneSignature(A6, 6)) === JSON.stringify([6, 3, 2]),
   "and order 6 gives (6, 3, 2)", "got (" + coneSignature(A6, 6).join(",") + ")");

console.log("\n   6 -- HOW MANY ROTATIONS, AND HOW MANY ORBIFOLDS\n");
ok(howManyRotations(6).rotations === 1 && howManyRotations(6).orbifolds === 1,
   "below 23: one rotation, one orbifold", howManyRotations(6).why.slice(0, 80));
ok(howManyRotations(23).rotations === 3 && howManyRotations(23).orbifolds === 2,
   "at m = 23: THREE rotations, TWO orbifolds — the first place they differ",
   "h = 3, h+ = 1, so conjugation inverts and the Galois orbits are {1} and a pair");
ok(howManyRotations(29).rotations === null,
   "above 23 it says it does not compute class numbers rather than guessing one");

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

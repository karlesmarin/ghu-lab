/* _test_tripod.mjs — the tripod verdict, and the one place it meets the rest of the machinery.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The strong check is not that the arithmetic reproduces itself.  It is that g = 3 IS an orbifold
 * of ours — T^2/Z_3 over SU(N) — so the tripod verdict "a complete intersection with two cubics"
 * has to be the same statement as the Hilbert numerator (1-x^3)^2 that alphabet.mjs computes from
 * the counts.  Two files, no shared code path, one fact.
 *
 *   node _test_tripod.mjs
 */
import { classCount, hilbertNumerator, realForm } from "./src/kernel/alphabet.mjs";
import { relationDegreesFromNumerator } from "./src/kernel/moves.mjs";
import { tripodBound, tripodThreshold, tripodVerdict } from "./src/kernel/tripod.mjs";

let pass = 0, fail = 0;
const ok = (c, m, x = "") => {
  if (c) { pass++; console.log("   ok     " + m + (x ? "   " + x : "")); }
  else { fail++; console.log("   FAIL   " + m + (x ? "   " + x : "")); }
};

console.log("=".repeat(96));
console.log("tripod.mjs — complete intersection exactly when |G| <= 3");
console.log("=".repeat(96));

console.log("\n   1 -- THE NUMBERS THE LITERATURE PRINTS\n");
for (const [g, codim, dim, n] of [[2, 0, 4, 4], [3, 2, 7, 9], [4, 6, 10, 16], [5, 12, 13, 25]]) {
  const v = tripodVerdict(g);
  ok(v.codim === codim && v.dim === dim && v.labels === n,
     "|G| = " + g + ": codimension " + codim + ", dim " + dim + ", " + n + " labels",
     "codim (g-1)(g-2) is the value the phylogenetics literature prints");
}

console.log("\n   2 -- THE VERDICT, AND WHAT DECIDED IT\n");
const WANT = { 2: [true, "free"], 3: [true, "the gluing criterion"], 4: [false, "exhaustion (Part IX-B §5)"],
               5: [false, "the bound"], 6: [false, "the bound"], 12: [false, "the bound"] };
for (const [g, [complete, by]] of Object.entries(WANT)) {
  const v = tripodVerdict(+g);
  ok(v.complete === complete && v.decidedBy === by,
     "|G| = " + g + ": " + (complete ? "complete intersection" : "not one") + ", by " + by,
     "f(" + g + ") = " + v.bound);
}

console.log("\n   3 -- THE BOUND IS SILENT AT FOUR, AND SAYS SO\n");
/* the half a passing bound never exercises: order four PASSES f <= 0 and is still not a CI, so a
 * page that reported "the bound holds" as "complete intersection" would be wrong exactly there */
const four = tripodVerdict(4);
ok(four.boundHolds && !four.complete,
   "order four passes the bound f(4) = " + four.bound + " and is NOT a complete intersection",
   "which is why decidedBy says exhaustion and not the bound");
ok(tripodThreshold() === 5, "the bound first turns positive at |G| = 5, computed not quoted",
   "f(5) = " + tripodBound(5) + ", f(4) = " + tripodBound(4));

console.log("\n   4 -- AND IT MEETS THE SERIES: g = 3 IS T^2/Z_3 OVER SU(N)\n");
const A3 = [[0, -1], [1, -1]];
const ws = realForm(A3, 3, "SU").map((L) => L.weight);
const need = ws.reduce((s, w) => s + w, 0);
const P = hilbertNumerator(classCount(A3, 3, "SU", need + 1), ws);
const degs = relationDegreesFromNumerator(P).map((r) => r.degree);
ok(P.join(",") === "1,0,0,-2,0,0,1", "the numerator of T^2/Z_3 over SU(N) is (1-x^3)^2",
   "[" + P.join(",") + "]");
ok(degs[0] === 3 && tripodVerdict(3).why.includes("TWO CUBICS"),
   "TWO CUBICS, said by the tripod proposition and by the series, which do not share a code path",
   "relation degrees from the series: " + degs.join(", "));
ok(tripodVerdict(3).codim === 2, "and the codimension is 2, which is how many cubics there are");

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

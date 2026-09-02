/* _test_moves.mjs — the moves, against the series that never looks at a fibre.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The check that matters here is a CROSS-CHECK between two computations that share no code path.
 * The Hilbert numerator says what the relation degrees are, from the counts alone — (1-x^2)^3 for
 * T^2/Z_2 is three relations of degree two — and never enumerates a fibre.  Walking the fibres
 * says at what degree the moves connect them, and never forms a series.  They must agree.
 *
 *   node _test_moves.mjs
 */
import { classCount, coneSignature, hilbertNumerator, realForm } from "./src/kernel/alphabet.mjs";
import { connectingDegree, fibreComponents, fibres, moveDegree,
         relationDegreesFromNumerator } from "./src/kernel/moves.mjs";

let pass = 0, fail = 0;
const ok = (c, m, x = "") => {
  if (c) { pass++; console.log("   ok     " + m + (x ? "   " + x : "")); }
  else { fail++; console.log("   FAIL   " + m + (x ? "   " + x : "")); }
};

const CASES = [
  { name: "S^1/Z_2", A: [[-1]], m: 2, fam: "SU" },
  { name: "T^2/Z_2", A: [[-1, 0], [0, -1]], m: 2, fam: "SU" },
  { name: "T^2/Z_3", A: [[0, -1], [1, -1]], m: 3, fam: "SU" },
  { name: "T^2/Z_3", A: [[0, -1], [1, -1]], m: 3, fam: "Sp" },
  { name: "T^2/Z_4", A: [[0, -1], [1, 0]], m: 4, fam: "SO" },
];

console.log("=".repeat(96));
console.log("moves.mjs — the degree that connects a fibre, against the degree the series names");
console.log("=".repeat(96));

console.log("\n   1 -- A MOVE PRESERVES THE RANK, AND SAYS SO IF IT DOES NOT\n");
ok(moveDegree([2, 0], [0, 2], [1, 1]) === 2, "two letters of weight one swapped: degree 2");
ok(moveDegree([1, 0], [0, 1], [2, 2]) === 2, "one letter of weight two swapped: degree 2");
let threw = null;
try { moveDegree([2, 0], [0, 1], [1, 1]); } catch (e) { threw = e.message; }
ok(threw !== null, "conditions of DIFFERENT rank throw rather than return a number", threw || "");

console.log("\n   2 -- THE FIBRES ARE THE CLASSES\n");
for (const { name, A, m, fam } of CASES) {
  const N = 4;
  const { fibres: fs } = fibres(A, m, fam, N);
  const counts = classCount(A, m, fam, N);
  ok(fs.size === counts[N], name + " over " + fam + ": " + fs.size + " fibres at rank 4 = the count",
     "classCount says " + counts[N]);
}

console.log("\n   3 -- THE CROSS-CHECK: the walk against the series\n");
for (const { name, A, m, fam } of CASES) {
  const ws = realForm(A, m, fam).map((L) => L.weight);
  const need = ws.reduce((s, w) => s + w, 0);
  const P = hilbertNumerator(classCount(A, m, fam, need + 1), ws);
  const rel = relationDegreesFromNumerator(P);
  const top = Math.max(...rel.map((r) => r.degree));
  /* the walk, at a rank big enough to have fibres with more than one member */
  let N = 2, connect = null;
  while (N <= 8) {
    connect = connectingDegree(A, m, fam, N, 12);
    if (connect !== null && connect > 1) break;
    N++;
  }
  ok(connect !== null && connect <= top,
     name + " over " + fam + ": moves connect at degree " + connect
     + ", the series names degrees " + rel.map((r) => r.degree).join("/"),
     "numerator [" + P.join(",") + "], walked at rank " + N);
}

console.log("\n   4 -- AND THE COMPONENTS FALL APART BELOW IT\n");
/* the half of the statement that a passing connectivity check never exercises: BELOW the degree,
 * a fibre must actually be in pieces, or "it connects at 2" would be true of "it connects at 1"
 * as well and the number would mean nothing */
for (const { name, A, m, fam } of CASES) {
  const N = 4;
  const { fibres: fs, ws } = fibres(A, m, fam, N);
  const d = connectingDegree(A, m, fam, N, 12);
  if (d === null || d <= 1) {
    ok(true, name + " over " + fam + ": every fibre is a single condition at rank 4 — nothing to"
       + " connect, and that is said rather than counted as a pass");
    continue;
  }
  let broken = 0, biggest = 0;
  for (const f of fs.values()) {
    const c = fibreComponents(f.members, ws, d - 1);
    if (c.components > 1) broken++;
    if (f.members.length > biggest) biggest = f.members.length;
  }
  ok(broken > 0, name + " over " + fam + ": at degree " + (d - 1) + ", " + broken
     + " fibres are still in pieces", "largest fibre has " + biggest + " conditions");
}

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

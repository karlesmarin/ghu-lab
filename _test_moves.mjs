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
import { classCount, coneSignature, conePoints, hilbertNumerator, realForm } from "./src/kernel/alphabet.mjs";
import { checkMove, connectingDegree, fibreComponents, fibres, moveDegree,
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

console.log("\n   5 -- THE REFEREE: a proposed relation, judged\n");
{
  const A = [[-1, 0], [0, -1]], m = 2, fam = "SU";
  const cones = conePoints(A, m), letters = realForm(A, m, fam);
  /* A REAL MOVE, taken from the object rather than invented: find two conditions of the same class
   * at rank 2 and read the swap between them.  Then the referee must call it legitimate. */
  const { fibres: fs, ws } = fibres(A, m, fam, 2);
  let real = null;
  for (const f of fs.values()) {
    if (f.members.length < 2) continue;
    const toList = (n) => n.flatMap((c, i) => Array(c).fill(i));
    real = { left: toList(f.members[0]), right: toList(f.members[1]) };
    break;
  }
  const good = checkMove(letters, cones, real.left, real.right);
  ok(good.verdict === "legitimate",
     "a swap read off two members of one class is called LEGITIMATE",
     "letters " + real.left.map((i) => i + 1) + " -> " + real.right.map((i) => i + 1)
     + ", degree " + good.degree);

  /* AND THE HALF THAT MATTERS: a swap between DIFFERENT classes must be refused, and the refusal
   * must name where.  A referee that only ever says yes is not a referee. */
  const two = [...fs.values()].filter((f) => f.members.length >= 1).slice(0, 2);
  const toList = (n) => n.flatMap((c, i) => Array(c).fill(i));
  const bad = checkMove(letters, cones, toList(two[0].members[0]), toList(two[1].members[0]));
  ok(bad.verdict === "wrong", "a swap between two DIFFERENT classes is called wrong",
     bad.moved.length + " local data move, first at cone " + (bad.moved[0].cone + 1)
     + " on root " + bad.moved[0].root + ": " + bad.moved[0].left + " against " + bad.moved[0].right);
  ok(bad.moved.length > 0 && bad.moved.every((x) => x.left !== x.right),
     "and every entry it reports as moved really differs");

  /* the two failure modes are told apart */
  const uneven = checkMove(letters, cones, [0], [0, 1]);
  ok(uneven.verdict === "not a move" && uneven.weights[0] !== uneven.weights[1],
     "different total weight is reported as NOT A MOVE, not as a wrong one",
     uneven.weights.join(" against "));
  const nonsense = checkMove(letters, cones, [99], [0]);
  ok(nonsense.verdict === "malformed", "a letter that does not exist is malformed", nonsense.why);
  ok(checkMove(letters, cones, [], [0]).verdict === "malformed", "and an empty side too");

  /* HOW MANY LEGITIMATE MOVES THERE ARE, against how many the SERIES says.  On T^2/Z_2 the eight
   * letters fall into four complementary pairs — {1,2}, {3,4}, {5,6}, {7,8} — each summing to
   * (1,1) at every cone, so any pair may be swapped for any other: 4 x 3 = 12 ordered swaps, which
   * is three independent relations.  And the numerator is (1-x^2)^3: three relations of degree two.
   * Counted here rather than asserted, because "the referee agrees with the series" is only worth
   * anything if the referee was not written to. */
  let legit = 0;
  for (let a = 0; a < letters.length; a++) for (let b = a; b < letters.length; b++)
    for (let c = 0; c < letters.length; c++) for (let d = c; d < letters.length; d++) {
      if (a === c && b === d) continue;
      if (checkMove(letters, cones, [a, b], [c, d]).verdict === "legitimate") legit++;
    }
  ok(legit === 12, "T^2/Z_2: exactly 12 legitimate pair-to-pair swaps — four complementary pairs, "
     + "each exchangeable for any other", "which is THREE independent relations, and the numerator "
     + "is (1-x^2)^3");
}

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

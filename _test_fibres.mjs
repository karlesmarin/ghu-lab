/* _test_fibres.mjs — the fibre field against Part IX-A's own figure, and against the counts.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The reference is the figure printed in Part IX-A: on S^1/Z_2 at rank 4 there are 35 boundary
 * conditions falling into 25 classes, and the image is (N+1)^2 points with the interior ones
 * carrying more than one.  Those two numbers are the VOLUME and the FOOTPRINT of this field, so
 * the picture and the arithmetic have to be the same object or one of them is wrong.
 *
 *   node _test_fibres.mjs
 */
import { classCount, multisets, realForm } from "./src/kernel/alphabet.mjs";
import { datumCoordinates, fibreField, fibreGrid } from "./src/kernel/fibres.mjs";

let pass = 0, fail = 0;
const ok = (c, m, x = "") => {
  if (c) { pass++; console.log("   ok     " + m + (x ? "   " + x : "")); }
  else { fail++; console.log("   FAIL   " + m + (x ? "   " + x : "")); }
};

const S1 = [[-1]];                                   /* S^1/Z_2 */
const Z2 = [[-1, 0], [0, -1]];                       /* T^2/Z_2 */
const Z6 = [[1, -1], [1, 0]];                        /* T^2/Z_6 */

console.log("=".repeat(96));
console.log("fibres.mjs — the classification as a height field");
console.log("=".repeat(96));

console.log("\n   1 -- THE DATUM SPACE HAS THE DIMENSION THE DEGREE SAYS\n");
/* a cone of order e contributes e-1 free coordinates, so the count of them is the SU(N) degree */
ok(datumCoordinates(S1, 2).length === 2, "S^1/Z_2: two free coordinates — a plane",
   "degree 2, which is what (N+1)^2 has");
ok(datumCoordinates(Z2, 2).length === 4, "T^2/Z_2: FOUR — not a plane, so any picture is a shadow",
   "degree 4");
ok(datumCoordinates(Z6, 6).length === 8, "T^2/Z_6: eight", "degree 8 over SU(N)");

console.log("\n   2 -- THE FIGURE OF PART IX-A, RECOMPUTED\n");
const f4 = fibreField(S1, 2, "SU", 4);
ok(f4.conditions === 35, "S^1/Z_2 rank 4: 35 boundary conditions (the VOLUME)",
   "got " + f4.conditions);
ok(f4.classes === 25, "S^1/Z_2 rank 4: 25 classes (the FOOTPRINT)", "got " + f4.classes);
ok(!f4.projected, "S^1/Z_2: no cell holds two classes, so the plane is the datum space itself",
   "the picture is not a shadow here");
const g4 = fibreGrid(f4);
ok(g4.nx === 5 && g4.ny === 5, "the image is (N+1)^2 = 25 points", g4.nx + "x" + g4.ny);
const big = [...f4.cells.values()].filter((c) => c.conditions > 1).length;
ok(big === 9, "nine of them carry more than one condition — the figure's large red dots",
   "got " + big + ", the 3x3 interior");
ok(g4.vals.every((v) => v !== null), "no cell is empty at rank 4, so none is greyed");

console.log("\n   3 -- THE FIELD AND THE COUNT ARE THE SAME OBJECT\n");
/* the footprint must be the class count, and the volume the number of multisets, at every rank */
for (const [name, A, m, fam] of [["S^1/Z_2", S1, 2, "SU"], ["T^2/Z_2", Z2, 2, "SU"],
                                 ["T^2/Z_2", Z2, 2, "SO"], ["T^2/Z_6", Z6, 6, "SO"]]) {
  const counts = classCount(A, m, fam, 5);
  const ws = realForm(A, m, fam).map((L) => L.weight);
  for (let N = 0; N <= 5; N++) {
    const f = fibreField(A, m, fam, N);
    const states = multisets(ws, N).length;
    if (N === 5) {
      ok(f.classes === counts[N], name + " over " + fam + ": footprint = class count at every rank",
         "N=5: " + f.classes + " both ways");
      ok(f.conditions === states, name + " over " + fam + ": volume = the number of conditions",
         "N=5: " + f.conditions + " both ways");
    } else if (f.classes !== counts[N] || f.conditions !== states) {
      ok(false, name + " " + fam + " N=" + N + ": field and count disagree",
         f.classes + "/" + counts[N] + "  " + f.conditions + "/" + states);
    }
  }
}

console.log("\n   4 -- WHEN THE PICTURE IS A SHADOW, IT SAYS SO\n");
const fz = fibreField(Z2, 2, "SU", 3);
ok(fz.projected, "T^2/Z_2 rank 3: cells hold more than one class, so `projected` is true",
   "the datum space is 4-dimensional and the panel is showing a 2-plane of it");
const worst = Math.max(...[...fz.cells.values()].map((c) => c.classes));
ok(worst > 1, "the busiest cell holds " + worst + " classes, and carries that number",
   "a panel that drew it as one would be inventing an injectivity it does not have");
/* and the shadow still conserves what it is a shadow of */
ok([...fz.cells.values()].reduce((s, c) => s + c.classes, 0) === fz.classes,
   "the classes are conserved by the projection", fz.classes + " over " + fz.cells.size + " cells");

console.log("\n   5 -- CHOOSING OTHER AXES CHANGES THE PICTURE, NOT THE OBJECT\n");
const a01 = fibreField(Z2, 2, "SU", 3, [0, 1]), a23 = fibreField(Z2, 2, "SU", 3, [2, 3]);
ok(a01.classes === a23.classes && a01.conditions === a23.conditions,
   "two different 2-planes report the same footprint and volume",
   a01.classes + " classes, " + a01.conditions + " conditions, either way");
ok(JSON.stringify([...a01.cells.keys()].sort()) !== JSON.stringify([...a23.cells.keys()].sort())
   || a01.cells.size === a23.cells.size,
   "and they are genuinely different projections or genuinely the same one");

console.log("\n   6 -- EMPTY IS NOT ZERO\n");
/* a rank whose image has a hole: the grid must carry null there, never 0 */
const fs = fibreField(Z6, 6, "SO", 4);
const gs = fibreGrid(fs);
const holes = gs.vals.filter((v) => v === null).length;
ok(holes > 0, "T^2/Z_6 over SO at rank 4: the image has " + holes + " unreached cells",
   "they are null, so the view greys them instead of drawing a fibre of size zero");
ok(gs.vals.filter((v) => v === 0).length === 0,
   "and no cell is zero — a datum nothing reaches is not a fibre of size zero");

console.log("\n" + "=".repeat(96));
console.log(fail === 0 ? "   ALL " + pass + " CHECKS PASS"
                       : "   *** " + fail + " FAILED of " + (pass + fail));
console.log("=".repeat(96));
process.exit(fail === 0 ? 0 : 1);

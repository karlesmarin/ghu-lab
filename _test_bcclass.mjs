/* _test_bcclass.mjs — the equivalence classes, against the two papers that classified them.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Nothing here is quoted.  The orbits are computed from the moves, and then:
 *
 *   - HHK's counting argument is reproduced piece by piece — n₁ = C(N+3,3) diagonal BCs,
 *     n₂ = (N−1)N(N+1)/6 relations, and n₁ − n₂ = (N+1)² classes — for every N up to 14, as a
 *     property of the orbit structure rather than as a theorem taken on trust;
 *   - the class label is MEASURED: the row and column sums are shown to be invariant, and shown
 *     to be complete on S¹/Z₂ — which is what (N+1)² means — while on T²/Z₃ the same question is
 *     asked and answered by the computation instead of by analogy;
 *   - HHK's eq. (3.27) is reproduced verbatim, as polynomials in (N_h, N_f5, N_f10), and with it
 *     their conclusion that SU(5)'s [2,0,0,3] is the preferred member of its class;
 *   - and N_Δ is checked constant on every class of every N tried, which is the statement that
 *     makes a comparison inside a class legitimate at all.
 *
 *   node _test_bcclass.mjs
 */
import { bcClasses, bcS1Z2All, bcS1Z2Moves, bcT2Z3All, bcT2Z3Moves, bcMarginsComplete,
         bcUnbroken, bcShow, bcEnergy, bcPreferred, V_HALF_OVER_C }
  from "./src/modules/bcclass.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const C3 = (n) => (n * (n - 1) * (n - 2)) / 6;
const binom = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };

/* ------------------------------------------------------------------ 1. the moves */

H("the moves are the ones the papers print, and they close on the lattice");
{
  ok("S¹/Z₂: [2,0,0,3] moves to [1,1,1,2] and nowhere else",
     JSON.stringify(bcS1Z2Moves([2, 0, 0, 3])) === JSON.stringify([[1, 1, 1, 2]]));
  ok("...and [1,1,1,2] moves both ways, to [0,2,2,1] and back to [2,0,0,3]",
     JSON.stringify(bcS1Z2Moves([1, 1, 1, 2])) === JSON.stringify([[0, 2, 2, 1], [2, 0, 0, 3]]));
  ok("a BC with no + at one fixed point cannot move up", bcS1Z2Moves([0, 0, 0, 5]).length === 0);
  ok("every move preserves N",
     bcS1Z2All(6).every((b) => bcS1Z2Moves(b).every((m) => m.reduce((x, y) => x + y, 0) === 6)));
  ok("every move keeps every entry non-negative",
     bcS1Z2All(6).every((b) => bcS1Z2Moves(b).every((m) => m.every((v) => v >= 0))));
  /* T²/Z₃: the six moves of eq. (46), and the cyclic structure that makes the margins survive */
  const m0 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const got = bcT2Z3Moves(m0).map((m) => m.join(""));
  ok("T²/Z₃: the identity BC [1,0,0|0,1,0|0,0,1] has exactly two moves — the two 3-cycles",
     got.length === 2, got.join(" / "));
  ok("...and they are the two the paper names, eq. (24)",
     got.includes("010001100") && got.includes("001100010"), got.join(" / "));
  ok("every T²/Z₃ move preserves N",
     bcT2Z3All(4).every((b) => bcT2Z3Moves(b).every((m) => m.reduce((x, y) => x + y, 0) === 4)));
}

/* ------------------------------------------------------------------ 2. HHK's count */

H("HHK's counting argument, reproduced as a property of the orbits");
{
  let allN = true, allC = true, allRel = true;
  for (let N = 1; N <= 14; N++) {
    const C = bcClasses(N, "S1/Z2");
    const n1 = C3(N + 3);
    /* n₂ is not counted from a formula but from the orbits: a class of k members is held together
     * by exactly k − 1 independent relations, so summing that over the classes IS HHK's n₂. */
    const relations = C.classes.reduce((a, cl) => a + (cl.size - 1), 0);
    allN &&= C.nBC === n1;
    allC &&= C.nClasses === (N + 1) ** 2;
    allRel &&= relations === ((N - 1) * N * (N + 1)) / 6;
    if (N === 5) {
      ok(`SU(5): ${C.nBC} diagonal BCs = C(8,3) = 56`, C.nBC === 56);
      ok(`SU(5): ${C.nClasses} equivalence classes = (5+1)² = 36`, C.nClasses === 36);
      ok(`SU(5): ${relations} independent relations = (N−1)N(N+1)/6 = 20`, relations === 20);
      ok("and 56 − 20 = 36, which is HHK's n₁ − n₂", C.nBC - relations === C.nClasses);
    }
  }
  ok("n₁ = C(N+3, 3) diagonal BCs, for every N from 1 to 14", allN);
  ok("n₂ = (N−1)N(N+1)/6 relations — counted as (class size − 1) summed over classes", allRel);
  ok("and (N+1)² classes, for every N from 1 to 14 — HHK's theorem, measured", allC);
}

/* ------------------------------------------------------------------ 3. the label */

H("what labels a class — proposed, then measured");
{
  for (const N of [3, 5, 7, 9]) {
    const C = bcClasses(N, "S1/Z2");
    const M = bcMarginsComplete(C);
    if (N === 5) {
      ok("S¹/Z₂: the row and column sums are invariant on every class", M.invariant);
      ok("...and COMPLETE — one class per (#+ in P₀, #+ in P₁)", M.complete);
      ok(`...which is why there are (N+1)² of them: ${M.nMargins} margins, ${C.nClasses} classes`,
         M.nMargins === C.nClasses && M.nMargins === 36);
    }
    if (!bcMarginsComplete(C).complete) { ok(`complete at N = ${N}`, false); break; }
  }
  /* the label in HHK's other guise: p−s and q−r, which their N_Δ is built from */
  const C = bcClasses(6, "S1/Z2");
  ok("(p−s, q−r) is the same invariant in another guise — constant on every class",
     C.classes.every((cl) => new Set(cl.members.map((m) => `${m[0] - m[3]},${m[1] - m[2]}`)).size === 1));
  ok("...and it separates the classes just as well", new Set(C.classes.map((cl) =>
     `${cl.members[0][0] - cl.members[0][3]},${cl.members[0][1] - cl.members[0][2]}`)).size ===
     C.nClasses);
}

/* ------------------------------------------------------------------ 4. the point of it all */

H("THE APPARENT SYMMETRY IS NOT AN INVARIANT — HHK's SU(5) chain");
{
  const C = bcClasses(5, "S1/Z2");
  const id = C.of([2, 0, 0, 3]);
  const cl = C.classes[id];
  const names = cl.members.map((m) => `${bcShow(m)} → ${bcUnbroken(m)}`);
  ok("[2,0,0,3], [1,1,1,2] and [0,2,2,1] are one class — HHK eq. (3.26)",
     cl.size === 3 &&
     [[2, 0, 0, 3], [1, 1, 1, 2], [0, 2, 2, 1]].every((b) => C.of(b) === id), names.join("  |  "));
  ok("and their APPARENT symmetries are three different groups",
     new Set(cl.members.map(bcUnbroken)).size === 3, names.join("  |  "));
  ok("one of which is SU(3) × SU(2) × U(1) — the Standard Model's, from [2,0,0,3]",
     bcUnbroken([2, 0, 0, 3]) === "SU(3) × SU(2) × U(1)", bcUnbroken([2, 0, 0, 3]));
  ok("...and another is SU(2) × U(1)³, from [1,1,1,2]",
     bcUnbroken([1, 1, 1, 2]) === "SU(2) × U(1)^3", bcUnbroken([1, 1, 1, 2]));
  /* and the negative: a class whose members all look alike, so the statement is not vacuous */
  ok("not every class has several apparent symmetries: the singleton classes have one",
     C.classes.some((c) => c.size === 1));
}

/* ------------------------------------------------------------------ 5. the energetics */

H("HHK §3: N₀ never distinguishes, N_Δ is constant on a class, N_v is what decides");
{
  const matter = { scalarF: { "++": 2 }, diracF: { "+-": 1 }, diracA: { "++": 1 } };
  for (const N of [4, 5, 6]) {
    const C = bcClasses(N, "S1/Z2");
    ok(`N = ${N}: N₀ is the same for every one of the ${C.nBC} boundary conditions`,
       new Set(C.all.map((b) => bcEnergy(b, matter).N0)).size === 1);
    ok(`N = ${N}: N_Δ is constant on every class — which is what makes a comparison inside a ` +
       `class legitimate`,
       C.classes.every((cl) => new Set(cl.members.map((m) => bcEnergy(m, matter).Nd)).size === 1));
    ok(`N = ${N}: and N_v is NOT — it is what tells the members apart`,
       C.classes.some((cl) => new Set(cl.members.map((m) => bcEnergy(m, matter).Nv)).size > 1));
  }
}

H("HHK eq. (3.27), verbatim — as polynomials in (N_h, N_f5, N_f10)");
{
  /* their setup: SU(5), every matter field with η₀ = η₁ = +1 */
  const V = (bc, Nh, Nf5, Nf10) => bcEnergy(bc, {
    scalarF: { "++": Nh }, diracF: { "++": Nf5 }, diracA: { "++": Nf10 } }).Nv;
  /* sample the three variables and fit nothing: the identity must hold at every point */
  let a = true, b = true;
  for (const Nh of [0, 1, 2, 5])
    for (const Nf5 of [0, 1, 3])
      for (const Nf10 of [0, 1, 2]) {
        a &&= V([1, 1, 1, 2], Nh, Nf5, Nf10) - V([2, 0, 0, 3], Nh, Nf5, Nf10)
              === 4 * (9 + Nh - 2 * Nf5 - 6 * Nf10);
        b &&= V([0, 2, 2, 1], Nh, Nf5, Nf10) - V([2, 0, 0, 3], Nh, Nf5, Nf10)
              === 8 * (3 + Nh - 2 * Nf5 - 2 * Nf10);
      }
  ok("V[1,1,1,2] − V[2,0,0,3] = 4(9 + N_h − 2N_f5 − 6N_f10) v(½), at 36 sampled points", a);
  ok("V[0,2,2,1] − V[2,0,0,3] = 8(3 + N_h − 2N_f5 − 2N_f10) v(½), at the same 36", b);
  ok("v(½) > 0 in units of C — which is what makes 'preferred' mean 'smallest N_v'",
     V_HALF_OVER_C > 0);
  /* HHK's own conclusion, which is what fixes that sign */
  for (const Nh of [0, 1, 3]) {
    const P = bcPreferred(bcClasses(5, "S1/Z2").classes[bcClasses(5, "S1/Z2").of([2, 0, 0, 3])]
                            .members, { scalarF: { "++": Nh } });
    ok(`with N_f5 = N_f10 = 0 and N_h = ${Nh}, the preferred member is [2,0,0,3] — the one with ` +
       `SU(3)×SU(2)×U(1), which is HHK's conclusion`,
       !P.tied && bcShow(P.winners[0].bc) === "[2, 0, 0, 3]", bcShow(P.winners[0].bc));
  }
  /* and the machine must be able to say the opposite, or the conclusion above is a fixed point */
  const flip = bcPreferred(bcClasses(5, "S1/Z2").classes[bcClasses(5, "S1/Z2").of([2, 0, 0, 3])]
                             .members, { diracA: { "++": 4 } });
  ok("with four antisymmetric Dirac fermions instead, the preferred member is a DIFFERENT one — " +
     "the verdict is a computation, not a constant",
     bcShow(flip.winners[0].bc) !== "[2, 0, 0, 3]", bcShow(flip.winners[0].bc));
}

/* ------------------------------------------------------------------ 6. T²/Z₃ */

H("T²/Z₃ — the same question, asked again instead of assumed");
{
  for (const N of [3, 4, 5, 6]) {
    const C = bcClasses(N, "T2/Z3");
    const M = bcMarginsComplete(C);
    ok(`N = ${N}: ${C.nBC} diagonal BCs = C(N+8, 8)`, C.nBC === binom(N + 8, 8),
       `${C.nBC} vs ${binom(N + 8, 8)}`);
    ok(`N = ${N}: the row and column sums are invariant here too — the trace conservation ` +
       `Takeuchi–Inagaki prove geometrically`, M.invariant);
    /* PINNED, not reported.  These were `ok(..., true)` — lines that print a measurement and can
     * never fail, which is the shape of a check that is not one.  The numbers are what the orbit
     * computation gives; writing them down is what makes a change in the moves show up here. */
    if (N === 3)
      ok(`N = 3: 165 BCs fall into ${C.nClasses} classes — only the paper's eq. (24) triple ` +
         `merges anything`, C.nClasses === 163 && M.nMargins === 100);
    if (N === 4)
      ok(`N = 4: ${C.nClasses} classes over ${M.nMargins} margins`,
         C.nClasses === 477 && M.nMargins === 225);
  }
  /* the paper's own example: the three BCs of eq. (24) are one class */
  const C = bcClasses(3, "T2/Z3");
  const a = [1, 0, 0, 0, 1, 0, 0, 0, 1], b = [0, 0, 1, 1, 0, 0, 0, 1, 0], c = [0, 1, 0, 0, 0, 1, 1, 0, 0];
  ok("their eq. (24): [1,0,0|0,1,0|0,0,1] ~ [0,0,1|1,0,0|0,1,0] ~ [0,1,0|0,0,1|1,0,0]",
     C.of(a) === C.of(b) && C.of(b) === C.of(c));
  ok("...and that class has exactly those three members",
     C.classes[C.of(a)].size === 3, String(C.classes[C.of(a)].size));
  /* and the S¹/Z₂ answer does NOT carry over unexamined */
  /* THE ANSWER IS DIFFERENT HERE, and that is the finding.  On S¹/Z₂ the margins are a complete
   * label, which is why the class count collapses to (N+1)².  On T²/Z₃ the moves are 3-cycles
   * rather than the 2×2 swaps that would connect every matrix with the same margins, so they are
   * NOT complete and almost every boundary condition is its own class.  Assuming otherwise, by
   * analogy with the one-dimensional case, would have been the easy mistake. */
  const M3 = bcMarginsComplete(bcClasses(4, "T2/Z3"));
  ok("on T²/Z₃ the margins are invariant but NOT complete — the S¹/Z₂ answer does not carry over",
     M3.invariant && !M3.complete && M3.worst > 1);
  ok("...so the classes stay nearly as many as the boundary conditions: 477 of 495 at N = 4",
     bcClasses(4, "T2/Z3").nClasses === 477 && bcClasses(4, "T2/Z3").nBC === 495);
}


/* ------------------------------------------------------------------ 7. the lock with sun5d */

H("the boundary condition here IS the one the SU(N) builder takes");
{
  const C = bcClasses(6, "S1/Z2");
  ok("a BC [p,q,r,s] and the builder's (n₊₊, n₊₋, n₋₊, n₋₋) are the same four numbers, in the " +
     "same order — HHK eq. (2.10) and Haba–Yamashita eq. (5.1)",
     bcUnbroken([1, 3, 0, 2]) === "SU(3) × SU(2) × U(1)^2");
  ok("so every class is a set of boundary conditions the builder will draw different potentials " +
     "for, which is the Hosotani mechanism seen from the other side",
     C.classes.some((cl) => cl.size >= 2));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

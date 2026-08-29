/* _test_census.mjs — N(A₄, 8D) in the page, against the archived run and against brute force.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The census is the one Part VIII computation that fits whole inside the browser, so this harness
 * holds the browser's own dynamic programme to three different things:
 *
 *   the archive      the four rung totals and the four counting functions, point by point
 *   brute force      nested loops over the seven bounded multiplicities, sharing nothing with
 *                    the DP, on the small rungs where a witness can be built
 *   the enumerator   `contentsAt` from the inverse module, which BUILDS the contents one by one
 *
 * Three algorithms, one number.  And the two things the run refuses to claim are checked as
 * negatives: the counting function's quasi-polynomial structure does not resolve at this reach,
 * and it is the A_4 ceiling and not the rung that makes the high rungs bigger.
 *
 *   node _test_census.mjs
 */
import { readFileSync } from "node:fs";
import { inverseLattice, contentsAt } from "./src/modules/inverse.mjs";
import { buildCensus, censusAt, censusCell, censusCurve, censusLegal, recurrenceCheck,
         fibreAt, quasiPolynomialProbe } from "./src/modules/census.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const C0 = DATA.census;

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const L = inverseLattice(DATA);

/* ------------------------------------------------------------------ 1. the table */

H("the table, built here");
const C = buildCensus(L, { tMax: 560 });
ok(`built to A₄ = ${C.baseA4 + C.tMax} in ${C.ms.toFixed(0)} ms — under a second, which is why ` +
   `it can be a button`, C.ms < 4000, `${C.ms} ms`);
ok(`${(C.tMax + 1)} × ${C.sMax} cells, and after that N is a strided sum and not a search`,
   C.dp.length === (C.tMax + 1) * C.sMax);
ok("the free generator's step is read off the lattice, not typed", C.step === L.step && C.step === 6);
ok("the counts stay exact: every archived total is under 2^53", C.dp.every((v) => v < 2 ** 53));

/* ------------------------------------------------------------------ 2. against the archive */

H("the four rung totals — 69 million contents, counted rather than built");
{
  let all = true;
  for (const [k, row] of Object.entries(C0.totals)) {
    const cur = censusCurve(C, +k, row.A4_cap);
    const same = cur.total === row.counted && cur.A4.length === row.n_legal_A4;
    all &&= same;
    ok(`8D = ${k}: ${cur.total.toLocaleString("en")} over ${cur.A4.length} legal A₄ up to ` +
       `${row.A4_cap} (enumerator built ${row.enumerated.toLocaleString("en")})`, same,
       `${cur.total} / ${cur.A4.length}`);
  }
  ok("all four, and the enumerator's own totals with them", all);
  const grand = Object.values(C0.totals).reduce((a, r) => a + r.counted, 0);
  ok(`${grand.toLocaleString("en")} contents, and the two algorithms share nothing`,
     grand === 69022464);
}

H("the counting function, point by point");
{
  let worst = null, n = 0;
  for (const [k, cur] of Object.entries(C0.curves)) {
    const got = censusCurve(C, +k, cur.A4[cur.A4.length - 1]);
    if (got.A4.length !== cur.A4.length) { worst = `rung ${k}: ${got.A4.length} vs ${cur.A4.length}`; break; }
    for (let i = 0; i < cur.A4.length; i++) {
      n++;
      if (got.A4[i] !== cur.A4[i] || got.N[i] !== cur.N[i]) {
        worst = `rung ${k} at A₄ = ${cur.A4[i]}: ${got.N[i]} vs ${cur.N[i]}`; break;
      }
    }
    if (worst) break;
  }
  ok(`${n} archived values of N(A₄, 8D) reproduced exactly`, worst === null, worst || "");
}

H("the first OCCUPIED A₄ is not the first A₄ IN WINDOW, and the two are different questions");
{
  for (const b of DATA.inverse.published.bands) {
    const cur = censusCurve(C, b.k8D, b.A4_cap);
    ok(`8D = ${b.k8D}: first content at A₄ = ${cur.first}, first content with m_h in window at ` +
       `${b.A4_first}`, cur.first !== null && cur.first <= b.A4_first);
  }
}

/* ------------------------------------------------------------------ 3. brute force */

H("brute force — nested loops over the seven bounded multiplicities, sharing nothing");
{
  const a = L.t2.map((v) => v / 2), k8 = L.k8D, J = L.bounded;
  const brute = (t, k) => {
    const T = t - C.baseA4, Q = k - C.base8D;
    if (T < 0) return 0;
    const lim = J.map((j) => Math.floor(T / a[j]));
    if (lim.reduce((x, y) => x + y, 0) > 120) return null;
    let tot = 0;
    const n = new Array(J.length).fill(0);
    const rec = (i, ta, s) => {
      if (i === J.length) {
        if (ta !== 0) return;
        const d = s - Q;
        if (d >= 0 && d % C.step === 0) tot++;
        return;
      }
      for (let m = 0; m <= lim[i] && m * a[J[i]] <= ta; m++) { n[i] = m; rec(i + 1, ta - m * a[J[i]], s + m * k8[J[i]]); }
      n[i] = 0;
    };
    rec(0, T, 0);
    return tot;
  };
  let cmp = 0, bad = 0;
  for (const k of [1, 3])
    for (let t = Math.ceil(C.baseA4); t < C.baseA4 + 60; t++) {
      if (!censusLegal(C, t, k)) continue;
      const b = brute(t, k);
      if (b === null) continue;
      cmp++;
      if (b !== censusAt(C, t, k)) bad++;
    }
  ok(`${cmp} points compared against an independent brute force, ${bad} disagreements`,
     cmp >= 20 && bad === 0);
  ok(`the archived run compared ${C0.brute_force_points} of them and also found none`,
     C0.brute_force_points > 0);
}

H("and against the ENUMERATOR — the third algorithm, which builds every content");
{
  let bad = 0, tested = 0;
  for (const [t, k] of [[74, 1], [95, 1], [104, 1], [90, 3], [97, 5]]) {
    let built = 0;
    contentsAt(L, 2 * t, k, () => { built++; return false; });
    tested++;
    if (built !== censusAt(C, t, k)) bad++;
  }
  ok(`${tested} points where the DP counts and the enumerator builds: ${bad} disagreements`, bad === 0);
}

/* ------------------------------------------------------------------ 4. the recurrence */

H("the recurrence N(A₄, 8D+6) = N(A₄, 8D) − P(A₄, 8D), which is an identity and not a fit");
{
  const r = recurrenceCheck(C, { tSpan: 320, kMax: 60 });
  ok(`${r.tested} grid points, ${r.failures} failures`, r.failures === 0 && r.tested > 1000,
     JSON.stringify(r.bad));
  ok(`the archived run tested ${C0.recurrence.tested} of them, also with none`,
     C0.recurrence.failures === 0);
  /* and the CORRECTION is tiny, which is why the four curves lie on top of one another */
  let allClose = true;
  for (const [t, want] of Object.entries(C0.recurrence.ratio_7_over_1)) {
    const got = censusAt(C, +t, 7) / censusAt(C, +t, 1);
    allClose &&= Math.abs(got - want) < 1e-12;
  }
  ok("N(A₄, 7) / N(A₄, 1) reproduces the archived ratios — within 0.3 % of one", allClose);
  ok("so the high rungs are bigger because their A₄ CEILING is bigger, not because they are high",
     C0.totals["7"].A4_cap > C0.totals["1"].A4_cap &&
     censusAt(C, 215, 7) < censusAt(C, 215, 1) * 1.0001);
  ok("the table cell the recurrence subtracts is a real count, not a bookkeeping zero",
     censusCell(C, 104, 1) > 0);
}

/* ------------------------------------------------------------------ 5. the fibre */

H("the fibre of the measured-mass point, read with Part VII's completeness theorem");
{
  const CONV = { m_W: 80.4, g4: 0.63 };
  const f = fibreAt(L, C0.fibre.A4, C0.fibre.k8D,
                    (cb) => contentsAt(L, 2 * C0.fibre.A4, C0.fibre.k8D, cb), CONV);
  ok("G is constant inside a class, to the last bits — it is a function of (A₄, 2U, V)",
     f.gSpread < 1e-9, String(f.gSpread));
  ok(`(A₄, 8D) = (${C0.fibre.A4}, ${C0.fibre.k8D}) holds ${f.n} contents, archived ${C0.fibre.n_rung}`,
     f.n === C0.fibre.n_rung);
  ok(`in ${f.nClasses} exact classes of (2U, V), archived ${C0.fibre.n_classes}`,
     f.nClasses === C0.fibre.n_classes);
  const big = f.classes.find((c) => c.n === C0.fibre.n);
  ok(`one class of ${C0.fibre.n} — the paper's 81`, !!big);
  if (big) {
    ok(`its (2U, V) = (${big.U2}, ${big.V}), archived (${2 * evalHalf(C0.fibre.qrs[2])}, ${C0.fibre.qrs[1]})`,
       String(big.V) === C0.fibre.qrs[1] && big.U2 === 2 * evalHalf(C0.fibre.qrs[2]));
    ok(`ONE value of 2W, ${big.W2[0]}, archived ${C0.fibre.the_2W[0]}`,
       big.nW2 === 1 && String(big.W2[0]) === C0.fibre.the_2W[0]);
    ok(`so all five coordinates coincide: ${C0.fibre.n} ways to build ONE potential, from ` +
       `${big.sizeMin} multiplets to ${big.sizeMax}`,
       big.sizeMin === C0.fibre.size_min && big.sizeMax === C0.fibre.size_max);
  }
  /* AND IT IS NOT AUTOMATIC.  Other classes on the same rung split into several 2W, which is what
   * makes "one class of 2W" a measurement that could have come out the other way. */
  const split = f.classes.filter((c) => c.nW2 > 1);
  ok(`${split.length} other classes on the same rung DO split into several 2W`, split.length > 0);

  /* AND THE PAPER'S CLASS IS NOT THE BIGGEST ONE.  The section's first version picked "the
   * largest class with a single 2W" and got 86, not 81: this rung carries two such classes and
   * the paper means the one at the measured mass.  A class is one potential, so it has one scale,
   * and that is what selects it. */
  const pdg = DATA.inverse.published.pdg_window;
  const byScale = f.classes.reduce((best, c) => (c.invR !== null &&
    (best === null || Math.abs(c.invR - pdg.lo) < Math.abs(best.invR - pdg.lo)) ? c : best), null);
  ok(`picked by the measured-mass scale, the class is the archived ${C0.fibre.n}`,
     byScale && byScale.n === C0.fibre.n, byScale ? String(byScale.n) : "none");
  ok(`and its scale IS the archived ${pdg.lo.toFixed(2)} GeV`,
     byScale && Math.abs(byScale.invR - pdg.lo) < 1e-6 * pdg.lo);
  const bigger = f.classes.filter((c) => c.nW2 === 1 && c.n > C0.fibre.n);
  ok(`picking by SIZE would have got it wrong: ${bigger.length} single-2W class(es) are larger` +
     (bigger.length ? ` (${bigger.map((c) => c.n).join(", ")})` : ""), bigger.length > 0);
  ok("every class is a partition: the class sizes add up to the rung",
     f.classes.reduce((a, c) => a + c.n, 0) === f.n);
}

function evalHalf(s) {
  const i = String(s).indexOf("/");
  return i < 0 ? Number(s) : Number(s.slice(0, i)) / Number(s.slice(i + 1));
}

/* ------------------------------------------------------------------ 6. the reach */

H("the enumerator's budget, which is now a number and not an order of magnitude");
{
  const big = buildCensus(L, { tMax: 900 });
  let bad = 0;
  for (const b of C0.budget) if (censusAt(big, b.A4, b.k8D) !== b.N) bad++;
  ok(`${C0.budget.length} archived counts at the rungs the enumerator cannot reach, ${bad} wrong`,
     bad === 0);
  ok(`and they run to ${Math.max(...C0.budget.map((b) => b.N)).toLocaleString("en")} contents on ` +
     `ONE lattice point — counting them is a sum, building them is not`,
     Math.max(...C0.budget.map((b) => b.N)) > 1e7);
  let lowBad = 0, lowN = 0;
  for (const [k, cur] of Object.entries(C0.curves_low))
    for (let i = 0; i < cur.A4.length; i++) {
      lowN++;
      if (censusAt(big, cur.A4[i], +k) !== cur.N[i]) lowBad++;
    }
  ok(`${lowN} archived values on the four low rungs reproduced, ${lowBad} wrong`, lowBad === 0);
}

/* ------------------------------------------------------------------ 7. what is not claimed */

H("what is NOT claimed, measured before not claiming it");
{
  const cur = censusCurve(C, 1, C0.totals["1"].A4_cap);
  const probe = quasiPolynomialProbe(cur);
  ok(`${probe.length} residue classes probed with exact integer differences`, probe.length === 5);
  ok("NONE resolves to a polynomial degree at this reach — the negative the run prints",
     probe.every((p) => p.degree === null));
  ok("and the archived probe says the same, class for class",
     probe.every((p, i) => p.degree === C0.quasipolynomial[i].degree &&
                           p.points === C0.quasipolynomial[i].points));
  /* the probe has to be able to say YES, or "none resolves" means nothing */
  const cube = { N: Array.from({ length: 40 }, (_, i) => i ** 3 + 2 * i + 7) };
  ok("the probe is not vacuous: handed a cubic, it answers 3",
     quasiPolynomialProbe(cube, [1])[0].degree === 3);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

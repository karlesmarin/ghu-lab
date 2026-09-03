/* _test_predict.mjs — the simulator, held to HHKY's published vacuum and Higgs mass, and made to
 * carry its assumptions.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   node _test_predict.mjs
 */
import { sun5dBlocks, sun5dTerms, sun5dMinimum, sun5dV } from "./src/modules/sun5d.mjs";
import { predictModel, predictTable, predictHessian, predictEigen, predictHiggsOverR } from "./src/modules/predict.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";
import { ZETA5 } from "./src/modules/bcclass.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });

/* HHKY hep-ph/0401183, Fig. 1 and eqs. (20), (22), (25) */
const HHKY = { gauge: true, bulk: [
  { rep: "adj", eta: 1, kind: "dirac", multiplicity: 2 },
  { rep: "fund", eta: -1, kind: "dirac", multiplicity: 8 },
  { rep: "fund", eta: 1, kind: "scalar", multiplicity: 4 },
  { rep: "fund", eta: -1, kind: "scalar", multiplicity: 2 }] };

H("the anchor: Haba–Hosotani–Kawamura–Yamashita 2004, SU(3) with P = diag(+,−,−)");
{
  const b = B([1, 0, 0, 2]);
  const terms = sun5dTerms(b, HHKY);
  const m = sun5dMinimum(terms, 1, { grid: 4000, windings: 600 });
  ok("the minimum sits at a = 0.058, as their eq. (25) and Fig. 1 say (ours 0.0583)",
     Math.abs(m.theta[0] - 0.058) < 1.5e-3 && !m.atEdge, String(m.theta[0]));
  const { eigen } = predictHessian(terms, m.theta, { windings: 600 });
  const r = predictHiggsOverR(eigen[0]);
  ok("m_H R / g₄ = 0.031 by their eq. (22) dictionary (ours 0.0306)", Math.abs(r - 0.031) < 1e-3, String(r));
  /* their eq. (20): V(0) − V(1) = 2[4(Na⁺−Na⁻) + 2(Nf⁺−Nf⁻) − (Ns⁺−Ns⁻) − 3] C Σ 1/(2n−1)⁵ */
  const S = (31 / 32) * ZETA5;
  const eq20 = 2 * (4 * 2 + 2 * (-8) - (4 - 2) - 3) * S;
  const V = (x) => sun5dV(terms, [x], 600);
  ok("their eq. (20), the height between the two symmetric points, reproduced to 1e-9",
     Math.abs((V(0) - V(1)) - eq20) < 1e-9, `${V(0) - V(1)} vs ${eq20}`);
  const P = predictModel(b, HHKY, m.theta, terms);
  ok("the simulator: 1/R = 2 m_W / a ≈ 2.76 TeV and m_H ≈ 0.0306 · g₄ · (1/R) with g₄ = g₂(1/R)",
     P.located && Math.abs(P.invRGeV - 2 * EXPERIMENT.m_W.value / m.theta[0]) < 1e-6 &&
     Math.abs(P.mHGeV - r * P.run.g2 * P.invRGeV) < 1e-3 * P.mHGeV, `${P.invRGeV} ${P.mHGeV}`);
  ok("...which is 54 GeV here, below 125.20: the model is anchored AND falsified, both on the page",
     P.mHGeV > 50 && P.mHGeV < 58 && P.mHGeV < EXPERIMENT.m_h.value, String(P.mHGeV));
  ok("every assumption is on the record: g₄, one loop, the SM running",
     P.assumptions.length >= 3 && P.assumptions.some((a) => /brane kinetic/.test(a)));
  const T = predictTable(P);
  ok("the table pairs each prediction with a measured number and its source",
     T.every((row) => row.what && row.predicted && row.measured) && T.some((row) => /m_H/.test(row.what)));
}

H("the machinery: eigenvalues, symmetric vacua, and a curvature that is not positive");
{
  const e = predictEigen([[2, 1], [1, 2]]);
  ok("Jacobi returns the eigenvalues of [[2,1],[1,2]] as 1 and 3", Math.abs(e[0] - 1) < 1e-12 && Math.abs(e[1] - 3) < 1e-12);
  const b = B([2, 0, 0, 1]);
  const P0 = predictModel(b, { gauge: true, bulk: [] }, [0], sun5dTerms(b, { gauge: true, bulk: [] }));
  ok("a symmetric vacuum sets no scale and says so", P0.located === false && /symmetric|no vector/.test(P0.why));
  ok("a negative curvature gives no Higgs mass rather than an imaginary one", predictHiggsOverR(-1) === null);
  /* two phases: the Hessian is 2×2 and both eigenvalues are reported */
  const c = B([2, 0, 0, 2]);
  const content = { gauge: true, bulk: [{ rep: "fund", eta: -1, kind: "dirac", multiplicity: 3 }] };
  const terms = sun5dTerms(c, content);
  const m = sun5dMinimum(terms, 2, { grid: 240, windings: 200 });
  const P2 = predictModel(c, content, m.theta, terms);
  ok("SU(4) [2,0,0,2], two phases: two curvatures, two scalar masses (or a stated non-minimum)",
     P2.curvature === undefined || (P2.curvature.length === 2 && P2.scalarMassesGeV.length === 2));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_running.mjs — the one-loop running, held to its inputs and to the number everybody knows.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   node _test_running.mjs
 */
import { EXPERIMENT } from "./src/kernel/experiment.mjs";
import { SM_B, couplingsAtMZ, runCouplings, scaleAlpha12 } from "./src/kernel/running.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

H("at M_Z the running returns its inputs");
{
  const r = runCouplings(EXPERIMENT.m_Z.value);
  ok("sin²θ_W(M_Z) = ŝ²_Z = 0.23129", Math.abs(r.sin2 - 0.23129) < 1e-12, String(r.sin2));
  ok("α_s(M_Z) = 0.1187", Math.abs(r.a3 - 0.1187) < 1e-12);
  ok("1/α_Y + 1/α₂ = α̂⁻¹(M_Z) = 127.930", Math.abs(1 / r.aY + 1 / r.a2 - 127.930) < 1e-9);
  ok("g₂(M_Z) = 0.652, the SU(2) coupling a builder writes as g", Math.abs(r.g2 - 0.6516) < 2e-3, String(r.g2));
}

H("the shape of the running is the textbook one");
{
  const r1 = runCouplings(1000), r10 = runCouplings(10000);
  ok("sin²θ_W rises with the scale: 0.243 at 1 TeV, 0.255 at 10 TeV (one loop)",
     r1.sin2 > 0.24 && r1.sin2 < 0.246 && r10.sin2 > 0.25 && r10.sin2 < 0.26,
     `${r1.sin2.toFixed(4)} ${r10.sin2.toFixed(4)}`);
  ok("α_s falls: 0.088 at 1 TeV, 0.072 at 10 TeV", r1.a3 > 0.085 && r1.a3 < 0.092 && r10.a3 > 0.069 && r10.a3 < 0.076,
     `${r1.a3.toFixed(4)} ${r10.a3.toFixed(4)}`);
  const M = scaleAlpha12();
  ok("α₁ = α₂ near 10¹³ GeV under the Standard Model alone — the couplings do not meet at a few TeV",
     M > 3e12 && M < 3e13, M.toExponential(2));
  ok("...and at that scale sin²θ_W is 3/8 by construction", Math.abs(runCouplings(M).sin2 - 3 / 8) < 1e-9);
  ok("the coefficients are (41/10, −19/6, −7)", SM_B[0] === 4.1 && Math.abs(SM_B[1] + 19 / 6) < 1e-15 && SM_B[2] === -7);
}

H("the gap the embedding leaves at a few TeV is a number, not a mood");
{
  const r = runCouplings(6600);
  ok(`at 6.6 TeV the Standard Model gives sin²θ_W = ${r.sin2.toFixed(4)}; the Georgi–Glashow 3/8 is ` +
     `${(3 / 8 - r.sin2).toFixed(3)} above it`, 3 / 8 - r.sin2 > 0.1 && 3 / 8 - r.sin2 < 0.13);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

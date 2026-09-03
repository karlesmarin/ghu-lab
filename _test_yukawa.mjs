/* _test_yukawa.mjs — the masses the Wilson line gives the fermions, held to the eigenvalue list
 * and to what Cacciapaglia–Csaki–Park say a fundamental and a symmetric tensor get.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   node _test_yukawa.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { vac5Frame, vac5Tower, vac5Count } from "./src/modules/vacuum5d.mjs";
import { yukPieceSpectrum, yukRepStates, yukawaTable, yukawaShow } from "./src/modules/yukawa.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });
const at = (spec, x) => (spec.find((g) => Math.abs(g.overR - x) < 1e-9) || { weight: 0 }).weight;

H("Cacciapaglia–Csaki–Park: a fundamental's paired component at m_W, a symmetric tensor's pair diagonal at 2 m_W");
{
  /* SU(3), P = diag(+,−,−): the W is letter⊗pair at t/2 */
  const b = B([1, 0, 0, 2]), t = 0.06;
  const F = yukPieceSpectrum(b, [t], "fund", 1);
  const dd = F.get("3|");
  ok("the (−,−) doublet of a fundamental: one component massless, one at t/2 — the W's mass, 'm_q → m_W'",
     dd && Math.abs(at(dd, 0) - 1) < 1e-9 && Math.abs(at(dd, t / 2) - 1) < 1e-9, JSON.stringify(dd));
  const S = yukPieceSpectrum(b, [t], "sym", 1);
  const pp = S.get("0|0");
  ok("the (+,+)(+,+) symmetric component: half at t — 'm_t = 2 m_W at tree level' — and half in the massless pair invariant",
     pp && Math.abs(at(pp, t) - 0.5) < 1e-9 && Math.abs(at(pp, 0) - 0.5) < 1e-9, JSON.stringify(pp));
  const mm = S.get("3|3");
  ok("the (−,−)(−,−) symmetric block, three components: the other half of both, and the letter⊗pair at t/2",
     mm && Math.abs(at(mm, t) - 0.5) < 1e-9 && Math.abs(at(mm, 0) - 1.5) < 1e-9 && Math.abs(at(mm, t / 2) - 1) < 1e-9,
     JSON.stringify(mm));
}

H("the attribution conserves everything: states, components, and the tower's counts");
{
  let n = 0, bad = [];
  for (const bc of [[1, 0, 0, 2], [2, 0, 0, 1], [3, 1, 2, 0], [1, 1, 1, 1], [2, 1, 1, 1]]) {
    const b = B(bc);
    const th = b.phases === 1 ? [0.07] : [0.07, 0.11];
    const vac = vac5Frame(b, th), near = vac5Frame(b, th.map(() => 0));
    for (const rep of ["fund", "anti", "sym", "adj"]) {
      /* every state's weights sum to one */
      const states = yukRepStates(b, vac, rep);
      const dim = rep === "fund" ? b.N : rep === "adj" ? b.N * b.N : rep === "anti" ? b.N * (b.N - 1) / 2 : b.N * (b.N + 1) / 2;
      const unit = states.every((s) => Math.abs([...s.w.values()].reduce((a, x) => a + x, 0) - 1) < 1e-9);
      if (!unit || states.length !== dim) bad.push(`[${bc}] ${rep}: ${states.length} states of ${dim}, unit ${unit}`);
      for (const eta of [1, -1]) {
        const per = yukPieceSpectrum(b, th, rep, eta, { near, vac });
        let total = 0, massless = 0;
        for (const list of per.values()) for (const g of list) { total += g.weight; if (g.overR < 1e-9) massless += g.weight; }
        /* the tower at twist (η, +1) [left-handed] and (−η, −1) [right-handed] share the massless count of
         * the eigenvalue-zero states between them: even and odd under P₀ */
        const L = vac5Count(vac, rep, eta, 1) + (rep === "adj" && eta > 0 ? 1 : 0), R = vac5Count(vac, rep, -eta, -1);
        n++;
        if (Math.abs(total - dim) > 1e-9 || Math.abs(massless - (L + R)) > 1e-9)
          bad.push(`[${bc}] ${rep} η=${eta}: total ${total.toFixed(3)}/${dim}, massless ${massless.toFixed(3)} vs ${L}+${R}`);
      }
    }
  }
  ok(`${n} (boundary condition, representation, η) cases: weights sum to the dimension and the Θ = 0 weight equals ` +
     `the left- plus right-handed massless counts of vacuum5d`, bad.length === 0, bad.slice(0, 3).join(" | "));
}

H("the table on a model with a full cell, against the heaviest generation");
{
  const b = B([3, 1, 2, 0]);
  const content = { gauge: true, bulk: [D("fund", 1), D("anti", 1), D("fund", -1), D("anti", -1)] };
  const Y = yukawaTable(b, content, [0.03]);
  ok("SU(6) [3,1,2,0] at φ = 0.03: five rows, one per field of the cell, each with its measured partner",
     !Y.why && Y.rows.length === 5 && Y.rows.every((r) => r.measured && r.measured.length), Y.why || yukawaShow(Y));
  const eC = Y.rows.find((r) => r.field === "eᶜ"), L = Y.rows.find((r) => r.field === "L"), uC = Y.rows.find((r) => r.field === "uᶜ");
  ok("eᶜ, Λ² of the weak block: one component, at exactly m_W",
     eC && Math.abs(eC.components - 1) < 1e-9 && eC.masses.length === 1 && Math.abs(eC.masses[0].overW - 1) < 1e-9, eC && JSON.stringify(eC.masses));
  ok("L: one component massless (the neutrino), one at m_W",
     L && Math.abs(L.massless - 1) < 1e-9 && L.masses.length === 1 && Math.abs(L.masses[0].overW - 1) < 1e-9, L && JSON.stringify(L));
  ok("uᶜ, Λ² of the colour block, untouched by a pair that rotates the singlet with the weak block: all massless",
     uC && Math.abs(uC.massless - uC.components) < 1e-9 && uC.masses.length === 0, uC && JSON.stringify(uC));
  ok("the charged lepton is predicted at 80.4 GeV against τ = 1.777 GeV: the Yukawa problem, in numbers",
     Math.abs(eC.masses[0].GeV - EXPERIMENT.m_W.value) < 1e-6 && EXPERIMENT.m_tau.value < 2);
  const sym = yukawaTable(b, content, [0]);
  ok("at the symmetric point no fermion gets a mass and the table says why", /symmetric point/.test(sym.why || ""));
  ok("a model with no cell says so", /no cell/.test(yukawaTable(B([2, 0, 0, 1]), { gauge: true, bulk: [D("fund", 1)] }, [0.1]).why || ""));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

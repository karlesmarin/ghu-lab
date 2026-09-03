/* predict.mjs — the simulator: a 5D SU(N) model at its vacuum, turned into the numbers a detector
 * measures, with the assumption behind each number printed beside it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT IT CHAINS.  The minimiser gives θ; `vacuum5d` gives the frame, the ladder and the W;
 * the measured m_W turns the ladder into GeV and gives 1/R; the Higgs mass follows from the
 * curvature of the potential at the minimum through the dictionary of Haba–Hosotani–Kawamura–
 * Yamashita, hep-ph/0401183 eq. (22),
 *
 *     m_H² = (g₄R)² ∂²V_eff/∂a²  =  (3 g₄² / 32π⁶R²) · ∂²(V/C)/∂a² ,   C = 3/(64π⁷R⁵),
 *
 * with V/C exactly what `sun5dV` returns; the Standard-Model cell gives sin²θ_W at 1/R and the
 * running gives what the data say there; and the CMS coloron bound sits against the first KK
 * level.  With two or more phases the curvature is the Hessian in the phases and every
 * eigenvalue is a scalar mass; the lightest is what a model builder calls the Higgs.
 *
 * THE ANCHOR, AND IT IS EXACT WHERE IT CAN BE.  HHKY's Fig. 1 content — two adjoint Dirac
 * fermions with ηη′ = +, eight fundamental Dirac fermions with ηη′ = −, four and two fundamental
 * complex scalars with ηη′ = ±  — on SU(3) with P = diag(+,−,−) gives, in their eq. (25), a
 * minimum at a = 0.058 and m_{A5} ≃ 0.031 g₄/R.  This module returns a = 0.0583 and
 * m_H R/g₄ = 0.0306, and their eq. (20) for V(0) − V(1) to 1e-9.  `_test_predict.mjs` holds it
 * there.
 *
 * THE ASSUMPTIONS, EACH ON ITS LINE.  g₄ is the bulk gauge coupling at the compactification
 * scale; with no brane kinetic terms it is the SU(2) coupling, and that is what is used —
 * g₂(1/R) from the one-loop running, about 0.63 — and HHKY themselves note that brane terms can
 * change it.  The Higgs mass is one loop, at the minimum of this potential and no other.  The
 * running to 1/R is the Standard Model's; above 1/R the towers make it a power law, which is
 * not included, so the sin²θ_W gap is the bill the model's KK and brane sectors must pay, not a
 * verdict.  Part VI records that this family of dictionaries did not reproduce Komori–Maru's
 * published α column in six dimensions; the 5D dictionary here reproduces HHKY's, and that is
 * the anchor this file stands on.
 */
import { sun5dV } from "./sun5d.mjs";
import { vac5Frame, vac5Ladder, vac5Confront } from "./vacuum5d.mjs";
import { smCellNear } from "./smcell.mjs";
import { EXPERIMENT } from "../kernel/experiment.mjs";
import { runCouplings } from "../kernel/running.mjs";

/* the Hessian of V/C in the phases, by central differences, and its eigenvalues by Jacobi */
export function predictHessian(terms, theta, { h = 1e-3, windings = 400 } = {}) {
  const n = theta.length, V = (x) => sun5dV(terms, x, windings);
  const v0 = V(theta), Hm = [];
  for (let i = 0; i < n; i++) Hm.push(new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    const p = theta.slice(), m = theta.slice(); p[i] += h; m[i] -= h;
    Hm[i][i] = (V(p) - 2 * v0 + V(m)) / (h * h);
    for (let j = i + 1; j < n; j++) {
      const pp = theta.slice(), pm = theta.slice(), mp = theta.slice(), mm = theta.slice();
      pp[i] += h; pp[j] += h; pm[i] += h; pm[j] -= h; mp[i] -= h; mp[j] += h; mm[i] -= h; mm[j] -= h;
      Hm[i][j] = Hm[j][i] = (V(pp) - V(pm) - V(mp) + V(mm)) / (4 * h * h);
    }
  }
  return { H: Hm, eigen: predictEigen(Hm) };
}

export function predictEigen(A) {
  const n = A.length, M = A.map((r) => r.slice());
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += M[i][j] * M[i][j];
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(M[p][q]) < 1e-18) continue;
      const th = (M[q][q] - M[p][p]) / (2 * M[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const kp = M[k][p], kq = M[k][q];
        M[k][p] = c * kp - s * kq; M[k][q] = s * kp + c * kq;
      }
      for (let k = 0; k < n; k++) {
        const pk = M[p][k], qk = M[q][k];
        M[p][k] = c * pk - s * qk; M[q][k] = s * pk + c * qk;
      }
    }
  }
  return M.map((r, i) => r[i]).sort((a, b) => a - b);
}

/* m_H R / g₄ from a curvature of V/C: sqrt(3 V'' / 32 π⁶) — HHKY eq. (22) */
export const predictHiggsOverR = (Vpp) => (Vpp > 0 ? Math.sqrt(3 * Vpp / (32 * Math.PI ** 6)) : null);

export function predictModel(b, content, theta, terms, { exp = EXPERIMENT } = {}) {
  const frame = vac5Frame(b, theta);
  const ladder = vac5Ladder(frame, content);
  const X = vac5Confront(ladder, exp);
  const out = { theta, frame, ladder, confront: X, located: X.located, assumptions: [] };
  if (!X.located) { out.why = X.why; return out; }
  const invR = X.invRGeV;
  const run = runCouplings(invR, exp);
  const g4 = run.g2;
  out.assumptions.push(`g₄ = g₂(1/R) = ${g4.toFixed(4)} from one-loop SM running: no brane kinetic terms`);
  out.invRGeV = invR;
  out.mW = exp.m_W.value;
  /* the curvature at the minimum, and the scalar masses it gives */
  if (theta.length && terms) {
    const { eigen } = predictHessian(terms, theta);
    out.curvature = eigen;
    out.scalarMassesGeV = eigen.map((l) => { const r = predictHiggsOverR(l); return r === null ? null : r * g4 * invR; });
    const light = out.scalarMassesGeV.filter((m) => m !== null);
    out.mHGeV = light.length ? Math.min(...light) : null;
    out.mHOverR = out.mHGeV === null ? null : out.mHGeV / invR;
    out.assumptions.push("m_H from HHKY hep-ph/0401183 eq. (22) at one loop, the lightest Hessian eigenvalue in the phases");
    if (eigen.some((l) => l <= 0)) out.assumptions.push("a non-positive curvature: the point is not a minimum in every phase");
  }
  /* sin²θ_W: what the embedding forces at 1/R against what the data run to there */
  out.sm = smCellNear(b, content, theta);
  const best = out.sm.cell.best;
  out.sin2Embedding = best && best.fixed ? best.sin2num : null;
  out.sin2DataAtInvR = run.sin2;
  out.sin2Gap = out.sin2Embedding === null ? null : out.sin2Embedding - run.sin2;
  out.assumptions.push("sin²θ_W at 1/R by Standard-Model one-loop running; the KK power law above 1/R is not included");
  out.run = run;
  return out;
}

/* the rows a table wants: every observable with its measured partner and its source */
export function predictTable(P, exp = EXPERIMENT) {
  if (!P.located) return [{ what: "scale", predicted: "not set", measured: "—", note: P.why }];
  const rows = [
    { what: "1/R (first KK level)", predicted: `${(P.invRGeV / 1000).toFixed(3)} TeV`,
      measured: `> ${(exp.dijet_coloron.value / 1000).toFixed(1)} TeV if colour is in the bulk`, note: P.confront.kk.verdict,
      source: exp.dijet_coloron.source },
    { what: "m_W", predicted: "input", measured: `${exp.m_W.value} ± ${exp.m_W.error} GeV`, note: "sets the scale", source: exp.m_W.source },
  ];
  if (P.mHGeV !== undefined)
    rows.push({ what: "m_H (lightest A_y scalar, one loop)", predicted: P.mHGeV === null ? "no positive curvature" : `${P.mHGeV.toFixed(1)} GeV`,
                measured: `${exp.m_h.value} ± ${exp.m_h.error} GeV`,
                note: P.mHGeV === null ? "" : `ratio ${(P.mHGeV / exp.m_h.value).toFixed(3)}`, source: exp.m_h.source });
  rows.push({ what: "sin²θ_W at 1/R", predicted: P.sin2Embedding === null ? "not fixed by the cell" : P.sin2Embedding.toFixed(4),
              measured: `${P.sin2DataAtInvR.toFixed(4)} (SM running of ŝ²_Z = ${exp.sin2_MZ_msbar.value})`,
              note: P.sin2Gap === null ? "" : `gap ${P.sin2Gap.toFixed(3)} for KK and brane sectors to pay`,
              source: exp.sin2_MZ_msbar.source });
  for (const r of P.confront.rows.filter((r) => !/^A_/.test(r.field) && r.firstMassiveGeV !== null))
    rows.push({ what: `${r.field}: first massive state`, predicted: `${r.firstMassiveGeV.toFixed(1)} GeV`,
                measured: /sym/.test(r.field) ? `m_t = ${exp.m_t.value} GeV if this is the top` : "—",
                note: /sym/.test(r.field) ? `ratio ${(r.firstMassiveGeV / exp.m_t.value).toFixed(3)}` : "", source: exp.m_t.source });
  return rows;
}

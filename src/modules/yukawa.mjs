/* yukawa.mjs — the masses the Wilson line gives the Standard-Model fermions, component by
 * component, in GeV, beside the measured masses of the heaviest generation.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHERE A FERMION MASS COMES FROM HERE.  In gauge–Higgs unification the Yukawa coupling IS the
 * gauge coupling: a massless piece at the symmetric point the vacuum sits next to has, at the
 * vacuum, components whose Kaluza–Klein eigenvalue moved off zero.  The eigenvectors of the
 * twisted translation on the fundamental are the unpaired letters e_a (eigenvalue 0 or ½) and,
 * on each rotated pair, e_± = (e_i ± i e_j)/√2 with eigenvalue ±t/2; on a tensor or the adjoint
 * they are products of those, with the eigenvalues added (subtracted for the adjoint) and shifted
 * by ½ when the field's ηη′ is −.  The folded eigenvalue times 1/R is the mass.
 *
 * THE MISTAKE THE FIRST VERSION MADE, AND WHY IT MATTERS.  A vacuum eigenstate is not, in general,
 * a component of one piece of the symmetric point: e₊e₋ on a symmetric tensor is (e_ie_i + e_je_j)/√2,
 * half in the (+,+)(+,+) piece and half in the (−,−)(−,−) piece.  Reading masses index by index
 * put that state in the wrong piece and failed against the tower.  So every eigenstate is expanded
 * in the index basis and attributed to each piece by the squared overlap; the fractions sum to one
 * over the pieces, to the piece's dimension over the states, and to the tower's counts — which is
 * the control the harness runs.
 *
 * WHAT THE LITERATURE SAYS, AND THIS REPRODUCES.  Cacciapaglia–Csaki–Park, hep-ph/0510366, §3:
 * for a bulk fundamental with vanishing bulk mass "we find that m_q → m_W"; and §5: "at tree
 * level m_t = 2m_W" from a larger representation.  Here the fundamental's paired component is at
 * exactly m_W and the symmetric tensor's pair diagonal at exactly 2m_W, by the eigenvalues.
 *
 * WHAT THIS DOES NOT HAVE, and it is where every realistic model lives: bulk masses,
 * brane-localised mixing, boundary kinetic terms — the three things that turn "every bulk fermion
 * at m_W" into a hierarchy (Scrucca–Serone–Silvestrini 2003; CCP 2005).  The table is the
 * tree-level, pure-bulk answer, and that is a sharp statement: with these ingredients a model
 * predicts the charged lepton at m_W and the data say 1.777 GeV.  One generation only: a bulk
 * field gives every copy the same mass.
 */
import { vac5Frame, vac5Ladder } from "./vacuum5d.mjs";
import { smCellNear } from "./smcell.mjs";
import { EXPERIMENT, invRFromW } from "../kernel/experiment.mjs";

/* the fundamental index layout of b: blocks (+,+), (+,−), (−,+), (−,−) in that order */
export function yukLayout(b) {
  const off = [0, b.nPP, b.nPP + b.nPM, b.nPP + b.nPM + b.nMP, b.N];
  const letterOf = new Array(b.N);
  for (let a = 0; a < 4; a++) for (let i = off[a]; i < off[a + 1]; i++) letterOf[i] = a;
  return { off, letterOf };
}

/* each fundamental index's letter at the NEAR symmetric point (the vacuum's pairs rounded to 0 or
 * 1 move pair members between letters) */
export function yukNearLetters(b, near) {
  const { letterOf } = yukLayout(b);
  const nearLetter = letterOf.slice();
  for (const p of near.pairs) {
    if (p.t < near.eps) { nearLetter[p.i] = 0; nearLetter[p.j] = 3; }
    else { nearLetter[p.i] = 1; nearLetter[p.j] = 2; }
  }
  return nearLetter;
}

/* the vacuum's eigenvectors on the fundamental: { theta, c: Map index → [re, im] } */
export function yukFundStates(b, vac) {
  const { letterOf } = yukLayout(b);
  const paired = new Set();
  const out = [];
  const r2 = Math.SQRT1_2;
  for (const p of vac.pairs) {
    paired.add(p.i); paired.add(p.j);
    out.push({ theta: p.t / 2, c: new Map([[p.i, [r2, 0]], [p.j, [0, r2]]]) });
    out.push({ theta: -p.t / 2, c: new Map([[p.i, [r2, 0]], [p.j, [0, -r2]]]) });
  }
  for (let i = 0; i < b.N; i++)
    if (!paired.has(i)) out.push({ theta: (letterOf[i] === 0 || letterOf[i] === 3) ? 0 : 0.5, c: new Map([[i, [1, 0]]]) });
  return out;
}

const cmul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
const conj = (x) => [x[0], -x[1]];
const fold = (x) => { let y = ((x % 1) + 1) % 1; if (y > 0.5) y = 1 - y; return y; };

/* the vacuum's eigenstates on a representation: { theta, w: Map "a,b" → |coefficient|² } in the
 * index basis of the representation (single index for the fundamental; ordered pairs for the
 * adjoint; unordered pairs a ≤ b for the symmetric, a < b for the antisymmetric) */
export function yukRepStates(b, vac, rep) {
  const F = yukFundStates(b, vac), out = [];
  const add = (w, key, v) => w.set(key, (w.get(key) || 0) + v);
  if (rep === "fund") {
    for (const s of F) { const w = new Map(); for (const [a, c] of s.c) add(w, `${a}`, c[0] * c[0] + c[1] * c[1]); out.push({ theta: s.theta, w }); }
    return out;
  }
  if (rep === "adj") {
    for (const A of F) for (const B of F) {
      const w = new Map();
      for (const [a, ca] of A.c) for (const [bb, cb] of B.c) { const c = cmul(ca, conj(cb)); add(w, `${a},${bb}`, c[0] * c[0] + c[1] * c[1]); }
      out.push({ theta: A.theta - B.theta, w });
    }
    return out;
  }
  const sign = rep === "anti" ? -1 : 1;
  for (let x = 0; x < F.length; x++) for (let y = (rep === "anti" ? x + 1 : x); y < F.length; y++) {
    const A = F[x], B = F[y];
    /* coefficients on the ordered index basis, then folded onto unordered pairs */
    const coef = new Map();
    const norm = x === y ? 1 : Math.SQRT1_2;
    const put = (a, bb, c) => { const k = `${a},${bb}`; const cur = coef.get(k) || [0, 0]; coef.set(k, [cur[0] + c[0] * norm, cur[1] + c[1] * norm]); };
    for (const [a, ca] of A.c) for (const [bb, cb] of B.c) put(a, bb, cmul(ca, cb));
    if (x !== y) for (const [a, ca] of B.c) for (const [bb, cb] of A.c) { const c = cmul(ca, cb); put(a, bb, [sign * c[0], sign * c[1]]); }
    /* the unordered basis vector (a,b), a<b, is (e_a e_b ± e_b e_a)/√2: its coefficient is √2 × the ordered one */
    const w = new Map();
    for (const [k, c] of coef) {
      const [a, bb] = k.split(",").map(Number);
      if (a > bb) continue;
      if (a === bb) { if (rep === "anti") continue; add(w, k, c[0] * c[0] + c[1] * c[1]); }
      else add(w, k, 2 * (c[0] * c[0] + c[1] * c[1]));
    }
    out.push({ theta: A.theta + B.theta, w });
  }
  return out;
}

/* the near piece a basis vector belongs to */
function yukPieceOf(rep, nearLetter, key) {
  const idx = key.split(",").map(Number);
  if (idx.length === 1) return `${nearLetter[idx[0]]}|`;
  if (rep === "adj") return `${nearLetter[idx[0]]}|${nearLetter[idx[1]]}`;
  const p = nearLetter[idx[0]], q = nearLetter[idx[1]];
  return p <= q ? `${p}|${q}` : `${q}|${p}`;
}

/* THE ATTRIBUTION: for every near piece of a representation at a twist, the vacuum masses its
 * components spread into, as { overR, weight } — weights sum to the piece's dimension */
export function yukPieceSpectrum(b, theta, rep, eta, { near, vac } = {}) {
  near = near || vac5Frame(b, theta.map((x) => { let t = Math.abs(x) % 2; if (t > 1) t = 2 - t; return t < 0.5 ? 0 : 1; }));
  vac = vac || vac5Frame(b, theta);
  const nearLetter = yukNearLetters(b, near);
  const shift = eta < 0 ? 0.5 : 0;
  const per = new Map();
  for (const s of yukRepStates(b, vac, rep)) {
    const m = fold(s.theta + shift);
    for (const [k, wt] of s.w) {
      if (wt < 1e-12) continue;
      const key = yukPieceOf(rep, nearLetter, k);
      if (!per.has(key)) per.set(key, []);
      const list = per.get(key);
      const g = list.find((q) => Math.abs(q.overR - m) < 1e-9);
      if (g) g.weight += wt; else list.push({ overR: m, weight: wt });
    }
  }
  for (const list of per.values()) list.sort((p, q) => p.overR - q.overR);
  return per;
}

/* THE TABLE: every field of the cell at the nearest symmetric point, its components at the
 * vacuum, in GeV, beside the heaviest generation's measured masses */
export function yukawaTable(b, content, theta, { exp = EXPERIMENT } = {}) {
  const sm = smCellNear(b, content, theta);
  const vac = vac5Frame(b, theta);
  const ladder = vac5Ladder(vac, content);
  const out = { sm, located: ladder.mWR !== null, mWR: ladder.mWR, rows: [], why: null };
  if (!sm.cell.best) { out.why = `no cell: ${sm.cell.why}`; return out; }
  if (!out.located) { out.why = "no Wilson-line W: the vacuum is a symmetric point, and no fermion gets a mass from it"; return out; }
  const invR = invRFromW(ladder.mWR, exp.m_W.value);
  out.invRGeV = invR;
  const near = sm.near;
  const MEASURED = {
    "Q":  [{ name: "t", v: exp.m_t.value }, { name: "b", v: exp.m_b.value }],
    "uᶜ": [{ name: "t", v: exp.m_t.value }],
    "dᶜ": [{ name: "b", v: exp.m_b.value }],
    "L":  [{ name: "τ", v: exp.m_tau.value }, { name: "ν", v: 0 }],
    "eᶜ": [{ name: "τ", v: exp.m_tau.value }],
  };
  const cache = new Map();
  for (const a of sm.cell.best.assignment) {
    /* the bulk field the piece came from: the one of that representation whose twist matches the
     * piece's letters — for the fundamental, the letter itself; for two blocks, their product */
    const LB = near.blocks[a.blockA], RB = a.blockB === null ? null : near.blocks[a.blockB];
    const p0 = a.blockB === null ? LB.p0 : LB.p0 * RB.p0, p1 = a.blockB === null ? LB.p1 : LB.p1 * RB.p1;
    let eta = null;
    for (const f of content.bulk.filter((f) => f.rep === a.rep && (f.kind || "dirac") === "dirac")) {
      const e = f.eta > 0 ? 1 : -1;
      const e0 = a.chirality === "L" ? e : -e, e1 = a.chirality === "L" ? 1 : -1;
      if (p0 === e0 && p1 === e1) { eta = e; break; }
    }
    if (eta === null) continue;
    const ck = `${a.rep}|${eta}`;
    if (!cache.has(ck)) cache.set(ck, yukPieceSpectrum(b, theta, a.rep, eta, { near, vac }));
    const key = a.blockB === null ? `${a.blockA}|` : (a.rep === "adj" ? `${a.blockA}|${a.blockB}` : `${Math.min(a.blockA, a.blockB)}|${Math.max(a.blockA, a.blockB)}`);
    const spec = cache.get(ck).get(key) || [];
    const dim = spec.reduce((s, g) => s + g.weight, 0);
    out.rows.push({
      field: a.field, piece: `${a.rep} ${a.chirality} (${LB.name}${RB ? ", " + RB.name : ""})`, eta,
      components: Math.round(dim * 1e6) / 1e6,
      massless: spec.filter((g) => g.overR < 1e-9).reduce((s, g) => s + g.weight, 0),
      masses: spec.filter((g) => g.overR >= 1e-9).map((g) => ({ n: g.weight, overR: g.overR, GeV: g.overR * invR, overW: g.overR / ladder.mWR })),
      measured: MEASURED[a.field],
    });
  }
  return out;
}

export function yukawaShow(Y) {
  if (Y.why) return Y.why;
  const f = (x) => (Math.abs(x - Math.round(x)) < 1e-6 ? String(Math.round(x)) : x.toFixed(2));
  return Y.rows.map((r) => `${r.field}: ${r.massless > 1e-9 ? `${f(r.massless)} massless` : ""}${r.massless > 1e-9 && r.masses.length ? ", " : ""}` +
    r.masses.map((g) => `${f(g.n)} at ${g.overW.toFixed(2)} m_W = ${g.GeV.toFixed(1)} GeV`).join(", ")).join(" · ");
}

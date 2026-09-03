/* smcell.mjs — the Standard-Model cell at the vacuum: is SU(3)×SU(2)×U(1)_Y in there, and with
 * which massless pieces as Q, uᶜ, dᶜ, L, eᶜ — and what sin²θ_W the embedding forces.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE QUESTION EVERY MODEL BUILDER ASKS FIRST, ASKED WHERE IT MUST BE ASKED.  A boundary
 * condition and a bulk content give, at the minimum of the Wilson-line potential, a group
 * S(∏ U(m_i)) and a list of massless pieces (`vacuum5d.mjs`).  The Standard Model is in there if
 * some block of size three is colour, some block of size two is weak isospin, and some traceless
 * combination Y = Σ_k c_k Y_k of the blocks' U(1) generators gives the five left-handed fields
 * their hypercharges on pieces that carry the right colour and weak representations and are
 * singlets under every other non-abelian factor.  That is a finite search over (colour block,
 * weak block, one candidate piece per field) and, for each, an exact linear system in the c_k —
 * solved in rationals, so "1/6" is 1/6 and not 0.1667.
 *
 * THE COUNTING IS PART II's.  With K blocks there are K − 1 independent U(1)s and each assigned
 * field is one linear constraint; five fields on K − 1 unknowns is overdetermined unless the
 * charges the representations already carry make the equations dependent — which is what a
 * grand-unified embedding does.  When the assigned fields fix Y the embedding also fixes
 * sin²θ_W = tr T₃² / (tr T₃² + tr Y²) over the fundamental, 3/8 for the Georgi–Glashow direction,
 * and that number is the anchor `_test_smcell.mjs` holds this to.  When they do not fix it the
 * page says how many directions are free rather than printing a value.
 *
 * WHAT "PARTIAL" MEANS, AND WHY IT IS THE COMMON CASE.  A left-handed zero mode of the orbifold
 * always has its second parity +1 (`vac5Rep` at twist (η, +1)), so a bifundamental between two
 * letters of opposite P₁ can never be a left-handed zero mode — only its conjugate can, from the
 * right-handed chirality.  In SU(5) with P = diag(+,+,+,−,−) that is exactly Q: the (3,2)_{1/6}
 * never appears, its conjugate does, and dᶜ cannot come from the fundamental either because the
 * colour block's fundamental pieces are all left-handed.  The literature puts those fields on the
 * brane; the instrument reports them as MISSING and does not pretend.  So the search keeps the
 * largest assignment it can make and lists what is not there.
 *
 * CONJUGATION IS EXPLICIT.  A right-handed piece is a left-handed one in the conjugate
 * representation; and for SU(3) the antisymmetric IS the anti-fundamental, Λ²3 = 3̄, while for
 * SU(2) it is the singlet and the symmetric is the triplet.  Every piece is read that way before
 * it is offered as a candidate.
 */
import { an5PieceDim, an5PieceData, an5PieceCharge, an5U1Frame } from "./anomaly5d.mjs";
import { vac5Frame, vac5Pieces, vac5Rep } from "./vacuum5d.mjs";
import { R, add, sub, mul, div, neg, isZero, eq, toNum, str, ZERO, ONE } from "../kernel/charges.mjs";

/* the cell, left-handed: what each field is under colour and weak isospin, and its hypercharge */
export const SM_CELL = [
  { name: "Q",  colour: "3",  weak: "2", Y: R(1, 6) },
  { name: "uᶜ", colour: "3̄", weak: "1", Y: R(-2, 3) },
  { name: "dᶜ", colour: "3̄", weak: "1", Y: R(1, 3) },
  { name: "L",  colour: "1",  weak: "2", Y: R(-1, 2) },
  { name: "eᶜ", colour: "1",  weak: "1", Y: R(1) },
];

/* ------------------------------------------------------------------ what a piece is */

/* a piece's representation under block k, as a LEFT-HANDED field: "n", "n̄", "1", "adj", "sym",
 * "sym̄", "anti", "antī" — with the small-block identities applied (Λ²3 = 3̄, Λ²2 = 1, S²2 = 3) */
export function smUnder(frame, p, k) {
  const d = an5PieceData(frame, p, k);
  const n = frame.blocks[k].size;
  const R_ = p.chirality === "R";
  if (!d.copies || d.kind === "singlet") return "1";
  if (d.kind === "fund") {
    const bar = (d.conj < 0) !== R_;
    /* the doublet of SU(2) is pseudo-real: 2̄ ≅ 2, and a block of size one carries no group */
    if (n === 2 || n === 1) return `${n}`;
    return bar ? `${n}̄` : `${n}`;
  }
  if (d.kind === "adj") return n === 2 ? "3" : "adj";
  if (d.kind === "anti") {
    if (n === 2) return "1";
    if (n === 3) return R_ ? "3" : "3̄";
    return R_ ? "antī" : "anti";
  }
  if (d.kind === "sym") {
    if (n === 2) return "3";
    return R_ ? "sym̄" : "sym";
  }
  return "?";
}

/* a piece's hypercharge for a coefficient vector c over the blocks: Y(p) = Σ_k c_k q_k(p) */
export function smCharge(frame, p, c) {
  let y = ZERO;
  for (let k = 0; k < c.length; k++)
    if (!isZero(c[k])) y = add(y, mul(c[k], an5PieceCharge(frame, p, k)));
  return y;
}

/* the value of Y on the fundamental indices of block j, for a coefficient vector c */
export function smValueOn(frame, c, j) {
  let y = ZERO;
  for (let k = 0; k < c.length; k++)
    if (!isZero(c[k])) y = add(y, mul(c[k], an5U1Frame(frame, k)[j]));
  return y;
}

/* ------------------------------------------------------------------ exact linear algebra */

/* solve A c = b over the rationals; returns { c, rank, free } with c one solution (free
 * directions set to zero), or null when inconsistent */
export function smSolve(A, b) {
  const m = A.length, n = m ? A[0].length : 0;
  const M = A.map((row, i) => [...row.map((x) => x), b[i]]);
  const pivots = [];
  let r = 0;
  for (let col = 0; col < n && r < m; col++) {
    let piv = -1;
    for (let i = r; i < m; i++) if (!isZero(M[i][col])) { piv = i; break; }
    if (piv < 0) continue;
    [M[r], M[piv]] = [M[piv], M[r]];
    const inv = div(ONE, M[r][col]);
    M[r] = M[r].map((x) => mul(x, inv));
    for (let i = 0; i < m; i++) {
      if (i === r || isZero(M[i][col])) continue;
      const f = M[i][col];
      M[i] = M[i].map((x, j) => sub(x, mul(f, M[r][j])));
    }
    pivots.push(col);
    r++;
  }
  for (let i = r; i < m; i++) if (!isZero(M[i][n])) return null;
  const c = new Array(n).fill(ZERO);
  pivots.forEach((col, i) => { c[col] = M[i][n]; });
  return { c, rank: r, free: n - r };
}

/* ------------------------------------------------------------------ the search */

const CAP = 4000;

export function smCell(frame, content = {}) {
  const B = frame.blocks;
  const live = B.map((k, i) => i).filter((i) => B[i].size > 0);
  const pieces = vac5Pieces(frame, content).filter((p) => an5PieceDim(frame, p) > 0);
  const colours = live.filter((i) => B[i].size === 3);
  const weaks = live.filter((i) => B[i].size === 2);
  const out = { frame, pieces, colours, weaks, tried: 0, best: null,
                why: null };
  if (!colours.length) { out.why = "no block of size three: no SU(3) to be colour"; return out; }
  if (!weaks.length) { out.why = "no block of size two: no SU(2) to be weak isospin"; return out; }

  /* the U(1) coefficients: one per live block, with the relation Σ Y_k = 0 removed by pinning
   * the last live block's coefficient to zero */
  const unknowns = live.slice(0, -1);
  const labelOf = (p, cIdx, wIdx) => ({
    colour: smUnder(frame, p, cIdx), weak: smUnder(frame, p, wIdx),
    otherSinglet: live.every((k) => k === cIdx || k === wIdx || B[k].size < 2 || smUnder(frame, p, k) === "1"),
  });

  for (const cIdx of colours) for (const wIdx of weaks) {
    if (cIdx === wIdx) continue;
    /* candidates per field */
    const cand = SM_CELL.map((f) => pieces.map((p, pi) => ({ p, pi, lab: labelOf(p, cIdx, wIdx) }))
      .filter((x) => x.lab.colour === f.colour && x.lab.weak === f.weak && x.lab.otherSinglet));
    /* subsets of the five fields, largest first; within a subset every combination of candidates */
    const idx = [0, 1, 2, 3, 4];
    for (let size = 5; size >= 1; size--) {
      if (out.best && out.best.found.length > size) break;
      for (const sub_ of smSubsets(idx, size)) {
        const lists = sub_.map((f) => cand[f]);
        if (lists.some((l) => !l.length)) continue;
        for (const choice of smProduct(lists)) {
          out.tried++;
          if (out.tried > CAP) break;
          /* distinct pieces, or enough copies of one */
          const used = new Map();
          let okPieces = true;
          for (const x of choice) { used.set(x.pi, (used.get(x.pi) || 0) + 1); if (used.get(x.pi) > x.p.copies) okPieces = false; }
          if (!okPieces) continue;
          const A = choice.map((x) => unknowns.map((k) => an5PieceCharge(frame, x.p, k)));
          const b = sub_.map((f) => SM_CELL[f].Y);
          const sol = smSolve(A, b);
          if (!sol) continue;
          const c = new Array(B.length).fill(ZERO);
          unknowns.forEach((k, i) => { c[k] = sol.c[i]; });
          const rec = smRecord(frame, content, pieces, cIdx, wIdx, sub_, choice, c, sol, live);
          if (!out.best || smBetter(rec, out.best)) out.best = rec;
        }
      }
    }
  }
  if (!out.best) out.why = "no massless piece carries any field of the cell under a colour-three, weak-two split";
  return out;
}

const smBetter = (a, b) => a.found.length > b.found.length ||
  (a.found.length === b.found.length && a.free < b.free) ||
  (a.found.length === b.found.length && a.free === b.free && a.higgs.length > b.higgs.length);

function* smSubsets(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i < arr.length; i++) { acc.push(arr[i]); yield* smSubsets(arr, k, i + 1, acc); acc.pop(); }
}
function* smProduct(lists, i = 0, acc = []) {
  if (i === lists.length) { yield acc.slice(); return; }
  for (const x of lists[i]) { acc.push(x); yield* smProduct(lists, i + 1, acc); acc.pop(); }
}

function smRecord(frame, content, pieces, cIdx, wIdx, sub_, choice, c, sol, live) {
  const B = frame.blocks;
  const fixed = sol.free === 0;
  /* sin²θ_W over the fundamental: tr T₃² = d_w/2 on the weak block, tr Y² = Σ d_k m_k Y(k)² */
  let trY2 = ZERO;
  for (const k of live) {
    const v = smValueOn(frame, c, k);
    trY2 = add(trY2, mul(R(B[k].dim * B[k].size), mul(v, v)));
  }
  const trT3 = R(B[wIdx].dim, 2);
  const sin2 = fixed && !isZero(add(trT3, trY2)) ? div(trT3, add(trT3, trY2)) : null;
  /* the Higgs: massless scalars that are (1,2) with Y = ±½ under this Y — A_y and bulk scalars */
  const scalars = [];
  if (content.gauge !== false)
    for (const p of vac5Rep(frame, "adj", -1, -1)) scalars.push({ ...p, chirality: "L", copies: 1, from: "A_y" });
  for (const f of content.bulk || [])
    if ((f.kind || "dirac") === "scalar")
      for (const p of vac5Rep(frame, f.rep, f.eta > 0 ? 1 : -1, 1))
        scalars.push({ ...p, chirality: "L", copies: f.multiplicity ?? 1, from: `bulk ${f.rep}` });
  const half = R(1, 2);
  const higgs = fixed ? scalars.filter((s) => {
    const y = smCharge(frame, s, c);
    return smUnder(frame, s, cIdx) === "1" && smUnder(frame, s, wIdx) === "2" &&
           (eq(y, half) || eq(y, neg(half)));
  }).map((s) => ({ from: s.from, Y: str(smCharge(frame, s, c)) })) : [];
  const assigned = new Set(choice.map((x) => x.pi));
  const exotics = fixed ? pieces.map((p, pi) => ({ p, pi })).filter((x) => !assigned.has(x.pi)).map((x) => ({
    colour: smUnder(frame, x.p, cIdx), weak: smUnder(frame, x.p, wIdx),
    Y: str(smCharge(frame, x.p, c)), copies: x.p.copies, dim: an5PieceDim(frame, x.p),
    chirality: x.p.chirality, rep: x.p.rep,
  })) : [];
  return {
    colourBlock: cIdx, weakBlock: wIdx, colourName: B[cIdx].name, weakName: B[wIdx].name,
    found: sub_.map((f) => SM_CELL[f].name), missing: SM_CELL.filter((_, f) => !sub_.includes(f)).map((f) => f.name),
    assignment: sub_.map((f, i) => ({ field: SM_CELL[f].name, rep: choice[i].p.rep, chirality: choice[i].p.chirality,
                                       blockA: choice[i].p.blockA, blockB: choice[i].p.blockB })),
    coefficients: c.map(str), Yvalues: live.map((k) => ({ block: B[k].name, Y: str(smValueOn(frame, c, k)) })),
    free: sol.free, rank: sol.rank, fixed, sin2: sin2 ? str(sin2) : null, sin2num: sin2 ? toNum(sin2) : null,
    higgs, exotics,
  };
}

/* the dossier's one-line reading */
export function smShow(res) {
  if (!res.best) return `no — ${res.why}`;
  const b = res.best;
  const head = b.found.length === 5 ? "yes, all five" : `${b.found.length} of 5 (${b.found.join(", ")}; missing ${b.missing.join(", ")})`;
  const y = b.fixed ? `Y fixed, sin²θ_W = ${b.sin2}` : `Y not fixed (${b.free} free direction${b.free === 1 ? "" : "s"})`;
  const h = b.fixed ? (b.higgs.length ? `Higgs doublet: ${b.higgs.length}` : "no Higgs doublet") : "";
  return [head, y, h].filter(Boolean).join("; ");
}

export const smCellAt = (b, content, theta = []) => smCell(vac5Frame(b, theta), content);

/* THE CELL IS READ AT THE SYMMETRIC POINT NEAREST THE VACUUM, and that is physics, not a
 * convenience.  At the electroweak vacuum SU(2)×U(1)_Y is BROKEN to U(1)_em — that is what the
 * Wilson line is for — so asking for an unbroken SU(2) block at the minimum would refuse every
 * realistic model.  The Standard Model a model builder means is the content at the symmetric
 * point the vacuum sits next to, deformed by a small angle t that is m_W·R.  Rounding each phase
 * to 0 or 1 picks that point; it is a CLASS-MATE of the boundary condition on screen, chosen by
 * the vacuum, so the reading is the theory's and not the frame's.  The distance says whether
 * "small" is true — at t near ½ there is no light electroweak sector to speak of — and the
 * rotated pairs say which blocks the vacuum actually breaks: the weak block should be among them
 * and the colour block must not. */
export function smCellNear(b, content, theta = []) {
  const rounded = theta.map((x) => { let t = Math.abs(x) % 2; if (t > 1) t = 2 - t; return t < 0.5 ? 0 : 1; });
  const distance = theta.length ? Math.max(...theta.map((x, i) => {
    let t = Math.abs(x) % 2; if (t > 1) t = 2 - t; return Math.abs(t - rounded[i]); })) : 0;
  const near = vac5Frame(b, rounded);
  const cell = smCell(near, content);
  const vac = vac5Frame(b, theta);
  /* which of the near frame's letters lose indices to a rotated pair at the vacuum */
  const broken = [];
  for (const p of vac.pairs) {
    if (p.t < vac.eps || p.t > 1 - vac.eps) continue;
    broken.push(p.kind === "A" ? "(+,+)/(−,−)" : "(+,−)/(−,+)");
  }
  const touches = (name) => broken.some((s) => s.includes(name));
  const b_ = cell.best;
  return {
    rounded, distance, near, cell, brokenPairs: [...new Set(broken)],
    weakBroken: b_ ? touches(b_.weakName) : null,
    colourBroken: b_ ? touches(b_.colourName) : null,
    nearSymmetric: distance < 0.25,
  };
}

export function smShowNear(n) {
  const head = smShow(n.cell);
  if (!n.cell.best) return head;
  const where = n.distance === 0 ? "the vacuum IS this symmetric point"
    : `vacuum at distance ${n.distance.toFixed(4)} from it`;
  const ew = n.weakBroken === null ? "" : n.weakBroken ? "; the vacuum breaks the weak block" : "; the weak block is unbroken by the vacuum";
  const col = n.colourBroken ? "; THE VACUUM BREAKS COLOUR" : "";
  return `${head} — ${where}${ew}${col}`;
}

/* spectrum5d.mjs — what a 5D SU(N) model on S¹/Z₂ actually CONTAINS: the 4D fields.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE FIRST QUESTION OF MODEL BUILDING, AND THE ONE THIS INSTRUMENT COULD NOT ANSWER.  `sun5d.mjs`
 * gives the Wilson-line potential of any boundary condition and `bcclass.mjs` says which boundary
 * conditions are the same theory — but neither says what the theory HAS: which four-dimensional
 * fields survive, massless or not, and with which quantum numbers.  That is Table 1 of every paper
 * in this field, and it is what a reader needs before any of the dynamics means anything.
 *
 * WHERE IT ALL COMES FROM.  One rule, Haba–Yamashita eq. (3.5): the mode expansion is fixed by the
 * pair of Z₂ parities a state carries.
 *
 *     (+,+)   cos(ny/R),  n ≥ 0    → masses n/R      — and a ZERO MODE
 *     (−,−)   sin(ny/R),  n ≥ 1    → masses n/R      — no zero mode
 *     (+,−)   cos((n+½)y/R)        → masses (n+½)/R  — no zero mode
 *     (−,+)   sin((n+½)y/R)        → masses (n+½)/R  — no zero mode
 *
 * So the massless four-dimensional content is exactly the (+,+) part, and everything else is a
 * tower.  Two riders that do all the physics:
 *
 *   A_y CARRIES THE OPPOSITE PARITY TO A_μ.  So the massless vectors are the block-diagonal part
 *   of the adjoint — the unbroken group — and the massless SCALARS are its (−,−) part, which is
 *   where the Wilson lines live.  The Higgs candidates are the off-diagonal blocks that pair
 *   (+,+) with (−,−) and (+,−) with (−,+).
 *
 *   A DIRAC FERMION'S TWO CHIRALITIES CARRY OPPOSITE PARITIES, because the orbifold condition
 *   carries a γ₅ (their eqs. (3.4)–(3.5)).  At most one of them can be (+,+), so a massless
 *   four-dimensional fermion is automatically CHIRAL — which is the whole reason for orbifolding.
 *
 * AND WITH THE WILSON LINE ON, the tower shifts by the state's charge.  In a gauge where the VEV is
 * diagonal it is a weight vector w with ±θ_k/2 on the k-th index of the (+,+) and (−,−) blocks and
 * ±φ_k/2 on the (+,−) and (−,+) ones; a state's charge is w_i for the fundamental, w_i − w_j for
 * the adjoint, w_i + w_j for the two tensors, and its mass is |n + offset + Q|/R.
 *
 * THE SPECTRUM AND THE POTENTIAL ARE THE SAME DATA.  A cosine in `sun5d.mjs` with argument c·θ is
 * a pair of states at charge ±c/2, and the (−1) shift is the half-integer tower.  So the two
 * modules are two readings of one object, and `_test_spectrum5d.mjs` checks that they agree
 * instead of leaving it as a remark — which is the strongest control either of them has.
 */

import { sun5dRepTerms } from "./sun5d.mjs";

/* the four blocks, in the order the parities are written: (+,+), (+,−), (−,+), (−,−) */
export function sp5Blocks(b) {
  return [
    { i: 0, name: "(+,+)", size: b.nPP, P0: +1, P1: +1 },
    { i: 1, name: "(+,−)", size: b.nPM, P0: +1, P1: -1 },
    { i: 2, name: "(−,+)", size: b.nMP, P0: -1, P1: +1 },
    { i: 3, name: "(−,−)", size: b.nMM, P0: -1, P1: -1 },
  ];
}

/* THE DIAGONAL WEIGHTS.  A Wilson line can be rotated to the diagonal, and there it puts ±θ_k/2 on
 * one index of the (+,+) block and its partner in (−,−), and ±φ_k/2 on one index of (+,−) and its
 * partner in (−,+).  How many of each is A = min(n₊₊, n₋₋) and B = min(n₊₋, n₋₊) — Haba–Yamashita
 * eq. (5.4), the same count `sun5d.mjs` reports as the number of phases. */
export function sp5Weights(b, theta = []) {
  const B = sp5Blocks(b), w = [], block = [];
  const put = (blk, sign, phases) => {
    for (let k = 0; k < blk.size; k++) {
      w.push(k < phases.length ? sign * phases[k] / 2 : 0);
      block.push(blk.i);
    }
  };
  const a = theta.slice(0, b.A), f = theta.slice(b.A, b.A + b.B);
  put(B[0], +1, a);
  put(B[1], +1, f);
  put(B[2], -1, f);
  put(B[3], -1, a);
  return { w, block, blocks: B };
}

/* ------------------------------------------------------------------ the states */

const REP_KIND = { fund: "single", adj: "pair", anti: "pair", sym: "pair" };

/* Every component of one representation, with the parity pair it carries, the charge it has under
 * the Wilson line, and which block(s) it came from.  `eta` is ηη′ split as [η, η′]; the gauge
 * field's A_y is the adjoint with both flipped, which is what `flip` is for. */
export function sp5States(b, rep, [eta0, eta1] = [1, 1], theta = [], { flip = false,
                                                                      traceless = true } = {}) {
  const { w, block, blocks } = sp5Weights(b, theta);
  const N = w.length;
  const s0 = flip ? -eta0 : eta0, s1 = flip ? -eta1 : eta1;
  const out = [];
  const push = (P0, P1, Q, ba, bb) =>
    out.push({ P0, P1, Q, blockA: ba, blockB: bb,
               half: P0 * P1 < 0 ? 0.5 : 0 });

  if (REP_KIND[rep] === "single") {
    for (let i = 0; i < N; i++)
      push(s0 * blocks[block[i]].P0, s1 * blocks[block[i]].P1, w[i], block[i], null);
    return out;
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (rep === "anti" && !(i < j)) continue;
      if (rep === "sym" && !(i <= j)) continue;
      const P0 = s0 * blocks[block[i]].P0 * blocks[block[j]].P0;
      const P1 = s1 * blocks[block[i]].P1 * blocks[block[j]].P1;
      push(P0, P1, rep === "adj" ? w[i] - w[j] : w[i] + w[j], block[i], block[j]);
    }
  /* THE ADJOINT IS TRACELESS, and the removed direction is a definite state, not a bookkeeping
   * decrement: the identity commutes with everything, so it has charge 0 and carries the bare
   * parity (η, η′) — which for A_y, whose parities are flipped, is (−η, −η′).  Removing it in one
   * place means every count downstream — sectors, zero modes, families — is right without each
   * of them remembering to subtract. */
  if (rep === "adj" && traceless) {
    const k = out.findIndex((s) => Math.abs(s.Q) < 1e-12 && s.P0 === s0 && s.P1 === s1);
    if (k < 0) throw new Error("the adjoint has no trace direction to remove; the weights are wrong");
    out.splice(k, 1);
  }
  return out;
}

/* the four N^(P₀P₁) of HHK eq. (3.20), derived from the components rather than transcribed */
export function sp5Sectors(b, rep, eta = [1, 1]) {
  const out = { "++": 0, "+-": 0, "-+": 0, "--": 0 };
  for (const s of sp5States(b, rep, eta))
    out[`${s.P0 > 0 ? "+" : "-"}${s.P1 > 0 ? "+" : "-"}`]++;
  return out;
}

/* ------------------------------------------------------------------ the massless content */

/* SU(1) is not a group: a block of size one leaves a singlet, and printing "1 fundamental" invites
 * a reader to look for a group that is not there. */
const SU = (n) => (n >= 2 ? `SU(${n})` : n === 1 ? "singlet" : "—");

function repLabel(b, rep, ba, bb) {
  const B = sp5Blocks(b);
  const n = (i) => B[i].size;
  const lab = (i, what) => (n(i) >= 2 ? `${SU(n(i))} ${what}` : "singlet");
  if (bb === null) return `(${lab(ba, "fundamental")})`;
  if (ba === bb) {
    if (rep === "adj") return n(ba) >= 2 ? `(${SU(n(ba))} adjoint + singlet)` : "(singlet)";
    if (rep === "anti") return `(${lab(ba, "antisymmetric")})`;
    return `(${lab(ba, "symmetric")})`;
  }
  return `(${SU(n(ba))}, ${SU(n(bb))}) bifundamental`;
}

/* THE FOUR-DIMENSIONAL MASSLESS FIELDS.  Vectors from A_μ, scalars from A_y — which carries the
 * opposite parity, so the scalars sit exactly where the vectors do not — and one chirality of each
 * Dirac fermion.  Counted as REAL components for the gauge sector and as complex ones for matter,
 * and the panel says which. */
export function sp5ZeroModes(b, content = {}) {
  const groups = new Map();
  const add = (kind, rep, chir, ba, bb, n) => {
    if (!n) return;
    const k = `${kind}|${rep}|${chir}|${ba}|${bb}`;
    const cur = groups.get(k);
    if (cur) cur.n += n;
    else groups.set(k, { kind, rep, chirality: chir, blockA: ba, blockB: bb, n,
                         label: repLabel(b, rep, ba, bb) });
  };
  const tally = (states, kind, rep, chir) => {
    for (const s of states) if (s.P0 > 0 && s.P1 > 0) add(kind, rep, chir, s.blockA, s.blockB, 1);
  };

  if (content.gauge !== false) {
    tally(sp5States(b, "adj", [1, 1]), "vector", "adj", null);
    /* A_y is the adjoint with BOTH parities flipped: its zero modes are the (−,−) part of A_μ */
    tally(sp5States(b, "adj", [1, 1], [], { flip: true }), "scalar", "adj", null);
  }
  for (const f of content.bulk || []) {
    const m = f.multiplicity ?? 1;
    const eta = [f.eta > 0 ? 1 : -1, 1];
    /* only the PRODUCT ηη′ is physical (their (3.4)-(3.5)), so the split is a convention and the
     * page says so; the two chiralities of a Dirac fermion carry opposite parities */
    for (let k = 0; k < m; k++) {
      if ((f.kind || "dirac") === "scalar") tally(sp5States(b, f.rep, eta), "scalar", f.rep, null);
      else {
        tally(sp5States(b, f.rep, eta), "fermion", f.rep, "L");
        tally(sp5States(b, f.rep, eta, [], { flip: true }), "fermion", f.rep, "R");
      }
    }
  }
  const list = [...groups.values()];
  const sum = (k) => list.filter((x) => x.kind === k).reduce((a, x) => a + x.n, 0);
  return { list, vectors: sum("vector"), scalars: sum("scalar"), fermions: sum("fermion") };
}

/* ------------------------------------------------------------------ the tower */

/* THE EIGENVALUE FAMILIES, WHICH IS WHAT THE PAPERS ACTUALLY PUBLISH — and deliberately not a
 * level-by-level tower.
 *
 * Haba–Yamashita state the spectrum as a multiset of families: "2 × n², (n ± a)², 2 × (n ± a/2)²"
 * for their SU(3) model, and the same shape for the others.  A family is a multiplicity, a
 * Kaluza-Klein offset (0 or ½) and a charge, and that is a complete, transcribable, checkable
 * object — this function returns exactly it, and `_test_spectrum5d.mjs` holds four of their
 * equations to it verbatim.
 *
 * Turning families into a list of levels would need the cos/sin bookkeeping at n = 0, and that is
 * precisely where the two integer families differ: a (+,+) state expands in cos and HAS a zero
 * mode, a (−,−) state expands in sin and has none.  The massless content therefore comes from the
 * PARITY rule (`sp5ZeroModes`), not from evaluating a family at n = 0 — and drawing a tower that
 * quietly did the latter would put states at zero mass that are not there.  So the families are
 * reported and the massless content is computed separately, which is also how the sources present
 * it. */
export function sp5Families(b, rep, eta = [1, 1], theta = [], opts = {}) {
  const m = new Map();
  for (const s of sp5States(b, rep, eta, theta, opts)) {
    const key = `${s.half}|${(+s.Q.toFixed(9))}`;
    const cur = m.get(key);
    if (cur) cur.n++;
    else m.set(key, { n: 1, half: s.half, Q: s.Q,
                      zeroModes: s.P0 > 0 && s.P1 > 0 });
  }
  return [...m.values()].sort((x, y) => x.half - y.half || x.Q - y.Q);
}

/* the same for a whole content, tagged by what the family is made of */
export function sp5AllFamilies(b, content = {}, theta = []) {
  const out = [];
  if (content.gauge !== false) {
    out.push({ from: "A_μ (gauge)", rep: "adj",
               families: sp5Families(b, "adj", [1, 1], theta) });
    out.push({ from: "A_y (the Wilson lines)", rep: "adj",
               families: sp5Families(b, "adj", [1, 1], theta, { flip: true }) });
  }
  for (const f of content.bulk || []) {
    const eta = [f.eta > 0 ? 1 : -1, 1];
    const kind = f.kind || "dirac";
    const n = f.multiplicity ?? 1;
    if (!n) continue;
    if (kind === "scalar")
      out.push({ from: `${n}× complex scalar, ηη′ = ${f.eta > 0 ? "+" : "−"}`, rep: f.rep, mult: n,
                 families: sp5Families(b, f.rep, eta, theta) });
    else {
      out.push({ from: `${n}× Dirac ${f.rep}, ηη′ = ${f.eta > 0 ? "+" : "−"} (left)`, rep: f.rep,
                 mult: n, families: sp5Families(b, f.rep, eta, theta) });
      out.push({ from: `${n}× Dirac ${f.rep}, ηη′ = ${f.eta > 0 ? "+" : "−"} (right)`, rep: f.rep,
                 mult: n, families: sp5Families(b, f.rep, eta, theta, { flip: true }) });
    }
  }
  return out;
}

/* a family in the notation the papers print: `2 x (n ± a/2)²` */
export function sp5ShowFamily(f, names = ["a", "b", "c"]) {
  const off = f.half ? " + ½" : "";
  if (Math.abs(f.Q) < 1e-12) return `${f.n} × (n${off})²`;
  /* the charge is a half-integer combination of the phases; printed as the papers print it */
  const q = Math.abs(f.Q);
  const txt = Math.abs(q - 0.5) < 1e-9 ? `${names[0]}/2`
            : Math.abs(q - 1) < 1e-9 ? names[0]
            : `${(+q.toFixed(4))}`;
  return `${f.n} × (n${off} ${f.Q > 0 ? "+" : "−"} ${txt})²`;
}

/* ------------------------------------------------------------------ the cross-check */

/* THE SPECTRUM AGAINST THE POTENTIAL, which is the control that makes both modules trustworthy.
 * A cosine `m·cos(nπ(v·θ − d))` in the potential of one representation is the pair of states at
 * charge ±(v·θ)/2 in the tower of the same representation, with d = 1 meaning the half-integer
 * one.  Summing cos(2πnQ) over the states of a representation must therefore reproduce the
 * potential's own bracket, and this returns both sides at a given n so a harness can compare. */
export function sp5PotentialCheck(b, rep, eta, theta, n = 1) {
  const states = sp5States(b, rep, [eta, 1], theta);
  let fromStates = 0;
  for (const s of states) fromStates += Math.cos(2 * Math.PI * n * (s.Q + s.half));
  let fromTerms = 0;
  for (const t of sun5dRepTerms(b, rep, eta)) {
    let x = 0;
    for (let i = 0; i < t.v.length; i++) x += t.v[i] * theta[i];
    fromTerms += t.m * (t.d ? (n % 2 ? -1 : 1) : 1) * Math.cos(n * Math.PI * x);
  }
  /* the potential drops every charge-independent term; the states do not, so the constant is
   * measured here and reported rather than quietly subtracted */
  const constant = states.filter((s) => Math.abs(s.Q) < 1e-12)
                         .reduce((a, s) => a + Math.cos(2 * Math.PI * n * s.half), 0);
  return { fromStates, fromTerms, constant, moving: fromStates - constant };
}

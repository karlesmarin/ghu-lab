/* anomaly5d.mjs — the anomaly ledger of a 5D SU(N) orbifold model, channel by channel.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT KILLS MOST MODELS.  A boundary condition and a bulk content give a chiral four-dimensional
 * spectrum — `spectrum5d.mjs` computes it — and a chiral spectrum is inconsistent unless its gauge
 * anomalies cancel.  That check is tedious, it has to be done channel by channel, and it is where
 * an arithmetic slip hides best.  So it belongs in the instrument.
 *
 * WHAT THE ANOMALY OF AN ORBIFOLD THEORY IS, AND WHY THE FOUR-DIMENSIONAL ONE IS THE RIGHT OBJECT.
 * Arkani-Hamed, Cohen and Georgi (hep-th/0103135) compute it on S¹/Z₂ and find, their eq. (4.38),
 *
 *     ∂_C J^C  =  ½ [ δ(x₄) + δ(x₄ − L) ] Q ,
 *
 * with Q the four-dimensional anomaly of the chiral zero mode.  In their words: "the anomaly
 * appears *split* between the two fixed points — if we integrate over the extra dimension we pick
 * up one-half of the anomaly of a chiral mode from x₄ = 0 and one-half from x₄ = L", and
 * "**the cancellation of the four-dimensional anomaly is sufficient** to eliminate the
 * five-dimensional anomaly".  There is no anomaly in the bulk, and none of it depends on the shape
 * of the mode.  So the ledger below computes the four-dimensional anomaly of the massless content
 * and that is the object to cancel.
 *
 * AND WHAT THIS LEDGER IS NOT.  Two limits, both stated on the page rather than buried here:
 *
 *   - ACG's split is even for the case they treat.  When the orbifold *breaks* the group, the
 *     distribution between the two fixed points is not automatic — the local unbroken groups
 *     differ and the localised anomalies can be individually non-zero with a vanishing sum, to be
 *     absorbed by a Chern-Simons term or by brane fields.  This panel reports the SUM.
 *   - Every model of this kind carries brane fields, because the unwanted zero modes have to be
 *     given mass, and Komori-Maru say so in as many words after their eq. (76): one introduces the
 *     4D fermion CONJUGATE to each unwanted zero mode.  A conjugate brane fermion contributes to
 *     the same channels with the OPPOSITE sign.  So a non-zero entry here is not a verdict of
 *     inconsistency: it is the bill the brane has to pay, and the ledger says how much.
 *
 * EVERYTHING IS EXACT.  Charges are rationals with denominator dividing N, indices and cubic
 * anomalies are the textbook values for the representations that occur, and the arithmetic is done
 * in integers scaled by N³ so that "zero" means zero and not 1e-16.
 */

import { sun5dBlocks } from "./sun5d.mjs";
import { sp5ZeroModes } from "./spectrum5d.mjs";
import { R, add, mul, isZero, toNum, str } from "../kernel/charges.mjs";

/* ------------------------------------------------------------------ exact rationals
 *
 * NOT A SECOND IMPLEMENTATION.  `src/kernel/charges.mjs` already carries the exact-rational
 * arithmetic Part VI's charge work is done in — R, add, mul, isZero, toNum, str — and an anomaly
 * ledger is precisely the neighbour that should be using it.  The first version of this file
 * declared its own `gcd` and the build's collision guard refused it by name, which is the guard
 * doing what it is for: two implementations of the same arithmetic in one scope is a bug waiting
 * for the day they disagree.
 *
 * The aliases below are DECLARATIONS and not renamed imports, because the inliner strips import
 * lines and a renamed import would simply be undefined in the built page. */
const rat = (n, d = 1) => R(n, d);
const rAdd = (x, y) => add(x, y);
const rMul = (x, y) => mul(x, y);
const rZero = (x) => isZero(x);
export const rShow = (x) => str(x);
export const rNum = (x) => toNum(x);

/* ------------------------------------------------------------------ the group theory */

/* The four canonical U(1) generators: Y_a is 1 on block a and 0 elsewhere, made traceless by
 * subtracting n_a/N.  There are four and one relation, Σ_a Y_a = 0, so three are independent —
 * which is the U(1)³ the unbroken group carries.  All four are reported and the relation is
 * stated, because choosing three would be choosing a basis and hiding it. */
export function an5U1(b, c) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  /* the VALUE of Y_c on block a is δ_{ac} − n_c/N.  The first version wrote n_a where n_c belongs
   * and produced generators that were not traceless — which the first check caught, and which
   * would otherwise have poisoned every U(1) channel silently. */
  return sizes.map((_, a) => rat((a === c ? b.N : 0) - sizes[c], b.N));
}

/* index and cubic anomaly of the representations that occur, for SU(n).  Textbook; the harness
 * re-derives them from fund ⊗ fund = sym ⊕ antisym rather than trusting the table. */
const T_OF = { fund: (n) => rat(1, 2), adj: (n) => rat(n), anti: (n) => rat(n - 2, 2),
               sym: (n) => rat(n + 2, 2), singlet: () => rat(0) };
const A_OF = { fund: () => rat(1), adj: () => rat(0), anti: (n) => rat(n - 4),
               sym: (n) => rat(n + 4), singlet: () => rat(0) };

/* ------------------------------------------------------------------ the massless pieces */

/* Every massless piece as a REPRESENTATION with a multiplicity, rather than as a component count.
 * `sp5ZeroModes` aggregates components, which is the right thing for a spectrum table and the
 * wrong thing for an anomaly: three copies of a fundamental of SU(3) are nine components and three
 * representations.  `_test_anomaly5d.mjs` checks the two agree on the component count, which is
 * two routes to one number rather than one routine used twice. */
export function an5Pieces(b, content = {}) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  const SIGN = [[+1, +1], [+1, -1], [-1, +1], [-1, -1]];
  const out = [];
  const emit = (rep, ba, bb, chir, copies) => {
    if (!copies) return;
    if (sizes[ba] === 0 || (bb !== null && sizes[bb] === 0)) return;
    const p = { rep, blockA: ba, blockB: bb, chirality: chir, copies };
    /* a piece with no states is not a piece: the antisymmetric of a block of size one is empty,
     * and emitting it would put an entry in the ledger that stands for nothing */
    if (pieceDim(b, p) === 0) return;
    out.push(p);
  };
  for (const f of content.bulk || []) {
    if ((f.kind || "dirac") !== "dirac") continue;      /* scalars carry no gauge anomaly */
    const m = f.multiplicity ?? 1;
    const eta = f.eta > 0 ? 1 : -1;
    for (const [chir, flip] of [["L", 1], ["R", -1]]) {
      const s0 = flip * eta, s1 = flip * 1;
      if (f.rep === "fund") {
        for (let a = 0; a < 4; a++)
          if (s0 * SIGN[a][0] > 0 && s1 * SIGN[a][1] > 0) emit("fund", a, null, chir, m);
        continue;
      }
      for (let a = 0; a < 4; a++)
        for (let bb = 0; bb < 4; bb++) {
          if (f.rep !== "adj" && bb < a) continue;      /* the tensors are (anti)symmetric */
          const P0 = s0 * SIGN[a][0] * SIGN[bb][0], P1 = s1 * SIGN[a][1] * SIGN[bb][1];
          if (!(P0 > 0 && P1 > 0)) continue;
          emit(f.rep, a, bb, chir, m);
        }
    }
  }
  return out;
}

/* what a piece looks like under the SU factor of block k, and its U(1) charges */
function pieceData(b, p, k) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  const nk = sizes[k];
  if (p.blockB === null)
    return { kind: p.blockA === k ? "fund" : "singlet", copies: p.blockA === k ? 1 : 0, nk, conj: 1 };
  if (p.blockA === p.blockB) {
    if (p.blockA !== k) return { kind: "singlet", copies: 0, nk, conj: 1 };
    return { kind: p.rep === "adj" ? "adj" : p.rep, copies: 1, nk, conj: 1 };
  }
  /* AN OFF-DIAGONAL PIECE IS A BIFUNDAMENTAL — and for the ADJOINT its second index is
   * ANTI-fundamental, because the adjoint is a matrix M^a_b.  Missing that made an adjoint bulk
   * fermion look anomalous: its two off-diagonal pieces (a,b) and (b,a) are conjugate to each
   * other and must cancel, and with both counted as plain fundamentals they added instead.  The
   * adjoint is a REAL representation and can never carry a cubic anomaly; that is now a control. */
  if (p.blockA === k) return { kind: "fund", copies: sizes[p.blockB], nk, conj: 1 };
  if (p.blockB === k)
    return { kind: "fund", copies: sizes[p.blockA], nk, conj: p.rep === "adj" ? -1 : 1 };
  return { kind: "singlet", copies: 0, nk, conj: 1 };
}

/* the U(1)_c charge of a piece.  A right-handed field is counted as a left-handed one in the
 * conjugate representation, so its charges and its cubic anomaly flip sign. */
function pieceCharge(b, p, c) {
  const Y = an5U1(b, c);
  const q = p.blockB === null ? Y[p.blockA]
          : p.rep === "adj" ? rAdd(Y[p.blockA], rMul(rat(-1), Y[p.blockB]))
          : rAdd(Y[p.blockA], Y[p.blockB]);
  return p.chirality === "R" ? rMul(rat(-1), q) : q;
}

/* how many states a piece has, which is the multiplicity a U(1)-only channel sums over */
function pieceDim(b, p) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  const na = sizes[p.blockA];
  if (p.blockB === null) return na;
  const nb = sizes[p.blockB];
  if (p.blockA !== p.blockB) return na * nb;
  if (p.rep === "adj") return na * na;
  if (p.rep === "anti") return (na * (na - 1)) / 2;
  return (na * (na + 1)) / 2;
}

/* ------------------------------------------------------------------ the ledger */

/* Every channel the unbroken group has, with its coefficient.  Left-handed convention throughout:
 * a right-handed Weyl fermion is a left-handed one in the conjugate, so U(1) charges and cubic
 * anomalies flip and the index T does not. */
export const an5Ledger = (b, content = {}) => an5LedgerFromPieces(b, an5Pieces(b, content));

/* the same, on a piece list handed in directly — which is what lets a harness feed a piece and its
 * conjugate and demand zero, the one test every sign convention in here has to survive */
export function an5LedgerFromPieces(b, pieces) {
  const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
  const NAMES = ["(+,+)", "(+,−)", "(−,+)", "(−,−)"];
  const rows = [];

  /* [SU(n_k)]³ */
  for (let k = 0; k < 4; k++) {
    if (sizes[k] < 3) continue;              /* SU(2) has no cubic anomaly, SU(1) is nothing */
    let tot = rat(0);
    for (const p of pieces) {
      const d = pieceData(b, p, k);
      if (!d.copies) continue;
      let A = rMul(rat(d.conj), A_OF[d.kind](d.nk));
      if (p.chirality === "R") A = rMul(rat(-1), A);
      tot = rAdd(tot, rMul(rat(d.copies * p.copies), A));
    }
    rows.push({ channel: `[SU(${sizes[k]})${NAMES[k]}]³`, kind: "cubic-nonabelian", value: tot });
  }

  /* WHICH U(1)s EXIST.  With k blocks filled the unbroken group carries k − 1 abelian factors, not
   * four: if only one block is filled, every Y_c vanishes identically on it and there is no U(1)
   * at all.  Listing a channel whose generator is the zero matrix would print rows that are zero
   * for no reason, which reads as a cancellation and is not one. */
  const live = [0, 1, 2, 3].filter((c) => {
    const Y = an5U1(b, c);
    return sizes.some((n, a) => n > 0 && !rZero(Y[a]));
  });

  /* U(1)_c × [SU(n_k)]² */
  for (const c of live) {
    for (let k = 0; k < 4; k++) {
      if (sizes[k] < 2) continue;
      let tot = rat(0);
      for (const p of pieces) {
        const d = pieceData(b, p, k);
        if (!d.copies) continue;
        tot = rAdd(tot, rMul(rat(d.copies * p.copies), rMul(T_OF[d.kind](d.nk), pieceCharge(b, p, c))));
      }
      rows.push({ channel: `U(1)${NAMES[c]} × [SU(${sizes[k]})${NAMES[k]}]²`, kind: "mixed",
                  value: tot });
    }
  }

  /* U(1)³ and U(1) × grav²: sums over states */
  for (const c of live) {
    let cube = rat(0), grav = rat(0);
    for (const p of pieces) {
      const q = pieceCharge(b, p, c), n = rat(pieceDim(b, p) * p.copies);
      cube = rAdd(cube, rMul(n, rMul(q, rMul(q, q))));
      grav = rAdd(grav, rMul(n, q));
    }
    rows.push({ channel: `U(1)${NAMES[c]}³`, kind: "cubic-abelian", value: cube });
    rows.push({ channel: `U(1)${NAMES[c]} × [grav]²`, kind: "gravitational", value: grav });
  }

  const bad = rows.filter((r) => !rZero(r.value));
  return { pieces, rows, clean: bad.length === 0, offending: bad,
           nFermions: pieces.reduce((a, p) => a + pieceDim(b, p) * p.copies, 0) };
}

/* the same ledger for an arbitrary SU(N) boundary condition given as four block sizes */
export const an5For = (spec, content) => an5Ledger(sun5dBlocks(spec), content);

/* ------------------------------------------------------------------ the component control */

/* The component count of the massless fermions, by the ledger's own route — to be compared with
 * `sp5ZeroModes`, which reaches it another way.
 *
 * THE ADJOINT IS TRACELESS and this module does not remove the trace, because the trace direction
 * is a singlet of every SU factor with zero charge under every U(1): it contributes to no channel,
 * so for an ANOMALY it does not matter.  For a COUNT it does, and `spectrum5d.mjs` removes it —
 * so the offset is subtracted here, named, rather than left as a discrepancy of one that a reader
 * would have to chase. */
export function an5TraceModes(b, content = {}) {
  let n = 0;
  for (const f of content.bulk || []) {
    if ((f.kind || "dirac") !== "dirac" || f.rep !== "adj") continue;
    /* the trace carries the bare parity (η, η′); it is a zero mode exactly when that is (+,+) */
    if ((f.eta > 0 ? 1 : -1) > 0) n += f.multiplicity ?? 1;
  }
  return n;
}

export function an5FermionComponents(b, content) {
  return an5Pieces(b, content).reduce((a, p) => a + pieceDim(b, p) * p.copies, 0)
       - an5TraceModes(b, content);
}

export const an5SpectrumComponents = (b, content) => sp5ZeroModes(b, content).fermions;

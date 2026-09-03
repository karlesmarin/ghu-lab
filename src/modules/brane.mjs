/* brane.mjs — matter on the fixed points: who pays the anomaly bill, and which zero modes it lifts.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE PANEL NEXT DOOR STOPS ONE STEP SHORT, ON PURPOSE.  `anomaly5d.mjs` computes the bill a chiral
 * spectrum runs up and then says, in as many words, that a non-zero row is not a verdict: every
 * model of this kind carries fields on the fixed points, because the unwanted zero modes have to be
 * given mass, and Komori and Maru say how right after their eq. (76) — one introduces the 4D
 * fermion CONJUGATE to each unwanted zero mode.  That sentence has been sitting in the header of
 * that module as an apology.  This module is the sentence, computed: put matter on the branes and
 * the same ledger runs over bulk and brane together, the same pieces go through Part I's mass gate,
 * and both halves of the answer come back with the arithmetic attached.
 *
 * THE FOUR FACTS IT IS BUILT ON, EACH WITH ITS OWN CONSEQUENCE.
 *
 *   1. A BRANE FIELD IS A REPRESENTATION OF THE LOCAL GROUP, NOT OF THE UNBROKEN ONE.  At y = 0
 *      only the reflection P₀ acts, so the symmetry a field there must respect is the commutant of
 *      P₀ alone: with the parities simultaneously diagonal, S(U(n₊₊ + n₊₋) × U(n₋₊ + n₋₋)).  At
 *      y = πR it is the commutant of P₁, S(U(n₊₊ + n₋₊) × U(n₊₋ + n₋₋)).  THE TWO ARE DIFFERENT
 *      GROUPS whenever the orbifold breaks anything, and that is not a detail: a field that exists
 *      at one fixed point may be no representation at all at the other.
 *
 *   2. SO IT COMES IN A PACKAGE.  The unbroken group is the intersection, and a local irreducible
 *      representation decomposes into SEVERAL of its pieces.  You therefore cannot put "the
 *      conjugate of that one zero mode" on a brane and stop: whatever else sits in the same local
 *      representation arrives with it.  `brPartnersFor` is that statement as a list — the candidate
 *      brane fields that contain a given conjugate, and what each of them drags along.
 *
 *   3. ITS ABELIAN CHARGE IS FREE, AND THAT IS WHERE THE BILL IS PAID.  The local group has a U(1)
 *      of its own, and a representation of SU(a) × SU(b) × U(1) may carry any rational charge under
 *      it — nothing forces the value an SU(N) representation would have given.  Shifting it moves
 *      the field's weight along one Cartan direction, so every U(1)_c charge of every piece shifts
 *      by a fixed rational (`brShiftDirection`, exact).  Part VI does this for one number and finds
 *      three channels forcing it to a single value; `brSolveCharges` is that solve for any model,
 *      over the channels that are LINEAR in the charges, with the non-linear ones checked after.
 *
 *   4. AND THE SAME FREEDOM COSTS THE MASS.  A boundary mass term χ Ψ|_fp is gauge invariant only
 *      if the charges cancel, so a brane field whose charge was shifted to pay the anomaly no
 *      longer pairs with the zero mode it was introduced to lift.  The two jobs are the same field
 *      and they can pull apart; `brBill` and `brMassGate` are run side by side for that reason.
 *
 * THE MASS GATE IS PART I's, TRANSPLANTED.  `BOUNDARY_MASS_PROGRAM.md` states it for the 6D model
 * and the statement is dimension-blind: in a fully left-handed convention, a bulk mode in the local
 * representation r_q pairs with a localised Weyl in r̄_{−q}, and an edge exists only if the
 * non-abelian representation AND the charge match with opposite physical chirality.  It then says
 * the thing everybody gets wrong — "test de rango, no de conteo": with generic couplings the mass
 * matrix M_α : V_bulk(α) → V_brane(ᾱ) has rank min(dim, dim), so what survives is |difference| in
 * EACH class separately, and a count of "how many exotics" without that decomposition can declare a
 * mass allowed that is not.  So the gate here groups every left-handed piece by its exact class —
 * its representation under every block and all its U(1) charges — and pairs class with conjugate
 * class, one rank at a time.
 *
 * ONE THING MAKES THIS CHEAP AND IT IS WORTH SAYING OUT LOUD: a massless mode is (+,+), so it is
 * even under BOTH reflections and non-zero at BOTH fixed points.  There is therefore no question of
 * which brane a massless mode can be reached from — every one of them can be reached from either.
 * The locality that matters is in the GROUP (fact 1), not in the profile.
 *
 * THE CONTROL THAT HOLDS THE WHOLE FILE UP.  A paired class and its conjugate are vectorlike, and a
 * vectorlike pair contributes zero to every anomaly channel.  So the ledger of what SURVIVES the
 * mass gate must equal, row for row, the ledger of everything that entered it.  Two independent
 * routines — a rank test over class keys and an exact rational anomaly ledger — have to agree on
 * every model, and they do so only if the class keys are really conjugate.  `_test_brane.mjs` runs
 * it over the boundary conditions of SU(3)…SU(7); a mis-identified conjugate would show up there
 * long before it reached a page.
 *
 * WHAT IT DOES NOT DO, and the page says all three.  The ledger is the SUM over the two fixed
 * points, not the split between them — the localised anomalies can be individually non-zero when
 * the orbifold breaks the group, and absorbing those is a Chern-Simons or Green-Schwarz question
 * this module knows nothing about.  The rank test is the GENERIC answer: special couplings leave
 * MORE massless, so what comes back is a lower bound on the surviving content and is labelled as
 * one.  And there is no U(1)′ beyond the local group: a brane field charged under something the
 * bulk does not see is a different model, not a longer table.
 */

import { sun5dBlocks } from "./sun5d.mjs";
import { an5Frame, an5U1Frame, an5Pieces, an5PieceDim, an5PieceCharge,
         an5LedgerOnFrame } from "./anomaly5d.mjs";
import { smUnder, smSolve } from "./smcell.mjs";
import { R, add, sub, mul, div, neg, isZero, eq, str, ZERO } from "../kernel/charges.mjs";

/* ------------------------------------------------------------------ the two fixed points */

/* The letters are ordered (+,+), (+,−), (−,+), (−,−) everywhere in this instrument, so P₀ is + on
 * the first two and P₁ is + on the first and the third.  That is the whole of the geometry. */
export const BR_FIXED = [
  { fp: 0, where: "y = 0", reflection: "P₀", even: [0, 1], odd: [2, 3] },
  { fp: 1, where: "y = πR", reflection: "P₁", even: [0, 2], odd: [1, 3] },
];

/* The local group at a fixed point, as a FRAME in exactly the sense `anomaly5d.mjs` means it: two
 * blocks, the P = + letters merged into one and the P = − letters into the other.  Writing it as a
 * frame is not a convenience — it means the ledger, the U(1) generators and the charge of a piece
 * are the same routines here as everywhere else, run on a coarser partition of the same N indices. */
export function brLocalFrame(b, fp) {
  const F = BR_FIXED[fp];
  const size = [b.nPP, b.nPM, b.nMP, b.nMM];
  const blocks = [F.even, F.odd].map((members, i) => ({
    /* no spaces around the sign: this name goes into a table cell in a half-width card, and
     * "P₀ = +" wraps where "P₀=+" does not */
    name: `${F.reflection}=${i === 0 ? "+" : "−"}`,
    size: members.reduce((s, m) => s + size[m], 0),
    dim: 1,
    members,
  }));
  return { N: b.N, blocks, fp, reflection: F.reflection, where: F.where };
}

/* the local group written the way a paper writes it, with the empty factors gone */
export function brLocalGroup(frame) {
  const su = frame.blocks.filter((k) => k.size >= 2).map((k) => `SU(${k.size})`);
  const u1 = Math.max(0, frame.blocks.filter((k) => k.size > 0).length - 1);
  const parts = su.concat(u1 ? ["U(1)"] : []);
  return parts.length ? parts.join(" × ") : "nothing";
}

/* Whether the two fixed points see the same group.  They do exactly when one of P₀, P₁ is ±1 — an
 * orbifold that breaks nothing at that end — and the page says which of the two cases it is in,
 * because "the branes are different" is the fact that makes brane matter interesting. */
export function brSameGroup(b) {
  const a = brLocalFrame(b, 0).blocks.map((k) => k.size).slice().sort((x, y) => x - y);
  const c = brLocalFrame(b, 1).blocks.map((k) => k.size).slice().sort((x, y) => x - y);
  return a[0] === c[0] && a[1] === c[1];
}

/* ------------------------------------------------------------------ a local field, in pieces */

/* A brane field is a piece ON THE LOCAL FRAME — the same {rep, blockA, blockB, chirality, copies}
 * language `an5Pieces` produces, over two blocks instead of four.  `brLocalPiece` is the one place
 * a field record is turned into one, so a field with `rep: "fund"` cannot arrive with a stray
 * `blockB` and mean something nobody wrote. */
export function brLocalPiece(f) {
  return { rep: f.rep, blockA: f.blockA,
           blockB: f.rep === "fund" ? null : (f.blockB === undefined || f.blockB === null
                                              ? f.blockA : f.blockB),
           chirality: f.chirality || "L", copies: f.copies === undefined ? 1 : f.copies };
}

/* The decomposition of a local representation into pieces of the UNBROKEN group: replace each
 * local block by the letters it merges and run the same combinatorics the tensor products have.
 *
 *   fund of part c            → one fundamental per letter of c
 *   adj  (c, d)               → every ordered pair (letter of c, letter of d); the second index of
 *                               an adjoint is ANTI-fundamental, which is why the order is kept and
 *                               why this is also how a bifundamental (c, d̄) is written
 *   Λ² or S² of part c        → Λ²(V ⊕ W) = Λ²V ⊕ (V ⊗ W) ⊕ Λ²W, and the same for S²
 *
 * Pieces with no states are dropped, exactly as `an5Pieces` drops them: the antisymmetric of a
 * block of size one is empty, and an empty piece in a ledger stands for nothing. */
export function brDecompose(frame, localFrame, lp) {
  const mem = (c) => localFrame.blocks[c].members;
  const out = [];
  const push = (rep, a, bb) => {
    const p = { rep, blockA: a, blockB: bb, chirality: lp.chirality, copies: lp.copies };
    if (frame.blocks[a].size === 0) return;
    if (bb !== null && frame.blocks[bb].size === 0) return;
    if (an5PieceDim(frame, p) === 0) return;
    out.push(p);
  };
  if (lp.rep === "fund") { for (const m of mem(lp.blockA)) push("fund", m, null); return out; }
  if (lp.rep === "adj") {
    for (const m of mem(lp.blockA)) for (const n of mem(lp.blockB)) push("adj", m, n);
    return out;
  }
  const A = mem(lp.blockA), B = mem(lp.blockB);
  if (lp.blockA === lp.blockB) {
    for (let i = 0; i < A.length; i++)
      for (let j = i; j < A.length; j++)
        push(lp.rep, Math.min(A[i], A[j]), Math.max(A[i], A[j]));
    return out;
  }
  /* an off-diagonal (anti)symmetric pair is a plain bifundamental: both indices fundamental, so
   * the order of the two letters carries nothing and is normalised */
  for (const m of A) for (const n of B) push(lp.rep, Math.min(m, n), Math.max(m, n));
  return out;
}

/* ------------------------------------------------------------------ the free abelian charge */

/* The local U(1) generator T, letter by letter: the canonical generator of the local frame's first
 * block, read on the letters it merges.  It is traceless by construction, and constant on each
 * letter — which is the only property the two functions below need. */
export function brLocalU1(frame, localFrame) {
  const t = an5U1Frame(localFrame, 0);
  return frame.blocks.map((_, m) => t[localFrame.blocks[0].members.includes(m) ? 0 : 1]);
}

/* T IS A COMBINATION OF THE CANONICAL Y_c, AND THE COEFFICIENTS ARE T ITSELF.  With
 * Y_c(ℓ) = δ_{cℓ} − n_c/N, imposing Σ_c λ_c Y_c = T gives λ_ℓ = T(ℓ) + (Σ_c λ_c n_c)/N, and the
 * choice Σ_c λ_c n_c = 0 is consistent because tr T = 0.  So the charge of any piece under the
 * local U(1) is Σ_c T(c) · q_c, computed from charges the ledger already knows how to produce —
 * which is what lets a shifted piece be read back through the same function that shifted it. */
export function brLocalCharge(frame, localFrame, p) {
  const t = brLocalU1(frame, localFrame);
  let q = ZERO;
  for (let c = 0; c < frame.blocks.length; c++)
    q = add(q, mul(t[c], an5PieceCharge(frame, p, c)));
  return q;
}

/* HOW MUCH EACH Y_c MOVES PER UNIT OF LOCAL CHARGE.  Giving a local representation a charge Δ
 * above the one its indices imply shifts its weight by Δ·T/⟨T,T⟩ — the unique shift orthogonal to
 * the two SU factors' Cartans — so the charge under Y_c moves by Δ·⟨Y_c,T⟩/⟨T,T⟩, with
 * ⟨X,Y⟩ = tr(XY) = Σ_ℓ n_ℓ X(ℓ) Y(ℓ).  Every quantity here is an exact rational. */
export function brShiftDirection(frame, localFrame) {
  const t = brLocalU1(frame, localFrame);
  const n = frame.blocks.map((k) => k.size);
  let tt = ZERO;
  for (let m = 0; m < n.length; m++) tt = add(tt, mul(R(n[m]), mul(t[m], t[m])));
  return frame.blocks.map((_, c) => {
    if (isZero(tt)) return ZERO;
    const Y = an5U1Frame(frame, c);
    let yt = ZERO;
    for (let m = 0; m < n.length; m++) yt = add(yt, mul(R(n[m]), mul(Y[m], t[m])));
    return div(yt, tt);
  });
}

/* the charge a field's indices imply, in the left-handed convention the ledger uses */
export function brInducedCharge(b, f) {
  return an5PieceCharge(brLocalFrame(b, f.fp), brLocalPiece(f), 0);
}

/* ------------------------------------------------------------------ the brane content */

/* Every brane field as pieces of the unbroken group, carrying `dq` when its charge was shifted,
 * `fp` so a panel can say which brane it is on, and `q` so the shift is readable rather than
 * implied.  A field with zero copies is not a field. */
export function brPieces(b, branes = []) {
  const frame = an5Frame(b);
  const out = [];
  for (const f of branes) {
    const lp = brLocalPiece(f);
    if (!lp.copies) continue;
    const L = brLocalFrame(b, f.fp);
    const qInd = an5PieceCharge(L, lp, 0);
    const q = f.q === undefined || f.q === null ? qInd : f.q;
    const delta = sub(q, qInd);
    const dir = brShiftDirection(frame, L);
    const dq = isZero(delta) ? null : dir.map((d) => mul(delta, d));
    for (const p of brDecompose(frame, L, lp))
      out.push({ ...p, dq, fp: f.fp, brane: true, q, qInduced: qInd, field: f });
  }
  return out;
}

/* ------------------------------------------------------------------ the bill */

/* The ledger before and after the brane pays.  Nothing here recomputes an anomaly: both halves are
 * `an5LedgerOnFrame` on the same frame, once without the brane pieces and once with them. */
export function brBill(b, content = {}, branes = []) {
  const frame = an5Frame(b);
  const bulk = an5Pieces(b, content);
  const brane = brPieces(b, branes);
  const bulkOnly = an5LedgerOnFrame(frame, bulk);
  const total = an5LedgerOnFrame(frame, bulk.concat(brane));
  const paid = bulkOnly.rows.filter((r, i) => !isZero(r.value) && isZero(total.rows[i].value));
  const broken = bulkOnly.rows.filter((r, i) => isZero(r.value) && !isZero(total.rows[i].value));
  return { frame, bulk, brane, bulkOnly, total, paid, broken,
           /* the two verdicts a reader needs kept apart: what the bulk owed, and what is left */
           owedBefore: bulkOnly.offending.length, owedAfter: total.offending.length };
}

/* ------------------------------------------------------------------ classes, and conjugation */

/* The small identities that decide whether two labels are the same representation.  `smUnder`
 * already applies Λ²3 = 3̄, Λ²2 = 1 and S²2 = 3 when it names a piece; what it does not do — and
 * has no reason to, because naming is not pairing — is identify a REAL representation with its own
 * conjugate.  Λ²4 = 6 is real, so an "anti" and an "antī" of a block of size four are one class and
 * a mass term between two of them exists; treating them as different would hide a pairing. */
export function brCanon(label, n) {
  if (n === 4 && (label === "anti" || label === "antī")) return "anti";
  return label;
}

/* the conjugate label.  SU(2) is pseudo-real and SU(1) is nothing, so at n ≤ 2 every label is its
 * own conjugate; the adjoint is real at every n; the rest carry a bar. */
export function brBar(label, n) {
  const l = brCanon(label, n);
  if (l === "1" || l === "adj" || n <= 2) return l;
  if (n === 4 && l === "anti") return l;
  const M = { sym: "sym̄", "sym̄": "sym", anti: "antī", "antī": "anti" };
  if (M[l]) return M[l];
  return l.endsWith("̄") ? l.slice(0, -1) : l + "̄";
}

/* A CLASS IS A REPRESENTATION AND ALL ITS CHARGES, and the charges are half of it: two pieces that
 * look alike under every SU factor and differ in one U(1) cannot be given a mass together, and a
 * gate that grouped by the representation alone would say they can.  That is the "rank test, not a
 * count" of Part I written as a key. */
export function brClassKey(frame, p) {
  const rep = frame.blocks.map((k, i) => brCanon(smUnder(frame, p, i), k.size)).join("|");
  const q = frame.blocks.map((_, c) => str(an5PieceCharge(frame, p, c))).join(",");
  return `${rep} ; ${q}`;
}

export function brConjKey(frame, p) {
  const rep = frame.blocks.map((k, i) => brBar(smUnder(frame, p, i), k.size)).join("|");
  const q = frame.blocks.map((_, c) => str(neg(an5PieceCharge(frame, p, c)))).join(",");
  return `${rep} ; ${q}`;
}

/* a class key written for a human: the representation, then the charges */
export function brClassShow(frame, p) {
  const rep = frame.blocks.map((k, i) => brCanon(smUnder(frame, p, i), k.size))
    .map((l, i) => `${l}${frame.blocks[i].size ? "" : ""}`).join(", ");
  const q = frame.blocks.map((_, c) => str(an5PieceCharge(frame, p, c))).join(", ");
  return { rep: `(${rep})`, q: `(${q})` };
}

/* ------------------------------------------------------------------ the mass gate */

function trimCopies(members, keep) {
  const out = [];
  for (const p of members) {
    if (keep <= 0) break;
    const c = Math.min(keep, p.copies);
    out.push({ ...p, copies: c });
    keep -= c;
  }
  return out;
}

/* Part I's gate.  Group every left-handed piece — bulk zero mode and brane field alike — by its
 * exact class; pair each class with its conjugate class; with generic couplings the mass matrix has
 * maximal rank, so min(A, B) copies are lifted and |A − B| survive, in the majority class.
 *
 * A SELF-CONJUGATE CLASS IS LEFT ALONE, and that is a scope statement rather than an oversight.
 * Such a class is real or pseudo-real with every charge zero, and whether its members can pair
 * among themselves is a Majorana question — allowed for a real representation, obstructed for a
 * pseudo-real one — that this gate does not adjudicate.  It carries no anomaly either way, so
 * nothing downstream is wrong; the count of what survives is simply conservative there, and the
 * page says so. */
export function brMassGate(b, content = {}, branes = []) {
  const frame = an5Frame(b);
  const bulk = an5Pieces(b, content).map((p) => ({ ...p, from: "bulk" }));
  const brane = brPieces(b, branes).map((p) => ({ ...p, from: "brane" }));
  const pieces = bulk.concat(brane);

  const byKey = new Map();
  for (const p of pieces) {
    const key = brClassKey(frame, p);
    if (!byKey.has(key))
      byKey.set(key, { key, conj: brConjKey(frame, p), copies: 0, members: [],
                       dim: an5PieceDim(frame, p), show: brClassShow(frame, p),
                       fromBulk: 0, fromBrane: 0 });
    const g = byKey.get(key);
    g.copies += p.copies;
    g[p.from === "bulk" ? "fromBulk" : "fromBrane"] += p.copies;
    g.members.push(p);
  }

  const done = new Set(), pairs = [], survivors = [];
  for (const g of byKey.values()) {
    if (done.has(g.key)) continue;
    done.add(g.key);
    if (g.conj === g.key) {
      survivors.push({ ...g, lifted: 0, left: g.copies, real: true });
      continue;
    }
    const h = byKey.get(g.conj);
    if (!h) { survivors.push({ ...g, lifted: 0, left: g.copies, real: false }); continue; }
    done.add(h.key);
    const lifted = Math.min(g.copies, h.copies);
    pairs.push({ a: g, b: h, lifted });
    for (const x of [g, h])
      if (x.copies > lifted)
        survivors.push({ ...x, lifted, left: x.copies - lifted, real: false });
  }

  const survivingPieces = survivors.flatMap((s) => trimCopies(s.members, s.left));
  const count = (ps) => ps.reduce((a, p) => a + an5PieceDim(frame, p) * p.copies, 0);
  return {
    frame, pieces, bulk, brane,
    classes: [...byKey.values()], pairs, survivors, survivingPieces,
    lifted: pairs.reduce((a, p) => a + p.lifted, 0),
    before: count(pieces), after: count(survivingPieces),
    /* the control, computed rather than asserted: a paired class and its conjugate are vectorlike,
     * so the ledger of the survivors must be the ledger of everything, row for row */
    ledgerAll: an5LedgerOnFrame(frame, pieces),
    ledgerSurvivors: an5LedgerOnFrame(frame, survivingPieces),
  };
}

/* does the mass gate's own control hold on this model?  The section prints it as a chip. */
export function brGateControl(g) {
  const a = g.ledgerAll.rows, s = g.ledgerSurvivors.rows;
  if (a.length !== s.length) return false;
  return a.every((r, i) => r.channel === s[i].channel && eq(r.value, s[i].value));
}

/* ------------------------------------------------------------------ what you can put there */

/* The local representations available at a fixed point: a fundamental, the two rank-two tensors
 * and the adjoint of each factor, and the bifundamental both ways round.  It is a menu and not an
 * enumeration of everything a group has — those are the representations that occur in this kind of
 * model, and a bigger one is a bigger table, not a different mechanism. */
export function brMenu(b, fp) {
  const L = brLocalFrame(b, fp);
  const out = [];
  L.blocks.forEach((k, i) => {
    if (k.size < 1) return;
    out.push({ fp, rep: "fund", blockA: i, blockB: null, label: `${k.size} of ${k.name}` });
    if (k.size >= 2) {
      out.push({ fp, rep: "anti", blockA: i, blockB: i, label: `Λ² of ${k.name}` });
      out.push({ fp, rep: "sym", blockA: i, blockB: i, label: `S² of ${k.name}` });
      out.push({ fp, rep: "adj", blockA: i, blockB: i, label: `adjoint of ${k.name}` });
    }
  });
  if (L.blocks[0].size && L.blocks[1].size) {
    out.push({ fp, rep: "adj", blockA: 0, blockB: 1,
               label: `(${L.blocks[0].size}, ${L.blocks[1].size}‾) bifundamental` });
    out.push({ fp, rep: "adj", blockA: 1, blockB: 0,
               label: `(${L.blocks[0].size}‾, ${L.blocks[1].size}) bifundamental` });
  }
  return out;
}

/* FACT 2, COMPUTED.  For a massless piece, which brane fields contain its conjugate — and what
 * else each of them brings.  The charge is not a choice here: gauge invariance of the mass term
 * fixes the field's local charge to minus the mode's, so `q` comes back with the candidate rather
 * than being left to the reader.  A candidate whose SHIFT is non-zero is telling you that the
 * representation alone does not have the charge you need, which is worth seeing. */
export function brPartnersFor(b, target, { chiralities = ["L", "R"] } = {}) {
  const frame = an5Frame(b);
  const want = brConjKey(frame, target);
  const out = [];
  for (const fp of [0, 1]) {
    const L = brLocalFrame(b, fp);
    /* BOTH CHIRALITIES, and it is not a doubling of the table.  A right-handed Weyl in S is a
     * left-handed one in S̄, so declaring the chirality picks which of two conjugate local
     * representations the field is written as — and only one of the two can carry the conjugate of
     * the mode.  Searching one of them would silently halve the menu. */
    for (const m of brMenu(b, fp)) for (const chirality of chiralities) {
      const lp = brLocalPiece({ ...m, chirality, copies: 1 });
      /* the charge the mass term needs: the conjugate of the mode's own local charge */
      const q = neg(brLocalCharge(frame, L, target));
      const field = { ...m, chirality, copies: 1, q };
      const pieces = brPieces(b, [field]);
      const hit = pieces.filter((p) => brClassKey(frame, p) === want);
      if (!hit.length) continue;
      const extra = pieces.filter((p) => brClassKey(frame, p) !== want);
      out.push({ field, local: lp, where: L.where, group: brLocalGroup(L),
                 label: m.label, q, qInduced: an5PieceCharge(L, lp, 0),
                 shifted: !eq(q, an5PieceCharge(L, lp, 0)),
                 covers: hit.reduce((a, p) => a + p.copies, 0),
                 extra, extraStates: extra.reduce((a, p) => a + an5PieceDim(frame, p) * p.copies, 0) });
    }
  }
  /* the cheapest first: fewest unwanted states, then fewest pieces */
  out.sort((x, y) => x.extraStates - y.extraStates || x.extra.length - y.extra.length);
  return out;
}

/* ------------------------------------------------------------------ solving for the charges */

/* PART VI's QUESTION, FOR ANY MODEL.  Which local charges make the bill cancel?  The channels
 * split by their dependence on those charges: the pure non-abelian cubes do not see them at all,
 * U(1)_c × [SU]² and U(1)_c × grav² are LINEAR in them, and U(1)³ is cubic.  So the linear block is
 * solved exactly, in rationals, and the cubic ones are evaluated at the answer and reported —
 * never folded into the same verdict, because a linear solve that ignores a cubic constraint is
 * exactly the kind of half-answer this instrument is supposed to refuse.
 *
 * The columns are obtained by EVALUATING the ledger at Δ_j = 1 rather than by differentiating a
 * formula, and then the assumption that made that legal is CHECKED: at Δ_j = 2 every row of the
 * linear block must have moved exactly twice as far.  A row that fails that is not linear and the
 * solve says so instead of returning a number. */
export function brSolveCharges(b, content = {}, branes = []) {
  const frame = an5Frame(b);
  if (!branes.length) return { ok: false, why: "no brane field to solve for" };
  const bulk = an5Pieces(b, content);
  const induced = branes.map((f) => brInducedCharge(b, f));
  const at = (deltas) => an5LedgerOnFrame(frame, bulk.concat(
    brPieces(b, branes.map((f, j) => ({ ...f, q: add(induced[j], deltas[j]) })))));

  const zeros = branes.map(() => ZERO);
  const base = at(zeros);
  const lin = base.rows.map((r, i) => i)
    .filter((i) => base.rows[i].kind === "mixed" || base.rows[i].kind === "gravitational");
  if (!lin.length) return { ok: false, why: "this boundary condition has no abelian channel" };

  const cols = [], nonlinear = [];
  for (let j = 0; j < branes.length; j++) {
    const d1 = zeros.slice(); d1[j] = R(1);
    const d2 = zeros.slice(); d2[j] = R(2);
    const one = at(d1), two = at(d2);
    const col = lin.map((i) => sub(one.rows[i].value, base.rows[i].value));
    lin.forEach((i, k) => {
      if (!eq(sub(two.rows[i].value, base.rows[i].value), mul(R(2), col[k])))
        nonlinear.push(base.rows[i].channel);
    });
    cols.push(col);
  }
  if (nonlinear.length)
    return { ok: false, why: `not linear in the charges: ${[...new Set(nonlinear)].join(", ")}` };

  const A = lin.map((_, k) => cols.map((c) => c[k]));
  const rhs = lin.map((i) => neg(base.rows[i].value));
  const sol = smSolve(A, rhs);
  if (!sol) return { ok: false, why: "the linear channels are inconsistent: no charge cancels them",
                     rows: lin.map((i) => base.rows[i].channel) };

  const q = sol.c.map((d, j) => add(induced[j], d));
  const final = at(sol.c);
  return { ok: true, q, delta: sol.c, induced, free: sol.free, rank: sol.rank,
           /* what the solve did NOT promise, evaluated: the cubic abelian channels */
           cubic: final.rows.filter((r) => r.kind === "cubic-abelian" && !isZero(r.value)),
           ledger: final, clean: final.offending.length === 0 };
}

/* ------------------------------------------------------------------ the one-line answer */

export function brSummary(b, content = {}, branes = []) {
  const bill = brBill(b, content, branes);
  const gate = brMassGate(b, content, branes);
  return {
    bill, gate,
    control: brGateControl(gate),
    line: `${bill.brane.reduce((a, p) => a + p.copies, 0)} brane piece(s) · ` +
          `${bill.owedBefore} → ${bill.owedAfter} channel(s) owing · ` +
          `${gate.before} → ${gate.after} massless Weyl components`,
  };
}

export const brFor = (spec, content, branes) => brSummary(sun5dBlocks(spec), content, branes);

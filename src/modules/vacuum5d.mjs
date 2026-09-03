/* vacuum5d.mjs — the massless content AT THE MINIMUM of the Wilson-line potential, and the group
 * that is actually unbroken there.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE GAP THIS CLOSES.  Every verdict the instrument gave about a 5D SU(N) model on S¹/Z₂ — the
 * apparent unbroken group, the massless vectors, scalars and fermions, the whole anomaly ledger —
 * was computed at the SYMMETRIC POINT of the boundary condition on screen, θ = 0.  The dossier
 * measured what that costs: those lines move when the boundary condition is replaced by a
 * gauge-equivalent one, because the class relation [p,q,r,s] ~ [p−1,q+1,r+1,s−1] IS a shift of
 * the Wilson line by one, so a class-mate's symmetric point is this one's other symmetric point.
 * A statement about the theory has to be read where the theory sits: at the minimum.
 *
 * WHAT IS MASSLESS AT A WILSON LINE, AND WHY IT IS LINEAR ALGEBRA.  Gauge the constant A_y away.
 * The price is that the reflection about y = πR is no longer P₁ but
 *
 *     P₁′ = W⁻¹ P₁ ,     W = exp(i π Σ_k θ_k T_k)  the holonomy round the circle,
 *
 * (Hosotani; Haba–Hosotani–Kawamura §2, the dynamical rearrangement), with T_k the generator that
 * rotates the k-th (+,+)/(−,−) pair — or (+,−)/(−,+) pair — into itself.  P₀ is untouched.  A
 * massless four-dimensional mode is a y-independent solution, and for a unitary P₁′ that is
 * exactly a vector fixed by both reflections: the linear term a + b·y is killed because b would
 * have to lie in ker(U′−1) and in its orthogonal complement at once.  So the massless content of
 * a field with twist (ε₀, ε₁) — the parities its zero modes need — is
 *
 *     dim { v : ρ(P₀) v = ε₀ v ,  ρ(P₁′) v = ε₁ v }
 *
 * in its representation ρ.  When every θ_k is 0 or 1, P₁′ is again ±1 on each index and this is
 * the parity rule of `spectrum5d.mjs` applied to a CLASS-MATE — the member of the class the
 * vacuum rearranges the boundary condition into.  When some θ_k is strictly inside (0, 1) the
 * vacuum is a broken one and no member of the class has that content; the Hosotani mechanism is
 * exactly the case the parity rule cannot see.
 *
 * THE COUNT THAT IS WRONG, AND WHY IT IS TEMPTING.  Reading the KK families of `sp5Families` at
 * n = 0 puts every state with n + offset + Q = 0 at zero mass.  For SU(2) with P = P′ = diag(+,−)
 * at θ = 1 that gives TWO massless vectors; there is one, because W = −1 there is central and the
 * theory is the θ = 0 theory.  The per-state bookkeeping assigns the (+,+) Cartan direction charge
 * zero, so it stays massless at every θ, and it is not: at a broken vacuum the Cartan mixes with
 * the (−,−) partner into a vector of mass θ, which is the Hosotani W boson.  `_test_vacuum5d.mjs`
 * keeps that count as a decoy that must DISAGREE with this module.
 *
 * THE GROUP, NAMED WITHOUT A GUESS.  The commutant of {P₀, P₁′} on Cⁿ is, by Schur, the algebra
 * ⊕ M_{m_i}(C) over the irreducible representations V_i of the group they generate, with m_i the
 * multiplicity of V_i in Cⁿ — so the unbroken group is S(∏ U(m_i)), the same shape
 * `unbroken.mjs` derives for an alphabet, and the irreps are computable: every unpaired index is a
 * one-dimensional letter (±,±); a pair rotated by θ carries a two-dimensional irrep D(cos πθ), and
 * two pairs carry equivalent irreps exactly when their angles agree — an A-pair at θ against a
 * B-pair at φ when θ = 1 − φ, since the B-pair's P₁ is −σ₃.  A block is therefore a letter or a
 * rotated pair, with a SIZE (its multiplicity) and a DIMENSION (one or two), and `anomaly5d.mjs`
 * runs its ledger over exactly that frame.  Two pairs at the same angle give an SU(2) the
 * symmetric point never had; that is real, and it is what the tolerance decides.
 *
 * TWO ROUTES, ONE COUNT.  `vac5Rep` produces the massless pieces by the representation theory
 * above — letters twist into letters, D(c) twists into D(±c), S²D(c) = (+,+) ⊕ D(2c² − 1) and
 * Λ²D(c) = (−,−) — and `vac5Direct` builds ρ(P₀) and ρ(P₁′) as matrices and counts the joint
 * eigenspace by Gaussian elimination.  The harness holds the first to the second on every
 * representation, twist and boundary condition it can afford.  The page reads the first, because
 * it is exact integers; the second is the control, and it is what makes the first trustworthy.
 *
 * WHAT IS STILL NOT SAID.  The scalars are the tree-level zero modes of A_y at the minimum: the
 * flat directions, before the one-loop curvature gives them a mass.  Whether θ_k is at 0, at 1 or
 * strictly inside is decided to a tolerance — 1e-6, the minimiser's own — and so is whether two
 * angles coincide.  And the minimum itself is the grid minimiser's, one or two phases, as before.
 */
import { an5LedgerOnFrame, an5PieceDim } from "./anomaly5d.mjs";

export const VAC5_EPS = 1e-6;

/* ------------------------------------------------------------------ the pairs and the frame */

/* fold a phase into [0, 1]: V has period 2 in every phase and is even in each separately, and the
 * twisted reflection at θ and at 2 − θ are conjugate by P₁ itself */
const vac5Fold = (x) => { let t = Math.abs(x) % 2; if (t > 1) t = 2 - t; return t; };

/* The pairs the Wilson line rotates, with their fundamental indices in the layout the builder
 * uses — blocks (+,+), (+,−), (−,+), (−,−) in that order — and the ANGLE t at which their
 * two-dimensional representation sits.  An A-pair at θ and a B-pair at φ = 1 − θ are the same
 * representation, so both are given one t, and `theta` is the minimiser's vector: the A-phases
 * first, then the B-phases, as `sun5dNames` and `sp5Weights` read it. */
export function vac5Pairs(b, theta = []) {
  if (theta.length !== 0 && theta.length !== b.phases)
    throw new Error(`this boundary condition has ${b.phases} Wilson-line phase` +
                    `${b.phases === 1 ? "" : "s"} and ${theta.length} were given`);
  const off = [0, b.nPP, b.nPP + b.nPM, b.nPP + b.nPM + b.nMP];
  const out = [];
  for (let k = 0; k < b.A; k++) {
    const ph = vac5Fold(theta[k] ?? 0);
    out.push({ kind: "A", i: off[0] + k, j: off[3] + k, phase: ph, t: ph });
  }
  for (let k = 0; k < b.B; k++) {
    const ph = vac5Fold(theta[b.A + k] ?? 0);
    out.push({ kind: "B", i: off[1] + k, j: off[2] + k, phase: ph, t: 1 - ph });
  }
  return out;
}

const VAC5_LETTERS = [{ name: "(+,+)", p0: +1, p1: +1 }, { name: "(+,−)", p0: +1, p1: -1 },
                      { name: "(−,+)", p0: -1, p1: +1 }, { name: "(−,−)", p0: -1, p1: -1 }];

/* The frame at a point of the torus of phases: the four letters with the sizes they have THERE,
 * and one block per distinct rotation angle.  A pair at t = 0 is (+,+) ⊕ (−,−) again and a pair
 * at t = 1 is (+,−) ⊕ (−,+), so at a symmetric point there are no rotated blocks and the letters
 * are a boundary condition — the class-mate the vacuum rearranges into — which is returned as
 * `rearranged`.  Anywhere else `rearranged` is null, because no member of the class has this
 * content. */
export function vac5Frame(b, theta = [], { eps = VAC5_EPS } = {}) {
  const pairs = vac5Pairs(b, theta);
  const letters = [b.nPP - b.A, b.nPM - b.B, b.nMP - b.B, b.nMM - b.A];
  const rotated = [];
  for (const p of pairs) {
    if (p.t < eps) { letters[0]++; letters[3]++; }
    else if (p.t > 1 - eps) { letters[1]++; letters[2]++; }
    else {
      const d = rotated.find((q) => Math.abs(q.t - p.t) < eps);
      if (d) d.size++; else rotated.push({ t: p.t, size: 1 });
    }
  }
  rotated.sort((x, y) => x.t - y.t);
  const blocks = [
    ...VAC5_LETTERS.map((L, a) => ({ ...L, kind: "letter", size: letters[a], dim: 1 })),
    ...rotated.map((d) => ({ name: `⟨${d.t.toFixed(4)}⟩`, kind: "pair", t: d.t, size: d.size,
                             dim: 2 })),
  ];
  const symmetric = rotated.length === 0;
  return { N: b.N, theta: theta.slice(), pairs, blocks, eps, symmetric,
           rearranged: symmetric ? letters : null, rotated };
}

/* S(∏ U(m)) written the way `sun5dUnbroken` and `bcUnbroken` write it, and for the same reason:
 * the same group must print the same string whichever block produced it, so that at a symmetric
 * point this is character-for-character the class-mate's apparent group. */
export function vac5Unbroken(frame) {
  const live = frame.blocks.filter((k) => k.size >= 1);
  const parts = live.filter((k) => k.size >= 2).map((k) => k.size).sort((x, y) => y - x)
                    .map((n) => `SU(${n})`);
  const u1 = Math.max(0, live.length - 1);
  if (u1) parts.push(u1 === 1 ? "U(1)" : `U(1)^${u1}`);
  return parts.length ? parts.join(" × ") : "nothing";
}

/* one line saying where the vacuum stands, for a table cell */
export function vac5Where(frame) {
  if (frame.symmetric) return `[${frame.rearranged.join(", ")}] — a symmetric point`;
  return "broken — " + frame.rotated.map((d) =>
    `${d.size} pair${d.size === 1 ? "" : "s"} at t = ${d.t.toFixed(4)}`).join(", ");
}

/* ------------------------------------------------------------------ the pieces, by representation theory */

/* the block a twist (ε₀, ε₁) carries block i into, or −1: a letter goes to the letter with the
 * product signs; D(c) goes to itself when ε₀ε₁ = +1 and to D(−c), which is the block at 1 − t,
 * when ε₀ε₁ = −1 */
function vac5Twist(frame, i, e0, e1) {
  const k = frame.blocks[i];
  if (k.kind === "letter")
    return frame.blocks.findIndex((q) => q.kind === "letter" && q.p0 === k.p0 * e0 &&
                                         q.p1 === k.p1 * e1);
  if (e0 * e1 > 0) return i;
  return frame.blocks.findIndex((q) => q.kind === "pair" && Math.abs(q.t - (1 - k.t)) < frame.eps);
}

/* Every massless piece of one representation at twist (ε₀, ε₁), as a representation of the frame's
 * group: { rep, blockA, blockB } in the vocabulary `anomaly5d.mjs` already reads — a fundamental of
 * one block, a bifundamental of two (for the adjoint, fundamental of A and ANTI-fundamental of B),
 * or the adjoint / symmetric / antisymmetric of one block.  Chirality and copies are the caller's.
 *
 * The rules, and each is a line of the header's representation theory:
 *   fund   a letter with exactly the twist's signs.
 *   adj    Hom(V_i, V_j) is invariant iff V_i ⊗ χ_ε ≅ V_j, i.e. j = twist(i).
 *   S²/Λ²  two letters whose product is the twist; two rotated blocks at t and 1 − t when
 *          ε₀ε₁ = −1 (D(c) ⊗ D(−c) ⊃ (+,−) ⊕ (−,+), one of each, in both S² and Λ²); one letter
 *          with itself only at (+,+); and one rotated block with itself, where
 *          S²(D ⊗ C^m) = S²D ⊗ S²C^m ⊕ Λ²D ⊗ Λ²C^m with S²D = (+,+) ⊕ D(2c² − 1) and
 *          Λ²D = (−,−): the symmetric tensor's (+,+) is the sym of U(m), its (−,−) the antisym,
 *          and D(2c² − 1) is a letter only at c = 0, where it is (+,−) ⊕ (−,+). */
export function vac5Rep(frame, rep, e0, e1) {
  const B = frame.blocks, n = B.length, out = [];
  const live = (i) => B[i].size > 0;
  const emit = (r, a, c) => {
    const p = { rep: r, blockA: a, blockB: c };
    if (an5PieceDim(frame, p) > 0) out.push(p);
  };
  if (rep === "fund") {
    for (let i = 0; i < n; i++)
      if (live(i) && B[i].kind === "letter" && B[i].p0 === e0 && B[i].p1 === e1)
        emit("fund", i, null);
    return out;
  }
  if (rep === "adj") {
    for (let i = 0; i < n; i++) {
      if (!live(i)) continue;
      const j = vac5Twist(frame, i, e0, e1);
      if (j >= 0 && live(j)) emit("adj", j, i);
    }
    return out;
  }
  if (rep !== "sym" && rep !== "anti") throw new Error(`unknown representation "${rep}"`);
  for (let i = 0; i < n; i++) {
    if (!live(i)) continue;
    for (let j = i; j < n; j++) {
      if (!live(j)) continue;
      const a = B[i], c = B[j];
      if (i === j) {
        if (a.kind === "letter") { if (e0 > 0 && e1 > 0) emit(rep, i, i); continue; }
        let kind = null;
        if (e0 > 0 && e1 > 0) kind = rep;
        else if (e0 < 0 && e1 < 0) kind = rep === "sym" ? "anti" : "sym";
        else if (Math.abs(a.t - 0.5) < frame.eps) kind = rep;
        if (kind) emit(kind, i, i);
        continue;
      }
      if (a.kind === "letter" && c.kind === "letter") {
        if (a.p0 * c.p0 === e0 && a.p1 * c.p1 === e1) emit(rep, i, j);
      } else if (a.kind === "pair" && c.kind === "pair") {
        if (e0 * e1 < 0 && Math.abs(a.t + c.t - 1) < frame.eps) emit(rep, i, j);
      }
      /* a letter against a rotated pair is a two-dimensional irreducible, never a zero mode */
    }
  }
  return out;
}

/* the piece written for a reader, in the words `spectrum5d.mjs` uses */
const VAC5_SU = (n) => (n >= 2 ? `SU(${n})` : n === 1 ? "singlet" : "—");
export function vac5Label(frame, p) {
  const B = frame.blocks, n = (i) => B[i].size;
  const nm = (i) => (B[i].kind === "pair" ? `${VAC5_SU(n(i))}${B[i].name}` : VAC5_SU(n(i)));
  const lab = (i, what) => (n(i) >= 2 ? `${nm(i)} ${what}` : "singlet");
  if (p.blockB === null) return `(${lab(p.blockA, "fundamental")})`;
  if (p.blockA === p.blockB) {
    if (p.rep === "adj") return n(p.blockA) >= 2 ? `(${nm(p.blockA)} adjoint + singlet)` : "(singlet)";
    if (p.rep === "anti") return `(${lab(p.blockA, "antisymmetric")})`;
    return `(${lab(p.blockA, "symmetric")})`;
  }
  return `(${nm(p.blockA)}, ${nm(p.blockB)}) bifundamental`;
}

/* ------------------------------------------------------------------ the massless content */

/* The four-dimensional massless fields at this point of the torus, in the shape `sp5ZeroModes`
 * returns so a page can show either.  Vectors from A_μ at twist (+,+), scalars from A_y at (−,−)
 * — the same rule as the symmetric point, because A_y's parities are the flipped ones whatever
 * P₁′ is — and one chirality of each bulk Dirac fermion.  The trace of the adjoint is a joint
 * (+,+) invariant in every frame and is removed exactly when the twist is (+,+), which is when it
 * would have been counted. */
export function vac5ZeroModes(frame, content = {}) {
  const groups = new Map();
  const add = (kind, rep, chir, p, n) => {
    if (!n) return;
    const k = `${kind}|${rep}|${chir}|${p.blockA}|${p.blockB}`;
    const cur = groups.get(k);
    if (cur) cur.n += n;
    else groups.set(k, { kind, rep, chirality: chir, blockA: p.blockA, blockB: p.blockB, n,
                         label: vac5Label(frame, p) });
  };
  const tally = (kind, rep, chir, e0, e1, copies) => {
    for (const p of vac5Rep(frame, rep, e0, e1)) add(kind, rep, chir, p, an5PieceDim(frame, p) * copies);
    if (rep === "adj" && e0 > 0 && e1 > 0) {
      /* the trace: one state, removed from the first diagonal piece it sits in */
      const g = [...groups.values()].find((x) => x.kind === kind && x.chirality === chir &&
                                                x.rep === "adj" && x.blockA === x.blockB);
      if (g) { g.n -= copies; if (g.n <= 0) groups.delete(`${kind}|adj|${chir}|${g.blockA}|${g.blockB}`); }
    }
  };
  if (content.gauge !== false) {
    tally("vector", "adj", null, +1, +1, 1);
    tally("scalar", "adj", null, -1, -1, 1);
  }
  for (const f of content.bulk || []) {
    const m = f.multiplicity ?? 1;
    if (!m) continue;
    const eta = f.eta > 0 ? 1 : -1;
    if ((f.kind || "dirac") === "scalar") tally("scalar", f.rep, null, eta, 1, m);
    else {
      tally("fermion", f.rep, "L", eta, 1, m);
      tally("fermion", f.rep, "R", -eta, -1, m);
    }
  }
  const list = [...groups.values()];
  const sum = (k) => list.filter((x) => x.kind === k).reduce((a, x) => a + x.n, 0);
  return { list, vectors: sum("vector"), scalars: sum("scalar"), fermions: sum("fermion") };
}

/* the massless Dirac pieces with chirality and copies — the ledger's input, in the vacuum frame */
export function vac5Pieces(frame, content = {}) {
  const out = [];
  for (const f of content.bulk || []) {
    if ((f.kind || "dirac") !== "dirac") continue;
    const m = f.multiplicity ?? 1;
    if (!m) continue;
    const eta = f.eta > 0 ? 1 : -1;
    for (const p of vac5Rep(frame, f.rep, eta, 1)) out.push({ ...p, chirality: "L", copies: m });
    for (const p of vac5Rep(frame, f.rep, -eta, -1)) out.push({ ...p, chirality: "R", copies: m });
  }
  return out;
}

export const vac5Ledger = (frame, content = {}) => an5LedgerOnFrame(frame, vac5Pieces(frame, content));

/* everything at once, which is what the dossier reads */
export function vac5At(b, content, theta = [], opts = {}) {
  const frame = vac5Frame(b, theta, opts);
  return { frame, unbroken: vac5Unbroken(frame), where: vac5Where(frame),
           zero: vac5ZeroModes(frame, content), anom: vac5Ledger(frame, content) };
}

/* ------------------------------------------------------------------ the direct route: matrices */

/* P₀ and P₁′ = W⁻¹P₁ as real N × N matrices.  The rotation generator is taken along σ₂ within
 * each pair so that P₁′ stays REAL: e^{−iπθσ₂} σ₃ = cos πθ σ₃ + sin πθ σ₁, a reflection; taking
 * σ₁ instead would give the conjugate representation and the same counts.  A B-pair's P₁ is −σ₃
 * on its two indices, hence the sign. */
export function vac5Matrices(b, theta = []) {
  const N = b.N, P0 = [], P1 = [];
  for (let i = 0; i < N; i++) { P0.push(new Array(N).fill(0)); P1.push(new Array(N).fill(0)); }
  const off = [0, b.nPP, b.nPP + b.nPM, b.nPP + b.nPM + b.nMP, N];
  const SIGN = [[+1, +1], [+1, -1], [-1, +1], [-1, -1]];
  for (let a = 0; a < 4; a++)
    for (let i = off[a]; i < off[a + 1]; i++) { P0[i][i] = SIGN[a][0]; P1[i][i] = SIGN[a][1]; }
  for (const p of vac5Pairs(b, theta)) {
    const c = Math.cos(Math.PI * p.phase), s = Math.sin(Math.PI * p.phase);
    const sg = p.kind === "A" ? 1 : -1;
    P1[p.i][p.i] = sg * c; P1[p.i][p.j] = sg * s;
    P1[p.j][p.i] = sg * s; P1[p.j][p.j] = -sg * c;
  }
  return { P0, P1 };
}

/* ρ(M) on the fundamental, the adjoint (all of gl(N); the trace is subtracted by the caller), the
 * antisymmetric and the symmetric square, as a dense matrix over an explicit basis */
export function vac5RepMatrix(M, rep) {
  const N = M.length;
  if (rep === "fund") return M.map((r) => r.slice());
  if (rep === "adj") {
    /* basis E_ab, index a·N + b; M E_ab M has entries M_ca M_db at (c,d) */
    const D = N * N, R = [];
    for (let r = 0; r < D; r++) R.push(new Float64Array(D));
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++)
      for (let c = 0; c < N; c++) for (let d = 0; d < N; d++)
        R[c * N + d][a * N + b] = M[c][a] * M[d][b];
    return R;
  }
  const idx = [];
  const at = new Map();
  for (let a = 0; a < N; a++)
    for (let b = rep === "anti" ? a + 1 : a; b < N; b++) { at.set(`${a},${b}`, idx.length); idx.push([a, b]); }
  const D = idx.length, R = [];
  for (let r = 0; r < D; r++) R.push(new Float64Array(D));
  for (let col = 0; col < D; col++) {
    const [a, b] = idx[col];
    for (let c = 0; c < N; c++)
      for (let d = 0; d < N; d++) {
        if (rep === "anti") {
          if (c >= d) continue;
          R[at.get(`${c},${d}`)][col] += M[c][a] * M[d][b] - M[d][a] * M[c][b];
        } else {
          if (c > d) continue;
          const row = at.get(`${c},${d}`);
          if (a === b) R[row][col] += c === d ? M[c][a] * M[c][a] : M[c][a] * M[d][a];
          else R[row][col] += c === d ? 2 * M[c][a] * M[c][b] : M[c][a] * M[d][b] + M[d][a] * M[c][b];
        }
      }
  }
  return R;
}

/* rank of a dense real matrix by Gaussian elimination with partial pivoting, to a tolerance */
export function vac5Rank(A, tol = 1e-9) {
  const m = A.length; if (!m) return 0;
  const n = A[0].length;
  const M = A.map((r) => Float64Array.from(r));
  let rank = 0;
  for (let col = 0; col < n && rank < m; col++) {
    let piv = rank, best = Math.abs(M[rank][col]);
    for (let r = rank + 1; r < m; r++) if (Math.abs(M[r][col]) > best) { best = Math.abs(M[r][col]); piv = r; }
    if (best < tol) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    for (let r = 0; r < m; r++) {
      if (r === rank) continue;
      const f = M[r][col] / M[rank][col];
      if (!f) continue;
      for (let k = col; k < n; k++) M[r][k] -= f * M[rank][k];
    }
    rank++;
  }
  return rank;
}

/* THE CONTROL: the joint eigenspace, counted from the matrices.  ρ(P₀) is diagonal in every basis
 * above, so the ε₀ condition selects coordinates and the ε₁ condition is a rank on those columns.
 * Returns the number of massless components of ONE copy of the representation at that twist, with
 * the adjoint's trace removed at (+,+) as everywhere else. */
export function vac5Direct(b, theta, rep, e0, e1, { tol = 1e-9 } = {}) {
  const { P0, P1 } = vac5Matrices(b, theta);
  const R0 = vac5RepMatrix(P0, rep), R1 = vac5RepMatrix(P1, rep);
  const D = R0.length;
  const S = [];
  for (let i = 0; i < D; i++) if (Math.abs(R0[i][i] - e0) < 1e-12) S.push(i);
  if (!S.length) return 0;
  const A = [];
  for (let r = 0; r < D; r++) {
    const row = new Float64Array(S.length);
    for (let k = 0; k < S.length; k++) row[k] = R1[r][S[k]] - (r === S[k] ? e1 : 0);
    A.push(row);
  }
  const nullity = S.length - vac5Rank(A, tol);
  return nullity - (rep === "adj" && e0 > 0 && e1 > 0 ? 1 : 0);
}

/* the same count by the representation theory, for one copy — what the harness compares */
export function vac5Count(frame, rep, e0, e1) {
  let n = 0;
  for (const p of vac5Rep(frame, rep, e0, e1)) n += an5PieceDim(frame, p);
  return n - (rep === "adj" && e0 > 0 && e1 > 0 ? 1 : 0);
}

/* ------------------------------------------------------------------ the tower at the vacuum
 *
 * THE WHOLE KALUZA–KLEIN SPECTRUM AT THE MINIMUM, EXACTLY, AND WHY IT IS AN EIGENVALUE LIST.
 * With the constant A_y gauged away the field is periodic up to U′ = P₁′P₀, the composition of
 * the two reflections, so its modes are e^{i(n+Θ)y/R} with e^{2πiΘ} an eigenvalue of ρ(U′) and
 * n ∈ Z, and the orbifold identifies the eigenvalue Θ with −Θ (P₀U′P₀ = U′⁻¹).  So a conjugate
 * pair of eigenvalues at ±x, 0 < x < ½, is ONE tower |n + x|, n ∈ Z; an eigenvalue at 0 splits
 * under P₀ into an even part with modes n ≥ 0 (the massless ones, exactly the joint invariants
 * this module counts) and an odd part with n ≥ 1; and an eigenvalue at ½ gives n + ½, n ≥ 0,
 * whichever its P₀ sign.  A twist with ε₀ε₁ = −1 shifts every Θ by ½.
 *
 * The eigenvalues of ρ(U′) never need a matrix: on the fundamental, a (+,+) or (−,−) letter is
 * Θ = 0, a (+,−) or (−,+) letter is Θ = ½, and a pair rotated by t is ±t/2; the adjoint takes
 * differences, the tensors sums.  What this gets right that `sp5Families` cannot is the lowest
 * level of the adjoint and of the symmetric tensor at a broken vacuum, where the per-state
 * bookkeeping keeps a Cartan direction massless that has in fact become the W of mass t.
 *
 * TWO CONTROLS, both in the harness.  The split at Θ = 0 and the count at Θ = ½ are checked
 * against the joint-invariant counts of the other twists, which the tower did not use; and the
 * multiset of towers must reproduce the Wilson-line potential of `sun5d.mjs` up to a constant —
 * Σ_n n⁻⁵ cos(2πn x) per tower — which ties the spectrum at the vacuum to the potential whose
 * minimum put it there, by a route that shares no code with either. */
export function vac5Tower(frame, rep, e0, e1) {
  const th = [];
  for (const k of frame.blocks) {
    if (!k.size) continue;
    if (k.kind === "letter") for (let i = 0; i < k.size; i++) th.push(k.p0 * k.p1 > 0 ? 0 : 0.5);
    else for (let i = 0; i < k.size; i++) th.push(k.t / 2, -k.t / 2);
  }
  const N = th.length, all = [];
  if (rep === "fund") all.push(...th);
  else if (rep === "adj") {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) all.push(th[i] - th[j]);
    for (let i = 0; i < N - 1; i++) all.push(0);
  } else if (rep === "anti") {
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) all.push(th[i] + th[j]);
  } else if (rep === "sym") {
    for (let i = 0; i < N; i++) for (let j = i; j < N; j++) all.push(th[i] + th[j]);
  } else throw new Error(`unknown representation "${rep}"`);
  const shift = e0 * e1 < 0 ? 0.5 : 0;
  const fold = (x) => { let y = ((x + shift) % 1 + 1) % 1; if (y > 0.5) y = 1 - y; return y; };
  const eps = frame.eps;
  const bins = [];
  for (const x of all.map(fold)) {
    const b = bins.find((q) => Math.abs(q.x - x) < eps);
    if (b) b.m++; else bins.push({ x, m: 1 });
  }
  bins.sort((a, b) => a.x - b.x);
  const even = vac5Count(frame, rep, e0, e1);
  const families = bins.map((b) => {
    if (b.x < eps) {
      const odd = b.m - even;
      return { x: 0, kind: "integer", towers: b.m, massless: even, odd,
               lowest: even > 0 ? 0 : 1, first: odd > 0 || even > 0 ? (even > 0 ? 0 : 1) : null };
    }
    if (b.x > 0.5 - eps) return { x: 0.5, kind: "half", towers: b.m, massless: 0, lowest: 0.5 };
    return { x: b.x, kind: "generic", towers: b.m / 2, massless: 0, lowest: b.x,
             /* an eigenvalue strictly inside comes with its conjugate; an odd count means the
              * fold merged two different angles, which the tolerance would have to be blamed for */
             paired: b.m % 2 === 0 };
  });
  const lowestMassive = Math.min(...families.map((f) => (f.x === 0 ? (f.odd > 0 ? 1 : Infinity) : f.x)));
  return { rep, e0, e1, dim: all.length, families,
           massless: even, lowestMassive: isFinite(lowestMassive) ? lowestMassive : null };
}

/* the θ-dependent part of the one-loop potential a tower multiset implies, Σ_n n⁻⁵ cos(2πn x)
 * per tower, in the same units as `sun5dV` (its ½ included): the control that the spectrum at
 * the vacuum and the potential are one object.  Returned with the θ-independent Θ = 0 and Θ = ½
 * towers included, so a caller compares DIFFERENCES between two points and never a level. */
export function vac5TowerPotential(frame, rep, e0, e1, windings = 300) {
  const T = vac5Tower(frame, rep, e0, e1);
  let v = 0;
  for (const f of T.families) {
    const w = f.x === 0 ? f.towers / 2 : f.x === 0.5 ? f.towers / 2 : f.towers;
    let s = 0;
    for (let n = 1; n <= windings; n++) s += Math.cos(2 * Math.PI * n * f.x) / n ** 5;
    v += w * s;
  }
  return v;
}

/* THE LADDER: every field of the model at the minimum, its lightest mass in units of 1/R and of
 * the lightest massive vector — which is the W in a model that has one, m_W R = t/2 for a single
 * pair.  A number a model builder reads first, and one that no symmetric-point panel can print. */
export function vac5Ladder(frame, content = {}) {
  const rows = [];
  const put = (field, rep, e0, e1, copies = 1) => {
    const T = vac5Tower(frame, rep, e0, e1);
    rows.push({ field, rep, twist: [e0, e1], copies, massless: T.massless * copies,
                lowestMassive: T.lowestMassive, families: T.families });
  };
  if (content.gauge !== false) { put("A_μ", "adj", +1, +1); put("A_y", "adj", -1, -1); }
  for (const f of content.bulk || []) {
    const m = f.multiplicity ?? 1;
    if (!m) continue;
    const eta = f.eta > 0 ? 1 : -1;
    const kind = f.kind || "dirac";
    const name = `${m}× ${kind} ${f.rep}, ηη′ = ${eta > 0 ? "+" : "−"}`;
    if (kind === "scalar") put(name, f.rep, eta, 1, m);
    else { put(`${name} (L)`, f.rep, eta, 1, m); put(`${name} (R)`, f.rep, -eta, -1, m); }
  }
  const vec = rows.find((r) => r.field === "A_μ");
  const mW = vec && vec.lowestMassive !== null ? vec.lowestMassive : null;
  for (const r of rows) r.overW = mW && r.lowestMassive !== null ? r.lowestMassive / mW : null;
  return { rows, mWR: mW };
}

/* THE DECOY: what reading the KK families at n = 0 would say.  A state of charge Q and offset h
 * sits at zero mass when n + h + Q = 0 has a solution in the range its parity allows — n ≥ 0 for
 * (+,+) and the half-integer towers, n ≥ 1 for (−,−).  It over-counts at every symmetric point
 * other than θ = 0 and the harness requires it to. */
export function vac5NaiveFromStates(states) {
  let n = 0;
  for (const s of states) {
    const lo = s.P0 < 0 && s.P1 < 0 ? 1 : 0;
    const x = -(s.half + s.Q);
    if (Math.abs(x - Math.round(x)) < 1e-9 && Math.round(x) >= lo) n++;
  }
  return n;
}

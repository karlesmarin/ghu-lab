/* bcclass.mjs — equivalence classes of orbifold boundary conditions, on S¹/Z₂ and T²/Z₃.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE ARBITRARINESS PROBLEM, AND WHY THIS IS THE OTHER COMPUTATION EVERYONE REDOES.  Putting a
 * gauge theory on an orbifold means choosing boundary conditions at the fixed points, and there
 * are many.  But some of those choices are related by a gauge transformation, so they are the
 * SAME theory wearing different clothes: they form an equivalence class, and only the class is
 * physics.  Two consequences, and both are things a model builder needs before anything else:
 *
 *   - the apparent unbroken symmetry of a boundary condition is NOT an invariant.  SU(5) with
 *     [p,q,r,s] = [2,0,0,3] looks like SU(3)×SU(2)×U(1) and [1,1,1,2] looks like SU(2)×U(1)³,
 *     and they are the same theory.  Which one you see is where you are standing on the Wilson
 *     line, not what the theory is.  This is the dynamical rearrangement of gauge symmetry.
 *   - so a survey over boundary conditions that does not quotient by this counts the same model
 *     many times.
 *
 * WHAT IS IMPLEMENTED, AND FROM WHERE.  Both orbifolds where the classification is settled:
 *
 *   S¹/Z₂   BCs are a pair of Z₂ parities (P₀, P₁), simultaneously diagonalisable, so a BC is
 *           four block sizes [p, q, r, s] with p = #(+,+), q = #(+,−), r = #(−,+), s = #(−,−) —
 *           Haba–Hosotani–Kawamura, PTP 111 (2004) 265 (hep-ph/0309088) eq. (2.10).  Those are
 *           the same four numbers `sun5d.mjs` takes as its boundary condition.  The one relation
 *           is  [p,q,r,s] ~ [p−1, q+1, r+1, s−1],  their eq. (2.21).
 *
 *   T²/Z₃   BCs are a pair of Z₃ rotations (R₀, R₁) with eigenvalues in {ω, ω², 1}, so a BC is a
 *           3×3 non-negative integer matrix n[i][j] summing to N — Takeuchi–Inagaki, PTEP 2024
 *           033B03 (arXiv:2401.09809) eq. (23).  The relations are their eq. (46): six moves,
 *           three and their inverses, each shifting one unit along a cyclic permutation.
 *
 * THE CLASSES ARE COMPUTED, NOT LOOKED UP.  `bcClasses` walks the moves and returns the orbits.
 * Everything else — the count, whether a proposed label is complete, which class a BC is in — is
 * read off the orbits.  That is what lets `_test_bcclass.mjs` reproduce HHK's (N+1)² for SU(N) on
 * S¹/Z₂ as a MEASUREMENT of the orbit structure rather than as a quoted theorem, and lets the
 * T²/Z₃ side report what is true there instead of assuming the S¹/Z₂ answer carries over.
 *
 * TAKEUCHI–INAGAKI'S POINT, KEPT.  Their method does not use the structure of the gauge
 * transformations at all: the traces of the representation matrices at each fixed point are
 * conserved, which is a geometric fact about the orbifold, and that alone narrows the possible
 * connections to the moves above.  It is why the same relations come out twenty years apart by
 * two arguments that share nothing, and it is worth saying on the page.
 */

/* ------------------------------------------------------------------ S¹/Z₂ */

/* every diagonal BC of SU(N) or U(N) on S¹/Z₂: the compositions of N into four parts.
 * HHK count exactly these, with no determinant condition and no (P₀,P₁) → (−P₀,−P₁)
 * identification, and their n₁ = C(N+3,3) is the check that this is the same set. */
export function bcS1Z2All(N) {
  const out = [];
  for (let p = 0; p <= N; p++)
    for (let q = 0; q <= N - p; q++)
      for (let r = 0; r <= N - p - q; r++) out.push([p, q, r, N - p - q - r]);
  return out;
}

/* HHK eq. (2.21) / Takeuchi–Inagaki eq. (35): the only relation, and its inverse. */
export function bcS1Z2Moves([p, q, r, s]) {
  const out = [];
  if (p >= 1 && s >= 1) out.push([p - 1, q + 1, r + 1, s - 1]);
  if (q >= 1 && r >= 1) out.push([p + 1, q - 1, r - 1, s + 1]);
  return out;
}

/* ------------------------------------------------------------------ T²/Z₃ */

/* a BC is a 3×3 matrix of multiplicities, flattened row-major: n[i][j] states with R₀ eigenvalue
 * i and R₁ eigenvalue j, over the three cube roots of unity.  Takeuchi–Inagaki eq. (23). */
export function bcT2Z3All(N) {
  const out = [], cur = new Array(9).fill(0);
  (function rec(k, left) {
    if (k === 8) { cur[8] = left; out.push(cur.slice()); return; }
    for (let v = 0; v <= left; v++) { cur[k] = v; rec(k + 1, left - v); }
    cur[k] = 0;
  })(0, N);
  return out;
}

/* The three cyclic classes of the 3×3 grid: the identity permutation, and the two 3-cycles.  Each
 * of Takeuchi–Inagaki's moves takes one unit out of every cell of one class and puts it into the
 * corresponding cell of another, which is why the row and column sums cannot move. */
const T2Z3_CYCLES = [
  [0, 4, 8],       /* (1,1) (2,2) (3,3) */
  [1, 5, 6],       /* (1,2) (2,3) (3,1) */
  [2, 3, 7],       /* (1,3) (2,1) (3,2) */
];

export function bcT2Z3Moves(n) {
  const out = [];
  for (const [a, b] of [[0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]]) {
    const from = T2Z3_CYCLES[a], to = T2Z3_CYCLES[b];
    if (!from.every((i) => n[i] >= 1)) continue;
    const m = n.slice();
    for (let k = 0; k < 3; k++) { m[from[k]] -= 1; m[to[k]] += 1; }
    out.push(m);
  }
  return out;
}

/* ------------------------------------------------------------------ the orbits */

export const ORBIFOLDS = {
  "S1/Z2": { all: bcS1Z2All, moves: bcS1Z2Moves, cells: 4,
             label: "S¹/Z₂", basic: 2,
             source: "Haba–Hosotani–Kawamura, PTP 111 (2004) 265, eqs. (2.10) and (2.21); " +
                     "re-derived without gauge transformations by Takeuchi–Inagaki, PTEP 2024 " +
                     "033B03, eq. (35)" },
  "T2/Z3": { all: bcT2Z3All, moves: bcT2Z3Moves, cells: 9,
             label: "T²/Z₃", basic: 3,
             source: "Takeuchi–Inagaki, PTEP 2024 033B03 (arXiv:2401.09809), eqs. (23) and (46)" },
};

/* Every equivalence class of BCs for SU(N) on this orbifold, as orbits of the moves.  Nothing is
 * looked up: the count, the representatives and the class of a given BC all come out of here. */
export function bcClasses(N, orbifold = "S1/Z2") {
  /* a key, or a spec of the same shape -- so a case that is NOT one of the selectable orbifolds
   * can still be counted by this same audited orbit walk rather than by a second copy of it. */
  const O = typeof orbifold === "string" ? ORBIFOLDS[orbifold] : orbifold;
  if (!O) throw new Error(`no orbifold "${orbifold}"`);
  const all = O.all(N);
  const index = new Map(all.map((b, i) => [b.join(","), i]));
  const seen = new Int32Array(all.length).fill(-1);
  const classes = [];
  for (let i = 0; i < all.length; i++) {
    if (seen[i] >= 0) continue;
    const id = classes.length, members = [], stack = [i];
    seen[i] = id;
    while (stack.length) {
      const j = stack.pop();
      members.push(all[j]);
      for (const m of O.moves(all[j])) {
        const k = index.get(m.join(","));
        if (k === undefined) throw new Error(`a move left the lattice: ${m}`);
        if (seen[k] < 0) { seen[k] = id; stack.push(k); }
      }
    }
    members.sort((a, b) => a.join(",") < b.join(",") ? -1 : 1);
    classes.push({ id, members, size: members.length });
  }
  return { N, orbifold, all, classes, of: (bc) => seen[index.get(bc.join(","))],
           nBC: all.length, nClasses: classes.length };
}

/* ------------------------------------------------------------------ the invariant */

/* WHAT A CLASS IS LABELLED BY, PROPOSED AND THEN MEASURED.  Both sets of moves preserve the row
 * and column sums of the multiplicity matrix — which are the eigenvalue spectra of P₀ (or R₀) and
 * of P₁ (or R₁) separately.  Takeuchi–Inagaki's trace-conservation argument is exactly that.
 *
 * Whether those sums are a COMPLETE invariant is a different question and is not assumed: on
 * S¹/Z₂ they are, and (N+1)² follows; on T²/Z₃ the moves are 3-cycles rather than the 2×2 swaps
 * that would connect every matrix with given margins, so completeness has to be measured.
 * `bcMarginsComplete` measures it. */
export function bcMargins(bc) {
  const k = bc.length === 4 ? 2 : 3;
  const rows = new Array(k).fill(0), cols = new Array(k).fill(0);
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) { rows[i] += bc[i * k + j]; cols[j] += bc[i * k + j]; }
  return { rows, cols, key: rows.join(",") + "|" + cols.join(",") };
}

export function bcMarginsComplete(C) {
  const byMargin = new Map();
  for (const cl of C.classes) {
    const keys = new Set(cl.members.map((m) => bcMargins(m).key));
    if (keys.size !== 1) return { invariant: false, complete: false, nMargins: null };
    const k = [...keys][0];
    byMargin.set(k, (byMargin.get(k) || 0) + 1);
  }
  const worst = Math.max(...byMargin.values());
  return { invariant: true, complete: worst === 1, nMargins: byMargin.size, worst,
           split: [...byMargin].filter(([, n]) => n > 1).map(([k]) => k) };
}

/* ------------------------------------------------------------------ what a BC looks like */

/* the symmetry the boundary condition APPEARS to leave unbroken — and the point of this module is
 * that it is not an invariant of the class */
export function bcUnbroken(bc) {
  /* THE FACTORS ARE SORTED, and that is not cosmetic.  This module exists to say when two
   * boundary conditions give the SAME group, so the same group must print the same string
   * whichever block produced it — otherwise [2,0,0,3] reads "SU(2) × SU(3) × U(1)" and
   * [0,3,2,0] reads "SU(3) × SU(2) × U(1)" and a reader sees a difference that is not there. */
  const parts = bc.filter((n) => n >= 2).sort((a, b) => b - a).map((n) => `SU(${n})`);
  const u1 = Math.max(0, bc.filter((n) => n >= 1).length - 1);
  if (u1) parts.push(u1 === 1 ? "U(1)" : `U(1)^${u1}`);
  return parts.length ? parts.join(" × ") : "nothing";
}

export const bcShow = (bc) => bc.length === 4
  ? `[${bc[0]}, ${bc[1]}, ${bc[2]}, ${bc[3]}]`
  : `[${bc.slice(0, 3).join(",")} | ${bc.slice(3, 6).join(",")} | ${bc.slice(6).join(",")}]`;

/* ------------------------------------------------------------------ the energetics, S¹/Z₂ */

/* HHK §3.  The one-loop vacuum energy density at vanishing Wilson line, for SU(N) on S¹/Z₂ with
 * n_s complex scalars and n_fF Dirac fermions in the fundamental and n_fA Dirac fermions in the
 * second-rank antisymmetric, each labelled by its (η₀, η₁).  Their eq. (3.25):
 *
 *     V_eff = N₀ λ₀ + N_Δ λ_Δ + N_v v(½)
 *
 * and the three pieces are not equally meaningful, which is the whole honesty of this panel:
 *
 *   N₀    is INDEPENDENT of the boundary condition, so it never distinguishes anything;
 *   N_Δ   multiplies a DIVERGENT λ_Δ, and no symmetry principle picks the regularisation — so
 *         energies in DIFFERENT classes cannot be compared in a non-supersymmetric theory.  But
 *         N_Δ is constant on a class (checked, not assumed), so within one class it cancels;
 *   N_v   multiplies the finite v(½), and is what actually decides.
 *
 * So this function returns all three and the caller is told which comparisons are legitimate.
 *
 * THE SIGN OF v(½) IS TAKEN FROM THE PAPER'S OWN CONCLUSION, not from my reading of its formula:
 * the text says that for SU(5) with n_fF = n_fA = 0 the boundary condition [2,0,0,3] — the one
 * with SU(3)×SU(2)×U(1) — has the LOWEST energy density, and its eq. (3.27) makes the other two
 * members of that class differ from it by positive multiples of v(½).  That forces v(½) > 0, and
 * therefore "preferred" means "smallest N_v".  `_test_bcclass.mjs` pins both statements.
 */
export const ZETA5 = 1.0369277551433699;
/* v(½) = (3/(64π⁷R₅⁵)) (31/32) ζ(5), in units of C = 3/(64π⁷R₅⁵) — positive */
export const V_HALF_OVER_C = (31 / 32) * ZETA5;

const ETAS = ["++", "+-", "-+", "--"];
const zero = () => ({ "++": 0, "+-": 0, "-+": 0, "--": 0 });

export function bcEnergy(bc, matter = {}) {
  const [p, q, r, s] = bc;
  const N = p + q + r + s;
  const S = { ...zero(), ...(matter.scalarF || {}) };
  const FF = { ...zero(), ...(matter.diracF || {}) };
  const FA = { ...zero(), ...(matter.diracA || {}) };
  const tot = (o) => ETAS.reduce((a, k) => a + (o[k] || 0), 0);
  const ns = tot(S), nfF = tot(FF), nfA = tot(FA);

  const N0 = 3 * (N * N - 1) + 2 * ns * N - 4 * nfF * N - 2 * nfA * N * (N - 1);
  const Nd = (p - s) ** 2 + (q - r) ** 2 - 1
           + 2 * (S["++"] - S["--"]) * (p - s)
           + 2 * (S["+-"] - S["-+"]) * (q - r);
  /* The printed line for N_v repeats `n_fF^(+−)` where the second term must be `n_fF^(−+)`: the
   * line above it pairs (++) with (−−) the same way, the whole setup is symmetric under q ↔ r
   * (their eq. (2.11)), and the (3.27) control below only comes out right this way. */
  const Nv = (6 - 4 * nfA) * (p + s) * (q + r)
           + 2 * (S["++"] + S["--"] - 2 * FF["++"] - 2 * FF["--"]) * (q + r)
           + 2 * (S["+-"] + S["-+"] - 2 * FF["+-"] - 2 * FF["-+"]) * (p + s);
  return { N0, Nd, Nv, finiteOverC: Nv * V_HALF_OVER_C };
}

/* The class's own preferred member: smallest N_v, which inside a class is an unambiguous
 * comparison because N_Δ is constant there and N₀ never moves.  Ties are reported, not broken. */
export function bcPreferred(members, matter) {
  const scored = members.map((m) => ({ bc: m, ...bcEnergy(m, matter) }));
  const best = Math.min(...scored.map((x) => x.Nv));
  const winners = scored.filter((x) => x.Nv === best);
  return { scored, best, winners, tied: winners.length > 1 };
}

/* ------------------------------------------------------------------ T²/Z₆, counted
 *
 * NOT one of the selectable orbifolds above: the cells, the energy and the unbroken group of this
 * page are S¹/Z₂ and T²/Z₃ objects, and a T²/Z₆ state is a different animal.  What it shares is the
 * only thing needed here -- a set of states and moves between them -- so it goes through the same
 * `bcClasses` orbit walk rather than a second copy of it.
 *
 * THE STATE, from Takeuchi-Inagaki arXiv:2404.19411 sections 3 and 4:
 *   (b0, b1, b2 | c0, c1 | d0..d5)   with  2*(b0+b1+b2) + 3*(c0+c1) + sum(d) = N
 *   b_i counts 2x2 blocks of eq. (4.2) with label i;  c_j counts 3x3 blocks of eq. (4.3) with
 *   label j;  d_k counts diagonal entries of the k-th of the six patterns of eq. (3.39).
 *
 * THE MOVES are their own reductions (4.10) and (4.11): three 2x2 blocks of distinct label, and
 * two 3x3 blocks of distinct label, become diagonal.  The eigenvalues that come out are the six
 * sixth roots of unity in both cases -- eta^b diag(-1,1) over b = 0,1,2, and eta^c diag(w,w²,1)
 * over c = 0,1 -- so each reduction produces EXACTLY ONE of each of the six diagonal patterns. */
export function bcT2Z6All(N) {
  const out = [];
  for (let b0 = 0; 2 * b0 <= N; b0++)
    for (let b1 = 0; 2 * (b0 + b1) <= N; b1++)
      for (let b2 = 0; 2 * (b0 + b1 + b2) <= N; b2++) {
        const sb = 2 * (b0 + b1 + b2);
        for (let c0 = 0; sb + 3 * c0 <= N; c0++)
          for (let c1 = 0; sb + 3 * (c0 + c1) <= N; c1++) {
            const rest = N - sb - 3 * (c0 + c1);
            const walk = (k, left, d) => {
              if (k === 5) { out.push([b0, b1, b2, c0, c1, ...d, left]); return; }
              for (let v = 0; v <= left; v++) walk(k + 1, left - v, [...d, v]);
            };
            walk(0, rest, []);
          }
      }
  return out;
}

/* BOTH DIRECTIONS, AND THAT IS NOT A DETAIL.  `bcClasses` finds a class by walking `moves` forward
 * from one state, which computes the connected component only if the move set is SYMMETRIC -- as
 * the S¹/Z₂ and T²/Z₃ relations are, each being its own inverse in the list.  A reduction is not:
 * it only goes one way.  Listing the inverse alongside it is what makes the walk compute the
 * equivalence the reduction generates, rather than what is reachable from where it started.
 * Without the inverses this returned 665, 1560 and 3351 at N = 6, 7, 8 instead of 663, 1548, 3303. */
export function bcT2Z6Moves(s) {
  const out = [];
  const d = s.slice(5);
  if (s[0] >= 1 && s[1] >= 1 && s[2] >= 1)                     /* eq. (4.10) */
    out.push([s[0] - 1, s[1] - 1, s[2] - 1, s[3], s[4], ...d.map((v) => v + 1)]);
  if (s[3] >= 1 && s[4] >= 1)                                   /* eq. (4.11) */
    out.push([s[0], s[1], s[2], s[3] - 1, s[4] - 1, ...d.map((v) => v + 1)]);
  if (d.every((v) => v >= 1)) {                                 /* and back again */
    out.push([s[0] + 1, s[1] + 1, s[2] + 1, s[3], s[4], ...d.map((v) => v - 1)]);
    out.push([s[0], s[1], s[2], s[3] + 1, s[4] + 1, ...d.map((v) => v - 1)]);
  }
  return out;
}

/* The classes, split the way the paper splits them: a class is DIAGONAL when some member of it
 * carries no block at all.  The diagonal count is the control -- it must be C(N+5,5). */
export function bcT2Z6Count(N) {
  const { classes, nBC } = bcClasses(N, { all: bcT2Z6All, moves: bcT2Z6Moves });
  let diagonal = 0;
  for (const c of classes)
    if (c.members.some((m) => m[0] + m[1] + m[2] + m[3] + m[4] === 0)) diagonal++;
  return { N, states: nBC, diagonal, offdiag: classes.length - diagonal,
           alpha: binom(N + 5, 5) };
}

function binom(n, k) {
  if (n < 0 || k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/* The three statements about that same number, kept apart because they are three claims.
 * `tiZ6Sum` is the sum printed above eq. (5.9); `tiZ6Eq59` is eq. (5.9) itself; `tiZ6Closed` is
 * what the sum actually evaluates to.  The first and the third agree; the second parts company
 * from N = 7. */
export function tiZ6Sum(N) {
  const a = (n) => binom(n + 5, 5);
  let g = 0;
  for (let m = 1; m <= Math.floor(N / 3); m++) g += 2 * a(N - 3 * m);
  g += 3 * a(N - 2);
  for (let m = 1; m <= Math.floor((N - 2) / 3); m++) g += 6 * a(N - 2 - 3 * m);
  for (let l = 2; l <= Math.floor(N / 2); l++) g += 3 * l * a(N - 2 * l);
  for (let m = 1; m <= Math.floor(N / 3); m++)
    for (let l = 2; l <= Math.floor((N - 3 * m) / 2); l++) g += 6 * l * a(N - 2 * l - 3 * m);
  return g;
}

const Z6_BRANCH = [
  (N) => N * (3*N**7 + 72*N**6 + 2282*N**5 + 19908*N**4 + 36372*N**3 - 91392*N**2 + 61968*N + 781632),
  (N) => (N+5) * (N-1) * (3*N**6 + 60*N**5 + 2057*N**4 + 11980*N**3 - 1263*N**2 - 26440*N + 159523),
  (N) => (N+4) * (3*N**7 + 60*N**6 + 2042*N**5 + 11740*N**4 - 10588*N**3 - 49040*N**2 + 258128*N - 250880),
  (N) => (N+3) * (3*N**7 + 63*N**6 + 2093*N**5 + 13629*N**4 - 4515*N**3 - 77847*N**2 + 293619*N - 110565),
  (N) => (N+2) * (3*N**7 + 66*N**6 + 2150*N**5 + 15608*N**4 + 5156*N**3 - 101704*N**2 + 265376*N + 250880),
  (N) => (N+1) * (3*N**7 + 69*N**6 + 2213*N**5 + 17695*N**4 + 18677*N**3 - 110069*N**2 + 170147*N + 600145),
];

export function tiZ6Eq59(N) { return Z6_BRANCH[N % 6](N) / 483840; }

export function tiZ6Closed(N) {
  return N % 2 === 0
    ? N * (N+2) * (N+4) * (N**5 + 18*N**4 + 220*N**3 + 888*N**2 + 346*N - 1284) / 80640
    : (N-1) * (N+1) * (N+3) * (N+5) * (N**4 + 16*N**3 + 194*N**2 + 584*N + 189) / 80640;
}

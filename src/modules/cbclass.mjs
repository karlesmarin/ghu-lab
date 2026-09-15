/* cbclass.mjs — equivalence classes of CONJUGATE boundary conditions on S¹/Z₂.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS THE OTHER HALF OF.  `bcclass.mjs` answers, for ordinary chiral orbifolding, "which
 * of these boundary conditions are the same theory?".  There is a second family the physics is
 * actively using and for which the same question has no published answer — a CONJUGATE boundary
 * condition identifies a field with its charge conjugate under the orbifold reflection,
 *
 *     psi(y_i - y) = P_i psi^c(y_i + y),     y_0 = 0,  y_1 = pi R,
 *
 * so its zero mode is a four-dimensional MAJORANA fermion, which a five-dimensional spinor cannot
 * otherwise be.  Grzadkowski–Wudka (Phys. Rev. D 72 (2005) 125012) derive the allowed form of the
 * twists; Abe–Goto–Kawamura–Nishikawa (MPLA 31 (2016) 1650208, arXiv:1608.06393) name the object
 * and use it.  NEITHER TAKES THE QUOTIENT — measured, not assumed: a word count over both texts
 * finds "conjugate boundary condition" 5 times in the second and "equivalence class" ZERO times,
 * while the two papers that DO classify (arXiv:0905.4123, arXiv:0808.2333, 34 and 25 hits) never
 * say "conjugate".  The intersection is empty, and that empty intersection is this module.
 *
 * ================================================================================================
 * THE CLASSIFICATION, AND WHY IT IS NOT A SIMILARITY
 * ================================================================================================
 *
 * Under a gauge transformation psi -> Omega psi one has psi^c -> Omega^* psi^c, so the twist moves
 * by CONGRUENCE and not by similarity:
 *
 *     P_i  ->  Omega_i P_i Omega_i^T
 *
 * Consistency of applying the reflection twice forces P_i P_i^* = eps_i . 1 with eps_i = +-1, and
 * for unitary P_i that is the same as
 *
 *     P_i^T = eps_i P_i        eps_i = +1 SYMMETRIC,  eps_i = -1 ANTISYMMETRIC.
 *
 * `eps_i` is invariant under congruence in one line — (Omega P Omega^T)^T = Omega P^T Omega^T —
 * and by AUTONNE–TAKAGI it is COMPLETE at an isolated fixed point: every symmetric unitary is
 * congruent to the identity, every antisymmetric one (N even only) to the symplectic form J.  So
 * the only invariant of ONE fixed point is a SIGN, not a spectrum.  That is the whole difference
 * with the ordinary case, where the invariant is a pair of eigenvalue multiplicities and the count
 * grows as (N+1)^2.
 *
 * ================================================================================================
 * THE HYPOTHESIS THE COUNT RESTS ON, CARRIED IN THE OUTPUT INSTEAD OF IN A FOOTNOTE
 * ================================================================================================
 *
 * Whether the count is 4 (N even) / 1 (N odd) depends on taking Omega(0) and Omega(pi R)
 * INDEPENDENT.  That is what the ordinary treatment does.  It is NOT verified for a conjugate
 * condition, and it is the foot of everything below.  This module does not choose it in silence
 * and does not hide behind it.  It computes BOTH sides and says what the assumption buys, because
 * the difference between them turns out to be one clean sentence:
 *
 *   - with a SINGLE Omega the holonomy H = P_1 P_0^* moves by UNITARY SIMILARITY,
 *         H -> Omega H Omega^dagger        since Omega^T Omega^* = (Omega^dagger Omega)^T = 1,
 *     so its SPECTRUM is invariant and is EXTRA LABEL on top of (eps_0, eps_1);
 *   - with INDEPENDENT Omegas that cancellation does not happen and the spectrum is not invariant,
 *     so only (eps_0, eps_1) survives.
 *
 * Measured in the private working repo (`cbc_holonomy_gate.py`, six controls): the similarity law
 * holds to 4.89e-15 over 720 samples, and the decoy — independent Omegas — separates the spectra
 * by at least 0.18 over the same 720, so THE TWO HYPOTHESES GENUINELY DIFFER and the question is
 * not vacuous.
 *
 *     So the open question is not "is it legitimate?" but: DOES THE HOLONOMY SPECTRUM COUNT AS A
 *     LABEL, OR IS IT A MODULUS?  And H is the Wilson-line holonomy, whose phases are DYNAMICAL —
 *     the Hosotani mechanism — which is word for word why the ordinary case takes them
 *     independent.  That is a candidate resolution and it is NOT a proof: whether the ordinary
 *     argument transfers to the conjugate family is exactly what the letters of 6-sep ask.
 *
 * `cbcIndependence()` is that paragraph as data, and every count this module returns carries it.
 *
 * ================================================================================================
 * THE FINITE MODEL, AND WHY THERE IS ONE
 * ================================================================================================
 *
 * `bcclass` can list the members of a class because its orbits are finite.  Here they are NOT: the
 * congruence class of a symmetric unitary is a continuum, so a panel that tried to list members
 * would be lying about the shape of the answer.  The design document's step 2 says "enumerate and
 * orbit", which is the shape its sibling has.  IT DOES NOT TRANSFER, and the reason is a theorem
 * about the model rather than a shortage of computing:
 *
 *     CONGRUENCE USES Omega TWICE.  On a diagonal twist, diag(a,b) -> diag(u^2 a, v^2 b): the
 *     action only ever reaches SQUARES of units.  With units mu_n the squares are mu_{n/2}, so the
 *     diagonal twists fall into mu_n / mu_{n/2} = 2 classes FOR EVERY EVEN n.  No finite group of
 *     roots of unity is closed under square roots, so NO finite model of this action can ever be
 *     faithful — not with bigger units, not with a bigger group.
 *
 * MEASURED, AND IT COST A WRONG DIAGNOSIS FIRST.  The first version of this model used signed
 * permutations and was not faithful: N = 2, 3, 4 gave 5, 6, 10 orbits where the theorem gives
 * 2, 1, 2, and the split was entirely on the SYMMETRIC side.  The first explanation written here
 * was SYLVESTER'S LAW OF INERTIA — real congruence preserves the signature, complex congruence
 * does not, so adding i should collapse it.  That was testable and it is FALSE: going from
 * mu_2 = {+-1} to mu_4 = {+-1, +-i} leaves the count at 5 and 5, unchanged.  The square-closure
 * argument above predicts exactly that — enlarging n cannot help, because the quotient is 2 for
 * every n — and the null result is its confirmation rather than a disappointment.
 *
 * SO THE FINITE MODEL IS KEPT, AND IT IS KEPT AS THE FALSIFICATION IT IS.  `cbcFiniteModelFaithful`
 * reports `faithful: false` with the reason, for every N and every unit set, and that verdict is
 * the section's structural payload: the conjugate classification is NOT a combinatorial orbit
 * problem, unlike the one next to it on the rail.  A panel that reported its larger orbit count as
 * the answer would be the tool telling its first lie.
 *
 * (The arithmetic is exact in Z[i], so `units` beyond mu_4 would need Z[zeta_8] and are refused
 * rather than run in floating point — an exact walk whose keys are rounded floats stops colliding
 * and silently inflates the orbit count.)
 */

/* ------------------------------------------------------------------ the labels */

/* The symmetry types available at one fixed point.  A non-singular ANTISYMMETRIC matrix needs N
 * even, so N odd has only the symmetric twist — which is already the whole reason the count is
 * 1 rather than 4 there. */
export function cbcTypes(N) {
  return N % 2 === 0 ? [+1, -1] : [+1];
}

/* Every conjugate boundary condition of SU(N) on S1/Z2, as its label (eps_0, eps_1). */
export function cbcAll(N) {
  const t = cbcTypes(N), out = [];
  for (const e0 of t) for (const e1 of t) out.push([e0, e1]);
  return out;
}

/* The invariant subgroup of a conjugation automorphism: SO(N) when the pairing is symmetric and
 * Sp(N/2) when it is antisymmetric.  Real and quaternionic.  Standard group theory — this carries
 * the THEOREM chip on the page, and it is the one line here that is not ours. */
export function cbcFixed(eps, N) {
  if (eps === +1) return { label: `SO(${N})`, dim: (N * (N - 1)) / 2, kind: "real" };
  if (N % 2) return null;
  return { label: `Sp(${N / 2})`, dim: (N * (N + 1)) / 2, kind: "quaternionic" };
}

/* WHAT A LABEL LEAVES UNBROKEN — AND IT IS NOT A FUNCTION OF THE LABEL.  This is the same headline
 * `bcclass` carries, reproduced here by a different route, and it is the reason this returns two
 * strata instead of one group.
 *
 * The unbroken group is { Omega : Omega P_i Omega^T = P_i for i = 0, 1 }, so it depends on the
 * RELATIVE POSITION of the two twists — which is the holonomy H = P_1 P_0^*, which is exactly the
 * modulus the independence hypothesis throws away.  Measured as the dimension of the common kernel
 * of X P_i + P_i X^T = 0 on u(N) (`cbc_unbroken_gate.py`, calibrated against dim so(N) and
 * dim sp(N/2) on the pure diagonal cases):
 *
 *        label          COMPATIBLE position        GENERIC position
 *        (S,A) mixed    U(N/2),  dim N^2/4         dim N/2
 *        (S,S) pure     SO(N),   dim N(N-1)/2      dim 0
 *
 *   N = 4:  mixed 4 -> 2,   pure 6 -> 0.      N = 6:  mixed 9 -> 3,   pure 15 -> 0.
 *
 * And the drop is DISCONTINUOUS: interpolating away from the compatible point with a genuinely
 * unitary exp(tA), the dimension is already down at t = 1e-4 and never comes back.  The compatible
 * position is a measure-zero stratum, so ten random samples never land on it — which is how the
 * first version of this function came to report the special value as the class value.
 *
 * SO THE ANSWER CARRIES BOTH, and says which one a random point sees.  A panel that printed
 * U(N/2) alone would be advertising a symmetry that a reader would essentially never meet. */
export function cbcUnbroken([e0, e1], N) {
  const compatible = e0 === e1
    ? cbcFixed(e0, N)
    : { label: `U(${N / 2})`, dim: (N * N) / 4, kind: "mixed" };
  return {
    compatible,
    generic: e0 === e1
      ? { label: "trivial", dim: 0, kind: e0 === e1 ? "pure" : "mixed" }
      : { label: `U(1)^${N / 2}`, dim: N / 2, kind: "mixed" },
    is_class_function: false,
    note: "the unbroken group depends on the relative position of the twists — the holonomy — " +
      "not on (eps_0, eps_1). `compatible` is a measure-zero stratum; `generic` is what a random " +
      "point sees. Same statement as bcclass's: the apparent symmetry is not an invariant.",
  };
}

export const cbcShow = ([e0, e1]) =>
  `(${e0 > 0 ? "S" : "A"}, ${e1 > 0 ? "S" : "A"})`;

/* ------------------------------------------------------------------ the two hypotheses */

/* The hypothesis the count rests on, as DATA.  Every count below carries it; nothing in this
 * module returns a class number without it attached. */
export function cbcIndependence() {
  return {
    question: "may Omega(0) and Omega(pi R) be taken independent for a CONJUGATE condition?",
    status: "OPEN — assumed by the ordinary treatment, not verified for this family",
    difference: "the spectrum of the holonomy H = P_1 P_0^*",
    single_omega: "H -> Omega H Omega^dagger (unitary similarity): the spectrum IS extra label",
    independent_omegas: "no cancellation: only (eps_0, eps_1) survives",
    measured_in: "cbc_holonomy_gate.py — similarity to 4.89e-15 over 720 samples; " +
      "decoy with independent Omegas separates the spectra by at least 0.18 over the same 720",
    candidate_resolution: "H is the Wilson-line holonomy and its phases are dynamical (Hosotani), " +
      "so a modulus rather than a label — the same argument the ordinary case uses. NOT a proof.",
    asked_of: "Adachi and Fujimoto, 6 September 2026; Yugo Abe not yet reached",
  };
}

/* The count, under each hypothesis, with the hypothesis attached. */
export function cbcCount(N) {
  const labels = cbcAll(N);
  return {
    N,
    independent: {
      classes: labels.length,                  /* 4 for N even, 1 for N odd */
      finite: true,
      label: "(eps_0, eps_1)",
      members: "a continuum — the congruence class of a unitary twist is not a finite orbit",
    },
    single: {
      classes: null,
      finite: false,
      label: "(eps_0, eps_1) AND the spectrum of H = P_1 P_0^*",
      members: "a continuum, and the label itself carries a continuous parameter",
    },
    ordinary_for_contrast: (N + 1) * (N + 1),  /* bcclass on S1/Z2 — Haba-Hosotani-Kawamura */
    independence: cbcIndependence(),
  };
}

/* ------------------------------------------------------------------ the finite model */

/* Monomial matrices over a finite set of units: a permutation of N with one unit on each entry.
 *
 * WHY THIS TAKES A `units` ARGUMENT: so that the two unit sets can be COMPARED, which is what
 * falsified the first explanation.  mu_2 = {+-1} and mu_4 = {+-1, +-i} give the SAME orbit counts
 * (5 and 5 at N = 2), and that null result is the evidence — see the header: the action reaches
 * only SQUARES of units, mu_n^2 = mu_{n/2}, so the quotient is 2 for every even n and enlarging
 * the units cannot help.  Everything stays exact: entries are [re, im] pairs of INTEGERS, so only
 * mu_2 and mu_4 are representable; anything else would need Z[zeta_8]. */
export const UNITS_REAL = [[1, 0], [-1, 0]];
export const UNITS_GAUSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cZero = () => [0, 0];
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cNeg = (a) => [-a[0], -a[1]];
const cEq = (a, b) => a[0] === b[0] && a[1] === b[1];

export function cbcMonomials(N, units = UNITS_GAUSS) {
  for (const [re, im] of units) {
    if (!Number.isInteger(re) || !Number.isInteger(im)) {
      throw new Error("cbcMonomials: units must be exact in Z[i]. An orbit walk whose keys are " +
        "rounded floats stops colliding and silently inflates the count; mu_8 and beyond need " +
        "Z[zeta_8] arithmetic, which this module does not have.");
    }
  }
  const out = [], perm = [], used = new Array(N).fill(false);
  const u = units.length;
  const rec = (k) => {
    if (k === N) {
      const total = u ** N;
      for (let s = 0; s < total; s++) {
        const M = Array.from({ length: N }, () => Array.from({ length: N }, cZero));
        let t = s;
        for (let i = 0; i < N; i++) { M[i][perm[i]] = units[t % u]; t = (t - t % u) / u; }
        out.push(M);
      }
      return;
    }
    for (let j = 0; j < N; j++) {
      if (used[j]) continue;
      used[j] = true; perm[k] = j; rec(k + 1); used[j] = false;
    }
  };
  rec(0);
  return out;
}

/* kept under its old name because `_test_cbclass.mjs` measures the REAL model on purpose, to show
 * the signature is what splits it */
export const cbcSignedPerms = (N) => cbcMonomials(N, UNITS_REAL);

const mul = (A, B) => A.map((r, i) =>
  B[0].map((_, j) => r.reduce((s, _v, k) => cAdd(s, cMul(A[i][k], B[k][j])), cZero())));
const tr = (A) => A.map((r, i) => r.map((_, j) => A[j][i]));
const same = (A, B) => A.every((r, i) => r.every((v, j) => cEq(v, B[i][j])));
const key = (A) => A.map((r) => r.map((v) => `${v[0]}+${v[1]}i`).join(",")).join(";");

/* The symmetry type of an exact integer twist, or null if it is neither. */
export function cbcEps(P) {
  const T = tr(P);
  if (same(T, P)) return +1;
  if (same(T, P.map((r) => r.map(cNeg)))) return -1;
  return null;
}

/* The twists inside the finite model: the signed permutations that ARE a legal twist. */
export function cbcModelTwists(N, units = UNITS_GAUSS) {
  return cbcMonomials(N, units).filter((P) => cbcEps(P) !== null);
}

/* Congruence by every signed permutation: the moves of the finite model. */
export function cbcModelMoves(P, N, units = UNITS_GAUSS) {
  return cbcMonomials(N, units).map((O) => mul(mul(O, P), tr(O)));
}

/* The orbits, walked breadth-first — the same shape as `bcClasses`. */
export function cbcModelOrbits(N, units = UNITS_GAUSS) {
  const twists = cbcModelTwists(N, units), seen = new Map(), orbits = [];
  for (const P of twists) {
    if (seen.has(key(P))) continue;
    const orbit = [], queue = [P];
    seen.set(key(P), orbits.length);
    while (queue.length) {
      const Q = queue.shift();
      orbit.push(Q);
      for (const R of cbcModelMoves(Q, N, units)) {
        if (seen.has(key(R))) continue;
        seen.set(key(R), orbits.length);
        queue.push(R);
      }
    }
    orbits.push(orbit);
  }
  return orbits;
}

/* IS THE FINITE MODEL FAITHFUL?  It reproduces Autonne-Takagi exactly when its orbits separate by
 * eps and by nothing else: one orbit per available symmetry type.  If it splits further, the extra
 * orbits are an artefact of restricting to signed permutations and this says so — a model that
 * reported the larger number as the answer would be the tool telling its first lie. */
export function cbcFiniteModelFaithful(N, units = UNITS_GAUSS) {
  const orbits = cbcModelOrbits(N, units);
  const byEps = new Map();
  for (const o of orbits) {
    const e = cbcEps(o[0]);
    byEps.set(e, (byEps.get(e) || 0) + 1);
  }
  const types = cbcTypes(N);
  const faithful = orbits.length === types.length &&
    types.every((e) => byEps.get(e) === 1);
  return {
    N,
    units: units.length,
    twists: cbcModelTwists(N, units).length,
    orbits: orbits.length,
    orbits_per_eps: Object.fromEntries([...byEps].map(([e, c]) => [e > 0 ? "S" : "A", c])),
    expected_by_theory: types.length,
    faithful,
    note: faithful
      ? "the finite model reproduces Autonne-Takagi: one orbit per symmetry type"
      : "EXPECTED, and it is a theorem about the model rather than a shortage of units: " +
        "congruence uses Omega twice, so it reaches only squares, mu_n^2 = mu_{n/2}, and the " +
        "diagonal twists split into mu_n/mu_{n/2} = 2 classes for every even n. No finite group " +
        "of roots of unity is square-closed, so no finite model of this action is ever faithful. " +
        "The conjugate classification is NOT a combinatorial orbit problem — unlike bcclass.",
    why_not_faithful: "square-closure: the congruence action reaches only u^2",
  };
}

/* ------------------------------------------------------------------ the holonomy */

/* tr(H^k) for k = 1..2N: a complete invariant of unitary similarity at fixed size, and therefore
 * exactly the data that the single-Omega hypothesis adds to the label and the independent-Omega
 * one throws away.  Exact here, because the finite model is integral. */
export function cbcHolonomyTraces(P0, P1, N) {
  const H = mul(P1, P0.map((r) => r.map((v) => [v[0], -v[1]])));   /* P_1 P_0^*  */
  let P = H.map((r, i) => r.map((_, j) => (i === j ? [1, 0] : [0, 0])));
  const out = [];
  for (let k = 1; k <= 2 * N; k++) {
    P = mul(P, H);
    out.push(P.reduce((s, r, i) => cAdd(s, r[i]), cZero()));
  }
  return out;
}

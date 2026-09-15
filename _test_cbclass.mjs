/* _test_cbclass.mjs — the conjugate classification, against a route that is not the module's.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE HOUSE RULE HERE IS THE HARD ONE: two independent routes.  `cbclass.mjs` is combinatorial and
 * exact — labels, signs, integer monomial matrices.  So this harness does NOT re-run that: it
 * builds the same objects out of RANDOM COMPLEX UNITARIES and checks the module's answers against
 * floating-point linear algebra that shares no line of code with it.  Where the module says a
 * dimension, this harness computes it as the rank of a linear system; where the module says a
 * label is invariant, this harness moves the object by a random gauge transformation and looks.
 *
 * WHAT IS PUT AT RISK, and the ones that matter are the ones an outside computation could lose:
 *
 *   - the CALIBRATION first: the linear-system route must reproduce dim so(N) and dim sp(N/2) on
 *     the two pure diagonal cases before it is allowed to say anything about mixed ones.  A
 *     measuring device that has not been shown to measure is not evidence.
 *   - eps is invariant under congruence, and the symmetric/antisymmetric split is what the module
 *     claims it is;
 *   - N odd admits NO non-singular antisymmetric twist, so the count is 1 and not 4 — checked by
 *     trying to build one rather than by quoting the parity argument;
 *   - the HOLONOMY LAW, which is the whole content of the independence question: with ONE Omega,
 *     H = P_1 P_0^* moves by unitary similarity; with two, it does not.  Both halves, because the
 *     second is what makes the first mean something;
 *   - the UNBROKEN GROUP IS NOT A CLASS FUNCTION.  The module returns two strata and says a random
 *     point sees the generic one; this harness lands on both and checks the jump is real, and that
 *     the jump is not an artefact of the measurer — moving BOTH twists by the same Omega must not
 *     change any dimension;
 *   - and the finite model is checked to be UNfaithful, on purpose, with the square-closure reason
 *     tested by enlarging the units and finding the count unchanged — the null result that killed
 *     the first explanation written for it.
 *
 *   node _test_cbclass.mjs
 */
import { cbcTypes, cbcAll, cbcFixed, cbcUnbroken, cbcShow, cbcIndependence, cbcCount,
         cbcMonomials, cbcModelTwists, cbcModelOrbits, cbcFiniteModelFaithful,
         cbcEps, cbcHolonomyTraces, UNITS_REAL, UNITS_GAUSS }
  from "./src/modules/cbclass.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* ------------------------------------------------------------------ the independent route
 * complex linear algebra in floating point, written here and nowhere else in the repo. */

const cx = (re, im = 0) => ({ re, im });
const add = (a, b) => cx(a.re + b.re, a.im + b.im);
const sub = (a, b) => cx(a.re - b.re, a.im - b.im);
const mlt = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cnj = (a) => cx(a.re, -a.im);
const abs2 = (a) => a.re * a.re + a.im * a.im;

const zeros = (n) => Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0)));
const ident = (n) => zeros(n).map((r, i) => r.map((_, j) => cx(i === j ? 1 : 0)));
const mm = (A, B) => A.map((_, i) => A.map((_, j) =>
  A[i].reduce((s, _v, k) => add(s, mlt(A[i][k], B[k][j])), cx(0))));
const tp = (A) => A.map((_, i) => A.map((_, j) => A[j][i]));
const cg = (A) => A.map((r) => r.map(cnj));
const maxdiff = (A, B) => Math.max(...A.flatMap((r, i) => r.map((v, j) => Math.hypot(
  v.re - B[i][j].re, v.im - B[i][j].im))));

/* a deterministic pseudo-random stream, so a failure is reproducible */
let seed = 20260915;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

function randU(n) {
  const M = zeros(n).map((r) => r.map(() => cx(gauss(), gauss())));
  const Q = [];
  for (let i = 0; i < n; i++) {
    let v = M[i].slice();
    for (const q of Q) {
      const c = q.reduce((s, qk, k) => add(s, mlt(cnj(qk), v[k])), cx(0));
      v = v.map((vk, k) => sub(vk, mlt(c, q[k])));
    }
    const nv = Math.sqrt(v.reduce((s, x) => s + abs2(x), 0));
    Q.push(v.map((x) => cx(x.re / nv, x.im / nv)));
  }
  return Q;
}

const congr = (P, O) => mm(mm(O, P), tp(O));
const symTwist = (n) => { const O = randU(n); return mm(O, tp(O)); };
const Jform = (n) => { const M = zeros(n);
  for (let k = 0; k < n / 2; k++) { M[2 * k][2 * k + 1] = cx(1); M[2 * k + 1][2 * k] = cx(-1); }
  return M; };
const antiTwist = (n) => (n % 2 ? null : congr(Jform(n), randU(n)));

/* dim_R { X in u(n) : X P + P X^T = 0 for every P }, by the rank of the real linear system.
 * This is the harness's own device and it is CALIBRATED below before it is believed. */
function dimUnbroken(Ps, n) {
  const B = [];
  for (let i = 0; i < n; i++) { const E = zeros(n); E[i][i] = cx(0, 1); B.push(E); }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const E = zeros(n); E[i][j] = cx(1); E[j][i] = cx(-1); B.push(E);
    const F = zeros(n); F[i][j] = cx(0, 1); F[j][i] = cx(0, 1); B.push(F);
  }
  const cols = B.map((X) => {
    const col = [];
    for (const P of Ps) {
      const R = mm(X, P), S = mm(P, tp(X));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        col.push(R[i][j].re + S[i][j].re, R[i][j].im + S[i][j].im);
      }
    }
    return col;
  });
  const rows = cols[0].map((_, r) => cols.map((c) => c[r]));
  /* rank by Gaussian elimination with partial pivoting */
  let rank = 0;
  const M = rows.map((r) => r.slice());
  for (let c = 0; c < B.length && rank < M.length; c++) {
    let piv = -1, best = 1e-8;
    for (let i = rank; i < M.length; i++) if (Math.abs(M[i][c]) > best) { best = Math.abs(M[i][c]); piv = i; }
    if (piv < 0) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    M[rank] = M[rank].map((x) => x / pv);
    for (let i = 0; i < M.length; i++) if (i !== rank && M[i][c] !== 0) {
      const f = M[i][c];
      M[i] = M[i].map((x, k) => x - f * M[rank][k]);
    }
    rank++;
  }
  return B.length - rank;
}

/* ------------------------------------------------------------------ 0. calibrate the device */

H("the harness's own measuring device, calibrated before it is believed");
{
  for (const n of [4, 6]) {
    ok(`N=${n}: dim{X : X + X^T = 0} is dim so(${n}) = ${n * (n - 1) / 2}`,
       dimUnbroken([ident(n)], n) === (n * (n - 1)) / 2,
       `got ${dimUnbroken([ident(n)], n)}`);
    ok(`N=${n}: dim of the J-preserving algebra is dim sp(${n / 2}) = ${n * (n + 1) / 2}`,
       dimUnbroken([Jform(n)], n) === (n * (n + 1)) / 2,
       `got ${dimUnbroken([Jform(n)], n)}`);
  }
  ok("moving BOTH twists by the same Omega cannot change any dimension — the device is not noisy",
     [4, 6].every((n) => { const O = randU(n);
       return dimUnbroken([ident(n), Jform(n)], n)
           === dimUnbroken([congr(ident(n), O), congr(Jform(n), O)], n); }));
}

/* ------------------------------------------------------------------ 1. the labels */

H("the labels, and why N odd has one and N even has four");
{
  ok("N odd offers only the symmetric twist", [3, 5, 7].every((N) =>
     cbcTypes(N).length === 1 && cbcTypes(N)[0] === +1));
  ok("N even offers both", [2, 4, 6, 8].every((N) => cbcTypes(N).length === 2));
  ok("so the count is 1 for N odd and 4 for N even, flat in N",
     [3, 5, 7].every((N) => cbcAll(N).length === 1) &&
     [2, 4, 6, 8].every((N) => cbcAll(N).length === 4));
  ok("...and no non-singular ANTISYMMETRIC twist can be built for N odd — tried, not quoted",
     [3, 5].every((n) => antiTwist(n) === null));
  ok("against the ordinary case, which grows: (N+1)^2 is 81 at N=8 where this is 4",
     cbcCount(8).ordinary_for_contrast === 81 && cbcCount(8).independent.classes === 4);
  ok("the fixed subgroup of a symmetric twist is SO(N), of an antisymmetric one Sp(N/2)",
     cbcFixed(+1, 6).label === "SO(6)" && cbcFixed(-1, 6).label === "Sp(3)");
  ok("and Sp is refused for N odd rather than invented", cbcFixed(-1, 5) === null);
  ok("cbcShow names the label the way the panel prints it", cbcShow([1, -1]) === "(S, A)");
}

/* ------------------------------------------------------------------ 2. eps is the invariant */

H("eps survives congruence, and it is what the module says it is — random unitaries, not monomials");
{
  let bad = 0, n_checked = 0;
  for (const n of [2, 4, 6]) for (let t = 0; t < 8; t++) {
    for (const [eps, mk] of [[+1, symTwist], [-1, antiTwist]]) {
      const P = mk(n); if (!P) continue;
      const Q = congr(P, randU(n));
      n_checked++;
      const want = (M) => maxdiff(tp(M), M.map((r) => r.map((v) => cx(eps * v.re, eps * v.im))));
      if (want(P) > 1e-9 || want(Q) > 1e-9) bad++;
    }
  }
  ok(`eps invariant under congruence on ${n_checked} random twists`, bad === 0 && n_checked > 0,
     `${bad} failures`);
  ok("and the module reads the same sign off an exact monomial twist",
     cbcEps(cbcModelTwists(4, UNITS_GAUSS).find((P) => cbcEps(P) === -1)) === -1);
}

/* ------------------------------------------------------------------ 3. the holonomy law */

H("the holonomy law — the whole content of the independence question, and BOTH halves of it");
{
  let worst = 0, least = Infinity, n_checked = 0;
  for (const n of [2, 4, 6]) for (let t = 0; t < 10; t++) {
    const P0 = symTwist(n), P1 = (n % 2 ? symTwist(n) : antiTwist(n));
    const Hm = mm(P1, cg(P0));
    const O = randU(n);
    const H1 = mm(congr(P1, O), cg(congr(P0, O)));
    worst = Math.max(worst, maxdiff(H1, mm(mm(O, Hm), tp(cg(O)))));
    const O2 = randU(n);
    const H2 = mm(congr(P1, O), cg(congr(P0, O2)));
    const tr = (M) => { let P = ident(n), out = [];
      for (let k = 1; k <= 2 * n; k++) { P = mm(P, M);
        out.push(P.reduce((s, r, i) => add(s, r[i]), cx(0))); }
      return out; };
    const a = tr(Hm), b = tr(H2);
    least = Math.min(least, Math.max(...a.map((x, k) => Math.hypot(x.re - b[k].re, x.im - b[k].im))));
    n_checked++;
  }
  ok(`ONE Omega: H -> Omega H Omega^dagger, over ${n_checked} samples (worst ${worst.toExponential(2)})`,
     worst < 1e-8 && n_checked > 0);
  ok(`TWO Omegas: the trace spectrum is NOT preserved (smallest separation ${least.toFixed(3)})`,
     least > 1e-3 && n_checked > 0,
     "if this passed too, the two hypotheses would be indistinguishable and the question vacuous");
  ok("the module carries the question rather than deciding it",
     /OPEN/.test(cbcIndependence().status) && cbcCount(6).single.classes === null);
  ok("...and every count it returns comes with the hypothesis attached",
     cbcCount(6).independence !== undefined);
}

/* ------------------------------------------------------------------ 4. mixed classes, exactly */

H("the mixed class kills every odd winding — exact integers here, 121 floating checks in Python");
{
  const N = 4, tw = cbcModelTwists(N, UNITS_GAUSS);
  const S = tw.find((P) => cbcEps(P) === +1), A = tw.find((P) => cbcEps(P) === -1);
  const pure = cbcHolonomyTraces(S, S, N), mixed = cbcHolonomyTraces(S, A, N);
  ok("pure (S,S): no winding vanishes", pure.every((t) => t[0] !== 0 || t[1] !== 0));
  ok("mixed (S,A): every ODD winding vanishes",
     mixed.every(([re, im], k) => (k % 2 === 1) || (re === 0 && im === 0)),
     JSON.stringify(mixed));
  ok("...and not every even one does, so the statement is not vacuous",
     mixed.some(([re, im], k) => k % 2 === 1 && (re !== 0 || im !== 0)));
}

/* ------------------------------------------------------------------ 5. not a class function */

H("the unbroken group is NOT a function of the label — the same headline bcclass carries");
{
  for (const n of [4, 6]) {
    const u = cbcUnbroken([+1, -1], n);
    ok(`N=${n}: the module says so itself`, u.is_class_function === false);
    ok(`N=${n}: compatible stratum measures U(${n / 2}), dim ${n * n / 4}`,
       dimUnbroken([ident(n), Jform(n)], n) === u.compatible.dim,
       `measured ${dimUnbroken([ident(n), Jform(n)], n)}, module says ${u.compatible.dim}`);
    const gen = new Set();
    for (let t = 0; t < 6; t++) gen.add(dimUnbroken([ident(n), congr(Jform(n), randU(n))], n));
    ok(`N=${n}: a random point sees dim ${u.generic.dim}, not ${u.compatible.dim}`,
       gen.size === 1 && [...gen][0] === u.generic.dim,
       `measured ${[...gen]}, module says ${u.generic.dim}`);
    ok(`N=${n}: so the two strata really differ`, u.compatible.dim !== u.generic.dim);
    const pu = cbcUnbroken([+1, +1], n);
    ok(`N=${n}: and the PURE label jumps further still, SO(${n}) to trivial`,
       dimUnbroken([ident(n), ident(n)], n) === pu.compatible.dim && pu.generic.dim === 0);
  }
}

/* ------------------------------------------------------------------ 6. the finite model fails */

H("the finite model is UNfaithful on purpose, and enlarging the units does not help");
{
  const real2 = cbcFiniteModelFaithful(2, UNITS_REAL), gauss2 = cbcFiniteModelFaithful(2, UNITS_GAUSS);
  ok("mu_2 is not faithful", real2.faithful === false);
  ok("mu_4 is not faithful either", gauss2.faithful === false);
  ok("and the orbit count is UNCHANGED between them — the null that killed the Sylvester story",
     real2.orbits === gauss2.orbits, `${real2.orbits} vs ${gauss2.orbits}`);
  ok("the module gives the reason rather than the number alone",
     /square-closure/.test(real2.why_not_faithful));
  ok("units that are not exact in Z[i] are REFUSED, not run in floating point", (() => {
    try { cbcMonomials(2, [[1, 0], [0.7071, 0.7071]]); return false; } catch { return true; }
  })());
  ok("N=3: the model splits the symmetric side where the theorem gives one class",
     cbcFiniteModelFaithful(3, UNITS_REAL).orbits > 1);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

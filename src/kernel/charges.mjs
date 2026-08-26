/* charges.mjs — Part VI's charge bookkeeping: the six anomaly channels, the lepton ladder, the
 * escape from proton decay and the selection rule, in exact rational arithmetic.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Pure functions, no DOM, no floats where an integer is meant.  Everything here is arithmetic on
 * Komori-Maru's own equations (arXiv:2503.04090), as Part VI reads them:
 *
 *   eq. (27)/(31)  T3L = (n4 - n5)/2,  Qem  =>  Y = (0,0,0,1/2,1/2,-1,0) per index
 *   eq. (79)       U(1)' = (1/2) diag(0,0,0,1,-1,1,-1);  extra := U(1)' - T3L = (n6 - n7)/2
 *   eq. (46)       the lepton Yukawa is <A5> connecting index 5 <-> 7, so e_R is L with a 5 -> 7
 *   eq. (47)       brane quark Yukawas  =>  extra(u_R, d_R) = X_Q +- 1/2
 *   eqs. (37)-(40) a component survives iff p5 p5' = eta eta', with 4D chirality -eta p5
 *
 * and the paper's own pairing prescription: every unwanted bulk zero mode is lifted by a conjugate
 * brane fermion, so the anomaly of the 4D theory is the anomaly of the SURVIVING chiral content.
 * The Python this is ported from -- su7_anomaly_channels.py, su7_family_u1.py, su7_realisable.py,
 * su7_qphi.py, su7_residual_group.py -- archived its output beside Part VI; _test_escape.mjs holds
 * this file to those numbers.
 */

/* ------------------------------------------------------------------ exact rationals */

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/* A rational is a frozen { n, d } with d > 0 and gcd(n, d) = 1.  Integers stay small here --
 * charges are sixths and eighteenths, cubes reach 5832 -- so plain numbers suffice. */
export function R(n, d = 1) {
  if (typeof n === "object" && n !== null && "n" in n) return n;
  if (typeof n === "string") return parse(n);
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0)
    throw new Error(`R(): not a rational: ${n}/${d}`);
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return Object.freeze({ n: n / g, d: d / g });
}
export function parse(s) {
  const m = String(s).trim().replace("−", "-").match(/^([+-]?\d+)(?:\s*\/\s*(\d+))?$/);
  if (!m) throw new Error(`not a rational: ${JSON.stringify(s)}`);
  return R(parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 1);
}
export const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => R(a.n * b.n, a.d * b.d);
export const div = (a, b) => { if (b.n === 0) throw new Error("division by zero"); return R(a.n * b.d, a.d * b.n); };
export const neg = (a) => R(-a.n, a.d);
export const abs = (a) => R(Math.abs(a.n), a.d);
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isZero = (a) => a.n === 0;
export const isInt = (a) => a.d === 1;
export const lt = (a, b) => a.n * b.d < b.n * a.d;
export const toNum = (a) => a.n / a.d;
export const str = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
export const sum = (xs) => xs.reduce((s, x) => add(s, x), R(0));
const pow = (a, k) => { let r = R(1); for (let i = 0; i < k; i++) r = mul(r, a); return r; };
export const HALF = R(1, 2), ZERO = R(0), ONE = R(1);
/* gcd of two non-negative rationals: the generator of <a, b> as a subgroup of Q */
export function rgcd(a, b) {
  a = abs(a); b = abs(b);
  if (isZero(a)) return b;
  if (isZero(b)) return a;
  return R(gcd(a.n * b.d, b.n * a.d), a.d * b.d);
}

/* ------------------------------------------------------------------ one generation */

/* The surviving chiral content of one generation, all left-handed Weyl: [T3C, T3L, Y, X] with
 * X the U(1)' charge.  `a` is the brane-quark charge X_Q, `l` = extra(L) the lepton's rung
 * charge, `nus` the U(1)' charges of any right-handed neutrinos kept (SM singlets).  Their
 * eq. (47) fixes u^c, d^c from a; their eq. (46) fixes e^c from l: extra(L) + extra(e^c) = 1/2
 * on every rung, the Higgs's own charge. */
export function generation(a, l, nus = []) {
  a = R(a); l = R(l);
  const out = [];
  for (const tc of [HALF, neg(HALF), ZERO]) {
    for (const tl of [HALF, neg(HALF)]) out.push([tc, tl, R(1, 6), add(a, tl)]);
    out.push([neg(tc), ZERO, R(-2, 3), neg(add(a, HALF))]);
    out.push([neg(tc), ZERO, R(1, 3), neg(sub(a, HALF))]);
  }
  for (const tl of [HALF, neg(HALF)]) out.push([ZERO, tl, neg(HALF), add(l, tl)]);
  out.push([ZERO, ZERO, ONE, sub(HALF, l)]);
  for (const v of nus) out.push([ZERO, ZERO, ZERO, R(v)]);
  return out;
}

/* THE SIX CHANNELS involving U(1)', state by state with Cartan generators so that no index has to
 * be assumed: the sum of T3^2 over a doublet is 1/2 = T(fund), and comes out rather than going in. */
export const CHANNELS = [
  { id: "su3_x", label: "[SU(3)_C]² X", f: (s) => sum(s.map(([tc, , , x]) => mul(x, mul(tc, tc)))) },
  { id: "su2_x", label: "[SU(2)_L]² X", f: (s) => sum(s.map(([, tl, , x]) => mul(x, mul(tl, tl)))) },
  { id: "x2_y", label: "X² Y", f: (s) => sum(s.map(([, , y, x]) => mul(mul(x, x), y))) },
  { id: "x_y2", label: "X Y²", f: (s) => sum(s.map(([, , y, x]) => mul(x, mul(y, y)))) },
  { id: "x_grav", label: "X · grav²", f: (s) => sum(s.map(([, , , x]) => x)) },
  { id: "x3", label: "X³", f: (s) => sum(s.map(([, , , x]) => pow(x, 3))) },
];
export const SM_CHANNELS = [
  { id: "su3_y", label: "[SU(3)_C]² Y", f: (s) => sum(s.map(([tc, , y]) => mul(y, mul(tc, tc)))) },
  { id: "su2_y", label: "[SU(2)_L]² Y", f: (s) => sum(s.map(([, tl, y]) => mul(y, mul(tl, tl)))) },
  { id: "y3", label: "Y³", f: (s) => sum(s.map(([, , y]) => pow(y, 3))) },
  { id: "y_grav", label: "Y · grav²", f: (s) => sum(s.map(([, , y]) => y)) },
];

export function channels(states) {
  const out = {};
  for (const c of CHANNELS) out[c.id] = c.f(states);
  return out;
}

/* Exact interpolation of a channel as a polynomial of degree <= 3 in a = X_Q, for a fixed set of
 * rungs and neutrinos: coefficients [c0, c1, c2, c3].  Newton's divided differences, in rationals. */
export function channelPolynomial(chan, { rungs = [HALF], nus = [] } = {}) {
  const f = (a) => chan.f(rungs.flatMap((l, j) => generation(a, l, j === 0 ? nus : [])));
  const xs = [0, 1, 2, 3].map((k) => R(k)), ys = xs.map(f);
  const div_ = ys.slice();
  for (let k = 1; k <= 3; k++)
    for (let i = 3; i >= k; i--)
      div_[i] = div(sub(div_[i], div_[i - 1]), sub(xs[i], xs[i - k]));
  let co = [ZERO, ZERO, ZERO, ZERO], basis = [ONE, ZERO, ZERO, ZERO];
  for (let k = 0; k <= 3; k++) {
    co = co.map((c, i) => add(c, mul(div_[k], basis[i])));
    const nb = [ZERO, ZERO, ZERO, ZERO];
    for (let i = 0; i < 3; i++) nb[i + 1] = add(nb[i + 1], basis[i]);
    for (let i = 0; i <= 3; i++) nb[i] = sub(nb[i], mul(xs[k], basis[i]));
    basis = nb;
  }
  return co;
}
export const polyStr = (co) => {
  const t = [];
  for (let i = 3; i >= 0; i--) if (!isZero(co[i]))
    t.push(`${str(co[i])}${["", " a", " a²", " a³"][i]}`);
  return t.length ? t.join(" + ").replace(/\+ -/g, "− ") : "0";
};
/* Rational roots of a polynomial with rational coefficients, over the denominators the charges
 * reach (p/q with q <= 60), or "every" for the zero polynomial, or [] for none. */
export function rationalRoots(co) {
  if (co.every(isZero)) return "every";
  const val = (a) => sum(co.map((c, i) => mul(c, pow(a, i))));
  const out = [];
  for (let q = 1; q <= 60; q++)
    for (let p = -60; p <= 60; p++) {
      const r = R(p, q);
      if (isZero(val(r)) && !out.some((x) => eq(x, r))) out.push(r);
    }
  return out.sort((x, y) => toNum(x) - toNum(y));
}

/* ------------------------------------------------------------------ the ladder, and its hosts */

/* A lepton doublet with Y = -1/2 is the component (5, 6, 7^k): extra(L) = (1 - k)/2. */
export const extraOfRung = (k) => R(1 - k, 2);
/* the proton-operator charge of a generation, A = 3a + l (Part VI eq. (2) at one generation) */
export const protonCharge = (a, l) => add(mul(R(3), R(a)), R(l));

const P5 = [1, 1, 1, 1, 1, -1, -1], P5p = [1, 1, 1, -1, -1, -1, 1];
const par = (M, n) => n.reduce((s, k, i) => (k % 2 ? s * M[i] : s), 1);
/* their eqs. (37)-(40): the 4D chirality of a component, or null if projected out */
export function mode(n, eta, etap) {
  if (par(P5, n) * par(P5p, n) !== eta * etap) return null;
  return -eta * par(P5, n);     /* -1 left, +1 right */
}
/* The representations of their paper, by boxes and symmetry.  The 48 is the adjoint and is real:
 * under diagonal +-1 parities its surviving spectrum is vector-like (Part VI Prop. 2), so it hosts
 * no chiral generation at any rung -- which is why it is listed and never returned. */
export const REPS = [
  { rep: "7", boxes: 1, sym: "fund" }, { rep: "21", boxes: 2, sym: "anti" },
  { rep: "28", boxes: 2, sym: "sym" }, { rep: "35", boxes: 3, sym: "anti" },
  { rep: "84", boxes: 3, sym: "sym" }, { rep: "48", boxes: null, sym: "adjoint" },
];
const compL = (k) => [0, 0, 0, 0, 1, 1, k], compE = (k) => [0, 0, 0, 0, 0, 1, k + 1];
/* Which representations host rung k -- L = (5,6,7^k) AND its partner e_R = (6,7^{k+1}) in the same
 * multiplet, or the Yukawa of their eq. (46) does not close -- and at which parities L is
 * left-handed and e_R right-handed with the doublet unsplit. */
export function hosts(k) {
  const out = [];
  for (const r of REPS) {
    if (r.sym === "adjoint" || r.sym === "fund") continue;
    const L = compL(k), E = compE(k);
    if (r.boxes !== k + 2) continue;
    const okL = r.sym === "sym" || Math.max(...L) <= 1;
    const okE = r.sym === "sym" || Math.max(...E) <= 1;
    if (!okL) continue;
    if (!okE) { out.push({ rep: r.rep, hostsL: true, hostsE: false, parities: [] }); continue; }
    const parities = [];
    for (const eta of [1, -1]) for (const etap of [1, -1]) {
      const up = [0, 0, 0, 1, 0, 1, k];
      if (mode(L, eta, etap) === -1 && mode(E, eta, etap) === 1 && mode(up, eta, etap) === -1)
        parities.push([eta, etap]);
    }
    out.push({ rep: r.rep, hostsL: true, hostsE: true, parities });
  }
  return out;
}
export const hostable = (k) => hosts(k).some((h) => h.hostsE && h.parities.length);

/* ------------------------------------------------------------------ the assignments */

/* Part VI §4: N = 3 generations on rungs from {0, 1, 2, 3} (l = 1/2, 0, -1/2, -1), the brane-quark
 * charge kept family-universal (an unrestricted renormalisable CKM needs it) so that
 * a = -(sum l)/9 and A_j = l_j - mean(l); right-handed neutrinos drawn from the singlet ladder
 * +-{1/2, 1, 3/2, 2}, up to three.  An assignment SURVIVES if every A_j is non-zero and all six
 * channels cancel; it is REALISABLE inside their own tensors if every rung is hostable (rung >= 2
 * would need a four-box tensor they never introduce), and STRICT-compatible if X_Q is on the bulk
 * lattice (1/2)Z. */
export const RUNG_L = [HALF, ZERO, neg(HALF), R(-1)];
export const NU_CHARGES = [-4, -3, -2, -1, 1, 2, 3, 4].map((m) => R(m, 2));

function* multisets(items, n, start = 0, acc = []) {
  if (acc.length === n) { yield acc.slice(); return; }
  for (let i = start; i < items.length; i++) { acc.push(items[i]); yield* multisets(items, n, i, acc); acc.pop(); }
}

export function assignments({ N = 3, maxNu = 3 } = {}) {
  const out = [];
  for (const ls of multisets(RUNG_L, N)) {
    const a = neg(div(sum(ls), R(3 * N)));
    const As = ls.map((l) => protonCharge(a, l));
    const protects = As.every((x) => !isZero(x));
    let found = null;
    if (protects)
      outer: for (let nn = 0; nn <= maxNu; nn++)
        for (const nus of multisets(NU_CHARGES, nn)) {
          const s = ls.flatMap((l, j) => generation(a, l, j === 0 ? nus : []));
          if (CHANNELS.every((c) => isZero(c.f(s)))) { found = nus.slice(); break outer; }
        }
    const rungs = ls.map((l) => 1 - 2 * l.n / l.d);
    out.push({
      l: ls, rungs, a, A: As, protects, nus: found, survives: found !== null,
      realisable: found !== null && rungs.every((k) => hostable(k)),
      strict: isInt(div(a, HALF)),
      needsMinusOne: found !== null && found.some((v) => eq(v, R(-1))),
      rung1: rungs.filter((k) => k === 1).length,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ the selection rule */

/* Part VI Prop. 3: a VEV of charge q_phi breaks U(1)' to a discrete subgroup; an operator of charge
 * A can be dressed with <phi> insertions iff A/q_phi is an integer.  So protection fails at q_phi
 * iff q_phi = |A_j|/n for some generation j and integer n >= 1 -- a countable set with a maximum,
 * max |A_j|, so protection is a half-line. */
export function protection(As, qphi) {
  As = As.map(R);
  const q = qphi === null || qphi === undefined ? null : R(qphi);
  const zeros = As.map((A, j) => (isZero(A) ? j : -1)).filter((j) => j >= 0);
  const failingGenerators = [...new Set(As.filter((A) => !isZero(A)).map((A) => str(abs(A))))]
    .map(parse).sort((x, y) => toNum(y) - toNum(x));
  const maxFail = failingGenerators.length ? failingGenerators[0] : null;
  const dressable = q === null ? null : As.map((A, j) => (isInt(div(A, q)) ? j : -1)).filter((j) => j >= 0);
  return {
    everyQFails: zeros.length > 0, zeros,
    failingSet: failingGenerators,          /* q_phi in {g/n : g in this set, n >= 1} fails */
    halfLine: maxFail,                        /* every q_phi > this protects, if no A_j = 0 */
    dressable, protectedAt: q === null ? null : dressable.length === 0,
  };
}
/* the brute scan Part VI ran against the closed form: every p/q in (0, 2] with q <= qmax */
export function scanProtection(As, qmax = 36) {
  As = As.map(R);
  const gens = protection(As, null).failingSet;
  let tested = 0, bad = 0;
  for (let d = 1; d <= qmax; d++)
    for (let n = 1; n <= 2 * d; n++) {
      const q = R(n, d);
      const scan = As.some((A) => isInt(div(A, q)));
      const closed = As.some((A) => isZero(A)) || gens.some((g) => isInt(div(g, q)));
      tested++; if (scan !== closed) bad++;
    }
  return { tested, bad };
}

/* The residual group.  The bulk lattice is (1/2)Z -- extra = (n6 - n7)/2 on every component --
 * so a VEV of charge q leaves Z_N with N = q / (1/2) when that is an integer; with several
 * condensing scalars the residual is generated by gcd(q_1, q_2, ...). */
export const QUANTUM = HALF;
export const SUPPLY = [{ q: HALF, rep: "7", component: "(7)" }, { q: ONE, rep: "28", component: "(77)" },
                       { q: R(3, 2), rep: "84", component: "(777)" }];
export function residual(qs) {
  const g = qs.map(R).reduce((acc, q) => rgcd(acc, q), ZERO);
  const r = div(g, QUANTUM);
  return { generator: g, N: isInt(r) ? r.n : null };
}
/* does a residual of quantum qeff forbid every A = (3m+1)/2, the Green-Schwarz-freed charges? */
export const protectsGS = (qeff) => {
  for (let m = -30; m <= 30; m++) if (isInt(div(R(3 * m + 1, 2), R(qeff)))) return false;
  return true;
};

/* ------------------------------------------------------------------ U(1)' as a combination */

/* At X_Q = -1/6, on every field, U(1)' = T3L + Y - (B-L); and the four dimension-6 |dB| = 1
 * operators are neutral under Y and under B-L, hence under the whole span. */
export const BL = { Q: R(1, 3), uc: R(-1, 3), dc: R(-1, 3), L: R(-1), ec: ONE, nc: ONE };
export function identityCheck(a = R(-1, 6)) {
  const s = generation(a, HALF, [R(-1)]);
  const labels = ["Q", "Q", "uc", "dc", "Q", "Q", "uc", "dc", "Q", "Q", "uc", "dc", "L", "L", "ec", "nc"];
  return s.every(([, tl, y, x], i) => eq(x, sub(add(tl, y), BL[labels[i]])));
}
export const OPERATORS = [
  { name: "QQQL", fields: [["Q", 1], ["Q", 1], ["Q", 1], ["L", 1]] },
  { name: "Q u^c* d^c* L", fields: [["Q", 1], ["uc", -1], ["dc", -1], ["L", 1]] },
  { name: "u^c u^c d^c e^c", fields: [["uc", 1], ["uc", 1], ["dc", 1], ["ec", 1]] },
  { name: "QQ u^c* e^c*", fields: [["Q", 1], ["Q", 1], ["uc", -1], ["ec", -1]] },
];
const YY = { Q: R(1, 6), uc: R(-2, 3), dc: R(1, 3), L: neg(HALF), ec: ONE };
export const operatorCharges = () => OPERATORS.map((o) => ({
  name: o.name,
  Y: sum(o.fields.map(([f, s]) => mul(R(s), YY[f]))),
  BL: sum(o.fields.map(([f, s]) => mul(R(s), BL[f]))),
}));

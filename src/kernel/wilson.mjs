/* wilson.mjs — the CALCULATOR's engine, the one the AHMN anchor accepts.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Ported verbatim from ghu-explorer/src/calc_shell.html.  This replaces the first attempt in
 * torus.mjs, which came from the SELECTION-RULE tool and gave 1.1405 for AHMN against 1.2046
 * published -- a mistake no internal test could see and only an outside number could.
 *
 * The engine, and the four things the other one lacked:
 *
 *   - `modes`, not a weight histogram: each representation is a list of (q, A, B), and q takes
 *     HALF-INTEGER values.  That is where alpha_1's period 2 comes from, and it is why measuring
 *     period 1 on the histogram engine was right about that engine and irrelevant to this one.
 *   - the ROLE: matter (+1) or gauge (-1), and the gauge sector swaps A and B.
 *   - eta, the boundary sign, which multiplies the COSET half AND NOTHING ELSE.  Writing
 *     (a + eta*b) instead put eta on the identity half too, and a BLIND multiplet's potential
 *     then moved.  The old node test caught that; the comment survives here so nobody re-does it.
 *   - the split by winding parity: even windings carry Sigma = A + B, a graded dimension that
 *     cannot cancel; odd windings carry eta*D = eta*(A - B), an index that can.
 */

/* content row: { key, n, eta, role }  --  role +1 matter, -1 gauge */
export function spectrum(rows, data) {
  const acc = new Map();                                   // charge -> [even, odd]
  for (const r of rows) {
    const modes = data.reps_modes[r.key];
    if (!modes) continue;
    for (const [q, A, B] of modes) {
      const a = r.role > 0 ? A : B, b = r.role > 0 ? B : A;   // the gauge sector's A<->B twist
      const w = r.n * r.role;
      const cur = acc.get(q) || [0, 0];
      cur[0] += w * (a + b);                               // Sigma
      cur[1] += w * r.eta * (a - b);                       // eta * D
      acc.set(q, cur);
    }
  }
  return [...acc.entries()].map(([q, c]) => [q, c[0], c[1]]).filter((x) => x[1] || x[2]);
}

/* The periods of the two Wilson phases, as ONE constant.
 *
 * It is here rather than in a data file because it is a property of this engine's charges — the
 * q are half-integers, and only in the alpha_2 direction does the coset sign (-1)^{k_2} compensate
 * the half-integer phase — and because everything that scans, folds or DRAWS the torus has to
 * agree with the minimiser about how big it is.  A renderer that normalised the domain to a square
 * would squash alpha_1 by two and nobody would see it happen.
 *
 * _test_wilson.mjs measures both periods on V itself and checks this constant against the
 * measurement, with the control that alpha_1 is NOT 1-periodic — without that control the
 * assertion "period 2" is satisfied by any period that divides it, and says nothing. */
export const PERIODS = [2, 1];

export function lattice(kmax) {
  const L = [];
  for (let k1 = -kmax; k1 <= kmax; k1++)
    for (let k2 = -kmax; k2 <= kmax; k2++)
      if (k1 || k2) L.push([k1, k2, Math.pow(k1 * k1 + k2 * k2, -3), k2 & 1]);
  return L;
}

export function V(sp, LATT, a1, a2) {
  let v = 0;
  for (const [k1, k2, w, odd] of LATT) {
    const th = k1 * a1 + k2 * a2;
    let s = 0;
    for (const [q, cE, cO] of sp) s += (odd ? cO : cE) * Math.cos(2 * Math.PI * q * th);
    v += w * s;
  }
  return v;
}

/* V over the regular grid  a1 = p0 i / nx  (i = 0..nx),  a2 = p1 j / ny  (j = 0..ny).
 *
 * Returns a Float64Array of (nx+1)(ny+1) values in row-major j-then-i order -- the same layout
 * `heightField` reads -- or null when the fast path does not apply, in which case the caller must
 * sum with V as before.  See the note above `VGrid`'s derivation in this file's header comment for
 * why this is the same number and not an approximation of it.
 */
export function VGrid(sp, LATT, nx, ny, { p0 = PERIODS[0], p1 = PERIODS[1] } = {}) {
  /* the indexing rests on 2q being an integer.  It is, for every charge in the shipped datasets --
   * and if a future one breaks it, this says so by refusing rather than by being subtly wrong. */
  const Q = [];
  for (const [q] of sp) {
    const n = Math.round(2 * q);
    if (Math.abs(2 * q - n) > 1e-9) return null;
    Q.push(n);
  }
  let kmax = 0;
  for (const [k1, k2] of LATT) kmax = Math.max(kmax, Math.abs(k1), Math.abs(k2));
  let qmax = 0;
  for (const n of Q) qmax = Math.max(qmax, Math.abs(n));

  /* u = 2q k, offset so it can index an array */
  const U = qmax * kmax, W = 2 * U + 1;
  const CI = new Float64Array(W * (nx + 1)), SI = new Float64Array(W * (nx + 1));
  const CJ = new Float64Array(W * (ny + 1)), SJ = new Float64Array(W * (ny + 1));
  for (let u = -U; u <= U; u++) {
    const r = (u + U);
    for (let i = 0; i <= nx; i++) {
      const a = Math.PI * u * p0 * i / nx;          /* 2*pi*q*k1*a1 with q = u/(2k1) folded in */
      CI[r * (nx + 1) + i] = Math.cos(a); SI[r * (nx + 1) + i] = Math.sin(a);
    }
    for (let j = 0; j <= ny; j++) {
      const b = Math.PI * u * p1 * j / ny;
      CJ[r * (ny + 1) + j] = Math.cos(b); SJ[r * (ny + 1) + j] = Math.sin(b);
    }
  }

  /* flatten the windings once, so the inner loop reads numbers and not tuples */
  const M = LATT.length, S = sp.length;
  const K1 = new Int32Array(M), K2 = new Int32Array(M), WT = new Float64Array(M);
  const ODD = new Uint8Array(M);
  for (let m = 0; m < M; m++) {
    const [k1, k2, w, odd] = LATT[m];
    K1[m] = k1; K2[m] = k2; WT[m] = w; ODD[m] = odd;
  }
  const CE = new Float64Array(S), CO = new Float64Array(S);
  for (let s = 0; s < S; s++) { CE[s] = sp[s][1]; CO[s] = sp[s][2]; }

  const out = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      let v = 0;
      for (let m = 0; m < M; m++) {
        const odd = ODD[m], k1 = K1[m], k2 = K2[m];
        let s0 = 0;
        for (let s = 0; s < S; s++) {
          const c = odd ? CO[s] : CE[s];
          if (!c) continue;
          const r1 = (Q[s] * k1 + U) * (nx + 1) + i, r2 = (Q[s] * k2 + U) * (ny + 1) + j;
          s0 += c * (CI[r1] * CJ[r2] - SI[r1] * SJ[r2]);
        }
        v += WT[m] * s0;
      }
      out[j * (nx + 1) + i] = v;
    }
  }
  return out;
}

export function gradV(sp, LATT, x, y, h = 0.004) {
  return [(V(sp, LATT, x + h, y) - V(sp, LATT, x - h, y)) / (2 * h),
          (V(sp, LATT, x, y + h) - V(sp, LATT, x, y - h)) / (2 * h)];
}

export function hessian(sp, LATT, a1, a2, h = 0.002) {
  const v0 = V(sp, LATT, a1, a2);
  const xx = (V(sp, LATT, a1 + h, a2) - 2 * v0 + V(sp, LATT, a1 - h, a2)) / (h * h);
  const yy = (V(sp, LATT, a1, a2 + h) - 2 * v0 + V(sp, LATT, a1, a2 - h)) / (h * h);
  const xy = (V(sp, LATT, a1 + h, a2 + h) - V(sp, LATT, a1 + h, a2 - h)
            - V(sp, LATT, a1 - h, a2 + h) + V(sp, LATT, a1 - h, a2 - h)) / (4 * h * h);
  return [xx, yy, xy];
}

export function eig(xx, yy, xy) {
  const tr = xx + yy, d = Math.sqrt(Math.max(0, (xx - yy) * (xx - yy) + 4 * xy * xy));
  return [(tr + d) / 2, (tr - d) / 2];                     // heavy, light
}

/* Coarse scan then Newton.  The polish is not a refinement: |grad V| at the grid cell the old page
 * called the vacuum was 0.15, and the AHMN mass ratio moved in the fourth digit because of it. */
/* `a2max` bounds the alpha_2 scan.  It exists so the search region the selection rule LICENSES can
 * be compared against the whole torus by running the same minimiser twice -- which is the only way
 * to show that halving costs nothing, rather than assert it. */
export function minimise(sp, LATT, { N = 60, steps = 80, tol = 1e-12, a2max = 1, seed = null } = {}) {
  let best = Infinity, ba = 0, bb = 0;
  /* A caller that has already scanned hands the scan's best point in and skips the grid.  Shrinking
   * N instead -- which is what a sweep is tempted to do for speed -- moves the Newton seed, and a
   * seed off the basin polishes to a saddle: at N = 12 that reported 25 of 119 contents as "not a
   * minimum", none of which was true. */
  if (seed) { ba = seed[0]; bb = seed[1]; }
  else {
    /* The scan is a regular grid, so it is one VGrid rather than (N+1)^2 separate sums -- the same
     * numbers, about seven times faster, and the grid is NOT made coarser to buy that: the comment
     * above is the reason N stays where it is. */
    const G = VGrid(sp, LATT, N, N, { p0: PERIODS[0], p1: a2max });
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const a1 = PERIODS[0] * i / N, a2 = a2max * j / N;
        const v = G ? G[j * (N + 1) + i] : V(sp, LATT, a1, a2);
        if (v < best) { best = v; ba = a1; bb = a2; }
      }
  }
  let a1 = ba, a2 = bb;
  for (let s = 0; s < steps; s++) {
    const [g1, g2] = gradV(sp, LATT, a1, a2);
    const [xx, yy, xy] = hessian(sp, LATT, a1, a2);
    const det = xx * yy - xy * xy;
    if (!isFinite(det) || Math.abs(det) < 1e-16) break;
    const d1 = (yy * g1 - xy * g2) / det, d2 = (xx * g2 - xy * g1) / det;
    a1 -= d1; a2 -= d2;
    if (Math.hypot(d1, d2) < tol) break;
  }
  const [g1, g2] = gradV(sp, LATT, a1, a2);
  const [xx, yy, xy] = hessian(sp, LATT, a1, a2);
  const [e1, e2] = eig(xx, yy, xy);
  return {
    alpha: [((a1 % PERIODS[0]) + PERIODS[0]) % PERIODS[0],
            ((a2 % PERIODS[1]) + PERIODS[1]) % PERIODS[1]],
    V: V(sp, LATT, a1, a2),
    grad: Math.hypot(g1, g2),
    hessian: { xx, yy, xy },
    masses2: [e2, e1],                                     // light, heavy
    /* the invariant: heavier over lighter.  No convention enters it, which is why it is the
     * quantity the anchor is stated in. */
    mass_ratio: e2 > 0 ? Math.sqrt(e1 / e2) : null,
    /* magnitude only -- the sign is fixed by the orientation of alpha_2, a convention */
    mixing: Math.abs(xy / xx),
    breaks: null,
  };
}

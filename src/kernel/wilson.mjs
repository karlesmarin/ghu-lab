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
  else
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const a1 = PERIODS[0] * i / N, a2 = a2max * j / N;
        const v = V(sp, LATT, a1, a2);
        if (v < best) { best = v; ba = a1; bb = a2; }
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

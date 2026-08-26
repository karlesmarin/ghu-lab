/* atlas.mjs — every SU(7) content at five multiplets, its potential drawn: the lattice as an atlas.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The SU(4) atlas draws 119 tori; here a tile is a CURVE, because the SU(7) model has one Wilson
 * phase.  What makes 1 286 potentials affordable in a browser is the same factoring the hierarchy
 * sweep uses: F is linear in the term table and every term is one of six atoms (s, c), so the
 * windings are summed once per atom per grid point and each content is six multiply-adds.
 *
 * Classification per tile, and each class is a statement the resolver would make:
 *   nobreak   D <= 0: the symmetric point is a minimum, nothing breaks
 *   nosol     D > 0 but the fixed point finds no small-alpha solution
 *   window    breaks, m_h inside [125, 127] -- ONE tile out of 1 286, and the harness pins it
 *             to ceiling_ilp.py's archived count and to their row (2) itself
 *   falsevac  breaks, but F(1) < F(0): the located stationary point is not the vacuum
 *   breaks    breaks, true vacuum, m_h outside the window
 */

import { moments, alphaMin, higgsMass, stabilityW, F } from "../kernel/potential.mjs";

export function buildAtlas7(data, { maxN = 5, tileGrid = 56, hiAlpha = 0.45,
                                    windings = 400 } = {}) {
  const slots = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep]))
      slots.push({ rep, key, table: data.reps[rep][key],
                   parities: [1, key[3] === "+" ? 1 : -1] });

  /* the atoms, and their curves on the tile grid -- once, for every content there will ever be */
  const atoms = [];
  const atomOf = (s, c) => {
    const i = atoms.findIndex((a) => a.s === s && a.c === c);
    return i >= 0 ? i : (atoms.push({ s, c }) - 1);
  };
  const vecOf = (table) => {
    const v = [];
    for (const [m, s, c] of table) { const i = atomOf(s, c); v[i] = (v[i] || 0) + m; }
    return v;
  };
  const gaugeVec = vecOf(data.gauge);
  const slotVecs = slots.map((s) => vecOf(s.table));
  const A = atoms.length;
  const pad = (v) => { const o = new Float64Array(A); v.forEach((x, i) => (o[i] = x || 0)); return o; };
  const GV = pad(gaugeVec), SV = slotVecs.map(pad);
  const alphas = new Float64Array(tileGrid + 1);
  for (let i = 0; i <= tileGrid; i++) alphas[i] = 1e-4 + (hiAlpha - 1e-4) * i / tileGrid;
  const BASIS = atoms.map(({ s, c }) => {
    const row = new Float64Array(tileGrid + 1);
    for (let i = 0; i <= tileGrid; i++) {
      let sub = 0;
      for (let n = 1; n <= windings; n++)
        sub += (s > 0 ? 1 : (n % 2 ? -1 : 1)) * Math.cos(n * c * Math.PI * alphas[i]) / n ** 5;
      row[i] = sub;
    }
    return row;
  });

  /* every content of at most maxN multiplets */
  const contents = [];
  const mult = new Array(slots.length).fill(0);
  (function rec(i, left) {
    if (i === slots.length) { if (mult.some((m) => m)) contents.push(mult.slice()); return; }
    for (let k = 0; k <= left; k++) { mult[i] = k; rec(i + 1, left - k); }
    mult[i] = 0;
  })(0, maxN);

  const conv = { m_W: 80.4, g4: 0.63, window: [125, 127] };
  const min8D = data.escape ? data.escape.min_8D : null;
  const hostIdx = slots.findIndex((s) => s.rep === "84" && s.key === "(+,+)");

  const tiles = contents.map((m) => {
    const terms = data.gauge.map((x) => x.slice());
    m.forEach((k, i) => { if (k) for (const [q, s, c] of slots[i].table) terms.push([q * k, s, c]); });
    const mo = moments(terms);
    const D8 = Math.round(8 * mo.D), A4 = Math.round(mo.A4);
    const W = stabilityW(terms);
    /* the curve, from the atoms: six multiply-adds per point */
    const av = new Float64Array(A);
    for (let i = 0; i < A; i++) av[i] = GV[i];
    m.forEach((k, i) => { if (k) for (let a = 0; a < A; a++) av[a] += k * SV[i][a]; });
    const curve = new Float32Array(tileGrid + 1);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= tileGrid; i++) {
      let y = 0;
      for (let a = 0; a < A; a++) y += av[a] * BASIS[a][i];
      curve[i] = y;
      if (y < lo) lo = y; if (y > hi) hi = y;
    }
    let cls, alpha = null, mh = null;
    if (!(mo.D > 0)) cls = "nobreak";
    else {
      alpha = alphaMin(mo);
      if (alpha === null) cls = "nosol";
      else {
        mh = higgsMass(mo, alpha, conv.m_W, conv.g4);
        const inWin = mh !== null && mh >= conv.window[0] && mh <= conv.window[1];
        cls = inWin ? "window" : (W < 0 ? "falsevac" : "breaks");
        /* a false vacuum can also sit in the window; the window is the rarer statement and the
         * harness pins its count, so it wins the colour and the verdict text carries W */
      }
    }
    const hasHost = hostIdx >= 0 && m[hostIdx] > 0;
    return { mult: m, D8, A4, W, alpha, mh, cls, curve, lo, hi,
             hasHost, canPay: hasHost && min8D !== null && D8 >= min8D };
  });

  const count = (f) => tiles.filter(f).length;
  return {
    slots: slots.map((s) => ({ rep: s.rep, key: s.key })),
    alphas, tiles,
    counts: {
      contents: tiles.length,
      window: count((t) => t.cls === "window"),
      falsevac: count((t) => t.cls === "falsevac"),
      breaks: count((t) => t.cls === "breaks"),
      nobreak: count((t) => t.cls === "nobreak"),
      nosol: count((t) => t.cls === "nosol"),
      window_with_host: count((t) => t.cls === "window" && t.hasHost),
      window_can_pay: count((t) => t.cls === "window" && t.canPay),
    },
  };
}

/* one tile's exact F, for the harness to hold a sampled curve to the direct sum */
export function tileControlF(data, mult, alpha, windings = 400) {
  const slots = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep])) slots.push(data.reps[rep][key]);
  const terms = data.gauge.map((x) => x.slice());
  mult.forEach((k, i) => { if (k) for (const [q, s, c] of slots[i]) terms.push([q * k, s, c]); });
  return F(terms, alpha, windings);
}

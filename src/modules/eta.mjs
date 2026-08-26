/* eta.mjs — Parts IV-V: what the boundary sign does, in closed form.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The whole eta-dependence of the Higgs mass matrix at the symmetric point is ONE number, and this
 * module computes it two ways so the page can show them side by side:
 *
 *   PREDICTED   from Part IV's box (p,q,r) and its parity index zeta, with no winding summed:
 *                 M_0 = zeta (p+1)(q+1)(r+1),   M_2 = M_0 (C_p + C_q + C_r)/3,   C_k = k(k+2)
 *                 S_2 = M_2/8   (the charges of the potential are j/2, and D(-j) = D(j))
 *                 dH_xx = -2(2pi)^2 L_1 S_2,   dH_yy = -2(2pi)^2 L_2 S_2,   dH_xy = 0 exactly
 *               with L_1 = sum over k_2 ODD of |k|^-6 k_1^2 and L_2 the same with k_2^2.
 *
 *   MEASURED    the brute-force difference of the Hessian at eta = +1 and eta = -1.  dH means
 *               H(+1) - H(-1), the whole gap between the two boundary signs.
 *
 * Both are taken from the published tool verbatim; the constants L_1 and L_2 are SUMMED here rather
 * than typed, because a constant typed from memory is what cost this port a day already.
 *
 * The consequence worth the section's existence: a content with M_2 = 0 is invisible to eta at this
 * order, HOWEVER LARGE IT IS.  Blindness is not smallness.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { spectrum, lattice, hessian, PERIODS } from "../kernel/wilson.mjs";

const Ck = (k) => k * (k + 2);

/* L_1 and L_2: the odd-winding sums.  Computed from the same lattice the potential uses. */
export function lodd(data) {
  let l1 = 0, l2 = 0;
  for (const [k1, k2, w, odd] of lattice(data.kmax)) if (odd) { l1 += w * k1 * k1; l2 += w * k2 * k2; }
  return [l1, l2];
}

/* One multiplet's moments, from its box alone -- no weight table, no winding sum. */
export function momentsOfBox(sides, zeta) {
  const [p, q, r] = sides;
  const M0 = zeta * (p + 1) * (q + 1) * (r + 1);
  const C = [Ck(p), Ck(q), Ck(r)];
  const e1 = C[0] + C[1] + C[2];
  const e2 = C[0] * C[1] + C[0] * C[2] + C[1] * C[2];
  const sq = C[0] * C[0] + C[1] * C[1] + C[2] * C[2];
  return [M0, M0 * e1 / 3, M0 * ((2 / 3) * e2 + sq / 5 - (4 / 15) * e1)];
}

/* Linear in the content: the sum of n * eta * M(lambda).
 *
 * THREE CASES, AND THE THIRD IS WHY THIS FUNCTION IS LONGER THAN THE SUM IT COMPUTES.  A multiplet
 * either has a box (compute it), or is DECLARED blind in the catalogue (it contributes exactly zero,
 * and that zero is a physical statement -- the brute force confirms it to machine precision), or is
 * neither, in which case we do not know and must say so.
 *
 * The first version skipped anything without a box and reported M_2 = 0.  For SU(4) it happened to
 * give the right answer, because the sixteen reps with no box are exactly the sixteen the catalogue
 * declares blind.  Right answer, wrong reason: a missing datum was printing as "invisible to eta".
 * On the next group that coincidence does not hold and the page would have lied.
 */
export function contentMoments(rows, data) {
  let M0 = 0, M2 = 0, M4 = 0, blindOnly = true, any = false;
  const unresolved = [];
  const declaredBlind = new Set((data.catalogue || []).filter((c) => c.blind).map((c) => c.name));
  for (const r of rows) {
    const box = data.reps_box && data.reps_box[r.key];
    if (!box) {
      if (!declaredBlind.has(r.key)) { unresolved.push(r.key); continue; }
      any = true;                    /* declared blind: contributes zero, and that IS the answer */
      continue;
    }
    any = true;
    blindOnly = false;
    const [m0, m2, m4] = momentsOfBox(box.sides, box.zeta);
    const w = r.n * r.eta;
    M0 += w * m0; M2 += w * m2; M4 += w * m4;
  }
  return { M0, M2, M4, blindOnly: any && blindOnly, any, unresolved };
}

export function predict(rows, data) {
  const cm = contentMoments(rows, data);
  const L = lodd(data), S2 = cm.M2 / 8, c = -2 * (2 * Math.PI) ** 2;
  return { ...cm, L, dHxx: c * L[0] * S2, dHyy: c * L[1] * S2, dHxy: 0 };
}

/* EVERY REPRESENTATION, closed form against brute force.
 *
 * The published note records the closed form checked "on five contents".  Five is what a person can
 * do by hand; the catalogue has 119 and the check costs a second, so there is no reason to report
 * five.  What comes back is the worst relative error and, separately, the blind ones -- for those
 * the prediction is exactly zero and a relative error is meaningless, so they are counted rather
 * than averaged into a flattering number.
 *
 * The blind ones are not the easy case.  They are the sharp one: the closed form says zero and an
 * independent winding sum has to agree, which is what makes "blindness is not smallness" a
 * measurement instead of a definition. */
export function sweepEta(data, tol = 2e-3) {
  const LATT = lattice(data.kmax), rows = [];
  const declaredBlind = new Set((data.catalogue || []).filter((c) => c.blind).map((c) => c.name));
  for (const c of data.catalogue || []) {
    if (!data.reps_modes || !data.reps_modes[c.name]) continue;
    if (!(data.reps_box && data.reps_box[c.name]) && !declaredBlind.has(c.name)) continue;
    const one = [{ key: c.name, n: 1, eta: 1, role: 1 }];
    const P = predict(one, data);
    const sp = spectrum(one, data);
    if (!sp.length) continue;
    const hp = hessian(sp, LATT, 0, 0);
    const hm = hessian(spectrum([{ ...one[0], eta: -1 }], data), LATT, 0, 0);
    const meas = [hp[0] - hm[0], hp[1] - hm[1], hp[2] - hm[2]];
    const blind = Math.abs(P.M2) < 1e-12;
    const scale = Math.max(Math.abs(P.dHxx), Math.abs(P.dHyy));
    rows.push({
      rep: c.name, blind, M2: P.M2,
      /* for a blind rep there is no scale to divide by: report the absolute number instead */
      err: blind ? null : Math.max(Math.abs(meas[0] - P.dHxx), Math.abs(meas[1] - P.dHyy)) / scale,
      residue: blind ? Math.max(Math.abs(meas[0]), Math.abs(meas[1])) : null,
      offdiag: Math.abs(meas[2]),
    });
  }
  const sighted = rows.filter((r) => !r.blind), blind = rows.filter((r) => r.blind);
  return {
    rows, tested: rows.length, sighted: sighted.length, blind: blind.length,
    worst: sighted.reduce((a, r) => Math.max(a, r.err), 0),
    worstRep: (sighted.slice().sort((a, b) => b.err - a.err)[0] || {}).rep,
    worstOffdiag: rows.reduce((a, r) => Math.max(a, r.offdiag), 0),
    /* the blind ones must measure zero, not "small relative to something large" */
    worstBlindResidue: blind.reduce((a, r) => Math.max(a, r.residue), 0),
    disagreements: sighted.filter((r) => r.err > tol).map((r) => r.rep),
  };
}

/* ------------------------------------------------------------------ the atlas
 *
 * ONE THUMBNAIL PER MULTIPLET, so that the structure is visible without reading a number.
 *
 * Ported from `ghu-explorer/src/predict_shell.html` section 4, and the port had to correct it twice.
 *
 * 1. THE DOMAIN IS NOT THE UNIT SQUARE.  The old tiles were 26 x 26 over [0,1]^2.  Our torus is
 *    2 x 1 (`PERIODS`), so every tile there is alpha_1 squashed by two -- silently, in a picture
 *    that looks entirely plausible.  Tiles here are 2:1 and sampled over the real periods.
 *
 * 2. "MULTIPLETS THAT SHARE A BOX SHARE A LANDSCAPE" IS FALSE FOR V AND TRUE FOR THE DIFFERENCE.
 *    The old page said it of the potential.  Measured over the catalogue: of the 73 same-box pairs,
 *    66 have a DIFFERENT even spectrum, so their potentials are different pictures.  All 73 have
 *    the same ODD spectrum, exactly -- so in eta-difference mode same-box tiles are pixel-identical.
 *    That is the sharper statement and it is the one Part IV is about: the box fixes the eta
 *    response and nothing else.
 *
 * THE GRID COMES FROM NYQUIST.  A tile is a sum of cos(2 pi q (k1 a1 + k2 a2)), so the fastest
 * variation in alpha_1 is qmax * ktile cycles per unit, and over a period of PERIODS[0] the tile
 * needs more than 2 * PERIODS[0] * qmax * ktile samples.  Both numbers are read off the data.
 *
 * AND THE TRUNCATION IS CHECKED, NOT ASSERTED.  A tile is summed over |k| <= ktile instead of the
 * model's own kmax because the weights fall as |k|^-6 and the atlas has to draw in seconds.  That
 * is a speed knob, so `control` tiles are recomputed at the full kmax and the worst normalised
 * difference is reported.  The numbers under the tiles never come from the tile: they are the
 * closed form.  [[do-not-ship-a-number-that-comes-from-a-speed-knob]]
 */

/* eta can do nothing at all to this multiplet: every mode has A = B, so the odd spectrum is empty.
 * Read off the modes, which is NOT the same as reading the catalogue's `blind` flag -- and the
 * atlas reports whether the two agree rather than assuming it. */
export function etaSilent(key, data) {
  const modes = (data.reps_modes || {})[key];
  return !!modes && modes.length > 0 && modes.every(([, A, B]) => A - B === 0);
}

export function atlasGrid(data, ktile) {
  let qmax = 0;
  for (const modes of Object.values(data.reps_modes || {}))
    for (const [q] of modes) qmax = Math.max(qmax, Math.abs(q));
  const need = [2 * PERIODS[0] * qmax * ktile, 2 * PERIODS[1] * qmax * ktile];
  /* the next multiple of 8 above Nyquist, and 2:1 because the domain is */
  const ny = Math.ceil((need[1] + 1) / 8) * 8;
  return { qmax, ktile, need, nx: 2 * ny, ny };
}

/* THE SPECTRAL SIGNATURES, exported: the odd part (what eta flips) and the even part (what it
 * does not) of a multiplet's mode table.  Two tiles are identical in eta-difference mode iff
 * their odd signatures agree; identical as potentials iff both agree.  Exact, and what the
 * pixel diff below is held to. */
export function spectralSignatures(data, key) {
  const modes = data.reps_modes[key] || [];
  const sig = (f) => JSON.stringify(modes.map(([q, A, B]) => [q, f(A, B)]).filter((x) => x[1] !== 0).sort());
  return { odd: sig((A, B) => A - B), even: sig((A, B) => A + B) };
}

/* TWO TILES, SUBTRACTED.  The atlas puts a hundred landscapes side by side; this is the tool that
 * lets a reader ask whether two of them are the SAME picture, and by how much they are not.  The
 * pixel answer is compared against the spectral one -- "identical" must mean the signatures
 * agree, or the panel reports a disagreement rather than a result. */
export function tileDiff(A, data, keyA, keyB) {
  const a = A.tiles.find((t) => t.key === keyA), b = A.tiles.find((t) => t.key === keyB);
  if (!a || !b) return null;
  const n = a.v.length, v = new Float64Array(n);
  let maxAbs = 0, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = a.v[i] - b.v[i];
    v[i] = d;
    if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d);
    if (d < lo) lo = d; if (d > hi) hi = d;
  }
  const scale = Math.max(a.hi - a.lo, b.hi - b.lo, 1e-12);
  const identical = maxAbs <= 1e-9 * Math.max(1, scale);
  const sa = spectralSignatures(data, keyA), sb = spectralSignatures(data, keyB);
  const sameOdd = sa.odd === sb.odd, sameEven = sa.even === sb.even;
  /* what the spectra PREDICT for this mode, and whether the pixels agree with it */
  const predictedIdentical = A.mode === "D" ? sameOdd : (sameOdd && sameEven);
  return { keyA, keyB, v, lo, hi, maxAbs, rel: maxAbs / scale, identical,
           sameBox: !!(a.boxKey && a.boxKey === b.boxKey), sameOdd, sameEven,
           predictedIdentical, agrees: identical === predictedIdentical, mode: A.mode,
           bothFlat: a.flat && b.flat };
}

export function atlas(data, { mode = "V", ktile = 4, control = 6 } = {}) {
  const G = atlasGrid(data, ktile);
  const { nx, ny } = G;
  const LT = lattice(ktile), FULL = lattice(data.kmax);

  const field = (key, LATT) => {
    const sp = spectrum([{ key, n: 1, eta: 1, role: 1 }], data);
    const v = new Float64Array(nx * ny);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < nx; i++) {
      const a1 = PERIODS[0] * i / nx;
      for (let j = 0; j < ny; j++) {
        const a2 = PERIODS[1] * j / ny;
        let t = 0;
        for (const [k1, k2, w, odd] of LATT) {
          if (mode === "D" && !odd) continue;      /* eta flips the odd windings; the rest cancels */
          const th = k1 * a1 + k2 * a2;
          let s = 0;
          for (const [q, cE, cO] of sp) s += (odd ? cO : cE) * Math.cos(2 * Math.PI * q * th);
          t += w * s;
        }
        if (mode === "D") t *= 2;                  /* V(eta) - V(-eta) is twice the odd half */
        v[j * nx + i] = t;
        if (t < lo) lo = t;
        if (t > hi) hi = t;
      }
    }
    return { v, lo, hi };
  };

  const boxKey = (b) => JSON.stringify([b.sides, b.zeta]);
  const oddSig = (key) => JSON.stringify((data.reps_modes[key] || [])
    .map(([q, A, B]) => [q, A - B]).filter((x) => x[1] !== 0).sort());
  const evenSig = (key) => JSON.stringify((data.reps_modes[key] || [])
    .map(([q, A, B]) => [q, A + B]).filter((x) => x[1] !== 0).sort());

  const tiles = [];
  for (const c of data.catalogue || []) {
    const box = (data.reps_box || {})[c.name];
    const f = field(c.name, LT);
    const span = f.hi - f.lo;
    const flat = span < 1e-9 * Math.max(1, Math.abs(f.hi));
    tiles.push({
      key: c.name, dim: c.dim, blind: !!c.blind, silent: etaSilent(c.name, data),
      box: box ? box.sides : null, m2: box ? momentsOfBox(box.sides, box.zeta)[1] : null,
      boxKey: box ? boxKey(box) : null,
      v: f.v, lo: f.lo, hi: f.hi, flat,
    });
  }

  /* THE BLANK TILES MUST BE THE ONES THE DATA PREDICTS.  A tile that comes out empty because the
   * truncation lost it would look exactly like a theorem.  So the prediction is made from the
   * modes and the picture is compared against it -- and a disagreement is named, not smoothed. */
  const predictedBlank = tiles.filter((t) => t.silent).map((t) => t.key);
  const observedBlank = mode === "D" ? tiles.filter((t) => t.flat).map((t) => t.key) : [];
  const set = (a) => new Set(a);
  const pb = set(predictedBlank), ob = set(observedBlank);
  const blankMismatch = mode !== "D" ? []
    : [...new Set([...predictedBlank, ...observedBlank])]
        .filter((k) => pb.has(k) !== ob.has(k))
        .map((k) => `${k}: ${pb.has(k) ? "predicted blank, drew something" : "drew blank, not predicted"}`);

  /* the catalogue's own flag against what the modes say -- one coincidence this tool will not lean on */
  const flagMismatch = tiles.filter((t) => t.blind !== t.silent).map((t) => t.key);

  /* Part IV as a picture: same box, same eta-difference tile.  Compared as spectra, which is exact,
   * and the count of same-box pairs whose POTENTIAL differs is reported beside it -- that is the
   * half the page this came from had backwards. */
  const groups = new Map();
  for (const t of tiles) if (t.boxKey) (groups.get(t.boxKey) || groups.set(t.boxKey, []).get(t.boxKey)).push(t.key);
  let pairs = 0, oddSame = 0, evenSame = 0;
  for (const [, ks] of groups) {
    const o0 = oddSig(ks[0]), e0 = evenSig(ks[0]);
    for (const k of ks.slice(1)) { pairs++; if (oddSig(k) === o0) oddSame++; if (evenSig(k) === e0) evenSame++; }
  }

  /* the truncation, measured */
  let worstTrunc = 0, checked = 0;
  const stride = Math.max(1, Math.floor(tiles.length / Math.max(1, control)));
  for (let i = 0; i < tiles.length; i += stride) {
    const t = tiles[i];
    if (t.flat) continue;
    const full = field(t.key, FULL);
    const sFull = (full.hi - full.lo) || 1, sTile = (t.hi - t.lo) || 1;
    let w = 0;
    for (let n = 0; n < t.v.length; n++)
      w = Math.max(w, Math.abs((t.v[n] - t.lo) / sTile - (full.v[n] - full.lo) / sFull));
    worstTrunc = Math.max(worstTrunc, w);
    checked++;
  }

  return {
    mode, grid: G, tiles,
    boxes: groups.size, samePairs: pairs, oddSame, evenSame,
    silent: predictedBlank.length,
    blankMismatch, flagMismatch,
    control: { tilesChecked: checked, kmax: data.kmax, worstTrunc,
               nyquist: nx > G.need[0] && ny > G.need[1],
               ok: nx > G.need[0] && ny > G.need[1] && worstTrunc < 0.02 &&
                   !blankMismatch.length && !flagMismatch.length },
  };
}

export const etaModule = (data) => ({
  id: "eta",
  provides: ["eta_response", "eta_moments"],
  requires: ["legal_domain"],

  compute({ model }) {
    const rows = (model.bulk || []).filter((b) => b.multiplicity)
      .map((b) => ({ key: b.rep, n: b.multiplicity, eta: b.eta ?? 1, role: b.role ?? 1 }));
    if (!rows.length) {
      const why = "no bulk content: there is no eta-dependence to report";
      return { eta_response: unknown(why), eta_moments: unknown(why) };
    }
    if (!data.reps_box) {
      const why = `the data file for ${data.group} carries no Part IV boxes, so the closed form ` +
                  `cannot be evaluated for this group`;
      return { eta_response: unknown(why), eta_moments: unknown(why) };
    }

    const P = predict(rows, data);

    /* Refuse rather than guess.  A multiplet with neither a box nor a blindness declaration makes
     * M_2 wrong by an unknown amount, and an M_2 that is wrong by an unknown amount must not be
     * shown as a number. */
    if (P.unresolved.length) {
      const why = `no Part IV box and no blindness declaration for ${P.unresolved.join(", ")}: ` +
                  `the closed form would be missing a term of unknown size`;
      return { eta_response: unknown(why), eta_moments: unknown(why) };
    }

    /* The control the whole section rests on: the same quantity, by brute force. */
    const LATT = lattice(data.kmax);
    const flip = rows.map((r) => ({ ...r, eta: -r.eta }));
    const hp = hessian(spectrum(rows, data), LATT, 0, 0);
    const hm = hessian(spectrum(flip, data), LATT, 0, 0);
    /* dH is the DIFFERENCE between the two boundary signs, H(+1) - H(-1), not the eta-dependent
     * half of H.  Halving it here put the closed form a clean factor of two off the brute force,
     * which is the sort of error that looks like a bug in the physics and is a definition. */
    const meas = { dHxx: hp[0] - hm[0], dHyy: hp[1] - hm[1], dHxy: hp[2] - hm[2] };

    const scale = Math.max(Math.abs(P.dHxx), Math.abs(P.dHyy), 1e-9);
    const err = Math.max(Math.abs(meas.dHxx - P.dHxx), Math.abs(meas.dHyy - P.dHyy)) / scale;

    return {
      eta_moments: val({ M0: P.M0, M2: P.M2, M4: P.M4, L1: P.L[0], L2: P.L[1],
                         blindOnly: P.blindOnly },
                       { status: STATUS.VERIFIED,
                         source: "Part IV's box and its parity index; exhaustively checked against " +
                                 "the enumerated moments, not proved" }),
      eta_response: val({ predicted: { dHxx: P.dHxx, dHyy: P.dHyy, dHxy: P.dHxy },
                          measured: meas, rel_error: err,
                          /* the statement worth the section: blindness is not smallness */
                          blind: Math.abs(P.M2) < 1e-12 },
                        { status: STATUS.VERIFIED,
                          source: "closed form from one integer M_2, with NO winding summed, " +
                                  "checked against the brute-force Hessian difference computed here" }),
    };
  },
});

/* inverse.mjs — the map backwards: a target scale, and a content or a NAMED certificate.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part VII maximises 1/R5 over the lattice and publishes a ceiling.  Every level of that ceiling
 * is an EXTREMAL statement, and the extremal direction has no use for a lower end.  This runs the
 * same map the other way: given a target box in the two observables the closed form predicts,
 * either exhibit a bulk content or return a certificate that there is none.
 *
 * WHY "THERE IS NONE" IS DECIDABLE AT ALL.  Of the eight generators only 7(+,+) has A_4 = 0 — a
 * fact section 0 of ceiling_ilp.py prints and never uses.  So at a fixed A_4 the other seven are
 * bounded by A_4 itself, and the multiplicity of 7(+,+) is then pinned by 8D, the only generator
 * left that can move it.  A rung is a FINITE set, and an empty search becomes a decision.  The
 * page derives that fact rather than quoting it: `inverseLattice` reads the term tables and
 * asserts that exactly one generator has A_4 = 0 and that it moves 8D.
 *
 * THE INVERSION.  Everything factors through the moments; at the stationary point, with x = pi
 * alpha and mu = (m_h / (K pi^2))^2, Part VII's two identities read
 *
 *     (I)   G  = A_4 (ln x + 3/4) + 3 mu        (II)   8D = (2/3) x^2 (6 mu + A_4) / zeta(3)
 *
 * so a target box pulls back to an exact region in (A_4, 8D, G).  One lemma turns the region into
 * an interval with exact ends: at fixed (A_4, 8D), dG/dx = -6 mu / x < 0, so G is strictly
 * decreasing in x along the rung and the admissible G-interval is just its two endpoints.  No
 * sampling and no bisection.
 *
 * DOUBLED COORDINATES, so the same code answers on both gauge seeds.  On the candidate
 * parity-resolved seed of Part VII section 13, A_4 is half-integral and 8D even; 2A_4 is an
 * integer on BOTH, the reachable subgroup of Z^2 is the same, and only the base point moves.  So
 * everything here is indexed by t2 = 2 A_4 and the seed enters exactly once.
 *
 * FIVE CERTIFICATES AND TWO THINGS THAT ARE NOT ONE.  floor / cone / congruence / dual /
 * exhaustion are certificates; `rung` excludes the rung and not the target; `budget` means the
 * enumeration was stopped, and it must never print as "there is none".
 *
 * AND THE DUAL DECLINES TO CERTIFY WHEN IT CANNOT.  In the archived run the Farkas bound is an
 * exact rational with ln 2 and ln 3 bracketed to 1e-30, so the sign of the margin is certain.
 * Here it is a double, and a margin at the size of the rounding error is not a proof of anything:
 * below DUAL_TOL the certificate is withheld and the rung is enumerated instead.  A certificate
 * that might be a rounding artefact is not a certificate.
 */

import { Z3, moments, stabilityW, coordinates, alphaMin, curvatureAtMin, kConst, higgsMass,
         invR5 } from "../kernel/potential.mjs";

/* the smallest Farkas margin, in units of G, that this page will call a proof.  G runs to O(10^3)
 * on these rungs and doubles carry ~1e-13 relative, so 1e-6 is six orders of slack. */
export const DUAL_TOL = 1e-6;

/* ------------------------------------------------------------------ the lattice, derived */

/* The eight generators as (2A_4, 8D, G, 2W), read off the term tables, plus the base point of
 * whichever gauge seed the model stands on.  Nothing here is typed; `make_data_viii.py` checks
 * this same lattice against the archived runs before shipping a single band. */
export function inverseLattice(data, gauge = null) {
  const GAUGE = gauge || data.gauge;
  const slots = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep]))
      slots.push({ rep, key, name: `${rep}${key}`, table: data.reps[rep][key],
                   parities: [key[1] === "+" ? 1 : -1, key[3] === "+" ? 1 : -1] });

  const t2 = [], k8D = [], G = [], W2 = [];
  for (const s of slots) {
    const mo = moments(s.table);
    t2.push(Math.round(2 * mo.A4));
    k8D.push(Math.round(8 * mo.D));
    G.push(mo.G);
    W2.push(Math.round(2 * stabilityW(s.table)));
  }
  const g = moments(GAUGE);
  const base = { t2: Math.round(2 * g.A4), k8D: Math.round(8 * g.D), G: g.G,
                 W2: Math.round(2 * stabilityW(GAUGE)) };

  const free = t2.indexOf(0);
  const bounded = t2.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
  if (free < 0 || bounded.length !== slots.length - 1)
    throw new Error("the finiteness of a rung rests on exactly one generator with A_4 = 0; " +
                    `this lattice has ${slots.length - bounded.length}`);
  if (k8D[free] === 0)
    throw new Error("the free generator does not move 8D, so nothing would pin its multiplicity");

  /* the recursion bottoms out on the generator with the smallest 2A_4, which is 2: every rung's
   * remainder is settled by it exactly, with no search */
  const one = bounded.reduce((a, b) => (t2[b] < t2[a] ? b : a), bounded[0]);
  if (t2[one] !== 2) throw new Error("no generator with A_4 = 1: the recursion cannot bottom out");
  const rest = bounded.filter((j) => j !== one).sort((a, b) => t2[b] - t2[a]);

  return { slots, t2, k8D, G, W2, base, free, bounded, one, rest,
           gaugeTerms: GAUGE, baseCoord: coordinates(GAUGE),
           step: Math.abs(k8D[free]),
           slope: Math.max(...bounded.map((j) => 4 * k8D[j] / t2[j])) };
}

/* the term table of a multiplicity vector, gauge sector included — what the potential eats */
export function termsOfMult(L, mult, gauge) {
  const terms = (gauge || []).map((x) => x.slice());
  mult.forEach((n, j) => {
    if (n) for (const [m, s, c] of L.slots[j].table) terms.push([m * n, s, c]);
  });
  return terms;
}

export const multName = (L, mult) =>
  mult.map((n, j) => (n ? `${n > 1 ? n + "×" : ""}${L.slots[j].name}` : "")).filter(Boolean).join(" + ");

export const multBulk = (L, mult) =>
  mult.map((n, j) => (n ? { rep: L.slots[j].rep, parities: L.slots[j].parities, multiplicity: n } : null))
      .filter(Boolean);

/* ------------------------------------------------------------------ the target box */

export function inverseBox(rLo, rHi, mhLo, mhHi, conv) {
  const K = kConst(conv.m_W, conv.g4);
  const mu = (mh) => (mh / (K * Math.PI ** 2)) ** 2;
  const xOf = (r) => 2 * Math.PI * conv.m_W / r;
  return { rLo, rHi, mhLo, mhHi, K, m_W: conv.m_W, g4: conv.g4,
           xLo: xOf(rHi), xHi: xOf(rLo),            /* 1/R5 large <=> x small */
           muLo: mu(mhLo), muHi: mu(mhHi) };
}

export const invR5OfX = (x, mW) => 2 * Math.PI * mW / x;

/* ------------------------------------------------------------------ the rung, exactly */

const muOf = (t, k, x) => (12 * Z3 * (k / 8) / (x * x) - t) / 6;
const xOfMu = (t, k, mu) => { const d = 6 * mu + t; return d > 0 ? Math.sqrt(12 * Z3 * (k / 8) / d) : null; };
const gOf = (t, k, x) => t * (Math.log(x) + 0.75) + 3 * muOf(t, k, x);

/* the mod-6 law of Part VII Theorem 2, written in the doubled coordinate so it reads the same on
 * both seeds: 8D = 2A_4 + 3 (mod 6).  JS `%` keeps the sign of the dividend, and every rung below
 * the base point has a negative one, so the modulo is taken the arithmetic way. */
export const congruenceOK = (t2, k) => (((k - t2 - 3) % 6) + 6) % 6 === 0;
/* the moment cone, generated by (0, -6) and (1, 8) in (A_4, 8D) */
export const inCone = (L, t2, k) => (t2 - L.base.t2) >= 0 && (k - L.base.k8D) <= 4 * (t2 - L.base.t2);

/* the G-interval this rung can meet the box on, and the x-interval it came from */
export function gWindow(L, t2, k, box) {
  const t = t2 / 2;
  const a = xOfMu(t, k, box.muHi), b = xOfMu(t, k, box.muLo);
  if (a === null || b === null) return null;
  const lo = Math.max(box.xLo, a), hi = Math.min(box.xHi, b);
  if (lo > hi) return null;
  return { gLo: gOf(t, k, hi), gHi: gOf(t, k, lo), xLo: lo, xHi: hi };
}

/* the Farkas bounds: the smallest and largest G a REAL content can have at this rung.  The
 * vertices are the archived exact rationals — they depend only on the generators, so they are the
 * same on both seeds — evaluated here in double, with the margin returned so the caller can
 * refuse to certify on it. */
export function gConeBounds(L, data, t2, k) {
  const V = (data.inverse && data.inverse.dual_vertices) || null;
  if (!V || !inCone(L, t2, k)) return null;
  const T = (t2 - L.base.t2) / 2, Q = k - L.base.k8D;
  const ev = (rows, pick) => {
    let best = null, at = null;
    for (const [ls, ns] of rows) {
      const lam = evalRational(ls), nu = evalRational(ns), v = lam * T + nu * Q;
      if (best === null || pick(v, best)) { best = v; at = [ls, ns]; }
    }
    return best === null ? null : { G: L.base.G + best, at };
  };
  return { min: ev(V.lower, (v, b) => v > b), max: ev(V.upper, (v, b) => v < b) };
}

export function evalRational(s) {
  const i = String(s).indexOf("/");
  return i < 0 ? Number(s) : Number(s.slice(0, i)) / Number(s.slice(i + 1));
}

/* ------------------------------------------------------------------ the finite set */

/* EVERY integer content at (2A_4, 8D) = (t2, k), smallest first, handed to `cb` as
 * (mult, G, 2W).  Returning true from `cb` stops the walk.  Returns how many were built.
 *
 * The heavy multiplets are counted DOWN so the small contents come out first; that is a search
 * order and not a filter — the set walked is the same either way. */
export function contentsAt(L, t2, k, cb, cap = Infinity) {
  const T = t2 - L.base.t2, Q = k - L.base.k8D;
  let seen = 0, stop = false;
  if (T < 0 || T % 2) return 0;
  const n = new Array(L.slots.length).fill(0);

  const rec = (i, rem, s, g, w) => {
    if (stop) return;
    if (i === L.rest.length) {
      const m1 = rem / 2;                       /* the A_4 = 1 generator settles the remainder */
      n[L.one] = m1;
      const s2 = s + m1 * L.k8D[L.one], g2 = g + m1 * L.G[L.one], w2 = w + m1 * L.W2[L.one];
      const d = s2 - Q;
      if (d >= 0 && d % L.step === 0) {
        const m0 = d / L.step;
        n[L.free] = m0;
        seen++;
        if (cb(n, L.base.G + g2 + m0 * L.G[L.free], L.base.W2 + w2 + m0 * L.W2[L.free])) stop = true;
        else if (seen >= cap) stop = true;
        n[L.free] = 0;
      }
      n[L.one] = 0;
      return;
    }
    const j = L.rest[i];
    for (let m = Math.floor(rem / L.t2[j]); m >= 0; m--) {
      n[j] = m;
      rec(i + 1, rem - m * L.t2[j], s + m * L.k8D[j], g + m * L.G[j], w + m * L.W2[j]);
      if (stop) break;
    }
    n[j] = 0;
  };
  rec(0, T, 0, 0, 0);
  return seen;
}

/* ------------------------------------------------------------------ the decision at a rung */

export function decideRung(L, data, t2, k, box, { needW = true, capScan = 400000,
                                                 wantAll = 0 } = {}) {
  if (!inCone(L, t2, k)) return { ok: false, cert: "cone", t2, k };
  if (!congruenceOK(t2, k)) return { ok: false, cert: "congruence", t2, k };
  const win = gWindow(L, t2, k, box);
  if (win === null) return { ok: false, cert: "rung", t2, k };

  const cb = gConeBounds(L, data, t2, k);
  if (cb && cb.min) {
    const margin = cb.min.G - win.gHi;
    if (margin > DUAL_TOL)
      return { ok: false, cert: "dual", t2, k, side: "lower", bound: cb.min.G, margin,
               lam: cb.min.at[0], nu: cb.min.at[1], gWindow: win };
  }
  if (cb && cb.max) {
    const margin = win.gLo - cb.max.G;
    if (margin > DUAL_TOL)
      return { ok: false, cert: "dual", t2, k, side: "upper", bound: cb.max.G, margin,
               lam: cb.max.at[0], nu: cb.max.at[1], gWindow: win };
  }

  const hits = [];
  const scanned = contentsAt(L, t2, k, (n, G, W2) => {
    if (G >= win.gLo && G <= win.gHi && (!needW || W2 > 0)) {
      hits.push({ mult: n.slice(), G, W2, size: n.reduce((a, b) => a + b, 0) });
      return hits.length >= Math.max(1, wantAll);
    }
    return false;
  }, capScan);

  if (hits.length) {
    hits.sort((a, b) => a.size - b.size);
    return { ok: true, t2, k, ...hits[0], hits, gWindow: win, scanned };
  }
  /* the budget is DECLARED, and past it the rung is undecided rather than empty */
  if (scanned >= capScan) return { ok: false, cert: "budget", t2, k, scanned };
  return { ok: false, cert: "exhaustion", t2, k, scanned, gWindow: win };
}

/* every rung the box can touch, plus the count killed outright by the FLOOR: identity (II)
 * demanding an A_4 below that of the empty content, which non-negative multiplicities forbid */
export function rungsFor(L, box, kMax) {
  const out = [];
  let floor = 0;
  /* 8D runs odd on the printed seed and even on the candidate one; which it is follows from the
   * base point rather than from a flag, so the same walk serves both.  Theorem 1's hypothesis is
   * what moves, not the walk. */
  for (let k = (Math.abs(L.base.k8D) % 2 === 1 ? 1 : 2); k <= kMax; k += 2) {
    const tLoA = 12 * Z3 * (k / 8) / box.xHi ** 2 - 6 * box.muHi;
    const tHiA = 12 * Z3 * (k / 8) / box.xLo ** 2 - 6 * box.muLo;
    if (2 * tHiA < L.base.t2) { floor++; continue; }
    const lo = Math.max(Math.floor(2 * tLoA) - 2, L.base.t2), hi = Math.ceil(2 * tHiA) + 2;
    for (let t2 = lo; t2 <= hi; t2++)
      if (congruenceOK(t2, k) && inCone(L, t2, k)) out.push([t2, k]);
  }
  return { rungs: out, floor };
}

/* HOW HIGH TO SCAN, AND WHY THE ANSWER IS SOMETIMES CHEAP.  A no-go is a claim about ALL the rungs
 * scanned, so how many were scanned is part of the verdict and is declared rather than silent.
 * The relaxation's ceiling falls with the rung, so a target above rung k's LP ceiling cannot be
 * met on rung k or on any rung above it — and the walk stops there, with a proof rather than a
 * budget.  The archive carries those ceilings for the four rungs the paper enumerates; below the
 * lowest of them nothing can be shrunk and the declared kMax stands, which is exactly the case
 * where the paper's own table reports UNDECIDED instead of a no-go. */
export function kMaxFor(data, box, kMax, seed = "published") {
  const R = reachableSet(data, seed);
  if (!R) return { kMax, shrunk: false };
  const lps = R.bands.map((b) => [b.k8D, b.top_LP]).sort((a, b) => a[0] - b[0]);
  const lowest = Math.min(...lps.map((z) => z[1]));
  if (box.rLo <= lowest) return { kMax, shrunk: false, lowest };
  const reach = lps.filter(([, lp]) => lp >= box.rLo).map(([k]) => k);
  const k = reach.length ? Math.min(kMax, Math.max(...reach)) : Math.min(kMax, lps[0][0]);
  return { kMax: k, shrunk: k < kMax, lowest };
}

/* ------------------------------------------------------------------ the designer */

/* Walks the rungs and returns a design or the certificate roster.  A design is only a design once
 * the EXACT potential agrees that the electroweak point is the vacuum: W > 0 compares the two
 * symmetric points and nothing else, so `verify` — supplied by the caller, because it is the
 * expensive part — has the last word, and the number rejected by it is reported. */
export function designScale(L, data, box, { kMax = 21, needW = true, verify = null, tries = 4,
                                            capScan = 400000, capTotal = 2000000,
                                            gauge = null } = {}) {
  const { rungs, floor } = rungsFor(L, box, kMax);
  const certs = floor ? { floor } : {};
  let spent = 0, tried = 0, rejected = 0, visited = 0;
  for (const [t2, k] of rungs) {
    if (spent >= capTotal) { certs.budget = (certs.budget || 0) + 1; continue; }
    visited++;
    const r = decideRung(L, data, t2, k, box, { needW, capScan, wantAll: verify ? tries : 1 });
    spent += r.scanned || 0;
    if (!r.ok) { certs[r.cert] = (certs[r.cert] || 0) + 1; continue; }
    if (!verify) return { design: r, certs, tried, rejected, spent, rungs: rungs.length, visited };
    for (const h of r.hits) {
      if (tried >= tries) break;
      tried++;
      const v = verify(termsOfMult(L, h.mult, gauge || data.gauge), h.mult);
      if (!v) { rejected++; continue; }
      return { design: { ...r, ...h, exact: v }, certs, tried, rejected, spent,
               rungs: rungs.length, visited };
    }
    if (tried >= tries) break;
  }
  return { design: null, certs, tried, rejected, spent, rungs: rungs.length, visited };
}

/* Is this roster a PROOF that the box is empty?  Only if every rung it visited came back with a
 * certificate — `budget` and an unfinished walk are not ones.  The distinction is the whole
 * honesty of the section, so it is one function and not a condition written twice. */
export function isProved(res) {
  if (res.design) return false;
  if (res.certs.budget) return false;
  const named = ["floor", "cone", "congruence", "dual", "exhaustion", "rung"];
  return Object.keys(res.certs).every((c) => named.includes(c)) &&
         res.tried === res.rejected;
}

/* ------------------------------------------------------------------ forward, for a witness */

export function forwardOf(L, mult, box, gauge) {
  const terms = termsOfMult(L, mult, gauge);
  const mo = moments(terms);
  const a = alphaMin(mo);
  if (a === null) return null;
  const fpp = curvatureAtMin(mo, a);
  if (!(fpp > 0)) return null;
  return { alpha: a, mh: higgsMass(mo, a, box.m_W, box.g4), invR: invR5(a, box.m_W),
           A4: mo.A4, k8D: Math.round(8 * mo.D), G: mo.G, W2: Math.round(2 * stabilityW(terms)) };
}

/* ------------------------------------------------------------------ a rung's IMAGE */

/* A CLUSTER IS NOT AN INTERVAL, AND DRAWING IT AS ONE IS THE MISREADING THE PAPER WARNS ABOUT.
 * A content fixes (A_4, 8D, G) and the two identities then fix ONE pair (1/R5, m_h): no continuous
 * parameter is left.  So the image of a rung is a FINITE SET, and the two numbers the paper
 * tabulates are its minimum and its maximum, not the ends of a reached continuum.  Rung one is 35
 * points, about 31.5 GeV apart.  That is also what makes the gap a result: a finite set is
 * disconnected for free; what is not free is a MACROSCOPIC stretch between two clusters.
 *
 * This computes the set rather than reading it.  It costs one fixed-point solve per content, and
 * the moments come out of the enumeration itself — (A_4, 8D, G) are already being carried — so
 * rung one's 423 631 contents are a second or two.  The deeper rungs run to tens of millions and
 * are past any page: `cap` is declared, and a capped sweep reports itself capped rather than
 * returning a shorter list that looks complete. */
export function rungPoints(L, k, A4cap, box, { cap = 1500000, tol = 1e-9 } = {}) {
  const pts = new Map();
  let built = 0, inWindow = 0, capped = false;
  for (let t2 = L.base.t2; t2 <= 2 * A4cap; t2++) {
    if (!congruenceOK(t2, k) || !inCone(L, t2, k)) continue;
    const A4 = t2 / 2;
    contentsAt(L, t2, k, (n, G, W2) => {
      if (++built > cap) { capped = true; return true; }
      const mo = { A4, D: k / 8, G };
      const a = alphaMin(mo);
      if (a === null) return false;
      const mh = higgsMass(mo, a, box.m_W, box.g4);
      if (mh === null || mh < box.mhLo || mh > box.mhHi) return false;
      inWindow++;
      const R = invR5(a, box.m_W);
      /* two contents land on the same point exactly when they share (A_4, 8D, G); the key is the
       * value itself, at a declared relative tolerance, so the count does not depend on how the
       * enumeration happened to order them */
      const key = R.toPrecision(12);
      const p = pts.get(key);
      if (p) { p.n++; if (W2 > 0 && !p.wPos) { p.wPos = true; p.mult = n.slice(); } }
      else pts.set(key, { invR: R, mh, A4, k, n: 1, wPos: W2 > 0, mult: n.slice() });
      return false;
    }, Infinity);
    if (capped) break;
  }
  const list = [...pts.values()].sort((a, b) => a.invR - b.invR);
  const gaps = list.slice(1).map((p, i) => p.invR - list[i].invR);
  void tol;
  return {
    k, A4cap, points: list, built, inWindow, capped,
    n: list.length,
    lo: list.length ? list[0].invR : null,
    hi: list.length ? list[list.length - 1].invR : null,
    spacing: gaps.length
      ? { mean: gaps.reduce((a, b) => a + b, 0) / gaps.length,
          min: Math.min(...gaps), max: Math.max(...gaps) }
      : null,
  };
}

/* ------------------------------------------------------------------ the reachable set, read */

/* The clusters and the gap are ARCHIVED, and this is the one place the section takes a number it
 * did not compute.  Finding the floor of rung 1 means enumerating 423 631 contents and putting
 * the survivors on the exact potential — a run, not a page.  What the page recomputes is the
 * decision at a rung, and `_test_inverse.mjs` holds it to these same bands. */
export function reachableSet(data, seed = "published") {
  const I = data.inverse;
  if (!I) return null;
  const S = seed === "candidate" ? I.candidate : I.published;
  const bands = S.bands.map((b) => ({ ...b, A4_cap: b.A4_cap ?? b.t2_cap / 2 }));
  const lo = Math.min(...bands.map((b) => b.bottom)), hi = Math.max(...bands.map((b) => b.top));
  return { seed, bands, ladder: S.ladder, gap: S.gap, span: [lo, hi],
           pdg: S.pdg_window || S.pdg, doubled: seed === "candidate" };
}

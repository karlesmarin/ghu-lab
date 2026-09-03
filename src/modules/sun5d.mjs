/* sun5d.mjs — the general 5D SU(N) Wilson-line potential on S¹/Z₂, for ANY boundary condition.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS IS FOR.  Every other section of this instrument answers a question about a model we
 * or somebody else already wrote down.  This one is the machine underneath all of them: Haba and
 * Yamashita's general formula (JHEP 02 (2004) 059, hep-ph/0401185, §5) for the one-loop effective
 * potential of a 5D SU(N) gauge theory on S¹/Z₂, with arbitrary orbifold parities and arbitrary
 * fundamental, antisymmetric, symmetric and adjoint bulk matter.  Give it a boundary condition and
 * a bulk content and it returns the potential — for SU(3), SU(5), SU(6), SU(7) or SU(23).
 *
 * THE INPUT IS A BOUNDARY CONDITION, NOT A TERM TABLE.  That is the structural point.  Everywhere
 * else in this instrument a representation IS a term table, read from a data file; here the term
 * table is a FUNCTION of the parities, because which Kaluza-Klein tower a state sits in depends on
 * whether (P, P′) is (+,+), (+,−), (−,+) or (−,−).  Simultaneously diagonal parities are
 * characterised by four block sizes, their eq. (5.1):
 *
 *     P  = diag(+…+ , +…+ , −…− , −…−)        n₊₊ = #(P=+, P′=+)
 *     P′ = diag(+…+ , −…− , +…+ , −…−)        n₊₋ = #(P=+, P′=−)   etc.
 *
 * and everything follows from them: the unbroken subgroup is
 * SU(n₊₊)×SU(n₊₋)×SU(n₋₊)×SU(n₋₋)×U(1)³, and the number of Wilson-line phases left after the
 * residual global symmetry is used up is their eq. (5.4),
 *
 *     A + B  with  A = min(n₊₊, n₋₋),  B = min(n₊₋, n₋₊).
 *
 * THE OUTPUT IS THE SAME OBJECT THE REST OF THE INSTRUMENT EATS.  A term here is
 * {m, v, d}: a coefficient, an integer vector over the phases, and a shift d ∈ {0,1}, standing for
 *
 *     m · cos( nπ ( v·θ − d ) ).
 *
 * When there is exactly ONE phase this is the kernel's own (m, s, c) triple with c = v₀ and
 * s = (−1)^d — because cos(nπ(cα − 1)) = (−1)ⁿ cos(nπcα).  So `toTermTable` hands any one-phase
 * SU(N) model straight to `moments`, `alphaMin`, `coordinates`, `stabilityW` and `F`, and with them
 * to the closed form, the arithmetic laws, the census and the inverse map.  That bridge is the
 * whole reason this module is worth having: it turns three published models into any model.
 *
 * THE COEFFICIENT IS |n₊₊ − n₋₋|, AND THAT IS WHAT THEY PRINTED.  Equations (5.9), (5.10) and
 * (5.17)–(5.20) carry the coefficients with absolute-value bars, on the page, in all six.  The
 * count they multiply is the number of LEFTOVER rows of the larger block — with A = min(n₊₊, n₋₋),
 * (n₊₊ − A) + (n₋₋ − A) = |n₊₊ − n₋₋| — so it is a multiplicity and could not be anything else.
 *
 * RETRACTED 2026-08-30, and the retraction belongs here because the claim was here.  Until this
 * date this header said the bars were MISSING from the paper and that we were correcting it.  That
 * was false, and it was published — in the source of this module, in the harness, and in a
 * changelog entry dated 2026-08-29 that is on the site.  The bars are set in CMEX10, TeX's
 * extensible-delimiter font, and in that PDF its glyphs map to U+000C; every text extraction drops
 * them in silence, `pdftotext` and PyMuPDF alike, in every mode.  A dropped delimiter does not
 * corrupt the text around it: it leaves a formula that still parses and is a different formula, so
 * there is no error to notice.  A draft letter to the authors was written on that false premise
 * and withdrawn unsent.  See `changes/2026-08-30-the-absolute-value-was-already-there.md`.
 *
 * WHAT THE HARNESS STILL CHECKS, AND WHY IT IS WORTH KEEPING.  `_test_sun5d.mjs` reproduces all
 * four of the paper's worked examples verbatim, checks the invariance below, and checks that the
 * bars-dropped reading FAILS.  That last one is now a guard against the extraction bug rather than
 * a correction to anybody: it is exactly the wrong formula a tool will hand you.
 *
 * THE INVARIANCE, which is a real property of the setup and is why the reading is forced.  The
 * gauge field transforms as A → P A P†, so (P, P′) and (−P, −P′) are the SAME boundary condition
 * for it; that swap exchanges n₊₊ ↔ n₋₋ and n₊₋ ↔ n₋₊ at once.  A, B and the absolute differences
 * are invariant under it; the signed differences are not.  The examples in §4.1 and §4.2 have
 * n₊₊ ≥ n₋₋, so they read the same either way — which is why the reading only bites in §3 and §4.3.
 */

/* ------------------------------------------------------------------ the boundary condition */

/* The four block sizes, and everything they decide.  `parities` accepts the two diagonals as
 * arrays of ±1 instead, because that is how a paper prints a model. */
export function sun5dBlocks(spec) {
  let nPP, nPM, nMP, nMM;
  if (spec.P && spec.Pp) {
    if (spec.P.length !== spec.Pp.length)
      throw new Error("P and P′ must have the same length: they are both N × N");
    nPP = nPM = nMP = nMM = 0;
    for (let i = 0; i < spec.P.length; i++) {
      const p = spec.P[i] > 0, q = spec.Pp[i] > 0;
      if (p && q) nPP++; else if (p) nPM++; else if (q) nMP++; else nMM++;
    }
  } else {
    ({ nPP = 0, nPM = 0, nMP = 0, nMM = 0 } = spec);
  }
  const N = nPP + nPM + nMP + nMM;
  if (N < 2) throw new Error("SU(N) needs N ≥ 2");
  const A = Math.min(nPP, nMM), B = Math.min(nPM, nMP);
  return {
    N, nPP, nPM, nMP, nMM, A, B,
    phases: A + B,
    /* THE LEFTOVER ROWS, and they are counts.  See the module header. */
    leftA: Math.abs(nPP - nMM),
    leftB: Math.abs(nPM - nMP),
    factors: [nPP, nPM, nMP, nMM],
  };
}

/* SU(n₊₊)×SU(n₊₋)×SU(n₋₊)×SU(n₋₋)×U(1)³, written the way a paper writes it: SU(1) is nothing and
 * a U(1) is dropped for every empty block, because a U(1) that commutes with nothing is not
 * there.  Their eq. (5.2). */
export function sun5dUnbroken(b) {
  /* sorted by rank, the same convention `bcclass.mjs` uses and for the same reason: the same
   * group must print the same string whichever block produced it */
  const parts = [b.nPP, b.nPM, b.nMP, b.nMM].filter((n) => n >= 2).sort((x, y) => y - x)
                  .map((n) => `SU(${n})`);
  const nonEmpty = [b.nPP, b.nPM, b.nMP, b.nMM].filter((n) => n >= 1).length;
  const u1 = Math.max(0, nonEmpty - 1);
  if (u1) parts.push(u1 === 1 ? "U(1)" : `U(1)^${u1}`);
  return parts.length ? parts.join(" × ") : "nothing";
}

/* ------------------------------------------------------------------ the terms */

const key = (v, d) => v.join(",") + "|" + d;

/* Terms are accumulated into a map so the same cosine never appears twice, and a term whose vector
 * is all zeros is DROPPED: it is independent of the Wilson line, which is what the paper omits
 * ("omitting independent terms of the VEV"). */
function bag() {
  const m = new Map();
  return {
    add(mult, v, d) {
      if (!mult) return;
      if (v.every((x) => x === 0)) return;
      /* cos is even, so v and −v are the same term; a canonical sign keeps them from splitting */
      const lead = v.find((x) => x !== 0);
      const w = lead < 0 ? v.map((x) => -x) : v.slice();
      const k = key(w, d);
      const cur = m.get(k);
      if (cur) cur.m += mult; else m.set(k, { m: mult, v: w, d });
    },
    out() {
      return [...m.values()].filter((t) => Math.abs(t.m) > 1e-12)
                            .sort((x, y) => key(x.v, x.d) < key(y.v, y.d) ? -1 : 1);
    },
  };
}

const unit = (n, i, k = 1) => { const v = new Array(n).fill(0); v[i] = k; return v; };
const pair = (n, i, j, s) => { const v = new Array(n).fill(0); v[i] += 1; v[j] += s; return v; };

/* One d.o.f. of one representation, at parity product ηη′ = ±1.  `rep` is one of
 * "adj" | "fund" | "anti" | "sym"; `eta` is +1 or −1.  Returns the terms of ONE degree of
 * freedom, exactly as the paper's eqs. (5.9)-(5.20) do: the caller multiplies by
 * [(fermionic d.o.f.) − (bosonic d.o.f.)]. */
export function sun5dRepTerms(b, rep, eta) {
  const n = b.A + b.B, d0 = eta > 0 ? 0 : 1, d1 = 1 - d0;
  const T = bag();
  const ai = (i) => i, bi = (i) => b.A + i;
  const diag = rep === "adj" || rep === "sym";
  const doubled = rep === "adj" ? 2 : 1;          /* adjoint carries 2, the tensors carry 1 */

  if (rep === "fund") {
    for (let i = 0; i < b.A; i++) T.add(1, unit(n, ai(i)), d0);
    for (let i = 0; i < b.B; i++) T.add(1, unit(n, bi(i)), d1);
    return T.out();
  }

  /* the i,j body: the adjoint sums over ALL ordered pairs, the tensors over i > j only */
  for (let i = 0; i < b.A; i++)
    for (let j = 0; j < b.A; j++) {
      if (rep !== "adj" && !(i > j)) continue;
      for (const s of [1, -1]) T.add(1, pair(n, ai(i), ai(j), s), d0);
    }
  for (let i = 0; i < b.B; i++)
    for (let j = 0; j < b.B; j++) {
      if (rep !== "adj" && !(i > j)) continue;
      for (const s of [1, -1]) T.add(1, pair(n, bi(i), bi(j), s), d0);
    }
  /* the cross block, weight 2 for the adjoint and 1 for the tensors */
  for (let i = 0; i < b.A; i++)
    for (let j = 0; j < b.B; j++)
      for (const s of [1, -1]) T.add(doubled, pair(n, ai(i), bi(j), s), d1);
  /* the leftover rows of each block pair */
  for (let i = 0; i < b.A; i++) T.add(doubled * b.leftA, unit(n, ai(i)), d0);
  for (let i = 0; i < b.B; i++) T.add(doubled * b.leftA, unit(n, bi(i)), d1);
  for (let i = 0; i < b.A; i++) T.add(doubled * b.leftB, unit(n, ai(i)), d1);
  for (let i = 0; i < b.B; i++) T.add(doubled * b.leftB, unit(n, bi(i)), d0);
  /* the symmetric tensor keeps its diagonal, which the antisymmetric one does not have.  Its
   * ηη′ = − form is cos(2nπ(a − ½)) = (−1)ⁿ cos(2nπa), so it is the same 2·unit vector with the
   * shift flipped -- one more place where (m, s, c) is the right shape for this. */
  if (rep === "sym" && diag) {
    for (let i = 0; i < b.A; i++) T.add(1, unit(n, ai(i), 2), d0);
    for (let i = 0; i < b.B; i++) T.add(1, unit(n, bi(i), 2), d0);
  }
  return T.out();
}

/* THE GAUGE SECTOR AND THE BULK, ASSEMBLED.  The coefficients are the paper's, §3: gauge and ghost
 * contribute −3 times one adjoint d.o.f.; a Dirac fermion +4; a complex scalar −2.  They are the
 * number of degrees of freedom with a fermionic sign, and they are stated here rather than folded
 * into the terms so that a reader can see what was counted. */
export const SUN5D_DOF = { dirac: 4, scalar: -2, weyl: 2, gauge: -3 };

export function sun5dTerms(b, content) {
  const T = bag();
  const add = (terms, k) => terms.forEach((t) => T.add(k * t.m, t.v, t.d));
  if (content.gauge !== false) add(sun5dRepTerms(b, "adj", +1), SUN5D_DOF.gauge);
  for (const f of content.bulk || []) {
    const dof = typeof f.dof === "number" ? f.dof : SUN5D_DOF[f.kind || "dirac"];
    if (dof === undefined) throw new Error(`unknown field kind "${f.kind}"`);
    add(sun5dRepTerms(b, f.rep, f.eta > 0 ? 1 : -1), dof * (f.multiplicity ?? 1));
  }
  return T.out();
}

/* ------------------------------------------------------------------ the potential */

/* V / C, in the paper's normalisation: V = (C/2) Σ_n n⁻⁵ Σ_terms m cos(nπ(v·θ − d)), with
 * C = 3/(64 π⁷ R₅⁵).  The ½ is theirs and is kept, so a number from here can be compared with a
 * number from the paper without a factor nobody wrote down. */
export function sun5dV(terms, theta, windings = 600) {
  let total = 0;
  for (const t of terms) {
    let x = 0;
    for (let i = 0; i < t.v.length; i++) x += t.v[i] * theta[i];
    let sub = 0;
    for (let n = 1; n <= windings; n++) {
      const sign = t.d ? (n % 2 ? -1 : 1) : 1;
      sub += sign * Math.cos(n * Math.PI * x) / n ** 5;
    }
    total += t.m * sub;
  }
  return total / 2;
}

/* THE BRIDGE.  One phase, and the terms are the kernel's own (m, s, c) triples — so the closed
 * form, the five coordinates, the arithmetic laws, the census and the inverse map all apply to
 * whatever SU(N) model was just built.  The kernel's F has no ½, so the factor is carried here
 * and named rather than left for someone to rediscover.
 *
 * PASS `phases`, BECAUSE THE TERMS CANNOT TELL YOU ABOUT A PHASE THAT PRODUCED NO TERM.  The
 * per-term test below reads `t.v.length`, so it catches two phases and three — and is blind to
 * ZERO, where the loop never runs and an empty table comes back as a clean pass.  A zero-phase
 * boundary condition is a model with no Wilson line at all: 24 of the 84 boundary conditions of
 * SU(6) are one.  For those, `coordinates` returns the ORIGIN of Part VII's five-dimensional
 * lattice and `stabilityW` returns W = 0, which reads as a marginal stability verdict about a
 * quantity that has no subject — there is no α to be stable in.  The two callers in
 * `sun5d_section.js` had each written `if (b.phases === 1)` around the call, so the page was
 * right and the module was not; a guard that lives in the caller is a hypothesis missing from
 * the function, and it is missing again for every caller that comes later.
 *
 * One phase whose terms all CANCEL is a different thing and stays legal: the potential is flat,
 * the table is empty for a reason inside the physics, and the origin is then the honest answer. */
export function sun5dTermTable(terms, { half = true, phases } = {}) {
  if (phases !== undefined && phases !== 1)
    throw new Error(`the (m, s, c) form needs exactly one Wilson-line phase; this model has ` +
                    `${phases}` + (phases === 0 ? `, so there is no Wilson line to bridge` : ``));
  const out = [];
  for (const t of terms) {
    if (t.v.length !== 1)
      throw new Error(`the (m, s, c) form needs exactly one Wilson-line phase; this model has ` +
                      `${t.v.length}`);
    out.push([(half ? 0.5 : 1) * t.m, t.d ? -1 : 1, t.v[0]]);
  }
  return out;
}

/* the deepest point of V on the torus of phases, by a grid and then a coordinate refinement.
 * One or two phases only: past that a grid is not the right instrument and the panel says so. */
export function sun5dMinimum(terms, nPhase, { grid = 400, refine = 30, windings = 300,
                                              lo = 0, hi = 1 } = {}) {
  if (nPhase < 1 || nPhase > 2) return null;
  let best = Infinity, at = null;
  if (nPhase === 1) {
    for (let i = 0; i <= grid; i++) {
      const a = lo + (hi - lo) * i / grid, v = sun5dV(terms, [a], windings);
      if (v < best) { best = v; at = [a]; }
    }
  } else {
    const g = Math.max(24, Math.round(grid / 6));
    for (let i = 0; i <= g; i++)
      for (let j = 0; j <= g; j++) {
        const a = lo + (hi - lo) * i / g, c = lo + (hi - lo) * j / g;
        const v = sun5dV(terms, [a, c], windings);
        if (v < best) { best = v; at = [a, c]; }
      }
  }
  if (at === null) return null;
  /* coordinate descent with a shrinking step: the grid brackets, this sharpens */
  let step = (hi - lo) / (nPhase === 1 ? grid : Math.max(24, Math.round(grid / 6)));
  for (let r = 0; r < refine; r++) {
    let moved = false;
    for (let k = 0; k < nPhase; k++)
      for (const s of [1, -1]) {
        const trial = at.slice();
        trial[k] = Math.min(hi, Math.max(lo, trial[k] + s * step));
        const v = sun5dV(terms, trial, windings);
        if (v < best) { best = v; at = trial; moved = true; }
      }
    if (!moved) step /= 2;
  }
  /* WHERE IT LANDED MATTERS AS MUCH AS WHAT IT IS.  V has period 2 in every phase and is even, so
   * [0, 1] is a fundamental domain and its two ENDS are the two symmetric points — not broken
   * vacua.  A minimum at an end is the statement "the other symmetric point is deeper", which is
   * exactly what Part VII's W criterion decides; a minimum strictly inside is the Hosotani
   * mechanism.  Reporting the first as the second is an overclaim, so the caller is told which. */
  const eps = 1e-6;
  const atEdge = at.some((t) => t <= lo + eps || t >= hi - eps);
  return { theta: at, V: best / 2, atEdge,
           symmetric: sun5dV(terms, at.map(() => 0), windings) / 2,
           other: sun5dV(terms, at.map(() => hi), windings) / 2 };
}

/* ------------------------------------------------------------------ reading it back */

/* A term, in the notation the paper prints — so a reader can hold the page against the paper
 * rather than against a data structure. */
export function sun5dShow(t, names) {
  const parts = [];
  t.v.forEach((k, i) => {
    if (!k) return;
    const s = k > 0 ? (parts.length ? " + " : "") : " − ";
    const c = Math.abs(k) === 1 ? "" : String(Math.abs(k));
    parts.push(s + c + (names ? names[i] : `θ${i + 1}`));
  });
  const inner = parts.join("").replace(/^ \+ /, "").replace(/^ − /, "−");
  return `cos(nπ(${inner}${t.d ? " − 1" : ""}))`;
}

export function sun5dNames(b) {
  const out = [];
  for (let i = 0; i < b.A; i++) out.push(b.A === 1 ? "a" : `a${i + 1}`);
  for (let i = 0; i < b.B; i++) out.push(b.B === 1 ? "b" : `b${i + 1}`);
  return out;
}

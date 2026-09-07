/* observables.mjs — the declared set of operators a state can be said to couple to, and the only
 * verdicts that set supports.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE.  There is no "unobservable" in the abstract; there is only
 * "not distinguished by a declared set of observables".  A state that does not show up in one
 * correlator may couple to another operator, appear at a different momentum, emerge through
 * mixing, be suppressed rather than absent, or be out of reach only at the resolution available.
 * So this instrument is not allowed to print "does not couple" anywhere until the set O = {O_a} it
 * means has been written down, with its symmetries, its resolution and its source.
 *
 * AND THE STATEMENT MUST BE BASIS-FREE, which the obvious one is not.  Writing Z_ai = 0 for a state
 * i and an operator a is a claim about a COMPONENT: rotate the degenerate multiplet and the zeros
 * redistribute.  The invariant claim is about the SUBSPACE,
 *
 *     || Pi_{span O} H_multiplet ||  =  0        (exactly), or
 *     || Pi_{span O} H_multiplet ||  <  resolution   (in the presence of noise),
 *
 * so what this file computes and stores is the SINGULAR VALUES of the overlap block restricted to
 * the multiplet, never its individual entries.
 *
 * WHY SINGULAR VALUES AND NOT A RANK, and this is not a preference.  A rank is already a verdict
 * taken against a threshold, and a threshold that travels separately from the number it produced
 * is how a gate lies: this repository spent an afternoon on a null space computed with a tolerance
 * relative to the matrix's own largest singular value, which returns "empty" exactly when the
 * matrix is entirely noise.  Store the sigmas, derive the rank from the DECLARED resolution, and
 * the fourth verdict below — "not determined" — can exist at all.  Store the rank and that case
 * disappears silently into one of its neighbours, which is the worst way to lose it.
 *
 * THE FIVE VERDICTS, and there is no sixth:
 *
 *     exact-zero      the projection vanishes in exact arithmetic, not numerically
 *     below-res       sigma_max < resolution: compatible with zero AT THE DECLARED RESOLUTION
 *     nonzero         sigma_max >= resolution
 *     undetermined    a sigma sits within a factor of the resolution — the answer depends on the
 *                     threshold, so the threshold is reported instead of an answer
 *     not-computed    no overlap block was supplied, which is where most of this table sits today
 *
 * WHAT IS DELIBERATELY NOT HERE.  Not one overlap value.  Z is a property of a MODEL, computed per
 * model at run time; this file holds the operators, their context and their resolution, and the
 * arithmetic that turns a block into one of the five words.  An entry whose resolution has not been
 * sourced says so in `missing` and every state under it comes back `not-computed` — visible, rather
 * than a blank that reads as a no.
 *
 * D3: no gauge group is named here.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

/* ------------------------------------------------------------------ the registry
 *
 * `source` names an EXPERIMENT key where the number already lives with its URL and date, so a
 * measured value is written down once in this repository and not twice.  `hypothesis` is the
 * context the entry is only valid in — the discipline `experiment.mjs` already applies to bounds,
 * carried over to operators.  `missing` is what would have to be read to give the entry a
 * resolution, and its presence is what makes the entry honest rather than absent. */
export const OBSERVABLES = {
  dijet_octet: {
    what: "a colour-octet vector coupling to quark pairs",
    channel: "pp -> jj, narrow resonance",
    symmetries: "SU(3)_c octet, Lorentz vector, parity-even couplings assumed by the search",
    source: "dijet_coloron",
    hypothesis: "colour lives in the bulk, so the gluon has a KK tower at 1/R with coloron-like"
      + " couplings and the quarks sit at the fixed point",
    resolution: null,
    missing: "the search excludes a MASS for a reference coupling; turning it into a resolution on"
      + " an overlap needs the coupling-strength limit sigma x BR as a function of mass, which is"
      + " in the paper's figures and has not been read off",
  },
  dilepton_zprime: {
    what: "a neutral vector coupling to charged lepton pairs",
    channel: "pp -> ll, narrow resonance",
    symmetries: "colour singlet, Lorentz vector",
    source: "dilepton_Zprime_psi",
    hypothesis: "the state mixes with the Z, and leptons are where the search assumes they are",
    resolution: null,
    missing: "same shape as above: a mass reach at a reference coupling, not a coupling resolution",
  },
  contact_qqqq: {
    what: "a four-quark contact operator, left-handed",
    channel: "pp -> jj angular distribution",
    symmetries: "SU(3)_c x SU(2)_L singlet combination, dimension six",
    source: "contact_LL_destructive",
    hypothesis: "the tower is integrated out, so this bounds a SCALE and not a KK mass — the note"
      + " on the EXPERIMENT entry says so explicitly",
    resolution: null,
    missing: "the translation from Lambda to a coefficient depends on the sign convention of the"
      + " interference, and both signs are quoted separately",
  },
  proton_e_pi0: {
    what: "the baryon-number-violating operator behind p -> e+ pi0",
    channel: "proton decay, Super-Kamiokande",
    symmetries: "dimension six, B-L conserving",
    source: "proton_e_pi0",
    hypothesis: "the operator is generated at the compactification scale",
    resolution: null,
    missing: "the instrument does not compute the rate — the EXPERIMENT entry already says so, and"
      + " until it does there is no overlap to compare with anything",
  },
  higgs_couplings: {
    what: "the Higgs boson's couplings to SM fields, as signal strengths",
    channel: "pp -> h -> XX, all measured decay modes",
    symmetries: "the SM gauge group; the strengths are ratios to the SM prediction",
    source: null,
    hypothesis: "the light scalar of the model IS the observed 125 GeV state",
    resolution: null,
    missing: "the ATLAS+CMS combined signal strengths and their covariance are not in"
      + " `experiment.mjs` yet; Carson-Okada (arXiv:1510.03092) use exactly these to bound the"
      + " lightest bulk fermion at around 1 TeV, so that paper is where the numbers and the"
      + " covariance would be read from",
  },
};

/* An entry is only in the register if it says what it is, in what channel, under what symmetries,
 * where it came from, and either its resolution or why it has none.  Returns the list of faults,
 * empty when the entry is admissible — the harness turns a non-empty list into a red build. */
export function registryFaults(key, e) {
  const faults = [];
  for (const field of ["what", "channel", "symmetries", "hypothesis"]) {
    if (!e[field] || !String(e[field]).trim()) faults.push(key + ": no " + field);
  }
  if (e.resolution === undefined) faults.push(key + ": resolution is undefined — use null and say why");
  if (e.resolution === null && !e.missing) {
    faults.push(key + ": no resolution and no `missing` saying what would give it one");
  }
  if (e.resolution !== null && !(e.resolution > 0)) faults.push(key + ": resolution must be positive");
  if (e.source === undefined) faults.push(key + ": source is undefined — use null deliberately");
  return faults;
}

/* ------------------------------------------------------------------ the invariant
 *
 * The singular values of an overlap block, by Jacobi on the Gram matrix.  A complex Hermitian G is
 * embedded as the real symmetric [[Re, -Im], [Im, Re]], whose eigenvalues are those of G each
 * twice, so one real routine covers both cases and there is no complex rotation to get wrong.
 *
 * `Z` is rows = operators, columns = states of the multiplet; entries are numbers or [re, im].
 *
 * THE PRICE OF THE GRAM ROUTE, AND IT IS A DECLARED LIMIT AND NOT A DETAIL.  G = Z^dagger Z squares
 * the entries, so it halves the significant digits: a direction that is EXACTLY orthogonal to the
 * span comes back with sigma of order 1e-8 relative to sigma_max rather than 0, because its
 * eigenvalue of G is already at machine precision and the square root doubles that error.  So this
 * routine cannot distinguish a genuine zero from a genuine 1e-8, and `overlapVerdict` REFUSES to
 * answer when the declared resolution is finer than SIGMA_FLOOR: an instrument that reports a
 * verdict below its own noise is the thing this whole file exists to prevent.  A resolution that
 * fine needs a one-sided Jacobi SVD of Z itself, which does not square anything; it is not written
 * because nothing has needed it yet, and this comment is where that starts. */
export const SIGMA_FLOOR = 1e-7;
export function singularValues(Z) {
  if (!Z || !Z.length || !Z[0].length) return [];
  const isC = Array.isArray(Z[0][0]);
  const k = Z[0].length;                                   /* states in the multiplet */
  const re = (z) => (isC ? z[0] : z), im = (z) => (isC ? z[1] : 0);
  /* G = Z^dagger Z, k x k Hermitian */
  const gr = Array.from({ length: k }, () => new Array(k).fill(0));
  const gi = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let a = 0; a < Z.length; a++) {
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        /* conj(Z_ai) * Z_aj */
        gr[i][j] += re(Z[a][i]) * re(Z[a][j]) + im(Z[a][i]) * im(Z[a][j]);
        gi[i][j] += re(Z[a][i]) * im(Z[a][j]) - im(Z[a][i]) * re(Z[a][j]);
      }
    }
  }
  const n = isC ? 2 * k : k;
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (!isC) { M[i][j] = gr[i][j]; continue; }
      M[i][j] = gr[i][j]; M[i + k][j + k] = gr[i][j];
      M[i][j + k] = -gi[i][j]; M[i + k][j] = gi[i][j];
    }
  }
  const ev = jacobiEigenvalues(M).sort((a, b) => b - a);
  const lam = isC ? ev.filter((_, i) => i % 2 === 0) : ev;
  return lam.map((x) => Math.sqrt(Math.max(0, x)));
}

/* Cyclic Jacobi for a real symmetric matrix.  Small blocks only, which is all a multiplet is. */
function jacobiEigenvalues(M0) {
  const n = M0.length;
  const A = M0.map((r) => r.slice());
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-18) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let i = 0; i < n; i++) {
          const aip = A[i][p], aiq = A[i][q];
          A[i][p] = c * aip - s * aiq; A[i][q] = s * aip + c * aiq;
        }
        for (let i = 0; i < n; i++) {
          const api = A[p][i], aqi = A[q][i];
          A[p][i] = c * api - s * aqi; A[q][i] = s * api + c * aqi;
        }
      }
    }
  }
  return A.map((r, i) => r[i]);
}

/* ------------------------------------------------------------------ the verdict
 *
 * One of five words for one (multiplet, operator family) pair, and never a sixth.  `Z` absent is
 * `not-computed`; a resolution absent is `not-computed` too, because "below the resolution" has no
 * meaning without one — the entry's `missing` then travels as the reason. */
export function overlapVerdict(entry, Z, opts = {}) {
  const band = opts.band || 3;      /* how close to the threshold counts as undetermined */
  if (!Z || !Z.length) {
    /* BOTH FACTS ARE TRUE AND THE USEFUL ONE IS THE SECOND.  "No block was supplied" says what the
     * caller did; the entry's `missing` says what would have to be READ for the answer to exist at
     * all.  An earlier version returned only the first, so every row of a particle table carried
     * the same empty sentence and the register's own account of the gap never reached the reader. */
    const m = entry && entry.missing;
    return { verdict: "not-computed", sigmas: [],
             why: "no overlap block was supplied for this operator"
               + (m ? ", and it would not settle anything yet: " + m : "") };
  }
  const sigmas = singularValues(Z);
  const smax = sigmas.length ? sigmas[0] : 0;
  if (opts.exact && smax === 0) {
    return { verdict: "exact-zero", sigmas, smax,
             why: "the projection onto the span of the operators vanishes in exact arithmetic" };
  }
  const res = entry && entry.resolution;
  if (!(res > 0)) {
    return { verdict: "not-computed", sigmas, smax,
             why: "this operator has no declared resolution, so 'compatible with zero' has no"
               + " meaning here" + (entry && entry.missing ? ": " + entry.missing : "") };
  }
  /* THE INSTRUMENT'S OWN FLOOR.  Below it this routine cannot tell a zero from a small number, so
   * it says that rather than returning whichever side of the threshold the noise fell on. */
  if (smax > 0 && res < smax * SIGMA_FLOOR) {
    return { verdict: "not-computed", sigmas, smax, resolution: res,
             why: "the declared resolution is finer than this routine can resolve — the Gram-matrix"
               + " route floors at " + SIGMA_FLOOR + " of the largest singular value, and a verdict"
               + " below that would be a report of arithmetic noise" };
  }
  if (smax >= res * band) {
    return { verdict: "nonzero", sigmas, smax, resolution: res,
             why: "the projection is " + (smax / res).toPrecision(3) + " times the resolution" };
  }
  if (smax * band < res) {
    return { verdict: "below-res", sigmas, smax, resolution: res,
             why: "compatible with zero at the declared resolution — which is not the same as"
               + " absent, and not the same as unobservable" };
  }
  return { verdict: "undetermined", sigmas, smax, resolution: res,
           why: "the projection sits within a factor of " + band + " of the resolution, so the"
             + " answer would be a choice of threshold rather than a measurement" };
}

/* The pair a verdict is actually about, which is the thing to print: not a state, but a state
 * against a declared family of operators, at a declared resolution, in a declared context. */
export function verdictSubject(stateName, key, entry) {
  return {
    state: stateName, operator: key, channel: entry.channel,
    symmetries: entry.symmetries, hypothesis: entry.hypothesis,
    resolution: entry.resolution, source: entry.source,
  };
}

/* _test_spectrum5d.mjs — the 4D spectrum, against the eigenvalue lists the paper prints.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Haba–Yamashita write out the eigenvalues of D_y² for three of their worked models, degeneracy by
 * degeneracy.  Those lists are the strongest thing a spectrum module can be held to, because they
 * fix the charges AND the Kaluza-Klein offsets at once:
 *
 *   (3.9)   SU(3), P = P′ = diag(+,−,−), adjoint ηη′ = + :
 *           2 × n² ,  (n ± a)² ,  2 × (n ± a/2)²
 *   (3.12)  the same with ηη′ = − : every tower shifted to half-integer
 *   (4.28)  SU(6), P = diag(+,+,+,+,−,−), P′ = diag(+,−,−,−,−,−), adjoint ηη′ = + :
 *           11 × n² ,  6 × (n+½)² ,  (n ± a)² ,  2 × (n ± a/2)² ,  6 × (n ± a/2 + ½)²
 *   (4.32)  the same with ηη′ = − : the integer and half-integer families exchanged
 *
 * Then HHK eq. (3.20) — the sector counts N^(P₀P₁) for the adjoint, the fundamental and the
 * antisymmetric — which this module DERIVES from the components rather than transcribing.
 *
 * And last the control that ties the two modules together: a cosine in the potential is a pair of
 * states in the tower, so summing cos(2πnQ) over the states has to reproduce `sun5d.mjs`'s own
 * bracket.  Two constructions that share no code, one object.
 *
 *   node _test_spectrum5d.mjs
 */
import { sun5dBlocks, sun5dUnbroken } from "./src/modules/sun5d.mjs";
import { sp5States, sp5Sectors, sp5ZeroModes, sp5Families, sp5AllFamilies, sp5ShowFamily,
         sp5Weights, sp5PotentialCheck } from "./src/modules/spectrum5d.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* the eigenvalue list as the paper writes it: a multiset of "multiplicity × (offset, charge)",
 * where the charge is in units of the phase a.  Transcribed, then compared as a multiset. */
const eigen = (b, rep, eta, aSym = 1) => {
  const st = sp5States(b, rep, [eta, 1], [aSym]);
  const m = new Map();
  for (const s of st) {
    const k = `${s.half}|${(+s.Q.toFixed(9))}`;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m].map(([k, n]) => `${n}x(${k})`).sort();
};
/* the same, written the way the paper's list reads: offset in {0, ½}, charge as a multiple of a */
const want = (rows) => rows.map(([n, off, q]) => `${n}x(${off}|${q})`).sort();

/* ------------------------------------------------------------------ 1. the weights */

H("the diagonal weights are where the paper puts them");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  const { w } = sp5Weights(b, [0.4]);
  ok("SU(3), one phase: +a/2 on the (+,+) index and −a/2 on the FIRST (−,−) index, 0 on the rest",
     JSON.stringify(w) === JSON.stringify([0.2, -0.2, 0]), JSON.stringify(w));
  const c = sun5dBlocks({ nPP: 3, nPM: 0, nMP: 0, nMM: 2 });
  const { w: w2 } = sp5Weights(c, [0.4, 0.6]);
  ok("SU(5), two phases: the first two (+,+) indices are paired with the two (−,−) ones",
     JSON.stringify(w2) === JSON.stringify([0.2, 0.3, 0, -0.2, -0.3]), JSON.stringify(w2));
  const d = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 1, nMM: 2 });
  const { w: w3 } = sp5Weights(d, [0.4, 0.8]);
  ok("with a second block pair, the b-phase goes on (+,−) and (−,+)",
     JSON.stringify(w3) === JSON.stringify([0.2, 0.4, 0, 0, -0.4, -0.2, 0]), JSON.stringify(w3));
}

/* ------------------------------------------------------------------ 2. HY (3.9) and (3.12) */

H("§3 — SU(3), P = P′ = diag(+,−,−): the eigenvalues of D_y², verbatim");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  /* (3.9): 2 × n², (n ± a)², 2 × (n ± a/2)².  The adjoint has 8 states and the list has
   * 2 + 1 + 1 + 2 + 2 = 8 -- so the multiset is complete, not a selection. */
  ok("(3.9) adjoint ηη′ = + : 2×n², (n±a)², 2×(n±a/2)² — and that is all eight states",
     JSON.stringify(eigen(b, "adj", +1)) ===
     JSON.stringify(want([[2, 0, 0], [1, 0, 1], [1, 0, -1], [2, 0, 0.5], [2, 0, -0.5]])),
     JSON.stringify(eigen(b, "adj", +1)));
  ok("...and the 3 states at zero charge become 2 once the trace is removed — HHK's N(++) = 4",
     sp5Sectors(b, "adj")["++"] === 4);
  /* (3.12): every tower moves to half-integer */
  ok("(3.12) adjoint ηη′ = − : the same charges, every tower half-integer",
     JSON.stringify(eigen(b, "adj", -1)) ===
     JSON.stringify(want([[2, 0.5, 0], [1, 0.5, 1], [1, 0.5, -1], [2, 0.5, 0.5], [2, 0.5, -0.5]])),
     JSON.stringify(eigen(b, "adj", -1)));
  /* (3.16) and (3.18): the fundamental */
  ok("(3.16) fundamental ηη′ = + : (n ± a/2)² and n²",
     JSON.stringify(eigen(b, "fund", +1)) ===
     JSON.stringify(want([[1, 0, 0.5], [1, 0, -0.5], [1, 0, 0]])),
     JSON.stringify(eigen(b, "fund", +1)));
  ok("(3.18) fundamental ηη′ = − : the same, all half-integer",
     JSON.stringify(eigen(b, "fund", -1)) ===
     JSON.stringify(want([[1, 0.5, 0.5], [1, 0.5, -0.5], [1, 0.5, 0]])));
}

/* ------------------------------------------------------------------ 3. HY (4.28) and (4.32) */

H("§4.3 — SU(6) with P ≠ P′: the list that mixes both towers");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 });
  /* (4.28): 11×n², 6×(n+½)², (n±a)², 2×(n±a/2)², 6×(n±a/2+½)².  Total 11+6+2+4+12 = 35 = adj SU(6),
   * so again the transcription is the WHOLE list. */
  const got = eigen(b, "adj", +1);
  ok("(4.28) adjoint + : 11×n², 6×(n+½)², (n±a)², 2×(n±a/2)², 6×(n±a/2+½)² — the whole list",
     JSON.stringify(got) === JSON.stringify(want([
       [11, 0, 0], [6, 0.5, 0], [1, 0, 1], [1, 0, -1],
       [2, 0, 0.5], [2, 0, -0.5], [6, 0.5, 0.5], [6, 0.5, -0.5]])), JSON.stringify(got));
  /* THE FAMILIES AND THE PARITY SECTORS ARE DIFFERENT PARTITIONS OF THE SAME STATES, and it is
   * easy to read one for the other.  The paper's "11 × n²" is the family at (offset 0, charge 0);
   * HHK's N(++) = p²+q²+r²+s²−1 = 13 is the parity sector, and the two differ by exactly the two
   * (+,+) states that the Wilson line carries off zero charge to ±a/2. */
  ok("the 11 is the zero-charge integer FAMILY, and HHK's N(++) is 13 — different partitions",
     sp5Sectors(b, "adj")["++"] === 13 &&
     sp5Families(b, "adj", [1, 1], [1]).find((f) => f.half === 0 && Math.abs(f.Q) < 1e-12).n === 11);
  ok("...and they differ by exactly the two (+,+) states the Wilson line moves to ±a/2",
     sp5Sectors(b, "adj")["++"] - 11 === 2);
  ok("the whole list is 35 states — the adjoint of SU(6), so nothing was dropped and nothing " +
     "counted twice",
     sp5States(b, "adj", [1, 1]).length === 35 &&
     Object.values(sp5Sectors(b, "adj")).reduce((a, x) => a + x, 0) === 35);
  /* (4.32): the two families exchange */
  ok("(4.32) adjoint − : the integer and half-integer families exchange",
     JSON.stringify(eigen(b, "adj", -1)) === JSON.stringify(want([
       [11, 0.5, 0], [6, 0, 0], [1, 0.5, 1], [1, 0.5, -1],
       [2, 0.5, 0.5], [2, 0.5, -0.5], [6, 0, 0.5], [6, 0, -0.5]])),
     JSON.stringify(eigen(b, "adj", -1)));
  /* (4.34): the fundamental, n², 3×(n+½)², (n±a/2)² */
  ok("(4.34) fundamental + : n², 3×(n+½)², (n ± a/2)²",
     JSON.stringify(eigen(b, "fund", +1)) === JSON.stringify(want([
       [1, 0, 0.5], [1, 0, -0.5], [1, 0, 0], [3, 0.5, 0]])),
     JSON.stringify(eigen(b, "fund", +1)));
}

/* ------------------------------------------------------------------ 4. HHK (3.20) */

H("HHK eq. (3.20) — the sector counts, DERIVED from the components");
{
  for (const [p, q, r, s] of [[1, 0, 0, 2], [3, 0, 0, 2], [1, 3, 0, 2], [2, 1, 3, 1], [4, 2, 1, 3]]) {
    const b = sun5dBlocks({ nPP: p, nPM: q, nMP: r, nMM: s });
    const A = sp5Sectors(b, "adj"), F = sp5Sectors(b, "fund"), T = sp5Sectors(b, "anti");
    const okA = A["++"] === p * p + q * q + r * r + s * s - 1 &&
                A["--"] === 2 * (p * s + q * r) &&
                A["+-"] === 2 * (p * q + r * s) &&
                A["-+"] === 2 * (p * r + q * s);
    const okF = F["++"] === p && F["--"] === s && F["+-"] === q && F["-+"] === r;
    const okT = T["++"] === (p * (p - 1) + q * (q - 1) + r * (r - 1) + s * (s - 1)) / 2 &&
                T["--"] === p * s + q * r && T["+-"] === p * q + r * s && T["-+"] === p * r + q * s;
    ok(`[${p},${q},${r},${s}]: adjoint, fundamental and antisymmetric all match eq. (3.20)`,
       okA && okF && okT, JSON.stringify({ A, F, T }));
  }
  /* and the sectors must partition the representation, or a state was counted twice or lost */
  for (const rep of ["adj", "fund", "anti", "sym"]) {
    const b = sun5dBlocks({ nPP: 2, nPM: 1, nMP: 3, nMM: 1 });
    const tot = Object.values(sp5Sectors(b, rep)).reduce((a, x) => a + x, 0);
    const dim = { adj: 7 * 7 - 1, fund: 7, anti: 21, sym: 28 }[rep];
    ok(`${rep} of SU(7): the four sectors add to ${dim}`, tot === dim, String(tot));
  }
}

/* ------------------------------------------------------------------ 5. what is massless */

H("the massless 4D content, and why the vectors and the scalars never overlap");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 });      /* §4.3's SU(6) */
  const Z = sp5ZeroModes(b, {});
  ok(`gauge sector alone: ${Z.vectors} massless vectors — the dimension of ` +
     `${sun5dUnbroken(b)}`, Z.vectors === 1 * 1 + 3 * 3 + 2 * 2 - 1 && Z.vectors === 13);
  ok(`and ${Z.scalars} massless scalars from A_y, which is 2(ps + qr) = the (−,−) part of A_μ`,
     Z.scalars === 2 * (1 * 2 + 3 * 0) && Z.scalars === 4);
  ok("no state is both: A_y carries the opposite parity, so the two sets are disjoint by " +
     "construction", sp5Sectors(b, "adj")["++"] === Z.vectors &&
     sp5Sectors(b, "adj")["--"] === Z.scalars);
  /* the count of Wilson-line PHASES is smaller than the count of scalars: the residual global
   * symmetry eats the rest.  Both numbers are real and the page must not confuse them. */
  ok(`the 4 scalars carry only ${b.phases} independent Wilson-line phase — the residual global ` +
     `symmetry removes the rest, which is why eq. (5.4) is a min and not a product`,
     b.phases === 1 && Z.scalars > b.phases);
}

H("a Dirac fermion gives ONE chirality massless — the orbifold's whole point");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 });
  const Z = sp5ZeroModes(b, { gauge: false,
                              bulk: [{ rep: "fund", eta: +1, kind: "dirac", multiplicity: 1 }] });
  const L = Z.list.filter((x) => x.chirality === "L").reduce((a, x) => a + x.n, 0);
  const R = Z.list.filter((x) => x.chirality === "R").reduce((a, x) => a + x.n, 0);
  ok(`a fundamental with ηη′ = + gives ${L} left-handed and ${R} right-handed massless fields — ` +
     `p and s, and they are DIFFERENT numbers, so the 4D theory is chiral`,
     L === 1 && R === 2 && L !== R);
  ok("the left-handed ones sit in the (+,+) block and the right-handed in the (−,−) one",
     Z.list.filter((x) => x.chirality === "L").every((x) => x.blockA === 0) &&
     Z.list.filter((x) => x.chirality === "R").every((x) => x.blockA === 3));
  /* and the negative: a boundary condition with p = s gives a vector-like spectrum */
  const v = sun5dBlocks({ nPP: 2, nPM: 0, nMP: 0, nMM: 2 });
  const ZV = sp5ZeroModes(v, { gauge: false,
                               bulk: [{ rep: "fund", eta: +1, kind: "dirac", multiplicity: 1 }] });
  ok("...and with p = s the same field is vector-like, so chirality is a property of the " +
     "boundary condition and not of the orbifold alone",
     ZV.list.filter((x) => x.chirality === "L").reduce((a, x) => a + x.n, 0) ===
     ZV.list.filter((x) => x.chirality === "R").reduce((a, x) => a + x.n, 0));
}

/* ------------------------------------------------------------------ 6. the tower */

H("the eigenvalue FAMILIES, which is the object the papers publish");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  const F = sp5Families(b, "adj", [1, 1], [0.3]);
  ok("SU(3)'s adjoint is three families at ηη′ = + : zero charge, ±a and ±a/2",
     F.length === 5 && F.map((f) => f.n).sort().join(",") === "1,1,2,2,2",
     JSON.stringify(F.map((f) => [f.n, f.half, +f.Q.toFixed(3)])));
  ok("their multiplicities add to the adjoint, 8", F.reduce((a, f) => a + f.n, 0) === 8);
  ok("only the (+,+) families carry a zero mode, and they are the ones the parity rule keeps",
     F.filter((f) => f.zeroModes).reduce((a, f) => a + f.n, 0) === sp5Sectors(b, "adj")["++"]);
  ok("printed the way the paper prints it",
     sp5ShowFamily({ n: 2, half: 0, Q: 0.5 }) === "2 × (n + a/2)²" &&
     sp5ShowFamily({ n: 2, half: 0.5, Q: 0 }) === "2 × (n + ½)²",
     sp5ShowFamily({ n: 2, half: 0, Q: 0.5 }));
  /* a whole content, with each family labelled by what it came from */
  const all = sp5AllFamilies(b, { bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 2 }] },
                             [0.3]);
  ok("a content lists A_μ, A_y and both chiralities of every Dirac fermion, each with its families",
     all.length === 4 && all[0].from.startsWith("A_μ") && all[1].from.startsWith("A_y"),
     all.map((x) => x.from).join(" | "));
}

/* ------------------------------------------------------------------ 7. one object, two readings */

H("THE SPECTRUM AND THE POTENTIAL ARE THE SAME DATA");
{
  let worst = 0, cases = 0;
  for (const spec of [{ nPP: 1, nPM: 0, nMP: 0, nMM: 2 }, { nPP: 3, nPM: 0, nMP: 0, nMM: 2 },
                      { nPP: 1, nPM: 3, nMP: 0, nMM: 2 }, { nPP: 2, nPM: 2, nMP: 1, nMM: 2 }]) {
    const b = sun5dBlocks(spec);
    /* PAD to the number of phases: a term's `v` has one entry per phase, and a short theta made
     * `v·θ` come out NaN — which passes silently through any comparison written with `<`. */
    const theta = Array.from({ length: b.phases },
                             (_, i) => [0.37, 0.61, 0.23, 0.11][i % 4]);
    for (const rep of ["adj", "fund", "anti", "sym"])
      for (const eta of [+1, -1])
        for (const n of [1, 2, 3]) {
          const c = sp5PotentialCheck(b, rep, eta, theta, n);
          /* the potential counts each ± pair once and the states count both, so the states'
           * charge-dependent part is exactly TWICE the potential's bracket.  The factor is
           * asserted, not assumed: an unstated 2 is how two right constructions disagree. */
          worst = Math.max(worst, Math.abs(c.moving - 2 * c.fromTerms));
          cases++;
        }
  }
  ok(`${cases} (boundary condition, representation, parity, winding) cases: the states' ` +
     `charge-dependent sum is exactly twice the potential's bracket, worst gap ` +
     `${worst.toExponential(1)}`, worst < 1e-12);
  /* and the check is not vacuous: a wrong charge would break it */
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  const c = sp5PotentialCheck(b, "adj", +1, [0.37], 1);
  ok("it is not vacuous: the two sides are large and would not agree by accident",
     Math.abs(c.fromTerms) > 0.1 && Math.abs(c.moving) > 0.1);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_sun5d.mjs — the general SU(N) formula, against every worked example in the paper.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Haba & Yamashita, JHEP 02 (2004) 059 (hep-ph/0401185), give a general formula in §5 and four
 * worked examples in §3 and §4 which they say the general formula reproduces.  This checks that
 * claim term by term, on all four, for every representation each of them prints:
 *
 *   §3    SU(3), P = P′ = diag(+,−,−)                  eqs. (3.10) (3.13) (3.17) (3.19)
 *   §4.1  SU(5), P = P′ = diag(+,+,+,−,−)              eqs. (4.6) (4.11) (4.12) (4.13) (4.14) (4.15)
 *   §4.2  SU(6), P = P′ = diag(+,+,+,−,−,−)            eqs. (4.20) (4.21) (4.22)
 *   §4.3  SU(6), P = diag(+,+,+,+,−,−), P′ = diag(+,−,−,−,−,−)   eqs. (4.29) (4.33) (4.35)
 *
 * The expected right-hand sides below are TRANSCRIBED FROM THE PAPER, one string per cosine, and
 * compared against what the module builds.  Two of the four need the coefficient |n₊₊ − n₋₋| where
 * the printed formula has (n₊₊ − n₋₋); the signed reading is run as well and has to FAIL, because
 * a correction nobody can see fail is not a correction.
 *
 * And then the bridge: with one phase the terms are the kernel's own (m, s, c) triples, so the
 * whole instrument applies.  The archived SU(3) prediction bank of Part VII — 60 rows, reproduced
 * to 2.7e-14 by `make_data_hy.py` — is rebuilt here from the general formula rather than from
 * their special case, which is the strongest thing this module can be held to.
 *
 *   node _test_sun5d.mjs
 */
import { readFileSync } from "node:fs";
import { moments, alphaMin, F, stabilityW, F1minusF0 } from "./src/kernel/potential.mjs";
import { sun5dBlocks, sun5dUnbroken, sun5dRepTerms, sun5dTerms, sun5dV, sun5dTermTable,
         sun5dMinimum, sun5dNames, sun5dShow, SUN5D_DOF } from "./src/modules/sun5d.mjs";

const HY = JSON.parse(readFileSync(new URL("./data/su3_hy.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* The paper's own way of writing a term, so an expectation can be TRANSCRIBED and not encoded.
 * A MULTISET, not a joined string: the terms of a sum have no order, and comparing the join made
 * the harness report a physics mismatch when the only difference was the order I had copied them
 * in.  `eq` sorts both sides; `diff` says which term is missing and which is extra. */
const show = (terms, names) =>
  terms.map((t) => (t.m === 1 ? "" : t.m + "·") + sun5dShow(t, names)).sort();
const eq = (got, want) => JSON.stringify(got.slice().sort()) === JSON.stringify(want.slice().sort());
const diff = (got, want) => {
  const g = got.slice().sort(), w = want.slice().sort();
  return "missing [" + w.filter((x) => !g.includes(x)).join(", ") + "]  extra [" +
         g.filter((x) => !w.includes(x)).join(", ") + "]";
};

/* ------------------------------------------------------------------ the blocks */

H("the boundary condition, and what it decides");
{
  const su3 = sun5dBlocks({ P: [1, -1, -1], Pp: [1, -1, -1] });
  ok("§3 SU(3) P = P′ = diag(+,−,−): (n₊₊, n₊₋, n₋₊, n₋₋) = (1, 0, 0, 2)",
     su3.nPP === 1 && su3.nPM === 0 && su3.nMP === 0 && su3.nMM === 2);
  ok("one Wilson-line phase — their eq. (5.4), min(1,2) + min(0,0)", su3.phases === 1);
  ok("and SU(3) → SU(2) × U(1), which is what §3 says",
     sun5dUnbroken(su3) === "SU(2) × U(1)", sun5dUnbroken(su3));

  const su5 = sun5dBlocks({ P: [1, 1, 1, -1, -1], Pp: [1, 1, 1, -1, -1] });
  ok("§4.1 SU(5): two phases, and SU(5) → SU(3) × SU(2) × U(1)",
     su5.phases === 2 && sun5dUnbroken(su5) === "SU(3) × SU(2) × U(1)", sun5dUnbroken(su5));

  const su6 = sun5dBlocks({ P: [1, 1, 1, -1, -1, -1], Pp: [1, 1, 1, -1, -1, -1] });
  ok("§4.2 SU(6): three phases, and SU(6) → SU(3) × SU(3) × U(1)",
     su6.phases === 3 && sun5dUnbroken(su6) === "SU(3) × SU(3) × U(1)", sun5dUnbroken(su6));

  const su6b = sun5dBlocks({ P: [1, 1, 1, 1, -1, -1], Pp: [1, -1, -1, -1, -1, -1] });
  ok("§4.3 SU(6) with P ≠ P′: (1, 3, 0, 2), ONE phase",
     su6b.nPP === 1 && su6b.nPM === 3 && su6b.nMP === 0 && su6b.nMM === 2 && su6b.phases === 1);
  ok("and SU(6) → SU(3) × SU(2) × U(1)², the paper's SU(3)c × SU(2)L × U(1)Y × U(1)",
     sun5dUnbroken(su6b) === "SU(3) × SU(2) × U(1)^2", sun5dUnbroken(su6b));
}

/* ------------------------------------------------------------------ §3, SU(3) */

H("§3 — SU(3), P = P′ = diag(+,−,−): four equations, transcribed");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 }), nm = sun5dNames(b);
  ok("(3.10) adjoint ηη′ = + : cos(2πna) + 2cos(πna)",
     eq(show(sun5dRepTerms(b, "adj", +1), nm), ["2·cos(nπ(a))", "cos(nπ(2a))"]),
     show(sun5dRepTerms(b, "adj", +1), nm));
  ok("(3.13) adjoint ηη′ = − : cos(2πn(a−1)) + 2cos(πn(a−1))",
     eq(show(sun5dRepTerms(b, "adj", -1), nm), ["2·cos(nπ(a − 1))", "cos(nπ(2a − 1))"]),
     show(sun5dRepTerms(b, "adj", -1), nm));
  ok("(3.17) fundamental ηη′ = + : cos(πna)",
     eq(show(sun5dRepTerms(b, "fund", +1), nm), ["cos(nπ(a))"]));
  ok("(3.19) fundamental ηη′ = − : cos(πn(a−1))",
     eq(show(sun5dRepTerms(b, "fund", -1), nm), ["cos(nπ(a − 1))"]));
}

/* ------------------------------------------------------------------ §4.1, SU(5) */

H("§4.1 — SU(5), P = P′ = diag(+,+,+,−,−): six equations");
{
  const b = sun5dBlocks({ nPP: 3, nPM: 0, nMP: 0, nMM: 2 });
  const nm = ["a", "b"];
  ok("(4.6) adjoint + : cos2πna + cos2πnb + 2cosπna + 2cosπnb + 2cosπn(a+b) + 2cosπn(a−b)",
     eq(show(sun5dRepTerms(b, "adj", +1), nm), ["2·cos(nπ(a + b))", "2·cos(nπ(a))", "2·cos(nπ(a − b))", "2·cos(nπ(b))", "cos(nπ(2a))", "cos(nπ(2b))"]), show(sun5dRepTerms(b, "adj", +1), nm));
  ok("(4.11) fundamental + : cos πna + cos πnb",
     eq(show(sun5dRepTerms(b, "fund", +1), nm), ["cos(nπ(a))", "cos(nπ(b))"]));
  ok("(4.12) antisymmetric + : cosπna + cosπnb + cosπn(a+b) + cosπn(a−b)",
     eq(show(sun5dRepTerms(b, "anti", +1), nm), ["cos(nπ(a + b))", "cos(nπ(a))", "cos(nπ(a − b))", "cos(nπ(b))"]),
     show(sun5dRepTerms(b, "anti", +1), nm));
  ok("(4.13) adjoint − : every argument shifted by −1",
     eq(show(sun5dRepTerms(b, "adj", -1), nm), ["2·cos(nπ(a + b − 1))", "2·cos(nπ(a − 1))", "2·cos(nπ(a − b − 1))", "2·cos(nπ(b − 1))", "cos(nπ(2a − 1))", "cos(nπ(2b − 1))"]), show(sun5dRepTerms(b, "adj", -1), nm));
  ok("(4.14) fundamental − : cosπn(a−1) + cosπn(b−1)",
     eq(show(sun5dRepTerms(b, "fund", -1), nm), ["cos(nπ(a − 1))", "cos(nπ(b − 1))"]));
  ok("(4.15) antisymmetric − : the four arguments shifted",
     eq(show(sun5dRepTerms(b, "anti", -1), nm), ["cos(nπ(a + b − 1))", "cos(nπ(a − 1))", "cos(nπ(a − b − 1))", "cos(nπ(b − 1))"]),
     show(sun5dRepTerms(b, "anti", -1), nm));
}

/* ------------------------------------------------------------------ §4.2, SU(6) */

H("§4.2 — SU(6), P = P′ = diag(+,+,+,−,−,−): three phases, and NO single-phase terms");
{
  const b = sun5dBlocks({ nPP: 3, nPM: 0, nMP: 0, nMM: 3 });
  const nm = ["a", "b", "c"];
  ok("n₊₊ = n₋₋, so the leftover coefficient is zero — and eq. (4.20) indeed has no cos(πna)",
     b.leftA === 0);
  ok("(4.20) adjoint + : three doubles and six pair terms, all at weight 2",
     eq(show(sun5dRepTerms(b, "adj", +1), nm), ["2·cos(nπ(a + b))", "2·cos(nπ(a + c))", "2·cos(nπ(a − b))", "2·cos(nπ(a − c))", "2·cos(nπ(b + c))", "2·cos(nπ(b − c))", "cos(nπ(2a))", "cos(nπ(2b))", "cos(nπ(2c))"]),
     show(sun5dRepTerms(b, "adj", +1), nm));
  ok("(4.21) fundamental + : cosπna + cosπnb + cosπnc",
     eq(show(sun5dRepTerms(b, "fund", +1), nm), ["cos(nπ(a))", "cos(nπ(b))", "cos(nπ(c))"]));
  ok("(4.22) adjoint − : the same nine, each shifted by −1",
     eq(show(sun5dRepTerms(b, "adj", -1), nm), ["2·cos(nπ(a + b − 1))", "2·cos(nπ(a + c − 1))", "2·cos(nπ(a − b − 1))", "2·cos(nπ(a − c − 1))", "2·cos(nπ(b + c − 1))", "2·cos(nπ(b − c − 1))", "cos(nπ(2a − 1))", "cos(nπ(2b − 1))", "cos(nπ(2c − 1))"]),
     show(sun5dRepTerms(b, "adj", -1), nm));
}

/* ------------------------------------------------------------------ §4.3, the P ≠ P′ case */

H("§4.3 — SU(6) with P ≠ P′: the case that exercises the second block");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 }), nm = sun5dNames(b);
  ok("A = 1, B = 0, leftA = 1, leftB = 3", b.A === 1 && b.B === 0 && b.leftA === 1 && b.leftB === 3);
  ok("(4.29) adjoint + : 6cos(nπ(a−1)) + 2cos(nπa) + cos(2nπa)",
     eq(show(sun5dRepTerms(b, "adj", +1), nm), ["2·cos(nπ(a))", "6·cos(nπ(a − 1))", "cos(nπ(2a))"]),
     show(sun5dRepTerms(b, "adj", +1), nm));
  ok("(4.33) adjoint − : 6cos(nπa) + 2cos(nπ(a−1)) + cos(nπ(2a−1))",
     eq(show(sun5dRepTerms(b, "adj", -1), nm), ["2·cos(nπ(a − 1))", "6·cos(nπ(a))", "cos(nπ(2a − 1))"]),
     show(sun5dRepTerms(b, "adj", -1), nm));
  ok("(4.35) fundamental + : cos(nπa)",
     eq(show(sun5dRepTerms(b, "fund", +1), nm), ["cos(nπ(a))"]));
}

/* ------------------------------------------------------------------ the sign */

H("THE COEFFICIENT IS |n₊₊ − n₋₋|, — as printed — and the bars-dropped reading has to fail");
{
  /* The paper PRINTS the bars; every text extractor drops them (CMEX10 -> U+000C).  What is
   * rebuilt here by hand is therefore not "the printed formula" but the MUTILATED one a tool
   * hands you, for the two examples where the two differ.  It must not reproduce the paper's own
   * equations -- that is the guard against ever believing an extraction again. */
  const signed = (b, eta) => {
    /* (5.9)/(5.10) with the bars STRIPPED, which is what a text extraction returns */
    const d0 = eta > 0 ? 0 : 1, d1 = 1 - d0;
    const t = [];
    if (b.A === 1 && b.B === 0) {
      t.push({ m: 1, v: [2], d: d0 });
      t.push({ m: 2 * (b.nPP - b.nMM), v: [1], d: d0 });
      t.push({ m: 2 * (b.nPM - b.nMP), v: [1], d: d1 });
    }
    return t.filter((x) => x.m);
  };
  for (const [tag, spec, want] of [
    ["§3 SU(3)", { nPP: 1, nPM: 0, nMP: 0, nMM: 2 }, ["2·cos(nπ(a))", "cos(nπ(2a))"]],
    ["§4.3 SU(6)", { nPP: 1, nPM: 3, nMP: 0, nMM: 2 },
     ["2·cos(nπ(a))", "6·cos(nπ(a − 1))", "cos(nπ(2a))"]]]) {
    const b = sun5dBlocks(spec), nm = sun5dNames(b);
    ok(`${tag}: with |·| the module reproduces the printed equation`,
       eq(show(sun5dRepTerms(b, "adj", +1), nm), want),
       diff(show(sun5dRepTerms(b, "adj", +1), nm), want));
    ok(`${tag}: with the signed difference it does NOT — the coefficient comes out negative`,
       !eq(show(signed(b, +1), nm), want), show(signed(b, +1), nm).join(" + "));
  }
  /* and the invariance that decides it: A → PAP† is blind to P → −P, which swaps the blocks in
   * pairs.  The adjoint's terms must not notice. */
  for (const spec of [{ nPP: 1, nPM: 3, nMP: 0, nMM: 2 }, { nPP: 3, nPM: 1, nMP: 2, nMM: 5 },
                      { nPP: 2, nPM: 2, nMP: 4, nMM: 1 }]) {
    const b = sun5dBlocks(spec);
    const flip = sun5dBlocks({ nPP: spec.nMM, nPM: spec.nMP, nMP: spec.nPM, nMM: spec.nPP });
    ok(`(P, P′) → (−P, −P′) with blocks (${Object.values(spec)}) leaves the adjoint terms alone`,
       JSON.stringify(sun5dRepTerms(b, "adj", +1)) ===
       JSON.stringify(sun5dRepTerms(flip, "adj", +1)));
  }
}

/* ------------------------------------------------------------------ the bridge */

H("ONE PHASE ⟹ the kernel's own (m, s, c): the whole instrument applies to any SU(N)");
{
  /* Their §3 SU(3) model with N_a^± adjoint and N_f^± fundamental Dirac fermions and N_s^±
   * complex scalars is eq. (3.20), which `hy_predictions.py` encodes and the archived bank uses.
   * Built here from the GENERAL formula instead, it has to be the same table. */
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  const hyTable = (Nap, Nam, Nfp, Nfm, Nsp, Nsm) => [
    [-1.5 + 2 * Nap, +1, 2], [2 * Nam, -1, 2],
    [-3 + 4 * Nap - Nsp + 2 * Nfp, +1, 1], [4 * Nam - Nsm + 2 * Nfm, -1, 1]];
  const norm = (tt) => {
    const m = new Map();
    for (const [mm, s, c] of tt) {
      const k = `${s}|${c}`;
      m.set(k, (m.get(k) || 0) + mm);
    }
    return [...m].filter(([, v]) => Math.abs(v) > 1e-12).sort().map(([k, v]) => `${k}=${v}`).join(" ");
  };
  let worst = 0, cases = 0;
  for (const [Nap, Nam, Nfp, Nfm, Nsp, Nsm] of
       [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1], [2, 1, 3, 0, 1, 2], [1, 1, 1, 1, 1, 1]]) {
    const content = { bulk: [
      { rep: "adj", eta: +1, kind: "dirac", multiplicity: Nap },
      { rep: "adj", eta: -1, kind: "dirac", multiplicity: Nam },
      { rep: "fund", eta: +1, kind: "dirac", multiplicity: Nfp },
      { rep: "fund", eta: -1, kind: "dirac", multiplicity: Nfm },
      { rep: "fund", eta: +1, kind: "scalar", multiplicity: Nsp },
      { rep: "fund", eta: -1, kind: "scalar", multiplicity: Nsm },
    ] };
    const mine = sun5dTermTable(sun5dTerms(b, content));
    const theirs = hyTable(Nap, Nam, Nfp, Nfm, Nsp, Nsm);
    cases++;
    if (norm(mine) !== norm(theirs)) {
      ok(`the general formula reproduces their (3.20) at (${Nap},${Nam},${Nfp},${Nfm},${Nsp},${Nsm})`,
         false, `${norm(mine)}   vs   ${norm(theirs)}`);
      break;
    }
    /* and not just as a table: the same potential, sampled */
    for (const a of [0.05, 0.31, 0.62, 0.9]) {
      const d = Math.abs(F(mine, a, 400) - F(theirs, a, 400));
      if (d > worst) worst = d;
    }
  }
  ok(`${cases} contents of their §3 model, rebuilt from the GENERAL formula, give their eq. (3.20) ` +
     `exactly`, cases === 8);
  ok(`and the same potential at four phases each: worst |ΔF| = ${worst.toExponential(1)}`,
     worst < 1e-12);
}

H("...and through the bridge, the closed form and the archived SU(3) bank");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 0, nMP: 0, nMM: 2 });
  const bank = HY.bank || HY.predictions || null;
  ok("the SU(3) data file carries the archived prediction bank", Array.isArray(bank),
     bank ? `${bank.length} rows` : Object.keys(HY).join(","));
  if (Array.isArray(bank)) {
    let n = 0, worst = 0, missing = 0;
    for (const row of bank) {
      const c = row.content || row;
      const content = { bulk: [
        { rep: "adj", eta: +1, kind: "dirac", multiplicity: c.Nap ?? c.Na_p ?? 0 },
        { rep: "adj", eta: -1, kind: "dirac", multiplicity: c.Nam ?? c.Na_m ?? 0 },
        { rep: "fund", eta: +1, kind: "dirac", multiplicity: c.Nfp ?? c.Nf_p ?? 0 },
        { rep: "fund", eta: -1, kind: "dirac", multiplicity: c.Nfm ?? c.Nf_m ?? 0 },
        { rep: "fund", eta: +1, kind: "scalar", multiplicity: c.Nsp ?? c.Ns_p ?? 0 },
        { rep: "fund", eta: -1, kind: "scalar", multiplicity: c.Nsm ?? c.Ns_m ?? 0 },
      ] };
      const want = row.alpha_min ?? row.alpha ?? null;
      if (want === null || want === undefined) { missing++; continue; }
      const got = alphaMin(moments(sun5dTermTable(sun5dTerms(b, content))));
      if (got === null) { missing++; continue; }
      n++;
      worst = Math.max(worst, Math.abs(got - want));
    }
    ok(`${n} archived rows re-derived from the general formula: worst |Δα| = ${worst.toExponential(1)}`,
       n > 10 && worst < 1e-9, `${missing} rows skipped`);
  }
}

/* ------------------------------------------------------------------ the potential itself */

H("the potential, and the vacuum it has");
{
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 });     /* §4.3's SU(6) */
  const terms = sun5dTerms(b, { bulk: [{ rep: "fund", eta: +1, kind: "dirac", multiplicity: 4 }] });
  const m = sun5dMinimum(terms, 1);
  /* AND WHERE IT LANDS IS PART OF THE ANSWER.  V has period 2 and is even, so [0,1] is a
   * fundamental domain and its two ends are the two SYMMETRIC points.  This content minimises at
   * an end — the other symmetric point is deeper — and calling that "the Hosotani mechanism"
   * would be an overclaim, which the panel made once. */
  ok("§4.3's SU(6) with four fundamentals is deeper at an END of the domain, not inside it",
     m !== null && m.atEdge === true && m.V < m.symmetric - 1e-9, JSON.stringify(m));
  ok("...and the W criterion agrees, by name: W < 0 ⟺ θ = 1 is the deeper symmetric point",
     stabilityW(sun5dTermTable(terms)) < 0);
  /* AND THE FACTOR BETWEEN THE TWO CONVENTIONS IS CHECKED, NOT ASSUMED.  The paper writes
   * V = (C/2) Σ…, the kernel's F has no ½, so `F1minusF0` is exactly TWICE the difference this
   * module reports in V/C.  Writing the two side by side without the 2 is how a convention
   * becomes a wrong number, so the 2 is an assertion. */
  ok("F(1) − F(0) = (31/16)ζ(5)W is exactly TWICE the difference in V/C — the paper's ½, checked",
     Math.abs(F1minusF0(stabilityW(sun5dTermTable(terms))) - 2 * (m.other - m.symmetric)) < 1e-9,
     `${F1minusF0(stabilityW(sun5dTermTable(terms)))} vs 2×${m.other - m.symmetric}`);
  /* a content that DOES break, so the interior branch is not a dead one */
  {
    const t2 = sun5dTerms(b, { bulk: [{ rep: "adj", eta: +1, kind: "dirac", multiplicity: 2 }] });
    const m2 = sun5dMinimum(t2, 1);
    ok("and a content with two adjoints minimises strictly INSIDE — the interior branch occurs",
       m2 !== null && m2.atEdge === false && m2.theta[0] > 1e-3 && m2.theta[0] < 1 - 1e-3,
       JSON.stringify(m2));
  }
  ok("and V agrees with the kernel's F on the same content, up to the declared ½",
     Math.abs(sun5dV(terms, [0.23]) - F(sun5dTermTable(terms), 0.23, 600)) < 1e-12);
  /* gauge alone: pure gauge must be a maximum at the symmetric point or the model never breaks */
  const pure = sun5dTerms(b, {});
  ok("gauge and ghost alone give the −3 × adjoint the paper prescribes",
     JSON.stringify(pure.map((t) => t.m).sort((x, y) => x - y)) ===
     JSON.stringify(sun5dRepTerms(b, "adj", +1).map((t) => t.m * SUN5D_DOF.gauge).sort((x, y) => x - y)));
  const two = sun5dBlocks({ nPP: 3, nPM: 0, nMP: 0, nMM: 2 });    /* §4.1's SU(5), two phases */
  const t2 = sun5dTerms(two, { bulk: [{ rep: "anti", eta: +1, kind: "dirac", multiplicity: 3 }] });
  const m2 = sun5dMinimum(t2, 2);
  ok("a two-phase model is minimised on the torus, not on a line",
     m2 !== null && m2.theta.length === 2);
  ok("...and the (m, s, c) bridge refuses that model out loud rather than silently dropping a phase",
     (() => { try { sun5dTermTable(t2); return false; } catch (e) { return /one Wilson-line phase/.test(e.message); } })());
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

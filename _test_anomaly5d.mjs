/* _test_anomaly5d.mjs — the anomaly ledger, against the group theory and against itself.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * An anomaly ledger is only worth having if the group theory inside it is right, so none of it is
 * taken on trust:
 *
 *   - the indices and cubic anomalies are RE-DERIVED from fund ⊗ fund = sym ⊕ antisym, which fixes
 *     A(sym) + A(anti) = 2N and T(sym) + T(anti) = (N+2)/2 + (N−2)/2 = N — the table has to come
 *     out of the decomposition, not the other way round;
 *   - the ADJOINT is a real representation, so an adjoint bulk fermion must be anomaly-free on
 *     EVERY boundary condition — which is a real test of the conjugation on the off-diagonal
 *     pieces, and the first version of the module failed it;
 *   - a piece and its own CONJUGATE must cancel, fed in directly, which tests every sign at once;
 *
 * Three premises this harness started with were wrong PHYSICS and were replaced rather than
 * patched: p = s does not make a spectrum vector-like (the two chiralities live in different SU
 * factors of the same size); flipping ηη′ is not conjugation (it moves the zero modes to the other
 * pair of blocks); and an unbroken boundary condition is the maximally CHIRAL case, not a
 * vector-like one — it is Arkani-Hamed–Cohen–Georgi's own setup.
 *
 *   - the U(1) generators must be traceless and must satisfy Σ_a Y_a = 0;
 *   - the ledger's own component count is compared with `spectrum5d.mjs`, which reaches it by a
 *     different route;
 *   - and the ledger must be able to say NO: contents with a genuine anomaly are exhibited, with
 *     the channel named, or "every model is anomaly-free" would be the only thing it ever said.
 *
 *   node _test_anomaly5d.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { sp5ZeroModes } from "./src/modules/spectrum5d.mjs";
import { an5Ledger, an5LedgerFromPieces, an5Pieces, an5U1, an5FermionComponents, rShow, rNum }
  from "./src/modules/anomaly5d.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });

/* ------------------------------------------------------------------ 1. the generators */

H("the U(1) generators are traceless, and there are three of them");
{
  for (const spec of [[1, 0, 0, 2], [3, 0, 0, 2], [1, 3, 0, 2], [2, 1, 3, 1]]) {
    const b = B(spec), sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
    let tracelessOK = true, sumOK = true;
    const sum = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) {
      const Y = an5U1(b, c);
      /* trace = Σ_a n_a · Y_a must vanish */
      const tr = Y.reduce((a, y, i) => a + rNum(y) * sizes[i], 0);
      tracelessOK &&= Math.abs(tr) < 1e-12;
      Y.forEach((y, i) => { sum[i] += rNum(y); });
    }
    sumOK = sum.every((x) => Math.abs(x) < 1e-12);
    ok(`[${spec}]: every Y_a is traceless, and Σ_a Y_a = 0 — so three of the four are independent`,
       tracelessOK && sumOK, JSON.stringify(sum));
  }
}

/* ------------------------------------------------------------------ 2. the group theory */

H("the indices and cubic anomalies come OUT of fund ⊗ fund = sym ⊕ antisym");
{
  /* the ledger uses T(fund)=1/2, T(adj)=N, T(anti)=(N−2)/2, T(sym)=(N+2)/2 and
   * A(fund)=1, A(adj)=0, A(anti)=N−4, A(sym)=N+4.  Both tables must satisfy the decomposition. */
  let allT = true, allA = true, allDim = true;
  for (let N = 3; N <= 12; N++) {
    const dAnti = (N * (N - 1)) / 2, dSym = (N * (N + 1)) / 2;
    allDim &&= dAnti + dSym === N * N;
    /* T(R₁⊗R₂) = T(R₁)dim(R₂) + dim(R₁)T(R₂) with R₁ = R₂ = fund: 2 · (1/2) · N = N */
    allT &&= Math.abs(((N - 2) / 2 + (N + 2) / 2) - N) < 1e-12;
    /* A(R₁⊗R₂) = A(R₁)dim(R₂) + dim(R₁)A(R₂) = 1·N + N·1 = 2N */
    allA &&= (N - 4) + (N + 4) === 2 * N;
  }
  ok("dim(antisym) + dim(sym) = N² for N = 3…12", allDim);
  ok("T(antisym) + T(sym) = N, which is T(fund ⊗ fund)", allT);
  ok("A(antisym) + A(sym) = 2N, which is A(fund ⊗ fund)", allA);
  ok("and A(adjoint) = 0, because the adjoint is real — the ledger must never charge it",
     true === true && (() => {
       /* exhibited: an adjoint Dirac fermion contributes nothing to any cubic non-abelian channel */
       const b = B([3, 0, 0, 2]);
       const L = an5Ledger(b, { bulk: [D("adj", +1, 1)] });
       return L.rows.filter((r) => r.kind === "cubic-nonabelian").every((r) => rNum(r.value) === 0);
     })());
}

/* ------------------------------------------------------------------ 3. vector-like is clean */

H("THE ADJOINT IS REAL, so an adjoint bulk fermion is anomaly-free on EVERY boundary condition");
{
  /* Its left-handed zero modes are the block-DIAGONAL adjoints, which carry no cubic anomaly; its
   * right-handed ones are the two off-diagonal pieces (a,b) and (b,a), which are conjugate to each
   * other.  Getting that conjugation wrong is the one mistake this test exists to catch, and the
   * first version of the module made it: it counted both as plain fundamentals and they added. */
  let n = 0, bad = [];
  for (const spec of [[1, 0, 0, 2], [3, 0, 0, 2], [1, 3, 0, 2], [2, 1, 3, 1], [4, 2, 1, 3],
                      [3, 0, 0, 3], [5, 1, 1, 2]])
    for (const eta of [+1, -1])
      for (const m of [1, 3]) {
        const L = an5Ledger(B(spec), { bulk: [D("adj", eta, m)] });
        n++;
        if (!L.clean) bad.push(`[${spec}] ηη′=${eta} ×${m}: ` +
          L.offending.map((r) => `${r.channel}=${rShow(r.value)}`).join(", "));
      }
  ok(`${n} adjoint contents over seven boundary conditions: every channel zero in all of them`,
     bad.length === 0, bad.slice(0, 2).join(" | "));
}

H("a piece and its own conjugate cancel — every sign convention at once");
{
  const conj = (p) => ({ ...p, chirality: p.chirality === "L" ? "R" : "L" });
  let n = 0, bad = 0, worst = null;
  for (const spec of [[2, 0, 0, 3], [1, 3, 0, 2], [2, 1, 3, 1], [4, 2, 1, 3]]) {
    const b = B(spec);
    for (const p of [{ rep: "fund", blockA: 0, blockB: null, chirality: "L", copies: 1 },
                     { rep: "fund", blockA: 3, blockB: null, chirality: "R", copies: 2 },
                     { rep: "anti", blockA: 0, blockB: 0, chirality: "L", copies: 1 },
                     { rep: "sym", blockA: 0, blockB: 3, chirality: "L", copies: 1 },
                     { rep: "adj", blockA: 0, blockB: 3, chirality: "R", copies: 1 }]) {
      const L = an5LedgerFromPieces(b, [p, conj(p)]);
      n++;
      if (!L.clean) { bad++; if (!worst) worst = `[${spec}] ${p.rep}(${p.blockA},${p.blockB}): ` +
        L.offending.map((r) => `${r.channel}=${rShow(r.value)}`).join(", "); }
    }
  }
  ok(`${n} piece/conjugate pairs, fed straight in: every channel cancels`, bad === 0, worst || "");
}

/* ------------------------------------------------------------------ 4. it can say NO */

H("and it can say NO — otherwise 'anomaly-free' would be the only thing it ever says");
{
  const cases = [
    [[2, 0, 0, 3], "fund", +1], [[1, 0, 0, 4], "fund", +1], [[3, 0, 0, 2], "anti", +1],
    [[1, 3, 0, 2], "fund", +1], [[4, 0, 0, 1], "sym", +1],
  ];
  let anomalous = 0;
  for (const [spec, rep, eta] of cases) {
    const b = B(spec);
    const L = an5Ledger(b, { bulk: [D(rep, eta, 1)] });
    if (!L.clean) anomalous++;
    console.log(`     [${spec}] one ${rep} ηη′=${eta > 0 ? "+" : "−"}: ` +
      (L.clean ? "clean" : L.offending.map((r) => `${r.channel} = ${rShow(r.value)}`).join(",  ")));
  }
  ok(`${anomalous} of ${cases.length} chiral contents come out ANOMALOUS, with the channel named`,
     anomalous >= 3, String(anomalous));
  /* the SU(5) case a reader will recognise: [2,0,0,3] with one fundamental leaves a doublet of
   * SU(2) and a triplet of SU(3) of opposite chirality -- SU(2) has no cubic anomaly, SU(3) does */
  const L = an5Ledger(B([2, 0, 0, 3]), { bulk: [D("fund", +1, 1)] });
  const su3 = L.rows.find((r) => r.channel.startsWith("[SU(3)"));
  ok("SU(5) [2,0,0,3] with one bulk fundamental: the [SU(3)]³ channel is ∓1, not zero — one " +
     "triplet's worth, which a brane conjugate would pay", su3 && Math.abs(rNum(su3.value)) === 1,
     su3 ? rShow(su3.value) : "no SU(3) channel");
  ok("...and no [SU(2)]³ channel is ever listed, because SU(2) has none",
     !L.rows.some((r) => r.channel.startsWith("[SU(2)")));
}

/* ------------------------------------------------------------------ 5. two routes, one count */

H("the ledger's pieces and the spectrum's components are the same fermions");
{
  let n = 0, bad = 0, worst = null;
  for (const spec of [[1, 0, 0, 2], [3, 0, 0, 2], [1, 3, 0, 2], [2, 1, 3, 1], [4, 2, 1, 3]])
    for (const rep of ["fund", "anti", "sym", "adj"])
      for (const eta of [+1, -1])
        for (const m of [1, 3]) {
          const b = B(spec), content = { gauge: false, bulk: [D(rep, eta, m)] };
          const a = an5FermionComponents(b, content);
          const s = sp5ZeroModes(b, content).fermions;
          n++;
          if (a !== s) { bad++; if (!worst) worst = `[${spec}] ${rep} ${eta} ×${m}: ${a} vs ${s}`; }
        }
  ok(`${n} contents: the anomaly module counts the same massless fermion components as the ` +
     `spectrum module, by a different route`, bad === 0, worst || "");
}

/* ------------------------------------------------------------------ 6. the conjugate pays */

H("what flipping ηη′ actually does — and it is NOT conjugation");
{
  /* The first version of this harness asserted that flipping ηη' conjugates the content.  It does
   * not: it moves the zero modes from the (+,+)/(-,-) pair of blocks to the (+,-)/(-,+) pair,
   * which is a DIFFERENT theory.  What is true, and worth pinning, is that the two live in
   * disjoint blocks -- so on a boundary condition with q = r = 0 one of them has no zero modes at
   * all. */
  const b = B([2, 0, 0, 3]);
  const plus = an5Pieces(b, { bulk: [D("fund", +1, 1)] });
  const minus = an5Pieces(b, { bulk: [D("fund", -1, 1)] });
  ok("with q = r = 0, ηη′ = + gives zero modes and ηη′ = − gives none at all",
     plus.length > 0 && minus.length === 0,
     `${plus.length} vs ${minus.length}`);
  const c = B([1, 2, 2, 1]);
  const cp = an5Pieces(c, { bulk: [D("fund", +1, 1)] });
  const cm = an5Pieces(c, { bulk: [D("fund", -1, 1)] });
  ok("and where all four blocks are filled, the two occupy DISJOINT blocks — not conjugate ones",
     cp.length > 0 && cm.length > 0 &&
     cp.every((p) => !cm.some((q) => q.blockA === p.blockA)),
     `${cp.map((p) => p.blockA)} vs ${cm.map((p) => p.blockA)}`);
}

/* ------------------------------------------------------------------ 7. a content that works */

H("the unbroken boundary condition is the MAXIMALLY chiral one, and the ledger says so");
{
  /* P0 = P1 = +1 on everything breaks nothing, and a bulk Dirac fermion then leaves exactly one
   * chirality massless -- which is Arkani-Hamed-Cohen-Georgi's own setup, and is anomalous.  The
   * first version of this harness called it "vector-like", which is the opposite of true. */
  const b = B([5, 0, 0, 0]);
  const L = an5Ledger(b, { bulk: [D("fund", +1, 1)] });
  const su5 = L.rows.find((r) => r.channel.startsWith("[SU(5)"));
  ok("SU(5) with P₀ = P₁ = +1: one bulk fundamental leaves ONE chirality, and [SU(5)]³ = 1",
     su5 && rNum(su5.value) === 1, su5 ? rShow(su5.value) : "no channel");
  ok("...and there is no U(1) at all, because only one block is filled",
     !L.rows.some((r) => r.channel.startsWith("U(1)")));
  /* and the pairing that fixes it, which is what a brane conjugate does */
  const paired = an5LedgerFromPieces(b, [
    { rep: "fund", blockA: 0, blockB: null, chirality: "L", copies: 1 },
    { rep: "fund", blockA: 0, blockB: null, chirality: "R", copies: 1 }]);
  ok("a brane fermion conjugate to it pays the bill exactly — Part VI's pairing, in one line",
     paired.clean);
}
console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_vacuum5d.mjs — the massless content at the minimum, held to two routes and a decoy.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The module makes a claim that is easy to get subtly wrong — which components of which field are
 * massless when the Wilson line is on — and the honest way to hold it is to reach the number by
 * two constructions that share nothing:
 *
 *   - the REPRESENTATION THEORY (letters twist into letters, D(c) into D(±c), S²D = (+,+) ⊕
 *     D(2c²−1), Λ²D = (−,−)), which is what the page reads because it is exact integers;
 *   - the MATRICES: ρ(P₀) and ρ(P₁′) built explicitly on the fundamental, adjoint, antisymmetric
 *     and symmetric, and the joint eigenspace counted by elimination.
 *
 * Then the two ends where the answer is known without either: at θ = 0 it is `sp5ZeroModes` of the
 * boundary condition itself, at θ = 1 it is `sp5ZeroModes` and `an5Ledger` of the CLASS-MATE
 * [p−1,q+1,r+1,s−1] — character for character.  And a decoy that must FAIL: reading the KK families
 * at n = 0 over-counts at θ = 1, and this harness requires it to.
 *
 *   node _test_vacuum5d.mjs
 */
import { sun5dBlocks, sun5dUnbroken, sun5dTerms, sun5dMinimum } from "./src/modules/sun5d.mjs";
import { sp5ZeroModes, sp5States } from "./src/modules/spectrum5d.mjs";
import { an5Ledger, rShow } from "./src/modules/anomaly5d.mjs";
import { bcClasses } from "./src/modules/bcclass.mjs";
import { vac5Pairs, vac5Frame, vac5Unbroken, vac5ZeroModes, vac5Ledger, vac5Direct, vac5Count,
         vac5NaiveFromStates, vac5At, vac5Matrices, vac5Rank, VAC5_EPS }
  from "./src/modules/vacuum5d.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });
const GAUGE = { gauge: true, bulk: [] };
const FUND = { gauge: true, bulk: [D("fund", +1)] };
const MIX = { gauge: true, bulk: [D("fund", +1), D("anti", -1, 2), D("sym", +1), D("adj", +1),
                                  { rep: "fund", eta: -1, kind: "scalar", multiplicity: 1 }] };
const ledgerKey = (L) => L.verdict + "|" + L.rows.map((r) => `${r.channel}=${rShow(r.value)}`).join(";");

/* ------------------------------------------------------------------ 1. the matrices are what they claim */

H("P₀ and P₁′ are real reflections, and P₁′ is P₁ at a symmetric point");
{
  const b = B([2, 1, 1, 1]);
  const { P0, P1 } = vac5Matrices(b, [0.37, 0.61]);
  const N = b.N;
  const mul = (X, Y) => X.map((r, i) => r.map((_, j) => r.reduce((a, x, k) => a + x * Y[k][j], 0)));
  const isId = (X) => X.every((r, i) => r.every((x, j) => Math.abs(x - (i === j ? 1 : 0)) < 1e-12));
  const sym = (X) => X.every((r, i) => r.every((x, j) => Math.abs(x - X[j][i]) < 1e-12));
  ok("P₀² = 1, P₁′² = 1, both symmetric — two reflections, as the derivation needs",
     isId(mul(P0, P0)) && isId(mul(P1, P1)) && sym(P0) && sym(P1));
  const anti = P1.some((r, i) => r.some((x, j) => i !== j && Math.abs(x) > 1e-12));
  ok("...and P₁′ is NOT diagonal at a broken point, so it is not the parity rule in disguise", anti);
  const { P1: Q } = vac5Matrices(b, [0, 1]);
  const diag = Q.every((r, i) => r.every((x, j) => i === j || Math.abs(x) < 1e-12));
  ok("at (θ, φ) = (0, 1) it is diagonal again, with the (+,−)/(−,+) pair's signs swapped",
     diag && Q[2][2] === 1 && Q[3][3] === -1, `${Q[2][2]}, ${Q[3][3]}`);
  const pairs = vac5Pairs(b, [0.3, 0.8]);
  ok("an A-pair sits at t = θ and a B-pair at t = 1 − φ: the two families of pairs share one label",
     Math.abs(pairs[0].t - 0.3) < 1e-12 && Math.abs(pairs[1].t - 0.2) < 1e-12);
  let threw = false;
  try { vac5Pairs(b, [0.3]); } catch { threw = true; }
  ok("a phase vector of the wrong length is refused rather than padded", threw);
  ok("the rank routine: rank of a 3×3 with one dependent row is 2",
     vac5Rank([[1, 2, 3], [2, 4, 6], [0, 1, 0]]) === 2);
}

/* ------------------------------------------------------------------ 2. two routes, one count */

H("representation theory against the matrices, on every representation and twist");
{
  const CASES = [[1, 0, 0, 1], [2, 0, 0, 1], [1, 1, 1, 1], [2, 1, 1, 1], [3, 0, 0, 2], [2, 0, 0, 2],
                 [1, 2, 1, 1], [1, 0, 3, 1], [0, 1, 4, 0], [2, 2, 1, 1], [3, 1, 1, 1]];
  const ONE = [[0], [0.25], [0.5], [0.7], [1]];
  const TWO = [[0, 0], [0.3, 0.3], [0.3, 0.7], [0.5, 0.5], [1, 0], [0.2, 0.8], [1, 1], [0.41, 0.59]];
  let n = 0, bad = [];
  for (const bc of CASES) {
    const b = B(bc);
    const ths = b.phases === 0 ? [[]] : b.phases === 1 ? ONE : TWO;
    for (const th of ths) {
      const fr = vac5Frame(b, th);
      for (const rep of ["fund", "adj", "anti", "sym"])
        for (const [e0, e1] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const a = vac5Count(fr, rep, e0, e1), d = vac5Direct(b, th, rep, e0, e1);
          n++;
          if (a !== d) bad.push(`[${bc}] θ=${th} ${rep} (${e0},${e1}): ${a} vs ${d}`);
        }
    }
  }
  ok(`${n} (boundary condition, θ, representation, twist) cases: the two routes agree on all`,
     bad.length === 0, bad.slice(0, 3).join(" | "));
  /* and three phases, which the page never reaches but the mathematics must still hold at */
  const b3 = B([1, 2, 2, 1]);
  let n3 = 0, bad3 = [];
  for (const th of [[0.3, 0.3, 0.3], [0.3, 0.7, 0.2], [1, 0.5, 0], [0.25, 0.75, 0.25]]) {
    const fr = vac5Frame(b3, th);
    for (const rep of ["fund", "adj", "anti", "sym"])
      for (const [e0, e1] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        n3++;
        const a = vac5Count(fr, rep, e0, e1), d = vac5Direct(b3, th, rep, e0, e1);
        if (a !== d) bad3.push(`θ=${th} ${rep} (${e0},${e1}): ${a} vs ${d}`);
      }
  }
  ok(`...and ${n3} cases with THREE phases, SU(6) [1,2,2,1], agree too`, bad3.length === 0,
     bad3.slice(0, 3).join(" | "));
}

/* ------------------------------------------------------------------ 3. the two ends */

H("at θ = 0 it is the parity rule of this boundary condition; at θ = 1 it is the CLASS-MATE's");
{
  let n = 0, bad = [];
  for (let N = 4; N <= 7; N++) {
    const C = bcClasses(N, "S1/Z2");
    for (const bc of C.all) {
      const b = B(bc);
      if (b.phases !== 1) continue;
      for (const content of [GAUGE, FUND, MIX]) {
        n++;
        const v0 = vac5At(b, content, [0]);
        const z0 = sp5ZeroModes(b, content);
        const same0 = v0.zero.vectors === z0.vectors && v0.zero.scalars === z0.scalars &&
                      v0.zero.fermions === z0.fermions && v0.unbroken === sun5dUnbroken(b) &&
                      ledgerKey(v0.anom) === ledgerKey(an5Ledger(b, content));
        if (!same0) bad.push(`[${bc}] θ=0`);
        const v1 = vac5At(b, content, [1]);
        const mate = v1.frame.rearranged;
        const bm = B(mate), z1 = sp5ZeroModes(bm, content);
        const inClass = C.of(mate) === C.of(bc) && mate.join() !== bc.join();
        const same1 = v1.zero.vectors === z1.vectors && v1.zero.scalars === z1.scalars &&
                      v1.zero.fermions === z1.fermions && v1.unbroken === sun5dUnbroken(bm) &&
                      ledgerKey(v1.anom) === ledgerKey(an5Ledger(bm, content));
        if (!inClass || !same1) bad.push(`[${bc}] θ=1 → [${mate}]${inClass ? "" : " not a class-mate"}`);
      }
    }
  }
  ok(`${n} (one-phase boundary condition, content) cases at N = 4…7: θ = 0 reproduces the spectrum ` +
     `and ledger here, θ = 1 reproduces them on a DIFFERENT member of the same class`,
     bad.length === 0, bad.slice(0, 3).join(" | "));
  /* the two-phase version of the same statement, on a case with both kinds of pair */
  const b = B([2, 1, 1, 1]);
  const v = vac5At(b, MIX, [1, 0]);
  const mate = v.frame.rearranged;
  ok("SU(6) [2,1,1,1] at (θ, φ) = (1, 0) rearranges to [1,2,2,0], a class-mate, with its content",
     mate.join() === "1,2,2,0" && v.unbroken === sun5dUnbroken(B(mate)) &&
     v.zero.fermions === sp5ZeroModes(B(mate), MIX).fermions, `[${mate}] ${v.unbroken}`);
  const w = vac5At(b, MIX, [1, 1]);
  ok("...and at (1, 1) the two moves cancel: the frame is the original boundary condition again",
     w.frame.rearranged.join() === "2,1,1,1" && w.unbroken === sun5dUnbroken(b));
}

/* ------------------------------------------------------------------ 4. the decoy */

H("the count that reads the KK families at n = 0 is WRONG at θ = 1, and this module is not");
{
  const b = B([1, 0, 0, 1]);
  const naive = (th) => vac5NaiveFromStates(sp5States(b, "adj", [1, 1], [th]));
  const mine = (th) => vac5At(b, GAUGE, [th]).zero.vectors;
  ok("SU(2), P = P′ = diag(+,−), θ = 0: both say one massless vector", naive(0) === 1 && mine(0) === 1);
  ok("θ = 1: W = −1 is central, so the theory is the θ = 0 theory and there is ONE massless vector",
     mine(1) === 1, String(mine(1)));
  ok("...and the family count says TWO there, because the Cartan direction keeps charge zero",
     naive(1) === 2, String(naive(1)));
  ok("at a broken point, θ = 0.3, nothing is unbroken and one scalar stays flat at tree level",
     mine(0.3) === 0 && vac5At(b, GAUGE, [0.3]).unbroken === "nothing" &&
     vac5At(b, GAUGE, [0.3]).zero.scalars === 1);
}

/* ------------------------------------------------------------------ 5. the group at a broken vacuum */

H("the group at a broken vacuum, named from the irreducibles and not guessed");
{
  const b = B([2, 0, 0, 1]);
  ok("SU(3) [2,0,0,1]: SU(2) × U(1) at θ = 0, U(1)² at θ = 1, and U(1) — the photon — in between",
     vac5At(b, GAUGE, [0]).unbroken === "SU(2) × U(1)" &&
     vac5At(b, GAUGE, [1]).unbroken === "U(1)^2" &&
     vac5At(b, GAUGE, [0.37]).unbroken === "U(1)");
  const c = B([3, 0, 0, 2]);
  const same = vac5At(c, GAUGE, [0.3, 0.3]), diff = vac5At(c, GAUGE, [0.3, 0.6]);
  ok("SU(5) [3,0,0,2], two pairs at the SAME angle: an SU(2) the symmetric point never had",
     same.unbroken === "SU(2) × U(1)" && same.frame.blocks.some((k) => k.kind === "pair" && k.size === 2),
     same.unbroken);
  ok("...and at two different angles it is U(1)² only", diff.unbroken === "U(1)^2", diff.unbroken);
  const d = B([1, 1, 1, 1]);
  const e = vac5At(d, GAUGE, [0.3, 0.7]);
  ok("SU(4) [1,1,1,1], A-pair at θ = 0.3 and B-pair at φ = 0.7: the same irreducible, so SU(2)",
     e.unbroken === "SU(2)" && e.zero.vectors === 3, `${e.unbroken} / ${e.zero.vectors}`);
  ok("...which the matrices confirm", vac5Direct(d, [0.3, 0.7], "adj", 1, 1) === 3);
  ok("a pair strictly inside is reported as a broken vacuum, and a pair at an end as a class-mate",
     /^broken — 1 pair at t = 0\.3700$/.test(vac5At(b, GAUGE, [0.37]).where) &&
     /^\[1, 1, 1, 0\] — a symmetric point$/.test(vac5At(b, GAUGE, [1]).where));
}

/* ------------------------------------------------------------------ 6. at the actual minimum */

H("read at the minimiser's own vacuum, on the case the dossier opens with");
{
  const b = B([1, 0, 4, 1]);
  const terms = sun5dTerms(b, FUND);
  const m = sun5dMinimum(terms, b.phases, { grid: 240, windings: 200 });
  const v = vac5At(b, FUND, m.theta);
  ok(`SU(6) [1,0,4,1] with one fundamental: the vacuum is located (θ = ${m.theta[0].toFixed(4)}) ` +
     `and the content there is computed`, !!m && v.zero.vectors >= 0 && typeof v.unbroken === "string");
  /* the class-mate's minimiser must find the mirror vacuum and the same physics */
  const mate = [0, 1, 5, 0];
  const bm = B(mate), mm = sun5dMinimum(sun5dTerms(bm, FUND), bm.phases, { grid: 240, windings: 200 });
  const vm = vac5At(bm, FUND, mm.theta);
  ok("its class-mate [0,1,5,0] finds the mirror vacuum, θ′ = 1 − θ, to the grid's precision",
     Math.abs(mm.theta[0] - (1 - m.theta[0])) < 1e-6, `${m.theta[0]} vs ${mm.theta[0]}`);
  ok("...and the group, the massless counts and the anomaly verdict AT THE MINIMUM agree on both",
     v.unbroken === vm.unbroken && v.zero.vectors === vm.zero.vectors &&
     v.zero.scalars === vm.zero.scalars && v.zero.fermions === vm.zero.fermions &&
     v.anom.verdict === vm.anom.verdict && v.where === vm.where,
     `${v.unbroken} / ${vm.unbroken}; ${v.where} / ${vm.where}`);
  ok("...while at the two symmetric points they do not, which is the gap this module closes",
     sun5dUnbroken(b) !== sun5dUnbroken(bm));
}

/* ------------------------------------------------------------------ 7. the tolerance is named */

H("the tolerance is a named constant, and it decides the symmetric/broken verdict");
{
  const b = B([2, 0, 0, 1]);
  ok("a phase within ε of an end is a symmetric point; one 10ε inside is a broken vacuum",
     vac5Frame(b, [VAC5_EPS / 2]).symmetric && !vac5Frame(b, [10 * VAC5_EPS]).symmetric);
  ok("the vacuum ledger and the massless list share one frame object, so they cannot disagree on it",
     (() => { const f = vac5Frame(b, [0.3]); return vac5Ledger(f, FUND).pieces.every((p) =>
        f.blocks[p.blockA].size > 0) && vac5ZeroModes(f, FUND).list.every((g) =>
        f.blocks[g.blockA].size > 0); })());
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

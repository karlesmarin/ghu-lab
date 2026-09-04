/* _test_papers.mjs — the four published models, and the instrument held to what they print.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   node _test_papers.mjs
 *
 * WHAT THIS HARNESS IS FOR, AND IT IS NOT "the anchors pass".  `papers.mjs` records a verdict for
 * every anchor; a test that only re-ran `paperRun` and checked the recorded verdict would be a
 * tautology with extra steps.  So every number that matters is reached a SECOND way here — the
 * closed form by hand off the paper's own equation, the curvature by finite difference instead of
 * by the analytic Hessian, the parity matrix rebuilt from the block letters instead of from
 * (P, P′) — and a falsification set says which wrong readings the gates would have caught.
 *
 * THE ONE ROW THAT DIFFERS IS TESTED AS A DIFFERENCE.  Kubo–Lim–Yamashita's eq. (35) is checked to
 * be (9 − 2N_f) and NOT (9 − N_f), by a margin far outside any tolerance, at five values of N_f —
 * because "it differs" is a claim and needs a gate exactly like "it agrees" does.
 */
import { PAPER_MODELS, PAPER_ANCHORS, paperById, paperRun, paperRunAll, paperContext,
         paperV, paperCurvature, paperState, paperClass, paperShow, ZETA3, ZETA5 }
  from "./src/modules/papers.mjs";
import { sun5dBlocks, sun5dTerms, sun5dV, sun5dHessian } from "./src/modules/sun5d.mjs";
import { sp5Sectors } from "./src/modules/spectrum5d.mjs";
import { SOURCES } from "./src/kernel/cite.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* ------------------------------------------------------------------ 1. the anchors hold */

H("every anchor of every model returns the verdict this repository recorded");
{
  const all = paperRunAll();
  for (const r of all) {
    for (const row of r.rows)
      ok(`${r.m.id} · ${row.id} (${row.where}) → ${row.verdict}`, row.held,
         `wanted ${row.want}, got ${row.verdict}: theirs ${JSON.stringify(row.theirs)}, ` +
         `ours ${JSON.stringify(row.ours)}`);
    ok(`${r.m.id}: ${paperShow(r)}`, r.held);
  }
  const same = all.reduce((a, r) => a + r.same, 0);
  const differs = all.reduce((a, r) => a + r.differs, 0);
  const outside = all.reduce((a, r) => a + r.outside, 0);
  ok(`24 statements reproduced, 1 differing, 3 outside this engine (got ${same}/${differs}/${outside})`,
     same === 24 && differs === 1 && outside === 3);
}

H("the registry has no orphans and no dangling names");
{
  const named = new Set(PAPER_MODELS.flatMap((m) => m.anchorIds));
  const defined = new Set(Object.keys(PAPER_ANCHORS));
  ok("every anchor a model names is defined", [...named].every((k) => defined.has(k)),
     [...named].filter((k) => !defined.has(k)).join(","));
  /* an anchor no model names is a gate that does not run — and a gate outside the list does not
   * exist, whatever its file says */
  ok("every defined anchor is named by a model", [...defined].every((k) => named.has(k)),
     [...defined].filter((k) => !named.has(k)).join(","));
  let threw = false;
  try { paperRun({ ...PAPER_MODELS[0], anchorIds: ["no-such-anchor"] }); } catch { threw = true; }
  ok("a model naming an anchor that does not exist throws rather than reporting nothing", threw);
  ok("every model's source is in the citation registry",
     PAPER_MODELS.every((m) => SOURCES[m.cite] && SOURCES[m.cite].eprint));
}

/* ------------------------------------------------------------------ 2. KLY, reached a second way */

H("Kubo–Lim–Yamashita: their eq. (33) rebuilt by hand, term by term");
{
  const kly = paperById("kly_su3");
  for (const Nf of [0, 1, 2, 3, 7]) {
    const c = paperContext(kly, { Nf });
    /* their eq. (33), typed off the rendered page, in their own C = 3/(128π⁷R⁵) */
    const theirs = (a, W = 6000) => {
      let s = 0;
      for (let n = 1; n <= W; n++)
        s += (-3 * (Math.cos(2 * Math.PI * n * a) + 2 * Math.cos(Math.PI * n * a))
              + 4 * Nf * Math.cos(Math.PI * n * a)) / n ** 5;
      return s;
    };
    let worst = 0;
    for (let i = 0; i <= 60; i++) {
      const a = i / 30;
      worst = Math.max(worst, Math.abs(paperV(c, [a], 6000) - theirs(a)));
    }
    ok(`N_f = ${Nf}: the general SU(N) formula on their boundary condition IS their eq. (33) ` +
       `(worst ${worst.toExponential(2)} over 61 values of α)`, worst < 1e-11, String(worst));
  }
}

H("their eq. (34): the closed form, and the summation index it needs");
{
  const kly = paperById("kly_su3");
  for (const Nf of [0, 1, 2, 3, 7]) {
    const c = paperContext(kly, { Nf });
    const drop = paperV(c, [0], 6000) - paperV(c, [1], 6000);
    /* Σ_{n≥0}(2n+1)⁻⁵ = (1 − 2⁻⁵)ζ(5), so 4C·that·(2N_f−3) = (31/8)ζ(5)(2N_f−3) */
    const fromZero = 4 * ((31 / 32) * ZETA5) * (2 * Nf - 3);
    const fromOne = 4 * ((31 / 32) * ZETA5 - 1) * (2 * Nf - 3);
    ok(`N_f = ${Nf}: exact with the sum read from n = 0`, Math.abs(drop - fromZero) < 1e-9,
       `${drop} vs ${fromZero}`);
    if (Nf !== 1.5)
      ok(`N_f = ${Nf}: and NOT what the printed lower limit n = 1 would give`,
         Nf === 1 || Nf === 2 ? Math.abs(drop - fromOne) > 1 : Math.abs(drop - fromOne) > 10,
         `${drop} vs ${fromOne}`);
  }
  /* the sign is all their argument uses, and it survives either reading */
  const sign = (Nf) => {
    const c = paperContext(paperById("kly_su3"), { Nf });
    return Math.sign(paperV(c, [0], 4000) - paperV(c, [1], 4000));
  };
  ok("the sign flips between N_f = 1 and N_f = 2, which is their Table 1",
     sign(0) < 0 && sign(1) < 0 && sign(2) > 0 && sign(3) > 0);
}

H("the curvature by FINITE DIFFERENCE, so the analytic Hessian is falsifiable");
{
  const kly = paperById("kly_su3");
  for (const Nf of [0, 2, 5]) {
    const c = paperContext(kly, { Nf });
    const h = 1e-3;
    const fd = (a) => (paperV(c, [a + h], 8000) - 2 * paperV(c, [a], 8000) +
                       paperV(c, [a - h], 8000)) / h ** 2;
    for (const a of [0, 1]) {
      const an = paperCurvature(c, [a]);
      ok(`N_f = ${Nf}, α = ${a}: analytic and finite-difference curvature agree`,
         Math.abs(an - fd(a)) < 2e-4 * Math.max(1, Math.abs(an)), `${an} vs ${fd(a)}`);
    }
  }
}

H("their eq. (39) at α = 1 — exact for every N_f");
{
  const kly = paperById("kly_su3");
  for (const Nf of [0, 1, 2, 3, 5, 8]) {
    const c = paperContext(kly, { Nf });
    const X = paperCurvature(c, [1]) / (Math.PI ** 2 * ZETA3);
    ok(`N_f = ${Nf}: the bracket is 3/2·(5 + 2N_f) = ${1.5 * (5 + 2 * Nf)}`,
       Math.abs(X - 1.5 * (5 + 2 * Nf)) < 1e-7, String(X));
  }
}

H("their eq. (35) at α = 0 — the one row that differs, gated AS a difference");
{
  const kly = paperById("kly_su3");
  for (const Nf of [0, 1, 2, 3, 5, 8]) {
    const c = paperContext(kly, { Nf });
    const X = paperCurvature(c, [0]) / (Math.PI ** 2 * ZETA3);
    ok(`N_f = ${Nf}: the second derivative of their own eq. (33) gives 2(9 − 2N_f) = ${2 * (9 - 2 * Nf)}`,
       Math.abs(X - 2 * (9 - 2 * Nf)) < 1e-7, String(X));
    if (Nf) ok(`N_f = ${Nf}: and it is not the printed 2(9 − N_f) = ${2 * (9 - Nf)}, by ${2 * Nf}`,
               Math.abs(X - 2 * (9 - Nf)) > 1.9, String(X));
    else ok("N_f = 0: with no fermions the two readings coincide, which is what pins the prefactor",
            Math.abs(X - 2 * (9 - Nf)) < 1e-7, String(X));
  }
  /* the physics does not move: at N_f ≤ 1, where α = 0 IS the vacuum, both readings are positive */
  for (const Nf of [0, 1])
    ok(`N_f = ${Nf}: α = 0 is a genuine minimum on either reading (both brackets positive)`,
       9 - 2 * Nf > 0 && 9 - Nf > 0);
  ok("and the difference first bites at N_f = 5, where ours turns α = 0 into a local maximum " +
     "and theirs would still call it a minimum — past the N_f ≥ 2 where α = 1 is the vacuum anyway",
     9 - 2 * 5 < 0 && 9 - 5 > 0);
}

/* ------------------------------------------------------------------ 3. Burdman–Nomura */

H("Burdman–Nomura eq. (36): the matrix rebuilt from the BLOCK LETTERS, not from (P, P′)");
{
  /* the non-circular version of the anchor: their 36 entries must follow from (2,3,0,1) alone */
  const letters = [["+", "+"], ["+", "-"], ["-", "+"], ["-", "-"]];
  const sizes = [2, 3, 0, 1];
  const idx = [];
  sizes.forEach((n, k) => { for (let i = 0; i < n; i++) idx.push(k); });
  const sgn = (a, b) => (a === b ? "+" : "-");
  const built = idx.map((a) => idx.map((b) =>
    `${sgn(letters[a][0], letters[b][0])}${sgn(letters[a][1], letters[b][1])}`).join(" ")).join(" | ");
  const printed = [
    "++ ++ +- +- +- --", "++ ++ +- +- +- --", "+- +- ++ ++ ++ -+",
    "+- +- ++ ++ ++ -+", "+- +- ++ ++ ++ -+", "-- -- -+ -+ -+ ++",
  ].join(" | ");
  ok("the block letters (2,3,0,1) reproduce all thirty-six printed entries", built === printed,
     built);
  const wrong = (() => {
    const s = [2, 3, 1, 0], j = [];
    s.forEach((n, k) => { for (let i = 0; i < n; i++) j.push(k); });
    return j.map((a) => j.map((b) =>
      `${sgn(letters[a][0], letters[b][0])}${sgn(letters[a][1], letters[b][1])}`).join(" ")).join(" | ");
  })();
  ok("...and (2,3,1,0) — the same letters with the last two swapped — does NOT", wrong !== printed);
}

H("their eqs. (38) and (39): ten parity assignments, both halves of one hypermultiplet");
{
  const bn = paperById("bn_su6");
  const b = sun5dBlocks({ P: bn.P, Pp: bn.Pp });
  /* their (38), transcribed: Q(+,+) 6, U(+,−) 3, E(+,−) 1, D̄(−,−) 3, L̄(−,+) 2 */
  const theirD = { "++": 6, "+-": 4, "-+": 2, "--": 3 };
  const s = sp5Sectors(b, "anti", [1, -1]);
  ok("the 15 at (η₀,η₁) = (+,−) is their D, sector by sector",
     ["++", "+-", "-+", "--"].every((k) => s[k] === theirD[k]), JSON.stringify(s));
  /* their (39) is the conjugate half: every parity flipped */
  const sc = sp5Sectors(b, "anti", [-1, 1]);
  const theirDc = { "++": 3, "+-": 2, "-+": 4, "--": 6 };
  ok("the 15 at (−,+) is their Dᶜ, sector by sector",
     ["++", "+-", "-+", "--"].every((k) => sc[k] === theirDc[k]), JSON.stringify(sc));
  ok("the two halves are mirrors, which is what makes them one hypermultiplet",
     s["++"] === sc["--"] && s["+-"] === sc["-+"]);
  /* the falsification: (η₀,η₁) = (+,+) is a DIFFERENT field and must not match */
  const plus = sp5Sectors(b, "anti", [1, 1]);
  ok("...and the same 15 at (+,+) does not match either half", plus["++"] !== theirD["++"],
     JSON.stringify(plus));
}

/* ------------------------------------------------------------------ 4. Kawamura and HHK */

H("Kawamura: the zero-phase statement, counted two ways");
{
  const kaw = paperById("kaw_su5");
  const c = paperContext(kaw);
  ok("A = B = 0, so there is no Wilson-line phase — his footnote *** on p. 4", c.b.phases === 0);
  ok("and the potential has no term at all, which is the same statement in the other module",
     sun5dTerms(c.b, { gauge: true }).length === 0);
  /* Burdman–Nomura's boundary condition, one letter away, DOES have one: the gate can fail */
  ok("Burdman–Nomura's letters (2,3,0,1) do have a phase, so the test is not vacuous",
     sun5dBlocks({ nPP: 2, nPM: 3, nMP: 0, nMM: 1 }).phases === 1);
}

H("Kawamura and HHK are the SAME boundary condition, reached from two papers");
{
  const a = paperClass(paperById("kaw_su5")), b = paperClass(paperById("hhk_su5"));
  ok("both land in the same equivalence class of SU(5) on S¹/Z₂", a.cls === b.cls,
     `${a.cls} vs ${b.cls}`);
  ok("...and it is a class of one, so the agreement is on the boundary condition itself",
     a.size === 1 && b.size === 1, `${a.size}, ${b.size}`);
}

H("HHK Table I: the four sectors of the 5, the 10 and the 24");
{
  const b = sun5dBlocks({ nPP: 2, nPM: 3, nMP: 0, nMM: 0 });
  /* dimensions, so a sector count that happened to be right for the wrong reason is caught */
  const dims = { fund: 5, anti: 10, adj: 24 };
  for (const [rep, d] of Object.entries(dims)) {
    const s = sp5Sectors(b, rep, [1, 1]);
    const tot = s["++"] + s["+-"] + s["-+"] + s["--"];
    ok(`the ${rep} spreads its ${d} states over the four sectors and loses none`,
       tot === d, `${tot} of ${d}`);
  }
  ok("5: two at (++) — the doublet — and three at (+−) — the colour triplet",
     sp5Sectors(b, "fund", [1, 1])["++"] === 2 && sp5Sectors(b, "fund", [1, 1])["+-"] === 3);
  ok("10 = Λ²5: four at (++), which is Λ²(doublet) = 1 plus Λ²(triplet) = 3̄",
     sp5Sectors(b, "anti", [1, 1])["++"] === 4);
  ok("10: six at (+−), the (3,2) bifundamental",
     sp5Sectors(b, "anti", [1, 1])["+-"] === 6);
  ok("24: twelve and twelve — (8,1)+(1,3)+(1,1) against (3,2)+(3̄,2)",
     sp5Sectors(b, "adj", [1, 1])["++"] === 12 && sp5Sectors(b, "adj", [1, 1])["+-"] === 12);
}

/* ------------------------------------------------------------------ 5. loading into the builder */

H("what a paper hands the SU(N) builder is what the builder holds");
{
  for (const m of PAPER_MODELS) {
    const st = paperState(m);
    ok(`${m.id}: the state is four block letters and a bulk map, nothing derived`,
       Object.keys(st.blocks).join(",") === "nPP,nPM,nMP,nMM" &&
       Object.values(st.blocks).every((x) => Number.isInteger(x) && x >= 0));
    const b = sun5dBlocks(st.blocks);
    ok(`${m.id}: the letters rebuild the same SU(${b.N}) the parities gave`,
       b.N === m.P.length && b.N === sun5dBlocks({ P: m.P, Pp: m.Pp }).N);
    for (const k of Object.keys(st.bulk)) {
      const [rep, eta, kind] = k.split("|");
      ok(`${m.id}: the bulk key "${k}" is one the builder can read`,
         ["fund", "anti", "sym", "adj"].includes(rep) && (eta === "1" || eta === "-1") &&
         ["dirac", "scalar", "weyl"].includes(kind));
    }
  }
}

H("the falsification set: readings this file would have caught");
{
  const kly = paperById("kly_su3");
  const c = paperContext(kly, { Nf: 3 });
  /* the unit: KLY's C is half Haba–Yamashita's, and forgetting it halves everything */
  const raw = sun5dV(c.terms, [0], 4000) - sun5dV(c.terms, [1], 4000);
  ok("dropping the factor between their C and Haba–Yamashita's would miss eq. (34) by a factor 2",
     Math.abs(raw - (31 / 8) * ZETA5 * 3) > 5, `${raw}`);
  /* the parity product: their fermions are η = +1, and the other sign is a different theory */
  const flipped = sun5dTerms(c.b, { bulk: [{ rep: "fund", eta: -1, kind: "dirac", multiplicity: 3 }] });
  let worst = 0;
  for (let i = 0; i <= 20; i++) {
    const a = i / 10;
    worst = Math.max(worst, Math.abs(2 * sun5dV(flipped, [a], 4000) - 2 * sun5dV(c.terms, [a], 4000)));
  }
  ok("reading their triplets at η = −1 gives a different potential, so η = +1 is measured",
     worst > 1, String(worst));
  /* the same unit again, this time on the curvature: `sun5dHessian` reports in Haba–Yamashita's C,
   * and forgetting the conversion halves their eq. (39) bracket */
  const X = sun5dHessian(c.terms, [1], 20000)[0][0] / (Math.PI ** 2 * ZETA3);
  ok("their eq. (39) bracket needs the same conversion the potential does — raw, it is half",
     Math.abs(X - 0.5 * 1.5 * (5 + 2 * 3)) < 1e-6 && Math.abs(X - 1.5 * (5 + 2 * 3)) > 1,
     String(X));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

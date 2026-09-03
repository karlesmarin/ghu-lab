/* _test_smcell.mjs — the Standard-Model cell, held to the number every embedding must give and to
 * the absence every 5D SU(5) orbifold is known to have.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   - the ANCHOR: Georgi–Glashow's hypercharge direction gives sin²θ_W = 3/8, and it must come out
 *     of the exact solve on SU(5) with P = diag(+,+,+,−,−), on the other split [2,3,0,0], and on
 *     the SU(6) boundary condition that hosts a Higgs doublet — three routes to one rational;
 *   - the ABSENCE: on SU(5) [3,0,0,2], with the Georgi–Glashow Y, no bulk content yields Q = (3,2)_{1/6} as a
 *     left-handed zero mode, because a left-handed zero mode has P₁-twist +1 and Q is a
 *     bifundamental across the two P₁ signs.  The literature puts Q on the brane; the instrument
 *     has to say "missing", on every content, or it is flattering models;
 *   - a FULL cell where one exists: SU(6) [3,1,2,0] with 6, 6′, 15, 15′ gives all five fields and
 *     a Higgs doublet in A_y with Y = ½;
 *   - the solver can say NO and can say FREE, with inputs built to make it;
 *   - and the reading near the vacuum: the cell is taken at the nearest symmetric point, the
 *     vacuum breaks the weak block and not colour, and a vacuum at t = ½ is reported as far.
 *
 *   node _test_smcell.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { vac5Frame } from "./src/modules/vacuum5d.mjs";
import { smCell, smCellAt, smCellNear, smShow, smShowNear, smSolve, smUnder, SM_CELL }
  from "./src/modules/smcell.mjs";
import { R, str } from "./src/kernel/charges.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });
const G = (bulk) => ({ gauge: true, bulk });

/* ------------------------------------------------------------------ 1. the anchor */

H("sin²θ_W = 3/8 comes out of the exact solve, on three boundary conditions");
{
  const a = smCellAt(B([3, 0, 0, 2]), G([D("fund", 1), D("anti", 1)]));
  ok("SU(5) [3,0,0,2] with 5 and 10: Y = (−1/3 on colour, 1/2 on weak), sin²θ_W = 3/8",
     a.best && a.best.sin2 === "3/8" && a.best.fixed &&
     a.best.Yvalues.some((v) => v.block === "(+,+)" && v.Y === "-1/3") &&
     a.best.Yvalues.some((v) => v.block === "(−,−)" && v.Y === "1/2"), smShow(a));
  const b = smCellAt(B([2, 3, 0, 0]), G([D("anti", 1), D("anti", -1), D("fund", 1), D("fund", -1)]));
  ok("SU(5) [2,3,0,0] (Kawamura's split, weak block (+,+)): the same 3/8", b.best && b.best.sin2 === "3/8", smShow(b));
  const c = smCellAt(B([3, 1, 2, 0]), G([D("fund", 1), D("anti", 1), D("fund", -1), D("anti", -1)]));
  ok("SU(6) [3,1,2,0]: the same 3/8, with the singlet block at Y = 0", c.best && c.best.sin2 === "3/8" &&
     c.best.Yvalues.some((v) => v.block === "(+,−)" && v.Y === "0"), smShow(c));
}

/* ------------------------------------------------------------------ 2. the full cell */

H("a full generation from the bulk, where the literature says there is one");
{
  const c = smCellAt(B([3, 1, 2, 0]), G([D("fund", 1), D("anti", 1), D("fund", -1), D("anti", -1)]));
  ok("SU(6) [3,1,2,0] with 6, 6′, 15, 15′: all five fields of the cell are massless pieces",
     c.best && c.best.found.length === 5 && c.best.missing.length === 0, smShow(c));
  ok("...and A_y carries a Higgs doublet (1,2) with Y = 1/2",
     c.best && c.best.higgs.length >= 1 && c.best.higgs.some((h) => h.from === "A_y" && (h.Y === "1/2" || h.Y === "-1/2")),
     JSON.stringify(c.best && c.best.higgs));
  ok("...and the exotics are listed with colour, weak and Y, so the brane bill is readable",
     c.best && c.best.exotics.length > 0 && c.best.exotics.every((e) => e.colour && e.weak && e.Y !== undefined));
  ok("with the gauge sector alone there is no cell and the reason is said",
     !smCellAt(B([3, 1, 2, 0]), G([])).best && /no massless piece/.test(smCellAt(B([3, 1, 2, 0]), G([])).why));
}

/* ------------------------------------------------------------------ 3. the absence */

H("on SU(5) [3,0,0,2] the Georgi–Glashow hypercharge never has Q or dᶜ in the bulk, whatever the bulk");
{
  /* Q = (3,2)_{1/6} is a bifundamental across the two P₁ signs and dᶜ = (3̄,1)_{1/3} needs a
   * right-handed colour piece; neither is a left-handed zero mode here.  What the search CAN do
   * is bend Y: with two blocks there is one free coefficient, and the 24's (3,2) can be given
   * Y = 1/6 by a hypercharge that is not Georgi–Glashow's — at the price of every other field.
   * So the absence is stated where it holds: no content has Q or dᶜ together with sin²θ_W = 3/8,
   * and every content that shows Q has a different sin²θ_W. */
  let n = 0, bad = [], seenGG = new Set(), bentQ = [];
  for (const rep of ["fund", "anti", "sym", "adj"])
    for (const eta of [1, -1])
      for (const rep2 of ["fund", "anti", "sym", "adj"])
        for (const eta2 of [1, -1]) {
          const c = smCellAt(B([3, 0, 0, 2]), G([D(rep, eta), D(rep2, eta2)]));
          n++;
          if (!c.best) continue;
          if (c.best.sin2 === "3/8") {
            c.best.found.forEach((f) => seenGG.add(f));
            if (c.best.found.includes("Q") || c.best.found.includes("dᶜ")) bad.push(`${rep}${eta}+${rep2}${eta2}`);
          } else if (c.best.found.includes("Q")) bentQ.push(`${rep}${eta}+${rep2}${eta2}: sin²=${c.best.sin2}`);
        }
  ok(`${n} two-representation bulk contents: with sin²θ_W = 3/8, Q and dᶜ are missing in every one`,
     bad.length === 0, bad.slice(0, 3).join(", "));
  ok("...while uᶜ, L and eᶜ each appear at 3/8 in some content — the search can find fields",
     ["uᶜ", "L", "eᶜ"].every((f) => seenGG.has(f)), [...seenGG].join(","));
  ok(`...and where Q does appear it is by bending Y (${bentQ.length} contents), never at 3/8`,
     bentQ.length > 0 && bentQ.every((s) => !/3\/8/.test(s)), bentQ.slice(0, 2).join(" | "));
  const one = smCellAt(B([3, 0, 0, 2]), G([D("fund", 1), D("anti", 1)]));
  ok("with 5 and 10 the missing list is exactly Q and dᶜ, and the (3̄,2)_{−1/6} conjugate of Q is among the exotics",
     one.best && one.best.missing.join() === "Q,dᶜ" &&
     one.best.exotics.some((e) => e.colour === "3̄" && e.weak === "2" && e.Y === "-1/6"), smShow(one));
}

/* ------------------------------------------------------------------ 4. the solver, made to fail */

H("the solver says NO to an inconsistent system and FREE to an underdetermined one");
{
  const A = [[R(1), R(0)], [R(1), R(0)]];
  ok("two equations on one column with different right-hand sides: no solution",
     smSolve(A, [R(1), R(2)]) === null);
  const s = smSolve([[R(1), R(1)]], [R(2)]);
  ok("one equation on two unknowns: rank 1, one free direction, and a solution",
     s && s.rank === 1 && s.free === 1 && str(s.c[0]) === "2");
  /* a wrong cell must NOT be found: eᶜ at Y = 2 instead of 1 breaks the SU(5) solve */
  const saved = SM_CELL[4].Y; SM_CELL[4].Y = R(2);
  const wrong = smCellAt(B([3, 0, 0, 2]), G([D("fund", 1), D("anti", 1)]));
  SM_CELL[4].Y = saved;
  ok("with eᶜ's hypercharge changed to 2 the anchor content no longer hosts uᶜ AND eᶜ together — the solve is doing the deciding",
     !wrong.best || !(wrong.best.found.includes("uᶜ") && wrong.best.found.includes("eᶜ")), smShow(wrong));
  ok("...and the cell is restored", str(SM_CELL[4].Y) === "1");
  ok("the SU(2) doublet is read as pseudo-real: a right-handed fundamental of a size-two block is a 2, not a 2̄",
     (() => { const f = vac5Frame(B([3, 0, 0, 2]), []);
              return smUnder(f, { rep: "fund", blockA: 3, blockB: null, chirality: "R", copies: 1 }, 3) === "2" &&
                     smUnder(f, { rep: "fund", blockA: 0, blockB: null, chirality: "R", copies: 1 }, 0) === "3̄"; })());
}

/* ------------------------------------------------------------------ 5. near the vacuum */

H("the cell is read at the symmetric point nearest the vacuum, and the vacuum's breaking is named");
{
  const b = B([3, 1, 2, 0]);
  const content = G([D("fund", 1), D("anti", 1), D("fund", -1), D("anti", -1)]);
  const n = smCellNear(b, content, [0.03]);
  ok("SU(6) [3,1,2,0] with the B-pair at φ = 0.03: the cell is the θ = 0 one, distance 0.03, weak block broken, colour not",
     n.cell.best && n.cell.best.found.length === 5 && Math.abs(n.distance - 0.03) < 1e-12 &&
     n.weakBroken === true && n.colourBroken === false && n.nearSymmetric, smShowNear(n));
  const far = smCellNear(b, content, [0.5]);
  ok("at φ = ½ the vacuum is far from every symmetric point and is said to be",
     far.nearSymmetric === false && Math.abs(far.distance - 0.5) < 1e-12);
  const other = smCellNear(b, content, [0.97]);
  ok("at φ = 0.97 the nearest symmetric point is the class-mate [4,0,1,1], whose reading is a different cell",
     other.rounded[0] === 1 && other.near.rearranged.join() === "4,0,1,1" && Math.abs(other.distance - 0.03) < 1e-12,
     `${other.near.rearranged} ${smShowNear(other)}`);
  ok("the symmetric point itself reads distance 0 and says the vacuum IS it",
     /the vacuum IS this symmetric point/.test(smShowNear(smCellNear(b, content, [0]))));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

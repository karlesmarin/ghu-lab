/* _test_sweep5d.mjs — the sweep: the funnel, the filters, and the double-counting it prevents.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A sweep is a composition of four modules that are each already tested, so what is left to check
 * is the composition itself:
 *
 *   - the funnel is MONOTONE — no stage can keep more than the one before it, and a sweep with no
 *     filters must keep everything;
 *   - each filter is exhibited both ways: something it keeps and something it throws out.  A
 *     filter that never rejects is not a filter, and a filter that rejects everything is a bug
 *     that looks like a strong result;
 *   - the structural filters agree with what the other modules say about the same model, so the
 *     sweep cannot be filtering on a quantity of its own;
 *   - and the survivors carry their equivalence class, which is what stops a list of boundary
 *     conditions being read as a list of theories.
 *
 *   node _test_sweep5d.mjs
 */
import { sun5dBlocks, sun5dUnbroken, sun5dTerms, sun5dMinimum } from "./src/modules/sun5d.mjs";
import { bcClasses } from "./src/modules/bcclass.mjs";
import { sp5ZeroModes } from "./src/modules/spectrum5d.mjs";
import { an5Ledger } from "./src/modules/anomaly5d.mjs";
import { sweep5d, sweepContents, sweepHasFactors, sweepHiggs, sweepShowContent, SWEEP_SLOTS }
  from "./src/modules/sweep5d.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });

/* ------------------------------------------------------------------ 1. the enumeration */

H("the content enumeration is the compositions of at most M over eight slots");
{
  const c1 = sweepContents(1), c2 = sweepContents(2), c3 = sweepContents(3);
  ok(`M = 1: ${c1.length} contents, one per slot`, c1.length === 8);
  /* C(M+8,8) − 1: the compositions of at most M over 8 slots, minus the empty one */
  const binom = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
  ok(`M = 2: ${c2.length} = C(10,8) − 1`, c2.length === binom(10, 8) - 1);
  ok(`M = 3: ${c3.length} = C(11,8) − 1`, c3.length === binom(11, 8) - 1);
  ok("every content is non-empty and within budget",
     c3.every((v) => v.some((x) => x) && v.reduce((a, x) => a + x, 0) <= 3));
  ok("and they are distinct", new Set(c3.map((v) => v.join(","))).size === c3.length);
  ok("the eight slots are four representations × two parity products, in that order",
     SWEEP_SLOTS.map((s) => `${s.rep}${s.eta > 0 ? "+" : "−"}`).join(" ") ===
     "fund+ fund− anti+ anti− sym+ sym− adj+ adj−");
  ok("printed the way a reader would type it",
     sweepShowContent([2, 0, 0, 0, 1, 0, 0, 0]) === "2×fund(+) + sym(+)",
     sweepShowContent([2, 0, 0, 0, 1, 0, 0, 0]));
}

/* ------------------------------------------------------------------ 2. the filters, both ways */

H("each filter keeps something and throws something out");
{
  ok("SU(3)×SU(2): [3,0,0,2] passes and [4,0,0,1] does not",
     sweepHasFactors(B([3, 0, 0, 2]), [3, 2]) && !sweepHasFactors(B([4, 0, 0, 1]), [3, 2]));
  ok("...and asking for two SU(3)s needs two blocks, not one used twice",
     sweepHasFactors(B([3, 3, 0, 0]), [3, 3]) && !sweepHasFactors(B([3, 0, 0, 2]), [3, 3]));
  /* the Higgs: a (1,2) pair is a colourless doublet, a (3,2) pair is the coloured one */
  ok("[1,0,0,2]: the A_y zero modes are a COLOURLESS doublet — blocks of size 1 and 2 are paired",
     sweepHiggs(B([1, 0, 0, 2])).colourless);
  ok("[3,0,0,2]: they are a COLOURED doublet, which is the thing orbifold GUTs exist to avoid",
     !sweepHiggs(B([3, 0, 0, 2])).colourless && sweepHiggs(B([3, 0, 0, 2])).coloured);
  ok("[5,0,0,0]: no pair at all, so no Higgs candidate",
     !sweepHiggs(B([5, 0, 0, 0])).colourless && !sweepHiggs(B([5, 0, 0, 0])).coloured);
  /* and the Higgs count must agree with the spectrum module, which reaches it another way */
  let agree = true;
  for (const spec of [[1, 0, 0, 2], [3, 0, 0, 2], [5, 0, 0, 0], [1, 3, 0, 2], [2, 1, 3, 1]]) {
    const b = B(spec), h = sweepHiggs(b), s = sp5ZeroModes(b, {}).scalars;
    agree &&= (h.colourless || h.coloured) === (s > 0);
  }
  ok("a Higgs candidate exists exactly when the spectrum module finds massless scalars", agree);
}

/* ------------------------------------------------------------------ 3. the funnel */

H("the funnel is monotone, and an unfiltered sweep keeps everything");
{
  const wide = sweep5d({ N: 5, maxMult: 1 });
  ok(`no filters: ${wide.stages[0].kept} pairs in, ${wide.total} out — everything survives`,
     wide.total === wide.nBC * wide.nContents,
     `${wide.total} vs ${wide.nBC} × ${wide.nContents}`);
  ok("and every stage keeps at most what the stage before it kept",
     wide.stages.every((s, i) => i === 0 || s.kept <= wide.stages[i - 1].kept),
     JSON.stringify(wide.stages.map((s) => s.kept)));
  /* THE DEFAULT MUST NOT FILTER.  The first version of this defaulted to needHiggs "any", which
   * reads like "don't care" and means "must have one": it threw away two thirds of the space and
   * still printed the full denominator at stage zero.  The two runs must differ. */
  const anyH = sweep5d({ N: 5, maxMult: 1, needHiggs: "any" });
  ok(`the default asks for no Higgs (${wide.total}) and "any" does ask (${anyH.total})`,
     anyH.total < wide.total);
  ok('...and "colourless" asks for strictly more than "any"',
     sweep5d({ N: 5, maxMult: 1, needHiggs: "colourless" }).total < anyH.total);

  const narrow = sweep5d({ N: 5, maxMult: 2, want: [3, 2], needHiggs: "any",
                           needChiral: true, needAnomalyFree: true });
  ok("with every filter on, the funnel is still monotone",
     narrow.stages.every((s, i) => i === 0 || s.kept <= narrow.stages[i - 1].kept),
     JSON.stringify(narrow.stages.map((s) => [s.name, s.kept])));
  ok(`and it narrows: ${narrow.stages[0].kept} → ${narrow.total}`,
     narrow.total < narrow.stages[0].kept);
  console.log("     " + narrow.stages.map((s) => `${s.name}: ${s.kept}`).join("\n     "));
}

/* ------------------------------------------------------------------ 4. it filters on the truth */

H("the sweep's verdicts are the other modules' verdicts, not a second opinion");
{
  const r = sweep5d({ N: 5, maxMult: 2, want: [3, 2] });
  let bad = 0, n = 0;
  for (const x of r.survivors.slice(0, 60)) {
    n++;
    const A = an5Ledger(x.b, x.content);
    const Z = sp5ZeroModes(x.b, x.content);
    if (A.offending.length !== x.owing) bad++;
    if (Z.fermions !== x.fermions) bad++;
    if (!sweepHasFactors(x.b, [3, 2])) bad++;
  }
  ok(`${n} survivors re-checked against the anomaly and spectrum modules directly: ${bad} disagree`,
     bad === 0);
  ok("every survivor really does carry SU(3) × SU(2) in its unbroken group",
     r.survivors.every((x) => /SU\(3\)/.test(sun5dUnbroken(x.b)) &&
                             /SU\(2\)/.test(sun5dUnbroken(x.b))),
     r.survivors.slice(0, 2).map((x) => sun5dUnbroken(x.b)).join(" | "));
}

/* ------------------------------------------------------------------ 5. the double-counting */

H("THE SURVIVORS ARE FEWER THEORIES THAN THEY LOOK — which is what the class tag is for");
{
  const r = sweep5d({ N: 5, maxMult: 1, want: [3, 2] });
  ok(`${r.total} surviving (boundary condition, content) pairs sit in ${r.classesLeft} ` +
     `equivalence classes`, r.classesLeft <= r.total);
  ok("...and strictly fewer, so the tag is not decoration", r.classesLeft < r.total);
  /* the class ids are the real ones */
  const C = bcClasses(5, "S1/Z2");
  ok("every survivor's class id is the one bcclass gives for its boundary condition",
     r.survivors.every((x) => x.cls === C.of(x.m)));
  /* and the apparent group is NOT a class invariant, which is why the sweep walks boundary
   * conditions and not classes */
  const cl = C.classes[C.of([2, 0, 0, 3])];
  ok("the group is not a class invariant — [2,0,0,3]'s own class shows three different ones, " +
     "so sweeping over classes would have to pick one and would be picking an answer",
     new Set(cl.members.map((m) => sun5dUnbroken(B(m)))).size === 3);
}

/* ------------------------------------------------------------------ 6. the expensive stage */

H("the vacuum stage runs last, is capped, and says when it was capped");
{
  const r = sweep5d({ N: 5, maxMult: 1, want: [3, 2], needChiral: true, needBreaking: true,
                      capVacuum: 5 });
  const last = r.stages[r.stages.length - 1];
  ok(`the vacuum is the last stage and it names how many it actually minimised (${last.checked})`,
     last.name.includes("Wilson line") && typeof last.checked === "number");
  ok("and it declares the cap rather than reporting a short list as a complete one",
     last.checked <= 5 && (last.capped === true || last.checked < 5),
     JSON.stringify(last));
  const full = sweep5d({ N: 5, maxMult: 1, want: [3, 2], needChiral: true, needBreaking: true });
  ok(`uncapped, it minimises ${full.stages[full.stages.length - 1].checked} and reports ` +
     `${full.total} survivors`, full.stages[full.stages.length - 1].capped !== true);
  ok("a capped run cannot claim more survivors than an uncapped one", r.total <= full.total);
}

/* ------------------------------------------------------------------ 6b. undecided is not "no" */

H("AN UNDECIDED VACUUM IS NOT A NO — the minimiser handles one phase and two, no more");
{
  /* three phases exist: [2,1,1,2] on SU(6) has min(2,2) + min(1,1) = 3 */
  const b3 = B([2, 1, 1, 2]);
  ok("SU(6) [2,1,1,2] really does carry three phases", b3.phases === 3);
  ok("...and the minimiser declines it rather than answering",
     sun5dMinimum(sun5dTerms(b3, { bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 1 }] }),
                  b3.phases) === null);
  const r = sweep5d({ N: 6, maxMult: 1, needBreaking: true, capVacuum: 99999 });
  const last = r.stages[r.stages.length - 1];
  ok(`the sweep counts them apart: ${last.undecided} undecided, ${last.checked} actually minimised`,
     last.undecided > 0 && last.checked > 0, JSON.stringify(last));
  ok("and a budget cut counts as undecided too, not as a rejection",
     sweep5d({ N: 6, maxMult: 1, needBreaking: true, capVacuum: 10 })
       .stages.at(-1).undecided > last.undecided);
}

/* ------------------------------------------------------------------ 6c. the grid is not the answer */

H("the breaking verdict is a property of the potential, not of the grid we sampled it on");
{
  let n = 0, flips = 0;
  for (const m of [[3, 0, 0, 2], [2, 0, 0, 3], [1, 0, 0, 2], [3, 1, 0, 1], [4, 0, 0, 1], [2, 1, 0, 2]])
    for (const c of [{ rep: "fund", eta: 1 }, { rep: "adj", eta: 1 }, { rep: "sym", eta: -1 },
                     { rep: "anti", eta: 1 }]) {
      const b = B(m);
      if (!b.phases || b.phases > 2) continue;
      const terms = sun5dTerms(b, { bulk: [{ ...c, kind: "dirac", multiplicity: 1 }] });
      if (!terms.length) continue;
      n++;
      const v = [144, 360, 900].map((g) => sun5dMinimum(terms, b.phases, { grid: g }).atEdge);
      if (new Set(v).size > 1) flips++;
    }
  ok(`${n} potentials minimised at three grid resolutions: ${flips} verdicts change`,
     n > 10 && flips === 0);
}

/* ------------------------------------------------------------------ 6d. every filter fires */

H("EVERY FILTER KEEPS SOMETHING — a filter that is always empty is a bug wearing a result's coat");
{
  const base = sweep5d({ N: 5, maxMult: 2 }).total;
  for (const [tag, opt] of [
    ["a colourless Higgs", { needHiggs: "colourless" }],
    ["chiral", { needChiral: true }],
    ["anomaly-free on the bulk", { needAnomalyFree: true }],
    ["the Wilson line breaks it", { needBreaking: true }],
  ]) {
    const r = sweep5d({ N: 5, maxMult: 2, ...opt });
    ok(`${tag}: keeps ${r.total} of ${base} — neither everything nor nothing`,
       r.total > 0 && r.total < base);
  }
  /* AND WHAT THE CONJUNCTION SAYS ABOUT SU(5) IS THE ACTUAL PHYSICS, so it is asserted rather
   * than admired.  Asking for the Standard Model group, a chiral spectrum and a bulk that pays
   * its own anomaly leaves 36 pairs — and EVERY ONE of them is an adjoint content with no
   * massless scalar at all.  Which is the theorem from the anomaly module read backwards: the
   * adjoint is real, so at two multiplets it is the only thing that can settle its own bill. */
  const four = sweep5d({ N: 5, maxMult: 2, want: [3, 2], needChiral: true, needAnomalyFree: true });
  ok(`SU(5), four filters: ${four.total} pairs in ${four.classesLeft} classes survive`,
     four.total > 0);
  ok("...and every survivor is a pure adjoint content — the only bulk that pays its own anomaly",
     four.survivors.every((x) => x.vec[6] + x.vec[7] === x.vec.reduce((a, y) => a + y, 0)),
     four.survivors.slice(0, 3).map((x) => sweepShowContent(x.vec)).join(" | "));
  ok("...so not one of them has a Higgs, and asking for one empties SU(5) completely",
     four.survivors.every((x) => x.scalars === 0) &&
     sweep5d({ N: 5, maxMult: 2, want: [3, 2], needHiggs: "any", needChiral: true,
               needAnomalyFree: true }).total === 0);
  /* a colourless Higgs dies one stage earlier, and for a reason you can say in one line: a 3 and
   * a 2 already use up all of SU(5), so no block of size 1 is left to pair with the doublet */
  ok("a COLOURLESS Higgs dies at the boundary condition itself — 3 + 2 exhausts SU(5)",
     sweep5d({ N: 5, maxMult: 2, want: [3, 2], needHiggs: "colourless" }).stages[1].kept === 0);
  /* AND THE EMPTINESS IS ABOUT SU(5), NOT ABOUT THE SWEEP.  One rank higher, all five filters at
   * once leave survivors — so the zero above is a statement and not a stuck gate. */
  const six = sweep5d({ N: 6, maxMult: 2, want: [3, 2], needHiggs: "any", needChiral: true,
                        needAnomalyFree: true, needBreaking: true, capVacuum: 99999 });
  ok(`all five filters at once on SU(6): ${six.total} pairs in ${six.classesLeft} classes — the ` +
     `emptiness at SU(5) is about SU(5)`, six.total > 0);
}

/* ------------------------------------------------------------------ 7. it can come back empty */

H("and it can come back EMPTY, which a sweep that always finds something could not");
{
  const none = sweep5d({ N: 4, maxMult: 1, want: [3, 3] });
  ok("SU(4) cannot carry two SU(3) factors, so the sweep returns nothing", none.total === 0);
  ok("...and the funnel says where they died: at the first stage",
     none.stages[1].kept === 0, JSON.stringify(none.stages.map((s) => s.kept)));
  const some = sweep5d({ N: 6, maxMult: 1, want: [3, 3] });
  ok("SU(6) can, and does — so the emptiness above is about the group and not about the filter",
     some.total > 0);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

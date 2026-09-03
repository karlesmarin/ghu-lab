/* _test_dossier.mjs — the composed tool, and the controls that keep its TAG honest.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The claim this module makes is not a number, it is a CLASSIFICATION: this line is a property of
 * the theory, that one is a property of the frame.  A classifier that answered "invariant" to
 * everything would look right on a page and be worthless, so the checks here are shaped against
 * that:
 *
 *   - both tags must OCCUR, and on named lines, at three different N;
 *   - a DECOY that is a function of the representative alone must come back `gauge`, and one that
 *     is a function of the class alone must come back `invariant` — the tagger is given two lines
 *     whose answers are known before it runs;
 *   - the lines tagged invariant must stay invariant at N = 4…7, because a coincidence at one N
 *     is how a false invariant survives;
 *   - and the third axis has to bite: N and N₀ separate no theory from any other, and a line that
 *     separates nothing must not be sold as an invariant.
 *
 *   node _test_dossier.mjs
 */
import { DOSSIER_LINES, dossierContext, dossierForClass, dossierSeparation }
  from "./src/modules/dossier.mjs";
import { bcClasses } from "./src/modules/bcclass.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const FUND = { gauge: true, bulk: [{ rep: "fund", eta: +1, kind: "dirac", multiplicity: 1 }] };
const FAST = { grid: 120, windings: 120 };

/* ------------------------------------------------------------------ 1. the composition runs */

H("one boundary condition, every verdict — and the chain is total or says why not");
{
  const d = dossierForClass([1, 0, 4, 1], FUND, FAST);
  ok("SU(6) [1,0,4,1] lands in a class and the class is the one bcclass computes",
     d.N === 6 && d.members.some((m) => m.join() === "1,0,4,1") &&
     d.classId === bcClasses(6, "S1/Z2").of([1, 0, 4, 1]));
  ok("every declared line produced a tag, and none was left undefined",
     d.lines.length === DOSSIER_LINES.length &&
     d.lines.every((l) => ["invariant", "gauge", "declined"].includes(l.tag)));
  ok("a line that the whole class declines is `declined`, not silently invariant",
     (() => { const nowl = dossierForClass([6, 0, 0, 0], FUND, FAST);
              const w = nowl.lines.find((l) => l.key === "W");
              return w.tag === "declined" && w.value === null; })());
  ok("...and the reason is carried, not left for the reader to guess",
     /no Wilson line to bridge/.test(dossierForClass([6, 0, 0, 0], FUND, FAST).refused.bridge));
}

/* ------------------------------------------------------------------ 2. both tags occur */

H("both tags occur, on named lines, and at three different N");
{
  for (const [N, bc] of [[5, [1, 0, 3, 1]], [6, [1, 0, 4, 1]], [7, [1, 1, 4, 1]]]) {
    const d = dossierForClass(bc, FUND, FAST);
    const tag = (k) => d.lines.find((l) => l.key === k).tag;
    ok(`SU(${N}) [${bc}]: the phase count and N_Δ are invariant on the class`,
       tag("phases") === "invariant" && tag("Nd") === "invariant", `${tag("phases")}/${tag("Nd")}`);
    ok(`SU(${N}) [${bc}]: the apparent group and the massless fermions are NOT`,
       tag("unbroken") === "gauge" && tag("fermions") === "gauge",
       `${tag("unbroken")}/${tag("fermions")}`);
  }
}

/* ---------------------------------------------------------- 3. the decoys, whose answers are known
 *
 * A CONTROL THAT CAN FAIL.  Two lines are handed to the same tagger with the answer settled in
 * advance: p is a coordinate of the representative and moves under [p,q,r,s] ~ [p−1,q+1,r+1,s−1];
 * p − s is what that move preserves and is the class invariant Boundary conditions is drawn on.
 * A tagger that always said "invariant", or that read a hard-coded list of keys, fails one of
 * these two on the first run. */

H("two decoy lines whose tags are known before the tagger runs");
{
  const SAVED = DOSSIER_LINES.slice();
  DOSSIER_LINES.push(
    { key: "_decoyRep", group: "control", label: "p, a coordinate of the representative",
      cite: "control", get: (c) => String(c.bc[0]) },
    { key: "_decoyCls", group: "control", label: "p − s, which the class relation preserves",
      cite: "control", get: (c) => String(c.bc[0] - c.bc[3]) });
  let bad = [];
  for (const [N, bc] of [[5, [1, 0, 3, 1]], [6, [1, 0, 4, 1]], [7, [1, 1, 4, 1]]]) {
    const d = dossierForClass(bc, FUND, FAST);
    const t = (k) => d.lines.find((l) => l.key === k).tag;
    if (t("_decoyRep") !== "gauge") bad.push(`SU(${N}) rep-decoy came back ${t("_decoyRep")}`);
    if (t("_decoyCls") !== "invariant") bad.push(`SU(${N}) class-decoy came back ${t("_decoyCls")}`);
  }
  ok("p is tagged gauge and p − s is tagged invariant, at every N tried", bad.length === 0,
     bad.join("; "));
  DOSSIER_LINES.length = 0;
  DOSSIER_LINES.push(...SAVED);
  ok("...and the decoys are removed again, so the page never sees them",
     !DOSSIER_LINES.some((l) => l.key.startsWith("_decoy")));
}

/* ------------------------------------------- 4. an invariant at one N is not an invariant */

H("the invariant lines stay invariant over EVERY class at N = 4…7");
{
  const claimed = ["phases", "nterms", "vmin", "edge", "Nd"];
  const broken = [];
  for (let N = 4; N <= 7; N++) {
    const C = bcClasses(N, "S1/Z2");
    for (const cl of C.classes) {
      if (cl.size < 2) continue;
      const d = dossierForClass(cl.members[0], FUND, FAST);
      for (const k of claimed) {
        const l = d.lines.find((x) => x.key === k);
        if (l.tag === "gauge") broken.push(`SU(${N}) [${cl.members[0]}] ${k}`);
      }
    }
  }
  ok("phases, #terms, the depth of the vacuum, whether it sits at a symmetric point, and N_Δ",
     broken.length === 0, broken.slice(0, 4).join("; "));
}

/* ---------------------------------------------- 5. the third axis: separating nothing */

H("a line that is the same for every class separates nothing, and is not sold as an invariant");
{
  const S = dossierSeparation(6, FUND, FAST);
  const line = (k) => S.lines.find((l) => l.key === k);
  ok("SU(6): 84 boundary conditions, 49 classes, 25 of them with more than one member",
     S.nBC === 84 && S.nClasses === 49 && S.multi === 25,
     `${S.nBC}/${S.nClasses}/${S.multi}`);
  ok("N₀ takes ONE value over all 49 classes, so it is tagged `separates nothing`",
     line("N0").distinctBetween === 1 && line("N0").tag === "separates nothing");
  ok("the depth of the vacuum takes many, and is tagged invariant",
     line("vmin").distinctBetween > 1 && line("vmin").tag === "invariant",
     `${line("vmin").distinctBetween} values`);
  ok("the apparent group splits inside classes, so the split axis wins the tag",
     line("unbroken").splitsWithin > 0 && line("unbroken").tag === "gauge");
  ok("and the two axes are independent: a gauge line still takes many values between classes",
     line("unbroken").distinctBetween > 1, `${line("unbroken").distinctBetween}`);
}

/* ------------------------------------------------------------------ 6. the anomaly flip, kept */

H("the flip that found the empty-sum verdict, kept as a regression");
{
  const d = dossierForClass([0, 1, 4, 0], FUND, FAST);
  const an = d.lines.find((l) => l.key === "anomaly");
  ok("SU(5) [0,1,4,0] ~ [1,0,3,1]: the anomaly VERDICT differs across the class",
     an.tag === "gauge" && an.distinct.includes("no subject") && an.distinct.includes("owes"),
     an.distinct.join(" / "));
  ok("...and neither member claims `cancels`, which is what the old `clean` flag did",
     !an.distinct.includes("cancels"));
}

/* ------------------------------------------------------------------ 7. cost */

H("cost, because a panel that spends seconds on every repaint is a panel people avoid");
{
  const t0 = Date.now();
  for (const bc of bcClasses(6, "S1/Z2").all.slice(0, 20)) dossierContext(bc, FUND, FAST);
  const per = (Date.now() - t0) / 20;
  ok(`one dossier costs ${per.toFixed(1)} ms — under 25`, per < 25);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

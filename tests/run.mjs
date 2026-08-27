/* run.mjs — hold the SHIPPED page to an engine that shares no line of code with it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *     node tests/run.mjs            (from the repository root; needs node >= 18, nothing else)
 *
 * WHAT THIS IS.  `app/index.html` is one self-contained file: data, kernel, sections and shell
 * inlined.  This runner opens that file, pulls the engine out of it, evaluates it in a bare node
 * scope with no DOM, and compares what it computes against `reference_models.json` -- numbers
 * produced by the PYTHON engine of Part VII (`amin_closed_form.py`, itself extracting the term
 * tables from Part VI's `su7_anchor_mh.py`).  Two implementations, one set of numbers.
 *
 * WHY IT LIVES HERE.  The instrument is built from a source tree with sixteen harnesses; from
 * outside the deployed repository none of that is visible, and a guard nobody can see is a guard
 * nobody believes.  So the artifact carries its own falsification: anyone can clone this and run
 * it against the page they were served.
 *
 * WHAT IT IS CAPABLE OF CATCHING -- and did, on 2026-08-26.  The `audit counterexample` row has
 * W > 0, so the symmetric-point criterion passes, and its small-alpha branch is NOT the deepest
 * point of F.  The page called that a "true vacuum" under a THEOREM label until an outside audit
 * built exactly this content.  The check below fails on that behaviour and passes on the fix.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = readFileSync(path.join(HERE, "..", "app", "index.html"), "utf8");
const REF = JSON.parse(readFileSync(path.join(HERE, "reference_models.json"), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

/* ---- pull the engine out of the shipped file ------------------------------------------------ */
const PRE = "const DATASETS = ";
const dataLine = PAGE.split("\n").find((l) => l.trim().startsWith(PRE));
if (!dataLine) { console.error("the page carries no inline data: is this app/index.html?"); process.exit(2); }
const DATASETS = JSON.parse(dataLine.trim().slice(PRE.length).replace(/;\s*$/, ""));
const i0 = PAGE.indexOf("const VERSION = ");
const i1 = PAGE.indexOf("/* ---- hierarchy_section.js ---- */");
if (i0 < 0 || i1 < i0) { console.error("the engine block is not where it should be"); process.exit(2); }
const ENGINE = PAGE.slice(i0, i1);
const api = new Function("DATASETS", ENGINE +
  `; return { complete, resolve, modules, termTable, moments, numericMin, F, stabilityW,
              SCHEMA_VERSION, VERSION, BUILD };`)(DATASETS);

const DATA = DATASETS.su7_km25;
const MODS = api.modules(DATA);
const modelOf = (bulk) => api.complete({
  schema_version: api.SCHEMA_VERSION, group: DATA.group,
  orbifold: { name: DATA.orbifold.name }, brane: [], conventions: {}, bulk,
}).model;

console.log(`\nghu-explorer — the shipped page against the Python reference`);
console.log(`  page:      ${api.VERSION}, built ${api.BUILD}`);
console.log(`  reference: ${REF.produced_by}\n`);

/* ---- row by row ----------------------------------------------------------------------------- */
for (const r of REF.rows) {
  console.log(`${r.name}  —  ${r.note}`);
  const m = modelOf(r.content);
  const v = api.resolve(MODS, m).values;
  const terms = api.termTable(m, DATA);
  const mo = api.moments(terms);

  ok("  8D and A4, exactly",
     Math.abs(8 * mo.D - r["8D"]) < 1e-9 && Math.abs(mo.A4 - r.A4) < 1e-9,
     `page ${8 * mo.D}, ${mo.A4} vs reference ${r["8D"]}, ${r.A4}`);
  ok("  W, exactly", Math.abs(api.stabilityW(terms) - r.W) < 1e-9,
     `page ${api.stabilityW(terms)} vs ${r.W}`);
  ok("  F(1) − F(0) to 1e-6",
     rel(v.get("vacuum").value.F1_minus_F0, r.F_at_1_minus_F_at_0) < 1e-6,
     `page ${v.get("vacuum").value.F1_minus_F0} vs ${r.F_at_1_minus_F_at_0}`);

  const a = v.get("alpha_min");
  if (r.alpha_closed === null) {
    ok("  no small-alpha solution, as the reference has it", a.status === "unknown", a.status);
  } else {
    ok("  the closed form, to 1e-9", a.status !== "unknown" && rel(a.value, r.alpha_closed) < 1e-9,
       `page ${a.value} vs ${r.alpha_closed}`);
    ok("  and its own direct minimum agrees with the reference's, to 1e-3",
       rel(api.numericMin(terms), r.alpha_global) < 1e-3,
       `page ${api.numericMin(terms)} vs ${r.alpha_global}`);
    if (r.m_h != null)
      ok("  m_h, to 1e-6", rel(v.get("m_h").value, r.m_h) < 1e-6,
         `page ${v.get("m_h").value} vs ${r.m_h}`);
  }

  /* THE VERDICT, IN ITS TWO HALVES.  The symmetric half is a theorem about W; the deepest-point
   * half must be measured, and the reference says what the answer is. */
  const vac = v.get("vacuum").value;
  ok("  the symmetric half is the sign of W", vac.symmetric_ok === (r.W > 0));
  if (r.alpha_closed !== null && r.alpha_global !== null) {
    const refDeeper = r.F_at_global < r.F_at_closed - 1e-6 * Math.max(1, Math.abs(r.F_at_closed));
    ok(`  the deepest-point half: the reference says the branch ${refDeeper ? "is NOT" : "IS"} the deepest`,
       vac.deepest === !refDeeper,
       `page deepest=${vac.deepest}, reference F_branch=${r.F_at_closed}, F_global=${r.F_at_global}`);
    ok(`  so the verdict is ${r.W > 0 && !refDeeper ? "a true vacuum" : "a false vacuum"}`,
       vac.true === (r.W > 0 && !refDeeper), `page true=${vac.true}`);
  } else {
    /* AND WHEN THE REFERENCE HAS NO ELECTROWEAK POINT, THE PAGE MUST CLAIM NEITHER.  This half
     * had no check until 2026-08-27, and that is exactly where the second audit found a bug: the
     * verdict was `symmetricOK && deepest !== false`, and with nothing to test `deepest` is null,
     * so a content with no breaking at all and W > 0 exported `true`. */
    ok("  no electroweak point in the reference, so the page's verdict is null -- not a claim",
       vac.true === null && (vac.state === "no-electroweak-breaking" ||
                             vac.state === "no-branch-located"),
       `page true=${JSON.stringify(vac.true)}, state=${vac.state}`);
    ok("  ...and the symmetric half is still reported, because W is still a fact",
       vac.symmetric_ok === (r.W > 0));
  }
  console.log("");
}

/* ---- the check the audit of 2026-08-26 exists for ------------------------------------------- */
{
  const cx = REF.rows.find((r) => r.name === "audit counterexample");
  const v = api.resolve(MODS, modelOf(cx.content)).values.get("vacuum");
  console.log("the audit's own case, stated as its own check");
  ok("W > 0 does NOT by itself make the page claim a true vacuum",
     v.value.symmetric_ok === true && v.value.true === false);
  ok("and the deeper minimum is named, not merely denied",
     typeof v.value.alpha_global === "number" && rel(v.value.alpha_global, cx.alpha_global) < 1e-3,
     `page ${v.value.alpha_global} vs ${cx.alpha_global}`);
  ok("the deepest-point half is not sold as a theorem: it was measured",
     v.status === "verified", v.status);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

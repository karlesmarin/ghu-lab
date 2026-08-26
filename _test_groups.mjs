/* _test_groups.mjs — is a group really just data?
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * DESIGN.md D3 says the kernel knows about weight lattices, parities and winding sums, and that a
 * GROUP IS DATA.  With one group in the tree that claim cost nothing and could not be wrong.  This
 * file runs the SAME kernel over a SECOND group and checks that the difference between them is
 * entirely in the JSON.
 *
 * The sharpest check is not that SU(4) works.  It is that the two groups get DIFFERENT and CORRECT
 * answers to the same question: SU(4) carries Dynkin labels so the selection rule can be applied,
 * SU(7)'s data file does not so the honest answer is that the question cannot be asked.  One
 * kernel, two data files, two different verdicts, and not a line of kernel between them.
 *
 *   node _test_groups.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete, modelId } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { selectionModule, repFacts, halfDomain } from "./src/modules/selection.mjs";

const SU7 = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const SU4 = JSON.parse(readFileSync(new URL("./data/su4_ahmn.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const mk = (data, bulk) => complete({ ...emptyModel(), group: data.group,
                                      orbifold: { name: data.orbifold.name }, bulk }).model;

H("the second group arrived as a file, not as code");
ok("SU(4) is there with its representations", SU4.reps_dynkin &&
   Object.keys(SU4.reps_dynkin).length === 119, String(Object.keys(SU4.reps_dynkin || {}).length));
ok("it names where it came from", SU4.source.extracted_from.length === 2);
ok("every representation carries Dynkin labels",
   Object.values(SU4.reps_dynkin).every((d) => Array.isArray(d) && d.length === 3));
ok("the catalogue agrees with the published one on the fundamental",
   SU4.catalogue.find((r) => r.name === "(0,0,1)").dim === 4);
ok("and on the antisymmetric, which is the blind one",
   SU4.catalogue.find((r) => r.name === "(0,1,0)").blind === true);
ok("the adjoint is dimension 15",
   SU4.catalogue.find((r) => r.name === "(1,0,1)").dim === 15);

H("the same module, run over each group");
const sel4 = selectionModule(SU4), sel7 = selectionModule(SU7);

const m4 = mk(SU4, [{ rep: "(0,0,1)", parities: [1, 1], multiplicity: 1 }]);
const r4 = resolve([sel4], m4);
ok("SU(4): the selection rule is ANSWERED",
   r4.values.get("legal_domain").status === STATUS.THEOREM,
   r4.values.get("legal_domain").reason || "");
ok("and it is a theorem, not a measurement",
   r4.values.get("legal_domain").status === STATUS.THEOREM);

const m7 = mk(SU7, [{ rep: "84", parities: [1, 1], multiplicity: 1 }]);
const r7 = resolve([sel7], m7);
ok("SU(7): the same rule is UNKNOWN, because its data file has no labels",
   r7.values.get("legal_domain").status === STATUS.UNKNOWN);
ok("and it says so naming the group and the missing thing",
   r7.values.get("legal_domain").reason.includes("SU(7)") &&
   r7.values.get("legal_domain").reason.includes("Dynkin"));

ok("ONE kernel, TWO data files, TWO different and correct verdicts",
   r4.values.get("legal_domain").status !== r7.values.get("legal_domain").status);

H("the rule itself, on representations whose verdict is published");
/* The fundamental (0,0,1): centre charge 3, odd, b = 0 so not degenerate -> full torus. */
ok("the fundamental needs the full torus", halfDomain(0, 0, 1) === false);
ok("its centre charge is 3, odd", repFacts(0, 0, 1).centre_charge === 3);
/* The antisymmetric (0,1,0): centre charge 2, even -> the half-domain holds. */
ok("the antisymmetric keeps the half domain", halfDomain(0, 1, 0) === true);
/* The adjoint (1,0,1): centre charge 1+0+3 = 4, even -> half domain. */
ok("the adjoint keeps it too", halfDomain(1, 0, 1) === true);
/* Degeneracy rescues an odd one: (1,1,1) has centre charge 6 (even) and is degenerate. */
ok("(1,1,1) is degenerate", repFacts(1, 1, 1).degenerate === true);
/* (3,1,3): centre charge 3+2+9 = 14, even -> holds; and degenerate since b odd and a == c. */
ok("(3,1,3) is degenerate and keeps the half domain",
   repFacts(3, 1, 3).degenerate === true && halfDomain(3, 1, 3) === true);

H("a content of several representations: the CONJUNCTION");
const mixed = mk(SU4, [{ rep: "(0,1,0)", parities: [1, 1], multiplicity: 1 },
                       { rep: "(0,0,1)", parities: [1, 1], multiplicity: 1 }]);
const rm = resolve([sel4], mixed).values.get("legal_domain");
ok("one representation needing the full torus is enough to lose the half domain",
   rm.value.half_domain === false);
ok("and the culprit is named", rm.value.blocked_by.includes("(0,0,1)"),
   JSON.stringify(rm.value.blocked_by));
const both = mk(SU4, [{ rep: "(0,1,0)", parities: [1, 1], multiplicity: 2 }]);
ok("a content where every representation allows it keeps the half domain",
   resolve([sel4], both).values.get("legal_domain").value.half_domain === true);

H("and the model record does not care which group it holds");
ok("both models validate and hash", /^[0-9a-f]{12}$/.test(modelId(m4)) &&
   /^[0-9a-f]{12}$/.test(modelId(m7)));
ok("and they are different models", modelId(m4) !== modelId(m7));

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

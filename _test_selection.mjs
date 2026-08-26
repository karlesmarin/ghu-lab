/* _test_selection.mjs — Part III's rule, and the two things that can falsify it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The rule is arithmetic and could be self-consistently wrong, so the checks that carry weight here
 * are the ones an outside computation could lose:
 *
 *   - the reflection sweep: 119 representations, rule against a winding sum that never sees (a,b,c);
 *   - the reduction: halfDomain == (a + c) even, over every triple up to 14.
 *
 * Both are written to be capable of failing.  The sweep demands that the catalogue contain BOTH
 * outcomes -- if every representation were symmetric, "the rule called them all correctly" would be
 * true of a rule that always said yes.
 */
import { readFileSync } from "node:fs";
import { centreCharge, oddParity, degenerate, halfDomain, halfDomainReduced, hostsGeneration,
         zeroModes, repFacts, reflectionDefect, sweepAll, selectionModule,
         dimSU4, cellGates, minimalAdmitting }
  from "./src/modules/selection.mjs";
import { spectrum, lattice } from "./src/kernel/wilson.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { complete, emptyModel } from "./src/kernel/model.mjs";

const D = JSON.parse(readFileSync("data/su4_ahmn.json", "utf8"));
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.log("  FAIL " + m)));

const model = (bulk) =>
  complete({ ...emptyModel(), group: D.group, orbifold: { name: D.orbifold.name }, bulk }).model;
const run = (bulk) => resolve([selectionModule(D)], model(bulk));
const B = (rep, n = 1) => ({ rep, parities: [1, 1], multiplicity: n, eta: 1, role: 1 });

/* ---- 1. the rule, on values worked by hand ---- */
ok(centreCharge(1, 0, 0) === 1 && centreCharge(0, 0, 1) === 3 && centreCharge(1, 1, 1) === 6,
   "the centre charge is a + 2b + 3c");
ok(oddParity(1, 0, 0) === true && oddParity(0, 1, 0) === false, "parity of the centre charge");
ok(degenerate(0, 1, 0) === true, "(0,1,0): b odd and a == c");
ok(degenerate(1, 1, 1) === true, "(1,1,1): b odd and a, c both odd");
ok(degenerate(1, 0, 1) === false, "(1,0,1): b even, so not degenerate");
ok(halfDomain(1, 0, 0) === false, "(1,0,0) needs the whole torus");
ok(halfDomain(0, 1, 0) === true, "(0,1,0) needs half of it");
ok(zeroModes(1, 1, 1) === 3, `zero modes of (1,1,1): ${zeroModes(1, 1, 1)}`);
ok(hostsGeneration(1, 1, 1) === false, "(1,1,1) has even parity, so it hosts no generation");
ok(hostsGeneration(2, 1, 1) === true, "(2,1,1): centre charge 7 is odd, b >= 1, a+b+c >= 3");
ok(hostsGeneration(2, 1, 0) === false, "(2,1,0) has centre charge 4 -- even, so no generation");
ok(repFacts(0, 1, 0).tower_pairs_at === "both", "a degenerate rep pairs at both");
ok(repFacts(1, 0, 0).tower_pairs_at === "even m", "an odd rep pairs at even m");
ok(repFacts(2, 0, 0).tower_pairs_at === "odd m", "an even rep pairs at odd m");

/* ---- 2. THE REDUCTION: the degeneracy disjunct never fires ---- */
let fires = 0, both = 0, triples = 0;
for (let a = 0; a <= 14; a++) for (let b = 0; b <= 14; b++) for (let c = 0; c <= 14; c++) {
  triples++;
  if (halfDomain(a, b, c) !== halfDomainReduced(a, b, c)) fires++;
  if (degenerate(a, b, c) && oddParity(a, b, c)) both++;
}
ok(triples === 3375, `the sweep covers every triple up to 14: ${triples}`);
ok(fires === 0, `halfDomain == (a + c) even, on all ${triples} triples: ${fires} exceptions`);
ok(both === 0, `no triple is both degenerate and odd: ${both}`);
/* anti-vacuity: the reduction would be trivially true if degenerate never held at all */
ok([...Array(15).keys()].some((b) => degenerate(1, b, 1)),
   "anti-vacuity: degeneracy does hold somewhere, so the implication has content");
/* and degeneracy still DOES something, so the reduction is not a licence to delete it */
ok(repFacts(0, 1, 0).tower_pairs_at !== repFacts(0, 2, 0).tower_pairs_at,
   "degeneracy still decides where the tower pairs -- it is only the domain it does not decide");

/* ---- 3. THE SWEEP: rule against a computation that never sees (a,b,c) ---- */
const sw = sweepAll(D);
ok(sw.tested === 119, `every representation with modes is tested: ${sw.tested}`);
ok(sw.disagreements.length === 0,
   `rule and potential agree on all of them: ${sw.disagreements.join(", ")}`);
/* the check that makes the agreement mean something: the catalogue must contain BOTH answers */
ok(sw.symmetric > 10 && sw.tested - sw.symmetric > 10,
   `anti-vacuity: both outcomes occur (${sw.symmetric} symmetric, ${sw.tested - sw.symmetric} not)`);
ok(sw.symmetric === 59, `and the split is the one measured: ${sw.symmetric} of ${sw.tested}`);
/* the defect must be a real number that can be large -- a measurement that always returns 0 would
 * pass every symmetry test ever written */
const asym = sw.rows.find((r) => !r.flat && !r.symmetric);
ok(asym && asym.defect > 1e-3,
   `the defect is capable of being large: ${asym && asym.defect}`);
const sym = sw.rows.find((r) => !r.flat && r.symmetric);
ok(sym && sym.defect < 1e-12, `and small where it should be: ${sym && sym.defect}`);

/* ---- 4. the defect grid does not flatter the rule ---- */
/* Evaluated at alpha_2 = 0 or 1/2 the identity is trivial; the grid must avoid both. */
const spA = spectrum([{ key: asym.rep, n: 1, eta: 1, role: 1 }], D);
ok(reflectionDefect(spA, lattice(D.kmax), 7) > 1e-3,
   "the grid catches an asymmetric rep at n = 7");
ok(reflectionDefect(spA, lattice(D.kmax), 13) > 1e-3,
   "and at n = 13 -- the finding is not an artefact of one grid");

/* ---- 5. the conjunction over a content ---- */
const halfRep = sw.rows.find((r) => r.half).rep, fullRep = sw.rows.find((r) => !r.half).rep;
const rH = run([B(halfRep)]).values.get("legal_domain");
ok(rH.value.half_domain === true, `${halfRep} alone allows the halving`);
ok(rH.value.alpha2[1] === 0.5, "and the region is [0, 1/2]");
const rF = run([B(halfRep), B(fullRep)]).values.get("legal_domain");
ok(rF.value.half_domain === false, "one blocking representation loses the halving for the content");
ok(rF.value.blocked_by.includes(fullRep), `and it is named: ${rF.value.blocked_by.join(", ")}`);
ok(rF.value.alpha2[1] === 1, "the region becomes the full torus");
/* and the check follows the content, not the individual rep */
const cF = run([B(halfRep), B(fullRep)]).values.get("domain_check");
ok(cF.value.agrees === true,
   `the potential of the MIXED content agrees with the conjunction: ${JSON.stringify(cF.value)}`);

/* ---- 6. multiplicity cannot change a parity ---- */
const r1 = run([B(fullRep, 1)]).values.get("legal_domain");
const r7 = run([B(fullRep, 7)]).values.get("legal_domain");
ok(r1.value.half_domain === r7.value.half_domain,
   "seven copies do not change the rule -- it is a statement about the representation");

/* ---- 7. what it refuses to answer ---- */
const su7 = JSON.parse(readFileSync("data/su7_km25.json", "utf8"));
const r7g = selectionModule(su7).compute({
  model: { bulk: [{ rep: "84", parities: [1, 1], multiplicity: 1 }] } });
ok(r7g.legal_domain.status === "unknown", "a group with no Dynkin labels gets an unknown");
ok(/Dynkin labels/.test(r7g.legal_domain.reason), `with the reason: ${r7g.legal_domain.reason}`);
ok(r7g.domain_check.status === "unknown", "and the check is unknown too, not silently skipped");
const r0 = selectionModule(D).compute({ model: { bulk: [] } });
ok(r0.legal_domain.status === "unknown" && /no bulk representation/.test(r0.legal_domain.reason),
   "an empty content is unknown");

/* ---- 8. PART II's THREE GATES, against the catalogue and against Part I ---- */
/* The dimension formula against every dim the catalogue carries -- 119 numbers this file did not
 * invent, read from the archived data of the published tool. */
const dimMisses = D.catalogue.filter((cat) => {
  const d = D.reps_dynkin[cat.name];
  return d && dimSU4(d[0], d[1], d[2]) !== cat.dim;
});
ok(dimMisses.length === 0,
   `dimSU4 reproduces every catalogue dimension: ${dimMisses.map((x) => x.name).join(", ")}`);
ok(D.catalogue.length >= 100, `anti-vacuity: the catalogue is big (${D.catalogue.length})`);
/* the gates are the conjunction the module already had, clause by clause */
let gateMismatch = 0;
for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) for (let c = 0; c <= 10; c++)
  if (cellGates(a, b, c).admits !== hostsGeneration(a, b, c)) gateMismatch++;
ok(gateMismatch === 0, `cellGates is hostsGeneration said in three clauses: ${gateMismatch} mismatches`);
/* worked examples of the paper */
ok(cellGates(0, 2, 1).admits && cellGates(1, 2, 0).admits && dimSU4(0, 2, 1) === 60,
   "the 60 = (0,2,1) and its mirror pass the gates");
ok(cellGates(0, 2, 1).N === 3, `and N(0,2,1) = (b+1)(a+c+1)/2 = 3: ${cellGates(0, 2, 1).N}`);
ok(cellGates(1, 1, 0).failing.join() === "too small", "(1,1,0): odd centre, b = 1, but a+b+c = 2");
ok(cellGates(1, 0, 1).failing.join() === "centre charge even,b = 0,too small",
   `(1,0,1), the 15: ALL THREE gates refuse the adjoint: ${cellGates(1, 0, 1).failing.join()}`);
/* PART I's HEADLINE, RECOVERED: the smallest admitting representation is the 60 -- found here by
 * brute force over the labels, not quoted */
const MIN = minimalAdmitting();
ok(MIN.dim === 60, `the smallest representation through the gates has dimension ${MIN.dim}`);
ok(MIN.labels.length === 2 &&
   MIN.labels.some((L) => L.join() === "0,2,1") && MIN.labels.some((L) => L.join() === "1,2,0"),
   `at exactly (0,2,1) and its mirror: ${JSON.stringify(MIN.labels)}`);
/* N is an integer on every admitting triple, because the centre gate forces a + c odd */
let badN = 0, minN = Infinity;
for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) for (let c = 0; c <= 12; c++)
  if (hostsGeneration(a, b, c)) {
    const N = zeroModes(a, b, c);
    if (!Number.isInteger(N)) badN++;
    if (N < minN) minN = N;
  }
ok(badN === 0, `N is an integer on every admitting triple: ${badN} exceptions`);
ok(minN === 3, `and never below 3 slots -- the cell needs a doublet and two singlets: min ${minN}`);
/* the cross-paper bit: an admitting representation ALWAYS forces the full torus */
let crossFail = 0;
for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) for (let c = 0; c <= 12; c++)
  if (hostsGeneration(a, b, c) && halfDomain(a, b, c)) crossFail++;
ok(crossFail === 0,
   `every generation-hosting rep needs the whole torus -- Parts II and III read one bit: ${crossFail}`);

/* ---- 9. the statuses ---- */
const rr = run([B(halfRep)]);
ok(rr.values.get("legal_domain").status === "theorem", "the domain is a theorem of Part III");
ok(rr.values.get("domain_check").status === "measured",
   "the check is MEASURED -- it is our computation, not their statement");
ok(/composition is ours/.test(rr.values.get("legal_domain").source),
   "and the conjunction says out loud that it is ours");

console.log(`\n_test_selection: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

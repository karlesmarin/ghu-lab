/* _test_wilson.mjs — the calculator's engine, against a published vacuum.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * This is the anchor the first port failed.  AHMN's content — three 35s of matter and the gauge 15
 * — has a published mass ratio of 1.2046, and the published tool reports 1.2045.  Any engine that
 * does not land there is not this engine, however self-consistent it looks.
 *
 * That is not a slogan.  The first attempt passed 22 internal checks, every one of them true, and
 * was the wrong object: ported from the selection-rule tool, missing eta, zeta, the Sigma/D split
 * and the role.  It gave 1.1405.  Then this one gave 1.2033 because KMAX was TYPED as 5 (the
 * selection tool's) instead of read as 10 (the calculator's).  Two mistakes, both invisible from
 * inside, both caught by one number from outside.
 *
 *   node _test_wilson.mjs
 */
import { readFileSync } from "node:fs";
import { spectrum, lattice, V, gradV, hessian, eig, minimise, PERIODS } from "./src/kernel/wilson.mjs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { selectionModule } from "./src/modules/selection.mjs";
import { calculatorModule, sweepDomain, summariseDomain } from "./src/modules/calculator.mjs";
import { halfDomain } from "./src/modules/selection.mjs";

const D = JSON.parse(readFileSync(new URL("./data/su4_ahmn.json", import.meta.url), "utf8"));
const LATT = lattice(D.kmax);

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const AHMN = [{ key: "(4,0,0)", n: 3, eta: 1, role: 1 },
              { key: "(1,0,1)", n: 1, eta: 1, role: -1 }];

H("the constants are READ, not typed");
ok("KMAX is the calculator's 10, not the selection tool's 5", D.kmax === 10, String(D.kmax));
ok("the modes are there, with half-integer charges",
   D.reps_modes["(4,0,0)"].some(([q]) => q % 1 !== 0));
ok("and that is why alpha_1 has period 2 — the note was right about THIS engine",
   D.reps_modes["(4,0,0)"].some(([q]) => q === 0.5));

H("THE ANCHOR — AHMN's published vacuum");
const m = minimise(spectrum(AHMN, D), LATT);
console.log(`  alpha = (${m.alpha.map((x) => x.toFixed(4)).join(", ")})   ` +
            `|grad V| = ${m.grad.toExponential(2)}   ratio = ${m.mass_ratio.toFixed(4)}`);
ok("the mass ratio reproduces the published 1.2046 to better than 0.1 %",
   Math.abs(m.mass_ratio - 1.2046) / 1.2046 < 1e-3, m.mass_ratio.toFixed(5));
ok("and agrees with the published tool's own 1.2045 to four figures",
   Math.abs(m.mass_ratio - 1.2045) < 5e-4, m.mass_ratio.toFixed(5));
ok("the vacuum is polished, not merely located", m.grad < 1e-8, m.grad.toExponential(2));
ok("and it is a minimum", m.masses2[0] > 0 && m.masses2[1] > 0, JSON.stringify(m.masses2));

/* alpha_2 itself is a convention: this run reports its reflection.  The old harness demanded
 * 0.299 and received 0.701, and the TEST was what was wrong.  Only the invariant is asserted. */
const inv = Math.min(m.alpha[1], 1 - m.alpha[1]);
ok("the reflection-invariant alpha_2 is 0.299, whichever image comes out",
   Math.abs(inv - 0.299) < 2e-3, `${inv.toFixed(4)} (raw ${m.alpha[1].toFixed(4)})`);

H("eta multiplies the COSET half and nothing else");
const blind = D.catalogue.find((r) => r.blind && D.reps_modes[r.name]);
const sighted = D.catalogue.find((r) => r.blind === false && D.reps_modes[r.name] &&
                                        r.dim > 1 && r.dim < 40);
const spOf = (name, eta) => spectrum([{ key: name, n: 1, eta, role: 1 }], D);
const moved = (name) => {
  let d = 0;
  for (let t = 0; t < 40; t++) {
    const a1 = 2 * Math.random(), a2 = Math.random();
    d = Math.max(d, Math.abs(V(spOf(name, 1), LATT, a1, a2) - V(spOf(name, -1), LATT, a1, a2)));
  }
  return d;
};
ok(`a BLIND multiplet ${blind.name} does not feel eta at all`, moved(blind.name) < 1e-12,
   moved(blind.name).toExponential(2));
/* Anti-vacuity: if flipping eta moved nothing anywhere, the check above would be empty. */
ok(`a SIGHTED multiplet ${sighted.name} DOES feel it`, moved(sighted.name) > 1e-6,
   moved(sighted.name).toExponential(2));

H("the role, and the split by winding parity");
const spA = spectrum(AHMN, D);
ok("the spectrum splits into an even and an odd column", spA.every((r) => r.length === 3));
ok("Sigma is a graded dimension: the even column cannot be negative here",
   spA.every(([, cE]) => cE >= 0), JSON.stringify(spA));
ok("flipping the role changes the potential — the gauge twist is real",
   (() => {
     const s1 = spectrum([{ key: "(1,0,1)", n: 1, eta: 1, role: 1 }], D);
     const s2 = spectrum([{ key: "(1,0,1)", n: 1, eta: 1, role: -1 }], D);
     return Math.abs(V(s1, LATT, 0.31, 0.17) - V(s2, LATT, 0.31, 0.17)) > 1e-6;
   })());

H("periods, measured on THIS engine");
let p1 = true, p2 = true, notP1 = false;
for (let t = 0; t < 120; t++) {
  const a1 = 2 * Math.random(), a2 = Math.random();
  if (Math.abs(V(spA, LATT, a1 + 2, a2) - V(spA, LATT, a1, a2)) > 1e-9) p1 = false;
  if (Math.abs(V(spA, LATT, a1, a2 + 1) - V(spA, LATT, a1, a2)) > 1e-9) p2 = false;
  if (Math.abs(V(spA, LATT, a1 + 1, a2) - V(spA, LATT, a1, a2)) > 1e-6) notP1 = true;
}
ok("alpha_1 has period 2", p1);
ok("alpha_2 has period 1", p2);
ok("and alpha_1 is NOT 1-periodic — the control that could not fire on the other engine", notP1);
/* The measurement above is the truth; PERIODS is what the minimiser scans and what the relief is
 * drawn on.  If the two ever part company, a picture starts lying about the size of the torus. */
ok("and the exported PERIODS is that measurement, not a second opinion",
   PERIODS[0] === 2 && PERIODS[1] === 1);

H("as a module, over the resolver — and it REQUIRES the legal domain");
const MODS = [selectionModule(D), calculatorModule(D)];
const mk = (bulk) => complete({ ...emptyModel(), group: D.group,
                                orbifold: { name: D.orbifold.name }, bulk }).model;
const ahmn = mk([{ rep: "(4,0,0)", parities: [1, 1], multiplicity: 3, eta: 1, role: 1 },
                 { rep: "(1,0,1)", parities: [1, 1], multiplicity: 1, eta: 1, role: -1 }]);
const ra = resolve(MODS, ahmn);
ok("the resolver runs both, in dependency order",
   ra.ran.join(",") === "selection,calculator", ra.ran.join(","));
ok("and the anchor survives the trip through the spine",
   Math.abs(ra.values.get("mass_ratio").value - 1.2045) < 5e-4,
   String(ra.values.get("mass_ratio").value));
ok("the vacuum carries the domain it was searched over",
   Array.isArray(ra.values.get("vacuum").value.searched));
ok("and none of these is upgraded above `measured`",
   ["vacuum", "higgs_masses", "mass_ratio", "mixing"]
     .every((k) => ra.values.get(k).status === STATUS.MEASURED));

/* The reason the calculator declares `requires: ["legal_domain"]` at all.  Give it a provider that
 * cannot answer, and it must not run: minimising over a region nobody vouched for is exactly the
 * failure the resolver exists to make impossible. */
const stub = { id: "sel_stub", provides: ["legal_domain"], requires: [],
               compute: () => ({ legal_domain: { value: null, units: "", status: "unknown",
                                                 source: "not computed",
                                                 reason: "the rule was not applied here" } }) };
const nd = resolve([calculatorModule(D), stub], ahmn);
ok("with an UNKNOWN legal domain the calculator does not run at all",
   !nd.ran.includes("calculator"), nd.ran.join(",") || "(nothing ran)");
ok("and its outputs name the capability that failed",
   nd.values.get("mass_ratio").reason.includes("legal_domain"),
   nd.values.get("mass_ratio").reason);

/* ---- what halving the search costs -------------------------------------------------------- */
/* The full sweep is seventeen seconds; a build loop does not get to spend that, so the harness
 * takes a slice.  The slice is chosen to contain BOTH answers -- if it held only representations
 * the rule clears, "no violations" would be a fact about the slice. */
const halfOf = (name) => {
  const d = D.reps_dynkin[name];
  return d ? halfDomain(d[0], d[1], d[2]) : false;
};
const NAMES = D.catalogue.map((c) => c.name)
  .filter((n) => D.reps_modes[n]).slice(0, 28);
const W = sweepDomain(D, halfOf, { names: NAMES });
ok("the slice contains representations of both kinds",
   W.allowed > 4 && W.forbidden > 4, `${W.allowed} allowed, ${W.forbidden} forbidden`);
ok("the rule never licenses a halving that loses the minimum",
   W.violations.length === 0, W.violations.join(", "));
/* EXACT, not small: the half's grid points are a subset of the full's, evaluated in the same scan,
 * so a legitimate loss is zero to the last bit.  Comparing two SEPARATE scans gave the half twice
 * the resolution and a "loss" of -5.3e-4 that was mesh, not physics. */
ok("and the cost where it is licensed is exactly zero",
   W.worstAllowedLoss < 1e-12, W.worstAllowedLoss.toExponential(2));
/* ANTI-VACUITY, and the point of the whole sweep: a rule that never bit would be protecting
 * nothing, and you could halve every search for free. */
ok("halving where the rule forbids it really does lose the minimum, sometimes",
   W.bites.length > 0, `${W.bites.length} of ${W.forbidden}: ${W.bites.slice(0, 4).join(", ")}`);
ok("and the loss is large enough to matter, not a rounding",
   W.worstBite > 0.01, `${(100 * W.worstBite).toFixed(1)} % of |V|`);
/* Slicing must not change the answer -- the section runs it ten at a time. */
const halves = summariseDomain(
  sweepDomain(D, halfOf, { names: NAMES.slice(0, 14) }).rows
    .concat(sweepDomain(D, halfOf, { names: NAMES.slice(14) }).rows));
ok("a sliced sweep gives the same verdict as one call",
   halves.tested === W.tested && halves.bites.length === W.bites.length &&
   halves.violations.length === W.violations.length,
   `${halves.tested}/${W.tested}, bites ${halves.bites.length}/${W.bites.length}`);

/* ---- the seeded polish ---------------------------------------------------------------------- */
/* `seed` exists because shrinking N to go faster moved the Newton start and reported minima as
 * saddles.  Seeding at the answer must reproduce the answer. */
const spOne = spectrum([{ key: "(4,0,0)", n: 1, eta: 1, role: 1 }], D);
const free = minimise(spOne, LATT);
const seeded = minimise(spOne, LATT, { seed: free.alpha });
ok("a polish seeded at the vacuum stays there",
   Math.abs(seeded.V - free.V) < 1e-9 && seeded.grad < 1e-8,
   `${seeded.V} vs ${free.V}, |grad| ${seeded.grad.toExponential(1)}`);
ok("and a polish seeded far away does NOT silently agree",
   Math.abs(minimise(spOne, LATT, { seed: [0.9, 0.45] }).V - free.V) > 1e-9 ||
   minimise(spOne, LATT, { seed: [0.9, 0.45] }).grad > 1e-8,
   "the seed is actually being used");

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

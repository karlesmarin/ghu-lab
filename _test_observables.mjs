/* _test_observables.mjs — the register, and the claim that the invariant is invariant.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE ONE CHECK THIS FILE IS FOR.  `observables.mjs` exists because "Z_ai = 0" is a statement about
 * a component and not about a state: rotate a degenerate multiplet and the zeros move.  That is an
 * assertion, so it is measured here, both ways round:
 *
 *   - the SINGULAR VALUES of the overlap block do not move under a change of basis inside the
 *     multiplet, to fourteen digits;
 *   - and the ENTRIES do — a block with an exact zero acquires a non-zero there under a rotation
 *     that changes nothing physical.
 *
 * The second is the decoy.  Without it the first is a check that could only pass, and this house
 * has a rule about those.
 *
 *   node _test_observables.mjs
 */
import { OBSERVABLES, registryFaults, singularValues, overlapVerdict, verdictSubject, SIGMA_FLOOR }
  from "./src/kernel/observables.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

console.log("=".repeat(96));
console.log("   observables.mjs — the declared set, and what a null overlap is allowed to mean");
console.log("=".repeat(96));

/* THE FIXTURE, AND IT HAS TO INVENT TWO THINGS TO EXIST AT ALL.  No entry in the register has an
 * overlap resolution, because no published number is one as printed: a collider paper measures a
 * RATE.  This object invents both the resolution and the derivation that would justify it, purely
 * so the five words can be exercised.  That it cannot be built out of a real entry is not a gap in
 * the test — it is the state of the register, and section 7 counts it. */
const withRes = { ...OBSERVABLES.dijet_octet, resolution: 1.0, resolutionOf: "overlap",
                  rateToOverlap: "none — a test fixture, not a derivation" };

console.log("\n   1 -- THE REGISTER REFUSES AN ENTRY THAT DOES NOT DECLARE ITSELF\n");
let allFaults = [];
for (const [k, e] of Object.entries(OBSERVABLES)) allFaults = allFaults.concat(registryFaults(k, e));
ok(allFaults.length === 0, "every entry names what, channel, symmetries, hypothesis, and either a"
   + " resolution or why it has none", allFaults.join("; "));

/* a decoy entry that must be REFUSED, so the check above is not vacuous */
const badFaults = registryFaults("decoy", { what: "x", channel: "y", symmetries: "z",
                                            hypothesis: "w", resolution: null, source: null });
ok(badFaults.length === 1 && badFaults[0].includes("missing"),
   "and an entry with no resolution and no `missing` is refused",
   badFaults.join("; "));

/* THE UNITS GATE, both halves.  A number with no quantity attached is how a rate uncertainty ends
 * up compared with an overlap; and an entry that DOES claim an overlap resolution has to name the
 * derivation, because no published number is one as printed. */
const noKind = registryFaults("decoy2", { what: "x", channel: "y", symmetries: "z", hypothesis: "w",
                                          resolution: 1.0, source: null });
ok(noKind.some((f) => f.includes("resolutionOf")),
   "a resolution with no declared quantity is refused", noKind.join("; ").slice(0, 90));
const noDeriv = registryFaults("decoy3", { what: "x", channel: "y", symmetries: "z", hypothesis: "w",
                                          resolution: 1.0, resolutionOf: "overlap", source: null });
ok(noDeriv.some((f) => f.includes("rateToOverlap")),
   "and an overlap resolution with no named derivation is refused too",
   noDeriv.join("; ").slice(0, 90));
const rateEntry = { ...OBSERVABLES.dijet_octet, resolution: 0.15, resolutionOf: "rate" };
const rateVerdict = overlapVerdict(rateEntry, [[10, 0]]);
ok(rateVerdict.verdict === "not-computed" && rateVerdict.why.includes("does not become one on Z"),
   "and a resolution on a RATE never decides an overlap, however big the overlap is",
   rateVerdict.why.slice(0, 88));

console.log("\n   2 -- EVERY SOURCE IS A KEY THAT EXISTS, WITH ITS URL AND DATE\n");
for (const [k, e] of Object.entries(OBSERVABLES)) {
  if (e.source === null) {
    ok(!!e.missing, k + ": no source, and `missing` says which paper would supply it",
       e.missing.slice(0, 60) + "...");
    continue;
  }
  const x = EXPERIMENT[e.source];
  ok(!!x && !!x.url && !!x.read, k + ": source `" + e.source + "` is in EXPERIMENT with url and date",
     x ? x.read : "MISSING");
}

console.log("\n   3 -- THE INVARIANT IS INVARIANT, AND THE ENTRIES ARE NOT\n");
/* A multiplet of three states, two operators.  The block below has an exact zero in it. */
const Z = [[1, 0, 0.5],
           [0, 0, 2.0]];
const s0 = singularValues(Z);
ok(s0.length === 3 && s0[0] > s0[1], "the block has singular values", s0.map((x) => x.toFixed(6)).join(", "));

/* a rotation of the multiplet: physical content untouched, basis changed */
function rotate(Zm, th) {
  const c = Math.cos(th), s = Math.sin(th);
  return Zm.map((row) => [row[0] * c - row[2] * s, row[1], row[0] * s + row[2] * c]);
}
const Zr = rotate(Z, 0.7);
const s1 = singularValues(Zr);
const same = s0.every((x, i) => Math.abs(x - s1[i]) < 1e-13);
ok(same, "and they do not move under a rotation inside the multiplet, to 1e-13",
   s1.map((x) => x.toFixed(6)).join(", "));

/* THE DECOY: the entry that was exactly zero is not zero any more */
const movedEntry = Math.abs(Zr[1][0]) > 1e-9 || Math.abs(Zr[1][2] - 2.0) > 1e-9;
ok(movedEntry, "while an individual entry DOES move — Z[1][0] was exactly 0 and is now "
   + Zr[1][0].toFixed(6), "which is why the verdict is never taken from an entry");

/* and a state genuinely outside the span stays outside: rank is invariant too.
 *
 * THE THRESHOLD HERE IS THE MODULE'S OWN FLOOR, NOT A NUMBER CHOSEN TO MAKE THIS PASS.  The Gram
 * route squares the block, so an exactly orthogonal direction comes back at ~1e-8 of sigma_max
 * rather than 0 — half the digits, as advertised in the header.  A test asserting 1e-14 here would
 * be asserting a precision the routine does not have, which is how a suite ends up measuring the
 * suite.  What must hold is that the answer stays UNDER the declared floor on both sides. */
const Znull = [[1, 0, 0], [0, 1, 0]];
const sn = singularValues(Znull);
const snr = singularValues(rotate(Znull, 1.1));
ok(sn[2] < SIGMA_FLOOR * sn[0] && snr[2] < SIGMA_FLOOR * snr[0],
   "a direction truly orthogonal to the span stays orthogonal, under the module's declared floor",
   "sigma_min/sigma_max " + (sn[2] / sn[0]).toExponential(2) + " -> "
   + (snr[2] / snr[0]).toExponential(2) + ", floor " + SIGMA_FLOOR);

/* AND THE FLOOR IS ENFORCED, not just documented: a resolution finer than it is refused. */
const tooFine = overlapVerdict({ ...withRes, resolution: 1e-12 }, [[1, 0, 0]]);
ok(tooFine.verdict === "not-computed" && tooFine.why.includes("finer"),
   "and a resolution finer than the floor is refused rather than answered",
   tooFine.why.slice(0, 76));

console.log("\n   4 -- COMPLEX BLOCKS GIVE THE SAME ANSWER AS THEIR REAL SHADOW\n");
const Zc = [[[1, 0], [0, 0], [0.5, 0]], [[0, 0], [0, 0], [2, 0]]];
const sc = singularValues(Zc);
ok(sc.length === 3 && sc.every((x, i) => Math.abs(x - s0[i]) < 1e-12),
   "a real block written as complex returns the same singular values",
   sc.map((x) => x.toFixed(6)).join(", "));
/* a genuinely complex block: a phase cannot change a singular value */
const Zph = [[[0, 1], [0, 0], [0, 0.5]], [[0, 0], [0, 0], [0, 2]]];
const sph = singularValues(Zph);
ok(sph.every((x, i) => Math.abs(x - s0[i]) < 1e-12),
   "and multiplying the whole block by a phase does not move them",
   sph.map((x) => x.toFixed(6)).join(", "));

console.log("\n   5 -- THE FIVE VERDICTS, AND NO SIXTH\n");
const seen = new Set();
const cases = [
  ["not-computed", overlapVerdict(withRes, null)],
  ["not-computed", overlapVerdict(OBSERVABLES.dijet_octet, [[1, 0]])],   /* resolution is null */
  ["nonzero",      overlapVerdict(withRes, [[10, 0]])],
  ["below-res",    overlapVerdict(withRes, [[0.01, 0]])],
  ["undetermined", overlapVerdict(withRes, [[1.2, 0]])],
];
for (const [want, got] of cases) {
  seen.add(got.verdict);
  ok(got.verdict === want, "a block " + (want === "not-computed" ? "with no data or no resolution"
     : "of size " + got.smax.toPrecision(3)) + " reads `" + want + "`", got.why.slice(0, 72));
}
ok(seen.size === 4, "the five words are the only ones this function emits",
   "exact-zero needs opts.exact and is exercised next");
const ez = overlapVerdict(withRes, [[0, 0], [0, 0]], { exact: true });
ok(ez.verdict === "exact-zero", "and exact arithmetic gets its own word, not `below-res`", ez.why);

console.log("\n   6 -- A VERDICT'S SUBJECT IS A PAIR, NOT A STATE\n");
const subj = verdictSubject("first KK gluon", "dijet_octet", OBSERVABLES.dijet_octet);
ok(subj.state && subj.operator && subj.channel && subj.symmetries && subj.hypothesis,
   "the subject carries the state, the operator, the channel, the symmetries and the context",
   subj.hypothesis.slice(0, 56) + "...");

console.log("\n   7 -- WHAT THE REGISTER CANNOT DO YET, AS AN INVARIANT AND NOT AS A COUNT\n");
/* AN EARLIER VERSION ASSERTED "ALL FIVE ENTRIES LACK A RESOLUTION", AND THAT WAS A CHECK ON THE
 * STATE.  It went red the day one entry gained a sourced resolution -- which is progress, not a
 * regression, and a suite that goes red on progress is measuring itself.  What must hold is the
 * INVARIANT: no entry has a resolution on the OVERLAP, because no published number is one. */
const withRes2 = Object.entries(OBSERVABLES).filter(([, e]) => e.resolution !== null);
const overlapRes = withRes2.filter(([, e]) => e.resolutionOf === "overlap");
ok(overlapRes.length === 0,
   "no entry has a resolution ON THE OVERLAP, so every coupling verdict is still `not-computed`",
   withRes2.length + " of " + Object.keys(OBSERVABLES).length + " now carry a sourced resolution,"
   + " all of them on a rate — that is the register's state and it is allowed to improve");
ok(withRes2.length > 0 && withRes2.every(([, e]) => e.resolutionSource && e.missing),
   "and an entry that HAS a resolution says where it came from and what it still cannot decide",
   withRes2.map(([k]) => k).join(", "));
/* the one that has been reproduced says so, which is what separates a sourced number from a cited one */
ok(OBSERVABLES.higgs_couplings.reproduced
   && OBSERVABLES.higgs_couplings.reproduced.includes("1.322"),
   "the sourced entry names the published row this repository recovered from it",
   OBSERVABLES.higgs_couplings.reproduced);

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_multiplets.mjs — the multiplet layer, held to the term tables the app already ships.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Nothing here is checked against multiplets.mjs itself.  The term tables in data/su7_km25.json
 * were transcribed from the paper long before this layer existed, and they are what the whole app
 * has been computing with; the `multiplets` block beside them is read off the paper's
 * eqs. (41), (57), (69) and (70).  If the second reproduces the first, nine tables out of nine,
 * the layer is right.  The hand count of doublets — 1, 5, 10, 16 — is a third, independent number.
 *
 * The cancellation checks come with the control that can kill them: a 48 with the OTHER parity
 * must NOT cancel, and neither must the Faddeev-Popov variant of the gauge count.  A cancellation
 * that happens whatever you feed it is not a cancellation.
 *
 *   node _test_multiplets.mjs
 */
import { readFileSync } from "node:fs";
import { chargesOf, signOf, zeroMode, termsOf, samePotential, cube, p6Ledger,
         MUF } from "./src/kernel/multiplets.mjs";

const KM = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const MU = KM.multiplets;
const D = MU.decomposition;

let n = 0, bad = 0;
const ok = (cond, what) => {
  n += 1;
  if (!cond) { bad += 1; console.log(`  *** FAIL: ${what}`); }
};
const eq = (a, b, what) => ok(JSON.stringify(a) === JSON.stringify(b),
                              `${what}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);

console.log("— the charge rule, c = r-1, r-3, ... > 0 (eq. (71) and its note, in general)");
eq(chargesOf(2), [1], "r=2");
eq(chargesOf(3), [2], "r=3");
eq(chargesOf(4), [3, 1], "r=4 — the quadruplet's smaller eigenvalue is the note below eq. (71)");
eq(chargesOf(5), [4, 2], "r=5");
eq(chargesOf(6), [5, 3, 1], "r=6 — outside this series, and the reason the rule is general");

console.log("— nine term tables, DERIVED from the decomposition, against the shipped ones");
for (const rep of ["7", "28", "48", "84"]) {
  for (const [tag, eta, etap] of [["(+,+)", 1, 1], ["(+,-)", 1, -1]]) {
    const want = KM.reps[rep]?.[tag];
    if (!want) continue;
    ok(samePotential(termsOf(D[rep], { eta, etap }), want),
       `${rep}${tag} derived != shipped`);
  }
}
const gauge = termsOf(D["48"], { weight: (p) => MU.gauge_weight[p > 0 ? "periodic" : "antiperiodic"],
                                 sign: -1 });
ok(samePotential(gauge, KM.gauge), "gauge eq. (68) derived from eq. (57) != shipped");

console.log("— the r4 bookkeeping: (11,-s,1)+(1,-s,1) and (12,-s,1) are the same potential");
ok(samePotential([[11, -1, 1], [1, -1, 1]], [[12, -1, 1]]), "channel-wise equality");
ok(!samePotential([[11, -1, 1]], [[12, -1, 1]]), "and it still separates 11 from 12");

console.log("— the hand count of doublets: 1, 5, 10, 16");
const doublets = (rep) => D[rep].reduce(
  (t, mu) => t + (mu[MUF.DIM] === 2 || mu[MUF.DIM] === 4 ? mu[MUF.COLOUR] : 0), 0);
eq([doublets("7"), doublets("28"), doublets("48"), doublets("84")], [1, 5, 10, 16], "doublets");

console.log("— one sign, two consequences: s = +1 iff a zero mode exists");
for (const rep of ["7", "28", "48", "84"]) {
  for (const [eta, etap] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (const mu of D[rep]) {
      const s = signOf(mu, eta, etap), z = zeroMode(mu, eta, etap);
      ok((s > 0) === (z !== null), `${rep} ${mu[0]} (${eta},${etap}): s=${s} but zeroMode=${z}`);
      if (z) ok(z === (eta * mu[MUF.P5] > 0 ? "L" : "R"), `${rep} ${mu[0]}: wrong chirality`);
    }
  }
}

console.log("— the parity cube: eight corners, and no state lost or invented");
const C = cube(D["48"], { eta: 1, etap: 1 });
eq(C.length, 8, "corners");
eq(C.reduce((t, k) => t + k.states, 0),
   D["48"].reduce((t, mu) => t + mu[MUF.COLOUR] * mu[MUF.DIM], 0), "states conserved across the cube");
ok(C.every((k) => k.multiplets.every((mu) => mu[MUF.P6] === k.p6 && mu[MUF.P5] === k.p5
                                             && mu[MUF.P5P] === k.p5p)), "corners hold their own");
ok(C.filter((k) => k.states === 0).length > 0, "some corner of the 48 is empty");

console.log("— the cancellation, split by P6 — and the two controls that can kill it");
const W = MU.gauge_weight;
const led = p6Ledger(D["48"], W, D["48"], { eta: 1, etap: 1, n: 1 });
const per = led.find((x) => x.name === "periodic"), anti = led.find((x) => x.name === "antiperiodic");
ok(per.cancels, "periodic sector does NOT cancel for one 48(+,+)");
ok(!anti.cancels, "antiperiodic sector cancels, which would leave no potential at all");
eq(anti.sum, [[4.5, -1, 1]], "the whole residue, in one channel");

const other = p6Ledger(D["48"], W, D["48"], { eta: 1, etap: -1, n: 1 });
ok(!other.find((x) => x.name === "periodic").cancels,
   "CONTROL: a 48(+,-) cancels too — then the cancellation says nothing about the parity");

const fp = p6Ledger(D["48"], { periodic: W.periodic * 0.75, antiperiodic: W.antiperiodic },
                    D["48"], { eta: 1, etap: 1, n: 1 });
ok(!fp.find((x) => x.name === "periodic").cancels,
   "CONTROL: the Faddeev-Popov count cancels too — then the count is not what makes it happen");

console.log("— and it is one 48 exactly: n=2 overshoots, n=0 is the bare gauge");
ok(!p6Ledger(D["48"], W, D["48"], { n: 2 }).find((x) => x.name === "periodic").cancels,
   "two adjoints cancel the periodic sector");
ok(!p6Ledger(D["48"], W, D["48"], { n: 0 }).find((x) => x.name === "periodic").cancels,
   "no adjoint cancels the periodic sector");

console.log(`\n${bad ? `*** ${bad} FAILED of ${n}` : `all ${n} checks pass`} — multiplets.mjs`);
process.exit(bad ? 1 : 0);

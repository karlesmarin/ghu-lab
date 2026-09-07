/* _test_higgsrate.mjs — the first published number this repository reproduces in a rate channel.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The anchor is Carson-Okada, arXiv:1510.03092, Table 1, last row: with only the top Kaluza-Klein
 * modes counted, the ATLAS+CMS window 0.89 <= R_gg <= 1.19 puts the compactification scale above
 * 1.32 TeV.  Their eqs. (30) and (36) fix the whole chain and no parameter is free -- alpha_s and v
 * cancel in the ratio -- so this is a reproduction, not a fit, and a disagreement would mean this
 * repository had misread the paper.
 *
 * The checks that matter are the ones that could fail:
 *   * the number itself, to their two decimals;
 *   * that it is a reproduction and not a tuning: nothing here has a knob to turn;
 *   * the DIRECTION -- the tower is destructive, so only the lower edge of the window binds, and
 *     asking the upper edge for a bound must return nothing rather than a number from the wrong
 *     side;
 *   * and the boundary of what the anchor licenses: it is a resolution on a RATE, so the register
 *     must still refuse to decide an overlap with it.
 *
 *   node _test_higgsrate.mjs
 */
import { rggFromTopTower, mkkLowerBound, CARSON_OKADA_TOP_ROW } from "./src/kernel/higgsrate.mjs";
import { OBSERVABLES, overlapVerdict } from "./src/kernel/observables.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

const R = CARSON_OKADA_TOP_ROW;

console.log("=".repeat(96));
console.log("   higgsrate.mjs — Carson-Okada Table 1, last row, reproduced");
console.log("=".repeat(96));

console.log("\n   1 -- THE NUMBER\n");
const got = mkkLowerBound(R.rggWindow[0], R.mTop);
ok(Math.abs(got.bound / 1000 - R.theirs.mKK_TeV) < 0.005,
   "M_KK >= " + (got.bound / 1000).toFixed(3) + " TeV against their " + R.theirs.mKK_TeV + " TeV",
   "their eqs. (30) and (36), their M_t = " + R.mTop + ", their window edge " + R.rggWindow[0]);

/* it is a reproduction and not a fit: there is no knob.  Moving M_t by the PDG's own world average
 * moves the answer by less than a percent and NOTHING ELSE can move it at all. */
const pdg = mkkLowerBound(R.rggWindow[0], 172.57);
ok(Math.abs(pdg.bound / got.bound - 1) < 0.01,
   "and the only input that can move it is M_t, by under 1% over the PDG spread",
   (pdg.bound / 1000).toFixed(3) + " TeV at M_t = 172.57");

console.log("\n   2 -- THE CURVE IS THE RIGHT SHAPE, AND THE RIGHT SIGN\n");
ok(rggFromTopTower(2000, R.mTop) < 1 && rggFromTopTower(5000, R.mTop) < 1,
   "R_gg stays BELOW one at every scale: the tower is destructive, as they say",
   "R(2 TeV) = " + rggFromTopTower(2000, R.mTop).toFixed(4)
   + ", R(5 TeV) = " + rggFromTopTower(5000, R.mTop).toFixed(4));
ok(rggFromTopTower(5000, R.mTop) > rggFromTopTower(2000, R.mTop),
   "and it rises towards one as the scale rises — the KK modes decouple");
ok(Math.abs(rggFromTopTower(got.bound, R.mTop) - R.rggWindow[0]) < 1e-9,
   "the bound is exactly where the curve crosses the window edge, by construction");

/* THE DIRECTION, and it is the check that could have gone wrong silently.  Asking the UPPER edge
 * for a bound must refuse: R_gg never exceeds 1 here, so 1.19 constrains nothing. */
const wrongSide = mkkLowerBound(R.rggWindow[1], R.mTop);
ok(wrongSide.bound === null && wrongSide.why.includes("destructive"),
   "the upper edge of the window bounds NOTHING and the function says so",
   wrongSide.why.slice(0, 76));

console.log("\n   3 -- WHAT THE ANCHOR DOES NOT LICENSE\n");
ok(R.hypotheses.includes("SU(3)xU(1)'") && R.hypotheses.includes("only the top KK modes"),
   "the row travels with its hypotheses, so nobody transfers it by accident",
   R.hypotheses.slice(0, 72) + "...");
/* AND THE UNITS GATE STILL HOLDS.  A rate resolution, however well sourced, does not decide an
 * overlap.  This is the whole reason the anchor does not turn the register green. */
const asRate = { ...OBSERVABLES.higgs_couplings, resolution: 0.11, resolutionOf: "rate",
                 source: "reproduced here" };
const v = overlapVerdict(asRate, [[10, 0]]);
ok(v.verdict === "not-computed" && v.why.includes("not on the overlap"),
   "even a sourced, reproduced RATE resolution still cannot decide an overlap",
   v.why.slice(0, 80));

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

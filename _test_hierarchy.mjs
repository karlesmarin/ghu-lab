/* _test_hierarchy.mjs — the first physics section, checked against numbers made outside it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The entry condition of this project: a build does not merely produce a page, it re-runs the
 * page's own mathematics against numbers produced elsewhere.  Here "elsewhere" is the Part VII
 * Python engine, whose D and A_4 for the five published rows were written into data/su7_km25.json
 * by build/make_data.py.
 *
 * The sharpest test is the last one and it needs no external number at all: the closed form is
 * checked against a DIRECT NUMERICAL MINIMISATION of the same potential, computed here.  If the
 * expansion were wrong, that is what would catch it, and nothing else in this file would.
 *
 *   node _test_hierarchy.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete, validate, SCHEMA_VERSION } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { makeCard, toText } from "./src/kernel/card.mjs";
import { modules, certificates, sweepHierarchy } from "./src/modules/hierarchy.mjs";
import { anomaliesModule, bill } from "./src/modules/anomalies.mjs";
import { escapeModule } from "./src/modules/escape.mjs";
import { selectionModule, repFacts, halfDomain, centreCharge } from "./src/modules/selection.mjs";
import { termTable, moments, rung, numericMin, localMin, F, FGrid, coordinates, surfaceInvR5,
         kConst }
  from "./src/kernel/potential.mjs";
import { dF } from "./src/kernel/screens.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const MODS = [selectionModule(DATA), ...modules(DATA), anomaliesModule(DATA), escapeModule(DATA)];

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const modelOf = (row) => complete({ ...emptyModel(), group: DATA.group,
                                    orbifold: { name: DATA.orbifold.name }, bulk: row.bulk }).model;

H("the data file came from the source of truth, not from a keyboard");
ok("it names where it came from", DATA.source.extracted_from.includes("amin_closed_form.py"));
ok("it carries the gauge sector", DATA.gauge.length === 3);
ok("the derived half-integer weight is there — it is what makes 8D odd",
   DATA.gauge.some((t) => Math.abs(t[0] + 3.5) < 1e-12), JSON.stringify(DATA.gauge));
ok("four representations, eight parity assignments",
   Object.keys(DATA.reps).length === 4 &&
   Object.values(DATA.reps).every((r) => Object.keys(r).length === 2));

H("the five published rows, through the whole spine");
console.log(`  %-5s %6s %6s %11s %11s %9s %10s`.replace(/%-?\d*s/g, (m) => m),
            "row", "8D", "A4", "alpha", "numeric", "err %", "m_h");
let worstErr = 0;
for (const row of DATA.published_rows) {
  const model = modelOf(row);
  const { values, skipped } = resolve(MODS, model);
  const D8 = values.get("D8").value, A4 = values.get("A4").value;
  const a = values.get("alpha_min").value, mh = values.get("m_h").value;

  const terms = termTable(model, DATA);
  const an = numericMin(terms, { windings: model.conventions.windings });
  const err = 100 * (a - an) / an;
  worstErr = Math.max(worstErr, Math.abs(err));
  console.log(`  ${row.label.padEnd(5)} ${String(D8).padStart(6)} ${String(A4).padStart(6)} ` +
              `${a.toFixed(8)} ${an.toFixed(8)} ${err.toFixed(4).padStart(9)} ${mh.toFixed(3).padStart(10)}`);

  ok(`${row.label} · 8D matches the Python engine`, D8 === row.ours.D8, `${D8} vs ${row.ours.D8}`);
  ok(`${row.label} · A_4 matches the Python engine`, A4 === row.ours.A4, `${A4} vs ${row.ours.A4}`);
  ok(`${row.label} · G matches to 1e-9`,
     Math.abs(values.get("moments").value.G - row.ours.G) < 1e-9);
  ok(`${row.label} · both arithmetic laws hold`, values.get("laws").value.all === true);
  ok(`${row.label} · nothing was skipped`, skipped.length === 0, JSON.stringify(skipped));
  ok(`${row.label} · the closed form is within 1 % of a direct minimisation`, Math.abs(err) < 1.0,
     `${err.toFixed(3)} %`);
}
ok("worst closed-form error over the five rows is under 1 %", worstErr < 1.0,
   `${worstErr.toFixed(3)} %`);

H("the ladder, and the gauge sector's three rungs");
const gaugeOnly = termTable(complete({ ...emptyModel(), group: DATA.group,
                                       orbifold: { name: DATA.orbifold.name }, bulk: [] }).model, DATA);
ok("rung k=0 (the value) is 9", Math.round(rung(gaugeOnly, 0)) === 9, String(rung(gaugeOnly, 0)));
ok("rung k=1 (the curvature) is -27", Math.round(rung(gaugeOnly, 1)) === -27, String(rung(gaugeOnly, 1)));
ok("rung k=2 (the fourth moment) is -36", Math.round(rung(gaugeOnly, 2)) === -36, String(rung(gaugeOnly, 2)));
ok("odd, odd, EVEN — the obstruction dies at the fourth moment",
   Math.abs(rung(gaugeOnly, 0)) % 2 === 1 && Math.abs(rung(gaugeOnly, 1)) % 2 === 1 &&
   Math.abs(rung(gaugeOnly, 2)) % 2 === 0);

H("UNKNOWN is reached, not merely available");
const dead = complete({ ...emptyModel(), group: DATA.group, orbifold: { name: DATA.orbifold.name },
                        bulk: [{ rep: "7", parities: [1, 1], multiplicity: 1 }] }).model;
const rd = resolve(MODS, dead);
ok("a content with D <= 0 gives no vacuum", rd.values.get("alpha_min").status === STATUS.UNKNOWN);
ok("and it says WHY, naming D", rd.values.get("alpha_min").reason.includes("D ="),
   rd.values.get("alpha_min").reason);
ok("the hierarchy is unknown too", rd.values.get("invR5").status === STATUS.UNKNOWN);
ok("but the arithmetic still answers — it does not depend on the vacuum",
   rd.values.get("laws").status === STATUS.THEOREM);
ok("and the laws still hold for it", rd.values.get("laws").value.all === true);

H("the exported card");
const row2 = DATA.published_rows[1];
const { values } = resolve(MODS, modelOf(row2));
const card = makeCard(modelOf(row2), values, { version: "0.1.0",
                                               certificates: certificates(DATA) });
ok("carries the ceiling certificate, not just the number",
   card.certificates.ceiling.method.includes("dual"));
ok("the ceiling is a theorem, the Higgs mass is measured",
   card.results.ceiling_fraction.status === STATUS.THEOREM &&
   card.results.m_h.status === STATUS.MEASURED);
ok("and the anchor caveat travels with the measured numbers",
   card.results.m_h.source.includes("anchor band"));
/* Adding the anomalies section made this card's summary WEAKER, and correctly: the section
 * declares one thing it cannot compute, so the honest summary of the whole run is "unknown".
 * A card whose weakest element is an unknown must say so — that is the summary earning its keep. */
ok("the weakest thing in the card is named, and it is the declared gap",
   card.summary.weakest === STATUS.UNKNOWN, card.summary.weakest);
/* By NAME, not by count.  Pinning the number of unknowns is measuring progress again -- it broke
 * the moment the selection module added two honest ones, exactly as the section-count assertion
 * broke earlier.  What is invariant is WHICH values this data file cannot answer. */
const unknownKeys = Object.entries(card.results)
  .filter(([, v]) => v.status === STATUS.UNKNOWN).map(([k]) => k).sort();
/* `channels` LEFT this set on 2026-08-26: the escape module computes them (Part VI ported), so
 * the honest unknown became a theorem.  The set shrinking is the point of naming it. */
ok("the unknowns are exactly the ones this data file cannot answer",
   unknownKeys.join(",") === "domain_check,legal_domain,rep_facts", unknownKeys.join(","));
/* `domain_check` joined the set when the selection module gained the ability to TEST its own rule
 * against the potential.  For SU(7) it cannot: no Dynkin labels, so no rule to test.  The set grew
 * by one and the test named it -- which is the whole reason it is a set of names and not a count. */
ok("and every one of them says why",
   unknownKeys.every((k) => (card.results[k].reason || "").length > 30));
ok("and the card still carries proved and measured values beside it",
   card.summary.tally.theorem > 0 && card.summary.tally.measured > 0);
const txt = toText(card);
ok("the text form carries the author's ORCID", txt.includes("0009-0007-5637-9688"));
ok("and the certificate", txt.includes("certificates"));

/* ---- the sweep: the closed form on the whole lattice, not on five rows ------------------- */
/* The page runs this behind a button, so the harness runs the same call and refuses to take any of
 * its output on trust -- the classification has to partition, the two "worst" cases have to be
 * rebuildable from the multiplicity vectors it returns, and the grid must not be deciding. */
H("the sweep, and whether it earns its own numbers");
const SW = sweepHierarchy(DATA);
console.log(`  ${SW.contents} contents · ${SW.tested} with a vacuum · worst ` +
            `${(100 * SW.worstInRegime).toFixed(3)} % in regime, ${(100 * SW.worst).toFixed(2)} % ` +
            `overall · median ${(100 * SW.median).toFixed(3)} % · ${SW.notGlobal} not global`);

ok("the enumeration is every multiset of the eight slots: C(N+8,8)-1",
   SW.contents === 1286 && SW.slots.length === 8, `${SW.contents}, ${SW.slots.length} slots`);
ok("every content is accounted for — the classes partition, nothing is silently dropped",
   SW.tested + SW.noVacuum + SW.noSolution + SW.notMinimum + SW.atEdge === SW.contents,
   `${SW.tested}+${SW.noVacuum}+${SW.noSolution}+${SW.notMinimum}+${SW.atEdge} vs ${SW.contents}`);
ok("the factoring into atoms IS F, not an approximation of it",
   SW.control.exact && SW.control.factoring < 1e-9, SW.control.factoring.toExponential(2));
ok("and minima found inside a bracket agree with unbracketed ones far below the error reported",
   SW.control.trustworthy && SW.control.n > 0,
   `${SW.control.n} contents, worst ${SW.control.worstDisagreement.toExponential(2)} vs ` +
   `worst error ${SW.worst.toExponential(2)}`);

/* The regime split is the point, so it has to be a real split and not a relabelling. */
ok("the regime boundary is OUR alpha on their rows (0.0836), and worstErr sits under it",
   Math.abs(SW.regimeAlphaMax - 0.0836) < 5e-4 && 100 * SW.worstInRegime >= worstErr - 1e-9,
   `alpha_max ${SW.regimeAlphaMax.toFixed(5)}, in-regime worst ` +
   `${(100 * SW.worstInRegime).toFixed(4)} % vs the five rows' ${worstErr.toFixed(4)} %`);
/* the audit's finding: "the largest alpha their Table 1 reaches" is their PRINTED 0.081, and the
 * sweep used to hand the reader 0.0836 under that name */
ok("and the published maximum is read from their table, not recomputed: 0.081",
   SW.publishedAlphaMax === 0.081 &&
   SW.publishedAlphaMax === Math.max(...DATA.published_rows.map((r) => r.published.alpha_min)),
   String(SW.publishedAlphaMax));
ok("and it bites: the closed form is an order of magnitude worse outside that range than inside",
   SW.worst > 10 * SW.worstInRegime,
   `${(100 * SW.worst).toFixed(2)} % vs ${(100 * SW.worstInRegime).toFixed(3)} %`);

/* THE PAPER'S NUMBER, REPRODUCED WHERE IT APPLIES.  Part VII quotes a median 0.13 % over 272
 * SYNTHETIC contents; this is 1 286 lattice contents, and the near-coincidence of 266 with 272 is a
 * trap.  Inside the alpha range their table reaches, the two must land on top of each other -- and
 * the overall median must be visibly worse, or the split is not doing any work. */
ok("inside their alpha range the sweep reproduces the paper's median of 0.13 %",
   SW.medianInRegime > 0.0005 && SW.medianInRegime < 0.0026,
   `${(100 * SW.medianInRegime).toFixed(3)} % against 0.13 %`);
ok("and the overall median is several times worse — the extrapolation is what moves it",
   SW.median > 3 * SW.medianInRegime,
   `${(100 * SW.median).toFixed(3)} % vs ${(100 * SW.medianInRegime).toFixed(3)} %`);

/* The two headline contents, rebuilt from the vectors the sweep hands back and re-minimised here. */
const bulkOf = (mult) => mult.map((k, i) => ({ rep: SW.slots[i].rep, multiplicity: k,
    parities: [1, SW.slots[i].key[3] === "+" ? 1 : -1] })).filter((b) => b.multiplicity);
const rebuild = (rec) => termTable({ bulk: bulkOf(rec.mult) }, DATA);
ok("the worst content is rebuildable from the vector it returns, and reproduces its own alpha",
   Math.abs(moments(rebuild(SW.worstAt)).D * 8 -
            Math.round(moments(rebuild(SW.worstAt)).D * 8)) < 1e-9 &&
   Math.abs(numericMin(rebuild(SW.worstAt), { windings: SW.windings }) - SW.worstAt.numeric) /
     SW.worstAt.numeric < 1e-4,
   `${SW.worstAt.content}: ${SW.worstAt.numeric}`);

/* NOT-GLOBAL IS A CLAIM ABOUT F, AND IT IS CHECKED AGAINST F.  The first version of this sweep
 * called these contents a 96 % error; they are not an error at all, and the only way to be sure of
 * which is to evaluate the potential at both points. */
ok("contents whose branch minimum is not the deepest point of F exist — the split is not decorative",
   SW.notGlobal > 0 && !!SW.notGlobalAt, `${SW.notGlobal}`);
if (SW.notGlobalAt) {
  const t = rebuild(SW.notGlobalAt);
  const fb = F(t, SW.notGlobalAt.branch, SW.windings), fd = F(t, SW.notGlobalAt.deepest, SW.windings);
  ok("and F really is lower at the deepest point than on the branch — checked, not asserted",
     fd < fb, `F(branch)=${fb.toFixed(6)} vs F(deepest)=${fd.toFixed(6)}`);
  ok("the branch point really is a minimum too, not a shoulder",
     F(t, SW.notGlobalAt.branch * 0.98, SW.windings) > fb &&
     F(t, SW.notGlobalAt.branch * 1.02, SW.windings) > fb);
}

/* A GRID IS A SPEED KNOB UNTIL IT IS SHOWN NOT TO BE.  Same sweep, four times the grid. */
const SW4 = sweepHierarchy(DATA, { maxN: 4, grid: 2000 });
const SW4f = sweepHierarchy(DATA, { maxN: 4, grid: 8000 });
ok("four times the grid moves neither the classification nor the worst case",
   SW4.tested === SW4f.tested && SW4.notGlobal === SW4f.notGlobal &&
   Math.abs(SW4.worst - SW4f.worst) / SW4f.worst < 1e-4,
   `${SW4.tested}/${SW4f.tested} tested, worst ${SW4.worst.toExponential(6)} vs ` +
   `${SW4f.worst.toExponential(6)}`);

/* ---- the published Part VII, not the draft ------------------------------------------------ */
/* Everything below is checked against numbers the Part VII ancillary scripts archived beside the
 * paper -- vacuum_constraint.py, W_is_half_odd.py, certify_212_215.py, lattice_lift.py,
 * congruences.py, gauge_ghost_seed.py -- and carried into the data file by make_data.py, which
 * refuses to type any of them. */
H("the other symmetric point: W, and the vacuum that is or is not the true one");
const W_ARCHIVE = { "(1)": 63 / 2, "(2)": 75 / 2, "(3)": 75 / 2, "(4)": 73 / 2, "(5)": 69 / 2 };
for (const row of DATA.published_rows) {
  const m = modelOf(row);
  const { values: v } = resolve(MODS, m);
  const W = v.get("W").value;
  ok(`${row.label} · W = ${W} as W_is_half_odd.py has it`, W === W_ARCHIVE[row.label],
     `${W} vs ${W_ARCHIVE[row.label]}`);
  ok(`${row.label} · 2W is odd`, Math.abs((2 * W) % 2) === 1);
  const t = termTable(m, DATA);
  const gapNum = F(t, 1, 4000) - F(t, 0, 4000), gapClosed = v.get("vacuum").value.F1_minus_F0;
  ok(`${row.label} · F(1) - F(0) = (31/16) zeta(5) W against the summed potential`,
     Math.abs(gapNum - gapClosed) < 1e-6 * Math.abs(gapClosed), `${gapNum} vs ${gapClosed}`);
  ok(`${row.label} · its electroweak point is the true vacuum`, v.get("vacuum").value.true === true);
}

/* THE CEILING'S OWN WITNESS FAILS THE TEST THE CERTIFICATE NEVER APPLIED.  The content that attains
 * 10.01 TeV has a fine interior minimum and sits 316 below it at alpha = 1. */
const C = DATA.ceilings;
ok("the data carries the four levels of the ceiling", !!C && !!C.relaxation && !!C.attained &&
   !!C.true_vacuum && !!C.measured_mh && C.asymptote_GeV > 0);
ok("and they are ordered: relaxation > attained > true vacuum > at the measured mass > asymptote",
   C.relaxation.GeV > C.attained.GeV && C.attained.GeV > C.true_vacuum.GeV &&
   C.true_vacuum.GeV > C.measured_mh.GeV && C.measured_mh.GeV > C.asymptote_GeV,
   [C.relaxation.GeV, C.attained.GeV, C.true_vacuum.GeV, C.measured_mh.GeV, C.asymptote_GeV].join(" > "));
{
  const w = modelOf({ bulk: C.attained.witness });
  const { values: v } = resolve(MODS, w);
  ok("the attained witness sits at (A4, 8D) = (212, 1)",
     v.get("A4").value === 212 && v.get("D8").value === 1,
     `${v.get("A4").value}, ${v.get("D8").value}`);
  ok("its W is -315/2, as the archive has it", v.get("W").value === -315 / 2, String(v.get("W").value));
  ok("so it is a FALSE vacuum, and the module says so", v.get("vacuum").value.true === false);
  ok("its stationary point is still a minimum with m_h inside the window -- the trap is real",
     v.get("m_h").status === STATUS.MEASURED && v.get("in_window").value === true,
     `${v.get("m_h").value}`);
  ok("and the source of that m_h names the false vacuum", /FALSE vacuum/.test(v.get("m_h").source));
  const t = termTable(w, DATA);
  ok("F really is lower at alpha = 1 than at the interior minimum -- checked on the summed potential",
     F(t, 1, 2000) < F(t, v.get("alpha_min").value, 2000),
     `F(1)=${F(t, 1, 2000).toFixed(3)} F(a)=${F(t, v.get("alpha_min").value, 2000).toFixed(3)}`);
  /* The levels of the ceiling are identity (II) read at the top of the window, m_h = 127: the
   * surface, not the content's own closed form (whose m_h is 126.25 here). */
  ok("identity (II) at (212, 1) and m_h = 127 gives the attained level, 10.01 TeV",
     Math.abs(surfaceInvR5({ A4: 212, D8: 1 }, 127, 80.4, 0.63) - C.attained.GeV) < 1.5,
     `${surfaceInvR5({ A4: 212, D8: 1 }, 127, 80.4, 0.63)}`);
  ok("and at (215, 1) the relaxation's 10.03 TeV",
     Math.abs(surfaceInvR5({ A4: 215, D8: 1 }, 127, 80.4, 0.63) - C.relaxation.GeV) < 1.5);
}
{
  const w = modelOf({ bulk: C.true_vacuum.witness });
  const { values: v } = resolve(MODS, w);
  ok("the true-vacuum witness sits at (A4, 8D) = (104, 1)",
     v.get("A4").value === C.true_vacuum.A4 && v.get("D8").value === 1);
  ok("its W is 5/2 and it IS the true vacuum",
     v.get("W").value === C.true_vacuum.witness_W && v.get("vacuum").value.true === true);
  ok(`identity (II) at (104, 1) and m_h = 127 gives the physical ceiling, ${C.true_vacuum.GeV} GeV`,
     Math.abs(surfaceInvR5({ A4: 104, D8: 1 }, 127, 80.4, 0.63) - C.true_vacuum.GeV) < 1.5,
     `${surfaceInvR5({ A4: 104, D8: 1 }, 127, 80.4, 0.63)}`);
  ok(`and at (${C.measured_mh.A4}, 1) and the measured m_h = ${C.measured_mh.m_h} the ${C.measured_mh.GeV} GeV benchmark`,
     Math.abs(surfaceInvR5({ A4: C.measured_mh.A4, D8: 1 }, C.measured_mh.m_h, 80.4, 0.63) -
              C.measured_mh.GeV) < 1.5);
  ok(`the witness's own closed form lands on the archive's exact ${C.true_vacuum.exact.GeV} GeV`,
     Math.abs(v.get("invR5").value - C.true_vacuum.exact.GeV) < 3, `${v.get("invR5").value}`);
  ok("and it is measured against the true-vacuum level, not the relaxation, sitting just under it",
     v.get("ceiling_fraction").value < 1 && v.get("ceiling_fraction").value > 0.99 &&
     /true vacuum/.test(v.get("ceiling_fraction").source), `${v.get("ceiling_fraction").value}`);
  const t = termTable(w, DATA);
  const an = numericMin(t, { windings: 2000 });
  ok(`re-minimised on the summed potential it gives ${C.true_vacuum.exact.GeV} GeV, as the archive says`,
     Math.abs(2 * 80.4 / an - C.true_vacuum.exact.GeV) < 3 &&
     Math.abs(an - C.true_vacuum.exact.alpha) < 2e-5, `alpha ${an}, ${2 * 80.4 / an} GeV`);
  ok("with m_h inside the window", v.get("in_window").value === true, `${v.get("m_h").value}`);
}
/* A content the shell can build with W < 0 AND an electroweak point to be wrong about, so the
 * false-vacuum verdict is reachable from the page and not only from the archive's witness.  This
 * used to be row (2) + 40 x 7(+,-), which drives W to -5/2 but ALSO kills the branch: the
 * stationarity condition has no small-alpha solution there, so the content it tested has no
 * electroweak point at all, and the `false` it asserted was the null-vs-false bug of the second
 * outside audit reading as a verdict.  6 x 7(+,+) + 32 x 28(+,-) has 8D = 1 > 0, a branch at
 * alpha = 0.0334, and W = -183/2. */
{
  const w = modelOf({ bulk: [{ rep: "7", parities: [1, 1], multiplicity: 6 },
                             { rep: "28", parities: [1, -1], multiplicity: 32 }] });
  const { values: v } = resolve(MODS, w);
  const vv = v.get("vacuum").value;
  ok("a hand-built content with W < 0 is called a false vacuum too",
     v.get("W").value === -91.5 && v.get("alpha_min").status !== "unknown" &&
     vv.true === false && vv.state === "false-vacuum",
     `W=${v.get("W").value}, alpha=${v.get("alpha_min").value}, state=${vv.state}`);
}

/* ---- the SECOND outside audit, 2026-08-27: `true` was not a boolean question ---- */
{
  console.log("\nthe second outside audit: the verdict can fail to have a subject");
  /* 2 x 7(+,+): the gauge seed gives 8D = -27, 2W = -3 and each 7(+,+) adds 8D = -6, 2W = +2, so
   * 8D = -39 < 0 with 2W = +1 > 0.  No electroweak breaking, W > 0 -- and the old
   * `symmetricOK && deepest !== false` returned TRUE, because `deepest` was null and in this
   * language null !== false.  The screen said the right thing; the exported object did not. */
  const two7 = modelOf({ bulk: [{ rep: "7", parities: [1, 1], multiplicity: 2 }] });
  const { values: v2 } = resolve(MODS, two7);
  const mo2 = v2.get("moments").value, vac2 = v2.get("vacuum").value;
  ok("2 x 7(+,+): 8D = -39 < 0 and 2W = +1 > 0, exactly as the audit computed by hand",
     Math.abs(mo2.D * 8 + 39) < 1e-12 && 2 * v2.get("W").value === 1,
     `8D=${mo2.D * 8}, 2W=${2 * v2.get("W").value}`);
  ok("there is no electroweak breaking, so alpha_min is unknown",
     v2.get("alpha_min").status === STATUS.UNKNOWN);
  ok("...and vacuum.true is NULL, not true: the question has no subject",
     vac2.true === null && vac2.state === "no-electroweak-breaking",
     `true=${JSON.stringify(vac2.true)}, state=${vac2.state}`);
  ok("the symmetric half is still reported, because it is still a fact about W",
     vac2.symmetric_ok === true);
  ok("and the source says so in words, not only in a field",
     /no electroweak breaking/.test(vac2.state.replace(/-/g, " ")) &&
     /is null, not a verdict/.test(v2.get("vacuum").source));
  /* the other way to have no subject: D > 0, but no small-alpha branch */
  const nb = modelOf({ bulk: [...DATA.published_rows[1].bulk,
                              { rep: "7", parities: [1, -1], multiplicity: 40 }] });
  const vnb = resolve(MODS, nb).values.get("vacuum").value;
  ok("D > 0 with no branch located is its own state, and also null",
     vnb.state === "no-branch-located" && vnb.true === null, vnb.state);

  /* the globality test no longer rests on a positional tolerance: two refined minima, compared
   * by depth.  On the five published rows the branch minimum IS the global one, to the digit. */
  for (const row of DATA.published_rows) {
    const vv = resolve(MODS, modelOf(row)).values.get("vacuum").value;
    ok(`${row.label} · the refined branch minimum and the global one are the same point`,
       Math.abs(vv.alpha_local - vv.alpha_global) < 1e-6 && vv.deepest === true,
       `local=${vv.alpha_local}, global=${vv.alpha_global}`);
  }
  /* and on the counterexample they are two different points, and the deeper one wins */
  const cx2 = modelOf({ bulk: [{ rep: "7", parities: [1, 1], multiplicity: 1 },
                               { rep: "48", parities: [1, -1], multiplicity: 1 },
                               { rep: "84", parities: [1, 1], multiplicity: 1 }] });
  const vcx = resolve(MODS, cx2).values.get("vacuum").value;
  ok("the counterexample: the branch refines to 0.0839, the global point is 0.5660, F lower by 1.07",
     Math.abs(vcx.alpha_local - 0.0839) < 5e-4 && Math.abs(vcx.alpha_global - 0.5660) < 5e-4 &&
     Math.abs(vcx.F_gap_to_global + 1.0717) < 1e-3,
     `local=${vcx.alpha_local}, global=${vcx.alpha_global}, gap=${vcx.F_gap_to_global}`);
  /* falsification of the instrument: localMin must find the branch minimum from a start that is
   * NOT it -- otherwise it is returning its input */
  {
    const terms = termTable(cx2, DATA);
    const OPT = { n: 800, refine: 30, windings: 300 };
    const fromLow = localMin(terms, 0.05, OPT), fromHigh = localMin(terms, 0.12, OPT);
    ok("localMin is not returning its own input: two different starts land on the same minimum",
       fromLow !== null && fromHigh !== null && Math.abs(fromLow - fromHigh) < 1e-5 &&
       Math.abs(fromLow - vcx.alpha_local) < 1e-5,
       `${fromLow} vs ${fromHigh} vs ${vcx.alpha_local}`);
    ok("...and started at the deep basin it returns THAT one, not the branch",
       Math.abs(localMin(terms, 0.5, OPT) - vcx.alpha_global) < 1e-3,
       String(localMin(terms, 0.5, OPT)));
  }
}

H("the five coordinates, and Theorem 3");
const CO = DATA.coordinates;
ok("the data carries every generator's archived coordinates", !!CO && Object.keys(CO.generators).length === 8);
for (const [name, want] of Object.entries(CO.generators)) {
  const rep = name.slice(0, name.indexOf("(")), key = name.slice(name.indexOf("("));
  const t = DATA.reps[rep][key];
  const c = coordinates(t);
  const got = [c.A4, c.D8, c.U2, c.V, c.W2];
  ok(`${name} · (A4, 8D, 2U, V, 2W) = (${want.join(", ")}) as lattice_lift.py has it`,
     got.every((x, i) => Math.abs(x - want[i]) < 1e-9), got.join(", "));
  /* 8D, 2U and 2W: even for every multiplet, so their parity class is the gauge base point's
   * alone -- Part VII eq. (31).  A4 and V are not (7(+,-) has A4 = 1, 84(+,-) has V = 81). */
  ok(`${name} · 8D, 2U and 2W are even -- matter cannot change the parity class`,
     [c.D8, c.U2, c.W2].every((x) => Math.abs(x % 2) < 1e-9));
}
{
  const g = coordinates(DATA.gauge);
  ok("the gauge sector's coordinates are (-18, -27, -39, 0, -3)",
     [g.A4, g.D8, g.U2, g.V, g.W2].join(",") === CO.gauge.join(","), [g.A4, g.D8, g.U2, g.V, g.W2].join(","));
}
/* the archived probes: the witness and the five rows, in (A4, 8D, 2U, V, 2W) */
for (const [label, want] of Object.entries(CO.probes)) {
  const rowMatch = label.match(/row \((\d)\)/);
  const bulk = rowMatch ? DATA.published_rows[+rowMatch[1] - 1].bulk : C.true_vacuum.witness;
  const c = coordinates(termTable(modelOf({ bulk }), DATA));
  const got = [c.A4, c.D8, c.U2, c.V, c.W2];
  ok(`${label.replace(/\\cite\{KM25\}/, "KM25")} · coordinates (${want.join(", ")})`,
     got.every((x, i) => Math.abs(x - want[i]) < 1e-9), got.join(", "));
  /* the four congruences of Part VII eq. (64), on the affine coset of the printed seed */
  const md = (x, n) => ((x % n) + n) % n;
  const [A4, D8, U2, V, W2] = got;
  ok(`${label.replace(/\\cite\{KM25\}/, "KM25")} · obeys the four congruences of eq. (64)`,
     md(D8 + U2 + W2, 2) === 1 && md(D8 - U2 - 4 * W2, 8) === 0 &&
     md(A4 + D8 + 3 * U2 - V, 9) === 0 && md(W2 + 2 * A4 + 12 * D8 + 3 * U2, 32) === 0 &&
     md(V, 81) === 0);
}
/* Theorem 3, on the three relations of the kernel: same five coordinates, same potential. */
const REL = [
  [[{ rep: "28", parities: [1, 1], multiplicity: 1 }],
   [{ rep: "7", parities: [1, 1], multiplicity: 20 }, { rep: "7", parities: [1, -1], multiplicity: 17 }]],
  [[{ rep: "48", parities: [1, 1], multiplicity: 1 }],
   [{ rep: "7", parities: [1, 1], multiplicity: 24 }, { rep: "7", parities: [1, -1], multiplicity: 18 }]],
  [[{ rep: "48", parities: [1, -1], multiplicity: 1 }],
   [{ rep: "7", parities: [1, 1], multiplicity: 1 }, { rep: "7", parities: [1, -1], multiplicity: 4 },
    { rep: "28", parities: [1, -1], multiplicity: 1 }]],
];
for (const [a, b] of REL) {
  const ca = coordinates(termTable(modelOf({ bulk: a }), DATA)), cb = coordinates(termTable(modelOf({ bulk: b }), DATA));
  const same = ["A4", "D8", "U2", "V", "W2"].every((k) => Math.abs(ca[k] - cb[k]) < 1e-9);
  let worst = 0;
  const ta = termTable(modelOf({ bulk: a }), DATA), tb = termTable(modelOf({ bulk: b }), DATA);
  for (const al of [0.01, 0.1, 0.25, 0.5, 0.77, 1]) worst = Math.max(worst, Math.abs(F(ta, al, 600) - F(tb, al, 600)));
  ok(`${a[0].rep}(${a[0].parities}) and its kernel partner agree on all five coordinates AND on F: ` +
     `worst |dF| = ${worst.toExponential(1)}`, same && worst < 1e-9);
}
{
  /* and a pair that differs in exactly one coordinate does NOT share a potential */
  const ta = termTable(modelOf({ bulk: [{ rep: "7", parities: [1, 1], multiplicity: 1 }] }), DATA);
  const tb = termTable(modelOf({ bulk: [{ rep: "7", parities: [1, -1], multiplicity: 1 }] }), DATA);
  ok("the control: 7(+,+) against 7(+,-) differ in coordinates and in F",
     Math.abs(F(ta, 0.3, 600) - F(tb, 0.3, 600)) > 1e-3);
}

H("the gauge-seed fork of Part VII section 13");
const SEEDS = DATA.gauge_seeds;
ok("both seeds are carried, and the printed one is the default", !!SEEDS.published && !!SEEDS.candidate &&
   complete({ ...emptyModel(), group: DATA.group, orbifold: { name: DATA.orbifold.name }, bulk: [] })
     .model.conventions.gauge_seed === "published");
ok("the printed seed's gauge list is the data file's gauge list",
   JSON.stringify(SEEDS.published.gauge) === JSON.stringify(DATA.gauge));
{
  const cg = coordinates(SEEDS.candidate.gauge);
  ok("the candidate base point is (-27/2, -18, -30, 0, -3), as gauge_ghost_seed.py derives it",
     [cg.A4, cg.D8, cg.U2, cg.V, cg.W2].join(",") === SEEDS.candidate.five.join(","),
     [cg.A4, cg.D8, cg.U2, cg.V, cg.W2].join(","));
  const pg = coordinates(SEEDS.published.gauge);
  const shift = [2 * (cg.A4 - pg.A4), cg.D8 - pg.D8, cg.U2 - pg.U2, cg.V - pg.V, cg.W2 - pg.W2];
  ok("the shift between the seeds is (9, 9, 9, 0, 0) in (2A4, 8D, 2U, V, 2W)",
     shift.join(",") === "9,9,9,0,0", shift.join(","));
}
const onSeed = (row, seed) => resolve(MODS, complete({ ...emptyModel(), group: DATA.group,
  orbifold: { name: DATA.orbifold.name }, bulk: row.bulk, conventions: { gauge_seed: seed } }).model).values;
for (const row of DATA.published_rows) {
  const p = onSeed(row, "published"), c = onSeed(row, "candidate");
  ok(`${row.label} · on the printed seed 8D is odd and the laws hold`,
     p.get("laws").value.odd && p.get("laws").value.all && p.get("laws").value.parityAsSeed);
  ok(`${row.label} · on the candidate seed 8D is EVEN, A4 half-integral, and the laws still hold`,
     !c.get("laws").value.odd && !c.get("laws").value.A4integral && c.get("laws").value.all &&
     c.get("laws").value.mod6 && c.get("laws").value.w2odd,
     JSON.stringify(c.get("laws").value));
  ok(`${row.label} · 8D moves by exactly 9 and W does not move at all`,
     c.get("D8").value - p.get("D8").value === 9 && c.get("W").value === p.get("W").value);
  ok(`${row.label} · the D8 source says the theorem's hypothesis is not met, not that it failed`,
     /hypothesis/.test(c.get("D8").source));
}
ok("the candidate seed's relaxation ceiling is lower and sits one rung up, at 8D = 2",
   SEEDS.candidate.ceiling_GeV < SEEDS.published.ceiling_GeV && SEEDS.candidate.ceiling_8D === 2 &&
   SEEDS.published.ceiling_8D === 1, `${SEEDS.candidate.ceiling_GeV} vs ${SEEDS.published.ceiling_GeV}`);
{
  /* A physics failure becomes `unknown` and the run continues -- and a seed that does not exist
   * must land there, naming itself, rather than fall back to the printed one in silence. */
  const v = onSeed(DATA.published_rows[0], "no-such-seed");
  ok("an unknown seed name is refused, not silently defaulted",
     v.get("moments").status === STATUS.UNKNOWN && /no-such-seed/.test(v.get("moments").reason),
     v.get("moments").reason);
  ok("and everything downstream is unknown with it", v.get("invR5").status === STATUS.UNKNOWN);
}

/* ---- the sixth row, pre-registered -- against su7_sixth_row.py's archive ------------------ */
{
  console.log("\nthe sixth row, pre-registered");
  const S = DATA.sixth_row;
  ok("the two archived ratios are the paper's 1.94 and 1.20",
     Math.abs(S.ratio_with48 - 1.94) < 1e-3 && Math.abs(S.ratio_no48 - 1.199) < 1e-3);
  ok("one candidate carries a 48 and the other does not -- that is the whole point",
     S.candidates.length === 2 && (S.candidates[0].n48 > 0) !== (S.candidates[1].n48 > 0));
  /* The archive minimised the EXACT potential; the resolver's headline is the closed form.
   * Compare each with its own kind: numericMin against the archived alpha, the exact second
   * derivative against the archived m_h -- and then pin the closed form to the archived value
   * by the sweep's own error law, so the 0.4 % gap is a stated property and not a surprise. */
  for (const c of S.candidates) {
    const m = complete({ ...emptyModel(), group: DATA.group,
                         orbifold: { name: DATA.orbifold.name }, bulk: c.bulk }).model;
    const v = resolve(MODS, m).values;
    const t = termTable(m, DATA);
    const aNum = numericMin(t);
    ok(`${c.kind}: the exact minimum re-derives the archived alpha (${c.a_ours.toFixed(4)})`,
       aNum !== null && Math.abs(aNum - c.a_ours) / c.a_ours < 1e-3,
       String(aNum));
    const mhExact = kConst(m.conventions.m_W, m.conventions.g4) *
                    Math.sqrt(dF(t, aNum, 2)) / aNum;
    ok(`${c.kind}: and the archived m_h at g4 = 0.63 (${c.mh_ours.toFixed(1)})`,
       Math.abs(mhExact - c.mh_ours) / c.mh_ours < 1e-3, mhExact.toFixed(3));
    ok(`${c.kind}: the closed form sits within its own stated error law of the archived value`,
       Math.abs(v.get("alpha_min").value - c.a_ours) / c.a_ours < 0.0071);
    ok(`${c.kind}: the bulk parses back to exactly the archived n(48)`,
       c.bulk.filter((b) => b.rep === "48").reduce((s, b) => s + b.multiplicity, 0) === c.n48);
  }
  ok("the committed numbers as printed: 0.0378 / 0.0612 on the 48-rich candidate",
     Math.abs(S.candidates[0].a_ours / S.ratio_with48 - 0.0378) < 5e-5 &&
     Math.abs(S.candidates[0].a_ours / S.ratio_no48 - 0.0612) < 5e-5);
  ok("and 0.0240 / 0.0148 on the 48-free one",
     Math.abs(S.candidates[1].a_ours / S.ratio_no48 - 0.0240) < 5e-5 &&
     Math.abs(S.candidates[1].a_ours / S.ratio_with48 - 0.0148) < 5e-5);
  ok("the two readings differ by the 1.62 two significant figures resolve",
     Math.abs(S.ratio_with48 / S.ratio_no48 - 1.62) < 0.005);
  /* the confound itself, on their own five rows: every 48-carrying row sits below every
   * 48-free row in published alpha -- which is why no existing row can decide the locus */
  const with48 = [], without = [];
  for (const row of DATA.published_rows) {
    const n = row.bulk.filter((b) => b.rep === "48").reduce((s, b) => s + b.multiplicity, 0);
    (n > 0 ? with48 : without).push(row.published.alpha_min);
  }
  ok("the confound is real: max(alpha with a 48) < min(alpha without), on their five rows",
     with48.length >= 2 && without.length >= 2 && Math.max(...with48) < Math.min(...without));
}

/* ---- the wedge: the donation headline as a region, against su7_repair_space.py ------------ */
{
  console.log("\nthe wedge -- the headline as a region of repair space");
  const W = DATA.wedge;
  const mk6 = (bulk) => complete({ ...emptyModel(), group: DATA.group,
                                   orbifold: { name: DATA.orbifold.name }, bulk }).model;
  const gaugeD = moments(termTable(mk6([]), DATA)).D;
  const matterD = (rep) => moments(termTable(mk6([{ rep, parities: [1, 1], multiplicity: 1 }]),
                                             DATA)).D - gaugeD;
  ok("the gauge base point is -27/8 and the per-multiplet weights are 2, 5/4 -- exact eighths",
     gaugeD === -27 / 8 && matterD("28") === 2 && matterD("84") === 5 / 4);
  ok("w(48) multiplies ZERO: the 48(+,+) contributes nothing to D, for every value of its weight",
     matterD("48") === 0);
  ok("...and the largest repair the anchor asks for is recorded: w(48) = 5.59",
     W.w48_largest_repair === 5.59);
  const nOf = (i, rep) => DATA.published_rows[i].bulk
    .filter((b) => b.rep === rep && b.parities[0] > 0 && b.parities[1] > 0)
    .reduce((s, b) => s + b.multiplicity, 0);
  const co = (i) => ({ k28: nOf(i, "28") * 2, k84: (nOf(i, "84") - 1) * 5 / 4 });
  const A = co(1), B = co(2);
  ok("the two inequalities read off the published rows' own bulks: (2, 15/4) and (2, 5/4)",
     A.k28 === 2 && A.k84 === 15 / 4 && B.k28 === 2 && B.k84 === 5 / 4);
  let off = 0, flagBad = 0;
  for (const f of W.fitted) {
    const d2 = gaugeD + A.k28 * f.w28 + A.k84 * f.w84;
    const d3 = gaugeD + B.k28 * f.w28 + B.k84 * f.w84;
    if (Math.abs(d2 - f.D2_donated) > 1e-9 || Math.abs(d3 - f.D3_donated) > 1e-9) off++;
    if (f.headline !== (d2 > 0 && d3 < 0)) flagBad++;
  }
  ok(`the plane reproduces every archived fitted point (${W.fitted.length} of them)`, off === 0);
  ok("and each point's headline flag is exactly D2 > 0 AND D3 < 0", flagBad === 0);
  ok("w = 1 is a fitted point, and the headline holds there",
     W.fitted.some((f) => f.w28 === 1 && f.w84 === 1 && f.headline === true));
  ok("the EDGE point sits exactly on the boundary: D2 = 0, headline false",
     W.fitted.some((f) => f.headline === false && Math.abs(f.D2_donated) < 1e-12));
  const lo = (-gaugeD) / (A.k28 + A.k84), hi = (-gaugeD) / (B.k28 + B.k84);
  ok("the diagonal interval is 27/46 to 27/26, as archived",
     Math.abs(lo - W.w_diagonal_interval[0]) < 1e-12 &&
     Math.abs(hi - W.w_diagonal_interval[1]) < 1e-12 &&
     Math.abs(lo - 27 / 46) < 1e-15 && Math.abs(hi - 27 / 26) < 1e-15);
  ok("a factor 1.77 wide, and it contains w = 1", Math.abs(hi / lo - 1.77) < 0.005 &&
     lo < 1 && 1 < hi);
}

/* ---- the outside audit of 2026-08-26: four findings, each pinned to fail on the old code ---- */
{
  console.log("\nthe outside audit: W > 0 is necessary, not sufficient -- and three more");
  const mk = (bulk) => complete({ ...emptyModel(), group: DATA.group,
                                  orbifold: { name: DATA.orbifold.name }, bulk }).model;
  /* 1. the counterexample: W > 0, yet the small-alpha branch is not the deepest point */
  const cx = mk([{ rep: "7", parities: [1, 1], multiplicity: 1 },
                 { rep: "48", parities: [1, -1], multiplicity: 1 },
                 { rep: "84", parities: [1, 1], multiplicity: 1 }]);
  const vc = resolve(MODS, cx).values.get("vacuum");
  ok("7(+,+) + 48(+,-) + 84(+,+): W = 5/2 > 0, the symmetric half holds",
     vc.value.W === 2.5 && vc.value.symmetric_ok === true);
  ok("...but the branch at 0.0848 is NOT the deepest point: F is lower at alpha ~ 0.566",
     vc.value.deepest === false && Math.abs(vc.value.alpha_global - 0.566) < 0.01 &&
     vc.value.F_gap_to_global < -1.0,
     `deepest ${vc.value.deepest}, global ${vc.value.alpha_global}, gap ${vc.value.F_gap_to_global}`);
  ok("so vacuum.true is FALSE, and the value says which half failed",
     vc.value.true === false && /NOT the deepest/.test(vc.source));
  ok("and the deepest-point half is labelled VERIFIED, not theorem: it was measured",
     vc.status === STATUS.VERIFIED);
  /* the five published rows keep their true vacua under the stricter verdict -- the paper's
   * own control, which the harness above already trusts */
  for (const row of DATA.published_rows) {
    const v = resolve(MODS, mk(row.bulk)).values.get("vacuum").value;
    ok(`${row.label} · both halves hold: symmetric and deepest`,
       v.symmetric_ok === true && v.deepest === true && v.true === true);
  }
  /* the attained-ceiling witness: W < 0, a false vacuum by the symmetric half alone */
  const wv = resolve(MODS, mk(DATA.ceilings.attained.witness)).values.get("vacuum").value;
  ok("the attained witness is still a false vacuum, now by the symmetric half explicitly",
     wv.symmetric_ok === false && wv.true === false);
  /* 4. validate demands exactly two parities */
  ok("validate rejects parities of length 1, 0 and 3",
     [[1], [], [1, 1, 1]].every((p) =>
       validate({ schema_version: SCHEMA_VERSION, group: "x", orbifold: {},
                  bulk: [{ rep: "7", parities: p, multiplicity: 1 }] }).length > 0));
  ok("...and still accepts exactly two",
     validate({ schema_version: SCHEMA_VERSION, group: "x", orbifold: {},
                bulk: [{ rep: "7", parities: [1, -1], multiplicity: 1 }] }).length === 0);
}

/* ---------------------------------------------------------------- FGrid is F
 *
 * The scan `numericMin` opens with evaluates F at two thousand alphas, and FGrid does it in one
 * pass: atoms first, the sign as a phase shift, and the cosines from a recurrence.  The first two
 * are exact rearrangements; the recurrence is not, so the disagreement is measured. */
{
  const su7 = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
  const tables = [];
  for (const r of Object.keys(su7.reps))
    for (const k of Object.keys(su7.reps[r])) tables.push(su7.reps[r][k]);

  const alphas = new Float64Array(801);
  for (let i = 0; i < alphas.length; i++) alphas[i] = 1e-4 + (1 - 1e-4) * i / (alphas.length - 1);

  let worst = 0, scale = 0, n = 0, rows = 0, atoms = 0, contents = 0;
  for (let trial = 0; trial < 12; trial++) {
    const terms = [...su7.gauge];
    for (let j = 0; j <= trial % 5; j++) terms.push(...tables[(trial * 7 + j * 13) % tables.length]);
    rows += terms.length;
    atoms += new Set(terms.map(([, s, c]) => (s > 0 ? "+" : "-") + c)).size;
    contents++;
    const g = FGrid(terms, alphas, 600);
    for (let i = 0; i < alphas.length; i += 11) {
      const a = F(terms, alphas[i], 600);
      worst = Math.max(worst, Math.abs(a - g[i]));
      scale = Math.max(scale, Math.abs(a));
      n++;
    }
  }
  ok("FGrid is F, pointwise, on the shipped contents",
     n > 800 && worst / scale < 1e-11,
     `${n} points over ${contents} contents, ${(rows / contents).toFixed(1)} rows -> `
     + `${(atoms / contents).toFixed(1)} atoms, worst relative ${(worst / scale).toExponential(2)}`);

  /* not vacuous: two different contents must not agree */
  const g1 = FGrid([...su7.gauge, ...tables[0]], alphas, 600);
  const g2 = FGrid([...su7.gauge, ...tables[1], ...tables[2]], alphas, 600);
  let differ = false;
  for (let i = 0; i < g1.length; i++) if (Math.abs(g1[i] - g2[i]) > 1e-9) { differ = true; break; }
  ok("...and the check can fail: two different contents give different curves", differ);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_samepot.mjs — Theorem 3's machinery, held to the archived lattice and to the paper.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * canonical.mjs computes the per-multiplet coordinate vectors from the term tables and SOLVES the
 * kernel relations rather than quoting them.  Every check below is against a number produced
 * outside that file: lattice_lift.py's archived matrix (in data/su7_km25.json), the coefficients
 * printed in Part VII eqs. (42)-(43), the Smith-form index of eq. (30), and the exact
 * polylogarithmic potential itself.
 *
 *   node _test_samepot.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { modules } from "./src/modules/hierarchy.mjs";
import { samepotModule } from "./src/modules/samepot.mjs";
import { FIVE_NAMES, slotOrder, fiveOf, matterFive, solveIntegerCombo, kernelRelations,
         CANON_TYPES, countsOf, canonicalCounts, bulkOfCounts, sameFive, latticeIndex,
         maxPotentialGap } from "./src/kernel/canonical.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const ARCH = DATA.coordinates;

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

H("the lifted lattice -- every engine row against lattice_lift.py's archive");
const SLOTS = slotOrder(DATA);
ok("eight slots, as the archive has", SLOTS.length === 8 &&
   Object.keys(ARCH.generators).length === 8);
for (const s of SLOTS) {
  const mine = matterFive(DATA, [{ rep: s.rep, parities: s.parities, multiplicity: 1 }]);
  const theirs = ARCH.generators[s.slot];
  ok(`${s.slot} -> (${theirs.join(", ")})`, sameFive(mine, theirs), `engine: ${mine.join(", ")}`);
}
ok("the gauge base point is the archived row (-18, -27, -39, 0, -3)",
   sameFive(fiveOf(DATA, []).map((x) => Math.round(2 * x) / 2), ARCH.gauge),
   fiveOf(DATA, []).join(","));

H("the kernel relations of eq. (42) -- SOLVED, and they must be the printed ones");
const RELS = kernelRelations(DATA);
const relMap = Object.fromEntries(RELS.map((r) => [r.lhs, Object.fromEntries(r.rhs)]));
ok("28(+,+) = 20 x 7(+,+) + 17 x 7(+,-)",
   relMap["28(+,+)"]["7(+,+)"] === 20 && relMap["28(+,+)"]["7(+,-)"] === 17,
   JSON.stringify(relMap["28(+,+)"]));
ok("48(+,+) = 24 x 7(+,+) + 18 x 7(+,-)",
   relMap["48(+,+)"]["7(+,+)"] === 24 && relMap["48(+,+)"]["7(+,-)"] === 18,
   JSON.stringify(relMap["48(+,+)"]));
ok("48(+,-) = 1 x 7(+,+) + 4 x 7(+,-) + 1 x 28(+,-)",
   relMap["48(+,-)"]["7(+,+)"] === 1 && relMap["48(+,-)"]["7(+,-)"] === 4 &&
   relMap["48(+,-)"]["28(+,-)"] === 1, JSON.stringify(relMap["48(+,-)"]));
ok("all seven coefficients are non-negative integers -- the corollary that licenses eq. (43)",
   RELS.every((r) => r.rhs.every(([, c]) => Number.isInteger(c) && c > 0)));
ok("the solver refuses an unsolvable target",
   solveIntegerCombo([[1, 0, 0, 0, 0], [0, 1, 0, 0, 0]], [0, 0, 1, 0, 0]) === null);
ok("...and refuses a non-integral one",
   solveIntegerCombo([[2, 0, 0, 0, 0]], [1, 0, 0, 0, 0]) === null);

H("each relation on the EXACT potential -- same five, and F agrees to numerical noise");
for (const r of RELS) {
  const lhs = bulkOfCounts({ [r.lhs]: 1 });
  const rhs = bulkOfCounts(Object.fromEntries(r.rhs));
  ok(`${r.lhs}: five coordinates agree`,
     sameFive(fiveOf(DATA, lhs), fiveOf(DATA, rhs)));
  const gap = maxPotentialGap(DATA, lhs, rhs, {}, { n: 40, windings: 600 });
  ok(`${r.lhs}: max |F_lhs - F_rhs| < 1e-9 over the phase (archive saw 2.9e-11)`,
     gap < 1e-9, gap.toExponential(2));
}

H("the canonical representative of eq. (43)");
{
  /* the closed form of eq. (43), applied to a content holding one of everything */
  const one = Object.fromEntries(SLOTS.map((s) => [s.slot, 1]));
  const N = canonicalCounts(one, RELS);
  ok("one of everything -> N_7(+,+) = 1 + 20 + 24 + 1 = 46",
     N["7(+,+)"] === 46, String(N["7(+,+)"]));
  ok("one of everything -> N_7(+,-) = 1 + 17 + 18 + 4 = 40",
     N["7(+,-)"] === 40, String(N["7(+,-)"]));
  ok("one of everything -> N_28(+,-) = 1 + 1 = 2, and the two 84s carry through",
     N["28(+,-)"] === 2 && N["84(+,+)"] === 1 && N["84(+,-)"] === 1);
}
for (const row of DATA.published_rows) {
  const counts = countsOf(row.bulk);
  const N = canonicalCounts(counts, RELS);
  ok(`${row.label}: canonical content keeps the five coordinates`,
     sameFive(fiveOf(DATA, row.bulk), fiveOf(DATA, bulkOfCounts(N))));
  ok(`${row.label}: canonical multiplicities are non-negative integers on the five types`,
     CANON_TYPES.every((t) => Number.isInteger(N[t]) && N[t] >= 0) &&
     Object.keys(N).length === 5);
}
{
  /* the archived probes: coordinates of the published rows, gauge included */
  const probe = ARCH.probes["\\cite{KM25} row (2)"];
  ok("row (2)'s five are the archived probe (271, 29, 1385, 0, 75)",
     sameFive(fiveOf(DATA, DATA.published_rows[1].bulk), probe),
     fiveOf(DATA, DATA.published_rows[1].bulk).join(","));
}

H("the index -- |det| of the five canonical generators against the Smith form of eq. (30)");
const IDX = latticeIndex(DATA);
ok(`|det| = ${ARCH.index}`, IDX === ARCH.index, String(IDX));
ok("...which is the product of the invariant factors 2 x 72 x 2592",
   ARCH.invariant_factors.reduce((a, b) => a * b, 1) === ARCH.index);

H("the verdict is an iff -- a positive and a negative case");
{
  const row2 = DATA.published_rows[1].bulk;
  const N = canonicalCounts(countsOf(row2), RELS);
  ok("row (2) and its canonical representative: same five, different multisets",
     sameFive(fiveOf(DATA, row2), fiveOf(DATA, bulkOfCounts(N))) &&
     JSON.stringify(countsOf(row2)) !== JSON.stringify(N));
  const bumped = [...row2, { rep: "7", parities: [1, 1], multiplicity: 1 }];
  ok("row (2) plus one 7(+,+): the five differ AND the potentials visibly differ",
     !sameFive(fiveOf(DATA, row2), fiveOf(DATA, bumped)) &&
     maxPotentialGap(DATA, row2, bumped, {}, { n: 20, windings: 400 }) > 1e-3);
}

H("the module, through the resolver");
{
  const MODS = [...modules(DATA), samepotModule(DATA)];
  const m = complete({ ...emptyModel(), group: DATA.group,
                       orbifold: { name: DATA.orbifold.name },
                       bulk: DATA.published_rows[1].bulk }).model;
  const v = resolve(MODS, m).values;
  const c = v.get("canonical");
  ok("canonical is a theorem", c.status === STATUS.THEOREM);
  ok("row (2)'s canonical: 20 x 7(+,+) + 17 x 7(+,-) + 4 x 84(+,+)",
     c.value.canonical["7(+,+)"] === 20 && c.value.canonical["7(+,-)"] === 17 &&
     c.value.canonical["84(+,+)"] === 4 && c.value.canonical["28(+,-)"] === 0 &&
     c.value.canonical["84(+,-)"] === 0, JSON.stringify(c.value.canonical));
  ok("row (2) is not already canonical, and the module says so", c.value.alreadyCanonical === false);
  ok("the index in the card matches the archive", c.value.index_matches_archive === true);
  const m2 = complete({ ...emptyModel(), group: DATA.group,
                        orbifold: { name: DATA.orbifold.name },
                        bulk: bulkOfCounts(c.value.canonical) }).model;
  const v2 = resolve(MODS, m2).values;
  ok("the canonical representative resolves as already canonical",
     v2.get("canonical").value.alreadyCanonical === true);
  ok("and its five equal row (2)'s five, through the resolver",
     sameFive(v2.get("canonical").value.five, c.value.five));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

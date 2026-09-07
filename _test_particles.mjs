/* _test_particles.mjs — the join, and the rule that no cell is ever blank.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `particles.mjs` computes almost nothing: it joins the ladder, the Standard-Model cell and the
 * observables register into one row per state.  So what has to be checked is not arithmetic — the
 * pieces have their own harnesses — but the JOIN and the HONESTY:
 *
 *   * the masses in the table are the ladder's, not a second opinion;
 *   * every cell of every row is a number or a word, never blank and never `undefined`;
 *   * the two open columns carry their reason into every row rather than being absent;
 *   * every coupling verdict is one of the five words, and today all of them are `not-computed`
 *     because no observable has a sourced resolution — printed, not hidden;
 *   * and the DECOY: at a symmetric vacuum, where no vector takes its mass from the Wilson line,
 *     the table must report no scale rather than inventing GeV out of a number the Wilson line had
 *     nothing to do with.
 *
 *   node _test_particles.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { vac5Frame, vac5Ladder, vac5Confront } from "./src/modules/vacuum5d.mjs";
import { particleTable, particleShow, OPEN_COLUMNS } from "./src/modules/particles.mjs";
import { OBSERVABLES } from "./src/kernel/observables.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });

/* SU(3) on S^1/Z_2, two plus and one minus: the breaking to SU(2)xU(1) that Haba-Yamashita,
 * Kubo-Lim-Yamashita and Carson-Okada all work in, and the smallest case the instrument covers
 * end to end.  A Wilson line at 0.2 so there IS a scale to read. */
const b3 = B([2, 0, 0, 1]);
const content = { gauge: true, bulk: [D("fund", +1), D("adj", +1)] };
const theta = [0.2];

console.log("=".repeat(96));
console.log("   particles.mjs — one row per state, and a declared word in every cell");
console.log("=".repeat(96));

const T = particleTable(b3, content, theta);

console.log("\n   1 -- THE TABLE EXISTS AND ITS MASSES ARE THE LADDER'S\n");
ok(T.rows.length > 0, "the table has rows", T.rows.length + " rows to " + T.levels + " KK levels");

const ladder = vac5Ladder(vac5Frame(b3, theta), content);
const ladderMassless = ladder.rows.reduce((s, r) => s + r.massless, 0);
const tableMassless = T.rows.filter((r) => r.massless).reduce((s, r) => s + r.copies, 0);
ok(ladderMassless === tableMassless,
   "the massless count is the ladder's, not a second opinion",
   "ladder " + ladderMassless + ", table " + tableMassless);

const sorted = T.rows.every((r, i) => i === 0 || T.rows[i - 1].massR <= r.massR);
ok(sorted, "the rows come out ordered by mass");

/* every mass in units of 1/R must be an offset plus an integer level */
const consistent = T.rows.every((r) => Math.abs(r.massR - (r.level + r.offset)) < 1e-12);
ok(consistent, "and every mass is level + offset exactly, with no third source");

console.log("\n   2 -- NO CELL IS BLANK\n");
const REQUIRED = ["origin", "rep", "twist", "copies", "level", "offset", "massR", "kind",
                  "parities", "stability", "width", "couplings"];
let blanks = [];
for (const r of T.rows) {
  for (const k of REQUIRED) {
    if (r[k] === undefined || r[k] === "") blanks.push(r.origin + "." + k);
  }
  /* sm may be null, but then smWhy must say why -- that is the whole rule */
  if (r.sm === null && !r.smWhy) blanks.push(r.origin + ".sm has no reason");
  if (r.sm !== null && r.smWhy) blanks.push(r.origin + ".sm has both a value and a reason");
}
ok(blanks.length === 0, "every required cell of every row is filled, and a null `sm` carries a"
   + " reason", blanks.slice(0, 3).join("; "));

const p6 = T.rows.every((r) => r.parities.P6 === null && r.parities.P6why);
ok(p6, "P6 is null with a reason on every row — this is a five-dimensional model",
   T.rows[0].parities.P6why.slice(0, 64) + "...");

console.log("\n   3 -- THE TWO OPEN COLUMNS ARE PRINTED, NOT OMITTED\n");
const st = T.rows.every((r) => r.stability.verdict === "not-derived" && r.stability.why.length > 80);
ok(st, "stability says `not-derived` on every row, with what is missing",
   OPEN_COLUMNS.stability.why.slice(0, 70) + "...");
const wd = T.rows.every((r) => r.width.verdict === "not-computed" && r.width.why.length > 80);
ok(wd, "width says `not-computed` on every row, with what it waits for",
   OPEN_COLUMNS.width.why.slice(0, 70) + "...");

console.log("\n   4 -- EVERY COUPLING VERDICT IS ONE OF THE FIVE WORDS\n");
const WORDS = new Set(["exact-zero", "below-res", "nonzero", "undetermined", "not-computed"]);
let bad = 0, seenWords = new Set(), noWhy = 0;
for (const r of T.rows) {
  for (const key of Object.keys(OBSERVABLES)) {
    const v = r.couplings[key];
    if (!v || !WORDS.has(v.verdict)) bad++;
    else seenWords.add(v.verdict);
    if (!v || !v.why) noWhy++;
  }
}
ok(bad === 0 && noWhy === 0,
   "every (state, operator) pair carries one of the five words and a reason",
   T.rows.length * Object.keys(OBSERVABLES).length + " pairs checked");
ok(seenWords.size === 1 && seenWords.has("not-computed"),
   "and today every one of them is `not-computed` — the register has no sourced resolution yet",
   "that is its state, printed rather than hidden");
/* the reason must be the register's own `missing`, not a generic sentence */
const carries = T.rows[0].couplings.higgs_couplings.why.includes("Carson-Okada");
ok(carries, "the reason each pair carries is the register entry's own `missing`",
   "the Higgs column names the paper that would supply the numbers");

console.log("\n   5 -- DECOY: A SYMMETRIC VACUUM MUST REFUSE TO GIVE A SCALE\n");
const sym = particleTable(b3, content, [0]);
ok(sym.scale.located === false && !!sym.scale.why,
   "at theta = 0 no vector takes its mass from the Wilson line, so there is no 1/R",
   sym.scale.why.slice(0, 72));
ok(sym.rows.every((r) => r.massGeV === null),
   "and every mass in GeV is null rather than a number computed from the wrong thing",
   sym.rows.length + " rows, all of them");
ok(T.scale.located === true && T.scale.invRGeV > 0,
   "while the Wilson-line vacuum does give one",
   "1/R = " + (T.scale.invRGeV / 1000).toFixed(2) + " TeV");

console.log("\n   6 -- THE ONE-LINE READING\n");
const line = particleShow(T);
ok(line.includes("not-computed") && line.includes("open"),
   "the summary says what the table cannot do, not only what it can", line);

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

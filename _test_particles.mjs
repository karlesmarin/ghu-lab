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
import { particleTable, particleShow, OPEN_COLUMNS, openChannels, kkParity }
  from "./src/modules/particles.mjs";
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

console.log("\n   3 -- STABILITY: THE REFLECTION THAT SWAPS THE FIXED POINTS\n");
/* Three answers, and each one has to be REACHED by a real configuration, not asserted. */
ok(T.parity.verdict === "broken-by-vacuum",
   "a symmetric boundary condition at a GENERIC alpha: the reflection sends alpha -> -alpha",
   T.parity.why.slice(0, 86));
const atHalf = particleTable(b3, content, [0.5]);
ok(atHalf.parity.verdict === "present",
   "the same condition at a symmetric point: KK parity survives", atHalf.parity.why.slice(0, 74));
const asym = particleTable(B([1, 1, 0, 1]), content, [0.5]);
ok(asym.parity.verdict === "none",
   "and a boundary condition with (+,-) and (-,+) of different sizes has NO reflection at all",
   asym.parity.why.slice(0, 86));
/* THE DECOY THAT CAUGHT THE FIRST VERSION.  It read the content's (e0,e1) twists and never looked
 * at the block sizes, so the asymmetric condition above came back `present`.  The two carry
 * different information and the check has to reach the boundary condition. */
ok(asym.parity.why.includes("(+,-) block"),
   "...and it says so because of the BLOCK SIZES, not the content's parities",
   "reading only the content is blind to this, which is how the first version passed");
/* a parity value exists per row only when the parity itself does */
ok(T.rows.every((r) => r.stability.kkParity === undefined),
   "no row carries a KK parity when the parity is broken — an absent symmetry labels nothing");
const selfPaired = atHalf.rows.filter((r) => r.twist[0] === r.twist[1]);
ok(selfPaired.length > 0 && selfPaired.every((r) => r.stability.kkParity === (r.level % 2 ? -1 : 1)),
   "and when it is present a self-paired tower carries (-1)^n", selfPaired.length + " rows");

console.log("\n   4 -- WIDTHS: THE CHANNEL CENSUS, AND WHEN AN EMPTY LIST IS A THEOREM\n");
const kinds = {};
for (const r of T.rows) kinds[r.width.verdict] = (kinds[r.width.verdict] || 0) + 1;
ok(T.rows.every((r) => ["massless", "channels-open", "no-open-channel"].includes(r.width.verdict)),
   "every row gets one of the three channel verdicts", JSON.stringify(kinds));
ok((kinds.massless || 0) > 0,
   "a massless state is labelled `massless`, not `no-open-channel`",
   "the first version called it stable, which is vacuous: there is nothing below zero");
const opened = T.rows.find((r) => r.width.verdict === "channels-open");
ok(opened && opened.width.conserving.length + opened.width.violating.length > 0,
   "an open row lists its channels, split by whether they conserve KK level",
   opened ? opened.width.conserving.length + " conserving, " + opened.width.violating.length
            + " needing the fixed-point violation" : "");
/* THE BRANCH THAT NEVER FIRES ON THIS MODEL, EXERCISED ON PURPOSE.  With any massless row present
 * every massive state has an open channel, so `no-open-channel` is unreachable here.  A branch no
 * configuration reaches is the mirror of a check that can only pass, so it is driven directly. */
const synthetic = [
  { origin: "X", level: 1, offset: 0.3, massR: 1.3, massless: false, twist: [1, 1] },
  { origin: "Y", level: 1, offset: 0.4, massR: 1.4, massless: false, twist: [1, 1] },
];
const none = openChannels(synthetic, synthetic[0]);
ok(none.verdict === "no-open-channel" && none.why.includes("whatever the couplings"),
   "a state with nothing lighter to pair gets the theorem, not a guess", none.why.slice(0, 78));
ok(none.why.includes("THIS table") || none.why.includes("this table"),
   "...and it says the theorem is about THIS table, not about the world",
   "a channel into states the table does not carry is not excluded by it");

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
   "and every one of them is `not-computed` — no entry has a resolution ON THE OVERLAP",
   "one entry now has a sourced resolution, on a rate, and that still decides nothing here");
/* THE REASON MUST BE THE REGISTER'S OWN, AND THE CHECK MUST NOT BE TIED TO ITS WORDING.  An earlier
 * version looked for the string "Carson-Okada" and went red the moment that entry's `missing` was
 * rewritten — while the property it meant to check still held.  A test pinned to prose measures the
 * prose. */
const carries = T.rows[0].couplings.higgs_couplings.why.includes(OBSERVABLES.higgs_couplings.missing);
ok(carries, "the reason each pair carries is literally the register entry's own `missing`",
   OBSERVABLES.higgs_couplings.missing.slice(0, 66) + "...");

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

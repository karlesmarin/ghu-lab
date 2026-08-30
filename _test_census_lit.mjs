/* _test_census_lit.mjs — the census, and the line between what was measured and what was read.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A CENSUS IS A DENOMINATOR, so the things that can go wrong are arithmetic and honesty.
 *
 *   the arithmetic  duplicates counted once; the shortlist a subset of the corpus; the curated rows
 *                   naming papers that are actually there; coverage that adds up.
 *   the honesty     a keyword sweep must never be presented as a reading.  Every curated row has to
 *                   name a page or an equation, and a paper the sweep could not read must be a
 *                   THIRD state rather than folded into "publishes nothing" -- which would be the
 *                   sweep reporting its own blind spot as a property of the literature.
 *
 * The second is the one worth having a harness for, because it is the one that would look fine.
 *
 *   node _test_census_lit.mjs
 */
import { readFileSync } from "node:fs";

const C = JSON.parse(readFileSync(new URL("./data/census.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* ------------------------------------------------------------------ the arithmetic */

H("the denominator, which is the one number a census is for");
{
  const ids = C.measured.map((r) => r.id);
  ok("every measured row is a distinct file", new Set(ids).size === ids.length);
  ok("the corpus count is the number of rows", C.corpus.papers === C.measured.length,
     `${C.corpus.papers} vs ${C.measured.length}`);

  const dup = Object.values(C.duplicates.groups).reduce((n, v) => n + v.length - 1, 0);
  ok("duplicate filenames are found and subtracted", C.corpus.duplicate_files === dup &&
     C.corpus.distinct_papers === C.corpus.papers - dup,
     `${C.corpus.papers} files, ${dup} duplicates, ${C.corpus.distinct_papers} distinct`);
  ok("...and each duplicate group really is one eprint under several names",
     Object.entries(C.duplicates.groups).every(([k, v]) =>
       v.length > 1 && v.every((n) => n.includes(k.replace("/", "_")) || n.includes(k))),
     JSON.stringify(C.duplicates.groups));

  ok("the shortlist is a subset of the corpus",
     C.shortlist.ids.every((i) => ids.includes(i)),
     C.shortlist.ids.filter((i) => !ids.includes(i)).join(", "));
  ok("the shortlist is exactly the papers carrying all three legs",
     C.shortlist.ids.join() ===
     C.measured.filter((r) => ["wilson_minimum", "higgs_mass", "compactification_scale"]
       .every((t) => r.signals.includes(t))).map((r) => r.id).sort().join());

  ok("coverage: shortlisted-but-unread is the shortlist minus what was read",
     C.coverage.shortlisted_but_not_read.join() ===
     C.shortlist.ids.filter((i) => !C.curated.some((c) => c.id === i)).sort().join());
}

/* ------------------------------------------------------------------ the honesty */

H("a keyword sweep is not a reading, and the file must not let them blur");
{
  ok("every curated row names where somebody looked",
     C.curated.every((r) => typeof r.where === "string" && r.where.length > 20),
     C.curated.filter((r) => !(r.where || "").length).map((r) => r.id).join(", "));
  ok("...and carries a verdict, not just a tick",
     C.curated.every((r) => typeof r.verdict === "string" && r.verdict.length > 40));
  ok("...and a status from the instrument's own vocabulary",
     C.curated.every((r) => ["theorem", "verified", "measured", "unknown"].includes(r.status)),
     C.curated.map((r) => r.status).join(","));
  ok("every curated row names a paper that is in the corpus",
     C.curated.every((r) => C.measured.some((m) => m.id === r.id)),
     C.curated.filter((r) => !C.measured.some((m) => m.id === r.id)).map((r) => r.id).join(", "));

  /* THE ONE THAT WOULD LOOK FINE.  A paper the sweep could not read is not a paper that publishes
   * nothing, and the difference is the whole value of the census. */
  const unread = new Set(C.unreadable.ids);
  ok("papers the sweep could not read are a THIRD state, not a zero",
     C.corpus.not_readable_by_this_sweep === unread.size && unread.size > 0,
     `${C.corpus.not_readable_by_this_sweep} vs ${unread.size}`);
  ok("...and none of them is on the shortlist, which would be a contradiction",
     C.shortlist.ids.every((i) => !unread.has(i)));
  ok("...and none of them is asserted in a curated row without having been opened",
     C.curated.every((r) => !unread.has(r.id) ||
       (r.screened === "yes" && r.where.length > 20)),
     C.curated.filter((r) => unread.has(r.id)).map((r) => r.id).join(", "));
  ok("the file says in words why an unreadable paper is not a finding",
     /blind spot|not been measured|not measured/i.test(C.unreadable.why + C.shortlist.note));

  /* and the sweep's own limits, stated */
  ok("the signals are published with the census, so the sweep can be re-run or disputed",
     Object.keys(C.signals).length >= 6 &&
     Object.values(C.signals).every((v) => Array.isArray(v) && v.length));
  ok("the shortlist says a signal means 'worth opening' and nothing more",
     /worth opening/i.test(C.shortlist.note));
}

/* ------------------------------------------------------------------ the headline */

H("the finding, which is an absence");
{
  const frac = C.shortlist.ids.length / C.corpus.distinct_papers;
  ok("the triple is rare: fewer than a fifth of the corpus prints all three legs", frac < 0.2,
     `${C.shortlist.ids.length} of ${C.corpus.distinct_papers} = ${(100 * frac).toFixed(0)}%`);

  const withTriple = C.curated.filter((r) => r.publishes.minimum &&
    (r.publishes.higgs_mass || r.publishes.scale));
  ok("...and of what has been READ, only a few carry a usable row", withTriple.length <= 4,
     withTriple.map((r) => r.id).join(", "));

  /* the second headline, and it is why pdf_glyph_audit.py exists */
  const badFrac = C.corpus.text_layer_suspect / C.corpus.pdf;
  ok("most PDFs in this corpus lose glyphs to extraction, so reading formulas from text is the trap",
     badFrac > 0.5,
     `${C.corpus.text_layer_suspect} of ${C.corpus.pdf} = ${(100 * badFrac).toFixed(0)}%`);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

/* _test_kernel.mjs — the Phase 0 harness.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The spine has no physics in it yet, so this cannot check a number against a paper.  What it CAN
 * check is that the spine's promises hold — and every promise here is one the instrument's honesty
 * rests on, so a red light stops Phase 1.
 *
 * Several tests are ANTI-VACUITY tests: they assert that a guard actually fires on input designed
 * to trip it.  A control that cannot fail is not a control.
 *
 *   node _test_kernel.mjs
 */
import { SCHEMA_VERSION, emptyModel, canonicalJSON, complete, validate, modelId, describe }
  from "./src/kernel/model.mjs";
import { STATUS, val, unknown, weakest, tally } from "./src/kernel/status.mjs";
import { order, resolve, ResolveError } from "./src/kernel/resolve.mjs";
import { makeCard, toText, diffCards } from "./src/kernel/card.mjs";
import { TOOL, authorLine, orcidHTML } from "./src/kernel/meta.mjs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? "  — " + detail : ""}`); }
};
const throws = (name, fn, match) => {
  try { fn(); ok(name, false, "did not throw"); }
  catch (e) { ok(name, !match || String(e.message).includes(match), `message was: ${e.message}`); }
};
const H = (s) => console.log(`\n${s}`);

/* ------------------------------------------------------------------ a model to work with */
const M = {
  ...emptyModel(),
  group: "SU(7)",
  orbifold: { name: "S1/Z2 x S1/Z2", parities: { P5: [1, 1, 1, 1, 1, -1, -1] } },
  bulk: [
    { rep: "7", parities: [1, 1], multiplicity: 3 },
    { rep: "84", parities: [1, 1], multiplicity: 1 },
  ],
};

H("model record");
ok("validates", validate(M).length === 0, JSON.stringify(validate(M)));
ok("schema version is stamped", M.schema_version === SCHEMA_VERSION);
ok("describes itself", describe(M).includes("SU(7)") && describe(M).includes("3x7"));

const shuffled = { bulk: M.bulk, orbifold: M.orbifold, group: M.group, brane: M.brane,
                   schema_version: M.schema_version, conventions: M.conventions };
ok("canonical form is insensitive to key order", canonicalJSON(M) === canonicalJSON(shuffled));
ok("the id follows the canonical form", modelId(M) === modelId(shuffled));
ok("the id is 12 hex characters", /^[0-9a-f]{12}$/.test(modelId(M)), modelId(M));

const M2 = JSON.parse(JSON.stringify(M));
M2.bulk[0].multiplicity = 4;
ok("a different model gets a different id", modelId(M) !== modelId(M2));

/* anti-vacuity: validate() must reject things, or it is decoration */
ok("validate rejects a missing group", validate({ ...M, group: null }).length > 0);
ok("validate rejects a fractional multiplicity",
   validate({ ...M, bulk: [{ rep: "7", parities: [1, 1], multiplicity: 1.5 }] }).length > 0);
ok("validate rejects a parity that is not +-1",
   validate({ ...M, bulk: [{ rep: "7", parities: [1, 0], multiplicity: 1 }] }).length > 0);
ok("validate rejects a foreign schema version", validate({ ...M, schema_version: 999 }).length > 0);

H("defaults are echoed, never silent");
const { model: full, applied } = complete(M);
ok("defaults get filled", Object.keys(full.conventions).length >= 4);
ok("and every one is reported", applied.length === Object.keys(full.conventions).length);
ok("each carries its source", applied.every((d) => d.source && d.source.length > 3));
const chosen = complete({ ...M, conventions: { g4: 0.5 } });
ok("a user's choice is not overwritten", chosen.model.conventions.g4 === 0.5);
ok("and is not reported as a default", !chosen.applied.some((d) => d.key === "g4"));

H("the honesty vocabulary");
ok("a value needs a legal status",
   val(1, { status: STATUS.THEOREM, source: "x" }).status === "theorem");
throws("a value with a made-up status is refused",
       () => val(1, { status: "probably", source: "x" }), "unknown status");
throws("a value with no source is refused", () => val(1, { status: STATUS.MEASURED }), "source");
throws("unknown() with no reason is refused", () => unknown(""), "reason is mandatory");
ok("unknown carries its reason", unknown("no domain").reason === "no domain");
ok("weakest finds the unknown",
   weakest([val(1, { status: STATUS.THEOREM, source: "p" }), unknown("x")]) === STATUS.UNKNOWN);
ok("weakest of proved things is theorem",
   weakest([val(1, { status: STATUS.THEOREM, source: "p" })]) === STATUS.THEOREM);

H("the resolver");
const mk = (id, provides, requires, fn) => ({ id, provides, requires, compute: fn });
const A = mk("A", ["a"], [], () => ({ a: val(1, { status: STATUS.THEOREM, source: "A" }) }));
const B = mk("B", ["b"], ["a"], (c) =>
  ({ b: val(c.get("a").value + 1, { status: STATUS.MEASURED, source: "B" }) }));
const C = mk("C", ["c"], ["b"], (c) =>
  ({ c: val(c.get("b").value * 10, { status: STATUS.MEASURED, source: "C" }) }));

ok("orders dependencies before dependents",
   order([C, B, A]).map((m) => m.id).join("") === "ABC");
const r1 = resolve([C, B, A], M);
ok("runs everything once", r1.ran.length === 3 && r1.skipped.length === 0);
ok("and the numbers flow", r1.values.get("c").value === 20);

throws("a cycle is named, not hung",
       () => order([mk("X", ["x"], ["y"]), mk("Y", ["y"], ["x"])]), "cycle");
throws("two providers of one capability is refused",
       () => order([mk("X", ["x"], []), mk("Y", ["x"], [])]), "two modules provide");
throws("a missing provider is named",
       () => order([mk("X", ["x"], ["nope"])]), 'nothing provides "nope"');

H("UNKNOWN propagates — the reason this resolver exists");
const Abad = mk("A", ["a"], [], () => ({ a: unknown("the domain is not legal") }));
const r2 = resolve([C, B, Abad], M);
ok("the dependent is skipped", r2.skipped.some((s) => s.id === "B"));
ok("and so is ITS dependent", r2.skipped.some((s) => s.id === "C"));
ok("downstream values are unknown", r2.values.get("c").status === STATUS.UNKNOWN);
ok("and they name the capability that failed", r2.values.get("b").reason.includes('"a"'),
   r2.values.get("b").reason);
ok("the honest reporter still ran, its dependents did not",
   r2.ran.join("") === "A" && !r2.ran.includes("B") && !r2.ran.includes("C"), r2.ran.join(","));

const Athrow = mk("A", ["a"], [], () => { throw new Error("division by zero"); });
const r3 = resolve([B, Athrow], M);
ok("a crashing module becomes unknown, not an exception",
   r3.values.get("a").status === STATUS.UNKNOWN);
ok("and the crash is reported", r3.values.get("a").reason.includes("division by zero"));

const Aquiet = mk("A", ["a"], [], () => ({}));
ok("a module that forgets its own output is caught",
   resolve([Aquiet], M).values.get("a").status === STATUS.UNKNOWN);

/* A CONTRACT violation must escape as an exception.  If it were swallowed into `unknown` it would
 * read as an honest verdict and nobody would ever look at it. */
throws("a module reaching for an undeclared capability THROWS, it does not become unknown", () => {
  const Sneak = mk("S", ["s"], [], (c) => ({ s: c.get("a") }));
  resolve([A, Sneak], M);
}, "without declaring it");
const rSwallow = resolve([mk("Z", ["z"], [], () => { throw new Error("bad physics"); })], M);
ok("but a PHYSICS failure still becomes unknown", rSwallow.values.get("z").status === STATUS.UNKNOWN);

const r4 = resolve([C, B, A], M, { only: ["b"] });
ok("only: runs just what the target needs", r4.ran.join("") === "AB");

H("the result card");
const card = makeCard(M, resolve([C, B, A], M).values, { version: "0.0.1", kernelHash: "deadbeef" });
ok("echoes the completed input", Object.keys(card.input.model.conventions).length >= 4);
ok("flags which defaults it applied", card.input.defaults_applied.length >= 4);
ok("stamps the model id", card.provenance.model_id === modelId(complete(M).model));
ok("tallies the statuses", card.summary.tally.theorem === 1 && card.summary.tally.measured === 2);
ok("names the weakest thing in it", card.summary.weakest === STATUS.MEASURED);

H("authorship travels with the numbers");
ok("the card carries an author", (card.provenance.authors || []).length === 1);
ok("with an ORCID iD", /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(card.provenance.authors[0].orcid),
   card.provenance.authors[0].orcid);
ok("the assistant is named, not credited as an author",
   card.provenance.assistant.includes("Claude") &&
   !card.provenance.authors.some((a) => /claude/i.test(a.name)));
ok("the text form prints the iD", toText(card).includes("ORCID 0009-0007-5637-9688"));
ok("the author line is usable in prose", authorLine().includes("orcid.org/"));
ok("the ORCID mark is inline SVG, never a fetched image",
   orcidHTML(TOOL.authors[0]).includes("<svg") && !orcidHTML(TOOL.authors[0]).includes("<img"));
ok("and it links to the iD", orcidHTML(TOOL.authors[0]).includes('href="https://orcid.org/'));

const txt = toText(card);
ok("the text form carries the input", txt.includes("## input") && txt.includes("SU(7)"));
ok("the text form carries the sources", txt.includes("[theorem]") && txt.includes("[measured]"));
ok("the text form names the defaults as defaults",
   txt.includes("defaults applied by the tool, not chosen by the user"));

const cardU = makeCard(M, resolve([C, B, Abad], M).values, { version: "0.0.1" });
ok("a card with unknowns says so in words",
   toText(cardU).includes("That is a verdict, not a gap."));

ok("a card diffed against itself is empty", diffCards(card, card).length === 0);
const card2 = JSON.parse(JSON.stringify(card));
card2.results.c.value = 20.0000001;
ok("and a moved number is caught", diffCards(card, card2).length === 1,
   JSON.stringify(diffCards(card, card2)));

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

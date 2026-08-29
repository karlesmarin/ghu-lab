/* _test_built.mjs — the entry condition: test the page that SHIPS, not the sources it came from.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The other harnesses import from src/.  This one opens app/hierarchy.html, pulls the engine out of
 * the built file, runs it in node with no DOM, and checks it against the Part VII Python engine's
 * numbers.
 *
 * The distinction is not pedantry.  Everything between the source and the page — the inliner, the
 * module stripper, the data injection — is code that can go wrong silently, and it is exactly the
 * code no other test covers.  A page that is correct in src/ and broken in app/ is the failure this
 * file exists to catch.
 *
 *   node _test_built.mjs
 */
import { readFileSync } from "node:fs";

const PAGE = readFileSync(new URL("./app/index.html", import.meta.url), "utf8");

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };

/* ---- pull the engine out of the shipped file ------------------------------------------- */
/* Anchor on the exact declaration: `const DATA = DATASETS.su7_km25;` also starts with "const DATA"
 * and matched a looser prefix, which is how this test spent a build parsing "SETS.su7_km25". */
const PRE = "const DATASETS = ";
const dataLine = PAGE.split("\n").find((l) => l.trim().startsWith(PRE));
ok("the built page carries its data inline", !!dataLine);
const DATASETS = JSON.parse(dataLine.trim().slice(PRE.length).replace(/;\s*$/, ""));
ok("and it carries EVERY group, not one", Object.keys(DATASETS).length >= 2,
   Object.keys(DATASETS).join(","));
const DATA = DATASETS.su7_km25;

const i0 = PAGE.indexOf("const VERSION = ");
const i1 = PAGE.indexOf("/* ---- hierarchy_section.js ---- */");
ok("the engine block is where the build says it is", i0 > 0 && i1 > i0);
const ENGINE = PAGE.slice(i0, i1);

ok("the engine carries no module syntax", !/^\s*(?:import|export)\b/m.test(ENGINE));
ok("and the page reaches for nothing", !/\bfetch\s*\(|new\s+Worker\s*\(/.test(PAGE));

/* Evaluate it exactly as the browser would, and hand back what the page's own UI uses. */
const api = new Function("DATASETS", "DATA", ENGINE + `
  return { complete, modelId, resolve, modules, certificates, termTable, numericMin,
           rung, makeCard, toText, tally, SCHEMA_VERSION, TOOL, VERSION, BUILD };`)(DATASETS, DATA);
ok("the engine evaluates in a bare scope", typeof api.resolve === "function");
ok("it is stamped with its version and build", !!api.VERSION && !!api.BUILD,
   `${api.VERSION} / ${api.BUILD}`);

const MODS = api.modules(DATA);
const modelOf = (row) => api.complete({
  schema_version: api.SCHEMA_VERSION, group: DATA.group,
  orbifold: { name: DATA.orbifold.name }, brane: [], conventions: {}, bulk: row.bulk,
}).model;

/* ---- the five published rows, through the SHIPPED engine -------------------------------- */
console.log("\n  the five published rows, computed by the built page:");
console.log("  row      8D    A4        alpha      numeric      err %        m_h");
let worst = 0;
for (const row of DATA.published_rows) {
  const m = modelOf(row);
  const { values, skipped } = api.resolve(MODS, m);
  const D8 = values.get("D8").value, A4 = values.get("A4").value;
  const a = values.get("alpha_min").value, mh = values.get("m_h").value;
  const an = api.numericMin(api.termTable(m, DATA), { windings: m.conventions.windings });
  const err = 100 * (a - an) / an;
  worst = Math.max(worst, Math.abs(err));
  console.log(`  ${row.label.padEnd(6)} ${String(D8).padStart(4)} ${String(A4).padStart(5)} ` +
              `${a.toFixed(9)} ${an.toFixed(9)} ${err.toFixed(4).padStart(10)} ${mh.toFixed(3).padStart(10)}`);
  ok(`${row.label} · 8D as the Python engine has it`, D8 === row.ours.D8);
  ok(`${row.label} · A_4 as the Python engine has it`, A4 === row.ours.A4);
  ok(`${row.label} · nothing skipped`, skipped.length === 0);
}
ok("worst closed-form error, in the shipped page, under 1 %", worst < 1.0, `${worst.toFixed(3)} %`);

/* ---- the ladder and the laws survived the build ------------------------------------------ */
const gauge = api.termTable(modelOf({ bulk: [] }), DATA);
ok("the gauge rungs are still 9, -27, -36",
   [0, 1, 2].map((k) => Math.round(api.rung(gauge, k))).join(",") === "9,-27,-36",
   [0, 1, 2].map((k) => api.rung(gauge, k)).join(","));

const dead = api.complete({ schema_version: api.SCHEMA_VERSION, group: DATA.group,
                            orbifold: { name: DATA.orbifold.name }, brane: [], conventions: {},
                            bulk: [{ rep: "7", parities: [1, 1], multiplicity: 1 }] }).model;
const rd = api.resolve(MODS, dead);
ok("UNKNOWN still propagates in the shipped page", rd.values.get("invR5").status === "unknown");
ok("and still says why", /D = /.test(rd.values.get("alpha_min").reason));

/* ---- the card the page hands out --------------------------------------------------------- */
const m2 = modelOf(DATA.published_rows[1]);
const card = api.makeCard(m2, api.resolve(MODS, m2).values,
                          { version: api.VERSION, build: api.BUILD,
                            certificates: api.certificates(DATA) });
ok("the shipped card carries the ORCID", api.toText(card).includes("0009-0007-5637-9688"));
ok("the shipped card carries the certificate", !!card.certificates.ceiling.method);
ok("and the honesty tally", card.summary.tally.theorem > 0 && card.summary.tally.measured > 0);

/* ---- the page's own furniture -------------------------------------------------------------- */
ok("the footer shows the iD", PAGE.includes("orcid.org/0009-0007-5637-9688"));
/* What this assertion actually means: the mark is DRAWN inside the link rather than fetched.
 * Whether the page reaches outside itself at all is the Edition gate's job, and it is tested there
 * against both directions -- re-implementing a blunter version of it here is how two guards drift
 * apart, and the blunt version already fired once on the word appearing in a comment. */
const _a = PAGE.indexOf('href="https://orcid.org/');
const anchor = PAGE.slice(_a, _a + 700);
ok("the iD mark is drawn inside the link, not fetched",
   anchor.includes("<svg") && anchor.includes("#A6CE39") && !/<img\s/.test(anchor));
ok("the honesty vocabulary is on the page for the reader",
   ["theorem", "verified", "measured", "unknown"].every((s) => PAGE.includes(s)));

/* ---- the shell: one model across sections ------------------------------------------------ */
/* The sections block declares its own `const DATA = DATASETS.su7_km25`, so passing DATA in as a
 * parameter as well is a redeclaration.  Hand it only the datasets. */
const secs = new Function("DATASETS", ENGINE + PAGE.slice(i1, PAGE.indexOf("/* app.js")) +
                          "; return SECTIONS;")(DATASETS);
ok("the registry is not empty", secs.length >= 2, String(secs.length));
/* Not a count of what is built -- that would measure progress, and a test that measures progress
 * fails every time we make some.  The invariant is that nothing is left undecided. */
ok("every section declares whether it is built, explicitly",
   secs.every((s) => s.ready === true || s.ready === false),
   JSON.stringify(secs.map((s) => [s.id, s.ready])));
ok("every section names its paper", secs.every((s) => !!s.paper));
/* EVERY BUILT SECTION BRINGS MARKUP, AND MODULES UNLESS IT HOLDS ITS OWN MODEL.  The exception is
 * not a loophole: a section with no modules is one that computes nothing through the resolver, and
 * the only honest reason for that is that it does not stand on the shell's model at all -- in
 * which case it MUST say what it does stand on, or the header lies about what is on screen.  So
 * `modules: []` is admissible exactly when `holds()` is there, and never otherwise. */
ok("every BUILT section brings its own markup", secs.filter((s) => s.ready)
   .every((s) => typeof s.html === "string" && s.html.length > 200));
ok("...and its own modules, unless it declares holds() and carries its own model instead",
   secs.filter((s) => s.ready).every((s) => Array.isArray(s.modules) &&
     (s.modules.length > 0 || typeof s.holds === "function")),
   JSON.stringify(secs.filter((s) => s.ready && !(s.modules || []).length).map((s) => s.id)));
ok("a section that holds its own model returns a non-empty line for the header",
   secs.filter((s) => typeof s.holds === "function")
       .every((s) => typeof s.holds({}) === "string" && s.holds({}).length > 8));
ok("no UNBUILT section smuggles in modules",
   secs.filter((s) => !s.ready).every((s) => !s.modules));
ok("section ids are unique", new Set(secs.map((s) => s.id)).size === secs.length);
ok("every section names the family it belongs to", secs.every((s) => !!s.family && !!s.group));
ok("the families partition the sections",
   new Set(secs.map((s) => s.group)).size >= 2);
ok("sections of one family agree on their group",
   secs.every((s) => secs.filter((t) => t.family === s.family)
                         .every((t) => t.group === s.group)));
ok("hierarchy, anomalies, escape, samepot and screen are all built",
   ["hierarchy", "anomalies", "escape", "samepot", "screen"]
     .every((id) => secs.find((s) => s.id === id)?.ready === true));
/* This once read `secs.some((s) => s.ready === false)` -- which failed the moment the last section
 * was built.  A test that fails when we make progress is measuring progress, not correctness; the
 * invariant is that the SHELL can still show a gap, and that any gap is fully described.  Both stay
 * true whether or not a gap exists today. */
ok("the rail still knows how to display an unbuilt section",
   /ready === false/.test(PAGE) && PAGE.includes("not built yet"));
ok("the registry is never filtered by readiness -- a gap is listed, not hidden",
   /SECTIONS\.filter\(\(s\) => s\.ready !== false\)\.length\} of \$\{SECTIONS\.length\}/.test(PAGE));
ok("any unbuilt section still names itself fully",
   secs.filter((s) => s.ready === false).every((s) => s.id && s.label && s.paper && s.group));
/* A typo'd id does not throw: getElementById returns null, the optional call does nothing, and the
 * panel simply never fills in.  It is invisible in every test that checks numbers, so it is checked
 * here: every id a section reaches for must be created somewhere in that same section. */
const idMisses = [];
for (const s of secs.filter((x) => x.ready)) {
  const src = String(s.render || "") + String(s.init || "");
  const made = new Set([...String(s.html).matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  /* ids the section writes into its own innerHTML later count as created too */
  for (const m of src.matchAll(/id="([^"${]+)"/g)) made.add(m[1]);
  const want = new Set([...src.matchAll(/(?:getElementById|\$)\(\s*"([^"${]+)"\s*\)/g)]
                       .map((m) => m[1]));
  for (const id of want) if (!made.has(id)) idMisses.push(`${s.id}: #${id}`);
}
ok("every id a section reaches for is an id that section creates", idMisses.length === 0,
   idMisses.join("; "));
/* anti-vacuity: the check above proves nothing unless it is actually looking at ids */
ok("and that check found ids to look at",
   secs.filter((x) => x.ready).every((s) =>
     /(?:getElementById|\$)\(\s*"/.test(String(s.render) + String(s.init))));

/* A ReferenceError inside render() leaves the panel blank and throws into a console nobody reads.
 * The id check above catches a typo'd id; this catches everything else, by actually RUNNING every
 * built section's render against a stub DOM and a resolved model. */
/* A 2D context that answers every call.  Returning null would make the sections that draw throw on
 * the first clearRect, and the smoke would be reporting my stub rather than their code. */
const stubCtx = new Proxy({}, {
  get: (t, k) => (k === "canvas" ? { width: 800, height: 400 }
                 : k === "measureText" ? () => ({ width: 10 })
                 : k === "createLinearGradient" || k === "createRadialGradient"
                   ? () => ({ addColorStop() {} })
                 : typeof k === "string" ? () => {} : undefined),
  set: () => true,
});
const stubEl = () => ({
  innerHTML: "", textContent: "", className: "", value: "", checked: false,
  style: {}, dataset: {}, onclick: null, oninput: null, onchange: null,
  querySelectorAll: () => [], querySelector: () => null, appendChild: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  getBoundingClientRect: () => ({ width: 800, height: 400, left: 0, top: 0 }),
  getContext: () => stubCtx, width: 800, height: 400, offsetWidth: 800, offsetHeight: 400,
  /* A real canvas has attributes and a class list.  The relief sets tabindex on itself so it can
   * be turned with the arrow keys, and a stub that cannot answer hasAttribute is a stub that has
   * stopped modelling a canvas — the smoke would be reporting my stub rather than their code. */
  hasAttribute: () => false, setAttribute: () => {}, removeAttribute: () => {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  clientWidth: 800, clientHeight: 400, focus() {}, title: "",
});
const stubDoc = { _els: new Map(),
  getElementById(id) { if (!this._els.has(id)) this._els.set(id, stubEl()); return this._els.get(id); },
  createElement: stubEl, querySelectorAll: () => [] };
const hadDoc = typeof globalThis.document !== "undefined";
if (!hadDoc) globalThis.document = stubDoc;
const hadCS = typeof globalThis.getComputedStyle !== "undefined";
if (!hadCS) globalThis.getComputedStyle = () => new Proxy({}, {
  get: (t, k) => (k === "getPropertyValue" ? () => "#888888" : "#888888") });
const hadWin = typeof globalThis.window !== "undefined";
if (!hadWin) globalThis.window = { devicePixelRatio: 1, innerWidth: 1200, innerHeight: 900,
                                   addEventListener: () => {},
                                   requestAnimationFrame: (f) => { f && f(0); return 0; },
                                   matchMedia: () => ({ matches: false, addEventListener() {} }) };
if (typeof globalThis.setTimeout !== "function") globalThis.setTimeout = () => {};
const renderErrors = [];
let rendered = 0;
/* The shell resolves with the UNION of the group's modules, not one section's -- anomalies needs a
 * capability the hierarchy module provides.  A smoke that used s.modules alone would be testing a
 * configuration the app never runs. */
const modsOf = (g) => {
  const seen = new Set(), out = [];
  for (const s of secs) if (s.group === g)
    for (const m of s.modules || []) if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
  return out;
};
for (const s of secs.filter((x) => x.ready)) {
  const DS = DATASETS[s.group], MODSG = modsOf(s.group);
  const rows = (DS.published_rows && DS.published_rows[0] && DS.published_rows[0].bulk) ||
               [{ rep: DS.catalogue ? DS.catalogue[0].name : Object.keys(DS.reps)[0],
                  parities: [1, 1], multiplicity: 1, eta: 1, role: 1 }];
  const m = api.complete({ schema_version: api.SCHEMA_VERSION, group: DS.group,
                           orbifold: { name: DS.orbifold.name }, brane: [], conventions: {},
                           bulk: rows }).model;
  const slots = (m.bulk || []).map((b) => ({ rep: b.rep, key: "(+,+)", parities: b.parities }));
  const c = { DATA: DS, SLOTS: slots, group: s.group,
              n: slots.map(() => 1), eta: slots.map(() => 1), role: slots.map(() => 1),
              brane: { X_Q: "", rungs: null, q_phi: "" },
              setN: () => {}, setEta: () => {}, setRole: () => {}, setBrane: () => {}, load: () => {},
              clear: () => {}, refresh: () => {}, model: () => m,
              resolve: () => res(), MODS: MODSG };
  /* The shell hands render() `{model, values, skipped}` -- resolve() alone returns no model, and a
   * smoke that passed the raw result would test a shape the app never produces. */
  const res = () => ({ model: m, ...api.resolve(MODSG, m) });
  try { s.init && s.init(c); s.render(c, res()); rendered++; }
  catch (e) {
    renderErrors.push(`${s.id}: ${e.message}`);
    if (process.env.TRACE) console.log(`   trace ${s.id}: ${e.stack}`);
  }
}
if (!hadDoc) delete globalThis.document;
if (!hadWin) delete globalThis.window;
if (!hadCS) delete globalThis.getComputedStyle;
ok("every built section renders without throwing", renderErrors.length === 0,
   renderErrors.join(" | "));
ok("and the smoke actually rendered them", rendered === secs.filter((x) => x.ready).length,
   `${rendered} rendered`);

/* WHAT THE PAGE SAYS ABOUT ITSELF.
 *
 * The honesty vocabulary is per VALUE, and a status on every number does not add up to the shape of
 * what is missing.  Two things carry that shape, and both are easy to delete by accident because
 * nothing computes from them: the limits panel, and the caveat on the model the tool opens with. */
ok("the page states what it cannot tell you, once, permanently",
   PAGE.includes("What this tool cannot tell you"));
for (const claim of ["Absolute scales are not settled", "One published case",
                     "Two models, not a framework", "One loop, no running",
                     "It is a page, not a library"])
  ok(`and names the limit: ${claim.toLowerCase()}`, PAGE.includes(claim));
ok("and it says which quantities escape the caveat",
   /mass ratio[\s\S]{0,120}bill in eighths[\s\S]{0,120}arithmetic laws/.test(PAGE));

/* The SU(7) anchor is the row where our alpha agrees best with the published one -- 1.03x where
 * others run to 2.08x -- and opening on your best case without saying so is self-flattery. */
ok("the SU(7) anchor carries the caveat that it is the best-agreeing row",
   /best/.test(DATASETS.su7_km25.anchor?.caveat || ""), DATASETS.su7_km25.anchor?.caveat);
ok("and the band it quotes is the band the constants carry",
   (DATASETS.su7_km25.anchor.caveat.match(/([\d.]+)x to ([\d.]+)x/) || []).slice(1, 3)
     .map(Number).join(",") === DATASETS.su7_km25.constants.anchor_band.join(","),
   `${DATASETS.su7_km25.anchor.caveat} vs ${DATASETS.su7_km25.constants.anchor_band}`);
ok("the header has somewhere to show it", PAGE.includes('id="topCaveat"'));

/* THE INSTRUMENT MUST NOT OPEN EMPTY.  Three of the five sections shipped opening on a blank model
 * -- every cell a dash, the header reading UNKNOWN 10 -- because the seed ran for the active group
 * only.  And the seed matches on the parity key, so an anchor naming a multiplet no slot carries
 * would silently seed nothing and look exactly like the bug it replaced. */
for (const g of [...new Set(secs.map((s) => s.group))]) {
  const DS = DATASETS[g];
  ok(`${g} declares the content it opens on`, !!(DS.anchor && DS.anchor.bulk?.length),
     JSON.stringify(DS.anchor || null));
  if (!DS.anchor?.bulk) continue;
  /* Rebuild the shell's slots and its parity match, exactly as app.js does. */
  const slots = [];
  for (const rep of Object.keys(DS.reps || DS.reps_modes || {}))
    for (const key of Object.keys((DS.reps && DS.reps[rep]) || { "(+,+)": 1 }))
      slots.push({ rep, key });
  const matched = DS.anchor.bulk.filter((b) => slots.some((s) => s.rep === b.rep &&
    (b.parities[0] > 0 ? "+" : "-") === s.key[1] && (b.parities[1] > 0 ? "+" : "-") === s.key[3]));
  ok(`${g}'s anchor lands on real slots — every multiplet of it, parities included`,
     matched.length === DS.anchor.bulk.length,
     `${matched.length} of ${DS.anchor.bulk.length}: ` +
     DS.anchor.bulk.map((b) => `${b.rep}(${b.parities})`).join(" "));
  const am = api.complete({ schema_version: api.SCHEMA_VERSION, group: DS.group,
                            orbifold: { name: DS.orbifold.name }, brane: [], conventions: {},
                            bulk: DS.anchor.bulk }).model;
  ok(`${g} opens on something the kernel can actually resolve`,
     api.resolve(modsOf(g), am).values.size > 0);
}

ok("the shell holds the model, not the section — no section defines its own state",
   !/hierarchy_section[\s\S]*?state\s*=/.test(PAGE.slice(i1, i1 + 4000)));

/* ---- the published Part VII, in the page that ships ------------------------------------- */
/* The draft this instrument was closed on knew one ceiling.  The page must now carry the four
 * levels, the false-vacuum verdict and the gauge-seed fork -- and carry them in the SHIPPED
 * engine, not only in src/. */
console.log("\n  the published Part VII, through the shipped engine:");
ok("the SU(7) data carries the four levels of the ceiling and both gauge seeds",
   !!DATA.ceilings?.true_vacuum && !!DATA.gauge_seeds?.candidate);
{
  const MODS7v = modsOf("su7_km25");
  const w = modelOf({ bulk: DATA.ceilings.attained.witness });
  const v = api.resolve(MODS7v, w).values;
  ok("the shipped engine calls the attained witness a false vacuum",
     v.get("vacuum").value.true === false && v.get("W").value < 0);
  const cand = api.complete({ schema_version: api.SCHEMA_VERSION, group: DATA.group,
                              orbifold: { name: DATA.orbifold.name }, brane: [],
                              conventions: { gauge_seed: "candidate" },
                              bulk: DATA.published_rows[1].bulk }).model;
  const vc = api.resolve(MODS7v, cand).values;
  ok("and on the candidate seed row (2) has 8D = 38, even, with the laws still holding",
     vc.get("D8").value === 38 && vc.get("laws").value.all === true && !vc.get("laws").value.odd,
     `${vc.get("D8").value} ${JSON.stringify(vc.get("laws").value)}`);
  /* the smoke again, on the candidate seed: every SU(7) section must render a model that stands
   * on it, or the fork exists in the kernel and not in the page */
  const errs = [];
  if (!hadDoc) globalThis.document = stubDoc;
  if (!hadCS) globalThis.getComputedStyle = () => new Proxy({}, {
    get: (t, k) => (k === "getPropertyValue" ? () => "#888888" : "#888888") });
  if (!hadWin) globalThis.window = { devicePixelRatio: 1, innerWidth: 1200, innerHeight: 900,
                                     addEventListener: () => {},
                                     requestAnimationFrame: (f) => { f && f(0); return 0; },
                                     matchMedia: () => ({ matches: false, addEventListener() {} }) };
  for (const s of secs.filter((x) => x.ready && x.group === "su7_km25")) {
    const slots = (cand.bulk || []).map((b) => ({ rep: b.rep, key: "(+,+)", parities: b.parities }));
    const c = { DATA, SLOTS: slots, group: s.group, seed: "candidate",
                n: slots.map(() => 1), eta: slots.map(() => 1), role: slots.map(() => 1),
                brane: { X_Q: "", rungs: null, q_phi: "" },
                setN: () => {}, setEta: () => {}, setRole: () => {}, setSeed: () => {},
                setBrane: () => {}, load: () => {},
                clear: () => {}, refresh: () => {}, model: () => cand,
                resolve: () => ({ model: cand, ...api.resolve(MODS7v, cand) }), MODS: MODS7v };
    try { s.init && s.init(c); s.render(c, { model: cand, ...api.resolve(MODS7v, cand) }); }
    catch (e) { errs.push(`${s.id}: ${e.message}`); }
  }
  if (!hadDoc) delete globalThis.document;
  if (!hadWin) delete globalThis.window;
  if (!hadCS) delete globalThis.getComputedStyle;
  ok("every SU(7) section renders a model standing on the candidate seed", errs.length === 0,
     errs.join(" | "));
}
for (const s of ["true vacuum", "false vacuum", "candidate split", "The four levels of the ceiling",
                 "The other symmetric point", "2W is odd", "Theorem 2, on either seed"])
  ok(`the page says: ${s}`, PAGE.includes(s));
ok("the page no longer calls the relaxation's bound 'the certified ceiling' without qualification",
   !PAGE.includes("certified ceiling ${(ceil.ceiling_GeV"));
ok("the gauge seed is a declared default, echoed like every other",
   PAGE.includes("conventions.gauge_seed") && PAGE.includes("as printed in arXiv:2503.04090 eq. (68)"));

/* A page opened WITH a permalink used to render nothing: `if (!decode()) render();`.  The guard is
 * a string, because the DOM is not here; the shooter opens a real permalink and is the proof. */
ok("a permalink is decoded AND rendered -- deep links are not dead on arrival",
   /decode\(\);\s*\n\s*render\(\);/.test(PAGE) && !/\n\s*if \(!decode\(\)\) render\(\);/.test(PAGE));

/* The brane travels in the permalink exactly as the seed does, and both go through one sanitiser:
 * a typed field and a shared link cannot obey different rules. */
ok("the brane travels in the permalink, beside the seed",
   PAGE.includes(".brane=") && PAGE.includes(".seed="));
ok("the model record carries what the user typed of the brane",
   /brane:\s*braneList\(group\)/.test(PAGE) && /cleanBrane\(/.test(PAGE));


/* ---- the catalogue, and the escape's price on it ---------------------------------------- */
/* The five rows are their Table 1.  The catalogue block is the rest of the lattice, enumerated by
 * ceiling_ilp.py and certified there -- so what this harness can do is refuse to take any of it on
 * trust: recompute the bill with the SHIPPED engine, re-derive the bound from it, and require the
 * certificate to dominate every content the enumeration actually found. */
console.log("\n  the catalogue, and Part VI's escape priced on it:");
const CAT = DATA.size_curve, ESC = DATA.escape;
ok("the SU(7) data carries a size curve and an escape block", !!CAT && !!ESC);

/* the UNION the app actually runs -- `api.modules(DATA)` is the hierarchy set and has no donation */
const MODS7 = modsOf("su7_km25");
const d8of = (bulk) => api.resolve(MODS7, api.complete({
  schema_version: api.SCHEMA_VERSION, group: DATA.group, orbifold: { name: DATA.orbifold.name },
  brane: [], conventions: {}, bulk }).model).values.get("D8").value;
const HOSTB = (m) => [{ rep: "84", parities: [1, 1], multiplicity: m }];
const costLive = d8of(HOSTB(2)) - d8of(HOSTB(1));
ok(`the bill is the host's own 8D, recomputed by the shipped engine: ${costLive}/8`,
   costLive === ESC.cost8, `data says ${ESC.cost8}, the engine says ${costLive}`);
ok(`and the bound is the smallest ODD rung above it: 8D >= ${ESC.min_8D}`,
   ESC.min_8D % 2 === 1 && ESC.min_8D > costLive && ESC.min_8D - 2 <= costLive);

/* The bound and the module must be the same statement said twice.  If `donation.survives` and
 * `8D >= min_8D` ever disagree on a row, one of them is wrong and the page shows both. */
let agree = 0;
for (const row of DATA.published_rows) {
  const rr = api.resolve(MODS7, modelOf(row));
  const don = rr.values.get("donation").value;
  if (!don.available || don.survives === (rr.values.get("D8").value >= ESC.min_8D)) agree++;
}
ok("every published row's `survives` verdict agrees with 8D >= min_8D",
   agree === DATA.published_rows.length, `${agree} of ${DATA.published_rows.length}`);

/* The enumeration is over multisets of the eight slots, so its size is forced: C(N+8,8) - 1. */
const CH = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const SLOTN = Object.values(DATA.reps).reduce((s, x) => s + Object.keys(x).length, 0);
ok(`the enumeration is complete for all ${SLOTN} slots — every N has C(N+${SLOTN},${SLOTN})-1 contents`,
   CAT.every((r) => r.contents === CH(r.N + SLOTN, SLOTN) - 1),
   CAT.filter((r) => r.contents !== CH(r.N + SLOTN, SLOTN) - 1)
      .map((r) => `N=${r.N}: ${r.contents} != ${CH(r.N + SLOTN, SLOTN) - 1}`).join("; "));
ok("the counts nest: can pay <= hold host <= in window <= contents",
   CAT.every((r) => r.can_pay <= r.with_host && r.with_host <= r.in_window &&
                    r.in_window <= r.contents));
ok("at N=5 exactly one content lands in the window — their row (2), and it is 8D = 29",
   CAT[0].N === 5 && CAT[0].in_window === 1 && CAT[0].best_8D === 29);

/* THE CERTIFICATE MUST DOMINATE THE ENUMERATION.  This is the check the whole panel rests on. */
const dominates = (rows) =>
  rows.every((r) => r.best_invR5 <= DATA.constants.ceiling_GeV &&
                    (r.best_invR5_paying === null || r.best_invR5_paying <= ESC.ceiling_GeV));
ok(`the certified ceilings dominate every content found: ${ESC.ceiling_GeV} GeV paying, ` +
   `${DATA.constants.ceiling_GeV} GeV free`, dominates(CAT));
/* and the guard fires -- a content one GeV over the escape ceiling must break it */
ok("...and that check is not vacuous: it fails on a content one GeV above the ceiling",
   !dominates(CAT.map((r, i) => i ? r : { ...r, best_invR5_paying: ESC.ceiling_GeV + 1 })));

ok("the escape ceiling is strictly below the free one, and the stated ratio is the two of them",
   ESC.ceiling_GeV < DATA.constants.ceiling_GeV &&
   Math.abs(ESC.ratio - DATA.constants.ceiling_GeV / ESC.ceiling_GeV) < 0.005,
   `${DATA.constants.ceiling_GeV}/${ESC.ceiling_GeV} = ` +
   `${(DATA.constants.ceiling_GeV / ESC.ceiling_GeV).toFixed(3)}, data says ${ESC.ratio}`);
ok("the escape ceiling sits ON the bound it comes from — 8D = min_8D",
   ESC.ceiling_8D === ESC.min_8D);
/* The point of the whole panel: the champion of the free ceiling cannot pay. */
const freeChamp = CAT[CAT.length - 1];
ok("the largest hierarchy in the catalogue is generated by a content that cannot pay the escape",
   freeChamp.best_8D < ESC.min_8D && freeChamp.best_invR5 > freeChamp.best_invR5_paying,
   `free champion 8D=${freeChamp.best_8D} at ${freeChamp.best_invR5} GeV, ` +
   `best paying 8D=${freeChamp.best_8D_paying} at ${freeChamp.best_invR5_paying} GeV`);

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

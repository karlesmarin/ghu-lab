/* _test_latex.mjs — the export that goes into a paper, and the citation it carries.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Three things are checked, and the third is the one that matters most.
 *
 *   1. The LaTeX is the CARD.  Same numbers, same statuses, same sources -- because a number in a
 *      paper that is not the number in the card makes the whole honesty apparatus decoration.
 *   2. The potential is the paper's.  Rendered from `sun5d.mjs` terms for Haba-Yamashita's own
 *      worked examples, it must read as their equations read.
 *   3. NOTHING IS LOST IN THE TRANSPORT.  Every string this instrument can put in an export is
 *      pushed through `tex()`, and an unmapped glyph THROWS.  On 2026-08-30 this project spent a
 *      day proving a correct published formula wrong because a PDF text layer silently dropped two
 *      absolute-value bars.  A silent drop is the enemy; this is where we refuse to be on the other
 *      side of it.
 *
 *   node _test_latex.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { tex, texMath, texSafe, frac, termLatex, potentialLatex, resultsTable, toLatex, toBibtex }
  from "./src/kernel/latex.mjs";
import { SOURCES, citeText, bibtex, sourcesFor } from "./src/kernel/cite.mjs";
import { makeCard } from "./src/kernel/card.mjs";
import { val, unknown, STATUS } from "./src/kernel/status.mjs";
import { sun5dBlocks, sun5dTerms, sun5dNames, SUN5D_DOF } from "./src/modules/sun5d.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* ------------------------------------------------------------------ 1. the glyph transport */

H("nothing is lost in the transport, and what cannot be carried says so");
{
  ok("LaTeX's own specials are escaped", tex("a_b 100% & #1 {x}") === "a\\_b 100\\% \\& \\#1 \\{x\\}");
  ok("a backslash does not eat its own replacement", tex("\\alpha") === "\\textbackslash{}alpha");

  /* THE MINUS SIGN.  U+2212 looks exactly like a hyphen in a terminal and is not one; every
   * potential this instrument prints uses it. */
  ok("U+2212 is carried, not passed through", tex("a − 1").includes("\\ensuremath{-}"));
  ok("...and it is NOT the same character as a hyphen", "−" !== "-");

  ok("subscripts and superscripts survive", tex("A₄ · n⁺₊").includes("_4") &&
                                            tex("A₄ · n⁺₊").includes("^+"));
  ok("greek survives", tex("α_min at θ") === "\\ensuremath{\\alpha}\\_min at \\ensuremath{\\theta}");
  ok("the author's name survives", tex("Carles Marín") === "Carles Mar\\'{\\i}n");

  /* the refusal */
  let threw = false;
  try { tex("a ☃ b"); } catch (e) { threw = /U\+2603/.test(e.message); }
  ok("an unmapped glyph THROWS and names its code point", threw);
  ok("...and texSafe() reports it without throwing", texSafe("a ☃ b") === false &&
                                                     texSafe("A₄") === true);
}

H("every string the instrument can export actually survives");
{
  /* the real corpus: every string in every data file, plus the citation registry */
  const bad = [];
  const walk = (x) => {
    if (typeof x === "string") { if (!texSafe(x)) bad.push(x.slice(0, 60)); }
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") { Object.keys(x).forEach((k) => { walk(k); walk(x[k]); }); }
  };
  for (const f of readdirSync(new URL("./data/", import.meta.url)))
    if (f.endsWith(".json")) walk(JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), "utf8")));
  walk(SOURCES);
  ok(`every string in data/ and in the citation registry is exportable`, bad.length === 0,
     bad.slice(0, 3).join(" | "));
}

H("a symbol is typeset as a symbol, and prose as prose");
{
  /* `sun5dUnbroken` returns a formula.  Escaped as text, its caret becomes a visible accent. */
  ok("a group string becomes math, not a caret",
     texMath("SU(3) \u00d7 U(1)^2") === "\\ensuremath{\\mathrm{SU}(3) \\times  \\mathrm{U}(1)^{2}}",
     texMath("SU(3) \u00d7 U(1)^2"));
  ok("...and the same string through tex() is escaped, which is right for prose",
     tex("U(1)^2") === "U(1)\\textasciicircum{}2");
  ok("a multi-character exponent is braced, so T^{10} is not T^1 0",
     texMath("T^10") === "\\ensuremath{T^{10}}");
  ok("texMath refuses a glyph it cannot carry rather than dropping it",
     (() => { try { texMath("a \u2603"); return false; } catch { return true; } })());

  /* the line between data and authored prose */
  const card = makeCard({ group: "su3_hy" },
                        { g: val("SU(2)", { status: STATUS.THEOREM, source: "eq. (5.2)" }) },
                        { version: "t" });
  const t1 = resultsTable(card, { caption: "A model on $S^1/Z_2$." });
  ok("an author's caption is passed through verbatim, so they may write maths in it",
     t1.includes("$S^1/Z_2$"), t1.split("\n").find((l) => l.includes("caption")));
  ok("but a VALUE out of the card is escaped by default",
     resultsTable(card).includes("SU(2)"));
  ok("...and typeset as maths when the caller says that key is a symbol",
     resultsTable(card, { mathKeys: ["g"] }).includes("\\mathrm{SU}(2)"));

  const b = makeCard({ group: "su3_hy" },
                     { edge: val(true, { status: STATUS.MEASURED, source: "grid" }) },
                     { version: "t" });
  ok("a boolean reads as yes/no, not as the word true in a physics table",
     resultsTable(b).includes("& yes &"));
}

/* ------------------------------------------------------------------ 2. numbers and terms */

H("a coefficient prints as the exact thing it is");
{
  ok("an integer stays an integer", frac(6) === "6" && frac(-3) === "-3");
  ok("the gauge sector's -3/2 is a fraction, not -1.5", frac(-1.5) === "-\\tfrac{3}{2}");
  ok("and so is 1/2", frac(0.5) === "\\tfrac{1}{2}");
}

H("the potential reads the way the paper prints it");
{
  /* Haba-Yamashita section 4.3: SU(6), P = diag(+,+,+,+,-,-), P' = diag(+,-,-,-,-,-).
   * Their eq. (4.29) is  6cos(n pi (a-1)) + 2cos(n pi a) + cos(2 n pi a),  for one d.o.f. */
  const b = sun5dBlocks({ nPP: 1, nPM: 3, nMP: 0, nMM: 2 });
  ok("the block reading is theirs", b.A === 1 && b.B === 0 && b.leftA === 1 && b.leftB === 3);

  const terms = sun5dTerms(b, []);                    /* gauge and ghosts alone: -3 x (5.9) */
  const eq = potentialLatex(terms, { names: sun5dNames(b) });
  ok("a single-variable term prints as cos(2n\\pi a), the paper's shape",
     eq.includes("\\cos(2n\\pi a)"), eq);
  ok("a shifted term prints as cos(n\\pi(a - 1))", eq.includes("\\cos(n\\pi(a - 1))"), eq);
  ok("the gauge sector is -3 times theirs, so every coefficient is negative",
     !/\+\s/.test(eq.split("\\Bigl[")[1]), eq);
  ok("and it carries the paper's C/2, not the kernel's C", eq.includes("\\frac{C}{2}"));

  /* a two-phase model, where the arguments combine */
  const b2 = sun5dBlocks({ nPP: 3, nPM: 0, nMP: 0, nMM: 2 });   /* their section 4.1, SU(5) */
  const eq2 = potentialLatex(sun5dTerms(b2, []), { names: sun5dNames(b2) });
  /* two A-phases, so `sun5dNames` calls them a1 and a2 -- and they must reach LaTeX as a_{1},
   * a_{2}.  Emitted raw, "a2" typesets as the letter a beside the digit 2. */
  ok("a two-phase model prints its cross terms", eq2.includes("\\cos(n\\pi(a_{1} + a_{2}))") &&
                                                 eq2.includes("\\cos(n\\pi(a_{1} - a_{2}))"), eq2);
  ok("...with the phase index as a SUBSCRIPT, not a digit next to a letter",
     !/a2|a1/.test(eq2), eq2);

  /* a phase-independent term is dropped, exactly as the paper drops it */
  ok("a constant term is omitted, as the paper omits it",
     termLatex({ m: 1, v: [0], d: 0 }) === null);
}

/* ------------------------------------------------------------------ 3. the card, again */

H("the LaTeX is the card, not a second version of it");
{
  const values = {
    alpha_min: val(0.08358, { status: STATUS.MEASURED, source: "browser, direct minimisation" }),
    "8D": val(29, { status: STATUS.THEOREM, source: "Part VII eq. (34)" }),
    m_h: val(125.9, { units: "GeV", status: STATUS.MEASURED, source: "identity (II)" }),
    anchor: unknown("the normalisation of alpha against KM25 is open — Part VI section 7"),
  };
  const card = makeCard({ group: "su7_km25", content: [] }, values,
                        { version: "1.0.0", kernelHash: "8F419F618DF3" });
  const out = toLatex(card, { label: "tab:demo", group: "su7_km25", date: "2026-08-30" });

  /* the key carries a break opportunity at each underscore, or `boundary_condition` overfills its
   * column -- so the expectation has to know that, the same way the renderer does */
  const keyIn = (k) => out.includes(tex(k).replace(/\\_/g, "\\_\\allowbreak{}"));
  ok("every result reaches the table", Object.keys(values).every(keyIn),
     Object.keys(values).filter((k) => !keyIn(k)).join(", "));
  ok("...and a multi-word key may break, so it does not run off its column",
     out.includes("\\_\\allowbreak{}"));
  ok("the numbers are the card's", out.includes("0.08358") && out.includes("125.9"));
  ok("the status column is there, per row", (out.match(/\\textsc\{/g) || []).length >= 4);
  ok("an unknown prints its REASON in the table, not a blank cell",
     out.includes("\\textsc{unknown}") && out.includes("Part VI section 7"));
  ok("the units travel with the value", out.includes("GeV"));
  ok("the provenance is in the file", out.includes("8F419F618DF3") && out.includes("0009-0007-5637-9688"));
  ok("the tally is stated, so a reader sees the mix at a glance",
     /1 theorem, 0 verified, 2 measured, 1 unknown/.test(out), out.split("\n").find((l) => l.includes("theorem,")));
  ok("the weakest thing is named", out.includes("weakest thing here is"));
  ok("it says what packages it needs", out.includes("booktabs"));

  /* the whole point: it takes its bibliography with it */
  /* THE BIBLIOGRAPHY IS NOT IN THE .tex, AND THAT IS THE POINT.  Compiled, BibTeX entries in the
   * body typeset as a paragraph of prose; the PDF showed it.  The .tex points, the .bib carries. */
  ok("the .tex points at the entries rather than printing them",
     out.includes("companion .bib") && out.includes("\cite{Haba:2004qh}"));
  ok("...and carries no raw BibTeX that LaTeX would typeset as prose",
     !/^@\w+\{/m.test(out));
  const bib = toBibtex("su7_km25");
  ok("the .bib carries them, keyed the way INSPIRE keys them",
     bib.includes("@article{Haba:2004qh") && bib.includes("Komori:2025wji"));
  ok("...with the DOI, so it resolves when a URL rots",
     bib.includes("10.1088/1126-6708/2004/02/059"));

  /* and nothing in a real export is unexportable */
  ok("the export is pure ASCII, so pdflatex takes it", !/[^\x00-\x7f]/.test(out));

  const alone = toLatex(card, { standalone: true, group: "su7_km25" });
  ok("standalone carries its own preamble and ends the document",
     alone.includes("\\documentclass") && alone.trim().endsWith("\\end{document}"));
  ok("...and asks for cmap, so its OWN pdf's text layer survives extraction",
     alone.includes("cmap"));
}

/* ------------------------------------------------------------------ 4. the citation */

H("the citation lives in one place, and it is the right one");
{
  ok("Haba-Yamashita is JHEP 02, not 05", citeText("HY04") ===
     "N. Haba, T. Yamashita, JHEP 02 (2004) 059 (hep-ph/0401185)");
  ok("...with the DOI INSPIRE gives", SOURCES.HY04.doi === "10.1088/1126-6708/2004/02/059");
  ok("a preprint says arXiv and does not invent a journal",
     citeText("KM25") === "Y. Komori, N. Maru, arXiv:2503.04090" && !SOURCES.KM25.journal);
  ok("bibtex switches kind for a preprint", bibtex("KM25").startsWith("@misc{"));
  ok("every registered source has a texkey, an eprint and authors",
     Object.values(SOURCES).every((s) => s.texkey && s.eprint && s.authors.length));
  ok("a group cites what it rests on and not the whole catalogue",
     sourcesFor("su4_ahmn").map((s) => s.id).join() === "AHMN23,ACG01");
  let threw = false;
  try { citeText("NOPE"); } catch { threw = true; }
  ok("an unregistered source is an error, not an empty string", threw);
}

H("every bibliography entry is typesettable, because it lands in someone else's document");
{
  /* A .bib field is LaTeX.  `S^1/Z_2` in a title is `Missing $ inserted` in the READER's build,
   * which is the worst place to find out: their document, our entry.  pdflatex found three of
   * these; this is the check that keeps the fourth from shipping. */
  const bad = [];
  for (const [id, s] of Object.entries(SOURCES)) {
    const fields = [s.title, s.authors.join(" and "), s.journal || "", String(s.volume || "")];
    for (const f of fields) {
      /* strip $...$ and complain about maths characters left outside it */
      const outside = f.replace(/\$[^$]*\$/g, "");
      if (/[\^_]/.test(outside)) bad.push(`${id}: ${f}`);
      if ((f.match(/\$/g) || []).length % 2) bad.push(`${id}: unbalanced $ in ${f}`);
      if (/[^\x20-\x7e]/.test(f)) bad.push(`${id}: non-ASCII in ${f}`);
    }
  }
  ok("no registry field carries bare maths or an unbalanced delimiter", bad.length === 0,
     bad.slice(0, 3).join(" | "));

  /* and the emitted BibTeX itself */
  for (const id of Object.keys(SOURCES)) {
    const b = bibtex(id);
    if (/[^\x20-\x7e\n]/.test(b)) bad.push(`${id}: bibtex is not ASCII`);
  }
  ok("every emitted entry is pure ASCII", bad.length === 0, bad.slice(0, 2).join(" | "));
}

H("and no file in the tree contradicts the registry");
{
  /* THE DRIFT THAT HAPPENED.  The wrong volume for the 2004 paper was typed into seven files and
   * displayed on the page.  This is the gate that makes the eighth fail the build.
   *
   * (Phrased without the offending string on purpose: a gate that greps the tree greps ITSELF, and
   * a comment quoting the thing it forbids is a false positive that teaches everyone to ignore the
   * gate.  Same reason the registry's own header states the volume in words.) */
  const root = new URL("./", import.meta.url);
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(new URL(dir, root), { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "shots" ||
          e.name === "app" || e.name === "site" || e.name === "editions" ||
          e.name === "__pycache__") continue;
      const p = dir + e.name + (e.isDirectory() ? "/" : "");
      if (e.isDirectory()) walk(p);
      else if (/\.(mjs|js|py|json|md)$/.test(e.name)) files.push(p);
    }
  };
  walk("");

  const offenders = [];
  for (const f of files) {
    const src = readFileSync(new URL(f, root), "utf8");
    for (const s of Object.values(SOURCES)) {
      if (!s.journal) continue;
      const bare = s.eprint.replace(/^arXiv:/, "");
      if (!src.includes(bare)) continue;
      /* any journal line for THIS journal, in this file, must carry the registry's volume */
      const re = new RegExp(`${s.journal.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s+(\\d+)\\s*\\(${s.year}\\)`, "g");
      let m;
      while ((m = re.exec(src)) !== null)
        if (m[1] !== String(s.volume)) offenders.push(`${f}: ${s.journal} ${m[1]} (${s.year}) — registry says ${s.volume}`);
    }
  }
  ok(`no file prints a volume the registry disagrees with (${files.length} files swept)`,
     offenders.length === 0, offenders.slice(0, 4).join("  |  "));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

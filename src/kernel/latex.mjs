/* latex.mjs — the result card, again, in the form that goes into a paper.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE SAME OBJECT, A THIRD TIME.  `card.mjs` builds one export object; `toText` renders it flat for
 * an e-mail, the JSON renders it for a machine, and this renders it for LaTeX.  Three
 * serialisations, one source: a number that appears in a paper is the number the card carries, or
 * the whole honesty apparatus is decoration.  `_test_latex.mjs` holds them to each other.
 *
 * WHAT IT IS FOR.  A reader with a model of their own can already get its potential out of the
 * SU(N) builder; what they then have to do by hand is retype it into their draft, and retyping is
 * where a sign goes missing.  This writes the table, the potential and the bibliography, and the
 * bibliography is the point as much as the table: the entry for the formula everything here rests
 * on travels WITH the numbers, keyed the way INSPIRE keys it, so citing it is the default rather
 * than an act of virtue.
 *
 * AND THE STATUS COLUMN IS NOT OPTIONAL.  `theorem / verified / measured / unknown` is the axis
 * this instrument exists to add, so it is a column, not a footnote, and `unknown` prints its reason
 * in the table rather than as a blank cell.  A table that hides which of its rows are proved is a
 * table that will be read as if all of them were.
 *
 * THE GLYPH RULE, LEARNED THE HARD WAY ON 2026-08-30.  Every string in this instrument is full of
 * Unicode -- alpha, subscripts, the minus sign U+2212, the middle dot -- and `pdflatex` does not
 * take it.  A transport that drops what it cannot carry is exactly the failure that cost this
 * project a day (a PDF text layer silently ate the absolute-value bars of a published formula and
 * we spent a day proving the paper wrong).  So `tex()` maps what it knows and THROWS on what it
 * does not: an export that cannot be typeset must fail loudly here, never quietly there.
 */

import { STATUS } from "./status.mjs";
import { TOOL } from "./meta.mjs";
import { SOURCES, bibtex, citeText, sourcesFor } from "./cite.mjs";

/* ------------------------------------------------------------------ the glyph table */

/* LaTeX's own specials, in text mode.
 *
 * ONE PASS, and that is not a style choice.  Written as a sequence of replacements -- backslash
 * first, then the brace class -- the second rule escapes the braces the FIRST rule just inserted,
 * and `\textbackslash{}` comes out as `\textbackslash\{\}`.  The harness caught it.  Substituting
 * into text you have already substituted into is the whole family of bug; here every character of
 * the INPUT is looked at exactly once and never revisited.
 */
const SPECIAL = Object.freeze({
  "\\": "\\textbackslash{}",
  "{": "\\{", "}": "\\}", "$": "\\$", "&": "\\&", "#": "\\#", "_": "\\_", "%": "\\%",
  "~": "\\textasciitilde{}", "^": "\\textasciicircum{}",
});

const M = (s) => `\\ensuremath{${s}}`;

const GLYPH = new Map(Object.entries({
  /* greek, as it is actually used here */
  "α": M("\\alpha"), "β": M("\\beta"), "γ": M("\\gamma"), "δ": M("\\delta"),
  "ε": M("\\varepsilon"), "ζ": M("\\zeta"), "η": M("\\eta"), "θ": M("\\theta"),
  "κ": M("\\kappa"), "λ": M("\\lambda"), "μ": M("\\mu"), "ν": M("\\nu"), "ξ": M("\\xi"),
  "π": M("\\pi"), "ρ": M("\\rho"), "σ": M("\\sigma"), "τ": M("\\tau"), "φ": M("\\varphi"),
  "χ": M("\\chi"), "ψ": M("\\psi"), "ω": M("\\omega"),
  "Γ": M("\\Gamma"), "Δ": M("\\Delta"), "Θ": M("\\Theta"), "Λ": M("\\Lambda"),
  "Σ": M("\\Sigma"), "Φ": M("\\Phi"), "Ω": M("\\Omega"),
  /* sub- and superscripts: the instrument writes A₄ and n⁺₊ as characters, not as markup */
  "₀": M("_0"), "₁": M("_1"), "₂": M("_2"), "₃": M("_3"), "₄": M("_4"),
  "₅": M("_5"), "₆": M("_6"), "₇": M("_7"), "₈": M("_8"), "₉": M("_9"),
  "₊": M("_+"), "₋": M("_-"), "ᵢ": M("_i"), "ⱼ": M("_j"), "ₙ": M("_n"),
  "⁰": M("^0"), "¹": M("^1"), "²": M("^2"), "³": M("^3"), "⁴": M("^4"),
  "⁵": M("^5"), "⁶": M("^6"), "⁷": M("^7"), "⁸": M("^8"), "⁹": M("^9"),
  "⁺": M("^+"), "⁻": M("^-"), "′": M("'"), "″": M("''"),
  /* operators and relations.  U+2212 is the one that bites: it looks like a hyphen and is not. */
  "−": M("-"), "×": M("\\times"), "÷": M("\\div"), "±": M("\\pm"), "∓": M("\\mp"),
  "·": M("\\cdot"), "∘": M("\\circ"), "⊗": M("\\otimes"), "⊕": M("\\oplus"),
  "≤": M("\\leq"), "≥": M("\\geq"), "≠": M("\\neq"), "≈": M("\\approx"), "≡": M("\\equiv"),
  "∈": M("\\in"), "∉": M("\\notin"), "⊂": M("\\subset"), "∞": M("\\infty"),
  "√": M("\\sqrt{}"), "∑": M("\\sum"), "∏": M("\\prod"), "∫": M("\\int"), "∂": M("\\partial"),
  "→": M("\\to"), "←": M("\\leftarrow"), "↔": M("\\leftrightarrow"), "⇒": M("\\Rightarrow"),
  "†": M("\\dagger"), "⟨": M("\\langle"), "⟩": M("\\rangle"), "ℤ": M("\\mathbb{Z}"),
  "ℝ": M("\\mathbb{R}"), "ℚ": M("\\mathbb{Q}"), "ℂ": M("\\mathbb{C}"), "ℕ": M("\\mathbb{N}"),
  /* punctuation and the accented latin the author line needs */
  "§": "\\S{}", "—": "---", "–": "--", "…": "\\dots{}", "‑": "-",
  "“": "``", "”": "''", "‘": "`", "’": "'", "«": "\\guillemotleft{}", "»": "\\guillemotright{}",
  "á": "\\'{a}", "é": "\\'{e}", "í": "\\'{\\i}", "ó": "\\'{o}", "ú": "\\'{u}", "ñ": "\\~{n}",
  "Á": "\\'{A}", "É": "\\'{E}", "Í": "\\'{I}", "Ó": "\\'{O}", "Ú": "\\'{U}", "Ñ": "\\~{N}",
  "ü": '\\"{u}', "ö": '\\"{o}', "ä": '\\"{a}', "ç": "\\c{c}", "°": M("^\\circ"),
  "\u00a0": "~",
}));

/* Text to LaTeX.  Unmapped non-ASCII is an ERROR, not a silent drop: see the header.
 *
 * Split by CODE POINT rather than by code unit, so an astral character is one glyph to complain
 * about rather than two halves of one that match nothing. */
export function tex(s) {
  return Array.from(String(s ?? "")).map((ch) => {
    const sp = SPECIAL[ch];
    if (sp !== undefined) return sp;
    if (ch === "\n" || (ch >= " " && ch <= "~")) return ch;
    const t = GLYPH.get(ch);
    if (t === undefined)
      throw new Error(`latex: no LaTeX for U+${ch.codePointAt(0).toString(16).toUpperCase()
                      .padStart(4, "0")} (${JSON.stringify(ch)}) - add it to GLYPH rather than ` +
                      `letting the export lose it`);
    return t;
  }).join("");
}

/* Does this string survive the transport?  For a caller that would rather ask than catch. */
export function texSafe(s) {
  try { tex(s); return true; } catch { return false; }
}

/* SYMBOLS ARE NOT PROSE, AND ESCAPING THEM AS PROSE IS WRONG.
 *
 * `sun5dUnbroken` returns "SU(3) x SU(2) x U(1)^2".  Run through `tex()` -- which is correct for
 * text -- the caret becomes \textasciicircum{} and the reader sees a visible accent instead of an
 * exponent.  The string is a formula, so it is typeset as one.
 *
 * This is opt-in per key (`mathKeys`) rather than sniffed: "browser, grid + coordinate refinement"
 * would pass any character test I could write, and a value silently rendered in the wrong mode is
 * the class of bug this file exists to prevent.  The caller knows which of its results are symbols.
 */
export function texMath(s) {
  const body = String(s ?? "")
    .replace(/\u00d7/g, "\\times ")
    .replace(/\u2212/g, "-")
    .replace(/\u00b7/g, "\\cdot ")
    .replace(/([\^_])(\w+)/g, (_, op, arg) => `${op}{${arg}}`)
    .replace(/\b(SU|SO|Sp|U|E|G)\(/g, "\\mathrm{$1}(");
  const left = [...body].filter((c) => !/[\x20-\x7e]/.test(c));
  if (left.length)
    throw new Error(`latex: texMath cannot carry ${JSON.stringify(left[0])} — ` +
                    `add it to texMath or send the value through tex()`);
  return `\\ensuremath{${body}}`;
}

/* ------------------------------------------------------------------ numbers */

/* A coefficient like -3/2 must print as a fraction, not as -1.5: the paper it will sit next to
 * writes fractions, and 1.5 in a table of exact group-theory coefficients reads as a measurement. */
export function frac(x, { max = 64, tol = 1e-9 } = {}) {
  if (!Number.isFinite(x)) return "\\text{---}";
  if (Number.isInteger(x)) return String(x);
  const sign = x < 0 ? "-" : "";
  const a = Math.abs(x);
  for (let d = 2; d <= max; d++) {
    const n = a * d;
    if (Math.abs(n - Math.round(n)) < tol)
      return `${sign}\\tfrac{${Math.round(n)}}{${d}}`;
  }
  return (x).toPrecision(6).replace(/0+$/, "").replace(/\.$/, "");
}

/* ------------------------------------------------------------------ the potential */

/* A term is {m, v, d}: m cos(n pi (v . theta - d)), which is what `sun5d.mjs` produces and what
 * the paper prints.  Rendered in the paper's own shape: cos(2n\pi a) when it can be, and
 * cos(n\pi(a+b-1)) when it cannot. */
/* `sun5dNames` returns "a1", "a2" when a model has two A-phases, and typeset raw that reads as the
 * letter a followed by the digit 2.  The paper writes a_1.  A name is data, so it is converted
 * rather than assumed to be LaTeX already. */
const mathName = (n) => String(n).replace(/^([A-Za-z])(\d+)$/, "$1_{$2}");

export function termLatex(t, names = ["a", "b", "c"]) {
  const parts = [];
  t.v.forEach((k, i) => {
    if (!k) return;
    const nm = names[i] ? mathName(names[i]) : `\\theta_{${i + 1}}`;
    parts.push({ k, s: (Math.abs(k) === 1 ? "" : String(Math.abs(k))) + nm, neg: k < 0 });
  });
  if (!parts.length) return null;
  const single = parts.length === 1 && !t.d;
  if (single) {
    const p = parts[0];
    const c = Math.abs(p.k) === 1 ? "" : String(Math.abs(p.k));
    const i = t.v.findIndex((k) => k);
    return `\\cos(${p.neg ? "-" : ""}${c}n\\pi ${names[i] ? mathName(names[i]) : "a"})`;
  }
  let inner = parts.map((p, i) => (i === 0 ? (p.neg ? "-" : "") : (p.neg ? " - " : " + ")) + p.s)
                   .join("");
  if (t.d) inner += " - 1";
  return `\\cos(n\\pi(${inner}))`;
}

/* The whole potential, as a displayed equation.  `half` is the paper's C/2; the kernel's F drops
 * it, and which one you are looking at has bitten this project before, so it is written out. */
export function potentialLatex(terms, { names = ["a", "b", "c"], half = true,
                                        lhs = "V_{\\mathrm{eff}}" } = {}) {
  const rows = [];
  for (const t of terms) {
    const body = termLatex(t, names);
    if (body === null) continue;                       /* phase-independent: the paper omits it */
    const m = t.m;
    const sign = m < 0 ? "-" : (rows.length ? "+" : "");
    const mag = Math.abs(m) === 1 ? "" : frac(Math.abs(m));
    rows.push(`${sign} ${mag}${body}`);
  }
  const body = rows.length ? rows.join("\n      ") : "0";
  return `${lhs} = ${half ? "\\frac{C}{2}" : "C"}\\sum_{n=1}^{\\infty}\\frac{1}{n^{5}}\n` +
         `    \\Bigl[\n      ${body}\n    \\Bigr]`;
}

/* ------------------------------------------------------------------ the table */

const STATUS_TEX = {
  [STATUS.THEOREM]: "\\textsc{theorem}",
  [STATUS.VERIFIED]: "\\textsc{verified}",
  [STATUS.MEASURED]: "\\textsc{measured}",
  [STATUS.UNKNOWN]: "\\textsc{unknown}",
};

function valueTex(v, { math = false } = {}) {
  if (v.value === null) return "\\text{---}";
  if (typeof v.value === "number")
    return M(String(v.value)) + (v.units ? `~${tex(v.units)}` : "");
  if (typeof v.value === "boolean") return v.value ? "yes" : "no";
  return (math ? texMath : tex)(String(v.value)) + (v.units ? `~${tex(v.units)}` : "");
}

/* `caption` is passed through VERBATIM, and that is deliberate: a caption is written by the author
 * for their own paper, in their own LaTeX, and escaping it would forbid them a subscript.  Every
 * other string here comes out of the card -- it is data, and data is escaped.  The line between the
 * two is the whole reason this function takes a caption at all rather than composing one. */
export function resultsTable(card, { label = "tab:ghu-lab", caption = null,
                                     only = null, mathKeys = [] } = {}) {
  const rows = [];
  for (const [k, v] of Object.entries(card.results)) {
    if (only && !only.includes(k)) continue;
    const why = v.status === STATUS.UNKNOWN && v.reason ? ` --- ${tex(v.reason)}` : "";
    /* `boundary_condition` is one word to TeX and will not break, so it overfills whatever
     * column it is given.  The underscore is where a reader would break it anyway. */
    const key = tex(k).replace(/\\_/g, "\\_\\allowbreak{}");
    rows.push(`    ${key} & ${valueTex(v, { math: mathKeys.includes(k) })} & ` +
              `${STATUS_TEX[v.status]} & ${tex(v.source)}${why} \\\\`);
  }
  const cap = caption !== null ? caption
    : `Results for model ${tex(card.provenance.model_id)}, computed with ` +
      `\\textsc{${tex(TOOL.name)}} ${tex(card.provenance.version)}. ` +
      `Every row carries its epistemic status; ` +
      `\\textsc{unknown} is a verdict and states its reason.`;
  return [
    "\\begin{table}[htbp]",
    "  \\centering",
    `  \\caption{${cap}}`,
    `  \\label{${label}}`,
    /* THE SOURCE COLUMN WRAPS, AND THAT IS NOT COSMETIC.  With four `l` columns the table ran
     * 364pt past the text block -- pdflatex says so and prints it off the page anyway.  The
     * source is prose and prose is what has to wrap; the three data columns stay flush left so
     * the numbers line up.  \\small because a four-column table of provenance is a reference,
     * not body text. */
    "  \\small",
    "  \\begin{tabular}{@{}p{0.20\\textwidth}p{0.20\\textwidth}p{0.15\\textwidth}p{0.33\\textwidth}@{}}",
    "    \\toprule",
    "    quantity & value & status & source \\\\",
    "    \\midrule",
    ...rows,
    "    \\bottomrule",
    "  \\end{tabular}",
    "\\end{table}",
  ].join("\n");
}

/* ------------------------------------------------------------------ the whole export */

const PREAMBLE = [
  "\\documentclass[11pt]{article}",
  "\\usepackage{amsmath,amssymb,booktabs}",
  "\\usepackage[T1]{fontenc}",
  "\\usepackage{cmap}          % so the PDF's own text layer survives extraction",
  "\\begin{document}",
].join("\n");

export function toLatex(card, { standalone = false, label = "tab:ghu-lab", caption = null,
                                terms = null, termNames = ["a", "b", "c"], half = true,
                                group = null, bibliography = true, date = null,
                                mathKeys = [] } = {}) {
  const P = card.provenance;
  const t = card.summary.tally;
  const head = [
    "% " + "-".repeat(74),
    `%  ${tex(TOOL.title)}`,
    `%  model      ${tex(P.model_id)}`,
    `%  tool       ${tex(P.tool)} ${tex(P.version)}${P.build ? ` (${tex(P.build)})` : ""}`,
    ...(P.kernel_hash ? [`%  kernel     ${tex(P.kernel_hash)}`] : []),
    ...(P.authors || []).map((a) => `%  author     ${tex(a.name)}  ORCID ${tex(a.orcid)}`),
    ...(P.assistant ? [`%  assisted   ${tex(P.assistant)}`] : []),
    `%  repository ${TOOL.repo}`,
    ...(date ? [`%  exported   ${tex(date)}`] : []),
    "%",
    `%  status of the ${Object.keys(card.results).length} values below: ` +
      `${t.theorem} theorem, ${t.verified} verified, ${t.measured} measured, ${t.unknown} unknown.`,
    `%  the weakest thing here is: ${tex(card.summary.weakest)}`,
    ...(t.unknown ? ["%  an UNKNOWN row is a verdict, not a gap: it prints its own reason."] : []),
    "%",
    "%  needs \\usepackage{amsmath,booktabs}.",
    "% " + "-".repeat(74),
  ].join("\n");

  const parts = [head];
  if (standalone) parts.push(PREAMBLE);

  if (terms && terms.length) {
    parts.push([
      "\\begin{equation}",
      "  " + potentialLatex(terms, { names: termNames, half }).replace(/\n/g, "\n  "),
      `  \\label{eq:${label.replace(/^tab:/, "")}-potential}`,
      "\\end{equation}",
    ].join("\n"));
  }

  parts.push(resultsTable(card, { label, caption, mathKeys }));

  /* THE BIBLIOGRAPHY IS A SEPARATE FILE, AND THE PDF IS WHY.
   *
   * The first version put the BibTeX entries in the .tex.  Compiled, LaTeX ate the braces and
   * typeset them as a paragraph of prose -- "@articleHaba:2004qh, author = N. Haba and ..." -- in
   * the middle of the document.  A .bib is not body text.  So the .tex carries a pointer and the
   * entries go to `toBibtex`, which the caller writes beside it.  Two files, like the card's JSON
   * and text: the same object, in the two forms the destination needs. */
  if (bibliography && group && sourcesFor(group).length) {
    parts.push([
      "% The sources these numbers rest on are in the companion .bib file, keyed the way INSPIRE",
      "% keys them so it merges into an existing bibliography rather than duplicating entries:",
      "%",
      ...sourcesFor(group).map((x) => `%     \\cite{${x.texkey}}   ${tex(x.short)}`),
    ].join("\n"));
  }

  if (standalone) parts.push("\\end{document}");
  return parts.join("\n\n");
}

/* The companion .bib.  Written as its own file rather than pasted into the .tex, for the reason in
 * `toLatex`: BibTeX entries are not LaTeX body text and a document that contains them prints them. */
export function toBibtex(group, { date = null } = {}) {
  const srcs = sourcesFor(group);
  if (!srcs.length) return "";
  return [
    `% Sources for ${tex(TOOL.name)}${date ? `, exported ${tex(date)}` : ""}.`,
    "% Keys are INSPIRE's: a reader who already cites one of these gets one entry, not two.",
    "",
    ...srcs.map((x) => `% ${tex(x.short)}: ${tex(x.note)}\n${bibtex(x.id)}`),
  ].join("\n") + "\n";
}

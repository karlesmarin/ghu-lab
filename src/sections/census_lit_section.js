/* census_lit_section.js — "The literature": what gauge-Higgs papers actually publish.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE CENSUS, AND ITS HEADLINE IS AN ABSENCE.  To compare two gauge-Higgs models you need a triple
 * from each: the bulk CONTENT, the MINIMUM of the Wilson-line potential, and a mass.  There is no
 * dataset that gives it -- HEPData is experimental, and the tables of this field live inside PDFs
 * and nowhere else.  So the first thing a census can report is how rarely the triple is printed at
 * all, and that is the finding: of the papers in the corpus, a handful.
 *
 * TWO HALVES, KEPT APART ON THE PAGE.
 *
 *   MEASURED   every paper swept for the signals its text carries.  Complete, reproducible, and
 *              worth exactly what a keyword sweep is worth: it turns a corpus into a shortlist.
 *              A signal firing means "worth opening" and is never quoted as a fact about a paper.
 *   READ       the rows the census asserts, each naming the page or equation somebody looked at.
 *
 * Conflating them would make a grep look like a literature review.  The page shows the counts of
 * both and the gap between them -- the shortlisted papers nobody has opened yet are listed BY NAME,
 * because a to-do you can see is honest where an omission is not.
 *
 * AND A THIRD STATE THAT MATTERS MORE THAN IT SOUNDS.  A paper whose text layer lost glyphs, or
 * whose extraction returned almost nothing, has NOT been measured -- and counting it as one that
 * publishes nothing would be the sweep reporting its own blind spot as a property of the field.
 * It has its own column, and its own number: 87% of the PDFs here lose glyphs to extraction.
 * That is not a quirk of one paper.  It is why this project spent 2026-08-30 proving a correct
 * published formula wrong, and why `pdf_glyph_audit.py` exists.
 */
const LIT_S = { q: "", only: "all", sort: "id" };

const CENSUS_LIT_SECTION = {
  id: "litcensus",
  label: "The literature",
  paper: "curation",
  ready: true,
  modules: [],

  holds() { return "a census of published models — curation, not computation"; },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">To compare two gauge–Higgs models you need three things from each: the bulk
    <b>content</b>, the <b>minimum</b> of the Wilson-line potential, and a <b>mass</b>. There is no
    dataset that gives it. HEPData is experimental; the tables of this field live inside PDFs and
    nowhere else.</p>
    <div class="note" style="margin-top:9px">So the first thing a census can report is how rarely
    the triple is printed at all — and that <i>is</i> the finding. What follows has two halves that
    are never mixed: what a sweep <b>measured</b> over every paper, and what a person has actually
    <b>read</b>.</div>
  </div>

  <div class="grid two" style="margin-bottom:18px">
    <div class="card">
      <h2>The corpus</h2>
      <div style="overflow-x:auto"><table><tbody id="ltCorpus"></tbody></table></div>
      <div class="note" style="margin-top:9px" id="ltCorpusNote">—</div>
    </div>
    <div class="card">
      <h2>How often each signal appears</h2>
      <canvas id="ltBars" width="420" height="240"></canvas>
      <div class="note" style="margin-top:9px">A signal is a marker in the text, not a fact about
      the paper. It says <b>worth opening</b>.</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>Read, and asserted</h2>
    <p class="note">Every row below names the page or equation somebody looked at. A paper that is
    not here has not been read, and the census says so rather than leaving a blank that would be
    taken for a no.</p>
    <div style="display:flex;gap:10px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
      <input id="ltQ" type="search" placeholder="search group, orbifold, paper, verdict…"
             style="flex:1;min-width:240px;padding:5px 8px">
      <label class="note">show
        <select id="ltOnly">
          <option value="all">everything read</option>
          <option value="triple">only the complete triple</option>
          <option value="nomin">no published minimum</option>
        </select></label>
    </div>
    <div style="overflow-x:auto"><table><thead><tr>
      <th>paper</th><th>group</th><th>orbifold</th><th class="num">rows</th>
      <th>content</th><th>minimum</th><th>m<sub>h</sub></th><th>1/R</th><th>what we found</th>
      </tr></thead><tbody id="ltRows"></tbody></table></div>
    <div class="note" style="margin-top:9px" id="ltRowsNote">—</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>Shortlisted and not yet opened</h2>
    <p class="note">The sweep found all three legs of the triple in the text of these, and nobody
    has read them. Listed by name because a to-do you can see is honest where an omission is not.</p>
    <div id="ltTodo" class="note">—</div>
  </div>

  <div class="card">
    <h2>What this census is not</h2>
    <ul class="note" style="margin:0;padding-left:18px">
      <li>It is <b>curation</b>. Nothing here is computed from a model; the instrument's other
        sections do that.</li>
      <li>The corpus is <b>our reading list</b>, not the field. It is what we happened to collect
        while writing eight papers, and it is neither complete nor sampled.</li>
      <li>A <b>signal</b> is a keyword, and a keyword sweep misses whatever is phrased differently.
        Nothing is asserted from a signal alone.</li>
      <li id="ltUnread">—</li>
    </ul>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("ltQ").oninput = () => { LIT_S.q = $("ltQ").value.toLowerCase(); ctx.refresh(); };
    $("ltOnly").onchange = () => { LIT_S.only = $("ltOnly").value; ctx.refresh(); };
  },

  encodeState() {
    const p = [];
    if (LIT_S.q) p.push("q:" + LIT_S.q);
    if (LIT_S.only !== "all") p.push("only:" + LIT_S.only);
    return p.join("|");
  },
  decodeState(v) {
    LIT_S.q = ""; LIT_S.only = "all";
    for (const tok of String(v || "").split("|")) {
      const i = tok.indexOf(":");
      if (i < 0) continue;
      const k = tok.slice(0, i), x = tok.slice(i + 1);
      if (k === "q") LIT_S.q = x.toLowerCase();
      else if (k === "only" && ["all", "triple", "nomin"].includes(x)) LIT_S.only = x;
    }
  },

  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  render(ctx) {
    const C = CENSUS;                                   /* injected by build/make_data*.py */
    const $ = (id) => document.getElementById(id);
    $("ltQ").value = LIT_S.q; $("ltOnly").value = LIT_S.only;

    /* ---- the corpus, and the three states a paper can be in ---- */
    const co = C.corpus;
    const pct = (n, d) => `${Math.round(100 * n / d)}%`;
    $("ltCorpus").innerHTML = [
      ["files in the corpus", co.papers, ""],
      ["distinct papers", co.distinct_papers,
       co.duplicate_files ? `${co.duplicate_files} filename${co.duplicate_files > 1 ? "s" : ""} ` +
                            `named a paper already there` : "no duplicates"],
      ["carry all three legs in their text", C.shortlist.ids.length,
       `${pct(C.shortlist.ids.length, co.distinct_papers)} of the corpus`],
      ["<b>read, and asserted below</b>", C.curated.length, "each with a page or an equation"],
      ["text layer lost glyphs", co.text_layer_suspect,
       `${pct(co.text_layer_suspect, co.pdf)} of the PDFs`],
      ["<b>not readable by this sweep</b>", co.not_readable_by_this_sweep,
       "not measured — not a finding"],
    ].map(([k, v, n]) => `<tr><td>${k}</td><td class="num"><b>${v}</b></td>` +
                         `<td class="note">${n}</td></tr>`).join("");

    $("ltCorpusNote").innerHTML =
      `Of ${co.distinct_papers} papers, <b>${C.shortlist.ids.length}</b> print all three legs of ` +
      `the triple anywhere in their text — and that is the headline. There is no table of ` +
      `gauge–Higgs models because the field does not publish one, and mostly does not publish the ` +
      `rows one would be made of.`;

    /* ---- the signal histogram ---- */
    this._bars(C);

    /* ---- the read rows ---- */
    const has = (r, k) => r.publishes[k];
    const tick = (b) => b ? `<span style="color:${this._css("--green")}">✔</span>`
                          : `<span class="note">—</span>`;
    let rows = C.curated.slice();
    if (LIT_S.only === "triple")
      rows = rows.filter((r) => has(r, "minimum") && (has(r, "higgs_mass") || has(r, "scale")));
    if (LIT_S.only === "nomin") rows = rows.filter((r) => !has(r, "minimum"));
    if (LIT_S.q) {
      const q = LIT_S.q;
      rows = rows.filter((r) => [r.label, r.group, r.orbifold, r.verdict, r.id, r.where]
        .join(" ").toLowerCase().includes(q));
    }
    $("ltRows").innerHTML = rows.length ? rows.map((r) => {
      const cls = { theorem: "thm", verified: "ver", measured: "mea", unknown: "bad" }[r.status];
      return `<tr><td>${r.label}<div class="note">${r.id}` +
             `<span class="chip ${cls}" style="margin-left:6px">${r.status}</span></div></td>` +
             `<td>${r.group}</td><td>${r.orbifold}</td>` +
             `<td class="num">${r.rows_published || "—"}</td>` +
             `<td>${tick(has(r, "content"))}</td><td>${tick(has(r, "minimum"))}</td>` +
             `<td>${tick(has(r, "higgs_mass"))}</td><td>${tick(has(r, "scale"))}</td>` +
             `<td class="note">${r.verdict}<div style="margin-top:4px;opacity:.8">${r.where}</div></td></tr>`;
    }).join("") : `<tr><td colspan="9" class="note">Nothing matches.</td></tr>`;

    const withMin = C.curated.filter((r) => has(r, "minimum")).length;
    $("ltRowsNote").innerHTML =
      `Showing <b>${rows.length}</b> of ${C.curated.length} read. Of those ${C.curated.length}, ` +
      `<b>${withMin}</b> publish a minimum at all, and ` +
      `<b>${C.curated.filter((r) => has(r, "minimum") && has(r, "higgs_mass") && has(r, "scale")).length}</b> ` +
      `publish the whole triple.`;

    /* ---- the to-do, by name ---- */
    const todo = C.coverage.shortlisted_but_not_read;
    $("ltTodo").innerHTML = todo.length
      ? todo.map((t) => `<span class="chip" style="margin:0 6px 6px 0;display:inline-block">${t}</span>`).join("")
      : "None: everything the sweep shortlisted has been read.";

    $("ltUnread").innerHTML =
      `<b>${co.not_readable_by_this_sweep}</b> papers fired no signal <i>and</i> lost glyphs or ` +
      `returned almost no text. They have <b>not been measured</b>. Counting them as papers that ` +
      `publish nothing would be this sweep reporting its own blind spot as a property of the ` +
      `literature — and with ${pct(co.text_layer_suspect, co.pdf)} of the PDFs losing glyphs to ` +
      `extraction, that blind spot is the normal case and not the exception.`;
  },

  /* AN ORBIFOLD FIELD IS NOT ONE FORMULA.  The census writes things like `S^1/Z_2 x S^1/Z_2` and
   * `S^1/Z_2 and T^2/Z_3`: a product, and two alternatives joined by an English word.  Sending the
   * whole string through texMath would typeset "and" as three italic variables, which is how a
   * table comes to contain a formula nobody wrote.  So the connectives are split out and stay in
   * text mode; only the quotient factors are maths. */
  _orbTex(s) {
    return String(s).split(/\s+and\s+/)
      .map((alt) => alt.split(/\s*x\s*/).map((f) => texMath(f.trim())).join("~$\\times$~"))
      .join(" and ");
  },

  /* THE CENSUS EXPORTS AS A TABLE, BECAUSE IT IS ONE.
   *
   * The card carries the counts and the provenance -- that is the summary, and it is what the
   * shell's machinery is shaped for.  But the eight rows ARE the census: flattening them into
   * key-value pairs would keep the headline and lose the evidence.  So the card goes out as the
   * summary and the rows go out as a second block, through `body`.
   *
   * And the bibliography is the corpus, not the active group: `sources` names the eight papers the
   * rows assert, so the .bib beside the .tex carries exactly the papers the table cites. */
  texExport() {
    const C = CENSUS;
    const rows = C.curated.slice().sort((a, b) => (b.rows_published - a.rows_published) ||
                                                  a.id.localeCompare(b.id));
    const co = C.corpus;
    const none = rows.filter((r) => !r.rows_published).length;
    const total = rows.reduce((s, r) => s + r.rows_published, 0);
    const dot = (b) => (b ? "$\\bullet$" : "--");
    const name = (r) => (SOURCES[r.cite] ? tex(SOURCES[r.cite].short)
                                         : tex(String(r.label).split(",")[0]));
    const key = (r) => (SOURCES[r.cite] ? `~\\cite{${SOURCES[r.cite].texkey}}` : "");

    const body = [
      "\\begin{table}[t]",
      "  \\centering\\small",
      "  \\begin{tabular}{@{}llccccr@{}}",
      "    \\toprule",
      "    paper & orbifold & \\multicolumn{4}{c}{prints} & rows \\\\",
      "    \\cmidrule(lr){3-6}",
      "     & & content & minimum & $m_h$ & $1/R$ & \\\\",
      "    \\midrule",
      ...rows.map((r) => `    ${name(r)}${key(r)} & ${this._orbTex(r.orbifold)} & ` +
        `${dot(r.publishes.content)} & ${dot(r.publishes.minimum)} & ` +
        `${dot(r.publishes.higgs_mass)} & ${dot(r.publishes.scale)} & ` +
        `${r.rows_published || "--"} \\\\`),
      "    \\midrule",
      `    \\multicolumn{6}{@{}l}{total rows the corpus prints} & ${total} \\\\`,
      "    \\bottomrule",
      "  \\end{tabular}",
      /* THE CAPTION IS A CLAIM ABOUT THE COLUMN BESIDE IT.  The first draft said a row needs
       * content and a minimum -- and von Gersdorff-Irges-Quiros prints both and still counts zero,
       * so the caption contradicted its own table on the page.  A row needs the whole triple: the
       * content, the minimum, and a mass or a scale.  It is the rule the section's own filter
       * uses, and reading the rendered table is what caught the difference. */
      "  \\caption{What the gauge--Higgs literature actually publishes, for the " +
        `${rows.length} papers somebody has read. A row is counted only where one paper prints ` +
        "the whole triple -- the bulk content, a minimum of the Wilson-line potential, and a " +
        "Higgs mass or a compactification scale; a dot marks a leg that appears at all, which is " +
        `why a paper can carry dots and still count none. ${none} of the ${rows.length} print no ` +
        "usable row, and the " +
        `whole corpus yields ${total}. Papers absent from this table have not been read, which ` +
        "the census reports rather than leaving a blank that reads as a no.}",
      "  \\label{tab:ghu-census}",
      "\\end{table}",
    ].join("\n");

    const values = {
      papers_in_corpus: val(co.distinct_papers, { status: STATUS.MEASURED,
        source: "a keyword sweep over the local corpus; a shortlist, never a fact about a paper" }),
      carry_all_three_legs: val(C.shortlist.ids.length, { status: STATUS.MEASURED,
        source: "the same sweep: the three legs appearing anywhere in the text" }),
      papers_read: val(rows.length, { status: STATUS.VERIFIED,
        source: "each row names the page or the equation a person opened" }),
      /* THE SAME RULE, SAID TWICE, IS TWO CLAIMS.  This source line kept the first draft's wrong
       * criterion after the caption was corrected, and the compiled PDF printed both -- the table
       * saying one thing and the summary above it another. */
      rows_published: val(total, { status: STATUS.VERIFIED,
        source: "the whole triple: content, a minimum, and a mass or a scale, per paper" }),
      papers_printing_no_row: val(none, { status: STATUS.VERIFIED,
        source: "the finding: the field mostly does not print the rows a comparison needs" }),
      text_layer_lost_glyphs: val(`${co.text_layer_suspect} of ${co.pdf}`,
        { status: STATUS.MEASURED,
          source: "pdf_glyph_audit: glyphs that do not survive text extraction" }),
      not_readable_by_this_sweep: unknown(
        `${co.not_readable_by_this_sweep} papers returned too little text to measure. Counting ` +
        "them as papers that publish nothing would report the sweep's blind spot as a property " +
        "of the field."),
    };

    return {
      card: makeCard({ group: "census", section: "litcensus", read: rows.length },
                     values, { version: VERSION, build: BUILD }),
      caption: `The census in summary. The table of rows is Table~\\ref{tab:ghu-census}.`,
      sources: rows.map((r) => r.cite).filter(Boolean),
      body,
    };
  },

  _bars(C) {
    const c = document.getElementById("ltBars");
    const W = c.clientWidth || 420, H = 240, d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = this._css("--card") || "#fff"; g.fillRect(0, 0, W, H);

    const counts = {};
    for (const r of C.measured) for (const s of r.signals) counts[s] = (counts[s] || 0) + 1;
    const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!items.length) return;
    const max = items[0][1], x0 = 168, x1 = W - 40, h = Math.min(22, (H - 12) / items.length);

    g.font = "11px ui-monospace,Menlo,Consolas,monospace";
    items.forEach(([k, v], i) => {
      const y = 8 + i * h;
      g.fillStyle = this._css("--ink3"); g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText(k.replace(/_/g, " "), x0 - 8, y + h / 2 - 2);
      g.fillStyle = this._css("--blue") || "#2b6cb0";
      g.fillRect(x0, y + 2, (x1 - x0) * v / max, h - 7);
      g.fillStyle = this._css("--ink3"); g.textAlign = "left";
      g.fillText(String(v), x0 + (x1 - x0) * v / max + 5, y + h / 2 - 2);
    });
  },
};

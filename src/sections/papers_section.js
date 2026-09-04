/* papers_section.js — "Paper models": four published models, loaded, and the instrument held to
 * what their authors printed.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS SECTION IS NOT A LIST OF PAPERS.  "The literature" is the census: what the field
 * publishes, curated by hand.  This one is the opposite operation — it takes four models OFF their
 * pages, runs the builder's engine on them, and puts every statement those authors printed beside
 * the number this instrument returns for it.  A reader can then do the thing the rest of this
 * family invites and nothing else here supports: press one button and have somebody else's
 * published model sitting in the builder, with the spectrum, the anomaly ledger, the vacuum and
 * the simulator all reading it.
 *
 * THE TABLE IS THE SECTION.  Three verdicts, three colours, and the amber one is not a failure:
 *   green   the instrument returns what the paper prints.
 *   amber   it does not — and the row says by how much and which of the paper's OWN equations
 *           agrees with which. There is exactly one, and it is the most interesting row here.
 *   grey    outside this engine. Said out loud, because a blank cell reads as a no.
 *
 * WHAT THE PAGE MUST NOT LET A READER BELIEVE.  Three of the four papers are supersymmetric and
 * this engine's potential is not, so every anchor taken from them is parity linear algebra and
 * carries its scope in the row.  The section header says it, each model card says it, and the
 * closing card says it a third time, because "the instrument reproduces Burdman–Nomura" is a
 * sentence somebody will write and it is only true of the half that was looked at.
 *
 * Edited BY HAND.
 */
const PAP_S = { model: "kly_su3", Nf: 3 };

const PAP_SECTION = {
  id: "papers",
  label: "Paper models",
  paper: "four published models",
  ready: true,
  modules: [],

  holds() {
    const m = paperById(PAP_S.model) || PAPER_MODELS[0];
    const b = paperRun(m, { Nf: PAP_S.Nf });
    return `${m.group} · ${m.orbifold} · (${b.b.nPP},${b.b.nPM},${b.b.nMP},${b.b.nMM}) → ` +
           `${sun5dUnbroken(b.b)} · ${b.same} of ${b.rows.length} statements reproduced`;
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Four published models, taken off their pages and run through the same engine
    the <b>SU(N) builder</b> uses. Every statement each paper prints that this instrument can
    compute sits beside the number it returns.</p>
    <div class="note" style="margin-top:9px">A general formula that reproduces four papers it was
    never fitted to is a general formula. One that reproduces only the paper it came from is a
    transcription. ${helpMark("anchor-verdicts")}</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>Pick one</h2>
    <div id="papPick" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>
    <div id="papKnob" class="note" style="margin-bottom:10px"></div>
    <div id="papCard"></div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button id="papLoad" class="primary">Load into the SU(N) builder</button>
      <span class="note" id="papLoadNote">The builder, the 4D spectrum, the anomaly ledger, the
      brane panel and the simulator all read one model. This writes that model.</span>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>What they print, and what this returns${helpMark("anchor-scope")}</h2>
    <div style="overflow-x:auto"><table><thead><tr>
      <th>what the paper says</th><th>where</th><th>they print</th><th>this returns</th><th>verdict</th>
      </tr></thead><tbody id="papRows"></tbody></table></div>
    <div class="note" style="margin-top:9px" id="papSum">—</div>
  </div>

  <div class="card" id="papNotesCard" style="margin-bottom:18px">
    <h2>The rows that need a sentence</h2>
    <div id="papNotes" class="note">—</div>
  </div>

  <div class="card">
    <h2>What this section is not</h2>
    <ul class="note" style="margin:0;padding-left:18px">
      <li>It is not a reproduction of these <b>papers</b>. It is a reproduction of the statements
        each one prints that this engine can compute, and every row carries the scope it was read
        at.</li>
      <li id="papSusy">—</li>
      <li>A <b>grey</b> row is something this instrument does not do. It is listed rather than
        omitted, because a model that quietly drops a third of its matter reads as fully checked.</li>
      <li>An <b>amber</b> row is a disagreement with a printed equation, not with a paper: it names
        which of that paper's own equations the instrument agrees with, and says what — if
        anything — moves as a result. Usually nothing does.</li>
    </ul>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("papPick").onclick = (e) => {
      const b = e.target.closest("button[data-m]");
      if (!b) return;
      PAP_S.model = b.dataset.m;
      ctx.refresh();
    };
    $("papKnob").oninput = (e) => {
      if (e.target.id !== "papNf") return;
      PAP_S.Nf = +e.target.value;
      ctx.refresh();
    };
    $("papLoad").onclick = () => {
      const m = paperById(PAP_S.model);
      if (!m) return;
      const st = paperState(m, { Nf: PAP_S.Nf });
      SUN5D_S.blocks = { ...st.blocks };
      SUN5D_S.bulk = { ...st.bulk };
      SUN5D_S.brane = {};
      SUN5D_S.preset = null;
      ctx.go ? ctx.go("sun5d") : ctx.refresh();
    };
  },

  encodeState() {
    const p = ["m:" + PAP_S.model];
    if (PAP_S.Nf !== 3) p.push("nf:" + PAP_S.Nf);
    return p.join("|");
  },
  decodeState(v) {
    PAP_S.model = "kly_su3"; PAP_S.Nf = 3;
    for (const tok of String(v || "").split("|")) {
      const i = tok.indexOf(":");
      if (i < 0) continue;
      const k = tok.slice(0, i), x = tok.slice(i + 1);
      if (k === "m" && paperById(x)) PAP_S.model = x;
      else if (k === "nf") {
        const n = parseInt(x, 10);
        if (Number.isFinite(n) && n >= 0 && n <= 8) PAP_S.Nf = n;
      }
    }
  },

  render() {
    const $ = (id) => document.getElementById(id);
    const m = paperById(PAP_S.model) || PAPER_MODELS[0];
    const r = paperRun(m, { Nf: PAP_S.Nf });
    const cl = paperClass(m);
    const src = SOURCES[m.cite];

    /* ---- the four chips ---- */
    $("papPick").innerHTML = PAPER_MODELS.map((x) =>
      `<button data-m="${x.id}"${x.id === m.id ? ' class="primary"' : ""}>${x.label}</button>`)
      .join("");

    /* ---- the dial, only where a model has one ---- */
    $("papKnob").innerHTML = m.knob
      ? `<label>${m.knob.of}, <b>${m.knob.label} = ${PAP_S.Nf}</b> ` +
        `<input id="papNf" type="range" min="${m.knob.min}" max="${m.knob.max}" step="1" ` +
        `value="${PAP_S.Nf}" style="vertical-align:middle;width:180px"></label>` +
        ` <span style="margin-left:8px">Their Table 1 turns over between ${m.knob.label} = 1 and 2.</span>`
      : `This model has no dial: the paper fixes its content.`;

    /* ---- the model card ---- */
    const b = r.b;
    const cite = src
      ? `${src.authors.join(", ")}, <i>${src.title.replace(/\$([^$]*)\$/g, "$1")}</i>, ` +
        `${src.journal} <b>${src.volume}</b> (${src.year}) ${src.pages || src.artid} ` +
        `<span class="note">(arXiv:${src.eprint})</span>`
      : m.label;
    $("papCard").innerHTML =
      `<div class="note" style="margin-bottom:8px">${cite}</div>` +
      `<table><tbody>` +
      `<tr><td>what they print</td><td><code>${m.printed}</code></td></tr>` +
      `<tr><td>block letters</td><td><b>(${b.nPP},${b.nPM},${b.nMP},${b.nMM})</b> — ` +
        `${sun5dUnbroken(b)}, ${b.phases} Wilson-line phase${b.phases === 1 ? "" : "s"}</td></tr>` +
      `<tr><td>equivalence class</td><td>${bcShow([b.nPP, b.nPM, b.nMP, b.nMM])}, ` +
        `${cl.size === 1 ? "a class of one" : `${cl.size} boundary conditions are this theory`} ` +
        `<span class="note">(of ${cl.nClasses} classes for SU(${b.N}) on S¹/Z₂)</span></td></tr>` +
      `<tr><td>bulk content, as the builder holds it</td><td><code>` +
        `${Object.entries(r.bulkMap).map(([k, n]) => `${k} ×${n}`).join(", ") || "gauge only"}` +
        `</code></td></tr>` +
      `<tr><td>supersymmetric?</td><td>${m.susy
        ? `<b>yes</b> — so only the parity linear algebra is anchored here, never their dynamics`
        : `no — so its dynamics is anchored too, and it is the only one of the four`}</td></tr>` +
      `<tr><td>why it is here</td><td class="note">${m.about}</td></tr>` +
      `</tbody></table>`;

    /* ---- the anchors ---- */
    /* green for agreement, AMBER for a difference and grey for out of scope: a difference with a
     * printed equation is an output of this page, and painting it red would make a finding look
     * like a broken build. */
    const chip = { same: "thm", differs: "ver", outside: "live" };
    const word = { same: "reproduced", differs: "differs", outside: "outside" };
    const cell = (x) => (x === null || x === undefined
      ? `<span class="note">—</span>`
      : typeof x === "number" ? `<b>${Number.isInteger(x) ? x : x.toPrecision(9)}</b>`
                              : `${x}`);
    $("papRows").innerHTML = r.rows.map((row) =>
      `<tr><td>${row.says}<div class="note">${row.scope}</div></td>` +
      `<td class="note">${row.where}</td>` +
      `<td>${cell(row.theirs)}</td><td>${cell(row.ours)}</td>` +
      `<td><span class="chip ${chip[row.verdict]}">${word[row.verdict]}</span></td></tr>`).join("");

    const bits = [`<b>${r.same}</b> of the ${r.rows.length} statements reproduced`];
    if (r.differs) bits.push(`<b>${r.differs}</b> differing`);
    if (r.outside) bits.push(`<b>${r.outside}</b> outside this engine`);
    const all = paperRunAll();
    const tot = all.reduce((a, x) => a + x.same, 0);
    const totRows = all.reduce((a, x) => a + x.rows.length, 0);
    $("papSum").innerHTML =
      `${bits.join(", ")}. Across all four models: <b>${tot}</b> of ${totRows} statements ` +
      `reproduced, <b>${all.reduce((a, x) => a + x.differs, 0)}</b> differing, ` +
      `<b>${all.reduce((a, x) => a + x.outside, 0)}</b> outside. ` +
      (r.held ? `Every verdict is the one this repository recorded.`
              : `<b>A VERDICT MOVED since it was recorded — the harness is the thing to read.</b>`);

    /* ---- the notes, which is where the honesty lives ---- */
    /* A VERDICT BOX THAT RAN AND DECIDED NOTHING IS THE ONE THING THIS PAGE MUST NOT DO: every
     * model has at least one row carrying a sentence, but that is a fact about today's registry
     * and not a guarantee, so the empty case says what it is waiting for. */
    const withNotes = r.rows.filter((x) => x.note);
    $("papNotes").innerHTML = withNotes.length
      ? withNotes.map((x) =>
        `<div style="margin-bottom:10px"><span class="chip ${chip[x.verdict]}">${word[x.verdict]}</span> ` +
        `<b>${x.where}</b> — ${x.note}</div>`).join("")
      : `Nothing on this model needed one: every row above is a direct comparison with no ` +
        `convention, unit or scope to declare. The rows that do need a sentence carry it here.`;

    $("papSusy").innerHTML = m.susy
      ? `<b>${m.label.split("·")[0].trim()}</b> is supersymmetric and this engine's one-loop ` +
        `potential is not, so nothing here is a check of their dynamics — only of which boundary ` +
        `condition it is, which group it leaves and what is massless.`
      : `<b>${m.label.split("·")[0].trim()}</b> is <i>not</i> supersymmetric, which is why its ` +
        `potential, its vacuum and its Higgs mass can be anchored at all. It is the only one of ` +
        `the four where this engine can be wrong by a number rather than by a label.`;
  },

  /* THE TABLE IS THE EXPORT, for the same reason the census's is: flattening the rows into
   * key-value pairs would keep the headline and lose the evidence. The bibliography is the four
   * papers, so the .bib beside the .tex carries exactly what the table cites. */
  texExport() {
    const all = paperRunAll();
    const mark = { same: "$\\checkmark$", differs: "$\\neq$", outside: "--" };
    const rows = [];
    for (const r of all) {
      const s = SOURCES[r.m.cite];
      rows.push(`    \\midrule\n    \\multicolumn{3}{@{}l}{\\textbf{${tex(s ? s.short : r.m.label)}}` +
                (s ? `~\\cite{${s.texkey}}` : "") + `, ${tex(r.m.group)}} \\\\`);
      for (const row of r.rows)
        rows.push(`    ${tex(row.says.slice(0, 78))} & ${tex(row.where)} & ${mark[row.verdict]} \\\\`);
    }
    const tot = all.reduce((a, x) => a + x.same, 0);
    const dif = all.reduce((a, x) => a + x.differs, 0);
    const out = all.reduce((a, x) => a + x.outside, 0);

    const body = [
      "\\begin{table}[t]",
      "  \\centering\\small",
      "  \\begin{tabular}{@{}llc@{}}",
      "    \\toprule",
      "    what the paper states & where & this engine \\\\",
      ...rows,
      "    \\bottomrule",
      "  \\end{tabular}",
      `  \\caption{Four published five-dimensional gauge-Higgs models, taken off their pages and ` +
        `run through one general formula. ${tot} of the ${tot + dif + out} statements they print ` +
        `that this engine can compute are reproduced, ${dif} differs and ${out} lie outside the ` +
        `representations or the dynamics it carries. Three of the four are supersymmetric, so ` +
        `their rows are boundary-condition and zero-mode statements only.}`,
      "  \\label{tab:ghu-paper-models}",
      "\\end{table}",
    ].join("\n");

    const values = {
      models: val(all.length, { status: STATUS.VERIFIED,
        source: "each taken off the rendered page of its own paper" }),
      statements_reproduced: val(tot, { status: STATUS.VERIFIED,
        source: "the general SU(N) formula run on their boundary conditions, nothing fitted" }),
      statements_differing: val(dif, { status: STATUS.MEASURED,
        source: "Kubo-Lim-Yamashita eq. (35): their own eq. (33) differentiates to (9 - 2N_f)" }),
      statements_outside: unknown(
        `${out} statements this engine does not compute: the 20 = $\\Lambda^3$ of SU(6), and ` +
        "gates already carried by other files. Listed rather than omitted."),
    };

    return {
      card: makeCard({ group: "papers", section: "papers", models: all.length },
                     values, { version: VERSION, build: BUILD }),
      caption: `Four published models against one engine. The table is ` +
               `Table~\\ref{tab:ghu-paper-models}.`,
      sources: PAPER_MODELS.map((x) => x.cite),
      body,
    };
  },
};

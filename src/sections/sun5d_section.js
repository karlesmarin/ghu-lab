/* sun5d_section.js — "SU(N) builder": any 5D SU(N) gauge-Higgs model on S¹/Z₂, from its parities.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THIS IS THE SECTION THAT IS NOT ABOUT ONE OF OUR PAPERS.  Every other section answers a question
 * about a published model — theirs or ours.  This one takes the model as INPUT: type a boundary
 * condition and a bulk content and it returns the one-loop Wilson-line potential, the unbroken
 * subgroup, how many Higgs degrees of freedom there are, and where the vacuum sits.  For SU(3),
 * SU(5), SU(6), SU(7), SU(23).  It is Haba and Yamashita's general formula (JHEP 02 (2004) 059,
 * §5), which is the machine every model in this field is built on and which nobody has as a tool.
 *
 * WHAT IT IS FOR, CONCRETELY.  A reader with a model of their own — a set of parities and some
 * bulk matter — currently has to redo the group theory by hand to get the first thing they need,
 * which is the potential.  Here it is a form. And when the model has ONE Wilson-line phase, the
 * terms are the kernel's own (m, s, c) triples, so the closed form, the five complete invariants
 * and the two arithmetic laws of Part VII apply to it — a published result of ours, handed to
 * somebody else's model.
 *
 * IT DOES NOT STAND ON THE SHELL'S MODEL, and says so: `holds()` replaces the header line, because
 * the shell holds an SU(3) content and this panel may be holding an SU(6) one.
 *
 * Edited BY HAND.
 */
const SUN5D_PRESETS = [
  { id: "hy3", label: "§3 · SU(3)", N: 3, blocks: { nPP: 1, nPM: 0, nMP: 0, nMM: 2 },
    printed: "P = P′ = diag(+,−,−); adjoint(+) gives cos(2πna) + 2cos(πna) — their eq. (3.10)" },
  { id: "hy5", label: "§4.1 · SU(5)", N: 5, blocks: { nPP: 3, nPM: 0, nMP: 0, nMM: 2 },
    printed: "P = P′ = diag(+,+,+,−,−); SU(5) → SU(3)×SU(2)×U(1), two phases — their eq. (4.6)" },
  { id: "hy6", label: "§4.2 · SU(6)", N: 6, blocks: { nPP: 3, nPM: 0, nMP: 0, nMM: 3 },
    printed: "P = P′ = diag(+,+,+,−,−,−); three phases, and no single-phase term — eq. (4.20)" },
  { id: "hy6b", label: "§4.3 · SU(6), P ≠ P′", N: 6, blocks: { nPP: 1, nPM: 3, nMP: 0, nMM: 2 },
    printed: "P = diag(+,+,+,+,−,−), P′ = diag(+,−,−,−,−,−); one phase — their eq. (4.29)" },
];

const SUN5D_REPS = [
  { rep: "fund", name: "fundamental", dim: (N) => `${N}` },
  { rep: "anti", name: "antisymmetric", dim: (N) => `${(N * (N - 1)) / 2}` },
  { rep: "sym", name: "symmetric", dim: (N) => `${(N * (N + 1)) / 2}` },
  { rep: "adj", name: "adjoint", dim: (N) => `${N * N - 1}` },
];

const SUN5D_S = {
  blocks: { nPP: 1, nPM: 0, nMP: 0, nMM: 2 },
  bulk: {},                       /* "rep|eta|kind" -> multiplicity */
  probe: [0.2, 0.2],
};

const SUN5D_SECTION = {
  id: "sun5d",
  label: "SU(N) builder",
  paper: "Haba–Yamashita 2004 §5",
  ready: true,
  modules: [],

  /* the header line, because the shell's model is not what is on screen here */
  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const n = Object.values(SUN5D_S.bulk).reduce((a, x) => a + x, 0);
    return `SU(${b.N}) · S¹/Z₂ · (${b.nPP},${b.nPM},${b.nMP},${b.nMM}) → ${sun5dUnbroken(b)} · ` +
           `${b.phases} Wilson-line phase${b.phases === 1 ? "" : "s"}` +
           (n ? ` · ${n} bulk field${n === 1 ? "" : "s"}` : " · gauge sector only");
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Every other section here answers a question about a model somebody already
    wrote down. This one takes the model as <b>input</b>: type a boundary condition and a bulk
    content, and get the one-loop Wilson-line potential of <b>any</b> 5D SU(N) on S¹/Z₂ — the
    unbroken subgroup, how many Higgs degrees of freedom survive, the potential itself, and its
    vacuum.</p>
    <div class="note" style="margin-top:9px">Haba &amp; Yamashita, <i>JHEP</i> <b>05</b> (2004) 059
    (hep-ph/0401185), §5. Their §11 calls analysing the vacuum structure the hard part and leaves
    it; the four worked examples they do give are the presets below, and
    <b>every equation in all four is checked against this page</b> in <code>_test_sun5d.mjs</code>.
    <span class="chip ver">verified</span></div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The boundary condition${helpMark("boundary-condition")}</h2>
        <p class="note" style="margin:0 0 10px">Simultaneously diagonal parities are four block
        sizes — their eq. (5.1). Everything else follows from them.</p>
        <div id="sunBlocks"></div>
        <div class="verdict breaks" id="sunBC" style="margin-top:12px"><b>—</b><span>—</span></div>
        <div style="display:flex;gap:6px;margin-top:11px;flex-wrap:wrap" id="sunPresets"></div>
        <div class="note" style="margin-top:9px" id="sunPresetNote"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The bulk${helpMark("bulk-content")}</h2>
        <p class="note" style="margin:0 0 10px">Dirac fermions count <b>+4</b>, complex scalars
        <b>−2</b>, and the gauge sector with its ghost <b>−3</b> — their §3. The signs are degrees
        of freedom, not a fit.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>representation</th><th>ηη′</th>
          <th class="num">dim</th><th class="num">Dirac</th><th class="num">scalar</th>
          </tr></thead><tbody id="sunBulk"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="sunBulkNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The potential${helpMark("one-loop-potential")}</h2>
        <div class="note" id="sunFormula" style="font-family:var(--mono);font-size:12.5px;
             line-height:1.9;word-break:break-word">—</div>
        <canvas id="sunPlot" width="720" height="300" style="margin-top:12px"></canvas>
        <div class="note" style="margin-top:9px" id="sunPlotNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The vacuum${helpMark("alpha-min")}</h2>
        <div class="verdict stable" id="sunVac"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>One phase, and the rest of this instrument applies${helpMark("hosotani")}</h2>
        <div id="sunBridge" class="note">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("sunPresets").innerHTML = SUN5D_PRESETS.map((p) =>
      `<button class="ghost" data-preset="${p.id}">${p.label}</button>`).join("") +
      `<button class="ghost" data-preset="clear">clear the bulk</button>`;
    $("sunPresets").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.preset === "clear") { SUN5D_S.bulk = {}; ctx.refresh(); return; }
        const p = SUN5D_PRESETS.find((x) => x.id === b.dataset.preset);
        SUN5D_S.blocks = { ...p.blocks };
        SUN5D_S.preset = p.id;
        ctx.refresh();
      };
    });
    $("sunPlot").onclick = (e) => {
      if (!this._lay || this._lay.phases !== 1) return;
      const r = e.target.getBoundingClientRect();
      const x = (e.clientX - r.left) * (this._lay.W / r.width);
      SUN5D_S.probe[0] = Math.min(1, Math.max(0, (x - this._lay.x0) / (this._lay.x1 - this._lay.x0)));
      ctx.refresh();
    };
  },

  /* WHAT THIS SECTION EXPORTS, AND WHY IT EXPORTS A CARD OF ITS OWN.
   *
   * This section declares `holds()`: the model on the page is the one the reader typed here, not
   * the one the shell is carrying for the family.  So the shell's card is about a DIFFERENT model.
   * Attaching it to this section's potential would put two models in one file and present them as
   * one -- the export would name a boundary condition and then tabulate somebody else's numbers.
   * `build/drive.mjs` caught exactly that.  So the card is built here, from this model.
   *
   * `half: true` because these terms carry the paper's C/2 and the kernel's F does not: the two
   * normalisations differ by exactly that factor and this project has confused them before.
   */
  texExport() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const terms = sun5dTerms(b, { bulk: this._content() });
    const min = sun5dMinimum(terms, b.phases);
    const blocks = `(${b.nPP}, ${b.nPM}, ${b.nMP}, ${b.nMM})`;

    const values = {
      N: val(b.N, { status: STATUS.THEOREM, source: "the four block sizes sum to N" }),
      boundary_condition: val(blocks,
        { status: STATUS.THEOREM, source: "Haba-Yamashita eq. (5.1), simultaneously diagonal" }),
      unbroken: val(sun5dUnbroken(b),
        { status: STATUS.THEOREM, source: "Haba-Yamashita eq. (5.2)" }),
      wilson_phases: val(b.phases,
        { status: STATUS.THEOREM, source: "Haba-Yamashita eq. (5.4), A + B" }),
    };
    /* the minimiser handles one and two phases; past that it is not the right instrument and the
     * export says so instead of printing a number it did not compute */
    if (min) {
      values.theta_min = val(min.theta.map((t) => Number(t.toFixed(6))).join(", "),
        { status: STATUS.MEASURED, source: "browser: grid, then coordinate refinement" });
      values.at_domain_end = val(min.atEdge,
        { status: STATUS.MEASURED,
          source: "an end of [0,1] is the OTHER symmetric point, not a broken vacuum" });
    } else {
      values.theta_min = unknown(`this model has ${b.phases} Wilson-line phases; the minimiser ` +
                                 `covers one and two, and a grid is not the right instrument past that`);
    }
    values.scale = unknown("no absolute scale without an anchor: this is a shape, not a prediction");

    return {
      card: makeCard({ group: "su3_hy", section: "sun5d", N: b.N,
                       blocks: [b.nPP, b.nPM, b.nMP, b.nMM], bulk: this._content() },
                     values, { version: VERSION, build: BUILD }),
      terms, termNames: sun5dNames(b), half: true,
      mathKeys: ["unbroken"],
      caption: `SU(${b.N}) on $S^1/Z_2$ with blocks ` +
               `$(n_{++}, n_{+-}, n_{-+}, n_{--}) = ${blocks}$, built with the general formula ` +
               `of Haba and Yamashita.`,
    };
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    const b = sun5dBlocks(SUN5D_S.blocks);
    this._blocks(ctx, b);
    this._bulkTable(ctx, b);
    const content = { bulk: this._content() };
    const terms = sun5dTerms(b, content);
    this._formula(b, terms);
    this._plot(b, terms);
    this._vacuum(b, terms);
    this._bridge(b, terms);
    const p = SUN5D_PRESETS.find((x) => x.id === SUN5D_S.preset);
    $("sunPresetNote").innerHTML = p
      ? `Holding <b>${p.label}</b>: ${p.printed}`
      : `The four presets are the paper's own worked examples; the harness checks every equation ` +
        `each of them prints against what this page builds.`;
  },

  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  _content() {
    const out = [];
    for (const [k, m] of Object.entries(SUN5D_S.bulk)) {
      if (!m) continue;
      const [rep, eta, kind] = k.split("|");
      out.push({ rep, eta: +eta, kind, multiplicity: m });
    }
    return out;
  },

  /* ---------------------------------------------------------------- the blocks */

  _blocks(ctx, b) {
    const $ = (id) => document.getElementById(id);
    const ROWS = [["nPP", "(+, +)"], ["nPM", "(+, −)"], ["nMP", "(−, +)"], ["nMM", "(−, −)"]];
    $("sunBlocks").innerHTML = ROWS.map(([k, lab]) =>
      `<div class="rowm"><span class="nm" style="flex:1">${lab}</span>` +
      `<button class="st" data-b="${k}" data-d="-1">−</button>` +
      `<span class="cnt${SUN5D_S.blocks[k] ? "" : " z"}">${SUN5D_S.blocks[k]}</span>` +
      `<button class="st" data-b="${k}" data-d="1">+</button></div>`).join("") +
      `<div class="rowm"><span class="nm" style="flex:1;color:var(--ink2)">N</span>` +
      `<span class="cnt" style="width:auto;padding:0 8px">${b.N}</span></div>`;
    $("sunBlocks").querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.b, d = +btn.dataset.d;
        const v = SUN5D_S.blocks[k] + d;
        /* N ≥ 2 and every block non-negative: a boundary condition with N < 2 is not one, and a
         * negative block would silently produce a formula for a group that does not exist */
        if (v < 0) return;
        const N = Object.values({ ...SUN5D_S.blocks, [k]: v }).reduce((a, x) => a + x, 0);
        if (N < 2 || N > 24) return;
        SUN5D_S.blocks = { ...SUN5D_S.blocks, [k]: v };
        SUN5D_S.preset = null;
        ctx.refresh();
      };
    });
    const el = $("sunBC");
    el.className = b.phases ? "verdict breaks" : "verdict stable";
    const P = [], Pp = [];
    for (let i = 0; i < b.nPP; i++) { P.push("+"); Pp.push("+"); }
    for (let i = 0; i < b.nPM; i++) { P.push("+"); Pp.push("−"); }
    for (let i = 0; i < b.nMP; i++) { P.push("−"); Pp.push("+"); }
    for (let i = 0; i < b.nMM; i++) { P.push("−"); Pp.push("−"); }
    el.innerHTML =
      `<b>SU(${b.N}) → ${sun5dUnbroken(b)}</b>` +
      `<span>P = diag(${P.join(",")}), P′ = diag(${Pp.join(",")}). ` +
      `The Wilson-line phases live in the (−,−) block of A₅, and the residual global symmetry ` +
      `leaves <b>${b.phases}</b> of them — min(${b.nPP}, ${b.nMM}) + min(${b.nPM}, ${b.nMP}), ` +
      `their eq. (5.4). ` +
      (b.phases === 0
        ? `With none, there is no Wilson-line potential to speak of and nothing below moves.`
        : `<span class="chip thm">theorem</span> eq. (5.2).`) +
      `</span>`;
  },

  /* ---------------------------------------------------------------- the bulk */

  _bulkTable(ctx, b) {
    const $ = (id) => document.getElementById(id);
    const cell = (rep, eta, kind) => {
      const k = `${rep}|${eta}|${kind}`;
      const v = SUN5D_S.bulk[k] || 0;
      return `<td class="num" style="white-space:nowrap">` +
        `<button class="st" data-f="${k}" data-d="-1">−</button>` +
        `<span class="cnt${v ? "" : " z"}">${v}</span>` +
        `<button class="st" data-f="${k}" data-d="1">+</button></td>`;
    };
    $("sunBulk").innerHTML = SUN5D_REPS.flatMap((r) => [1, -1].map((eta) =>
      `<tr><td style="font-family:var(--mono);font-size:13px">${r.name}</td>` +
      `<td style="font-family:var(--mono)">${eta > 0 ? "+" : "−"}</td>` +
      `<td class="num">${r.dim(b.N)}</td>` +
      cell(r.rep, eta, "dirac") + cell(r.rep, eta, "scalar") + `</tr>`)).join("");
    $("sunBulk").querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.f, v = (SUN5D_S.bulk[k] || 0) + +btn.dataset.d;
        SUN5D_S.bulk = { ...SUN5D_S.bulk, [k]: Math.max(0, Math.min(30, v)) };
        ctx.refresh();
      };
    });
    const n = Object.values(SUN5D_S.bulk).reduce((a, x) => a + x, 0);
    $("sunBulkNote").innerHTML = n
      ? `${n} bulk field${n === 1 ? "" : "s"} on top of the gauge sector. A representation's ` +
        `contribution depends on ηη′, not on η and η′ separately — that is the whole content of ` +
        `their (3.4)–(3.5), and it is why the table has two rows per representation and not four.`
      : `Gauge and ghost only, which is <b>−3</b> times one adjoint degree of freedom. That alone ` +
        `has a definite sign and, on its own, never breaks anything: the bulk is what can.`;
  },

  /* ---------------------------------------------------------------- the formula */

  _formula(b, terms) {
    const el = document.getElementById("sunFormula");
    if (!b.phases) { el.textContent = "no Wilson-line phase, so no potential"; return; }
    const nm = sun5dNames(b);
    const body = terms.length
      ? terms.map((t) => `${t.m > 0 ? "+" : "−"} ${Math.abs(t.m) === 1 ? "" : Math.abs(t.m) + " "}` +
                         sun5dShow(t, nm)).join(" ").replace(/^\+ /, "")
      : "0 — every term cancelled";
    el.innerHTML =
      `<div style="color:var(--ink2);margin-bottom:6px">V<sub>eff</sub> = (C/2) Σ<sub>n≥1</sub> ` +
      `n<sup>−5</sup> ×</div>` +
      `<div>[ ${body} ]</div>` +
      `<div style="color:var(--ink3);margin-top:7px">C = 3/(64π⁷R₅⁵). ` +
      `${terms.length} distinct cosine${terms.length === 1 ? "" : "s"}; terms independent of the ` +
      `phases are dropped, as the paper drops them.</div>`;
  },

  /* ---------------------------------------------------------------- the picture */

  _plot(b, terms) {
    const c = document.getElementById("sunPlot");
    const W = c.clientWidth || 720, H = 300;
    const d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, W, H);
    const note = document.getElementById("sunPlotNote");
    this._lay = { W, phases: b.phases, x0: 46, x1: W - 12 };
    if (!b.phases || !terms.length) {
      note.textContent = b.phases ? "every term cancelled: the potential is flat"
                                  : "no phase, nothing to draw";
      return;
    }
    const x0 = 46, x1 = W - 12, y0 = 14, y1 = H - 28;

    if (b.phases === 1) {
      const n = 400, ys = [];
      for (let i = 0; i <= n; i++) ys.push(sun5dV(terms, [i / n], 300));
      const lo = Math.min(...ys), hi = Math.max(...ys), span = (hi - lo) || 1;
      g.strokeStyle = this._css("--line");
      g.beginPath(); g.moveTo(x0, y1); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = this._css("--blue"); g.lineWidth = 1.8; g.beginPath();
      ys.forEach((v, i) => {
        const X = x0 + (x1 - x0) * i / n, Y = y1 - (y1 - y0) * (v - lo) / span;
        i ? g.lineTo(X, Y) : g.moveTo(X, Y);
      });
      g.stroke();
      const p = SUN5D_S.probe[0];
      const Xp = x0 + (x1 - x0) * p;
      g.strokeStyle = this._css("--rust"); g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(Xp, y0); g.lineTo(Xp, y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = this._css("--ink2");
      g.font = "11px ui-monospace,Menlo,Consolas,monospace";
      g.textAlign = "center";
      for (const t of [0, 0.25, 0.5, 0.75, 1]) g.fillText(String(t), x0 + (x1 - x0) * t, y1 + 15);
      note.innerHTML = `V(a)/C over one period. Click to move the probe: at <b>a = ` +
        `${p.toFixed(3)}</b>, V/C = <b>${sun5dV(terms, [p], 300).toFixed(4)}</b>.`;
      return;
    }

    if (b.phases === 2) {
      /* a heat map, because two phases is a torus and a line through it would be a choice nobody
       * asked for.  Coarse on purpose: it locates, and the vacuum panel below refines. */
      const n = 96;
      const V = new Float64Array((n + 1) * (n + 1));
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= n; j++) {
          const v = sun5dV(terms, [i / n, j / n], 120);
          V[i * (n + 1) + j] = v;
          if (v < lo) lo = v; if (v > hi) hi = v;
        }
      const span = (hi - lo) || 1;
      const w = (x1 - x0) / (n + 1), h = (y1 - y0) / (n + 1);
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= n; j++) {
          const u = (V[i * (n + 1) + j] - lo) / span;
          const r = Math.round(240 - 200 * (1 - u)), gg = Math.round(246 - 120 * (1 - u));
          g.fillStyle = `rgb(${r},${gg},${Math.round(250 - 40 * (1 - u))})`;
          g.fillRect(x0 + i * w, y1 - (j + 1) * h, w + 1, h + 1);
        }
      g.strokeStyle = this._css("--line");
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = this._css("--ink2");
      g.font = "11px ui-monospace,Menlo,Consolas,monospace";
      g.textAlign = "center";
      g.fillText("a₁", (x0 + x1) / 2, y1 + 15);
      note.innerHTML = `V over the torus of the two phases — dark is deep. ` +
        `Range V/C ∈ [${lo.toFixed(3)}, ${hi.toFixed(3)}].`;
      return;
    }

    g.fillStyle = this._css("--ink3");
    g.font = "13px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = "center";
    g.fillText(`${b.phases} phases — a plot would be a slice, and a slice is a choice`, W / 2, H / 2);
    note.innerHTML = `With ${b.phases} Wilson-line phases the potential lives on a ` +
      `${b.phases}-torus. The formula above is complete and exact; this panel draws one and two ` +
      `phases and <b>declines the rest</b> rather than showing a section through it and letting ` +
      `it read as the whole.`;
  },

  /* ---------------------------------------------------------------- the vacuum */

  _vacuum(b, terms) {
    const el = document.getElementById("sunVac");
    if (!b.phases || !terms.length) {
      el.className = "verdict stable";
      el.innerHTML = `<b>—</b><span>No phase, or a flat potential: there is no vacuum to locate.</span>`;
      return;
    }
    if (b.phases > 2) {
      el.className = "verdict stable";
      el.innerHTML = `<b>Not located here</b><span>${b.phases} phases. Minimising on a ` +
        `${b.phases}-torus by grid is not an instrument, it is a hope; the terms above are exact ` +
        `and a reader with a minimiser has everything they need. ` +
        `<span class="chip bad">unknown</span> — said out loud, with its reason.</span>`;
      return;
    }
    const m = sun5dMinimum(terms, b.phases, { grid: b.phases === 1 ? 600 : 240 });
    if (!m) { el.className = "verdict stable"; el.innerHTML = "<b>—</b><span>—</span>"; return; }
    const nm = sun5dNames(b);
    const at = m.theta.map((t, i) => `${nm[i]} = ${t.toFixed(5)}`).join(", ");
    /* THE TWO ENDS OF THE INTERVAL ARE THE TWO SYMMETRIC POINTS, NOT BROKEN VACUA.  V has period 2
     * in every phase and is even, so [0, 1] is a fundamental domain and its ends are θ = 0 and
     * θ = 1 — the same pair Part VII's stability criterion compares.  The first version of this
     * panel found the minimum at a = 1 on their own §4.3 model and announced "the Hosotani
     * mechanism", which is a claim about an INTERIOR minimum.  It is now three verdicts, and the
     * one-phase case gets the criterion by name. */
    const interior = !m.atEdge;
    el.className = interior ? "verdict breaks" : "verdict stable";
    let head, body;
    if (interior) {
      head = "The Wilson line takes a vacuum expectation value";
      body = `Deepest at ${at}, strictly inside the fundamental domain, at V/C = ${m.V.toFixed(5)} ` +
             `against ${m.symmetric.toFixed(5)} at θ = 0 and ${m.other.toFixed(5)} at θ = 1. So ` +
             `the gauge symmetry is broken further than the boundary condition broke it — the ` +
             `Hosotani mechanism, on this content. `;
    } else if (m.V < m.symmetric - 1e-9) {
      head = "The OTHER symmetric point is the deeper one";
      body = `The minimum sits at ${at}, an <b>end</b> of the fundamental domain — and the two ends ` +
             `are the two symmetric points, not broken vacua. V/C = ${m.V.toFixed(5)} there ` +
             `against ${m.symmetric.toFixed(5)} at θ = 0. Nothing is broken by the Wilson line; ` +
             `the theory sits at a different symmetric point, whose unbroken subgroup is the ` +
             `boundary condition's read with the other sign. `;
    } else {
      head = "The symmetric point IS the vacuum";
      body = `Deepest at ${at}, V/C = ${m.V.toFixed(5)}; the other end gives ` +
             `${m.other.toFixed(5)}. The boundary condition's breaking is all there is at one ` +
             `loop for this content. `;
    }
    /* and with one phase, the criterion by name: Part VII eq. (34), on somebody else's model */
    let w = "";
    if (b.phases === 1) {
      const tt = sun5dTermTable(terms);
      const W = stabilityW(tt);
      /* the paper writes V = (C/2)Σ… and the kernel's F has no ½, so the criterion's value is
       * twice the difference this panel prints in V/C.  The factor is stated and the harness
       * asserts it, because an unstated convention is how a right formula prints a wrong number. */
      w = `<br><b>The criterion, by name.</b> F(1) − F(0) = (31/16) ζ(5) W with ` +
          `W = Σ<sub>c odd</sub> m(−s) = ${(+W.toFixed(6))}, which in this panel's V/C units — ` +
          `the paper carries a ½ that the kernel's F does not — is ` +
          `${(F1minusF0(W) / 2).toFixed(5)}, the ${m.other.toFixed(5)} − ${m.symmetric.toFixed(5)} ` +
          `measured above. So ` +
          `${W > 0 ? "θ = 0 is the deeper of the two" : W < 0 ? "θ = 1 is the deeper of the two"
                   : "they are degenerate, which for the SU(7) lattice cannot happen and here does"}. ` +
          `That is Part VII eq. (34) applied to a model it was not written for: it compares the ` +
          `two symmetric points and says nothing about an interior minimum, which is why the ` +
          `verdict above is measured and not deduced from it. <span class="chip thm">theorem</span>`;
    }
    el.innerHTML = `<b>${head}</b><span>${body}<span class="chip mea">measured</span> a grid and a ` +
      `coordinate refinement on the exact sum, computed on this render.${w}</span>`;
  },

  /* ---------------------------------------------------------------- the bridge */

  _bridge(b, terms) {
    const el = document.getElementById("sunBridge");
    if (b.phases !== 1 || !terms.length) {
      el.innerHTML = b.phases === 1
        ? `The potential is flat, so there is no vacuum for the closed form to find.`
        : `<b>${b.phases} phases.</b> The closed form of Part VII, its five complete invariants and ` +
          `its two arithmetic laws are all statements about a potential with <b>one</b> phase — ` +
          `the (m, s, c) form. They do not apply here, and this panel says so rather than ` +
          `printing a number from a shape they were not proved for. Set the blocks so that ` +
          `min(n₊₊, n₋₋) + min(n₊₋, n₋₊) = 1 and everything below appears.`;
      return;
    }
    const tt = sun5dTermTable(terms);
    const mo = moments(tt);
    const a = alphaMin(mo);
    const co = coordinates(tt);
    const W2 = Math.round(2 * stabilityW(tt));
    const rows = tt.map(([m, s, c]) =>
      `<tr><td class="num">${(+m.toFixed(6))}</td><td class="num">${s > 0 ? "+" : "−"}</td>` +
      `<td class="num">${c}</td></tr>`).join("");
    el.innerHTML =
      `<b>This model has one Wilson-line phase, so it is an (m, s, c) table</b> — the same object ` +
      `every SU(7) section of this instrument runs on. Everything Part VII proves about that shape ` +
      `applies to it, whatever the group:` +
      `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px">` +
      `<table style="width:auto"><thead><tr><th class="num">m</th><th class="num">s</th>` +
      `<th class="num">c</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<div style="flex:1;min-width:240px">` +
      `<div class="rowm"><span class="nm" style="flex:1">A₄</span>` +
      `<span class="num">${(+mo.A4.toFixed(6))}</span></div>` +
      `<div class="rowm"><span class="nm" style="flex:1">8D</span>` +
      `<span class="num">${(+(8 * mo.D).toFixed(6))}</span></div>` +
      `<div class="rowm"><span class="nm" style="flex:1">G</span>` +
      `<span class="num">${mo.G.toFixed(6)}</span></div>` +
      `<div class="rowm"><span class="nm" style="flex:1">2W</span>` +
      `<span class="num">${W2}</span></div>` +
      `<div class="rowm"><span class="nm" style="flex:1">α<sub>min</sub>, closed form</span>` +
      `<span class="num">${a === null ? "—" : a.toFixed(6)}</span></div>` +
      `</div></div>` +
      `<p style="margin:10px 0 0">The five complete invariants here are ` +
      `(A₄, 8D, 2U, V, 2W) = (${(+co.A4.toFixed(4))}, ${(+co.D8.toFixed(4))}, ${co.U2}, ${co.V}, ` +
      `${co.W2}) — Part VII's Theorem 3: two contents have the same one-loop potential, ` +
      `identically in the phase, exactly when these five agree. <span class="chip thm">theorem</span> ` +
      `Whether the <em>arithmetic laws</em> hold is a different question: they are theorems about ` +
      `the SU(7) lattice, and here they are something you can <em>check</em> — 8D − 2A₄ ` +
      `${(((Math.round(8 * mo.D - 2 * mo.A4) % 6) + 6) % 6) === 3 ? "IS" : "is NOT"} ≡ 3 (mod 6), ` +
      `and 2W ${Math.abs(W2 % 2) === 1 ? "IS" : "is NOT"} odd. A law that holds for another group ` +
      `is a coincidence until somebody proves it, and this page reports it as a measurement.</p>`;
  },
};

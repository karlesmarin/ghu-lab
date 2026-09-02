/* calculator_section.js — Parts IV-V: a content in, the Higgs out.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The section carries its anchor on its face: at every render it recomputes AHMN's published case
 * and shows itself passing or failing against 1.2046.  An instrument that checks itself in front of
 * the reader is worth more than one that was checked once by its author.
 *
 * 119 representations is too many for steppers, so the content is built from a catalogue: pick a
 * row, then set its multiplicity, its boundary sign eta and whether it enters as matter or as the
 * gauge sector.  Those last two are properties of the multiplet in the model and live in the model
 * record, which is why the module can read them without a side channel.
 *
 * Edited BY HAND.
 */
const CALC_DATA = DATASETS.su4_ahmn;
let CALC_SWEEP = null;

/* The plan and the relief come from torus_panels.js, which this section had a private copy of: it
 * was written first, the module was factored out of it for the eta-meter, and two implementations
 * of one pair is a bill that comes due on the third.
 *
 * The cursor is deliberately NOT the model.  The numbers the paper claims are read at the vacuum
 * and stay there; the cursor gets its own readout, in its own words. */
const CALC_PANELS = makeTorusPanels({
  data: CALC_DATA,
  ids: { map: "cMap", surf: "cSurf", cur: "cCur", mode: "cMode",
         go: "cGo", sim: "cSim", basins: "cBasins" },
});
const CALCULATOR_SECTION = {
  id: "calculator",
  label: "Model calculator",
  paper: "Parts IV-V",
  ready: true,
  modules: [selectionModule(CALC_DATA), calculatorModule(CALC_DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="cLead">—</p>
    <div class="note" style="margin-top:9px" id="cAnchor">—</div>
  </div>

  ${CALC_PANELS.html({ title: "Where the vacuum sits — the plan, and the same V as a relief",
                       sim: false })}

  <div class="grid two">
    <div>
      <div class="card" style="margin-top:18px">
        <h2>The cut through the vacuum${helpMark("wilson-line")}</h2>
        <canvas id="cCut" width="720" height="220"></canvas>
        <div class="note" style="margin-top:9px">V along &alpha;<sub>2</sub> at the vacuum's
        &alpha;<sub>1</sub>. One curve anybody can read.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What halving the search actually costs</h2>
        <div class="verdict" id="cSweep"><b>—</b><span>The selection rule licenses searching half
        the torus for some representations. This runs the same scan over the half and over the
        whole, on all 119, and prices the difference.</span></div>
        <div style="display:flex;gap:8px;margin-top:11px;align-items:center;flex-wrap:wrap">
          <button class="ghost" id="cSweepGo">▶ price it on all 119</button>
          <span class="note" id="cSweepNote"></span>
        </div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Your matter content${helpMark("bulk-content")}</h2>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <button class="ghost" id="cClear">clear</button>
          <button class="ghost" id="cAhmn">▶ load AHMN 2312.08608</button>
        </div>
        <table><thead><tr><th>multiplet</th><th class="num">dim</th><th class="num">n</th>
          <th><span class="lc">&eta;</span></th><th>role</th><th></th></tr></thead><tbody id="cRows"></tbody></table>
        <div class="note" style="margin-top:9px" id="cEmpty">Pick from the catalogue below.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What comes out</h2>
        <div class="pair">
          <div class="stat"><div class="k">Wilson line &alpha;</div><div class="v" id="cA">—</div>
            <div class="s" id="cAs">—</div></div>
          <div class="stat"><div class="k">mass ratio</div><div class="v" id="cR">—</div>
            <div class="s">heavier over lighter — an invariant</div></div>
        </div>
        <div class="pair" style="margin-top:10px">
          <div class="stat"><div class="k">masses&sup2;, light / heavy</div>
            <div class="v" id="cM" style="font-size:16px">—</div>
            <div class="s">eigenvalues of the curvature at the vacuum</div></div>
          <div class="stat"><div class="k">mixing |m&#8321;&#8322;|/m&#8321;&#8321;</div>
            <div class="v" id="cX">—</div>
            <div class="s">magnitude only; the sign is a convention</div></div>
        </div>
        <div class="verdict" id="cVd" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The catalogue <span class="note">— 119 representations, blind ones marked</span></h2>
        <div style="max-height:250px;overflow:auto;box-shadow:inset 0 -14px 12px -12px rgba(20,40,60,.13);border:1px solid var(--line);border-radius:8px">
          <table><thead><tr><th>multiplet</th><th class="num">dim</th><th><span class="lc">&eta;</span></th>
            <th></th></tr></thead><tbody id="cCat"></tbody></table>
        </div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const halfOf = (name) => {
      const d = ctx.DATA.reps_dynkin && ctx.DATA.reps_dynkin[name];
      return d ? halfDomain(d[0], d[1], d[2]) : false;
    };
    document.getElementById("cSweepGo").onclick = () => {
      /* Seventeen seconds of arithmetic, fed to the browser ten representations at a time so the
       * page keeps answering and the reader can watch it advance. */
      const names = ctx.DATA.catalogue.map((c) => c.name);
      let rows = [], i = 0;
      const step = () => {
        rows = rows.concat(sweepDomain(ctx.DATA, halfOf, { names: names.slice(i, i + 10) }).rows);
        i += 10;
        document.getElementById("cSweepNote").textContent =
          i < names.length ? `${Math.min(i, names.length)} of ${names.length}…` : "";
        if (i < names.length) return setTimeout(step, 0);
        CALC_SWEEP = summariseDomain(rows);
        ctx.refresh();
      };
      document.getElementById("cSweepNote").textContent = "running…";
      setTimeout(step, 20);
    };
    const $ = (id) => document.getElementById(id);
    const D = ctx.DATA;

    $("cCat").innerHTML = D.catalogue.filter((r) => r.dim && r.dim <= 300).map((r) => {
      const i = ctx.SLOTS.findIndex((s) => s.rep === r.name);
      return `<tr class="clk" data-i="${i}"><td style="font-family:var(--mono)">${r.name}</td>` +
             `<td class="num">${r.dim}</td>` +
             `<td>${r.blind ? '<span class="chip ver">blind</span>'
                             : '<span class="chip mea">sees <span class="lc">&eta;</span></span>'}</td>` +
             `<td class="num"><button class="st" data-add="${i}">+</button></td></tr>`;
    }).join("");
    $("cCat").querySelectorAll("button[data-add]").forEach((b) =>
      (b.onclick = () => ctx.setN(+b.dataset.add, 1)));

    CALC_PANELS.attach();

    $("cClear").onclick = () => ctx.clear();
    /* AHMN's own content, from the published tool: three 35s of matter and the gauge 15. */
    $("cAhmn").onclick = () => ctx.load([
      { rep: "(4,0,0)", parities: [1, 1], multiplicity: 3, eta: 1, role: 1 },
      { rep: "(1,0,1)", parities: [1, 1], multiplicity: 1, eta: 1, role: -1 },
    ]);
  },

  render(ctx, r) {
    if (CALC_SWEEP) {
      const w = CALC_SWEEP, bad = w.violations.length, bite = w.bites.length;
      const el = document.getElementById("cSweep");
      el.className = "verdict " + (bad ? "stable" : "breaks");
      el.innerHTML = bad
        ? `<b style="color:var(--rust)">${bad} representation(s) lost the minimum inside the ` +
          `licensed half</b><span>${w.violations.slice(0, 6).join(", ")} — the rule would be wrong ` +
          `about them.</span>`
        : `<b>Free where allowed, and up to ${(100 * w.worstBite).toFixed(0)} % of |V| where not</b>` +
          `<span>On the <b>${w.allowed}</b> the rule clears, halving the search costs ` +
          `<b>${w.worstAllowedLoss < 1e-12 ? "nothing at all" : w.worstAllowedLoss.toExponential(1)}</b> ` +
          `— the half's points are a subset of the whole's, so this is exact, not small. ` +
          `And on the <b>${w.forbidden}</b> it does not clear, <b>${bite}</b> really do lose the ` +
          `minimum if you halve anyway, the worst by ${(100 * w.worstBite).toFixed(1)} % of |V|. ` +
          `A rule that never bit would be protecting nothing.</span>`;
      document.getElementById("cSweepNote").innerHTML =
        `<b>${w.tested}</b> representations, scanned twice each, in your browser.`;
    }

    const $ = (id) => document.getElementById(id);
    const D = ctx.DATA, v = r.values;

    /* ---- the content rows */
    const held = ctx.n.map((n, i) => [i, n]).filter(([, n]) => n);
    $("cEmpty").style.display = held.length ? "none" : "";
    $("cRows").innerHTML = held.map(([i, n]) => {
      const name = ctx.SLOTS[i].rep;
      const cat = D.catalogue.find((c) => c.name === name) || {};
      return `<tr><td style="font-family:var(--mono)">${name}` +
             `${cat.blind ? ' <span class="chip ver">blind</span>' : ""}</td>` +
             `<td class="num">${cat.dim ?? "—"}</td>` +
             `<td class="num"><button class="st" data-n="${i}" data-d="-1">−</button>` +
             `<b style="padding:0 6px;font-family:var(--mono)">${n}</b>` +
             `<button class="st" data-n="${i}" data-d="1">+</button></td>` +
             `<td><button class="st" style="width:auto;padding:0 8px" data-eta="${i}">` +
             `${ctx.eta[i] > 0 ? "+1" : "−1"}</button></td>` +
             `<td><button class="st" style="width:auto;padding:0 8px" data-role="${i}">` +
             `${ctx.role[i] > 0 ? "matter" : "gauge"}</button></td>` +
             `<td class="num"><button class="st" data-zero="${i}">×</button></td></tr>`;
    }).join("");
    $("cRows").querySelectorAll("button").forEach((b) => {
      if (b.dataset.n !== undefined) b.onclick = () => ctx.setN(+b.dataset.n, +b.dataset.d);
      if (b.dataset.eta !== undefined)
        b.onclick = () => ctx.setEta(+b.dataset.eta, -ctx.eta[+b.dataset.eta]);
      if (b.dataset.role !== undefined)
        b.onclick = () => ctx.setRole(+b.dataset.role, -ctx.role[+b.dataset.role]);
      if (b.dataset.zero !== undefined)
        b.onclick = () => ctx.setN(+b.dataset.zero, -ctx.n[+b.dataset.zero]);
    });

    /* ---- the anchor, recomputed in front of the reader at every render */
    const AH = [{ key: "(4,0,0)", n: 3, eta: 1, role: 1 },
                { key: "(1,0,1)", n: 1, eta: 1, role: -1 }];
    const am = minimise(spectrum(AH, D), lattice(D.kmax));
    const off = Math.abs(am.mass_ratio - 1.2046) / 1.2046;
    $("cAnchor").innerHTML =
      `<b>The anchor, recomputed just now.</b> AHMN's published content gives a mass ratio of ` +
      `<b style="font-family:var(--mono)">${am.mass_ratio.toFixed(4)}</b> here against ` +
      `<b style="font-family:var(--mono)">1.2046</b> published — ` +
      (off < 1e-3
        ? `<span style="color:var(--green)">agreeing to ${(100 * off).toFixed(2)} %</span>. ` +
          `That single published case is the whole of this engine's validation, and it is shown ` +
          `rather than asserted.`
        : `<span style="color:var(--rust)">off by ${(100 * off).toFixed(2)} % — do not trust the ` +
          `numbers below</span>.`);

    /* ---- the outputs */
    const vac = v.get("vacuum"), ratio = v.get("mass_ratio"), mm = v.get("higgs_masses");
    if (vac.status === "unknown") {
      $("cLead").innerHTML = `Nothing to minimise yet. <span style="color:var(--ink2)">${vac.reason}</span>`;
      ["cA", "cR", "cM", "cX"].forEach((k) => ($(k).textContent = "—"));
      $("cAs").textContent = "—";
      $("cVd").className = "verdict stable";
      $("cVd").innerHTML = `<b>No vacuum</b><span>${vac.reason}</span>`;
      CALC_PANELS.setContent(null);
      this._cut(null, D);
      return;
    }
    const a = vac.value.alpha;
    $("cA").textContent = `${a[0].toFixed(3)}, ${a[1].toFixed(3)}`;
    $("cAs").textContent = `|∇V| = ${vac.value.grad.toExponential(1)} — polished, not a grid cell`;
    $("cR").textContent = ratio.status === "unknown" ? "—" : ratio.value.toFixed(4);
    $("cM").textContent = mm.value.map((x) => x.toFixed(1)).join(" / ");
    $("cX").textContent = v.get("mixing").value.toFixed(4);

    const breaks = v.get("breaks").value;
    $("cLead").innerHTML = breaks
      ? `This content breaks the symmetry: the vacuum sits away from the symmetric point, at ` +
        `<b>α = (${a[0].toFixed(3)}, ${a[1].toFixed(3)})</b>, and the two neutral Higgs states come ` +
        `out in the ratio <b>${ratio.status === "unknown" ? "—" : ratio.value.toFixed(4)}</b>.`
      : `This content leaves the symmetric point as the minimum: nothing breaks.`;
    $("cVd").className = "verdict " + (breaks ? "breaks" : "stable");
    $("cVd").innerHTML = breaks
      ? `<b>Breaks</b><span>Everything here is <span class="chip mea">measured</span>: one ` +
        `published case is the whole validation, and the sign of the mixing is a convention.</span>`
      : `<b>Stable</b><span>The minimum is the symmetric point, so there is no Wilson-line ` +
        `breaking to report.</span>`;

    const sp = spectrum((r.model.bulk || []).map((b) => ({ key: b.rep, n: b.multiplicity,
                                                           eta: b.eta ?? 1, role: b.role ?? 1 })), D);
    CALC_PANELS.setContent(sp, a);
    this._cut(sp, D, a);
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },

  _cut(sp, D, vac) {
    const [g, W, H] = this._fit(document.getElementById("cCut"), 220);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const L = 52, R = 14, T = 12, B = 28, iw = W - L - R, ih = H - T - B;
    g.strokeStyle = "#e6edf2"; g.strokeRect(L + .5, T + .5, iw - 1, ih - 1);
    if (!sp || !vac) return;
    const LATT = lattice(D.kmax), n = 200, ys = [];
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= n; i++) {
      const y = V(sp, LATT, vac[0], i / n);
      ys.push(y); if (y < lo) lo = y; if (y > hi) hi = y;
    }
    const pad = (hi - lo) * 0.1 || 1, YL = lo - pad, YH = hi + pad;
    const sx = (t) => L + t * iw, sy = (y) => T + ih - (y - YL) / (YH - YL) * ih;
    g.strokeStyle = "#1B6F8C"; g.lineWidth = 2; g.beginPath();
    ys.forEach((y, i) => (i ? g.lineTo(sx(i / n), sy(y)) : g.moveTo(sx(0), sy(y))));
    g.stroke();
    const X = sx(vac[1]), Y = sy(V(sp, LATT, vac[0], vac[1]));
    g.strokeStyle = "#B5530F"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X - 6, Y - 6); g.lineTo(X + 6, Y + 6);
    g.moveTo(X + 6, Y - 6); g.lineTo(X - 6, Y + 6); g.stroke();
    g.fillStyle = "#7d8c99"; g.font = "10px ui-monospace,monospace";
    g.textAlign = "center"; g.textBaseline = "top";
    g.fillText("α₂ at α₁ = " + vac[0].toFixed(3), L + iw / 2, T + ih + 8);
  },
};

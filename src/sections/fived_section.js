/* fived_section.js — "Five dimensions": Haba-Yamashita's own model, with its vacuum found.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The first section for readers with no stake in this series: 5D SU(3) -> SU(2) x U(1) on
 * S¹/Z₂, one Wilson phase, exactly as Haba & Yamashita published it in 2004 -- with the one
 * thing their paper calls the hard part and leaves undone, the vacuum, located in the browser.
 * Six numbers in, alpha_min out, the closed form checked against direct minimisation on every
 * render, and the honest ceiling on all of it stated in the first line: THEY PUBLISH NO
 * NORMALISATION, so everything here is in units of 1/R and nothing is a GeV.
 *
 * Edited BY HAND.
 */
const FIVED_DATA = DATASETS.su3_hy;
const FIVED_SECTION = {
  id: "fived",
  label: "Five dimensions",
  paper: "Haba–Yamashita 2004",
  ready: true,
  modules: [fivedModule(FIVED_DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="fvLead">—</p>
    <div class="note" style="margin-top:9px">
      Their eq. (3.20) is the whole model: the one-loop potential of the Wilson-line phase as a
      four-row table, linear in six bulk counts. Their summary calls analysing the vacuum
      structure the hard part, and their paper never locates a minimum. This page does — with the
      closed form of Part VII, which applies to their table verbatim. <b>No absolute scale
      exists here</b>: they publish no normalisation, so α and every mass are in units of 1/R.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The bulk content — six numbers${helpMark("bulk-content")}</h2>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <button class="ghost" id="fvAnchor">⌂ the archived row</button>
          <button class="ghost" id="fvClear">clear — pure gauge</button>
          <button class="ghost" id="fvMarginal">the marginal trio</button>
          <button class="ghost" id="fvBlind">+ a blind step</button>
        </div>
        <div id="fvSlots"></div>
        <div class="note" style="margin-top:9px">η η′ = + is a periodic tower (integer modes),
        η η′ = − an antiperiodic one (half-odd modes, no zero mode). A Dirac fermion enters the
        counting rule with 4 degrees of freedom, a complex scalar with −2, the gauge and ghost
        sector with −(D−2) = −3 — their words, their rule.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Their eq. (3.20), evaluated</h2>
        <table><thead><tr><th>tower</th><th class="num">coefficient m</th>
          <th class="num">value</th></tr></thead><tbody id="fvTerms"></tbody></table>
        <div class="pair" style="margin-top:11px">
          <div class="stat"><div class="k">D = A₂ − ¾B₂</div><div class="v" id="fvD">—</div>
            <div class="s">the curvature at α = 0; D &gt; 0 is electroweak breaking</div></div>
          <div class="stat"><div class="k">8D</div><div class="v" id="fvD8">—</div>
            <div class="s" id="fvD8s">—</div></div>
        </div>
        <div class="note" style="margin-top:9px" id="fvParity">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Three things worth pressing</h2>
        <div class="note" style="line-height:1.7">
          <b>Clear</b> is their own control: pure gauge gives D = −9 &lt; 0 — the gauge sector
          alone never breaks the symmetry.<br>
          <b>The marginal trio</b> — one adjoint (+) and two fundamentals (−) — lands on
          <span style="font-family:var(--mono)">8D = 0</span> exactly: marginality is not a
          fine-tuned corner in five dimensions, it is three multiplets away. What forbids it in
          the SU(7) model upstairs is the sixth dimension together with the gauge seed.<br>
          <b>A blind step</b> adds (ΔN_f, ΔN_s) = (1, 2) at η η′ = +: the table does not move a
          digit. The potential sees only 2N_f − N_s — Part V's blind class, in a second model,
          straight off their counting rule. <span class="chip thm">theorem</span></div>
        <div class="verdict breaks" id="fvBlindV" style="margin-top:11px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The second anchor — von Gersdorff–Irges–Quirós 2002${helpMark("anchor")}</h2>
        <p class="note" style="margin:0 0 10px">A different group, a different decade, and four
        published numbers this machinery must hit with <b>nothing adjusted</b> — the anchor route
        Part VII §12 keeps live. Their criterion for symmetry breaking is exactly our D &gt; 0:</p>
        <table><thead><tr><th>group</th><th>fermions</th><th class="num">N_f critical, ours</th>
          <th class="num">theirs</th><th></th></tr></thead><tbody id="fvNf"></tbody></table>
        <canvas id="fvVgiq" width="720" height="270" style="margin-top:11px"></canvas>
        <div class="legend">
          <span><i style="background:var(--blue)"></i>SU(2) adjoint potential</span>
          <span><i style="background:var(--ink3)"></i>SU(3) adjoint potential</span>
          <span><i style="background:var(--green)"></i>our minima — on the centre</span>
          <span><i style="background:var(--rust)"></i>their printed 0.29</span>
        </div>
        <div class="verdict stable" id="fvVgiqV" style="margin-top:11px"><b>—</b><span>—</span></div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The potential, and its located vacuum${helpMark("alpha-min")}</h2>
        <canvas id="fvPot" width="720" height="300"></canvas>
        <div class="verdict stable" id="fvV" style="margin-top:11px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The Kaluza–Klein spectrum at the vacuum${helpMark("kk-tower")}</h2>
        <canvas id="fvSpec" width="720" height="300"></canvas>
        <div class="note" style="margin-top:9px" id="fvSpecNote">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("fvSlots").innerHTML = ctx.SLOTS.map((s, i) =>
      `<div class="rowm"><span class="nm">${s.rep}${s.key}</span>` +
      `<span class="ch">${(ctx.DATA.species[s.rep] || "").replace(/ \(.*/, "")}</span>` +
      `<button class="st" data-i="${i}" data-d="-1">−</button>` +
      `<span class="cnt z" id="fvC${i}">0</span>` +
      `<button class="st" data-i="${i}" data-d="1">+</button></div>`).join("");
    $("fvSlots").querySelectorAll("button.st")
      .forEach((b) => (b.onclick = () => ctx.setN(+b.dataset.i, +b.dataset.d)));
    $("fvAnchor").onclick = () => ctx.load(ctx.DATA.anchor.bulk);
    $("fvClear").onclick = () => ctx.clear();
    $("fvMarginal").onclick = () => ctx.load([
      { rep: "adjoint", parities: [1, 1], multiplicity: 1 },
      { rep: "fund", parities: [1, -1], multiplicity: 2 }]);
    /* the blind step edits the CURRENT content -- that is the point: yours, plus (1, 2) */
    $("fvBlind").onclick = () => {
      const bulk = (ctx.model().bulk || []).map((b) => ({ ...b }));
      for (const [rep, add] of [["fund", 1], ["scalar", 2]]) {
        const hit = bulk.find((b) => b.rep === rep && b.parities[0] * b.parities[1] === 1);
        if (hit) hit.multiplicity += add;
        else bulk.push({ rep, parities: [1, 1], multiplicity: add });
      }
      ctx.load(bulk);
    };
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    ctx.n.forEach((n, i) => {
      const c = $("fvC" + i);
      if (c) { c.textContent = n; c.className = "cnt" + (n ? "" : " z"); }
    });
    const hv = r.values.get("hy");
    if (hv.status === "unknown") {
      $("fvLead").textContent = hv.reason;
      return;
    }
    const h = hv.value;

    const SPLABEL = { 0: "c = 2, periodic", 1: "c = 2, antiperiodic",
                      2: "c = 1, periodic", 3: "c = 1, antiperiodic" };
    const FORMULA = ["−3/2 + 2·Na⁺", "2·Na⁻", "−3 + 4·Na⁺ + 2·Nf⁺ − Ns⁺", "4·Na⁻ + 2·Nf⁻ − Ns⁻"];
    $("fvTerms").innerHTML = h.terms.map((t, i) =>
      `<tr><td style="font-family:var(--mono);font-size:12px">${SPLABEL[i]}</td>` +
      `<td class="num">${FORMULA[i]}</td>` +
      `<td class="num"${t[0] ? "" : ' style="color:var(--ink3)"'}>${t[0]}</td></tr>`).join("");
    $("fvD").textContent = h.D.toFixed(3);
    $("fvD8").textContent = String(h.D8);
    $("fvD8s").innerHTML = h.D8 === 0
      ? `<b style="color:var(--rust)">zero exactly — marginal</b>`
      : h.D8_even ? "even, as this class always is" : "ODD — impossible here; the page is broken";
    $("fvParity").innerHTML =
      `<b>8D is even for every content of this class</b> — a Dirac fermion enters with 4 degrees ` +
      `of freedom and a complex scalar with −2, both even, and the one odd coefficient, the −3 of ` +
      `gauge and ghost, multiplies only the adjoint, evenly. The odd rung the SU(7) ceiling ` +
      `stands on cannot occur in five dimensions: it needs the second parity of the product ` +
      `orbifold. <span class="chip thm">theorem</span> Part VII §11. Of all contents up to four ` +
      `of each species, <b>${h.census.vacua.toLocaleString("en")}</b> break electroweak symmetry ` +
      `with a genuine interior minimum — <span class="chip ver">verified</span> the archived sweep.`;

    $("fvBlindV").className = "verdict " + (h.blind_invariant ? "breaks" : "stable");
    $("fvBlindV").innerHTML = h.blind_invariant
      ? `<b>The blind direction holds on this content</b><span>(N_f, N_s) → (N_f+1, N_s+2) at ` +
        `either parity leaves all four coefficients unchanged — recomputed just now, not quoted.</span>`
      : `<b style="color:var(--rust)">The blind direction FAILED — the page is broken</b><span></span>`;

    $("fvLead").innerHTML = h.alpha === null
      ? (h.D <= 0
          ? `This content does <b>not</b> break the symmetry: D = ${h.D.toFixed(2)} ≤ 0. The pure ` +
            `gauge sector sits at D = −9 — matter must supply the breaking.`
          : `D &gt; 0 but the fixed point finds no small-α solution here.`)
      : `The vacuum of this content sits at <b>α<sub>min</sub> = ${h.alpha.toFixed(5)}</b>, so the ` +
        `W scale is α/2 = ${(h.alpha / 2).toFixed(5)} in units of 1/R — <b>and that is the number ` +
        `their paper does not compute</b>. Curvature F″ = ${h.Fpp.toFixed(3)}. No normalisation ` +
        `exists: nothing on this page is a GeV.`;

    this._pot(h);
    this._spec(h);
    this._vgiq(ctx);
  },

  /* ---- the second anchor: their four numbers, recomputed in front of the reader ------------ */
  _vgiq(ctx) {
    const $ = (id) => document.getElementById(id);
    const V5 = ctx.DATA.vgiq;
    if (!V5) return;

    $("fvNf").innerHTML = V5.critical_nf.map((r) =>
      `<tr><td>${r.group}</td><td>${r.rep === "adj" ? "adjoint" : "fundamental"}</td>` +
      `<td class="num">${r.nf_ours}</td><td class="num">${r.nf_theirs}</td>` +
      `<td>${r.nf_ours === r.nf_theirs ? `<span class="chip thm">exact</span>`
                                        : `<span class="chip bad">off</span>`}</td></tr>`).join("");

    /* the two adjoint potentials, from the archived charge lists, in THEIR omega = alpha/2 */
    const termsOf = (g) => {
      const pos = V5.charges[g].adj.filter((c) => c > 0);
      const byC = {};
      for (const c of pos) byC[c] = (byC[c] || 0) + 1;
      return Object.entries(byC).map(([c, m]) => [m, 1, +c]);
    };
    const P = (g, w) => {
      const f = V5.charges[g].fund;
      let re = 0, im = 0;
      for (const c of f) { re += Math.cos(2 * Math.PI * c * w); im += Math.sin(2 * Math.PI * c * w); }
      return Math.hypot(re, im) / f.length;
    };
    const [g2d, W, H] = this._fit($("fvVgiq"), 270);
    g2d.fillStyle = "#fff"; g2d.fillRect(0, 0, W, H);
    const L = 40, Rp = 12, T = 12, B = 32, iw = W - L - Rp, ih = H - T - B;
    const X = (w) => L + w * iw;
    g2d.font = "10px " + this._css("--mono"); g2d.fillStyle = this._css("--ink3");
    g2d.textAlign = "center"; g2d.textBaseline = "top";
    for (const w of [0.25, 1 / 3, 0.5, 0.75]) g2d.fillText(w.toFixed(w === 1 / 3 ? 3 : 2), X(w), T + ih + 6);
    g2d.fillText("ω, their Wilson-line parameter (α = 2ω)", L + iw / 2, T + ih + 18);

    const mins = {};
    for (const [g, col] of [["SU(2)", this._css("--blue")], ["SU(3)", this._css("--ink3")]]) {
      const t = termsOf(g);
      const ys = [];
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 240; i++) {
        const w = 0.02 + 0.96 * i / 240, y = F(t, 2 * w, 300);
        ys.push([w, y]);
        if (y < lo) lo = y; if (y > hi) hi = y;
      }
      /* low potential DOWN: the first draft mapped it upside down and put the minima on the
       * peaks -- caught by the screenshot, as the house demands */
      const Y = (y) => T + 8 + (ih - 16) * ((hi - y) / (hi - lo));
      g2d.strokeStyle = col; g2d.lineWidth = 2; g2d.beginPath();
      ys.forEach(([w, y], i) => (i ? g2d.lineTo(X(w), Y(y)) : g2d.moveTo(X(w), Y(y))));
      g2d.stroke();
      const aMin = numericMin(t, { windings: 300 });
      mins[g] = aMin / 2;
      g2d.fillStyle = this._css("--green");
      g2d.beginPath(); g2d.arc(X(aMin / 2), Y(F(t, aMin, 300)), 5.5, 0, 7); g2d.fill();
      g2d.strokeStyle = "#fff"; g2d.lineWidth = 1.6; g2d.stroke();
      if (g === "SU(3)") {
        const wt = V5.minima_theirs["SU(3)"];
        g2d.strokeStyle = this._css("--rust"); g2d.lineWidth = 1.6; g2d.setLineDash([3, 3]);
        g2d.beginPath(); g2d.moveTo(X(wt), T); g2d.lineTo(X(wt), T + ih); g2d.stroke();
        g2d.setLineDash([]);
        g2d.fillStyle = this._css("--rust");
        g2d.beginPath(); g2d.arc(X(wt), Y(F(t, 2 * wt, 300)), 5, 0, 7); g2d.fill();
        g2d.strokeStyle = "#fff"; g2d.lineWidth = 1.5; g2d.stroke();
        g2d.font = "600 10px " + this._css("--mono"); g2d.textAlign = "left"; g2d.textBaseline = "top";
        g2d.fillText("theirs, 0.29 — not at the bottom", X(wt) + 6, T + 4);
      }
    }

    const p3ours = P("SU(3)", mins["SU(3)"]), p3theirs = P("SU(3)", V5.minima_theirs["SU(3)"]);
    $("fvVgiqV").className = "verdict stable";
    $("fvVgiqV").innerHTML =
      `<b>SU(2): ours ${mins["SU(2)"].toFixed(4)}, theirs ${V5.minima_theirs["SU(2)"]} — exact. ` +
      `SU(3): ours ${mins["SU(3)"].toFixed(4)} = 1/3 exactly, theirs 0.29 — unresolved</b>` +
      `<span>With adjoint matter the potential sees only the centre, so the minimum must be the ` +
      `centre-symmetric holonomy: at ω = 1/3 the fundamental Polyakov loop vanishes — computed ` +
      `just now, |P| = ${p3ours.toExponential(1)} — while at their 0.29 it is ` +
      `${p3theirs.toFixed(3)}. And 0.29 is ⅓·(√3/2) to two digits: the normalisation their text ` +
      `fixes for SU(2) and never for SU(3). The evidence sits on 1/3's side; it is <b>reported, ` +
      `not claimed</b>. Either way the anchor does its job: four critical flavour numbers and ` +
      `the SU(2) minimum, exact with nothing adjusted — which relocates Part VII's anchor ` +
      `residual away from the potential itself. <span class="chip ver">verified</span> ` +
      `vgiq_anchor.py, archived; the curves and loops recomputed on this page.</span>`;
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, hh) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = hh * d; c.style.height = hh + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, hh];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  _pot(h) {
    const [g, W, H] = this._fit(document.getElementById("fvPot"), 300);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const L = 54, Rp = 16, T = 14, B = 34, iw = W - L - Rp, ih = H - T - B;
    const hi = h.alpha === null ? 0.6 : Math.min(0.75, Math.max(0.08, 3.2 * h.alpha));
    const n = 180, xs = [], ys = [];
    let lo = Infinity, up = -Infinity;
    for (let i = 0; i <= n; i++) {
      const al = 1e-5 + hi * i / n, y = F(h.terms, al, 300);
      xs.push(al); ys.push(y);
      if (y < lo) lo = y; if (y > up) up = y;
    }
    const pad = (up - lo) * 0.1 || 1, YL = lo - pad, YH = up + pad;
    const sx = (al) => L + al / hi * iw, sy = (y) => T + ih - (y - YL) / (YH - YL) * ih;
    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const Y = Math.round(T + ih * i / 3) + 0.5;
      g.beginPath(); g.moveTo(L, Y); g.lineTo(L + iw, Y); g.stroke();
    }
    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "center"; g.textBaseline = "top";
    for (let i = 0; i <= 4; i++) g.fillText((hi * i / 4).toFixed(2), sx(hi * i / 4), T + ih + 6);
    g.fillText("α, the Wilson-line phase (period 2)", L + iw / 2, T + ih + 19);
    g.strokeStyle = this._css("--blue"); g.lineWidth = 2.2; g.lineJoin = "round"; g.beginPath();
    xs.forEach((al, i) => (i ? g.lineTo(sx(al), sy(ys[i])) : g.moveTo(sx(al), sy(ys[i]))));
    g.stroke();
    if (h.alpha !== null && h.alpha < hi) {
      const X = sx(h.alpha), Y = sy(F(h.terms, h.alpha, 300));
      g.strokeStyle = this._css("--rust"); g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(X, Y); g.lineTo(X, T + ih); g.stroke(); g.setLineDash([]);
      g.fillStyle = this._css("--rust");
      g.beginPath(); g.arc(X, Y, 5, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
      g.font = "600 11px " + this._css("--mono");
      g.textAlign = X > L + iw * 0.7 ? "right" : "left"; g.textBaseline = "bottom";
      g.fillText("α_min = " + h.alpha.toFixed(5), X + (X > L + iw * 0.7 ? -8 : 8), Y - 8);
    }
    const $ = (id) => document.getElementById(id);
    $("fvV").className = "verdict " + (h.alpha === null ? "stable"
      : h.control && h.control.rel < 1e-3 ? "breaks" : "stable");
    $("fvV").innerHTML = h.alpha === null
      ? `<b>No interior minimum</b><span>There is none to locate${h.D <= 0 ? ": D ≤ 0" : ""}.</span>`
      : h.control === null
        ? `<b>α_min = ${h.alpha.toFixed(6)}</b><span>The numeric control found no bracket here.</span>`
        : `<b>α_min = ${h.alpha.toFixed(6)}, and the control agrees to ${h.control.rel.toExponential(1)}</b>` +
          `<span>The closed form of Part VII against a direct minimisation of the same four-row ` +
          `table, run on this render: ${h.control.numeric.toFixed(6)}. ` +
          `<span class="chip ver">verified</span> here, not quoted.</span>`;
  },

  /* The spectrum as levels: each tower a column, masses |n + φ|/R marked, the vacuum's own
   * splitting visible -- the picture their mass-matrix footnote describes, drawn. */
  _spec(h) {
    const [g, W, H] = this._fit(document.getElementById("fvSpec"), 300);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const $ = (id) => document.getElementById(id);
    if (h.alpha === null || !h.spectrum) {
      g.fillStyle = this._css("--ink3"); g.font = "12px " + this._css("--mono");
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("no vacuum, no spectrum", W / 2, H / 2);
      $("fvSpecNote").textContent = "—";
      return;
    }
    const L = 54, Rp = 14, T = 16, B = 40, iw = W - L - Rp, ih = H - T - B;
    const MMAX = 1.35;
    const Y = (m) => T + ih * (1 - m / MMAX);
    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "right"; g.textBaseline = "middle";
    for (const m of [0, 0.25, 0.5, 0.75, 1, 1.25]) {
      g.beginPath(); g.moveTo(L, Y(m) + .5); g.lineTo(L + iw, Y(m) + .5); g.stroke();
      g.fillText(m.toFixed(2), L - 6, Y(m));
    }
    g.save(); g.translate(13, T + ih / 2); g.rotate(-Math.PI / 2);
    g.textAlign = "center"; g.textBaseline = "top"; g.fillText("mass · R", 0, 0); g.restore();

    const cols = h.spectrum;
    const cw = iw / cols.length;
    cols.forEach((t, i) => {
      const x0 = L + i * cw + cw * 0.15, x1 = L + (i + 1) * cw - cw * 0.15;
      const col = t.s > 0 ? this._css("--blue") : this._css("--rust");
      for (const m of t.levels) {
        if (m > MMAX) continue;
        g.strokeStyle = col; g.lineWidth = m < 1e-9 ? 3 : 2;
        g.beginPath(); g.moveTo(x0, Y(m)); g.lineTo(x1, Y(m)); g.stroke();
      }
      g.fillStyle = this._css("--ink2"); g.font = "9.5px " + this._css("--mono");
      g.textAlign = "center"; g.textBaseline = "top";
      g.fillText(`c=${t.c} ${t.s > 0 ? "per" : "anti"}`, (x0 + x1) / 2, T + ih + 6);
      g.fillText(t.c === 0 ? "neutral" : `φ=${t.phi.toFixed(3)}`, (x0 + x1) / 2, T + ih + 18);
    });
    $("fvSpecNote").innerHTML =
      `Every state of charge c in sector s = η η′ has masses <b>|n + φ|/R</b> with ` +
      `φ = (cα − δ)/2, δ = 0 periodic and 1 antiperiodic — their own mass-matrix footnote, read ` +
      `back from the phases of eq. (3.20). At the located vacuum the charged towers split off ` +
      `zero by cα/2 while the neutral ones do not move: that splitting <b>is</b> the symmetry ` +
      `breaking. Which neutral components keep exact zero modes depends on η and η′ separately — ` +
      `a datum the potential cannot see, since eq. (3.20) reads only their product. ` +
      `<span class="chip thm">theorem</span> the offsets; nothing here carries a scale.`;
  },
};

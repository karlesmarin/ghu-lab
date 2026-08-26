/* collider_section.js — "Collider": which state a search bounds, live on the model's own scale.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part VII §10 as an instrument.  Change the content anywhere in this family and 1/R₅ moves;
 * every number here — the coloron's mass and width, Λ₈, the form factor, the distortion relief —
 * follows it.  Two pictures carry the section: the ONE analytic function whose three regimes are
 * the contact operator, the angular distortion and the resonances; and that distortion drawn as
 * a relief over (M_jj, χ) — the exact plane the dijet angular measurement is binned in — under
 * the house mouse (drag moves the probe, shift-drag turns, wheel raises).
 *
 * The Δχ² teeth are QUOTED from the published record, never re-derived: the profiling recipe
 * lives in make_fig_chi2.py, and a near-miss re-derivation would put a number on this page that
 * disagrees with the paper.  Every quoted line names its source.
 *
 * Edited BY HAND.
 */
const COLL_P = { view: null, cur: [0.45, 0.28], field: null, key: null, proj: null,
                 override: null };     /* a typed 1/R5 in TeV: a probe, never the model */
const COLLIDER_SECTION = {
  id: "collider",
  label: "Collider",
  paper: "Part VII",
  ready: true,
  modules: [...modules(DATA), colliderModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="clLead">—</p>
    <div class="note" style="margin-top:9px">
      A bound on 1/R₅ is a bound on a compactification scale, not on any one particle. Getting
      from one to the other needs no phenomenological study: it is fixed by the three parity
      matrices and the mode expansions, all published. Colour-changing bosons vanish at the brane
      where the quarks live — <b>which shuts the direct proton-decay channel their own
      conclusions left open</b> — and the one coloured object below the Planck scale is the gluon
      tower: at <span style="font-family:var(--mono)">n/R₅</span> exactly, coupled at
      <b>√2·g_s</b> exactly, because the quarks sit exactly at the fixed point. The bound is
      saturated, not assumed. <span class="chip thm">theorem</span> Part VII §10.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The only coloured state a dijet search sees</h2>
        <div class="rowm" style="margin-bottom:10px">
          <span class="nm">1/R₅ (TeV)</span>
          <input id="clR5" type="text" size="7" placeholder="the model's"
                 style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:90px">
          <span class="note" style="flex:1">blank = this content's own scale; type one and every
          panel below follows — a probe for <em>your</em> mass, not a change to the model</span>
        </div>
        <div id="clDict"></div>
        <table style="margin-top:11px"><thead><tr><th>branch of Part VII</th>
          <th class="num">1/R₅</th><th class="num">α_s</th><th class="num">Γ/M</th>
          <th class="num">Γ</th></tr></thead><tbody id="clBranches"></tbody></table>
        <div class="note" style="margin-top:9px">Γ/M ≈ 0.16 is <b>not narrow</b>: the narrow
        axigluon/coloron benchmark (CMS, 6.6 TeV at 137 fb⁻¹) is a limit on a different
        particle. What applies is the model-independent σ·B·A limit read at this width — and the
        angular distribution, which needs no branching ratio at all.
        <span class="chip ver">verified</span> collider_dictionary.py, archived.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Where the CERN programme meets this</h2>
        <div class="verdict stable" id="clTeeth"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:10px" id="clCern">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The ratio at the recast's own bins</h2>
        <p class="note" style="margin:0 0 10px">F(t)² at the (M_jj, χ) grid the archived recast
        used — the numbers a fit would want, for this content's 1/R₅, computed live.</p>
        <div style="overflow-x:auto"><table><thead><tr id="clBinsHead"></tr></thead>
          <tbody id="clBins"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="clBinsNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>One function, three regimes</h2>
        <canvas id="clFF" width="720" height="300"></canvas>
        <div class="legend">
          <span><i style="background:var(--blue)"></i>spacelike: πa·coth(πa) — the distortion</span>
          <span><i style="background:var(--rust)"></i>timelike: πb·cot(πb) — poles = resonances</span>
          <span><i style="background:var(--amber)"></i>the contact expansion about zero</span>
        </div>
        <div class="note" style="margin-top:9px" id="clFFNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The distortion, over the measurement's own plane</h2>
        <canvas id="clRelief" width="720" height="360"></canvas>
        <div class="rowm" style="margin-top:8px">
          <span class="note" style="flex:1"><b>drag</b> moves the probe · <b>shift-drag</b> turns ·
          <b>wheel</b> raises — or type it:</span>
          <span class="nm" style="flex:0">M_jj</span>
          <input id="clMjj" type="text" size="5" style="font-family:var(--mono);font-size:13px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;width:62px">
          <span class="nm" style="flex:0">χ</span>
          <input id="clChi" type="text" size="5" style="font-family:var(--mono);font-size:13px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;width:62px">
        </div>
        <div class="verdict stable" id="clProbe" style="margin-top:10px"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px" id="clReliefNote">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    COLL_P.view = COLL_P.view || surfaceView({ az: -0.58, el: 0.72, h: 0.55, n: 40 });
    const canvas = $("clRelief");
    const attach = attachSurface(canvas, COLL_P.view, {
      mode: "move",
      width: () => canvas.clientWidth || 720,
      height: () => 360,
      pick: (px, py) => (COLL_P.field && COLL_P.proj
        ? pickSurface(COLL_P.proj, COLL_P.field, COLL_P.view.n, px, py) : null),
      onPick: (p) => { COLL_P.cur = p; this._relief(this._lastH); },
      onView: () => this._relief(this._lastH),
    });
    attach.mode("move");
    /* the typed probe: the drag is for looking, the keyboard is for working */
    const commit = () => {
      const m = parseFloat($("clMjj").value), c = parseFloat($("clChi").value);
      if (Number.isFinite(m)) COLL_P.cur[0] = Math.min(1, Math.max(0, (m - 2) / 6));
      if (Number.isFinite(c)) COLL_P.cur[1] = Math.min(1, Math.max(0, (c - 1) / 15));
      this._relief(this._lastH);
    };
    $("clMjj").onchange = commit;
    $("clChi").onchange = commit;
    $("clR5").onchange = () => {
      const x = parseFloat($("clR5").value);
      COLL_P.override = Number.isFinite(x) && x > 0.3 && x < 100 ? x : null;
      if (COLL_P.override === null) $("clR5").value = "";
      ctx.refresh();
    };
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    const dj = v.get("dijet");
    const C = ctx.DATA.collider;

    /* the archived branch table, always shown -- it is about the lattice, not this model */
    $("clBranches").innerHTML = C.branches.map((b) =>
      `<tr><td style="font-size:12.5px">${b.name}</td><td class="num">${b.invR5_TeV.toFixed(2)}</td>` +
      `<td class="num">${b.alphas.toFixed(4)}</td><td class="num">${b.GoverM.toFixed(3)}</td>` +
      `<td class="num">${b.Gamma_GeV} GeV</td></tr>`).join("");

    this._teeth(C);

    /* THE EFFECTIVE SCALE: the model's own 1/R5 unless a probe value is typed -- a reader with
     * no stake in this content can ask for the curves at THEIR mass, and the labels say so. */
    const base = dj.status === "unknown" ? null : dj.value;
    const eff = COLL_P.override !== null
      ? { ...coloronOf(COLL_P.override * 1000), coupling_ratio: Math.SQRT2,
          lambda8_GeV: lambda8Of(COLL_P.override * 1000),
          eft_coefficient: -(Math.PI ** 2 / 3) / COLL_P.override ** 2, probe: true }
      : base;

    if (eff === null) {
      $("clLead").innerHTML = `This content does not break electroweak symmetry, so there is no ` +
        `scale and nothing for a collider to bound — <b>type a 1/R₅ below to explore anyway</b>. ` +
        `<span style="color:var(--ink2)">${dj.reason}</span>`;
      $("clDict").innerHTML = "";
      this._lastH = null;
      this._ff(null, C);
      this._relief(null);
      $("clBinsHead").innerHTML = "";
      $("clBins").innerHTML = "";
      $("clBinsNote").textContent = "No scale, no table.";
      return;
    }
    const h = eff;
    this._lastH = h;

    $("clLead").innerHTML =
      (h.probe
        ? `At the <b>probe scale you typed — 1/R₅ = ${(h.M_GeV / 1000).toFixed(2)} TeV, not this ` +
          `model's${base ? ` (its own is ${(base.M_GeV / 1000).toFixed(2)} TeV)` : ""}</b> — the ` +
          `tower's first rung sits at `
        : `For this content the tower's first rung sits at `) +
      `<b>M₁ = ${(h.M_GeV / 1000).toFixed(2)} TeV</b> ` +
      `with <b>Γ/M = ${h.GoverM.toFixed(3)}</b> (Γ = ${Math.round(h.Gamma_GeV)} GeV) — a wide ` +
      `colour octet coupled at exactly √2·g_s, with <b>no free parameter anywhere</b>. Below the ` +
      `resonance the whole tower is the contact scale <b>Λ₈ = ${(h.lambda8_GeV / 1000).toFixed(2)} ` +
      `TeV</b>. ` + (h.probe
        ? `A probe carries no anchor band: it is your number, run through their theorems.`
        : `Every GeV here is <span class="chip mea">measured</span> and carries the anchor band.`);

    $("clDict").innerHTML =
      `<div class="pair">
         <div class="stat"><div class="k">M₁ = 1/R₅</div>
           <div class="v">${(h.M_GeV / 1000).toFixed(2)} TeV</div>
           <div class="s">no Wilson-line shift: colour commutes with ⟨W⟩</div></div>
         <div class="stat"><div class="k">Γ(G⁽ⁿ⁾→qq̄)/M</div>
           <div class="v">${h.GoverM.toFixed(3)}</div>
           <div class="s">= 2α_s(M), α_s = ${h.alphas.toFixed(4)} at one loop</div></div>
       </div>`;

    this._ff(h, C);
    this._relief(h);
    this._bins(h, C);
  },

  /* ---- the working table: the ratio at the archived recast's own grid ---------------------- */
  _bins(h, C) {
    const $ = (id) => document.getElementById(id);
    const invR5TeV = h.M_GeV / 1000;
    const MJ = C.bins.mjj_TeV, CH = C.bins.chi;
    /* Greek uppercases: a bare chi in a <th> becomes a Latin X under text-transform */
    $("clBinsHead").innerHTML = `<th><span class="lc">χ</span> \\ M_jj</th>` +
      MJ.map((m) => `<th class="num">${m.toFixed(1)}</th>`).join("");
    $("clBins").innerHTML = CH.map((c) =>
      `<tr><td class="num">${c}</td>` + MJ.map((m) => {
        const r = chiRatio(m, c, invR5TeV);
        return `<td class="num"${r > 2 ? ' style="color:var(--rust);font-weight:650"'
                                       : r > 1.2 ? ' style="color:var(--amber)"' : ""}>${r.toFixed(3)}</td>`;
      }).join("") + `</tr>`).join("");
    $("clBinsNote").innerHTML =
      `Tree level, t-channel-only subprocess, at 1/R₅ = ${invR5TeV.toFixed(2)} TeV. Amber above ` +
      `1.2, rust above 2. The grid is ${C.bins.source}; the χ = 1.5 columns at 9.09 and ` +
      `3.97 TeV are held to the archived closed-form run by the harness, so this table cannot ` +
      `drift from the record it extends. M_jj above the first rung is ON the tower — there the ` +
      `s-channel needs its width back and this table's t-channel ratio is the conservative part.`;
  },

  /* ---- the quoted record, and the programme ------------------------------------------------ */
  _teeth(C) {
    const $ = (id) => document.getElementById(id);
    const t = C.teeth;
    $("clTeeth").className = "verdict stable";
    $("clTeeth").innerHTML =
      `<b>The recast, read at the teeth: Δχ² = ${t.min_dchi2} at the top tooth — against a ` +
      `threshold of ${t.threshold}</b>` +
      `<span>CMS's dijet angular data at 137 fb⁻¹, recast through this dictionary and read at ` +
      `the per-rung ceilings: the least-constrained tooth (8D = 1, ${t.at_TeV} TeV) returns ` +
      `Δχ² = ${t.min_dchi2}; the next tooth ${t.next_tooth_dchi2}; the escape branch's best, ` +
      `3.97 TeV, ${t.escape_dchi2}. <b>And the margin is not ${t.min_dchi2} against ` +
      `${t.threshold} — it is the integrality of 8D</b>: a quantum half as large would put the ` +
      `top tooth at ${t.half_quantum.TeV} TeV, where the same recast returns ` +
      `Δχ² = ${t.half_quantum.dchi2} — <em>below</em> the Standard Model. Halve the quantum and ` +
      `the conclusion changes sign. <span class="chip ver">quoted</span> from the published ` +
      `Part VII, eq. (46) there — the profiling recipe is make_fig_chi2.py's and is not ` +
      `re-derived here.</span>`;
    $("clCern").innerHTML =
      `<b>What makes this a target and not a band:</b> the coupling is saturated at √2·g_s by ` +
      `the localisation itself and the width is fixed at 2α_s — a recast needs no coupling scan, ` +
      `because the model supplies a <b>point</b>. And the angular prediction is a closed form in ` +
      `(M_jj, χ), the measurement's own binning, with no branching ratio in it.<br><br>` +
      `<b>Where each machine bites:</b> the escape branch (3.97 TeV) sits where Run 2 already has ` +
      `real sensitivity — and the recast above prices it ${C.teeth.escape_dchi2} in Δχ². The ` +
      `9–10 TeV teeth do not: producing a 9 TeV resonance at √s = 13–14 TeV runs out of partons, ` +
      `and the Snowmass dijet projections put the HL-LHC coloron reach near 7.8 TeV ` +
      `(arXiv:2202.03389) — <b>the top teeth outlive the LHC in the resonant channel</b>. What ` +
      `keeps biting there is this page's other object: the spacelike form factor, whose contact ` +
      `tail Λ₈ = ${C.lambda8_TeV.measured_mh} TeV sits just above the Run-2 contact-interaction ` +
      `limits (12.8–17.5 TeV, CMS dijet angular). An FCC-hh, with coloron reach near 45 TeV in ` +
      `the same projections, covers the entire comb. <span class="chip live">references</span> ` +
      `external projections cited, not computed here.`;
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, hh) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = hh * d; c.style.height = hh + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, hh];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  /* One analytic function: coth to the left of zero, cot to the right, poles at integers. */
  _ff(h, C) {
    const [g, W, H] = this._fit(document.getElementById("clFF"), 300);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const L = 46, Rp = 14, T = 14, B = 34, iw = W - L - Rp, ih = H - T - B;
    const X0 = -2.2, X1 = 3.4, YL = -6, YH = 10;
    const X = (x) => L + (x - X0) / (X1 - X0) * iw;
    const Y = (y) => T + ih - (y - YL) / (YH - YL) * ih;

    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    for (const y of [-4, -2, 0, 2, 4, 6, 8]) {
      g.beginPath(); g.moveTo(L, Y(y) + .5); g.lineTo(L + iw, Y(y) + .5); g.stroke();
    }
    g.strokeStyle = "#cfd8e0";
    g.beginPath(); g.moveTo(X(0) + .5, T); g.lineTo(X(0) + .5, T + ih); g.stroke();
    g.beginPath(); g.moveTo(L, Y(1) + .5); g.lineTo(L + iw, Y(1) + .5); g.stroke();
    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "center"; g.textBaseline = "top";
    for (const x of [-2, -1, 0, 1, 2, 3]) g.fillText(String(x), X(x), T + ih + 6);
    g.fillText("R₅·√|q²|  —  spacelike ← 0 → timelike, in units of the rung", L + iw / 2, T + ih + 19);

    /* the resonances: the poles of the cotangent, marked before the curve so it crosses them */
    for (const n of [1, 2, 3]) {
      g.strokeStyle = "rgba(181,83,15,.25)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(X(n), T); g.lineTo(X(n), T + ih); g.stroke();
    }

    /* the contact expansion 1 + π²a²/3, drawn about zero on both sides */
    g.strokeStyle = this._css("--amber"); g.lineWidth = 1.6; g.setLineDash([4, 3]); g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = -0.8 + 1.6 * i / 60;
      const y = 1 + Math.PI ** 2 * x * x / 3 * (x < 0 ? 1 : -1);
      if (y < YL || y > YH) continue;
      const px = X(x), py = Y(y);
      i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.stroke(); g.setLineDash([]);

    /* spacelike branch */
    g.strokeStyle = this._css("--blue"); g.lineWidth = 2.4; g.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = X0 + (0 - X0) * i / 160;
      const y = formFactorSpace(-x);
      i === 0 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y));
    }
    g.stroke();
    /* timelike branch, segmented at the poles */
    g.strokeStyle = this._css("--rust"); g.lineWidth = 2;
    for (let n = 0; n <= 3; n++) {
      g.beginPath();
      let started = false;
      for (let i = 1; i < 120; i++) {
        const b = n + i / 120;
        if (b > X1) break;
        const y = formFactorTime(b);
        if (y < YL || y > YH) { started = false; continue; }
        started ? g.lineTo(X(b), Y(y)) : g.moveTo(X(b), Y(y));
        started = true;
      }
      g.stroke();
    }
    g.fillStyle = this._css("--ink3"); g.font = "10px " + this._css("--mono");
    g.textAlign = "left"; g.textBaseline = "top";
    g.fillText("F(q²): the whole coloured tower, as one form factor on the gluon", L + 2, T + 2);

    document.getElementById("clFFNote").innerHTML =
      `Its expansion about zero returns the contact operator — coefficient −π²R₅²/3` +
      (h ? ` = ${h.eft_coefficient.toFixed(3)} TeV⁻², i.e. Λ₈ = ${(h.lambda8_GeV / 1000).toFixed(2)} TeV ` +
           `for this content` : ``) +
      ` — so Λ₈ is the first term of F, not an independent statement. The poles at b = 1, 2, 3 ` +
      `<b>are</b> the resonances: nobody put them in. And spacelike there is no width and none is ` +
      `allowed — the 2.55 % width correction that once stood in the paper was withdrawn, its ` +
      `giveaway being that it tends to 1/(1+(2α_s)²) = ${C.resummation.width_shift_at_zero.toFixed(3)} ` +
      `as t → 0, which no self-energy below threshold may do. ` +
      `<span class="chip thm">theorem</span> Euler's identity on equal residues; ` +
      `<span class="chip ver">verified</span> kk_resummation.py, archived.`;
  },

  /* The relief: ratio-to-QCD F(t)² over (M_jj, χ) at this content's 1/R₅ -- the plane the
   * measurement is binned in, under the house mouse. */
  _relief(h) {
    const canvas = document.getElementById("clRelief");
    if (!canvas) return;
    const [g, W, H] = this._fit(canvas, 360);
    g.fillStyle = "#141d26"; g.fillRect(0, 0, W, H);
    const $ = (id) => document.getElementById(id);
    if (!h) {
      g.fillStyle = "rgba(190,210,222,.8)"; g.font = "12px ui-monospace,monospace";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("no scale, no distortion", W / 2, H / 2);
      $("clProbe").innerHTML = `<b>—</b><span>Load a content that breaks the symmetry.</span>`;
      $("clReliefNote").textContent = "—";
      return;
    }
    const invR5TeV = h.M_GeV / 1000;
    const MJJ = [2, 8], CHI = [1, 16], NX = 72, NY = 44;
    const mjjOf = (x) => MJJ[0] + (MJJ[1] - MJJ[0]) * x;
    const chiOf = (y) => CHI[0] + (CHI[1] - CHI[0]) * y;

    const key = invR5TeV.toFixed(4);
    if (COLL_P.key !== key) {
      const vals = new Float64Array((NX + 1) * (NY + 1));
      for (let j = 0; j <= NY; j++)
        for (let i = 0; i <= NX; i++)
          vals[j * (NX + 1) + i] = chiRatio(mjjOf(i / NX), chiOf(j / NY), invR5TeV);
      COLL_P.field = heightField(vals, NX, NY);
      COLL_P.key = key;
    }
    const F2 = COLL_P.field;

    COLL_P.proj = paintSurface(g, COLL_P.view, [1.6, 1], F2, {
      levels: [0.15, 0.35, 0.55, 0.75, 0.92],
      frame: { x: 10, y: 10, w: W - 20, h: H - 40 },
    });
    surfaceAxisLabels(g, COLL_P.proj, ["M_jj →", "χ →"]);

    const [cx, cy] = COLL_P.cur;
    surfaceStem(g, COLL_P.proj, F2, cx, cy, { colour: this._css("--amber") });

    const mjj = mjjOf(cx), chi = chiOf(cy);
    const ratio = chiRatio(mjj, chi, invR5TeV);
    const absT = mjj * mjj / (1 + chi);
    const mI = $("clMjj"), cI = $("clChi");
    if (mI && document.activeElement !== mI) mI.value = mjj.toFixed(2);
    if (cI && document.activeElement !== cI) cI.value = chi.toFixed(1);
    $("clProbe").className = "verdict " + (ratio > 1.5 ? "breaks" : "stable");
    $("clProbe").innerHTML =
      `<b>At M_jj = ${mjj.toFixed(2)} TeV, χ = ${chi.toFixed(1)}: the tower multiplies QCD by ` +
      `${ratio.toFixed(2)}</b><span>|t| = M_jj²/(1+χ) = ${absT.toFixed(2)} TeV², ` +
      `a = R₅√|t| = ${(Math.sqrt(absT) / invR5TeV).toFixed(3)}, F = ${Math.sqrt(ratio).toFixed(3)} — ` +
      `the exact tree-level ratio on a t-channel-only subprocess, no truncation, no width, no ` +
      `branching ratio. <span class="chip thm">theorem</span> given 1/R₅, which is ` +
      `<span class="chip mea">measured</span>.</span>`;
    $("clReliefNote").innerHTML =
      `The surface is F(t)² at this content's 1/R₅ = ${invR5TeV.toFixed(2)} TeV, over exactly the ` +
      `two variables CMS bins its angular measurement in. Low χ at high M_jj is the deep-|t| ` +
      `corner where the tower bites hardest — which is why the distortion survives below the ` +
      `first resonance, and why no BR(G→jj) is needed to test it. ` +
      `<span class="chip ver">verified</span> against the archived closed-form ratios by the harness.`;
  },
};

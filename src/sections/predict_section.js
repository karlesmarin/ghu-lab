/* predict_section.js — "Simulator": the model on the builder, turned into the numbers a detector
 * measures, each beside its measured partner, and drawn the way a search result is read.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT IT SHOWS.  The minimiser's vacuum (or a probe the reader moves), the W and 1/R from the
 * measured m_W, the Higgs mass from the curvature through HHKY's eq. (22), sin²θ_W from the
 * embedding against the Standard-Model running, every field's tower in GeV, and the masses the
 * Wilson line gives the Standard-Model fermions.  Two pictures: the towers as a landscape in
 * three dimensions the reader can turn (`tower3d.js`, shared with the spectrum section), with the
 * measured masses as lines and the CMS coloron bound as a plane; and a mass axis drawn as a
 * search reach plot, with the excluded region shaded and the predicted states as ticks.
 *
 * WHAT IT IS NOT.  No event is simulated and no distribution is invented: every mark is a
 * predicted mass or a published bound, and the shading says which bound and under which
 * hypothesis.  A picture that looked like data and was not would be the one dishonest thing
 * on this site.
 *
 * TWO THINGS THE FIRST DEPLOYMENT TAUGHT.  The canvases were 720 px wide in a half-width card
 * and overflowed; they size to their card now.  And g₄ scales only the Higgs mass — the towers
 * are fixed by m_W — so a reader moving the slider and watching the landscape saw nothing move;
 * the note says what g₄ touches and the predicted m_H is drawn in the landscape as well.
 *
 * Edited BY HAND.
 */
const PRED_S = { g4: null, probe: false, theta: null, az: 0.75, el: 0.55 };

const PRED_SECTION = {
  id: "predict",
  label: "Simulator",
  paper: "HHKY 2004 eq. (22) · CCP 2005 · PDG 2024/2025 · CMS JHEP 05 (2020) 033",
  ready: true,
  modules: [],

  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    return `SU(${b.N}) · S¹/Z₂ · [${[b.nPP, b.nPM, b.nMP, b.nMM]}] · the model on the builder, predicted`;
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">The model on the <b>SU(N) builder</b>, taken to its vacuum and turned into the
    numbers a detector measures: the compactification scale from the measured W mass, the Higgs
    mass from the curvature of the potential, sin²θ_W from the embedding against the running of
    the data, every field's tower in GeV, and the masses the Wilson line gives the Standard-Model
    fermions. Each number sits beside its measured partner and its source.${helpMark("against-the-data")}</p>
    <details class="note" style="margin-top:9px"><summary style="cursor:pointer"><b>How to use this section</b></summary>
      <ol style="margin:8px 0 0 18px;line-height:1.6">
        <li>Load a model in <b>SU(N) builder</b>: the boundary condition [n₊₊, n₊₋, n₋₊, n₋₋] and the bulk
            fields with their ηη′. This section reads that model and edits nothing.</li>
        <li><b>At the minimum</b> uses the vacuum the minimiser found (a grid for one or two phases, restarts
            above). <b>Probe</b> lets you move the Wilson-line phase by hand to see how every number responds.</li>
        <li><b>g₄</b> is the bulk gauge coupling. It scales the Higgs mass only — m_H ∝ g₄ — and nothing else,
            because every other mass is fixed by the measured m_W. Default: the SU(2) coupling run to 1/R.</li>
        <li>Read the table: <i>predicted</i> beside <i>measured</i>, with the note saying the hypothesis each
            comparison rests on. A model with its vacuum at a symmetric point has no W and sets no scale.</li>
        <li>Drag the landscape to turn it; the sliders do the same. The reach plot is a mass axis with the
            CMS exclusion shaded.</li>
      </ol>
      <p style="margin:8px 0 0"><b>Nothing here is simulated data.</b> Every mark is a predicted mass or a
      published bound. The anchor — Haba–Hosotani–Kawamura–Yamashita's vacuum at a = 0.058 and
      m_H R/g₄ = 0.031 — is recomputed by the harness every build.</p>
    </details>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>Parameters</h2>
        <div class="rowm"><span class="nm">g₄, the bulk coupling</span>
          <input type="range" id="prG4" min="0.40" max="1.20" step="0.01" style="flex:1">
          <span class="num" id="prG4v" style="width:56px">—</span>
          <button class="ghost" id="prG4Reset" style="width:auto;padding:2px 8px">= g₂(1/R)</button></div>
        <div class="note" style="margin:4px 0 8px">g₄ scales the Higgs mass only: m_H ∝ g₄. The towers and 1/R are fixed by m_W.</div>
        <div class="rowm"><span class="nm">Wilson line</span>
          <button class="st" id="prAtMin" style="width:auto;padding:3px 10px">at the minimum</button>
          <button class="ghost" id="prProbe" style="width:auto;padding:3px 10px">probe</button>
          <input type="range" id="prTheta" min="0.005" max="0.995" step="0.005" style="flex:1">
          <span class="num" id="prThetaV" style="width:64px">—</span></div>
        <div class="note" style="margin-top:8px" id="prParamNote">—</div>
      </div>
      <div class="card" style="margin-top:18px">
        <h2>Prediction against measurement</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>observable</th><th>predicted</th>
          <th>measured</th><th>note</th></tr></thead><tbody id="prTable"></tbody></table></div>
        <details class="note" style="margin-top:9px"><summary style="cursor:pointer"><b>Assumptions and sources</b></summary>
          <div id="prAssume" style="margin-top:6px">—</div></details>
      </div>
      <div class="card" style="margin-top:18px">
        <h2>Fermion masses from the Wilson line${helpMark("sm-cell")}</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>field</th><th>piece</th><th class="num">components</th>
          <th>at the vacuum</th><th>measured (heaviest generation)</th></tr></thead><tbody id="prYuk"></tbody></table></div>
        <details class="note" style="margin-top:9px"><summary style="cursor:pointer"><b>How to read this table</b></summary>
          <div style="margin-top:6px">Each Standard-Model field is a massless piece at the symmetric point the vacuum sits
          next to. At the vacuum some of its components move off zero: a component sharing an index with the rotated
          pair sits at t/(2R), which is m_W when the W is a letter⊗pair vector; a symmetric tensor's diagonal on the
          pair sits at 2m_W; a component with both indices in the pair, opposite signs, stays massless. This is the
          tree-level, pure-bulk answer — no bulk masses, no brane mixing — and it is what Cacciapaglia–Csaki–Park
          (hep-ph/0510366) state: "m_q → m_W" for a fundamental, "at tree level m_t = 2m_W" from a larger
          representation. The gap to the measured masses is the Yukawa problem of flat gauge–Higgs unification, in
          numbers. One generation only: a bulk field gives every copy the same mass.</div></details>
        <div class="note" style="margin-top:6px" id="prYukNote">—</div>
      </div>
    </div>
    <div>
      <div class="card">
        <h2>The towers, in GeV${helpMark("at-the-minimum")}</h2>
        <div class="rowm"><span class="nm">turn</span>
          <input type="range" id="prAz" min="0" max="6.28" step="0.02" style="flex:1">
          <span class="nm">tilt</span>
          <input type="range" id="prEl" min="0.15" max="1.4" step="0.02" style="flex:1"></div>
        <canvas id="prTower" style="margin-top:8px;cursor:grab;max-width:100%"></canvas>
        <div class="note" id="prTowerLegend" style="margin-top:4px;line-height:1.7">—</div>
        <details class="note" style="margin-top:6px"><summary style="cursor:pointer"><b>How to read the landscape</b></summary>
          <div id="prTowerNote" style="margin-top:6px">—</div></details>
      </div>
      <div class="card" style="margin-top:18px">
        <h2>The mass axis, read like a search</h2>
        <canvas id="prReach" style="margin-top:4px;max-width:100%"></canvas>
        <details class="note" style="margin-top:6px"><summary style="cursor:pointer"><b>How to read the axis</b></summary>
          <div id="prReachNote" style="margin-top:6px">—</div></details>
      </div>
    </div>
  </div>`,

  _content() {
    return { gauge: true,
             bulk: Object.entries(SUN5D_S.bulk).filter(([, m]) => m).map(([k, m]) => {
               const [rep, eta, kind] = k.split("|");
               return { rep, eta: +eta, kind, multiplicity: m };
             }) };
  },

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("prG4").oninput = (e) => { PRED_S.g4 = +e.target.value; ctx.refresh(); };
    $("prG4Reset").onclick = () => { PRED_S.g4 = null; ctx.refresh(); };
    $("prAtMin").onclick = () => { PRED_S.probe = false; ctx.refresh(); };
    $("prProbe").onclick = () => { PRED_S.probe = true; ctx.refresh(); };
    $("prTheta").oninput = (e) => { PRED_S.theta = +e.target.value; PRED_S.probe = true; ctx.refresh(); };
    tower3dControl($("prTower"), PRED_S, () => this._tower(), $("prAz"), $("prEl"));
    window.addEventListener("resize", () => { if (this._P) { this._tower(); this._reach(); } });
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    const b = sun5dBlocks(SUN5D_S.blocks), content = this._content();
    const terms = sun5dTerms(b, content);
    let min = null;
    if (b.phases >= 1 && b.phases <= 2) min = sun5dMinimum(terms, b.phases, { grid: 240, windings: 200 });
    else if (b.phases > 2) min = sun5dMinimumRestarts(terms, b.phases, { restarts: 16, windings: 200 });
    let theta = min ? min.theta : [];
    if (PRED_S.probe && b.phases) {
      const t = PRED_S.theta ?? 0.1;
      theta = Array.from({ length: b.phases }, () => t);
    }
    $("prTheta").value = theta.length ? theta[0] : 0.1;
    $("prThetaV").textContent = theta.length ? theta.map((x) => x.toFixed(4)).join(", ") : "no phase";
    $("prAtMin").className = PRED_S.probe ? "ghost" : "st";
    $("prProbe").className = PRED_S.probe ? "st" : "ghost";
    $("prAz").value = ((PRED_S.az % 6.28) + 6.28) % 6.28; $("prEl").value = PRED_S.el;

    const P = predictModel(b, content, theta, terms);
    if (P.located && PRED_S.g4 !== null) {
      /* the reader's g₄ replaces g₂(1/R): every scalar mass scales with it */
      const k = PRED_S.g4 / P.run.g2;
      P.scalarMassesGeV = (P.scalarMassesGeV || []).map((m) => (m === null ? null : m * k));
      P.mHGeV = P.mHGeV === null ? null : P.mHGeV * k;
      P.assumptions[0] = `g₄ = ${PRED_S.g4.toFixed(2)} set by hand (g₂(1/R) would be ${P.run.g2.toFixed(4)})`;
    }
    $("prG4").value = P.located ? (PRED_S.g4 ?? P.run.g2) : 0.65;
    $("prG4v").textContent = P.located ? (PRED_S.g4 ?? P.run.g2).toFixed(3) : "—";
    this._P = P; this._b = b; this._theta = theta; this._content_ = content;
    $("prParamNote").innerHTML = !b.phases
      ? `No Wilson-line phase in this boundary condition: nothing to minimise and no W to set the scale.`
      : (PRED_S.probe ? `<b>Probe:</b> the observables at a phase you chose, not at the minimum — ` +
                        `for seeing how they move.` : `<b>At the minimum</b> the minimiser found` +
                        (min && min.method === "restarts" ? " (restarts, not certified)" : "") + `.`) +
        (min && min.atEdge && !PRED_S.probe ? ` The minimum is a <b>symmetric point</b>: no Hosotani breaking, ` +
                                             `no W, no scale — move the probe to see what a broken vacuum would give.` : ``);
    this._table(P);
    this._yukawa(b, content, theta);
    this._tower();
    this._reach();
  },

  _table(P) {
    const tb = document.getElementById("prTable");
    const rows = predictTable(P);
    tb.innerHTML = rows.map((r) => `<tr><td>${r.what}</td><td><b>${r.predicted}</b></td>` +
      `<td>${r.measured}</td><td class="note">${r.note || ""}</td></tr>`).join("");
    document.getElementById("prAssume").innerHTML = P.located
      ? `<b>Assumptions:</b> ${P.assumptions.join("; ")}. Sources: PDG 2024/2025 for m_W, m_h, m_t, ` +
        `ŝ²_Z; CMS JHEP 05 (2020) 033 for the coloron bound; HHKY hep-ph/0401183 eq. (22) for the ` +
        `Higgs-mass dictionary (anchored: their a = 0.058, m_H R/g₄ = 0.031 reproduced as 0.0583, 0.0306). ` +
        `<span class="chip mea">measured</span>`
      : `<b>Not located:</b> ${P.why}. <span class="chip bad">unknown</span>`;
  },

  _yukawa(b, content, theta) {
    const tb = document.getElementById("prYuk"), note = document.getElementById("prYukNote");
    let Y;
    try { Y = yukawaTable(b, content, theta); } catch (e) { tb.innerHTML = ""; note.textContent = `declined: ${e.message}`; return; }
    if (Y.why) { tb.innerHTML = ""; note.innerHTML = `${Y.why}. <span class="chip bad">unknown</span>`; return; }
    const f = (x) => (Math.abs(x - Math.round(x)) < 1e-6 ? String(Math.round(x)) : x.toFixed(2));
    tb.innerHTML = Y.rows.map((r) => `<tr><td><b>${r.field}</b></td><td class="note">${r.piece}</td>` +
      `<td class="num">${f(r.components)}</td>` +
      `<td>${r.massless > 1e-9 ? `${f(r.massless)} massless` : ""}${r.massless > 1e-9 && r.masses.length ? "; " : ""}` +
      r.masses.map((g) => `${f(g.n)} at <b>${g.GeV.toFixed(1)} GeV</b> (${g.overW.toFixed(2)} m_W)`).join(", ") + `</td>` +
      `<td class="note">${r.measured.map((m) => `${m.name}: ${m.v ? m.v + " GeV" : "0"}`).join(", ")}</td></tr>`).join("");
    const heavy = Y.rows.flatMap((r) => r.masses.map((g) => g.overW));
    note.innerHTML = `Tree level, pure bulk, one generation; 1/R = ${(Y.invRGeV / 1000).toFixed(3)} TeV. ` +
      (heavy.length ? `Every massive component sits at ${[...new Set(heavy.map((x) => x.toFixed(2)))].join(" or ")} × m_W: ` +
                      `the Yukawa problem of flat gauge–Higgs unification, as a number.` : `No component of the cell is lifted by this vacuum.`) +
      ` <span class="chip thm">theorem</span>`;
  },

  /* ---------------------------------------------------------------- the towers, in 3D */

  _tower() {
    const P = this._P; if (!P) return;
    const c = document.getElementById("prTower");
    const note = document.getElementById("prTowerNote");
    if (!P.located) {
      const d = window.devicePixelRatio || 1; c.width = 300 * d; c.height = 60 * d; c.style.width = "300px"; c.style.height = "60px";
      const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = "#888"; g.font = "13px sans-serif"; g.fillText("no scale set at this point", 10, 36);
      note.textContent = "The towers need a W to be in GeV."; return;
    }
    const lines = [{ m: EXPERIMENT.m_W.value, label: "m_W", colour: "#3a7" }, { m: EXPERIMENT.m_h.value, label: "m_h", colour: "#37c" },
                   { m: EXPERIMENT.m_t.value, label: "m_t", colour: "#a63" }];
    if (P.mHGeV) lines.push({ m: P.mHGeV, label: `m_H predicted ${P.mHGeV.toFixed(0)}`, colour: "#15a" });
    tower3dDraw(c, P.ladder.rows, { scale: P.invRGeV, unit: "GeV", lines, az: PRED_S.az, el: PRED_S.el,
                                    plane: { m: EXPERIMENT.dijet_coloron.value, label: "CMS 6.6 TeV" }, floor: 30 });
    document.getElementById("prTowerLegend").innerHTML = tower3dLegend(P.ladder.rows);
    note.innerHTML = `Columns are fields — numbered on the floor, named in the legend under the picture — ` +
      `depth is the Kaluza–Klein level, height is mass on a log scale. ` +
      `Dashed lines, labelled down the right edge: the measured m_W, m_h, m_t, and the predicted m_H (which is what g₄ moves). The red plane ` +
      `is the CMS coloron bound at 6.6 TeV — it cuts a coloured vector tower only if colour lives in the bulk. ` +
      `A big dot at the floor is a massless state. 1/R = <b>${(P.invRGeV / 1000).toFixed(3)} TeV</b>; drag to turn.`;
  },

  /* ---------------------------------------------------------------- the reach plot */

  _reach() {
    const P = this._P; if (!P) return;
    const c = document.getElementById("prReach"), d = window.devicePixelRatio || 1;
    /* the width comes from the card, so a half-width column does not overflow — and the harness
     * renders every section into a document with no layout, where clientWidth is undefined */
    const avail = c.parentElement && c.parentElement.clientWidth ? c.parentElement.clientWidth - 8 : 720;
    const W = Math.max(280, Math.min(760, avail)), Hh = 200;
    c.width = W * d; c.height = Hh * d; c.style.width = W + "px"; c.style.height = Hh + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, Hh);
    const note = document.getElementById("prReachNote");
    if (!P.located) { note.textContent = "No scale set: the axis has nothing to place."; return; }
    const lo = Math.log10(50), hi = Math.log10(20000);
    const X = (m) => 40 + (W - 80) * (Math.log10(Math.max(m, 50)) - lo) / (hi - lo);
    const base = Hh - 40;
    const bound = EXPERIMENT.dijet_coloron.value;
    g.fillStyle = "rgba(220,60,60,.12)"; g.fillRect(40, 30, X(bound) - 40, base - 30);
    g.strokeStyle = "rgba(220,60,60,.7)"; g.beginPath(); g.moveTo(X(bound), 30); g.lineTo(X(bound), base); g.stroke();
    g.fillStyle = "#c33"; g.font = "11px sans-serif"; g.fillText("excluded for colour-octet vectors (CMS, 6.6 TeV)", 46, 44);
    g.strokeStyle = "#888"; g.beginPath(); g.moveTo(40, base); g.lineTo(W - 40, base); g.stroke();
    g.fillStyle = "#666"; g.font = "10.5px sans-serif";
    for (const m of [100, 200, 500, 1000, 2000, 5000, 10000]) { g.beginPath(); g.moveTo(X(m), base); g.lineTo(X(m), base + 5); g.stroke(); g.fillText(m >= 1000 ? `${m / 1000} TeV` : `${m}`, X(m) - 12, base + 18); }
    /* THE MEASURED MASSES ARE LABELLED ABOVE THE AXIS AND THE PREDICTIONS BELOW IT, and both are
     * pushed apart when they collide: on a log axis from 50 GeV to 20 TeV, m_W, m_h and m_t sit
     * within 40 px of each other and their labels overlapped on the first deployment. */
    const place = (used, x, w = 34) => { let p = x; for (let i = 0; i < 40; i++) { if (!used.some((q) => Math.abs(q - p) < w)) break; p += 6; } used.push(p); return p; };
    const usedTop = [];
    for (const [m, lab, col] of [[EXPERIMENT.m_W.value, "m_W", "#3a7"], [EXPERIMENT.m_h.value, "m_h", "#37c"], [EXPERIMENT.m_t.value, "m_t", "#a63"]]) {
      g.strokeStyle = col; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(m), 58); g.lineTo(X(m), base); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.fillText(lab, place(usedTop, X(m) - 9, 26), 54);
    }
    const invR = P.invRGeV;
    const usedKK = [];
    for (let k = 1; k <= 3; k++) { g.strokeStyle = "#c84"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(k * invR), base); g.lineTo(X(k * invR), base - 64); g.stroke(); g.fillStyle = "#c84"; g.fillText(`${k}/R`, place(usedKK, X(k * invR) - 8, 22), base - 68); }
    /* the bulk fields' first massive states: numbered, with the legend under the canvas */
    const fields = P.confront.rows.filter((r) => r.firstMassiveGeV !== null && !/^A_μ/.test(r.field));
    const usedF = [];
    fields.forEach((r, i) => {
      const col = /^A_y/.test(r.field) ? "#37c" : "#5a5";
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(X(r.firstMassiveGeV), base); g.lineTo(X(r.firstMassiveGeV), base - 34); g.stroke();
      g.fillStyle = col; g.font = "11px sans-serif"; g.fillText(String(i + 1), place(usedF, X(r.firstMassiveGeV) - 3, 11), base - 38);
    });
    if (P.mHGeV) { g.strokeStyle = "#15a"; g.lineWidth = 3; g.beginPath(); g.moveTo(X(P.mHGeV), base); g.lineTo(X(P.mHGeV), 78); g.stroke(); g.fillStyle = "#15a"; g.fillText(`m_H pred ${P.mHGeV.toFixed(0)}`, Math.min(W - 120, X(P.mHGeV) + 4), 76); }
    note.innerHTML = `A log mass axis from 50 GeV to 20 TeV. Above the axis, the measured masses (dashed). Below it, ` +
      `orange: the Kaluza–Klein levels of the unbroken vectors at k/R; numbered ticks: the first massive state of each ` +
      `bulk field and of A_y — ` + fields.map((r, i) => `<b>${i + 1}</b> ${r.field}`).join(" · ") +
      `. The thick blue line is the predicted Higgs mass. The shaded region is what CMS excludes for a colour-octet ` +
      `vector, and it applies to the orange ticks only if colour is in the bulk. <b>No event is simulated.</b>`;
  },

  texExport() {
    const P = this._P;
    const values = {};
    if (P && P.located) {
      values.inverse_radius_GeV = val(+P.invRGeV.toFixed(1), { status: STATUS.MEASURED, source: "1/R = m_W / (m_W R), m_W PDG 2025" });
      values.higgs_mass_GeV = P.mHGeV === null ? unknown("no positive curvature at this point")
        : val(+P.mHGeV.toFixed(2), { status: STATUS.MEASURED, source: "HHKY hep-ph/0401183 eq. (22), one loop, g4 = g2(1/R)" });
      values.sin2_embedding = P.sin2Embedding === null ? unknown("the cell does not fix Y") : val(P.sin2Embedding, { status: STATUS.THEOREM, source: "the Standard-Model cell at the nearest symmetric point" });
      values.sin2_sm_running_at_invR = val(+P.sin2DataAtInvR.toFixed(5), { status: STATUS.MEASURED, source: "one-loop SM running of PDG 2024 inputs" });
    } else values.scale = unknown(P ? P.why : "not rendered");
    return { card: makeCard({ group: "su3_hy", section: "predict", N: this._b ? this._b.N : null, blocks: SUN5D_S.blocks, bulk: this._content().bulk }, values, { version: VERSION, build: BUILD }),
             mathKeys: [], caption: "The model on the builder at its vacuum, turned into 1/R, the Higgs mass and sin^2 theta_W, each beside the measured number." };
  },
};

/* predict_section.js — "Simulator": the model on the builder, turned into the numbers a detector
 * measures, each beside its measured partner, and drawn the way a search result is read.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT IT SHOWS.  The minimiser's vacuum (or a probe the reader moves), the W and 1/R from the
 * measured m_W, the Higgs mass from the curvature through HHKY's eq. (22), sin²θ_W from the
 * embedding against the Standard-Model running, and every field's tower in GeV.  Two pictures:
 * the towers as a landscape in three dimensions the reader can turn, with the measured masses
 * as lines and the CMS coloron bound as a plane; and a mass axis drawn as a search reach plot,
 * with the excluded region shaded and the predicted states as ticks.
 *
 * WHAT IT IS NOT.  No event is simulated and no distribution is invented: every mark is a
 * predicted mass or a published bound, and the shading says which bound and under which
 * hypothesis.  A picture that looked like data and was not would be the one dishonest thing
 * on this site.
 *
 * Edited BY HAND.
 */
const PRED_S = { g4: null, probe: false, theta: null, az: 0.75, el: 0.55 };

const PRED_SECTION = {
  id: "predict",
  label: "Simulator",
  paper: "HHKY 2004 eq. (22) · PDG 2024/2025 · CMS JHEP 05 (2020) 033",
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
    the data, every field's tower in GeV. Each number sits beside its measured partner and its
    source.${helpMark("against-the-data")}</p>
    <div class="note" style="margin-top:9px"><b>Nothing here is simulated data.</b> Every mark is
    a predicted mass or a published bound; the shading names the bound and the hypothesis it
    rests on. The assumptions are listed under the table, and the anchor — Haba–Hosotani–Kawamura–
    Yamashita's vacuum at a = 0.058 and m_H R/g₄ = 0.031 — is recomputed by the harness.</div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>Parameters</h2>
        <div class="rowm"><span class="nm">g₄, the bulk coupling</span>
          <input type="range" id="prG4" min="0.40" max="1.20" step="0.01" style="flex:1">
          <span class="num" id="prG4v" style="width:56px">—</span>
          <button class="ghost" id="prG4Reset" style="width:auto;padding:2px 8px">= g₂(1/R)</button></div>
        <div class="rowm" style="margin-top:8px"><span class="nm">Wilson line</span>
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
        <div class="note" style="margin-top:9px" id="prAssume">—</div>
      </div>
    </div>
    <div>
      <div class="card">
        <h2>The towers, in GeV${helpMark("at-the-minimum")}</h2>
        <div class="rowm"><span class="nm">turn</span>
          <input type="range" id="prAz" min="0" max="6.28" step="0.02" style="flex:1">
          <span class="nm">tilt</span>
          <input type="range" id="prEl" min="0.15" max="1.4" step="0.02" style="flex:1"></div>
        <canvas id="prTower" width="720" height="420" style="margin-top:8px;cursor:grab"></canvas>
        <div class="note" style="margin-top:6px" id="prTowerNote">—</div>
      </div>
      <div class="card" style="margin-top:18px">
        <h2>The mass axis, read like a search</h2>
        <canvas id="prReach" width="720" height="200" style="margin-top:4px"></canvas>
        <div class="note" style="margin-top:6px" id="prReachNote">—</div>
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
    $("prAz").oninput = (e) => { PRED_S.az = +e.target.value; this._tower(); };
    $("prEl").oninput = (e) => { PRED_S.el = +e.target.value; this._tower(); };
    let drag = null;
    const c = $("prTower");
    c.onmousedown = (e) => { drag = [e.clientX, e.clientY, PRED_S.az, PRED_S.el]; };
    window.addEventListener("mousemove", (e) => {
      if (!drag) return;
      PRED_S.az = drag[2] + (e.clientX - drag[0]) * 0.01;
      PRED_S.el = Math.min(1.4, Math.max(0.15, drag[3] + (e.clientY - drag[1]) * 0.01));
      $("prAz").value = ((PRED_S.az % 6.28) + 6.28) % 6.28; $("prEl").value = PRED_S.el;
      this._tower();
    });
    window.addEventListener("mouseup", () => { drag = null; });
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

    const exp = PRED_S.g4 === null ? EXPERIMENT : EXPERIMENT;
    const P = predictModel(b, content, theta, terms, { exp });
    if (P.located && PRED_S.g4 !== null) {
      /* the reader's g₄ replaces g₂(1/R): every scalar mass scales with it */
      const k = PRED_S.g4 / P.run.g2;
      P.scalarMassesGeV = (P.scalarMassesGeV || []).map((m) => (m === null ? null : m * k));
      P.mHGeV = P.mHGeV === null ? null : P.mHGeV * k;
      P.assumptions[0] = `g₄ = ${PRED_S.g4.toFixed(2)} set by hand (g₂(1/R) would be ${P.run.g2.toFixed(4)})`;
    }
    $("prG4").value = P.located ? (PRED_S.g4 ?? P.run.g2) : 0.65;
    $("prG4v").textContent = P.located ? (PRED_S.g4 ?? P.run.g2).toFixed(3) : "—";
    this._P = P; this._b = b;
    $("prParamNote").innerHTML = !b.phases
      ? `No Wilson-line phase in this boundary condition: nothing to minimise and no W to set the scale.`
      : (PRED_S.probe ? `<b>Probe:</b> the observables at a phase you chose, not at the minimum — ` +
                        `for seeing how they move.` : `<b>At the minimum</b> the minimiser found` +
                        (min && min.method === "restarts" ? " (restarts, not certified)" : "") + `.`) +
        (min && min.atEdge && !PRED_S.probe ? ` The minimum is a <b>symmetric point</b>: no Hosotani breaking, ` +
                                             `no W, no scale — move the probe to see what a broken vacuum would give.` : ``);
    this._table(P);
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

  /* ---------------------------------------------------------------- the towers, in 3D */

  _tower() {
    const P = this._P; if (!P) return;
    const c = document.getElementById("prTower"), d = window.devicePixelRatio || 1;
    const W = 720, Hh = 420;
    c.width = W * d; c.height = Hh * d; c.style.width = W + "px"; c.style.height = Hh + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, Hh);
    const note = document.getElementById("prTowerNote");
    if (!P.located) { g.fillStyle = "#888"; g.font = "13px sans-serif"; g.fillText("no scale set at this point", 20, 40);
                      note.textContent = "The towers need a W to be in GeV."; return; }
    const invR = P.invRGeV;
    const fields = P.ladder.rows;
    const LEVELS = 4;
    const lo = Math.log10(30), hi = Math.log10(Math.max(invR * (LEVELS + 0.5), 8000));
    const y = (m) => (Math.log10(Math.max(m, 30)) - lo) / (hi - lo);
    /* isometric-ish projection */
    const az = PRED_S.az, el = PRED_S.el, cx = W / 2, cy = Hh * 0.62, sc = Math.min(W, Hh) * 0.36;
    const proj = (x, z, h) => {
      const X = (x - 0.5) * 1.6, Z = (z - 0.5) * 1.0;
      const rx = X * Math.cos(az) - Z * Math.sin(az), rz = X * Math.sin(az) + Z * Math.cos(az);
      return [cx + rx * sc, cy + rz * Math.sin(el) * sc - h * Math.cos(el) * sc * 1.1];
    };
    /* floor and the CMS plane */
    g.strokeStyle = "rgba(120,120,120,.35)"; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const a = proj(0, i / 4, 0), b2 = proj(1, i / 4, 0); g.beginPath(); g.moveTo(...a); g.lineTo(...b2); g.stroke();
    }
    const bound = EXPERIMENT.dijet_coloron.value;
    const plane = [proj(0, 0, y(bound)), proj(1, 0, y(bound)), proj(1, 1, y(bound)), proj(0, 1, y(bound))];
    g.fillStyle = "rgba(220,60,60,.10)"; g.strokeStyle = "rgba(220,60,60,.6)";
    g.beginPath(); plane.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.fill(); g.stroke();
    /* measured lines: m_W, m_h, m_t */
    for (const [m, lab, col] of [[EXPERIMENT.m_W.value, "m_W", "#3a7"], [EXPERIMENT.m_h.value, "m_h", "#37c"], [EXPERIMENT.m_t.value, "m_t", "#a63"]]) {
      const a = proj(0, 0, y(m)), b2 = proj(1, 0, y(m));
      g.strokeStyle = col; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(...a); g.lineTo(...b2); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.font = "11px sans-serif"; g.fillText(lab, b2[0] + 4, b2[1] + 3);
    }
    /* the towers: one column per field, one bar per level, drawn back to front */
    const n = fields.length;
    const items = [];
    fields.forEach((r, fi) => {
      const x = n === 1 ? 0.5 : fi / (n - 1);
      /* the first LEVELS masses of the field, from its families */
      const masses = [];
      for (const f of r.families) {
        if (f.x === 0) { for (let k = (f.massless ? 0 : 1); k < LEVELS + 1; k++) masses.push({ m: k * invR, w: k === 0 ? f.massless : f.massless + f.odd }); }
        else if (f.x === 0.5) { for (let k = 0; k < LEVELS; k++) masses.push({ m: (k + 0.5) * invR, w: f.towers }); }
        else { for (let k = 0; k < LEVELS; k++) { masses.push({ m: (k + f.x) * invR, w: f.towers }); masses.push({ m: (k + 1 - f.x) * invR, w: f.towers }); } }
      }
      masses.sort((a, b2) => a.m - b2.m);
      const seen = [];
      for (const s of masses) { if (seen.length >= LEVELS) break; if (s.m > 0 && !seen.some((q) => Math.abs(q.m - s.m) < 1e-6)) seen.push(s); }
      seen.forEach((s, li) => items.push({ x, z: li / Math.max(1, LEVELS - 1), h: y(s.m), m: s.m, field: r.field, w: s.w, massless: r.massless && li === 0 && s.m === 0 }));
      if (r.massless) items.push({ x, z: 0, h: 0, m: 0, field: r.field, w: r.massless, massless: true });
    });
    items.sort((a, b2) => (proj(a.x, a.z, 0)[1] - proj(b2.x, b2.z, 0)[1]));
    for (const it of items) {
      const [x0, y0] = proj(it.x, it.z, 0), [x1, y1] = proj(it.x, it.z, it.h);
      const col = /^A_μ/.test(it.field) ? "#c84" : /^A_y/.test(it.field) ? "#37c" : "#5a5";
      g.strokeStyle = col; g.lineWidth = 3 + Math.min(6, it.w);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(x1, y1, it.massless ? 5 : 3, 0, 6.29); g.fill();
    }
    /* labels at the base */
    g.fillStyle = "#666"; g.font = "10.5px sans-serif";
    fields.forEach((r, fi) => { const x = n === 1 ? 0.5 : fi / (n - 1); const p = proj(x, -0.08, 0); g.fillText(r.field.slice(0, 22), p[0] - 20, p[1] + 12); });
    note.innerHTML = `Columns are fields, depth is the Kaluza–Klein level, height is mass on a log scale ` +
      `from 30 GeV to ${(Math.pow(10, hi) / 1000).toFixed(1)} TeV. Dashed lines: the measured m_W, m_h, m_t. The red plane ` +
      `is the CMS coloron bound at 6.6 TeV — it cuts a coloured vector tower only if colour lives in the bulk. ` +
      `A big dot at the floor is a massless state. 1/R = <b>${(invR / 1000).toFixed(3)} TeV</b>; drag to turn.`;
  },

  /* ---------------------------------------------------------------- the reach plot */

  _reach() {
    const P = this._P; if (!P) return;
    const c = document.getElementById("prReach"), d = window.devicePixelRatio || 1;
    const W = 720, Hh = 200;
    c.width = W * d; c.height = Hh * d; c.style.width = W + "px"; c.style.height = Hh + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, Hh);
    const note = document.getElementById("prReachNote");
    if (!P.located) { note.textContent = "No scale set: the axis has nothing to place."; return; }
    const lo = Math.log10(50), hi = Math.log10(20000);
    const X = (m) => 40 + (W - 80) * (Math.log10(Math.max(m, 50)) - lo) / (hi - lo);
    const base = Hh - 40;
    /* the excluded region for coloured vectors */
    const bound = EXPERIMENT.dijet_coloron.value;
    g.fillStyle = "rgba(220,60,60,.12)"; g.fillRect(40, 30, X(bound) - 40, base - 30);
    g.strokeStyle = "rgba(220,60,60,.7)"; g.beginPath(); g.moveTo(X(bound), 30); g.lineTo(X(bound), base); g.stroke();
    g.fillStyle = "#c33"; g.font = "11px sans-serif"; g.fillText("excluded for colour-octet vectors (CMS, 6.6 TeV)", 46, 44);
    /* axis */
    g.strokeStyle = "#888"; g.beginPath(); g.moveTo(40, base); g.lineTo(W - 40, base); g.stroke();
    g.fillStyle = "#666"; g.font = "10.5px sans-serif";
    for (const m of [100, 200, 500, 1000, 2000, 5000, 10000]) { g.beginPath(); g.moveTo(X(m), base); g.lineTo(X(m), base + 5); g.stroke(); g.fillText(m >= 1000 ? `${m / 1000} TeV` : `${m}`, X(m) - 12, base + 18); }
    /* measured masses */
    for (const [m, lab, col] of [[EXPERIMENT.m_W.value, "m_W", "#3a7"], [EXPERIMENT.m_h.value, "m_h", "#37c"], [EXPERIMENT.m_t.value, "m_t", "#a63"]]) {
      g.strokeStyle = col; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(m), 55); g.lineTo(X(m), base); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.fillText(lab, X(m) - 8, 52);
    }
    /* predicted: the KK levels 1/R, 2/R, 3/R for the unbroken vectors, and the first massive state of every field */
    const invR = P.invRGeV;
    for (let k = 1; k <= 3; k++) { g.strokeStyle = "#c84"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(k * invR), base); g.lineTo(X(k * invR), base - 70); g.stroke(); g.fillStyle = "#c84"; g.fillText(`${k}/R`, X(k * invR) - 8, base - 74); }
    let yy = base - 12;
    for (const r of P.confront.rows.filter((r) => r.firstMassiveGeV !== null && !/^A_μ/.test(r.field))) {
      const col = /^A_y/.test(r.field) ? "#37c" : "#5a5";
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(X(r.firstMassiveGeV), base); g.lineTo(X(r.firstMassiveGeV), yy - 30); g.stroke();
      g.fillStyle = col; g.fillText(r.field.slice(0, 18), X(r.firstMassiveGeV) + 3, yy - 30); yy -= 14; if (yy < 80) yy = base - 12;
    }
    if (P.mHGeV) { g.strokeStyle = "#37c"; g.lineWidth = 3; g.beginPath(); g.moveTo(X(P.mHGeV), base); g.lineTo(X(P.mHGeV), 70); g.stroke(); g.fillStyle = "#37c"; g.fillText(`m_H pred ${P.mHGeV.toFixed(0)}`, X(P.mHGeV) + 3, 68); }
    note.innerHTML = `A log mass axis from 50 GeV to 20 TeV. Orange: the KK levels of the unbroken vectors at ` +
      `k/R; green and blue: the first massive state of each bulk field and of A_y; the thick blue line is the ` +
      `predicted Higgs mass. Dashed: measured. The shaded region is what CMS excludes for a colour-octet vector, ` +
      `and it applies to the orange ticks only if colour is in the bulk. <b>No event is simulated.</b>`;
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

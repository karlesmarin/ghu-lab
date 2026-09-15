/* The H185 family in the app: its own state, exports, permalink and 3D views. */
const GG_S = { p: 1.1, eta: 0, t: .5, quantity: "residue", mode: "turn" };
const GRAVITYGAUGE_SECTION = {
  id: "gravitygauge",
  label: "Gravity–gauge · 3D",
  paper: "H185 · Lim et al. · Brandhuber–Sfetsos · Sakamura",
  ready: true,
  modules: [],
  holds() { return `Warped interval · p = ${GG_S.p} · η = ${GG_S.eta.toFixed(3)} · fixed g₄ · quadratic research example`; },
  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead"><b>The same masses can hide different interactions.</b> Change the positive
    gauge kinetic function while holding the geometry and the four-dimensional coupling g₄ fixed.
    The entire paired tensor–vector tower stays put; its response to a fixed source and its Wilson-line scale change.</p>
    <div class="note">DD means the vector vanishes at both ends. NN means its derivative vanishes.
    This is a controlled extra-dimensional example. The Wilson scale below is a kinetic normalization,
    not a prediction for the Higgs mass.</div>
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;align-items:center">
      <label>Geometry p <select id="ggP"><option value="1.1">1.1 · scalar-supported</option><option value="1">1 · AdS reference</option></select></label>
      <label>η <input id="ggEta" type="number" min="-0.99" max="4" step="0.01" style="width:85px"></label>
      <label style="display:flex;align-items:center;gap:6px">log₁₀(1+η)
        <input id="ggDial" type="range" min="-2" max="0.698970004336" step="0.005" style="width:150px"></label>
      <label>Source t <input id="ggT" type="range" min="0.12" max="0.98" step="0.01" style="width:120px"> <output id="ggTv"></output></label>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">
      <button class="ghost" id="ggMinus">η = −0.9</button><button class="ghost" id="ggZero">η = 0</button>
      <button class="ghost" id="ggPlus">η = 4</button><button class="ghost" id="ggReset">reset view & model</button>
    </div>
    <div id="ggInputNote" class="note" aria-live="polite" style="margin-top:9px"></div>
  </div>
  <div class="grid two">
    <div class="card">
      <h2>Response landscape · 3D</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <label>Height <select id="ggQuantity"><option value="residue">spectral weight ratio</option><option value="kinetic">gauge kinetic Z(t)</option></select></label>
        <button class="ghost" id="ggMode">drag: turn</button>
      </div>
      <canvas id="ggSurface" aria-label="Interactive 3D response surface" style="width:100%;display:block"></canvas>
      <div class="note" id="ggSurfaceNote"></div>
      <p class="note">Drag to rotate. Switch to <b>select point</b> to change η and t on the surface.
      Shift-drag always rotates; the wheel adjusts relief. Arrow keys rotate the focused plot.</p>
    </div>
    <div class="card">
      <h2>Masses · 3D</h2>
      <canvas id="ggTower" aria-label="Interactive 3D masses of tensor and vector modes" style="width:100%;display:block"></canvas>
      <div class="note">Columns: <b style="color:#2876ad">1 tensor NN</b> · <b style="color:#a85528">2 vector DD</b> ·
      <b style="color:#26826b">3 vector NN control</b>. Depth is the mode number; height is mℓ, on a linear scale.</div>
      <p class="note">Three positive paired masses are shown. Only the first massive NN control is computed.
      Tensor NN and gauge NN also have a zero mode; vector DD has none. Drag to rotate.</p>
    </div>
  </div>
  <div class="card" style="margin-top:18px">
    <h2>Results at the selected point</h2>
    <div style="overflow-x:auto"><table><thead><tr><th>quantity</th><th class="num">η = 0</th>
      <th class="num">selected η</th><th>meaning</th></tr></thead><tbody id="ggResults"></tbody></table></div>
    <div class="note" id="ggRealization" style="margin-top:10px"></div>
  </div>
  <div class="card" style="margin-top:18px">
    <h2>Why the masses stay equal</h2>
    <p class="note">With A = −p log(t), let I(t) = ∫ₐᵗ exp(3A) ds and P = I/I(1).
    The family is Zη = exp(−4A)[(1+ηP)/(1+η)]². All its DD vectors have the same canonical
    wave equation as the massive tensor partner. Normalized physical profiles still change.</p>
    <p class="note">Writing w = exp(A)Z, W = ∫w dz and J = ∫dz/w gives g₅² = g₄²W and
    fθ² = 1/(g₄²WJ). The source-weight multiplier is W/[W₀Fη(t)²]. The local static response is
    the sum of residues divided by squared masses. Holding g₄ fixed requires recalibrating g₅.</p>
    <p class="note">The paired masses use archived Bessel roots, checked with an independent ODE.
    The NN control is solved live. Responses use exact integral formulas. This calculation covers
    a quadratic sector with zero background gauge field; radion stability, loop effects, matter profiles
    and collider rates require a completed model.</p>
    <details class="note"><summary>Sources and scope</summary><p>
      The operator method is established: <a href="https://arxiv.org/abs/hep-th/0502022" target="_blank" rel="noopener">Lim et al. (2005)</a>;
      a gauge–gravity pairing appears in <a href="https://arxiv.org/abs/hep-th/0010048" target="_blank" rel="noopener">Brandhuber–Sfetsos (2000, including the addendum)</a>.
      Wilson-line normalization is derived in <a href="https://arxiv.org/abs/0705.1334" target="_blank" rel="noopener">Sakamura (2007), §2.3</a>.
      H185 constructs and checks the family displayed here; no priority claim is made.</p></details>
  </div>`,
  encodeState() { return `p:${GG_S.p},eta:${GG_S.eta},t:${GG_S.t},q:${GG_S.quantity === "kinetic" ? 1 : 0}`; },
  decodeState(v) {
    Object.assign(GG_S, { p: 1.1, eta: 0, t: .5, quantity: "residue", mode: "turn" });
    if (!v) return;
    for (const tok of String(v).split(/[|,]/)) {
      const [k, raw] = tok.split(":"), x = Number(raw);
      if (!Number.isFinite(x)) continue;
      if (k === "p" && [1, 1.1].includes(x)) GG_S.p = x;
      if (k === "eta") GG_S.eta = Math.min(4, Math.max(-.99, x));
      if (k === "t") GG_S.t = Math.min(.98, Math.max(.12, x));
      if (k === "q") GG_S.quantity = x === 1 ? "kinetic" : "residue";
    }
  },
  init(ctx) {
    const $ = id => document.getElementById(id);
    this._view = surfaceView({ n: 32 }); this._towerView = surfaceView({ az: .7, el: .55, h: .65 });
    this._ctx = ctx; this._meshKey = null; this._nnKey = null;
    $("ggP").onchange = () => { GG_S.p = Number($("ggP").value); ctx.refresh(); };
    $("ggEta").onchange = () => {
      const el = $("ggEta"), x = el.value === "" ? NaN : Number(el.value);
      if (!Number.isFinite(x) || x < -.99 || x > 4) {
        $("ggInputNote").textContent = "Enter η between −0.99 and 4. The last valid result is still shown.";
        el.value = GG_S.eta; return;
      }
      GG_S.eta = x; ctx.refresh();
    };
    $("ggDial").oninput = () => { GG_S.eta = Math.min(4, Math.max(-.99, 10 ** Number($("ggDial").value) - 1)); ctx.refresh(); };
    $("ggT").oninput = () => { GG_S.t = Number($("ggT").value); ctx.refresh(); };
    $("ggQuantity").onchange = () => { GG_S.quantity = $("ggQuantity").value; ctx.refresh(); };
    for (const [id, v] of [["ggMinus", -.9], ["ggZero", 0], ["ggPlus", 4]]) $(id).onclick = () => { GG_S.eta = v; ctx.refresh(); };
    $("ggMode").onclick = () => { GG_S.mode = GG_S.mode === "turn" ? "move" : "turn"; this._surfaceControl.mode(GG_S.mode); ctx.refresh(); };
    $("ggReset").onclick = () => { this.decodeState(""); this._surfaceControl.reset(); this._towerControl.reset(); this._surfaceControl.mode("turn"); ctx.refresh(); };
    this._surfaceControl = attachSurface($("ggSurface"), this._view, {
      mode: GG_S.mode, width: () => this._sw || 600, height: () => 340,
      pick: (x, y) => this._projector && pickSurface(this._projector, this._field, 48, x, y, { within: 40 }),
      onPick: pos => { GG_S.t = .12 + .86 * pos[0]; GG_S.eta = Math.min(4, Math.max(-.99, 10 ** (-2 + (2 + Math.log10(5)) * pos[1]) - 1)); ctx.refresh(); },
      onView: () => this._drawSurface(),
    });
    this._towerControl = attachSurface($("ggTower"), this._towerView, { mode: "turn",
      width: () => this._tw || 600, height: () => 340, onView: () => this._drawTower() });
    if (typeof ResizeObserver !== "undefined") {
      this._resize = new ResizeObserver(() => { this._drawSurface(); this._drawTower(); });
      this._resize.observe($("ggSurface").parentElement);
    }
  },
  dispose() { this._surfaceControl?.detach(); this._towerControl?.detach(); this._resize?.disconnect(); this._ctx = null; },
  render() {
    const $ = id => document.getElementById(id);
    const c = ggIntegrals(GG_S.p, GG_S.eta), base = ggIntegrals(GG_S.p, 0), at = ggAt(c, GG_S.t);
    const key = `${GG_S.p}|${GG_S.eta}`;
    if (key !== this._nnKey) { this._nn = ggFirstNN(GG_S.p, GG_S.eta); this._nnBase = ggFirstNN(GG_S.p, 0); this._nnKey = key; }
    this._c = c; this._masses = ggMasses(GG_S.p);
    $("ggP").value = GG_S.p; $("ggEta").value = +GG_S.eta.toFixed(6);
    $("ggDial").value = Math.log10(1 + GG_S.eta); $("ggT").value = GG_S.t;
    $("ggTv").textContent = GG_S.t.toFixed(3); $("ggQuantity").value = GG_S.quantity;
    $("ggMode").textContent = GG_S.mode === "turn" ? "drag: turn" : "drag: select point";
    $("ggInputNote").textContent = "Fixed interval 0.1 ≤ t ≤ 1, Z(IR) = 1; same charge convention and g₄. η changes the gauge action.";
    const row = (name, a, b, note) => `<tr><td>${name}</td><td class="num">${a.toFixed(6)}</td><td class="num">${b.toFixed(6)}</td><td class="note">${note}</td></tr>`;
    $("ggResults").innerHTML = this._masses.map((x, i) => row(`Tensor NN = vector DD, n=${i + 1}`, x, x, "mℓ; protected for all η")).join("")
      + row("First massive gauge NN", this._nnBase, this._nn, "mℓ; different boundary domain")
      + row("Wilson scale g₄ℓfθ", base.f, c.f, "kinetic scale; no Higgs mass computed")
      + row("Spectral weight multiplier", 1, at.residueRatio, "relative to η=0, for any nonzero mode residue at this source")
      + row("Static response / (g₄²ℓ²)", ggAt(base, GG_S.t).staticResponse, at.staticResponse, "complete DD tower at zero four-momentum");
    $("ggRealization").textContent = GG_S.p > 1
      ? "For p=1.1 the same canonical bulk scalar background supports every displayed Z(φ). Scalar/radion stability and the effective-theory cutoff have not been established."
      : "For p=1 these are prescribed kinetic weights on AdS. η=−0.99 recovers minimal Z=1; the other weights are not realized by the canonical scalar used for p>1.";
    this._drawSurface(); this._drawTower();
  },
  _canvas(id) {
    const el = document.getElementById(id); if (!el || !this._ctx) return null;
    const w = Math.max(230, (el.parentElement?.clientWidth ? el.parentElement.clientWidth - 38 : el.clientWidth || 600)), h = 340, d = window.devicePixelRatio || 1;
    el.width = Math.round(w * d); el.height = h * d; el.style.height = `${h}px`;
    const g = el.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  },
  _drawSurface() {
    const cv = this._canvas("ggSurface"); if (!cv) return;
    const { g, w, h } = cv; this._sw = w;
    const key = `${GG_S.p}|${GG_S.quantity}`;
    if (this._meshKey !== key) {
      const vals = [], n = 48;
      for (let j = 0; j <= n; j++) {
        const eta = Math.min(4, Math.max(-.99, 10 ** (-2 + (2 + Math.log10(5)) * j / n) - 1));
        const c = ggIntegrals(GG_S.p, eta);
        for (let i = 0; i <= n; i++) { const at = ggAt(c, .12 + .86 * i / n); vals.push(Math.log10(GG_S.quantity === "kinetic" ? at.Z : at.residueRatio)); }
      }
      this._field = heightField(vals, n, n); this._meshKey = key;
    }
    const P = paintSurface(g, this._view, [.86, 2 + Math.log10(5)], this._field,
      { frame: { x: 40, y: 30, w: w - 80, h: h - 85 }, floor: "rgba(100,120,130,.25)", levels: [.25, .5, .75] });
    this._projector = P;
    surfaceStem(g, P, this._field, (GG_S.t - .12) / .86, (Math.log10(1 + GG_S.eta) + 2) / (2 + Math.log10(5)), { colour: "#d44d27", radius: 5 });
    surfaceAxisLabels(g, P, ["t", "log₁₀(1+η)"], { ink: "#596c78", halo: "#ffffff" });
    g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = "#596c78"; g.font = "12px sans-serif"; g.fillText(GG_S.quantity === "kinetic" ? "Height: log₁₀ Z" : "Height: log₁₀ spectral weight ratio", 12, 17);
    const at = ggAt(ggIntegrals(GG_S.p, GG_S.eta), GG_S.t), value = GG_S.quantity === "kinetic" ? at.Z : at.residueRatio;
    document.getElementById("ggSurfaceNote").textContent = `Ranges: t ∈ [0.12, 0.98], log₁₀(1+η) ∈ [−2, 0.699]. Orange marker: t=${GG_S.t.toFixed(3)}, η=${GG_S.eta.toFixed(3)}, value=${value.toPrecision(5)}. Surface height runs from ${this._field.lo.toFixed(2)} to ${this._field.hi.toFixed(2)} in log₁₀ units.`;
  },
  _drawTower() {
    const cv = this._canvas("ggTower"); if (!cv || !this._masses) return;
    const { g, w, h } = cv; this._tw = w;
    const view = this._towerView, max = this._masses[2] * 1.15;
    const box = new Float64Array([0, 1, 0, 1]);
    fitSurfaceView(view, [2, 1], box, 1, 1, { x: 45, y: 25, w: w - 90, h: h - 85 });
    const P = surfaceProjector(view, [2, 1]);
    const segment = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    g.strokeStyle = "#d0d8dd"; g.lineWidth = 1;
    for (let i = 0; i <= 3; i++) segment(P(0, i / 3, 0), P(1, i / 3, 0));
    const cols = ["#2876ad", "#a85528", "#26826b"], items = [];
    for (let k = 0; k < 3; k++) {
      const masses = k < 2 ? this._masses : [this._nn];
      masses.forEach((m, i) => items.push({ k, m, z: (i + 1) / 3 }));
      if (k !== 1) items.push({ k, m: 0, z: 0 });
    }
    items.sort((a, b) => P(a.k / 2, a.z, 0)[2] - P(b.k / 2, b.z, 0)[2]);
    for (const it of items) {
      const base = P(it.k / 2, it.z, 0), top = P(it.k / 2, it.z, it.m / max);
      g.strokeStyle = cols[it.k]; g.lineWidth = 5; segment(base, top);
      g.fillStyle = cols[it.k]; g.beginPath(); g.arc(top[0], top[1], it.m === 0 ? 5 : 3, 0, Math.PI * 2); g.fill();
    }
    g.font = "11px sans-serif"; g.fillStyle = "#596c78"; g.strokeStyle = "#596c78"; g.lineWidth = 1;
    segment(P(-.08, 1, 0), P(-.08, 1, 1));
    for (let m = 0; m <= max; m += 2) { const q = P(-.08, 1, m / max); g.fillText(String(m), q[0] - 17, q[1] + 3); }
    for (let k = 0; k < 3; k++) { const q = P(k / 2, -.08, 0); g.fillText(String(k + 1), q[0] - 3, q[1] + 12); }
    g.fillText("Height: mℓ (linear)", 12, 17);
  },
  texExport() {
    const c = ggIntegrals(GG_S.p, GG_S.eta), at = ggAt(c, GG_S.t), masses = ggMasses(GG_S.p);
    const source = "H185 fixed-potential derivation; Z=exp(-4A)F_eta^2; same g4, fixed Wilson period";
    const values = {
      paired_masses: val(masses.join(", "), { status: STATUS.VERIFIED, source: "Bessel roots cross-checked by the original ODE; " + GG_REFERENCE.sha256, units: "1/ell" }),
      gauge_NN_first: val(ggFirstNN(GG_S.p, GG_S.eta), { status: STATUS.VERIFIED, source: "live weighted ODE with NN boundaries", units: "1/ell" }),
      g4_ell_f_theta: val(c.f, { status: STATUS.VERIFIED, source, units: "dimensionless" }),
      residue_ratio: val(at.residueRatio, { status: STATUS.VERIFIED, source, units: "relative to eta=0" }),
      static_response: val(at.staticResponse, { status: STATUS.VERIFIED, source, units: "g4^2 ell^2" }),
      Higgs_mass: unknown("Wilson kinetic scale calculated; no effective potential or Higgs mass"),
      collider_rate: unknown("requires matter profiles, full interactions and a physical scale"),
    };
    return { card: makeCard(ggInput(GG_S.p, GG_S.eta, GG_S.t), values, { version: VERSION, build: BUILD,
      certificates: { reference: GG_REFERENCE, derivation: source, scope: "quadratic regular interval; no brane kinetic terms", sources: ["https://arxiv.org/abs/hep-th/0502022", "https://arxiv.org/abs/hep-th/0010048", "https://arxiv.org/abs/0705.1334"] } }),
      sources: [], caption: "H185 fixed-potential family at fixed four-dimensional gauge strength; dimensionless theoretical outputs." };
  },
};

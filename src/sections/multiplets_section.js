/* multiplets_section.js — the layer below the term tables, and the cancellation it makes visible.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Every other section takes a representation to BE its term table.  Here the multiplets are the
 * object and the table is derived from them, which buys three things at once: a reader outside
 * this series can read a zero-mode spectrum off any parity assignment; the tables the app ships
 * stop being quoted; and the gauge sector splits into its two P6 halves, where one adjoint fermion
 * with the gauge field's own parity cancels the periodic half identically.
 *
 * WHY A CUBE, AND WHY IT IS NOT DECORATION.  A multiplet carries three Z2 parities, each +-1.
 * Three binary coordinates ARE the corners of a cube; the picture is the data in its own shape,
 * not an illustration of it.  Two things follow that a table cannot show at a glance: the
 * cancellation lives on a FACE — the four corners with P6 = +1 — and the residue on the opposite
 * one; and the zero modes lie on the two corners where eta*P5 and eta'*P5' agree, which is a
 * diagonal pair, so flipping one parity moves the whole spectrum across the cube.
 *
 * The sticks at each corner are the contributions themselves: gauge downward, matter upward,
 * to the same scale.  On the periodic face, with one 48(+,+), they are mirror images — that is
 * the finding, drawn rather than asserted.  Turn it with the mouse, as the reliefs turn.
 *
 * Edited BY HAND.
 */
const MULTIPLETS_SECTION = {
  id: "multiplets",
  label: "Multiplets & parities",
  paper: "Parts VI–VII",
  ready: true,
  /* The module answers for the content actually loaded; the controls below wander over the rest. */
  modules: [multipletsModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="mpModel">—</p>
  </div>

  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="mpLead">—</p>
    <div class="note" style="margin-top:9px">
      A bulk representation breaks into multiplets of SU(3)<sub>C</sub>&times;SU(2)<sub>L</sub>,
      each carrying three Z<sub>2</sub> parities <span class="lc">(P₆, P₅, P′₅)</span>. One
      combination, <span style="font-family:var(--mono)">s = η·η′·P₅·P′₅</span>, decides
      <b>both</b> of the things worth knowing — the sign of that multiplet's winding sum in the
      potential, and whether it has a zero mode at all. They are the same pair of eigenvalues read
      twice, so the instrument needs one rule, not two.
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <div class="row" style="gap:18px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <div class="sub">Representation</div>
        <div id="mpReps" class="row" style="gap:6px"></div>
      </div>
      <div>
        <div class="sub">Parities (η, η′)</div>
        <div id="mpPar" class="row" style="gap:6px"></div>
      </div>
      <div>
        <div class="sub">Copies against the gauge sector</div>
        <div class="row" style="gap:8px;align-items:center">
          <input id="mpN" type="range" min="0" max="4" step="1" value="1" style="width:150px">
          <span id="mpNv" style="font-family:var(--mono)">1</span>
        </div>
      </div>
    </div>
  </div>

  <div class="grid2" style="margin-bottom:18px">
    <div class="card">
      <h3>The parity cube${helpMark("parities")}</h3>
      <canvas id="mpCube" width="560" height="410"></canvas>
      <div class="note" id="mpCubeNote">—</div>
    </div>
    <div class="card">
      <h3>What sits on each corner${helpMark("zero-mode")}</h3>
      <div id="mpTable"></div>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <h3>The term table, derived</h3>
      <div id="mpTerms"></div>
    </div>
    <div class="card">
      <h3>Against the gauge sector, split by P₆</h3>
      <div id="mpLedger"></div>
    </div>
  </div>`,

  /* View state, not model state: nothing here touches the record.  Same contract as the second
   * content in the "same potential?" section. */
  _rep: "48", _eta: 1, _etap: 1, _n: 1,

  /* `init`, not `mount`: the shell calls sec.init(ctx) and nothing else.  The first version of this
   * file called it mount, copied from a section that happens to have both, so the controls were
   * never wired and the panel shipped with two empty rows where the buttons should be — visible
   * only in the screenshot. */
  init(ctx) {
    const $ = (id) => document.getElementById(id);
    const D = ctx.DATA.multiplets;

    $("mpReps").innerHTML = Object.keys(D.decomposition)
      .map((r) => `<button class="st" style="width:auto;padding:0 9px" data-r="${r}">${r}</button>`).join("");
    $("mpReps").querySelectorAll("button").forEach((b) => (b.onclick = () => {
      this._rep = b.dataset.r; this._paint(ctx);
    }));

    $("mpPar").innerHTML = [["(+,+)", 1, 1], ["(+,−)", 1, -1], ["(−,+)", -1, 1], ["(−,−)", -1, -1]]
      .map(([t, e, p]) => `<button class="st" style="width:auto;padding:0 9px" data-e="${e}" data-p="${p}">${t}</button>`).join("");
    $("mpPar").querySelectorAll("button").forEach((b) => (b.onclick = () => {
      this._eta = +b.dataset.e; this._etap = +b.dataset.p; this._paint(ctx);
    }));

    $("mpN").oninput = () => { this._n = +$("mpN").value; this._paint(ctx); };

    this._view = this._view || surfaceView({ az: -0.72, el: 0.72, h: 0.80 });
    const c = $("mpCube");
    attachSurface(c, this._view, {
      mode: "turn",
      width: () => c.clientWidth || 560,
      height: () => 410,
      onView: () => this._cube(ctx),
    });
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    if (!$("mpCube")) return;

    /* the loaded content, answered by the module -- the controls below are exploration on top */
    const mp = r && r.values && r.values.get("multiplets");
    if (mp && $("mpModel")) {
      const v = mp.value;
      const parts = v.entries.map((e) =>
        `${e.multiplicity}×<b>${e.rep}</b>(${e.parities[0] > 0 ? "+" : "−"},${
          e.parities[1] > 0 ? "+" : "−"})`).join(" + ") || "an empty bulk";
      const cancels = v.periodic_cancels;
      $("mpModel").innerHTML =
        `The content you have loaded — ${parts} — keeps <b>${v.zero_states_total}</b> zero-mode ` +
        `states, and its term tables ` +
        (v.derived_agrees
          ? `<span class="chip thm">recompute exactly</span> from the decompositions`
          : `<span class="chip bad">DISAGREE for ${v.disagreeing.join(", ")}</span>`) +
        `. Against the gauge sector its periodic half ` +
        (cancels === null ? "is not computed here"
          : cancels ? `<b>cancels identically</b>` : `does not cancel`) + `.`;
    }
    this._paint(ctx);
  },

  _paint(ctx) {
    const $ = (id) => document.getElementById(id);
    if (!$("mpCube")) return;
    const D = ctx.DATA.multiplets, rep = this._rep;
    const mults = D.decomposition[rep];
    const eta = this._eta, etap = this._etap;

    $("mpReps").querySelectorAll("button")
      .forEach((b) => b.classList.toggle("on", b.dataset.r === rep));
    $("mpPar").querySelectorAll("button")
      .forEach((b) => b.classList.toggle("on", +b.dataset.e === eta && +b.dataset.p === etap));
    $("mpNv").textContent = this._n;

    const K = cube(mults, { eta, etap });
    const zs = K.reduce((t, k) => t + k.zeroStates, 0);
    const tot = K.reduce((t, k) => t + k.states, 0);
    $("mpLead").innerHTML =
      `<b>${rep}</b> with (η, η′) = (${eta > 0 ? "+" : "−"}, ${etap > 0 ? "+" : "−"}) breaks into ` +
      `${mults.length} multiplets, ${tot} states, from their eq. ${D.equations[rep]}. ` +
      (zs ? `<b>${zs}</b> of them keep a zero mode` : "<b>No</b> state keeps a zero mode") +
      `; the rest are lifted by the orbifold.`;

    /* the corner table */
    const rows = K.filter((k) => k.states)
      .sort((a, b) => b.p6 - a.p6 || b.p5 - a.p5 || b.p5p - a.p5p)
      .map((k) => {
        const chip = k.zeroMode
          ? `<span class="chip thm">zero mode ${k.zeroMode}</span>`
          : `<span class="chip">lifted</span>`;
        const cs = [...new Set(k.multiplets.flatMap((mu) => chargesOf(mu[MUF.DIM])))]
          .sort((a, b) => b - a);
        return `<tr><td style="font-family:var(--mono)">(${k.p6 > 0 ? "+" : "−"},${
          k.p5 > 0 ? "+" : "−"},${k.p5p > 0 ? "+" : "−"})</td>` +
          `<td>${k.multiplets.map((mu) => mu[0]).join(" ⊕ ")}</td>` +
          `<td style="text-align:right">${k.states}</td>` +
          `<td style="font-family:var(--mono)">${k.s > 0 ? "+1" : "−1"}</td>` +
          `<td style="font-family:var(--mono)">${cs.length ? cs.join(", ") : "—"}</td>` +
          `<td>${chip}</td></tr>`;
      }).join("");
    $("mpTable").innerHTML =
      `<table class="tbl"><thead><tr><th class="lc">(P₆,P₅,P′₅)</th><th>multiplets</th>` +
      `<th style="text-align:right">states</th><th>s</th><th>charges c</th><th></th></tr></thead>` +
      `<tbody>${rows}</tbody></table>` +
      `<div class="note" style="margin-top:8px">Charges are <span style="font-family:var(--mono)">` +
      `c = r−1, r−3, …&gt;0</span>: their eq. (71) states the leading one and the note below it adds ` +
      `the rest for the quadruplet. A multiplet with s = −1 has no zero mode of either chirality, ` +
      `which is why the same column answers both questions.</div>`;

    /* the derived table, against the one the app ships */
    const derived = termsOf(mults, { eta, etap });
    const tag = `(${eta > 0 ? "+" : "−"},${etap > 0 ? "+" : "−"})`;
    const shipped = (ctx.DATA.reps[rep] || {})[tag] || null;
    const agrees = shipped && samePotential(derived, shipped);
    $("mpTerms").innerHTML =
      `<table class="tbl"><thead><tr><th>channel (c, s)</th><th style="text-align:right">weight` +
      `</th></tr></thead><tbody>` +
      derived.map(([m, s, c]) =>
        `<tr><td style="font-family:var(--mono)">c = ${c}, s = ${s > 0 ? "+1" : "−1"}</td>` +
        `<td style="text-align:right;font-family:var(--mono)">${m}</td></tr>`).join("") +
      `</tbody></table>` +
      (shipped
        ? `<div style="margin-top:9px">${agrees
            ? `<span class="chip thm">matches the shipped table</span>`
            : `<span class="chip bad">DISAGREES with the shipped table</span>`}</div>` +
          `<div class="note" style="margin-top:6px">The table this app has computed with since it ` +
          `existed was transcribed from eqs. (73)–(76). This one is derived from the ` +
          `decomposition and compared channel by channel — build/make_data_multiplets.py refuses ` +
          `to write the data at all if any of the nine disagree.</div>`
        : `<div class="note" style="margin-top:9px">No shipped table for this parity: the paper ` +
          `prints (+,+) and (+,−) only, so this one is a prediction of the same rules.</div>`);

    this._ledger(ctx);
    this._cube(ctx);
  },

  _ledger(ctx) {
    const D = ctx.DATA.multiplets, W = D.gauge_weight;
    const led = p6Ledger(D.decomposition["48"], W, D.decomposition[this._rep],
                         { eta: this._eta, etap: this._etap, n: this._n });
    const fmt = (t) => t.length
      ? t.map(([m, s, c]) => `<span style="font-family:var(--mono)">${m > 0 ? "+" : ""}${
          (+m.toFixed(3))} <span style="opacity:.6">(c=${c}, s=${s > 0 ? "+" : "−"})</span></span>`)
        .join("&nbsp; ")
      : `<span style="font-family:var(--mono)">0</span>`;
    const body = led.map((x) => `
      <tr><td><b>${x.name === "periodic" ? "P₆ = +1" : "P₆ = −1"}</b><div class="note">${
        x.name === "periodic" ? "the four front corners" : "the six coloured doublets"}</div></td>
      <td>${fmt(x.gauge)}</td><td>${fmt(x.matter)}</td>
      <td>${fmt(x.sum)} ${x.cancels ? `<span class="chip thm">cancels</span>` : ""}</td></tr>`).join("");
    const per = led.find((x) => x.name === "periodic");
    document.getElementById("mpLedger").innerHTML =
      `<table class="tbl"><thead><tr><th>sector</th><th>gauge, eq. (68)</th>` +
      `<th>${this._n} × ${this._rep}</th><th>sum</th></tr></thead><tbody>${body}</tbody></table>` +
      `<div class="note" style="margin-top:8px">` +
      (per.cancels
        ? `<b>The periodic half cancels identically</b>, three channels at once. It happens for the ` +
          `adjoint with the gauge field's own parity and one copy: the <span class="lc">48</span> at ` +
          `(+,+) has s = P₅·P′₅, which is exactly the sign eq. (58) gives the gauge field. Change ` +
          `the representation, the parity or the number of copies and it stops.`
        : `The periodic halves do not cancel here. They do for one <span class="lc">48</span> at ` +
          `(+,+) — the adjoint carries the gauge field's own sign, because the gauge potential runs ` +
          `over the same decomposition, eq. (57).`) +
      ` Weights are the app's convention: one Dirac multiplet is 1, so the gauge sector's ` +
      `<span style="font-family:var(--mono)">(2,4,7)</span> appears halved.</div>`;
  },

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 560;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },

  _cube(ctx) {
    const c = document.getElementById("mpCube");
    if (!c) return;
    const [g, W, H] = this._fit(c, 410);
    g.fillStyle = "#141d26"; g.fillRect(0, 0, W, H);

    const D = ctx.DATA.multiplets, mults = D.decomposition[this._rep];
    const K = cube(mults, { eta: this._eta, etap: this._etap });

    /* fit the whole unit cube, then project — the house's camera, so the mouse contract is one.
     * The camera is created here as well as in mount(): the harness renders a section without
     * mounting it, and a picture that needs mount() to have run is a picture that cannot be
     * tested outside the page. */
    const view = this._view || (this._view = surfaceView({ az: -0.72, el: 0.72, h: 0.80 }));
    const frame = { x: 16, y: 26, w: W - 32, h: H - 78 };
    const raw = surfaceProjector(view, [1, 1]).raw;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const X of [0, 1]) for (const Y of [0, 1]) for (const Z of [0, 1]) {
      const [u, v] = raw(X, Y, Z);
      if (u < x0) x0 = u; if (u > x1) x1 = u;
      if (v < y0) y0 = v; if (v > y1) y1 = v;
    }
    view.s = Math.min(frame.w / ((x1 - x0) || 1), frame.h / ((y1 - y0) || 1)) * 0.84;
    view.ox = frame.x + frame.w / 2 - (x0 + x1) / 2 * view.s;
    view.oy = frame.y + frame.h / 2 - (y0 + y1) / 2 * view.s;
    const P = surfaceProjector(view, [1, 1]);

    /* the P6 = +1 face: the cancellation lives here, so it is the one thing given a surface */
    const face = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]].map(([a, b, d2]) => P(a, b, d2));
    g.beginPath();
    g.moveTo(face[0][0], face[0][1]);
    for (const p of face.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath();
    g.fillStyle = "rgba(77,163,196,.13)"; g.fill();
    g.strokeStyle = "rgba(77,163,196,.45)"; g.lineWidth = 1; g.stroke();

    /* the cage */
    g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 1;
    const E = [[0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1],
               [1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 0],
               [1, 0, 0, 1, 1, 0], [1, 0, 0, 1, 0, 1], [0, 1, 0, 1, 1, 0],
               [0, 1, 0, 0, 1, 1], [0, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1]];
    g.beginPath();
    for (const [a, b, d2, e, f, h2] of E) {
      const A = P(a, b, d2), B = P(e, f, h2);
      g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]);
    }
    g.stroke();

    /* the sticks: gauge down, matter up, same scale.  On the periodic face with one 48(+,+) they
     * are mirror images, which is the whole point of drawing them instead of tabulating them. */
    const gw = D.gauge_weight;
    const gaugeAt = new Map();
    for (const mu of D.decomposition["48"]) {
      const k = `${mu[1]}|${mu[2]}|${mu[3]}`;
      gaugeAt.set(k, (gaugeAt.get(k) || 0)
        + mu[4] * gw[mu[1] > 0 ? "periodic" : "antiperiodic"] * chargesOf(mu[5]).length);
    }
    const matterAt = new Map();
    for (const mu of mults) {
      const k = `${mu[1]}|${mu[2]}|${mu[3]}`;
      matterAt.set(k, (matterAt.get(k) || 0) + mu[4] * this._n * chargesOf(mu[5]).length);
    }
    const big = Math.max(1, ...[...gaugeAt.values()], ...[...matterAt.values()]);
    const LEN = 0.30;

    /* The centre of the projected cube, so every label can be pushed radially OUTWARD.  The first
     * version wrote the multiplet names beside the discs and they collided with each other and
     * with the cage; the names live in the table next to this, and what a corner needs at a glance
     * is how many states sit on it and whether they survive. */
    const mid = P(0.5, 0.5, 0.5);
    const biggest = Math.max(1, ...K.map((q) => q.states));
    const order = K.map((k) => ({ k, d: P(k.x, k.y, k.z)[2] })).sort((a, b) => a.d - b.d);

    for (const { k } of order) {
      const key = `${k.p6}|${k.p5}|${k.p5p}`;
      const A = P(k.x, k.y, k.z);
      const gv = gaugeAt.get(key) || 0, mv = matterAt.get(key) || 0;
      const stick = (val, dir, col) => {
        if (!val) return;
        const B = P(k.x, k.y, Math.max(0, Math.min(1, k.z + dir * LEN * val / big)));
        g.strokeStyle = col; g.lineWidth = 4; g.lineCap = "round";
        g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
        g.fillStyle = col;
        g.beginPath(); g.arc(B[0], B[1], 3, 0, 7); g.fill();
      };
      stick(gv, -1, "#d95f5f");
      stick(mv, +1, "#3fae74");

      if (!k.states) {
        g.fillStyle = "rgba(255,255,255,.20)";
        g.beginPath(); g.arc(A[0], A[1], 3.5, 0, 7); g.fill();
        continue;
      }
      const r = 7 + 11 * Math.sqrt(k.states / biggest);
      g.beginPath(); g.arc(A[0], A[1], r, 0, 7);
      g.fillStyle = k.zeroMode === "L" ? "#3fae74" : k.zeroMode === "R" ? "#4da3c4" : "#48596a";
      g.fill();
      g.strokeStyle = k.s > 0 ? "#e8eef4" : "rgba(255,255,255,.28)";
      g.lineWidth = k.s > 0 ? 2 : 1; g.stroke();

      /* the count inside the disc, the parity triple outside it and pointing away from the cube */
      g.fillStyle = k.zeroMode ? "#0d1620" : "#e8eef4";
      g.font = "600 12px system-ui, sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(k.states), A[0], A[1]);
      const dx = A[0] - mid[0], dy = A[1] - mid[1];
      const nrm = Math.hypot(dx, dy) || 1;
      const L = r + 15;
      g.fillStyle = "rgba(232,238,244,.78)";
      g.font = "11px var(--mono, monospace)";
      g.fillText(`(${k.p6 > 0 ? "+" : "−"}${k.p5 > 0 ? "+" : "−"}${k.p5p > 0 ? "+" : "−"})`,
                 A[0] + dx / nrm * L, A[1] + dy / nrm * L);
      g.textAlign = "start"; g.textBaseline = "alphabetic";
    }

    /* the three axes, named on the EDGES out of the (−,−,−) corner rather than on the corners
     * themselves, which is where the discs are */
    g.font = "11px system-ui, sans-serif";
    g.fillStyle = "rgba(255,255,255,.55)";
    const axis = (a, b, d2, t) => { const p = P(a, b, d2); g.fillText(t, p[0] + 6, p[1] - 5); };
    axis(0.5, 0, 0, "P₆ →"); axis(0, 0.5, 0, "P₅ →"); axis(0, 0, 0.5, "P′₅ ↑");

    /* the legend, on the canvas: a picture whose key is only in the prose is read wrong once */
    g.font = "11px system-ui, sans-serif"; g.textBaseline = "middle";
    let lx = 14;
    const key = (col, txt, disc) => {
      g.fillStyle = col;
      if (disc) { g.beginPath(); g.arc(lx + 5, H - 15, 5, 0, 7); g.fill(); }
      else { g.fillRect(lx, H - 17, 10, 4); }
      g.fillStyle = "rgba(232,238,244,.80)";
      g.fillText(txt, lx + 15, H - 15);
      lx += 22 + g.measureText(txt).width;
    };
    key("#3fae74", "zero mode L", true);
    key("#4da3c4", "zero mode R", true);
    key("#48596a", "lifted", true);
    key("#d95f5f", "gauge", false);
    key("#3fae74", "matter ×" + this._n, false);
    g.textBaseline = "alphabetic";

    const per = p6Ledger(D.decomposition["48"], gw, mults,
                         { eta: this._eta, etap: this._etap, n: this._n })
      .find((x) => x.name === "periodic");
    document.getElementById("mpCubeNote").innerHTML =
      `Drag to turn. Each corner is a parity assignment; the disc is how many states sit there, ` +
      `filled <span style="color:#3fae74">green</span> for a left-handed zero mode, ` +
      `<span style="color:#4da3c4">blue</span> for right-handed, grey when the orbifold lifts ` +
      `them. The sticks are the contributions to the potential — ` +
      `<span style="color:#d95f5f">gauge downward</span>, ` +
      `<span style="color:#3fae74">matter upward</span>, one scale. ` +
      (per.cancels
        ? `On the shaded P₆ = +1 face they are mirror images: <b>that is the cancellation.</b>`
        : `They are mirror images on the shaded face only for one <span class="lc">48</span> at (+,+).`);
  },
};

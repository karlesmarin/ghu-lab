/* anomalies_section.js — Part VI as a section: the bill, and what it buys.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Second section, and the first real test of the promise that adding one is a file and a line.
 * It shares the model with the hierarchy section and reuses its `moments` capability outright --
 * the resolver runs that module once for both, which is the whole reason it exists.
 *
 * The section shows what it cannot do as prominently as what it can.  The six anomaly channels are
 * not in this kernel, and the panel says so in the same place it would have shown them.
 *
 * Edited BY HAND.
 */
const ANOMALIES_SECTION = {
  id: "anomalies",
  label: "Anomalies & proton",
  paper: "Part VI",
  ready: true,
  /* The escape module is Part VI's charge arithmetic -- the six channels this section used to
   * declare `unknown`.  The escape section mounts the same pair; the resolver runs them once. */
  modules: [anomaliesModule(DATA), escapeModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="aLead">—</p>
    <div class="note" style="margin-top:9px">
      A unified group relates quarks to leptons, so dimension-6 operators violate baryon number
      unless something forbids them. Part VI finds that the surviving escape is a family-dependent
      charge, and that it must be hosted by an <span style="font-family:var(--mono)">84(+,+)</span>
      — a multiplet every published row already contains. Donating it removes it from the Higgs
      potential, and <em>that</em> has an exact price.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The bill, in eighths${helpMark("bill-in-eighths")}</h2>
        <p class="note" style="margin:0 0 10px">What each multiplet contributes to
        <span style="font-family:var(--mono)">8D</span>. Integers, exactly — this is the one thing
        on this page that no normalisation can move.</p>
        <canvas id="aBars" width="560" height="250"></canvas>
        <table><thead><tr><th>multiplet</th><th class="num">cost to 8D</th>
          <th class="num">in this content</th></tr></thead><tbody id="aBill"></tbody></table>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The ladder, and the quantum${helpMark("rung")}</h2>
        <canvas id="aLadder" width="560" height="150"></canvas>
        <div class="note" style="margin-top:9px" id="aLadderNote"><span style="font-family:var(--mono)">8D</span> is
        an <b>odd integer</b> — Part VII, Theorem 1 — so <span style="font-family:var(--mono)">D</span>
        can never be zero and the electroweak verdict is always well defined. The ladder is in
        eighths, and the two rungs either side of zero are the closest the vacuum can come to
        marginal. Nothing here carries a scale: it is a ratio of integers.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The six anomaly channels${helpMark("anomaly-channel")}</h2>
        <div class="verdict stable" id="aChan"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px">Part VI §3, on the surviving chiral content with
        their own conjugate-pairing prescription. Three channels are linear in X<sub>Q</sub> and share
        one root; two are constants that only a Standard-Model singlet of charge −1 can cancel —
        a right-handed neutrino, which only the <span style="font-family:var(--mono)">28</span>
        supplies. The full escape — the ladder, the fourteen assignments, the selection rule —
        lives in its own section, <b>Escape from proton decay</b>, on this rail.</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Donating the host</h2>
        <div id="aDon"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Their Table 1, and what the escape costs each row</h2>
        <p class="note" style="margin:0 0 10px">Five rows because their table has five. They are not
        the universe — the panel below prices the escape on the whole lattice.</p>
        <table><thead><tr><th>row</th><th class="num">8D</th><th class="num">after</th>
          <th class="num">m<sub>h</sub> after</th><th>verdict</th></tr></thead>
          <tbody id="aRows"></tbody></table>
        <div class="note" style="margin-top:9px">The last two columns go <b>beyond</b> Part VI,
        which states in its own words that the modified potential is not recomputed there. With the
        Part VII kernel present it can be — so it is, labelled
        <span class="chip mea">measured</span> and carrying the anchor band.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The headline as a region — the wedge${helpMark("ceiling")}</h2>
        <p class="note" style="margin:0 0 10px">The exposed half of "row (2) is the unique row"
        is D, computed from the very formulas that fail the anchor. So take the <b>whole family</b>
        of repairs — reweight every 28 by w(28) and every 84 by w(84) — and ask where the verdict
        survives. A conclusion that holds on a region is a different object from one that holds
        at a point.</p>
        <canvas id="aWedge" width="560" height="340"></canvas>
        <div class="legend">
          <span><i style="background:var(--green-l);border:1px solid #bfe0cd;height:9px"></i>the wedge: (2) donated alive ∧ (3) donated dead</span>
          <span><i style="background:#fff;border:1.5px solid var(--ink)"></i>every repair actually fitted</span>
          <span><i style="background:var(--green)"></i>their formulas, w = 1</span>
        </div>
        <div class="note" style="margin-top:9px" id="aWedgeNote">—</div>
      </div>
    </div>
  </div>

  <!-- FULL WIDTH, AND NOT FOR LOOKS.  Seven columns of counts and a 560px plot do not fit in half
       of a 1240px page: in the two-column grid this table needed 160px of horizontal dragging and
       two of its columns — the two that carry the answer, the best scale and the best scale that
       can pay — were the ones behind the drag.  A reader reported it.  A card whose content has an
       intrinsic width belongs outside the grid rather than inside it with a scrollbar. -->
  <div class="card" style="margin-top:18px">
    <h2>The whole catalogue, and the ceiling the escape moves</h2>
    <p class="lead" id="aCatLead">—</p>
    <canvas id="aCat" width="560" height="230"></canvas>
    <table><thead><tr><th class="num">multiplets</th><th class="num">contents</th>
      <th class="num">in window</th><th class="num">hold host</th><th class="num">can pay</th>
      <th class="num">best 1/R₅</th><th class="num">best that pays</th></tr></thead>
      <tbody id="aCatRows"></tbody></table>
    <div class="note" style="margin-top:9px" id="aCatNote">—</div>
  </div>`,

  init(ctx) {
    const rows = ctx.DATA.published_rows.map((r, i) =>
      `<tr class="clk" data-i="${i}"><td>${r.label}</td><td class="num">${r.ours.D8}</td>` +
      `<td class="num" id="ad${i}">—</td><td class="num" id="am${i}">—</td>` +
      `<td id="av${i}">—</td></tr>`).join("");
    document.getElementById("aRows").innerHTML = rows;
    document.getElementById("aRows").querySelectorAll("tr").forEach((tr) =>
      (tr.onclick = () => ctx.load(ctx.DATA.published_rows[+tr.dataset.i].bulk)));

    /* Each published row donated once, through the same modules the header uses. */
    ctx.DATA.published_rows.forEach((r, i) => {
      const m = complete({ schema_version: SCHEMA_VERSION, group: ctx.DATA.group,
                           orbifold: { name: ctx.DATA.orbifold.name }, brane: [], conventions: {},
                           bulk: r.bulk }).model;
      const d = ctx.resolveModel(m).values.get("donation").value;
      const $ = (id) => document.getElementById(id);
      if (!d.available) { $("av" + i).innerHTML = `<span class="chip live">no host</span>`; return; }
      $("ad" + i).textContent = d.D8_after;
      $("am" + i).textContent = d.after.m_h === null ? "—" : d.after.m_h.toFixed(1);
      $("av" + i).innerHTML = !d.survives
        ? `<span class="chip bad">cannot afford it</span>`
        : (d.after.in_window
            ? `<span class="chip thm">affords it, still in window</span>`
            : `<span class="chip ver">affords it, leaves the window</span>`);
    });
  },

  /* ---------------------------------------------------------------- canvas
   *
   * Two pictures, and they draw ONLY what the module computes.  The six anomaly channels are not
   * ported into this kernel and the module says so; drawing six bars for them would turn an
   * `unknown` into a chart, which is the exact failure this whole page is built against.
   */

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 560;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  /* The bill as signed bars about a zero line.  Integers, so the axis is integers: a tick every
   * eighth would be unreadable and a "nice" rounded axis would invent values between them. */
  _bars(bill, held) {
    const [g, W, H] = this._fit(document.getElementById("aBars"), 250);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    /* T leaves room for the value written ABOVE the tallest bar.  At 14 the +80 bar reached the
     * frame and its label was drawn off the canvas, on top of the caption -- a number nobody can
     * read is worse than no number, because the bar still looks measured. */
    const L = 8, R = 8, T = 34, B = 42, iw = W - L - R, ih = H - T - B;
    const rows = bill.slice().sort((a, b) => b.cost8 - a.cost8);
    const lo = Math.min(0, ...rows.map((r) => r.cost8));
    const hi = Math.max(0, ...rows.map((r) => r.cost8));
    const span = (hi - lo) || 1;
    const y0 = T + ih * (hi / span);                     /* where 8D = 0 sits */
    const bw = iw / rows.length;

    g.strokeStyle = "#cfd8e0"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(L, y0 + .5); g.lineTo(L + iw, y0 + .5); g.stroke();

    rows.forEach((r, i) => {
      const x = L + i * bw, h = ih * (Math.abs(r.cost8) / span);
      const n = held(r);
      /* held by THIS content is the accent; the rest is the price list */
      g.fillStyle = n ? (r.cost8 >= 0 ? this._css("--blue") : this._css("--rust"))
                      : (r.cost8 >= 0 ? "#c3dce6" : "#f0d6c4");
      g.fillRect(x + bw * .12, r.cost8 >= 0 ? y0 - h : y0, bw * .76, h);
      g.fillStyle = n ? this._css("--ink") : this._css("--ink3");
      g.font = (n ? "650 " : "") + "9px ui-monospace,monospace";
      g.save();
      g.translate(x + bw / 2, H - B + 6);
      g.rotate(-Math.PI / 4);
      g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText(`${r.rep}${r.key}`, 0, 0);
      g.restore();
      g.textAlign = "center"; g.textBaseline = r.cost8 >= 0 ? "bottom" : "top";
      /* and clamped anyway: a taller content than this one must not push it out again */
      g.fillText(`${r.cost8 > 0 ? "+" : ""}${r.cost8}`, x + bw / 2,
                 r.cost8 >= 0 ? Math.max(T - 2, y0 - h - 2) : Math.min(H - B - 2, y0 + h + 2));
    });
    g.fillStyle = this._css("--ink3"); g.font = "10px ui-monospace,monospace";
    g.textAlign = "left"; g.textBaseline = "top";
    g.fillText("contribution to 8D — eighths of D, exactly", L, 2);
  },

  /* The ladder: 8D on a line of integers, with the donation as a jump along it.  The picture is
   * the theorem -- every reachable rung is ODD, so the line never lands on zero. */
  _ladder(don, D8v) {
    const [g, W, H] = this._fit(document.getElementById("aLadder"), 150);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    if (!D8v || D8v.status === "unknown") return;
    const before = D8v.value;
    const after = don && don.available ? don.D8_before - don.cost8 : null;
    const lo = Math.min(-3, before, after === null ? before : after) - 2;
    const hi = Math.max(3, before, after === null ? before : after) + 2;
    const L = 22, R = 22, y = 74, iw = W - L - R;
    const X = (k) => L + (k - lo) / (hi - lo) * iw;

    g.strokeStyle = "#cfd8e0"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(L, y + .5); g.lineTo(L + iw, y + .5); g.stroke();
    g.font = "9px ui-monospace,monospace"; g.textAlign = "center";
    for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) {
      const odd = ((k % 2) + 2) % 2 === 1;
      g.strokeStyle = odd ? "#8fb6c6" : "#eef3f6";
      g.lineWidth = odd ? 1.4 : 1;
      g.beginPath(); g.moveTo(X(k), y - (odd ? 7 : 3)); g.lineTo(X(k), y + (odd ? 7 : 3)); g.stroke();
      if (k % 4 === 0 || k === 0) {
        g.fillStyle = k === 0 ? this._css("--rust") : this._css("--ink3");
        g.textBaseline = "top"; g.fillText(String(k), X(k), y + 11);
      }
    }
    /* zero is a rung that does not exist, and it is drawn as such */
    g.strokeStyle = this._css("--rust"); g.setLineDash([3, 3]); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(X(0), y - 26); g.lineTo(X(0), y + 26); g.stroke(); g.setLineDash([]);
    g.fillStyle = this._css("--rust"); g.font = "600 10px ui-monospace,monospace";
    g.textBaseline = "bottom"; g.fillText("8D = 0 is unreachable", X(0), y - 29);

    const pin = (k, col, lab, up) => {
      g.strokeStyle = col; g.lineWidth = 2;
      g.beginPath(); g.moveTo(X(k), y); g.lineTo(X(k), y + (up ? -18 : 18)); g.stroke();
      g.fillStyle = col;
      g.beginPath(); g.arc(X(k), y + (up ? -18 : 18), 5, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = col; g.font = "650 10px ui-monospace,monospace";
      g.textAlign = "center"; g.textBaseline = up ? "bottom" : "top";
      g.fillText(lab, X(k), y + (up ? -26 : 26));
    };
    pin(before, this._css("--blue"), `8D = ${before}`, true);
    if (after !== null) {
      pin(after, after > 0 ? this._css("--green") : this._css("--rust"),
          `after donating: ${after}`, false);
      /* the jump itself, so the price is a length and not a subtraction the reader has to do */
      g.strokeStyle = this._css("--ink3"); g.lineWidth = 1;
      g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(X(before), y - 18); g.lineTo(X(after), y + 18); g.stroke();
      g.setLineDash([]);
      g.fillStyle = this._css("--ink2"); g.font = "10px ui-monospace,monospace";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(`−${don.cost8}/8`, (X(before) + X(after)) / 2, y - 2);
    }
  },

  /* The catalogue: the two ceilings as a function of how many multiplets you are allowed.  Two
   * curves and two flat lines, because that is the whole argument -- the unconstrained best runs
   * away with size, the best that can still pay for the escape does not, and each is capped by a
   * certificate that does not depend on size at all. */
  _cat(cat, here) {
    const [g, W, H] = this._fit(document.getElementById("aCat"), 230);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const rows = cat.rows, esc = cat.escape, ceil = cat.ceiling;
    const L = 46, R = 10, T = 14, B = 30, iw = W - L - R, ih = H - T - B;
    const n0 = rows[0].N, n1 = rows[rows.length - 1].N;
    const hi = Math.max(ceil.ceiling_GeV, ...rows.map((r) => r.best_invR5)) * 1.06;
    const X = (n) => L + (n - n0) / (n1 - n0) * iw;
    const Y = (y) => T + ih * (1 - y / hi);

    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    g.fillStyle = this._css("--ink3"); g.font = "9px ui-monospace,monospace";
    g.textAlign = "right"; g.textBaseline = "middle";
    for (let y = 0; y <= hi; y += 2000) {
      g.beginPath(); g.moveTo(L, Y(y) + .5); g.lineTo(L + iw, Y(y) + .5); g.stroke();
      g.fillText((y / 1000).toFixed(0) + " TeV", L - 5, Y(y));
    }
    g.textAlign = "center"; g.textBaseline = "top";
    for (const r of rows) g.fillText(String(r.N), X(r.N), H - B + 5);
    g.fillText("multiplets allowed in the content", L + iw / 2, H - B + 17);

    const flat = (y, col, lab) => {
      g.strokeStyle = col; g.lineWidth = 1.4; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + iw, Y(y)); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.font = "650 9.5px ui-monospace,monospace";
      g.textAlign = "right"; g.textBaseline = "bottom"; g.fillText(lab, L + iw, Y(y) - 3);
    };
    flat(ceil.ceiling_GeV, this._css("--ink3"),
         `relaxation's ceiling ${(ceil.ceiling_GeV / 1000).toFixed(2)} TeV — any content`);
    flat(esc.ceiling_GeV, this._css("--rust"),
         `${(esc.ceiling_GeV / 1000).toFixed(2)} TeV — any content that can pay`);

    const curve = (key, col, wid) => {
      g.strokeStyle = col; g.lineWidth = wid; g.beginPath();
      let first = true;
      for (const r of rows) {
        if (r[key] == null) continue;
        first ? g.moveTo(X(r.N), Y(r[key])) : g.lineTo(X(r.N), Y(r[key]));
        first = false;
      }
      g.stroke();
      for (const r of rows) {
        if (r[key] == null) continue;
        g.fillStyle = col; g.beginPath(); g.arc(X(r.N), Y(r[key]), 2.6, 0, 7); g.fill();
      }
    };
    curve("best_invR5", this._css("--blue"), 2);
    curve("best_invR5_paying", this._css("--rust"), 2);
    /* Both labels ride the RIGHT end of their own curve, below the point.  Written at the left they
     * sat on top of each other at N=5, where the two curves are the same content. */
    const last = rows[rows.length - 1];
    g.font = "650 9.5px ui-monospace,monospace"; g.textAlign = "right"; g.textBaseline = "top";
    g.fillStyle = this._css("--blue");
    g.fillText("best in window", X(last.N) - 4, Y(last.best_invR5) + 6);
    if (last.best_invR5_paying != null) {
      g.fillStyle = this._css("--rust");
      g.fillText("best that can pay the escape", X(last.N) - 4, Y(last.best_invR5_paying) + 6);
    }

    /* where the content in front of you sits, and nothing more is claimed about it */
    if (here && here.N >= n0 && here.N <= n1) {
      g.strokeStyle = this._css("--ink"); g.lineWidth = 1; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(X(here.N), T); g.lineTo(X(here.N), T + ih); g.stroke();
      g.setLineDash([]);
      g.fillStyle = this._css("--ink"); g.font = "650 9.5px ui-monospace,monospace";
      g.textAlign = X(here.N) > L + iw / 2 ? "right" : "left"; g.textBaseline = "top";
      /* below the top gridline, not on it -- at T+2 it sat across the first tick's label */
      g.fillText(`this content: ${here.N} multiplets`,
                 X(here.N) + (X(here.N) > L + iw / 2 ? -4 : 4), T + 16);
    }
  },

  /* THE WEDGE.  The two inequalities are DERIVED here from the shipped engine -- the gauge D
   * from the empty term table, the per-multiplet weights from the bill -- and the archived
   * fitted points are drawn on top; the harness holds the two to each other, so the region and
   * the record cannot drift apart. */
  _wedge(ctx, bill) {
    const c = document.getElementById("aWedge");
    if (!c || !ctx.DATA.wedge) return;
    const [g, W, H] = this._fit(c, 340);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const WD = ctx.DATA.wedge;
    const gaugeD = moments(termTable({ bulk: [], conventions: {} }, ctx.DATA)).D;
    const costOf = (rep) => bill.find((b) => b.rep === rep && b.key === "(+,+)").cost8 / 8;
    const nOf = (i, rep) => ctx.DATA.published_rows[i].bulk
      .filter((b) => b.rep === rep && b.parities[0] > 0 && b.parities[1] > 0)
      .reduce((s, b) => s + b.multiplicity, 0);
    /* row (2) and row (3), one 84 donated each: D(w) = gauge + k28 w28 + k84 w84 */
    const co = (i) => ({ k28: nOf(i, "28") * costOf("28"),
                         k84: (nOf(i, "84") - 1) * costOf("84") });
    const A = co(1), B = co(2);
    const D2 = (x, y) => gaugeD + A.k28 * x + A.k84 * y;
    const D3 = (x, y) => gaugeD + B.k28 * x + B.k84 * y;

    const X0 = 0.45, X1 = 1.25, Y0 = 0.45, Y1 = 1.25;
    const L = 46, Rp = 12, T = 12, Bm = 34, iw = W - L - Rp, ih = H - T - Bm;
    const X = (x) => L + (x - X0) / (X1 - X0) * iw;
    const Y = (y) => T + ih - (y - Y0) / (Y1 - Y0) * ih;

    /* the region, cell by cell -- the shading IS the two inequalities evaluated */
    const N = 90;
    g.fillStyle = "rgba(31,122,77,.13)";
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const x = X0 + (X1 - X0) * (i + 0.5) / N, y = Y0 + (Y1 - Y0) * (j + 0.5) / N;
        if (D2(x, y) > 0 && D3(x, y) < 0)
          g.fillRect(X(x) - iw / N / 2, Y(y) - ih / N / 2, iw / N + 1, ih / N + 1);
      }

    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "center"; g.textBaseline = "top";
    for (const x of [0.6, 0.8, 1.0, 1.2]) g.fillText(x.toFixed(1), X(x), T + ih + 6);
    g.fillText("w(28)", L + iw / 2, T + ih + 19);
    g.textAlign = "right"; g.textBaseline = "middle";
    for (const y of [0.6, 0.8, 1.0, 1.2]) g.fillText(y.toFixed(1), L - 6, Y(y));
    g.save(); g.translate(12, T + ih / 2); g.rotate(-Math.PI / 2);
    g.textAlign = "center"; g.textBaseline = "top"; g.fillText("w(84)", 0, 0); g.restore();

    /* the two boundary lines, each labelled by what dies on it */
    const line = (k28, k84, col, lab, labY) => {
      g.strokeStyle = col; g.lineWidth = 1.8; g.beginPath();
      let started = false;
      for (let i = 0; i <= 200; i++) {
        const x = X0 + (X1 - X0) * i / 200, y = (-gaugeD - k28 * x) / k84;
        if (y < Y0 - 0.05 || y > Y1 + 0.05) { started = false; continue; }
        started ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y));
        started = true;
      }
      g.stroke();
      g.fillStyle = col; g.font = "600 9.5px " + this._css("--mono");
      g.textAlign = "left"; g.textBaseline = "bottom";
      g.fillText(lab, L + 6, labY);
    };
    line(A.k28, A.k84, this._css("--rust"), "(2) donated dies below this line", Y(0.62));
    line(B.k28, B.k84, this._css("--blue"), "(3) donated comes ALIVE above this one", T + 14);

    /* the diagonal, with the published interval as ticks */
    g.strokeStyle = this._css("--ink3"); g.setLineDash([3, 3]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(X0), Y(X0)); g.lineTo(X(X1), Y(X1)); g.stroke(); g.setLineDash([]);
    for (const w of WD.w_diagonal_interval) {
      g.strokeStyle = this._css("--ink"); g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(X(w) - 4, Y(w) + 4); g.lineTo(X(w) + 4, Y(w) - 4); g.stroke();
    }

    /* the archived repairs, every one -- white circles; w = 1 in green */
    for (const f of WD.fitted) {
      if (f.w28 < X0 || f.w28 > X1 || f.w84 < Y0 || f.w84 > Y1) continue;
      const isOne = Math.abs(f.w28 - 1) < 1e-9 && Math.abs(f.w84 - 1) < 1e-9;
      g.beginPath(); g.arc(X(f.w28), Y(f.w84), isOne ? 6 : 4.5, 0, 7);
      g.fillStyle = isOne ? this._css("--green") : "#fff"; g.fill();
      g.strokeStyle = f.headline ? this._css("--ink") : this._css("--rust");
      g.lineWidth = 1.6; g.stroke();
    }

    const lo = WD.w_diagonal_interval[0], hi = WD.w_diagonal_interval[1];
    document.getElementById("aWedgeNote").innerHTML =
      `Along the diagonal w(28) = w(84) the verdict holds on <b>(${lo.toFixed(3)}, ${hi.toFixed(3)})</b> ` +
      `— a factor ${(hi / lo).toFixed(2)} wide, and it contains w = 1. Every repair the anchor ` +
      `programme actually fitted lands inside; the one hollow point on the boundary is the w at ` +
      `which row (2) would die, drawn so the claim has a visible edge. And <b>w(7), w(48) appear ` +
      `in neither inequality</b>: the headline lives in this plane, so the single largest repair ` +
      `the α column asks for — w(48) = ${WD.w48_largest_repair} — is identically invisible to it. ` +
      `<span class="chip thm">theorem</span> the two inequalities, in exact eighths from this ` +
      `page's own bill; <span class="chip ver">verified</span> the fitted points, archived ` +
      `su7_repair_space.py.`;
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    const bill = v.get("bill").value, don = v.get("donation").value;
    this._wedge(ctx, bill);

    const held = (i) => {
      const b = (r.model.bulk || []).find((x) => x.rep === i.rep &&
        (x.parities[0] > 0 ? "+" : "-") === i.key[1] && (x.parities[1] > 0 ? "+" : "-") === i.key[3]);
      return b ? b.multiplicity : 0;
    };
    $("aBill").innerHTML = bill.map((b) => {
      const n = held(b);
      return `<tr${n ? ' style="background:#f7fafc"' : ""}><td style="font-family:var(--mono)">` +
             `${b.rep}${b.key}</td><td class="num">${b.cost8 > 0 ? "+" : ""}${b.cost8}</td>` +
             `<td class="num">${n || "—"}</td></tr>`;
    }).join("");

    this._bars(bill, held);
    this._ladder(don, v.get("D8"));
    /* THE THEOREM THE LADDER DRAWS IS CONDITIONAL, and the published Part VII says on what: the
     * gauge coefficients as printed.  On the candidate seed of its section 13 the rung 8D = 0
     * exists on the lattice, and this panel must not keep drawing a theorem the model has
     * stepped off. */
    const seed = v.get("seed") ? v.get("seed").value : null;
    $("aLadderNote").innerHTML = !seed || seed.parity_of_8D === "odd"
      ? `<span style="font-family:var(--mono)">8D</span> is an <b>odd integer</b> — Part VII, ` +
        `Theorem 1, whose hypothesis the gauge coefficients as printed meet — so ` +
        `<span style="font-family:var(--mono)">D</span> can never be zero and the electroweak ` +
        `verdict is always well defined. The ladder is in eighths, and the two rungs either side ` +
        `of zero are the closest the vacuum can come to marginal. Nothing here carries a scale: ` +
        `it is a ratio of integers. The theorem is conditional on the seed — Part VII §13 — and ` +
        `the hierarchy section can stand on the other one.`
      : `<b style="color:var(--rust)">On the candidate gauge seed 8D is even</b>, the hypothesis of ` +
        `Theorem 1 is not met, and the rung <span style="font-family:var(--mono)">8D = 0</span> ` +
        `<em>is</em> on the lattice — nine 28(+,−) reach it. What excludes it there is identity ` +
        `(II), not arithmetic: a physical argument, and a weaker one. The bill below is unchanged, ` +
        `because every multiplet's cost is a difference against the gauge sector.`;

    /* the catalogue, which is about the lattice and not about the model -- so it says so, and the
     * only thing the model contributes is a tick marking where it sits */
    const cv = v.get("size_curve");
    const D8v = v.get("D8");
    if (cv.status === "unknown") {
      $("aCatLead").innerHTML = `<b>Not enumerated for this lattice.</b>`;
      $("aCatRows").innerHTML = "";
      $("aCatNote").textContent = cv.reason;
    } else {
      const cat = cv.value, esc = cat.escape, ceil = cat.ceiling;
      const N = (r.model.bulk || []).reduce((s, b) => s + b.multiplicity, 0);
      this._cat(cat, { N });
      $("aCatRows").innerHTML = cat.rows.map((row) => {
        const on = row.N === N;
        return `<tr${on ? ' style="background:#f7fafc;font-weight:650"' : ""}>` +
          `<td class="num">${row.N}</td><td class="num">${row.contents.toLocaleString("en")}</td>` +
          `<td class="num">${row.in_window}</td><td class="num">${row.with_host}</td>` +
          `<td class="num">${row.can_pay}</td>` +
          `<td class="num">${row.best_invR5.toLocaleString("en")}</td>` +
          `<td class="num">${row.best_invR5_paying === null ? "—"
             : row.best_invR5_paying.toLocaleString("en")}</td></tr>`;
      }).join("");
      const canPay = D8v.status !== "unknown" && D8v.value >= esc.min_8D;
      const TV = ctx.DATA.ceilings ? ctx.DATA.ceilings.true_vacuum : null;
      $("aCatLead").innerHTML =
        `Donating the host costs <b>${esc.cost8}/8</b> and D must stay positive, so a content can ` +
        `afford the escape <b>iff 8D ≥ ${esc.min_8D}</b> — on the seed as printed 8D is odd, so ` +
        `there is no slack in it. The certified ceiling is monotone in D, so that one integer ` +
        `moves it: <b>${(esc.ceiling_GeV / 1000).toFixed(2)} TeV</b> for a content that can pay, ` +
        `against <b>${(ceil.ceiling_GeV / 1000).toFixed(2)} TeV</b> when the escape is not ` +
        `required — a factor <b>${esc.ratio}</b>, both the relaxation's bounds` +
        (TV ? ` (with the vacuum required to be the true one the unconstrained level is ` +
              `<b>${(TV.GeV / 1000).toFixed(2)} TeV</b>; the paying branch has not been recomputed ` +
              `under that condition, so ${(esc.ceiling_GeV / 1000).toFixed(2)} stays a bound)` : ``) +
        `. This content has <b>8D = ${D8v.value}</b>, so it ` +
        (canPay ? `<span style="color:var(--green)">can pay</span>.`
                : `<span style="color:var(--rust)">cannot</span>.`);
      $("aCatNote").innerHTML =
        `The content that generates the largest hierarchy is exactly the one that cannot pay: the ` +
        `champion of the unconstrained ceiling sits on <span style="font-family:var(--mono)">8D = ` +
        `${ceil.ceiling_8D}</span>, the quantum, and the bill is ${esc.cost8}/8. <b>This bounds the ` +
        `content before the donation</b> — the row that pays. It does not bound the world after: ` +
        `the post-donation bulk needs only 8D ≥ 1, which is the unconstrained ceiling again. ` +
        `<span class="chip ver">verified</span> ${cv.source}.`;
    }

    /* THE SIX CHANNELS, COMPUTED.  Part VI §3 on the brane content of the record -- their one
     * generation on rung 0 unless the record says otherwise -- with X_Q forced by the anomalies
     * and the neutrino the two uncancellable channels demand. */
    const ch = v.get("channels");
    if (ch.status === "unknown") {
      $("aChan").innerHTML = `<b>Not computed here</b><span>${ch.reason}</span>`;
    } else {
      const c = ch.value, br = v.get("brane").value;
      $("aChan").className = "verdict " + (c.allCancel ? "breaks" : "stable");
      $("aChan").innerHTML =
        `<b>${c.allCancel ? "All six cancel" : "They do not all cancel"} at X_Q = ${br.X_Q}` +
        `${br.X_Q_forced ? " — forced by three of them" : ""}</b>` +
        `<span>${br.N} generation${br.N > 1 ? "s" : ""} on rung${br.N > 1 ? "s" : ""} ` +
        `${br.rungs.join(", ")}; proton-operator charge${br.N > 1 ? "s" : ""} A = (${c.A.join(", ")}) — ` +
        (c.protects ? `every generation protected.` : `<b>A = 0: no protection at this generation number.</b>`) +
        ` Neutrinos kept: ${c.nus.length ? c.nus.join(", ") : "none"}. ` +
        `<span class="chip thm">theorem</span></span>` +
        `<table style="margin-top:8px"><thead><tr><th>channel</th><th class="num">as polynomial in X_Q</th>` +
        `<th class="num">vanishes at</th><th class="num">bare</th><th class="num">with ν_R</th></tr></thead><tbody>` +
        c.table.map((r, i) => {
          const p = c.polynomials[i];
          return `<tr><td style="font-family:var(--mono)">${r.label}</td>` +
                 `<td class="num">${p.poly}</td>` +
                 `<td class="num">${Array.isArray(p.roots) ? (p.roots.length ? p.roots.join(", ") : "never") : p.roots}</td>` +
                 `<td class="num">${r.bare}</td><td class="num">${r.withNu}</td></tr>`;
        }).join("") + `</tbody></table>`;
    }

    if (!don.available) {
      $("aLead").innerHTML = `This content holds no <b>84(+,+)</b>, so the escape Part VI ` +
        `classifies has no host in it. Load one of the published rows — every one of them ` +
        `contains the host already.`;
      $("aDon").innerHTML = `<div class="verdict stable"><b>No host in this content</b>` +
        `<span>The escape needs an 84(+,+) to carry the family-dependent charge.</span></div>`;
      return;
    }

    const fr = (n) => `${n}/8`;
    $("aLead").innerHTML =
      `The escape costs <b>${fr(don.cost8)}</b> of D, exactly. This content has ` +
      `<b>${fr(don.D8_before)}</b>, so donating the host leaves <b>${fr(don.D8_after)}</b> — ` +
      (don.survives
        ? `still positive, so electroweak symmetry still breaks.`
        : `<span style="color:var(--rust)">not positive: the vacuum is gone, and this row cannot ` +
          `afford the escape.</span>`);

    const a = don.after;
    $("aDon").innerHTML =
      `<div class="pair">
         <div class="stat"><div class="k">8D before</div><div class="v">${don.D8_before}</div>
           <div class="s">the content as it stands</div></div>
         <div class="stat"><div class="k">8D after</div>
           <div class="v" style="color:${don.survives ? "var(--green)" : "var(--rust)"}">${don.D8_after}</div>
           <div class="s">one ${don.host} donated to the brane</div></div>
       </div>
       <div class="verdict ${don.survives ? (a.in_window ? "breaks" : "") : "stable"}"
            style="margin-top:12px">
         <b>${don.survives ? (a.in_window ? "Affords the escape, and stays in the window"
                                          : "Affords the escape, but leaves the Higgs window")
                           : "Cannot afford the escape"}</b>
         <span>${don.survives
           ? (a.m_h === null
               ? "After donation the stationary point is no longer a minimum."
               : `After donation m<sub>h</sub> = ${a.m_h.toFixed(2)} GeV and 1/R₅ = ` +
                 `${Math.round(a.invR5)} GeV. Both are <span class="chip mea">measured</span> and ` +
                 `carry the anchor band.`)
           : `Removing ${fr(don.cost8)} from ${fr(don.D8_before)} leaves ${fr(don.D8_after)}, and ` +
             `D must be positive for electroweak symmetry to break at all.`}</span>
       </div>`;
  },
};

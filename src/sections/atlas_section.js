/* atlas_section.js — "Atlas": the whole SU(7) lattice at five multiplets, every potential drawn.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The SU(4) atlas draws 119 tori; here a tile is a curve, because this model has one phase.  The
 * point of drawing all 1 286 is a single sentence made visible: ONE tile lands in the Higgs
 * window, and it is their row (2) — the uniqueness the anomalies section states as a count, seen
 * as a picture.  Click any tile and its content loads into the model, so the whole family's
 * sections follow it.
 *
 * One canvas, not 1 286 elements: the grid is drawn and hit-tested by arithmetic, which is what
 * keeps a lattice-sized atlas responsive.  Computed on demand (a button), cached until pressed
 * again; the six-atom factoring makes the compute itself about a second.
 *
 * Edited BY HAND.
 */
let ATLAS7 = null;
let ATLAS7_FILTER = "all";
let ATLAS7_SEL = null;
const ATLAS_SECTION = {
  id: "atlas7",
  label: "Atlas",
  paper: "Part VII",
  ready: true,
  modules: [...modules(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="a7Lead">Every content of at most five multiplets — <b>1 286 of them</b> —
    with its one-loop potential drawn.${helpMark("one-loop-potential")} Press the button; the six-atom factoring pays the windings
    once and each curve is six multiply-adds per point.</p>
    <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;align-items:center">
      <button class="ghost" id="a7Go">▶ draw the whole lattice</button>
      <span id="a7Filters" style="display:flex;gap:6px;flex-wrap:wrap"></span>
      <span class="note" id="a7Note"></span>
    </div>
  </div>

  <div class="card">
    <div class="verdict stable" id="a7Sel" style="margin-bottom:12px"><b>—</b>
      <span>Draw the atlas, then click a tile: its numbers appear here and one more click loads
      it into the model.</span></div>
    <canvas id="a7Canvas" width="1200" height="200"></canvas>
    <div class="legend" style="margin-top:9px">
      <span><i style="background:var(--green)"></i>in the Higgs window</span>
      <span><i style="background:var(--rust)"></i>breaks, but a false vacuum</span>
      <span><i style="background:var(--blue)"></i>breaks, true vacuum, outside the window</span>
      <span><i style="background:var(--amber)"></i>D &gt; 0 but no small-α solution</span>
      <span><i style="background:#b9c4cc"></i>no breaking</span>
    </div>
    <div class="note" style="margin-top:9px" id="a7Counts">—</div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("a7Go").onclick = () => {
      $("a7Note").textContent = "summing the atoms…";
      setTimeout(() => {
        ATLAS7 = buildAtlas7(ctx.DATA);
        ATLAS7_SEL = null;
        ctx.refresh();
      }, 20);
    };
    const FILTERS = [["all", "all"], ["window", "in window"], ["falsevac", "false vacua"],
                     ["breaks", "outside the window"], ["nobreak", "no breaking"]];
    $("a7Filters").innerHTML = FILTERS.map(([k, lab]) =>
      `<button class="ghost" data-f="${k}">${lab}</button>`).join("");
    $("a7Filters").querySelectorAll("button").forEach((b) =>
      (b.onclick = () => { ATLAS7_FILTER = b.dataset.f; ATLAS7_SEL = null; ctx.refresh(); }));
    $("a7Canvas").onclick = (e) => {
      if (!this._layout) return;
      const r = e.target.getBoundingClientRect();
      const x = (e.clientX - r.left) * (this._layout.W / r.width);
      const y = (e.clientY - r.top) * (this._layout.Hc / r.height);
      const col = Math.floor(x / this._layout.tw), row = Math.floor(y / this._layout.th);
      const i = row * this._layout.cols + col;
      if (col >= 0 && col < this._layout.cols && i >= 0 && i < this._layout.list.length) {
        ATLAS7_SEL = this._layout.list[i];
        ctx.refresh();
      }
    };
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    document.getElementById("a7Filters").querySelectorAll("button").forEach((b) => {
      b.style.color = b.dataset.f === ATLAS7_FILTER ? "var(--rust)" : "";
      b.style.fontWeight = b.dataset.f === ATLAS7_FILTER ? "650" : "";
    });
    if (!ATLAS7) { this._counts(ctx, null); return; }
    $("a7Note").textContent = "";
    this._draw(ctx);
    this._detail(ctx);
    this._counts(ctx, ATLAS7.counts);
  },

  _fitW(c) { return c.clientWidth || 1200; },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },
  _COL: { window: "--green", falsevac: "--rust", breaks: "--blue", nosol: "--amber" },

  _draw(ctx) {
    const c = document.getElementById("a7Canvas");
    const W = this._fitW(c);
    /* sorted by alpha, the hierarchy corner first; the classes are colour, not position */
    const list = ATLAS7.tiles
      .map((t, i) => i)
      .filter((i) => ATLAS7_FILTER === "all" || ATLAS7.tiles[i].cls === ATLAS7_FILTER)
      .sort((a, b) => {
        const ta = ATLAS7.tiles[a], tb = ATLAS7.tiles[b];
        if ((ta.alpha === null) !== (tb.alpha === null)) return ta.alpha === null ? 1 : -1;
        return (ta.alpha ?? 9) - (tb.alpha ?? 9);
      });
    const tw = 50, th = 32;
    const cols = Math.max(4, Math.floor(W / tw));
    const rows = Math.ceil(list.length / cols);
    const Hc = rows * th;
    const d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = Hc * d; c.style.height = Hc + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, W, Hc);
    this._layout = { cols, tw, th, W, Hc, list };

    const G = ATLAS7.alphas, N = G.length;
    list.forEach((ti, k) => {
      const t = ATLAS7.tiles[ti];
      const x0 = (k % cols) * tw, y0 = Math.floor(k / cols) * th;
      const sel = ATLAS7_SEL === ti;
      if (t.cls === "window" || sel) {
        g.fillStyle = t.cls === "window" ? this._css("--green-l") : "#eef3f6";
        g.fillRect(x0 + 1, y0 + 1, tw - 2, th - 2);
      }
      const col = this._COL[t.cls] ? this._css(this._COL[t.cls]) : "#b9c4cc";
      const span = (t.hi - t.lo) || 1;
      g.strokeStyle = col; g.lineWidth = t.cls === "window" ? 1.8 : 1.1; g.beginPath();
      for (let i = 0; i < N; i++) {
        const x = x0 + 3 + (tw - 6) * i / (N - 1);
        const y = y0 + 3 + (th - 6) * (1 - (t.curve[i] - t.lo) / span);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      if (t.alpha !== null && t.alpha < G[N - 1]) {
        const xi = (t.alpha - G[0]) / (G[N - 1] - G[0]);
        g.fillStyle = col;
        g.beginPath();
        g.arc(x0 + 3 + (tw - 6) * xi, y0 + th - 5, 1.8, 0, 7);
        g.fill();
      }
      if (sel) {
        g.strokeStyle = this._css("--ink"); g.lineWidth = 1.6;
        g.strokeRect(x0 + 0.5, y0 + 0.5, tw - 1, th - 1);
      }
    });
  },

  _detail(ctx) {
    const $ = (id) => document.getElementById(id);
    const el = $("a7Sel");
    if (ATLAS7_SEL === null) {
      el.className = "verdict stable";
      el.innerHTML = `<b>${this._layout.list.length.toLocaleString("en")} tiles drawn</b>` +
        `<span>Sorted by α_min, the large-hierarchy corner first. Click one.</span>`;
      return;
    }
    const t = ATLAS7.tiles[ATLAS7_SEL];
    const name = t.mult.map((k, i) => k
      ? `${k > 1 ? k + "×" : ""}${ATLAS7.slots[i].rep}${ATLAS7.slots[i].key}` : "")
      .filter(Boolean).join(" + ");
    const VERDICT = {
      window: ["In the Higgs window", "breaks"],
      falsevac: ["A false vacuum", "stable"],
      breaks: ["Breaks, true vacuum, m_h outside the window", ""],
      nosol: ["D > 0 but the fixed point finds no small-α solution", "stable"],
      nobreak: ["No electroweak breaking", "stable"],
    }[t.cls];
    el.className = "verdict " + VERDICT[1];
    el.innerHTML = `<b>${name} — ${VERDICT[0]}</b>` +
      `<span>8D = ${t.D8} · A₄ = ${t.A4} · 2W = ${2 * t.W}` +
      (t.alpha !== null ? ` · α_min = ${t.alpha.toFixed(4)} · m_h = ${t.mh === null ? "—" : t.mh.toFixed(1) + " GeV"}` : "") +
      (t.hasHost ? ` · holds the host${t.canPay ? ", can pay the escape" : ", cannot pay"}` : " · no host") +
      ` &nbsp; <button class="ghost" id="a7Load">→ load into the model</button></span>`;
    $("a7Load").onclick = () => ctx.load(t.mult.map((k, i) => k ? {
      rep: ATLAS7.slots[i].rep,
      parities: [ATLAS7.slots[i].key[1] === "+" ? 1 : -1, ATLAS7.slots[i].key[3] === "+" ? 1 : -1],
      multiplicity: k,
    } : null).filter(Boolean));
  },

  _counts(ctx, k) {
    const $ = (id) => document.getElementById(id);
    const arch = (ctx.DATA.size_curve || [])[0];
    if (!k) {
      $("a7Counts").innerHTML = arch
        ? `Not drawn yet. The archived enumeration says what to expect: <b>${arch.contents.toLocaleString("en")}</b> ` +
          `contents at five multiplets, <b>${arch.in_window}</b> in the Higgs window. The button ` +
          `above recomputes all of it here, and the counts must land on the archive or this ` +
          `panel says so.`
        : "—";
      return;
    }
    const agree = arch && k.contents === arch.contents && k.window === arch.in_window &&
                  k.window_with_host === arch.with_host && k.window_can_pay === arch.can_pay;
    $("a7Counts").innerHTML =
      `<b>${k.contents.toLocaleString("en")}</b> contents: <b>${k.window}</b> in the window · ` +
      `${k.falsevac} false vacua · ${k.breaks} true vacua outside the window · ` +
      `${k.nosol} with no small-α solution · ${k.nobreak} that never break. ` +
      (agree
        ? `All four archived counts land exactly — contents, in window, holding the host, able ` +
          `to pay — so the picture above IS ceiling_ilp.py's row, drawn: <b>one green tile out ` +
          `of ${k.contents.toLocaleString("en")}, and it is their row (2)</b>. ` +
          `<span class="chip ver">verified</span> against the archived enumeration.`
        : `<b style="color:var(--rust)">The recomputed counts do NOT match the archived ` +
          `enumeration — the page is broken, and this sentence is the alarm.</b>`);
  },
};

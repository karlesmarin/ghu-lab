/* torus_panels.js — the plan and the relief, as one pair any section can mount.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Three of the five sections work over the same object — the one-loop potential on the Wilson-line
 * torus — and two of them had four panels each in ghu-explorer and arrived here as text.  This is
 * the pair, written once: the plan with its contours on the left, the same V as a turnable relief
 * on the right, both of them CONTROLS, plus the field released on it.
 *
 * The domain is the real one.  alpha_1 has period 2 and alpha_2 has period 1 — measured on this
 * engine in _test_wilson.mjs, with the control that alpha_1 is not 1-periodic — so the panels are
 * 2:1 and the walkers wrap at 2 and at 1 respectively.  The tools this comes from draw the unit
 * square and call it "one period each", which is right for alpha_2 and wrong for alpha_1.
 *
 * Every mounted pair keeps its own state; nothing here is a singleton, because two sections mount
 * it on one page and a shared cursor would make each one lie about the other.
 */
/* Desaturated, not hidden.  A region the rule says you need not search is still part of the
 * object; painting it out would be a claim that it is not there, which is a different statement
 * and a false one. */
function TP_GREY(c) {
  const y = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return [Math.round(0.30 * c[0] + 0.70 * y), Math.round(0.30 * c[1] + 0.70 * y),
          Math.round(0.30 * c[2] + 0.70 * y)];
}

/* THE SURFACES ALREADY BUILT, keyed by everything they depend on: the spectrum, the winding
 * cut-off, and the grid.  Module-wide rather than per mount, because a section switch re-injects the
 * markup and mounts the pair again -- a cache inside the closure is thrown away exactly when it was
 * about to be useful.  Bounded and oldest-out: each entry is a 129x65 Float64Array, about 67 kB,
 * and four of them is a rounding error against holding none. */
const TORUS_FIELDS = new Map();
const TORUS_FIELDS_MAX = 4;

function makeTorusPanels(cfg) {
  const ids = cfg.ids;                       /* { map, surf, cur, mode, sim, basins } */
  const H = cfg.height || 330;
  /* V is a TRIGONOMETRIC POLYNOMIAL, and that is what decides the grid rather than taste.  Its
   * frequencies are q·k with q the Wilson-line charges and k the lattice, so for this model
   * (q ≤ 2, |k| ≤ 10) it carries at most 40 cycles across alpha_1's period of 2 and 20 across
   * alpha_2's period of 1.  Nyquist therefore wants 81 x 41 samples, and a square 64 x 64 grid
   * — which is what this shipped with — is ABOVE Nyquist in alpha_2 and BELOW it in alpha_1:
   * aliased in one direction only, and in exactly the direction the 2:1 domain predicts.
   *
   * So the grid is rectangular, like the domain.  Above Nyquist there is no aliasing left; what
   * remains is interpolation error between nodes, which shrinks with N instead of being wrong at
   * every N. */
  const NX = cfg.gridX || 128, NY = cfg.gridY || 64;

  const P = {
    view: surfaceView({ n: 40 }),
    cur: null, sp: null, field: null, vac: null, box: null, proj: null,
    mode: "move", walk: null, raf: 0, seed: 12345, base: null, tint: null,
  };

  const el = (k) => document.getElementById(ids[k]);
  const fit = (c) => {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 560;
    c.width = w * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, H];
  };

  /* The plot box is forced to the domain's own 2:1.  Whatever the panel leaves over is not a
   * ratio, and a plan whose two axes have different scales is one where a distance is not one. */
  const boxOf = (W, Ht) => {
    const L = 40, R = 10, T = 10, B = 26;
    let iw = W - L - R, ih = iw * PERIODS[1] / PERIODS[0];
    if (ih > Ht - T - B) { ih = Ht - T - B; iw = ih * PERIODS[0] / PERIODS[1]; }
    return { L, T: T + (Ht - T - B - ih) / 2, iw, ih };
  };

  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => k / 12);
  const dom = (a) => [a[0] / PERIODS[0], a[1] / PERIODS[1]];       /* alpha -> [0,1]^2 */
  const alpha = (p) => [p[0] * PERIODS[0], p[1] * PERIODS[1]];

  /* ---------------------------------------------------------------- the two paints */

  /* An offscreen canvas at the panel's geometry.  The base is what costs: 4096 heat cells, the
   * contours, and a 1600-quad relief.  Re-rendering it per animation frame is what dropped the
   * released field to 11 fps -- the page it was ported from blits a cached base and draws only the
   * walkers, and so does this. */
  function offscreen(W, Ht) {
    const d = window.devicePixelRatio || 1;
    const c = document.createElement("canvas");
    c.width = Math.round(W * d); c.height = Math.round(Ht * d);
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [c, g];
  }

  function drawMapBase(g, W, Ht) {
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, Ht);
    const b = boxOf(W, Ht); P.box = b;
    if (!P.field) { g.strokeStyle = "#e6edf2"; g.strokeRect(b.L + .5, b.T + .5, b.iw - 1, b.ih - 1); return g; }
    const cw = b.iw / NX, ch = b.ih / NY;
    for (let i = 0; i < NX; i++)
      for (let j = 0; j < NY; j++) {
        let c = surfaceRamp(P.field.height((i + .5) / NX, (j + .5) / NY));
        if (P.tint && P.tint((i + .5) / NX, (j + .5) / NY)) c = TP_GREY(c);
        g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        g.fillRect(b.L + i * cw, b.T + b.ih - (j + 1) * ch, cw + 0.6, ch + 0.6);
      }
    surfaceContours(g, P.field, 72, b, LEVELS, "rgba(255,255,255,.32)");
    g.strokeStyle = "#cfd8e0"; g.lineWidth = 1;
    g.strokeRect(b.L + .5, b.T + .5, b.iw - 1, b.ih - 1);
    g.fillStyle = "#7d8c99"; g.font = "10px ui-monospace,monospace";
    g.textAlign = "center"; g.textBaseline = "top";
    g.fillText("α₁  (period 2)", b.L + b.iw / 2, b.T + b.ih + 7);
    g.save(); g.translate(11, b.T + b.ih / 2); g.rotate(-Math.PI / 2);
    g.fillText("α₂  (period 1)", 0, 0); g.restore();
  }

  function drawReliefBase(g, W, Ht) {
    g.fillStyle = "#0c161d"; g.fillRect(0, 0, W, Ht);
    if (!P.field) { P.proj = null; return; }
    P.proj = paintSurface(g, P.view, PERIODS, P.field,
                          { frame: { x: 8, y: 8, w: W - 16, h: Ht - 26 }, levels: LEVELS,
                            tint: P.tint
                              ? (i, j, rgb) => (P.tint((i + .5) / P.view.n, (j + .5) / P.view.n)
                                  ? TP_GREY(rgb) : rgb)
                              : null });
    g.font = "600 10px ui-monospace,monospace";
    surfaceAxisLabels(g, P.proj, ["α₁", "α₂"]);
    g.fillStyle = "#7d8c99"; g.font = "10px ui-monospace,monospace";
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    const long = "drag to move α · shift-drag to turn · wheel raises";
    g.fillText(g.measureText(long).width < W - 16 ? long : "drag: move α · shift: turn", 8, Ht - 7);
  }

  /* The base is rebuilt only when what it draws changed: the content, the camera, or the panel
   * width.  Moving the cursor does none of those, so a drag blits and draws two crosses. */
  function baseKey(W) {
    return [W, P.field ? P.field.lo : "x", P.field ? P.field.hi : "x",
            P.view.az.toFixed(4), P.view.el.toFixed(4), P.view.h.toFixed(4)].join("|");
  }

  function ensureBase() {
    const mapEl = el("map"), surfEl = el("surf");
    const W = mapEl.clientWidth || 560, Ws = surfEl.clientWidth || 560;
    const key = baseKey(W + ":" + Ws);
    if (P.base && P.base.key === key) return P.base;
    const [cm, gm] = offscreen(W, H), [cs, gs] = offscreen(Ws, H);
    drawMapBase(gm, W, H);
    drawReliefBase(gs, Ws, H);
    P.base = { key, map: cm, surf: cs, w: W, ws: Ws };
    return P.base;
  }

  /* Blit the two bases and draw everything that moves on top of them. */
  function paint() {
    const base = ensureBase();
    const [gm, W] = fit(el("map")), [gs, Ws] = fit(el("surf"));
    gm.drawImage(base.map, 0, 0, W, H);
    gs.drawImage(base.surf, 0, 0, Ws, H);
    const b = P.box;
    const mark = (p, col, r) => {
      const X = b.L + p[0] * b.iw, Y = b.T + b.ih - p[1] * b.ih;
      gm.strokeStyle = col; gm.lineWidth = 2;
      gm.beginPath(); gm.moveTo(X - r, Y - r); gm.lineTo(X + r, Y + r);
      gm.moveTo(X + r, Y - r); gm.lineTo(X - r, Y + r); gm.stroke();
    };
    if (P.walk) {
      for (const w of P.walk) {
        const p = [w.x / PERIODS[0], w.y / PERIODS[1]];
        gm.fillStyle = "rgba(181,83,15,.85)";
        gm.beginPath(); gm.arc(b.L + p[0] * b.iw, b.T + b.ih - p[1] * b.ih, 2.1, 0, 7); gm.fill();
        if (P.proj) {
          const q = P.proj(p[0], p[1], P.field.height(p[0], p[1]));
          gs.fillStyle = "rgba(255,196,140,.9)";
          gs.beginPath(); gs.arc(q[0], q[1], 2.1, 0, 7); gs.fill();
        }
      }
      return;
    }
    if (P.field) {
      if (P.vac) { mark(dom(P.vac), "#B5530F", 7);
                   surfaceStem(gs, P.proj, P.field, ...dom(P.vac), { colour: "#B5530F" }); }
      if (P.cur) { mark(P.cur, "#1B6F8C", 5);
                   surfaceStem(gs, P.proj, P.field, P.cur[0], P.cur[1],
                               { colour: "#1B6F8C", cross: true }); }
    }
    readout();
  }

  function readout() {
    const e = el("cur");
    if (!e) return;
    if (!P.field) { e.textContent = "—"; return; }
    if (!P.cur) {
      e.innerHTML = "The cursor is at the vacuum. <b>Drag either panel</b> to stand somewhere else.";
      return;
    }
    const a = alpha(P.cur), LATT = lattice(cfg.data.kmax);
    const here = V(P.sp, LATT, a[0], a[1]);
    const [g1, g2] = gradV(P.sp, LATT, a[0], a[1]);
    const depth = P.vac ? here - V(P.sp, LATT, P.vac[0], P.vac[1]) : null;
    e.innerHTML =
      `You are at <b style="font-family:var(--mono)">α = (${a[0].toFixed(3)}, ${a[1].toFixed(3)})</b>` +
      ` · V = <b style="font-family:var(--mono)">${here.toExponential(3)}</b>` +
      ` · |∇V| = <b style="font-family:var(--mono)">${Math.hypot(g1, g2).toExponential(1)}</b>` +
      (depth === null ? "" :
        ` · <b style="font-family:var(--mono)">${depth.toExponential(2)}</b> above the vacuum`) +
      ` <button class="ghost" data-tp-home="1">go back to the vacuum</button>`;
    const h = e.querySelector("[data-tp-home]");
    if (h) h.onclick = () => { P.cur = null; paint(); };
  }

  /* ---------------------------------------------------------------- the field, released */

  /* Damped Newton on V from many random starts.  It is the ZERO MODE — one alpha for all of space,
   * with friction — and not a lattice field simulation, which is stated on the page because the
   * picture invites the stronger reading. */
  function release(nWalkers, friction) {
    if (!P.sp || !P.field) return;
    stop();
    P.seed = 12345;                       /* the same release every time: a run you can repeat */
    const rnd = () => (P.seed = (P.seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    P.walk = Array.from({ length: nWalkers },
                        () => ({ x: rnd() * PERIODS[0], y: rnd() * PERIODS[1], vx: 0, vy: 0 }));
    /* The walkers roll on the FIELD THAT IS DRAWN, by finite differences on the same bilinear
     * interpolant the two panels read — not on a freshly summed V.
     *
     * That is a choice with a cost and it is stated on the page: the basins are resolved to the
     * grid, so two wells closer together than one cell are one well here.  The alternative was
     * measured rather than assumed: summing V exactly costs 420 gradients per frame, each four
     * winding sums of 440 lattice points, about three million cosines a frame — eleven frames a
     * second, which is not a field you can watch.  And a walker rolling on a surface that is not
     * the one in front of you is worse than a coarse one that is. */
    const hx = PERIODS[0] / NX, hy = PERIODS[1] / NY;
    const fieldGrad = (x, y) => {
      const u = x / PERIODS[0], v = y / PERIODS[1], du = 1 / NX, dv = 1 / NY;
      return [(P.field.raw((u + du + 1) % 1, v) - P.field.raw((u - du + 1) % 1, v)) / (2 * hx),
              (P.field.raw(u, (v + dv + 1) % 1) - P.field.raw(u, (v - dv + 1) % 1)) / (2 * hy)];
    };
    let step = 0;
    const dt = 0.9, gam = friction;
    /* the step is scaled by the field's own range, so a deep potential and a shallow one settle in
     * comparable time and the friction slider means the same thing on both */
    const acc = 0.55 / ((P.field.hi - P.field.lo) || 1);
    const frame = () => {
      for (let s = 0; s < 3; s++, step++)
        for (const w of P.walk) {
          const [gx, gy] = fieldGrad(w.x, w.y);
          w.vx = (w.vx - acc * gx * dt) * (1 - gam * dt);
          w.vy = (w.vy - acc * gy * dt) * (1 - gam * dt);
          w.x += 0.012 * w.vx * dt; w.y += 0.012 * w.vy * dt;
          /* wrap on the REAL periods: 2 and 1 */
          w.x -= PERIODS[0] * Math.floor(w.x / PERIODS[0]);
          w.y -= PERIODS[1] * Math.floor(w.y / PERIODS[1]);
        }
      paint();
      if (step >= 420 || typeof requestAnimationFrame !== "function") return settle();
      P.raf = requestAnimationFrame(frame);
    };
    frame();
  }

  /* Which landing points are the SAME vacuum, by the identifications this engine actually has:
   * V(-alpha) = V(alpha), period 1 in alpha_2 and period 2 in alpha_1.  Inside the drawn rectangle
   * that leaves (a1, a2) ~ (a1, 1 - a2) and (a1, a2) ~ (2 - a1, 1 - a2), and NOTHING else.  Folding
   * alpha_1 by 1 — which the tool this comes from did for one build — merges wells that are not
   * the same well. */
  function settle() {
    const wrapd = (u, v, per) => { const d = Math.abs(u - v) % per; return Math.min(d, per - d); };
    const dist = (a, b) => Math.hypot(wrapd(a[0], b[0], PERIODS[0]), wrapd(a[1], b[1], PERIODS[1]));
    const images = (p) => [p, [p[0], PERIODS[1] - p[1]],
                           [PERIODS[0] - p[0], PERIODS[1] - p[1]]];
    const same = (a, b, tol = 0.05) => Math.min(...images(b).map((q) => dist(a, q))) < tol;

    const groups = [];
    for (const w of P.walk) {
      const p = [w.x, w.y];
      const g = groups.find((g) => same(g.rep, p));
      if (g) { g.n++; continue; }
      groups.push({ rep: p, n: 1 });
    }
    const tot = P.walk.length;
    const G = groups.sort((a, b) => b.n - a.n).slice(0, 6);
    const bars = el("basins");
    if (bars)
      bars.innerHTML = G.map((gr) => {
        const at = P.vac && same(gr.rep, P.vac);
        return `<div style="display:flex;gap:9px;align-items:center;margin:4px 0;font-size:12.5px">` +
               `<span style="font-family:var(--mono);min-width:150px">α = ` +
               `${gr.rep[0].toFixed(3)}, ${gr.rep[1].toFixed(3)}${at ? "  ✕" : ""}</span>` +
               `<span style="flex:1;height:9px;background:#eef3f6;border-radius:5px;overflow:hidden">` +
               `<span style="display:block;height:9px;width:${(100 * gr.n / tot).toFixed(1)}%;` +
               `background:${at ? "var(--rust)" : "var(--blue)"}"></span></span>` +
               `<span style="font-family:var(--mono);min-width:38px;text-align:right">` +
               `${(100 * gr.n / tot).toFixed(0)} %</span></div>`;
      }).join("");
    const note = el("sim");
    if (note) {
      const share = G.filter((gr) => P.vac && same(gr.rep, P.vac)).reduce((s, gr) => s + gr.n, 0);
      note.innerHTML = !P.vac ? `${groups.length} basins found.` :
        `<b>${(100 * share / tot).toFixed(0)} %</b> of the field landed in the vacuum ✕, ` +
        `across <b>${groups.length}</b> basin${groups.length === 1 ? "" : "s"}. The identifications ` +
        `used are α₂ → −α₂ and (α₁, α₂) → (−α₁, −α₂), and no fold of α₁ by one period: that would ` +
        `merge wells that are not the same well. The field rolls on the <b>drawn</b> surface, ` +
        `sampled <b>${NX}×${NY}</b> — above Nyquist for this content in both directions, so ` +
        `nothing is aliased; what is left is interpolation between nodes.`;
    }
  }

  /* No frame clock at all (a harness, a stubbed window) means there is no run to cancel; guarded
   * here rather than at three call sites. */
  function stop() {
    if (P.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(P.raf);
    P.raf = 0; P.walk = null;
  }

  /* ---------------------------------------------------------------- mount */

  return {
    state: P,

    /* The markup, so a section does not hand-copy six ids and get one wrong. */
    html({ title, sim = true }) {
      return `
  <div class="card" style="margin-bottom:18px">
    <h2>${title}</h2>
    <div class="pair" style="align-items:start">
      <canvas id="${ids.map}" width="560" height="${H}"></canvas>
      <canvas id="${ids.surf}" width="560" height="${H}"></canvas>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
      <span class="note">relief:</span>
      <span id="${ids.mode}" style="display:flex;gap:4px">
        <button class="st" style="width:auto;padding:0 9px" data-m="move">move &alpha;</button>
        <button class="st" style="width:auto;padding:0 9px" data-m="turn">turn</button>
      </span>
      <span class="note">or hold shift to turn · wheel raises it · double-click resets</span>
      ${sim ? `<button class="ghost" id="${ids.go}">▶ release the field</button>
      <span class="note" id="${ids.sim}"></span>` : ""}
    </div>
    <div class="note" id="${ids.cur}" style="margin-top:9px">—</div>
    ${sim ? `<div id="${ids.basins}" style="margin-top:8px"></div>` : ""}
    <div class="legend">
      <span><i style="background:var(--rust)"></i>the vacuum</span>
      <span><i style="background:var(--blue)"></i>where you are</span>
      <span>dark is low</span>
    </div>
    <div class="note" style="margin-top:9px">&alpha;<sub>1</sub> has period <b>2</b> and
    &alpha;<sub>2</sub> period <b>1</b> — the charges are half-integer, which is why. Both panels
    show <b>one full domain</b>, drawn <b>2:1</b> because it is 2:1; the period is a measured
    property of this engine, not a label.</div>
  </div>`;
    },

    /* Wired once: the canvases outlive every render, and a listener re-attached per render keeps
     * one closure per model alive behind the page. */
    attach() {
      const repaint = coalesced(paint);
      const mapEl = el("map"), surfEl = el("surf");
      let dragMap = false;
      const mapPoint = (e) => {
        if (!P.box) return null;
        const [px, py] = localXY(mapEl, e, mapEl.clientWidth || 560, H);
        const b = P.box;
        return [Math.min(Math.max((px - b.L) / b.iw, 0), 1),
                Math.min(Math.max(1 - (py - b.T) / b.ih, 0), 1)];
      };
      mapEl.style.cursor = "crosshair";
      mapEl.style.touchAction = "none";
      mapEl.addEventListener("pointerdown", (e) => {
        if (!P.field || e.button !== 0 || !e.isPrimary) return;
        try { mapEl.setPointerCapture(e.pointerId); } catch (_) { /* not fatal */ }
        stop(); dragMap = true; P.cur = mapPoint(e); repaint(); e.preventDefault();
      });
      mapEl.addEventListener("pointermove", (e) => { if (dragMap) { P.cur = mapPoint(e); repaint(); } });
      mapEl.addEventListener("dblclick", (e) => { P.cur = null; paint(); e.preventDefault(); });
      window.addEventListener("pointerup", () => { dragMap = false; });
      window.addEventListener("pointercancel", () => { dragMap = false; });

      const surf = attachSurface(surfEl, P.view, {
        width: () => surfEl.clientWidth || 560,
        height: () => H,
        pick: (px, py) => (P.field && P.proj
          ? pickSurface(P.proj, P.field, P.view.n, px, py) : null),
        onPick: (p) => { stop(); P.cur = p; repaint(); },
        onView: paint,
      });
      surf.mode(P.mode);
      const modeEl = el("mode");
      modeEl.querySelectorAll("button[data-m]").forEach((b) => {
        b.classList.toggle("on", b.dataset.m === P.mode);
        b.onclick = () => {
          P.mode = b.dataset.m; surf.mode(P.mode);
          modeEl.querySelectorAll("button[data-m]")
                .forEach((x) => x.classList.toggle("on", x.dataset.m === P.mode));
        };
      });
      const go = el("go");
      if (go) go.onclick = () => { P.cur = null; release(cfg.walkers || 140, cfg.friction || 0.40); };
    },

    /* A new content is a different surface, so the cursor and any run in flight are dropped: a
     * cursor kept across a change would leave the reader standing on a point that no longer means
     * what it did. */
    setContent(sp, vac) {
      stop();
      P.cur = null; P.sp = sp; P.vac = vac || null; P.base = null;
      if (!sp) { P.field = null; paint(); return; }

      /* THE SURFACE IS A FUNCTION OF THE SPECTRUM, so an identical spectrum is an identical
       * surface.  Eight thousand three hundred and eighty-five evaluations of V, each summing four
       * hundred and forty windings over every charge, is about half a second -- and it was being
       * paid again on every re-render of the same content, which is what switching section inside
       * a family is.  The key is the spectrum itself and the winding cut-off it was summed with:
       * those are the only two things the grid depends on. */
      const key = JSON.stringify(sp) + "|" + cfg.data.kmax + "|" + NX + "x" + NY;
      const hit = TORUS_FIELDS.get(key);
      if (hit) { P.field = hit; paint(); return; }

      const LATT = lattice(cfg.data.kmax);
      /* ONE grid evaluation rather than 8385 separate sums -- identical numbers, about seven times
       * faster, and it falls back to the plain sum when VGrid refuses, which it does whenever the
       * charges are not the half-integers its indexing needs. */
      let vals = VGrid(sp, LATT, NX, NY, { p0: PERIODS[0], p1: PERIODS[1] });
      if (!vals) {
        vals = new Float64Array((NX + 1) * (NY + 1));
        for (let j = 0; j <= NY; j++)
          for (let i = 0; i <= NX; i++)
            vals[j * (NX + 1) + i] = V(sp, LATT, PERIODS[0] * i / NX, PERIODS[1] * j / NY);
      }
      P.field = heightField(vals, NX, NY);
      TORUS_FIELDS.set(key, P.field);
      while (TORUS_FIELDS.size > TORUS_FIELDS_MAX)         /* oldest out; a Map keeps insertion order */
        TORUS_FIELDS.delete(TORUS_FIELDS.keys().next().value);
      paint();
    },

    /* Which part of the domain is greyed, in [0,1]^2 of the drawn rectangle.  null paints it all
     * at full colour.  Changing it invalidates the base, because it is part of the base. */
    setTint(fn) { P.tint = fn || null; P.base = null; paint(); },

    paint,
    stop,
  };
}

/* surface.mjs — a height field you can turn, and drag to move the parameters.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * PORTED, not written.  The renderer is the one that has been live in ghu-explorer's
 * `src/calc_shell.html` since July 2026 (`projRaw` / `fitView` / `drawSurface` / `stick` /
 * `pickSurface`), moved here so that the calculator, the eta-meter and the hierarchy section share
 * one painter instead of three.  Everything that was learned there is kept, and the comments say
 * what each piece cost:
 *
 *   - the view is FITTED to the mesh, so turning or raising it still fills the panel;
 *   - the relief reads a cached grid by bilinear interpolation, so turning it costs no winding
 *     sums at all — the panel it replaced spent ~1e8 of them and lagged seconds behind the cursor;
 *   - the shade comes from the discrete normal, not from the height, or a plateau and a cliff at
 *     the same altitude look identical;
 *   - each contour is stroked immediately after ITS OWN quad, so the painter occludes it exactly;
 *   - the axis labels go on the floor edges NEAREST the eye, after the mesh, or the relief hides
 *     them the moment you turn it;
 *   - `pickSurface` prefers, among the vertices near the cursor, the one closest to the VIEWER, so
 *     a hidden far slope never steals the drag.
 *
 * ONE thing changed in the port, and it is the reason the port is not a copy.
 *
 *   The original works on the unit square: `cx = x - .5`.  Our Wilson-line torus is NOT square —
 *   alpha_1 has period 2 and alpha_2 has period 1, measured on this engine and asserted in
 *   _test_wilson.mjs.  Fed to the original, a 2 x 1 domain is drawn 1 x 1 and alpha_1 comes out
 *   squashed by a factor of two, silently, in a picture that looks perfectly plausible.  So the
 *   domain's true extent is an INPUT here (`aspect`), it defaults to nothing, and _test_surface.mjs
 *   contains the control that a 2:1 domain projects 2:1 — a control that fails against the code
 *   this was ported from.
 *
 * No dependency, by decision (DESIGN.md D1): an Edition may not load a script, which rules out
 * three.js and everything built on it.  A height field needs a projection, a depth sort and a
 * shade, and that is this file.
 */

/* The camera.  `az` turns the domain about the vertical, `el` is how far above the plane the eye
 * sits, `h` is the relief scale (the wheel).  Defaults are the live page's. */
export function surfaceView(over = {}) {
  return { az: -0.62, el: 0.66, n: 44, h: 0.40, s: 300, ox: 0, oy: 0, ...over };
}

export const EL_MIN = 0.12, EL_MAX = 1.35;
export const H_MIN = 0.12, H_MAX = 0.90;

/* ------------------------------------------------------------------ the projection */

/* `aspect` is [wx, wy]: the true extent of the domain in its own units, normalised by the caller
 * however it likes as long as the RATIO is real.  [2, 1] for the Wilson torus, [1, 1] for a square
 * domain.  It is required — a default would be the squash this port exists to remove. */
export function surfaceProjector(view, aspect) {
  if (!Array.isArray(aspect) || !(aspect[0] > 0) || !(aspect[1] > 0))
    throw new Error("surfaceProjector needs the domain's true aspect, e.g. [2, 1]; a missing one " +
                    "is how a rectangular domain gets drawn square");
  const m = Math.max(aspect[0], aspect[1]);
  const ax = aspect[0] / m, ay = aspect[1] / m;
  const ca = Math.cos(view.az), sa = Math.sin(view.az);

  /* orthographic, on the domain's own rectangle, h in [0,1]; third component is the depth key */
  const raw = (x, y, h) => {
    const cx = (x - 0.5) * ax, cy = (y - 0.5) * ay;
    const X = cx * ca - cy * sa, Y = cx * sa + cy * ca;
    return [X, Y * Math.sin(view.el) - (h - 0.5) * view.h, Y];
  };
  const P = (x, y, h) => {
    const [u, v, d] = raw(x, y, h);
    return [view.ox + u * view.s, view.oy + v * view.s, d];
  };
  P.raw = raw;
  return P;
}

/* Fit the view to the mesh rather than guessing it: turn it or raise it and it still fills the
 * frame.  Mutates `view.s/ox/oy`, which is what the projector reads. */
export function fitSurfaceView(view, aspect, H, nx, ny, frame) {
  const raw = surfaceProjector(view, aspect).raw;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const [u, v] = raw(i / nx, j / ny, H[j * (nx + 1) + i]);
      if (u < x0) x0 = u; if (u > x1) x1 = u;
      if (v < y0) y0 = v; if (v > y1) y1 = v;
    }
  view.s = Math.min(frame.w / ((x1 - x0) || 1), frame.h / ((y1 - y0) || 1)) * 0.93;
  view.ox = frame.x + frame.w / 2 - (x0 + x1) / 2 * view.s;
  view.oy = frame.y + frame.h / 2 - (y0 + y1) / 2 * view.s;
  return view;
}

/* ------------------------------------------------------------------ the cached field */

/* A grid of values, sampled once, read back by bilinear interpolation and normalised to [0,1].
 * This is the object that makes turning free: the winding sums are paid here, once. */
export function heightField(vals, nx, ny) {
  let lo = Infinity, hi = -Infinity;
  for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = (hi - lo) || 1;
  const at = (i, j) => vals[j * (nx + 1) + i];
  return {
    lo, hi, nx, ny, vals,
    /* x, y in [0,1] over the domain */
    height(x, y) {
      const u = Math.min(Math.max(x, 0), 1) * nx, v = Math.min(Math.max(y, 0), 1) * ny;
      const i = Math.min(Math.floor(u), nx - 1), j = Math.min(Math.floor(v), ny - 1);
      const s = u - i, t = v - j;
      const z = at(i, j) * (1 - s) * (1 - t) + at(i + 1, j) * s * (1 - t)
              + at(i, j + 1) * (1 - s) * t + at(i + 1, j + 1) * s * t;
      return (z - lo) / span;
    },
    raw(x, y) { return this.height(x, y) * span + lo; },
  };
}

/* ------------------------------------------------------------------ the paint */

export function surfaceRamp(t) {
  const stops = [[10, 26, 38], [17, 62, 88], [27, 111, 140], [92, 168, 189], [175, 214, 219],
                 [235, 232, 214], [224, 160, 106]];
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(Math.floor(x), stops.length - 2), f = x - i;
  const a = stops[i], b = stops[i + 1];
  return [Math.round(a[0] + f * (b[0] - a[0])), Math.round(a[1] + f * (b[1] - a[1])),
          Math.round(a[2] + f * (b[2] - a[2]))];
}

/* Draw it.  `field` is a heightField; `levels` are the contour heights in [0,1]; `tint(i, j, rgb)`
 * may recolour a cell — that is how the half of the torus the selection rule forbids is greyed
 * without touching the geometry.
 *
 * Returns the projector, because a stem, a cursor or a vacuum drawn afterwards must use the same
 * one. */
export function paintSurface(g, view, aspect, field, opts = {}) {
  const { levels = [], tint = null, floor = "rgba(255,255,255,.09)", contour = "rgba(255,255,255,.30)",
          frame } = opts;
  const n = view.n;
  const H = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) H[j * (n + 1) + i] = field.height(i / n, j / n);
  if (frame) fitSurfaceView(view, aspect, H, n, n, frame);
  const P = surfaceProjector(view, aspect);

  /* the floor grid first, so the domain stays legible under a tall relief */
  if (floor) {
    g.strokeStyle = floor; g.lineWidth = 1;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const A = P(t, 0, 0), B = P(t, 1, 0), C = P(0, t, 0), D = P(1, t, 0);
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]);
      g.moveTo(C[0], C[1]); g.lineTo(D[0], D[1]); g.stroke();
    }
  }

  const quads = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const h00 = H[j * (n + 1) + i], h10 = H[j * (n + 1) + i + 1],
            h11 = H[(j + 1) * (n + 1) + i + 1], h01 = H[(j + 1) * (n + 1) + i];
      const p00 = P(i / n, j / n, h00), p10 = P((i + 1) / n, j / n, h10),
            p11 = P((i + 1) / n, (j + 1) / n, h11), p01 = P(i / n, (j + 1) / n, h01);
      /* the shade is the discrete normal, not the height: without it a plateau and a cliff at the
       * same altitude are the same colour and the relief reads flat */
      const gx = (h00 + h01 - h10 - h11) * n * view.h / 2;
      const gy = (h00 + h10 - h01 - h11) * n * view.h / 2;
      const len = Math.hypot(gx, gy, 1);
      const lam = Math.max(0.15, (0.55 * gx + 0.35 * gy + 0.9) / (len * 1.35));
      quads.push([Math.min(p00[2], p10[2], p11[2], p01[2]), p00, p10, p11, p01,
                  (h00 + h10 + h11 + h01) / 4, lam, [h00, h10, h11, h01], i, j]);
    }
  quads.sort((a, b) => a[0] - b[0]);                      /* painter: far edge first */

  for (const q of quads) {
    const [, a, b, c, e, hm, lam, hs, i, j] = q;
    let rgb = surfaceRamp(hm);
    if (tint) rgb = tint(i, j, rgb) || rgb;
    g.fillStyle = `rgb(${Math.round(rgb[0] * lam)},${Math.round(rgb[1] * lam)},${Math.round(rgb[2] * lam)})`;
    /* a hairline stroke in the fill colour closes the seams antialiasing leaves between quads */
    g.strokeStyle = g.fillStyle; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
    g.lineTo(c[0], c[1]); g.lineTo(e[0], e[1]); g.closePath();
    g.fill(); g.stroke();

    if (!levels.length) continue;
    const lo4 = Math.min(hs[0], hs[1], hs[2], hs[3]), hi4 = Math.max(hs[0], hs[1], hs[2], hs[3]);
    for (const lev of levels) {
      if (lev <= lo4 || lev >= hi4) continue;
      const edges = [[a, hs[0], b, hs[1]], [b, hs[1], c, hs[2]],
                     [c, hs[2], e, hs[3]], [e, hs[3], a, hs[0]]];
      const cut = [];
      for (const [p0, z0, p1, z1] of edges) {
        if ((z0 - lev) * (z1 - lev) >= 0) continue;
        const t = (lev - z0) / (z1 - z0);
        cut.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
      }
      if (cut.length < 2) continue;
      g.strokeStyle = contour; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cut[0][0], cut[0][1]); g.lineTo(cut[1][0], cut[1][1]); g.stroke();
    }
  }
  return P;
}

/* The same contours, in plan.
 *
 * A linear colour ramp over a field with one tall spike in it spends its whole range on the spike
 * and prints the rest as one flat wash — which is exactly what the plan did the first time these
 * two panels shared a field.  The fix is not to bend the scale, which would make the colours lie
 * about the values; it is to put the contours back, so the structure is carried by lines that are
 * levels of V and nothing else.
 *
 * Marching squares, segment by segment, on the same cached field the relief uses. */
export function surfaceContours(g, field, n, box, levels, style = "rgba(22,32,42,.25)") {
  const z = (i, j) => field.height(i / n, j / n);
  const X = (i) => box.L + (i / n) * box.iw;
  const Y = (j) => box.T + box.ih - (j / n) * box.ih;
  g.strokeStyle = style; g.lineWidth = 1;
  g.beginPath();
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const h = [z(i, j), z(i + 1, j), z(i + 1, j + 1), z(i, j + 1)];
      const p = [[X(i), Y(j)], [X(i + 1), Y(j)], [X(i + 1), Y(j + 1)], [X(i), Y(j + 1)]];
      const lo = Math.min(h[0], h[1], h[2], h[3]), hi = Math.max(h[0], h[1], h[2], h[3]);
      for (const lev of levels) {
        if (lev <= lo || lev >= hi) continue;
        const cut = [];
        for (let e = 0; e < 4; e++) {
          const a = e, b = (e + 1) % 4;
          if ((h[a] - lev) * (h[b] - lev) >= 0) continue;
          const t = (lev - h[a]) / (h[b] - h[a]);
          cut.push([p[a][0] + (p[b][0] - p[a][0]) * t, p[a][1] + (p[b][1] - p[a][1]) * t]);
        }
        if (cut.length < 2) continue;
        g.moveTo(cut[0][0], cut[0][1]); g.lineTo(cut[1][0], cut[1][1]);
      }
    }
  g.stroke();
}

/* A pin standing on the relief: the dashed drop to the floor is what tells you WHERE it stands. */
export function surfaceStem(g, P, field, x, y, { colour, cross = false, radius = 5 } = {}) {
  const top = P(x, y, field.height(x, y)), foot = P(x, y, 0);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([2, 3]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(foot[0], foot[1]); g.lineTo(top[0], top[1]); g.stroke();
  g.setLineDash([]);
  if (cross) {
    for (const [c2, w] of [["rgba(255,255,255,.9)", 4.5], [colour, 2]]) {
      g.strokeStyle = c2; g.lineWidth = w; g.lineCap = "round";
      g.beginPath(); g.moveTo(top[0] - 6, top[1] - 6); g.lineTo(top[0] + 6, top[1] + 6);
      g.moveTo(top[0] + 6, top[1] - 6); g.lineTo(top[0] - 6, top[1] + 6); g.stroke();
    }
  } else {
    g.beginPath(); g.arc(top[0], top[1], radius, 0, 7);
    g.fillStyle = colour; g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 1.8; g.stroke();
  }
  return top;
}

/* The axis labels, on the floor edges nearest the eye and drawn AFTER the mesh. */
export function surfaceAxisLabels(g, P, labels, { ink = "rgba(190,210,222,.95)",
                                                  halo = "rgba(12,22,29,.85)" } = {}) {
  const edges = [[[0.5, 0], labels[0]], [[0.5, 1], labels[0]],
                 [[0, 0.5], labels[1]], [[1, 0.5], labels[1]]]
    .map(([p, s]) => ({ s, q: P(p[0], p[1], 0) }))
    .sort((a, b) => b.q[1] - a.q[1]);
  const centre = P(0.5, 0.5, 0), shown = new Set();
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const e of edges) {
    if (shown.has(e.s)) continue;
    shown.add(e.s);
    const dx = e.q[0] - centre[0], dy = e.q[1] - centre[1], L = Math.hypot(dx, dy) || 1;
    const X = e.q[0] + dx / L * 15, Y = e.q[1] + dy / L * 15;
    g.lineWidth = 3; g.strokeStyle = halo; g.strokeText(e.s, X, Y);
    g.fillStyle = ink; g.fillText(e.s, X, Y);
  }
}

/* ------------------------------------------------------------------ the relief as a control */

/* Which point of the DOMAIN is under the cursor: the nearest mesh vertex in screen space and,
 * among the near ones, the one closest to the viewer — so a far slope hidden behind a ridge never
 * steals the drag.  Returns [x, y] in [0,1]^2, or null. */
/* WHERE A HAND-PLACED LABEL ACTUALLY FITS.
 *
 * A label anchored to a data point is drawn at `anchor + gap` (or `anchor - gap - width` on the
 * other side) and nothing about the anchor knows how wide the plot is.  On 2026-08-30 that printed
 * the hierarchy panel's ceiling as "22 TeV . true vacuum": the label is "9.22 TeV . true vacuum",
 * right-aligned on a point close to the left edge, and the "9." fell off the box.  A cramped label
 * is a cosmetic bug; a label with its first digits sheared off is a WRONG NUMBER on screen, and
 * this instrument's whole claim is that its numbers are the ones it says they are.
 *
 * IT CLAMPS, AND IT DOES NOT FLIP UNLESS TOLD TO.  The first version of this flipped to whichever
 * side had room, and that was worse than the bug: where several levels sit on one row the sides
 * are exactly what keeps their labels apart, so the flip stacked three of them into one smear.
 * A side chosen by hand is information.  Clamping moves a label by the least amount that puts it
 * back in the box and cannot introduce a collision that was not already there; `flip: true` is for
 * a label that owns its row.
 *
 * Returns the x for a LEFT-aligned draw, so the caller stops juggling textAlign.
 *
 *   g.textAlign = "left";
 *   g.fillText(label, fitLabelX(sx(t), g.measureText(label).width, L, L + iw, "right"), y);
 */
export function fitLabelX(anchor, width, lo, hi, prefer = "left", { gap = 11, pad = 2, flip = false } = {}) {
  const l = lo + pad, r = hi - pad;
  /* a label wider than the box cannot be placed; flush left loses the least, because text is read
   * from the left and a truncated tail is visibly truncated where a sheared head is not */
  if (width > r - l) return l;
  const left = anchor + gap, right = anchor - gap - width;
  const want = prefer === "right" ? right : left;
  if (want >= l && want + width <= r) return want;
  if (flip) {
    const other = prefer === "right" ? left : right;
    if (other >= l && other + width <= r) return other;
  }
  return Math.min(Math.max(want, l), r - width);
}

export function pickSurface(P, field, n, px, py, { within = 22 } = {}) {
  let near = null, any = null;
  const r2 = within * within;
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const x = i / n, y = j / n;
      const [X, Y, d] = P(x, y, field.height(x, y));
      const r = (X - px) * (X - px) + (Y - py) * (Y - py);
      if (!any || r < any.r) any = { x, y, r };
      if (r > r2) continue;
      if (!near || d > near.d) near = { x, y, d };
    }
  const p = near || any;
  return p ? [p.x, p.y] : null;
}

export function localXY(el, e, w, h) {
  const b = el.getBoundingClientRect();
  return [(e.clientX - b.left) / b.width * w, (e.clientY - b.top) / b.height * h];
}

/* One repaint per frame however fast the pointer moves — but NEVER fewer than one.
 *
 * The bare requestAnimationFrame version froze the cursor for good the first time a frame did not
 * run (a background tab, a throttled timer), because the pending flag was never cleared.  The
 * timeout is the rescue, and it is why this is a function rather than four lines at each call
 * site. */
export function coalesced(fn, { rescue = 120 } = {}) {
  let raf = 0, timer = 0;
  const run = () => { raf = 0; clearTimeout(timer); timer = 0; fn(); };
  return () => {
    /* No frame clock at all (a harness, a stubbed window): run it now rather than never. */
    if (typeof requestAnimationFrame !== "function") return fn();
    if (raf) return;
    raf = requestAnimationFrame(run);
    timer = setTimeout(() => { if (raf) { cancelAnimationFrame(raf); run(); } }, rescue);
  };
}

/* Wire a canvas up as both a view and a control.
 *
 *   move  drag sets the parameters (`onPick([x, y])`)
 *   turn  drag turns the view; shift-drag turns it in move mode too
 *   wheel raises the relief; double-click puts the view back
 *
 * Returns { detach, mode(m), reset() }.  `detach` matters: a section is torn down and rebuilt when
 * the model changes, and a listener left on a dead canvas keeps the old model alive behind it. */
export function attachSurface(canvas, view, { onPick, onView, pick, width, height,
                                             mode = "move" } = {}) {
  const home = { az: view.az, el: view.el, h: view.h };
  let spin = null, dragging = false, MODE = mode;
  const repaintView = coalesced(() => onView && onView());

  const xy = (e) => localXY(canvas, e, width(), height());

  const down = (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    const [px, py] = xy(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* not fatal */ }
    e.preventDefault();
    if (MODE === "turn" || e.shiftKey) { spin = { px, py, az: view.az, el: view.el }; return; }
    dragging = true;
    const p = pick && pick(px, py);
    if (p && onPick) onPick(p);
  };
  const move = (e) => {
    const [px, py] = xy(e);
    if (spin) {
      view.az = spin.az + (px - spin.px) * 0.011;
      view.el = Math.min(Math.max(spin.el + (py - spin.py) * 0.006, EL_MIN), EL_MAX);
      repaintView();
    } else if (dragging) {
      const p = pick && pick(px, py);
      if (p && onPick) onPick(p);
    }
  };
  const up = () => { spin = null; dragging = false; };
  const wheel = (e) => {
    view.h = Math.min(Math.max(view.h + (e.deltaY > 0 ? -0.04 : 0.04), H_MIN), H_MAX);
    e.preventDefault();
    repaintView();
  };
  const reset = () => { view.az = home.az; view.el = home.el; view.h = home.h; onView && onView(); };
  const dbl = (e) => { reset(); e.preventDefault(); };
  const key = (e) => {
    const d = { ArrowLeft: [-0.09, 0], ArrowRight: [0.09, 0],
                ArrowUp: [0, -0.06], ArrowDown: [0, 0.06] }[e.key];
    if (!d) return;
    view.az += d[0];
    view.el = Math.min(Math.max(view.el + d[1], EL_MIN), EL_MAX);
    e.preventDefault();
    onView && onView();
  };

  canvas.style.touchAction = "none";
  if (!canvas.hasAttribute("tabindex")) canvas.setAttribute("tabindex", "0");
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("dblclick", dbl);
  canvas.addEventListener("keydown", key);
  /* On the WINDOW, not the canvas, and named as such: a drag that leaves the panel must keep
   * working and must still end when the button comes up somewhere else.  Spelled `window.` rather
   * than bare so that a headless harness with a stubbed window can run this file at all. */
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  return {
    reset,
    mode(m) { MODE = m; canvas.style.cursor = m === "turn" ? "grab" : "crosshair"; },
    detach() {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("dblclick", dbl);
      canvas.removeEventListener("keydown", key);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      up();
    },
  };
}

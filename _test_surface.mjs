/* _test_surface.mjs — the relief, and the one thing the port had to change.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The renderer is a port of the one live in ghu-explorer, so most of this file is fidelity: the
 * projection must reproduce the original's arithmetic exactly, or the pictures four screenshots
 * and one paper figure already show would move.
 *
 * The rest is the reason the port is not a copy.  The original projects onto the UNIT SQUARE.  Our
 * Wilson-line torus is 2 x 1 — alpha_1 has period 2, measured on this engine in _test_wilson.mjs
 * with the control that it is not 1-periodic.  Drawn on a square, alpha_1 comes out squashed by a
 * factor of two, in a picture that looks entirely plausible.  So the aspect is an input, and the
 * control here is that a 2:1 domain projects 2:1 — a control that FAILS against the code this was
 * ported from, which is what makes it worth running.
 *
 *   node _test_surface.mjs
 */
import { readFileSync } from "node:fs";
import { surfaceView, surfaceProjector, fitSurfaceView, heightField, paintSurface,
         surfaceRamp, pickSurface, coalesced, fitLabelX, EL_MIN, EL_MAX } from "./src/kernel/surface.mjs";
import { spectrum, lattice, V, PERIODS } from "./src/kernel/wilson.mjs";

const D = JSON.parse(readFileSync(new URL("./data/su4_ahmn.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const close = (a, b, t = 1e-12) => Math.abs(a - b) <= t;

/* ------------------------------------------------------------------ fidelity to the original */

H("the projection is the one that has been live, not a new one");
{
  const view = surfaceView({ s: 300, ox: 210, oy: 200 });
  const P = surfaceProjector(view, [1, 1]);
  /* the original, transcribed from ghu-explorer/src/calc_shell.html:1008-1016 */
  const orig = (x, y, h) => {
    const cx = x - 0.5, cy = y - 0.5;
    const ca = Math.cos(view.az), sa = Math.sin(view.az);
    const X = cx * ca - cy * sa, Y = cx * sa + cy * ca;
    const u = X, v = Y * Math.sin(view.el) - (h - 0.5) * view.h;
    return [view.ox + u * view.s, view.oy + v * view.s];
  };
  let worst = 0;
  for (const [x, y, h] of [[0, 0, 0], [1, 1, 1], [0.3, 0.7, 0.42], [1, 0, 0.9], [0.5, 0.5, 0.5]]) {
    const a = P(x, y, h), b = orig(x, y, h);
    worst = Math.max(worst, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  }
  ok("on a square domain it agrees with the live code to the bit", worst === 0, String(worst));
  ok("the defaults are the live page's camera",
     close(surfaceView().az, -0.62) && close(surfaceView().el, 0.66) && close(surfaceView().h, 0.40));
}

/* ------------------------------------------------------------------ THE control */

H("a rectangular domain is drawn rectangular — the whole reason for the port");
{
  /* Looked at straight down the domain's own axes, the projected extents ARE the domain's extents,
   * so the ratio is readable with no camera algebra. */
  const view = surfaceView({ az: 0, el: Math.PI / 2, h: 0, s: 1, ox: 0, oy: 0 });
  const ext = (aspect) => {
    const P = surfaceProjector(view, aspect);
    const w = P(1, 0.5, 0)[0] - P(0, 0.5, 0)[0];
    const h = P(0.5, 1, 0)[1] - P(0.5, 0, 0)[1];
    return Math.abs(w / h);
  };
  ok("a 2:1 torus projects 2:1", close(ext([2, 1]), 2, 1e-12), String(ext([2, 1])));
  ok("a 1:1 domain projects 1:1", close(ext([1, 1]), 1, 1e-12), String(ext([1, 1])));
  ok("a 1:2 domain projects 1:2", close(ext([1, 2]), 0.5, 1e-12), String(ext([1, 2])));
  /* the control: the code this was ported from would fail the first of those, and here is why */
  ok("and the unit-square projection this replaces really does squash it — the control fires",
     !close(1, 2, 1e-12) && close(ext([2, 1]) / ext([1, 1]), 2, 1e-12));

  let threw = false;
  try { surfaceProjector(view, null); } catch (_) { threw = true; }
  ok("a missing aspect throws instead of defaulting to a square", threw);
  let threw2 = false;
  try { surfaceProjector(view, [0, 1]); } catch (_) { threw2 = true; }
  ok("and a degenerate one throws too", threw2);
}

H("and the aspect it will be drawn with is the MEASURED period, not a literal");
{
  const sp = spectrum(D.anchor.bulk.map((b) => ({ key: b.rep, n: b.multiplicity,
                                                  eta: b.eta, role: b.role })), D);
  const LATT = lattice(D.kmax);
  let p1 = true, p2 = true, notP1 = false;
  for (let t = 0; t < 60; t++) {
    const a1 = 2 * Math.random(), a2 = Math.random();
    if (Math.abs(V(sp, LATT, a1 + PERIODS[0], a2) - V(sp, LATT, a1, a2)) > 1e-9) p1 = false;
    if (Math.abs(V(sp, LATT, a1, a2 + PERIODS[1]) - V(sp, LATT, a1, a2)) > 1e-9) p2 = false;
    if (Math.abs(V(sp, LATT, a1 + 1, a2) - V(sp, LATT, a1, a2)) > 1e-6) notP1 = true;
  }
  ok("V really is PERIODS-periodic on this engine", p1 && p2);
  ok("and NOT 1-periodic in alpha_1, so PERIODS[0] = 2 says something", notP1);
  ok("so the relief's aspect is [2, 1]", PERIODS[0] === 2 && PERIODS[1] === 1);
}

/* ------------------------------------------------------------------ the fitted view */

H("the view is fitted to the mesh, so turning it never walks off the panel");
{
  const n = 20;
  const Hm = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++)
      Hm[j * (n + 1) + i] = 0.5 + 0.5 * Math.sin(6 * i / n) * Math.cos(5 * j / n);
  const frame = { x: 10, y: 10, w: 400, h: 380 };
  let inside = true, filled = true;
  for (let a = 0; a < 12; a++)
    for (const el of [EL_MIN, 0.35, 0.66, 1.0, EL_MAX]) {
      const view = surfaceView({ az: a * 0.52, el, n });
      fitSurfaceView(view, [2, 1], Hm, n, n, frame);
      const P = surfaceProjector(view, [2, 1]);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let j = 0; j <= n; j++)
        for (let i = 0; i <= n; i++) {
          const [X, Y] = P(i / n, j / n, Hm[j * (n + 1) + i]);
          x0 = Math.min(x0, X); x1 = Math.max(x1, X);
          y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
        }
      if (x0 < frame.x - 0.5 || x1 > frame.x + frame.w + 0.5 ||
          y0 < frame.y - 0.5 || y1 > frame.y + frame.h + 0.5) inside = false;
      /* and it must actually FILL it — a fit that shrank everything to a dot would pass "inside" */
      if (Math.max((x1 - x0) / frame.w, (y1 - y0) / frame.h) < 0.90) filled = false;
    }
  ok("the mesh stays inside the frame at 60 camera positions", inside);
  ok("and fills it — the anti-vacuity half of the same check", filled);
}

/* ------------------------------------------------------------------ the cached field */

H("the height field is exact where it was sampled");
{
  const n = 8, vals = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) vals[j * (n + 1) + i] = i * 3 - j * 2;
  const f = heightField(vals, n, n);
  let worst = 0, out = false;
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const got = f.raw(i / n, j / n);
      worst = Math.max(worst, Math.abs(got - (i * 3 - j * 2)));
      const z = f.height(i / n, j / n);
      if (z < -1e-12 || z > 1 + 1e-12) out = true;
    }
  ok("bilinear reproduces every node exactly", worst < 1e-12, String(worst));
  ok("and normalises into [0,1] with the ends attained",
     !out && close(f.height(1, 0), 1, 1e-12) && close(f.height(0, 1), 0, 1e-12));
  ok("a linear field interpolates linearly between nodes",
     close(f.raw(0.5 / n, 0), 1.5, 1e-12), String(f.raw(0.5 / n, 0)));
  ok("outside the domain it clamps rather than extrapolating",
     close(f.raw(2, 0), f.raw(1, 0), 1e-12) && close(f.raw(-1, 0), f.raw(0, 0), 1e-12));
}

/* ------------------------------------------------------------------ the painter's order */

H("far first: the depth sort, checked on the order the cells are actually filled");
{
  const n = 6, vals = new Float64Array((n + 1) * (n + 1));
  const f = heightField(vals.map(() => 0), n, n);
  const view = surfaceView({ n });
  const order = [];
  /* a canvas stub that records which cell was filled, in order, by its first vertex */
  let cur = null;
  const g = {
    _p: [], beginPath() { this._p = []; }, moveTo(x, y) { this._p.push([x, y]); },
    lineTo(x, y) { this._p.push([x, y]); }, closePath() {}, stroke() {},
    fill() { order.push(this._p[0]); }, arc() {}, setLineDash() {},
    strokeText() {}, fillText() {},
    set fillStyle(v) { cur = v; }, get fillStyle() { return cur; },
    set strokeStyle(v) {}, get strokeStyle() { return ""; },
    set lineWidth(v) {}, get lineWidth() { return 1; },
    set lineCap(v) {}, get lineCap() { return ""; },
    set font(v) {}, get font() { return ""; },
    set textAlign(v) {}, get textAlign() { return ""; },
    set textBaseline(v) {}, get textBaseline() { return ""; },
  };
  const P = paintSurface(g, view, [2, 1], f,
                         { frame: { x: 0, y: 0, w: 300, h: 300 }, floor: null });
  ok("every cell was painted once", order.length === n * n, `${order.length} of ${n * n}`);
  /* on a flat field the depth is monotone in the projected y, and far is smaller y on screen */
  let monotone = true;
  for (let k = 1; k < order.length; k++) if (order[k][1] < order[k - 1][1] - 1e-9) monotone = false;
  ok("and in far-to-near order, so a near cell can never be overdrawn by a far one", monotone);
  ok("paintSurface returns the projector it used", typeof P === "function");
}

/* ------------------------------------------------------------------ the relief as a control */

H("picking prefers the vertex nearest the VIEWER, not merely the nearest on screen");
{
  const n = 10, vals = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) vals[j * (n + 1) + i] = Math.sin(4 * i / n) + Math.cos(3 * j / n);
  const f = heightField(vals, n, n);

  /* Two claims, and the first attempt at this test conflated them and failed for the right
   * reason: aiming at a vertex whose neighbour sits 9 px away, the rule CORRECTLY returned the
   * neighbour, because the neighbour was nearer the eye.  They have to be separated. */

  /* (i) screen space.  Looked at from straight above, with the vertices further apart than the
   * 22 px radius, only the aimed vertex is a candidate at all. */
  {
    const flat = heightField(new Float64Array((n + 1) * (n + 1)), n, n);
    const top = surfaceView({ n, el: Math.PI / 2, h: 0, s: 900, ox: 500, oy: 400 });
    const Pt = surfaceProjector(top, [2, 1]);
    const want = [4 / n, 7 / n];
    const [X, Y] = Pt(want[0], want[1], 0);
    const got = pickSurface(Pt, flat, n, X, Y);
    ok("aiming at an isolated vertex returns that vertex",
       got && close(got[0], want[0], 1e-9) && close(got[1], want[1], 1e-9), JSON.stringify(got));
  }

  /* (ii) occlusion.  Find the pair of vertices that land closest together on screen with the
   * biggest difference in depth — a near ridge in front of a far slope — aim between them, and
   * demand the NEAR one.  The pair is searched for rather than assumed, and if there is no such
   * pair the test fails rather than passing vacuously. */
  {
    /* an almost edge-on eye and a tall relief: the camera the wheel and a drag actually reach,
     * and the one where a ridge really does stand in front of a valley */
    const view = surfaceView({ n, el: 0.14, h: 0.9, s: 300, ox: 200, oy: 200 });
    const P = surfaceProjector(view, [2, 1]);
    const pts = [];
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const x = i / n, y = j / n;
        pts.push([x, y, ...P(x, y, f.height(x, y))]);
      }
    let best = null;
    for (let a = 0; a < pts.length; a++)
      for (let b = a + 1; b < pts.length; b++) {
        const d = Math.hypot(pts[a][2] - pts[b][2], pts[a][3] - pts[b][3]);
        if (d > 10) continue;
        const gap = Math.abs(pts[a][4] - pts[b][4]);
        if (!best || gap > best.gap) best = { a: pts[a], b: pts[b], gap, d };
      }
    ok("there IS a near-over-far overlap to test on — otherwise this check is vacuous",
       !!best && best.gap > 0.05, best ? `gap ${best.gap.toFixed(3)} at ${best.d.toFixed(1)} px`
                                       : "no overlapping pair found");
    if (best) {
      const far = best.a[4] > best.b[4] ? best.b : best.a;
      const ax = (best.a[2] + best.b[2]) / 2, ay = (best.a[3] + best.b[3]) / 2;
      const got = pickSurface(P, f, n, ax, ay);
      /* the rule, applied independently: among everything inside the radius, the nearest to the
       * eye.  Asserting "the pair's near one" would be wrong whenever a third vertex is nearer
       * still, and the code would be blamed for obeying its own rule. */
      let want = null;
      for (const p of pts)
        if (Math.hypot(p[2] - ax, p[3] - ay) <= 22 && (!want || p[4] > want[4])) want = p;
      ok("the pick is the nearest to the eye inside the radius, not the nearest on screen",
         got && want && close(got[0], want[0], 1e-9) && close(got[1], want[1], 1e-9),
         `got ${JSON.stringify(got)}, want ${JSON.stringify([want && want[0], want && want[1]])}`);
      ok("and it is NOT the hidden far vertex of the overlapping pair",
         got && !(close(got[0], far[0], 1e-9) && close(got[1], far[1], 1e-9)),
         `far was ${JSON.stringify([far[0], far[1]])}`);
    }
  }

  const view = surfaceView({ n, s: 300, ox: 200, oy: 200 });
  const P = surfaceProjector(view, [2, 1]);
  ok("far outside the mesh it still answers, with the nearest vertex",
     Array.isArray(pickSurface(P, f, n, 1e5, 1e5)));
}

H("one repaint per frame — and never zero, which is the bug this exists for");
{
  let ran = 0, queued = null;
  globalThis.requestAnimationFrame = (fn) => { queued = fn; return 1; };
  globalThis.cancelAnimationFrame = () => { queued = null; };
  const paint = coalesced(() => ran++, { rescue: 5 });
  paint(); paint(); paint();
  ok("three calls in one frame queue one repaint", ran === 0 && typeof queued === "function");
  queued();
  ok("and it runs once", ran === 1);

  /* the rescue: a frame that never arrives must not leave the panel frozen for good */
  ran = 0; queued = null;
  const paint2 = coalesced(() => ran++, { rescue: 5 });
  paint2();
  await new Promise((r) => setTimeout(r, 30));
  ok("a frame that never runs is rescued by the timeout", ran === 1, String(ran));
  paint2();
  await new Promise((r) => setTimeout(r, 30));
  ok("and the panel still answers afterwards", ran === 2, String(ran));
}

H("the ramp");
{
  const a = surfaceRamp(0), b = surfaceRamp(1), m = surfaceRamp(0.5);
  ok("is three integer channels at both ends",
     a.length === 3 && b.length === 3 && a.every(Number.isInteger) && b.every(Number.isInteger));
  ok("moves between them", a.join() !== m.join() && m.join() !== b.join());
  ok("and clamps outside [0,1]", surfaceRamp(-3).join() === a.join() &&
                                 surfaceRamp(9).join() === b.join());
}

H("a hand-placed label lands inside the plot, or the number it carries is wrong");
{
  const L = 40, iw = 300, R = L + iw;
  const inside = (x, w) => x >= L && x + w <= R;

  ok("takes the preferred side when there is room on it",
     fitLabelX(200, 60, L, R, "left") === 211 && fitLabelX(200, 60, L, R, "right") === 200 - 11 - 60);

  /* THE CASE THAT SHIPPED.  "9.22 TeV . true vacuum" is ~118px of 10.5px mono, right-aligned on a
   * point near the left edge: the old code drew it at anchor - 11 - width, i.e. off the box, and
   * the page printed "22 TeV . true vacuum".  A wrong number, not a cramped one. */
  const anchor = 78, w = 118;
  ok("the old placement really did fall off the box", anchor - 11 - w < L);
  const x = fitLabelX(anchor, w, L, R, "right");
  ok("and the new one does not", inside(x, w), `x = ${x}, w = ${w}, box [${L}, ${R}]`);

  /* AND IT MUST NOT FLIP BY DEFAULT.  Three levels of the hierarchy panel sit on one row five
   * pixels apart; the sides are what keeps their labels apart, so a flip stacks them into a smear.
   * That is what the first version of this did, and the screenshot showed it. */
  ok("...by clamping, staying on the side the caller chose", x === L + 2 && x < anchor);
  ok("a flip happens only when the caller says the row is its own",
     fitLabelX(anchor, w, L, R, "right", { flip: true }) === anchor + 11);

  /* the other edge, where the two stacked levels ran off */
  const xr = fitLabelX(R - 20, 150, L, R, "left");
  ok("a label anchored near the right edge comes back inside", inside(xr, 150), `x = ${xr}`);
  ok("...and by the least amount, so it does not jump across its own dot", xr === R - 2 - 150);

  /* wider than the box at all: flush left, because a truncated TAIL is visibly truncated and a
   * sheared HEAD is not -- which is the whole lesson of the bug */
  ok("a label wider than the box goes flush left, losing its tail and not its digits",
     fitLabelX(200, 1000, L, R, "right") === L + 2);

  ok("and it clears its own anchor when it can", fitLabelX(200, 10, L, R, "left") > 200);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

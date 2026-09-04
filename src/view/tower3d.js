/* tower3d.js — the Kaluza–Klein towers of a model drawn as a landscape the reader can turn.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * ONE RENDERER, TWO SECTIONS.  "What the model contains" draws the towers in units of 1/R;
 * "Simulator" draws the same towers in GeV, with the measured masses as lines and the CMS
 * coloron bound as a plane.  The drawing is the same object read at two scales, so it is one
 * function with a `scale` argument rather than two copies that would drift apart.
 *
 * WHAT IS DRAWN.  One column per field, one bar per Kaluza–Klein level (the first LEVELS
 * distinct masses of the field's families), height on a log axis, depth the level.  A large dot
 * on the floor is a massless state.  Nothing is interpolated: every bar is an eigenvalue of the
 * twisted translation, read from `vac5Ladder`'s families.
 *
 * D3 SAYS THE KERNEL KNOWS NO DOM; this is view.  It sizes the canvas to its container so a card
 * in a two-column grid does not overflow, which is what the first deployment did.
 */
const TOWER3D_LEVELS = 4;

/* the first `levels` distinct masses of a field's families, in units of 1/R, with a weight */
function tower3dMasses(row, levels) {
  const masses = [];
  for (const f of row.families) {
    if (f.x === 0) { for (let k = 0; k <= levels; k++) masses.push({ m: k, w: k === 0 ? f.massless : f.massless + f.odd, massless: k === 0 }); }
    else if (f.x === 0.5) { for (let k = 0; k < levels; k++) masses.push({ m: k + 0.5, w: f.towers }); }
    else for (let k = 0; k < levels; k++) { masses.push({ m: k + f.x, w: f.towers }); masses.push({ m: k + 1 - f.x, w: f.towers }); }
  }
  masses.sort((a, b) => a.m - b.m);
  const out = [];
  for (const s of masses) {
    if (s.w <= 0) continue;
    if (out.length >= levels + 1) break;
    if (!out.some((q) => Math.abs(q.m - s.m) < 1e-9)) out.push(s);
  }
  return out;
}

/* draw.  `rows` are `vac5Ladder(...).rows`; `scale` is the GeV per unit of 1/R (or 1 to draw in
 * units of 1/R); `lines` are horizontal reference masses [{m, label, colour}] in the same units;
 * `plane` is one reference mass drawn as a plane; `az`, `el` the view angles. */
function tower3dDraw(canvas, rows, { scale = 1, unit = "1/R", lines = [], plane = null, az = 0.75, el = 0.55,
                                     levels = TOWER3D_LEVELS, floor = null, ceiling = null } = {}) {
  const d = window.devicePixelRatio || 1;
  /* size to the card, so a half-width column does not overflow.  `clientWidth` is undefined in
   * the harness's layout-less document, which is why this is a guard and not a read. */
  const parent = canvas.parentElement;
  const avail = parent && parent.clientWidth ? parent.clientWidth - 8 : 720;
  const W = Math.max(280, Math.min(760, avail)), Hh = Math.round(W * 0.58);
  canvas.width = W * d; canvas.height = Hh * d; canvas.style.width = W + "px"; canvas.style.height = Hh + "px";
  const g = canvas.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  g.clearRect(0, 0, W, Hh);
  const items = [];
  rows.forEach((r, fi) => {
    const x = rows.length === 1 ? 0.5 : fi / (rows.length - 1);
    tower3dMasses(r, levels).forEach((s, li) => items.push({ x, z: li / Math.max(1, levels), m: s.m * scale, w: s.w, massless: s.massless, field: r.field }));
  });
  const positive = items.filter((it) => it.m > 0).map((it) => it.m);
  const lo = Math.log10(floor ?? Math.max(1e-3 * scale, Math.min(...positive, scale * 0.3) * 0.5));
  const hi = Math.log10(ceiling ?? Math.max(...positive, plane ? plane.m : 0, ...lines.map((l) => l.m)) * 1.3);
  const y = (m) => (m <= 0 ? 0 : (Math.log10(m) - lo) / (hi - lo));
  const cx = W / 2, cy = Hh * 0.62, sc = Math.min(W, Hh) * 0.36;
  const proj = (x, z, h) => {
    const X = (x - 0.5) * 1.6, Z = (z - 0.5) * 1.0;
    const rx = X * Math.cos(az) - Z * Math.sin(az), rz = X * Math.sin(az) + Z * Math.cos(az);
    return [cx + rx * sc, cy + rz * Math.sin(el) * sc - h * Math.cos(el) * sc * 1.1];
  };
  g.strokeStyle = "rgba(120,120,120,.35)"; g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const a = proj(0, i / 4, 0), b = proj(1, i / 4, 0); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  /* the vertical axis with its ticks */
  const ax0 = proj(-0.06, 1, 0), ax1 = proj(-0.06, 1, 1);
  g.strokeStyle = "rgba(120,120,120,.6)"; g.beginPath(); g.moveTo(...ax0); g.lineTo(...ax1); g.stroke();
  g.fillStyle = "#777"; g.font = "10px sans-serif";
  for (let e = Math.ceil(lo); e <= Math.floor(hi); e++) {
    const p = proj(-0.06, 1, y(Math.pow(10, e)));
    g.fillText(unit === "GeV" ? (e >= 3 ? `${Math.pow(10, e - 3)} TeV` : `${Math.pow(10, e)} GeV`) : `${Math.pow(10, e)}/R`, p[0] - 44, p[1] + 3);
  }
  if (plane) {
    const P = [proj(0, 0, y(plane.m)), proj(1, 0, y(plane.m)), proj(1, 1, y(plane.m)), proj(0, 1, y(plane.m))];
    g.fillStyle = "rgba(220,60,60,.10)"; g.strokeStyle = "rgba(220,60,60,.6)";
    g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#c33"; g.fillText(plane.label, P[1][0] + 4, P[1][1] + 3);
  }
  /* THE REFERENCE LABELS ARE STACKED, NOT PLACED WHERE THE LINE ENDS.  On a log axis m_W, m_h and
   * m_t sit within a factor of two of each other, so three labels at their own heights land on
   * top of one another — which is what the first deployment looked like.  They go in a column at
   * the right edge, in the line's own colour, each with a short leader. */
  let labelY = null;
  for (const l of [...lines].sort((a, b) => b.m - a.m)) {
    const a = proj(0, 0, y(l.m)), b = proj(1, 0, y(l.m));
    g.strokeStyle = l.colour; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.setLineDash([]);
    let ly = b[1] + 3;
    if (labelY !== null && ly < labelY + 13) ly = labelY + 13;
    labelY = ly;
    g.strokeStyle = l.colour; g.globalAlpha = 0.5;
    g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] + 6, ly - 3); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = l.colour; g.font = "11px sans-serif"; g.fillText(l.label, b[0] + 8, ly);
  }
  items.sort((a, b) => proj(a.x, a.z, 0)[1] - proj(b.x, b.z, 0)[1]);
  for (const it of items) {
    const [x0, y0] = proj(it.x, it.z, 0), [x1, y1] = proj(it.x, it.z, y(it.m));
    const col = /^A_μ/.test(it.field) ? "#c84" : /^A_y/.test(it.field) ? "#37c" : /scalar/.test(it.field) ? "#a5a" : "#5a5";
    g.strokeStyle = col; g.lineWidth = 3 + Math.min(6, it.w);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(x1, y1, it.massless ? 5 : 3, 0, 6.29); g.fill();
  }
  /* THE COLUMNS ARE NUMBERED, NOT NAMED.  Field names are long — "8× dirac fund, ηη′ = −" — and
   * a projected base puts them a few pixels apart, so on the first deployment they overlapped
   * into an unreadable band.  The canvas carries a number per column and the caller prints the
   * legend in HTML, where the text can wrap. */
  g.font = "11px sans-serif";
  rows.forEach((r, fi) => {
    const x = rows.length === 1 ? 0.5 : fi / (rows.length - 1);
    const p = proj(x, -0.10, 0);
    g.fillStyle = /^A_μ/.test(r.field) ? "#c84" : /^A_y/.test(r.field) ? "#37c" : /scalar/.test(r.field) ? "#a5a" : "#5a5";
    g.fillText(String(fi + 1), p[0] - 3, p[1] + 12);
  });
  return { W, Hh, lo, hi };
}

/* the legend the canvas's numbers point at, as HTML: the caller puts it under the picture, where
 * a long field name can wrap instead of overlapping its neighbour */
function tower3dLegend(rows) {
  const col = (f) => (/^A_μ/.test(f) ? "#c84" : /^A_y/.test(f) ? "#37c" : /scalar/.test(f) ? "#a5a" : "#5a5");
  /* a FLEX container that wraps: as one inline run the entries ran past the card's edge and the
   * last field name was cut in half, which is what the first deployment showed */
  return `<span style="display:flex;flex-wrap:wrap;gap:2px 12px">` +
    rows.map((r, i) => `<span style="white-space:nowrap"><b style="color:${col(r.field)}">${i + 1}</b> ` +
      `${r.field}</span>`).join("") + `</span>`;
}

/* THE DRAG BELONGS TO THE PAGE, NOT TO THE CALL.  A turn must keep working when the pointer
 * leaves the canvas and must end wherever the button comes up, so the three moving handlers live
 * on `window` — and are therefore installed ONCE, here, rather than inside `tower3dControl`.
 *
 * The first version installed them per call, and `spectrum5d` calls the control from `render`,
 * which runs on every change of the model, while `predict` calls it from `init`, which runs on
 * every mount.  Each call left four live closures holding a canvas the shell had already replaced
 * with `innerHTML`; `build/leaks.mjs` measures four more per walk of the rail.  A stale closure is
 * not idle either: it redraws a node that is no longer in the document, which is where
 * `Cannot read properties of null` came from.
 *
 * One record, because only one tower can be under the pointer at a time. */
let TOWER3D_DRAG = null;      /* {state, redraw, azInput, elInput, x0, y0, az0, el0} while turning */
let TOWER3D_WINDOW = false;

function tower3dWindow() {
  if (TOWER3D_WINDOW) return;
  /* the smoke harness renders in node with no window; the panel simply does not turn there */
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  TOWER3D_WINDOW = true;
  const move = (cx, cy) => {
    const d = TOWER3D_DRAG; if (!d) return;
    d.state.az = d.az0 + (cx - d.x0) * 0.01;
    d.state.el = Math.min(1.4, Math.max(0.15, d.el0 + (cy - d.y0) * 0.01));
    if (d.azInput) d.azInput.value = ((d.state.az % 6.28) + 6.28) % 6.28;
    if (d.elInput) d.elInput.value = d.state.el;
    d.redraw();
  };
  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("touchmove", (e) => { if (TOWER3D_DRAG) move(e.touches[0].clientX, e.touches[0].clientY); });
  window.addEventListener("mouseup", () => { TOWER3D_DRAG = null; });
  window.addEventListener("touchend", () => { TOWER3D_DRAG = null; });
}

/* wire the drag-to-turn and the two sliders; safe to call again on the same canvas or on a new one */
function tower3dControl(canvas, state, redraw, azInput = null, elInput = null) {
  if (!canvas) return;
  tower3dWindow();
  /* assignments, not `addEventListener`: re-wiring the same node replaces the handler instead of
   * adding a second one, and a node the shell has replaced takes its handlers with it */
  const start = (cx, cy) => {
    TOWER3D_DRAG = { state, redraw, azInput, elInput, x0: cx, y0: cy, az0: state.az, el0: state.el };
  };
  canvas.onmousedown = (e) => { start(e.clientX, e.clientY); e.preventDefault(); };
  canvas.ontouchstart = (e) => { const t = e.touches[0]; start(t.clientX, t.clientY); };
  if (azInput) azInput.oninput = (e) => { state.az = +e.target.value; redraw(); };
  if (elInput) elInput.oninput = (e) => { state.el = +e.target.value; redraw(); };
}

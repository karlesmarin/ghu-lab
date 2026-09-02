/* fibre_panels.js — the plan and the relief of a fibre field, as one pair any section can mount.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The first component of the view kit, and it is here rather than inside a section because
 * `torus_panels.js` already proved the shape and then nobody reused it: nineteen of the twenty-three
 * sections draw their own panels by hand.  This one is written to be mounted.
 *
 * WHAT IT IS FOR, which is not "plotting the data".  The classes of boundary conditions are the
 * fibres of a marginal map, and that sentence is abstract until you see the collapse: a cloud of
 * boundary conditions above, a lattice of classes below, and a column over each class as tall as
 * the number of conditions that fell into it.  Then two published numbers are two features of one
 * picture — the FOOTPRINT is the class count, the VOLUME is the number of boundary conditions —
 * and "the apparent unbroken symmetry is not an invariant" becomes the observation that two very
 * different-looking conditions are standing in the same column.
 *
 * THREE THINGS THIS DOMAIN NEEDS THAT THE TORUS PAIR DOES NOT.
 *
 *   1. NO INTERPOLATION.  The torus carries a trigonometric polynomial and a bilinear relief is
 *      the right reading of it.  Here the domain is a LATTICE: between two integer data there is
 *      nothing, and a ramp between them draws heights that do not exist.  So each cell is
 *      supersampled into a constant block (`STEP` samples a side) before the painter sees it —
 *      the bilinear interpolation inside a constant block is constant, and only one sample-wide
 *      seam survives at the edges, which is what a step looks like.  The painter is not modified.
 *
 *   2. THE ASPECT IS THE DATA'S.  `surfaceProjector` refuses to draw without one, and the lesson
 *      that put it there was a 2:1 torus silently drawn 1:1.  Here it is the extent of the two
 *      chosen coordinates, and it changes with the rank.
 *
 *   3. EMPTY IS NOT ZERO, AND IS NOT HIDDEN.  A datum no boundary condition reaches is not a fibre
 *      of size zero; it is not in the image.  It is drawn desaturated and at the floor, never
 *      omitted — omitting it would claim it is not there, which is a different statement and a
 *      false one.  Same rule as the greyed half of the selection panel.
 */
import {
  attachSurface, fitSurfaceView, heightField, paintSurface, surfaceAxisLabels, surfaceView,
} from "../kernel/surface.mjs";

/* samples per lattice cell.  Four is enough to make the seam thin and keeps the mesh small. */
const STEP = 4;

/* Desaturated, not hidden — the same function torus_panels uses, and for the same reason. */
function GREY(c) {
  const y = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return [Math.round(0.30 * c[0] + 0.70 * y), Math.round(0.30 * c[1] + 0.70 * y),
          Math.round(0.30 * c[2] + 0.70 * y)];
}

/* A lattice grid, blown up into constant blocks so that the bilinear painter draws steps.
 * Returns the field the painter wants plus the mask of which samples are outside the image. */
export function stepField(grid) {
  const { vals, nx, ny } = grid;
  const NX = nx * STEP, NY = ny * STEP;
  /* heightField reads vals[j*(nx+1)+i], so it wants (NX+1) x (NY+1) SAMPLES for NX x NY cells.
   * Handing it an NX x NY array reads past every row end, which is `undefined`, which makes every
   * height NaN — and the relief then draws nothing at all with no error anywhere.  That is what
   * the first version of this file did. */
  const W = NX + 1, H = NY + 1;
  const out = new Array(W * H).fill(0), miss = new Array(W * H).fill(false);
  let hi = 0;
  for (const v of vals) if (v !== null && v > hi) hi = v;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const cx = Math.min(nx - 1, Math.floor(i / STEP)), cy = Math.min(ny - 1, Math.floor(j / STEP));
      const v = vals[cy * nx + cx];
      out[j * W + i] = v === null ? 0 : v;
      miss[j * W + i] = v === null;
    }
  }
  return { field: heightField(out, NX, NY), NX, NY, miss, hi, aspect: [nx, ny] };
}

/* The pair.  `cfg.ids` names the two canvases and the caption; `cfg.field()` returns the current
 * fibre field, and `cfg.onPick(cell)` is told which class the reader pointed at. */
export function mountFibrePanels(cfg) {
  const ids = cfg.ids;
  const H = cfg.height || 320;
  const S = { view: surfaceView({ n: 40, h: 0.46 }), grid: null, step: null, mark: null };

  const el = (k) => document.getElementById(ids[k]);
  const W = () => (el("surf") ? el("surf").clientWidth : 300);

  /* ---------------------------------------------------------------- the plan */
  function drawPlan() {
    const c = el("map"); if (!c || !S.grid) return;
    const w = c.clientWidth, h = H;
    c.width = w * devicePixelRatio; c.height = h * devicePixelRatio;
    const g = c.getContext("2d");
    g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    g.clearRect(0, 0, w, h);

    const { vals, nx, ny, xlo, ylo } = S.grid;
    const pad = 34;
    const cw = (w - pad - 12) / nx, ch = (h - pad - 12) / ny;
    const side = Math.min(cw, ch);
    const ox = pad + (w - pad - 12 - side * nx) / 2;
    const oy = 8 + (h - pad - 12 - side * ny) / 2;

    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = vals[j * nx + i];
      const x = ox + i * side, y = oy + (ny - 1 - j) * side;
      let col;
      if (v === null) col = GREY([210, 216, 222]);
      else {
        const t = S.step.hi > 1 ? (v - 1) / (S.step.hi - 1) : 0;
        col = [Math.round(232 - 96 * t), Math.round(238 - 150 * t), Math.round(246 - 60 * t)];
      }
      g.fillStyle = "rgb(" + col.join(",") + ")";
      g.fillRect(x + 1, y + 1, side - 2, side - 2);
      if (v !== null && v > 1) {
        /* the fibre size, written, because a colour is not a number */
        g.fillStyle = "rgba(20,30,40,.72)";
        g.font = Math.min(13, side * 0.42) + "px ui-monospace,monospace";
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(v), x + side / 2, y + side / 2);
      }
      if (S.mark && S.mark.x === i + xlo && S.mark.y === j + ylo) {
        g.strokeStyle = "#b3262b"; g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, side - 2, side - 2);
      }
    }
    g.fillStyle = "rgba(70,86,100,.9)";
    g.font = "11px ui-sans-serif,system-ui";
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText(cfg.labels ? cfg.labels[0] : "a", ox, h - 8);
    g.save(); g.translate(11, oy + side * ny / 2); g.rotate(-Math.PI / 2);
    g.textAlign = "center"; g.fillText(cfg.labels ? cfg.labels[1] : "b", 0, 0); g.restore();

    c.onclick = (ev) => {
      const r = c.getBoundingClientRect();
      const i = Math.floor((ev.clientX - r.left - ox) / side);
      const j = ny - 1 - Math.floor((ev.clientY - r.top - oy) / side);
      if (i < 0 || j < 0 || i >= nx || j >= ny) return;
      S.mark = { x: i + xlo, y: j + ylo };
      drawPlan();
      if (cfg.onPick) cfg.onPick(S.mark);
    };
  }

  /* ---------------------------------------------------------------- the relief */
  function drawRelief() {
    const c = el("surf"); if (!c || !S.step) return;
    const w = W(), h = H;
    c.width = w * devicePixelRatio; c.height = h * devicePixelRatio;
    const g = c.getContext("2d");
    g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    g.clearRect(0, 0, w, h);
    /* the frame carries an ORIGIN as well as a size: fitSurfaceView reads frame.x and frame.y, and
     * without them the offsets come out NaN and the mesh is projected nowhere.  And paintSurface
     * fits the view itself when given a frame, so fitting it here as well would be doing the work
     * twice and, worse, on a different H. */
    const frame = { x: 0, y: 0, w, h };
    /* `tint(i, j, rgb)` is the painter's only colour hook and its indices are the VIEW's mesh, not
     * the lattice: i and j run 0..view.n-1 over the unit domain.  So the lattice cell under a quad
     * is found by mapping back through the domain, and a cell outside the image is desaturated
     * there.  Passing a `shade` callback instead — which is what the first draft of this file did
     * — would have been ignored in silence, and the unreached cells would have been painted as
     * ordinary floor: the picture would have claimed they are fibres of size zero. */
    const n = S.view.n;
    const proj = paintSurface(g, S.view, S.step.aspect, S.step.field, {
      frame,
      tint: (i, j, rgb) => {
        const cx = Math.min(S.grid.nx - 1, Math.floor((i + 0.5) / n * S.grid.nx));
        const cy = Math.min(S.grid.ny - 1, Math.floor((j + 0.5) / n * S.grid.ny));
        return S.grid.vals[cy * S.grid.nx + cx] === null ? GREY(rgb) : null;
      },
    });
    surfaceAxisLabels(g, proj, cfg.labels || ["a", "b"]);
  }

  return {
    /* the field is recomputed by the section; this only redraws */
    set(field, grid) {
      S.grid = grid;
      S.step = stepField(grid);
      drawPlan(); drawRelief();
      const cap = el("cap");
      if (cap) {
        cap.textContent =
          field.classes.toLocaleString("en") + " classes — the footprint — over "
          + field.conditions.toLocaleString("en") + " boundary conditions — the volume."
          + (field.projected
              ? "  This is a 2-plane of a " + field.coords.length
                + "-dimensional datum space, so a cell may hold several classes; the number in it"
                + " is how many conditions, not how many classes."
              : "  The datum space is two-dimensional here, so the picture is the object and not a"
                + " shadow of it.");
      }
    },
    attach() {
      const c = el("surf");
      if (c) attachSurface(c, S.view, { onView: drawRelief, width: W, height: () => H });
      addEventListener("resize", () => { drawPlan(); drawRelief(); });
    },
  };
}

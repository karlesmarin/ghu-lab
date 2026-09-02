/* fibres.mjs — the classification as a height field: what the plan draws and the relief turns.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A boundary condition of rank N is a multiset of letters of total weight N; its CLASS is the tuple
 * of local data those letters sum to.  So the map from conditions to classes is a marginal map, and
 * the object worth drawing is its FIBRE SIZE: over each achievable datum, how many boundary
 * conditions carry it.  Two published numbers are then two features of one picture —
 *
 *     the FOOTPRINT is the number of classes,   the VOLUME is the number of boundary conditions
 *
 * — and on S^1/Z_2 at rank 4 they are the 25 and the 35 of Part IX-A's own figure.
 *
 * WHAT THIS FILE REFUSES TO PRETEND.  The datum is a plane only when the degree is two.  A cone of
 * order e contributes e - 1 free coordinates, so S^1/Z_2 (two cones of order 2) gives a plane and
 * T^2/Z_2 (four of them) gives a four-dimensional space.  Drawing "the" plane there would be a
 * lie, so a projection is CHOSEN, named, and reported: `axes` says which two coordinates are the
 * ground, and every cell carries both what was summed into it and how many distinct classes
 * project onto it.  A cell holding three classes says three, and the panel can say so.
 *
 * D3: pure functions, no DOM.  The drawing lives in the view and takes this as its input.
 */
import { conePoints, multisets, realForm } from "./alphabet.mjs";

/* The free coordinates of the datum space, as [coneIndex, slot] pairs.
 *
 * At a cone of order e the multiplicities sum to the rank, so one slot is determined by the others
 * and only e - 1 of them are free.  The number of free coordinates is the degree of the count,
 * which is where `predictedDegree`'s c(m) = m - 1 comes from over SU(N) — the same arithmetic seen
 * from the picture instead of from the series. */
export function datumCoordinates(A, m) {
  const cones = conePoints(A, m), out = [];
  cones.forEach((c, ci) => { for (let k = 1; k < c.order; k++) out.push([ci, k]); });
  return out;
}

/* The fibre field of one rank, projected onto two of the free coordinates.
 *
 *   { cells, axes, extent, classes, conditions, projected }
 *
 * `cells` is a Map from "x,y" to { conditions, classes, sample } — how many boundary conditions
 * land there, how many DISTINCT classes they fall into, and one witness datum.  `projected` is
 * true when more than one class shares a cell, which is exactly when the picture is a shadow and
 * has to say so. */
export function fibreField(A, m, family, N, axes = [0, 1]) {
  const cones = conePoints(A, m);
  const letters = realForm(A, m, family);
  const coords = datumCoordinates(A, m);
  if (coords.length < 2) throw new Error("the datum space is not two-dimensional here");
  const [ia, ib] = axes;
  if (ia === ib || !coords[ia] || !coords[ib]) throw new Error("bad axes " + axes);

  const perClass = new Map();                 /* datum key -> conditions in that class */
  for (const pick of multisets(letters.map((L) => L.weight), N)) {
    const acc = cones.map((c) => new Array(c.order).fill(0));
    for (const [idx, mult] of pick)
      for (let ci = 0; ci < cones.length; ci++)
        for (let k = 0; k < cones[ci].order; k++) acc[ci][k] += mult * letters[idx].datum[ci][k];
    const key = JSON.stringify(acc);
    const e = perClass.get(key);
    if (e) e.conditions++;
    else perClass.set(key, { conditions: 1, datum: acc });
  }

  const cells = new Map();
  let xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity, conditions = 0;
  for (const { conditions: n, datum } of perClass.values()) {
    const x = datum[coords[ia][0]][coords[ia][1]], y = datum[coords[ib][0]][coords[ib][1]];
    const k = x + "," + y;
    const cell = cells.get(k) || { x, y, conditions: 0, classes: 0, sample: datum };
    cell.conditions += n; cell.classes++;
    cells.set(k, cell);
    conditions += n;
    if (x < xlo) xlo = x; if (x > xhi) xhi = x;
    if (y < ylo) ylo = y; if (y > yhi) yhi = y;
  }

  return {
    cells, axes, coords, extent: { xlo, xhi, ylo, yhi },
    classes: perClass.size,
    conditions,
    projected: [...cells.values()].some((c) => c.classes > 1),
  };
}

/* The field as a dense grid, for the painter.  EMPTY CELLS ARE null AND NOT ZERO: a datum no
 * boundary condition reaches is not a fibre of size zero, it is not in the image at all, and the
 * two must not be shaded the same.  The view greys them; it does not drop them, because dropping
 * them would claim they are not there. */
export function fibreGrid(field, key = "conditions") {
  const { xlo, xhi, ylo, yhi } = field.extent;
  const nx = xhi - xlo + 1, ny = yhi - ylo + 1;
  const vals = new Array(nx * ny).fill(null);
  for (const c of field.cells.values()) vals[(c.y - ylo) * nx + (c.x - xlo)] = c[key];
  return { vals, nx, ny, xlo, ylo, aspect: nx / ny };
}

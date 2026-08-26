/* _test_atlas.mjs — the SU(7) atlas, held to the archived enumeration and to the exact potential.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The atlas recomputes the whole lattice at five multiplets in the browser; this harness holds
 * it to ceiling_ilp.py's archived counts (contents, in window, holding the host, able to pay),
 * pins THE one window tile to their row (2) itself, and holds sampled tile curves to the direct
 * winding sum -- the atom factoring must be the same sum, factored.
 *
 *   node _test_atlas.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { modules, sweepHierarchy } from "./src/modules/hierarchy.mjs";
import { buildAtlas7, tileControlF } from "./src/modules/atlas.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const AT = buildAtlas7(DATA);
const ARCH = DATA.size_curve[0];

H("the enumeration against ceiling_ilp.py's archived row at five multiplets");
ok(`the count is the archive's ${ARCH.contents}`, AT.counts.contents === ARCH.contents,
   String(AT.counts.contents));
ok(`in the window: ${ARCH.in_window}`, AT.counts.window === ARCH.in_window,
   String(AT.counts.window));
ok(`...holding the host: ${ARCH.with_host}`, AT.counts.window_with_host === ARCH.with_host);
ok(`...and able to pay: ${ARCH.can_pay}`, AT.counts.window_can_pay === ARCH.can_pay);
ok("the classes partition the atlas: every tile is exactly one of the five",
   AT.counts.window + AT.counts.falsevac + AT.counts.breaks + AT.counts.nosol +
   AT.counts.nobreak === AT.counts.contents);
ok("anti-vacuity: false vacua, no-breaking and out-of-window tiles all occur",
   AT.counts.falsevac > 0 && AT.counts.nobreak > 0 && AT.counts.breaks > 0,
   JSON.stringify(AT.counts));

H("the one window tile IS their row (2)");
{
  const win = AT.tiles.filter((t) => t.cls === "window");
  ok("there is exactly one", win.length === 1);
  const t = win[0];
  const bulk = t.mult.map((k, i) => k ? {
    rep: AT.slots[i].rep,
    parities: [AT.slots[i].key[1] === "+" ? 1 : -1, AT.slots[i].key[3] === "+" ? 1 : -1],
    multiplicity: k } : null).filter(Boolean);
  const sig = (b) => b.map((x) => `${x.rep}${x.parities.join("")}*${x.multiplicity}`).sort().join(";");
  ok("its content is row (2)'s bulk, multiplet for multiplet",
     sig(bulk) === sig(DATA.published_rows[1].bulk.filter((b) => b.multiplicity)));
  ok("its 8D is 29, the archived best", t.D8 === 29 && t.D8 === ARCH.best_8D);
  const m = complete({ ...emptyModel(), group: DATA.group,
                       orbifold: { name: DATA.orbifold.name }, bulk }).model;
  const v = resolve(modules(DATA), m).values;
  ok("its alpha is the resolver's own, to 1e-12",
     Math.abs(t.alpha - v.get("alpha_min").value) < 1e-12);
  ok("and its m_h the resolver's", Math.abs(t.mh - v.get("m_h").value) < 1e-9);
}

H("the atom factoring is the same sum, factored -- sampled tiles against the direct winding sum");
{
  let worst = 0;
  for (const ti of [1, 137, 600, 1000, AT.tiles.length - 1]) {
    const t = AT.tiles[ti];
    for (const gi of [3, 28, 50]) {
      const direct = tileControlF(DATA, t.mult, AT.alphas[gi]);
      const d = Math.abs(t.curve[gi] - direct);
      if (d > worst) worst = d;
    }
  }
  /* the tiles are stored in float32 -- display precision -- so the honest tolerance is the
   * storage's own ~1e-7 relative on values up to O(30), not the 1e-9 a float64 would earn */
  ok(`five tiles, three points each: worst |atlas - direct| = ${worst.toExponential(1)} (float32 storage)`,
     worst < 1e-4);
}
ok("a tile's curve really spans its own range: lo < hi on every breaking tile",
   AT.tiles.filter((t) => t.cls !== "nobreak").every((t) => t.lo < t.hi));

H("two enumerations, one truth: the atlas against the hierarchy sweep");
{
  /* the sweep classifies the same 1 286 by its own route -- if the two instruments disagree on
   * how many never break or find no small-alpha solution, one of them is wrong */
  const sw = sweepHierarchy(DATA, { maxN: 5 });
  ok(`both enumerate ${sw.contents} contents`, sw.contents === AT.counts.contents);
  ok(`no breaking: sweep ${sw.noVacuum}, atlas ${AT.counts.nobreak}`, sw.noVacuum === AT.counts.nobreak);
  ok(`no small-alpha solution: sweep ${sw.noSolution}, atlas ${AT.counts.nosol}`,
     sw.noSolution === AT.counts.nosol);
  ok("and the rest -- window + false vacua + outside -- is what the sweep goes on to test, " +
     "plus its not-minimum and at-edge cases",
     AT.counts.window + AT.counts.falsevac + AT.counts.breaks ===
     sw.tested + sw.notMinimum + sw.atEdge,
     `${AT.counts.window + AT.counts.falsevac + AT.counts.breaks} vs ${sw.tested}+${sw.notMinimum}+${sw.atEdge}`);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

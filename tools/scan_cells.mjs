/* scan_cells.mjs — every verdict the instrument has, chained over the whole space, to see what
 * the composition says that no single panel can.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * For every boundary condition of SU(5), SU(6), SU(7) on S¹/Z₂ and every bulk content of up to
 * `MAXF` fields drawn from {fund, anti, sym, adj} × {η = ±1}, multiplicity one: the Wilson-line
 * minimum, the frame there, the group, the Standard-Model cell at the nearest symmetric point,
 * sin²θ_W, the Higgs doublet, the anomaly verdict at the minimum, the W and 1/R against the CMS
 * coloron bound, and the class energy.  One JSON line per (N, bc, content).
 *
 *   node tools/scan_cells.mjs [maxN=7] [maxFields=4] > scan.jsonl
 */
import { sun5dBlocks, sun5dTerms, sun5dMinimum, sun5dMinimumRestarts, sun5dUnbroken }
  from "../src/modules/sun5d.mjs";
import { bcClasses, bcEnergy, bcPreferred } from "../src/modules/bcclass.mjs";
import { vac5At, vac5Ladder, vac5Confront } from "../src/modules/vacuum5d.mjs";
import { smCellNear } from "../src/modules/smcell.mjs";

const maxN = +(process.argv[2] || 7), MAXF = +(process.argv[3] || 4);
const FIELDS = [];
for (const rep of ["fund", "anti", "sym", "adj"]) for (const eta of [1, -1]) FIELDS.push({ rep, eta, kind: "dirac", multiplicity: 1 });
function* subsets(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i < arr.length; i++) { acc.push(arr[i]); yield* subsets(arr, k, i + 1, acc); acc.pop(); }
}
const contents = [];
for (let k = 0; k <= MAXF; k++) for (const s of subsets(FIELDS, k)) contents.push(s);
const tag = (bulk) => bulk.map((f) => `${f.rep}${f.eta > 0 ? "+" : "-"}`).join(",") || "gauge";

let rows = 0;
const t0 = Date.now();
for (let N = 5; N <= maxN; N++) {
  const C = bcClasses(N, "S1/Z2");
  for (const cl of C.classes) {
    const pref = bcPreferred(cl.members, {});
    for (const bc of cl.members) {
      const b = sun5dBlocks({ nPP: bc[0], nPM: bc[1], nMP: bc[2], nMM: bc[3] });
      const E = bcEnergy(bc, {});
      for (const bulk of contents) {
        const content = { gauge: true, bulk };
        const terms = sun5dTerms(b, content);
        let min = null, method = "none";
        if (b.phases >= 1 && b.phases <= 2) { min = sun5dMinimum(terms, b.phases, { grid: 80, windings: 120 }); method = "grid"; }
        else if (b.phases > 2) { min = sun5dMinimumRestarts(terms, b.phases, { restarts: 6, refine: 30, windings: 120 }); method = "restarts"; }
        const theta = min ? min.theta : [];
        const v = vac5At(b, content, theta);
        const L = vac5Ladder(v.frame, content);
        const X = vac5Confront(L);
        const sm = smCellNear(b, content, theta);
        const best = sm.cell.best;
        process.stdout.write(JSON.stringify({
          N, bc, cls: cl.id, clsSize: cl.size, preferred: pref.members ? pref.members.some((m) => m.join() === bc.join()) : null,
          Nv: E.Nv, phases: b.phases, content: tag(bulk), nFields: bulk.length,
          method, V: min ? +min.V.toFixed(6) : null, theta: theta.map((x) => +x.toFixed(4)), atEdge: min ? min.atEdge : null,
          symGroup: sun5dUnbroken(b), vacGroup: v.unbroken, vacWhere: v.where,
          vectors: v.zero.vectors, scalars: v.zero.scalars, fermions: v.zero.fermions,
          anomVac: v.anom.verdict, owingVac: v.anom.offending.length,
          mWR: L.mWR, invR: X.located ? +X.invRGeV.toFixed(1) : null, kk: X.located ? X.kk.verdict : null,
          cellFound: best ? best.found.length : 0, cellMissing: best ? best.missing : null,
          sin2: best && best.fixed ? best.sin2 : null, free: best ? best.free : null,
          higgs: best && best.fixed ? best.higgs.length : null, exotics: best && best.fixed ? best.exotics.length : null,
          exoticDim: best && best.fixed ? best.exotics.reduce((a, e) => a + e.dim * e.copies, 0) : null,
          colour: best ? best.colourName : null, weak: best ? best.weakName : null,
          distance: +sm.distance.toFixed(4), weakBroken: sm.weakBroken, colourBroken: sm.colourBroken,
        }) + "\n");
        rows++;
      }
    }
  }
  process.stderr.write(`N=${N} done, ${rows} rows, ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
}

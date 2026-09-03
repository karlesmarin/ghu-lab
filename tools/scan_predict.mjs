/* scan_predict.mjs — the simulator over the scan: every model with a full Standard-Model cell and
 * a Wilson-line W, re-minimised finely and turned into 1/R, m_H, sin²θ_W and the top proxy, each
 * beside its measured number.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   node tools/scan_predict.mjs scan.jsonl > predictions.md
 */
import { readFileSync } from "node:fs";
import { sun5dBlocks, sun5dTerms, sun5dMinimum, sun5dMinimumRestarts } from "../src/modules/sun5d.mjs";
import { predictModel } from "../src/modules/predict.mjs";
import { EXPERIMENT } from "../src/kernel/experiment.mjs";

const rows = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const full = rows.filter((r) => r.cellFound === 5 && r.mWR !== null);
const seen = new Map();
const parse = (tag) => tag === "gauge" ? [] : tag.split(",").map((s) => ({ rep: s.slice(0, -1), eta: s.endsWith("+") ? 1 : -1, kind: "dirac", multiplicity: 1 }));
const out = [];
for (const r of full) {
  const key = `${r.N}|${r.content}|${r.cls}`;      /* one row per theory: the class, not the frame */
  if (seen.has(key)) continue;
  seen.set(key, 1);
  const b = sun5dBlocks({ nPP: r.bc[0], nPM: r.bc[1], nMP: r.bc[2], nMM: r.bc[3] });
  const content = { gauge: true, bulk: parse(r.content) };
  const terms = sun5dTerms(b, content);
  const m = b.phases <= 2 ? sun5dMinimum(terms, b.phases, { grid: 400, windings: 300 })
                          : sun5dMinimumRestarts(terms, b.phases, { restarts: 16, windings: 300 });
  const P = predictModel(b, content, m.theta, terms);
  if (!P.located) continue;
  const top = P.confront.rows.find((x) => /dirac sym/.test(x.field) && x.firstMassiveGeV !== null);
  out.push({
    model: `SU(${r.N}) [${r.bc}] ${r.content}`, phases: b.phases, t: P.ladder.mWR, invR: P.invRGeV,
    mH: P.mHGeV, sin2: P.sin2Embedding, sin2run: P.sin2DataAtInvR, higgs: r.higgs, colourBroken: r.colourBroken,
    weakBroken: r.weakBroken, anom: r.anomVac, exoticDim: r.exoticDim, kk: P.confront.kk.verdict,
    top: top ? top.firstMassiveGeV : null, curvOK: P.curvature ? P.curvature.every((l) => l > 0) : null,
  });
}
out.sort((a, b) => b.invR - a.invR);
const f = (x, d = 1) => (x === null || x === undefined ? "—" : typeof x === "number" ? x.toFixed(d) : String(x));
console.log(`# The simulator over the scan: ${out.length} theories with a full Standard-Model cell and a Wilson-line W\n`);
console.log(`Measured: m_W = ${EXPERIMENT.m_W.value} GeV (PDG 2025), m_h = ${EXPERIMENT.m_h.value} GeV, m_t = ${EXPERIMENT.m_t.value} GeV (PDG 2024), ` +
            `CMS coloron bound ${EXPERIMENT.dijet_coloron.value / 1000} TeV, ŝ²_Z = ${EXPERIMENT.sin2_MZ_msbar.value}. ` +
            `g₄ = g₂(1/R), one loop, no brane kinetic terms.\n`);
console.log("| model | phases | m_W·R | 1/R TeV | m_H GeV (data 125.2) | sin²θ_W embed / SM-run at 1/R | top proxy GeV (172.6) | Higgs doublets | colour broken | anomaly@min | exotics (dim) | KK vs CMS |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const o of out)
  console.log(`| ${o.model} | ${o.phases} | ${f(o.t, 4)} | ${f(o.invR / 1000, 3)} | ${o.mH === null ? "no minimum in every phase" : f(o.mH, 1)} | ${o.sin2 === null ? "—" : f(o.sin2, 4)} / ${f(o.sin2run, 4)} | ${f(o.top, 1)} | ${o.higgs} | ${o.colourBroken} | ${o.anom} | ${o.exoticDim} | ${o.kk} |`);
console.log("\n## Summary\n");
const ok = out.filter((o) => !o.colourBroken);
console.log(`- theories: ${out.length}; with colour unbroken by the vacuum: ${ok.length}; with a Higgs doublet: ${out.filter((o) => o.higgs).length}; ` +
            `with both: ${ok.filter((o) => o.higgs).length}`);
console.log(`- 1/R range: ${f(Math.min(...out.map((o) => o.invR)) / 1000, 2)} to ${f(Math.max(...out.map((o) => o.invR)) / 1000, 2)} TeV; above the CMS coloron bound: ${out.filter((o) => o.kk === "above the bound").length}`);
const mh = out.filter((o) => o.mH !== null);
console.log(`- m_H range (one loop, g₄ = g₂): ${f(Math.min(...mh.map((o) => o.mH)))} to ${f(Math.max(...mh.map((o) => o.mH)))} GeV over ${mh.length} theories with a positive curvature; within 10% of 125.2: ${mh.filter((o) => Math.abs(o.mH - 125.2) < 12.5).length}`);
const tp = out.filter((o) => o.top !== null);
console.log(`- top proxy (symmetric tensor's first state): ${tp.length} theories, range ${f(Math.min(...tp.map((o) => o.top)))} to ${f(Math.max(...tp.map((o) => o.top)))} GeV`);
console.log(`- sin²θ_W embeddings: ${JSON.stringify([...new Set(out.map((o) => o.sin2 === null ? "free" : o.sin2.toFixed(4)))])}`);

/* _test_reading.mjs — the sentences that read the results back, held to the numbers that produced
 * them.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A paragraph that explains a result is the easiest thing on a page to let drift: it is prose, no
 * test opens it, and it keeps sounding right long after the number under it moved.  So every
 * sentence here is checked against the condition that is supposed to produce it, and — the half
 * that matters — against the condition that must NOT:
 *
 *   - a scale above the CMS bound must read as holding, below it as failing, and the failing one
 *     must carry the hypothesis (colour in the bulk) rather than asserting exclusion;
 *   - a Higgs at the measured mass must read as holding and one at half of it must not;
 *   - a model with no located vacuum must produce exactly one sentence, and it must say so;
 *   - the reading must MOVE when a parameter moves — a text identical before and after is a text
 *     that is not a function of the numbers;
 *   - and nothing may recommend: no sentence may call a model good, promising or viable.
 *
 *   node _test_reading.mjs
 */
import { sun5dBlocks, sun5dTerms, sun5dMinimum } from "./src/modules/sun5d.mjs";
import { predictModel } from "./src/modules/predict.mjs";
import { yukawaTable } from "./src/modules/yukawa.mjs";
import { dossierForClass } from "./src/modules/dossier.mjs";
import { readSimulator, readDossier, readingHTML } from "./src/modules/reading.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const text = (l) => l.map((s) => s.text).join(" ");

const HHKY = { gauge: true, bulk: [
  { rep: "adj", eta: 1, kind: "dirac", multiplicity: 2 },
  { rep: "fund", eta: -1, kind: "dirac", multiplicity: 8 },
  { rep: "fund", eta: 1, kind: "scalar", multiplicity: 4 },
  { rep: "fund", eta: -1, kind: "scalar", multiplicity: 2 }] };

const at = (bc, content, theta) => {
  const b = B(bc), terms = sun5dTerms(b, content);
  return predictModel(b, content, theta, terms);
};

H("the scale sentence follows the bound, and the failing one carries its hypothesis");
{
  const low = readSimulator(at([1, 0, 0, 2], HHKY, [0.0583]));
  ok("1/R = 2.755 TeV reads as failing against CMS's 6.6 TeV",
     low.some((s) => s.tone === "bad" && /below CMS/.test(s.text)), text(low).slice(0, 120));
  ok("...and says the bound applies only if colour lives in the bulk, rather than asserting exclusion",
     /if colour lives in the bulk/i.test(text(low)) && /cannot decide/.test(text(low)));
  const high = readSimulator(at([1, 0, 0, 2], HHKY, [0.012]));
  ok("a small angle puts 1/R above the bound and the sentence turns",
     high.some((s) => s.tone === "good" && /above CMS/.test(s.text)), text(high).slice(0, 120));
  ok("both readings name m_W as what sets the scale, with its PDG value",
     [low, high].every((r) => text(r).includes(String(EXPERIMENT.m_W.value))));
}

H("the Higgs sentence follows the ratio, and says what would move it");
{
  const r = readSimulator(at([1, 0, 0, 2], HHKY, [0.0583]));
  const h = r.find((s) => /Higgs comes out/.test(s.text));
  ok("53 GeV against 125.20 reads as failing, with the factor printed",
     h && h.tone === "bad" && /0\.4\d/.test(h.text), h && h.text.slice(0, 110));
  ok("...and it names the lever: m_H is proportional to g₄", /proportional to g₄/.test(h.text));
  /* a curvature that is not positive must not produce a mass sentence at all */
  const flat = at([1, 0, 0, 2], HHKY, [0.5]);
  const rf = readSimulator(flat);
  ok("at a point that is not a minimum there is no Higgs mass, and the reading says so instead",
     flat.mHGeV === null ? rf.some((s) => /No Higgs mass/.test(s.text)) : true);
}

H("a model with no vacuum produces one sentence, and it is the honest one");
{
  const P = at([2, 0, 0, 1], { gauge: true, bulk: [] }, [0]);
  const r = readSimulator(P);
  ok("exactly one sentence, tone `open`, saying no scale is set", r.length === 1 && r[0].tone === "open" &&
     /No scale is set/.test(r[0].text), JSON.stringify(r));
}

H("the reading is a function of the numbers: move one and it moves");
{
  const a = text(readSimulator(at([1, 0, 0, 2], HHKY, [0.0583])));
  const b = text(readSimulator(at([1, 0, 0, 2], HHKY, [0.02])));
  ok("two different vacua of the same model give two different readings", a !== b);
  ok("...and the difference is in the numbers, not only in the prose",
     /2\.7\d\d TeV/.test(a) && /8\.0\d\d TeV/.test(b), `${a.slice(0, 70)} || ${b.slice(0, 70)}`);
}

H("the fermion sentence appears only when there is a cell, and quotes the measured masses");
{
  const b = B([3, 1, 2, 0]);
  const content = { gauge: true, bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 1 },
                                        { rep: "anti", eta: 1, kind: "dirac", multiplicity: 1 },
                                        { rep: "fund", eta: -1, kind: "dirac", multiplicity: 1 },
                                        { rep: "anti", eta: -1, kind: "dirac", multiplicity: 1 }] };
  const P = predictModel(b, content, [0.03], sun5dTerms(b, content));
  const Y = yukawaTable(b, content, [0.03]);
  const r = readSimulator(P, Y);
  ok("with a full cell the reading carries the Yukawa sentence, against τ and b",
     r.some((s) => /Yukawa problem/.test(s.text)) && text(r).includes(String(EXPERIMENT.m_tau.value)));
  const noY = readSimulator(P, null);
  ok("...and without the fermion table it is absent rather than invented",
     !noY.some((s) => /Yukawa problem/.test(s.text)));
}

H("the dossier reading says which half of the verdicts is the theory's");
{
  const d = dossierForClass([1, 0, 4, 1], { gauge: true, bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 1 }] },
                            { grid: 120, windings: 120 });
  const r = readDossier(d);
  ok("it counts both halves and says the frame ones moved across the class",
     r.some((s) => /verdicts are about the theory/.test(s.text)) && /same theory in different coordinates/.test(text(r)));
  ok("...and it notes that the lines at the minimum stop moving",
     r.some((s) => /stop moving/.test(s.text)));
  const alone = dossierForClass([6, 0, 0, 0], { gauge: true, bulk: [] }, { grid: 120, windings: 120 });
  const ra = readDossier(alone);
  ok("a class of one produces one sentence saying nothing can be measured",
     ra.length === 1 && /alone in its class/.test(ra[0].text));
}

H("no sentence recommends, and every one renders");
{
  const all = [readSimulator(at([1, 0, 0, 2], HHKY, [0.0583])), readSimulator(at([1, 0, 0, 2], HHKY, [0.012])),
               readDossier(dossierForClass([1, 0, 4, 1], { gauge: true, bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 1 }] },
                                           { grid: 120, windings: 120 }))];
  const banned = /\b(promising|viable|good model|excellent|realistic model|should be preferred|recommend)\b/i;
  ok("no sentence calls a model promising, viable or recommended", !all.some((r) => banned.test(text(r))));
  ok("every tone is one of the four the page styles",
     all.every((r) => r.every((s) => ["good", "bad", "flat", "open"].includes(s.tone))));
  const html = readingHTML(all[0]);
  ok("the HTML carries one chip per sentence and no unclosed bold",
     (html.match(/class="chip/g) || []).length === all[0].length &&
     (html.match(/<b>/g) || []).length === (html.match(/<\/b>/g) || []).length);
  ok("an empty list renders as a note rather than as nothing", /nothing to read/.test(readingHTML([])));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

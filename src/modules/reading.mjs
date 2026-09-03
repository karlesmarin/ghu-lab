/* reading.mjs — the results, read back in sentences: what the numbers say, what they do not, and
 * which one to move next.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY A MODULE AND NOT A PARAGRAPH IN THE SECTION.  A reader who moves a slider gets fifteen
 * numbers back and has to know the field to see which of them just decided something.  This turns
 * the same computed object into ordered sentences — the verdict first, then what it rests on, then
 * what it would take to change it.  Being a module rather than markup means the harness can hold
 * each sentence to the condition that produced it, so the prose cannot drift from the numbers.
 *
 * THE RULES IT OBEYS, and they are the house's:
 *   - every sentence is a FUNCTION of the computed values, never of a memory of what a model is
 *     "supposed" to do.  If a number changes, the sentence changes or disappears;
 *   - a comparison carries the hypothesis it rests on (the coloron bound needs colour in the bulk)
 *     and the source of the measured number it uses;
 *   - what the instrument cannot decide is said as such, in the same list, not omitted;
 *   - and no sentence is a recommendation about physics.  "Raise g₄ and m_H rises" is arithmetic;
 *     "this model is promising" is not, and does not appear.
 *
 * Each sentence is `{ tone, text }` with tone in `good | bad | flat | open` — the page colours it,
 * `_test_reading.mjs` counts it.
 */
import { EXPERIMENT } from "../kernel/experiment.mjs";

const tev = (x) => `${(x / 1000).toFixed(3)} TeV`;
const gev = (x) => `${x.toFixed(1)} GeV`;

/* THE SIMULATOR'S READING.  `P` is `predictModel`'s object and `Y` is `yukawaTable`'s (or null). */
export function readSimulator(P, Y = null, exp = EXPERIMENT) {
  const out = [];
  const say = (tone, text) => out.push({ tone, text });

  if (!P.located) {
    say("open", `**No scale is set here.** ${P.why}. The Wilson line has to break something for the ` +
                `measured W mass to fix 1/R: move the probe off the symmetric point, or give the model a ` +
                `bulk content whose potential has a minimum inside the domain.`);
    return out;
  }

  const invR = P.invRGeV, bound = exp.dijet_coloron;
  /* 1. the scale, and the one bound that applies without an embedding */
  if (invR >= bound.value)
    say("good", `**The compactification scale is ${tev(invR)}**, above CMS's ${tev(bound.value)} limit on ` +
                `colour-octet vectors — so the first Kaluza–Klein level is not excluded by that search, ` +
                `whether or not colour lives in the bulk.`);
  else
    say("bad", `**The compactification scale is ${tev(invR)}**, below CMS's ${tev(bound.value)} limit on ` +
               `colour-octet vectors (JHEP 05 (2020) 033). *If colour lives in the bulk* the first ` +
               `Kaluza–Klein level is a coloron of that mass and this model is excluded; if colour is on ` +
               `a brane, the bound does not reach it and the page cannot decide which.`);
  say("flat", `That scale is m_W / (m_W·R) with m_W = ${exp.m_W.value} ± ${exp.m_W.error} GeV (PDG 2025) ` +
              `and m_W·R = ${P.ladder.mWR.toFixed(4)} read off the vacuum. Every mass below follows from it.`);

  /* 2. the Higgs */
  if (P.mHGeV === null || P.mHGeV === undefined)
    say("open", `**No Higgs mass:** the curvature at this point is not positive in every phase, so the ` +
                `point is not a minimum and the second derivative gives no mass.`);
  else {
    const r = P.mHGeV / exp.m_h.value;
    const tone = Math.abs(r - 1) < 0.1 ? "good" : "bad";
    say(tone, `**The Higgs comes out at ${gev(P.mHGeV)}**, ${r < 1 ? "below" : "above"} the measured ` +
              `${exp.m_h.value} ± ${exp.m_h.error} GeV by a factor ${r.toFixed(2)}. It is one loop, at this ` +
              `vacuum, with g₄ = ${P.run.g2.toFixed(3)} — and m_H is proportional to g₄, so a bulk coupling ` +
              `${(1 / r).toFixed(2)}× larger would put it on the measured value with nothing else moving.`);
  }

  /* 3. the electroweak embedding */
  if (P.sin2Embedding === null)
    say("open", `**sin²θ_W is not fixed here:** the massless content does not pin a hypercharge, either ` +
                `because no full Standard-Model cell is present or because the fields found leave a free ` +
                `direction. The Standard Model line above says which.`);
  else {
    const g = P.sin2Gap;
    say(Math.abs(g) < 0.02 ? "good" : "flat",
        `**The embedding forces sin²θ_W = ${P.sin2Embedding.toFixed(4)} at 1/R**, where the Standard Model ` +
        `run up from ŝ²_Z = ${exp.sin2_MZ_msbar.value} (PDG 2024) gives ${P.sin2DataAtInvR.toFixed(4)}. The ` +
        `gap of ${g.toFixed(3)} is what the Kaluza–Klein towers and any brane kinetic terms have to supply; ` +
        `the running above 1/R becomes a power law and is not included here.`);
  }

  /* 4. the fermions */
  if (Y && !Y.why) {
    const heavy = [...new Set(Y.rows.flatMap((r) => r.masses.map((m) => m.overW.toFixed(2))))];
    const massless = Y.rows.filter((r) => r.massless > 1e-9).map((r) => r.field);
    if (heavy.length)
      say("bad", `**Every fermion the Wilson line lifts sits at ${heavy.join(" or ")} × m_W** — ` +
                 `${heavy.map((h) => gev(+h * exp.m_W.value)).join(" or ")} — against a τ of ` +
                 `${exp.m_tau.value} GeV and a b of ${exp.m_b.value} GeV. That is the Yukawa problem of flat ` +
                 `gauge–Higgs unification: with no bulk masses, no brane mixing and no boundary kinetic ` +
                 `terms, one generation comes out degenerate at the weak scale.`);
    if (massless.length)
      say("open", `**${massless.join(", ")} stay massless at this vacuum** — the Wilson line does not reach ` +
                  `them, so their mass would have to come from somewhere this page does not model.`);
  }

  /* 5. what would move the verdict */
  const lever = invR < bound.value
    ? `a smaller Wilson-line angle: 1/R scales as 1/(m_W·R), so reaching ${tev(bound.value)} needs ` +
      `m_W·R ≈ ${(exp.m_W.value / bound.value).toFixed(4)}, against ${P.ladder.mWR.toFixed(4)} here`
    : `a larger bulk content: the angle grows with the matter that pulls the minimum away from the ` +
      `symmetric point`;
  say("flat", `**The lever is ${lever}.** In the published models that is done with large multiplicities ` +
              `and large representations, which is what the scan of the whole space says too.`);
  return out;
}

/* the same for the dossier: which verdicts are the theory's, said in words */
export function readDossier(d) {
  const out = [];
  const say = (tone, text) => out.push({ tone, text });
  const inv = d.counts.invariant, ga = d.counts.gauge;
  if (d.size === 1) {
    say("open", `**This boundary condition is alone in its class**, so nothing here can be measured: ` +
                `every line is trivially the same on every member. Move to a class with more than one member.`);
    return out;
  }
  say(ga > inv ? "bad" : "good",
      `**${inv} of the ${inv + ga} computed verdicts are about the theory; ${ga} are about the frame.** ` +
      `The frame ones changed when the boundary condition was replaced by one of the ${d.size - 1} others ` +
      `in its class — the same theory in different coordinates.`);
  const vac = d.lines.find((l) => l.key === "vacUnbroken");
  if (vac && vac.tag === "invariant")
    say("good", `**Read at the minimum instead of at the symmetric point, the group, the massless counts ` +
                `and the anomaly verdict stop moving** — which is why those lines are the ones to quote.`);
  const an = d.lines.find((l) => l.key === "anomaly");
  if (an && an.tag === "gauge")
    say("bad", `**The anomaly verdict at the symmetric point is the frame's here** (${an.distinct.join(" / ")}), ` +
               `so quoting it about the theory would be quoting a coordinate choice.`);
  return out;
}

/* one line of HTML per sentence, with the tone as a chip the page already styles */
export function readingHTML(list) {
  const chip = { good: "ver", bad: "bad", flat: "mea", open: "bad" };
  const md = (t) => t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  if (!list.length) return `<div class="note">nothing to read here yet</div>`;
  return list.map((s) => `<div style="margin-bottom:7px"><span class="chip ${chip[s.tone]}">` +
    `${s.tone === "good" ? "holds" : s.tone === "bad" ? "fails" : s.tone === "open" ? "undecided" : "how"}` +
    `</span> ${md(s.text)}</div>`).join("");
}

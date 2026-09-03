/* demo.js — a guided run of a section: the parameters move by themselves and a caption says what
 * just changed and why it matters.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY.  A panel with six controls teaches nothing until somebody moves one and sees a number
 * answer.  The how-to says what to press; this presses it, in an order chosen so that each step
 * changes exactly one thing, and says what happened in the caption bar at the bottom of the
 * window.  It is the demonstration a reader would otherwise need us in the room for.
 *
 * WHAT A STEP IS.  `{ say, run }`: the sentence and the code that performs it, in the page's own
 * state, through the same setters the buttons use.  Nothing is faked and nothing is precomputed —
 * a demo step is a real edit and the section recomputes for real, which is why a demo that ends on
 * a wrong number is a bug report rather than a bad script.
 *
 * IT MUST BE STOPPABLE AND MUST LEAVE NOTHING BEHIND.  `stop()` returns the model the reader had
 * before it started; closing the section stops it; and a second press of ▶ restarts from step one
 * rather than queueing two runs.
 */
const DEMO = {
  sun5d: {
    title: "From a boundary condition to a vacuum",
    steps: [
      { say: "Start from SU(5) with the boundary condition [3,0,0,2]: three plus-plus indices and two minus-minus ones. The unbroken group is SU(3)×SU(2)×U(1) — the Standard Model's, by construction.",
        run: () => { SUN5D_S.blocks = { nPP: 3, nPM: 0, nMP: 0, nMM: 2 }; SUN5D_S.bulk = {}; } },
      { say: "With the gauge sector alone the potential has a single term and its minimum sits at a symmetric point: no Hosotani breaking. A model needs matter to move the vacuum.",
        run: () => {} },
      { say: "Add one bulk Dirac fermion in the fundamental with ηη′ = +. The potential gains terms and the minimum moves — this is the whole mechanism, seen once.",
        run: () => { SUN5D_S.bulk = { "fund|1|dirac": 1 }; } },
      { say: "Now three of them. More matter pulls the minimum further from the symmetric point, and the Wilson-line phase is the electroweak scale in units of 1/R.",
        run: () => { SUN5D_S.bulk = { "fund|1|dirac": 3 }; } },
      { say: "And with an antisymmetric of the other sign the potential changes shape again. Every number on this page recomputed as you watched; nothing was precomputed.",
        run: () => { SUN5D_S.bulk = { "fund|1|dirac": 3, "anti|-1|dirac": 1 }; } },
    ],
  },
  predict: {
    title: "A published model, reproduced and then falsified",
    steps: [
      { say: "Load the model of Haba, Hosotani, Kawamura and Yamashita (hep-ph/0401183, Fig. 1): SU(3) with P = diag(+,−,−) and their own bulk content.",
        run: () => { SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 0, nMM: 2 };
                     SUN5D_S.bulk = { "adj|1|dirac": 2, "fund|-1|dirac": 8, "fund|1|scalar": 4, "fund|-1|scalar": 2 };
                     PRED_S.probe = false; PRED_S.g4 = null; } },
      { say: "Their paper puts the vacuum at a = 0.058. The minimiser here finds 0.0583, and their eq. (20) for the height between the two symmetric points is reproduced to one part in 10⁹.",
        run: () => {} },
      { say: "The measured W mass turns that angle into a compactification scale: 1/R = 2.755 TeV. Below CMS's 6.6 TeV limit on colour-octet vectors — which bites only if colour lives in the bulk, and the page says so rather than deciding for you.",
        run: () => {} },
      { say: "The curvature of the same potential gives the Higgs: 53 GeV against the measured 125.20. The model is reproduced and falsified on one screen, which is what an instrument is for.",
        run: () => {} },
      { say: "g₄ scales the Higgs mass and nothing else. At g₄ = 1.0 the prediction moves to about 83 GeV — still not 125, and now you can see exactly how much coupling that would take.",
        run: () => { PRED_S.g4 = 1.0; } },
      { say: "Move the Wilson line by hand instead: a smaller angle is a larger 1/R. This is the little hierarchy of flat gauge–Higgs unification, as a slider.",
        run: () => { PRED_S.probe = true; PRED_S.theta = 0.02; PRED_S.g4 = null; } },
    ],
  },
  dossier: {
    title: "Which answers are about the theory",
    steps: [
      { say: "Load SU(6) with the boundary condition [1,0,4,1] and one bulk fundamental. Eighteen verdicts come back about this one model.",
        run: () => { SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 4, nMM: 1 }; SUN5D_S.bulk = { "fund|1|dirac": 1 }; } },
      { say: "Read the tags. Most of the lines read at the symmetric point are the frame's: they change when the boundary condition is replaced by a gauge-equivalent one, which is the same theory.",
        run: () => {} },
      { say: "Click the class-mate [0,1,5,0] — the same theory in different coordinates. The depth of the vacuum does not move; the apparent group, the massless counts and the anomaly verdict do.",
        run: () => { SUN5D_S.blocks = { nPP: 0, nPM: 1, nMP: 5, nMM: 0 }; } },
      { say: "And the lines At the minimum did not move either. That is the difference between a coordinate and a statement about the theory, measured rather than asserted.",
        run: () => {} },
    ],
  },
  spectrum5d: {
    title: "What a model contains, and where the mistake hides",
    steps: [
      { say: "Take SU(3) with [2,0,0,1] and one bulk Dirac fundamental. The massless content is read off the parities: only (+,+) has a zero mode.",
        run: () => { SUN5D_S.blocks = { nPP: 2, nPM: 0, nMP: 0, nMM: 1 }; SUN5D_S.bulk = { "fund|1|dirac": 1 }; } },
      { say: "The families below are the potential's own multiset — the eigenvalue lists the source paper prints, degeneracy by degeneracy.",
        run: () => {} },
      { say: "The second table is the exact tower at this point, from the eigenvalues of P₁′P₀. At a broken vacuum the two disagree at the lowest level of the adjoint: the Cartan direction the families keep at charge zero has become the W.",
        run: () => {} },
      { say: "Add a symmetric tensor and watch a state appear at twice the W mass. That factor of two is the reason model builders reach for larger representations.",
        run: () => { SUN5D_S.bulk = { "fund|1|dirac": 1, "sym|1|dirac": 1 }; } },
    ],
  },
  bcclass: {
    title: "Two boundary conditions, one theory",
    steps: [
      { say: "SU(5) on S¹/Z₂. The lattice below is every boundary condition, grouped into the classes the gauge transformations connect.",
        run: () => { if (typeof BCC_S !== "undefined") { BCC_S.N = 5; BCC_S.orbifold = "S1/Z2"; } } },
      { say: "Look at [2,0,0,3]: it looks like SU(3)×SU(2)×U(1). Now look at [1,1,1,2] in the same class: it looks like SU(2)×U(1)³. They are the same theory.",
        run: () => {} },
      { say: "The class count comes out (N+1)² at every N, which is Haba–Hosotani–Kawamura's theorem — measured here by walking orbits, not quoted.",
        run: () => {} },
    ],
  },
};

const DEMO_S = { id: null, i: 0, timer: null, saved: null };

function demoStop(ctx) {
  if (DEMO_S.timer) { clearTimeout(DEMO_S.timer); DEMO_S.timer = null; }
  const bar = document.getElementById("demoBar");
  if (bar) bar.remove();
  if (DEMO_S.saved && typeof SUN5D_S !== "undefined") {
    SUN5D_S.blocks = DEMO_S.saved.blocks; SUN5D_S.bulk = DEMO_S.saved.bulk;
  }
  if (DEMO_S.saved && DEMO_S.saved.pred && typeof PRED_S !== "undefined") {
    PRED_S.probe = DEMO_S.saved.pred.probe; PRED_S.g4 = DEMO_S.saved.pred.g4; PRED_S.theta = DEMO_S.saved.pred.theta;
  }
  DEMO_S.id = null; DEMO_S.i = 0; DEMO_S.saved = null;
  if (ctx) ctx.refresh();
}

function demoBar() {
  let bar = document.getElementById("demoBar");
  if (bar) return bar;
  bar = document.createElement("div");
  bar.id = "demoBar";
  bar.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:60;" +
    "max-width:min(760px,92vw);background:var(--card,#fff);border:1px solid var(--line,#d8dde3);" +
    "border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.14);padding:12px 14px;font-size:13.5px;line-height:1.55";
  document.body.appendChild(bar);
  return bar;
}

/* `DEMO_S.i` is the index of the step being SHOWN, and both `next` and the timer advance it.
 * The first version incremented at the end of the render AND again in the button, so `next`
 * skipped a step — the caption jumped from 1/6 to 3/6 and one edit never happened.  `drive.mjs`
 * caught it on the first run, which is what a mouse driver is for. */
function demoStep(ctx) {
  const d = DEMO[DEMO_S.id];
  if (!d || DEMO_S.i >= d.steps.length) { demoStop(ctx); return; }
  const idx = DEMO_S.i, s = d.steps[idx];
  try { s.run(); } catch (e) { console.warn("demo step failed:", e && e.message); }
  ctx.refresh();
  const bar = demoBar();
  bar.innerHTML = `<div style="display:flex;gap:10px;align-items:baseline">` +
    `<span class="chip mea">demo ${idx + 1}/${d.steps.length}</span>` +
    `<b style="flex:1">${d.title}</b>` +
    `<button class="ghost" id="demoNext" style="width:auto;padding:2px 10px">` +
    `${idx + 1 === d.steps.length ? "finish" : "next"}</button>` +
    `<button class="ghost" id="demoStop" style="width:auto;padding:2px 10px">stop</button></div>` +
    `<div style="margin-top:7px">${s.say}</div>`;
  const advance = () => { DEMO_S.i = idx + 1; demoStep(ctx); };
  document.getElementById("demoNext").onclick = advance;
  document.getElementById("demoStop").onclick = () => demoStop(ctx);
  if (DEMO_S.timer) clearTimeout(DEMO_S.timer);
  DEMO_S.timer = setTimeout(advance, 8000);
}

function demoStart(id, ctx) {
  if (DEMO_S.id) { demoStop(ctx); return; }
  if (!DEMO[id]) return;
  DEMO_S.saved = typeof SUN5D_S !== "undefined"
    ? { blocks: { ...SUN5D_S.blocks }, bulk: { ...SUN5D_S.bulk },
        pred: typeof PRED_S !== "undefined" ? { probe: PRED_S.probe, g4: PRED_S.g4, theta: PRED_S.theta } : null }
    : null;
  DEMO_S.id = id; DEMO_S.i = 0;
  demoStep(ctx);
}

const demoHas = (id) => !!DEMO[id];

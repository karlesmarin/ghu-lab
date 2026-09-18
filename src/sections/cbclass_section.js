/* cbclass_section.js — "Conjugate boundary conditions": the panel that shows BOTH hypotheses.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS PANEL IS FOR, AND WHY IT IS `ready: true` WHEN THE MATHEMATICS IS NOT SETTLED.
 * From 2026-09-07 to 2026-09-15 this file was a REGISTRATION and nothing else: `ready: false`,
 * listed on the rail with "not built yet", unclickable.  The reason given was that a panel
 * promising a classification we do not have "would be the tool telling its first lie".
 *
 * That reason was right about the COUNT and wrong about the PANEL.  A panel that ships the count
 * alone would lie.  A panel that ships the count AND the condition it rests on AND the measurement
 * that says the condition is unsupported does not lie — it is the only honest place that
 * measurement can live, and a tool nobody can open from the app is a tool that does not exist.
 * So the panel opens, and what it puts on screen is the DISAGREEMENT rather than a number.
 *
 * ================================================================================================
 * THE OBJECT
 * ================================================================================================
 *
 * A conjugate boundary condition identifies a field with its charge conjugate under the orbifold
 * reflection,   psi(y_i - y) = P_i psi^c(y_i + y),   so its zero mode is a four-dimensional
 * MAJORANA fermion — the thing a five-dimensional spinor cannot otherwise be.
 * Grzadkowski–Wudka (Phys. Rev. D 72 (2005) 125012) derive the allowed form of the twists;
 * Abe–Goto–Kawamura–Nishikawa (MPLA 31 (2016) 1650208) name the object and use it.
 *
 * NOBODY HAS TAKEN THE QUOTIENT, and that is measured rather than assumed — a word count over
 * eight papers spanning 2001–2025 (the table in `src/modules/cbclass.mjs`) finds the two halves
 * never in the same paper.  Yoshiharu Kawamura is an author of three of the equivalence-class
 * papers AND of the conjugate one; he holds both halves and did not join them.
 *
 * ================================================================================================
 * THE TWO HYPOTHESES, WHICH ARE THE POINT OF THE PANEL
 * ================================================================================================
 *
 * The twists move by CONGRUENCE, P_i -> Omega_i P_i Omega_i^T.  Whether Omega(0) and Omega(pi R)
 * may be taken INDEPENDENT decides the answer, and the two branches are genuinely different:
 *
 *   INDEPENDENT   the label is (eps_0, eps_1) alone  ->  4 classes for N even, 1 for N odd,
 *                 FLAT IN N, against the ordinary (N+1)^2.
 *   SINGLE        the holonomy H = P_1 P_0^* moves by unitary similarity, so its SPECTRUM is
 *                 extra label  ->  the label carries a continuous parameter and there is no
 *                 finite count at all.
 *
 * The ordinary case is entitled to take them independent because the Wilson line absorbs the
 * relative gauge transformation — the Hosotani mechanism.  MEASURED (`cbc_absorption_gate.py`):
 * that entitlement does NOT transfer.  Relative positions with the label fixed have dimension
 * N(N-1)/2 = 1, 6, 15 while the surviving zero modes have dimension N/2 = 1, 2, 3, so for N >= 4
 * the Wilson line has too few degrees of freedom, with N = 2 the exact boundary case.
 *
 * That does not show the four-class count is false.  It removes the only reason that was being
 * assumed for it — and the panel says exactly that, in those words, rather than picking a side.
 *
 * ================================================================================================
 * AND THE LINE THE PANEL EXISTS TO PUT ON SCREEN
 * ================================================================================================
 *
 * The unbroken group is NOT a function of the label.  U(N/2) is the COMPATIBLE stratum, which has
 * measure zero; a random relative position sees only U(1)^{N/2}, and the pure label falls from
 * SO(N) to trivial.  Measured, calibrated against dim so(N) and dim sp(N/2) before being believed.
 * It is the same headline `bcclass` carries one panel up, reached by a different route — and a
 * reader who has just seen that one should see this one immediately afterwards.
 */

const CBC_S = {
  N: 4,
  eps: [+1, -1],      /* the dial: the pair (eps_0, eps_1) */
};

const CBC_MAX_N = 12;

const CBC_SECTION = {
  id: "cbclass",
  label: "Conjugate boundary conditions",
  paper: "Grządkowski–Wudka 2005 · Abe–Goto–Kawamura–Nishikawa 2016",
  ready: true,
  /* EMPTY, like its sibling, and that is a ruling rather than a shortcut.  `modules` is a list of
   * RESOLVER modules -- objects with {id, provides, requires, compute} -- while `cbclass.mjs`
   * exports PURE FUNCTIONS, which the inliner drops into the same scope anyway.  Passing the
   * module NAME here produced "m.provides is not iterable" and a RED build, from the smoke gate
   * rather than from a user.  `_test_app.mjs` allows [] only for a section that also declares
   * holds(), and this one does. */
  modules: [],

  holds() {
    const u = cbcUnbroken(CBC_S.eps, CBC_S.N);
    return `SU(${CBC_S.N}) · S¹/Z₂ conjugate · ${cbcShow(CBC_S.eps)} → ` +
           `${u.compatible.label} compatible, ${u.generic.label} generic`;
  },

  encodeState() {
    return `n:${CBC_S.N}~e:${CBC_S.eps.map((e) => (e > 0 ? "S" : "A")).join("")}`;
  },

  decodeState(v) {
    CBC_S.N = 4;
    CBC_S.eps = [+1, -1];
    for (const t of String(v || "").split("~")) {
      const i = t.indexOf(":");
      if (i < 0) continue;
      const k = t.slice(0, i), x = t.slice(i + 1);
      if (k === "n") {
        const n = parseInt(x, 10);
        if (Number.isFinite(n) && n >= 2 && n <= CBC_MAX_N) CBC_S.N = n;
      } else if (k === "e" && /^[SA]{2}$/.test(x)) {
        CBC_S.eps = [x[0] === "S" ? 1 : -1, x[1] === "S" ? 1 : -1];
      }
    }
    /* A LABEL A LINK CANNOT HOLD IS REPAIRED HERE AND NOWHERE ELSE.  N odd admits no
     * antisymmetric twist, so `n:5~e:SA` is not a boundary condition -- it degrades to the only
     * label that exists there rather than to a panel computing about nothing. */
    if (CBC_S.N % 2) CBC_S.eps = [+1, +1];
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">A <b>conjugate</b> boundary condition identifies a field with its
    <b>charge conjugate</b> under the orbifold reflection, ψ(y<sub>i</sub>−y) =
    P<sub>i</sub> ψ<sup>c</sup>(y<sub>i</sub>+y), so its zero mode is a four-dimensional
    <b>Majorana</b> fermion — which a five-dimensional spinor cannot otherwise be.</p>
    <div class="note" style="margin-top:9px">The panel next to this one answers
    <i>which boundary conditions are the same theory?</i> for the <b>ordinary</b> case. For the
    conjugate one <b>that question has no published answer</b>: the papers that classify never say
    "conjugate", and the paper that introduces conjugate conditions never says "equivalence class".
    This panel is what that empty intersection looks like when you compute it — including the part
    that does <b>not</b> close.</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="margin:0 0 10px">The condition</h3>
    <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <div class="lbl">N</div>
        <div id="cbcNCtl" style="display:flex;gap:6px;align-items:center;margin-top:4px">
          <button class="ghost" data-n="-1">−</button>
          <span id="cbcN" style="min-width:2.2em;text-align:center;font-weight:650"></span>
          <button class="ghost" data-n="1">+</button>
        </div>
      </div>
      <div>
        <div class="lbl">twist at y = 0</div>
        <div id="cbcE0" style="margin-top:4px"></div>
      </div>
      <div>
        <div class="lbl">twist at y = πR</div>
        <div id="cbcE1" style="margin-top:4px"></div>
      </div>
    </div>
    <div id="cbcParity" class="note" style="margin-top:11px"></div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="margin:0 0 4px">How many classes there are — under each hypothesis</h3>
    <p class="note" style="margin:0 0 11px">The twists move by <b>congruence</b>,
    P<sub>i</sub> → Ω<sub>i</sub> P<sub>i</sub> Ω<sub>i</sub><sup>T</sup>, not by similarity.
    Whether Ω(0) and Ω(πR) may be taken <b>independent</b> decides the answer, and this is the open
    question — so both branches are shown, and neither is chosen for you.</p>
    <div id="cbcCount"></div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="margin:0 0 4px">Does the Wilson line absorb the difference?</h3>
    <p class="note" style="margin:0 0 11px">The ordinary case may take them independent because the
    Wilson line absorbs the relative gauge transformation — the Hosotani mechanism. Whether that
    entitlement transfers is a <b>dimension count</b>, and it is the one measurement that moves this
    question.</p>
    <div id="cbcAbsorb"></div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="margin:0 0 4px">What this label leaves unbroken</h3>
    <p class="note" style="margin:0 0 11px">And the answer is <b>not a property of the label</b> —
    which is the same thing the ordinary panel says about itself, reached here by a different
    route.</p>
    <div id="cbcUnbroken"></div>
  </div>

  <div class="card">
    <h3 style="margin:0 0 4px">What is known, and by whom</h3>
    <div id="cbcHonesty"></div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("cbcNCtl").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const n = CBC_S.N + +b.dataset.n;
        if (n < 2 || n > CBC_MAX_N) return;
        CBC_S.N = n;
        if (n % 2) CBC_S.eps = [+1, +1];
        ctx.refresh();
      };
    });
    for (const [i, id] of [[0, "cbcE0"], [1, "cbcE1"]]) {
      $(id).innerHTML =
        `<button class="ghost" data-e="1">symmetric</button>` +
        `<button class="ghost" data-e="-1">antisymmetric</button>`;
      $(id).querySelectorAll("button").forEach((b) => {
        b.onclick = () => {
          const e = +b.dataset.e;
          /* N odd HAS no antisymmetric twist.  The button refuses rather than producing a label
           * the mathematics does not have -- and `render` explains why it is greyed. */
          if (e === -1 && CBC_S.N % 2) return;
          CBC_S.eps = CBC_S.eps.slice();
          CBC_S.eps[i] = e;
          ctx.refresh();
        };
      });
    }
  },

  /* THE CARD CARRIES THE HYPOTHESIS, not just the number.  `cbcCount` already attaches
   * `independence` to everything it returns; the export hands that over intact, so a reader who
   * keeps the file keeps the condition the count rests on. */
  texExport() {
    const c = cbcCount(CBC_S.N), u = cbcUnbroken(CBC_S.eps, CBC_S.N);
    const L = [];
    L.push(`% Conjugate boundary conditions, SU(${CBC_S.N}) on $S^1/Z_2$`);
    L.push(`% label ${cbcShow(CBC_S.eps)}`);
    L.push(`\\begin{itemize}`);
    L.push(`\\item Classes, \\emph{if} $\\Omega(0)$ and $\\Omega(\\pi R)$ are independent: ` +
           `${c.independent.classes} (ordinary case at the same $N$: ${c.ordinary_for_contrast}).`);
    L.push(`\\item If a single $\\Omega$: the label also carries the spectrum of ` +
           `$H = P_1 P_0^*$, so there is no finite count.`);
    L.push(`\\item Unbroken: ${u.compatible.label} on the compatible stratum (measure zero), ` +
           `${u.generic.label} at a generic relative position. Not a class function.`);
    L.push(`\\item Independence: ${c.independence.status}. ` +
           `${c.independence.candidate_resolution}`);
    L.push(`\\end{itemize}`);
    return L.join("\n");
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    $("cbcN").textContent = String(CBC_S.N);
    const odd = CBC_S.N % 2 === 1;
    for (const [i, id] of [[0, "cbcE0"], [1, "cbcE1"]]) {
      $(id).querySelectorAll("button").forEach((b) => {
        const on = +b.dataset.e === CBC_S.eps[i];
        b.style.color = on ? "var(--rust)" : "";
        b.style.fontWeight = on ? "650" : "";
        b.disabled = (+b.dataset.e === -1 && odd);
        b.style.opacity = b.disabled ? ".38" : "";
      });
    }
    $("cbcParity").innerHTML = odd
      ? `<b>N is odd, so there is no antisymmetric twist.</b> A non-singular antisymmetric matrix ` +
        `needs even size, so only the symmetric label exists here — which is the whole reason the ` +
        `count below is <b>1</b> rather than 4. The button is not disabled to be tidy; the object ` +
        `is not there.`
      : `Consistency forces P<sub>i</sub><sup>T</sup> = ε<sub>i</sub> P<sub>i</sub> with ` +
        `ε<sub>i</sub> = ±1, and by <b>Autonne–Takagi</b> that sign is a <b>complete</b> invariant ` +
        `at one fixed point: every symmetric unitary is congruent to <b>1</b>, every antisymmetric ` +
        `one to <b>J</b>. So the invariant of a fixed point is a <b>sign</b>, not a spectrum.`;
    this._count(ctx);
    this._absorb(ctx);
    this._unbroken(ctx);
    this._honesty(ctx);
  },

  /* ---------------------------------------------------------------- the two hypotheses */

  _count(ctx) {
    const c = cbcCount(CBC_S.N);
    document.getElementById("cbcCount").innerHTML =
      `<table style="width:100%;border-collapse:collapse">
       <tr><th style="text-align:left;padding:4px 8px 4px 0">hypothesis</th>
           <th style="text-align:left;padding:4px 8px">the label is</th>
           <th style="text-align:right;padding:4px 0 4px 8px">classes</th></tr>
       <tr><td style="padding:6px 8px 6px 0"><b>Ω(0), Ω(πR) independent</b><br>
           <span class="note">what the ordinary treatment does</span></td>
           <td style="padding:6px 8px">(ε₀, ε₁)</td>
           <td style="padding:6px 0 6px 8px;text-align:right;font-weight:650">
           ${c.independent.classes}</td></tr>
       <tr><td style="padding:6px 8px 6px 0"><b>one Ω at both points</b><br>
           <span class="note">H = P₁P₀* moves by unitary similarity</span></td>
           <td style="padding:6px 8px">(ε₀, ε₁) <b>and the spectrum of H</b></td>
           <td style="padding:6px 0 6px 8px;text-align:right;font-weight:650">∞</td></tr>
       <tr><td style="padding:6px 8px 6px 0;border-top:1px solid var(--rule)">
           <span class="note">the <b>ordinary</b> case at the same N, for contrast</span></td>
           <td style="padding:6px 8px;border-top:1px solid var(--rule)"><span class="note">
           pair of eigenvalue multiplicities</span></td>
           <td style="padding:6px 0 6px 8px;border-top:1px solid var(--rule);text-align:right">
           ${c.ordinary_for_contrast}</td></tr>
       </table>
       <p class="note" style="margin:11px 0 0">The conjugate count is <b>flat in N</b> — 4 for N
       even and 1 for N odd, forever — while the ordinary one grows as (N+1)². At N = 8 that is
       <b>4 against 81</b>. That is what replacing a similarity by a <b>congruence</b> costs.</p>`;
  },

  /* ---------------------------------------------------------------- the measurement that moves it */

  _absorb(ctx) {
    const N = CBC_S.N, rel = (N * (N - 1)) / 2, zero = N / 2;
    const enough = zero >= rel;
    const rows = [2, 4, 6, 8].map((n) => {
      const r = (n * (n - 1)) / 2, z = n / 2, here = n === N;
      return `<tr style="${here ? "font-weight:650" : ""}">
        <td style="padding:3px 10px 3px 0">${n}${here ? " ←" : ""}</td>
        <td style="padding:3px 10px;text-align:right">${r}</td>
        <td style="padding:3px 10px;text-align:right">${z}</td>
        <td style="padding:3px 0 3px 10px">${z >= r ? "absorbs" : "does not absorb"}</td></tr>`;
    }).join("");
    document.getElementById("cbcAbsorb").innerHTML =
      `<table style="border-collapse:collapse">
       <tr><th style="text-align:left;padding:3px 10px 3px 0">N</th>
           <th style="text-align:right;padding:3px 10px">relative positions<br>
           <span class="note">N(N−1)/2</span></th>
           <th style="text-align:right;padding:3px 10px">surviving zero modes<br>
           <span class="note">N/2</span></th>
           <th style="text-align:left;padding:3px 0 3px 10px">Wilson line</th></tr>${rows}</table>
       <p style="margin:11px 0 0">${enough
         ? `<b>At N = ${N} the two numbers agree</b> (${rel} = ${zero}), which is the exact ` +
           `boundary case: here the Wilson line does have the freedom to absorb the relative ` +
           `congruence, and taking Ω(0) and Ω(πR) independent is entitled by the ordinary argument.`
         : `<b>At N = ${N} the Wilson line has ${zero} degrees of freedom against ${rel} ` +
           `directions to absorb.</b> The ordinary argument does <b>not</b> transfer.`}</p>
       <div class="note" style="margin-top:9px">This does <b>not</b> show the four-class count is
       false. It removes the only reason that was being assumed for it — which makes the count
       <b>more</b> conditional, not less. The question it leaves is sharp and is the one worth
       asking: <i>is the holonomy spectrum a label, or a modulus?</i></div>`;
  },

  /* ---------------------------------------------------------------- not a class function */

  _unbroken(ctx) {
    const u = cbcUnbroken(CBC_S.eps, CBC_S.N);
    document.getElementById("cbcUnbroken").innerHTML =
      `<table style="border-collapse:collapse">
       <tr><td style="padding:4px 14px 4px 0"><b>compatible</b> position<br>
           <span class="note">a measure-zero stratum</span></td>
           <td style="padding:4px 0;font-weight:650">${u.compatible.label}</td>
           <td style="padding:4px 0 4px 14px" class="note">dim ${u.compatible.dim}</td></tr>
       <tr><td style="padding:4px 14px 4px 0"><b>generic</b> position<br>
           <span class="note">what a random point sees</span></td>
           <td style="padding:4px 0;font-weight:650">${u.generic.label}</td>
           <td style="padding:4px 0 4px 14px" class="note">dim ${u.generic.dim}</td></tr>
       </table>
       <p style="margin:11px 0 0">${u.note}</p>
       <div class="note" style="margin-top:9px">The drop is <b>discontinuous</b>: interpolating away
       from the compatible point with a unitary exp(tA), the dimension is already down at
       t = 10⁻⁴ and never returns. Ten random samples never land on the special stratum, which is
       how the first version of this computation came to report the special value as the class
       value.</div>`;
  },

  /* ---------------------------------------------------------------- attribution and status */

  _honesty(ctx) {
    const f = cbcFiniteModelFaithful(2, UNITS_REAL);
    const g = cbcFiniteModelFaithful(2, UNITS_GAUSS);
    document.getElementById("cbcHonesty").innerHTML =
      `<p style="margin:0"><b>Theirs.</b> The allowed form of the twists is
       <b>Grządkowski–Wudka</b>, Phys. Rev. D <b>72</b> (2005) 125012. The object, its name and the
       gauge-field parity inversion are <b>Abe–Goto–Kawamura–Nishikawa</b>, MPLA <b>31</b> (2016)
       1650208, eqs. (2.19)–(2.21). That a symmetric twist leaves SO(N) and an antisymmetric one
       Sp(N/2) is standard group theory. The equivalence-class method is
       <b>Haba–Hosotani–Kawamura</b>'s and <b>Takeuchi–Inagaki</b>'s, applied here to a different
       object.</p>
       <p style="margin:11px 0 0"><b>Ours.</b> The application, and the two measurements the panel
       turns on: that the unbroken group is not a function of the label, and that the Wilson line
       does not absorb the relative congruence for N ≥ 4. Both are computations, both are gated,
       and both are stated as measurements rather than theorems.</p>
       <p style="margin:11px 0 0"><b>Open, and asked.</b> Whether Ω(0) and Ω(πR) may be taken
       independent for a conjugate condition. Written to Y. Kawamura on 15 September 2026 — he is
       an author of three of the equivalence-class papers <i>and</i> of the conjugate one, so he
       holds both halves of the gap this panel computes.</p>
       <div class="note" style="margin-top:11px"><b>What this panel cannot do, and why.</b> It
       cannot list the members of a class: unlike the ordinary case the classes are
       <b>continua</b>, so there is no orbit to walk. That is not a limit of the computation — the
       congruence action uses Ω twice and therefore reaches only <b>squares</b>, μ<sub>n</sub>² =
       μ<sub>n/2</sub>, and no finite group of roots of unity is closed under square roots.
       Measured: μ₂ and μ₄ both give ${g.orbits} orbits at N = 2 where the theorem gives
       ${g.expected_by_theory} — ${real_same(f, g)}.</div>`;
  },
};

/* The sentence the null result earned, kept out of the template so it reads as prose.
 *
 * IT MAY NOT USE THE WORD `null`, AND THAT IS NOT A STYLE NOTE.  `extremes.mjs` scans every
 * rendered panel for six tokens that mean a template literal was handed something it did not
 * expect -- NaN, undefined, [object Object], Infinity, ${...} and null -- each as a whole word,
 * on the stated assumption that "none of the prose here does" write them. This sentence did, and
 * on 2026-09-18 it was the only finding in 448 renders: a true sentence flagged as a leaked value.
 * The assumption is worth more than the word. Say "negative result" and the guard stays strict. */
function real_same(f, g) {
  return f.orbits === g.orbits
    ? "unchanged when the units are enlarged, which is the negative result that killed the first " +
      "explanation written for it"
    : "and the counts differ, which the square-closure argument does not predict";
}

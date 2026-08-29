/* sweep5d_section.js — "Scan": the model-building loop, closed.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE FOUR PIECES WERE ALREADY HERE AND NOTHING JOINED THEM.  The builder gives the potential and
 * its vacuum, the spectrum panel says what is massless and whether it is chiral, the anomaly panel
 * says what that content owes, and the boundary-conditions panel says which of these theories are
 * the same theory.  A model builder uses all four on one model at a time.  This one walks the
 * space and applies them in a chain — which is the thing a person cannot do by hand and the reason
 * the instrument earns the word "tool".
 *
 * IT DOES NOT RUN ON RENDER.  The last stage minimises a potential per candidate and that is
 * seconds, not milliseconds, so the sweep runs when it is asked to and the page says what it will
 * cost before it is pressed.  A panel that silently spends three seconds every repaint is a panel
 * people learn to avoid.
 *
 * AND THE HEADLINE IS THE PAIR OF NUMBERS, NOT THE LIST.  Forty surviving boundary conditions that
 * are twelve theories will be read as forty results by anyone who does not know to quotient, so
 * both counts are printed side by side, always, and the class of every survivor is on its row.
 *
 * A hit loads straight into the builder — same shared model as the spectrum and anomaly panels —
 * so the sweep hands you a candidate and the other three panels take it from there.
 *
 * Edited BY HAND.
 */
const SWEEP5D_S = {
  N: 6, maxMult: 1, wantSM: true, needHiggs: "none",
  needChiral: false, needAnomalyFree: false, needBreaking: false,
  result: null, ran: null,
};

const SWEEP5D_SECTION = {
  id: "sweep5d",
  label: "Scan",
  paper: "the four panels, chained",
  ready: true,
  modules: [],

  holds() {
    const s = SWEEP5D_S, r = s.result;
    return `SU(${s.N}) · S¹/Z₂ · every boundary condition × every bulk of ≤ ${s.maxMult} ` +
           `multiplet${s.maxMult === 1 ? "" : "s"} · ` +
           (r ? `${r.total} survivor${r.total === 1 ? "" : "s"} in ${r.classesLeft} ` +
                `equivalence class${r.classesLeft === 1 ? "" : "es"}`
              : "not run yet");
  },

  _opts() {
    const s = SWEEP5D_S;
    return { N: s.N, maxMult: s.maxMult, want: s.wantSM ? [3, 2] : [],
             needHiggs: s.needHiggs, needChiral: s.needChiral,
             needAnomalyFree: s.needAnomalyFree, needBreaking: s.needBreaking };
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">The other four panels answer a question about <b>one</b> model. This one walks
    the space and asks all four at once — which is what a model builder actually does all day, and
    the one thing the instrument could not do.</p>
    <div class="note" style="margin-top:9px">Every boundary condition of SU(N) on S¹/Z₂, crossed
    with every bulk content up to a size you choose, through a chain of filters ordered
    <b>cheapest first</b> so the expensive one — minimising the potential — runs only on what
    already survived. The funnel is reported stage by stage, because <em>“three models survive”</em>
    says nothing without <em>“out of how many, and where the others died”</em>.</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>What to walk, and what to ask of it</h2>
    <div class="grid two" style="gap:18px">
      <div>
        <div class="row" id="swSize"></div>
        <div class="note" style="margin-top:9px" id="swSizeNote">—</div>
      </div>
      <div>
        <div class="row" id="swFilters"></div>
        <div class="note" style="margin-top:9px" id="swFiltersNote">—</div>
      </div>
    </div>
    <div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="primary" id="swRun">▶ run the sweep</button>
      <span class="note" id="swCost">—</span>
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The verdict</h2>
        <div class="verdict stable" id="swVerdict"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The funnel</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>stage</th>
          <th class="num">kept</th><th class="num">of</th></tr></thead>
          <tbody id="swFunnel"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="swFunnelNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>What survived</h2>
        <div style="overflow-x:auto;max-height:420px"><table><thead><tr><th>blocks</th>
          <th>unbroken</th><th>bulk</th><th class="num">class</th><th></th></tr></thead>
          <tbody id="swRows"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="swRowsNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What this panel does not decide</h2>
        <div class="note" id="swHonesty">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    document.getElementById("swRun").onclick = () => {
      const o = this._opts();
      SWEEP5D_S.result = sweep5d({ ...o, capVacuum: 600, maxSurvivors: 400 });
      SWEEP5D_S.ran = o;
      ctx.refresh();
    };
  },

  render(ctx) {
    this._controls(ctx);
    const r = SWEEP5D_S.result;
    this._verdict(r);
    this._funnel(r);
    this._rows(r, ctx);
    this._honesty(r);
  },

  /* ---------------------------------------------------------------- the controls */

  _controls(ctx) {
    const s = SWEEP5D_S;
    /* the label goes on its own line: inline, a label ending in "=" runs straight into the
     * stepper's minus button and "N =  −  6  +" reads as N = −6 */
    const step = (label, val, key, lo, hi) =>
      `<div style="margin:2px 0 8px"><div class="note" style="margin-bottom:3px">${label}</div>` +
      `<span class="stepper">` +
      `<button class="ghost" data-k="${key}" data-d="-1"${val <= lo ? " disabled" : ""}>−</button>` +
      `<span class="cnt">${val}</span>` +
      `<button class="ghost" data-k="${key}" data-d="1"${val >= hi ? " disabled" : ""}>+</button>` +
      `</span></div>`;
    const size = document.getElementById("swSize");
    size.innerHTML = step("the gauge group, SU(N)", s.N, "N", 3, 8) +
                     step("bulk multiplets, at most", s.maxMult, "maxMult", 1, 3);
    size.querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k, lim = k === "N" ? [3, 8] : [1, 3];
        s[k] = Math.max(lim[0], Math.min(lim[1], s[k] + +b.dataset.d));
        s.result = null;                    /* the answer belongs to the question that was asked */
        ctx.refresh();
      };
    });

    const F = [
      ["wantSM", "the unbroken group contains SU(3) × SU(2)"],
      ["needChiral", "the massless spectrum is chiral"],
      ["needAnomalyFree", "the bulk pays its own anomaly"],
      ["needBreaking", "the Wilson line breaks it further"],
    ];
    const box = document.getElementById("swFilters");
    box.innerHTML = F.map(([k, t]) =>
      `<label style="display:block;margin:3px 0;cursor:pointer"><input type="checkbox" ` +
      `data-k="${k}"${s[k] ? " checked" : ""}> ${t}</label>`).join("") +
      `<label style="display:block;margin:3px 0">Higgs: <select data-k="needHiggs">` +
      [["none", "not asked for"], ["any", "a doublet, coloured or not"],
       ["colourless", "a doublet that is a colour singlet"]]
        .map(([v, t]) => `<option value="${v}"${s.needHiggs === v ? " selected" : ""}>${t}</option>`)
        .join("") + `</select></label>`;
    box.querySelectorAll("input,select").forEach((el) => {
      el.onchange = () => {
        s[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value;
        s.result = null;
        ctx.refresh();
      };
    });

    document.getElementById("swSizeNote").innerHTML =
      `SU(${s.N}) has <b>${((s.N + 1) * (s.N + 2) * (s.N + 3) / 6) | 0}</b> boundary conditions ` +
      `and <b>${(s.N + 1) ** 2}</b> equivalence classes, and there are ` +
      `<b>${sweepContents(s.maxMult).length}</b> bulk contents of at most ${s.maxMult} Dirac ` +
      `multiplet${s.maxMult === 1 ? "" : "s"} over the four representations × two parity products.`;
    document.getElementById("swFiltersNote").innerHTML =
      `The chain runs in this order and each filter is cheaper than the one below it. Nothing is ` +
      `asked by default: a default that filters would make the sweep <b>lie about its own ` +
      `denominator</b>, which is exactly what the first version of this panel did.`;

    /* WHAT IT WILL COST, BEFORE IT IS PRESSED. */
    const nPairs = ((s.N + 1) * (s.N + 2) * (s.N + 3) / 6 | 0) * sweepContents(s.maxMult).length;
    const stale = SWEEP5D_S.ran && JSON.stringify(SWEEP5D_S.ran) !== JSON.stringify(this._opts());
    document.getElementById("swCost").innerHTML =
      `${nPairs.toLocaleString("en-US")} pairs to walk. ` +
      (s.needBreaking
        ? `The vacuum filter is on, so up to <b>600</b> potentials get minimised at roughly 10–30 ms ` +
          `each — expect a few seconds. `
        : `Milliseconds: the vacuum filter is off. `) +
      (SWEEP5D_S.result === null
        ? `<b>Not run yet.</b>`
        : stale ? `<b style="color:var(--rust)">The filters changed — the numbers below are the ` +
                  `previous question's.</b>` : `Ran in ${SWEEP5D_S.result.ms.toFixed(0)} ms.`);
  },

  /* ---------------------------------------------------------------- the verdict */

  _verdict(r) {
    const el = document.getElementById("swVerdict");
    if (!r) {
      el.className = "verdict stable";
      el.innerHTML = `<b>Not run</b><span>Choose what to walk and what to ask of it, then press ` +
        `run. Nothing is asked for by default, so the first run returns the whole space and the ` +
        `funnel shows you its size.</span>`;
      return;
    }
    const asked = [SWEEP5D_S.wantSM && "SU(3) × SU(2)",
                   SWEEP5D_S.needHiggs !== "none" && "a Higgs doublet",
                   SWEEP5D_S.needChiral && "chirality",
                   SWEEP5D_S.needAnomalyFree && "a self-paying bulk",
                   SWEEP5D_S.needBreaking && "a broken vacuum"].filter(Boolean);
    if (!r.total) {
      el.className = "verdict stable";
      el.innerHTML = `<b>Nothing survives</b><span>Of ${r.stages[0].kept.toLocaleString("en-US")} ` +
        `pairs, none passes ${asked.length ? asked.join(" + ") : "the chain"}. The funnel says at ` +
        `which stage they died — and an empty answer <b>is</b> an answer here, provided the filters ` +
        `are not stuck: each of them keeps something on its own, which the harness checks. ` +
        `<span class="chip ver">verified</span></span>`;
      return;
    }
    el.className = "verdict breaks";
    el.innerHTML = `<b>${r.total} pair${r.total === 1 ? "" : "s"} — but ${r.classesLeft} ` +
      `theor${r.classesLeft === 1 ? "y" : "ies"}</b><span>` +
      `${r.total} (boundary condition, content) pairs out of ` +
      `${r.stages[0].kept.toLocaleString("en-US")} pass ${asked.length ? asked.join(" + ") : "the chain"}, ` +
      `and they sit in <b>${r.classesLeft}</b> equivalence class${r.classesLeft === 1 ? "" : "es"}. ` +
      `The second number is the one to quote: boundary conditions related by ` +
      `[p,q,r,s] ~ [p−1,q+1,r+1,s−1] are the same theory in different coordinates, so counting the ` +
      `first as a count of models overcounts by ${(r.total / Math.max(1, r.classesLeft)).toFixed(1)}×. ` +
      `<span class="chip mea">measured</span></span>`;
  },

  /* ---------------------------------------------------------------- the funnel */

  _funnel(r) {
    const body = document.getElementById("swFunnel");
    if (!r) { body.innerHTML = `<tr><td colspan="3" class="note">—</td></tr>`;
              document.getElementById("swFunnelNote").textContent = "—"; return; }
    body.innerHTML = r.stages.map((s, i) => {
      const prev = i === 0 ? s.kept : r.stages[i - 1].kept;
      const died = prev - s.kept;
      return `<tr${died ? "" : ' style="color:var(--ink3)"'}>` +
        `<td>${s.name}${s.undecided ? ` <span class="chip bad">${s.undecided} undecided</span>` : ""}` +
        `${s.capped ? ' <span class="chip bad">budget</span>' : ""}</td>` +
        `<td class="num"><b>${s.kept.toLocaleString("en-US")}</b></td>` +
        `<td class="num note">${i === 0 || !died ? "—" : "−" + died.toLocaleString("en-US")}</td></tr>`;
    }).join("");
    const last = r.stages[r.stages.length - 1];
    document.getElementById("swFunnelNote").innerHTML =
      `Cheapest filter first, so the expensive one runs on the fewest candidates. ` +
      (last.checked !== undefined
        ? `<b>${last.checked}</b> potentials were actually minimised` +
          (last.undecided ? `, and <b>${last.undecided}</b> could not be decided at all — see ` +
                            `below, an undecided vacuum is not a no.` : `.`)
        : `The vacuum filter was not asked for, so no potential was minimised.`);
  },

  /* ---------------------------------------------------------------- the survivors */

  _rows(r, ctx) {
    const body = document.getElementById("swRows");
    if (!r || !r.total) {
      body.innerHTML = `<tr><td colspan="5" class="note">—</td></tr>`;
      document.getElementById("swRowsNote").textContent = r ? "nothing survived" : "—";
      return;
    }
    /* ONE ROW PER CLASS FIRST.  The list is ordered so the reader meets each theory once before
     * meeting its second coordinate system.  "first" is decided in ONE traversal and the ordering
     * reads it: deciding it again inside a second pass makes every row a repeat of a class the
     * first pass has by then already seen, and the list comes out with each survivor twice. */
    const seen = new Set();
    const tagged = r.survivors.map((x) => {
      const first = !seen.has(x.cls);
      seen.add(x.cls);
      return { x, first };
    });
    const rows = [...tagged.filter((t) => t.first), ...tagged.filter((t) => !t.first)];
    body.innerHTML = rows.slice(0, 120).map(({ x, first }, i) =>
      `<tr${first ? "" : ' style="color:var(--ink3)"'}>` +
      `<td style="font-family:var(--mono);font-size:12.5px">` +
      `(${x.b.nPP},${x.b.nPM},${x.b.nMP},${x.b.nMM})</td>` +
      `<td class="note">${sun5dUnbroken(x.b)}</td>` +
      `<td class="note" style="font-family:var(--mono);font-size:12px">${sweepShowContent(x.vec)}</td>` +
      `<td class="num">${x.cls}${first ? "" : ' <span class="note">↺</span>'}</td>` +
      `<td><button class="ghost" data-i="${i}">load</button></td></tr>`).join("");
    body.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const x = rows[+btn.dataset.i].x;
        SUN5D_S.blocks = { nPP: x.b.nPP, nPM: x.b.nPM, nMP: x.b.nMP, nMM: x.b.nMM };
        SUN5D_S.bulk = Object.fromEntries(
          x.content.bulk.map((p) => [`${p.rep}|${p.eta}|${p.kind}`, p.multiplicity]));
        SUN5D_S.preset = null;
        ctx.refresh();
      };
    });
    const shown = Math.min(120, rows.length);
    document.getElementById("swRowsNote").innerHTML =
      `Showing ${shown} of ${r.total}` +
      (r.total > r.survivors.length ? ` (the list itself is capped at ${r.survivors.length})` : "") +
      `, <b>one per equivalence class first</b> — the greyed rows marked ↺ are second and third ` +
      `coordinate systems for a theory already listed above them. <b>load</b> puts a model into ` +
      `the builder, and the spectrum and anomaly panels then read that same model.`;
  },

  /* ---------------------------------------------------------------- the honesty */

  _honesty(r) {
    const last = r && r.stages[r.stages.length - 1];
    document.getElementById("swHonesty").innerHTML =
      `<b>An undecided vacuum is not a no.</b> The minimiser handles one Wilson-line phase and two; ` +
      `a boundary condition with three or more gets <em>no answer</em>, and the first version of ` +
      `this panel threw those away together with the models whose minimum really does sit at a ` +
      `symmetric point. They are counted separately now` +
      (last && last.undecided ? ` — <b>${last.undecided}</b> in the run above` : "") +
      `, and so is anything the budget cut off before it was ever minimised. ` +
      `<span class="chip bad">unknown</span>` +
      `<p style="margin:11px 0 0"><b>The group here is the one you WRITE, not the one you get.</b> ` +
      `The sweep filters on the symmetry of the boundary condition as written, which is what a ` +
      `model builder writes down — but the physical symmetry is the one at the <em>minimum</em> of ` +
      `the potential, and that is the expensive question the last filter only samples. It is also ` +
      `why the sweep walks boundary conditions rather than classes: the apparent unbroken group is ` +
      `<b>not</b> a class invariant, so choosing one representative per class would be choosing an ` +
      `answer. Hence both counts, always.</p>` +
      `<p style="margin:11px 0 0"><b>What is not in the space.</b> Bulk Dirac fermions only, in the ` +
      `fundamental, the two rank-two tensors and the adjoint; no brane fields, which every model ` +
      `of this kind carries and which is precisely who pays the anomaly bill; no scalars; and S¹/Z₂ ` +
      `alone. A model that fails “the bulk pays its own anomaly” is <b>not</b> thereby excluded — ` +
      `read that filter as “needs no brane fermion to be consistent”, which is a much stronger ` +
      `demand than consistency.</p>` +
      `<p style="margin:11px 0 0"><b>And the breaking verdict does not depend on the grid.</b> ` +
      `Minimising at three resolutions changes no verdict across the models the harness sweeps ` +
      `— a positional tolerance is otherwise a guess about the basin. ` +
      `<span class="chip ver">verified</span></p>`;
  },
};

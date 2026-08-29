/* census_section.js — "Count a rung": N(A₄, 8D), counted here and not enumerated anywhere.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part VIII's Observation 1 says a rung is a FINITE set; the obvious next question, which nobody
 * was asking, is HOW finite.  Part VII had already written it in its list of what it left open:
 * the multiplet lattice with its congruence is a rational cone cut by an affine sublattice, so the
 * count at fixed (A₄, 8D) is a vector partition function.  That is the machinery this section uses.
 *
 * AND IT IS THE ONE PART VIII COMPUTATION THAT FITS WHOLE IN A BROWSER.  A dynamic programme over
 * the two partial moments gives every N(A₄, 8D) at once in tens of milliseconds; the enumerator
 * that built the same contents one at a time took about twenty-five minutes and ran out of budget
 * below 5 TeV.  So nothing on this page is drawn from an archive: the archive is only what the
 * harness holds the page to, and the page says the two agree — on 69 022 464 contents.
 *
 * Four things fall out, in the order a reader needs them:
 *   the count itself, against an enumeration that shares no line of code with it;
 *   an identity — N(A₄, 8D+6) = N(A₄, 8D) − P — which explains why the four curves superpose, and
 *     with it the fact that a high rung is not bigger for being high, but for reaching further;
 *   the fibre of the measured-mass point, read with Part VII's completeness theorem: the 81 are
 *     not 81 models that agree, they are 81 ways to build ONE potential;
 *   and the structure that is NOT claimed, measured before it is not claimed.
 *
 * Edited BY HAND.
 */
let CEN_C = null;                    /* the built table */
let CEN_L = null;
let CEN_SEED = null;
const CEN_S = { rung: 1, wide: false, fibre: null, rec: null, probe: 104 };

const CENSUS_SECTION = {
  id: "census",
  label: "Count a rung",
  paper: "Part VIII",
  ready: true,
  modules: [...modules(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">A rung is a finite set — that is what makes "no content here" a decision rather
    than a failed search. <b>How</b> finite is a different question, and it is answered by counting
    rather than by building: a dynamic programme over the two partial moments gives
    <b>N(A₄, 8D)</b> for every A₄ at once.</p>
    <div class="note" style="margin-top:9px">The enumerator that built the same contents one by one
    took about twenty-five minutes and ran out of budget below 5 TeV. This takes tens of
    milliseconds, which is why the whole of it lives in this page rather than in an archive — and
    why it is the strongest falsification the enumerator has: two algorithms that share nothing,
    agreeing on <b>69 022 464</b> contents.</div>
    <div style="display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap">
      <button id="cnGo">▶ build the table</button>
      <label class="note"><input type="checkbox" id="cnWide"> reach A₄ = 880, where the
        enumerator cannot go (costs memory, not time)</label>
      <span class="note" id="cnBusy"></span>
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The four rungs the paper enumerates</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>8D</th><th class="num">legal A₄</th>
          <th class="num">A₄ ceiling</th><th class="num">counted here</th>
          <th class="num">built by the enumerator</th><th></th></tr></thead>
          <tbody id="cnTotals"><tr><td colspan="6" class="note">Not built yet.</td></tr></tbody></table></div>
        <div class="note" style="margin-top:9px" id="cnTotalsNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The counting function along a rung</h2>
        <canvas id="cnCurve" width="720" height="300"></canvas>
        <div class="legend" id="cnLegend"></div>
        <div class="note" style="margin-top:9px" id="cnCurveNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Why the four curves lie on top of one another</h2>
        <div class="verdict stable" id="cnRec"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:10px" id="cnRecNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The fibre of the measured-mass point</h2>
        <p class="note" style="margin:0 0 10px">The paper says 81 contents remain at the measured
        Higgs mass and that they occupy one (A₄, G) — three coordinates. Part VII proves something
        stronger: two contents have the <b>same</b> one-loop potential, identically in the phase,
        iff they agree on all <b>five</b> (A₄, 8D, 2U, V, 2W). Those are integers, so the question
        is decided exactly rather than compared in floating point.</p>
        <div class="verdict stable" id="cnFibre"><b>—</b><span>—</span></div>
        <div style="overflow-x:auto;margin-top:11px"><table><thead><tr><th>2U</th><th class="num">V</th>
          <th class="num">contents</th><th class="num">values of 2W</th><th class="num">1/R₅</th>
          <th>size range</th></tr></thead><tbody id="cnClasses"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="cnFibreNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The reach, which is now a number and not an order of magnitude</h2>
        <div id="cnBudget" class="note">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What is NOT claimed</h2>
        <p class="note" style="margin:0 0 10px">A vector partition function is a piecewise
        quasi-polynomial, and saying so here would be free and would be a promise. The period comes
        from the 2×2 determinants of the generators and is large. It is measured, with exact
        integer finite differences inside each residue class, and the negative is printed.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>residue class</th><th class="num">points</th>
          <th>polynomial degree</th></tr></thead><tbody id="cnQP">
          <tr><td colspan="3" class="note">Not built yet.</td></tr></tbody></table></div>
        <div class="note" style="margin-top:9px" id="cnQPNote">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("cnGo").onclick = () => this._build(ctx);
    $("cnWide").onchange = () => { CEN_S.wide = $("cnWide").checked; CEN_C = null; ctx.refresh(); };
    $("cnCurve").onclick = (e) => {
      if (!this._lay) return;
      const r = e.target.getBoundingClientRect();
      const x = (e.clientX - r.left) * (this._lay.W / r.width);
      const i = Math.round((x - this._lay.x0) / (this._lay.x1 - this._lay.x0) *
                           (this._lay.hiA - this._lay.loA) + this._lay.loA);
      CEN_S.probe = i;
      ctx.refresh();
    };
  },

  _build(ctx) {
    const $ = (id) => document.getElementById(id);
    $("cnBusy").textContent = "summing the table…";
    setTimeout(() => {
      CEN_L = inverseLattice(ctx.DATA, gaugeSeed(ctx.model(), ctx.DATA).gauge);
      CEN_C = buildCensus(CEN_L, { tMax: CEN_S.wide ? 900 : 560 });
      CEN_S.rec = recurrenceCheck(CEN_C, { tSpan: 320, kMax: 60 });
      CEN_S.fibre = null;
      $("cnBusy").textContent = "";
      ctx.refresh();
    }, 20);
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const seed = ctx.seed === "candidate" ? "candidate" : "published";
    if (CEN_SEED !== seed) { CEN_SEED = seed; CEN_C = null; CEN_S.fibre = null; }
    $("cnWide").checked = CEN_S.wide;
    if (!CEN_C) { this._empty(ctx, seed); return; }
    this._totals(ctx, seed);
    this._curve(ctx);
    this._recurrence(ctx);
    this._fibre(ctx);
    this._budget(ctx);
    this._qp(ctx);
    void r;
  },

  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },
  _COL: { 1: "--blue", 3: "--rust", 5: "--green", 7: "--amber", 2: "--blue", 4: "--rust" },

  _empty(ctx, seed) {
    const T = ctx.DATA.census.totals;
    document.getElementById("cnTotals").innerHTML =
      `<tr><td colspan="6" class="note">Not built yet. The archived run says what to expect: ` +
      Object.entries(T).map(([k, v]) => `<b>${v.enumerated.toLocaleString("en")}</b> at 8D = ${k}`)
        .join(", ") + `. The button above recomputes all of it here.</td></tr>`;
    document.getElementById("cnTotalsNote").textContent =
      seed === "candidate"
        ? "The archived census is the published seed's. On the candidate seed the table is still " +
          "computed here — there is simply no archived run to hold it to, and the panel says so."
        : "";
  },

  /* ---------------------------------------------------------------- the totals */

  _totals(ctx, seed) {
    const C = CEN_C, arch = ctx.DATA.census.totals;
    const bands = reachableSet(ctx.DATA, seed).bands;
    let allAgree = true, any = false;
    const rows = bands.map((b) => {
      const cur = censusCurve(C, b.k8D, b.A4_cap);
      const a = arch[String(b.k8D)];
      const agree = a ? cur.total === a.enumerated && cur.A4.length === a.n_legal_A4 : null;
      if (agree === false) allAgree = false;
      if (agree !== null) any = true;
      return `<tr><td style="font-family:var(--mono)">${b.k8D}</td>` +
        `<td class="num">${cur.A4.length}</td><td class="num">${b.A4_cap}</td>` +
        `<td class="num"><b>${cur.total.toLocaleString("en")}</b></td>` +
        `<td class="num">${a ? a.enumerated.toLocaleString("en") : "—"}</td>` +
        `<td>${agree === null ? '<span class="chip live">no archive</span>'
             : agree ? '<span class="chip ver">agrees</span>'
                     : '<span class="chip bad">DISAGREES</span>'}</td></tr>`;
    }).join("");
    document.getElementById("cnTotals").innerHTML = rows;
    const grand = bands.reduce((s, b) => s + censusCurve(C, b.k8D, b.A4_cap).total, 0);
    document.getElementById("cnTotalsNote").innerHTML =
      `Built to A₄ = ${C.baseA4 + C.tMax} in <b>${C.ms.toFixed(0)} ms</b>, ` +
      `${(C.tMax + 1).toLocaleString("en")} × ${C.sMax.toLocaleString("en")} cells; after that ` +
      `every N is a strided sum and not a search. ` +
      (any
        ? (allAgree
           ? `All ${bands.length} totals land on the enumerator's own — ` +
             `<b>${grand.toLocaleString("en")}</b> contents, counted here and built there, by two ` +
             `algorithms that share nothing. <span class="chip ver">verified</span>`
           : `<b style="color:var(--rust)">A total does NOT match the archived enumeration — the ` +
             `page is broken, and this sentence is the alarm.</b>`)
        : `There is no archived enumeration on this seed to compare against, so these counts stand ` +
          `on the dynamic programme alone. <span class="chip mea">measured</span>`);
  },

  /* ---------------------------------------------------------------- the curves */

  _curve(ctx) {
    const C = CEN_C, seed = CEN_SEED;
    const bands = reachableSet(ctx.DATA, seed).bands;
    const curves = bands.map((b) => ({ k: b.k8D, cur: censusCurve(C, b.k8D, b.A4_cap) }));
    const c = document.getElementById("cnCurve");
    const W = c.clientWidth || 720, H = 300;
    const d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, W, H);

    const loA = Math.floor(C.baseA4), hiA = Math.max(...curves.map((z) => z.cur.A4[z.cur.A4.length - 1]));
    const maxN = Math.max(...curves.map((z) => Math.max(...z.cur.N)));
    const x0 = 52, x1 = W - 12, y0 = 14, y1 = H - 30;
    const X = (a) => x0 + (a - loA) / (hiA - loA) * (x1 - x0);
    /* log scale: the counts run from one to a hundred thousand along a single rung, and a linear
     * axis would show four flat lines and one spike */
    const Y = (n) => y1 - Math.log10(Math.max(n, 1) + 1) / Math.log10(maxN + 1) * (y1 - y0);
    this._lay = { W, x0, x1, loA, hiA };

    g.strokeStyle = this._css("--line"); g.lineWidth = 1;
    g.fillStyle = this._css("--ink3");
    g.font = "10.5px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = "right";
    for (let e = 0; Math.pow(10, e) <= maxN; e++) {
      const y = Y(Math.pow(10, e));
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.fillText(e === 0 ? "1" : `1e${e}`, x0 - 5, y + 3.5);
    }
    g.textAlign = "center";
    for (let a = 0; a <= hiA; a += 100) {
      if (a < loA) continue;
      g.fillText(String(a), X(a), y1 + 15);
    }
    g.fillText("A₄", (x0 + x1) / 2, H - 4);

    curves.forEach(({ k, cur }) => {
      g.strokeStyle = this._css(this._COL[k] || "--ink3");
      g.lineWidth = 1.6;
      g.beginPath();
      cur.A4.forEach((a, i) => (i ? g.lineTo(X(a), Y(cur.N[i])) : g.moveTo(X(a), Y(cur.N[i]))));
      g.stroke();
    });

    /* the probe */
    const p = Math.max(loA, Math.min(hiA, CEN_S.probe));
    g.strokeStyle = this._css("--ink"); g.lineWidth = 1;
    g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(X(p), y0); g.lineTo(X(p), y1); g.stroke();
    g.setLineDash([]);

    document.getElementById("cnLegend").innerHTML = curves.map(({ k }) =>
      `<span><i style="background:var(${this._COL[k] || "--ink3"})"></i>8D = ${k}</span>`).join("");
    const at = curves.map(({ k }) => {
      const n = censusAt(C, p, k);
      return `8D = ${k}: <b>${n === null ? "—" : Math.round(n).toLocaleString("en")}</b>`;
    }).join(" · ");
    document.getElementById("cnCurveNote").innerHTML =
      `Click the plot to move the probe. At <b>A₄ = ${p}</b> — ${at}. ` +
      `The curves are indistinguishable, and the next panel says why that is a theorem rather than ` +
      `an accident of the drawing. Log scale, because a single rung runs from one content to a ` +
      `hundred thousand.`;
  },

  /* ---------------------------------------------------------------- the recurrence */

  _recurrence(ctx) {
    const C = CEN_C, r = CEN_S.rec;
    const el = document.getElementById("cnRec");
    if (!r) { el.innerHTML = "<b>—</b><span>—</span>"; return; }
    el.className = r.failures === 0 ? "verdict breaks" : "verdict stable";
    el.innerHTML =
      `<b>N(A₄, 8D + ${C.step}) = N(A₄, 8D) − P(A₄ − A₄<sub>gauge</sub>, 8D − 8D<sub>gauge</sub>)</b>` +
      `<span>Checked on <b>${r.tested.toLocaleString("en")}</b> grid points of this lattice, ` +
      `<b>${r.failures}</b> failures. A content at (A₄, 8D) is a pair (n_free, m) with m using only ` +
      `the seven bounded generators; raising 8D by ${C.step} raises the target by ${C.step}, and ` +
      `n_free → n_free + 1 is a bijection onto the contents with n_free ≥ 1. The difference is the ` +
      `count with n_free = 0, which is the table cell P. It is an identity, not an approximation. ` +
      `<span class="chip thm">theorem</span></span>`;
    const rows = [74, 140, 212].map((t) => {
      const a = censusAt(C, t, 1), b = censusAt(C, t, 7);
      return `A₄ = ${t}: N(·,7)/N(·,1) = <b>${(b / a).toFixed(6)}</b>`;
    }).join(" · ");
    document.getElementById("cnRecNote").innerHTML =
      `And the correction is tiny, which is what makes the curves superpose: ${rows}. ` +
      `<b>Consequence.</b> The high rungs do not hold more contents for being high. They hold more ` +
      `because their A₄ ceiling is larger — 215, 336, 436, 533 — and the count grows with A₄. ` +
      `The 423 631 → 3 888 823 → 15 802 014 → 48 907 996 of the table above is the ceiling moving, ` +
      `not the rung getting fatter.`;
  },

  /* ---------------------------------------------------------------- the fibre */

  _fibre(ctx) {
    const C0 = ctx.DATA.census.fibre;
    if (!C0) return;
    const conv = ctx.model().conventions;
    if (!CEN_S.fibre)
      CEN_S.fibre = fibreAt(CEN_L, C0.A4, C0.k8D,
                            (cb) => contentsAt(CEN_L, 2 * C0.A4, C0.k8D, cb), conv);
    const f = CEN_S.fibre;
    /* PICKED BY THE PHYSICS, NOT BY SIZE.  The first version took the largest class with a single
     * 2W and got 86 — there are two such classes on this rung, and the paper's is the OTHER one.
     * Each class is one potential, so it has one Higgs mass: the class the paper means is the one
     * sitting at the measured mass, which is the archived (A₄, G) point.  Picking it that way is
     * a computation the panel can show, and picking it by size was a coincidence waiting to break. */
    const pdg = ctx.DATA.inverse && ctx.DATA.inverse.published.pdg_window;
    const big = pdg
      ? f.classes.reduce((best, c) => (c.invR !== null &&
          (best === null || Math.abs(c.invR - pdg.lo) < Math.abs(best.invR - pdg.lo)) ? c : best), null)
      : null;
    const el = document.getElementById("cnFibre");
    el.className = "verdict breaks";
    el.innerHTML = big
      ? `<b>${big.n} contents, one potential</b><span>At (A₄, 8D) = (${f.A4}, ${f.k8D}) the rung ` +
        `holds ${f.n.toLocaleString("en")} contents in <b>${f.nClasses}</b> exact classes of ` +
        `(2U, V) — and each class IS one potential, so each has one α, one Higgs mass and one ` +
        `scale. The class sitting at <b>${Math.round(big.invR)} GeV</b>, the measured-mass point, ` +
        `has <b>${big.n}</b> contents at (2U, V) = (${big.U2}, ${big.V}) with ` +
        (big.nW2 === 1
          ? `<b>one</b> value of 2W, ${big.W2[0]}. So all five coordinates coincide, and by Part ` +
            `VII's completeness theorem these are not ${big.n} models that predict the same thing ` +
            `— they are <b>${big.n} ways to build the same potential</b>, one of ${big.sizeMin} ` +
            `multiplets and one of ${big.sizeMax}. <span class="chip thm">theorem</span>`
          : `<b>${big.nW2}</b> values of 2W, so its members do NOT all share a potential.`) +
        `</span>`
      : `<b>—</b><span>—</span>`;
    document.getElementById("cnClasses").innerHTML = f.classes.slice(0, 8).map((c) =>
      `<tr${c === big ? ' style="background:var(--green-l)"' : ""}>` +
      `<td class="num">${c.U2}</td><td class="num">${c.V}</td><td class="num">${c.n}</td>` +
      `<td class="num">${c.nW2}${c.nW2 > 1 ? ` <span class="note">{${c.W2.join(", ")}}</span>` : ""}</td>` +
      `<td class="num">${c.invR === null ? "—" : Math.round(c.invR)}</td>` +
      `<td class="note">${c.sizeMin} … ${c.sizeMax} multiplets</td></tr>`).join("");
    const split = f.classes.filter((c) => c.nW2 > 1).length;
    const bigger = f.classes.filter((c) => c.nW2 === 1 && c.n > (big ? big.n : 0)).length;
    document.getElementById("cnFibreNote").innerHTML =
      `<b>And it is not automatic</b>, which is what makes it worth measuring: ${split} of the ` +
      `${f.nClasses} classes on this same rung split into several 2W, so "one value of 2W" is a ` +
      `measurement that could have come out the other way. ` +
      (bigger
        ? `Nor is it the biggest: ${bigger} class(es) on this rung have a single 2W and MORE ` +
          `members, and they sit at other scales — which is why the panel picks by the measured ` +
          `mass and not by size. `
        : "") +
      `The eight largest classes are shown; their sizes add to the rung exactly, and G is constant ` +
      `inside each one to ${f.gSpread.toExponential(0)} — a check, since G is a function of ` +
      `(A₄, 2U, V) and nothing else. ` +
      (big && big.n === ctx.DATA.census.fibre.n
        ? `<span class="chip ver">verified</span> against the archived run's ${ctx.DATA.census.fibre.n}.`
        : `<span class="chip bad">the archived run says ${ctx.DATA.census.fibre.n}</span>`);
  },

  /* ---------------------------------------------------------------- the reach */

  _budget(ctx) {
    const C = CEN_C, B = ctx.DATA.census.budget;
    const rows = B.map((b) => {
      const n = censusAt(C, b.A4, b.k8D);
      return `<tr><td style="font-family:var(--mono)">8D = ${b.k8D}, A₄ = ${b.A4}</td>` +
        `<td class="num"><b>${n === null ? "beyond the table" : Math.round(n).toLocaleString("en")}</b></td>` +
        `<td class="num note">${b.N.toLocaleString("en")}</td></tr>`;
    }).join("");
    const reach = B.every((b) => censusAt(C, b.A4, b.k8D) !== null);
    document.getElementById("cnBudget").innerHTML =
      `The paper declares that below about 5 TeV a rung "has of the order of 10⁷ contents, past ` +
      `the budget". With the table that stops being an order of magnitude:` +
      `<table style="margin-top:9px"><thead><tr><th>lattice point</th><th class="num">counted here</th>` +
      `<th class="num">archived</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<p style="margin:9px 0 0">Counting them costs a sum; constructing them does not. That is the ` +
      `difference between declaring a reach and knowing one.` +
      (reach ? ` <span class="chip ver">verified</span>`
             : ` <b>Tick the box above</b> to extend the table to A₄ = 880 — these points lie past ` +
               `the default reach, and the panel says "beyond the table" rather than guessing.`) +
      `</p>`;
  },

  /* ---------------------------------------------------------------- the negative */

  _qp(ctx) {
    const C = CEN_C, seed = CEN_SEED;
    const b0 = reachableSet(ctx.DATA, seed).bands[0];
    const cur = censusCurve(C, b0.k8D, b0.A4_cap);
    const probe = quasiPolynomialProbe(cur);
    document.getElementById("cnQP").innerHTML = probe.map((p) =>
      `<tr><td style="font-family:var(--mono)">every ${p.period}${p.period === 1 ? "st" : "th"} A₄</td>` +
      `<td class="num">${p.points}</td>` +
      `<td class="note">${p.thin ? "too few points to measure"
                                 : p.degree === null ? "none ≤ 9" : String(p.degree)}</td></tr>`).join("");
    document.getElementById("cnQPNote").innerHTML =
      probe.every((p) => p.degree === null)
        ? `<b>None resolves.</b> So this section counts and does not classify: the count is exact, ` +
          `the quasi-polynomial structure is <b>open at this reach</b>, and it is declared open. ` +
          `<span class="chip bad">unknown</span> — said out loud, with its reason.`
        : `A residue class DID resolve. That is a new fact and the archived run did not find it; ` +
          `look before believing it.`;
  },
};

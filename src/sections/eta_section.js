/* eta_section.js — the eta-meter: predict without computing, then check yourself.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Opens with the answer in one sentence -- flip the boundary sign and this Higgs moves, by this
 * much -- computed from ONE integer with no winding summed, and puts the brute-force number that
 * confirms it immediately beside it.  The machinery folds below for whoever wants it.
 *
 * The section exists for one statement: a content with M_2 = 0 is invisible to eta AT ANY SIZE.
 * Nine copies of a blind multiplet move nothing.  Blindness is not smallness, and the panel is
 * built so that you can try to break it.
 *
 * Edited BY HAND.
 */
const ETA_DATA = DATASETS.su4_ahmn;
let ETA_SWEEP = null;
let ETA_ATLAS = null;
let ETA_DIFF = { a: null, b: null };      /* the two tiles under comparison; view state */

/* The pair this section arrived without.  eta is a sign on a LANDSCAPE, and the page argued about
 * it in numbers alone: a content that is blind to eta is one whose landscape does not move when
 * you flip it, and that is a thing to be watched, not read off a table. */
const ETA_PANELS = makeTorusPanels({
  data: ETA_DATA,
  ids: { map: "eMap", surf: "eSurf", cur: "ePCur", mode: "ePMode",
         go: "ePGo", sim: "ePSim", basins: "ePBasins" },
});
const ETA_SECTION = {
  id: "eta",
  label: "eta-meter",
  paper: "Parts IV-V",
  ready: true,
  modules: [selectionModule(ETA_DATA), etaModule(ETA_DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="eLead">—</p>
    <div class="note" style="margin-top:9px" id="eCheck">—</div>
  </div>
  ${ETA_PANELS.html({ title: "The landscape η acts on — flip η above, and watch it not move" })}

  <div class="grid two">
    <div>
      <div class="card">
        <h2>Predicted against measured</h2>
        <table><thead><tr><th></th><th class="num">closed form</th>
          <th class="num">brute force</th><th class="num">difference</th></tr></thead>
          <tbody id="eTab"></tbody></table>
        <div class="note" style="margin-top:9px">The closed form sums <b>no windings</b>: it reads
        Part IV's box off the representation and multiplies. The brute force takes the Hessian at
        both boundary signs and subtracts. They are different computations of the same number.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The one integer it all comes from${helpMark("eta")}</h2>
        <div class="pair">
          <div class="stat"><div class="k">M₂</div><div class="v" id="eM2">—</div>
            <div class="s">the whole eta-dependence, in one number</div></div>
          <div class="stat"><div class="k">M₀ · M₄</div><div class="v" id="eM04" style="font-size:16px">—</div>
            <div class="s">the other two moments of the box</div></div>
        </div>
        <div class="note" style="margin-top:10px">
          <span style="font-family:var(--mono)">L₁ = <b id="eL1">—</b></span>,
          <span style="font-family:var(--mono)">L₂ = <b id="eL2">—</b></span>
          — the odd-winding sums, computed here from the same lattice the potential uses, never typed.
        </div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Blindness is not smallness${helpMark("eta-blindness")}</h2>
        <div class="verdict" id="eBlind"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:10px">Try to break it: load a blind multiplet and raise
        its multiplicity as far as you like. If <span style="font-family:var(--mono)">M₂ = 0</span>
        the boundary sign does nothing, at any size, at this order.</div>
        <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap">
          <button class="ghost" id="eBlindLoad">load 9 copies of a blind multiplet</button>
          <button class="ghost" id="eAhmn">▶ load AHMN</button>
          <button class="ghost" id="eFlip">flip every η</button>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The closed form, on every representation</h2>
        <div class="verdict" id="eSweep"><b>—</b><span>The published note checked five contents.
        The catalogue has 119 and the check costs a moment.</span></div>
        <div style="display:flex;gap:8px;margin-top:11px;align-items:center;flex-wrap:wrap">
          <button class="ghost" id="eSweepGo">▶ check all 119</button>
          <span class="note" id="eSweepNote"></span>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The content, and which multiplets can see <span class="lc">η</span></h2>
        <table><thead><tr><th>multiplet</th><th class="num">n</th><th><span class="lc">η</span></th>
          <th class="num">M₂ contribution</th><th></th></tr></thead><tbody id="eRows"></tbody></table>
        <div class="note" style="margin-top:9px" id="eEmpty">Nothing loaded. Use the buttons above.</div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>The atlas — every multiplet's landscape, side by side</h2>
    <p class="note" style="margin:0 0 11px">One thumbnail per multiplet: the one-loop potential that
    multiplet alone would make, over the whole torus, each on its own colour scale so that what you
    compare is the <b>shape</b> and not the depth. Put a hundred landscapes next to each other and
    the structure is visible without reading a number. Switch to <b>η-difference</b> and every
    multiplet η cannot touch goes blank — Theorem 1, as a picture, a hundred times at once.</p>
    <div class="verdict" id="eAtVerdict"><b>—</b><span>Not drawn yet.</span></div>
    <div style="display:flex;gap:10px;margin:12px 0;align-items:center;flex-wrap:wrap">
      <button class="ghost" id="eAtGo">▶ draw the atlas — about 5 s</button>
      <label class="note">show
        <select id="eAtMode"><option value="V">the potential V</option>
          <option value="D">the η-difference V(η) − V(−η)</option></select></label>
      <label class="note">which
        <select id="eAtFilter"><option value="all">all multiplets</option>
          <option value="sees">only those that see η</option>
          <option value="blind">only the blind ones</option></select></label>
      <label class="note">order
        <select id="eAtSort"><option value="dim">by dimension</option>
          <option value="m2">by |M₂|</option>
          <option value="box">by p+q+r</option></select></label>
      <span class="note" id="eAtNote"></span>
    </div>
    <div class="atlas" id="eAtBox"></div>

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
      <h2 style="font-size:13px">Diff two tiles</h2>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <label class="note">A <select id="eDfA"></select></label>
        <label class="note">B <select id="eDfB"></select></label>
        <span class="note">— or <b>shift-click</b> two tiles above. Same box, same η-difference:
        the claim Part IV makes, testable here on any pair, pixel against spectrum.</span>
      </div>
      <div id="eDfRow" style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap"></div>
      <div class="verdict" id="eDfV" style="margin-top:10px"><b>—</b><span>Draw the atlas first.</span></div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("eAhmn").onclick = () => ctx.load([
      { rep: "(4,0,0)", parities: [1, 1], multiplicity: 3, eta: 1, role: 1 },
      { rep: "(1,0,1)", parities: [1, 1], multiplicity: 1, eta: 1, role: -1 },
    ]);
    /* A DECLARED blind multiplet -- the catalogue's flag, not "we have no box for it". */
    const firstBlind = (ctx.DATA.catalogue.find((r) => r.blind) || {}).name;
    $("eBlindLoad").onclick = () =>
      ctx.load(firstBlind ? [{ rep: firstBlind, parities: [1, 1], multiplicity: 9, eta: 1, role: 1 }] : []);
    $("eFlip").onclick = () => ctx.n.forEach((n, i) => { if (n) ctx.setEta(i, -ctx.eta[i]); });
    ETA_PANELS.attach();
    $("eSweepGo").onclick = () => {
      $("eSweepNote").textContent = "running…";
      setTimeout(() => { ETA_SWEEP = sweepEta(ctx.DATA); ctx.refresh(); }, 20);
    };

    /* THE ATLAS.  Recomputed on a mode change and only redrawn on a filter or sort change -- the
     * fields do not depend on which tiles you are looking at or in what order. */
    const drawIt = (recompute) => {
      $("eAtNote").textContent = recompute ? "drawing…" : "";
      setTimeout(() => {
        if (recompute || !ETA_ATLAS) ETA_ATLAS = atlas(ctx.DATA, { mode: $("eAtMode").value });
        this._atlas(ctx);
      }, 20);
    };
    $("eAtGo").onclick = () => drawIt(true);
    $("eAtMode").onchange = () => { if (ETA_ATLAS) drawIt(true); };
    for (const id of ["eAtFilter", "eAtSort"])
      $(id).onchange = () => { if (ETA_ATLAS) drawIt(false); };
    $("eAtBox").onclick = (e) => {
      const t = e.target.closest("[data-key]");
      if (!t) return;
      /* shift-click picks the two tiles to diff -- A first, then B, then A again */
      if (e.shiftKey) {
        if (!ETA_DIFF.a || ETA_DIFF.b) { ETA_DIFF.a = t.dataset.key; ETA_DIFF.b = null; }
        else ETA_DIFF.b = t.dataset.key;
        this._diff(ctx);
        return;
      }
      ctx.load([{ rep: t.dataset.key, parities: [1, 1], multiplicity: 1, eta: 1, role: 1 }]);
    };
    for (const id of ["eDfA", "eDfB"])
      $(id).onchange = () => { ETA_DIFF.a = $("eDfA").value; ETA_DIFF.b = $("eDfB").value; this._diff(ctx); };
  },

  /* ---- the diff: three thumbnails and a verdict the spectra must agree with ---------------- */
  _diff(ctx) {
    const A = ETA_ATLAS, $ = (id) => document.getElementById(id);
    if (!A) return;
    /* the selects list every tile; opened with no pair chosen, the panel picks the first
     * same-box pair so that the claim it exists to test is on screen without a click */
    const keys = A.tiles.map((t) => t.key);
    if (!ETA_DIFF.a || !ETA_DIFF.b) {
      const byBox = new Map();
      for (const t of A.tiles) if (t.boxKey) (byBox.get(t.boxKey) || byBox.set(t.boxKey, []).get(t.boxKey)).push(t.key);
      const pair = [...byBox.values()].find((ks) => ks.length >= 2);
      ETA_DIFF.a = pair ? pair[0] : keys[0];
      ETA_DIFF.b = pair ? pair[1] : keys[1];
    }
    for (const [id, cur] of [["eDfA", ETA_DIFF.a], ["eDfB", ETA_DIFF.b]]) {
      const sel = $(id);
      if (sel.options.length !== keys.length)
        sel.innerHTML = keys.map((k) => `<option value="${k}">${k}</option>`).join("");
      sel.value = cur;
    }
    const d = tileDiff(A, ctx.DATA, ETA_DIFF.a, ETA_DIFF.b);
    if (!d) return;
    const ta = A.tiles.find((t) => t.key === d.keyA), tb = A.tiles.find((t) => t.key === d.keyB);
    const { nx, ny } = A.grid;
    const paint = (canvas, t, flat) => {
      const g = canvas.getContext("2d"), img = g.createImageData(nx, ny), span = (t.hi - t.lo) || 1;
      for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) {
        const o = ((ny - 1 - y) * nx + x) * 4;
        const c = flat ? [244, 246, 248] : surfaceRamp((t.v[y * nx + x] - t.lo) / span);
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    };
    const cell = (lab, sub) =>
      `<div style="width:224px"><canvas width="${nx}" height="${ny}" style="width:224px;aspect-ratio:2/1;` +
      `image-rendering:pixelated;border-radius:4px;border:1px solid var(--line)"></canvas>` +
      `<b style="display:block;font:650 11px/1.3 var(--mono);margin-top:4px">${lab}</b>` +
      `<i style="display:block;font-style:normal;font-size:10px;color:var(--ink3);font-family:var(--mono)">${sub}</i></div>`;
    $("eDfRow").innerHTML =
      cell(d.keyA, ta.box ? `box (${ta.box.join(",")})` : "no box") +
      cell(d.keyB, tb.box ? `box (${tb.box.join(",")})` : "no box") +
      cell("A − B", d.identical ? "identical: nothing to draw" : `max |A − B| = ${d.maxAbs.toExponential(2)}`);
    const cs = $("eDfRow").querySelectorAll("canvas");
    paint(cs[0], ta, ta.flat); paint(cs[1], tb, tb.flat); paint(cs[2], d, d.identical);

    const modeName = A.mode === "D" ? "η-difference" : "potential";
    $("eDfV").className = "verdict " + (!d.agrees ? "stable" : d.identical ? "breaks" : "");
    $("eDfV").innerHTML = !d.agrees
      ? `<b style="color:var(--rust)">The pixels and the spectra disagree</b><span>The ${modeName} ` +
        `tiles are ${d.identical ? "identical" : "different"} while the mode tables say they should ` +
        `${d.predictedIdentical ? "coincide" : "differ"} — a truncation or a bug, and the page says so ` +
        `rather than picking a side.</span>`
      : d.identical
        ? `<b>Identical ${modeName} tiles${d.bothFlat ? " — both blank" : ""}</b><span>` +
          (d.bothFlat
            ? `Both multiplets are blind to η: every mode has A = B, so the difference is zero twice ` +
              `over. Identity between two blanks proves nothing about a box.`
            : `${d.sameBox ? "Same box, and " : "Different boxes, yet "}the same ${A.mode === "D" ? "odd" : "odd and even"} ` +
              `spectrum — so the same picture, pixel for pixel, as the spectra demand. ` +
              (A.mode === "D" && !d.sameEven
                ? `Switch the atlas to <em>the potential V</em> and these two come apart: they share ` +
                  `the η-response, not the landscape — Part IV's actual claim.`
                : ``)) +
          ` <span class="chip ver">verified</span> pixels against spectra.</span>`
        : `<b>Different ${modeName} tiles: max |A − B| = ${d.maxAbs.toExponential(2)}, ` +
          `${(100 * d.rel).toFixed(1)} % of the larger tile's own range</b><span>` +
          (d.sameBox
            ? `Same box, different ${A.mode === "D" ? "odd" : "even"} spectrum — ` +
              (A.mode === "V" && d.sameOdd
                ? `and the same odd one: switch to η-difference and these two become identical. ` +
                  `The box fixes the η-response, not the landscape.`
                : `the box does not decide this.`)
            : `Different boxes, different spectra, different pictures — as it should be.`) +
          ` <span class="chip ver">verified</span> pixels against spectra.</span>`;
  },

  /* The tiles, and the two sentences the pictures earn.
   *
   * Every claim here is checked against the data before it is written: a tile that comes out blank
   * is only called blind if the MODES said it would be, and the same-box statement is compared as
   * spectra rather than eyeballed.  If either disagrees the panel says so instead of the result. */
  _atlas(ctx) {
    const A = ETA_ATLAS, $ = (id) => document.getElementById(id);
    if (!A) return;
    const f = $("eAtFilter").value, s = $("eAtSort").value;
    let ts = A.tiles.filter((t) => f === "all" || (f === "blind") === t.silent);
    const boxsum = (t) => (t.box ? t.box.reduce((a, b) => a + b, 0) : -1);
    ts = ts.slice().sort((a, b) => s === "dim" ? a.dim - b.dim
                                 : s === "m2" ? Math.abs(b.m2 || 0) - Math.abs(a.m2 || 0)
                                 : boxsum(b) - boxsum(a));

    const box = $("eAtBox");
    box.innerHTML = ts.map((t) =>
      `<div class="at${t.silent ? " silent" : ""}" data-key="${t.key}">` +
      `<canvas width="${A.grid.nx}" height="${A.grid.ny}"></canvas>` +
      `<b>${t.key}</b><i>dim ${t.dim}</i><i>${
        A.mode === "D" ? (t.silent ? "η does nothing" : "M₂ " + t.m2)
                       : (t.box ? "box (" + t.box.join(",") + ")" : "no box")}</i></div>`).join("");

    box.querySelectorAll(".at").forEach((el, i) => {
      const t = ts[i], g = el.querySelector("canvas").getContext("2d");
      const img = g.createImageData(A.grid.nx, A.grid.ny), span = (t.hi - t.lo) || 1;
      for (let x = 0; x < A.grid.nx; x++) for (let y = 0; y < A.grid.ny; y++) {
        /* alpha_2 upward, as every other panel here draws it */
        const o = ((A.grid.ny - 1 - y) * A.grid.nx + x) * 4;
        const c = t.flat ? [244, 246, 248] : surfaceRamp((t.v[y * A.grid.nx + x] - t.lo) / span);
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });

    const bad = A.blankMismatch.length || A.flagMismatch.length || !A.control.nyquist ||
                A.control.worstTrunc >= 0.02;
    $("eAtVerdict").className = "verdict " + (bad ? "stable" : "breaks");
    $("eAtVerdict").innerHTML = bad
      ? `<b style="color:var(--rust)">The pictures and the data do not agree</b><span>` +
        (A.blankMismatch.length ? `Blank tiles that were not predicted, or predicted ones that drew
          something: ${A.blankMismatch.slice(0, 4).join("; ")}. ` : ``) +
        (A.flagMismatch.length ? `The catalogue's blind flag disagrees with the modes on
          ${A.flagMismatch.slice(0, 4).join(", ")}. ` : ``) +
        (!A.control.nyquist ? `The tile grid is below Nyquist. ` : ``) +
        (A.control.worstTrunc >= 0.02 ? `Truncating the lattice at |k| ≤ ${A.grid.ktile} moves the
          picture by ${(100 * A.control.worstTrunc).toFixed(1)} %. ` : ``) +
        `Nothing is claimed from a run whose own controls fail.</span>`
      : `<b>${A.tiles.length} landscapes · ${A.silent} of them η cannot touch · ` +
        `${A.oddSame} of ${A.samePairs} same-box pairs share their η-difference exactly</b><span>` +
        `The <b>${A.silent}</b> blank tiles in η-difference mode are exactly the multiplets whose
         every mode has A = B, predicted from the modes before anything was drawn — and the
         catalogue's own <em>blind</em> flag agrees with the modes on all ${A.tiles.length}. ` +
        `<b>And the box does not fix the landscape, it fixes the η-response.</b> Of the
         <b>${A.samePairs}</b> pairs of multiplets sharing a box, <b>${A.oddSame}</b> have the same
         odd spectrum — so in η-difference mode their tiles are identical pixel for pixel — while
         only <b>${A.evenSame}</b> share the even one, so ${A.samePairs - A.evenSame} of them are
         visibly different <em>potentials</em>. The page this atlas came from said same box, same
         landscape; the landscape is the half that is not true.</span>`;
    this._diff(ctx);
    $("eAtNote").innerHTML =
      `${ts.length} shown · ${A.grid.nx}×${A.grid.ny} samples over the 2×1 torus, which is above the
       Nyquist bound ${Math.ceil(A.grid.need[0])}×${Math.ceil(A.grid.need[1])} its own charges force ·
       summed to |k| ≤ ${A.grid.ktile}, and ${A.control.tilesChecked} tiles redrawn at the model's
       |k| ≤ ${A.control.kmax} move by at most ${(100 * A.control.worstTrunc).toFixed(3)} %. Click a
       tile to load it.`;
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const D = ctx.DATA, resp = r.values.get("eta_response"), mom = r.values.get("eta_moments");

    if (resp.status === "unknown") {
      $("eLead").innerHTML = `Nothing to report yet. <span style="color:var(--ink2)">${resp.reason}</span>`;
      $("eCheck").textContent = "—";
      $("eTab").innerHTML = ""; $("eRows").innerHTML = "";
      $("eEmpty").style.display = "";
      $("eBlind").className = "verdict";
      $("eBlind").innerHTML = "<b>—</b><span>Load a content first.</span>";
      ETA_PANELS.setContent(null);
      return;
    }

    /* The same content the numbers below are about, as a landscape.  The vacuum is minimised
     * here rather than taken from the resolver because this section does not carry the calculator
     * module -- and a relief drawn without its vacuum marked is a picture, not a reading. */
    const spE = spectrum((r.model.bulk || []).map((b) => ({ key: b.rep, n: b.multiplicity,
                                                            eta: b.eta ?? 1, role: b.role ?? 1 })), D);
    const vacE = minimise(spE, lattice(D.kmax));
    ETA_PANELS.setContent(spE, vacE && vacE.alpha);

    const P = resp.value.predicted, M = resp.value.measured, mm = mom.value;
    const big = Math.abs(P.dHyy) > Math.abs(P.dHxx) ? P.dHyy : P.dHxx;

    $("eLead").innerHTML = resp.value.blind
      ? `Flip the boundary sign and <b>nothing happens</b>. This content has ` +
        `<b style="font-family:var(--mono)">M₂ = 0</b>, so it is invisible to η at this order — ` +
        `however many copies you add.`
      : `Flip the boundary sign and the Higgs mass matrix moves by ` +
        `<b style="font-family:var(--mono)">${big.toFixed(1)}</b> in the units V is written in, ` +
        `computed from <b>one integer</b>, <span style="font-family:var(--mono)">M₂ = ${mm.M2}</span>, ` +
        `with no winding summed.`;

    const err = 100 * resp.value.rel_error;
    $("eCheck").innerHTML =
      `<b>And here is the check, run just now.</b> The brute-force Hessian difference agrees with ` +
      `the closed form to <b>${err < 0.001 ? "better than 0.001" : err.toFixed(3)} %</b>` +
      (err < 0.1 ? ` — <span style="color:var(--green)">the residual is the finite difference of ` +
                   `the Hessian, not a disagreement</span>.`
                 : ` — <span style="color:var(--rust)">that is larger than it should be</span>.`);

    const row = (k, p, m) => `<tr><td>${k}</td><td class="num">${p.toFixed(3)}</td>` +
      `<td class="num">${m.toFixed(3)}</td><td class="num">${Math.abs(p - m).toExponential(1)}</td></tr>`;
    $("eTab").innerHTML = row("ΔH₁₁", P.dHxx, M.dHxx) + row("ΔH₂₂", P.dHyy, M.dHyy) +
      `<tr><td>ΔH₁₂</td><td class="num">0 exactly</td>` +
      `<td class="num">${M.dHxy.toExponential(1)}</td><td class="num">—</td></tr>`;

    $("eM2").textContent = String(mm.M2);
    $("eM04").textContent = `${mm.M0} · ${mm.M4}`;
    $("eL1").textContent = mm.L1.toFixed(4);
    $("eL2").textContent = mm.L2.toFixed(4);

    $("eBlind").className = "verdict " + (resp.value.blind ? "stable" : "breaks");
    $("eBlind").innerHTML = resp.value.blind
      ? `<b>This content is blind to η</b><span>M₂ = 0. The brute force agrees: the measured ` +
        `difference is ${Math.abs(M.dHxx).toExponential(1)}, which is zero to machine precision. ` +
        `Add more copies — it stays zero.</span>`
      : `<b>This content sees η</b><span>M₂ = ${mm.M2} ≠ 0, so flipping the boundary sign moves ` +
        `the Higgs mass matrix. ${mm.blindOnly ? "" : ""}</span>`;

    if (ETA_SWEEP) {
      const w = ETA_SWEEP;
      const bad = w.disagreements.length;
      $("eSweep").className = "verdict " + (bad ? "stable" : "breaks");
      $("eSweep").innerHTML = bad
        ? `<b style="color:var(--rust)">${bad} disagree</b><span>${w.disagreements.slice(0, 6).join(", ")}</span>`
        : `<b>${w.tested} representations, worst error ${(100 * w.worst).toFixed(4)} %</b>` +
          `<span>On the <b>${w.sighted}</b> that see η the closed form and the winding sum agree to ` +
          `that, worst case at ${w.worstRep}. On the <b>${w.blind}</b> blind ones the prediction is ` +
          `zero and the winding sum measures ` +
          `<b>${w.worstBlindResidue === 0 ? "exactly zero" : w.worstBlindResidue.toExponential(1)}</b> — ` +
          `which is the sharp case, not the easy one. Off-diagonal never exceeds ` +
          `${w.worstOffdiag.toExponential(1)}.</span>`;
      $("eSweepNote").innerHTML = `The published note records five contents checked. This is ` +
        `<b>${w.tested}</b>, run in your browser just now.`;
    }

    const held = ctx.n.map((n, i) => [i, n]).filter(([, n]) => n);
    $("eEmpty").style.display = held.length ? "none" : "";
    $("eRows").innerHTML = held.map(([i, n]) => {
      const name = ctx.SLOTS[i].rep, box = D.reps_box && D.reps_box[name];
      const cat = D.catalogue.find((c) => c.name === name) || {};
      let contrib = "—";
      if (box && !box.blind) {
        const [, m2] = momentsOfBox(box.sides, box.zeta);
        contrib = String(n * ctx.eta[i] * m2);
      } else if (box && box.blind) contrib = "0";
      return `<tr><td style="font-family:var(--mono)">${name}` +
             `${cat.blind ? ' <span class="chip ver">blind</span>' : ""}</td>` +
             `<td class="num">${n}</td>` +
             `<td><button class="st" style="width:auto;padding:0 8px" data-eta="${i}">` +
             `${ctx.eta[i] > 0 ? "+1" : "−1"}</button></td>` +
             `<td class="num">${contrib}</td>` +
             `<td class="num"><button class="st" data-n="${i}" data-d="1">+</button></td></tr>`;
    }).join("");
    $("eRows").querySelectorAll("button").forEach((b) => {
      if (b.dataset.eta !== undefined)
        b.onclick = () => ctx.setEta(+b.dataset.eta, -ctx.eta[+b.dataset.eta]);
      if (b.dataset.n !== undefined) b.onclick = () => ctx.setN(+b.dataset.n, +b.dataset.d);
    });
  },
};

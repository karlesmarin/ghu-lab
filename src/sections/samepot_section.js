/* samepot_section.js — "Same potential?": Part VII Theorem 3 as an instrument you can hold two
 * contents up to.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The shell holds ONE model per group, and that is content A.  Content B is view state of this
 * section -- a probe, not a model: it travels in no permalink and no card, and the section
 * recomputes its numbers through the same kernel functions the resolver uses for A.  The verdict
 * is always the five coordinates (Theorem 3, an iff); the drawn potentials and the max |F_A - F_B|
 * are the CONTROL beside the theorem, never the theorem.
 *
 * The section opens with B = the canonical representative of A (eq. (43)) -- a different multiset
 * with identically the same potential -- so the first thing on screen is the theorem earning its
 * keep, not two copies of one content agreeing with themselves.
 *
 * Edited BY HAND.
 */
let SAMEPOT_B = null;                    /* counts object, slot -> multiplicity; survives remounts */
const SAMEPOT_SECTION = {
  id: "samepot",
  label: "Same potential?",
  paper: "Part VII",
  ready: true,
  modules: [...modules(DATA), samepotModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="spLead">—</p>
    <div class="verdict stable" id="spVerdict" style="margin-top:11px"><b>—</b><span>—</span></div>
    <div class="note" style="margin-top:9px">
      Part VII, Theorem 3: two bulk contents have the same one-loop potential, as a function of
      the phase, <b>if and only if</b> they agree on the five coordinates
      <span style="font-family:var(--mono)">(A₄, 8D, 2U, V, 2W)</span>. Same five, same physics —
      same vacuum, same Higgs mass, same hierarchy — however different the multiplets look.
      Build a second content below and the verdict recomputes.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>Content B — the probe</h2>
        <p class="note" style="margin:0 0 10px">Content A is the model this instrument holds (the
        header). B lives only on this page: a probe to hold against it.</p>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <button class="ghost" id="spCopy">⧉ copy A</button>
          <button class="ghost" id="spCanon">⇒ canonical of A</button>
          <button class="ghost" id="spClear">clear</button>
          <span id="spRows" style="display:flex;gap:5px"></span>
        </div>
        <div id="spSlots"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The kernel — eq. (42)</h2>
        <p class="note" style="margin:0 0 10px">The map content → five coordinates has a
        three-dimensional kernel, and these three relations span it. Apply one to B: the content
        changes, the five do not — watch the Δ column hold zero.</p>
        <div id="spKernel"></div>
        <div class="note" style="margin-top:9px" id="spKernelNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The canonical representative — eq. (43)</h2>
        <p class="note" style="margin:0 0 10px">All seven kernel coefficients are non-negative, so
        rewriting never leaves the physical cone: every content has a one-loop-equivalent
        representative on <b>five types only</b>, and the semigroup of one-loop potentials is
        <b>free</b>: S ≅ ℕ⁵.</p>
        <table><thead><tr><th>type</th><th class="num">canonical of A</th>
          <th class="num">canonical of B</th></tr></thead><tbody id="spCanonT"></tbody></table>
        <div class="note" style="margin-top:9px" id="spCanonNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The five coordinates</h2>
        <table><thead><tr><th>coordinate</th><th class="num">A</th><th class="num">B</th>
          <th class="num">Δ</th><th>what it decides</th></tr></thead><tbody id="spCoordT"></tbody></table>
        <div class="note" style="margin-top:9px" id="spCoordNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The two potentials, drawn</h2>
        <canvas id="spPlot" width="720" height="330"></canvas>
        <div class="legend">
          <span><i style="background:var(--blue)"></i>F of A</span>
          <span><i style="background:var(--rust)"></i>F of B, dashed</span>
          <span><i style="background:var(--green)"></i>each minimum</span>
        </div>
        <div class="note" style="margin-top:9px" id="spPlotNote">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    /* B opens as the canonical representative of A: the theorem shown working, not two copies of
     * one content agreeing with themselves.  A remount keeps whatever B the reader built. */
    if (SAMEPOT_B === null) {
      const rels = kernelRelations(ctx.DATA);
      const a = countsOf(ctx.model().bulk);
      SAMEPOT_B = Object.keys(a).length ? canonicalCounts(a, rels) : {};
    }
    $("spCopy").onclick = () => { SAMEPOT_B = countsOf(ctx.model().bulk); ctx.refresh(); };
    $("spCanon").onclick = () => {
      SAMEPOT_B = canonicalCounts(countsOf(ctx.model().bulk), kernelRelations(ctx.DATA));
      ctx.refresh();
    };
    $("spClear").onclick = () => { SAMEPOT_B = {}; ctx.refresh(); };
    $("spRows").innerHTML = ctx.DATA.published_rows.map((r, i) =>
      `<button class="ghost" data-i="${i}" title="load ${r.label} into B">${r.label}</button>`).join("");
    $("spRows").querySelectorAll("button").forEach((b) => (b.onclick = () => {
      SAMEPOT_B = countsOf(ctx.DATA.published_rows[+b.dataset.i].bulk);
      ctx.refresh();
    }));
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    const can = v.get("canonical").value;
    const rels = kernelRelations(ctx.DATA);
    const conv = r.model.conventions || {};
    const bulkA = r.model.bulk || [];
    const bulkB = bulkOfCounts(SAMEPOT_B || {});
    const fiveA = can.five;
    const fiveB = fiveOf(ctx.DATA, bulkB, conv);
    const same = sameFive(fiveA, fiveB);
    const emptyB = bulkB.length === 0;
    const emptyA = bulkA.filter((b) => b.multiplicity).length === 0;

    /* ---- the probe's slot rows ------------------------------------------------------------- */
    $("spSlots").innerHTML = ctx.SLOTS.map((s, i) => {
      const slot = s.rep + s.key, n = SAMEPOT_B[slot] || 0;
      return `<div class="rowm"><span class="nm">${slot}</span>` +
        `<button class="st" data-slot="${slot}" data-d="-1">−</button>` +
        `<span class="cnt${n ? "" : " z"}">${n}</span>` +
        `<button class="st" data-slot="${slot}" data-d="1">+</button></div>`;
    }).join("");
    $("spSlots").querySelectorAll("button.st").forEach((b) => (b.onclick = () => {
      const slot = b.dataset.slot;
      SAMEPOT_B[slot] = Math.max(0, Math.min(60, (SAMEPOT_B[slot] || 0) + (+b.dataset.d)));
      ctx.refresh();
    }));

    /* ---- verdict and lead ------------------------------------------------------------------ */
    const gap = emptyB || emptyA ? null : maxPotentialGap(ctx.DATA, bulkA, bulkB, conv);
    $("spLead").innerHTML = emptyB
      ? `Content B is empty. Copy A, load a published row, or build a probe by hand — the ` +
        `canonical button writes the five-type representative of eq. (43).`
      : same
        ? `These two contents are <b>different as multisets</b>${this._differ(bulkA, SAMEPOT_B) ? "" :
          " — actually identical here"} and have <b>identically the same one-loop potential</b>: ` +
          `all five coordinates agree.`
        : `These two contents generate <b>different potentials</b>: the five coordinates disagree, ` +
          `and Theorem 3 is an iff — no cancellation can save it.`;
    $("spVerdict").className = "verdict " + (emptyB ? "stable" : same ? "breaks" : "stable");
    $("spVerdict").innerHTML = emptyB
      ? `<b>No probe yet</b><span>The verdict needs two contents.</span>`
      : same
        ? `<b>Same potential — Theorem 3, an iff</b><span>(A₄, 8D, 2U, V, 2W) = ` +
          `(${fiveA.join(", ")}) on both sides. Control beside the theorem: max |F_A − F_B| = ` +
          `${gap === null ? "—" : gap.toExponential(1)} over the whole phase — numerical noise, ` +
          `as it must be. <span class="chip thm">theorem</span> the verdict; the curves are the check.</span>`
        : `<b style="color:var(--rust)">Different potentials</b><span>` +
          `${FIVE_NAMES.filter((_, i) => fiveA[i] !== fiveB[i]).join(", ")} ` +
          `disagree${gap !== null ? `; max |F_A − F_B| = ${gap.toExponential(1)}` : ""}. ` +
          `<span class="chip thm">theorem</span> Part VII Thm 3.</span>`;

    /* ---- the five, side by side ------------------------------------------------------------ */
    const DECIDES = [
      "the quartic: m_h through F″, and 25/12·A₄ inside G",
      "the curvature at α = 0: whether electroweak symmetry breaks at all",
      "the ln 2 part of G",
      "the ln 3 part of G — only 84(+,−) supplies it, V = 81·n",
      "F(1) − F(0): which symmetric point is the true vacuum",
    ];
    $("spCoordT").innerHTML = FIVE_NAMES.map((nm, i) => {
      const d = fiveB[i] - fiveA[i];
      return `<tr${d !== 0 && !emptyB ? ' style="background:#fdf3ec"' : ""}>` +
        `<td style="font-family:var(--mono)">${nm}</td>` +
        `<td class="num">${fiveA[i]}</td><td class="num">${emptyB ? "—" : fiveB[i]}</td>` +
        `<td class="num"${d !== 0 ? ' style="color:var(--rust);font-weight:650"' : ""}>` +
        `${emptyB ? "—" : d > 0 ? "+" + d : d}</td>` +
        `<td style="font-size:12px;color:var(--ink2)">${DECIDES[i]}</td></tr>`;
    }).join("");
    $("spCoordNote").innerHTML =
      `Gauge base point included on both sides — same seed, so it cancels in Δ. Each coordinate ` +
      `is a linear functional of the potential itself, which is why agreement is an iff and not a ` +
      `fit. The lattice these five live on has index <b>${can.index.toLocaleString("en")}</b> in ` +
      `ℤ⁵ (invariant factors ${(can.invariant_factors || []).join(" · ")}` +
      `${can.index_matches_archive === false ? ` — <b style="color:var(--rust)">and |det| of the five ` +
        `generators DISAGREES with the archive</b>` : `, and |det| of the five canonical generators ` +
        `returns the same number`}). <span class="chip thm">theorem</span> Part VII eq. (30).`;

    /* ---- the kernel, applied to B ---------------------------------------------------------- */
    const relTxt = (r2) => `${r2.lhs} = ${r2.rhs.map(([t, c]) => `${c}×${t}`).join(" + ")}`;
    $("spKernel").innerHTML = rels.map((r2, i) => {
      const canFwd = (SAMEPOT_B[r2.lhs] || 0) >= 1;
      const canBack = r2.rhs.every(([t, c]) => (SAMEPOT_B[t] || 0) >= c);
      return `<div class="rowm"><span class="nm" style="font-size:12px">${relTxt(r2)}</span>` +
        `<button class="st" data-r="${i}" data-w="f" ${canFwd ? "" : "disabled"}
                 style="width:auto;padding:0 8px" title="replace one ${r2.lhs} in B by the right side">→</button>` +
        `<button class="st" data-r="${i}" data-w="b" ${canBack ? "" : "disabled"}
                 style="width:auto;padding:0 8px" title="replace the right side in B by one ${r2.lhs}">←</button></div>`;
    }).join("");
    $("spKernel").querySelectorAll("button[data-r]").forEach((b) => (b.onclick = () => {
      const r2 = rels[+b.dataset.r], fwd = b.dataset.w === "f";
      if (fwd) {
        if ((SAMEPOT_B[r2.lhs] || 0) < 1) return;
        SAMEPOT_B[r2.lhs] -= 1;
        for (const [t, c] of r2.rhs) SAMEPOT_B[t] = (SAMEPOT_B[t] || 0) + c;
      } else {
        if (!r2.rhs.every(([t, c]) => (SAMEPOT_B[t] || 0) >= c)) return;
        for (const [t, c] of r2.rhs) SAMEPOT_B[t] -= c;
        SAMEPOT_B[r2.lhs] = (SAMEPOT_B[r2.lhs] || 0) + 1;
      }
      ctx.refresh();
    }));
    $("spKernelNote").innerHTML =
      `Degenerate contents are in print and were called an accident: two SU(6) models with ` +
      `different bulk fermions and identical gauge-scalar potentials (CCD24 eq. (3.26)). The ` +
      `kernel says they are a subspace, not accidents. <b>Scope:</b> this is a one-loop statement ` +
      `— the two sides of the third relation differ in Σ C₂, so Part VI already notes that ` +
      `degeneracy dies at two loops. <span class="chip thm">theorem</span> the relations, solved ` +
      `from this engine's own vectors and verified on all five coordinates.`;

    /* ---- the canonical five, A beside B ---------------------------------------------------- */
    const NA = can.canonical;
    const NB = canonicalCounts(SAMEPOT_B, rels);
    $("spCanonT").innerHTML = CANON_TYPES.map((t) => {
      const agree = NA[t] === NB[t];
      return `<tr${!agree && !emptyB ? ' style="background:#fdf3ec"' : ""}>` +
        `<td style="font-family:var(--mono)">${t}</td>` +
        `<td class="num">${NA[t]}</td><td class="num">${emptyB ? "—" : NB[t]}</td></tr>`;
    }).join("");
    const canonSame = CANON_TYPES.every((t) => NA[t] === NB[t]);
    $("spCanonNote").innerHTML = emptyB
      ? `Two contents have the same potential iff their canonical representatives are the same ` +
        `point of ℕ⁵.`
      : `Same potential ⟺ same canonical representative, and here they ` +
        (canonSame ? `<b>coincide</b>` : `<b style="color:var(--rust)">differ</b>`) +
        (canonSame === same ? `` : ` — <b style="color:var(--rust)">which contradicts the ` +
          `coordinate verdict above: the page is broken</b>`) +
        `. Inverting the basis turns the five invariants into five multiplicities, so the ` +
        `congruences of the ceiling section are exactly "B⁻¹ returns integers". ` +
        `<span class="chip thm">theorem</span> eq. (43).`;

    this._plot(ctx, r, bulkA, bulkB, conv, same, emptyB);
  },

  _differ(bulkA, countsB) {
    const a = countsOf(bulkA);
    const keys = new Set([...Object.keys(a), ...Object.keys(countsB)]);
    return [...keys].some((k) => (a[k] || 0) !== (countsB[k] || 0));
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  /* Both potentials on one frame.  When the five agree the dashed curve rides exactly on the
   * solid one -- the picture of the theorem is the absence of a second curve. */
  _plot(ctx, r, bulkA, bulkB, conv, same, emptyB) {
    const [g, W, H] = this._fit(document.getElementById("spPlot"), 330);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const L = 54, Rp = 16, T = 14, B = 34, iw = W - L - Rp, ih = H - T - B;
    const tA = termTable({ bulk: bulkA, conventions: conv }, ctx.DATA);
    const tB = emptyB ? null : termTable({ bulk: bulkB, conventions: conv }, ctx.DATA);

    const aMin = (t) => {
      const mo = moments(t);
      return mo.D > 0 ? alphaMin(mo) : null;
    };
    const a1 = aMin(tA), a2 = tB ? aMin(tB) : null;
    const hi = Math.min(0.6, Math.max(0.06,
      3.2 * Math.min(a1 || 0.11, a2 === null ? (a1 || 0.11) : a2)));

    const n = 180, xsA = [], ysA = [], ysB = [];
    let lo = Infinity, up = -Infinity;
    for (let i = 0; i <= n; i++) {
      const al = 1e-5 + hi * i / n;
      const yA = F(tA, al, 200);
      xsA.push(al); ysA.push(yA);
      if (yA < lo) lo = yA; if (yA > up) up = yA;
      if (tB) {
        const yB = F(tB, al, 200);
        ysB.push(yB);
        if (yB < lo) lo = yB; if (yB > up) up = yB;
      }
    }
    const pad = (up - lo) * 0.1 || 1, YL = lo - pad, YH = up + pad;
    const sx = (al) => L + al / hi * iw, sy = (y) => T + ih - (y - YL) / (YH - YL) * ih;

    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const Y = Math.round(T + ih * i / 3) + 0.5;
      g.beginPath(); g.moveTo(L, Y); g.lineTo(L + iw, Y); g.stroke();
    }
    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "center"; g.textBaseline = "top";
    for (let i = 0; i <= 4; i++) g.fillText((hi * i / 4).toFixed(3), sx(hi * i / 4), T + ih + 6);
    g.fillText("α, the Wilson-line phase", L + iw / 2, T + ih + 19);

    const curve = (ys, col, dash) => {
      g.strokeStyle = col; g.lineWidth = dash ? 2 : 2.4; g.lineJoin = "round";
      g.setLineDash(dash ? [6, 5] : []);
      g.beginPath();
      xsA.forEach((al, i) => (i ? g.lineTo(sx(al), sy(ys[i])) : g.moveTo(sx(al), sy(ys[i]))));
      g.stroke(); g.setLineDash([]);
    };
    curve(ysA, this._css("--blue"), false);
    if (tB) curve(ysB, this._css("--rust"), true);

    const dot = (a, t) => {
      if (a === null || a >= hi) return;
      const X = sx(a), Y = sy(F(t, a, 200));
      g.fillStyle = this._css("--green");
      g.beginPath(); g.arc(X, Y, 5, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
    };
    dot(a1, tA);
    if (tB) dot(a2, tB);

    document.getElementById("spPlotNote").innerHTML = emptyB
      ? `One curve: content A. Build a probe and its potential is drawn dashed over this one.`
      : same
        ? `The dashed curve rides exactly on the solid one — the picture of the theorem is the ` +
          `<b>absence of a second curve</b>. Two minima drawn, one visible.`
        : `Two potentials, and the theorem says no choice of phase reconciles them: the five ` +
          `coordinates are linear functionals of these curves.`;
  },
};

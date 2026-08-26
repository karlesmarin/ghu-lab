/* screen_section.js — "Screen a table": three tests a reader can run on someone else's published
 * row in a minute, none of which recomputes their model.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The row being screened is FOREIGN: it is view state, in no permalink and no card.  What the
 * shell's model contributes is the content the row claims to come from -- its term table supplies
 * F'' at the row's own alpha when the paper does not print one, and its (A4, 8D) fill the laws
 * when the inputs are left blank.  The three screens and what each one carries:
 *
 *   laws   k - 2A4 = 3 (mod 6): the lattice's, no normalisation, no seed.  Parity of k: the seed's.
 *   K      m_h a/sqrt(F'') = 2.2456 g4 for every row -- invariant under F -> lambda F, so it
 *          tests internal consistency, never the anchor.  Part VI's open problem 3.
 *   comb   the KK scale sits on teeth spaced exactly in M^2; each rung's teeth stop at its own
 *          ceiling.  The SPACING is arithmetic; the POSITION carries the anchor residual and g4.
 *
 * Edited BY HAND.
 */
let SCREEN_ROW = null;               /* the foreign row, view state; survives remounts */
const SCREEN_SECTION = {
  id: "screen",
  label: "Screen a table",
  paper: "Parts VI–VII",
  ready: true,
  modules: [...modules(DATA), screenModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="scLead">—</p>
    <div class="note" style="margin-top:9px">
      A published row — an (α<sub>min</sub>, m<sub>h</sub>) pair, two moments, maybe a resonance
      mass — makes claims its own paper never re-checks. These three screens test a row
      <b>without recomputing its model</b>: two integers for the laws, one identity for K, one
      comb for the Kaluza–Klein scale. The content this instrument holds (the header) stands in
      as the content the row claims; its term table supplies F&Prime; when the paper prints none.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The row you are screening</h2>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <span class="note" style="align-self:center">their Table 1:</span>
          <span id="scRows" style="display:flex;gap:5px"></span>
          <button class="ghost" id="scClear">clear</button>
        </div>
        <div id="scInputs"></div>
        <div class="note" style="margin-top:9px">8D and A₄ blank = read off the model in the
        header. F&Prime; blank = computed from that model's exact potential at the row's α —
        term-wise derivatives, the same series the archive sums.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Screen 1 — the laws, on two integers</h2>
        <div class="verdict stable" id="scLaws"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Screen 2 — K, the row-consistency invariant</h2>
        <div class="verdict stable" id="scKV"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px">K = m<sub>h</sub>α<sub>min</sub>/&radic;F&Prime;
        = 2m<sub>W</sub>&radic;(3/16π⁶)·g₄ = <b>2.2456·g₄</b> for every row of every content —
        and it is invariant under F &rarr; λF, so it tests what a row says <em>about itself</em>
        and nothing about the normalisation the anchor question is about.
        <span class="chip thm">theorem</span> Part VI, open problem 3.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Their five rows, screened — the archived run</h2>
        <table><thead><tr><th>row</th><th class="num">α theirs</th><th class="num">m<sub>h</sub></th>
          <th class="num">F&Prime;(α)</th><th class="num">K</th><th class="num">implied g₄</th>
          <th class="num">F&prime;/F&Prime;</th><th>verdict</th></tr></thead>
          <tbody id="scFive"></tbody></table>
        <div class="note" style="margin-top:9px" id="scFiveNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Screen 3 — the comb the KK scale must sit on</h2>
        <canvas id="scComb" width="720" height="360"></canvas>
        <div class="legend">
          <span><i style="background:var(--blue)"></i>a tooth — an admissible (k, A₄)</span>
          <span><i style="background:#c9d4dc"></i>a tooth past its rung's ceiling — no content reaches it</span>
          <span><i style="background:var(--rust)"></i>the rung's own ceiling</span>
          <span><i style="background:var(--amber)"></i>the candidate resonance</span>
          <span><i style="background:var(--green)"></i>this content's own tooth</span>
        </div>
        <div class="verdict stable" id="scHits" style="margin-top:11px"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px" id="scCombNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The spacing, exact — and in M², not M</h2>
        <table><thead><tr><th class="num">rung k</th><th class="num">ΔM², exact</th>
          <th class="num">its own ceiling</th><th class="num">ΔM there</th></tr></thead>
          <tbody id="scSpacing"></tbody></table>
        <div class="note" style="margin-top:9px">ΔM² = 8π²m_W²/(ζ(3)·k) — independent of the
        content <b>and of the Higgs mass</b>: pure arithmetic. A spacing in <em>mass</em> is
        ΔM²/2M, meaningless without saying at which M — so each rung's is quoted at its own
        ceiling, the only place its teeth can reach. <span class="chip thm">theorem</span>
        Part VII eq. (47).</div>
      </div>
    </div>
  </div>`,

  _defaults(ctx) {
    const p = ctx.DATA.published_rows[1].published;
    return { alpha: String(p.alpha_min), mh: String(p.m_h), F2: "", D8: "", A4: "",
             MKK: "", tol: "50" };
  },

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    if (SCREEN_ROW === null) SCREEN_ROW = this._defaults(ctx);
    $("scRows").innerHTML = ctx.DATA.published_rows.map((r, i) =>
      `<button class="ghost" data-i="${i}" title="their published α and m_h; load the content too via the hierarchy section">${r.label}</button>`).join("");
    $("scRows").querySelectorAll("button").forEach((b) => (b.onclick = () => {
      const row = ctx.DATA.published_rows[+b.dataset.i];
      SCREEN_ROW = { ...SCREEN_ROW, alpha: String(row.published.alpha_min),
                     mh: String(row.published.m_h), F2: "",
                     D8: String(row.ours.D8), A4: String(row.ours.A4) };
      ctx.load(row.bulk);           /* the row's content stands in as the claimed model */
    }));
    $("scClear").onclick = () => { SCREEN_ROW = this._defaults(ctx); ctx.refresh(); };
  },

  _num(s) { const x = parseFloat(String(s).trim()); return Number.isFinite(x) ? x : null; },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    const conv = r.model.conventions || {};
    const mW = conv.m_W, g4 = conv.g4;
    const seed = v.get("seed").value;

    /* ---- the inputs, rebuilt from state so a remount keeps them ---------------------------- */
    const FIELDS = [
      ["alpha", "α_min", "their published minimum"],
      ["mh", "m_h (GeV)", "their Higgs mass"],
      ["F2", "F″(α)", "optional — theirs, if printed"],
      ["D8", "8D", `blank = ${v.get("D8").value}, the model's`],
      ["A4", "A₄", `blank = ${v.get("A4").value}, the model's`],
      ["MKK", "M_KK (GeV)", "a candidate resonance, for the comb"],
      ["tol", "± (GeV)", "the comb's tolerance"],
    ];
    if (!$("scInputs").innerHTML)
      $("scInputs").innerHTML = FIELDS.map(([key, label, hint]) =>
        `<div class="rowm"><span class="nm">${label}</span>` +
        `<input id="sci_${key}" type="text" size="9" style="font-family:var(--mono);font-size:13px;` +
        `padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:96px">` +
        `<span class="note" style="flex:1">${hint}</span></div>`).join("");
    for (const [key] of FIELDS) {
      const el = $("sci_" + key);
      if (document.activeElement !== el) el.value = SCREEN_ROW[key];
      el.onchange = () => { SCREEN_ROW[key] = el.value; ctx.refresh(); };
    }

    /* ---- the three screens ----------------------------------------------------------------- */
    const alpha = this._num(SCREEN_ROW.alpha), mh = this._num(SCREEN_ROW.mh);
    const k = this._num(SCREEN_ROW.D8) ?? v.get("D8").value;
    const A4 = this._num(SCREEN_ROW.A4) ?? v.get("A4").value;
    const typedF2 = this._num(SCREEN_ROW.F2);
    const terms = termTable(r.model, ctx.DATA);
    const F2 = typedF2 !== null ? typedF2 : (alpha !== null ? dF(terms, alpha, 2) : null);
    const F1 = typedF2 !== null || alpha === null ? null : dF(terms, alpha, 1);
    const laws = screenLaws(k, 2 * A4);
    const kv = alpha !== null && mh !== null && F2 !== null
      ? screenK({ alpha, mh, F2, mW }) : { K: null, implied_g4: null };

    $("scLaws").className = "verdict " + (laws.mod6 ? "breaks" : "stable");
    $("scLaws").innerHTML =
      `<b>${laws.mod6 ? "8D ≡ 2A₄ + 3 (mod 6) holds" : "8D ≡ 2A₄ + 3 (mod 6) FAILS"} at ` +
      `(8D, A₄) = (${k}, ${A4})</b>` +
      `<span>The content law: no normalisation, no loop order, no gauge sector — a row that ` +
      `fails it is not a content of this model class, full stop. The parity of 8D is the ` +
      `<em>seed's</em>: here 8D is ${laws.kOdd ? "odd" : "even"}, ` +
      `${(seed.parity_of_8D === "odd") === laws.kOdd
         ? `as the ${seed.name} seed demands` : `<b style="color:var(--rust)">against the ` +
           `${seed.name} seed — the row stands on the other split</b>`}. ` +
      `<span class="chip thm">theorem</span> Part VII Thm 2; the seed, §13.</span>`;

    const dev = kv.implied_g4 === null ? null : Math.abs(kv.implied_g4 / g4 - 1);
    $("scKV").className = "verdict " +
      (kv.K === null ? "stable" : dev < 0.15 ? "breaks" : "stable");
    $("scKV").innerHTML = alpha === null || mh === null
      ? `<b>Type the row's α and m_h</b><span>K needs both, and F″ from either the paper or the model.</span>`
      : F2 !== null && F2 <= 0
        ? `<b style="color:var(--rust)">Their α is not at a minimum</b><span>F″(${alpha}) = ` +
          `${F2.toFixed(4)} &lt; 0 on this content: the published point is not a minimum of the ` +
          `potential its own content generates, and no K exists there. ` +
          `${F1 !== null ? `The Newton step −F′/F″ = ${(-F1 / F2).toFixed(4)} says where the ` +
            `nearest extremum actually is.` : ""}</span>`
        : `<b>K = ${kv.K.toFixed(5)} — the row implies g₄ = ${kv.implied_g4.toFixed(4)}</b>` +
          `<span>Against the g₄ = ${g4} this instrument runs on, that is ` +
          `${dev < 0.15 ? `within ${(100 * dev).toFixed(1)} % — <b>internally consistent</b>`
             : `<b style="color:var(--rust)">${(100 * dev).toFixed(0)} % off — the row's α, m_h ` +
               `and content do not describe one minimum</b>`}. ` +
          (typedF2 !== null
            ? `F″ as typed from their paper. `
            : `F″ = ${F2.toFixed(4)} from this model's exact potential at their α` +
              (F1 !== null ? `; stationarity F′/F″ = ${(F1 / F2).toFixed(4)} ` +
                `(0 would be exactly at the minimum)` : ``) + `. `) +
          `<span class="chip mea">measured</span> the derivative; the identity is exact.</span>`;

    this._five(v);
    this._comb(ctx, v, { mh: mh ?? 125.2, mW, g4, seed,
                         MKK: this._num(SCREEN_ROW.MKK), tol: this._num(SCREEN_ROW.tol) ?? 50 });
    this._spacing(ctx, mW);

    const chip = (okv) => okv ? `<span class="chip thm">passes</span>`
                              : `<span class="chip bad">fails</span>`;
    $("scLead").innerHTML =
      `Laws ${chip(laws.mod6)} · K ${kv.K === null
        ? `<span class="chip live">needs α, m_h</span>`
        : chip(dev < 0.15)} · comb ${this._num(SCREEN_ROW.MKK) === null
        ? `<span class="chip live">no candidate typed</span>`
        : (this._lastHits && this._lastHits.length ? chip(true) : chip(false))} — ` +
      `three screens, none of which recomputes the foreign model. On their own five rows the K ` +
      `screen already speaks: three are consistent near g₄ ≈ 0.6, one implies 1.87, and one is ` +
      `not even at a minimum.`;
  },

  /* ---- the archived five, with verdicts ---------------------------------------------------- */
  _five(v) {
    const $ = (id) => document.getElementById(id);
    const sc = v.get("screen");
    if (sc.status === "unknown") {
      $("scFive").innerHTML = "";
      $("scFiveNote").textContent = sc.reason;
      return;
    }
    const s = sc.value;
    $("scFive").innerHTML = s.at_theirs.map((row) => {
      const bad = row.K === null || row.g4 > 1 || row.g4 < 0.3;
      const verdict = row.K === null
        ? `<span class="chip bad">not at a minimum</span>`
        : row.g4 > 1 ? `<span class="chip bad">implies g₄ = ${row.g4.toFixed(2)}</span>`
        : `<span class="chip thm">g₄ ≈ ${row.g4.toFixed(2)}</span>`;
      return `<tr${bad ? ' style="background:#fdf3ec"' : ""}><td>${row.case}</td>` +
        `<td class="num">${row.a_theirs.toFixed(4)}</td><td class="num">${row.mh.toFixed(1)}</td>` +
        `<td class="num">${row.F2.toFixed(3)}</td>` +
        `<td class="num">${row.K === null ? "—" : row.K.toFixed(4)}</td>` +
        `<td class="num">${row.g4 === null ? "—" : row.g4.toFixed(4)}</td>` +
        `<td class="num">${(row.F1 / row.F2).toFixed(4)}</td><td>${verdict}</td></tr>`;
    }).join("");
    $("scFiveNote").innerHTML =
      `Evaluated at THEIR published α with the exact F″ of each row's own content — the archived ` +
      `run, which the engine reproduces: 2m_W&radic;(3/16π⁶) = ${s.K_over_g4_engine.toFixed(6)} ` +
      `against the archive's ${s.K_over_g4.toFixed(6)}${s.agrees ? "" :
        " — <b style='color:var(--rust)'>and they disagree: the page is broken</b>"}. Rows (1), ` +
      `(2), (5) agree on g₄ ≈ 0.6; row (4) would need g₄ = 1.87; row (3)'s α has F″ &lt; 0. ` +
      `This is the open anchor question seen from inside their own table. ` +
      `<span class="chip ver">verified</span> su7_anchor_mh.py, archived.`;
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  /* The comb, in a WINDOW.  Drawn over the whole axis the teeth of the high rungs fuse into a
   * bar; drawn in a window each rung is either a readable set of teeth or a greyed row saying its
   * ceiling cannot reach here -- which is the paper's own point about quoting spacings. */
  _comb(ctx, v, { mh, mW, g4, seed, MKK, tol }) {
    const [g, W, H] = this._fit(document.getElementById("scComb"), 360);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const per = (ctx.DATA.ceilings && ctx.DATA.ceilings.per_rung) || [];
    const parityOdd = seed.parity_of_8D === "odd";
    const RUNGS = per.filter((p) => p["8D"] <= 21 && (p["8D"] % 2 === 1) === parityOdd);
    const $ = (id) => document.getElementById(id);
    if (!RUNGS.length) { $("scHits").innerHTML = `<b>No per-rung ceilings for this seed</b><span></span>`; return; }

    const centre = MKK !== null ? MKK : 9600;
    const half = Math.max(800, tol * 8);
    const lo = Math.max(2600, centre - half), hi = centre + half;
    const L = 148, Rp = 14, T = 12, B = 34, iw = W - L - Rp, ih = H - T - B;
    const X = (M) => L + (M - lo) / (hi - lo) * iw;
    const mu = combMu(mh, mW, g4);

    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "center"; g.textBaseline = "top";
    for (let i = 0; i <= 2; i++) {
      const M = lo + (hi - lo) * i / 2;
      g.fillText((M / 1000).toFixed(2), X(M), T + ih + 6);
    }
    g.fillText("M_KK = 1/R₅ (TeV)", L + iw / 2, T + ih + 19);

    /* THE CEILING BOUND FOR EVERY RUNG, certified or not.  The per-rung ceiling is monotone
     * decreasing in D, so a rung between two certified ones is bounded by the certified rung
     * BELOW it -- which is what lets the vacuity trap be closed for k = 11, 13, 17, 19 too.
     * Without this, a 50 GeV tolerance at 10 TeV "lands on a tooth" for every mass, because the
     * high rungs' teeth are denser than any honest tolerance: a test that cannot fail. */
    const ceilBound = (kk) => {
      let best = null;
      for (const p of per) if (p["8D"] <= kk) best = best === null ? p.GeV : Math.min(best, p.GeV);
      return best;
    };
    const hits = (MKK !== null
      ? combMatch({ MKK, tolGeV: tol, mh, mW, g4, kmax: 21, parity: parityOdd ? "odd" : "even" })
      : []).map((h2) => {
        const b = ceilBound(h2.k);
        return { ...h2, reachable: b === null ? null : h2.M <= b };
      });
    const real = hits.filter((h2) => h2.reachable !== false);
    this._lastHits = real;

    if (MKK !== null) {
      g.fillStyle = "rgba(216,164,64,.15)";
      g.fillRect(X(Math.max(lo, MKK - tol)), T, X(Math.min(hi, MKK + tol)) - X(Math.max(lo, MKK - tol)), ih);
      g.strokeStyle = this._css("--amber"); g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(X(MKK), T); g.lineTo(X(MKK), T + ih); g.stroke();
    }

    const rows = RUNGS.length;
    RUNGS.forEach((p, i) => {
      const kk = p["8D"], ceil = p.GeV;
      const y = T + ih * (i + 0.5) / rows;
      const reaches = ceil >= lo;
      g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(L, y + .5); g.lineTo(L + iw, y + .5); g.stroke();
      g.fillStyle = reaches ? this._css("--ink2") : this._css("--rust");
      g.font = (reaches ? "" : "600 ") + "10px " + this._css("--mono");
      g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText(reaches ? `k = ${kk} · ceiling ${(ceil / 1000).toFixed(2)}`
                         : `k = ${kk} — ceiling ${(ceil / 1000).toFixed(2)}, cannot reach`, L - 7, y);
      if (!reaches) return;
      /* the teeth inside the window: A4 = (k-3)/2 + 3j, M^2 from identity (II) */
      const M2lo = lo * lo, M2hi = hi * hi;
      const A4lo = 3 * Z3 * kk * M2lo / (8 * Math.PI ** 2 * mW ** 2) - 6 * mu;
      const A4hi = 3 * Z3 * kk * M2hi / (8 * Math.PI ** 2 * mW ** 2) - 6 * mu;
      const jlo = Math.ceil((A4lo - (kk - 3) / 2) / 3), jhi = Math.floor((A4hi - (kk - 3) / 2) / 3);
      for (let j = jlo; j <= jhi; j++) {
        const A4 = combA4(kk, j);
        if (A4 <= 0) continue;
        const M = Math.sqrt(combM2(A4, kk, mu, mW));
        const past = M > ceil;
        g.strokeStyle = past ? "#c9d4dc" : this._css("--blue");
        g.lineWidth = past ? 1 : 1.4;
        g.beginPath(); g.moveTo(X(M), y - (past ? 5 : 8)); g.lineTo(X(M), y + (past ? 5 : 8)); g.stroke();
      }
      if (ceil <= hi) {
        g.strokeStyle = this._css("--rust"); g.lineWidth = 2;
        g.beginPath(); g.moveTo(X(ceil), y - 12); g.lineTo(X(ceil), y + 12); g.stroke();
      }
      for (const h2 of hits.filter((x) => x.k === kk)) {
        g.strokeStyle = h2.reachable === false ? "#c9d4dc" : this._css("--amber");
        g.lineWidth = 2;
        if (h2.reachable === false) g.setLineDash([2, 2]);
        g.beginPath(); g.arc(X(h2.M), y, 7, 0, 7); g.stroke();
        g.setLineDash([]);
      }
    });

    /* this content's own tooth, if it is in the window */
    const D8v = v.get("D8"), A4v = v.get("A4");
    if (D8v.status !== "unknown" && D8v.value > 0) {
      const mine = surfaceInvR5({ A4: A4v.value, D8: D8v.value }, mh, mW, g4);
      const row = RUNGS.findIndex((p) => p["8D"] === D8v.value);
      if (mine !== null && mine >= lo && mine <= hi && row >= 0) {
        const y = T + ih * (row + 0.5) / rows;
        g.fillStyle = this._css("--green");
        g.beginPath(); g.arc(X(mine), y, 5, 0, 7); g.fill();
        g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
      }
    }

    const ghosts = hits.length - real.length;
    const ghostLine = ghosts
      ? ` ${real.length ? "And a" : "A"}nother ${ghosts} admissible ${ghosts > 1 ? "teeth lie" : "tooth lies"} ` +
        `<b>past its rung's certified ceiling</b> — arithmetic that no realisable content reaches, ` +
        `drawn dashed. Counting those, every mass would land somewhere: the high rungs' teeth are ` +
        `denser than any honest tolerance, and a screen that cannot fail screens nothing.`
      : ``;
    $("scHits").className = "verdict " + (MKK === null ? "" : real.length ? "breaks" : "stable");
    $("scHits").innerHTML = MKK === null
      ? `<b>Type a candidate M_KK to run the comb</b><span>The window is parked at the top of ` +
        `the comb, where the ceilings bite and the teeth are sparse.</span>`
      : real.length
        ? `<b>${MKK} ± ${tol} GeV lands on ${real.length} reachable ${real.length > 1 ? "teeth" : "tooth"}</b>` +
          `<span>${real.map((h2) => `(k = ${h2.k}, A₄ = ${h2.A4}, M = ${Math.round(h2.M)} GeV)`).join(" · ")} ` +
          `— <b>necessary, not sufficient</b>: every realisable content lands on a tooth, not ` +
          `every tooth holds a content.${ghostLine} <span class="chip thm">theorem</span> Part VII eq. (46).</span>`
        : `<b style="color:var(--rust)">No reachable tooth within ±${tol} GeV</b><span>Given ` +
          `m_h = ${mh}, m_W and g₄, no admissible (k ≤ 21, A₄) below its rung's ceiling puts a ` +
          `Kaluza–Klein scale there on the ${seed.name} seed.${ghostLine} Either the tolerance is ` +
          `honest and the model is excluded at that mass — or the resonance is not this model's.</span>`;
    const mineNote = D8v.status !== "unknown" && !RUNGS.some((p) => p["8D"] === D8v.value)
      ? ` This content sits on k = ${D8v.value}, a rung outside the certified per-rung list, so ` +
        `its own tooth is not drawn.`
      : ``;
    $("scCombNote").innerHTML =
      `Teeth from identity (II) at m_h = ${mh} GeV, admissible A₄ only ` +
      `(${parityOdd ? "k odd, A₄ ≡ −k (mod 3)" : "k even, A₄ half-integral"}), each rung cut at ` +
      `its own certified ceiling; a rung with no certificate of its own is bounded by the rung ` +
      `below it, which the monotonicity of the ceiling licenses.${mineNote} <b>The spacing is ` +
      `arithmetic; the position carries the anchor residual and the choice of g₄</b> — which is ` +
      `why a miss excludes more honestly than a hit confirms. ` +
      `<span class="chip mea">measured</span> the positions; ` +
      `<span class="chip thm">theorem</span> the spacing and the admissibility.`;
  },

  _spacing(ctx, mW) {
    const per = (ctx.DATA.ceilings && ctx.DATA.ceilings.per_rung) || [];
    document.getElementById("scSpacing").innerHTML = per.filter((p) => p["8D"] <= 21).map((p) => {
      const k = p["8D"], d2 = combSpacingM2(k, mW);
      return `<tr><td class="num">${k}</td>` +
        `<td class="num">${(d2 / 1e6).toFixed(3)} TeV²</td>` +
        `<td class="num">${(p.GeV / 1000).toFixed(2)} TeV</td>` +
        `<td class="num">${(d2 / (2 * p.GeV)).toFixed(1)} GeV</td></tr>`;
    }).join("");
  },
};

/* hierarchy_section.js — Part VII as a section of the instrument.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A section is a small object: what it is called, which paper it comes from, its markup, the
 * kernel modules it needs, and how to draw a run.  It computes nothing itself — it asks the
 * resolver and draws what comes back, statuses included.
 *
 * Adding a section is one file and one line in the registry.  That is D3 and D6 being true rather
 * than aspirational, and it is why the shell holds the model instead of each section holding its
 * own.
 *
 * Edited BY HAND.
 */
const DATA = DATASETS.su7_km25;
let HIER_SWEEP = null;
const HIERARCHY_SECTION = {
  id: "hierarchy",
  label: "Hierarchy",
  paper: "Part VII",
  ready: true,
  modules: [selectionModule(DATA), ...modules(DATA)],
  certificates: certificates(DATA),

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="lead">—</p>
    <div class="verdict stable" id="gap" style="margin-top:11px">—</div>
    <div class="note" style="margin-top:9px">
      In gauge–Higgs unification the compactification scale is tied to the weak scale by
      <span style="font-family:var(--mono)">α<sub>min</sub> = 2 m<sub>W</sub> R₅</span>, so the
      vacuum of this potential <em>is</em> the electroweak hierarchy.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The potential, as you change the content${helpMark("one-loop-potential")}</h2>
        <canvas id="pot" width="720" height="330"></canvas>
        <div class="legend">
          <span><i style="background:var(--blue)"></i>F(α), summed here</span>
          <span><i style="background:var(--rust)"></i>its minimum</span>
          <span><i style="background:var(--ink3);height:1px"></i>the symmetric point</span>
        </div>
        <div class="note" style="margin-top:9px" id="potNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The bulk content${helpMark("bulk-content")}</h2>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button class="ghost" id="clr">clear</button>
          <button class="ghost" id="tour">▶ show me</button>
        </div>
        <div id="slots"></div>
        <div class="note" style="margin-top:9px">Each state's charge carries the sign of its
        Kaluza–Klein tower: <b>+</b> periodic, <b>−</b> antiperiodic. That sign is the whole of the
        second moment.</div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">
          <div class="k" style="font:650 11px/1.6 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)">the gauge seed</div>
          <label style="display:block;margin-top:5px;font-size:13.5px"><input type="radio" name="hSeed" value="published" id="hSeedP"> as printed in KM25 eq. (68) — weights (2, ½), <span style="font-family:var(--mono)">8D</span> odd</label>
          <label style="display:block;margin-top:3px;font-size:13.5px"><input type="radio" name="hSeed" value="candidate" id="hSeedC"> the candidate split of Part VII §13 — weights (3/2, ½), <span style="font-family:var(--mono)">8D</span> even</label>
          <div class="note" style="margin-top:6px" id="hSeedNote">—</div>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The arithmetic laws${helpMark("moments")}</h2>
        <table><tbody>
          <tr><td>8D ≡ 2A₄ + 3 (mod 6) — Theorem 2, on either seed</td><td class="num" id="l2"></td></tr>
          <tr><td>2W is odd — the two symmetric points never tie, on either seed</td><td class="num" id="l3"></td></tr>
          <tr><td id="l1t">8D is odd, so D ≠ 0 — Theorem 1, <em>conditional</em> on the seed</td><td class="num" id="l1"></td></tr>
        </tbody></table>
        <div class="note" style="margin-top:9px" id="lawsNote">The only outputs here that carry no
        normalisation: they hold for every content, at any loop order, in any scheme. The third
        reads the parity of the gauge base point, which is the one thing the seed decides.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The other symmetric point</h2>
        <div class="pair">
          <div class="stat"><div class="k">W</div><div class="v" id="sW">—</div>
            <div class="s">Σ over odd charges of m·(−s)</div></div>
          <div class="stat"><div class="k">F(1) − F(0)</div><div class="v" id="sGap">—</div>
            <div class="s">= (31/16) ζ(5) W, exactly</div></div>
        </div>
        <table style="margin-top:11px"><tbody>
          <tr><td>endpoint stability — is α = 0 deeper than α = 1?</td>
              <td class="num" id="vHalf1">—</td></tr>
          <tr><td>global vacuum — is the small-α branch the deepest point of F?</td>
              <td class="num" id="vHalf2">—</td></tr>
        </tbody></table>
        <div class="verdict" id="vVac" style="margin-top:12px"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px">D says whether α = 0 is a maximum; it says nothing
        about whether the interior minimum is the <em>deepest</em> point. That is [8]'s criterion —
        compare the two symmetric points — and it is what took the ceiling from 10.01 to 9.22 TeV:
        the content that attains 10.01 sits in a false vacuum.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The closed form, against direct minimisation</h2>
        <div class="verdict" id="hSweep"><b>—</b><span>The header calls α<sub>min</sub>
        <span class="chip ver">verified</span> on the strength of a check run elsewhere, and the
        table below shows five rows. The lattice has <b>1 286</b> contents at five multiplets and
        the check can run here.</span></div>
        <canvas id="hSweepPlot" width="720" height="240" style="margin-top:12px;display:none"></canvas>
        <div style="display:flex;gap:8px;margin-top:11px;align-items:center;flex-wrap:wrap">
          <button class="ghost" id="hSweepGo">▶ check all 1 286 — about 6 s</button>
          <span class="note" id="hSweepNote"></span>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Their Table 1 — click to load</h2>
        <table><thead><tr><th>row</th><th class="num">8D</th><th class="num">A₄</th>
          <th class="num">α ours</th><th class="num">α theirs</th><th class="num">1/R₅</th></tr></thead>
          <tbody id="tb"></tbody></table>
        <div class="note" style="margin-top:9px">Their α column sits beside ours: the gap is the open
        anchor question of Part VI §7, and it is why every absolute number here is
        <span class="chip mea">measured</span>.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The sixth row, pre-registered — click to load</h2>
        <p class="note" style="margin:0 0 10px">Across their five rows, n(48) and the published α
        are <b>perfectly rank-correlated</b> — every row with a 48 is a row with a small α — so
        the anchor ratio (1.94 with a 48, 1.20 without) cannot say <em>which</em> is the locus.
        Two publishable contents break the lock, and Part VI commits <b>in print</b> to the
        number each reading predicts, before any such row exists:</p>
        <div style="overflow-x:auto"><table><thead><tr><th>candidate</th>
          <th class="num">α ours</th><th class="num">m_h</th>
          <!-- short headers, because the long ones pushed two columns behind a horizontal drag
               in a half-width card; the paragraph above says which reading each one is -->
          <th class="num">α theirs · if 48</th>
          <th class="num">α theirs · if small α</th></tr></thead><tbody id="h6Rows"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="h6Note">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Where this content sits</h2>
        <canvas id="map" width="720" height="330"></canvas>
        <div class="legend">
          <span><i style="background:var(--green)"></i>this content</span>
          <span><i style="background:var(--amber)"></i>the ceiling, true vacuum required</span>
          <span><i style="background:var(--rust)"></i>attained, but a false vacuum</span>
          <span><i style="background:#fff;border:1.5px solid var(--ink3)"></i>the relaxation's vertex, empty</span>
          <span><i style="background:rgba(27,111,140,.35)"></i>admissible lattice</span>
        </div>
        <div class="note" style="margin-top:9px" id="mapNote">One integer point in six is admissible:
        8D must be odd <b>and</b> 8D + A₄ ≡ 0 (mod 3).</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The hierarchy as a surface</h2>
        <canvas id="srf" width="720" height="360"></canvas>
        <div class="legend">
          <span><i style="background:var(--green)"></i>this content, on the surface</span>
          <span><i style="background:var(--amber)"></i>9.22 TeV, the physical ceiling</span>
          <span><i style="background:var(--rust)"></i>10.01 TeV, attained in a false vacuum</span>
        </div>
        <div class="note" style="margin-top:9px">Once m<sub>h</sub> is pinned, identity (II) makes
        1/R₅ an explicit function of the two quantised moments, with no minimisation left in it.
        The surface is that function; the ridge along small D is why the maximum sits on the
        quantum — and why the ceiling is a staircase whose top step the seed decides.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The four levels of the ceiling${helpMark("ceiling")}</h2>
        <table><thead><tr><th>bound</th><th class="num">1/R₅</th><th class="num">(A₄, 8D)</th>
          <th>what it bounds</th></tr></thead><tbody id="ceilRows"></tbody></table>
        <div class="note" style="margin-top:9px" id="ceilNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The numbers</h2>
        <div class="pair">
          <div class="stat"><div class="k">α<sub>min</sub></div><div class="v" id="sA">—</div>
            <div class="s" id="sAs">—</div></div>
          <div class="stat"><div class="k">m<sub>h</sub></div><div class="v" id="sM">—</div>
            <div class="s" id="sMs">—</div></div>
        </div>
        <div class="stat" style="margin-top:10px"><div class="k">1 / R₅</div>
          <div class="v" id="sR">—</div>
          <div class="bar"><i id="sBar" style="width:0"></i></div>
          <div class="s" id="sRs">—</div></div>
        <div class="verdict" id="vd" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>

    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("slots").innerHTML = ctx.SLOTS.map((s, i) => {
      const ch = ctx.DATA.reps[s.rep][s.key].map((t) => (t[1] > 0 ? "+" : "−") + t[2]).join(" ");
      return `<div class="rowm"><span class="nm">${s.rep}${s.key}</span>` +
             `<span class="ch">${ch}</span>` +
             `<button class="st" data-i="${i}" data-d="-1">−</button>` +
             `<span class="cnt z" id="c${i}">0</span>` +
             `<button class="st" data-i="${i}" data-d="1">+</button></div>`;
    }).join("");
    $("slots").querySelectorAll("button.st")
      .forEach((b) => (b.onclick = () => ctx.setN(+b.dataset.i, +b.dataset.d)));
    $("clr").onclick = () => ctx.clear();
    $("tour").onclick = () => ctx.load(ctx.DATA.published_rows[1].bulk);
    $("hSeedP").onchange = () => ctx.setSeed("published");
    $("hSeedC").onchange = () => ctx.setSeed("candidate");

    /* the four levels, static: they are properties of the lattice, not of the model */
    const C = ctx.DATA.ceilings, S = ctx.DATA.gauge_seeds;
    const tev = (g) => (g / 1000).toFixed(2) + " TeV";
    const pt = (l) => `(${l.A4}, ${l["8D"]})`;
    $("ceilRows").innerHTML = [
      [`relaxation`, C.relaxation, `any content — the LP dual's bound; its vertex is <b>empty</b>`,
       "chip unk", "relaxation"],
      [`attained`, C.attained, `any content whose electroweak point is <em>stationary</em>; ` +
       `the content that attains it is a false vacuum`, "chip ver", "attained"],
      [`true vacuum`, C.true_vacuum, `any content whose electroweak point is its <b>true vacuum</b>, ` +
       `m<sub>h</sub> anywhere in 125–127 — <b>the physical one</b>; its witness on the exact ` +
       `potential gives ${C.true_vacuum.exact.GeV} GeV`, "chip thm", "physical"],
      [`at m<sub>h</sub> = ${C.measured_mh.m_h}`, C.measured_mh,
       `the same, at the Higgs mass the Higgs actually has (±${C.measured_mh.m_h_err} does not ` +
       `move the vertex)`, "chip thm", "benchmark"],
    ].map(([name, l, what, cls, tag]) =>
      `<tr><td>${name}<br><span class="${cls}">${tag}</span></td>` +
      `<td class="num"><b>${tev(l.GeV)}</b></td><td class="num">${pt(l)}</td>` +
      `<td style="font-size:13.5px">${what}</td></tr>`).join("") +
      `<tr><td>asymptote</td><td class="num">${tev(C.asymptote_GeV)}</td><td class="num">8D → ∞</td>` +
      `<td style="font-size:13.5px">the Lambert-W limit the per-rung ceiling falls to, never reached; ` +
      `it carries no gauge quantity</td></tr>` +
      `<tr><td>candidate seed<br><span class="chip unk">relaxation</span></td>` +
      `<td class="num">${tev(S.candidate.ceiling_GeV)}</td><td class="num">(${S.candidate.ceiling_A4}, ${S.candidate.ceiling_8D})</td>` +
      `<td style="font-size:13.5px">on the candidate split of §13, 8D is even, the 8D = 1 step does not ` +
      `exist, and the relaxation's bound drops one rung. The true-vacuum level is <b>not</b> ` +
      `recomputed on that branch, so 9.22 stays the conservative number</td></tr>`;
    $("ceilNote").innerHTML =
      `All on the gauge seed as printed unless the row says otherwise. Every level is identity ` +
      `(II) read at a lattice point at the top of the window — a surface value, not a search. ` +
      `<span class="chip thm">theorem</span> the bound; <span class="chip mea">measured</span> ` +
      `every absolute TeV, which carries the anchor band. Part VII §8, eqs. (24), (32), (36), (37).`;

    $("hSweepGo").onclick = () => {
      $("hSweepNote").textContent = "running…";
      /* the repaint has to land before the main thread goes away for six seconds */
      /* on the seed the model stands on -- a sweep of the printed seed under a candidate model
       * would be a picture of a different lattice */
      setTimeout(() => {
        HIER_SWEEP = sweepHierarchy(ctx.DATA, { gauge: gaugeSeed(ctx.model(), ctx.DATA).gauge });
        HIER_SWEEP.seed = ctx.seed;
        ctx.refresh();
      }, 20);
    };

    $("tb").innerHTML = ctx.DATA.published_rows.map((r, i) =>
      `<tr class="clk" data-i="${i}"><td>${r.label}</td><td class="num">${r.ours.D8}</td>` +
      `<td class="num">${r.ours.A4}</td><td class="num" id="ra${i}">—</td>` +
      `<td class="num" style="color:var(--amber)">${r.published.alpha_min.toFixed(4)}</td>` +
      `<td class="num" id="rr${i}">—</td></tr>`).join("");
    $("tb").querySelectorAll("tr").forEach((tr) =>
      (tr.onclick = () => ctx.load(ctx.DATA.published_rows[+tr.dataset.i].bulk)));

    /* THE SIXTH ROW: the two pre-registered candidates, with both committed numbers each.  The
     * mapping is the archive's own: on the 48-rich candidate the 48-locus reading applies the
     * 1.94, on the 48-free one it applies the 1.20 -- each reading predicts what ITS confounder
     * assignment implies for the new content. */
    const S6 = ctx.DATA.sixth_row;
    if (S6) {
      const compact6 = (bulk) => bulk.map((b) =>
        `${b.multiplicity > 1 ? b.multiplicity + "×" : ""}${b.rep}` +
        `(${b.parities.map((p) => (p > 0 ? "+" : "−")).join(",")})`).join(" + ");
      document.getElementById("h6Rows").innerHTML = S6.candidates.map((c, i) => {
        const if48 = c.a_ours / (c.n48 > 0 ? S6.ratio_with48 : S6.ratio_no48);
        const ifAl = c.a_ours / (c.n48 > 0 ? S6.ratio_no48 : S6.ratio_with48);
        return `<tr class="clk" data-s6="${i}" id="h6r${i}"><td style="font-size:12px;white-space:nowrap">${c.kind}<br>` +
          `<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink3)">${compact6(c.bulk)}</span></td>` +
          `<td class="num">${c.a_ours.toFixed(4)}</td><td class="num">${c.mh_ours.toFixed(1)}</td>` +
          `<td class="num"><b>${if48.toFixed(4)}</b></td><td class="num"><b>${ifAl.toFixed(4)}</b></td></tr>`;
      }).join("");
      document.getElementById("h6Rows").querySelectorAll("tr").forEach((tr) =>
        (tr.onclick = () => ctx.load(S6.candidates[+tr.dataset.s6].bulk)));
      const factor = (S6.ratio_with48 / S6.ratio_no48).toFixed(2);
      document.getElementById("h6Note").innerHTML =
        `The two committed numbers differ by a factor <b>${factor}</b>, which two significant ` +
        `figures resolve: whoever computes such a row can read the answer off instead of ` +
        `re-opening the argument. Neither reading is adopted. The α here are minima of the ` +
        `<b>exact</b> potential (the archived run); load a candidate and the header's closed ` +
        `form will sit within its own stated error law of it — a property, not a discrepancy. ` +
        `<span class="chip ver">verified</span> su7_sixth_row.py, archived with Part VI — the ` +
        `commitment predates any such row.`;
    }

    /* The published rows are computed once, through the same resolver the header uses. */
    ctx.DATA.published_rows.forEach((r, i) => {
      /* On the seed as printed: their table was computed on their coefficients, and a row moved to
       * the candidate seed is a different statement, which the panel does not silently make. */
      const m = complete({ schema_version: SCHEMA_VERSION, group: ctx.DATA.group,
                           orbifold: { name: ctx.DATA.orbifold.name }, brane: [], conventions: {},
                           bulk: r.bulk }).model;
      const v = ctx.resolveModel(m).values;
      const a = v.get("alpha_min"), R = v.get("invR5");
      $("ra" + i).textContent = a.status === "unknown" ? "—" : a.value.toFixed(4);
      $("rr" + i).textContent = R.status === "unknown" ? "—" : Math.round(R.value);
    });
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    ctx.n.forEach((n, i) => {
      const c = $("c" + i);
      if (c) { c.textContent = n; c.className = "cnt" + (n ? "" : " z"); }
    });
    /* is the loaded model one of the pre-registered candidates?  say so where they are listed */
    if (ctx.DATA.sixth_row) {
      const sig6 = (bulk) => (bulk || []).filter((b) => b.multiplicity)
        .map((b) => `${b.rep}${b.parities.map((p) => (p > 0 ? "+" : "-")).join("")}*${b.multiplicity}`)
        .sort().join(";");
      const here6 = sig6(r.model.bulk);
      ctx.DATA.sixth_row.candidates.forEach((c, i) => {
        const el = $("h6r" + i);
        if (el) el.style.background = sig6(c.bulk) === here6 ? "var(--amber-l)" : "";
      });
    }
    this._seed(v, ctx);
    this._lead(v, ctx, r);
    /* THE CAVEAT IS NOT PART OF THE LEAD, and it used to be — written at the end of `_lead`, which
     * returns early for a content that breaks nothing.  So the one state where the page has no
     * number at all was the one state where the sentence saying the numbers are not settled
     * silently disappeared, leaving the dash it was built with.  It is its own call now, made
     * unconditionally, for the same reason the census one is: a guard in the caller is a
     * hypothesis missing from the function. */
    this._gapBox(ctx, r);
    this._stats(v, ctx.DATA);
    this._laws(v);
    this._vacuum(v);
    this._pot(v, termTable(r.model, ctx.DATA));
    this._map(v, ctx.DATA);
    this._surface(v, r.model, ctx.DATA);
    this._sweep();
  },

  /* THE SEED, SAID OUT LOUD.  The radio reflects the model; the note says what standing on that
   * seed does to the theorems, which is the whole content of Part VII §13. */
  _seed(v, ctx) {
    const $ = (id) => document.getElementById(id);
    const s = v.get("seed").value, S = ctx.DATA.gauge_seeds;
    $("hSeedP").checked = s.name === "published";
    $("hSeedC").checked = s.name === "candidate";
    $("hSeedNote").innerHTML = s.name === "published"
      ? `Five gauge degrees of freedom (4 + 1) where a six-dimensional gauge field has four. The ` +
        `mixed row is 2·2 + 6·½ = 7, odd, so <b>8D is odd</b> and Theorem 1 applies. ` +
        `<span class="chip mea">as printed</span>`
      : `Three and one, which is four: the ghost subtraction lands in the periodic sector. The ` +
        `mixed row is 2·(3/2) + 6·½ = 6, even, so <b>8D is even</b>, A₄ half-integral, and the ` +
        `hypothesis of Theorem 1 is not met — the theorem itself is untouched. The base point ` +
        `moves by (9, 9, 9, 0, 0) in (2A₄, 8D, 2U, V, 2W); Theorem 2 and 2W-odd survive. ` +
        `The relaxation ceiling on this branch is <b>${(S.candidate.ceiling_GeV / 1000).toFixed(2)} ` +
        `TeV</b> at 8D = 2. <span class="chip unk">candidate, §13</span>`;
  },

  _vacuum(v) {
    const $ = (id) => document.getElementById(id);
    const W = v.get("W"), vac = v.get("vacuum");
    /* halves as halves: W is a half-odd-integer whenever matter contributes an integer */
    const fr = (x) => (Number.isInteger(2 * x) && !Number.isInteger(x) ? `${2 * x}/2` : String(x));
    $("sW").textContent = fr(W.value);
    $("sGap").textContent = vac.value.F1_minus_F0.toFixed(3);
    const D8 = v.get("D8").value;
    const ok = vac.value.true !== false, V = vac.value;   /* null = nothing to break: not "false" */
    /* THE TWO HALVES, NAMED AND RANKED.  An outside audit read `W > 0` under a THEOREM chip as a
     * claim about the global vacuum; the criterion only compares the two symmetric points.  The
     * strip says which question each half answers and what kind of answer it is. */
    $("vHalf1").innerHTML = V.symmetric_ok
      ? `<span class="chip thm">yes · theorem</span>` : `<span class="chip bad">no · theorem</span>`;
    $("vHalf2").innerHTML = V.deepest === null
      ? `<span class="chip live">no interior minimum to test</span>`
      : V.deepest ? `<span class="chip ver">yes · verified here</span>`
                  : `<span class="chip bad">no — deeper at α = ${V.alpha_global.toFixed(3)} · verified here</span>`;
    $("vVac").className = "verdict " + (ok ? (D8 > 0 ? "breaks" : "") : "stable");
    $("vVac").innerHTML = !V.symmetric_ok
      ? `<b style="color:var(--rust)">A false vacuum</b><span>F(1) − F(0) = ${V.F1_minus_F0.toFixed(3)} < 0: ` +
        `the potential is <b>deeper at α = 1</b>, so whatever minimum the closed form finds is not ` +
        `the vacuum of this content. The numbers above are still computed at the stationary point — ` +
        `and labelled. <span class="chip thm">theorem</span> Part VII eqs. (34)–(35)</span>`
      : V.deepest === false
        ? `<b style="color:var(--rust)">A false vacuum W alone cannot see</b><span>F(1) − F(0) = ` +
          `${V.F1_minus_F0.toFixed(3)} > 0, so α = 0 is deeper than α = 1 — but the small-α branch ` +
          `at ${V.alpha_branch.toFixed(4)} is <b>not the deepest point of F</b>: direct minimisation ` +
          `finds α = ${V.alpha_global.toFixed(4)}, lower by ${(-V.F_gap_to_global).toFixed(3)}. W &gt; 0 ` +
          `is necessary, not sufficient. <span class="chip thm">theorem</span> the symmetric half; ` +
          `<span class="chip ver">verified</span> the deeper minimum, by minimising the same F here.</span>`
        : `<b>The electroweak point is the deeper one${V.deepest ? ", and the deepest" : ""}</b>` +
          `<span>F(1) − F(0) = ${V.F1_minus_F0.toFixed(3)} > 0, so the other symmetric point sits above ` +
          `it. ${D8 > 0 ? (V.deepest ? "And the small-α branch is the deepest point of F on (0, 1], by " +
          "direct minimisation on this render — so it is the vacuum." : "With D > 0 there is an interior minimum.")
          : "But D ≤ 0, so there is no interior minimum for it to be the vacuum of."} ` +
          `<span class="chip thm">theorem</span> [8]'s criterion, Part VII eq. (34)` +
          `${V.deepest ? `; <span class="chip ver">verified</span> the deepest point` : ""}</span>`;
  },

  /* THE SWEEP, AND IT REPORTS TWO NUMBERS BECAUSE THERE ARE TWO QUESTIONS.
   *
   * The first run of this said "worst error 96 %" and it was wrong about what it had measured: on
   * that content the closed form's stationary point is fine, and the deepest point of F is simply
   * somewhere else.  Those are separate facts and the panel keeps them separate -- an accuracy and
   * a count of contents where the small-alpha branch is not the vacuum.
   *
   * And the worst case is quoted twice: inside the alpha range their own table reaches, and over
   * everything.  Their five rows run to alpha = 0.084; contents at 0.4 are extrapolation, and a
   * single worst case over both would let the extrapolation speak for the paper. */
  _sweep() {
    if (!HIER_SWEEP) return;
    const w = HIER_SWEEP, $ = (id) => document.getElementById(id);
    const pc = (x) => (100 * x).toFixed(x < 0.01 ? 4 : 2) + " %";
    $("hSweep").className = "verdict " + (w.control.trustworthy ? "breaks" : "stable");
    $("hSweep").innerHTML = !w.control.trustworthy
      ? `<b style="color:var(--rust)">The check did not earn its own numbers</b><span>The factoring ` +
        `differs from F by ${w.control.factoring.toExponential(1)}, or the bracketed minimum ` +
        `disagrees with an unbracketed one by ${pc(w.control.worstDisagreement)}. Nothing is ` +
        `reported from a run that cannot pass its own control.</span>`
      : `<b>${w.tested} contents with a vacuum · worst ${pc(w.worstInRegime)} where their table ` +
        `lives, ${pc(w.worst)} everywhere</b><span>` +
        `Of the <b>${w.contents}</b> contents of at most ${w.maxN} multiplets, ${w.noVacuum} have ` +
        `D ≤ 0, ${w.noSolution} give the fixed point no small-α solution, ${w.notMinimum} reach a ` +
        `stationary point that is not a minimum and ${w.atEdge} have no interior minimum at all — ` +
        `each counted, none dropped. On the <b>${w.tested}</b> that remain the closed form is ` +
        `within <b>${pc(w.worstInRegime)}</b> for α ≤ ${w.regimeAlphaMax.toFixed(4)} — the ` +
        `largest α <em>this engine</em> assigns to their five rows; their printed maximum is ` +
        `${w.publishedAlphaMax.toFixed(3)}, and the regime is bounded on our axis because that ` +
        `is the axis the closed form is evaluated on — and within <b>${pc(w.worst)}</b> out to α = ` +
        `${w.worstAt.alpha.toFixed(3)}; median <b>${pc(w.median)}</b>. ` +
        `<b>${w.notGlobal}</b> of them are a separate matter: there the small-α branch is a real ` +
        `minimum but <em>not</em> the deepest point of F — worst at ${w.notGlobalAt.content}, ` +
        `where the branch sits at ${w.notGlobalAt.branch.toFixed(4)} and F is lower at ` +
        `${w.notGlobalAt.deepest.toFixed(4)}. That is not an error bar, it is a statement about ` +
        `the model, and this tool does not decide it.<br><br>` +
        `<b>This is not the paper's 272.</b> Those are synthetic contents spanning twelve values ` +
        `of D; these are every content of at most ${w.maxN} multiplets, and the two numbers being ` +
        `close is a coincidence of counting. Inside their α range the medians agree — ` +
        `<b>${pc(w.medianInRegime)}</b> here against the 0.13 % quoted — and the whole of the ` +
        `difference in the overall median is contents their set never reached.</span>`;
    $("hSweepNote").innerHTML =
      `On the ${w.seed === "candidate" ? "candidate" : "printed"} gauge seed. ` +
      `Six atoms, ${w.windings} windings, one grid of ${w.grid}. Factoring exact to ` +
      `${w.control.factoring.toExponential(0)}; ${w.control.n} contents re-minimised with no ` +
      `bracket at all, agreeing to ${w.control.worstDisagreement.toExponential(1)}.`;
    $("hSweepPlot").style.display = "";
    this._sweepPlot(w);
  },

  /* Error against α, log-log — because the whole point is that it is a TREND and not a scatter:
   * the closed form is a small-α expansion and the plot has to be able to show it failing. */
  _sweepPlot(w) {
    const [g, W, H] = this._fit(document.getElementById("hSweepPlot"), 240);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const L = 52, Rp = 12, T = 12, B = 34, iw = W - L - Rp, ih = H - T - B;
    const pts = w.points.filter((p) => p.err > 0);
    if (!pts.length) return;
    const ax = pts.map((p) => p.a), ey = pts.map((p) => p.err);
    const x0 = Math.min(...ax) * 0.9, x1 = Math.max(...ax) * 1.1;
    const y0 = Math.max(1e-7, Math.min(...ey) * 0.5), y1 = Math.max(...ey) * 2;
    const X = (a) => L + (Math.log(a) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) * iw;
    const Y = (e) => T + ih - (Math.log(e) - Math.log(y0)) / (Math.log(y1) - Math.log(y0)) * ih;

    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    g.font = "9.5px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    g.textAlign = "right"; g.textBaseline = "middle";
    /* Decades from an INTEGER exponent, and the label from the same integer.  Multiplying by ten
     * in a loop reaches 0.009999999999999998, which then prints as "1e-2 %"; and toPrecision(1)
     * printed the 10 % line as "1e+1 %". An axis nobody can read is worse than no axis, because
     * the dots still look measured. */
    for (let k = -7; k <= 2; k++) {
      const e = Math.pow(10, k);
      if (e < y0 || e > y1) continue;
      g.beginPath(); g.moveTo(L, Y(e) + .5); g.lineTo(L + iw, Y(e) + .5); g.stroke();
      g.fillText((100 * e).toFixed(Math.max(0, -(k + 2))) + " %", L - 6, Y(e));
    }
    g.textAlign = "center"; g.textBaseline = "top";
    for (const a of [0.02, 0.05, 0.1, 0.2, 0.4]) {
      if (a < x0 || a > x1) continue;
      g.fillText(a.toFixed(2), X(a), T + ih + 6);
    }
    g.fillText("α_min of the content", L + iw / 2, T + ih + 19);

    /* the boundary of the regime their table actually reaches */
    const xb = X(w.regimeAlphaMax);
    g.strokeStyle = this._css("--amber"); g.lineWidth = 1.4; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(xb, T); g.lineTo(xb, T + ih); g.stroke(); g.setLineDash([]);
    /* at the top it sat across the caption; the bottom of the line is empty in every run */
    g.fillStyle = this._css("--amber"); g.font = "650 9.5px " + this._css("--mono");
    g.textAlign = "left"; g.textBaseline = "bottom";
    g.fillText("← their rows stop here, on our α (printed max 0.081)", xb + 5, T + ih - 4);

    for (const p of pts) {
      const inR = p.a <= w.regimeAlphaMax;
      g.fillStyle = inR ? this._css("--blue") : "#c9d4dc";
      g.beginPath(); g.arc(X(p.a), Y(p.err), inR ? 2.8 : 2.2, 0, 7); g.fill();
    }
    g.fillStyle = this._css("--ink3"); g.font = "9.5px " + this._css("--mono");
    g.textAlign = "left"; g.textBaseline = "top";
    g.fillText("|closed form − direct minimisation| / direct minimisation", L + 2, T + 2);
  },

  /* ---------------------------------------------------------------- prose */

  /* THE ANCHOR GAP, computed here rather than recalled.
   *
   * Our alpha and the published alpha do not agree, and the disagreement is not a constant: across
   * the five rows it runs 1.03x to 2.08x.  A constant factor would be a convention mismatch and
   * could be absorbed; a varying one cannot, and it is the open question of Part VI section 7.
   *
   * It used to live in a note under a table on the right.  A tool whose floor is
   * "UNAUDITABLE > false confidence" cannot put its headline number in large type and the reason
   * not to trust it in small type somewhere else -- so it is in the first sentence now. */
  _gap(data, model) {
    const sig = (bulk) => (bulk || []).filter((b) => b.multiplicity)
      .map((b) => `${b.rep}${b.parities.map((p) => (p > 0 ? "+" : "-")).join("")}*${b.multiplicity}`)
      .sort().join(";");
    const here = sig(model && model.bulk);
    let mine = null;
    const ratios = [];
    for (const row of data.published_rows || []) {
      const mo = moments(termTable({ bulk: row.bulk }, data));
      if (!(mo.D > 0)) continue;
      const a = alphaMin(mo);
      if (a === null || !row.published || !row.published.alpha_min) continue;
      const q = a / row.published.alpha_min;
      ratios.push(q);
      if (sig(row.bulk) === here) mine = { label: row.label, q };
    }
    if (!ratios.length) return null;
    return { mine, lo: Math.min(...ratios), hi: Math.max(...ratios), n: ratios.length };
  },

  _lead(v, ctx, r) {
    const el = document.getElementById("lead");
    const R = v.get("invR5"), mh = v.get("m_h");
    if (R.status === "unknown") {
      el.innerHTML = `This content does <b>not</b> break electroweak symmetry, so there is no scale ` +
                     `to report. <span style="color:var(--ink2)">${R.reason}</span>`;
      return;
    }
    const f = v.get("ceiling_fraction").value;
    const vac = v.get("vacuum").value;
    el.innerHTML = `This content puts the compactification scale at ` +
      `<b>${(R.value / 1000).toFixed(2)} TeV</b>, with a Higgs mass of ` +
      `<b>${mh.value.toFixed(1)} GeV</b>` +
      (v.get("in_window").value
        ? ` — <span style="color:var(--green)">inside the 125–127 GeV window</span>`
        : ` — outside the 125–127 GeV window`) +
      `. That is <b>${(100 * f).toFixed(0)} %</b> of the ${(ctx.DATA.ceilings.true_vacuum.GeV / 1000).toFixed(2)} TeV ` +
      `ceiling that no bulk content in its true vacuum can exceed` +
      (v.get("seed").value.name === "candidate"
        ? ` — a level computed on the seed as printed; on the candidate seed this model stands on, ` +
          `the relaxation's bound is ${(ctx.DATA.gauge_seeds.candidate.ceiling_GeV / 1000).toFixed(2)} TeV ` +
          `and the true-vacuum level has not been recomputed`
        : ``) +
      /* `vac.true` is ternary: null is "not applicable / not decided", and it must not fall into
       * the false-vacuum branch, which reads alpha_global and would find it null. */
      (vac.true !== false ? `.` : ` — <b style="color:var(--rust)">but this is a false vacuum</b>: ` +
        (!vac.symmetric_ok
          ? `the potential is deeper at the other symmetric point, by ${(-vac.F1_minus_F0).toFixed(1)}. `
          : `the potential is deeper at α = ${vac.alpha_global.toFixed(3)}, by ` +
            `${(-vac.F_gap_to_global).toFixed(2)} — a deeper minimum W &gt; 0 cannot see. `) +
        `The number is a stationary point, not a prediction.`);

  },

  /* THE CAVEAT DOES NOT GO AWAY WHEN THERE IS NOTHING TO ATTACH IT TO.  With the model emptied
   * there is no α of ours to compare with anyone's, and this box used to keep the dash it was
   * built with — which reads as "settled", the opposite of what it exists to say.  Clear the
   * model and the sentence changes to name the reason; it never disappears. */
  _gapBox(ctx, r) {
    const g = this._gap(ctx.DATA, r && r.model);
    if (!g) {
      document.getElementById("gap").className = "verdict";
      document.getElementById("gap").innerHTML =
        `<b>Nothing to compare yet.</b><span>With no bulk content there is no α of ours, so the ` +
        `ratio against the published rows has no subject. It is not settled either way: put a ` +
        `content in and this box will say by how much ours and theirs disagree on it. ` +
        `<span class="chip bad">no subject</span></span>`;
      return;
    }
    /* A verdict box is <b>title</b> + <span>body</span>: `.verdict > b` is a block, so every bold
     * number written as a direct child got its own line -- the same rule, the other way round. */
    document.getElementById("gap").innerHTML =
      `<b>And the number above is not settled.</b><span>` +
      `Our α does not agree with the published α` +
      (g.mine ? ` — on this row, <b>${g.mine.label}</b>, ours is <b>${g.mine.q.toFixed(2)}×</b> theirs`
              : ``) +
      `, and across the ${g.n} published rows the ratio runs <b>${g.lo.toFixed(2)}×</b> to ` +
      `<b>${g.hi.toFixed(2)}×</b>. A constant factor would be a convention and could be absorbed; ` +
      `a varying one cannot. This is the open anchor question of Part VI §7, and it is why every ` +
      `absolute number on this page — the TeV, the GeV — is measured and not a prediction. ` +
      `<b>The mass ratio and the two arithmetic laws below carry no such caveat</b>: no ` +
      `normalisation enters them.</span>`;
  },

  _stats(v, DATA) {
    const $ = (id) => document.getElementById(id);
    const a = v.get("alpha_min"), mh = v.get("m_h"), R = v.get("invR5");
    const CEIL = DATA.ceilings ? DATA.ceilings.true_vacuum.GeV : DATA.constants.ceiling_GeV;
    $("sA").textContent = a.status === "unknown" ? "—" : a.value.toFixed(6);
    $("sAs").textContent = a.status === "unknown" ? a.reason.slice(0, 70)
                                                  : `[${a.status}] closed form`;
    $("sM").textContent = mh.status === "unknown" ? "—" : mh.value.toFixed(2);
    $("sMs").textContent = mh.status === "unknown" ? "no real Higgs mass here"
      : (v.get("in_window").value ? "inside 125–127 GeV" : "outside 125–127 GeV");
    $("sR").textContent = R.status === "unknown" ? "—" : Math.round(R.value) + " GeV";
    const f = R.status === "unknown" ? 0 : v.get("ceiling_fraction").value;
    const bar = $("sBar");
    bar.style.width = Math.min(100, f * 100).toFixed(1) + "%";
    bar.className = f > 1 ? "over" : "";
    $("sRs").textContent = R.status === "unknown" ? "—"
      : `${(100 * f).toFixed(1)} % of the ${(CEIL / 1000).toFixed(2)} TeV ceiling, true vacuum required  ` +
        `[${v.get("ceiling_fraction").status}]`;

    const vd = $("vd"), br = R.status !== "unknown";
    const falseVac = br && v.get("vacuum").value.true === false;
    vd.className = "verdict " + (br && !falseVac ? (v.get("in_window").value ? "breaks" : "") : "stable");
    vd.innerHTML = !br
      ? `<b>No electroweak breaking</b><span>${v.get("alpha_min").reason}</span>`
      : falseVac
        ? `<b style="color:var(--rust)">A stationary point in a false vacuum</b><span>Electroweak ` +
          `symmetry breaks at this α, ${v.get("in_window").value ? "the Higgs mass even lands in the window" :
          "m_h falls outside 125–127 GeV"} — and none of it is the vacuum: F is lower at ` +
          `${v.get("vacuum").value.symmetric_ok
             ? `α = ${v.get("vacuum").value.alpha_global.toFixed(3)}, an interior minimum W alone cannot see`
             : "α = 1, the other symmetric point"}.</span>`
        : `<b>${v.get("in_window").value ? "A candidate row" : "Breaks, but m_h is wrong"}</b>` +
          `<span>${v.get("in_window").value
            ? "Electroweak symmetry breaks, the point is the true vacuum, and the Higgs mass lands in their own window."
            : "Electroweak symmetry breaks in the true vacuum, but m_h falls outside 125–127 GeV."}</span>`;
  },

  _laws(v) {
    const L = v.get("laws").value, S = v.get("seed").value;
    const chip = (ok, yes = "holds", no = "FAILS") =>
      `<span class="chip ${ok ? "thm" : "bad"}">${ok ? yes : no}</span>`;
    document.getElementById("l2").innerHTML = chip(L.mod6);
    document.getElementById("l3").innerHTML = chip(L.w2odd);
    const l1 = document.getElementById("l1"), l1t = document.getElementById("l1t");
    if (L.expectOdd) {
      l1t.innerHTML = `8D is odd, so D ≠ 0 — Theorem 1, whose hypothesis <em>this seed meets</em>`;
      l1.innerHTML = chip(L.odd && L.parityAsSeed);
    } else {
      l1t.innerHTML = `8D is <b>even</b> on this seed — the hypothesis of Theorem 1 is not met, ` +
                      `and D = 0 is reachable on the lattice; what forbids it is identity (II)`;
      l1.innerHTML = chip(!L.odd && L.parityAsSeed, "as the seed says", "FAILS");
    }
    document.getElementById("lawsNote").innerHTML = L.all
      ? `The only outputs here that carry no normalisation: they hold for every content, at any ` +
        `loop order, in any scheme. The third reads the parity of the gauge base point — ` +
        `<span style="font-family:var(--mono)">${S.label}</span> — which is the one thing the seed decides.`
      : `<b style="color:var(--rust)">This cannot happen for a content of this class on this seed; ` +
        `if you see it, the page is broken.</b>`;
  },

  /* ---------------------------------------------------------------- canvas */

  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 720;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d");
    g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  _pot(v, terms) {
    const [g, W, H] = this._fit(document.getElementById("pot"), 330);
    const L = 54, Rp = 16, T = 14, B = 34, iw = W - L - Rp, ih = H - T - B;
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const a = v.get("alpha_min");
    const hi = a.status === "unknown" ? 0.35 : Math.min(0.6, Math.max(0.06, a.value * 3.2));
    const n = 200, xs = [], ys = [];
    let lo = Infinity, up = -Infinity;
    for (let i = 0; i <= n; i++) {
      const al = 1e-5 + hi * i / n, y = F(terms, al, 200);
      xs.push(al); ys.push(y);
      if (y < lo) lo = y; if (y > up) up = y;
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

    g.strokeStyle = this._css("--ink3"); g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(L + 0.5, T); g.lineTo(L + 0.5, T + ih); g.stroke(); g.setLineDash([]);

    g.strokeStyle = this._css("--blue"); g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
    xs.forEach((al, i) => (i ? g.lineTo(sx(al), sy(ys[i])) : g.moveTo(sx(al), sy(ys[i]))));
    g.stroke();

    if (a.status !== "unknown" && a.value < hi) {
      const X = sx(a.value), Y = sy(F(terms, a.value, 200));
      g.strokeStyle = this._css("--rust"); g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(X, Y); g.lineTo(X, T + ih); g.stroke(); g.setLineDash([]);
      g.fillStyle = this._css("--rust");
      g.beginPath(); g.arc(X, Y, 5, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
      g.font = "600 11px " + this._css("--mono");
      g.textAlign = X > L + iw * 0.7 ? "right" : "left"; g.textBaseline = "bottom";
      g.fillText("α_min = " + a.value.toFixed(5), X + (X > L + iw * 0.7 ? -8 : 8), Y - 8);
    }
    document.getElementById("potNote").textContent = a.status === "unknown"
      ? "No interior minimum: there is none to show."
      : "The dashed line at the origin is a branch point, not an ordinary critical point — which is "
      + "why the stationarity condition is a fixed point and not a root of a polynomial.";
  },

  _map(v, DATA) {
    const [g, W, H] = this._fit(document.getElementById("map"), 330);
    const L = 54, Rp = 16, T = 14, B = 34, iw = W - L - Rp, ih = H - T - B;
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const XM = 420, YM = 34;
    const sx = (t) => L + Math.min(t, XM) / XM * iw, sy = (k) => T + ih - Math.min(k, YM) / YM * ih;

    g.strokeStyle = "#eef3f6"; g.lineWidth = 1;
    g.font = "10px " + this._css("--mono"); g.fillStyle = this._css("--ink3");
    for (let i = 0; i <= 4; i++) {
      const Y = Math.round(T + ih * i / 4) + 0.5;
      g.beginPath(); g.moveTo(L, Y); g.lineTo(L + iw, Y); g.stroke();
      g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText(String(Math.round(YM * (1 - i / 4))), L - 7, Y);
    }
    g.textAlign = "center"; g.textBaseline = "top";
    for (let i = 0; i <= 4; i++) g.fillText(String(Math.round(XM * i / 4)), sx(XM * i / 4), T + ih + 6);
    g.fillText("A₄, the fourth moment", L + iw / 2, T + ih + 19);
    g.save(); g.translate(14, T + ih / 2); g.rotate(-Math.PI / 2);
    g.textBaseline = "top"; g.fillText("8D", 0, 0); g.restore();

    /* THE ADMISSIBLE LATTICE IS THE SEED'S.  On the seed as printed 8D is odd and A4 integral; on
     * the candidate 8D is even and A4 half-integral.  Both obey 8D = 2A4 + 3 (mod 6), which is the
     * one law drawn here -- the same code, two cosets. */
    const seed = v.get("seed").value;
    const oddSeed = seed.parity_of_8D === "odd";
    g.fillStyle = "rgba(27,111,140,.22)";
    for (let k = oddSeed ? 1 : 0; k <= YM; k += 2)
      for (let t2 = oddSeed ? 0 : 1; t2 <= 2 * XM; t2 += 2)
        if ((((k - t2 - 3) % 6) + 6) % 6 === 0) g.fillRect(sx(t2 / 2) - 0.6, sy(k) - 0.6, 1.2, 1.2);
    document.getElementById("mapNote").innerHTML = oddSeed
      ? `One integer point in six is admissible on this seed: 8D must be odd <b>and</b> 8D + A₄ ≡ 0 (mod 3).`
      : `On the candidate seed A₄ is half-integral and 8D even; the law 8D ≡ 2A₄ + 3 (mod 6) still ` +
        `picks one point in six, and the row 8D = 1 is not on the lattice at all.`;

    /* the levels: the physical ceiling filled, the attained one in the false-vacuum colour, the
     * relaxation's empty vertex hollow -- three points the draft drew as one */
    const C = DATA.ceilings;
    /* (212, 1) and (215, 1) are five pixels apart on this axis, and all three levels sit on the
     * bottom row -- so the labels are placed by hand: the physical ceiling reads to the LEFT of
     * its point, the other two stack upward to the right of theirs, and the empty vertex is a
     * ring around the attained one rather than a second dot under it. */
    const mark = (t, k, col, label, { hollow = false, dy = -3, align = "left", r = 6 } = {}) => {
      g.beginPath(); g.arc(sx(t), sy(k), r, 0, 7);
      if (hollow) { g.strokeStyle = col; g.lineWidth = 1.6; g.setLineDash([2, 2]); g.stroke(); g.setLineDash([]); }
      else { g.fillStyle = col; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke(); }
      g.font = "600 10.5px " + this._css("--mono"); g.fillStyle = col;
      /* `align` is a PREFERENCE and the plot box wins: see `fitLabelX`.  Drawn from the anchor
       * alone this printed "9.22 TeV . true vacuum" as "22 TeV . true vacuum", and the two
       * right-hand levels ran off the other edge. */
      g.textAlign = "left"; g.textBaseline = "bottom";
      g.fillText(label, fitLabelX(sx(t), g.measureText(label).width, L, L + iw, align), sy(k) + dy);
    };
    if (C && oddSeed) {
      mark(C.relaxation.A4, C.relaxation["8D"], this._css("--ink3"),
           `${(C.relaxation.GeV / 1000).toFixed(2)} · relaxation, empty`, { hollow: true, r: 10, dy: -19 });
      mark(C.attained.A4, C.attained["8D"], this._css("--rust"),
           `${(C.attained.GeV / 1000).toFixed(2)} · attained, false vacuum`, { dy: -5 });
      /* ITS OWN ROW.  This one and `attained` were both at dy -5, kept apart only by sitting on
       * opposite sides of their dots -- and once the ceiling label was clamped back inside the box
       * (it used to print as "22 TeV", sheared) the two met in the middle.  Three levels, three
       * rows: -33, -19, -5, read top to bottom. */
      mark(C.true_vacuum.A4, C.true_vacuum["8D"], this._css("--amber"),
           `${(C.true_vacuum.GeV / 1000).toFixed(2)} TeV · true vacuum`, { align: "right", dy: -33 });
    } else if (C) {
      const S = DATA.gauge_seeds.candidate;
      mark(S.ceiling_A4, S.ceiling_8D, this._css("--ink3"),
           `${(S.ceiling_GeV / 1000).toFixed(2)} · relaxation, this seed`, { hollow: true, r: 10, align: "right", dy: -8 });
    } else {
      mark(DATA.constants.ceiling_A4, DATA.constants.ceiling_8D, this._css("--amber"),
           `the ceiling, ${(DATA.constants.ceiling_GeV / 1000).toFixed(2)} TeV`);
    }

    const A4 = v.get("A4").value, D8 = v.get("D8").value;
    if (A4 <= XM && D8 <= YM && D8 > 0) {
      g.fillStyle = this._css("--green");
      g.beginPath(); g.arc(sx(A4), sy(D8), 7, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
      g.fillStyle = this._css("--green"); g.textAlign = "center"; g.textBaseline = "top";
      g.fillText(`(${A4}, ${D8})`, sx(A4), sy(D8) + 10);
    } else {
      g.fillStyle = this._css("--ink3"); g.font = "11px " + this._css("--mono");
      g.textAlign = "left"; g.textBaseline = "top";
      g.fillText(`this content sits at (${A4}, ${D8}) — beyond the panel`, L + 8, T + 8);
    }
  },

  /* ---------------------------------------------------------------- the surface, hand-projected
   * Canvas 2D and a painter's algorithm, in the house manner: no library, no WebGL, and it works
   * from file:// like everything else here.  The height is identity (II) evaluated on the lattice,
   * which is the whole point -- once m_h is pinned there is nothing left to minimise, so the
   * hierarchy IS a surface over the two moments rather than the output of a search. */
  _surface(v, model, DATA) {
    const [g, W, H] = this._fit(document.getElementById("srf"), 360);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const c = model.conventions, mW = c.m_W, g4 = c.g4, mhTop = c.mh_window[1];

    /* 8D on a log axis: the whole structure lives at small D and a linear axis drowns it.  The
     * height is the kernel's identity (II) -- the same function the harness checks the archived
     * levels against, so the picture cannot drift from the numbers. */
    const TMAX = 420, KMAX = 27, NX = 26, NY = 18;
    const kOf = (j) => Math.exp(Math.log(1) + (Math.log(KMAX) - Math.log(1)) * j / NY);
    const tOf = (i) => TMAX * i / NX;
    const zOf = (t, k) => surfaceInvR5({ A4: t, D8: k }, mhTop, mW, g4) / 1000;   /* TeV */

    let zmax = 0;
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++)
      zmax = Math.max(zmax, zOf(tOf(i), kOf(j)));
    const ZC = Math.min(zmax, 11);

    /* an isometric-ish projection, tilted so the ridge faces the reader */
    const cx = W * 0.5, cy = H * 0.80, sx = W * 0.0122, sy = H * 0.0165, sz = H * 0.0235;
    const P = (t, k, z) => {
      const u = t / TMAX * 2 - 1, w = Math.log(k) / Math.log(KMAX) * 2 - 1;
      return [cx + (u - w) * 0.86 * W * 0.30, cy - (u + w) * 0.34 * H * 0.30 - z * sz * 1.05];
    };
    const shade = (h) => {
      const f = Math.max(0, Math.min(1, h / ZC));
      const r = Math.round(234 - 200 * f), gg = Math.round(242 - 150 * f), b = Math.round(250 - 90 * f);
      return `rgb(${r},${gg},${b})`;
    };

    /* back to front: larger (i+j) is nearer the viewer under this projection */
    const quads = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) quads.push([i, j]);
    quads.sort((A, B) => (A[0] + A[1]) - (B[0] + B[1]));
    for (const [i, j] of quads) {
      const t0 = tOf(i), t1 = tOf(i + 1), k0 = kOf(j), k1 = kOf(j + 1);
      const pts = [P(t0, k0, zOf(t0, k0)), P(t1, k0, zOf(t1, k0)),
                   P(t1, k1, zOf(t1, k1)), P(t0, k1, zOf(t0, k1))];
      g.beginPath();
      pts.forEach((p, n) => (n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath();
      g.fillStyle = shade((zOf(t0, k0) + zOf(t1, k1)) / 2);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 0.6; g.stroke();
    }

    const stem = (t, k, col, label) => {
      const z = zOf(t, k), a = P(t, k, 0), b = P(t, k, z);
      g.strokeStyle = col; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      g.fillStyle = col;
      g.beginPath(); g.arc(b[0], b[1], 5.5, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
      if (label) {
        g.fillStyle = col; g.font = "600 10.5px " + this._css("--mono");
        g.textAlign = "center"; g.textBaseline = "bottom";
        g.fillText(label, b[0], b[1] - 9);
      }
      return z;
    };

    const C = DATA.ceilings;
    if (C) {
      stem(C.attained.A4, C.attained["8D"], this._css("--rust"),
           `${(C.attained.GeV / 1000).toFixed(2)}`);
      stem(C.true_vacuum.A4, C.true_vacuum["8D"], this._css("--amber"),
           `${(C.true_vacuum.GeV / 1000).toFixed(2)} TeV`);
    } else {
      stem(DATA.constants.ceiling_A4, DATA.constants.ceiling_8D, this._css("--amber"),
           `${(DATA.constants.ceiling_GeV / 1000).toFixed(2)} TeV`);
    }

    const A4 = v.get("A4").value, D8 = v.get("D8").value;
    if (D8 > 0 && A4 >= 0 && A4 <= TMAX && D8 <= KMAX)
      stem(A4, D8, this._css("--green"), `${(zOf(A4, D8)).toFixed(2)} TeV`);

    g.fillStyle = this._css("--ink3"); g.font = "10px " + this._css("--mono");
    g.textAlign = "left"; g.textBaseline = "top";
    g.fillText("A₄ →", W * 0.70, H * 0.90);
    g.textAlign = "right";
    g.fillText("← 8D (log)", W * 0.30, H * 0.90);
    g.fillText(`height: 1/R₅ at m_h = ${mhTop} GeV, identity (II)`, W * 0.30, H * 0.02);
  },
};

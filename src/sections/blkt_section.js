/* blkt_section.js — "Brane kinetic terms": a worked demonstration you can turn the dial on.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT THIS SECTION IS FOR, AND IT IS NOT THE SAME AS THE OTHERS.  Every other section answers a
 * question about a model.  This one answers a question about the INSTRUMENT: what does a
 * brane-localized kinetic term do, how does the machinery compute it, and why should you believe
 * the answer?  It is a demonstration, run live, on the paper's own numbers.
 *
 * FOUR STEPS, and the third is the one that earns the first two.
 *
 *   1  the mass equation.  With no BLKT the Kaluza-Klein masses are the POLES of Haba-Yamashita's
 *      summand; turn c on and the roots slide off them.  Drawn, so the mechanism is visible rather
 *      than asserted.
 *   2  the tower.  The same thing read as a spectrum: free levels against BLKT levels, with the
 *      drift between them.
 *   3  the check.  Akamatsu, Hirose, Maru and Nago's (3.22), solved numerically here, has to
 *      reproduce their (5.19) -- an equation six pages later in the same paper, which we did not
 *      put in the same place.  Computed in the page, live, with the error falling like alpha^2.
 *   4  what it buys.  Their own route: c lifts the compactification scale, and the numbers are
 *      derived from (5.19) rather than quoted.
 *
 * EVERY NUMBER ON THIS PAGE IS COMPUTED HERE.  Nothing is read from an archive, so there is no
 * archive to go stale; `_test_blkt.mjs` holds the kernel to mpmath and to the c -> 0 limit, and
 * `build/drive.mjs` presses the buttons.
 *
 * AND THE SCOPE IS ON THE PAGE, not in a footnote: one localized coefficient, not a distribution
 * (we proved the sum does not determine the tower); and the single-sector potential, not their
 * full (4.3), which needs a field content this module does not carry.
 */
const BLK_S = { c: 4, m: 1, q: 0, a1: 0.44, a2: 0.30, step: 0, running: false };

/* THEIR PAPER PRINTS TWO MINIMA, ONE PER VALUE OF c, AND THEY ARE NOT INTERCHANGEABLE.  Reading
 * the c = 0 minimum at c = 15 gives 1213 GeV and is simply the wrong pairing; `build/drive.mjs`
 * caught this page doing exactly that, against the archived gate that had already measured it.
 *
 *   arXiv:2312.08608 eq. (4.4)            1/R = 303 GeV, the published scale with no brane term
 *   arXiv:2603.05857 p. 16, text          the minimum is (0.438, 0.299)   -- at c = 0
 *   arXiv:2603.05857 Fig. 1 caption       (0.44, 0.30) at c = 0 and (0.46, 0.30) at c = 15
 *   arXiv:2603.05857 p. 21, text          "c = 15 and the compactification scale becomes 1.4 TeV"
 *
 * Every number in step 4 is (5.19) evaluated here, not quoted: 1/R = 2 M_W sqrt(1+c) / |alpha|. */
const BLK_MW = 80.4;                              /* GeV, the value written into their own (5.19) */
const BLK_MIN0 = { a1: 0.438, a2: 0.299 };        /* p. 16 text, c = 0 */
const BLK_MIN15 = { a1: 0.46, a2: 0.30 };         /* Fig. 1 caption, c = 15 */
const BLK_LADDER_BEST = 464;      /* GeV, best point of the whole symmetric-rank ladder, measured */

const BLKT_SECTION = {
  id: "blkt",
  label: "Brane kinetic terms",
  paper: "Haba–Yamashita 2004 · AHMN 2026",
  ready: true,

  /* EMPTY, AND SAID SO.  Nothing here goes through the shell's resolver: the dial below is the
   * model.  `_test_app.mjs` allows `modules: []` only for a section that also declares `holds()`,
   * which is the right coupling -- a section that computes nothing through the shell has to say
   * what it does stand on, or the header lies about what is on screen. */
  modules: [],

  /* it carries its own dial and takes nothing from the shell's model */
  holds() { return "this section demonstrates the machinery, on the paper's own numbers"; },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Put an extra kinetic term <b>on the fixed points</b> and the Kaluza–Klein masses
    stop being <span style="font-family:var(--mono)">n/R</span>. They become the roots of a
    transcendental equation, the sum over the tower diverges, and the potential has to be built from
    the roots instead of written down. This page does that in front of you.</p>
    <div class="note" style="margin-top:9px">It matters because it is the live route. Akamatsu,
    Hirose, Maru and Nago's 2023 model sits at a compactification scale of about 303 GeV, too low to
    be viable; their 2026 paper turns brane terms on and lifts it. We measured the alternative — the
    whole symmetric-rank ladder of their 2023 paper — and its best point is
    <b>${BLK_LADDER_BEST} GeV</b>. They were right to change route.</div>
    <div style="display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap">
      <button id="bkDemo">▶ run the demonstration</button>
      <span class="note" id="bkBusy"></span>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <label class="note">brane coefficient <b>c</b>
        <input type="range" id="bkC" min="0" max="30" step="0.1" style="vertical-align:middle">
        <span style="font-family:var(--mono)" id="bkCv">—</span></label>
      <label class="note">α₁ <input type="range" id="bkA1" min="0" max="1" step="0.01"
        style="vertical-align:middle;width:110px"><span style="font-family:var(--mono)" id="bkA1v">—</span></label>
      <label class="note">α₂ <input type="range" id="bkA2" min="0" max="1" step="0.01"
        style="vertical-align:middle;width:110px"><span style="font-family:var(--mono)" id="bkA2v">—</span></label>
      <label class="note">m <input type="number" id="bkM" min="1" max="4" step="1" style="width:52px"></label>
      <label class="note">q <input type="number" id="bkQ" min="0" max="1" step="1" style="width:52px"></label>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px" id="bkStep1">
    <h2>1 · The mass equation, and where its roots come from</h2>
    <p class="note">The curve is <span style="font-family:var(--mono)">F(x) = 1 − cπx²S<sub>reg</sub>(x)</span>,
    their (3.19) with the sum regulated by (3.21). The grey verticals are the <b>poles</b> of the
    summand — and at <b>c = 0</b> the poles <i>are</i> the spectrum. Turn c up and each root slides
    off its pole.</p>
    <canvas id="bkEq" width="720" height="280"></canvas>
    <div class="legend" id="bkEqLeg"></div>
    <div class="note" style="margin-top:9px" id="bkEqNote">—</div>
  </div>

  <div class="card" style="margin-bottom:18px" id="bkStep2">
    <h2>2 · The same thing read as a spectrum</h2>
    <canvas id="bkTower" width="720" height="200"></canvas>
    <div class="legend" id="bkTowerLeg"></div>
    <div style="overflow-x:auto;margin-top:10px"><table><thead><tr>
      <th class="num">k</th><th class="num">free x</th><th class="num">with BLKT</th>
      <th class="num">drift</th></tr></thead><tbody id="bkTowerTab"></tbody></table></div>
  </div>

  <div class="card" style="margin-bottom:18px" id="bkStep3">
    <h2>3 · The check that earns the rest</h2>
    <p class="note">Their <b>(3.22)</b> is an approximation they derive on p. 10 to test their own
    regularization. Solved for α ∼ x ≪ 1 it collapses to
    <span style="font-family:var(--mono)">x = m|α| / (2√(1+c))</span> — which at m = 1 is their
    <b>(5.19)</b>, <span style="font-family:var(--mono)">M<sub>W</sub>² = (α₁²+α₂²)/(4(1+c)R²)</span>,
    on p. 20. Two equations ten pages apart. The table solves the first numerically and compares
    with the second; the error must fall like <b>α²</b>, because that is what a leading order does
    and what a coincidence does not.</p>
    <div style="overflow-x:auto"><table><thead><tr>
      <th class="num">c</th><th class="num">|α|</th><th class="num">(3.22) solved</th>
      <th class="num">(5.19) closed form</th><th class="num">relative error</th>
      </tr></thead><tbody id="bkJoin"></tbody></table></div>
    <div class="verdict stable" id="bkJoinV" style="margin-top:12px"><b>—</b><span>—</span></div>
  </div>

  <div class="card" style="margin-bottom:18px" id="bkStep4">
    <h2>4 · What it buys, in their own numbers</h2>
    <div style="overflow-x:auto"><table><thead><tr>
      <th>route</th><th class="num">c</th><th class="num">1/R</th><th>where it comes from</th>
      </tr></thead><tbody id="bkScale"></tbody></table></div>
    <div class="note" style="margin-top:10px" id="bkScaleNote">—</div>
  </div>

  <div class="card">
    <h2>What this page does not compute</h2>
    <ul class="note" style="margin:0;padding-left:18px">
      <li>One localized coefficient, <b>not a distribution</b>. We proved separately that
        <span style="font-family:var(--mono)">c = Σᵢcᵢ</span> does not determine the tower: two
        distributions with the same total give different spectral determinants, different poles and
        different residues. So <b>c</b> here is their §3 single-brane case and nothing wider.</li>
      <li>One sector <span style="font-family:var(--mono)">(m, q)</span>. Their full effective
        potential (4.3) sums over every field with its multiplicity and its own (m, q) assignment,
        which is their §4 and is not implemented here.</li>
      <li>The scale numbers in step 4 are <b>their equation evaluated at their minimum</b>, not a
        minimization of ours.</li>
    </ul>
  </div>`,

  /* THE PERMALINK, and it is the reason this section exists in the shape it does.
   *
   * A demonstration that cannot be sent is a demonstration nobody sees.  This encodes the dial so a
   * link opens on exactly the model and coefficient it was left at -- their (m, q), their minimum,
   * their c -- and a reader can move it themselves rather than take a sentence on trust.
   *
   * Only what differs from the default travels, the same rule the seed and the brane follow: a link
   * should say what was chosen, not restate the defaults. */
  encodeState() {
    const d = { c: 4, m: 1, q: 0, a1: 0.44, a2: 0.30 };
    const p = [];
    for (const k of ["c", "m", "q", "a1", "a2"])
      if (Math.abs(BLK_S[k] - d[k]) > 1e-12) p.push(`${k}:${BLK_S[k]}`);
    /* A COMMA, NOT A PIPE, AND A MAIL CLIENT IS THE REASON.  A link with `|` in it goes into an
     * e-mail as %7C, and Gmail re-encodes that and wraps the whole address in a google.com/url
     * redirect with tracking parameters -- which resolves correctly and looks like surveillance.
     * A link one sends to strangers should survive being sent.  Every value here is a number, so
     * a comma is unambiguous; `decodeState` still accepts the pipe, because links already exist. */
    return p.join(",");
  },

  decodeState(v) {
    Object.assign(BLK_S, { c: 4, m: 1, q: 0, a1: 0.44, a2: 0.30 });
    if (!v) return;
    for (const tok of String(v).split(/[|,]/)) {
      const i = tok.indexOf(":");
      if (i < 0) continue;
      const k = tok.slice(0, i), x = Number(tok.slice(i + 1));
      if (!Number.isFinite(x)) continue;
      /* clamped to what the dial can express, so a hand-edited link cannot put the page in a state
       * the controls cannot get back out of */
      if (k === "c") BLK_S.c = Math.min(30, Math.max(0, x));
      else if (k === "m") BLK_S.m = Math.min(4, Math.max(1, Math.round(x)));
      else if (k === "q") BLK_S.q = x >= 0.5 ? 1 : 0;
      else if (k === "a1") BLK_S.a1 = Math.min(1, Math.max(0, x));
      else if (k === "a2") BLK_S.a2 = Math.min(1, Math.max(0, x));
    }
  },

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    const bind = (id, key, cast = Number) => {
      $(id).oninput = () => { BLK_S[key] = cast($(id).value); ctx.refresh(); };
    };
    bind("bkC", "c"); bind("bkA1", "a1"); bind("bkA2", "a2");
    bind("bkM", "m"); bind("bkQ", "q");
    $("bkDemo").onclick = () => this._demo(ctx);
  },

  /* THE DEMONSTRATION.  A newcomer should not have to know which dial to turn: pressing one button
   * walks c from 0 up, so the mechanism of step 1 and the drift of step 2 are seen happening rather
   * than inferred from a static picture.  It restores the dial afterwards. */
  _demo(ctx) {
    if (BLK_S.running) return;
    const $ = (id) => document.getElementById(id);
    const was = BLK_S.c;
    BLK_S.running = true;
    const stops = [0, 0.5, 1, 2, 4, 8, 15, 25];
    let i = 0;
    const tick = () => {
      if (i >= stops.length) {
        BLK_S.running = false;
        BLK_S.c = was;
        $("bkBusy").textContent = "";
        ctx.refresh();
        return;
      }
      BLK_S.c = stops[i];
      $("bkBusy").textContent = `c = ${stops[i]}  (${i + 1} of ${stops.length})`;
      ctx.refresh();
      i++;
      setTimeout(tick, 620);
    };
    tick();
  },

  /* WHAT THIS SECTION EXPORTS.
   *
   * A reader who has moved the dial is precisely the reader who wants to take the model with them,
   * so the LaTeX button has to work here -- and it can only do that by handing over THIS model.
   * The shell's card is about the family's SU(3), which is not what is on screen.
   *
   * There is no `terms` and therefore no displayed equation: with a brane term the potential is
   * not a table of cosines but an integral over the roots of a transcendental equation, so what
   * travels is the model, its spectrum, and the free tower beside it. Writing a cosine sum here
   * would be exporting the wrong object in a convincing format.
   */
  texExport() {
    const o = this._opts();
    const free = blktFreeTower(o.m, o.q, o.alpha1, o.alpha2).filter((v) => v > 1e-9);
    const got = o.c > 0 ? blktRoots(o, { count: 6, xMax: 2.4 }).roots : free.slice(0, 6);
    const four = (a) => a.slice(0, 4).map((v) => v.toFixed(6)).join(", ");

    const values = {
      brane_coefficient: val(o.c, { status: STATUS.MEASURED,
        source: "the dial; one localized term, their section 3 case" }),
      sector: val(`(m, q) = (${o.m}, ${o.q})`, { status: STATUS.THEOREM,
        source: "the twist labels of Akamatsu-Hirose-Maru-Nago eq. (3.19)" }),
      wilson_phases: val(`(${o.alpha1.toFixed(2)}, ${o.alpha2.toFixed(2)})`,
        { status: STATUS.MEASURED, source: "the dial" }),
      free_tower: val(four(free), { status: STATUS.THEOREM,
        source: "closed form, from the poles of the summand of eq. (3.20)" }),
      blkt_spectrum: val(four(got), { status: STATUS.MEASURED,
        source: "roots of eq. (3.19) regulated by eq. (3.21), bracketed by the poles" }),
      potential: unknown("with a brane term the potential is an integral over these roots, " +
                         "eq. (4.2), and is not a closed-form sum this export can carry"),
      scale: unknown("no absolute scale without an anchor: this is a shape, not a prediction"),
    };

    return {
      card: makeCard({ group: "su3_hy", section: "blkt", c: o.c, m: o.m, q: o.q,
                       alpha: [o.alpha1, o.alpha2] }, values, { version: VERSION, build: BUILD }),
      mathKeys: ["sector"],
      caption: `A Kaluza-Klein tower with a brane localized kinetic term of coefficient ` +
               `$c = ${o.c}$, in the sector $(m, q) = (${o.m}, ${o.q})$ at ` +
               `$(\\alpha_1, \\alpha_2) = (${o.alpha1.toFixed(2)}, ${o.alpha2.toFixed(2)})$. ` +
               `Masses are $x = RM$, the roots of the quantization condition of ` +
               `Akamatsu, Hirose, Maru and Nago.`,
    };
  },

  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  _opts() {
    return { m: BLK_S.m, q: BLK_S.q, alpha1: BLK_S.a1, alpha2: BLK_S.a2, c: BLK_S.c, N: 200 };
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    $("bkC").value = BLK_S.c; $("bkCv").textContent = BLK_S.c.toFixed(1);
    $("bkA1").value = BLK_S.a1; $("bkA1v").textContent = BLK_S.a1.toFixed(2);
    $("bkA2").value = BLK_S.a2; $("bkA2v").textContent = BLK_S.a2.toFixed(2);
    $("bkM").value = BLK_S.m; $("bkQ").value = BLK_S.q;

    const o = this._opts();
    const free = blktFreeTower(o.m, o.q, o.alpha1, o.alpha2).filter((v) => v > 1e-9 && v <= 2.4);
    const got = BLK_S.c > 0 ? blktRoots(o, { count: 6, xMax: 2.4 }).roots : free.slice(0, 6);

    this._equation(o, free, got);
    this._tower(free, got);
    this._join();
    this._scale();
  },

  /* ---------------------------------------------------------------- step 1 */

  _equation(o, free, roots) {
    const c = document.getElementById("bkEq");
    const W = c.clientWidth || 720, H = 280, d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = this._css("--card") || "#fff"; g.fillRect(0, 0, W, H);

    const x0 = 44, x1 = W - 12, y0 = 12, y1 = H - 26;
    const XM = 2.4;
    const X = (x) => x0 + x / XM * (x1 - x0);
    /* A COMPRESSED VERTICAL AXIS, and not a clipped one.  F runs to infinity at every pole, so
     * clamping it to a box draws the plateaus as flat tops: the first version of this panel was a
     * row of rectangles with the curve invisible between them.  asinh is odd, linear near zero --
     * where the roots are, and where the reader is looking -- and logarithmic far out, so the
     * divergence is shown as a divergence instead of as a wall.  The axis label says so, because
     * an unlabelled non-linear axis is a way of being wrong quietly. */
    const YM = Math.asinh(2000);
    const Y = (v) => (y0 + y1) / 2 - Math.asinh(v) / YM * (y1 - y0) / 2;

    /* the poles first, so the curve is drawn over them */
    g.strokeStyle = this._css("--line"); g.lineWidth = 1;
    for (const p of free) {
      g.beginPath(); g.moveTo(X(p), y0); g.lineTo(X(p), y1); g.stroke();
    }
    /* axes */
    g.strokeStyle = this._css("--ink3"); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, Y(0)); g.lineTo(x1, Y(0)); g.stroke();
    g.fillStyle = this._css("--ink3");
    g.font = "10.5px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = "center"; g.textBaseline = "top";
    for (let t = 0; t <= XM + 1e-9; t += 0.4) g.fillText(t.toFixed(1), X(t), y1 + 5);
    g.fillText("x = R·M", (x0 + x1) / 2, y1 + 17);
    /* AN UNLABELLED NON-LINEAR AXIS IS A WAY OF BEING WRONG QUIETLY, so it says what it is. */
    g.save();
    g.translate(11, (y0 + y1) / 2); g.rotate(-Math.PI / 2);
    g.textAlign = "center"; g.textBaseline = "top";
    g.fillText("asinh F(x) — compressed, not clipped", 0, 0);
    g.restore();

    /* the curve, broken at each pole so a vertical stroke is not drawn across the plot, and
     * CLIPPED to the plot box so the near-vertical runs beside a pole do not spill into the band
     * where the tick labels live and scribble over the numbers */
    if (BLK_S.c > 0) {
      g.save();
      g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
      g.strokeStyle = this._css("--blue") || "#2b6cb0"; g.lineWidth = 1.6;
      const edges = [0, ...free, XM];
      for (let i = 0; i + 1 < edges.length; i++) {
        const a = edges[i] + 1e-4, b = edges[i + 1] - 1e-4;
        if (b <= a) continue;
        g.beginPath();
        let started = false;
        for (let k = 0; k <= 160; k++) {
          const x = a + (b - a) * k / 160;
          const v = blktMassEq(x, o);
          if (!Number.isFinite(v)) { started = false; continue; }
          const py = Y(v);
          if (!started) { g.moveTo(X(x), py); started = true; } else g.lineTo(X(x), py);
        }
        g.stroke();
      }
      g.restore();
    }

    /* the zero line again, over the curve: it is what a root IS, so it must not be hidden by one */
    g.strokeStyle = this._css("--ink3"); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, Y(0)); g.lineTo(x1, Y(0)); g.stroke();

    /* the roots */
    g.fillStyle = this._css("--rust") || "#b45309";
    for (const r of roots) {
      if (r > XM) continue;
      g.beginPath(); g.arc(X(r), Y(0), 4.5, 0, 7); g.fill();
    }

    document.getElementById("bkEqLeg").innerHTML =
      `<span><i style="background:${this._css("--line")}"></i>poles of the summand — the spectrum at c = 0</span>` +
      `<span><i style="background:${this._css("--blue")}"></i>F(x) = 1 − cπx²S<sub>reg</sub>(x)</span>` +
      `<span><i style="background:${this._css("--rust")}"></i>its roots — the spectrum with BLKT</span>`;
    document.getElementById("bkEqNote").innerHTML = BLK_S.c === 0
      ? `At <b>c = 0</b> there is no curve to draw: F ≡ 1, and the spectrum is the poles themselves. `
        + `That is the limit <span style="font-family:var(--mono)">_test_blkt.mjs</span> checks against `
        + `a closed form, and it is what says the machinery is the paper's.`
      : `At <b>c = ${BLK_S.c.toFixed(1)}</b> each root has moved off its pole. As c → 0 the root `
        + `returns to the pole faster than any grid can follow — which is why the solver brackets `
        + `<i>by</i> the poles rather than scanning for sign changes.`;
  },

  /* ---------------------------------------------------------------- step 2 */

  _tower(free, roots) {
    const c = document.getElementById("bkTower");
    const W = c.clientWidth || 720, H = 200, d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = this._css("--card") || "#fff"; g.fillRect(0, 0, W, H);

    const XM = 2.4, x0 = 44, x1 = W - 12, yF = 62, yB = 138;
    const X = (x) => x0 + x / XM * (x1 - x0);

    g.font = "11px ui-monospace,Menlo,Consolas,monospace";
    g.fillStyle = this._css("--ink3"); g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("free", 6, yF); g.fillText("BLKT", 6, yB);

    g.strokeStyle = this._css("--ink3"); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, yF); g.lineTo(x1, yF); g.stroke();
    g.beginPath(); g.moveTo(x0, yB); g.lineTo(x1, yB); g.stroke();

    for (const p of free) {
      if (p > XM) continue;
      g.strokeStyle = this._css("--line2") || this._css("--ink3"); g.lineWidth = 2;
      g.beginPath(); g.moveTo(X(p), yF - 12); g.lineTo(X(p), yF + 12); g.stroke();
    }
    g.strokeStyle = this._css("--rust") || "#b45309"; g.lineWidth = 2;
    for (const r of roots) {
      if (r > XM) continue;
      g.beginPath(); g.moveTo(X(r), yB - 12); g.lineTo(X(r), yB + 12); g.stroke();
    }
    /* the drift, drawn as the connector it is */
    g.strokeStyle = this._css("--ink3"); g.lineWidth = 1; g.setLineDash([3, 3]);
    for (let i = 0; i < roots.length && i < free.length; i++) {
      if (free[i] > XM || roots[i] > XM) continue;
      g.beginPath(); g.moveTo(X(free[i]), yF + 13); g.lineTo(X(roots[i]), yB - 13); g.stroke();
    }
    g.setLineDash([]);

    document.getElementById("bkTowerLeg").innerHTML =
      `<span><i style="background:${this._css("--ink3")}"></i>free tower, from the poles in closed form</span>` +
      `<span><i style="background:${this._css("--rust")}"></i>with the brane term</span>`;

    const rows = [];
    for (let i = 0; i < Math.min(6, free.length); i++) {
      const r = roots[i];
      rows.push(`<tr><td class="num">${i}</td><td class="num">${free[i].toFixed(6)}</td>` +
                `<td class="num">${r === undefined ? "—" : r.toFixed(6)}</td>` +
                `<td class="num">${r === undefined ? "—" : (r - free[i]).toFixed(6)}</td></tr>`);
    }
    document.getElementById("bkTowerTab").innerHTML = rows.join("");
  },

  /* ---------------------------------------------------------------- step 3 */

  _join() {
    const rows = [], errs = [];
    for (const c of [0.5, 2, 15]) {
      for (const A of [0.02, 0.005, 0.001]) {
        const o = { m: 1, q: 0, alpha1: 0.8 * A, alpha2: 0.6 * A, c };
        const got = blktApproxRoot(o), want = blktScaleFormula(o);
        const rel = got === null ? NaN : Math.abs(got - want) / want;
        if (c === 15) errs.push(rel);
        rows.push(`<tr><td class="num">${c}</td><td class="num">${A}</td>` +
                  `<td class="num">${got === null ? "—" : got.toExponential(6)}</td>` +
                  `<td class="num">${want.toExponential(6)}</td>` +
                  `<td class="num">${Number.isNaN(rel) ? "—" : rel.toExponential(2)}</td></tr>`);
      }
    }
    document.getElementById("bkJoin").innerHTML = rows.join("");

    const r1 = errs[0] / errs[1], r2 = errs[1] / errs[2];
    const quad = r1 > 8 && r1 < 32 && r2 > 12 && r2 < 50;
    const v = document.getElementById("bkJoinV");
    v.className = "verdict " + (quad ? "stable" : "unstable");
    v.innerHTML = `<b>${quad ? "the two equations meet" : "they do not meet"}</b>` +
      `<span>Shrinking |α| by 4 divides the error by <b>${r1.toFixed(0)}</b> and by 5 divides it ` +
      `by <b>${r2.toFixed(0)}</b> — against 16 and 25 for a genuine α². A fit that merely agreed ` +
      `would agree equally well at every α.</span>`;
  },

  /* ---------------------------------------------------------------- step 4 */

  _scale() {
    /* (5.19) solved for the compactification scale: 1/R = 2 M_W sqrt(1+c) / |alpha| */
    const oneOverR = (a1, a2, c) => 2 * BLK_MW * Math.sqrt(1 + c) / Math.hypot(a1, a2);
    const at0 = oneOverR(BLK_MIN0.a1, BLK_MIN0.a2, 0);
    const at15 = oneOverR(BLK_MIN15.a1, BLK_MIN15.a2, 15);
    /* the same equation with alpha_2 dropped, which is what reproduces the number they printed */
    const dropA2 = oneOverR(BLK_MIN15.a1, 0, 15);
    const here = oneOverR(BLK_S.a1, BLK_S.a2, BLK_S.c);

    const gev = (v) => v < 1000 ? v.toFixed(1) + " GeV" : (v / 1000).toFixed(3) + " TeV";
    const row = (what, c, v, why) =>
      `<tr><td>${what}</td><td class="num">${c}</td><td class="num">${gev(v)}</td>` +
      `<td class="note">${why}</td></tr>`;

    document.getElementById("bkScale").innerHTML = [
      row("no brane term", 0, at0,
          "their minimum (0.438, 0.299) from p. 16 — this is their 2023 paper's published 303 GeV, " +
          "recomputed rather than quoted"),
      row("the symmetric-rank ladder", "—", BLK_LADDER_BEST,
          "the best point of the whole ladder, measured by us — the route they did not take"),
      row("brane terms", 15, at15,
          "their own c = 15 minimum (0.46, 0.30), from the caption of their Fig. 1"),
      row("...with α₂ dropped", 15, dropA2,
          "the same equation, α₁ = 0.46 alone — not a route, a diagnosis"),
      row("the dial, right now", BLK_S.c.toFixed(1), here,
          `live, at the (α₁, α₂) = (${BLK_S.a1.toFixed(2)}, ${BLK_S.a2.toFixed(2)}) set above`),
    ].join("");

    document.getElementById("bkScaleNote").innerHTML =
      `Their p. 21 reads <i>“c ≃ 15 and the compactification scale becomes 1.4 TeV”</i>. ` +
      `Eq. (5.19) at their c = 15 minimum (0.46, 0.30) gives <b>${at15.toFixed(1)} GeV</b>; the ` +
      `same equation with α₁ alone gives <b>${(dropA2 / 1000).toFixed(3)} TeV</b>. The equation ` +
      `and both minima are theirs and the arithmetic is on this page, so the dial is here to be ` +
      `moved rather than believed. ` +
      /* WHAT THIS ROW IS AND IS NOT.  Which published minimum belongs with which value of c is
       * not something we could settle from their text, and on 2026-08-30 we put exactly that
       * question to the authors.  Until they answer, this is a measurement of their equation and
       * not a claim about their paper -- and the page has to say so in the same words the letter
       * does, or it asserts in their absence more than we are willing to say to their faces. */
      `<b>Which of the two published minima belongs with which value of c we could not settle ` +
      `from the text</b>, and it is an open question we have put to the authors; until it is ` +
      `answered this row measures their equation rather than judging their paper. Note only that ` +
      `the two minima are not interchangeable: reading the (0.438, 0.299) of p. 16 at c = 15 ` +
      `gives ${oneOverR(BLK_MIN0.a1, BLK_MIN0.a2, 15).toFixed(0)} GeV, a third number belonging ` +
      `to neither.`;
  },
};

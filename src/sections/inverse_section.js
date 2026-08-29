/* inverse_section.js — "Design a scale": the map backwards, its certificates, and the gap.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Every other section of this family answers "given this content, what does the model say?".  This
 * one is the only one that runs the other way: name a compactification scale and it hands back a
 * bulk content, or a NAMED reason there is none.  That is Part VIII, and it is a different kind of
 * question — the ceiling is a bound, this is a SET.
 *
 * Two halves, and they are one interaction.  The axis at the top is the reachable set: the scales
 * the model can take fall in clusters, one per rung of the quantised curvature, and between the
 * rung-three and rung-one clusters there is a stretch of 2682 GeV with nothing in it.  Click
 * anywhere on that axis — inside a cluster or inside the gap — and the designer below is asked
 * about it.  Asking about the gap is how a reader sees a certificate rather than reads about one.
 *
 * WHAT IS COMPUTED HERE AND WHAT IS READ.  The decision at a rung is computed: the certificates,
 * the finite enumeration, and the exact-potential verification of whatever comes out.  The
 * clusters themselves are read — finding the floor of rung 1 means enumerating 423 631 contents
 * and minimising the exact potential on the survivors, which is a run and not a page.  The panel
 * says which is which, and `_test_inverse.mjs` holds the computed half to the read half.
 *
 * Edited BY HAND.
 */
let INV_L = null;                     /* the lattice, rebuilt whenever the gauge seed moves */
let INV_SEED = null;
const INV_S = {
  target: null,                       /* TeV; null = nothing asked yet */
  tolPct: 0.5,
  mhLo: 125.0, mhHi: 127.0,
  needW: true,
  result: null, asked: null, busy: false,
  probe: null,                        /* {A4, k8D} for the direct lattice probe */
  points: null,                       /* k8D -> the resolved point set of that rung */
};

/* WHICH RUNGS A PAGE CAN RESOLVE.  Rung one is 423 631 contents and takes a fifth of a second;
 * rung three is 3.9 million and takes under two.  Rungs five and seven are 15.8 and 48.9 million
 * and are past any browser, so they are NOT attempted and the panel says their bar is still the
 * minimum and maximum of a set nobody resolved here — rather than quietly drawing four bars as
 * though they were all the same kind of object. */
const INV_RESOLVABLE = 4000000;

const INVERSE_SECTION = {
  id: "inverse",
  label: "Design a scale",
  paper: "Part VIII",
  ready: true,
  modules: [...modules(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Part VII maximises and publishes a <b>ceiling</b>. Run the same map backwards
    and the question changes: <b>give me a content at this scale, or show me there is none</b>.
    The second question has an answer the first cannot see — the scales this model reaches are
    <b>finitely many</b>, they fall in clusters, and between two of them lies a stretch no content
    reaches at all.</p>
    <div class="note" style="margin-top:9px">Why "there is none" is decidable: of the eight
    generators <b>only 7(+,+) has A₄ = 0</b>. So at a fixed A₄ the other seven are bounded by A₄
    itself, and the multiplicity of 7(+,+) is then pinned by 8D — the only generator left that can
    move it. A rung is a <b>finite set</b>, and an empty search becomes a decision. The page
    derives that fact from the term tables rather than quoting it; if it ever failed, the panel at
    the bottom would say so.</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>The reachable set</h2>
    <canvas id="ivAxis" width="1200" height="230"></canvas>
    <div class="legend">
      <span><i style="background:var(--blue)"></i>a cluster: the scales that rung reaches</span>
      <span><i style="background:var(--green)"></i>…of which this much is a verified true vacuum</span>
      <span><i style="background:var(--rust)"></i>the gap — certified empty</span>
      <span><i style="background:var(--ink3)"></i>the rung's LP ceiling (a bound, not a content)</span>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
      <button id="ivResolve">▶ resolve the clusters into their points</button>
      <span class="note" id="ivResolveNote">A cluster is drawn as a bar, and a bar is a lie: a
      content fixes (A₄, 8D, G) and the two identities then fix <b>one</b> pair (1/R₅, m_h), so a
      rung's image is a <b>finite set</b>. This enumerates it.</span>
    </div>
    <div class="note" style="margin-top:9px" id="ivAxisNote">—</div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>Ask for a scale</h2>
        <div class="rowm">
          <span class="nm" style="flex:0;width:96px">1/R₅ (TeV)</span>
          <input id="ivTarget" type="text" size="7"
                 style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:88px">
          <span class="nm" style="flex:0">±</span>
          <input id="ivTol" type="text" size="4"
                 style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:56px">
          <span class="note" style="flex:1">per cent — or click the axis above</span>
        </div>
        <div class="rowm">
          <span class="nm" style="flex:0;width:96px">m_h window</span>
          <input id="ivMhLo" type="text" size="5"
                 style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:70px">
          <span class="nm" style="flex:0">…</span>
          <input id="ivMhHi" type="text" size="5"
                 style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:70px">
          <span class="note" style="flex:1">GeV — their own window</span>
        </div>
        <div class="rowm">
          <span class="nm" style="flex:0;width:96px">screen</span>
          <label style="font-size:13px;flex:1"><input type="checkbox" id="ivW"> require
            <span style="font-family:var(--mono)">W &gt; 0</span> before the exact potential is
            asked — a screen, not a certificate</label>
        </div>
        <div style="display:flex;gap:8px;margin-top:11px;align-items:center;flex-wrap:wrap">
          <button id="ivGo">▶ design it</button>
          <span class="note" id="ivBusy"></span>
        </div>
        <div class="verdict stable" id="ivVerdict" style="margin-top:13px"><b>—</b>
          <span>Nothing asked yet. Type a scale, or click the axis.</span></div>
        <div id="ivCerts" style="margin-top:12px"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The eight generators, and the one that makes this decidable</h2>
        <table><thead><tr><th>multiplet</th><th class="num">A₄</th><th class="num">8D</th>
          <th class="num">G</th><th class="num">2W</th></tr></thead>
          <tbody id="ivLattice"></tbody></table>
        <div class="note" style="margin-top:9px" id="ivLatticeNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>Probe one lattice point</h2>
        <p class="note" style="margin:0 0 10px">The designer walks rungs the cone and the
        congruence have already passed, so it never issues those two. Ask about a point directly
        and it will.</p>
        <div id="ivProbeCtl">
          <div class="rowm">
            <span class="nm" style="flex:1">A₄</span>
            <button class="st" data-p="A4" data-d="-1">−</button>
            <span class="cnt" id="ivPA4">—</span>
            <button class="st" data-p="A4" data-d="1">+</button>
          </div>
          <div class="rowm">
            <span class="nm" style="flex:1">8D</span>
            <button class="st" data-p="k8D" data-d="-2">−</button>
            <span class="cnt" id="ivPK">—</span>
            <button class="st" data-p="k8D" data-d="2">+</button>
          </div>
        </div>
        <div class="verdict stable" id="ivProbe" style="margin-top:11px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What each certificate means</h2>
        <div id="ivGlossary"></div>
      </div>
    </div>
  </div>`,

  /* ---------------------------------------------------------------- wiring */

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("ivTarget").onchange = () => {
      const v = parseFloat($("ivTarget").value);
      INV_S.target = Number.isFinite(v) && v > 0.2 && v < 60 ? v : null;
      INV_S.result = null; ctx.refresh();
    };
    $("ivTol").onchange = () => {
      const v = parseFloat($("ivTol").value);
      INV_S.tolPct = Number.isFinite(v) && v > 0 && v <= 20 ? v : 0.5;
      INV_S.result = null; ctx.refresh();
    };
    const mh = () => {
      const a = parseFloat($("ivMhLo").value), b = parseFloat($("ivMhHi").value);
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) { INV_S.mhLo = a; INV_S.mhHi = b; }
      INV_S.result = null; ctx.refresh();
    };
    $("ivMhLo").onchange = mh;
    $("ivMhHi").onchange = mh;
    $("ivW").onchange = () => { INV_S.needW = $("ivW").checked; INV_S.result = null; ctx.refresh(); };
    $("ivGo").onclick = () => this._run(ctx);
    $("ivResolve").onclick = () => {
      $("ivResolveNote").textContent = "enumerating the rungs a page can reach…";
      setTimeout(() => {
        const seed = ctx.seed === "candidate" ? "candidate" : "published";
        const box = inverseBox(1, 2, INV_S.mhLo, INV_S.mhHi, ctx.model().conventions);
        const out = {};
        for (const b of reachableSet(ctx.DATA, seed).bands) {
          if (b.enumerated > INV_RESOLVABLE) continue;
          /* the cap must clear the rung this loop already decided to attempt, or the sweep stops
           * short and hands back a SHORTER point set that looks complete -- which is exactly what
           * happened: rung three came back as 54 points instead of 65, and the panel reported the
           * number without reporting the cut.  The module says `capped`; the note below now says
           * it out loud, and the cap is derived from the same threshold that chose the rung. */
          out[b.k8D] = rungPoints(INV_L, b.k8D, b.A4_cap, box, { cap: INV_RESOLVABLE + 1 });
        }
        INV_S.points = out;
        ctx.refresh();
      }, 20);
    };
    $("ivAxis").onclick = (e) => {
      const lay = this._layout;
      if (!lay) return;
      const r = e.target.getBoundingClientRect();
      const x = (e.clientX - r.left) * (lay.W / r.width);
      if (x < lay.x0 || x > lay.x1) return;
      const gev = lay.lo + (x - lay.x0) / (lay.x1 - lay.x0) * (lay.hi - lay.lo);
      INV_S.target = Math.round(gev) / 1000;
      INV_S.result = null;
      this._run(ctx);
    };
    /* scoped to this card: a bare document-wide selector would claim any other section's buttons
     * that happened to use the same attribute, and the shell mounts one section at a time only
     * because nothing has needed two yet */
    $("ivProbeCtl").querySelectorAll("[data-p]").forEach((b) => {
      b.onclick = () => {
        if (!INV_S.probe) return;
        INV_S.probe[b.dataset.p] += +b.dataset.d;
        ctx.refresh();
      };
    });
  },

  /* the expensive half runs off the event loop, so the button paints "working" first */
  _run(ctx) {
    const $ = (id) => document.getElementById(id);
    if (INV_S.target === null) { INV_S.result = null; ctx.refresh(); return; }
    INV_S.busy = true;
    $("ivBusy").textContent = "walking the rungs…";
    ctx.refresh();
    setTimeout(() => {
      const L = INV_L, D = ctx.DATA;
      const conv = ctx.model().conventions;
      const r = INV_S.target * 1000, f = INV_S.tolPct / 100;
      const box = inverseBox(r * (1 - f), r * (1 + f), INV_S.mhLo, INV_S.mhHi, conv);
      const km = kMaxFor(D, box, D.inverse.k_max, ctx.seed === "candidate" ? "candidate" : "published");
      const t0 = Date.now();
      const res = designScale(L, D, box, {
        kMax: km.kMax, needW: INV_S.needW, tries: 6,
        gauge: gaugeSeed(ctx.model(), D).gauge,
        verify: (terms) => this._verify(terms),
      });
      INV_S.result = { ...res, km, box, ms: Date.now() - t0, target: INV_S.target,
                       tolPct: INV_S.tolPct, needW: INV_S.needW };
      INV_S.asked = INV_S.target;
      INV_S.busy = false;
      ctx.refresh();
    }, 20);
  },

  /* THE EXACT POTENTIAL HAS THE LAST WORD.  W > 0 compares the two symmetric points and says
   * nothing about a third minimum in between, so a candidate the screen admits is put on F
   * itself: the closed form only LOCATES the basin, `localMin` walks to the minimum it is about,
   * `numericMin` finds the deepest point with no bracket, and the verdict is F against F.  The
   * same procedure the vacuum verdict in the hierarchy section uses — nothing positional. */
  _verify(terms) {
    const OPT = { n: 800, refine: 30, windings: 300 };
    const mo = moments(terms);
    const a = alphaMin(mo);
    if (a === null) return null;
    const aNum = numericMin(terms, OPT);
    if (aNum === null) return null;
    const aLoc = localMin(terms, a, OPT) ?? a;
    const fB = F(terms, aLoc, 300), fN = F(terms, aNum, 300);
    if (!(fB <= fN + 1e-9 * Math.max(1, Math.abs(fB)))) return null;
    const fpp = curvatureAtMin(mo, aLoc);
    return fpp > 0 ? { alpha: aLoc, alphaGlobal: aNum } : null;
  },

  /* ---------------------------------------------------------------- render */

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const seed = ctx.seed === "candidate" ? "candidate" : "published";
    if (INV_L === null || INV_SEED !== seed) {
      INV_L = inverseLattice(ctx.DATA, gaugeSeed(ctx.model(), ctx.DATA).gauge);
      INV_SEED = seed;
      INV_S.result = null;
      INV_S.probe = null;
    }
    if (!INV_S.probe) {
      const b = reachableSet(ctx.DATA, seed).bands[0];
      INV_S.probe = { A4: b.bottom_A4 ?? Math.round(b.t2_cap / 4), k8D: b.k8D };
    }
    $("ivTarget").value = INV_S.target === null ? "" : String(INV_S.target);
    $("ivTol").value = String(INV_S.tolPct);
    $("ivMhLo").value = String(INV_S.mhLo);
    $("ivMhHi").value = String(INV_S.mhHi);
    $("ivW").checked = INV_S.needW;
    $("ivBusy").textContent = INV_S.busy ? "walking the rungs…" : "";

    this._axis(ctx, seed);
    this._verdict(ctx, seed);
    this._lattice(ctx, seed);
    this._probe(ctx);
    this._glossary(ctx);
    void r;
  },

  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  /* ---------------------------------------------------------------- the axis */

  _axis(ctx, seed) {
    const R = reachableSet(ctx.DATA, seed);
    const c = document.getElementById("ivAxis");
    const W = c.clientWidth || 1200, H = 230;
    const d = window.devicePixelRatio || 1;
    c.width = W * d; c.height = H * d; c.style.height = H + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, W, H);

    const lo = Math.min(...R.bands.map((b) => b.bottom)) * 0.94;
    const hi = Math.max(...R.bands.map((b) => b.top_LP)) * 1.03;
    const x0 = 46, x1 = W - 18, yAx = H - 42;
    const X = (v) => x0 + (v - lo) / (hi - lo) * (x1 - x0);
    this._layout = { W, x0, x1, lo, hi };

    /* the gap, first and underneath everything, because it is the thing to see */
    const gx0 = X(R.gap.lo), gx1 = X(R.gap.hi);
    g.fillStyle = this._css("--rust-l");
    g.fillRect(gx0, 24, gx1 - gx0, yAx - 24);
    g.strokeStyle = this._css("--rust"); g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(gx0, 24); g.lineTo(gx0, yAx); g.moveTo(gx1, 24); g.lineTo(gx1, yAx);
    g.stroke(); g.setLineDash([]);
    g.fillStyle = this._css("--rust");
    g.font = "650 12px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = "center";
    g.fillText(`${Math.round(R.gap.width)} GeV — nothing here`, (gx0 + gx1) / 2, 40);
    g.font = "11px ui-monospace,Menlo,Consolas,monospace";
    g.fillText(`(${(R.gap.lo / 1000).toFixed(3)}, ${(R.gap.hi / 1000).toFixed(3)}) TeV`,
               (gx0 + gx1) / 2, 55);

    /* one lane per rung */
    const lanes = R.bands.length;
    const laneH = Math.min(26, (yAx - 70) / lanes);
    R.bands.forEach((b, i) => {
      const y = 72 + i * (laneH + 8);
      const bx0 = X(b.bottom), bx1 = X(b.top);
      g.fillStyle = this._css("--blue-l");
      g.fillRect(bx0, y, Math.max(2, bx1 - bx0), laneH);
      g.strokeStyle = this._css("--blue"); g.lineWidth = 1.2;
      g.strokeRect(bx0 + 0.5, y + 0.5, Math.max(2, bx1 - bx0) - 1, laneH - 1);
      const lad = R.ladder.find((l) => l.k8D === b.k8D);
      if (lad) {
        const lx0 = X(lad.lo), lx1 = X(lad.hi);
        g.fillStyle = this._css("--green-l");
        g.fillRect(lx0, y + 3, Math.max(2, lx1 - lx0), laneH - 6);
        g.strokeStyle = this._css("--green");
        g.strokeRect(lx0 + 0.5, y + 3.5, Math.max(2, lx1 - lx0) - 1, laneH - 7);
      }
      /* RESOLVED, this rung is a COMB and not a bar, and the comb goes on top of both boxes: the
       * extent the paper tabulates stays visible, and so does the fact that what is inside it is
       * a finite set of points. */
      const P = INV_S.points && INV_S.points[b.k8D];
      if (P) {
        g.strokeStyle = this._css("--blue-d"); g.lineWidth = 1;
        g.beginPath();
        for (const p of P.points) { const px = X(p.invR); g.moveTo(px, y); g.lineTo(px, y + laneH); }
        g.stroke();
      }
      /* the LP ceiling: a bound with no content at it */
      const cx = X(b.top_LP);
      g.strokeStyle = this._css("--ink3"); g.lineWidth = 1; g.setLineDash([2, 2]);
      g.beginPath(); g.moveTo(cx, y - 3); g.lineTo(cx, y + laneH + 3); g.stroke();
      g.setLineDash([]);
      g.fillStyle = this._css("--ink2");
      g.font = "650 11px ui-monospace,Menlo,Consolas,monospace";
      g.textAlign = "right";
      g.fillText(`8D=${b.k8D}`, x0 - 6, y + laneH / 2 + 4);
    });

    /* the axis itself */
    g.strokeStyle = this._css("--line"); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, yAx); g.lineTo(x1, yAx); g.stroke();
    g.fillStyle = this._css("--ink2");
    g.font = "11px ui-monospace,Menlo,Consolas,monospace";
    g.textAlign = "center";
    for (let t = Math.ceil(lo / 500) * 500; t <= hi; t += 500) {
      const x = X(t);
      g.strokeStyle = this._css("--line");
      g.beginPath(); g.moveTo(x, yAx); g.lineTo(x, yAx + 4); g.stroke();
      if (t % 1000 === 0) g.fillText((t / 1000).toFixed(0) + " TeV", x, yAx + 17);
    }

    /* the measured-mass point, and the target if one was asked */
    const pdg = R.pdg;
    if (pdg && pdg.lo) {
      const px = X(pdg.lo);
      g.strokeStyle = this._css("--ink"); g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(px, 62); g.lineTo(px, yAx); g.stroke();
      g.fillStyle = this._css("--ink");
      g.font = "650 11px ui-monospace,Menlo,Consolas,monospace";
      g.textAlign = "left";
      g.fillText(`m_h measured → ${Math.round(pdg.lo)} GeV`, px + 5, 70);
    }
    if (INV_S.target !== null) {
      const tx = X(INV_S.target * 1000);
      if (tx >= x0 && tx <= x1) {
        g.strokeStyle = this._css("--rust"); g.lineWidth = 2;
        g.beginPath(); g.moveTo(tx, 20); g.lineTo(tx, yAx + 8); g.stroke();
      }
    }

    const nBands = R.bands.length;
    const P = INV_S.points;
    const resolved = P ? Object.values(P) : [];
    const worstInner = resolved.length ? Math.max(...resolved.map((p) => p.spacing.max)) : null;
    const cut = resolved.filter((p) => p.capped);
    document.getElementById("ivResolveNote").innerHTML = P
      ? `Resolved: ` + resolved.map((p) =>
          `<b>8D = ${p.k}</b> is ${p.n} points, ${p.spacing.mean.toFixed(1)} GeV apart on average ` +
          `(never closer than ${p.spacing.min.toFixed(2)}, never further than ` +
          `${p.spacing.max.toFixed(2)})`).join("; ") +
        `, from ${resolved.reduce((a, p) => a + p.built, 0).toLocaleString("en")} contents built ` +
        `here. The deeper rungs run to tens of millions and are not attempted — their bars are ` +
        `still a minimum and a maximum, of a set nobody resolved on this page.` +
        (cut.length
          ? ` <b style="color:var(--rust)">And ${cut.map((p) => "8D = " + p.k).join(", ")} hit the ` +
            `enumeration cap: those counts are LOWER BOUNDS, not the set.</b>`
          : "")
      : `A cluster is drawn as a bar, and a bar is a lie: a content fixes (A₄, 8D, G) and the two ` +
        `identities then fix <b>one</b> pair (1/R₅, m_h), so a rung's image is a <b>finite set</b>. ` +
        `This enumerates it.`;
    document.getElementById("ivAxisNote").innerHTML =
      `${nBands} clusters on the <b>${seed}</b> seed, 8D = ${R.bands.map((b) => b.k8D).join(", ")}. ` +
      `Each bar spans the minimum and the maximum that rung reaches with m_h in the window; the ` +
      `box inside is the part whose electroweak point survives the exact potential. The clusters ` +
      `overlap low down and separate high up, and between the top two there are ` +
      `<b>${Math.round(R.gap.width)} GeV</b> with nothing in them. ` +
      (worstInner
        ? `That is <b>${(R.gap.width / worstInner).toFixed(0)}×</b> the widest gap <em>inside</em> ` +
          `either resolved cluster (${worstInner.toFixed(2)} GeV) — computed here, on this render. ` +
          `A finite set is disconnected for free; what is not free is a macroscopic stretch ` +
          `between two clusters, closed by an exact rational certificate rather than by a search. ` +
          `<span class="chip mea">measured</span> `
        : `Press the button to resolve the clusters and the comparison that makes that a result — ` +
          `the gap against the widest gap <em>inside</em> a cluster — is computed here. `) +
      `The ends are rounded <b>inward</b>: an interval that says "nothing here" is a negative ` +
      `claim, and rounding to nearest can put an occupied point inside it. ` +
      `<span class="chip ver">verified</span> the bars are read from the archived enumeration ` +
      `(${R.bands.reduce((a, b) => a + b.enumerated, 0).toLocaleString("en")} contents); the ` +
      `points, the certificates and the designs below are recomputed here.`;
  },

  /* ---------------------------------------------------------------- the verdict */

  _verdict(ctx, seed) {
    const el = document.getElementById("ivVerdict");
    const cert = document.getElementById("ivCerts");
    const res = INV_S.result;
    if (!res) {
      el.className = "verdict stable";
      el.innerHTML = INV_S.target === null
        ? "<b>—</b><span>Nothing asked yet. Type a scale, or click the axis.</span>"
        : `<b>${INV_S.target} TeV — not run yet</b><span>Press <b>design it</b>.</span>`;
      cert.innerHTML = "";
      return;
    }
    const D = ctx.DATA;
    if (res.design) {
      const L = INV_L;
      const f = forwardOf(L, res.design.mult, res.box, gaugeSeed(ctx.model(), D).gauge);
      el.className = "verdict breaks";
      el.innerHTML =
        `<b>A content at ${(f.invR / 1000).toFixed(3)} TeV — ${multName(L, res.design.mult)}</b>` +
        `<span>${res.design.size} multiplets at (A₄, 8D) = (${res.design.t2 / 2}, ${res.design.k}) · ` +
        `m_h = ${f.mh.toFixed(3)} GeV · α_min = ${f.alpha.toFixed(5)} · 2W = ${f.W2}. ` +
        (res.design.exact
          ? `The <b>exact potential</b> agrees the electroweak point is the deepest place on (0, 1] ` +
            `— checked by direct minimisation on this render, not by the screen. ` +
            `<span class="chip ver">verified</span>`
          : `<span class="chip bad">unverified</span>`) +
        ` &nbsp;<button class="ghost" id="ivLoad">→ load into the model</button></span>`;
      const b = document.getElementById("ivLoad");
      if (b) b.onclick = () => ctx.load(multBulk(L, res.design.mult));
    } else if (isProved(res)) {
      el.className = "verdict stable";
      el.innerHTML =
        `<b>No content reaches ${res.target} TeV — and that is proved, not merely unfound</b>` +
        `<span>Every rung up to 8D = ${res.km.kMax} came back with a named certificate. ` +
        (res.km.shrunk
          ? `The walk stopped at 8D = ${res.km.kMax} because the relaxation's own ceiling is below ` +
            `this target above it, so the claim is about <b>all</b> rungs. `
          : `The walk covers 8D ≤ ${res.km.kMax}, which is what the claim is about. `) +
        (res.rejected ? `${res.rejected} candidate(s) the W screen admitted were thrown out by the ` +
                        `exact potential. ` : "") +
        `<span class="chip thm">theorem</span></span>`;
    } else {
      el.className = "verdict stable";
      el.innerHTML =
        `<b>Undecided at ${res.target} TeV — the machine stopped, and says so</b>` +
        `<span>${res.certs.budget || 0} rung(s) ran past the declared enumeration budget. ` +
        `This is <b>not</b> a no-go: "we stopped looking" must never read as "there is none". ` +
        `Down here a rung holds of the order of 10⁷ contents, and closing it needs branch and ` +
        `bound — the same cone bound applied at interior nodes rather than only at the root. ` +
        `<span class="chip bad">unknown</span></span>`;
    }

    const G = { ...D.inverse.certificates, ...D.inverse.not_certificates };
    const rows = Object.entries(res.certs).sort((a, b) => b[1] - a[1]);
    cert.innerHTML = rows.length
      ? `<div class="note" style="margin-bottom:7px">The roster — what closed each rung, and how ` +
        `many rungs each reason closed. ${res.visited} rung(s) visited, ` +
        `${res.spent.toLocaleString("en")} content(s) built, ${res.ms} ms.</div>` +
        `<table><tbody>` + rows.map(([k, n]) =>
          `<tr><td style="width:104px"><b style="font-family:var(--mono);font-size:12.5px;` +
          `color:${k === "budget" ? "var(--rust)" : "var(--ink)"}">${k}</b></td>` +
          `<td class="num" style="width:44px">${n}</td>` +
          `<td class="note">${(G[k] || "").split(".")[0]}.</td></tr>`).join("") +
        `</tbody></table>`
      : "";
    void seed;
  },

  /* ---------------------------------------------------------------- the lattice */

  _lattice(ctx, seed) {
    const L = INV_L;
    document.getElementById("ivLattice").innerHTML =
      L.slots.map((s, j) =>
        `<tr${j === L.free ? ' style="background:var(--green-l)"' : ""}>` +
        `<td style="font-family:var(--mono);font-size:13px">${s.name}` +
        `${j === L.free ? ' <span class="note">← the only one</span>' : ""}</td>` +
        `<td class="num">${L.t2[j] / 2}</td><td class="num">${L.k8D[j]}</td>` +
        `<td class="num">${L.G[j].toFixed(4)}</td><td class="num">${L.W2[j]}</td></tr>`).join("") +
      `<tr><td style="font-family:var(--mono);font-size:13px;color:var(--ink2)">gauge (the seed)</td>` +
      `<td class="num">${L.base.t2 / 2}</td><td class="num">${L.base.k8D}</td>` +
      `<td class="num">${L.base.G.toFixed(4)}</td><td class="num">${L.base.W2}</td></tr>`;
    document.getElementById("ivLatticeNote").innerHTML =
      `Derived here from the term tables, not typed. <b>${L.slots[L.free].name}</b> is the only ` +
      `generator with A₄ = 0 and it moves 8D by ${L.k8D[L.free]}, so at a fixed A₄ the other seven ` +
      `are bounded and its own multiplicity is forced. That is the whole of Observation 1, and it ` +
      `is what a certificate stands on. On this seed 8D runs ` +
      `<b>${Math.abs(L.base.k8D) % 2 ? "odd" : "even"}</b> and A₄ is ` +
      `<b>${L.base.t2 % 2 ? "half-integral" : "an integer"}</b>; the mod-6 law 8D = 2A₄ + 3 holds ` +
      `either way, because every generator preserves it. <span class="chip thm">theorem</span> ` +
      `Part VII Theorem 2. ${seed === "candidate"
        ? "<b>The clusters above are the candidate seed's own run</b>, not the published one."
        : ""}`;
  },

  /* ---------------------------------------------------------------- the point probe */

  _probe(ctx) {
    const L = INV_L, D = ctx.DATA, p = INV_S.probe;
    document.getElementById("ivPA4").textContent = String(p.A4);
    document.getElementById("ivPK").textContent = String(p.k8D);
    const el = document.getElementById("ivProbe");
    const t2 = Math.round(2 * p.A4);
    const conv = ctx.model().conventions;
    const box = inverseBox((INV_S.target || 9) * 1000 * 0.9, (INV_S.target || 9) * 1000 * 1.1,
                           INV_S.mhLo, INV_S.mhHi, conv);
    if (!inCone(L, t2, p.k8D)) {
      el.className = "verdict stable";
      el.innerHTML = `<b>cone</b><span>(A₄, 8D) = (${p.A4}, ${p.k8D}) is outside the moment cone ` +
        `generated by the eight multiplets. Not even a content with fractional multiplicities ` +
        `sits there. <span class="chip thm">theorem</span></span>`;
      return;
    }
    if (!congruenceOK(t2, p.k8D)) {
      el.className = "verdict stable";
      el.innerHTML = `<b>congruence</b><span>8D = 2A₄ + 3 (mod 6) fails at (${p.A4}, ${p.k8D}): ` +
        `2A₄ + 3 = ${t2 + 3} and 8D = ${p.k8D}. An integer obstruction — it holds at any size, and ` +
        `on either gauge seed. <span class="chip thm">theorem</span> Part VII Theorem 2.</span>`;
      return;
    }
    let n = 0, smallest = null, sMin = Infinity;
    contentsAt(L, t2, p.k8D, (m) => {
      n++;
      const sz = m.reduce((a, b) => a + b, 0);
      if (sz < sMin) { sMin = sz; smallest = m.slice(); }
      return false;
    }, 200000);
    const w = gWindow(L, t2, p.k8D, box);
    el.className = n ? "verdict breaks" : "verdict stable";
    el.innerHTML = `<b>${n.toLocaleString("en")} content${n === 1 ? "" : "s"} sit here</b>` +
      `<span>(A₄, 8D) = (${p.A4}, ${p.k8D}) is a lattice point, and the rung is finite — this is ` +
      `the enumeration, run now. ` +
      (smallest ? `The smallest has ${sMin} multiplets: <b>${multName(L, smallest)}</b>. ` : "") +
      (w ? `Within the current m_h window this rung admits G in [${w.gLo.toFixed(3)}, ` +
           `${w.gHi.toFixed(3)}].` : `It cannot meet the current target box at all — the ` +
           `certificate <b>rung</b>, which excludes the rung and not the target.`) +
      `</span>`;
    void D;
  },

  /* ---------------------------------------------------------------- the glossary */

  _glossary(ctx) {
    const I = ctx.DATA.inverse;
    document.getElementById("ivGlossary").innerHTML =
      Object.entries(I.certificates).map(([k, v]) =>
        `<div style="margin-bottom:10px"><b style="font-family:var(--mono);font-size:12.5px">${k}` +
        `</b> <span class="chip thm">certificate</span><br><span class="note">${v}</span></div>`).join("") +
      `<div style="border-top:1px solid var(--line);margin:13px 0 11px"></div>` +
      Object.entries(I.not_certificates).map(([k, v]) =>
        `<div style="margin-bottom:10px"><b style="font-family:var(--mono);font-size:12.5px;` +
        `color:var(--rust)">${k}</b> <span class="chip bad">not a certificate</span><br>` +
        `<span class="note">${v}</span></div>`).join("") +
      `<div class="note" style="border-top:1px solid var(--line);padding-top:11px">${I.screen}</div>`;
  },
};

/* orbifold_section.js — "Classify an orbifold": the preflight of Part IX-A, and its two referees.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHO THIS IS FOR, in the paper's own words (§8): "anyone about to classify boundary conditions on
 * an orbifold or for a gauge group that has not been done.  Before a single twist matrix is written
 * by hand, the preflight gives the number of labels and their weights, which is THE SIZE OF THE
 * PROBLEM; the degree of the answer, which is WHAT A CLOSED FORM MUST HAVE; and the local data,
 * which is WHAT ANY EQUIVALENCE RELATION MUST PRESERVE.  A proposed relation that moves a local
 * datum is wrong, and a proposed count of the wrong degree is missing labels."
 *
 * So this is not a page about our results.  It is a page for someone else's work in progress, and
 * the three panels are those three sentences.
 *
 * IT SITS NEXT TO `bcclass` AND CHANGES ITS ENGINE.  That section walks orbits, on the two
 * orbifolds where the classification is settled, over SU(N) only.  Everything here is DERIVED from
 * the rotation matrix: the cone signature, the alphabet, the local data, the count and its degree,
 * over all three real forms and at any rank.  Nothing is entered.
 *
 * THE RANK IS CAPPED, AND SAYS SO.  The picture needs the fibres, and fibres need enumeration; the
 * count does not, because the series gives it by recurrence.  So the panel enumerates up to a cap
 * that depends on the alphabet and reads the count past it from the closed form — and it prints
 * which of the two it is showing rather than letting a short answer pass for a complete one.
 */
const ORB_S = {
  orbifold: "S1/Z2",
  family: "SU",
  N: 4,
  axes: [0, 1],
  panels: null,
  cache: null,
};

/* The rotations.  Each is a matrix of finite order over Z^r and NOTHING ELSE is supplied: the
 * signature, the alphabet, the data, the count and the degree all come out of it. */
/* The companion matrix of Phi_m, s blocks: the rotation of order m on a lattice of rank s*phi(m).
 * §9 of Part IX-A says that below rank 22 there is exactly ONE rotation per (m, r) — the count is
 * h(Q(zeta_m)), which is 1 all the way up — so this is not a choice among several, it is THE one.
 * Which is why the presets can be generated rather than tabulated. */
function orbCompanion(coeffs, s) {
  const d = coeffs.length - 1;
  const C = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 1; i < d; i++) C[i][i - 1] = 1;
  for (let i = 0; i < d; i++) C[i][d - 1] = -coeffs[i];
  const r = d * s, A = Array.from({ length: r }, () => new Array(r).fill(0));
  for (let b = 0; b < s; b++)
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) A[b * d + i][b * d + j] = C[i][j];
  return A;
}

const ORB_ROT = {
  "S1/Z2": { label: "S¹/Z₂", A: [[-1]] },
  "T2/Z2": { label: "T²/Z₂", A: [[-1, 0], [0, -1]] },
  "T2/Z3": { label: "T²/Z₃", A: [[0, -1], [1, -1]] },
  "T2/Z4": { label: "T²/Z₄", A: [[0, -1], [1, 0]] },
  "T2/Z6": { label: "T²/Z₆", A: [[1, -1], [1, 0]] },
  /* rank 6, where heterotic orbifold model building lives.  They are here because the Smith-form
   * enumeration made them affordable: T^6/Z_3 costs 108 points and 2 ms, where the box walk this
   * replaced would have taken 1.5 billion. */
  "T6/Z3": { label: "T⁶/Z₃", A: orbCompanion([1, 1, 1], 3) },
  "T6/Z6": { label: "T⁶/Z₆", A: orbCompanion([1, -1, 1], 3) },
  "T6/Z7": { label: "T⁶/Z₇", A: orbCompanion([1, 1, 1, 1, 1, 1, 1], 1) },
};

/* Read a matrix the way somebody would type one: rows on separate lines or split by ';', entries
 * by spaces or commas, brackets optional.  Returns the matrix or an explanation. */
function orbParseMatrix(text) {
  const t = String(text).replace(/[[\]]/g, " ").trim();
  if (!t) return { error: "nothing typed" };
  const rows = t.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean)
                .map((s) => s.split(/[\s,]+/).filter(Boolean).map(Number));
  if (!rows.length) return { error: "nothing typed" };
  if (rows.some((r) => r.some((x) => !Number.isInteger(x)))) {
    return { error: "every entry must be an INTEGER — a rotation of a lattice has no other kind" };
  }
  const n = rows[0].length;
  if (rows.some((r) => r.length !== n)) return { error: "the rows are not all the same length" };
  if (rows.length !== n) {
    return { error: "the matrix must be square: got " + rows.length + " rows of " + n };
  }
  if (n > 8) return { error: "rank " + n + " is past what this page will attempt" };
  return { A: rows };
}

/* THE COST OF THE PICTURE IS NOT THE COST OF THE PREFLIGHT, and the difference is the whole reason
 * this page can go to rank 6.
 *
 * The three things §8 promises — the alphabet, the degree, the local data — come from the rotation
 * and cost almost nothing: T^6/Z_3 is 108 lattice points and two milliseconds.  The COUNT and the
 * PICTURE need the multisets of letters of a given rank, and that is C(N+L-1, L-1) for an alphabet
 * of L letters: 81 letters at rank 4 is 1.9 million.  So the expensive half is bounded by what it
 * actually costs, the bound is derived and displayed, and where it cannot be paid the page says so
 * instead of hanging or quietly showing a short answer. */
const ORB_BUDGET = 150000;

function orbMultisetEstimate(L, N) {          /* C(N+L-1, L-1), grown carefully, capped */
  let v = 1;
  for (let i = 1; i <= N; i++) { v = v * (L - 1 + i) / i; if (v > 1e12) return Infinity; }
  return v;
}

function orbFibreCap(ws) {
  const L = ws.length;
  for (let N = 1; N <= 16; N++) if (orbMultisetEstimate(L, N + 1) > ORB_BUDGET) return N;
  return 16;
}

function orbState() {
  const key = ORB_S.orbifold + "|" + ORB_S.family + "|" + (ORB_S.custom || "");
  if (ORB_S.cache && ORB_S.cache.key === key) return ORB_S.cache;
  const entry = ORB_ROT[ORB_S.orbifold];
  const A = entry ? entry.A : ORB_S.customA;
  const label = entry ? entry.label : "your matrix";
  const m = orderOf(A);
  /* THE REFUSAL IS AN ANSWER.  A matrix of infinite order is not classified; that is the
   * crystallographic restriction showing up as a property of the input. */
  if (!m) {
    ORB_S.cache = { key, A, label, refused: "no finite power of this matrix is the identity, so it"
      + " is not a rotation of a lattice. That refusal IS the crystallographic restriction: in rank"
      + " r only the orders with phi(m) dividing r can occur at all." };
    return ORB_S.cache;
  }
  const cost = classificationCost(A, m);
  /* THE HYPOTHESIS, CHECKED RATHER THAN ASSUMED.  Part IX-A takes the characteristic polynomial to
   * be Phi_m^s — no eigenvalue 1 — which in practice is det(A^k - I) non-zero for every k below m.
   * A rotation that fixes a whole subtorus has no isolated cone points, and the machinery then
   * returns an EMPTY signature, an EMPTY alphabet and degree zero: an answer shaped exactly like a
   * real one.  That is worse than a refusal, so it is refused.  Found by typing a Z_3 acting on two
   * coordinates of a rank-3 lattice and leaving the third alone. */
  const fixedBy = cost.dets.findIndex((d) => d === 0);
  if (fixedBy >= 0) {
    ORB_S.cache = { key, A, label, m,
      refused: "rho^" + (fixedBy + 1) + " fixes a whole subtorus rather than isolated points — "
        + "det(A^" + (fixedBy + 1) + " − I) = 0, so this rotation has an eigenvalue 1 and its "
        + "characteristic polynomial is not a power of the m-th cyclotomic. That is outside the "
        + "hypothesis of Part IX-A, and the machinery would answer with an empty alphabet and "
        + "degree zero, which looks like an answer and is not one." };
    return ORB_S.cache;
  }
  if (cost.points > 4e6) {
    ORB_S.cache = { key, A, label, m,
      refused: "classifying this would enumerate " + cost.points.toLocaleString("en")
        + " lattice points (determinants " + cost.dets.join(", ") + "), which this page will not"
        + " start rather than hang. The bound is stated, not hidden." };
    return ORB_S.cache;
  }
  const cones = conePoints(A, m);
  const sig = cones.map((c) => c.order);
  const letters = realForm(A, m, ORB_S.family);
  const ws = letters.map((L) => L.weight);
  const need = ws.reduce((s, w) => s + w, 0);
  const cap = orbFibreCap(ws);
  /* the series needs the counts up to sum(w), which is out of reach for a big alphabet; when it is,
   * there is no closed form on this page and that is said rather than approximated */
  let P = null, seriesWhy = null;
  if (orbMultisetEstimate(ws.length, need + 1) > ORB_BUDGET) {
    seriesWhy = "the numerator needs the counts up to rank " + (need + 1) + " over "
      + ws.length + " letters, which is past this page's budget";
  } else {
    try { P = hilbertNumerator(classCount(A, m, ORB_S.family, need + 1), ws); }
    catch (e) { seriesWhy = e.message; }
  }
  ORB_S.cache = { key, A, m, label, cones, sig, letters, ws, P, seriesWhy, cap, cost,
                  coords: datumCoordinates(A, m), rank: A.length };
  return ORB_S.cache;
}

const ORBIFOLD_SECTION = {
  id: "orbifold",
  label: "Classify an orbifold",
  paper: "Part IX-A · The Alphabet of Orbifold Boundary Conditions",
  ready: true,
  modules: [],

  /* THE HEADER RUNS FIRST, SO IT MUST SURVIVE A REFUSAL.  This reached for C.sig on a state that
   * has none, threw, and took the whole refresh down with it — leaving the PREVIOUS orbifold on
   * screen after a matrix was refused, which is the worst possible outcome: it reads as if the
   * refusal had been accepted.  A refusal is a state the header has to be able to say out loud. */
  holds() {
    const C = orbState();
    if (C.refused) return `${C.label} · REFUSED — not a rotation this page will classify`;
    return `${C.label} · ${ORB_S.family}(N) · signature (${C.sig.join(", ")}) · `
         + `alphabet ${orbShape(C.letters)} · degree ${predictedDegree(C.sig, ORB_S.family)}`;
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Classifying the boundary conditions of a new orbifold is not a project but a
    <b>computation</b>, and its only inputs are the rotation and the gauge group. Everything on this
    page is derived from the matrix: the cone signature, the alphabet, the local data, the count and
    its degree. Nothing below is entered. <span class="chip thm">theorem</span></p>
    <div class="note" style="margin-top:9px">A boundary condition is a representation of the space
    group <b>Γ = Λ ⋊ Z<sub>m</sub></b>, so the letters are Irr(Γ) — a Möbius inversion over the
    fixed points of the rotation, with Clifford theory supplying the weights. A letter of weight
    above one is exactly a boundary condition that is <b>not diagonal</b>. The class of a condition
    is its tuple of local data at the cone points, and that is what any equivalence must preserve.
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="orbOrb"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="orbFam"></div>
    <div class="rowm" id="orbNCtl">
      <span class="nm" style="flex:1">rank N</span>
      <button class="st" data-n="-1">−</button>
      <span class="cnt" id="orbN">—</span>
      <button class="st" data-n="1">+</button>
    </div>
    <div id="orbAxesWrap" style="margin-top:10px"></div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>Or your own rotation</h2>
    <p class="note" style="margin:0 0 10px">An integer matrix of finite order, any rank up to 8 —
    rows on separate lines or split by <code>;</code>. This page has no list of orbifolds it knows:
    it has a computation, and the five above are just inputs to it. A matrix of infinite order comes
    back <b>refused</b> rather than classified, which is the crystallographic restriction appearing
    as a property of what you typed.</p>
    <textarea id="orbMx" rows="3" spellcheck="false" style="width:100%;font-family:ui-monospace,
      monospace;font-size:13px;padding:8px;border:1px solid var(--line,#dde3ea);border-radius:6px"
      >0 -1; 1 -1</textarea>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <button class="ghost" id="orbGo">classify it</button>
      <span class="note" id="orbMxNote">—</span>
    </div>
  </div>

  <div class="grid two">
    <div class="card"><h2>The plan — the datum lattice</h2>
      <canvas id="orbMap" style="width:100%;display:block"></canvas></div>
    <div class="card"><h2>The relief — the same field, turned</h2>
      <canvas id="orbSurf" style="width:100%;display:block"></canvas></div>
  </div>
  <div class="note" id="orbCap" style="margin-top:10px">—</div>

  <div class="grid two" style="margin-top:18px">
    <div class="card">
      <h2>The size of the problem</h2>
      <p class="note" style="margin:0 0 10px">How many letters, of what weight. This is what a
      classification has to get through, and it is known before any of it is done.</p>
      <div style="overflow-x:auto"><table><thead><tr><th class="num">weight</th>
        <th class="num">letters</th><th>Frobenius–Schur</th></tr></thead>
        <tbody id="orbAlpha"></tbody></table></div>
      <div class="verdict stable" id="orbAlphaV" style="margin-top:12px"><b>—</b><span>—</span></div>
    </div>
    <div class="card">
      <h2>What a closed form must have</h2>
      <p class="note" style="margin:0 0 10px">The degree comes from the signature alone,
      <b>e₁ = 1 + Σ c(mᵢ)</b> with c(m) = m−1 over SU(N) and ⌊m/2⌋ over SO(N) and Sp(N); the degree
      is e₁ − 1. <b>A proposed count of the wrong degree is missing labels.</b></p>
      <div style="overflow-x:auto"><table><thead><tr><th class="num">N</th>
        <th class="num">classes</th><th>where from</th></tr></thead>
        <tbody id="orbCount"></tbody></table></div>
      <div class="note" id="orbSeries" style="margin-top:10px">—</div>
    </div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>What any equivalence relation must preserve</h2>
    <p class="note" style="margin:0 0 10px">The local datum of every letter at every cone point, as
    multiplicities over the e-th roots of unity. <b>A proposed relation that moves one of these is
    wrong</b>, and the check costs seconds and does not need the classification to be finished.</p>
    <div style="overflow-x:auto"><table id="orbData"></table></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Your boundary condition, and everything that is the same theory</h2>
    <p class="note" style="margin:0 0 10px">A boundary condition is a multiset of letters: one
    multiplicity per letter of the table above, in that order. What it leaves unbroken in four
    dimensions is <b>S(&prod; U(n<sub>&#8467;</sub>))</b> &mdash; an adjoint component survives when
    its two indices carry the same eigenvalue at <i>every</i> cone, and for weight-one letters an
    index's profile is its letter. <b>The apparent symmetry is not an invariant of the theory</b>,
    and the table below is the demonstration: every row is the same physics as yours.</p>
    <input id="orbBC" spellcheck="false" style="width:100%;font-family:ui-monospace,monospace;
      font-size:13px;padding:8px;border:1px solid var(--line,#dde3ea);border-radius:6px">
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <button class="ghost" id="orbBCgo">read it</button>
      <span class="note" id="orbBCnote"></span>
    </div>
    <div class="verdict stable" id="orbBCv" style="margin-top:12px"><b>&mdash;</b><span>&mdash;</span></div>
    <div style="overflow-x:auto;margin-top:12px"><table id="orbBCclass"></table></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>What exists at all in this rank</h2>
    <p class="note" style="margin:0 0 10px">Before choosing an orbifold it is worth knowing the list
    is finite and short. Two restrictions, and they are not the same one: <b>&phi;(m) | r</b> is this
    paper's hypothesis &mdash; the lattice is a module over <b>Z[&zeta;<sub>m</sub>]</b> &mdash; and
    <b>&Phi;(m) &le; r</b> is Hiller's general crystallographic restriction. None of this is ours:
    Latimer&ndash;MacDuffee 1933, Diederichsen&ndash;Reiner, Charlap 1965, Montgomery&ndash;Uchida
    1971, Hiller 1985.</p>
    <div style="overflow-x:auto"><table><thead><tr><th class="num">order m</th>
      <th class="num">&phi;(m)</th><th class="num">blocks s</th><th>rotation</th>
      </tr></thead><tbody id="orbRank"></tbody></table></div>
    <div class="note" id="orbRankNote" style="margin-top:10px">&mdash;</div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>What this page does not do</h2>
    <div class="note" id="orbHonesty">—</div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("orbOrb").innerHTML = Object.keys(ORB_ROT).map((k) =>
      `<button class="ghost" data-orb="${k}">${ORB_ROT[k].label}</button>`).join("");
    $("orbOrb").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        ORB_S.orbifold = b.dataset.orb; ORB_S.cache = null; ORB_S.axes = [0, 1];
        const C = orbState();
        if (ORB_S.N > C.cap) ORB_S.N = C.cap;
        ctx.refresh();
      };
    });
    $("orbFam").innerHTML = ["SU", "SO", "Sp"].map((k) =>
      `<button class="ghost" data-fam="${k}">${k}(N)</button>`).join("");
    $("orbFam").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        ORB_S.family = b.dataset.fam; ORB_S.cache = null;
        const C = orbState();
        if (ORB_S.N > C.cap) ORB_S.N = C.cap;
        ctx.refresh();
      };
    });
    $("orbNCtl").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const C = orbState();
        const n = ORB_S.N + (+b.dataset.n);
        if (n < 0 || n > C.cap) return;
        ORB_S.N = n; ctx.refresh();
      };
    });
    document.getElementById("orbGo").onclick = () => {
      const p = orbParseMatrix(document.getElementById("orbMx").value);
      const note = document.getElementById("orbMxNote");
      if (p.error) { note.innerHTML = `<b style="color:#b3262b">${p.error}</b>`; return; }
      ORB_S.customA = p.A;
      ORB_S.custom = JSON.stringify(p.A);
      ORB_S.orbifold = "__custom__";
      ORB_S.cache = null; ORB_S.axes = [0, 1];
      const C = orbState();
      if (!C.refused && ORB_S.N > C.cap) ORB_S.N = C.cap;
      note.textContent = "";
      ctx.refresh();
    };
    ORB_S.panels = mountFibrePanels({
      ids: { map: "orbMap", surf: "orbSurf", cap: "orbCap" },
      height: 320,
      labels: ["first coordinate", "second coordinate"],
      onPick: () => { /* the pick is drawn by the panel; nothing else depends on it yet */ },
    });
    ORB_S.panels.attach();
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    const C = orbState();
    $("orbN").textContent = ORB_S.N;
    $("orbOrb").querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.orb === ORB_S.orbifold));
    $("orbFam").querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.fam === ORB_S.family));

    /* A REFUSAL IS RENDERED, not thrown away.  The reader typed something and is owed the reason. */
    if (C.refused) {
      document.getElementById("orbAxesWrap").innerHTML =
        `<div class="verdict breaks"><b>refused</b><span>${C.refused}</span></div>`;
      for (const id of ["orbAlpha", "orbCount", "orbData"]) {
        const e = document.getElementById(id); if (e) e.innerHTML = "";
      }
      for (const id of ["orbSeries", "orbCap"]) {
        const e = document.getElementById(id); if (e) e.textContent = "—";
      }
      const v = document.getElementById("orbAlphaV");
      v.className = "verdict breaks";
      v.innerHTML = "<b>no classification</b><span>nothing below is computed, because the input is "
                  + "not a rotation this page can classify</span>";
      this._honesty(C);
      return;
    }
    this._axes(ctx, C);
    this._field(C);
    this._alphabet(C);
    this._count(C);
    this._data(C);
    this._rank(ctx, C);
    this._bc(C);
    this._honesty(C);
  },

  /* THE QUESTION A MODEL BUILDER ASKS FIRST, and the one a survey gets wrong: how many DISTINCT
   * models am I counting?  A boundary condition is a multiset of letters; its four-dimensional
   * group is S(prod U(n_l)); and every other condition with the same local data is the same
   * theory wearing a different apparent symmetry.  Showing them side by side is the whole point of
   * the classification, and it is why a survey that does not quotient counts one model many times. */
  _bc(C) {
    const inp = document.getElementById("orbBC");
    const v = document.getElementById("orbBCv");
    const tbl = document.getElementById("orbBCclass");
    const note = document.getElementById("orbBCnote");
    if (!inp) return;
    if (!inp.value.trim() || (inp.dataset.for || "") !== C.key) {
      /* a default that is a real condition of the current alphabet, not a remembered one from
       * another orbifold: a stale vector read as current is the bug that keeps finding me */
      const d = new Array(C.letters.length).fill(0);
      d[0] = 2; if (C.letters.length > 2) d[2] = 3;
      inp.value = d.join(" ");
      inp.dataset.for = C.key;
    }
    const read = () => {
      const n = inp.value.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (n.length !== C.letters.length || n.some((x) => !Number.isInteger(x) || x < 0)) {
        note.innerHTML = '<b style="color:#b3262b">give one non-negative integer per letter &mdash; '
          + C.letters.length + ' of them</b>';
        v.className = "verdict";
        v.innerHTML = "<b>&mdash;</b><span>nothing read</span>";
        tbl.innerHTML = "";
        return;
      }
      note.textContent = "";
      const g = unbrokenGroup(C.letters, n);
      const name = unbrokenName(g);
      v.className = "verdict " + (g.exact ? "stable" : "breaks");
      v.innerHTML = "<b>" + name + "</b><span>rank " + g.sum + ". " + g.why + "</span>";

      /* the rest of the class, when the rank is within what the page will enumerate */
      if (g.sum < 1 || g.sum > C.cap) {
        tbl.innerHTML = '<tbody><tr><td class="note">Rank ' + g.sum + ' is past the enumeration '
          + 'budget of ' + C.cap + ' for this alphabet, so the rest of the class is not listed. '
          + 'The group above does not depend on it.</td></tr></tbody>';
        return;
      }
      const F = fibres(C.A, C.m, ORB_S.family, g.sum);
      const mine = JSON.stringify(C.cones.map((c, ci) => {
        const acc = new Array(c.order).fill(0);
        for (let i = 0; i < n.length; i++) for (let k = 0; k < c.order; k++)
          acc[k] += n[i] * C.letters[i].datum[ci][k];
        return acc;
      }));
      const f = F.fibres.get(mine);
      const rows = (f ? f.members : []).map((mem) => {
        const nm = unbrokenName(unbrokenGroup(C.letters, mem));
        const same = mem.every((x, i) => x === n[i]);
        return "<tr" + (same ? ' style="font-weight:600"' : "") + '><td><code>'
          + mem.join(" ") + "</code></td><td>" + nm + "</td><td>"
          + (same ? "yours" : "") + "</td></tr>";
      });
      const groups = new Set((f ? f.members : []).map(
        (mem) => unbrokenName(unbrokenGroup(C.letters, mem))));
      tbl.innerHTML = '<thead><tr><th>multiplicities</th><th>apparent unbroken group</th><th></th>'
        + "</tr></thead><tbody>" + rows.join("") + "</tbody>"
        + '<tfoot><tr><td colspan="3" class="note">' + (f ? f.members.length : 0)
        + " boundary conditions in this class, wearing " + groups.size
        + " different apparent symmetries"
        + (groups.size > 1 ? " \u2014 and they are one theory. A survey that does not quotient by"
                             + " this counts the same model " + f.members.length + " times."
                           : ".") + "</td></tr></tfoot>";
    };
    const go = document.getElementById("orbBCgo");
    if (go && !go._wired) { go._wired = true; go.onclick = read; }
    read();
  },

  /* THE LIST IS FINITE AND SHORT, and saying so is itself a service: a model builder choosing an
   * orbifold is choosing from this, and below rank 22 each row is ONE orbifold rather than a family
   * of them.  The rotations are GENERATED, so every row is loadable and not merely illustrative. */
  _rank(ctx, C) {
    const r = C.A.length;
    const R = orbifoldsOfRank(r);
    const cell = (o) => (o.m === 1
      ? "the identity \u2014 no orbifold"
      : '<button class="ghost" data-load="' + o.m + '">classify T<sup>' + r
        + '</sup>/Z<sub>' + o.m + '</sub></button>');
    document.getElementById("orbRank").innerHTML = R.under.map((o) =>
      '<tr><td class="num">' + o.m + '</td><td class="num">' + o.phi
      + '</td><td class="num">' + o.s + '</td><td>' + cell(o) + '</td></tr>').join("");
    document.getElementById("orbRank").querySelectorAll("button[data-load]").forEach((b) => {
      b.onclick = () => {
        const o = R.under.find((x) => x.m === +b.dataset.load);
        ORB_S.customA = o.rotation; ORB_S.custom = JSON.stringify(o.rotation);
        ORB_S.orbifold = "__custom__"; ORB_S.cache = null; ORB_S.axes = [0, 1];
        const S = orbState();
        if (!S.refused && ORB_S.N > S.cap) ORB_S.N = S.cap;
        ctx.refresh();
      };
    });
    const h = howManyRotations(2);
    document.getElementById("orbRankNote").innerHTML =
      "At rank " + r + " the hypothesis admits <b>" + R.under.length + "</b> orders"
      + (R.hillerOnly.length
          ? ", and Hiller allows <b>" + R.hillerOnly.map((x) => x.m).join(", ") + "</b> that it does"
            + " not: a rotation of that order does exist in GL(" + r + ",Z), but this lattice is not"
            + " a Z[&zeta;<sub>m</sub>]-module, so it falls outside Part IX-A. In rank 3 that gap is"
            + " the whole story, which is a large part of why this physics lives at rank 2 and"
            + " heterotic orbifolds at rank 6."
          : ", and Hiller allows no others.")
      + " And each row is ONE orbifold: " + h.why + ". The first place that changes is m = 23 at"
      + " rank 22 \u2014 three rotations, two orbifolds, because complex conjugation inverts the"
      + ' class group. <span class="chip thm">theorem</span>';
  },

  /* ---------------------------------------------------------------- the projection, named */
  _axes(ctx, C) {
    const el = document.getElementById("orbAxesWrap");
    if (C.coords.length <= 2) {
      el.innerHTML = `<div class="note">The datum space is two-dimensional here, so there is one
        plane and the picture is the object rather than a shadow of it.</div>`;
      ORB_S.axes = [0, 1];
      return;
    }
    const opts = [];
    for (let i = 0; i < C.coords.length; i++)
      for (let j = i + 1; j < C.coords.length; j++)
        opts.push(`<option value="${i},${j}"${ORB_S.axes[0] === i && ORB_S.axes[1] === j
          ? " selected" : ""}>cone ${C.coords[i][0] + 1} slot ${C.coords[i][1]} × cone ${
          C.coords[j][0] + 1} slot ${C.coords[j][1]}</option>`);
    el.innerHTML = `<span class="nm">the 2-plane drawn: </span>
      <select id="orbAxes">${opts.join("")}</select>
      <div class="note" style="margin-top:7px">The datum space has ${C.coords.length} dimensions —
      a cone of order e contributes e−1 — so the panels show a <b>plane through it</b>, and a cell
      may hold several classes. Which plane is a choice, and it is this one.</div>`;
    document.getElementById("orbAxes").onchange = (e) => {
      ORB_S.axes = e.target.value.split(",").map(Number);
      ctx.refresh();
    };
  },

  _field(C) {
    /* the picture is the expensive half; when the alphabet puts it out of budget the panels say so
     * rather than being drawn from a rank nobody asked for */
    if (ORB_S.N > C.cap) ORB_S.N = C.cap;
    if (C.cap < 1) {
      document.getElementById("orbCap").innerHTML =
        "<b>No picture at this alphabet.</b> It has " + C.letters.length + " letters, so even rank "
        + "one has more multisets than this page will enumerate. The alphabet, the local data and "
        + "the degree above are unaffected: they come from the rotation and cost nothing.";
      return;
    }
    const f = fibreField(C.A, C.m, ORB_S.family, ORB_S.N, ORB_S.axes);
    ORB_S.panels.set(f, fibreGrid(f));
  },

  _alphabet(C) {
    const by = new Map();
    for (const L of C.letters) {
      const e = by.get(L.weight) || { n: 0, types: new Set() };
      e.n++; e.types.add(L.type); by.set(L.weight, e);
    }
    document.getElementById("orbAlpha").innerHTML = [...by.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([w, e]) => `<tr><td class="num">${w}</td><td class="num">${e.n}</td>`
                     + `<td>${[...e.types].join(", ")}</td></tr>`).join("");
    const nonDiag = C.letters.filter((L) => L.weight > 1).length;
    const v = document.getElementById("orbAlphaV");
    v.className = "verdict " + (nonDiag ? "breaks" : "stable");
    v.innerHTML = `<b>${orbShape(C.letters)}</b><span>${
      nonDiag ? nonDiag + " of the " + C.letters.length + " letters carry weight above one, so "
                + "that many boundary conditions are not diagonal"
              : "every letter has weight one, so every boundary condition here is diagonal"
    }</span>`;
  },

  _count(C) {
    const rows = [];
    const upto = Math.max(0, Math.min(ORB_S.N + 2, C.cap));
    const enumerated = C.cap >= 1 ? classCount(C.A, C.m, ORB_S.family, upto) : [];
    const far = C.P ? countFromSeries(C.P, C.ws, 40) : null;
    for (let N = 0; N <= upto; N++)
      rows.push(`<tr><td class="num">${N}</td><td class="num">${
        enumerated[N].toLocaleString("en")}</td><td>enumerated</td></tr>`);
    if (far) {
      for (const N of [Math.max(upto + 4, 12), 20, 40]) {
        if (N <= upto) continue;
        rows.push(`<tr><td class="num">${N}</td><td class="num">${
          far[N].toLocaleString("en")}</td><td>closed form</td></tr>`);
      }
    }
    document.getElementById("orbCount").innerHTML = rows.join("");
    const d = predictedDegree(C.sig, ORB_S.family);
    const s = document.getElementById("orbSeries");
    if (!C.P) {
      s.innerHTML = `Degree <b>${d}</b>, from the signature (${C.sig.join(", ")}) alone — which
        costs nothing and is the number a proposed count has to match. <b>No closed form here:</b>
        ${C.seriesWhy}. That is a limit of this page, not of the object.
        <span class="chip">UNAUDITABLE</span></span>`;
      return;
    }
    const den = C.ws.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {});
    s.innerHTML = `Degree <b>${d}</b>, predicted from the signature (${C.sig.join(", ")}) alone.
      The count is the Hilbert function of the semigroup, so its series is
      <b>P(x) / ∏(1−x<sup>w</sup>)</b> with denominator ${Object.entries(den)
        .map(([w, n]) => `(1−x<sup>${w}</sup>)<sup>${n}</sup>`).join("")} and numerator
      <b>[${C.P.join(", ")}]</b>. That the numerator <i>terminates</i> is checked, not assumed —
      the ranks past ${C.cap} come from its recurrence, with nothing enumerated.
      <span class="chip thm">theorem</span>`;
  },

  _data(C) {
    const head = `<thead><tr><th>letter</th><th class="num">weight</th>`
      + C.cones.map((c, i) => `<th>cone ${i + 1} (order ${c.order})</th>`).join("")
      + `</tr></thead>`;
    const rows = C.letters.map((L, i) =>
      `<tr><td class="num">${i + 1}</td><td class="num">${L.weight}</td>`
      + L.datum.map((v) => `<td><code>(${v.join(",")})</code></td>`).join("") + `</tr>`).join("");
    document.getElementById("orbData").innerHTML = head + "<tbody>" + rows + "</tbody>";
  },

  _honesty(C) {
    document.getElementById("orbHonesty").innerHTML =
      `<p style="margin:0"><b>Orbifolds with mirror boundary are out of scope.</b> There the point
       group contains reflections, the fixed-character strata are not all finite, and the count is
       not |det(I−A<sup>k</sup>)|. Separating the discrete stratum is exactly what Part IX-A says it
       does not do.</p>
       <p style="margin:9px 0 0"><b>The picture is capped and the count is not.</b> The fibres are
       enumerated, so the panels stop at rank ${C.cap} for this alphabet of ${C.letters.length}
       letters; the closed form has no such limit and the table says which rows came from which.</p>
       <p style="margin:9px 0 0"><b>A matrix of infinite order is refused, not classified.</b> That
       is the crystallographic restriction appearing as a property of the input rather than as a
       rule anyone typed.</p>
       <p style="margin:9px 0 0"><b>On T²/Z₂ all three real forms agree</b> — every label is a
       character of order 2, hence real — so the published statement that the orthogonal and unitary
       classifications coincide there is the SO(N) half of a three-way coincidence. It fails as soon
       as the orbifold has a cone point of order greater than two, which you can see by switching
       family on any of the others.</p>`;
  },
};

function orbShape(letters) {
  const by = new Map();
  for (const L of letters) by.set(L.weight, (by.get(L.weight) || 0) + 1);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([w, n]) => n + "×" + w).join("+");
}

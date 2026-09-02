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
const ORB_ROT = {
  "S1/Z2": { label: "S¹/Z₂", A: [[-1]], rank: 1 },
  "T2/Z2": { label: "T²/Z₂", A: [[-1, 0], [0, -1]], rank: 2 },
  "T2/Z3": { label: "T²/Z₃", A: [[0, -1], [1, -1]], rank: 2 },
  "T2/Z4": { label: "T²/Z₄", A: [[0, -1], [1, 0]], rank: 2 },
  "T2/Z6": { label: "T²/Z₆", A: [[1, -1], [1, 0]], rank: 2 },
};

/* Enumerating the fibres costs multisets, so the rank the PICTURE can reach is bounded by the
 * alphabet.  The bound is derived from the alphabet rather than typed, and it is displayed. */
function orbFibreCap(ws) {
  const n = ws.length;
  if (n <= 5) return 12;
  if (n <= 8) return 9;
  if (n <= 10) return 7;
  return 6;
}

function orbState() {
  const key = ORB_S.orbifold + "|" + ORB_S.family;
  if (ORB_S.cache && ORB_S.cache.key === key) return ORB_S.cache;
  const { A, label, rank } = ORB_ROT[ORB_S.orbifold];
  const m = orderOf(A);
  const cones = conePoints(A, m);
  const sig = cones.map((c) => c.order);
  const letters = realForm(A, m, ORB_S.family);
  const ws = letters.map((L) => L.weight);
  const need = ws.reduce((s, w) => s + w, 0);
  /* the numerator is exact and cheap once, and it is what lets every later rank be free */
  let P = null, seriesError = null;
  try { P = hilbertNumerator(classCount(A, m, ORB_S.family, need + 1), ws); }
  catch (e) { seriesError = e.message; }
  ORB_S.cache = { key, A, m, label, rank, cones, sig, letters, ws, P, seriesError,
                  cap: orbFibreCap(ws), coords: datumCoordinates(A, m) };
  return ORB_S.cache;
}

const ORBIFOLD_SECTION = {
  id: "orbifold",
  label: "Classify an orbifold",
  paper: "Part IX-A · The Alphabet of Orbifold Boundary Conditions",
  ready: true,
  modules: [],

  holds() {
    const C = orbState();
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

    this._axes(ctx, C);
    this._field(C);
    this._alphabet(C);
    this._count(C);
    this._data(C);
    this._honesty(C);
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
    const upto = Math.min(ORB_S.N + 2, C.cap);
    const enumerated = classCount(C.A, C.m, ORB_S.family, upto);
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
      s.innerHTML = `<b>The series did not terminate.</b> ${C.seriesError} — so this page will not
        offer a closed form for it. <span class="chip">UNAUDITABLE</span>`;
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

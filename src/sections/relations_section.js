/* relations_section.js — "Name the relations": what your configuration already is, and what moves
 * inside a class.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part IX-B's service to somebody else's work, and it is mostly ATTRIBUTION.  The classes are the
 * fibres of a marginal map, so they are indexed by an affine semigroup — and naming that semigroup
 * turns out to be an exercise in finding out that it already has a name, a literature, and a table
 * of its invariants published seventeen years ago.  A page that saves a reader from re-deriving
 * that is worth more than one that shows them ours.
 *
 * SO THE DICTIONARY ONLY SAYS WHAT THE PAPER SAYS.  It names the cut configuration of C_4 for
 * T^2/Z_2 and of W_4 for the product orbifold, because those are stated and verified as equalities
 * of point configurations; it names the group-based phylogenetic model on a claw tree when the cone
 * orders are equal; and where the orders differ it says that the mixed-order variant is one WE DO
 * NOT FIND in the literature, which is a statement about our search and not about the field.  For
 * anything it has no entry for it says so.  A dictionary that guesses is worse than no dictionary.
 *
 * AND THE WALK IS THE OTHER HALF.  Sturmfels and Sullivant prove a graph with a K_4 minor has a
 * degree-four minimal generator in its cut ideal; Engstrom proved the converse.  Whether degree-two
 * moves connect a fibre or leave it in pieces is that theorem, applied to the graph the orbifold
 * defines — and it is visible by counting components as the allowed degree goes up.  Someone
 * proposing a move set finds out here that theirs is not enough.
 *
 * WHAT IS COMPUTED AND WHAT IS READ.  Everything about a CYCLIC point group is derived from the
 * rotation on this page.  The product orbifold is not of that form — its orbit space is a rectangle
 * with mirror edges — and §8 of Part IX-A leaves orbifolds with mirror boundary open, so its row is
 * SUPPLIED from the published table and is labelled as read rather than computed.  The two are
 * never mixed in one column.
 */
const REL_S = { orbifold: "T2/Z2", family: "SU", N: 4, degree: 2, pick: null, cache: null };

/* Only what Part IX-B states.  `computed` marks whether this page derives the row or reads it. */
const REL_DICT = {
  "T2/Z2": {
    name: "the cut configuration of the four-cycle C₄",
    cite: "Sturmfels–Sullivant, <i>Toric geometry of cuts and splits</i>, Michigan Math. J. "
        + "<b>57</b> (2008) 689–709 — their Example 1.2",
    known: "They compute I(C₄) and find the variety is a <b>complete intersection of three "
         + "quadrics</b>; their Table 1 records codimension 3 and degree 8. Verified here as an "
         + "equality of point configurations, not a resemblance.",
    computed: true,
  },
  "T2/Z3": {
    name: "the group-based phylogenetic model on a claw tree",
    cite: "Sturmfels–Sullivant, <i>Toric ideals of phylogenetic invariants</i>",
    known: "The cone orders are all equal, which is the case the group-based literature treats.",
    computed: true,
  },
  "T2/Z4": { mixed: true }, "T2/Z6": { mixed: true },
  "S1/Z2": {
    name: "not named in Part IX-B",
    cite: "",
    known: "The note names the cut configuration for T²/Z₂ and for the product orbifold, and the "
         + "group-based model when the cone orders are equal. It does not give this one a name, "
         + "and neither does this page.",
    computed: true,
  },
  /* SUPPLIED, not derived: the product orbifold has mirror boundary and is outside the preflight. */
  "PRODUCT": {
    name: "the cut configuration of the wheel W₄ — the binary hierarchical model of a "
        + "cross-polytope boundary complex",
    cite: "Sturmfels–Sullivant 2008, a row of their Table 1",
    known: "8 minimal generators of degree 2 and 8 of degree 4, codimension 7, degree 64, normal, "
         + "Cohen–Macaulay, <b>not</b> Gorenstein — and the h*-vector (1,7,20,28,7,1), which sums "
         + "to 64. Part IX-B's machinery returned every one of those by routes that do not "
         + "communicate, seventeen years after the row was published.",
    computed: false,
  },
};

const REL_ROT = {
  "S1/Z2": { label: "S¹/Z₂", A: [[-1]] },
  "T2/Z2": { label: "T²/Z₂", A: [[-1, 0], [0, -1]] },
  "T2/Z3": { label: "T²/Z₃", A: [[0, -1], [1, -1]] },
  "T2/Z4": { label: "T²/Z₄", A: [[0, -1], [1, 0]] },
  "T2/Z6": { label: "T²/Z₆", A: [[1, -1], [1, 0]] },
};

function relState() {
  const key = REL_S.orbifold + "|" + REL_S.family + "|" + REL_S.N;
  if (REL_S.cache && REL_S.cache.key === key) return REL_S.cache;
  const { A, label } = REL_ROT[REL_S.orbifold];
  const m = orderOf(A);
  const sig = coneSignature(A, m);
  const letters = realForm(A, m, REL_S.family);
  const ws = letters.map((L) => L.weight);
  const need = ws.reduce((s, w) => s + w, 0);
  let P = null;
  try { P = hilbertNumerator(classCount(A, m, REL_S.family, need + 1), ws); } catch (e) { P = null; }
  const F = fibres(A, m, REL_S.family, REL_S.N);
  /* the biggest fibres first: a fibre of one member has nothing to show about moves */
  const ranked = [...F.fibres.entries()].map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.members.length - a.members.length);
  /* `cones` belongs in here and was not: the referee and the letter table both read it, and both
   * came back "cannot read properties of undefined" from inside the built page.  Taken from the
   * fibre walk rather than recomputed, so there is one set of cones and not two that could drift. */
  REL_S.cache = { key, A, m, label, sig, letters, ws, P, ranked, F, cones: F.cones };
  if (!REL_S.pick || !F.fibres.has(REL_S.pick)) REL_S.pick = ranked[0] ? ranked[0].key : null;
  return REL_S.cache;
}

const RELATIONS_SECTION = {
  id: "relations",
  label: "Name the relations",
  paper: "Part IX-B · An Affine Semigroup from Orbifold Boundary Conditions",
  ready: true,
  modules: [],

  holds() {
    const C = relState();
    const d = C.P ? relTopDegree(C.P) : "—";
    return `${C.label} · ${REL_S.family}(N) · rank ${REL_S.N} · `
         + `${C.ranked.length} classes · relations up to degree ${d}`;
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">The classes are the fibres of a marginal map, so they are indexed by an
    <b>affine semigroup</b> — one generator per letter of the alphabet. Naming that semigroup is
    mostly an exercise in <b>attribution</b>: over Z₂ it is a cut configuration with a literature
    and a published table of invariants, and the useful thing this page can do is stop you deriving
    it again. <span class="chip">verified</span></p>
  </div>

  <div class="card" style="margin-bottom:18px">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="relOrb"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="relFam"></div>
    <div class="rowm">
      <span class="nm" style="flex:1">rank N</span>
      <button class="st" data-n="-1">−</button><span class="cnt" id="relN">—</span>
      <button class="st" data-n="1">+</button>
    </div>
    <div class="rowm" style="margin-top:8px">
      <span class="nm" style="flex:1">moves allowed, up to degree</span>
      <button class="st" data-d="-1">−</button><span class="cnt" id="relD">—</span>
      <button class="st" data-d="1">+</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>What this configuration already is</h2>
    <div id="relDict">—</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h2>Judge a proposed relation</h2>
    <p class="note" style="margin:0 0 10px">§8 of Part IX-A, made usable: <b>a proposed relation
    that moves a local datum is wrong</b>, and the check costs seconds and does not need the
    classification to be finished. Write the swap as letter numbers &mdash;
    <code>7 8 -&gt; 5 6</code> &mdash; and it is judged against the data below. A refusal names the
    cone and the root of unity where the two sides part company, because &ldquo;wrong&rdquo; helps
    nobody.</p>
    <input id="relMove" spellcheck="false" value="7 8 -> 5 6" style="width:100%;
      font-family:ui-monospace,monospace;font-size:13px;padding:8px;
      border:1px solid var(--line,#dde3ea);border-radius:6px">
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <button class="ghost" id="relJudge">judge it</button>
      <span class="note" id="relMoveNote"></span>
    </div>
    <div class="verdict stable" id="relMoveV" style="margin-top:12px"><b>&mdash;</b><span>&mdash;</span></div>
    <div style="overflow-x:auto;margin-top:12px"><table id="relLetters"></table></div>
  </div>

  <div class="grid two">
    <div class="card">
      <h2>Walk a class</h2>
      <p class="note" style="margin:0 0 10px">Every boundary condition in one class, joined when a
      move of the allowed degree takes one to the other. Lower the degree and watch it come apart.
      </p>
      <canvas id="relGraph" style="width:100%;display:block"></canvas>
      <div class="verdict stable" id="relVerdict" style="margin-top:12px"><b>—</b><span>—</span></div>
    </div>
    <div class="card">
      <h2>The degree the moves need</h2>
      <p class="note" style="margin:0 0 10px">Two computations that share no code path: the Hilbert
      numerator names the relation degrees without ever looking at a fibre, and the walk finds where
      the fibres connect without ever forming a series.</p>
      <div style="overflow-x:auto"><table><thead><tr><th class="num">degree</th>
        <th class="num">fibres still in pieces</th><th class="num">largest piece</th></tr></thead>
        <tbody id="relLadder"></tbody></table></div>
      <div class="note" id="relSeries" style="margin-top:10px">—</div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("relOrb").innerHTML = Object.keys(REL_ROT).map((k) =>
      `<button class="ghost" data-orb="${k}">${REL_ROT[k].label}</button>`).join("");
    $("relOrb").querySelectorAll("button").forEach((b) => {
      b.onclick = () => { REL_S.orbifold = b.dataset.orb; REL_S.cache = null; REL_S.pick = null;
                          ctx.refresh(); };
    });
    $("relFam").innerHTML = ["SU", "SO", "Sp"].map((k) =>
      `<button class="ghost" data-fam="${k}">${k}(N)</button>`).join("");
    $("relFam").querySelectorAll("button").forEach((b) => {
      b.onclick = () => { REL_S.family = b.dataset.fam; REL_S.cache = null; REL_S.pick = null;
                          ctx.refresh(); };
    });
    document.querySelectorAll("#relOrb ~ .rowm button").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.n) {
          const n = REL_S.N + (+b.dataset.n);
          if (n < 2 || n > 7) return;
          REL_S.N = n; REL_S.cache = null; REL_S.pick = null;
        } else {
          const d = REL_S.degree + (+b.dataset.d);
          if (d < 1 || d > 10) return;
          REL_S.degree = d;
        }
        ctx.refresh();
      };
    });
  },

  _judge() {
    const C = relState();
    const raw = document.getElementById("relMove").value;
    const parts = raw.split(/-+>|\u2192/);
    const note = document.getElementById("relMoveNote");
    const v = document.getElementById("relMoveV");
    if (parts.length !== 2) {
      note.innerHTML = '<b style="color:#b3262b">write it as one side, an arrow, the other side'
        + ' &mdash; for example 7 8 -&gt; 5 6</b>';
      /* AND CLEAR THE VERDICT.  Leaving the previous one standing while the note complains is how
       * a stale answer gets read as a current one — the same shape as the header that kept the old
       * orbifold on screen after a matrix was refused. */
      v.className = "verdict";
      v.innerHTML = "<b>&mdash;</b><span>nothing judged: the input has no arrow</span>";
      return;
    }
    const side = (s) => s.trim().split(/[\s,+]+/).filter(Boolean).map((x) => Number(x) - 1);
    const r = checkMove(C.letters, C.cones, side(parts[0]), side(parts[1]));
    note.textContent = "";
    v.className = "verdict " + (r.verdict === "legitimate" ? "stable" : "breaks");
    let detail = r.why;
    if (r.moved && r.moved.length) {
      const first = r.moved[0];
      detail += ". First at cone " + (first.cone + 1) + " of order " + first.order
        + ", on the root zeta^" + first.root + ": the left side reads " + first.left
        + " and the right " + first.right
        + (r.moved.length > 1 ? ", and " + (r.moved.length - 1) + " more entries differ" : "");
    }
    v.innerHTML = "<b>" + r.verdict + "</b><span>" + detail + "</span>";
  },

  _letters(C) {
    const head = "<thead><tr><th class=\"num\">letter</th><th class=\"num\">weight</th>"
      + C.cones.map((c, i) => "<th>cone " + (i + 1) + " (order " + c.order + ")</th>").join("")
      + "</tr></thead>";
    const rows = C.letters.map((L, i) =>
      "<tr><td class=\"num\">" + (i + 1) + "</td><td class=\"num\">" + L.weight + "</td>"
      + L.datum.map((d) => "<td><code>(" + d.join(",") + ")</code></td>").join("") + "</tr>").join("");
    document.getElementById("relLetters").innerHTML = head + "<tbody>" + rows + "</tbody>";
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    const C = relState();
    $("relN").textContent = REL_S.N;
    $("relD").textContent = REL_S.degree;
    $("relOrb").querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.orb === REL_S.orbifold));
    $("relFam").querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.fam === REL_S.family));
    this._dict(C);
    this._letters(C);
    this._graph(C);
    this._ladder(C);
    const j = document.getElementById("relJudge");
    if (j && !j._wired) { j._wired = true; j.onclick = () => this._judge(); }
  },

  _dict(C) {
    const d = REL_DICT[REL_S.orbifold];
    const el = document.getElementById("relDict");
    const equal = C.sig.every((e) => e === C.sig[0]);
    if (d && d.mixed) {
      el.innerHTML = `<p style="margin:0"><b>A mixed-order variant.</b> The cone orders here are
        (${C.sig.join(", ")}) and they are <b>not equal</b>, so this is not the group-based model
        the literature treats; it is a mixed-order variant of it, and one <b>we do not find</b> in
        the literature. That is a statement about our search, not about the field.
        <span class="chip">UNAUDITABLE</span></p>`;
      return;
    }
    if (!d) { el.innerHTML = `<p class="note" style="margin:0">No entry. This page does not guess a
      name for a configuration Part IX-B does not name.</p>`; return; }
    el.innerHTML = `<p style="margin:0"><b>${d.name}</b>${d.cite ? " — " + d.cite : ""}</p>
      <p style="margin:9px 0 0">${d.known}</p>
      <p style="margin:9px 0 0" class="note">Cone orders (${C.sig.join(", ")}), ${
        equal ? "all equal" : "not all equal"}. ${d.computed
          ? `Everything on this page for it is <b>derived</b> from the rotation matrix.
             <span class="chip thm">theorem</span>`
          : `This row is <b>read</b> from the published table, not computed here.
             <span class="chip">verified</span>`}</p>`;
  },

  _graph(C) {
    const c = document.getElementById("relGraph");
    if (!c) return;
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    const w = c.clientWidth || 560, h = 300;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext("2d"); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const f = C.F.fibres.get(REL_S.pick);
    const v = document.getElementById("relVerdict");
    if (!f || f.members.length < 2) {
      g.fillStyle = "rgba(90,105,120,.75)"; g.font = "13px ui-sans-serif,system-ui";
      g.textAlign = "center";
      g.fillText("the largest class at this rank holds one condition — nothing to move", w / 2, h / 2);
      v.className = "verdict stable";
      v.innerHTML = "<b>one member</b><span>at this rank every class is a single boundary "
                  + "condition, so the moves have nothing to do</span>";
      return;
    }
    const comp = fibreComponents(f.members, C.ws, REL_S.degree);
    const n = f.members.length;
    const R = Math.min(w, h) / 2 - 34;
    const pos = f.members.map((_, i) => {
      const a = 2 * Math.PI * i / n - Math.PI / 2;
      return [w / 2 + R * Math.cos(a), h / 2 + R * Math.sin(a)];
    });
    g.strokeStyle = "rgba(60,110,160,.55)"; g.lineWidth = 1.3;
    let edges = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (moveDegree(f.members[i], f.members[j], C.ws) > REL_S.degree) continue;
      edges++;
      g.beginPath(); g.moveTo(pos[i][0], pos[i][1]); g.lineTo(pos[j][0], pos[j][1]); g.stroke();
    }
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.arc(pos[i][0], pos[i][1], 7, 0, 2 * Math.PI);
      g.fillStyle = "#2f6ea8"; g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
    }
    v.className = "verdict " + (comp.components === 1 ? "stable" : "breaks");
    v.innerHTML = `<b>${comp.components === 1 ? "connected" : comp.components + " pieces"}</b>`
      + `<span>${n} boundary conditions, ${edges} moves of degree ≤ ${REL_S.degree}`
      + (comp.components === 1
          ? " — the allowed moves reach every member of the class"
          : `, and the class is still in ${comp.components} pieces of sizes ${
              comp.sizes.join(", ")}: these moves are NOT enough`) + `</span>`;
  },

  _ladder(C) {
    const rows = [];
    for (let d = 1; d <= 8; d++) {
      let broken = 0, biggest = 0;
      for (const f of C.F.fibres.values()) {
        if (f.members.length < 2) continue;
        const c = fibreComponents(f.members, C.ws, d);
        if (c.components > 1) broken++;
        if (c.sizes[0] > biggest) biggest = c.sizes[0];
      }
      rows.push(`<tr${d === REL_S.degree ? ' style="font-weight:600"' : ""}>`
        + `<td class="num">${d}</td><td class="num">${broken}</td>`
        + `<td class="num">${biggest}</td></tr>`);
    }
    document.getElementById("relLadder").innerHTML = rows.join("");
    const s = document.getElementById("relSeries");
    if (!C.P) { s.textContent = "The series did not terminate here, so it names no degrees."; return; }
    const deg = relationDegreesFromNumerator(C.P).map((r) => r.degree);
    s.innerHTML = `The numerator <b>[${C.P.join(", ")}]</b> names degrees <b>${deg.join(", ")}</b>.
      The walk above must connect at or below the largest of them, and it never looked at a series
      to do it. <span class="chip thm">theorem</span> <span class="chip">verified</span>`;
  },
};

function relTopDegree(P) {
  const d = relationDegreesFromNumerator(P).map((r) => r.degree);
  return d.length ? Math.max(...d) : "—";
}

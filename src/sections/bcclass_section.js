/* bcclass_section.js — "Boundary conditions": which of them are the same theory, and which is preferred.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE ARBITRARINESS PROBLEM, WHICH IS THE FIRST THING A MODEL BUILDER MEETS.  Putting a gauge
 * theory on an orbifold means choosing boundary conditions at the fixed points, and there are a
 * lot of them.  Some are related by a gauge transformation and are therefore the SAME theory:
 * they form an equivalence class, and only the class is physics.  Two things follow, and both are
 * things you need before you compute anything else:
 *
 *   the apparent unbroken symmetry is NOT an invariant — SU(5) with [2,0,0,3] looks like
 *   SU(3)×SU(2)×U(1) and [1,1,1,2] looks like SU(2)×U(1)³, and they are one theory;
 *
 *   and a survey over boundary conditions that does not quotient by this counts the same model
 *   over and over.
 *
 * The panel does the quotient, on both orbifolds where the classification is settled, and then
 * asks HHK's question of the class you land in: which of its members has the lowest vacuum energy
 * at vanishing Wilson line?  With the part of that comparison which is legitimate separated, on
 * screen, from the part which is not.
 *
 * IT LOCKS TO THE SU(N) BUILDER.  A boundary condition here is [p, q, r, s], and those are the
 * same four block sizes the builder takes — HHK eq. (2.10) is Haba–Yamashita eq. (5.1).  So the
 * class tells you which OTHER boundary conditions the builder will draw a different potential
 * for while being the same theory, which is the Hosotani mechanism seen from the other side.
 *
 * Edited BY HAND.
 */
const BCC_S = {
  orbifold: "S1/Z2",
  N: 5,
  bc: [2, 0, 0, 3],
  matter: { scalarF: { "++": 0 }, diracF: { "++": 0 }, diracA: { "++": 0 } },
  cache: null,
  panels: null,
  plane: null,
};

/* THE CLASS INVARIANT, and the coordinates that make its lattice complete.
 *
 * The only relation on S1/Z2 is [p,q,r,s] ~ [p-1,q+1,r+1,s-1], which leaves p-s and q-r alone, so a
 * class carries that pair.  Their sum and difference always share N's parity, which empties half of
 * the (p-s, q-r) box for arithmetic reasons and nothing else -- so the halved coordinates below are
 * a change of basis on the same lattice, not a rebinning, and in them the lattice is FULL. */
const bccUV = (N, [p, q, r, s]) => {
  const o = N % 2 ? 1 : 0;
  return [((p - s) + (q - r) - o) / 2, ((p - s) - (q - r) - o) / 2];
};

const BCC_SECTION = {
  id: "bcclass",
  label: "Boundary conditions",
  paper: "Haba–Hosotani–Kawamura 2004 · Takeuchi–Inagaki 2024",
  ready: true,
  modules: [],

  holds() {
    const C = BCC_S.cache;
    return `SU(${BCC_S.N}) · ${ORBIFOLDS[BCC_S.orbifold].label} · ${bcShow(BCC_S.bc)} → ` +
           `${bcUnbroken(BCC_S.bc)}` +
           (C ? ` · class ${C.of(BCC_S.bc) + 1} of ${C.nClasses}` : "");
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Putting a gauge theory on an orbifold means <b>choosing</b> boundary conditions
    at the fixed points, and there are many. Some of them are related by a gauge transformation,
    so they are the <b>same theory</b> wearing different clothes. Only the class is physics — and
    the apparent unbroken symmetry is <b>not</b> a property of the class.</p>
    <div class="note" style="margin-top:9px">On <b>S¹/Z₂</b> a boundary condition is a pair of Z₂
    parities, so four block sizes [p, q, r, s] — the same four numbers the SU(N) builder takes.
    The only relation is <b>[p, q, r, s] ~ [p−1, q+1, r+1, s−1]</b>: Haba–Hosotani–Kawamura,
    <i>PTP</i> <b>111</b> (2004) 265, eq. (2.21), and re-derived twenty years later by
    Takeuchi–Inagaki (<i>PTEP</i> 2024 033B03) from the <b>trace conservation</b> at each fixed
    point alone — a geometric fact about the orbifold, using nothing about the gauge
    transformations. On <b>T²/Z₃</b> the same argument gives their eq. (46), and the answer is
    different. This page computes the orbits; every count below comes out of that and is not
    quoted. <span class="chip thm">theorem</span></div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The boundary condition${helpMark("boundary-condition")}</h2>
        <div style="display:flex;gap:6px;margin-bottom:11px;flex-wrap:wrap" id="bccOrb"></div>
        <div class="rowm" id="bccNCtl">
          <span class="nm" style="flex:1">N</span>
          <button class="st" data-n="-1">−</button>
          <span class="cnt" id="bccN">—</span>
          <button class="st" data-n="1">+</button>
        </div>
        <div id="bccCells"></div>
        <div class="verdict breaks" id="bccWhich" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Its equivalence class${helpMark("equivalence-class")}</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>boundary condition</th>
          <th>apparent unbroken symmetry</th><th class="num">N_v</th></tr></thead>
          <tbody id="bccMembers"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="bccMembersNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>How many classes there are</h2>
        <div style="overflow-x:auto"><table><thead><tr><th class="num">N</th>
          <th class="num">boundary conditions</th><th class="num">classes</th>
          <th class="num">relations</th><th>label complete?</th></tr></thead>
          <tbody id="bccCount"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="bccCountNote">—</div>

        <h2 style="margin-top:20px">The same computation on T²/Z₆</h2>
        <p class="lead">Not one of the two above — the cells, the energy and the unbroken group of
        this page are S¹/Z₂ and T²/Z₃ objects. What T²/Z₆ shares is the only thing this table
        needs: states, and moves between them. So it goes through the <i>same</i> orbit walk.</p>
        <div class="note" style="margin-bottom:9px">A state is
        <code>(b₀,b₁,b₂ | c₀,c₁ | d₀…d₅)</code>: how many 2×2 blocks of each label, how many 3×3
        blocks of each label, and how many diagonal entries of each of the six patterns. The moves
        are Takeuchi–Inagaki's own reductions — three 2×2 blocks of distinct label, and two 3×3 of
        distinct label, become diagonal, and in both cases the eigenvalues that come out are the six
        sixth roots of unity, so each reduction gives exactly one of each diagonal pattern.</div>
        <div style="overflow-x:auto"><table><thead><tr><th class="num">N</th>
          <th class="num">states</th><th class="num">diagonal</th><th class="num">C(N+5,5)</th>
          <th class="num">off-diagonal</th><th class="num">their sum</th>
          <th class="num">their eq. (5.9)</th><th class="num">closed form</th></tr></thead>
          <tbody id="bccZ6"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="bccZ6Note">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Which member the energy prefers</h2>
        <p class="note" style="margin:0 0 10px">The one-loop vacuum energy density at vanishing
        Wilson line, HHK eq. (3.25). Add bulk matter and the preference moves.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>bulk field</th><th>ηη′</th>
          <th class="num">how many</th></tr></thead><tbody id="bccMatter"></tbody></table></div>
        <div class="verdict stable" id="bccEnergy" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What cannot be compared, and why</h2>
        <div id="bccHonesty" class="note">—</div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Every class at once</h2>
    <p class="note" style="margin:0 0 10px">One cell is one class, and the height is how many
    boundary conditions are in it. The lattice is <b>complete</b> — there is nothing to grey —
    because the two invariants <code>p−s</code> and <code>q−r</code> take every value they can.
    <b>Click a cell to load that class</b>: the panels above follow.</p>
    <div class="pair">
      <canvas id="bccMap" style="width:100%;display:block"></canvas>
      <canvas id="bccSurf" style="width:100%;display:block"></canvas>
    </div>
    <div class="note" id="bccCap" style="margin-top:9px">—</div>
    <div id="bccPick" style="margin-top:10px"></div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    BCC_S.panels = mountFibrePanels({
      ids: { map: "bccMap", surf: "bccSurf", cap: "bccCap" },
      height: 300,
      labels: ["(p−s + q−r)/2", "(p−s − q−r)/2"],
      caption: (f) =>
        f.classes.toLocaleString("en") + " classes — one per cell, and every cell is one — over "
        + f.conditions.toLocaleString("en") + " boundary conditions. The map from a class to its "
        + "cell is a bijection here, so this is the object and not a shadow of it: nothing is "
        + "greyed because nothing is missing.",
      onPick: (p) => BCC_SECTION._planePick(ctx, p),
    });
    BCC_S.panels.attach();
    $("bccOrb").innerHTML = Object.keys(ORBIFOLDS).map((k) =>
      `<button class="ghost" data-orb="${k}">${ORBIFOLDS[k].label}</button>`).join("");
    $("bccOrb").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        BCC_S.orbifold = b.dataset.orb;
        /* T²/Z₃ enumerates C(N+8,8) boundary conditions, so the default N comes down with it —
         * an honest limit stated rather than a page that hangs */
        BCC_S.N = BCC_S.orbifold === "T2/Z3" ? Math.min(BCC_S.N, 4) : BCC_S.N;
        BCC_S.bc = this._defaultBC();
        BCC_S.cache = null;
        ctx.refresh();
      };
    });
    /* the container, not `parentElement` of the readout: a stub document in the smoke harness has
     * no parent chain, and reaching for one there is how the section threw for everybody */
    $("bccNCtl").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const n = BCC_S.N + +b.dataset.n;
        const max = BCC_S.orbifold === "T2/Z3" ? 6 : 16;
        if (n < 1 || n > max) return;
        BCC_S.N = n;
        BCC_S.bc = this._defaultBC();
        BCC_S.cache = null;
        ctx.refresh();
      };
    });
  },

  _defaultBC() {
    const k = BCC_S.orbifold === "T2/Z3" ? 9 : 4;
    const bc = new Array(k).fill(0);
    bc[0] = BCC_S.N;
    if (BCC_S.orbifold === "S1/Z2" && BCC_S.N >= 5) return [2, 0, 0, BCC_S.N - 2];
    return bc;
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    if (!BCC_S.cache || BCC_S.cache.N !== BCC_S.N || BCC_S.cache.orbifold !== BCC_S.orbifold)
      BCC_S.cache = bcClasses(BCC_S.N, BCC_S.orbifold);
    const C = BCC_S.cache;
    if (BCC_S.bc.reduce((a, b) => a + b, 0) !== BCC_S.N ||
        BCC_S.bc.length !== ORBIFOLDS[BCC_S.orbifold].cells) BCC_S.bc = this._defaultBC();
    $("bccN").textContent = String(BCC_S.N);
    $("bccOrb").querySelectorAll("button").forEach((b) => {
      const on = b.dataset.orb === BCC_S.orbifold;
      b.style.color = on ? "var(--rust)" : "";
      b.style.fontWeight = on ? "650" : "";
    });
    this._cells(ctx);
    this._which(ctx, C);
    this._members(ctx, C);
    this._count(ctx, C);
    this._matter(ctx);
    this._energy(ctx, C);
    this._honesty(ctx, C);
    this._plane(ctx, C);
  },

  /* ---------------------------------------------------------------- every class at once */

  _plane(ctx, C) {
    const cap = document.getElementById("bccCap"), box = document.getElementById("bccPick");
    /* ON T2/Z3 A BOUNDARY CONDITION IS A 3x3 MATRIX and this pair of invariants is not its class.
     * Drawing the same square anyway would be inventing an object, so the panel refuses where the
     * picture would have been -- the same rule the orbifold page follows for a rotation it cannot
     * classify. */
    if (BCC_S.orbifold !== "S1/Z2") {
      BCC_S.plane = null;
      BCC_S.panels.set({ classes: 0, conditions: 0 },
                       { vals: [null], nx: 1, ny: 1, xlo: 0, ylo: 0, aspect: [1, 1] });
      if (cap) cap.textContent = "";
      if (box) box.innerHTML =
        '<div class="verdict breaks"><b>no plane here</b><span>On '
        + ORBIFOLDS[BCC_S.orbifold].label + " a boundary condition is a 3\u00d73 matrix of "
        + "multiplicities, and p\u2212s, q\u2212r are not its class invariants. The orbit walk "
        + "above is unaffected; this picture is the one that does not exist.</span></div>";
      return;
    }

    const N = BCC_S.N;
    let xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity, conditions = 0;
    const at = new Map();
    for (const c of C.classes) {
      const [u, v] = bccUV(N, c.members[0]);
      at.set(u + "," + v, c);
      conditions += c.size;
      if (u < xlo) xlo = u; if (u > xhi) xhi = u;
      if (v < ylo) ylo = v; if (v > yhi) yhi = v;
    }
    const nx = xhi - xlo + 1, ny = yhi - ylo + 1;
    const vals = new Array(nx * ny).fill(null);
    for (const [k, c] of at) {
      const [u, v] = k.split(",").map(Number);
      vals[(v - ylo) * nx + (u - xlo)] = c.size;
    }
    BCC_S.plane = { at, xlo, ylo, nx, ny };
    BCC_S.panels.set({ classes: C.classes.length, conditions },
                     { vals, nx, ny, xlo, ylo, aspect: [nx, ny] });
    this._planePick(ctx, BCC_S.panels.mark());
  },

  /* what is in the class the reader pointed at -- and pointing at it LOADS it, so the rest of the
   * section follows the pointer instead of the reader having to retype a member by hand */
  _planePick(ctx, p) {
    const box = document.getElementById("bccPick");
    if (!box) return;
    const P = BCC_S.plane;
    if (!p || !P) { box.innerHTML = '<div class="note">Nothing picked yet.</div>'; return; }
    const c = P.at.get(p.x + "," + p.y);
    if (!c) { box.innerHTML = '<div class="note">Nothing there.</div>'; return; }

    /* load it, unless it is already loaded -- refreshing on every repaint would fight the reader */
    const mine = c.members.some((m) => m.every((x, i) => x === BCC_S.bc[i]));
    if (!mine) { BCC_S.bc = c.members[0].slice(); ctx.refresh(); return; }

    const names = new Set(c.members.map((m) => bcUnbroken(m)));
    box.innerHTML =
      '<div class="verdict ' + (names.size > 1 ? "breaks" : "stable") + '"><b>'
      + c.size + (c.size === 1 ? " boundary condition" : " boundary conditions")
      + "</b><span>one class, loaded above. "
      + (names.size > 1
          ? "Its members wear " + names.size + " different apparent symmetries — "
            + [...names].slice(0, 3).join(", ")
            + (names.size > 3 ? ", …" : "") + " — and they are one theory."
          : "All of its members wear the same apparent symmetry.")
      + "</span></div>";
  },

  /* ---------------------------------------------------------------- the cells */

  _cells(ctx) {
    const k = ORBIFOLDS[BCC_S.orbifold].cells === 4 ? 2 : 3;
    const lab = k === 2 ? ["(+,+)", "(+,−)", "(−,+)", "(−,−)"]
                        : ["(ω,ω)", "(ω,ω²)", "(ω,1)", "(ω²,ω)", "(ω²,ω²)", "(ω²,1)",
                           "(1,ω)", "(1,ω²)", "(1,1)"];
    document.getElementById("bccCells").innerHTML = BCC_S.bc.map((v, i) =>
      `<div class="rowm"><span class="nm" style="flex:1">${lab[i]}</span>` +
      `<button class="st" data-c="${i}" data-d="-1">−</button>` +
      `<span class="cnt${v ? "" : " z"}">${v}</span>` +
      `<button class="st" data-c="${i}" data-d="1">+</button></div>`).join("");
    document.getElementById("bccCells").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.c, d = +b.dataset.d;
        const next = BCC_S.bc.slice();
        next[i] += d;
        if (next[i] < 0) return;
        /* N is fixed by the steppers above, so a cell that goes up takes from somewhere: the
         * first cell that can give.  Otherwise the panel would silently change N. */
        const j = next.findIndex((v, x) => x !== i && v >= d);
        if (d > 0) { if (j < 0) return; next[j] -= d; }
        else { const back = next.findIndex((v, x) => x !== i); if (back < 0) return; next[back] -= d; }
        if (next.some((v) => v < 0) || next.reduce((a, x) => a + x, 0) !== BCC_S.N) return;
        BCC_S.bc = next;
        ctx.refresh();
      };
    });
  },

  /* ---------------------------------------------------------------- which class */

  _which(ctx, C) {
    const el = document.getElementById("bccWhich");
    const id = C.of(BCC_S.bc);
    const cl = C.classes[id];
    const M = bcMargins(BCC_S.bc);
    el.className = cl.size > 1 ? "verdict breaks" : "verdict stable";
    el.innerHTML =
      `<b>${bcShow(BCC_S.bc)} → ${bcUnbroken(BCC_S.bc)}</b>` +
      `<span>Its class has <b>${cl.size}</b> member${cl.size === 1 ? "" : "s"} out of ` +
      `${C.nBC} boundary conditions, and there are <b>${C.nClasses}</b> classes in all. ` +
      `Its invariant is the pair of eigenvalue spectra — ` +
      `(${M.rows.join(", ")}) at one fixed point and (${M.cols.join(", ")}) at the other — which ` +
      `is exactly the trace that Takeuchi–Inagaki show is conserved. ` +
      (cl.size > 1
        ? `<b>So the ${cl.size - 1} other boundary condition${cl.size === 2 ? "" : "s"} below ` +
          `${cl.size === 2 ? "is" : "are"} this same theory.</b>`
        : `This one is alone in its class: nothing else is gauge-equivalent to it.`) +
      `</span>`;
  },

  /* ---------------------------------------------------------------- the members */

  _members(ctx, C) {
    const cl = C.classes[C.of(BCC_S.bc)];
    const P = BCC_S.orbifold === "S1/Z2" ? bcPreferred(cl.members, BCC_S.matter) : null;
    const rows = cl.members.map((m) => {
      const here = m.join(",") === BCC_S.bc.join(",");
      const nv = P ? bcEnergy(m, BCC_S.matter).Nv : null;
      const win = P && !P.tied && P.winners[0].bc.join(",") === m.join(",");
      return `<tr class="clk" data-bc="${m.join(",")}"${here ? ' style="background:var(--blue-l)"'
              : win ? ' style="background:var(--green-l)"' : ""}>` +
        `<td style="font-family:var(--mono);font-size:13px">${bcShow(m)}` +
        `${here ? " ←" : ""}</td>` +
        `<td>${bcUnbroken(m)}</td>` +
        `<td class="num">${nv === null ? "—" : nv}${win ? " ★" : ""}</td></tr>`;
    }).join("");
    document.getElementById("bccMembers").innerHTML = rows;
    document.getElementById("bccMembers").querySelectorAll("tr").forEach((tr) => {
      tr.onclick = () => { BCC_S.bc = tr.dataset.bc.split(",").map(Number); ctx.refresh(); };
    });
    const syms = new Set(cl.members.map(bcUnbroken));
    document.getElementById("bccMembersNote").innerHTML = cl.size === 1
      ? `A class of one. Click any row in the table above to move — or change the boundary ` +
        `condition and watch the class change with it.`
      : `<b>${syms.size} different apparent symmet${syms.size === 1 ? "y" : "ies"} in one class.</b> ` +
        (syms.size > 1
          ? `That is the point of the whole section: which group you appear to have depends on ` +
            `where you are standing on the Wilson line, not on what the theory is. The dynamics ` +
            `picks a member — that is the Hosotani mechanism — and the column on the right says ` +
            `which one, once you give it some bulk matter.`
          : `Here they happen to coincide, which they need not.`) +
        ` Click a row to load it.`;
  },

  /* ---------------------------------------------------------------- the counts */

  _count(ctx, C) {
    const rows = [];
    const max = BCC_S.orbifold === "T2/Z3" ? 6 : 12;
    for (let N = 1; N <= max; N++) {
      const K = N === BCC_S.N ? C : bcClasses(N, BCC_S.orbifold);
      const M = bcMarginsComplete(K);
      const rel = K.classes.reduce((a, cl) => a + (cl.size - 1), 0);
      rows.push(`<tr${N === BCC_S.N ? ' style="background:var(--blue-l)"' : ""}>` +
        `<td class="num">${N}</td><td class="num">${K.nBC.toLocaleString("en")}</td>` +
        `<td class="num"><b>${K.nClasses.toLocaleString("en")}</b></td>` +
        `<td class="num">${rel.toLocaleString("en")}</td>` +
        `<td>${M.complete ? '<span class="chip ver">yes</span>'
                          : `<span class="chip bad">no</span> <span class="note">${M.nMargins} ` +
                            `margins</span>`}</td></tr>`);
    }
    document.getElementById("bccCount").innerHTML = rows.join("");
    const isS1 = BCC_S.orbifold === "S1/Z2";
    const agree = isS1 && [...Array(max).keys()].every((i) =>
      bcClasses(i + 1, "S1/Z2").nClasses === (i + 2) ** 2);
    document.getElementById("bccCountNote").innerHTML = isS1
      ? `Every row is the orbit computation, not a formula. They come out <b>(N+1)²</b> — ` +
        `${agree ? "at every N in the table" : "<b>NOT</b> at every N, which would be news"} — ` +
        `which is HHK's theorem, and the reason is in the last column: the pair of spectra is a ` +
        `<b>complete</b> label here, so there is exactly one class per (number of + at each fixed ` +
        `point). <span class="chip thm">theorem</span> HHK §2.4, measured on this render.`
      : `On T²/Z₃ the same computation gives something else, and the last column says why: the ` +
        `moves are 3-cycles, not the 2×2 swaps that would connect every matrix with the same ` +
        `spectra, so the spectra are <b>invariant but not complete</b> and almost every boundary ` +
        `condition is alone. Assuming the S¹/Z₂ answer carried over would have been the easy ` +
        `mistake. <span class="chip mea">measured</span> from Takeuchi–Inagaki eq. (46).`;

    this._z6();
  },

  /* ---------------------------------------------------------------- T²/Z₆, counted here
   *
   * THE DIAGONAL COLUMN IS THE CONTROL.  It has to come out C(N+5,5) -- their section 3 proves no
   * two diagonal sets are connected -- and if it does not, the state space or the moves are wrong
   * and nothing else in the row means anything.  It is printed rather than assumed. */
  _z6() {
    const rows = [], MAX = 8;
    let ctrl = true, firstSplit = null;
    for (let N = 1; N <= MAX; N++) {
      const c = bcT2Z6Count(N);
      const sum = tiZ6Sum(N), eq59 = tiZ6Eq59(N), closed = tiZ6Closed(N);
      if (c.diagonal !== c.alpha) ctrl = false;
      if (firstSplit === null && sum !== eq59) firstSplit = N;
      /* NO COLOUR ON THE PUBLISHED COLUMNS.  This page counts; it does not grade anybody's
       * equation.  Marking one column red would be a verdict, and the verdict is not ours to
       * print in the authors' absence. */
      rows.push(`<tr><td class="num">${N}</td><td class="num">${c.states}</td>` +
        `<td class="num"><b>${c.diagonal}</b></td>` +
        `<td class="num" style="color:var(--ink3)">${c.alpha}</td>` +
        `<td class="num"><b>${c.offdiag}</b></td>` +
        `<td class="num">${sum}</td>` +
        `<td class="num">${eq59}</td>` +
        `<td class="num">${closed}</td></tr>`);
    }
    document.getElementById("bccZ6").innerHTML = rows.join("");

    const agree = [...Array(MAX).keys()].every((i) => {
      const N = i + 1;
      return bcT2Z6Count(N).offdiag === tiZ6Sum(N) && tiZ6Sum(N) === tiZ6Closed(N);
    });
    document.getElementById("bccZ6Note").innerHTML =
      `The <b>diagonal</b> column is the control: it must be C(N+5,5), and it ` +
      `${ctrl ? "is, at every N in the table" : "<b>is NOT</b>, which would mean the states or " +
       "the moves are wrong"}. ` +
      `The last three columns are not computed here. Takeuchi–Inagaki, <i>PTEP</i> 2024 063B04 ` +
      `(arXiv:2404.19411), state this count <b>twice</b> — as a sum over configurations, and as ` +
      `the closed form of eq. (5.9) — and both are quoted as printed. Up to ` +
      `N&nbsp;=&nbsp;6, the range their Table 2 covers, the three agree. From ` +
      `N&nbsp;=&nbsp;${firstSplit} the sum keeps agreeing with the count and the closed form ` +
      `takes a different value. Which of their two expressions is the intended one is a question ` +
      `for the authors, and this page does not answer it. ` +
      `${agree ? "" : "<b>The count and the sum disagree on this render, which would be news.</b> "}` +
      `<span class="chip mea">measured</span> the first five columns are counted here; the last ` +
      `two are quoted.`;

    /* the last column is ours, and it is offered as a tool rather than as a correction */
    document.getElementById("bccZ6Note").innerHTML +=
      `<br><br>The <b>closed form</b> column evaluates the sum, and it is here because a formula ` +
      `is easier to use than a five-fold sum: two branches by parity rather than six by ` +
      `N&nbsp;mod&nbsp;6. The reason it is two is visible in the generating function, ` +
      `<code>x²(3−4x+2x²) / [(1−x)⁹(1+x)]</code> — the 1/(1−x³) that every term with 3×3 blocks ` +
      `carries cancels, so there is no pole at the primitive cube roots and the count cannot ` +
      `depend on N&nbsp;mod&nbsp;3. The pole of order 9 at x&nbsp;=&nbsp;1 is the degree, and the ` +
      `simple pole at x&nbsp;=&nbsp;−1 is the period.`;
  },

  /* ---------------------------------------------------------------- the matter */

  _matter(ctx) {
    const ROWS = [["scalarF", "complex scalar, fundamental"], ["diracF", "Dirac fermion, fundamental"],
                  ["diracA", "Dirac fermion, antisymmetric"]];
    const ETAS = ["++", "+-", "-+", "--"];
    document.getElementById("bccMatter").innerHTML = ROWS.flatMap(([k, name]) =>
      ETAS.map((e) => {
        const v = (BCC_S.matter[k] || {})[e] || 0;
        return `<tr><td style="font-size:12.5px">${e === "++" ? name : ""}</td>` +
          `<td style="font-family:var(--mono)">${e}</td>` +
          `<td class="num" style="white-space:nowrap">` +
          `<button class="st" data-m="${k}|${e}" data-d="-1">−</button>` +
          `<span class="cnt${v ? "" : " z"}">${v}</span>` +
          `<button class="st" data-m="${k}|${e}" data-d="1">+</button></td></tr>`;
      })).join("");
    document.getElementById("bccMatter").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const [k, e] = b.dataset.m.split("|");
        const cur = { ...(BCC_S.matter[k] || {}) };
        cur[e] = Math.max(0, Math.min(20, (cur[e] || 0) + +b.dataset.d));
        BCC_S.matter = { ...BCC_S.matter, [k]: cur };
        ctx.refresh();
      };
    });
  },

  /* ---------------------------------------------------------------- the energy */

  _energy(ctx, C) {
    const el = document.getElementById("bccEnergy");
    if (BCC_S.orbifold !== "S1/Z2") {
      el.className = "verdict stable";
      el.innerHTML = `<b>Not on this orbifold</b><span>HHK's energy formula, eq. (3.25), is ` +
        `written for S¹/Z₂. There is no equivalent archived here for T²/Z₃, and this panel says ` +
        `so rather than evaluating a formula outside what it was derived for. ` +
        `<span class="chip bad">unknown</span></span>`;
      return;
    }
    const cl = C.classes[C.of(BCC_S.bc)];
    const P = bcPreferred(cl.members, BCC_S.matter);
    const here = bcEnergy(BCC_S.bc, BCC_S.matter);
    el.className = "verdict stable";
    el.innerHTML =
      `<b>${cl.size === 1 ? "One member, so nothing to prefer"
           : P.tied ? `${P.winners.length} members tie for lowest`
           : `The energy prefers ${bcShow(P.winners[0].bc)} — ${bcUnbroken(P.winners[0].bc)}`}</b>` +
      `<span>Within this class the comparison is legitimate: N₀ is the same for every boundary ` +
      `condition of SU(${BCC_S.N}), and N_Δ = ${here.Nd} is the same for every member of this ` +
      `class, so the difference is <b>N_v · v(½)</b> with v(½) > 0 — and the smallest N_v wins. ` +
      `Here N_v = <b>${here.Nv}</b>` +
      (cl.size > 1 ? `, against ${P.scored.map((x) => x.Nv).sort((a, b) => a - b).join(", ")} ` +
                     `across the class. ` : `. `) +
      `<span class="chip ver">verified</span> HHK eq. (3.25); their eq. (3.27) is reproduced ` +
      `term by term in the harness.</span>`;
  },

  /* ---------------------------------------------------------------- the honesty */

  _honesty(ctx, C) {
    document.getElementById("bccHonesty").innerHTML =
      `<b>Across classes, nothing here is comparable.</b> The energy splits into three pieces — ` +
      `N₀λ₀ + N_Δλ_Δ + N_v v(½) — and only the last is finite. N₀ does not depend on the boundary ` +
      `condition at all, so it never distinguishes anything. N_Δ multiplies a <b>divergent</b> ` +
      `λ_Δ, and no symmetry principle picks the regularisation; it happens to be constant on a ` +
      `class, which is exactly why comparisons <em>inside</em> a class survive and comparisons ` +
      `<em>between</em> them do not. HHK say this in as many words, and it is why the panel above ` +
      `ranks members and refuses to rank classes. In a supersymmetric theory the ambiguity ` +
      `cancels and the comparison becomes possible — that is their §4, and it is not implemented ` +
      `here. <span class="chip bad">unknown</span>` +
      `<p style="margin:11px 0 0"><b>And what the orbits are is settled, but not everything is.</b> ` +
      `The classification holds for U(N) and SU(N) on S¹/Z₂ and T²/Z₃. On T²/Z₄ and T²/Z₆ the ` +
      `trace conservation can change the degeneracy of eigenvalues and there are off-diagonal ` +
      `classes, so neither is here. Nor is T²/Z₂, which needs three basic operators rather than ` +
      `two. Those are the open ends the source paper names, and they are open ends of this panel ` +
      `too.</p>` +
      `<p style="margin:11px 0 0">${ORBIFOLDS[BCC_S.orbifold].source}. ` +
      `${C.nBC.toLocaleString("en")} boundary conditions enumerated and orbited on this render.</p>`;
  },
};

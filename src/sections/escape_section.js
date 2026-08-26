/* escape_section.js — Part VI as its own section: the escape from proton decay, end to end.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The anomalies section prices the escape; this one CONSTRUCTS it.  The inputs are the brane half
 * of the model record — the one part every other section ignores: the brane-quark charge X_Q, the
 * rung of each lepton generation, the charge of the U(1)'-breaking scalar.  Everything drawn here
 * is exact rational arithmetic from charges.mjs, resolved through the same modules the header uses;
 * the section computes nothing itself.
 *
 * The one picture with no precedent in the house is the rung cube: the 64 ordered triples
 * (k1, k2, k3) of lepton rungs, in 3-D under the shared projector, coloured by what Part VI proves
 * about each — and its main diagonal is the family-universal line, where every A_j vanishes and
 * protection dies.  The theorem IS the geometry: the failure set is a line, not a region.
 *
 * Edited BY HAND.
 */
const ESCAPE_SECTION = {
  id: "escape",
  label: "Escape from proton decay",
  paper: "Part VI",
  ready: true,
  /* The same two modules the anomalies section mounts: the resolver runs them once for both. */
  modules: [anomaliesModule(DATA), escapeModule(DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="egLead">—</p>
    <div class="note" style="margin-top:9px">
      A unified group relates quarks to leptons, so dimension-6 operators violate baryon number.
      Part VI's surviving escape is a <b>family-dependent</b> U(1)&prime; charge: each lepton
      generation sits on a rung of the singlet ladder, the six anomaly channels then fix the
      brane-quark charge, and protection holds iff every generation's proton-operator charge
      <span style="font-family:var(--mono)">A<sub>j</sub> = 3X<sub>Q</sub> + l<sub>j</sub></span>
      is non-zero and survives the scalar that breaks the symmetry. Type a brane content below and
      every card recomputes.
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The brane content</h2>
        <p class="note" style="margin:0 0 10px">The half of the model record the bulk sections
        never read. Defaults are the paper's own, and the tool echoes what it filled in.</p>
        <div id="egGen"></div>
        <div style="margin-top:11px;padding-top:9px;border-top:1px solid var(--line)">
          <div class="rowm"><span class="nm">X<sub>Q</sub></span>
            <input id="egXQ" type="text" size="7" placeholder="forced"
                   style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:84px">
            <span class="note" id="egXQEcho" style="flex:1">—</span></div>
          <div class="rowm"><span class="nm">q<sub>&phi;</sub></span>
            <span id="egQBtns" style="display:flex;gap:5px"></span>
            <input id="egQIn" type="text" size="5" placeholder="other"
                   style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:64px">
          </div>
        </div>
        <div class="note" style="margin-top:9px" id="egApplied">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The six anomaly channels</h2>
        <div class="verdict stable" id="egChanV"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px">Part VI §3, state by state on the surviving chiral
        content with their own conjugate-pairing prescription. Three channels are linear in
        X<sub>Q</sub> and share one root; two are constants only a right-handed neutrino can cancel.
        <span class="chip thm">theorem</span> — exact rationals, and
        <span style="font-family:var(--mono)">[SU(2)]&sup2;X = &frac12;&Sigma;A<sub>j</sub></span>
        (Prop.&nbsp;1) is recomputed on every render.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The ladder, and who hosts each rung</h2>
        <table><thead><tr><th class="num">rung k</th><th class="num">boxes</th>
          <th class="num">extra(L)</th><th>L · e<sub>R</sub></th><th>hosts</th><th></th></tr></thead>
          <tbody id="egLadT"></tbody></table>
        <div class="note" style="margin-top:9px" id="egIdent">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The rung cube</h2>
        <canvas id="egCube" width="560" height="340"></canvas>
        <div class="legend">
          <span><i style="background:#48596a"></i>some A<sub>j</sub> = 0 — unprotected</span>
          <span><i style="background:#4da3c4"></i>protects, but a channel survives — <b>empty</b></span>
          <span><i style="background:#d9a13f"></i>all six cancel — the 14</span>
          <span><i style="background:#3fae74"></i>realisable in their tensors — the 2</span>
        </div>
        <div class="note" style="margin-top:9px" id="egCubeNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The twenty assignments — click to load</h2>
        <p class="note" style="margin:0 0 10px" id="egAsgLead">—</p>
        <table><thead><tr><th>rungs</th><th class="num">X<sub>Q</sub></th>
          <th class="num">A = (A₁, A₂, A₃)</th><th class="num">&nu;<sub>R</sub></th><th>verdict</th></tr></thead>
          <tbody id="egAsgT"></tbody></table>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The selection rule, and the residual group</h2>
        <div class="verdict stable" id="egSelV"><b>—</b><span>—</span></div>
        <table style="margin-top:10px"><thead><tr><th class="num">q<sub>&phi;</sub></th><th>supplied by</th>
          <th>dresses this content</th><th class="num">residual</th><th>forbids (3m+1)/2</th></tr></thead>
          <tbody id="egSupT"></tbody></table>
        <div class="note" style="margin-top:9px" id="egResNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The bill, against this bulk</h2>
        <div id="egBillStats"></div>
        <div class="verdict stable" id="egBillV" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    /* The typed inputs commit on change, not on keystroke: a render per keystroke would rebuild
     * the very input being typed into. */
    $("egXQ").onchange = () => ctx.setBrane({ X_Q: $("egXQ").value });
    $("egQIn").onchange = () => ctx.setBrane({ q_phi: $("egQIn").value });
    $("egQBtns").innerHTML = [["", "—"], ["1/2", "1/2 · from a 7"], ["1", "1 · 28"], ["3/2", "3/2 · 84"]]
      .map(([q, lab]) => `<button class="st" data-q="${q}" style="width:auto;padding:0 8px">${lab}</button>`)
      .join("");
    $("egQBtns").querySelectorAll("button")
      .forEach((b) => (b.onclick = () => ctx.setBrane({ q_phi: b.dataset.q })));

    /* the cube answers the mouse exactly as the reliefs do: drag turns, wheel raises */
    this._view = this._view || surfaceView({ az: -0.72, el: 0.78, h: 0.85 });
    const cube = $("egCube");
    attachSurface(cube, this._view, {
      mode: "turn",
      width: () => cube.clientWidth || 560,
      height: () => 340,
      onView: () => { if (this._lastV) this._cube(this._lastV); },
    });
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const v = r.values;
    const br = v.get("brane").value, ch = v.get("channels").value, lad = v.get("ladder").value;
    const asg = v.get("assignments").value, pr = v.get("protection").value;
    const res = v.get("residual").value, bill = v.get("bill_escape").value;
    this._lastV = v;

    /* ---- the inputs, reflecting the MODEL rather than any private state -------------------- */
    $("egGen").innerHTML =
      `<div class="rowm"><span class="nm">generations</span>` +
      [1, 2, 3].map((n) => `<button class="st${br.N === n ? " on" : ""}" data-n="${n}">${n}</button>`).join("") +
      `<span class="note" style="flex:1;text-align:right">each on a rung of the ladder</span></div>` +
      br.rungs.map((k, j) =>
        `<div class="rowm"><span class="nm">gen ${j + 1} · rung</span>` +
        [0, 1, 2, 3].map((kk) =>
          `<button class="st${k === kk ? " on" : ""}" data-j="${j}" data-k="${kk}">${kk}</button>`).join("") +
        `<span class="ch">l = ${lad.rows[k].extra}</span></div>`).join("");
    $("egGen").querySelectorAll("button[data-n]").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.n;
      const rungs = br.rungs.slice(0, n);
      while (rungs.length < n) rungs.push(0);
      ctx.setBrane({ rungs });
    }));
    $("egGen").querySelectorAll("button[data-j]").forEach((b) => (b.onclick = () => {
      const rungs = br.rungs.slice();
      rungs[+b.dataset.j] = +b.dataset.k;
      ctx.setBrane({ rungs });
    }));

    const xq = $("egXQ");
    if (document.activeElement !== xq) xq.value = br.X_Q_forced ? "" : br.X_Q;
    xq.placeholder = br.X_Q_forced_value;
    $("egXQEcho").innerHTML = br.X_Q_forced
      ? `<b>forced to ${br.X_Q}</b> by the three linear channels (Prop. 1) — type a value to override`
      : `typed; the forced value would be ${br.X_Q_forced_value}`;
    $("egQBtns").querySelectorAll("button")
      .forEach((b) => b.classList.toggle("on", (br.q_phi || "") === b.dataset.q));
    const qi = $("egQIn");
    if (document.activeElement !== qi)
      qi.value = br.q_phi && !["1/2", "1", "3/2"].includes(br.q_phi) ? br.q_phi : "";
    $("egApplied").innerHTML = br.applied.length
      ? `Defaults applied and echoed: ${br.applied.join(" · ")}. <span class="chip mea">measured</span> the record`
      : `Nothing defaulted: every brane input on this page was typed.`;

    /* ---- the lead --------------------------------------------------------------------------- */
    const rungsTxt = br.rungs.join(", ");
    $("egLead").innerHTML =
      `${br.N} generation${br.N > 1 ? "s" : ""} on rung${br.N > 1 ? "s" : ""} (${rungsTxt}) at ` +
      `X<sub>Q</sub> = <b>${br.X_Q}</b>: ` +
      (ch.protects
        ? `every A<sub>j</sub> is non-zero, so the dimension-6 operators are charged — ` +
          `<b>protection holds</b>`
        : `<b style="color:var(--rust)">some A<sub>j</sub> = 0: a generation's operators are ` +
          `neutral, and no scalar choice can save it</b>`) +
      `, and the six anomaly channels ${ch.allCancel
        ? `<b>all cancel</b>${ch.nus.length ? ` once &nu;<sub>R</sub> of charge ${ch.nus.join(", ")} ` +
          `${ch.nus.length > 1 ? "are" : "is"} kept` : ""}`
        : `<b style="color:var(--rust)">do not all cancel</b>`}. ` +
      (bill.rung1 > 0
        ? `The escape costs <b>${bill.cost8}/8</b> of D against this bulk` +
          (bill.survives === false ? ` — <b style="color:var(--rust)">which it cannot pay</b>.` : `.`)
        : `Nothing sits on rung 1, so this assignment costs the potential nothing.`);

    /* ---- the six channels ------------------------------------------------------------------- */
    $("egChanV").className = "verdict " + (ch.allCancel ? "breaks" : "stable");
    $("egChanV").innerHTML =
      `<b>${ch.allCancel ? "All six cancel" : "They do not all cancel"} at X_Q = ${br.X_Q}</b>` +
      `<span>Proton-operator charges A = (${ch.A.join(", ")}); neutrinos kept: ` +
      `${ch.nus.length ? ch.nus.join(", ") : "none"}; the four Standard-Model channels vanish: ` +
      `${ch.smChannelsVanish ? "yes" : "NO — the bookkeeping is broken"}; Prop. 1 holds: ` +
      `${ch.prop1 ? "yes" : "NO"}.</span>` +
      `<table style="margin-top:8px"><thead><tr><th>channel</th><th class="num">as polynomial in X_Q</th>` +
      `<th class="num">vanishes at</th><th class="num">bare</th><th class="num">with &nu;_R</th></tr></thead><tbody>` +
      ch.table.map((row, i) => {
        const p = ch.polynomials[i];
        return `<tr><td style="font-family:var(--mono)">${row.label}</td>` +
               `<td class="num">${p.poly}</td>` +
               `<td class="num">${Array.isArray(p.roots) ? (p.roots.length ? p.roots.join(", ") : "never") : p.roots}</td>` +
               `<td class="num">${row.bare}</td><td class="num">${row.withNu}</td></tr>`;
      }).join("") + `</tbody></table>`;

    /* ---- the ladder ------------------------------------------------------------------------- */
    $("egLadT").innerHTML = lad.rows.map((row) => {
      const held = br.rungs.filter((k) => k === row.k).length;
      const hostsTxt = row.hosts.length
        ? row.hosts.map((h) => h.hostsE
            ? `<b>${h.rep}</b> ${h.parities.join(" ")}`
            : `${h.rep} — L only`).join(" · ")
        : "nothing their paper introduces";
      return `<tr${held ? ' style="background:#f7fafc"' : ""}>` +
        `<td class="num">${row.k}${held ? ` <span class="chip live">×${held}</span>` : ""}</td>` +
        `<td class="num">${row.boxes}</td><td class="num">${row.extra}</td>` +
        `<td style="font-family:var(--mono);font-size:12px">${row.L} · ${row.eR}</td>` +
        `<td style="font-size:12.5px">${hostsTxt}</td>` +
        `<td>${row.hostable ? "" : `<span class="chip bad">unhostable</span>`}</td></tr>`;
    }).join("");
    $("egIdent").innerHTML =
      `<span style="font-family:var(--mono)">extra(L) = (1−k)/2</span>, read off the weight ` +
      `(5,6,7<sup>k</sup>); hosting needs the Yukawa of their eq. (46) to close inside one ` +
      `multiplet, and the adjoint 48 never hosts a chiral generation (Prop. 2). At ` +
      `X<sub>Q</sub> = −1/6 the identity U(1)&prime; = T<sub>3L</sub> + Y − (B−L) holds on every ` +
      `field${lad.identity ? "" : " — <b>and this build fails to verify it</b>"}, and all four ` +
      `dimension-6 operators are Y- and (B−L)-neutral: ` +
      `${lad.operators.every((o) => o.Y === "0" && o.BL === "0") ? "checked" : "<b>BROKEN</b>"}. ` +
      `<span class="chip thm">theorem</span> Part VI §4.`;

    /* ---- the cube, the assignments, the rule, the bill -------------------------------------- */
    this._cube(v);
    this._assignments(ctx, v);
    this._selection(v);
    this._bill(v);
  },

  _assignments(ctx, v) {
    const $ = (id) => document.getElementById(id);
    const asg = v.get("assignments").value, br = v.get("brane").value;
    const num = (s) => { const [p, q] = String(s).split("/"); return +p / (+q || 1); };
    const curKey = br.N === 3
      ? br.l.slice().sort((a, b) => num(b) - num(a)).join(",") : null;
    $("egAsgLead").innerHTML =
      `Every multiset of three rungs, X<sub>Q</sub> family-universal, neutrinos from the singlet ` +
      `ladder: <b>${asg.total}</b> assignments, <b>${asg.surviving}</b> cancel all six channels, ` +
      `<b>${asg.realisable}</b> are realisable inside their own tensors. ` +
      `<span class="chip ver">verified</span> against su7_realisable.py's archived table.`;
    $("egAsgT").innerHTML = asg.rows.map((row, i) => {
      const on = curKey !== null && row.l.join(",") === curKey;
      const verdict = row.realisable ? `<span class="chip thm">realisable</span>`
        : row.survives ? `<span class="chip ver">survives</span>`
        : row.protects ? `<span class="chip live">a channel survives</span>`
        : `<span class="chip bad">A_j = 0</span>`;
      return `<tr class="clk" data-i="${i}"${on ? ' style="background:#f7fafc;font-weight:650"' : ""}>` +
        `<td style="font-family:var(--mono)">(${row.rungs.join(",")})</td>` +
        `<td class="num">${row.X_Q}</td><td class="num">${row.A.join(", ")}</td>` +
        `<td class="num">${row.nus ? row.nus.join(", ") : "—"}</td><td>${verdict}` +
        `${row.strict ? ` <span class="chip live">strict</span>` : ""}</td></tr>`;
    }).join("");
    $("egAsgT").querySelectorAll("tr").forEach((tr) =>
      (tr.onclick = () => ctx.setBrane({ rungs: asg.rows[+tr.dataset.i].rungs })));
  },

  _selection(v) {
    const $ = (id) => document.getElementById(id);
    const pr = v.get("protection").value, res = v.get("residual").value;
    const q = pr.q_phi;
    $("egSelV").className = "verdict " +
      (pr.everyQFails ? "stable" : q === null ? "" : pr.protectedAt ? "breaks" : "stable");
    $("egSelV").innerHTML = pr.everyQFails
      ? `<b style="color:var(--rust)">No scalar can protect this content</b><span>A generation has ` +
        `A<sub>j</sub> = 0: its operators are neutral under U(1)&prime;, and dressing needs no ` +
        `insertion at all. The failure is upstream of q<sub>&phi;</sub>.</span>`
      : q === null
        ? `<b>Protection fails exactly at q_&phi; &isin; {${pr.failingSet.map((g) => g + "/n").join(", ")}}, n ≥ 1</b>` +
          `<span>Prop. 3: an operator of charge A can be dressed iff A/q<sub>&phi;</sub> is an ` +
          `integer, so the failing set is countable and has a maximum — every ` +
          `q<sub>&phi;</sub> &gt; <b>${pr.halfLine}</b> protects. Their paper does not state ` +
          `q<sub>&phi;</sub>; pick one above to get a verdict.</span>`
        : pr.protectedAt
          ? `<b>q_&phi; = ${q} protects all ${pr.A.length} generations</b><span>No A<sub>j</sub>/q<sub>&phi;</sub> ` +
            `is an integer, so no operator can be dressed by &lang;&phi;&rang; insertions. The ` +
            `failing set is {${pr.failingSet.map((g) => g + "/n").join(", ")}}; the half-line ` +
            `q<sub>&phi;</sub> &gt; ${pr.halfLine} protects outright. <span class="chip thm">theorem</span> Prop. 3</span>`
          : `<b style="color:var(--rust)">q_&phi; = ${q} fails</b><span>Generation${pr.dressable.length > 1 ? "s" : ""} ` +
            `${pr.dressable.map((j) => j + 1).join(", ")} can be dressed: A<sub>j</sub>/q<sub>&phi;</sub> ` +
            `is an integer there. Every q<sub>&phi;</sub> &gt; ${pr.halfLine} protects.</span>`;
    $("egSupT").innerHTML = pr.supply.map((s, i) => {
      const rr = res.single[i];
      return `<tr><td class="num">${s.q}</td>` +
        `<td style="font-family:var(--mono);font-size:12px">${s.rep} &sup; ${s.component}</td>` +
        `<td>${pr.everyQFails ? `<span class="chip bad">moot</span>`
              /* dressable is the LIST of generations that can be dressed -- an empty list is
               * protection, and an empty list is also truthy, which shipped as three false FAILS */
              : s.dressable.length ? `<span class="chip bad">fails gen ${s.dressable.map((j) => j + 1).join(",")}</span>`
              : `<span class="chip thm">protects</span>`}</td>` +
        `<td class="num">Z<sub>${rr.N}</sub></td>` +
        `<td>${rr.protectsGS ? `<span class="chip thm">yes</span>` : `<span class="chip bad">no</span>`}</td></tr>`;
    }).join("");
    $("egResNote").innerHTML =
      `The bulk lattice is (1/2)Z, so a VEV of charge q leaves Z<sub>2q</sub>; two scalars leave ` +
      `the group of their gcd — ${res.pairs.map((p) => `${p.pair} &rarr; Z<sub>${p.N}</sub>`).join(", ")} — ` +
      `so any two of their three supplies collapse the residual to nothing. ` +
      (res.chosen !== null ? `The chosen q<sub>&phi;</sub> leaves <b>Z<sub>${res.chosen}</sub></b>. ` : ``) +
      `Only q<sub>&phi;</sub> = 3/2 alone keeps the Green–Schwarz-freed charges (3m+1)/2 forbidden. ` +
      `<span class="chip thm">theorem</span> Part VI §6.`;
  },

  _bill(v) {
    const $ = (id) => document.getElementById(id);
    const b = v.get("bill_escape").value;
    $("egBillStats").innerHTML =
      `<div class="pair">
         <div class="stat"><div class="k">rung-1 generations</div><div class="v">${b.rung1}</div>
           <div class="s">each needs one 84(+,+) donated, at 10/8 of D</div></div>
         <div class="stat"><div class="k">8D, before &rarr; after</div>
           <div class="v" style="color:${b.rung1 === 0 ? "inherit" : b.survives ? "var(--green)" : "var(--rust)"}">` +
           `${b.D8_before} &rarr; ${b.D8_after === null ? b.D8_before : b.D8_after}</div>
           <div class="s">${b.hosts_held} host${b.hosts_held !== 1 ? "s" : ""} 84(+,+) in this bulk</div></div>
       </div>`;
    $("egBillV").className = "verdict " +
      (b.rung1 === 0 ? "" : b.survives ? "breaks" : "stable");
    $("egBillV").innerHTML = b.rung1 === 0
      ? `<b>The bill is zero</b><span>No generation sits on rung 1, so nothing has to leave the ` +
        `potential. Rung 0 lives in the 21 or the 28, whose hosting costs nothing extra; the ` +
        `assignments that need rung 1 are the ones that pay.</span>`
      : !b.enough_hosts
        ? `<b style="color:var(--rust)">Not enough hosts</b><span>${b.rung1} generation${b.rung1 > 1 ? "s" : ""} ` +
          `on rung 1 need${b.rung1 > 1 ? "" : "s"} ${b.rung1} × 84(+,+) and this bulk holds ` +
          `${b.hosts_held}. Add the host in the hierarchy section, or move the generation down a rung.</span>`
        : b.survives
          ? `<b>Affords the escape</b><span>Donating ${b.rung1 > 1 ? `${b.rung1} hosts` : "the host"} ` +
            `costs ${b.cost8}/8 and leaves 8D = ${b.D8_after} &gt; 0, so electroweak symmetry still ` +
            `breaks. <span class="chip thm">theorem</span> Part VI §5, exact.</span>`
          : `<b style="color:var(--rust)">Cannot afford it</b><span>Removing ${b.cost8}/8 from ` +
            `${b.D8_before}/8 leaves ${b.D8_after}/8, and D must stay positive for electroweak ` +
            `symmetry to break at all. The anomalies section prices this over the whole lattice.</span>`;
  },

  /* ---------------------------------------------------------------- the cube
   *
   * The 64 ordered rung triples under the shared projector — the same surfaceView/surfaceProjector
   * pair the reliefs use, so the mouse contract is the house's: drag turns, wheel raises, arrows
   * step.  Each dot is looked up in the module's own enumeration (a multiset: order is a labelling
   * of identical generations), so the picture cannot drift from the table beside it. */
  _fit(c, h) {
    const d = window.devicePixelRatio || 1, w = c.clientWidth || 560;
    c.width = w * d; c.height = h * d; c.style.height = h + "px";
    const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    return [g, w, h];
  },
  _css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); },

  _cube(v) {
    const c = document.getElementById("egCube");
    if (!c) return;
    const [g, W, H] = this._fit(c, 340);
    /* dark ground, as the reliefs have: the dots carry the information and need the contrast */
    g.fillStyle = "#141d26"; g.fillRect(0, 0, W, H);

    const asg = v.get("assignments").value, br = v.get("brane").value;
    const CLS = { grey: "#48596a", blue: "#4da3c4", amber: "#d9a13f", green: "#3fae74" };
    const clsOf = new Map();
    for (const row of asg.rows)
      clsOf.set(row.rungs.slice().sort((a, b) => a - b).join(","),
                row.realisable ? "green" : row.survives ? "amber"
                : row.protects ? "blue" : "grey");

    /* fit the WHOLE cube — both h = 0 and h = 1 — then project */
    const view = this._view;
    const frame = { x: 10, y: 26, w: W - 20, h: H - 60 };
    const raw = surfaceProjector(view, [1, 1]).raw;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const X of [0, 1]) for (const Y of [0, 1]) for (const Z of [0, 1]) {
      const [u, w2] = raw(X, Y, Z);
      if (u < x0) x0 = u; if (u > x1) x1 = u;
      if (w2 < y0) y0 = w2; if (w2 > y1) y1 = w2;
    }
    view.s = Math.min(frame.w / ((x1 - x0) || 1), frame.h / ((y1 - y0) || 1)) * 0.94;
    view.ox = frame.x + frame.w / 2 - (x0 + x1) / 2 * view.s;
    view.oy = frame.y + frame.h / 2 - (y0 + y1) / 2 * view.s;
    const P = surfaceProjector(view, [1, 1]);

    /* the floor grid and the cage, so the dots have somewhere to stand */
    g.strokeStyle = "rgba(255,255,255,.10)"; g.lineWidth = 1;
    for (let k = 0; k <= 3; k++) {
      const t = k / 3;
      let A = P(t, 0, 0), B = P(t, 1, 0);
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]);
      A = P(0, t, 0); B = P(1, t, 0);
      g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
    }
    g.strokeStyle = "rgba(255,255,255,.16)";
    for (const [X, Y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const A = P(X, Y, 0), B = P(X, Y, 1);
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
    }
    for (const Z of [1]) {
      const q = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([X, Y]) => P(X, Y, Z));
      g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath(); g.stroke();
    }

    /* THE DIAGONAL, drawn before the dots so the grey ones stand on it: the family-universal
     * line l1 = l2 = l3, where every A_j = 3X_Q + l_j = l_j - mean(l) vanishes identically. */
    const d0 = P(0, 0, 0), d1 = P(1, 1, 1);
    g.strokeStyle = "rgba(219,111,60,.85)"; g.lineWidth = 1.6; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(d0[0], d0[1]); g.lineTo(d1[0], d1[1]); g.stroke(); g.setLineDash([]);

    /* the dots, painter-sorted far to near on the projector's own depth key */
    const dots = [];
    for (let k1 = 0; k1 <= 3; k1++) for (let k2 = 0; k2 <= 3; k2++) for (let k3 = 0; k3 <= 3; k3++) {
      const [X, Y, d] = P(k1 / 3, k2 / 3, k3 / 3);
      dots.push({ X, Y, d, cls: clsOf.get([k1, k2, k3].sort((a, b) => a - b).join(",")) || "grey",
                  key: `${k1},${k2},${k3}` });
    }
    dots.sort((a, b) => a.d - b.d);
    const here = br.N === 3 ? br.rungs.join(",") : null;
    for (const p of dots) {
      const on = p.key === here;
      g.beginPath(); g.arc(p.X, p.Y, p.cls === "grey" ? 3.4 : 5, 0, 7);
      g.fillStyle = CLS[p.cls]; g.fill();
      if (p.cls !== "grey") { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke(); }
      if (on) {
        g.strokeStyle = "#fff"; g.lineWidth = 1.8;
        g.beginPath(); g.arc(p.X, p.Y, 8.5, 0, 7); g.stroke();
      }
    }

    /* The diagonal's label rides its upper end, reading INWARD when that end is on the right
     * half -- written outward it left the canvas, legible only in the source. */
    g.font = "600 10px ui-monospace,monospace";
    g.fillStyle = "rgba(219,111,60,.95)"; g.textBaseline = "bottom";
    g.textAlign = d1[0] > W / 2 ? "right" : "left";
    g.fillText("family-universal: protection dies", d1[0] + (d1[0] > W / 2 ? -8 : 8), d1[1] - 4);
    surfaceAxisLabels(g, P, ["k₁", "k₂"]);
    const zt = P(0, 0, 1);
    g.fillStyle = "rgba(190,210,222,.95)"; g.textAlign = "right"; g.textBaseline = "bottom";
    g.fillText("k₃", zt[0] - 8, zt[1]);
    g.fillStyle = "rgba(190,210,222,.75)"; g.font = "10px ui-monospace,monospace";
    g.textAlign = "left"; g.textBaseline = "top";
    g.fillText("the 64 rung triples (k₁,k₂,k₃) — drag to turn, wheel to raise", 10, 8);

    const $ = (id) => document.getElementById(id);
    const nGrey = dots.filter((p) => p.cls === "grey").length;
    $("egCubeNote").innerHTML =
      `Each dot is an ordered triple of lepton rungs; its colour is the module's own verdict on ` +
      `the multiset. The dashed diagonal is Part VI's central obstruction made visible: on ` +
      `<b>k₁ = k₂ = k₃</b> the charge is family-universal, every A<sub>j</sub> vanishes, and no ` +
      `scalar can protect the proton — the ${nGrey} grey dots cluster around it because ` +
      `A<sub>j</sub> = l<sub>j</sub> − mean(l) dies whenever a rung equals the mean. Rungs 2 and ` +
      `3 are unhostable (four-box tensors their paper never introduces), which is why the ` +
      `<b style="color:#3fae74">two realisable assignments</b> live in the low corner. And the ` +
      `<b style="color:#4da3c4">blue class is empty</b> — that is a computed statement, pinned by ` +
      `the harness: on this ladder, every multiset that protects the proton can also cancel all ` +
      `six channels with at most three singlet neutrinos. Protection never costs an anomaly. ` +
      `<span class="chip thm">theorem</span> the classification; <span class="chip ver">verified</span> ` +
      `the enumeration, against the archived table.`;
  },
};

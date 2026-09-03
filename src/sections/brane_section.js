/* brane_section.js — "Brane matter": put fermions on the fixed points, and watch the bill and the
 * massless content move together.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE SECTION NEXT DOOR ENDS IN AN APOLOGY.  "Anomalies" computes what a chiral spectrum owes and
 * then says a non-zero row is not a verdict, because every model of this kind carries brane fields
 * and a brane fermion conjugate to a zero mode pays into the same channels with the opposite sign.
 * That sentence has been an apology for as long as the panel has existed.  Here it is a control you
 * can move: choose the matter on each fixed point and the ledger recomputes over bulk and brane
 * together, while Part I's mass gate says which zero modes that same matter has just lifted.
 *
 * WHAT MAKES IT MORE THAN A SECOND LEDGER.  Three things the arithmetic knows and prose does not:
 *
 *   - THE TWO BRANES ARE DIFFERENT GROUPS.  At y = 0 only P₀ acts, at y = πR only P₁, and when the
 *     orbifold breaks anything the commutants differ.  Kawamura's SU(5) is the textbook case and
 *     the example button loads it: the whole SU(5) at one end, SU(3)×SU(2)×U(1) at the other.
 *   - A CONJUGATE COMES IN A PACKAGE.  A local representation decomposes into several pieces of the
 *     unbroken group, so you cannot add "the conjugate of that one mode" and stop.  The partners
 *     panel lists what each candidate drags in with it.
 *   - AND THE SAME FIELD CANNOT ALWAYS DO BOTH JOBS.  Its local U(1) charge is free — that is what
 *     the anomaly solve turns — but the mass term needs one specific value.  Move the charge to pay
 *     the bill and the mass you introduced it for goes away.  The page shows the two verdicts side
 *     by side for that reason and never merges them.
 *
 * It shares the builder's model, like the spectrum and anomaly panels: one model, four views.
 *
 * Edited BY HAND.
 */
const BRANE_SECTION = {
  id: "brane",
  label: "Brane matter",
  paper: "Komori–Maru 2008 · Part I · Part VI",
  ready: true,
  modules: [],

  /* the selected massless mode in the partners panel, by class key; view state, no permalink */
  _target: null,

  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const s = brSummary(b, this._content(), this._branes(b));
    return `SU(${b.N}) · S¹/Z₂ · (${b.nPP},${b.nPM},${b.nMP},${b.nMM}) · ` + s.line;
  },

  _content() {
    return { bulk: Object.entries(SUN5D_S.bulk).filter(([, m]) => m).map(([k, m]) => {
      const [rep, eta, kind] = k.split("|");
      return { rep, eta: +eta, kind, multiplicity: m };
    }) };
  },

  /* THE BRANE CONTENT IS KEYED BY WHAT IT IS, not by an index into a list, so editing the boundary
   * condition cannot silently re-point a field at a different representation.  A key whose local
   * block has emptied simply produces no pieces and is not offered. */
  _branes(b) {
    const out = [];
    for (const fp of [0, 1])
      for (const m of brMenu(b, fp)) {
        for (const chirality of ["L", "R"]) {
          const k = this._key(m, chirality);
          const rec = SUN5D_S.brane[k];
          if (!rec || !rec.copies) continue;
          out.push({ ...m, chirality, copies: rec.copies, q: rec.q || null, key: k });
        }
      }
    return out;
  },

  _key(m, chirality) {
    return `${m.fp}|${m.rep}|${m.blockA}|${m.blockB === null ? "-" : m.blockB}|${chirality}`;
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Put fermions on the <b>fixed points</b>${helpMark("brane")} and two things move
    at once: the anomaly bill the bulk left unpaid, and the unwanted zero modes that get a mass. The
    panel next door computes the first and can only say who <em>could</em> pay it. This one lets you
    choose who does, and then holds the choice to <b>both</b> jobs.</p>
    <div class="note" style="margin-top:9px">A brane field is a representation of the <b>local
    group</b>${helpMark("local-group")} — the commutant of the one reflection that acts there — not
    of the unbroken four-dimensional group. The two fixed points therefore do not offer the same
    fields whenever the orbifold breaks anything, and a local representation splits into several
    pieces of the unbroken group when it lands in four dimensions.
    <span class="chip thm">theorem</span></div>
    <div class="note" style="margin-top:9px">The model is <b>the builder's</b>.
    <button class="ghost" id="brExample">▶ load Kawamura's SU(5): P = 1, P′ = diag(+,+,+,−,−)</button>
    <button class="ghost" id="brClear">▶ clear the brane content</button>
    <button class="ghost" id="brReset">▶ back to the builder's own model</button></div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The two branes</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>fixed point</th><th>reflection</th>
          <th>local group</th><th>letters it merges</th></tr></thead>
          <tbody id="brFixed"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="brFixedNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Matter on the branes</h2>
        <p class="note" style="margin:0 0 10px">Left-handed and right-handed Weyl fermions, in the
        representations of each local group. A right-handed one is the left-handed conjugate, which
        is how the ledger counts it.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>representation</th>
          <th class="num">dim</th><th class="num">L</th><th class="num">R</th>
          <th class="num">q</th></tr></thead>
          <tbody id="brMenuRows"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="brMenuNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The charge, which is free${helpMark("boundary-mass")}</h2>
        <div class="note" id="brSolveNote">—</div>
        <div style="margin-top:9px">
          <button class="ghost" id="brSolve">▶ solve the linear channels for the charges</button>
          <button class="ghost" id="brInduce">▶ reset every charge to the value its indices imply</button>
        </div>
        <div id="brSolveOut" class="note" style="margin-top:9px">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Who can pair with a given mode</h2>
        <p class="note" style="margin:0 0 10px">Pick a massless piece and see which brane fields
        contain its conjugate — with the charge gauge invariance forces, and what else each of them
        brings into the theory.</p>
        <div id="brTargets" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"></div>
        <div style="overflow-x:auto"><table><thead><tr><th>representation</th>
          <th class="num">q it must carry</th><th class="num">extra</th><th></th></tr></thead>
          <tbody id="brPartners"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="brPartnersNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The bill, before and after${helpMark("anomaly-channel")}</h2>
        <div class="verdict stable" id="brVerdict"><b>—</b><span>—</span></div>
        <div style="overflow-x:auto;margin-top:12px"><table><thead><tr><th>channel</th>
          <th class="num">bulk alone</th><th class="num">with the brane</th><th></th></tr></thead>
          <tbody id="brRows"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="brRowsNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What survives the boundary masses${helpMark("chiral")}</h2>
        <div class="verdict stable" id="brGateVerdict"><b>—</b><span>—</span></div>
        <div style="overflow-x:auto;margin-top:12px"><table><thead><tr><th>class</th>
          <th>charges</th><th class="num">bulk</th><th class="num">brane</th>
          <th class="num">lifted</th><th class="num">left</th></tr></thead>
          <tbody id="brClasses"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="brClassesNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What this panel does not decide</h2>
        <div class="note" id="brHonesty">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    document.getElementById("brExample").onclick = () => {
      SUN5D_S.blocks = { nPP: 3, nPM: 2, nMP: 0, nMM: 0 };
      SUN5D_S.bulk = { "fund|1|dirac": 1 };
      SUN5D_S.preset = null;
      SUN5D_S.brane = {};
      this._target = null;
      ctx.refresh();
    };
    document.getElementById("brClear").onclick = () => {
      SUN5D_S.brane = {};
      ctx.refresh();
    };
    /* A WAY BACK, and it is not decoration.  The example rewrites the builder's model, which four
     * sections share; a reader who pressed it needs one press to undo it, and the shooter needs one
     * too — a variant that leaves the shared model mutated would silently change the screenshots of
     * every section photographed after this one. */
    document.getElementById("brReset").onclick = () => {
      const p = SUN5D_PRESETS.find((x) => x.id === "hy3");
      SUN5D_S.blocks = { ...p.blocks };
      SUN5D_S.bulk = {};
      SUN5D_S.brane = {};
      SUN5D_S.preset = p.id;
      this._target = null;
      ctx.refresh();
    };
    document.getElementById("brSolve").onclick = () => {
      const b = sun5dBlocks(SUN5D_S.blocks);
      const branes = this._branes(b);
      const sol = brSolveCharges(b, this._content(), branes);
      if (sol.ok) branes.forEach((f, j) => { SUN5D_S.brane[f.key].q = sol.q[j]; });
      this._lastSolve = sol;
      ctx.refresh();
    };
    document.getElementById("brInduce").onclick = () => {
      for (const k of Object.keys(SUN5D_S.brane)) SUN5D_S.brane[k].q = null;
      this._lastSolve = null;
      ctx.refresh();
    };
  },

  render(ctx) {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const content = this._content();
    const branes = this._branes(b);
    const bill = brBill(b, content, branes);
    const gate = brMassGate(b, content, branes);
    this._fixed(b);
    this._menu(ctx, b);
    this._bill(b, bill);
    this._gate(b, gate);
    this._partners(ctx, b, gate);
    this._solve(b, branes);
    this._honesty(b, gate);
  },

  /* ---------------------------------------------------------------- the two branes */

  _fixed(b) {
    const NAMES = ["(+,+)", "(+,−)", "(−,+)", "(−,−)"];
    const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
    document.getElementById("brFixed").innerHTML = [0, 1].map((fp) => {
      const L = brLocalFrame(b, fp);
      return `<tr><td style="font-family:var(--mono)">${L.where}</td>` +
        `<td style="font-family:var(--mono)">${L.reflection}</td>` +
        `<td><b>${brLocalGroup(L)}</b></td>` +
        `<td class="note">` + L.blocks.map((k) =>
          `${k.name}: ${k.members.map((m) => `${NAMES[m]}<span style="color:var(--ink3)">(${sizes[m]})</span>`)
            .join(" + ")} = ${k.size}`).join(" &nbsp;·&nbsp; ") + `</td></tr>`;
    }).join("");
    const same = brSameGroup(b);
    document.getElementById("brFixedNote").innerHTML = same
      ? `The two fixed points see the <b>same</b> group here, so a field that exists at one exists ` +
        `at the other. That is the exception rather than the rule: it happens when the two ` +
        `reflections break the group to subgroups of the same shape. ` +
        `<span class="chip thm">theorem</span> the commutant of one reflection.`
      : `<b>The two branes are different groups.</b> A field that is a representation of one is ` +
        `not necessarily a representation of the other, so where you put the matter is part of the ` +
        `model and not a bookkeeping choice. ` +
        `<span class="chip thm">theorem</span> the commutant of one reflection — at y = 0 only P₀ ` +
        `acts, at y = πR only P₁, and the four-dimensional group is what commutes with both.`;
  },

  /* ---------------------------------------------------------------- the editor */

  _menu(ctx, b) {
    const frame = an5Frame(b);
    const rows = [];
    for (const fp of [0, 1]) {
      const L = brLocalFrame(b, fp);
      for (const m of brMenu(b, fp)) {
        const lp = brLocalPiece({ ...m, chirality: "L", copies: 1 });
        const dim = an5PieceDim(L, lp);
        if (!dim) continue;
        const qi = an5PieceCharge(L, lp, 0);
        const cell = (chirality) => {
          const k = this._key(m, chirality);
          const v = (SUN5D_S.brane[k] || {}).copies || 0;
          return `<td class="num" style="white-space:nowrap">` +
            `<button class="st" data-k="${k}" data-d="-1">−</button>` +
            `<span class="cnt${v ? "" : " z"}">${v}</span>` +
            `<button class="st" data-k="${k}" data-d="1">+</button></td>`;
        };
        const set = ["L", "R"].map((c) => SUN5D_S.brane[this._key(m, c)])
          .filter((r) => r && r.copies && r.q);
        rows.push(`<tr><td style="font-family:var(--mono);font-size:12.5px;white-space:nowrap">` +
          `${m.label}<span style="color:var(--ink3)"> · ${L.where}</span></td>` +
          `<td class="num">${dim}</td>` + cell("L") + cell("R") +
          `<td class="num" style="font-family:var(--mono);font-size:12px">` +
          (set.length ? `<b>${set.map((r) => rShow(r.q)).join(", ")}</b>` : rShow(qi)) +
          `</td></tr>`);
      }
    }
    const el = document.getElementById("brMenuRows");
    el.innerHTML = rows.join("") ||
      `<tr><td colspan="5" class="note">this boundary condition leaves no local group to put ` +
      `matter in</td></tr>`;
    el.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.k;
        const rec = SUN5D_S.brane[k] || { copies: 0, q: null };
        rec.copies = Math.max(0, Math.min(20, rec.copies + +btn.dataset.d));
        if (!rec.copies) rec.q = null;
        SUN5D_S.brane = { ...SUN5D_S.brane, [k]: rec };
        ctx.refresh();
      };
    });
    const n = this._branes(b).reduce((a, f) => a + f.copies, 0);
    document.getElementById("brMenuNote").innerHTML = n
      ? `${n} brane field${n === 1 ? "" : "s"}. The <b>dim</b> column counts the local ` +
        `representation; in four dimensions it splits into several pieces of the unbroken group, ` +
        `and the table on the right shows what it split into. A charge in <b>bold</b> was solved ` +
        `for or typed; the plain one is what the field's indices imply. ` +
        `<span class="chip ver">verified</span> the decomposition conserves states and the local ` +
        `charge, on every boundary condition of SU(3)…SU(7).`
      : `Nothing on the branes yet. With the bulk alone the ledger below is the one the ` +
        `<b>Anomalies</b> panel prints — this section starts where that one stops.`;
  },

  /* ---------------------------------------------------------------- the bill */

  _bill(b, bill) {
    const el = document.getElementById("brVerdict");
    const n = bill.brane.reduce((a, p) => a + p.copies, 0);
    if (!n) {
      el.className = "verdict stable";
      el.innerHTML = `<b>${bill.owedBefore === 0 ? "The bulk owes nothing" :
        `${bill.owedBefore} channel(s) owing, and nobody paying`}</b><span>` +
        (bill.owedBefore === 0
          ? `Either there is no massless fermion to have an anomaly, or the content already ` +
            `cancels. Adding brane matter can still <b>break</b> that, which is why the rows below ` +
            `keep both columns.`
          : `Put a field on a brane and the second column moves. Komori and Maru say what to put ` +
            `there, right after their eq. (76): the 4D fermion conjugate to each unwanted zero mode.`) +
        `</span>`;
    } else {
      const better = bill.owedAfter < bill.owedBefore, worse = bill.broken.length > 0;
      el.className = bill.owedAfter === 0 ? "verdict breaks" : "verdict stable";
      el.innerHTML = `<b>${bill.owedBefore} → ${bill.owedAfter} channel(s) owing</b><span>` +
        (bill.owedAfter === 0
          ? `Every channel cancels with the brane matter in. By Arkani-Hamed–Cohen–Georgi that is ` +
            `<b>sufficient</b> to kill the five-dimensional anomaly too, for the case they treat. ` +
            `<span class="chip thm">theorem</span>`
          : `${better ? `The brane paid ${bill.paid.length} channel(s). ` : ``}` +
            `${worse ? `<b>And broke ${bill.broken.length} that the bulk had already cancelled</b> — ` +
                       `a brane field pays into every channel it is charged under, not only the ones ` +
                       `you wanted. ` : ``}` +
            `What is left is what more matter, or a different charge, has to carry.`) +
        `</span>`;
    }

    const KIND = { "cubic-nonabelian": "--rust", mixed: "--blue", "cubic-abelian": "--green",
                   gravitational: "--amber" };
    document.getElementById("brRows").innerHTML = bill.bulkOnly.rows.map((r, i) => {
      const after = bill.total.rows[i];
      const z0 = rNum(r.value) === 0, z1 = rNum(after.value) === 0;
      return `<tr${z1 ? "" : ' style="background:var(--rust-l)"'}>` +
        `<td style="font-family:var(--mono);font-size:12.5px">` +
        `<i style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;` +
        `background:var(${KIND[r.kind]})"></i>${r.channel}</td>` +
        `<td class="num" style="color:var(--ink3)">${rShow(r.value)}</td>` +
        `<td class="num"><b>${rShow(after.value)}</b></td>` +
        `<td>${z1 ? '<span class="chip ver">cancels</span>'
                  : z0 ? '<span class="chip bad">broken</span>'
                       : '<span class="chip bad">owing</span>'}</td></tr>`;
    }).join("") || `<tr><td colspan="4" class="note">no channels: this boundary condition leaves ` +
                   `no group with an anomaly to have</td></tr>`;
    document.getElementById("brRowsNote").innerHTML =
      `Both columns are the <b>same</b> routine — the ledger of a list of pieces — run once without ` +
      `the brane matter and once with it. Every coefficient is an exact rational. A row marked ` +
      `<b>broken</b> was zero for the bulk and is not zero any more: the brane fields you chose ` +
      `carry a charge under it.`;
  },

  /* ---------------------------------------------------------------- the mass gate */

  _gate(b, gate) {
    const el = document.getElementById("brGateVerdict");
    const control = brGateControl(gate);
    el.className = gate.after < gate.before ? "verdict breaks" : "verdict stable";
    el.innerHTML = `<b>${gate.before} → ${gate.after} massless Weyl components</b><span>` +
      (gate.lifted
        ? `${gate.lifted} pair(s) of conjugate classes got a boundary mass. What is left is a ` +
          `<b>lower bound</b>: the rank test assumes generic couplings, and special ones leave more. ` +
          `<span class="chip mea">measured</span>`
        : `Nothing pairs. A boundary mass needs a class and its <b>conjugate</b> — the same ` +
          `representation under every factor and the opposite charge under every U(1) — and no two ` +
          `pieces here are related that way. <span class="chip mea">measured</span>`) +
      `<br>${control
        ? `<span class="chip ver">verified</span> the anomaly of what survives equals the anomaly ` +
          `of everything that entered, row for row — which it can only do if the pairs really are ` +
          `conjugate. Two independent routines agreeing on this model.`
        : `<span class="chip bad">the control failed</span> the survivors do not carry the same ` +
          `anomaly as the whole. Do not trust this table; the pairing is wrong.`}</span>`;

    const rows = gate.classes.slice().sort((x, y) => y.copies - x.copies).map((c) => {
      const s = gate.survivors.find((v) => v.key === c.key);
      const left = s ? s.left : 0, lifted = c.copies - left;
      return `<tr${left ? "" : ' style="color:var(--ink3)"'}>` +
        `<td style="font-family:var(--mono);font-size:12.5px">${c.show.rep}</td>` +
        `<td class="note" style="font-family:var(--mono);font-size:12px">${c.show.q}</td>` +
        `<td class="num">${c.fromBulk}</td><td class="num">${c.fromBrane}</td>` +
        `<td class="num">${lifted || "—"}</td><td class="num"><b>${left || "—"}</b></td></tr>`;
    });
    document.getElementById("brClasses").innerHTML = rows.join("") ||
      `<tr><td colspan="6" class="note">no massless fermion in the model, and nothing on the ` +
      `branes: there is nothing to pair</td></tr>`;
    const real = gate.survivors.filter((s) => s.real && s.left).length;
    document.getElementById("brClassesNote").innerHTML =
      `A <b>class</b> is a representation under every block AND all its U(1) charges — Part I's ` +
      `"rank test, not a count". Two pieces that look alike and are charged differently cannot be ` +
      `given a mass together, and a gate that grouped by the representation alone would say they ` +
      `can; the harness runs exactly that charge-blind gate as a decoy and requires it to disagree.` +
      (real ? ` <b>${real}</b> surviving class(es) are self-conjugate — real or pseudo-real with ` +
              `every charge zero. Whether their members pair among themselves is a Majorana ` +
              `question this gate does not adjudicate, so the count above is conservative there. ` +
              `<span class="chip bad">unknown</span>` : ``);
  },

  /* ---------------------------------------------------------------- the partners */

  _partners(ctx, b, gate) {
    const frame = an5Frame(b);
    const bulk = an5Pieces(b, this._content());
    const seen = new Map();
    for (const p of bulk) {
      const k = brClassKey(frame, p);
      if (!seen.has(k)) seen.set(k, { key: k, piece: p, show: brClassShow(frame, p), copies: 0 });
      seen.get(k).copies += p.copies;
    }
    const targets = [...seen.values()];
    if (!targets.some((t) => t.key === this._target)) this._target = targets.length ? targets[0].key : null;

    const tel = document.getElementById("brTargets");
    tel.innerHTML = targets.map((t) =>
      `<button class="ghost" data-t="${t.key}" style="${t.key === this._target
        ? "color:var(--rust);font-weight:650" : ""}">${t.show.rep}${t.copies > 1
        ? ` ×${t.copies}` : ""}</button>`).join("") ||
      `<span class="note">no massless bulk fermion: add one in the builder</span>`;
    tel.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => { this._target = btn.dataset.t; ctx.refresh(); };
    });

    const t = targets.find((x) => x.key === this._target);
    const el = document.getElementById("brPartners");
    if (!t) {
      el.innerHTML = `<tr><td colspan="4" class="note">nothing selected</td></tr>`;
      document.getElementById("brPartnersNote").innerHTML =
        `A massless mode is (+,+), so it is even under both reflections and non-zero at ` +
        `<b>both</b> fixed points: which brane can reach it is never the question. What decides is ` +
        `the group each brane has.`;
      return;
    }
    const cand = brPartnersFor(b, t.piece);
    el.innerHTML = cand.slice(0, 12).map((c) => {
      const k = this._key(c.field, c.field.chirality);
      const have = (SUN5D_S.brane[k] || {}).copies || 0;
      return `<tr><td style="font-family:var(--mono);font-size:12.5px;white-space:nowrap">` +
        `${c.label} · ${c.field.chirality}` +
        `<span style="color:var(--ink3)"> · ${c.where}</span></td>` +
        `<td class="num" style="font-family:var(--mono);font-size:12px">${rShow(c.q)}` +
        (c.shifted ? `<span style="color:var(--ink3)"> (indices: ${rShow(c.qInduced)})</span>`
                   : ``) + `</td>` +
        `<td class="num">${c.extraStates || "—"}</td>` +
        `<td class="num"><button class="ghost" data-add="${k}" style="white-space:nowrap">` +
        `${have ? `+1 (${have})` : "add it"}</button></td></tr>`;
    }).join("") || `<tr><td colspan="4" class="note">no representation on the menu contains its ` +
                   `conjugate</td></tr>`;
    el.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const c = cand.find((x) => this._key(x.field, x.field.chirality) === btn.dataset.add);
        const k = btn.dataset.add;
        const rec = SUN5D_S.brane[k] || { copies: 0, q: null };
        rec.copies += 1;
        rec.q = c.q;
        SUN5D_S.brane = { ...SUN5D_S.brane, [k]: rec };
        ctx.refresh();
      };
    });
    const pack = cand.filter((c) => c.extraStates > 0).length;
    document.getElementById("brPartnersNote").innerHTML =
      `The charge is <b>not a choice</b> here: gauge invariance of the mass term fixes the field's ` +
      `local charge to minus the mode's, and a candidate whose indices give a different value is ` +
      `saying that the representation alone will not do. ` +
      (pack ? `<b>${pack} of ${cand.length}</b> candidate(s) bring extra states with them — a ` +
              `local representation splits when it lands in four dimensions, and whatever else is ` +
              `in it arrives too. That is the package, and it is why "add the conjugate" is never ` +
              `the whole instruction. `
            : `Every candidate here contains the conjugate and nothing else, which is unusual. `) +
      `<span class="chip mea">measured</span> on the menu of local representations this instrument ` +
      `offers — fundamental, both rank-two tensors, adjoint, and the two bifundamentals.`;
  },

  /* ---------------------------------------------------------------- the solve */

  _solve(b, branes) {
    document.getElementById("brSolveNote").innerHTML =
      `A representation of SU(a) × SU(b) × U(1) may carry <b>any</b> rational charge under that ` +
      `U(1); nothing forces the value an SU(N) representation would have given. Part VI computes ` +
      `exactly this for the SU(7) model and finds three channels forcing one brane charge to a ` +
      `single value. Here it is the same solve for whatever you typed: the pure non-abelian cubes ` +
      `do not see the charges at all, <b>U(1)×[SU(n)]² and U(1)×[grav]² are linear</b> in them, and ` +
      `U(1)³ is cubic — so the linear block is solved in exact rationals and the cubic ones are ` +
      `evaluated at the answer and reported apart.`;

    const out = document.getElementById("brSolveOut");
    if (!branes.length) { out.innerHTML = `Put something on a brane and there will be a charge to solve for.`; return; }
    const sol = brSolveCharges(b, this._content(), branes);
    if (!sol.ok) {
      out.innerHTML = `<span class="chip bad">no solution</span> ${sol.why}. ` +
        (sol.rows ? `The channels that cannot be met: ${sol.rows.map((r) =>
          `<span style="font-family:var(--mono);font-size:12px">${r}</span>`).join(", ")}. ` +
          `More brane matter, or different representations, is the only way out — the charges alone ` +
          `cannot do it.` : ``);
      return;
    }
    out.innerHTML = `<span class="chip ver">solved</span> ` +
      branes.map((f, j) => `<span style="font-family:var(--mono);font-size:12px">${f.label} · ` +
        `${f.chirality} = ${rShow(sol.q[j])}</span>`).join(" &nbsp;·&nbsp; ") +
      `. Rank ${sol.rank}, ${sol.free} free direction${sol.free === 1 ? "" : "s"}. ` +
      (sol.cubic.length
        ? `<b>The cubic abelian channels are NOT zero at this answer</b> (${sol.cubic.length} of ` +
          `them), and that is not a detail the solve is allowed to swallow: paying the linear ` +
          `channels does not make the model anomaly-free. <span class="chip bad">still owing</span>`
        : `And the cubic abelian channels vanish there too. ` +
          (sol.clean ? `<span class="chip ver">every channel cancels</span>`
                     : `Non-abelian channels remain, and no charge can move those.`)) +
      ` Press <b>solve</b> to write these into the table above.`;
  },

  /* ---------------------------------------------------------------- the honesty */

  _honesty(b, gate) {
    document.getElementById("brHonesty").innerHTML =
      `<b>The sum, not the split.</b> Arkani-Hamed, Cohen and Georgi find the anomaly living ` +
      `entirely on the fixed points, half at each, for the case they treat. When the orbifold ` +
      `<em>breaks</em> the group the two fixed points do not see the same subgroup and the ` +
      `localised anomalies can be individually non-zero with a vanishing sum, to be absorbed by a ` +
      `Chern–Simons term or by brane fields. This panel reports the <b>sum</b>, exactly as the ` +
      `Anomalies panel does, and putting matter on one brane rather than the other does not change ` +
      `it. <span class="chip bad">unknown</span> — said out loud, with its reason.` +
      `<p style="margin:11px 0 0"><b>Generic couplings.</b> The mass gate is a rank test: with ` +
      `generic couplings the mass matrix between a class and its conjugate has maximal rank, so ` +
      `|difference| copies survive. Special couplings — a texture, a symmetry — leave <b>more</b> ` +
      `massless. What the page prints is therefore a lower bound on the surviving content, and it ` +
      `is one on purpose. Part I says the same thing in its own words: a count of "how many ` +
      `exotics" without this decomposition can declare a mass allowed that is not.</p>` +
      `<p style="margin:11px 0 0"><b>No U(1)′ beyond the local group.</b> A brane field charged ` +
      `under something the bulk gauge symmetry does not contain is a different model, not a longer ` +
      `table. Part VI's X_Q lives in such a U(1) and is handled in the <b>Escape</b> section, on ` +
      `the 6D model it belongs to.</p>` +
      `<p style="margin:11px 0 0"><b>And this is the symmetric point.</b> The local groups are ` +
      `statements about the two reflections and do not move with the Wilson line, but which modes ` +
      `are <em>massless</em> does: at a minimum with a non-zero phase the content is the one the ` +
      `<b>Spectrum</b> panel reads at the vacuum, and pairing it against brane matter is a longer ` +
      `computation than this section does. ` +
      `${gate.before ? `The ${gate.before} components above are the (+,+) content at the symmetric ` +
        `point.` : ``}</p>`;
  },
};

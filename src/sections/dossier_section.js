/* dossier_section.js — "One model, every verdict": the five panels joined, and the line that says
 * which of their answers are about the theory.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT IT ADDS THAT THE FIVE PANELS CANNOT.  The builder, the spectrum, the anomalies, Boundary
 * conditions and Part VII's kernel all answer about one 5D SU(N) model on S¹/Z₂.  Read one after
 * another they give eighteen numbers — and most of them are NOT properties of the model.  They
 * move when the boundary condition is replaced by a gauge-equivalent one, which is the same
 * theory.  Seeing that needs the equivalence class from one section and the verdicts from the
 * others at the same moment, so no panel can see it alone, and a reader stacking them by hand
 * comes away with a page of numbers of which a majority are about where they were standing.
 *
 * THE TAG IS MEASURED HERE, ON THIS RENDER.  Every line is recomputed for every member of the
 * class and tagged by what came back — never from a list of which lines "should" be invariant.
 * `_test_dossier.mjs` hands the same tagger two decoy lines whose answers are known in advance
 * (p, and p − s) and requires the two different tags.
 *
 * THE INTERACTION IS THE ARGUMENT.  Clicking a class-mate keeps the theory and changes the frame,
 * and the table redraws with the invariant rows standing still and the gauge rows moving.  That is
 * the dynamical rearrangement of gauge symmetry, done to a table rather than described.
 *
 * IT SHARES THE BUILDER'S MODEL, like the spectrum and anomaly panels: same boundary condition,
 * same bulk content, same state object.  Moving the representative here moves it there.
 *
 * Edited BY HAND.
 */
const DOSS_S = { separation: null, running: false };

const DOSS_SECTION = {
  id: "dossier",
  label: "One model, every verdict",
  paper: "the five panels, joined",
  ready: true,
  modules: [],

  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const bc = [b.nPP, b.nPM, b.nMP, b.nMM];
    let d = null;
    try { d = dossierForClass(bc, this._content(), { grid: 240, windings: 200 }); } catch { /**/ }
    return `SU(${b.N}) · S¹/Z₂ · [${bc}] · ` +
      (d ? `${d.counts.invariant} of ${d.lines.length} verdicts are the theory's, ` +
           `${d.counts.gauge} are the frame's`
         : "not resolved");
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">Five sections answer about this one model. Stacked, they give eighteen numbers
    — and <b>most of them are not properties of the model</b>. They move when the boundary
    condition is swapped for a gauge-equivalent one, which is the <b>same theory</b>. This page
    computes every line on every member of the class and says which is which.</p>
    <div class="note" style="margin-top:9px">The tag is a <b>measurement</b>, not a list:
    <b>invariant</b> means the line came back the same on every member of the class,
    <b>frame</b> means two members that are one theory disagreed, and <b>declined</b> means the
    computation refused and said why. Nothing here assumes which lines ought to be which — the
    harness gives the same tagger two decoy lines whose answers are known before it runs and
    requires it to separate them.${helpMark("gauge-or-physics")}</div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The model${helpMark("boundary-condition")}</h2>
        <div class="note" style="margin-bottom:10px">Edited in <b>SU(N) builder</b> — this is the
        same model object, not a copy of it.</div>
        <div id="dsModel"></div>
        <div class="verdict stable" id="dsHead" style="margin-top:12px"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Stand somewhere else in the same theory${helpMark("equivalence-class")}</h2>
        <p class="note" style="margin:0 0 10px">Every boundary condition below is the same theory as
        the one loaded. <b>Click one</b>: the invariant rows will not move and the frame rows will.
        </p>
        <div style="overflow-x:auto"><table><thead><tr><th>boundary condition</th>
          <th>apparent unbroken symmetry</th><th class="num">N_v</th></tr></thead>
          <tbody id="dsMembers"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="dsMembersNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>What this cannot tell you</h2>
        <div class="note" id="dsHonesty">—</div>
      </div>
    </div>
  </div>

  <!-- FULL WIDTH, because it is the answer and the other cards are its inputs.  Squeezed into
       half the page its three columns wrap into a stack and the tag stops sitting beside the
       value it is about, which is the one adjacency the whole panel exists for. -->
  <div class="card" style="margin-top:18px">
    <h2>Every verdict, tagged</h2>
    <div style="overflow-x:auto"><table><thead><tr><th style="width:34%">verdict</th>
      <th>value here</th><th style="width:14%">about</th></tr></thead>
      <tbody id="dsLines"></tbody></table></div>
    <div class="note" style="margin-top:9px" id="dsLinesNote">—</div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>And which of them separate one theory from another?</h2>
    <p class="note" style="margin:0 0 10px">Invariant is not the same as informative. A line
    that is the same for <i>every</i> class at this N separates nothing, however stable it is
    — N₀ is one, and so is N itself. Deciding that needs the whole lattice, which is why it is
    a button and not a render.${helpMark("separates-nothing")}</p>
    <div class="rowm">
      <span class="nm" style="flex:1" id="dsSepCost">—</span>
      <button class="st" id="dsSepGo"
              style="padding:3px 12px;width:auto;white-space:nowrap">run it</button>
    </div>
    <div id="dsSep" style="margin-top:11px"></div>
  </div>`,

  /* ---------------------------------------------------------------- the shared model */

  /* the builder's own bulk dial, in the shape the modules take.  Read, never written: the model
   * belongs to the builder and this section is a view on it. */
  _content() {
    return { gauge: true,
             bulk: Object.entries(SUN5D_S.bulk).filter(([, m]) => m).map(([k, m]) => {
               const [rep, eta, kind] = k.split("|");
               return { rep, eta: +eta, kind, multiplicity: m };
             }) };
  },

  _bc() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    return [b.nPP, b.nPM, b.nMP, b.nMM];
  },

  /* `init`, not `mount`: the shell calls `sec.init(ctx())` once after it writes `html`, and a hook
   * under any other name is simply never called — the button would have been dead on the page and
   * green in every harness that does not open one. */
  init(ctx) {
    document.getElementById("dsSepGo").onclick = () => {
      if (DOSS_S.running) return;
      DOSS_S.running = true;
      document.getElementById("dsSep").innerHTML =
        '<div class="note">walking every class…</div>';
      /* a frame so the note paints before the sweep blocks the thread */
      requestAnimationFrame(() => setTimeout(() => {
        const b = sun5dBlocks(SUN5D_S.blocks);
        DOSS_S.separation = dossierSeparation(b.N, this._content(), { grid: 120, windings: 120 });
        DOSS_S.running = false;
        ctx.refresh();
      }, 0));
    };
  },

  render(ctx) {
    const bc = this._bc(), content = this._content();
    const d = dossierForClass(bc, content, { grid: 240, windings: 200 });
    this._model(d);
    this._head(d);
    this._members(ctx, d);
    this._lines(d);
    this._separation(d);
    this._honesty(d);
  },

  /* ---------------------------------------------------------------- the model, read back */

  _model(d) {
    const b = d.ctx.b, bulk = d.ctx.content.bulk;
    const NAMES = { fund: "fundamental", anti: "antisymmetric", sym: "symmetric", adj: "adjoint" };
    document.getElementById("dsModel").innerHTML =
      `<table><tbody>` +
      `<tr><td>group and orbifold</td><td><b>SU(${b.N})</b> on S¹/Z₂</td></tr>` +
      `<tr><td>boundary condition</td><td><b>[${d.bc.join(", ")}]</b> — ` +
      `(n₊₊, n₊₋, n₋₊, n₋₋)</td></tr>` +
      `<tr><td>bulk content</td><td>${bulk.length
        ? bulk.map((f) => `${f.multiplicity} × ${f.kind} ${NAMES[f.rep] || f.rep} ` +
                          `(ηη′ = ${f.eta > 0 ? "+" : "−"})`).join("<br>")
        : "<i>gauge sector only</i>"}</td></tr>` +
      `<tr><td>equivalence class</td><td>class ${d.classId + 1}, ` +
      `<b>${d.size}</b> member${d.size === 1 ? "" : "s"}</td></tr>` +
      `</tbody></table>`;
  },

  _head(d) {
    const el = document.getElementById("dsHead");
    const inv = d.counts.invariant, ga = d.counts.gauge, de = d.counts.declined;
    if (d.size === 1) {
      el.className = "verdict breaks";
      el.innerHTML = `<b>A class of one, so nothing can be measured here</b><span>This boundary ` +
        `condition has no gauge-equivalent partner, so every line below is trivially the same on ` +
        `every member and the tag carries no information. Move to a boundary condition whose ` +
        `class has more than one member — the table on the left will have rows in it — and the ` +
        `question becomes answerable. <span class="chip bad">unknown</span></span>`;
      return;
    }
    el.className = "verdict stable";
    el.innerHTML = `<b>${inv} of the ${inv + ga} computed verdicts are about the theory</b>` +
      `<span>The other <b>${ga}</b> changed when the boundary condition was replaced by one of ` +
      `the ${d.size - 1} others in its class — the same theory in a different frame. ` +
      (de ? `${de} line${de === 1 ? "" : "s"} declined and say why. ` : ``) +
      `Measured on this render over all ${d.size} members. ` +
      `<span class="chip mea">measured</span></span>`;
  },

  /* ---------------------------------------------------------------- the class, walkable */

  _members(ctx, d) {
    const tb = document.getElementById("dsMembers");
    if (d.size === 1) {
      tb.innerHTML = `<tr><td colspan="3"><i>this class has one member</i></td></tr>`;
      document.getElementById("dsMembersNote").textContent =
        "A class of one: the boundary condition is alone in its orbit, so there is nowhere else " +
        "to stand.";
      return;
    }
    const here = d.bc.join(",");
    tb.innerHTML = d.members.map((m) => {
      const on = m.join(",") === here;
      return `<tr data-bc="${m.join(",")}" style="cursor:pointer${on ? ";font-weight:650" : ""}">` +
        `<td>${on ? "▸ " : ""}[${m.join(", ")}]</td>` +
        `<td>${bcUnbroken(m)}</td>` +
        `<td class="num">${bcEnergy(m, {}).Nv}</td></tr>`;
    }).join("");
    tb.querySelectorAll("tr[data-bc]").forEach((tr) => {
      tr.onclick = () => {
        const [p, q, r, s] = tr.dataset.bc.split(",").map(Number);
        SUN5D_S.blocks = { nPP: p, nPM: q, nMP: r, nMM: s };
        ctx.refresh();
      };
    });
    document.getElementById("dsMembersNote").innerHTML =
      `The only relation on S¹/Z₂ is <b>[p,q,r,s] ~ [p−1,q+1,r+1,s−1]</b> — ` +
      `Haba–Hosotani–Kawamura eq. (2.21). The orbit is walked here, not looked up. ` +
      `<span class="chip thm">theorem</span>`;
  },

  /* ---------------------------------------------------------------- the table that is the point */

  _lines(d) {
    const tb = document.getElementById("dsLines");
    let group = null;
    const rows = [];
    for (const l of d.lines) {
      if (l.group !== group) {
        group = l.group;
        rows.push(`<tr><td colspan="3" style="padding-top:11px"><b>${group}</b></td></tr>`);
      }
      const badge = l.tag === "invariant"
        ? `<span class="chip ver">the theory</span>`
        : l.tag === "gauge" ? `<span class="chip bad">the frame</span>`
                            : `<span class="chip bad">declined</span>`;
      const spread = l.tag === "gauge" && l.distinct.length > 1
        ? `<div class="note" style="margin-top:3px">across the class: ` +
          `${l.distinct.slice(0, 4).map((v) => `<code>${v}</code>`).join(" · ")}` +
          `${l.distinct.length > 4 ? ` … ${l.distinct.length} values` : ""}</div>`
        : "";
      rows.push(`<tr><td>${l.label}<div class="note" style="margin-top:2px">${l.cite}</div></td>` +
        `<td>${l.value === null ? "<i>—</i>" : l.value}${spread}</td>` +
        `<td>${badge}</td></tr>`);
    }
    tb.innerHTML = rows.join("");

    const refused = Object.values(d.refused);
    document.getElementById("dsLinesNote").innerHTML =
      (refused.length
        ? `<b>Declined:</b> ${refused.join("; ")}. `
        : ``) +
      `The class energy is computed for the <b>gauge sector alone</b>, and that is not a shortcut: ` +
      `HHK eq. (3.25) labels bulk matter by the parity <b>pair</b>, while the builder's content ` +
      `carries only the product ηη′, because for the spectrum that is all that is physical ` +
      `(Haba–Yamashita (3.4)–(3.5)). The finer label cannot be recovered from the coarser one, so ` +
      `handing the bulk over would mean inventing a split. The dial that does carry the pair is in ` +
      `<b>Boundary conditions</b>. <span class="chip bad">unknown</span>`;
  },

  /* ---------------------------------------------------------------- the third axis */

  _separation(d) {
    const N = d.ctx.b.N;
    const C = bcClasses(N, "S1/Z2");
    document.getElementById("dsSepCost").innerHTML =
      `SU(${N}): ${C.nBC} boundary conditions in ${C.nClasses} classes — about ` +
      `${Math.round(C.nBC * 2.5 / 100) / 10} s`;
    const el = document.getElementById("dsSep");
    const S = DOSS_S.separation;
    if (!S) { if (!DOSS_S.running) el.innerHTML = ""; return; }
    const nothing = S.lines.filter((l) => l.tag === "separates nothing");
    /* A SWEEP FROM ANOTHER N READS AS THIS ONE'S ANSWER.  The warning was written first and then
     * the table was assigned over the top of it, so a sweep run at SU(3) sat under a heading
     * saying SU(6) with nothing to say it was not about the model on screen.  The two go into one
     * assignment now — and the band is a verdict, not a note, because a caption is the thing a
     * reader skips.  This is exactly the failure the panel below it exists to name: a number that
     * is true of something else, printed where a number about this model belongs. */
    el.innerHTML =
      (S.N === N ? ""
        : `<div class="verdict breaks" style="margin-bottom:11px"><b>This sweep is SU(${S.N}), ` +
          `and the model is SU(${N})</b><span>The table below is a true statement about ` +
          `SU(${S.N}) and says nothing about the model loaded. Press <b>run it</b> again.` +
          `<span class="chip bad">unknown</span></span></div>`) +
      `<div style="overflow-x:auto"><table><thead><tr><th>verdict</th>` +
      `<th class="num">classes it splits</th><th class="num">answers between classes</th>` +
      `<th>about</th></tr></thead><tbody>` +
      S.lines.map((l) => `<tr><td>${l.label}</td>` +
        `<td class="num">${l.splitsWithin}</td><td class="num">${l.distinctBetween}</td>` +
        `<td>${l.tag === "invariant" ? '<span class="chip ver">the theory</span>'
              : l.tag === "gauge" ? '<span class="chip bad">the frame</span>'
              : '<span class="chip bad">separates nothing</span>'}</td></tr>`).join("") +
      `</tbody></table></div>` +
      `<div class="note" style="margin-top:9px">SU(${S.N}): ${S.nBC} boundary conditions, ` +
      `${S.nClasses} classes, ${S.multi} of them with more than one member. ` +
      (nothing.length
        ? `<b>${nothing.map((l) => l.label).join(", ")}</b> ` +
          `take one value over every class here, so they separate no theory from any other, ` +
          `however stable they are.`
        : `Every line separates at least two classes at this N.`) +
      ` <span class="chip mea">measured</span></div>`;
  },

  /* ---------------------------------------------------------------- the honesty */

  _honesty(d) {
    document.getElementById("dsHonesty").innerHTML =
      `<b>Invariant on the class is not the same as true of the vacuum.</b> Every line here except ` +
      `the depth and position of the minimum is computed at the <b>symmetric point</b> of the ` +
      `boundary condition loaded — the massless content, the anomaly ledger and the apparent ` +
      `group all read the (+,+) states at θ = 0. That is exactly why they move across the class: ` +
      `the class relation is a shift along the Wilson line, so a class-mate's symmetric point is ` +
      `this one's <em>other</em> symmetric point. The instrument does not yet compute the massless ` +
      `content <b>at the minimum</b>, which is what would turn those three lines into statements ` +
      `about the theory rather than about the frame. That is a gap in the tool, not a subtlety of ` +
      `the physics. <span class="chip bad">unknown</span>` +

      `<p style="margin:11px 0 0"><b>Two phases is the ceiling on the vacuum.</b> The minimiser ` +
      `covers one and two; past that a grid on a torus is a hope rather than an instrument, and ` +
      `the line declines. That bites at ${"SU(8)"} and above: every boundary condition of SU(N) is ` +
      `covered up to N = 5, 95% at N = 6, 87% at N = 7 and 62% at N = 10.</p>` +

      `<p style="margin:11px 0 0"><b>And a class of one measures nothing.</b> The tag is an ` +
      `equality across members; with one member every line is trivially equal to itself. ` +
      `${d.size === 1 ? "That is the case right now." : `This class has ${d.size} members.`}</p>`;
  },

  /* ---------------------------------------------------------------- the export */

  texExport() {
    const d = dossierForClass(this._bc(), this._content(), { grid: 240, windings: 200 });
    const values = {
      boundary_condition: val(`(${d.bc.join(", ")})`,
        { status: STATUS.THEOREM, source: "Haba-Yamashita eq. (5.1), simultaneously diagonal" }),
      class_size: val(d.size,
        { status: STATUS.THEOREM, source: "HHK eq. (2.21), orbit walked in the browser" }),
      verdicts_invariant: val(d.counts.invariant,
        { status: STATUS.MEASURED,
          source: "recomputed on every member of the class on this render" }),
      verdicts_frame_dependent: val(d.counts.gauge,
        { status: STATUS.MEASURED, source: "the same walk" }),
    };
    for (const l of d.lines)
      values[l.key] = l.value === null
        ? unknown(d.refused.bridge || "the computation declined for this boundary condition")
        : val(l.value, { status: l.tag === "invariant" ? STATUS.MEASURED : STATUS.UNKNOWN,
                         source: l.tag === "invariant"
                           ? `${l.cite}; the same on all ${d.size} members of the class`
                           : `${l.cite}; NOT a class invariant — it differs on a gauge-equivalent ` +
                             `boundary condition, so it is a property of the frame` });
    return {
      card: makeCard({ group: "su3_hy", section: "dossier", N: d.ctx.b.N, blocks: d.bc,
                       bulk: d.ctx.content.bulk }, values, { version: VERSION, build: BUILD }),
      mathKeys: ["unbroken"],
      caption: `SU(${d.ctx.b.N}) on $S^1/Z_2$ with boundary condition ` +
               `$(${d.bc.join(", ")})$: every verdict the instrument computes, each marked ` +
               `according to whether it survived being recomputed on all ${d.size} ` +
               `gauge-equivalent boundary conditions of its class.`,
    };
  },
};

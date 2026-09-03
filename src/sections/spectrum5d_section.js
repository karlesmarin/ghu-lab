/* spectrum5d_section.js — "4D spectrum": what the model you just built actually CONTAINS.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The SU(N) builder gives the potential and the vacuum; the boundary-conditions section says which
 * boundary conditions are the same theory.  Neither says what the theory HAS.  This does: the
 * four-dimensional fields, massless and towered, with their quantum numbers.  It is Table 1 of
 * every paper in this field, and it is what a reader needs before any of the dynamics means
 * anything.
 *
 * IT SHARES THE BUILDER'S MODEL.  Same boundary condition, same bulk content, same state object —
 * change it in either panel and both follow.  That is the point of an instrument rather than a
 * pile of calculators, and it is why this section takes no inputs of its own except WHERE on the
 * Wilson line to look: at the vacuum the builder found, or at a phase you type.
 *
 * Edited BY HAND.
 */
const SPEC5D_S = { theta: null, atVacuum: true };

const SPEC5D_SECTION = {
  id: "spectrum5d",
  label: "4D spectrum",
  paper: "Haba–Yamashita 2004 §3 · Haba–Hosotani–Kawamura 2004 §3",
  ready: true,
  modules: [],

  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    return `SU(${b.N}) · S¹/Z₂ · (${b.nPP},${b.nPM},${b.nMP},${b.nMM}) → ${sun5dUnbroken(b)} · ` +
           `the 4D content` +
           (SPEC5D_S.atVacuum ? ", at the vacuum" : ", at a typed Wilson line");
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">The builder gives the potential and the vacuum; this says what the theory
    <b>contains</b>. One rule does all of it — the mode expansion is fixed by the pair of Z₂
    parities a state carries, and only <b>(+,+)</b> has a zero mode.</p>
    <div class="note" style="margin-top:9px">Two riders, and they are the physics. <b>A_y carries
    the opposite parity to A_μ</b>, so the massless vectors are the unbroken group and the massless
    scalars are exactly where the vectors are not — that is where the Higgs candidates live. And
    <b>a Dirac fermion's two chiralities carry opposite parities</b>, because the orbifold condition
    carries a γ₅, so at most one of them can be (+,+): a massless 4D fermion here is automatically
    <b>chiral</b>, which is the whole reason for orbifolding. Haba–Yamashita eqs. (3.4)–(3.5).
    <span class="chip thm">theorem</span></div>
    <div class="rowm" style="margin-top:11px">
      <span class="nm" style="flex:0;width:120px">Wilson line</span>
      <button class="ghost" id="spAtVac">at the vacuum</button>
      <input id="spTheta" type="text" size="18"
             style="font-family:var(--mono);font-size:13px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;width:170px">
      <span class="note" style="flex:1" id="spThetaNote">— one number per phase, comma separated</span>
    </div>
    <div class="note" style="margin-top:9px">The model is <b>the builder's</b> — change the boundary
    condition or the bulk there and this follows. If you arrived here first:
    <button class="ghost" id="spExample">▶ load their §4.3 SU(6) with four fundamentals</button></div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The massless four-dimensional content${helpMark("zero-mode")}</h2>
        <div style="overflow-x:auto"><table><thead><tr><th></th><th>field</th>
          <th>under the unbroken group</th><th class="num">how many</th></tr></thead>
          <tbody id="spZero"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="spZeroNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>Is it chiral?${helpMark("chiral")}</h2>
        <div class="verdict stable" id="spChiral"><b>—</b><span>—</span></div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The eigenvalues of D_y², family by family</h2>
        <p class="note" style="margin:0 0 10px">This is the object the papers publish — a
        multiplicity, a Kaluza-Klein offset and a charge — and it is what you would copy into
        one. In units of 1/R₅, squared.</p>
        <div id="spFamilies"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The spectrum and the potential are the same data</h2>
        <div class="note" id="spCross">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What this panel does not do</h2>
        <div class="note">Turning the families into a list of <b>levels</b> would need the cos/sin
        bookkeeping at n = 0, and that is exactly where the two integer families differ: a (+,+)
        state expands in cos and <b>has</b> a zero mode, a (−,−) state expands in sin and has none.
        So the massless content on the left comes from the <b>parity rule</b> and not from
        evaluating a family at n = 0 — a tower drawn the second way would put states at zero mass
        that are not there. The sources present it the same way, and so does this.
        <span class="chip thm">theorem</span> Haba–Yamashita eq. (3.5).</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    $("spAtVac").onclick = () => { SPEC5D_S.atVacuum = true; SPEC5D_S.theta = null; ctx.refresh(); };
    /* THE PANEL CARRIES ITS OWN EXAMPLE, and that is not only for a reader who lands here first.
     * The default state is the gauge sector alone, which has no fermions -- so the chirality
     * verdict, which is the one statement this section exists for, would be photographed by
     * nobody.  A shooter variant cannot reach the builder's controls either, because only one
     * section is mounted at a time.  One button fixes both. */
    $("spExample").onclick = () => {
      SUN5D_S.blocks = { nPP: 1, nPM: 3, nMP: 0, nMM: 2 };
      SUN5D_S.bulk = { "fund|1|dirac": 4 };
      SUN5D_S.preset = "hy6b";
      SPEC5D_S.atVacuum = true; SPEC5D_S.theta = null;
      ctx.refresh();
    };
    $("spTheta").onchange = () => {
      const v = $("spTheta").value.split(",").map((x) => parseFloat(x.trim()))
                                  .filter((x) => Number.isFinite(x));
      if (v.length) { SPEC5D_S.theta = v; SPEC5D_S.atVacuum = false; }
      else { SPEC5D_S.theta = null; SPEC5D_S.atVacuum = true; }
      ctx.refresh();
    };
  },

  /* the phase this panel is looking at: the builder's vacuum, or what was typed.  `edge` matters
   * and is carried out: the ends of the fundamental domain are the two SYMMETRIC points, and a
   * minimum sitting on one of them is not a broken vacuum — it is the neighbouring boundary
   * condition seen from here. */
  _theta(b, terms) {
    if (!b.phases) return { theta: [], edge: false };
    if (!SPEC5D_S.atVacuum && SPEC5D_S.theta)
      return { theta: Array.from({ length: b.phases }, (_, i) => SPEC5D_S.theta[i] ?? 0),
               edge: false, typed: true };
    if (!terms.length) return { theta: new Array(b.phases).fill(0), edge: true };
    const m = sun5dMinimum(terms, b.phases, { grid: b.phases === 1 ? 400 : 160 })
           || (b.phases > 2 ? sun5dMinimumRestarts(terms, b.phases, { restarts: 24 }) : null);
    return m ? { theta: m.theta, edge: m.atEdge } : { theta: new Array(b.phases).fill(0), edge: true };
  },

  render(ctx) {
    const $ = (id) => document.getElementById(id);
    const b = sun5dBlocks(SUN5D_S.blocks);
    const content = { bulk: Object.entries(SUN5D_S.bulk).filter(([, m]) => m).map(([k, m]) => {
      const [rep, eta, kind] = k.split("|");
      return { rep, eta: +eta, kind, multiplicity: m };
    }) };
    const terms = sun5dTerms(b, content);
    const { theta, edge } = this._theta(b, terms);
    $("spTheta").value = theta.map((x) => (+x.toFixed(5))).join(", ");
    $("spAtVac").style.color = SPEC5D_S.atVacuum ? "var(--rust)" : "";
    $("spAtVac").style.fontWeight = SPEC5D_S.atVacuum ? "650" : "";
    /* AND IF THE DEEPEST POINT IS AN END OF THE DOMAIN, SAY WHAT THAT IS.  The ends are the two
     * symmetric points; a minimum there is not the Hosotani mechanism, it is the neighbouring
     * boundary condition — the one the equivalence-class section reaches by its single move —
     * seen from this side.  Labelling it "the vacuum" and stopping would be the same overclaim
     * the builder's own verdict was corrected for. */
    const nb = [SUN5D_S.blocks.nPP - 1, SUN5D_S.blocks.nPM + 1,
                SUN5D_S.blocks.nMP + 1, SUN5D_S.blocks.nMM - 1];
    const canMove = nb.every((x) => x >= 0);
    $("spThetaNote").innerHTML = b.phases
      ? `${b.phases} phase${b.phases === 1 ? "" : "s"} — ${SPEC5D_S.atVacuum
          ? "showing the deepest point the builder locates, recomputed here"
          : "showing a phase you typed, not the vacuum"}. The massless content on the left is the ` +
        `content at <b>θ = 0</b> and does not move with this; the families on the right do.` +
        (SPEC5D_S.atVacuum && edge
          ? ` <b style="color:var(--rust)">And that point is an END of the domain</b>, which is the ` +
            `OTHER symmetric point and not a broken vacuum` +
            (canMove ? ` — the spectrum here is that of the gauge-equivalent boundary condition ` +
                       `[${nb.join(", ")}], one class move away.` : ".")
          : "")
      : "this boundary condition leaves no Wilson-line phase at all";

    this._zero(ctx, b, content);
    this._chiral(ctx, b, content);
    this._families(ctx, b, content, theta);
    this._cross(ctx, b, content, theta, terms);
    void edge;
  },

  /* ---------------------------------------------------------------- the massless content */

  _zero(ctx, b, content) {
    const Z = sp5ZeroModes(b, content);
    const KIND = { vector: ["gauge boson", "--blue"], scalar: ["scalar", "--green"],
                   fermion: ["Weyl fermion", "--rust"] };
    const rows = Z.list.sort((x, y) => (x.kind < y.kind ? -1 : 1) || y.n - x.n).map((z) => {
      const [name, col] = KIND[z.kind];
      return `<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:3px;` +
        `background:var(${col})"></i></td>` +
        `<td>${name}${z.chirality ? ` <b>${z.chirality}</b>` : ""}` +
        `${z.kind === "scalar" && z.rep === "adj" ? " <span class=\"note\">from A_y</span>" : ""}</td>` +
        `<td class="note">${z.label}</td><td class="num">${z.n}</td></tr>`;
    }).join("");
    document.getElementById("spZero").innerHTML = rows ||
      `<tr><td colspan="4" class="note">nothing massless — every state is in a tower</td></tr>`;
    document.getElementById("spZeroNote").innerHTML =
      `<b>${Z.vectors}</b> massless vectors, which is the dimension of <b>${sun5dUnbroken(b)}</b>; ` +
      `<b>${Z.scalars}</b> massless scalars, all of them from A_y — the (−,−) part of the adjoint, ` +
      `which is where the Wilson lines are; and <b>${Z.fermions}</b> massless Weyl fermions. ` +
      `The scalars are <b>${Z.scalars}</b> real components but only <b>${b.phases}</b> of them are ` +
      `independent Wilson-line phases: the residual global symmetry eats the rest, which is why ` +
      `Haba–Yamashita's eq. (5.4) is a min and not a product. ` +
      `<span class="chip thm">theorem</span> counted from the parities, and held to ` +
      `Haba–Hosotani–Kawamura eq. (3.20) in the harness.`;
  },

  /* ---------------------------------------------------------------- chirality */

  _chiral(ctx, b, content) {
    const Z = sp5ZeroModes(b, content);
    const el = document.getElementById("spChiral");
    const L = Z.list.filter((x) => x.chirality === "L").reduce((a, x) => a + x.n, 0);
    const R = Z.list.filter((x) => x.chirality === "R").reduce((a, x) => a + x.n, 0);
    if (!L && !R) {
      el.className = "verdict stable";
      el.innerHTML = `<b>No bulk fermions</b><span>Add a Dirac fermion in the builder and the ` +
        `question becomes one. The gauge sector alone has nothing to be chiral about.</span>`;
      return;
    }
    el.className = L !== R ? "verdict breaks" : "verdict stable";
    el.innerHTML = L !== R
      ? `<b>Yes — ${L} left-handed against ${R} right-handed</b><span>The two chiralities of a ` +
        `Dirac fermion carry opposite parities, so they land in different blocks and are counted ` +
        `by different numbers. That is the orbifold doing the one thing a flat extra dimension ` +
        `cannot: producing a chiral four-dimensional theory. It is a property of the <b>boundary ` +
        `condition</b> — set the blocks so that the two counts agree and the same field becomes ` +
        `vector-like. <span class="chip thm">theorem</span></span>`
      : `<b>No — ${L} left-handed and ${R} right-handed</b><span>Vector-like: the massless ` +
        `fermions pair up. Chirality is a property of the boundary condition, not of the orbifold ` +
        `alone, and this one does not deliver it for this content.</span>`;
  },

  /* ---------------------------------------------------------------- the families */

  _families(ctx, b, content, theta) {
    const el = document.getElementById("spFamilies");
    if (!b.phases) {
      el.innerHTML = `<div class="note">No Wilson-line phase: every family sits at charge zero and ` +
        `the spectrum does not move.</div>`;
      return;
    }
    const names = sun5dNames(b);
    const all = sp5AllFamilies(b, content, theta);
    el.innerHTML = all.map((g) => {
      const line = g.families.map((f) => sp5ShowFamily(f, names)).join("  +  ");
      const tot = g.families.reduce((a, f) => a + f.n, 0);
      return `<div style="margin-bottom:11px">` +
        `<div style="font-size:12.5px;color:var(--ink2);font-weight:650">${g.from}` +
        `<span class="note" style="font-weight:400"> — ${tot} states</span></div>` +
        `<div style="font-family:var(--mono);font-size:12.5px;line-height:1.8;` +
        `word-break:break-word">${line}</div></div>`;
    }).join("") ||
      `<div class="note">gauge sector only — press a multiplicity in the builder</div>`;
    /* A_μ AND A_y SHARE A FAMILY LIST, and a reader who notices will want to know why rather than
     * suspect a bug.  The Kaluza-Klein offset depends on the PRODUCT P₀P₁, and A_y flips BOTH
     * parities, which leaves the product alone.  What it changes is which states have zero
     * modes — the whole left-hand panel — and nothing about the tower. */
    if (all.length >= 2)
      el.innerHTML += `<div class="note" style="border-top:1px solid var(--line);padding-top:10px">` +
        `<b>A_μ and A_y have the same families, and that is not a repetition.</b> The offset of a ` +
        `tower depends on the <em>product</em> P₀P₁, and A_y flips <em>both</em> parities, which ` +
        `leaves the product alone. What it changes is which states have a <b>zero mode</b> — the ` +
        `panel on the left — and nothing at all about the tower.</div>`;
    this._ladder(el, b, content, theta);
  },

  /* THE EXACT TOWER AT THIS POINT, and why it is a second block rather than a correction to the
   * first.  The families above are the potential's multiset and are right for it; at a broken
   * vacuum they are wrong at the LOWEST level of the adjoint and the symmetric tensor, where a
   * Cartan direction the per-state bookkeeping keeps at charge zero has in fact become the W of
   * mass t.  The block below reads the eigenvalues of P₁′P₀ instead (vacuum5d.mjs), splits the
   * Θ = 0 eigenspace by the joint invariants, and prints every field's lightest state in units
   * of the lightest massive vector — the number a model builder wants first. */
  _ladder(el, b, content, theta) {
    let L;
    try { L = vac5Ladder(vac5Frame(b, theta), content); } catch (e) {
      el.innerHTML += `<div class="note">the exact tower declined: ${e.message}</div>`;
      return;
    }
    const X = vac5Confront(L);
    const f4 = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(4));
    const gev = (r) => {
      if (!X.located) return "—";
      const row = X.rows.find((q) => q.field === r.field);
      return row && row.firstMassiveGeV !== null ? `${Math.round(row.firstMassiveGeV)}` : "—";
    };
    const fam = (r) => r.families.map((f) =>
      f.x === 0 ? `${f.massless ? `${f.massless}×0` : ""}${f.massless && f.odd ? ", " : ""}` +
                  `${f.odd ? `${f.odd}×(n≥1)` : ""}`
      : f.x === 0.5 ? `${f.towers}×(n+½)`
      : `${f.towers}×|n ± ${f4(f.x)}|`).filter(Boolean).join("  ·  ");
    el.innerHTML += `<div style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px">` +
      `<div style="font-size:12.5px;color:var(--ink2);font-weight:650">The exact tower at this ` +
      `point, from the eigenvalues of P₁′P₀${helpMark("at-the-minimum")}` +
      `<span class="note" style="font-weight:400"> — masses in units of 1/R; ` +
      (L.mWR === null ? `no massive vector to measure against` :
       `the lightest massive vector, the W, sits at <b>m·R = ${f4(L.mWR)}</b>`) + `</span></div>` +
      `<div style="overflow-x:auto"><table><thead><tr><th>field</th><th>towers</th>` +
      `<th class="num">massless</th><th class="num">first massive / m_W</th>` +
      `<th class="num">first massive, GeV</th></tr></thead><tbody>` +
      L.rows.map((r) => `<tr><td>${r.field}</td>` +
        `<td style="font-family:var(--mono);font-size:12px">${fam(r)}</td>` +
        `<td class="num">${r.massless}</td>` +
        `<td class="num">${r.overW === null ? "—" : f4(r.overW)}</td>` +
        `<td class="num">${gev(r)}</td></tr>`).join("") +
      `</tbody></table></div>` +
      (X.located
        ? `<div class="note" style="margin-top:6px"><b>Against the data:</b> with ` +
          `m_W = ${X.mW.value} ± ${X.mW.error} GeV (PDG 2025), 1/R = ` +
          `<b>${(X.invRGeV / 1000).toFixed(3)} TeV</b>; ${X.kk.sentence} ` +
          `(CMS JHEP 05 (2020) 033).${helpMark("against-the-data")} ` +
          `<span class="chip ${X.kk.verdict === "above the bound" ? "ver" : "bad"}">${X.kk.verdict}</span></div>`
        : ``) +
      `<div class="note" style="margin-top:6px">The families above are the potential's multiset ` +
      `and are right for it; at a broken vacuum they are wrong at the <b>lowest level</b> of the ` +
      `adjoint and of the symmetric tensor, where the Cartan direction they keep at charge zero ` +
      `has become the W. This table reads the eigenvalues of P₁′P₀ with the Θ = 0 eigenspace split ` +
      `by the joint invariants, and its tower multiset reproduces the potential above to 10⁻⁹ ` +
      `(<code>_test_vacuum5d.mjs</code>). <span class="chip thm">theorem</span></div></div>`;
  },

  /* ---------------------------------------------------------------- the cross-check */

  _cross(ctx, b, content, theta, terms) {
    const el = document.getElementById("spCross");
    if (!b.phases || !terms.length) {
      el.innerHTML = "nothing to compare: there is no phase-dependent potential here.";
      return;
    }
    /* the same identity the harness asserts, evaluated on this render for this model */
    let worst = 0;
    for (const rep of ["adj", "fund", "anti", "sym"])
      for (const eta of [+1, -1])
        for (const n of [1, 2, 3]) {
          const c = sp5PotentialCheck(b, rep, eta, theta, n);
          worst = Math.max(worst, Math.abs(c.moving - 2 * c.fromTerms));
        }
    el.innerHTML =
      `A cosine in the potential is a <b>pair of states</b> in the spectrum: the term ` +
      `<span style="font-family:var(--mono)">m·cos(nπ(c·θ − d))</span> is two states at charge ` +
      `±c/2, and d = 1 is the half-integer tower. So summing cos(2πnQ) over the states of a ` +
      `representation must reproduce the potential's own bracket — the potential counts each ± ` +
      `pair once and the states count both, so the factor is exactly <b>2</b>, and it is asserted ` +
      `rather than assumed. Checked here on this model, for four representations × two parities × ` +
      `three windings: worst gap <b>${worst.toExponential(1)}</b>. ` +
      (worst < 1e-9
        ? `<span class="chip ver">verified</span> two constructions that share no code, one object.`
        : `<b style="color:var(--rust)">The two do NOT agree — one of the modules is wrong, and ` +
          `this sentence is the alarm.</b>`);
  },
};

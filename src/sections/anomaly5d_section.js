/* anomaly5d_section.js — "Anomalies": the bill a chiral spectrum runs up, channel by channel.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT KILLS MOST MODELS.  The spectrum panel says the four-dimensional content is chiral — that is
 * the point of orbifolding — and a chiral spectrum is inconsistent unless its gauge anomalies
 * cancel.  Checking that is tedious, has to be done channel by channel, and is exactly where an
 * arithmetic slip hides best.  It is the first gate a model builder runs and the instrument did
 * not have it.
 *
 * WHY THE FOUR-DIMENSIONAL ANOMALY IS THE RIGHT OBJECT.  Arkani-Hamed, Cohen and Georgi compute
 * the anomaly on S¹/Z₂ and find it lives entirely on the fixed points, independent of the shape of
 * the mode: their eq. (4.38) is ∂_C J^C = ½[δ(x₄) + δ(x₄ − L)] Q, so each fixed point picks up
 * half of the anomaly of the chiral zero mode, and — their words — "the cancellation of the
 * four-dimensional anomaly is sufficient to eliminate the five-dimensional anomaly".
 *
 * AND WHAT THE PANEL REFUSES TO SAY.  A non-zero entry is NOT a verdict of inconsistency.  Every
 * model of this kind carries brane fields, because the unwanted zero modes must be given mass, and
 * a brane fermion conjugate to a zero mode contributes to the same channels with the opposite
 * sign.  So the ledger reports a BILL, and says who can pay it.
 *
 * It shares the builder's model, like the spectrum panel: one model, three views.
 *
 * Edited BY HAND.
 */
const ANOM5D_SECTION = {
  id: "anomaly5d",
  label: "Anomalies",
  paper: "Arkani-Hamed–Cohen–Georgi 2001 · Part VI",
  ready: true,
  modules: [],

  holds() {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const L = an5Ledger(b, this._content());
    return `SU(${b.N}) · S¹/Z₂ · (${b.nPP},${b.nPM},${b.nMP},${b.nMM}) · ` +
           `${L.nFermions} massless Weyl fermion${L.nFermions === 1 ? "" : "s"} · ` +
           (L.clean ? "every channel cancels" : `${L.offending.length} channel(s) owing`);
  },

  _content() {
    return { bulk: Object.entries(SUN5D_S.bulk).filter(([, m]) => m).map(([k, m]) => {
      const [rep, eta, kind] = k.split("|");
      return { rep, eta: +eta, kind, multiplicity: m };
    }) };
  },

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead">A chiral four-dimensional spectrum is <b>inconsistent</b> unless its gauge
    anomalies cancel. That is the first gate a model has to pass, it has to be checked channel by
    channel, and it is where an arithmetic slip hides best.</p>
    <div class="note" style="margin-top:9px">Arkani-Hamed, Cohen and Georgi (hep-th/0103135) compute
    the anomaly on S¹/Z₂ and find it lives entirely on the fixed points and does not depend on the
    shape of the mode — their eq. (4.38), <span style="font-family:var(--mono)">∂_C J^C = ½[δ(x₄) +
    δ(x₄ − L)]&nbsp;Q</span>: each fixed point picks up <b>half</b> of the anomaly of the chiral
    zero mode. In their words, <em>"the cancellation of the four-dimensional anomaly is sufficient
    to eliminate the five-dimensional anomaly"</em>. So the object below is the four-dimensional
    anomaly of the massless content. <span class="chip thm">theorem</span></div>
    <div class="note" style="margin-top:9px">The model is <b>the builder's</b>.
    <button class="ghost" id="anExample">▶ load their §4.3 SU(6) with four fundamentals</button></div>
  </div>

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The verdict</h2>
        <div class="verdict stable" id="anVerdict"><b>—</b><span>—</span></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The ledger</h2>
        <div style="overflow-x:auto"><table><thead><tr><th>channel</th>
          <th class="num">coefficient</th><th></th></tr></thead>
          <tbody id="anRows"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="anRowsNote">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>What it is summing over</h2>
        <p class="note" style="margin:0 0 10px">The massless Weyl fermions, as representations of
        the unbroken group. A right-handed one is counted as a left-handed one in the conjugate,
        which is why some entries carry a minus.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>piece</th><th>chirality</th>
          <th>blocks</th><th class="num">copies</th></tr></thead>
          <tbody id="anPieces"></tbody></table></div>
        <div class="note" style="margin-top:9px" id="anPiecesNote">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What this panel does not decide</h2>
        <div class="note" id="anHonesty">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    document.getElementById("anExample").onclick = () => {
      SUN5D_S.blocks = { nPP: 1, nPM: 3, nMP: 0, nMM: 2 };
      SUN5D_S.bulk = { "fund|1|dirac": 4 };
      SUN5D_S.preset = "hy6b";
      ctx.refresh();
    };
  },

  render(ctx) {
    const b = sun5dBlocks(SUN5D_S.blocks);
    const content = this._content();
    const L = an5Ledger(b, content);
    this._verdict(b, L);
    this._rows(b, L);
    this._pieces(b, L);
    this._honesty(b, L);
    void ctx;
  },

  /* ---------------------------------------------------------------- the verdict */

  _verdict(b, L) {
    const el = document.getElementById("anVerdict");
    if (!L.pieces.length) {
      el.className = "verdict stable";
      el.innerHTML = `<b>No massless fermions</b><span>The gauge sector carries no anomaly, and ` +
        `there are no bulk Dirac fermions in the model. Add one in the builder and there will be ` +
        `something to check — and, on a boundary condition that breaks the group, almost certainly ` +
        `something to pay.</span>`;
      return;
    }
    el.className = L.clean ? "verdict breaks" : "verdict stable";
    el.innerHTML = L.clean
      ? `<b>Every channel cancels</b><span>The four-dimensional gauge anomaly of the ` +
        `${L.nFermions} massless Weyl fermions vanishes in all ${L.rows.length} channels the ` +
        `unbroken group has. By Arkani-Hamed–Cohen–Georgi that is <b>sufficient</b> to kill the ` +
        `five-dimensional anomaly as well, for the case they treat. ` +
        `<span class="chip thm">theorem</span></span>`
      : `<b>${L.offending.length} channel${L.offending.length === 1 ? "" : "s"} left owing</b>` +
        `<span>The bulk alone does not cancel, and that is the <b>normal</b> situation rather than ` +
        `a failure: the unwanted zero modes have to be given mass anyway, and Komori and Maru say ` +
        `how in as many words after their eq. (76) — one introduces the 4D fermion <em>conjugate</em> ` +
        `to each of them, on a fixed point. A conjugate brane fermion contributes to these same ` +
        `channels with the <b>opposite sign</b>. So this is a bill, and the rows below say how ` +
        `much. <span class="chip mea">measured</span></span>`;
  },

  /* ---------------------------------------------------------------- the ledger */

  _rows(b, L) {
    const KIND = { "cubic-nonabelian": "--rust", mixed: "--blue", "cubic-abelian": "--green",
                   gravitational: "--amber" };
    document.getElementById("anRows").innerHTML = L.rows.map((r) => {
      const zero = rNum(r.value) === 0;
      return `<tr${zero ? "" : ' style="background:var(--rust-l)"'}>` +
        `<td style="font-family:var(--mono);font-size:12.5px">` +
        `<i style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;` +
        `background:var(${KIND[r.kind]})"></i>${r.channel}</td>` +
        `<td class="num"><b>${rShow(r.value)}</b></td>` +
        `<td>${zero ? '<span class="chip ver">cancels</span>'
                    : '<span class="chip bad">owing</span>'}</td></tr>`;
    }).join("") || `<tr><td colspan="3" class="note">no channels: this boundary condition leaves ` +
                   `no group with an anomaly to have</td></tr>`;
    const kinds = new Set(L.rows.map((r) => r.kind));
    document.getElementById("anRowsNote").innerHTML =
      `${L.rows.length} channels — ` +
      [["cubic-nonabelian", "[SU(n)]³"], ["mixed", "U(1)×[SU(n)]²"],
       ["cubic-abelian", "U(1)³"], ["gravitational", "U(1)×[grav]²"]]
        .filter(([k]) => kinds.has(k))
        .map(([k, n]) => `<i style="display:inline-block;width:8px;height:8px;border-radius:2px;` +
             `background:var(${KIND[k]})"></i> ${n}`).join(" · ") +
      `. Every coefficient is an exact rational: a zero here is zero, not a rounding. ` +
      `<b>SU(2) never appears in a cubic channel</b> because it has none — its representations are ` +
      `pseudoreal — and a U(1) is listed only when its generator is not the zero matrix, which ` +
      `needs at least two blocks filled.`;
  },

  /* ---------------------------------------------------------------- the pieces */

  _pieces(b, L) {
    const NAMES = ["(+,+)", "(+,−)", "(−,+)", "(−,−)"];
    const sizes = [b.nPP, b.nPM, b.nMP, b.nMM];
    document.getElementById("anPieces").innerHTML = L.pieces.map((p) =>
      `<tr><td style="font-family:var(--mono);font-size:12.5px">${p.rep}</td>` +
      `<td><b>${p.chirality}</b></td>` +
      `<td class="note">${NAMES[p.blockA]}${p.blockB === null ? "" : " × " + NAMES[p.blockB]}` +
      ` <span style="color:var(--ink3)">(${sizes[p.blockA]}` +
      `${p.blockB === null ? "" : ", " + sizes[p.blockB]})</span></td>` +
      `<td class="num">${p.copies}</td></tr>`).join("") ||
      `<tr><td colspan="4" class="note">none</td></tr>`;
    document.getElementById("anPiecesNote").innerHTML =
      `<b>${L.nFermions}</b> massless Weyl components in ${L.pieces.length} pieces. Complex ` +
      `scalars are not here: they carry no gauge anomaly. Nor is the gauge sector — a vector is ` +
      `not chiral. And the adjoint's <b>trace</b> is a singlet with zero charge under every U(1), ` +
      `so it is invisible to every channel; the spectrum panel removes it from its count and this ` +
      `one does too, so the two numbers agree. <span class="chip ver">verified</span> the harness ` +
      `compares the counts by two routes.`;
  },

  /* ---------------------------------------------------------------- the honesty */

  _honesty(b, L) {
    document.getElementById("anHonesty").innerHTML =
      `<b>Where the anomaly SITS, as opposed to how much there is.</b> ACG's split is even — half ` +
      `at each fixed point — for the case they treat. When the orbifold <em>breaks</em> the group ` +
      `the two fixed points do not see the same unbroken subgroup, and the localised anomalies can ` +
      `be individually non-zero with a vanishing sum, to be absorbed by a Chern–Simons term or by ` +
      `brane fields. This panel reports the <b>sum</b>. Part VI's own table says the same thing in ` +
      `one line: localised anomalies constrain brane charges, and Green–Schwarz can absorb mixed ` +
      `U(1) ones. <span class="chip bad">unknown</span> — said out loud, with its reason.` +
      `<p style="margin:11px 0 0"><b>And a non-zero row is not a verdict.</b> It is what the brane ` +
      `has to carry. Part VI computes exactly this for the SU(7) model and finds three channels ` +
      `forcing one brane charge to a single value; the same arithmetic, on whatever boundary ` +
      `condition you typed, is above.</p>` +
      `<p style="margin:11px 0 0"><b>Scope.</b> 5D SU(N) on S¹/Z₂, bulk Dirac fermions in the ` +
      `fundamental, the two rank-two tensors and the adjoint. Not 6D, where there are ` +
      `gravitational and reducible Green–Schwarz anomalies this ledger knows nothing about — and ` +
      `the SU(7) model of Komori–Maru is 6D, so <em>this panel is not about it</em>.</p>`;
    void L;
  },
};

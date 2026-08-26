/* selection_section.js — Part III: one bit decides how much of the torus you must search.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Three other sections depend on this rule and none of them shows it.  This is its face, and it is
 * built around the one thing worth a reader's attention: the rule is arithmetic on three integers,
 * and the claim it makes -- half the torus is redundant -- is testable by a computation that has
 * never heard of Dynkin labels.  So the section runs that test, on the loaded content immediately
 * and on the whole catalogue at the press of a button, and reports disagreements rather than counts.
 *
 * The catalogue table is the colour: every representation, and what the rule says about it.  Colour
 * carries the DECISION (half the torus, or all of it), never the rank of anything, and no cell
 * relies on colour alone -- the region is printed as an interval beside it.
 *
 * Edited BY HAND.
 */
const SEL_DATA = DATASETS.su4_ahmn;
let SEL_FILTER = "all";
let SEL_SWEEP = null;
let SEL_CELL = [0, 2, 1];      /* the Part II probe: opens on the 60, Part I's minimal host */

/* The pair, and here it carries the section's whole subject: the rule says which part of the
 * torus you never have to search, so the part you never have to search is GREYED on both panels
 * -- desaturated, not removed, because it is still part of the object.
 *
 * A rule about a domain, argued without showing the domain, was what this section was. */
const SEL_PANELS = makeTorusPanels({
  data: SEL_DATA,
  ids: { map: "sMap", surf: "sSurf", cur: "sPCur", mode: "sPMode",
         go: "sPGo", sim: "sPSim", basins: "sPBasins" },
});

const SEL_TINT = (on) => on
  ? "color:var(--green);background:var(--green-l);border-radius:5px;padding:1px 6px"
  : "color:var(--rust);background:var(--rust-l);border-radius:5px;padding:1px 6px";

const SELECTION_SECTION = {
  id: "selection",
  label: "Selection rule",
  paper: "Part III",
  ready: true,
  modules: [selectionModule(SEL_DATA)],

  html: `
  <div class="card" style="margin-bottom:18px">
    <p class="lead" id="sLead">—</p>
    <div class="note" style="margin-top:9px" id="sCheck">—</div>
  </div>
  ${SEL_PANELS.html({ title: "The domain the rule is about — grey is the half you need not search" })}

  <div class="grid two">
    <div>
      <div class="card">
        <h2>The rule, put at risk</h2>
        <div class="verdict" id="sVerdict"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:10px">
          The rule reads three integers. The potential sums windings over a mode table. They share no
          line of code, so if the rule were wrong about which half of the torus is redundant, the
          potential would say so — and this panel would print the representations where they disagree.
        </div>
        <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;align-items:center">
          <button class="ghost" id="sSweep">▶ test the rule on every representation</button>
          <span class="note" id="sSweepNote"></span>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>And the rule is one bit</h2>
        <p style="margin:0 0 8px">The published form is a disjunction — even parity <i>or</i>
        degenerate. The second half never fires:</p>
        <div class="note" style="font-family:var(--mono);line-height:1.7;margin-bottom:9px">
          a + 2b + 3c ≡ a + c&nbsp;&nbsp;(mod 2)<br>
          degenerate ⇒ b odd and (a, c both odd, or a = c) ⇒ a + c even<br>
          so degenerate ⇒ not odd, and&nbsp; ¬odd ∨ degenerate&nbsp;=&nbsp;¬odd
        </div>
        <div class="verdict breaks" id="sReduce"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px">Not a correction to Part III — the rule as published
        is right. A reduction of it: <b>the search domain is decided by the parity of a + c alone</b>.
        Degeneracy still decides where the tower pairs; it just does not decide this.</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>What the rule says about this content</h2>
        <table><thead><tr><th>multiplet</th><th class="num">a+2b+3c</th><th>parity</th>
          <th>degenerate</th><th>α₂ region</th></tr></thead><tbody id="sRows"></tbody></table>
        <div class="note" style="margin-top:9px" id="sConj">—</div>
      </div>

      <div class="card" style="margin-top:18px">
        <h2>The three gates of Part II — can it hold a quark generation?</h2>
        <p class="note" style="margin:0 0 10px">An irrep (a,b,c) contains the Standard-Model quark
        cell <span style="font-family:var(--mono)">{Q(2,&#8534;), u(1,&#8532;), d(1,−&#8531;)}</span>
        in its chiral zero modes <b>iff</b> three gates pass — one arithmetic, one geometric, one
        of size. Try any labels:</p>
        <div id="s2Probe"></div>
        <div class="verdict stable" id="s2V" style="margin-top:11px"><b>—</b><span>—</span></div>
        <div class="note" style="margin-top:9px" id="s2Min">—</div>
      </div>
    </div>

    <div>
      <div class="card">
        <h2>The catalogue</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="sFilters"></div>
        <div style="max-height:520px;overflow:auto;margin:0 -4px;padding:0 4px;box-shadow:inset 0 -14px 12px -12px rgba(20,40,60,.13)">
          <table><thead><tr><th>rep</th><th class="num">(a,b,c)</th><th>search region in α₂</th>
            <th class="num">zero modes</th><th>generation · Part II</th></tr></thead>
            <tbody id="sCat"></tbody></table>
        </div>
        <div class="note" style="margin-top:9px" id="sCatNote">—</div>
      </div>
    </div>
  </div>`,

  init(ctx) {
    const $ = (id) => document.getElementById(id);
    SEL_PANELS.attach();
    const FILTERS = [["all", "all"], ["half", "half the torus"], ["full", "the whole torus"],
                     ["gen", "hosts a generation"]];
    $("sFilters").innerHTML = FILTERS.map(([k, lab]) =>
      `<button class="ghost" data-f="${k}">${lab}</button>`).join("");
    $("sFilters").querySelectorAll("button").forEach((b) => {
      b.onclick = () => { SEL_FILTER = b.dataset.f; ctx.refresh(); };
    });
    $("sSweep").onclick = () => {
      $("sSweepNote").textContent = "running…";
      /* next frame, so the word is painted before the loop blocks */
      setTimeout(() => { SEL_SWEEP = sweepAll(ctx.DATA); ctx.refresh(); }, 20);
    };
  },

  render(ctx, r) {
    const $ = (id) => document.getElementById(id);
    const D = ctx.DATA;
    const dom = r.values.get("legal_domain"), facts = r.values.get("rep_facts");
    const chk = r.values.get("domain_check");

    /* ---- the answer ---- */
    if (dom.status === "unknown") {
      /* The lead says what to DO; the reason belongs below it, once.  Printing the resolver's
       * sentence in both places -- which is what shipped -- reads as a stutter and tells the reader
       * nothing twice. */
      $("sLead").innerHTML = `Nothing loaded. <b>Click a representation</b> in the catalogue and ` +
                             `the rule will decide how much of the torus you have to search.`;
      $("sCheck").innerHTML = `<span style="color:var(--ink2)">${dom.reason}</span>`;
      $("sRows").innerHTML = "";
      $("sConj").textContent = "—";
      SEL_PANELS.setTint(null);
      SEL_PANELS.setContent(null);
    } else {
      const half = dom.value.half_domain;
      /* The licensed region is alpha_2 in [0, 1/2] when the rule clears, the whole torus when it
       * does not.  So the grey is exactly the half you are told you need not search -- and when
       * the rule does NOT clear, nothing is greyed, which is the honest picture of "you have to
       * look everywhere". */
      SEL_PANELS.setTint(half ? (u, v) => v > 0.5 : null);
      const spS = spectrum((r.model.bulk || []).map((b) => ({ key: b.rep, n: b.multiplicity,
                                                              eta: b.eta ?? 1, role: b.role ?? 1 })),
                           D);
      const vacS = spS.length ? minimise(spS, lattice(D.kmax)) : null;
      SEL_PANELS.setContent(spS.length ? spS : null, vacS && vacS.alpha);
      $("sLead").innerHTML = half
        ? `Every representation here allows it, so <b>half the torus is redundant</b>: the vacuum ` +
          `can be searched over α₂ ∈ <b>[0, ½]</b> and nothing is lost.`
        : `<b>The whole torus must be searched</b>, α₂ ∈ <b>[0, 1]</b> — blocked by ` +
          `<b>${dom.value.blocked_by.join(", ")}</b>. One representation is enough to lose the halving.`;

      const F = facts.value;
      $("sRows").innerHTML = F.map((f) => {
        const reg = f.half_domain ? "[0, ½]" : "[0, 1]";
        return `<tr><td style="font-family:var(--mono)">${f.rep}</td>` +
               `<td class="num">${f.centre_charge}</td><td>${f.parity}</td>` +
               `<td>${f.degenerate ? "yes" : "no"}</td>` +
               `<td><span style="${SEL_TINT(f.half_domain)};font-family:var(--mono)">${reg}</span></td></tr>`;
      }).join("");
      const blockers = F.filter((f) => !f.half_domain).length;
      $("sConj").innerHTML = F.length < 2
        ? `The half-domain for a content of several representations is the <b>conjunction</b> — ` +
          `add a second multiplet and one “[0, 1]” row will decide the whole search.`
        : `The domain is the <b>conjunction</b> of the rows: ${blockers === 0
            ? "all of them allow the halving, so the content does."
            : `${blockers} of ${F.length} force the full torus, so the content does too.`} ` +
          `That composition is ours, not a quoted statement.`;
    }

    /* ---- the check on this content ---- */
    if (chk.status === "unknown") {
      $("sCheck").innerHTML = `<span style="color:var(--ink2)">Not tested here: ${chk.reason}</span>`;
      $("sVerdict").className = "verdict";
      $("sVerdict").innerHTML = "<b>—</b><span>Load a content to test the rule on it.</span>";
    } else {
      const v = chk.value;
      $("sCheck").innerHTML = v.agrees
        ? `<b>And it was just checked.</b> The potential at α₂ and 1−α₂ agrees to ` +
          `<b>${v.defect.toExponential(1)}</b> relative — ` +
          (v.symmetric
            ? `<span style="color:var(--green)">symmetric, exactly as the rule predicted</span>.`
            : `<span style="color:var(--green)">not symmetric, exactly as the rule predicted</span>.`)
        : `<b style="color:var(--rust)">The rule and the potential disagree here.</b> The rule says ` +
          `${v.predicted ? "the half-domain is legal" : "the full torus is needed"}, and the ` +
          `potential is ${v.symmetric ? "symmetric" : `not (defect ${v.defect.toExponential(1)})`}.`;

      $("sVerdict").className = "verdict " + (v.agrees ? "breaks" : "stable");
      $("sVerdict").innerHTML = v.agrees
        ? `<b>On this content the rule holds</b><span>Predicted ${v.predicted ? "symmetric" : "asymmetric"}, ` +
          `measured ${v.symmetric ? "symmetric" : "asymmetric"}, defect ${v.defect.toExponential(1)}. ` +
          `One content is one test; the sweep below is 119 of them.</span>`
        : `<b>Disagreement</b><span>This is the outcome the panel exists to be able to report. ` +
          `Defect ${v.defect.toExponential(1)}.</span>`;
    }

    /* Computed here, in front of the reader, rather than quoted from a comment. */
    {
      let fires = 0, both = 0, n = 0, degen = 0;
      for (let a = 0; a <= 14; a++) for (let b = 0; b <= 14; b++) for (let c = 0; c <= 14; c++) {
        n++;
        if (halfDomain(a, b, c) !== halfDomainReduced(a, b, c)) fires++;
        if (degenerate(a, b, c)) { degen++; if (oddParity(a, b, c)) both++; }
      }
      $("sReduce").className = "verdict " + (fires === 0 ? "breaks" : "stable");
      $("sReduce").innerHTML = fires === 0
        ? `<b>Checked on ${n} triples just now: no exception</b><span>${degen} of them are ` +
          `degenerate, so the clause is not empty — and not one of those ${degen} has odd parity, ` +
          `which is why it can never change the answer.</span>`
        : `<b style="color:var(--rust)">${fires} exceptions</b><span>The reduction is wrong; use ` +
          `the published form.</span>`;
    }

    this._cell();

    if (SEL_SWEEP) {
      const s = SEL_SWEEP;
      $("sSweepNote").innerHTML = s.disagreements.length
        ? `<span style="color:var(--rust)"><b>${s.disagreements.length} disagreement(s)</b>: ` +
          `${s.disagreements.slice(0, 6).join(", ")}</span>`
        : `<b>${s.tested}</b> representations tested, <b>${s.symmetric}</b> symmetric and ` +
          `<b>${s.tested - s.symmetric}</b> not — and the rule called every one of them correctly. ` +
          `<span style="color:var(--green)">No disagreement.</span>`;
    }

    /* ---- the catalogue ---- */
    const held = new Set(ctx.n.map((n, i) => (n ? ctx.SLOTS[i].rep : null)).filter(Boolean));
    const all = D.catalogue.map((c) => {
      const d = D.reps_dynkin[c.name];
      return d ? { name: c.name, dim: c.dim, ...repFacts(d[0], d[1], d[2]) } : null;
    }).filter(Boolean);
    const show = all.filter((f) => SEL_FILTER === "all" ||
      (SEL_FILTER === "half" && f.half_domain) ||
      (SEL_FILTER === "full" && !f.half_domain) ||
      (SEL_FILTER === "gen" && f.hosts_generation));

    document.getElementById("sFilters").querySelectorAll("button").forEach((b) => {
      b.style.color = b.dataset.f === SEL_FILTER ? "var(--rust)" : "";
      b.style.fontWeight = b.dataset.f === SEL_FILTER ? "650" : "";
    });

    $("sCat").innerHTML = show.map((f) => {
      const reg = f.half_domain ? "[0, ½]" : "[0, 1]";
      /* the generation column now says WHICH gate refuses, not just that one does */
      const g2 = cellGates(f.dynkin[0], f.dynkin[1], f.dynkin[2]);
      return `<tr${held.has(f.name) ? ' style="background:var(--amber-l)"' : ""}>` +
        `<td><button class="ghost" style="padding:0;font-family:var(--mono);color:inherit" ` +
        `data-load="${f.name}" title="load this representation">${f.name}</button></td>` +
        `<td class="num" style="font-family:var(--mono);color:var(--ink3)">${f.dynkin.join(",")}</td>` +
        `<td><span style="${SEL_TINT(f.half_domain)};font-family:var(--mono)">${reg}</span></td>` +
        `<td class="num">${f.zero_modes === null ? "—" : f.zero_modes}</td>` +
        `<td>${g2.admits ? "<b>yes</b>"
             : `<span style="color:var(--ink3);font-size:11px">${g2.failing.join(", ")}</span>`}</td></tr>`;
    }).join("");
    $("sCat").querySelectorAll("button[data-load]").forEach((b) => {
      b.onclick = () => ctx.load([{ rep: b.dataset.load, parities: [1, 1], multiplicity: 1,
                                    eta: 1, role: 1 }]);
    });
    const nHalf = all.filter((f) => f.half_domain).length;
    $("sCatNote").innerHTML =
      `${show.length} of ${all.length} shown. Across the whole catalogue <b>${nHalf}</b> allow the ` +
      `halving and <b>${all.length - nHalf}</b> do not — so the bit is close to a coin toss, which ` +
      `is why it has to be checked rather than assumed. Click a name to load it.` +
      /* The footer promises no empty cell, and a bare dash with no key is one. */
      `<br><span style="color:var(--ink3)">A dash under <i>zero modes</i> means ` +
      `N = (b+1)(a+c+1)/2 comes out a half-integer — which happens exactly when b is even and ` +
      `a + c is even (checked on every triple up to 14). The count does not apply there.</span>`;
  },

  /* ---- Part II's three gates, on a probe of the reader's own -------------------------------
   * View state, not model state: the probe asks a question about a representation, whether or
   * not the model holds it.  Clicking a stepper repaints this card alone -- the model, and
   * everything resolved from it, is untouched. */
  _cell() {
    const $ = (id) => document.getElementById(id);
    const [a, b, c] = SEL_CELL;
    $("s2Probe").innerHTML = ["a", "b", "c"].map((nm, i) =>
      `<div class="rowm"><span class="nm">${nm}</span>` +
      `<button class="st" data-i="${i}" data-d="-1">−</button>` +
      `<span class="cnt">${SEL_CELL[i]}</span>` +
      `<button class="st" data-i="${i}" data-d="1">+</button>` +
      (i === 0 ? `<span class="note" style="flex:1;text-align:right">opens on the 60 = (0,2,1), ` +
                 `Part I's minimal host</span>` : ``) + `</div>`).join("");
    $("s2Probe").querySelectorAll("button.st").forEach((bt) => (bt.onclick = () => {
      SEL_CELL[+bt.dataset.i] = Math.max(0, Math.min(12, SEL_CELL[+bt.dataset.i] + (+bt.dataset.d)));
      this._cell();
    }));

    const g = cellGates(a, b, c);
    const sum = a + b + c, cc = centreCharge(a, b, c);
    const chip = (okv, lab) => `<span class="chip ${okv ? "thm" : "bad"}">${lab}</span>`;
    $("s2V").className = "verdict " + (g.admits ? "breaks" : "stable");
    $("s2V").innerHTML =
      `<b>(${a},${b},${c}) — dim ${g.dim} — ${g.admits ? "hosts the quark cell"
        : `does not: ${g.failing.join(", ")}`}</b>` +
      `<span>${chip(g.centre, `arithmetic: a+2b+3c = ${cc}, ${g.centre ? "odd" : "even"}`)} ` +
      `${chip(g.middle, `geometric: b = ${b}${g.middle ? " ≥ 1" : ""}`)} ` +
      `${chip(g.size, `size: a+b+c = ${sum}${g.size ? " ≥ 3" : " < 3"}`)}` +
      (g.admits
        ? `<br>N = (b+1)(a+c+1)/2 = <b>${g.N}</b> right-handed charge slots — an integer because ` +
          `the centre gate forces a + c odd — with the singlets spanning a middle-node extent of ` +
          `12b = ${g.extent}. And the same odd centre charge means it <b>always forces the full ` +
          `torus</b> above: Parts II and III read one bit in opposite directions.`
        : ``) +
      ` <span class="chip thm">theorem</span> Part II — the centre gate is classical (Slansky's ` +
      `congruency class), inherited not invented; the chiral projection and the closed count are ` +
      `the paper's own.</span>`;

    const min = minimalAdmitting();
    $("s2Min").innerHTML =
      `Swept every (a,b,c) with labels ≤ 8 just now: the <b>smallest</b> representation through ` +
      `the gates has dimension <b>${min.dim}</b>, at ${min.labels.map((L) => `(${L.join(",")})`).join(" and ")}. ` +
      `Part I found the 60 minimal by exhaustive scan over embeddings; here it drops out of ` +
      `three inequalities. <span class="chip thm">theorem</span> the gates; ` +
      `<span class="chip ver">verified</span> the recovery of Part I's headline.`;
  },
};

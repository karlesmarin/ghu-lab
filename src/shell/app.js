/* app.js — the shell: one model PER GROUP, a rail grouped by family, and a router.  DESIGN.md D6.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Holds the models, renders the pinned header, and hands the active section a context.  It computes
 * nothing.
 *
 * THE RULE, in its honest form.  A model is a statement about ONE group: an SU(7) content cannot
 * travel to an SU(4) section, and a shell that pretended otherwise would be lying in its most
 * visible element.  So the instrument holds one model per group, the rail is grouped by family, and:
 *
 *     within a family, switching section leaves the model exactly as it was;
 *     across families, you are moving to a different model, and the header says so.
 *
 * That keeps polymake's `application 'topaz';` where it applies and states the boundary where it
 * does not, which is better than a uniformity that is not true.
 *
 * The permalink carries every non-empty model, so a link restores the whole instrument and not just
 * the panel that was open.  It lives in the URL fragment: works from file://, needs no storage.
 *
 * Edited BY HAND.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------------------------------------------------------------- families and slots */

  const FAMILIES = [];
  for (const s of SECTIONS)
    if (!FAMILIES.some((f) => f.group === s.group))
      FAMILIES.push({ group: s.group, name: s.family, sections: [] });
  for (const s of SECTIONS) FAMILIES.find((f) => f.group === s.group).sections.push(s);

  const SLOTS = {};                       /* group -> [{rep, key, parities}] */
  for (const f of FAMILIES) {
    const D = DATASETS[f.group];
    const out = [];
    if (D) for (const rep of Object.keys(D.reps || D.reps_modes || {}))
      for (const key of Object.keys((D.reps && D.reps[rep]) || { "(+,+)": 1 }))
        out.push({ rep, key, parities: [key[1] === "+" ? 1 : -1, key[3] === "+" ? 1 : -1] });
    SLOTS[f.group] = out;
  }

  /* Multiplicity, boundary sign and role, one array per group.  eta and role are properties of a
   * multiplet IN A MODEL, not of the kernel, so they live here with the content and travel into the
   * model record -- which is what lets the calculator read them without a side channel. */
  /* The gauge seed is a convention of the MODEL -- which split of the gauge degrees of freedom the
   * base point stands on -- so it lives beside the content and travels into the record, where
   * every default is echoed.  Groups whose data carries one seed simply never move it. */
  /* The BRANE half of the record, per group -- Part VI's inputs: the brane-quark charge, the rung
   * of each lepton generation, the U(1)'-breaking scalar.  Empty means "the paper's defaults", and
   * the escape module echoes what it filled in, so this state holds only what the user typed. */
  const RATIONAL = /^[+-]?\d+(?:\/[1-9]\d*)?$/;
  function cleanBrane(b) {
    const out = { X_Q: "", rungs: null, q_phi: "" };
    if (!b) return out;
    const rat = (s) => { s = String(s == null ? "" : s).trim().replace("−", "-");
                         return RATIONAL.test(s) ? s : ""; };
    out.X_Q = rat(b.X_Q);
    out.q_phi = rat(b.q_phi);
    if (Array.isArray(b.rungs) && b.rungs.length)
      out.rungs = b.rungs.slice(0, 3).map((k) => Math.max(0, Math.min(3, Math.round(+k) || 0)));
    return out;
  }
  const state = { n: {}, eta: {}, role: {}, seed: {}, brane: {},
                  section: SECTIONS.find((s) => s.ready !== false).id };
  for (const f of FAMILIES) {
    state.n[f.group] = SLOTS[f.group].map(() => 0);
    state.eta[f.group] = SLOTS[f.group].map(() => 1);
    state.role[f.group] = SLOTS[f.group].map(() => 1);
    state.seed[f.group] = "published";
    state.brane[f.group] = cleanBrane(null);
  }

  /* SEED EACH GROUP WITH ITS ANCHOR.  Opened empty, three of the five sections showed nothing but
   * dashes and a header reading UNKNOWN 10 -- technically honest and useless: an instrument that
   * starts on a blank model teaches nobody what it does.  Every group therefore opens on the
   * published content it is validated against, named in the header, and one button clears it.
   * A permalink overrides this, so a shared link still shows exactly what was shared. */
  function anchorOf(group) {
    const D = DATASETS[group];
    if (D.anchor && D.anchor.bulk) return D.anchor.bulk;
    /* No silent fallback to "the first row": which row a group opens on is a decision, and it is
     * recorded in the data file beside the rows themselves. */
    return null;
  }
  for (const f of FAMILIES) {
    const bulk = anchorOf(f.group);
    if (!bulk) continue;
    SLOTS[f.group].forEach((s, i) => {
      const b = bulk.find((x) => x.rep === s.rep &&
        (x.parities[0] > 0 ? "+" : "-") === s.key[1] &&
        (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
      if (!b) return;
      state.n[f.group][i] = b.multiplicity;
      state.eta[f.group][i] = b.eta === undefined ? 1 : b.eta;
      state.role[f.group][i] = b.role === undefined ? 1 : b.role;
    });
  }

  const active = () => SECTIONS.find((s) => s.id === state.section);
  const activeGroup = () => active().group;
  const D = () => DATASETS[activeGroup()];

  /* What the user typed of the brane, as record entries; nothing typed is an empty list, and the
   * escape module fills the paper's defaults and echoes them. */
  function braneList(group) {
    const b = state.brane[group], out = [];
    if (b.X_Q) out.push({ kind: "quarks", X_Q: b.X_Q });
    if (b.rungs) out.push({ kind: "leptons", rungs: b.rungs });
    if (b.q_phi) out.push({ kind: "scalar", q_phi: b.q_phi });
    return out;
  }

  function model(group = activeGroup()) {
    const Dg = DATASETS[group];
    return complete({
      schema_version: SCHEMA_VERSION, group: Dg.group,
      orbifold: { name: Dg.orbifold.name }, brane: braneList(group),
      /* only a group that carries several seeds may name one; otherwise the default stands and
       * is echoed as a default, which is what it is */
      conventions: Dg.gauge_seeds && state.seed[group] !== "published"
        ? { gauge_seed: state.seed[group] } : {},
      bulk: SLOTS[group].map((s, i) => ({ rep: s.rep, parities: s.parities,
                                          multiplicity: state.n[group][i],
                                          eta: state.eta[group][i], role: state.role[group][i] }))
                        .filter((b) => b.multiplicity),
    }).model;
  }

  /* Only the active family's modules run: a section of another group has nothing to say about this
   * model, and running it would produce unknowns that mean nothing. */
  function mods(group = activeGroup()) {
    const seen = new Set(), out = [];
    for (const s of SECTIONS)
      if (s.group === group)
        for (const m of s.modules || []) if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
    return out;
  }

  function run() {
    const m = model();
    const { values, skipped } = resolve(mods(), m);
    return { model: m, values, skipped };
  }

  /* ---------------------------------------------------------------- permalink */

  const encGroup = (g) =>
    state.n[g].map((v, i) => (v ? `${SLOTS[g][i].rep}${SLOTS[g][i].key}*${v}` : null))
              .filter(Boolean).join(";");

  function encode() {
    const parts = [`s=${state.section}`];
    for (const f of FAMILIES) {
      const c = encGroup(f.group);
      if (c) parts.push(`${f.group}=${encodeURIComponent(c)}`);
      if (state.seed[f.group] !== "published") parts.push(`${f.group}.seed=${state.seed[f.group]}`);
      /* the brane travels exactly as the seed does: only what the user typed, nothing defaulted */
      const b = state.brane[f.group], bp = [];
      if (b.X_Q) bp.push("x:" + b.X_Q);
      if (b.rungs) bp.push("r:" + b.rungs.join(","));
      if (b.q_phi) bp.push("q:" + b.q_phi);
      if (bp.length) parts.push(`${f.group}.brane=${encodeURIComponent(bp.join("|"))}`);
    }
    /* A SECTION THAT HOLDS ITS OWN MODEL NEEDS ITS OWN PERMALINK.  The parameters above belong to
     * the shell's per-group model; a section that declares `holds()` carries something the shell
     * does not know about, and until it can be put in the URL it cannot be SENT to anyone -- which
     * is the whole use of a demonstration.  Any section may opt in with `encodeState`. */
    for (const sec of SECTIONS) {
      if (!sec.encodeState) continue;
      const v = sec.encodeState();
      if (v) parts.push(`${sec.id}.s=${encodeURIComponent(v)}`);
    }
    return "#" + parts.join("&");
  }

  function decode() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return false;
    const q = Object.fromEntries(h.split("&").map((kv) => {
      const i = kv.indexOf("=");
      return i < 0 ? [kv, ""] : [kv.slice(0, i), decodeURIComponent(kv.slice(i + 1))];
    }));
    if (q.s && SECTIONS.some((x) => x.id === q.s && x.ready !== false)) state.section = q.s;
    for (const f of FAMILIES) {
      const sd = q[`${f.group}.seed`], Dg = DATASETS[f.group];
      state.seed[f.group] = sd && Dg.gauge_seeds && Dg.gauge_seeds[sd] ? sd : "published";
      const bb = q[`${f.group}.brane`], raw = {};
      if (bb) for (const tok of bb.split("|")) {
        const j = tok.indexOf(":");
        if (j < 0) continue;
        const k = tok.slice(0, j), val = tok.slice(j + 1);
        if (k === "x") raw.X_Q = val;
        else if (k === "q") raw.q_phi = val;
        else if (k === "r") raw.rungs = val.split(",");
      }
      state.brane[f.group] = cleanBrane(bb ? raw : null);
      if (!q[f.group]) continue;
      state.n[f.group] = SLOTS[f.group].map(() => 0);
      for (const tok of q[f.group].split(";")) {
        const mm = tok.match(/^(.+?)(\(.,.\))\*(\d+)$/);
        if (!mm) continue;
        const i = SLOTS[f.group].findIndex((s) => s.rep === mm[1] && s.key === mm[2]);
        if (i >= 0) state.n[f.group][i] = Math.min(30, +mm[3]);
      }
    }
    /* the other half of the section permalink; a section given no parameter is reset to its
     * defaults rather than left holding whatever the last link put there */
    for (const sec of SECTIONS)
      if (sec.decodeState) sec.decodeState(q[`${sec.id}.s`]);
    return true;
  }

  /* ---------------------------------------------------------------- chrome */

  function rail() {
    $("rail").innerHTML = FAMILIES.map((f) => {
      const head = `<span class="fam">${f.group === activeGroup() ? "<b>" + f.name + "</b>" : f.name}</span>`;
      const items = f.sections.map((s) => {
        const cls = s.ready === false ? "soon" : (s.id === state.section ? "on" : "");
        return `<a href="#" data-id="${s.id}" class="${cls}">${s.label}` +
               `<small>${s.ready === false ? "not built yet" : s.paper}</small></a>`;
      }).join("");
      return head + items;
    }).join("");
    $("rail").querySelectorAll("a").forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        const s = SECTIONS.find((x) => x.id === a.dataset.id);
        if (!s || s.ready === false) return;
        /* Within a family this changes nothing else.  Across families it changes WHICH model is
         * shown -- never the contents of either. */
        state.section = s.id;
        render();
      };
    });
  }

  /* Is the model on screen still the untouched anchor? */
  function onAnchor(group = activeGroup()) {
    const A = DATASETS[group].anchor;
    if (!A || !A.bulk) return null;
    const sig = (bulk) => (bulk || []).filter((b) => b.multiplicity)
      .map((b) => `${b.rep}${b.parities.map((p) => (p > 0 ? "+" : "-")).join("")}*${b.multiplicity}`)
      .sort().join(";");
    return sig(model(group).bulk) === sig(A.bulk) ? A : null;
  }

  /* A SECTION THAT DOES NOT STAND ON THE SHELL'S MODEL SAYS WHAT IT DOES STAND ON.
   *
   * Every section so far answers a question about a content in a FIXED lattice, so the header --
   * the most visible element on the page -- can name that content and be right.  The general
   * SU(N) builder is not of that kind: its input is a boundary condition, the term table is a
   * FUNCTION of it, and the group itself is something the reader types.  Leaving the header
   * showing "SU(3) . S1/Z2 . 2xadjoint(+,+)" while the panel below builds an SU(6) model would be
   * a lie in the one place a reader trusts without looking.
   *
   * So a section may declare `holds(ctx)`, returning the one line that describes what IS on
   * screen.  When it does, the status tally goes too: those chips count the statuses of the
   * shell model's values, and none of them were computed for what the section is holding.  A
   * single chip says so instead.  DESIGN.md D6 said one model per group; this says what happens
   * when a section has no group. */
  function header(r) {
    const sec = active();
    const own = sec.holds ? sec.holds(ctx()) : null;
    if (own) {
      $("topModel").textContent = own;
      const cav = $("topCaveat");
      if (cav) { cav.innerHTML = ""; cav.style.display = "none"; }
      $("topChips").innerHTML = `<span class="chip live">this section holds its own model</span>`;
      return;
    }
    $("topModel").textContent = describe(r.model);
    /* A tool that opens on its best-agreeing case and does not say so is flattering itself.  The
     * SU(7) anchor IS that case -- 1.03x against theirs where the other four rows run to 2.08x --
     * so while the opening model is untouched the header says which row it is and why that
     * matters.  It disappears the moment you change anything, because then it is your model. */
    const A = onAnchor();
    const cav = $("topCaveat");
    if (cav) {
      cav.innerHTML = A && A.caveat
        ? `opening on ${A.label} — <b>${A.caveat}</b>`
        : "";
      cav.style.display = A && A.caveat ? "" : "none";
    }
    const t = tally([...r.values.values()]);
    const set = [["thm", "theorem", t.theorem], ["ver", "verified", t.verified],
                 ["mea", "measured", t.measured], ["bad", "unknown", t.unknown]];
    $("topChips").innerHTML =
      set.filter(([, , n]) => n).map(([c, n2, n]) => `<span class="chip ${c}">${n2} ${n}</span>`).join("") +
      `<span class="chip live">${modelId(r.model)}</span>`;
  }

  /* ---------------------------------------------------------------- exports */

  /* WHEN THE LaTeX EXPORT MEANS ANYTHING, AND WHEN IT DOES NOT.
   *
   * The shell's card is about the shell's model.  A section that declares `holds()` is showing a
   * DIFFERENT model -- its own -- so unless it also implements `texExport` to hand over that one,
   * pressing the button would produce a correct file about the wrong thing.  That is the same
   * defect `drive.mjs` caught in the SU(N) builder, and it is still latent in every other section
   * that holds its own model.  Rather than exporting something misleading, the button is not
   * shown: a control that cannot do the thing its label promises is worse than a missing one. */
  const texUsable = (sec) => !!sec && (typeof sec.holds !== "function" ||
                                       typeof sec.texExport === "function");


  function download(name, text, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  $("btnCard").onclick = () => {
    const r = run();
    const certs = SECTIONS.filter((s) => s.group === activeGroup())
      .reduce((acc, s) => Object.assign(acc, s.certificates || {}), {});
    const card = makeCard(r.model, r.values, { version: VERSION, build: BUILD, certificates: certs });
    download(`ghu-${modelId(r.model)}.json`, JSON.stringify(card, null, 1), "application/json");
    download(`ghu-${modelId(r.model)}.txt`, toText(card), "text/plain");
  };

  /* THE SAME CARD, IN THE FORM THAT GOES INTO A PAPER.
   *
   * Not a second computation and not a screenshot: `makeCard` is called exactly as the JSON export
   * calls it, and `toLatex` renders that object.  What the reader pastes into their draft is the
   * object the tool exported, or the status column is decoration.
   *
   * The bibliography goes with it.  A reader who takes a potential out of this page and into their
   * paper should not have to go and find the citation for the formula it came from -- the entry
   * travels in the file, keyed the way INSPIRE keys it so their .bib merges rather than duplicates.
   */
  $("btnTex").onclick = () => {
    /* hidden is not disabled: a stale keyboard focus or a script could still reach it */
    if (!texUsable(SECTIONS.find((x) => x.id === state.section))) return;
    const r = run();
    const g = activeGroup();
    const certs = SECTIONS.filter((s) => s.group === g)
      .reduce((acc, s) => Object.assign(acc, s.certificates || {}), {});
    const card = makeCard(r.model, r.values, { version: VERSION, build: BUILD, certificates: certs });
    /* a value that is a group or a formula is typeset as one; everything else is prose.  The list
     * is explicit because guessing which strings are maths is how a value ends up in the wrong
     * mode, silently. */
    const mathKeys = ["unbroken", "unbroken_group", "gauge_group", "residual"];
    /* A SECTION MAY HAVE MORE TO EXPORT THAN THE CARD HOLDS.  The card carries values; the SU(N)
     * builder also has the model's POTENTIAL, which is the thing a reader most wants typeset and
     * which is not a value.  A section that has one says so with `texExport`; a section that has
     * none exports the table and the bibliography, which is still the whole card. */
    const sec = SECTIONS.find((x) => x.id === state.section) || {};
    const { card: own, ...extra } = sec.texExport ? sec.texExport(ctx(), r) : {};
    /* A SECTION THAT HOLDS ITS OWN MODEL EXPORTS ITS OWN CARD.  Pairing this section's potential
     * with the shell's card would put two models in one file; `drive.mjs` asserts it does not. */
    const use = own || card;
    const tex = toLatex(use, Object.assign({
      group: g, mathKeys, date: new Date().toISOString().slice(0, 10),
      label: `tab:ghu-${use.provenance.model_id}`,
    }, extra));
    download(`ghu-${use.provenance.model_id}.tex`, tex, "text/x-tex");
    /* the .bib beside it, exactly as the card button writes .json and .txt */
    /* STAGGERED, because two downloads fired in the same tick look to a browser like a page
     * grabbing files: Chrome raises its "download multiple files?" prompt and may drop the
     * second.  Half a second costs nothing and the reader gets both. */
    const bib = toBibtex(g, { date: new Date().toISOString().slice(0, 10) });
    if (bib) setTimeout(() => download(`ghu-${use.provenance.model_id}.bib`, bib, "text/plain"), 500);
  };

  $("btnLink").onclick = () => {
    location.hash = encode();
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).catch(() => {});
    $("btnLink").textContent = "🔗 copied";
    setTimeout(() => ($("btnLink").textContent = "🔗 link"), 1400);
  };

  /* ---------------------------------------------------------------- the loop */

  let mounted = null;

  function ctx() {
    const g = activeGroup();
    return {
      DATA: DATASETS[g], SLOTS: SLOTS[g], group: g,
      get n() { return state.n[g]; },
      get eta() { return state.eta[g]; },
      get role() { return state.role[g]; },
      setN(i, d) { state.n[g][i] = Math.max(0, Math.min(30, state.n[g][i] + d)); render(); },
      /* A section may hold VIEW state -- a filter, a cached sweep -- and needs to repaint without
       * touching the model.  Without this a section reaches for setN(0, 0), which is a no-op only
       * as long as nothing else clamps. */
      refresh() { render(); },
      setEta(i, v) { state.eta[g][i] = v; render(); },
      setRole(i, v) { state.role[g][i] = v; render(); },
      get seed() { return state.seed[g]; },
      setSeed(v) {
        const Dg = DATASETS[g];
        if (!Dg.gauge_seeds || !Dg.gauge_seeds[v]) return;
        state.seed[g] = v; render();
      },
      get brane() { return state.brane[g]; },
      /* One choke point sanitises everything the escape section types -- a permalink and a text
       * field go through the same rules, so neither can smuggle in what the other rejects. */
      setBrane(patch) {
        state.brane[g] = cleanBrane({ ...state.brane[g], ...patch });
        render();
      },
      load(bulk) {
        state.n[g] = SLOTS[g].map((s) => {
          const b = (bulk || []).find((x) => x.rep === s.rep &&
            (x.parities[0] > 0 ? "+" : "-") === s.key[1] &&
            (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
          if (b) {
            state.eta[g][SLOTS[g].indexOf(s)] = b.eta === undefined ? 1 : b.eta;
            state.role[g][SLOTS[g].indexOf(s)] = b.role === undefined ? 1 : b.role;
          }
          return b ? b.multiplicity : 0;
        });
        render();
      },
      clear() {
        state.n[g] = SLOTS[g].map(() => 0);
        state.eta[g] = SLOTS[g].map(() => 1);
        state.role[g] = SLOTS[g].map(() => 1);
        state.seed[g] = "published";
        state.brane[g] = cleanBrane(null);
        render();
      },
      model: () => model(g), resolve: () => run(), MODS: mods(g),
    };
  }

  function render() {
    const r = run();
    rail();
    header(r);
    const sec = active();
    if (mounted !== sec.id) {
      $("section").innerHTML = sec.html;
      mounted = sec.id;
      if (sec.init) sec.init(ctx());
    }
    sec.render(ctx(), r);
    /* the button follows the section, not the page */
    $("btnTex").hidden = !texUsable(sec);
    history.replaceState(null, "", encode());
  }

  window.addEventListener("hashchange", () => { if (decode()) { mounted = null; render(); } });
  window.addEventListener("resize", () => render());
  $("footBuild").textContent =
    `ghu-lab ${VERSION} · built ${BUILD} · ` +
    `${SECTIONS.filter((s) => s.ready !== false).length} of ${SECTIONS.length} sections built · ` +
    `${FAMILIES.length} model${FAMILIES.length > 1 ? "s" : ""}, one per group · ` +
    `computed in your browser, nothing precomputed and nothing fetched`;

  /* The seeding happens once, above, for EVERY group.  What stood here loaded rows[1] into
   * whichever group was active and left the other one empty -- which is how three of the five
   * sections came to open on a blank model.
   *
   * And this read `if (!decode()) render();` -- so a page opened WITH a permalink decoded it and
   * then rendered nothing at all: an empty rail, no section, a blank instrument.  Every deep link
   * this tool ever handed out was dead on arrival, and no harness opened one until the seed
   * toggle needed a permalink to be photographed.  Decode, then render, unconditionally. */
  decode();
  render();
})();

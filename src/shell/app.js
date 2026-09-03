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
  /* THE ANCHOR'S OWN eta AND role, AS A FUNCTION, because `decode` needs the same thing.
   *
   * A link carries only what differs from the default -- the rule the seed and the brane already
   * follow -- so "no marker on this slot" has to mean the same thing on both sides of the trip.
   * The default is not +1: the anchor content of a group may itself carry eta = -1 or role =
   * gauge on a slot, and it does.  Resetting to +1 before reading a link would therefore lose the
   * anchor's own values on an untouched model, which is the audited bug in its subtler form.
   * Reset to THIS, and omission means "as the anchor has it" on both sides. */
  function anchorEtaRole(group) {
    const eta = SLOTS[group].map(() => 1), role = SLOTS[group].map(() => 1);
    const bulk = anchorOf(group);
    if (bulk) SLOTS[group].forEach((s, i) => {
      const b = bulk.find((x) => x.rep === s.rep &&
        (x.parities[0] > 0 ? "+" : "-") === s.key[1] &&
        (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
      if (!b) return;
      eta[i] = b.eta === undefined ? 1 : b.eta;
      role[i] = b.role === undefined ? 1 : b.role;
    });
    return { eta, role };
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
    });
    const a = anchorEtaRole(f.group);
    state.eta[f.group] = a.eta;
    state.role[f.group] = a.role;
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

  /* THE RESOLVER RUNS ONCE PER MODEL, not once per render.
   *
   * `render()` is called on every section switch, every resize and every control, and each call was
   * re-running the whole module chain on an identical model.  That is where most of a second went
   * in five sections: the SU(7) pair re-minimised the potential numerically over 2001 alphas to
   * check the closed form against it, and the SU(4) trio re-ran `minimise` over a 61x61 grid.  Both
   * are worth doing.  Neither is worth doing twice for the same content.
   *
   * The key is the module set plus the ENTIRE model, serialised -- not a hash of the fields I think
   * matter, because the next field somebody adds would not be in it and the cache would then serve
   * an answer to a question nobody asked.  It is sound only because a module is a pure function of
   * the model: no DOM, no clock, no randomness in src/modules or src/kernel. */
  const memo = new Map();
  /* Enough for three families, a reader going back and forth, and the handful of published rows a
   * section resolves alongside the live model.  Bounded because every content a reader builds is a
   * new key and what is held is a module chain's whole value map, not a number. */
  const MEMO_MAX = 32;
  function resolved(ms, m) {
    const key = ms.map((x) => x.id).join(",") + "\u0000" + JSON.stringify(m);
    const hit = memo.get(key);
    if (hit) return hit;
    const { values, skipped } = resolve(ms, m);
    const out = { model: m, values, skipped };
    memo.set(key, out);
    while (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value);   /* Map: insertion order */
    return out;
  }
  function run() { return resolved(mods(), model()); }

  /* ---------------------------------------------------------------- permalink */

  /* THE PERMALINK CARRIES THE WHOLE MODEL, WHICH FOR TWO YEARS MEANT "the multiplicities".
   *
   * η and the matter/gauge role are toggles in the calculator — `ctx.setEta`, `ctx.setRole` — and
   * they go into `model()` beside the multiplicity, so they change every number on the page.  They
   * were not in this string.  A link therefore reproduced a DIFFERENT model from the one whose
   * results were on screen when it was copied, silently, and the button that makes it says "the
   * whole state, in the address bar".  Found by an outside audit of the deployed source,
   * 2026-09-03.
   *
   * A default is omitted, as everywhere else here: only what differs from η = +1, matter travels.
   * Old links carry no suffix and still parse — and `decode` now RESETS η and the role before
   * reading, so a link is a complete description of the model rather than a patch applied to
   * whatever the tab was already holding.  That is the property the round trip in `_test_app.mjs`
   * asserts: model → encode → fresh state → decode → the same model, field for field. */
  const encGroup = (g) => {
    const a = anchorEtaRole(g);
    return state.n[g].map((v, i) => {
      if (!v) return null;
      /* `.e` and `.r` name the VALUE, not a flip, so a token reads the same on its own as it does
       * after any other token: `.em` is eta = -1, `.ep` is eta = +1.  Only a slot that differs
       * from the anchor writes one.
       *
       * `m` and `p` rather than `-` and `+` because `encodeURIComponent` turns a plus into `%2B`:
       * the link still worked, and the address bar showed `.r%2B` in the middle of a model — which
       * is the kind of thing a reader pastes into a letter and a mail client mauls.  This is the
       * same lesson as the pipe that became a comma in the BLKT permalink. */
      const mark = (cur, def, k) => (cur === def ? "" : `.${k}${cur < 0 ? "m" : "p"}`);
      return `${SLOTS[g][i].rep}${SLOTS[g][i].key}*${v}`
             + mark(state.eta[g][i], a.eta[i], "e") + mark(state.role[g][i], a.role[i], "r");
    }).filter(Boolean).join(";");
  };

  function encode() {
    const parts = [`s=${state.section}`];
    for (const f of FAMILIES) {
      /* AN EMPTY MODEL IS A MODEL, and writing nothing for it was a bug with a very clean shape:
       * every family starts on its published anchor, so `clear` is the one thing a reader can do
       * that makes `encGroup` return "" — and an omitted parameter is indistinguishable, at the
       * far end, from a link written before the family existed.  Opening your own link brought the
       * ANCHOR back, silently, while the button's tooltip promised the whole state.  So a cleared
       * family writes its key with an empty value, `su7_km25=`, and the decoder keys on the
       * PRESENCE of the key rather than on its truthiness.  Reported by an outside reader,
       * 2026-09-03; the round trip is now in `_test_app.mjs` and driven in `drive.mjs`. */
      const c = encGroup(f.group);
      parts.push(c ? `${f.group}=${encodeURIComponent(c)}` : `${f.group}=`);
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

  /* NO STRING A READER CAN PUT IN THE ADDRESS BAR MAY STOP THE INSTRUMENT FROM APPEARING.
   * `decodeURIComponent` throws URIError on a lone "%" or a truncated escape, and this ran at
   * startup with `decode(); render();` — so `#x=%` threw before anything was mounted and left a
   * blank page, which is the same symptom as the dead-permalink bug of 2026-08-26 arriving by a
   * different door.  A parameter that cannot be decoded is DROPPED, and the rest of the link still
   * works; a link is data from outside and is treated as such. */
  const unesc = (s) => { try { return decodeURIComponent(s); } catch { return null; } };

  function decode() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return false;
    const q = Object.fromEntries(h.split("&").map((kv) => {
      const i = kv.indexOf("=");
      return i < 0 ? [kv, ""] : [kv.slice(0, i), unesc(kv.slice(i + 1))];
    }).filter(([, v]) => v !== null));
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
      /* PRESENT-BUT-EMPTY IS NOT ABSENT.  `if (!q[f.group])` treated a cleared family exactly like
       * a family the link never mentioned, so the anchor loaded at startup was left standing and
       * the reader got back a model they had emptied.  A link written before this family existed
       * still omits the key entirely, and still means "leave it alone" — which is why the test is
       * on the key and not on its value. */
      if (!Object.prototype.hasOwnProperty.call(q, f.group)) continue;
      /* η and the role go back to the ANCHOR's values before the link is read, so what comes back
       * is the model the link describes rather than that model laid over whatever this tab was
       * holding — and an omitted marker means the anchor's value on both sides of the trip */
      state.n[f.group] = SLOTS[f.group].map(() => 0);
      const anc = anchorEtaRole(f.group);
      state.eta[f.group] = anc.eta.slice();
      state.role[f.group] = anc.role.slice();
      if (!q[f.group]) continue;                       /* an empty model, and it stays empty */
      for (const tok of q[f.group].split(";")) {
        /* the trailing group is optional, so every link written before η travelled still parses */
        const mm = tok.match(/^(.+?)(\(.,.\))\*(\d+)((?:\.[er][mp])*)$/);
        if (!mm) continue;
        const i = SLOTS[f.group].findIndex((s) => s.rep === mm[1] && s.key === mm[2]);
        if (i < 0) continue;
        state.n[f.group][i] = Math.min(30, +mm[3]);
        const mk = (k) => (mm[4].includes(`.${k}m`) ? -1 : mm[4].includes(`.${k}p`) ? 1 : null);
        const e = mk("e"), r = mk("r");
        if (e !== null) state.eta[f.group][i] = e;
        if (r !== null) state.role[f.group][i] = r;
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

  /* Is the model on screen still the untouched anchor?
   *
   * AND "UNTOUCHED" HAS TO MEAN EVERY DIAL, which it did not.  This signature compared the
   * representation, the parities and the multiplicity — and nothing else — while the interface
   * lets a reader move η, the role, the gauge seed and the brane, all of which are part of the
   * model and all of which change the numbers.  So flipping η on the anchor content left the
   * header still saying this is the published model, with the published model's caveat attached
   * to numbers that were no longer its.  In an instrument whose whole claim is that every output
   * carries what is known about it, a provenance label that is wrong is worse than none.
   * Reported by an outside reader, 2026-09-03; `_test_app.mjs` now moves each dial in turn and
   * requires the label to go.
   *
   * The comparison is over what a READER can move, not over the whole record: a normalised model
   * carries a schema version and an orbifold name that no anchor file repeats. */
  function onAnchor(group = activeGroup()) {
    const A = DATASETS[group].anchor;
    if (!A || !A.bulk) return null;
    const sg = (v) => (v === undefined ? 1 : v) > 0 ? "+" : "-";
    const sig = (bulk) => (bulk || []).filter((b) => b.multiplicity)
      .map((b) => `${b.rep}${b.parities.map((p) => (p > 0 ? "+" : "-")).join("")}*${b.multiplicity}`
                + `e${sg(b.eta)}r${sg(b.role)}`)
      .sort().join(";");
    if (sig(model(group).bulk) !== sig(A.bulk)) return null;
    /* the two halves of the model that are not in `bulk` at all.  An anchor file carries neither,
     * so the anchor IS "the published seed and nothing on the brane" — which is what the published
     * rows are, and what `braneList` returns until the reader types something. */
    if (DATASETS[group].gauge_seeds && state.seed[group] !== "published") return null;
    if (JSON.stringify(braneList(group)) !== JSON.stringify(A.brane || [])) return null;
    return A;
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
  /* THE MODEL LINE IS DELIBERATELY ONE LINE, and on a narrow window it ends in an ellipsis — which
   * is a design and not a defect, EXCEPT that until 2026-09-03 there was no way to read the rest.
   * The full line goes into `title` at the same moment it goes into the element, so hovering gives
   * back exactly what was truncated. `build/layout.mjs` distinguishes the two cases and requires
   * a truncated element to carry its own text: a box that hides content and cannot give it back
   * is a clipped box wearing an ellipsis. */
  function setModelLine(text) {
    const el = $("topModel");
    el.textContent = text;
    el.title = text;
  }

  function header(r) {
    const sec = active();
    const own = sec.holds ? sec.holds(ctx()) : null;
    if (own) {
      setModelLine(own);
      const cav = $("topCaveat");
      if (cav) { cav.innerHTML = ""; cav.style.display = "none"; }
      $("topChips").innerHTML = `<span class="chip live">this section holds its own model</span>`;
      return;
    }
    setModelLine(describe(r.model));
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
    /* THE SAME 500 ms THE .bib GETS, AND FOR THE SAME REASON.  Two downloads in one tick make
     * Chrome raise its multiple-download prompt and, if it is declined or auto-blocked, drop the
     * second file — so the reader gets the JSON, no .txt, and no error.  The LaTeX button below
     * had already been fixed for exactly this and this one had been left on the old pattern; an
     * outside audit read the two of them side by side on 2026-09-03 and said so. */
    setTimeout(() => download(`ghu-${modelId(r.model)}.txt`, toText(card), "text/plain"), 500);
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
    /* THE .bib FOLLOWS THE .tex, NOT THE GROUP.  A section that declared its own sources above
     * must get them here too, or the document cites five papers its bibliography does not carry
     * -- which is how the BLKT export came to omit the one paper every number in it came from. */
    const bib = toBibtex(g, { date: new Date().toISOString().slice(0, 10),
                              sources: extra.sources || null });
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
      /* A section that resolves a model of its OWN -- a published row, a probe -- goes through the
       * same memo as the shell.  Calling `resolve` directly is what made two sections re-run the
       * whole chain per row on every render. */
      resolveModel: (m) => resolved(mods(g), m),
    };
  }

  function render() {
    const r = run();
    rail();
    header(r);
    const sec = active();
    if (mounted !== sec.id) {
      /* THE HOW-TO IS MOUNTED BY THE SHELL, not written into each section: twenty-five sections
       * would be twenty-five chances to forget one, and a section that forgot would look like a
       * section with nothing to explain.  `_test_howto.py` fails if a built section has no entry. */
      $("section").innerHTML = howToBlock(sec.id) + sec.html;
      /* the demo button lives in the how-to's summary, which the shell wrote, so the shell wires
       * it — and a section change stops a running demo rather than leaving it driving a panel
       * that is no longer on screen */
      if (DEMO_S.id && DEMO_S.id !== sec.id) demoStop(null);
      const dbtn = document.getElementById("demoRun");
      if (dbtn) dbtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); demoStart(sec.id, ctx()); };
      mounted = sec.id;
      if (sec.init) sec.init(ctx());
    }
    sec.render(ctx(), r);
    /* the button follows the section, not the page */
    $("btnTex").hidden = !texUsable(sec);
    history.replaceState(null, "", encode());
  }

  window.addEventListener("hashchange", () => {
    let ok = false;
    try { ok = decode(); } catch (e) { console.warn("permalink ignored:", e && e.message); }
    if (ok) { mounted = null; render(); }
  });
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
   * toggle needed a permalink to be photographed.  Decode, then render, unconditionally.
   *
   * And `render` is now unconditional in the stronger sense too: the belt inside `decode` drops a
   * parameter it cannot read, and this brace catches anything else a hand-typed hash can do, so
   * the instrument appears on its defaults rather than not at all.  A link is input from outside
   * the program and there is no string it may refuse to survive. */
  try { decode(); } catch (e) { console.warn("permalink ignored:", e && e.message); }
  render();
})();

/* The inline help: one delegated listener for every mark in every section, wired before the first
 * render so a mark works the moment it is drawn. */
mountHelp();

/* THE RAIL DRAWER, below 960px only.  Wired once at load; above the breakpoint the button is
 * display:none and this never runs.  Picking a section closes it, because a drawer that stays open
 * over the thing you just chose is worse than no drawer. */
(function () {
  const btn = document.getElementById("railBtn");
  const wrap = document.getElementById("wrapTop");
  const rail = document.getElementById("rail");
  if (!btn || !wrap || !rail) return;
  btn.onclick = () => wrap.classList.toggle("railopen");
  rail.addEventListener("click", (e) => {
    if (e.target.closest("a")) wrap.classList.remove("railopen");
  });
})();

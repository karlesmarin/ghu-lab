/* dossier.mjs — one boundary condition, every verdict the instrument has, and which of them are
 * about the THEORY rather than about where you are standing.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS IS ONE TOOL AND NOT FIVE PANELS SIDE BY SIDE.  Five sections already answer about a 5D
 * SU(N) model on S¹/Z₂: the builder gives the Wilson-line potential and its vacuum, the spectrum
 * panel the massless content, the anomaly panel the bill, Boundary conditions the equivalence
 * class and the class energy, and Part VII's kernel the closed form when there is a single phase.
 * Reading them one after another gives twelve numbers about one model — and EIGHT OF THE TWELVE
 * ARE NOT PROPERTIES OF THE MODEL.  They change when you replace the boundary condition by a
 * gauge-equivalent one, which is the same theory.  A page that prints all twelve as answers
 * manufactures eight false claims per model, and no single panel can see it, because seeing it
 * needs the class from one section and the verdicts from the others at the same time.
 *
 * SO THE TAG IS MEASURED, NOT DECLARED.  Every line below is computed for EVERY member of the
 * boundary condition's equivalence class, and the line is tagged by what came back:
 *
 *     invariant   the same on every member — a property of the theory
 *     gauge       different on two members that are the same theory — a property of the frame
 *
 * That is a computation, so it cannot go stale when a module changes, and it cannot flatter a
 * line by assertion.  A third tag needs more than one class and is therefore a separate, more
 * expensive question — `dossierSeparation` — because a line that is the same for EVERY class at
 * this N separates nothing and is not a verdict either, however invariant it is.
 *
 * WHAT IT FOUND, ON ITS FIRST RUN, AND THIS IS THE ARGUMENT FOR THE TOOL.  "Is this model
 * anomaly-free?" came back YES for one member of a class and NO for another — the same theory,
 * two answers — on 4 of the 16 multi-member classes of SU(5) and 5 of the 25 of SU(6).  The cause
 * was an empty sum: the member with n₊₊ = 0 has no massless fermion for a bulk fundamental to
 * leave, so every anomaly channel is zero and the flag read "clean".  `anomaly5d.mjs` now carries
 * a `verdict` with three states instead.  The arithmetic had always been right.
 *
 * THE CLASS ENERGY IS THE GAUGE SECTOR ONLY, AND THAT IS NOT A SHORTCUT.  HHK eq. (3.25) labels
 * bulk matter by the PARITY PAIR — its N_Δ and N_v read S["++"] − S["--"] and S["+-"] − S["-+"] —
 * while the builder's content carries only the product ηη′, because for the spectrum that is all
 * that is physical (their (3.4)–(3.5)).  The finer label cannot be recovered from the coarser one,
 * so handing the builder's bulk to `bcEnergy` would mean inventing a split.  The energy lines are
 * therefore computed with no matter and say so; the dial that does carry the pair lives in
 * Boundary conditions, where it belongs.
 */
import { sun5dBlocks, sun5dUnbroken, sun5dTerms, sun5dMinimum, sun5dMinimumRestarts,
         sun5dTermTable } from "./sun5d.mjs";
import { sp5ZeroModes } from "./spectrum5d.mjs";
import { an5Ledger } from "./anomaly5d.mjs";
import { bcClasses, bcEnergy, bcPreferred, bcShow } from "./bcclass.mjs";
import { vac5At, vac5Ladder, vac5Confront } from "./vacuum5d.mjs";
import { moments, alphaMin, coordinates, stabilityW } from "../kernel/potential.mjs";

/* ------------------------------------------------------------------ the shared computation */

export const dossierSpec = ([p, q, r, s]) => ({ nPP: p, nPM: q, nMP: r, nMM: s });

/* Everything the lines read, computed once per boundary condition.  A stage that refuses records
 * WHY rather than throwing: a dossier with one missing line is the honest object, and a dossier
 * that cannot exist because the closed form declined is not. */
export function dossierContext(bc, content, { grid = 400, windings = 300, restarts = 32 } = {}) {
  const b = sun5dBlocks(dossierSpec(bc));
  const terms = sun5dTerms(b, content);
  const ctx = { bc, b, content, terms, refused: {} };
  ctx.min = sun5dMinimum(terms, b.phases, { grid, windings });
  /* THREE PHASES AND MORE: restarts, labelled.  The grid declines there and is right to; the
   * descent from every corner and a batch of reproducible random starts is what stands above
   * it, and every line that reads it says "restarts" so the reader knows it is not a grid. */
  if (!ctx.min && b.phases > 2)
    ctx.min = sun5dMinimumRestarts(terms, b.phases, { restarts, windings });
  ctx.zero = sp5ZeroModes(b, content);
  ctx.anom = an5Ledger(b, content);
  ctx.energy = bcEnergy(bc, {});
  try {
    const tt = sun5dTermTable(terms, { phases: b.phases });
    ctx.bridge = { tt, W: stabilityW(tt), coords: coordinates(tt), alpha: alphaMin(moments(tt)) };
  } catch (e) { ctx.bridge = null; ctx.refused.bridge = e.message; }
  if (!ctx.min)
    ctx.refused.min = "there is no Wilson-line phase, so there is no potential to minimise";
  else if (ctx.min.method === "restarts")
    ctx.notes = { min: `${b.phases} phases: the minimum is the deepest of ${ctx.min.starts} descents ` +
                      `(${ctx.min.hits} reached it, ${ctx.min.distinct} distinct minima seen), not a grid` };
  /* AND THE SAME QUESTIONS AT THE MINIMUM, which is where the theory sits.  With no phase the
   * symmetric point IS the vacuum; with one or two the minimiser's θ is handed to `vacuum5d.mjs`,
   * which builds P₁′ = W⁻¹P₁ there and reads the group, the massless content and the ledger off
   * the joint invariants.  Past two phases there is no located vacuum and the lines decline with
   * the minimiser's own reason. */
  ctx.vac = ctx.min ? vac5At(b, content, ctx.min.theta)
          : b.phases === 0 ? vac5At(b, content, []) : null;
  if (ctx.vac) {
    ctx.vac.ladder = vac5Ladder(ctx.vac.frame, content);
    ctx.vac.confront = vac5Confront(ctx.vac.ladder);
  }
  return ctx;
}

/* ------------------------------------------------------------------ the lines
 *
 * ONE DECLARED LIST, read by the page, by the tagger and by the harness, so that a line cannot be
 * shown with one definition and tested with another.  `get` returns a string on purpose: the tag
 * is an equality test across members, and comparing formatted values is what keeps a difference of
 * 1e-16 in a grid minimum from being reported as two different theories.
 *
 * `cite` is where the quantity comes from.  It is on the row rather than in a paragraph because
 * the row is what gets read.  */
const n6 = (x) => (Math.abs(x) < 5e-7 ? "0" : x.toFixed(6));
/* a value found by restarts carries the word, so a reader never mistakes it for a grid's */
const restartsMark = (c) => (c.min && c.min.method === "restarts" ? " (restarts, not certified)" : "");

export const DOSSIER_LINES = [
  { key: "unbroken", group: "The gauge symmetry", label: "Apparent unbroken group",
    cite: "Haba–Yamashita eq. (5.2)",
    get: (c) => sun5dUnbroken(c.b) },

  { key: "phases", group: "The Wilson line", label: "Wilson-line phases",
    cite: "Haba–Yamashita eq. (5.4) — min(n₊₊,n₋₋) + min(n₊₋,n₋₊)",
    get: (c) => String(c.b.phases) },
  { key: "nterms", group: "The Wilson line", label: "Terms in V",
    cite: "Haba–Yamashita §5, assembled here",
    get: (c) => String(c.terms.length) },
  { key: "vmin", group: "The Wilson line", label: "Depth of the vacuum, V/C",
    cite: "minimised here, on the torus of phases — a grid for one or two, restarts above",
    get: (c) => (c.min ? n6(c.min.V) + restartsMark(c) : null) },
  { key: "theta", group: "The Wilson line", label: "Where the vacuum sits, θ",
    cite: "the same minimisation",
    get: (c) => (c.min ? c.min.theta.map((x) => x.toFixed(4)).join(", ") + restartsMark(c) : null) },
  { key: "edge", group: "The Wilson line", label: "At a symmetric point?",
    cite: "V has period 2 and is even, so [0,1]'s ends are the two symmetric points",
    get: (c) => (c.min ? (c.min.atEdge ? "yes — no Hosotani breaking" : "no — broken vacuum")
                         + restartsMark(c) : null) },

  { key: "vectors", group: "The massless content", label: "Massless vectors",
    cite: "Haba–Hosotani–Kawamura §3 — the (+,+) states of A_μ",
    get: (c) => String(c.zero.vectors) },
  { key: "scalars", group: "The massless content", label: "Massless scalars",
    cite: "the same, on A_y, whose parities are flipped",
    get: (c) => String(c.zero.scalars) },
  { key: "fermions", group: "The massless content", label: "Massless Weyl fermions",
    cite: "one chirality of each bulk Dirac fermion",
    get: (c) => String(c.zero.fermions) },

  { key: "anomaly", group: "Anomalies", label: "Anomaly verdict",
    cite: "Arkani-Hamed–Cohen–Georgi 2001 · Part VI",
    get: (c) => c.anom.verdict },
  { key: "anomChannels", group: "Anomalies", label: "Channels the group has",
    cite: "one per cubic, mixed, abelian and gravitational channel of the unbroken group",
    get: (c) => String(c.anom.rows.length) },
  { key: "anomOwing", group: "Anomalies", label: "Channels left owing",
    cite: "the same ledger",
    get: (c) => String(c.anom.offending.length) },

  { key: "W", group: "Part VII", label: "W = Σ_{c odd} m(−s)",
    cite: "Part VII eq. (34) — which symmetric point is deeper",
    get: (c) => (c.bridge ? n6(c.bridge.W) : null) },
  { key: "alpha", group: "Part VII", label: "α at the minimum, closed form",
    cite: "Part VII's closed form, on the term table this boundary condition produces",
    get: (c) => (c.bridge ? (c.bridge.alpha === null ? "no minimum (D ≤ 0)"
                                                     : c.bridge.alpha.toFixed(8)) : null) },
  { key: "coords", group: "Part VII", label: "The five coordinates (A₄, 8D, 2U, V, 2W)",
    cite: "Part VII Theorem 3 — complete invariants of the potential",
    get: (c) => (c.bridge ? [c.bridge.coords.A4, c.bridge.coords.D8, c.bridge.coords.U2,
                             c.bridge.coords.V, c.bridge.coords.W2].map(n6).join(", ") : null) },

  /* THE LINES THAT SHOULD BE THE THEORY'S, and the tagger is still not told so: they are computed
   * on every member like the rest, and if a class disagreed on one of them the page would say so.
   * `_test_dossier.mjs` requires them invariant on every class at N = 4…7, which is the claim of
   * `vacuum5d.mjs` measured rather than asserted. */
  { key: "vacWhere", group: "At the minimum", label: "Where the vacuum stands",
    cite: "Hosotani; HHK §2 — P₁ → W⁻¹P₁ at the minimum: a class-mate, or a broken vacuum",
    get: (c) => (c.vac ? c.vac.where : null) },
  { key: "vacUnbroken", group: "At the minimum", label: "Unbroken group at the minimum",
    cite: "the commutant of P₀ and W⁻¹P₁, named from its irreducibles",
    get: (c) => (c.vac ? c.vac.unbroken : null) },
  { key: "vacVectors", group: "At the minimum", label: "Massless vectors at the minimum",
    cite: "joint (+,+) invariants of the adjoint under P₀ and W⁻¹P₁",
    get: (c) => (c.vac ? String(c.vac.zero.vectors) : null) },
  { key: "vacScalars", group: "At the minimum", label: "Massless scalars at the minimum (tree level)",
    cite: "the (−,−) invariants — A_y's flat directions before the one-loop curvature",
    get: (c) => (c.vac ? String(c.vac.zero.scalars) : null) },
  { key: "vacFermions", group: "At the minimum", label: "Massless Weyl fermions at the minimum",
    cite: "one chirality of each bulk Dirac fermion, read at the minimum",
    get: (c) => (c.vac ? String(c.vac.zero.fermions) : null) },
  { key: "vacAnomaly", group: "At the minimum", label: "Anomaly verdict at the minimum",
    cite: "the same ledger, over the blocks the minimum leaves",
    get: (c) => (c.vac ? c.vac.anom.verdict : null) },
  { key: "vacOwing", group: "At the minimum", label: "Channels left owing at the minimum",
    cite: "the same ledger",
    get: (c) => (c.vac ? String(c.vac.anom.offending.length) : null) },
  { key: "vacMW", group: "At the minimum", label: "Lightest massive vector, m·R — the W",
    cite: "the eigenvalues of P₁′P₀ on the adjoint: t/2 for a letter⊗pair vector, t for pair⊗pair",
    get: (c) => (c.vac ? (c.vac.ladder.mWR === null ? "none — no vector is massive by the Wilson line"
                                                    : n6(c.vac.ladder.mWR)) : null) },
  { key: "vacLadder", group: "At the minimum", label: "Lightest state of each bulk field, in units of m_W",
    cite: "the same eigenvalue list on the bulk representations; 0 marks a massless state",
    get: (c) => {
      if (!c.vac) return null;
      const rows = c.vac.ladder.rows.filter((r) => !/^A_/.test(r.field));
      if (!rows.length) return "no bulk field";
      if (c.vac.ladder.mWR === null) return "no W to measure against";
      return rows.map((r) => `${r.field.replace(/^(\d+)× /, "$1×")}: ` +
        `${r.massless ? `${r.massless} massless` : ""}${r.massless && r.overW !== null ? ", " : ""}` +
        `${r.overW !== null ? `first massive at ${n6(r.overW)} m_W` : ""}`).join(" · ");
    } },

  /* AND THEN THE DATA.  One measured mass makes the ladder dimensionful; the verdict names the
   * hypothesis it rests on, because a dijet bound on a colour-octet vector says nothing about a
   * model whose colour is not in the bulk. */
  { key: "expInvR", group: "Against the data", label: "Compactification scale 1/R from m_W",
    cite: "m_W = 80.3692 ± 0.0133 GeV (PDG 2025); 1/R = m_W / (m_W·R)",
    get: (c) => (!c.vac ? null : c.vac.confront.located
                   ? `${(c.vac.confront.invRGeV / 1000).toFixed(3)} TeV`
                   : "not set — no vector is massive by the Wilson line at this vacuum") },
  { key: "expKK", group: "Against the data", label: "First KK level of the unbroken vectors vs CMS dijet",
    cite: "CMS JHEP 05 (2020) 033, 137 fb⁻¹: axigluons/colorons > 6.6 TeV — applies if colour is in the bulk",
    get: (c) => (!c.vac ? null : c.vac.confront.located ? c.vac.confront.kk.verdict
                   : "not set — the scale is not fixed") },

  { key: "N0", group: "The class energy", label: "N₀ — the constant piece",
    cite: "Haba–Hosotani–Kawamura eq. (3.25), gauge sector only",
    get: (c) => String(c.energy.N0) },
  { key: "Nd", group: "The class energy", label: "N_Δ — the divergent piece",
    cite: "the same equation",
    get: (c) => String(c.energy.Nd) },
  { key: "Nv", group: "The class energy", label: "N_v — the finite piece, which the class minimises",
    cite: "the same equation; the class's preferred member is the smallest",
    get: (c) => String(c.energy.Nv) },
];

/* ------------------------------------------------------------------ the tag */

/* THE WHOLE POINT, AND IT IS FOUR LINES.  Compute every line on every member of the class; a line
 * that comes back the same on all of them is a property of the theory, and a line that does not is
 * a property of the representative.  Nothing is assumed about which is which. */
export function dossierForClass(bc, content, opts = {}) {
  const N = bc.reduce((a, x) => a + x, 0);
  const C = bcClasses(N, "S1/Z2");
  const cl = C.classes[C.of(bc)];
  const ctxs = cl.members.map((m) => dossierContext(m, content, opts));
  const here = cl.members.findIndex((m) => m.join() === bc.join());
  if (here < 0) throw new Error(`[${bc}] is not in the class the walk put it in`);
  const mine = ctxs[here];

  const lines = DOSSIER_LINES.map((L) => {
    const across = ctxs.map((c) => L.get(c));
    const shown = across.filter((v) => v !== null);
    const distinct = [...new Set(shown)];
    return {
      ...L,
      value: L.get(mine),
      /* a line the whole class declines is neither invariant nor gauge: it is not there */
      tag: shown.length === 0 ? "declined" : distinct.length === 1 ? "invariant" : "gauge",
      across: cl.members.map((m, i) => ({ bc: m, value: across[i] })),
      distinct,
    };
  });

  return {
    bc, N, classId: C.of(bc), members: cl.members, size: cl.size, ctx: mine, lines,
    refused: mine.refused,
    preferred: bcPreferred(cl.members, {}),
    counts: {
      invariant: lines.filter((l) => l.tag === "invariant").length,
      gauge: lines.filter((l) => l.tag === "gauge").length,
      declined: lines.filter((l) => l.tag === "declined").length,
    },
  };
}

/* ------------------------------------------------------------------ and the third tag
 *
 * A line can be the same on every member of every class — N itself is, and so is N₀ — and then it
 * separates no theory from any other and is not a verdict however invariant it looks.  Deciding
 * that needs the WHOLE lattice at this N, which is 286 boundary conditions at N = 10 and seconds
 * rather than milliseconds, so it is its own call and the page asks before it runs.
 *
 * `distinctBetween` counts the answers the CLASSES give, taking a split line's answer to be the
 * sorted set of its members' — so a gauge line still has a well-defined answer per class and the
 * two axes stay independent. */
export function dossierSeparation(N, content, { grid = 120, windings = 120 } = {}) {
  const C = bcClasses(N, "S1/Z2");
  const per = C.classes.map((cl) => cl.members.map((m) => dossierContext(m, content,
                                                                        { grid, windings })));
  return {
    N, nBC: C.nBC, nClasses: C.nClasses,
    multi: C.classes.filter((cl) => cl.size > 1).length,
    lines: DOSSIER_LINES.map((L) => {
      const answer = (ctxs) => [...new Set(ctxs.map((c) => L.get(c)).filter((v) => v !== null))]
                                 .sort().join(" / ");
      const splits = per.filter((ctxs) => new Set(ctxs.map((c) => L.get(c))).size > 1).length;
      const between = new Set(per.map(answer));
      between.delete("");
      return {
        key: L.key, label: L.label, group: L.group,
        splitsWithin: splits, distinctBetween: between.size,
        tag: splits > 0 ? "gauge" : between.size > 1 ? "invariant" : "separates nothing",
      };
    }),
  };
}

export const dossierShow = bcShow;

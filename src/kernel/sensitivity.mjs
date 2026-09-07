/* sensitivity.mjs — what a number does when you move what it stands on, and what that is allowed
 * to be called.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE MISTAKE THIS FILE EXISTS TO REFUSE.  Writing m = 1.94 +0.12 -0.08 TeV invites the reader to
 * take the interval as an uncertainty of measurement.  Most of what moves a number in this
 * instrument is not that.  Three different things get varied and they must never be added:
 *
 *   CONVERGENCE   winding count, KK truncation, grid density, integration cutoff.  These are not
 *                 parameters of anything: they are how far the arithmetic was carried.  A number
 *                 that moves when they move HAS NOT CONVERGED, and the honest verdict is a defect
 *                 to fix, not an interval to publish.  Carles's own case is exactly this: an
 *                 approximation of the potential puts the Higgs at 125.85 GeV where the full
 *                 numerical sum gives about 127.85, and two GeV on a 125 GeV Higgs is the
 *                 difference between inside and outside — one of the two is wrong, or the sum has
 *                 not converged.  Calling it +-2 would bury the question.
 *
 *   MODEL         compactification radii, couplings, brane-localized terms, the seed of the gauge
 *                 background.  Moving these asks a DIFFERENT MODEL, so the spread is a range of
 *                 predictions across a family, not an error on one of them.  It is reported as a
 *                 range and named as one.
 *
 *   MEASURED      inputs with a published error, which `experiment.mjs` already carries with its
 *                 source and date.  Only this one propagates into anything a physicist would call
 *                 an uncertainty.
 *
 * So a result carries THREE numbers and never one, and the label says which of the three dominates.
 * That is the whole design; everything below is bookkeeping for it.
 *
 * D3: no gauge group is named here.  A function and a set of knobs go in.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

export const KNOB_KINDS = ["convergence", "model", "measured"];

/* A knob declares what it is before it declares what it does.  `kind` is the whole point: it is
 * what stops a truncation drift from being added to a measurement error. */
export function knobFaults(k) {
  const f = [];
  if (!k.name) f.push("a knob with no name");
  if (!KNOB_KINDS.includes(k.kind)) f.push((k.name || "?") + ": kind must be one of " + KNOB_KINDS.join(", "));
  if (!k.what) f.push((k.name || "?") + ": no `what` saying what moving it means");
  if (!Array.isArray(k.values) || k.values.length < 2) {
    f.push((k.name || "?") + ": needs at least two values to vary between");
  }
  if (k.kind === "measured" && !k.source) {
    f.push(k.name + ": a measured knob must name its source — the error is somebody's published"
      + " number, not ours");
  }
  if (k.kind === "convergence" && !(k.target > 0)) {
    f.push((k.name || "?") + ": a convergence knob must declare the `target` precision it is"
      + " supposed to reach, or 'converged' has no meaning");
  }
  return f;
}

/* Run `f(settings)` over one knob at a time, from the baseline.  One at a time and not a grid:
 * this measures which knob a number stands on, which is the question, and a grid would answer a
 * different one at exponentially greater cost. */
export function scan(f, knobs, baseline = {}) {
  /* THE BASELINE IS INSIDE THE TRY TOO.  A module whose job is to report what breaks cannot be the
   * thing that dies first: an earlier version evaluated the baseline outside any guard, so a
   * quantity that throws at its own default took the process down instead of coming back as
   * "untested". */
  let base = null, baseError = null;
  try { base = f({ ...baseline }); } catch (e) { baseError = String(e && e.message || e); }
  const out = [];
  for (const k of knobs) {
    const vals = [];
    for (const v of k.values) {
      let y = null, error = null;
      try { y = f({ ...baseline, [k.name]: v }); } catch (e) { error = String(e && e.message || e); }
      vals.push({ value: v, y, error });
    }
    const good = vals.filter((x) => x.error === null && Number.isFinite(x.y)).map((x) => x.y);
    const lo = good.length ? Math.min(...good) : null;
    const hi = good.length ? Math.max(...good) : null;
    out.push({ knob: k, base, lo, hi, values: vals,
               spread: lo === null ? null : hi - lo,
               failed: vals.filter((x) => x.error !== null).length });
  }
  return { base, baseError, scans: out };
}

/* The three budgets, kept apart on purpose, and the label that follows from them. */
export function budget(result, opts = {}) {
  const want = opts.target ?? null;         /* the precision the answer is supposed to have */
  const b = { base: result.base, convergence: 0, model: 0, measured: 0, worst: null, notes: [] };
  if (result.baseError) {
    b.notes.push("the quantity throws at its own baseline (" + result.baseError + "), so every"
      + " number below is about a computation that did not run");
  }
  for (const s of result.scans) {
    if (s.spread === null) {
      b.notes.push(s.knob.name + ": every variation failed, so this knob is untested");
      continue;
    }
    const half = s.spread / 2;
    if (half > b[s.knob.kind]) b[s.knob.kind] = half;
    if (!b.worst || half > b.worst.half) b.worst = { name: s.knob.name, kind: s.knob.kind, half };
    if (s.knob.kind === "convergence" && s.knob.target && s.spread > s.knob.target) {
      b.notes.push(s.knob.name + ": moves by " + s.spread.toPrecision(3) + " over its range, past"
        + " its own target of " + s.knob.target + " — the arithmetic has not converged, and this is"
        + " a defect and not an interval");
    }
  }
  b.verdict = label(b, want);
  return b;
}

function label(b, want) {
  if (b.convergence > 0 && (want === null || b.convergence > want)) {
    return { word: "sensitive-to-truncation",
             why: "the number still moves with how far the arithmetic was carried, by "
               + b.convergence.toPrecision(3) + ". Until that stops, nothing else about it is"
               + " worth quoting — this is not an uncertainty, it is an unfinished computation." };
  }
  if (b.model > 0 && b.model >= b.measured) {
    return { word: "sensitive-to-model",
             why: "the spread of " + b.model.toPrecision(3) + " is across a FAMILY of models, not"
               + " an error on one of them: moving these knobs asks a different question, and the"
               + " interval must be named as a range of predictions." };
  }
  if (b.measured > 0) {
    return { word: "robust",
             why: "what moves the number is the published error of its measured inputs, "
               + b.measured.toPrecision(3) + ", which is the only one of the three that is an"
               + " uncertainty in the usual sense." };
  }
  return { word: "not-determined",
           why: "nothing moved it, which usually means the knobs do not reach it rather than that"
             + " it is exact — check that the scan is wired to the quantity before believing this." };
}

/* How to write it down, once, so nobody has to guess which of the three the interval is.
 * A range is NEVER printed as +- when it is not one. */
export function stateResult(name, unit, b) {
  const w = b.verdict.word;
  if (w === "sensitive-to-truncation") {
    return name + " = " + fmt(b.base) + " " + unit + ", NOT CONVERGED (moves by ±"
      + fmt(b.convergence) + " " + unit + " with the truncation alone)";
  }
  if (w === "sensitive-to-model") {
    return name + " ∈ [" + fmt(b.base - b.model) + ", " + fmt(b.base + b.model) + "] " + unit
      + " across the model family — a range of predictions, not an error bar";
  }
  if (w === "robust") {
    return name + " = " + fmt(b.base) + " ± " + fmt(b.measured) + " " + unit
      + " (propagated from measured inputs)";
  }
  return name + " = " + fmt(b.base) + " " + unit + ", sensitivity not determined";
}

const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 1 ? x.toFixed(2) : x.toPrecision(3));

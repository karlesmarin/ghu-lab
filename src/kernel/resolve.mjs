/* resolve.mjs — the capability resolver.  DESIGN.md D4.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Modules declare what they PROVIDE and what they REQUIRE; this orders them, runs them once each,
 * and hands each one only what it asked for.  It is GAMBIT's capability/dependency mechanism at a
 * thousandth of the scale, and it is here for one reason that has nothing to do with convenience:
 *
 *   IF A REQUIRED CAPABILITY IS UNKNOWN, EVERYTHING DOWNSTREAM IS MARKED UNKNOWN
 *   INSTEAD OF QUIETLY COMPUTING ON IT.
 *
 * That makes the honesty floor structural rather than a habit.  A module cannot forget to check
 * whether the domain it is working on was legal, because if it was not, the module never runs and
 * its outputs say so, naming the capability that failed.
 *
 * A module is:
 *   { id, provides: [...], requires: [...], compute(ctx) -> { <capability>: value, ... } }
 * where ctx = { model, get(capability), fail(reason) }.
 */

import { STATUS, unknown } from "./status.mjs";

export class ResolveError extends Error {}

/* Topological order, with the two failure modes named rather than thrown vaguely. */
export function order(modules) {
  const byCap = new Map();
  for (const m of modules)
    for (const c of m.provides) {
      if (byCap.has(c))
        throw new ResolveError(`two modules provide "${c}": ${byCap.get(c).id} and ${m.id}`);
      byCap.set(c, m);
    }
  for (const m of modules)
    for (const r of m.requires)
      if (!byCap.has(r)) throw new ResolveError(`nothing provides "${r}", required by ${m.id}`);

  const state = new Map(), out = [];
  const visit = (m, trail) => {
    const s = state.get(m.id);
    if (s === "done") return;
    if (s === "open") throw new ResolveError(`dependency cycle: ${[...trail, m.id].join(" -> ")}`);
    state.set(m.id, "open");
    for (const r of m.requires) visit(byCap.get(r), [...trail, m.id]);
    state.set(m.id, "done");
    out.push(m);
  };
  for (const m of modules) visit(m, []);
  return out;
}

/* Run everything in order.  Returns { values, ran, skipped } where `values` maps capability ->
 * value object.  Nothing throws for physics reasons: a module that cannot answer returns unknowns,
 * and the resolver turns that into unknowns for everyone downstream. */
export function resolve(modules, model, { only = null } = {}) {
  const seq = order(modules);
  const values = new Map();
  const ran = [], skipped = [];

  const wanted = only ? new Set(only) : null;
  const needed = new Set();
  if (wanted) {
    const byCap = new Map();
    for (const m of seq) for (const c of m.provides) byCap.set(c, m);
    const pull = (cap) => {
      const m = byCap.get(cap);
      if (!m || needed.has(m.id)) return;
      needed.add(m.id);
      m.requires.forEach(pull);
    };
    wanted.forEach(pull);
  }

  for (const m of seq) {
    if (wanted && !needed.has(m.id)) continue;

    const missing = m.requires.filter((r) => {
      const v = values.get(r);
      return !v || v.status === STATUS.UNKNOWN;
    });
    if (missing.length) {
      const why = `requires ${missing.map((x) => `"${x}"`).join(", ")}, which ` +
                  `${missing.length > 1 ? "are" : "is"} unknown`;
      for (const c of m.provides) values.set(c, unknown(why));
      skipped.push({ id: m.id, why });
      continue;
    }

    const ctx = {
      model,
      get: (cap) => {
        if (!m.requires.includes(cap))
          throw new ResolveError(`${m.id} asked for "${cap}" without declaring it`);
        return values.get(cap);
      },
    };

    let got;
    try {
      got = m.compute(ctx) || {};
    } catch (err) {
      /* A PHYSICS failure becomes `unknown` and the run continues.  A CONTRACT violation -- a
       * module reaching for a capability it never declared, a cycle, a duplicate provider -- must
       * NOT: a bug in the wiring dressed up as an honest "I do not know" is the worst possible
       * output, because it is the one nobody investigates.  ResolveError goes straight up. */
      if (err instanceof ResolveError) throw err;
      const why = `${m.id} failed: ${err && err.message ? err.message : String(err)}`;
      for (const c of m.provides) values.set(c, unknown(why));
      skipped.push({ id: m.id, why });
      continue;
    }

    for (const c of m.provides)
      values.set(c, got[c] !== undefined ? got[c] : unknown(`${m.id} did not return "${c}"`));
    for (const [k, v] of Object.entries(got))
      if (!m.provides.includes(k)) values.set(k, v);       // extra outputs are allowed, not required
    ran.push(m.id);
  }

  return { values, ran, skipped };
}

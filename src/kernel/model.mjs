/* model.mjs — the model record.  DESIGN.md D2.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * One canonical JSON document is the only thing the five sections share.  It hashes to a short id,
 * and that one id is simultaneously the permalink, the benchmark-point name and the provenance
 * stamp.  Everything else in the instrument is derived from it.
 *
 * Two rules are taken from the SUSY Les Houches Accord, whose actual mandate is stronger than it is
 * usually remembered: the parameters ACTUALLY USED must be written onto the output, and a default
 * that is not echoed is a hidden hypothesis.  So `complete()` fills every default explicitly and
 * records that it did.
 *
 * No dependencies.  Runs in node and in a browser from file:// — which rules out crypto.subtle
 * (async, and not available outside a secure context), hence the hand-rolled hash below.  It is an
 * identifier, not a security primitive, and the tests pin its behaviour.
 */

export const SCHEMA_VERSION = 1;

/* Defaults live here and nowhere else.  Each entry carries the source that fixes it: an unsourced
 * default is a hidden hypothesis, and /docs renders this table verbatim. */
export const DEFAULTS = {
  "conventions.m_W": { value: 80.4, units: "GeV", source: "PDG, as used by arXiv:2503.04090" },
  "conventions.g4": { value: 0.63, units: "", source: "the Standard-Model su(2)_L value" },
  "conventions.mh_window": { value: [125.0, 127.0], units: "GeV", source: "arXiv:2503.04090, Table 1" },
  "conventions.windings": { value: 600, units: "", source: "truncation of the Li_5 sum; see /docs" },
  "conventions.gauge_seed": { value: "published", units: "", source: "the gauge coefficients as printed in arXiv:2503.04090 eq. (68); Part VII section 13 carries a candidate split, and the page can stand on it instead" },
};

export function emptyModel() {
  return {
    schema_version: SCHEMA_VERSION,
    group: null,          // e.g. "SU(7)" — a key into the group data files, never code
    orbifold: null,       // { name, parities: {...}, wilson_line: [...] }
    bulk: [],             // [{ rep, parities: [+1,-1], multiplicity }]
    brane: [],
    conventions: {},
  };
}

/* ---------------------------------------------------------------- canonical form */

/* Sorted keys, arrays kept in order, numbers left alone but rationals written as [p, q] by the
 * caller.  Canonicality is what makes the hash meaningful: two records that mean the same thing
 * must serialise identically. */
export function canonicalise(value) {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      const v = canonicalise(value[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return value;
}

export function canonicalJSON(model) {
  return JSON.stringify(canonicalise(model));
}

/* ---------------------------------------------------------------- defaults, echoed */

/* Returns { model, applied } where `applied` names every default that was filled in.  The card
 * carries `applied`, so a reader can see which numbers the user chose and which the tool did. */
export function complete(model) {
  const out = JSON.parse(JSON.stringify(model));
  out.schema_version = out.schema_version ?? SCHEMA_VERSION;
  out.conventions = out.conventions || {};
  const applied = [];
  for (const [path, def] of Object.entries(DEFAULTS)) {
    const key = path.split(".").slice(1).join(".");
    if (out.conventions[key] === undefined) {
      out.conventions[key] = def.value;
      applied.push({ key, value: def.value, units: def.units, source: def.source });
    }
  }
  return { model: out, applied };
}

/* ---------------------------------------------------------------- validation */

export function validate(model) {
  const bad = [];
  if (!model || typeof model !== "object") return ["the record is not an object"];
  if (model.schema_version !== SCHEMA_VERSION)
    bad.push(`schema_version is ${model.schema_version}, this build speaks ${SCHEMA_VERSION}`);
  if (!model.group) bad.push("no group");
  if (!model.orbifold) bad.push("no orbifold");
  if (!Array.isArray(model.bulk)) bad.push("bulk is not a list");
  else
    model.bulk.forEach((m, i) => {
      if (!m || typeof m.rep !== "string") bad.push(`bulk[${i}] has no rep`);
      if (!Number.isInteger(m?.multiplicity) || m.multiplicity < 0)
        bad.push(`bulk[${i}] multiplicity must be a non-negative integer`);
      /* exactly two: termTable reads parities[0] and [1] unconditionally, and [1], [] or
       * [1, 1, 1] used to pass this check and fail there -- an outside audit's finding */
      if (!Array.isArray(m?.parities) || m.parities.length !== 2 ||
          m.parities.some((p) => p !== 1 && p !== -1))
        bad.push(`bulk[${i}] parities must be exactly two of +1/-1`);
    });
  return bad;
}

/* ---------------------------------------------------------------- the id */

/* 64-bit FNV-1a in two 32-bit lanes, rendered as 12 hex characters.  Deterministic across node and
 * every browser, no dependency, no secure context needed.  An identifier, not a digest. */
export function hashString(s) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + c) >>> 0; h2 = Math.imul(h2, 0x85ebca6b) >>> 0; h2 ^= h2 >>> 13;
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0").slice(0, 4);
}

export function modelId(model) {
  return hashString(canonicalJSON(canonicalise(model)));
}

/* ---------------------------------------------------------------- human form */

export function describe(model) {
  if (!model?.bulk?.length) return `${model?.group || "?"} · (no bulk content)`;
  const parts = model.bulk
    .filter((m) => m.multiplicity)
    .map((m) => `${m.multiplicity > 1 ? m.multiplicity + "x" : ""}${m.rep}` +
      `(${m.parities.map((p) => (p > 0 ? "+" : "-")).join(",")})`);
  return `${model.group} · ${model.orbifold?.name || "?"} · ${parts.join(" + ")}`;
}

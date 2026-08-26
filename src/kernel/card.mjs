/* card.mjs — the result card.  DESIGN.md D5.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The single output object, and the only thing serialised.  A figure in a paper must be traceable
 * back to the run that made it, which means the card carries the INPUT ACTUALLY USED — defaults
 * included and flagged as defaults — not just the results.  That is the Les Houches rule, and it
 * is the difference between an export and a screenshot.
 *
 *   input         the model record, completed, plus which defaults were applied
 *   provenance    tool version, build, kernel hash, model id
 *   results       every value as { value, units, status, source }
 *   certificates  the witness a third party needs to re-check a bound WITHOUT this tool
 *
 * A bound is not a number, it is a number plus a witness.  `certificates` is where the witness
 * goes, and shipping it is what lets a referee re-derive the claim with their own arithmetic.
 */

import { complete, modelId, canonicalJSON } from "./model.mjs";
import { TOOL, authorLine } from "./meta.mjs";
import { STATUS, tally, weakest } from "./status.mjs";

export function makeCard(model, values, { version = "dev", build = null, kernelHash = null,
                                          certificates = {} } = {}) {
  const { model: full, applied } = complete(model);
  const results = {};
  for (const [k, v] of (values instanceof Map ? values.entries() : Object.entries(values)))
    results[k] = v;
  const list = Object.values(results);

  return {
    card_version: 1,
    input: { model: full, defaults_applied: applied },
    provenance: {
      tool: TOOL.name,
      version,
      build,
      kernel_hash: kernelHash,
      model_id: modelId(full),
      /* Authorship travels WITH the numbers.  A card read in ten years should still say who
       * produced it, and an ORCID iD is the part of that which does not rot. */
      authors: TOOL.authors.map((a) => ({ name: a.name, orcid: a.orcid,
                                          affiliation: a.affiliation })),
      assistant: TOOL.assistant,
    },
    summary: { tally: tally(list), weakest: weakest(list) },
    results,
    certificates,
  };
}

/* Flat text, for pasting into an email or a log.  Deliberately not a table: it must survive being
 * quoted, wrapped and re-quoted. */
export function toText(card) {
  const L = [];
  L.push(`# ghu-lab result card`);
  L.push(`model      ${card.provenance.model_id}`);
  L.push(`tool       ${card.provenance.tool} ${card.provenance.version}` +
         (card.provenance.build ? ` (${card.provenance.build})` : ""));
  for (const a of card.provenance.authors || [])
    L.push(`author     ${a.name}  ORCID ${a.orcid}${a.affiliation ? "  (" + a.affiliation + ")" : ""}`);
  if (card.provenance.assistant) L.push(`assisted   ${card.provenance.assistant}`);
  if (card.provenance.kernel_hash) L.push(`kernel     ${card.provenance.kernel_hash}`);
  L.push("");
  L.push(`## input`);
  L.push(canonicalJSON(card.input.model));
  if (card.input.defaults_applied.length) {
    L.push("");
    L.push(`## defaults applied by the tool, not chosen by the user`);
    for (const d of card.input.defaults_applied)
      L.push(`  ${d.key} = ${JSON.stringify(d.value)}${d.units ? " " + d.units : ""}   [${d.source}]`);
  }
  L.push("");
  L.push(`## results`);
  const w = Math.max(...Object.keys(card.results).map((k) => k.length), 4);
  for (const [k, v] of Object.entries(card.results)) {
    const num = v.value === null ? "—" : String(v.value);
    L.push(`  ${k.padEnd(w)}  ${num}${v.units ? " " + v.units : ""}` +
           `   [${v.status}] ${v.source}${v.reason ? " — " + v.reason : ""}`);
  }
  const t = card.summary.tally;
  L.push("");
  L.push(`## summary`);
  L.push(`  theorem ${t.theorem} · verified ${t.verified} · measured ${t.measured} · unknown ${t.unknown}`);
  L.push(`  the weakest thing in this card is: ${card.summary.weakest}`);
  if (t.unknown)
    L.push(`  ${t.unknown} value(s) are UNKNOWN and say why.  That is a verdict, not a gap.`);
  if (Object.keys(card.certificates).length) {
    L.push("");
    L.push(`## certificates — re-checkable without this tool`);
    for (const [k, c] of Object.entries(card.certificates))
      L.push(`  ${k}: ${JSON.stringify(c)}`);
  }
  return L.join("\n");
}

/* A card is self-testing: re-run the kernel on the echoed input and diff.  This is what turns any
 * exported card into a reproducibility check, which nothing in this genre currently offers. */
export function diffCards(a, b) {
  const out = [];
  const keys = new Set([...Object.keys(a.results), ...Object.keys(b.results)]);
  for (const k of keys) {
    const x = a.results[k], y = b.results[k];
    if (!x || !y) { out.push({ key: k, why: "present in only one card" }); continue; }
    if (x.status !== y.status) out.push({ key: k, why: `status ${x.status} vs ${y.status}` });
    else if (typeof x.value === "number" && typeof y.value === "number") {
      const d = Math.abs(x.value - y.value) / (Math.abs(y.value) || 1);
      if (d > 1e-12) out.push({ key: k, why: `value differs by ${d.toExponential(2)} relative` });
    } else if (JSON.stringify(x.value) !== JSON.stringify(y.value))
      out.push({ key: k, why: "value differs" });
  }
  return out;
}

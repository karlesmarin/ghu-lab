/* status.mjs — the honesty vocabulary, as a field rather than a badge.  DESIGN.md D5.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Every number this instrument produces carries what is known about it.  The field's existing
 * vocabulary is the SUSY Les Houches Accord's SPINFO code 3 = warning, code 4 = error: a binary
 * about whether the RUN failed, with nothing about the epistemic status of each number.  This is
 * that missing axis, and it is exported, not merely displayed.
 *
 *   theorem   proved, and the proof is named
 *   verified  checked exhaustively or against an independent implementation; NOT proved
 *   measured  computed by this tool from inputs that carry their own caveats
 *   unknown   a first-class verdict.  Not an empty cell, not a zero, not a silent omission.
 *
 * `unknown` existing at all is the point: UNAUDITABLE beats false confidence, and a calculator
 * that cannot say "I do not know" will eventually say something worse.
 */

export const STATUS = Object.freeze({
  THEOREM: "theorem",
  VERIFIED: "verified",
  MEASURED: "measured",
  UNKNOWN: "unknown",
});

const ORDER = [STATUS.THEOREM, STATUS.VERIFIED, STATUS.MEASURED, STATUS.UNKNOWN];

export function isStatus(s) {
  return ORDER.includes(s);
}

/* A value is never a bare number.  `source` is where it came from — a proof, a script, a paper, or
 * the route that computed it ("browser", "table", "api@v1.2"). */
export function val(value, { units = "", status, source, note } = {}) {
  if (!isStatus(status)) throw new Error(`val(): unknown status ${JSON.stringify(status)}`);
  if (!source) throw new Error("val(): every value needs a source");
  const out = { value, units, status, source };
  if (note) out.note = note;
  return out;
}

/* The verdict we refuse to fake.  A reason is mandatory: "unknown" with no reason is the silence
 * this whole vocabulary exists to prevent. */
export function unknown(reason, { units = "" } = {}) {
  if (!reason) throw new Error("unknown(): a reason is mandatory");
  return { value: null, units, status: STATUS.UNKNOWN, source: "not computed", reason };
}

/* The weakest status present — what the model header shows as the honest summary of a whole run. */
export function weakest(values) {
  let worst = STATUS.THEOREM;
  for (const v of values) {
    if (!v || !isStatus(v.status)) continue;
    if (ORDER.indexOf(v.status) > ORDER.indexOf(worst)) worst = v.status;
  }
  return worst;
}

export function tally(values) {
  const t = { theorem: 0, verified: 0, measured: 0, unknown: 0 };
  for (const v of values) if (v && isStatus(v.status)) t[v.status]++;
  return t;
}

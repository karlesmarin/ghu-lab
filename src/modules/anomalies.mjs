/* anomalies.mjs — Part VI: what an escape from proton decay costs, in eighths.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Part VI obstructs the one-generation version of the model, classifies the minimal escapes, and
 * finds that the surviving one is a family-dependent charge hosted by an 84(+,+) — a multiplet
 * every row of their Table 1 already contains.  Donating it to the brane removes it from the Higgs
 * potential by their own argument, and that removal has an exact arithmetic price.
 *
 * THIS MODULE COMPUTES THE PRICE, AND IT IS THE PART THAT IS ARITHMETIC.  Every multiplet's cost is
 * an integer number of eighths, so "can this row afford the escape?" is a question with an exact
 * answer and no normalisation in it.
 *
 * IT DOES NOT COMPUTE THE SIX ANOMALY CHANNELS.  Those live in the Part VI scripts and are not
 * ported into this kernel; the capability is provided as `unknown`, with the reason, rather than
 * left out — because a missing section reads as "nothing to say" and an unknown reads as
 * "not answered here, and here is where it is answered".
 *
 * And one thing goes further than the paper: Part VI says in its own words that "the modified
 * potential is not recomputed here".  With the Part VII kernel present it can be, so the module
 * reports what the donation does to m_h and 1/R_5 — labelled `measured`, carrying the anchor band,
 * and flagged as beyond what Part VI claimed.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { termTable, moments, alphaMin, curvatureAtMin, higgsMass, invR5 }
  from "../kernel/potential.mjs";

/* The cost of removing one multiplet from the bulk, in eighths of D.  Read off the data, not
 * typed: these are the numbers Part VI calls the bill. */
export function bill(data) {
  const gauge = moments(data.gauge);
  const out = [];
  for (const rep of Object.keys(data.reps))
    for (const key of Object.keys(data.reps[rep])) {
      const t = data.gauge.concat(data.reps[rep][key]);
      out.push({ rep, key, cost8: Math.round(8 * (moments(t).D - gauge.D)) });
    }
  return out;
}

const HOST = { rep: "84", key: "(+,+)" };     /* the multiplet that can host the escape */

export const anomaliesModule = (data) => ({
  id: "anomalies",
  /* `channels` used to be provided here as an honest `unknown`.  It is computed now, by the
   * escape module (Part VI ported), and a capability has one provider. */
  provides: ["bill", "donation", "size_curve"],
  requires: ["moments", "D8"],

  compute({ model, get }) {
    const D8 = get("D8").value;
    const table = bill(data);
    const cost = table.find((b) => b.rep === HOST.rep && b.key === HOST.key).cost8;

    const out = {
      /* THE FIVE ROWS ARE THEIR TABLE 1, NOT THE UNIVERSE.  The same lattice generates a content
       * for every multiset of multiplets, and the escape is priced on all of them.  Read from the
       * data file, which reads it from `ceiling_ilp.py` -- this section DISPLAYS the enumeration
       * and the certificate, it does not re-derive either. */
      size_curve: data.size_curve && data.escape
        ? val({ rows: data.size_curve, escape: data.escape, ceiling: data.constants }, {
            status: STATUS.VERIFIED,
            source: "ceiling_ilp.py sections 4 and 6: the enumeration is exhaustive up to " +
                    `${data.size_curve[data.size_curve.length - 1].N} multiplets, and the ceiling ` +
                    "is certified rung by rung by an exact rational LP dual. The maximum over " +
                    "rungs is taken across a scan on which it is monotone, not proved monotone",
          })
        : unknown(`the data file for ${data.group} carries no size curve: the enumeration and the ` +
                  `ceiling certificate exist for SU(7) only, and a count from another lattice ` +
                  `would not be about this one`),
      bill: val(table, {
        status: STATUS.THEOREM,
        source: "Part VI: each multiplet's contribution to 8D is an integer, exactly",
      }),
    };

    const held = (model.bulk || []).find(
      (b) => b.rep === HOST.rep && b.parities[0] > 0 && b.parities[1] > 0 && b.multiplicity > 0);

    if (!held) {
      out.donation = val(
        { host: `${HOST.rep}${HOST.key}`, cost8: cost, available: false },
        { status: STATUS.THEOREM,
          source: `this content holds no ${HOST.rep}${HOST.key}, so the escape Part VI classifies ` +
                  `has no host here` });
      return out;
    }

    /* Donate one: the same content minus one host. */
    const after = { ...model, bulk: model.bulk.map((b) =>
      (b === held ? { ...b, multiplicity: b.multiplicity - 1 } : b)).filter((b) => b.multiplicity) };

    const D8after = D8 - cost;
    const mo2 = moments(termTable(after, data));
    const c = model.conventions || {};
    let mh2 = null, R2 = null, win2 = null;
    if (mo2.D > 0) {
      const a2 = alphaMin(mo2);
      if (a2 !== null && curvatureAtMin(mo2, a2) > 0) {
        mh2 = higgsMass(mo2, a2, c.m_W, c.g4);
        R2 = invR5(a2, c.m_W);
        win2 = mh2 >= c.mh_window[0] && mh2 <= c.mh_window[1];
      }
    }

    out.donation = val({
      host: `${HOST.rep}${HOST.key}`, cost8: cost, available: true,
      D8_before: D8, D8_after: D8after, survives: D8after > 0,
      /* Beyond Part VI, and marked as such: the paper says "the modified potential is not
       * recomputed here".  With the Part VII kernel present, it can be. */
      after: { m_h: mh2, invR5: R2, in_window: win2 },
    }, {
      status: STATUS.THEOREM,
      source: `the cost is exact: removing one ${HOST.rep}${HOST.key} takes ${cost}/8 off D. ` +
              `The m_h and 1/R_5 after donation are MEASURED, carry the Part VI §7 anchor band, ` +
              `and go beyond what Part VI claimed -- it states that the modified potential is not ` +
              `recomputed there`,
    });
    return out;
  },
});

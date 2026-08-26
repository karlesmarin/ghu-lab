/* multiplets.mjs (module) — the model's own content, read one layer below its term tables.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The section beside this one lets a reader wander over representations and parities.  This module
 * answers the same questions about the content actually loaded, so the answers land in the record
 * with everything else and can be read from any other section:
 *
 *   zero_spectrum   what survives the orbifold, multiplet by multiplet, and with which chirality
 *   derived_terms   the term table recomputed from the decomposition, against the transcribed one
 *   p6_split        the gauge sector's two halves against this content, and whether one cancels
 *
 * `derived_terms` is the one that earns its keep quietly: every number this app has ever printed
 * stands on term tables that were copied out of eqs. (73)-(76) by hand.  Now they are recomputed
 * from eqs. (41), (57), (69) and (70) on every load, and the card says so when they disagree.
 */
import { STATUS, val } from "../kernel/status.mjs";
import { chargesOf, zeroMode, termsOf, samePotential, p6Ledger, MUF } from "../kernel/multiplets.mjs";

export const multipletsModule = (data) => ({
  id: "multiplets",
  provides: ["multiplets"],
  requires: [],

  compute({ model }) {
    const M = data.multiplets;
    const bulk = model.bulk || [];

    const entries = bulk.map((b) => {
      const mults = (M.decomposition || {})[b.rep] || [];
      const [eta, etap] = b.parities || [1, 1];
      const tag = `(${eta > 0 ? "+" : "-"},${etap > 0 ? "+" : "-"})`;
      const derived = termsOf(mults, { eta, etap });
      const shipped = ((data.reps || {})[b.rep] || {})[tag] || null;
      const surviving = mults.filter((mu) => zeroMode(mu, eta, etap));
      return {
        rep: b.rep, parities: [eta, etap], multiplicity: b.multiplicity,
        equation: (M.equations || {})[b.rep] || null,
        multiplets: mults.length,
        states: mults.reduce((t, mu) => t + mu[MUF.COLOUR] * mu[MUF.DIM], 0),
        zero_modes: surviving.map((mu) => ({
          label: mu[MUF.LABEL], chirality: zeroMode(mu, eta, etap),
          states: mu[MUF.COLOUR] * mu[MUF.DIM],
          charges: chargesOf(mu[MUF.DIM]),
        })),
        zero_states: surviving.reduce((t, mu) => t + mu[MUF.COLOUR] * mu[MUF.DIM], 0)
          * (b.multiplicity || 1),
        derived,
        shipped,
        agrees: shipped ? samePotential(derived, shipped) : null,
      };
    });

    const disagreeing = entries.filter((e) => e.agrees === false).map((e) => e.rep);

    /* The gauge sector against the WHOLE content, sector by sector.  One 48(+,+) is the case that
     * cancels the periodic half; the ledger is computed for whatever is loaded, so a reader can
     * see how far from that the content sits. */
    const gm = (M.decomposition || {})["48"] || [];
    const perSector = [];
    if (gm.length) {
      for (const [name, want] of [["periodic", +1], ["antiperiodic", -1]]) {
        const g = termsOf(gm.filter((mu) => mu[MUF.P6] === want), {
          weight: (p6) => M.gauge_weight[p6 > 0 ? "periodic" : "antiperiodic"], sign: -1 });
        let matter = [];
        for (const b of bulk) {
          const mults = ((M.decomposition || {})[b.rep] || []).filter((mu) => mu[MUF.P6] === want);
          const [eta, etap] = b.parities || [1, 1];
          matter = matter.concat(termsOf(mults, { eta, etap })
            .map(([m, s, c]) => [m * (b.multiplicity || 1), s, c]));
        }
        const led = p6Ledger(gm, M.gauge_weight, [], {});   // reuse the aggregator's channel sum
        const acc = new Map();
        for (const [m, s, c] of [...g, ...matter]) {
          const k = `${s}|${c}`;
          acc.set(k, (acc.get(k) || 0) + m);
        }
        const sum = [...acc.entries()]
          .map(([k, m]) => { const [s, c] = k.split("|").map(Number); return [m, s, c]; })
          .filter(([m]) => Math.abs(m) > 1e-12)
          .sort((a, b) => b[2] - a[2] || b[1] - a[1]);
        perSector.push({ name, P6: want, gauge: g, matter, sum, cancels: sum.length === 0,
                         _led: led.length });
      }
    }

    return {
      multiplets: val({
        entries,
        zero_states_total: entries.reduce((t, e) => t + e.zero_states, 0),
        derived_agrees: disagreeing.length === 0,
        disagreeing,
        p6_split: perSector.map(({ _led, ...rest }) => rest),
        periodic_cancels: perSector.length ? perSector[0].cancels : null,
      }, {
        status: STATUS.THEOREM,
        source: "Komori & Maru eqs. (41), (57), (69), (70) for the decompositions, (72) for the " +
                "sign eta*eta'*P5*P5', (71) and its note for the charges c = r-1, r-3, ...; the " +
                "zero-mode rule follows from eqs. (39)-(40).  Every term table is recomputed here " +
                "and compared with the one transcribed from eqs. (73)-(76)",
      }),
    };
  },
});

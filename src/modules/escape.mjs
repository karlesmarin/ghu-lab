/* escape.mjs — Part VI as a computation: the six channels on the brane content, the ladder, the
 * assignments that survive, the price of the one that fits, and the selection rule.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The anomalies module declared the six channels `unknown` -- "evaluated in the Part VI ancillary
 * scripts and not ported into this kernel".  This is the port.  It reads the BRANE half of the
 * model record, which every other module ignores: the brane-quark charge X_Q, the rung of each
 * lepton generation, and the charge of the U(1)'-breaking scalar.  Defaults are their paper's:
 * one generation on rung 0 (their eq. (43)), X_Q left to the anomalies, and no scalar charge --
 * which their paper does not state, and the panel says so rather than picking one.
 *
 * Everything here is exact rational arithmetic on their equations; statuses:
 *   theorem   the channel values, Prop. 1, the ladder, Prop. 3, the residual group -- arithmetic
 *   verified  the 14 -> 2 enumeration, checked against Part VI's archived table by the harness
 *   measured  nothing: no absolute scale enters this module at all
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { R, str, parse, add, mul, div, neg, abs, isZero, isInt, eq, sum, toNum, HALF, ZERO, ONE,
         generation, CHANNELS, SM_CHANNELS, channels, channelPolynomial, polyStr, rationalRoots,
         extraOfRung, protonCharge, hosts, hostable, assignments, protection, scanProtection,
         residual, protectsGS, SUPPLY, QUANTUM, identityCheck, operatorCharges }
  from "../kernel/charges.mjs";

/* The brane half of the record.  `model.brane` is a list, as the schema has always had it; the
 * escape reads the entries it knows and echoes what it filled in. */
export function braneOf(model) {
  const B = model.brane || [];
  const find = (kind) => B.find((b) => b && b.kind === kind);
  const q = find("quarks"), l = find("leptons"), s = find("scalar");
  const applied = [];
  let X_Q = null;
  if (q && q.X_Q !== undefined && q.X_Q !== null && q.X_Q !== "") X_Q = parse(q.X_Q);
  else applied.push("X_Q left to the anomalies");
  let rungs = l && Array.isArray(l.rungs) && l.rungs.length ? l.rungs.map((k) => +k) : null;
  if (!rungs) { rungs = [0]; applied.push("one generation on rung 0, their eq. (43)"); }
  let qphi = null;
  if (s && s.q_phi !== undefined && s.q_phi !== null && s.q_phi !== "") qphi = parse(s.q_phi);
  else applied.push("no scalar charge: their paper does not state q_phi");
  let universal = !(q && q.universal === false);
  return { X_Q, rungs, qphi, universal, applied };
}

export const escapeModule = (data) => ({
  id: "escape",
  provides: ["brane", "channels", "ladder", "assignments", "protection", "residual", "bill_escape"],
  requires: ["D8", "bill"],

  compute({ model, get }) {
    const D8 = get("D8").value, bill = get("bill").value;
    const B = braneOf(model);
    const N = B.rungs.length;
    const ls = B.rungs.map(extraOfRung);

    /* THE BRANE-QUARK CHARGE.  Family-universal: a = -(sum l)/(3N) is what anomaly cancellation
     * of the SU(2) channel forces (Prop. 1), and at N = 1 that is X_Q = -1/6 exactly.  A typed
     * X_Q overrides it, and then the channels are evaluated there and simply reported. */
    const aForced = neg(div(sum(ls), R(3 * N)));
    const a = B.X_Q === null ? aForced : B.X_Q;
    const As = ls.map((l) => protonCharge(a, l));

    /* THE SIX CHANNELS, on the surviving content: generations at their rungs, plus the neutrinos
     * the assignment needs (found below) so that the table can show them cancelling. */
    const polys = CHANNELS.map((c) => ({ id: c.id, label: c.label,
                                         co: channelPolynomial(c, { rungs: ls }) }));
    const polyRows = polys.map((p) => ({ ...p, poly: polyStr(p.co), roots: rationalRoots(p.co) }));
    const smOk = SM_CHANNELS.every((c) => isZero(c.f(ls.flatMap((l) => generation(a, l)))));

    /* the assignments, enumerated here; the current rungs are looked up in them */
    const all = assignments({ N: 3 });
    const key = (l) => l.map((x) => str(x)).join(",");
    const sortedKey = key(ls.slice().sort((x, y) => toNum(y) - toNum(x)));
    const mine = N === 3 ? all.find((s) => key(s.l) === sortedKey) || null : null;

    /* neutrinos for the CURRENT content: the assignment's if N = 3 and it survives; at N = 1 the
     * two uncancellable channels demand one singlet of charge -1 (Part VI §3) */
    const nus = mine && mine.nus ? mine.nus : (N === 1 ? [R(-1)] : []);
    const withNu = ls.flatMap((l, j) => generation(a, l, j === 0 ? nus : []));
    const values = channels(withNu);
    const bare = channels(ls.flatMap((l) => generation(a, l)));
    const allCancel = CHANNELS.every((c) => isZero(values[c.id]));
    const prop1 = eq(bare.su2_x, div(sum(As), R(2)));

    const out = {};
    out.brane = val({ X_Q: str(a), X_Q_forced: B.X_Q === null, X_Q_forced_value: str(aForced),
                      rungs: B.rungs, l: ls.map(str), A: As.map(str), N,
                      q_phi: B.qphi === null ? null : str(B.qphi), universal: B.universal,
                      applied: B.applied }, {
      status: STATUS.MEASURED,
      source: "the brane half of the model record; defaults echoed in `applied`",
    });

    out.channels = val({
      table: CHANNELS.map((c) => ({ id: c.id, label: c.label, bare: str(bare[c.id]),
                                    withNu: str(values[c.id]) })),
      polynomials: polyRows.map((p) => ({ id: p.id, label: p.label, poly: p.poly,
                                          roots: p.roots === "every" ? "every X_Q"
                                                 : p.roots.map(str) })),
      nus: nus.map(str), allCancel, smChannelsVanish: smOk, prop1,
      A: As.map(str), protects: As.every((x) => !isZero(x)),
    }, {
      status: STATUS.THEOREM,
      source: "Part VI §3-§4: the six U(1)' channels on the surviving chiral content, state by " +
              "state with Cartan generators, their own conjugate-pairing prescription applied; " +
              "[SU(2)_L]² U(1)' = ½ Σ A_j exactly (Prop. 1)",
    });

    out.ladder = val({
      rows: [0, 1, 2, 3].map((k) => ({
        k, boxes: k + 2, extra: str(extraOfRung(k)),
        L: `(5,6${",7".repeat(k)})`, eR: `(6${",7".repeat(k + 1)})`,
        hosts: hosts(k).map((h) => ({ rep: h.rep, hostsE: h.hostsE,
                                      parities: h.parities.map(([e, p]) => `(${e > 0 ? "+" : "−"},${p > 0 ? "+" : "−"})`) })),
        hostable: hostable(k),
      })),
      identity: identityCheck(), operators: operatorCharges().map((o) => ({ name: o.name, Y: str(o.Y), BL: str(o.BL) })),
    }, {
      status: STATUS.THEOREM,
      source: "Part VI §4: extra(L) = (1−k)/2, read off the weight; hosting from their eqs. " +
              "(37)-(40) with the Yukawa closing inside one multiplet; the 48 is real (Prop. 2)",
    });

    out.assignments = val({
      rows: all.map((s) => ({ l: s.l.map(str), rungs: s.rungs, X_Q: str(s.a), A: s.A.map(str),
                              protects: s.protects, survives: s.survives,
                              nus: s.nus ? s.nus.map(str) : null, realisable: s.realisable,
                              strict: s.strict, needsMinusOne: s.needsMinusOne, rung1: s.rung1 })),
      total: all.length, surviving: all.filter((s) => s.survives).length,
      realisable: all.filter((s) => s.realisable).length,
      current: mine ? { X_Q: str(mine.a), survives: mine.survives, realisable: mine.realisable,
                        nus: mine.nus ? mine.nus.map(str) : null } : null,
    }, {
      status: STATUS.VERIFIED,
      source: "Part VI §4: N = 3 on rungs {0,1,2,3}, X_Q family-universal, neutrinos from the " +
              "singlet ladder up to three -- the fourteen and the two, enumerated here and held " +
              "to su7_realisable.py's archived table by the harness",
    });

    /* THE SELECTION RULE, on the current A_j and the current q_phi */
    const P = protection(As, B.qphi);
    out.protection = val({
      A: As.map(str), failingSet: P.failingSet.map(str), halfLine: P.halfLine ? str(P.halfLine) : null,
      everyQFails: P.everyQFails, zeros: P.zeros,
      q_phi: B.qphi === null ? null : str(B.qphi), dressable: P.dressable, protectedAt: P.protectedAt,
      supply: SUPPLY.map((s) => ({ q: str(s.q), rep: s.rep, component: s.component,
                                   dressable: protection(As, s.q).dressable })),
    }, {
      status: STATUS.THEOREM,
      source: "Part VI Prop. 3: protection fails at q_phi iff q_phi = |A_j|/n; the set has a " +
              "maximum, so protection is a half-line",
    });

    out.residual = val({
      quantum: str(QUANTUM),
      single: SUPPLY.map((s) => ({ q: str(s.q), rep: s.rep, N: residual([s.q]).N, protectsGS: protectsGS(s.q) })),
      pairs: [[0, 1], [0, 2], [1, 2]].map(([i, j]) => {
        const r = residual([SUPPLY[i].q, SUPPLY[j].q]);
        return { pair: `${str(SUPPLY[i].q)} + ${str(SUPPLY[j].q)}`, gcd: str(r.generator), N: r.N,
                 protectsGS: protectsGS(r.generator) };
      }),
      chosen: B.qphi === null ? null : residual([B.qphi]).N,
    }, {
      status: STATUS.THEOREM,
      source: "Part VI §6: the bulk lattice is (1/2)Z, so a VEV of charge q leaves Z_{2q}; with " +
              "several scalars the residual is generated by their gcd (su7_residual_group.py)",
    });

    /* THE BILL: every generation on rung 1 is hosted by an 84(+,+), which is then massive and
     * leaves the potential -- their own sentence -- at 10/8 of D each. */
    const host = bill.find((b) => b.rep === "84" && b.key === "(+,+)");
    const n1 = B.rungs.filter((k) => k === 1).length;
    const held = (model.bulk || []).filter((b) => b.rep === "84" && b.parities[0] > 0 && b.parities[1] > 0)
      .reduce((s, b) => s + b.multiplicity, 0);
    const cost = host ? host.cost8 * n1 : null;
    out.bill_escape = val({
      rung1: n1, cost8: cost, hosts_held: held, enough_hosts: held >= n1,
      D8_before: D8, D8_after: cost === null ? null : D8 - cost,
      survives: cost === null ? null : (held >= n1 && D8 - cost > 0),
    }, {
      status: STATUS.THEOREM,
      source: n1 === 0
        ? "no generation on rung 1: nothing leaves the potential, and the bill is zero"
        : `${n1} generation${n1 > 1 ? "s" : ""} on rung 1 need${n1 > 1 ? "" : "s"} ${n1} × 84(+,+) donated ` +
          `to the brane at ${host ? host.cost8 : "?"}/8 each -- Part VI §5, exact`,
    });
    return out;
  },
});

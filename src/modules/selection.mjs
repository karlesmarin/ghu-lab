/* selection.mjs — Part III: one bit decides how much of the torus you must search.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Provides `legal_domain`.  Architecturally this is the important one: DESIGN.md D4 says an unknown
 * legal domain must reach everything downstream rather than be quietly computed over, and until
 * this module existed that promise was exercised only by a synthetic test.  Now it has a real
 * cause: a group whose representations carry no Dynkin labels cannot be asked the question.
 *
 * THE RULE, taken verbatim from the published tool (ghu-explorer/src/shell.html) rather than
 * reconstructed, because reconstructing a rule from memory is how a sign gets lost:
 *
 *     centre charge          a + 2b + 3c
 *     oddParity(a,b,c)       (a + 2b + 3c) is odd
 *     degen(a,b,c)           b odd AND ((a odd AND c odd) OR a == c)
 *     half-domain holds      (not oddParity) OR degen
 *     legal region in a_2    [0, 1/2] if it holds, otherwise [0, 1] -- the full torus
 *     tower pairs at         degenerate: both; odd: even m; even: odd m
 *     hosts a generation     oddParity AND b >= 1 AND a+b+c >= 3
 *     zero modes             N = (b+1)(a+c+1)/2
 *
 * Each of those is labelled `theorem` on the published page and stays so here.
 *
 * FOR A CONTENT OF SEVERAL REPRESENTATIONS the half-domain is the CONJUNCTION: you may halve the
 * search region only if every representation present allows it.  That composition is ours, not a
 * quoted statement, and the source string says so.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { spectrum, lattice, V } from "../kernel/wilson.mjs";

export const centreCharge = (a, b, c) => a + 2 * b + 3 * c;
export const oddParity = (a, b, c) => centreCharge(a, b, c) % 2 === 1;
export const degenerate = (a, b, c) => b % 2 === 1 && ((a % 2 === 1 && c % 2 === 1) || a === c);
export const halfDomain = (a, b, c) => !oddParity(a, b, c) || degenerate(a, b, c);

/* THE DISJUNCT NEVER FIRES, and the reduction is worth stating because it turns a three-clause
 * predicate into one bit:
 *
 *     a + 2b + 3c = a + c   (mod 2),   so oddParity(a,b,c)  <=>  a + c is odd.
 *     degenerate needs b odd AND either (a odd AND c odd), giving a + c EVEN,
 *                                  or (a == c),            giving a + c EVEN.
 *     Both branches force a + c even, i.e. NOT odd.  So degenerate => !oddParity, and
 *
 *         !oddParity OR degenerate  =  !oddParity  =  (a + c) even.
 *
 * Checked exhaustively over every triple with a,b,c <= 14 (3375 of them): the disjunct changes the
 * answer zero times, and no triple is both degenerate and odd.  This is NOT a correction to Part III
 * -- the rule as published is correct -- it is a reduction of it, and it is kept as a separate
 * function rather than folded into halfDomain so that the published form stays quotable and the two
 * can be tested against each other.
 *
 * Degeneracy is not thereby useless: it still decides where the tower pairs.  It is simply not
 * load-bearing for the search domain. */
export const halfDomainReduced = (a, b, c) => (a + c) % 2 === 0;
export const hostsGeneration = (a, b, c) => oddParity(a, b, c) && b >= 1 && a + b + c >= 3;
export const zeroModes = (a, b, c) => ((b + 1) * (a + c + 1)) / 2;

/* ---------------------------------------------------------------------------------------------
 * PART II's THREE GATES, separately.  `hostsGeneration` above is their conjunction; Part II is
 * the paper that NAMES them, and each clause is a different kind of statement:
 *
 *   centre   (a + 2b + 3c) odd   arithmetic -- the Z4 centre charge, Slansky's congruency class;
 *                                classical, inherited not invented (Part II section 2)
 *   middle   b >= 1              geometric  -- the middle node of the Dynkin diagram excited;
 *                                deleting it exposes SU(2)_L x SU(2)_R x U(1)_m (section 3)
 *   size     a + b + c >= 3      room for the cell {Q(2,1/6), u(1,2/3), d(1,-1/3)} to close
 *
 * and when all three pass, the chiral zero-mode count is the closed form N = (b+1)(a+c+1)/2 --
 * an integer there, because the centre gate forces a + c odd -- with the singlets spanning a
 * middle-node extent of exactly 12b.  Part II, abstract and eqs. (2)-(4).
 * ------------------------------------------------------------------------------------------- */
export const dimSU4 = (a, b, c) =>
  (a + 1) * (b + 1) * (c + 1) * (a + b + 2) * (b + c + 2) * (a + b + c + 3) / 12;

export function cellGates(a, b, c) {
  const centre = oddParity(a, b, c), middle = b >= 1, size = a + b + c >= 3;
  const admits = centre && middle && size;
  return {
    centre, middle, size, admits,
    failing: [!centre && "centre charge even", !middle && "b = 0", !size && "too small"]
      .filter(Boolean),
    N: admits ? zeroModes(a, b, c) : null,
    extent: 12 * b,
    dim: dimSU4(a, b, c),
  };
}

/* The smallest representation that passes the gates -- brute force over the labels, so that
 * Part I's headline (the 60 is minimal) is RECOVERED rather than quoted.  Labels to 8 suffice:
 * any single label of 9 already gives dimension 220. */
export function minimalAdmitting(maxLabel = 8) {
  let best = null;
  for (let a = 0; a <= maxLabel; a++)
    for (let b = 0; b <= maxLabel; b++)
      for (let c = 0; c <= maxLabel; c++) {
        if (!hostsGeneration(a, b, c)) continue;
        const d = dimSU4(a, b, c);
        if (!best || d < best.dim) best = { dim: d, labels: [[a, b, c]] };
        else if (d === best.dim) best.labels.push([a, b, c]);
      }
  return best;
}

export function repFacts(a, b, c) {
  const odd = oddParity(a, b, c), dg = degenerate(a, b, c), half = halfDomain(a, b, c);
  return {
    dynkin: [a, b, c],
    centre_charge: centreCharge(a, b, c),
    parity: odd ? "odd" : "even",
    degenerate: dg,
    half_domain: half,
    alpha2_region: half ? [0, 0.5] : [0, 1],
    tower_pairs_at: dg ? "both" : (odd ? "even m" : "odd m"),
    hosts_generation: hostsGeneration(a, b, c),
    zero_modes: Number.isInteger(zeroModes(a, b, c)) ? zeroModes(a, b, c) : null,
  };
}

/* ---------------------------------------------------------------------------------------------
 * THE RULE, PUT AT RISK.
 *
 * Everything above is arithmetic on (a,b,c) and could be self-consistently wrong.  What the rule
 * asserts about the world is that half the torus is redundant, and THAT is checkable by a
 * computation which knows nothing about Dynkin labels: if the half-domain is legal, the potential
 * must be invariant under alpha_2 -> 1 - alpha_2.
 *
 * The two computations share no line of code -- one reads three integers, the other sums windings
 * over a mode table.  So this is a real test and not a restatement, and it is written so that a
 * counterexample would be reported rather than absorbed.
 * ------------------------------------------------------------------------------------------- */

/* Max relative deviation of V between alpha_2 and 1 - alpha_2 over a grid that avoids the fixed
 * points (where the identity is trivial and would flatter the rule). */
export function reflectionDefect(sp, LATT, n = 7) {
  let worst = 0, scale = 0;
  for (let i = 0; i < n; i++)
    for (let j = 1; j < n; j++) {
      const a1 = i / n, a2 = j / (2 * n);            /* a2 in (0, 1/2): never 0 and never 1/2 */
      const x = V(sp, LATT, a1, a2), y = V(sp, LATT, a1, 1 - a2);
      worst = Math.max(worst, Math.abs(x - y));
      scale = Math.max(scale, Math.abs(x));
    }
  return scale > 0 ? worst / scale : 0;
}

/* Every representation in the catalogue, rule against engine.  Returns the two counts and, more
 * importantly, any representation where they disagree. */
export function sweepAll(data, tol = 1e-9) {
  const LATT = lattice(data.kmax), rows = [];
  for (const c of data.catalogue || []) {
    const d = data.reps_dynkin && data.reps_dynkin[c.name];
    if (!d) continue;
    const sp = spectrum([{ key: c.name, n: 1, eta: 1, role: 1 }], data);
    const half = halfDomain(d[0], d[1], d[2]);
    if (!sp.length) { rows.push({ rep: c.name, half, flat: true }); continue; }
    const defect = reflectionDefect(sp, LATT);
    rows.push({ rep: c.name, half, defect, symmetric: defect < tol });
  }
  const tested = rows.filter((r) => !r.flat);
  return {
    rows,
    tested: tested.length,
    symmetric: tested.filter((r) => r.symmetric).length,
    /* the only line that matters: where the rule and the engine disagree */
    disagreements: tested.filter((r) => r.half !== r.symmetric).map((r) => r.rep),
  };
}

const SRC = "Part III, as implemented in the published selection-rule tool";

export const selectionModule = (data) => ({
  id: "selection",
  provides: ["legal_domain", "rep_facts", "domain_check"],
  requires: [],

  compute({ model }) {
    /* The rule is a statement about Dynkin labels.  A data file whose representations are named but
     * not labelled cannot answer it, and saying so is the whole point of this capability. */
    const labelled = [], unlabelled = [];
    for (const b of model.bulk || []) {
      if (!b.multiplicity) continue;
      const d = data.reps_dynkin && data.reps_dynkin[b.rep];
      (d ? labelled : unlabelled).push(d ? { rep: b.rep, d } : b.rep);
    }

    if (unlabelled.length) {
      const why = `the data file for ${data.group} gives no Dynkin labels for ` +
                  `${[...new Set(unlabelled)].join(", ")}, and the selection rule is a statement ` +
                  `about (a,b,c) -- it cannot be answered for a representation named but not labelled`;
      return { legal_domain: unknown(why), rep_facts: unknown(why), domain_check: unknown(why) };
    }
    if (!labelled.length) {
      const why = "no bulk representation is present, so there is no selection rule to apply";
      return { legal_domain: unknown(why), rep_facts: unknown(why), domain_check: unknown(why) };
    }

    const facts = labelled.map(({ rep, d }) => ({ rep, ...repFacts(d[0], d[1], d[2]) }));
    const half = facts.every((f) => f.half_domain);

    /* The rule's own prediction, measured on this content. */
    let check;
    if (!data.reps_modes) {
      check = unknown(`the data file for ${data.group} carries no mode table, so the prediction ` +
                      `that half the torus is redundant cannot be tested here`);
    } else {
      const rows = labelled.map(({ rep }) => ({ key: rep, n: 1, eta: 1, role: 1 }));
      const sp = spectrum(rows, data);
      if (!sp.length) {
        check = unknown("every coefficient of this content cancels: the potential is flat, and a " +
                        "flat potential is symmetric under everything, so it tests nothing");
      } else {
        const defect = reflectionDefect(sp, lattice(data.kmax));
        const symmetric = defect < 1e-9;
        check = val({ defect, symmetric, predicted: half, agrees: symmetric === half }, {
          status: STATUS.MEASURED,
          source: "the potential evaluated at alpha_2 and 1 - alpha_2 on a grid avoiding the fixed " +
                  "points; this shares no code with the rule, which reads only (a,b,c)",
        });
      }
    }

    return {
      domain_check: check,
      rep_facts: val(facts, { status: STATUS.THEOREM, source: SRC }),
      legal_domain: val({
        alpha2: half ? [0, 0.5] : [0, 1],
        half_domain: half,
        blocked_by: half ? [] : facts.filter((f) => !f.half_domain).map((f) => f.rep),
      }, {
        status: STATUS.THEOREM,
        source: `${SRC}; for several representations the half-domain is the CONJUNCTION -- you may ` +
                `halve the search region only if every representation present allows it, and that ` +
                `composition is ours rather than a quoted statement`,
      }),
    };
  },
});

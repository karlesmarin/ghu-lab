/* samepot.mjs — the current model's place in Theorem 3: its five coordinates as a lattice point,
 * its canonical representative, and the kernel that connects the two.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The "same potential?" section compares TWO contents, and the second is view state of the
 * section; what belongs in the resolver -- and therefore in the exported result card -- is what
 * is true of THE model: its canonical five multiplicities (eq. (43)), the relations that produce
 * them (eq. (42)), and the arithmetic of the lattice they live on.  Statuses:
 *   theorem   the relations, the canonical representative, the index -- exact integer arithmetic
 *   nothing measured: no scale enters this module at all
 */

import { STATUS, val } from "../kernel/status.mjs";
import { kernelRelations, canonicalCounts, countsOf, matterFive, fiveOf, latticeIndex,
         CANON_TYPES } from "../kernel/canonical.mjs";

export const samepotModule = (data) => ({
  id: "samepot",
  provides: ["canonical"],
  requires: ["coords"],

  compute({ model, get }) {
    const rels = kernelRelations(data);
    const counts = countsOf(model.bulk);
    const N = canonicalCounts(counts, rels);
    const alreadyCanonical = CANON_TYPES.every((t) => (counts[t] || 0) === N[t]) &&
      Object.keys(counts).every((t) => CANON_TYPES.includes(t) || !counts[t]);
    const idx = latticeIndex(data);
    const arch = data.coordinates || {};
    return {
      canonical: val({
        relations: rels.map((r) => ({ lhs: r.lhs, rhs: r.rhs.map(([t, c]) => `${c}×${t}`) })),
        counts, canonical: N, alreadyCanonical,
        matter_five: matterFive(data, model.bulk || []),
        five: fiveOf(data, model.bulk || [], model.conventions || {}),
        index: idx,
        invariant_factors: arch.invariant_factors || null,
        index_matches_archive: arch.index ? idx === arch.index : null,
      }, {
        status: STATUS.THEOREM,
        source: "Part VII Thm 3 and eqs. (42)-(43): the kernel relations solved from this " +
                "engine's own term tables and verified on all five coordinates; the canonical " +
                "representative never leaves the physical cone; the index is |det| of the five " +
                "canonical generators, against the archived Smith form",
      }),
    };
  },
});

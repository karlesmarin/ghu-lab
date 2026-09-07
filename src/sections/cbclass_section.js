/* cbclass_section.js — "Conjugate boundary conditions": the section that is not built yet.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THIS FILE IS DELIBERATELY A REGISTRATION AND NOTHING ELSE.  It carries `ready: false`, which
 * registry.js's own header calls the honest state for a gap you can see: the section is LISTED
 * and the rail prints "not built yet" beside it, the footer counts it in the denominator of
 * "N of M sections built", and clicking it does nothing.  The full design is in
 * docs/DESIGN_CBCLASS.md and it is not summarised here, because a summary that drifts from the
 * design is worse than a pointer to it.
 *
 * WHY IT IS LISTED RATHER THAN WAITED FOR.  `bcclass` answers, for ordinary chiral orbifolding,
 * "which of these boundary conditions are the same theory?".  There is a second family in the
 * literature -- CONJUGATE boundary conditions, psi(y_i - y) = P_i psi^c(y_i + y) -- for which the
 * same question had no published answer, and the physics is actively using it.  Registering the
 * gap is the instrument saying what it does not do.
 *
 * WHAT HAS ARRIVED SINCE THE DESIGN WAS WRITTEN, and what has not.  The design's "order of work"
 * lists five steps; step 1 -- derive the relation -- is DONE, outside this repo, in
 * research/smeft_formalization/part_ix/cbc of the private working repo, with four gates and their
 * receipts.  The answers it returned:
 *
 *   - conjugate conditions are classified by a CONGRUENCE, P -> Omega P Omega^T, not a
 *     similarity, so by Autonne-Takagi the only invariant of an isolated fixed point is the
 *     SYMMETRY TYPE eps = +/-1 of the twist -- not its spectrum;
 *   - hence 4 classes for N even and 1 for N odd, FLAT IN N, against the ordinary (N+1)^2;
 *   - the MIXED classes (eps_0 != eps_1) break SU(N) to U(N/2), smaller than either pure branch,
 *     and they are exactly the ones the literature's P_0 = P_1 simplification cannot reach;
 *   - the one-loop Wilson potential of a conjugate multiplet is
 *         V = (3 / (32 pi^6 R^4)) sum_{k>=1} Re Tr[H^k] / k^5 ,   H = P_1 P_0^* W ,
 *     which reproduces Grzadkowski-Wudka hep-ph/0401232 eq. (14) -- it is THEIRS, checked against
 *     theirs -- and in a MIXED class every odd winding k vanishes, so V is the same functional on
 *     H^2 suppressed by 2^-5, blind to the centre element -1, and about 20 times smaller.
 *
 * SO WHY IS THIS STILL `ready: false`?  Because the design's own gate has not been met, and it is
 * the gate this repo exists to keep:
 *
 *   - step 2, "enumerate and orbit, TWO INDEPENDENT ROUTES, in src/modules/cbclass.mjs +
 *     _test_cbclass.mjs", has not been written.  There is no module and no harness.
 *   - the whole count rests on taking Omega(0) and Omega(pi R) INDEPENDENT for a conjugate
 *     condition.  That is what the ordinary treatment does; it is NOT verified for this one, and
 *     it remains an OPEN QUESTION.  Until it is settled the count is conditional on it, and this
 *     panel would be shipping a number whose hypothesis is unchecked.
 *   - the period-halving is FRONTIER, not NOVEL: Grzadkowski-Wudka hep-ph/0401232 and
 *     hep-ph/0501238 and Abe-Adachi-Fujimoto arXiv:2607.11150 were read in full and do not have
 *     it, but Takenaga, Kubo-Lim-Yamashita and the wider Hosotani literature were not swept.
 *
 * A panel that shipped these numbers today would be the tool telling its first lie -- the design
 * document's own words, and they still hold.  The line moves to `ready: true` when there is a
 * module, a harness that checks it against a route that is not the panel's own, and an answer to
 * the independence question.
 */
const CBC_SECTION = {
  id: "cbclass",
  label: "Conjugate boundary conditions",
  paper: "Grzadkowski–Wudka 2005 · Abe–Adachi–Fujimoto 2026",
  ready: false,
  /* NO `modules` KEY, and that is a gate's ruling rather than a style choice.  `_test_app.mjs`
   * check "no UNBUILT section smuggles in modules" asks for `!s.modules`, and `[]` is truthy in
   * JavaScript, so `modules: []` fails it.  It is right to: a section that computes nothing should
   * not declare a resolver contract at all.  This is the first section that ever gave that check
   * a real subject -- until now it ranged over an empty set. */
};

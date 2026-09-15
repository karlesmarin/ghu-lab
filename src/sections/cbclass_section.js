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
 *   - the MIXED classes (eps_0 != eps_1) break SU(N) to U(N/2) -- AND THAT SENTENCE NEEDED ITS
 *     POSITION, which it did not have until 2026-09-15.  U(N/2) is the COMPATIBLE stratum, which
 *     has measure zero.  At a generic relative position the unbroken group is only U(1)^{N/2}:
 *     measured dim 4 -> 2 for N = 4 and 9 -> 3 for N = 6, with the drop already complete at
 *     t = 1e-4 along a unitary interpolation, and the PURE label falling further still, SO(N) to
 *     trivial.  So the unbroken group is NOT a function of the label -- which is the same headline
 *     `bcclass` carries, reached here by a different route, and the reason `cbcUnbroken` returns
 *     two strata instead of one group.  (`cbc_unbroken_gate.py`, calibrated against dim so(N) and
 *     dim sp(N/2) before being believed.)  They are still exactly the classes the literature's
 *     P_0 = P_1 simplification cannot reach;
 *   - the one-loop Wilson potential of a conjugate multiplet is
 *         V = (3 / (32 pi^6 R^4)) sum_{k>=1} Re Tr[H^k] / k^5 ,   H = P_1 P_0^* W ,
 *     which reproduces Grzadkowski-Wudka hep-ph/0401232 eq. (14) -- it is THEIRS, checked against
 *     theirs -- and in a MIXED class every odd winding k vanishes, so V is the same functional on
 *     H^2 suppressed by 2^-5, blind to the centre element -1, and about 20 times smaller.
 *
 * SO WHY IS THIS STILL `ready: false`?  Because the design's own gate has not been met, and it is
 * the gate this repo exists to keep:
 *
 *   - ~~step 2 has not been written~~ **DONE 2026-09-15**: `src/modules/cbclass.mjs` and
 *     `_test_cbclass.mjs` exist, 38 ok / 0 failed, the harness being floating-point linear algebra
 *     over random unitaries that shares no line with the module's exact combinatorics.  But the
 *     design's "enumerate and orbit" DOES NOT TRANSFER, and there is a theorem for why: congruence
 *     uses Omega twice, so the action reaches only squares, mu_n^2 = mu_{n/2}, and no finite group
 *     of roots of unity is square-closed.  Measured: mu_2 and mu_4 give 5 and 5 orbits at N = 2,
 *     unchanged -- the null that killed the first explanation written for it (Sylvester's law of
 *     inertia, which predicted the count would collapse when i was added).
 *   - the whole count rests on taking Omega(0) and Omega(pi R) INDEPENDENT for a conjugate
 *     condition.  **The ordinary argument for that has now been measured, and it DOES NOT
 *     TRANSFER** (`cbc_absorption_gate.py`).  The ordinary case may take them independent because
 *     the Wilson line absorbs the relative gauge transformation -- the Hosotani mechanism.  The
 *     dimension count says the conjugate Wilson line cannot:
 *         relative positions with the label fixed   N(N-1)/2  =  1,  6, 15   (N = 2, 4, 6)
 *         surviving zero modes                      N/2       =  1,  2,  3
 *     so 2 < 6 and 3 < 15, with N = 2 the exact boundary case where 1 = 1 and it does absorb.
 *     This does NOT show the count of 4 is false.  It removes the only reason that was being
 *     assumed for it -- which makes the panel's hypothesis MORE conditional, not less.
 *   - the period-halving is FRONTIER, not NOVEL: Grzadkowski-Wudka hep-ph/0401232 and
 *     hep-ph/0501238 and Abe-Adachi-Fujimoto arXiv:2607.11150 were read in full and do not have
 *     it.  **The sweep the earlier version of this header declared missing is now DONE**, and the
 *     empty intersection is measured across twenty-four years of the literature:
 *         Abe-Goto-Kawamura-Nishikawa 1608.06393      "conjugate" 5   "equivalence class"  0
 *         Kawamura-Miura 0905.4123                                0                       34
 *         Kawamura-Kinami-Miura 0808.2333                         0                       25
 *         Haba-Harada-Hosotani-Kawamura hep-ph/0212035            0                       24
 *         Kubo-Lim-Yamashita hep-ph/0111327                       0                        0
 *         Takeuchi-Inagaki 2404.19411 / 2501.05849                0                    10 / 9
 *         Kojima-Takenaga-Yamashita 1103.1234                     0                        0
 *     Nobody has taken the quotient of the conjugate ones, and the programme is not dormant --
 *     Takeuchi-Inagaki were still classifying in 2025.  YOSHIHARU KAWAMURA IS AN AUTHOR OF THREE
 *     OF THE EQUIVALENCE-CLASS PAPERS AND OF THE CONJUGATE ONE: he holds both halves of the empty
 *     intersection and did not join them.  And 0808.2333's own abstract says the gauge equivalence
 *     "is understood by the Hosotani mechanism" -- the argument this repo just measured as not
 *     transferring.
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

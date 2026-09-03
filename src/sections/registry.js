/* registry.js — the list of sections, and the only place a new one is named.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Adding a section is a file in src/sections/ and a line here.  That was the promise of DESIGN.md
 * D3 and D6; this file is where it is either kept or broken.
 *
 * Sections that do not exist yet are LISTED, not hidden.  The shape of the instrument is part of
 * what it tells you, and a gap you can see is honest where an absence is not.
 */
/* Every section names the GROUP it works on.  The instrument holds one model per group, and the
 * rail is grouped by family: within a family the model is untouched when you switch section, and
 * across families you are moving to a different model -- which is stated rather than hidden,
 * because a model cannot travel between groups and pretending otherwise would be a lie. */
const SECTIONS = [
  { ...HIERARCHY_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  /* the same map as HIERARCHY, run backwards, and then counted: they sit next to it on purpose */
  { ...INVERSE_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...CENSUS_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...ATLAS_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SAMEPOT_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...ANOMALIES_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...ESCAPE_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...MULTIPLETS_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SCREEN_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...COLLIDER_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SELECTION_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...CALCULATOR_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...ETA_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...FIVED_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* THE SAME PAPER'S GENERAL FORMULA, where the model is the INPUT rather than the subject.  It
   * sits in this family because §5 is the section §3 is an example of; the family lost its "SU(3)"
   * because the family no longer is one, and the builder declares `holds()` so the header names
   * the group the reader typed instead of the one the shell is carrying. */
  { ...SUN5D_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* the same model the builder holds, read the other way: not its dynamics but its CONTENT.  It
   * shares the builder's state on purpose -- one model, two views. */
  { ...SPEC5D_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* and the gate that content has to pass.  Same shared model: one model, three views. */
  { ...ANOM5D_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* and where that gate's bill is PAID.  The anomaly panel ends by saying a non-zero row is not a
   * verdict, because brane fermions pay into the same channels; this one puts them there and holds
   * the same fields to Part I's boundary-mass gate at the same time.  Fourth view of one model. */
  { ...BRANE_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* and the four of them CHAINED, walking the space instead of answering about one model.  It
   * writes into the same shared model, so a hit found here lands in the builder and the other
   * three panels read it: the loop closes rather than ending in a list. */
  { ...SWEEP5D_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* and the five of them JOINED on one model rather than chained over a space.  It is the only
   * section whose subject is the other sections' answers: it recomputes each of them on every
   * gauge-equivalent boundary condition and reports which survived, because most do not.  It sits
   * last in this family because it is what you read after the other four have spoken. */
  { ...DOSS_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* and the same model turned into the numbers a detector measures, beside the measured ones.
   * It reads the builder's model and nothing else; it draws predicted masses and published
   * bounds and never a simulated event. */
  { ...PRED_SECTION, group: "su3_hy", family: "5D on S¹/Z₂ · Haba–Yamashita" },
  /* A family of its own, because it is about neither a model nor a dimension: it is about which
   * BOUNDARY CONDITIONS are the same theory, on S¹/Z₂ and on T²/Z₃.  Like the builder it holds
   * its own model and takes nothing from the shell. */
  { ...BCC_SECTION, group: "su3_hy", family: "Orbifold boundary conditions" },
  /* The same family, and the same question asked one level up: bcclass WALKS the orbits, on the
   * two orbifolds where the classification is settled and over SU(N) only.  This one DERIVES the
   * classification from the rotation matrix — signature, alphabet, local data, count and degree,
   * over all three real forms and at any rank — so it is the engine that section is an instance
   * of.  They sit together on purpose: one shows the orbits, the other shows why there are that
   * many of them. */
  { ...ORBIFOLD_SECTION, group: "su3_hy", family: "Orbifold boundary conditions" },
  /* And the other half of Part IX: IX-A says which letters exist, IX-B which relations
   * hold among them.  It is mostly an attribution service -- the configuration usually
   * already has a name and a published table -- plus the walk that shows whether a
   * proposed move set actually reaches every member of a class. */
  { ...RELATIONS_SECTION, group: "su3_hy", family: "Orbifold boundary conditions" },
  /* A DEMONSTRATION RATHER THAN A MODEL.  It holds its own dial, carries its own permalink, and
   * exists to show what the machinery does and why the answer can be believed -- so it sits in a
   * family of its own rather than pretending to be one of the three models. */
  { ...BLKT_SECTION, group: "su3_hy", family: "Brane-localized kinetic terms" },
  /* NOT A MODEL AND NOT ABOUT ONE.  The census is about the literature: which papers publish the
   * triple a comparison needs, and how few do.  Its own family, at the end, because it is the only
   * section whose subject is the field rather than a theory in it. */
  { ...CENSUS_LIT_SECTION, group: "su3_hy", family: "The literature" },
];

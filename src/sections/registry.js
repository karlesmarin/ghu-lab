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
  /* A family of its own, because it is about neither a model nor a dimension: it is about which
   * BOUNDARY CONDITIONS are the same theory, on S¹/Z₂ and on T²/Z₃.  Like the builder it holds
   * its own model and takes nothing from the shell. */
  { ...BCC_SECTION, group: "su3_hy", family: "Orbifold boundary conditions" },
];

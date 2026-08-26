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
  { ...ATLAS_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SAMEPOT_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...ANOMALIES_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...ESCAPE_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SCREEN_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...COLLIDER_SECTION, group: "su7_km25", family: "SU(7) · Komori-Maru" },
  { ...SELECTION_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...CALCULATOR_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...ETA_SECTION, group: "su4_ahmn", family: "SU(4) · AHMN" },
  { ...FIVED_SECTION, group: "su3_hy", family: "SU(3) · Haba–Yamashita · 5D" },
];

/* screen.mjs (module) — the K screen's ground truth, carried into the resolver and the card.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The screens themselves run on a FOREIGN row, which is view state of the section; what belongs
 * in the resolver is what is model-independent and archived: the constant K/g4, Part VI's five
 * rows evaluated at their own published alpha, and the engine's own recomputation of the
 * constant -- so the exported card carries the whole basis of the screen, with provenance.
 */

import { STATUS, val, unknown } from "../kernel/status.mjs";
import { kOverG4 } from "../kernel/screens.mjs";

export const screenModule = (data) => ({
  id: "screen",
  provides: ["screen"],
  requires: [],

  compute({ model }) {
    if (!data.screen)
      return { screen: unknown("this group's data carries no K-screen archive") };
    const mW = (model.conventions || {}).m_W;
    const engine = kOverG4(mW);
    return {
      screen: val({
        K_over_g4: data.screen.K_over_g4,
        K_over_g4_engine: engine,
        agrees: Math.abs(engine - data.screen.K_over_g4) < 1e-12,
        at_theirs: data.screen.at_theirs,
      }, {
        status: STATUS.VERIFIED,
        source: data.screen.source,
      }),
    };
  },
});

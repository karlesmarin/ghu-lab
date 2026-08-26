/* _test_collider.mjs — the dictionary, the form factor and the ratios, held to their archives.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * Everything the collider section draws is either recomputed here against an archived run --
 * collider_dictionary.py's branch table, kk_resummation.py's EFT coefficient, width-shift and
 * closed-form ratio table -- or QUOTED from the published record and pinned to the data file's
 * copy of it.  The identities themselves get their own controls: the running returns its input
 * at M_Z, coth's expansion returns the contact coefficient, the two branches of F agree where
 * they meet, and the poles sit at the integers.
 *
 *   node _test_collider.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { modules } from "./src/modules/hierarchy.mjs";
import { alphasRun, coloronOf, lambda8Of, formFactorSpace, formFactorTime, chiRatio,
         colliderModule } from "./src/modules/collider.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const C = DATA.collider;

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

H("the running, and the dictionary rows of collider_dictionary.py");
ok("alpha_s returns its input at M_Z -- the archived script's own C8",
   Math.abs(alphasRun(91.1876) - 0.118) < 1e-12);
for (const b of C.branches) {
  const c = coloronOf(b.invR5_TeV * 1000);
  ok(`${b.name}: alpha_s ${b.alphas}, Gamma/M ${b.GoverM}, Gamma ${b.Gamma_GeV} GeV`,
     Math.abs(c.alphas - b.alphas) < 5e-5 && Math.abs(c.GoverM - b.GoverM) < 1e-3 &&
     Math.abs(c.Gamma_GeV - b.Gamma_GeV) < 1.0,
     `${c.alphas.toFixed(4)} ${c.GoverM.toFixed(3)} ${c.Gamma_GeV.toFixed(0)}`);
}

H("Lambda_8 against the paper's printed pair");
ok(`escape branch: ${C.lambda8_TeV.escape} TeV`,
   Math.abs(lambda8Of(3970) / 1000 - C.lambda8_TeV.escape) < 0.005,
   (lambda8Of(3970) / 1000).toFixed(3));
ok(`measured-m_h ceiling: ${C.lambda8_TeV.measured_mh} TeV`,
   Math.abs(lambda8Of(9090) / 1000 - C.lambda8_TeV.measured_mh) < 0.005,
   (lambda8Of(9090) / 1000).toFixed(3));

H("the form factor's own identities");
ok("F -> 1 as q -> 0, from both sides",
   Math.abs(formFactorSpace(1e-8) - 1) < 1e-6 && Math.abs(formFactorTime(1e-8) - 1) < 1e-6);
ok("the small-a expansion is 1 + pi^2 a^2 / 3 -- the contact operator is the first term",
   rel(formFactorSpace(0.01) - 1, Math.PI ** 2 * 1e-4 / 3) < 1e-3);
ok("the archived EFT coefficient is -pi^2 R5^2 / 3 at 3.97 TeV",
   rel(-(Math.PI ** 2 / 3) / C.resummation.invR5_used_TeV ** 2, C.resummation.eft_coefficient) < 1e-12);
ok("the withdrawn width shift tends to 1/(1+(2 alpha_s)^2) -- the giveaway, archived",
   rel(1 / (1 + (2 * 0.0789) ** 2), C.resummation.width_shift_at_zero) < 1e-3,
   String(1 / (1 + (2 * 0.0789) ** 2)));
ok("the timelike branch diverges at the integers -- the resonances are the poles",
   Math.abs(formFactorTime(0.999)) > 300 && Math.abs(formFactorTime(1.999)) > 600);
ok("coth and cot agree through zero: F(a -> 0+) = F(b -> 0+)",
   rel(formFactorSpace(1e-4), formFactorTime(1e-4)) < 1e-6);

H("the closed-form chi ratios against kk_resummation.py's archive");
{
  let bad = 0, n = 0;
  for (const [mjj, cols] of Object.entries(C.resummation.ratios_chi_1p5))
    for (const [invR5, want] of Object.entries(cols)) {
      n++;
      if (rel(chiRatio(parseFloat(mjj), 1.5, parseFloat(invR5)), want) > 1e-9) bad++;
    }
  ok(`all ${n} archived ratio values reproduced to 1e-9`, bad === 0 && n === 10, `${bad} off of ${n}`);
}
ok("the ratio grows with M_jj and falls with chi -- the deep-|t| corner bites hardest",
   chiRatio(6.5, 1.5, 3.97) > chiRatio(3.3, 1.5, 3.97) &&
   chiRatio(3.3, 1.5, 3.97) > chiRatio(3.3, 16, 3.97));

H("the quoted teeth are pinned to the record");
ok("min Dchi2 12.0 at 10.03 TeV against 3.84; next 244; half-quantum -6.0 at 14.19",
   C.teeth.min_dchi2 === 12.0 && C.teeth.at_TeV === 10.03 && C.teeth.threshold === 3.84 &&
   C.teeth.next_tooth_dchi2 === 244 && C.teeth.half_quantum.dchi2 === -6.0 &&
   C.teeth.half_quantum.TeV === 14.19);
ok("and the source says QUOTED -- the profiling recipe is not re-derived here",
   /QUOTED/.test(C.teeth.source));
ok("the bins are the recast's own grid: 7 masses x 11 chi",
   C.bins.mjj_TeV.length === 7 && C.bins.chi.length === 11);

H("the module, through the resolver");
{
  const MODS = [...modules(DATA), colliderModule(DATA)];
  const mk = (bulk) => complete({ ...emptyModel(), group: DATA.group,
                                  orbifold: { name: DATA.orbifold.name }, bulk }).model;
  const v = resolve(MODS, mk(DATA.published_rows[1].bulk)).values;
  const d = v.get("dijet");
  ok("dijet is measured -- it hangs on 1/R5, which carries the anchor band",
     d.status === STATUS.MEASURED);
  ok("its mass IS the resolver's own 1/R5",
     d.value.M_GeV === v.get("invR5").value);
  ok("Gamma/M near 0.15 at a 9-TeV-scale row, and the coupling ratio is sqrt 2",
     Math.abs(d.value.GoverM - 0.15) < 0.02 && d.value.coupling_ratio === Math.SQRT2);
  const un = resolve(MODS, mk([{ rep: "7", parities: [1, 1], multiplicity: 1 }])).values.get("dijet");
  ok("no breaking, no dictionary: the resolver propagates the unknown with its cause",
     un.status === "unknown" && /invR5/.test(un.reason), un.reason);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

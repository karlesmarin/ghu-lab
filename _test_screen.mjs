/* _test_screen.mjs — the three screens, held to Part VI's archive and to the paper's own numbers.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * screens.mjs sums the same series su7_anchor_mh.py sums, term-wise derivatives included, so the
 * K screen must reproduce that archive to float precision -- not "about".  The comb is identity
 * (II) crossed with the mod-6 law, so every tooth must agree with surfaceInvR5, every per-rung
 * ceiling must sit ON a tooth, and the two spacings the paper prints (0.42 TeV^2 at k = 1,
 * 0.039 at k = 11, 21 GeV at the k = 1 ceiling) must come back out.
 *
 *   node _test_screen.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { modules } from "./src/modules/hierarchy.mjs";
import { screenModule } from "./src/modules/screen.mjs";
import { termTable, surfaceInvR5, F } from "./src/kernel/potential.mjs";
import { dF, kOverG4, screenK, screenLaws, combMu, combM2, combSpacingM2, combA4, combMatch }
  from "./src/kernel/screens.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const ARCH = DATA.screen;

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

const CONV = complete({ ...emptyModel(), group: DATA.group,
                        orbifold: { name: DATA.orbifold.name }, bulk: [] }).model.conventions;
const MW = CONV.m_W, G4 = CONV.g4, MH_TOP = CONV.mh_window[1];
const modelOf = (bulk) => complete({ ...emptyModel(), group: DATA.group,
                                     orbifold: { name: DATA.orbifold.name }, bulk }).model;

H("the derivative is the archive's own series");
{
  /* dF at d = 0 must BE F -- the derivative code re-implements the sum, so hold them together */
  const t = termTable(modelOf(DATA.published_rows[1].bulk), DATA);
  ok("dF(terms, a, 0) is F(terms, a), on three phases",
     [0.02, 0.081, 0.3].every((a) => rel(dF(t, a, 0), F(t, a)) < 1e-12));
  /* and d = 1, 2 against central differences of F itself -- an independent route.  h = 1e-4:
   * smaller and the SECOND difference drowns in roundoff (eps/h^2 = 1e-4 absolute at 1e-6,
   * which is exactly how this check first failed against a derivative the archive confirms
   * to 1e-9); larger and the truncation term h^2 F'''' / 12 surfaces instead. */
  const h = 1e-4;
  for (const a of [0.05, 0.081]) {
    ok(`dF d=1 at ${a} agrees with the central difference of F`,
       rel(dF(t, a, 1), (F(t, a + h) - F(t, a - h)) / (2 * h)) < 2e-4);
    ok(`dF d=2 at ${a} agrees with the central second difference of F`,
       rel(dF(t, a, 2), (F(t, a + h) - 2 * F(t, a) + F(t, a - h)) / (h * h)) < 2e-4);
  }
}

H("the K screen against su7_anchor_mh.py's archived run, row by row");
ok("the constant: 2 m_W sqrt(3/(16 pi^6)) is the archive's 2.245624...",
   rel(kOverG4(MW), ARCH.K_over_g4) < 1e-12, kOverG4(MW).toPrecision(12));
for (let i = 0; i < DATA.published_rows.length; i++) {
  const row = DATA.published_rows[i], a = ARCH.at_theirs[i];
  const t = termTable(modelOf(row.bulk), DATA);
  const F2 = dF(t, a.a_theirs, 2), F1 = dF(t, a.a_theirs, 1);
  ok(`${a.case} · F'' and F' at their alpha reproduce the archive`,
     rel(F2, a.F2) < 1e-9 && rel(F1, a.F1) < 1e-9, `${F2} vs ${a.F2}`);
  const kv = screenK({ alpha: a.a_theirs, mh: a.mh, F2, mW: MW });
  if (a.K === null)
    ok(`${a.case} · F'' < 0: no K exists, and the screen says so`,
       F2 < 0 && kv.K === null && kv.implied_g4 === null);
  else
    ok(`${a.case} · K = ${a.K.toFixed(5)}, implied g4 = ${a.g4.toFixed(5)}`,
       rel(kv.K, a.K) < 1e-9 && rel(kv.implied_g4, a.g4) < 1e-9);
}
ok("the verdicts the section prints: (1),(2),(5) near 0.6; (4) implies 1.87; (3) has no K",
   [0, 1, 4].every((i) => Math.abs(ARCH.at_theirs[i].g4 - 0.61) < 0.02) &&
   ARCH.at_theirs[3].g4 > 1.8 && ARCH.at_theirs[2].K === null);

H("the laws, on the five rows' own integers");
for (const row of DATA.published_rows) {
  const L = screenLaws(row.ours.D8, 2 * row.ours.A4);
  ok(`${row.label} · (8D, A4) = (${row.ours.D8}, ${row.ours.A4}) passes mod 6 and is odd`,
     L.mod6 && L.kOdd && L.A4integral);
}
ok("a row one off in A4 fails the mod-6 law", !screenLaws(29, 2 * 272).mod6);
ok("the candidate-seed shape passes too: k even, A4 half-integral, k - 2A4 = 3 (mod 6)",
   (() => { const L = screenLaws(38, 2 * 278.5); return L.mod6 && !L.kOdd && !L.A4integral; })());

H("the comb is identity (II): teeth, ceilings and spacings");
const MU = combMu(MH_TOP, MW, G4);
ok("a tooth is surfaceInvR5, exactly",
   [[1, 215], [3, 336], [29, 271]].every(([k, A4]) =>
     rel(Math.sqrt(combM2(A4, k, MU, MW)), surfaceInvR5({ A4, D8: k }, MH_TOP, MW, G4)) < 1e-12));
const PER = DATA.ceilings.per_rung;
ok("every per-rung ceiling sits ON a tooth of its own rung: its A4 is admissible",
   PER.every((p) => {
     const j = (p.A4 - (p["8D"] - 3) / 2) / 3;
     return Number.isInteger(j) && combA4(p["8D"], j) === p.A4;
   }));
ok("and identity (II) at each (A4, k) returns the archived GeV, all fifteen rungs",
   PER.every((p) => rel(Math.sqrt(combM2(p.A4, p["8D"], MU, MW)), p.GeV) < 2e-3),
   PER.map((p) => `${p["8D"]}:${Math.round(Math.sqrt(combM2(p.A4, p["8D"], MU, MW)))}v${p.GeV}`).join(" "));
ok("the per-rung ceiling is monotone decreasing in k -- what lets the section bound an " +
   "uncertified rung by the certified one below it",
   PER.every((p, i) => i === 0 || (p["8D"] > PER[i - 1]["8D"] && p.GeV < PER[i - 1].GeV)));
ok("the spacing is exact: M2(A4+3) - M2(A4) = 8 pi^2 mW^2 / (zeta3 k)",
   [1, 3, 21].every((k) => rel(combM2(10 + 3, k, MU, MW) - combM2(10, k, MU, MW),
                               combSpacingM2(k, MW)) < 1e-9));
ok("the paper's printed numbers come back: 0.42 TeV^2 at k = 1 and 0.039 at k = 11",
   (combSpacingM2(1, MW) / 1e6).toFixed(2) === "0.42" &&
   (combSpacingM2(11, MW) / 1e6).toFixed(3) === "0.039");
ok("and 21 GeV in mass at the k = 1 ceiling",
   Math.round(combSpacingM2(1, MW) / (2 * PER[0].GeV)) === 21);

H("combMatch: a positive, a negative, and the admissibility of every hit");
{
  const hit = combMatch({ MKK: PER[0].GeV, tolGeV: 2, mh: MH_TOP, mW: MW, g4: G4 });
  ok("the k = 1 ceiling itself is found at (1, 215)",
     hit.some((x) => x.k === 1 && x.A4 === 215), JSON.stringify(hit));
  ok("every hit is admissible: k - 2 A4 = 3 (mod 6), A4 > 0",
     hit.every((x) => screenLaws(x.k, 2 * x.A4).mod6 && x.A4 > 0));
  const miss = combMatch({ MKK: PER[0].GeV + 10, tolGeV: 1, mh: MH_TOP, mW: MW, g4: G4, kmax: 1 });
  ok("ten GeV off the tooth with a one-GeV tolerance, k = 1 only: no hit",
     miss.length === 0, JSON.stringify(miss));
  const even = combMatch({ MKK: 9000, tolGeV: 400, mh: MH_TOP, mW: MW, g4: G4, kmax: 4, parity: "even" });
  ok("on the candidate parity the hits carry half-integral A4 and still obey the law",
     even.length > 0 && even.every((x) => x.k % 2 === 0 && !Number.isInteger(x.A4) &&
                                          screenLaws(x.k, 2 * x.A4).mod6));
}

H("the module, through the resolver");
{
  const MODS = [...modules(DATA), screenModule(DATA)];
  const v = resolve(MODS, modelOf(DATA.published_rows[1].bulk)).values;
  const s = v.get("screen");
  ok("screen is verified, and the engine agrees with the archive on the constant",
     s.status === STATUS.VERIFIED && s.value.agrees === true);
  ok("the card carries the five archived rows, NaN as null",
     s.value.at_theirs.length === 5 && s.value.at_theirs[2].K === null);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

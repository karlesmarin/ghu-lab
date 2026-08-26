/* _test_fived.mjs — the Haba-Yamashita group, held to its archived prediction bank.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * data/su3_hy.json is extracted from hy_predictions.py; this harness closes the loop by holding
 * the kernel to that script's ARCHIVED OUTPUT: sixty bank rows of (content, alpha, D, A4, F''),
 * the pure-gauge control the paper prints (D = -9), the marginal trio of section 11 (8D = 0
 * from one adjoint (+) and two fundamentals (-)), the blind direction, and the parity statement
 * that no content of this class reaches an odd 8D.
 *
 *   node _test_fived.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { moments, alphaMin, curvatureAtMin, numericMin } from "./src/kernel/potential.mjs";
import { counts5d, terms5d, towerPhi, spectrum5d, fivedModule } from "./src/modules/fived.mjs";
import { dF as dF5 } from "./src/kernel/screens.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su3_hy.json", import.meta.url), "utf8"));

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));
const T = (counts) => terms5d(DATA, { Nap: 0, Nam: 0, Nfp: 0, Nfm: 0, Nsp: 0, Nsm: 0, ...counts });

H("the controls the paper prints");
{
  const t = T({});
  ok("pure gauge is [(-1.5,+,2), (0,-,2), (-3,+,1), (0,-,1)] -- their eq. (3.20) at zero matter",
     JSON.stringify(t) === "[[-1.5,1,2],[0,-1,2],[-3,1,1],[0,-1,1]]", JSON.stringify(t));
  ok("and D = -9: the gauge sector alone never breaks the symmetry",
     moments(t).D === -9, String(moments(t).D));
}
{
  /* section 11's marginal trio: one adjoint (+), two fundamentals (-) */
  const mo = moments(T({ Nap: 1, Nfm: 2 }));
  ok("the marginal trio: A2 = 3, B2 = 4, 8D = 0 exactly",
     mo.A2 === 3 && mo.B2 === 4 && 8 * mo.D === 0, `${mo.A2} ${mo.B2} ${8 * mo.D}`);
}

H("the blind direction -- Part V's class in a second model");
{
  const key = (t) => JSON.stringify(t);
  const base = { Nap: 2, Nam: 1, Nfp: 1, Nfm: 2, Nsp: 0, Nsm: 1 };
  ok("(Nf, Ns) -> (Nf+1, Ns+2) leaves the table identical, at either parity",
     key(T(base)) === key(T({ ...base, Nfp: base.Nfp + 1, Nsp: base.Nsp + 2 })) &&
     key(T(base)) === key(T({ ...base, Nfm: base.Nfm + 1, Nsm: base.Nsm + 2 })));
  ok("...and a LOPSIDED step does not: (Nf+1, Ns+1) moves the table",
     key(T(base)) !== key(T({ ...base, Nfp: base.Nfp + 1, Nsp: base.Nsp + 1 })));
}

H("no odd 8D in this class -- every content up to two of each species");
{
  let odd = 0, nonint = 0, n = 0;
  for (let a = 0; a <= 2; a++) for (let b = 0; b <= 2; b++) for (let c = 0; c <= 2; c++)
    for (let d = 0; d <= 2; d++) for (let e = 0; e <= 2; e++) for (let f = 0; f <= 2; f++) {
      n++;
      const D8 = 8 * moments(T({ Nap: a, Nam: b, Nfp: c, Nfm: d, Nsp: e, Nsm: f })).D;
      if (!Number.isInteger(D8)) nonint++;
      else if (((D8 % 2) + 2) % 2 === 1) odd++;
    }
  ok(`8D is an even integer on all ${n} contents swept`, odd === 0 && nonint === 0,
     `${odd} odd, ${nonint} non-integer`);
}

H("the sixty archived bank rows, re-derived");
{
  let aBad = 0, dBad = 0, fBad = 0, worstA = 0;
  for (const row of DATA.bank) {
    const mo = moments(T(row.content));
    if (mo.D !== row.D || mo.A4 !== row.A4) dBad++;
    const a = alphaMin(mo);
    if (a === null) { aBad++; continue; }
    const ra = rel(a, row.alpha);
    if (ra > worstA) worstA = ra;
    if (ra > 1e-9) aBad++;
    if (rel(curvatureAtMin(mo, a), row.Fpp) > 1e-9) fBad++;
  }
  ok(`D and A4 exact on all ${DATA.bank.length}`, dBad === 0, `${dBad} off`);
  ok(`alpha_min to 1e-9 on all (worst ${worstA.toExponential(1)})`, aBad === 0, `${aBad} off`);
  ok("and F'' at the minimum to 1e-9", fBad === 0, `${fBad} off`);
}
{
  /* the closed form against direct minimisation, on three bank rows -- independent route */
  let bad = 0;
  for (const row of DATA.bank.filter((_, i) => i % 25 === 0)) {
    const t = T(row.content);
    const num = numericMin(t, { n: 1500, refine: 40, windings: 400 });
    if (num === null || rel(row.alpha, num) > 2e-3) bad++;
  }
  ok("the numeric minimum agrees with the archived closed form on sampled rows", bad === 0);
}

H("the spectrum offsets are the table's own phases");
ok("phi = (c alpha - delta)/2: c=2 periodic at alpha, c=1 antiperiodic at (alpha-1)/2",
   towerPhi(2, 1, 0.1) === 0.1 && towerPhi(1, -1, 0.1) === (0.1 - 1) / 2);
ok("a periodic neutral tower has a massless mode; an antiperiodic one sits at 1/2",
   spectrum5d(0.1).find((t) => t.c === 0 && t.s > 0).levels[0] === 0 &&
   spectrum5d(0.1).find((t) => t.c === 0 && t.s < 0).levels[0] === 0.5);

H("the second anchor -- vGIQ's four published numbers, against the archive");
{
  const V5 = DATA.vgiq;
  ok("the charges are the archived generators': SU(2) adj = (-2, 0, 2), their own footnote",
     V5.charges["SU(2)"].adj.join() === "-2,0,2" && V5.charges["SU(3)"].fund.join() === "-1,0,1");
  for (const r of V5.critical_nf) {
    const c = V5.charges[r.group];
    ok(`${r.group} ${r.rep}: N_f critical = 3 C_G / (4 C_R) = ${r.nf_ours}, theirs ${r.nf_theirs}`,
       Math.abs(3 * c.CG / (4 * (r.rep === "adj" ? c.CG : c.CR)) - r.nf_ours) < 1e-12 &&
       r.nf_ours === r.nf_theirs);
  }
  const termsOf = (g) => {
    const byC = {};
    for (const c of V5.charges[g].adj.filter((x) => x > 0)) byC[c] = (byC[c] || 0) + 1;
    return Object.entries(byC).map(([c, m]) => [m, 1, +c]);
  };
  const w2 = numericMin(termsOf("SU(2)")) / 2, w3 = numericMin(termsOf("SU(3)")) / 2;
  ok("the SU(2) adjoint minimum is 1/4 exactly -- and matches their printed 0.25",
     Math.abs(w2 - 0.25) < 1e-5 && V5.minima_theirs["SU(2)"] === 0.25 &&
     Math.abs(V5.minima_ours["SU(2)"] - 0.25) < 1e-12);
  ok("the SU(3) adjoint minimum is 1/3 exactly -- against their printed 0.29, kept UNRESOLVED",
     Math.abs(w3 - 1 / 3) < 1e-5 && Math.abs(V5.minima_ours["SU(3)"] - 1 / 3) < 1e-12 &&
     V5.minima_theirs["SU(3)"] === 0.29 && /not claimed|UNRESOLVED/i.test(V5.source));
  const P = (g, w) => {
    const f = V5.charges[g].fund;
    let re = 0, im = 0;
    for (const c of f) { re += Math.cos(2 * Math.PI * c * w); im += Math.sin(2 * Math.PI * c * w); }
    return Math.hypot(re, im) / f.length;
  };
  ok("the centre control: the fundamental Polyakov loop vanishes at OUR minima",
     P("SU(2)", 0.25) < 1e-12 && P("SU(3)", 1 / 3) < 1e-12);
  ok(`and at their 0.29 it is the archived ${V5.polyakov_at_theirs_su3}`,
     Math.abs(P("SU(3)", 0.29) - V5.polyakov_at_theirs_su3) < 1e-6, String(P("SU(3)", 0.29)));
  ok("stationarity at 1/3 is exact, not a grid artefact: F'(2/3) ~ 0 on the SU(3) table",
     Math.abs(dF5(termsOf("SU(3)"), 2 / 3)) < 1e-9);
}

H("the module, through the resolver, on the anchor");
{
  const m = complete({ ...emptyModel(), group: DATA.group,
                       orbifold: { name: DATA.orbifold.name },
                       bulk: DATA.anchor.bulk }).model;
  const v = resolve([fivedModule(DATA)], m).values;
  const h = v.get("hy");
  ok("hy is a theorem", h.status === STATUS.THEOREM);
  ok("the anchor re-derives its own archived row",
     rel(h.value.alpha, DATA.anchor.expected.alpha) < 1e-9 &&
     h.value.D === DATA.anchor.expected.D && h.value.A4 === DATA.anchor.expected.A4,
     `${h.value.alpha} vs ${DATA.anchor.expected.alpha}`);
  ok("its own control ran and agreed", h.value.control !== null && h.value.control.rel < 1e-3);
  ok("the blind invariance is computed live", h.value.blind_invariant === true);
  ok("8D is even here too", h.value.D8_even === true);
  ok("the census travels into the value", h.value.census.vacua === DATA.census.vacua);
  const un = resolve([fivedModule(DATA)],
    complete({ ...emptyModel(), group: DATA.group, orbifold: { name: DATA.orbifold.name },
               bulk: [{ rep: "84", parities: [1, 1], multiplicity: 1 }] }).model).values.get("hy");
  ok("a representation their formula does not cover is an unknown, with the reason",
     un.status === "unknown" && /does not cover/.test(un.reason));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

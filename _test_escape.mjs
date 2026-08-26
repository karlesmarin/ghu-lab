/* _test_escape.mjs — Part VI's charge arithmetic, held to the paper and to its archived runs.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The kernel in charges.mjs is a port of five Python scripts whose output Part VI archived and
 * whose numbers the paper prints.  Every check below is against one of those -- the channel
 * table of §3, the identity of Prop. 1, the ladder and the hosting table of §4, the fourteen
 * assignments and the two that fit (read into data/su7_km25.json from su7_realisable.txt), the
 * closed-form selection rule against the brute scan of §6, and the residual groups.
 *
 *   node _test_escape.mjs
 */
import { readFileSync } from "node:fs";
import { emptyModel, complete } from "./src/kernel/model.mjs";
import { STATUS } from "./src/kernel/status.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { modules } from "./src/modules/hierarchy.mjs";
import { anomaliesModule } from "./src/modules/anomalies.mjs";
import { escapeModule, braneOf } from "./src/modules/escape.mjs";
import { R, str, parse, eq, isZero, isInt, div, add, sub, mul, neg, sum, HALF, ZERO, ONE,
         generation, CHANNELS, SM_CHANNELS, channels, channelPolynomial, polyStr, rationalRoots,
         extraOfRung, protonCharge, hosts, hostable, mode, assignments, protection, scanProtection,
         residual, protectsGS, SUPPLY, identityCheck, operatorCharges, rgcd }
  from "./src/kernel/charges.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const ARCH = DATA.escape_assignments;

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

H("exact rationals");
ok("1/2 + 1/3 = 5/6", str(add(R(1, 2), R(1, 3))) === "5/6");
ok("-1/9 parses and prints", str(parse("-1/9")) === "-1/9" && str(parse("−1/9")) === "-1/9");
ok("3 · (-1/6) + 1/2 = 0", isZero(protonCharge(R(-1, 6), HALF)));
ok("gcd(3/2, 1/2) = 1/2 and gcd(1, 3/2) = 1/2",
   str(rgcd(R(3, 2), HALF)) === "1/2" && str(rgcd(ONE, R(3, 2))) === "1/2");

H("the six channels at one generation -- the table of Part VI §3");
/* the pure-SM channels vanish at every X_Q: the bookkeeping is sound */
ok("one full SM generation with no nu_R cancels the four SM channels at three values of X_Q",
   [R(0), R(1), R(-1, 6)].every((a) => SM_CHANNELS.every((c) => isZero(c.f(generation(a, HALF))))));
const P1 = Object.fromEntries(CHANNELS.map((c) => [c.id, channelPolynomial(c)]));
/* printed highest power first, as the paper's table does: 3/2 X_Q + 1/4, −3 X_Q − 1/2, ... */
const want = { su3_x: "0", su2_x: "3/2 a + 1/4", x2_y: "-3 a − 1/2", x_y2: "-3/2 a − 1/4",
               x_grav: "1", x3: null };
for (const [id, w] of Object.entries(want)) {
  if (w === null) continue;
  ok(`${id} = ${w}`, polyStr(P1[id]) === w, polyStr(P1[id]));
}
ok("X^3 is the constant 1 at X_Q = -1/6 (the quark part cancels)",
   str(CHANNELS.find((c) => c.id === "x3").f(generation(R(-1, 6), HALF))) === "1");
for (const id of ["su2_x", "x2_y", "x_y2"])
  ok(`${id} vanishes exactly at X_Q = -1/6 and nowhere else`,
     rationalRoots(P1[id]).map(str).join(",") === "-1/6", rationalRoots(P1[id]).map(str).join(","));
ok("X · grav² and X³ vanish NEVER", rationalRoots(P1.x_grav).length === 0 && rationalRoots(P1.x3).length === 0);
ok("[SU(3)]² X vanishes for every X_Q", rationalRoots(P1.su3_x) === "every");
ok("the SU(2) channel is A/2 at four values of X_Q -- Prop. 1 at one generation",
   [R(0), R(1), R(-1, 6), R(-2, 3)].every((a) =>
     eq(CHANNELS[1].f(generation(a, HALF)), div(protonCharge(a, HALF), R(2)))));
ok("one right-handed neutrino of charge -1 cancels every channel at X_Q = -1/6",
   CHANNELS.every((c) => isZero(c.f(generation(R(-1, 6), HALF, [R(-1)])))));
ok("and at X_Q = -1/6, U(1)' = T3L + Y − (B−L) on every field",
   identityCheck(R(-1, 6)));
ok("the four dimension-6 operators are Y-neutral and (B−L)-neutral",
   operatorCharges().every((o) => isZero(o.Y) && isZero(o.BL)));

H("the ladder, and who hosts each rung -- Part VI §4");
ok("extra(L) = (1−k)/2: 1/2, 0, -1/2, -1", [0, 1, 2, 3].map((k) => str(extraOfRung(k))).join(" ") === "1/2 0 -1/2 -1");
ok("rung 0 is their own eq. (43): the 21 at (η,η′) = (−1,+1)",
   hosts(0).some((h) => h.rep === "21" && h.parities.some(([e, p]) => e === -1 && p === 1)));
ok("the 28 hosts rung 0 too", hosts(0).some((h) => h.rep === "28" && h.hostsE && h.parities.length));
ok("rung 1 is hosted by the 84 at (+,+), and only the 84",
   hosts(1).filter((h) => h.hostsE && h.parities.length).map((h) => h.rep).join() === "84" &&
   hosts(1).find((h) => h.rep === "84").parities.some(([e, p]) => e === 1 && p === 1));
ok("the 35 hosts L at rung 1 and NOT e_R -- an antisymmetric tensor has no repeated index",
   hosts(1).some((h) => h.rep === "35" && h.hostsL && !h.hostsE));
ok("rung 2 and above are hostable by nothing their paper introduces", !hostable(2) && !hostable(3));
ok("the doublet is never split: the upper component has the chirality of the lower on every host",
   [0, 1].every((k) => hosts(k).every((h) => h.parities.every(([e, p]) =>
     mode([0, 0, 0, 1, 0, 1, k], e, p) === mode([0, 0, 0, 0, 1, 1, k], e, p)))));

H("Prop. 1 on three generations");
for (const trial of [[[0, HALF]], [[0, HALF], [R(1, 3), ZERO]], [[R(-1, 9), HALF], [R(-1, 9), HALF], [R(-1, 9), ZERO]]]) {
  const s = trial.flatMap(([a, l]) => generation(R(a), l));
  ok(`[SU(2)]² X = ½ Σ A_j on ${trial.length} generation(s)`,
     eq(CHANNELS[1].f(s), div(sum(trial.map(([a, l]) => protonCharge(R(a), l))), R(2))));
}

H("the fourteen assignments, and the two that fit -- against su7_realisable.py's archive");
const ALL = assignments({ N: 3 });
const SURV = ALL.filter((s) => s.survives);
ok(`20 rung multisets enumerated, 14 survive all six channels`, ALL.length === 20 && SURV.length === 14,
   `${ALL.length}, ${SURV.length}`);
ok("the archive carries 14 rows with 2 realisable", ARCH.count === 14 && ARCH.realisable === 2);
const keyOf = (l) => l.join(",");
for (const row of ARCH.rows) {
  const mine = SURV.find((s) => keyOf(s.l.map(str)) === keyOf(row.l));
  ok(`(${row.l.join(", ")}) · survives, X_Q = ${row.X_Q}, A = (${row.A.join(", ")})`,
     !!mine && str(mine.a) === row.X_Q && keyOf(mine.A.map(str)) === keyOf(row.A),
     mine ? `${str(mine.a)} (${mine.A.map(str).join(", ")})` : "not found");
  ok(`   · neutrinos (${row.nus.join(", ")}) and realisable = ${row.realisable}`,
     !!mine && keyOf(mine.nus.map(str)) === keyOf(row.nus) && mine.realisable === row.realisable,
     mine ? `${mine.nus.map(str).join(",")} ${mine.realisable}` : "");
}
ok("exactly two are realisable inside their own tensors", SURV.filter((s) => s.realisable).length === 2);
/* The rung cube's four classes, pinned: 6 unprotected, 12 survive-only, 2 realisable -- and the
 * class "protects but a channel survives" is EMPTY.  The section's legend says so; if this ever
 * moves, the picture and the sentence both have to. */
ok("every multiset that protects also cancels all six channels: the blue class is empty",
   ALL.filter((s) => s.protects && !s.survives).length === 0 &&
   ALL.filter((s) => !s.protects).length === 6);
ok("and both need a singlet of charge -1", SURV.filter((s) => s.realisable).every((s) => s.needsMinusOne));
ok("exactly one is strict-compatible, l = (1/2, 1/2, -1) at X_Q = 0, and it is not realisable",
   SURV.filter((s) => s.strict).length === 1 && str(SURV.find((s) => s.strict).a) === "0" &&
   !SURV.find((s) => s.strict).realisable);
ok("the family-universal rungs (1/2,1/2,1/2) return X_Q = -1/6 and A_j = 0: unprotected",
   (() => { const u = ALL.find((s) => keyOf(s.l.map(str)) === "1/2,1/2,1/2");
            return u && str(u.a) === "-1/6" && !u.protects && !u.survives; })());
ok("the minimal assignment (1/2,1/2,0) sits at X_Q = -1/9 with one generation on rung 1",
   (() => { const m = SURV.find((s) => keyOf(s.l.map(str)) === "1/2,1/2,0");
            return m && str(m.a) === "-1/9" && m.rung1 === 1 && m.realisable; })());
ok("the second, (1/2,0,0), at X_Q = -1/18 consumes two 84s",
   (() => { const m = SURV.find((s) => keyOf(s.l.map(str)) === "1/2,0,0");
            return m && str(m.a) === "-1/18" && m.rung1 === 2 && m.realisable; })());

H("the selection rule -- Prop. 3, closed form against the brute scan");
const MIN = SURV.find((s) => keyOf(s.l.map(str)) === "1/2,1/2,0");
const Pm = protection(MIN.A, null);
ok("the minimal assignment fails exactly on {1/(3n)}: generators 1/3 and 1/6, half-line 1/3",
   Pm.failingSet.map(str).join(",") === "1/3,1/6" && str(Pm.halfLine) === "1/3");
ok("every q_phi their reps supply protects it",
   SUPPLY.every((s) => protection(MIN.A, s.q).protectedAt));
const STR = SURV.find((s) => s.strict);
ok("the strict-compatible one fails at 1/2 and at 1, and only 3/2 protects it",
   !protection(STR.A, HALF).protectedAt && !protection(STR.A, ONE).protectedAt &&
   protection(STR.A, R(3, 2)).protectedAt && str(protection(STR.A, null).halfLine) === "1");
let tested = 0, bad = 0;
for (const s of SURV) { const r = scanProtection(s.A, 36); tested += r.tested; bad += r.bad; }
ok(`the closed form agrees with the brute scan on all 14: ${tested} values, ${bad} disagreements`,
   tested === ARCH.qphi.scan.values && bad === 0);
ok("A_j = 0 fails at every q_phi -- the control that must fire",
   protection([ZERO, ZERO, ZERO], R(3, 2)).everyQFails && !protection([ZERO, ZERO, ZERO], R(3, 2)).protectedAt);

H("the residual group -- su7_residual_group.py");
ok("1/2 -> Z_1, 1 -> Z_2, 3/2 -> Z_3",
   SUPPLY.map((s) => residual([s.q]).N).join() === "1,2,3");
ok("only q_phi = 3/2 alone protects the Green-Schwarz-freed charges (3m+1)/2",
   SUPPLY.map((s) => protectsGS(s.q)).join() === "false,false,true");
ok("every pair of their three charges has gcd 1/2 and collapses the residual to Z_1",
   [[0, 1], [0, 2], [1, 2]].every(([i, j]) => { const r = residual([SUPPLY[i].q, SUPPLY[j].q]);
                                                 return str(r.generator) === "1/2" && r.N === 1; }));

H("the module, through the resolver");
const MODS = [...modules(DATA), anomaliesModule(DATA), escapeModule(DATA)];
const mk = (bulk, brane = []) => complete({ ...emptyModel(), group: DATA.group,
  orbifold: { name: DATA.orbifold.name }, bulk, brane }).model;
const row2 = DATA.published_rows[1].bulk;
{
  const v = resolve(MODS, mk(row2)).values;
  ok("channels are now a theorem, not an unknown", v.get("channels").status === STATUS.THEOREM);
  const ch = v.get("channels").value;
  /* four bare zeros: the three that force X_Q = -1/6, plus [SU(3)]² X, which is identically 0 */
  ok("at their one generation X_Q is forced to -1/6 and four channels vanish there bare",
     v.get("brane").value.X_Q === "-1/6" && ch.table.filter((r) => r.bare === "0").length === 4,
     `${v.get("brane").value.X_Q} ${ch.table.map((r) => r.bare).join(" ")}`);
  ok("the two uncancellable ones read 1 and the neutrino of charge -1 cancels them",
     ch.table.every((r) => r.withNu === "0") && ch.nus.join() === "-1");
  ok("A = 0 there: no protection at one generation", ch.A.join() === "0" && !ch.protects);
  ok("the bill is zero: nothing on rung 1", v.get("bill_escape").value.cost8 === 0);
  ok("the defaults are echoed", v.get("brane").value.applied.length === 3);
}
{
  const v = resolve(MODS, mk(row2, [{ kind: "leptons", rungs: [0, 0, 1] }, { kind: "scalar", q_phi: "3/2" }])).values;
  const br = v.get("brane").value, as = v.get("assignments").value, pr = v.get("protection").value;
  ok("rungs (0,0,1) give X_Q = -1/9, A = (1/6, 1/6, -1/3)",
     br.X_Q === "-1/9" && br.A.join(",") === "1/6,1/6,-1/3");
  ok("the assignment is found, surviving and realisable", as.current && as.current.survives && as.current.realisable);
  ok("14 surviving, 2 realisable, from the browser's own enumeration", as.surviving === 14 && as.realisable === 2);
  ok("at q_phi = 3/2 all three generations are protected", pr.protectedAt === true && pr.dressable.length === 0);
  ok("the residual is Z_3", v.get("residual").value.chosen === 3);
  const b = v.get("bill_escape").value;
  ok("row (2) pays 10/8 for the one rung-1 generation and survives: 29 -> 19",
     b.cost8 === 10 && b.D8_before === 29 && b.D8_after === 19 && b.survives === true);
}
{
  const v = resolve(MODS, mk(DATA.published_rows[2].bulk, [{ kind: "leptons", rungs: [0, 0, 1] }])).values;
  ok("row (3) cannot pay: 9 -> -1", v.get("bill_escape").value.D8_after === -1 && v.get("bill_escape").value.survives === false);
}
{
  const v = resolve(MODS, mk(row2, [{ kind: "leptons", rungs: [0, 1, 1] }])).values;
  ok("two generations on rung 1 cost 20/8 and need two hosts; row (2) holds four",
     v.get("bill_escape").value.cost8 === 20 && v.get("bill_escape").value.enough_hosts);
}
{
  /* X_Q = 0 on rungs (0,0,3) is the strict-compatible assignment and DOES cancel; X_Q = 1 does not */
  const v = resolve(MODS, mk(row2, [{ kind: "quarks", X_Q: "1" }, { kind: "leptons", rungs: [0, 0, 3] }])).values;
  ok("a typed X_Q is used as typed and the channels then do not cancel",
     v.get("brane").value.X_Q === "1" && !v.get("brane").value.X_Q_forced && !v.get("channels").value.allCancel);
  ok("rung 3 is not hostable, so the assignment is not realisable",
     v.get("assignments").value.current && !v.get("assignments").value.current.realisable);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

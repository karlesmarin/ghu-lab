/* _test_brane.mjs — matter on the fixed points, held to the textbook case and to two routines that
 * must agree without ever having been told about each other.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 *   - the ANCHOR everybody knows: Kawamura's SU(5) has P = 1 and P′ = diag(+,+,+,−,−), which in
 *     letters is [3,2,0,0].  The whole SU(5) survives at y = 0 and only SU(3)×SU(2)×U(1) at
 *     y = πR.  If this module cannot say that, nothing else it says is worth reading;
 *   - CONSERVATION: a local representation and its decomposition into pieces of the unbroken group
 *     have the same number of states, and every piece of it carries the SAME local U(1) charge —
 *     over every boundary condition of SU(3)…SU(7) and every entry of the menu;
 *   - the SHIFT is what it claims: giving a field local charge q moves its local charge to exactly
 *     q, read back through the ledger's own charge function rather than through the shift;
 *   - a field and its CONJUGATE cancel every channel, with a shifted charge as well as without;
 *   - the CONTROL: paired classes are vectorlike, so the anomaly of what survives the mass gate is
 *     the anomaly of everything that entered it, row for row — a rank test over class keys and an
 *     exact rational ledger agreeing on every model, which they do only if the keys are conjugate;
 *   - a DECOY that must disagree: the same gate run on keys that ignore the U(1) charges lifts more
 *     than the real one somewhere, which is Part I's "rank test, not a count" as a number;
 *   - Komori–Maru CONSTRUCTED: the conjugate brane field of a massless mode lifts it, and drags its
 *     package with it;
 *   - and the TENSION: the charge that pays the anomaly is not in general the charge the mass term
 *     needs, so the same field cannot always do both.
 *
 *   node _test_brane.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { an5Frame, an5Pieces, an5PieceDim, an5PieceCharge, an5LedgerOnFrame }
  from "./src/modules/anomaly5d.mjs";
import { BR_FIXED, brLocalFrame, brLocalGroup, brSameGroup, brLocalPiece, brDecompose,
         brLocalU1, brLocalCharge, brShiftDirection, brInducedCharge, brPieces, brBill,
         brCanon, brBar, brClassKey, brConjKey, brMassGate, brGateControl, brMenu,
         brPartnersFor, brSolveCharges, brSummary } from "./src/modules/brane.mjs";
import { smUnder } from "./src/modules/smcell.mjs";
import { R, add, sub, mul, neg, isZero, eq, str, ZERO } from "./src/kernel/charges.mjs";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);
const B = (m) => sun5dBlocks({ nPP: m[0], nPM: m[1], nMP: m[2], nMM: m[3] });
const D = (rep, eta, m = 1) => ({ rep, eta, kind: "dirac", multiplicity: m });
const G = (bulk) => ({ bulk });

/* every boundary condition of SU(N) with the four block sizes summing to N */
function allBC(N) {
  const out = [];
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N - a; b++)
    for (let c = 0; c <= N - a - b; c++) out.push([a, b, c, N - a - b - c]);
  return out;
}

/* ------------------------------------------------------------------ 1. the anchor */

H("Kawamura's SU(5): the whole group at one fixed point, the Standard Model at the other");
{
  const b = B([3, 2, 0, 0]);                       /* P = 1, P′ = diag(+,+,+,−,−) */
  const L0 = brLocalFrame(b, 0), L1 = brLocalFrame(b, 1);
  ok("at y = 0 the local group is SU(5) — nothing is broken there",
     brLocalGroup(L0) === "SU(5)", brLocalGroup(L0));
  ok("at y = πR it is SU(3) × SU(2) × U(1)",
     brLocalGroup(L1) === "SU(3) × SU(2) × U(1)", brLocalGroup(L1));
  ok("so the two branes do NOT see the same group, and the module says so",
     brSameGroup(b) === false);
  ok("the unbroken 4D group is the intersection: SU(3) × SU(2) × U(1) as well, from four letters",
     brLocalGroup(L1) === "SU(3) × SU(2) × U(1)");

  const un = B([5, 0, 0, 0]);
  ok("an orbifold that breaks nothing: both fixed points see SU(5), and they are the same",
     brLocalGroup(brLocalFrame(un, 0)) === "SU(5)" &&
     brLocalGroup(brLocalFrame(un, 1)) === "SU(5)" && brSameGroup(un) === true);

  const sym = B([3, 0, 0, 2]);
  ok("SU(5) [3,0,0,2]: both fixed points see SU(3) × SU(2) × U(1) — broken, but symmetrically",
     brLocalGroup(brLocalFrame(sym, 0)) === "SU(3) × SU(2) × U(1)" &&
     brLocalGroup(brLocalFrame(sym, 1)) === "SU(3) × SU(2) × U(1)" && brSameGroup(sym) === true);
}

H("the fixed points are the two reflections, and the letters are what they say they are");
{
  ok("P₀ is + on (+,+) and (+,−); P₁ on (+,+) and (−,+)",
     BR_FIXED[0].even.join() === "0,1" && BR_FIXED[1].even.join() === "0,2");
  for (const m of [[3, 2, 0, 0], [2, 1, 3, 1], [1, 1, 1, 1]]) {
    const b = B(m);
    for (const fp of [0, 1]) {
      const L = brLocalFrame(b, fp);
      ok(`[${m}] fp ${fp}: the two parts partition the N indices`,
         L.blocks[0].size + L.blocks[1].size === b.N &&
         L.blocks[0].members.concat(L.blocks[1].members).sort().join() === "0,1,2,3");
    }
  }
}

/* ------------------------------------------------------------------ 2. conservation */

H("a local representation and its decomposition have the same states, and one local charge");
{
  let cases = 0, dimBad = 0, chargeBad = 0;
  for (let N = 3; N <= 7; N++) for (const m of allBC(N)) {
    const b = B(m), frame = an5Frame(b);
    for (const fp of [0, 1]) {
      const L = brLocalFrame(b, fp);
      for (const entry of brMenu(b, fp)) {
        const lp = brLocalPiece({ ...entry, chirality: "L", copies: 1 });
        const pieces = brDecompose(frame, L, lp);
        const want = an5PieceDim(L, lp);
        const got = pieces.reduce((a, p) => a + an5PieceDim(frame, p), 0);
        if (want !== got) dimBad++;
        const q = an5PieceCharge(L, lp, 0);
        for (const p of pieces) if (!eq(brLocalCharge(frame, L, p), q)) chargeBad++;
        cases++;
      }
    }
  }
  ok(`${cases} (boundary condition, fixed point, local representation) cases were built`, cases > 900);
  ok("every decomposition has exactly the states of the representation it came from", dimBad === 0,
     `${dimBad} bad`);
  ok("every piece of a decomposition carries the SAME local U(1) charge as the whole",
     chargeBad === 0, `${chargeBad} bad`);
}

H("the free charge is exactly the charge you asked for, read back through the ledger");
{
  let bad = 0, shifted = 0;
  for (let N = 3; N <= 6; N++) for (const m of allBC(N)) {
    const b = B(m), frame = an5Frame(b);
    for (const fp of [0, 1]) {
      const L = brLocalFrame(b, fp);
      if (!L.blocks[0].size || !L.blocks[1].size) continue;   /* no local U(1) to shift along */
      for (const entry of brMenu(b, fp)) {
        for (const q of [R(1, 3), R(-5, 7), R(0)]) {
          const ps = brPieces(b, [{ ...entry, chirality: "L", copies: 1, q }]);
          if (!ps.length) continue;
          for (const p of ps) if (!eq(brLocalCharge(frame, L, p), q)) bad++;
          shifted++;
        }
      }
    }
  }
  ok(`${shifted} shifted fields were built and every piece of every one reads back its charge`,
     bad === 0 && shifted > 500, `${bad} bad of ${shifted}`);

  /* THE DIRECTION HAS ONE PROPERTY AND IT IS CHECKABLE.  The local charge of a piece is
   * Σ_c T(c)·q_c, so a shift of the q_c by Δ·dir_c must move it by exactly Δ — that is,
   * Σ_c T(c)·dir_c = 1, on every boundary condition that has a local U(1) at all.  A direction
   * that failed this would move the charge somewhere the caller never asked for. */
  let dirBad = 0, dirCases = 0;
  for (let N = 3; N <= 7; N++) for (const m of allBC(N)) {
    const b = B(m), frame = an5Frame(b);
    for (const fp of [0, 1]) {
      const L = brLocalFrame(b, fp);
      if (!L.blocks[0].size || !L.blocks[1].size) continue;
      const t = brLocalU1(frame, L), dir = brShiftDirection(frame, L);
      let s = ZERO;
      for (let c = 0; c < 4; c++) s = add(s, mul(t[c], dir[c]));
      if (!eq(s, R(1))) dirBad++;
      dirCases++;
    }
  }
  ok(`Σ_c T(c)·dir_c = 1 on all ${dirCases} boundary conditions with a local U(1)`,
     dirBad === 0 && dirCases > 300, `${dirBad} bad of ${dirCases}`);
}

/* ------------------------------------------------------------------ 3. a field and its conjugate */

H("a brane field and its conjugate cancel every channel — with a shifted charge as well");
{
  let cases = 0, bad = 0;
  for (let N = 3; N <= 6; N++) for (const m of allBC(N)) {
    const b = B(m), frame = an5Frame(b);
    for (const fp of [0, 1]) for (const entry of brMenu(b, fp)) {
      for (const q of [null, R(2, 5)]) {
        const f = { ...entry, chirality: "L", copies: 1, q };
        const qi = brInducedCharge(b, f);
        const bar = { ...entry, chirality: "R", copies: 1,
                      q: q === null ? neg(qi) : neg(q) };
        const led = an5LedgerOnFrame(frame, brPieces(b, [f, bar]));
        if (led.offending.length) bad++;
        cases++;
      }
    }
  }
  ok(`${cases} (field, conjugate) pairs, and every channel of every one is zero`,
     bad === 0 && cases > 400, `${bad} bad of ${cases}`);
}

/* ------------------------------------------------------------------ 4. the control */

H("THE CONTROL: the anomaly of what survives the mass gate is the anomaly of everything");
{
  const BULK = [G([D("fund", 1)]), G([D("fund", 1), D("fund", -1)]), G([D("anti", 1)]),
                G([D("sym", 1)]), G([D("adj", 1)]), G([D("fund", 1, 3), D("anti", -1)])];
  let cases = 0, bad = 0, withBrane = 0;
  for (let N = 3; N <= 6; N++) for (const m of allBC(N)) {
    const b = B(m);
    for (const content of BULK) {
      const g0 = brMassGate(b, content, []);
      if (!brGateControl(g0)) bad++;
      cases++;
      for (const fp of [0, 1]) for (const entry of brMenu(b, fp).slice(0, 3)) {
        const branes = [{ ...entry, chirality: "L", copies: 1 },
                        { ...entry, chirality: "R", copies: 2 }];
        const g = brMassGate(b, content, branes);
        if (!brGateControl(g)) bad++;
        cases++;
        if (g.lifted) withBrane++;
      }
    }
  }
  ok(`${cases} models, bulk and brane, and the two ledgers agree row for row on every one`,
     bad === 0 && cases > 2000, `${bad} disagreed of ${cases}`);
  ok(`the gate actually lifted something in ${withBrane} of them — a control that never fires is not one`,
     withBrane > 100);
}

H("A DECOY: the same gate on keys that ignore the charges lifts more, and must");
{
  /* Part I's own warning, as an experiment: pair by the non-abelian representation alone and the
   * count comes out too small.  If this never differed, the charges in the key would be decoration. */
  const blind = (b, content, branes) => {
    const frame = an5Frame(b);
    const ps = an5Pieces(b, content).concat(brPieces(b, branes));
    const key = (p) => frame.blocks.map((k, i) => brCanon(smUnder(frame, p, i), k.size)).join("|");
    const bar = (p) => frame.blocks.map((k, i) => brBar(smUnder(frame, p, i), k.size)).join("|");
    const cnt = new Map();
    for (const p of ps) cnt.set(key(p), (cnt.get(key(p)) || 0) + p.copies);
    let lifted = 0; const done = new Set();
    for (const p of ps) {
      const k = key(p), c = bar(p);
      if (done.has(k) || k === c) continue;
      done.add(k); done.add(c);
      lifted += Math.min(cnt.get(k) || 0, cnt.get(c) || 0);
    }
    return lifted;
  };
  let over = 0, under = 0, same = 0;
  for (let N = 4; N <= 6; N++) for (const m of allBC(N)) {
    const b = B(m), content = G([D("fund", 1), D("anti", -1)]);
    for (const fp of [0, 1]) for (const entry of brMenu(b, fp).slice(0, 2)) {
      const branes = [{ ...entry, chirality: "R", copies: 1 }];
      const real = brMassGate(b, content, branes).lifted;
      const fake = blind(b, content, branes);
      if (fake > real) over++; else if (fake < real) under++; else same++;
    }
  }
  ok(`the charge-blind gate OVER-lifts on ${over} models — two pieces that look alike and are ` +
     `charged differently cannot be given a mass, and Part I's warning is exactly this`, over > 20);
  /* and it errs the other way too, which is the half of the decoy that is easy to miss: a real
   * representation carrying opposite charges is one blind key equal to its own conjugate, so the
   * blind gate skips a pairing the real one makes */
  ok(`...and UNDER-lifts on ${under} others, where a self-conjugate representation carries ` +
     `opposite charges — the blind key is its own conjugate and the pairing is skipped`, under > 0);
  ok(`they agree on ${same}, so the difference is a property of some models and not of the code`,
     same > 0);
}

/* ------------------------------------------------------------------ 5. Komori–Maru, constructed */

H("the conjugate brane field lifts the mode it was introduced for, and brings its package");
{
  const b = B([3, 2, 0, 0]), frame = an5Frame(b);
  const content = G([D("fund", 1)]);
  const bulk = an5Pieces(b, content);
  ok("SU(5) [3,2,0,0] with one bulk 5 has massless pieces to be rid of", bulk.length > 0);

  const target = bulk[0];
  const cand = brPartnersFor(b, target);
  ok("there is at least one brane representation containing its conjugate", cand.length > 0);
  const best = cand[0];
  ok("the cheapest candidate is named with the fixed point it lives on and the charge it must carry",
     typeof best.label === "string" && (best.where === "y = 0" || best.where === "y = πR") &&
     best.q !== undefined);
  /* a right-handed Weyl in S is a left-handed one in S̄, so exactly one of the two ways of writing
   * a local representation carries the conjugate the mode needs; searching one would halve the menu */
  ok("both chiralities are searched, and both turn up among the candidates",
     cand.some((c) => c.field.chirality === "L") && cand.some((c) => c.field.chirality === "R"),
     cand.map((c) => c.field.chirality).join(""));
  ok("...and restricting the search to one chirality really does lose candidates",
     brPartnersFor(b, target, { chiralities: ["L"] }).length < cand.length);

  const before = brMassGate(b, content, []);
  const after = brMassGate(b, content, [best.field]);
  ok("adding it lifts strictly more than nothing", after.lifted > before.lifted,
     `${before.lifted} → ${after.lifted}`);
  ok("the target class is gone from the survivors",
     !after.survivors.some((s) => s.key === brClassKey(frame, target) && s.left > 0) ||
     after.survivors.find((s) => s.key === brClassKey(frame, target)).left <
       before.survivors.find((s) => s.key === brClassKey(frame, target)).left);
  ok("and the control still holds with it in", brGateControl(after));

  /* FACT 2: you cannot add the conjugate alone.  On this boundary condition the local group at
   * y = 0 is the whole SU(5), so its fundamental drags the rest of the multiplet in. */
  const at0 = cand.filter((c) => c.where === "y = 0");
  ok("a candidate on the unbroken brane brings extra pieces with it — the package is real",
     at0.length === 0 || at0.some((c) => c.extraStates > 0),
     at0.map((c) => `${c.label}:${c.extraStates}`).join(" "));
}

/* ------------------------------------------------------------------ 6. solving for the charge */

H("Part VI's question for any model: which local charge makes the bill cancel?");
{
  const b = B([3, 2, 0, 0]);
  const content = G([D("fund", 1), D("anti", 1)]);
  const bill0 = brBill(b, content, []);
  ok("the bulk of this model owes something to begin with — otherwise the solve is vacuous",
     bill0.owedBefore === 4 &&
     bill0.bulkOnly.offending.map((r) => str(r.value)).join(" ") === "3/5 -3/5 12/5 -12/5",
     bill0.bulkOnly.offending.map((r) => `${r.channel}=${str(r.value)}`).join(" · "));

  const menu = brMenu(b, 1);
  const fund = menu.find((e) => e.rep === "fund" && e.blockA === 0);
  const sym = menu.find((e) => e.rep === "sym" && e.blockA === 0);
  const sol = brSolveCharges(b, content, [{ ...fund, chirality: "L", copies: 1 },
                                          { ...sym, chirality: "L", copies: 1 }]);
  ok("a 3 and an S²3 on the broken brane: the six linear channels have a unique solution",
     sol.ok === true && sol.free === 0, sol.why || "");
  ok("...and the two charges are forced to −8/15 and −2/15 — Part VI's kind of statement, here " +
     "for a boundary condition nobody published",
     sol.ok && sol.q.map((q) => str(q)).join(" ") === "-8/15 -2/15",
     sol.ok ? sol.q.map(str).join(" ") : "");
  ok("every LINEAR channel is zero at the answer",
     sol.ok && sol.ledger.rows.filter((r) => r.kind === "mixed" || r.kind === "gravitational")
       .every((r) => isZero(r.value)),
     sol.ok ? sol.ledger.rows.filter((r) => (r.kind === "mixed" || r.kind === "gravitational") &&
                                            !isZero(r.value)).map((r) => r.channel).join(", ") : "");
  ok("AND THE CUBIC ONES ARE NOT, which is the whole reason they are reported apart: paying the " +
     "linear channels does not make the model anomaly-free and the solve refuses to say it does",
     sol.ok && sol.cubic.length === 2 && sol.clean === false,
     sol.ok ? `${sol.cubic.length} cubic left, clean=${sol.clean}` : "");
  ok("with no brane field there is nothing to solve for, and it says that",
     brSolveCharges(b, content, []).ok === false);

  /* the same two fields with the charges left at the value their indices imply: the bill stands */
  const asIs = brBill(b, content, [{ ...fund, chirality: "L", copies: 1 },
                                   { ...sym, chirality: "L", copies: 1 }]);
  ok("with the charges NOT solved for, those channels still owe — the solve is doing work",
     asIs.total.offending.some((r) => r.kind === "mixed" || r.kind === "gravitational"));
}

/* ------------------------------------------------------------------ 7. the tension */

H("THE TENSION: the charge that pays the anomaly is not the charge the mass term needs");
{
  const b = B([3, 2, 0, 0]), frame = an5Frame(b);
  const content = G([D("fund", 1)]);
  const target = an5Pieces(b, content)[0];
  const cand = brPartnersFor(b, target).filter((c) => c.where === "y = πR");
  ok("a partner exists at the broken brane", cand.length > 0);
  const f = cand[0].field;
  const paired = brMassGate(b, content, [f]);
  const moved = brMassGate(b, content, [{ ...f, q: add(f.q, R(1)) }]);
  ok("with the charge the mass term needs, the mode is lifted", paired.lifted > 0);
  ok("with the charge moved by one, the SAME representation lifts nothing",
     moved.lifted < paired.lifted, `${paired.lifted} → ${moved.lifted}`);
  ok("and the two contribute different bills, so the field cannot be chosen for one job alone",
     !brBill(b, content, [f]).total.rows.every((r, i) =>
        eq(r.value, brBill(b, content, [{ ...f, q: add(f.q, R(1)) }]).total.rows[i].value)));
}

/* ------------------------------------------------------------------ 8. the summary line */

H("the one line a header carries");
{
  const b = B([3, 2, 0, 0]);
  const s = brSummary(b, G([D("fund", 1)]), []);
  ok("it names the brane pieces, the channels owing before and after, and the massless count",
     /brane piece\(s\) · \d+ → \d+ channel\(s\) owing · \d+ → \d+ massless/.test(s.line), s.line);
  ok("the control travels with it", s.control === true);
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

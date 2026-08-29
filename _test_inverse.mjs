/* _test_inverse.mjs — the inverse map, against the archived Part VIII runs.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The page re-derives the DECISION at a rung: the certificates and the finite enumeration.  This
 * holds that re-derivation to the run that produced the paper — the five published rows inverted
 * from their own observables, the extremal direction recovered, the certificate roster of every
 * target in the design table, and the designs themselves.
 *
 * And it falsifies the certificates rather than only reading them: a rung the Farkas bound kills
 * is ALSO enumerated whole, and has to come back empty.  A certificate nobody tries to break is a
 * label.  [[a-falsification-suite-beats-a-passing-control]]
 *
 *   node _test_inverse.mjs
 */
import { readFileSync } from "node:fs";
import { moments, alphaMin, numericMin, localMin, F } from "./src/kernel/potential.mjs";
import { inverseLattice, inverseBox, decideRung, designScale, contentsAt, rungsFor, kMaxFor,
         gWindow, gConeBounds, congruenceOK, inCone, forwardOf, termsOfMult, isProved,
         reachableSet, rungPoints, DUAL_TOL } from "./src/modules/inverse.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/su7_km25.json", import.meta.url), "utf8"));
const INV = DATA.inverse;
const CONV = { m_W: 80.4, g4: 0.63, mh_window: [125.0, 127.0] };

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

const L = inverseLattice(DATA);

/* the exact-potential check the designer's `verify` hook takes: the same two refined minima
 * compared by depth that the hierarchy section's vacuum verdict uses -- nothing positional */
function verifyExact(terms) {
  const mo = moments(terms);
  const OPT = { n: 800, refine: 30, windings: 300 };
  const aNum = numericMin(terms, OPT);
  if (aNum === null) return null;
  const a = alphaMin(mo);
  if (a === null) return null;
  const aLoc = localMin(terms, a, OPT) ?? a;
  const fB = F(terms, aLoc, 300), fN = F(terms, aNum, 300);
  return fB <= fN + 1e-9 * Math.max(1, Math.abs(fB)) ? { alpha: aLoc } : null;
}

/* ------------------------------------------------------------------ 1. the lattice */

H("the lattice the page derives IS the lattice the runs used");
{
  const A = INV.published, arch = DATA.coordinates.generators;
  L.slots.forEach((s, j) => {
    const c = arch[s.name];
    if (j === 0)
      ok(`${s.name}: (2A₄, 8D, 2W) derived from the term table`,
         L.t2[j] === 2 * c[0] && L.k8D[j] === c[1] && L.W2[j] === c[4]);
  });
  ok("all eight generators agree with the archived five coordinates",
     L.slots.every((s, j) => L.t2[j] === 2 * arch[s.name][0] && L.k8D[j] === arch[s.name][1] &&
                             L.W2[j] === arch[s.name][4]));
  ok("the gauge base point agrees", L.base.t2 === 2 * DATA.coordinates.gauge[0] &&
     L.base.k8D === DATA.coordinates.gauge[1] && L.base.W2 === DATA.coordinates.gauge[4]);
  ok("exactly one generator has A₄ = 0, and it is 7(+,+) — the whole decidability rests on it",
     L.slots[L.free].name === "7(+,+)" && L.t2.filter((v) => v === 0).length === 1);
  ok(`and it moves 8D by ${L.step}, which is what pins its multiplicity`, L.step === 6);
  void A;
}

H("the two lattice laws, on the page's own arithmetic");
{
  /* every generator preserves 8D - 2A4 mod 6, so the law is a property of the lattice and not of
   * the base point -- which is why it survives the seed change */
  ok("every generator preserves 8D − 2A₄ (mod 6)",
     L.slots.every((s, j) => ((L.k8D[j] - L.t2[j]) % 6 + 6) % 6 === 0));
  ok("the published base point satisfies 8D = 2A₄ + 3 (mod 6)", congruenceOK(L.base.t2, L.base.k8D));
  const cand = inverseLattice(DATA, DATA.gauge_seeds.candidate.gauge);
  ok("and so does the CANDIDATE seed, where 8D is even and A₄ half-integral",
     congruenceOK(cand.base.t2, cand.base.k8D) && Math.abs(cand.base.t2 % 2) === 1);
  ok("2W is odd on both seeds — the two symmetric points never tie",
     Math.abs(L.base.W2 % 2) === 1 && Math.abs(cand.base.W2 % 2) === 1);
}

/* ------------------------------------------------------------------ 2. the published rows */

H("the five published rows, inverted from their OWN observables");
{
  let allOwn = true, allRung = true;
  DATA.published_rows.forEach((row, i) => {
    const mult = L.slots.map((s) => {
      const b = row.bulk.find((x) => x.rep === s.rep &&
        (x.parities[0] > 0 ? "+" : "-") === s.key[1] && (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
      return b ? b.multiplicity : 0;
    });
    const box0 = inverseBox(1, 2, 125, 127, CONV);
    const f = forwardOf(L, mult, box0, DATA.gauge);
    const arch = INV.rows[i];
    const box = inverseBox(f.invR * (1 - 1e-6), f.invR * (1 + 1e-6),
                           f.mh * (1 - 1e-6), f.mh * (1 + 1e-6), CONV);
    const t2 = Math.round(2 * f.A4);
    const got = decideRung(L, DATA, t2, f.k8D, box, { needW: false, wantAll: 200 });
    let own = false;
    if (got.ok) {
      const w = got.gWindow;
      contentsAt(L, t2, f.k8D, (n, G) => {
        if (G >= w.gLo && G <= w.gHi && n.every((v, j) => v === mult[j])) { own = true; return true; }
        return false;
      });
    }
    allOwn &&= own;
    if (i === 1) {
      ok(`row ${arch.row}: our 1/R₅ = ${f.invR.toFixed(1)} GeV matches the archived inversion`,
         Math.abs(f.invR - arch.invR) < 1e-6 * arch.invR, `${f.invR} vs ${arch.invR}`);
      ok(`row ${arch.row}: its own (A₄, 8D) = (${f.A4}, ${f.k8D})`,
         f.A4 === arch.A4 && f.k8D === arch.k8D);
      ok(`row ${arch.row}: the rung holds it, and the designer finds it there`, own === arch.own);
    }
    const kx = kMaxFor(DATA, box, f.k8D + 6).kMax;
    const scan = designScale(L, DATA, box, { kMax: Math.max(kx, f.k8D), needW: false, verify: null });
    allRung &&= scan.design !== null && scan.design.t2 === t2 && scan.design.k === f.k8D;
  });
  ok("all five rows are found on their own rung, among their own rung's hits", allOwn);
  ok("and the walk over the rungs lands on that rung for all five", allRung);
}

/* ------------------------------------------------------------------ 3. the extremal control */

H("the extremal direction comes back out of the inverse machine");
{
  const box = inverseBox(1, 2, 125, 127, CONV);
  const b1 = INV.published.bands.find((b) => b.k8D === 1);
  const top = L.slots.map((s) => {
    const b = b1.top_content.find((x) => x.rep === s.rep &&
      (x.parities[0] > 0 ? "+" : "-") === s.key[1] && (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
    return b ? b.multiplicity : 0;
  });
  const f = forwardOf(L, top, box, DATA.gauge);
  ok(`the rung-1 ceiling's witness gives 1/R₅ = ${f.invR.toFixed(1)} GeV, the archived ${b1.top.toFixed(1)}`,
     Math.abs(f.invR - b1.top) < 1e-6 * b1.top);
  ok(`at (A₄, 8D) = (${f.A4}, ${f.k8D}) = the archived (${b1.top_A4}, 1)`,
     f.A4 === b1.top_A4 && f.k8D === 1);
  ok("and it is a FALSE vacuum by the W screen alone — which is why the ceiling has levels",
     f.W2 < 0);
  ok("the attained ceiling sits under the relaxation's LP bound", f.invR < b1.top_LP);
}

/* ------------------------------------------------------------------ 4. the certificates */

H("the certificate roster of every target in the design table");
{
  let allRosters = true;
  for (const e of INV.design_table) {
    const r = e.target_TeV * 1000;
    const box = inverseBox(r * 0.995, r * 1.005, 125.0, 127.0, CONV);
    const km = kMaxFor(DATA, box, INV.k_max);
    if (e.target_TeV === 3.0) {
      ok(`the 3.0 TeV target keeps the declared kMax = ${INV.k_max}: nothing can be shrunk below ` +
         `the lowest archived LP ceiling`, km.kMax === e.kmax && !km.shrunk);
      continue;                       /* its rungs hold ~10^7 contents; the archive says so too */
    }
    ok(`${e.target_TeV} TeV scans to 8D ≤ ${e.kmax}, from the LP ceilings alone`, km.kMax === e.kmax,
       `got ${km.kMax}`);
    if (e.verdict !== "no-go") continue;
    const res = designScale(L, DATA, box, { kMax: km.kMax, needW: true, verify: null });
    const same = JSON.stringify(res.certs) === JSON.stringify(e.certificates);
    allRosters &&= same;
    ok(`${e.target_TeV} TeV: roster ${JSON.stringify(res.certs)}`, same,
       `archive ${JSON.stringify(e.certificates)}`);
    ok(`${e.target_TeV} TeV: no design, and the roster PROVES it`, res.design === null && isProved(res));
  }
  ok("every no-go roster in the table is reproduced exactly", allRosters);
}

H("the designs the table delivers");
{
  for (const e of INV.design_table.filter((x) => x.verdict === "design")) {
    const r = e.target_TeV * 1000;
    const box = inverseBox(r * 0.995, r * 1.005, 125.0, 127.0, CONV);
    const km = kMaxFor(DATA, box, INV.k_max);
    const res = designScale(L, DATA, box, { kMax: km.kMax, needW: true, verify: verifyExact,
                                            tries: 12 });
    ok(`${e.target_TeV} TeV: a design at (A₄, 8D) = (${e.A4}, ${e.k8D}) of ${e.size} multiplets`,
       res.design !== null && res.design.t2 === 2 * e.A4 && res.design.k === e.k8D &&
       res.design.size === e.size,
       res.design ? `got (${res.design.t2 / 2}, ${res.design.k}) size ${res.design.size}` : "no design");
    if (!res.design) continue;
    const f = forwardOf(L, res.design.mult, box, DATA.gauge);
    ok(`   its 1/R₅ = ${f.invR.toFixed(1)} GeV, the archived ${e.invR.toFixed(1)}`,
       Math.abs(f.invR - e.invR) < 1e-6 * e.invR);
    ok("   its content is the archived one, multiplet for multiplet",
       res.design.mult.every((v, j) => v === e.content[j]),
       `${JSON.stringify(res.design.mult)} vs ${JSON.stringify(e.content)}`);
    ok("   and the exact potential agrees the electroweak point is the vacuum", !!res.design.exact);
  }
}

/* ------------------------------------------------------------------ 5. falsifying them */

H("the certificates, FALSIFIED — a rung a bound kills is also enumerated whole");
{
  /* the 6.0 TeV target is the one whose roster carries all three cheap kinds */
  const box = inverseBox(5970, 6030, 125.0, 127.0, CONV);
  const { rungs } = rungsFor(L, box, 3);
  let checked = 0, wrong = 0, kinds = new Map();
  for (const [t2, k] of rungs) {
    const d = decideRung(L, DATA, t2, k, box, { needW: true });
    if (d.ok) continue;
    kinds.set(d.cert, (kinds.get(d.cert) || 0) + 1);
    if (d.cert !== "dual" && d.cert !== "rung") continue;
    /* brute force: enumerate the WHOLE rung and confirm nothing lands in the box */
    const w = gWindow(L, t2, k, box);
    let landed = 0;
    if (w) contentsAt(L, t2, k, (n, G, W2) => { if (G >= w.gLo && G <= w.gHi && W2 > 0) landed++; return false; });
    checked++;
    if (landed) wrong++;
  }
  ok(`${checked} rung(s) closed by a bound, and brute force finds none of them occupied`,
     checked > 0 && wrong === 0, `${wrong} were occupied`);
  ok(`and the roster of that target uses more than one kind of reason ` +
     `(${[...kinds].map(([c, n]) => c + "×" + n).join(", ")})`, kinds.size >= 2);
}

H("a certificate that could be a rounding artefact is not issued");
{
  ok(`the Farkas margin must exceed ${DUAL_TOL} in G before the page calls it a proof`,
     DUAL_TOL > 0 && DUAL_TOL < 1e-3);
  /* and the bound itself has to be a bound: at every rung of a real content, the content's own G
   * is at or above the cone minimum and at or below the cone maximum */
  const b1 = INV.published.bands.find((b) => b.k8D === 1);
  let violations = 0, seen = 0;
  const t2 = 2 * b1.bottom_A4;
  contentsAt(L, t2, 1, (n, G) => {
    seen++;
    const cb = gConeBounds(L, DATA, t2, 1);
    if (cb && cb.min && G < cb.min.G - 1e-6) violations++;
    if (cb && cb.max && G > cb.max.G + 1e-6) violations++;
    return seen >= 400;
  });
  ok(`${seen} real contents at (A₄, 8D) = (${b1.bottom_A4}, 1) all lie inside the Farkas bounds`,
     seen > 0 && violations === 0, `${violations} outside`);
}

/* ------------------------------------------------------------------ 6. the reachable set */

H("the clusters and the gap, as the section will draw them");
{
  const R = reachableSet(DATA, "published");
  ok("four bands on the published seed, 8D = 1, 3, 5, 7",
     R.bands.map((b) => b.k8D).join(",") === "1,3,5,7");
  /* THEY DO NOT ALL SEPARATE, and that is the paper's own sentence: the intervals overlap low
   * down and separate high up.  Asserting "no band overlaps" passed nothing and would have been
   * a claim the runs contradict -- rungs 5 and 7 do overlap.  What is true, and what the gap is
   * made of, is that the top two are apart. */
  ok("every band's ceiling falls with the rung", R.bands.every((b, i) => i === 0 || b.top < R.bands[i - 1].top));
  ok("the top two bands are DISJOINT — which is what leaves a gap between them",
     R.bands[1].top < R.bands[0].bottom);
  ok("and the bottom two OVERLAP, as the paper says they do low down",
     R.bands[3].top > R.bands[2].bottom);
  ok(`the gap is [rung-3 ceiling, rung-1 floor] = (${(R.gap.lo / 1000).toFixed(3)}, ` +
     `${(R.gap.hi / 1000).toFixed(3)}) TeV`,
     Math.abs(R.gap.lo - R.bands[1].top) < 1e-6 && Math.abs(R.gap.hi - R.bands[0].bottom) < 1e-6);
  ok(`and it is ${Math.round(R.gap.width)} GeV wide`,
     Math.abs(R.gap.width - (R.gap.hi - R.gap.lo)) < 1e-6);
  const inner = R.ladder.map((l) => l.hi - l.lo);
  ok("wider than any true-vacuum window it separates", R.gap.width > Math.max(...inner));
  const C = reachableSet(DATA, "candidate");
  ok("the candidate seed has its own two bands and its own gap",
     C.bands.map((b) => b.k8D).join(",") === "2,4" && C.gap.width > 0);
  ok("its gap is narrower than the published one, and both are stated",
     C.gap.width < R.gap.width);
}

H("A CLUSTER IS NOT AN INTERVAL: the two rungs a page can resolve, enumerated whole");
{
  const box = inverseBox(1, 2, 125.0, 127.0, CONV);
  const R = reachableSet(DATA, "published");
  const got = {};
  for (const b of R.bands.filter((x) => x.enumerated <= 4000000)) {
    const t0 = Date.now();
    const p = rungPoints(L, b.k8D, b.A4_cap, box, { cap: 5000000 });
    got[b.k8D] = p;
    ok(`8D = ${b.k8D}: ${p.built.toLocaleString("en")} contents built in ${Date.now() - t0} ms, ` +
       `${p.inWindow} in the window — the archived ${b.in_window}`, p.inWindow === b.in_window);
    ok(`   and they land on only ${p.n} DISTINCT scales: the image of a rung is a finite set, ` +
       `not the interval its two tabulated ends suggest`, p.n > 0 && p.n < p.inWindow / 10);
    ok(`   its least is ${p.lo.toFixed(2)} GeV and its greatest ${p.hi.toFixed(2)}, the archived ` +
       `band ends`, Math.abs(p.lo - b.bottom) < 1e-6 && Math.abs(p.hi - b.top) < 1e-6);
    ok(`   spacing: mean ${p.spacing.mean.toFixed(2)}, min ${p.spacing.min.toFixed(2)}, ` +
       `max ${p.spacing.max.toFixed(2)} GeV`, p.spacing.max > p.spacing.min && p.spacing.min > 0);
    ok("   nothing was capped, so the set is the whole set", !p.capped);
  }
  /* the two numbers the paper's abstract stands on, recomputed rather than quoted */
  ok("rung one is 35 points about 31.5 GeV apart — the paper's own count",
     got[1].n === 35 && Math.abs(got[1].spacing.mean - 31.5) < 0.1, JSON.stringify(got[1].spacing));
  ok("rung one's widest interior gap is 59.44 GeV, rung three's 30.83",
     Math.abs(got[1].spacing.max - 59.44) < 0.01 && Math.abs(got[3].spacing.max - 30.83) < 0.01);
  const worst = Math.max(got[1].spacing.max, got[3].spacing.max);
  ok(`so the certified gap is ${(R.gap.width / worst).toFixed(0)}× the widest gap INSIDE either ` +
     `cluster — the comparison that makes it a result rather than the disconnection any finite ` +
     `set has for free`, Math.round(R.gap.width / worst) === 45);
  /* and the point set must not be a rounding artefact of the de-duplication */
  ok("distinct points are genuinely distinct: consecutive ones differ by more than 1 GeV",
     got[1].points.every((p, i) => i === 0 || p.invR - got[1].points[i - 1].invR > 1));
  ok("and every point is realised by at least one content, several by many",
     got[1].points.every((p) => p.n >= 1) && got[1].points.some((p) => p.n > 1) &&
     got[1].points.reduce((a, p) => a + p.n, 0) === got[1].inWindow);

  /* A CAPPED SWEEP MUST SAY SO, and this is not hypothetical: the section's first version left
   * the default cap at 1.5 million, rung three stopped at 54 points instead of 65, and the panel
   * printed the number without printing the cut.  A short answer that looks complete is worse
   * than no answer, so the flag is tested rather than trusted. */
  const short = rungPoints(L, 3, R.bands[1].A4_cap, box, { cap: 1500000 });
  ok("a sweep stopped by its budget reports itself capped, and comes back SHORT",
     short.capped === true && short.n < got[3].n && short.inWindow < got[3].inWindow,
     `capped=${short.capped}, ${short.n} points vs ${got[3].n}`);
  ok("...and the complete one does not claim to be capped", got[3].capped === false);
}

H("nothing in the gap — the headline, put to the machine");
{
  /* a target in the middle of the gap must come back a PROVED no-go, and on the published seed
   * the reason is the floor: identity (II) asking for an A_4 below the empty content */
  for (const tev of [7.0, 7.5, 8.0]) {
    const r = tev * 1000;
    const box = inverseBox(r * 0.995, r * 1.005, 125.0, 127.0, CONV);
    const km = kMaxFor(DATA, box, INV.k_max);
    const res = designScale(L, DATA, box, { kMax: km.kMax, needW: true, verify: null });
    ok(`${tev} TeV sits in the gap: no content, and the roster is a proof ` +
       `(${JSON.stringify(res.certs)})`, res.design === null && isProved(res));
  }
  /* and the machine must NOT say that about a scale the model does reach */
  const box = inverseBox(8960, 8975, 125.0, 127.0, CONV);
  const res = designScale(L, DATA, box, { kMax: 1, needW: true, verify: null });
  ok("but 8.97 TeV — the measured-mass point — is reached, so the no-go is not vacuous",
     res.design !== null, JSON.stringify(res.certs));
}

/* ------------------------------------------------------------------ 7. the seed */

H("the same code answers on the candidate seed");
{
  const cand = inverseLattice(DATA, DATA.gauge_seeds.candidate.gauge);
  const C = reachableSet(DATA, "candidate");
  const b = C.bands.find((x) => x.k8D === 2);
  const top = cand.slots.map((s) => {
    const m = b.top_content.find((x) => x.rep === s.rep &&
      (x.parities[0] > 0 ? "+" : "-") === s.key[1] && (x.parities[1] > 0 ? "+" : "-") === s.key[3]);
    return m ? m.multiplicity : 0;
  });
  const box = inverseBox(1, 2, 125, 127, CONV);
  const f = forwardOf(cand, top, box, DATA.gauge_seeds.candidate.gauge);
  ok(`the candidate rung-2 ceiling's witness gives ${f.invR.toFixed(1)} GeV, archived ${b.top.toFixed(1)}`,
     Math.abs(f.invR - b.top) < 1e-6 * b.top);
  ok(`at 2A₄ = ${b.top_t2}, which is ODD — A₄ is half-integral on this seed`,
     Math.round(2 * f.A4) === b.top_t2 && b.top_t2 % 2 === 1);
  ok("its 8D is even, so Theorem 1's hypothesis is not met and the rungs are the even ones",
     f.k8D % 2 === 0 && f.k8D === 2);
  ok("the enumeration at that point contains the witness itself", (() => {
    let found = false;
    contentsAt(cand, b.top_t2, 2, (n) => { if (n.every((v, j) => v === top[j])) { found = true; return true; } return false; });
    return found;
  })());
}

/* ------------------------------------------------------------------ 8. anti-vacuity */

H("anti-vacuity: every named certificate is one this page can actually issue");
{
  /* THE WALK NEVER EMITS `cone` OR `congruence`, and that is by construction rather than by luck:
   * `rungsFor` filters both out before a rung is ever visited, so the roster of a target never
   * carries them -- and the archived rosters do not either.  They are issued when a reader probes
   * a lattice point directly, which the section lets them do, so they are tested that way. */
  const box0 = inverseBox(8960, 8975, 125.0, 127.0, CONV);
  const { rungs } = rungsFor(L, box0, 3);
  ok("the walk pre-filters the cone and the congruence: no rung it hands out violates either",
     rungs.every(([t2, k]) => congruenceOK(t2, k) && inCone(L, t2, k)) && rungs.length > 0);
  ok("`congruence` fires on a point that breaks the mod-6 law",
     decideRung(L, DATA, 2 * 104 + 2, 1, box0).cert === "congruence");
  ok("`cone` fires below the gauge seed — the empty content is the bottom of the cone",
     decideRung(L, DATA, L.base.t2 - 2, 1, box0).cert === "cone");
  /* and the cone is not everything-is-outside: the rung-1 floor is a point inside it.  The first
   * version of this asserted the point one step ABOVE the seed was inside, which it is not --
   * at 8D = 1 the cone needs an A_4 of tens, not one.  A predicate that says no to everything
   * would have passed the half that was written. */
  ok("...and a real content's own rung IS inside it",
     inCone(L, 2 * INV.published.bands[0].bottom_A4, 1));

  /* the other three, from the walks that produce them */
  const seen = new Set();
  const gapBox = inverseBox(7465, 7535, 125.0, 127.0, CONV);
  if (rungsFor(L, gapBox, 1).floor) seen.add("floor");
  const r95 = designScale(L, DATA, inverseBox(9452.5, 9547.5, 125.0, 127.0, CONV),
                          { kMax: 1, needW: true, verify: null });
  Object.keys(r95.certs).forEach((c) => seen.add(c));
  /* the Farkas bound is the one that only fires deep down, where a rung's A_4 runs to the
   * hundreds; a small scan budget keeps the walk cheap because `dual` is decided BEFORE any
   * enumeration -- which is the whole point of having it */
  const low = inverseBox(2985, 3015, 125.0, 127.0, CONV);
  let duals = 0;
  for (const [t2, k] of rungsFor(L, low, INV.k_max).rungs) {
    const d = decideRung(L, DATA, t2, k, low, { needW: true, capScan: 2000 });
    if (!d.ok) { seen.add(d.cert); if (d.cert === "dual") duals++; }
  }
  for (const c of ["floor", "dual", "exhaustion", "rung"])
    ok(`'${c}' occurs`, seen.has(c), [...seen].join(","));
  ok(`the Farkas bound closes ${duals} rung(s) of the 3 TeV target without enumerating one content`,
     duals > 0);
  ok("and `budget` is reported there too — the machine saying it stopped, not that there is none",
     seen.has("budget"));
}

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

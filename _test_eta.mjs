/* _test_eta.mjs — the eta-meter, tested against something outside itself.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * The lesson this port paid for twice: internal consistency cannot detect the wrong object.  So the
 * load-bearing checks here are the two that can fail from outside --
 *
 *   1. L_1 and L_2 against the values the published tool prints, which were computed elsewhere;
 *   2. the closed form against the brute-force Hessian difference, which shares no line of code
 *      with it (one reads a box and multiplies; the other sums windings and differentiates).
 *
 * Everything else is scaffolding.  Anti-vacuity is explicit: the blindness test would pass trivially
 * if the engine returned zero for everything, so it also demands a NON-zero response from a sighted
 * content computed by the same call.
 */
import { readFileSync } from "node:fs";
import { lodd, momentsOfBox, contentMoments, predict, sweepEta, etaModule,
         atlas, atlasGrid, etaSilent, tileDiff, spectralSignatures } from "./src/modules/eta.mjs";
import { PERIODS, spectrum, lattice, V } from "./src/kernel/wilson.mjs";
import { selectionModule } from "./src/modules/selection.mjs";
import { resolve } from "./src/kernel/resolve.mjs";
import { complete, emptyModel } from "./src/kernel/model.mjs";

const D = JSON.parse(readFileSync("data/su4_ahmn.json", "utf8"));
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.log("  FAIL " + m)));
const near = (a, b, t, m) => ok(Math.abs(a - b) <= t, `${m}: ${a} vs ${b} (tol ${t})`);

const model = (bulk) =>
  complete({ ...emptyModel(), group: D.group, orbifold: { name: D.orbifold.name }, bulk }).model;
const run = (bulk) => resolve([selectionModule(D), etaModule(D)], model(bulk));
const AHMN = [{ rep: "(4,0,0)", parities: [1, 1], multiplicity: 3, eta: 1, role: 1 },
              { rep: "(1,0,1)", parities: [1, 1], multiplicity: 1, eta: 1, role: -1 }];

/* ---- 1. the constants, against numbers computed outside this repo ---- */
const [L1, L2] = lodd(D);
near(L1, 0.7249, 5e-5, "L1 against the published value");
near(L2, 2.6530, 5e-5, "L2 against the published value");
ok(L2 > L1, "L2 exceeds L1 -- the two directions are not interchangeable");
/* and they are SUMMED, not typed: change the lattice and they must move */
ok(lodd({ kmax: 3 })[0] !== L1, "L1 depends on the lattice, so it is being summed here");

/* ---- 2. the box moments ---- */
const [m0, m2, m4] = momentsOfBox([1, 0, 0], 1);
ok(m0 === 2, `M0 of a 2-box is its dimension: ${m0}`);
near(m2, 2 * 3 / 3, 1e-12, "M2 of a (1,0,0) box");
ok(momentsOfBox([0, 0, 0], 1)[1] === 0, "the trivial box has M2 = 0");
ok(momentsOfBox([2, 0, 0], 1)[1] > momentsOfBox([1, 0, 0], 1)[1], "a longer side raises M2");
/* linear in zeta, and zeta can flip the sign -- a moment is not a magnitude */
ok(momentsOfBox([1, 0, 0], -1)[1] === -m2, "M2 is linear in zeta, sign included");

/* ---- 3. THE CHECK: closed form against brute force ---- */
const r = run(AHMN), resp = r.values.get("eta_response");
ok(resp.status === "verified", `AHMN resolves: ${resp.status} ${resp.reason || ""}`);
const P = resp.value.predicted, M = resp.value.measured;
ok(resp.value.rel_error < 2e-4,
   `closed form against brute force: ${(100 * resp.value.rel_error).toFixed(4)} %`);
ok(Math.abs(P.dHxx) > 1 && Math.abs(P.dHyy) > 1,
   "anti-vacuity: the agreement is between numbers that are not zero");
ok(P.dHxy === 0, "dH_12 is zero exactly in the closed form");
ok(Math.abs(M.dHxy) < 1e-6, `and to machine precision in the brute force: ${M.dHxy}`);
/* the two are DIFFERENT computations: the closed form must not depend on the winding lattice */
ok(predict([{ key: "(4,0,0)", n: 3, eta: 1, role: 1 }], D).M2 ===
   predict([{ key: "(4,0,0)", n: 3, eta: 1, role: 1 }], { ...D, kmax: 4 }).M2,
   "M2 does not depend on kmax -- no winding is summed to get it");

/* ---- 4. linearity, and the sign of eta ---- */
const one = predict([{ key: "(4,0,0)", n: 1, eta: 1, role: 1 }], D);
const two = predict([{ key: "(4,0,0)", n: 2, eta: 1, role: 1 }], D);
near(two.M2, 2 * one.M2, 1e-9, "M2 is linear in multiplicity");
const flip = predict([{ key: "(4,0,0)", n: 1, eta: -1, role: 1 }], D);
near(flip.M2, -one.M2, 1e-9, "flipping eta flips M2");
near(flip.dHxx, -one.dHxx, 1e-9, "and flips the response");

/* ---- 5. blindness is not smallness ---- */
const blindName = (D.catalogue.find((c) => c.blind) || {}).name;
ok(!!blindName, "the catalogue declares at least one blind multiplet");
const blindRow = [{ rep: blindName, parities: [1, 1], multiplicity: 9, eta: 1, role: 1 }];
const rb = run(blindRow).values.get("eta_response");
ok(rb.status === "verified", `a declared-blind content still RESOLVES: ${rb.status} ${rb.reason || ""}`);
ok(rb.value.blind === true, "nine copies of a blind multiplet: still blind");
ok(rb.value.predicted.dHxx === 0 || Math.abs(rb.value.predicted.dHxx) < 1e-12,
   "the closed form says zero");
ok(Math.abs(rb.value.measured.dHxx) < 1e-9,
   `and the brute force agrees: ${rb.value.measured.dHxx}`);
/* raising the multiplicity 100x must not move it -- that is the whole claim */
const r100 = run([{ rep: blindName, parities: [1, 1], multiplicity: 30, eta: 1, role: 1 }]);
ok(Math.abs(r100.values.get("eta_response").value.measured.dHxx) < 1e-9,
   "thirty copies: still exactly zero");
/* ANTI-VACUITY: the same call on a sighted content must NOT be zero, or this proves nothing */
ok(Math.abs(resp.value.measured.dHxx) > 1,
   "anti-vacuity: the same measurement is non-zero on a sighted content");

/* ---- 6. a missing datum must never print as a physical statement ---- */
const noBox = { ...D, reps_box: { ...D.reps_box } };
delete noBox.reps_box["(4,0,0)"];
const rmiss = resolve([selectionModule(noBox), etaModule(noBox)], model(AHMN))
  .values.get("eta_response");
ok(rmiss.status === "unknown",
   `a rep with no box and no blindness flag is UNKNOWN, not blind: got ${rmiss.status}`);
ok(/no Part IV box/.test(rmiss.reason || ""), `and says why: ${rmiss.reason}`);
/* the distinction the first version got wrong: declared-blind is an ANSWER, missing is not */
const cm = contentMoments([{ key: blindName, n: 9, eta: 1, role: 1 }], D);
ok(cm.unresolved.length === 0, "a declared-blind rep is resolved, not unresolved");
ok(cm.any === true && cm.blindOnly === true, "and it is reported as blind-only");

/* ---- 7. the group boundary ---- */
const su7 = JSON.parse(readFileSync("data/su7_km25.json", "utf8"));
ok(!su7.reps_box, "the SU(7) file carries no boxes -- Part IV is an SU(4) result");
const r7 = etaModule(su7).compute({
  model: { bulk: [{ rep: "84", parities: [1, 1], multiplicity: 1 }] }, get: () => null });
ok(r7.eta_response.status === "unknown", "so SU(7) gets an unknown, not a number");
ok(/carries no Part IV boxes/.test(r7.eta_response.reason), `with the reason: ${r7.eta_response.reason}`);

/* ---- 8. no content ----
 * Two different unknowns, and the difference is the point of the dependency graph.  Through the
 * resolver an empty content never reaches this module at all: the selection rule has no domain to
 * offer, so eta is unknown for THAT reason and does not get to invent one.  The module's own
 * empty-content branch is reached only when it is called directly. */
const r0 = run([]).values.get("eta_response");
ok(r0.status === "unknown", "an empty content is unknown");
ok(/legal_domain/.test(r0.reason),
   `and the reason is the missing dependency, not eta's own: ${r0.reason}`);
const rdirect = etaModule(D).compute({ model: { bulk: [] }, get: () => null });
ok(rdirect.eta_response.status === "unknown" && /no bulk content/.test(rdirect.eta_response.reason),
   "called directly, the module reports the empty content itself");

/* ---- 9. the sweep: the published note's five contents become 119 ---- */
const W = sweepEta(D);
ok(W.tested === 119, `every representation with modes is swept: ${W.tested}`);
ok(W.sighted === 103 && W.blind === 16,
   `and split into sighted and blind: ${W.sighted} / ${W.blind}`);
ok(W.disagreements.length === 0,
   `closed form and winding sum agree on all of them: ${W.disagreements.join(", ")}`);
/* The published note records "<0.02 %" on five contents.  119 must not be worse. */
ok(W.worst < 2e-4,
   `worst relative error ${(100 * W.worst).toFixed(4)} % at ${W.worstRep}, on 24 times as many`);
ok(W.worstOffdiag < 1e-6, `the off-diagonal stays structurally zero: ${W.worstOffdiag}`);
/* THE SHARP ONE.  A blind rep's prediction is exactly zero, so the winding sum must measure zero --
 * not "small compared to something large", which is what a relative error would have hidden. */
ok(W.worstBlindResidue === 0,
   `every blind representation measures exactly zero: ${W.worstBlindResidue}`);
/* anti-vacuity, both directions: the sighted ones must be non-zero, and some of them large */
ok(W.rows.filter((r) => !r.blind && Math.abs(r.M2) > 0).length === W.sighted,
   "anti-vacuity: every sighted representation has a non-zero M2");
ok(W.rows.some((r) => !r.blind && Math.abs(r.M2) > 100),
   "and some are large, so the agreement is not between small numbers");

/* ---- the atlas ---------------------------------------------------------------------------
 *
 * A picture is the easiest thing in this repo to be wrong about, because a wrong one still looks
 * like a result.  So: the grid is checked against the Nyquist bound its own charges force, a tile
 * is checked against V itself, the blank tiles are checked against a prediction made BEFORE
 * drawing, and the same-box claim is checked as spectra rather than by eye.
 */
console.log("\n  the atlas:");
const AG = atlasGrid(D, 4);
ok(AG.nx > AG.need[0] && AG.ny > AG.need[1],
   `the tile grid is above Nyquist: ${AG.nx}x${AG.ny} against ${AG.need}`);
ok(AG.nx === 2 * AG.ny,
   `and 2:1, because the torus is: PERIODS = ${PERIODS} (a square tile squashes alpha_1 by two)`);
/* the bound has to BE a bound: one size down must fail it */
ok(!(AG.ny - 8 > AG.need[1]), "and the bound is tight enough to reject the next size down");

const AD = atlas(D, { mode: "D" }), AV = atlas(D, { mode: "V" });
console.log(`  ${AV.tiles.length} tiles · ${AD.silent} silent · ${AD.oddSame}/${AD.samePairs} ` +
            `same-box pairs share the odd spectrum, ${AD.evenSame} share the even one · ` +
            `truncation worst ${(100 * AV.control.worstTrunc).toFixed(4)} %`);

ok(AV.tiles.length === D.catalogue.length, "one tile per catalogue entry, none dropped");
ok(AV.control.ok && AD.control.ok, "both modes pass their own controls");
ok(AV.control.worstTrunc < 0.02 && AD.control.worstTrunc < 0.02,
   `|k| <= 4 instead of ${D.kmax} moves the normalised picture by at most ` +
   `${(100 * Math.max(AV.control.worstTrunc, AD.control.worstTrunc)).toFixed(4)} %`);

/* A TILE IS V, and the only way to know is to ask V. */
{
  const t = AV.tiles.find((x) => !x.flat && x.dim > 4);
  const sp = spectrum([{ key: t.key, n: 1, eta: 1, role: 1 }], D);
  const LT = lattice(4);
  let worst = 0;
  for (const [i, j] of [[0, 0], [7, 3], [31, 15], [63, 31], [17, 29]]) {
    const direct = V(sp, LT, PERIODS[0] * i / AG.nx, PERIODS[1] * j / AG.ny);
    worst = Math.max(worst, Math.abs(direct - t.v[j * AG.nx + i]));
  }
  ok(worst < 1e-12, `a tile is V on the same lattice, sample by sample (${t.key}, ${worst})`);
}

/* BLANK MUST BE PREDICTED, NOT DISCOVERED.  A tile that came out empty because the truncation lost
 * it would look exactly like a theorem, so the prediction comes from the modes. */
ok(AD.blankMismatch.length === 0,
   `every blank eta-difference tile was predicted from the modes: ${AD.blankMismatch.join("; ")}`);
ok(AD.tiles.filter((t) => t.flat).length === AD.silent && AD.silent === 16,
   `and there are ${AD.silent} of them, the sixteen the catalogue calls blind`);
ok(AD.flagMismatch.length === 0,
   `the catalogue's blind flag and the modes agree on all ${AD.tiles.length}: ${AD.flagMismatch.join(",")}`);
/* anti-vacuity: the flat test must be able to say NO */
ok(AD.tiles.filter((t) => !t.silent).every((t) => !t.flat) &&
   AD.tiles.filter((t) => !t.silent).length > 90,
   "and no multiplet that sees eta drew a blank one — the test can fail");
ok(AV.tiles.every((t) => !t.flat),
   "in V mode nothing is blank: blindness is about eta, not about having no landscape");
ok(D.catalogue.filter((c) => etaSilent(c.name, D)).length === 16,
   "etaSilent reads the modes, and finds the same sixteen without looking at the flag");

/* PART IV AS A PICTURE, and the half the page this came from had backwards. */
ok(AD.oddSame === AD.samePairs && AD.samePairs > 50,
   `same box => same eta-difference, on all ${AD.samePairs} pairs`);
ok(AD.evenSame < AD.samePairs / 2,
   `but NOT the same potential: only ${AD.evenSame} of ${AD.samePairs} pairs share the even ` +
   `spectrum, so "same box, same landscape" is false for V`);
/* and the consequence, measured on the pixels rather than on the spectra */
{
  const byBox = new Map();
  for (const t of AD.tiles) if (t.boxKey) (byBox.get(t.boxKey) || byBox.set(t.boxKey, []).get(t.boxKey)).push(t);
  const grp = [...byBox.values()].find((g) => g.length > 1);
  let dmax = 0;
  for (const t of grp.slice(1)) for (let n = 0; n < t.v.length; n++)
    dmax = Math.max(dmax, Math.abs(t.v[n] - grp[0].v[n]));
  ok(dmax < 1e-12,
     `and the tiles really are identical pixel for pixel (${grp.map((t) => t.key).join(", ")}: ${dmax})`);
  const gv = grp.map((t) => AV.tiles.find((x) => x.key === t.key));
  let vmax = 0;
  for (const t of gv.slice(1)) for (let n = 0; n < t.v.length; n++)
    vmax = Math.max(vmax, Math.abs(t.v[n] - gv[0].v[n]));
  ok(vmax > 1e-6, `while their potentials are visibly different pictures (${vmax.toExponential(2)})`);
}

/* ---- the tile diff: pixels held to spectra, on every same-box pair and on controls ---------- */
{
  console.log("\n  the tile diff");
  const byBox = new Map();
  for (const t of AD.tiles) if (t.boxKey) (byBox.get(t.boxKey) || byBox.set(t.boxKey, []).get(t.boxKey)).push(t.key);
  const pairs = [];
  for (const ks of byBox.values()) for (const k of ks.slice(1)) pairs.push([ks[0], k]);
  ok(pairs.length === AD.samePairs, `the diff walks the same ${AD.samePairs} same-box pairs the atlas counts`);
  /* mode D: identical pixels exactly when the odd spectra agree -- and that is all 73 */
  const dD = pairs.map(([a, b]) => tileDiff(AD, D, a, b));
  ok(dD.every((d) => d.agrees), "eta-difference mode: pixels agree with the odd spectra on every same-box pair");
  ok(dD.filter((d) => d.identical).length === AD.oddSame,
     `and the identical count IS the atlas's oddSame: ${dD.filter((d) => d.identical).length} vs ${AD.oddSame}`);
  /* mode V: identical exactly when BOTH spectra agree -- the 7, not the 73 */
  const dV = pairs.map(([a, b]) => tileDiff(AV, D, a, b));
  ok(dV.every((d) => d.agrees), "potential mode: pixels agree with odd+even spectra on every same-box pair");
  ok(dV.filter((d) => d.identical).length === AD.evenSame,
     `and the identical count IS the atlas's evenSame: ${dV.filter((d) => d.identical).length} vs ${AD.evenSame}`);
  ok(dV.some((d) => !d.identical && d.rel > 0.05),
     "anti-vacuity: a same-box pair whose potentials differ visibly exists");
  /* controls: a tile against itself, and the diff is antisymmetric */
  const self = tileDiff(AV, D, AV.tiles[0].key, AV.tiles[0].key);
  ok(self.identical && self.maxAbs === 0, "a tile against itself is identical with max 0");
  const ab = tileDiff(AV, D, AV.tiles[3].key, AV.tiles[9].key), ba = tileDiff(AV, D, AV.tiles[9].key, AV.tiles[3].key);
  ok(ab.maxAbs === ba.maxAbs && ab.lo === -ba.hi, "A - B is minus B - A, exactly");
  ok(tileDiff(AV, D, "no such tile", AV.tiles[0].key) === null, "an unknown key returns null, not a picture");
  const s = spectralSignatures(D, AV.tiles[0].key);
  ok(typeof s.odd === "string" && typeof s.even === "string", "signatures are strings, comparable by equality");
}

console.log(`\n_test_eta: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

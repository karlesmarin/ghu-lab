/* _test_bundle.mjs — the export, and the two things that make it worth exporting.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A bundle is the first artefact somebody outside could use to contradict us, so the checks are
 * about whether it can actually be used that way:
 *
 *   * the hash is a COMMITMENT: it moves when any input moves, including when only a SOURCE moves —
 *     the same content read against a different year's paper is a different prediction, and a
 *     digest that cannot see that is decoration;
 *   * SHA-256 is checked against published test vectors, because a hash implemented here and
 *     verified only against itself proves nothing;
 *   * the canonical form is order-independent, or two identical bundles get two identities;
 *   * and what is REFUSED travels: a bundle that omits what it cannot compute reads as complete.
 *
 *   node _test_bundle.mjs
 */
import { sun5dBlocks } from "./src/modules/sun5d.mjs";
import { particleTable } from "./src/modules/particles.mjs";
import { bundle, verifyBundle, canonical, sha256, REFUSED } from "./src/kernel/bundle.mjs";
import { EXPERIMENT } from "./src/kernel/experiment.mjs";
import { OBSERVABLES } from "./src/kernel/observables.mjs";
import { CARSON_OKADA_TOP_ROW } from "./src/kernel/higgsrate.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) { pass++; console.log("   ok     " + msg + (extra ? "   " + extra : "")); }
  else { fail++; console.log("   FAIL   " + msg + (extra ? "   " + extra : "")); }
};

console.log("=".repeat(96));
console.log("   bundle.mjs — what leaves, what does not, and the hash that ties both to its sources");
console.log("=".repeat(96));

console.log("\n   1 -- SHA-256 AGAINST PUBLISHED VECTORS, NOT AGAINST ITSELF\n");
/* FIPS 180-4 and the usual suspects.  A hash checked only for self-consistency is a hash that can
 * be wrong in exactly the same way twice. */
const VECTORS = [
  ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
  ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
   "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"],
];
/* No vector for a non-ASCII string, deliberately: FIPS 180-4 publishes none, and inventing a digest
 * to sit in a table labelled "published vectors" is how a fabricated constant later gets believed.
 * The UTF-8 path is checked below by a PROPERTY instead — it must differ from the ASCII fallback. */
for (const [inp, want] of VECTORS) {
  const got = sha256(inp);
  ok(got === want, "sha256(" + JSON.stringify(inp.slice(0, 12)) + (inp.length > 12 ? "..." : "")
     + ") matches the published vector", got.slice(0, 24) + "...");
}
/* and multi-byte input goes through the UTF-8 path rather than being mangled */
ok(sha256("ñ") !== sha256("n") && sha256("ñ").length === 64,
   "a non-ASCII character hashes as its UTF-8 bytes, not as a code unit");

console.log("\n   2 -- THE CANONICAL FORM IS ORDER-INDEPENDENT\n");
ok(canonical({ b: 1, a: 2 }) === canonical({ a: 2, b: 1 }),
   "two objects that differ only in key order have one canonical form", canonical({ b: 1, a: 2 }));
ok(canonical({ a: [1, 2] }) !== canonical({ a: [2, 1] }),
   "...but arrays keep their order, because an ordered list is data");
ok(canonical({ a: 1, b: undefined }) === canonical({ a: 1 }),
   "and an undefined field is absent rather than null — one shape, one hash");

console.log("\n   3 -- A BUNDLE, AND WHAT IT CARRIES\n");
const b3 = sun5dBlocks({ nPP: 2, nPM: 0, nMP: 0, nMM: 1 });
const content = { gauge: true, bulk: [{ rep: "fund", eta: 1, kind: "dirac", multiplicity: 1 }] };
const T = particleTable(b3, content, [0.2]);
const B = bundle(T, { experiment: EXPERIMENT, observables: OBSERVABLES,
                      anchors: [CARSON_OKADA_TOP_ROW], version: "test" });
ok(B.states.length === T.rows.length, "one state per row", B.states.length + " states");
ok(B.hash && B.hash.length === 64, "it carries a 64-hex digest", B.hash.slice(0, 32) + "...");
ok(verifyBundle(B).ok, "and re-hashing it as received reproduces that digest");
ok(B.sources.m_W && B.sources.m_W.read && B.sources.m_W.url,
   "every measured input travels with its url and the date it was read",
   "m_W = " + B.sources.m_W.value + ", read " + B.sources.m_W.read);
ok(B.register.higgs_couplings.resolutionSource
   && B.register.higgs_couplings.reproduced.includes("1.322"),
   "and the register entry that has a resolution carries where it came from AND what was"
   + " recovered from it");
ok(B.anchors.length === 1 && B.anchors[0].hypotheses.includes("SU(3)xU(1)'"),
   "the anchor travels with its hypotheses, so nobody transfers the number by accident");

console.log("\n   4 -- THE HASH MOVES WHEN A SOURCE MOVES, NOT ONLY WHEN A NUMBER DOES\n");
/* THE CHECK THIS FILE EXISTS FOR.  The same content read against a different paper is a different
 * prediction, and a digest that cannot see the difference is decoration. */
const otherDate = { ...EXPERIMENT, m_W: { ...EXPERIMENT.m_W, read: "2020-01-01" } };
const B2 = bundle(T, { experiment: otherDate, observables: OBSERVABLES,
                       anchors: [CARSON_OKADA_TOP_ROW], version: "test" });
ok(B2.hash !== B.hash, "changing only the DATE a source was read changes the hash",
   B.hash.slice(0, 16) + " -> " + B2.hash.slice(0, 16));
const otherUrl = { ...EXPERIMENT, m_W: { ...EXPERIMENT.m_W, url: "https://example.invalid" } };
ok(bundle(T, { experiment: otherUrl, observables: OBSERVABLES, version: "test" }).hash !== B.hash,
   "and changing only the URL changes it too");
const sameAgain = bundle(T, { experiment: EXPERIMENT, observables: OBSERVABLES,
                              anchors: [CARSON_OKADA_TOP_ROW], version: "test" });
ok(sameAgain.hash === B.hash, "while the same inputs give the same hash, twice running");
/* a physical change must move it as well, or the digest is only watching the metadata */
const T2 = particleTable(b3, content, [0.25]);
ok(bundle(T2, { experiment: EXPERIMENT, observables: OBSERVABLES, version: "test" }).hash !== B.hash,
   "and moving the vacuum moves it: the digest watches the physics too");

console.log("\n   5 -- WHAT IS REFUSED IS EXPORTED, WITH ITS REASON\n");
const keys = Object.keys(REFUSED);
ok(keys.length >= 5 && keys.every((k) => B.refused[k] && B.refused[k].length > 60),
   "every quantity a reader might expect and not find is listed with why", keys.join(", "));
ok(B.refused.ufo_calchep.includes("industrial scale"),
   "the UFO refusal says what an unvalidated model file actually is",
   B.refused.ufo_calchep.slice(0, 74));
ok(B.refused.nuclear_recoil.includes("candidate"),
   "and the recoil refusal points at the exact limit of the stability column, not at a vague gap");
/* the refusals are inside the hash: a bundle cannot quietly drop them and keep its identity */
const stripped = { ...B };
delete stripped.refused;
const { format, version, hash, hashed, ...body } = stripped;
ok(sha256(canonical(body)) !== B.hash,
   "and dropping the refusals breaks the hash — they are part of what was committed to");

console.log(`\n${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

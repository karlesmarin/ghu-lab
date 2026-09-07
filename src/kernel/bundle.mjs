/* bundle.mjs — the export: what leaves this instrument, what does not, and the hash that ties both
 * to the sources they came from.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHAT AN EXPORT IS FOR.  Everything else here is for us.  A bundle is the first artefact somebody
 * OUTSIDE could use to contradict us, and that is the only real test of the rest: a spectrum with
 * its channels, its parities and its scale, and — this is the half that usually goes missing — the
 * exact inputs and sources it came from, hashed, so that two people who disagree can first find out
 * whether they are talking about the same object.
 *
 * THE HASH COVERS THE SOURCES, NOT ONLY THE NUMBERS.  A digest over the boundary condition and the
 * content would be reproducible and useless: the same content against a different measured m_W, or
 * against a bound read from a different year's paper, is a different prediction.  So the canonical
 * form carries every measured input WITH its `read` date and url, and every observables entry with
 * its resolution and where the resolution came from.  Change the paper you read and the hash moves.
 *
 * WHAT IS REFUSED, AND IT IS EXPORTED TOO.  A bundle that silently omits what it cannot compute is
 * a bundle that reads as complete.  So `refused` is a first-class field: every quantity a reader
 * might expect, with the reason it is not here.  Widths, branching ratios and production rates need
 * a vertex normalisation and phase space that this instrument does not have; a UFO or CalcHEP model
 * needs those AND validation against a published cross-section, and an unvalidated UFO is a way to
 * publish wrong physics at industrial scale with a signature on it; a nuclear-recoil prediction
 * needs a stable dark-matter candidate, and stability here reaches "candidate" and stops.
 *
 * D3: no gauge group is named here.
 *
 * Pure functions.  No I/O, no globals, no DOM.
 */

/* ------------------------------------------------------------------ canonical form and digest */

/* Deterministic JSON: keys sorted at every depth, no whitespace.  Two runs that agree on the inputs
 * agree byte for byte, which is what makes the digest mean anything. */
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
}

/* SHA-256, in pure JavaScript because it has to run identically in the page and in the harness.
 * `crypto.subtle` is asynchronous and Node's `crypto` is not in the browser, and a provenance
 * digest that is computed differently in the two places is not a provenance digest.  This is a
 * COMMITMENT, not a change detector: a weaker hash would let two different sets of sources present
 * the same identity, which is exactly the failure a bundle exists to prevent. */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

export function sha256(str) {
  const bytes = utf8(str);
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
             0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const len = bytes.length, bitLen = len * 8;
  const padded = new Uint8Array((((len + 9) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296));
  const w = new Uint32Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return h.map((x) => x.toString(16).padStart(8, "0")).join("");
}

const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

function utf8(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.codePointAt(i);
    if (c > 0xffff) i++;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

/* ------------------------------------------------------------------ what does not travel */

export const REFUSED = {
  widths: "a decay width needs the vertex normalisation and phase space; this instrument has the"
    + " open CHANNELS and not the rate. An empty channel list is exported and is a theorem; a"
    + " number would not be one.",
  branching_ratios: "a ratio of widths, so it inherits the line above and adds nothing new to it",
  production_rates: "a cross-section needs parton distributions and the same vertex; the one rate"
    + " this repository has reproduced is Carson-Okada's R_gg for the top KK tower, which is a"
    + " RATIO to the Standard Model in one channel and is exported as such under `anchors`",
  ufo_calchep: "a machine-readable model file needs the widths above AND validation against a"
    + " published cross-section. An unvalidated UFO is a way to publish wrong physics at"
    + " industrial scale with a signature on it, so it does not leave here until at least one"
    + " point is checked against something printed",
  nuclear_recoil: "a direct-detection prediction needs a stable dark-matter candidate. The"
    + " stability column reaches `candidate` and stops: KK parity is checked as a necessary"
    + " condition and the compensating-gauge-transformation loophole at generic alpha is not",
};

/* ------------------------------------------------------------------ the bundle */

/* `table` is a particleTable; `experiment` and `observables` are the registries it was read
 * against, so their dates travel with it. */
export function bundle(table, { experiment = {}, observables = {}, anchors = [], version = "0" } = {}) {
  const inputs = {
    scale: table.scale.located
      ? { invR_GeV: round(table.scale.invRGeV), mWR: round(table.scale.mWR) }
      : { located: false, why: table.scale.why },
    levels: table.levels,
    kk_parity: { verdict: table.parity.verdict, why: table.parity.why },
  };

  /* every measured number this bundle stands on, WITH its provenance */
  const sources = {};
  for (const [k, v] of Object.entries(experiment)) {
    if (typeof v !== "object" || v === null || v.value === undefined) continue;
    sources[k] = { value: v.value, unit: v.unit, source: v.source, url: v.url, read: v.read,
                   hypothesis: v.hypothesis };
  }
  const register = {};
  for (const [k, e] of Object.entries(observables)) {
    register[k] = { channel: e.channel, resolution: e.resolution, resolutionOf: e.resolutionOf,
                    resolutionSource: e.resolutionSource, reproduced: e.reproduced,
                    hypothesis: e.hypothesis, missing: e.missing };
  }

  const states = table.rows.map((r) => ({
    origin: r.origin, rep: r.rep, twist: r.twist, copies: r.copies,
    level: r.level, offset: round(r.offset), mass_R: round(r.massR),
    mass_GeV: r.massGeV === null ? null : round(r.massGeV),
    kind: r.kind,
    kk_parity: r.stability ? (r.stability.kkParity ?? null) : null,
    channels: r.width ? { verdict: r.width.verdict,
                          conserving: r.width.conserving.length,
                          violating: r.width.violating.length } : null,
    couplings: Object.fromEntries(Object.entries(r.couplings || {})
      .map(([k, v]) => [k, v.verdict])),
  }));

  const body = { inputs, states, sources, register, anchors, refused: REFUSED };
  const text = canonical(body);
  return {
    format: "ghu-lab/bundle", version,
    hash: sha256(text),
    hashed: "sha-256 over the canonical form of everything below, sources and refusals included",
    ...body,
  };
}

const round = (x) => (typeof x === "number" ? Number(x.toPrecision(10)) : x);

/* Re-hash a bundle as received and compare: the check a reader runs, and the reason the field is
 * worth carrying.  Returns { ok, expected, got }. */
export function verifyBundle(b) {
  const { format, version, hash, hashed, ...body } = b;
  const got = sha256(canonical(body));
  return { ok: got === hash, expected: hash, got };
}

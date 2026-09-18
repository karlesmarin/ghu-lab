/* _test_card.mjs — the provenance of the thing that LEAVES the tool.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `_test_kernel.mjs` already checks what `makeCard` DOES: it echoes the input, flags the defaults,
 * stamps the model id, tallies the statuses, carries the author and diffs against itself.  None of
 * that was the hole.
 *
 * THE HOLE WAS THE OPPOSITE SHAPE.  `kernelHash` defaulted to null and `toText` printed the line
 * only if it was present, so an absent fingerprint was invisible — and the harness itself passed a
 * fake one (`"deadbeef"`), which is precisely why nobody noticed that the REAL call sites passed
 * none.  Counted on 2026-09-18: 17 of 17 sections passed `version` and `build`, zero passed a
 * hash.  A card said which tool and which build; none said which arithmetic.
 *
 * So this harness does not test the function harder.  It tests the SEAM between the function and
 * its callers, which is where the drift lived:
 *
 *   1. the contract   — no hash, no card.  The guard must fire, on absence and on rubbish.
 *   2. the call sites — every makeCard() in src/ passes kernelHash, scanned from disk.
 *   3. the build      — build_app.py defines kernel_hash() and emits const KERNEL_HASH.
 *   4. anti-vacuity   — the scanner catches a call site that omits it.  A control that cannot
 *                       fail is not a control.
 *
 *   node _test_card.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { makeCard, toText } from "./src/kernel/card.mjs";
import { emptyModel } from "./src/kernel/model.mjs";
import { val, STATUS } from "./src/kernel/status.mjs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? "  — " + detail : ""}`); }
};
const throws = (name, fn, match) => {
  try { fn(); ok(name, false, "did not throw"); }
  catch (e) { ok(name, !match || String(e.message).includes(match), `message was: ${e.message}`); }
};
const H = (s) => console.log(`\n${s}`);

const M = { ...emptyModel(), group: "SU(7)" };
const V = { x: val(1.5, { units: "GeV", status: STATUS.MEASURED, source: "a harness constant" }) };
const HASH = "0123456789abcdef";

/* ------------------------------------------------------------------- 1. the contract */
H("1. no hash, no card");
throws("absent kernelHash is refused", () => makeCard(M, V, { version: "t", build: "b" }),
       "kernelHash is required");
throws("null kernelHash is refused", () => makeCard(M, V, { kernelHash: null }),
       "kernelHash is required");
throws("a non-string kernelHash is refused", () => makeCard(M, V, { kernelHash: 12345 }),
       "kernelHash is required");
throws("an empty string is refused too", () => makeCard(M, V, { kernelHash: "" }),
       "kernelHash is required");

const card = makeCard(M, V, { version: "0.2.0", build: "2026-09-18 00:00", kernelHash: HASH });
ok("a card with a hash is built", card.provenance.kernel_hash === HASH);

H("and the text form always prints it");
const txt = toText(card);
ok("the kernel line is in the text", txt.includes(`kernel     ${HASH}`));
/* It used to be conditional.  A line that appears only when the value is there cannot be missed
 * by a reader, which is exactly how the value went missing for seventeen call sites. */
ok("the tool and version line is there too", txt.includes("0.2.0"));
ok("and the build", txt.includes("2026-09-18 00:00"));

H("no value is silently dropped on the way to text");
/* Found on 2026-09-18 by exporting a real SU(7) card and reading it: five of its nineteen rows
 * printed `[object Object]`.  Not a wrong number — a missing one, in the form a reader pastes
 * into an email, while the JSON beside it was complete.  Two exports that disagree, and only one
 * of them ever read. */
const structured = makeCard(M, {
  n: val(3, { units: "", status: STATUS.THEOREM, source: "a count" }),
  coords: val({ A4: -18, D8: -27, W: -1.5 },
              { status: STATUS.THEOREM, source: "five complete invariants" }),
  list: val([1, -2, 3], { status: STATUS.MEASURED, source: "a term table" }),
  flag: val(true, { status: STATUS.MEASURED, source: "a grid" }),
}, { version: "t", kernelHash: HASH });
const stxt = toText(structured);
ok("an object value is not printed as [object Object]", !stxt.includes("[object Object]"));
ok("its fields survive into the text", stxt.includes('"A4":-18') && stxt.includes('"W":-1.5'));
ok("an array value survives too", stxt.includes("[1,-2,3]"));
ok("a plain number is still plain", /\bn\s+3\b/.test(stxt), stxt.split("\n").find((l) => /\bn\s/.test(l)));
ok("and a boolean is still readable", /\bflag\s+true\b/.test(stxt));

H("the provenance block is complete, field by field");
for (const k of ["tool", "version", "build", "kernel_hash", "model_id", "authors", "assistant"])
  ok(`provenance.${k} is present`, card.provenance[k] !== undefined && card.provenance[k] !== null,
      JSON.stringify(card.provenance[k]));
ok("it survives a JSON round trip",
   JSON.parse(JSON.stringify(card)).provenance.kernel_hash === HASH);

H("two runs of different kernels are distinguishable");
const other = makeCard(M, V, { version: "0.2.0", build: "2026-09-18 00:00",
                               kernelHash: "fedcba9876543210" });
ok("a different hash gives a different card", other.provenance.kernel_hash !== HASH);
ok("and the same input otherwise gives the same model id",
   other.provenance.model_id === card.provenance.model_id);

/* --------------------------------------------------------------- 2. the real call sites */
H("2. every makeCard() in src/ passes kernelHash");

/* Reads the sources rather than the built page on purpose: the built page is an artefact, and a
 * gate that measures the artefact tells you a section drifted only AFTER someone rebuilt. */
function callSites() {
  const out = [];
  for (const [dir, files] of [
    ["src/sections", readdirSync("src/sections").filter((f) => f.endsWith(".js"))],
    ["src/shell", readdirSync("src/shell").filter((f) => f.endsWith(".js"))],
  ]) {
    for (const f of files) {
      const src = readFileSync(`${dir}/${f}`, "utf8");
      let i = -1;
      while ((i = src.indexOf("makeCard(", i + 1)) !== -1)
        out.push({ file: `${dir}/${f}`, line: src.slice(0, i).split("\n").length,
                   window: src.slice(i, i + 400) });
    }
  }
  return out;
}

const sites = callSites();
ok("there are call sites to check at all", sites.length >= 15, `found ${sites.length}`);
const sinHash = sites.filter((s) => !s.window.includes("kernelHash"));
ok(`all ${sites.length} call sites pass kernelHash`, sinHash.length === 0,
   sinHash.map((s) => `${s.file}:${s.line}`).join(", "));
const sinVersion = sites.filter((s) => !s.window.includes("version"));
ok("and all of them pass a version", sinVersion.length === 0,
   sinVersion.map((s) => `${s.file}:${s.line}`).join(", "));

/* ------------------------------------------------------------------------ 3. the build */
H("3. the build produces the hash the sections spend");
const builder = readFileSync("build/build_app.py", "utf8");
ok("build_app.py defines kernel_hash()", /def kernel_hash\(\)/.test(builder));
ok("and emits const KERNEL_HASH into the engine", /const KERNEL_HASH = "/.test(builder));
ok("the digest covers kernel AND modules",
   /\("kernel", KERNEL\), \("modules", MODULES\)/.test(builder));
ok("and it names the file before its bytes, so a rename moves it",
   /h\.update\(name\.encode/.test(builder));

/* ------------------------------------------------------- 3b. the shipped page, end to end */
H("3b. the fingerprint in the built page is the digest of the sources it was built from");

/* A WRONG FINGERPRINT IS WORSE THAN NONE.  An absent hash says "unknown"; a stale one says
 * "this arithmetic", falsely, and a reader comparing two cards would conclude the engine had not
 * moved when it had.  So the check is not that the page HAS a hash — it is that the hash equals
 * the digest of the files on disk, recomputed here from the same declaration the builder reads. */
function declaredList(py, name) {
  const m = new RegExp(`^${name} = \\[(.*?)\\]`, "ms").exec(py);
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
}
const KERNEL = declaredList(builder, "KERNEL");
const MODULES = declaredList(builder, "MODULES");
ok("the KERNEL and MODULES lists are readable from the builder",
   !!(KERNEL && MODULES && KERNEL.length && MODULES.length),
   `${KERNEL ? KERNEL.length : "—"} kernel, ${MODULES ? MODULES.length : "—"} modules`);

let built = null;
try { built = readFileSync("app/index.html", "utf8"); } catch { /* reported below */ }
/* Not a skip.  This harness is run by the build, after the page exists; if it is missing, that
 * is a fact to report, never a silence to read as a pass. */
ok("the built page is there to check", built !== null,
   "app/index.html not found — run: python build/build_app.py");

if (built && KERNEL && MODULES) {
  const declared = /const KERNEL_HASH = "([0-9a-f]{16})";/.exec(built);
  ok("the page declares a 16-hex fingerprint", !!declared, declared ? declared[1] : "(absent)");
  const { createHash } = await import("node:crypto");
  const h = createHash("sha256");
  for (const [sub, names] of [["kernel", KERNEL], ["modules", MODULES]])
    for (const name of names) {
      h.update(Buffer.from(name, "utf8"));
      h.update(Buffer.from([0]));
      h.update(readFileSync(`src/${sub}/${name}`));
    }
  const recomputed = h.digest("hex").slice(0, 16);
  ok("and it equals the digest of the sources on disk",
     !!declared && declared[1] === recomputed,
     `page ${declared ? declared[1] : "—"} vs sources ${recomputed}`);

  /* And it must actually MOVE. A constant that never changes is not a fingerprint. */
  const h2 = createHash("sha256");
  h2.update(Buffer.from(KERNEL[0], "utf8"));
  h2.update(Buffer.from([0]));
  h2.update(Buffer.concat([readFileSync(`src/kernel/${KERNEL[0]}`), Buffer.from("// x")]));
  ok("one edited byte in one kernel file moves it",
     h2.digest("hex").slice(0, 16) !== recomputed);
}

/* ------------------------------------------------------------------- 4. anti-vacuity */
H("4. the scanner can fail");
const falso = [{ file: "src/sections/fake_section.js", line: 1,
                 window: "makeCard({ group: 'x' }, values, { version: VERSION, build: BUILD })," }];
ok("a synthetic call site without the hash is caught",
   falso.filter((s) => !s.window.includes("kernelHash")).length === 1);
const falso2 = [{ file: "src/sections/fake2_section.js", line: 1,
                  window: "makeCard(m, v, { version: VERSION, build: BUILD, kernelHash: KERNEL_HASH })," }];
ok("and one with it is not", falso2.filter((s) => !s.window.includes("kernelHash")).length === 0);

/* "N ok", not "N passed": build_app.py tallies the README's number with
 * /(\d+)\s+(?:ok\b|checks pass)/ over the last line, so a harness that says "passed" contributes
 * ZERO to it.  This one did, and the published count moved by 3 when 36 checks had been added. */
console.log(`\n_test_card: ${pass} ok, ${fail} failed`);
process.exit(fail ? 1 : 0);

/* extremes.mjs — put the instrument in the states nobody ever puts it in, and see whether it
 * still tells the truth.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHERE THIS HOUSE'S BUGS HAVE ACTUALLY BEEN.  Not in the mathematics — the harnesses are brutal
 * about the mathematics.  They have been in the branch nobody visits: the supply table whose
 * absolving half had never fired; the catalogue column that was pure display and wrong on 104 of
 * 104 rows; `clean` coming back true about a model with no fermion in it; a `dressable` list whose
 * empty case was truthful and whose printed verdict was not.  Every one of those was reachable in
 * two clicks and had simply never been reached.
 *
 * SO THIS DRIVES THE UNVISITED STATES, ON PURPOSE, AND ASKS ONE QUESTION OF EACH: does anything
 * on the page read like a bug?  Not "is the number right" — that is what the harnesses are for,
 * and they compare against outside computations.  This asks the cheaper and completely different
 * question a reader asks in one glance:
 *
 *   - did anything throw, or warn, in the console;
 *   - does any rendered text contain `NaN`, `undefined`, `[object Object]`, `Infinity`, `null`
 *     or an unresolved `${...}` — the six ways a template literal tells you it was handed
 *     something it did not expect;
 *   - did every section still render something at all, rather than an empty shell;
 *   - and did any verdict box come back with its placeholder dash still in it, which is the
 *     signature of a render that ran and decided nothing.
 *
 * THE STATES, and each is chosen because a gate avoids it rather than at random:
 *
 *   empty        every family cleared — no bulk content at all.  The harnesses always hand a
 *                content in; the page's "no subject" branches are almost never exercised.
 *   one          a single multiplet, the smallest model that is not empty.
 *   full         every slot at its maximum.  Nothing in the tree ever runs at the ceiling.
 *   bc-*         boundary conditions at the corners of the block simplex: everything in one
 *                letter (nothing is broken), everything in the last letter, one index per letter,
 *                and a large N — the SU(N) builder advertises SU(23) in its own header and no
 *                harness has ever asked the PAGE for one.
 *
 * Widths too: a phone and a wide desktop, because a state that only breaks at 360px is a state
 * that only breaks for the reader who has a phone.
 *
 *   node build/extremes.mjs            # every state, every section
 *   node build/extremes.mjs --only sun5d,brane
 *
 * Exit code 1 if anything was found.  It is a hunt, not a proof: a clean run means these states
 * did not produce the symptoms above, not that they are right.
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const ONLY = (argv[argv.indexOf("--only") + 1] || "").split(",").filter(Boolean);
const PAGE = "file:///" + path.join(ROOT, "app", "index.html").replace(/\\/g, "/");
const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9338;
const USERDIR = path.join(ROOT, ".shoot-profile-extremes");
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(USERDIR, { recursive: true });
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run", "--disable-gpu",
  "--window-size=1440,1000", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target = null;
for (let i = 0; i < 60 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
          .find((x) => x.type === "page"); } catch { /* not up */ }
  if (!target) await sleep(250);
}
if (!target) { console.error("chromium never answered"); process.exit(2); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const waiting = new Map(), events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  else if (msg.method) events.push(msg);
};
const send = (method, params = {}) => new Promise((res) => {
  const n = ++id;
  waiting.set(n, (m) => res(m.result ?? m.error));
  ws.send(JSON.stringify({ id: n, method, params }));
});
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
const js = async (expr) => {
  const r = await send("Runtime.evaluate",
                       { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails)
    return { __error: String(r.exceptionDetails.exception?.description || "threw").slice(0, 300) };
  return r.result?.value;
};

/* ------------------------------------------------------------------ the states
 *
 * Each is a snippet run in the page that puts the shared state where it says.  They reach into
 * `SUN5D_S` and the shell's `state` deliberately: this is the one tool whose job is to reach the
 * configurations the interface makes hard to type. */
/* THE SHELL'S PER-FAMILY MODEL IS NOT A GLOBAL — it lives inside the module's closure, and the
 * first version of this file reached for `state` and got a ReferenceError on three of its eight
 * states, which it reported as "would not set" and carried on.  A tool that silently skips a third
 * of its own work is worse than one that is not there.  The public surface for that model is the
 * PERMALINK, so the extreme contents are written as links — which has the second virtue of driving
 * the encoder and decoder through the same states, including the empty one that was a real bug
 * until this morning. */
const FAMILIES = ["su7_km25", "su4_ahmn", "su3_hy"];
const emptyHash = "#" + FAMILIES.map((g) => `${g}=`).join("&");
/* the anchor's own link, read from the page at startup, then transformed: every multiplicity
 * raised to the ceiling, or all but the first slot dropped. */
const scale = (h, f) => h.replace(/\*(\d+)/g, (_, n) => "*" + f(+n));

const STATES = [
  { name: "empty", hash: () => emptyHash },
  { name: "one", hash: (anchor) => anchor.replace(
      /([?#&])(su7_km25|su4_ahmn|su3_hy)=([^&]*)/g,
      (_, s, g, v) => `${s}${g}=${v.split(encodeURIComponent(";"))[0].split(";")[0]}`) },
  { name: "full", hash: (anchor) => scale(anchor, () => 30) },
  { name: "bc-unbroken", set: `(() => {
      SUN5D_S.blocks = { nPP: 5, nPM: 0, nMP: 0, nMM: 0 }; SUN5D_S.brane = {};
      SUN5D_S.bulk = { "fund|1|dirac": 1 }; return true; })()` },
  { name: "bc-last-letter", set: `(() => {
      SUN5D_S.blocks = { nPP: 0, nPM: 0, nMP: 0, nMM: 5 }; SUN5D_S.brane = {};
      SUN5D_S.bulk = { "adj|1|dirac": 1 }; return true; })()` },
  { name: "bc-one-each", set: `(() => {
      SUN5D_S.blocks = { nPP: 1, nPM: 1, nMP: 1, nMM: 1 }; SUN5D_S.brane = {};
      SUN5D_S.bulk = { "fund|1|dirac": 1, "anti|-1|dirac": 1 }; return true; })()` },
  { name: "bc-su2", set: `(() => {
      SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 0, nMM: 1 }; SUN5D_S.brane = {};
      SUN5D_S.bulk = { "fund|1|dirac": 1 }; return true; })()` },
  { name: "bc-large-N", set: `(() => {
      SUN5D_S.blocks = { nPP: 5, nPM: 4, nMP: 3, nMM: 2 }; SUN5D_S.brane = {};
      SUN5D_S.bulk = { "fund|1|dirac": 2, "sym|-1|dirac": 1 }; return true; })()` },
];

const WIDTHS = [1440, 380];

/* ------------------------------------------------------------------ what counts as a symptom */

const SCAN = `(() => {
  const el = document.getElementById("section");
  if (!el) return JSON.stringify({ fatal: "no #section" });
  const txt = (el.innerText || el.textContent || "");
  const bad = [];
  /* SIX WAYS A TEMPLATE LITERAL SAYS IT WAS HANDED SOMETHING IT DID NOT EXPECT.  Each is looked
     for as a WORD, so "undefined" inside a sentence about undefined behaviour would have to be
     written as such to trip it -- and none of the prose here does. */
  for (const p of [/\\bNaN\\b/, /\\bundefined\\b/, /\\[object Object\\]/, /\\bInfinity\\b/,
                   /\\$\\{[^}]*\\}/, /\\bnull\\b/]) {
    const m = p.exec(txt);
    if (m) {
      const i = Math.max(0, m.index - 60);
      bad.push({ token: m[0], near: txt.slice(i, m.index + 70).replace(/\\s+/g, " ") });
    }
  }
  /* a verdict box that ran and decided nothing still holds the placeholder it was built with */
  for (const v of el.querySelectorAll(".verdict")) {
    const t = (v.textContent || "").trim();
    if (t === "—" || t === "——" || t === "" || /^—\\s*—$/.test(t))
      bad.push({ token: "empty verdict", near: "#" + (v.id || "?") });
  }
  return JSON.stringify({
    chars: txt.trim().length,
    cards: el.querySelectorAll(".card").length,
    bad });
})()`;

/* ------------------------------------------------------------------ the run */

let pass = 0, fail = 0;
const seen = new Set();
const hit = (where, what) => {
  const k = `${what.token}|${what.near}`.slice(0, 160);
  if (seen.has(k)) return;
  seen.add(k);
  fail++;
  console.log(`  FOUND  ${where}\n         ${what.token}  —  ${what.near}`);
};

await send("Page.navigate", { url: PAGE });
await sleep(1800);
const rail = JSON.parse(await js(
  `JSON.stringify([...document.querySelectorAll('#rail a[data-id]')].map((a) => a.dataset.id))`));
const sections = ONLY.length ? rail.filter((s) => ONLY.includes(s)) : rail;
/* the anchor's own permalink, which the page writes on its first render: every content state below
 * is a transformation of it, so they are all reachable by a link a reader could paste */
await js(`document.querySelector('#rail a[data-id="hierarchy"]').click(); true`);
await sleep(600);
const anchorHash = String(await js(`location.hash`) || "");
console.log(`${sections.length} sections × ${STATES.length} states × ${WIDTHS.length} widths`);
console.log(`anchor link: ${anchorHash.slice(0, 110)}\n`);

for (const W of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride",
             { width: W, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: PAGE });
  await sleep(1600);
  for (const st of STATES) {
    let ok0;
    if (st.hash) {
      const h = st.hash(anchorHash);
      ok0 = await js(`location.hash = ${JSON.stringify(h)}; true`);
      await sleep(500);
    } else {
      ok0 = await js(st.set);
    }
    /* A STATE THAT DID NOT TAKE MUST FAIL, not print a note and move on.  The first version
     * skipped three of eight states with a console line nobody would read, and reported
     * "NOTHING FOUND" over 240 renders that never happened in the states that mattered. */
    if (ok0 !== true) {
      hit(`state ${st.name}@${W}`, { token: "would not set", near: JSON.stringify(ok0).slice(0, 160) });
      continue;
    }
    for (const s of sections) {
      await js(`document.querySelector('#rail a[data-id="${s}"]').click(); true`);
      await sleep(400);
      const raw = await js(SCAN);
      if (typeof raw !== "string") { hit(`${s}@${W}/${st.name}`, { token: "probe threw", near: JSON.stringify(raw).slice(0, 120) }); continue; }
      const r = JSON.parse(raw);
      if (r.fatal) { hit(`${s}@${W}/${st.name}`, { token: "fatal", near: r.fatal }); continue; }
      if (!r.cards || r.chars < 40)
        hit(`${s}@${W}/${st.name}`, { token: "rendered nothing", near: `${r.cards} cards, ${r.chars} chars` });
      for (const b of r.bad) hit(`${s}@${W}/${st.name}`, b);
      if (!r.bad.length && r.cards) pass++;
    }
  }
}

const errs = events.filter((e) => e.method === "Log.entryAdded" &&
                                  ["error", "warning"].includes(e.params.entry.level));
for (const e of errs.slice(0, 12))
  hit("console", { token: e.params.entry.level, near: String(e.params.entry.text).slice(0, 140) });

console.log(`\n${fail === 0 ? "NOTHING FOUND" : "*** FOUND " + fail + " ***"}   ` +
            `${pass} (section, state, width) renders came back clean`);
chrome.kill();
process.exit(fail === 0 ? 0 : 1);

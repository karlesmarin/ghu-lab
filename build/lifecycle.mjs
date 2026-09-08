/* lifecycle.mjs — what the page keeps DOING after you leave a section.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `leaks.mjs` asked what the page KEEPS -- listeners hanging off window and document after the
 * rail has been walked -- and closed that hole.  It cannot see this one.  A listener is a thing
 * the page holds; a pending `setTimeout` is a thing the page is in the middle of, and the second
 * survived the fix to the first.
 *
 * Every long computation here is sliced so the page keeps answering while it runs: the
 * calculator's sweep is seventeen seconds of arithmetic in blocks of ten representations, the
 * BLKT demo walks eight coefficients at 620 ms apiece, and eight more panels defer their work the
 * same way.  Each slice was scheduled by a section and written as though that section were still
 * on screen.  Leave during one and the rail replaces the whole of `#section`; the timer does not
 * know, fires into elements that no longer exist, and `null.textContent` throws -- ABOVE the line
 * that would have put the section back.  That is how the BLKT demo's ▶ button came to be dead for
 * the rest of the page's life after a single mistimed click on the rail.
 *
 * So this harness does the one thing no other tool here does: it starts something long and then
 * walks away, which is what a reader does constantly and what every other harness is careful not
 * to do.  Three claims, each failing on its own:
 *
 *   1. NOTHING THROWS.  Leaving mid-operation raises no exception, in any of the nine panels that
 *      have a long operation to leave.
 *   2. NOTHING IS STILL RUNNING.  Pending timers return to the idle baseline once the reader has
 *      gone.  Measured by wrapping `setTimeout`/`clearTimeout` before the page loads and counting
 *      live ids -- the browser's own bookkeeping, not the app's, because a counter the app keeps
 *      would only prove the app is consistent with itself.
 *   3. THE PANEL STILL WORKS.  Come back, press the same button, and it must respond.  This is the
 *      claim that catches a stranded `running` flag, which is invisible to 1 and 2: nothing is
 *      throwing and nothing is scheduled precisely BECAUSE the section thinks it is already busy.
 *
 * Claim 3 is the one that would have caught the BLKT bug, and claims 1 and 2 are the ones that say
 * the fix is a lifecycle rather than nine null-checks: a null-check silences the exception and
 * leaves the work running against a model the reader has since changed.
 *
 *   node build/lifecycle.mjs [--width 1440] [--only blkt]
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const WIDTH = Number(arg("width", 1440));
const ONLY = arg("only", null);
const REL = arg("page", "app/index.html");
const PAGE = "file:///" + path.join(ROOT, REL).replace(/\\/g, "/");

/* THE PANELS WITH SOMETHING TO ABANDON, and WHEN a reader can actually abandon it.
 *
 * `leaveAfter` is the whole difficulty, and getting it wrong is how the first version of this file
 * reported six false failures.  There are two shapes of deferred work here and only one of them
 * can be walked out of:
 *
 *   A SINGLE BLOCK behind a 20 ms deferral -- the sweeps in eta, selection, hierarchy, inverse,
 *   census, atlas.  The deferral exists to let the word "running…" paint; the block itself then
 *   holds the main thread for seconds and NOTHING can interrupt it, a rail click least of all.
 *   The only moment a reader can leave is inside that 20 ms window, so this leaves at 5 ms.  Wait
 *   130 ms instead and the work has finished, the caption is a correct result, and asserting it
 *   should be empty is asserting that a finished computation should be forgotten.
 *
 *   A CHAIN of slices -- the calculator's seventeen seconds in blocks of ten, the BLKT demo's
 *   eight stops at 620 ms.  Here the gap between slices is the whole run, and leaving mid-flight
 *   is the normal case rather than a race.
 *
 * `flag` marks the three panels that keep a "busy" boolean gating their own button.  Only those
 * can be bricked by a stranded flag, so only those are asked to prove they still work; claiming
 * that check on the other six would be a control that cannot fail.  `starting` is the text the
 * button writes SYNCHRONOUSLY, so "it responded" is a specific string appearing and not merely
 * some text being present -- inverse's caption is never empty once it has run once.
 *
 * A case whose button is not in the built page is a FAILURE, not a skip.  A harness that quietly
 * walks past the panel it was written for reports green about nothing. */
const CASES = [
  { id: "blkt", go: "bkDemo", busy: "bkBusy", leaveAfter: 900, flag: true, starting: "c = " },
  { id: "calculator", go: "cSweepGo", busy: "cSweepNote", leaveAfter: 200 },
  { id: "dossier", go: "dsSepGo", busy: "dsSep", leaveAfter: 5, flag: true, starting: "walking every class" },
  { id: "inverse", go: "ivResolve", busy: "ivResolveNote", leaveAfter: 5, flag: true, starting: "enumerating the rungs" },
  { id: "census", go: "cnGo", busy: "cnBusy", leaveAfter: 5 },
  { id: "eta", go: "eSweepGo", busy: "eSweepNote", leaveAfter: 5 },
  { id: "selection", go: "sSweep", busy: "sSweepNote", leaveAfter: 5 },
  { id: "hierarchy", go: "hSweepGo", busy: "hSweepNote", leaveAfter: 5 },
  { id: "atlas7", go: "a7Go", busy: "a7Note", leaveAfter: 5 },
];
const AWAY = "papers";

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9401;
const USERDIR = path.join(ROOT, ".lifecycle-profile");
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(USERDIR, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run",
  "--disable-gpu", `--window-size=${WIDTH},1000`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const j = await r.json();
      if (j.length) return j;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("chromium never answered on the debugging port");
}

const t = (await targets()).find((x) => x.type === "page");
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let id = 0;
const waiting = new Map();
const events = [];
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

/* THE COUNTER GOES IN BEFORE THE PAGE DOES.  Wrapping `setTimeout` after load would miss whatever
 * the shell scheduled on the way up, and — more to the point — the app must be measured through
 * the browser's own primitive rather than through anything it exports about itself. */
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
    const live = new Set();
    const st = window.setTimeout.bind(window), ct = window.clearTimeout.bind(window);
    window.setTimeout = function (fn, ms) {
      const rest = Array.prototype.slice.call(arguments, 2);
      let handle;
      handle = st(function () { live.delete(handle); if (typeof fn === "function") fn.apply(null, rest); }, ms);
      live.add(handle);
      return handle;
    };
    window.clearTimeout = function (h) { live.delete(h); return ct(h); };
    window.__pending = () => live.size;
  })();`,
});

await send("Emulation.setDeviceMetricsOverride",
           { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: PAGE });
await sleep(1800);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __threw: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

const exceptionsSoFar = () => events.filter((e) => e.method === "Runtime.exceptionThrown").length;
const click = (elId) =>
  evalJs(`(() => { const e = document.getElementById(${JSON.stringify(elId)});
                   if (!e) return "missing"; e.click(); return "ok"; })()`);
const goSection = (secId) =>
  evalJs(`(() => { const a = document.querySelector('#rail a[data-id=' + ${JSON.stringify(JSON.stringify(secId))} + ']');
                   if (!a) return "missing"; a.click(); return "ok"; })()`);
const textOf = (elId) =>
  evalJs(`(() => { const e = document.getElementById(${JSON.stringify(elId)});
                   return e ? (e.textContent || "").trim() : null; })()`);

if (await evalJs(`typeof window.__pending`) !== "function") {
  console.error("FATAL: the timer counter was not installed — refusing to report on timers it " +
                "cannot see.");
  ws.close(); chrome.kill(); process.exit(3);
}

/* The idle baseline.  Not asserted to be zero: the page is free to hold a clock of its own, and
 * what the gate is about is the DELTA an abandoned operation leaves behind. */
await goSection(AWAY);
await sleep(700);
const BASE = await evalJs(`window.__pending()`);

console.log(`the abandoned-work gate: ${CASES.length} panels, each started and then left`);
console.log(`idle pending timers: ${BASE}\n`);

const fails = [];
for (const c of CASES) {
  if (ONLY && c.id !== ONLY) continue;

  const before = exceptionsSoFar();

  /* mount it */
  if (await goSection(c.id) !== "ok") { fails.push(`${c.id}: not on the rail`); continue; }
  await sleep(420);

  /* start the long thing, and require that it actually started -- a button that is not there makes
   * this whole case a tautology */
  if (await click(c.go) !== "ok") { fails.push(`${c.id}: no #${c.go} in the built page`); continue; }
  await sleep(c.leaveAfter);

  /* THE ABANDONMENT ITSELF, and the proof that it happened.  A timer above the idle baseline at
   * this instant is the work still owing something; without it this case walked away from nothing
   * and its green is worth nothing, so it is reported rather than counted as a pass. */
  const inFlight = (await evalJs(`window.__pending()`)) > BASE;
  await goSection(AWAY);
  await sleep(1700);

  const threw = exceptionsSoFar() - before;
  const pend = await evalJs(`window.__pending()`);

  /* come back and press it again: the claim a stranded flag cannot hide from, asked only of the
   * three panels that keep a flag to strand */
  let responded = true;
  if (c.flag) {
    await goSection(c.id);
    await sleep(360);
    await click(c.go);
    /* READ INSIDE THE DEFERRAL WINDOW.  The progress line is written synchronously by the click and
     * replaced by the result 20 ms later, so a probe that sleeps 60 ms reads the answer and
     * concludes the button did nothing -- which is what the first version of this file did to the
     * dossier and the inverse.  Twelve milliseconds is inside every deferral on the page. */
    await sleep(12);
    const now = String(await textOf(c.busy) ?? "");
    responded = now.includes(c.starting);
  }
  /* leave it tidy for the next case rather than letting nine abandoned sweeps pile up */
  await goSection(AWAY);
  await sleep(500);

  const bad = [];
  if (threw) bad.push(`${threw} exception(s) on leaving`);
  if (pend > BASE) bad.push(`${pend - BASE} timer(s) still pending 1.7 s after leaving`);
  if (!responded) bad.push(`pressed again it did not say ${JSON.stringify(c.starting)} — a flag is stranded`);

  const what = c.flag ? "no throw, nothing pending, and it still starts"
                      : "no throw, nothing left pending";
  const mark = bad.length ? "FAILED " : "PASSED ";
  const note = inFlight ? "" : "   (NOT IN FLIGHT — nothing was abandoned)";
  console.log(`  ${c.id.padEnd(12)} ${mark}${bad.length ? bad.join("; ") : what}${note}`);
  if (bad.length) fails.push(`${c.id}: ${bad.join("; ")}`);
  if (!inFlight) fails.push(`${c.id}: left after ${c.leaveAfter} ms with no work pending — this ` +
                            `case abandons nothing and cannot fail`);
}

/* Every exception over the whole run, named — the count above says a case failed, this says what. */
const exc = events.filter((e) => e.method === "Runtime.exceptionThrown")
                  .map((e) => e.params.exceptionDetails.exception?.description ||
                              e.params.exceptionDetails.text);
if (exc.length) {
  console.log(`\n${exc.length} exception(s):`);
  const seen = new Map();
  for (const e of exc) {
    const head = String(e).split("\n")[0];
    seen.set(head, (seen.get(head) || 0) + 1);
  }
  for (const [head, n] of seen) console.log(`  ${n}x  ${head}`);
}

console.log("");
if (fails.length) {
  console.log(`ABANDONED WORK: ${fails.length} of ${CASES.length} panels do not survive being left`);
} else {
  console.log(`NOTHING LEFT BEHIND   ${CASES.length} panels started and abandoned: no exception, ` +
              `no timer outliving its section, no panel that stopped working`);
}

ws.close();
chrome.kill();
process.exit(fails.length ? 1 : 0);

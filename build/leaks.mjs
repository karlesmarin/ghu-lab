/* leaks.mjs — does walking the rail leave anything behind?
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * `shoot.mjs` reported 24 console errors of one kind and could not say where they came from,
 * because the thing that produces them is not a section rendering wrong: it is a listener that a
 * section registered on `window` and never removed, firing later, from a section that is no longer
 * mounted, over a canvas that is no longer in the document.  A screenshot cannot see that, and an
 * assertion inside a module cannot either — the defect lives in the SHELL's lifetime, not in any
 * one panel.
 *
 * So this walks the rail twice and asks the browser itself, through `DOMDebugger.getEventListeners`,
 * how many handlers are hanging off `window` and `document` after each pass.  The claim it gates is
 * exact and cheap to state: **the second walk must not add any**.  Everything a section wires must
 * be wired once — either once for the page, or once per mount with the previous one removed.
 *
 * It is a different question from every other tool here.  `drive.mjs` asks whether the panels do
 * what they say; `layout.mjs` whether anything is wider than its box; `extremes.mjs` whether the
 * states nobody visits still render.  This one asks what the page keeps.
 *
 *   node build/leaks.mjs [--page app/index.html] [--width 1440]
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const WIDTH = Number(arg("width", 1440));
const REL = arg("page", "app/index.html");
const PAGE = "file:///" + path.join(ROOT, REL).replace(/\\/g, "/");

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9399;
const USERDIR = path.join(ROOT, ".leaks-profile");
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
/* getEventListeners lives in DOMDebugger and wants the DOM domain up. */
await send("DOM.enable");
await send("DOMDebugger.enable");
await send("Emulation.setDeviceMetricsOverride",
           { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: PAGE });
await sleep(1800);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

/* The census: every listener the browser holds for one object, by type.  Asked of the live object
 * rather than of our own bookkeeping, because a counter we increment ourselves would only ever
 * prove that the counter is consistent with itself. */
async function census(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: false });
  const objectId = r.result?.objectId;
  if (!objectId) throw new Error(`no object for ${expression}`);
  const l = await send("DOMDebugger.getEventListeners", { objectId, depth: 0 });
  await send("Runtime.releaseObject", { objectId });
  const by = {};
  for (const e of (l.listeners || [])) by[e.type] = (by[e.type] || 0) + 1;
  return by;
}

const total = (c) => Object.values(c).reduce((a, b) => a + b, 0);
const diff = (a, b) => {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
    if ((b[k] || 0) !== (a[k] || 0)) out[k] = `${a[k] || 0} → ${b[k] || 0}`;
  return out;
};

const rail = await evalJs(
  `Array.from(document.querySelectorAll('#rail a')).map(a => a.dataset.id || "").filter(Boolean)`);
if (!rail || !rail.length) {
  console.error("FATAL: the rail yielded no section ids — refusing to report a clean run with " +
                "nothing walked.");
  ws.close(); chrome.kill(); process.exit(3);
}

async function walk() {
  for (const secId of rail) {
    await evalJs(`document.querySelector('#rail a[data-id=' + JSON.stringify(${JSON.stringify(secId)}) + ']').click()`);
    await sleep(260);
    /* A resize is what turns a stale listener from a dormant closure into a thrown error, and the
     * shell re-renders on it, so it is part of a realistic walk rather than an extra. */
    await send("Emulation.setDeviceMetricsOverride",
               { width: WIDTH, height: 1000 + (secId.length % 3) * 40, deviceScaleFactor: 1, mobile: false });
    await sleep(90);
  }
}

console.log(`the rail: ${rail.length} sections; two walks of it\n`);

const before = { win: await census("window"), doc: await census("document") };
await walk();
const p1 = { win: await census("window"), doc: await census("document") };
await walk();
const p2 = { win: await census("window"), doc: await census("document") };

const rows = [["on load", before], ["after walk 1", p1], ["after walk 2", p2]];
for (const [name, c] of rows)
  console.log(`  ${name.padEnd(14)} window ${String(total(c.win)).padStart(4)}   document ${String(total(c.doc)).padStart(4)}`);

const grewW = diff(p1.win, p2.win), grewD = diff(p1.doc, p2.doc);
const grew = Object.keys(grewW).length + Object.keys(grewD).length;

console.log("");
if (grew) {
  console.log("GREW between the two walks — a listener is registered per visit and never removed:");
  for (const [k, v] of Object.entries(grewW)) console.log(`  window   ${k}: ${v}`);
  for (const [k, v] of Object.entries(grewD)) console.log(`  document ${k}: ${v}`);
} else {
  console.log("nothing grew: every listener on window and document is wired once.");
}

/* And the errors, because the leak and the thrown TypeError are the same fact seen twice. */
const exc = events.filter((e) => e.method === "Runtime.exceptionThrown")
                  .map((e) => e.params.exceptionDetails.exception?.description ||
                              e.params.exceptionDetails.text);
const errs = events.filter((e) => e.method === "Log.entryAdded" &&
                                  ["error", "warning"].includes(e.params.entry.level))
                   .map((e) => `${e.params.entry.level}: ${e.params.entry.text}`);
console.log(`\nconsole errors/warnings over both walks: ${exc.length + errs.length}`);
const seen = new Map();
for (const e of [...exc, ...errs]) {
  const head = String(e).split("\n")[0];
  seen.set(head, (seen.get(head) || 0) + 1);
}
for (const [head, n] of seen) console.log(`  ${n}x  ${head}`);

ws.close();
chrome.kill();
process.exit(grew || exc.length ? 1 : 0);

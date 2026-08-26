/* shoot_site.mjs — look at the pages around the instrument, headless, at two widths.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * _test_site.py proves that every link resolves and that no page reaches outside itself.  It
 * cannot see a table running off a card, a heading colliding with a chip, or a two-column grid
 * that collapses into overlap on a phone.  This walks every built page, at a desktop and a phone
 * width, saves a full-height screenshot of each, and reports the console and any element wider
 * than its own viewport — which is the one layout failure a screenshot makes easy to miss,
 * because the overflow is off the side of the image.
 *
 *   node build/shoot_site.mjs [--width 1280] [--narrow 390] [--out shots/site]
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const WIDE = Number(arg("width", 1280));
const NARROW = Number(arg("narrow", 390));
const OUT = path.join(ROOT, arg("out", path.join("shots", "site")));
const SITE = path.join(ROOT, "site");

/* Every page the build made, except the instrument: that one has its own shooter, which knows how
 * to drive the rail.  Shooting it here would produce a picture of section one and call it done. */
function pages(dir = SITE, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) pages(p, acc);
    else if (e.endsWith(".html")) acc.push(path.relative(SITE, p).replace(/\\/g, "/"));
  }
  return acc.filter((r) => r !== "app/index.html").sort();
}

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const LIST = pages();
if (!LIST.length) {
  console.error("FATAL: no pages in site/ -- refusing to report a clean run with nothing shot.");
  process.exit(3);
}

const PORT = 9334;
const USERDIR = path.join(ROOT, ".shoot-profile-site");
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run",
  "--disable-gpu", "--force-device-scale-factor=2", `--window-size=${WIDE},1000`,
  "about:blank",
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

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
                       { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

/* The overflow probe, and the first version of it was wrong in the way that matters.
 *
 * It reported every element whose bounding box reached past the viewport -- which, once wide
 * tables were wrapped in a scroll container, includes the table INSIDE the container, whose box is
 * legitimately wider than the screen while the page does not move at all.  A probe that fires on
 * the fix is worse than none: it teaches you to ignore it.
 *
 * The failure being hunted is the DOCUMENT sliding sideways, so the document is what decides.  The
 * element list is kept, but only as the diagnosis printed once the document has already failed,
 * and only for elements that are not inside something that scrolls. */
const OVERFLOW = `(() => {
  const de = document.documentElement;
  const w = de.clientWidth;
  const slides = de.scrollWidth > w + 1;
  const bad = [];
  if (slides) {
    const scope = document.querySelector('main') || document.body;
    for (const el of scope.querySelectorAll('*')) {
      let p = el.parentElement, contained = false;
      while (p && p !== document.body) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === 'auto' || ov === 'scroll' || ov === 'hidden') { contained = true; break; }
        p = p.parentElement;
      }
      if (contained) continue;
      const r = el.getBoundingClientRect();
      if (r.right > w + 1) {
        bad.push(el.tagName.toLowerCase()
                 + (el.className ? '.' + String(el.className).split(' ')[0] : '')
                 + ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
      }
    }
  }
  return { viewport: w, doc: de.scrollWidth, slides, worst: bad.slice(0, 4) };
})()`;

async function shootAt(width, tag) {
  const rows = [];
  for (const rel of LIST) {
    const url = "file:///" + path.join(SITE, rel).replace(/\\/g, "/");
    await send("Emulation.setDeviceMetricsOverride",
               { width, height: 1000, deviceScaleFactor: 2, mobile: width < 600 });
    await send("Page.navigate", { url });
    await sleep(500);
    const h = await evalJs("Math.min(14000, Math.ceil(document.documentElement.scrollHeight))");
    const over = await evalJs(OVERFLOW);
    await send("Emulation.setDeviceMetricsOverride",
               { width, height: h, deviceScaleFactor: 2, mobile: width < 600 });
    await sleep(320);
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    const name = `${tag}-${rel.replace(/[\\/]/g, "_").replace(/\.html$/, "")}.png`;
    writeFileSync(path.join(OUT, name), Buffer.from(r.data, "base64"));
    rows.push({ rel, name, h, over });
  }
  return rows;
}

const wide = await shootAt(WIDE, `w${WIDE}`);
const narrow = await shootAt(NARROW, `w${NARROW}`);

const errs = events.filter((e) => e.method === "Log.entryAdded" &&
                                  ["error", "warning"].includes(e.params.entry.level))
                   .map((e) => `${e.params.entry.level}: ${e.params.entry.text}`);
const exc = events.filter((e) => e.method === "Runtime.exceptionThrown")
                  .map((e) => e.params.exceptionDetails.exception?.description ||
                              e.params.exceptionDetails.text);

let overflows = 0;
for (const [tag, rows, w] of [[`${WIDE}px`, wide, WIDE], [`${NARROW}px`, narrow, NARROW]]) {
  console.log(`\n${tag}`);
  for (const r of rows) {
    /* A carried page is frozen: it is the tool as an earlier paper cited it, and editing it would
     * defeat the point of keeping it.  Its overflow is reported and NOT counted, because a
     * permanent red is a signal nobody reads. */
    const frozen = /^(tools-|editions\/(?!index\.html))/.test(r.rel);
    const bad = r.over?.slides
      ? `  ${frozen ? "OVERFLOW (frozen, not counted)" : "OVERFLOW"} doc=${r.over.doc} > `
        + `${r.over.viewport}: ${r.over.worst.join(" | ") || "(nothing uncontained -- look at "
        + "the picture)"}`
      : "";
    if (bad && !frozen) overflows++;
    console.log(`  ${r.rel.padEnd(30)} ${String(r.h).padStart(5)} px   ${r.name}${bad}`);
  }
}

console.log(`\npages shot: ${wide.length} x 2 widths`);
console.log(`console errors/warnings: ${errs.length + exc.length}`);
for (const e of [...exc, ...errs]) console.log("  " + String(e).split("\n")[0]);
console.log(`horizontal overflow: ${overflows}`);

ws.close();
chrome.kill();
process.exit(exc.length || overflows ? 1 : 0);

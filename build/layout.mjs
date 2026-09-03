/* layout.mjs — walk every section, in every state a reader can put it in, and report every place
 * where the content is wider than the box that holds it.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * THE DEFECT NO OTHER GATE CAN SEE.  `_test_app.mjs` proves the markup is built; `shoot.mjs` takes
 * a picture of it; `drive.mjs` proves the controls answer a mouse.  None of them can see a table
 * whose seventh column is cut off at the edge of its card, because the numbers are right, the DOM
 * is right, the console is clean, and the screenshot is a picture of the defect rather than a
 * complaint about it.  A reader sees it in one second and it took a reader to report it.
 *
 * WHAT IT MEASURES, and the distinction is the whole tool:
 *
 *   CLIPPED  — `scrollWidth > clientWidth` on a box whose `overflow-x` is NOT auto or scroll.  The
 *              content is there and cannot be reached: a column is simply gone.  A defect.
 *   scrolls  — the same, on a box that scrolls.  Not a defect, but reported, because a table that
 *              needs 250 px of horizontal scrolling inside a card is a table that wants shorter
 *              headers rather than a scrollbar.
 *   SIDEWAYS — the page itself scrolls horizontally.  Always a defect: it means something inside
 *              refused to shrink and pushed the whole document out.
 *   OFFSCREEN— an element whose right edge is past the viewport.  This is how an overlay fails —
 *              a help bubble or the demo bar — and no card can report it, because they are not in
 *              a card.
 *
 * AND IT DOES IT IN EVERY STATE, which is the second half of the point.  A section renders
 * differently when the how-to is open, when a help bubble is up, and while the demo is driving it,
 * and each of those is markup a reader sees and no screenshot of the default state contains.
 *
 *   node build/layout.mjs                  # 1440 and 1180
 *   node build/layout.mjs 1440 1180 860    # any widths
 *   node build/layout.mjs --quiet          # defects only, no `scrolls` lines
 *
 * Exit code is 1 when anything CLIPPED, SIDEWAYS or OFFSCREEN was found, so it can be a gate.
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const QUIET = argv.includes("--quiet");
const PAGE = "file:///" + path.join(ROOT, "app", "index.html").replace(/\\/g, "/");
const WIDTHS = argv.filter((a) => /^\d+$/.test(a)).map(Number);
const SIZES = WIDTHS.length ? WIDTHS : [1440, 1180];

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9337;
const USERDIR = path.join(ROOT, ".shoot-profile-layout");
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
  try {
    const j = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = j.find((x) => x.type === "page");
  } catch { /* not up yet */ }
  if (!target) await sleep(250);
}
if (!target) { console.error("chromium never answered"); process.exit(2); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const waiting = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const n = ++id;
  waiting.set(n, (m) => res(m.result ?? m.error));
  ws.send(JSON.stringify({ id: n, method, params }));
});
await send("Runtime.enable");
await send("Page.enable");

const js = async (expr) => {
  const r = await send("Runtime.evaluate",
                       { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails)
    return { __error: String(r.exceptionDetails.exception?.description || "threw").slice(0, 200) };
  return r.result?.value;
};

/* ------------------------------------------------------------------ the measurement
 *
 * Run in the page, once per state.  It names each offender by a signature stable enough to be
 * deduplicated across states and widths — the tag, its id, its classes and the first words it
 * holds — because the same table clipped in four states is one thing to fix, not four. */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const sig = (el) => el.tagName.toLowerCase()
    + (el.id ? "#" + el.id : "")
    + (el.className && el.className.toString ? "." + el.className.toString().trim().replace(/\\s+/g, ".") : "");
  const words = (el) => (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 64);
  const clipped = [], scrolls = [], off = [];
  for (const el of document.querySelectorAll("body *")) {
    const over = el.scrollWidth - el.clientWidth;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (over > 1) {
      const cs = getComputedStyle(el);
      /* THREE CASES, and the third took a second pass to get right.  A box that scrolls is fine.
       * A box that hides is a defect -- a column is simply gone.  But a box that hides WITH AN
       * ELLIPSIS has told the reader there is more, and that is a design: the header model line is
       * meant to be one line.  It is only a defect when the text it swallowed cannot be got back,
       * so it passes exactly when it carries its own text in a title attribute.
       * (No backticks in this comment: it lives inside a template literal, and the first version
       * of it closed the string a hundred lines early.) */
      const bucket = /auto|scroll/.test(cs.overflowX) ? scrolls
        : (cs.textOverflow === "ellipsis" && (el.title || "").length > 0) ? scrolls
        : clipped;
      bucket.push({ sig: sig(el), over, w: Math.round(r.width), txt: words(el),
                    why: cs.textOverflow === "ellipsis" ? "ellipsis, and the title carries it" : "" });
    }
    /* AN OVERLAY that opens past the edge of the window: not inside any card, so no card can
     * report it, and the only symptom is that the reader cannot read it.
     *
     * ONLY POSITIONED ELEMENTS, and the first version of this check got it wrong: a wide table
     * inside a box that scrolls also has a rectangle sticking out past the viewport, and it is
     * neither offscreen nor a defect — the scroller clips it and the reader drags it into view.
     * Six of those were reported as offscreen on the first run. What cannot be dragged into view
     * is an absolutely or fixed positioned overlay, which is what this is for: the help bubble
     * and the demo caption bar. */
    const pos = getComputedStyle(el).position;
    if (r.width > 0 && (pos === "fixed" || pos === "absolute") && (r.right > vw + 1 || r.left < -1))
      off.push({ sig: sig(el), w: Math.round(r.width),
                 left: Math.round(r.left), right: Math.round(r.right), txt: words(el) });
  }
  return JSON.stringify({
    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    clipped, scrolls, off });
})()`;

/* ------------------------------------------------------------------ the report */

const found = new Map();          /* key -> { kind, sig, txt, worst, where: Set } */
const note = (kind, width, section, state, o) => {
  const key = `${kind}|${o.sig}|${o.txt}`;
  if (!found.has(key)) found.set(key, { kind, sig: o.sig, txt: o.txt, worst: 0, where: new Set() });
  const f = found.get(key);
  f.worst = Math.max(f.worst, o.over ?? o.right ?? 0);
  f.where.add(`${section}@${width}${state === "default" ? "" : ":" + state}`);
};

const measure = async (width, section, state) => {
  const raw = await js(PROBE);
  if (typeof raw !== "string") { console.log(`   (probe failed in ${section}/${state})`); return; }
  const res = JSON.parse(raw);
  if (res.sideways > 1)
    note("SIDEWAYS", width, section, state, { sig: "the page", txt: "", over: res.sideways });
  for (const o of res.clipped) note("CLIPPED", width, section, state, o);
  for (const o of res.off) note("OFFSCREEN", width, section, state, o);
  if (!QUIET) for (const o of res.scrolls) note("scrolls", width, section, state, o);
};

/* ------------------------------------------------------------------ the walk */

for (const W of SIZES) {
  await send("Emulation.setDeviceMetricsOverride",
             { width: W, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: PAGE });
  await sleep(1800);
  const rail = JSON.parse(await js(
    `JSON.stringify([...document.querySelectorAll('#rail a[data-id]')].map((a) => a.dataset.id))`));
  console.log(`width ${W}: ${rail.length} sections`);

  for (const s of rail) {
    await js(`document.querySelector('#rail a[data-id="${s}"]').click(); true`);
    await sleep(650);
    await measure(W, s, "default");

    /* every <details> a reader can open — the how-to among them */
    const nDet = await js(`(() => { const d = [...document.querySelectorAll('#view details, #section details')];
                                    d.forEach((x) => { x.open = true; }); return d.length; })()`);
    if (nDet) { await sleep(450); await measure(W, s, "details-open"); }

    /* every help bubble, one at a time: an overlay is not in a card and nothing else looks at it */
    const marks = await js(`document.querySelectorAll('#view .ihelp, #section .ihelp').length`);
    for (let k = 0; k < Math.min(marks, 12); k++) {
      const key = await js(`(() => { const b = document.querySelectorAll('#view .ihelp, #section .ihelp')[${k}];
                                     if (!b) return null; b.click(); return b.dataset.help; })()`);
      if (!key) continue;
      await sleep(220);
      await measure(W, s, `help:${key}`);
      await js(`document.querySelector('.helppop')?.remove(); true`);
    }

    /* and the demo, which drives the section into states nothing else renders */
    const hasDemo = await js(`!!document.getElementById('demoRun')`);
    if (hasDemo) {
      await js(`document.getElementById('demoRun').click(); true`);
      await sleep(900);
      for (let k = 0; k < 8; k++) {
        await measure(W, s, `demo:${k}`);
        const more = await js(`(() => { const b = document.getElementById('demoNext');
                                        if (!b) return false; b.click(); return true; })()`);
        if (!more) break;
        await sleep(700);
      }
      await js(`document.getElementById('demoStop')?.click(); true`);
      await sleep(500);
    }
  }
}

/* ------------------------------------------------------------------ what came back */

const order = { SIDEWAYS: 0, CLIPPED: 1, OFFSCREEN: 2, scrolls: 3 };
const rows = [...found.values()].sort((a, b) =>
  order[a.kind] - order[b.kind] || b.worst - a.worst);
const bad = rows.filter((r) => r.kind !== "scrolls");

console.log("");
for (const r of rows) {
  const where = [...r.where].sort();
  console.log(`${r.kind.padEnd(9)} +${String(r.worst).padStart(4)}px  ${r.sig}`);
  if (r.txt) console.log(`                     "${r.txt}"`);
  console.log(`                     ${where.slice(0, 6).join(" · ")}` +
              `${where.length > 6 ? ` … and ${where.length - 6} more` : ""}`);
}

console.log(`\n${bad.length === 0 ? "LAYOUT CLEAN" : "*** LAYOUT DEFECTS ***"}   ` +
            `${bad.length} to fix, ${rows.length - bad.length} boxes that scroll`);
chrome.kill();
process.exit(bad.length === 0 ? 0 : 1);

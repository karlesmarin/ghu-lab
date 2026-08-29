/* drive.mjs — use the instrument, headless, and report what it did.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * shoot.mjs looks at the page; this one USES it.  Real mouse events through the DevTools Input
 * domain — not synthetic events dispatched from inside the page, which would prove that the
 * listeners exist and nothing about whether the browser ever reaches them.
 *
 * What it drives is the claim the relief was built to make: the panels are CONTROLS.  Dragging the
 * plan must move the cursor; dragging the relief must move the same cursor to the same place;
 * shift-dragging must turn the view and NOT move the cursor; the wheel must raise the relief; and
 * none of it may touch the model, because the numbers the paper claims are read at the vacuum.
 *
 * Every check carries its control, because "the readout changed" is also what a page that ignores
 * you and re-renders on a timer would do.
 *
 *   node build/drive.mjs
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "shots", "drive");
const PAGE = "file:///" + path.join(ROOT, "app", "index.html").replace(/\\/g, "/");

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9335;
const USERDIR = path.join(ROOT, ".shoot-profile-drive");
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/* A visible-sized window, and NOT a background tab: requestAnimationFrame and setTimeout are
 * throttled in a background tab, so an interaction test run there fails for a reason that has
 * nothing to do with the page. */
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run", "--disable-gpu",
  "--window-size=1440,1000", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
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
await send("Emulation.setDeviceMetricsOverride",
           { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: PAGE });
await sleep(1600);

const js = async (expr) => {
  const r = await send("Runtime.evaluate",
                       { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __error: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };
const H = (s) => console.log(`\n${s}`);

/* ---- real input, through the browser ---------------------------------------------------- */

const MOUSE = { x: 0, y: 0 };
async function mouse(type, x, y, opts = {}) {
  MOUSE.x = x; MOUSE.y = y;
  await send("Input.dispatchMouseEvent", {
    type, x, y, button: opts.button ?? "left",
    buttons: opts.buttons ?? (type === "mouseReleased" ? 0 : 1),
    clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
    modifiers: opts.shift ? 8 : 0,
    pointerType: "mouse",
  });
  await sleep(60);
}
async function drag(x0, y0, x1, y1, { shift = false, steps = 6 } = {}) {
  await mouse("mouseMoved", x0, y0, { buttons: 0 });
  await mouse("mousePressed", x0, y0, { shift });
  for (let k = 1; k <= steps; k++)
    await mouse("mouseMoved", x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps, { shift });
  await mouse("mouseReleased", x1, y1, { shift, buttons: 0 });
  await sleep(180);
}
async function wheel(x, y, dy) {
  await send("Input.dispatchMouseEvent",
             { type: "mouseWheel", x, y, deltaX: 0, deltaY: dy, pointerType: "mouse" });
  await sleep(150);
}

const rect = async (sel) => js(
  `(() => { const e = document.querySelector(${JSON.stringify(sel)});
     if (!e) return null; const r = e.getBoundingClientRect();
     return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);

const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
};

/* ---- get to the calculator --------------------------------------------------------------- */

H("open the calculator");
await js(`document.querySelector('#rail a[data-id="calculator"]').click()`);
await sleep(1200);
ok("the section is up and holding the AHMN model",
   String(await js(`document.getElementById('topModel').textContent`)).includes("SU(4)"));
const map = await rect("#cMap"), surf = await rect("#cSurf");
ok("both panels are on the page and have a size",
   !!map && !!surf && map.w > 100 && surf.w > 100, JSON.stringify({ map, surf }));

const readout = () => js(`document.getElementById('cCur').textContent.trim()`);
const alphaOf = async () => {
  const s = await readout();
  const m = /α = \(([-\d.]+), ([-\d.]+)\)/.exec(s);
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const outputs = () => js(`[document.getElementById('cA').textContent,
                          document.getElementById('cR').textContent,
                          document.getElementById('cM').textContent].join(' | ')`);
const view = () => js(`({ az: CALC_PANELS.state.view.az, el: CALC_PANELS.state.view.el, h: CALC_PANELS.state.view.h })`);

ok("it opens at the vacuum, and says so",
   (await readout()).startsWith("The cursor is at the vacuum"), await readout());
const out0 = await outputs();
await shot("1-opened");

/* ---- 1. the PLAN is a control ------------------------------------------------------------ */

H("the plan is a control");
const box = await js(`({ ...CALC_PANELS.state.box })`);
const planPoint = (fx, fy) => [map.x + box.L + box.iw * fx, map.y + box.T + box.ih * (1 - fy)];

const [px1, py1] = planPoint(0.25, 0.6);
await drag(px1, py1, px1, py1);
const a1 = await alphaOf();
ok("dragging the plan moves the cursor off the vacuum", !!a1, await readout());
/* and it lands WHERE it was aimed: the plan's own coordinates, times the real periods */
ok("and it lands where it was aimed, in the domain's own units",
   a1 && Math.abs(a1[0] - 2 * 0.25) < 0.05 && Math.abs(a1[1] - 1 * 0.6) < 0.03,
   `wanted ~(0.500, 0.600), got ${JSON.stringify(a1)}`);

const [px2, py2] = planPoint(0.75, 0.2);
await drag(px2, py2, px2, py2);
const a2 = await alphaOf();
ok("a second point gives a different, equally aimed answer",
   a2 && Math.abs(a2[0] - 1.5) < 0.05 && Math.abs(a2[1] - 0.2) < 0.03,
   `wanted ~(1.500, 0.200), got ${JSON.stringify(a2)}`);
/* the control that this is a control: alpha_1 spans 2 and alpha_2 spans 1 on the SAME panel, so
 * the same pixel displacement must move them by different amounts */
ok("alpha_1 really does span twice what alpha_2 spans — the panel is not square",
   a1 && a2 && Math.abs((a2[0] - a1[0]) / (0.75 - 0.25)) > 1.9 * Math.abs((a2[1] - a1[1]) / (0.6 - 0.2)) * 0.999,
   `d(a1)=${(a2[0] - a1[0]).toFixed(3)} over 0.5, d(a2)=${(a2[1] - a1[1]).toFixed(3)} over 0.4`);

ok("and none of it moved the model: the published numbers stay at the vacuum",
   (await outputs()) === out0, `${out0}  ->  ${await outputs()}`);
await shot("2-plan-dragged");

/* ---- 2. the RELIEF is the same control --------------------------------------------------- */

H("the relief is the same control, not a picture of one");
const v0 = await view();
const cx = surf.x + surf.w / 2, cy = surf.y + surf.h / 2;
await drag(cx - 40, cy - 10, cx - 40, cy - 10);
const a3 = await alphaOf();
ok("dragging the relief moves the cursor too", !!a3 && JSON.stringify(a3) !== JSON.stringify(a2),
   `${JSON.stringify(a2)} -> ${JSON.stringify(a3)}`);
ok("and it did NOT turn the view while doing it",
   Math.abs((await view()).az - v0.az) < 1e-9, JSON.stringify([v0, await view()]));

H("shift turns it, and turning must not move the cursor");
const before = await alphaOf();
await drag(cx - 60, cy, cx + 60, cy, { shift: true });
const v1 = await view();
ok("shift-drag turned the view", Math.abs(v1.az - v0.az) > 0.2,
   `az ${v0.az.toFixed(3)} -> ${v1.az.toFixed(3)}`);
ok("and the cursor stayed exactly where it was",
   JSON.stringify(await alphaOf()) === JSON.stringify(before),
   `${JSON.stringify(before)} -> ${JSON.stringify(await alphaOf())}`);
await shot("3-relief-turned");

H("the wheel raises the relief, and the view resets");
await wheel(cx, cy, -120);
const v2 = await view();
ok("the wheel changed the relief scale", Math.abs(v2.h - v1.h) > 1e-6,
   `h ${v1.h.toFixed(3)} -> ${v2.h.toFixed(3)}`);
await send("Input.dispatchMouseEvent",
           { type: "mousePressed", x: cx, y: cy, button: "left", buttons: 1, clickCount: 2 });
await send("Input.dispatchMouseEvent",
           { type: "mouseReleased", x: cx, y: cy, button: "left", buttons: 0, clickCount: 2 });
await sleep(250);
const v3 = await view();
ok("double-click put the view back where it started",
   Math.abs(v3.az - v0.az) < 1e-9 && Math.abs(v3.h - v0.h) < 1e-9, JSON.stringify([v0, v3]));

H("and the way back to the vacuum");
await js(`document.querySelector('[data-tp-home]')?.click()`);
await sleep(200);
ok("the button returns the cursor to the vacuum",
   (await readout()).startsWith("The cursor is at the vacuum"), await readout());

H("changing the content re-renders and drops the cursor, because it is a different surface");
await js(`document.getElementById('cAhmn').click()`);
await sleep(900);
ok("the model still resolves after all of that", !String(await outputs()).includes("—"),
   await outputs());
ok("and the cursor is back at the vacuum",
   (await readout()).startsWith("The cursor is at the vacuum"), await readout());
await shot("4-reloaded");

/* ---- the sweep, which is section code no module harness can reach ------------------------- */

/* THE ROW LIST IS ITS OWN CLAIM.  The panel promises "showing K of T, one per equivalence class
 * first", and the first version printed "showing 40 of 24": it decided which rows were the first
 * of their class inside a second pass, by which time the first pass had already seen every class,
 * so every survivor was listed twice.  A count that contradicts itself on screen is caught here or
 * it is caught by a reader. */
H("the sweep panel: the table says what it holds, and a hit loads into the builder");
await js(`document.querySelector('#rail a[data-id="sweep5d"]').click()`);
await sleep(700);
ok("it does not run on render — the expensive panel opens unpressed",
   /Not run yet/.test(await js(`document.getElementById('swCost').textContent`)),
   await js(`document.getElementById('swCost').textContent`));

await js(`document.querySelectorAll('#swFilters input[type=checkbox]')
            .forEach((c) => { if (!c.checked) { c.checked = true; c.onchange(); } });
          document.getElementById('swRun').click()`);
await sleep(9000);

const swN = await js(`({ rows: document.querySelectorAll('#swRows tr').length,
                         note: document.getElementById('swRowsNote').textContent,
                         total: SWEEP5D_S.result.total,
                         classes: SWEEP5D_S.result.classesLeft })`);
ok(`the sweep found ${swN.total} pairs in ${swN.classes} classes`, swN.total > 0 && swN.classes > 0);
ok(`the table holds ${swN.rows} rows and never more than the ${swN.total} survivors it found`,
   swN.rows <= swN.total, JSON.stringify(swN));
const shown = +(/Showing (\d+) of (\d+)/.exec(swN.note) || [])[1];
const claimed = +(/Showing (\d+) of (\d+)/.exec(swN.note) || [])[2];
ok(`"showing ${shown} of ${claimed}" is arithmetic that holds, and matches the rows drawn`,
   shown <= claimed && shown === swN.rows, swN.note);
/* one row per class first: the leading rows must be distinct classes */
const swCls = await js(`[...document.querySelectorAll('#swRows tr')]
                          .map((r) => r.children[3].textContent.trim())`);
const firstN = swCls.slice(0, swN.classes).map((s) => s.replace(/\\D+$/, ""));
ok("the leading rows are one per equivalence class, as the note promises",
   new Set(firstN).size === firstN.length, firstN.join(","));

const swBefore = await js(`JSON.stringify(SUN5D_S.blocks)`);
await js(`document.querySelector('#swRows button').click()`);
await sleep(600);
const swAfter = await js(`JSON.stringify(SUN5D_S.blocks)`);
ok("load puts the survivor into the shared model", swBefore !== swAfter, `${swBefore} -> ${swAfter}`);
await js(`document.querySelector('#rail a[data-id="sun5d"]').click()`);
await sleep(700);
ok("...and the builder is now holding it, so the loop closes",
   (await js(`JSON.stringify(SUN5D_S.blocks)`)) === swAfter);
await shot("5-sweep");

/* ---- the console ------------------------------------------------------------------------- */

const errs = events.filter((e) => e.method === "Log.entryAdded" &&
                                  ["error", "warning"].includes(e.params.entry.level))
                   .map((e) => `${e.params.entry.level}: ${e.params.entry.text}`);
const exc = events.filter((e) => e.method === "Runtime.exceptionThrown")
                  .map((e) => e.params.exceptionDetails.exception?.description ||
                              e.params.exceptionDetails.text);
H("the console, through all of it");
ok("nothing thrown, nothing warned", errs.length + exc.length === 0,
   [...exc, ...errs].map((s) => String(s).split("\n")[0]).join(" | "));

console.log(`\nshots in ${OUT}`);
console.log(`${fail === 0 ? "PASSED" : "*** FAILED ***"}   ${pass} ok, ${fail} failed`);
ws.close();
chrome.kill();
process.exit(fail === 0 ? 0 : 1);

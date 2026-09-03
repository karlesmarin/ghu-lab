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

/* ---- the BLKT demonstration, driven ------------------------------------------------------- */
/* A DEMONSTRATION THAT CANNOT BE SENT IS A DEMONSTRATION NOBODY SEES.  The dial, the button and
 * the permalink are section-and-shell code; no module harness reaches any of them, and the
 * permalink is the piece the whole idea rests on -- a link to this page is what turns a claim in a
 * letter into something the reader checks in thirty seconds. */
H("the brane-kinetic-terms demonstration, on the built page");
await js(`document.querySelector('#rail a[data-id="blkt"]').click()`);
await sleep(900);

ok("the section is up and says it holds its own model",
   /own model/i.test(await js(`document.querySelector('#topChips .live')?.textContent || ''`)));

const bkRows = () => js(`document.querySelectorAll('#bkTowerTab tr').length`);
ok("the spectrum table is populated", (await bkRows()) >= 4);
ok("the join table has its nine rows", (await js(`document.querySelectorAll('#bkJoin tr').length`)) === 9);
ok("...and its verdict says the two equations meet",
   /meet/.test(await js(`document.getElementById('bkJoinV').textContent`)) &&
   (await js(`document.getElementById('bkJoinV').className`)).includes("stable"));

/* THE NUMBER THAT WOULD TRAVEL IN A LETTER.  Their p. 22 says 1.4 TeV; their own (5.19) at their
 * own minimum gives 1171 GeV, and 1.4 TeV is that equation with alpha_2 dropped.  The page has to
 * compute both and say which is which -- that is the whole demonstration. */
const bkScale = await js(`document.getElementById('bkScale').textContent`);
const bkNote = await js(`document.getElementById('bkScaleNote').textContent`);
ok("step 4 recomputes their 303 GeV rather than quoting it", /30[0-9] GeV/.test(bkScale), bkScale.slice(0, 120));
ok("...and their c = 15 row is 1171 GeV, not the 1.4 TeV they printed",
   /1\.171 TeV/.test(bkScale), bkScale.slice(0, 260));
ok("...using their c = 15 minimum and not the c = 0 one, which are different numbers",
   /0\.46, 0\.30/.test(bkScale) && !/1213/.test(bkScale.replace(/belongs[\s\S]*/, "")),
   bkScale.slice(0, 260));
/* THE WORDING IS PART OF THE CLAIM.  The note used to say the 1.398 TeV was their equation with
 * alpha_2 "dropped" -- a diagnosis of their paper. It now reports what each reading gives and
 * leaves the pairing open, because that is what we said to the authors, and the page must not
 * assert more in their absence than the letter does to their faces. */
ok("...and the note gives 1.398 TeV as the same equation on alpha_1 alone",
   /1\.39[0-9] TeV/.test(bkNote) && /alpha_1 alone|α₁ alone/.test(bkNote), bkNote.slice(0, 220));
ok("...and no longer diagnoses it as something they dropped", !/dropped/.test(bkNote));
/* THE TABLE AND THE NOTE MUST SAY THE SAME THING.  A patch that reframed the note did NOT reframe
 * the row beside it -- the replacement was written without an assertion and failed in silence, so
 * the page shipped saying "...with alpha_2 dropped -- not a route, a diagnosis" in the table while
 * the note below it left the question open.  Two texts about one number are two claims. */
ok("...and the TABLE agrees with the note rather than contradicting it",
   !/dropped|a diagnosis/.test(bkScale) && /alone/.test(bkScale), bkScale.slice(0, 300));
ok("...and warns that the two minima are not interchangeable",
   /not interchangeable/.test(bkNote), bkNote.slice(0, 240));

/* the dial actually recomputes */
const firstAt = async () => js(`document.querySelector('#bkTowerTab tr td:nth-child(3)').textContent`);
const bkBefore = await firstAt();
await js(`const e=document.getElementById('bkC'); e.value=20; e.dispatchEvent(new Event('input')); true`);
await sleep(400);
const bkAfter = await firstAt();
ok("moving the dial moves the spectrum", bkBefore !== bkAfter, `${bkBefore} -> ${bkAfter}`);

/* THE PERMALINK.  Everything below is what makes the link in a letter work. */
const hash = await js(`location.hash`);
ok("the dial is in the URL, so this state can be sent to someone", /blkt\.s=/.test(hash), hash);
ok("...and only what differs from the default travels", !/a1%3A0\.44/.test(hash), hash);

await js(`location.hash = "s=blkt&blkt.s=" + encodeURIComponent("c:15|a1:0.438|a2:0.299"); true`);
await sleep(900);
ok("a hand-written link opens on exactly that model",
   (await js(`document.getElementById('bkCv').textContent`)) === "15.0" &&
   (await js(`document.getElementById('bkA1v').textContent`)) === "0.44",
   await js(`document.getElementById('bkCv').textContent + " / " + document.getElementById('bkA1v').textContent`));

await js(`document.getElementById('bkDemo').click(); true`);
await sleep(1200);
ok("the demonstration button runs and says where it is",
   /c = /.test(await js(`document.getElementById('bkBusy').textContent`)),
   await js(`document.getElementById('bkBusy').textContent`));
await sleep(5200);
ok("...and puts the dial back when it finishes",
   (await js(`document.getElementById('bkBusy').textContent`)) === "");
await shot("6-blkt");

/* ---- the LaTeX export, driven ------------------------------------------------------------- */
/* THE BUTTON IS SECTION-AND-SHELL CODE, WHERE NO MODULE HARNESS REACHES.  `_test_latex.mjs` proves
 * the renderer; nothing proves that pressing the button in the built page reaches it with the model
 * the page is holding.  That gap is where `Showing 40 of 24` lived.  So: stub the download, press
 * the real button on the real page, and read what came out.  A file the reader never sees is the
 * only thing being stubbed. */
H("the LaTeX button, on the built page, with the model the page is holding");
await js(`document.querySelector('#rail a[data-id="sun5d"]').click()`);
await sleep(700);

/* capture EVERY blob the handler hands over, not the last one: the button writes two files and a
 * single variable would silently test only the second. */
/* THE STUB IS RESTORED AFTERWARDS, and forgetting that cost an hour.  The rail's entries are
 * <a> elements, so replacing HTMLAnchorElement.prototype.click to swallow the download ALSO
 * swallowed every later navigation: six checks below then measured whatever section the page
 * happened to be sitting on and reported it as a defect in the page.  A stub installed for one
 * check must not survive into the next. */
await js(`window.__blobs = [];
  window.__realCreate = URL.createObjectURL;
  window.__realClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = (blob) => { window.__blobs.push(blob); return "blob:stub"; };
  HTMLAnchorElement.prototype.click = function () {};
  true`);
await js(`document.getElementById('btnTex').click(); true`);
/* the .bib is written half a second after the .tex on purpose -- two downloads in one tick make a
 * browser ask whether the page may grab files -- so the wait here has to outlast the stagger */
await sleep(1200);
const blobs = JSON.parse(await js(
  `Promise.all(window.__blobs.map((b) => b.text())).then((a) => JSON.stringify(a))`));
const texOut = blobs.find((b) => b.includes("\\begin{table}")) || "";
const bibOut = blobs.find((b) => b.trimStart().includes("@article{")) || "";

ok("pressing it writes TWO files, the document and its bibliography", blobs.length === 2,
   `got ${blobs.length}`);
ok("...the document carries the potential of the model the page is holding",
   /\\begin\{equation\}[\s\S]*V_\{\\mathrm\{eff\}\}[\s\S]*\\cos\(/.test(texOut));
ok("...and the results table with its status column",
   texOut.includes("\\begin{table}") && texOut.includes("\\textsc{"));
ok("...and no raw BibTeX, which LaTeX would typeset as a paragraph of prose",
   !/^@\w+\{/m.test(texOut));
ok("...but a pointer to the entries, so the reader knows where they went",
   texOut.includes("companion .bib") && texOut.includes("\\cite{Haba:2004qh}"));
ok("the .bib carries the formula's entry, with the volume the registry holds",
   bibOut.includes("@article{Haba:2004qh") && /volume\s+= \{02\}/.test(bibOut));
ok("...and its DOI, so it resolves when a URL rots",
   bibOut.includes("10.1088/1126-6708/2004/02/059"));
ok("neither file leaves ASCII, so pdflatex and bibtex take them",
   !/[^\x00-\x7f]/.test(texOut + bibOut));

await js(`URL.createObjectURL = window.__realCreate;
          HTMLAnchorElement.prototype.click = window.__realClick; true`);
ok("the download stubs are put back, so later checks navigate for real",
   (await js(`HTMLAnchorElement.prototype.click === window.__realClick &&
              typeof window.__realClick === "function"`)) === true);

/* THE FILE MUST NAME ONE MODEL.  This section declares `holds()`, so the shell's chip is not a
 * model id at all -- it says the section carries its own.  The export therefore has to be about
 * THIS model: its boundary condition, and a card built from it. */
const blocksNow = await js(`JSON.stringify(sun5dBlocks(SUN5D_S.blocks))`);
const bn = JSON.parse(blocksNow);
ok("the file is about the model this section holds, not the family's",
   texOut.includes(`(${bn.nPP}, ${bn.nPM}, ${bn.nMP}, ${bn.nMM})`),
   `blocks ${bn.nPP},${bn.nPM},${bn.nMP},${bn.nMM}`);
ok("...and it names the unbroken group that boundary condition leaves",
   texOut.includes("unbroken"));
ok("...and refuses an absolute scale, because there is no anchor",
   /scale[\s\S]{0,120}\\textsc\{unknown\}/.test(texOut));

/* ---- where the LaTeX button may be seen at all --------------------------------------------- */
/* A CONTROL THAT CANNOT DO WHAT ITS LABEL PROMISES IS WORSE THAN A MISSING ONE.  The shell's card
 * is about the shell's model; a section that declares `holds()` is showing a different one.  Unless
 * it also implements `texExport`, the button would write a correct file about the wrong thing --
 * which is the defect this driver already caught once, in the SU(N) builder.  So it is hidden, and
 * that has to be true section by section rather than asserted once. */
H("the LaTeX button appears only where it exports what is on screen");
{
  const shown = async (id) => {
    await js(`document.querySelector('#rail a[data-id="${id}"]').click()`);
    await sleep(700);
    return !(await js(`document.getElementById('btnTex').hidden`));
  };
  /* sections that stand on the shell's model, or hand over their own */
  for (const id of ["hierarchy", "atlas", "collider", "sun5d", "blkt", "litcensus"])
    ok(`visible on ${id}`, await shown(id));
  /* sections holding a model they do not export: the file would be about something else */
  for (const id of ["spectrum5d", "anomaly5d", "sweep5d", "bcclass"])
    ok(`hidden on ${id}`, !(await shown(id)));

  /* and hidden is not disabled: pressing it anyway must do nothing */
  await js(`document.querySelector('#rail a[data-id="bcclass"]').click()`);
  await sleep(600);
  await js(`window.__blobs = []; URL.createObjectURL = (b) => { window.__blobs.push(b); return "blob:stub"; }; true`);
  await js(`document.getElementById('btnTex').click(); true`);
  await sleep(400);
  ok("...and pressing it there writes nothing at all",
     (await js(`window.__blobs.length`)) === 0);
  await js(`URL.createObjectURL = window.__realCreate; true`);
}

/* ---- the T^2/Z_6 table, and the register it is written in ----------------------------------- */
/* THIS PAGE COUNTS; IT DOES NOT GRADE ANYONE'S EQUATION.  The count is ours and is computed on the
 * render; the two published expressions are quoted as printed.  A verdict about which of them the
 * authors intended is not ours to print in their absence -- so the gate checks the numbers AND the
 * absence of the words that would turn a measurement into an accusation. */
H("T^2/Z_6 is counted on the page, and quoted without a verdict");
{
  await js(`document.querySelector('#rail a[data-id="bcclass"]').click()`);
  await sleep(900);
  const rows = await js(`JSON.stringify([...document.querySelectorAll('#bccZ6 tr')]
      .map(r => [...r.children].map(c => c.textContent.trim())))`);
  const R = JSON.parse(rows);
  ok("the table draws eight rows, N = 1..8", R.length === 8, `${R.length} rows`);
  ok("the diagonal column is the control and equals C(N+5,5) on every row",
     R.every((r) => r[2] === r[3]), JSON.stringify(R.map((r) => [r[2], r[3]])));
  const byN = Object.fromEntries(R.map((r) => [r[0], r]));
  ok("at N = 7 the page counts 1548 and quotes 1548 for the sum",
     byN["7"][4] === "1548" && byN["7"][5] === "1548", JSON.stringify(byN["7"]));
  ok("...and quotes 1536 for eq. (5.9), and 1548 for the closed form",
     byN["7"][6] === "1536" && byN["7"][7] === "1548", JSON.stringify(byN["7"]));
  ok("at N = 8 the same three columns read 3303, 3231, 3303",
     byN["8"][4] === "3303" && byN["8"][6] === "3231" && byN["8"][7] === "3303",
     JSON.stringify(byN["8"]));
  ok("up to N = 6 all three agree, which is the range of their Table 2",
     [1, 2, 3, 4, 5, 6].every((n) => byN[String(n)][4] === byN[String(n)][6]
                                  && byN[String(n)][4] === byN[String(n)][7]));

  const note = await js(`document.getElementById('bccZ6Note').textContent`);
  ok("the note says which columns are counted here and which are quoted",
     /counted here/.test(note) && /quoted/.test(note), note.slice(0, 200));
  ok("...and leaves the question to the authors rather than answering it",
     /question for the authors/.test(note));
  ok("...and never calls it an error, a mistake or wrong",
     !/\b(error|mistake|wrong|incorrect)\b/i.test(note), note.slice(0, 300));
  const html = await js(`document.getElementById('bccZ6').innerHTML`);
  ok("no column is coloured to mark one expression as the bad one",
     !/color:\s*var\(--red/.test(html) && !/#c0392b/.test(html));
}

/* ---- a file must cite the paper its numbers came from --------------------------------------- */
/* THE BIBLIOGRAPHY USED TO FOLLOW THE GROUP, NOT THE FILE.  The BLKT demonstration computes
 * nothing but Akamatsu-Hirose-Maru-Nago 2026 -- their (3.19), (3.21), (4.2) -- and because its
 * card declares `group: "su3_hy"` the exported .bib listed Haba-Yamashita and four others and
 * omitted theirs entirely.  A bibliography that omits the source of every number in the document
 * is worse than none: it points the reader at the wrong five papers.  And the letter to those four
 * authors linked to that very page.  Sections now declare their own sources; this is the gate. */
H("an exported file cites the paper its numbers came from");
{
  const grab = async (id) => {
    await js(`document.querySelector('#rail a[data-id="${id}"]').click()`);
    await sleep(700);
    await js(`window.__blobs = [];
              window.__realCreate = window.__realCreate || URL.createObjectURL;
              window.__realClick = window.__realClick || HTMLAnchorElement.prototype.click;
              URL.createObjectURL = (b) => { window.__blobs.push(b); return "blob:stub"; };
              HTMLAnchorElement.prototype.click = function () {}; true`);
    await js(`document.getElementById('btnTex').click(); true`);
    await sleep(1200);
    const out = JSON.parse(await js(
      `Promise.all(window.__blobs.map((b) => b.text())).then((a) => JSON.stringify(a))`));
    /* PUT THE STUBS BACK BEFORE THE NEXT NAVIGATION.  The rail entries are <a>: a click stub left
     * in place makes every later section switch do nothing, in silence. */
    await js(`URL.createObjectURL = window.__realCreate;
              HTMLAnchorElement.prototype.click = window.__realClick; true`);
    return { tex: out.find((b) => b.includes("\\begin{table}")) || "",
             bib: out.find((b) => /^@\w+\{/m.test(b.trimStart())) || "" };
  };

  const bk = await grab("blkt");
  ok("the BLKT export's bibliography carries Akamatsu-Hirose-Maru-Nago 2026",
     bk.bib.includes("Akamatsu:2026sjg"), bk.bib.slice(0, 160));
  ok("...and the document points at that key, not at somebody else's",
     bk.tex.includes("\\cite{Akamatsu:2026sjg}"));
  ok("...and no longer inherits the five sources of its group",
     !bk.bib.includes("Haba:2004qh"), bk.bib.slice(0, 200));

  const ct = await grab("litcensus");
  ok("the census exports its rows as a table, not as flattened key-value pairs",
     ct.tex.includes("tab:ghu-census") && ct.tex.includes("\\cmidrule"));
  ok("...with a row per paper somebody read",
     (ct.tex.match(/\\cite\{/g) || []).length >= 8,
     `${(ct.tex.match(/\\cite\{/g) || []).length} citations`);
  ok("...and its .bib carries the papers the table cites",
     ct.bib.includes("Kawamura:2025bgx") && ct.bib.includes("Akamatsu:2026sjg"));
  ok("...naming the authors the title page names, not an initialism guessed from a file name",
     /Kawamura/.test(ct.tex) && !/Kubota|Kubo\b/.test(ct.tex + ct.bib));
  ok("...and the orbifold column says T^2/Z_4, which is the one that paper studies",
     /T\^\{2\}\/Z_\{4\}/.test(ct.tex), (ct.tex.match(/T\^\{2\}[^&]*/) || [""])[0]);
  ok("neither census file leaves ASCII, so pdflatex and bibtex take them",
     !/[^\x00-\x7f]/.test(ct.tex + ct.bib));
  /* A CAPTION IS A CLAIM ABOUT THE COLUMN BESIDE IT, AND NOBODY GATES CAPTIONS.  The first draft
   * said a row needs content and a minimum -- but von Gersdorff-Irges-Quiros prints both and
   * counts zero, because a row needs the whole triple.  The caption and the table were two
   * statements about one number, and they disagreed on the page. */
  ok("the caption states the rule the rows are actually counted by",
     /whole triple/.test(ct.tex) && /Higgs mass or a compactification scale/.test(ct.tex));
  /* AND NOWHERE ELSE IN THE FILE STATES A DIFFERENT ONE.  Correcting the caption left the card's
   * `source` line carrying the first draft's rule, and the compiled PDF printed the two of them
   * one page apart.  A criterion is one claim wherever it appears. */
  ok("...and no other line in the document states a different rule",
     !/content together with a minimum/.test(ct.tex), "the superseded criterion is still in here");
  {
    const dots = [...ct.tex.matchAll(/^\s{4}(\S.*?)\\\\$/gm)].map((m) => m[1])
      .filter((r) => r.includes("\\cite{"));
    const bad = dots.filter((r) => {
      const c = r.split("&").map((x) => x.trim());
      const triple = c[2] === "$\\bullet$" && c[3] === "$\\bullet$" &&
                     (c[4] === "$\\bullet$" || c[5] === "$\\bullet$");
      return triple !== (c[6] !== "--");
    });
    ok("...and every row's dots agree with the number of rows it is credited",
       bad.length === 0, bad.join(" || ").slice(0, 300));
  }

  /* THE FILES GO TO DISK, BECAUSE THE ONLY REAL TEST OF AN EXPORTER IS THE DESTINATION.  Checking
   * the string here says the shape is right; compiling what actually left the page is what says
   * the document builds.  Reconstructing it outside the browser would test the reconstruction. */
  writeFileSync(path.join(OUT, "census_export.tex"), ct.tex, "utf-8");
  writeFileSync(path.join(OUT, "census_export.bib"), ct.bib, "utf-8");
  writeFileSync(path.join(OUT, "blkt_export.tex"), bk.tex, "utf-8");
  writeFileSync(path.join(OUT, "blkt_export.bib"), bk.bib, "utf-8");
}

/* ---- the permalink a mail client will not maul ---------------------------------------------- */
H("the demonstration's link survives being sent");
{
  await js(`document.querySelector('#rail a[data-id="blkt"]').click()`);
  await sleep(700);
  await js(`const e=document.getElementById('bkC'); e.value=15; e.dispatchEvent(new Event('input')); true`);
  await sleep(400);
  const h = await js(`location.hash`);
  /* the hash is percent-encoded, so `:` is %3A and `,` is %2C -- compare after decoding */
  const st = decodeURIComponent((h.match(/blkt\.s=([^&]*)/) || [])[1] || "");
  ok("the state is separated by commas, not by a pipe",
     /c:15/.test(st) && st.includes(",") && !st.includes("|"), st);
  /* and the pipe still decodes, because links already went out with it */
  await js(`location.hash = "s=blkt&blkt.s=" + encodeURIComponent("c:15|a1:0.46|a2:0.30"); true`);
  await sleep(800);
  ok("an old pipe link still opens where it did",
     (await js(`document.getElementById('bkCv').textContent`)) === "15.0" &&
     (await js(`document.getElementById('bkA1v').textContent`)) === "0.46");
  await js(`location.hash = "s=blkt&blkt.s=" + encodeURIComponent("c:15,a1:0.46,a2:0.30"); true`);
  await sleep(800);
  ok("and the comma link opens in the same place",
     (await js(`document.getElementById('bkCv').textContent`)) === "15.0" &&
     (await js(`document.getElementById('bkA1v').textContent`)) === "0.46");
}

/* ---- what the page says, against what the letter says ---------------------------------------- */
H("the page does not assert more in their absence than the letter says to their faces");
{
  const note = await js(`document.getElementById('bkScaleNote').textContent`);
  ok("it cites p. 21 for their sentence, which is where it is", /p\. 21/.test(note), note.slice(0, 90));
  ok("...and no longer p. 22", !/p\. 22/.test(note));
  ok("it names which minimum belongs to which c as an OPEN question put to the authors",
     /could not settle/.test(note) && /put to the authors/.test(note), note.slice(-220));
  ok("...and says the row measures their equation rather than judging their paper",
     /measures their equation/.test(note));
}

/* ---- the dossier: the claim is an INTERACTION, so it is driven --------------------------- */
/* The section says that clicking a gauge-equivalent boundary condition leaves the invariant rows
 * standing and moves the frame rows.  That is a sentence in a harness and a fact on a page, and
 * only a real click on the real table decides which.  Also driven: the stale-sweep band, which is
 * the panel's own version of the failure it exists to name. */
H("one model, every verdict — the class walk, on the built page");
{
  await js(`SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 4, nMM: 1 };
            SUN5D_S.bulk = { "fund|1|dirac": 1 };
            document.querySelector('#rail a[data-id="dossier"]').click(); true`);
  await sleep(1600);
  const row = (k) => `[...document.querySelectorAll('#dsLines tr')]` +
    `.find((t) => t.textContent.includes(${JSON.stringify(k)}))` +
    `?.children[1].textContent.trim().split("across")[0].trim()`;
  const tag = (k) => `[...document.querySelectorAll('#dsLines tr')]` +
    `.find((t) => t.textContent.includes(${JSON.stringify(k)}))` +
    `?.children[2].textContent.trim()`;
  ok("the table is drawn and every group heading is in it",
     (await js(`document.querySelectorAll('#dsLines tr').length`)) > 18);
  ok("SU(6) [1,0,4,1] with one bulk fundamental owes, and the anomaly verdict is the FRAME's",
     (await js(row("Anomaly verdict"))) === "owes" &&
     (await js(tag("Anomaly verdict"))) === "the frame",
     `${await js(row("Anomaly verdict"))} / ${await js(tag("Anomaly verdict"))}`);

  const depth0 = await js(row("Depth of the vacuum")), grp0 = await js(row("Apparent unbroken"));
  const vacAtMin0 = await js(row("Unbroken group at the minimum"));
  const other = await js(`[...document.querySelectorAll('#dsMembers tr[data-bc]')]` +
    `.find((t) => t.dataset.bc !== "1,0,4,1")?.dataset.bc`);
  ok("the class has another member to stand on", typeof other === "string" && other.length > 0,
     String(other));
  await js(`[...document.querySelectorAll('#dsMembers tr[data-bc]')]` +
    `.find((t) => t.dataset.bc !== "1,0,4,1").click(); true`);
  await sleep(1600);
  const depth1 = await js(row("Depth of the vacuum")), grp1 = await js(row("Apparent unbroken"));
  ok("standing somewhere else in the same theory leaves the depth of the vacuum exactly where it was",
     depth0 === depth1 && depth0 !== undefined, `${depth0} -> ${depth1}`);
  ok("...and moves the apparent unbroken group, which is the whole claim",
     grp0 !== grp1, `${grp0} -> ${grp1}`);
  /* and the group AT THE MINIMUM, which is the theory's, must not have moved on the same click */
  const vac1 = await js(row("Unbroken group at the minimum"));
  ok("...while the unbroken group at the minimum stays, and is tagged the theory's",
     typeof vac1 === "string" && vac1.length > 0 && vac1 === vacAtMin0 &&
     (await js(tag("Unbroken group at the minimum"))) === "the theory",
     `${vacAtMin0} -> ${vac1} / ${await js(tag("Unbroken group at the minimum"))}`);
  ok("...and the vacuum line says where it stands",
     /a symmetric point|broken — /.test(await js(row("Where the vacuum stands"))),
     String(await js(row("Where the vacuum stands"))));
  ok("...and the builder is now holding the other one, so the model really moved",
     (await js(`JSON.stringify([SUN5D_S.blocks.nPP, SUN5D_S.blocks.nPM,` +
               ` SUN5D_S.blocks.nMP, SUN5D_S.blocks.nMM])`)) ===
     JSON.stringify(other.split(",").map(Number)));

  /* the sweep, and then the same sweep left standing under a different N */
  await js(`document.getElementById('dsSepGo').click(); true`);
  await sleep(4000);
  ok("the separation sweep draws, and finds lines that separate nothing",
     /separates nothing/.test(await js(`document.getElementById('dsSep').innerHTML`)));
  await js(`SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 3, nMM: 1 };
            document.querySelector('#rail a[data-id="sun5d"]').click(); true`);
  await sleep(900);
  await js(`document.querySelector('#rail a[data-id="dossier"]').click(); true`);
  await sleep(1600);
  ok("a sweep from another N is banded as such rather than read as this model's answer",
     /This sweep is SU\(6\), and the model is SU\(5\)/
       .test(await js(`document.getElementById('dsSep').textContent`)),
     (await js(`document.getElementById('dsSep').textContent`)).slice(0, 90));
}
await shot("6-dossier");

/* ---- the simulator: the HHKY anchor content on the builder, predicted, on the built page ------ */
H("the simulator — HHKY's SU(3) content, the table against measurement, and both pictures");
{
  await js(`SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 0, nMM: 2 };
            SUN5D_S.bulk = { "adj|1|dirac": 2, "fund|-1|dirac": 8, "fund|1|scalar": 4, "fund|-1|scalar": 2 };
            document.querySelector('#rail a[data-id="predict"]').click(); true`);
  await sleep(1800);
  const cell = (k) => `[...document.querySelectorAll('#prTable tr')]` +
    `.find((t) => t.textContent.includes(${JSON.stringify(k)}))?.children[1].textContent.trim()`;
  ok("the table is drawn with 1/R, m_H, sin²θ_W and the bulk fields",
     (await js(`document.querySelectorAll('#prTable tr').length`)) >= 5);
  ok("1/R from the measured W at HHKY's vacuum is 2.75 TeV", /2\.75\d TeV/.test(await js(cell("1/R"))), String(await js(cell("1/R"))));
  ok("the predicted Higgs mass is the anchored 54 GeV, printed beside 125.20",
     /^5[3-5]\.\d GeV$/.test(await js(cell("m_H"))), String(await js(cell("m_H"))));
  ok("the tower note carries 1/R and the picture is not blank",
     /1\/R = <b>2\.75/.test(await js(`document.getElementById('prTowerNote').innerHTML`)) &&
     (await js(`(() => { const c = document.getElementById('prTower'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })()`)) > 2000);
  ok("the reach plot says no event is simulated", /No event is simulated/.test(await js(`document.getElementById('prReachNote').textContent`)));
  await js(`document.getElementById('prG4').value = 1.0; document.getElementById('prG4').dispatchEvent(new Event('input')); true`);
  await sleep(900);
  ok("moving g₄ to 1.0 moves the predicted Higgs mass with it, to about 83 GeV",
     /^8[1-5]\.\d GeV$/.test(await js(cell("m_H"))), String(await js(cell("m_H"))));
  await js(`document.getElementById('prG4Reset').click(); true`);
  await sleep(600);
}
await shot("7-simulator");

/* ---- the how-to: every section carries one, and it OPENS ---------------------------------- */
H("every section opens with a how-to, and pressing it shows steps");
{
  const ids = await js(`JSON.stringify(SECTIONS.filter((s) => s.ready !== false).map((s) => s.id))`);
  const list = JSON.parse(ids);
  let missing = [], thin = [];
  for (const id of list) {
    await js(`document.querySelector('#rail a[data-id="${id}"]').click(); true`);
    await sleep(400);
    const has = await js(`!!document.querySelector('#section details.howto')`);
    if (!has) { missing.push(id); continue; }
    const n = await js(`document.querySelectorAll('#section details.howto ol li').length`);
    if (n < 2) thin.push(`${id}:${n}`);
  }
  ok(`all ${list.length} built sections mount a how-to`, missing.length === 0, missing.join(", "));
  ok("...and every one carries at least two steps", thin.length === 0, thin.join(", "));
  await js(`document.querySelector('#rail a[data-id="predict"]').click(); true`);
  await sleep(500);
  await js(`document.querySelector('#section details.howto').open = true; true`);
  await sleep(300);
  ok("the block opens and its text is visible",
     (await js(`document.querySelector('#section details.howto').offsetHeight`)) > 60);
}

/* ---- the demo, and the reading: both must MOVE when a parameter moves ---------------------- */
H("the demo drives the panel, and the reading follows the numbers");
{
  await js(`SUN5D_S.blocks = { nPP: 1, nPM: 0, nMP: 0, nMM: 2 };
            SUN5D_S.bulk = { "adj|1|dirac": 2, "fund|-1|dirac": 8, "fund|1|scalar": 4, "fund|-1|scalar": 2 };
            document.querySelector('#rail a[data-id="predict"]').click(); true`);
  await sleep(1600);
  const reading = `document.getElementById('prReading').textContent`;
  const before = await js(reading);
  ok("the reading names the scale, the bound and the hypothesis it rests on",
     /2\.7\d\d TeV/.test(before) && /6\.600 TeV/.test(before) && /colour lives in the bulk/i.test(before),
     String(before).slice(0, 120));
  ok("...and it is not the same sentence for every model: it carries this Higgs mass",
     /5[0-9]\.\d GeV/.test(before), String(before).slice(0, 160));
  /* move one parameter through its own control and require the reading to move */
  await js(`document.getElementById('prProbe').click(); true`);
  await sleep(600);
  await js(`const s = document.getElementById('prTheta'); s.value = 0.02; s.dispatchEvent(new Event('input')); true`);
  await sleep(1400);
  const after = await js(reading);
  ok("moving the Wilson line moves the reading, and the scale with it",
     after !== before && /8\.0\d\d TeV/.test(after), String(after).slice(0, 120));
  /* the demo button exists here and runs */
  ok("the section carries a demo button", (await js(`!!document.getElementById('demoRun')`)) === true);
  await js(`document.getElementById('demoRun').click(); true`);
  await sleep(1500);
  ok("pressing it opens the caption bar with a step counter",
     /demo 1\/6/.test(await js(`document.getElementById('demoBar').textContent`)),
     String(await js(`document.getElementById('demoBar') && document.getElementById('demoBar').textContent`)).slice(0, 80));
  await js(`document.getElementById('demoNext').click(); true`);
  await sleep(1200);
  ok("...and `next` advances it", /demo 2\/6/.test(await js(`document.getElementById('demoBar').textContent`)));
  await js(`document.getElementById('demoStop').click(); true`);
  await sleep(900);
  ok("...and `stop` removes the bar and leaves the model it found",
     (await js(`!document.getElementById('demoBar')`)) === true);
}
await shot("8-reading");

/* ---- every degree of freedom in the link, and a link that is garbage ------------------------ */
/* AN OUTSIDE AUDIT OF THE DEPLOYED SOURCE, 2026-09-03, found two things here and both are real.
 * The permalink carried the multiplicities and not eta or the matter/gauge role, although both are
 * buttons in the calculator and both go into `model()` -- so a link reproduced a DIFFERENT model
 * from the one on screen when it was copied, under a button that says "the whole state, in the
 * address bar".  And `decodeURIComponent` ran unguarded at startup, so a hash with a lone "%" threw
 * before anything was mounted and left the reader a blank page.
 *
 * The checks below are the ones that were missing rather than the ones that were easy: a ROUND TRIP
 * through the real buttons, with a control leg that would fail if the reset were not happening, and
 * a set of deliberately broken hashes with the rule that none of them may stop the interface. */
H("the permalink carries every dial, and no hash a reader can type may blank the page");
{
  await js(`document.querySelector('#rail a[data-id="calculator"]').click()`);
  await sleep(800);
  const eta = `document.querySelector('#cRows button[data-eta]').textContent.trim()`;
  const role = `document.querySelector('#cRows button[data-role]').textContent.trim()`;
  ok("the calculator has a content in it to toggle",
     (await js(`document.querySelectorAll('#cRows tr').length`)) >= 1);
  const eta0 = await js(eta), role0 = await js(role);

  await js(`document.querySelector('#cRows button[data-eta]').click()`);
  await sleep(400);
  await js(`document.querySelector('#cRows button[data-role]').click()`);
  await sleep(400);
  const eta1 = await js(eta), role1 = await js(role);
  ok("clicking the two buttons moves eta and the role", eta1 !== eta0 && role1 !== role0,
     `${eta0}/${role0} -> ${eta1}/${role1}`);

  const link = await js(`location.hash`);
  ok("...and BOTH are now in the URL", /\.e[mp]/.test(link) && /\.r[mp]/.test(link), link);
  /* and the link a reader copies has nothing in it a mail client can maul */
  ok("...with no percent-escape in the markers themselves", !/\.[er]%/.test(link), link);

  /* THE CONTROL LEG, and it is what caught the subtler half of this bug.  A link carries only what
   * differs from the default, and the default is NOT +1: the anchor content of a group carries
   * eta = -1 and role = gauge on some slots, and this group does.  So a link stripped of its
   * markers must come back on the ANCHOR's values — which is also the proof that the round trip
   * below is not passing by simply never resetting anything. */
  const bare = link.replace(/\.[er][mp]/g, "");
  await js(`location.hash = ${JSON.stringify(bare)}; true`);
  await sleep(900);
  ok("a link without the markers opens on the anchor's own eta and role, not on +1 and matter",
     (await js(eta)) === eta0 && (await js(role)) === role0,
     `${await js(eta)}/${await js(role)} (anchor is ${eta0}/${role0})`);

  await js(`location.hash = ${JSON.stringify(link)}; true`);
  await sleep(900);
  ok("and the link that carries them opens on exactly what was on screen when it was copied",
     (await js(eta)) === eta1 && (await js(role)) === role1,
     `${await js(eta)}/${await js(role)}`);

  /* and now the hashes nobody should have to survive */
  for (const bad of ["x=%", "x=%E0%A4%A", "s=calculator&su4_ahmn=%ZZ", "===", "%"]) {
    await js(`location.hash = ${JSON.stringify("#" + bad)}; true`);
    await sleep(700);
    const alive = await js(`!!document.querySelector('#rail a') && ` +
                           `document.getElementById('section').children.length > 0`);
    ok(`a hash of "${bad}" leaves the instrument standing`, alive === true);
  }
  await js(`location.hash = "#s=calculator"; true`);
  await sleep(800);
}

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

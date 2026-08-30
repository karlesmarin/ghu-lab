/* shoot.mjs — look at the page, headless, and report what the console said.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * 307 assertions cannot see a table running off the edge of a card, a number overlapping a label,
 * or a panel that renders blank because a value arrived as a string.  This drives a headless
 * Chromium over the built page, walks every section in the rail, saves a full-height screenshot of
 * each, and prints anything the console emitted.
 *
 * It uses the DevTools protocol directly over the WebSocket that node already has, so there is no
 * dependency to install and nothing to keep in sync.
 *
 *   node build/shoot.mjs [--width 1440] [--out shots]
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const WIDTH = Number(arg("width", 1440));
const OUT = path.join(ROOT, arg("out", "shots"));
/* WHICH BUILD.  The standalone instrument and the site's copy differ by exactly one thing -- the
 * way back to the home page -- and until this argument existed no shooter ever opened the site's
 * copy, so the one element that is only in it was verified by assertions and looked at by nobody.
 * `_test_site.py` proves the link is there, resolves, and that the rest is byte-identical; it
 * cannot see a header that renders it clipped, white on white, or under something else.
 *
 *   node build/shoot.mjs --page site/app/index.html --out shots/site-app
 */
const REL = arg("page", "app/index.html");
/* AND WHICH COPY.  A file on disk that renders is not the same claim as a page that renders when
 * a server hands it over: the deployed copy travels through Pages' MIME types, its CRLF handling
 * and a real origin, where `file://` has none of those.  `--url` shoots what a reader actually
 * gets, so the last check before saying "deployed" looks at the delivered copy and not at ours.
 *
 *   node build/shoot.mjs --url https://karlesmarin.github.io/ghu-explorer/app/ --out shots/live
 */
const PAGE = arg("url", "") || "file:///" + path.join(ROOT, REL).replace(/\\/g, "/");

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

/* One port and one profile PER TARGET.  With `--page` there are now two shooters that both want
 * this file, and sharing the profile meant the second run tried to delete a directory the first
 * one's browser still held -- a failure that looks like a bug in the page and is a bug in the
 * tool.  Both are derived from the output directory, so two targets can never collide. */
const SLOT = [...arg("out", "shots")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 60, 7);
const PORT = 9333 + SLOT;
const USERDIR = path.join(ROOT, `.shoot-profile-${SLOT}`);
/* A fresh profile every run: a stale one carries the previous page's localStorage, and a permalink
 * restored from it would make the screenshots show a state nobody asked for. */
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run",
  "--disable-gpu", "--force-device-scale-factor=2", `--window-size=${WIDTH},1000`,
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
/* `--viewport N` is applied from the START, not only inside shot(): the page has to LAY OUT at
 * that height or anything sized in `vh` is measured against the wrong window -- which is exactly
 * the mistake the first version of this made, reporting a rail bounded to 924px on a run that
 * asked for 720. */
/* `--only a,b` shoots just those rail ids.  The default is still every section, because the
 * whole point of this shooter is that nobody chooses which panel to look at; `--only` exists for
 * the one job that is not inspection -- regenerating a single published image, such as the
 * README's preview -- where walking nineteen sections is waste and the extra shots overwrite
 * the archive of a full run.
 *
 *   node build/shoot.mjs --only hierarchy --width 1200 --viewport 792 --out shots/preview
 */
const ONLY = String(arg("only", "")).split(",").map((x) => x.trim()).filter(Boolean);

const VH = Number(arg("viewport", 0));
const BASE_H = VH || 1000;
await send("Emulation.setDeviceMetricsOverride",
           { width: WIDTH, height: BASE_H, deviceScaleFactor: 2, mobile: false });

await send("Page.navigate", { url: PAGE });
await sleep(1800);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

/* THE FULL-HEIGHT SHOT HAS A BLIND SPOT, and it appeared the day a component was bounded to the
 * VIEWPORT.  This function resizes the emulated viewport to the whole document before capturing,
 * so an element sized in `vh` grows with it: a rail with `max-height: calc(100vh - 76px)` and its
 * own scrollbar photographs as a rail with no scrollbar at all, and the change is invisible in
 * exactly the frame meant to verify it.
 *
 *   node build/shoot.mjs --viewport 720 --out shots/vp
 *
 * keeps the window at a real size and shoots what a reader with that window sees.  Full height
 * stays the default because for everything else it is the more useful frame. */
async function shot(name) {
  if (VH) {
    await send("Emulation.setDeviceMetricsOverride",
               { width: WIDTH, height: VH, deviceScaleFactor: 2, mobile: false });
    await sleep(350);
    const rv = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(rv.data, "base64"));
    return { name, height: VH };
  }
  const h = await evalJs("Math.min(12000, Math.ceil(document.documentElement.scrollHeight))");
  await send("Emulation.setDeviceMetricsOverride",
             { width: WIDTH, height: h, deviceScaleFactor: 2, mobile: false });
  await sleep(450);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride",
             { width: WIDTH, height: BASE_H, deviceScaleFactor: 2, mobile: false });
  return { name, height: h };
}

/* The rail's anchors carry data-id, not a real href -- the section is chosen in JS.  Reading href
 * gave five empty ids and, worse, five silently skipped screenshots and a clean exit. */
const rail = await evalJs(
  `Array.from(document.querySelectorAll('#rail a')).map(a => ({
      id: a.dataset.id || "", text: a.textContent.trim(), cls: a.className }))`);
if (!rail || !rail.filter((x) => x.id).length) {
  console.error("FATAL: the rail yielded no section ids -- refusing to report a clean run with " +
                "nothing shot.");
  ws.close(); chrome.kill(); process.exit(3);
}
/* A screenshot that cannot say which file it opened is half a tool -- the same reason every shot
 * reports which model it held. */
const wayBack = await evalJs(`(() => { const a = document.querySelector('#top .name a');
  if (!a) return 'plain text, no link home';
  const r = a.getBoundingClientRect();
  return `+"`${a.textContent.trim()} -> ${a.getAttribute('href')}  (${Math.round(r.width)}x${Math.round(r.height)} px)`"+`; })()`);
console.log(`page: ${REL}\nway back: ${wayBack}`);
console.log("rail:", JSON.stringify(rail));

/* ASK THE PAGE SOMETHING.  A screenshot answers "does it look right"; some questions are about
 * geometry a picture cannot settle -- whether an element is scrollable, whether its content
 * overflows, what a computed style actually resolved to.  Those were being answered by writing a
 * throwaway script with this same DevTools boilerplate every time.
 *
 *   node build/shoot.mjs --viewport 720 --eval "(() => {const r=document.querySelector('#rail');
 *     return {scroll:r.scrollHeight, client:r.clientHeight};})()"
 */
const EVAL = arg("eval", "");
if (EVAL) console.log("eval:", JSON.stringify(await evalJs(EVAL)));

/* section id -> extra states worth their own frame.  `set` must return true if it did something. */
const VARIANTS = {
  eta: [{
    name: "eta-difference", label: "the atlas in eta-difference mode",
    set: `(() => { const s = document.querySelector('#eAtMode');
                   if (!s || !document.querySelector('#eAtBox').children.length) return false;
                   s.value = 'D'; s.dispatchEvent(new Event('change')); return true; })()`,
  }, {
    /* Back to V before the main shot -- for months the "eta" shot was secretly the D mode, which
     * meant the V branch of everything under the atlas (now the tile diff's "different
     * potentials, same eta-response" verdict) was photographed by nobody. */
    name: "eta-restore", label: "",
    set: `(() => { const s = document.querySelector('#eAtMode');
                   if (s) { s.value = 'V'; s.dispatchEvent(new Event('change')); } return false; })()`,
    wait: 6000,
  }],
  /* The section opens on the theorem's positive branch -- B = canonical of A, five equal.  The
   * NEGATIVE branch (five disagree, two visibly different curves) renders for nobody unless a
   * shot forces it, which is how the escape section shipped a supply table whose absolving half
   * had never fired.  Load row (5) into the probe, shoot, then restore -- a variant whose `set`
   * returns false mutates without taking a duplicate shot. */
  samepot: [{
    name: "samepot-differ", label: "the probe holding row (5): the five disagree",
    set: `(() => { const b = document.querySelector('#spRows button[data-i="4"]');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 1500,
  }, {
    name: "samepot-restore", label: "",
    set: `(() => { const b = document.querySelector('#spCanon');
                   if (b) b.click(); return false; })()`,
  }],
  /* The comb card without a candidate shows the parked window; the HIT branch renders only when
   * a resonance is typed.  Type the k = 1 ceiling itself, shoot, restore. */
  screen: [{
    name: "screen-hit", label: "the comb holding a candidate at the k = 1 ceiling",
    set: `(() => { const i = document.querySelector('#sci_MKK');
                   if (!i) return false;
                   i.value = '10034'; i.dispatchEvent(new Event('change')); return true; })()`,
    wait: 1500,
  }, {
    name: "screen-restore", label: "",
    set: `(() => { const b = document.querySelector('#scClear');
                   if (b) b.click(); return false; })()`,
  }],
  /* The Part II probe opens on the 60, which passes; the refusing branch, gates named, renders
   * only when someone lowers a label.  b -> 0, shoot, restore.  The card repaints itself on each
   * click, so the button is re-queried between clicks. */
  selection: [{
    name: "selection-gate-fails", label: "the Part II probe at (0,0,1): the gates refuse it",
    set: `(() => { const q = () => document.querySelector('#s2Probe button[data-i="1"][data-d="-1"]');
                   if (!q()) return false; q().click(); q().click(); return true; })()`,
    wait: 900,
  }, {
    name: "selection-restore", label: "",
    set: `(() => { const q = () => document.querySelector('#s2Probe button[data-i="1"][data-d="1"]');
                   if (q()) { q().click(); q().click(); } return false; })()`,
  }],
  /* The 5D section opens on the anchor's vacuum; pure gauge -- D = -9, no breaking, no spectrum
   * -- is the branch a reader hits first when they clear, so it gets photographed. */
  /* The collider section opens on the model's ~9 TeV, where the distortion is mild; the probe at
   * the escape branch's 3.97 TeV is where the relief stands up.  Type it, shoot, clear. */
  collider: [{
    name: "collider-probe", label: "the probe at 1/R5 = 3.97 TeV: the escape branch's distortion",
    set: `(() => { const i = document.querySelector('#clR5');
                   if (!i) return false;
                   i.value = '3.97'; i.dispatchEvent(new Event('change')); return true; })()`,
    wait: 1200,
  }, {
    name: "collider-restore", label: "",
    set: `(() => { const i = document.querySelector('#clR5');
                   if (i) { i.value = ''; i.dispatchEvent(new Event('change')); } return false; })()`,
  }],
  /* The designer opens on NOTHING ASKED, which is the one state that says least.  Both branches
   * are the section -- a content, and a certificate that there is none -- and a shooter that only
   * caught the default would document the form and neither answer.  The no-go goes first so the
   * main shot lands on the design; the waits are long because the second one puts candidates on
   * the exact potential. */
  inverse: [{
    /* the axis opens drawing bars, and a bar is the misreading the paper warns about: resolve it
     * into its 35 and 65 points before anything else is photographed */
    name: "inverse-resolved", label: "the clusters resolved: 35 points and 65, not two intervals",
    set: `(() => { const b = document.querySelector('#ivResolve');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 9000,
  }, {
    name: "inverse-nogo", label: "asking inside the gap, 7.5 TeV: the named certificate roster",
    set: `(() => { const i = document.querySelector('#ivTarget'), b = document.querySelector('#ivGo');
                   if (!i || !b) return false;
                   i.value = '7.5'; i.dispatchEvent(new Event('change')); b.click(); return true; })()`,
    wait: 9000,
  }, {
    name: "inverse-design", label: "asking for 9.0 TeV: a content, verified on the exact potential",
    set: `(() => { const i = document.querySelector('#ivTarget'), b = document.querySelector('#ivGo');
                   if (!i || !b) return false;
                   i.value = '9'; i.dispatchEvent(new Event('change')); b.click(); return true; })()`,
    wait: 14000,
  }],
  /* The builder opens on gauge and ghost alone, which never breaks anything -- so the default
   * frame documents the half of the verdict that always says no.  Load the paper's SU(6) example
   * with P != P' and give it four fundamentals: a group the instrument has no data file for, a
   * potential built from a boundary condition, and a vacuum away from the symmetric point. */
  sun5d: [{
    name: "sun5d-su6", label: "their §4.3 SU(6) with four fundamentals: the Hosotani vacuum",
    set: `(() => { const p = document.querySelector('#sunPresets button[data-preset="hy6b"]');
                   if (!p) return false; p.click();
                   for (let i = 0; i < 4; i++) {
                     const b = document.querySelector('#sunBulk button[data-f="fund|1|dirac"][data-d="1"]');
                     if (b) b.click();
                   }
                   return true; })()`,
    wait: 2500,
  }],
  /* The section opens on S1/Z2, where the classification collapses to (N+1)^2 and the label is
   * complete.  T2/Z3 is the OTHER answer -- invariant margins that are not complete, and almost
   * every boundary condition alone in its class -- and it is the half a reader would never see. */
  bcclass: [{
    name: "bcclass-t2z3", label: "the same question on T2/Z3, where the answer is different",
    set: `(() => { const b = document.querySelector('#bccOrb button[data-orb="T2/Z3"]');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 4000,
  }, {
    name: "bcclass-restore", label: "",
    set: `(() => { const b = document.querySelector('#bccOrb button[data-orb="S1/Z2"]');
                   if (b) b.click(); return false; })()`,
    wait: 1500,
  }],
  /* The spectrum panel opens on whatever the builder is holding, and the builder opens on the
   * gauge sector alone -- which has no fermions, so the chirality verdict says "nothing to be
   * chiral about" and the one statement the section exists for is photographed by nobody.  Load
   * the SU(6) with P != P' and give it fermions. */
  spectrum5d: [{
    name: "spectrum5d-chiral", label: "SU(6) with four fundamentals: 1 left-handed against 2 right",
    /* through the section's OWN button: a variant cannot reach the builder's controls, because the
     * shell mounts one section at a time -- the first version of this clicked at ids that were not
     * on the page and returned a truthy value anyway */
    set: `(() => { const b = document.querySelector('#spExample');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 3000,
  }],
  /* the ledger opens on the builder's state, which is the gauge sector alone -- no fermions, so
   * nothing to be anomalous about, and the one thing the panel exists to show would be in no
   * frame.  Its own example button, for the same reason as the spectrum panel's. */
  anomaly5d: [{
    name: "anomaly5d-owing", label: "SU(6) with four fundamentals: the channels left owing",
    set: `(() => { const b = document.querySelector('#anExample');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 2500,
  }],
  /* the sweep does not run on render -- deliberately, it is seconds -- so an unpressed panel is
   * the honest default view and also the one that shows nothing.  Press its own run button. */
  sweep5d: [{
    name: "sweep5d-run", label: "SU(6), the full chain: the funnel and the survivors",
    set: `(() => { const b = document.querySelector('#swRun');
                   if (!b) return false;
                   document.querySelectorAll('#swFilters input[type=checkbox]')
                     .forEach((c) => { if (!c.checked) { c.checked = true; c.onchange(); } });
                   document.querySelector('#swRun').click(); return true; })()`,
    wait: 9000,
  }],
  fived: [{
    name: "fived-pure-gauge", label: "pure gauge: D = -9, nothing breaks",
    set: `(() => { const b = document.querySelector('#fvClear');
                   if (!b) return false; b.click(); return true; })()`,
    wait: 900,
  }, {
    name: "fived-restore", label: "",
    set: `(() => { const b = document.querySelector('#fvAnchor');
                   if (b) b.click(); return false; })()`,
  }],
};

const shots = [];
const wanted = (rail || []).filter((x) => x.id && (!ONLY.length || ONLY.includes(x.id)));
if (ONLY.length && wanted.length !== ONLY.length)
  throw new Error(`--only named ${ONLY.join(", ")} but the rail has `+ `${wanted.map((x) => x.id).join(", ") || "none of them"}`);
for (const s of wanted) {
  await evalJs(`document.querySelector('#rail a[data-id=' + JSON.stringify(${JSON.stringify(s.id)}) + ']').click()`);
  await sleep(900);
  /* Some sections only compute on demand.  Press every sweep button there is -- a screenshot of an
   * unpressed panel documents the button, not the result -- and wait long enough for the slow one,
   * which feeds the browser the catalogue ten representations at a time. */
  const pressed = await evalJs(`(() => {
    const ids = ['#sSweep', '#eSweepGo', '#cSweepGo', '#hSweepGo', '#eAtGo', '#a7Go', '#cnGo'];
    let n = 0;
    for (const id of ids) { const b = document.querySelector(id); if (b) { b.click(); n++; } }
    return n; })()`);

  await sleep(pressed ? 30000 : 700);
  /* A panel with a MODE is two panels, and shooting one of them documents half a claim.  Declared
   * here, in one place, rather than smuggled into the loop: the atlas's whole point is what the
   * eta-difference mode shows, and a screenshot that never switches to it never shows it. */
  for (const vr of (VARIANTS[s.id] || [])) {
    const done = await evalJs(vr.set);
    if (done) { await sleep(vr.wait || 8000); shots.push({ ...(await shot(vr.name)), held: vr.label }); }
    /* a variant that mutates without shooting (returns false) may still need its wait -- a
     * restore that recomputes an atlas takes seconds, and the main shot must not race it */
    else if (vr.wait) await sleep(vr.wait);
  }
  /* What the page thinks it is holding, in its own words -- a screenshot tool that cannot tell you
   * WHICH model it shot is half a tool. */
  const held = await evalJs(`document.querySelector('#top .sub, #top .model, header .sub')?.textContent
                             || document.querySelector('#top')?.textContent.slice(0, 120) || ''`);
  shots.push({ ...(await shot(s.id)), held: String(held).trim().replace(/\s+/g, " ") });
}

/* Whatever the page complained about, in its own words. */
const errs = events.filter((e) => e.method === "Log.entryAdded" &&
                                  ["error", "warning"].includes(e.params.entry.level))
                   .map((e) => `${e.params.entry.level}: ${e.params.entry.text}`);
const exc = events.filter((e) => e.method === "Runtime.exceptionThrown")
                  .map((e) => e.params.exceptionDetails.exception?.description ||
                              e.params.exceptionDetails.text);

console.log("\nshots:");
for (const s of shots)
  console.log(`  ${OUT}\\${s.name}.png   ${WIDTH} x ${s.height}\n      holding: ${s.held}`);
console.log(`\nconsole errors/warnings: ${errs.length + exc.length}`);
for (const e of [...exc, ...errs]) console.log("  " + String(e).split("\n")[0]);

ws.close();
chrome.kill();
process.exit(exc.length ? 1 : 0);

/* links.mjs — open a permalink the way a stranger would, and check it landed.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A LINK IS A CLAIM, AND IT IS THE ONE CLAIM WE MAKE TO PEOPLE WHO ARE NOT HERE.  `_test_app.mjs`
 * runs the round trip in node, which proves `encodeState` and `decodeState` agree with each other;
 * it cannot see the shell dropping the parameter on the way in, a section mounting before its
 * state is read, or a hash a mail client has mangled.  This opens the real page at the real
 * fragment in a real browser and asks the panel what it is holding — `holds()`, the same string
 * the pinned header shows — then saves the screenshot, because a header that reads correctly on a
 * blank panel is still a blank panel.
 *
 *   node build/links.mjs                       # the built copy on disk
 *   node build/links.mjs --url https://karlesmarin.github.io/ghu-explorer/app/index.html
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = arg("url", "file:///" + path.join(ROOT, "app", "index.html").replace(/\\/g, "/"));
const OUT = path.join(ROOT, "shots", "links");

/* THE LINKS WE ACTUALLY HAND OVER.  Each is written here exactly as it would be pasted into a
 * letter — hash and escaping included — so that what is tested is the string that travels and not
 * a reconstruction of it.  `want` is a substring of what the section says it is holding. */
const LINKS = [
  { name: "papers · Kubo-Lim-Yamashita at N_f = 5",
    hash: "#s=papers&papers.s=m%3Akly_su3%7Cnf%3A5",
    section: "papers", want: ["Kubo", "N_f = 5", "8 of 9"] },
  { name: "papers · the same model at N_f = 0, where the two readings agree",
    hash: "#s=papers&papers.s=m%3Akly_su3%7Cnf%3A0",
    section: "papers", want: ["Kubo", "N_f = 0", "9 of 9"] },
  { name: "bcclass · SU(5) [2,0,0,3], which looks like the Standard Model group",
    hash: "#s=bcclass&bcclass.s=o%3As1z2~n%3A5~bc%3A2,0,0,3",
    section: "bcclass", want: ["SU(5)", "[2, 0, 0, 3]"] },
  { name: "bcclass · SU(5) [1,1,1,2], which looks like something else and is the same theory",
    hash: "#s=bcclass&bcclass.s=o%3As1z2~n%3A5~bc%3A1,1,1,2",
    section: "bcclass", want: ["SU(5)", "[1, 1, 1, 2]"] },
  { name: "sun5d · the builder carrying a model, bulk content and all",
    hash: "#s=sun5d&sun5d.s=b%3A1,3,0,2~u%3Afund%7C1%7Cdirac!4",
    section: "sun5d", want: ["SU(6)", "(1,3,0,2)", "4 bulk fields"] },
];

const CHROME = [
  "C:/Users/karles/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) { console.error("no chromium found"); process.exit(2); }

const PORT = 9337;
const USERDIR = path.join(ROOT, ".shoot-profile-links");
rmSync(USERDIR, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

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
let consoleErrors = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error")
    consoleErrors.push(msg.params.entry.text);
  else if (msg.method === "Runtime.exceptionThrown")
    consoleErrors.push(msg.params.exceptionDetails.exception?.description || "exception");
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

const js = async (expr) => {
  const r = await send("Runtime.evaluate",
                       { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __error: r.exceptionDetails.exception?.description || "threw" };
  return r.result?.value;
};

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); }
                               else { fail++; console.log(`  FAIL ${n}${d ? "  — " + d : ""}`); } };

console.log(`\n  opening ${LINKS.length} permalinks against ${BASE}\n`);

for (const [i, L] of LINKS.entries()) {
  consoleErrors = [];
  /* A FRESH LOAD, NOT A HASH CHANGE.  Setting `location.hash` on a page that is already up runs
   * the shell's hashchange path; a stranger clicking a link in a letter runs the STARTUP path,
   * where `decode()` races the mount.  Those are different code paths and only one of them is
   * what we are promising, so each link gets its own navigation. */
  await send("Page.navigate", { url: "about:blank" });
  await sleep(200);
  await send("Page.navigate", { url: BASE + L.hash });
  await sleep(1500);

  const state = await js(`(() => {
    const sec = (typeof SECTIONS !== "undefined") &&
                SECTIONS.find((s) => s.id === ${JSON.stringify(L.section)});
    return { id: (location.hash.match(/s=([a-z0-9_]+)/) || [])[1] || null,
             holds: sec && sec.holds ? sec.holds() : null,
             body: (document.getElementById("body") || document.body).innerText.slice(0, 400) };
  })()`);

  console.log(`  ${i + 1}. ${L.name}`);
  if (state && state.__error) { ok("     the page came up", false, state.__error); continue; }
  ok("     the shell landed on the right section", state.id === L.section, String(state.id));
  ok("     the panel is holding the model the link describes",
     !!state.holds && L.want.every((w) => state.holds.includes(w)),
     String(state.holds));
  ok("     nothing on the console", consoleErrors.length === 0, consoleErrors.join(" | "));

  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  if (shot && shot.data) {
    const f = path.join(OUT, `${String(i + 1).padStart(2, "0")}-${L.section}.png`);
    writeFileSync(f, Buffer.from(shot.data, "base64"));
    console.log(`       shot: ${path.relative(ROOT, f)}`);
  }
  console.log(`       holds: ${state.holds}`);
}

console.log(`\n  ${pass} ok, ${fail} failed\n`);
ws.close();
chrome.kill();
/* chromium is still letting go of its profile directory as this process exits on Windows, and a
 * leftover temp directory is housekeeping rather than a result -- it must not turn a green run red */
try { rmSync(USERDIR, { recursive: true, force: true }); } catch { /* it goes on the next run */ }
process.exit(fail ? 1 : 0);

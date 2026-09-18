/* _chrome.mjs — where the browser gates find a Chromium, without naming anybody's machine.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * NINE FILES USED TO CARRY THE SAME HARD-CODED LINE, and it was wrong in two ways at once.
 *
 *   1. It named the developer's home directory, username and all, in a PUBLIC repository. The
 *      standing rule is that nothing published names the tree it was built from; `_test_privado.py`
 *      now enforces it, and these nine were its first catch after the census.
 *   2. It only worked on that one machine. Anyone else cloning this repo and running a browser
 *      gate got "no chromium found" even with Playwright installed — so the public half of the
 *      validation was, in practice, unrunnable by the public.
 *
 * The fix is the same for both: ask the operating system where the user's home is, look in the
 * places a browser actually installs itself, and let an environment variable win over all of it.
 *
 * ORDER, and why: an explicit `GHU_CHROME` first, because someone who set it means it; then the
 * Playwright cache, because that is what the gates were written against and its version directory
 * changes on every update (so it is globbed, not spelled); then the system browsers, on the three
 * platforms, so a clone works out of the box.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function playwrightChromiums() {
  /* ~/AppData/Local/ms-playwright/chromium-<build>/chrome-win[64]/chrome.exe on Windows,
     ~/.cache/ms-playwright/chromium-<build>/chrome-linux/chrome elsewhere. The build number is
     whatever the last `playwright install` left, so it is listed rather than named. */
  const roots = [join(homedir(), "AppData", "Local", "ms-playwright"),
                 join(homedir(), ".cache", "ms-playwright"),
                 join(homedir(), "Library", "Caches", "ms-playwright")];
  const out = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    let dirs = [];
    try { dirs = readdirSync(root); } catch { continue; }
    for (const d of dirs.filter((x) => x.startsWith("chromium")).sort().reverse())
      out.push(join(root, d, "chrome-win64", "chrome.exe"),
               join(root, d, "chrome-win", "chrome.exe"),
               join(root, d, "chrome-linux", "chrome"),
               join(root, d, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"));
  }
  return out;
}

const SISTEMA = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

/* Returns the path, or exits 2 with a message that says what to do — a gate that cannot find a
 * browser has not passed and must not look as though it had. */
export function findChrome() {
  const candidatos = [process.env.GHU_CHROME, ...playwrightChromiums(), ...SISTEMA];
  const hit = candidatos.filter(Boolean).find((p) => existsSync(p));
  if (!hit) {
    console.error("no chromium found. Install one, or point GHU_CHROME at it:\n" +
                  "  npx playwright install chromium\n" +
                  "  GHU_CHROME=/path/to/chrome node build/<gate>.mjs");
    process.exit(2);
  }
  return hit;
}

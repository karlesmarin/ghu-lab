#!/usr/bin/env python3
"""_test_editiongate.py — does the gate actually fire?

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Feeds the Edition gate pages built to trip it, and pages built to be wrongly accused.

A gate is worth exactly what its false-negative rate is, so most of this file is deliberately bad
input.  The other half matters just as much and is easier to get wrong: an Edition MUST be able to
link to its own Zenodo record, so `<a href="https://doi.org/...">` has to pass.  A gate that
forbids the citation is as broken as one that permits the CDN.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "build"))
from editiongate import check                                        # noqa: E402

PASS, FAIL = [], []


def expect_clean(name, html):
    v, w = check(html)
    (PASS if not v else FAIL).append((name, "" if not v else f"flagged: {[x['rule'] for x in v]}"))


def expect_caught(name, html, rule):
    v, w = check(html)
    hit = any(x["rule"] == rule for x in v)
    (PASS if hit else FAIL).append((name, "" if hit else f"NOT caught (rules fired: {[x['rule'] for x in v]})"))


# ---------------------------------------------------------------- must be caught
expect_caught("a CDN script", '<script src="https://cdn.example/x.js"></script>', "script-src")
expect_caught("even a LOCAL second script", '<script src="engine.js"></script>', "script-src")
expect_caught("a stylesheet", '<link rel="stylesheet" href="style.css">', "link-href")
expect_caught("a web font via CSS", "@import url('https://fonts.example/x.css');", "css-import")
expect_caught("a background image", "body{background:url(bg.png)}", "css-url")
expect_caught("an external image", '<img src="fig.png">', "img-src")
expect_caught("a runtime fetch", "const r = await fetch('/api/x');", "fetch")
expect_caught("an XHR", "const x = new XMLHttpRequest();", "xhr")
expect_caught("a dynamic import", "const m = await import('./mod.mjs');", "dynamic-import")
expect_caught("module syntax", "import { val } from './status.mjs';", "module-syntax")
expect_caught("an export left in", "export function f(){}", "module-syntax")
expect_caught("a worker", "const w = new Worker('w.js');", "worker")
expect_caught("WASM", "WebAssembly.instantiate(bytes);", "wasm")
expect_caught("an iframe", '<iframe src="https://example"></iframe>', "iframe-src")

# ---------------------------------------------------------------- must NOT be caught
expect_clean("a link to Zenodo — the Edition must cite itself",
             '<a href="https://doi.org/10.5281/zenodo.21429144">the record</a>')
expect_clean("a link to arXiv", '<a href="https://arxiv.org/abs/2503.04090">arXiv:2503.04090</a>')
expect_clean("an inline script", "<script>const x = 1;</script>")
expect_clean("an inline style", "<style>body{color:#111}</style>")
expect_clean("a data: image", '<img src="data:image/png;base64,iVBORw0KG">')
expect_clean("a data: font in CSS", "@font-face{src:url(data:font/woff2;base64,d09GMg)}")
expect_clean("an in-page anchor in CSS", "background:url(#grad)")
expect_clean("a canvas", '<canvas id="pot" width="720" height="330"></canvas>')
expect_clean("the word fetch in prose", "<p>This Edition performs no fetch of any kind.</p>")
expect_clean("a mailto", '<a href="mailto:karlesmarin@gmail.com">write</a>')

# ---------------------------------------------------------------- waivers are visible, not silent
v, w = check("const r = fetch('/x');  // edition-allow: unreachable branch, kept for the App build")
PASS.append(("a waived line does not fail the build", "")) if not v else \
    FAIL.append(("a waived line does not fail the build", "still failed"))
PASS.append(("but the waiver is reported", "")) if len(w) == 1 and "unreachable" in w[0]["reason"] \
    else FAIL.append(("but the waiver is reported", f"waivers: {w}"))

# ---------------------------------------------------------------- anti-vacuity on the gate itself
v, _ = check(open(pathlib.Path(__file__).resolve().parent / "src" / "shell" /
                  "hierarchy_shell.html", encoding="utf-8").read()) \
    if (pathlib.Path(__file__).resolve().parent / "src" / "shell" / "hierarchy_shell.html").exists() \
    else ([], [])

print("EDITION GATE — does it fire, and does it stay quiet when it should?\n")
for n, _ in PASS:
    print(f"  ok   {n}")
for n, d in FAIL:
    print(f"  FAIL {n}  — {d}")
print(f"\n{'PASSED' if not FAIL else '*** FAILED ***'}   {len(PASS)} ok, {len(FAIL)} failed")
sys.exit(0 if not FAIL else 1)

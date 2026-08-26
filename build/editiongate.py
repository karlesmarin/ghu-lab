#!/usr/bin/env python3
"""editiongate.py — the mechanical enforcement of DESIGN.md D1.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Refuses to let an Edition ship if it can reach outside itself.

An Edition is the frozen copy of the instrument that goes to Zenodo with a paper.  Its whole value
is that it still runs in ten years from a file on a disk, so it may not depend on anything it does
not carry.  Wolfram CDF is the cautionary precedent: the 2011 answer to "interactive paper
companion" is dead, and every companion built on it is unrunnable today, because it depended on a
runtime it did not ship.

The rule is not a habit or a review checklist.  It is this file, it runs in the build, and a
violation stops the build.  Without that, Tier 2 features leak into Tier 1 by accident and the
archival guarantee dies quietly -- which is the failure mode that leaves no trace until the year it
matters.

WHAT IS FORBIDDEN is anything that LOADS from outside the file.
WHAT IS ALLOWED is a link the reader clicks: <a href="https://doi.org/..."> is not merely permitted,
it is required -- the Edition must point at its own record.  The distinction between "loads" and
"links to" is the whole subtlety here, and getting it wrong in either direction is a real bug.

An occurrence can be waived with `edition-allow: <reason>` on the same line.  Waivers are counted
and printed: an escape hatch nobody can see is not an escape hatch, it is a hole.
"""
import argparse
import pathlib
import re
import sys

WAIVER = re.compile(r"edition-allow\s*:\s*(.+?)\s*(?:\*/|-->|$)", re.I)

# (id, compiled pattern, what it would do at runtime)
RULES = [
    ("script-src", re.compile(r"<script\b[^>]*\bsrc\s*=", re.I),
     "loads a second file; an Edition is one file"),
    # `<link>` captures its value for the same reason the media rules below do.  The favicon is
    # the case that found this: an icon inlined as a data: URI is carried by the file and fetches
    # nothing, which is precisely what this gate tells people to do -- so flagging it punished the
    # fix.  The rule now judges where the href POINTS, not that an href exists.
    ("link-href", re.compile(r"<link\b[^>]*?\bhref\s*=\s*[\"']?([^\"'\s>]*)", re.I),
     "a stylesheet, icon or preload fetched from outside"),
    # These capture the attribute VALUE and judge it, rather than peeking past an optional
    # quote: `src="data:..."` slipped through a lookahead because the quote could match empty.
    ("iframe-src", re.compile(r"<iframe\b[^>]*?\bsrc\s*=\s*[\"']?([^\"'\s>]*)", re.I),
     "embeds a document from outside"),
    ("img-src", re.compile(r"<(?:img|source|video|audio)\b[^>]*?\bsrc\s*=\s*[\"']?([^\"'\s>]*)", re.I),
     "an image or media file fetched from outside; inline it as a data: URI"),
    ("css-import", re.compile(r"@import\b", re.I),
     "CSS pulling in another stylesheet"),
    ("css-url", re.compile(r"\burl\(\s*[\"']?(?!data:)(?!#)", re.I),
     "a CSS asset -- font, image -- fetched from outside"),
    ("fetch", re.compile(r"\bfetch\s*\("),
     "a network request at runtime"),
    ("xhr", re.compile(r"\bXMLHttpRequest\b|\bEventSource\b|\bsendBeacon\b"),
     "a network request at runtime"),
    ("dynamic-import", re.compile(r"\bimport\s*\("),
     "loads a module at runtime; fails from file:// anyway"),
    ("module-syntax", re.compile(r"^\s*(?:import\s+[\w{*]|export\s+(?:const|function|class|default|\{))",
                                 re.M),
     "ES module syntax; modules are fetched with CORS and fail from file://"),
    ("worker", re.compile(r"new\s+(?:Shared)?Worker\s*\(|navigator\.serviceWorker"),
     "a worker script is fetched, and from file:// it is not same-origin"),
    ("wasm", re.compile(r"\bWebAssembly\b|\bimportScripts\s*\("),
     "WASM streaming goes through fetch, which file:// refuses"),
    ("storage-remote", re.compile(r"\bnavigator\.geolocation\b|\bnavigator\.connection\b"),
     "reaches for the environment rather than the document"),
]


def _line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def check(html):
    """Returns (violations, waivers).  Each is a list of dicts; a clean Edition has no violations."""
    lines = html.split("\n")
    violations, waivers = [], []
    for rid, pat, why in RULES:
        for m in pat.finditer(html):
            # A rule that captures a value judges the value: a data: URI is carried by the file,
            # not fetched, so it is exactly what we ask people to use instead.
            if m.groups() and m.group(1) is not None and m.group(1).lower().startswith("data:"):
                continue
            ln = _line_of(html, m.start())
            line = lines[ln - 1] if ln - 1 < len(lines) else ""
            w = WAIVER.search(line)
            rec = {"rule": rid, "line": ln, "why": why,
                   "text": line.strip()[:110]}
            if w:
                rec["reason"] = w.group(1)
                waivers.append(rec)
            else:
                violations.append(rec)
    violations.sort(key=lambda r: r["line"])
    waivers.sort(key=lambda r: r["line"])
    return violations, waivers


def report(path, violations, waivers, out=sys.stdout):
    name = pathlib.Path(path).name
    if waivers:
        print(f"  {len(waivers)} waiver(s) in {name}, and each one is a decision:", file=out)
        for w in waivers:
            print(f"    line {w['line']:5d}  {w['rule']:<15} {w['reason']}", file=out)
    if not violations:
        print(f"  EDITION GATE PASSED — {name} reaches nothing outside itself.", file=out)
        return 0
    print(f"  EDITION GATE FAILED — {name} would reach outside itself:", file=out)
    for v in violations:
        print(f"    line {v['line']:5d}  {v['rule']:<15} {v['why']}", file=out)
        print(f"                     {v['text']}", file=out)
    print("", file=out)
    print("  An Edition that needs the network is not an Edition.  Either inline what it wants,",
          file=out)
    print("  move the feature to the App, or waive the line with `edition-allow: <reason>`.",
          file=out)
    return 1


def main(argv=None):
    ap = argparse.ArgumentParser(description="Refuse an Edition that can reach outside itself.")
    ap.add_argument("files", nargs="+")
    a = ap.parse_args(argv)
    worst = 0
    for f in a.files:
        v, w = check(pathlib.Path(f).read_text(encoding="utf-8"))
        worst = max(worst, report(f, v, w))
    return worst


if __name__ == "__main__":
    sys.exit(main())

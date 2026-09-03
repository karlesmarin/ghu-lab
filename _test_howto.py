#!/usr/bin/env python3
"""_test_howto.py — the per-section how-to, held to the ways it can fail in silence.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

`howToBlock` returns "" for a section it does not know.  That is the right behaviour on the page —
an empty <details> teaches a reader that the blocks are not worth opening — and its cost is that
a section added without an entry ships with no help and nothing says so.  So the gate is here:

  1  every built section has an entry              -- a new section otherwise ships helpless
  2  every entry names a section that exists       -- an entry for a deleted section
  3  no entry is thin: what + at least two steps + read, each a real sentence
  4  the three fields say different things         -- `what` repeated as `read` is not help
  5  the shell MOUNTS it                           -- the block existing is not the block shown

AND THE SECOND HALF IS DELIBERATELY BROKEN INPUT, the same shape as _test_help.py: every check is
fed a source built to trip it, as STRINGS and never as files, because a gate that mutates the tree
to test itself leaves the tree perturbed the first time it is killed halfway.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent

ENTRY_RE = re.compile(r'^  ([a-z][a-zA-Z0-9]*): \{$', re.M)
BLOCK_RE = re.compile(r'^  ([a-z][a-zA-Z0-9]*): \{\n(.*?)\n  \},$', re.M | re.S)
ID_RE = re.compile(r'^\s*id: "([^"]+)"', re.M)


def audit(howto, shell, sections):
    """The whole gate as a function of text: the how-to source, the shell source, and
    {file: section source}.  Returns [(check, complaint)] with an empty complaint meaning pass."""
    keys = ENTRY_RE.findall(howto)
    have = set(keys)
    dupes = sorted({k for k in keys if keys.count(k) > 1})

    ids = set()
    for src in sections.values():
        m = ID_RE.search(src)
        if m:
            ids.add(m.group(1))

    missing = sorted(ids - have)
    orphan = sorted(have - ids)

    thin, samey = [], []
    for k, body in BLOCK_RE.findall(howto):
        # the newline after the last field was eaten by BLOCK_RE, so `read:` -- always last -- has
        # no `",\n` to match and came back empty for EVERY entry, which read as "every entry is
        # thin".  The gate was wrong about a tree that was right; one restored newline fixes it.
        body += "\n"
        what = re.search(r'what: "(.*?)",\n', body, re.S)
        read = re.search(r'read: "(.*?)",\n', body, re.S)
        steps = re.findall(r'"([^"]{12,})"', body)
        w = (what.group(1) if what else "")
        r = (read.group(1) if read else "")
        # the steps are every long string that is not `what` or `read`
        st = [s for s in steps if s not in (w, r)]
        if len(w) < 40 or len(r) < 40 or len(st) < 2:
            thin.append(k)
        if w and r and (w[:40] == r[:40]):
            samey.append(k)

    mounted = "howToBlock(sec.id)" in shell

    return [
        ("every built section has a how-to entry", ", ".join(missing)),
        ("no entry names a section that does not exist", ", ".join(orphan)),
        ("no duplicate entries", ", ".join(dupes)),
        ("no entry is thin: what, at least two steps, and how to read it", ", ".join(thin)),
        ("`what` and `read` say different things", ", ".join(samey)),
        ("the shell mounts the block", "" if mounted else "app.js never calls howToBlock"),
    ]


def main():
    howto = (ROOT / "src/view/howto.js").read_text(encoding="utf-8")
    shell = (ROOT / "src/shell/app.js").read_text(encoding="utf-8")
    sections = {p.name: p.read_text(encoding="utf-8")
                for p in sorted((ROOT / "src/sections").glob("*.js")) if p.name != "registry.js"}

    bad = 0
    print("THE TREE")
    for name, complaint in audit(howto, shell, sections):
        print(f"  {'ok  ' if not complaint else 'FAIL'} {name}" + (f"  — {complaint}" if complaint else ""))
        bad += bool(complaint)

    print("\nAND THE SAME CHECKS ON INPUT BUILT TO BREAK THEM")
    good_howto = 'const HOWTO = {\n  alpha: {\n    what: "' + "x" * 50 + '",\n    steps: ["' + "y" * 20 + '", "' + "z" * 20 + '"],\n    read: "' + "w" * 50 + '",\n  },\n};\n'
    good_shell = "  $('section').innerHTML = howToBlock(sec.id) + sec.html;"
    good_sec = {"a.js": '  id: "alpha",\n'}
    fired = 0
    cases = [
        ("a section with no entry is caught", good_howto, good_shell, {"a.js": '  id: "alpha",\n', "b.js": '  id: "beta",\n'}, 0),
        ("an entry for no section is caught", good_howto + "", good_shell, {"b.js": '  id: "beta",\n'}, 1),
        ("a thin entry is caught",
         'const HOWTO = {\n  alpha: {\n    what: "short",\n    steps: ["one"],\n    read: "also short",\n  },\n};\n',
         good_shell, good_sec, 3),
        ("an entry whose `read` repeats its `what` is caught",
         'const HOWTO = {\n  alpha: {\n    what: "' + "x" * 50 + '",\n    steps: ["' + "y" * 20 + '", "' + "z" * 20 + '"],\n    read: "' + "x" * 50 + '",\n  },\n};\n',
         good_shell, good_sec, 4),
        ("a shell that never mounts it is caught", good_howto, "  $('section').innerHTML = sec.html;", good_sec, 5),
    ]
    for label, h, sh, secs, idx in cases:
        res = audit(h, sh, secs)
        ok = bool(res[idx][1]) if idx != 0 else bool(res[0][1])
        print(f"  {'ok  ' if ok else 'FAIL'} fires: {label}")
        fired += not ok
    bad += fired

    print(f"\n{'PASSED' if not bad else '*** FAILED ***'}   {bad} failed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())

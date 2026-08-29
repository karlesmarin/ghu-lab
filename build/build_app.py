#!/usr/bin/env python3
"""build_app.py — build the instrument, then refuse to trust it.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Inlines the kernel, every section and the shell into one self-contained page; runs the Edition
  gate on the result; re-runs every harness.

Supersedes build_hierarchy.py, which built one section as a page of its own.  That was the right
first step and the wrong end state: five computations over one model must share a shell, or the
user carries the model between them by hand and it stops being one instrument.

  python build/build_app.py [--edition]
"""
import argparse
import datetime
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from editiongate import check, report                                    # noqa: E402

VERSION = "0.2.0"

KERNEL = ["meta.mjs", "status.mjs", "model.mjs", "potential.mjs", "canonical.mjs", "screens.mjs",
          "charges.mjs", "multiplets.mjs", "wilson.mjs", "surface.mjs", "resolve.mjs", "card.mjs"]
MODULES = ["selection.mjs", "calculator.mjs", "hierarchy.mjs", "anomalies.mjs", "escape.mjs",
           "samepot.mjs", "screen.mjs", "collider.mjs", "atlas.mjs", "eta.mjs", "fived.mjs",
           "spectrum.mjs", "inverse.mjs", "census.mjs", "sun5d.mjs", "bcclass.mjs",
           "spectrum5d.mjs", "anomaly5d.mjs", "sweep5d.mjs"]
SECTIONS = ["torus_panels.js", "hierarchy_section.js", "inverse_section.js", "census_section.js",
            "atlas_section.js", "samepot_section.js",
            "anomalies_section.js", "escape_section.js", "screen_section.js",
            "collider_section.js", "calculator_section.js", "eta_section.js",
            "selection_section.js", "fived_section.js", "sun5d_section.js",
            "spectrum5d_section.js", "anomaly5d_section.js", "sweep5d_section.js",
            "bcclass_section.js",
            "multiplets_section.js",
            "registry.js"]

IMPORT_LINE = re.compile(r'^\s*import\s+[^;]*?from\s+["\'][^"\']+["\']\s*;?\s*$', re.M)
EXPORT_KW = re.compile(r"^\s*export\s+(?=(?:const|let|var|function|class|async))", re.M)
EXPORT_BLOCK = re.compile(r"^\s*export\s*\{[^}]*\}\s*;?\s*$", re.M)


def strip_modules(src, name):
    out = EXPORT_KW.sub("", EXPORT_BLOCK.sub("", IMPORT_LINE.sub("", src)))
    left = re.search(r"^\s*(?:import|export)\b", out, re.M)
    if left:
        raise SystemExit(f"FATAL: {name} still has module syntax:\n"
                         f"       {out[left.start():left.start() + 90]!r}\n"
                         f"       Teach the inliner this form; do not work around it.")
    return f"/* ---- {name} ---- */\n{out.strip()}\n"


TOP_DECL = re.compile(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", re.M)


def check_collisions(fragments):
    """The inliner concatenates into ONE scope, so two files declaring the same top-level name is a
    SyntaxError in the browser and a puzzle in a harness.  It is a class of bug the build can see
    and nobody else can, so the build refuses it by name and by file."""
    seen, clashes = {}, []
    for name, src in fragments:
        for m in TOP_DECL.finditer(src):
            n = m.group(1)
            if n in seen and seen[n] != name:
                clashes.append((n, seen[n], name))
            seen.setdefault(n, name)
    if clashes:
        lines = "\n".join(f"       {n!r} declared in both {a} and {b}" for n, a, b in clashes)
        raise SystemExit("FATAL: two inlined files declare the same top-level name; they share one "
                         "scope:\n" + lines +
                         "\n       Rename one, or make it local to its module.")


def read(*parts):
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


# The two forms of the header name.  Exported, because build_site.py renders the second one and
# _test_site.py has to be able to normalise one into the other to compare the two builds.
HOME_PLAIN = "GHU Lab"
HOME_LINKED = '<a href="{href}">&larr; GHU Lab</a>'


def build(edition=False, home=None, out_path=None):
    shell = read("src", "shell", "app_shell.html")
    # Every group is a file, and the page carries all of them.  Adding a third is a line here.
    data = {"su7_km25": json.loads(read("data", "su7_km25.json")),
            "su4_ahmn": json.loads(read("data", "su4_ahmn.json")),
            "su3_hy": json.loads(read("data", "su3_hy.json"))}

    frags = ([(f, strip_modules(read("src", "kernel", f), f)) for f in KERNEL]
             + [(f, strip_modules(read("src", "modules", f), f)) for f in MODULES]
             + [(f, strip_modules(read("src", "sections", f), f)) for f in SECTIONS])
    check_collisions(frags)

    engine = (f'const VERSION = "{VERSION}";\n'
              f'const BUILD = "{datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}";\n'
              + "\n".join(src for name, src in frags if name in KERNEL)
              + "\n".join(src for name, src in frags if name in MODULES))
    sections = "\n".join(src for name, src in frags if name in SECTIONS)
    app = read("src", "shell", "app.js")

    if edition and home:
        raise SystemExit("FATAL: an Edition may not carry a link home. It is archived beside a "
                         "paper and must still make sense when the site is gone.")
    page = (shell
            .replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
            .replace("__ENGINE__", engine)
            .replace("__SECTIONS__", sections)
            .replace("__APP__", app)
            .replace("__HOME__", HOME_LINKED.format(href=home) if home else HOME_PLAIN))
    for token in ("__DATA__", "__ENGINE__", "__SECTIONS__", "__APP__", "__HOME__"):
        if token in page:
            raise SystemExit(f"FATAL: {token} survived substitution.")

    if out_path is not None:
        out = pathlib.Path(out_path)
        out.parent.mkdir(parents=True, exist_ok=True)
    else:
        out_dir = ROOT / ("editions" if edition else "app")
        out_dir.mkdir(exist_ok=True)
        out = out_dir / (f"ghu-lab-v{VERSION}.html" if edition else "index.html")
    out.write_text(page, encoding="utf-8", newline="\n")
    # Sections, not files.  `torus_panels.js` is a shared panel and `registry.js` is the list; when
    # the panel was extracted this line started reporting six sections for five, which is the same
    # class of bug as counting unbuilt sections -- a number that drifts when the code is refactored
    # rather than when the thing it measures changes.
    built = sum(1 for s in SECTIONS if s.endswith("_section.js"))
    print(f"built {out}  ({len(page) / 1024:.1f} kB, one file, nothing external, "
          f"{built} section{'s' if built != 1 else ''} live)")
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--edition", action="store_true")
    ap.add_argument("--skip-tests", action="store_true")
    a = ap.parse_args(argv)

    out = build(a.edition)
    print("\nedition gate:")
    v, w = check(out.read_text(encoding="utf-8"))
    if report(str(out), v, w):
        return 1
    if a.skip_tests:
        print("\ntests skipped by request — do not publish from this build.")
        return 0

    print("\nharnesses (the same mathematics, run outside the page):")
    worst = 0
    for cmd in (["node", "_test_kernel.mjs"], ["node", "_test_hierarchy.mjs"],
                ["node", "_test_app.mjs"], ["node", "_test_groups.mjs"], ["node", "_test_wilson.mjs"],
                ["node", "_test_eta.mjs"], ["node", "_test_selection.mjs"],
                ["node", "_test_surface.mjs"], ["node", "_test_escape.mjs"],
                ["node", "_test_samepot.mjs"], ["node", "_test_screen.mjs"],
                ["node", "_test_multiplets.mjs"],
                ["node", "_test_fived.mjs"], ["node", "_test_collider.mjs"],
                ["node", "_test_atlas.mjs"],
                ["node", "_test_inverse.mjs"], ["node", "_test_census.mjs"],
                ["node", "_test_sun5d.mjs"], ["node", "_test_bcclass.mjs"],
                ["node", "_test_spectrum5d.mjs"], ["node", "_test_anomaly5d.mjs"],
                ["node", "_test_sweep5d.mjs"],
                # the golden suite that SHIPS with the artifact: the built page against the
                # Python engine of Part VII.  It runs here too, so the deployed copy can never
                # carry a suite the build has not just seen pass.
                ["node", "tests/run.mjs"],
                [sys.executable, "_test_editiongate.py"]):
        # DECODE AS UTF-8, EXPLICITLY.  `text=True` alone uses the machine's ANSI codepage, and on
        # Windows that is cp1252, which has five UNMAPPED bytes (0x81, 0x8D, 0x8F, 0x90, 0x9D).  A
        # harness that prints a character whose UTF-8 encoding contains one of them -- an omega,
        # say -- killed subprocess's reader thread; `stdout` then came back as None WITH
        # returncode 0.  That is the dangerous shape: the output vanishes and the exit status
        # still looks fine, so the only reason this was ever noticed is that the next line
        # happened to call .strip() on it.  Had the crash landed after the pass/fail check, a RED
        # harness could have been reported green.  It also explains the mojibake this build has
        # been printing since the first day.
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True,
                           encoding="utf-8", errors="replace")
        if r.stdout is None:
            raise SystemExit(f"FATAL: captured no output at all from {' '.join(cmd)}. That is a "
                             f"broken capture, not a passing harness, and this build refuses to "
                             f"call it either.")
        tail = [ln for ln in r.stdout.strip().split("\n") if ln.strip()][-1:] or ["(no output)"]
        print(f"  {cmd[-1]:<24} {tail[0].strip()}")
        worst = max(worst, r.returncode)
        if r.returncode:
            print(r.stdout[-1800:])
    print("\n" + ("BUILD GREEN" if worst == 0 else "*** BUILD RED — do not publish ***"))
    return worst


if __name__ == "__main__":
    sys.exit(main())

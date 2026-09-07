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

# The parent's own stdout is cp1252 on this machine, and the FIRST time a harness went red the
# build died inside `print(r.stdout[-1800:])` on a U+FFFD -- the replacement character its own
# UTF-8 capture had just put there.  A build that crashes while reporting a failure reports
# nothing, which is worse than a build that never checked.  The capture was already fixed; this
# is the other end of the same pipe.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):        # a stdout that cannot be reconfigured is left alone
    pass
sys.path.insert(0, str(HERE))
from editiongate import check, report                                    # noqa: E402

VERSION = "0.2.0"

# `cite.mjs` before `latex.mjs`, and both after `card.mjs`: the inliner concatenates in this
# order into ONE scope, so a file may only use names the files before it have declared.
KERNEL = ["meta.mjs", "status.mjs", "experiment.mjs", "observables.mjs", "sensitivity.mjs", "running.mjs", "model.mjs", "potential.mjs", "canonical.mjs", "screens.mjs",
          "charges.mjs", "multiplets.mjs", "wilson.mjs", "surface.mjs", "resolve.mjs", "card.mjs",
          "cite.mjs", "latex.mjs", "blkt.mjs", "alphabet.mjs", "fibres.mjs", "moves.mjs", "rotations.mjs",
          # rank.mjs before unbroken.mjs: the second calls the first, and one scope means order is the import.
          "rank.mjs", "unbroken.mjs", "tripod.mjs"]
VIEW = ["fibre_panels.js", "tower3d.js", "demo.js", "howto.js", "help.js"]
MODULES = ["selection.mjs", "calculator.mjs", "hierarchy.mjs", "anomalies.mjs", "escape.mjs",
           "samepot.mjs", "screen.mjs", "collider.mjs", "atlas.mjs", "eta.mjs", "fived.mjs",
           "spectrum.mjs", "inverse.mjs", "census.mjs", "sun5d.mjs", "bcclass.mjs",
           "spectrum5d.mjs", "anomaly5d.mjs", "vacuum5d.mjs", "smcell.mjs", "brane.mjs",
           "yukawa.mjs",
           "predict.mjs", "reading.mjs", "sweep5d.mjs", "dossier.mjs", "papers.mjs", "particles.mjs"]
SECTIONS = ["torus_panels.js", "hierarchy_section.js", "inverse_section.js", "census_section.js",
            "atlas_section.js", "samepot_section.js",
            "anomalies_section.js", "escape_section.js", "screen_section.js",
            "collider_section.js", "calculator_section.js", "eta_section.js",
            "selection_section.js", "fived_section.js", "sun5d_section.js",
            "spectrum5d_section.js", "anomaly5d_section.js", "sweep5d_section.js",
            "dossier_section.js", "predict_section.js", "brane_section.js",
            "papers_section.js",
            "bcclass_section.js", "orbifold_section.js", "relations_section.js",
            "cbclass_section.js", "blkt_section.js",
            "census_lit_section.js",
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

    # src/view/ is the view kit: panels a section MOUNTS rather than draws.  It is its own list and
    # its own directory because torus_panels.js proved the shape and then nothing reused it -- it
    # sat among the sections, looking like one, and nineteen sections went on hand-rolling their
    # panels.  A kit the build does not load is not a kit; a kit in the sections directory is a
    # section.  It is inlined with the engine, before any section, so a section can mount it.
    frags = ([(f, strip_modules(read("src", "kernel", f), f)) for f in KERNEL]
             + [(f, strip_modules(read("src", "view", f), f)) for f in VIEW]
             + [(f, strip_modules(read("src", "modules", f), f)) for f in MODULES]
             + [(f, strip_modules(read("src", "sections", f), f)) for f in SECTIONS])
    check_collisions(frags)

    # THE CENSUS IS NOT A GROUP'S DATA.  Every other file in data/ describes one model; this one
    # describes the LITERATURE, so it is a constant of the page rather than a fourth group -- the
    # rail is grouped by model, and a census pretending to be a model would end up in a family.
    census = json.loads(read("data", "census.json"))

    engine = (f'const VERSION = "{VERSION}";\n'
              f'const BUILD = "{datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}";\n'
              f'const CENSUS = {json.dumps(census, separators=(",", ":"), ensure_ascii=False)};\n'
              + "\n".join(src for name, src in frags if name in KERNEL)
              + "\n".join(src for name, src in frags if name in VIEW)
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
    # ...and a section registered `ready: false` is a FILE that is not a live section.  The comment
    # above warned about exactly this number drifting on a refactor; the first `ready: false`
    # section made it drift on a registration instead, so the count now reads the declaration
    # rather than the directory listing.  The shell's own footer says "N of M sections built" from
    # the same field, and the two must not disagree.
    files = [s for s in SECTIONS if s.endswith("_section.js")]
    unbuilt = [s for s in files
               if "ready: false" in (ROOT / "src" / "sections" / s).read_text(encoding="utf-8")]
    built = len(files) - len(unbuilt)
    tail = f", {len(unbuilt)} listed and not built" if unbuilt else ""
    print(f"built {out}  ({len(page) / 1024:.1f} kB, one file, nothing external, "
          f"{built} section{'s' if built != 1 else ''} live{tail})")
    return out


# =================================================================================================
# THE BROWSER TIER, and the decision it settles.
# =================================================================================================
# HANDOFF item 2 asked whether `leaks.mjs`, `layout.mjs` and `extremes.mjs` become build gates.
# They now are, in the only shape that survives contact with a real day's work.
#
# NOT as part of every build.  They need Chromium and about two and a half minutes between them,
# and a build slow enough to skip is a build that gets skipped -- at which point the gate is worse
# than absent, because everyone believes it ran.  The failure mode here was never "it is too slow
# to run"; it was "I forgot", and a slow default build does not fix forgetting.
#
# So: `--browser` runs the three, and a STAMP records the fingerprint of every source they saw.
# A default build compares the stamp against the sources it just inlined, and if they differ it
# says so, names how many files moved, and REFUSES THE WORD GREEN -- it prints BUILD GREEN (browser
# tier STALE) instead.  You can still build fast all day; you cannot end the day believing a green
# build covered the browser.
#
# The stamp is a fingerprint of sources, not a timestamp, so touching a file without changing it
# does not go stale and reverting a change un-stales it.  Deliberately NOT fatal to a build and
# deliberately fatal to the word "green": publishing is where a stale browser tier does damage,
# and wiring `--browser` into the publish path is the next step, not this one.
BROWSER_GATES = [("leaks.mjs", []), ("layout.mjs", ["--quiet"]), ("extremes.mjs", [])]
STAMP = HERE / ".browser_gate.json"


def source_fingerprint():
    """A hash per source file the browser gates could possibly be affected by."""
    import hashlib
    out = {}
    for rel in ([f"src/kernel/{f}" for f in KERNEL] + [f"src/modules/{f}" for f in MODULES]
                + [f"src/sections/{f}" for f in SECTIONS] + [f"src/view/{f}" for f in VIEW]
                + ["src/shell/app.js", "src/shell/app_shell.html",
                   # THE BUILDER ITSELF.  It decides what is inlined and in what order, so a change
                   # to it can change the page the browser gates measured.  Leaving it out was a
                   # hole: editing the build would have kept the tier "clean" over a page it had
                   # never seen.  The cost is that touching this file marks the tier stale, which
                   # is the correct answer and clears in one run.
                   "build/build_app.py"]):
        p = ROOT / rel
        if p.exists():
            out[rel] = hashlib.sha256(p.read_bytes()).hexdigest()[:16]
    return out


def run_browser_tier():
    """Run the three, then stamp what they saw.  Returns the worst exit code."""
    print("\nbrowser tier (Chromium; ~2.5 min):")
    worst = 0
    for name, extra in BROWSER_GATES:
        r = subprocess.run(["node", str(HERE / name), *extra], cwd=ROOT,
                           capture_output=True, encoding="utf-8", errors="replace")
        text = (r.stdout or "").strip()
        tail = [ln for ln in text.split("\n") if ln.strip()][-1:] or ["(no output)"]
        print(f"  {name:<16} {'PASSED' if r.returncode == 0 else '*** FAILED ***':<16} "
              f"{tail[0].strip()[:90]}")
        if r.returncode:
            print((r.stdout or "")[-1200:])
            print((r.stderr or "")[-400:])
        worst = max(worst, r.returncode)
    if worst == 0:
        STAMP.write_text(json.dumps({"when": datetime.datetime.now().isoformat(timespec="seconds"),
                                     "sources": source_fingerprint()}, indent=1), encoding="utf-8")
        print(f"  stamped {STAMP.name}")
    else:
        print("  NOT stamped: a red tier does not certify anything")
    return worst


def browser_staleness():
    """(stale?, message).  A missing stamp is stale -- absence of evidence is not evidence."""
    if not STAMP.exists():
        return True, "never run (no stamp)"
    try:
        old = json.loads(STAMP.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return True, "stamp unreadable"
    new = source_fingerprint()
    moved = sorted(set(old.get("sources", {}).items()) ^ set(new.items()))
    names = sorted({k for k, _ in moved})
    if not names:
        return False, f"clean, last run {old.get('when', '?')}"
    return True, (f"{len(names)} source file{'s' if len(names) != 1 else ''} changed since "
                  f"{old.get('when', '?')}: " + ", ".join(n.split('/')[-1] for n in names[:6])
                  + (" ..." if len(names) > 6 else ""))


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--edition", action="store_true")
    ap.add_argument("--skip-tests", action="store_true")
    ap.add_argument("--browser", action="store_true",
                    help="also run leaks.mjs, layout.mjs and extremes.mjs, and stamp them")
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
                ["node", "_test_vacuum5d.mjs"], ["node", "_test_smcell.mjs"],
                ["node", "_test_brane.mjs"],
                ["node", "_test_running.mjs"], ["node", "_test_predict.mjs"], ["node", "_test_yukawa.mjs"],
                ["node", "_test_reading.mjs"],
                ["node", "_test_sweep5d.mjs"], ["node", "_test_papers.mjs"],
                ["node", "_test_latex.mjs"], ["node", "_test_blkt.mjs"], ["node", "_test_census_lit.mjs"],
                ["node", "_test_dossier.mjs"], ["node", "_test_rank.mjs"], ["node", "_test_observables.mjs"], ["node", "_test_particles.mjs"], ["node", "_test_sensitivity.mjs"],
                # the golden suite that SHIPS with the artifact: the built page against the
                # Python engine of Part VII.  It runs here too, so the deployed copy can never
                # carry a suite the build has not just seen pass.
                ["node", "tests/run.mjs"],
                [sys.executable, "_test_editiongate.py"],
                [sys.executable, "_test_help.py"], [sys.executable, "_test_howto.py"],
                # the gate on the gate: the browser tier's staleness detector, checked for FIRING
                # and not only for absolving.  Cheap, no Chromium, so it runs every build.
                [sys.executable, "_test_browsergate.py"]):
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

    if a.browser:
        worst = max(worst, run_browser_tier())
    stale, why = browser_staleness()

    if worst:
        print("\n*** BUILD RED — do not publish ***")
    elif stale:
        print(f"\nbrowser tier: STALE — {why}")
        print("BUILD GREEN (browser tier STALE — run: python build/build_app.py --browser)")
    else:
        print(f"\nbrowser tier: {why}")
        print("BUILD GREEN")
    return worst


if __name__ == "__main__":
    sys.exit(main())

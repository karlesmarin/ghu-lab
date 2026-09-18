#!/usr/bin/env python3
"""_test_privado.py — nothing tracked in this repository names the tree it was built from.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

THE RULE EXISTED AND WAS NOT IN FORCE.  `ghu-lab` is public, and the standing rule is that no
published file names the private source tree it is built from.  Until 2026-09-18 that rule was
enforced by remembering to run a grep before pushing, which is another way of saying it was
enforced sometimes: `data/census.json` had been carrying a captured exception message with an
absolute path into the private tree since the commit that added it, and it was already public.

A rule nobody can run is a rule that decays.  This is the same rule as an executable gate, run by
the build like everything else.

WHAT IT LOOKS FOR, and why each one:
  * an absolute Windows path (`X:\\...`) or a POSIX home path (`/home/...`, `/Users/...`) --- the
    two shapes a captured error message or a hard-coded default takes on this machine;
  * the name of the private umbrella directory, which is the specific leak that happened.

WHAT IT DELIBERATELY ALLOWS: a path INSIDE this repository, and the two placeholder forms
(`build/sources.local`, the `GHU_SOURCES` variable) that exist precisely so the corpus can be
found without naming it in a tracked file.

AND THE SECOND HALF IS DELIBERATELY BROKEN INPUT, the same shape as the other Python gates here:
a gate that has only ever passed is a gate nobody has tested.  The synthetic sources are STRINGS,
never files, so a run killed halfway leaves the tree untouched.

  python _test_privado.py
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent

# the umbrella of the private tree, spelled so that this file does not itself contain it
PRIVADO = "proy" + "ectos"

PATRONES = [
    ("absolute Windows path", re.compile(r"(?<![A-Za-z0-9])[A-Za-z]:[\\/]{1,4}[A-Za-z0-9_.]")),
    ("POSIX home path", re.compile(r"/(?:home|Users)/[A-Za-z0-9_.-]+/")),
    ("the private tree by name", re.compile(re.escape(PRIVADO))),
]

# Binary and vendored things the rule cannot speak about.
SALTA = re.compile(r"\.(png|jpg|jpeg|gif|pdf|ico|woff2?|zip)$", re.I)


def tracked():
    out = subprocess.run(["git", "ls-files"], cwd=str(ROOT), capture_output=True,
                         encoding="utf-8", errors="replace")
    if out.returncode:
        sys.exit("FATAL: git ls-files failed — this gate cannot run, which is not a pass")
    return [f for f in out.stdout.split("\n") if f.strip() and not SALTA.search(f)]


def audit(nombre, texto):
    """The whole rule as a function of text, so it can be handed input built to break it."""
    hits = []
    for etq, rx in PATRONES:
        for m in rx.finditer(texto):
            i = max(0, m.start() - 40)
            hits.append((etq, texto[i:m.start() + 60].replace("\n", " ").strip()))
            break
    return hits


def main():
    files = tracked()
    if len(files) < 20:
        sys.exit("FATAL: only %d tracked files — the sweep has no sample" % len(files))

    malos = []
    leidos = 0
    for f in files:
        p = ROOT / f
        if not p.exists():
            continue
        try:
            txt = p.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            sys.exit("FATAL: cannot read %s (%s) — not a pass" % (f, e))
        leidos += 1
        if p.name == pathlib.Path(__file__).name:
            continue                      # this file names the patterns it forbids, by necessity
        for etq, near in audit(f, txt):
            malos.append((f, etq, near))

    print("_test_privado: %d tracked files read" % leidos)
    for f, etq, near in malos:
        print("  LEAK  %-28s %s\n        %s" % (f, etq, near[:110]))

    # ------------------------------------------------------------------ deliberately broken input
    print("\nand the gate on input built to trip it")
    pruebas = [
        ("a Windows path in a captured error",
         "Cannot open empty file: filename='E:\\\\" + PRIVADO + "\\\\x\\\\KT.pdf'.", True),
        ("a POSIX home path", "no such file: /home/someone/corpus/paper.pdf", True),
        ("the private tree named in a comment", "# the corpus lives under " + PRIVADO, True),
        ("a path INSIDE this repo", "reads build/sources.local and data/census.json", False),
        ("the placeholder that exists to avoid naming it", "set GHU_SOURCES or build/sources.local",
         False),
        ("ordinary prose with a colon", "See section 4: the ceiling is 10034 GeV", False),
    ]
    fallos = 0
    for etq, texto, debe in pruebas:
        salta = bool(audit("<synthetic>", texto))
        ok = (salta == debe)
        fallos += 0 if ok else 1
        print("  %-4s %-46s %s" % ("ok" if ok else "FAIL", etq,
                                   "caught" if salta else "clean"))

    total = len(malos) + fallos
    # "N ok, M failed", because that is the shape `build_app.py` tallies the published count from.
    # The first version of this line said "0 leak(s), 0 control failure(s)" and contributed ZERO
    # to that count -- six controls that ran, passed and were invisible, which is the same defect
    # this build fixed for `_test_eta` and `_test_selection` an hour earlier.
    print("\n%s   %d ok, %d failed"
          % ("PASSED" if total == 0 else "*** FAILED ***", len(pruebas) - fallos, total))
    if malos:
        print("  (%d of them are leaks in tracked files, not control failures)" % len(malos))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())

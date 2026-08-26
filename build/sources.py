#!/usr/bin/env python3
"""sources.py — where the papers' scripts and archived runs live, in ONE place.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

The data files of this repository are EXTRACTED, never typed: `make_data.py` reads the Part VII
Python engine, `make_reference.py` reads it again to produce the golden numbers, `make_series.py`
reads the staged Zenodo metadata.  All of that lives in the authoring tree of the papers, which is
not part of this repository and sits at a different place on every machine.

So the path is a SETTING and not a literal, for two reasons.  A source tree hard-coded into six
files cannot be run by anyone else — which is the first thing a reader trying to reproduce a
number discovers.  And an absolute path names the directory layout of a working tree that is not
published; a public repository should not disclose one.

    set GHU_SOURCES=...\\research\\smeft_formalization      (Windows)
    export GHU_SOURCES=.../research/smeft_formalization     (POSIX)

or, for a working copy, write that one line into `build/sources.local` — which is ignored by git
and therefore never travels.  `provenance()` turns any path under the root into the repo-relative
form the data files record, so the JSON says WHICH script produced a number without saying where
that script happens to sit on this machine.
"""
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
_LOCAL = HERE / "sources.local"


def root(what="the papers' scripts and archived runs"):
    """The directory holding `part_vi/`, `part_vii/`, `release_*/`. Refuses to guess."""
    p = os.environ.get("GHU_SOURCES")
    if not p and _LOCAL.exists():
        p = _LOCAL.read_text(encoding="utf-8").strip().splitlines()[0].strip()
    if not p:
        sys.exit(f"FATAL: this build reads {what} and does not know where they are.\n"
                 f"       Set GHU_SOURCES, or put the path in {_LOCAL}.\n"
                 f"       It must be the directory that contains part_vi/, part_vii/ and the\n"
                 f"       release_* folders of the series. Nothing here is typed by hand, so\n"
                 f"       without it there is nothing to read and the build stops rather than\n"
                 f"       inventing a number.")
    q = pathlib.Path(p)
    if not q.exists():
        sys.exit(f"FATAL: GHU_SOURCES points at {q}, which is not there.")
    return q


def provenance(path):
    """A path under the root, as the data files should record it: repo-relative, no machine."""
    p = pathlib.Path(path).resolve()
    try:
        return "research/smeft_formalization/" + p.relative_to(root().resolve()).as_posix()
    except ValueError:
        return p.name

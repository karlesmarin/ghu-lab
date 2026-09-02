#!/usr/bin/env python3
"""_test_help.py — the inline help, held to the ways it can fail in silence.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

`helpMark` returns "" for a key it does not know.  That is the right behaviour -- a mark that opens
onto an empty bubble teaches a reader that the marks are not worth pressing -- and its cost is that
EVERY failure of this feature is silent.  A misspelt key does not throw; it removes the mark.  A
mark written into an ordinary string instead of a template literal does not throw either; it prints
`${helpMark("degree")}` to the reader.  Neither shows up in a build, in a render, or in a console.
So these checks are not unit tests of a function, they are the only way any of it is observable.

  1  every key a section asks for has an entry            -- a typo silently deletes a mark
  2  every entry is reachable from some mark              -- an explanation nobody can open
  3  every `${helpMark(...)}` sits inside a template      -- otherwise it ships as visible text
  4  no duplicate keys                                    -- the later one silently wins
  5  no entry so short it says nothing

Check 2 is house-keeping rather than correctness: an entry can legitimately be written before its
mark.  It fails anyway, on purpose, because "write it now, point at it later" is how a glossary
rots, and the fix is one line either way -- a mark, or a deletion.

AND THE SECOND HALF IS DELIBERATELY BROKEN INPUT, the same shape as _test_editiongate.py: a gate
that has only ever passed is a gate nobody has tested.  Every check is fed a source built to trip
it.  The synthetic sources are STRINGS, never files -- a gate that mutates the tree to test itself
leaves the tree perturbed the first time it is killed halfway, which this house has already paid
for once.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent

ENTRY_RE = re.compile(r'^  "?([a-z0-9][a-z0-9-]*)"?: \{$', re.M)
BLOCK_RE = re.compile(r'^  "?([a-z0-9][a-z0-9-]*)"?: \{\n(.*?)\n  \},$', re.M | re.S)


def audit(glossary, sources):
    """The whole gate, as a function of text: the glossary and {name: section source}.

    Returns a list of (check name, complaint) with an empty complaint meaning it passed.  Written
    over strings rather than over the tree so it can be handed input built to break it.
    """
    keys = ENTRY_RE.findall(glossary)
    defined = set(keys)
    dupes = sorted({k for k in keys if keys.count(k) > 1})

    thin = []
    for m in BLOCK_RE.finditer(glossary):
        block = m.group(2)
        term = re.search(r'term: "(.*?)",', block, re.S)
        text = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', block))
        if not term or len(text) < 120:
            thin.append(m.group(1))

    used, outside = {}, []
    for name, src in sources.items():
        for k in re.findall(r'helpMark\("([^"]+)"\)', src):
            used.setdefault(k, []).append(name)
        i = 0
        while True:
            i = src.find("${helpMark(", i)
            if i < 0:
                break
            # an odd number of backticks before it means we are inside a template literal
            if src.count("`", 0, i) % 2 == 0:
                outside.append(name + ":" + str(src.count("\n", 0, i) + 1))
            i += 5

    missing = sorted(k for k in used if k not in defined)
    unused = sorted(defined - set(used))
    return [
        ("no duplicate keys", "" if not dupes else "duplicated: " + ", ".join(dupes)),
        ("every entry has a term and a real body", "" if not thin else "thin: " + ", ".join(sorted(thin))),
        ("every key used has an entry", "" if not missing else "; ".join(
            k + " (" + ", ".join(used[k]) + ")" for k in missing)),
        ("every entry is reachable from a mark", "" if not unused else "unreached: " + ", ".join(unused)),
        ("every mark sits in a template literal", "" if not outside else
         "would ship as text at " + ", ".join(outside)),
    ]


# ------------------------------------------------------------------ the tree as it stands
glossary = (ROOT / "src" / "view" / "help.js").read_text(encoding="utf-8")
sources = {f.stem: f.read_text(encoding="utf-8")
           for f in sorted((ROOT / "src" / "sections").glob("*.js"))}
real = audit(glossary, sources)

marks = sum(len(re.findall(r'helpMark\("', s)) for s in sources.values())
print("INLINE HELP — the failures that would otherwise be silent\n")
print("  " + str(len(ENTRY_RE.findall(glossary))) + " entries, " + str(marks)
      + " marks across "
      + str(len([s for s in sources.values() if "helpMark(" in s])) + " sections\n")
FAIL = [(n, w) for n, w in real if w]
for n, w in real:
    print(("  FAIL " + n + "  — " + w) if w else ("  ok   " + n))

# ------------------------------------------------------------------ and can it fail?
GLOSS_OK = '''const HELP_TERMS = {
  degree: {
    term: "the degree",
    body: "A body long enough to be a real sentence and then some, because a check that only asks "
      + "for a non-empty string would pass on the word yes.",
  },
};'''
GLOSS_DUPE = GLOSS_OK.replace("};", '''  degree: {
    term: "the degree again",
    body: "A second entry under one key: the later one silently wins and the first is unreachable "
      + "without anything anywhere saying so.",
  },
};''')
GLOSS_THIN = GLOSS_OK.replace(
    'body: "A body long enough to be a real sentence and then some, because a check that only asks "\n'
    '      + "for a non-empty string would pass on the word yes.",', 'body: "yes.",')
SRC_OK = 'html: `<h2>Whatever${helpMark("degree")}</h2>`'
SRC_TYPO = 'html: `<h2>Whatever${helpMark("degre")}</h2>`'
SRC_OUTSIDE = 'html: `<h2>Whatever</h2>`; const stray = \'${helpMark("degree")}\';'
SRC_NONE = 'html: `<h2>Whatever</h2>`'

CASES = [
    ("a duplicate key", GLOSS_DUPE, SRC_OK, "no duplicate keys"),
    ("an entry that says nothing", GLOSS_THIN, SRC_OK, "every entry has a term and a real body"),
    ("a misspelt key", GLOSS_OK, SRC_TYPO, "every key used has an entry"),
    ("an entry no mark reaches", GLOSS_OK, SRC_NONE, "every entry is reachable from a mark"),
    ("a mark outside a template", GLOSS_OK, SRC_OUTSIDE, "every mark sits in a template literal"),
]

print("\n  and the same checks on input built to break them:\n")
control = audit(GLOSS_OK, {"synthetic": SRC_OK})
if [w for _, w in control if w]:
    FAIL.append(("the clean synthetic case passes", str(control)))
    print("  FAIL the clean synthetic case passes  — " + str(control))
else:
    print("  ok   the clean synthetic case passes")

for name, g, s, expect in CASES:
    got = {n: w for n, w in audit(g, {"synthetic": s})}
    if got.get(expect):
        print("  ok   " + name + " is caught by “" + expect + "”")
    else:
        FAIL.append((name, "not caught by " + expect))
        print("  FAIL " + name + "  — not caught by “" + expect + "”")

print("\n" + ("PASSED" if not FAIL else "*** FAILED ***") + "   " + str(len(FAIL)) + " failed")
sys.exit(0 if not FAIL else 1)

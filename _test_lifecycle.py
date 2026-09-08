#!/usr/bin/env python3
"""_test_lifecycle.py — a section may not own a timer the shell cannot cancel.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

WHY THIS EXISTS.  `build/lifecycle.mjs` is the real gate: it starts a long computation in each
panel, walks away mid-flight, and requires that nothing throws, nothing is still pending, and the
panel still works when the reader comes back.  It costs a headless Chromium and about a minute, so
it lives in the `--browser` tier and runs when someone asks for it.

This is the cheap half, and it runs on EVERY build.  The rule it holds is one line: nothing under
`src/sections/` may call `setTimeout` or `setInterval` directly.  Deferred work goes through
`ctx.later`, which the shell owns and cancels when the section is left.

The two are not redundant.  `lifecycle.mjs` measures behaviour and can only measure the panels
somebody wrote a case for -- nine of twenty-eight.  This one reads every section file there is, so
the twentieth panel to grow a sweep cannot quietly reintroduce the defect in a file no case covers.
A behavioural gate says the panels I tested are clean; a structural one says the pattern is gone.

WHAT IT ALSO CHECKS.  `requestAnimationFrame` is allowed but flagged if it WRAPS a `ctx.later`:
that combination was a live hole rather than a style question.  `ctx.later` claims the mount that
is current at the moment it is CALLED, so a frame callback that fires after the reader has left
hands the work to the next section's mount, which owns it, which runs it.  The dossier did exactly
that, and the abandoned-work gate caught it as a panel that abandoned nothing.

  python _test_lifecycle.py
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = pathlib.Path(__file__).resolve().parent
SECTIONS = ROOT / "src" / "sections"

ok = bad = 0


def chk(name, cond, detail=""):
    global ok, bad
    print(("  ok   " if cond else "  FAIL ") + name + (("  — " + detail) if detail and not cond else ""))
    ok, bad = ok + bool(cond), bad + (not cond)


# A comment may name the thing it is explaining -- half of these files carry the story of the bug
# in prose above the fix -- so the search is over CODE, with block and line comments removed.
BLOCK = re.compile(r"/\*.*?\*/", re.S)
LINE = re.compile(r"(?<![:'\"])//[^\n]*")
TIMER = re.compile(r"\b(?:window\.)?(setTimeout|setInterval)\s*\(")
RAF_LATER = re.compile(r"requestAnimationFrame\s*\([^)]*ctx\.later", re.S)


def code_of(p):
    return LINE.sub("", BLOCK.sub("", p.read_text(encoding="utf-8")))


files = sorted(SECTIONS.glob("*.js"))

print("THE TIMERS OF A SECTION BELONG TO THE SHELL")
# A harness that finds no files reports green about nothing.
chk(f"there are section files to read ({len(files)} of them)", len(files) >= 20,
    f"only {len(files)} found under {SECTIONS}")

offenders = []
for p in files:
    for m in TIMER.finditer(code_of(p)):
        offenders.append(f"{p.name}: {m.group(1)}")
chk("no section schedules its own timer — every deferral goes through ctx.later",
    not offenders, "; ".join(offenders[:6]))

wrapped = [p.name for p in files if RAF_LATER.search(code_of(p))]
chk("no ctx.later is called from inside a requestAnimationFrame — the mount is claimed at the "
    "click, not a frame later", not wrapped, "; ".join(wrapped))

# And the other end of the contract: the shell must actually provide what the sections now use, and
# must actually cancel on the way out.  A rule pointing at a function nobody wrote is not a rule.
shell = (ROOT / "src" / "shell" / "app.js").read_text(encoding="utf-8")
chk("the shell provides ctx.later", re.search(r"\blater\s*\(fn,\s*ms\)", shell) is not None)
chk("the shell cancels pending jobs when a section is left",
    "jobsStop();" in shell and "clearTimeout(t)" in shell)
chk("the shell calls dispose() on the section being left", "mountedSec.dispose()" in shell)

# The three panels that keep a flag gating their own button must give it back, or cancelling their
# work bricks them -- which is the bug the whole change is about.
for name, flag in (("blkt_section.js", "BLK_S.running"),
                   ("dossier_section.js", "DOSS_S.running"),
                   ("inverse_section.js", "INV_S.busy")):
    src = (SECTIONS / name).read_text(encoding="utf-8")
    has = re.search(r"dispose\s*\(\s*\)\s*\{", src) is not None and flag in src
    chk(f"{name.split('_')[0]} clears {flag} in dispose()", has)

print(f"\n{ok} ok, {bad} failed")
sys.exit(1 if bad else 0)

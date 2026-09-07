#!/usr/bin/env python3
"""_test_browsergate.py — does the browser tier's staleness detector actually fire?

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

WHY THIS EXISTS.  `build/build_app.py` gained a rule on 2026-09-07: `leaks.mjs`, `layout.mjs` and
`extremes.mjs` run under `--browser`, which stamps a sha256 fingerprint of every source they saw,
and a later build that finds the sources moved refuses the word GREEN.  That rule is only worth
anything if the detector FIRES, and a detector nobody has watched fail is a decoration.  So:

  1  as it stands, clean          -- the half that ABSOLVES, which is the one nobody ever tests
  2  a CHANGED source is stale, and the changed file is NAMED
  3  a source the tier NEVER SAW is stale too -- adding a file must not be invisible
  4  an unreadable stamp is stale, not green
  5  a missing stamp is stale     -- absence of evidence is not evidence

THE STAMP IS NEVER LEFT PERTURBED.  Every case doctors it IN MEMORY and the restore is in a
`finally`, because a mutating gate that dies half way leaves the repo in a state its own next run
will misread.  The last line re-reads the real stamp and says whether it came back clean, so a
killed run is visible rather than silent.

  python _test_browsergate.py
"""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "build"))
import build_app as B                                                  # noqa: E402

ok = bad = 0


def chk(name, cond):
    global ok, bad
    print(("  ok   " if cond else "  FAIL ") + name)
    ok, bad = ok + bool(cond), bad + (not cond)


print("THE BROWSER-TIER STAMP")
if not B.STAMP.exists():
    print("  ..   no stamp on disk: the tier has never been run here, which is itself the")
    print("  ..   answer case 5 checks.  Run `python build/build_app.py --browser` first.")
    chk("a missing stamp is stale -- absence of evidence is not evidence",
        B.browser_staleness()[0])
    print(f"\n{'PASSED' if not bad else '*** FAILED ***'}   {bad} failed")
    sys.exit(1 if bad else 0)

real = B.STAMP.read_text(encoding="utf-8")
stale, why = B.browser_staleness()
chk(f"as it stands the tier reads CLEAN: {why}", not stale)

try:
    d = json.loads(real)
    # any source will do; the newest one is the interesting one because it is the one a stale
    # stamp would most plausibly predate
    victim = sorted(d["sources"])[0]

    d["sources"][victim] = "0" * 16
    B.STAMP.write_text(json.dumps(d), encoding="utf-8")
    stale, why = B.browser_staleness()
    chk(f"a CHANGED source makes it stale, and names it: {why}",
        stale and victim.split("/")[-1] in why)

    d2 = json.loads(real)
    d2["sources"].pop(victim)
    B.STAMP.write_text(json.dumps(d2), encoding="utf-8")
    stale, why = B.browser_staleness()
    chk(f"a source the tier NEVER SAW is stale too: {why}",
        stale and victim.split("/")[-1] in why)

    B.STAMP.write_text("not json", encoding="utf-8")
    chk("an unreadable stamp is stale, not green", B.browser_staleness()[0])

    B.STAMP.unlink()
    chk("a missing stamp is stale -- absence of evidence is not evidence",
        B.browser_staleness()[0])
finally:
    B.STAMP.write_text(real, encoding="utf-8")
    restored = not B.browser_staleness()[0]
    print(f"  {'ok  ' if restored else 'FAIL'} the stamp is restored and reads clean again")
    bad += not restored

print(f"\n{'PASSED' if not bad else '*** FAILED ***'}   {bad} failed")
sys.exit(1 if bad else 0)

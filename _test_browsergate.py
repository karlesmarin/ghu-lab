#!/usr/bin/env python3
"""_test_browsergate.py — does the browser tier's staleness detector actually fire?

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

WHY THIS EXISTS.  `build/build_app.py` gained a rule on 2026-09-07: `leaks.mjs`, `layout.mjs` and
`extremes.mjs` run under `--browser`, which stamps a sha256 fingerprint of every source they saw,
and a later build that finds the sources moved refuses the word GREEN.  That rule is only worth
anything if the detector FIRES, and a detector nobody has watched fail is a decoration.  So:

  1  a stamp that MATCHES the sources reads clean -- the half that ABSOLVES, which is the one
     nobody ever tests, and which is checked on a SYNTHETIC stamp for the reason below
  2  a CHANGED source is stale, and the changed file is NAMED
  3  a source the tier NEVER SAW is stale too -- adding a file must not be invisible
  4  an unreadable stamp is stale, not green
  5  a missing stamp is stale     -- absence of evidence is not evidence

THE MISTAKE THE FIRST VERSION MADE, kept here because it is the whole design lesson.  Check 1 used
to assert that the tier is clean RIGHT NOW.  That is a statement about the working tree, not about
the detector, and this harness runs at the START of a build -- before `--browser` has had a chance
to refresh anything.  So the first build after any source edit went **BUILD RED**, on a repo whose
only sin was having been edited.  A gate that reds the normal case trains people to ignore it, and
a false red is worse than no gate at all.

The fix is to test the detector against a stamp this harness CONSTRUCTS: write a fingerprint that
matches the sources exactly, and the detector must absolve it.  That checks the same half without
depending on whether anyone has run the browser tier lately.  The real stamp's state is REPORTED,
never asserted -- the build itself is what says "STALE", and it says it in the right place.

THE STAMP IS NEVER LEFT PERTURBED.  Every case doctors it IN MEMORY and the restore is in a
`finally`, because a mutating gate that dies half way leaves the repo in a state its own next run
will misread.  The restore is verified BYTE FOR BYTE against what was read -- not by asking whether
it now reads clean, which was the same confusion in the same file.

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
# REPORTED, NOT ASSERTED.  Whether the tier happens to be fresh is the build's business, and the
# build says so in its own last line.  This harness is about the detector.
stale, why = B.browser_staleness()
print(f"  ..   the real stamp right now: {'STALE' if stale else 'clean'} — {why}")

try:
    # THE SYNTHETIC STAMP.  Built to match the sources exactly, so case 1 tests the absolving half
    # of the detector rather than the state of the working tree.
    fresh = {"when": "synthetic (this harness)", "sources": B.source_fingerprint()}
    B.STAMP.write_text(json.dumps(fresh), encoding="utf-8")
    ok_clean, why = B.browser_staleness()
    chk(f"a stamp that MATCHES the sources reads clean: {why}", not ok_clean)

    d = json.loads(json.dumps(fresh))
    victim = sorted(d["sources"])[0]

    d["sources"][victim] = "0" * 16
    B.STAMP.write_text(json.dumps(d), encoding="utf-8")
    stale, why = B.browser_staleness()
    chk(f"a CHANGED source makes it stale, and names it: {why}",
        stale and victim.split("/")[-1] in why)

    d2 = json.loads(json.dumps(fresh))
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
    # BYTE FOR BYTE against what was read.  Asking whether it "reads clean" was the same confusion
    # this file's header describes: a legitimately stale stamp is correctly restored and correctly
    # still stale, and calling that a failure is how the first version turned a normal build red.
    B.STAMP.write_text(real, encoding="utf-8")
    restored = B.STAMP.read_text(encoding="utf-8") == real
    print(f"  {'ok  ' if restored else 'FAIL'} the real stamp is restored byte for byte")
    bad += not restored

print(f"\n{'PASSED' if not bad else '*** FAILED ***'}   {bad} failed")
sys.exit(1 if bad else 0)

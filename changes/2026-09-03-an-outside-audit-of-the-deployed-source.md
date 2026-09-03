---
date: 2026-09-03
part: instrument
severity: note
affects_record: no
title: An outside audit read the deployed source, and five of its five findings were real
verify: open the **Model calculator**, change a representation's η and its matter/gauge role, press **🔗 link** and open the address in a fresh tab — the two toggles are now in the URL and come back. Then put `#x=%` in the address bar: the instrument still appears. `node build/drive.mjs` drives both, with a control leg that fails if the reset is not happening.
---

what
: Carles put the public source of `ghu-lab` and `ghu-explorer` in front of an outside reader on
  2026-09-03. Five findings came back and every one of them is real:

  1. **The permalink did not carry η or the matter/gauge role**, although both are buttons in the
     calculator and both go into `model()`. A link therefore reproduced a *different model* from
     the one whose results were on screen when it was copied — silently, under a button that says
     "the whole state, in the address bar". For a tool whose whole use is that a claim in a letter
     becomes something the reader checks in thirty seconds, this is the worst of the five.
  2. **`decodeURIComponent` ran unguarded at startup.** It throws `URIError` on a lone `%`, and it
     ran before `render()`, so `#x=%` left the reader a blank page — the same symptom as the
     dead-permalink bug of 2026-08-26 arriving through a different door.
  3. **The card export fired two downloads in one tick**, which is exactly the pattern the LaTeX
     button had already been fixed for: Chrome raises its multiple-download prompt and, declined or
     auto-blocked, drops the second file. The `.bib` waits 500 ms and the `.txt` did not.
  4. **The "what this tool cannot tell you" block had gone stale.** It still said "Two models, not
     a framework" and "only the result card as JSON", both true when written and neither true since
     the SU(N) builder and the LaTeX export arrived.
  5. **The site footer said the code is MIT** while both `LICENSE` files say Apache 2.0.

why
: The audit also says the tool is better tested than usual for its size, and it is: 1 557 checks,
  a real-mouse harness, and a build that refuses to publish red. That is precisely why these
  five matter. Four of them are in the **shell** and the fifth is in **prose**, and neither is
  where the checks were. Every harness in this repository asks whether a number is right; nothing
  asked whether the link that carries the number carries all of it.

  Fixing the permalink turned up a second layer under the reported one. A link carries only what
  differs from the default — the rule the seed and the brane already follow — and **the default is
  not +1**: the anchor content of a group carries η = −1 and role = gauge on some slots, and this
  group does. Encoding against +1 and resetting to +1 would have lost the anchor's own values from
  an untouched model, which is the same bug one level down. Both sides now call one function,
  `anchorEtaRole`, so they cannot disagree about what an omitted marker means.

  And the marker itself changed once: `.e+` becomes `.e%2B` in the address bar, which is the same
  lesson as the pipe that became a comma in the BLKT permalink. It is `.em` and `.ep` now — a
  letter naming the value, nothing a mail client can maul.

so
: `drive.mjs` gained the checks that were missing rather than the ones that were easy: a **round
  trip through the real buttons**, with a control leg that strips the markers and requires the
  anchor's own values back — so the round trip cannot pass by never resetting anything — and five
  deliberately broken hashes (`x=%`, `x=%E0%A4%A`, `su4_ahmn=%ZZ`, `===`, `%`) under one rule:
  **no string a reader can put in the address bar may stop the interface appearing.**
  113 checks, all green, with the console still clean.

  `_test_app.mjs` gained the source-level half — the guard, the two markers, the shared default,
  the staggered download — and its list of the tool's stated limits now asserts that the stale
  sentences are **gone**, not merely that some sentences are present. A limits block that has
  fallen behind the tool is worse than none: a reader believes it.

  One more thing came out of the same file, and it was the harness looking at itself. The check
  that every id a section reaches for is an id that section creates was reading `render` and `init`
  only — and most sections keep their DOM in helpers, so a section written that way was checked
  against nothing and passed. It reads every function on the section now.

  The licence line says Apache 2.0. The scale question the audit raises last is not a bug and is
  not new: our α disagrees with the published α by 1.03× to 2.08× and not by a constant, every TeV
  and GeV inherits that, and the page has said so in its own first paragraph since the day it
  opened.

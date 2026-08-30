---
date: 2026-08-30
part: instrument
severity: correction
affects_record: yes
title: What the page says in their absence — a page number, a framing, a button that was in the wrong places
verify: open **Brane kinetic terms**. Step 4 now cites p. 21 for the authors' sentence, reports what eq. (5.19) gives at each of their two minima, and says that which minimum belongs with which c is an open question put to the authors. Press **⇩ LaTeX**: the dial's own model comes out. Then switch to **Boundary conditions** or **The literature** — the button is not there, because on those it would write a file about a different model.
---

what
: Four changes, and the first is the one that matters.

  **The page no longer asserts, in the authors' absence, more than we are willing to say to their
  faces.** On 30 August a letter went to Akamatsu, Hirose, Maru and Nago about arXiv:2603.05857,
  and it says that which of their two published minima belongs with which value of `c` is something
  we could not settle from their text. This page had been saying something firmer — that the
  1.4 TeV was their equation with α₂ *dropped*. Both numbers are still here, computed and not
  quoted; what has gone is the diagnosis. The row measures their equation, and the open question is
  named as open.

  **A page number that was wrong.** The sentence quoted is on **p. 21**, not p. 22. Our own two
  scripts disagreed with each other about where eq. (5.19) sits, and both misplaced the sentence;
  measuring by the printed page number settled it. A page reference is the one part of a quotation
  a reader can check without any work.

  **The ⇩ LaTeX button appears only where it can export what is on screen.** A section that
  declares `holds()` is showing its own model, so unless it also implements `texExport` the button
  would produce a correct file about a *different* one. On five sections it now simply is not
  there, and pressing it there anyway writes nothing.

  **And the demonstration exports its own dial**, which is the section where a reader would most
  want it: the model, the free tower and the roots with a brane term, with the potential marked
  `unknown` and the reason given — with a brane term it is an integral over those roots, not a sum
  of cosines this export could carry.

why
: A permalink also had to survive being sent. The state separator was `|`, which travels in an
  e-mail as `%7C`; Gmail re-encodes that and wraps the whole address in a `google.com/url`
  redirect with tracking parameters. It resolves correctly and it looks like surveillance. The
  separator is a comma now — every value is a number, so there is no ambiguity — and the pipe is
  still decoded, because links carrying it have already been sent.

so
: Two of these were found by pressing buttons rather than by running assertions, and one was found
  by the assertions being wrong.

  The two-file export was writing both downloads in the same tick, which is how a page asks a
  browser for permission to grab files; the second is now staggered by half a second.

  And a harness lesson worth more than the fix. The driver stubbed
  `HTMLAnchorElement.prototype.click` to capture a download — and the rail's entries are `<a>`
  elements. Every later navigation silently did nothing, so six checks measured whatever section
  the page was already sitting on and reported a defect that was not there. A stub installed for
  one check must be put back before the next; the driver now asserts that it was.

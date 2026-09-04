---
date: 2026-09-04
part: instrument
severity: note
affects_record: no
title: What the page kept after you left a section, and the gate that counts it
verify: open the browser's console, walk the whole rail once, and resize the window on the way. It stays empty. Then open **Simulator**, drag the Kaluza–Klein landscape to turn it, go to any other section and come back, and drag it again — it turns from where you left it, both times.
---

what
: Twenty-four console errors, all of one kind, and none of them belonged to the section that was
  on screen. `init` runs on every mount of a section and `render` on every change of the model, and
  four different places registered a listener on `window` inside one of the two and never removed
  it. Each copy kept a canvas the shell had already replaced with the next section's markup, so a
  later resize redrew a picture that was no longer in the document.

  The one that threw was the simulator's, and it is the clearest statement of the mistake: it
  guarded on the **model**, which survives leaving the section, rather than on the **canvas**, which
  does not. It was also unnecessary — the shell already re-renders every section on resize. The
  other three never said anything at all: the tower control added four listeners per call, the
  surface panels a pair per mount with a `detach` nobody had ever called, and the fibre panels one
  repaint-per-resize per visit. Each is now registered **once for the page**, over a record of what
  is actually on screen.

why
: Because no gate here could have found them. The harnesses check the mathematics; `shoot.mjs`
  photographs a section that renders correctly; `drive.mjs` presses controls that answer; and
  `layout.mjs` and `extremes.mjs` ask what a reader sees. All five ask whether a section is right
  **while it is on screen**. This was about what a section leaves behind when it is not, which has
  no picture and no assertion — only a count.

  So **`build/leaks.mjs`** asks the browser itself, through `DOMDebugger.getEventListeners`, how
  many handlers hang off `window` and `document`, walks the whole rail twice, and fails if the
  second walk added any. It found three sources the console never mentioned.

so
: Before: 4 listeners on load, 41 after one walk, 78 after two — 37 leaked per pass — and 27
  errors. After: 4, then 17, then 17, and none. And the two Kaluza–Klein landscapes, which have
  said *"drag to turn"* since the day they shipped and had never been dragged by any gate, are now
  turned by a real mouse and turned **again** after leaving the section and coming back: the exact
  way rewiring them could have broken the gesture while every other check stayed green.

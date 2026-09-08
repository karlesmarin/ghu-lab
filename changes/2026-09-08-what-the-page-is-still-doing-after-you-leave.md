---
date: 2026-09-08
part: instrument
severity: note
affects_record: no
title: What the page was still doing after you left a section, and the button that stayed dead
verify: open **Brane-localized kinetic terms**, press ▶, and while the coefficient is still walking click any other section on the rail. Come back and press ▶ again — it runs. Before this it did nothing, for the rest of the page's life. The console stays empty throughout, and the same is true of the calculator's seventeen-second sweep and the literature census.
---

what
: A section's listeners were given a lifecycle four days ago. Its **timers** were not, and that is
  the same defect one turn later.

  Every long computation here is sliced so the page keeps answering while it runs — the
  calculator's sweep is seventeen seconds of arithmetic in blocks of ten representations, the BLKT
  demonstration walks eight coefficients at 620 ms apiece, and eight more panels defer their work
  the same way. Each slice was scheduled by a section and written as though that section were
  still on screen. It need not be: picking another panel replaces the whole of `#section`, and the
  pending timer outlives the elements its callback reaches for.

  `document.getElementById("cSweepNote").textContent = …` is then `null.textContent`. Three panels
  threw it — the calculator, the BLKT demonstration and the literature census — and in the
  demonstration the exception landed **above** the line that clears its `running` flag. `_demo`
  opens with `if (BLK_S.running) return;`, so one mistimed click on the rail left the ▶ button
  dead until the page was reloaded.

  A timer now belongs to the **mount** rather than to the closure that asked for it: `ctx.later`
  registers it with the shell, and leaving the section cancels every one and calls the section's
  `dispose`. Ten call sites moved; three panels that keep a flag gating their own button give it
  back there.

  Three smaller things, found on the way. `ctx.load()` wrote η and role only for the multiplets the
  incoming model **names** and left the others carrying the previous model's, invisibly, at zero
  multiplicity — so adding one back through the catalogue's `+` returned it wearing the η of a
  model that was no longer loaded. The link button said `copied` whether or not the clipboard had
  taken it, which is a lie precisely on the readers this page advertises: `file://` is not a secure
  context in every browser, and the Clipboard API refuses there. And the home page said *"One bulk
  model, eleven computations over it"* and *"Seven papers"* — it is three models, twenty-seven
  panels and ten records.

why
: Because a null-check at each of the ten call sites would have silenced the exception and **kept**
  the bug. The work would still run, off screen, against a model the reader has since changed, and
  its result would be cached as though it were about what is now on the page. The exception was the
  symptom; the section owning a timer the shell cannot cancel was the defect.

  And because the counting had the same shape as the sentence. `_test_site.py` already guarded that
  the home page keeps the sentence saying the numbers are not citable; nothing had ever been asked
  whether the page keeps its **arithmetic**. So the counts are no longer written: `build_site.py`
  reads the section registry and `data/series.json`, and a new check fails the build if any page
  states a count those two do not support. `MODEL_FAMILIES` in the registry says which of the six
  families are published models — three — next to where the families are declared, and renaming a
  family now stops the build instead of quietly shrinking the total.

so
: **`build/lifecycle.mjs`** is the gate, and it does the one thing no other tool here does: it
  starts something long and then walks away, which is what a reader does constantly and what every
  other harness is careful not to do. Nine panels, three claims each — nothing throws, no timer
  outlives its section, and the panel still works when you come back. Pointed at the build that was
  live when it was written it goes red on five of the nine and names the defect: three
  `TypeError: Cannot set properties of null (setting 'textContent')`.

  Its first version reported six false failures, and the reason is worth keeping. There are two
  shapes of deferred work here and only one can be walked out of: a single block behind a 20 ms
  deferral holds the main thread for seconds and a rail click cannot interrupt it, so the only
  moment a reader can leave is inside that window. Waiting 130 ms and then asserting the caption is
  empty is asserting that a finished computation should be forgotten. Each case now declares when
  it leaves, and reports **NOT IN FLIGHT** rather than passing if it turns out to have abandoned
  nothing.

  `_test_lifecycle.py` is the cheap half and runs on every build: no file under `src/sections/` may
  call `setTimeout` directly. The behavioural gate covers the nine panels somebody wrote a case
  for; this one reads all thirty section files, so the next panel to grow a sweep cannot
  reintroduce the defect where no case looks. It flags one more thing, which was a live hole rather
  than a style question: `ctx.later` claims the mount current at the moment it is **called**, so a
  `requestAnimationFrame` wrapping it hands the work to the next section's mount, which owns it,
  which runs it. The dossier did exactly that, and the abandoned-work gate caught it as a panel
  that abandoned nothing.

  The build now prints `1 964 checks across 47 harnesses`, which is where README.md's sentence
  comes from rather than from anyone's memory of it.
